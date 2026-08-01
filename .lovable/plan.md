## What exists today

Vidya AI is a working front-end-only prototype: 10 routes (landing, classroom, tutor, lens, dashboard, exams, skills, wellness, stories, parents), a glassmorphism/neon-pink design system in `src/styles.css`, `AppShell` nav, `GlassCard`/`SectionHeader` primitives, Framer Motion animations everywhere, Recharts charts, and one live AI endpoint (`src/routes/api/chat.ts`) via the Lovable AI Gateway. There is **no backend, no database, no auth** — all data is hardcoded.

Everything below is additive. No page is redesigned, no animation or component removed; new screens reuse `AppShell`, `GlassCard`, and the existing tokens.

## Scope reality check

Your brief lists ~110 tables and 20 workstreams — that is several months of production work, not one pass. I'll build it in phases, each one shipping a working, testable app. I recommend approving Phase 1 + 2 now; later phases follow the same pattern.

---

## Phase 1 — Backend foundation + database design

Enable Lovable Cloud (Postgres + auth + storage + server functions), then apply a normalized (3NF) schema. I'll implement a consolidated **~40-table core** that covers every domain in your list without redundant near-duplicate tables (e.g. one `progress` table keyed by scope instead of separate Weekly/Monthly/Chapter tables; one `analytics_daily` rollup feeding weekly/monthly views).

Domains: profiles & preferences · parents & mapping · academic catalog (education_levels, grades, streams, subjects, chapters, lessons, topics) · learning (lesson_progress, weak/strong topics, streaks, study_plans) · AI (conversations, messages, memory, recommendations, doubts, lens_history) · exams (quizzes, questions, attempts, answers, results, analytics) · skills (roadmaps, career_paths, recommendations) · gamification (xp_history, badges, achievements) · notifications · analytics · audit (activity_logs, login_history).

Every table gets PK, FKs with cascade rules, CHECK constraints, defaults, indexes on all FK + query columns, RLS policies, and role separation via a `user_roles` table (student/parent/admin) — never roles on the profile table. Seed data for the academic catalog (Grades 1–10, Intermediate MPC/BiPC/MEC/CEC/HEC with real subject lists) ships in the migration.

Deliverable doc: `docs/DATABASE.md` with ER diagram (text), logical schema, data dictionary, constraints, normalization notes.

## Phase 2 — Authentication + profile + language

- Landing CTA: **Start Learning** → **Sign In** (signed in → **Profile**), session-aware.
- `/auth` — Sign In / Create Account, same premium glass + gradient + motion language.
- Registration: full name · education (School → Grade 1–10 | Intermediate → Year + Stream) · username · password · confirm.
- Username: Instagram rules (starts with letter, `a-z0-9._`, 4–30), live validation + debounced availability check against the DB (green available / red taken).
- Password: strength meter (weak/medium/strong), 8+ chars with upper/lower/number/special, show-hide, match check.
- Login: username + password, Remember Me, Forgot Password. Since usernames are the credential, sign-in resolves through a deterministic internal email derived server-side from the username (never exposing emails); recovery uses a phone/answer flow or an optional email the student adds in Profile.
- Route gate: `_authenticated` layout; protected pages redirect to `/auth`.
- `/profile` — photo (Cloud storage upload), name, username, education/grade/year/stream, phone, language, created date; edit username/phone/photo/language/privacy; Change Password.
- **Language system**: `LanguageProvider` + typed dictionaries for all 22 scheduled Indian languages + English, instant switching, persisted to the profile, and injected into every AI system prompt so AI replies/OCR/quizzes follow the chosen language.

## Phase 3 — Personalized AI

- AI Classroom becomes profile-aware: greets by name, loads only the student's syllabus (Grade 3 → Grade 3; MPC → Physics/Chemistry/Maths; MEC → Economics/Commerce/Maths), teaches turn-by-turn with questions, praise, corrections, tracks lesson/topic progress, writes `ai_memory`, resumes where the student left off, voice via Web Speech.
- AI Lens: camera + upload → multimodal Gemini OCR/solve, step-by-step in the chosen language, saved to `lens_history`.
- Doubt Solver: persisted conversations with full history + past-doubt recall, text/voice/image.
- Dashboard: all metrics from real tables (streak, completion %, study time, accuracy, strong/weak, XP, badges, charts, heatmap, AI recommendations, next lesson, upcoming exam).

## Phase 4 — Exams, Skills, Parents, Notifications

- Weekend exam generated from the week's taught topics; on submit → marks, rank, strengths/weaknesses, mistake review, AI revision plan.
- Skill Mentor recommendations strictly filtered by grade/stream (Grade 5 → typing/drawing/basic coding; MPC → Python/C++/IoT/JEE prep; MEC → accounting/finance/Excel).
- Parent dashboard bound to `parent_student_mapping` with real reports and AI feedback.
- Notifications: daily/revision/exam/streak/achievement, in-app + reminder schedules.

## Phase 5 — Hardening

Security (RLS review, rate limiting on auth + AI endpoints, input validation with Zod everywhere, secure cookies, security headers, audit logs), performance (code splitting, skeletons, optimistic UI, query caching, indexes), PWA + offline lesson caching, accessibility pass, per-route SEO metadata, and docs (`README`, API docs, architecture diagrams).

## Technical notes

Auth/DB/storage/server logic run on Lovable Cloud. Password hashing, JWT + refresh rotation, and secure cookies are handled by the managed auth service (bcrypt-equivalent) rather than hand-rolled — hand-rolling those is the security anti-pattern here. AI stays server-side through the Lovable AI Gateway; the API key is never exposed to the browser. Data access uses TanStack Start server functions with RLS enforced as the signed-in user; privileged operations (username availability, rank computation) run in server functions with narrow, verified access.

Automated tests cover username/password validators, auth flows, and progress/score calculations; end-to-end smoke tests run against the preview.
