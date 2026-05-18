/**
 * generate-pool.ts — pre-generate a batch of quiz/bagrut items and store
 * them in the Supabase `question_pool` table. Run locally only.
 *
 * Usage:
 *   npm run generate-pool -- <subject> <topic> <kind> <count>
 *
 * Examples:
 *   npm run generate-pool -- math5 "אלגברה" quiz 10
 *   npm run generate-pool -- math5 "פונקציות" bagrut 5
 *
 * Required env vars (.env.local):
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← service-role key, NOT the publishable one
 *
 * The service-role key is required because RLS blocks writes from anon/auth
 * clients. Don't commit this key, don't put it in Vercel — local script only.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from the project root before anything reads env vars.
// `override: true` forces .env.local to win over any pre-existing OS-level
// env vars (e.g. an empty ANTHROPIC_API_KEY left behind in Windows env).
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// ===========================================================================
// CLI args
// ===========================================================================
const [subject, topic, kind, countStr = '10'] = process.argv.slice(2);
const count = parseInt(countStr, 10);

const VALID_KINDS = ['quiz', 'bagrut'] as const;
type Kind = typeof VALID_KINDS[number];

function printUsageAndExit(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  console.error('Usage:');
  console.error('  npm run generate-pool -- <subject> <topic> <kind> <count>');
  console.error('');
  console.error('Args:');
  console.error('  subject : math5 | math4 | physics | english | history | bible | chem');
  console.error('  topic   : exact topic name in quotes (e.g. "אלגברה")');
  console.error('  kind    : quiz | bagrut');
  console.error('  count   : how many items to generate (e.g. 10)');
  console.error('');
  console.error('Cost estimate: ~$0.04 per quiz item, ~$0.05 per bagrut item.');
  process.exit(1);
}

if (!subject) printUsageAndExit('Missing subject');
if (!topic) printUsageAndExit('Missing topic');
if (!kind || !VALID_KINDS.includes(kind as Kind)) {
  printUsageAndExit(`Invalid kind "${kind}" — must be quiz or bagrut`);
}
if (!Number.isFinite(count) || count <= 0 || count > 100) {
  printUsageAndExit(`Invalid count "${countStr}" — must be 1..100`);
}

// ===========================================================================
// Env validation
// ===========================================================================
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ANTHROPIC_API_KEY) printUsageAndExit('Missing ANTHROPIC_API_KEY in .env.local');
if (!SUPABASE_URL) printUsageAndExit('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
if (!SERVICE_KEY) printUsageAndExit('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');

// ===========================================================================
// Subject prompts (mirror of /api/questions and /api/practice-bagrut)
// ===========================================================================
const QUIZ_PROMPTS: Record<string, (topic: string) => string> = {
  math5: (t) =>
    `אתה מורה פרטי מומחה למתמטיקה ברמת 5 יחידות לבגרות בישראל (שאלון 581/582). צור 5 שאלות בגרות אמיתיות וברמה גבוהה בנושא: ${t}. השאלות צריכות לדמות שאלות בגרויות עדכניות — אתגריות אבל הוגנות, ולכלול חישובים, ניתוח גרפי או הוכחה לפי הצורך.`,
  math4: (t) =>
    `אתה מורה פרטי מומחה למתמטיקה ברמת 4 יחידות לבגרות בישראל. צור 5 שאלות ברמה הולמת ל-4 יחידות בנושא: ${t}. כלול חישובים מפורטים בשלבים.`,
  physics: (t) =>
    `אתה מורה לפיזיקה 5 יחידות לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`,
  english: (t) =>
    `You are an English Bagrut teacher (5 units). Create 5 Bagrut-level questions about: ${t}. Questions and answers in English.`,
  history: (t) =>
    `אתה מורה להיסטוריה לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`,
  bible: (t) =>
    `אתה מורה לתנ"ך לבגרות בישראל. צור 5 שאלות בגרות בנושא: ${t}. כלול שאלות על פסוקים, עלילה ומסרים.`,
  chem: (t) =>
    `אתה מורה לכימיה 5 יחידות לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`,
};

const BAGRUT_PROMPTS: Record<string, (topic: string) => string> = {
  math5: (t) =>
    `אתה מורה פרטי למתמטיקה ברמת 5 יחידות לבגרות בישראל. צור שאלת בגרות אמיתית, מעמיקה, בנושא: ${t}. שאלה אחת עם 3 עד 4 סעיפים מתפתחים.`,
  math4: (t) =>
    `אתה מורה פרטי למתמטיקה ברמת 4 יחידות לבגרות. צור שאלת בגרות אמיתית בנושא: ${t}. שאלה עם 3 עד 4 סעיפים מתפתחים.`,
  physics: (t) =>
    `אתה מורה לפיזיקה 5 יחידות לבגרות. צור שאלת בגרות בנושא: ${t}. 3-4 סעיפים עם חישובים.`,
  english: (t) =>
    `You are an English Bagrut teacher. Create one bagrut-style question about: ${t}, with 3-4 progressive sub-parts. Question and solutions in English.`,
  history: (t) =>
    `אתה מורה להיסטוריה לבגרות. צור שאלה מנתחת בנושא: ${t} עם 3-4 סעיפים שדורשים ניתוח.`,
  bible: (t) =>
    `אתה מורה לתנ"ך לבגרות. צור שאלה מעמיקה בנושא: ${t} עם 3-4 סעיפים שדורשים ניתוח פסוקים.`,
  chem: (t) =>
    `אתה מורה לכימיה 5 יחידות לבגרות. צור שאלת בגרות בנושא: ${t} עם 3-4 סעיפים עם חישובים.`,
};

// ===========================================================================
// Prompts + schemas (literal copies from the live API routes)
// ===========================================================================
function buildQuizPrompt(subject: string, topic: string): string {
  const opener = QUIZ_PROMPTS[subject];
  if (!opener) throw new Error(`Unknown subject: ${subject}`);
  const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const tutorInstruction = `

🎯 כלל ראשון: צור בדיוק 5 שאלות.

✂️ דרישת קיצור:
- אל תחזור על אותו חישוב פעמיים.
- כל שדה הסבר: 1-3 משפטים בלבד.
- בחר את הדרך הנכונה והקצרה — כתוב אותה פעם אחת.

📐 פורמט מתמטיקה — האפליקציה מרנדרת LaTeX + Markdown:
- inline: $...$  • block: $$...$$
- השתמש ב-\\frac, \\sqrt, \\ln, \\sin, \\cos, \\int, \\sum, ^, _.

⚠️ דיוק correct:
- correct = האינדקס (0-3) של התשובה הנכונה במערך answers.
- ודא ש-answers[correct] תואם לפתרון ב-why_correct.

מבנה כל אחת מ-5 השאלות:
- question, answers (4), correct (0-3), explanation: { why_correct, why_wrong, concept, remember }

שפה: עברית (אנגלית רק אם המקצוע אנגלית).
מזהה גיוון: ${seed}`;
  return opener(topic) + tutorInstruction;
}

function buildBagrutPrompt(subject: string, topic: string): string {
  const opener = BAGRUT_PROMPTS[subject];
  if (!opener) throw new Error(`Unknown subject: ${subject}`);
  const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const tutorInstruction = `

📐 פורמט: LaTeX + Markdown. inline $...$, block $$...$$.

מבנה התשובה:
- context: נתונים משותפים לכל הסעיפים (או מחרוזת ריקה).
- topic_tag: תיוג קצר של תת-הנושא.
- parts: מערך של 3 עד 4 סעיפים. כל סעיף:
  - label: "א"/"ב"/"ג"/"ד" (או a/b/c באנגלית).
  - prompt: ניסוח הסעיף.
  - answer_type: "number" | "expression" | "text".
  - hints: 3 רמזים מהקל למפורט.
  - solution: { steps[3..6], final_answer }.

הסעיפים מתפתחים: סעיף א בסיס, ב מתקדם, וכו׳.
שפה: עברית (אנגלית רק אם המקצוע אנגלית).
מזהה גיוון: ${seed}`;
  return opener(topic) + tutorInstruction;
}

const QUIZ_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answers: { type: 'array', items: { type: 'string' } },
          correct: { type: 'integer' },
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
        required: ['question', 'answers', 'correct', 'explanation'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

const BAGRUT_SCHEMA = {
  type: 'object',
  properties: {
    context: { type: 'string' },
    topic_tag: { type: 'string' },
    parts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          prompt: { type: 'string' },
          answer_type: { type: 'string', enum: ['number', 'expression', 'text'] },
          hints: { type: 'array', items: { type: 'string' } },
          solution: {
            type: 'object',
            properties: {
              steps: { type: 'array', items: { type: 'string' } },
              final_answer: { type: 'string' },
            },
            required: ['steps', 'final_answer'],
            additionalProperties: false,
          },
        },
        required: ['label', 'prompt', 'answer_type', 'hints', 'solution'],
        additionalProperties: false,
      },
    },
  },
  required: ['context', 'topic_tag', 'parts'],
  additionalProperties: false,
};

// ===========================================================================
// Generate one item
// ===========================================================================
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function generateOnce(): Promise<unknown> {
  const prompt = kind === 'quiz' ? buildQuizPrompt(subject, topic) : buildBagrutPrompt(subject, topic);
  const schema = kind === 'quiz' ? QUIZ_SCHEMA : BAGRUT_SCHEMA;
  // 3500 max_tokens leaves comfortable headroom over the ~2500 budget the
  // production API uses. Sonnet 4.6 with structured-output occasionally
  // emits malformed JSON for Hebrew content; a slightly larger ceiling
  // reduces the chance of truncation-induced parse errors.
  const maxTokens = 3500;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...({ output_config: { format: { type: 'json_schema', schema } } } as any),
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response shape');
  return JSON.parse(content.text);
}

async function generateOne(): Promise<unknown> {
  // Retry once on JSON parse errors — Sonnet 4.6 with structured outputs
  // occasionally returns malformed JSON for Hebrew content. The retry
  // costs another ~$0.04 but recovers an otherwise wasted call.
  try {
    return await generateOnce();
  } catch (e) {
    if (e instanceof SyntaxError) {
      return await generateOnce();
    }
    throw e;
  }
}

// ===========================================================================
// Main loop
// ===========================================================================
async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Pool generation — ${kind.toUpperCase()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  subject : ${subject}`);
  console.log(`  topic   : ${topic}`);
  console.log(`  count   : ${count}`);
  const estCost = (kind === 'quiz' ? 0.04 : 0.05) * count;
  console.log(`  est cost: ~$${estCost.toFixed(2)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  let success = 0;
  let failed = 0;
  const start = Date.now();

  for (let i = 1; i <= count; i++) {
    const itemStart = Date.now();
    try {
      process.stdout.write(`[${i}/${count}] generating... `);
      const data = await generateOne();

      const { error } = await supabase.from('question_pool').insert({
        subject,
        topic,
        kind,
        data,
      });
      if (error) throw error;

      const ms = Date.now() - itemStart;
      console.log(`✓ saved (${(ms / 1000).toFixed(1)}s)`);
      success++;
    } catch (e) {
      const ms = Date.now() - itemStart;
      console.log(`✗ failed (${(ms / 1000).toFixed(1)}s)`);
      console.error(`    └─ ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }

  const totalMin = ((Date.now() - start) / 60000).toFixed(1);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Done in ${totalMin} min`);
  console.log(`  ✓ ${success} saved   ✗ ${failed} failed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  process.exit(failed > 0 && success === 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
