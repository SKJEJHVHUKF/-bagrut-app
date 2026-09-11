/** The mechanism detectors of the מנה ושורש difficulty gate — ONE copy, imported
 *  by scripts/_rq-extra-check.ts (which scores with them) and by
 *  scripts/test-rq-detectors.ts (which pins each one to real inflected text).
 *  They used to live in both files as two hand-synced regex lists. */
export const MECHANISMS: [string, RegExp][] = [
  ['domain', /תחום ההגדרה|תחום הגדרה|מוגדרת עבור|מכנה שונה מ|ביטוי שתחת השורש|אי[- ]שוויון/],
  // 🔴 Write these to survive the definite article: "האסימפטוטה האופקית" must
  // match as surely as "אסימפטוטה אופקית". A gate that misses the inflected form
  // silently scores a question lower and then blames it for restating an easier
  // one — the same trap as /משלים/ vs /המשלימה/ in the probability gate.
  ['vertical-asymptote', /אסימפטוט\S*\s+\S*אנכי|מאפסי המכנה/],
  ['horizontal-asymptote', /אסימפטוט\S*\s+\S*אופקי|כאשר \$?x\$? שואף|שואף לאינסוף/],
  // Every one of these must survive the definite article: "הנגזרת הפנימית",
  // "נקודת הקיצון", "טבלת הסימנים". Three separate mechanism regexes have now
  // been caught missing an inflected form and scoring a question low for it,
  // so the words are joined with \s+\S* rather than a literal space.
  ['quotient-rule', /כלל\s+\S*מנה|נגזרת\s+(?:של\s+)?\S*מנה|u'v ?- ?uv'/],
  ['chain-rule', /נגזרת\s+(?:של\s+)?\S*שורש|נגזרת\s+\S*פנימית|\\dfrac\{1\}\{2\\sqrt/],
  ['extremum', /נקוד\S*\s+\S*קיצון|מקסימום|מינימום|מאפסים את הנגזרת/],
  ['monotonicity', /עולה|יורדת|תחומי\s+\S*עלייה|תחומי\s+\S*ירידה|טבלת\s+\S*סימנים/],
  ['sign-table', /טבלת\s+\S*סימנים|סימן\s+\S*נגזרת|טבלה של סימנים/],
  // NOT "גרף הפונקציה": naming the graph is not drawing it, and every question
  // whose stem said "מצאו … של גרף הפונקציה" was collecting a sketch's 2.5
  // points without a sketch. Found by an author whose five new questions all
  // scored high for the wrong reason.
  ['sketch', /סקיצה|סרטט|שרטט/],
  ['integral', /אינטגרל|פונקציה קדומה|הקדומה|שטח הכלוא|\\int/],
  ['intersections', /נקודות החיתוך|חיתוך עם הציר|מציבים \$?y ?= ?0|f\(x\) ?= ?0/],
  // The last alternative read `\\bg\(` — a literal backslash then "bg", which no
  // content contains, so it never fired. `\b` would have been no better: it is a
  // boundary between \w and non-\w, and a Hebrew letter is not \w, so beside
  // Hebrew there is no boundary at all and /\bWORD\b/ matches NOTHING. The
  // Unicode lookaround is the form that works on both sides.
  ['transformation', /הזזה|שיקוף|מתיחה|הזזת גרף|(?<!\p{L})g\(x\) ?= ?f\(/u],
  ['tangent', /משיק|שיפוע המשיק|משוואת המשיק/],
  ['parameter', /פרמטר|עבור אילו ערכים|מצאו את הערך של \$?[a-z]\$?|תלוי ב\$?[a-z]\$?/],
  // ⚠️ Fires on ANY f' — a derivative merely computed, not a derivative GRAPH
  // read or drawn (75 of 285 track questions, 2026-09-11). Left as is: fixing it
  // re-scores every stage at once, which is its own round.
  ['derivative-graph', /גרף הנגזרת|f\s*['׳]|הנגזרת השנייה|f''/],
  ['second-derivative', /נגזרת שנייה|נקודת פיתול|קמור|קעור/],
  // Telling a hole from an asymptote is its own move: both come from a zero of
  // the denominator, and only the numerator decides which one it is.
  ['hole', /חור בגרף|חור ב(?:ערך|נקודה)|נקודה חסרה|שני הצדדים מתאפסים/],

  // ── Thinking-section moves (2026-09-11) ──────────────────────────────────
  // The late sections of the 571 archive build a NEW function from f (1/f²,
  // f·g, g' = f, √f), fold it (|f − c|), lean on parity, or count the solutions
  // of f(x) = k — and none of that had a detector, so a real ד/ה section scored
  // like a warm-up: rq-sub-tr-007, a hard k-line question, scored 8.5 against a
  // warm-up rung averaging 11.9. Each pattern below was read against the whole
  // corpus first (scripts/_probe-rq-thinking-detectors.ts), and each exclusion
  // names the false positive it removes.
  //
  // parity: an odd POWER ("בחזקה אי-זוגית", sequences) and the parity of an
  // exponent ("זוגיות $n$") are not a function's symmetry.
  ['parity', /(?<!\p{L})(?<!אי[- ])(?<!חזקה\s)ה?(?:אי[- ])?זוגית(?!\p{L})|(?<!\p{L})ה?זוגיות(?!\s*\$?n)(?!\p{L})|סימטרי\S*\s+(?:ביחס|סביב)/u],
  // solution-count: keyed on the COUNT. "מקבלים שני פתרונות" said while solving
  // is narration, not the move, and is deliberately absent. "הישר $y = k$" is
  // how 2025 מועד ב q7/ו asks it, and the first version of this pattern missed it.
  ['solution-count', /מספר הפתרונות|כמה פתרונות|פתרון יחיד|בדיוק פתרון|אין (?:לה )?פתרונות?|ישר ה?אופקי|הישר \$?y ?= ?k|כמה נקודות משותפות|מספר הנקודות המשותפות|בדיוק נקוד\S*\s+משותפ/],
  // absolute: of a FUNCTION. |∫f dx| and "ערך מוחלט מכל חלק" in the integral
  // stage are area bookkeeping, not the fold.
  ['absolute', /(?<!\p{L})ה?ערך ה?מוחלט של \$?[fgh]|\|\s*f\(x\)|\\big\|\s*f/u],
  // built-from-f: a NONLINEAR operation applied to f — reciprocal, power, root,
  // product, or f as the derivative of g. A shift or reflection g = f(x−a) + c
  // is `transformation` and does not fire here. The root may carry a factor and
  // the product may pair g with g' — √(a·f'(x)) and g·g' are both 2026 forms.
  ['built-from-f', /\\dfrac\{[^{}]*\}\{\s*(?:\\big\(|\\left\(|\()?f\(x\)|f\(x\)\s*(?:\\big\)|\\right\)|\))\^|\\sqrt\{[^{}]*?f\s*'?\(x\)|[fgh]\(x\)\s*\\cdot\s*[fgh]\s*'?\(x\)|[gh]\s*'\s*\(x\)\s*=\s*f\(x\)/],
];
