# PracticalLab Africa — MVP Delivery Plan

**Status:** Product and launch decisions remain open. M2 foundation and M3 engineering work are underway under explicit product-owner authorization; unresolved M0 decisions remain release gates.  
**Product name:** PracticalLab Africa (working name; confirmation pending).  
**Plan basis:** Project Proposal v1.1, Design and Interface Guidelines v1.0, and the available project rules in `docs/instructions.md`.

## 1. Product summary, assumptions, and risks

### Product in my own words

PracticalLab Africa is an individual-focused, mobile-first learning platform for students and educators, beginning with Nigerian secondary-school Chemistry and Basic Electronics. A student can browse a curriculum-aligned topic, learn from a short narrated lesson, then practise a safe, interactive experiment on a low-cost phone. A teacher can demonstrate the same experiment from their own screen, create classes without an institution account, assign practical work, and review a student's recorded attempt step by step before grading it.

The product combines a lightweight installable PWA, a reusable browser simulation engine, curriculum/content publishing, a teacher workflow, and carefully bounded social learning. It must remain usable with intermittent connectivity, protect learners who may be minors, and make scientific accuracy and moderation part of publishing—not cleanup after launch. Schools are not customers or account tenants. Staff/admin identities are separate from student and teacher identities.

### Contradictions, gaps, and risks to resolve

| Finding                                                                                                                                                                                                                                                                     | Risk / ambiguity                                                                             | Recommended resolution                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The requested `.github/copilot-instructions.md` is not present. `docs/instructions.md` exists and contains permanent project rules, but refers to canonical `docs/01-project-proposal.md` and `docs/02-design-guidelines.md`, which are also not present under those names. | Future implementation may follow inconsistent or nonexistent source documents.               | Before implementation, agree on canonical filenames and either add the missing `.github` instructions and canonical docs or update `docs/instructions.md` to point to the existing filenames. For this draft, follow the supplied proposal, design guide, and `docs/instructions.md`; do not silently overwrite or rename any of them.                                                                                              |
| Proposal v1.1 is explicitly a draft for board/stakeholder review; brand, MVP and technology choices are listed as decisions requested.                                                                                                                                      | Scope or product direction may change after approval.                                        | Treat this plan as conditional on product-owner approval; use M0 to record decisions and freeze MVP scope before feature work.                                                                                                                                                                                                                                                                                                      |
| Strategic objective says at least 10 simulations. Named MVP content lists six Chemistry procedures plus apparatus identification, but does not enumerate the Basic Electronics experiments.                                                                                 | “10 simulations” is not testable until a catalogue and definition of “simulation” exist.     | Count only complete, independently playable and reviewer-approved experiment definitions. Baseline: six Chemistry procedures (filtration, evaporation, simple distillation, fractional distillation, decantation, chromatography) plus four Basic Electronics experiments selected and curriculum-checked in M0. Apparatus identification is required learning content but does not count unless approved as a complete simulation. |
| Learners span secondary, tertiary and adult skills training, while MVP is Chemistry and Basic Electronics at secondary level. “Course or class” is also used for a student's profile.                                                                                       | Content, age and onboarding scope can expand without control.                                | MVP target is Nigerian secondary learners and independent secondary educators; model level/course distinctly from a teacher-owned Class. Defer tertiary/adult curricula to later phases.                                                                                                                                                                                                                                            |
| Account model says a person may switch between Student and Teacher/Lecturer, but security requirements also distinguish roles and require teacher verification before privileged capabilities.                                                                              | Duplicate accounts or role escalation could result.                                          | One identity per person with separate StudentProfile and TeacherProfile capabilities. A user may request a teacher profile; only a verified teacher may own classes or receive teacher-student requests. Keep staff identities separate.                                                                                                                                                                                            |
| Social scope includes follow/friend, teacher connections, groups, feed, posts and shared experiments. The MVP phase table says friends/follow/basic groups, while messaging is Phase 2.                                                                                     | Feed publication and discoverability increase child-safety and moderation scope.             | MVP social is limited to accepted connections, invite-only groups and a minimal activity feed of safe, structured events. No direct or group messaging, public profiles, unrestricted search or user-generated free-text posts. Confirm this boundary in M0.                                                                                                                                                                        |
| Safety requirements say block, mute and report; Admin MVP explicitly describes report handling, suspension and content removal, but mute semantics are undefined.                                                                                                           | Users may assume mute blocks contact or content when it does not.                            | Specify mute as a personal hide/notification preference; block prevents direct connection and hides relevant profile/activity; report creates a moderation case. Verify authorization and effects in M11.                                                                                                                                                                                                                           |
| Two different concepts are named `Report`: a practical report (Phase 2) and a user/community report (MVP).                                                                                                                                                                  | Ambiguous schema, API names and retention rules.                                             | Use `LabReport` for a generated practical report (Phase 2) and `UserReport` for a safety report (MVP).                                                                                                                                                                                                                                                                                                                              |
| Basic offline PWA is MVP; full offline mode is Phase 2, but the proposal also says lessons/simulations are cached and submissions queue and sync.                                                                                                                           | Unclear offline functionality can lead to data loss or an unbounded offline promise.         | MVP offline supports explicitly downloaded/published lesson and experiment bundles, local attempt drafts, and a durable submission outbox that retries idempotently. Social actions, enrolment, grading and live account changes require connectivity. Define conflict, expiry, storage limits and sign-out behavior in M13. Broader offline browsing/sync is Phase 2.                                                              |
| Admin requires four-eyes approval for publishing, role changes, deletion and exports, while an MVP could start with one owner/operator.                                                                                                                                     | A single staff member cannot approve their own sensitive action safely.                      | Require at least two distinct invite-only staff identities (including a Reviewer) before launch; the initiator cannot approve their own request. Defer or disable sensitive actions if a second approver is unavailable.                                                                                                                                                                                                            |
| “Immutable” audit log is required, but an application database alone cannot guarantee immutability against privileged infrastructure operators.                                                                                                                             | Audit records could be altered or removed by an administrator.                               | Make the application log append-only, restrict database permissions, record before/after state and request context without unnecessary personal data, and ship tamper-evident copies to protected object storage with retention controls. Document residual cloud-operator risk.                                                                                                                                                    |
| Users may be minors; parental consent was deliberately removed, yet the proposal also requires legal review of obligations for under-18 users.                                                                                                                              | A legal/privacy gap could block launch or make the intended onboarding unlawful.             | Do not add parent accounts or consent flows implicitly. Obtain jurisdiction-specific legal advice on lawful basis, age handling, retention, notices, moderation and reporting before pilot launch; adjust product scope only by explicit approval.                                                                                                                                                                                  |
| Performance asks for first load under five seconds, while design budgets critical homepage assets under 300 KB and simulation bundles under 1.5 MB.                                                                                                                         | It is unclear which network/device, transfer metric, page and cache state define compliance. | Define a launch test profile in M0: 360 px viewport, representative low-/mid-range Android, throttled 3G, cold load, compressed transfer; homepage critical assets <=300 KB and interactive <=5 seconds; each on-demand simulation bundle <=1.5 MB. Separately measure API and simulation frame rate.                                                                                                                               |
| Design guide calls dark mode first-class but gives only starter dark tokens; accessibility asks for language switching on main screens while English is MVP.                                                                                                                | Incomplete token coverage and UI copy expansion can create late rework.                      | Include theme tokens and reduced-motion/accessibility primitives in M0. Launch in English with the language control presented only when it has a defined useful behavior; translation/localized curricula are Phase 2.                                                                                                                                                                                                              |
| Typography lists two families and a mono family for formulas; performance budget says two families. It also provides alternatives (Sora/Poppins and Inter/Nunito).                                                                                                          | Download weight and inconsistent UI typography.                                              | Choose one heading family (Sora), one UI family (Inter), system fallbacks, and only a very small on-demand monospace subset if measurement shows it is needed. Recheck the 300 KB budget.                                                                                                                                                                                                                                           |
| Proposal lists Django Channels for later realtime use but MVP Live is teacher-screen only and messaging/device sync are deferred.                                                                                                                                           | Premature realtime infrastructure adds operational burden.                                   | Keep the MVP REST-first. Add Channels only when a separately approved feature actually requires server-mediated realtime; teacher-screen Live is a local simulation playback state.                                                                                                                                                                                                                                                 |
| Proposal recommends an open-source circuit engine only after license review; Basic Electronics is in MVP.                                                                                                                                                                   | A copyleft or unsuitable dependency could impose legal/performance obligations.              | In M0, spike a small in-house circuit interaction model against a legally reviewed candidate. Do not adopt a third-party circuit engine or new heavy dependency without owner approval.                                                                                                                                                                                                                                             |
| 99.9% availability and millions of users are aspirational requirements, while the initial delivery team is small and unconfirmed.                                                                                                                                           | Overengineering or unmeasured service commitments.                                           | Use managed services, modular monolith and measurable pilot SLOs. Treat 99.9% and scale-out architecture as production targets to validate; do not claim the target until monitoring and operations can support it.                                                                                                                                                                                                                 |
| Notifications are Basic in MVP but channels, consent, templates and providers are unspecified.                                                                                                                                                                              | Cost, privacy and delivery reliability are unknown.                                          | MVP in-app notifications only for essential assignment/class events; email as a separately approved transactional channel. Defer push/SMS provider selection until consent, cost and operational needs are confirmed.                                                                                                                                                                                                               |
| Groups are described as student-created and invite-only, but limits mention accepted connections or classmates; class joining can be automatic or approval-first.                                                                                                           | Membership checks and cross-class access rules are unclear.                                  | Groups are owned by a student, invite-only, and invitees must be accepted connections or current classmates. Class joining follows the teacher's automatic/approval setting. Specify removal, leaving and ownership transfer rules before M8/M10.                                                                                                                                                                                   |

## 2. Proposed monorepo

No application repository structure is assumed to exist yet. This is the proposed target structure; use the actual repository/package manager setup only after M0 approval.

```text
practicallab-africa/
├── apps/
│   ├── api/                         # Django + DRF modular monolith
│   │   ├── config/                  # settings, URLs, ASGI/WSGI
│   │   ├── users/
│   │   ├── curriculum/
│   │   ├── content/
│   │   ├── labs/
│   │   ├── classrooms/
│   │   ├── assignments/
│   │   ├── community/
│   │   ├── moderation/
│   │   ├── analytics/
│   │   └── staff_admin/
│   ├── web/                         # Next.js PWA: public, student, teacher
│   └── admin/                       # Protected admin UI, separate origin/deployment
├── packages/
│   ├── simulation-engine/           # PixiJS runtime and apparatus interactions
│   ├── experiment-schemas/          # Versioned JSON Schema/source of truth
│   ├── shared-types/                # Generated TypeScript API/schema types
│   ├── ui/                          # Shared accessible components and tokens
│   └── api-client/                  # Generated/typed OpenAPI client
├── infra/
│   ├── docker/                      # Dev and production container definitions
│   ├── compose/                     # Local dependencies (Postgres, Redis, etc.)
│   ├── deployment/                  # Environment-specific deployment config
│   └── observability/               # Dashboards, alerts and SLO definitions
├── docs/
│   ├── PLAN.md
│   ├── architecture/
│   ├── api/
│   ├── decisions/
│   └── operations/
├── tests/
│   ├── e2e/                         # Cross-app Playwright user journeys
│   └── fixtures/
├── .github/
│   └── workflows/                   # CI and gated deployment
├── .env.example                     # Names only; never real secrets
├── compose.yaml
└── README.md
```

**Boundary rules:** API apps own their domain models and services; cross-domain operations use explicit service interfaces and database transactions. Keep one deployable Django application and one primary relational database for MVP. The simulation engine runs client-side; experiment definitions are versioned data validated against the same schema in authoring, API and runtime. Generate TypeScript API types from OpenAPI rather than hand-maintaining duplicate backend contracts. The admin UI is separately deployed and protected, but calls the same versioned API; it is not a second backend or a microservice.

## 3. Final technology decisions

| Area                      | Decision                                                                                                                                                                                                                | Reason / boundary                                                                                                                                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend                   | Python, Django, Django REST Framework (DRF), modular monolith                                                                                                                                                           | Matches the project rules; mature ORM, migrations, permissions and API ecosystem. Split by Django app/domain, not service.                                                                                                                                                                     |
| Database                  | PostgreSQL                                                                                                                                                                                                              | Relational constraints and transactions suit curriculum, membership, submissions and audit workflows; JSONB can hold versioned experiment configuration where schema validation remains explicit.                                                                                              |
| Cache / jobs              | Redis and Celery when asynchronous work is introduced                                                                                                                                                                   | Matches project direction; use for reliable retries, notification/outbox processing and analytics aggregation. Do not make core correctness depend on cache state.                                                                                                                             |
| Realtime                  | REST for MVP; defer Django Channels                                                                                                                                                                                     | No student-device synchronization or chat in MVP. Teacher Live mode is local to the teacher's screen.                                                                                                                                                                                          |
| Web                       | Next.js, React and TypeScript in strict mode; installable PWA                                                                                                                                                           | Responsive public, learner and teacher experience; type-safe components and established routing/build ecosystem.                                                                                                                                                                               |
| Simulation                | Three.js (WebGL) + React Three Fiber primary 3D engine; PixiJS 2D canvas Lite mode fallback                                                                                                                             | Approved decision (Proposal v1.1 & UI Guide v1.0 §9.8): real-time 3D for spatial realism, physical phenomena, and VR-readiness; Lite fallback for cheap devices or when WebGL is unavailable. Under 4 MB bundle budget.                                                                        |
| Shared contracts          | OpenAPI-generated API client/types; versioned JSON Schema for experiment definitions                                                                                                                                    | Avoids drifting handwritten API types and lets Python and TypeScript validate a common experiment format.                                                                                                                                                                                      |
| Styling/design            | CSS variables/design tokens and shared React component package; Tailwind only if approved in M0                                                                                                                         | Preserves exact guideline tokens without making a styling framework a dependency by assumption. Initial recommendation: CSS modules/global tokens, no new heavy UI kit.                                                                                                                        |
| Backend tests             | pytest, pytest-django, DRF API client; focused unit, permission, migration and integration tests                                                                                                                        | Readable tests for domain behavior, API contracts, authorization and transactional flows.                                                                                                                                                                                                      |
| Frontend/simulation tests | Vitest + React Testing Library; Playwright for key browser/PWA journeys                                                                                                                                                 | Fast component/logic tests plus real browser coverage for touch, keyboard, offline and end-to-end behavior.                                                                                                                                                                                    |
| Lint/format/type checks   | Ruff lint + Black format for Python; ESLint + Prettier + TypeScript strict checks for JS/TS. Python type annotations required; add a checker/plugin only after compatibility is confirmed in M0.                        | Follows project instructions and avoids conflating linting and formatting. CI must run the same commands locally and remotely.                                                                                                                                                                 |
| API documentation         | DRF-generated OpenAPI schema, served in non-production or authenticated staff docs                                                                                                                                      | Contract-first generated reference and typed frontend client. API base path is `/api/v1/`.                                                                                                                                                                                                     |
| Local development         | Docker Compose for web/API, PostgreSQL and Redis; seeded development data                                                                                                                                               | Reproducible onboarding without requiring production cloud access.                                                                                                                                                                                                                             |
| CI/CD                     | GitHub Actions: format/lint, type checks, unit/API tests, frontend tests, schema validation, production builds, dependency/security checks; deploy only from protected branches/environments after approval             | Fits the expected GitHub workflow and provides gated, repeatable delivery.                                                                                                                                                                                                                     |
| Hosting                   | AWS managed/container deployment: ECS Fargate for API, web/admin and Celery workers; RDS PostgreSQL; ElastiCache Redis; S3 + CloudFront for static/media delivery; Secrets Manager; CloudWatch/managed error monitoring | Managed building blocks reduce operations load while preserving container portability and horizontal scaling. The admin UI has its own protected origin and deployment. Select the cloud region only after latency, data residency and legal review; do not assume a nonexistent local region. |
| Media                     | Object storage with CDN, immutable/versioned asset keys and size validation                                                                                                                                             | Supports cacheable lessons, audio and simulations without serving large assets from the API.                                                                                                                                                                                                   |
| Security/auth             | Django secure server-side sessions in HttpOnly, Secure, SameSite cookies for same-site web/API origins; CSRF protection for unsafe requests; separate staff login policy with mandatory MFA                             | Avoids browser-persisted bearer tokens; exact domain/origin and recovery flow must be tested in M0. Staff access is invite-only.                                                                                                                                                               |
| Observability             | Structured logs without personal data, metrics, traces/error reporting, uptime checks, security alerts and backup/restore drills                                                                                        | Required to verify performance, availability, suspicious admin activity and incident recovery.                                                                                                                                                                                                 |

**Version policy:** pin compatible, supported dependency versions in manifests/lockfiles during M0; do not guess versions in this plan. Upgrades require CI, migration and browser/device checks. All third-party assets and dependencies require license review. Avoid adding a UI library, circuit simulator, analytics vendor or notification provider without approval.

## 4. MVP milestones

**Delivery convention:** two-week iterations, demo and review at each milestone boundary. Estimates assume a small cross-functional team, active product owner, designer/QA shared across work, and a curriculum reviewer available. M0 includes discovery gates; feature milestones are not estimates for the entire proposal's Phase 0 research. Re-estimate after M0. Tasks are deliberately scoped to one focused engineering/content session where possible. Each milestone is accepted before work proceeds; progress remains “Not started” until approval and implementation.

### M0 — Foundation

**Progress:** In progress — the technical foundation is implemented and local checks pass. M0 acceptance is still pending the external validation/approval gates documented in `docs/discovery/m0-validation.md`, plus Docker Compose smoke testing in an environment with Docker.

**Goal / user-visible result:** team can build, run and validate a secure shell of the product locally; the public/learner PWA shell, initial design system and staff-auth foundation exist. Product owner has an agreed, bounded MVP.

**Checklist**

- [ ] Confirm pilot cohort, MVP boundary, final named 10-experiment shortlist, content reviewer and two distinct staff approvers. The product owner approved this plan; these operational/content details remain open.
- [x] Resolve canonical documentation paths; create decision log and API/error conventions.
- [x] Establish npm monorepo workspaces, package scripts, environment variable contract and secret-safe `.env.example`.
- [x] Create API/web Dockerfiles and local Compose for web, API, PostgreSQL and Redis; document setup and stop/reset. Compose startup is not verified because Docker is unavailable in this environment.
- [x] Add GitHub Actions CI for formatting, lint, tests, type checks, builds and dependency checks. Equivalent commands pass locally; hosted GitHub Actions has not run because this workspace is not a Git repository.
- [x] Add Django project, strict-TypeScript Next.js learner/admin shells, PixiJS package placeholder and shared UI/types/schema packages.
- [x] Add server-side session/CSRF configuration and a fail-closed MFA staff-access gate; keep staff sign-in disabled and do not expose consumer registration or admin operations.
- [x] Implement design tokens, responsive base layout, public shell, PWA manifest and service-worker shell.
- [x] Add accessible global navigation/layout, loading skeleton, empty/error/offline components, theme and reduced-motion foundations.
- [x] Record the performance test envelope and privacy-safe event taxonomy; no analytics vendor or event ingestion is enabled.
- [ ] Run 20 teacher / 30 learner discovery interviews and 10 learner / 5 teacher prototype usability sessions, or record a product-owner-approved alternative if recruitment is not possible.
- [ ] Map MVP experiment requirements to Nigerian curriculum/exam references; complete circuit engine/license spike and legal/privacy review. A validation checklist is recorded, but research, license opinion and legal advice have not been performed.

**Backend:** Django app/config, health/readiness endpoints, versioned URL router, error format, staff identity/session foundation and coarse RBAC primitives; no public user CRUD. Compose health checks for PostgreSQL/Redis. Establish migration/test conventions.

**Frontend:** Next.js public shell and installable PWA metadata; responsive navigation/base routes; design tokens (light/dark, subject colors, spacing, typography, radius, motion); accessible shared button, field, card, banner and skeleton primitives; staff sign-in placeholder/flow protected from public routes.

**Tests required:** Docker Compose smoke test (pending runtime); Django health/readiness, cookie/CSRF/auth and API-error tests; TypeScript strict build; token and responsive UI checks; PWA manifest/service-worker smoke test; lint/format/type-check/build and dependency audits locally; basic axe/manual keyboard check and cold-load budget baseline (physical device/throttled network pending).

**Definition of done:** a new contributor can run the documented stack; CI is green on a clean checkout; no secrets are committed; public pages render at 360 px and desktop; staff access is invite-only with MFA design decision recorded; auth and error responses are consistent; discovery findings and accepted MVP scope are recorded; approval gate signed by product owner. The checked-in technical foundation meets the locally testable parts; M0 remains in progress until the outstanding environment and product-owner validation gates are accepted or completed.

### M1 — Core data models

**Progress:** Completed for the M1 foundation. The initial domain model layer, migration, fixtures, and migration safety note are in place; the focused Django model validation passes.

**Goal / user-visible result:** no new major user workflow yet; the product has a migrated, tested relational foundation for curriculum, accounts, labs, classes, attempts, social safety and events.

**Checklist**

- [x] Define domain ownership, IDs, timestamps and uniqueness constraints for the initial MVP model set.
- [x] Implement the initial models and migration set covering curriculum, user profiles, classes, assignments, attempts and moderation entities.
- [x] Add development fixtures for subjects, levels, terms, topics, and seed identities via the M1 development seed command.
- [x] Add model-level validation and database constraints for the core membership/status/version invariants represented in the initial model set.
- [x] Add migration test and backup/restore smoke procedure guidance in the M1 ADR.
- [x] Write a lightweight architecture decision record for the schema and migration safeguards.

**Backend:** models for user/profile/staff RBAC; curriculum and versioned content; lab/attempt/event; classes/groups/connections; assignment/submission/grading; moderation; analytics; feature flags and audit. Use explicit domain service boundaries. Avoid creating Phase 2 billing/chat workflows beyond extensible records or documented deferrals.

**Frontend:** shared TypeScript schemas/types generated from OpenAPI; typed API client scaffolding; local fixture contracts only (no feature UI beyond shell).

**Tests required:** model validation and unique constraints; migration from empty database; migrations apply twice/forward safely; fixture loading; representative transactional and foreign-key behavior; OpenAPI schema generation and TypeScript type generation.

**Definition of done:** models cover all proposal entities with explicit relationships and MVP/phase labels; migrations apply in clean CI; no business-critical invariant relies only on frontend validation; schema and ERD description in Section 6 are kept synchronized.

### M2 — Admin portal core

**Progress:** Partly complete. Staff invite/MFA, role checks, two-person approval primitives, audit logging, read APIs and initial admin flows are implemented. The complete curriculum CRUD/review experience, moderation actions, audit review experience and full security/accessibility test matrix remain incomplete. M2 is not ready to close.

**Goal / user-visible result:** authorized staff can sign in with MFA, manage core curriculum records, review/publish approved content, verify teachers, and handle basic user/report actions with an audit trail.

**Checklist**

- [x] Implement invite-only staff provisioning, MFA enrollment/recovery policy and short session expiry.
- [x] Implement role/permission checks for implemented admin actions, enforced by the API.
- [ ] Add protected admin domain/deployment pipeline and production environment banner.
- [ ] Build complete curriculum list/detail/edit screens for all listed curriculum records.
- [x] Add server-side review/publish state transitions and independent approval primitives.
- [ ] Enforce second-person approval for every sensitive action; role changes, deletion and exports are not implemented.
- [x] Record append-only audit events for implemented actions.
- [ ] Build a complete protected audit review UI.
- [x] Add user search with least-data projection and field masking.
- [x] Add teacher verification queue and approval/rejection flow.
- [ ] Implement report actions, suspend/reinstate and content removal; current moderation view is only a queue.

**Backend:** staff, role/permission, invitation, MFA state, approval request, content workflow, audit log and admin read/write endpoints. Sensitive actions require requester and approver to differ. Every action is permission-checked on server and logged. Export functionality is disabled unless approval/audit support is complete.

**Frontend:** separate admin app; login/MFA, curriculum tree and forms, review queue, preview, teacher verification, user search, moderation queue placeholder, audit list/detail; masked data, confirmation dialogs, loading/empty/error states and security cues.

**Tests required:** MFA-required and session-expiry tests; each role/action allow/deny matrix; object-level access tests; approval cannot self-approve or replay; audit before/after records and append-only service behavior; curriculum CRUD/workflow/API tests; admin route guard and accessibility tests.

**Definition of done:** no unreviewed content can be published; no sensitive admin action can bypass server-side permission and second approval; the minimum two-person staff workflow works; audit can reconstruct who/what/when without recording credentials or unnecessary personal data.

### M3 — Student and teacher accounts and verification

**Progress:** Engineering foundation largely implemented; product/legal acceptance gates remain open. Registration, sessions, recovery, profiles, onboarding, verification, privacy defaults and policy acceptance are present. Signup identifier, age/notice and verification policy require M0 follow-up decisions before launch. API suite most recently passed 40 tests.
**Goal / user-visible result:** learners can create an account and profile; a prospective teacher can request verification; verified teachers gain teacher capabilities without school registration.

**Checklist**

- [ ] Finalize signup identifier, age/notice handling, recovery and email/phone verification policy in M0 follow-up approval.
- [x] Implement signup, login, logout, account recovery, terms/privacy version acceptance and session management.
- [x] Implement StudentProfile and TeacherProfile capability records and safe role switching.
- [x] Build student onboarding for level, subjects and avatar; username is collected during registration.
- [x] Build teacher application, minimized evidence reference, status and verification badge state.
- [x] Enforce private-by-default profile and privacy preferences.
- [x] Add scoped rate limits for signup, login, recovery and verification.

**Backend:** user registration/profile endpoints; teacher verification application and status; policy acceptance records; profile/privacy preferences; staff-only verification; server enforcement that unverified teachers cannot create classes or receive teacher requests. Do not add institution accounts or parent accounts.

**Frontend:** signup/login/recovery/onboarding; student and teacher dashboards' account shells; verification status explanation; editable privacy preferences; form validation and accessible errors.

**Tests required:** signup/auth/recovery, duplicate identifier and rate-limit tests; role-switch and profile privacy tests; teacher verification allowed/denied matrix; policy acceptance version tests; session/CSRF/security tests; onboarding component/E2E tests at mobile viewport. API tests run locally; frontend E2E and mobile accessibility coverage remain outstanding.

**Definition of done:** a student can complete onboarding and has private defaults; a teacher can request verification but cannot use privileged teacher functions until approved; no school account or unapproved parent flow exists; account recovery and legal notices are reviewed.

### M4 — Content delivery

**Progress:** Core delivery engineering is implemented and tested. M4 is partly complete pending an owner-approved curriculum authority, subject-reviewed lesson pack, asset rights evidence and a production object-storage/CDN decision. No lesson content or media is preapproved in this repository, so the learner API has no publishable lesson until those inputs are supplied and reviewed.

**Goal / user-visible result:** users can browse published, curriculum-tagged learning content that is versioned and delivered efficiently to the PWA.

**Checklist**

- [x] Implement the existing subject/level/course/term/topic/week hierarchy. Official curriculum and exam-body mappings remain an M0 owner decision.
- [x] Implement published-content reads, immutable lesson versions and content-hash asset URLs.
- [x] Add scheme-of-work browsing and topic detail APIs and pages.
- [x] Add lesson text, media metadata, transcripts/captions, safety notes and synchronized WebVTT delivery.
- [x] Add version hashes, ETags and cache headers; lesson details explicitly report that offline download is not enabled.
- [x] Validate lesson asset MIME type, checksum, rights metadata and file/pack size caps.
- [ ] Validate experiment configuration files; this is completed with the M5 experiment schema and authoring flow.
- [x] Prepare the asset register and reviewer checklist templates.
- [ ] Create and rights-clear the actual curriculum content pack and media assets.
- [ ] Configure signed object storage/CDN delivery after hosting and storage ownership are approved.

**Backend:** public read-only published subject/course/level/topic/scheme/lesson endpoints; staff-only lesson authoring; separate reviewer and four-eyes publication approvals; asset metadata with versioned redirects; ETag and cache headers. Draft and rejected material are never returned to learner APIs. Redirect targets use HTTPS; signing/CDN integration remains dependent on the hosting decision.

**Frontend:** subject/term/scheme browser, topic page, lesson player with transcript and native caption tracks, content version/offline eligibility indicator, loading/empty/error/offline states.

**Tests required:** published-vs-draft visibility; curriculum filtering/order; cache/version invalidation; schema/asset validation; captions/transcript rendering; API pagination and authorization tests; content pages accessibility and slow-network test.

**Definition of done:** only reviewer-approved immutable versions reach learner clients; users can browse scoped MVP curricula; every audio asset has transcript/captions; media is versioned, licensed and size-checked.

### M5 — Simulation engine v1 and filtration

**Progress:** 3D engine upgrade in progress. The deterministic rules, schema, and 2D canvas Lite fallback were implemented. Upgrading primary simulation stage to real-time 3D (Three.js + React Three Fiber) with OrbitControls, physical shaders (liquid, glass, glow), dynamic quality tiers, and haptic/audio feedback per Master UI Guide §9.8 and Proposal v1.1. Subject-review and physical device profiling remain external gates.

**Goal / user-visible result:** a user can run the first reviewed, config-driven interactive experiment—filtration—in an immersive, real-time 3D lab environment on a phone or desktop, with a 2D Lite fallback.

**Checklist**

- [x] Specify and version experiment JSON Schema: apparatus, states, actions, rules, steps, outcomes, scoring hooks, narration/captions, assets.
- [x] Implement deterministic experiment state transitions and validation separate from rendering.
- [x] Implement PixiJS 2D Lite fallback stage and apparatus interactions.
- [x] Implement 3D simulation stage using Three.js + React Three Fiber with camera orbit, zoom, and preset viewpoints.
- [x] Implement 3D apparatus models and interactions for filtration: retort stand, funnel, filter paper, conical flask, beaker with mixture.
- [x] Add 3D visual effects: liquid pouring with meniscus, droplets, teal snap-ring highlights, and ghost drop targets.
- [x] Add guided step progression, safe incorrect-action feedback, reset/undo policy, and multi-sensory feedback (sound, vibration, visual twins).
- [x] Add narration/caption cues, reduced-motion behavior (disables camera shake/particles) and accessibility keyboard/tap alternatives.
- [ ] Package filtration as a subject-reviewed content definition; runtime compatibility is versioned.
- [x] Verify the 3D bundle against the performance budget (under 4 MB compressed on-demand bundle).
- [ ] Measure frame rate across Low/Medium/High quality tiers on representative test devices.

**Backend:** store/publish validated experiment definitions and versioned assets through content service; record experiment/version metadata on lab sessions. The experiment rules run in the browser; server validates submitted event envelope and supported schema/version.

**Frontend:** reusable engine package and filtration stage; responsive apparatus tray and feedback; teacher/student launch adapter; sound/motion preferences.

**Tests required:** schema valid/invalid fixtures; engine deterministic rule/state unit tests; apparatus interaction tests for touch/mouse/keyboard alternatives; filtration happy-path and safe-failure tests; browser screenshot/viewport smoke; reduced-motion/caption tests; bundle <=1.5 MB and low-end frame profiling.

**Definition of done:** filtration passes subject expert review, runs without network after bundle is downloaded, provides accessible non-drag interactions, records a deterministic action sequence, and meets asset/performance budget on agreed test device.

### M6 — Student Lab

**Progress:** Partly complete — the student dashboard now reads the learner progress API and offers a continue-practical card; the filtration workbench has guided/free modes, server-verifiable scoring support, local version-bound save/resume, deterministic replay and friendly results. Session ownership, resume and progress aggregation are covered by focused API tests. M6 is not ready to close: the local preview is not yet connected to server sessions/checkpoints, the five additional Chemistry procedures and apparatus-identification lesson are absent, and Chemistry reviewer plus low-end-device validation remain external release gates. Filtration itself remains a preview pending subject review.

**Goal / user-visible result:** a student can discover a topic, choose guided or free exploration, practise in the lab, receive a score/explanation and retry.

**Checklist**

- [x] Build student dashboard and continue-learning card.
- [x] Build Student Lab workbench, apparatus tray, step counter, hint, undo/reset and check-work controls.
- [x] Add guided/free mode, local progress persistence and finish/results screen.
- [x] Implement deterministic practical scoring and friendly feedback; server recomputes submitted score.
- [x] Save local draft state safely and bind each attempt to exact experiment ID/version/runtime.
- [ ] Produce/review the remaining five Chemistry procedure configs: evaporation, simple distillation, fractional distillation, decantation and chromatography.
- [ ] Add apparatus identification learning content (does not count toward the ten unless approved as a standalone simulation).
- [ ] Test all Chemistry experiments with subject reviewer and low-end devices.

**Backend:** lab/session and attempt creation; save checkpoint/final result; student progress read models; ownership checks. Enforce experiment publication status/version. No assignment submission logic yet.

**Frontend:** Student home, curriculum/topic screens, lab and results; skeleton/empty/error/offline states; responsive controls and optional animation/audio preferences.

**Tests required:** student authorization and ownership; create/resume/finalize attempt; score consistency; progress aggregation; all six Chemistry definition acceptance tests; guided/free E2E; touch, keyboard, screen reader, dark theme, reduced motion and mobile performance checks.

**Definition of done:** student journey from dashboard to result works; all six named Chemistry experiments are complete/reviewed; progress survives reload; scoring and feedback are deterministic; no public result exposes private profile data.

### M7 — Teacher Lab: auto-play and local Live

**Progress:** Not started.

**Goal / user-visible result:** a verified teacher can choose any MVP experiment, run narrated Auto-play or operate it Live from the teacher's own screen, and use projector-friendly controls.

**Checklist**

- [ ] Add four reviewed Basic Electronics simulations: component identification, series circuit, parallel circuit, and simple wiring/fault diagnosis (final content can be adjusted at M0).
- [ ] Implement teacher topic library and preview-as-student.
- [ ] Implement Auto-play with pause, rewind, slow motion, step and captions.
- [ ] Implement Live mode as teacher-controlled, local-screen interaction; no student-device sync.
- [ ] Add full-screen projector stage, high-contrast theme, large labels, laser pointer and question pause.
- [ ] Add save-to-lab and preferences; expose assignment action only when M9 is ready.
- [ ] Verify total launch catalogue of at least 10 independently playable, reviewer-approved simulations.

**Backend:** teacher capability permission checks; publish/version and experiment library queries; teacher session metadata where needed. No WebSocket service for local playback.

**Frontend:** Teacher Lab, mode switch, playback timeline, projector controls and responsive phone/tablet fallback; support all six Chemistry and four Electronics definitions.

**Tests required:** verified/unverified teacher permission tests; Auto-play deterministic pause/rewind/slow/step tests; local Live does not emit student synchronization traffic; all four Electronics acceptance tests; 10-experiment catalog count/reviewer gate; projector contrast and large-text checks.

**Definition of done:** verified teacher demonstrates an entire experiment from their own device; students are not required to join Live; all ten simulations pass expert review and automated configuration/runtime validation; MVP content scope is frozen.

### M8 — Classes and class codes

**Progress:** Not started.

**Goal / user-visible result:** a verified teacher can create a class and share a code/link; students can join with automatic or approval-first admission.

**Checklist**

- [ ] Implement class creation/edit/archive and teacher ownership.
- [ ] Generate high-entropy, rate-limited, revocable class codes and signed/opaque invitation links.
- [ ] Implement student code/link join and class-approval queue.
- [ ] Add roster, remove member, student leave and class status.
- [ ] Add one-tap copy/share UX including WhatsApp-compatible link without disclosing extra profile data.
- [ ] Enforce class membership as the boundary for roster and future assignments.
- [ ] Define expiry, rotation, brute-force and duplicate-join behavior.

**Backend:** class, membership and invite endpoints; teacher verification checks; class owner/member policies; code throttling and invite revocation; audit sensitive membership/admin changes.

**Frontend:** teacher class create/settings/roster/code card; student join-by-code/link and approval status; empty/loading/error/offline states.

**Tests required:** verified ownership, class isolation, automatic/approval workflows, code entropy/expiry/revocation/rate limiting, duplicate and leave/rejoin cases, invite link privacy, mobile share/accessibility E2E.

**Definition of done:** only verified teachers own classes; unauthorized users cannot infer roster or class existence; both join modes and leave/removal work; codes can be rotated and abused codes throttled.

### M9 — Assignments, submissions, attempt replay and grading

**Progress:** Not started.

**Goal / user-visible result:** a teacher assigns an experiment to a class or selected students; students submit an attempt; teacher replays it, grades and provides feedback.

**Checklist**

- [ ] Add assignment brief, experiment/version, deadline, audience and rubric editor.
- [ ] Add assignment status/recipient tracking and in-app notifications.
- [ ] Add student assignment list, start-in-lab and submit confirmation.
- [ ] Store ordered, bounded, versioned AttemptEvents and checkpoints with idempotent writes.
- [ ] Build replay timeline with scrubber, mistake markers and deterministic state reconstruction.
- [ ] Build rubric grading, score validation, feedback and grade return.
- [ ] Implement late/closed/resubmission policy and assignment audit history.
- [ ] Ensure all assignment/replay endpoints scope to teacher-class relationship and assigned student.

**Backend:** assignment, rubric, recipient, submission, attempt-event, grade/feedback and notification services/endpoints; object-level access; payload limits, idempotency and transaction semantics. No auto-grade override without server validation.

**Frontend:** teacher create/assignment/submission queue/replay/grade screens; student brief/attempt/submit/results; status chips with icon+text; loading/error/offline states.

**Tests required:** end-to-end assignment lifecycle; recipient and class isolation; deadline/resubmission boundary tests; event ordering, duplicate/replay and tampering tests; rubric totals and grade visibility; replay deterministic snapshot tests; private feedback tests; mobile/keyboard E2E.

**Definition of done:** complete assignment cycle works; replay reproduces the submitted attempt step by step; teacher can grade and return feedback; students cannot read another student's attempt/grade; large/malformed event payloads are rejected safely.

### M10 — Friends and groups

**Progress:** Not started.

**Goal / user-visible result:** learners can make controlled connections, create invite-only groups and see a small, safe activity feed.

**Checklist**

- [ ] Implement follow/friend request, accept, reject, remove and connection status.
- [ ] Implement teacher-student connection requests with approved/verified restrictions.
- [ ] Implement student-owned invite-only groups and member invitations.
- [ ] Enforce invitee is an accepted connection or classmate; define group owner handoff/removal.
- [ ] Build minimal structured feed events (achievement, shared experiment result, group update).
- [ ] Add privacy controls and per-item block/report entry points.
- [ ] Exclude direct/group messaging, public text posts and unrestricted discovery (Phase 2 or future decision).

**Backend:** connection, group, membership and activity feed endpoints; relationship-aware privacy and visibility; audit membership actions where needed.

**Frontend:** connections list/requests, group create/detail/invite, safe feed and privacy controls; empty/error/loading/offline states.

**Tests required:** relationship state machine, group eligibility/invite-only rules, user/block privacy matrix, feed visibility and pagination, mass-invite/rate limits, screen-reader accessible report/block controls.

**Definition of done:** only intended users can discover/interact with a learner; group membership rules are enforced on server; no messaging or unrestricted user-generated feed is present; all social surfaces expose safety actions.

### M11 — Block, mute, report and basic moderation

**Progress:** Not started.

**Goal / user-visible result:** learners can control unwanted interactions and report abuse; authorized moderators can investigate and take proportionate action.

**Checklist**

- [ ] Implement block and mute semantics and make effects consistent across feed, connection, group and class views.
- [ ] Add report reasons, contextual evidence minimization and user confirmation.
- [ ] Add abuse/profanity filtering for MVP text inputs; make limitations explicit to moderators.
- [ ] Implement moderation case queue, triage, assignment, notes, outcome, suspend/reinstate and content removal.
- [ ] Restrict sensitive report evidence and log staff access.
- [ ] Add user-facing report receipt/status without exposing reporter identity to reported user.
- [ ] Define escalation, urgent child-safety response, retention and deletion process with legal advisor.

**Backend:** block/mute/user report/moderation case endpoints; moderator permissions and audit; rate limits, content action history and report access controls.

**Frontend:** one-tap block/mute/report flows; moderator queue/case detail with masked data and confirmation; clear success/error and appeal/contact path per approved policy.

**Tests required:** visibility/communication behavior after block/mute; reporter identity confidentiality; moderator role matrix; case lifecycle and audit trail; abuse-filter false-positive/override tests; rate limits and evidence-retention checks.

**Definition of done:** every launch social surface has a working safety path; unauthorized staff/users cannot access reports; block/mute behavior matches documented policy; moderation actions and evidence access are auditable; safety response contacts/process are staffed for pilot.

### M12 — Event tracking and MVP measurement

**Progress:** Not started.

**Goal / user-visible result:** product owner can measure activation, learning and quality outcomes without collecting unnecessary personal data.

**Checklist**

- [ ] Finalize event names, schemas, retention and KPI definitions.
- [ ] Implement privacy-safe event ingestion and client/server event validation.
- [ ] Add deduplication, consent/notice behavior as legally approved, and sampling policy if needed.
- [ ] Capture registration, first experiment, completion, assignment, class, teacher lab and error/performance events.
- [ ] Add minimal internal KPI dashboard/export with role checks and audit logging.
- [ ] Test event delivery when offline; replay must not double count.
- [ ] Verify no names, email, phone, free-text feedback or sensitive report data enters analytics.

**Backend:** AnalyticsEvent ingestion and aggregation; event schema/version, dedupe keys, bounded retention; analyst/product-owner read endpoints; exports gated by approval and audit.

**Frontend:** event instrumentation via typed allowlisted helper; no direct vendor tracking; minimal authorized KPI views; no student-facing leaderboard in MVP.

**Tests required:** schema/allowlist validation, PII redaction/rejection, dedupe and offline replay, authorization/export audit, KPI aggregation against seeded known data, consent/notice behavior, dashboard accessibility.

**Definition of done:** owner can calculate MVP KPIs (Section 9) from verified event definitions; tracking failures do not block labs/submissions; retention and access are documented; personal data is absent from event payloads.

### M13 — Basic offline mode

**Progress:** Not started.

**Goal / user-visible result:** users can download approved lessons and simulations, practise offline, and later sync work safely.

**Checklist**

- [ ] Define offline eligibility, storage quota, expiry/version invalidation and user-initiated downloads.
- [ ] Cache application shell and selected content/experiment assets.
- [ ] Persist local attempts and submission outbox with encryption/platform storage review.
- [ ] Add sync retry, idempotency, conflict/error state and user-visible last-sync status.
- [ ] Handle logout, shared-device privacy and local data clearing.
- [ ] Test offline states for auth expiry, content revocation, insufficient storage and failed sync.

**Backend:** idempotent sync/submission endpoint, version support and dedupe; conflict response shape; no offline class membership or grading writes. Apply rate/size limits and expire stale submissions safely with explanation.

**Frontend:** offline banner, download manager, cached lesson/lab launch, local attempt queue, sync status/retry and settings for clear data; never claim a submission is received until server confirms.

**Tests required:** Playwright offline/online transitions, queue retry without duplicate submission, conflict/revoked-version cases, service-worker cache update, storage failure/logout cleanup and large/offline asset budgets.

**Definition of done:** downloaded approved experiments run offline; attempts are preserved until a clear sync outcome; queued submissions are idempotent and visibly pending; online-only actions fail clearly; privacy on shared devices is addressed.

### M14 — Performance and security hardening

**Progress:** Not started.

**Goal / user-visible result:** pilot candidate meets the agreed device/network budgets and has no unresolved critical/high security or privacy defects.

**Checklist**

- [ ] Run dependency, secret, static analysis and container scans; review licenses.
- [ ] Threat-model auth, minors, social graph, classes/invites, content publishing, replay, moderation and admin.
- [ ] Conduct focused penetration test and remediate critical/high findings.
- [ ] Load test API, PostgreSQL hot paths, event ingestion and assignment replay.
- [ ] Profile cold PWA load and all ten simulations on low-/mid-range Android.
- [ ] Tune indexes, pagination, asset compression, lazy loading and cache policy based on measurements.
- [ ] Verify TLS, secure headers, CSRF, rate limits, password/session policy, backup restore and key rotation.
- [ ] Test least privilege, four-eyes actions, audit tamper evidence and alert delivery.
- [ ] Confirm privacy/legal, data retention, incident response and support runbooks.

**Backend:** fix measured query/API bottlenecks; enforce request/body/action limits; validate headers/origin/cookies; verify restore/retention and security alerts. No speculative microservices or partitioning.

**Frontend:** bundle analysis, image/font/simulation lazy loading, memory/frame profile, reduced-motion/accessibility/performance fixes and offline upgrade test.

**Tests required:** full targeted regression suite; dependency/container scans; DAST/API authorization and rate-limit suite; load tests with agreed pilot target; Lighthouse/Web Vitals plus real-device measurement; backup restore and incident/alert tabletop.

**Definition of done:** zero open critical/high security findings; all ten experiments pass review and budgets; homepage critical compressed assets <=300 KB and interactive <=5 seconds on agreed cold 3G profile; simulation bundle <=1.5 MB each and smooth target frame rate on agreed low-end device; pilot SLO and monitoring are documented.

### M15 — Launch readiness and controlled pilot

**Progress:** Not started.

**Goal / user-visible result:** a small invited cohort of verified teachers and students can use the MVP in a monitored pilot with support and rollback in place.

**Checklist**

- [ ] Complete legal review, terms/privacy notices and required child-safety/data-handling sign-off.
- [ ] Complete content QA, curriculum mapping, attribution and scientific/safety approval for all ten simulations.
- [ ] Create production accounts, second approver and quarterly staff access-review date.
- [ ] Verify production backups, restore, secrets, deploy/rollback, DNS/TLS, CDN, alerts and status page.
- [ ] Run full student, teacher, assignment, moderation and offline acceptance journeys.
- [ ] Recruit small pilot cohort; provide onboarding/support channel and feedback process.
- [ ] Review support/moderation staffing, escalation coverage and incident contacts before inviting minors.
- [ ] Define pilot success thresholds and stop/rollback criteria with the product owner.
- [ ] Run an accessibility and low-end-device review with actual users.
- [ ] Release incrementally behind feature flags; monitor daily and triage feedback.
- [ ] Update `docs/PLAN.md` progress and record accepted follow-on work.

**Backend:** production configuration, migrations and seed/admin bootstrap procedure, health checks, alerting, audit retention, backups and rollback safeguards; no test credentials.

**Frontend:** production PWA install/update behavior, feature flags, feedback/help, legal links, analytics notice, supported-browser guidance and accessible final QA.

**Tests required:** release-blocking CI; production smoke; complete Playwright critical paths; restore and rollback rehearsal; invite/role/admin approval tests; event/KPI check; manual accessibility, offline and real-device run-through.

**Definition of done:** product owner signs launch checklist; legal/safety/content approvals are recorded; no unresolved critical/high security defects; pilot access is controlled; restore/rollback and support/moderation coverage are proven; success/stop criteria are measurable.

## 5. Suggested milestone order and dependencies

Recommended sequence is M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9 → M10 → M11 → M12 → M13 → M14 → M15. This follows the requested order: foundation (including Docker, CI, auth/roles, tokens, base layout and PWA shell), core data, admin core, student/teacher accounts and verification, content delivery, filtration/engine v1, Student Lab, Teacher Lab, classes/codes, assignments/replay/grading, friends/groups, moderation, event tracking, offline, hardening, launch.

Content production and subject review are the principal parallel track: start curriculum mapping in M0; prepare authoring assets with M4; implement filtration in M5; the six Chemistry definitions are complete by M6; the four Electronics definitions are complete by M7. All ten are a hard gate for M7 acceptance and M15 launch. Parallel work does not authorize adding an unreviewed experiment to production.

Important dependencies:

- M1 models enable M2 admin and later domain features.
- M2 must be able to publish reviewed content before M4/M5 content is released.
- M3 verified teacher capability is required by M7 and M8.
- M5 engine and M4 published content enable M6/M7 labs.
- M8 class membership is required for class-scoped assignments in M9.
- M9 attempt event recording must be deterministic before replay/grading acceptance.
- M10 social features cannot release before M11 safety actions and moderation are operational; M11 is deliberately sequenced immediately after M10, but M10 must remain feature-flagged until M11 DoD is met.
- M12 event taxonomy starts in M0; full KPI pipeline comes after core workflows exist.
- M13 depends on stable content versions and idempotent submission behavior from M9.
- M14/M15 cannot waive legal, safety, content review, privacy or security gates.

## 6. Database schema: ERD description and Django models

### ERD description

- `User` is the single consumer identity. It has zero or one `StudentProfile` and zero or one `TeacherProfile`; staff authentication is separate (`StaffAccount`). A teacher profile has a verification status and approval history. A person can hold both consumer capabilities without duplicate identities.
- `StaffAccount` has many-to-many `StaffRole`; roles map to fine-grained `Permission` records. Staff invitations, MFA enrollment/recovery and sensitive `ApprovalRequest` records are auditable. Approval requester and approver must be distinct.
- Curriculum hierarchy: `Subject` → `Course` and `Level` associations → `Topic`; `SchemeOfWork` is scoped to level/course, subject and term; `SchemeTopic` maps ordered topic/week entries. A `Topic` has versioned `Lesson` and `Experiment` references.
- `ContentItem`/`ContentVersion` represent editable curriculum or lesson/experiment content. `Approval` records review/publish decisions. An `Experiment` version references `Asset` records (image, audio, narration/captions, simulation data) and validated configuration schema.
- `User` owns `Lab`; `LabSession` binds the user, experiment version and mode. It has ordered `AttemptEvent` rows and optional periodic snapshots. Attempts can be attached to one `Submission`; a submission references one `Assignment`, one student and one attempt.
- `Assignment` is owned by a verified teacher and targets a `Class`, selected `User`s or an eligible `Group`; `Rubric` has ordered `RubricCriterion`s. `Grade` and `Feedback` are tied to a submission and grader. Class-scoped access is enforced from membership/ownership, not from a client-supplied ID.
- `Class` is owned by a verified `TeacherProfile`; `ClassMember` represents student roster state; `ClassInvite` stores hashed, expiring/revocable codes or link tokens. `Group` is student-owned; `GroupMember` stores invitation/membership state and enforces eligibility.
- `Connection` stores directed follows and request/accepted relationship state with constraints against duplicate/self edges. `Block` and `Mute` are directed user preferences; `UserReport` creates a `ModerationCase` and does not expose reporter identity to the reported user.
- `AnalyticsEvent` is a minimized, versioned event record; aggregate KPI views are derived. `Notification` refers to an in-app recipient and safe event payload. `Announcement` is staff-managed and phase-gated.
- `FeatureFlag` and `SupportTicket` support platform operations. `DeviceSyncQueue` is primarily client-side; server-side sync receipts/idempotency keys record accepted offline submissions. `AuditLog` is append-only and captures staff/admin actions.
- Phase 2: `LabReport`, `Badge`, `Streak`, `Achievement`, `Subscription`, `Payment`; payment-provider details must not be stored beyond token/reference and required reconciliation data.

### Django model list

MVP models (grouped by Django app; names are logical names and may be consolidated where migrations remain clear):

| Django app    | Models                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`       | `User` (custom auth model from M0), `StudentProfile`, `TeacherProfile`, `TeacherVerification`, `PolicyAcceptance`, `UserPreference`, `Connection`, `Block`, `Mute` |
| `staff_admin` | `StaffAccount`, `StaffRole`, `Permission`, `StaffInvitation`, `MFARecoveryEvent`, `ApprovalRequest`, `AuditLog`                                                    |
| `curriculum`  | `Subject`, `Course`, `Level`, `CourseLevel` (if needed), `Topic`, `SchemeOfWork`, `SchemeTopic`                                                                    |
| `content`     | `Lesson`, `Experiment`, `Asset`, `ContentItem`, `ContentVersion`, `Approval`                                                                                       |
| `labs`        | `Lab`, `LabSession`, `Attempt`, `AttemptEvent`, `AttemptSnapshot` (only if needed), `ExperimentProgress`                                                           |
| `classrooms`  | `Class`, `ClassMember`, `ClassInvite`                                                                                                                              |
| `assignments` | `Assignment`, `AssignmentRecipient`, `Rubric`, `RubricCriterion`, `Submission`, `Grade`, `Feedback`                                                                |
| `community`   | `Group`, `GroupMember`, `ActivityItem`, `Notification`                                                                                                             |
| `moderation`  | `UserReport`, `ModerationCase`, `ModerationAction`                                                                                                                 |
| `analytics`   | `AnalyticsEvent`, optional daily aggregate models/views                                                                                                            |
| `operations`  | `Announcement` (MVP only if needed; otherwise Phase 2), `FeatureFlag`, `SupportTicket`, `SyncReceipt`                                                              |

Phase 2/3 models: `LabReport`, `Badge`, `Streak`, `Achievement`, `Subscription`, `Payment`, chat/conversation/message records, creator/marketplace/payout records, AI tutor interactions and live classroom synchronization. Staff roles beyond Super Admin, Curriculum Manager and Reviewer are Phase 2 except the minimum moderator capability needed for MVP safety.

**Data constraints to implement:** unique normalized usernames/identifiers; no self-connection; unique active membership per class/group; unique active invite token hash; one submission per allowed attempt/resubmission policy; attempt event sequence uniqueness per attempt; published content version immutable; no self-approval; grade/submission/class ownership constraints; safe soft-delete/retention policy and cascade behavior reviewed before migrations.

## 7. API endpoint inventory

All endpoints are JSON REST under `/api/v1/`, use the standard error envelope and pagination, validate payloads server-side, and apply object-level permissions. Names are proposed contracts to refine from actual screens; public read access must return only published content. Methods are representative and not intended to add scope beyond MVP.

| Module                           | Endpoints                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health / API metadata            | `GET /health/live`; `GET /health/ready`; `GET /openapi.json` (non-production or authenticated)                                                                                                                                                                                                                                                                                                                                |
| Auth and consumer profile        | `POST /auth/register`; `POST /auth/login`; `POST /auth/logout`; `POST /auth/recovery`; `POST /auth/recovery/confirm`; `GET /auth/me`; `PATCH /users/me`; `GET/PATCH /users/me/preferences`; `POST /users/me/policy-acceptances`                                                                                                                                                                                               |
| Staff auth / MFA                 | `POST /staff/auth/login`; `POST /staff/auth/logout`; `POST /staff/auth/mfa/verify`; `POST /staff/auth/mfa/enroll`; `POST /staff/auth/mfa/recovery` (strictly controlled)                                                                                                                                                                                                                                                      |
| Staff / roles / approvals        | `GET/POST /admin/staff/invitations`; `GET/PATCH /admin/staff/{id}`; `GET /admin/roles`; `GET /admin/permissions`; `GET/POST /admin/approvals`; `POST /admin/approvals/{id}/approve`; `POST /admin/approvals/{id}/reject`; `GET /admin/audit-events`                                                                                                                                                                           |
| Curriculum                       | `GET /subjects`; `GET /courses`; `GET /levels`; `GET /topics`; `GET /schemes-of-work`; `GET /schemes-of-work/{id}`; admin CRUD at `/admin/subjects`, `/admin/courses`, `/admin/levels`, `/admin/topics`, `/admin/schemes-of-work`; `POST /admin/schemes-of-work/{id}/clone` (may be deferred if needed)                                                                                                                       |
| Content / reviews                | `GET /topics/{id}`; `GET /topics/{id}/lessons`; `GET /experiments`; `GET /experiments/{id}/versions/{version}`; `GET /assets/{id}` or signed CDN URLs; admin CRUD `/admin/content-items`; `POST /admin/content-items/{id}/submit-review`; `POST /admin/content-items/{id}/review`; `POST /admin/content-items/{id}/publish` (approval-gated); `GET /admin/content-items/{id}/versions`                                        |
| Teacher verification             | `POST /teacher-verification/applications`; `GET /teacher-verification/me`; `GET /admin/teacher-verifications`; `POST /admin/teacher-verifications/{id}/approve`; `POST /admin/teacher-verifications/{id}/reject`                                                                                                                                                                                                              |
| Labs / attempts                  | `GET/POST /labs`; `GET /labs/{id}`; `POST /lab-sessions`; `GET /lab-sessions/{id}`; `POST /lab-sessions/{id}/events`; `POST /lab-sessions/{id}/checkpoints`; `POST /lab-sessions/{id}/complete`; `GET /users/me/progress`                                                                                                                                                                                                     |
| Teacher lab / classroom playback | `GET /teacher/experiments`; `POST /teacher/lab-sessions`; `GET /teacher/lab-sessions/{id}`; playback state is local to the client and does not require a server realtime endpoint                                                                                                                                                                                                                                             |
| Classes / invites                | `GET/POST /classes`; `GET/PATCH /classes/{id}`; `GET /classes/{id}/members`; `POST /classes/{id}/invites`; `POST /class-joins` (code/token); `GET /classes/{id}/join-requests`; `POST /classes/{id}/join-requests/{request_id}/approve`; `POST /classes/{id}/join-requests/{request_id}/reject`; `DELETE /classes/{id}/members/{user_id}`; `POST /classes/{id}/leave`; `POST /classes/{id}/invites/{invite_id}/revoke`        |
| Assignments / submissions        | `GET/POST /assignments`; `GET/PATCH /assignments/{id}`; `POST /assignments/{id}/recipients`; `GET /assignments/{id}/submissions`; `GET /assignments/{id}/submissions/{submission_id}`; `POST /assignments/{id}/submissions`; `POST /submissions/{id}/submit`; `GET /submissions/{id}/replay`; `POST /submissions/{id}/grade`; `GET /submissions/{id}/grade`; `POST /assignments/{id}/close`                                   |
| Connections / groups / feed      | `GET /connections`; `POST /connection-requests`; `POST /connection-requests/{id}/accept`; `POST /connection-requests/{id}/reject`; `DELETE /connections/{id}`; `GET/POST /groups`; `GET/PATCH /groups/{id}`; `GET /groups/{id}/members`; `POST /groups/{id}/invites`; `POST /group-invites/{token}/accept`; `DELETE /groups/{id}/members/{user_id}`; `GET /feed`; `POST /activity-items/{id}/share` (structured content only) |
| Safety / moderation              | `POST /users/{id}/block`; `DELETE /users/{id}/block`; `POST /users/{id}/mute`; `DELETE /users/{id}/mute`; `POST /user-reports`; `GET /admin/moderation-cases`; `GET /admin/moderation-cases/{id}`; `POST /admin/moderation-cases/{id}/actions`; `POST /admin/users/{id}/suspend`; `POST /admin/users/{id}/reinstate`; `DELETE /admin/content/{id}` (approval-gated where required)                                            |
| Notifications / analytics        | `GET /notifications`; `POST /notifications/{id}/read`; `POST /analytics/events`; `GET /admin/analytics/summary`; `GET /admin/analytics/events` (strict scope, minimized data, audited export)                                                                                                                                                                                                                                 |
| Offline sync / operations        | `POST /sync/submissions`; `GET /sync/status`; `GET /feature-flags`; `GET/POST /admin/feature-flags`; `GET/POST /support-tickets` (include only if pilot support requires it)                                                                                                                                                                                                                                                  |

**Phase 2/3 API additions:** chat/messages, push/email/SMS preference/provider hooks, advanced analytics, announcements, `LabReport`, badges/streaks/leaderboards, subscriptions/payments, full moderation, content marketplace, creator payouts, AI tutor and real-time student-device sync. Do not create these endpoints in MVP simply because they appear in the proposal data model.

## 8. Launch checklists

### Security and privacy

- [ ] HTTPS everywhere; secure cookies, CSRF protection, HSTS, secure headers, strict CORS and approved origins.
- [ ] Strong password/recovery policy, login/recovery rate limits, account enumeration resistance, session expiry and revocation.
- [ ] Staff invite-only accounts, mandatory MFA, least privilege and periodic access review.
- [ ] Server-side authorization on every endpoint and object; test student/teacher/class/group/admin cross-tenant access.
- [ ] Distinct approver required for publishing, role changes, deletion and user-data exports; no self-approval.
- [ ] Append-only audit events include actor/action/time/target/request context and before/after values where appropriate; exclude secrets; protected/tamper-evident retention.
- [ ] Validate input, output-encode user text, protect against injection, XSS, CSRF, SSRF, unsafe file upload and abuse of invite/reset tokens.
- [ ] Rate-limit registration, login, recovery, class codes, invitations, reports and event ingestion.
- [ ] Encrypt data in transit and at rest; use managed secrets storage and rotation; never put secrets or PII in source, URLs or logs.
- [ ] Minimize student profile data; private by default; no public contact details; document access, retention, export and deletion.
- [ ] Obtain legal advice on Nigeria Data Protection Act and other intended jurisdictions, minors, notices/lawful basis, reporting and content obligations.
- [ ] Approve moderation procedures, child-safety escalation contacts, response coverage and incident playbook before the pilot.
- [ ] Review dependencies, container images, third-party licenses and assets; scan for known vulnerabilities and secrets.
- [ ] Backups are encrypted, access-controlled and restore-tested; define RPO/RTO and deletion/retention behavior.
- [ ] Security test reports contain no live credentials or unnecessary student data; critical/high findings block release.

### Performance, reliability and data cost

- [ ] Cold homepage critical assets <=300 KB compressed and interactive in <5 seconds on agreed 3G/4G profile at 360 px.
- [ ] Each simulation bundle <=1.5 MB, lazy-loaded and cacheable; fonts limited to chosen families and subset; Lottie <50 KB and sound effect <30 KB.
- [ ] Profile all ten experiments on representative low-end Android devices; record frame rate, startup time, memory and battery behavior.
- [ ] Use WebP/SVG, responsive sizes, lazy loading, CDN cache headers, versioned URLs and adaptive media quality.
- [ ] API endpoints are paginated and bounded; replay/event payload limits and indexes are load-tested.
- [ ] First-party analytics and non-critical calls do not block lab startup, grading or submission.
- [ ] Offline cache has explicit quotas, version invalidation and safe cleanup; queued submissions are idempotent.
- [ ] Observe availability, latency, error rate, crash rate, queue age, database health and CDN cache behavior; alert on actionable thresholds.
- [ ] Complete backup/restore, deploy/rollback and Redis/worker restart drills; document pilot SLO and proposed production availability target.

### Accessibility and inclusive design

- [ ] WCAG AA contrast: body text >=4.5:1, large text >=3:1; never convey meaning through color alone.
- [ ] Minimum 48x48 px touch targets with 8 px separation; test at 360 px and with zoom/text scaling.
- [ ] Full keyboard operation and visible focus; semantic headings, labels, forms, status messages and screen-reader announcements.
- [ ] Drag-and-drop has tap-select/tap-place and keyboard alternatives; focus remains predictable during lab interactions.
- [ ] Every important sound has captions/transcript or visual cue; captions are on by default in teacher stage; mute available in each lab.
- [ ] `prefers-reduced-motion` replaces movement with simple fades/static states; no essential meaning depends on animation.
- [ ] Test light/dark themes, color-vision differences, low literacy/simple language and offline/error/loading/empty states.
- [ ] Student-facing copy is friendly and non-shaming; critical instructions remain clear English until translations are reviewed.
- [ ] Manual screen-reader and keyboard testing, automated axe scan, and user testing with learners/teachers included in release evidence.

## 9. MVP success measures

Instrument and review the proposal KPIs with precise definitions before pilot. Initial measures:

| Area       | MVP measure / definition to finalize in M12                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Activation | Share of newly registered users who complete a first simulation within 24 hours.                                       |
| Learning   | Median practical score and change on repeated attempts, grouped only where cohort size protects privacy.               |
| Classroom  | Verified teachers active weekly; teacher lab sessions; classes created and assignments issued.                         |
| Completion | Assignment submissions, grading turnaround and percentage with replay successfully available.                          |
| Retention  | 7-day and 30-day return rates, with appropriate privacy/consent and aggregation thresholds.                            |
| Quality    | Cold first-load time, API error rate, lab startup/frame rate, crash-free sessions and support issues per active users. |
| Safety     | Reports, triage/response time and moderation outcomes; do not optimize for minimizing reports.                         |

The launch gate requires at least 10 approved simulations, a complete assignment/replay/grading cycle, full teacher Auto-play/Live on teacher's screen, acceptable low-end Android experience and passed privacy/security review. Pilot thresholds, cohort size and stop criteria are product-owner decisions in M15.

## 10. Phase 2 and Phase 3 backlog (not in MVP)

### Phase 2 — Growth

- Full offline completeness, broader sync and richer notification choices.
- Direct and group messaging with safety controls.
- Streaks, badges, friend/group leaderboards, daily challenges and certificates/skill tracks.
- Auto-generated practical reports.
- Teacher annotation (highlight, label, draw), advanced teacher analytics and class insights.
- Expanded moderation and the complete staff role set, multi-step review, announcements and support workflows.
- Payments/subscriptions, local pricing and payment-provider integration.
- Local language support (Yoruba, Hausa, Igbo and Pidgin), after translation and curriculum review.
- More subjects, levels, curricula and experiments.
- CSV curriculum import/export and richer content version comparison/rollback if deferred from MVP.
- Additional notification channels only after consent, cost and reliability decisions.

### Phase 3 — Scale

- Student-device synchronized live classrooms using an explicitly designed realtime service.
- AI tutor/mistake explanations with reviewed safety, privacy and educational-efficacy evaluation.
- AR part identification and advanced/3D experiences where devices support them.
- Content creator tools, marketplace, review/payout and staff SSO.
- Regional curriculum/language expansion and skill-track marketplace.
- Large-scale analytics, partitioning/read replicas and additional infrastructure only when evidence requires them.

## 11. Open questions for the product owner

1. Can you provide or confirm the intended contents of `.github/copilot-instructions.md`? Should `docs/instructions.md` be the operative rule file, and should its references to `docs/01-project-proposal.md` / `docs/02-design-guidelines.md` be corrected?
2. What are the final product name, domain and brand approval path?
3. Is the MVP explicitly limited to Nigerian secondary school learners and teachers, or should tertiary learners be included in the first pilot?
4. Which four Basic Electronics experiments should be in the ten-simulation launch catalogue, and which curriculum/exam-body references are authoritative?
5. What account identifier should MVP use (email, phone, username, or a combination), and how should minors recover accounts without requiring access they may not have?
6. What age range is in scope, and what legal position should govern age handling, lawful basis, consent/notice, retention and reporting? Who is the retained legal advisor?
7. Who will be the second staff approver and initial qualified science/electronics reviewer? Can both be available throughout pilot operations?
8. Are social profiles/feed acceptable for the MVP under the proposed restricted, structured-only policy, or should social features be disabled until further safety review?
9. Confirm group membership eligibility (accepted connections or classmates), and whether teachers can be group members or only connected users.
10. Confirm offline MVP behavior: user-selected downloads, local drafts and queued submissions as proposed; what maximum offline storage and submission expiry should apply?
11. Confirm the proposed AWS hosting target and cloud account ownership, region/data-residency constraints, expected pilot size and operational budget.
12. Who owns content writing, illustration/audio production, scientific review and licensing/permissions for curriculum references and assets?
13. Should MVP send email notifications, or are in-app notifications sufficient for pilot? Push/SMS are excluded until separately approved.
14. What support/moderation coverage, incident contact and expected response times can be staffed for the pilot?
15. What are the pilot success thresholds, cohort size, launch date constraint and rollback/stop criteria?

---

**Approval gate:** Do not begin the next milestone until the product owner confirms this milestone. Resolve or explicitly accept open questions that affect scope, legal compliance, security or hosting before the relevant release. Deliver one milestone at a time; run its tests, update this plan's progress, summarize the outcome, and wait for confirmation before starting the next milestone.
