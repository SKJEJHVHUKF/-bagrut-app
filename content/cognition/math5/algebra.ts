// ============================================================
// Cognition catalog — math5 · אלגברה
// ============================================================
//
// 10 skills · 12 misconceptions ·
// 19 triggers over 13 MCQs.
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
const TOPIC = "אלגברה";

export const algebraCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "quad-factor-roots", title: "פירוק ריבועית ומציאת שורשים", subject: SUBJECT, topic: TOPIC, subTopicId: "quadratic-equations", prereqs: [], band: "easy" },
    { id: "quad-difference-squares", title: "פתרון הפרש ריבועים", subject: SUBJECT, topic: TOPIC, subTopicId: "quadratic-equations", prereqs: ["quad-factor-roots"], band: "easy" },
    { id: "quad-vertex", title: "מציאת קודקוד הפרבולה", subject: SUBJECT, topic: TOPIC, subTopicId: "quadratic-equations", prereqs: ["quad-factor-roots"], band: "mid" },
    { id: "discriminant-sign", title: "קביעת מספר פתרונות לפי דיסקרימיננטה", subject: SUBJECT, topic: TOPIC, subTopicId: "discriminant-parameter", prereqs: [], band: "easy" },
    { id: "discriminant-parameter-range", title: "מציאת ערכי פרמטר לפי תנאי על הדיסקרימיננטה", subject: SUBJECT, topic: TOPIC, subTopicId: "discriminant-parameter", prereqs: ["discriminant-sign"], band: "mid" },
    { id: "radical-solve", title: "פתרון משוואות עם שורש ריבועי", subject: SUBJECT, topic: TOPIC, subTopicId: "radical-rational", prereqs: [], band: "easy" },
    { id: "radical-domain", title: "תחום הגדרה של ביטוי עם שורש", subject: SUBJECT, topic: TOPIC, subTopicId: "radical-rational", prereqs: [], band: "easy" },
    { id: "rational-domain-solve", title: "פתרון משוואה רציונלית תוך שמירת תחום הגדרה", subject: SUBJECT, topic: TOPIC, subTopicId: "radical-rational", prereqs: ["quad-factor-roots"], band: "mid" },
    { id: "quadratic-inequality", title: "פתרון אי-שוויון ריבועי", subject: SUBJECT, topic: TOPIC, subTopicId: "inequalities", prereqs: ["quad-factor-roots"], band: "easy" },
    { id: "absolute-value-inequality", title: "פתרון אי-שוויון עם ערך מוחלט", subject: SUBJECT, topic: TOPIC, subTopicId: "inequalities", prereqs: [], band: "mid" },
  ],
  misconceptions: [
    {
      id: "quad-roots-wrong-signs",
      title: "היפוך סימני שני השורשים",
      skill: "quad-factor-roots",
      insight: "אתה מוצא זוג מספרים עם המכפלה והסכום הנכונים, אבל הופך את הסימן של שניהם — מקבל $-2, -3$ במקום $2, 3$ או $-2, 4$ במקום $2, -4$.",
      remedy: { subTopicId: "quadratic-equations" },
      triggers: [
        { questionId: "alg-sub-quad-001", optionIndex: 1 },
        { questionId: "alg-sub-quad-003", optionIndex: 1 },
      ],
    },
    {
      id: "quad-roots-both-wrong-sign",
      title: "שני שורשים עם סימן שגוי ביחס למקדם החופשי",
      skill: "quad-factor-roots",
      insight: "אתה בוחר שני שורשים בעלי אותו סימן כשהמקדם החופשי שלילי (או להפך) — המכפלה שלהם לא יכולה להתאים למקדם החופשי.",
      remedy: { subTopicId: "quadratic-equations" },
      triggers: [
        { questionId: "alg-sub-quad-003", optionIndex: 2 },
        { questionId: "alg-sub-quad-003", optionIndex: 3 },
      ],
    },
    {
      id: "diff-squares-missing-negative-root",
      title: "השמטת השורש השלילי בהפרש ריבועים",
      skill: "quad-difference-squares",
      insight: "כשאתה פותר $x^2 = c$ אתה לוקח רק את השורש החיובי ושוכח ש-$x$ יכול להיות גם שלילי — $(-\\sqrt{c})^2 = c$ בדיוק כמו $(\\sqrt{c})^2 = c$.",
      remedy: { subTopicId: "quadratic-equations" },
      triggers: [
        { questionId: "alg-sub-quad-002", optionIndex: 1 },
        { questionId: "alg-sub-quad-002", optionIndex: 3 },
      ],
    },
    {
      id: "vertex-x-sign-error",
      title: "טעות סימן בנוסחת ה-$x$ של הקודקוד",
      skill: "quad-vertex",
      insight: "אתה מחשב $x_v = \\dfrac{b}{2a}$ במקום $x_v = -\\dfrac{b}{2a}$ — שוכח את הסימן המינוס שבנוסחה.",
      remedy: { subTopicId: "quadratic-equations" },
      triggers: [
        { questionId: "alg-sub-quad-004", optionIndex: 1 },
      ],
    },
    {
      id: "discriminant-direction-error",
      title: "היפוך כיוון האי-שוויון בתנאי על הדיסקרימיננטה",
      skill: "discriminant-parameter-range",
      insight: "אתה מגיע לאי-שוויון הנכון על $\\Delta$ אבל הופך את כיוון הפתרון על $m$ — מקבל $m > 9$ כשהתשובה הנכונה היא $m < 9$, או להפך.",
      remedy: { subTopicId: "discriminant-parameter" },
      triggers: [
        { questionId: "alg-sub-disc-002", optionIndex: 1 },
        { questionId: "alg-sub-disc-003", optionIndex: 1 },
      ],
    },
    {
      id: "discriminant-boundary-inclusion",
      title: "הכללת גבול $\\Delta = 0$ כשנדרשים שורשים שונים",
      skill: "discriminant-parameter-range",
      insight: "אתה כותב $m \\le 9$ או $m \\ge 1$ במקום אי-שוויון חזק — שוכח ש-$\\Delta = 0$ נותן שורש כפול אחד, לא שני שורשים שונים.",
      remedy: { subTopicId: "discriminant-parameter" },
      triggers: [
        { questionId: "alg-sub-disc-002", optionIndex: 2 },
        { questionId: "alg-sub-disc-003", optionIndex: 2 },
      ],
    },
    {
      id: "radical-forgot-subtract-after-square",
      title: "שכחת להעביר את הקבוע אחרי ריבוע שני האגפים",
      skill: "radical-solve",
      insight: "אחרי שאתה מרבע את שני האגפים ומקבל $x + 3 = 4$, אתה שוכח לבצע את הצעד הבא ומחזיר $4$ כתשובה במקום לחשב $x = 4 - 3 = 1$.",
      remedy: { subTopicId: "radical-rational" },
      triggers: [
        { questionId: "alg-sub-rad-001", optionIndex: 1 },
      ],
    },
    {
      id: "radical-domain-direction",
      title: "היפוך כיוון האי-שוויון בתחום השורש",
      skill: "radical-domain",
      insight: "אתה פותר את $2x - 6 \\ge 0$ ומקבל $x \\le 3$ — הופך את כיוון האי-שוויון בטעות במקום לקבל $x \\ge 3$.",
      remedy: { subTopicId: "radical-rational" },
      triggers: [
        { questionId: "alg-sub-rad-002", optionIndex: 1 },
      ],
    },
    {
      id: "rational-zero-denominator-ignored",
      title: "קבלת פתרון שמאפס את המכנה",
      skill: "rational-domain-solve",
      insight: "אתה מצמצם את הביטוי הרציונלי ופותר, אבל לא בודק שהפתרון אינו מאפס את המכנה — ערך שמאפס גם מונה וגם מכנה נפסל מתחום ההגדרה.",
      remedy: { subTopicId: "radical-rational" },
      triggers: [
        { questionId: "alg-sub-rad-004", optionIndex: 1 },
        { questionId: "alg-sub-rad-004", optionIndex: 2 },
      ],
    },
    {
      id: "quadratic-ineq-inside-vs-outside",
      title: "בחירת התחום הפנימי במקום החיצוני (ריבועי)",
      skill: "quadratic-inequality",
      insight: "אתה מזהה את השורשים נכון, אבל בוחר את התחום שבין השורשים כשצריך את מחוץ להם, או להפך — פרבולה פתוחה כלפי מעלה חיובית מחוץ לשורשים ושלילית ביניהם.",
      remedy: { subTopicId: "inequalities" },
      triggers: [
        { questionId: "alg-sub-ineq-001", optionIndex: 1 },
        { questionId: "alg-sub-ineq-002", optionIndex: 1 },
      ],
    },
    {
      id: "abs-inequality-wrong-direction",
      title: "פתרון אי-השוויון ההפוך לערך מוחלט",
      skill: "absolute-value-inequality",
      insight: "כשאתה פותר $|x - a| < r$ אתה מוצא את הקטע שמחוץ לשורשים במקום שביניהם — מתבלבל בין $|x-a| < r$ ל-$|x-a| > r$.",
      remedy: { subTopicId: "inequalities" },
      triggers: [
        { questionId: "alg-sub-ineq-003", optionIndex: 1 },
      ],
    },
    {
      id: "abs-inequality-forgot-shift",
      title: "שכחת ההזזה בפתיחת ערך מוחלט",
      skill: "absolute-value-inequality",
      insight: "אתה פותח $|x - 1| < 3$ ומקבל $-3 < x < 3$ — שוכח להוסיף את ה-$1$ לכל האגפים אחרי הפתיחה.",
      remedy: { subTopicId: "inequalities" },
      triggers: [
        { questionId: "alg-sub-ineq-003", optionIndex: 2 },
      ],
    },
  ],
  questionSkills: {
    "alg-sub-quad-001": ["quad-factor-roots"],
    "alg-sub-quad-002": ["quad-difference-squares"],
    "alg-sub-quad-003": ["quad-factor-roots"],
    "alg-sub-quad-004": ["quad-vertex"],
    "alg-sub-disc-001": ["discriminant-sign"],
    "alg-sub-disc-002": ["discriminant-parameter-range"],
    "alg-sub-disc-003": ["discriminant-parameter-range"],
    "alg-sub-rad-001": ["radical-solve"],
    "alg-sub-rad-002": ["radical-domain"],
    "alg-sub-rad-004": ["rational-domain-solve"],
    "alg-sub-ineq-001": ["quadratic-inequality"],
    "alg-sub-ineq-002": ["quadratic-inequality"],
    "alg-sub-ineq-003": ["absolute-value-inequality"],
  },
};
