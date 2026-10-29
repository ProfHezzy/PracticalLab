# Decision record 0001: M0 foundation

**Status:** Approved plan; unresolved launch decisions remain explicit  
**Date:** 2026-10-18

## Context

The workspace contained the proposal, design guidelines and `docs/instructions.md`, but no source-code repository, package manifests, CI workflow or requested `.github/copilot-instructions.md`. The permanent instructions referred to proposal and design documents under filenames that do not exist in this workspace.

## Decisions

- Use the current proposal and design-guide filenames as canonical; update `docs/instructions.md` and add `.github/copilot-instructions.md` to point to them.
- Use a single npm-workspaces monorepo for Next.js apps and browser packages, with a Django/DRF modular monolith under `apps/api`.
- Use PostgreSQL and Redis in Compose; local Django tests may use SQLite so they run without Docker.
- Keep the MVP browser client REST-first. No Channels, external circuit engine, UI kit, analytics vendor or notification provider is introduced in M0.
- Keep staff-only access fail-closed until the MFA workflow is implemented. The foundation has no public user registration and exposes no admin business operations.
- Treat discovery findings and the proposed Basic Electronics experiment set as unverified inputs. The baseline candidates are component identification, series circuit, parallel circuit and simple wiring/fault diagnosis; curriculum and subject experts must approve them before content work.
- Keep AWS as the plan's deployment target, not an approved deployment or region. No cloud resources are created in M0.
- The PWA worker may cache only the public shell, offline page and static Next.js assets. It must never cache API responses or private routes.

## Outstanding approval gates

- Teacher/learner interviews and usability sessions have not been conducted or replaced by a product-owner-approved alternative.
- Pilot cohort, named content reviewer and two distinct staff approvers are not yet confirmed.
- The four electronics experiment candidates require curriculum and reviewer validation.
- Jurisdiction-specific legal/privacy advice for minors and data handling remains required before pilot.
- Cloud account, region/data-residency review, budget and production operations remain unconfirmed.
- Docker is not installed in the current development environment, so Compose startup cannot be smoke-tested here.

## Consequences

M0 establishes the code/config foundation and local non-Docker checks. It does not claim content, legal, pilot, staffing, cloud or Compose acceptance. These unresolved gates must be closed before dependent release work or launch.
