import Anthropic from '@anthropic-ai/sdk';
import { checkGlobalBudget } from '@/lib/agents/guard';
import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { serveFromPool } from '@/lib/question-pool';
import { buildConceptPrompt, conceptPoolKind } from '@/lib/concept-prompt';
import { normalizeUnitLevel, GENERATOR_MODEL, GENERATOR_MAX_TOKENS } from '@/lib/agents/config';
import type { ConceptLevel } from '@/content/concept-quiz/types';
import { generateJSON } from '@/lib/anthropic-json';
import { isProUser, FREE_DAILY_AI_QUIZ, PRO_DAILY_AI_QUIZ } from '@/lib/access';

// Vercel Hobby plan defaults serverless functions to a 10-second timeout —
// not enough for a Sonnet 4.6 generation with rich explanations (typically
// 15-25s). Bump to the Hobby plan max of 60s. The model usually finishes
// well under this; the ceiling just prevents the platform from killing
// the request mid-flight.
export const maxDuration = 60;

const SUBJECTS: Record<string, {
  name: string;
  buildPrompt: (topic: string) => string;
}> = {
  math5: {
    name: 'מתמטיקה 5 יח׳',
    buildPrompt: (t) =>
      `אתה מורה פרטי מומחה למתמטיקה ברמת 5 יחידות לבגרות בישראל (שאלון 581/582, תכנית הלימודים המעודכנת).
התלמיד שלך מתכונן לבגרות. צור 5 שאלות בגרות אמיתיות וברמה גבוהה בנושא: ${t}.
השאלות צריכות לדמות שאלות שמופיעות בבגרויות עדכניות — אתגריות אבל הוגנות,
ולכלול חישובים, ניתוח גרפי או הוכחה לפי הצורך.`,
  },
  math4: {
    name: 'מתמטיקה 4 יח׳',
    buildPrompt: (t) =>
      `אתה מורה פרטי מומחה למתמטיקה ברמת 4 יחידות לבגרות בישראל (שאלון 481/482, תכנית הלימודים המעודכנת).
התלמיד שלך מתכונן לבגרות. צור 5 שאלות בגרות אמיתיות וברמה הולמת ל-4 יחידות בנושא: ${t}.
הקפד שהשאלות יהיו ברמה של 4 יחידות (לא 5) — מאתגרות אבל לא יותר מדי מתקדמות.
התמקד בחומר שלומדים בפועל ב-4 יחידות, וכלול חישובים מפורטים בשלבים.`,
  },
  physics: {
    name: 'פיזיקה',
    buildPrompt: (t) => `אתה מורה לפיזיקה 5 יחידות לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`
  },
  english: {
    name: 'אנגלית',
    buildPrompt: (t) => `You are an English Bagrut teacher (5 units) for Israeli students. Create 5 Bagrut-level questions about: ${t}. Questions and answers in English.`
  },
  history: {
    name: 'היסטוריה',
    buildPrompt: (t) => `אתה מורה להיסטוריה לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`
  },
  bible: {
    name: 'תנ"ך',
    buildPrompt: (t) => `אתה מורה לתנ"ך לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}. כלול שאלות על פסוקים, עלילה ומסרים.`
  },
  chem: {
    name: 'כימיה',
    buildPrompt: (t) => `אתה מורה לכימיה 5 יחידות לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`
  }
};

// The concept-quiz prompt lives in lib/concept-prompt.ts — it used to be
// duplicated here and in scripts/generate-pool.ts, which is a standing
// invitation to drift. Both import it now.

// ===== SECURITY CONSTANTS =====
const MAX_TOPIC_LENGTH = 80;
const MIN_TOPIC_LENGTH = 2;
// Strip control chars + common prompt-injection markers (case-insensitive)
const TOPIC_BLACKLIST = /[\x00-\x1f\x7f<>{}[\]\\]|ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|disregard\s+(all\s+)?(previous|prior|above)|system\s*:|assistant\s*:|user\s*:|<\s*\/?\s*(script|iframe|object|embed)/i;

/** UTC midnight as the daily-quota reset boundary (matches /api/chat). */
function utcDayStartIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Validate that the request comes from our own site (same-origin).
 * Rejects requests from other domains, curl, postman, etc.
 */
function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  // Same-origin check - browser always sends Origin for fetch from a page
  if (!origin || !host) return false;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    return originHost === host.toLowerCase();
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // ===== 1. ORIGIN VALIDATION (block cross-site / API tools) =====
    if (!isAllowedOrigin(request)) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // ===== 2. BOT DETECTION via User-Agent =====
    if (looksLikeBot(request)) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // ===== 3. RATE LIMITING with fingerprinting =====
    const fingerprint = getFingerprint(request);
    const limit = checkRateLimit(fingerprint);
    if (!limit.allowed) {
      const msg =
        limit.reason === 'minute'
          ? 'יותר מדי בקשות. נסה שוב בעוד דקה.'
          : limit.reason === 'hour'
          ? 'הגעת למכסת השעה. נסה שוב בעוד שעה.'
          : 'המערכת עמוסה כרגע. נסה שוב בעוד דקה.';
      return Response.json(
        { error: msg },
        {
          status: 429,
          headers: {
            'Retry-After': String(limit.retryAfterSeconds),
          },
        }
      );
    }

    // ===== 3. CONTENT-TYPE CHECK =====
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json(
        { error: 'Invalid content type' },
        { status: 415 }
      );
    }

    // ===== 4. PARSE & VALIDATE BODY =====
    let body: {
      subject?: unknown;
      topic?: unknown;
      mode?: unknown;
      website?: unknown;
      level?: unknown;
      unitLevel?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Honeypot: a hidden field that real users never set. Bots that
    // blindly POST common form fields will trip this and get blocked.
    if (body.website !== undefined && body.website !== '') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    // 'concept' = the quick-concepts quiz (theory/rules); 'quiz' = the legacy
    // bagrut-style generation. Each has its own pool bucket + system prompt.
    const mode: 'quiz' | 'concept' = body.mode === 'concept' ? 'concept' : 'quiz';
    // The concept level the student picked (1/2/3). null = an older cached
    // client that predates the picker; buildConceptPrompt then emits its
    // original level-less text, so nothing regresses for them.
    const conceptLevel: ConceptLevel | null =
      body.level === 1 || body.level === 2 || body.level === 3 ? body.level : null;
    // Reuse the agents-layer normaliser rather than adding a third copy; it also
    // migrates a legacy value instead of throwing.
    const unitLevel = normalizeUnitLevel(body.unitLevel);
    // Pool bucket. MUST carry the level, or a level-3 request gets handed a row
    // generated for level 1.
    const poolKind = mode === 'concept' ? conceptPoolKind(conceptLevel) : mode;

    if (!subject || !topic) {
      return Response.json(
        { error: 'Missing subject or topic' },
        { status: 400 }
      );
    }

    // Subject must be in the closed allow-list
    if (!SUBJECTS[subject]) {
      return Response.json(
        { error: 'Invalid subject' },
        { status: 400 }
      );
    }

    // Topic length validation
    if (topic.length < MIN_TOPIC_LENGTH || topic.length > MAX_TOPIC_LENGTH) {
      return Response.json(
        { error: `Topic length must be between ${MIN_TOPIC_LENGTH} and ${MAX_TOPIC_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Topic content validation (block injection attempts)
    if (TOPIC_BLACKLIST.test(topic)) {
      return Response.json(
        { error: 'Invalid topic' },
        { status: 400 }
      );
    }

    // ===== AUTH — every other AI route requires a session; this one didn't =====
    // Without it, anything that sets a matching Origin + browser UA can burn
    // ~$0.04 Sonnet generations, guarded only by an in-memory rate limiter
    // that resets on every Vercel cold start. Close it.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'יש להתחבר' }, { status: 401 });
    }

    // ===== POOL CHECK — try the pre-generated question pool first =====
    // If we have a row matching this subject/topic, serve it for free
    // (no Anthropic call). Falls back to live generation when the pool
    // is empty for that topic, so subjects without a pool keep working.
    const pooled = await serveFromPool<{ questions: unknown[] }>(
      supabase,
      subject,
      topic,
      poolKind
    );
    if (pooled && Array.isArray(pooled.questions)) {
      return Response.json(
        { questions: pooled.questions },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    // ===== DAILY AI-GENERATION QUOTA (only reached on a real model call) =====
    // Pool + static banks are free and already returned above. Everything past
    // this point is a billed Sonnet generation, so it counts against the cap.
    // Best-effort: if the ai_generation_log table isn't there yet, the count
    // degrades to 0 (no cap) rather than blocking the feature — same graceful
    // pattern as lib/solution-cache.ts.
    const aiCap = isProUser(user) ? PRO_DAILY_AI_QUIZ : FREE_DAILY_AI_QUIZ;
    let aiUsedToday = 0;
    try {
      const { count } = await supabase
        .from('ai_generation_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        // Only the kinds THIS route writes (see the insert below). The same
        // table now also logs 'chat' / 'check' / 'tutor' turns; without this
        // filter ten chat messages would eat ten of the quiz generations.
        .in('kind', ['quiz', 'concept', 'concept-l1', 'concept-l2', 'concept-l3'])
        .gte('created_at', utcDayStartIso());
      aiUsedToday = count ?? 0;
    } catch {
      aiUsedToday = 0;
    }
    if (aiUsedToday >= aiCap) {
      return Response.json(
        {
          error: `הגעת למכסת ${aiCap} השאלות היומית ליצירה חכמה. נסה נושא עם בנק מוכן, או חזור מחר.`,
          quotaExceeded: true,
        },
        { status: 429 }
      );
    }

    // Site-wide budget brake — this route already writes to ai_generation_log
    // (below) so it's counted, but it never read the count back before
    // spending. See lib/agents/guard.ts.
    const globalBlock = await checkGlobalBudget(supabase);
    if (globalBlock) return globalBlock;

    // ===== 5. API KEY CHECK =====
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // ===== 6. CALL ANTHROPIC =====
    const client = new Anthropic({ apiKey });
    const subjectInfo = SUBJECTS[subject];

    // Tutor-style instruction. The shape is enforced by output_config.format
    // below — we used to repeat the JSON shape in this prompt, but that's
    // redundant when the model is constrained by a schema and was the
    // source of the earlier JSON-parse failures (unescaped Hebrew quotes
    // inside free-form generations).
    // Per-request seed so identical (subject, topic) pairs don't collapse
    // to identical outputs across attempts.
    const variationSeed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    const tutorInstruction = `

🎯 כלל ראשון: צור בדיוק 5 שאלות. לא 1, לא 3 — בדיוק 5.

אתה מורה למתמטיקה / פיזיקה / מקצוע מוסמך. תכתוב כמו מורה מקצועי:
פתרון ישיר, נכון, ללא בלבול וללא חזרות.

✂️ דרישת קיצור (הכי קריטית!):
- אל תחזור על אותו חישוב פעמיים בדרכים שונות.
- אל תכתוב "בוא נבדוק שוב..." או "טעות שלי, בעצם...".
- כל שדה הסבר: 1-3 משפטים בלבד. לא חיבור, לא פסקה ארוכה.
- אל תראה דרכים חלופיות. בחר את הדרך הנכונה והקצרה — תכתוב אותה פעם אחת.

📐 פורמט מתמטיקה — האפליקציה מרנדרת LaTeX + Markdown:
- ביטוי בתוך שורה: $...$ (לדוגמה: $f(x) = x^2 + 3$)
- ביטוי בלוק נפרד: $$...$$ (לדוגמה: $$\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}$$)
- השתמש ב-\\frac, \\sqrt, \\ln, \\sin, \\cos, \\int, \\sum, ^, _, \\pi, \\infty.
- חל על: question, answers, וכל 4 שדות ה-explanation.

⚠️ דיוק הסימון:
- correct = האינדקס (0-3) של התשובה הנכונה במערך answers.
- תהליך: פתור את השאלה → בנה answers → סמן את האינדקס → ודא ש-answers[correct] תואם לתשובה שפתרת.
- טעות פה = הרסנית. תלמיד עונה נכון ומקבל "טעות".

מבנה כל אחת מ-5 השאלות:
- question: שאלה בגרות אמיתית (במתמטיקה: השתמש ב-LaTeX לכל ביטוי).
- answers: 4 תשובות, אחת נכונה. גם הן ב-LaTeX אם רלוונטי.
- correct: 0-3, אינדקס התשובה הנכונה.
- explanation:
  • why_correct: הפתרון. 2-3 משפטים. הראה את הצעדים בלי לפרט יותר מדי.
    דוגמה: "$|z|^2 = 3^2 + 4^2 = 25$, לכן $|z^2| = |z|^2 = 25$."
  • why_wrong: 1-2 משפטים על הטעות הנפוצה (לא לפרט על כל תשובה בנפרד).
    דוגמה: "טעות נפוצה: לחשב $z^2 = 9 + 16 = 25$ במקום לחשב את הערך המוחלט."
  • concept: 1-2 משפטים. הכלל. "$|z|^2 = a^2 + b^2$ כאשר $z = a + bi$."
  • remember: שורה אחת קצרה. "ערך מוחלט בריבוע = סכום ריבועי החלקים הממשי והמדומה."

שפה: עברית ברורה (אנגלית רק אם המקצוע אנגלית).

גיוון בין סבבים — שאלות שונות בכל סבב. ערבב רמות קושי, מספרים, תרחישים.
מזהה סבב: ${variationSeed}

🎯 לפני סיום: 5 שאלות? answers[correct] תואם? הסברים תמציתיים בלי חזרות?`;

    // Note: previously prepended ~800 tokens of bagrut context here. That
    // grew per-call cost without proportional quality gain — removed.
    const basePrompt =
      mode === 'concept'
        ? buildConceptPrompt(subject, topic, conceptLevel, unitLevel, subjectInfo.buildPrompt)
        : subjectInfo.buildPrompt(topic);
    const fullPrompt = basePrompt + tutorInstruction;

    // Strict JSON schema → Anthropic guarantees the response parses.
    // The earlier free-form prompt occasionally produced JSON with
    // unescaped quotes inside Hebrew strings, breaking JSON.parse mid-
    // way through (the user saw "Expected ',' or '}' after property
    // value in JSON at position 3043"). Structured outputs eliminate
    // that class of bug entirely.
    const questionsSchema = {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              // Exactly 4, and correct in range. Both were unconstrained and
              // asked for in prose only: the UI's letters array is
              // ['א','ב','ג','ד'], so a 5th option rendered as `undefined`, and
              // an out-of-range `correct` marks every answer wrong.
              answers: {
                type: 'array',
                items: { type: 'string' },
                minItems: 4,
                maxItems: 4,
              },
              correct: { type: 'integer', minimum: 0, maximum: 3 },
              hint: { type: 'string' },
              explanation: {
                type: 'object',
                properties: {
                  why_correct: { type: 'string' },
                  why_wrong: { type: 'string' },
                  concept: { type: 'string' },
                  remember: { type: 'string' },
                },
                required: ['why_correct', 'why_wrong', 'concept', 'remember'],
                additionalProperties: false,
              },
            },
            required: ['question', 'answers', 'correct', 'hint', 'explanation'],
            additionalProperties: false,
          },
        },
      },
      required: ['questions'],
      additionalProperties: false,
    };

    // Model and budget come from lib/agents/config.ts, where the measurement
    // behind them is recorded. This route used `claude-sonnet-4-6` at 2,500
    // tokens; MEASURED (scripts/measure-generator.ts) that model was the only
    // one to truncate at 3,200 and ran ~38s/generation against Haiku's ~18s —
    // on a Vercel Hobby plan that kills the function at 60s.
    //
    // ⚠️ generateJSON does NOT retry. The comment that used to sit here said it
    // wrapped the call with a one-shot retry; the function's own source says
    // "Single attempt — no automatic retry". Believing the wrong one is how a
    // route ends up with no safety net it thinks it has.
    const { data: parsed } = await generateJSON<{ questions?: unknown[] }>(
      client,
      {
        model: GENERATOR_MODEL,
        max_tokens: GENERATOR_MAX_TOKENS,
        messages: [{ role: 'user', content: fullPrompt }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ output_config: { format: { type: 'json_schema', schema: questionsSchema } } } as any),
      },
      'questions'
    );

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response structure');
    }

    // Log this billed generation against the daily cap (fire-and-forget,
    // best-effort — a missing table just means no accounting, not an error).
    void supabase
      .from('ai_generation_log')
      // poolKind, not mode — per-level cost telemetry for free.
      .insert({ user_id: user.id, kind: poolKind })
      .then(({ error }) => {
        if (error) console.error('[ai_generation_log] insert failed:', error.message);
      });

    return Response.json(
      { questions: parsed.questions },
      {
        headers: {
          // Don't allow caching of API responses
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    // Log full details for ourselves; show a clean message to the student.
    console.error('Error generating questions:', error);
    return Response.json(
      { error: 'שגיאה ביצירת השאלות. נסה שוב בעוד רגע.' },
      { status: 500 }
    );
  }
}

// Block all non-POST methods on this endpoint
export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

/*
============================================================================
SQL — run once in the Supabase dashboard to enable the daily AI-generation
quota + cost telemetry. Until it's run, the count degrades to 0 (no cap) and
the auth gate alone protects the endpoint.

  create table if not exists public.ai_generation_log (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    kind        text not null,               -- 'quiz' | 'concept'
    created_at  timestamptz not null default now()
  );

  create index if not exists ai_generation_log_user_day_idx
    on public.ai_generation_log (user_id, created_at);

  alter table public.ai_generation_log enable row level security;

  -- Users can read/insert only their own rows.
  create policy "own rows read"  on public.ai_generation_log
    for select using (auth.uid() = user_id);
  create policy "own rows write" on public.ai_generation_log
    for insert with check (auth.uid() = user_id);
============================================================================
*/
