from __future__ import annotations

from core.models import Permission, StaffRole

PERMISSION_CODES = (
    "curriculum.read",
    "curriculum.write",
    "content.review",
    "content.publish",
    "teachers.verify",
    "users.search",
    "moderation.read",
    "audit.read",
    "staff.invite",
    "approvals.decide",
)

ROLE_PERMISSIONS = {
    "Super Admin": PERMISSION_CODES,
    "Curriculum Manager": (
        "curriculum.read",
        "curriculum.write",
        "content.review",
        "audit.read",
    ),
    "Reviewer": (
        "curriculum.read",
        "content.review",
        "content.publish",
        "approvals.decide",
        "audit.read",
    ),
    "Moderator": (
        "users.search",
        "moderation.read",
        "audit.read",
    ),
}


def ensure_default_roles() -> dict[str, StaffRole]:
    permissions = {
        code: Permission.objects.get_or_create(code=code, defaults={"description": code})[0]
        for code in PERMISSION_CODES
    }
    roles: dict[str, StaffRole] = {}
    for name, codes in ROLE_PERMISSIONS.items():
        role, _ = StaffRole.objects.get_or_create(name=name)
        role.permissions.set([permissions[code] for code in codes])
        roles[name] = role
    return roles
