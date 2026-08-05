// ============================================================
// scripts/verify-bank.ts — the CONTRACT gate for the growing question bank.
// ============================================================
//
// Run: npx tsx scripts/verify-bank.ts   (wired into `npm run check`)
//
// The bank is the one part of the scanner that gets WORSE if it is wired
// wrong: every scan writes to it, so a broken invariant compounds with usage
// instead of showing up once. Each check below is a failure that would be
// invisible in review and expensive in production.
//
//   1. DEDUPLICATION EXISTS. Without the merge-on-write, two photos of one
//      page create two near-identical rows — and near-identical rows are
//      exactly what `findMatch`'s margin rule refuses to choose between. The
//      bank would degrade retrieval as it grew. This is the failure the whole
//      design exists to prevent.
//   2. The dedupe search runs with NO margin. Using the serving margin here
//      would refuse to resolve the duplicate it was called to find, and so
//      create a third copy.
//   3. The CLUSTER-AWARE margin is still in `findMatch`. It is the second
//      line of defence for when a concurrent scan wins the race and leaves a
//      duplicate behind anyway.
//   4. READS ARE PUBLIC in the SQL. `solution_cache` grants select to
//      `authenticated` only, so an anonymous student sees an empty table —
//      copying that pattern here would silently kill the free path for
//      exactly the students who have not signed up yet.
//   5. NO TIER IS PROMISED WITHOUT A SIGNAL. `verified` may only come from
//      hand-authored content or a CAS proof; a single unchecked AI solution
//      must never be labelled as verified. This app has already served a
//      confidently-wrong answer twice.
//   6. Reports demote AND retire. Three reports must remove a row from search
//      inside the SQL function, so a stale client cannot serve it.
//   7. The trigram index is a GIN index over `normalized_text`, and the
//      candidate query uses the `%` operator — a bare `similarity() > x`
//      predicate cannot use the index and degrades to a sequential scan.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');

const errors: string[] = [];
let checks = 0;

function check(condition: boolean, message: string): void {
  checks++;
  if (!condition) errors.push(message);
}

function read(relative: string): string {
  try {
    return readFileSync(join(ROOT, relative), 'utf8');
  } catch {
    errors.push(`קובץ חסר: ${relative}`);
    return '';
  }
}

const bank = read('lib/mathscan/bank.ts');
const match = read('lib/mathscan/match.ts');
const sql = read('supabase-question-bank.sql');
const route = read('app/api/scan-solve/route.ts');
const panel = read('components/scan/SolutionPanel.tsx');

/** Strip line and block comments so a check never passes on prose that merely
 *  DESCRIBES the invariant. Every rule in this file is about executable code,
 *  and this whole repo comments heavily — matching a comment would make the
 *  gate green on a file where the code was deleted. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

const bankCode = code(bank);
const matchCode = code(match);
const routeCode = code(route);
const panelCode = code(panel);
/** JSX attributes survive the comment stripper, so the usage site is matched
 *  against the raw file — `code()` would not remove them anyway, but reading
 *  the raw text here makes the intent explicit. */
const panelUsage = read('app/scan/page.tsx');
// SQL comments are `--`; block comments are not used in the file.
const sqlCode = sql.replace(/^\s*--[^\n]*$/gm, ' ');

// ------------------------------------------------------------
// 1-2. Deduplication on write
// ------------------------------------------------------------

check(
  /export\s+async\s+function\s+upsertIntoBank/.test(bankCode),
  'bank.ts: אין upsertIntoBank — בלי מיזוג-בכתיבה כל סריקה חוזרת יוצרת שורה כפולה, וזה שובר את ההתאמה.'
);

check(
  /searchBank\s*\([\s\S]{0,400}?margin\s*:\s*DEDUPE_MARGIN/.test(bankCode),
  'bank.ts: upsertIntoBank חייב לחפש עם margin: DEDUPE_MARGIN — חיפוש עם המרווח הרגיל מסרב להכריע בין כפילויות ולכן יוצר עוד אחת.'
);

check(
  // `\b` after the 0 would accept `0.08` — the "." is a non-word character,
  // so the boundary matches. Anchor on the semicolon instead.
  /const\s+DEDUPE_MARGIN\s*=\s*0\s*;/.test(bankCode),
  'bank.ts: DEDUPE_MARGIN חייב להיות 0. המרווח הוא הגנת-הגשה, לא כלי לזיהוי כפילות.'
);

check(
  /agreement_count\s*:/.test(bankCode) && /agreementCount\s*\+\s*1/.test(bankCode),
  'bank.ts: מיזוג חייב להעלות agreement_count — זה הסיגנל היחיד שמקדם פתרון ל-corroborated.'
);

/** A per-request candidate index cannot derive its own IDF — at the sizes a
 *  new bank has, every token floors to 0 and MIN_SHARED_IDF then rejects
 *  every row. Measured: one-row bank, 0/6 with its own IDF, 6/6 with the
 *  corpus IDF (`npm run test:bank` prints both). Silent when broken: a
 *  matcher that finds nothing is indistinguishable from an empty table. */
check(
  /buildMatchIndex\([\s\S]{0,300}?idf\s*:\s*corpusIdf\(\)/.test(bankCode),
  'bank.ts: החיפוש חייב להשתמש ב-IDF של הקורפוס. IDF שנגזר מ-20 מועמדים מתאפס, וכל פגיעה במאגר נדחית בשקט.'
);

check(
  /buildMatchIndex\([\s\S]{0,400}?idf\s*:\s*corpusIdf\(\)/.test(code(read('lib/solution-cache.ts'))),
  'solution-cache.ts: לחיפוש המטושטש יש אותה בעיה — חלון של 200 שורות לא יכול לגזור IDF משלו.'
);

// ------------------------------------------------------------
// 3. The cluster-aware margin (the safety net)
// ------------------------------------------------------------

check(
  /DUPLICATE_TRIGRAM_OVERLAP/.test(matchCode),
  'match.ts: המרווח מודע-האשכולות נעלם. בלעדיו כפילות אחת ששרדה את המיזוג מחזירה null לכל חיפוש של אותה שאלה.'
);

check(
  /jaccardSets\s*\([\s\S]{0,200}?DUPLICATE_TRIGRAM_OVERLAP/.test(matchCode),
  'match.ts: המרווח מודע-האשכולות חייב להשוות חפיפת טריגרמות בין המנצח למקום השני לפני שהוא פוסל אותו.'
);

/**
 * The length gate is the whole safety of the duplicate guard, and removing it
 * is a one-line change that no test of "does the bank match?" would catch.
 *
 * Measured over every pair of different corpus questions: at ≥40 characters
 * two DIFFERENT questions reach 1.000 overlap, so no threshold separates them
 * — `f(x)=e^x-1` vs `f(x)=e^{2x}-1` differ by two characters and have
 * different answers. At ≥200 characters different questions top out at 0.464.
 * An ungated guard merges those two, suppresses the rival that was protecting
 * the student, and serves the wrong worked solution.
 */
check(
  /const\s+DUPLICATE_MIN_LENGTH\s*=\s*200\s*;/.test(matchCode),
  'match.ts: חסר רף האורך לזיהוי כפילות. בלעדיו שתי שאלות שונות שנבדלות בתו אחד נחשבות לאותה שאלה.'
);
check(
  /function\s+isSameQuestion[\s\S]{0,400}?normalized\.length\s*<\s*DUPLICATE_MIN_LENGTH[\s\S]{0,120}?return\s+false/.test(
    matchCode
  ),
  'match.ts: isSameQuestion חייב לצאת מוקדם מתחת לרף האורך — לפני שהוא בכלל בודק חפיפה.'
);
check(
  !/OVERLAP_ANY_LENGTH/.test(matchCode),
  'match.ts: כלל "חפיפה גבוהה בכל אורך" נמדד כלא-בטוח (שאלות שונות מגיעות ל-1.000) והוסר. אל תחזיר אותו.'
);

check(
  /const\s+MIN_QUERY_LENGTH\s*=\s*40\s*;/.test(matchCode) &&
    /const\s+MIN_INDEX_LENGTH\s*=\s*20\s*;/.test(matchCode),
  'match.ts: רצפות האורך התערבבו. הפעלת רצפת השאילתה (40) גם על האינדקס הפילה את הפגיעה מ-90.2% ל-70.2%.'
);

// ------------------------------------------------------------
// 4. Public reads
// ------------------------------------------------------------

check(
  /for\s+select\s+to\s+anon\s*,\s*authenticated/i.test(sqlCode),
  'SQL: קריאה מ-question_bank חייבת להיות פתוחה ל-anon. אחרת תלמיד לא מחובר מקבל מאגר ריק — בדיוק המסלול החינמי שהמאגר קיים בשבילו.'
);

check(
  /grant\s+execute\s+on\s+function\s+public\.search_question_bank[^;]*to\s+anon/i.test(sqlCode),
  'SQL: פונקציית החיפוש חייבת להיות ניתנת להרצה ע״י anon, אחרת החיפוש נכשל דווקא למי שלא מחובר.'
);

check(
  !/grant\s+execute\s+on\s+function\s+public\.report_bank_wrong[^;]*anon/i.test(sqlCode),
  'SQL: דיווח "שגוי" חייב לדרוש חשבון — דיווח אנונימי לא ניתן לייחוס והופך את הסיגנל היחיד שיש לניתן-לספאם.'
);

check(
  /if\s*\(!user\)/.test(routeCode.split("mode === 'report'")[1]?.slice(0, 400) ?? ''),
  'route.ts: מצב report חייב לדרוש משתמש מחובר לפני שהוא כותב.'
);

// ------------------------------------------------------------
// 5. No tier is promised without a signal
// ------------------------------------------------------------

check(
  /quality_tier\s*:\s*entry\.casVerified\s*\?\s*'verified'\s*:\s*'new'/.test(bankCode),
  "bank.ts: שורה חדשה יכולה להיכנס כ-verified רק אם ה-CAS אימת אותה. פתרון AI יחיד הוא 'new'."
);

check(
  !/casVerified\s*:\s*true/.test(routeCode),
  'route.ts: הראוט לא מאמת שום דבר בעצמו — casVerified: true משם מסמן פתרון AI לא-בדוק כ"מאומת".'
);

check(
  /agreement\s*>=\s*2\s*\?\s*'corroborated'/.test(bankCode),
  "bank.ts: קידום ל-corroborated חייב לדרוש agreement_count >= 2."
);

/** The badge a student actually reads. "מאומת" is the app's strongest claim
 *  and it must not appear on the `new` tier — a badge that overstates
 *  confidence is how a wrong answer becomes a wrong answer that is trusted. */
const newTierBadge = panelCode.match(/new\s*:\s*\{[\s\S]{0,300}?\}/)?.[0] ?? '';
check(
  newTierBadge.length > 0,
  'SolutionPanel.tsx: אין תג לרמה new — פתרון AI לא-בדוק יוצג עם תג של רמה אחרת.'
);
check(
  !/מאומת/.test(newTierBadge),
  'SolutionPanel.tsx: התג של הרמה new מבטיח "מאומת" בלי שום סיגנל שאימת אותו.'
);
check(
  /caveat/.test(newTierBadge),
  'SolutionPanel.tsx: הרמה new חייבת להציג הסתייגות — התלמיד צריך לדעת שאף אחד לא בדק את הפתרון הזה.'
);

// ------------------------------------------------------------
// 6. Reporting demotes and retires
// ------------------------------------------------------------

check(
  /reported_wrong\s*\+\s*1\s*>=\s*2\s*then\s*'new'/i.test(sqlCode),
  'SQL: שני דיווחים חייבים להוריד את השורה חזרה ל-new.'
);

check(
  /where\s+b\.reported_wrong\s*<\s*3/i.test(sqlCode),
  'SQL: שלושה דיווחים חייבים להוציא את השורה מהחיפוש בתוך הפונקציה — לקוח ישן לא יכול לעקוף את זה.'
);

check(
  /\.lt\('reported_wrong'\s*,\s*3\)/.test(bankCode),
  'bank.ts: גם מסלול ה-hash המדויק חייב לסנן שורות שדווחו — הוא עוקף את פונקציית ה-SQL.'
);

// ------------------------------------------------------------
// 7. The index is actually used
// ------------------------------------------------------------

check(
  /create\s+extension\s+if\s+not\s+exists\s+pg_trgm/i.test(sqlCode),
  'SQL: pg_trgm חייב להיות מופעל, אחרת האינדקס לא נוצר בכלל.'
);

check(
  /using\s+gin\s*\(\s*normalized_text\s+gin_trgm_ops\s*\)/i.test(sqlCode),
  'SQL: חסר אינדקס GIN טריגרם על normalized_text — החיפוש יעבוד ב-200 שורות וייפול ב-20,000.'
);

check(
  /b\.normalized_text\s*%\s*q/.test(sqlCode),
  'SQL: החיפוש חייב להשתמש באופרטור % — רק הוא משתמש באינדקס. similarity() > x מייצר סריקה סדרתית.'
);

check(
  !/\bselect\s+set_limit\s*\(/i.test(sqlCode),
  'SQL: set_limit() הוא VOLATILE ולא ניתן לקריאה מפונקציה STABLE. הסף נקבע ב-SET ברמת הפונקציה.'
);

check(
  /set\s+pg_trgm\.similarity_threshold/i.test(sqlCode),
  'SQL: בלי הורדת סף הדמיון, רעש OCR דוחף התאמה אמיתית מתחת ל-0.3 והמועמדים חוזרים ריקים.'
);

// ------------------------------------------------------------
// 8. Wiring: the bank is searched, written, and rendered
// ------------------------------------------------------------

// Compare CALL SITES, not the first mention: both names also appear in the
// import block at the top of the file, where the order is alphabetical and
// says nothing about execution order.
const bankCall = routeCode.indexOf('await searchBank(');
const cacheCall = routeCode.indexOf('await getCachedSolution(');
check(
  bankCall > 0 && cacheCall > 0 && bankCall < cacheCall,
  'route.ts: חיפוש במאגר חייב לרוץ לפני ה-cache (סטטי → מאגר → cache → AI).'
);

check(
  /await\s+upsertIntoBank\s*\(/.test(routeCode),
  'route.ts: הכתיבה למאגר חייבת להיות awaited לפני controller.close() — פונקציה serverless עלולה לקפוא מיד עם סיום התגובה.'
);

/** A bank row holds a whole markdown document. Returning it as a one-element
 *  steps[] renders it inside a numbered card with a blank heading — the exact
 *  layout the owner reported as מסורבל on a real scan. */
check(
  // The leading boundary matters: without it `xmarkdown:` satisfies the test.
  /(^|[^A-Za-z_])markdown\s*:\s*bankHit\.solutionMarkdown/m.test(routeCode),
  'route.ts: פגיעה מהמאגר חייבת לחזור כ-markdown, לא כצעד בודד ללא כותרת.'
);

const quotaCode = code(read('lib/mathscan/quota.ts'));

check(
  /export\s+const\s+FREE_DAILY_SOLVE\s*=\s*[1-9]\d*\s*;/.test(quotaCode),
  'quota.ts: אין מכסה יומית חינמית — בלעדיה רק בעל האפליקציה יכול להזין את המאגר.'
);

check(
  /decideSolveQuota\s*\(/.test(routeCode),
  'route.ts: הראוט חייב להשתמש ב-decideSolveQuota ולא בהחלטה מוטמעת — החלטה מוטמעת לא ניתנת לבדיקה בלי חשבון חינמי.'
);

/** The refusal must read as a limit on NEW solutions, not as a broken app.
 *  It is the one moment a student doing everything right is told "no". */
check(
  /message[\s\S]{0,400}?חינם[\s\S]{0,200}?מאגר|message[\s\S]{0,400}?מאגר[\s\S]{0,200}?חינם/.test(quotaCode),
  'quota.ts: הודעת החסימה חייבת לומר שהמאגר נשאר חינם — אחרת תלמיד חושב שננעל בפניו.'
);

check(
  /Math\.max\(\s*0\s*,/.test(quotaCode),
  'quota.ts: ספירה שלילית (שעון/קריאה שגויה) חייבת להיחסם, אחרת היא מחלקת מכסה עודפת.'
);

check(
  /scansToday\s*\(\s*supabase\s*,\s*user\.id\s*,\s*'ai'\s*\)/.test(routeCode),
  "route.ts: המכסה חייבת לספור רק סריקות source='ai'. ספירת כל הסריקות תחסום תלמיד בגלל פגיעות חינמיות מהמאגר."
);

// ------------------------------------------------------------
// 9. No dead ends
// ------------------------------------------------------------
//
// THE bug that made the scanner feel broken, and the one hardest to see in
// review: every `finalize({ ... explanations: {} ... })` is a refusal, and a
// refusal carrying `blocked: null` renders as one generic empty state —
// "עוד לא פתרנו את השאלה הזאת · תקן את הטקסט למעלה".
//
// For a signed-out student that advice is FALSE. The solve path is closed no
// matter how clean the text is, so they edit, retry, fail, and conclude the
// app is broken. Reproduced end-to-end on a real photograph: 7.3 seconds, a
// perfectly legible question on screen, and no solution and no reason.
//
// So: no refusal may carry a null reason. Each must say what happened and
// what to do about it — and a 401 in particular must reach the student as a
// sign-in call to action, not as a red error box.
const pipelineCode = code(read('lib/mathscan/pipeline.ts'));

const refusals = [...pipelineCode.matchAll(/explanations:\s*\{\s*\}/g)].length;
check(refusals >= 3, 'pipeline.ts: לא נמצאו מסלולי סירוב — הבדיקה הזאת כבר לא בודקת את מה שהיא חושבת.');

check(
  !/explanations:\s*\{\s*\}[\s\S]{0,400}?blocked:\s*null/.test(pipelineCode),
  'pipeline.ts: יש מסלול שמחזיר "אין פתרון" בלי סיבה. זה בדיוק המבוי הסתום שגרם למערכת להיראות שבורה — כל סירוב חייב לומר למה ומה לעשות.'
);

check(
  /blocked:\s*\{[\s\S]{0,200}?status:\s*401/.test(pipelineCode),
  'pipeline.ts: מסלול "אין חשבון" חייב לסמן 401, אחרת ה-UI לא יודע להציע התחברות במקום להציג שגיאה.'
);

/** Exactly ONE 401 message reaches the student. The page owns upsells (it
 *  renders UpsellCard with a button), so the panel must stay silent on 401 —
 *  showing both produced two stacked sign-in boxes. */
check(
  /blocked\?\.status\s*===\s*401[\s\S]{0,120}?return\s+null/.test(panelCode),
  'SolutionPanel.tsx: על 401 הפאנל חייב להחזיר null — ה-UpsellCard בעמוד כבר אומר את זה עם כפתור, ושתי הודעות זהות זו על זו נראות שבורות.'
);

check(
  /needsLogin\s*&&\s*\(\s*<UpsellCard/.test(panelUsage),
  'page.tsx: חייב להיות UpsellCard אחד ל-401 עם כפתור התחברות.'
);

/** The 401 card must not blame the photo. A 401 also arrives when the read
 *  was perfect and the question simply is not in the bank yet. */
check(
  !/הזיהוי המקומי לא הצליח לקרוא את התמונה/.test(
    panelUsage.split('needsLogin')[1]?.slice(0, 600) ?? ''
  ),
  'page.tsx: הודעת ה-401 לא יכולה להאשים את התמונה — לרוב הקריאה הייתה תקינה והשאלה פשוט עוד לא במאגר.'
);

check(
  /blocked\.status\s*!==\s*401/.test(code(read('app/scan/page.tsx'))),
  'page.tsx: אסור להציג 401 גם בתיבת השגיאה האדומה — זה אומר לתלמיד שהאפליקציה נכשלה במקום להזמין אותו להתחבר.'
);

check(
  /<SolutionPanel[^>]*blocked=\{/.test(panelUsage),
  'page.tsx: SolutionPanel חייב לקבל את סיבת החסימה, אחרת המצב הריק שלו לא יכול להסביר כלום.'
);

// ------------------------------------------------------------

console.log(`\nquestion-bank contract: ${checks} בדיקות`);
if (errors.length > 0) {
  console.error(`\n❌ ${errors.length} כשלים:\n`);
  for (const e of errors) console.error(`  · ${e}`);
  process.exit(1);
}
console.log('✅ כל הבדיקות עברו\n');
