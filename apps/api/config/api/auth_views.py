from __future__ import annotations

import datetime
import hashlib
import re
from typing import Any

from core.mfa import (
    generate_recovery_codes,
    generate_totp_secret,
    hash_recovery_code,
    otpauth_uri,
    verify_totp,
)
from core.mfa_encryption import decrypt_secret, encrypt_secret
from core.models import (
    ApprovalRequest,
    Level,
    MFARecoveryCode,
    PolicyAcceptance,
    StaffInvitation,
    StaffMember,
    StudentProfile,
    Subject,
    TeacherProfile,
    TeacherVerification,
    UserPreference,
    UserProfile,
)
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from config.api.errors import error_payload
from config.api.permissions import ActiveStaffAccountRequired, staff_member_for

User = get_user_model()


def get_client_ip(request: Request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def format_user_me(user: Any) -> dict[str, Any]:
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "account_type": UserProfile.ACCOUNT_TYPE_STUDENT,
            "active_mode": UserProfile.MODE_STUDENT,
            "country": "Nigeria",
        },
    )

    preferences, _ = UserPreference.objects.get_or_create(
        user=user,
        defaults={
            "profile_visibility": UserPreference.VISIBILITY_PRIVATE,
            "theme": UserPreference.THEME_SYSTEM,
            "email_notifications": True,
        },
    )

    student_data = None
    if hasattr(user, "student_profile"):
        sp = user.student_profile
        student_data = {
            "level_id": sp.level_id,
            "level_stage": sp.level.stage if sp.level else None,
            "target_exam": sp.target_exam,
            "avatar_preset": sp.avatar_preset,
            "is_private": sp.is_private,
            "subjects": list(sp.subjects.order_by("name").values_list("id", flat=True)),
        }

    teacher_data = None
    if hasattr(user, "teacher_profile"):
        tp = user.teacher_profile
        teacher_data = {
            "title": tp.title,
            "school_affiliation": tp.school_affiliation,
            "subject_specialization": tp.subject_specialization,
            "years_of_experience": tp.years_of_experience,
            "verification_status": tp.verification_status,
            "verified_at": tp.verified_at.isoformat() if tp.verified_at else None,
        }

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "account_type": profile.account_type,
        "active_mode": profile.active_mode,
        "is_verified_teacher": profile.is_verified_teacher,
        "country": profile.country,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "onboarding_completed": profile.onboarding_completed,
        "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
        "is_minor": profile.is_minor,
        "phone": profile.phone,
        "email_verification_status": profile.email_verification_status,
        "email_verified_at": profile.email_verified_at.isoformat() if profile.email_verified_at else None,
        "phone_verification_status": profile.phone_verification_status,
        "phone_verified_at": profile.phone_verified_at.isoformat() if profile.phone_verified_at else None,
        "recovery_contact_name": profile.recovery_contact_name,
        "recovery_contact_email": profile.recovery_contact_email,
        "recovery_contact_phone": profile.recovery_contact_phone,
        "recovery_contact_relationship": profile.recovery_contact_relationship,
        "has_recovery_contact": profile.has_recovery_contact(),
        "student_profile": student_data,
        "teacher_profile": teacher_data,
        "preferences": {
            "theme": preferences.theme,
            "reduced_motion": preferences.reduced_motion,
            "high_contrast": preferences.high_contrast,
            "email_notifications": preferences.email_notifications,
            "profile_visibility": preferences.profile_visibility,
        },
    }


import datetime

from django.utils import timezone


@method_decorator(csrf_protect, name="dispatch")
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register"

    @transaction.atomic
    def post(self, request: Request) -> Response:
        data = request.data
        username = (data.get("username") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        account_type = (
            (data.get("account_type") or UserProfile.ACCOUNT_TYPE_STUDENT).strip().lower()
        )
        country = (data.get("country") or "Nigeria").strip()
        terms_accepted = bool(data.get("terms_accepted"))
        privacy_accepted = bool(data.get("privacy_accepted"))
        # M3 Gate: Optional fields for age/notice handling and verification
        date_of_birth = data.get("date_of_birth")
        phone = (data.get("phone") or "").strip()
        # M3 Gate: Recovery contact for minors
        recovery_contact_name = (data.get("recovery_contact_name") or "").strip()
        recovery_contact_email = (data.get("recovery_contact_email") or "").strip().lower()
        recovery_contact_phone = (data.get("recovery_contact_phone") or "").strip()
        recovery_contact_relationship = (data.get("recovery_contact_relationship") or "").strip()

        # Validation
        if not username:
            return Response(
                error_payload(
                    "validation_error", "Username is required.", {"username": ["Required."]}
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(username) < 3 or not re.match(r"^[\w.@+-]+$", username):
            return Response(
                error_payload(
                    "validation_error",
                    "Username must be at least 3 characters with valid letters or digits.",
                    {"username": ["Invalid username format."]},
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username__iexact=username).exists():
            return Response(
                error_payload(
                    "duplicate_username",
                    "A user with that username already exists.",
                    {"username": ["Already taken."]},
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if email and User.objects.filter(email__iexact=email).exists():
            return Response(
                error_payload(
                    "duplicate_email",
                    "A user with that email already exists.",
                    {"email": ["Already registered."]},
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if account_type not in (UserProfile.ACCOUNT_TYPE_STUDENT, UserProfile.ACCOUNT_TYPE_TEACHER):
            return Response(
                error_payload(
                    "validation_error",
                    "Invalid account type.",
                    {"account_type": ["Must be 'student' or 'teacher'."]},
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not terms_accepted or not privacy_accepted:
            return Response(
                error_payload(
                    "policy_required",
                    "You must accept the Terms of Service and Privacy Policy to create an account.",
                    {"terms_accepted": ["Required."], "privacy_accepted": ["Required."]},
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password)
        except DjangoValidationError as exc:
            return Response(
                error_payload(
                    "weak_password",
                    "Password does not meet complexity requirements.",
                    {"password": list(exc.messages)},
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate date_of_birth if provided
        if date_of_birth:
            try:
                dob = datetime.date.fromisoformat(date_of_birth)
                if dob > datetime.date.today():
                    return Response(
                        error_payload(
                            "validation_error",
                            "Date of birth cannot be in the future.",
                            {"date_of_birth": ["Invalid date."]},
                        ),
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except ValueError:
                return Response(
                    error_payload(
                        "validation_error",
                        "Invalid date format. Use YYYY-MM-DD.",
                        {"date_of_birth": ["Invalid format."]},
                    ),
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)

        active_mode = (
            UserProfile.MODE_TEACHER
            if account_type == UserProfile.ACCOUNT_TYPE_TEACHER
            else UserProfile.MODE_STUDENT
        )
        profile = UserProfile.objects.create(
            user=user,
            account_type=account_type,
            active_mode=active_mode,
            is_verified_teacher=False,
            country=country,
            onboarding_completed=False,
            date_of_birth=dob if date_of_birth else None,
            phone=phone,
            phone_verification_status=UserProfile.VERIFICATION_STATUS_UNVERIFIED,
            recovery_contact_name=recovery_contact_name,
            recovery_contact_email=recovery_contact_email,
            recovery_contact_phone=recovery_contact_phone,
            recovery_contact_relationship=recovery_contact_relationship,
        )

        # Record age notice for minors
        if profile.is_minor:
            profile.age_notice_sent_at = timezone.now()
            profile.save(update_fields=["age_notice_sent_at", "updated_at"])

        # Create student or teacher capability
        if account_type == UserProfile.ACCOUNT_TYPE_STUDENT:
            StudentProfile.objects.create(user=user, is_private=True)
        else:
            TeacherProfile.objects.create(
                user=user, verification_status=TeacherProfile.STATUS_UNVERIFIED
            )

        # Default privacy preference: Private by default
        UserPreference.objects.create(
            user=user,
            profile_visibility=UserPreference.VISIBILITY_PRIVATE,
            theme=UserPreference.THEME_SYSTEM,
            email_notifications=True,
        )

        # Record policy acceptances
        ip = get_client_ip(request)
        PolicyAcceptance.objects.create(
            user=user, policy_type=PolicyAcceptance.POLICY_TERMS, version="1.0", ip_address=ip
        )
        PolicyAcceptance.objects.create(
            user=user, policy_type=PolicyAcceptance.POLICY_PRIVACY, version="1.0", ip_address=ip
        )

        # Establish server session
        login(request, user)

        return Response(format_user_me(user), status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"

    def post(self, request: Request) -> Response:
        identifier = (request.data.get("identifier") or request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        if not identifier or not password:
            return Response(
                error_payload("validation_error", "Username/email and password are required."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Support identifier as username or email
        user = authenticate(request, username=identifier, password=password)
        if user is None and "@" in identifier:
            matched_user = User.objects.filter(email__iexact=identifier).first()
            if matched_user:
                user = authenticate(request, username=matched_user.username, password=password)

        if user is None:
            return Response(
                error_payload("invalid_credentials", "Invalid credentials provided."),
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                error_payload("account_disabled", "Your account is suspended or disabled."),
                status=status.HTTP_403_FORBIDDEN,
            )

        login(request, user)
        return Response(format_user_me(user), status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name="dispatch")
class StaffLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"

    def post(self, request: Request) -> Response:
        identifier = (request.data.get("identifier") or "").strip()
        password = request.data.get("password") or ""
        user = authenticate(request, username=identifier, password=password)
        if user is None and "@" in identifier:
            matched = User.objects.filter(email__iexact=identifier).first()
            if matched is not None:
                user = authenticate(request, username=matched.username, password=password)
        if user is None:
            return Response(
                error_payload("invalid_credentials", "Invalid credentials provided."), status=401
            )
        member = (
            StaffMember.objects.filter(user=user, is_active=True).select_related("role").first()
        )
        if not user.is_active or not user.is_staff or member is None:
            return Response(
                error_payload(
                    "staff_access_required", "This account is not authorized for staff access."
                ),
                status=403,
            )
        login(request, user)
        request.session.cycle_key()
        request.session.pop("staff_mfa_verified", None)
        request.session.pop("staff_mfa_verified_at", None)
        request.session.set_expiry(300)
        return Response({"status": "staff_authenticated", "mfa_enrolled": member.mfa_is_enrolled})


@method_decorator(csrf_protect, name="dispatch")
class StaffInvitationAcceptView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register"

    @transaction.atomic
    def post(self, request: Request) -> Response:
        token = str(request.data.get("token") or "").strip()
        password = request.data.get("password") or ""
        if not token or not password:
            return Response(
                error_payload("validation_error", "Invitation token and password are required."),
                status=400,
            )
        digest = hashlib.sha256(token.encode()).hexdigest()
        invitation = (
            StaffInvitation.objects.select_for_update()
            .select_related("role")
            .filter(token_hash=digest, accepted_at__isnull=True, expires_at__gt=timezone.now())
            .first()
        )
        if invitation is None:
            return Response(
                error_payload("invalid_invitation", "The staff invitation is invalid or expired."),
                status=400,
            )
        approved = ApprovalRequest.objects.filter(
            action="staff_invitation",
            target_model="StaffInvitation",
            target_id=invitation.id,
            status=ApprovalRequest.STATUS_APPROVED,
        ).exists()
        if not approved:
            return Response(
                error_payload(
                    "invitation_pending", "This invitation is awaiting a second staff approval."
                ),
                status=403,
            )
        if User.objects.filter(username__iexact=invitation.username).exists():
            return Response(
                error_payload("duplicate_username", "That staff username is already in use."),
                status=400,
            )
        try:
            validate_password(password)
        except DjangoValidationError as exc:
            return Response(
                error_payload(
                    "weak_password",
                    "Password does not meet complexity requirements.",
                    {"password": list(exc.messages)},
                ),
                status=400,
            )
        user = User.objects.create_user(
            username=invitation.username, password=password, is_staff=True
        )
        StaffMember.objects.create(user=user, role=invitation.role)
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["accepted_at", "updated_at"])
        return Response(
            {"status": "staff_account_created", "username": user.username, "mfa_required": True},
            status=201,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        logout(request)
        return Response({"status": "logged_out"}, status=status.HTTP_200_OK)


class AuthMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(format_user_me(request.user), status=status.HTTP_200_OK)


class StaffMFAEnrollView(APIView):
    permission_classes = [ActiveStaffAccountRequired]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "staff_mfa"

    def post(self, request: Request) -> Response:
        member = staff_member_for(request.user)
        if member is None:
            return Response(
                error_payload("staff_access_required", "Active staff access is required."),
                status=403,
            )
        if member.mfa_is_enrolled:
            return Response(
                error_payload(
                    "mfa_already_enrolled", "Contact an administrator to reset staff MFA."
                ),
                status=409,
            )
        secret = generate_totp_secret()
        request.session["staff_mfa_pending_secret"] = secret
        return Response(
            {"secret": secret, "otpauth_uri": otpauth_uri(request.user.username, secret)}
        )


class StaffMFAVerifyView(APIView):
    permission_classes = [ActiveStaffAccountRequired]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "staff_mfa"

    def post(self, request: Request) -> Response:
        member = staff_member_for(request.user)
        code = str(request.data.get("code") or "")
        if member is None:
            return Response(
                error_payload("staff_access_required", "Active staff access is required."),
                status=403,
            )
        if member.mfa_is_enrolled:
            try:
                secret = decrypt_secret(member.mfa_secret)
            except ValueError:
                return Response(
                    error_payload(
                        "mfa_configuration_error", "Staff MFA requires administrative recovery."
                    ),
                    status=503,
                )
        else:
            secret = str(request.session.get("staff_mfa_pending_secret") or "")
        if not verify_totp(secret, code):
            return Response(
                error_payload("invalid_mfa_code", "The verification code is invalid."), status=401
            )

        codes: list[str] = []
        if not member.mfa_is_enrolled:
            codes = generate_recovery_codes()
            member.mfa_secret = encrypt_secret(secret)
            member.mfa_enrolled_at = timezone.now()
        member.last_mfa_verified_at = timezone.now()
        member.save(
            update_fields=["mfa_secret", "mfa_enrolled_at", "last_mfa_verified_at", "updated_at"]
        )
        request.session.pop("staff_mfa_pending_secret", None)
        request.session.cycle_key()
        request.session["staff_mfa_verified"] = True
        request.session["staff_mfa_verified_at"] = timezone.now().isoformat()
        request.session.set_expiry(settings.STAFF_MFA_SESSION_SECONDS)
        if codes:
            MFARecoveryCode.objects.bulk_create(
                [
                    MFARecoveryCode(staff_member=member, code_hash=hash_recovery_code(code))
                    for code in codes
                ]
            )
            return Response({"status": "mfa_enrolled", "recovery_codes": codes})
        return Response({"status": "mfa_verified"})


class StaffMFARecoveryView(APIView):
    permission_classes = [ActiveStaffAccountRequired]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "staff_mfa"

    def post(self, request: Request) -> Response:
        member = staff_member_for(request.user)
        code_hash = hash_recovery_code(str(request.data.get("code") or ""))
        recovery = MFARecoveryCode.objects.filter(
            staff_member=member, code_hash=code_hash, used_at__isnull=True
        ).first()
        if recovery is None:
            return Response(
                error_payload(
                    "invalid_recovery_code", "The recovery code is invalid or already used."
                ),
                status=401,
            )
        recovery.used_at = timezone.now()
        recovery.save(update_fields=["used_at", "updated_at"])
        member.last_mfa_verified_at = timezone.now()
        member.save(update_fields=["last_mfa_verified_at", "updated_at"])
        request.session.cycle_key()
        request.session.pop("staff_mfa_pending_secret", None)
        request.session["staff_mfa_verified"] = True
        request.session["staff_mfa_verified_at"] = timezone.now().isoformat()
        request.session.set_expiry(settings.STAFF_MFA_SESSION_SECONDS)
        return Response({"status": "mfa_verified"})


class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request: Request) -> Response:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        data = request.data

        if "bio" in data:
            profile.bio = str(data["bio"])[:500]
        if "avatar_url" in data:
            profile.avatar_url = str(data["avatar_url"])[:500]
        if "country" in data:
            profile.country = str(data["country"])[:64]
        if "phone" in data:
            profile.phone = str(data["phone"])[:30]
            if not profile.phone_verification_status == UserProfile.VERIFICATION_STATUS_VERIFIED:
                profile.phone_verification_status = UserProfile.VERIFICATION_STATUS_UNVERIFIED
        if "recovery_contact_name" in data:
            profile.recovery_contact_name = str(data["recovery_contact_name"])[:120]
        if "recovery_contact_email" in data:
            profile.recovery_contact_email = str(data["recovery_contact_email"])[:254]
        if "recovery_contact_phone" in data:
            profile.recovery_contact_phone = str(data["recovery_contact_phone"])[:30]
        if "recovery_contact_relationship" in data:
            profile.recovery_contact_relationship = str(data["recovery_contact_relationship"])[:50]

        profile.save()
        return Response(format_user_me(request.user), status=status.HTTP_200_OK)


class RoleSwitchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        target_mode = (request.data.get("target_mode") or "").strip().lower()
        if target_mode not in (UserProfile.MODE_STUDENT, UserProfile.MODE_TEACHER):
            return Response(
                error_payload("invalid_mode", "target_mode must be 'student' or 'teacher'."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if target_mode == UserProfile.MODE_TEACHER:
            if not hasattr(user, "teacher_profile"):
                TeacherProfile.objects.create(
                    user=user, verification_status=TeacherProfile.STATUS_UNVERIFIED
                )

        if target_mode == UserProfile.MODE_STUDENT:
            if not hasattr(user, "student_profile"):
                StudentProfile.objects.create(user=user, is_private=True)

        profile.active_mode = target_mode
        profile.save(update_fields=["active_mode", "updated_at"])

        return Response(
            {
                "status": "mode_switched",
                "active_mode": profile.active_mode,
                "is_verified_teacher": profile.is_verified_teacher,
            },
            status=status.HTTP_200_OK,
        )


class StudentOnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user = request.user
        student_profile, _ = StudentProfile.objects.get_or_create(user=user)
        data = request.data

        level_id = data.get("level_id")
        if level_id:
            level = Level.objects.filter(id=level_id).first()
            if not level:
                return Response(
                    error_payload("invalid_level", "The specified academic level does not exist."),
                    status=status.HTTP_400_BAD_REQUEST,
                )
            student_profile.level = level

        if "target_exam" in data:
            student_profile.target_exam = str(data["target_exam"])[:50]
        if "avatar_preset" in data:
            student_profile.avatar_preset = str(data["avatar_preset"])[:50]

        subject_ids = data.get("subject_ids", [])
        if not isinstance(subject_ids, list) or any(
            isinstance(subject_id, bool) or not isinstance(subject_id, int) or subject_id < 1
            for subject_id in subject_ids
        ):
            return Response(
                error_payload("validation_error", "subject_ids must be a list."), status=400
            )
        subjects = list(Subject.objects.filter(id__in=subject_ids))
        if len(subjects) != len(set(subject_ids)):
            return Response(
                error_payload("invalid_subject", "One or more selected subjects do not exist."),
                status=400,
            )

        student_profile.save()
        student_profile.subjects.set(subjects)

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.onboarding_completed = True
        profile.save(update_fields=["onboarding_completed", "updated_at"])

        return Response(format_user_me(user), status=status.HTTP_200_OK)


class UserPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        pref, _ = UserPreference.objects.get_or_create(user=request.user)
        return Response(
            {
                "theme": pref.theme,
                "reduced_motion": pref.reduced_motion,
                "high_contrast": pref.high_contrast,
                "email_notifications": pref.email_notifications,
                "profile_visibility": pref.profile_visibility,
            }
        )

    def patch(self, request: Request) -> Response:
        pref, _ = UserPreference.objects.get_or_create(user=request.user)
        data = request.data

        if "theme" in data:
            theme = data["theme"]
            if theme in (
                UserPreference.THEME_LIGHT,
                UserPreference.THEME_DARK,
                UserPreference.THEME_SYSTEM,
            ):
                pref.theme = theme
        if "reduced_motion" in data:
            pref.reduced_motion = bool(data["reduced_motion"])
        if "high_contrast" in data:
            pref.high_contrast = bool(data["high_contrast"])
        if "email_notifications" in data:
            pref.email_notifications = bool(data["email_notifications"])
        if "profile_visibility" in data:
            vis = data["profile_visibility"]
            if vis in (UserPreference.VISIBILITY_PRIVATE, UserPreference.VISIBILITY_CONNECTIONS):
                pref.profile_visibility = vis

        pref.save()
        return Response(
            {
                "theme": pref.theme,
                "reduced_motion": pref.reduced_motion,
                "high_contrast": pref.high_contrast,
                "email_notifications": pref.email_notifications,
                "profile_visibility": pref.profile_visibility,
            }
        )


class PolicyAcceptanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        policy_type = (request.data.get("policy_type") or "").strip().lower()
        version = (request.data.get("version") or "1.0").strip()

        if policy_type not in (PolicyAcceptance.POLICY_TERMS, PolicyAcceptance.POLICY_PRIVACY):
            return Response(
                error_payload("invalid_policy", "policy_type must be 'terms' or 'privacy'."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        ip = get_client_ip(request)
        acceptance, created = PolicyAcceptance.objects.get_or_create(
            user=request.user,
            policy_type=policy_type,
            version=version,
            defaults={"ip_address": ip},
        )

        return Response(
            {
                "policy_type": acceptance.policy_type,
                "version": acceptance.version,
                "accepted_at": acceptance.accepted_at.isoformat(),
                "created": created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class TeacherVerificationApplicationView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "teacher_verification"

    def get(self, request: Request) -> Response:
        teacher_profile = getattr(request.user, "teacher_profile", None)
        if not teacher_profile:
            return Response(
                {"has_teacher_profile": False, "verification_status": "unverified"},
                status=status.HTTP_200_OK,
            )

        latest_app = (
            TeacherVerification.objects.filter(teacher=teacher_profile)
            .order_by("-created_at")
            .first()
        )

        return Response(
            {
                "has_teacher_profile": True,
                "verification_status": teacher_profile.verification_status,
                "verified_at": (
                    teacher_profile.verified_at.isoformat() if teacher_profile.verified_at else None
                ),
                "title": teacher_profile.title,
                "school_affiliation": teacher_profile.school_affiliation,
                "subject_specialization": teacher_profile.subject_specialization,
                "latest_application": (
                    {
                        "id": latest_app.id,
                        "status": latest_app.status,
                        "id_document_type": latest_app.id_document_type,
                        "id_reference": latest_app.id_reference,
                        "submitted_at": latest_app.created_at.isoformat(),
                        "rejection_reason": latest_app.rejection_reason,
                    }
                    if latest_app
                    else None
                ),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request: Request) -> Response:
        user = request.user
        teacher_profile, _ = TeacherProfile.objects.get_or_create(user=user)

        data = request.data
        title = (data.get("title") or "Teacher").strip()
        school_affiliation = (data.get("school_affiliation") or "").strip()
        subject_specialization = (data.get("subject_specialization") or "").strip()
        try:
            years_of_experience = int(data.get("years_of_experience") or 0)
        except (TypeError, ValueError):
            return Response(
                error_payload("validation_error", "years_of_experience must be a whole number."),
                status=400,
            )
        id_document_type = (data.get("id_document_type") or "").strip()
        id_reference = (data.get("id_reference") or "").strip()
        notes = (data.get("notes") or "").strip()

        if not id_document_type or not id_reference:
            return Response(
                error_payload(
                    "validation_error",
                    "Document type and reference ID are required for verification.",
                    {
                        "id_document_type": ["Required if blank."],
                        "id_reference": ["Required if blank."],
                    },
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update teacher profile attributes
        teacher_profile.title = title[:50]
        teacher_profile.school_affiliation = school_affiliation[:200]
        teacher_profile.subject_specialization = subject_specialization[:200]
        teacher_profile.years_of_experience = max(0, years_of_experience)
        teacher_profile.verification_status = TeacherProfile.STATUS_PENDING
        teacher_profile.save()

        # Create intake application record
        app = TeacherVerification.objects.create(
            teacher=teacher_profile,
            id_document_type=id_document_type[:80],
            id_reference=id_reference[:120],
            notes=notes,
            status=TeacherVerification.STATUS_PENDING,
        )

        return Response(
            {
                "status": "application_submitted",
                "verification_status": teacher_profile.verification_status,
                "application_id": app.id,
                "submitted_at": app.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(csrf_protect, name="dispatch")
class PasswordRecoveryView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_recovery"

    def post(self, request: Request) -> Response:
        identifier = (request.data.get("identifier") or "").strip()
        if not identifier:
            return Response(
                error_payload("validation_error", "Username or email is required."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Look up user safely
        matched_user = (
            User.objects.filter(username__iexact=identifier).first()
            or User.objects.filter(email__iexact=identifier).first()
        )

        response_payload = {
            "status": "recovery_initiated",
            "message": "If an account exists, recovery instructions have been initiated.",
        }

        if matched_user and matched_user.email:
            token = default_token_generator.make_token(matched_user)
            base_url = getattr(settings, "PUBLIC_WEB_URL", "http://localhost:3000").rstrip("/")
            reset_url = f"{base_url}/auth/recovery/confirm?uid={matched_user.pk}&token={token}"
            try:
                send_mail(
                    "Reset your PracticalLab Africa password",
                    (
                        "Use this link to reset your password. It expires when used or when a "
                        f"new reset link is issued:\n\n{reset_url}\n\n"
                        "If you did not request this, ignore this message."
                    ),
                    settings.DEFAULT_FROM_EMAIL,
                    [matched_user.email],
                    fail_silently=False,
                )
            except Exception:
                # Keep account existence private and do not return reset credentials.
                pass

        return Response(response_payload, status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name="dispatch")
class PasswordRecoveryConfirmView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_recovery_confirm"

    def post(self, request: Request) -> Response:
        user_id = request.data.get("user_id")
        token = (request.data.get("token") or "").strip()
        new_password = request.data.get("new_password") or ""

        if not user_id or not token or not new_password:
            return Response(
                error_payload("validation_error", "user_id, token, and new_password are required."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(id=user_id).first()
        if not user or not default_token_generator.check_token(user, token):
            return Response(
                error_payload("invalid_token", "Recovery token is invalid or has expired."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response(
                error_payload(
                    "weak_password",
                    "Password does not meet complexity requirements.",
                    {"password": list(exc.messages)},
                ),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response({"status": "password_reset_success"}, status=status.HTTP_200_OK)


class EmailVerificationSendView(APIView):
    """Send email verification code to the user's registered email."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_recovery"

    def post(self, request: Request) -> Response:
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if not user.email:
            return Response(
                error_payload("validation_error", "No email address on file."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.email_verification_status == UserProfile.VERIFICATION_STATUS_VERIFIED:
            return Response(
                {"status": "already_verified", "email": user.email},
                status=status.HTTP_200_OK,
            )

        # Generate a 6-digit verification code
        import secrets
        code = f"{secrets.randbelow(1000000):06d}"
        request.session["email_verification_code"] = code
        request.session["email_verification_code_at"] = timezone.now().isoformat()
        request.session.set_expiry(3600)  # 1 hour

        try:
            send_mail(
                "Verify your email address",
                f"Your PracticalLab Africa verification code is: {code}\n\nThis code expires in 1 hour.",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception:
            return Response(
                error_payload("email_error", "Could not send verification email. Try again later."),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"status": "verification_sent", "email": user.email}, status=status.HTTP_200_OK)


class EmailVerificationConfirmView(APIView):
    """Confirm email verification code."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_recovery_confirm"

    def post(self, request: Request) -> Response:
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        code = (request.data.get("code") or "").strip()

        if not code:
            return Response(
                error_payload("validation_error", "Verification code is required."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        stored_code = request.session.get("email_verification_code")
        stored_at = request.session.get("email_verification_code_at")

        if not stored_code or stored_code != code:
            return Response(
                error_payload("invalid_code", "Invalid or expired verification code."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if stored_at:
            from datetime import datetime
            try:
                code_time = datetime.fromisoformat(stored_at.replace("Z", "+00:00"))
                if timezone.now() - code_time > datetime.timedelta(hours=1):
                    return Response(
                        error_payload("expired_code", "Verification code has expired."),
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except ValueError:
                pass

        # Mark email as verified
        profile.email_verification_status = UserProfile.VERIFICATION_STATUS_VERIFIED
        profile.email_verified_at = timezone.now()
        profile.save(update_fields=["email_verification_status", "email_verified_at", "updated_at"])

        # Clear session
        request.session.pop("email_verification_code", None)
        request.session.pop("email_verification_code_at", None)

        return Response({"status": "email_verified"}, status=status.HTTP_200_OK)


class PhoneVerificationSendView(APIView):
    """Send phone verification code via SMS (placeholder - requires SMS provider)."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_recovery"

    def post(self, request: Request) -> Response:
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if not profile.phone:
            return Response(
                error_payload("validation_error", "No phone number on file."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.phone_verification_status == UserProfile.VERIFICATION_STATUS_VERIFIED:
            return Response(
                {"status": "already_verified", "phone": profile.phone},
                status=status.HTTP_200_OK,
            )

        # Generate a 6-digit verification code
        import secrets
        code = f"{secrets.randbelow(1000000):06d}"
        request.session["phone_verification_code"] = code
        request.session["phone_verification_code_at"] = timezone.now().isoformat()
        request.session.set_expiry(3600)  # 1 hour

        # TODO: Integrate with SMS provider (Termii, Twilio, etc.)
        # For now, return code in response for development testing
        # In production, this would call an SMS API
        if settings.DEBUG:
            return Response(
                {"status": "verification_sent", "phone": profile.phone, "dev_code": code},
                status=status.HTTP_200_OK,
            )

        # Placeholder for SMS integration
        return Response(
            {"status": "verification_sent", "phone": profile.phone},
            status=status.HTTP_200_OK,
        )


class PhoneVerificationConfirmView(APIView):
    """Confirm phone verification code."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_recovery_confirm"

    def post(self, request: Request) -> Response:
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        code = (request.data.get("code") or "").strip()

        if not code:
            return Response(
                error_payload("validation_error", "Verification code is required."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        stored_code = request.session.get("phone_verification_code")
        stored_at = request.session.get("phone_verification_code_at")

        if not stored_code or stored_code != code:
            return Response(
                error_payload("invalid_code", "Invalid or expired verification code."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if stored_at:
            from datetime import datetime
            try:
                code_time = datetime.fromisoformat(stored_at.replace("Z", "+00:00"))
                if timezone.now() - code_time > datetime.timedelta(hours=1):
                    return Response(
                        error_payload("expired_code", "Verification code has expired."),
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except ValueError:
                pass

        # Mark phone as verified
        profile.phone_verification_status = UserProfile.VERIFICATION_STATUS_VERIFIED
        profile.phone_verified_at = timezone.now()
        profile.save(update_fields=["phone_verification_status", "phone_verified_at", "updated_at"])

        # Clear session
        request.session.pop("phone_verification_code", None)
        request.session.pop("phone_verification_code_at", None)

        return Response({"status": "phone_verified"}, status=status.HTTP_200_OK)


class AgeConsentView(APIView):
    """Record age consent for minor users."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if not profile.is_minor:
            return Response(
                error_payload("validation_error", "Age consent only applies to minor accounts."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.age_consent_recorded_at:
            return Response(
                {"status": "already_recorded", "consented_at": profile.age_consent_recorded_at.isoformat()},
                status=status.HTTP_200_OK,
            )

        consent_given = bool(request.data.get("consent"))
        if not consent_given:
            return Response(
                error_payload("validation_error", "Consent must be given."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.age_consent_recorded_at = timezone.now()
        profile.save(update_fields=["age_consent_recorded_at", "updated_at"])

        return Response({"status": "consent_recorded"}, status=status.HTTP_200_OK)


class MinorRecoveryView(APIView):
    """Account recovery for minors using their recovery contact."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_recovery"

    def post(self, request: Request) -> Response:
        identifier = (request.data.get("identifier") or "").strip()
        contact_type = (request.data.get("contact_type") or "").strip()  # "email" or "phone"
        contact_value = (request.data.get("contact_value") or "").strip().lower()

        if not identifier or not contact_type or not contact_value:
            return Response(
                error_payload("validation_error", "Identifier, contact_type, and contact_value are required."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if contact_type not in ("email", "phone"):
            return Response(
                error_payload("validation_error", "contact_type must be 'email' or 'phone'."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Look up user
        matched_user = (
            User.objects.filter(username__iexact=identifier).first()
            or User.objects.filter(email__iexact=identifier).first()
        )

        response_payload = {
            "status": "recovery_initiated",
            "message": "If a minor account exists with matching recovery contact, instructions have been sent.",
        }

        if matched_user:
            profile, _ = UserProfile.objects.get_or_create(user=matched_user)

            # Only allow recovery for minors
            if profile.is_minor:
                if contact_type == "email" and profile.recovery_contact_email.lower() == contact_value:
                    # Send recovery email to recovery contact
                    try:
                        token = default_token_generator.make_token(matched_user)
                        base_url = getattr(settings, "PUBLIC_WEB_URL", "http://localhost:3000").rstrip("/")
                        reset_url = f"{base_url}/auth/recovery/confirm?uid={matched_user.pk}&token={token}"
                        send_mail(
                            "PracticalLab Africa - Minor Account Recovery",
                            (
                                f"A recovery request was made for minor account '{matched_user.username}'.\n\n"
                                f"Use this link to reset the password. It expires when used or when a "
                                f"new reset link is issued:\n\n{reset_url}\n\n"
                                "If you did not request this, ignore this message."
                            ),
                            settings.DEFAULT_FROM_EMAIL,
                            [profile.recovery_contact_email],
                            fail_silently=False,
                        )
                    except Exception:
                        pass

                elif contact_type == "phone" and profile.recovery_contact_phone == contact_value:
                    # TODO: Send SMS to recovery contact
                    # For now, just log (production needs SMS integration)
                    pass

        return Response(response_payload, status=status.HTTP_200_OK)
