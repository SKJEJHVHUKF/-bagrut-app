/**
 * paper-571.ts — the study track for שאלון 571, transcribed from the owner's
 * syllabus document ("רשימת תתי נושאים בשאלות וסדר הלימוד לפי תוכנית 571",
 * 2026-08-17). Topic order, tile order and tile names follow the document;
 * each tile is bound to the existing sub-topic whose lesson + ladder teach it.
 *
 * Merge rule (owner's decision): syllabus items that are the CONTENT of one
 * existing sub-topic (the five arithmetic-sequence items, the four steps of an
 * optimisation problem, …) become ONE tile whose `bullets` list them, so no two
 * neighbouring tiles open the same ladder. Items with no authored content are
 * `soon` tiles, kept in their place. Items that already have their own screen
 * (mixed bagrut practice, the quick quiz) are `link` tiles.
 *
 * Tiles marked "not in the syllabus" below are existing content the track
 * would otherwise strand (a full ladder nobody could reach); the owner can
 * drop any of them by deleting one line. `volume-revolution` is deliberately
 * NOT here — the syllabus folds all integrals into one item and volume of
 * revolution belongs to 572; if that reading is wrong, add
 * `{ kind: 'ladder', subId: 'volume-revolution' }` after חישוב שטחים and drop
 * it from EXCLUDED_571 in content/tracks/index.ts.
 */

import type { TrackTree } from './types';

/** The topic's own mixed-bagrut practice screen (LessonView's "בגרות מלאה"). */
const bagrutPractice = (lessonTopic: string) =>
  `/practice/math5/${encodeURIComponent(lessonTopic)}/exercise?mode=bagrut`;

export const TRACK_571: TrackTree = {
  paper: '571',
  topics: [
    {
      // סדרות (owner, 2026-08-19): opening the topic offers a choice between
      // סדרות חשבוניות and סדרות הנדסיות, and each is climbed as four stages of
      // its own. The stage sub-topics live in content/lessons/math5/
      // sequences-arithmetic.ts / sequences-geometric.ts. אינדוקציה and the
      // mixed-bagrut link stay outside the two groups ("עוד בנושא").
      id: 'sequences',
      title: 'סדרות',
      emoji: '⋯',
      groups: [
        { id: 'arithmetic', title: 'סדרות חשבוניות', emoji: '➕', tagline: 'הפרש קבוע — ארבעה שלבים, מהאיבר הכללי ועד שאלות בסגנון בגרות' },
        { id: 'geometric', title: 'סדרות הנדסיות', emoji: '✖️', tagline: 'מנה קבועה — ארבעה שלבים, מהאיבר הכללי ועד סדרה אינסופית ושאלות בגרות' },
      ],
      tiles: [
        // ---- סדרות חשבוניות ---------------------------------------------
        {
          kind: 'ladder',
          group: 'arithmetic',
          subId: 'ar-general-term',
          title: 'סדרה חשבונית — הפרש, איבר ראשון ואיבר כללי',
          bullets: [
            'מהי סדרה חשבונית — ההפרש $d$ והאיבר הראשון $a_1$',
            'נוסחת האיבר הכללי $a_n = a_1 + (n-1)d$',
            'מציאת איבר כללי מתוך הפרש ואיבר ראשון',
            'משחק עם הנעלמים — מוצאים $a_1$, $d$ או $n$',
          ],
        },
        {
          kind: 'ladder',
          group: 'arithmetic',
          subId: 'ar-recursion-sums',
          title: 'כלל נסיגה, הוכחה שסדרה היא חשבונית ונוסחאות הסכום',
          bullets: [
            'כלל הנסיגה והגדרת איבר לפי כלל הנסיגה',
            'הוכחה שסדרה היא סדרה חשבונית',
            'נוסחאות הסכום של סדרה חשבונית וכיצד לעבוד איתן',
          ],
        },
        {
          kind: 'ladder',
          group: 'arithmetic',
          subId: 'ar-positions-sums',
          title: 'מקומות זוגיים ואי-זוגיים, וסכומי איברים ראשונים, אחרונים ואמצעיים',
          bullets: [
            'האיברים במקומות הזוגיים והאי-זוגיים',
            'סכום $n$ האיברים הראשונים והאחרונים',
            'סכום האיברים האמצעיים',
          ],
        },
        {
          kind: 'ladder',
          group: 'arithmetic',
          subId: 'ar-practice',
          title: 'תרגול מסכם — שאלות בסגנון בגרות, קלות יותר',
          bullets: [
            'שאלות קצה שמשלבות את כל הנושאים',
            'תרגילים שדומים לבגרות אבל קלים יותר',
          ],
        },
        // ---- סדרות הנדסיות ----------------------------------------------
        {
          kind: 'ladder',
          group: 'geometric',
          subId: 'ge-general-term',
          title: 'סדרה הנדסית — המנה, האיבר הכללי ומיקום של איבר',
          bullets: [
            'נוסחת האיבר הכללי של סדרה הנדסית $a_n = a_1 q^{n-1}$',
            'איך מוצאים מיקום של איבר בסדרה הנדסית',
            'מציאת המנה משני איברים',
          ],
        },
        {
          kind: 'ladder',
          group: 'geometric',
          subId: 'ge-proof-sum',
          title: 'הוכחה שסדרה היא הנדסית ונוסחת הסכום',
          bullets: [
            'הוכחה שסדרה הנדסית היא הנדסית',
            'נוסחת הסכום של סדרה הנדסית',
            'סכום $n$ איברים אחרונים',
          ],
        },
        {
          kind: 'ladder',
          group: 'geometric',
          subId: 'ge-infinite',
          title: 'סדרה הנדסית אינסופית — עולה, יורדת, מתכנסת',
          bullets: [
            'סדרה הנדסית אינסופית',
            'סדרה אינסופית יורדת / עולה',
            'מתכנסת / לא מתכנסת — וסכום הסדרה המתכנסת',
          ],
        },
        {
          kind: 'ladder',
          group: 'geometric',
          subId: 'ge-practice',
          title: 'תרגול מסכם — כל הנושאים יחד ברמת בגרות',
          bullets: [
            'כל הנושאים מעורבבים יחד',
            'ברמה של שאלות בגרות',
          ],
        },
        // ---- עוד בנושא ----------------------------------------------------
        { kind: 'ladder', subId: 'induction', title: 'אינדוקציה מתמטית' },
        {
          kind: 'link',
          title: 'תרגול בגרויות שמערבות הכל',
          href: bagrutPractice('סדרות'),
          emoji: '🎓',
        },
      ],
    },
    {
      // הסתברות (owner, 2026-08-19): one run of six stages. The stage
      // sub-topics live in content/lessons/math5/probability-stages-{a,b}.ts.
      id: 'probability',
      title: 'הסתברות',
      emoji: '🎲',
      tiles: [
        {
          kind: 'ladder',
          subId: 'pr-basics',
          title: 'מהי הסתברות — מאורע, מאורע משלים, "וגם" ו"או"',
          bullets: [
            'מה זו בכלל הסתברות — מה שרוצים חלקי מה שיש',
            'מאורע ומאורע משלים',
            'הסתברות של "גם א וגם ב" — כפל',
            'הסתברות של "או א או ב" — חיבור',
          ],
        },
        {
          kind: 'ladder',
          subId: 'pr-tree',
          title: 'עץ הסתברויות',
          bullets: [
            'איך בונים עץ וכיצד משתמשים בו',
            'עץ עם נעלמים ובלי נעלמים',
            'עץ משתנה — עם החזרה ובלי החזרה',
          ],
        },
        {
          kind: 'ladder',
          subId: 'pr-tables',
          title: 'טבלת הסתברויות',
          bullets: [
            'טבלה דו-ממדית — תאים ושוליים',
            'טבלה תלת-ממדית — תכונה שלישית',
            'עם נעלמים ובלי נעלמים',
          ],
        },
        {
          kind: 'ladder',
          subId: 'pr-bernoulli',
          title: 'הסתברות ברנולי',
          bullets: [
            'למה צריך את ברנולי ובמה זה עוזר',
            'הנוסחה הפשוטה ו-nCr במחשבון',
            '"לפחות", "בדיוק", "בכלל לא", "לכל היותר" — ומקרי קצה',
          ],
        },
        {
          kind: 'ladder',
          subId: 'pr-conditional',
          title: 'הסתברות מותנית',
          bullets: [
            'מה זו הסתברות מותנית — "בהינתן ש"',
            'מותנית בתוך טבלה ובתוך עץ',
            'מותנית בתוך ברנולי',
          ],
        },
        {
          kind: 'ladder',
          subId: 'pr-practice',
          title: 'תרגול מסכם — הכול יחד',
          bullets: [
            'כל הנושאים מעורבבים',
            'שאלות קרובות לרמת בגרות',
          ],
        },
        {
          kind: 'link',
          title: 'תרגול בגרויות שמערבות הכל',
          href: bagrutPractice('הסתברות'),
          emoji: '🎓',
        },
      ],
    },
    {
      id: 'geometry',
      title: 'גאומטריה',
      emoji: '△',
      note: {
        label: 'נספח: רשימת כל המשפטים',
        href: 'https://perpage.io/summaries/77a8a6a0-d1f9-11e8-bb1e-7d05c634af70/77a8a6a0-d1f9-11e8-bb1e-7d05c634af70.pdf',
      },
      // הסדר לפי איתי (2026-08-20): רמה 1 = חמשת סולמות המשפטים (חפיפה, דמיון,
      // תאלס, תכונות הצורות, מעגל); רמה 2 = כתיבת הוכחה בטענה-ונימוק; רמה 3 =
      // שילוב מעגלים, דמיון, יחסים ושטחים ברמת בגרות.
      tiles: [
        {
          kind: 'ladder',
          subId: 'eg-congruence',
          title: 'משולשים חופפים',
          bullets: ['ארבעת משפטי החפיפה', 'שלוש טענות + שם המשפט', 'שאלת היעד של המסלול'],
        },
        {
          kind: 'ladder',
          subId: 'eg-similarity',
          title: 'משולשים דומים',
          bullets: ['דמיון בשתי זוויות', 'פרופורציה ויחס דמיון', 'יחס שטחים $k^2$'],
        },
        {
          kind: 'ladder',
          subId: 'eg-thales',
          title: 'משפט תאלס ופרופורציה',
          bullets: ['תאלס והמשפט ההפוך', 'קו אמצעים', 'חוצה זווית'],
        },
        {
          kind: 'ladder',
          subId: 'eg-shapes',
          title: 'תכונות הצורות — משולשים, מרובעים ושטחים',
          bullets: [
            'שווה-שוקיים, ישר-זווית ושווה-צלעות',
            'מפגש התיכונים ($2:1$) וחוצי הזוויות',
            'מקבילית, מלבן, מעוין וטרפז',
            'שטחים ויחסי שטחים',
          ],
        },
        {
          kind: 'ladder',
          subId: 'eg-circle',
          title: 'משפטים במעגל',
          bullets: ['זווית מרכזית וזווית היקפית', 'מרובע חסום', 'משיק ומשפט משיק-מיתר', 'פרופורציה במעגל'],
        },
        {
          kind: 'ladder',
          subId: 'eg-method',
          title: 'איך כותבים הוכחה — טענה ונימוק',
          bullets: ['נתון, צריך להוכיח, מש"ל', 'טבלת טענה ונימוק', 'עובדים אחורה מהמבוקש', 'שרשרת סעיפים'],
        },
        {
          kind: 'ladder',
          subId: 'eg-mixed',
          title: 'משלבים הכול — מעגל, דמיון, יחסים ושטחים',
          bullets: ['שאלת היעד נפתרת שורה-שורה', 'מפת הכלים והמלכודות', 'שאלות ברמת בגרות'],
        },
        {
          kind: 'link',
          title: 'תרגול שאלות בגרות שמערבות הכל',
          href: bagrutPractice('גיאומטריה אוקלידית'),
          emoji: '🎓',
        },
      ],
    },
    {
      id: 'trigonometry',
      title: 'טריגונומטריה',
      emoji: '🔺',
      note: { label: 'נספח: רשימת הזהויות — ללמוד רק מה שרלוונטי לבגרות', href: '/formulas' },
      // The owner's four-level path for טריגונומטריה במישור (571).
      //
      // NO `groups` here, deliberately (owner, 2026-08-29): the levels are a
      // PROGRESSION, and a segmented chooser renders a progression as if it
      // were a set of alternatives to pick between. It also made this one topic
      // look unlike every other topic in the track, which is the confusion the
      // owner named. Plain rail instead — the same journey every other topic
      // shows, with the levels as consecutive stations.
      //
      // Order carries the meaning now: the four levels first, then the deeper
      // 581-flavoured ladders (the unit circle, the general solution of an
      // equation, identities in full) last, where their titles already mark
      // them as extensions rather than as a fifth level.
      tiles: [
        // ---- רמת בסיס -----------------------------------------------------
        {
          kind: 'ladder',
          subId: 'trig-plane-basics',
          title: 'זהויות, משפטי מעגל ומשוואה טריגונומטרית',
          bullets: ['הזהויות שצריך לפתרון משולשים', '$\\sin(180°-\\alpha)$ ו-$\\cos(180°-\\alpha)$', 'זווית מרכזית, היקפית, משיק ומרובע חסום', 'משוואה פשוטה בתחום נתון'],
        },
        // ---- רמה 1 --------------------------------------------------------
        {
          kind: 'ladder',
          subId: 'trig-right-triangle',
          title: 'סינוס, קוסינוס וטנגנס במשולש ישר זווית',
          bullets: ['מול חלקי יתר, ליד חלקי יתר, מול חלקי ליד', 'למצוא את היתר', 'למצוא ניצב', 'למצוא את הזווית מהיחס'],
        },
        // ---- רמה 2 --------------------------------------------------------
        {
          kind: 'ladder',
          subId: 'trig-sine-cosine-laws',
          title: 'משפט הסינוסים המורחב ומשפט הקוסינוסים',
          bullets: ['משפט הסינוסים — צלע מול הזווית שלה, ו-$2R$', 'שתי התשובות של הזווית', 'משפט הקוסינוסים — כשאין זוג', 'איך בוחרים משפט'],
        },
        {
          kind: 'ladder',
          subId: 'trig-triangle-area',
          title: 'נוסחאות שטח משולש',
          bullets: ['$S = \\tfrac12 ab\\sin\\gamma$ — הזווית הכלואה', 'מהשטח אל הזווית — שתי תשובות', '$S = \\dfrac{abc}{4R}$ והמעגל החוסם'],
        },
        // ---- רמה 3 --------------------------------------------------------
        {
          kind: 'ladder',
          subId: 'trig-plane-mixed',
          title: 'שאלות משולבות ברמת בגרות',
          bullets: ['איזה כלי מתאים לאיזה נתון', 'לפרק שאלה רב-סעיפית', 'המלכודות שמפילות', 'שאלות בגרות מלאות'],
        },
        // ---- עוד בנושא (מעמיק, מעבר לארבע הרמות) ---------------------------
        {
          kind: 'ladder',
          subId: 'special-angles-reduction',
          title: 'מעגל היחידה, ערכים מיוחדים וזוויות צמצום',
          bullets: ['מעגל היחידה', 'ערכים מיוחדים', 'זוויות צמצום'],
        },
        { kind: 'ladder', subId: 'trig-equations', title: 'משוואות טריגונומטריות — הפתרון הכללי' },
        { kind: 'ladder', subId: 'trig-identities', title: 'זהויות טריגונומטריות — הרחבה' },
        {
          kind: 'link',
          title: 'תרגול שאלות בגרות',
          href: bagrutPractice('טריגונומטריה'),
          emoji: '🎓',
        },
      ],
    },
    {
      id: 'functions-rational-root',
      title: 'פונקציות מנה ושורש',
      emoji: '📈',
      // Rebuilt 2026-08-29 to the owner's own eight-level spec. The tiles now
      // point at the dedicated rq-* STAGES (content/lessons/math5/
      // functions-root-quotient.ts), authored root-and-quotient-flavoured and
      // in this exact teaching order, the same way סדרות / הסתברות got theirs.
      // The generic modules the tiles used to point at (domain-definition,
      // asymptotes-rational, derivative-rules, basic-integration …) still exist
      // and still serve the פונקציות / דיפרנציאלי / אינטגרלי topics.
      tiles: [
        {
          kind: 'ladder',
          subId: 'rq-domain',
          title: 'רמה 1 · תחום הגדרה',
          bullets: ['מכנה שאינו מתאפס, ושורש עם אי-שוויון', 'ביטוי ריבועי מתחת לשורש, בעזרת הפרבולה'],
        },
        {
          kind: 'ladder',
          subId: 'rq-intersections',
          title: 'רמה 2 · נקודות חיתוך עם הצירים',
          bullets: [
            'מציבים $y=0$ לציר $x$, ומציבים $x=0$ לציר $y$',
            'במנה מאפסים את המונה, בשורש את מה שמתחתיו',
          ],
        },
        {
          kind: 'ladder',
          subId: 'rq-asymptotes',
          title: 'רמה 3 · אסימפטוטות',
          bullets: [
            'אנכית מאיפוס המכנה, ומלכודת החור',
            'אופקית לפי השוואת החזקות של המונה והמכנה',
          ],
        },
        {
          kind: 'ladder',
          subId: 'rq-derivative',
          title: 'רמה 4 · נגזרת, קיצון, עלייה וירידה',
          bullets: [
            'כל כללי הגזירה, כולל פונקציה מורכבת',
            'הנגזרת היא שיפוע המשיק, ולכן מאפסים אותה בקיצון',
          ],
        },
        {
          kind: 'ladder',
          subId: 'rq-sketch',
          title: 'רמה 5 · שרטוט הגרף',
          bullets: [
            'אסימפטוטות, ואז חיתוכים וקיצון, ואז חיבור',
            'הקשר בין גרף הפונקציה לגרף הנגזרת',
          ],
        },
        {
          kind: 'ladder',
          subId: 'rq-transformations',
          title: 'רמה 6 · טרנספורמציות, זוגיות וסעיפי חשיבה',
          bullets: [
            'הזזות, שיקופים, ערך מוחלט וזוגיות',
            'סעיפי חשיבה: כמה נקודות משותפות יש עם ציר $x$',
          ],
        },
        {
          kind: 'ladder',
          subId: 'rq-integral',
          title: 'רמה 7 · חשבון אינטגרלי וחישובי שטחים',
          bullets: [
            'זיהוי אינטגרל לפי הנגזרת הפנימית',
            'כל הפרוצדורה של חישוב שטח, כולל בין שני גרפים',
          ],
        },
        {
          kind: 'ladder',
          subId: 'rq-bagrut-mixed',
          title: 'רמה 8 · תרגול בגרות שמערב הכול',
          bullets: ['שאלות חקירה מלאות', 'רשימת הבדיקה שמונעת פספוס סעיפים'],
        },
        // Nothing else. The owner asked (2026-08-29) that this topic hold his
        // eight levels and ONLY them: "שרק את הנושאים האלה יהיו לפי איך
        // ששלחתי לך ושלא יהיה מעורבב עם פונקציות טריגונומטריה". The older
        // ladders that used to sit here as extras (tangent-line,
        // extrema-monotonicity, basic-integration, definite-integral,
        // even-odd-inverse, intersections-signs) all live in חשבון דיפרנציאלי /
        // אינטגרלי / פונקציות, where their examples are full of sin, cos and
        // e^x — which is exactly the mixing he is objecting to. They are in
        // EXCLUDED_571 now; the modules stay authored and reachable from
        // /practice, only this track no longer points at them.
      ],
    },
    {
      id: 'trig-functions',
      title: 'פונקציות טריגונומטריות',
      emoji: '〰️',
      tiles: [
        { kind: 'ladder', subId: 'trig-identities', title: 'זהויות טריגונומטריות', review: true },
        { kind: 'ladder', subId: 'trig-equations', title: 'פתירת משוואות טריגונומטריות', review: true },
        {
          kind: 'ladder',
          subId: 'trig-calculus',
          title: 'נגזרות של פונקציות טריגונומטריות',
          bullets: [
            'נגזרות של $\\sin$ ו-$\\cos$',
            'כלל השרשרת',
            'אינטגרלים טריגונומטריים',
            'צורת $R\\sin(x+\\varphi)$ — קיצון בלי גזירה',
          ],
        },
        { kind: 'soon', title: 'חקירה מלאה של פונקציה טריגונומטרית — קיצון' },
        { kind: 'soon', title: 'עבודה עם פרמטרים' },
        {
          kind: 'link',
          title: 'סעיפי חשיבה ושאלות בגרות',
          href: bagrutPractice('טריגונומטריה'),
          emoji: '🎓',
        },
      ],
    },
    {
      id: 'extremum-problems',
      title: 'בעיות קיצון',
      emoji: '🎯',
      tiles: [
        {
          // The syllabus's four items are the four steps of solving one problem —
          // exactly the content of the single existing sub-topic.
          kind: 'ladder',
          subId: 'optimization',
          title: 'בעיות קיצון',
          bullets: [
            'הגדרת המשתנה $x$ שאיתו עובדים',
            'בניית פונקציית המטרה',
            'גזירת הפונקציה ומציאת הקיצון',
            'בעיות קיצון גאומטריות ובעיות קיצון גרפיות',
          ],
        },
      ],
    },
    {
      id: 'short-questions',
      title: 'שאלות קצרות',
      emoji: '⚡',
      tiles: [
        {
          kind: 'link',
          title: 'בוחן מהיר — שאלות קצרות מכל הנושאים',
          href: '/quiz',
          emoji: '⚡',
          bullets: ['הפורמט של השאלות הקצרות בבגרות — שאלה אחר שאלה, על כל הנושאים'],
        },
        { kind: 'ladder', subId: 'induction', title: 'אינדוקציה', review: true },
        {
          kind: 'ladder',
          subId: 'pr-practice',
          title: 'הסתברות — עץ, טבלה או הסתברות כללית',
          review: true,
        },
        { kind: 'soon', title: 'סעיפי חשיבה בפונקציות' },
        { kind: 'soon', title: 'סעיפים בגאומטריה ובטריגונומטריה' },
        { kind: 'soon', title: 'קשר בין גרף הפונקציה לגרף הנגזרת' },
      ],
    },
    // אלגברה — יסודות was here as a closing foundations topic (2026-08-17); the
    // owner dropped it from the 571 track the next day. Its four sub-topics are
    // listed in EXCLUDED_TOPICS['571'] (content/tracks/index.ts) so verify-tracks
    // knows they are unreachable on purpose; the lessons themselves still exist.
  ],
};
