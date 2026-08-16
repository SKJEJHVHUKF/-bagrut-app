// ============================================================
// Cognition catalog — math5 · גדילה ודעיכה
// ============================================================
//
// 6 skills · 13 misconceptions ·
// 17 triggers over 6 MCQs.
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
const TOPIC = "גדילה ודעיכה";

export const growthDecayCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,
  skills: [
    { id: "gd-initial-value", title: "זיהוי ערך התחלתי במודל מעריכי", subject: SUBJECT, topic: TOPIC, subTopicId: "gd-model", prereqs: [], band: "easy" },
    { id: "gd-evaluate-model", title: "הצבת זמן נתון במודל מעריכי", subject: SUBJECT, topic: TOPIC, subTopicId: "gd-model", prereqs: ["gd-initial-value"], band: "easy" },
    { id: "gd-decay-constant", title: "חישוב קבוע הדעיכה $k$ מחצי-חיים", subject: SUBJECT, topic: TOPIC, subTopicId: "gd-time-rate", prereqs: ["gd-evaluate-model"], band: "easy" },
    { id: "gd-half-life-iteration", title: "הפעלה חוזרת של חצאי-חיים", subject: SUBJECT, topic: TOPIC, subTopicId: "gd-time-rate", prereqs: ["gd-decay-constant"], band: "mid" },
    { id: "gd-continuous-interest", title: "ריבית רציפה והצבת זמן בפונקציה המעריכית", subject: SUBJECT, topic: TOPIC, subTopicId: "gd-applications", prereqs: ["gd-evaluate-model"], band: "easy" },
    { id: "gd-asymptotic-limit", title: "גבול אסימפטוטי של מודל גדילה/דעיכה", subject: SUBJECT, topic: TOPIC, subTopicId: "gd-applications", prereqs: ["gd-evaluate-model"], band: "easy" },
  ],
  misconceptions: [
    {
      id: "mc-initial-value-substitute-t1",
      title: "הצבת $t=1$ במקום $t=0$ למציאת ערך התחלתי",
      skill: "gd-initial-value",
      insight: "אתה מציב $t = 1$ כדי למצוא את הגודל ההתחלתי, במקום $t = 0$. הגודל ההתחלתי הוא תמיד $N(0)$, ואז $e^0 = 1$ ונשאר רק המקדם.",
      remedy: { subTopicId: "gd-model" },
      triggers: [
        { questionId: "gd-sub-model-001", optionIndex: 1 },
        { questionId: "gd-sub-model-002", optionIndex: 2 },
      ],
    },
    {
      id: "mc-rate-constant-as-initial",
      title: "קצב הגידול $k$ מזוהה כגודל התחלתי",
      skill: "gd-initial-value",
      insight: "אתה לוקח את קצב הגידול $k$ מהמעריך ומתייחס אליו כאל הגודל ההתחלתי. הצבת $t = 0$ נותנת $e^0 = 1$, כך שהגודל ההתחלתי הוא המקדם מחוץ לאקספוננט — לא $k$.",
      remedy: { subTopicId: "gd-model" },
      triggers: [
        { questionId: "gd-sub-model-001", optionIndex: 2 },
      ],
    },
    {
      id: "mc-exponential-growth-linear",
      title: "חישוב גדילה מעריכית כגדילה לינארית",
      skill: "gd-evaluate-model",
      insight: "אתה מחשב גדילה מעריכית כאילו היא לינארית — למשל מכפיל את הגודל ההתחלתי ב-$t$ במקום להציב במעריך. במודל $N(t) = N_0 e^{kt}$ הזמן פועל דרך המעריך, לא כגורם כפל ישיר.",
      remedy: { subTopicId: "gd-model" },
      triggers: [
        { questionId: "gd-sub-model-002", optionIndex: 1 },
        { questionId: "gd-sub-app-001", optionIndex: 3 },
      ],
    },
    {
      id: "mc-exact-doubling-assumed",
      title: "הנחת הכפלה מדויקת בכל זמן",
      skill: "gd-evaluate-model",
      insight: "אתה מניח שהאוכלוסייה (או הסכום) מוכפלת בדיוק עבור ערך זמן נתון, בלי לחשב. הכפלה מתרחשת בזמן ספציפי שנקבע על ידי $k$, ואינה מובטחת בכל $t$.",
      remedy: { subTopicId: "gd-model" },
      triggers: [
        { questionId: "gd-sub-model-002", optionIndex: 3 },
        { questionId: "gd-sub-app-001", optionIndex: 2 },
      ],
    },
    {
      id: "mc-decay-k-positive",
      title: "קבוע הדעיכה $k$ חיובי בטעות",
      skill: "gd-decay-constant",
      insight: "אתה מחשב את $k$ עם סימן חיובי לתהליך דעיכה. כש-$k > 0$ הפונקציה גדלה ולא דועכת — בדעיכה חייב להתקיים $k < 0$, ולכן $k = -\\dfrac{\\ln 2}{t_{1/2}}$.",
      remedy: { subTopicId: "gd-time-rate" },
      triggers: [
        { questionId: "gd-sub-time-001", optionIndex: 1 },
      ],
    },
    {
      id: "mc-half-life-no-ln",
      title: "השמטת $\\ln 2$ בחישוב $k$ מחצי-חיים",
      skill: "gd-decay-constant",
      insight: "אתה פותר $e^{t_{1/2}\\cdot k} = \\tfrac{1}{2}$ כאילו $t_{1/2} \\cdot k = -1$, ומשמיט את הלוגריתם. הפתרון הנכון הוא $k = -\\dfrac{\\ln 2}{t_{1/2}}$, כי $\\ln\\tfrac{1}{2} = -\\ln 2 \\neq -1$.",
      remedy: { subTopicId: "gd-time-rate" },
      triggers: [
        { questionId: "gd-sub-time-001", optionIndex: 2 },
      ],
    },
    {
      id: "mc-ln-on-time-not-factor",
      title: "הפעלת $\\ln$ על הזמן במקום על הפקטור $2$",
      skill: "gd-decay-constant",
      insight: "אתה מפעיל לוגריתם על $t_{1/2}$ (הזמן) במקום על $2$ (פקטור ההתחצות). בנוסחת חצי-החיים $e^{kt_{1/2}} = \\tfrac{1}{2}$, הלוגריתם נלקח משני הצדדים ומקבלים $k = -\\dfrac{\\ln 2}{t_{1/2}}$.",
      remedy: { subTopicId: "gd-time-rate" },
      triggers: [
        { questionId: "gd-sub-time-001", optionIndex: 3 },
      ],
    },
    {
      id: "mc-half-life-linear-count",
      title: "ספירה לינארית של חצאי-חיים במקום חזקה",
      skill: "gd-half-life-iteration",
      insight: "אתה סופר את מספר חצאי-החיים ומציב אותו ישירות במכנה, במקום לחשב $\\left(\\tfrac{1}{2}\\right)^n$. כל חצי-חיים מחצה את הכמות שוב, ולכן $n$ חצאי-חיים מותירים $\\dfrac{N_0}{2^n}$.",
      remedy: { subTopicId: "gd-time-rate" },
      triggers: [
        { questionId: "gd-sub-time-002", optionIndex: 0 },
        { questionId: "gd-sub-time-002", optionIndex: 3 },
      ],
    },
    {
      id: "mc-half-life-additive",
      title: "חיבור או כפל לינארי של פקטורי החצייה",
      skill: "gd-half-life-iteration",
      insight: "אתה מחבר או מכפל את פקטורי ההתחצות באופן לינארי (למשל $2 \\times 3 = 6$) במקום להעלות לחזקה. שלוש חצייות עוקבות נותנות $\\dfrac{1}{2} \\cdot \\dfrac{1}{2} \\cdot \\dfrac{1}{2} = \\dfrac{1}{8}$.",
      remedy: { subTopicId: "gd-time-rate" },
      triggers: [
        { questionId: "gd-sub-time-002", optionIndex: 1 },
      ],
    },
    {
      id: "mc-forget-multiply-t-in-exponent",
      title: "השמטת הכפלת $t$ במעריך",
      skill: "gd-evaluate-model",
      insight: "אתה מציב את $t$ בפונקציה אך שוכח להכפיל את $k$ ב-$t$ במעריך — כלומר מחשב $e^k$ במקום $e^{kt}$. בפונקציה $e^{kt}$ שני הגורמים $k$ ו-$t$ חייבים להופיע יחד.",
      remedy: { subTopicId: "gd-model" },
      triggers: [
        { questionId: "gd-sub-app-001", optionIndex: 1 },
      ],
    },
    {
      id: "mc-asymptote-is-initial",
      title: "הגבול האסימפטוטי הוא הערך ההתחלתי",
      skill: "gd-asymptotic-limit",
      insight: "אתה חושב שכאשר $t \\to \\infty$ הפונקציה שואפת לערך ההתחלתי $T_0$. בפועל $T_0 = T(0)$ הוא נקודת ההתחלה; כשהאקספוננט $e^{kt} \\to 0$ (עבור $k < 0$) הפונקציה שואפת דווקא ל-$T_s$.",
      remedy: { subTopicId: "gd-applications" },
      triggers: [
        { questionId: "gd-sub-app-002", optionIndex: 1 },
      ],
    },
    {
      id: "mc-asymptote-is-zero",
      title: "הגבול האסימפטוטי הוא $0$ כי האקספוננט שואף ל-$0$",
      skill: "gd-asymptotic-limit",
      insight: "אתה מסיק שהפונקציה כולה שואפת ל-$0$ כי האיבר המעריכי שואף ל-$0$. אבל $T_s$ הוא קבוע חיצוני שאינו נעלם — הפונקציה שואפת ל-$T_s$, לא לאפס.",
      remedy: { subTopicId: "gd-applications" },
      triggers: [
        { questionId: "gd-sub-app-002", optionIndex: 2 },
      ],
    },
    {
      id: "mc-asymptote-is-difference",
      title: "הגבול האסימפטוטי הוא הפרש הטמפרטורות $T_0 - T_s$",
      skill: "gd-asymptotic-limit",
      insight: "אתה לוקח את המקדם $(T_0 - T_s)$ של האקספוננט כגבול של הפונקציה. המקדם הזה הוא ההפרש ה*התחלתי* שמתכווץ לאפס עם הזמן; הגבול האמיתי הוא $T_s$.",
      remedy: { subTopicId: "gd-applications" },
      triggers: [
        { questionId: "gd-sub-app-002", optionIndex: 3 },
      ],
    },
  ],
  questionSkills: {
    "gd-sub-model-001": ["gd-initial-value"],
    "gd-sub-model-002": ["gd-evaluate-model"],
    "gd-sub-time-001": ["gd-decay-constant"],
    "gd-sub-time-002": ["gd-half-life-iteration"],
    "gd-sub-app-001": ["gd-continuous-interest","gd-evaluate-model"],
    "gd-sub-app-002": ["gd-asymptotic-limit"],
  },
};
