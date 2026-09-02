// ============================================================
// scripts/test-bank.ts — the BEHAVIOUR test for the growing question bank.
// ============================================================
//
// Run: npx tsx scripts/test-bank.ts   (wired into `npm run check`)
//
// `verify-bank.ts` checks that the invariants are still WRITTEN. This runs
// them: the real `searchBank`/`upsertIntoBank` against an in-memory stand-in
// for Postgres, over real bagrut questions with the OCR noise measured on a
// real printed page.
//
// THE TEST THIS FILE EXISTS FOR is #2 below. Two photographs of one page
// produce different OCR text, so different hashes, so `unique` does not stop
// a second row. Two near-identical rows are exactly what `findMatch`'s margin
// rule refuses to choose between — so without the merge, a bank that fills up
// answers FEWER questions than an empty one. That is a system that gets worse
// the more it is used, and it would look like "the matcher is flaky".
//
// ── What the stand-in does and does not prove ──────────────────────────────
// It emulates the SQL function's CONTRACT (reported_wrong < 3, similarity
// ordering, max_rows) with a trigram Jaccard instead of pg_trgm's own
// `similarity()`. So it proves the application logic — dedupe, promotion,
// demotion, collision guards, retrieval-after-write. It does NOT prove the
// index is used or that Hebrew trigrams tokenise correctly in the actual
// database; those need the real thing (`show_trgm` in the SQL file, and
// EXPLAIN ANALYZE on the candidate query).

import { searchBank, upsertIntoBank } from '../lib/mathscan/bank';
import { decideSolveQuota } from '../lib/mathscan/quota';
import { buildMatchIndex, findMatch } from '../lib/mathscan/match';
import { corpusIdf } from '../lib/solution-library';
import { normalizeQuestionText, fingerprint } from '../lib/question-match';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';

let passed = 0;
const failures: string[] = [];

function ok(condition: boolean, label: string): void {
  if (condition) passed++;
  else failures.push(label);
}

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual === expected) passed++;
  else failures.push(`${label} — קיבלתי ${JSON.stringify(actual)}, ציפיתי ${JSON.stringify(expected)}`);
}

// ------------------------------------------------------------
// The stand-in
// ------------------------------------------------------------

type Row = {
  id: string;
  question_hash: string;
  normalized_text: string;
  canonical_text: string;
  topic: string | null;
  unit_level: number;
  solution_markdown: string;
  quality_tier: 'new' | 'corroborated' | 'verified';
  cas_verified: boolean;
  agreement_count: number;
  served_count: number;
  reported_wrong: number;
};

function trigrams(s: string): Set<string> {
  const padded = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

/** Stand-in for pg_trgm `similarity()`. Not the same function — close enough
 *  to order candidates, which is all the SQL stage is responsible for. */
function similarity(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  return shared / (A.size + B.size - shared || 1);
}

class FakeSupabase {
  rows: Row[] = [];
  private nextId = 1;

  rpc(name: string, args: { q: string; max_rows: number }) {
    if (name !== 'search_question_bank') return Promise.resolve({ data: null, error: 'unknown rpc' });
    const data = this.rows
      .filter((r) => r.reported_wrong < 3)
      .map((r) => ({ ...r, sim: similarity(r.normalized_text, args.q) }))
      .filter((r) => r.sim >= 0.15) // the function-level similarity_threshold
      .sort((a, b) => b.sim - a.sim)
      .slice(0, Math.max(1, Math.min(args.max_rows, 50)));
    return Promise.resolve({ data, error: null });
  }

  from(table: string) {
    if (table !== 'question_bank') throw new Error(`unexpected table ${table}`);
    let filtered = [...this.rows];
    let limit = Infinity;
    let pending: { kind: 'insert'; values: Partial<Row> } | { kind: 'update'; values: Partial<Row> } | null =
      null;

    const builder = {
      select: () => builder,
      insert(values: Partial<Row>) {
        pending = { kind: 'insert', values };
        return builder;
      },
      update(values: Partial<Row>) {
        pending = { kind: 'update', values };
        return builder;
      },
      eq(column: keyof Row, value: unknown) {
        filtered = filtered.filter((r) => r[column] === value);
        return builder;
      },
      lt(column: keyof Row, value: number) {
        filtered = filtered.filter((r) => (r[column] as number) < value);
        return builder;
      },
      limit(n: number) {
        limit = n;
        return builder;
      },
      // Thenable: the real client resolves on await, not on a .execute().
      then: (resolve: (result: { data: Row[] | null; error: null }) => unknown) => {
        if (pending?.kind === 'insert') {
          const v = pending.values;
          // The unique constraint on question_hash is real — respect it, or
          // the test would let a duplicate-hash insert silently succeed.
          if (this.rows.some((r) => r.question_hash === v.question_hash)) {
            return resolve({ data: null, error: null });
          }
          this.rows.push({
            id: `row-${this.nextId++}`,
            question_hash: v.question_hash!,
            normalized_text: v.normalized_text!,
            canonical_text: v.canonical_text!,
            topic: v.topic ?? null,
            unit_level: v.unit_level ?? 5,
            solution_markdown: v.solution_markdown!,
            quality_tier: v.quality_tier ?? 'new',
            cas_verified: v.cas_verified ?? false,
            agreement_count: 1,
            served_count: 0,
            reported_wrong: 0,
          });
          return resolve({ data: null, error: null });
        }
        if (pending?.kind === 'update') {
          for (const row of filtered) Object.assign(row, pending.values);
          return resolve({ data: null, error: null });
        }
        return resolve({ data: filtered.slice(0, limit), error: null });
      },
    };
    return builder;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = () => new FakeSupabase() as any;

// ------------------------------------------------------------
// Realistic inputs
// ------------------------------------------------------------

/** The OCR errors measured on a real printed bagrut question, plus a seeded
 *  character drop. Same generator as bench-match.ts. */
function ocrNoise(s: string, seed: number, dropRate: number): string {
  let out = s
    .replace(/\\sqrt/g, 'N')
    .replace(/\^2/g, '°')
    .replace(/_1/g, '1')
    .replace(/_2/g, '2')
    .replace(/\\cdot/g, '.')
    .replace(/\\frac/g, 'frac')
    .replace(/\$/g, '');
  let n = seed || 1;
  out = [...out]
    .filter(() => {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      return n % 100 >= dropRate;
    })
    .join('');
  return out;
}

const longEnough = ALL_PAST_BAGRUYOT.filter(
  (q) => normalizeQuestionText([q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' ')).length > 160
);
const text = (i: number) => {
  const q = longEnough[i];
  return { text: [q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' '), topic: q.topic };
};

const A = text(0);
const B = text(1);
const SOLUTION = '## סעיף א\n\nמעבירים אגף כדי לבודד את המשתנה, ואז פותרים משוואה ריבועית.\n\nהתשובה: x = 3';

// ------------------------------------------------------------

async function main(): Promise<void> {
  // ---- 1. first scan of a question creates a row ----
  {
    const db = client();
    const r = await upsertIntoBank(db, {
      question: ocrNoise(A.text, 11, 4),
      solutionMarkdown: SOLUTION,
      topic: A.topic,
    });
    eq(r, 'inserted', '1. סריקה ראשונה יוצרת שורה');
    eq(db.rows.length, 1, '1. שורה אחת במאגר');
    eq(db.rows[0].quality_tier, 'new', "1. פתרון AI יחיד נכנס כ-'new'");
  }

  // ---- 2. THE CRITICAL ONE: a second photo of the same page MERGES ----
  {
    const db = client();
    await upsertIntoBank(db, { question: ocrNoise(A.text, 11, 4), solutionMarkdown: SOLUTION, topic: A.topic });
    const second = await upsertIntoBank(db, {
      question: ocrNoise(A.text, 977, 8), // different noise → different hash
      solutionMarkdown: SOLUTION,
      topic: A.topic,
    });

    eq(second, 'merged', '2. צילום שני של אותו דף מתמזג ולא יוצר שורה שנייה');
    eq(db.rows.length, 1, '2. עדיין שורה אחת אחרי שתי סריקות');
    eq(db.rows[0].agreement_count, 2, '2. agreement_count עלה ל-2');
    eq(db.rows[0].quality_tier, 'corroborated', '2. שתי הסכמות מקדמות ל-corroborated');

    // And the part that the whole design rests on: retrieval must still work
    // AFTER the write. This is what a second row would have broken.
    const hit = await searchBank(db, ocrNoise(A.text, 4242, 6), A.topic);
    ok(hit !== null, '2. חיפוש עדיין מוצא את השאלה אחרי הכתיבה השנייה');
    eq(hit?.id, db.rows[0].id, '2. וזו השורה הנכונה');
  }

  // ---- 3. a third scan keeps merging; tier does not inflate past corroborated ----
  {
    const db = client();
    for (const seed of [11, 977, 31337]) {
      await upsertIntoBank(db, { question: ocrNoise(A.text, seed, 5), solutionMarkdown: SOLUTION, topic: A.topic });
    }
    eq(db.rows.length, 1, '3. שלוש סריקות → שורה אחת');
    eq(db.rows[0].agreement_count, 3, '3. agreement_count = 3');
    eq(db.rows[0].quality_tier, 'corroborated', "3. הסכמות לא מקדמות ל-'verified' — רק CAS עושה את זה");
  }

  // ---- 4. two DIFFERENT questions stay apart ----
  {
    const db = client();
    await upsertIntoBank(db, { question: A.text, solutionMarkdown: SOLUTION, topic: A.topic });
    const r = await upsertIntoBank(db, { question: B.text, solutionMarkdown: SOLUTION, topic: B.topic });
    eq(r, 'inserted', '4. שאלה אחרת נוצרת כשורה חדשה');
    eq(db.rows.length, 2, '4. שתי שורות');

    const hitA = await searchBank(db, ocrNoise(A.text, 5, 5), A.topic);
    const hitB = await searchBank(db, ocrNoise(B.text, 7, 5), B.topic);
    eq(hitA?.canonicalText, A.text, '4. חיפוש A מחזיר A');
    eq(hitB?.canonicalText, B.text, '4. חיפוש B מחזיר B');
  }

  // ---- 5. a question nobody stored returns nothing ----
  {
    const db = client();
    await upsertIntoBank(db, { question: A.text, solutionMarkdown: SOLUTION, topic: A.topic });
    const stranger = await searchBank(
      db,
      'הוכח באינדוקציה שסכום הסדרה שווה n בריבוע עבור כל n טבעי גדול מאחת, ופרט את שלב הבסיס ואת שלב המעבר'
    );
    eq(stranger, null, '5. שאלה שלא במאגר לא מוצאת כלום');
  }

  // ---- 6. CAS-verified enters as verified and is never demoted by a merge ----
  {
    const db = client();
    await upsertIntoBank(db, {
      question: A.text,
      solutionMarkdown: SOLUTION,
      topic: A.topic,
      casVerified: true,
    });
    eq(db.rows[0].quality_tier, 'verified', "6. פתרון שה-CAS אימת נכנס כ-'verified'");
    await upsertIntoBank(db, { question: ocrNoise(A.text, 88, 6), solutionMarkdown: SOLUTION, topic: A.topic });
    eq(db.rows[0].quality_tier, 'verified', '6. מיזוג לא מוריד שורה מאומתת');
  }

  // ---- 7. text too short to dedupe against is not stored at all ----
  {
    const db = client();
    const r = await upsertIntoBank(db, { question: 'פתור: x+1=3', solutionMarkdown: SOLUTION });
    eq(r, 'skipped', '7. שאלה קצרה מדי לא נכנסת — אי אפשר יהיה למצוא אותה לעולם');
    eq(db.rows.length, 0, '7. המאגר נשאר ריק');
  }

  // ---- 8. an FNV-1a hash collision must not serve the wrong solution ----
  {
    const db = client();
    await upsertIntoBank(db, { question: B.text, solutionMarkdown: SOLUTION, topic: B.topic });
    // Force the collision: give B's row the hash that A's text produces.
    db.rows[0].question_hash = fingerprint(normalizeQuestionText(A.text));

    const hit = await searchBank(db, A.text, A.topic);
    ok(hit === null || hit.canonicalText !== B.text, '8. התנגשות hash לא מגישה את הפתרון של שאלה אחרת');
    eq(hit, null, '8. ובפועל — לא מוחזר כלום');
  }

  // ---- 9. three reports retire a row from search ----
  {
    const db = client();
    await upsertIntoBank(db, { question: A.text, solutionMarkdown: SOLUTION, topic: A.topic });
    db.rows[0].reported_wrong = 3;
    const hit = await searchBank(db, ocrNoise(A.text, 21, 4), A.topic);
    eq(hit, null, '9. שורה עם 3 דיווחים לא מוגשת');
    // And not through the exact-hash path either, which bypasses the RPC.
    const exact = await searchBank(db, A.text, A.topic);
    eq(exact, null, '9. גם לא דרך מסלול ה-hash המדויק');
  }

  // ---- 10. the app-side stage stays bounded as the bank grows ----
  //
  // The design claim is that table size is Postgres's problem: the app only
  // ever re-ranks CANDIDATE_ROWS rows. Measured here at 1 row and at 5,000 so
  // the claim is a number, not an assertion.
  {
    const db = client();
    await upsertIntoBank(db, { question: A.text, solutionMarkdown: SOLUTION, topic: A.topic });
    const t1 = Date.now();
    await searchBank(db, ocrNoise(A.text, 3, 5), A.topic);
    const small = Date.now() - t1;

    for (let i = 0; i < 5000; i++) {
      const src = longEnough[i % longEnough.length];
      const body = [src.context, ...src.parts.map((p) => p.prompt)].filter(Boolean).join(' ');
      const noisy = ocrNoise(body, i * 7 + 1, 6) + ` [#${i}]`;
      db.rows.push({
        id: `synthetic-${i}`,
        question_hash: fingerprint(normalizeQuestionText(noisy)),
        normalized_text: normalizeQuestionText(noisy),
        canonical_text: noisy,
        topic: src.topic,
        unit_level: 5,
        solution_markdown: SOLUTION,
        quality_tier: 'new',
        cas_verified: false,
        agreement_count: 1,
        served_count: 0,
        reported_wrong: 0,
      });
    }
    const t2 = Date.now();
    await searchBank(db, ocrNoise(A.text, 3, 5), A.topic);
    const large = Date.now() - t2;

    console.log(
      `\n   קנה מידה (צד האפליקציה בלבד): שורה 1 → ${small}ms · 5,001 שורות → ${large}ms` +
        `\n   ההפרש הוא הסריקה של התחליף ל-Postgres, לא הדירוג — הדירוג חסום ל-20 מועמדים.`
    );
    // No timing assertion: the stand-in scans linearly where Postgres uses a
    // GIN index, so a threshold here would measure the test, not the app.
  }

  // ---- 11. the IDF source, measured both ways ----
  //
  // A small index CANNOT derive its own IDF: `log(N/(1+df))` floors at 0, so
  // every token in a one-row index is worth nothing and MIN_SHARED_IDF
  // rejects the row. This is the number behind that claim, and it re-measures
  // on every run so the fix cannot be reverted quietly.
  {
    let withCorpus = 0;
    let withOwn = 0;
    const trials = 6;
    for (let i = 0; i < trials; i++) {
      const q = text(i);
      const entry = [{ id: 'only', topic: q.topic, text: q.text }];
      const noisy = ocrNoise(q.text, i * 13 + 5, 5);
      if (findMatch(buildMatchIndex(entry, { idf: corpusIdf() }), noisy, { topicHint: q.topic })) {
        withCorpus++;
      }
      if (findMatch(buildMatchIndex(entry), noisy, { topicHint: q.topic })) withOwn++;
    }
    console.log(`   מקור ה-IDF במאגר בן שורה אחת: קורפוס ${withCorpus}/${trials} · עצמי ${withOwn}/${trials}`);
    eq(withCorpus, trials, '11. עם IDF מהקורפוס — מאגר בן שורה אחת מוצא את השאלה שלו');
    eq(withOwn, 0, '11. עם IDF עצמי — הוא לא מוצא כלום. זה הבאג שהתיקון מונע.');
  }

  // ---- 12. the daily solve quota ----
  //
  // Unreachable from outside without a signed-in FREE account, and the only
  // real account is Pro (isProUser is true for the owner's email only). So
  // this is where the quota is actually verified.
  {
    const free = (usedToday: number) => decideSolveQuota({ pro: false, usedToday });
    const pro = (usedToday: number) => decideSolveQuota({ pro: true, usedToday });

    /** -1 when the decision was a refusal, so a wrong branch fails loudly
     *  instead of quietly comparing undefined. */
    const remaining = (d: ReturnType<typeof decideSolveQuota>) => (d.allowed ? d.remaining : -1);

    eq(free(0).allowed, true, '12. תלמיד חינמי חדש רשאי לפתור');
    eq(remaining(free(0)), 3, '12. ונשארו לו 3');
    eq(free(2).allowed, true, '12. הפתרון השלישי עדיין מותר');
    eq(remaining(free(2)), 1, '12. ונשאר לו 1');
    eq(free(3).allowed, false, '12. הרביעי נחסם');
    eq(free(99).allowed, false, '12. וגם הרבה מעבר לזה');

    const blocked = free(3);
    if (blocked.allowed) {
      ok(false, '12. אמור להיחסם');
    } else {
      eq(blocked.status, 429, '12. הסטטוס הוא 429 (מכסה), לא 500 (שגיאה)');
      eq(blocked.proRequired, true, '12. ומסומן שדרוג אפשרי');
      // The wording is the product here: this is the one moment a student
      // doing everything right is told "no".
      ok(
        blocked.message.includes('חינם') && blocked.message.includes('מאגר'),
        '12. ההודעה אומרת במפורש שהמאגר נשאר חינם — לא מבוי סתום'
      );
      ok(
        !/שגיאה|תקלה|נכשל/.test(blocked.message),
        '12. וההודעה לא נשמעת כמו תקלה'
      );
    }

    eq(pro(3).allowed, true, '12. ל-Pro יש תקרה גבוהה בהרבה');
    eq(pro(149).allowed, true, '12. Pro עדיין רשאי ב-149');
    eq(pro(150).allowed, false, '12. אבל Pro אינו בלתי מוגבל — לקוח משתולל שורף את התקציב');
    const proBlocked = pro(150);
    eq(proBlocked.allowed === false ? proBlocked.proRequired : true, false, '12. ל-Pro לא מוצע לשדרג');

    // Defensive: a negative count (clock skew, a bad read) must not silently
    // hand out extra solves beyond the cap.
    eq(remaining(free(-5)), 3, '12. ספירה שלילית לא נותנת מכסה עודפת');
  }

  // ------------------------------------------------------------
  console.log(`\nquestion-bank behaviour: ${passed + failures.length} טענות`);
  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} כשלים:\n`);
    for (const f of failures) console.error(`  · ${f}`);
    process.exit(1);
  }
  console.log('✅ כל הטענות עברו\n');
}

void main();
