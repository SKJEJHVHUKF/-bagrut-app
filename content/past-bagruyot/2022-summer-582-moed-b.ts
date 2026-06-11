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
 *   Q5 — חקירת פונקציות מופשטות + מקרה פרטי $f = 6x/(1+x^2)$.
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
          'מרכז של מעגל שעובר דרך $A$ ו-$B$ נמצא במרחק שווה משתי הנקודות, ולכן הוא על האנך האמצעי לקטע $AB$.',
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
          'אם המעגל חותך את ציר $x$ בשתי נקודות סימטריות לראשית, אמצע המיתר על ציר $y$, ולכן מרכז המעגל על ציר $y$.',
          'שלב עם סעיף א: מרכז $M$ על $y=x+4$ וגם על ציר $y$ ($x=0$).',
        ],
        solution: {
          steps: [
            'אליפסה קנונית: מוקדים על ציר $x$ סימטריים לראשית, $(\\pm c,\\, 0)$',
            'אלו נקודות החיתוך של $M$ עם ציר $x$, אז המיתר על ציר $x$ סימטרי לראשית, ולכן מרכז $M$ על ציר $y$ ($x_M = 0$)',
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
            'חיתוך $M$ עם ציר $x$ ($y=0$): $\\;x^2 + (0-4)^2 = 25$',
            '$x^2 = 9$',
            '$x = \\pm3$, אז $c = 3$',
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
            'חיתוך עם האליפסה: $\\;\\dfrac{9}{25} + \\dfrac{y^2}{16} = 1$',
            '$y^2 = \\dfrac{256}{25}$',
            '$y = \\pm\\dfrac{16}{5}$, אז $T(-3,\\tfrac{16}{5})$, $Q(-3,-\\tfrac{16}{5})$',
            'חיתוך עם $M$: $\\;9 + (y-4)^2 = 25$',
            '$(y-4)^2 = 16$',
            '$y=0$ או $y=8$, אז $K(-3,0)$, $L(-3,8)$',
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
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 220 200',
        svg: `
          <polygon points="48,152 108,182 176,146" fill="rgba(56,189,248,0.06)" stroke="rgba(226,232,240,0.8)" stroke-width="1.4"/>
          <line x1="110" y1="35" x2="48" y2="152" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="110" y1="35" x2="108" y2="182" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="110" y1="35" x2="176" y2="146" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="110" y1="35" x2="111" y2="160" stroke="rgba(244,114,182,0.9)" stroke-width="1.4" stroke-dasharray="4 3"/>
          <circle cx="110" cy="35" r="2.8" fill="rgba(244,114,182,0.95)"/>
          <circle cx="48" cy="152" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <circle cx="108" cy="182" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <circle cx="176" cy="146" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <circle cx="111" cy="160" r="2.4" fill="rgba(56,189,248,0.95)"/>
          <text x="113" y="32" fill="#f472b6" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">O</text>
          <text x="36" y="156" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">A</text>
          <text x="102" y="195" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">B</text>
          <text x="180" y="148" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">C</text>
          <text x="115" y="170" fill="#38bdf8" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">M</text>
        `,
        caption: 'הפירמידה האורתוגונלית $OABC$: שלוש המקצועות $\\vec u,\\vec v,\\vec w$ ניצבות הדדית מ-$O$, ו-$M$ מרכז הכובד של הבסיס $ABC$ (רגל הגובה $OM$).',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הוכח כי $\\;t = s = k$.',
        answer_type: 'proof',
        hints: [
          '$\\vec{OH}$ מאונך לכל וקטור במישור הבסיס. בפרט: $\\vec{OH}\\cdot\\vec{AB} = 0$ וגם $\\vec{OH}\\cdot\\vec{AC} = 0$.',
          '$\\vec{AB} = \\vec v - \\vec u$, $\\;\\vec{AC} = \\vec w - \\vec u$. פתח את המכפלה הסקלרית והשתמש בכך ש-$\\vec u\\cdot\\vec v = \\vec v\\cdot\\vec w = \\vec u\\cdot\\vec w = 0$ ו-$\\vec u\\cdot\\vec u = \\vec v\\cdot\\vec v = \\vec w\\cdot\\vec w$.',
        ],
        solution: {
          steps: [
            'הזוויות בין כל זוג מקצועות הן $90°$, ולכן המכפלות הסקלריות מתאפסות: $\\;\\vec u\\cdot\\vec v = \\vec v\\cdot\\vec w = \\vec u\\cdot\\vec w = 0$',
            'מהשוויון $|\\vec u| = |\\vec v| = |\\vec w|$ נובע: $\\;\\vec u\\cdot\\vec u = \\vec v\\cdot\\vec v = \\vec w\\cdot\\vec w$',
            '$\\vec{OH}$ מאונך לבסיס, ולכן מאונך לכל וקטור בבסיס, ובפרט: $\\;\\vec{OH}\\cdot\\vec{AB} = 0$ וגם $\\vec{OH}\\cdot\\vec{AC} = 0$',
            '$\\vec{AB} = \\vec{OB} - \\vec{OA} = \\vec v - \\vec u$, $\\;\\vec{AC} = \\vec{OC} - \\vec{OA} = \\vec w - \\vec u$',
            'המשוואה הראשונה: $\\;(t\\vec u + s\\vec v + k\\vec w)\\cdot(\\vec v - \\vec u) = 0$',
            'נפתח את הסוגריים: $\\;t\\,\\vec u\\cdot\\vec v - t\\,\\vec u\\cdot\\vec u + s\\,\\vec v\\cdot\\vec v - s\\,\\vec v\\cdot\\vec u + k\\,\\vec w\\cdot\\vec v - k\\,\\vec w\\cdot\\vec u = 0$',
            'נציב את המכפלות המתאפסות ($\\vec u\\cdot\\vec v = \\vec v\\cdot\\vec u = \\vec w\\cdot\\vec v = \\vec w\\cdot\\vec u = 0$): $\\;-t\\,\\vec u\\cdot\\vec u + s\\,\\vec v\\cdot\\vec v = 0$',
            'ומכיוון ש-$\\vec u\\cdot\\vec u = \\vec v\\cdot\\vec v$: $\\;-t + s = 0 \\;\\Rightarrow\\; t = s$',
            'המשוואה השנייה: $\\;(t\\vec u + s\\vec v + k\\vec w)\\cdot(\\vec w - \\vec u) = 0$',
            'נפתח את הסוגריים: $\\;t\\,\\vec u\\cdot\\vec w - t\\,\\vec u\\cdot\\vec u + s\\,\\vec v\\cdot\\vec w - s\\,\\vec v\\cdot\\vec u + k\\,\\vec w\\cdot\\vec w - k\\,\\vec w\\cdot\\vec u = 0$',
            'נציב את המכפלות המתאפסות: $\\;-t\\,\\vec u\\cdot\\vec u + k\\,\\vec w\\cdot\\vec w = 0$',
            'ומכיוון ש-$\\vec u\\cdot\\vec u = \\vec w\\cdot\\vec w$: $\\;-t + k = 0 \\;\\Rightarrow\\; t = k$',
            'משתי התוצאות: $\\;t = s = k$',
          ],
          final_answer: 'הוכח: $\\;t = s = k$',
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
          '$\\vec{OM}$ נמצא בכיוון $(\\vec u + \\vec v + \\vec w)$, בדיוק כמו $\\vec{OH}$ מסעיף א ($t=s=k$). שניהם בכיוון של אותו וקטור, ו-$M$ על המישור, ולכן $OM$ הוא הגובה.',
        ],
        solution: {
          steps: [
            '$M$ נקודת מפגש התיכונים (מרכז הכובד), ו-$D$ הוא אמצע הצלע $BC$. במרכז הכובד מתקיים: $\\;\\vec{AM} = \\dfrac23\\vec{AD}$',
            '$\\vec{OM} = \\vec{OA} + \\vec{AM} = \\vec{OA} + \\dfrac23\\vec{AD} = \\vec{OA} + \\dfrac23\\left(\\vec{AB} + \\vec{BD}\\right)$',
            '$D$ אמצע $BC$, לכן $\\vec{BD} = \\dfrac12\\vec{BC}$: $\\;\\vec{OM} = \\vec{OA} + \\dfrac23\\left(\\vec{AB} + \\dfrac12\\vec{BC}\\right)$',
            'נציב $\\vec{BC} = \\vec{AC} - \\vec{AB}$: $\\;\\vec{OM} = \\vec{OA} + \\dfrac23\\left(\\vec{AB} + \\dfrac12(\\vec{AC} - \\vec{AB})\\right)$',
            'נעבור לווקטורי הבסיס: $\\;\\vec{OA} = \\vec u$, $\\;\\vec{AB} = \\vec v - \\vec u$, $\\;\\vec{AC} = \\vec w - \\vec u$',
            '$\\vec{OM} = \\vec u + \\dfrac23\\left[(\\vec v - \\vec u) + \\dfrac12\\left((\\vec w - \\vec u) - (\\vec v - \\vec u)\\right)\\right]$',
            'בתוך הסוגריים הפנימיים: $\\;(\\vec w - \\vec u) - (\\vec v - \\vec u) = \\vec w - \\vec v$',
            'לכן: $\\;(\\vec v - \\vec u) + \\dfrac12(\\vec w - \\vec v) = \\dfrac12\\vec v + \\dfrac12\\vec w - \\vec u$',
            '$\\vec{OM} = \\vec u + \\dfrac23\\left(\\dfrac12\\vec v + \\dfrac12\\vec w - \\vec u\\right) = \\vec u + \\dfrac13\\vec v + \\dfrac13\\vec w - \\dfrac23\\vec u$',
            '$\\vec{OM} = \\dfrac13\\vec u + \\dfrac13\\vec v + \\dfrac13\\vec w$',
            'נימוק שזהו הגובה: ל-$\\vec{OM}$ מקדמים שווים ($t = s = k = \\dfrac13$). באותו חישוב כמו בסעיף א: $\\;\\vec{OM}\\cdot\\vec{AB} = -\\dfrac13\\,\\vec u\\cdot\\vec u + \\dfrac13\\,\\vec v\\cdot\\vec v = 0$, וכן $\\vec{OM}\\cdot\\vec{AC} = 0$',
            'לכן $\\vec{OM}$ מאונך לשני וקטורים בלתי-תלויים בבסיס, ולכן מאונך לבסיס $ABC$. ומכיוון ש-$M$ נמצאת בתוך הבסיס, $OM$ הוא הגובה מ-$O$ לבסיס',
          ],
          final_answer: 'הוכח: $\\;\\vec{OM} = \\dfrac13(\\vec u + \\vec v + \\vec w)$. מקדמיו שווים (כמו בסעיף א), ולכן מאונך לבסיס, ו-$OM$ הוא הגובה',
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
          'נפח פירמידה $= \\dfrac13 S h$. אותו בסיס, ולכן יחס הנפחים שווה ליחס הגבהים. $P$ על הישר הניצב דרך $M$, ולכן המרחק מ-$P$ לבסיס הוא $|PM|$; התנאי "נפח כפול" נותן $|PM| = 2|OM|$.',
        ],
        solution: {
          steps: [
            '$P$ נמצאת על הישר $\\ell$ (הישר שעליו הגובה $OM$), והפירמידות $PABC$ ו-$OABC$ חולקות את אותו בסיס $ABC$',
            'נפח פירמידה $= \\dfrac13\\cdot S_{ABC}\\cdot h$. אותו בסיס, ולכן יחס הנפחים שווה ליחס הגבהים (המרחקים מהקודקוד לבסיס)',
            'מכיוון ש-$P$ על הישר הניצב לבסיס דרך $M$, רגל האנך מ-$P$ לבסיס היא $M$ עצמה, ולכן המרחק מ-$P$ לבסיס הוא $|PM|$ (וכן המרחק מ-$O$ הוא $|OM|$)',
            'התנאי נפח $PABC$ כפול מנפח $OABC$ נותן: $\\;|PM| = 2\\,|OM|$',
            'הנקודה $P$ על הישר $OM$, ושתי נקודות עליו מקיימות $|PM| = 2|OM|$:',
            'אפשרות 1 — $P$ בצד הנגדי ל-$M$ ביחס ל-$O$: $\\;\\vec{OP} = -\\vec{OM} = -\\dfrac13(\\vec u + \\vec v + \\vec w)$',
            'אפשרות 2 — $P$ מעבר ל-$M$ (אותו צד): $\\;\\vec{OP} = 3\\,\\vec{OM} = 3\\cdot\\dfrac13(\\vec u + \\vec v + \\vec w) = \\vec u + \\vec v + \\vec w$',
          ],
          final_answer:
            '$\\vec{OP} = -\\dfrac13(\\vec u + \\vec v + \\vec w)\\;$ או $\\;\\vec{OP} = \\vec u + \\vec v + \\vec w$',
        },
      },
      {
        label: 'ד',
        prompt: [
          'ממקמים את הפירמידה במערכת צירים: $O$ בראשית, $A$ על החלק החיובי של ציר $x$, $B$ על החלק החיובי של ציר $y$, ו-$C$ על החלק החיובי של ציר $z$. נתון $\\;|\\vec u| = a$.',
          'מצא את ההצגה הפרמטרית של הישר $\\ell$ שעליו נמצא הקטע $OP$.',
        ].join('\n'),
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 220 200',
            svg: `
              <line x1="95" y1="122" x2="110" y2="22" stroke="rgba(148,163,184,0.5)" stroke-width="1"/>
              <polygon points="110,22 106,32 113,31" fill="rgba(148,163,184,0.75)"/>
              <line x1="95" y1="122" x2="208" y2="150" stroke="rgba(148,163,184,0.5)" stroke-width="1"/>
              <polygon points="208,150 199,146 200,153" fill="rgba(148,163,184,0.75)"/>
              <line x1="95" y1="122" x2="16" y2="172" stroke="rgba(148,163,184,0.5)" stroke-width="1"/>
              <polygon points="16,172 25,170 23,177" fill="rgba(148,163,184,0.75)"/>
              <text x="114" y="24" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">z</text>
              <text x="210" y="153" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">y</text>
              <text x="8" y="181" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">x</text>
              <polygon points="33,161 183,144 107,44" fill="rgba(56,189,248,0.07)" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
              <line x1="95" y1="122" x2="33" y2="161" stroke="rgba(226,232,240,0.85)" stroke-width="1.3"/>
              <line x1="95" y1="122" x2="183" y2="144" stroke="rgba(226,232,240,0.85)" stroke-width="1.3"/>
              <line x1="95" y1="122" x2="107" y2="44" stroke="rgba(226,232,240,0.85)" stroke-width="1.3"/>
              <circle cx="95" cy="122" r="2.8" fill="rgba(244,114,182,0.95)"/>
              <circle cx="33" cy="161" r="2.6" fill="rgba(226,232,240,0.95)"/>
              <circle cx="183" cy="144" r="2.6" fill="rgba(226,232,240,0.95)"/>
              <circle cx="107" cy="44" r="2.6" fill="rgba(226,232,240,0.95)"/>
              <text x="80" y="130" fill="#f472b6" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">O</text>
              <text x="20" y="170" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">A</text>
              <text x="188" y="145" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">B</text>
              <text x="110" y="41" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">C</text>
              <text x="54" y="145" fill="#fcd34d" font-size="10" font-family="Heebo, sans-serif">a</text>
              <text x="138" y="128" fill="#fcd34d" font-size="10" font-family="Heebo, sans-serif">a</text>
              <text x="84" y="86" fill="#fcd34d" font-size="10" font-family="Heebo, sans-serif">a</text>
            `,
            caption: 'מערכת הצירים לסעיפים ד–ה: $O$ בראשית, $A(a,0,0)$ על ציר $x$, $B(0,a,0)$ על ציר $y$, $C(0,0,a)$ על ציר $z$. שלוש המקצועות באורך $a$, והישר $\\ell$ בכיוון $(1,1,1)$.',
          },
        ],
        answer_type: 'expression',
        hints: [
          'במערכת הצירים: $A = (a,\\,0,\\,0)$, $B = (0,\\,a,\\,0)$, $C = (0,\\,0,\\,a)$, ולכן $\\vec u + \\vec v + \\vec w = (a,\\,a,\\,a)$.',
          'הישר עובר דרך $O$ בכיוון $(1,\\,1,\\,1)$ (שווה ערך לכיוון $(a,a,a)$).',
        ],
        solution: {
          steps: [
            '$A(a,0,0)$, $B(0,a,0)$, $C(0,0,a)$, אז $\\vec u=(a,0,0)$, $\\vec v=(0,a,0)$, $\\vec w=(0,0,a)$',
            '$\\ell$ דרך $O$ בכיוון $\\vec{OM} = \\dfrac13(\\vec u+\\vec v+\\vec w) = \\left(\\dfrac a3,\\dfrac a3,\\dfrac a3\\right)$',
            '$X = t\\left(\\dfrac a3,\\dfrac a3,\\dfrac a3\\right)$, או באופן שקול $X = t(1,1,1)$',
          ],
          final_answer: 'הצגה פרמטרית: $\\;(x,y,z) = t(1,1,1)$',
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
            'הנורמל למישור הוא כיוון $\\vec{OM}$: $\\;(1,1,1)$',
            'משוואת מישור: $\\;x + y + z + d = 0$',
            'עובר דרך $A(a,0,0)$: $\\;a + 0 + 0 + d = 0 \\Rightarrow d = -a$',
            '$x + y + z - a = 0$',
          ],
          final_answer: 'משוואת המישור: $\\;x + y + z - a = 0$',
        },
      },
      {
        label: 'ו',
        prompt: 'נתון כי נפח הפירמידה $OABC$ הוא $\\;57\\tfrac{1}{6}$. חשב את $a$.',
        answer_type: 'number',
        hints: [
          'בחר את המשולש $AOB$ כבסיס ואת $OC$ כגובה: $OC$ מאונך ל-$OA$ ול-$OB$ (הזוויות $90°$), ולכן הוא מאונך למישור $AOB$.',
          'המשולש $AOB$ ישר-זווית ב-$O$ עם ניצבים $OA = OB = a$. נוסחת נפח פירמידה — שטח הבסיס כפול הגובה, חלקי $3$: $\\;V = \\dfrac{S\\cdot h}{3}$.',
        ],
        solution: {
          steps: [
            'נבחר את המשולש $AOB$ כבסיס הפירמידה, ואת $OC$ כגובה אליו — שכן $OC$ מאונך ל-$OA$ ול-$OB$ (הזוויות $\\angle BOC = \\angle COA = 90°$), ולכן $OC$ מאונך למישור $AOB$',
            'המשולש $AOB$ ישר-זווית ב-$O$, עם ניצבים $OA = OB = a$, ולכן שטחו: $\\;S_{AOB} = \\dfrac{a\\cdot a}{2} = \\dfrac{a^2}{2}$',
            'הגובה לבסיס: $\\;OC = a$',
            'נפח הפירמידה: $\\;V = \\dfrac{S_{AOB}\\cdot OC}{3} = \\dfrac{\\frac{a^2}{2}\\cdot a}{3} = \\dfrac{a^3}{6}$',
            'נשווה לנתון: $\\;\\dfrac{a^3}{6} = 57\\tfrac{1}{6} = \\dfrac{343}{6}$',
            '$a^3 = 343 \\;\\Rightarrow\\; a = 7$',
          ],
          final_answer: '$a = 7$',
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
            'נכתוב את $z$ ואת הצמוד שלו בצורה קוטבית: $\\;z = R\\,\\text{cis}\\,\\alpha$, $\\;\\bar z = R\\,\\text{cis}(-\\alpha)$.',
            'חילוק בצורה קוטבית — מחסירים את הזוויות: $\\;\\dfrac{z}{\\bar z} = \\dfrac{R\\,\\text{cis}\\,\\alpha}{R\\,\\text{cis}(-\\alpha)} = \\text{cis}\\bigl(\\alpha-(-\\alpha)\\bigr) = \\text{cis}(2\\alpha)$.',
            'הצד הימני בצורה קוטבית: $\\;-\\tfrac{1}{2}+\\tfrac{\\sqrt 3}{2}i = \\text{cis}(120°)$.',
            'משווים: $\\;\\text{cis}(2\\alpha) = \\text{cis}(120°) \\Rightarrow 2\\alpha = 120° + 360°k$.',
            'מחלקים ב-$2$: $\\;\\alpha = 60° + 180°k$.',
            'הערכים האפשריים: $\\alpha = 60°$ (רביע ראשון) או $\\alpha = 240°$ (רביע שלישי).',
            'נתון ש-$z$ ברביע השלישי ($180°<\\alpha<270°$), ולכן $\\;\\alpha = 240°$.',
          ],
          final_answer: '$\\alpha = 240°$.',
        },
      },
      {
        label: 'ב',
        prompt: 'נתון: $\\;\\bigl|4iz\\bigr| - \\Bigl|\\dfrac{\\bar z}{i}\\Bigr| - \\Bigl|\\dfrac{z}{\\bar z}\\Bigr| = 8$. מצא את $R$.',
        answer_type: 'number',
        hints: [
          'מודולוס של מכפלה/מנה: $\\;|4iz| = 4|i|\\,|z| = 4R$, $\\;\\left|\\dfrac{\\bar z}{i}\\right| = \\dfrac{R}{1} = R$.',
          '$\\left|\\dfrac{z}{\\bar z}\\right| = \\dfrac{R}{R} = 1$. הצב במשוואה ופתור עבור $R$.',
        ],
        solution: {
          steps: [
            'נציב בצורה קוטבית: $\\;z = R\\,\\text{cis}\\,240°$, $\\;\\bar z = R\\,\\text{cis}(-240°)$, $\\;4i = 4\\,\\text{cis}\\,90°$, $\\;i = \\text{cis}\\,90°$.',
            'נחשב כל גורם בנפרד (מחברים/מחסירים זוויות): $\\;4iz = 4\\,\\text{cis}\\,90°\\cdot R\\,\\text{cis}\\,240° = 4R\\,\\text{cis}\\,330°$.',
            '$\\dfrac{\\bar z}{i} = \\dfrac{R\\,\\text{cis}(-240°)}{\\text{cis}\\,90°} = R\\,\\text{cis}(-330°)$.',
            '$\\dfrac{z}{\\bar z} = \\dfrac{R\\,\\text{cis}\\,240°}{R\\,\\text{cis}(-240°)} = \\text{cis}\\,480°$.',
            'המודולוס של כל מספר הוא הרדיוס החיובי: $\\;|4R\\,\\text{cis}\\,330°| = 4R$, $\\;|R\\,\\text{cis}(-330°)| = R$, $\\;|\\text{cis}\\,480°| = 1$.',
            'נציב במשוואה הנתונה: $\\;4R - R - 1 = 8$.',
            '$3R = 9 \\;\\Rightarrow\\; R = 3$.',
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
            'נציב $z = 3\\,\\text{cis}\\,240°$: $\\;z^3 = 3^3\\,\\text{cis}(3\\cdot 240°) = 27\\,\\text{cis}\\,720°$.',
            'ומכיוון ש-$720° = 2\\cdot 360°$: $\\;z^3 = 27\\,\\text{cis}\\,0°$.',
            'אגף ימין: $\\;\\dfrac{z^3}{27} = \\dfrac{27\\,\\text{cis}\\,0°}{27} = \\text{cis}\\,0°$, אז המשוואה היא $\\;w^9 = \\text{cis}\\,0°$.',
            'נפתור בהוצאת שורש מסדר $9$: $\\;w_k = \\sqrt[9]{1}\\,\\text{cis}\\dfrac{0° + 360°k}{9} = \\text{cis}(40°k)$, $\\;k = 0,1,\\dots,8$.',
            'תשעת הפתרונות: $\\;\\text{cis}\\,0°,\\ \\text{cis}\\,40°,\\ \\text{cis}\\,80°,\\ \\text{cis}\\,120°,\\ \\text{cis}\\,160°,\\ \\text{cis}\\,200°,\\ \\text{cis}\\,240°,\\ \\text{cis}\\,280°,\\ \\text{cis}\\,320°$.',
            'מסעיף א: $\\;\\dfrac{z}{\\bar z} = \\text{cis}\\,120°$.',
            '$\\text{cis}\\,120°$ הוא בדיוק הפתרון $w_3$ (עבור $k=3$), ולכן $\\dfrac{z}{\\bar z}$ הוא אחד מפתרונות המשוואה. ⬛',
          ],
          final_answer: 'הוכח: $\\dfrac{z}{\\bar z} = \\text{cis}\\,120° = w_3$ — אחד מ-$9$ הפתרונות של $w^9 = \\text{cis}\\,0°$.',
        },
      },
      {
        label: 'ד1',
        prompt: [
          'המשולש $ABC$ הוא משולש שווה-שוקיים. קודקודי הבסיס $B$ ו-$C$ מתאימים למספרים $\\;\\dfrac{\\bar z}{z}\\;$ ו-$\\;\\dfrac{z}{\\bar z}$.',
          'קודקוד הראש $A$ מתאים למספר $z + k$, כאשר $k$ הוא מספר מדומה טהור. מהו הערך של $k$?',
        ].join('\n'),
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="176" y="96" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">Im</text>
              <polygon points="25,100 75,143.3 75,56.7" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.6"/>
              <line x1="25" y1="100" x2="75" y2="100" stroke="rgba(251,191,36,0.7)" stroke-width="1" stroke-dasharray="3 3"/>
              <rect x="69" y="94" width="6" height="6" fill="none" stroke="rgba(251,191,36,0.85)" stroke-width="1"/>
              <circle cx="25" cy="100" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="75" cy="143.3" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="75" cy="56.7" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="100" cy="100" r="2.4" fill="rgba(148,163,184,0.9)"/>
              <text x="13" y="96" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">A</text>
              <text x="62" y="158" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">B</text>
              <text x="62" y="52" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">C</text>
              <text x="103" y="113" fill="#94a3b8" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">O</text>
            `,
            caption: 'המשולש שווה-השוקיים $ABC$: הבסיס $BC$ אנכי (על הישר $x=-\\tfrac12$, סימטרי לציר הממשי), והראש $A(-\\tfrac32,0)$ על ציר ה-$x$ — האנך האמצעי ל-$BC$. מכאן $\\text{Im}(A)=0$.',
          },
        ],
        answer_type: 'expression',
        hints: [
          '$\\bar z/z = \\text{cis}(-120°)$, $\\;z/\\bar z = \\text{cis}(120°)$ — שתי נקודות סימטריות ביחס לציר הממשי, על מעגל היחידה. הקטע $BC$ אנכי, דרך $x = -\\tfrac{1}{2}$.',
          'במשולש שווה-שוקיים $A$ על האנך האמצעי ל-$BC$. כאן זה ציר ה-$x$ (הממשי), ולכן $\\text{Im}(A) = 0$.',
          'נסמן $k = t\\,i$ והצב $A = z + t\\,i = -\\tfrac{3}{2} - \\tfrac{3\\sqrt 3}{2}i + t\\,i$, ואז השווה את החלק המדומה לאפס.',
        ],
        solution: {
          steps: [
            'נחשב את $B$ ו-$C$ (עם $z = 3\\,\\text{cis}\\,240°$, $\\bar z = 3\\,\\text{cis}(-240°)$):',
            '$B = \\dfrac{\\bar z}{z} = \\dfrac{3\\,\\text{cis}(-240°)}{3\\,\\text{cis}\\,240°} = \\text{cis}(-480°) = \\text{cis}(-120°) = -\\tfrac{1}{2} - \\tfrac{\\sqrt 3}{2}i \\;\\Rightarrow\\; B\\bigl(-\\tfrac{1}{2},\\,-\\tfrac{\\sqrt 3}{2}\\bigr)$.',
            '$C = \\dfrac{z}{\\bar z} = \\dfrac{3\\,\\text{cis}\\,240°}{3\\,\\text{cis}(-240°)} = \\text{cis}\\,480° = \\text{cis}\\,120° = -\\tfrac{1}{2} + \\tfrac{\\sqrt 3}{2}i \\;\\Rightarrow\\; C\\bigl(-\\tfrac{1}{2},\\,\\tfrac{\\sqrt 3}{2}\\bigr)$.',
            'הבסיס $BC$ אנכי (לשני הקודקודים אותה אבסיסה $-\\tfrac12$) וסימטרי ביחס לציר ה-$x$. האנך האמצעי ל-$BC$ הוא ציר ה-$x$ (הישר $y=0$).',
            'במשולש שווה-שוקיים הראש $A$ נמצא על האנך האמצעי לבסיס, ולכן $\\text{Im}(A) = 0$.',
            '$z = 3\\,\\text{cis}\\,240° = -\\tfrac{3}{2} - \\tfrac{3\\sqrt 3}{2}i$. נסמן $k = t\\,i$: $\\;A = z + t\\,i = -\\tfrac{3}{2} + \\Bigl(t - \\tfrac{3\\sqrt 3}{2}\\Bigr)i$.',
            '$\\text{Im}(A) = 0$',
            '$t - \\tfrac{3\\sqrt 3}{2} = 0$',
            '$t = \\tfrac{3\\sqrt 3}{2}$.',
            'לכן $\\;k = \\tfrac{3\\sqrt 3}{2}\\,i$.',
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
              <text x="60" y="52" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">C</text>
              <text x="104" y="96" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">O</text>
              <text x="60" y="156" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">B</text>
            `,
            caption: 'מרובע $ABOC$ — דלתון סימטרי ביחס לציר הממשי. אלכסונים $AO$ (אופקי) ו-$BC$ (אנכי) מאונכים זה לזה.',
          },
        ],
        hints: [
          'הקואורדינטות: $A=(-\\tfrac{3}{2},\\,0)$, $B=(-\\tfrac{1}{2},\\,-\\tfrac{\\sqrt 3}{2})$, $O=(0,0)$, $C=(-\\tfrac{1}{2},\\,\\tfrac{\\sqrt 3}{2})$.',
          'המרובע סימטרי ביחס לציר הממשי (דלתון). האלכסונים $AO$ ו-$BC$ מאונכים. שטח דלתון = $\\tfrac{1}{2}\\cdot d_1\\cdot d_2$.',
        ],
        solution: {
          steps: [
            'קואורדינטות (מסעיף ד1): $\\;A(-\\tfrac{3}{2},0)$, $B(-\\tfrac{1}{2},-\\tfrac{\\sqrt 3}{2})$, $O(0,0)$, $C(-\\tfrac{1}{2},\\tfrac{\\sqrt 3}{2})$.',
            'אלכסון $AO$ אופקי (שני קודקודיו על ציר $x$), אורך: $|AO| = \\tfrac{3}{2}$.',
            'אלכסון $BC$ אנכי (שניהם בעלי אבסיסה $-\\tfrac{1}{2}$), אורך: $|BC| = \\sqrt 3$.',
            'האלכסונים מאונכים, ולכן המרובע דלתון. שטח: $\\;S = \\tfrac{1}{2}\\cdot|AO|\\cdot|BC| = \\tfrac{1}{2}\\cdot\\tfrac{3}{2}\\cdot\\sqrt 3 = \\tfrac{3\\sqrt 3}{4}$.',
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
        hints: ['$x^2 \\ge 0$ לכל $x$, ו-$e^{a-x^3} > 0$ תמיד (כל חזקה של $e$ חיובית). אז $f(x) = 0$ רק כאשר $x^2 = 0$.'],
        solution: {
          steps: [
            'נדרוש $f(x) > 0$, כלומר $\\;x^2\\,e^{a-x^3} > 0$.',
            'הגורם $e^{a-x^3} > 0$ לכל $x$ (כל חזקה של $e$ חיובית), ולכן הסימן של $f$ נקבע על-ידי $x^2$ בלבד.',
            '$x^2 > 0$ לכל $x \\ne 0$, ו-$x^2 = 0$ רק ב-$x = 0$. לכן $f(x) > 0$ לכל $x \\ne 0$, ו-$f(0) = 0$.',
          ],
          final_answer: 'תחום החיוביות: $\\;x \\ne 0$ (כלומר $x \\in \\mathbb{R}\\setminus\\{0\\}$).',
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
            'נגזור עם כלל המכפלה ($u = x^2$, $\\;v = e^{a-x^3}$, $\\;v\\,\' = e^{a-x^3}\\cdot(-3x^2)$): $\\;f\\,\'(x) = 2x\\,e^{a-x^3} + x^2\\,e^{a-x^3}\\cdot(-3x^2)$.',
            'נוציא גורם משותף $x\\,e^{a-x^3}$: $\\;f\\,\'(x) = x\\,e^{a-x^3}\\,(2 - 3x^3)$.',
            'נשווה לאפס: $\\;x\\,e^{a-x^3}\\,(2 - 3x^3) = 0$. מכיוון ש-$e^{a-x^3} \\ne 0$ אף פעם, נקבל $x = 0$ או $2 - 3x^3 = 0$.',
            '$2 - 3x^3 = 0$',
            '$x^3 = \\dfrac{2}{3}$',
            '$x = \\sqrt[3]{\\tfrac{2}{3}} \\approx 0.873$.',
            'טבלת סימנים (האקספוננט תמיד חיובי, אז הסימן נקבע ע"י $x$ ו-$(2-3x^3)$):',
            '$\\begin{array}{c|c|c|c|c|c} x & x<0 & 0 & 0<x<\\sqrt[3]{2/3} & \\sqrt[3]{2/3} & x>\\sqrt[3]{2/3} \\\\ \\hline f\\,\'(x) & - & 0 & + & 0 & - \\\\ f(x) & \\searrow & & \\nearrow & & \\searrow \\end{array}$',
            'ב-$x = 0$ הנגזרת עוברת מ-$-$ ל-$+$ — נקודת מינימום.',
            'ב-$x = \\sqrt[3]{2/3}$ הנגזרת עוברת מ-$+$ ל-$-$ — נקודת מקסימום.',
          ],
          final_answer:
            'מינימום ב-$x = 0$ (ערך $f(0)=0$), ומקסימום ב-$x = \\sqrt[3]{\\tfrac{2}{3}}$ (ערך $\\;\\sqrt[3]{\\tfrac{4}{9}}\\cdot e^{a-2/3}$).',
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
            'בין שני אפסי $f\\,\'$ ($x=0$ ו-$x=\\sqrt[3]{2/3}$) הנגזרת חיובית, ולכן השטח הכלוא הוא $\\;\\displaystyle\\int_0^{\\sqrt[3]{2/3}} f\\,\'(x)\\,dx$.',
            'לפי המשפט היסודי של החדו"א: $\\;\\displaystyle\\int_0^{\\sqrt[3]{2/3}} f\\,\'(x)\\,dx = \\Bigl[\\,f(x)\\,\\Bigr]_0^{\\sqrt[3]{2/3}} = f\\bigl(\\sqrt[3]{2/3}\\bigr) - f(0)$.',
            'נחשב: $\\;f\\bigl(\\sqrt[3]{2/3}\\bigr) = \\bigl(\\sqrt[3]{2/3}\\bigr)^2 e^{\\,a-\\left(\\sqrt[3]{2/3}\\right)^3} = \\sqrt[3]{\\tfrac{4}{9}}\\cdot e^{a - 2/3}$ (כי $\\bigl(\\sqrt[3]{2/3}\\bigr)^3 = \\tfrac{2}{3}$), ו-$f(0) = 0$.',
            'אז השטח $= \\sqrt[3]{\\tfrac{4}{9}}\\cdot e^{a-2/3}$. נשווה לנתון: $\\;\\sqrt[3]{\\tfrac{4}{9}}\\cdot e^{a-2/3} = \\sqrt[3]{\\tfrac{4e}{9}} = \\sqrt[3]{\\tfrac{4}{9}}\\cdot e^{1/3}$.',
            'נצמצם ב-$\\sqrt[3]{4/9}$: $\\;e^{a - 2/3} = e^{1/3}$',
            '$a - \\tfrac{2}{3} = \\tfrac{1}{3}$',
            '$a = 1$.',
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
            caption: 'גרף $f(x)=x^2 e^{1-x^3}$ ($a=1$): מינימום $(0,0)$, מקסימום ב-$\\sqrt[3]{2/3}\\approx 0.87$ עם ערך $\\sqrt[3]{4e/9}\\approx 1.065$.',
          },
        ],
        hints: ['השתמש בכל מה שחושב: מינימום $(0,0)$, מקסימום, אסימפטוטה ב-$+\\infty$ ($f\\to 0^+$), והתנהגות ב-$-\\infty$ ($f\\to+\\infty$).'],
        solution: {
          steps: [
            'הצבת $a=1$: $\\;f(x) = x^2 e^{1-x^3}$. מסעיף א2: מינימום $(0,0)$ ומקסימום ב-$\\sqrt[3]{2/3}$ בערך $\\sqrt[3]{4e/9}\\approx 1.065$.',
            'התנהגות ב-$+\\infty$: $\\;\\lim\\limits_{x\\to+\\infty} x^2 e^{1-x^3} = \\infty\\cdot e^{-\\infty} = \\dfrac{\\infty}{e^{\\infty}} = 0^+$ (האקספוננט שואף ל-$0$ מהר יותר), אז $y=0$ אסימפטוטה אופקית מימין.',
            'התנהגות ב-$-\\infty$: $\\;\\lim\\limits_{x\\to-\\infty} x^2 e^{1-x^3} = \\infty\\cdot e^{+\\infty} = +\\infty$.',
            'הגרף: יורד מ-$+\\infty$ (משמאל), עובר דרך $(0,0)$ (מינימום, משיק אופקי), עולה למקסימום ב-$(\\sqrt[3]{2/3},\\,\\sqrt[3]{4e/9})$, ויורד ושואף ל-$0^+$ מימין.',
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
  // Q5 — חקירת פונקציות מופשטות + $f(x) = 6x/(1+x^2)$
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
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 240 200',
            svg: `
              <line x1="20" y1="100" x2="226" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="120" y1="18" x2="120" y2="188" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="219" y="96" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="124" y="26" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <path d="M 30,103 C 55,104 80,145 90,145 C 100,145 108,112 120,100 C 132,88 140,55 150,55 C 160,55 185,96 210,97" fill="none" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <circle cx="90" cy="145" r="2.8" fill="rgba(56,189,248,0.95)"/>
              <circle cx="150" cy="55" r="2.8" fill="rgba(56,189,248,0.95)"/>
              <circle cx="120" cy="100" r="2.4" fill="rgba(226,232,240,0.9)"/>
              <text x="46" y="161" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">(-1,-a)</text>
              <text x="154" y="50" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">(1, a)</text>
            `,
            caption: 'סקיצה אפשרית של $f$: פונקציה אי-זוגית (סימטרית ביחס לראשית), מינימום $(-1,-a)$, מקסימום $(1,a)$, חיתוך ב-$(0,0)$, ואסימפטוטה אופקית $y=0$ בשני הקצוות.',
          },
        ],
        hints: [
          'אי-זוגית פירושה $f(-x)=-f(x)$, ולכן הגרף סימטרי ביחס לראשית. אם יש מינימום ב-$(-1,-a)$, אז יש מקסימום ב-$(1,a)$.',
          '$y=0$ אסימפטוטה אופקית, ולכן $f(x)\\to 0$ כאשר $x\\to\\pm\\infty$. מאי-זוגיות, $f(0)=0$.',
        ],
        solution: {
          steps: [
            'מאי-זוגיות נובע $f(0)=0$, ויש מקסימום ב-$(1,a)$ (סימטרי למינימום ב-$(-1,-a)$).',
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
          'אסימפטוטה אנכית: היכן ש-$f \\to 0^+$ מתקיים $h \\to -\\infty$. בקצוות התחום: $x \\to 0^+$ ($f \\to 0^+$) ו-$x \\to +\\infty$ ($f \\to 0^+$).',
          'אסימפטוטה אופקית: $h$ הולך ל-$-\\infty$ בקצה $+\\infty$, ולכן אין אופקית.',
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
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 240 200',
            svg: `
              <line x1="20" y1="110" x2="226" y2="110" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="40" y1="18" x2="40" y2="192" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="219" y="106" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="44" y="26" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">h</text>
              <path d="M 46,186 C 55,135 66,65 75,65 C 88,65 102,112 112,122 C 140,152 170,179 196,184" fill="none" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <circle cx="75" cy="65" r="2.8" fill="rgba(56,189,248,0.95)"/>
              <circle cx="60" cy="110" r="2.4" fill="rgba(251,191,36,0.95)"/>
              <circle cx="104" cy="110" r="2.4" fill="rgba(251,191,36,0.95)"/>
              <text x="80" y="60" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">(1, ln a)</text>
            `,
            caption: 'סקיצה של $h(x)=\\ln(f(x))$ כאשר $a>1$: מוגדרת ב-$(0,\\infty)$, אסימפטוטה אנכית $x=0$, מקסימום $(1,\\ln a)$ מעל ציר $x$, ושתי נקודות חיתוך עם ציר $x$ (הגרף יורד ל-$-\\infty$ בשני הקצוות).',
          },
        ],
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
          'נתון: $\\;f(x) = \\dfrac{6x}{1 + x^2}$ (פונקציה ספציפית המקיימת את כל התכונות של סעיף א).',
          'הפונקציה $g(x)$ היא הפונקציה המקיימת $\\;g\\,\'(x) = f(x)$ וגם $g(0) = 0$. מצא את $g(x)$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'זהה שהמונה הוא (עד כדי מקדם) נגזרת המכנה: $\\;\\dfrac{6x}{1+x^2} = 3\\cdot\\dfrac{2x}{1+x^2}$, ו-$(1+x^2)\\,\' = 2x$. (אפשר גם בהצבה $u = 1+x^2$.)',
          'תנאי $g(0) = 0$ קובע את קבוע האינטגרציה $C$.',
        ],
        solution: {
          steps: [
            'נשים לב שהמונה הוא, עד כדי מקדם, נגזרת המכנה: $\\;\\dfrac{6x}{1+x^2} = 3\\cdot\\dfrac{2x}{1+x^2}$, ו-$(1+x^2)\\,\' = 2x$.',
            '$\\;g(x) = \\displaystyle\\int \\dfrac{6x}{1+x^2}\\,dx = 3\\int \\dfrac{2x}{1+x^2}\\,dx = 3\\ln(1+x^2) + C$.',
            '(המכנה $1+x^2 > 0$ לכל $x$, ולכן אין צורך בערך מוחלט בתוך ה-$\\ln$.)',
            'נציב את התנאי $g(0)=0$: $\\;3\\ln(1+0^2) + C = 3\\ln 1 + C = C = 0$.',
          ],
          final_answer: '$g(x) = 3\\ln(1 + x^2)$.',
        },
      },
      {
        label: 'ג2',
        prompt: 'האם הפונקציה $g(x)$ זוגית, אי-זוגית, או לא זוגית ולא אי-זוגית? נמק.',
        answer_type: 'text',
        hints: ['הצב $-x$ במקום $x$ ב-$g$.'],
        solution: {
          steps: [
            '$g(-x) = 3\\ln(1 + (-x)^2) = 3\\ln(1 + x^2) = g(x)$.',
            'מתקיים לכל $x$, ולכן $g$ זוגית. (אינטואיציה: $g$ קדומה של פונקציה אי-זוגית $f$, ולכן $g$ זוגית.)',
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
          'מהזוגיות של $g$: $\\;\\displaystyle\\int_{-5}^{0} g\\,dx = \\int_{0}^{5} g\\,dx$, ולכן $\\displaystyle\\int_{-5}^{0} g\\,dx = \\tfrac12\\int_{-5}^{5} g\\,dx$.',
          'המשוואה הנתונה אומרת $\\displaystyle\\int_{-5}^{t} g = \\tfrac12\\int_{-5}^{5} g$. השווה לאינטגרל מ-$-5$ עד $0$.',
        ],
        solution: {
          steps: [
            'מסעיף ג2 הפונקציה $g$ זוגית, ולכן השטח סימטרי ביחס לציר $y$: $\\;\\displaystyle\\int_{-5}^{0} g(x)\\,dx = \\int_{0}^{5} g(x)\\,dx$.',
            'מכאן $\\;\\displaystyle\\int_{-5}^{5} g(x)\\,dx = \\int_{-5}^{0} g + \\int_{0}^{5} g = 2\\int_{-5}^{0} g(x)\\,dx$, כלומר $\\displaystyle\\int_{-5}^{0} g(x)\\,dx = \\tfrac12\\int_{-5}^{5} g(x)\\,dx$.',
            'המשוואה הנתונה: $\\;2\\displaystyle\\int_{-5}^{t} g(x)\\,dx = \\int_{-5}^{5} g(x)\\,dx$, כלומר $\\displaystyle\\int_{-5}^{t} g(x)\\,dx = \\tfrac12\\int_{-5}^{5} g(x)\\,dx$.',
            'משני אלה: $\\;\\displaystyle\\int_{-5}^{t} g(x)\\,dx = \\int_{-5}^{0} g(x)\\,dx \\Rightarrow t = 0$.',
            'יחידות: $g(x) = 3\\ln(1+x^2) \\ge 0$ (ושוויון רק ב-$x=0$), ולכן $\\displaystyle\\int_{-5}^{t} g\\,dx$ עולה ממש כפונקציה של $t$ — אז $t=0$ הוא הפתרון היחיד. בדיקה: $t = 0 > -5$ ✓.',
          ],
          final_answer: '$t = 0$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
