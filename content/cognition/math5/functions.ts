// ============================================================
// Cognition catalog — math5 · פונקציות
// ============================================================
//
// 10 skills · 22 misconceptions ·
// 29 triggers over 13 MCQs.
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
const TOPIC = "פונקציות";

export const functionsCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "dom-fraction", title: "תחום הגדרה של פונקציה רציונלית", subject: SUBJECT, topic: TOPIC, subTopicId: "domain-definition", prereqs: [], band: "easy" },
    { id: "dom-sqrt", title: "תחום הגדרה של פונקציה עם שורש", subject: SUBJECT, topic: TOPIC, subTopicId: "domain-definition", prereqs: [], band: "easy" },
    { id: "dom-ln", title: "תחום הגדרה של פונקציה לוגריתמית", subject: SUBJECT, topic: TOPIC, subTopicId: "domain-definition", prereqs: [], band: "easy" },
    { id: "dom-composite", title: "תחום הגדרה של פונקציה מורכבת (מכנה רב-שורשי)", subject: SUBJECT, topic: TOPIC, subTopicId: "domain-definition", prereqs: ["dom-fraction"], band: "mid" },
    { id: "int-axis", title: "מציאת חיתוכים עם הצירים", subject: SUBJECT, topic: TOPIC, subTopicId: "intersections-signs", prereqs: [], band: "easy" },
    { id: "sign-parabola", title: "סימן פונקציה ריבועית", subject: SUBJECT, topic: TOPIC, subTopicId: "intersections-signs", prereqs: ["int-axis"], band: "mid" },
    { id: "asy-vertical", title: "אסימפטוטה אנכית", subject: SUBJECT, topic: TOPIC, subTopicId: "asymptotes-rational", prereqs: ["dom-fraction"], band: "easy" },
    { id: "asy-horizontal", title: "אסימפטוטה אופקית", subject: SUBJECT, topic: TOPIC, subTopicId: "asymptotes-rational", prereqs: ["asy-vertical"], band: "mid" },
    { id: "even-odd", title: "זוגיות ואי-זוגיות של פונקציה", subject: SUBJECT, topic: TOPIC, subTopicId: "even-odd-inverse", prereqs: [], band: "easy" },
    { id: "even-odd-mixed", title: "זוגיות ואי-זוגיות של פונקציה מורכבת", subject: SUBJECT, topic: TOPIC, subTopicId: "even-odd-inverse", prereqs: ["even-odd"], band: "mid" },
  ],
  misconceptions: [
    {
      id: "domain-sqrt-condition-on-fraction",
      title: "תנאי שורש במקום תנאי מכנה",
      skill: "dom-fraction",
      insight: "אתה משתמש בתנאי $\\ge$ גם כשמדובר במכנה של שבר — אבל מכנה אינו דורש חיוביות, רק אי-אפסיות.",
      remedy: { subTopicId: "domain-definition" },
      triggers: [
        { questionId: "fn-sub-dom-001", optionIndex: 1 },
        { questionId: "fn-sub-dom-003", optionIndex: 3 },
      ],
    },
    {
      id: "domain-zero-variable-not-denominator",
      title: "אפס את המשתנה במקום המכנה",
      skill: "dom-fraction",
      insight: "אתה פוסל את $x = 0$ במקום לפתור למה שמאפס את המכנה — צריך לפתור את המשוואה שהמכנה שווה לאפס.",
      remedy: { subTopicId: "domain-definition" },
      triggers: [
        { questionId: "fn-sub-dom-001", optionIndex: 2 },
        { questionId: "fn-sub-dom-004", optionIndex: 3 },
      ],
    },
    {
      id: "domain-ln-weak-inequality",
      title: "שימוש ב-$\\ge$ בלוגריתם במקום $>$",
      skill: "dom-ln",
      insight: "אתה כותב $\\ge$ בתחום של לוגריתם — אבל $\\ln(0)$ אינו מוגדר; צריך אי-שוויון חזק $>$.",
      remedy: { subTopicId: "domain-definition" },
      triggers: [
        { questionId: "fn-sub-dom-003", optionIndex: 1 },
        { questionId: "fn-sub-dom-002", optionIndex: 1 },
      ],
    },
    {
      id: "domain-ln-sign-error",
      title: "טעות סימן בפתרון אי-שוויון לוגריתמי",
      skill: "dom-ln",
      insight: "אתה מוצא את גבול תחום הלוגריתם עם סימן הפוך — כדאי לבדוק: אם הארגומנט הוא $x + c > 0$ התוצאה היא $x > -c$.",
      remedy: { subTopicId: "domain-definition" },
      triggers: [
        { questionId: "fn-sub-dom-003", optionIndex: 2 },
      ],
    },
    {
      id: "domain-fraction-as-point-not-interval",
      title: "פסילת נקודה בודדת במקום קטע שלם",
      skill: "dom-sqrt",
      insight: "אתה פוסל רק נקודה אחת כשהפונקציה מחייבת תנאי על קטע שלם — בשורש ריבועי או לוגריתם צריך לפסול טווח שלם, לא נקודה יחידה.",
      remedy: { subTopicId: "domain-definition" },
      triggers: [
        { questionId: "fn-sub-dom-002", optionIndex: 3 },
      ],
    },
    {
      id: "domain-sqrt-wrong-direction",
      title: "כיוון אי-שוויון הפוך בשורש",
      skill: "dom-sqrt",
      insight: "אתה הופך את כיוון האי-שוויון בתחום של שורש — הדרישה היא שהביטוי מתחת לשורש יהיה $\\ge 0$, לא $\\le 0$.",
      remedy: { subTopicId: "domain-definition" },
      triggers: [
        { questionId: "fn-sub-dom-002", optionIndex: 2 },
      ],
    },
    {
      id: "domain-fraction-missing-root",
      title: "שכחת שורש שני בפתרון מכנה",
      skill: "dom-composite",
      insight: "כשמאפסים מכנה עם ביטוי ריבועי, אתה מוצא רק שורש אחד ושוכח את השני — תמיד פרק לגורמים או השתמש בנוסחת השורשים.",
      remedy: { subTopicId: "domain-definition" },
      triggers: [
        { questionId: "fn-sub-dom-004", optionIndex: 1 },
      ],
    },
    {
      id: "domain-fraction-squared-literal",
      title: "לוקחים ערך מקורי במקום שורשו",
      skill: "dom-composite",
      insight: "אתה פוסל את $x = c^2$ במקום $x = \\pm c$ — כשמכנה מכיל $x^2$, יש לפתור $x^2 = k$ ולקחת שורש ריבועי.",
      remedy: { subTopicId: "domain-definition" },
      triggers: [
        { questionId: "fn-sub-dom-004", optionIndex: 2 },
      ],
    },
    {
      id: "intersections-coordinate-swap",
      title: "החלפת קואורדינטות בנקודות חיתוך",
      skill: "int-axis",
      insight: "אתה מחליף בין $x$ ו-$y$ בנקודות החיתוך — חיתוך עם ציר $y$ הוא $(0, f(0))$ וחיתוך עם ציר $x$ הוא $(x_0, 0)$.",
      remedy: { subTopicId: "intersections-signs" },
      triggers: [
        { questionId: "fn-sub-int-001", optionIndex: 1 },
        { questionId: "fn-sub-int-002", optionIndex: 1 },
      ],
    },
    {
      id: "intersections-y-takes-linear-coeff",
      title: "לוקחים מקדם של $x$ כחיתוך עם ציר $y$",
      skill: "int-axis",
      insight: "אתה לוקח את מקדם $x$ כחיתוך עם ציר $y$ — יש להציב $x = 0$ ולחשב את ערך הפונקציה; רק המקדם החופשי קובע.",
      remedy: { subTopicId: "intersections-signs" },
      triggers: [
        { questionId: "fn-sub-int-001", optionIndex: 2 },
      ],
    },
    {
      id: "intersections-x-sign-error",
      title: "טעות סימן בשורשי המשוואה הריבועית",
      skill: "int-axis",
      insight: "אתה מקבל שורשים עם סימן הפוך בחיתוך עם ציר $x$ — שים לב לפירוק: $(x - a)(x - b) = 0$ נותן $x = a$ ו-$x = b$, לא $-a$ ו-$-b$.",
      remedy: { subTopicId: "intersections-signs" },
      triggers: [
        { questionId: "fn-sub-int-002", optionIndex: 2 },
      ],
    },
    {
      id: "sign-parabola-inverted",
      title: "סימן פרבולה הפוך — פנים וחוץ מתחלפים",
      skill: "sign-parabola",
      insight: "אתה מציין את הקטע שבין השורשים כחיובי, אבל פרבולה הפתוחה כלפי מעלה שלילית בין שורשיה וחיובית מחוצה להם.",
      remedy: { subTopicId: "intersections-signs" },
      triggers: [
        { questionId: "fn-sub-int-003", optionIndex: 1 },
      ],
    },
    {
      id: "sign-parabola-half-domain",
      title: "מתעלמים מהענף הסימטרי של הפרבולה",
      skill: "sign-parabola",
      insight: "אתה נותן רק חצי מתחום החיוביות של הפרבולה — פרבולה סימטרית נותנת ערכים חיוביים בשני הצדדים של הצירים.",
      remedy: { subTopicId: "intersections-signs" },
      triggers: [
        { questionId: "fn-sub-int-003", optionIndex: 2 },
      ],
    },
    {
      id: "asy-vertical-as-horizontal",
      title: "כותבים אסימפטוטה אנכית כ-$y = c$ במקום $x = c$",
      skill: "asy-vertical",
      insight: "אתה כותב את האסימפטוטה האנכית בצורה $y = c$ — אסימפטוטה אנכית היא ישר אנכי ומשוואתה תמיד $x = c$.",
      remedy: { subTopicId: "asymptotes-rational" },
      triggers: [
        { questionId: "fn-sub-asy-001", optionIndex: 1 },
      ],
    },
    {
      id: "asy-vertical-at-zero",
      title: "מציבים $x = 0$ כאסימפטוטה אנכית",
      skill: "asy-vertical",
      insight: "אתה בוחר $x = 0$ כאסימפטוטה האנכית במקום לפתור את המשוואה שהמכנה שווה לאפס — יש לאפס את המכנה ולמצוא את ה-$x$ המתאים.",
      remedy: { subTopicId: "asymptotes-rational" },
      triggers: [
        { questionId: "fn-sub-asy-001", optionIndex: 2 },
      ],
    },
    {
      id: "asy-horizontal-wrong-rule-equal-degree",
      title: "מחזירים $y = 0$ כשהמעלות שוות",
      skill: "asy-horizontal",
      insight: "אתה קובע $y = 0$ כאסימפטוטה האופקית גם כשמעלות המונה והמכנה שוות — כלל $y = 0$ חל רק כשמעלת המונה קטנה ממעלת המכנה; כשהן שוות, האסימפטוטה היא יחס המקדמים המובילים.",
      remedy: { subTopicId: "asymptotes-rational" },
      triggers: [
        { questionId: "fn-sub-asy-002", optionIndex: 1 },
      ],
    },
    {
      id: "asy-horizontal-free-coeff",
      title: "לוקחים מקדם חופשי כאסימפטוטה אופקית",
      skill: "asy-horizontal",
      insight: "אתה משתמש במקדם החופשי של המונה כאסימפטוטה האופקית — רק המקדמים המובילים (של החזקה הגבוהה ביותר) קובעים את ההתנהגות באינסוף.",
      remedy: { subTopicId: "asymptotes-rational" },
      triggers: [
        { questionId: "fn-sub-asy-002", optionIndex: 2 },
        { questionId: "fn-sub-asy-003", optionIndex: 2 },
      ],
    },
    {
      id: "asy-horizontal-leading-ratio-wrong-degree",
      title: "יחס מקדמים מובילים כשהמעלות שונות",
      skill: "asy-horizontal",
      insight: "אתה לוקח את יחס המקדמים המובילים גם כשמעלות המונה והמכנה שונות — יחס זה תקף רק כשהמעלות שוות; כשמעלת המכנה גדולה, האסימפטוטה היא $y = 0$.",
      remedy: { subTopicId: "asymptotes-rational" },
      triggers: [
        { questionId: "fn-sub-asy-003", optionIndex: 1 },
      ],
    },
    {
      id: "even-odd-power-confusion",
      title: "בלבול בין זוגיות לאי-זוגיות לפי חזקה",
      skill: "even-odd",
      insight: "אתה מחליף בין זוגיות לאי-זוגיות של פונקציית חזקה — פונקציה עם חזקה זוגית ($x^2$) היא זוגית, ועם חזקה אי-זוגית ($x^3$) היא אי-זוגית.",
      remedy: { subTopicId: "even-odd-inverse" },
      triggers: [
        { questionId: "fn-sub-eoi-001", optionIndex: 1 },
        { questionId: "fn-sub-eoi-002", optionIndex: 1 },
      ],
    },
    {
      id: "even-odd-neither-when-is",
      title: "קביעת 'לא זוגית ולא אי-זוגית' בטעות",
      skill: "even-odd",
      insight: "אתה קובע שפונקציה אינה זוגית ואינה אי-זוגית מבלי לבדוק את ההגדרה — הצב $-x$ ופשט; אם מתקבל $f(x)$ הפונקציה זוגית, אם $-f(x)$ היא אי-זוגית.",
      remedy: { subTopicId: "even-odd-inverse" },
      triggers: [
        { questionId: "fn-sub-eoi-001", optionIndex: 2 },
        { questionId: "fn-sub-eoi-002", optionIndex: 2 },
      ],
    },
    {
      id: "even-odd-mixed-claims-even",
      title: "פונקציה מעורבת מוגדרת כזוגית",
      skill: "even-odd-mixed",
      insight: "אתה מסווג פונקציה שמכילה איברים זוגיים ואי-זוגיים כזוגית — בדוק על-ידי הצבה: אם $f(-x) \\ne f(x)$, הפונקציה אינה זוגית.",
      remedy: { subTopicId: "even-odd-inverse" },
      triggers: [
        { questionId: "fn-sub-eoi-003", optionIndex: 1 },
      ],
    },
    {
      id: "even-odd-mixed-claims-odd",
      title: "פונקציה מעורבת מוגדרת כאי-זוגית",
      skill: "even-odd-mixed",
      insight: "אתה מסווג פונקציה שמכילה איברים זוגיים ואי-זוגיים כאי-זוגית — בדוק על-ידי הצבה: אם $f(-x) \\ne -f(x)$, הפונקציה אינה אי-זוגית.",
      remedy: { subTopicId: "even-odd-inverse" },
      triggers: [
        { questionId: "fn-sub-eoi-003", optionIndex: 2 },
      ],
    },
  ],
  questionSkills: {
    "fn-sub-dom-001": ["dom-fraction"],
    "fn-sub-dom-002": ["dom-sqrt"],
    "fn-sub-dom-003": ["dom-ln"],
    "fn-sub-dom-004": ["dom-composite"],
    "fn-sub-int-001": ["int-axis"],
    "fn-sub-int-002": ["int-axis"],
    "fn-sub-int-003": ["sign-parabola"],
    "fn-sub-asy-001": ["asy-vertical"],
    "fn-sub-asy-002": ["asy-horizontal"],
    "fn-sub-asy-003": ["asy-horizontal"],
    "fn-sub-eoi-001": ["even-odd"],
    "fn-sub-eoi-002": ["even-odd"],
    "fn-sub-eoi-003": ["even-odd-mixed"],
  },
};
