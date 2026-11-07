<<<<<<< HEAD
# PracticalLab Africa

PracticalLab Africa is a mobile-first virtual practical learning platform. This workspace is being built milestone by milestone under [`docs/PLAN.md`](docs/PLAN.md).

## Prerequisites

- Node.js 24 LTS (or a supported Node.js 20.9+ release) and npm.
- Python 3.12.
- Docker Desktop with Docker Compose v2 for the full local stack.

The simulation engine and experiment schema are workspace packages. The interactive filtration stage uses PixiJS, installed with the web workspace dependencies.

## Local setup

1. Copy `.env.example` to `.env` and keep `.env` local. Its values are development-only.
2. Start the services with `docker compose up --build`.
3. Open the learner shell at `http://localhost:3000` and the staff shell at `http://localhost:3001`. The Django API is available through the learner app's same-origin `/api/v1/` proxy.

To stop services, use `docker compose down`. To remove local database data, explicitly run `docker compose down --volumes`; this deletes the development database.

## Checks

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Backend checks (from the repository root, using Python 3.12):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r apps\api\requirements-dev.txt
python -m pytest apps\api
$env:DJANGO_SECRET_KEY = "local-check-only-not-for-deployment"
$env:DJANGO_DEBUG = "1"
python apps\api\manage.py check
```

The API test suite uses SQLite by default. Compose uses PostgreSQL and Redis. Staff administrative actions require MFA and role permissions. M4 content routes expose only published lesson versions; lesson authoring, asset constraints and review gates are documented in [content delivery API notes](docs/api/content-delivery.md). M5 experiment authoring and publication gates are documented in [experiment definitions API notes](docs/api/experiment-definitions.md). The filtration config remains a preview pending subject review, and no production object-storage/CDN configuration is included yet.

## Project references

- [Delivery plan and progress](docs/PLAN.md)
- [Permanent project rules](docs/instructions.md)
- [Project proposal](<docs/Project%20Proposal%20PracticalLab%20Africa%20(Virtual%20Practical%20Learning%20Platform).md>)
- [Design guidelines](docs/PracticalLab%20Africa%20Design%20and%20Interface%20Guidelines%20v1.0.md)
- [API conventions](docs/api/conventions.md)
- [Event taxonomy](docs/analytics/event-taxonomy.md)
- [Performance test profile](docs/operations/performance-profile.md)
- [M0 discovery validation status](docs/discovery/m0-validation.md)
- [M0 decision record](docs/decisions/0001-m0-foundation.md)

© Hezekiah Olawale Ojenike / MINDSET INFORMATION TECHNOLOGY LTD.
=======
# PracticalLab
>>>>>>> 6014fdff3ec89a286cb8780a0e4d1d5de3901773
