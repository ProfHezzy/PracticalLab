from unittest.mock import patch

import redis
from core.mfa_encryption import encrypt_secret
from core.models import StaffMember, StaffRole
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient


class HealthEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_liveness_is_public_and_returns_minimal_status(self):
        response = self.client.get("/api/v1/health/live")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_csrf_endpoint_returns_token_and_sets_cookie(self):
        client = APIClient(enforce_csrf_checks=True)

        response = client.get("/api/v1/auth/csrf")

        self.assertEqual(response.status_code, 200)
        self.assertIn("csrfToken", response.json())
        self.assertIn("csrftoken", response.cookies)

    @patch("config.api.views.redis_client.ping")
    def test_readiness_reports_database_and_cache(self, redis_ping):
        redis_ping.return_value = True

        response = self.client.get("/api/v1/health/ready")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "checks": {"database": "ok", "cache": "ok"}},
        )

    @patch("config.api.views.redis_client.ping")
    def test_readiness_reports_cache_failure_without_internal_details(self, redis_ping):
        redis_ping.side_effect = redis.ConnectionError("private endpoint detail")

        response = self.client.get("/api/v1/health/ready")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {
                "status": "unavailable",
                "checks": {"database": "ok", "cache": "unavailable"},
            },
        )
        self.assertNotIn("private endpoint detail", response.content.decode())

    def test_unknown_api_route_uses_the_error_envelope(self):
        response = self.client.get("/api/v1/not-a-route")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json(),
            {
                "error": {
                    "code": "not_found",
                    "message": "The requested resource was not found.",
                    "details": {},
                }
            },
        )


class StaffAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff_user = get_user_model().objects.create_user(
            username="foundation-staff",
            password="local-test-password",
            is_staff=True,
        )

    def test_staff_access_is_denied_without_login(self):
        response = self.client.get("/api/v1/staff/access")

        self.assertEqual(response.status_code, 403)

    def test_staff_access_is_denied_until_mfa_is_verified(self):
        self.client.force_login(self.staff_user)

        response = self.client.get("/api/v1/staff/access")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["error"]["code"], "permission_denied")

    def test_authenticated_staff_mutation_without_csrf_is_rejected(self):
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(self.staff_user)

        response = client.post("/api/v1/staff/access", {}, format="json")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["error"]["code"], "permission_denied")

    def test_staff_access_requires_staff_and_verified_mfa(self):
        role = StaffRole.objects.create(name="Foundation Test")
        StaffMember.objects.create(
            user=self.staff_user,
            role=role,
            mfa_secret=encrypt_secret("JBSWY3DPEHPK3PXP"),
            mfa_enrolled_at=timezone.now(),
        )
        self.client.force_login(self.staff_user)
        session = self.client.session
        session["staff_mfa_verified"] = True
        session["staff_mfa_verified_at"] = timezone.now().isoformat()
        session.save()

        response = self.client.get("/api/v1/staff/access")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "authorized")

    def test_non_staff_user_is_denied_even_with_mfa_session_marker(self):
        learner = get_user_model().objects.create_user(
            username="foundation-learner",
            password="local-test-password",
            is_staff=False,
        )
        self.client.force_login(learner)
        session = self.client.session
        session["staff_mfa_verified"] = True
        session.save()

        response = self.client.get("/api/v1/staff/access")

        self.assertEqual(response.status_code, 403)

    def test_session_and_csrf_cookies_have_safe_defaults(self):
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
        self.assertEqual(settings.SESSION_COOKIE_SAMESITE, "Lax")
        self.assertTrue(settings.CSRF_COOKIE_HTTPONLY)
        self.assertEqual(settings.CSRF_COOKIE_SAMESITE, "Lax")
