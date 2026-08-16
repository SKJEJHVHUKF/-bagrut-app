// ============================================================
// Cognition catalog — math5 · גאומטריה אנליטית
// ============================================================
//
// 19 skills · 20 misconceptions ·
// 50 triggers over 26 MCQs.
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
const TOPIC = "גאומטריה אנליטית";

export const analyticGeometryCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "line-slope-def", title: "הגדרת שיפוע בין שתי נקודות", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-line", prereqs: [], band: "easy" },
    { id: "line-perpendicular-slope", title: "שיפוע ניצב ומקביל", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-line", prereqs: ["line-slope-def"], band: "easy" },
    { id: "line-midpoint", title: "נוסחת אמצע קטע", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-line", prereqs: [], band: "easy" },
    { id: "line-parallel-condition", title: "זיהוי ישרים מקבילים לפי שיפוע", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-line", prereqs: ["line-perpendicular-slope"], band: "easy" },
    { id: "line-distance-parallel", title: "מרחק בין ישרים מקבילים", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-line", prereqs: ["line-slope-def"], band: "mid" },
    { id: "circle-standard-form", title: "קריאת מרכז ורדיוס מצורה סטנדרטית", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-circle", prereqs: [], band: "easy" },
    { id: "circle-general-to-standard", title: "השלמה לריבוע — צורה כללית לסטנדרטית", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-circle", prereqs: ["circle-standard-form"], band: "easy" },
    { id: "circle-point-position", title: "מיקום נקודה ביחס למעגל", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-circle", prereqs: ["circle-standard-form"], band: "easy" },
    { id: "circle-tangent-axis", title: "מעגל משיק לציר — חישוב רדיוס", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-circle", prereqs: ["circle-standard-form"], band: "easy" },
    { id: "circle-line-intersections", title: "מספר נקודות חיתוך של ישר ומעגל", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-circle", prereqs: ["circle-standard-form"], band: "mid" },
    { id: "parabola-focus-directrix", title: "מוקד ומדריך של פרבולה", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-parabola", prereqs: [], band: "easy" },
    { id: "parabola-equation-from-focus", title: "בניית משוואת פרבולה ממוקד", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-parabola", prereqs: ["parabola-focus-directrix"], band: "easy" },
    { id: "parabola-opening-direction", title: "כיוון פתיחת פרבולה", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-parabola", prereqs: ["parabola-focus-directrix"], band: "easy" },
    { id: "ellipse-axes-foci", title: "צירים ומוקדים של אליפסה", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-ellipse", prereqs: [], band: "easy" },
    { id: "ellipse-major-axis-direction", title: "כיוון הציר הגדול לפי המכנה הגדול", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-ellipse", prereqs: ["ellipse-axes-foci"], band: "easy" },
    { id: "ellipse-eccentricity", title: "אקסצנטריות של אליפסה", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-ellipse", prereqs: ["ellipse-axes-foci"], band: "easy" },
    { id: "ellipse-axis-length", title: "אורך הציר הגדול", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-ellipse", prereqs: ["ellipse-axes-foci"], band: "easy" },
    { id: "loci-distance-circle", title: "מקום גאומטרי — מרחק קבוע מנקודה", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-loci", prereqs: [], band: "easy" },
    { id: "loci-perpendicular-bisector", title: "מקום גאומטרי — שווה-מרחק משתי נקודות", subject: SUBJECT, topic: TOPIC, subTopicId: "ag-loci", prereqs: [], band: "easy" },
  ],
  misconceptions: [
    {
      id: "slope-single-difference",
      title: "שיפוע = הפרש אחד בלבד",
      skill: "line-slope-def",
      insight: "אתה לוקח רק את ההפרש האנכי או רק את האופקי כשיפוע, במקום לחלק ביניהם.",
      remedy: { subTopicId: "ag-line" },
      triggers: [
        { questionId: "ag-sub-line-001", optionIndex: 1 },
        { questionId: "ag-sub-line-001", optionIndex: 3 },
      ],
    },
    {
      id: "slope-inverted-fraction",
      title: "מונה ומכנה הפוכים בשיפוע",
      skill: "line-slope-def",
      insight: "אתה מחשב $\\dfrac{\\Delta x}{\\Delta y}$ במקום $\\dfrac{\\Delta y}{\\Delta x}$ — המונה והמכנה הפוכים.",
      remedy: { subTopicId: "ag-line" },
      triggers: [
        { questionId: "ag-sub-line-001", optionIndex: 2 },
        { questionId: "ag-sub-line-007", optionIndex: 2 },
      ],
    },
    {
      id: "perpendicular-only-negate-or-reciprocal",
      title: "ניצב = רק נגדי, או רק הופכי",
      skill: "line-perpendicular-slope",
      insight: "אתה משנה רק את הסימן או רק הופך את השבר, אבל ניצב דורש גם היפוך סימן וגם היפוך שבר יחד: $m_\\perp = -\\dfrac{1}{m}$.",
      remedy: { subTopicId: "ag-line" },
      triggers: [
        { questionId: "ag-sub-line-002", optionIndex: 2 },
        { questionId: "ag-sub-line-002", optionIndex: 3 },
      ],
    },
    {
      id: "midpoint-difference-not-average",
      title: "אמצע קטע = הפרש חלקי שתיים",
      skill: "line-midpoint",
      insight: "אתה מחשב $\\dfrac{x_2 - x_1}{2}$ במקום $\\dfrac{x_1 + x_2}{2}$ — אמצע קטע מחייב סכום, לא הפרש.",
      remedy: { subTopicId: "ag-line" },
      triggers: [
        { questionId: "ag-sub-line-006", optionIndex: 1 },
        { questionId: "ag-sub-line-006", optionIndex: 2 },
      ],
    },
    {
      id: "parallel-wrong-slope-from-general",
      title: "קריאת שיפוע שגויה ממשוואה כללית",
      skill: "line-parallel-condition",
      insight: "אתה קורא את המקדם של $x$ כשיפוע ישירות מהצורה הכללית, בלי לבודד את $y$ קודם — ומקבל שיפוע בסימן הפוך.",
      remedy: { subTopicId: "ag-line" },
      triggers: [
        { questionId: "ag-sub-line-007", optionIndex: 1 },
        { questionId: "ag-sub-line-007", optionIndex: 3 },
      ],
    },
    {
      id: "circle-center-sign-flip",
      title: "סימן מרכז המעגל הפוך",
      skill: "circle-standard-form",
      insight: "אתה מחליף את הסימן של שיעורי המרכז: $(x-a)^2$ נותן $a$ חיובי, לא שלילי — התבנית כבר מכילה מינוס.",
      remedy: { subTopicId: "ag-circle" },
      triggers: [
        { questionId: "ag-sub-circ-001", optionIndex: 1 },
        { questionId: "ag-sub-circ-001", optionIndex: 2 },
        { questionId: "ag-sub-circ-007", optionIndex: 1 },
        { questionId: "ag-sub-loci-006", optionIndex: 2 },
      ],
    },
    {
      id: "circle-radius-not-squared",
      title: "רדיוס = אגף ימין, בלי שורש",
      skill: "circle-standard-form",
      insight: "אתה קורא את אגף ימין כרדיוס, אבל שם כתוב $r^2$. צריך להוציא שורש כדי לקבל את $r$.",
      remedy: { subTopicId: "ag-circle" },
      triggers: [
        { questionId: "ag-sub-circ-007", optionIndex: 3 },
        { questionId: "ag-sub-circ-002", optionIndex: 3 },
        { questionId: "ag-sub-loci-001", optionIndex: 2 },
      ],
    },
    {
      id: "circle-completing-square-wrong-r2",
      title: "חישוב $r^2$ שגוי בהשלמה לריבוע",
      skill: "circle-general-to-standard",
      insight: "בהשלמה לריבוע אתה שוכח להעביר אגף את הקבוע החופשי, או לא מוסיף את שני הריבועים המושלמים — ולכן $r^2$ שגוי.",
      remedy: { subTopicId: "ag-circle" },
      triggers: [
        { questionId: "ag-sub-circ-002", optionIndex: 1 },
        { questionId: "ag-sub-circ-002", optionIndex: 2 },
      ],
    },
    {
      id: "circle-tangent-wrong-axis",
      title: "בלבול בין ציר ה-$x$ לציר ה-$y$ במשיקות",
      skill: "circle-tangent-axis",
      insight: "כשמעגל משיק לציר ה-$y$, הרדיוס שווה למרחק האופקי מהמרכז ($|a|$), לא לאנכי ($|b|$) — ואתה מחליף ביניהם.",
      remedy: { subTopicId: "ag-circle" },
      triggers: [
        { questionId: "ag-sub-circ-008", optionIndex: 1 },
        { questionId: "ag-sub-circ-008", optionIndex: 2 },
      ],
    },
    {
      id: "parabola-coefficient-vs-focus",
      title: "המוקד = המקדם $2p$ במקום $\\frac{p}{2}$",
      skill: "parabola-focus-directrix",
      insight: "אתה לוקח את המקדם שמופיע במשוואה (או את $p$) ישירות כשיעור המוקד, במקום לחלק אותו כראוי ב-$4$.",
      remedy: { subTopicId: "ag-parabola" },
      triggers: [
        { questionId: "ag-sub-par-001", optionIndex: 1 },
        { questionId: "ag-sub-par-001", optionIndex: 2 },
        { questionId: "ag-sub-par-007", optionIndex: 2 },
        { questionId: "ag-sub-par-007", optionIndex: 3 },
        { questionId: "ag-sub-par-002", optionIndex: 3 },
      ],
    },
    {
      id: "parabola-focus-directrix-swap",
      title: "מבלבלים בין מוקד למדריך",
      skill: "parabola-focus-directrix",
      insight: "אתה נותן את מיקום המוקד כשנשאלים על המדריך, או להיפך — שניהם נמצאים מצדדים מנוגדים של הקודקוד.",
      remedy: { subTopicId: "ag-parabola" },
      triggers: [
        { questionId: "ag-sub-par-002", optionIndex: 1 },
        { questionId: "ag-sub-par-007", optionIndex: 1 },
      ],
    },
    {
      id: "parabola-axis-confusion",
      title: "בלבול בין ציר הפרבולה לפי משתנה בריבוע",
      skill: "parabola-opening-direction",
      insight: "אתה מחליף בין פרבולה עם $x^2$ (ציר אנכי) לפרבולה עם $y^2$ (ציר אופקי) — המשתנה בריבוע קובע את כיוון הציר.",
      remedy: { subTopicId: "ag-parabola" },
      triggers: [
        { questionId: "ag-sub-par-002", optionIndex: 2 },
        { questionId: "ag-sub-par-008", optionIndex: 2 },
        { questionId: "ag-sub-par-008", optionIndex: 3 },
      ],
    },
    {
      id: "parabola-equation-wrong-coefficient",
      title: "מקדם שגוי בבניית משוואת פרבולה",
      skill: "parabola-equation-from-focus",
      insight: "אתה כותב את $p$ או $\\dfrac{p}{2}$ במקום $2p$ במשוואה — מרחק המוקד צריך להיות מוכפל בארבע כדי לקבל את המקדם.",
      remedy: { subTopicId: "ag-parabola" },
      triggers: [
        { questionId: "ag-sub-par-006", optionIndex: 1 },
        { questionId: "ag-sub-par-006", optionIndex: 2 },
      ],
    },
    {
      id: "ellipse-c-vs-a-or-b",
      title: "מבלבלים בין $c$, $a$ ו-$b$ באליפסה",
      skill: "ellipse-axes-foci",
      insight: "אתה מציב את $a$ (קודקוד) או $b$ (חצי-ציר קטן) כשיעור המוקד, במקום $c = \\sqrt{a^2 - b^2}$.",
      remedy: { subTopicId: "ag-ellipse" },
      triggers: [
        { questionId: "ag-sub-ell-001", optionIndex: 1 },
        { questionId: "ag-sub-ell-001", optionIndex: 3 },
        { questionId: "ag-sub-ell-007", optionIndex: 2 },
        { questionId: "ag-sub-ell-007", optionIndex: 3 },
      ],
    },
    {
      id: "ellipse-foci-wrong-axis",
      title: "מוקדי אליפסה על הציר הלא נכון",
      skill: "ellipse-major-axis-direction",
      insight: "אתה שם את המוקדים על הציר הלא נכון — המוקדים תמיד על הציר הגדול, שנקבע לפי המכנה הגדול יותר.",
      remedy: { subTopicId: "ag-ellipse" },
      triggers: [
        { questionId: "ag-sub-ell-001", optionIndex: 2 },
        { questionId: "ag-sub-ell-007", optionIndex: 1 },
        { questionId: "ag-sub-ell-006", optionIndex: 1 },
      ],
    },
    {
      id: "ellipse-eccentricity-squared",
      title: "אקסצנטריות = יחס ריבועים במקום יחס שורשים",
      skill: "ellipse-eccentricity",
      insight: "אתה מחשב $\\dfrac{c^2}{a^2}$ במקום $\\dfrac{c}{a}$ — צריך להוציא שורש מ-$c^2$ ומ-$a^2$ לפני חלוקה.",
      remedy: { subTopicId: "ag-ellipse" },
      triggers: [
        { questionId: "ag-sub-ell-002", optionIndex: 1 },
        { questionId: "ag-sub-ell-002", optionIndex: 2 },
      ],
    },
    {
      id: "ellipse-axis-length-half-not-full",
      title: "אורך ציר = $a$ במקום $2a$",
      skill: "ellipse-axis-length",
      insight: "אתה נותן את חצי-הציר $a$ כאורך הציר הגדול — אורך הציר המלא הוא $2a$.",
      remedy: { subTopicId: "ag-ellipse" },
      triggers: [
        { questionId: "ag-sub-ell-008", optionIndex: 1 },
        { questionId: "ag-sub-ell-008", optionIndex: 3 },
      ],
    },
    {
      id: "loci-circle-r-not-r-squared",
      title: "כותבים $r$ במקום $r^2$ בצד ימין של המעגל",
      skill: "loci-distance-circle",
      insight: "אתה כותב את המרחק עצמו באגף ימין, אבל שם עומד $r^2$. צריך להעלות את המרחק בריבוע.",
      remedy: { subTopicId: "ag-loci" },
      triggers: [
        { questionId: "ag-sub-loci-006", optionIndex: 1 },
      ],
    },
    {
      id: "loci-circle-missing-center",
      title: "מרכז המעגל נשמט ממשוואת המקום הגאומטרי",
      skill: "loci-distance-circle",
      insight: "אתה כותב $x^2 + y^2 = r^2$ גם כשהמרחק נמדד מנקודה שאינה הראשית — שוכח לשלב את $(x - x_0)$ ו-$(y - y_0)$.",
      remedy: { subTopicId: "ag-loci" },
      triggers: [
        { questionId: "ag-sub-loci-006", optionIndex: 3 },
        { questionId: "ag-sub-loci-001", optionIndex: 1 },
      ],
    },
    {
      id: "loci-bisector-wrong-line",
      title: "האנך האמצעי — כיוון או מיקום שגוי",
      skill: "loci-perpendicular-bisector",
      insight: "אתה בוחר ישר שאינו האנך האמצעי: מחליף בין כיוון מקביל לניצב, או לא מחשב נכון את אמצע הקטע.",
      remedy: { subTopicId: "ag-loci" },
      triggers: [
        { questionId: "ag-sub-loci-007", optionIndex: 1 },
        { questionId: "ag-sub-loci-007", optionIndex: 2 },
        { questionId: "ag-sub-loci-002", optionIndex: 1 },
      ],
    },
  ],
  questionSkills: {
    "ag-sub-line-001": ["line-slope-def"],
    "ag-sub-line-002": ["line-perpendicular-slope"],
    "ag-sub-line-006": ["line-midpoint"],
    "ag-sub-line-007": ["line-parallel-condition"],
    "ag-sub-line-009": ["line-distance-parallel"],
    "ag-sub-circ-001": ["circle-standard-form"],
    "ag-sub-circ-002": ["circle-general-to-standard"],
    "ag-sub-circ-006": ["circle-point-position"],
    "ag-sub-circ-007": ["circle-standard-form"],
    "ag-sub-circ-008": ["circle-tangent-axis"],
    "ag-sub-circ-010": ["circle-line-intersections"],
    "ag-sub-par-001": ["parabola-focus-directrix"],
    "ag-sub-par-002": ["parabola-focus-directrix","parabola-opening-direction"],
    "ag-sub-par-006": ["parabola-equation-from-focus"],
    "ag-sub-par-007": ["parabola-focus-directrix"],
    "ag-sub-par-008": ["parabola-opening-direction"],
    "ag-sub-ell-001": ["ellipse-axes-foci"],
    "ag-sub-ell-002": ["ellipse-eccentricity"],
    "ag-sub-ell-006": ["ellipse-major-axis-direction"],
    "ag-sub-ell-007": ["ellipse-axes-foci","ellipse-major-axis-direction"],
    "ag-sub-ell-008": ["ellipse-axis-length"],
    "ag-sub-loci-001": ["loci-distance-circle"],
    "ag-sub-loci-002": ["loci-perpendicular-bisector"],
    "ag-sub-loci-006": ["loci-distance-circle"],
    "ag-sub-loci-007": ["loci-perpendicular-bisector"],
    "ag-sub-loci-008": ["loci-perpendicular-bisector"],
  },
};
