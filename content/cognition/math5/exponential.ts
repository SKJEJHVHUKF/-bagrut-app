// ============================================================
// Cognition catalog — math5 · פונקציה מעריכית
// ============================================================
//
// 11 skills · 14 misconceptions ·
// 32 triggers over 21 MCQs.
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
const TOPIC = "פונקציה מעריכית";

export const exponentialCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "chain-rule-exp", title: "כלל השרשרת עם פונקציה מעריכית", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-derivatives", prereqs: [], band: "easy" },
    { id: "base-a-derivative", title: "נגזרת של $a^x$ לבסיס כללי", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-derivatives", prereqs: ["chain-rule-exp"], band: "easy" },
    { id: "exp-equation-same-base", title: "פתרון משוואה מעריכית עם בסיס זהה", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-equations", prereqs: [], band: "easy" },
    { id: "exp-equation-ln", title: "פתרון $e^x = c$ באמצעות לוגריתם טבעי", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-equations", prereqs: [], band: "easy" },
    { id: "exp-range-positivity", title: "תחום הערכים של $e^x$: חיוביות ממש", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-equations", prereqs: [], band: "easy" },
    { id: "exp-domain", title: "תחום הגדרה של פונקציה מעריכית", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-investigation", prereqs: [], band: "easy" },
    { id: "exp-intercepts", title: "נקודות חיתוך עם הצירים", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-investigation", prereqs: ["exp-domain"], band: "easy" },
    { id: "exp-zeros-derivative", title: "מאפסי נגזרת של פונקציה מעריכית", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-investigation", prereqs: ["chain-rule-exp"], band: "easy" },
    { id: "exp-asymptote", title: "אסימפטוטה של שבר עם מעריכית", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-investigation", prereqs: ["exp-domain","exp-equation-ln"], band: "mid" },
    { id: "exp-integral-linear", title: "אינטגרל של $e^{ax+b}$", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-integrals", prereqs: ["chain-rule-exp"], band: "easy" },
    { id: "definite-integral-exp", title: "אינטגרל מסוים עם פונקציה מעריכית", subject: SUBJECT, topic: TOPIC, subTopicId: "exp-integrals", prereqs: ["exp-integral-linear"], band: "easy" },
  ],
  misconceptions: [
    {
      id: "missing-inner-derivative",
      title: "שכחת נגזרת פנימית במעריך",
      skill: "chain-rule-exp",
      insight: "אתה גוזר $e^{g(x)}$ ומקבל $e^{g(x)}$ בלי להכפיל ב-$g'(x)$ — כלל השרשרת דורש להכפיל תמיד בנגזרת של המעריך.",
      remedy: { subTopicId: "exp-derivatives" },
      triggers: [
        { questionId: "exp-sub-deriv-001", optionIndex: 1 },
        { questionId: "exp-sub-deriv-002", optionIndex: 1 },
        { questionId: "exp-sub-deriv-006", optionIndex: 1 },
        { questionId: "exp-sub-deriv-007", optionIndex: 1 },
      ],
    },
    {
      id: "inner-itself-not-derivative",
      title: "הכפלה במעריך עצמו במקום בנגזרתו",
      skill: "chain-rule-exp",
      insight: "אתה מכפיל את $e^{g(x)}$ בביטוי $g(x)$ עצמו במקום ב-$g'(x)$ — בכלל השרשרת יורדת נגזרת הפנימי, לא הפנימי עצמו.",
      remedy: { subTopicId: "exp-derivatives" },
      triggers: [
        { questionId: "exp-sub-deriv-001", optionIndex: 2 },
        { questionId: "exp-sub-deriv-002", optionIndex: 2 },
        { questionId: "exp-sub-deriv-006", optionIndex: 3 },
      ],
    },
    {
      id: "sign-lost-in-chain",
      title: "אובדן הסימן השלילי בנגזרת פנימית",
      skill: "chain-rule-exp",
      insight: "אתה שוכח את המינוס כשהמעריך שלילי — $(-ax)' = -a$, ולכן הנגזרת הכוללת חייבת לצאת שלילית כשהפונקציה יורדת.",
      remedy: { subTopicId: "exp-derivatives" },
      triggers: [
        { questionId: "exp-sub-deriv-002", optionIndex: 3 },
        { questionId: "exp-sub-deriv-006", optionIndex: 2 },
      ],
    },
    {
      id: "power-rule-on-exp",
      title: "שימוש בכלל החזקה על פונקציה מעריכית",
      skill: "base-a-derivative",
      insight: "אתה מוריד את החזקה ב-$1$ כאילו הביטוי הוא $x^n$ — כלל החזקה חל כשהמשתנה הוא הבסיס, ואילו ב-$a^x$ המשתנה הוא המעריך.",
      remedy: { subTopicId: "exp-derivatives" },
      triggers: [
        { questionId: "exp-sub-deriv-008", optionIndex: 2 },
      ],
    },
    {
      id: "integral-multiplies-instead-divides",
      title: "כפל במקדם באינטגרל במקום חילוק",
      skill: "exp-integral-linear",
      insight: "אתה מכפיל ב-$a$ כשמחשב $\\int e^{ax+b}\\,dx$ במקום לחלק — גזירה חוזרת מפריכה: $(a \\cdot e^{ax+b})' = a^2 e^{ax+b}$.",
      remedy: { subTopicId: "exp-integrals" },
      triggers: [
        { questionId: "exp-sub-int-001", optionIndex: 1 },
        { questionId: "exp-sub-int-006", optionIndex: 2 },
      ],
    },
    {
      id: "integral-missing-coefficient",
      title: "שכחת מקדם $\\frac{1}{a}$ באינטגרל מעריכי",
      skill: "exp-integral-linear",
      insight: "אתה כותב $\\int e^{ax+b}\\,dx = e^{ax+b} + C$ ושוכח את המקדם $\\frac{1}{a}$ — גזירה חוזרת מחזירה את המקדם ומפריכה את הביטוי.",
      remedy: { subTopicId: "exp-integrals" },
      triggers: [
        { questionId: "exp-sub-int-001", optionIndex: 2 },
        { questionId: "exp-sub-int-006", optionIndex: 1 },
        { questionId: "exp-sub-int-007", optionIndex: 1 },
      ],
    },
    {
      id: "definite-integral-missing-lower-bound",
      title: "שכחת להציב את הגבול התחתון",
      skill: "definite-integral-exp",
      insight: "אתה מציב רק את הגבול העליון בקדומה ושוכח לחסר את הצבת הגבול התחתון — כלל ניוטון–לייבניץ הוא $F(b) - F(a)$.",
      remedy: { subTopicId: "exp-integrals" },
      triggers: [
        { questionId: "exp-sub-int-002", optionIndex: 1 },
        { questionId: "exp-sub-int-008", optionIndex: 2 },
      ],
    },
    {
      id: "definite-integral-reversed-bounds",
      title: "היפוך סדר גבולות באינטגרל מסוים",
      skill: "definite-integral-exp",
      insight: "אתה מחשב $F(a) - F(b)$ במקום $F(b) - F(a)$ — הסדר הוא תמיד עליון פחות תחתון, ולכן הפוך נותן תוצאה שלילית כשהאינטגרנד חיובי.",
      remedy: { subTopicId: "exp-integrals" },
      triggers: [
        { questionId: "exp-sub-int-002", optionIndex: 2 },
        { questionId: "exp-sub-int-008", optionIndex: 1 },
      ],
    },
    {
      id: "same-base-sign-error",
      title: "שגיאת סימן בהעברת אגפים במשוואה מעריכית",
      skill: "exp-equation-same-base",
      insight: "אתה מעביר איברים בין אגפים ומאבד את הסימן — כדאי לבדוק בהצבה: אם שני האגפים לא שווים, הסימן ודאי השתבש.",
      remedy: { subTopicId: "exp-equations" },
      triggers: [
        { questionId: "exp-sub-eq-001", optionIndex: 3 },
        { questionId: "exp-sub-eq-006", optionIndex: 1 },
      ],
    },
    {
      id: "ln-vs-log10",
      title: "שימוש ב-$\\log$ עשרוני במקום $\\ln$ טבעי",
      skill: "exp-equation-ln",
      insight: "אתה כותב $\\log c$ כפתרון של $e^x = c$, אך ההופכי של $e^x$ הוא הלוגריתם הטבעי $\\ln$ — $\\log$ ללא בסיס מציין בסיס $10$.",
      remedy: { subTopicId: "exp-equations" },
      triggers: [
        { questionId: "exp-sub-eq-002", optionIndex: 3 },
        { questionId: "exp-sub-inv-011", optionIndex: 1 },
      ],
    },
    {
      id: "exp-always-positive",
      title: "אי-הכרה שטווח $e^x$ חיובי ממש — אין פתרון לערך שלילי",
      skill: "exp-range-positivity",
      insight: "אתה מניח שיש פתרון ל-$e^x = c$ גם כש-$c \\le 0$ — $e^x$ חיובי ממש לכל $x$, ולכן משוואה כזו חסרת פתרון.",
      remedy: { subTopicId: "exp-equations" },
      triggers: [
        { questionId: "exp-sub-eq-008", optionIndex: 1 },
        { questionId: "exp-sub-eq-008", optionIndex: 2 },
        { questionId: "exp-sub-inv-008", optionIndex: 2 },
      ],
    },
    {
      id: "domain-excludes-exp-zeros",
      title: "פסילת נקודות שמאפסות את המעריך (ולא את המכנה)",
      skill: "exp-domain",
      insight: "אתה פוסל ערכי $x$ שמאפסים את המעריך, אבל $e^0 = 1$ תקין לחלוטין — פסילה נדרשת רק כשמכנה מתאפס.",
      remedy: { subTopicId: "exp-investigation" },
      triggers: [
        { questionId: "exp-sub-inv-001", optionIndex: 1 },
        { questionId: "exp-sub-inv-006", optionIndex: 3 },
      ],
    },
    {
      id: "domain-requires-positivity",
      title: "דרישת אי-שליליות מיותרת בפונקציה מעריכית",
      skill: "exp-domain",
      insight: "אתה מגביל את תחום ההגדרה ל-$x \\ge 0$ כאילו יש שורש — $e^u$ מוגדרת לכל $u$ ממשי, גם שלילי.",
      remedy: { subTopicId: "exp-investigation" },
      triggers: [
        { questionId: "exp-sub-inv-001", optionIndex: 2 },
        { questionId: "exp-sub-inv-006", optionIndex: 2 },
      ],
    },
    {
      id: "y-intercept-axes-swap",
      title: "היפוך צירים בחישוב נקודת חיתוך",
      skill: "exp-intercepts",
      insight: "אתה מחזיר נקודה שבה שיעור ה-$x$ אינו אפס — חיתוך עם ציר $y$ מתקבל תמיד בהצבת $x=0$, ושיעור ה-$x$ של הנקודה הוא $0$.",
      remedy: { subTopicId: "exp-investigation" },
      triggers: [
        { questionId: "exp-sub-inv-007", optionIndex: 2 },
        { questionId: "exp-sub-inv-002", optionIndex: 1 },
      ],
    },
  ],
  questionSkills: {
    "exp-sub-deriv-001": ["chain-rule-exp"],
    "exp-sub-deriv-002": ["chain-rule-exp"],
    "exp-sub-deriv-006": ["chain-rule-exp"],
    "exp-sub-deriv-007": ["chain-rule-exp"],
    "exp-sub-deriv-008": ["base-a-derivative"],
    "exp-sub-eq-001": ["exp-equation-same-base"],
    "exp-sub-eq-002": ["exp-equation-ln"],
    "exp-sub-eq-006": ["exp-equation-same-base"],
    "exp-sub-eq-007": ["exp-equation-ln","exp-range-positivity"],
    "exp-sub-eq-008": ["exp-range-positivity"],
    "exp-sub-inv-001": ["exp-domain"],
    "exp-sub-inv-002": ["exp-intercepts"],
    "exp-sub-inv-006": ["exp-domain"],
    "exp-sub-inv-007": ["exp-intercepts"],
    "exp-sub-inv-008": ["exp-zeros-derivative","exp-range-positivity"],
    "exp-sub-inv-011": ["exp-asymptote"],
    "exp-sub-int-001": ["exp-integral-linear"],
    "exp-sub-int-002": ["definite-integral-exp"],
    "exp-sub-int-006": ["exp-integral-linear"],
    "exp-sub-int-007": ["exp-integral-linear"],
    "exp-sub-int-008": ["definite-integral-exp"],
  },
};
