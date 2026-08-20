// ============================================================
// Cognition catalog — math5 · הסתברות
// ============================================================
//
// 7 skills · 10 misconceptions ·
// 15 triggers over 7 MCQs.
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
const TOPIC = "הסתברות";

export const probabilityCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "prob-sample-space", title: "ספירת תוצאות — מה שרוצים חלקי מה שיש", subject: SUBJECT, topic: TOPIC, subTopicId: "pr-basics", prereqs: [], band: "easy" },
    { id: "prob-complement", title: "חישוב הסתברות המאורע המשלים", subject: SUBJECT, topic: TOPIC, subTopicId: "pr-basics", prereqs: ["prob-sample-space"], band: "easy" },
    { id: "prob-union-rule", title: "כלל החיבור $P(A \\cup B) = P(A)+P(B)-P(A \\cap B)$", subject: SUBJECT, topic: TOPIC, subTopicId: "pr-basics", prereqs: ["prob-complement"], band: "mid" },
    { id: "prob-conditional-def", title: "הגדרת הסתברות מותנית $P(A|B)$", subject: SUBJECT, topic: TOPIC, subTopicId: "pr-conditional", prereqs: ["prob-union-rule"], band: "easy" },
    { id: "prob-without-replacement", title: "הסתברות בשליפה בלי החזרה", subject: SUBJECT, topic: TOPIC, subTopicId: "pr-conditional", prereqs: ["prob-conditional-def"], band: "easy" },
    { id: "prob-combinations", title: "ספירת צירופים $\\binom{n}{k}$", subject: SUBJECT, topic: TOPIC, subTopicId: "pr-bernoulli", prereqs: ["prob-sample-space"], band: "easy" },
    { id: "prob-binomial", title: "התפלגות בינומית $P(X=k)$", subject: SUBJECT, topic: TOPIC, subTopicId: "pr-bernoulli", prereqs: ["prob-combinations"], band: "easy" },
  ],
  misconceptions: [
    {
      id: "misc-boundary-inclusive",
      title: "כולל את גבול האי-שוויון במאורע",
      skill: "prob-sample-space",
      insight: "כשמדובר במספר גדול מ-$k$, אתה נוטה לכלול את $k$ עצמו בספירה — אך \"גדול מ\" אינו כולל את הגבול.",
      remedy: { subTopicId: "pr-basics" },
      triggers: [
        { questionId: "prob-sub-basics-001", optionIndex: 1 },
      ],
    },
    {
      id: "misc-complement-confusion",
      title: "מחזיר את המאורע המשלים במקום המאורע עצמו",
      skill: "prob-complement",
      insight: "אתה מחשב נכון את $1 - P(A)$, אך בוחר בתשובה ההפוכה — את המשלים של המבוקש במקום את המבוקש עצמו.",
      remedy: { subTopicId: "pr-basics" },
      triggers: [
        { questionId: "prob-sub-basics-001", optionIndex: 2 },
        { questionId: "prob-sub-basics-002", optionIndex: 1 },
      ],
    },
    {
      id: "misc-complement-add-instead-subtract",
      title: "מוסיף $1$ להסתברות במקום לחסר ממנה",
      skill: "prob-complement",
      insight: "כשאתה מחשב משלים, אתה לפעמים מחשב $1 + P(A)$ במקום $1 - P(A)$ — התוצאה חורגת מ-$1$ ואינה הסתברות חוקית.",
      remedy: { subTopicId: "pr-basics" },
      triggers: [
        { questionId: "prob-sub-basics-002", optionIndex: 2 },
        { questionId: "prob-sub-basics-003", optionIndex: 3 },
      ],
    },
    {
      id: "misc-union-no-subtract-intersection",
      title: "שוכח לחסר את החיתוך בכלל החיבור",
      skill: "prob-union-rule",
      insight: "בחישוב $P(A \\cup B)$ אתה מחבר את שתי ההסתברויות אך שוכח לחסר את $P(A \\cap B)$, ולכן החיתוך נספר פעמיים.",
      remedy: { subTopicId: "pr-basics" },
      triggers: [
        { questionId: "prob-sub-basics-003", optionIndex: 1 },
      ],
    },
    {
      id: "misc-conditional-multiply-instead-divide",
      title: "כופל במקום לחלק בהסתברות מותנית",
      skill: "prob-conditional-def",
      insight: "בחישוב $P(A|B)$ אתה כופל את $P(A \\cap B)$ ב-$P(B)$ במקום לחלק — כפל מתאים להפיכת מותנית לחיתוך, לא להפך.",
      remedy: { subTopicId: "pr-conditional" },
      triggers: [
        { questionId: "prob-sub-cond-001", optionIndex: 1 },
      ],
    },
    {
      id: "misc-conditional-fraction-inverted",
      title: "הופך את השבר בנוסחת ההסתברות המותנית",
      skill: "prob-conditional-def",
      insight: "אתה מחלק את $P(B)$ ב-$P(A \\cap B)$ במקום להפך — המכנה בנוסחת ההסתברות המותנית הוא תמיד מאורע התנאי.",
      remedy: { subTopicId: "pr-conditional" },
      triggers: [
        { questionId: "prob-sub-cond-001", optionIndex: 3 },
      ],
    },
    {
      id: "misc-with-replacement-instead-without",
      title: "מחשב שליפה עם החזרה כשנדרשת שליפה בלי החזרה",
      skill: "prob-without-replacement",
      insight: "כשנאמר שהשליפה היא בלי החזרה, אתה משאיר את המכנה קבוע בין שליפה לשליפה — אך גם מספר הכדורים הכולל יורד בכל שליפה.",
      remedy: { subTopicId: "pr-conditional" },
      triggers: [
        { questionId: "prob-sub-cond-002", optionIndex: 1 },
        { questionId: "prob-sub-cond-002", optionIndex: 3 },
      ],
    },
    {
      id: "misc-permutation-instead-combination",
      title: "סופר סידורים במקום צירופים",
      skill: "prob-combinations",
      insight: "כשהסדר אינו משנה (למשל בוועדה), אתה סופר כל בחירה פעמיים — עליך לחלק ב-$k!$ כדי לקבל צירופים.",
      remedy: { subTopicId: "pr-bernoulli" },
      triggers: [
        { questionId: "prob-sub-comb-001", optionIndex: 1 },
        { questionId: "prob-sub-comb-001", optionIndex: 3 },
      ],
    },
    {
      id: "misc-binomial-wrong-coefficient",
      title: "מחשב מקדם בינומי שגוי ב-$P(X=k)$",
      skill: "prob-binomial",
      insight: "אתה לוקח את $n$ כמקדם הבינומי גם כשיש מסלול יחיד בלבד — $\\binom{n}{n} = 1$ תמיד, ולא $n$.",
      remedy: { subTopicId: "pr-bernoulli" },
      triggers: [
        { questionId: "prob-sub-comb-002", optionIndex: 1 },
      ],
    },
    {
      id: "misc-binomial-multiply-instead-power",
      title: "מכפיל את ההסתברות ב-$n$ במקום להעלות בחזקת $n$",
      skill: "prob-binomial",
      insight: "בחישוב הסתברות של $n$ ניסויים עצמאיים אתה מחשב $p \\cdot n$ במקום $p^n$ — בניסויים עצמאיים מכפילים הסתברויות, כלומר מעלים בחזקה.",
      remedy: { subTopicId: "pr-bernoulli" },
      triggers: [
        { questionId: "prob-sub-comb-002", optionIndex: 2 },
        { questionId: "prob-sub-comb-002", optionIndex: 3 },
      ],
    },
  ],
  questionSkills: {
    "prob-sub-basics-001": ["prob-sample-space","prob-complement"],
    "prob-sub-basics-002": ["prob-complement"],
    "prob-sub-basics-003": ["prob-union-rule"],
    "prob-sub-cond-001": ["prob-conditional-def"],
    "prob-sub-cond-002": ["prob-without-replacement"],
    "prob-sub-comb-001": ["prob-combinations"],
    "prob-sub-comb-002": ["prob-binomial"],
  },
};
