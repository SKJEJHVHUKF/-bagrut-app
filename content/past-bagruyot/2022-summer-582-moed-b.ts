/**
 * שאלון 582 — קיץ תשפ"ב (2022), מועד ב'
 * =====================================
 *
 * המקור של השאלות: meyda.education.gov.il (משרד החינוך — נחלת הכלל).
 * הפתרונות נכתבו על-ידינו בסגנון האפליקציה; השיטה המתמטית עצמה כללית.
 *
 * תוכן השאלון:
 *   Q1 — גאומטריה אנליטית (מקום גאומטרי של מרכזי מעגלים, מעגל ואליפסה).
 *   Q2 — וקטורים במרחב (פירמידה משולשת אורתוגונלית, גובה למרכז כובד).
 *   Q3 — מספרים מרוכבים (משוואת w⁹, משולש שווה-שוקיים, מרובע ABOC).
 *   Q4 — פונקציות מעריכיות ($f = x^2 e^{a-x^3}$, פונקציה קדומה).
 *   Q5 — חקירת פונקציות מופשטות + מקרה פרטי $f = 4x/(1+x^2)$.
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2022Summer582MoedB: PastBagrutQuestion[] = [
  // ===========================================================================
  // Q1 — מקום גאומטרי + מעגל + אליפסה
  // ===========================================================================
  {
    id: 'b2022s582b-q1',
    year: 2022,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    totalPoints: 33,
    context:
      '(קיץ תשפ"ב, מועד ב\') נתונות הנקודות $\\;A(-5,\\,4)\\;$ ו-$\\;B(0,\\,-1)$.',
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 220 200',
        svg: `
          <line x1="12" y1="130" x2="208" y2="130" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <line x1="110" y1="12" x2="110" y2="192" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <text x="200" y="143" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
          <text x="114" y="20" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
          <ellipse cx="110" cy="130" rx="45" ry="36" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.85)" stroke-width="1.4"/>
          <circle cx="110" cy="94" r="45" fill="none" stroke="rgba(244,114,182,0.85)" stroke-width="1.4"/>
          <line x1="83" y1="14" x2="83" y2="190" stroke="rgba(251,191,36,0.9)" stroke-width="1.2" stroke-dasharray="4 3"/>
          <text x="64" y="186" fill="rgba(251,191,36,0.95)" font-size="9" font-family="Heebo, sans-serif">x=-3</text>
          <circle cx="137" cy="130" r="2.6" fill="rgba(251,191,36,0.95)"/>
          <circle cx="83" cy="130" r="2.6" fill="rgba(96,165,250,0.95)"/>
          <circle cx="83" cy="58" r="2.6" fill="rgba(96,165,250,0.95)"/>
          <circle cx="83" cy="101" r="2.6" fill="rgba(168,85,247,0.95)"/>
          <circle cx="83" cy="159" r="2.6" fill="rgba(168,85,247,0.95)"/>
          <circle cx="110" cy="94" r="2.4" fill="rgba(244,114,182,0.95)"/>
          <text x="140" y="127" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">F</text>
          <text x="70" y="127" fill="#bfdbfe" font-size="10" font-family="Heebo, sans-serif">K</text>
          <text x="70" y="56" fill="#bfdbfe" font-size="10" font-family="Heebo, sans-serif">L</text>
          <text x="88" y="99" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">T</text>
          <text x="88" y="164" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">Q</text>
          <text x="113" y="90" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">M</text>
        `,
        caption: 'המעגל $M(0,4)$ (ורוד), האליפסה $\\frac{x^2}{25}+\\frac{y^2}{16}=1$ (סגול), והישר $x=-3$ העובר במוקד השמאלי וחותך את שניהם ($K,L$ על המעגל; $T,Q$ על האליפסה).',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt:
          'מצא את משוואת המקום הגאומטרי של מרכזי המעגלים שהקטע $AB$ הוא מיתר שלהם.',
        answer_type: 'expression',
        hints: [
          'מרכז של מעגל שעובר דרך $A$ ו-$B$ נמצא במרחק שווה משתי הנקודות $\\Rightarrow$ הוא על האנך האמצעי לקטע $AB$.',
          'מצא את אמצע $AB$ ואת השיפוע של $AB$. אנך האמצעי עובר באמצע בשיפוע ההפכי-הנגדי.',
        ],
        solution: {
          steps: [
            'מרכז מעגל ש-$AB$ מיתר בו נמצא במרחק שווה מ-$A$ ומ-$B$ — כלומר על האנך האמצעי ל-$AB$',
            'אמצע $AB$: $\\;\\left(\\dfrac{-5+0}{2},\\, \\dfrac{4+(-1)}{2}\\right) = (-2.5,\\, 1.5)$',
            'שיפוע $AB$: $\\;m_{AB} = \\dfrac{4-(-1)}{-5-0} = -1$; שיפוע האנך: $m = 1$',
            'אנך אמצעי: $\\;y - 1.5 = 1\\cdot(x + 2.5)$',
            '$y = x + 4$',
          ],
          final_answer: 'המקום הגאומטרי: הישר $\\;y = x + 4$',
        },
      },
      {
        label: 'ב',
        prompt: [
          'המעגל $M$ הוא אחד מן המעגלים שהקטע $AB$ הוא מיתר שלהם, ונקודות החיתוך שלו עם ציר ה-$x$ הן מוקדים של אליפסה שמשוואתה קנונית.',
          'מצא את שיעורי מרכז המעגל $M$ ואת הרדיוס שלו.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'אליפסה קנונית מרכזה בראשית, וכשהמוקדים על ציר $x$ הם סימטריים לראשית — באבסיסות $\\pm c$.',
          'אם המעגל חותך את ציר $x$ בשתי נקודות סימטריות לראשית, אמצע המיתר על ציר $y$ $\\Rightarrow$ מרכז המעגל על ציר $y$.',
          'שלב עם סעיף א: מרכז $M$ על $y=x+4$ וגם על ציר $y$ ($x=0$).',
        ],
        solution: {
          steps: [
            'אליפסה קנונית: מוקדים על ציר $x$ סימטריים לראשית, $(\\pm c,\\, 0)$',
            'אלו נקודות החיתוך של $M$ עם ציר $x$, אז המיתר על ציר $x$ סימטרי לראשית $\\Rightarrow$ מרכז $M$ על ציר $y$ ($x_M = 0$)',
            'מסעיף א, המרכז על $y = x + 4$. הצב $x=0$: $\\;y = 4$, אז $M(0,4)$',
            'רדיוס $= |MA| = \\sqrt{(-5-0)^2 + (4-4)^2} = 5$ (בדיקה: $|MB| = \\sqrt{0 + (4+1)^2} = 5$ ✓)',
          ],
          final_answer: 'מרכז $M(0,4)$, רדיוס $R=5$. משוואת $M$: $\\;x^2 + (y-4)^2 = 25$',
        },
      },
      {
        label: 'ג',
        prompt:
          'נתון כי אורך הציר הראשי של האליפסה שווה לאורך קוטר המעגל $M$. מהי משוואת האליפסה?',
        answer_type: 'expression',
        hints: [
          'אורך הציר הראשי $= 2a$, וקוטר $M = 10$, אז $a=5$.',
          'חיתוך $M$ עם ציר $x$ נותן $c$, ואז $b^2 = a^2 - c^2$.',
        ],
        solution: {
          steps: [
            'חיתוך $M$ עם ציר $x$ ($y=0$): $\\;x^2 + (0-4)^2 = 25 \\Rightarrow x^2 = 9 \\Rightarrow x = \\pm3$, אז $c = 3$',
            'אורך הציר הראשי $= 2a =$ קוטר $M = 10$, אז $a = 5$',
            '$a^2 = b^2 + c^2$: $\\;25 = b^2 + 9 \\Rightarrow b^2 = 16$',
            '$\\dfrac{x^2}{25} + \\dfrac{y^2}{16} = 1$',
          ],
          final_answer: 'משוואת האליפסה: $\\;\\dfrac{x^2}{25} + \\dfrac{y^2}{16} = 1$',
        },
      },
      {
        label: 'ד',
        prompt: [
          'נסמן ב-$F$ את המוקד הימני של האליפסה. ישר המאונך לציר ה-$x$ עובר במוקד השמאלי של האליפסה.',
          'הישר חותך את האליפסה בנקודות $Q$ ו-$T$, ואת המעגל $M$ בנקודות $K$ ו-$L$.',
          'מצא את היחס בין שטח המשולש $KLF$ לבין שטח המשולש $TQF$.',
        ].join('\n'),
        answer_type: 'number',
        hints: [
          'המוקד השמאלי $(-3,0)$, אז הישר הוא $x=-3$. הצב במשוואת האליפסה (מוצא $T,Q$) ובמשוואת $M$ (מוצא $K,L$).',
          'שני המשולשים חולקים את אותו גובה (המרחק מ-$F(3,0)$ לישר $x=-3$), אז היחס בין השטחים שווה ליחס בין הבסיסים $\\frac{KL}{TQ}$.',
        ],
        solution: {
          steps: [
            'המוקד הימני $F(3,0)$, השמאלי $(-3,0)$, אז הישר המאונך דרכו: $\\;x = -3$',
            'חיתוך עם האליפסה: $\\;\\dfrac{9}{25} + \\dfrac{y^2}{16} = 1 \\Rightarrow y^2 = \\dfrac{256}{25} \\Rightarrow y = \\pm\\dfrac{16}{5}$, אז $T(-3,\\tfrac{16}{5})$, $Q(-3,-\\tfrac{16}{5})$',
            'חיתוך עם $M$: $\\;9 + (y-4)^2 = 25 \\Rightarrow (y-4)^2 = 16 \\Rightarrow y=0$ או $y=8$, אז $K(-3,0)$, $L(-3,8)$',
            'שני המשולשים $KLF$ ו-$TQF$ חולקים את אותו גובה (המרחק מ-$F$ לישר $x=-3$), אז $\\;\\dfrac{S_{KLF}}{S_{TQF}} = \\dfrac{KL}{TQ}$',
            '$KL = 8 - 0 = 8$, $\\;TQ = \\dfrac{16}{5} + \\dfrac{16}{5} = \\dfrac{32}{5}$',
            '$\\dfrac{S_{KLF}}{S_{TQF}} = \\dfrac{8}{32/5} = \\dfrac{40}{32} = \\dfrac{5}{4}$',
          ],
          final_answer: '$\\dfrac{S_{KLF}}{S_{TQF}} = \\dfrac{5}{4}$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q2 — פירמידה אורתוגונלית OABC + גובה למרכז כובד
  // ===========================================================================
  {
    id: 'b2022s582b-q2',
    year: 2022,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 33,
    context: [
      '(קיץ תשפ"ב, מועד ב\') נתונה פירמידה $OABC$ שבסיסה משולש $ABC$.',
      'נסמן: $\\;\\vec{OA} = \\vec{u}$, $\\;\\vec{OB} = \\vec{v}$, $\\;\\vec{OC} = \\vec{w}$.',
      'נתון: $\\;|\\vec u| = |\\vec v| = |\\vec w|$, $\\;\\angle AOB = \\angle BOC = \\angle COA = 90°$.',
      'הנקודה $H$ מקיימת $\\;\\vec{OH} = t\\vec u + s\\vec v + k\\vec w\\;$ ($s, t, k$ פרמטרים), ו-$\\vec{OH}$ מאונך לבסיס $ABC$.',
    ].join('\n'),
    parts: [
      {
        label: 'א',
        prompt: 'הוכח כי $\\;t = s = k$.',
        answer_type: 'proof',
        hints: [
          '$\\vec{OH}$ מאונך לכל וקטור במישור הבסיס. בפרט: $\\vec{OH}\\cdot\\vec{AB} = 0$ ו-$\\vec{OH}\\cdot\\vec{BC} = 0$.',
          '$\\vec{AB} = \\vec v - \\vec u$, $\\;\\vec{BC} = \\vec w - \\vec v$. השתמש בכך ש-$\\vec u\\cdot\\vec v = \\vec v\\cdot\\vec w = \\vec u\\cdot\\vec w = 0$ ו-$|\\vec u|^2 = |\\vec v|^2 = |\\vec w|^2$.',
        ],
        solution: {
          steps: [
            'נסמן $|\\vec u|^2 = |\\vec v|^2 = |\\vec w|^2 = q$. $\\;\\vec u\\cdot\\vec v = \\vec v\\cdot\\vec w = \\vec u\\cdot\\vec w = 0$ (זוויות $90°$).',
            '$\\vec{AB} = \\vec v - \\vec u$. $\\;\\vec{OH}\\cdot\\vec{AB} = 0$:',
            '$\\;(t\\vec u + s\\vec v + k\\vec w)\\cdot(\\vec v - \\vec u) = -t\\,q + s\\,q + 0 = q(s - t) = 0 \\Rightarrow s = t$.',
            '$\\vec{BC} = \\vec w - \\vec v$. $\\;\\vec{OH}\\cdot\\vec{BC} = 0$:',
            '$\\;(t\\vec u + s\\vec v + k\\vec w)\\cdot(\\vec w - \\vec v) = -s\\,q + k\\,q = q(k - s) = 0 \\Rightarrow k = s$.',
            'אז $t = s = k$. ⬛',
          ],
          final_answer: 'הוכח: $\\;t = s = k$.',
        },
      },
      {
        label: 'ב',
        prompt: [
          'הנקודה $M$ נמצאת בבסיס $ABC$ של הפירמידה, והיא נקודת המפגש של תיכוני הבסיס (מרכז הכובד).',
          'הוכח כי $\\;\\vec{OM} = \\tfrac{1}{3}\\vec u + \\tfrac{1}{3}\\vec v + \\tfrac{1}{3}\\vec w$, והסבר מדוע $OM$ הוא גובה לבסיס $ABC$ של הפירמידה.',
        ].join('\n'),
        answer_type: 'proof',
        hints: [
          'מרכז הכובד של משולש: $\\vec{OM} = \\tfrac{1}{3}(\\vec{OA} + \\vec{OB} + \\vec{OC})$ — נוסחה כללית.',
          '$\\vec{OM}$ נמצא בכיוון $(\\vec u + \\vec v + \\vec w)$, בדיוק כמו $\\vec{OH}$ מסעיף א ($t=s=k$). שניהם בכיוון של אותו וקטור, ו-$M$ על המישור $\\Rightarrow OM$ הוא הגובה.',
        ],
        solution: {
          steps: [
            'מרכז כובד: $\\;\\vec{OM} = \\tfrac{1}{3}(\\vec{OA}+\\vec{OB}+\\vec{OC}) = \\tfrac{1}{3}\\vec u + \\tfrac{1}{3}\\vec v + \\tfrac{1}{3}\\vec w$.',
            'מסעיף א: $\\vec{OH} = t(\\vec u + \\vec v + \\vec w)$ — בכיוון $\\vec u + \\vec v + \\vec w$, ומאונך למישור $ABC$.',
            '$\\vec{OM} = \\tfrac{1}{3}(\\vec u + \\vec v + \\vec w)$ — באותו כיוון בדיוק.',
            'אז $\\vec{OM}\\parallel\\vec{OH}$, ולכן $\\vec{OM}$ מאונך למישור $ABC$.',
            '$M$ נמצא במישור $ABC$, ו-$\\vec{OM}$ מאונך למישור $\\Rightarrow OM$ הוא גובה הפירמידה לבסיס $ABC$. ⬛',
          ],
          final_answer: 'הוכח: $\\vec{OM} = \\tfrac{1}{3}(\\vec u+\\vec v+\\vec w)$ ו-$OM$ הוא הגובה לבסיס.',
        },
      },
      {
        label: 'ג',
        prompt: [
          'הנקודה $P$ נמצאת על הישר $\\ell$ שעליו מונח הגובה לבסיס $ABC$.',
          'הביעו באמצעות $\\vec u$, $\\vec v$, $\\vec w$ את הווקטור $\\vec{OP}$, שבעבורו נפח הפירמידה $PABC$ כפול מנפח הפירמידה $OABC$ (שתי אפשרויות).',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          '$P$ על הישר $\\ell$ העובר ב-$O$ בכיוון $(\\vec u+\\vec v+\\vec w)$: $\\;\\vec{OP} = \\lambda(\\vec u+\\vec v+\\vec w)$.',
          'נפח פירמידה $= \\tfrac{1}{3} S h$ ($S$ שטח הבסיס). אותו בסיס $\\Rightarrow$ היחס בנפחים = היחס בגבהים. ה-$M$ במישור בפרמטר $\\lambda=\\tfrac{1}{3}$, ולכן המרחק מ-$P$ למישור הוא $|1-3\\lambda|\\cdot|OM|$.',
        ],
        solution: {
          steps: [
            'נסמן $\\vec{OP} = \\lambda(\\vec u + \\vec v + \\vec w)$. גובה מ-$O$ לבסיס: $h_O = |\\vec{OM}|$.',
            'נקודה $M$ ($\\lambda = \\tfrac{1}{3}$) על המישור — גובה $0$. נקודה כללית $P$ במרחק $|1 - 3\\lambda|\\cdot|\\vec{OM}|$ מן המישור.',
            'תנאי: $\\;|1 - 3\\lambda| = 2 \\Rightarrow 1 - 3\\lambda = \\pm 2 \\Rightarrow \\lambda = 1$ או $\\lambda = -\\tfrac{1}{3}$.',
            'שתי אפשרויות: $\\;\\vec{OP} = \\vec u + \\vec v + \\vec w\\;$ (מעבר ל-$M$, מרחוק $2|OM|$), או $\\;\\vec{OP} = -\\tfrac{1}{3}(\\vec u + \\vec v + \\vec w)$ (בצד הנגדי של $O$, השתקפות של $M$).',
          ],
          final_answer:
            '$\\vec{OP} = \\vec u + \\vec v + \\vec w\\;$ או $\\;\\vec{OP} = -\\tfrac{1}{3}(\\vec u + \\vec v + \\vec w)$.',
        },
      },
      {
        label: 'ד',
        prompt: [
          'ממקמים את הפירמידה במערכת צירים: $O$ בראשית, $A$ על החלק החיובי של ציר $x$, $B$ על החלק החיובי של ציר $y$, ו-$C$ על החלק החיובי של ציר $z$. נתון $\\;|\\vec u| = a$.',
          'מצא את ההצגה הפרמטרית של הישר $\\ell$ שעליו נמצא הקטע $OP$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'במערכת הצירים: $A = (a,\\,0,\\,0)$, $B = (0,\\,a,\\,0)$, $C = (0,\\,0,\\,a)$, ולכן $\\vec u + \\vec v + \\vec w = (a,\\,a,\\,a)$.',
          'הישר עובר דרך $O$ בכיוון $(1,\\,1,\\,1)$ (שווה ערך לכיוון $(a,a,a)$).',
        ],
        solution: {
          steps: [
            '$\\vec u + \\vec v + \\vec w = (a,\\,a,\\,a) \\parallel (1,\\,1,\\,1)$.',
            '$\\ell$ עובר ב-$O = (0,0,0)$ בכיוון $(1,1,1)$.',
          ],
          final_answer: 'הצגה פרמטרית: $\\;(x,\\,y,\\,z) = s(1,\\,1,\\,1)$, $\\;s \\in \\mathbb{R}$.',
        },
      },
      {
        label: 'ה',
        prompt: 'הביעו באמצעות $a$ את משוואת המישור $ABC$.',
        answer_type: 'expression',
        hints: [
          'אפשר להשתמש בצורת חיתוכים: מישור החותך את הצירים ב-$a$ בכל אחד הוא $\\dfrac{x}{a}+\\dfrac{y}{a}+\\dfrac{z}{a}=1$.',
        ],
        solution: {
          steps: [
            'מישור $ABC$ חותך את שלושת הצירים בנקודות $(a,0,0)$, $(0,a,0)$, $(0,0,a)$.',
            'צורת חיתוכים: $\\;\\dfrac{x}{a} + \\dfrac{y}{a} + \\dfrac{z}{a} = 1 \\Rightarrow x + y + z = a$.',
          ],
          final_answer: 'משוואת המישור: $\\;x + y + z = a$.',
        },
      },
      {
        label: 'ו',
        prompt: 'נתון כי נפח הפירמידה $OABC$ הוא $\\;20\\tfrac{5}{6}$. חשב את $a$.',
        answer_type: 'number',
        hints: [
          'הפירמידה היא טטראדר אורתוגונלי — שלוש מקצועות ניצבות שיוצאות מ-$O$ באורך $a$ כל אחת.',
          'נפח טטראדר עם שלוש מקצועות ניצבות באורך $a$: $V = \\tfrac{1}{6}a^3$ (אפשר לראות זאת כ-$\\tfrac{1}{3}\\cdot$ "בסיס" משולש ישר-זווית $\\tfrac{a^2}{2}\\cdot$ גובה $a$).',
        ],
        solution: {
          steps: [
            'נפח הטטראדר עם שלוש מקצועות ניצבות באורך $a$ מ-$O$: $\\;V = \\tfrac{1}{6}\\,a^3$.',
            '$20\\tfrac{5}{6} = \\tfrac{125}{6}$. הצב: $\\;\\tfrac{1}{6}a^3 = \\tfrac{125}{6} \\Rightarrow a^3 = 125 \\Rightarrow a = 5$.',
          ],
          final_answer: '$a = 5$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q3 — מספרים מרוכבים: w⁹, משולש שווה-שוקיים, מרובע ABOC
  // ===========================================================================
  {
    id: 'b2022s582b-q3',
    year: 2022,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 33,
    context: [
      '(קיץ תשפ"ב, מועד ב\') המספר $\\;z = R(\\cos\\alpha + i\\sin\\alpha)\\;$ נמצא במישור גאוס ברביע השלישי.',
      'נתון: $\\;\\dfrac{z}{\\bar z} = -\\dfrac{1}{2} + \\dfrac{\\sqrt 3}{2}i$.',
    ].join('\n'),
    parts: [
      {
        label: 'א',
        prompt: 'מצא את $\\alpha$.',
        answer_type: 'expression',
        hints: [
          '$\\dfrac{z}{\\bar z} = \\dfrac{R\\,\\text{cis}\\,\\alpha}{R\\,\\text{cis}(-\\alpha)} = \\text{cis}(2\\alpha)$.',
          'הצורה הקוטבית של הצד הימני: $-\\tfrac{1}{2}+\\tfrac{\\sqrt 3}{2}i = \\text{cis}(120°)$. אז $2\\alpha \\equiv 120° \\pmod{360°}$.',
          '$\\alpha$ ברביע שלישי: $180° < \\alpha < 270°$.',
        ],
        solution: {
          steps: [
            '$\\dfrac{z}{\\bar z} = \\text{cis}(2\\alpha) = -\\tfrac{1}{2}+\\tfrac{\\sqrt 3}{2}i = \\text{cis}(120°)$.',
            '$2\\alpha = 120° + 360°k \\Rightarrow \\alpha = 60° + 180°k$.',
            'הערכים: $\\alpha = 60°$ (רביע ראשון) או $\\alpha = 240°$ (רביע שלישי).',
            'נתון שב-$\\alpha$ ברביע שלישי: $\\;\\alpha = 240°$.',
          ],
          final_answer: '$\\alpha = 240°$.',
        },
      },
      {
        label: 'ב',
        prompt: 'נתון: $\\;\\bigl|2iz\\bigr| + \\Bigl|\\dfrac{\\bar z}{i}\\Bigr| - \\Bigl|\\dfrac{z}{\\bar z}\\Bigr| = 8$. מצא את $R$.',
        answer_type: 'number',
        hints: [
          'מודולים של מכפלה/מנה: $|2iz| = 2|i|\\cdot|z| = 2R$. $\\;|\\bar z/i| = R/1 = R$.',
          '$|z/\\bar z| = R/R = 1$.',
        ],
        solution: {
          steps: [
            '$|2iz| = 2\\cdot 1\\cdot R = 2R$. $\\;\\bigl|\\bar z/i\\bigr| = R$. $\\;\\bigl|z/\\bar z\\bigr| = 1$.',
            'הצב: $\\;2R + R - 1 = 8 \\Rightarrow 3R = 9 \\Rightarrow R = 3$.',
          ],
          final_answer: '$R = 3$.',
        },
      },
      {
        label: 'ג',
        prompt:
          'נתונה המשוואה $\\;w^9 = \\dfrac{z^3}{27}$ ($z$ הוא המספר שמצאתם). הראה כי $\\;\\dfrac{z}{\\bar z}\\;$ הוא אחד הפתרונות של המשוואה.',
        answer_type: 'proof',
        hints: [
          'חשב את $z^3 = R^3\\,\\text{cis}(3\\alpha)$. עם $R=3$ ו-$\\alpha=240°$: $z^3 = 27\\,\\text{cis}(720°) = 27$. אז $z^3/27 = 1$.',
          'צריך להראות $\\bigl(z/\\bar z\\bigr)^9 = 1$. השתמש בכך ש-$z/\\bar z = \\text{cis}(120°)$ ו-$120°\\cdot 9 = 1080° = 3\\cdot 360°$.',
        ],
        solution: {
          steps: [
            '$z = 3\\,\\text{cis}(240°)$, ולכן $z^3 = 27\\,\\text{cis}(720°) = 27\\,\\text{cis}(0°) = 27$.',
            'אז $\\;\\dfrac{z^3}{27} = 1$, והמשוואה הופכת ל-$w^9 = 1$.',
            'מסעיף א: $\\;\\dfrac{z}{\\bar z} = \\text{cis}(120°)$.',
            '$\\;\\Bigl(\\dfrac{z}{\\bar z}\\Bigr)^9 = \\text{cis}(120°\\cdot 9) = \\text{cis}(1080°) = \\text{cis}(3\\cdot 360°) = \\text{cis}(0°) = 1$.',
            'אז $z/\\bar z$ מקיים את המשוואה ולכן הוא פתרון. ⬛',
          ],
          final_answer: 'הוכח: $(z/\\bar z)^9 = 1 = z^3/27$.',
        },
      },
      {
        label: 'ד1',
        prompt: [
          'המשולש $ABC$ הוא משולש שווה-שוקיים. קודקודי הבסיס $B$ ו-$C$ מתאימים למספרים $\\;\\dfrac{\\bar z}{z}\\;$ ו-$\\;\\dfrac{z}{\\bar z}$.',
          'קודקוד הראש $A$ מתאים למספר $z + k$, כאשר $k$ הוא מספר מדומה טהור. מהו הערך של $k$?',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          '$z/\\bar z = \\text{cis}(120°)$, $\\bar z/z = \\text{cis}(-120°)$. שתי נקודות סימטריות ביחס לציר הממשי, על מעגל יחידה. הקטע $BC$ אנכי דרך $x = -\\tfrac{1}{2}$.',
          'במשולש שווה-שוקיים: $A$ על האנך האמצעי ל-$BC$. כאן זה ציר $x$ (ציר ממשי). אז $\\text{Im}(A) = 0$.',
          'הצב $A = z + k = -\\tfrac{3}{2} - \\tfrac{3\\sqrt 3}{2}i + ic$ ($k = ic$) והשווה את החלק המדומה לאפס.',
        ],
        solution: {
          steps: [
            '$B = \\bar z/z = \\text{cis}(-120°) = -\\tfrac{1}{2} - \\tfrac{\\sqrt 3}{2}i$. $\\;C = z/\\bar z = -\\tfrac{1}{2} + \\tfrac{\\sqrt 3}{2}i$.',
            'אמצע $BC$: $\\;\\bigl(-\\tfrac{1}{2},\\,0\\bigr)$. $BC$ אנכי $\\Rightarrow$ אנך אמצעי אופקי = ציר $x$.',
            'במשולש שווה-שוקיים $A$ על האנך האמצעי לבסיס $\\Rightarrow \\text{Im}(A) = 0$.',
            '$z = 3\\,\\text{cis}(240°) = -\\tfrac{3}{2} - \\tfrac{3\\sqrt 3}{2}i$. $\\;A = z + ic = -\\tfrac{3}{2} + i\\bigl(c - \\tfrac{3\\sqrt 3}{2}\\bigr)$.',
            '$\\text{Im}(A) = 0 \\Rightarrow c = \\tfrac{3\\sqrt 3}{2}$. אז $\\;k = \\tfrac{3\\sqrt 3}{2}\\,i$.',
          ],
          final_answer: '$k = \\dfrac{3\\sqrt 3}{2}\\,i$.',
        },
      },
      {
        label: 'ד2',
        prompt: 'חשב את שטח המרובע $ABOC$ ($O$ — ראשית הצירים).',
        answer_type: 'number',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="178" y="96" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Im</text>
              <polygon points="25,100 75,56.7 100,100 75,143.3" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <line x1="25" y1="100" x2="100" y2="100" stroke="rgba(251,191,36,0.6)" stroke-width="1" stroke-dasharray="3 3"/>
              <line x1="75" y1="56.7" x2="75" y2="143.3" stroke="rgba(251,191,36,0.6)" stroke-width="1" stroke-dasharray="3 3"/>
              <circle cx="25" cy="100" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="75" cy="56.7" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="100" cy="100" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="75" cy="143.3" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="14" y="96" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">A</text>
              <text x="60" y="52" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">B</text>
              <text x="104" y="96" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">O</text>
              <text x="60" y="156" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">C</text>
            `,
            caption: 'מרובע $ABOC$ — דלתון סימטרי ביחס לציר הממשי. אלכסונים $AO$ (אופקי) ו-$BC$ (אנכי) מאונכים זה לזה.',
          },
        ],
        hints: [
          'הקואורדינטות: $A=(-\\tfrac{3}{2},\\,0)$, $B=(-\\tfrac{1}{2},\\,\\tfrac{\\sqrt 3}{2})$, $O=(0,0)$, $C=(-\\tfrac{1}{2},\\,-\\tfrac{\\sqrt 3}{2})$.',
          'המרובע סימטרי ביחס לציר הממשי (דלתון). האלכסונים $AO$ ו-$BC$ מאונכים. שטח דלתון = $\\tfrac{1}{2}\\cdot d_1\\cdot d_2$.',
        ],
        solution: {
          steps: [
            'קואורדינטות: $\\;A(-\\tfrac{3}{2},0)$, $B(-\\tfrac{1}{2},\\tfrac{\\sqrt 3}{2})$, $O(0,0)$, $C(-\\tfrac{1}{2},-\\tfrac{\\sqrt 3}{2})$.',
            'אלכסון $AO$ אופקי (שני קודקודיו על ציר $x$), אורך: $|AO| = \\tfrac{3}{2}$.',
            'אלכסון $BC$ אנכי (שניהם בעלי אבסיסה $-\\tfrac{1}{2}$), אורך: $|BC| = \\sqrt 3$.',
            'האלכסונים מאונכים $\\Rightarrow$ המרובע דלתון. שטח: $\\;S = \\tfrac{1}{2}\\cdot|AO|\\cdot|BC| = \\tfrac{1}{2}\\cdot\\tfrac{3}{2}\\cdot\\sqrt 3 = \\tfrac{3\\sqrt 3}{4}$.',
          ],
          final_answer: 'שטח המרובע $ABOC$: $\\;S = \\dfrac{3\\sqrt 3}{4}$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q4 — פונקציות מעריכיות: $f = x^2 e^{a-x^3}$
  // ===========================================================================
  {
    id: 'b2022s582b-q4',
    year: 2022,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 4,
    topic: 'פונקציה מעריכית',
    totalPoints: 33,
    context:
      '(קיץ תשפ"ב, מועד ב\') נתונה הפונקציה $\\;f(x) = x^2\\,e^{a - x^3}\\;$ המוגדרת לכל $x$, $\\;a$ פרמטר.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצא את התחום שבו $f(x)$ חיובית.',
        answer_type: 'expression',
        hints: ['$x^2 \\ge 0$, $\\;e^{\\,\\cdots} > 0$ תמיד. אז $f(x) = 0$ רק כאשר $x = 0$.'],
        solution: {
          steps: [
            '$x^2 \\ge 0$ ושוויון רק ב-$x=0$. $\\;e^{a-x^3} > 0$ לכל $x$.',
            'אז $f(x) > 0$ לכל $x \\ne 0$, ו-$f(0) = 0$.',
          ],
          final_answer: 'תחום חיוביות: $\\;x \\in \\mathbb{R}\\setminus\\{0\\}$ (כל $x$ פרט ל-$0$).',
        },
      },
      {
        label: 'א2',
        prompt: 'מצא את שיעורי ה-$x$ של נקודות הקיצון של $f$ וקבע את סוגן.',
        answer_type: 'expression',
        hints: [
          'גזור עם כלל המכפלה: $\\;f\\,\'(x) = 2x\\,e^{a-x^3} + x^2\\,e^{a-x^3}\\cdot(-3x^2) = x\\,e^{a-x^3}(2 - 3x^3)$.',
          '$f\\,\' = 0 \\iff x = 0$ או $2 - 3x^3 = 0 \\iff x = \\sqrt[3]{2/3}$. בדוק סימני $f\\,\'$ מסביב לכל נקודה.',
        ],
        solution: {
          steps: [
            '$f\\,\'(x) = e^{a-x^3}\\cdot x\\cdot (2 - 3x^3)$. אפסים: $x_1 = 0$ ו-$x_2 = \\sqrt[3]{\\tfrac{2}{3}}$.',
            'סימן (האקספוננט תמיד חיובי):',
            '$\\;x < 0$: $x<0$, $(2-3x^3)>0$, $f\\,\' < 0$ (יורד).',
            '$\\;0 < x < \\sqrt[3]{2/3}$: $x>0$, $(2-3x^3)>0$, $f\\,\' > 0$ (עולה).',
            '$\\;x > \\sqrt[3]{2/3}$: $x>0$, $(2-3x^3)<0$, $f\\,\' < 0$ (יורד).',
            'אז $x=0$: מ-$-$ ל-$+$ $\\Rightarrow$ מינימום. $x = \\sqrt[3]{2/3}$: מ-$+$ ל-$-$ $\\Rightarrow$ מקסימום.',
          ],
          final_answer:
            'מינימום ב-$x = 0$ (ערך $f(0)=0$), מקסימום ב-$x = \\sqrt[3]{2/3}$ (ערך $\\;\\sqrt[3]{4/9}\\cdot e^{a-2/3}$).',
        },
      },
      {
        label: 'ב',
        prompt:
          'נתון כי השטח הכלוא בין הגרף של פונקציית הנגזרת $f\\,\'(x)$ לבין ציר ה-$x$ הוא $\\;\\sqrt[3]{\\dfrac{4e}{9}}$. מצא את הערך של $a$.',
        answer_type: 'number',
        hints: [
          'השטח הכלוא בין $f\\,\'$ לציר $x$ — בתחום בין שני אפסי $f\\,\'$ ($x=0$ ו-$x=\\sqrt[3]{2/3}$), שם $f\\,\' \\ge 0$.',
          '$\\displaystyle\\int_0^{\\sqrt[3]{2/3}} f\\,\'(x)\\,dx = f(\\sqrt[3]{2/3}) - f(0) = f(\\sqrt[3]{2/3})$. השווה לערך הנתון ופתור.',
        ],
        solution: {
          steps: [
            'שטח $= \\displaystyle\\int_0^{\\sqrt[3]{2/3}} f\\,\'(x)\\,dx = f\\bigl(\\sqrt[3]{2/3}\\bigr) - f(0) = \\sqrt[3]{\\tfrac{4}{9}}\\cdot e^{a - 2/3}$.',
            'נתון: $\\;\\sqrt[3]{\\tfrac{4}{9}}\\cdot e^{a-2/3} = \\sqrt[3]{\\tfrac{4e}{9}} = \\sqrt[3]{\\tfrac{4}{9}}\\cdot e^{1/3}$.',
            'מצמצמים: $\\;e^{a - 2/3} = e^{1/3} \\Rightarrow a - \\tfrac{2}{3} = \\tfrac{1}{3} \\Rightarrow a = 1$.',
          ],
          final_answer: '$a = 1$.',
        },
      },
      {
        label: 'ג',
        prompt: 'הצב $a = 1$ וסרטט סקיצה של גרף $f(x) = x^2 e^{1 - x^3}$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-1.5, 2.5],
            yRange: [-0.2, 1.6],
            curves: [{ fn: (x) => x * x * Math.exp(1 - x * x * x) }],
            markedPoints: [
              { x: 0, y: 0, label: 'מין' },
              { x: Math.cbrt(2 / 3), y: Math.cbrt(4 / 9) * Math.exp(1 / 3), label: 'מקס' },
            ],
            caption: 'גרף $f(x)=x^2 e^{1-x^3}$ ($a=1$): מינימום $(0,0)$, מקסימום ב-$\\sqrt[3]{2/3}\\approx 0.87$ עם ערך $\\sqrt[3]{4e/9}\\approx 1.16$.',
          },
        ],
        hints: ['השתמש בכל מה שחושב: מינימום $(0,0)$, מקסימום, אסימפטוטה ב-$+\\infty$ ($f\\to 0^+$), והתנהגות ב-$-\\infty$ ($f\\to+\\infty$).'],
        solution: {
          steps: [
            'התנהגות בקצוות: $\\;x \\to +\\infty$: $e^{1-x^3} \\to 0$ מהר, $f \\to 0^+$. $\\;x \\to -\\infty$: $1-x^3 \\to +\\infty$, $f \\to +\\infty$.',
            'הגרף: יורד מ-$+\\infty$ (שמאל), עובר דרך הציר ב-$(0,0)$ (מינימום, שיק אופקי), עולה למקסימום ב-$(\\sqrt[3]{2/3},\\,\\sqrt[3]{4e/9})$, יורד ושואף ל-$0^+$ מימין.',
          ],
          final_answer:
            'גרף בעל שני קיצונים: מינימום $(0,0)$ ומקסימום ב-$(\\sqrt[3]{2/3},\\,\\sqrt[3]{4e/9})$, אסימפטוטה $y=0$ ב-$+\\infty$, ב-$-\\infty$ הולך ל-$+\\infty$.',
        },
      },
      {
        label: 'ד1',
        prompt:
          'הפונקציה $g(x)$ היא קדומה של $f(x)$ (כלומר $g\\,\'(x) = f(x)$). מהו תחום העלייה של $g(x)$? נמק.',
        answer_type: 'expression',
        hints: [
          'תחום עלייה: היכן ש-$g\\,\'(x) \\ge 0$, כלומר $f(x) \\ge 0$.',
          'מסעיף א1: $f(x) > 0$ לכל $x \\ne 0$, ו-$f(0) = 0$. אז $g\\,\' \\ge 0$ בכל הישר.',
        ],
        solution: {
          steps: [
            '$g\\,\'(x) = f(x)$. עלייה $\\iff g\\,\' \\ge 0 \\iff f(x) \\ge 0$.',
            'מסעיף א1: $f \\ge 0$ לכל $x$, ושוויון רק ב-$x=0$.',
          ],
          final_answer:
            '$g$ עולה לכל $x \\in \\mathbb{R}$ (העלייה רציפה; ב-$x=0$ השיפוע אפס, אבל הפונקציה ממשיכה לעלות מסביב).',
        },
      },
      {
        label: 'ד2',
        prompt: 'כמה נקודות פיתול יש לפונקציה $g(x)$? נמק.',
        answer_type: 'number',
        hints: [
          'נקודת פיתול של $g$: היכן ש-$g\\,\'\' = f\\,\'$ מתחלף בסימן.',
          'מסעיף א2: $f\\,\'$ חיובית רק בקטע הקצר $(0, \\sqrt[3]{2/3})$ ושלילית מחוצה לו. אז $f\\,\'$ מתחלף בסימן בשתי נקודות.',
        ],
        solution: {
          steps: [
            '$g\\,\'\'(x) = f\\,\'(x)$. נקודת פיתול $\\iff f\\,\'$ מתחלף בסימן.',
            'סימני $f\\,\'$: $-$ ב-$(-\\infty,0)$, $+$ ב-$(0,\\sqrt[3]{2/3})$, $-$ ב-$(\\sqrt[3]{2/3},\\infty)$.',
            'התחלפויות סימן: ב-$x = 0$ (מ-$-$ ל-$+$) וב-$x = \\sqrt[3]{2/3}$ (מ-$+$ ל-$-$). שתי נקודות פיתול.',
          ],
          final_answer: 'שתי נקודות פיתול: $\\;x = 0$ ו-$x = \\sqrt[3]{2/3}$.',
        },
      },
      {
        label: 'ה',
        prompt: [
          'נסמן ב-$B$ את נקודת הפיתול של $g(x)$ שבה הערך $g(x)$ גבוה יותר מבין שתי נקודות הפיתול.',
          'נתון כי שיעור ה-$y$ של $B$ הוא $\\;\\dfrac{e - \\sqrt[3]{e}}{3}$. מצא את הפונקציה $g(x)$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'חשב $\\displaystyle\\int x^2 e^{1-x^3}\\,dx$ ע"י הצבה $u = 1-x^3$ ($du = -3x^2\\,dx$). תקבל $g(x) = -\\tfrac{1}{3}e^{1-x^3} + C$.',
          'הערך הגבוה יותר מבין הפיתולים מתקבל בנקודה $x = \\sqrt[3]{2/3}$ (כי $-\\tfrac{1}{3}e^{1/3} > -\\tfrac{1}{3}e$). הצב את התנאי הנתון כדי לחשב $C$.',
        ],
        solution: {
          steps: [
            'הצבה $u = 1 - x^3$, $\\;du = -3x^2\\,dx$:',
            '$\\;g(x) = \\displaystyle\\int x^2 e^{1-x^3}\\,dx = -\\tfrac{1}{3}\\int e^u\\,du = -\\tfrac{1}{3}e^{1-x^3} + C$.',
            'בשתי נקודות הפיתול: $\\;g(0) = -\\tfrac{1}{3}e + C$, $\\;g(\\sqrt[3]{2/3}) = -\\tfrac{1}{3}e^{1/3} + C = -\\tfrac{\\sqrt[3]{e}}{3} + C$.',
            'מאחר ש-$\\sqrt[3]{e} < e$, מתקיים $-\\tfrac{\\sqrt[3]{e}}{3} > -\\tfrac{e}{3}$, ולכן $g(\\sqrt[3]{2/3})$ גבוה יותר. אז $B = \\bigl(\\sqrt[3]{2/3},\\,C - \\tfrac{\\sqrt[3]{e}}{3}\\bigr)$.',
            'נתון $\\;y_B = \\dfrac{e - \\sqrt[3]{e}}{3}$, אז $\\;C - \\tfrac{\\sqrt[3]{e}}{3} = \\dfrac{e - \\sqrt[3]{e}}{3} \\Rightarrow C = \\dfrac{e}{3}$.',
            '$\\;g(x) = -\\tfrac{1}{3}e^{1-x^3} + \\tfrac{e}{3} = \\dfrac{e - e^{1-x^3}}{3}$.',
          ],
          final_answer: '$g(x) = \\dfrac{e - e^{1-x^3}}{3}$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q5 — חקירת פונקציות מופשטות + $f(x) = 4x/(1+x^2)$
  // ===========================================================================
  {
    id: 'b2022s582b-q5',
    year: 2022,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 5,
    topic: 'חקירת פונקציות',
    totalPoints: 33,
    context: [
      '(קיץ תשפ"ב, מועד ב\') נתונה פונקציה $f(x)$ המקיימת את התכונות הבאות:',
      '• מוגדרת לכל $x$ ורציפה.',
      '• הפונקציה אי-זוגית.',
      '• הישר $y = 0$ הוא אסימפטוטה של הפונקציה.',
      '• לפונקציה יש נקודת מינימום יחידה ששיעוריה הם $(-1,\\,-a)$, $\\;a$ פרמטר חיובי.',
    ].join('\n'),
    parts: [
      {
        label: 'א',
        prompt: 'סרטט סקיצה אפשרית של גרף הפונקציה $f(x)$.',
        answer_type: 'text',
        hints: [
          'אי-זוגית $\\Rightarrow f(-x)=-f(x) \\Rightarrow$ סימטריה ביחס לראשית. אם יש מינימום ב-$(-1,-a)$, אז יש מקסימום ב-$(1,a)$.',
          '$y=0$ אסימפטוטה אופקית $\\Rightarrow f(x)\\to 0$ ב-$x\\to\\pm\\infty$. מאי-זוגיות, $f(0)=0$.',
        ],
        solution: {
          steps: [
            'אי-זוגית $\\Rightarrow f(0)=0$, מקסימום ב-$(1,a)$ (סימטרי למינימום ב-$(-1,-a)$).',
            'תיאור הצורה: $f\\to 0^-$ ב-$x\\to-\\infty$, יורדת למינימום $(-1,-a)$, עולה דרך $(0,0)$ למקסימום $(1,a)$, ויורדת ל-$0^+$ ב-$x\\to+\\infty$.',
          ],
          final_answer:
            'גרף סימטרי ביחס לראשית עם מינימום $(-1,-a)$, חיתוך $(0,0)$, מקסימום $(1,a)$, ואסימפטוטה $y=0$ משני הקצוות.',
        },
      },
      {
        label: 'ב1',
        prompt: 'נתונה הפונקציה $\\;h(x) = \\ln(f(x))$. מצא את תחום ההגדרה של $h(x)$.',
        answer_type: 'expression',
        hints: [
          '$\\ln$ דורש $f(x) > 0$. מהסקיצה: $f$ חיובית רק ב-$(0,\\infty)$ (מסעיף א, $f$ אי-זוגית; חיובית בצד החיובי של ציר $x$).',
        ],
        solution: {
          steps: [
            '$f$ אי-זוגית עם $f(0)=0$, מינימום שלילי ב-$x=-1$ ומקסימום חיובי ב-$x=1$.',
            'מהסקיצה: $f<0$ ב-$(-\\infty,0)$, $f(0)=0$, $f>0$ ב-$(0,\\infty)$.',
            'ל-$\\ln$ דרוש $f>0$.',
          ],
          final_answer: 'תחום ההגדרה של $h$: $\\;(0,\\,\\infty)$.',
        },
      },
      {
        label: 'ב2',
        prompt: 'מצא את משוואות האסימפטוטות של $h(x)$ המאונכות לצירים (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          'אסימפטוטה אנכית: היכן ש-$f \\to 0^+$ $\\Rightarrow h \\to -\\infty$. בקצוות התחום: $x \\to 0^+$ ($f \\to 0^+$) ו-$x \\to +\\infty$ ($f \\to 0^+$).',
          'אסימפטוטה אופקית: $h$ הולך ל-$-\\infty$ בקצה $+\\infty$ $\\Rightarrow$ אין אופקית.',
        ],
        solution: {
          steps: [
            '$x \\to 0^+$: $f \\to 0^+$, $\\;h = \\ln(f) \\to -\\infty$. אסימפטוטה אנכית: $\\;x = 0$.',
            '$x \\to +\\infty$: $f \\to 0^+$, $\\;h \\to -\\infty$. אין אסימפטוטה אופקית (הגבול אינסופי).',
          ],
          final_answer: 'אסימפטוטה אנכית יחידה: $\\;x = 0$. אין אסימפטוטה אופקית.',
        },
      },
      {
        label: 'ב3',
        prompt: 'מצא את טווח הערכים של $a$ שבעבורו גרף $h(x)$ חותך את ציר $x$ בשתי נקודות.',
        answer_type: 'expression',
        hints: [
          '$h(x) = 0 \\iff f(x) = 1$. ספור כמה פתרונות ל-$f(x) = 1$ ב-$(0,\\infty)$.',
          '$f$ ב-$(0,\\infty)$: עולה מ-$0$ למקסימום $a$ ויורדת בחזרה ל-$0$. $f=1$ מתקיים פעמיים אם המקסימום מעל $1$.',
        ],
        solution: {
          steps: [
            '$h(x) = 0 \\iff \\ln(f(x)) = 0 \\iff f(x) = 1$.',
            '$f$ ב-$(0,\\infty)$: עולה מ-$0$ ל-$a$ (ב-$x=1$), אז יורדת ל-$0$. רציף.',
            'משוואת $f=1$: 0 פתרונות אם $a < 1$, פתרון יחיד אם $a = 1$, שני פתרונות אם $a > 1$.',
          ],
          final_answer: 'גרף $h$ חותך את ציר $x$ בשתי נקודות $\\iff a > 1$.',
        },
      },
      {
        label: 'ב4',
        prompt: 'סרטט סקיצה של גרף הפונקציה $h(x)$ אם ידוע שהגרף שלה חותך את ציר ה-$x$ בשתי נקודות.',
        answer_type: 'text',
        hints: [
          'מסעיף ב3: $a>1$. אז יש מקסימום של $h$ ב-$x=1$ בערך $\\ln(a) > 0$. בקצוות התחום $h \\to -\\infty$.',
        ],
        solution: {
          steps: [
            'תחום: $(0,\\infty)$. אסימפטוטה אנכית $x=0$.',
            'בקצוות: $h \\to -\\infty$ משני הצדדים ($x\\to 0^+$ ו-$x\\to+\\infty$).',
            'מקסימום ב-$x=1$ (כי שם $f$ מקסימלי) בערך $\\ln(a) > 0$.',
            'הגרף עולה מ-$-\\infty$ למקסימום $\\ln(a)>0$, אז יורד ל-$-\\infty$. בדרך — שתי נקודות חיתוך עם ציר $x$ (משני צדי המקסימום).',
          ],
          final_answer:
            'גרף בצורת "כיפה" יורד-עולה-יורד בתחום $(0,\\infty)$, מקסימום $(1,\\,\\ln a)$, שתי נקודות חיתוך עם ציר $x$.',
        },
      },
      {
        label: 'ג1',
        prompt: [
          'נתון: $\\;f(x) = \\dfrac{4x}{1 + x^2}$ (פונקציה ספציפית המקיימת את כל התכונות של סעיף א).',
          'הפונקציה $g(x)$ היא הפונקציה המקיימת $\\;g\\,\'(x) = f(x)$ וגם $g(0) = 0$. מצא את $g(x)$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'חשב $\\displaystyle\\int \\dfrac{4x}{1+x^2}\\,dx$ ע"י הצבה $u = 1+x^2$.',
          '$g(0) = 0$ קובע את קבוע האינטגרציה.',
        ],
        solution: {
          steps: [
            'הצבה $u = 1 + x^2$, $\\;du = 2x\\,dx$, $\\;4x\\,dx = 2\\,du$.',
            '$\\;\\displaystyle\\int \\dfrac{4x}{1+x^2}\\,dx = \\int\\dfrac{2}{u}\\,du = 2\\ln u + C = 2\\ln(1+x^2) + C$.',
            'תנאי $g(0) = 2\\ln 1 + C = C = 0$.',
          ],
          final_answer: '$g(x) = 2\\ln(1 + x^2)$.',
        },
      },
      {
        label: 'ג2',
        prompt: 'האם הפונקציה $g(x)$ זוגית, אי-זוגית, או לא זוגית ולא אי-זוגית? נמק.',
        answer_type: 'text',
        hints: ['הצב $-x$ במקום $x$ ב-$g$.'],
        solution: {
          steps: [
            '$g(-x) = 2\\ln(1 + (-x)^2) = 2\\ln(1 + x^2) = g(x)$.',
            'מתקיים לכל $x$ $\\Rightarrow g$ זוגית. (אינטואיציה: $g$ קדומה של פונקציה אי-זוגית $f$, ולכן $g$ זוגית.)',
          ],
          final_answer: '$g$ זוגית (כי $g(-x) = g(x)$).',
        },
      },
      {
        label: 'ד',
        prompt:
          'מהו הערך של $t$ ($t > -5$) שבעבורו מתקיים $\\;2\\cdot\\displaystyle\\int_{-5}^{t} g(x)\\,dx = \\int_{-5}^{5} g(x)\\,dx$? נמק.',
        answer_type: 'number',
        hints: [
          'נסמן $G(x) = \\displaystyle\\int_0^x g(s)\\,ds$. מהזוגיות של $g$ נובע ש-$G$ אי-זוגית ($G(-x) = -G(x)$).',
          'המשוואה הופכת ל-$2(G(t) - G(-5)) = G(5) - G(-5)$. עם $G(-5) = -G(5)$ — פשט אלגברית.',
        ],
        solution: {
          steps: [
            'נסמן $G(x) = \\displaystyle\\int_0^x g(s)\\,ds$. אז $\\displaystyle\\int_a^b g = G(b) - G(a)$.',
            'מאחר ש-$g$ זוגית, $G$ אי-זוגית: $\\;G(-x) = -G(x)$. בפרט $G(-5) = -G(5)$.',
            'המשוואה: $\\;2(G(t) - G(-5)) = G(5) - G(-5)$.',
            'הצבת $G(-5) = -G(5)$: $\\;2G(t) + 2G(5) = G(5) + G(5) = 2G(5) \\Rightarrow G(t) = 0$.',
            '$G$ עולה ממש (כי $g \\ge 0$ ושוויון רק בנקודה $x=0$), ו-$G(0) = 0$. לכן $G(t) = 0 \\iff t = 0$.',
            'בדיקה ש-$t = 0 > -5$ ✓.',
          ],
          final_answer: '$t = 0$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
