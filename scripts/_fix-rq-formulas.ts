// Rewrite the eight stages' sub-topic `formulas: [...]` arrays.
//
// WHY. Itay asked the tutor for "the formula" and got a wall. The template is
// fine — `{formulas}` serves the sub-topic's formula sheet — but I had authored
// that sheet with 2 to 6 identities packed into ONE `latex` string joined by
// `\;,\;`, plus three cards that are not formulas at all but procedures written
// in English `\text{}`. Every approved topic (סדרות, הסתברות) uses ONE identity
// per card with its own name. This brings mine to that shape.
//
// Replacement is done with a FUNCTION, never a string: the content is full of
// `$` and a trailing one next to a quote becomes `$'` = "everything after".
//
//   npx tsx scripts/_fix-rq-formulas.ts [--dry]
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'content/lessons/math5/functions-root-quotient.ts';
const DRY = process.argv.includes('--dry');

type Card = { name: string; latex: string; vars: [string, string][]; note?: string };

const SHEETS: Record<string, Card[]> = {
  'rq-domain': [
    { name: 'תחום הגדרה של מנה', latex: 'Q(x) \\ne 0', vars: [['Q(x)', 'המכנה']],
      note: 'מאפסים את המכנה ופוסלים את הערכים שהתקבלו.' },
    { name: 'תחום הגדרה של שורש', latex: 'g(x) \\ge 0', vars: [['g(x)', 'הביטוי שמתחת לשורש']],
      note: 'אי-שוויון חלש, כי השורש מקבל גם אפס.' },
    { name: 'שורש במכנה', latex: 'g(x) > 0', vars: [['g(x)', 'הביטוי שמתחת לשורש, שהוא גם המכנה']],
      note: 'אי-שלילי מהשורש ושונה מאפס מהמכנה, ולכן חיובי ממש.' },
    { name: 'אי-שוויון ריבועי דרך הפרבולה', latex: 'ax^2 + bx + c \\ge 0',
      vars: [['a', 'מקדם $x^2$; חיובי פותח כלפי מעלה']],
      note: 'פתוחה כלפי מעלה: חיובית בחוץ. פתוחה כלפי מטה: חיובית בפנים.' },
  ],
  'rq-intersections': [
    { name: 'חיתוך עם ציר $x$', latex: 'f(x) = 0', vars: [['f(x)', 'הפונקציה']],
      note: 'על ציר $x$ הגובה אפס, ולכן פותרים משוואה.' },
    { name: 'חיתוך עם ציר $y$', latex: '(0,\\; f(0))', vars: [['f(0)', 'ערך הפונקציה בהצבת אפס']],
      note: 'קיים רק אם אפס נמצא בתחום ההגדרה.' },
    { name: 'מתי מנה מתאפסת', latex: '\\dfrac{P}{Q} = 0 \\Longleftarrow P = 0',
      vars: [['P', 'המונה'], ['Q', 'המכנה, שרק נבדק שאינו מתאפס']],
      note: 'המונה קובע את הנקודה, והמכנה רק פוסל.' },
    { name: 'מתי שורש מתאפס', latex: '\\sqrt{g} = 0 \\Longleftarrow g = 0',
      vars: [['g', 'הביטוי שמתחת לשורש']],
      note: 'ואז בודקים שהפתרון בתחום ההגדרה.' },
  ],
  'rq-asymptotes': [
    { name: 'אסימפטוטה אנכית', latex: 'x = a', vars: [['a', 'ערך שמאפס את המכנה בלבד']],
      note: 'מתקבלת כאשר המכנה מתאפס בערך $a$ והמונה אינו מתאפס שם. אם גם המונה מתאפס, יש שם חור.' },
    { name: 'אסימפטוטה אופקית — חזקות שוות', latex: 'y = \\dfrac{a_n}{b_m}',
      vars: [['a_n', 'המקדם שלפני החזקה הגבוהה במונה'], ['b_m', 'המקדם שלפני החזקה הגבוהה במכנה']],
      note: 'רק כשהחזקה הגבוהה בשני הצדדים שווה.' },
    { name: 'אסימפטוטה אופקית — מכנה מחזקה גבוהה יותר', latex: 'y = 0',
      vars: [['\\deg Q', 'החזקה הגבוהה במכנה']],
      note: 'המכנה גדל מהר יותר, ולכן השבר מתכווץ. כשהמונה מחזקה גבוהה יותר, אין אסימפטוטה אופקית.' },
  ],
  'rq-derivative': [
    { name: 'כלל החזקה', latex: '(x^n)\' = n x^{n-1}', vars: [['n', 'החזקה, גם שלילית וגם שברית']],
      note: 'החזקה יורדת קדימה כמקדם, והחזקה החדשה קטנה באחד.' },
    { name: 'כלל המכפלה', latex: '(u \\cdot v)\' = u\'v + uv\'', vars: [['u, v', 'שני הגורמים במכפלה']],
      note: 'נגזרת הראשון כפול השני, ועוד הראשון כפול נגזרת השני.' },
    { name: 'כלל המנה', latex: '\\left(\\dfrac{u}{v}\\right)\' = \\dfrac{u\'v - uv\'}{v^2}',
      vars: [['u', 'המונה'], ['v', 'המכנה']],
      note: 'הסדר במונה קובע את הסימן, והמכנה מתרבע.' },
    { name: 'נגזרת של שורש', latex: '\\left(\\sqrt{g}\\right)\' = \\dfrac{g\'}{2\\sqrt{g}}',
      vars: [['g', 'הביטוי שמתחת לשורש']],
      note: 'הנגזרת הפנימית עולה למונה, והשורש נשאר במכנה כפול שתיים.' },
    { name: 'פונקציה מורכבת', latex: '\\left(g^n\\right)\' = n g^{n-1} \\cdot g\'',
      vars: [['g', 'הפונקציה הפנימית'], ['g\'', 'הנגזרת הפנימית']],
      note: 'גוזרים את החיצונית כרגיל, ואז כופלים בנגזרת הפנימית.' },
    { name: 'מועמד לנקודת קיצון', latex: 'f\'(x) = 0', vars: [['f\'(x)', 'שיפוע המשיק']],
      note: 'בנקודת קיצון המשיק אופקי, ולכן שיפועו אפס.' },
    { name: 'סיווג בנגזרת שנייה', latex: 'f\'\'(x_0) > 0 \\Longrightarrow \\min',
      vars: [['x_0', 'המועמד שהתקבל מאיפוס הנגזרת']],
      note: 'חיובי הוא כוס ולכן מינימום, ושלילי הוא כיפה ולכן מקסימום.' },
  ],
  'rq-sketch': [
    { name: 'נגזרת חיובית', latex: 'f\'(x) > 0', vars: [['f\'(x)', 'שיפוע המשיק בנקודה']],
      note: 'הפונקציה עולה שם.' },
    { name: 'נגזרת שלילית', latex: 'f\'(x) < 0', vars: [['f\'(x)', 'שיפוע המשיק בנקודה']],
      note: 'הפונקציה יורדת שם.' },
    { name: 'נגזרת מתאפסת', latex: 'f\'(x) = 0', vars: [['f\'(x)', 'שיפוע המשיק בנקודה']],
      note: 'המשיק אופקי, ואם הסימן מתחלף שם יש קיצון.' },
  ],
  'rq-transformations': [
    { name: 'הזזה אנכית', latex: 'f(x) + c', vars: [['c', 'גודל ההזזה']],
      note: 'מרימה את הגרף כלפי מעלה, בכיוון הסימן.' },
    { name: 'הזזה אופקית', latex: 'f(x - c)', vars: [['c', 'גודל ההזזה']],
      note: 'מזיזה את הגרף ימינה, בכיוון ההפוך לסימן.' },
    { name: 'שיקוף ביחס לציר $x$', latex: '-f(x)', vars: [['f(x)', 'הפונקציה המקורית']],
      note: 'הגבהים מתהפכים, וסוג הקיצון מתהפך איתם.' },
    { name: 'שיקוף ביחס לציר $y$', latex: 'f(-x)', vars: [['f(x)', 'הפונקציה המקורית']],
      note: 'הצדדים מתהפכים, והגבהים נשמרים.' },
    { name: 'ערך מוחלט', latex: '|f(x)|', vars: [['f(x)', 'הפונקציה המקורית']],
      note: 'מקפל כלפי מעלה רק את מה שהיה מתחת לציר.' },
    { name: 'פונקציה זוגית', latex: 'f(-x) = f(x)', vars: [['f', 'הפונקציה']],
      note: 'סימטריה סביב ציר $y$.' },
    { name: 'פונקציה אי-זוגית', latex: 'f(-x) = -f(x)', vars: [['f', 'הפונקציה']],
      note: 'סימטריה סביב ראשית הצירים.' },
    { name: 'כמה נקודות משותפות עם ציר $x$', latex: 'f(x) + c = 0 \\Longrightarrow f(x) = -c',
      vars: [['-c', 'הגובה של הישר האופקי על גרף $f$']],
      note: 'מספר הפתרונות הוא מספר הפגישות עם הישר האופקי. פגישה יחידה פירושה נגיעה בערך של קיצון.' },
  ],
  'rq-integral': [
    { name: 'כלל החזקה לאינטגרל', latex: '\\int x^n\\, dx = \\dfrac{x^{n+1}}{n+1} + C',
      vars: [['n', 'החזקה, כל ערך פרט למינוס אחד']],
      note: 'מגדילים את החזקה באחד ומחלקים בחזקה החדשה.' },
    { name: 'הצבה לינארית', latex: '\\int (ax+b)^n\\, dx = \\dfrac{(ax+b)^{n+1}}{a(n+1)} + C',
      vars: [['a', 'המקדם של המשתנה, שבו מחלקים']],
      note: 'תקף רק כשהביטוי הפנימי לינארי.' },
    { name: 'זיהוי לפי נגזרת פנימית', latex: '\\int g\'g^n\\, dx = \\dfrac{g^{n+1}}{n+1} + C',
      vars: [['g', 'הביטוי הפנימי'], ['g\'', 'הנגזרת הפנימית, שחייבת להופיע']],
      note: 'מקדם חסר משלימים בפנים ומפצים עליו מחוץ לאינטגרל.' },
    { name: 'זיהוי בשורש', latex: '\\int \\dfrac{g\'}{2\\sqrt{g}}\\, dx = \\sqrt{g} + C',
      vars: [['g', 'הביטוי שמתחת לשורש']],
      note: 'זו נוסחת נגזרת השורש, קראו אותה מימין לשמאל.' },
    { name: 'אינטגרל מסוים', latex: '\\int_a^b f(x)\\, dx = F(b) - F(a)',
      vars: [['F', 'פונקציה קדומה של $f$'], ['a, b', 'הגבול התחתון והעליון']],
      note: 'עליון פחות תחתון, ובלי קבוע אינטגרציה.' },
    { name: 'שטח בין הגרף לציר', latex: 'S = \\left|\\int_a^b f(x)\\, dx\\right|',
      vars: [['a, b', 'נקודות החיתוך עם הציר']],
      note: 'מפצלים בכל נקודה שבה הגרף חוצה את הציר, ולוקחים ערך מוחלט מכל חלק.' },
    { name: 'שטח בין שני גרפים', latex: 'S = \\int_a^b \\big(f_1 - f_2\\big)\\, dx',
      vars: [['f_1', 'הפונקציה העליונה בתחום'], ['f_2', 'הפונקציה התחתונה'], ['a, b', 'נקודות המפגש']],
      note: 'תמיד עליון פחות תחתון. תוצאה שלילית מסמנת שהסדר התהפך.' },
  ],
  'rq-bagrut-mixed': [
    { name: 'תחום הגדרה', latex: 'Q(x) \\ne 0 \\quad g(x) \\ge 0', vars: [['Q', 'מכנה'], ['g', 'ביטוי מתחת לשורש']],
      note: 'שורש במכנה מחמיר לחיובי ממש.' },
    { name: 'אסימפטוטה אנכית', latex: 'x = a', vars: [['a', 'ערך שמאפס את המכנה בלבד']],
      note: 'אם גם המונה מתאפס שם, יש חור ולא אסימפטוטה.' },
    { name: 'אסימפטוטה אופקית', latex: 'y = \\dfrac{a_n}{b_m}', vars: [['a_n, b_m', 'המקדמים המובילים']],
      note: 'רק כשהחזקות שוות. חזקת מכנה גבוהה יותר נותנת $y = 0$.' },
    { name: 'מועמד לקיצון', latex: 'f\'(x) = 0', vars: [['f\'', 'הנגזרת']],
      note: 'ואז מסווגים, ופוסלים כל מועמד שמחוץ לתחום ההגדרה.' },
    { name: 'שטח', latex: 'S = \\left|\\int_a^b f(x)\\, dx\\right|', vars: [['a, b', 'הגבולות']],
      note: 'מפצלים היכן שהגרף חוצה את הציר.' },
  ],
};

const lit = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function renderSheet(cards: Card[]): string {
  const body = cards
    .map((c) => {
      const vars = c.vars.map(([sym, meaning]) => `        { sym: ${lit(sym)}, meaning: ${lit(meaning)} },`).join('\n');
      return (
        `      {\n` +
        `        name: ${lit(c.name)},\n` +
        `        latex: ${lit(c.latex)},\n` +
        `        variables: [\n${vars}\n        ],\n` +
        (c.note ? `        note: ${lit(c.note)},\n` : '') +
        `      },`
      );
    })
    .join('\n');
  return `    formulas: [\n${body}\n    ],`;
}

let src = readFileSync(FILE, 'utf8');
const problems: string[] = [];
let done = 0;

for (const [stage, cards] of Object.entries(SHEETS)) {
  const at = src.indexOf(`    id: '${stage}',`);
  if (at < 0) { problems.push(`${stage}: not found`); continue; }
  // the sub-topic level formulas array: 4-space indent, after the stage's id
  const fAt = src.indexOf('\n    formulas: [', at);
  if (fAt < 0) { problems.push(`${stage}: no formulas array`); continue; }
  const end = src.indexOf('\n    ],', fAt);
  if (end < 0) { problems.push(`${stage}: unterminated formulas array`); continue; }
  const before = src.slice(fAt + 1, end + '\n    ],'.length - 1);
  const oldCards = (before.match(/name:/g) ?? []).length;
  src = src.slice(0, fAt + 1) + renderSheet(cards) + src.slice(end + '\n    ],'.length);
  console.log(`  ${stage.padEnd(20)} ${oldCards} card(s) -> ${cards.length}`);
  done++;
}

console.log(`\n${done}/${Object.keys(SHEETS).length} sheets rewritten${DRY ? ' (dry run)' : ''}`);
if (problems.length) { console.log(problems.map((p) => `  ✗ ${p}`).join('\n')); process.exit(1); }
if (!DRY) { writeFileSync(FILE, src, 'utf8'); console.log(`wrote ${FILE}`); }
