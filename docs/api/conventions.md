# API conventions

MVP APIs are JSON REST endpoints under `/api/v1/`. The browser uses same-origin `/api` requests; the Next.js development server proxies them to Django. Do not expose cross-origin credentials or return draft content to learner endpoints.

## Errors

Return a stable envelope for API errors:

```json
{
  "error": {
    "code": "validation_error",
    "message": "The request could not be processed.",
    "details": {}
  }
}
```

`code` is a stable machine-readable identifier. `message` is safe for end users. `details` contains field-level validation messages only when appropriate; it must not disclose secrets, internal traces, or another user's data. Use conventional HTTP status codes. Unexpected failures return a generic 500 response and are logged without personal data.

## Authentication and permissions

- Consumer and staff identities remain separate.
- Session cookies are HttpOnly, Secure outside local development, and SameSite=Lax; unsafe requests require CSRF validation.
- Staff access is denied unless the authenticated account is active, staff-authorized and has a server-verified MFA assurance marker.
- Every non-public endpoint checks authorization for the object and relationship, not only the URL namespace.
- Health endpoints expose operational status only, never configuration, credentials or personal data.

## Pagination and versioning

Collection endpoints must have bounded page sizes and stable ordering. Add cursor pagination for unbounded/high-growth collections after measuring access patterns. Breaking API changes require a new `/api/vN/` prefix. OpenAPI is the API contract source; generated TypeScript clients must not be edited by hand.

## Initial routes

- `GET /api/v1/health/live`: process liveness.
- `GET /api/v1/health/ready`: database and Redis readiness.
- `GET /api/v1/auth/csrf`: obtains a CSRF token for same-origin unsafe requests; it does not authenticate the caller.
- `GET /api/v1/staff/access`: minimal protected staff-access check for an active staff member with verified MFA.

For M4 published curriculum routes, versioning, cache headers and authoring rules, see [content delivery](content-delivery.md).
For M5 experiment schema/runtime compatibility, staff publishing gates and learner delivery, see [experiment definitions](experiment-definitions.md).
