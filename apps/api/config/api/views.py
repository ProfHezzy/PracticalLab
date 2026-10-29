import hashlib
import json
import re
import secrets
from datetime import timedelta
from urllib.parse import urlparse

import redis
from core.approvals import decide_approval, queue_approval, serialize_approval
from core.experiment_schema import RUNTIME_VERSION, SCHEMA_VERSION, validate_experiment_definition
from core.models import (
    ApprovalRequest,
    AuditLog,
    ContentVersion,
    Course,
    Experiment,
    ExperimentSession,
    ExperimentSessionEvent,
    Lesson,
    LessonAsset,
    LessonVersion,
    Level,
    ModerationCase,
    SchemeOfWork,
    StaffInvitation,
    StaffRole,
    Subject,
    TeacherProfile,
    Topic,
    UserProfile,
)
from core.staffing import ensure_default_roles
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from django.db import OperationalError, connection, transaction
from django.db.models import OuterRef, Subquery, Sum
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from config.api.permissions import (
    ActiveStaffAccountRequired,
    StaffPermissionByMethod,
    staff_member_for,
)
from config.settings import REDIS_URL

redis_client = redis.Redis.from_url(REDIS_URL, socket_connect_timeout=1, socket_timeout=1)


class HealthLiveView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


class HealthReadyView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except OperationalError:
            return Response(
                {"status": "unavailable", "checks": {"database": "unavailable"}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            redis_client.ping()
        except redis.RedisError:
            return Response(
                {"status": "unavailable", "checks": {"database": "ok", "cache": "unavailable"}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({"status": "ok", "checks": {"database": "ok", "cache": "ok"}})


class CsrfTokenView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response({"csrfToken": get_token(request)})


class StaffAccessView(APIView):
    permission_classes = [ActiveStaffAccountRequired]

    def get(self, request: Request) -> Response:
        member = staff_member_for(request.user)
        return Response(
            {
                "status": "authorized",
                "username": request.user.username,
                "user_id": request.user.id,
                "role": member.role.name,
                "mfa_enrolled": member.mfa_is_enrolled,
                "mfa_verified": request.session.get("staff_mfa_verified") is True,
            }
        )


class AdminSubjectListView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("curriculum.read",), "POST": ("curriculum.write",)}

    def get(self, request: Request) -> Response:
        subjects = Subject.objects.order_by("name").values("id", "name", "code", "description")
        return Response(list(subjects))

    def post(self, request: Request) -> Response:
        name = request.data.get("name", "").strip()
        code = request.data.get("code", "").strip()
        if not name or not code:
            return Response(
                {"error": {"code": "invalid_input", "message": "name and code are required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subject = Subject.objects.create(
            name=name, code=code, description=request.data.get("description", "")
        )
        return Response(
            {
                "id": subject.id,
                "name": subject.name,
                "code": subject.code,
                "description": subject.description,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminCourseListView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("curriculum.read",)}

    def get(self, request: Request) -> Response:
        courses = (
            Course.objects.select_related("subject", "level")
            .order_by("title")
            .values(
                "id",
                "title",
                "description",
                "subject__name",
                "level__stage",
            )
        )
        return Response(list(courses))


class AdminTopicListView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("curriculum.read",)}

    def get(self, request: Request) -> Response:
        topics = (
            Topic.objects.select_related("scheme", "scheme__course", "scheme__course__subject")
            .order_by("scheme_id", "order")
            .values(
                "id",
                "title",
                "description",
                "order",
                "scheme__title",
                "scheme__course__title",
                "scheme__course__subject__name",
            )
        )
        return Response(list(topics))


class AdminOverviewView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("audit.read",)}

    def get(self, request: Request) -> Response:
        return Response(
            {
                "subjects": Subject.objects.count(),
                "courses": Course.objects.count(),
                "topics": Topic.objects.count(),
                "pending_teacher_verifications": TeacherProfile.objects.filter(
                    verification_status=TeacherProfile.STATUS_PENDING,
                ).count(),
                "open_reports": ModerationCase.objects.filter(
                    status=ModerationCase.STATUS_OPEN,
                ).count(),
                "latest_audit_action": AuditLog.objects.order_by("-created_at")
                .values_list(
                    "action",
                    flat=True,
                )
                .first(),
            }
        )


class AdminContentReviewView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("content.review",), "POST": ("content.review",)}

    def get(self, request: Request) -> Response:
        experiment_id = request.query_params.get("experiment_id")
        if not experiment_id:
            return Response(
                {
                    "error": {
                        "code": "invalid_input",
                        "message": "experiment_id is required.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        experiment = (
            Experiment.objects.select_related("subject", "topic", "created_by")
            .prefetch_related("content_versions")
            .get(id=experiment_id)
        )
        version = experiment.content_versions.order_by("-created_at").first()
        return Response(
            {
                "experiment_id": experiment.id,
                "title": experiment.title,
                "summary": experiment.summary,
                "status": experiment.status,
                "version_status": version.status if version else None,
                "preview": {
                    "title": experiment.title,
                    "summary": experiment.summary,
                    "difficulty": experiment.difficulty,
                    "subject": experiment.subject.name,
                    "topic": experiment.topic.title if experiment.topic else None,
                },
            }
        )

    def post(self, request: Request) -> Response:
        experiment_id = request.data.get("experiment_id")
        action = (request.data.get("action") or "").lower()
        if not experiment_id or action not in {"submit_review", "approve", "reject", "publish"}:
            return Response(
                {
                    "error": {
                        "code": "invalid_input",
                        "message": "experiment_id and a valid action are required.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        experiment = Experiment.objects.get(id=experiment_id)
        version = experiment.content_versions.order_by("-created_at").first()
        previous_status = experiment.status

        if action in {"approve", "publish"}:
            if action == "publish" and experiment.status != Experiment.STATUS_APPROVED:
                return Response(
                    {
                        "error": {
                            "code": "not_approved",
                            "message": "Only approved experiments can be published.",
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            pending = queue_approval(
                requester=request.user,
                action="content_approve" if action == "approve" else "content_publish",
                target_model="Experiment",
                target_id=experiment.id,
            )
            return Response(
                {"status": "approval_pending", "approval": serialize_approval(pending)},
                status=status.HTTP_202_ACCEPTED,
            )

        if action == "submit_review":
            experiment.status = Experiment.STATUS_REVIEW
            if version is not None:
                version.status = "review"
                version.save(update_fields=["status", "updated_at"])
        elif action == "approve":
            experiment.status = Experiment.STATUS_APPROVED
            if version is not None:
                version.status = "review"
                version.save(update_fields=["status", "updated_at"])
        elif action == "reject":
            experiment.status = Experiment.STATUS_REJECTED
            if version is not None:
                version.status = "draft"
                version.save(update_fields=["status", "updated_at"])
        elif action == "publish":
            if experiment.status != Experiment.STATUS_APPROVED:
                return Response(
                    {
                        "error": {
                            "code": "not_approved",
                            "message": "Only approved experiments can be published.",
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if version is not None:
                version.status = "published"
                version.published_at = timezone.now()
                version.save(update_fields=["status", "published_at", "updated_at"])

        experiment.save(update_fields=["status", "updated_at"])
        AuditLog.objects.create(
            actor=request.user,
            action=f"content_review_{action}",
            target_model="Experiment",
            target_id=experiment.id,
            details={
                "previous_status": previous_status,
                "new_status": experiment.status,
                "version_status": version.status if version is not None else None,
            },
        )

        return Response(
            {
                "experiment_id": experiment.id,
                "title": experiment.title,
                "status": experiment.status,
                "version_status": version.status if version is not None else None,
                "action": action,
            }
        )


class AdminExperimentDefinitionView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"POST": ("content.review",)}

    def post(self, request: Request) -> Response:
        definition = request.data.get("definition")
        errors = validate_experiment_definition(definition)
        if errors:
            return Response(
                {
                    "error": {
                        "code": "invalid_experiment_definition",
                        "message": "The experiment definition is not valid.",
                        "details": {"definition": errors},
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if request.data.get("subject_id") is None:
            return Response(
                {"error": {"code": "invalid_input", "message": "subject_id is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        subject = Subject.objects.filter(pk=request.data.get("subject_id")).first()
        if subject is None:
            return Response(
                {"error": {"code": "invalid_subject", "message": "Choose an available subject."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if definition["subject"].casefold() not in {
            subject.code.casefold(),
            subject.name.casefold(),
        }:
            return Response(
                {
                    "error": {
                        "code": "subject_mismatch",
                        "message": (
                            "The definition subject must match the selected curriculum subject."
                        ),
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        topic = None
        topic_id = request.data.get("topic_id")
        if topic_id is not None:
            topic = (
                Topic.objects.select_related("scheme__course__subject").filter(pk=topic_id).first()
            )
            if topic is None or topic.scheme.course.subject_id != subject.id:
                return Response(
                    {
                        "error": {
                            "code": "invalid_topic",
                            "message": "Choose a topic from the selected subject.",
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        title = request.data.get("title", definition["title"])
        summary = request.data.get("summary", "")
        changelog = request.data.get("changelog", "Initial experiment definition.")
        difficulty = request.data.get("difficulty", "beginner")
        if (
            not isinstance(title, str)
            or not title.strip()
            or len(title) > 200
            or not isinstance(summary, str)
            or len(summary) > 5000
            or not isinstance(changelog, str)
            or len(changelog) > 2000
            or difficulty not in {"beginner", "intermediate", "advanced"}
        ):
            return Response(
                {"error": {"code": "invalid_input", "message": "Experiment metadata is invalid."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        canonical = json.dumps(
            definition, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        )
        definition_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        version = f"{definition['version']}.0.0"
        experiment = Experiment.objects.filter(slug=definition["id"]).first()
        if experiment is not None and experiment.subject_id != subject.id:
            return Response(
                {
                    "error": {
                        "code": "subject_mismatch",
                        "message": "A new version must keep the experiment's original subject.",
                    }
                },
                status=status.HTTP_409_CONFLICT,
            )
        if experiment is not None and experiment.content_versions.filter(version=version).exists():
            return Response(
                {
                    "error": {
                        "code": "version_exists",
                        "message": "That experiment version already exists.",
                    }
                },
                status=status.HTTP_409_CONFLICT,
            )
        if experiment is not None:
            latest_version = experiment.content_versions.order_by("-created_at", "-pk").first()
            try:
                latest_number = (
                    int(latest_version.version.split(".", maxsplit=1)[0]) if latest_version else 0
                )
            except (TypeError, ValueError):
                latest_number = 0
            if definition["version"] <= latest_number:
                return Response(
                    {
                        "error": {
                            "code": "version_must_increase",
                            "message": "Create a higher experiment version.",
                        }
                    },
                    status=status.HTTP_409_CONFLICT,
                )
        with transaction.atomic():
            if experiment is None:
                experiment = Experiment.objects.create(
                    subject=subject,
                    topic=topic,
                    title=title.strip(),
                    slug=definition["id"],
                    summary=summary.strip(),
                    difficulty=difficulty,
                    engine_name="pixi",
                    status=Experiment.STATUS_DRAFT,
                    created_by=request.user,
                )
            else:
                experiment.status = Experiment.STATUS_DRAFT
                experiment.save(update_fields=["status", "updated_at"])
            content_version = ContentVersion.objects.create(
                experiment=experiment,
                version=version,
                changelog=changelog.strip(),
                status=ContentVersion.STATUS_DRAFT,
                schema_version=SCHEMA_VERSION,
                definition=definition,
                definition_hash=definition_hash,
                created_by=request.user,
            )
            AuditLog.objects.create(
                actor=request.user,
                action="experiment_definition_draft_created",
                target_model="ContentVersion",
                target_id=content_version.id,
                details={
                    "experiment_id": experiment.id,
                    "version": version,
                    "schema_version": SCHEMA_VERSION,
                    "definition_hash": definition_hash,
                },
            )
        return Response(
            {
                "experiment_id": experiment.id,
                "slug": experiment.slug,
                "version_id": content_version.id,
                "version": content_version.version,
                "schema_version": content_version.schema_version,
                "definition_hash": definition_hash,
                "status": content_version.status,
            },
            status=status.HTTP_201_CREATED,
        )


class PublicExperimentDefinitionView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request: Request, slug: str) -> Response:
        version = (
            ContentVersion.objects.select_related(
                "experiment", "experiment__subject", "experiment__topic"
            )
            .filter(experiment__slug=slug, status=ContentVersion.STATUS_PUBLISHED)
            .order_by("-created_at", "-pk")
            .first()
        )
        if version is None or not version.definition or not version.definition_hash:
            return Response(
                {"error": {"code": "not_found", "message": "This practical is not available yet."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        canonical = json.dumps(
            version.definition,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        if (
            validate_experiment_definition(version.definition)
            or hashlib.sha256(canonical.encode("utf-8")).hexdigest() != version.definition_hash
            or version.schema_version != version.definition.get("schemaVersion")
            or version.definition.get("runtimeVersion") != RUNTIME_VERSION
        ):
            return Response(
                {"error": {"code": "not_found", "message": "This practical is not available yet."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        etag = f'"{version.definition_hash}"'
        if request.META.get("HTTP_IF_NONE_MATCH") == etag:
            response = HttpResponse(status=304)
        else:
            response = Response(
                {
                    "slug": version.experiment.slug,
                    "title": version.experiment.title,
                    "summary": version.experiment.summary,
                    "subject": version.experiment.subject.code,
                    "topic": version.experiment.topic.title if version.experiment.topic else None,
                    "version": version.version,
                    "schema_version": version.schema_version,
                    "runtime_version": RUNTIME_VERSION,
                    "definition_hash": version.definition_hash,
                    "definition": version.definition,
                }
            )
        response["ETag"] = etag
        response["Cache-Control"] = "public, max-age=0, must-revalidate"
        return response


class ExperimentSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, slug: str) -> Response:
        session_id = request.query_params.get("session_id")
        session = (
            ExperimentSession.objects.select_related("experiment", "content_version")
            .filter(user=request.user, experiment__slug=slug, pk=session_id)
            .first()
        )
        if session is None:
            return Response(
                {"error": {"code": "not_found", "message": "The practical session was not found."}},
                status=404,
            )
        return Response(
            {
                "session_id": session.id,
                "experiment": session.experiment.slug,
                "version": session.content_version.version,
                "definition_hash": session.content_version.definition_hash,
                "runtime_version": session.runtime_version,
                "mode": session.mode,
                "status": session.status,
                "score": session.score,
                "checkpoint": session.checkpoint,
                "events": list(
                    session.events.order_by("sequence").values_list("payload", flat=True)[:500]
                ),
            }
        )

    def post(self, request: Request, slug: str) -> Response:
        if not UserProfile.objects.filter(
            user=request.user, account_type=UserProfile.ACCOUNT_TYPE_STUDENT
        ).exists():
            return Response(
                {"error": {"code": "forbidden", "message": "A learner account is required."}},
                status=403,
            )
        version = (
            ContentVersion.objects.select_related("experiment")
            .filter(experiment__slug=slug, status=ContentVersion.STATUS_PUBLISHED)
            .order_by("-created_at", "-pk")
            .first()
        )
        if version is None or not version.definition or not version.definition_hash:
            return Response(
                {"error": {"code": "not_found", "message": "This practical is not available yet."}},
                status=404,
            )
        canonical = json.dumps(
            version.definition, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        )
        if (
            version.definition.get("runtimeVersion") != RUNTIME_VERSION
            or validate_experiment_definition(version.definition)
            or hashlib.sha256(canonical.encode("utf-8")).hexdigest() != version.definition_hash
        ):
            return Response(
                {"error": {"code": "not_found", "message": "This practical is not available yet."}},
                status=404,
            )
        supplied_runtime = request.data.get("runtime_version")
        if supplied_runtime != RUNTIME_VERSION:
            return Response(
                {
                    "error": {
                        "code": "unsupported_runtime",
                        "message": "Update the app before starting this practical.",
                    }
                },
                status=400,
            )
        mode = request.data.get("mode", "guided")
        if mode not in {"guided", "free"}:
            return Response(
                {"error": {"code": "invalid_mode", "message": "Choose guided or free mode."}},
                status=400,
            )
        session = (
            ExperimentSession.objects.filter(
                user=request.user,
                experiment=version.experiment,
                content_version=version,
                status=ExperimentSession.STATUS_ACTIVE,
            )
            .order_by("-updated_at")
            .first()
        )
        created = session is None
        if created:
            session = ExperimentSession.objects.create(
                user=request.user,
                experiment=version.experiment,
                content_version=version,
                runtime_version=RUNTIME_VERSION,
                mode=mode,
            )
        return Response(
            {
                "session_id": session.id,
                "experiment": version.experiment.slug,
                "version": version.version,
                "definition_hash": version.definition_hash,
                "runtime_version": RUNTIME_VERSION,
                "mode": session.mode,
                "resumed": not created,
                "status": session.status,
            },
            status=201,
        )


class ExperimentSessionEventsView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _learner(request: Request) -> bool:
        return UserProfile.objects.filter(
            user=request.user, account_type=UserProfile.ACCOUNT_TYPE_STUDENT
        ).exists()

    def get(self, request: Request, session_id: int) -> Response:
        if not self._learner(request):
            return Response(
                {"error": {"code": "forbidden", "message": "A learner account is required."}},
                status=403,
            )
        session = ExperimentSession.objects.filter(pk=session_id, user=request.user).first()
        if session is None:
            return Response(
                {"error": {"code": "not_found", "message": "The practical session was not found."}},
                status=404,
            )
        return Response(
            {
                "session_id": session.id,
                "status": session.status,
                "score": session.score,
                "mode": session.mode,
                "checkpoint": session.checkpoint,
                "events": list(
                    session.events.order_by("sequence").values_list("payload", flat=True)[:500]
                ),
            }
        )

    def post(self, request: Request, session_id: int) -> Response:
        if not self._learner(request):
            return Response(
                {"error": {"code": "forbidden", "message": "A learner account is required."}},
                status=403,
            )
        session = (
            ExperimentSession.objects.select_related("content_version")
            .filter(pk=session_id, user=request.user)
            .first()
        )
        if session is None:
            return Response(
                {"error": {"code": "not_found", "message": "The practical session was not found."}},
                status=404,
            )
        if session.status != ExperimentSession.STATUS_ACTIVE:
            return Response(
                {
                    "error": {
                        "code": "session_complete",
                        "message": "This practical session is already complete.",
                    }
                },
                status=409,
            )
        if (
            request.data.get("runtime_version") != session.runtime_version
            or session.runtime_version != RUNTIME_VERSION
        ):
            return Response(
                {
                    "error": {
                        "code": "unsupported_runtime",
                        "message": "The session runtime does not match.",
                    }
                },
                status=400,
            )
        events = request.data.get("events")
        if not isinstance(events, list) or not 1 <= len(events) <= 100:
            return Response(
                {
                    "error": {
                        "code": "invalid_events",
                        "message": "Submit between 1 and 100 events.",
                    }
                },
                status=400,
            )
        definition = session.content_version.definition
        maximum_steps = len(definition.get("steps", []))
        history = []
        completed_rule_ids = []
        mode = session.mode
        existing_events = list(
            session.events.order_by("sequence").values_list("payload", flat=True)
        )
        all_events = existing_events + events
        expected_sequence = 1
        rules_by_id = {rule["id"]: rule for rule in definition.get("rules", [])}
        step_rules = [rules_by_id[step["ruleId"]] for step in definition.get("steps", [])]
        points = next(
            (
                hook.get("points", 0)
                for hook in definition.get("scoring", {}).get("hooks", [])
                if hook.get("event") == "correct_step"
            ),
            0,
        )
        for event in all_events:
            if not isinstance(event, dict) or set(event) != {
                "sequence",
                "command",
                "accepted",
                "stepBefore",
                "stepAfter",
                "scoreAfter",
                "feedback",
            }:
                return Response(
                    {
                        "error": {
                            "code": "invalid_event",
                            "message": "An event does not match the supported envelope.",
                        }
                    },
                    status=400,
                )
            command = event["command"]
            if not isinstance(command, dict) or command.get("type") not in {
                "fit",
                "place",
                "pour",
                "undo",
                "reset",
                "check",
            }:
                return Response(
                    {
                        "error": {
                            "code": "invalid_event",
                            "message": "An event command is not supported.",
                        }
                    },
                    status=400,
                )
            apparatus_ids = {item["id"] for item in definition.get("apparatus", [])}
            if command["type"] == "fit":
                valid_command = (
                    set(command) == {"type", "apparatus", "target"}
                    and command.get("apparatus") == "filter-paper"
                    and command.get("target") == "funnel"
                )
            elif command["type"] == "place":
                valid_command = (
                    set(command) == {"type", "apparatus", "slot"}
                    and command.get("apparatus") in apparatus_ids
                    and isinstance(command.get("slot"), str)
                    and command["slot"] in apparatus_ids
                )
            elif command["type"] == "pour":
                valid_command = (
                    set(command) == {"type", "from", "to"}
                    and command.get("from") in apparatus_ids
                    and command.get("to") in apparatus_ids
                )
            else:
                valid_command = set(command) == {"type"}
            if not valid_command:
                return Response(
                    {
                        "error": {
                            "code": "invalid_event",
                            "message": "The event action does not match this experiment.",
                        }
                    },
                    status=400,
                )
            before = len(history)
            if command["type"] == "reset":
                accepted = True
                history = []
                completed_rule_ids = []
            elif command["type"] == "undo":
                accepted = bool(history)
                if accepted:
                    history.pop()
                    if mode == "free":
                        completed_rule_ids = []
                        for saved_action in history:
                            matched = next(
                                (
                                    rule
                                    for rule in step_rules
                                    if rule["action"] == saved_action
                                    and rule["id"] not in completed_rule_ids
                                ),
                                None,
                            )
                            if matched:
                                completed_rule_ids.append(matched["id"])
            elif command["type"] == "check":
                accepted = mode == "free" and len(completed_rule_ids) == len(
                    set(step["ruleId"] for step in definition.get("steps", []))
                )
            else:
                if mode == "free":
                    step_rule = next(
                        (rule for rule in step_rules if rule["id"] not in completed_rule_ids), None
                    )
                else:
                    step_rule = step_rules[before] if before < maximum_steps else None
                accepted = bool(step_rule and command == step_rule["action"])
                if accepted:
                    history.append(command)
                    if mode == "free":
                        completed_rule_ids.append(step_rule["id"])
            after = len(history)
            score_after = (
                min(definition.get("scoring", {}).get("maxScore", 0), after * points)
                if mode == "guided"
                else definition.get("scoring", {}).get("maxScore", 0)
                if command["type"] == "check" and accepted
                else 0
            )
            valid_envelope = (
                type(event["sequence"]) is int
                and event["sequence"] == expected_sequence
                and type(event["accepted"]) is bool
                and event["accepted"] == accepted
                and type(event["stepBefore"]) is int
                and event["stepBefore"] == before
                and type(event["stepAfter"]) is int
                and event["stepAfter"] == after
                and type(event["scoreAfter"]) is int
                and event["scoreAfter"] == score_after
                and isinstance(event["feedback"], str)
                and len(event["feedback"]) <= 300
            )
            if not valid_envelope:
                return Response(
                    {
                        "error": {
                            "code": "invalid_event",
                            "message": "Event sequence, progress or score is invalid.",
                        }
                    },
                    status=400,
                )
            expected_sequence += 1
        with transaction.atomic():
            for event in events:
                ExperimentSessionEvent.objects.create(
                    session=session,
                    sequence=event["sequence"],
                    event_type=event["command"]["type"],
                    payload=event,
                )
            final = events[-1]
            session.score = final["scoreAfter"]
            if (
                session.mode == "guided"
                and final["accepted"]
                and final["stepAfter"] == maximum_steps
            ) or (final["command"]["type"] == "check" and final["accepted"]):
                session.status = ExperimentSession.STATUS_COMPLETED
                session.finished_at = timezone.now()
            session.save(update_fields=["score", "status", "finished_at", "updated_at"])
        return Response(
            {
                "accepted_events": len(events),
                "next_sequence": expected_sequence,
                "score": session.score,
                "status": session.status,
            }
        )

    def patch(self, request: Request, session_id: int) -> Response:
        if not self._learner(request):
            return Response(
                {"error": {"code": "forbidden", "message": "A learner account is required."}},
                status=403,
            )
        session = ExperimentSession.objects.filter(pk=session_id, user=request.user).first()
        if session is None:
            return Response(
                {"error": {"code": "not_found", "message": "The practical session was not found."}},
                status=404,
            )
        data = request.data
        checkpoint = data.get("checkpoint")
        if (
            data.get("runtime_version") != session.runtime_version
            or data.get("definition_hash") != session.content_version.definition_hash
            or data.get("mode") not in {"guided", "free"}
            or not isinstance(checkpoint, dict)
            or len(json.dumps(checkpoint, separators=(",", ":"))) > 32768
        ):
            return Response(
                {
                    "error": {
                        "code": "invalid_checkpoint",
                        "message": "This saved progress does not match the experiment version.",
                    }
                },
                status=400,
            )
        last = session.events.order_by("-sequence").values_list("payload", flat=True).first()
        if (
            checkpoint.get("eventCount") != session.events.count()
            or checkpoint.get("stepIndex") != (last["stepAfter"] if last else 0)
            or checkpoint.get("score") != session.score
        ):
            return Response(
                {
                    "error": {
                        "code": "invalid_checkpoint",
                        "message": "Saved progress does not match the recorded actions.",
                    }
                },
                status=400,
            )
        session.mode = data["mode"]
        session.checkpoint = checkpoint
        session.save(update_fields=["mode", "checkpoint", "updated_at"])
        return Response({"saved": True, "mode": session.mode})


class StudentProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        if not UserProfile.objects.filter(
            user=request.user, account_type=UserProfile.ACCOUNT_TYPE_STUDENT
        ).exists():
            return Response(
                {"error": {"code": "forbidden", "message": "A student account is required."}},
                status=403,
            )
        sessions = ExperimentSession.objects.filter(user=request.user).select_related(
            "experiment", "content_version"
        )
        latest = (
            sessions.filter(status=ExperimentSession.STATUS_ACTIVE).order_by("-updated_at").first()
        )
        continue_item = None
        if latest:
            last_event = (
                latest.events.order_by("-sequence").values_list("payload", flat=True).first()
            )
            continue_item = {
                "session_id": latest.id,
                "slug": latest.experiment.slug,
                "title": latest.experiment.title,
                "version": latest.content_version.version,
                "definition_hash": latest.content_version.definition_hash,
                "step_index": last_event["stepAfter"] if last_event else 0,
                "event_count": latest.events.count(),
                "mode": latest.mode,
            }
        return Response(
            {
                "completed_count": sessions.filter(
                    status=ExperimentSession.STATUS_COMPLETED
                ).count(),
                "total_score": sessions.filter(status=ExperimentSession.STATUS_COMPLETED).aggregate(
                    total=Sum("score")
                )["total"]
                or 0,
                "continue_session": continue_item,
            }
        )


class AdminTeacherVerificationView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("teachers.verify",), "POST": ("teachers.verify",)}

    def get(self, request: Request) -> Response:
        profiles = (
            TeacherProfile.objects.select_related("user")
            .prefetch_related("verification_applications")
            .order_by("-created_at")
        )
        payload = [
            {
                "user_id": profile.user_id,
                "username": profile.user.username,
                "verification_status": profile.verification_status,
                "created_at": profile.created_at.isoformat(),
                "latest_application": (
                    {
                        "id": application.id,
                        "status": application.status,
                        "id_document_type": application.id_document_type,
                        "id_reference_masked": f"••••{application.id_reference[-4:]}"
                        if application.id_reference
                        else "",
                        "submitted_at": application.created_at.isoformat(),
                    }
                    if (
                        application := profile.verification_applications.order_by(
                            "-created_at"
                        ).first()
                    )
                    else None
                ),
            }
            for profile in profiles
        ]
        return Response(payload)

    def post(self, request: Request) -> Response:
        user_id = request.data.get("user_id")
        action = (request.data.get("action") or "").lower()
        if not user_id or action not in {"approve", "reject"}:
            return Response(
                {"error": {"code": "invalid_input", "message": "user_id and action are required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = UserProfile.objects.select_related("user").get(user_id=user_id)
        if not hasattr(profile.user, "teacher_profile"):
            return Response(
                {
                    "error": {
                        "code": "teacher_profile_not_found",
                        "message": "Teacher profile was not found.",
                    }
                },
                status=404,
            )
        pending = queue_approval(
            requester=request.user,
            action=f"teacher_verification_{action}",
            target_model="UserProfile",
            target_id=profile.user_id,
        )
        return Response(
            {
                "user_id": profile.user_id,
                "username": profile.user.username,
                "status": "approval_pending",
                "approval": serialize_approval(pending),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class AdminApprovalView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("approvals.decide",), "POST": ("approvals.decide",)}

    def get(self, request: Request) -> Response:
        pending = (
            ApprovalRequest.objects.filter(status=ApprovalRequest.STATUS_PENDING)
            .select_related("requester")
            .order_by("created_at")
        )
        return Response([serialize_approval(item) for item in pending])

    @transaction.atomic
    def post(self, request: Request, approval_id: int) -> Response:
        decision = (request.data.get("decision") or "").strip().lower()
        if decision not in {"approve", "reject"}:
            return Response(
                {
                    "error": {
                        "code": "invalid_input",
                        "message": "decision must be approve or reject.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        pending = ApprovalRequest.objects.select_for_update().filter(pk=approval_id).first()
        if pending is None:
            return Response(
                {"error": {"code": "not_found", "message": "Approval request was not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        result = decide_approval(
            approval=pending, actor=request.user, approve=decision == "approve"
        )
        return Response(serialize_approval(result))


class AdminStaffInvitationView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("staff.invite",), "POST": ("staff.invite",)}

    def get(self, request: Request) -> Response:
        invitations = StaffInvitation.objects.select_related("role").order_by("-created_at")[:50]
        return Response(
            [
                {
                    "id": invite.id,
                    "username": invite.username,
                    "role": invite.role.name,
                    "expires_at": invite.expires_at.isoformat(),
                    "accepted": invite.accepted_at is not None,
                }
                for invite in invitations
            ]
        )

    @transaction.atomic
    def post(self, request: Request) -> Response:
        username = str(request.data.get("username") or "").strip()
        role_name = str(request.data.get("role") or "").strip()
        ensure_default_roles()
        role = StaffRole.objects.filter(name=role_name).first()
        if not username or role is None:
            return Response(
                {
                    "error": {
                        "code": "invalid_input",
                        "message": "A username and existing staff role are required.",
                    }
                },
                status=400,
            )
        if len(username) < 3 or get_user_model().objects.filter(username__iexact=username).exists():
            return Response(
                {
                    "error": {
                        "code": "invalid_username",
                        "message": "Choose a new username with at least three characters.",
                    }
                },
                status=400,
            )
        raw_token = secrets.token_urlsafe(32)
        invitation = StaffInvitation.objects.create(
            username=username,
            role=role,
            invited_by=request.user,
            token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
            expires_at=timezone.now() + timedelta(hours=48),
        )
        pending = queue_approval(
            requester=request.user,
            action="staff_invitation",
            target_model="StaffInvitation",
            target_id=invitation.id,
            reason=f"Invite staff member to {role.name}",
        )
        return Response(
            {
                "status": "approval_pending",
                "invitation_token": raw_token,
                "approval": serialize_approval(pending),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class AdminAuditLogView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("audit.read",)}

    def get(self, request: Request) -> Response:
        entries = (
            AuditLog.objects.select_related("actor")
            .order_by("-created_at")[:25]
            .values(
                "id",
                "action",
                "target_model",
                "target_id",
                "details",
                "created_at",
                "actor__username",
            )
        )
        return Response(list(entries))


class AdminModerationQueueView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("moderation.read",)}

    def get(self, request: Request) -> Response:
        cases = (
            ModerationCase.objects.select_related("subject_user", "reported_by")
            .filter(status=ModerationCase.STATUS_OPEN)
            .order_by("-created_at")
            .values(
                "id",
                "reason",
                "details",
                "status",
                "created_at",
                "subject_user__username",
                "reported_by__username",
            )
        )
        return Response(list(cases))


class AdminUserSearchView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"GET": ("users.search",)}

    def get(self, request: Request) -> Response:
        query = (request.query_params.get("q") or "").strip()
        queryset = get_user_model().objects.select_related("profile").all()
        if query:
            queryset = queryset.filter(username__icontains=query)

        results = [
            {
                "user_id": user.id,
                "username": user.username,
                "account_type": getattr(user.profile, "account_type", None),
                "is_verified_teacher": getattr(user.profile, "is_verified_teacher", False),
            }
            for user in queryset[:20]
        ]
        return Response(results)


class PublicSubjectListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        subjects = Subject.objects.order_by("name").values("id", "name", "code", "description")
        return Response(list(subjects))


class PublicLevelListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response(list(Level.objects.order_by("stage").values("id", "stage", "description")))


class PublicPublishedLessonListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        invalid_filter = _validate_content_filters(
            request, "subject_id", "level_id", "course_id", "scheme_id", "topic_id"
        )
        if invalid_filter:
            return invalid_filter
        versions = _published_lesson_versions(request.query_params)
        page, page_size = _content_page(request)
        count = versions.count()
        selected = versions[(page - 1) * page_size : page * page_size]
        results = [_lesson_summary(version) for version in selected]
        return _content_response(
            request,
            {"count": count, "page": page, "page_size": page_size, "results": results},
            count > page * page_size,
        )


class PublicCourseListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        invalid_filter = _validate_content_filters(request, "subject_id", "level_id")
        if invalid_filter:
            return invalid_filter
        lesson_course_ids = LessonVersion.objects.filter(
            status=LessonVersion.STATUS_PUBLISHED
        ).values("lesson__topic__scheme__course_id")
        courses = (
            Course.objects.filter(id__in=lesson_course_ids)
            .select_related("subject", "level")
            .order_by("subject__name", "level__stage", "title")
        )
        subject_id = request.query_params.get("subject_id")
        level_id = request.query_params.get("level_id")
        if subject_id:
            courses = courses.filter(subject_id=subject_id)
        if level_id:
            courses = courses.filter(level_id=level_id)
        rows = list(
            courses.values(
                "id",
                "title",
                "description",
                "subject_id",
                "subject__name",
                "level_id",
                "level__stage",
            )
        )
        return _content_response(request, rows)


class PublicSchemeListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        invalid_filter = _validate_content_filters(request, "course_id")
        if invalid_filter:
            return invalid_filter
        scheme_ids = LessonVersion.objects.filter(status=LessonVersion.STATUS_PUBLISHED).values(
            "lesson__topic__scheme_id"
        )
        schemes = SchemeOfWork.objects.filter(id__in=scheme_ids, is_active=True)
        course_id = request.query_params.get("course_id")
        if course_id:
            schemes = schemes.filter(course_id=course_id)
        rows = list(
            schemes.select_related("course", "course__subject", "course__level")
            .order_by("course__subject__name", "course__level__stage", "term", "title")
            .values(
                "id",
                "title",
                "term",
                "course_id",
                "course__title",
                "course__subject__name",
                "course__level__stage",
            )
        )
        return _content_response(request, rows)


class PublicTopicDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, topic_id: int) -> Response:
        versions = _published_lesson_versions(request.query_params).filter(
            lesson__topic_id=topic_id
        )
        topic = (
            Topic.objects.select_related("scheme__course__subject", "scheme__course__level")
            .filter(id=topic_id, lessons__versions__status=LessonVersion.STATUS_PUBLISHED)
            .first()
        )
        if topic is None:
            raise Http404
        data = {
            "id": topic.id,
            "title": topic.title,
            "description": topic.description,
            "order": topic.order,
            "week": topic.week,
            "scheme": {
                "id": topic.scheme_id,
                "title": topic.scheme.title,
                "term": topic.scheme.term,
            },
            "course": {"id": topic.scheme.course_id, "title": topic.scheme.course.title},
            "subject": topic.scheme.course.subject.name,
            "level": topic.scheme.course.level.stage,
            "lessons": [_lesson_summary(version) for version in versions.order_by("lesson__title")],
        }
        return _content_response(request, data)


class PublicLessonDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, lesson_id: int) -> Response:
        version = _published_lesson_versions().filter(lesson_id=lesson_id).first()
        if version is None:
            raise Http404
        data = _lesson_summary(version, detail=True)
        return _content_response(request, data)


class PublicLessonCaptionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, lesson_id: int, content_hash: str) -> HttpResponse:
        version = LessonVersion.objects.filter(
            lesson_id=lesson_id,
            status=LessonVersion.STATUS_PUBLISHED,
            content_hash=content_hash,
        ).first()
        if version is None or not version.captions.lstrip().startswith("WEBVTT"):
            raise Http404
        response = HttpResponse(version.captions, content_type="text/vtt; charset=utf-8")
        response["Cache-Control"] = "public, max-age=31536000, immutable"
        response["ETag"] = f'"{version.content_hash}"'
        return response


class PublicLessonAssetRedirectView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, asset_id: int, content_hash: str):
        asset = (
            LessonAsset.objects.select_related("version")
            .filter(
                pk=asset_id,
                version__status=LessonVersion.STATUS_PUBLISHED,
                version__content_hash=content_hash,
            )
            .first()
        )
        if asset is None:
            raise Http404
        response = HttpResponseRedirect(asset.file_url)
        response["Cache-Control"] = "public, max-age=31536000, immutable"
        response["ETag"] = f'"{asset.sha256}"'
        return response


class AdminLessonVersionView(APIView):
    permission_classes = [StaffPermissionByMethod]
    staff_permissions = {"POST": ("content.review",)}

    def post(self, request: Request) -> Response:
        lesson_id = request.data.get("lesson_id")
        action = request.data.get("action", "create")
        if action == "create":
            try:
                lesson = Lesson.objects.get(pk=lesson_id)
            except (Lesson.DoesNotExist, ValueError, TypeError):
                return _content_error(
                    "lesson_id must identify a lesson.", status.HTTP_400_BAD_REQUEST
                )
            try:
                title = _required_content_text(request.data, "title", 200)
                content = _required_content_text(request.data, "content", 100_000)
                safety_notes = _optional_content_text(request.data, "safety_notes", 5_000)
                transcript = _optional_content_text(request.data, "transcript", 100_000)
                captions = _optional_content_text(request.data, "captions", 150_000)
                changelog = _optional_content_text(request.data, "changelog", 500)
            except ValueError as exc:
                return _content_error(str(exc), status.HTTP_400_BAD_REQUEST)
            try:
                estimated_minutes = int(request.data.get("estimated_minutes", 10))
            except (ValueError, TypeError):
                return _content_error(
                    "estimated_minutes must be an integer from 1 to 120.",
                    status.HTTP_400_BAD_REQUEST,
                )
            if not 1 <= estimated_minutes <= 120:
                return _content_error(
                    "estimated_minutes must be an integer from 1 to 120.",
                    status.HTTP_400_BAD_REQUEST,
                )
            assets = request.data.get("assets", [])
            if not isinstance(assets, list) or len(assets) > 20:
                return _content_error(
                    "assets must be a list containing at most 20 items.",
                    status.HTTP_400_BAD_REQUEST,
                )
            try:
                with transaction.atomic():
                    lesson = Lesson.objects.select_for_update().get(pk=lesson_id)
                    latest = (
                        LessonVersion.objects.filter(lesson=lesson).order_by("-version").first()
                    )
                    version = LessonVersion.objects.create(
                        lesson=lesson,
                        version=(latest.version + 1 if latest else 1),
                        title=title,
                        content=content,
                        estimated_minutes=estimated_minutes,
                        safety_notes=safety_notes,
                        transcript=transcript,
                        captions=captions,
                        changelog=changelog,
                        created_by=request.user,
                    )
                    total_size = 0
                    for item in assets:
                        asset_data = _validate_lesson_asset(item)
                        total_size += asset_data["size_bytes"]
                        if total_size > 25 * 1024 * 1024:
                            raise ValueError("Combined lesson assets must be 25 MB or smaller.")
                        LessonAsset.objects.create(version=version, **asset_data)
            except (ValueError, TypeError, DjangoValidationError) as exc:
                return _content_error(str(exc), status.HTTP_400_BAD_REQUEST)
            except Lesson.DoesNotExist:
                return _content_error(
                    "lesson_id must identify a lesson.", status.HTTP_400_BAD_REQUEST
                )
            AuditLog.objects.create(
                actor=request.user,
                action="lesson_version_created",
                target_model="LessonVersion",
                target_id=version.id,
                details={"lesson_id": lesson.id, "version": version.version},
            )
            return Response(
                {"id": version.id, "version": version.version, "status": version.status}, status=201
            )

        version_id = request.data.get("version_id")
        version = LessonVersion.objects.filter(pk=version_id).first()
        if version is None:
            return _content_error(
                "version_id must identify a lesson version.", status.HTTP_404_NOT_FOUND
            )
        if action == "submit_review" and version.status in {
            LessonVersion.STATUS_DRAFT,
            LessonVersion.STATUS_REJECTED,
        }:
            version.status = LessonVersion.STATUS_REVIEW
            version.save(update_fields=["status", "updated_at"])
        elif action in {"approve", "publish"}:
            required_status = (
                LessonVersion.STATUS_REVIEW
                if action == "approve"
                else LessonVersion.STATUS_APPROVED
            )
            if version.status != required_status:
                return _content_error(
                    f"Only {required_status} lesson versions can be {action}d.",
                    status.HTTP_409_CONFLICT,
                )
            approval_action = (
                "lesson_version_approve" if action == "approve" else "lesson_version_publish"
            )
            approval = queue_approval(
                requester=request.user,
                action=approval_action,
                target_model="LessonVersion",
                target_id=version.id,
            )
            return Response(
                {"status": "approval_pending", "approval": serialize_approval(approval)}, status=202
            )
        elif action == "reject" and version.status in {
            LessonVersion.STATUS_REVIEW,
            LessonVersion.STATUS_APPROVED,
        }:
            version.status = LessonVersion.STATUS_REJECTED
            version.save(update_fields=["status", "updated_at"])
        else:
            return _content_error(
                "Unsupported action for this lesson version state.", status.HTTP_409_CONFLICT
            )
        AuditLog.objects.create(
            actor=request.user,
            action=f"lesson_version_{action}",
            target_model="LessonVersion",
            target_id=version.id,
            details={"lesson_id": version.lesson_id, "version": version.version},
        )
        return Response({"id": version.id, "version": version.version, "status": version.status})


def _published_lesson_versions(params=None):
    versions = (
        LessonVersion.objects.filter(status=LessonVersion.STATUS_PUBLISHED)
        .select_related(
            "lesson__topic__scheme__course__subject", "lesson__topic__scheme__course__level"
        )
        .prefetch_related("assets")
    )
    params = params or {}
    for key, field in (
        ("subject_id", "lesson__topic__scheme__course__subject_id"),
        ("level_id", "lesson__topic__scheme__course__level_id"),
        ("course_id", "lesson__topic__scheme__course_id"),
        ("scheme_id", "lesson__topic__scheme_id"),
        ("topic_id", "lesson__topic_id"),
    ):
        value = params.get(key)
        if value:
            versions = versions.filter(**{field: value})
    latest_versions = (
        LessonVersion.objects.filter(
            lesson_id=OuterRef("lesson_id"), status=LessonVersion.STATUS_PUBLISHED
        )
        .order_by("-version")
        .values("version")[:1]
    )
    return versions.filter(version=Subquery(latest_versions)).order_by(
        "lesson__topic__scheme__course__subject__name",
        "lesson__topic__scheme__course__level__stage",
        "lesson__topic__scheme__term",
        "lesson__topic__order",
        "lesson__title",
    )


def _content_page(request: Request) -> tuple[int, int]:
    try:
        page = max(1, int(request.query_params.get("page", "1")))
        page_size = min(50, max(1, int(request.query_params.get("page_size", "20"))))
    except ValueError:
        page, page_size = 1, 20
    return page, page_size


def _validate_content_filters(request: Request, *keys: str) -> Response | None:
    for key in keys:
        value = request.query_params.get(key)
        if value and not value.isdecimal():
            return _content_error(f"{key} must be a positive integer.", status.HTTP_400_BAD_REQUEST)
    return None


def _required_content_text(data, key: str, max_length: int) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} is required.")
    if len(value) > max_length:
        raise ValueError(f"{key} must be {max_length} characters or fewer.")
    return value.strip()


def _optional_content_text(data, key: str, max_length: int) -> str:
    value = data.get(key, "")
    if not isinstance(value, str):
        raise ValueError(f"{key} must be text.")
    if len(value) > max_length:
        raise ValueError(f"{key} must be {max_length} characters or fewer.")
    return value.strip()


def _lesson_summary(version: LessonVersion, *, detail: bool = False) -> dict:
    lesson = version.lesson
    topic = lesson.topic
    data = {
        "id": lesson.id,
        "title": version.title,
        "version": version.version,
        "content_hash": version.content_hash,
        "offline_eligible": False,
        "captions_url": (
            f"/api/v1/content/lessons/{lesson.id}/captions/{version.content_hash}"
            if version.captions.lstrip().startswith("WEBVTT")
            else None
        ),
        "estimated_minutes": version.estimated_minutes,
        "topic": {"id": topic.id, "title": topic.title, "week": topic.week},
        "scheme": {"id": topic.scheme_id, "title": topic.scheme.title, "term": topic.scheme.term},
        "course": {"id": topic.scheme.course_id, "title": topic.scheme.course.title},
        "subject": {"id": topic.scheme.course.subject_id, "name": topic.scheme.course.subject.name},
        "level": {"id": topic.scheme.course.level_id, "stage": topic.scheme.course.level.stage},
        "assets": [
            {
                "id": asset.id,
                "kind": asset.kind,
                "mime_type": asset.mime_type,
                "size_bytes": asset.size_bytes,
                "sha256": asset.sha256,
                "url": f"/api/v1/content/assets/{asset.id}/{version.content_hash}",
                "attribution": asset.attribution,
                "license": asset.license_name,
                "license_url": asset.license_url,
            }
            for asset in version.assets.all()
        ],
    }
    if detail:
        data.update(
            {
                "content": version.content,
                "safety_notes": version.safety_notes,
                "transcript": version.transcript,
                "captions": version.captions,
                "published_at": version.published_at.isoformat() if version.published_at else None,
            }
        )
    return data


def _content_response(
    request: Request, data, has_next: bool = False, *, immutable: bool = False
) -> Response:
    etag = hashlib.sha256(
        json.dumps(data, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    quoted_etag = f'"{etag}"'
    if request.headers.get("If-None-Match") == quoted_etag:
        response = Response(status=304)
    else:
        response = Response(data)
    response["ETag"] = quoted_etag
    response["Cache-Control"] = (
        "public, max-age=31536000, immutable"
        if immutable
        else "public, max-age=300, stale-while-revalidate=60"
    )
    response["X-Content-Next-Page"] = "true" if has_next else "false"
    return response


def _content_error(message: str, response_status: int) -> Response:
    return Response(
        {"error": {"code": "invalid_content", "message": message}}, status=response_status
    )


def _validate_lesson_asset(item: dict) -> dict:
    if not isinstance(item, dict):
        raise ValueError("Each asset must be an object.")
    kind = item.get("kind")
    mime_type_value = item.get("mime_type", "")
    if not isinstance(mime_type_value, str):
        raise ValueError("Asset mime_type must be text.")
    mime_type = mime_type_value.lower()
    allowed = {
        "image": {"image/jpeg": 5, "image/png": 5, "image/webp": 5},
        "audio": {"audio/mpeg": 20, "audio/ogg": 20, "audio/wav": 20},
        "video": {"video/mp4": 20, "video/webm": 20},
        "document": {"application/pdf": 5},
    }
    if kind not in allowed or mime_type not in allowed[kind]:
        raise ValueError("Asset kind and MIME type are not supported.")
    try:
        size_bytes = int(item.get("size_bytes"))
    except (ValueError, TypeError):
        raise ValueError("Asset size_bytes must be a positive integer.") from None
    if size_bytes <= 0 or size_bytes > allowed[kind][mime_type] * 1024 * 1024:
        raise ValueError("Asset exceeds the allowed size for its type.")
    sha256_value = item.get("sha256", "")
    if not isinstance(sha256_value, str):
        raise ValueError("Asset sha256 must be text.")
    sha256 = sha256_value.lower()
    if not re.fullmatch(r"[a-f0-9]{64}", sha256):
        raise ValueError("Asset sha256 must be a 64-character hexadecimal digest.")
    file_url = item.get("file_url", "")
    if not isinstance(file_url, str):
        raise ValueError("Asset file_url must be text.")
    try:
        URLValidator(schemes=["https"])(file_url)
    except DjangoValidationError:
        raise ValueError("Asset file_url must be an absolute HTTPS URL.") from None
    attribution = item.get("attribution", "")
    license_name = item.get("license_name", "")
    if not isinstance(attribution, str) or not isinstance(license_name, str):
        raise ValueError("Asset attribution and license_name must be text.")
    if not attribution.strip() or not license_name.strip():
        raise ValueError("Asset attribution and license_name are required.")
    if len(attribution) > 300 or len(license_name) > 120:
        raise ValueError("Asset attribution or license_name is too long.")
    license_url = item.get("license_url", "")
    if not isinstance(license_url, str):
        raise ValueError("license_url must be text.")
    if license_url:
        try:
            URLValidator(schemes=["https"])(license_url)
        except DjangoValidationError:
            raise ValueError("license_url must use HTTPS.") from None
    parsed = urlparse(file_url)
    if not parsed.netloc:
        raise ValueError("Asset file_url must be an absolute HTTPS URL.")
    return {
        "kind": kind,
        "file_url": file_url,
        "mime_type": mime_type,
        "size_bytes": size_bytes,
        "sha256": sha256,
        "attribution": attribution.strip(),
        "license_name": license_name.strip(),
        "license_url": license_url,
    }
