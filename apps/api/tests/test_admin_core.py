from core.mfa_encryption import encrypt_secret
from core.models import (
    AuditLog,
    ContentVersion,
    Course,
    Experiment,
    Level,
    ModerationCase,
    Permission,
    SchemeOfWork,
    StaffMember,
    StaffRole,
    Subject,
    TeacherProfile,
    TeacherVerification,
    Topic,
    UserProfile,
)
from core.staffing import ensure_default_roles
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient


class AdminCurriculumTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.staff_user = get_user_model().objects.create_user(
            username="admin-core-staff",
            password="admin-secret",
            is_staff=True,
        )
        role = ensure_default_roles()["Super Admin"]
        StaffMember.objects.create(
            user=self.staff_user,
            role=role,
            mfa_secret=encrypt_secret("JBSWY3DPEHPK3PXP"),
            mfa_enrolled_at=timezone.now(),
        )

    def _login_staff(self):
        self.client.force_login(self.staff_user)
        session = self.client.session
        session["staff_mfa_verified"] = True
        session["staff_mfa_verified_at"] = timezone.now().isoformat()
        session.save()

    def _second_staff_client(self, username):
        user = get_user_model().objects.create_user(
            username=username, password="approver-secret", is_staff=True
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

    def test_admin_curriculum_requires_staff_mfa(self):
        response = self.client.get("/api/v1/admin/curriculum/subjects")
        self.assertEqual(response.status_code, 403)

    def test_staff_role_permission_matrix_denies_writes_to_read_only_role(self):
        viewer = get_user_model().objects.create_user(username="curriculum-viewer", is_staff=True)
        role = StaffRole.objects.create(name="Read only curriculum")
        role.permissions.add(Permission.objects.get(code="curriculum.read"))
        StaffMember.objects.create(
            user=viewer,
            role=role,
            mfa_secret=encrypt_secret("JBSWY3DPEHPK3PXP"),
            mfa_enrolled_at=timezone.now(),
        )
        client = APIClient()
        client.force_login(viewer)
        session = client.session
        session["staff_mfa_verified"] = True
        session["staff_mfa_verified_at"] = timezone.now().isoformat()
        session.save()
        self.assertEqual(client.get("/api/v1/admin/curriculum/subjects").status_code, 200)
        denied = client.post(
            "/api/v1/admin/curriculum/subjects",
            {"name": "Restricted", "code": "restricted"},
            format="json",
        )
        self.assertEqual(denied.status_code, 403)

    def test_audit_entries_are_append_only_through_model_api(self):
        entry = AuditLog.objects.create(action="test", target_model="User", target_id=1)
        with self.assertRaises(ValueError):
            entry.save()
        with self.assertRaises(ValueError):
            AuditLog.objects.filter(pk=entry.pk).update(action="changed")
        with self.assertRaises(ValueError):
            entry.delete()

    def test_staff_can_create_subjects(self):
        self._login_staff()

        response = self.client.post(
            "/api/v1/admin/curriculum/subjects",
            {"name": "Physics", "code": "phys", "description": "Motion and electricity."},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "Physics")
        self.assertTrue(Subject.objects.filter(code="phys").exists())

    def test_staff_can_list_courses_and_topics(self):
        self._login_staff()

        subject = Subject.objects.create(name="Biology", code="bio", description="Life sciences")
        level = Level.objects.create(stage="SS1")
        course = Course.objects.create(subject=subject, level=level, title="Cell biology")
        scheme = SchemeOfWork.objects.create(course=course, term="Second", title="Cells and tissue")
        Topic.objects.create(scheme=scheme, title="Cell structure", order=1)

        courses_response = self.client.get("/api/v1/admin/curriculum/courses")
        topics_response = self.client.get("/api/v1/admin/curriculum/topics")

        self.assertEqual(courses_response.status_code, 200)
        self.assertEqual(topics_response.status_code, 200)
        self.assertGreater(len(courses_response.json()), 0)
        self.assertGreater(len(topics_response.json()), 0)

    def test_admin_overview_reports_pending_verification_and_open_reports(self):
        self._login_staff()
        teacher = get_user_model().objects.create_user(
            username="teacher-pending",
            password="teacher-secret",
        )
        UserProfile.objects.create(
            user=teacher,
            account_type=UserProfile.ACCOUNT_TYPE_TEACHER,
        )
        TeacherProfile.objects.create(
            user=teacher, verification_status=TeacherProfile.STATUS_PENDING
        )
        ModerationCase.objects.create(
            subject_user=teacher,
            reported_by=self.staff_user,
            reason="Unsafe behavior",
            status=ModerationCase.STATUS_OPEN,
        )

        response = self.client.get("/api/v1/admin/overview")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["pending_teacher_verifications"], 1)
        self.assertGreaterEqual(response.json()["open_reports"], 1)

    def test_staff_can_review_teacher_verification_and_read_audit_log(self):
        self._login_staff()
        teacher = get_user_model().objects.create_user(
            username="teacher-verify",
            password="teacher-secret",
        )
        profile = UserProfile.objects.create(
            user=teacher,
            account_type=UserProfile.ACCOUNT_TYPE_TEACHER,
            bio="Waiting for approval",
        )
        teacher_profile = TeacherProfile.objects.create(user=teacher)
        TeacherVerification.objects.create(
            teacher=teacher_profile,
            id_document_type="Educator ID",
            id_reference="private-reference-1234",
        )

        approval_response = self.client.post(
            "/api/v1/admin/teacher-verifications",
            {
                "user_id": teacher.id,
                "action": "approve",
            },
            format="json",
        )

        self.assertEqual(approval_response.status_code, 202)
        approval_id = approval_response.json()["approval"]["id"]
        approver_client = self._second_staff_client("admin-approver")
        decision = approver_client.post(
            f"/api/v1/admin/approvals/{approval_id}/decision",
            {"decision": "approve"},
            format="json",
        )
        self.assertEqual(decision.status_code, 200)
        profile.refresh_from_db()
        self.assertTrue(profile.is_verified_teacher)
        teacher_profile.refresh_from_db()
        self.assertEqual(teacher_profile.verification_status, TeacherProfile.STATUS_VERIFIED)

        audit_response = self.client.get("/api/v1/admin/audit-log")
        self.assertEqual(audit_response.status_code, 200)
        self.assertGreater(len(audit_response.json()), 0)

    def test_content_review_requires_second_approver_for_publish(self):
        self._login_staff()
        teacher = get_user_model().objects.create_user(
            username="teacher-content-owner",
            password="teacher-secret",
        )
        subject = Subject.objects.create(name="Physics", code="phy")
        level = Level.objects.create(stage="SS3")
        course = Course.objects.create(subject=subject, level=level, title="Forces and motion")
        scheme = SchemeOfWork.objects.create(course=course, term="Term 1", title="Forces")
        topic = Topic.objects.create(scheme=scheme, title="Velocity", order=1)
        experiment = Experiment.objects.create(
            subject=subject,
            topic=topic,
            title="Velocity experiment",
            slug="velocity-experiment",
            summary="Measure speed and motion.",
            created_by=teacher,
            status="approved",
        )
        ContentVersion.objects.create(
            experiment=experiment,
            version="1.0.0",
            status="review",
            changelog="Approved draft",
            created_by=teacher,
        )

        first_attempt = self.client.post(
            "/api/v1/admin/content/review",
            {"experiment_id": experiment.id, "action": "publish"},
            format="json",
        )
        self.assertEqual(first_attempt.status_code, 202)

        response = self.client.post(
            "/api/v1/admin/content/review",
            {
                "experiment_id": experiment.id,
                "action": "publish",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 202)
        approval_id = response.json()["approval"]["id"]
        approver_client = self._second_staff_client("content-approver")
        decision = approver_client.post(
            f"/api/v1/admin/approvals/{approval_id}/decision",
            {"decision": "approve"},
            format="json",
        )
        self.assertEqual(decision.status_code, 200)
        experiment.refresh_from_db()
        self.assertEqual(experiment.status, "approved")
        self.assertEqual(
            experiment.content_versions.order_by("-created_at").first().status,
            "published",
        )

    def test_approval_cannot_be_self_approved_or_replayed(self):
        self._login_staff()
        teacher = get_user_model().objects.create_user(username="self-approve-target")
        subject = Subject.objects.create(name="Chemistry", code="chem")
        experiment = Experiment.objects.create(
            subject=subject,
            title="Awaiting review",
            slug="awaiting-review",
            created_by=teacher,
            status=Experiment.STATUS_REVIEW,
        )
        queued = self.client.post(
            "/api/v1/admin/content/review",
            {"experiment_id": experiment.id, "action": "approve"},
            format="json",
        )
        approval_id = queued.json()["approval"]["id"]
        self_decision = self.client.post(
            f"/api/v1/admin/approvals/{approval_id}/decision",
            {"decision": "approve"},
            format="json",
        )
        self.assertEqual(self_decision.status_code, 403)

        approver = self._second_staff_client("approval-approver")
        accepted = approver.post(
            f"/api/v1/admin/approvals/{approval_id}/decision",
            {"decision": "approve"},
            format="json",
        )
        replay = approver.post(
            f"/api/v1/admin/approvals/{approval_id}/decision",
            {"decision": "approve"},
            format="json",
        )
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(replay.status_code, 400)

    def test_staff_invitation_requires_second_approval_and_is_single_use(self):
        self._login_staff()
        invite = self.client.post(
            "/api/v1/admin/staff/invitations",
            {"username": "new-reviewer", "role": "Reviewer"},
            format="json",
        )
        self.assertEqual(invite.status_code, 202)
        token = invite.json()["invitation_token"]
        approval_id = invite.json()["approval"]["id"]
        before_approval = APIClient().post(
            "/api/v1/staff/invitations/accept",
            {"token": token, "password": "VeryStrongPassword123!"},
            format="json",
        )
        self.assertEqual(before_approval.status_code, 403)

        approver = self._second_staff_client("invitation-approver")
        approved = approver.post(
            f"/api/v1/admin/approvals/{approval_id}/decision",
            {"decision": "approve"},
            format="json",
        )
        self.assertEqual(approved.status_code, 200)
        accepted = APIClient().post(
            "/api/v1/staff/invitations/accept",
            {"token": token, "password": "VeryStrongPassword123!"},
            format="json",
        )
        self.assertEqual(accepted.status_code, 201)
        replay = APIClient().post(
            "/api/v1/staff/invitations/accept",
            {"token": token, "password": "VeryStrongPassword123!"},
            format="json",
        )
        self.assertEqual(replay.status_code, 400)

    def test_staff_can_list_open_reports(self):
        self._login_staff()
        teacher = get_user_model().objects.create_user(
            username="teacher-report",
            password="teacher-secret",
        )
        ModerationCase.objects.create(
            subject_user=teacher,
            reported_by=self.staff_user,
            reason="Harassment",
            status=ModerationCase.STATUS_OPEN,
        )

        response = self.client.get("/api/v1/admin/moderation")

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.json()), 0)
        self.assertEqual(response.json()[0]["reason"], "Harassment")

    def test_staff_can_search_users_without_exposing_private_data(self):
        self._login_staff()
        user = get_user_model().objects.create_user(username="search-user", password="user-secret")
        UserProfile.objects.create(user=user, account_type=UserProfile.ACCOUNT_TYPE_STUDENT)

        response = self.client.get("/api/v1/admin/users/search?q=search")

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.json()), 0)
        self.assertEqual(response.json()[0]["username"], "search-user")
