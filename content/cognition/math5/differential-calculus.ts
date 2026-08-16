// ============================================================
// Cognition catalog — math5 · חשבון דיפרנציאלי
// ============================================================
//
// 9 skills · 19 misconceptions ·
// 25 triggers over 9 MCQs.
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
const TOPIC = "חשבון דיפרנציאלי";

export const differentialCalculusCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "power-rule-basic", title: "כלל החזקה לפולינומים", subject: SUBJECT, topic: TOPIC, subTopicId: "derivative-rules", prereqs: [], band: "easy" },
    { id: "constant-derivative", title: "נגזרת של קבוע היא אפס", subject: SUBJECT, topic: TOPIC, subTopicId: "derivative-rules", prereqs: ["power-rule-basic"], band: "easy" },
    { id: "trig-derivatives", title: "נגזרות פונקציות טריגונומטריות", subject: SUBJECT, topic: TOPIC, subTopicId: "derivative-rules", prereqs: ["power-rule-basic"], band: "easy" },
    { id: "chain-rule", title: "כלל השרשרת", subject: SUBJECT, topic: TOPIC, subTopicId: "derivative-rules", prereqs: ["power-rule-basic","trig-derivatives"], band: "mid" },
    { id: "slope-from-derivative", title: "שיפוע המשיק כערך הנגזרת בנקודה", subject: SUBJECT, topic: TOPIC, subTopicId: "tangent-line", prereqs: ["power-rule-basic"], band: "easy" },
    { id: "tangent-line-equation", title: "בניית משוואת המשיק", subject: SUBJECT, topic: TOPIC, subTopicId: "tangent-line", prereqs: ["slope-from-derivative"], band: "mid" },
    { id: "critical-points", title: "מציאת נקודות קיצון", subject: SUBJECT, topic: TOPIC, subTopicId: "extrema-monotonicity", prereqs: ["power-rule-basic"], band: "easy" },
    { id: "classify-extrema", title: "סיווג קיצון: מקסימום ומינימום", subject: SUBJECT, topic: TOPIC, subTopicId: "extrema-monotonicity", prereqs: ["critical-points"], band: "mid" },
    { id: "monotonicity-intervals", title: "תחומי עלייה וירידה לפי סימן הנגזרת", subject: SUBJECT, topic: TOPIC, subTopicId: "extrema-monotonicity", prereqs: ["critical-points"], band: "mid" },
  ],
  misconceptions: [
    {
      id: "power-rule-exponent-only",
      title: "הורדת המעריך בלי הכפלה במקדם",
      skill: "power-rule-basic",
      insight: "כשאתה גוזר חזקה, אתה מוריד את המעריך אך שוכח להכפיל אותו במקדם שלפניו — שני השלבים חייבים לקרות יחד.",
      remedy: { subTopicId: "derivative-rules" },
      triggers: [
        { questionId: "der-sub-rules-001", optionIndex: 2 },
        { questionId: "der-sub-rules-002", optionIndex: 2 },
      ],
    },
    {
      id: "power-rule-exponent-not-reduced",
      title: "הכפלה במעריך בלי הורדתו",
      skill: "power-rule-basic",
      insight: "כשאתה גוזר חזקה, אתה מכפיל את המקדם במעריך אך המעריך עצמו נשאר כפי שהוא — לאחר גזירה הדרגה חייבת לרדת באחד.",
      remedy: { subTopicId: "derivative-rules" },
      triggers: [
        { questionId: "der-sub-rules-001", optionIndex: 3 },
        { questionId: "der-sub-rules-004", optionIndex: 2 },
      ],
    },
    {
      id: "constant-included-in-derivative",
      title: "שילוב האיבר החופשי בחישוב הנגזרת",
      skill: "constant-derivative",
      insight: "אתה מצרף את האיבר החופשי לחישוב הנגזרת במקום להשמיט אותו — נגזרת של קבוע היא תמיד אפס.",
      remedy: { subTopicId: "derivative-rules" },
      triggers: [
        { questionId: "der-sub-rules-001", optionIndex: 1 },
      ],
    },
    {
      id: "sin-not-differentiated",
      title: "העתקת $\\sin x$ במקום גזירתה",
      skill: "trig-derivatives",
      insight: "אתה מעתיק את $\\sin x$ כמו שהיא ולא גוזר אותה — הנגזרת של $\\sin x$ היא $\\cos x$, לא $\\sin x$.",
      remedy: { subTopicId: "derivative-rules" },
      triggers: [
        { questionId: "der-sub-rules-002", optionIndex: 3 },
      ],
    },
    {
      id: "wrong-sign-cos-derivative",
      title: "הוספת מינוס מיותר לנגזרת $\\sin$",
      skill: "trig-derivatives",
      insight: "אתה מוסיף מינוס לנגזרת של $\\sin x$ — המינוס שייך לנגזרת של $\\cos x$, בעוד שנגזרת של $\\sin x$ היא $+\\cos x$.",
      remedy: { subTopicId: "derivative-rules" },
      triggers: [
        { questionId: "der-sub-rules-002", optionIndex: 1 },
        { questionId: "der-sub-rules-003", optionIndex: 3 },
      ],
    },
    {
      id: "chain-rule-missing-inner",
      title: "שכחת הנגזרת הפנימית בכלל השרשרת",
      skill: "chain-rule",
      insight: "כשאתה גוזר פונקציה מורכבת, אתה שוכח להכפיל בנגזרת של הביטוי הפנימי — כלל השרשרת מחייב את שני הגורמים.",
      remedy: { subTopicId: "derivative-rules" },
      triggers: [
        { questionId: "der-sub-rules-003", optionIndex: 1 },
        { questionId: "der-sub-rules-004", optionIndex: 1 },
      ],
    },
    {
      id: "chain-rule-inner-derivative-halved",
      title: "חישוב חלקי של הנגזרת הפנימית",
      skill: "chain-rule",
      insight: "אתה לוקח חלק מהנגזרת הפנימית אך לא את כולה — למשל גוזר $x^2$ ל-$x$ במקום $2x$.",
      remedy: { subTopicId: "derivative-rules" },
      triggers: [
        { questionId: "der-sub-rules-004", optionIndex: 3 },
      ],
    },
    {
      id: "chain-rule-wrong-outer-function",
      title: "אי-החלפת הפונקציה החיצונית בגזירה",
      skill: "chain-rule",
      insight: "אתה מכפיל במקדם הנכון אך שוכח להחליף את הפונקציה החיצונית — למשל $\\sin$ נשאר $\\sin$ במקום להפוך ל-$\\cos$.",
      remedy: { subTopicId: "derivative-rules" },
      triggers: [
        { questionId: "der-sub-rules-003", optionIndex: 2 },
      ],
    },
    {
      id: "slope-is-function-value",
      title: "בלבול בין ערך הפונקציה לשיפוע המשיק",
      skill: "slope-from-derivative",
      insight: "אתה מציב את $x$ בפונקציה $f(x)$ ומחזיר את $f(x)$ כשיפוע — השיפוע הוא ערך הנגזרת $f'(x)$ בנקודה, לא ערך הפונקציה עצמה.",
      remedy: { subTopicId: "tangent-line" },
      triggers: [
        { questionId: "der-sub-tan-001", optionIndex: 1 },
        { questionId: "der-sub-tan-002", optionIndex: 2 },
      ],
    },
    {
      id: "slope-is-x-value",
      title: "החזרת ערך $x$ כשיפוע ללא הצבה בנגזרת",
      skill: "slope-from-derivative",
      insight: "אתה מחזיר את ערך $x$ עצמו כשיפוע, בלי להציב בנגזרת — יש להציב את $x$ ב-$f'(x)$ כדי לקבל את השיפוע.",
      remedy: { subTopicId: "tangent-line" },
      triggers: [
        { questionId: "der-sub-tan-001", optionIndex: 2 },
      ],
    },
    {
      id: "slope-without-substitution",
      title: "כתיבת הנגזרת ללא הצבת הנקודה",
      skill: "slope-from-derivative",
      insight: "אתה כותב את הנגזרת הכללית $f'(x)$ אך שוכח להציב את ערך $x$ הנתון — השיפוע בנקודה מתקבל רק לאחר ההצבה.",
      remedy: { subTopicId: "tangent-line" },
      triggers: [
        { questionId: "der-sub-tan-001", optionIndex: 3 },
      ],
    },
    {
      id: "tangent-wrong-intercept-sign",
      title: "סימן שגוי של האיבר החופשי במשוואת המשיק",
      skill: "tangent-line-equation",
      insight: "אתה מוצא שיפוע נכון אך מחשב את האיבר החופשי עם סימן הפוך — כדאי לפתוח את $y - y_0 = m(x - x_0)$ צעד-צעד ולבדוק בנקודת ההשקה.",
      remedy: { subTopicId: "tangent-line" },
      triggers: [
        { questionId: "der-sub-tan-002", optionIndex: 1 },
      ],
    },
    {
      id: "tangent-missing-intercept",
      title: "השמטת האיבר החופשי ממשוואת המשיק",
      skill: "tangent-line-equation",
      insight: "אתה מוצא שיפוע נכון אך שוכח לכלול את האיבר החופשי — ישר ללא היסט לרוב אינו עובר בנקודת ההשקה.",
      remedy: { subTopicId: "tangent-line" },
      triggers: [
        { questionId: "der-sub-tan-002", optionIndex: 3 },
      ],
    },
    {
      id: "critical-point-no-division",
      title: "פתרון משוואת הנגזרת ללא חלוקה מלאה",
      skill: "critical-points",
      insight: "כשאתה פותר $f'(x) = 0$, אתה עוצר לפני שביצעת את כל צעדי הפישוט — למשל שוכח לחלק ב-$2$ ומחזיר את המקדם עצמו כפתרון.",
      remedy: { subTopicId: "extrema-monotonicity" },
      triggers: [
        { questionId: "der-sub-ext-001", optionIndex: 1 },
      ],
    },
    {
      id: "critical-point-sign-flip",
      title: "היפוך סימן בבידוד הנעלם בנגזרת",
      skill: "critical-points",
      insight: "כשאתה מבודד את $x$ ממשוואת הנגזרת, הסימן מתהפך שלא לצורך — בדוק את צעד ההעברה לצד השני.",
      remedy: { subTopicId: "extrema-monotonicity" },
      triggers: [
        { questionId: "der-sub-ext-001", optionIndex: 2 },
      ],
    },
    {
      id: "root-of-function-as-critical-point",
      title: "בלבול בין שורש הפונקציה לנקודת קיצון",
      skill: "critical-points",
      insight: "אתה מחשב היכן $f(x) = 0$ במקום היכן $f'(x) = 0$ — נקודות קיצון נמצאות לפי התאפסות הנגזרת, לא הפונקציה עצמה.",
      remedy: { subTopicId: "extrema-monotonicity" },
      triggers: [
        { questionId: "der-sub-ext-001", optionIndex: 3 },
        { questionId: "der-sub-ext-003", optionIndex: 2 },
      ],
    },
    {
      id: "extrema-classification-reversed",
      title: "היפוך סיווג מקסימום ומינימום",
      skill: "classify-extrema",
      insight: "אתה מסווג מינימום כמקסימום ולהפך — בדוק את הסימן של הנגזרת השנייה: ערך חיובי מציין מינימום וערך שלילי מציין מקסימום.",
      remedy: { subTopicId: "extrema-monotonicity" },
      triggers: [
        { questionId: "der-sub-ext-002", optionIndex: 1 },
      ],
    },
    {
      id: "monotonicity-direction-reversed",
      title: "היפוך תחומי עלייה וירידה",
      skill: "monotonicity-intervals",
      insight: "אתה מזהה נכון את נקודת הקיצון אך מחליף בין תחום העלייה לתחום הירידה — בדוק את סימן הנגזרת בתחום ספציפי עם ערך בדיקה.",
      remedy: { subTopicId: "extrema-monotonicity" },
      triggers: [
        { questionId: "der-sub-ext-003", optionIndex: 1 },
      ],
    },
    {
      id: "monotonicity-wrong-boundary",
      title: "שימוש בגבול שגוי לתחום המונוטוניות",
      skill: "monotonicity-intervals",
      insight: "אתה מגדיר את תחום העלייה או הירידה החל מנקודה שאינה שורש הנגזרת — הגבול הנכון הוא ה-$x$ שבו $f'(x) = 0$.",
      remedy: { subTopicId: "extrema-monotonicity" },
      triggers: [
        { questionId: "der-sub-ext-003", optionIndex: 3 },
      ],
    },
  ],
  questionSkills: {
    "der-sub-rules-001": ["power-rule-basic","constant-derivative"],
    "der-sub-rules-002": ["power-rule-basic","trig-derivatives"],
    "der-sub-rules-003": ["chain-rule","trig-derivatives"],
    "der-sub-rules-004": ["chain-rule","power-rule-basic"],
    "der-sub-tan-001": ["slope-from-derivative"],
    "der-sub-tan-002": ["slope-from-derivative","tangent-line-equation"],
    "der-sub-ext-001": ["critical-points"],
    "der-sub-ext-002": ["classify-extrema"],
    "der-sub-ext-003": ["monotonicity-intervals","critical-points"],
  },
};
