# ADR 0002: M1 core data model and migration guardrails

Date: 2026-10-18

## Status

Accepted for the MVP foundation.

## Context

The M1 milestone establishes the first durable domain model for PracticalLab Africa. It must support curriculum publishing, learner/teacher profiles, classes and group-style membership, assignments, attempts, moderation and event tracking without prematurely introducing phase-2 billing or messaging flows.

## Decision

We treat the core domain as a single Django app named `core`, with a shared `TimestampedModel` for created/updated timestamps and explicit domain identifiers. We keep the MVP entity set intentionally bounded to proposal items that are required for M2 and later milestones.

The model set is:

- `UserProfile`, `StaffRole`, `StaffMember`, `Permission`
- `Subject`, `Level`, `Course`, `SchemeOfWork`, `Topic`, `Lesson`
- `Experiment`, `ContentVersion`, `ExperimentAsset`
- `Lab`, `ClassModel`, `ClassMember`, `ClassInvite`, `Connection`
- `Assignment`, `Rubric`, `Submission`, `Attempt`, `AttemptEvent`, `Grade`
- `ModerationCase`, `BlockRecord`, `Notification`, `AnalyticsEvent`, `Achievement`, `DeviceSyncQueue`, `AuditLog`, `FeatureFlag`

## Constraints and guardrails

- Use separate, explicit service boundaries for admin actions and student actions.
- Keep `UserProfile` and `StaffMember` distinct from auth-role flags; do not rely on frontend-only validation.
- Enforce database uniqueness for class membership, experiment version, connection pairs and assignment submissions.
- Keep `Subject`/`Course`/`Topic` definitions immutable enough for versioned curriculum publishing.
- Do not add phase-2 features such as billing, chat, or advanced notifications to the base schema.

## Migration safety procedure

1. Run `python manage.py makemigrations core` in the API venv after schema changes.
2. Run `python manage.py migrate --plan` to inspect the generated migration before applying.
3. Run `python -m pytest apps/api/tests/test_core_models.py` and any relevant API tests after migration.
4. For a local database reset, back up the SQLite file, apply a fresh migration, and re-run `python manage.py loaddata m1_seed`.
5. Keep seeds minimal and safe: curriculum data only; no personal data or real user identities.

## Consequences

- The schema is ready to support M2 admin curriculum management and teacher verification flows.
- M2 will build against these core models rather than inventing parallel structures.
- Remaining work: add a production-like seed command for staff/test identities and support migration smoke validation in CI.
