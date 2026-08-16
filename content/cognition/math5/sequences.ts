// ============================================================
// Cognition catalog — math5 · סדרות
// ============================================================
//
// 10 skills · 16 misconceptions ·
// 21 triggers over 10 MCQs.
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
const TOPIC = "סדרות";

export const sequencesCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "ar-nth-term", title: "נוסחת האיבר הכללי בסדרה חשבונית", subject: SUBJECT, topic: TOPIC, subTopicId: "arithmetic-sequences", prereqs: [], band: "easy" },
    { id: "ar-identify-condition", title: "תנאי הסדרה החשבונית ומציאת פרמטרים", subject: SUBJECT, topic: TOPIC, subTopicId: "arithmetic-sequences", prereqs: ["ar-nth-term"], band: "mid" },
    { id: "ge-nth-term", title: "נוסחת האיבר הכללי בסדרה הנדסית", subject: SUBJECT, topic: TOPIC, subTopicId: "geometric-sequences", prereqs: [], band: "easy" },
    { id: "ge-mean", title: "ממוצע הנדסי בין שני מספרים", subject: SUBJECT, topic: TOPIC, subTopicId: "geometric-sequences", prereqs: ["ge-nth-term"], band: "mid" },
    { id: "inf-convergence-condition", title: "תנאי התכנסות של סדרה הנדסית אינסופית", subject: SUBJECT, topic: TOPIC, subTopicId: "infinite-geometric", prereqs: ["ge-nth-term"], band: "easy" },
    { id: "inf-sum-formula", title: "נוסחת הסכום האינסופי המתכנס", subject: SUBJECT, topic: TOPIC, subTopicId: "infinite-geometric", prereqs: ["inf-convergence-condition"], band: "mid" },
    { id: "app-compound-interest", title: "ריבית דריבית כסדרה הנדסית", subject: SUBJECT, topic: TOPIC, subTopicId: "sequences-applications", prereqs: ["ge-nth-term"], band: "easy" },
    { id: "ind-base-step", title: "שלב הבסיס באינדוקציה", subject: SUBJECT, topic: TOPIC, subTopicId: "induction", prereqs: [], band: "easy" },
    { id: "ind-inductive-step", title: "שלב הצעד באינדוקציה", subject: SUBJECT, topic: TOPIC, subTopicId: "induction", prereqs: ["ind-base-step"], band: "mid" },
    { id: "ind-structure", title: "מבנה הוכחת האינדוקציה המלאה", subject: SUBJECT, topic: TOPIC, subTopicId: "induction", prereqs: ["ind-base-step","ind-inductive-step"], band: "mid" },
  ],
  misconceptions: [
    {
      id: "ar-off-by-one-high",
      title: "הכפלת $d$ ב-$n$ במקום ב-$n-1$",
      skill: "ar-nth-term",
      insight: "אתה מחשב $a_n = a_1 + n \\cdot d$ במקום $a_1 + (n-1) \\cdot d$, וכך מקבל איבר אחד יותר מדי.",
      remedy: { subTopicId: "arithmetic-sequences" },
      triggers: [
        { questionId: "seq-sub-ar-001", optionIndex: 1 },
      ],
    },
    {
      id: "ar-off-by-one-low",
      title: "עצירה איבר אחד מוקדם בסדרה חשבונית",
      skill: "ar-nth-term",
      insight: "אתה מחשב $a_{n-1}$ במקום $a_n$ — מפסיק להוסיף את $d$ צעד אחד לפני הסוף.",
      remedy: { subTopicId: "arithmetic-sequences" },
      triggers: [
        { questionId: "seq-sub-ar-001", optionIndex: 2 },
        { questionId: "seq-sub-ge-001", optionIndex: 1 },
      ],
    },
    {
      id: "ar-treated-as-proportional",
      title: "הכפלת $a_1$ ב-$n$ כאילו הסדרה פרופורציונלית",
      skill: "ar-nth-term",
      insight: "אתה מחשב $a_n = a_1 \\cdot n$ במקום $a_1 + (n-1) \\cdot d$ — מתייחס לסדרה כאילו היא כפולות של הראשון.",
      remedy: { subTopicId: "arithmetic-sequences" },
      triggers: [
        { questionId: "seq-sub-ar-001", optionIndex: 3 },
      ],
    },
    {
      id: "ar-wrong-consecutive-condition",
      title: "בדיקת הפרש בין צמד אחד בלבד",
      skill: "ar-identify-condition",
      insight: "אתה בודק שהפרש בין שני איברים עוקבים נכון, אבל שוכח לוודא שכל ההפרשים שווים.",
      remedy: { subTopicId: "arithmetic-sequences" },
      triggers: [
        { questionId: "seq-sub-ar-004", optionIndex: 1 },
        { questionId: "seq-sub-ar-004", optionIndex: 2 },
      ],
    },
    {
      id: "ge-off-by-one-high",
      title: "הכפלה ב-$q^n$ במקום ב-$q^{n-1}$ בסדרה הנדסית",
      skill: "ge-nth-term",
      insight: "אתה מחשב $a_n = a_1 \\cdot q^n$ במקום $a_1 \\cdot q^{n-1}$, וכך מקבל איבר אחד גבוה מדי.",
      remedy: { subTopicId: "geometric-sequences" },
      triggers: [
        { questionId: "seq-sub-ge-001", optionIndex: 2 },
      ],
    },
    {
      id: "ge-treated-as-arithmetic",
      title: "טיפול בסדרה הנדסית כחשבונית",
      skill: "ge-nth-term",
      insight: "אתה מוסיף הפרש קבוע במקום להכפיל ביחס $q$ — מחליף בין הסדרות.",
      remedy: { subTopicId: "geometric-sequences" },
      triggers: [
        { questionId: "seq-sub-ge-001", optionIndex: 3 },
      ],
    },
    {
      id: "ge-mean-arithmetic-instead",
      title: "שימוש בממוצע חשבוני במקום הנדסי",
      skill: "ge-mean",
      insight: "אתה מחשב $\\frac{a+b}{2}$ כשמבקשים ממוצע הנדסי — צריך $\\sqrt{a \\cdot b}$.",
      remedy: { subTopicId: "geometric-sequences" },
      triggers: [
        { questionId: "seq-sub-ge-004", optionIndex: 1 },
      ],
    },
    {
      id: "ge-mean-no-sqrt",
      title: "שכחת להוציא שורש בממוצע הנדסי",
      skill: "ge-mean",
      insight: "אתה מחשב את המכפלה $a \\cdot b$ אבל שוכח להוציא ממנה שורש ריבועי.",
      remedy: { subTopicId: "geometric-sequences" },
      triggers: [
        { questionId: "seq-sub-ge-004", optionIndex: 2 },
      ],
    },
    {
      id: "inf-convergence-sign-not-magnitude",
      title: "שיפוט התכנסות לפי סימן $q$ ולא לפי ערכו המוחלט",
      skill: "inf-convergence-condition",
      insight: "אתה חושב שסדרה מתכנסת כאשר $q$ חיובי, אבל הקובע הוא $|q| < 1$ — לא הסימן.",
      remedy: { subTopicId: "infinite-geometric" },
      triggers: [
        { questionId: "seq-sub-inf-001", optionIndex: 2 },
      ],
    },
    {
      id: "inf-formula-outside-domain",
      title: "הצבה עיוורת בנוסחת הסכום האינסופי מחוץ לתחום",
      skill: "inf-sum-formula",
      insight: "אתה מציב בנוסחה $\\frac{a_1}{1-q}$ גם כאשר $|q| \\geq 1$ — הנוסחה תקפה רק כשהסדרה מתכנסת.",
      remedy: { subTopicId: "infinite-geometric" },
      triggers: [
        { questionId: "seq-sub-inf-004", optionIndex: 1 },
        { questionId: "seq-sub-inf-004", optionIndex: 2 },
      ],
    },
    {
      id: "app-percent-as-fixed",
      title: "פירוש אחוז כסכום קבוע ולא כיחס",
      skill: "app-compound-interest",
      insight: "אתה מוסיף את מספר האחוזים כסכום שקלים קבוע, במקום לחשב את האחוז מתוך הקרן.",
      remedy: { subTopicId: "sequences-applications" },
      triggers: [
        { questionId: "seq-sub-app-001", optionIndex: 1 },
      ],
    },
    {
      id: "app-percent-decimal-shift",
      title: "הזזת הנקודה העשרונית ב-$\\%$ בכיוון שגוי",
      skill: "app-compound-interest",
      insight: "אתה ממיר $5\\%$ ל-$0.5$ במקום $0.05$, וכופל ב-$1.5$ במקום ב-$1.05$.",
      remedy: { subTopicId: "sequences-applications" },
      triggers: [
        { questionId: "seq-sub-app-001", optionIndex: 2 },
      ],
    },
    {
      id: "ind-base-confused-with-hypothesis",
      title: "בלבול בין שלב הבסיס להנחת האינדוקציה",
      skill: "ind-base-step",
      insight: "אתה מזהה את הנחת האינדוקציה ($n=k$) כשלב הבסיס — אלה שני שלבים שונים לחלוטין.",
      remedy: { subTopicId: "induction" },
      triggers: [
        { questionId: "seq-sub-ind-001", optionIndex: 1 },
      ],
    },
    {
      id: "ind-base-confused-with-step",
      title: "בלבול בין שלב הבסיס לצעד האינדוקציה",
      skill: "ind-base-step",
      insight: "אתה מזהה את צעד האינדוקציה ($k \\Rightarrow k+1$) כשלב הבסיס — הבסיס הוא רק הבדיקה ל-$n=1$.",
      remedy: { subTopicId: "induction" },
      triggers: [
        { questionId: "seq-sub-ind-001", optionIndex: 2 },
      ],
    },
    {
      id: "ind-step-sufficient-without-base",
      title: "הצעד בלבד מספיק להוכחה באינדוקציה",
      skill: "ind-structure",
      insight: "אתה חושב שהוכחת הצעד מספיקה גם בלי שלב הבסיס — בלי בסיס אין נקודת פתיחה לשרשרת.",
      remedy: { subTopicId: "induction" },
      triggers: [
        { questionId: "seq-sub-ind-002", optionIndex: 1 },
        { questionId: "seq-sub-ind-002", optionIndex: 2 },
      ],
    },
    {
      id: "ind-step-target-wrong-factor",
      title: "אי-עדכון גורם בנוסחה בצעד האינדוקציה",
      skill: "ind-inductive-step",
      insight: "אתה מציב $k+1$ בחלק מהגורמים בנוסחה אבל שוכח לעדכן את כולם — כל מופע של $n$ חייב להפוך ל-$k+1$.",
      remedy: { subTopicId: "induction" },
      triggers: [
        { questionId: "seq-sub-ind-005", optionIndex: 1 },
        { questionId: "seq-sub-ind-005", optionIndex: 3 },
      ],
    },
  ],
  questionSkills: {
    "seq-sub-ar-001": ["ar-nth-term"],
    "seq-sub-ar-004": ["ar-identify-condition"],
    "seq-sub-ge-001": ["ge-nth-term"],
    "seq-sub-ge-004": ["ge-mean"],
    "seq-sub-inf-001": ["inf-convergence-condition"],
    "seq-sub-inf-004": ["inf-convergence-condition","inf-sum-formula"],
    "seq-sub-app-001": ["app-compound-interest"],
    "seq-sub-ind-001": ["ind-base-step","ind-structure"],
    "seq-sub-ind-002": ["ind-structure"],
    "seq-sub-ind-005": ["ind-inductive-step"],
  },
};
