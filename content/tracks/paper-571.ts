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
      id: 'sequences',
      title: 'סדרות',
      emoji: '⋯',
      tiles: [
        {
          kind: 'ladder',
          subId: 'arithmetic-sequences',
          title: 'סדרה חשבונית',
          bullets: [
            'איבר כללי בסדרה חשבונית',
            'נוסחאות הסכום',
            'איברים במקומות זוגיים ואי-זוגיים',
            'סכימת איברים ראשונים, אחרונים ואמצעיים',
          ],
        },
        {
          // Recursion lives in the "applications" sub-topic together with
          // compound interest — the closest existing ladder to this item.
          kind: 'ladder',
          subId: 'sequences-applications',
          title: 'כלל נסיגה והגדרת איבר לפי מיקום',
          bullets: ['סדרות נסיגה $a_{n+1}=f(a_n)$', 'ריבית דריבית כסדרה'],
        },
        {
          kind: 'ladder',
          subId: 'geometric-sequences',
          title: 'סדרה הנדסית',
          bullets: [
            'איבר כללי בסדרה הנדסית',
            'מציאת מיקומו של איבר',
            'איך מוכיחים שסדרה היא הנדסית (שיש לה מנה)',
            'סכום של סדרה הנדסית',
            'סכום $n$ איברים אחרונים',
          ],
        },
        {
          kind: 'ladder',
          subId: 'infinite-geometric',
          title: 'סדרה הנדסית אינסופית',
          bullets: ['סכום סדרה אינסופית', 'סדרה אינסופית עולה, יורדת, מתכנסת'],
        },
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
      id: 'probability',
      title: 'הסתברות',
      emoji: '🎲',
      tiles: [
        {
          kind: 'ladder',
          subId: 'prob-basics',
          title: 'יסודות ההסתברות',
          bullets: [
            'מהי בכלל הסתברות — החלק שרוצים חלקי הכלל',
            'הסתברות של "וגם" — כפל הסתברויות',
            'הסתברות של "או" — חיבור הסתברויות',
            'מאורעות תלויים, בלתי-תלויים וזרים',
          ],
        },
        {
          kind: 'ladder',
          subId: 'prob-tables',
          title: 'טבלת הסתברויות',
          bullets: ['טבלה דו-ממדית — תאים ושוליים', 'הסתברות מותנית מתוך הטבלה', 'נעלמים בטבלה — משוואה מהסכומים', 'בדיקת אי-תלות'],
        },
        {
          kind: 'ladder',
          subId: 'prob-conditional',
          title: 'עץ הסתברויות והסתברות מותנית',
          bullets: ['עץ הסתברויות כולל נעלמים', 'הסתברות מותנית', 'עם החזרה ובלי החזרה'],
        },
        {
          kind: 'ladder',
          subId: 'prob-combinatorics',
          title: 'ברנולי — התפלגות בינומית',
          bullets: ['ניסוי ברנולי', 'הנוסחה הבינומית', '"לפחות" ו"לכל היותר" דרך המשלים'],
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
      tiles: [
        {
          kind: 'soon',
          title: 'משפטים ותכונות של מצולעים',
          bullets: ['משולש, ריבוע, מלבן, דלתון, טרפז', 'סוגי משולשים וסוגי מרובעים'],
        },
        {
          kind: 'ladder',
          subId: 'eg-circle',
          title: 'משפטים במעגל',
          bullets: ['זווית מרכזית וזווית היקפית', 'מרובע חסום', 'משיק ומשפט משיק-מיתר', 'פרופורציה במעגל'],
        },
        { kind: 'ladder', subId: 'eg-congruence', title: 'משולשים חופפים' },
        { kind: 'ladder', subId: 'eg-similarity', title: 'משולשים דומים' },
        {
          // Not in the syllabus — existing ladder the track would otherwise strand.
          kind: 'ladder',
          subId: 'eg-thales',
          title: 'משפט תאלס ופרופורציה',
          bullets: ['תאלס והמשפט ההפוך', 'קו אמצעים', 'חוצה זווית'],
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
      tiles: [
        {
          // Closest existing ladder: the unit circle, special values, reduction.
          kind: 'ladder',
          subId: 'special-angles-reduction',
          title: 'טריגונומטריה בסיסית — סינוס, קוסינוס, טנגנס',
          bullets: ['מעגל היחידה', 'ערכים מיוחדים', 'זוויות צמצום'],
        },
        {
          kind: 'ladder',
          subId: 'trig-sine-cosine-laws',
          title: 'משפט הסינוסים המורחב ומשפט הקוסינוסים',
          bullets: ['משפט הסינוסים — צלע מול הזווית שלה, ו-$2R$', 'שתי התשובות של הזווית', 'משפט הקוסינוסים — כשאין זוג', 'איך בוחרים משפט'],
        },
        { kind: 'ladder', subId: 'trig-equations', title: 'משוואות טריגונומטריות' },
        { kind: 'ladder', subId: 'trig-identities', title: 'זהויות טריגונומטריות' },
        { kind: 'soon', title: 'משפטים בגאומטריה בשירות הטריגונומטריה' },
        {
          kind: 'ladder',
          subId: 'trig-triangle-area',
          title: 'נוסחאות שטח משולש',
          bullets: ['$S = \\tfrac12 ab\\sin\\gamma$ — הזווית הכלואה', 'מהשטח אל הזווית — שתי תשובות', '$S = \\dfrac{abc}{4R}$ והמעגל החוסם'],
        },
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
      tiles: [
        { kind: 'ladder', subId: 'domain-definition', title: 'תחום הגדרה במנה ושורש' },
        {
          kind: 'ladder',
          subId: 'intersections-signs',
          title: 'נקודות חיתוך עם הצירים',
          bullets: ['חיתוך עם הצירים', 'סימן הפונקציה'],
        },
        {
          kind: 'ladder',
          subId: 'derivative-rules',
          title: 'גזירה — פולינום, פונקציה מורכבת, מנה ושורש',
        },
        {
          // Not in the syllabus — existing ladder, required for every function investigation.
          kind: 'ladder',
          subId: 'tangent-line',
          title: 'משוואת המשיק',
        },
        {
          kind: 'ladder',
          subId: 'extrema-monotonicity',
          title: 'נקודות קיצון — כולל קיצון בקצה, טבלה ונגזרת שנייה',
        },
        {
          kind: 'ladder',
          subId: 'asymptotes-rational',
          title: 'אסימפטוטות — אופקיות, אנכיות ונקודת חור',
        },
        { kind: 'soon', title: 'שרטוט הפונקציה והקשר בין גרף הפונקציה לגרף הנגזרת' },
        {
          kind: 'ladder',
          subId: 'basic-integration',
          title: 'אינטגרלים — זיהוי אינטגרל לפי נגזרת פנימית',
        },
        // The syllabus says "אינטגרלים" once; the existing content splits it in three.
        { kind: 'ladder', subId: 'definite-integral', title: 'אינטגרל מסוים' },
        { kind: 'ladder', subId: 'area-between-curves', title: 'חישוב שטחים' },
        { kind: 'soon', title: 'עבודה עם פרמטרים' },
        {
          kind: 'ladder',
          subId: 'even-odd-inverse',
          title: 'פונקציה זוגית ואי-זוגית',
          bullets: ['זוגיות ואי-זוגיות', 'פונקציה הפכית'],
        },
        {
          kind: 'link',
          title: 'סעיפי חשיבה ותרגול בגרויות',
          href: bagrutPractice('חשבון דיפרנציאלי'),
          emoji: '🎓',
        },
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
          subId: 'prob-basics',
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
