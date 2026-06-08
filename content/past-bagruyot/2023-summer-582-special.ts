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
];
