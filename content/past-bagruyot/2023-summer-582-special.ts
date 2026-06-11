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
 *   Q2 — וקטורים במרחב (תיבה ABCDA'B'C'D', מישור EFBD, נקודה P).
 *   Q3 — מספרים מרוכבים (מקום גאומטרי, z^6=1, מצולע I ו-II, הסיבוב w=cis15°).
 *   Q4 — חקירת פונקציה f=4e^{-x²/4} (פיתול→a=4, זוגיות, אסימפטוטה, מקסימום),
 *        התאמת גרפים I–IV ל-f', h=1/f', m=e^h, ירידה וסימן אינטגרל.
 *   Q5 — חקירת פונקציית ln: f=(1-lnx)/lnx ו-g=ln(-f); תחומים, אסימפטוטות,
 *        עלייה/ירידה, סימנים, סקיצות, והשוואת אינטגרלים I/II מול 1.
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
            'מקרה 1: $\\;5(x+4) = -3x+4y-20$',
            '$4y = 8x+40$',
            '$y = 2x+10$',
            'מקרה 2: $\\;-5(x+4) = -3x+4y-20$',
            '$4y = -2x$',
            '$y = -\\tfrac{1}{2}x$',
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
            'נמצא את $A$ (על $\\ell_1$, $x=4$): $\\;4y - 3\\cdot4 - 20 = 0$',
            '$y = 8 \\;\\Rightarrow\\; A(4,8)$',
            '$M$ על חוצה הזווית שברביע הראשון $y=2x+10$, נסמן $M(a,\\,2a+10)$',
            'הרדיוס $MA \\perp \\ell_1$ (שיפוע $\\ell_1$ הוא $\\tfrac34$): $\\;\\dfrac{3}{4}\\cdot\\dfrac{(2a+10)-8}{a-4} = -1$',
            '$\\dfrac{3(2a+2)}{4(a-4)} = -1$',
            '$6a+6 = -4a+16$',
            '$10a = 10 \\;\\Rightarrow\\; a = 1$',
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
          'מדריך $x=-4$ נותן פרבולה $y^2=16x$ (מוקד $(4,0)$).',
          "שיפוע המשיק לפרבולה: גזירה סתומה של $y^2=16x$ נותנת $y'=\\dfrac{8}{y}$. השווה לשיפוע $\\ell_1$ ($\\tfrac34$).",
        ],
        solution: {
          steps: [
            'מדריך $x=-4$, ולכן הפרבולה הקנונית היא $\\;y^2 = 16x$ (מוקד $(4,0)$, מדריך $x=-4$)',
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
          'שתי נקודות ההשקה סימטריות לציר $x$ (הפרבולה סימטרית), ולכן מרכז המעגל על ציר $x$: $(a,0)$.',
          'הרדיוס מ-$(a,0)$ ל-$A(4,8)$ מאונך למשיק לפרבולה ב-$A$ (שיפוע $1$).',
        ],
        solution: {
          steps: [
            'שתי נקודות ההשקה סימטריות לציר $x$, ולכן מרכז המעגל על ציר $x$: $\\;(a,\\,0)$',
            'הרדיוס מ-$(a,0)$ ל-$A(4,8)$ מאונך למשיק לפרבולה ב-$A$ (שיפוע $1$): $\\;\\dfrac{8-0}{4-a}\\cdot 1 = -1$',
            '$\\dfrac{8}{4-a} = -1$',
            '$8 = a-4 \\;\\Rightarrow\\; a = 12$ — מרכז $(12,0)$',
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
          'מקבילות לבסיס פירושה שאין רכיב $\\vec w$ — השווה את מקדם $\\vec w$ לאפס.',
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
            '$4-x = -\\tfrac35 x \\Rightarrow x=10$',
            '$12 = \\tfrac35 y \\Rightarrow y=20$',
            '$18 = \\tfrac35 z \\Rightarrow z=30$',
            '$B(10,0,0)$, $D(0,20,0)$, $D\'(0,20,30)$',
            '$|\\vec u| = |AB| = |DC| = 20$',
            '$|\\vec v| = |AD| = |BC| = 10$',
            '$|\\vec w| = |DD\'| = 30$',
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
            '$(a,b,c)\\cdot(-6,12,18) = -6a+12b+18c = 0$',
            '$18c = 0 \\Rightarrow c = 0$',
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

  // ===========================================================================
  // Q3 — מספרים מרוכבים: |z²-3i|=|z²+5i| (מקום גאומטרי y=-1/2x), z⁶=1 (מצולע I),
  //      חיתוך עם מעגל היחידה ברביע הרביעי (A), מצולע II, ומציאת w (סיבוב 15°).
  // ===========================================================================
  {
    id: 'b2023s582sp-q3',
    year: 2023,
    season: 'summer',
    moed: 'special',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 25,
    context:
      '(קיץ תשפ"ג, מועד מיוחד) $\\;z = x + iy$ הוא מספר מרוכב ($x,\\,y$ הם מספרים ממשיים).',
    parts: [
      {
        label: 'א1',
        prompt:
          'הראו כי משוואת המקום הגאומטרי של כל הנקודות במישור המקיימות $|z^2 - 3i| = |z^2 + 5i|$ היא $\\;y = -\\dfrac{1}{2x}$.',
        answer_type: 'proof',
        hints: [
          'הציבו $z = x+iy$ וחשבו את $z^2$. זכרו ש-$i^2=-1$.',
          'ערך מוחלט של מספר מרוכב: $|a+bi| = \\sqrt{a^2+b^2}$. השוו את שני הערכים המוחלטים והעלו בריבוע כדי להיפטר מהשורשים.',
        ],
        solution: {
          steps: [
            '$z^2 = (x+iy)^2 = x^2 + 2xyi + i^2y^2$',
            '$i^2 = -1 \\;\\Rightarrow\\; z^2 = (x^2 - y^2) + 2xy\\,i$',
            '$z^2 - 3i = (x^2-y^2) + (2xy-3)i$',
            '$z^2 + 5i = (x^2-y^2) + (2xy+5)i$',
            '$|z^2-3i| = \\sqrt{(x^2-y^2)^2 + (2xy-3)^2}$',
            '$|z^2+5i| = \\sqrt{(x^2-y^2)^2 + (2xy+5)^2}$',
            'משווים ומעלים בריבוע: $\\;(x^2-y^2)^2 + (2xy-3)^2 = (x^2-y^2)^2 + (2xy+5)^2$',
            '$(2xy-3)^2 = (2xy+5)^2$',
            '$4x^2y^2 - 12xy + 9 = 4x^2y^2 + 20xy + 25$',
            '$-12xy + 9 = 20xy + 25$',
            '$-32xy = 16$',
            '$xy = -\\dfrac{1}{2}$',
            '$y = -\\dfrac{1}{2x}$',
          ],
          final_answer: '$y = -\\dfrac{1}{2x}$ ⬛',
        },
      },
      {
        label: 'א2',
        prompt: 'תנו דוגמה למספר מרוכב הנמצא על המקום הגאומטרי הזה.',
        answer_type: 'expression',
        hints: [
          'בחרו ערך כלשהו ל-$x$ (שונה מ-$0$) והציבו ב-$y = -\\dfrac{1}{2x}$.',
        ],
        solution: {
          steps: [
            'נבחר $x = 1$',
            '$y = -\\dfrac{1}{2\\cdot 1} = -\\dfrac{1}{2}$',
            '$z = 1 - \\dfrac{1}{2}i$',
            'בדיקה: $\\;xy = 1\\cdot\\left(-\\tfrac12\\right) = -\\tfrac12$ ✓',
          ],
          final_answer: '$z = 1 - \\dfrac{1}{2}i$ (כל מספר עם $xy = -\\tfrac12$ מתאים).',
        },
      },
      {
        label: 'ב',
        prompt:
          'פתרו את המשוואה $\\;z^6 = 1$. (פתרונות המשוואה מייצגים את קודקודיו של מצולע $I$.)',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 220 200',
            svg: `
              <line x1="10" y1="100" x2="210" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="110" y1="14" x2="110" y2="190" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="201" y="113" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">Re</text>
              <text x="114" y="22" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">Im</text>
              <circle cx="110" cy="100" r="75" fill="none" stroke="rgba(148,163,184,0.5)" stroke-width="1.1"/>
              <polygon points="185,100 148,35 72,35 35,100 72,165 148,165" fill="rgba(56,189,248,0.10)" stroke="rgba(56,189,248,0.9)" stroke-width="1.6"/>
              <circle cx="185" cy="100" r="2.8" fill="rgba(56,189,248,0.95)"/>
              <circle cx="148" cy="35" r="2.8" fill="rgba(56,189,248,0.95)"/>
              <circle cx="72" cy="35" r="2.8" fill="rgba(56,189,248,0.95)"/>
              <circle cx="35" cy="100" r="2.8" fill="rgba(56,189,248,0.95)"/>
              <circle cx="72" cy="165" r="2.8" fill="rgba(56,189,248,0.95)"/>
              <circle cx="148" cy="165" r="2.8" fill="rgba(56,189,248,0.95)"/>
              <circle cx="110" cy="100" r="2" fill="rgba(226,232,240,0.9)"/>
              <text x="165" y="114" fill="#38bdf8" font-size="9" font-family="Heebo, sans-serif">0°</text>
              <text x="150" y="30" fill="#38bdf8" font-size="9" font-family="Heebo, sans-serif">60°</text>
              <text x="44" y="30" fill="#38bdf8" font-size="9" font-family="Heebo, sans-serif">120°</text>
              <text x="13" y="114" fill="#38bdf8" font-size="9" font-family="Heebo, sans-serif">180°</text>
              <text x="44" y="180" fill="#38bdf8" font-size="9" font-family="Heebo, sans-serif">240°</text>
              <text x="150" y="180" fill="#38bdf8" font-size="9" font-family="Heebo, sans-serif">300°</text>
              <text x="96" y="113" fill="#cbd5e1" font-size="9" font-family="Heebo, sans-serif">O</text>
            `,
            caption:
              'ששת הפתרונות של $z^6=1$ הם קודקודי משושה משוכלל ($I$) במעגל היחידה, בזוויות $0°,\\,60°,\\,120°,\\,180°,\\,240°,\\,300°$.',
          },
        ],
        hints: [
          'כתבו $1 = \\text{cis}(0° + 360°k)$ והוציאו שורש שישי (נוסחת דה-מואבר).',
          'הזוויות: $\\dfrac{0°+360°k}{6} = 60°k$ עבור $k=0,1,2,3,4,5$.',
        ],
        solution: {
          steps: [
            '$1 = \\text{cis}(0° + 360°k)$',
            '$z = \\sqrt[6]{\\text{cis}(0°+360°k)} = \\text{cis}\\left(\\dfrac{0°+360°k}{6}\\right)$',
            '$z_k = \\text{cis}(60°k), \\;\\; k = 0,1,2,3,4,5$',
            '$z_1 = \\text{cis}0°, \\quad z_2 = \\text{cis}60°, \\quad z_3 = \\text{cis}120°$',
            '$z_4 = \\text{cis}180°, \\quad z_5 = \\text{cis}240°, \\quad z_6 = \\text{cis}300°$',
          ],
          final_answer:
            'ששת קודקודי מצולע $I$: $\\;\\text{cis}0°,\\,\\text{cis}60°,\\,\\text{cis}120°,\\,\\text{cis}180°,\\,\\text{cis}240°,\\,\\text{cis}300°$.',
        },
      },
      {
        label: 'ג',
        prompt:
          'המקום הגאומטרי מסעיף א(1) חותך ברביע הרביעי את המעגל החוסם את מצולע $I$ בנקודה $A$. מצאו את שיעורי הנקודה $A$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 220 200',
            svg: `
              <line x1="10" y1="100" x2="210" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="110" y1="14" x2="110" y2="190" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="203" y="113" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="114" y="22" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <polygon points="185,100 148,35 72,35 35,100 72,165 148,165" fill="none" stroke="rgba(244,114,182,0.25)" stroke-width="1.1"/>
              <circle cx="110" cy="100" r="75" fill="none" stroke="rgba(148,163,184,0.6)" stroke-width="1.3"/>
              <path d="M 141,189 L 148,175 L 155,162 L 163,153 L 174,144 L 189,136 L 207,129 L 218,126" fill="none" stroke="rgba(251,191,36,0.9)" stroke-width="1.7"/>
              <path d="M 78,11 L 72,25 L 65,38 L 57,47 L 46,56 L 31,64 L 13,71 L 2,74" fill="none" stroke="rgba(251,191,36,0.9)" stroke-width="1.7"/>
              <circle cx="57" cy="47" r="3.2" fill="none" stroke="rgba(148,163,184,0.85)" stroke-width="1.4"/>
              <circle cx="163" cy="153" r="3.6" fill="#4ade80"/>
              <text x="167" y="163" fill="#4ade80" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">A</text>
              <text x="170" y="121" fill="#fbbf24" font-size="9" font-family="Heebo, sans-serif">y=-1/2x</text>
              <text x="96" y="113" fill="#cbd5e1" font-size="9" font-family="Heebo, sans-serif">O</text>
            `,
            caption:
              'מעגל היחידה (החוסם את מצולע $I$) וההיפרבולה $y=-\\dfrac{1}{2x}$ נחתכים בשתי נקודות. ברביע הרביעי מתקבלת $\\;A\\left(\\dfrac{\\sqrt2}{2},\\,-\\dfrac{\\sqrt2}{2}\\right)$; הנקודה השנייה (ברביע השני) נדחית.',
          },
        ],
        hints: [
          'המעגל החוסם את מצולע $I$ הוא מעגל היחידה $\\;x^2+y^2=1$ (כי $|z_k|=1$).',
          'פתרו את המערכת $x^2+y^2=1$ ו-$y=-\\dfrac{1}{2x}$: הציבו את $y$ וקבלו משוואה ב-$x$ בלבד.',
          'ברביע הרביעי $x>0$ ו-$y<0$.',
        ],
        solution: {
          steps: [
            'המעגל החוסם את מצולע $I$: $\\;x^2 + y^2 = 1$ (רדיוס $1$, כי $|z_k| = 1$)',
            'נציב $y = -\\dfrac{1}{2x}$: $\\quad x^2 + \\dfrac{1}{4x^2} = 1$',
            'נכפיל ב-$4x^2$: $\\quad 4x^4 + 1 = 4x^2$',
            '$4x^4 - 4x^2 + 1 = 0$',
            '$(2x^2 - 1)^2 = 0$',
            '$2x^2 - 1 = 0 \\;\\Rightarrow\\; x^2 = \\dfrac{1}{2}$',
            '$x = \\pm\\dfrac{\\sqrt2}{2}$',
            'ברביע הרביעי $x>0$, ולכן $\\;x_A = \\dfrac{\\sqrt2}{2}$',
            '$y_A = -\\dfrac{1}{2\\cdot\\frac{\\sqrt2}{2}} = -\\dfrac{1}{\\sqrt2} = -\\dfrac{\\sqrt2}{2}$',
          ],
          final_answer: '$A\\left(\\dfrac{\\sqrt2}{2},\\; -\\dfrac{\\sqrt2}{2}\\right)$',
        },
      },
      {
        label: 'ד',
        prompt: [
          'הנקודה $A$ היא קודקוד של מצולע משוכלל אחר, $II$, החסום באותו מעגל. נתון: מספר הקודקודים של מצולע $II$ שווה למספר הקודקודים של מצולע $I$.',
          'מצאו את המספרים המרוכבים המייצגים את כל קודקודי מצולע $II$.',
        ].join('\n'),
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 220 200',
            svg: `
              <line x1="10" y1="100" x2="210" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="110" y1="14" x2="110" y2="190" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="201" y="113" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">Re</text>
              <text x="114" y="22" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">Im</text>
              <circle cx="110" cy="100" r="75" fill="none" stroke="rgba(148,163,184,0.35)" stroke-width="1" stroke-dasharray="3 3"/>
              <polygon points="185,100 148,35 72,35 35,100 72,165 148,165" fill="none" stroke="rgba(56,189,248,0.7)" stroke-width="1.3" stroke-dasharray="4 3"/>
              <polygon points="182,81 129,28 57,47 38,119 91,172 163,153" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.9)" stroke-width="1.6"/>
              <circle cx="182" cy="81" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <circle cx="129" cy="28" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <circle cx="57" cy="47" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <circle cx="38" cy="119" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <circle cx="91" cy="172" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <circle cx="163" cy="153" r="3.6" fill="#4ade80"/>
              <text x="186" y="79" fill="#f472b6" font-size="8.5" font-family="Heebo, sans-serif">15°</text>
              <text x="117" y="22" fill="#f472b6" font-size="8.5" font-family="Heebo, sans-serif">75°</text>
              <text x="29" y="44" fill="#f472b6" font-size="8.5" font-family="Heebo, sans-serif">135°</text>
              <text x="9" y="122" fill="#f472b6" font-size="8.5" font-family="Heebo, sans-serif">195°</text>
              <text x="75" y="187" fill="#f472b6" font-size="8.5" font-family="Heebo, sans-serif">255°</text>
              <text x="167" y="162" fill="#4ade80" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">A</text>
              <path d="M 191,100 A 81 81 0 0 1 187,80" fill="none" stroke="rgba(251,191,36,0.9)" stroke-width="1.4"/>
              <circle cx="16" cy="178" r="2.6" fill="rgba(56,189,248,0.9)"/>
              <text x="22" y="181" fill="#38bdf8" font-size="8.5" font-family="Heebo, sans-serif">I</text>
              <circle cx="16" cy="190" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <text x="22" y="193" fill="#f472b6" font-size="8.5" font-family="Heebo, sans-serif">II</text>
              <circle cx="110" cy="100" r="2" fill="rgba(226,232,240,0.9)"/>
            `,
            caption:
              'מצולע $II$ (ורוד) הוא מצולע $I$ (תכלת מקווקו) לאחר סיבוב ב-$15°$. קודקודי $II$ בזוויות $15°,\\,75°,\\,135°,\\,195°,\\,255°,\\,315°$, כאשר $A=\\text{cis}315°=\\text{cis}(-45°)$.',
          },
        ],
        hints: [
          'כתבו את $A$ בצורה קוטבית $A = r\\,\\text{cis}\\,\\theta$: חשבו $r=|A|$ ואת הזווית (רביע רביעי).',
          'מצולע $II$ משוכלל בעל $6$ קודקודים במעגל היחידה — הזוויות במרחקים שווים של $\\dfrac{360°}{6}=60°$, החל מן הזווית של $A$.',
        ],
        solution: {
          steps: [
            '$A = \\dfrac{\\sqrt2}{2} - \\dfrac{\\sqrt2}{2}i$',
            '$r = |A| = \\sqrt{\\left(\\tfrac{\\sqrt2}{2}\\right)^2 + \\left(\\tfrac{\\sqrt2}{2}\\right)^2} = \\sqrt{\\tfrac12 + \\tfrac12} = 1$',
            '$\\tan\\theta = \\dfrac{-\\sqrt2/2}{\\sqrt2/2} = -1$, וברביע הרביעי: $\\;\\theta = -45°$',
            '$A = \\text{cis}(-45°)$',
            'מצולע $II$ משוכלל בן $6$ קודקודים, החל מ-$A$ ובקפיצות של $\\dfrac{360°}{6}=60°$: $\\;\\text{cis}(-45° + 60°k),\\; k=1,2,3,4,5,6$',
            '$\\text{cis}15°, \\quad \\text{cis}75°, \\quad \\text{cis}135°$',
            '$\\text{cis}195°, \\quad \\text{cis}255°, \\quad \\text{cis}315°$',
          ],
          final_answer:
            'קודקודי מצולע $II$: $\\;\\text{cis}15°,\\,\\text{cis}75°,\\,\\text{cis}135°,\\,\\text{cis}195°,\\,\\text{cis}255°,\\,\\text{cis}315°$.',
        },
      },
      {
        label: 'ה',
        prompt: [
          'נסמן $\\;w = r\\,\\text{cis}\\,\\alpha$, כאשר $0 < \\alpha < 60°$. כופלים את כל המספרים המייצגים את קודקודי מצולע $I$ במספר $w$, כך שקודקודי מצולע $I$ מתלכדים עם קודקודי מצולע $II$.',
          'מצאו את $w$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'כפל ב-$w = r\\,\\text{cis}\\,\\alpha$ פירושו מתיחה פי $r$ וסיבוב בזווית $\\alpha$.',
          'שני המצולעים חסומים במעגל היחידה $\\Rightarrow r=1$. קודקודי $I$ בזוויות $60°k$, קודקודי $II$ בזוויות $15°+60°k$.',
        ],
        solution: {
          steps: [
            'כפל קודקוד של מצולע $I$ ב-$w$: $\\;\\text{cis}(60°k)\\cdot r\\,\\text{cis}\\,\\alpha = r\\,\\text{cis}(60°k + \\alpha)$',
            'שני המצולעים על מעגל היחידה $\\;\\Rightarrow\\; |w| = r = 1$',
            'קודקודי $I$ בזוויות $60°k$; קודקודי $II$ בזוויות $15° + 60°k$',
            '$60°k + \\alpha = 15° + 60°k \\;\\Rightarrow\\; \\alpha = 15°$',
            'גם $75°,\\,135°,\\dots$ ממפים את $I$ על $II$, אך התנאי $0<\\alpha<60°$ בוחר $\\;\\alpha = 15°$',
          ],
          final_answer: '$w = \\text{cis}15°$ (כלומר $r=1,\\ \\alpha = 15°$).',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q4 — חקירת פונקציה: f'(x)=-2x·e^{-x²/a}, נקודת פיתול ב-x=√2 ⟹ a=4,
  //      f(x)=4e^{-x²/4} (פעמון), זוגיות/אסימפטוטה/מקסימום/סקיצה,
  //      התאמת גרפים I–IV ל-f',h=1/f',m=e^h, ותחומי ירידה + סימן אינטגרל.
  //      (פתרון מלא לפי כתב-היד של המשתמש, כולל המשך סעיף ה.)
  // ===========================================================================
  {
    id: 'b2023s582sp-q4',
    year: 2023,
    season: 'summer',
    moed: 'special',
    paper: '582',
    questionNumber: 4,
    topic: 'פונקציה מעריכית',
    totalPoints: 25,
    context:
      "נתון: $f'(x) = -2x\\,e^{-x^2/a}$, כאשר $a$ פרמטר. הפונקציה $f(x)$ ונגזרתה $f'(x)$ מוגדרות לכל $x$. לפונקציה $f(x)$ יש נקודת פיתול בנקודה שבה $x=\\sqrt2$.",
    parts: [
      {
        label: 'א',
        prompt: 'מצאו את $a$.',
        answer_type: 'number',
        hints: [
          "נקודת פיתול $\\Rightarrow f''(x)=0$. גזרו את $f'(x)$ בעזרת כלל המכפלה וכלל השרשרת.",
          "הציבו $x=\\sqrt2$ ב-$f''(x)=0$. הגורם $e^{-x^2/a}$ לעולם אינו $0$, לכן האיפוס מגיע מהסוגריים.",
        ],
        solution: {
          steps: [
            "$f'(x) = -2x\\,e^{-x^2/a}$",
            "נגזור (כלל המכפלה): $\\;f''(x) = -2\\cdot e^{-x^2/a} + (-2x)\\cdot e^{-x^2/a}\\cdot\\left(-\\dfrac{2x}{a}\\right)$",
            "$f''(x) = e^{-x^2/a}\\left(-2 + \\dfrac{4x^2}{a}\\right)$",
            "נקודת פיתול ב-$x=\\sqrt2$: $\\;f''(\\sqrt2)=0$",
            "$e^{-2/a}\\left(-2 + \\dfrac{4\\cdot 2}{a}\\right) = 0$",
            "$e^{-2/a}\\ne 0 \\;\\Rightarrow\\; -2 + \\dfrac{8}{a} = 0$",
            "$\\dfrac{8}{a} = 2 \\;\\Rightarrow\\; a = 4$",
          ],
          final_answer: '$a = 4$',
        },
      },
      {
        label: 'ב',
        prompt: 'נתון: $f(0)=a$. מצאו את הפונקציה $f(x)$.',
        answer_type: 'expression',
        hints: [
          "אנטי-נגזרת: $f(x)=\\int f'(x)\\,dx = \\int -2x\\,e^{-x^2/4}\\,dx$.",
          'שימו לב ש-$\\dfrac{d}{dx}\\,e^{-x^2/4} = -\\dfrac{x}{2}\\,e^{-x^2/4}$, ולכן האינטגרל הוא $4e^{-x^2/4}+C$. מצאו $C$ מ-$f(0)=4$.',
        ],
        solution: {
          steps: [
            "מסעיף א: $a=4$, אז $\\;f'(x) = -2x\\,e^{-x^2/4}$",
            '$f(x) = \\displaystyle\\int -2x\\,e^{-x^2/4}\\,dx$',
            'נשים לב: $\\;\\dfrac{d}{dx}\\,e^{-x^2/4} = e^{-x^2/4}\\cdot\\left(-\\dfrac{x}{2}\\right)$',
            'לכן $\\;-2x\\,e^{-x^2/4} = 4\\cdot\\left(-\\dfrac{x}{2}\\right)e^{-x^2/4}$',
            '$f(x) = 4e^{-x^2/4} + C$',
            'נתון $f(0)=4$: $\\;4 = 4e^{0} + C = 4 + C$',
            '$C = 0$',
          ],
          final_answer: '$f(x) = 4e^{-x^2/4}$',
        },
      },
      {
        label: 'ג1',
        prompt: 'האם הפונקציה $f(x)$ היא זוגית או אי-זוגית? נמקו את תשובתכם.',
        answer_type: 'proof',
        hints: [
          'בדקו את $f(-x)$: הציבו $-x$ במקום $x$ ב-$4e^{-x^2/4}$. זכרו ש-$(-x)^2=x^2$.',
        ],
        solution: {
          steps: [
            '$f(-x) = 4e^{-(-x)^2/4}$',
            '$(-x)^2 = x^2 \\;\\Rightarrow\\; f(-x) = 4e^{-x^2/4}$',
            '$f(-x) = f(x)$',
          ],
          final_answer: 'הפונקציה $f(x)$ זוגית (הגרף סימטרי לציר $y$).',
        },
      },
      {
        label: 'ג2',
        prompt:
          'מצאו את משוואות האסימפטוטות המאוזנות (המקבילות לצירים) של $f(x)$, אם יש כאלה.',
        answer_type: 'expression',
        hints: [
          'בדקו לאן שואף $f(x)$ כאשר $x\\to\\pm\\infty$. מה קורה ל-$e^{-x^2/4}$ כשהמעריך שואף ל-$-\\infty$?',
        ],
        solution: {
          steps: [
            'כאשר $x\\to\\pm\\infty$: המעריך $\\;-\\dfrac{x^2}{4}\\to-\\infty$',
            'לכן $\\;e^{-x^2/4}\\to 0$',
            '$f(x) = 4e^{-x^2/4}\\to 4\\cdot 0 = 0$',
          ],
          final_answer: 'אסימפטוטה מאוזנת אחת: $\\;y=0$ (משני צידי הגרף).',
        },
      },
      {
        label: 'ג3',
        prompt: 'מצאו את שיעורי נקודת הקיצון של $f(x)$, וקבעו את סוגה.',
        answer_type: 'expression',
        hints: [
          "נקודת קיצון: $f'(x)=0$. הגורם $e^{-x^2/4}$ לעולם אינו $0$.",
          "לקביעת הסוג בנו טבלת סימנים ל-$f'(x)=-2x\\,e^{-x^2/4}$ (הסימן נקבע ע\"י $-2x$).",
        ],
        solution: {
          steps: [
            "$f'(x) = -2x\\,e^{-x^2/4} = 0$",
            "$e^{-x^2/4}\\ne 0 \\;\\Rightarrow\\; -2x = 0$",
            '$x = 0$',
            '$f(0) = 4e^{0} = 4$, ולכן נקודת הקיצון היא $(0,\\,4)$',
            "$\\begin{array}{c|c|c|c} x & x<0 & 0 & x>0 \\\\ \\hline f'(x) & + & 0 & - \\\\ f(x) & \\nearrow & 4 & \\searrow \\end{array}$",
            'משמאל ל-$0$ הפונקציה עולה ומימין יורדת, ולכן זו נקודת מקסימום',
          ],
          final_answer: 'נקודת מקסימום: $\\;(0,\\,4)$.',
        },
      },
      {
        label: 'ג4',
        prompt: 'שרטטו סקיצה של גרף הפונקציה $f(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 224 172',
            svg: `
              <line x1="8" y1="150" x2="216" y2="150" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="112" y1="20" x2="112" y2="164" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="208" y="146" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="116" y="28" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <path d="M 12,149.7 L 32,148 L 52,138 L 72,109 L 92,63 L 112,38 L 132,63 L 152,109 L 172,138 L 192,148 L 212,149.7" fill="none" stroke="#f472b6" stroke-width="1.9"/>
              <circle cx="112" cy="38" r="2.8" fill="#4ade80"/>
              <text x="116" y="46" fill="#4ade80" font-size="9.5" font-weight="bold" font-family="Heebo, sans-serif">(0,4)</text>
              <text x="158" y="146" fill="#60a5fa" font-size="8.5" font-family="Heebo, sans-serif">y=0</text>
            `,
            caption:
              'גרף $f(x)=4e^{-x^2/4}$: פעמון סימטרי לציר $y$, מקסימום ב-$(0,4)$, ואסימפטוטה מאוזנת $y=0$ (הגרף תמיד מעל ציר $x$).',
          },
        ],
        solution: {
          steps: [
            'הפונקציה זוגית ולכן סימטרית לציר $y$',
            'מקסימום יחיד בנקודה $(0,4)$',
            'אסימפטוטה מאוזנת $y=0$, והפונקציה תמיד חיובית ($f(x)>0$)',
            'מתקבל גרף בצורת פעמון',
          ],
          final_answer:
            'גרף פעמון סימטרי לציר $y$, מקסימום $(0,4)$, ומתקרב ל-$y=0$ בקצוות (ראו סרטוט).',
        },
      },
      {
        label: 'ד',
        prompt:
          "נתונות הפונקציות $m(x)=e^{h(x)}$ ו-$h(x)=\\dfrac{1}{f'(x)}$. שלושה מבין הגרפים $I$–$IV$ שלמטה מתארים את הפונקציות $f'(x),\\,h(x),\\,m(x)$. התאימו לכל פונקציה את הגרף המתאר אותה.",
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 312 300',
            svg: `
              <line x1="12" y1="70" x2="140" y2="70" stroke="rgba(148,163,184,0.55)" stroke-width="1"/>
              <line x1="75" y1="14" x2="75" y2="126" stroke="rgba(148,163,184,0.55)" stroke-width="1"/>
              <text x="143" y="73" fill="#94a3b8" font-size="8" font-family="Heebo, sans-serif">x</text>
              <text x="78" y="16" fill="#94a3b8" font-size="8" font-family="Heebo, sans-serif">y</text>
              <path d="M 15,68 L 45,59 L 61,38 L 69,16 L 75,20 L 85,34 L 95,48 L 115,63 L 135,68" fill="none" stroke="#60a5fa" stroke-width="1.7"/>
              <text x="68" y="143" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">II</text>

              <line x1="160" y1="70" x2="300" y2="70" stroke="rgba(148,163,184,0.55)" stroke-width="1"/>
              <line x1="225" y1="14" x2="225" y2="126" stroke="rgba(148,163,184,0.55)" stroke-width="1"/>
              <text x="303" y="73" fill="#94a3b8" font-size="8" font-family="Heebo, sans-serif">x</text>
              <text x="228" y="16" fill="#94a3b8" font-size="8" font-family="Heebo, sans-serif">y</text>
              <path d="M 149,18 L 165,46 L 185,60 L 196.8,61 L 205,60 L 215,54 L 219,44 L 221,32 L 222.6,18" fill="none" stroke="#60a5fa" stroke-width="1.7"/>
              <path d="M 227.4,122 L 229,108 L 231,96 L 235,86 L 245,80 L 253.2,79 L 265,80 L 285,94 L 295,116 L 299,121" fill="none" stroke="#60a5fa" stroke-width="1.7"/>
              <text x="220" y="143" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">I</text>

              <line x1="12" y1="220" x2="140" y2="220" stroke="rgba(148,163,184,0.55)" stroke-width="1"/>
              <line x1="75" y1="164" x2="75" y2="276" stroke="rgba(148,163,184,0.55)" stroke-width="1"/>
              <text x="143" y="223" fill="#94a3b8" font-size="8" font-family="Heebo, sans-serif">x</text>
              <text x="78" y="166" fill="#94a3b8" font-size="8" font-family="Heebo, sans-serif">y</text>
              <path d="M 19,168 L 25,173 L 35,185 L 46.7,188 L 55,186 L 61,168" fill="none" stroke="#60a5fa" stroke-width="1.7"/>
              <path d="M 80,216 L 88,213 L 95,210 L 103,210 L 115,211 L 125,213 L 135,216" fill="none" stroke="#60a5fa" stroke-width="1.7"/>
              <circle cx="75" cy="220" r="2.6" fill="none" stroke="#60a5fa" stroke-width="1.4"/>
              <text x="65" y="290" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">IV</text>

              <line x1="160" y1="220" x2="300" y2="220" stroke="rgba(148,163,184,0.55)" stroke-width="1"/>
              <line x1="225" y1="164" x2="225" y2="276" stroke="rgba(148,163,184,0.55)" stroke-width="1"/>
              <text x="303" y="223" fill="#94a3b8" font-size="8" font-family="Heebo, sans-serif">x</text>
              <text x="228" y="166" fill="#94a3b8" font-size="8" font-family="Heebo, sans-serif">y</text>
              <path d="M 165,206 L 185,188 L 196.8,182 L 211,193 L 225,220 L 239,247 L 253.2,258 L 265,252 L 285,234" fill="none" stroke="#60a5fa" stroke-width="1.7"/>
              <text x="218" y="290" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">III</text>
            `,
            caption:
              "ארבעת הגרפים $I$–$IV$ הנתונים בשאלה; שלושה מהם מתארים את $f'(x),\\,h(x),\\,m(x)$.",
          },
        ],
        hints: [
          "$f'(x)=-2x\\,e^{-x^2/4}$ אי-זוגית, מתאפסת ב-$x=0$ ושואפת ל-$0$ בקצוות (נגזרת של פעמון).",
          "$h=\\dfrac{1}{f'}$ — אסימפטוטה אנכית ב-$x=0$ (שם $f'=0$); $h>0$ ל-$x<0$ ו-$h<0$ ל-$x>0$.",
          '$m=e^{h}$ — תמיד חיובית; ל-$x<0$ ($h>0$) ערכיה $>1$ ושואפות ל-$\\infty$, ל-$x>0$ ($h<0$) ערכיה בין $0$ ל-$1$.',
        ],
        solution: {
          steps: [
            "$f'(x)=-2x\\,e^{-x^2/4}$: אי-זוגית, $f'(0)=0$, חיובית ל-$x<0$ ושלילית ל-$x>0$, שואפת ל-$0$ — מתאים לגרף $III$",
            "$h(x)=\\dfrac{1}{f'(x)}$: אסימפטוטה אנכית ב-$x=0$, $h>0$ ל-$x<0$ ו-$h<0$ ל-$x>0$ — מתאים לגרף $I$",
            '$m(x)=e^{h(x)}$: תמיד חיובית; ל-$x<0$ גדולה מ-$1$ ושואפת ל-$\\infty$ ליד $x=0^-$, ל-$x>0$ בין $0$ ל-$1$ — מתאים לגרף $IV$',
          ],
          final_answer:
            "$f'(x)\\leftrightarrow III$, $\\;\\;h(x)\\leftrightarrow I$, $\\;\\;m(x)\\leftrightarrow IV$. (הגרף $II$ אינו בשימוש.)",
        },
      },
      {
        label: 'ה1',
        prompt: 'מצאו את תחומי הירידה של הפונקציה $m(x)$.',
        answer_type: 'expression',
        hints: [
          "$m=e^{h}\\Rightarrow m'(x)=h'(x)\\,e^{h(x)} = -\\dfrac{f''(x)}{\\left(f'(x)\\right)^2}\\,e^{1/f'(x)}$. מצאו היכן $m'(x)=0$.",
          "הגורמים $e^{1/f'(x)}\\ne 0$ ו-$\\left(f'(x)\\right)^2>0$, אז $\\;m'(x)=0 \\Leftrightarrow f''(x)=0$. פתרו, ואז קראו את תחומי הירידה מגרף $m$ (גרף $IV$).",
        ],
        solution: {
          steps: [
            "$m'(x) = h'(x)\\,e^{h(x)} = -\\dfrac{f''(x)}{\\left(f'(x)\\right)^2}\\,e^{1/f'(x)}$",
            "נשווה לאפס: $\\;e^{1/f'(x)}\\ne 0$ ו-$\\left(f'(x)\\right)^2>0$, ולכן $\\;m'(x)=0 \\Leftrightarrow f''(x)=0$",
            "$f''(x) = e^{-x^2/4}\\left(x^2-2\\right) = 0$",
            "$e^{-x^2/4}\\ne 0 \\;\\Rightarrow\\; x^2-2=0$",
            "$x=\\pm\\sqrt2$",
            "לפי גרף $m(x)$ (גרף $IV$): הפונקציה יורדת משמאל ל-$-\\sqrt2$ ומימין ל-$\\sqrt2$",
          ],
          final_answer:
            'תחומי ירידה של $m(x)$: $\\;x<-\\sqrt2\\;$ וגם $\\;x>\\sqrt2$ $\\;$ (כלומר $(-\\infty,-\\sqrt2)\\cup(\\sqrt2,\\infty)$).',
        },
      },
      {
        label: 'ה2',
        prompt:
          'קבעו אם הביטוי $\\;\\displaystyle\\int_1^2 h(x)\\cdot m(x)\\,dx\\;$ חיובי או שלילי. נמקו את קביעתכם.',
        answer_type: 'proof',
        hints: [
          'בדקו את סימן המכפלה $h(x)\\cdot m(x)$ בתחום $[1,2]$ (שם $x>0$).',
          "ל-$x>0$: $f'(x)<0$ ולכן $h=\\dfrac{1}{f'}<0$; ו-$m=e^{h}>0$ תמיד. מהו סימן המכפלה?",
        ],
        solution: {
          steps: [
            'בתחום $[1,2]$ מתקיים $x>0$',
            "$f'(x)=-2x\\,e^{-x^2/4}<0$ עבור $x>0 \\;\\Rightarrow\\; h(x)=\\dfrac{1}{f'(x)}<0$",
            '$m(x)=e^{h(x)}>0$ תמיד',
            'לכן המכפלה $\\;h(x)\\cdot m(x) < 0\\;$ בכל הקטע $[1,2]$',
            'אינטגרל מסוים של פונקציה רציפה ושלילית הוא שלילי',
          ],
          final_answer:
            'הביטוי $\\;\\int_1^2 h(x)\\cdot m(x)\\,dx\\;$ שלילי.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q5 — חקירת פונקציית ln: f(x)=(1-lnx)/lnx=1/lnx-1 (ת"ה 0<x≠1, אנכית x=1,
  //      אופקית y=-1, יורדת תמיד, חיתוך (e,0)); g(x)=ln(-f(x)) (ת"ה (0,1)∪(e,∞),
  //      אנכיות x=1 ו-x=e, אופקית y=0, חיובית/שלילית); השוואת אינטגרלים I,II מול 1
  //      (g-f→1, עולה → II>I, וכל אחד <1 → הגדול III, הקטן I). פתרון לפי כתב-היד.
  // ===========================================================================
  {
    id: 'b2023s582sp-q5',
    year: 2023,
    season: 'summer',
    moed: 'special',
    paper: '582',
    questionNumber: 5,
    topic: 'פונקציית ln',
    totalPoints: 25,
    context: 'נתונה הפונקציה $\\;f(x) = \\dfrac{1 - \\ln x}{\\ln x}$.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצאו את תחום ההגדרה של הפונקציה $f(x)$.',
        answer_type: 'expression',
        hints: [
          'שני תנאים: $\\ln x$ מוגדר רק עבור $x>0$, והמכנה $\\ln x$ חייב להיות שונה מ-$0$.',
        ],
        solution: {
          steps: [
            '$\\ln x$ מוגדר $\\;\\Rightarrow\\; x>0$',
            'המכנה $\\ln x \\ne 0 \\;\\Rightarrow\\; x \\ne 1$',
            'שני התנאים יחד: $\\;x>0$ וגם $x\\ne 1$',
          ],
          final_answer: 'תחום ההגדרה: $\\;0<x$ ו-$x\\ne 1$ $\\;$ (כלומר $(0,1)\\cup(1,\\infty)$).',
        },
      },
      {
        label: 'א2',
        prompt: 'מצאו את משוואות האסימפטוטות המאונכות לצירים של $f(x)$.',
        answer_type: 'expression',
        hints: [
          'אסימפטוטה אנכית: היכן המכנה $\\ln x$ מתאפס (והמונה אינו $0$).',
          'אסימפטוטה אופקית: בדקו את גבול $f(x)$ כאשר $x\\to\\infty$ וכאשר $x\\to0^+$. נוח לכתוב $f(x)=\\dfrac{1}{\\ln x}-1$.',
        ],
        solution: {
          steps: [
            'אנכית: המכנה $\\ln x = 0$ ב-$x=1$, והמונה שם $1-\\ln 1 = 1\\ne 0$',
            'לכן יש אסימפטוטה אנכית $\\;x=1$',
            'נכתוב $\\;f(x)=\\dfrac{1-\\ln x}{\\ln x}=\\dfrac{1}{\\ln x}-1$',
            'כאשר $x\\to\\infty$: $\\;\\ln x\\to\\infty$, אז $\\dfrac{1}{\\ln x}\\to 0$ ו-$f(x)\\to -1$',
            'כאשר $x\\to0^+$: $\\;\\ln x\\to -\\infty$, אז $\\dfrac{1}{\\ln x}\\to 0$ ו-$f(x)\\to -1$',
            'לכן יש אסימפטוטה אופקית $\\;y=-1$',
          ],
          final_answer: 'אנכית: $\\;x=1$; $\\;$ אופקית: $\\;y=-1$.',
        },
      },
      {
        label: 'א3',
        prompt: 'מצאו את תחומי העלייה והירידה של $f(x)$ (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          "כתבו $f(x)=\\dfrac{1}{\\ln x}-1=(\\ln x)^{-1}-1$ וגזרו (כלל השרשרת).",
          "בדקו את הסימן של $f'(x)$ בכל תחום ההגדרה. שימו לב ש-$x>0$ ו-$\\ln^2 x>0$.",
        ],
        solution: {
          steps: [
            "$f(x)=(\\ln x)^{-1}-1$",
            "$f'(x) = -1\\cdot(\\ln x)^{-2}\\cdot\\dfrac{1}{x} = -\\dfrac{1}{x\\,\\ln^2 x}$",
            "בתחום ההגדרה: $\\;x>0$ ו-$\\ln^2 x>0$, לכן $\\;x\\,\\ln^2 x>0$",
            "$f'(x) = -\\dfrac{1}{x\\,\\ln^2 x} < 0$ לכל $x$ בתחום ההגדרה",
            "$f'(x)\\ne 0$ לעולם, ולכן אין נקודות קיצון, והפונקציה יורדת בכל ענף",
          ],
          final_answer: 'הפונקציה יורדת ב-$(0,1)$ וב-$(1,\\infty)$; אין תחומי עלייה.',
        },
      },
      {
        label: 'א4',
        prompt: 'שרטטו סקיצה של גרף הפונקציה $f(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 240 200',
            svg: `
              <line x1="10" y1="80" x2="232" y2="80" stroke="rgba(226,232,240,0.55)" stroke-width="1"/>
              <line x1="36" y1="10" x2="36" y2="192" stroke="rgba(226,232,240,0.55)" stroke-width="1"/>
              <text x="226" y="77" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">x</text>
              <text x="40" y="17" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">y</text>
              <line x1="60" y1="10" x2="60" y2="192" stroke="rgba(251,191,36,0.7)" stroke-width="1.1" stroke-dasharray="4 3"/>
              <text x="62" y="18" fill="#fbbf24" font-size="8.5" font-family="Heebo, sans-serif">x=1</text>
              <line x1="10" y1="96" x2="232" y2="96" stroke="rgba(96,165,250,0.55)" stroke-width="1.1" stroke-dasharray="4 3"/>
              <text x="198" y="93" fill="#60a5fa" font-size="8.5" font-family="Heebo, sans-serif">y=-1</text>
              <path d="M 65,12 L 69.6,48.4 L 76.8,65.8 L 84,72.9 L 101.2,80 L 120,83.2 L 156,86.1 L 204,87.8 L 232,88.4" fill="none" stroke="#f472b6" stroke-width="1.8"/>
              <path d="M 36,97 L 39.6,104.4 L 45.6,113.5 L 50.4,127.3 L 55.2,167.7 L 56.5,190" fill="none" stroke="#f472b6" stroke-width="1.8"/>
              <circle cx="36" cy="96" r="2.6" fill="none" stroke="#f472b6" stroke-width="1.3"/>
              <circle cx="101.2" cy="80" r="2.8" fill="#4ade80"/>
              <text x="98" y="74" fill="#4ade80" font-size="9.5" font-weight="bold" font-family="Heebo, sans-serif">e</text>
            `,
            caption:
              'גרף $f(x)=\\dfrac{1}{\\ln x}-1$: אסימפטוטה אנכית $x=1$, אסימפטוטה אופקית $y=-1$, חיתוך עם ציר $x$ ב-$(e,0)$, ויורד בשני הענפים.',
          },
        ],
        hints: [
          'אספו את הממצאים: תחום $x>0,\\,x\\ne1$; אנכית $x=1$; אופקית $y=-1$; יורדת תמיד; חיתוך ציר $x$ ב-$(e,0)$.',
        ],
        solution: {
          steps: [
            'חיתוך עם ציר $x$: $\\;f(x)=0 \\Rightarrow 1-\\ln x=0$',
            '$\\ln x=1 \\Rightarrow x=e$',
            'מתקבלת הנקודה $(e,0)$',
            'ענף $0<x<1$: $\\;\\ln x<0$, הפונקציה מתחת ל-$y=-1$, יורדת מ-$y\\to-1$ (ב-$x\\to0^+$) עד $-\\infty$ (ב-$x\\to1^-$)',
            'ענף $x>1$: יורדת מ-$+\\infty$ (ב-$x\\to1^+$) דרך $(e,0)$ ומתקרבת ל-$y=-1$ (ב-$x\\to\\infty$)',
          ],
          final_answer:
            'גרף בעל אסימפטוטה אנכית $x=1$ ואופקית $y=-1$, חיתוך $(e,0)$, יורד בשני הענפים (ראו סרטוט).',
        },
      },
      {
        label: 'ב1',
        prompt:
          'נתונה הפונקציה $\\;g(x)=\\ln\\!\\left(-f(x)\\right)$. מצאו את תחום ההגדרה של $g(x)$.',
        answer_type: 'expression',
        hints: [
          '$\\ln$ מוגדר רק עבור ארגומנט חיובי: $\\;-f(x)>0$, כלומר $f(x)<0$.',
          'פתרו $\\dfrac{1-\\ln x}{\\ln x}<0$ בעזרת סימני המונה והמכנה, בתוך תחום ההגדרה של $f$.',
        ],
        solution: {
          steps: [
            'תנאי: $\\;-f(x)>0 \\Rightarrow f(x)<0$',
            '$\\dfrac{1-\\ln x}{\\ln x}<0$',
            'המונה $1-\\ln x$: חיובי ל-$x<e$, שלילי ל-$x>e$',
            'המכנה $\\ln x$: שלילי ל-$0<x<1$, חיובי ל-$x>1$',
            'המנה שלילית כאשר למונה ולמכנה סימנים מנוגדים:',
            'מקרה 1: $\\;0<x<1$ (מונה $+$, מכנה $-$) — ולכן מתאים',
            'מקרה 2: $\\;x>e$ (מונה $-$, מכנה $+$) — ולכן מתאים',
          ],
          final_answer:
            'תחום ההגדרה של $g$: $\\;(0,1)\\cup(e,\\infty)$ $\\;$ (כלומר $0<x<1$ או $x>e$).',
        },
      },
      {
        label: 'ב2',
        prompt: 'מצאו את משוואות האסימפטוטות המאונכות לצירים של $g(x)$.',
        answer_type: 'expression',
        hints: [
          'בדקו את הגבולות בקצות תחום ההגדרה: $\\;x\\to1^-$, $\\;x\\to e^+$, $\\;x\\to\\infty$, $\\;x\\to0^+$.',
          'זכרו $g=\\ln(-f)$: כאשר $-f\\to\\infty$ אז $g\\to\\infty$, וכאשר $-f\\to0^+$ אז $g\\to-\\infty$.',
        ],
        solution: {
          steps: [
            'כאשר $x\\to1^-$: $\\;f(x)\\to-\\infty$, אז $-f(x)\\to+\\infty$ ו-$g\\to+\\infty$, ולכן אסימפטוטה אנכית $x=1$',
            'כאשר $x\\to e^+$: $\\;f(x)\\to0^-$, אז $-f(x)\\to0^+$ ו-$g\\to-\\infty$, ולכן אסימפטוטה אנכית $x=e$',
            'כאשר $x\\to\\infty$: $\\;f(x)\\to-1$, אז $-f(x)\\to1$ ו-$g\\to\\ln 1=0$, ולכן אסימפטוטה אופקית $y=0$',
            '(גם כאשר $x\\to0^+$: $\\;f\\to-1$, $\\,-f\\to1$, $\\,g\\to0$ — הגרף מתקרב ל-$y=0$)',
          ],
          final_answer: 'אנכיות: $\\;x=1$ ו-$x=e$; $\\;$ אופקית: $\\;y=0$.',
        },
      },
      {
        label: 'ב3',
        prompt: 'מצאו את תחומי החיוביות והשליליות של $g(x)$.',
        answer_type: 'expression',
        hints: [
          '$g=\\ln(-f)$. הסימן של $\\ln$ נקבע לפי האם הארגומנט גדול או קטן מ-$1$: $\\;g>0\\Leftrightarrow -f>1$, ו-$g<0\\Leftrightarrow 0<-f<1$.',
          '$-f>1 \\Leftrightarrow f<-1$, ו-$0<-f<1 \\Leftrightarrow -1<f<0$. בדקו בכל ענף של תחום ההגדרה $(0,1)\\cup(e,\\infty)$.',
        ],
        solution: {
          steps: [
            '$g>0 \\;\\Leftrightarrow\\; -f(x)>1$',
            '$-f(x)>1 \\;\\Leftrightarrow\\; f(x)<-1$',
            '$f(x)<-1 \\;\\Leftrightarrow\\; \\dfrac{1}{\\ln x}-1<-1$',
            '$\\dfrac{1}{\\ln x}-1<-1 \\;\\Leftrightarrow\\; \\dfrac{1}{\\ln x}<0$',
            '$\\dfrac{1}{\\ln x}<0 \\;\\Leftrightarrow\\; 0<x<1$',
            'בענף $(0,1)$: $\\;g(x)>0$',
            '$g<0 \\;\\Leftrightarrow\\; 0<-f(x)<1$',
            '$0<-f(x)<1 \\;\\Leftrightarrow\\; -1<f(x)<0$, וזה מתקיים בענף $x>e$',
            'בענף $(e,\\infty)$: $\\;g(x)<0$',
          ],
          final_answer: 'חיובית ב-$(0,1)$; $\\;$ שלילית ב-$(e,\\infty)$.',
        },
      },
      {
        label: 'ב4',
        prompt: 'שרטטו סקיצה של גרף הפונקציה $g(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 250 210',
            svg: `
              <line x1="10" y1="95" x2="244" y2="95" stroke="rgba(226,232,240,0.55)" stroke-width="1"/>
              <line x1="34" y1="15" x2="34" y2="198" stroke="rgba(226,232,240,0.55)" stroke-width="1"/>
              <text x="238" y="92" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">x</text>
              <text x="38" y="22" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">y</text>
              <line x1="54" y1="15" x2="54" y2="198" stroke="rgba(251,191,36,0.7)" stroke-width="1.1" stroke-dasharray="4 3"/>
              <text x="46" y="26" fill="#fbbf24" font-size="8.5" font-family="Heebo, sans-serif">x=1</text>
              <line x1="88" y1="15" x2="88" y2="198" stroke="rgba(251,191,36,0.7)" stroke-width="1.1" stroke-dasharray="4 3"/>
              <text x="82" y="26" fill="#fbbf24" font-size="8.5" font-family="Heebo, sans-serif">x=e</text>
              <path d="M 34,95 L 38,85.3 L 42,80.2 L 46,73.3 L 49,65 L 51.6,51.5 L 53,35" fill="none" stroke="#f472b6" stroke-width="1.8"/>
              <path d="M 90,165 L 94,143.2 L 104,127 L 114,120.5 L 134,114.4 L 174,109.4 L 234,106.4" fill="none" stroke="#f472b6" stroke-width="1.8"/>
              <circle cx="34" cy="95" r="2.6" fill="none" stroke="#f472b6" stroke-width="1.3"/>
            `,
            caption:
              'גרף $g(x)=\\ln(-f(x))$, מוגדר ב-$(0,1)\\cup(e,\\infty)$: אסימפטוטות אנכיות $x=1$ ו-$x=e$, אסימפטוטה אופקית $y=0$. $g>0$ ב-$(0,1)$ ו-$g<0$ ב-$(e,\\infty)$.',
          },
        ],
        hints: [
          'השתמשו בתחום $(0,1)\\cup(e,\\infty)$, באסימפטוטות $x=1,\\,x=e,\\,y=0$, ובסימנים: $g>0$ ב-$(0,1)$ ו-$g<0$ ב-$(e,\\infty)$.',
        ],
        solution: {
          steps: [
            'ענף $(0,1)$: $\\;g>0$, עולה מ-$g\\to0$ (ב-$x\\to0^+$) עד $+\\infty$ (ב-$x\\to1^-$)',
            'ענף $(e,\\infty)$: $\\;g<0$, עולה מ-$-\\infty$ (ב-$x\\to e^+$) ומתקרב ל-$y=0$ (ב-$x\\to\\infty$)',
            'בין $x=1$ ל-$x=e$ הפונקציה אינה מוגדרת',
          ],
          final_answer:
            'שני ענפים: ב-$(0,1)$ מעל ציר $x$ (עד האסימפטוטה $x=1$), וב-$(e,\\infty)$ מתחת לציר $x$ (מהאסימפטוטה $x=e$ ומתקרב ל-$y=0$). ראו סרטוט.',
        },
      },
      {
        label: 'ג',
        prompt: [
          'נסמן ב-$a$ את שיעור ה-$x$ של נקודת החיתוך של גרף הפונקציה $f(x)$ וגרף הפונקציה $g(x)$.',
          'מבין שלושת הביטויים קבעו איזה הוא הגדול ביותר ואיזה הקטן ביותר (אין צורך למצוא את הערך של $a$). נמקו את תשובתכם.',
          '',
          'I. $\\;\\displaystyle\\int_{a+1}^{a+2}\\big(g(x)-f(x)\\big)\\,dx$',
          'II. $\\;\\displaystyle\\int_{a+3}^{a+4}\\big(g(x)-f(x)\\big)\\,dx$',
          'III. המספר $1$',
        ].join('\n'),
        answer_type: 'proof',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 300 200',
            svg: `
              <line x1="14" y1="52" x2="294" y2="52" stroke="rgba(226,232,240,0.55)" stroke-width="1"/>
              <text x="284" y="48" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">y=0</text>
              <line x1="20" y1="116" x2="290" y2="116" stroke="rgba(148,163,184,0.5)" stroke-width="1.1" stroke-dasharray="4 3"/>
              <text x="248" y="113" fill="#94a3b8" font-size="8.5" font-family="Heebo, sans-serif">y=-1</text>
              <line x1="34" y1="15" x2="34" y2="185" stroke="rgba(251,191,36,0.55)" stroke-width="1.1" stroke-dasharray="4 3"/>
              <text x="28" y="68" fill="#fbbf24" font-size="8.5" font-family="Heebo, sans-serif">e</text>
              <polygon points="193.6,89.3 193.6,86.6 212.9,85 212.9,90.3" fill="rgba(251,191,36,0.28)" stroke="none"/>
              <polygon points="232.2,91 232.2,83.6 251.4,82.5 251.4,91.7" fill="rgba(74,222,128,0.28)" stroke="none"/>
              <path d="M 34,52 L 39.3,57.75 L 58.6,69.9 L 77.9,76.3 L 97.1,80.3 L 135.7,85.2 L 174.3,88.3 L 212.9,90.3 L 251.4,91.7 L 290,92.9" fill="none" stroke="#f87171" stroke-width="1.8"/>
              <path d="M 42.8,180 L 48.9,154.3 L 58.6,133.7 L 77.9,114.1 L 97.1,104.2 L 135.7,94 L 174.3,88.3 L 212.9,85 L 251.4,82.5 L 290,80.6" fill="none" stroke="#60a5fa" stroke-width="1.8"/>
              <circle cx="174.3" cy="88.3" r="2.8" fill="#e2e8f0"/>
              <line x1="174.3" y1="49" x2="174.3" y2="55" stroke="#e2e8f0" stroke-width="1.2"/>
              <text x="171" y="46" fill="#e2e8f0" font-size="9" font-weight="bold" font-family="Heebo, sans-serif">a</text>
              <text x="200" y="80" fill="#fbbf24" font-size="9" font-weight="bold" font-family="Heebo, sans-serif">I</text>
              <text x="238" y="76" fill="#4ade80" font-size="9" font-weight="bold" font-family="Heebo, sans-serif">II</text>
              <text x="264" y="100" fill="#f87171" font-size="9" font-family="Heebo, sans-serif">f(x)</text>
              <text x="264" y="73" fill="#60a5fa" font-size="9" font-family="Heebo, sans-serif">g(x)</text>
            `,
            caption:
              'הגרפים $f(x)$ (ורוד) ו-$g(x)$ (כחול) נחתכים ב-$x=a$ (בתחום $x>e$). מימין ל-$a$ מתקיים $g>f$, וההפרש $g(x)-f(x)$ עולה ושואף ל-$1$ (כי $f\\to-1$ ו-$g\\to0$). השטח $I$ (קרוב ל-$a$) קטן מהשטח $II$ (רחוק יותר), ושניהם קטנים מ-$1$.',
          },
        ],
        hints: [
          'נקודת החיתוך $a$ נמצאת בתחום $x>e$ (שם שתי הפונקציות שליליות). מימין ל-$a$ מתקיים $g(x)>f(x)$, כך ש-$g-f>0$.',
          'לפונקציה $f$ אסימפטוטה $y=-1$ ולפונקציה $g$ אסימפטוטה $y=0$. מה קורה להפרש $g(x)-f(x)$ כאשר $x\\to\\infty$?',
          'ההפרש $g-f$ עולה ושואף ל-$1$ אך תמיד קטן מ-$1$. רוחב כל קטע אינטגרציה הוא $1$ — השוו את שני האינטגרלים ל-$1$.',
        ],
        solution: {
          steps: [
            'נקודת החיתוך $a$ היא בתחום $x>e$; מימין לה $\\;g(x)>f(x)$',
            'לכן $\\;g(x)-f(x)>0$',
            'אז שני האינטגרלים $\\text{I}$ ו-$\\text{II}$ חיוביים',
            'אסימפטוטות: $\\;f(x)\\to-1$ ו-$g(x)\\to0$ כאשר $x\\to\\infty$',
            'לכן ההפרש $\\;g(x)-f(x)\\to 0-(-1)=1$ כאשר $x\\to\\infty$, וההפרש עולה ומתקרב ל-$1$ אך תמיד $g(x)-f(x)<1$',
            'הקטעים $[a+1,a+2]$ ו-$[a+3,a+4]$ ברוחב $1$ כל אחד; הקטע של $\\text{II}$ ימינה יותר, שם ההפרש גדול יותר',
            '$\\text{II}>\\text{I}$',
            'בכל קטע $g-f<1$ והרוחב $1$, ולכן כל אינטגרל קטן מ-$1$: $\\;\\text{I}<1$ וגם $\\text{II}<1$',
            'מכאן הסדר: $\\;\\text{I}<\\text{II}<1=\\text{III}$',
          ],
          final_answer:
            'הגדול ביותר: $\\;\\text{III}$ (המספר $1$). $\\;$ הקטן ביותר: $\\;\\text{I}$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
