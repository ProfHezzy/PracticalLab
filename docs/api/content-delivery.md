# M4 content delivery API

All routes are under `/api/v1/`. Learner-facing curriculum routes are public and return only data connected to a `LessonVersion` whose status is `published`. For each lesson, reads return its latest published version; a newer draft or rejected version does not replace learner-visible content.

## Learner reads

- `GET /content/subjects` and `GET /content/levels`: curriculum options.
- `GET /content/courses?subject_id=&level_id=`: courses that have published lessons.
- `GET /content/schemes?course_id=`: active terms/schemes with published lessons.
- `GET /content/lessons/published?subject_id=&level_id=&course_id=&scheme_id=&topic_id=&page=&page_size=`: bounded lesson list. `page_size` is capped at 50; response contains `count`, `page`, `page_size` and `results`.
- `GET /content/topics/{topic_id}`: topic metadata and published lessons; returns 404 when no published version exists.
- `GET /content/lessons/{lesson_id}`: lesson text, safety notes, transcript, captions and versioned media metadata; returns 404 unless published.
- `GET /content/lessons/{lesson_id}/captions/{content_hash}`: version-bound WebVTT captions.
- `GET /content/assets/{asset_id}/{content_hash}`: version-bound redirect to the HTTPS storage URL.

List and detail reads include an `ETag`; matching `If-None-Match` returns `304`. Mutable collection/detail URLs have short public cache lifetimes. Captions and asset URLs include the immutable content hash and use immutable cache headers. Asset storage signing/CDN integration is not active until the hosting/storage decision is approved.

Every lesson response currently sets `offline_eligible: false`. The PWA does not cache API or media responses as offline lesson packs yet.

## Staff authoring and publication

`POST /admin/content/lesson-versions` requires active staff, verified MFA, and the `content.review` permission. `action` defaults to `create` and accepts:

- `create`: requires `lesson_id`, `title`, and `content`; accepts estimated minutes, safety notes, transcript, WebVTT captions, changelog and up to 20 asset metadata objects (25 MB combined).
- `submit_review`: moves a draft/rejected version to review.
- `approve`: queues a four-eyes approval; the requester cannot decide their own request.
- `publish`: queues a separate four-eyes publication approval for an approved version.
- `reject`: returns a version to rejected state.

Each new version increments the lesson's version number. A published version and its assets cannot be changed or removed; edits require a new version. Publication computes SHA-256 over the content and associated asset metadata. Audio/video lessons require transcript text and valid WebVTT captions beginning with `WEBVTT`.

Accepted asset MIME types and per-file caps are: JPEG/PNG/WebP (5 MB), MP3/OGG/WAV (20 MB), MP4/WebM (20 MB), and PDF (5 MB). Every asset requires an HTTPS URL, a lowercase or uppercase SHA-256 digest, attribution, and license name; an optional license URL must also use HTTPS. These checks validate submitted metadata; they do not upload or scan the remote file. Production deployment must use controlled storage and verify uploaded bytes against MIME type, size and checksum.

## Editorial gate

See [`../content/reviewer-checklist.md`](../content/reviewer-checklist.md) and [`../content/asset-register.csv`](../content/asset-register.csv). This repository does not contain preapproved lesson text or licensed media. Do not publish until a qualified subject reviewer and independent staff approver have signed off and asset rights are recorded.
