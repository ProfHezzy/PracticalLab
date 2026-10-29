import hashlib

from core.mfa_encryption import encrypt_secret
from core.models import (
    ApprovalRequest,
    AuditLog,
    Course,
    Lesson,
    LessonVersion,
    Level,
    SchemeOfWork,
    StaffMember,
    Subject,
    Topic,
)
from core.staffing import ensure_default_roles
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient


class ContentDeliveryTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = self._staff_client("content-editor")
        self.approver = self._staff_client("content-approver")
        self.subject = Subject.objects.create(name="Chemistry", code="chemistry")
        self.level = Level.objects.create(stage="Secondary")
        self.course = Course.objects.create(
            subject=self.subject, level=self.level, title="Practical Chemistry"
        )
        self.scheme = SchemeOfWork.objects.create(
            course=self.course, term="Term 1", title="Laboratory Skills"
        )
        self.topic = Topic.objects.create(
            scheme=self.scheme, title="Separating mixtures", order=1, week=2
        )
        self.lesson = Lesson.objects.create(topic=self.topic, title="Filtration basics")

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

    def _create_version(self, **overrides):
        payload = {
            "lesson_id": self.lesson.id,
            "title": "Filtering a mixture",
            "content": "Fold the paper, fit it into the funnel, then pour slowly.",
            "estimated_minutes": 8,
            "safety_notes": "Keep glassware on a stable surface.",
            "transcript": "Welcome to this lesson.",
            "captions": "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nWelcome to this lesson.",
            "assets": [],
        }
        payload.update(overrides)
        return self.client.post("/api/v1/admin/content/lesson-versions", payload, format="json")

    def _approve(self, approval_response):
        approval_id = approval_response.json()["approval"]["id"]
        return self.approver.post(
            f"/api/v1/admin/approvals/{approval_id}/decision",
            {"decision": "approve"},
            format="json",
        )

    def _publish(self, version_id):
        queued = self.client.post(
            "/api/v1/admin/content/lesson-versions",
            {"action": "publish", "version_id": version_id},
            format="json",
        )
        return queued, self._approve(queued)

    def test_drafts_and_rejected_content_never_appear_in_public_browsing(self):
        created = self._create_version()
        version_id = created.json()["id"]

        self.assertEqual(created.status_code, 201)
        self.assertEqual(self.client.get("/api/v1/content/lessons/published").json()["count"], 0)
        self.assertEqual(
            self.client.get(f"/api/v1/content/lessons/{self.lesson.id}").status_code, 404
        )
        self.assertEqual(
            self.client.get(f"/api/v1/content/topics/{self.topic.id}").status_code, 404
        )

        rejected = self.client.post(
            "/api/v1/admin/content/lesson-versions",
            {"action": "reject", "version_id": version_id},
            format="json",
        )
        self.assertEqual(rejected.status_code, 409)

    def test_lesson_is_visible_only_after_independent_review_and_publication(self):
        created = self._create_version()
        version_id = created.json()["id"]
        submitted = self.client.post(
            "/api/v1/admin/content/lesson-versions",
            {"action": "submit_review", "version_id": version_id},
            format="json",
        )
        approval = self.client.post(
            "/api/v1/admin/content/lesson-versions",
            {"action": "approve", "version_id": version_id},
            format="json",
        )
        self.assertEqual(submitted.json()["status"], LessonVersion.STATUS_REVIEW)
        self.assertEqual(approval.status_code, 202)
        self.assertEqual(self._approve(approval).status_code, 200)
        queued, published = self._publish(version_id)
        self.assertEqual(queued.status_code, 202)
        self.assertEqual(published.status_code, 200)
        publication_audit = AuditLog.objects.get(
            action="lesson_version_publish_executed", target_model="LessonVersion"
        )
        self.assertEqual(
            publication_audit.actor,
            get_user_model().objects.get(username="content-approver"),
        )

        listing = self.client.get(f"/api/v1/content/lessons/published?subject_id={self.subject.id}")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["count"], 1)
        self.assertEqual(listing.json()["results"][0]["version"], 1)
        self.assertIn("ETag", listing.headers)
        cached = self.client.get(
            f"/api/v1/content/lessons/published?subject_id={self.subject.id}",
            HTTP_IF_NONE_MATCH=listing.headers["ETag"],
        )
        self.assertEqual(cached.status_code, 304)

        detail = self.client.get(f"/api/v1/content/lessons/{self.lesson.id}")
        self.assertEqual(
            detail.json()["content"], "Fold the paper, fit it into the funnel, then pour slowly."
        )
        self.assertEqual(detail.json()["topic"]["week"], 2)
        topic_detail = self.client.get(f"/api/v1/content/topics/{self.topic.id}")
        self.assertEqual(topic_detail.json()["lessons"][0]["id"], self.lesson.id)
        caption_url = detail.json()["captions_url"]
        captions = self.client.get(caption_url)
        self.assertEqual(captions.status_code, 200)
        self.assertEqual(captions["Content-Type"], "text/vtt; charset=utf-8")
        self.assertIn("WEBVTT", captions.content.decode())
        schemes = self.client.get(f"/api/v1/content/schemes?course_id={self.course.id}")
        self.assertEqual(schemes.json()[0]["term"], "Term 1")

    def test_audio_assets_require_captions_and_cannot_change_after_publish(self):
        audio = {
            "kind": "audio",
            "file_url": "https://media.example.test/lesson.mp3",
            "mime_type": "audio/mpeg",
            "size_bytes": 1024,
            "sha256": hashlib.sha256(b"audio").hexdigest(),
            "attribution": "PracticalLab Africa",
            "license_name": "CC BY 4.0",
            "license_url": "https://creativecommons.org/licenses/by/4.0/",
        }
        created = self._create_version(assets=[audio], transcript="Spoken narration", captions="")
        version_id = created.json()["id"]
        self.client.post(
            "/api/v1/admin/content/lesson-versions",
            {"action": "submit_review", "version_id": version_id},
            format="json",
        )
        approve_request = self.client.post(
            "/api/v1/admin/content/lesson-versions",
            {"action": "approve", "version_id": version_id},
            format="json",
        )
        self._approve(approve_request)
        queued, decision = self._publish(version_id)
        self.assertEqual(queued.status_code, 202)
        self.assertEqual(decision.status_code, 400)
        self.assertTrue(
            ApprovalRequest.objects.filter(
                pk=queued.json()["approval"]["id"], status="pending"
            ).exists()
        )

        version = LessonVersion.objects.get(pk=version_id)
        version.captions = "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nNarration visible as captions"
        version.save(update_fields=["captions"])
        queued, decision = self._publish(version_id)
        self.assertEqual(decision.status_code, 200)
        version.refresh_from_db()
        asset = version.assets.get()
        self.assertTrue(version.content_hash)
        with self.assertRaises(ValidationError):
            version.title = "Changed after publication"
            version.save()
        with self.assertRaises(ValidationError):
            version.delete()
        with self.assertRaises(ValidationError):
            asset.delete()

        immutable_url = f"/api/v1/content/assets/{asset.id}/{version.content_hash}"
        redirect = self.client.get(immutable_url)
        self.assertEqual(redirect.status_code, 302)
        self.assertEqual(redirect.headers["Location"], audio["file_url"])
        self.assertIn("immutable", redirect.headers["Cache-Control"])
        self.assertEqual(
            self.client.get(f"/api/v1/content/assets/{asset.id}/wrong").status_code, 404
        )

    def test_asset_validation_rejects_unlicensed_oversized_or_unsafe_files(self):
        bad_asset = {
            "kind": "image",
            "file_url": "http://media.example.test/image.png",
            "mime_type": "image/svg+xml",
            "size_bytes": 10,
            "sha256": "0" * 64,
            "attribution": "",
            "license_name": "",
        }
        response = self._create_version(assets=[bad_asset])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(LessonVersion.objects.count(), 0)

    def test_invalid_curriculum_filters_return_a_client_error(self):
        response = self.client.get("/api/v1/content/lessons/published?course_id=not-a-number")
        self.assertEqual(response.status_code, 400)
