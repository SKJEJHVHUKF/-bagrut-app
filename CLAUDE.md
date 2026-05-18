# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

**בגרות בכיס** — Hebrew bagrut (Israeli matriculation exam) practice tool.
Live production: <https://bagrut-app.vercel.app>.

Owner / site admin: **meitalm1020@gmail.com**. Treat their direction as authoritative on product decisions.

---

## Project status (as of 2026-05-18)

### Features completed ✅

| Feature | Route | Notes |
|---|---|---|
| Landing page | `/` | Dark glassmorphism, Tailwind, 7 subjects grid, FAQ, pricing |
| Quiz — 5 MCQ | `/quiz` | Picks subject + topic → 5 AI questions with 4-section explanations |
| Guided practice | `/practice` | 1 deep exercise with 3 progressive hints + step-by-step solution |
| AI tutor chat | `/chat` | Haiku 4.5, persists history to Supabase, 20-message daily quota |
| Chat history | `/history` | Reads `chat_messages` from Supabase, time-ago in Hebrew |
| Authentication | `/login` `/signup` | Supabase email/password, OAuth callback, protected-route middleware |
| Rate limiting | `lib/rate-limit.ts` | In-memory, per-fingerprint + global circuit breaker |
| Security hardening | all API routes | Origin check, bot UA filter, honeypot field, prompt-injection blacklist |
| Math rendering | global | react-markdown + remark-math + rehype-katex; bidi fix in globals.css |
| PWA manifest + icons | `/manifest.ts` `apple-icon.tsx` | installable |

### Known bugs / open issues 🐛

1. **`correct` index mismatch** — Sonnet 4.6 with structured outputs occasionally marks an answer index that doesn't match the explanation. Fix: add a post-generation validator in `app/api/questions/route.ts` that checks `parsed.questions[i].answers[parsed.questions[i].correct]` matches what `why_correct` describes; retry once on mismatch.
2. **Practice page requires login** — `/api/practice` returns 401 to logged-out users but the UI doesn't surface a friendly message; user sees a spinner or vague error.

### Next steps 🚀

1. **Fix the `correct` index bug** — validator + one retry in `app/api/questions/route.ts`. Highest priority; directly harms learning.
2. **Practice page login wall** — show a clear "יש להתחבר כדי לתרגל" message when the 401 comes back, with a link to `/login`.
3. **Quiz history** — save quiz attempts (subject, topic, score, timestamp) to a new `quiz_attempts` Supabase table; surface them in `/history`.
4. **Question pool** — pre-generate questions per topic into Supabase, serve random rows. Cuts per-session cost from ~$0.04 to ~$0.001.
5. **Pro tier / waitlist** — the landing page already shows a "בקרוב" Pro card; wiring up an email waitlist (Resend or simple Supabase insert) would capture interest.

---

## Commands

```bash
npm run dev      # local dev on :3000
npm run build    # production build (also a smoke test before pushing)
npm run start    # serve a built app
npm run lint     # ESLint via eslint.config.mjs
```

There are no tests. Before pushing changes that touch routes or middleware, always run `npm run build` — the user has lost real money to deploys that failed in production after passing local typecheck because Vercel's Hobby plan has different runtime constraints than `next dev`.

## Hard constraints — do not violate

These are not preferences. Breaking any of these wastes the user's budget or breaks production:

1. **Vercel Hobby caps serverless functions at 60s.** Every API route uses `export const maxDuration = 60`. Generation prompts that overrun this cap return no response *and* still bill the Anthropic API. Always pair model choice with a `max_tokens` value that fits inside 60s.
2. **Anthropic budget is $5/month.** Every model swap during debugging costs real money on failed calls. Pick the model once, prove it works, move on. Do **not** ping-pong between Haiku and Sonnet during a single bug hunt.
3. **Model assignments are deliberate** — don't swap them without a reason worth explaining:
   - `app/api/questions/route.ts` → `claude-sonnet-4-6` (`max_tokens: ~3500`). Bagrut question quality requires Sonnet; Haiku produces math errors and rambling explanations.
   - `app/api/chat/route.ts` → `claude-haiku-4-5` (`max_tokens: 800`). Chat replies are short and conversational; Haiku is fine and ~3× cheaper.
4. **Structured outputs are mandatory** in `/api/questions`. Free-form JSON generation in Hebrew breaks on unescaped quotes inside strings. The route passes `output_config.format` with an explicit `json_schema` so the API guarantees parseable JSON.
5. **Never commit `.env.local`.** It contains the Anthropic key and Supabase publishable key.

## Architecture

### Routing layout (Next.js 16 App Router)

```
app/
  page.tsx              landing (Tailwind, dark-mode glassmorphism)
  quiz/page.tsx         the quiz UI (inline <style>, not Tailwind)
  chat/page.tsx         AI tutor chat (Tailwind + react-markdown + KaTeX)
  login/, signup/       auth forms

  api/
    questions/route.ts  generates 5 quiz questions with 4-section explanations
    chat/route.ts       single-turn chat reply, persists to Supabase
  auth/
    callback/route.ts   Supabase OAuth/email-confirm callback
    signout/route.ts    sign-out, redirects to /
```

The **quiz page** is the one outlier: it uses an inline `<style>` block instead of Tailwind, because it predates the chat UI and the styles are fine. New pages should use Tailwind to match `app/page.tsx` and `app/login/page.tsx`.

### Auth + protected routes

- Supabase auth (email/password). Browser client at `lib/supabase/client.ts`; server client at `lib/supabase/server.ts` (async — `cookies()` is async in Next.js 16).
- `middleware.ts` runs `updateSession` from `lib/supabase/middleware.ts` on every non-static request. That helper refreshes the auth cookie *and* enforces route gating: anonymous users hitting any path in `PROTECTED_PREFIXES` get redirected to `/login?next=<original>`. Public paths (`/`, `/login`, `/signup`, `/auth/*`, icons, manifest, `_next`) skip the check.
- To add a new protected route: append its prefix to `PROTECTED_PREFIXES` in `lib/supabase/middleware.ts`. No other change needed.

### Supabase schema

Tables live in the Supabase dashboard, not in git. Current schema:

```sql
-- chat history (live)
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  tokens_in   int default 0,
  tokens_out  int default 0,
  created_at  timestamptz not null default now()
);
create index chat_messages_user_recent_idx on public.chat_messages (user_id, created_at desc);
alter table public.chat_messages enable row level security;
create policy "users read own messages" on public.chat_messages
  for select using (auth.uid() = user_id);
create policy "users insert own messages" on public.chat_messages
  for insert with check (auth.uid() = user_id);
```

RLS is enforced — every query from the client uses the user's JWT, so users can only ever see their own rows. Don't bypass RLS via service-role calls without a specific reason.

### Rate limiting

`lib/rate-limit.ts` is in-memory and runs at the edge of every protected API route. It fingerprints by IP + UA hash + a global circuit-breaker (200 req/min site-wide).

- Per-fingerprint limit is **per serverless instance** — Vercel can spin up multiple instances under load, so the limit is approximate. Good enough for hobby/free traffic.
- The chat route adds a **daily quota** on top: counts rows in `chat_messages` since UTC midnight, currently 20 user-messages/day. Defined inline in `app/api/chat/route.ts`.

### Hebrew + math rendering

The quiz and chat both render Hebrew (RTL) prose mixed with LTR math. Non-obvious bits:

- Markdown + LaTeX pipeline: `react-markdown` → `remark-math` → `rehype-katex`. KaTeX CSS is imported once via `import 'katex/dist/katex.min.css'`.
- Bidi handling lives in `app/globals.css` under `:is(.chat-md, .math-content)`. Math elements get `direction: ltr; unicode-bidi: isolate;` so the surrounding Hebrew doesn't reverse equation order. Without `isolate`, "f(x) = ln(3x)" reads back as "ln(3x) = f(x)".
- The system/tutor prompt instructs the model to emit `$...$` (inline math) and `$$...$$` (block math). For the chat route, the prompt explicitly enumerates allowed Markdown.

### Known model behaviors and outstanding bugs

- **Top open bug:** Sonnet 4.6 + structured outputs occasionally returns a `correct` index that doesn't match the explanation. The right fix is a post-generation validator that re-reads `explanations[correct].why_correct` and verifies it matches `answers[correct]`, retrying once on mismatch.
- Haiku for chat is fine in Hebrew for conversational tutoring but unreliable for *generating* math problems. Don't drop chat below Haiku 4.5.
- Each `/api/questions` call is fresh — there is no question cache (an earlier localStorage cache was removed because it served identical questions on every re-attempt). The next planned optimization is pre-generating a pool of questions per topic into Supabase and serving random rows — would drop per-session cost from ~$0.05 to ~$0.001.

### CSP

`next.config.ts` ships strict security headers including a CSP that allows `self` plus `*.supabase.co` for REST and websocket. If you add a new external service (Stripe, Resend, etc.), update the relevant directive (`connect-src` for APIs, `script-src` for hosted JS) or it will silently break in production.

## Environment variables

Required in `.env.local` for local dev, and in Vercel project settings for production:

```
ANTHROPIC_API_KEY=<from console.anthropic.com>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`NEXT_PUBLIC_*` is sent to the browser by Next.js — only the publishable (RLS-safe) Supabase key goes there, never the service-role key.

## Communicating with the owner

The owner is non-technical and operates in Hebrew. When you need to ask a question, ask in Hebrew. When showing console output, error messages, or code, leave those in their original language. When proposing a change that costs Anthropic credit, state the per-request cost up front so the owner can decide before you spend the budget.
