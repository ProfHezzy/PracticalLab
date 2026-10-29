# PracticalLab Africa: Master UI Design Guide for AI Coding Agents

Oct 23, 2026 · @Olawale H. Ojenike

This is the single source of truth for how every screen of the product must look, feel and move. It is written to be read by any AI coding agent (Codex, Gemini, Antigravity, Cursor, Copilot, Claude Code) before it touches any interface code. Save it in the repo as docs/03-ui-guide.md. Where it differs from docs/02-design-guidelines.md, this guide wins.

© Hezekiah Olawale Ojenike / MINDSET INFORMATION TECHNOLOGY LTD. Working brand name: PracticalLab Africa.

## 0. Instructions to the AI Agent (read first, obey always)

1. **Do not invent a visual style.** Use only the tokens, components and page layouts in this guide. If something is missing, extend the system in the same spirit and tell me what you added.
2. **Build the design system first.** Before any page, create the token file, the base layout shell and the shared components (section 6). Pages are assembled from them. No one-off styling in pages.
3. **Every page and component must ship with these states:** loading (skeleton), empty, error, offline, and success where relevant.
4. **Mobile first.** Design at 360 px wide, then enhance for tablet and desktop. Test at 360, 768, 1024 and 1440.
5. **No placeholder text.** Use the real copy in this guide or write copy in the brand voice (section 1.3). Never lorem ipsum.
6. **No emoji as interface icons.** Use the icon set in section 2.8. Emoji are allowed only in user content and celebratory copy.
7. **Motion comes from the motion tokens only** (section 2.7). Respect reduced motion.
8. **Dark mode and light mode are both required** from day one.
9. **Accessibility is not optional:** AA contrast, 48 px touch targets, visible focus rings, labels on every input, keyboard support.
10. **Do not install a UI kit that imposes its own look.** Headless primitives (Radix UI, shadcn/ui components restyled to our tokens) are allowed. The default look of any library is never acceptable.
11. **At the end of every page you build, run the checklist in section 12 and report the result.**

### 0.1 What AI-generated interfaces usually get wrong (forbidden)

| Common AI mistake | What to do instead |
| --- | --- |
| Generic purple-blue gradient on everything | Use gradients only as defined in 2.2. Most surfaces are flat and clean. |
| Same grid of identical white cards on every page | Vary layout rhythm: hero cards, bento grids, lists, split panels, as specified per page. |
| Tiny grey text, low contrast | Minimum body 16 px, contrast rules in 2.1. |
| Default system look (generic Tailwind or shadcn feel) | Restyle with our radius, shadows, colour and type. |
| Flat, lifeless interface with no feedback | Every tap, hover and success has the motion in section 2.7. |
| Stock photos of non-African people, clip-art illustrations | Use the illustration direction in 2.9 and African subjects only. |
| Centered hero with a headline and nothing else | Use the hero spec in 7.1 with live visuals and a playable demo. |
| Walls of text and endless forms | Short copy, progressive steps, one primary action per screen. |
| Desktop-only layouts squeezed onto phones | Use the mobile patterns in section 5. |
| Inconsistent spacing and font sizes | Use only the scales in 2.3 and 2.4. |

## 1. Brand and Experience Goals

### 1.1 Audiences and how each should feel

| Audience | They should feel | Visual mode |
| --- | --- | --- |
| Students (about 12 to 25) | Excited, curious, proud. It looks like an app they would show friends. | **Student mode:** playful, big, colourful, animated |
| Teachers | Confident and in control. A professional tool they are proud to project in class. | **Educator mode:** calmer, clearer, more white space, same brand |
| Lecturers and professors | Respected and efficient. Serious enough for a lecture hall. | **Educator mode** with denser data views |
| Admin and staff | Safe, focused, fast. | **Admin mode:** utility first, minimal motion |
| Africa as a whole | Seen and celebrated. Warm, local, proud, not a copy of a Western product. | Textile-inspired patterns, warm palette, African faces and examples |

### 1.2 Visual identity in one line

**Bold lab, warm Africa.** Electric violet and teal for science and energy, sunny orange and yellow for warmth and reward, soft violet-tinted neutrals, chunky rounded shapes, geometric textile-inspired patterns, and a friendly flask mascot.

### 1.3 Voice and microcopy

- Short, active, friendly English. Light Pidgin or local flavour only in celebrations and empty states.
- Never shame a mistake. Never use heavy academic words.
- Buttons are verbs: Start experiment, Send to teacher, Create class.
- Examples: Welcome back. Your lab is ready. / Oops, the wire touched the wrong end. Want to see why? / No network? No wahala. Your lab still works. / Sent to your teacher. Fingers crossed!

### 1.4 Mode rules (same system, different density)

| Property | Student mode | Educator mode | Admin mode |
| --- | --- | --- | --- |
| Base spacing | Generous | Medium | Compact |
| Corner radius | 20 to 28 px | 16 to 20 px | 10 to 14 px |
| Motion | Rich, bouncy | Subtle | Minimal |
| Illustrations | Large, with mascot | Medium | None, icons only |
| Colour usage | Subject colours loud | Subject colours as tags | Brand violet for actions only |

## 2. Design Tokens

### 2.1 Colour

**Brand scales**

| Step | Violet (primary) | Orange (secondary) | Teal (accent) | Yellow (highlight) |
| --- | --- | --- | --- | --- |
| 50 | #F1EEFF | #FFF4EC | #E6FCFA | #FFF9E6 |
| 100 | #E3DDFF | #FFE5D1 | #C2F7F3 | #FFF0BF |
| 200 | #C7BBFF | #FFCBA3 | #8CEEE7 | #FFE699 |
| 300 | #A898FF | #FFAC72 | #55E3DA | #FFDE75 |
| 400 | #8A74FA | #FF9755 | #2ED9CE | #FFD35A |
| 500 (brand) | #6C4DF6 | #FF8A3D | #19D3C5 | #FFC83D |
| 600 | #5636DC | #E86F1F | #0FAFA3 | #EBAB14 |
| 700 | #4328B5 | #C05514 | #0C8981 | #D69A00 |
| 800 | #331E8A | #8F3F10 | #0A6762 | #9C7000 |
| 900 | #231561 | #5F2A0B | #07443F | #7A5600 |

**Neutrals (violet-tinted, never pure grey)**

| Step | Hex | Step | Hex |
| --- | --- | --- | --- |
| 0 | #FFFFFF | 500 | #7A7699 |
| 50 | #F7F6FF | 600 | #5B5878 |
| 100 | #EDEBFA | 700 | #3F3D5A |
| 200 | #DCD9F0 | 800 | #2A2845 |
| 300 | #C3BFDD | 900 | #1E1B3A |
| 400 | #9A96BA | 950 | #14122B |

**Semantic colours**

| Meaning | Base | Soft background | Text on soft background |
| --- | --- | --- | --- |
| Success | #22C55E | #E8F9EF | #15803D |
| Danger | #FF5A5F | #FFECEC | #C62828 |
| Warning | #F59E0B | #FFF6E0 | #A16207 |
| Info | #3B82F6 | #E8F1FF | #1D4ED8 |

**Theme tokens**

| Token | Light | Dark |
| --- | --- | --- |
| bg | #F7F6FF | #0F0D1F |
| surface | #FFFFFF | #1A1733 |
| surface-raised | #FFFFFF | #241F45 |
| border | #DCD9F0 | #332E5C |
| text | #14122B | #F4F2FF |
| text-muted | #5B5878 | #B3AED6 |
| primary | #6C4DF6 | #8A74FA |
| on-primary | #FFFFFF | #14122B |
| focus-ring | #19D3C5 | #2ED9CE |

**Subject colours** (used for topic cards, chips, lab headers and charts)

| Subject | Hex | Subject | Hex |
| --- | --- | --- | --- |
| Chemistry | #2BD67B | Biology | #8BD13B |
| Physics | #4C8DFF | Accounting | #E3A008 |
| Basic Electronics | #FFC83D | Economics | #E040A0 |
| Technical Drawing | #22C8E8 | Mechanical and Vocational | #FF7A29 |

**Colour rules**

- Body text needs at least 4.5:1 contrast, large text 3:1. For small text and links on white, use violet 600 or darker, not 500.
- Never convey meaning by colour alone. Pair with an icon or label.
- Maximum two accent colours per screen plus the subject colour.
- Large flat areas stay neutral. Colour is for focus, rewards and subjects.
- Never use pure black (#000000) or pure grey. Always use the violet-tinted neutrals.

### 2.2 Gradients and patterns

| Name | Definition | Use |
| --- | --- | --- |
| hero | linear 135deg, violet 500 to teal 500, with a soft orange 400 radial glow in one corner at 30% opacity | Home hero, onboarding, profile cover |
| reward | linear 135deg, yellow 500 to orange 500 | Badges, level up, key start buttons |
| subject | linear 160deg, subject colour at 100% to the same colour 20% darker | Topic card headers |
| night | linear 180deg, #1E1B3A to #14122B | Live classroom stage, dark sections |

**Patterns:** abstract geometric textile-inspired SVG patterns (stripes, diamonds, zigzags, dots in the style of African print fabrics such as Ankara and Aso-oke). They are original abstract designs, not copies of any specific protected pattern. Use at 5 to 8 percent opacity behind banners, empty states and footers. Each pattern file is under 5 KB and tiles seamlessly.

### 2.3 Spacing, radius, elevation, layers

- **Spacing scale (px):** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Use no other values.
- **Radius:** chip 999, button 14, input 12, card 20, large card 24, sheet and modal 28, avatar 999.
- **Shadows (always violet-tinted, never grey):**
  - sm: 0 1px 2px rgba(108,77,246,0.08)
  - md: 0 8px 24px -8px rgba(108,77,246,0.25)
  - lg: 0 20px 48px -12px rgba(108,77,246,0.35)
  - glow-teal: 0 0 0 4px rgba(25,211,197,0.25)
  - In dark mode, replace shadows with a 1 px border and a faint inner glow.
- **Z-index:** base 0, sticky 10, dropdown 20, nav 30, overlay 40, modal 50, toast 60, tooltip 70.
- **Borders:** 1 px in the border token. Focus ring: 3 px teal with 2 px offset.

### 2.4 Typography

| Role | Font | Weights |
| --- | --- | --- |
| Headings, brand, numbers | Sora (fallback Poppins, system-ui) | 600, 700 |
| Body and UI | Inter (fallback Nunito, system-ui) | 400, 500, 600 |
| Formulas, code, figures in tables | JetBrains Mono | 400, 500 |

Load with font-display swap, Latin subsets only, maximum two families plus mono, self-hosted if possible.

| Style | Mobile | Desktop | Line height | Weight | Tracking |
| --- | --- | --- | --- | --- | --- |
| Display | 36 | 64 | 1.05 | 700 | -0.02em |
| H1 | 28 | 40 | 1.15 | 700 | -0.01em |
| H2 | 22 | 30 | 1.2 | 600 | -0.01em |
| H3 | 18 | 22 | 1.3 | 600 | 0 |
| Body large | 18 | 18 | 1.55 | 400 | 0 |
| Body | 16 | 16 | 1.55 | 400 | 0 |
| Small | 14 | 14 | 1.5 | 400 | 0 |
| Caption | 13 | 13 | 1.4 | 500 | 0.01em |
| Live stage | 28 min | 40 min | 1.3 | 600 | 0 |

Rules: maximum line length 65 characters for reading text. Never below 13 px. Numbers in dashboards use Sora with tabular figures. Chemical formulas use proper subscripts and superscripts.

### 2.5 Layout grid and breakpoints

| Breakpoint | Width | Columns | Gutter | Page margin |
| --- | --- | --- | --- | --- |
| base (phone) | 360 and up | 4 | 16 | 16 |
| sm | 480 | 4 | 16 | 20 |
| md (tablet) | 768 | 8 | 24 | 32 |
| lg (laptop) | 1024 | 12 | 24 | 40 |
| xl (desktop) | 1280 | 12 | 32 | 48 |
| 2xl | 1536 | 12 | 32 | centered, content max 1440 |

Public pages: content container max 1200. App pages: fluid with content max 1440. Reading content max 720.

### 2.6 Sizing

- Touch targets 48 by 48 minimum, 8 px gap between them.
- Controls: small 36, medium 44, large 52 px tall (touch screens always use medium or large).
- Icons: 16, 20, 24, 32, 48.
- Avatars: 24, 32, 40, 56, 96, 128.

### 2.7 Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| duration-instant | 100 ms | Colour and opacity changes on press |
| duration-fast | 150 ms | Hover, small toggles |
| duration-base | 250 ms | Most transitions, menus, tabs |
| duration-slow | 400 ms | Page and sheet transitions |
| duration-celebrate | 600 to 900 ms | Rewards, confetti, level up |
| ease-spring | cubic-bezier(0.34, 1.56, 0.64, 1) | Bouncy pops, snaps, buttons, badges |
| ease-out | cubic-bezier(0.16, 1, 0.3, 1) | Entrances |
| ease-in-out | cubic-bezier(0.65, 0, 0.35, 1) | Moves between positions |
| stagger | 40 ms per item, maximum 8 items | Lists and card grids on load |

**Rules**

- Animate transform and opacity only. Never animate width, height, top or left.
- Entrances: fade up 12 px with ease-out. Exits are faster than entrances.
- Buttons: hover lifts 2 px with a stronger shadow, press sinks 2 px and scales to 0.98.
- Cards: hover lifts 4 px; the whole card is the tap target.
- Page transitions: shared-element growth from the tapped card where possible, otherwise slide-fade 250 ms.
- Numbers on dashboards count up once on first view.
- Skeletons shimmer left to right in 1.4 s loops.
- Scroll reveals: sections fade up once, never replay.
- Lottie files under 50 KB each, maximum 2 on screen at once. Prefer CSS and SVG animation.
- Use Framer Motion (motion) for React transitions and layout animation. Use CSS for simple hover and press states.
- **Reduced motion:** when prefers-reduced-motion is set, replace all movement with simple opacity fades and stop looping and parallax.
- Never block the user with an animation. Celebrations are skippable and under one second except level-ups.
- Sound: soft UI sounds under 30 KB each, a mute control in every lab, off by default in the feed and the classroom stage, and every sound has a visual twin.

### 2.8 Iconography

- Use **Lucide** icons (or Phosphor, but never mix sets). Stroke 1.75 to 2 px, rounded caps and joins.
- Filled variant (or a violet tint background pill) for the active navigation item.
- Sizes from 2.6. Icon-only buttons need an accessible label and a tooltip on desktop.
- Subject icons are custom chunky glyphs (flask, atom, bulb, ruler, leaf, calculator, chart, wrench) inside a rounded square in the subject colour.

### 2.9 Illustration, imagery and mascot

- **Style:** flat vector with soft highlights, thick friendly shapes, subtle glow. Apparatus look glossy and friendly, not technical drawings.
- **Mascot:** a small cheerful flask character with big eyes. It cheers, gasps, wipes its forehead after mistakes, and points to hints. Appears in onboarding, empty states, hints, errors and celebrations. Poses are delivered as SVG or Lottie.
- **People:** diverse African students, teachers and lecturers in real classrooms and homes. No stock imagery from other regions.
- **Formats:** SVG first, WebP for photos, lazy loaded, always with alt text.
- **Pattern headers:** pair gradients with the textile patterns from 2.2.

## 3. Product Surface Map

Build and style these areas. Every item is detailed in sections 7 to 10.

| Area | Pages and screens |
| --- | --- |
| Public | Home, How it works, For students, For teachers, Subjects, About, Contact, Help centre and FAQ, Terms, Privacy, Cookie notice, 404 and error pages |
| Authentication | Login, Register (role choice), Email or phone verification, Forgot password, Reset password, MFA challenge (staff), Teacher verification |
| Onboarding | Role and level, subjects, avatar and username, first experiment |
| Student app | Dashboard, Learn (subjects and topics), Topic detail, Student Lab, Assignments, Submission result, Feed, Friends, Groups, Group detail, Classes, Join class, Profile, Badges, Notifications, Settings, Search |
| Teacher app | Dashboard, Classes, Class detail and roster, Teacher Lab, Live classroom stage, Assignments (create, track, grade), Replay grading view, Library, Connections, Profile, Notifications, Settings |
| Admin portal | Dashboard, Curriculum (subjects, courses, topics, scheme of work), Content and experiments, Reviews, Users, Teacher verification, Moderation, Announcements, Analytics, Settings and feature flags, Audit log, Staff and roles |

## 4. Application Shell and Navigation

### 4.1 Desktop and laptop shell (1024 and up)

**Left sidebar**

- Width 264 px expanded, 80 px collapsed (icon only with tooltips). Collapse toggle at the bottom. The state is remembered.
- Top: logo and wordmark. Below: a role and mode chip (Student or Teacher) that can switch accounts if the user has both.
- Items: icon plus label, 48 px tall, 14 px radius. Active item: violet 50 background (violet 900 at 30% in dark), violet 600 text, a 4 px violet bar on the left edge and a filled icon. Hover: neutral 100 background.
- Sections separated by small caps captions. A subtle textile pattern at 5% opacity sits at the bottom of the sidebar with a mascot peeking in the corner.
- Bottom: streak flame and XP (students) or class count (teachers), then settings and help.

**Student sidebar order:** Home, Learn, My Lab, Assignments, Feed, Friends and Groups, Classes, Badges.

**Teacher sidebar order:** Home, Classes, Teacher Lab, Assignments, Library, Feed, Connections, Analytics (phase 2).

**Top bar**

- Height 64 px, sticky, surface colour with a faint blur and a 1 px bottom border that appears on scroll.
- Left: page title and breadcrumbs (when deeper than level two). Centre: global search (command palette on Ctrl or Cmd K). Right: a primary Create button (New experiment or Start class), notifications bell with unread dot, language switch, theme toggle, avatar menu (Profile, Settings, Switch role, Help, Sign out).
- Offline status shows as a slim amber bar under the top bar.

**Content area:** page header (title, one line of context, primary action on the right), then content in the grid from 2.5. Right-hand detail panel (360 px) may slide in for quick views.

### 4.2 Tablet shell (768 to 1023)

Collapsed icon sidebar (80 px) with tooltips, same top bar without the breadcrumbs. Content uses 8 columns.

### 4.3 Phone shell (below 768)

- **Top app bar:** 56 px. Left: back arrow or logo. Centre: title. Right: search and notifications. Collapses on scroll down and returns on scroll up.
- **Bottom tab bar:** 64 px plus the device safe area, surface colour with a top border and blur. Five tabs only, icon above a 12 px label, active tab gets a violet pill behind a filled icon with a small spring pop.
  - Student tabs: Home, Learn, Lab (raised centre button in the reward gradient), Feed, Me.
  - Teacher tabs: Home, Classes, Lab (raised centre), Assignments, Me.
- Secondary destinations (Groups, Badges, Settings) live in the Me tab and a More sheet.
- **Bottom sheets** for filters, comments, apparatus info and menus. 28 px top radius, drag handle, swipe to dismiss.
- Primary actions sit in the bottom third. Floating action button only on list screens, 56 px, bottom right, above the tab bar.
- Lab and Live screens hide the tab bar to maximise space (full-screen mode with a clear exit).
- Safe areas respected on all notched devices.

### 4.4 Admin shell

Desktop only layout, usable on tablet. Dense left sidebar 240 px with grouped sections, top bar with search, environment banner (PRODUCTION in red, STAGING in amber), the staff role badge and an MFA status indicator. Neutral surfaces with violet used only for primary actions.

## 5. Mobile Patterns (summary)

- Design for one thumb. Large targets, primary actions bottom, destructive actions need confirmation sheets.
- Lists beat tables. On phones, tables become stacked cards with the key value first.
- Forms: one column, labels above fields, inputs 52 px tall, the correct mobile keyboard type, sticky bottom submit button.
- Horizontal carousels use snap scrolling with a visible peek of the next card.
- Pull to refresh uses the flask-fill animation.
- Support landscape for labs and the classroom stage.
- Keep data light: skeletons first, lazy load images, no autoplay video, offline indicator always available.

## 6. Component Library (build these first)

| Component | Specification |
| --- | --- |
| Button primary | Violet 500 fill, white text, 14 px radius, medium 44 and large 52 px tall, hover lift and deeper shadow, press sink, loading state with spinner and disabled text, focus ring teal |
| Button reward | Reward gradient, dark ink text (neutral 950), used once per screen for the main start action |
| Button secondary | 1.5 px violet 500 border, transparent fill, violet 600 text, violet 50 fill on hover |
| Button ghost and danger | Ghost has no border and a neutral 100 hover. Danger uses danger base fill with white text and always asks for confirmation |
| Icon button | 44 px round, ghost style, tooltip on desktop |
| Text input and textarea | 52 px tall on phone (44 desktop), 12 px radius, 1.5 px border, label above, helper text below, error text with an icon in danger colour, focus ring teal, leading and trailing icon slots, password show or hide |
| Select, combobox, date picker | Same field style, searchable list in a bottom sheet on phone and a popover on desktop |
| Checkbox, radio, switch | 24 px, violet checked state, spring tick animation, switch knob springs |
| OTP input | Six separate 52 px boxes with auto-advance, paste support and a resend countdown |
| Cards | Surface colour, 20 px radius, md shadow on hover, 1 px border. Variants: topic card, assignment card, class card, stat card, post card, badge card, teacher card |
| Topic card | 4:3 illustration area with the subject gradient and apparatus art, subject chip, title (2 lines max), duration and difficulty, progress ring, Play button, locked state with a soft lock overlay |
| Chips and badges | Pill, 28 px tall, subject-colour soft background with a darker text. Status chips pair colour with an icon |
| Avatar | Round, optional level ring in the reward gradient, online dot, fallback initials on a violet 100 background |
| Tabs | Underlined with a sliding 3 px violet indicator on desktop, segmented pill control on phone |
| Modal and dialog | 28 px radius, centered on desktop, becomes a bottom sheet on phone, focus trapped, Escape closes, scale-in from 0.96 |
| Toast | Top on phone, bottom right on desktop, icon plus short text, 3 second auto dismiss, swipe to dismiss |
| Alert and banner | Soft semantic background, icon, title, one line, optional action |
| Tooltip | Neutral 900 background, white 13 px text, 150 ms delay |
| Data table (educator and admin) | Sticky header, sortable columns, filter bar, saved views, row hover, selectable rows with a bulk action bar, pagination or infinite scroll, column visibility, empty and error states. Becomes stacked cards on phone |
| Progress | Bars 8 px tall rounded in teal 500 with animated fill, rings with a number in the centre |
| Stepper | Dots on phone, numbered steps on desktop, current step in violet |
| Skeletons | Shapes matching the real layout with a shimmer |
| Empty state | Mascot illustration, one friendly sentence, one clear primary button |
| Error state | Mascot with a confused pose, plain explanation, Try again button, and a support link |
| Command palette | Opens with Ctrl or Cmd K, grouped results (Pages, Topics, People, Classes, Actions) |
| File upload | Dashed 2 px border drop zone with a pattern background, progress bar, accepted types and size shown |
| Notification item | Icon in a coloured circle, text, time, unread dot, swipe actions on phone |
| Streak, XP, badge, level | Streak flame grows with the count, XP bar glows when it fills, badges are shield or hexagon shapes with a metallic shine, level shown as a ring on the avatar |
| Offline banner | Slim amber bar: You are offline. Your work is saved and will sync later. |
| Language switch | Compact dropdown with language names written in their own language |

## 7. Public Pages

### 7.1 Home page (build exactly in this order)

**Public navigation bar.** Logo and wordmark on the left. Links: How it works, Subjects, For teachers, Help. Right: language switch, theme toggle, Log in (ghost button), Sign up free (reward button). The bar is transparent over the hero, then turns surface colour with a blur and a bottom border after 24 px of scroll. On phone: logo and a menu button that opens a full-screen sheet with large links and the two buttons at the bottom.

**Section 1: Hero.**

- Full-bleed hero gradient with a textile pattern at 6% opacity. Minimum height 88% of the screen on desktop. Two columns on desktop (7 and 5 of 12), single column on phone with the scene below the text.
- Eyebrow chip: Built for African classrooms.
- Headline (Display size, white): Don't just read it. Do it. The words Do it get a yellow hand-drawn underline swoosh.
- Sub-line (Body large, white at 90%): Mix, wire, build and test real experiments on your phone, even with low data.
- Buttons: Start your first experiment (reward, large) and I'm a teacher (white outline, large).
- Trust row (Small): Free to start. Works offline. Syllabus-aligned.
- Visual scene on the right: a phone mockup showing the lab, a flask pouring a glowing liquid, rising bubbles, a bulb that lights up, and subject chips floating around it. The scene is layered SVG and Lottie, under 150 KB total.
- Motion: headline words fade up with a 60 ms stagger, scene items float up and down 8 px on 4 to 6 second loops with different phases, bubbles rise continuously, a very slight pointer parallax on desktop. With reduced motion: static scene.
- Bottom edge: a zigzag textile-style divider into the next section.

**Section 2: Try it now (instant demo).** A card on a neutral background with the heading Try a real experiment in 20 seconds. A mini 3D lab with three draggable pieces (beaker of muddy water, funnel, filter paper). The visitor drags them together, pours, and sees clean water with a confetti puff and a happy mascot. Below: Want the full lab? Sign up free. No sign-up needed to play. Lazy load after the page is interactive, under 1 MB, with a static animated fallback on weak devices.

**Section 3: How it works.** Four steps with a connecting path that draws itself as the user scrolls: 1 Pick a topic, 2 Watch it, 3 Do it, 4 Share it. Each step has a numbered badge, an icon, a one-line description and a 3 second looping animation. Horizontal on desktop, vertical on phone.

**Section 4: Subjects.** A swipeable carousel of subject cards in their subject colours with chunky icons: Chemistry, Physics, Basic Electronics, Technical Drawing, Biology, Accounting, Economics, Mechanical and Vocational. Subjects not yet released show a Coming soon chip. Never show fake experiment counts.

**Section 5: Why students love it (bento grid).** Six tiles of mixed sizes, each with a mini animation: Safe failure (try, break it, learn why), Attempt replay, Works offline, Classroom mode, Friends and groups, Syllabus-aligned. Hover lifts a tile 4 px.

**Section 6: For teachers.** Dark night gradient section in educator mode. Left: heading Turn any classroom into a lab, three short benefits (play a lesson, run it live, grade with replay) and a Open your teacher lab button. Right: a laptop mockup showing the dark Live stage with the playback bar. Content slides in from the sides.

**Section 7: For students and friends.** A phone mockup with the feed, a streak flame, XP bar and badges, with the heading Bring your squad. Short copy about groups and challenges.

**Section 8: Works on any phone.** Heading No network? No wahala. Three facts with icons: small downloads, your lab works offline, your work syncs later. Do not state numbers that are not verified.

**Section 9: Voices.** Real quotes and photos from pilot students and teachers once available, in cards with avatars. Until then, show a Founding teachers waitlist card instead. Never invent testimonials.

**Section 10: Safe for young learners.** Four icon tiles: private by default, block and report in one tap, verified teachers, you control what you share.

**Section 11: FAQ.** Accordion with 8 questions: Is it free? Do I need data all the time? Which subjects? Can my teacher see my work? How do I join my teacher's class? Is it safe? Does it work on a cheap phone? How do teachers sign up? Answers short, plain and friendly.

**Section 12: Final call to action.** Large hero-gradient block with the celebrating mascot and the headline Your lab is waiting. Buttons: Start free and I'm a teacher.

**Section 13: Footer.** Dark surface with the textile pattern. Four columns: Product, For teachers, Help, Company and legal. Language switch, social icons, and the line: (c) Hezekiah Olawale Ojenike / MINDSET INFORMATION TECHNOLOGY LTD.

### 7.2 Other public pages

| Page | Layout |
| --- | --- |
| How it works | Longer version of section 3 with a large animated walkthrough per step and a final call to action |
| For students | Student-mode page: benefits, a feed and badges preview, subject cards, FAQ |
| For teachers | Educator-mode page: classroom stage, assignments with replay grading, class codes, teacher verification explained |
| Subjects index and subject page | Grid of subject cards, then a subject page with a gradient header, scheme of work by level and term, and topic cards |
| About | The story: why practicals matter in African education, the mission, the team, with large illustrations |
| Contact | Short form (name, email, message), response time note, alternative channels |
| Help centre and FAQ | Big search bar, category cards, article pages with max width 720 and a was this helpful prompt |
| Terms, Privacy, Cookies | Reading layout, 720 px max width, table of contents sidebar on desktop, last updated date |
| 404, 500, maintenance, offline | Mascot illustration, one friendly sentence, one clear button (Go home, Try again) |

## 8. Authentication and Onboarding

### 8.1 Auth layout (all auth pages)

- **Desktop:** split screen. Left 45%: hero gradient with pattern, the mascot, the logo and rotating one-line benefits that crossfade every 5 seconds. Right: centred form card (max width 440, 28 px radius, md shadow) on the neutral background.
- **Phone:** a compact 160 px hero-gradient header with the logo and the mascot peeking over the edge. The form sits in a sheet with 28 px top radius overlapping the header. Inputs are 52 px tall, and the main button sticks to the bottom above the keyboard.
- Each page has one heading, one line of helper text, one primary action, and a small link to the neighbouring page. No distractions.

### 8.2 Pages

| Page | Elements |
| --- | --- |
| Login | Heading Welcome back. Fields: email, username or phone, and password with show or hide. Remember me, Forgot password link, Log in button, divider, social sign-in if enabled, Create an account link. Friendly inline errors. After repeated failures: a calm lock message with a countdown. Staff proceed to the MFA challenge. |
| Register, step 1 | Heading Join PracticalLab. Two large selectable cards with illustrations: I'm a student and I'm a teacher or lecturer. Selected card gets a violet border, check icon and a spring pop. |
| Register, step 2 | Name, email or phone, password with a strength meter and a live rules checklist, terms and privacy checkbox, Create account button. Show a progress indicator. |
| Verify | Heading Check your messages. Six-box code input with auto-advance and paste, a resend button with a 30 second countdown, and a Change email link. Success shows a mascot celebration. |
| Forgot password | Email or phone field, Send reset link button, a mascot with an envelope animation after sending, and a Back to login link. Never reveal whether an account exists. |
| Reset password | New password and confirm with the strength meter and rules checklist. Success state with a check animation and a Log in button. Expired link state with a Request a new link button. |
| MFA challenge (staff) | Six-box code input, a Use a backup code link, a Trust this device option, and a shield icon header. |
| Teacher verification | Step 1 about you (subjects taught, level, optional institution). Step 2 upload proof (staff ID or similar) with the file upload component. Step 3 status page with a timeline: Submitted, In review, Approved or Needs more info. While pending, a banner explains what teachers can already do and what unlocks after approval. |

### 8.3 Onboarding (first run, four short steps)

Progress dots at the top, the mascot guiding each step, a Skip for now where safe.

1. **Your level:** big tiles: Junior secondary, Senior secondary, University or polytechnic, Skill learner. Teachers choose the levels they teach.
2. **Your subjects:** a grid of subject tiles in subject colours, multi-select with a spring tick.
3. **Your profile:** avatar picker (a grid of friendly characters and colours, or upload), username with a live availability check.
4. **Your first experiment:** a guided 60 second starter. It ends with confetti, XP and the first badge, then lands on the dashboard.

## 9. Student App Pages (Student mode)

### 9.1 Dashboard

- **Row 1, greeting hero (full width):** hero gradient card with the pattern. Avatar with level ring, Good morning, {name}, the streak flame with day count, and the XP bar. Mascot waves in the corner.
- **Row 2:** Continue card (8 columns): last experiment with a progress ring and a big Resume button. Daily challenge (4 columns): a 2 minute practical with a reward preview and a countdown to the next challenge.
- **Row 3:** This week's scheme of work: horizontally scrolling topic cards in subject colours with the current term tab.
- **Row 4:** Assignments due (7 columns): cards with deadline chips (colour plus icon) and a Start button. Friends and groups activity (5 columns): avatars with activity dots and short updates.
- **Row 5:** Recent badges shelf and the friends leaderboard (weekly, never shaming).
- **Phone:** stack all rows, greeting hero compact, horizontal carousels with snap scrolling, tab bar visible.
- **Motion:** cards fade up in sequence, numbers count up, the flame flickers, the XP bar fills with a shimmer.

### 9.2 Learn and topic pages

- **Learn:** subject tiles, then a subject page with Term tabs (First, Second, Third), a week-by-week scheme of work timeline, and a filterable grid of topic cards.
- **Topic detail:** header in the subject gradient with the title, tabs Watch, Practise, Test and Notes, a progress ring, and a sticky bottom Start experiment button (reward). Related topics carousel at the end.

### 9.3 Student Lab (the workbench, most important screen)

- Full-screen mode, no tab bar. **Top bar (56 px):** back, topic title, step counter (Step 3 of 8), hint button, sound toggle, menu.
- **Canvas:** the largest area, a real-time 3D scene (see 9.8) with a lab bench, soft lighting and shadows, and glossy 3D apparatus the student can rotate, zoom and pick up. Placed items snap with a bounce and a click sound and show a soft glow when correctly connected.
- **Apparatus tray:** bottom, 120 px tall, swipeable, big icons with names. On tablet landscape and desktop, the tray moves to a vertical left panel.
- **Coach bubble:** top-left speech bubble from the mascot giving the next step. Tap to replay the voice. Collapsible.
- **Steps panel:** desktop only, right side, collapsible, shows the checklist with ticks.
- **Controls:** undo, redo, reset, a small recording dot (your attempt is being recorded for replay), and a Check my work button.
- **Feedback:** a correct step shows a teal glow ring and a confetti puff. A mistake shows the friendly cartoon reaction, then an explanation bottom sheet: what happened, why, and a Try again button. Never red screens or harsh sounds.
- **Safety meter (where relevant):** a friendly gauge showing risky actions, which turn into learning moments.
- **Modes:** Guided and Free explore toggle.
- **Finish screen:** score, one to three stars, what you learned in one line, XP gained, then Share, Try again, Next topic.
- **Offline:** works fully from cache, with a small Saved offline chip.

### 9.4 Assignments

- Tabs: To do, Submitted, Graded. Cards with the topic art, teacher name, deadline chip and status chip.
- **Detail:** brief, rubric summary, deadline, attempts left, a Start in lab button, and after finishing a Submit to teacher sheet with a celebration.
- **Result page:** score ring, rubric breakdown, teacher feedback, and a Watch my replay link.

### 9.5 Feed

- Composer at the top (Share a result), a stories-style row for daily challenges and teacher announcements, then post cards.
- **Post card:** avatar and name, time, a looping preview of the experiment result, caption, reaction row with cheer reactions (flask, bulb, flame) instead of a plain like, comment and Try this experiment buttons, and a three-dot menu with Report and Block.
- Desktop right rail: suggested friends, your groups, trending experiments.

### 9.6 Friends, groups and classes

- **Friends:** tabs Friends, Requests, Find people. Search by username.
- **Groups:** list of group cards with cover, name, members and activity. **Group detail:** cover banner, member row, group challenges, feed of group posts, invite button. Create group flow in three steps (name and subject, cover and colour, invite friends).
- **Classes:** a Join class screen with one very large code input and a playful validation animation, then a welcome screen. My classes as cards. **Class detail:** teacher card with verified badge, assignments, announcements and classmates.

### 9.7 Profile, badges, notifications, settings, search

- **Profile:** gradient cover with the pattern, large avatar with level ring, name, username, level, stats row (experiments, streak, badges, friends), badge shelf with locked badges as soft silhouettes, tabs Activity, Badges, Groups, Classes. Edit profile as a sheet. Privacy toggles are easy to find.
- **Badges and leaderboard:** grid of badges with progress, a weekly friends and group leaderboard.
- **Notifications:** grouped by day, filter chips (All, Assignments, Friends, Groups), swipe to mark read on phone.
- **Settings:** sections Profile, Privacy and safety, Notifications, Language, Appearance (light, dark, system), Sound, Data saver and offline downloads, Blocked users, Account. Every toggle saves instantly with a toast.
- **Search:** command palette on desktop, a full-screen search on phone, with tabs Topics, People, Groups, Classes.

### 9.8 3D Simulation Visual and Interaction Spec (Student Lab, Teacher Lab and Live stage)

**Decision: every simulation is real-time 3D, never flat 2D.** Test tubes, beakers, wires, bulbs, burners and all apparatus are 3D models. The student can see the experiment from any angle and feel it through light, motion, sound and vibration. This section overrides any 2D wording elsewhere in this guide.

**Engine and structure**

- Three.js (WebGL) with React Three Fiber. The 3D scene sits in a canvas that fills the lab area. All controls, steps, hints and feedback stay as normal interface layers above the canvas, built from the components in section 6.
- One reusable simulation engine: apparatus library, interaction rules, effects library, recorder for replay. Each experiment is a configuration, not new code.
- Lightweight physics for dragging, stacking and snapping. Liquids are shader-based, not a true fluid simulation. Smoke, steam, sparks and bubbles are particle systems.

**Scene look**

- A friendly 3D lab bench or workspace with soft key light, fill light and a small environment map. Soft contact shadows under every object. Light and dark lab themes matching the app theme.
- Apparatus are low-poly, glossy, slightly stylised models with clear edges so they read well on small screens. Labels appear as billboard text that always faces the camera and can be toggled.
- Subject colour appears in the bench accent and the label chips, not as heavy tinting of the models.

**Camera and touch controls**

- One finger drag rotates the view, pinch zooms, two finger drag pans. Mouse: drag, scroll, right drag.
- Tap and drag an apparatus to pick it up. Valid snap points light up with teal rings, and a ghost preview shows where it will land.
- Double tap focuses the camera on an object. Preset views: Front, Top, Close-up, and a Reset view button. The camera glides to the key action during important steps, and the student can override it at any time.
- Camera limits keep the student from losing the bench. An alternative to dragging is tap to select, then tap the target, for accessibility.

**Effects catalogue**

| Effect | What the student must see |
| --- | --- |
| Electric current | Glowing pulses travelling along the wire from positive to negative. Speed and brightness grow with the current. Teal for normal, warming to yellow and orange when high. Bulbs and LEDs emit light with a soft glow. Resistors glow warm when hot. A short circuit shows bright sparks, a red-hot wire and a thin wisp of smoke, then a friendly explanation |
| Heating and flame | An animated flame, blue at the base and yellow at the tip, with a heat shimmer above it. Glass warms in colour and the thermometer rises smoothly |
| Smoke and steam | Soft puffs that rise, expand, drift and fade. Density, colour and speed depend on the reaction. Steam condenses into droplets on cool glass |
| Gas bubbles | Bubbles of different sizes rising through the liquid and popping at the surface, with fizz sound |
| Liquids | A curved surface at the edge of the liquid, wobble when moved, ripples when poured, a visible stream while pouring, colours blending when mixed |
| Reactions and precipitate | Cloudy particles forming and settling, and colour change over a few seconds |
| Pressure | A gauge needle that climbs, a vessel that vibrates slightly, then a stopper that pops with a harmless puff and a tiny camera shake |
| Filtration and distillation | Drips falling with small splashes, and condensation droplets running down the condenser |
| Glass and metal | Clear glass with edge highlights and reflections, metals with soft reflections. Simplified transparent materials on the Low tier |
| Flame tests and colours | Scientifically accurate colours, always reviewed by a subject expert before release |

All dangerous results (fire, smoke, pressure, short circuits) are shown as harmless simulations with a clear explanation. Never show injury or gore.

**Feel it: sound, vibration and visual feedback**

| Moment | Sound | Vibration (Android phones that support it) | Visual |
| --- | --- | --- | --- |
| Snap into place | Soft click | Short light tick | Teal ring pulse |
| Pouring | Liquid stream | Gentle continuous pulse | Stream and ripples |
| Heating | Rising hiss or crackle | Slowly increasing pulse | Shimmer and warm tint |
| Current flowing | Low electric hum that rises in pitch with current | Very light buzz at high current only | Glowing pulses |
| Pressure pop or short circuit | Pop or crackle | One strong pulse | Tiny camera shake and a puff |
| Mistake | Soft wobble sound | Two quick taps | Friendly cartoon reaction |

- Vibration is switched on or off in Settings. iPhone browsers do not support vibration, so sound and visuals carry the effect there.
- Never flash more than three times per second. Keep camera shake small and skippable. Respect reduced motion by turning shake and shimmer off.

**Quality tiers (automatic with a manual override in Settings)**

| Tier | Target device | Budget (to be tuned in the proof of concept) |
| --- | --- | --- |
| Low | Cheap and older Android phones | Under 50,000 triangles per scene, baked soft shadows, no bloom, simplified glass, up to about 150 particles, 30 fps target |
| Medium | Mid-range phones | Under 120,000 triangles, soft shadows, light bloom, up to about 500 particles, 60 fps target |
| High | Good phones, laptops and the classroom projector machine | Under 250,000 triangles, full effects including heat distortion, up to about 1,500 particles, 60 fps target |

- The app tests the device on first launch and picks a tier. If the frame rate drops, it lowers the tier smoothly and tells the student in a small toast.
- A Data saver and Battery saver option forces the Low tier. When WebGL is not available, show the 2D Lite fallback with a clear message.

**Performance rules for 3D**

- Each 3D simulation loads on demand and stays under 4 MB in total, with compressed models (glTF with Draco or Meshopt) and compressed textures (KTX2). Apparatus models are shared between experiments and cached for offline.
- Render only when something moves or changes. Pause rendering when the tab is hidden or the student is idle. Release GPU memory when leaving the lab.
- Keep draw calls low by sharing materials and instancing repeated objects. Show a skeleton and the mascot loader while models load, with a visible progress bar.

**Interface over 3D**

- Top bar, apparatus tray, coach bubble, step panel and controls follow section 9.3. The apparatus tray shows 3D thumbnails that rotate gently on hover or press.
- Provide captions for narration and every sound, keyboard controls for camera and selection, and screen reader step descriptions.
- Replay for teachers uses the same 3D scene driven by the recorded actions, with the camera free to rotate.

**Live classroom stage:** the same engine at a larger scale, with a bright and night theme, camera presets, the laser pointer as a ray into the scene, bigger labels, and the High tier by default on laptops.

**VR (optional, Phase 3):** an immersive mode using WebXR on supported devices and cardboard-style viewers. Not part of the MVP. Design the scene so it can be entered in VR later.

## 10. Teacher and Lecturer App Pages (Educator mode)

Same brand, calmer and denser than the student app. Smaller illustrations, more white space, clear data, subtle motion.

### 10.1 Dashboard

- **Header:** Good morning, {title and name}, verified badge, and three quick actions: Start live class (reward), Create assignment, Create class.
- **Stat cards row (4):** Students, Active classes, Awaiting grading, Average score. Numbers count up once.
- **Main area:** Today's class card (next scheduled lesson with a Start button), a Needs grading list (student, assignment, submitted time, Open replay), a class activity chart, and announcements.
- **Phone:** quick actions as a horizontal chip row, stats as a 2 by 2 grid, lists as cards.

### 10.2 Classes

- **List:** grid of class cards showing name, subject colour, level, student count, class code and a quick Share button.
- **Create class:** a modal or sheet with name, subject, level, joining mode (automatic or approval first). On success, a celebration screen showing the class code in a large card with Copy, Share on WhatsApp and Copy invite link buttons.
- **Class detail tabs:** Roster (avatars, last activity, remove), Join requests (approve or reject), Assignments, Activity, Settings. A pinned class code card sits at the top.
- Teachers who are not verified see a clear banner and the Create class button leads to the verification page.

### 10.3 Teacher Lab

- **Three panels on desktop:** left library (subjects, topics, search, recent, favourites), centre preview stage, right inspector. On phone, the library is a bottom sheet and the inspector is a second sheet.
- **Inspector:** a big segmented switch for Auto-play and Live, an Assign to class button, Save to my lab, Share with a teacher, and a Preview as student toggle.
- The stage shows the experiment in a large rounded frame with the playback bar beneath it. A Present button launches the Live stage in full screen.

### 10.4 Live classroom stage (projector and TV screen)

Designed for a bright classroom and a distant audience.

- Full-screen, no navigation. Two themes: Night (the night gradient with high-contrast apparatus) and Bright (white background with thick dark outlines), switchable in one tap.
- **Chrome auto-hides** after 3 seconds. Tap or move the mouse to bring it back. A small, always-visible Exit control sits in a corner.
- **Type and shapes:** text 28 px minimum on phone and 40 px minimum on desktop, thick outlines, large labels on every apparatus, large hit areas.
- **Playback bar (bottom, 72 px):** play and pause, step back and forward, rewind, speed (0.5x, 1x, 2x), captions toggle, sound toggle and a laser pointer toggle.
- **Laser pointer:** a glowing teal dot with a short trail that follows the finger or mouse.
- **Captions on by default** in large type at the bottom of the stage.
- **Predict pause:** a button freezes the scene with a large overlay: Predict what happens next. A countdown ring is optional. Resume reveals the result with a motion reward.
- **Auto-play mode:** the app narrates and runs the whole lesson, with a progress segment bar at the top showing steps.
- **Live mode:** the teacher drags apparatus directly with the same snap and glow feedback as the student lab, at a larger scale.
- A timer and a small mascot help button for tips (teacher only).
- Phase 2: annotation toolbar (highlight, label, draw, clear) as a floating pill at the bottom. Phase 3: student device sync indicator.

### 10.5 Assignments

- **Create wizard (4 steps, progress bar):** 1 Choose experiment, 2 Instructions and rubric, 3 Audience (class, group or selected students), 4 Deadline and attempts. A final review screen shows a preview of what students will see, and Send assignment.
- **Tracking page:** table (cards on phone) with student, status chip, score, submitted time, and quick filters. A progress summary on top (Not started, In progress, Submitted, Graded).
- **Grading view:** the attempt replay is the hero. Layout: replay stage on the left (about 60%), a rubric and score panel on the right, a feedback box, Previous and Next submission buttons. Under the replay is a scrubber timeline with markers for mistakes and key steps. Clicking a marker jumps to that moment. Save grade with a success toast. Phone: the stage on top, panels as tabs below.

### 10.6 Other teacher pages

- **Library:** all topics and saved lessons with filters by subject, level and term.
- **Connections:** teachers and students, requests, and a Find teachers search.
- **Analytics (phase 2):** class performance, common mistakes by step, engagement over time, using the chart rules in section 11.
- **Profile:** verified badge, subjects taught, classes count, short bio. Same structure as the student profile with calmer styling.

## 11. Admin Portal Pages (Admin mode)

Compact, calm, trustworthy. Neutral surfaces, violet only for primary actions, subject colours only on subject tags, minimal motion. Always show the environment banner and the staff role badge.

| Page | Layout and behaviour |
| --- | --- |
| Dashboard | KPI cards (registrations, active users, topic usage, completion rate, open reports, pending reviews), line and bar charts, recent activity feed, and two work queues: Pending reviews and Open reports |
| Curriculum | Left tree (Subject, Course, Level, Topic, Scheme of work) with drag to reorder, centre detail form, right live preview showing how it appears to students. Version history drawer with compare and rollback. Bulk import wizard (upload CSV, map columns, validate, preview, confirm) |
| Content and experiments | Table of experiments with status chips (Draft, In review, Approved, Published), version, owner and last updated. Detail page with asset list, preview as student and as teacher, and a Submit for review button |
| Reviews | Board with columns Draft, In review, Approved, Published. Cards show title, owner, reviewer avatar and age. Review screen with a side-by-side checklist (accuracy, safety, accessibility, performance) and Approve or Request changes with a required comment |
| Users | Searchable table with filters (role, level, status, joined date), saved views, a detail drawer (profile, connections, activity, reports) and actions (verify teacher, suspend, force reset). Personal fields masked by default with a logged Reveal action |
| Teacher verification | Queue with a document viewer on the left and a decision panel on the right (Approve, Reject, Ask for more info, with required notes) |
| Moderation | Report queue sorted by severity. Report detail shows the content, reporter, history and one-click actions (dismiss, remove content, warn, suspend). Every action needs a reason |
| Announcements | Composer with title, message, channel (in-app, push, email, SMS), audience segment builder with an estimated reach, and a live preview on phone and desktop |
| Analytics | Date range picker, KPI summary, charts, export (logged) |
| Settings and feature flags | Grouped settings with a change summary before saving. Flags show environment, owner and last change |
| Audit log | Immutable table: time, actor, role, action, target, IP, and a diff viewer for before and after values. Filters and export (logged) |
| Staff and roles | Staff table, invite flow, and a permission matrix (roles as columns, permissions as rows) with a clear least-privilege note |

**Admin rules:** destructive actions open a confirmation dialog that names the action and the target. Sensitive actions that need a second approver show a pending approval state. Tables are the main pattern: sticky headers, filters, saved views, bulk actions. MFA status and session timeout warnings are visible. No decorative animation.

## 12. Charts and Data Visualisation

- Use a charting library (Recharts or similar) styled entirely with our tokens. No default library colours.
- Series order: violet 500, teal 500, orange 500, yellow 500, then subject colours for subject-based charts.
- Rounded bar ends, 2.5 px lines, soft area fills at 15% opacity, light gridlines in the border token, labels at 13 px.
- Always show a title, units and a plain-language takeaway sentence under the chart.
- Tooltips use the card style. Animate once on first view (400 ms, ease-out).
- Colour-blind safe: add shapes or patterns to series when more than three series appear.
- Provide a data table alternative for screen readers.

## 13. States and Edge Cases (required for every page)

| State | Requirement |
| --- | --- |
| Loading | Skeletons matching the real layout. Never a blank page or a lone spinner |
| Empty | Mascot, one friendly sentence, one primary action |
| Error | Mascot, plain explanation, Try again, support link, and the error never blames the user |
| Offline | Amber banner, cached content stays usable, queued actions show a Waiting to sync chip |
| Permission denied | Clear explanation and the right next step (for example Verify to create classes) |
| Success | Toast for small actions, celebration only for real milestones |
| Slow network | Show cached data first, refresh in the background, show a subtle refreshing indicator |
| Long content | Truncate with ellipsis and a tooltip or expand control. Layouts never break with long names |
| Disabled | Reduced contrast plus a tooltip explaining why |
| First-time use | Short tips or a guided tour that can be dismissed and never returns |

## 14. Accessibility, Inclusion and Performance

**Accessibility checklist**

- Contrast at least 4.5:1 for text and 3:1 for large text and icons.
- All interactive elements reachable by keyboard with a visible teal focus ring and a logical order.
- Touch targets at least 48 px. Every input has a visible label. Errors are announced to screen readers.
- Every sound has captions or a visual cue. Every animation has a reduced-motion version.
- Drag and drop always has an alternative: tap to select, tap to place.
- Never rely on colour alone. Support text zoom to 200% without breaking layouts.
- Language switch on every main screen. Plan for English first, then Yoruba, Hausa, Igbo and Pidgin. Allow for text that is 30% longer in other languages.
- Use plain words and short sentences. Use icons with labels, never icons alone for key actions.

**Performance budgets (design must respect these)**

| Asset or metric | Budget |
| --- | --- |
| Home page critical assets | Under 300 KB, interactive in under 5 seconds on 3G or 4G on a mid-range phone |
| Each Lottie animation | Under 50 KB |
| Each sound effect | Under 30 KB |
| Each simulation bundle | Under 4 MB for a 3D simulation (compressed models and textures), loaded on demand and cached for offline |
| Images | WebP or SVG, lazy loaded, sized to the screen, always with dimensions set |
| Fonts | Two families plus mono, subset, font-display swap |
| Animation | Transform and opacity only, 60 fps on a mid-range Android phone |
| Layout shift | Reserve space for images and skeletons so the page never jumps |

## 15. How the AI Agent Must Work With This Guide

### 15.1 Build order

1. Design tokens as CSS variables and a theme file, light and dark.
2. Fonts, icon set, global styles and motion utilities.
3. Shared components from section 6, each with all states and a visual preview page (a simple component gallery route).
4. The app shell: public bar and footer, desktop sidebar and top bar, phone tab bar and top app bar, admin shell.
5. Public pages (section 7), then auth and onboarding (section 8).
6. Student pages (section 9), then teacher pages (section 10), then admin pages (section 11).
7. Polish pass: motion, states, accessibility, performance.

### 15.2 Per page report (the agent must output this after each page)

- Page name and route, and which section of this guide it follows.
- Components reused and any new components added.
- States implemented: loading, empty, error, offline.
- Checked at 360, 768, 1024 and 1440 px, light and dark.
- Accessibility: contrast, focus, keyboard, reduced motion.
- Performance: asset sizes and any budget exceeded.
- Deviations from this guide, with the reason.

### 15.3 Definition of done for any screen

- Uses tokens only, with no hard-coded colours, sizes or fonts.
- Matches this guide's layout and copy.
- All required states exist.
- Works on a 360 px phone and a 1440 px desktop in both themes.
- Motion matches the tokens and respects reduced motion.
- Meets the accessibility and performance checklists.
- Passes lint, type checks and tests, with no console errors.

### 15.4 Prompt to paste into any AI before UI work

```text
Before building any interface, read docs/03-ui-guide.md completely, then docs/02-design-guidelines.md and docs/PLAN.md. The UI guide is the law for colours, typography, spacing, motion, navigation, components, page layouts and copy. Do not invent your own style and do not use the default look of any UI library. All lab and simulation screens are real-time 3D (Three.js), never flat 2D, and must follow section 9.8.

First build the design tokens, the app shell and the shared components with all states. Then build the page I ask for, following its section in the guide exactly, in light and dark mode, mobile first at 360 px and enhanced for tablet and desktop. Include loading, empty, error and offline states. Use real copy from the guide, never lorem ipsum. Use the specified motion tokens and respect reduced motion.

When finished, give me the per page report from section 15.2 and list any deviations. If something is missing or unclear in the guide, ask me before you decide.
```

---

© Hezekiah Olawale Ojenike / MINDSET INFORMATION TECHNOLOGY LTD. Confidential design document for the project team.
