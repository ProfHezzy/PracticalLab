from core.mfa import totp_code
from core.mfa_encryption import decrypt_secret
from core.models import (
    Level,
    PolicyAcceptance,
    StaffMember,
    StaffRole,
    StudentProfile,
    TeacherProfile,
    TeacherVerification,
    UserProfile,
)
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class AuthAndProfileTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.level = Level.objects.create(stage="SS2", description="Senior Secondary 2")

    def test_student_registration_creates_student_profile_and_default_private_preferences(self):
        response = self.client.post(
            "/api/v1/auth/register",
            {
                "username": "amara_student",
                "email": "amara@example.com",
                "password": "Password123!Safe",
                "account_type": "student",
                "terms_accepted": True,
                "privacy_accepted": True,
                "country": "Nigeria",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["username"], "amara_student")
        self.assertEqual(data["account_type"], "student")
        self.assertEqual(data["active_mode"], "student")
        self.assertFalse(data["is_verified_teacher"])
        self.assertFalse(data["onboarding_completed"])

        # Invariant check: private by default
        self.assertEqual(data["preferences"]["profile_visibility"], "private")

        # Database verification
        user = User.objects.get(username="amara_student")
        self.assertTrue(StudentProfile.objects.filter(user=user).exists())
        self.assertTrue(user.student_profile.is_private)
        self.assertEqual(
            PolicyAcceptance.objects.filter(
                user=user, policy_type=PolicyAcceptance.POLICY_TERMS
            ).count(),
            1,
        )
        self.assertEqual(
            PolicyAcceptance.objects.filter(
                user=user, policy_type=PolicyAcceptance.POLICY_PRIVACY
            ).count(),
            1,
        )

    def test_registration_requires_terms_and_privacy_acceptance(self):
        response = self.client.post(
            "/api/v1/auth/register",
            {
                "username": "no_consent_user",
                "password": "Password123!Safe",
                "account_type": "student",
                "terms_accepted": False,
                "privacy_accepted": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "policy_required")

    def test_registration_rejects_duplicate_username_and_email(self):
        User.objects.create_user(
            username="existing_user", email="existing@example.com", password="pwd"
        )

        resp1 = self.client.post(
            "/api/v1/auth/register",
            {
                "username": "existing_user",
                "password": "Password123!Safe",
                "terms_accepted": True,
                "privacy_accepted": True,
            },
            format="json",
        )
        self.assertEqual(resp1.status_code, 400)
        self.assertEqual(resp1.json()["error"]["code"], "duplicate_username")

        resp2 = self.client.post(
            "/api/v1/auth/register",
            {
                "username": "new_user",
                "email": "existing@example.com",
                "password": "Password123!Safe",
                "terms_accepted": True,
                "privacy_accepted": True,
            },
            format="json",
        )
        self.assertEqual(resp2.status_code, 400)
        self.assertEqual(resp2.json()["error"]["code"], "duplicate_email")

    def test_teacher_registration_creates_unverified_teacher_profile(self):
        response = self.client.post(
            "/api/v1/auth/register",
            {
                "username": "mr_adeyemi",
                "email": "adeyemi@example.com",
                "password": "Password123!Safe",
                "account_type": "teacher",
                "terms_accepted": True,
                "privacy_accepted": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["account_type"], "teacher")
        self.assertEqual(data["active_mode"], "teacher")
        self.assertFalse(data["is_verified_teacher"])
        self.assertEqual(data["teacher_profile"]["verification_status"], "unverified")

    def test_login_and_logout_flow(self):
        User.objects.create_user(username="chidi", password="Password123!Safe")

        # Invalid login
        bad_resp = self.client.post(
            "/api/v1/auth/login",
            {"username": "chidi", "password": "WrongPassword"},
            format="json",
        )
        self.assertEqual(bad_resp.status_code, 401)
        self.assertEqual(bad_resp.json()["error"]["code"], "invalid_credentials")

        # Valid login
        good_resp = self.client.post(
            "/api/v1/auth/login",
            {"username": "chidi", "password": "Password123!Safe"},
            format="json",
        )
        self.assertEqual(good_resp.status_code, 200)
        self.assertEqual(good_resp.json()["username"], "chidi")

        # Auth me
        me_resp = self.client.get("/api/v1/auth/me")
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["username"], "chidi")

        # Logout
        logout_resp = self.client.post("/api/v1/auth/logout")
        self.assertEqual(logout_resp.status_code, 200)

        # Unauthenticated after logout
        post_logout_me = self.client.get("/api/v1/auth/me")
        self.assertEqual(post_logout_me.status_code, 403)

    def test_safe_role_switching_and_profile_provisioning(self):
        user = User.objects.create_user(username="dual_user", password="Password123!Safe")
        UserProfile.objects.create(
            user=user,
            account_type=UserProfile.ACCOUNT_TYPE_STUDENT,
            active_mode=UserProfile.MODE_STUDENT,
        )
        StudentProfile.objects.create(user=user)

        self.client.force_login(user)

        # Switch to teacher mode
        switch_resp = self.client.post(
            "/api/v1/users/me/role-switch",
            {"target_mode": "teacher"},
            format="json",
        )
        self.assertEqual(switch_resp.status_code, 200)
        self.assertEqual(switch_resp.json()["active_mode"], "teacher")

        # Verify teacher profile capability is safely provisioned with unverified status
        self.assertTrue(hasattr(user, "teacher_profile"))
        self.assertEqual(user.teacher_profile.verification_status, "unverified")

        # Switch back to student mode
        switch_back = self.client.post(
            "/api/v1/users/me/role-switch",
            {"target_mode": "student"},
            format="json",
        )
        self.assertEqual(switch_back.status_code, 200)
        self.assertEqual(switch_back.json()["active_mode"], "student")

    def test_student_onboarding_sets_level_and_completes_onboarding(self):
        user = User.objects.create_user(username="onboarding_student", password="Password123!Safe")
        UserProfile.objects.create(user=user, account_type=UserProfile.ACCOUNT_TYPE_STUDENT)
        StudentProfile.objects.create(user=user)

        self.client.force_login(user)

        resp = self.client.post(
            "/api/v1/users/me/student-onboarding",
            {
                "level_id": self.level.id,
                "target_exam": "WAEC/JAMB",
                "avatar_preset": "avatar_beaker",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["onboarding_completed"])
        self.assertEqual(data["student_profile"]["level_stage"], "SS2")
        self.assertEqual(data["student_profile"]["target_exam"], "WAEC/JAMB")
        self.assertEqual(data["student_profile"]["avatar_preset"], "avatar_beaker")

    def test_user_preferences_update(self):
        user = User.objects.create_user(username="pref_user", password="Password123!Safe")
        self.client.force_login(user)

        resp = self.client.patch(
            "/api/v1/users/me/preferences",
            {
                "theme": "dark",
                "reduced_motion": True,
                "profile_visibility": "connections",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["theme"], "dark")
        self.assertTrue(data["reduced_motion"])
        self.assertEqual(data["profile_visibility"], "connections")

    def test_teacher_verification_application_lifecycle(self):
        user = User.objects.create_user(username="prof_okonkwo", password="Password123!Safe")
        UserProfile.objects.create(user=user, account_type=UserProfile.ACCOUNT_TYPE_TEACHER)
        TeacherProfile.objects.create(user=user, verification_status="unverified")

        self.client.force_login(user)

        # Check initial state
        initial_check = self.client.get("/api/v1/teacher-verification/me")
        self.assertEqual(initial_check.status_code, 200)
        self.assertEqual(initial_check.json()["verification_status"], "unverified")

        # Submit verification application
        submit_resp = self.client.post(
            "/api/v1/teacher-verification/applications",
            {
                "title": "Dr.",
                "school_affiliation": "Federal Government College, Lagos",
                "subject_specialization": "Chemistry & Physics",
                "years_of_experience": 8,
                "id_document_type": "TRCN License",
                "id_reference": "TRCN-LAG-2024-9876",
                "notes": "Head of Science Department.",
            },
            format="json",
        )
        self.assertEqual(submit_resp.status_code, 201)
        self.assertEqual(submit_resp.json()["verification_status"], "pending")

        # Verification application is stored
        self.assertTrue(
            TeacherVerification.objects.filter(
                teacher__user=user,
                status=TeacherVerification.STATUS_PENDING,
            ).exists()
        )

        # Status endpoint now reflects pending
        pending_check = self.client.get("/api/v1/teacher-verification/me")
        self.assertEqual(pending_check.status_code, 200)
        self.assertEqual(pending_check.json()["verification_status"], "pending")
        self.assertEqual(
            pending_check.json()["latest_application"]["id_document_type"],
            "TRCN License",
        )

    def test_password_recovery_sends_email_and_confirmation_flow(self):
        User.objects.create_user(
            username="recovery_user",
            email="recover@example.com",
            password="OldPassword123!Safe",
        )

        # Step 1: Initiate recovery
        recovery_resp = self.client.post(
            "/api/v1/auth/recovery",
            {"identifier": "recover@example.com"},
            format="json",
        )
        self.assertEqual(recovery_resp.status_code, 200)
        data = recovery_resp.json()
        self.assertEqual(data["status"], "recovery_initiated")
        self.assertNotIn("token", data)
        self.assertNotIn("user_id", data)
        self.assertEqual(len(mail.outbox), 1)
        reset_url = mail.outbox[0].body.splitlines()[2]
        from urllib.parse import parse_qs, urlparse

        query = parse_qs(urlparse(reset_url).query)
        token = query["token"][0]
        user_id = query["uid"][0]

        # Step 2: Confirm recovery with new password
        confirm_resp = self.client.post(
            "/api/v1/auth/recovery/confirm",
            {
                "user_id": user_id,
                "token": token,
                "new_password": "BrandNewPassword123!Safe",
            },
            format="json",
        )
        self.assertEqual(confirm_resp.status_code, 200)
        self.assertEqual(confirm_resp.json()["status"], "password_reset_success")

        # Step 3: Verify login with new password succeeds
        login_resp = self.client.post(
            "/api/v1/auth/login",
            {"username": "recovery_user", "password": "BrandNewPassword123!Safe"},
            format="json",
        )
        self.assertEqual(login_resp.status_code, 200)

    def test_staff_totp_enrollment_encrypts_secret_and_recovery_code_is_single_use(self):
        user = User.objects.create_user(
            username="staff-mfa", password="StrongPassword123!", is_staff=True
        )
        role = StaffRole.objects.create(name="Super Admin")
        StaffMember.objects.create(user=user, role=role)
        self.client.force_login(user)

        enrollment = self.client.post("/api/v1/staff/mfa/enroll", {}, format="json")
        self.assertEqual(enrollment.status_code, 200)
        secret = enrollment.json()["secret"]
        self.assertIn("otpauth://totp/", enrollment.json()["otpauth_uri"])

        verified = self.client.post(
            "/api/v1/staff/mfa/verify", {"code": totp_code(secret)}, format="json"
        )
        self.assertEqual(verified.status_code, 200)
        self.assertEqual(verified.json()["status"], "mfa_enrolled")
        member = StaffMember.objects.get(user=user)
        self.assertNotEqual(member.mfa_secret, secret)
        self.assertEqual(decrypt_secret(member.mfa_secret), secret)
        self.assertEqual(self.client.get("/api/v1/staff/access").status_code, 200)

        recovery_code = verified.json()["recovery_codes"][0]
        self.client.logout()
        self.client.force_login(user)
        recovery = self.client.post(
            "/api/v1/staff/mfa/recovery", {"code": recovery_code}, format="json"
        )
        self.assertEqual(recovery.status_code, 200)
        replay = self.client.post(
            "/api/v1/staff/mfa/recovery", {"code": recovery_code}, format="json"
        )
        self.assertEqual(replay.status_code, 401)
