import hashlib
import json
from pathlib import Path

from core.experiment_schema import validate_experiment_definition
from core.mfa_encryption import encrypt_secret
from core.models import (
    ContentVersion,
    Course,
    Experiment,
    Level,
    SchemeOfWork,
    StaffMember,
    Subject,
    Topic,
    UserProfile,
)
from core.staffing import ensure_default_roles
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

DEFINITION_PATH = (
    Path(__file__).resolve().parents[3]
    / "packages"
    / "experiment-schemas"
    / "definitions"
    / "filtration.v1.json"
)


class ExperimentDefinitionTests(TestCase):
    def setUp(self):
        cache.clear()
        self.editor = self._staff_client("experiment-editor")
        self.approver = self._staff_client("experiment-approver")
        self.subject = Subject.objects.create(name="Chemistry", code="chemistry")
        self.level = Level.objects.create(stage="Secondary")
        self.course = Course.objects.create(
            subject=self.subject, level=self.level, title="Practical Chemistry"
        )
        self.scheme = SchemeOfWork.objects.create(
            course=self.course, term="Term 1", title="Laboratory Skills"
        )
        self.topic = Topic.objects.create(scheme=self.scheme, title="Separating mixtures", order=1)
        self.definition = json.loads(DEFINITION_PATH.read_text(encoding="utf-8"))

    def _staff_client(self, username):
        user = get_user_model().objects.create_user(
            username=username, password="StrongPassword123!", is_staff=True
        )
        StaffMember.objects.create(
            user=user,
            role=ensure_default_roles()["Super Admin"],
            mfa_secret=encrypt_secret("JBSWY3DPEHPK3PXP"),
            mfa_enrolled_at=timezone.now(),
        )
        client = APIClient()
        client.force_login(user)
        session = client.session
        session["staff_mfa_verified"] = True
        session["staff_mfa_verified_at"] = timezone.now().isoformat()
        session.save()
        return client

    def _create(self, client=None, definition=None):
        return (client or self.editor).post(
            "/api/v1/admin/content/experiments",
            {
                "subject_id": self.subject.id,
                "topic_id": self.topic.id,
                "definition": definition or self.definition,
            },
            format="json",
        )

    def _decide(self, response):
        approval_id = response.json()["approval"]["id"]
        return self.approver.post(
            f"/api/v1/admin/approvals/{approval_id}/decision",
            {"decision": "approve"},
            format="json",
        )

    def _learner_client(self, username):
        user = get_user_model().objects.create_user(
            username=username, password="LearnerPassword123!"
        )
        UserProfile.objects.create(
            user=user,
            account_type=UserProfile.ACCOUNT_TYPE_STUDENT,
            active_mode=UserProfile.MODE_STUDENT,
        )
        client = APIClient()
        client.force_login(user)
        return client

    def test_filtration_definition_validates_and_rejects_bad_references(self):
        self.assertEqual(validate_experiment_definition(self.definition), [])
        invalid = json.loads(json.dumps(self.definition))
        invalid["steps"][0]["ruleId"] = "missing-rule"
        self.assertTrue(validate_experiment_definition(invalid))
        malformed = json.loads(json.dumps(self.definition))
        malformed["steps"][0]["ruleId"] = ["unexpected", "array"]
        malformed["rules"][0]["action"]["apparatus"] = ["unexpected"]
        self.assertTrue(validate_experiment_definition(malformed))

    def test_admin_requires_mfa_and_valid_definition(self):
        anon = APIClient().post(
            "/api/v1/admin/content/experiments",
            {"subject_id": self.subject.id, "definition": self.definition},
            format="json",
        )
        self.assertIn(anon.status_code, (401, 403))
        invalid = json.loads(json.dumps(self.definition))
        invalid["runtimeVersion"] = "unknown"
        response = self._create(definition=invalid)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Experiment.objects.count(), 0)

    def test_draft_creation_is_hashed_and_hidden_from_public_delivery(self):
        response = self._create()
        self.assertEqual(response.status_code, 201)
        version = ContentVersion.objects.get(pk=response.json()["version_id"])
        canonical = json.dumps(
            self.definition,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        self.assertEqual(version.definition_hash, hashlib.sha256(canonical.encode()).hexdigest())
        self.assertEqual(APIClient().get("/api/v1/content/experiments/filtration").status_code, 404)

    def test_review_and_four_eyes_publish_make_immutable_version_public_with_etag(self):
        created = self._create()
        experiment_id = created.json()["experiment_id"]
        version = ContentVersion.objects.get(pk=created.json()["version_id"])
        submitted = self.editor.post(
            "/api/v1/admin/content/review",
            {"action": "submit_review", "experiment_id": experiment_id},
            format="json",
        )
        self.assertEqual(submitted.status_code, 200)

        approval = self.editor.post(
            "/api/v1/admin/content/review",
            {"action": "approve", "experiment_id": experiment_id},
            format="json",
        )
        self.assertEqual(approval.status_code, 202)
        self.assertEqual(self._decide(approval).status_code, 200)

        publish = self.editor.post(
            "/api/v1/admin/content/review",
            {"action": "publish", "experiment_id": experiment_id},
            format="json",
        )
        self.assertEqual(publish.status_code, 202)
        self.assertEqual(self._decide(publish).status_code, 200)
        version.refresh_from_db()
        self.assertEqual(version.status, ContentVersion.STATUS_PUBLISHED)
        response = APIClient().get("/api/v1/content/experiments/filtration")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["definition_hash"], version.definition_hash)
        self.assertEqual(response.json()["runtime_version"], "1.0.0")
        self.assertEqual(
            APIClient()
            .get(
                "/api/v1/content/experiments/filtration",
                HTTP_IF_NONE_MATCH=response["ETag"],
            )
            .status_code,
            304,
        )
        learner = self._learner_client("experiment-learner")
        started = learner.post(
            "/api/v1/student/experiments/filtration/sessions",
            {"runtime_version": "1.0.0"},
            format="json",
        )
        self.assertEqual(started.status_code, 201)
        session_id = started.json()["session_id"]
        resumed = learner.post(
            "/api/v1/student/experiments/filtration/sessions",
            {"runtime_version": "1.0.0", "mode": "free"},
            format="json",
        )
        self.assertEqual(resumed.status_code, 201)
        self.assertTrue(resumed.json()["resumed"])
        self.assertEqual(resumed.json()["session_id"], session_id)
        self.assertEqual(resumed.json()["mode"], "guided")
        self.assertEqual(
            learner.get(
                f"/api/v1/student/experiments/filtration/sessions?session_id={session_id}"
            ).status_code,
            200,
        )
        event_url = f"/api/v1/student/experiment-sessions/{session_id}/events"
        bad_batch = learner.post(
            event_url,
            {"runtime_version": "1.0.0", "events": [{"sequence": 2}]},
            format="json",
        )
        self.assertEqual(bad_batch.status_code, 400)
        good_events = []
        for index, rule in enumerate(self.definition["rules"], start=1):
            good_events.append(
                {
                    "sequence": index,
                    "command": rule["action"],
                    "accepted": True,
                    "stepBefore": index - 1,
                    "stepAfter": index,
                    "scoreAfter": index,
                    "feedback": rule["feedback"],
                }
            )
        forged_events = json.loads(json.dumps(good_events))
        forged_events[0]["scoreAfter"] = 999
        forged = learner.post(
            event_url,
            {"runtime_version": "1.0.0", "events": forged_events},
            format="json",
        )
        self.assertEqual(forged.status_code, 400)
        self.assertEqual(version.sessions.get().events.count(), 0)
        recorded = learner.post(
            event_url,
            {"runtime_version": "1.0.0", "events": good_events},
            format="json",
        )
        self.assertEqual(recorded.status_code, 200)
        self.assertEqual(recorded.json()["status"], "completed")
        self.assertEqual(version.sessions.get().events.count(), 3)
        progress = learner.get("/api/v1/student/progress")
        self.assertEqual(progress.status_code, 200)
        self.assertEqual(progress.json()["completed_count"], 1)
        self.assertEqual(progress.json()["total_score"], 3)
        other_learner = self._learner_client("other-experiment-learner")
        self.assertEqual(
            other_learner.post(
                event_url, {"runtime_version": "1.0.0", "events": good_events}, format="json"
            ).status_code,
            404,
        )
        with self.assertRaises(ValidationError):
            version.changelog = "tampered"
            version.save()
        ContentVersion.objects.filter(pk=version.pk).update(definition_hash="0" * 64)
        self.assertEqual(APIClient().get("/api/v1/content/experiments/filtration").status_code, 404)

    def test_publish_fails_closed_when_definition_hash_was_tampered(self):
        created = self._create()
        experiment_id = created.json()["experiment_id"]
        version = ContentVersion.objects.get(pk=created.json()["version_id"])
        self.editor.post(
            "/api/v1/admin/content/review",
            {"action": "submit_review", "experiment_id": experiment_id},
            format="json",
        )
        approval = self.editor.post(
            "/api/v1/admin/content/review",
            {"action": "approve", "experiment_id": experiment_id},
            format="json",
        )
        self._decide(approval)
        ContentVersion.objects.filter(pk=version.pk).update(definition_hash="0" * 64)
        publish = self.editor.post(
            "/api/v1/admin/content/review",
            {"action": "publish", "experiment_id": experiment_id},
            format="json",
        )
        decision = self._decide(publish)
        self.assertEqual(decision.status_code, 400)
        version.refresh_from_db()
        self.assertEqual(version.status, ContentVersion.STATUS_REVIEW)
