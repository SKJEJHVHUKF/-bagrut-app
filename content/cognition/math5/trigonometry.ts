// ============================================================
// Cognition catalog — math5 · טריגונומטריה
// ============================================================
//
// 8 skills · 13 misconceptions ·
// 19 triggers over 8 MCQs.
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
const TOPIC = "טריגונומטריה";

export const trigonometryCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "pythagorean-identity", title: "זהות פיתגורס", subject: SUBJECT, topic: TOPIC, subTopicId: "trig-identities", prereqs: [], band: "easy" },
    { id: "double-angle-identity", title: "נוסחאות זווית כפולה", subject: SUBJECT, topic: TOPIC, subTopicId: "trig-identities", prereqs: ["pythagorean-identity"], band: "mid" },
    { id: "sin-general-solution", title: "פתרון כללי של משוואת סינוס", subject: SUBJECT, topic: TOPIC, subTopicId: "trig-equations", prereqs: [], band: "easy" },
    { id: "trig-eq-algebraic-manipulation", title: "מניפולציה אלגברית במשוואות טריגונומטריות", subject: SUBJECT, topic: TOPIC, subTopicId: "trig-equations", prereqs: ["sin-general-solution"], band: "mid" },
    { id: "special-angles-values", title: "ערכי הפונקציות בזוויות מיוחדות", subject: SUBJECT, topic: TOPIC, subTopicId: "special-angles-reduction", prereqs: [], band: "easy" },
    { id: "quadrant-sign-reduction", title: "קביעת רבע וסימן עם זוויות צמצום", subject: SUBJECT, topic: TOPIC, subTopicId: "special-angles-reduction", prereqs: ["special-angles-values"], band: "mid" },
    { id: "trig-derivatives", title: "נגזרות של פונקציות טריגונומטריות", subject: SUBJECT, topic: TOPIC, subTopicId: "trig-calculus", prereqs: [], band: "easy" },
    { id: "trig-amplitude", title: "משרעת של צירוף סינוס וקוסינוס", subject: SUBJECT, topic: TOPIC, subTopicId: "trig-calculus", prereqs: ["pythagorean-identity","trig-derivatives"], band: "hard" },
  ],
  misconceptions: [
    {
      id: "double-angle-missing-factor-2",
      title: "שכחת המקדם $2$ בנוסחת הזווית הכפולה",
      skill: "double-angle-identity",
      insight: "אתה מוותר על הכפלה ב-$2$ בנוסחת $\\sin 2x = 2\\sin x\\cos x$ ומשתמש בערך $\\sin x\\cos x$ כמו שהוא.",
      remedy: { subTopicId: "trig-identities" },
      triggers: [
        { questionId: "trig-sub-id-003", optionIndex: 1 },
      ],
    },
    {
      id: "double-angle-divided-instead-of-multiply",
      title: "חילוק ב-$2$ במקום כפל בנוסחת הזווית הכפולה",
      skill: "double-angle-identity",
      insight: "אתה מחלק ב-$2$ במקום להכפיל כש-$\\sin 2x = 2\\sin x\\cos x$ — המקדם $2$ נמצא במונה, לא במכנה.",
      remedy: { subTopicId: "trig-identities" },
      triggers: [
        { questionId: "trig-sub-id-003", optionIndex: 2 },
      ],
    },
    {
      id: "cos-general-solution-for-sin",
      title: "שימוש בתבנית $\\pm\\alpha$ של קוסינוס עבור סינוס",
      skill: "sin-general-solution",
      insight: "אתה מיישם את התבנית $\\pm\\alpha + 360°k$ (השייכת לקוסינוס) על משוואות סינוס, ומפספס שהסינוס אינו פונקציה זוגית.",
      remedy: { subTopicId: "trig-equations" },
      triggers: [
        { questionId: "trig-sub-eq-001", optionIndex: 2 },
      ],
    },
    {
      id: "sin-period-180-instead-of-360",
      title: "מחזור $180°$ לסינוס במקום $360°$",
      skill: "sin-general-solution",
      insight: "אתה משתמש במחזור $180°$ עבור הסינוס — זה מחזור הטנגנס. מחזור הסינוס הוא $360°$.",
      remedy: { subTopicId: "trig-equations" },
      triggers: [
        { questionId: "trig-sub-eq-001", optionIndex: 3 },
      ],
    },
    {
      id: "sin-missing-second-family",
      title: "אובדן משפחת הפתרונות השנייה של הסינוס",
      skill: "sin-general-solution",
      insight: "אתה מוצא רק את הפתרון הראשון $\\alpha + 360°k$ ומאבד את המשפחה השנייה $180° - \\alpha + 360°k$; לכל משוואת סינוס יש שתי משפחות.",
      remedy: { subTopicId: "trig-equations" },
      triggers: [
        { questionId: "trig-sub-eq-001", optionIndex: 1 },
        { questionId: "trig-sub-eq-005", optionIndex: 1 },
      ],
    },
    {
      id: "boundary-point-omitted",
      title: "השמטת נקודת קצה סגורה מהתחום",
      skill: "trig-eq-algebraic-manipulation",
      insight: "אתה מדלג על ערכים בקצה הסגור של התחום (כגון $0°$) בעת ספירת פתרונות.",
      remedy: { subTopicId: "trig-equations" },
      triggers: [
        { questionId: "trig-sub-eq-005", optionIndex: 2 },
      ],
    },
    {
      id: "wrong-sign-in-quadrant",
      title: "סימן שגוי של פונקציה ברבע",
      skill: "quadrant-sign-reduction",
      insight: "אתה קובע נכון את זווית הבסיס אך מצמיד לה סימן שגוי — אינך בודק לאיזה רבע שייכת הזווית המקורית ואיזה סימן נכון בו.",
      remedy: { subTopicId: "special-angles-reduction" },
      triggers: [
        { questionId: "trig-sub-sp-001", optionIndex: 1 },
        { questionId: "trig-sub-sp-004", optionIndex: 3 },
      ],
    },
    {
      id: "wrong-base-angle",
      title: "זווית בסיס שגויה בצמצום",
      skill: "quadrant-sign-reduction",
      insight: "אתה מצמצם לזווית בסיס שגויה (למשל $60°$ במקום $30°$) כשאתה מחשב פונקציה טריגונומטרית של זווית מורחבת.",
      remedy: { subTopicId: "special-angles-reduction" },
      triggers: [
        { questionId: "trig-sub-sp-001", optionIndex: 2 },
        { questionId: "trig-sub-sp-001", optionIndex: 3 },
      ],
    },
    {
      id: "wrong-quadrant-identification",
      title: "זיהוי שגוי של הרבע לפי גודל הזווית",
      skill: "quadrant-sign-reduction",
      insight: "אתה מייחס זווית לרבע הלא נכון — אינך בודק בין אילו מכפלות של $90°$ היא נמצאת.",
      remedy: { subTopicId: "special-angles-reduction" },
      triggers: [
        { questionId: "trig-sub-sp-004", optionIndex: 1 },
        { questionId: "trig-sub-sp-004", optionIndex: 2 },
      ],
    },
    {
      id: "cos-derivative-sign-lost",
      title: "אובדן המינוס בנגזרת הקוסינוס",
      skill: "trig-derivatives",
      insight: "אתה נוגר $\\cos x$ ל-$+\\sin x$ במקום $-\\sin x$ — הנגזרת של הקוסינוס משנה סימן.",
      remedy: { subTopicId: "trig-calculus" },
      triggers: [
        { questionId: "trig-sub-calc-001", optionIndex: 1 },
        { questionId: "trig-sub-calc-001", optionIndex: 2 },
      ],
    },
    {
      id: "both-trig-derivatives-negated",
      title: "שלילת שתי הנגזרות הטריגונומטריות",
      skill: "trig-derivatives",
      insight: "אתה מוסיף מינוס לנגזרות של גם $\\sin x$ וגם $\\cos x$, אך רק $\\cos x$ נגזר לערך שלילי — $\\sin x$ נגזר ל-$+\\cos x$.",
      remedy: { subTopicId: "trig-calculus" },
      triggers: [
        { questionId: "trig-sub-calc-001", optionIndex: 3 },
      ],
    },
    {
      id: "amplitude-sum-not-root-sum-squares",
      title: "חיבור המקדמים במקום חישוב $\\sqrt{a^2+b^2}$",
      skill: "trig-amplitude",
      insight: "אתה מחשב את המקסימום של $a\\sin x + b\\cos x$ כ-$a+b$ במקום $\\sqrt{a^2+b^2}$ — $\\sin x$ ו-$\\cos x$ לא מגיעים למקסימום שלהם בו-זמנית.",
      remedy: { subTopicId: "trig-calculus" },
      triggers: [
        { questionId: "trig-sub-calc-006", optionIndex: 1 },
        { questionId: "trig-sub-calc-006", optionIndex: 3 },
      ],
    },
    {
      id: "amplitude-difference-squares",
      title: "חיסור ריבועי המקדמים במקום חיבורם",
      skill: "trig-amplitude",
      insight: "אתה מחשב $\\sqrt{a^2 - b^2}$ כמשרעת במקום $\\sqrt{a^2+b^2}$ — הריבועים מתחברים בנוסחת המשרעת, לא מתחסרים.",
      remedy: { subTopicId: "trig-calculus" },
      triggers: [
        { questionId: "trig-sub-calc-006", optionIndex: 2 },
      ],
    },
  ],
  questionSkills: {
    "trig-sub-id-001": ["pythagorean-identity"],
    "trig-sub-id-003": ["double-angle-identity"],
    "trig-sub-eq-001": ["sin-general-solution"],
    "trig-sub-eq-005": ["sin-general-solution","trig-eq-algebraic-manipulation"],
    "trig-sub-sp-001": ["special-angles-values","quadrant-sign-reduction"],
    "trig-sub-sp-004": ["quadrant-sign-reduction"],
    "trig-sub-calc-001": ["trig-derivatives"],
    "trig-sub-calc-006": ["trig-amplitude"],
  },
};
