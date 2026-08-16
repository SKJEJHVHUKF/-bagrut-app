// ============================================================
// Cognition catalog — math5 · חשבון אינטגרלי
// ============================================================
//
// 8 skills · 16 misconceptions ·
// 23 triggers over 9 MCQs.
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
const TOPIC = "חשבון אינטגרלי";

export const integralCalculusCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "indef-power-rule", title: "כלל החזקה לאינטגרל", subject: SUBJECT, topic: TOPIC, subTopicId: "basic-integration", prereqs: [], band: "easy" },
    { id: "indef-constant-of-integration", title: "קבוע האינטגרציה $+C$", subject: SUBJECT, topic: TOPIC, subTopicId: "basic-integration", prereqs: ["indef-power-rule"], band: "easy" },
    { id: "indef-trig-antiderivatives", title: "קדומות של פונקציות טריגונומטריות", subject: SUBJECT, topic: TOPIC, subTopicId: "basic-integration", prereqs: ["indef-power-rule"], band: "easy" },
    { id: "indef-linear-substitution", title: "אינטגרל של פונקציה מורכבת לינארית", subject: SUBJECT, topic: TOPIC, subTopicId: "basic-integration", prereqs: ["indef-trig-antiderivatives"], band: "mid" },
    { id: "def-newton-leibniz", title: "נוסחת ניוטון-לייבניץ", subject: SUBJECT, topic: TOPIC, subTopicId: "definite-integral", prereqs: ["indef-power-rule"], band: "easy" },
    { id: "def-trig-definite", title: "אינטגרל מסוים של פונקציות טריגונומטריות", subject: SUBJECT, topic: TOPIC, subTopicId: "definite-integral", prereqs: ["indef-trig-antiderivatives","def-newton-leibniz"], band: "mid" },
    { id: "area-setup", title: "הגדרת גבולות השטח בין עקומות", subject: SUBJECT, topic: TOPIC, subTopicId: "area-between-curves", prereqs: ["def-newton-leibniz"], band: "mid" },
    { id: "volume-revolution-formula", title: "נוסחת נפח גוף הסיבוב", subject: SUBJECT, topic: TOPIC, subTopicId: "volume-revolution", prereqs: ["def-newton-leibniz"], band: "mid" },
  ],
  misconceptions: [
    {
      id: "differentiate-instead-of-integrate",
      title: "גוזרים במקום לאנטגרל",
      skill: "indef-power-rule",
      insight: "אתה מחשב את הנגזרת של האינטגרנד במקום את הקדומה שלו — התוצאה היא הנגזרת, לא האינטגרל.",
      remedy: { subTopicId: "basic-integration" },
      triggers: [
        { questionId: "int-sub-basic-001", optionIndex: 2 },
        { questionId: "int-sub-basic-002", optionIndex: 1 },
      ],
    },
    {
      id: "multiply-instead-of-divide-by-new-exponent",
      title: "כופלים במעריך החדש במקום לחלק",
      skill: "indef-power-rule",
      insight: "אתה כופל את המקדם במעריך החדש במקום לחלק בו — הכפל שייך לגזירה, לא לאינטגרציה.",
      remedy: { subTopicId: "basic-integration" },
      triggers: [
        { questionId: "int-sub-basic-001", optionIndex: 3 },
        { questionId: "int-sub-basic-002", optionIndex: 3 },
        { questionId: "int-sub-def-001", optionIndex: 3 },
      ],
    },
    {
      id: "divide-by-old-exponent",
      title: "מחלקים במעריך המקורי ולא בחדש",
      skill: "indef-power-rule",
      insight: "אתה מחלק במעריך המקורי של $x$ במקום במעריך לאחר ההעלאה — למשל מחלק ב-$5$ במקום ב-$6$ כשמאנטגרלים את $x^5$.",
      remedy: { subTopicId: "basic-integration" },
      triggers: [
        { questionId: "int-sub-basic-002", optionIndex: 2 },
        { questionId: "int-sub-area-001", optionIndex: 3 },
      ],
    },
    {
      id: "missing-constant-of-integration",
      title: "שוכחים את $+C$",
      skill: "indef-constant-of-integration",
      insight: "אתה מחשב את הקדומה נכון אבל שוכח לצרף את קבוע האינטגרציה $+C$ — לאינטגרל לא מסוים תמיד יש אינסוף קדומות.",
      remedy: { subTopicId: "basic-integration" },
      triggers: [
        { questionId: "int-sub-basic-001", optionIndex: 1 },
      ],
    },
    {
      id: "wrong-trig-sign",
      title: "סימן שגוי בקדומה הטריגונומטרית",
      skill: "indef-trig-antiderivatives",
      insight: "אתה מוסיף מינוס לקדומה של $\\cos$ או לוקח $\\cos$ כקדומה של $\\sin$ בלי מינוס — הסימנים בין קדומות הסינוס והקוסינוס מתחלפים בקלות.",
      remedy: { subTopicId: "basic-integration" },
      triggers: [
        { questionId: "int-sub-basic-003", optionIndex: 1 },
        { questionId: "int-sub-basic-003", optionIndex: 3 },
        { questionId: "int-sub-def-003", optionIndex: 3 },
      ],
    },
    {
      id: "trig-antiderivative-confusion",
      title: "מעתיקים את האינטגרנד הטריגונומטרי כקדומה",
      skill: "indef-trig-antiderivatives",
      insight: "אתה כותב את אותה פונקציה טריגונומטרית כקדומה שלה עצמה, כאילו $\\cos$ או $\\sin$ הם הקדומה של עצמם.",
      remedy: { subTopicId: "basic-integration" },
      triggers: [
        { questionId: "int-sub-basic-003", optionIndex: 2 },
      ],
    },
    {
      id: "linear-substitution-omit-factor",
      title: "מתעלמים מתיקון הנגזרת הפנימית",
      skill: "indef-linear-substitution",
      insight: "כשמאנטגרלים $f(ax+b)$ אתה שוכח לחלק ב-$a$ — גזירת התשובה נותנת ביטוי גדול פי $a$ מהאינטגרנד.",
      remedy: { subTopicId: "basic-integration" },
      triggers: [
        { questionId: "int-sub-basic-004", optionIndex: 1 },
      ],
    },
    {
      id: "linear-substitution-multiply-factor",
      title: "כופלים בנגזרת הפנימית במקום לחלק",
      skill: "indef-linear-substitution",
      insight: "כשמאנטגרלים $f(ax+b)$ אתה כופל ב-$a$ במקום לחלק בו — הכפל שייך לגזירה, לא לאינטגרציה.",
      remedy: { subTopicId: "basic-integration" },
      triggers: [
        { questionId: "int-sub-basic-004", optionIndex: 2 },
      ],
    },
    {
      id: "forgot-subtract-lower-bound",
      title: "מציבים רק בגבול העליון",
      skill: "def-newton-leibniz",
      insight: "אתה מציב רק את הגבול העליון בקדומה ושוכח להחסיר את ערכה בגבול התחתון — נוסחת ניוטון-לייבניץ היא תמיד $F(b) - F(a)$.",
      remedy: { subTopicId: "definite-integral" },
      triggers: [
        { questionId: "int-sub-def-002", optionIndex: 1 },
        { questionId: "int-sub-def-003", optionIndex: 2 },
      ],
    },
    {
      id: "add-bounds-instead-of-subtract",
      title: "מחברים את ערכי הגבולות במקום להחסיר",
      skill: "def-newton-leibniz",
      insight: "אתה מחבר $F(b) + F(a)$ במקום לחשב $F(b) - F(a)$ — נוסחת ניוטון-לייבניץ מחייבת חיסור, לא חיבור.",
      remedy: { subTopicId: "definite-integral" },
      triggers: [
        { questionId: "int-sub-def-002", optionIndex: 2 },
      ],
    },
    {
      id: "forgot-upper-bound",
      title: "מציבים רק בגבול התחתון",
      skill: "def-newton-leibniz",
      insight: "אתה מחשב רק את $F(a)$ ומתעלם מהגבול העליון לגמרי — בנוסחת ניוטון-לייבניץ חייבים להציב בשני הגבולות.",
      remedy: { subTopicId: "definite-integral" },
      triggers: [
        { questionId: "int-sub-def-002", optionIndex: 3 },
      ],
    },
    {
      id: "symmetry-cancels-positive-area",
      title: "\"סימטריה\" מאפסת שטח חיובי",
      skill: "def-trig-definite",
      insight: "אתה מניח שסימטריה של הפונקציה מאפסת את האינטגרל — אבל כשהפונקציה חיובית לאורך כל התחום, השטח חיובי ואינו מתבטל.",
      remedy: { subTopicId: "definite-integral" },
      triggers: [
        { questionId: "int-sub-def-003", optionIndex: 1 },
      ],
    },
    {
      id: "area-only-half-domain",
      title: "מחשבים שטח על חצי התחום בלבד",
      skill: "area-setup",
      insight: "אתה מאנטגרל רק על חלק מהתחום הנדרש — יש לקבוע את שני גבולות האינטגרל לפי כל נקודות החיתוך של הפונקציה עם ציר $x$.",
      remedy: { subTopicId: "area-between-curves" },
      triggers: [
        { questionId: "int-sub-area-001", optionIndex: 1 },
      ],
    },
    {
      id: "volume-missing-pi",
      title: "שוכחים את $\\pi$ בנפח גוף הסיבוב",
      skill: "volume-revolution-formula",
      insight: "אתה מחשב את האינטגרל נכון אבל שוכח להכפיל ב-$\\pi$ — בנוסחת נפח הסיבוב $\\pi$ עומד מחוץ לאינטגרל וחייב להופיע בתשובה.",
      remedy: { subTopicId: "volume-revolution" },
      triggers: [
        { questionId: "int-sub-vol-001", optionIndex: 1 },
      ],
    },
    {
      id: "volume-no-squaring",
      title: "לא מרבעים את $f(x)$ בנוסחת הנפח",
      skill: "volume-revolution-formula",
      insight: "אתה שוכח להעלות את $f(x)$ בריבוע לפני האינטגרציה — נוסחת נפח הסיבוב היא $\\pi\\int [f(x)]^2\\,dx$, לא $\\pi\\int f(x)\\,dx$.",
      remedy: { subTopicId: "volume-revolution" },
      triggers: [
        { questionId: "int-sub-vol-001", optionIndex: 3 },
      ],
    },
    {
      id: "volume-multiply-not-divide-exponent",
      title: "כופלים במעריך בנוסחת הנפח במקום לחלק",
      skill: "volume-revolution-formula",
      insight: "כשמאנטגרלים את $[f(x)]^2$ אתה כופל במעריך החדש במקום לחלק בו — הכפל שייך לגזירה, לא לאינטגרציה.",
      remedy: { subTopicId: "volume-revolution" },
      triggers: [
        { questionId: "int-sub-vol-001", optionIndex: 2 },
      ],
    },
  ],
  questionSkills: {
    "int-sub-basic-001": ["indef-power-rule","indef-constant-of-integration"],
    "int-sub-basic-002": ["indef-power-rule"],
    "int-sub-basic-003": ["indef-trig-antiderivatives"],
    "int-sub-basic-004": ["indef-linear-substitution"],
    "int-sub-def-001": ["indef-power-rule","def-newton-leibniz"],
    "int-sub-def-002": ["def-newton-leibniz"],
    "int-sub-def-003": ["def-trig-definite"],
    "int-sub-area-001": ["area-setup","indef-power-rule"],
    "int-sub-vol-001": ["volume-revolution-formula"],
  },
};
