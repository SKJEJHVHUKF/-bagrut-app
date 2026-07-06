# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

**בגרות בכיס** — a Hebrew (RTL) study platform for the Israeli bagrut, focused on **math 5-units** (שאלונים 581 + 582). Live production: <https://bagrut-app.vercel.app> (Vercel Hobby, auto-deploys on push to `main`).

Owner / site admin: **meitalm1020@gmail.com** (Itay). Non-technical, operates in Hebrew, male forms. Treat his direction as authoritative on product decisions. Communicate with him in Hebrew; leave code/errors in their original language; state per-request Anthropic cost up front before spending budget.

The product has evolved from an AI-question generator into a **static-first learning platform**: hundreds of hand-authored, mathematically-verified lessons/questions/solutions render with **zero API cost**. AI is now the *fallback*, not the engine.

---

## Hard constraints — do not violate

Breaking any of these wastes the owner's budget, breaks production, or corrupts content:

1. **Build + typecheck before every push.** `npx tsc --noEmit` **and** `npm run build` must pass. Push to `main` auto-deploys; the owner views the LIVE site (no local dev server), so **an edit isn't "done" until it's pushed**. Vercel Hobby runtime differs from `next dev` — the owner has lost money to deploys that passed local typecheck but failed in prod.
2. **Git: pathspec commits only — NEVER `git add .` / `-A`.** The repo carries parallel WIP. Run `git status` first. **Never touch / never stage:** `content/lessons/math5/statistics.ts`, `content/past-bagruyot/2020-summer-582.ts` (in-flight edits), and untracked dirs `.claude/`, `app/privacy/`, `app/terms/`, `app/topic-demo/`, `components/topic/`, `content/topics/`.
3. **Vercel Hobby caps serverless functions at 60s.** Every API route sets `export const maxDuration = 60`. Pair every model call with a `max_tokens` that fits inside 60s, or it returns nothing *and still bills Anthropic*.
4. **Anthropic budget is ~$5/month.** Don't ping-pong models during a bug hunt. Prefer the static-first / cache paths (below) that cost $0. Use prompt caching (`cache_control: ephemeral`) on large static system prompts.
5. **NEVER put Hebrew inside KaTeX** (`$...$`). KaTeX has no bidi → Hebrew renders reversed. Hebrew goes OUTSIDE the math; Latin subscripts only (`$m_1$`, not `$m_{משיק}$`). After any content edit run `npx tsx scripts/check-katex-hebrew.ts` — it must report 0.
6. **Math conventions (5-unit bagrut):** complex numbers use **cis notation in degrees** (never `e^{iθ}`, never radians); parabola is **`y²=2px`**, focus `(p/2,0)`, directrix `x=−p/2` (NOT the American `4px`); ellipse `c²=a²−b²`. Clean-stacked steps (one math result per array entry; Hebrew only as a short leading label). Zero step-skipping — show every algebraic line.
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
- **`canAccessTopic` no longer paywalls topics** — the old "free = first topic only" was removed. `topicLockReason` is now purely pedagogical (`'open'`/`'locked-progress'`).
- Pricing page `/pricing` (public): 3 plans, comparison table, anchor "חצי-שנתי = כמו שיעור פרטי אחד". All "שדרג" CTAs link there.
- **⚠️ There is NO real billing.** `isProUser` = admin email (`ADMIN_EMAIL`) or `user_metadata.pro` (never set). To sell, a payment provider is needed — recommend **Lemon Squeezy / Paddle** (merchant-of-record: handles Israeli VAT/invoicing, no עוסק needed at first, ₪ pricing). That's the owner's business decision; the gating structure is ready to wire.

---

## Content architecture — static-first (zero API cost)

Content is hand-authored TypeScript, verified, and rendered without any API call. **~829 fully-solved questions exist.**

```
content/
  bagrut-curriculum.ts        MATH5_CURRICULUM — topic weights, points, appearsIn (drives prediction)
  bagrut-context.ts           MATH5.* — exam structure + style guide (used by AI prompts)
  lessons/math5/*.ts          16 topics: subTopics[] with lesson[] (guided), questions[] (MCQ+open),
                              bagrutQuestions[] (multi-part, expected:AnswerSpec). Accessors in index.ts.
  learning-paths/math5/*.ts   "base course" — teach concepts from 0 (8 sections). STYLE_GUIDE.md is the bar.
  advanced-courses/math5/*.ts "advanced course" — bagrut MASTERY (7 sections: gate/patterns/techniques/
                              workedExams/examPractice/traps/simulation). Pro-gated. Registered in index.ts.
                              DONE: מרוכבים, מעריכית, ln, גאומטריה אנליטית. TODO: וקטורים, גדילה ודעיכה.
  past-bagruyot/*.ts          61 real past-exam questions (582 only), full worked solutions.
```

**Photo-scan caching ("answer library first, AI last"):** `/api/solve-photo` → cheap Sonnet-vision transcription → `lib/solution-library.ts` `matchQuestion` (exact hash + Jaccard fuzzy ≥0.82 over all static questions, FREE) → Supabase `solution_cache` (FREE) → only a true miss calls the AI text-solve (Pro), whose result is written back to the cache. `lib/question-match.ts` = normalize/fingerprint/jaccard.

**Client state is localStorage** (works without login, $0): `lib/results.ts` (answer log → insights, streak, prediction), `lib/study-plan.ts` (plan + `unitLevel` 3/4/5), `lib/progress.ts`, `lib/adaptive.ts` (difficulty by unit-level + self-level + live accuracy), `lib/scans.ts`.

**Verify scripts (run the REAL checker, don't trust authoring agents):** `scripts/verify-specs.ts` (runs `lib/answer-check.ts checkAnswer` on every `expected`), per-topic `verify-<topic>.ts`, `verify-match.ts`, `verify-prediction.ts`, `verify-advanced.ts` (point sums + reviewRef integrity), `check-katex-hebrew.ts`. **When bulk-authoring content, spawn one agent per file (topics = separate files → no write conflict), then verify INDEPENDENTLY yourself** — an agent's own verify is circular.

`lib/answer-check.ts`: deterministic mathjs grading. Natural log is `log` (mathjs `log` IS natural — write `expected` as `log(2)` not `ln(2)`); trig evaluates in RADIANS (so trig `expected` must be plain numbers/degrees, else `{kind:'manual'}`); `π` and `ln`/`\ln` are normalized.

---

## Key routes & global UI

| Area | Route / file | Notes |
|---|---|---|
| Landing | `/` (`app/page.tsx`) | Light theme, hero, 3 modes, pricing card → `/pricing` |
| Quick quiz | `/quiz` | Static bank first (adaptive by tier); mixed-exam mode; records to `lib/results` |
| Guided practice | `/practice/[subject]/[topic]` + `/sub/[subId]` | LessonView + SubTopicPractice; adaptive ordering |
| Base + advanced course | `/learn/[subject]/[topic]` + `/advanced` | CourseTracks card; advanced route is **Pro-gated** |
| AI tutor chat | `/chat` | Opens fresh each time; conversations sidebar; grounded per-topic; tier-capped |
| Photo solve | `/scan` | Intro screen + library/cache/AI flow with source badge |
| Past exams | `/bagruyot` + `/archive` | Pro-gated |
| Insights | `/insights` | Grade prediction hero, streak/goal, weakest sub-topics, share card |
| Pricing | `/pricing` | Public; free↔Pro comparison |
| Global profile | `components/AppChrome.tsx` | Floating avatar (initials) on every authed page → side drawer (name/email/plan/streak/unit-level/links/signout). Mounted once in `app/layout.tsx`. |
| Global search | `components/GlobalSearch.tsx` | Ctrl+K palette over topics/formulas/bagruyot |

Middleware (`lib/supabase/middleware.ts`): `PROTECTED_PREFIXES` = `/quiz /chat /history /practice /learn`. Add a prefix there to protect a new route. `/pricing` is intentionally public.

---

## Supabase

Tables are created via SQL in the **dashboard** (not git migrations). Repo ships the SQL as reference: `supabase-conversations.sql`, and comment blocks in `lib/solution-cache.ts`. **All app code degrades gracefully if a table is missing** (try/catch → feature just no-ops). RLS enforced on everything.

Existing/expected tables: `chat_messages` (+ `conversation_id`), `conversations`, `practice_sessions`, `question_pool`, `solution_cache`, `scan_log`. ⚠️ Itay must run the SQL for a new table before its feature works live.

Clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (async — `cookies()` is async in Next.js 16).

---

## Models (deliberate — don't swap without reason)

- `/api/chat` → grounded topics `claude-sonnet-4-6` (prompt-cached) + generic `claude-haiku-4-5`. Grounding from `lib/tutor-grounding.ts` (all 14 math5 topics). Env `TUTOR_SONNET_TOPICS` demotes to Haiku per-topic if cost climbs.
- `/api/solve-photo` → `claude-sonnet-4-5` vision (Hebrew+LaTeX transcription needs Sonnet); text-solve uses the full prompt with `cache_control: ephemeral`.
- Micro-endpoints (`why-wrong`/`hint-help`/`explain-simpler`) → Haiku + grounding, Pro-gated via `lib/ai-tutor.ts requireProUser`.
- Question-generation routes exist as a legacy fallback for topics without a static bank (math4/other subjects); math5 serves static.

## Commands

```bash
npm run dev            # local dev :3000  (owner does NOT run this — he sees prod)
npm run build          # REQUIRED before push
npx tsc --noEmit       # REQUIRED before push
npx tsx scripts/check-katex-hebrew.ts   # after any content edit → must be 0
```

## Hebrew + math rendering

`components/practice/MathText.tsx`: react-markdown → remark-math → rehype-katex, `dir="auto"` per block. Bidi handling in `app/globals.css` under `:is(.chat-md, .math-content)` — math gets `direction:ltr; unicode-bidi:isolate !important` so Hebrew doesn't reverse equations. Automated checks validate that LaTeX *parses*, NOT that math is *right* — always re-derive numbers by hand (a wrong-but-valid angle like `\cos(545°)` passes the build).

## Environment variables

```
ANTHROPIC_API_KEY=<console.anthropic.com>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ADMIN_EMAIL=meitalm1020@gmail.com   # comma-separated; grants Pro/admin
TUTOR_SONNET_TOPICS=                 # optional cost valve (comma-separated topic names)
```

`next.config.ts` ships a strict CSP (`self` + `*.supabase.co`). Adding an external service (payment provider, Resend, etc.) requires updating `connect-src`/`script-src` or it silently breaks in prod.
