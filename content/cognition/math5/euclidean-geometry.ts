// ============================================================
// Cognition catalog — math5 · גיאומטריה אוקלידית
// ============================================================
//
// 12 skills · 16 misconceptions ·
// 23 triggers over 12 MCQs.
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
const TOPIC = "גיאומטריה אוקלידית";

export const euclideanGeometryCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "cong-theorems-id", title: "זיהוי משפטי חפיפה", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-congruence", prereqs: [], band: "easy" },
    { id: "cong-apply", title: "יישום משפט חפיפה על נתוני שאלה", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-congruence", prereqs: ["cong-theorems-id"], band: "easy" },
    { id: "cong-proof", title: "הוכחת חפיפה ממשפט צ.צ.צ", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-congruence", prereqs: ["cong-apply"], band: "mid" },
    { id: "sim-ratio-area", title: "יחס שטחים במשולשים דומים", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-similarity", prereqs: [], band: "easy" },
    { id: "sim-side-ratio", title: "חישוב צלע חסרה לפי יחס דמיון", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-similarity", prereqs: [], band: "easy" },
    { id: "sim-altitude-theorem", title: "משפט הגובה אל היתר", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-similarity", prereqs: ["sim-side-ratio"], band: "mid" },
    { id: "thales-ratio", title: "שימוש ביחסי תאלס", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-thales", prereqs: [], band: "easy" },
    { id: "thales-midline", title: "קו האמצעים במשולש", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-thales", prereqs: ["thales-ratio"], band: "easy" },
    { id: "thales-angle-bisector", title: "חוצה זווית ויחס הצלעות", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-thales", prereqs: ["thales-ratio"], band: "mid" },
    { id: "circle-central-inscribed", title: "זווית מרכזית וזווית היקפית", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-circle", prereqs: [], band: "easy" },
    { id: "circle-thales", title: "זווית היקפית על קוטר — משפט תאלס במעגל", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-circle", prereqs: ["circle-central-inscribed"], band: "easy" },
    { id: "circle-chords", title: "מיתרים נחתכים בתוך מעגל", subject: SUBJECT, topic: TOPIC, subTopicId: "eg-circle", prereqs: ["circle-central-inscribed"], band: "mid" },
  ],
  misconceptions: [
    {
      id: "zzz-is-congruence",
      title: "ז.ז.ז — חפיפה",
      skill: "cong-theorems-id",
      insight: "אתה חושב שנתוני זווית-זווית-זווית מספיקים לחפיפה, אבל הם קובעים רק צורה — לא גודל. זה משפט דמיון ולא חפיפה.",
      remedy: { subTopicId: "eg-congruence" },
      triggers: [
        { questionId: "eg-sub-cong-001", optionIndex: 0 },
        { questionId: "eg-sub-cong-001", optionIndex: 1 },
        { questionId: "eg-sub-cong-001", optionIndex: 3 },
      ],
    },
    {
      id: "sim-ratio-not-squared",
      title: "יחס שטחים = יחס צלעות",
      skill: "sim-ratio-area",
      insight: "אתה לוקח את יחס הצלעות $k$ ישירות כיחס השטחים, במקום להעלות אותו בריבוע: יחס השטחים הוא $k^2$.",
      remedy: { subTopicId: "eg-similarity" },
      triggers: [
        { questionId: "eg-sub-sim-001", optionIndex: 0 },
        { questionId: "eg-sub-sim-001", optionIndex: 3 },
      ],
    },
    {
      id: "sim-ratio-cubed",
      title: "יחס שטחים = יחס נפחים ($k^3$)",
      skill: "sim-ratio-area",
      insight: "אתה מחשב יחס שטחים עם $k^3$, זו הנוסחה לנפחים בגופים תלת-ממדיים. לשטחים (דו-ממד) נכון להשתמש ביחס $k^2$.",
      remedy: { subTopicId: "eg-similarity" },
      triggers: [
        { questionId: "eg-sub-sim-001", optionIndex: 2 },
      ],
    },
    {
      id: "sim-additive-not-multiplicative",
      title: "דמיון בחיבור ולא בכפל",
      skill: "sim-side-ratio",
      insight: "אתה מוסיף את ההפרש בין הצלעות המתאימות במקום להכפיל ביחס הדמיון. דמיון פועל בכפל: כל צלע מוכפלת באותו יחס $k$.",
      remedy: { subTopicId: "eg-similarity" },
      triggers: [
        { questionId: "eg-sub-sim-002", optionIndex: 1 },
      ],
    },
    {
      id: "sim-inverted-ratio",
      title: "יחס דמיון הפוך",
      skill: "sim-side-ratio",
      insight: "אתה מכפיל ביחס ההפוך — מחלק כאשר צריך לכפול, או להפך. בדוק תמיד לאיזה כיוון \"גדל\" המשולש ואם התוצאה הגיונית.",
      remedy: { subTopicId: "eg-similarity" },
      triggers: [
        { questionId: "eg-sub-sim-002", optionIndex: 2 },
        { questionId: "eg-sub-thales-001", optionIndex: 1 },
        { questionId: "eg-sub-thales-003", optionIndex: 2 },
      ],
    },
    {
      id: "altitude-arithmetic-mean",
      title: "גובה אל יתר = ממוצע חשבוני",
      skill: "sim-altitude-theorem",
      insight: "אתה מחשב את הגובה אל היתר כממוצע חשבוני $\\dfrac{a+b}{2}$, אבל משפט הגובה נותן ממוצע הנדסי: $CH = \\sqrt{AH \\cdot HB}$.",
      remedy: { subTopicId: "eg-similarity" },
      triggers: [
        { questionId: "eg-sub-sim-003", optionIndex: 1 },
      ],
    },
    {
      id: "altitude-forgot-sqrt",
      title: "שכחת לחלץ שורש בגובה אל יתר",
      skill: "sim-altitude-theorem",
      insight: "אתה עוצר אחרי $CH^2 = AH \\cdot HB$ ומחזיר את $CH^2$ כתשובה. צריך להוציא שורש: $CH = \\sqrt{AH \\cdot HB}$.",
      remedy: { subTopicId: "eg-similarity" },
      triggers: [
        { questionId: "eg-sub-sim-003", optionIndex: 3 },
      ],
    },
    {
      id: "thales-copy-segment",
      title: "העתקת קטע ידוע כתשובה",
      skill: "thales-ratio",
      insight: "אתה לוקח קטע ידוע מהשאלה ישירות כתשובה במקום לחשב. בתאלס — וגם בחוצה זווית — היחסים בין שתי הצלעות השונות אינם שווים בהכרח.",
      remedy: { subTopicId: "eg-thales" },
      triggers: [
        { questionId: "eg-sub-thales-001", optionIndex: 2 },
        { questionId: "eg-sub-thales-003", optionIndex: 3 },
      ],
    },
    {
      id: "thales-midline-double",
      title: "קו האמצעים — הכפלה במקום חלוקה",
      skill: "thales-midline",
      insight: "אתה מכפיל פי $2$ את הצלע השלישית, אבל קו האמצעים קצר ממנה — הוא שווה למחציתה.",
      remedy: { subTopicId: "eg-thales" },
      triggers: [
        { questionId: "eg-sub-thales-002", optionIndex: 1 },
      ],
    },
    {
      id: "thales-midline-same",
      title: "קו האמצעים שווה לצלע המקבילה",
      skill: "thales-midline",
      insight: "אתה חושב שקו האמצעים שווה לצלע שהוא מקביל לה. למעשה הוא שווה למחצית בלבד.",
      remedy: { subTopicId: "eg-thales" },
      triggers: [
        { questionId: "eg-sub-thales-002", optionIndex: 0 },
      ],
    },
    {
      id: "bisector-is-median",
      title: "חוצה זווית = תיכון",
      skill: "thales-angle-bisector",
      insight: "אתה מניח שחוצה הזווית חוצה גם את הצלע שממול לשניים שווים. חוצה זווית מחלק את הצלע שממול ביחס $\\dfrac{AB}{AC}$ ולא בהכרח לשניים שווים.",
      remedy: { subTopicId: "eg-thales" },
      triggers: [
        { questionId: "eg-sub-thales-003", optionIndex: 1 },
      ],
    },
    {
      id: "inscribed-equals-central",
      title: "זווית היקפית = זווית מרכזית",
      skill: "circle-central-inscribed",
      insight: "אתה שווה את הזווית ההיקפית לזווית המרכזית. הזווית ההיקפית שווה למחצית הזווית המרכזית על אותה קשת.",
      remedy: { subTopicId: "eg-circle" },
      triggers: [
        { questionId: "eg-sub-circ-001", optionIndex: 1 },
        { questionId: "eg-sub-circ-002", optionIndex: 3 },
      ],
    },
    {
      id: "inscribed-double-central",
      title: "זווית היקפית = כפולת הזווית המרכזית",
      skill: "circle-central-inscribed",
      insight: "אתה מכפיל פי $2$ במקום לחלק במספר $2$. המרכזית היא זו שכפולה מההיקפית — לא להפך.",
      remedy: { subTopicId: "eg-circle" },
      triggers: [
        { questionId: "eg-sub-circ-001", optionIndex: 2 },
      ],
    },
    {
      id: "circle-supplement-error",
      title: "השלמה לסכום $180°$ במקום חלוקה במספר $2$",
      skill: "circle-central-inscribed",
      insight: "אתה מחשב $180° - \\angle AOB$ במקום $\\dfrac{\\angle AOB}{2}$. השלמה לסכום $180°$ נכונה לזוויות צמודות — לא ליחס היקפית-מרכזית.",
      remedy: { subTopicId: "eg-circle" },
      triggers: [
        { questionId: "eg-sub-circ-001", optionIndex: 3 },
      ],
    },
    {
      id: "circle-chords-wrong-pairing",
      title: "שיוך שגוי של קטעי מיתרים נחתכים",
      skill: "circle-chords",
      insight: "אתה מכפיל קטעים משני מיתרים שונים זה בזה במקום להכפיל את שני קטעי אותו מיתר. הנוסחה הנכונה: $AE \\cdot EB = CE \\cdot ED$.",
      remedy: { subTopicId: "eg-circle" },
      triggers: [
        { questionId: "eg-sub-circ-003", optionIndex: 2 },
      ],
    },
    {
      id: "circle-chords-product-not-quotient",
      title: "החזרת המכפלה כולה במקום חלוקה",
      skill: "circle-chords",
      insight: "אתה עוצר אחרי $AE \\cdot EB$ ומחזיר את המכפלה כתשובה במקום לחלק באורך $CE$ כדי לקבל את $ED$.",
      remedy: { subTopicId: "eg-circle" },
      triggers: [
        { questionId: "eg-sub-circ-003", optionIndex: 3 },
      ],
    },
  ],
  questionSkills: {
    "eg-sub-cong-001": ["cong-theorems-id"],
    "eg-sub-cong-002": ["cong-apply"],
    "eg-sub-cong-003": ["cong-proof"],
    "eg-sub-sim-001": ["sim-ratio-area"],
    "eg-sub-sim-002": ["sim-side-ratio"],
    "eg-sub-sim-003": ["sim-altitude-theorem"],
    "eg-sub-thales-001": ["thales-ratio"],
    "eg-sub-thales-002": ["thales-midline"],
    "eg-sub-thales-003": ["thales-angle-bisector"],
    "eg-sub-circ-001": ["circle-central-inscribed"],
    "eg-sub-circ-002": ["circle-thales","circle-central-inscribed"],
    "eg-sub-circ-003": ["circle-chords"],
  },
};
