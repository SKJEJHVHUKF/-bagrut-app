// ============================================================
// Cognition catalog — math5 · וקטורים במרחב
// ============================================================
//
// 13 skills · 27 misconceptions ·
// 40 triggers over 27 MCQs.
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
const TOPIC = "וקטורים במרחב";

export const vectorsCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "vec-representation", title: "ייצוג וקטורים וחישוב הפרש נקודות", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-basics", prereqs: [], band: "easy" },
    { id: "vec-magnitude", title: "חישוב אורך וקטור במרחב", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-basics", prereqs: ["vec-representation"], band: "easy" },
    { id: "vec-parallelism", title: "מקבילות וקטורים — יחסיות רכיבים", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-basics", prereqs: ["vec-representation"], band: "easy" },
    { id: "vec-addition-geometry", title: "חיבור וקטורים גאומטרי — כלל המקבילית", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-basics", prereqs: ["vec-representation"], band: "easy" },
    { id: "vec-midpoint", title: "נקודת אמצע וחלוקת קטע", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-basics", prereqs: ["vec-representation","vec-addition-geometry"], band: "mid" },
    { id: "dot-product-compute", title: "חישוב מכפלה סקלרית", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-dot-product", prereqs: ["vec-representation"], band: "easy" },
    { id: "dot-product-geometry", title: "פרשנות גאומטרית של המכפלה הסקלרית — זווית וניצבות", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-dot-product", prereqs: ["dot-product-compute","vec-magnitude"], band: "easy" },
    { id: "cross-product-compute", title: "חישוב מכפלה וקטורית", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-cross-product", prereqs: ["vec-representation"], band: "easy" },
    { id: "cross-product-geometry", title: "פרשנות גאומטרית — שטח ומקבילות", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-cross-product", prereqs: ["cross-product-compute","vec-magnitude"], band: "easy" },
    { id: "line-parametric", title: "משוואה פרמטרית של ישר במרחב", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-line-plane", prereqs: ["vec-representation"], band: "easy" },
    { id: "plane-equation", title: "משוואת מישור ונורמל", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-line-plane", prereqs: ["vec-representation","dot-product-geometry"], band: "easy" },
    { id: "distance-point-plane", title: "מרחק מנקודה למישור", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-distances-angles", prereqs: ["plane-equation","vec-magnitude"], band: "easy" },
    { id: "angle-line-plane", title: "זווית בין ישר למישור ובין שני מישורים", subject: SUBJECT, topic: TOPIC, subTopicId: "vec-distances-angles", prereqs: ["dot-product-geometry","plane-equation"], band: "easy" },
  ],
  misconceptions: [
    {
      id: "vec-add-instead-of-subtract",
      title: "חיבור נקודות במקום חיסור לקבלת וקטור",
      skill: "vec-representation",
      insight: "אתה מחשב $A+B$ כדי למצוא את $\\vec{AB}$, אבל הוקטור בין שתי נקודות הוא תמיד ההפרש $B-A$.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-001", optionIndex: 1 },
        { questionId: "vec-sub-lp-006", optionIndex: 1 },
      ],
    },
    {
      id: "vec-direction-confused-with-position",
      title: "שיעורי נקודה בודדת במקום הפרש",
      skill: "vec-representation",
      insight: "אתה לוקח את שיעורי הנקודה הסופית כוקטור הכיוון, אבל הוקטור הוא ההפרש בין שתי נקודות ולא מיקומה של נקודה אחת.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-001", optionIndex: 3 },
        { questionId: "vec-sub-lp-006", optionIndex: 2 },
      ],
    },
    {
      id: "vec-reverse-wrong-sign",
      title: "היפוך חלקי של סימני הוקטור",
      skill: "vec-representation",
      insight: "אתה מחליף סימן רק לחלק מהרכיבים כשמהפכים וקטור, אבל $-\\vec{v}$ מחייב להפוך את סימן כל הרכיבים ללא יוצא מן הכלל.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-007", optionIndex: 2 },
        { questionId: "vec-sub-basic-007", optionIndex: 3 },
      ],
    },
    {
      id: "vec-magnitude-missing-component",
      title: "חישוב אורך עם שני רכיבים בלבד",
      skill: "vec-magnitude",
      insight: "אתה מחשב את האורך עם שני רכיבים בלבד ומשמיט את השלישי, אבל במרחב תמיד מסכמים את ריבועי שלושת הרכיבים.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-002", optionIndex: 1 },
      ],
    },
    {
      id: "vec-magnitude-no-square",
      title: "סכום ערכים מוחלטים בלי ריבועים ובלי שורש",
      skill: "vec-magnitude",
      insight: "אתה מחשב אורך וקטור על-ידי חיבור ערכים מוחלטים של הרכיבים, אבל הנוסחה הנכונה היא $\\sqrt{x^2+y^2+z^2}$ — קודם ריבועים, אחר-כך שורש.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-002", optionIndex: 3 },
        { questionId: "vec-sub-cross-007", optionIndex: 2 },
      ],
    },
    {
      id: "vec-magnitude-sign-not-squared",
      title: "סימן שלילי לא נעלם בריבוע",
      skill: "vec-magnitude",
      insight: "אתה מכניס רכיב שלילי לנוסחת האורך בלי לרבע אותו, אבל $(-a)^2 = a^2$ — הריבוע תמיד חיובי.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-002", optionIndex: 2 },
      ],
    },
    {
      id: "vec-diagonal-half",
      title: "חצי אלכסון במקום האלכסון המלא",
      skill: "vec-addition-geometry",
      insight: "אתה מחשב את $\\vec{AM}$ (חצי האלכסון עד נקודת החיתוך) במקום $\\vec{AC}$ המלא, אבל האלכסון המלא מגיע עד הקודקוד ולכן אין לחלק ב-$2$.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-006", optionIndex: 3 },
        { questionId: "vec-sub-basic-010", optionIndex: 3 },
      ],
    },
    {
      id: "vec-bm-start-from-wrong-vertex",
      title: "יציאה מהקודקוד הלא נכון במקבילית",
      skill: "vec-addition-geometry",
      insight: "אתה מחשב וקטור שיוצא מ-$A$ במקום מ-$B$, אבל כשהשאלה מבקשת $\\vec{BM}$ המסלול חייב לפתוח בנקודה $B$.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-010", optionIndex: 1 },
      ],
    },
    {
      id: "vec-midpoint-only-half-step",
      title: "תזוזה חד-כיוונית במקום כפל ב-$2M-A$",
      skill: "vec-midpoint",
      insight: "אתה מחשב רק את $\\vec{AM}$ ומחזיר אותו כנקודה, אבל כדי למצוא את $B$ צריך ללכת פעמיים מ-$A$: $B=2M-A$.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-009", optionIndex: 2 },
      ],
    },
    {
      id: "vec-midpoint-2m-only",
      title: "הכפלת נקודת האמצע בלי חיסור $A$",
      skill: "vec-midpoint",
      insight: "אתה מחשב $2M$ אבל שוכח לחסר את $A$, אבל מנוסחת האמצע $M=\\frac{A+B}{2}$ נובע $B=2M-A$.",
      remedy: { subTopicId: "vec-basics" },
      triggers: [
        { questionId: "vec-sub-basic-009", optionIndex: 1 },
      ],
    },
    {
      id: "dot-product-stops-early",
      title: "מכפלה סקלרית עוצרת לפני האיבר השלישי",
      skill: "dot-product-compute",
      insight: "אתה מחשב רק שניים מתוך שלושת האיברים של המכפלה הסקלרית, אבל במרחב תמיד מסכמים שלוש מכפלות.",
      remedy: { subTopicId: "vec-dot-product" },
      triggers: [
        { questionId: "vec-sub-dot-006", optionIndex: 1 },
      ],
    },
    {
      id: "dot-product-sign-lost",
      title: "אבדן סימן שלילי בחישוב מכפלה סקלרית",
      skill: "dot-product-compute",
      insight: "אתה מאבד סימן מינוס של רכיב שלילי בעת חישוב המכפלה הסקלרית, אבל המינוס הוא חלק מהרכיב ויש להכפיל אתו.",
      remedy: { subTopicId: "vec-dot-product" },
      triggers: [
        { questionId: "vec-sub-dot-006", optionIndex: 2 },
        { questionId: "vec-sub-basic-008", optionIndex: 2 },
      ],
    },
    {
      id: "dot-self-is-magnitude-not-squared",
      title: "$\\vec{a}\\cdot\\vec{a}$ מחזיר אורך במקום אורך בריבוע",
      skill: "dot-product-compute",
      insight: "אתה חושב ש-$\\vec{a}\\cdot\\vec{a}=|\\vec{a}|$, אבל הנכון הוא $\\vec{a}\\cdot\\vec{a}=|\\vec{a}|^2$ — מכפלה עצמית נותנת את האורך בריבוע.",
      remedy: { subTopicId: "vec-dot-product" },
      triggers: [
        { questionId: "vec-sub-dot-007", optionIndex: 1 },
      ],
    },
    {
      id: "dot-self-is-sum-not-sum-of-squares",
      title: "$\\vec{a}\\cdot\\vec{a}$ כסכום רכיבים במקום סכום ריבועיהם",
      skill: "dot-product-compute",
      insight: "אתה מחשב $\\vec{a}\\cdot\\vec{a}$ על-ידי חיבור הרכיבים, אבל כל רכיב מוכפל בעצמו ולכן צריך לסכום את ריבועי הרכיבים.",
      remedy: { subTopicId: "vec-dot-product" },
      triggers: [
        { questionId: "vec-sub-dot-007", optionIndex: 2 },
      ],
    },
    {
      id: "dot-product-negative-means-obtuse",
      title: "מכפלה שלילית — זיהוי שגוי של הזווית",
      skill: "dot-product-geometry",
      insight: "אתה לא מזהה שמכפלה סקלרית שלילית מעידה על זווית קהה ($>90°$), מפני ש-$\\cos\\theta<0$ כשהזווית גדולה מ-$90°$.",
      remedy: { subTopicId: "vec-dot-product" },
      triggers: [
        { questionId: "vec-sub-dot-008", optionIndex: 1 },
        { questionId: "vec-sub-dot-008", optionIndex: 2 },
      ],
    },
    {
      id: "cross-product-order-reversal",
      title: "היפוך סדר גורמים במכפלה וקטורית",
      skill: "cross-product-compute",
      insight: "אתה מחשב $\\vec{b}\\times\\vec{a}$ במקום $\\vec{a}\\times\\vec{b}$, אבל המכפלה הוקטורית אינה חילופית: היפוך הסדר הופך את כל הסימנים.",
      remedy: { subTopicId: "vec-cross-product" },
      triggers: [
        { questionId: "vec-sub-cross-001", optionIndex: 1 },
        { questionId: "vec-sub-cross-006", optionIndex: 1 },
      ],
    },
    {
      id: "cross-product-zero-when-perpendicular",
      title: "המכפלה הוקטורית מתאפסת כשהוקטורים ניצבים",
      skill: "cross-product-geometry",
      insight: "אתה חושב שוקטורים ניצבים נותנים מכפלה וקטורית אפס, אבל דווקא ניצבות גורמת לאורך המכפלה להיות מקסימלי — האיפוס קורה רק במקבילות.",
      remedy: { subTopicId: "vec-cross-product" },
      triggers: [
        { questionId: "vec-sub-cross-008", optionIndex: 1 },
        { questionId: "vec-sub-cross-001", optionIndex: 3 },
      ],
    },
    {
      id: "cross-product-area-no-sqrt",
      title: "שטח כסכום ריבועי הרכיבים בלי שורש",
      skill: "cross-product-geometry",
      insight: "אתה מחשב את הסכום $a^2+b^2+c^2$ ומחזיר אותו כשטח, אבל השטח הוא $|\\vec{a}\\times\\vec{b}|=\\sqrt{a^2+b^2+c^2}$ — חסרה הוצאת השורש.",
      remedy: { subTopicId: "vec-cross-product" },
      triggers: [
        { questionId: "vec-sub-cross-007", optionIndex: 1 },
      ],
    },
    {
      id: "line-param-anchor-as-direction",
      title: "נקודת העיגון משמשת ככיוון בישר הפרמטרי",
      skill: "line-parametric",
      insight: "אתה כותב את הישר הפרמטרי עם נקודת העיגון כוקטור הכיוון ומאבד את העיגון עצמו, אבל המשוואה חייבת להיות מהצורה $\\vec{r_0}+t\\vec{d}$.",
      remedy: { subTopicId: "vec-line-plane" },
      triggers: [
        { questionId: "vec-sub-lp-001", optionIndex: 1 },
      ],
    },
    {
      id: "line-param-roles-swapped",
      title: "החלפה בין וקטור הכיוון לרכיב הקבוע בישר הפרמטרי",
      skill: "line-parametric",
      insight: "אתה מחליף בין הרכיב הקבוע לבין רכיב הכיוון בביטוי הפרמטרי, כך שרכיבים שצריכים להשתנות קופאים ולהפך.",
      remedy: { subTopicId: "vec-line-plane" },
      triggers: [
        { questionId: "vec-sub-lp-001", optionIndex: 2 },
      ],
    },
    {
      id: "plane-normal-from-free-term",
      title: "האיבר החופשי של המישור כנורמל",
      skill: "plane-equation",
      insight: "אתה לוקח את האיבר החופשי של משוואת המישור כחלק מהנורמל, אבל הנורמל נקרא ישירות ממקדמי $x,y,z$ בלבד.",
      remedy: { subTopicId: "vec-line-plane" },
      triggers: [
        { questionId: "vec-sub-lp-002", optionIndex: 1 },
      ],
    },
    {
      id: "line-param-value-copied-as-t",
      title: "שיעור הנקודה מועתק ישירות כפרמטר $t$",
      skill: "line-parametric",
      insight: "אתה משתמש בשיעור של הנקודה כערך הפרמטר $t$ בלי לפתור משוואה, אבל $t$ מחולץ ממשוואה ואז חייב להתאים לכל שלושת הרכיבים.",
      remedy: { subTopicId: "vec-line-plane" },
      triggers: [
        { questionId: "vec-sub-lp-008", optionIndex: 3 },
      ],
    },
    {
      id: "distance-plane-numerator-only",
      title: "מרחק מנקודה למישור — מונה בלי מכנה",
      skill: "distance-point-plane",
      insight: "אתה מחשב רק את המונה $|ax_0+by_0+cz_0+d|$ ומחזיר אותו כמרחק, אבל חייבים לחלק באורך הנורמל $\\sqrt{a^2+b^2+c^2}$.",
      remedy: { subTopicId: "vec-distances-angles" },
      triggers: [
        { questionId: "vec-sub-da-001", optionIndex: 1 },
        { questionId: "vec-sub-da-006", optionIndex: 1 },
      ],
    },
    {
      id: "distance-plane-squared-denominator",
      title: "מרחק מנקודה למישור — מכנה בריבוע במקום שורש",
      skill: "distance-point-plane",
      insight: "אתה מחלק ב-$|\\vec{n}|^2$ במקום ב-$|\\vec{n}|$, אבל נוסחת המרחק דורשת את השורש של סכום הריבועים במכנה.",
      remedy: { subTopicId: "vec-distances-angles" },
      triggers: [
        { questionId: "vec-sub-da-001", optionIndex: 3 },
        { questionId: "vec-sub-da-006", optionIndex: 2 },
      ],
    },
    {
      id: "distance-plane-wrong-norm",
      title: "אורך נורמל כסכום מקדמים במקום שורש סכום ריבועיהם",
      skill: "distance-point-plane",
      insight: "אתה מחשב את אורך הנורמל כסכום המקדמים עצמם, אבל $|\\vec{n}|=\\sqrt{a^2+b^2+c^2}$ — קודם מרבעים ואחר-כך מוציאים שורש.",
      remedy: { subTopicId: "vec-distances-angles" },
      triggers: [
        { questionId: "vec-sub-da-001", optionIndex: 2 },
        { questionId: "vec-sub-da-006", optionIndex: 3 },
      ],
    },
    {
      id: "angle-line-plane-cos-instead-of-sin",
      title: "שימוש בקוסינוס לזווית בין ישר למישור",
      skill: "angle-line-plane",
      insight: "אתה משתמש בקוסינוס לחישוב הזווית בין ישר למישור, אבל הנוסחה מבוססת על סינוס — הקוסינוס מתאים לזווית בין שני וקטורים או בין שני מישורים.",
      remedy: { subTopicId: "vec-distances-angles" },
      triggers: [
        { questionId: "vec-sub-da-007", optionIndex: 1 },
      ],
    },
    {
      id: "angle-planes-zero-when-nonparallel",
      title: "זיהוי שגוי של מקביליות מישורים",
      skill: "angle-line-plane",
      insight: "אתה מסיק שהמישורים מקבילים (זווית $0°$) בלי לבדוק שהנורמלים פרופורציוניים, אבל נורמלים שאינם כפולה זה של זה מעידים על מישורים נחתכים.",
      remedy: { subTopicId: "vec-distances-angles" },
      triggers: [
        { questionId: "vec-sub-da-008", optionIndex: 3 },
        { questionId: "vec-sub-da-002", optionIndex: 1 },
      ],
    },
  ],
  questionSkills: {
    "vec-sub-basic-001": ["vec-representation"],
    "vec-sub-basic-002": ["vec-magnitude"],
    "vec-sub-basic-006": ["vec-addition-geometry"],
    "vec-sub-basic-007": ["vec-representation"],
    "vec-sub-basic-008": ["vec-parallelism"],
    "vec-sub-basic-009": ["vec-midpoint"],
    "vec-sub-basic-010": ["vec-addition-geometry","vec-midpoint"],
    "vec-sub-dot-001": ["dot-product-compute"],
    "vec-sub-dot-002": ["dot-product-geometry"],
    "vec-sub-dot-006": ["dot-product-compute"],
    "vec-sub-dot-007": ["dot-product-compute"],
    "vec-sub-dot-008": ["dot-product-geometry"],
    "vec-sub-cross-001": ["cross-product-compute","cross-product-geometry"],
    "vec-sub-cross-002": ["cross-product-geometry"],
    "vec-sub-cross-006": ["cross-product-compute"],
    "vec-sub-cross-007": ["cross-product-geometry"],
    "vec-sub-cross-008": ["cross-product-geometry"],
    "vec-sub-lp-001": ["line-parametric"],
    "vec-sub-lp-002": ["plane-equation"],
    "vec-sub-lp-006": ["vec-representation","line-parametric"],
    "vec-sub-lp-007": ["plane-equation"],
    "vec-sub-lp-008": ["line-parametric"],
    "vec-sub-da-001": ["distance-point-plane"],
    "vec-sub-da-002": ["angle-line-plane"],
    "vec-sub-da-006": ["distance-point-plane"],
    "vec-sub-da-007": ["angle-line-plane"],
    "vec-sub-da-008": ["angle-line-plane"],
  },
};
