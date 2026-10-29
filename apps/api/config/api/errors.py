from typing import Any

from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as default_exception_handler
from rest_framework.views import set_rollback


def error_payload(code: str, message: str, details: Any | None = None) -> dict:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        }
    }


def exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, (Http404, ObjectDoesNotExist)):
        return Response(
            error_payload("not_found", "The requested resource was not found."),
            status=404,
        )
    if isinstance(exc, PermissionError):
        return Response(
            error_payload(
                "self_approval_forbidden", "The same person cannot approve their own action."
            ),
            status=403,
        )

    response = default_exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, ValidationError):
        error_code = "validation_error"
        message = "The request could not be processed."
        details = exc.detail
    elif isinstance(exc, PermissionDenied):
        error_code = "permission_denied"
        message = (
            str(exc.detail)
            if isinstance(exc.detail, str)
            else "The request could not be processed."
        )
        details = {}
    elif isinstance(exc, APIException):
        error_code = exc.default_code
        message = (
            str(exc.detail)
            if isinstance(exc.detail, str)
            else "The request could not be processed."
        )
        details = exc.detail if error_code == "invalid" else {}
    else:
        error_code = "api_error"
        message = "The request could not be processed."
        details = {}

    response.data = error_payload(str(error_code), message, details)
    set_rollback()
    return response
