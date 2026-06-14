/**
 * demo-tutor.ts — headless demonstration of the 5 acceptance scenarios for
 * the grounded "private tutor" pilot (complex numbers).
 *
 * Usage:
 *   npx tsx scripts/demo-tutor.ts
 *
 * PART A — the deterministic checker. Runs with NO API key; proves the
 *          grading mechanism (mechanism #2) and the spec correctness.
 * PART B — the tutor behaviour. Calls Anthropic with the grounded tutor-bar
 *          system prompt; needs ANTHROPIC_API_KEY in .env.local. Skipped
 *          (with a notice) if the key is absent.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
// Load .env.local first (Next convention), overriding any empty OS env vars.
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { getLesson } from '@/content/lessons';
import { checkAnswer, type AnswerSpec } from '@/lib/answer-check';
import {
  PILOT_TOPIC,
  buildComplexNumbersContext,
  buildTutorSystemPrompt,
} from '@/lib/tutor-grounding';

function hr(t: string) {
  console.log('\n' + '═'.repeat(74) + '\n  ' + t + '\n' + '═'.repeat(74));
}

let pass = 0;
let fail = 0;
function check(desc: string, student: string, spec: AnswerSpec, want: string) {
  const r = checkAnswer(student, spec);
  const ok = r.verdict === want;
  ok ? pass++ : fail++;
  console.log(
    `  ${ok ? '✓' : '✗ FAIL'}  ${desc}\n       "${student}"  →  ${r.verdict}` +
      `${r.readAs ? `  (קראתי כ-${r.readAs})` : ''}   [ציפיתי ל-${want}]`
  );
}

async function main() {
  // ====================================================================
  // PART A — deterministic checker (no API key)
  // ====================================================================
  hr('PART A — בדיקה דטרמיניסטית (מנגנון 2) — ללא API');

  const lesson = getLesson('math5', PILOT_TOPIC);
  if (!lesson) throw new Error('lesson missing');

  // A0 — spec self-consistency. Every value/set spec must grade its OWN
  // canonical answer as correct — guards against a typo'd spec false-failing
  // a real student (the cardinal sin the brief warns about).
  const allParts = (lesson.bagrutQuestions ?? []).flatMap((q) =>
    q.parts.map((p) => ({ id: `${q.id}-${p.label}`, expected: p.expected }))
  );
  let autoCheckable = 0;
  let specBad = 0;
  for (const { id, expected } of allParts) {
    if (!expected || expected.kind === 'manual') continue;
    autoCheckable++;
    const canonical =
      expected.kind === 'value' ? expected.value : expected.values.join(', ');
    const r = checkAnswer(canonical, expected);
    if (r.verdict !== 'correct') {
      specBad++;
      console.log(`  ✗ spec ${id}: canonical "${canonical}" graded ${r.verdict}`);
    }
  }
  console.log(
    `A0 — תקינות specs: ${autoCheckable} סעיפים אוטומטיים, ${autoCheckable - specBad} עברו, ${specBad} כשלו`
  );
  console.log(
    `     (סה"כ ${allParts.length} סעיפים בבנק; היתר מסומנים manual — הוכחות/מקומות גאומטריים)`
  );

  // Scenario 1 — roots: a student who gives only ONE root of three.
  hr('תרחיש 1 — שורשים: התלמיד נתן רק שורש אחד מתוך שלושה (z³ = -8)');
  const rootsSet: AnswerSpec = {
    kind: 'set',
    values: ['2*cis(60)', '2*cis(180)', '2*cis(300)'],
  };
  check('שורש אחד בלבד → שגוי', '2cis(60)', rootsSet, 'wrong');
  check('שני שורשים בלבד → שגוי', '2cis(60), 2cis(300)', rootsSet, 'wrong');
  check('שלושת השורשים → נכון', '2cis(60), 2cis(180), 2cis(300)', rootsSet, 'correct');

  // Scenario 4 — equivalent forms accepted.
  hr('תרחיש 4 — צורה שקולה שונה מתקבלת כנכונה');
  check('קוטבי במקום אלגברי (z³=-8)', '8cis(180)', { kind: 'value', value: '-8' }, 'correct');
  check('אלגברי במקום קוטבי', '1+sqrt(3)*i', { kind: 'value', value: '2*cis(60)' }, 'correct');
  check(
    'שורשים בצורה אלגברית לשאלה קוטבית',
    '1+sqrt(3)*i, -2, 1-sqrt(3)*i',
    rootsSet,
    'correct'
  );
  check('סדר שונה של שורשים', '2cis(300), 2cis(60), 2cis(180)', rootsSet, 'correct');
  check('תשובה שגויה אמיתית', '5', { kind: 'value', value: '-8' }, 'wrong');

  // Grounding sanity — the verified-content block actually carries the
  // error bank and stays in 582 (no e^{iθ}).
  hr('עיגון (מנגנון 1) — חומר הנושא המאומת');
  const ctx = buildComplexNumbersContext();
  console.log(`  אורך בלוק העיגון: ${ctx.length} תווים`);
  console.log(`  כולל מאגר טעויות: ${ctx.includes('טעויות נפוצות') ? '✓' : '✗'}`);
  console.log(`  כולל נוסחאות: ${ctx.includes('נוסחאות') ? '✓' : '✗'}`);
  console.log(`  כולל דוגמאות פתורות: ${ctx.includes('דוגמאות פתורות') ? '✓' : '✗'}`);
  console.log(`  אוסר e^{iθ}: ${ctx.includes('e^{i\\theta}') ? '✓' : '✗'}`);

  console.log(`\nPART A — ${pass} עברו, ${fail} כשלו, specs פגומים: ${specBad}`);

  // ====================================================================
  // PART B — tutor behaviour (needs ANTHROPIC_API_KEY)
  // ====================================================================
  hr('PART B — התנהגות המורה (הרף) — דורש ANTHROPIC_API_KEY');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const system = buildTutorSystemPrompt(PILOT_TOPIC);
  if (!system) throw new Error('tutor system prompt missing');

  if (!apiKey) {
    console.log('⚠  אין ANTHROPIC_API_KEY ב-.env.local — מדלג על Part B.');
    console.log(`   (ה-system prompt מוכן: ${system.length} תווים, כולל את חומר הנושא המאומת)`);
    return;
  }

  const client = new Anthropic({ apiKey });
  const scenarios = [
    {
      id: '2',
      title: '"לא הבנתי דה-מואבר" → מאבחן + מסביר מהתוכן + מנסח מחדש',
      user: 'לא הבנתי את נוסחת דה-מואבר. אפשר שתסביר לי?',
    },
    {
      id: '3',
      title: '"פשוט תן לי את התשובה" → רמז קודם, לא פתרון',
      user: 'פשוט תן לי את התשובה ל-$(1+i)^8$, בלי הסברים בבקשה.',
    },
    {
      id: '1',
      title: 'תשובה שגויה (שורש אחד) → מזהה ושואל, לא מדפיס פתרון',
      user: 'בשאלה $z^3 = -8$ פתרתי וקיבלתי $z = 2\\,\\text{cis}\\,60°$. זה נכון?',
    },
    {
      id: '5',
      title: 'מחוץ לסילבוס (e^{iθ}) → נשאר ב-582 / cis במעלות',
      user: 'אפשר לכתוב את $2\\,\\text{cis}\\,60°$ בתור $2e^{i\\pi/3}$? זה אותו דבר נכון?',
    },
  ];

  for (const s of scenarios) {
    hr(`תרחיש ${s.id} — ${s.title}`);
    console.log(`תלמיד: ${s.user}\n`);
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      system,
      messages: [{ role: 'user', content: s.user }],
    });
    const block = msg.content.find((c) => c.type === 'text');
    console.log('מורה:', block && 'text' in block ? block.text : '(no text)');
  }
}

main().catch((e) => {
  console.error('demo error:', e);
  process.exit(1);
});
