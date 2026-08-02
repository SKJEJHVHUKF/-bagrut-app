// ============================================================
// Cognition catalog — math5 · מספרים מרוכבים
// ============================================================
//
// 22 skills across the 5 sub-topics, 35 misconceptions, and a question→skill
// map over all 101 authored questions (91 in sub-topics + 10 in the topic bank).
//
// EVERY trigger below was read off the authored `distractorNotes` of the exact
// question it names — the note already says which wrong idea produces that
// option, so the mapping is transcription, not inference. Distractors whose
// error mechanism is one-of-a-kind are deliberately left untagged: a
// misconception with a single trigger can never accumulate enough evidence to
// be reported, so tagging it would only add noise to the gate's inventory.
//
// Angles are in DEGREES throughout, per the 5-unit complex-numbers convention
// (CLAUDE.md hard constraint 6). No Hebrew inside $...$ (constraint 5).

import type { TopicCognitionMap } from '../types';

const SUBJECT = 'math5';
const TOPIC = 'מספרים מרוכבים';

export const complexNumbersCognition: TopicCognitionMap = {
  subject: SUBJECT,
  topic: TOPIC,

  // ==========================================================
  // SKILLS — the graph
  // ==========================================================
  //
  //  arithmetic ─┬─→ conjugate ─┬─→ eq.conjugate-roots
  //              │              └─→ findz.xy-substitution ─→ eq.sqrt-of-complex
  //              ├─→ modulus ───────→ loci.distance ─┬─→ loci.bisector
  //              ├─→ arg.quadrant ──┬────────────────┴─→ loci.intersection
  //              │                  └─→ loci.ray
  //              └─→ eq.quadratic-real ─→ eq.vieta
  //  modulus + arg.quadrant ─→ polar.form ─┬─→ polar.to-algebraic
  //                                        ├─→ polar.mult-div ─→ polar.geometry
  //                                        └─→ demoivre.power ─→ roots.count
  //                                                              └─→ roots.formula ─→ roots.geometry
  skills: [
    // ---- foundations (taught across the topic, anchored in finding-z) ----
    {
      id: 'cx.algebraic.arithmetic',
      title: 'פעולות בסיסיות ו-$i$',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'finding-z',
      prereqs: [], band: 'easy',
    },
    {
      id: 'cx.algebraic.conjugate',
      title: 'הצמוד $\\bar{z}$',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'finding-z',
      prereqs: ['cx.algebraic.arithmetic'], band: 'easy',
    },

    // ---- polar-de-moivre ----
    {
      id: 'cx.modulus',
      title: 'הגודל $|z|$',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'polar-de-moivre',
      prereqs: ['cx.algebraic.arithmetic'], band: 'easy',
    },
    {
      id: 'cx.arg.quadrant',
      title: 'הארגומנט ותיקון הרבע',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'polar-de-moivre',
      prereqs: ['cx.algebraic.arithmetic'], band: 'mid',
    },
    {
      id: 'cx.polar.form',
      title: 'ההצגה הקוטבית $r\\,\\text{cis}\\,\\theta$',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'polar-de-moivre',
      prereqs: ['cx.modulus', 'cx.arg.quadrant'], band: 'mid',
    },
    {
      id: 'cx.polar.to-algebraic',
      title: 'המרה מקוטבית לאלגברית',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'polar-de-moivre',
      prereqs: ['cx.polar.form'], band: 'easy',
    },
    {
      id: 'cx.polar.mult-div',
      title: 'כפל וחילוק בקוטבית',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'polar-de-moivre',
      prereqs: ['cx.polar.form'], band: 'mid',
    },
    {
      id: 'cx.demoivre.power',
      title: 'נוסחת דה-מואבר',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'polar-de-moivre',
      prereqs: ['cx.polar.form'], band: 'mid',
    },
    {
      id: 'cx.polar.geometry',
      title: 'כפל כסיבוב ומתיחה',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'polar-de-moivre',
      prereqs: ['cx.polar.mult-div'], band: 'hard',
    },

    // ---- complex-roots ----
    {
      id: 'cx.roots.count',
      title: 'כמה שורשים יש למשוואה $z^n=w$',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'complex-roots',
      prereqs: ['cx.demoivre.power'], band: 'easy',
    },
    {
      id: 'cx.roots.formula',
      title: 'נוסחת השורש ה-$n$-י',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'complex-roots',
      prereqs: ['cx.roots.count', 'cx.polar.form'], band: 'mid',
    },
    {
      id: 'cx.roots.geometry',
      title: 'הגאומטריה של השורשים',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'complex-roots',
      prereqs: ['cx.roots.formula'], band: 'hard',
    },

    // ---- complex-equations ----
    {
      id: 'cx.eq.quadratic-real',
      title: 'משוואה ריבועית עם מקדמים ממשיים',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'complex-equations',
      prereqs: ['cx.algebraic.arithmetic'], band: 'mid',
    },
    {
      id: 'cx.eq.conjugate-roots',
      title: 'משפט השורשים הצמודים',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'complex-equations',
      prereqs: ['cx.algebraic.conjugate', 'cx.eq.quadratic-real'], band: 'easy',
    },
    {
      id: 'cx.eq.vieta',
      title: 'משפט וייטה',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'complex-equations',
      prereqs: ['cx.eq.quadratic-real'], band: 'mid',
    },
    {
      id: 'cx.eq.sqrt-of-complex',
      title: 'שורש ריבועי של מספר מרוכב',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'complex-equations',
      prereqs: ['cx.findz.xy-substitution'], band: 'hard',
    },

    // ---- gauss-loci ----
    {
      id: 'cx.loci.distance',
      title: '$|z-z_0|$ כמרחק, ומעגלים',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'gauss-loci',
      prereqs: ['cx.modulus'], band: 'easy',
    },
    {
      id: 'cx.loci.bisector',
      title: 'אנך אמצעי',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'gauss-loci',
      prereqs: ['cx.loci.distance'], band: 'mid',
    },
    {
      id: 'cx.loci.ray',
      title: 'קרניים וישרים מתנאי זווית או רכיב',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'gauss-loci',
      prereqs: ['cx.arg.quadrant'], band: 'mid',
    },
    {
      id: 'cx.loci.intersection',
      title: 'חיתוך שני מקומות גאומטריים',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'gauss-loci',
      prereqs: ['cx.loci.distance', 'cx.loci.ray'], band: 'hard',
    },

    // ---- finding-z ----
    {
      id: 'cx.findz.xy-substitution',
      title: 'הצבת $z=x+iy$ והשוואת חלקים',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'finding-z',
      prereqs: ['cx.algebraic.arithmetic', 'cx.algebraic.conjugate'], band: 'mid',
    },
    {
      id: 'cx.findz.strategy',
      title: 'בחירת שיטה — קוטבית או $x+iy$',
      subject: SUBJECT, topic: TOPIC, subTopicId: 'finding-z',
      prereqs: ['cx.findz.xy-substitution', 'cx.polar.form'], band: 'mid',
    },
  ],

  // ==========================================================
  // MISCONCEPTIONS — each anchored to authored distractors
  // ==========================================================
  misconceptions: [
    // ---- foundations ----
    {
      id: 'cx.i.power-cycle',
      title: 'מחזוריות החזקות של $i$',
      skill: 'cx.algebraic.arithmetic',
      insight: 'אתה מחשב חזקות של $i$ לפי ניחוש במקום לפי המחזור באורך $4$ — חלוקת המעריך ב-$4$ והשארית קובעת.',
      remedy: { subTopicId: 'finding-z', level: 'learn' },
      triggers: [
        { questionId: 'cx-001', optionIndex: 1 },
        { questionId: 'cx-001', optionIndex: 2 },
        { questionId: 'cx-001', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.arith.component-sign',
      title: 'סימן רכיב בחיבור וחיסור',
      skill: 'cx.algebraic.arithmetic',
      insight: 'בחיבור וחיסור מרוכבים אתה מאבד סימן של אחד הרכיבים — הממשי והמדומה נאספים בנפרד, כל אחד עם הסימן שלו.',
      remedy: { subTopicId: 'finding-z', level: 'easy' },
      triggers: [
        { questionId: 'cx-002', optionIndex: 1 },
        { questionId: 'cx-002', optionIndex: 2 },
        { questionId: 'cx-002', optionIndex: 3 },
        { questionId: 'cx-sub-find-009', optionIndex: 2 },
        { questionId: 'cx-sub-find-009', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.arith.division-by-conjugate',
      title: 'חילוק מרוכבים דרך הצמוד',
      skill: 'cx.algebraic.arithmetic',
      insight: 'בחילוק מרוכבים צריך להרחיב בצמוד המכנה — בלי זה נשאר $i$ במכנה והתוצאה יוצאת שגויה.',
      remedy: { subTopicId: 'finding-z', level: 'easy' },
      triggers: [
        { questionId: 'cx-005', optionIndex: 1 },
        { questionId: 'cx-005', optionIndex: 2 },
        { questionId: 'cx-005', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.conj.flips-real-part',
      title: 'הצמוד הופך גם את החלק הממשי',
      skill: 'cx.algebraic.conjugate',
      insight: 'אתה הופך גם את סימן החלק הממשי — הצמוד משקף ביחס לציר הממשי, כלומר הופך את החלק המדומה בלבד.',
      remedy: { subTopicId: 'finding-z', level: 'learn' },
      triggers: [
        { questionId: 'cx-004', optionIndex: 1 },
        { questionId: 'complex-equations-drill-003', optionIndex: 1 },
        { questionId: 'cx-sub-eq-007', optionIndex: 1 },
        { questionId: 'cx-sub-find-008', optionIndex: 2 },
      ],
    },
    {
      id: 'cx.conj.swaps-parts',
      title: 'הצמוד מחליף בין החלקים',
      skill: 'cx.algebraic.conjugate',
      insight: 'אתה מחליף בין החלק הממשי למדומה — הצמוד לא מזיז רכיבים, הוא רק הופך סימן אחד.',
      remedy: { subTopicId: 'finding-z', level: 'learn' },
      triggers: [
        { questionId: 'cx-004', optionIndex: 3 },
        { questionId: 'complex-equations-drill-003', optionIndex: 2 },
        { questionId: 'cx-sub-eq-007', optionIndex: 2 },
        { questionId: 'cx-sub-find-008', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.conj.product-not-modulus-squared',
      title: '$z\\bar{z}$ אינו הגודל ואינו סכום הרכיבים',
      skill: 'cx.algebraic.conjugate',
      rootSkill: 'cx.modulus',
      insight: 'המכפלה $z\\bar{z}$ היא הגודל **בריבוע** — לא הגודל עצמו ולא סכום הרכיבים.',
      remedy: { subTopicId: 'finding-z', level: 'easy' },
      triggers: [
        { questionId: 'cx-sub-find-007', optionIndex: 1 },
        { questionId: 'cx-sub-find-007', optionIndex: 2 },
        { questionId: 'cx-sub-find-007', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.findz.reciprocal-on-unit-circle',
      title: 'הזהות $1/z=\\bar{z}$ על מעגל היחידה',
      skill: 'cx.algebraic.conjugate',
      insight: 'על מעגל היחידה $\\dfrac{1}{z}=\\bar{z}$, כי $\\dfrac{1}{z}=\\dfrac{\\bar{z}}{|z|^2}$ ו-$|z|=1$ — לא $z$ ולא $-z$.',
      remedy: { subTopicId: 'finding-z', level: 'learn' },
      triggers: [
        { questionId: 'finding-z-drill-004', optionIndex: 1 },
        { questionId: 'finding-z-drill-004', optionIndex: 2 },
        { questionId: 'finding-z-drill-004', optionIndex: 3 },
      ],
    },

    // ---- modulus ----
    {
      id: 'cx.mod.forgot-sqrt',
      title: 'עצירה ב-$|z|^2$ בלי שורש',
      skill: 'cx.modulus',
      insight: 'אתה עוצר ב-$a^2+b^2$ ולא מוציא שורש — זה $|z|^2$, והגודל עצמו הוא השורש שלו.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'learn' },
      triggers: [
        { questionId: 'cx-003', optionIndex: 3 },
        { questionId: 'cx-sub-polar-001', optionIndex: 3 },
        { questionId: 'polar-de-moivre-drill-002', optionIndex: 2 },
      ],
    },
    {
      id: 'cx.mod.combines-parts-linearly',
      title: 'חיבור או חיסור הרכיבים במקום פיתגורס',
      skill: 'cx.modulus',
      insight: 'אתה מחבר או מחסר את הרכיבים ישירות — הגודל הוא יתר במשולש ישר-זווית: מרבעים כל רכיב, מחברים, ורק אז שורש.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'learn' },
      triggers: [
        { questionId: 'cx-003', optionIndex: 1 },
        { questionId: 'cx-003', optionIndex: 2 },
        { questionId: 'cx-sub-polar-001', optionIndex: 1 },
        { questionId: 'cx-sub-polar-001', optionIndex: 2 },
        { questionId: 'polar-de-moivre-drill-002', optionIndex: 1 },
        { questionId: 'polar-de-moivre-drill-002', optionIndex: 3 },
        { questionId: 'cx-sub-polar-006', optionIndex: 3 },
      ],
    },

    // ---- argument ----
    {
      id: 'cx.arg.no-quadrant-fix',
      title: 'ארגומנט בלי תיקון רבע',
      skill: 'cx.arg.quadrant',
      insight: 'אתה עוצר בזווית-העזר שהמחשבון מחזיר. $\\arctan$ מחזיר רק זוויות בין $-90°$ ל-$90°$, ולכן אחרי החישוב חייבים לזהות את הרבע לפי הסימנים של $a$ ו-$b$ ולתקן.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'learn' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-003', optionIndex: 1 },
        { questionId: 'cx-sub-polar-002', optionIndex: 1 },
        { questionId: 'cx-sub-polar-002', optionIndex: 3 },
        { questionId: 'cx-sub-polar-006', optionIndex: 1 },
        { questionId: 'cx-006', optionIndex: 1 },
        { questionId: 'cx-006', optionIndex: 2 },
      ],
    },
    {
      id: 'cx.arg.wrong-quadrant',
      title: 'תיקון רבע — אבל הרבע הלא נכון',
      skill: 'cx.arg.quadrant',
      insight: 'אתה כן מתקן את הרבע, אבל בוחר את הרבע הלא נכון. שרטוט מהיר של הנקודה לפי הסימנים של $a$ ושל $b$ מכריע לפני כל חישוב.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'easy' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-003', optionIndex: 2 },
        { questionId: 'polar-de-moivre-drill-003', optionIndex: 3 },
        { questionId: 'cx-sub-polar-002', optionIndex: 2 },
        { questionId: 'cx-sub-polar-006', optionIndex: 2 },
        { questionId: 'cx-006', optionIndex: 3 },
      ],
    },

    // ---- polar form ----
    {
      id: 'cx.polar.negative-r',
      title: 'גודל שלילי בהצגה קוטבית',
      skill: 'cx.polar.form',
      insight: 'אתה משאיר את המינוס על $r$. הגודל הוא מרחק ולכן תמיד אי-שלילי — את הכיוון ההפוך מקודדת הזווית.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'learn' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-001', optionIndex: 1 },
        { questionId: 'polar-de-moivre-drill-004', optionIndex: 2 },
      ],
    },
    {
      id: 'cx.polar.axis-angle',
      title: 'הזווית של נקודה על ציר',
      skill: 'cx.polar.form',
      rootSkill: 'cx.arg.quadrant',
      insight: 'אתה מבלבל בין זוויות הצירים. $0°$ הוא ציר $x$ החיובי, $90°$ ציר $y$ החיובי, $180°$ ציר $x$ השלילי ו-$270°$ ציר $y$ השלילי — לנקודה על ציר אין צורך ב-$\\arctan$ בכלל.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'learn' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-001', optionIndex: 2 },
        { questionId: 'polar-de-moivre-drill-001', optionIndex: 3 },
        { questionId: 'polar-de-moivre-drill-004', optionIndex: 1 },
        { questionId: 'polar-de-moivre-drill-004', optionIndex: 3 },
        { questionId: 'complex-roots-drill-006', optionIndex: 1 },
        { questionId: 'complex-roots-drill-006', optionIndex: 2 },
        { questionId: 'complex-roots-drill-006', optionIndex: 3 },
        { questionId: 'cx-sub-roots-004', optionIndex: 1 },
        { questionId: 'cx-sub-roots-004', optionIndex: 2 },
        { questionId: 'cx-sub-roots-004', optionIndex: 3 },
        { questionId: 'finding-z-drill-003', optionIndex: 1 },
        { questionId: 'finding-z-drill-003', optionIndex: 2 },
      ],
    },

    // ---- polar → algebraic ----
    {
      id: 'cx.polar.cos-sin-swap',
      title: 'החלפה בין קוסינוס לסינוס בהמרה',
      skill: 'cx.polar.to-algebraic',
      insight: 'אתה מחליף בין $\\cos$ ל-$\\sin$. הקוסינוס בונה תמיד את החלק הממשי והסינוס את החלק המדומה.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'easy' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-005', optionIndex: 2 },
        { questionId: 'cx-sub-polar-003', optionIndex: 1 },
        { questionId: 'cx-sub-find-001', optionIndex: 2 },
        { questionId: 'cx-sub-find-006', optionIndex: 1 },
      ],
    },
    {
      id: 'cx.polar.r-not-distributed',
      title: '$r$ שלא הוכפל נכון בהמרה',
      skill: 'cx.polar.to-algebraic',
      insight: 'אתה לא מכפיל את $r$ בערכי $\\cos$ ו-$\\sin$ — לא מפצלים את $r$ בין הרכיבים ולא שמים אותו כמות שהוא. בדיקה מהירה: הגודל של התוצאה חייב לצאת בדיוק $r$.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'easy' },
      triggers: [
        { questionId: 'cx-sub-polar-003', optionIndex: 3 },
        { questionId: 'cx-sub-find-006', optionIndex: 3 },
        { questionId: 'cx-sub-find-001', optionIndex: 1 },
        { questionId: 'finding-z-drill-003', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.polar.sign-in-conversion',
      title: 'סימן רכיב אחרי ההמרה',
      skill: 'cx.polar.to-algebraic',
      rootSkill: 'cx.arg.quadrant',
      insight: 'הערכים שלך נכונים אבל הסימן לא. הרבע שבו יושבת הזווית קובע את הסימנים — ברבע II הממשי שלילי, ברבע III שניהם שליליים, וברבע IV המדומה שלילי.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'easy' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-005', optionIndex: 1 },
        { questionId: 'polar-de-moivre-drill-005', optionIndex: 3 },
        { questionId: 'cx-sub-polar-003', optionIndex: 2 },
        { questionId: 'cx-sub-find-006', optionIndex: 2 },
      ],
    },

    // ---- multiplication / division in polar ----
    {
      id: 'cx.polar.moduli-wrong-op',
      title: 'פעולה שגויה על הגדלים',
      skill: 'cx.polar.mult-div',
      insight: 'אתה מחבר או מחסר את הגדלים. בכפל הגדלים **נכפלים** ובחילוק הם **מתחלקים** — רק הזוויות מתחברות ונחסרות.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'easy' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-006', optionIndex: 2 },
        { questionId: 'cx-sub-polar-004', optionIndex: 1 },
        { questionId: 'cx-sub-polar-005', optionIndex: 1 },
        { questionId: 'cx-sub-polar-005', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.polar.angles-wrong-op',
      title: 'פעולה שגויה על הזוויות',
      skill: 'cx.polar.mult-div',
      insight: 'אתה מחסר זוויות בכפל, מחבר אותן בחילוק, או כופל אותן זו בזו. בכפל מחברים זוויות, בחילוק מחסרים — לעולם לא מכפילים.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'easy' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-006', optionIndex: 1 },
        { questionId: 'polar-de-moivre-drill-006', optionIndex: 3 },
        { questionId: 'cx-sub-polar-004', optionIndex: 2 },
        { questionId: 'cx-sub-polar-004', optionIndex: 3 },
        { questionId: 'cx-sub-polar-005', optionIndex: 2 },
      ],
    },

    // ---- de Moivre ----
    {
      id: 'cx.demoivre.modulus-not-powered',
      title: 'הגודל לא הועלה בחזקה',
      skill: 'cx.demoivre.power',
      insight: 'אתה מטפל בזווית ומשאיר את הגודל כמו שהוא. דה-מואבר פועל על **שני** הרכיבים: $z^n=r^n\\,\\text{cis}(n\\theta)$.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'easy' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-007', optionIndex: 1 },
        { questionId: 'polar-de-moivre-drill-007', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.demoivre.angle-mishandled',
      title: 'הזווית לא הוכפלה במעריך',
      skill: 'cx.demoivre.power',
      insight: 'אתה מוסיף את המעריך לזווית, מתעלם ממנה, או עוצר בחזקה נמוכה יותר. הזווית **נכפלת** ב-$n$: $\\text{cis}(n\\theta)$.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'mid' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-007', optionIndex: 2 },
        { questionId: 'polar-de-moivre-drill-008', optionIndex: 1 },
        { questionId: 'polar-de-moivre-drill-008', optionIndex: 2 },
        { questionId: 'polar-de-moivre-drill-008', optionIndex: 3 },
        { questionId: 'cx-sub-polar-007', optionIndex: 1 },
        { questionId: 'cx-sub-polar-007', optionIndex: 2 },
        { questionId: 'cx-sub-polar-007', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.polar.area-scale',
      title: 'שטח בכפל מרוכב',
      skill: 'cx.polar.geometry',
      insight: 'כפל ב-$r\\,\\text{cis}\\,\\theta$ מותח כל **אורך** פי $r$, ולכן **שטח** גדל פי $r^2$ — הסיבוב עצמו לא משנה שטח.',
      remedy: { subTopicId: 'polar-de-moivre', level: 'hard' },
      triggers: [
        { questionId: 'polar-de-moivre-drill-009', optionIndex: 1 },
        { questionId: 'polar-de-moivre-drill-009', optionIndex: 2 },
        { questionId: 'polar-de-moivre-drill-009', optionIndex: 3 },
      ],
    },

    // ---- roots ----
    {
      id: 'cx.roots.only-principal',
      title: 'ספירת חסר של השורשים',
      skill: 'cx.roots.count',
      insight: 'אתה מוצא את השורש הגלוי ועוצר. למשוואה $z^n=w$ יש **בדיוק $n$** פתרונות שונים — אחד לכל $k=0,\\ldots,n-1$.',
      remedy: { subTopicId: 'complex-roots', level: 'learn' },
      triggers: [
        { questionId: 'complex-roots-drill-001', optionIndex: 1 },
        { questionId: 'complex-roots-drill-001', optionIndex: 2 },
        { questionId: 'cx-sub-roots-001', optionIndex: 1 },
        { questionId: 'cx-sub-roots-001', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.roots.count-doubled',
      title: 'הכפלת מספר השורשים',
      skill: 'cx.roots.count',
      insight: 'אתה מכפיל את מספר השורשים, כאילו כל אחד מגיע בזוג עם נגדו. מספר הפתרונות שווה בדיוק למעריך $n$, בלי כפילות.',
      remedy: { subTopicId: 'complex-roots', level: 'learn' },
      triggers: [
        { questionId: 'complex-roots-drill-001', optionIndex: 3 },
        { questionId: 'cx-sub-roots-001', optionIndex: 2 },
      ],
    },
    {
      id: 'cx.roots.modulus-not-rooted',
      title: 'הגודל של השורש בלי שורש $n$-י',
      skill: 'cx.roots.formula',
      insight: 'אתה לוקח את הגודל של אגף ימין, מחלק אותו במעריך, או מוציא שורש ריבועי. הכלל הוא $|z|^n=|w|$, כלומר $|z|=\\sqrt[n]{|w|}$.',
      remedy: { subTopicId: 'complex-roots', level: 'easy' },
      triggers: [
        { questionId: 'complex-roots-drill-002', optionIndex: 1 },
        { questionId: 'complex-roots-drill-002', optionIndex: 2 },
        { questionId: 'complex-roots-drill-002', optionIndex: 3 },
        { questionId: 'cx-sub-roots-002', optionIndex: 1 },
        { questionId: 'cx-sub-roots-002', optionIndex: 2 },
        { questionId: 'cx-sub-roots-002', optionIndex: 3 },
        { questionId: 'cx-sub-roots-005', optionIndex: 1 },
        { questionId: 'cx-sub-roots-005', optionIndex: 2 },
        { questionId: 'cx-sub-roots-005', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.roots.angle-formula',
      title: 'הזוויות בנוסחת השורשים',
      skill: 'cx.roots.formula',
      insight: 'שתי הזוויות בנוסחה עובדות אחרת: הזווית הראשונה היא $\\dfrac{\\theta}{n}$ — מחלקים במעריך — והמרווח בין שורשים סמוכים הוא $\\dfrac{360°}{n}$, לא $360°$ שלם.',
      remedy: { subTopicId: 'complex-roots', level: 'easy' },
      triggers: [
        { questionId: 'complex-roots-drill-003', optionIndex: 1 },
        { questionId: 'complex-roots-drill-003', optionIndex: 2 },
        { questionId: 'complex-roots-drill-003', optionIndex: 3 },
        { questionId: 'complex-roots-drill-005', optionIndex: 1 },
        { questionId: 'complex-roots-drill-005', optionIndex: 2 },
        { questionId: 'complex-roots-drill-005', optionIndex: 3 },
        { questionId: 'cx-sub-roots-003', optionIndex: 1 },
        { questionId: 'cx-sub-roots-003', optionIndex: 2 },
        { questionId: 'cx-sub-roots-003', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.roots.sum-property',
      title: 'תכונת סכום השורשים',
      skill: 'cx.roots.geometry',
      insight: 'סכום כל $n$ השורשים של $z^n-w=0$ הוא $0$, כי אין במשוואה מקדם ל-$z^{n-1}$ — זו בדיקה מהירה ודרך למצוא שורש חסר.',
      remedy: { subTopicId: 'complex-roots', level: 'mid' },
      triggers: [
        { questionId: 'complex-roots-drill-004', optionIndex: 1 },
        { questionId: 'complex-roots-drill-004', optionIndex: 2 },
        { questionId: 'complex-roots-drill-004', optionIndex: 3 },
      ],
    },

    // ---- equations ----
    {
      id: 'cx.eq.forgot-i',
      title: 'שורש של מספר שלילי בלי $i$',
      skill: 'cx.eq.quadratic-real',
      insight: 'אתה מוציא שורש ממספר שלילי כאילו היה חיובי. ריבוע של מספר ממשי לעולם אינו שלילי, ולכן השורש חייב לגרור את $i$.',
      remedy: { subTopicId: 'complex-equations', level: 'learn' },
      triggers: [
        { questionId: 'complex-equations-drill-001', optionIndex: 1 },
        { questionId: 'cx-sub-eq-001', optionIndex: 1 },
      ],
    },
    {
      id: 'cx.eq.missing-second-root',
      title: 'רק אחד משני הפתרונות',
      skill: 'cx.eq.quadratic-real',
      insight: 'אתה נותן פתרון אחד נכון ועוצר. למשוואה ריבועית יש שני פתרונות, וכאן הם $\\pm$ זה של זה.',
      remedy: { subTopicId: 'complex-equations', level: 'easy' },
      triggers: [
        { questionId: 'complex-equations-drill-001', optionIndex: 2 },
        { questionId: 'cx-sub-eq-001', optionIndex: 2 },
        { questionId: 'cx-sub-eq-001', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.eq.sign-of-real-part',
      title: 'סימן החלק הממשי בנוסחת השורשים',
      skill: 'cx.eq.quadratic-real',
      insight: 'סימן החלק הממשי מתהפך אצלך. בנוסחה מופיע $-b$ ולא $b$, ולכן החלק הממשי הוא $\\dfrac{-b}{2a}$.',
      remedy: { subTopicId: 'complex-equations', level: 'mid' },
      triggers: [
        { questionId: 'complex-equations-drill-002', optionIndex: 1 },
        { questionId: 'cx-sub-eq-003', optionIndex: 1 },
      ],
    },
    {
      id: 'cx.eq.b-as-real-part',
      title: 'המקדם $b$ נלקח כחלק הממשי',
      skill: 'cx.eq.quadratic-real',
      insight: 'אתה לוקח את המקדם עצמו כחלק הממשי ומדלג על החלוקה ב-$2a$.',
      remedy: { subTopicId: 'complex-equations', level: 'mid' },
      triggers: [
        { questionId: 'complex-equations-drill-002', optionIndex: 2 },
        { questionId: 'cx-sub-eq-003', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.eq.discriminant-scale',
      title: 'גודל $\\sqrt{\\Delta}$',
      skill: 'cx.eq.quadratic-real',
      insight: 'החלק המדומה יוצא לך גדול או קטן מדי — צריך לחשב את $\\Delta$ במלואו, להוציא $\\sqrt{|\\Delta|}\\,i$, ורק אז לחלק ב-$2a$.',
      remedy: { subTopicId: 'complex-equations', level: 'mid' },
      triggers: [
        { questionId: 'complex-equations-drill-002', optionIndex: 3 },
        { questionId: 'cx-sub-eq-003', optionIndex: 2 },
      ],
    },
    {
      id: 'cx.eq.real-vs-complex-count',
      title: 'פתרונות ממשיים מול מרוכבים',
      skill: 'cx.eq.quadratic-real',
      insight: 'השאלה מבקשת פתרונות **ממשיים** ואתה סופר את המרוכבים. כשהדיסקרימיננטה שלילית אין אף פתרון ממשי, אף ששני פתרונות מרוכבים קיימים.',
      remedy: { subTopicId: 'complex-equations', level: 'easy' },
      triggers: [
        { questionId: 'cx-sub-eq-002', optionIndex: 1 },
        { questionId: 'cx-sub-eq-002', optionIndex: 2 },
        { questionId: 'cx-sub-eq-002', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.eq.sqrt-of-complex-method',
      title: 'שורש ריבועי של מספר מרוכב',
      skill: 'cx.eq.sqrt-of-complex',
      insight: 'אי אפשר "להוציא שורש" ממרוכב איבר-איבר. מציבים $\\sqrt{w}=a+bi$, מרבעים, ומשווים חלק ממשי וחלק מדומה — ואז בודקים בהצבה.',
      remedy: { subTopicId: 'complex-equations', level: 'hard' },
      triggers: [
        { questionId: 'complex-equations-drill-004', optionIndex: 1 },
        { questionId: 'complex-equations-drill-004', optionIndex: 2 },
        { questionId: 'complex-equations-drill-004', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.vieta.sign',
      title: 'סימן בנוסחאות וייטה',
      skill: 'cx.eq.vieta',
      insight: 'אתה לוקח את המקדם כמו שהוא. הסכום הוא $-\\dfrac{b}{a}$ עם מינוס, והמכפלה היא $\\dfrac{c}{a}$ בלי מינוס.',
      remedy: { subTopicId: 'complex-equations', level: 'easy' },
      triggers: [
        { questionId: 'cx-sub-eq-006', optionIndex: 1 },
        { questionId: 'cx-sub-eq-006', optionIndex: 3 },
        { questionId: 'cx-sub-eq-008', optionIndex: 1 },
        { questionId: 'cx-sub-eq-008', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.vieta.sum-product-swap',
      title: 'החלפה בין סכום למכפלה',
      skill: 'cx.eq.vieta',
      insight: 'אתה מחזיר את הסכום כשמבקשים מכפלה ולהפך. מקדם $z$ אחראי לסכום, והמקדם החופשי למכפלה.',
      remedy: { subTopicId: 'complex-equations', level: 'easy' },
      triggers: [
        { questionId: 'cx-sub-eq-006', optionIndex: 2 },
        { questionId: 'cx-sub-eq-008', optionIndex: 2 },
      ],
    },
    {
      id: 'cx.vieta.complex-product-sign',
      title: 'חילוץ שורש שני ממכפלה מרוכבת',
      skill: 'cx.eq.vieta',
      insight: 'כשהמקדמים מרוכבים השורשים כבר לא צמודים, ולכן חייבים לחלץ את השני מהמכפלה $z_1z_2=\\dfrac{c}{a}$ — ולבדוק בהצבה, כי סימנים נופלים כאן בקלות.',
      remedy: { subTopicId: 'complex-equations', level: 'hard' },
      triggers: [
        { questionId: 'complex-equations-drill-005', optionIndex: 1 },
        { questionId: 'complex-equations-drill-005', optionIndex: 2 },
        { questionId: 'complex-equations-drill-005', optionIndex: 3 },
      ],
    },

    // ---- loci ----
    {
      id: 'cx.loci.modulus-not-a-circle',
      title: '$|z|=r$ נקרא כצורה אחרת',
      skill: 'cx.loci.distance',
      rootSkill: 'cx.modulus',
      insight: 'התנאי $|z|=r$ קובע **מרחק** ומשאיר את הזווית חופשית — ולכן הוא תמיד מעגל, לא ישר ולא קטע.',
      remedy: { subTopicId: 'gauss-loci', level: 'learn' },
      triggers: [
        { questionId: 'gauss-loci-drill-001', optionIndex: 1 },
        { questionId: 'gauss-loci-drill-001', optionIndex: 2 },
        { questionId: 'gauss-loci-drill-001', optionIndex: 3 },
        { questionId: 'cx-sub-loci-001', optionIndex: 1 },
        { questionId: 'cx-sub-loci-001', optionIndex: 2 },
        { questionId: 'cx-sub-loci-001', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.loci.center-misread',
      title: 'קריאת מרכז המעגל מהביטוי',
      skill: 'cx.loci.distance',
      insight: 'אתה קורא את המרכז ישירות מהסימנים שבביטוי. קודם מסדרים לצורה $|z-z_0|=r$ — למשל $z-3+4i=z-(3-4i)$, ולכן המרכז הוא $(3,-4)$.',
      remedy: { subTopicId: 'gauss-loci', level: 'easy' },
      triggers: [
        { questionId: 'gauss-loci-drill-002', optionIndex: 1 },
        { questionId: 'gauss-loci-drill-002', optionIndex: 2 },
        { questionId: 'gauss-loci-drill-002', optionIndex: 3 },
        { questionId: 'cx-sub-loci-003', optionIndex: 1 },
        { questionId: 'cx-sub-loci-003', optionIndex: 2 },
        { questionId: 'cx-sub-loci-003', optionIndex: 3 },
        { questionId: 'cx-sub-loci-006', optionIndex: 1 },
        { questionId: 'cx-sub-loci-006', optionIndex: 2 },
      ],
    },
    {
      id: 'cx.loci.bisector-axis-swap',
      title: 'האנך האמצעי — הציר ההפוך',
      skill: 'cx.loci.bisector',
      insight: 'אתה מקבל אנך אמצעי, אבל על הציר ההפוך. האנך תמיד **ניצב** לקטע שבין המוקדים: מוקדים על ציר $x$ נותנים אנך אנכי, ומוקדים על ציר $y$ נותנים אנך אופקי.',
      remedy: { subTopicId: 'gauss-loci', level: 'mid' },
      triggers: [
        { questionId: 'gauss-loci-drill-003', optionIndex: 1 },
        { questionId: 'gauss-loci-drill-005', optionIndex: 1 },
        { questionId: 'cx-sub-loci-008', optionIndex: 1 },
      ],
    },
    {
      id: 'cx.loci.bisector-not-a-line',
      title: 'שוויון שני מרחקים נקרא כמעגל',
      skill: 'cx.loci.bisector',
      insight: 'מרחק קבוע מנקודה אחת נותן מעגל, אבל **שוויון** בין שני מרחקים נותן תמיד ישר — האנך האמצעי, שעובר באמצע הדרך ולא דרך אחד המוקדים.',
      remedy: { subTopicId: 'gauss-loci', level: 'mid' },
      triggers: [
        { questionId: 'gauss-loci-drill-003', optionIndex: 2 },
        { questionId: 'gauss-loci-drill-003', optionIndex: 3 },
        { questionId: 'gauss-loci-drill-005', optionIndex: 2 },
        { questionId: 'gauss-loci-drill-005', optionIndex: 3 },
        { questionId: 'cx-sub-loci-008', optionIndex: 2 },
        { questionId: 'cx-sub-loci-008', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.loci.ray-as-full-line',
      title: 'קרן שנקראת כישר שלם',
      skill: 'cx.loci.ray',
      insight: 'תנאי על הארגומנט קובע זווית **אחת** ולכן נותן קרן, לא ישר שלם — הכיוון ההפוך הוא זווית אחרת ואינו מקיים את התנאי.',
      remedy: { subTopicId: 'gauss-loci', level: 'learn' },
      triggers: [
        { questionId: 'gauss-loci-drill-004', optionIndex: 2 },
        { questionId: 'cx-sub-loci-002', optionIndex: 2 },
      ],
    },
    {
      id: 'cx.loci.ray-direction',
      title: 'כיוון הקרן',
      skill: 'cx.loci.ray',
      rootSkill: 'cx.arg.quadrant',
      insight: 'הצורה נכונה אבל הכיוון לא. הזווית נמדדת נגד כיוון השעון מהכיוון החיובי של ציר $x$: $90°$ למעלה, $180°$ שמאלה, $270°$ למטה.',
      remedy: { subTopicId: 'gauss-loci', level: 'easy' },
      triggers: [
        { questionId: 'gauss-loci-drill-004', optionIndex: 1 },
        { questionId: 'gauss-loci-drill-004', optionIndex: 3 },
        { questionId: 'cx-sub-loci-002', optionIndex: 1 },
      ],
    },
    {
      id: 'cx.loci.re-im-line',
      title: 'תנאי על $\\text{Re}$ או $\\text{Im}$',
      skill: 'cx.loci.ray',
      insight: 'קיבוע $\\text{Re}(z)$ מקבע את $x$ ומשאיר את $y$ חופשי — ולכן מתקבל ישר **אנכי**. קיבוע $\\text{Im}(z)$ נותן ישר אופקי.',
      remedy: { subTopicId: 'gauss-loci', level: 'easy' },
      triggers: [
        { questionId: 'cx-sub-loci-007', optionIndex: 1 },
        { questionId: 'cx-sub-loci-007', optionIndex: 2 },
        { questionId: 'cx-sub-loci-007', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.loci.intersection-count',
      title: 'מספר נקודות החיתוך',
      skill: 'cx.loci.intersection',
      insight: 'מציבים את תנאי הישר במשוואת המעגל ובודקים כמה פתרונות ממשיים יש למשוואה הריבועית שמתקבלת — ישר חותך מעגל ב-$0$, $1$ או $2$ נקודות בלבד.',
      remedy: { subTopicId: 'gauss-loci', level: 'mid' },
      triggers: [
        { questionId: 'gauss-loci-drill-006', optionIndex: 1 },
        { questionId: 'gauss-loci-drill-006', optionIndex: 2 },
        { questionId: 'gauss-loci-drill-006', optionIndex: 3 },
      ],
    },

    // ---- finding z ----
    {
      id: 'cx.findz.part-comparison',
      title: 'השוואת החלקים אחרי ההצבה',
      skill: 'cx.findz.xy-substitution',
      insight: 'אחרי ההצבה אתה משווה את החלקים הלא נכונים. אוספים בנפרד את כל מה שאין בו $i$ (החלק הממשי) ואת כל מה שמוכפל ב-$i$ (החלק המדומה) — ו-$z\\bar{z}$ ממשי לגמרי.',
      remedy: { subTopicId: 'finding-z', level: 'mid' },
      triggers: [
        { questionId: 'finding-z-drill-002', optionIndex: 1 },
        { questionId: 'finding-z-drill-002', optionIndex: 2 },
        { questionId: 'finding-z-drill-002', optionIndex: 3 },
      ],
    },
    {
      id: 'cx.findz.method-choice',
      title: 'בחירת השיטה',
      skill: 'cx.findz.strategy',
      insight: 'חזקות ושורשים גבוהים הם תמיד הצגה קוטבית; תנאים על $\\bar{z}$, $\\text{Re}$ או $\\text{Im}$ הם תמיד הצבת $z=x+iy$. בחירה הפוכה הופכת תרגיל קצר למערכת שאי אפשר לפתור ידנית.',
      remedy: { subTopicId: 'finding-z', level: 'learn' },
      triggers: [
        { questionId: 'finding-z-drill-001', optionIndex: 1 },
        { questionId: 'finding-z-drill-001', optionIndex: 2 },
        { questionId: 'finding-z-drill-001', optionIndex: 3 },
      ],
    },
  ],

  // ==========================================================
  // QUESTION → SKILLS
  // ==========================================================
  // A question may exercise more than one skill; every skill listed gets the
  // same observation. Questions absent from this map fall back to their
  // sub-topic's skills (coarse but never wrong) — see lib/cognition/observe.ts.
  questionSkills: {
    // ---- topic-level bank ----
    'cx-001': ['cx.algebraic.arithmetic'],
    'cx-002': ['cx.algebraic.arithmetic'],
    'cx-003': ['cx.modulus'],
    'cx-004': ['cx.algebraic.conjugate'],
    'cx-005': ['cx.algebraic.arithmetic'],
    'cx-006': ['cx.arg.quadrant'],
    'cx-007': ['cx.eq.quadratic-real'],
    'cx-008': ['cx.demoivre.power'],
    'cx-009': ['cx.roots.formula'],
    'cx-010': ['cx.algebraic.conjugate', 'cx.findz.xy-substitution'],

    // ---- polar-de-moivre ----
    'polar-de-moivre-drill-001': ['cx.polar.form'],
    'polar-de-moivre-drill-002': ['cx.modulus'],
    'polar-de-moivre-drill-003': ['cx.arg.quadrant'],
    'polar-de-moivre-drill-004': ['cx.polar.form'],
    'polar-de-moivre-drill-005': ['cx.polar.to-algebraic'],
    'polar-de-moivre-drill-006': ['cx.polar.mult-div'],
    'polar-de-moivre-drill-007': ['cx.demoivre.power'],
    'polar-de-moivre-drill-008': ['cx.demoivre.power', 'cx.polar.form'],
    'polar-de-moivre-drill-009': ['cx.polar.geometry'],
    'cx-sub-polar-001': ['cx.modulus'],
    'cx-sub-polar-002': ['cx.arg.quadrant'],
    'cx-sub-polar-003': ['cx.polar.to-algebraic'],
    'cx-sub-polar-004': ['cx.polar.mult-div'],
    'cx-sub-polar-005': ['cx.polar.mult-div'],
    'cx-sub-polar-006': ['cx.polar.form'],
    'cx-sub-polar-007': ['cx.demoivre.power'],
    'cx-sub-polar-008': ['cx.polar.form', 'cx.polar.geometry'],
    'cx-sub-polar-009': ['cx.demoivre.power', 'cx.polar.to-algebraic'],
    'cx-sub-polar-010': ['cx.demoivre.power', 'cx.polar.to-algebraic'],
    'cx-sub-polar-011': ['cx.polar.geometry'],
    'cx-sub-polar-012': ['cx.polar.geometry', 'cx.demoivre.power'],
    'cx-sub-polar-013': ['cx.demoivre.power', 'cx.polar.mult-div'],

    // ---- complex-roots ----
    'complex-roots-drill-001': ['cx.roots.count'],
    'complex-roots-drill-002': ['cx.roots.formula'],
    'complex-roots-drill-003': ['cx.roots.formula'],
    'complex-roots-drill-004': ['cx.roots.geometry'],
    'complex-roots-drill-005': ['cx.roots.formula'],
    'complex-roots-drill-006': ['cx.polar.form', 'cx.roots.formula'],
    'cx-sub-roots-001': ['cx.roots.count'],
    'cx-sub-roots-002': ['cx.roots.formula'],
    'cx-sub-roots-003': ['cx.roots.formula'],
    'cx-sub-roots-004': ['cx.polar.form', 'cx.roots.formula'],
    'cx-sub-roots-005': ['cx.roots.formula'],
    'cx-sub-roots-006': ['cx.roots.formula'],
    'cx-sub-roots-007': ['cx.roots.formula', 'cx.polar.to-algebraic'],
    'cx-sub-roots-008': ['cx.roots.formula', 'cx.polar.to-algebraic'],
    'cx-sub-roots-009': ['cx.roots.formula', 'cx.roots.geometry'],
    'cx-sub-roots-010': ['cx.roots.formula', 'cx.polar.to-algebraic'],
    'cx-sub-roots-011': ['cx.roots.formula', 'cx.findz.strategy'],
    'cx-sub-roots-012': ['cx.roots.geometry'],
    'cx-sub-roots-013': ['cx.roots.geometry'],

    // ---- complex-equations ----
    'complex-equations-drill-001': ['cx.eq.quadratic-real'],
    'complex-equations-drill-002': ['cx.eq.quadratic-real'],
    'complex-equations-drill-003': ['cx.eq.conjugate-roots'],
    'complex-equations-drill-004': ['cx.eq.sqrt-of-complex'],
    'complex-equations-drill-005': ['cx.eq.vieta'],
    'cx-sub-eq-001': ['cx.eq.quadratic-real'],
    'cx-sub-eq-002': ['cx.eq.quadratic-real'],
    'cx-sub-eq-003': ['cx.eq.quadratic-real'],
    'cx-sub-eq-004': ['cx.eq.quadratic-real', 'cx.eq.conjugate-roots'],
    'cx-sub-eq-005': ['cx.eq.conjugate-roots', 'cx.eq.vieta'],
    'cx-sub-eq-006': ['cx.eq.vieta'],
    'cx-sub-eq-007': ['cx.eq.conjugate-roots'],
    'cx-sub-eq-008': ['cx.eq.vieta'],
    'cx-sub-eq-009': ['cx.eq.quadratic-real'],
    'cx-sub-eq-010': ['cx.eq.conjugate-roots', 'cx.eq.vieta'],
    'cx-sub-eq-011': ['cx.eq.vieta'],
    'cx-sub-eq-012': ['cx.eq.sqrt-of-complex'],
    'cx-sub-eq-013': ['cx.eq.quadratic-real', 'cx.loci.distance'],

    // ---- gauss-loci ----
    'gauss-loci-drill-001': ['cx.loci.distance'],
    'gauss-loci-drill-002': ['cx.loci.distance'],
    'gauss-loci-drill-003': ['cx.loci.bisector'],
    'gauss-loci-drill-004': ['cx.loci.ray'],
    'gauss-loci-drill-005': ['cx.loci.bisector'],
    'gauss-loci-drill-006': ['cx.loci.intersection'],
    'cx-sub-loci-001': ['cx.loci.distance'],
    'cx-sub-loci-002': ['cx.loci.ray'],
    'cx-sub-loci-003': ['cx.loci.distance'],
    'cx-sub-loci-004': ['cx.loci.bisector'],
    'cx-sub-loci-005': ['cx.loci.intersection'],
    'cx-sub-loci-006': ['cx.loci.distance'],
    'cx-sub-loci-007': ['cx.loci.ray'],
    'cx-sub-loci-008': ['cx.loci.bisector'],
    'cx-sub-loci-009': ['cx.loci.bisector', 'cx.findz.xy-substitution'],
    'cx-sub-loci-010': ['cx.loci.distance'],
    'cx-sub-loci-011': ['cx.loci.bisector', 'cx.findz.xy-substitution'],
    'cx-sub-loci-012': ['cx.loci.intersection'],

    // ---- finding-z ----
    'finding-z-drill-001': ['cx.findz.strategy'],
    'finding-z-drill-002': ['cx.findz.xy-substitution'],
    'finding-z-drill-003': ['cx.polar.to-algebraic'],
    'finding-z-drill-004': ['cx.algebraic.conjugate'],
    'cx-sub-find-001': ['cx.polar.to-algebraic'],
    'cx-sub-find-002': ['cx.eq.sqrt-of-complex'],
    'cx-sub-find-003': ['cx.algebraic.conjugate', 'cx.findz.strategy'],
    'cx-sub-find-004': ['cx.eq.vieta'],
    'cx-sub-find-005': ['cx.findz.xy-substitution', 'cx.findz.strategy'],
    'cx-sub-find-006': ['cx.polar.to-algebraic'],
    'cx-sub-find-007': ['cx.algebraic.conjugate'],
    'cx-sub-find-008': ['cx.algebraic.conjugate'],
    'cx-sub-find-009': ['cx.algebraic.arithmetic'],
    'cx-sub-find-010': ['cx.algebraic.arithmetic', 'cx.findz.xy-substitution'],
    'cx-sub-find-011': ['cx.findz.xy-substitution', 'cx.algebraic.conjugate'],
    'cx-sub-find-012': ['cx.demoivre.power', 'cx.findz.strategy'],

    // ==========================================================
    // BAGRUT PARTS — keyed `${question.id}-${part.label}`
    // ==========================================================
    // That composite is what QuestionPartCard writes to results.ts; the
    // question id on its own never appears in an event. Each part is mapped to
    // the skills IT exercises rather than inheriting the whole question's
    // sub-topic — a bagrut question deliberately walks across skills (convert
    // to polar → raise to a power → convert back), which is exactly the
    // information the sub-topic fallback would destroy.

    // cx-bag-001 · z = 1 + i√3
    'cx-bag-001-א': ['cx.modulus', 'cx.arg.quadrant', 'cx.polar.form'],
    'cx-bag-001-ב': ['cx.demoivre.power', 'cx.polar.to-algebraic'],
    'cx-bag-001-ג': ['cx.demoivre.power'],

    // cx-bag-002 · z³ = −8
    'cx-bag-002-א': ['cx.polar.form', 'cx.roots.formula'],
    'cx-bag-002-ב': ['cx.roots.formula', 'cx.polar.to-algebraic'],
    'cx-bag-002-ג': ['cx.roots.geometry'],

    // cx-bag-003 · z² − 4z + 13 = 0
    'cx-bag-003-א': ['cx.eq.quadratic-real'],
    'cx-bag-003-ב': ['cx.modulus', 'cx.arg.quadrant'],
    'cx-bag-003-ג': ['cx.eq.vieta', 'cx.algebraic.conjugate'],

    // cx-bag-004 · loci and their intersection
    'cx-bag-004-א': ['cx.loci.distance'],
    'cx-bag-004-ב': ['cx.loci.ray'],
    'cx-bag-004-ג': ['cx.loci.intersection'],

    // cx-bag-005 · capstone (deliberately crosses four sub-topics)
    'cx-bag-005-א': ['cx.eq.quadratic-real'],
    'cx-bag-005-ב': ['cx.polar.form'],
    'cx-bag-005-ג': ['cx.demoivre.power'],
    'cx-bag-005-ד': ['cx.modulus', 'cx.loci.distance'],
    'cx-bag-005-ה': ['cx.polar.geometry'],

    // cx-bag-006 · product in polar form
    'cx-bag-006-א': ['cx.modulus', 'cx.arg.quadrant', 'cx.polar.form'],
    'cx-bag-006-ב': ['cx.polar.mult-div'],

    // cx-bag-007 · w⁶, the full round trip
    'cx-bag-007-א': ['cx.polar.form', 'cx.demoivre.power', 'cx.polar.to-algebraic'],

    // cx-bag-008 · z·z̄ + 2z = 15 + 8i
    'cx-bag-008-א': ['cx.findz.xy-substitution', 'cx.algebraic.conjugate'],

    // cx-bag-009 · z³ = −8i, then the triangle
    'cx-bag-009-א': ['cx.roots.formula'],
    'cx-bag-009-ב': ['cx.roots.geometry'],

    // cx-bag-010 · perpendicular bisector
    'cx-bag-010-א': ['cx.loci.bisector', 'cx.findz.xy-substitution'],

    // cx-bag-011 · geometric series with a complex ratio
    'cx-bag-011-א': ['cx.demoivre.power', 'cx.polar.to-algebraic'],
    'cx-bag-011-ב': ['cx.demoivre.power', 'cx.algebraic.arithmetic'],
  },
};
