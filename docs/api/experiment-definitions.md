# Experiment definitions API and runtime

Experiment definitions use schema `1.1` and runtime `1.0.0`. The canonical filtration preview is in `packages/experiment-schemas/definitions/filtration.v1.json`; the same definition is exported to the web runtime from `packages/experiment-schemas/src/index.ts`. Keep the JSON fixture and runtime export identical. The browser engine is deterministic and has no dependency on PixiJS; PixiJS is loaded only by the visual stage.

## Staff authoring

`POST /api/v1/admin/content/experiments` accepts a `subject_id`, optional same-subject `topic_id`, metadata, and a `definition`. It requires an active staff session with verified MFA and `content.review`. Schema, runtime version, apparatus/rule/step references, captions, asset URLs and the 1.5 MB asset budget are validated before any records are created. The response includes a SHA-256 hash over canonical JSON, sorted by key and encoded without insignificant whitespace.

The definition begins as a draft. It is not returned to learners. Submit it through `POST /api/v1/admin/content/review` with `action: "submit_review"`; approval and publication go through separate four-eyes approval requests. The API revalidates the definition and hash during publish. A published `ContentVersion` cannot be edited or deleted through the model API.

## Learner delivery

`GET /api/v1/content/experiments/{slug}` only serves the latest published version with a non-empty definition and hash. Draft and rejected definitions return 404. Responses include the definition, schema version, runtime version, version identifier, and an ETag derived from the definition hash. Matching `If-None-Match` requests receive 304. Clients must verify schema/runtime compatibility before loading a definition.

Authenticated learner clients create a run with `POST /api/v1/student/experiments/{slug}/sessions` and `{ "runtime_version": "1.0.0" }`. The server binds it to the exact published `ContentVersion` and its definition hash. Post action batches to `POST /api/v1/student/experiment-sessions/{session_id}/events` with the same runtime version and the engine event envelope. Batches contain 1–100 events and must continue the exact sequence. The server checks ownership, supported action shape, step/score bounds and runtime version before saving. A completed final accepted step closes the run. Staff identities cannot use learner-session endpoints.

The filtration definition in this repository is a local practice preview and has not been reviewed by a Chemistry subject expert. Do not publish it to learner delivery until that review is complete. PixiJS drag interactions are paired with keyboard/tap action buttons; narration uses browser speech when enabled and captions remain visible independently. Sound is off by default and reduced-motion preference is applied to the interface.

## Runtime behavior

The engine records accepted and safely rejected commands with a monotonic sequence number, step before/after, score and feedback. Replaying accepted actions from a definition produces the same score, apparatus state and outcome. Undo replays the accepted action history without deleting earlier audit events; reset starts a new local state while retaining the event sequence. The session endpoint stores each submitted envelope under a unique ordered sequence; the full student progress and resume experience remains in M6.

Tests: `tests/experiment-engine.test.mjs` and `apps/api/tests/test_experiment_definitions.py`.
