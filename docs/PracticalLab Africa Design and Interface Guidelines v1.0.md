# PracticalLab Africa: Design and Interface Guidelines

Oct 18, 2026 · @Olawale H. Ojenike

The look: a bright, playful, bold lab that feels like your favourite app, not a textbook. Every screen should make a student want to tap, mix, build and share.

© Hezekiah Olawale Ojenike / MINDSET INFORMATION TECHNOLOGY LTD. Working brand name: PracticalLab Africa.

## 1. Design Vision and Principles

**One line:** Your lab, in your pocket. Learning that feels like play and looks like the apps students already love.

| Principle | What it means on screen |
| --- | --- |
| Hands first | Students touch, drag and mix within seconds. No long reading before the first experiment. |
| Joy on every tap | Every action gets a small, delightful reaction: a glow, a bounce, a sound. |
| Fail safely, learn loudly | Mistakes are funny and friendly (a harmless puff, a wobbling bulb), never scary or shaming. |
| Proudly African | Warm colours, textile-inspired patterns, local names and examples, and Nigerian classroom context. |
| Light and fast | Beautiful on cheap Android phones and slow data. Beauty must never cost seconds. |
| Clear for everyone | Big touch targets, strong contrast, captions for sound, and colour never carries meaning alone. |

## 2. Brand Personality and Voice

- **Personality:** curious, confident, playful, encouraging. Like a cool older student who is great at science.
- **Voice:** short, active, friendly English. Light Pidgin or local phrases may appear in celebrations and empty states, never in instructions that must be understood.
- **Never:** talk down to students, shame mistakes, or use heavy academic language.

| Moment | Sample copy |
| --- | --- |
| Welcome | Ready to mix something? Your lab is open. |
| Correct step | Nice one! That is how scientists do it. |
| Mistake | Oops! The wire touched the wrong end. Want to see why? |
| Streak | 5 days in a row. You are on fire. |
| Empty groups | No groups yet. Start one and bring your squad. |
| Offline | No network? No wahala. Your lab still works. |
| Submitted | Sent to your teacher. Fingers crossed! |

## 3. Colour System

Bold, warm and electric colours on a clean base. Each subject has its own colour so students always know where they are.

### 3.1 Core palette

| Token | Name | Hex | Use |
| --- | --- | --- | --- |
| primary | Lab Violet | #6C4DF6 | Main buttons, links, active navigation, brand |
| secondary | Spark Orange | #FF8A3D | Highlights, calls to action, streak flame |
| accent | Reaction Teal | #19D3C5 | Success glow, progress, interactive hints |
| highlight | Solar Yellow | #FFC83D | Badges, stars, rewards, XP |
| success | Go Green | #22C55E | Correct answers, completed steps |
| danger | Oops Coral | #FF5A5F | Mistakes, errors, destructive actions |
| info | Sky Blue | #3B82F6 | Tips, hints, information |
| ink | Deep Ink | #14122B | Main text on light, dark mode background base |
| surface-dark | Midnight | #1E1B3A | Dark cards and the Live stage |
| muted | Slate | #5B5878 | Secondary text |
| mist | Mist | #EDEBFA | Borders, dividers, subtle fills |
| cloud | Cloud | #F7F6FF | Light page background |

### 3.2 Subject colours

| Subject | Colour | Hex |
| --- | --- | --- |
| Chemistry | Fizz Green | #2BD67B |
| Physics | Orbit Blue | #4C8DFF |
| Basic Electronics | Volt Yellow | #FFC83D |
| Technical Drawing | Blueprint Cyan | #22C8E8 |
| Biology | Leaf Lime | #8BD13B |
| Accounting | Ledger Gold | #E3A008 |
| Economics | Market Magenta | #E040A0 |
| Mechanical and Vocational | Forge Orange | #FF7A29 |

### 3.3 Gradients and surfaces

- **Hero gradient:** Lab Violet to Reaction Teal at 135 degrees, with a soft Spark Orange glow in one corner.
- **Reward gradient:** Solar Yellow to Spark Orange for badges and level-ups.
- **Cards:** white or Midnight with 20 to 24 px rounded corners and a soft coloured shadow, not a grey one.
- **Patterns:** subtle geometric patterns inspired by African textile prints, used at 5 to 8 percent opacity behind banners and empty states. Keep file size tiny (SVG).

### 3.4 Rules

- Body text must meet at least 4.5:1 contrast against its background (WCAG AA). Large text at least 3:1.
- Never rely on colour alone. Pair colour with an icon, label or shape (for example a tick plus green).
- Dark mode is a first-class theme: backgrounds #0F0D1F and #1A1733, text #F4F2FF. Save battery on OLED phones.
- Maximum two accent colours per screen apart from the subject colour.

## 4. Typography

| Role | Font | Notes |
| --- | --- | --- |
| Headings and brand | Sora or Poppins (bold, friendly, geometric) | Weights 600 and 700 only, subset to Latin to save data |
| Body and UI | Inter or Nunito | Weights 400 and 600, very readable on small screens |
| Formulas and code | JetBrains Mono | Chemical formulas, circuit values, accounting figures |
| Fallback | System sans-serif | Always declare, so text appears instantly on slow data |

| Style | Mobile size | Desktop size | Weight |
| --- | --- | --- | --- |
| Display (hero) | 34 px | 56 px | 700 |
| H1 | 26 px | 36 px | 700 |
| H2 | 21 px | 28 px | 600 |
| H3 | 18 px | 22 px | 600 |
| Body | 16 px | 17 px | 400 |
| Caption | 13 px | 14 px | 400 |
| Live stage text | 28 px minimum | 40 px minimum | 600 |

Line height 1.4 to 1.6 for body. Never go below 13 px. Chemical subscripts and units use proper typographic formatting.

## 5. Layout, Spacing and Shape

- **Mobile first.** Design for a 360 px wide Android phone, then scale up to tablet and desktop.
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48 px. Use only these.
- **Grid:** 4 columns on phone, 8 on tablet, 12 on desktop. Page gutters 16 px on phone.
- **Corners:** buttons 14 px, cards 20 px, sheets 28 px, avatars fully round.
- **Touch targets:** at least 48 by 48 px with 8 px between them.
- **Thumb zone:** primary actions and the apparatus tray sit in the bottom third of the phone screen.
- **Navigation:** bottom tab bar on phone (Home, Labs, Feed, Groups, Me). Left sidebar on desktop. Teachers get an extra Classes tab.
- **Elevation:** three levels only (flat, raised, floating) with coloured soft shadows.

## 6. Illustration, Icons and Mascot

- **Icons:** rounded, chunky, 2 px strokes, filled when active. One consistent set across the app.
- **Apparatus illustrations:** flat vector with a subtle highlight and glow. Beakers, flasks, funnels, bulbs and wires should look friendly and slightly glossy, not technical diagrams.
- **Mascot (working concept):** a small cheerful flask character with big eyes who reacts to the student's actions: cheers, gasps, wipes its forehead after a mistake. Used in onboarding, hints, empty states and celebrations. Final name and design to be tested with students.
- **Characters and photos:** show diverse African students and teachers in real classrooms and homes. Avoid stock images from other regions.
- **Format:** SVG and Lottie first. Photos only as WebP at small sizes.

## 7. Motion and Sound

Motion is what makes students fall in love, so it is part of the product, not decoration.

### 7.1 Motion principles

- **Purposeful:** every animation explains cause and effect or celebrates progress.
- **Quick:** 150 to 300 ms for UI, up to 600 ms for celebrations.
- **Springy:** use spring or ease-out curves so things feel alive. No linear motion.
- **Cheap:** animate transform and opacity only, keep 60 fps on low-end phones, Lottie files under 50 KB each.
- **Respectful:** honour the reduced-motion setting by replacing movement with simple fades.

### 7.2 Signature moments

| Moment | Motion |
| --- | --- |
| Dragging apparatus | Item lifts with a soft shadow, snaps into place with a small bounce and click sound |
| Pouring liquid | Smooth fluid fill with ripples and tiny bubbles |
| Heating | Gentle shimmer, rising vapour, flame that flickers |
| Circuit connects | Wire lights up as current flows, bulb warms from dim to bright |
| Correct step | Teal glow ring and a small confetti puff |
| Mistake | Cartoon-style harmless reaction (wobble, puff of smoke), then a friendly explanation card slides up |
| Level up or badge | Full-screen burst with Solar Yellow rays, mascot cheers, short fanfare |
| Streak | Flame grows each day and flickers on the home screen |
| Page transitions | Shared-element slide so the topic card grows into the topic page |
| Loading | Skeleton shimmer and a mini bubbling flask, never a blank screen |
| Pull to refresh | Flask fills as you pull |

### 7.3 Sound design

- Short, soft, satisfying sounds for snaps, pours, success and errors. Each under 30 KB.
- A clear mute toggle in every lab. Sound off by default in the feed and on first launch of the classroom stage.
- Every important sound has a visual twin (caption or icon) for students who cannot hear it.

## 8. Core Components

| Component | Style |
| --- | --- |
| Primary button | Lab Violet fill, white text, 14 px corners, press animation that sinks 2 px |
| Secondary button | Outline in Lab Violet, light fill on press |
| Reward button | Spark Orange to Solar Yellow gradient, used rarely for key actions such as Start Experiment |
| Cards | Topic cards show a subject-coloured top band, an illustration, progress ring and a Play button |
| Progress | Rounded bars and rings in Reaction Teal, animated when they update |
| Chips | Pill shape in subject colours for subjects, levels and terms |
| Badges | Hexagon or shield shapes with a soft metallic shine |
| Toasts | Slide from the top, friendly short text, auto dismiss after 3 seconds |
| Bottom sheets | For filters, comments, and apparatus info. Rounded 28 px top corners |
| Empty states | Mascot plus one friendly line plus one clear button |
| Skeletons | Shimmering shapes that match the real layout |
| Offline banner | Slim amber bar: You are offline. Your work is saved and will sync later. |

## 9. Page-by-Page Guidelines

### 9.1 Home page (public landing)

Goal: in 5 seconds, a visitor understands the product and wants to try it.

1. **Hero banner:** full-width Lab Violet to Teal gradient with textile pattern. Headline: Don't just read it. Do it. Sub-line: Mix, wire, build and test real experiments on your phone, even with low data. Two buttons: Start your first experiment (reward button) and I'm a teacher (outline). Right side: an animated scene of a flask pouring, a circuit lighting up and floating subject chips. On phones, the scene sits under the text.
2. **Instant demo strip:** a tiny playable experiment (drag one apparatus and see a reaction) right on the page, with no sign-up. This is the most persuasive element.
3. **How it works:** four animated steps with icons: Pick a topic, Watch it, Do it, Share it. Each step has a 3 second loop animation.
4. **Subjects carousel:** swipeable subject cards in their own colours.
5. **For teachers:** a section showing the classroom screen: play a lesson, run it live, grade with replay. Button: Open your teacher lab.
6. **Friends and groups:** a short look at the feed, groups and badges to show it is social.
7. **Works on any phone:** an offline and low-data message with a small animated signal icon.
8. **Voices:** short quotes and photos from real pilot students and teachers once available. No invented testimonials.
9. **FAQ and final call to action:** large gradient block with the mascot and a Start free button.
10. **Footer:** links, language switch, social links, © notice.

### 9.2 Sign up and onboarding

- Three quick screens: choose Student or Teacher, choose level and subjects, pick an avatar and username.
- Show the mascot guiding each step, with a progress dots indicator.
- Finish by dropping the student straight into a 60 second starter experiment, then show the dashboard.
- Teachers see a short verification step explained as getting the verified badge.

### 9.3 Student dashboard

- **Top:** greeting with avatar, streak flame and XP bar.
- **Continue card:** large card to resume the last experiment, with progress ring.
- **This week's scheme of work:** horizontal topic cards in subject colours.
- **Assignments due:** simple list with deadline chips and a clear Start button.
- **Friends and groups:** small avatars with activity dots.
- **Daily challenge:** a quick 2 minute practical with a reward.
- Motion: cards fade up in sequence, numbers count up, streak flame flickers.

### 9.4 Profile page

- A bold gradient cover and large avatar with level ring.
- Stats row: experiments done, streak, badges, friends.
- Badge shelf with shiny shapes, locked badges shown as soft silhouettes.
- Tabs: Activity, Badges, Groups, Classes.
- Teachers also show a verified badge, subjects taught and class count.
- Privacy toggles are easy to reach and clearly worded.

### 9.5 Feed page

- Clean card feed: friends' achievements, shared experiment results, group updates and teacher posts.
- Each experiment post shows a short looping preview of the result.
- Actions: cheer (a flask or bulb reaction instead of a plain like), comment, try this experiment.
- Safe by design: report and block are one tap away on every card.
- Stories-style row at the top for daily challenges and teacher announcements.

### 9.6 Student laboratory page

- **Workbench:** a clean canvas with a soft grid. The experiment area takes most of the screen.
- **Apparatus tray:** bottom of the screen, swipeable, big icons with names.
- **Coach bubble:** the mascot gives the next step, which the student can tap to hear or replay.
- **Top bar:** back, topic name, step counter, hint button, sound toggle.
- **Controls:** undo, reset, record (replay) indicator, and a Check my work button.
- **Feedback:** correct steps glow, mistakes show the friendly reaction and an explanation sheet.
- **Finish screen:** score, stars, what you learned in one line, then Share, Try again or Next topic.
- **Modes:** Guided (step by step) and Free explore, switched with a simple toggle.

### 9.7 Teacher laboratory page

- A more spacious workspace with a topic library on the side (a sheet on phones).
- Big mode switch: Auto-play or Live.
- Quick actions: Assign to class, Save to my lab, Share with a teacher.
- Class panel shows classes, codes and invite links with a one-tap copy and WhatsApp share button.
- A preview tab that shows exactly what students will see.

### 9.8 Live classroom stage

Built for a projector or TV in a bright classroom.

- **Stage theme:** Midnight background with high-contrast apparatus, and a bright option for sunny rooms.
- **Minimal chrome:** controls auto-hide after 3 seconds. Tap to bring them back.
- **Big everything:** text 28 px minimum, thick outlines, bold labels on every apparatus.
- **Playback bar:** large pause, rewind, slow motion and step buttons at the bottom.
- **Pointer:** a glowing laser-pointer dot that follows the finger or mouse.
- **Captions:** on by default, so the room understands even if the speakers are weak.
- **Question pause:** the teacher taps a button to freeze with a Predict what happens next? overlay.
- **Annotation tools** (highlight, label, draw) arrive in Phase 2.

### 9.9 Assignment, submission and grading

- Student view: a clear brief card, deadline chip, Start in lab button, and a Submit to teacher confirmation with a small celebration.
- Teacher grading view: the attempt replay is the hero element, with a scrubber timeline, markers for mistakes, a rubric panel and a feedback box.
- Status chips: Not started, In progress, Submitted, Graded, in colour plus icon.

### 9.10 Classes and groups

- Class page: big class code card with copy and share buttons, roster with avatars, and an Assign button.
- Group page: cover banner, member row, group challenges and a simple chat (Phase 2).
- Joining by code: a single big input with playful validation and a welcome animation.

### 9.11 Admin portal

Calm, clear and trustworthy. Different mood from the student app, but the same brand.

- **Look:** neutral Cloud and white surfaces, Lab Violet only for primary actions, subject colours only on subject tags. Compact spacing, data tables, and fewer animations.
- **Layout:** left sidebar (Dashboard, Curriculum, Content, Users, Moderation, Reviews, Announcements, Settings, Audit log), top bar with search and the signed-in staff role badge.
- **Curriculum screens:** tree view of Subject, Course, Level, Topic, Scheme of Work with drag to reorder, bulk import, and a side preview showing how it will look to students.
- **Review board:** columns for Draft, In review, Approved and Published with status chips and reviewer avatars.
- **Tables:** sticky headers, filters, saved views, row actions, and clear empty and error states.
- **Security cues:** an environment banner (for example PRODUCTION in red), MFA status indicator, confirmation dialogs that name the action, and a visible audit trail link on sensitive screens.
- **Data care:** personal fields masked by default with a reveal action that is logged.

## 10. Gamification Visuals

- **XP and levels:** a glowing progress bar and a level ring on the avatar.
- **Streak flame:** grows from a spark to a big flame over days, and has a friendly freeze option.
- **Badges:** themed sets such as Separation Specialist, Circuit Champion and Ledger Legend, with bronze, silver and gold shine.
- **Leaderboards:** friends and groups first, weekly reset, never shaming low ranks.
- **Celebrations:** short, joyful and skippable. Reserve the biggest bursts for real milestones.

## 11. Accessibility and Inclusion

- Contrast, touch size and text size rules from this guide are mandatory.
- Every sound has captions or a visual cue. Every animation has a reduced-motion version.
- Colour-blind safe: mistakes and success always use icons and labels as well as colour.
- Support screen readers for navigation, labels and results. Where drag and drop is hard, offer tap-to-select and tap-to-place as an alternative.
- Language switch visible on every main screen. Plan for English first, then Yoruba, Hausa, Igbo and Pidgin.
- Use simple icons and short sentences so younger and low-literacy users can follow.

## 12. Performance Budgets for Design

Beauty must be cheap. These limits apply to every design.

| Asset | Budget |
| --- | --- |
| Home page first load | Under 300 KB of critical assets, interactive in under 5 seconds on 3G or 4G |
| Each Lottie animation | Under 50 KB |
| Each sound effect | Under 30 KB |
| Each simulation bundle | Under 1.5 MB, loaded on demand and cached for offline |
| Images | WebP or SVG, lazy loaded, sized to the screen |
| Fonts | Two families, subset, with system fallback and font-display swap |
| Animation | Transform and opacity only, 60 fps on a mid-range Android phone |

Show skeletons and the mascot loader instead of spinners. Always show offline status clearly.

## 13. Design Tokens (starter)

```css
:root {
  --pl-primary: #6C4DF6;
  --pl-secondary: #FF8A3D;
  --pl-accent: #19D3C5;
  --pl-highlight: #FFC83D;
  --pl-success: #22C55E;
  --pl-danger: #FF5A5F;
  --pl-info: #3B82F6;
  --pl-ink: #14122B;
  --pl-midnight: #1E1B3A;
  --pl-slate: #5B5878;
  --pl-mist: #EDEBFA;
  --pl-cloud: #F7F6FF;
  --pl-radius-btn: 14px;
  --pl-radius-card: 20px;
  --pl-radius-sheet: 28px;
  --pl-space-1: 4px;
  --pl-space-2: 8px;
  --pl-space-3: 12px;
  --pl-space-4: 16px;
  --pl-space-5: 24px;
  --pl-space-6: 32px;
  --pl-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --pl-dur-fast: 150ms;
  --pl-dur-base: 250ms;
  --pl-dur-celebrate: 600ms;
  --pl-font-head: 'Sora', 'Poppins', system-ui, sans-serif;
  --pl-font-body: 'Inter', 'Nunito', system-ui, sans-serif;
  --pl-font-mono: 'JetBrains Mono', ui-monospace, monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    --pl-bg: #0F0D1F;
    --pl-surface: #1A1733;
    --pl-text: #F4F2FF;
  }
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## 14. Handoff and Quality Checks

- **Figma structure:** Foundations (colour, type, spacing, motion), Components, Patterns, Pages (one file per area: Public, Student, Teacher, Live, Admin).
- **Component library:** build once in React with the tokens above and document in a living style guide.
- **Animation handoff:** Lottie or CSS specs with duration, easing and trigger written beside each frame.
- **Design QA checklist before release:** contrast, touch size, reduced motion, offline state, empty and error states, low-end phone test, dark mode, and caption check for every sound.
- **Student testing:** test each key screen with real students and teachers on cheap phones before building at scale. The goal is simple: do they smile, and do they finish an experiment without help?

## 15. Next Design Steps

1. Approve the colour system, typography and mascot direction.
2. Design high-fidelity screens for the Home page, Student Lab, Teacher Lab and Live stage first.
3. Build a clickable prototype of the first experiment (for example filtration) to test the feel of drag, pour and snap.
4. Run usability sessions with 10 students and 5 teachers.
5. Finalise the component library and begin front-end build.

---

© Hezekiah Olawale Ojenike / MINDSET INFORMATION TECHNOLOGY LTD. Confidential design document for the project team.
