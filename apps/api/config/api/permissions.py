from datetime import UTC, datetime, timedelta

from core.models import StaffMember
from django.conf import settings
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


def staff_member_for(user) -> StaffMember | None:
    if not user or not user.is_authenticated:
        return None
    return StaffMember.objects.filter(user=user, is_active=True).select_related("role").first()


class ActiveStaffAccountRequired(BasePermission):
    message = "Staff access requires an active invite-only staff account."

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        if not (user and user.is_authenticated and user.is_active and user.is_staff):
            return False
        return StaffMember.objects.filter(user=user, is_active=True).exists()


class StaffMFARequired(ActiveStaffAccountRequired):
    message = (
        "Staff access requires an active staff account and verified multi-factor authentication."
    )

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not super().has_permission(request, view):
            return False
        member = staff_member_for(request.user)
        if member is None or not member.mfa_is_enrolled:
            return False
        if request.session.get("staff_mfa_verified") is not True:
            return False
        verified_at = request.session.get("staff_mfa_verified_at")
        if not isinstance(verified_at, str):
            return False
        try:
            stamp = datetime.fromisoformat(verified_at)
            if stamp.tzinfo is None:
                stamp = stamp.replace(tzinfo=UTC)
        except ValueError:
            return False
        if datetime.now(UTC) - stamp > timedelta(seconds=settings.STAFF_MFA_SESSION_SECONDS):
            request.session.pop("staff_mfa_verified", None)
            request.session.pop("staff_mfa_verified_at", None)
            return False
        return True


class StaffPermissionByMethod(BasePermission):
    message = "Your staff role does not permit this action."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not StaffMFARequired().has_permission(request, view):
            return False
        member = staff_member_for(request.user)
        if member is None:
            return False
        required = getattr(view, "staff_permissions", {}).get(request.method)
        if required is None:
            return False
        if member.role.name == "Super Admin":
            return True
        return member.role.permissions.filter(code__in=required).exists()


def require_staff_permission(*codes: str):
    class HasStaffPermission(StaffMFARequired):
        def has_permission(self, request: Request, view: APIView) -> bool:
            if not super().has_permission(request, view):
                return False
            member = staff_member_for(request.user)
            if member is None:
                return False
            if member.role.name == "Super Admin":
                return True
            return member.role.permissions.filter(code__in=codes).exists()

    return HasStaffPermission
