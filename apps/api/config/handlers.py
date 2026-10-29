from django.http import HttpRequest, JsonResponse


def _error_response(code: str, message: str, status_code: int) -> JsonResponse:
    return JsonResponse(
        {
            "error": {
                "code": code,
                "message": message,
                "details": {},
            }
        },
        status=status_code,
    )


def api_not_found(request: HttpRequest, unmatched: str) -> JsonResponse:
    return _error_response("not_found", "The requested resource was not found.", 404)


def not_found(request: HttpRequest, exception: Exception) -> JsonResponse:
    return _error_response("not_found", "The requested resource was not found.", 404)


def server_error(request: HttpRequest) -> JsonResponse:
    return _error_response("server_error", "The request could not be completed.", 500)
