# Project Proposal: PracticalLab Africa

**A Virtual Practical Laboratory and Social Learning Platform for African Students, Teachers and Lecturers**

*Working title. Final brand name to be confirmed.*

Prepared by: Hezekiah Olawale Ojenike, Founder and CEO

Organisation: Mindset Information Technology Ltd.

Document status: Draft v1.1 for Board and Stakeholder Review

**v1.1 changes:** basic safety tools, a minimal content review step and event tracking moved into the MVP; class codes and invite links added; Live mode scoped to the teacher's screen for the MVP; competition section rewritten; data model completed; parent features and parental consent removed by decision.

© Hezekiah Olawale Ojenike / MINDSET INFORMATION TECHNOLOGY LTD. All rights reserved.

## 1. Executive Summary

Education across Nigeria and much of Africa is heavy on theory and weak on practical skills. Students write about separation techniques but have never separated a mixture. Electrical students cannot wire a basic circuit. Mechanical students cannot locate an engine in a car. The cause is not lack of interest. It is lack of laboratories, apparatus, safe workshops and trained supervision.

PracticalLab Africa is a web-based platform (installable as a Progressive Web App) that gives every learner a **personal virtual laboratory**. Students learn through animated, narrated lessons, then perform the practical themselves by dragging and dropping apparatus on a phone or computer. Teachers and lecturers get their own lab that works as an **interactive classroom board**: they can play auto-generated simulations for a class, or run experiments live.

The platform is also a **learning network**. Learners follow and befriend each other, form subject groups, connect with teachers, submit assignments from inside their lab, and receive grades and feedback in the same app.

**Key design decision:** the platform serves **individuals only**. Schools and institutions do not register. Individual teachers bring their own students, which gives the product a low-friction, social-style growth model with no procurement barriers.

**The ask:** approval of a phased build, starting with a focused MVP (Chemistry and Basic Electronics, secondary school level), followed by controlled expansion across subjects and regions.

## 2. Problem Statement

### 2.1 The practical skills gap

- Many schools lack functional laboratories and workshops.
- Where apparatus exists, it is limited, expensive to replace, and often unsafe to hand to every student.
- Practical exams are frequently answered from memory without hands-on experience.
- Technical and vocational fields (electrical, mechanical, building, solar) suffer the same gap at tertiary level.

### 2.2 Consequences

- Graduates who know definitions but cannot perform tasks.
- Weak employability and low confidence in technical fields.
- Teachers who want to demonstrate concepts but have no tools.
- Students who cannot safely experiment or learn from mistakes.

### 2.3 Why existing solutions fall short

- Strong free tools exist (for example PhET and OLabs) and at least one regional paid platform (PraxiLabs), but most are built around other countries' curricula.
- Several assume stable internet and modern devices, and few offer a teacher classroom mode.
- They rarely combine simulation, classroom delivery, assignments and social learning in one product.
- They are not aligned to local exam bodies and schemes of work.

## 3. Vision, Mission and Objectives

**Vision:** Every African learner can practise, fail safely and master hands-on skills regardless of school resources.

**Mission:** Build the most accessible, curriculum-aligned virtual practical platform in Africa, usable on low-cost phones, with or without constant internet.

### Strategic objectives

1. Deliver a working MVP with at least 10 curriculum-aligned simulations.
2. Reach a base of active teachers who bring in their own classes.
3. Build a reusable simulation engine so new experiments are configured, not coded from scratch.
4. Expand from sciences to technical drawing, electronics, accounting, economics and vocational skills.
5. Establish a sustainable revenue model without relying on school contracts.

## 4. Market Opportunity

Figures below must be validated during discovery. This section defines the segments and the logic, not final numbers.

| Segment | Description | Need |
| --- | --- | --- |
| Junior and senior secondary students | Practical subjects: Chemistry, Physics, Biology, Basic Technology, Technical Drawing, Basic Electronics | Practise what labs cannot provide; prepare for practical exams |
| University and polytechnic students | Engineering, science and vocational courses | Safe, repeatable practice before real equipment |
| Teachers and lecturers | Independent educators and tutors, public and private | A classroom demonstration tool and an assignment system |
| Skill learners | Wiring, solar installation, auto repair, welding | Low-cost hands-on training |

**Market drivers:** high smartphone penetration among young people, growing demand for tech and vocational skills, exam pressure, and teachers looking for free or low-cost teaching aids.

**Competitive position:** free and paid virtual lab tools already exist (for example PhET, OLabs and PraxiLabs), so we do not claim an empty market. Our edge is the combination of curriculum alignment to local syllabi, a teacher classroom mode, attempt replay for grading, and a social layer, all built for low-cost phones and weak connectivity. Discovery must validate this against current competitors.

## 5. Target Users and Personas

### Persona 1: The Student

Secondary or tertiary learner on a mid- or low-range Android phone, intermittent data. Wants to understand practicals, finish assignments, and compete or collaborate with friends.

### Persona 2: The Teacher

Independent secondary school teacher or tutor with a laptop or phone, possibly connected to a projector or TV. Wants to demonstrate experiments that the school cannot support, and to set and grade practical assignments quickly.

### Persona 3: The Lecturer or Professor

Tertiary educator who wants interactive demonstrations in lectures and structured practical assignments with reviewable student attempts.

### Persona 4: The Skill Learner

Adult or school-leaver learning a trade (wiring, solar, mechanics). Wants guided, step-by-step practice and a progress record.

## 6. Product Scope

### 6.1 Account model (individuals only)

- No school or institution accounts.
- Two account types: **Student** and **Teacher/Lecturer**. A person may switch between them if needed.
- Connections replace institutions: follow, friend, teacher connection request, and groups.

### 6.2 Core modules

**1. Student Lab**

- Registration with level and course or class.
- Scheme of work browsing by term (First, Second, Third) for secondary school.
- Topic page: animated lesson with sound, motion and graphics.
- Interactive 3D practical: drag, rotate and zoom 3D apparatus; mix, connect and measure, with visible current flow, smoke, heat and bubbles.
- Guided practice mode and free exploration mode.
- Safe failure: wrong actions produce realistic consequences and explanations.
- Practical exercise with scoring.
- Auto-generated practical report (phase 2).

**2. Teacher Lab and Classroom Mode**

- Personal teacher lab with all topics.
- **Auto-play mode:** the app plays a full, narrated simulation for the class.
- **Live mode:** the teacher drags and drops apparatus and runs the experiment in real time, with sound.
- Projector-friendly full-screen view with large controls and high contrast.
- Pause, rewind, slow motion and step-by-step walkthrough.
- Annotation tools: highlight, label, draw (phase 2).

**3. Assignments and Grading**

- Teacher creates a simulation assignment (topic, instructions, deadline, scoring rubric).
- Sends to selected students or groups.
- Student completes it in their own lab and submits to the teacher.
- The system records the full attempt: every action, mistake, time and final result.
- Teacher can **replay the student's attempt step by step**, grade, and add feedback.
- Optional auto-scoring against the rubric.

**4. Social and Collaboration**

- Follow and friend system (student to student).
- Student to teacher connection requests, teacher to teacher connections.
- Groups (for example Physics Group, Chemistry Group) with owner, members, group assignments and group practicals.
- Activity feed: achievements, shared experiments, group updates.
- Direct messaging and group chat (phase 2).

**5. Content Library**

- Scheme-of-work aligned topic catalogue.
- Subjects across phases: sciences, technical drawing, basic electronics, mechanical basics, accounting, economics, vocational skills.
- Tagged by level, term, exam body and difficulty.

**6. Progress and Analytics**

- Student dashboard: topics completed, scores, streaks, badges.
- Teacher dashboard: assignment status, class performance, common mistakes.
- Core event tracking from launch (MVP) so every KPI in this document can be measured.

**7. Engagement and Retention**

- Streaks, badges and leaderboards (between friends and groups first).
- Daily practical challenge.
- Certificates of completion for skill tracks.
- AI tutor that explains mistakes (phase 3).

### 6.3 Admin Portal (Back Office)

A secure admin portal lets the owner and authorised staff control all curriculum and content, users and platform settings. Anything published here appears in the student, teacher and lecturer apps without a new app release.

**Staff roles (role-based access, least privilege)**

| Role | What they can do |
| --- | --- |
| Super Admin (owner) | Full control, staff management, system settings, security settings |
| Curriculum Manager | Create and edit subjects, courses, levels, topics and schemes of work |
| Content Editor | Attach simulations, lessons, media and narration to topics |
| Reviewer (QA) | Check scientific accuracy and approve or reject content before publishing |
| Community Moderator | Handle reports, suspend accounts, manage groups |
| Support Agent | Look up users, resolve account issues, with limited data visibility |
| Analyst | Read-only access to dashboards and reports |
| Finance (phase 2) | Plans, subscriptions, payments and refunds |

**Curriculum and content management**

- Add, edit, archive and reorder **subjects** (Chemistry, Physics, Technical Drawing, Basic Electronics, Accounting, Economics and others).
- Manage **courses and levels**: Junior Secondary, Senior Secondary, polytechnic and university courses.
- Manage **topics** inside each subject and course, with learning objectives, difficulty and exam-body tags.
- Build and improve the **scheme of work** per level, subject and term (First, Second, Third), with weekly topic mapping.
- Link each topic to its lesson, simulation, practical exercise and assessment rules.
- Clone a scheme of work to adapt it for another level or course.
- Bulk import and export (CSV) for large curriculum uploads.
- Version history on every item, with the ability to compare and roll back.
- **Draft, review, publish workflow:** nothing goes live until a Reviewer approves it.
- Preview any content as a student and as a teacher before publishing.
- Once published, content reaches the apps automatically through the content service, and installed offline apps pick up the new version on next sync.

**User and community management**

- Search and view users, filter by role, level, activity and status.
- Verify teachers and award the verified badge.
- Suspend, reinstate, force password reset, or remove accounts.
- Review reported users, groups and messages in a moderation queue.
- Manage groups, remove abusive content, and view connection history when investigating a report.
- Oversee assignments and submissions for dispute handling (access logged).

**Platform operations**

- Announcements and push, email or SMS notifications to segments.
- Dashboards: registrations, active users, topic usage, completion rates, assignment activity.
- Feature flags and system settings (maintenance mode, limits, terms and privacy versions).
- Support tickets and feedback inbox.
- Plans, pricing, coupons and payment reports (phase 2).

**Admin security controls (mandatory)**

| Control | Requirement |
| --- | --- |
| Access model | Invite-only staff accounts, no shared logins, role-based permissions enforced on the server for every action |
| Authentication | Multi-factor authentication required for all staff, strong password policy, short session timeout, lockout after failed attempts |
| Separation | Admin portal on its own protected domain and deployment, with optional IP allow-listing and rate limiting |
| Four-eyes approval | Publishing content, changing roles, deleting data and exporting user data need a second authorised person to approve |
| Audit log | Immutable record of who did what, when, from where, with before and after values; reviewable by the Super Admin |
| Data protection | Staff see only the student data their role needs; personal fields masked by default; every export limited and logged |
| Safe deletion | Soft delete with restore window; permanent deletion only by Super Admin with approval |
| Application hardening | Protection against CSRF, XSS, injection and brute-force attacks; secure headers; regular dependency updates and penetration testing |
| Secrets and keys | Stored in a secrets manager, rotated regularly, never in code |
| Staff lifecycle | Quarterly access reviews and instant access removal when a staff member leaves |
| Alerts | Notifications for suspicious activity such as repeated failed logins, unusual exports or role changes |

**Admin portal by phase**

- **MVP:** Super Admin, Curriculum Manager and a minimal Reviewer approval step (nothing launches unreviewed), basic moderation (reports, suspend, remove content), subjects, courses, topics, scheme of work, user management, teacher verification, MFA and audit log.
- **Phase 2:** full role set, multi-step review and approval workflow, advanced moderation tools, analytics dashboards, announcements, billing and support tools.
- **Phase 3:** content creator review and payouts for the marketplace, advanced reporting, SSO for staff.

### 6.4 Classes and Joining a Teacher

Teacher-first growth depends on a fast, simple way for students to join a teacher. A **Class** is owned by a teacher and is different from a **Group**, which students create themselves.

- A verified teacher creates a class (name, subject, level) and gets a **class code** and a shareable **invite link** that works well on WhatsApp.
- A student joins by entering the code or tapping the link. The teacher can set joining to automatic or to approval-first.
- The teacher sees the roster, can remove students, and sends assignments to the whole class, to selected students or to a group.
- Students can leave a class at any time.
- Only verified teachers can own classes. Students can create groups, but groups are invite-only and limited to accepted connections and classmates.

### 6.5 Scope Decisions for the MVP

- **Live mode means the teacher's screen only.** The teacher runs the experiment live on their own device or projector. Students do not need to be online at the same time. Syncing student devices in real time is a Phase 3 feature.
- **Safety ships with social features.** Block, mute and report tools, basic moderation and the minimal Reviewer approval step are part of the MVP, because friends, groups and public content cannot launch without them.
- **Measurement from day one.** Core event tracking is part of the MVP so the KPIs can be measured from launch.

## 7. Key User Journeys

### 7.1 Student journey

1. Sign up and choose level and course.
2. See the term's scheme of work.
3. Pick a topic, for example Separation Techniques.
4. Watch the animated lesson.
5. Open the interactive practical and perform it.
6. Take the practical exercise and see the score and explanations.
7. Share a result or invite friends to a group practical.

### 7.2 Teacher classroom journey

1. Open the Teacher Lab on a laptop connected to a projector or TV.
2. Select the day's topic.
3. Choose Auto-play or Live mode.
4. Teach using the simulation, pausing to ask questions.
5. Assign a follow-up practical to the class.

### 7.3 Assignment journey

1. Teacher creates and sends an assignment.
2. Student receives a notification and opens it in their own lab.
3. Student completes and submits.
4. Teacher opens the submission, replays the attempt, grades and comments.
5. Student receives the grade and feedback.

## 8. Functional Requirements by Phase

| Feature | MVP | Phase 2 | Phase 3 |
| --- | --- | --- | --- |
| Student and Teacher accounts | Yes |  |  |
| Student Lab with simulations | Yes |  |  |
| Teacher Lab (auto-play and live, teacher's screen only) | Yes |  |  |
| Teacher Lab playback controls: pause, rewind, slow motion | Yes |  |  |
| Scheme of work browsing | Yes |  |  |
| Assignment create, submit, grade | Yes |  |  |
| Attempt replay for teachers | Yes |  |  |
| Class codes and invite links to join a teacher | Yes |  |  |
| Friends, follow, basic groups | Yes |  |  |
| Teacher-student connection requests | Yes |  |  |
| Block, mute and report tools with basic moderation | Yes |  |  |
| Core event tracking for KPIs | Yes |  |  |
| Admin portal core: subjects, courses, topics, scheme of work, user management, teacher verification, minimal Reviewer approval, staff MFA, audit log | Yes |  |  |
| Offline mode (PWA) | Basic | Full |  |
| Group chat and messaging |  | Yes |  |
| Streaks, badges, leaderboards |  | Yes |  |
| Auto-generated practical reports |  | Yes |  |
| Teacher Lab annotation tools |  | Yes |  |
| Notifications (push, email, SMS) | Basic | Yes |  |
| Teacher analytics dashboard |  | Yes |  |
| Local language support |  | Yes |  |
| Payments and subscriptions |  | Yes |  |
| Admin portal full: all staff roles, multi-step approval workflow, advanced moderation, analytics, announcements, billing tools |  | Yes |  |
| Skill tracks and certificates |  | Yes | Yes |
| Content creator tools and marketplace |  |  | Yes |
| Admin portal advanced: creator review and payouts, staff SSO |  |  | Yes |
| Live sync of student devices in class |  |  | Yes |
| AI tutor and mistake explanations |  |  | Yes |
| AR mode for real-world parts identification |  |  | Yes |

### MVP content scope

- Chemistry: separation techniques (filtration, evaporation, simple and fractional distillation, decantation, chromatography), basic laboratory apparatus identification.
- Basic Electronics: series and parallel circuits, basic components, simple wiring.
- Target: at least 10 complete simulations at launch.

## 9. Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Performance | First load under 5 seconds on a mid-range phone on 3G or 4G; simulations run at a smooth frame rate on low-end Android devices |
| Offline | Installed PWA caches lessons and simulations; submissions queue and sync when online |
| Scalability | Architecture designed for millions of registered users and high concurrent classroom usage |
| Availability | Target 99.9% uptime for core services |
| Security | Encryption in transit and at rest, role-based access control, audit logs |
| Privacy | Compliance with the Nigeria Data Protection Act and equivalent regional laws; minimal data collection |
| Accessibility | Readable fonts, high contrast, captions for audio, keyboard and touch support |
| Data cost | Lightweight assets, adaptive quality, compressed media |
| Localisation | English first; Yoruba, Hausa, Igbo and Pidgin in phase 2 |
| Maintainability | Modular code, automated tests, CI/CD pipeline |

## 10. System Architecture

### 10.1 High-level design

- **Client:** Progressive Web App (installable, offline capable) with a responsive UI.
- **API layer:** REST (and WebSocket for live features) behind an API gateway.
- **Application services:** Auth, Users and Connections, Content and Scheme of Work, Simulation Service, Assignments and Grading, Groups and Social, Notifications, Analytics, Billing.
- **Data layer:** Relational database for core data, cache for sessions and hot data, object storage and CDN for media and simulation assets.
- **Background processing:** queue-based workers for notifications, report generation, analytics aggregation and media processing.

### 10.2 Recommended technology stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Backend | Python, Django, Django REST Framework | Fast to build, mature, strong ORM and admin |
| Realtime | Django Channels with Redis | Group chat (phase 2) and live sync of student devices (phase 3) |
| Database | PostgreSQL | Reliable relational store with JSON support |
| Cache and queues | Redis, Celery | Performance and background jobs |
| Frontend | React or Next.js as a PWA | Rich UI, offline support, large ecosystem |
| 2D Lite fallback | Lite mode fallback only: HTML5 Canvas with PixiJS | Light and fast on cheap phones |
| 3D simulations (primary) | Three.js | Primary engine for every simulation, with Low, Medium and High quality tiers |
| Circuit simulation | Open-source circuit engine wrapped by our own layer, chosen only after a licence review (many are copyleft) | Avoids rebuilding solved physics |
| Media and assets | Object storage with CDN | Global delivery, caching |
| Infrastructure | Containers (Docker), orchestrated cloud deployment | Scalable, portable |
| Observability | Centralised logging, metrics, error tracking | Production readiness |
| CI/CD | Automated tests, builds and staged deployments | Quality and speed |

### 10.3 Scalability approach

- Stateless application servers behind a load balancer for horizontal scaling.
- Read replicas and caching for heavy read traffic.
- Simulation logic runs **in the browser**, so server load stays low even with millions of learners.
- Only results and attempt logs are sent to the server.
- Content delivered through CDN for regional performance.
- Database partitioning strategy planned for large tables such as attempts and activity.

## 11. Simulation Engine Design

Content is the largest cost and the largest risk. The solution is a **reusable, configuration-driven engine**.

### 11.1 Engine components

1. **Apparatus library:** reusable objects (beaker, funnel, filter paper, burner, resistor, battery, switch, wire) with properties and behaviours.
2. **Interaction layer:** drag, drop, connect, pour, heat, measure; works with touch and mouse.
3. **Rules engine:** defines what happens when apparatus and substances interact; supports correct outcomes and realistic failure.
4. **Experiment definition format:** each experiment is a structured configuration file (apparatus used, steps, expected outcomes, scoring rules, narration script, sound cues).
5. **Narration and audio layer:** synchronised voice and sound effects, with subtitles.
6. **Recorder:** captures every student action as a timeline for replay by the teacher.
7. **Scoring module:** compares actions to the expected procedure and rubric.

### 11.2 Auto-generated content

The platform generates ready-to-play lessons from experiment definitions. A teacher selects a topic and the system assembles the narrated walkthrough automatically. AI assistance may later help draft narration and explanations, always reviewed by subject experts before release.

### 11.3 Content pipeline

1. Subject expert writes the experiment spec.
2. Designer prepares assets.
3. Developer configures the experiment in the engine.
4. Review by a qualified teacher for scientific accuracy.
5. Test on low-end devices.
6. Publish to the library.

### 11.4 3D Simulation and Immersion (decision: real 3D)

All simulations are real-time **3D**, not 2D. Students rotate, zoom and handle 3D apparatus, and see current, heat, smoke, bubbles and pressure happen in front of them.

- **Engine:** Three.js (WebGL) with React Three Fiber for integration with the app. Lightweight physics for dragging and stacking. Shader-based liquids. Particle systems for smoke, steam, sparks and bubbles.
- **Visible effects:** current flows as glowing pulses along the wires at a speed that matches the current, bulbs glow, and an overloaded wire heats up and smokes. Flames with heat shimmer. Smoke and steam that drift and thin out. Bubbling liquids and settling precipitate. Pressure shown by a gauge, a shaking vessel and a popping stopper. Everything dangerous is shown as a harmless simulation with an explanation.
- **Feel it:** haptic vibration on supported Android phones, layered spatial sound, a small camera shake on pops, and heat shimmer on screen. iPhone browsers do not support vibration, so visual and sound cues carry the effect there.
- **Low-end phone strategy:** automatic Low, Medium and High quality tiers with a manual override, low-poly compressed models, a size budget per simulation, rendering only when something moves, and a 2D Lite fallback when WebGL is not available.
- **VR (optional):** an immersive mode using WebXR on supported devices and cardboard-style viewers, planned for Phase 3, not the MVP.
- **Delivery impact:** 3D takes more engineering and content effort than 2D. Phase 0 must include a 3D proof of concept tested on low-end phones. Confirm during discovery whether the MVP launches with 10 simulations or a smaller set of 6 to 8 polished ones, or whether the MVP timeline extends.
- **Team:** add a 3D artist and visual effects specialist (apparatus models, textures, smoke and liquid effects) to the core team.

## 12. Core Data Model

| Entity | Purpose |
| --- | --- |
| User | Student or Teacher account, profile, level or subjects (staff accounts are separate) |
| Staff, Role, Permission | Admin portal staff, their roles and fine-grained permissions |
| Connection | Follow, friend and teacher-student relationships with status |
| Class, ClassMember, Invite | Teacher-owned class, roster, class code and invite link |
| Group and GroupMember | Student-created subject groups with owner and members |
| Subject, Course, Level | Curriculum structure: subjects, courses and levels (junior secondary, senior secondary, tertiary) |
| Topic, Lesson, SchemeOfWork | Topics, lessons and term-by-term schemes of work |
| Experiment | Experiment definition, version, assets |
| Asset | Media, audio, narration and simulation files with size and version |
| ContentVersion and Approval | Draft, review and publish history for every curriculum and content item |
| Lab | A user's personal lab space and saved work |
| Assignment and Rubric | Teacher-created task linked to an experiment, deadline and scoring rubric |
| Submission | A student's submitted attempt for an assignment |
| Attempt and AttemptEvent | Recorded timeline of student actions for replay |
| Grade and Feedback | Score and teacher comments |
| Report | Auto-generated practical report (phase 2) |
| Block, Report, ModerationCase | Safety tools: blocks, user reports and moderation cases |
| Notification and Announcement | Alerts, messages and staff announcements |
| AnalyticsEvent | Core usage events that feed the KPIs |
| Badge, Streak, Achievement | Engagement system |
| Subscription and Payment | Billing (phase 2) |
| FeatureFlag and SupportTicket | Platform settings and support requests |
| DeviceSyncQueue | Offline actions waiting to sync |
| AuditLog | Security and compliance trail |

## 13. Security, Privacy and Child Safety

Many users will be minors. Safety is a launch requirement, not an add-on.

- **Data protection:** comply with the Nigeria Data Protection Act and other applicable regional laws; collect only necessary data; clear privacy policy and terms accepted at sign-up; legal review of obligations for users under 18 before launch.
- **Minors:** age-appropriate defaults, private profiles by default, discoverable only through usernames, class codes or accepted connections, no public contact details, and messaging only between accepted connections, classmates and group members.
- **Social safety (MVP):** block, mute and report tools and a basic moderation queue from launch, plus profanity and abuse filtering.
- **Groups:** invite-only; members must be accepted connections or classmates; owners cannot add strangers; moderators can freeze or remove a group.
- **Teacher verification:** since anyone can register as a teacher, switching to or creating a teacher account does not unlock classes or student requests until verification passes; verified badge shown afterwards.
- **Access control:** role-based permissions; teachers see only students who joined their class or connected with them.
- **Technical security:** encrypted storage and transport, secure authentication, rate limiting, regular security testing and dependency updates.
- **Content integrity:** all simulations reviewed for scientific accuracy and safety messaging before going live; clear notice that simulations complement, not replace, supervised real practicals where required.

## 14. Monetisation Strategy

Schools are not customers, so revenue comes from individuals.

| Stream | Description |
| --- | --- |
| Freemium for students | Core simulations free; premium topics, unlimited retries and advanced reports on paid plan |
| Teacher Pro plan | More groups, larger class sizes, analytics, premium simulations, replay tools |
| Skill tracks | Paid structured courses with certificates (wiring, solar, mechanics and similar) |
| Creator marketplace (phase 3) | Verified teachers sell simulations; platform takes a commission |
| Sponsorships and partnerships | Exam prep brands, technical training providers, NGOs and development partners |
| Data-light bundles | Partnerships with telecom operators for zero-rated or discounted access (exploratory) |

Pricing must reflect local purchasing power and support local payment methods (cards, bank transfer, USSD, mobile money).

## 15. Go-To-Market Strategy

1. **Teacher-first growth.** Each teacher who adopts the tool brings a full class. Target independent teachers, tutors and lecturers through social media, WhatsApp communities and teacher associations.
2. **Pilot cohort.** Launch with a small group of teachers and students for feedback and testimonials.
3. **Content-led marketing.** Short simulation clips on Instagram, TikTok, YouTube and WhatsApp showing experiments that students rarely see in real labs.
4. **Referral loops.** Students invite friends to groups; teachers invite colleagues; rewards for referrals.
5. **Exam season campaigns.** Practical-exam preparation drives before major exam periods.
6. **Partnerships.** Education influencers, tutorial centres, student bodies and NGOs.
7. **Regional expansion.** After Nigeria, expand to Ghana, Kenya and other English-speaking markets, then add other languages and curricula.

## 16. Delivery Roadmap

| Phase | Duration (estimate) | Outcomes |
| --- | --- | --- |
| Phase 0: Discovery | 4 to 6 weeks | User interviews with teachers and students, curriculum and syllabus mapping (WAEC, NECO, national curriculum), technical spikes including a 3D proof of concept tested on low-end phones, circuit engine licence review, branding, final scope |
| Phase 1: MVP | 4 to 6 months | Accounts, labs, simulation engine v1, 10 simulations, assignments, replay, class codes, friends and groups, block and report tools with basic moderation, minimal content review, event tracking, PWA |
| Phase 2: Growth | 4 to 6 months | Chat, gamification, offline completeness, analytics, payments, local languages, more subjects |
| Phase 3: Scale | 6 to 12 months | Marketplace, AI tutor, AR, skill tracks, live sync of student devices, regional expansion |
| Continuous | Ongoing | Content production, security, performance, support |

Timelines depend on team size and funding and will be refined after Phase 0.

## 17. Team and Governance

### 17.1 Core team

| Role | Responsibility |
| --- | --- |
| Product Owner / Founder | Vision, priorities, stakeholder alignment |
| Senior Product Manager | Roadmap, requirements, metrics, release planning |
| Tech Lead / Architect | Architecture, standards, technical decisions |
| Backend Developers (2 to 3) | APIs, data, realtime, integrations |
| Frontend and Simulation Developers (2 to 3) | PWA, simulation engine, interactions |
| UI/UX Designer | Interface, interaction design, accessibility |
| Motion and Sound Designer | Animations, audio, narration production |
| Subject Matter Experts (teachers) | Experiment specs, accuracy review |
| QA Engineer | Automated and manual testing, device testing |
| DevOps Engineer | Infrastructure, CI/CD, monitoring |
| Community and Support Lead | Teacher onboarding, feedback, moderation |

The team can start lean and grow by phase.

### 17.2 Governance

- Monthly board review of KPIs, budget and risks.
- Fortnightly product reviews with stakeholders.
- Two-week sprints, with demos at the end of each sprint.
- Content accuracy sign-off by qualified subject experts before publication.
- Documented decision log for architecture and policy decisions.

## 18. Budget Framework

Exact figures will be finalised after Phase 0. The budget will be structured as follows:

| Category | Includes |
| --- | --- |
| People | Developers, designers, product, QA, DevOps, subject experts |
| Content production | Simulation assets, animation, audio, narration, review |
| Infrastructure | Cloud hosting, CDN, storage, monitoring, backups |
| Tools and licences | Design, project management, testing, security tools |
| Legal and compliance | Company and IP protection, data protection compliance, terms and privacy policy |
| Marketing and growth | Teacher outreach, content marketing, campaigns, referral rewards |
| Operations | Support, moderation, administration |
| Contingency | Reserve for risk, typically a set percentage of total budget |

## 19. Key Performance Indicators

| Area | KPI |
| --- | --- |
| Growth | Registered teachers, registered students, students per teacher |
| Activation | Percentage of new users completing a first simulation within 24 hours |
| Engagement | Weekly active users, simulations completed per user, streak length |
| Learning outcomes | Average practical exercise scores, improvement over repeated attempts |
| Classroom use | Teacher-lab sessions per week, assignments created and completed |
| Retention | 7-day, 30-day and 90-day retention |
| Social | Friend connections, groups created, group activity |
| Quality | Crash rate, load time, support tickets per 1,000 users |
| Revenue | Conversion to paid, average revenue per user, churn |

## 20. Risks and Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Content production is slow and costly | High | Reusable engine, configuration-driven experiments, prioritise high-demand topics, recruit teacher contributors |
| Low-end device performance | High | 3D with automatic quality tiers, a 2D Lite fallback, lightweight assets, device testing programme, adaptive quality |
| Poor connectivity | High | Offline-capable PWA, small asset bundles, background sync |
| Child safety and abuse | High | Strict privacy defaults, moderation, reporting tools, teacher verification |
| Low willingness to pay | Medium | Strong free tier, local pricing and payment options, teacher-driven monetisation |
| Scientific inaccuracy | High | Mandatory expert review and version control for experiments |
| Teacher adoption is slow | Medium | Easy onboarding, free classroom mode, ambassador programme |
| Scope creep | Medium | Strict MVP scope, phased roadmap, change control |
| Key-person dependency | Medium | Documentation, code reviews, knowledge sharing |
| Regulatory change | Medium | Legal advisory, privacy-by-design |
| Competition from global platforms | Medium | Local curriculum alignment, local languages, affordability, social features |

## 21. Success Criteria for MVP

- At least 10 simulations live and reviewed by qualified teachers.
- Teachers can run a full class session in Auto-play and Live modes.
- A complete assignment cycle works end to end, including replay and grading.
- The app runs acceptably on mid- and low-range Android phones.
- Pilot teachers and students rate usefulness highly and report real classroom use.
- Security and privacy checks pass before public launch.

## 22. Decisions Requested from the Board

1. Approve the individual-only product model (no school accounts).
2. Approve Phase 0 Discovery and the MVP scope (Chemistry and Basic Electronics).
3. Approve the recommended technology stack and architecture direction.
4. Approve formation of the core team and a recruitment plan for subject experts.
5. Approve the budget framework and request detailed budgeting after Phase 0.
6. Approve the safety, privacy and teacher verification principles as launch requirements.
7. Confirm the product name and begin brand and domain registration.

## 23. Immediate Next Steps

1. Run discovery interviews with at least 20 teachers and 30 students.
2. Map the target curriculum and exam practical requirements.
3. Build a proof-of-concept simulation (for example filtration) to validate the engine.
4. Finalise the data model and API design.
5. Design the MVP interface and test with teachers.
6. Prepare the detailed budget and hiring plan.
7. Begin legal groundwork: trademark, terms of service, privacy policy, and a licence review of candidate circuit engines.

---

© Hezekiah Olawale Ojenike / MINDSET INFORMATION TECHNOLOGY LTD. This document is confidential and intended for the board, stakeholders and project team.
