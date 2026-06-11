/**
 * שאלון 582 — קיץ תשפ"ג (2023), מועד מיוחד
 * ==========================================
 *
 * המקור של השאלות: meyda.education.gov.il (משרד החינוך — נחלת הכלל).
 * הפתרונות נכתבו על-ידינו בסגנון האפליקציה; השיטה המתמטית עצמה כללית.
 * פורמט: שורות מתמטיות נקיות (לפי בקשת המשתמש), כל סרטוט מצויר פיזית.
 *
 * תוכן השאלון (נבנה בהדרגה):
 *   Q1 — גאומטריה אנליטית (חוצי זווית, מעגל משיק, פרבולה $y^2=16x$).
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2023Summer582Special: PastBagrutQuestion[] = [
  {
    id: 'b2023s582sp-q1',
    year: 2023,
    season: 'summer',
    moed: 'special',
    paper: '582',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    totalPoints: 25,
    context: [
      '(קיץ תשפ"ג, מועד מיוחד) נתונים הישרים:',
      '$\\;\\ell_1:\\; 4y - 3x - 20 = 0$',
      '$\\;\\ell_2:\\; x = -4$',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 240 210',
        svg: `
          <line x1="10" y1="190" x2="232" y2="190" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <line x1="80" y1="14" x2="80" y2="202" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <text x="224" y="186" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
          <text x="85" y="22" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
          <line x1="48" y1="14" x2="48" y2="202" stroke="rgba(251,191,36,0.8)" stroke-width="1.4" stroke-dasharray="4 3"/>
          <text x="24" y="30" fill="rgba(251,191,36,0.95)" font-size="10" font-family="Heebo, sans-serif">ℓ₂: x=-4</text>
          <line x1="28" y1="189" x2="170" y2="83" stroke="rgba(96,165,250,0.9)" stroke-width="1.8"/>
          <text x="150" y="76" fill="#bfdbfe" font-size="11" font-family="Heebo, sans-serif">ℓ₁</text>
          <circle cx="88" cy="94" r="40" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.9)" stroke-width="1.6"/>
          <circle cx="88" cy="94" r="2.6" fill="rgba(244,114,182,0.95)"/>
          <text x="71" y="92" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">M</text>
          <circle cx="112" cy="126" r="2.8" fill="#4ade80"/>
          <text x="116" y="132" fill="#4ade80" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">A</text>
        `,
        caption: 'המעגל שמרכזו $M$ משיק לישר $\\ell_1$ בנקודה $A$ ולישר $\\ell_2$; מרכז $M$ ברביע הראשון.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt:
          'מצא את המשוואות המתארות את המקום הגאומטרי של כל הנקודות הנמצאות במרחקים שווים מן הישרים $\\ell_1$ ו-$\\ell_2$.',
        answer_type: 'expression',
        hints: [
          'מקום הנקודות במרחק שווה משני ישרים = חוצי הזווית ביניהם (שניים, מאונכים זה לזה).',
          'מרחק נקודה לישר: $\\dfrac{|Ax+By+C|}{\\sqrt{A^2+B^2}}$. ל-$\\ell_2$ ($x=-4$) המרחק הוא $|x+4|$.',
        ],
        solution: {
          steps: [
            'מרחק מ-$(x,y)$ אל $\\ell_1$: $\\;\\dfrac{|-3x+4y-20|}{\\sqrt{(-3)^2+4^2}} = \\dfrac{|-3x+4y-20|}{5}$',
            'מרחק מ-$(x,y)$ אל $\\ell_2$ ($x=-4$): $\\;|x+4|$',
            'משווים: $\\;|x+4| = \\dfrac{|-3x+4y-20|}{5}$',
            'מקרה 1: $\\;5(x+4) = -3x+4y-20 \\;\\Rightarrow\\; 4y = 8x+40 \\;\\Rightarrow\\; y = 2x+10$',
            'מקרה 2: $\\;-5(x+4) = -3x+4y-20 \\;\\Rightarrow\\; 4y = -2x \\;\\Rightarrow\\; y = -\\tfrac{1}{2}x$',
          ],
          final_answer: 'שני חוצי הזווית (מאונכים): $\\;y = 2x+10$ ו-$y = -\\tfrac{1}{2}x$.',
        },
      },
      {
        label: 'ב',
        prompt: [
          'מעגל שמרכזו $M$ משיק לישרים $\\ell_1$ ו-$\\ell_2$. המעגל משיק לישר $\\ell_1$ בנקודה $A$ שבה $x=4$. מרכז $M$ נמצא ברביע הראשון.',
          'מצא את שיעורי הנקודה $M$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'מצא תחילה את $A$: הצב $x=4$ ב-$\\ell_1$.',
          '$M$ על חוצה הזווית שעובר ברביע הראשון ($y=2x+10$). הרדיוס $MA$ מאונך ל-$\\ell_1$ (שיפוע $\\tfrac34$).',
        ],
        solution: {
          steps: [
            'נמצא את $A$ (על $\\ell_1$, $x=4$): $\\;4y - 3\\cdot4 - 20 = 0 \\;\\Rightarrow\\; y = 8 \\;\\Rightarrow\\; A(4,8)$',
            '$M$ על חוצה הזווית שברביע הראשון $y=2x+10$, נסמן $M(a,\\,2a+10)$',
            'הרדיוס $MA \\perp \\ell_1$ (שיפוע $\\ell_1$ הוא $\\tfrac34$): $\\;\\dfrac{3}{4}\\cdot\\dfrac{(2a+10)-8}{a-4} = -1$',
            '$\\dfrac{3(2a+2)}{4(a-4)} = -1 \\;\\Rightarrow\\; 6a+6 = -4a+16 \\;\\Rightarrow\\; 10a = 10 \\;\\Rightarrow\\; a = 1$',
            '$M(1,\\,12)$',
          ],
          final_answer: 'מרכז המעגל: $\\;M(1,\\,12)$.',
        },
      },
      {
        label: 'ג',
        prompt:
          'הישר $\\ell_2$ הוא מדריך של פרבולה קנונית. האם הישר $\\ell_1$ משיק בנקודה $A$ לפרבולה זו? נמק את תשובתך.',
        answer_type: 'proof',
        hints: [
          'מדריך $x=-4$ $\\Rightarrow$ פרבולה $y^2=16x$ (מוקד $(4,0)$).',
          "שיפוע המשיק לפרבולה: גזירה סתומה של $y^2=16x$ נותנת $y'=\\dfrac{8}{y}$. השווה לשיפוע $\\ell_1$ ($\\tfrac34$).",
        ],
        solution: {
          steps: [
            'מדריך $x=-4$ $\\;\\Rightarrow\\;$ פרבולה קנונית $\\;y^2 = 16x$ (מוקד $(4,0)$, מדריך $x=-4$)',
            'בדיקה ש-$A(4,8)$ על הפרבולה: $\\;8^2 = 64 = 16\\cdot4$ ✓',
            "שיפוע המשיק לפרבולה: $\\;2y\\,y' = 16 \\Rightarrow y' = \\dfrac{8}{y}$; ב-$A(4,8)$: $\\;y' = \\dfrac{8}{8} = 1$",
            'שיפוע $\\ell_1$ הוא $\\tfrac{3}{4} \\ne 1$ — השיפועים שונים',
          ],
          final_answer:
            '$\\ell_1$ אינו משיק לפרבולה ב-$A$: שיפוע המשיק לפרבולה שם הוא $1$, ושיפוע $\\ell_1$ הוא $\\tfrac{3}{4}$. ⬛',
        },
      },
      {
        label: 'ד',
        prompt:
          'מצא את משוואת המעגל המשיק לפרבולה זו בשתי נקודות, שאחת מהן היא הנקודה $A$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 240 200',
            svg: `
              <line x1="10" y1="100" x2="232" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="40" y1="10" x2="40" y2="192" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="224" y="96" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="45" y="20" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <circle cx="124" cy="100" r="79" fill="rgba(168,85,247,0.08)" stroke="rgba(244,114,182,0.9)" stroke-width="1.6"/>
              <path d="M 103,16 L 68,44 L 47,72 L 40,100 L 47,128 L 68,156 L 103,184" fill="none" stroke="rgba(96,165,250,0.95)" stroke-width="1.8"/>
              <circle cx="124" cy="100" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <text x="126" y="114" fill="#f1f5f9" font-size="9" font-family="Heebo, sans-serif">(12,0)</text>
              <circle cx="68" cy="44" r="2.8" fill="#4ade80"/>
              <text x="50" y="40" fill="#4ade80" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">A(4,8)</text>
              <circle cx="68" cy="156" r="2.8" fill="#4ade80"/>
              <text x="46" y="170" fill="#4ade80" font-size="9" font-family="Heebo, sans-serif">(4,-8)</text>
              <text x="196" y="54" fill="#bfdbfe" font-size="10" font-family="Heebo, sans-serif">y²=16x</text>
            `,
            caption: 'המעגל (מרכז $(12,0)$) משיק לפרבולה $y^2=16x$ בשתי נקודות סימטריות לציר $x$: $A(4,8)$ ו-$(4,-8)$.',
          },
        ],
        hints: [
          'שתי נקודות ההשקה סימטריות לציר $x$ (הפרבולה סימטרית) $\\Rightarrow$ מרכז המעגל על ציר $x$: $(a,0)$.',
          'הרדיוס מ-$(a,0)$ ל-$A(4,8)$ מאונך למשיק לפרבולה ב-$A$ (שיפוע $1$).',
        ],
        solution: {
          steps: [
            'שתי נקודות ההשקה סימטריות לציר $x$ $\\;\\Rightarrow\\;$ מרכז המעגל על ציר $x$: $\\;(a,\\,0)$',
            'הרדיוס מ-$(a,0)$ ל-$A(4,8)$ מאונך למשיק לפרבולה ב-$A$ (שיפוע $1$): $\\;\\dfrac{8-0}{4-a}\\cdot 1 = -1$',
            '$\\dfrac{8}{4-a} = -1 \\;\\Rightarrow\\; 8 = a-4 \\;\\Rightarrow\\; a = 12$ — מרכז $(12,0)$',
            '$r^2 = (4-12)^2 + (8-0)^2 = 64 + 64 = 128$',
          ],
          final_answer: 'משוואת המעגל: $\\;(x-12)^2 + y^2 = 128$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q2 — וקטורים במרחב: תיבה ABCDA'B'C'D', נקודות E,F, מישור EFBD, נקודה P
  // ===========================================================================
  {
    id: 'b2023s582sp-q2',
    year: 2023,
    season: 'summer',
    moed: 'special',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 25,
    context: [
      'נתונה תיבה $ABCDA\'B\'C\'D\'$ שבסיסה $ABCD$ מלבן.',
      'הנקודה $E$ על המקצוע $DD\'$ כך ש-$DE:ED\' = 3:2$. הנקודה $F$ על האלכסון $BD\'$ ומתקיים $\\vec{BF} = t\\cdot\\vec{BD\'}$ ($0<t<1$).',
      'נסמן: $\\;\\vec{AB} = \\vec u$, $\\;\\vec{AD} = \\vec v$, $\\;\\vec{AA\'} = \\vec w$.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 210 215',
        svg: `
          <line x1="40" y1="140" x2="130" y2="140" stroke="rgba(148,163,184,0.5)" stroke-width="1.1" stroke-dasharray="4 3"/>
          <line x1="40" y1="140" x2="65" y2="180" stroke="rgba(148,163,184,0.5)" stroke-width="1.1" stroke-dasharray="4 3"/>
          <line x1="40" y1="140" x2="40" y2="30" stroke="rgba(148,163,184,0.5)" stroke-width="1.1" stroke-dasharray="4 3"/>
          <line x1="65" y1="180" x2="155" y2="180" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="130" y1="140" x2="155" y2="180" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="65" y1="180" x2="65" y2="70" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="155" y1="180" x2="155" y2="70" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="130" y1="140" x2="130" y2="30" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="40" y1="30" x2="130" y2="30" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="40" y1="30" x2="65" y2="70" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="65" y1="70" x2="155" y2="70" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="130" y1="30" x2="155" y2="70" stroke="rgba(226,232,240,0.8)" stroke-width="1.3"/>
          <line x1="65" y1="180" x2="130" y2="30" stroke="rgba(251,191,36,0.85)" stroke-width="1.2" stroke-dasharray="3 2"/>
          <line x1="104" y1="90" x2="130" y2="74" stroke="rgba(244,114,182,0.95)" stroke-width="1.6"/>
          <circle cx="130" cy="74" r="2.8" fill="rgba(56,189,248,0.95)"/>
          <circle cx="104" cy="90" r="2.8" fill="rgba(244,114,182,0.95)"/>
          <text x="158" y="184" fill="#f1f5f9" font-size="9.5" font-family="Heebo, sans-serif">A</text>
          <text x="55" y="192" fill="#f1f5f9" font-size="9.5" font-family="Heebo, sans-serif">B</text>
          <text x="28" y="142" fill="#94a3b8" font-size="9.5" font-family="Heebo, sans-serif">C</text>
          <text x="133" y="150" fill="#f1f5f9" font-size="9.5" font-family="Heebo, sans-serif">D</text>
          <text x="158" y="70" fill="#f1f5f9" font-size="9.5" font-family="Heebo, sans-serif">A'</text>
          <text x="55" y="68" fill="#f1f5f9" font-size="9.5" font-family="Heebo, sans-serif">B'</text>
          <text x="28" y="30" fill="#f1f5f9" font-size="9.5" font-family="Heebo, sans-serif">C'</text>
          <text x="133" y="28" fill="#f1f5f9" font-size="9.5" font-family="Heebo, sans-serif">D'</text>
          <text x="135" y="76" fill="#38bdf8" font-size="9.5" font-weight="bold" font-family="Heebo, sans-serif">E</text>
          <text x="92" y="90" fill="#f472b6" font-size="9.5" font-weight="bold" font-family="Heebo, sans-serif">F</text>
        `,
        caption: 'התיבה $ABCDA\'B\'C\'D\'$: $E$ על $DD\'$ ($DE:ED\'=3:2$), $F$ על האלכסון $BD\'$ (צהוב מקווקו), והקטע $FE$ (ורוד).',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הביעו את הווקטורים $\\vec{FE}$ ו-$\\vec{BD\'}$ באמצעות $\\vec u,\\,\\vec v,\\,\\vec w$ ו-$t$ (אם יש צורך).',
        answer_type: 'expression',
        hints: [
          '$\\vec{BD\'} = \\vec{BA} + \\vec{AD} + \\vec{DD\'}$. זכור $\\vec{BA}=-\\vec u$, $\\vec{DD\'}=\\vec w$.',
          '$\\vec{FE} = \\vec{FD\'} + \\vec{D\'E}$, כאשר $\\vec{FD\'} = (1-t)\\vec{BD\'}$ ו-$\\vec{D\'E} = -\\frac25\\vec w$ (כי $ED\'=\\frac25 DD\'$).',
        ],
        solution: {
          steps: [
            '$\\vec{BD\'} = \\vec{BA} + \\vec{AD} + \\vec{DD\'} = -\\vec u + \\vec v + \\vec w$',
            '$DE:ED\'=3:2$, אז $\\vec{DE} = \\frac35\\vec w$ ו-$\\vec{D\'E} = -\\frac25\\vec w$',
            '$\\vec{BF} = t\\vec{BD\'}$, אז $\\vec{FD\'} = (1-t)\\vec{BD\'}$',
            '$\\vec{FE} = \\vec{FD\'} + \\vec{D\'E} = (1-t)(-\\vec u+\\vec v+\\vec w) - \\frac25\\vec w$',
            '$\\vec{FE} = (t-1)\\vec u + (1-t)\\vec v + \\left(\\tfrac35-t\\right)\\vec w$',
          ],
          final_answer: '$\\vec{BD\'} = -\\vec u+\\vec v+\\vec w$; $\\;\\vec{FE} = (t-1)\\vec u + (1-t)\\vec v + (\\tfrac35-t)\\vec w$',
        },
      },
      {
        label: 'ב',
        prompt: 'נתון כי $\\vec{FE}$ מקביל למישור הבסיס $ABCD$. מצאו את $t$.',
        answer_type: 'number',
        hints: [
          '$\\vec w = \\vec{AA\'}$ מאונך לבסיס $ABCD$.',
          'מקבילות לבסיס $\\Leftrightarrow$ אין רכיב $\\vec w$ — השווה את מקדם $\\vec w$ לאפס.',
        ],
        solution: {
          steps: [
            '$\\vec w$ מאונך לבסיס $ABCD$ ($\\vec u,\\vec v$ פורשים אותו)',
            '$\\vec{FE}\\parallel ABCD$ פירושו שמקדם $\\vec w$ מתאפס:',
            '$\\tfrac35 - t = 0 \\Rightarrow t = \\tfrac35$',
          ],
          final_answer: '$t = \\dfrac35$',
        },
      },
      {
        label: 'ג',
        prompt: [
          'הנקודה $C$ היא ראשית הצירים, $B$ על החלק החיובי של ציר $x$, ו-$D$ על החלק החיובי של ציר $y$. נתון: $F(4,12,18)$.',
          '',
          'מצאו את $|\\vec u|$, $|\\vec v|$ ו-$|\\vec w|$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'הצב $t=\\frac35$: $\\vec{BF} = \\frac35\\vec{BD\'}$. כתוב $B(x,0,0)$, $D(0,y,0)$, $D\'(0,y,z)$.',
          'מ-$\\vec{BF} = F-B$ והשוואה ל-$\\frac35\\vec{BD\'}$ מקבלים $x,y,z$, ואז את האורכים.',
        ],
        solution: {
          steps: [
            '$t=\\frac35$: $\\;\\vec{BF} = \\frac35\\vec{BD\'} = \\frac35(-\\vec u+\\vec v+\\vec w)$',
            '$C(0,0,0)$, $B(x,0,0)$, $D(0,y,0)$, $D\'(0,y,z)$; $\\;\\vec{BD\'} = (-x,y,z)$',
            '$\\vec{BF} = \\frac35(-x,y,z) = \\left(-\\tfrac35 x, \\tfrac35 y, \\tfrac35 z\\right)$',
            '$\\vec{BF} = F-B = (4-x,\\,12,\\,18)$',
            '$4-x = -\\tfrac35 x \\Rightarrow x=10$; $\\;12 = \\tfrac35 y \\Rightarrow y=20$; $\\;18 = \\tfrac35 z \\Rightarrow z=30$',
            '$B(10,0,0)$, $D(0,20,0)$, $D\'(0,20,30)$',
            '$|\\vec u| = |AB| = |DC| = 20$; $\\;|\\vec v| = |AD| = |BC| = 10$; $\\;|\\vec w| = |DD\'| = 30$',
          ],
          final_answer: '$|\\vec u| = 20$, $\\;|\\vec v| = 10$, $\\;|\\vec w| = 30$',
        },
      },
      {
        label: 'ד',
        prompt: [
          'מן הנקודה $F$ העבירו ישר המאונך למישור $EFBD$. הישר חותך את הפאה $CDD\'C\'$ בנקודה $P$.',
          '',
          'מצאו את שיעורי הנקודה $P$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'נורמל למישור $EFBD$ מאונך לשני וקטורים בו: $\\vec{BD}$ ו-$\\vec{BF}$. פתור מערכת.',
          'הפאה $CDD\'C\'$ כולה במישור $x=0$. מצא את $Q$ שעבורו שיעור ה-$x$ של הישר מתאפס.',
        ],
        solution: {
          steps: [
            '$\\vec{BD} = D-B = (-10,20,0)$, $\\;\\vec{BF} = F-B = (-6,12,18)$',
            'נורמל $(a,b,c)$: $\\;(a,b,c)\\cdot(-10,20,0) = -10a+20b = 0 \\Rightarrow a = 2b$',
            '$(a,b,c)\\cdot(-6,12,18) = -6a+12b+18c = 0 \\Rightarrow 18c = 0 \\Rightarrow c = 0$',
            'נבחר $b=1$: נורמל $(2,1,0)$',
            'הישר דרך $F$: $\\;X = (4,12,18) + Q(2,1,0)$',
            'הפאה $CDD\'C\'$ במישור $x=0$: $\\;4 + 2Q = 0 \\Rightarrow Q = -2$',
            '$P = (4,12,18) - 2(2,1,0) = (0,\\,10,\\,18)$',
          ],
          final_answer: '$P(0,\\, 10,\\, 18)$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
