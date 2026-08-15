// ============================================================
// Cognition catalog — math5 · פונקציית ln
// ============================================================
//
// 14 skills · 20 misconceptions ·
// 44 triggers over 30 MCQs.
//
// DERIVED, not authored from scratch: every trigger below was grouped from
// the `distractorNotes` already written on the question it names
// (scripts/derive-cognition.ts). Each reference was checked against the real
// content before this file was written, and `npm run verify:cognition`
// asserts the same invariants independently — in particular that no trigger
// points at a correct answer.
//
// Review target: the `insight` strings. They are read by the student ABOUT
// THEMSELVES, so a clumsy one is worse than a missing one.

import type { TopicCognitionMap } from '../types';

const SUBJECT = "math5";
const TOPIC = "פונקציית ln";

export const lnFunctionCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "ln-domain", title: "תחום הגדרה של $\\ln$", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-properties", prereqs: [], band: "easy" },
    { id: "ln-identities", title: "זהויות בסיסיות של $\\ln$", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-properties", prereqs: [], band: "easy" },
    { id: "ln-domain-composite", title: "תחום הגדרה של $\\ln$ עם ארגומנט מורכב", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-properties", prereqs: ["ln-domain"], band: "mid" },
    { id: "ln-chain-rule", title: "נגזרת $\\ln$ עם כלל השרשרת", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-derivatives", prereqs: ["ln-identities"], band: "easy" },
    { id: "ln-product-rule", title: "נגזרת מכפלה עם $\\ln$", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-derivatives", prereqs: ["ln-chain-rule"], band: "easy" },
    { id: "ln-derivative-point", title: "חישוב שיפוע משיק עם נגזרת $\\ln$", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-derivatives", prereqs: ["ln-chain-rule"], band: "easy" },
    { id: "ln-solve-basic", title: "פתרון משוואות לוגריתמיות בסיסיות", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-equations", prereqs: ["ln-identities"], band: "easy" },
    { id: "ln-solve-log-laws", title: "פתרון משוואות לוגריתמיות עם חוקי לוגריתם", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-equations", prereqs: ["ln-solve-basic"], band: "easy" },
    { id: "ln-solve-advanced", title: "פתרון משוואות לוגריתמיות עם בדיקת תחום", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-equations", prereqs: ["ln-solve-log-laws","ln-domain"], band: "mid" },
    { id: "ln-graph-features", title: "מאפייני גרף $\\ln$: אסימפטוטה וחיתוך עם ציר $x$", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-investigation", prereqs: ["ln-domain","ln-identities"], band: "easy" },
    { id: "ln-limits", title: "גבולות של פונקציות עם $\\ln$", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-investigation", prereqs: ["ln-graph-features"], band: "easy" },
    { id: "ln-monotonicity", title: "חקירת עלייה וירידה של פונקציה עם $\\ln$", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-investigation", prereqs: ["ln-chain-rule","ln-graph-features"], band: "mid" },
    { id: "ln-integral-basic", title: "אינטגרל $\\int \\frac{1}{x}dx$ וצורת $\\frac{g'}{g}$", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-integrals", prereqs: ["ln-chain-rule"], band: "easy" },
    { id: "ln-integral-correction", title: "מקדם מתקן באינטגרל לוגריתמי", subject: SUBJECT, topic: TOPIC, subTopicId: "ln-integrals", prereqs: ["ln-integral-basic"], band: "easy" },
  ],
  misconceptions: [
    {
      id: "ln-domain-weak-inequality",
      title: "אי-שוויון חלש בתחום $\\ln$",
      skill: "ln-domain",
      insight: "אתה כולל נקודות שבהן הארגומנט שווה לאפס בתחום ההגדרה של $\\ln$, אך $\\ln 0$ אינו מוגדר — הדרישה היא חיובי ממש, עם $>$ בלבד.",
      remedy: { subTopicId: "ln-properties" },
      triggers: [
        { questionId: "ln-sub-prop-001", optionIndex: 1 },
        { questionId: "ln-sub-prop-007", optionIndex: 2 },
      ],
    },
    {
      id: "ln-domain-forget-constraint",
      title: "שכחת דרישת התחום של $\\ln$",
      skill: "ln-domain",
      insight: "אתה נותן תחום הגדרה רחב מדי ל-$\\ln$ — ללא שים לב שהארגומנט חייב להיות חיובי ממש בכל נקודה בתחום.",
      remedy: { subTopicId: "ln-properties" },
      triggers: [
        { questionId: "ln-sub-prop-001", optionIndex: 3 },
        { questionId: "ln-sub-prop-009", optionIndex: 2 },
      ],
    },
    {
      id: "ln-domain-flip-inequality",
      title: "היפוך כיוון אי-השוויון בתחום $\\ln$",
      skill: "ln-domain",
      insight: "כשהארגומנט של $\\ln$ מכיל מקדם שלילי ל-$x$, אתה שוכח להפוך את כיוון אי-השוויון בעת הפתרון ומקבל תחום הפוך.",
      remedy: { subTopicId: "ln-properties" },
      triggers: [
        { questionId: "ln-sub-prop-007", optionIndex: 1 },
        { questionId: "ln-sub-prop-007", optionIndex: 3 },
      ],
    },
    {
      id: "ln-identity-copy-argument",
      title: "העתקת הארגומנט בלי להפעיל $\\ln$",
      skill: "ln-identities",
      insight: "אתה מחזיר את הארגומנט כמו שהוא במקום להפעיל את הזהות $\\ln(e^k) = k$ — $\\ln$ ו-$e$ מבטלים זה את זה ומחזירים רק את החזקה.",
      remedy: { subTopicId: "ln-properties" },
      triggers: [
        { questionId: "ln-sub-prop-002", optionIndex: 1 },
        { questionId: "ln-sub-prop-006", optionIndex: 1 },
      ],
    },
    {
      id: "ln-identity-k-equals-one",
      title: "בלבול בין $\\ln(e^k)$ ל-$\\ln(e)$",
      skill: "ln-identities",
      insight: "אתה מחזיר $1$ במקום $k$ — כאילו תמיד $\\ln(e^k) = 1$. הזהות $\\ln(e^k) = k$ מחזירה את החזקה עצמה, לא $1$.",
      remedy: { subTopicId: "ln-properties" },
      triggers: [
        { questionId: "ln-sub-prop-002", optionIndex: 3 },
        { questionId: "ln-sub-prop-006", optionIndex: 2 },
      ],
    },
    {
      id: "ln-chain-rule-missing-inner",
      title: "שמטת את נגזרת הפנימי בכלל השרשרת",
      skill: "ln-chain-rule",
      insight: "בגזירת $\\ln(g(x))$ אתה שם $1$ במונה במקום $g'(x)$ — נגזרת הפנימי חייבת להופיע במונה ולא להישמט.",
      remedy: { subTopicId: "ln-derivatives" },
      triggers: [
        { questionId: "ln-sub-deriv-001", optionIndex: 1 },
        { questionId: "ln-sub-deriv-006", optionIndex: 1 },
        { questionId: "ln-sub-deriv-007", optionIndex: 1 },
        { questionId: "ln-sub-deriv-009", optionIndex: 3 },
      ],
    },
    {
      id: "ln-chain-rule-wrong-constant-direction",
      title: "הקבוע עבר למכנה במקום למונה",
      skill: "ln-chain-rule",
      insight: "בגזירת $\\ln(ax + b)$ אתה מציב את $a$ במכנה (או מקבל קבוע בלבד בלי מכנה) — נגזרת הפנימי $a$ שייכת למונה, והארגומנט כולו נשאר במכנה.",
      remedy: { subTopicId: "ln-derivatives" },
      triggers: [
        { questionId: "ln-sub-deriv-001", optionIndex: 2 },
        { questionId: "ln-sub-deriv-007", optionIndex: 3 },
      ],
    },
    {
      id: "ln-derivative-is-value-not-slope",
      title: "ערך הפונקציה במקום ערך הנגזרת",
      skill: "ln-derivative-point",
      insight: "כדי למצוא שיפוע משיק אתה מחשב את $f(x_0)$ במקום $f'(x_0)$ — שיפוע הוא תמיד ערך ה**נגזרת** בנקודה, לא ערך הפונקציה.",
      remedy: { subTopicId: "ln-derivatives" },
      triggers: [
        { questionId: "ln-sub-deriv-008", optionIndex: 3 },
        { questionId: "ln-sub-inv-002", optionIndex: 1 },
      ],
    },
    {
      id: "ln-product-rule-missing-term",
      title: "מחובר חסר בכלל המכפלה",
      skill: "ln-product-rule",
      insight: "בגזירת מכפלה $u \\cdot v$ אתה מחשב רק מחובר אחד מתוך שניים — כלל המכפלה $u'v + uv'$ דורש שני מחוברים, ושמיטת אחד מהם מוביל לתוצאה חלקית.",
      remedy: { subTopicId: "ln-derivatives" },
      triggers: [
        { questionId: "ln-sub-deriv-002", optionIndex: 2 },
        { questionId: "ln-sub-deriv-002", optionIndex: 3 },
      ],
    },
    {
      id: "ln-solve-no-exponent",
      title: "מחיקת $\\ln$ בלי להעלות ב-$e$ בחזקה",
      skill: "ln-solve-basic",
      insight: "כשאתה פותר $\\ln x = k$ אתה מעביר את $\\ln$ לצד השני בלי פעולה — הפעולה ההופכית ל-$\\ln$ היא $e^{(\\ )}$, ולכן $x = e^k$ ולא $x = k$.",
      remedy: { subTopicId: "ln-equations" },
      triggers: [
        { questionId: "ln-sub-eq-001", optionIndex: 3 },
        { questionId: "ln-sub-eq-006", optionIndex: 1 },
        { questionId: "ln-sub-eq-007", optionIndex: 1 },
      ],
    },
    {
      id: "ln-solve-negative-sign-to-base",
      title: "העברת מינוס אל הבסיס $e$ במקום לחזקה",
      skill: "ln-solve-basic",
      insight: "כש-$\\ln x = -k$ אתה כותב $x = -e^k$ במקום $x = e^{-k}$ — הסימן השלילי הוא חלק מהחזקה, ולכן $e^{-k}$ חיובי ומוגדר.",
      remedy: { subTopicId: "ln-equations" },
      triggers: [
        { questionId: "ln-sub-eq-008", optionIndex: 1 },
        { questionId: "ln-sub-eq-008", optionIndex: 2 },
      ],
    },
    {
      id: "ln-solve-extra-ln",
      title: "הפעלת $\\ln$ פעם נוספת על התוצאה",
      skill: "ln-solve-log-laws",
      insight: "אחרי שהגעת ל-$\\ln x = \\ln k$ אתה כותב $x = \\ln k$ במקום $x = k$ — השוואת ארגומנטים ישירה מסיימת את הפתרון, ואין צורך ב-$\\ln$ נוסף.",
      remedy: { subTopicId: "ln-equations" },
      triggers: [
        { questionId: "ln-sub-eq-002", optionIndex: 3 },
        { questionId: "ln-sub-eq-007", optionIndex: 3 },
      ],
    },
    {
      id: "ln-log-law-subtract-not-divide",
      title: "חיסור ארגומנטים במקום חלוקה",
      skill: "ln-solve-log-laws",
      insight: "אתה מפשט $\\ln a + \\ln b$ כאילו הוא $\\ln(a - b)$ — חוק חיבור לוגריתמים נותן $\\ln(a \\cdot b)$, כלומר מכפלה ולא הפרש.",
      remedy: { subTopicId: "ln-equations" },
      triggers: [
        { questionId: "ln-sub-eq-002", optionIndex: 1 },
        { questionId: "ln-sub-eq-007", optionIndex: 2 },
      ],
    },
    {
      id: "ln-solve-domain-forgotten",
      title: "שכחת לפסול פתרונות שמחוץ לתחום $\\ln$",
      skill: "ln-solve-advanced",
      insight: "אתה מקבל את כל הפתרונות האלגבריים מבלי לבדוק שהם נמצאים בתחום ההגדרה של $\\ln$ — פתרונות שגורמים לארגומנט להיות אפס או שלילי פסולים.",
      remedy: { subTopicId: "ln-equations" },
      triggers: [
        { questionId: "ln-sub-eq-011", optionIndex: 1 },
        { questionId: "ln-sub-prop-009", optionIndex: 1 },
      ],
    },
    {
      id: "ln-graph-zero-at-argument-zero",
      title: "חיפוש חיתוך ציר $x$ בנקודה שמאפסת את הארגומנט",
      skill: "ln-graph-features",
      insight: "אתה מחפש היכן $\\ln$ מתאפס על ידי השוואת הארגומנט לאפס — $\\ln$ מתאפס כשהארגומנט שווה $1$, לא כשהוא שווה $0$ (שם הפונקציה אינה מוגדרת).",
      remedy: { subTopicId: "ln-investigation" },
      triggers: [
        { questionId: "ln-sub-inv-006", optionIndex: 2 },
      ],
    },
    {
      id: "ln-asymptote-shift-ignored",
      title: "אסימפטוטה של $\\ln x$ בלי להביא בחשבון הזזה",
      skill: "ln-graph-features",
      insight: "אתה מציין $x = 0$ כאסימפטוטה האנכית גם כשהפונקציה היא $\\ln(x - a)$ — האסימפטוטה מוזזת ונמצאת היכן שהארגומנט מתאפס, כלומר ב-$x = a$.",
      remedy: { subTopicId: "ln-investigation" },
      triggers: [
        { questionId: "ln-sub-inv-007", optionIndex: 1 },
        { questionId: "ln-sub-inv-006", optionIndex: 1 },
      ],
    },
    {
      id: "ln-integral-power-rule-applied",
      title: "כלל החזקה הוחל על $\\int \\frac{1}{x}dx$",
      skill: "ln-integral-basic",
      insight: "אתה מנסה לאנטגרל $\\frac{1}{x}$ בכלל החזקה — הכלל $\\int x^n dx = \\frac{x^{n+1}}{n+1}$ קורס כשה-$n = -1$, ובדיוק שם נכנס $\\ln|x| + C$.",
      remedy: { subTopicId: "ln-integrals" },
      triggers: [
        { questionId: "ln-sub-int-001", optionIndex: 3 },
        { questionId: "ln-sub-int-006", optionIndex: 3 },
      ],
    },
    {
      id: "ln-integral-ln-on-numerator",
      title: "$\\ln$ הוחל על המונה במקום על המכנה",
      skill: "ln-integral-basic",
      insight: "בנוסחה $\\int \\frac{g'}{g}dx = \\ln|g| + C$ אתה לוקח $\\ln$ של המונה — $g$ היא המכנה, והמונה הוא רק הסימן שהוא נגזרת המכנה.",
      remedy: { subTopicId: "ln-integrals" },
      triggers: [
        { questionId: "ln-sub-int-002", optionIndex: 1 },
        { questionId: "ln-sub-int-011", optionIndex: 2 },
      ],
    },
    {
      id: "ln-integral-correction-factor-missing",
      title: "שמטת את המקדם המתקן באינטגרל",
      skill: "ln-integral-correction",
      insight: "כשאתה מאנטגרל $\\frac{1}{ax+b}$ אתה שוכח לחלק ב-$a$ — נגזרת הפנימי $a$ קופצת מגזירה ומאזנה בחלוקה, ולכן המקדם המתקן הוא $\\frac{1}{a}$.",
      remedy: { subTopicId: "ln-integrals" },
      triggers: [
        { questionId: "ln-sub-int-006", optionIndex: 2 },
        { questionId: "ln-sub-int-007", optionIndex: 1 },
      ],
    },
    {
      id: "ln-integral-unnecessary-correction",
      title: "הוספת מקדם מתקן מיותר כשהמונה כבר מותאם",
      skill: "ln-integral-correction",
      insight: "כשהמונה הוא בדיוק נגזרת המכנה אתה עדיין מוסיף מקדם מתקן — אם $g'(x)$ מופיע כבר במונה, האינטגרל הוא $\\ln|g| + C$ ללא כל מקדם נוסף.",
      remedy: { subTopicId: "ln-integrals" },
      triggers: [
        { questionId: "ln-sub-int-008", optionIndex: 1 },
        { questionId: "ln-sub-int-011", optionIndex: 1 },
      ],
    },
  ],
  questionSkills: {
    "ln-sub-prop-001": ["ln-domain"],
    "ln-sub-prop-002": ["ln-identities"],
    "ln-sub-prop-006": ["ln-identities"],
    "ln-sub-prop-007": ["ln-domain"],
    "ln-sub-prop-008": ["ln-domain-composite"],
    "ln-sub-prop-009": ["ln-domain-composite"],
    "ln-sub-deriv-001": ["ln-chain-rule"],
    "ln-sub-deriv-002": ["ln-product-rule"],
    "ln-sub-deriv-006": ["ln-chain-rule"],
    "ln-sub-deriv-007": ["ln-chain-rule"],
    "ln-sub-deriv-008": ["ln-derivative-point"],
    "ln-sub-deriv-009": ["ln-chain-rule","ln-domain-composite"],
    "ln-sub-eq-001": ["ln-solve-basic"],
    "ln-sub-eq-002": ["ln-solve-log-laws"],
    "ln-sub-eq-006": ["ln-solve-basic"],
    "ln-sub-eq-007": ["ln-solve-log-laws"],
    "ln-sub-eq-008": ["ln-solve-basic"],
    "ln-sub-eq-011": ["ln-solve-advanced"],
    "ln-sub-inv-001": ["ln-limits"],
    "ln-sub-inv-002": ["ln-graph-features"],
    "ln-sub-inv-006": ["ln-graph-features"],
    "ln-sub-inv-007": ["ln-graph-features"],
    "ln-sub-inv-008": ["ln-limits"],
    "ln-sub-inv-011": ["ln-monotonicity"],
    "ln-sub-int-001": ["ln-integral-basic"],
    "ln-sub-int-002": ["ln-integral-basic"],
    "ln-sub-int-006": ["ln-integral-correction"],
    "ln-sub-int-007": ["ln-integral-correction"],
    "ln-sub-int-008": ["ln-integral-basic","ln-integral-correction"],
    "ln-sub-int-011": ["ln-integral-basic","ln-integral-correction"],
  },
};
