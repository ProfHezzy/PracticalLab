# PracticalLab Africa API

The API is a Django REST Framework modular monolith. It provides individual learner/teacher account flows, MFA-protected staff operations, curriculum authoring and published-content delivery. Staff actions require active staff membership, server-verified MFA and the corresponding role permission. Content publishing uses an independent four-eyes approval.

Local tests run on SQLite by default. Compose sets `DB_HOST` and uses PostgreSQL. Set `DJANGO_SECRET_KEY` and `DJANGO_DEBUG=1` for local Django commands. `GET /api/v1/health/ready` checks database and Redis connectivity; it returns no internal connection details.

Run the API tests from the repository root:

```powershell
$env:DJANGO_SECRET_KEY = "local-check-only-not-for-deployment"
$env:DJANGO_DEBUG = "1"
python -m pytest apps/api
```

M4 endpoints, asset limits, version/ETag behavior and publication gates are documented in [`../../docs/api/content-delivery.md`](../../docs/api/content-delivery.md).
