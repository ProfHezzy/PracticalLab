from __future__ import annotations

import hashlib
import json

from django.contrib.auth.models import AbstractBaseUser
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from core.models import (
    ApprovalRequest,
    AuditLog,
    Experiment,
    LessonVersion,
    StaffInvitation,
    UserProfile,
)
from core.experiment_schema import validate_experiment_definition


def queue_approval(
    *,
    requester: AbstractBaseUser,
    action: str,
    target_model: str,
    target_id: int,
    payload: dict | None = None,
    reason: str = "",
) -> ApprovalRequest:
    existing = ApprovalRequest.objects.filter(
        action=action,
        target_model=target_model,
        target_id=target_id,
        status=ApprovalRequest.STATUS_PENDING,
    ).first()
    if existing is not None:
        return existing
    request = ApprovalRequest.objects.create(
        requester=requester,
        action=action,
        target_model=target_model,
        target_id=target_id,
        payload=payload or {},
        reason=reason,
    )
    AuditLog.objects.create(
        actor=requester,
        action=f"approval_requested_{action}",
        target_model="ApprovalRequest",
        target_id=request.id,
        details={"target_model": target_model, "target_id": target_id},
    )
    return request


@transaction.atomic
def decide_approval(
    *, approval: ApprovalRequest, actor: AbstractBaseUser, approve: bool
) -> ApprovalRequest:
    approval = ApprovalRequest.objects.select_for_update().get(pk=approval.pk)
    if approval.status != ApprovalRequest.STATUS_PENDING:
        raise ValidationError("This approval request has already been decided.")
    if approval.requester_id == actor.id:
        raise PermissionError("self_approval_forbidden")

    approval.decided_by = actor
    if approve:
        _execute(approval)
        approval.status = ApprovalRequest.STATUS_APPROVED
    else:
        approval.status = ApprovalRequest.STATUS_REJECTED

    approval.decided_by = actor
    approval.decided_at = timezone.now()
    approval.save(update_fields=["status", "decided_by", "decided_at", "updated_at"])
    AuditLog.objects.create(
        actor=actor,
        action=f"approval_{'approved' if approve else 'rejected'}_{approval.action}",
        target_model="ApprovalRequest",
        target_id=approval.id,
        details={
            "target_model": approval.target_model,
            "target_id": approval.target_id,
            "requester_id": approval.requester_id,
        },
    )
    return approval


def _execute(approval: ApprovalRequest) -> None:
    if approval.action == "staff_invitation":
        if not StaffInvitation.objects.filter(
            id=approval.target_id, accepted_at__isnull=True
        ).exists():
            raise NotFound()
        return

    if approval.action in {"lesson_version_approve", "lesson_version_publish"}:
        version = LessonVersion.objects.select_for_update().filter(pk=approval.target_id).first()
        if version is None:
            raise NotFound()
        if approval.action == "lesson_version_approve":
            if version.status != LessonVersion.STATUS_REVIEW:
                raise ValidationError("Only lesson versions in review can be approved.")
            version.status = LessonVersion.STATUS_APPROVED
            version.save(update_fields=["status", "updated_at"])
        else:
            if version.status != LessonVersion.STATUS_APPROVED:
                raise ValidationError("Only approved lesson versions can be published.")
            assets = list(version.assets.order_by("pk"))
            if any(asset.kind in {"audio", "video"} for asset in assets) and not (
                version.transcript.strip() and version.captions.strip()
            ):
                raise ValidationError("Audio/video lessons require both a transcript and captions.")
            if any(
                asset.kind in {"audio", "video"} for asset in assets
            ) and not version.captions.lstrip().startswith("WEBVTT"):
                raise ValidationError("Media captions must use the WebVTT format.")
            digest_payload = {
                "lesson_id": version.lesson_id,
                "version": version.version,
                "title": version.title,
                "content": version.content,
                "estimated_minutes": version.estimated_minutes,
                "safety_notes": version.safety_notes,
                "transcript": version.transcript,
                "captions": version.captions,
                "assets": [
                    {
                        "kind": asset.kind,
                        "url": asset.file_url,
                        "mime_type": asset.mime_type,
                        "size_bytes": asset.size_bytes,
                        "sha256": asset.sha256,
                        "license": asset.license_name,
                        "license_url": asset.license_url,
                        "attribution": asset.attribution,
                    }
                    for asset in assets
                ],
            }
            version.content_hash = hashlib.sha256(
                json.dumps(digest_payload, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest()
            version.status = LessonVersion.STATUS_PUBLISHED
            version.published_at = timezone.now()
            version.save(update_fields=["content_hash", "status", "published_at", "updated_at"])
        AuditLog.objects.create(
            actor=approval.decided_by,
            action=f"{approval.action}_executed",
            target_model="LessonVersion",
            target_id=version.id,
            details={"version": version.version, "lesson_id": version.lesson_id},
        )
        return

    if approval.action == "content_publish":
        experiment = Experiment.objects.filter(id=approval.target_id).first()
        if experiment is None:
            raise NotFound()
        if experiment.status != Experiment.STATUS_APPROVED:
            raise ValidationError("Only approved experiments can be published.")
        version = experiment.content_versions.order_by("-created_at").first()
        if version is not None:
            if version.definition:
                errors = validate_experiment_definition(version.definition)
                current_hash = hashlib.sha256(
                    json.dumps(
                        version.definition,
                        ensure_ascii=False,
                        sort_keys=True,
                        separators=(",", ":"),
                    ).encode("utf-8")
                ).hexdigest()
                if errors or current_hash != version.definition_hash:
                    raise ValidationError("The experiment definition changed or no longer validates.")
                if version.schema_version != version.definition.get("schemaVersion"):
                    raise ValidationError("Experiment schema metadata does not match its definition.")
            version.status = "published"
            version.published_at = timezone.now()
            version.save(update_fields=["status", "published_at", "updated_at"])
            AuditLog.objects.create(
                actor=approval.decided_by,
                action="experiment_definition_published",
                target_model="ContentVersion",
                target_id=version.id,
                details={"experiment_id": experiment.id, "version": version.version, "definition_hash": version.definition_hash},
            )
        return

    if approval.action == "content_approve":
        experiment = Experiment.objects.filter(id=approval.target_id).first()
        if experiment is None:
            raise NotFound()
        previous = experiment.status
        experiment.status = Experiment.STATUS_APPROVED
        experiment.save(update_fields=["status", "updated_at"])
        version = experiment.content_versions.order_by("-created_at").first()
        if version is not None:
            version.status = "review"
            version.save(update_fields=["status", "updated_at"])
        AuditLog.objects.create(
            actor=approval.decided_by,
            action="content_review_approve",
            target_model="Experiment",
            target_id=experiment.id,
            details={
                "previous_status": previous,
                "new_status": experiment.status,
                "requested_by": approval.requester_id,
            },
        )
        return

    if approval.action == "teacher_verification_approve":
        _set_teacher_verification(approval, verified=True)
        return

    if approval.action == "teacher_verification_reject":
        _set_teacher_verification(approval, verified=False)
        return

    raise ValidationError("Unsupported approval action.")


def _set_teacher_verification(approval: ApprovalRequest, *, verified: bool) -> None:
    profile = UserProfile.objects.filter(user_id=approval.target_id).first()
    if profile is None:
        raise NotFound()
    previous = profile.is_verified_teacher
    profile.is_verified_teacher = verified
    profile.save(update_fields=["is_verified_teacher", "updated_at"])
    teacher_profile = getattr(profile.user, "teacher_profile", None)
    if teacher_profile is not None:
        from django.utils import timezone

        from core.models import TeacherProfile, TeacherVerification

        teacher_profile.verification_status = (
            TeacherProfile.STATUS_VERIFIED if verified else TeacherProfile.STATUS_REJECTED
        )
        teacher_profile.verified_at = timezone.now() if verified else None
        teacher_profile.save(update_fields=["verification_status", "verified_at", "updated_at"])
        application = (
            TeacherVerification.objects.filter(
                teacher=teacher_profile, status=TeacherVerification.STATUS_PENDING
            )
            .order_by("-created_at")
            .first()
        )
        if application is not None:
            application.status = (
                TeacherVerification.STATUS_APPROVED
                if verified
                else TeacherVerification.STATUS_REJECTED
            )
            application.reviewed_by = approval.decided_by
            application.reviewed_at = timezone.now()
            application.rejection_reason = "Verification was not approved." if not verified else ""
            application.save(
                update_fields=[
                    "status",
                    "reviewed_by",
                    "reviewed_at",
                    "rejection_reason",
                    "updated_at",
                ]
            )
    AuditLog.objects.create(
        actor=approval.decided_by,
        action="teacher_verification_approve" if verified else "teacher_verification_reject",
        target_model="UserProfile",
        target_id=profile.user_id,
        details={
            "previous_state": previous,
            "new_state": profile.is_verified_teacher,
            "requested_by": approval.requester_id,
        },
    )


def serialize_approval(approval: ApprovalRequest) -> dict:
    return {
        "id": approval.id,
        "action": approval.action,
        "target_model": approval.target_model,
        "target_id": approval.target_id,
        "status": approval.status,
        "requester_id": approval.requester_id,
        "created_at": approval.created_at.isoformat(),
        "reason": approval.reason,
    }
