# M4 content pack and governance

This folder is the M4 intake point for authored lessons and assets. Content submitted through the staff API remains a draft until a separate qualified reviewer approves it and a second staff member approves publication. Public learner endpoints read only the latest published immutable lesson version.

## Curriculum structure

The current delivery taxonomy follows the existing model: Subject → Level → Course → Scheme of Work (term) → Topic (order and optional week) → Lesson. Exam-body tags and authoritative curriculum mappings are intentionally not invented here; they remain an M0 product-owner decision. A lesson's selected course and topic determine its curriculum placement.

## Authoring and review

1. Create a lesson shell in the curriculum catalog.
2. Submit a new lesson version through `POST /api/v1/admin/content/lesson-versions` with `action: "create"`.
3. Include the lesson text, estimated time, safety notes, transcript/captions and asset metadata. Audio media cannot be published without both a transcript and captions.
4. Submit the version for review, request reviewer approval, then request publication. The approval requester cannot approve their own request.
5. Complete [the reviewer checklist](reviewer-checklist.md) and add every third-party or commissioned asset to [the asset register](asset-register.csv) before requesting publication.

Asset URLs must be HTTPS. Accepted types and per-file caps are enforced by the API: JPEG/PNG/WebP images (5 MB), MP3/OGG/WAV audio (20 MB), MP4/WebM video (20 MB), and PDF documents (5 MB). A lesson may contain at most 20 assets and 25 MB total. Each asset needs a SHA-256 digest, attribution and license name. Published asset links include the immutable lesson content hash and are cached for one year.

## Current pack status

No curriculum-authored lesson pack, reviewed media or asset rights evidence is included yet. Do not create public lesson versions until the curriculum source, subject reviewer and rights for each media item are recorded. The M4 application and API support publishing once those inputs exist.
