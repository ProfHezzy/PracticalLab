# MVP event taxonomy

**Status:** Foundation contract only. No analytics vendor or event-ingestion endpoint is connected in M0.

## Event envelope

Every event uses a versioned allowlist:

| Field | Purpose |
| --- | --- |
| `event_id` | Random UUID used for idempotent ingestion. |
| `schema_version` | Version of the event envelope and property schema. |
| `name` | One event from the allowlist below. |
| `occurred_at` | UTC timestamp; server timestamps are authoritative for server events. |
| `actor_ref` | Optional server-derived pseudonymous account reference. Never a username, email or phone number. |
| `session_ref` | Short-lived random client session identifier, not an authentication token. |
| `experiment_ref` | Optional internal experiment identifier and published version. |
| `properties` | Event-specific allowlisted enums, booleans and bounded numeric values only. |
| `source` | `client` or `server`; server-derived where an event has an authoritative server outcome. |

Do not include names, usernames, email, phone, birth date, free text, report content, raw action timelines, precise location, IP address, credentials, cookies or authorization headers. Do not place personal data in URLs. Moderation evidence stays in its access-controlled case system and is not copied into analytics.

## MVP event names

- `account_registration_completed`
- `student_onboarding_completed`
- `topic_opened`
- `lesson_completed`
- `lab_started`
- `lab_completed`
- `teacher_lab_started`
- `class_created`
- `class_joined`
- `assignment_created`
- `assignment_submitted`
- `submission_graded`

Event fields and triggers must be documented alongside instrumentation. Do not emit raw pointer/drag/action details into analytics; attempt recording for educational replay is a separate, access-controlled product record.

## KPI derivations

- Activation: first `lab_completed` within 24 hours of account creation.
- Learning: score summaries belong to attempt/progress data and may be aggregated only after privacy review and minimum cohort-size rules.
- Class and assignment activity: server-confirmed class/assignment events, deduplicated by `event_id`.
- Quality: non-personal timing/count metrics; error logs must not contain user input or identifiers.

Raw event retention, consent/notice requirements, aggregation thresholds and access roles remain subject to legal and product-owner approval before ingestion is enabled. Events must not delay or block lab work or submission.
