/**
 * probe-core-ab.ts — does the ENGLISH tutor prompt still behave like the Hebrew one?
 *
 *   npx tsx scripts/probe-core-ab.ts            both prompts, side by side
 *   npx tsx scripts/probe-core-ab.ts --new      the shipped prompt only
 *
 * ⚠️ THIS ONE COSTS MONEY. Roughly 10 Haiku calls, a few cents. It is the only
 * check in the repo that makes a real call with the real system prompt, and it
 * exists because every other tutor test is STRUCTURAL — they assert that a
 * marker is documented and that a block is in the right order, and every one of
 * them passed while the prompt was being rewritten from Hebrew into English.
 * Structure surviving is not behaviour surviving.
 *
 * The old Hebrew core is read from a backup file rather than from git, so the
 * comparison keeps working after the change is committed. Point BASELINE at any
 * file containing the previous `const TUTOR_CORE = ` literal.
 *
 * ⚠️ ONE SAMPLE PER CELL. Two runs of the A/B (2026-08-29) gave EN 9/10 and
 * HE 6/10 — both prompts leak the answer sometimes, the English one less often.
 * That is enough to say the translation did NOT regress, and NOT enough to
 * claim it improved anything. Read it as a smoke test, not a benchmark; run it
 * several times before believing any single verdict.
 *
 * What it checks, per reply — the five properties a student would notice:
 *   hebrew     the reply is Hebrew, not English (the whole risk of the change)
 *   short      at most 45 Hebrew words, the prompt's own headline rule
 *   no-opener  does not start with "שלום"/"שאלה מצוינת"/"בשמחה"/...
 *   no-answer  does not hand over the final answer on a first ask
 *   latex      maths is inside $...$, and no Hebrew inside the delimiters
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { buildTutorSystem } from '../lib/agents/prompts';
import { TUTOR_TOOLS } from '../lib/agents/tools';

const BASELINE = 'C:/tmp/prompts.bak.ts';
const NEW_ONLY = process.argv.includes('--new');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const BS = String.fromCharCode(92);
const TICK = String.fromCharCode(96);

/** Pull the TUTOR_CORE literal out of a source file and unescape it. */
function coreFrom(file: string): string | null {
  if (!existsSync(file)) return null;
  const src = readFileSync(file, 'utf8');
  const mark = 'const TUTOR_CORE = ' + TICK;
  const start = src.indexOf(mark);
  if (start < 0) return null;
  let end = -1;
  for (let i = start + mark.length; i < src.length; i++) {
    if (src[i] !== TICK) continue;
    let slashes = 0;
    for (let j = i - 1; j >= 0 && src[j] === BS; j--) slashes++;
    if (slashes % 2 === 0) { end = i; break; }
  }
  if (end < 0) return null;
  const body = src.slice(start + mark.length, end);
  // Undo the template-literal escaping: \` -> ` and \\ -> \
  return body.split(BS + TICK).join(TICK).split(BS + BS).join(BS);
}

const TOPIC = 'סדרות';
const QUESTION = 'בסדרה חשבונית $a_1 = 3$ וההפרש $d = 4$. חשב את $a_5$.';
const SOLUTION = [
  'נשתמש בנוסחת האיבר הכללי $a_n = a_1 + (n-1)d$.',
  'נציב $a_5 = 3 + 4 \\cdot 4$.',
  'נחשב ונקבל $a_5 = 19$.',
];

const CASES: Array<{ msg: string; why: string; banned?: string[] }> = [
  { msg: 'לא הבנתי', why: 'must diagnose, not dump an explanation', banned: ['19'] },
  { msg: 'זה 19?', why: 'a thrown guess must NOT be confirmed or denied', banned: ['כן', 'נכון מאוד'] },
  { msg: 'תן לי את התשובה', why: 'must hold the line and hint instead', banned: ['19'] },
  { msg: 'למה זה לא 15', why: 'why_this_step — point at the step, do not solve', banned: ['19'] },
  { msg: 'מאיפה הגיע ה-4', why: 'where_from — name the step that introduces it' },
];

const OPENERS = ['שלום', 'היי', 'שאלה מצוינת', 'שאלה טובה', 'אשמח לעזור', 'בשמחה', 'בהחלט', 'כמובן', 'בוא נראה', 'אין בעיה', 'שאלה מעולה'];

function grade(text: string, banned: string[] = []) {
  const he = (text.match(/[֐-׿]/g) ?? []).length;
  const en = (text.match(/[a-zA-Z]/g) ?? []).length;
  const words = text.replace(/\$[^$]*\$/g, ' ').split(/\s+/).filter((w) => /[֐-׿]/.test(w));
  const first = text.trim().slice(0, 24);
  // Hebrew inside $...$ renders reversed in KaTeX — an explicit prompt rule.
  const inMath = (text.match(/\$[^$]*\$/g) ?? []).some((m) => /[֐-׿]/.test(m));
  return {
    hebrew: he > en,
    short: words.length <= 45,
    words: words.length,
    noOpener: !OPENERS.some((o) => first.includes(o)),
    noAnswer: !banned.some((b) => text.includes(b)),
    latexClean: !inMath,
  };
}

async function ask(system: unknown, msg: string): Promise<string> {
  const r = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: system as never,
    tools: TUTOR_TOOLS as never,
    messages: [
      {
        role: 'user',
        content:
          `[הקשר — התלמיד עובד על:]\nSCREEN\nat: roadmap\nq: ${QUESTION}\nSOLUTION\n` +
          SOLUTION.map((s, i) => `${i + 1}. ${s}`).join('\n') +
          `\n\n${msg}`,
      },
    ],
  });
  return r.content.filter((c) => c.type === 'text').map((c) => (c as { text: string }).text).join('\n');
}

(async () => {
  const shipped = buildTutorSystem({ unitLevel: 5, formNumber: '582', topic: TOPIC, hasQuestion: true } as never);
  const oldCore = NEW_ONLY ? null : coreFrom(BASELINE);
  if (!NEW_ONLY && !oldCore) {
    console.log(`no baseline at ${BASELINE} — running the shipped prompt only\n`);
  }
  // Same blocks, only the core swapped, so the diff is the translation alone.
  const baseline =
    oldCore && shipped.length
      ? [{ type: 'text', text: oldCore }, ...shipped.slice(1)]
      : null;

  const arms: Array<[string, unknown]> = [['EN (shipped)', shipped]];
  if (baseline) arms.push(['HE (previous)', baseline]);

  let fails = 0;
  for (const c of CASES) {
    console.log(`\n=== "${c.msg}" — ${c.why}`);
    for (const [name, sys] of arms) {
      const text = await ask(sys, c.msg);
      const g = grade(text, c.banned);
      const bad = [
        !g.hebrew && 'NOT-HEBREW',
        !g.short && `TOO-LONG(${g.words})`,
        !g.noOpener && 'OPENER',
        !g.noAnswer && 'GAVE-ANSWER',
        !g.latexClean && 'HEBREW-IN-MATH',
      ].filter(Boolean);
      if (name.startsWith('EN') && bad.length) fails++;
      console.log(`  ${name.padEnd(14)} ${bad.length ? '✗ ' + bad.join(' ') : `ok (${g.words}w)`}`);
      console.log(`     ${text.replace(/\n/g, ' ').slice(0, 150)}`);
    }
  }
  console.log(fails === 0 ? '\nOK: the English prompt held on every case\n' : `\n${fails} failure(s) on the shipped prompt\n`);
  process.exitCode = fails === 0 ? 0 : 1;
})();
