# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

**MathUp** — a Hebrew (RTL) study platform for the Israeli bagrut, focused on **math 5-units** (שאלונים 581 + 582). Live production: <https://bagrut-app.vercel.app> (Vercel Hobby, auto-deploys on push to `main`).

Owner / site admin: **meitalm1020@gmail.com** (Itay). Non-technical, operates in Hebrew, male forms. Treat his direction as authoritative on product decisions. Communicate with him in Hebrew; leave code/errors in their original language; state per-request Anthropic cost up front before spending budget.

The product has evolved from an AI-question generator into a **static-first learning platform**: hundreds of hand-authored, mathematically-verified lessons/questions/solutions render with **zero API cost**. AI is now the *fallback*, not the engine.

---

## Hard constraints — do not violate

Breaking any of these wastes the owner's budget, breaks production, or corrupts content:

1. **Build + typecheck before every push.** `npx tsc --noEmit` **and** `npm run build` must pass. Push to `main` auto-deploys; the owner views the LIVE site (no local dev server), so **an edit isn't "done" until it's pushed**. Vercel Hobby runtime differs from `next dev` — the owner has lost money to deploys that passed local typecheck but failed in prod.
2. **Git: pathspec commits only — NEVER `git add .` / `-A`.** The repo carries parallel WIP. Run `git status` first. **Never touch / never stage:** `content/lessons/math5/statistics.ts`, `content/past-bagruyot/2020-summer-582.ts` (in-flight edits), and untracked dirs `.claude/`, `app/privacy/`, `app/terms/`, `app/topic-demo/`, `components/topic/`, `content/topics/`.
3. **Vercel Hobby caps serverless functions at 60s.** Every API route sets `export const maxDuration = 60`. Pair every model call with a `max_tokens` that fits inside 60s, or it returns nothing *and still bills Anthropic*.
4. **Anthropic budget is ~$5/month.** Don't ping-pong models during a bug hunt. Prefer the static-first / cache paths (below) that cost $0. Use prompt caching (`cache_control: ephemeral`) on large static system prompts.
5. **NEVER put Hebrew inside KaTeX** (`$...$`). KaTeX has no bidi → Hebrew renders reversed. Hebrew goes OUTSIDE the math; Latin subscripts only (`$m_1$`, not `$m_{משיק}$`). After any content edit run `npm run verify:content` — it must report 0 errors.
6. **Math conventions (5-unit bagrut):** complex numbers use **cis notation in degrees** (never `e^{iθ}`, never radians); parabola is **`y²=2px`**, focus `(p/2,0)`, directrix `x=−p/2` (NOT the American `4px`); ellipse `c²=a²−b²`. **Trigonometry is split** (owner's decision 2026-07-28): `trig-equations` and `special-angles-reduction` are in **degrees**; `trig-calculus` is in **radians** and must stay that way — `(sin x)' = cos x` holds only in radians, in degrees it is `(π/180)·cos x`. Don't read the complex-numbers "degrees" rule as applying to all trig — that misreading caused a wrong instruction once. Guarded by `scripts/verify-trig-angles.ts`; note `verify-trig.ts` hardcodes its own math and never reads the content, so it cannot catch a convention regression. Clean-stacked steps (one math result per array entry; Hebrew only as a short leading label). Zero step-skipping — show every algebraic line.
7. **IP boundary is firm.** NEVER ingest publisher solution books (יואל גבע, m-math.co.il, publisher PDFs) even if "free". Valid sources only: MOE bagrut PDFs (question text = public domain), MOE syllabus, own training knowledge for fresh authoring, or Itay's own handwritten solutions.
8. **Only two question types exist** (MCQ + open). The owner already rejected drag-drop / fill-blank / match / speed-drill — add MORE of the existing two, don't invent new ones.
9. **Never commit `.env.local`** (Anthropic key + Supabase publishable key). Only the RLS-safe `NEXT_PUBLIC_*` publishable key reaches the browser.
10. **Don't undo the polish:** framer-motion, sonner toasts, canvas-confetti, the KaTeX/RTL bidi handling in `MathText.tsx`, or the light theme.

---

## Design system — "premium white" (light theme)

The app is **light-only** (no dark mode, no toggle). Ivory canvas, indigo primary, gold reserved for achievements. Source of truth: `app/globals.css` `:root`.

- `--background #FDFDFB` (ivory) · `--surface-1 #FFFFFF` · `--surface-2 #F6F6F2` · `--foreground #0F172A`
- `--primary #4F46E5` (indigo-600) · `--primary-bright #6366F1` · `--primary-deep #4338CA` · `--accent #B8860B` (gold) · `--success #059669` · `--danger #DC2626`
- Utilities: `.surface-premium` (white card + ink shadow), `.btn-primary`, `.formula-surface`, `.result-box`, `.gradient-text`, `.chat-md` (Hebrew RTL + KaTeX). New UI uses Tailwind + these utilities. Text: `text-slate-800/900` on cards, `text-white` only on colored/gradient fills.
- **SVG diagrams** (in content + `components/practice/DiagramRenderer.tsx`) use a **dark-ink-on-light** palette: strokes `rgba(51,65,85,.85)`, labels `#0F172A`, accents indigo `#4F46E5` / emerald `#059669` / amber `#B45309` / pink `#DB2777`. NEVER light-on-dark values (`#f1f5f9`, `rgba(226,232,240,…)`) — they're invisible on white. Diagrams are `type:'custom'` raw SVG only — **never `fn:` closures** (they break the RSC server→client boundary).
- The `/quiz` page is a self-contained inline-`<style>` island with its own light `:root` vars.

---

## Monetization — "free base, Pro depth" (source of truth: `lib/access.ts`)

Decided 2026-07. **Learning is free; depth is Pro.** Guided lessons + drills are static (zero cost) and are the growth hook — do not gate them.

- **FREE (all topics):** guided learning + drills, quick quiz, insights + **grade prediction** (`lib/prediction.ts` — the upsell engine), formulas, photo-scan **library/cache matches**, chat capped at `FREE_DAILY_CHAT` (10/day).
- **PRO (`isFeaturePro` / `canUseFeature`):** the **advanced course** (bagrut-mastery, the premium anchor), past-bagrut **archive**, **simulation** (when built), **unlimited chat + AI-tutor buttons**, **new AI photo-solve**, advanced **analytics**. Chat Pro cap `PRO_DAILY_CHAT` (200).
- **Nothing in the learning path is locked** (owner, 2026-08-18: "שום דבר לא יהיה נעול במסלול למידה"). The old paywall (`canAccessTopic`), the /my-plan progress ramp (`topicLockReason`), the sequential unlock between sub-topic tiles (`nodeStatus`) and between ladder rungs (`levelStatus`) are all gone — status is only `COMPLETED`/`UNLOCKED`; the syllabus order is what the resume point and the "current" highlight recommend, never a gate. Don't reintroduce a lock as a "gentle ramp"; the tile/rung components still accept `LOCKED` only because `StepStatus` is shared.
- Pricing page `/pricing` (public): 3 plans, comparison table, anchor "חצי-שנתי = כמו שיעור פרטי אחד". All "שדרג" CTAs link there.
- **⚠️ There is NO real billing.** `isProUser` = admin email (`NEXT_PUBLIC_ADMIN_EMAIL`) or `user_metadata.pro` (never set). To sell, a payment provider is needed — recommend **Lemon Squeezy / Paddle** (merchant-of-record: handles Israeli VAT/invoicing, no עוסק needed at first, ₪ pricing). That's the owner's business decision; the gating structure is ready to wire.

---

## Content architecture — static-first (zero API cost)

Content is hand-authored TypeScript, verified, and rendered without any API call. **~829 fully-solved questions exist.**

```
content/
  bagrut-curriculum.ts        MATH5_CURRICULUM — topic weights, points, appearsIn (drives prediction)
  bagrut-context.ts           MATH5.* — exam structure + style guide (used by AI prompts)
  lessons/math5/*.ts          16 topics: subTopics[] with lesson[] (guided), questions[] (MCQ+open),
                              bagrutQuestions[] (multi-part, expected:AnswerSpec). Accessors in index.ts.
                              סדרות is split: sequences-arithmetic.ts / sequences-geometric.ts hold the 4+4
                              STAGE sub-topics (ar-*/ge-*) and are spread into sequences.ts (2026-08-19).
  tracks/                     study-track tree per שאלון (paper-571.ts authored). A topic may declare
                              `groups` (סדרות: חשבוניות / הנדסיות) — the topic page opens with a chooser.
  concept-quiz/types.ts       ConceptQuestion + ConceptLevel (1|2|3, the axis the STUDENT picks on /quiz)
  concept-quiz/index.ts       registry keyed `${subject}:${topic}` — NOT topic alone (math4 shares math5's
                              Hebrew topic names and not always byte-identically). getConceptQuestions /
                              hasConceptBank / conceptLevelCounts / conceptBankEntries.
  concept-quiz/math5/*.ts     14 topic files, filenames matching lessons/math5/*.ts. Target 6 questions per
                              (topic × level) = 252. Adding math4/math3 = one entry in the registry.
  learning-paths/math5/*.ts   "base course" — teach concepts from 0 (8 sections). STYLE_GUIDE.md is the bar.
  advanced-courses/math5/*.ts "advanced course" — bagrut MASTERY (7 sections: gate/patterns/techniques/
                              workedExams/examPractice/traps/simulation). Pro-gated. Registered in index.ts.
                              DONE: מרוכבים, מעריכית, ln, גאומטריה אנליטית. TODO: וקטורים, גדילה ודעיכה.
  past-bagruyot/*.ts          61 real past-exam questions (582 only), full worked solutions.
```

**Figures inside content** render wherever `MathText` renders in block mode (question text, bagrut `context`, solution steps, `teach`): a ```` ```probtree ```` fence → `components/practice/ProbTree.tsx` (probability tree), a ```` ```geo ```` fence → `components/practice/GeoFigure.tsx` (geometry sketch: points in math coords + segments/polygons/circles/angle arcs/right-angle/ticks/parallel/labels; spec + validator in `lib/geo-figure.ts`). A geo figure is a MODEL: `verify-content` checks every mark it makes (right angle, "50°", parallel, equal ticks, point on circle, lengths to one scale) against its own coordinates. Authoring contract + pipeline (`audit-solutions` → agents write JSON → `merge-solutions` → `apply-solutions`) is how גאומטריה got rule lines, line-by-line steps and figures in one pass (2026-08-23); reuse it for טריגונומטריה / אנליטית.

**Photo-scan ("answer library first, AI last"):** `/scan` → `lib/mathscan/pipeline.ts` → preprocess → local OCR → validate → verified bank (`lib/mathscan/match.ts`, character trigrams + IDF-weighted token overlap) → local CAS → and only then `/api/scan-solve` (vision/AI). The first five stages cost $0. `/api/solve-photo` was the PREVIOUS route and is **deleted** — do not resurrect it; `lib/solution-library.ts` `matchQuestion` and `lib/question-match.ts` survive only because `scripts/verify-match.ts` still exercises them.

**Client state is localStorage** (works without login, $0): `lib/results.ts` (answer log → insights, streak, prediction), `lib/study-plan.ts` (plan + `unitLevel` 3/4/5), `lib/progress.ts`, `lib/adaptive.ts` (difficulty by unit-level + self-level + live accuracy), `lib/scans.ts`.

**Verify scripts (run the REAL checker, don't trust authoring agents):** `scripts/verify-specs.ts` (runs `lib/answer-check.ts checkAnswer` on every `expected`), per-topic `verify-<topic>.ts`, `verify-match.ts`, `verify-prediction.ts`, `verify-advanced.ts` (point sums + reviewRef integrity), `check-katex-hebrew.ts`. **When bulk-authoring content, spawn one agent per file (topics = separate files → no write conflict), then verify INDEPENDENTLY yourself** — an agent's own verify is circular.

`lib/answer-check.ts`: deterministic mathjs grading. Natural log is `log` (mathjs `log` IS natural — write `expected` as `log(2)` not `ln(2)`); trig evaluates in RADIANS (so trig `expected` must be plain numbers/degrees, else `{kind:'manual'}`); `π` and `ln`/`\ln` are normalized.

---

## Key routes & global UI

| Area | Route / file | Notes |
|---|---|---|
| Landing | `/` (`app/page.tsx`) | Light theme, hero, 3 modes, pricing card → `/pricing` |
| Quick quiz | `/quiz` | Static bank first (adaptive by tier); mixed-exam mode; records to `lib/results` |
| Guided practice | `/practice/[subject]/[topic]` | LessonView. The `/sub/[subId]` routes are 13-line `redirect()`s into `/roadmap/[subId]` — the ladder is the single guided spine. |
| Base + advanced course | `/learn/[subject]/[topic]` + `/advanced` | CourseTracks card; advanced route is **Pro-gated** |
| AI tutor chat | `/chat` | Opens fresh each time; conversations sidebar; grounded per-topic; tier-capped |
| Photo solve | `/scan` | Intro screen + library/cache/AI flow with source badge |
| Past exams | `/bagruyot` + `/archive` | Pro-gated |
| Insights | `/insights` | Grade prediction hero, streak/goal, weakest sub-topics, share card |
| Pricing | `/pricing` | Public; free↔Pro comparison |
| Global profile | `components/AppChrome.tsx` | Floating avatar (initials) on every authed page → side drawer (name/email/plan/streak/unit-level/links/signout). Mounted once in `app/layout.tsx`. |
| Global search | `components/GlobalSearch.tsx` | Ctrl+K palette over topics/formulas/bagruyot |

Middleware (`lib/supabase/middleware.ts`): `PROTECTED_PREFIXES` = `/quiz /chat /history /learn`. Add a prefix there to protect a new route. `/pricing`, `/roadmap` and `/practice` are intentionally public — `/practice` only redirects into `/roadmap`, so an anonymous visitor following an old link must not hit a login wall. That also makes `/roadmap` and `/practice` the surfaces to use when verifying shared rendering without a login; `/quiz` cannot be checked that way.

---

## Supabase

Tables are created via SQL in the **dashboard** (not git migrations). Repo ships the SQL as reference: `supabase-conversations.sql`, `supabase-learning-path.sql`, `supabase-question-bank.sql`, `supabase-security-hardening.sql` (2026-08-19: usage log + `ai_calls_today()` + server-only bank writes + `bank_reports`), `supabase-teachers.sql` (the private-teacher layer), and comment blocks in `lib/solution-cache.ts` / `lib/agents/guard.ts`. **All app code degrades gracefully if a table is missing** (try/catch → feature just no-ops). RLS enforced on everything.

Existing/expected tables: `chat_messages` (+ `conversation_id`), `conversations`, `practice_sessions`, `question_pool`, `solution_cache`, `scan_log`, **`learning_state`** (cross-device sync — SQL in `supabase-learning-path.sql`; this list omitted it, so nothing ever told anyone to create it and every student may have been silently single-device), `ai_generation_log` (durable AI quotas for EVERY AI route — kinds `quiz/concept*/tutor/grade/teach/practice/chat/check` — + the global daily budget brake in `lib/agents/guard.ts`, which needs the `ai_calls_today()` SQL function from the comment block there; no delete policy on purpose, quotas are counted from it), `question_bank` + `bank_reports` (`supabase-question-bank.sql`), **`teacher_students` / `assignments` / `teacher_week_hours`** (the private-teacher layer — SQL in `supabase-teachers.sql`; without it `/teacher` loads with an empty roster and the student's assignment card silently renders nothing). ⚠️ Itay must run the SQL for a new table before its feature works live.

Clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (async — `cookies()` is async in Next.js 16), `lib/supabase/admin.ts` (service role, server-only, returns `null` without `SUPABASE_SERVICE_ROLE_KEY` — used ONLY to write the shared `question_bank`/`solution_cache`/`bank_reports`; those tables have no client write policies).

**Authorization rules (2026-08-19 audit):** Pro = `app_metadata.pro` (service-role-writable), never `user_metadata` (the user writes that himself). Every AI route goes through `guardAgentRequest` (or `requireProUser`, which wraps it) and logs with `logAgentUsage` after the model call — no route may rely on `lib/rate-limit.ts` alone (in-memory, per instance, IP-keyed burst shield only).

---

## Models (deliberate — don't swap without reason)

- `/api/chat` → grounded topics `claude-sonnet-4-6` (prompt-cached) + generic `claude-haiku-4-5`. Grounding from `lib/tutor-grounding.ts` (all 14 math5 topics). Env `TUTOR_SONNET_TOPICS` demotes to Haiku per-topic if cost climbs.
- `/api/scan-solve` → `claude-sonnet-4-5` vision (Hebrew+LaTeX transcription needs Sonnet); text-solve uses the full prompt with `cache_control: ephemeral`. Tutor chat on a scan: `/api/scan-tutor` (Haiku 4.5, SSE).
- `/api/practice` → `claude-sonnet-4-6`, the quick-exercise fallback for a topic with no static bank. Gated by `guardAgentRequest` (`kind: 'practice'`, 5/day free, 30 Pro) plus the GLOBAL daily ceiling in `lib/agents/guard.ts` — the only cap that makes the ~$5/month budget enforced rather than hoped for. Raise it with `AI_DAILY_GLOBAL_LIMIT`.
- Micro-endpoints (`why-wrong`/`hint-help`/`explain-simpler`) → Haiku + grounding, Pro-gated via `lib/ai-tutor.ts requireProUser`.
- Question-generation routes exist as a legacy fallback for topics without a static bank (math4/other subjects); math5 serves static.

## Commands

```bash
npm run dev            # local dev :3000  (owner does NOT run this — he sees prod)
npm run check          # THE pre-push gate: typecheck + verify:content + build
npm run build          # REQUIRED before push
npm run typecheck      # REQUIRED before push
npm run verify:content # content gate → must be 0 errors (--strict also fails on warnings)
npm run verify:concept # concept-quiz gate → inventory table per (topic × level) + contract checks
npm run verify:quiz    # the per-wave authoring gate: concept + mcq-distinct + distractors
```

**Reading a gate's output:** `0 problems` means "nothing I examined failed", not "the data is correct".
`verify-mcq-distinct` skips any option containing `=`, `<`, `>` or Hebrew — correct (those are
statements, not values) but it leaves **39% coverage on the concept bank, and 0% on אלגברה**. It now
prints per-topic coverage and names every question that got no machine check; that list is the
manual-review worklist. `verify-concept` checks SHAPE only and says so in its header — every
`correct` index still has to be re-derived by hand, independently of whoever authored it.
In `verify-concept.ts`, `PROMOTED_TO_ERROR` flips hint-coverage and per-level inventory from
warnings to errors; keep it `false` until the 252-question target is met, because a gate that
always fails gets bypassed within a day.

`npm run verify:content` (`scripts/verify-content.ts`) supersedes `check-katex-hebrew.ts`.
It imports the content modules rather than grepping source, so it can scope rules per
field — `'$= 4 - 3i$'` is fine in `solution.steps` and a defect in `keyPoints`.
**Errors:** hebrew-in-math, unbalanced `$`, `$$display$$` mid-prose-line.
**Warnings:** decorative emoji, keyPoints under 30 chars.

## Hebrew + math rendering

`components/practice/MathText.tsx`: react-markdown → remark-math → rehype-katex. Bidi handling in `app/globals.css` under `:is(.chat-md, .math-content)` — math gets `direction:ltr; unicode-bidi:isolate !important` so Hebrew doesn't reverse equations.

**The unscoped `.katex` floor above that block is deliberate — do not "clean up" the apparent duplicate.** Every scoped rule needs a `.chat-md`/`.math-content` ancestor, so a `MathText` rendered without one inherited `direction:rtl` from `<html dir="rtl">` and displayed the formula reversed. That is not hypothetical: 4 of the 12 call sites in `/quiz` had no wrapper class, all in the end-of-quiz mistake review, where every answer is pure math — students read their own wrong answer backwards. The floor is soft (two declarations, no `!important`, no font/colour/display) so the scoped block still wins and nothing about the look changes; it only removes the failure mode where *nothing* applies. Verified by knocking `direction` out at runtime: `ltr` → `rtl` → `ltr`.

**Never let a page keep its own copy of `MathText`.** `/quiz` did, and the copy stayed frozen at the pre-2026-07-28 behaviour (no `remarkGfm`; `inline` returned a bare fragment with no wrapper and no `dir`) while the shared component was hardened around it.

**MathText contract (2026-07-28 — do not regress):** both modes return **exactly one element** — `<span class="mathtext-inline">` / `<div class="mathtext-block">`, each `dir="rtl"`. Inline mode used to return a bare fragment, which let a `display:flex` caller turn every word and formula into its own flex item (the "לזכור" box rendered as 3 scrambled columns). Two consequences for new UI:
- A flex row containing `MathText` puts `chat-md` on an inner `<div className="chat-md flex-1 min-w-0">`, never on the flex container — every `.chat-md` rule is a descendant combinator.
- `dir="rtl"`, never `dir="auto"`: KaTeX emits the raw LaTeX in a clip-hidden `<annotation>`, so auto-detection reads a Latin first-strong-char and flips Hebrew lines that open with math.

Left-aligning a standalone equation is driven by the `.math-only` class MathText computes **from the source string** — CSS can't do it, because `:only-child` ignores text nodes and so matches Hebrew prose containing one formula. `.math-only` = **no Hebrew letters outside the math** (`'$a$ → $b$.'`, `'$x_1=2$, $x_2=3$'` qualify) and it sets `direction: ltr`, not just alignment: each `.katex` is already an LTR island, but the *order* of several islands and the side their punctuation lands on follow the paragraph direction, so inside the RTL `<p>` a chain rendered second-step-first with the arrow pointing backwards (2026-08-17). On Hebrew lines MathText also mirrors `→ ⇒ ⟹` outside math to `← ⇐ ⟸` — Unicode mirrors brackets in RTL but not arrows, so `'חיתוך → קיצון'` pointed back at its source. Author `→` in reading order; never hand-write `←` to compensate.

Automated checks validate that LaTeX *parses*, NOT that math is *right* — always re-derive numbers by hand (a wrong-but-valid angle like `\cos(545°)` passes the build).

## Environment variables

```
ANTHROPIC_API_KEY=<console.anthropic.com>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_ADMIN_EMAIL=meitalm1020@gmail.com   # comma-separated; grants Pro/admin.
                                    # MUST be NEXT_PUBLIC_ — lib/access.ts runs on BOTH sides,
                                    # and without it every client-side Pro gate reads false for
                                    # everyone, the owner included. The address is already public
                                    # in /accessibility, /privacy and /terms. `ADMIN_EMAIL` is
                                    # still read as a fallback; drop it once Vercel has the new one.
SUPABASE_SERVICE_ROLE_KEY=<Supabase → Settings → API → service_role>   # SERVER ONLY, never NEXT_PUBLIC_.
                                    # Required in Vercel too: lib/supabase/admin.ts writes the shared
                                    # question_bank/solution_cache with it. Missing → writes are
                                    # skipped (warned once), nothing crashes.
TUTOR_SONNET_TOPICS=                 # optional cost valve (comma-separated topic names)
```

`next.config.ts` ships a strict CSP (`self` + `*.supabase.co`). Adding an external service (payment provider, Resend, etc.) requires updating `connect-src`/`script-src` or it silently breaks in prod.
