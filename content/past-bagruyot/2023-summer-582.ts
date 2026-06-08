/**
 * שאלון 582 — קיץ תשפ"ג (2023), מועד א'
 * =====================================
 *
 * המקור של השאלות: meyda.education.gov.il (משרד החינוך — נחלת הכלל).
 * הפתרונות נכתבו על-ידינו בסגנון האפליקציה; השיטה המתמטית עצמה כללית.
 *
 * תוכן השאלון:
 *   Q1 — גאומטריה אנליטית (אליפסה + פרבולה + מעגל; היקפי משולשים).
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2023Summer582: PastBagrutQuestion[] = [
  {
    id: 'b2023s582a-q1',
    year: 2023,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    totalPoints: 25,
    context: [
      'נתונה אליפסה שמשוואתה $\\;\\dfrac{x^2}{169} + \\dfrac{y^2}{169 - 4k^2} = 1$, כאשר $0 < k < 6.5$.',
      'הנקודה $F_1$ היא המוקד הימני של האליפסה, והנקודה $F_2$ היא המוקד השמאלי שלה.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 240 165',
        svg: `
          <line x1="8" y1="82" x2="232" y2="82" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <line x1="120" y1="8" x2="120" y2="156" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <text x="225" y="95" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
          <text x="108" y="16" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
          <ellipse cx="120" cy="82" rx="104" ry="60" fill="rgba(96,165,250,0.06)" stroke="rgba(96,165,250,0.9)" stroke-width="1.8"/>
          <circle cx="136" cy="82" r="3" fill="rgba(244,114,182,0.95)"/>
          <text x="132" y="98" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">F₁(2k,0)</text>
          <circle cx="104" cy="82" r="3" fill="rgba(56,189,248,0.95)"/>
          <text x="78" y="98" fill="#38bdf8" font-size="10" font-family="Heebo, sans-serif">F₂(-2k,0)</text>
        `,
        caption: 'האליפסה $\\dfrac{x^2}{169}+\\dfrac{y^2}{169-4k^2}=1$, מוקד ימני $F_1(2k,0)$ ומוקד שמאלי $F_2(-2k,0)$.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הביעו באמצעות $k$ את שיעורי הנקודות $F_1$ ו-$F_2$.',
        answer_type: 'expression',
        hints: [
          'באליפסה $\\dfrac{x^2}{a^2}+\\dfrac{y^2}{b^2}=1$ (עם $a^2 > b^2$) המוקדים על ציר $x$, ומתקיים $c^2 = a^2 - b^2$.',
          'כאן $a^2 = 169$ ו-$b^2 = 169 - 4k^2$. חשב $c^2$.',
        ],
        solution: {
          steps: [
            '$c^2 = a^2 - b^2$',
            '$c^2 = 169 - (169 - 4k^2)$',
            '$c^2 = 4k^2 \\Rightarrow c = 2k$',
            'המוקדים על ציר $x$: $\\;F_1(2k, 0)$, $\\;F_2(-2k, 0)$',
          ],
          final_answer: '$F_1(2k,\\,0)$, $\\;F_2(-2k,\\,0)$',
        },
      },
      {
        label: 'ב1',
        prompt: [
          'הנקודה $A$ נמצאת ברביע הראשון על פרבולה שמשוואתה קנונית והמוקד שלה נמצא בנקודה $F_1$, כך שמתקיים $AF_1 = 10k$.',
          '',
          'הביעו באמצעות $k$ את משוואת מדריך הפרבולה.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'פרבולה קנונית $y^2 = 4px$ — מוקדה $(p,0)$ ומדריכה $x = -p$.',
          'המוקד נתון: $F_1(2k,0)$, אז $p = 2k$.',
        ],
        solution: {
          steps: [
            'פרבולה קנונית $y^2 = 4px$: מוקד $(p, 0)$, מדריך $x = -p$',
            'המוקד $F_1(2k, 0) \\Rightarrow p = 2k$',
            'מדריך: $x = -2k$',
            'משוואת הפרבולה: $y^2 = 8kx$',
          ],
          final_answer: 'מדריך הפרבולה: $\\;x = -2k$  (והפרבולה $y^2 = 8kx$)',
        },
      },
      {
        label: 'ב2',
        prompt: 'הביעו באמצעות $k$ את שיעורי הנקודה $A$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-3, 10.5],
            yRange: [-10, 10],
            curves: [
              { fn: (x) => Math.sqrt(8 * x), domain: [0, 10.5], color: '#f472b6' },
              { fn: (x) => -Math.sqrt(8 * x), domain: [0, 10.5], color: '#f472b6', dashed: true },
            ],
            vAsymptotes: [{ x: -2, label: 'x=-2k' }],
            markedPoints: [
              { x: 2, y: 0, label: 'F₁' },
              { x: 8, y: 8, label: 'A' },
            ],
            caption: 'הפרבולה $y^2 = 8kx$ (עבור $k=1$): מוקד $F_1(2,0)$, מדריך $x=-2$, והנקודה $A(8,8)$ עם $AF_1 = 10$.',
          },
        ],
        hints: [
          'הגדרת פרבולה: המרחק מהמוקד שווה למרחק מהמדריך. המרחק מהמדריך $x=-2k$ הוא $x_A + 2k$.',
          'הצב $AF_1 = 10k$ כדי למצוא את $x_A$, ואז את $y_A$ מהפרבולה (רביע ראשון).',
        ],
        solution: {
          steps: [
            'הגדרת פרבולה: מרחק מהמוקד = מרחק מהמדריך',
            '$x_A - (-2k) = 10k$',
            '$x_A = 8k$',
            'על הפרבולה $y^2 = 8kx$: $\\;y_A^2 = 8k \\cdot 8k = 64k^2$',
            '$y_A = 8k$ (רביע ראשון)',
            '$A(8k,\\, 8k)$',
          ],
          final_answer: '$A(8k,\\, 8k)$',
        },
      },
      {
        label: 'ג',
        prompt: [
          '$AF_1$ הוא קוטר במעגל. הישר שמשוואתו $5x + 12y = 138$ משיק למעגל זה.',
          '',
          'מצאו את הערך של $k$.',
        ].join('\n'),
        answer_type: 'number',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 210 185',
            svg: `
              <line x1="10" y1="155" x2="202" y2="155" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="30" y1="12" x2="30" y2="172" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="195" y="168" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="18" y="20" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <circle cx="95" cy="103" r="65" fill="rgba(168,85,247,0.07)" stroke="rgba(168,85,247,0.9)" stroke-width="1.6"/>
              <line x1="56" y1="155" x2="134" y2="51" stroke="rgba(244,114,182,0.9)" stroke-width="1.6"/>
              <circle cx="56" cy="155" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="134" cy="51" r="3" fill="rgba(251,191,36,0.95)"/>
              <circle cx="95" cy="103" r="2.6" fill="rgba(168,85,247,0.95)"/>
              <line x1="20" y1="20" x2="200" y2="148" stroke="rgba(52,211,153,0.9)" stroke-width="1.5"/>
              <text x="46" y="168" fill="#f472b6" font-size="9.5" font-family="Heebo, sans-serif">F₁(2,0)</text>
              <text x="128" y="46" fill="#fbbf24" font-size="9.5" font-family="Heebo, sans-serif">A(8,8)</text>
              <text x="80" y="118" fill="#c4b5fd" font-size="9" font-family="Heebo, sans-serif">(5k,4k)</text>
              <text x="150" y="135" fill="#34d399" font-size="9" font-family="Heebo, sans-serif">5x+12y=138</text>
            `,
            caption: 'המעגל שקוטרו $AF_1$: מרכז $(5k,4k)$, רדיוס $5k$. הישר $5x+12y=138$ (ירוק) משיק לו.',
          },
        ],
        hints: [
          'קוטר $AF_1$: מרכז המעגל = אמצע $AF_1$, ורדיוסו = חצי מ-$AF_1 = 5k$.',
          'הישר משיק $\\Rightarrow$ המרחק ממרכז המעגל אל הישר שווה לרדיוס.',
          'בסוף יתקבלו שני פתרונות; בחר את זה שבתחום $0 < k < 6.5$.',
        ],
        solution: {
          steps: [
            'מרכז המעגל = אמצע $AF_1$: $\\;\\left(\\dfrac{8k+2k}{2},\\, \\dfrac{8k+0}{2}\\right) = (5k,\\, 4k)$',
            'רדיוס $= \\dfrac{AF_1}{2} = \\dfrac{10k}{2} = 5k$',
            'הישר משיק $\\Rightarrow$ מרחק מהמרכז לישר $=$ רדיוס:',
            '$\\dfrac{|5\\cdot 5k + 12\\cdot 4k - 138|}{\\sqrt{5^2 + 12^2}} = 5k$',
            '$\\dfrac{|73k - 138|}{13} = 5k$',
            '$|73k - 138| = 65k$',
            '$73k - 138 = 65k \\;\\Rightarrow\\; k = 17.25$ (מחוץ לתחום)',
            '$73k - 138 = -65k \\;\\Rightarrow\\; 138k = 138 \\;\\Rightarrow\\; k = 1$',
          ],
          final_answer: '$k = 1$  (בתחום $0 < k < 6.5$)',
        },
      },
      {
        label: 'ד',
        prompt: [
          '$D$ היא נקודה על האליפסה.',
          '',
          'קבעו אם היקף המשולש $F_1 A F_2$ גדול מהיקף המשולש $F_1 D F_2$, קטן ממנו או שווה לו. נמקו את קביעתכם.',
        ].join('\n'),
        answer_type: 'text',
        hints: [
          'הצלע $F_1F_2$ משותפת לשני המשולשים, אז משווים רק את סכום שתי הצלעות האחרות.',
          'נקודה על האליפסה: $DF_1 + DF_2 = 2a = 26$ (קבוע). חשב את $AF_1 + AF_2$ עבור $k=1$ והשווה.',
        ],
        solution: {
          steps: [
            'נציב $k = 1$: $\\;a = 13$, $\\;c = 2$, $\\;F_1(2,0)$, $\\;F_2(-2,0)$, $\\;A(8,8)$',
            '$F_1F_2 = 2c = 4$ (משותף לשני המשולשים)',
            '$D$ על האליפסה: $\\;DF_1 + DF_2 = 2a = 26$',
            'היקף $F_1DF_2 = 26 + 4 = 30$',
            '$AF_1 = 10k = 10$',
            '$AF_2 = \\sqrt{(8+2)^2 + 8^2} = \\sqrt{164} = 2\\sqrt{41} \\approx 12.81$',
            'היקף $F_1AF_2 = 10 + 2\\sqrt{41} + 4 \\approx 26.81$',
            '$26.81 < 30$',
          ],
          final_answer:
            'היקף $F_1AF_2$ קטן מהיקף $F_1DF_2$ ($\\approx 26.81 < 30$). הנימוק: $F_1F_2$ משותף, ו-$AF_1+AF_2 = 10+2\\sqrt{41} \\approx 22.81$ קטן מ-$DF_1+DF_2 = 2a = 26$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q2 — וקטורים במרחב: קוביה ABCDA'B'C'D' (אלכסון ראשי ⊥ מישור, מפגש תיכונים)
  // ===========================================================================
  {
    id: 'b2023s582a-q2',
    year: 2023,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 25,
    context: [
      'נתונה הקוביה $ABCDA\'B\'C\'D\'$ ($ABCD$ הבסיס התחתון, $A\'B\'C\'D\'$ הבסיס העליון).',
      'נסמן: $\\;\\vec{AB} = \\vec u$, $\\;\\vec{AD} = \\vec v$, $\\;\\vec{AA\'} = \\vec w$.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 220 200',
        svg: `
          <line x1="180" y1="125" x2="100" y2="125" stroke="rgba(148,163,184,0.4)" stroke-width="1" stroke-dasharray="3 3"/>
          <line x1="100" y1="125" x2="55" y2="155" stroke="rgba(148,163,184,0.4)" stroke-width="1" stroke-dasharray="3 3"/>
          <line x1="100" y1="125" x2="100" y2="45" stroke="rgba(148,163,184,0.4)" stroke-width="1" stroke-dasharray="3 3"/>
          <polygon points="135,155 180,45 100,125" fill="rgba(168,85,247,0.10)" stroke="rgba(168,85,247,0.6)" stroke-width="1"/>
          <line x1="55" y1="155" x2="135" y2="155" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="135" y1="155" x2="180" y2="125" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="55" y1="155" x2="55" y2="75" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="135" y1="155" x2="135" y2="75" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="180" y1="125" x2="180" y2="45" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="55" y1="75" x2="135" y2="75" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="135" y1="75" x2="180" y2="45" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="180" y1="45" x2="100" y2="45" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="100" y1="45" x2="55" y2="75" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="180" y1="125" x2="55" y2="75" stroke="rgba(244,114,182,0.95)" stroke-width="2"/>
          <circle cx="55" cy="155" r="2.4" fill="rgba(226,232,240,0.95)"/>
          <circle cx="135" cy="155" r="2.4" fill="rgba(226,232,240,0.95)"/>
          <circle cx="180" cy="125" r="2.4" fill="rgba(244,114,182,0.95)"/>
          <circle cx="100" cy="125" r="2.4" fill="rgba(226,232,240,0.95)"/>
          <circle cx="55" cy="75" r="2.4" fill="rgba(244,114,182,0.95)"/>
          <circle cx="135" cy="75" r="2.4" fill="rgba(226,232,240,0.95)"/>
          <circle cx="180" cy="45" r="2.4" fill="rgba(226,232,240,0.95)"/>
          <circle cx="100" cy="45" r="2.4" fill="rgba(226,232,240,0.95)"/>
          <text x="46" y="168" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">A</text>
          <text x="138" y="168" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">B</text>
          <text x="184" y="128" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">C</text>
          <text x="86" y="122" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">D</text>
          <text x="42" y="74" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">A'</text>
          <text x="138" y="72" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">B'</text>
          <text x="184" y="44" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">C'</text>
          <text x="86" y="42" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">D'</text>
        `,
        caption: 'הקוביה $ABCDA\'B\'C\'D\'$. מודגשים: האלכסון הראשי $CA\'$ (ורוד) והמישור $BC\'D$ (סגול).',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הוכיחו כי האלכסון $CA\'$ מאונך למישור $BC\'D$.',
        answer_type: 'proof',
        hints: [
          'בטא את $\\vec{CA\'}$ דרך מסלול: $\\vec{CA\'} = \\vec{CB} + \\vec{BA} + \\vec{AA\'}$.',
          'בקוביה הצלעות מאונכות ושוות: $\\vec u\\cdot\\vec v = \\vec u\\cdot\\vec w = \\vec v\\cdot\\vec w = 0$ ו-$|\\vec u| = |\\vec v| = |\\vec w|$.',
          'הראה ש-$\\vec{CA\'}$ מאונך לשני וקטורים במישור, למשל $\\vec{BD}$ ו-$\\vec{BC\'}$.',
        ],
        solution: {
          steps: [
            '$\\vec{CA\'} = \\vec{CB} + \\vec{BA} + \\vec{AA\'} = -\\vec v - \\vec u + \\vec w$',
            'בקוביה: $\\vec u\\cdot\\vec v = \\vec u\\cdot\\vec w = \\vec v\\cdot\\vec w = 0$, $\\;\\;|\\vec u| = |\\vec v| = |\\vec w|$',
            '$\\vec{BD} = \\vec{BC} + \\vec{CD} = \\vec v - \\vec u$',
            '$\\vec{BC\'} = \\vec{BC} + \\vec{CC\'} = \\vec v + \\vec w$',
            '$\\vec{CA\'}\\cdot\\vec{BD} = (-\\vec v - \\vec u + \\vec w)\\cdot(\\vec v - \\vec u) = -|\\vec v|^2 + |\\vec u|^2 = 0$',
            '$\\vec{CA\'}\\cdot\\vec{BC\'} = (-\\vec v - \\vec u + \\vec w)\\cdot(\\vec v + \\vec w) = -|\\vec v|^2 + |\\vec w|^2 = 0$',
            '$\\vec{CA\'}$ מאונך לשני וקטורים בלתי-תלויים במישור $\\Rightarrow CA\' \\perp$ מישור $BC\'D$',
          ],
          final_answer: 'הוכח: $\\vec{CA\'}\\perp\\vec{BD}$ וגם $\\vec{CA\'}\\perp\\vec{BC\'}$, ולכן $CA\'$ מאונך למישור $BC\'D$',
        },
      },
      {
        label: 'ב1',
        prompt: 'נקודה $E$ היא מפגש התיכונים במשולש $BC\'D$. הביעו את הווקטור $\\vec{CE}$ באמצעות $\\vec u,\\,\\vec v,\\,\\vec w$.',
        answer_type: 'expression',
        hints: [
          'מפגש התיכונים מחלק כל תיכון ביחס $2:1$ מהקודקוד. קח את התיכון מ-$C\'$ אל $F$, אמצע $BD$.',
          '$\\vec{CE} = \\vec{CC\'} + \\tfrac23\\vec{C\'F}$, ו-$\\vec{C\'F} = \\vec{C\'C} + \\vec{CB} + \\tfrac12\\vec{BD}$.',
        ],
        solution: {
          steps: [
            '$E$ מפגש תיכונים: על התיכון מ-$C\'$ לאמצע $F$ של $BD$, ביחס $2:1$',
            '$\\vec{CE} = \\vec{CC\'} + \\vec{C\'E} = \\vec w + \\tfrac23\\vec{C\'F}$',
            '$\\vec{C\'F} = \\vec{C\'C} + \\vec{CB} + \\tfrac12\\vec{BD} = -\\vec w - \\vec v + \\tfrac12\\vec{BD}$',
            '$\\vec{BD} = \\vec{BA} + \\vec{AD} = -\\vec u + \\vec v$',
            '$\\vec{C\'F} = -\\vec w - \\vec v + \\tfrac12(-\\vec u + \\vec v) = -\\vec w - \\tfrac12\\vec u - \\tfrac12\\vec v$',
            '$\\vec{CE} = \\vec w + \\tfrac23\\left(-\\vec w - \\tfrac12\\vec u - \\tfrac12\\vec v\\right) = \\tfrac13\\vec w - \\tfrac13\\vec v - \\tfrac13\\vec u$',
          ],
          final_answer: '$\\vec{CE} = \\tfrac13\\vec w - \\tfrac13\\vec v - \\tfrac13\\vec u = \\tfrac13(\\vec w - \\vec v - \\vec u)$',
        },
      },
      {
        label: 'ב2',
        prompt: 'הוכיחו כי הנקודות $E,\\,C$ ו-$A\'$ נמצאות על ישר אחד.',
        answer_type: 'proof',
        hints: [
          'השווה את $\\vec{CE}$ ל-$\\vec{CA\'}$ מסעיף א.',
          'אם $\\vec{CE} = \\lambda\\,\\vec{CA\'}$ והם חולקים את הנקודה $C$ — הנקודות על ישר אחד.',
        ],
        solution: {
          steps: [
            '$\\vec{CA\'} = -\\vec u - \\vec v + \\vec w$ (מסעיף א)',
            '$\\vec{CE} = \\tfrac13(\\vec w - \\vec v - \\vec u) = \\tfrac13\\vec{CA\'}$',
            '$\\vec{CE}$ ו-$\\vec{CA\'}$ מקבילים, ובעלי נקודה משותפת $C$',
          ],
          final_answer: 'הוכח: $\\vec{CE} = \\tfrac13\\vec{CA\'}$, ולכן $E,\\,C,\\,A\'$ נמצאות על ישר אחד',
        },
      },
      {
        label: 'ג1',
        prompt: [
          'נתון: $A(3,\\,n,\\,p)$, $\\;C(4,\\,3,\\,0)$, $\\;D(0,\\,0,\\,0)$ ($n,p$ פרמטרים), ושיעור ה-$z$ של $C\'$ חיובי.',
          '',
          'מצאו את שיעורי הנקודה $A$, והוכיחו כי $ABCD$ נמצא במישור $z = 0$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'בקוביה $\\vec{DA} \\perp \\vec{DC}$, ולכן $\\vec{DA}\\cdot\\vec{DC} = 0$ — מכאן $n$.',
          'הצלעות שוות: $|\\vec{DA}| = |\\vec{DC}|$ — מכאן $p$.',
        ],
        solution: {
          steps: [
            '$\\vec{DA}\\perp\\vec{DC}$: $\\;\\vec{DA}\\cdot\\vec{DC} = 0$',
            '$\\vec{DA} = (3, n, p)$, $\\;\\vec{DC} = (4, 3, 0)$',
            '$(3,n,p)\\cdot(4,3,0) = 12 + 3n = 0 \\Rightarrow n = -4$',
            '$|\\vec{DA}| = |\\vec{DC}|$: $\\;\\sqrt{9 + 16 + p^2} = \\sqrt{16 + 9}$',
            '$25 + p^2 = 25 \\Rightarrow p^2 = 0 \\Rightarrow p = 0$',
            '$A(3, -4, 0)$',
            '$A, C, D$ כולן עם $z = 0 \\Rightarrow$ המישור $ABCD$ הוא $z = 0$',
          ],
          final_answer: '$A(3, -4, 0)$. הנקודות $A, C, D$ כולן עם $z=0$, ולכן $ABCD$ במישור $z = 0$',
        },
      },
      {
        label: 'ג2',
        prompt: 'מצאו את שיעורי הנקודה $C\'$.',
        answer_type: 'expression',
        hints: [
          '$\\vec{CC\'}$ מאונך למישור $ABCD$ ($z=0$), אז הוא בכיוון ציר $z$: $\\vec{CC\'} = (0,0,z)$.',
          '$|\\vec{CC\'}| = |\\vec{DC}|$ (צלע קוביה), ושיעור ה-$z$ חיובי.',
        ],
        solution: {
          steps: [
            '$\\vec{CC\'} \\perp$ מישור $ABCD$ ($z=0$), אז $\\vec{CC\'} = (0, 0, z)$',
            '$|\\vec{CC\'}| = |\\vec{DC}|$: $\\;\\sqrt{0 + 0 + z^2} = \\sqrt{16 + 9}$',
            '$z^2 = 25 \\Rightarrow z = \\pm 5$',
            'שיעור $z$ של $C\'$ חיובי: $\\;z = 5$',
            '$C\' = C + (0,0,5) = (4, 3, 5)$',
          ],
          final_answer: '$C\'(4,\\, 3,\\, 5)$',
        },
      },
      {
        label: 'ד',
        prompt: '$\\ell$ הוא ישר החיתוך בין המישור $BC\'D$ ובין המישור $BCC\'B\'$. מצאו הצגה פרמטרית של הישר $\\ell$.',
        answer_type: 'expression',
        hints: [
          'הנקודות $B$ ו-$C\'$ נמצאות בשני המישורים גם יחד, ולכן הישר $BC\'$ הוא בדיוק ישר החיתוך.',
          'מצא תחילה את $B$ דרך $\\vec{AB} = \\vec{DC}$, ואז את וקטור הכיוון $\\vec{BC\'}$.',
        ],
        solution: {
          steps: [
            'נמצא את $B$: $\\;\\vec{AB} = \\vec{DC} \\Rightarrow B = A + (C - D)$',
            '$B = (3,-4,0) + (4,3,0) = (7, -1, 0)$',
            '$B$ ו-$C\'$ נמצאים בשני המישורים $\\Rightarrow \\ell$ הוא הישר $BC\'$',
            'וקטור כיוון: $\\vec{BC\'} = C\' - B = (-3, 4, 5)$',
            '$\\ell:\\;\\; X = (7,-1,0) + t(-3,4,5)$',
          ],
          final_answer: '$\\ell:\\;\\; X = (7,-1,0) + t(-3,4,5)$',
        },
      },
      {
        label: 'ה',
        prompt: 'מצאו הצגה פרמטרית של המישור המכיל את הישר $\\ell$ ואינו חותך את ציר ה-$x$.',
        answer_type: 'expression',
        hints: [
          'מישור שאינו חותך את ציר $x$ חייב להיות מקביל לו — כלומר להכיל את כיוון ציר ה-$x$, $(1,0,0)$.',
          'שני וקטורי הכיוון של המישור: $\\vec{BC\'} = (-3,4,5)$ (מהישר $\\ell$) ו-$(1,0,0)$.',
          'בדוק שאין חיתוך: נקודה על ציר $x$ דורשת $y=0$ ו-$z=0$ בו-זמנית.',
        ],
        solution: {
          steps: [
            'כדי שלא יחתוך את ציר $x$, המישור מקביל לציר $x$ — מכיל את הכיוון $(1,0,0)$',
            'וקטורי הכיוון: $\\vec{BC\'} = (-3,4,5)$ ו-$(1,0,0)$, דרך הנקודה $B(7,-1,0)$',
            '$X = (7,-1,0) + t(-3,4,5) + s(1,0,0)$',
            'בדיקה — נקודה כללית במישור: $(7-3t+s,\\;\\; -1+4t,\\;\\; 5t)$',
            'חיתוך עם ציר $x$ דורש $y=0$ ו-$z=0$: $\\;-1+4t=0 \\Rightarrow t=\\tfrac14$, אך $5t=0 \\Rightarrow t=0$',
            'סתירה ($t=\\tfrac14$ מול $t=0$) $\\Rightarrow$ המישור אינו חותך את ציר $x$',
          ],
          final_answer: 'המישור: $\\;X = (7,-1,0) + t(-3,4,5) + s(1,0,0)$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q3 — מספרים מרוכבים: z³ = 1/z³, משולש במישור גאוס, |w| ו-arg, n מינימלי
  // ===========================================================================
  {
    id: 'b2023s582a-q3',
    year: 2023,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 25,
    context: 'נתונה המשוואה $\\;z^3 = \\dfrac{1}{z^3}$ ($z$ מספר מרוכב). $\\;z_0$ הוא אחד מפתרונות המשוואה, ומיוצג על ידי נקודה ברביע הרביעי במישור גאוס.',
    parts: [
      {
        label: 'א',
        prompt: 'מצאו את המספר המרוכב $z_0$.',
        answer_type: 'expression',
        hints: [
          'כפול את שני האגפים ב-$z^3$ כדי לקבל $z^6 = 1$, ואז שורשי יחידה.',
          'שש פתרונות $z_k = \\text{cis}(60°k)$. בחר את זה שברביע הרביעי ($270° < \\theta < 360°$).',
        ],
        solution: {
          steps: [
            '$z^3 = \\dfrac{1}{z^3} \\Rightarrow z^6 = 1$',
            '$z^6 = \\text{cis}(0° + 360°k)$',
            '$z_k = \\text{cis}\\left(\\dfrac{360°k}{6}\\right) = \\text{cis}(60°k)$, $\\;k=0,1,2,3,4,5$',
            'רביע רביעי: $\\;270° < 60°k < 360°$',
            '$4.5 < k < 6 \\Rightarrow k = 5$',
            '$z_0 = \\text{cis}(300°) = \\tfrac12 - \\tfrac{\\sqrt3}{2}i$',
          ],
          final_answer: '$z_0 = \\text{cis}(300°) = \\tfrac12 - \\tfrac{\\sqrt3}{2}i$',
        },
      },
      {
        label: 'ב',
        prompt: [
          'הנקודות $A,\\,B,\\,C$ מיוצגות במישור גאוס על ידי המספרים $d\\cdot z_0$, $\\;d\\cdot i\\,z_0$ ו-$d\\cdot(z_0)^4$ בהתאמה ($d>0$ פרמטר).',
          'נתון כי שטח המשולש $ABC$ הוא $5d+6$.',
          '',
          'מצאו את הערך של $d$.',
        ].join('\n'),
        answer_type: 'number',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 220 200',
            svg: `
              <line x1="10" y1="100" x2="210" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="110" y1="14" x2="110" y2="190" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="203" y="113" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">Re</text>
              <text x="114" y="22" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">Im</text>
              <circle cx="110" cy="100" r="75" fill="none" stroke="rgba(148,163,184,0.35)" stroke-width="1.1" stroke-dasharray="3 3"/>
              <polygon points="148,165 175,63 72,35" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.9)" stroke-width="1.6"/>
              <line x1="148" y1="165" x2="72" y2="35" stroke="rgba(251,191,36,0.7)" stroke-width="1.2"/>
              <line x1="110" y1="100" x2="175" y2="63" stroke="rgba(56,189,248,0.8)" stroke-width="1.3"/>
              <circle cx="148" cy="165" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="175" cy="63" r="3" fill="rgba(56,189,248,0.95)"/>
              <circle cx="72" cy="35" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="110" cy="100" r="2.2" fill="rgba(226,232,240,0.9)"/>
              <text x="152" y="172" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">A (300°)</text>
              <text x="178" y="60" fill="#38bdf8" font-size="10" font-family="Heebo, sans-serif">B (30°)</text>
              <text x="48" y="32" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">C (120°)</text>
              <text x="98" y="113" fill="#cbd5e1" font-size="9" font-family="Heebo, sans-serif">O</text>
            `,
            caption: '$A,B,C$ על מעגל ברדיוס $d$: $\\;AC$ קוטר ($A,C$ אנטיפודליות), ו-$OB \\perp AC$ הוא גובה באורך $d$.',
          },
        ],
        hints: [
          'חשב את הזוויות: $A$ ב-$300°$, $B$ ב-$30°$, $C$ ב-$120°$. שים לב ש-$C = -A$.',
          'אם $AC$ קוטר ($=2d$) ו-$OB$ גובה ($=d$, מאונך ל-$AC$), אז $S = \\tfrac12\\cdot AC\\cdot OB$.',
        ],
        solution: {
          steps: [
            '$A = d z_0 = d\\,\\text{cis}(300°)$',
            '$B = d\\,i\\,z_0 = d\\,\\text{cis}(90°)\\,\\text{cis}(300°) = d\\,\\text{cis}(390°) = d\\,\\text{cis}(30°)$',
            '$C = d(z_0)^4 = d\\,\\text{cis}(4\\cdot 300°) = d\\,\\text{cis}(1200°) = d\\,\\text{cis}(120°)$',
            '$\\text{cis}(300°) = -\\text{cis}(120°) \\Rightarrow C = -A$, אז $AC$ קוטר: $\\;AC = 2d$',
            '$OB \\perp AC$ והוא גובה באורך $OB = d$',
            '$S_{ABC} = \\tfrac12\\,AC\\cdot OB = \\tfrac12\\cdot 2d\\cdot d = d^2$',
            '$d^2 = 5d + 6$',
            '$d^2 - 5d - 6 = 0 \\Rightarrow (d-6)(d+1) = 0$',
            '$d > 0 \\Rightarrow d = 6$',
          ],
          final_answer: '$d = 6$',
        },
      },
      {
        label: 'ג',
        prompt: 'נתון: $\\;w = \\left((z_0)^2 - \\dfrac{1}{(z_0)^2}\\right)(1+i)$. מצאו את $|w|$ ואת הארגומנט (הזווית) של $w$.',
        answer_type: 'expression',
        hints: [
          'חשב $(z_0)^2 = \\text{cis}(240°)$. שים לב ש-$\\dfrac{1}{(z_0)^2} = \\overline{(z_0)^2}$.',
          'ההפרש $z - \\bar z = 2i\\,\\text{Im}(z)$, אז $(z_0)^2 - \\dfrac{1}{(z_0)^2}$ מדומה טהור.',
          'כתוב $1+i = \\sqrt2\\,\\text{cis}(45°)$ והכפל בצורה קוטבית.',
        ],
        solution: {
          steps: [
            '$(z_0)^2 = (\\text{cis}300°)^2 = \\text{cis}(600°) = \\text{cis}(240°)$',
            '$\\dfrac{1}{(z_0)^2} = \\text{cis}(-240°) = \\overline{\\text{cis}(240°)}$',
            '$(z_0)^2 - \\dfrac{1}{(z_0)^2} = \\text{cis}(240°) - \\overline{\\text{cis}(240°)} = 2i\\,\\text{Im}(\\text{cis}240°)$',
            '$= 2i\\sin(240°) = 2i\\cdot\\left(-\\tfrac{\\sqrt3}{2}\\right) = -\\sqrt3\\,i$',
            '$1 + i = \\sqrt2\\,\\text{cis}(45°)$',
            '$w = (-\\sqrt3\\,i)\\cdot\\sqrt2\\,\\text{cis}(45°) = \\sqrt3\\,\\text{cis}(270°)\\cdot\\sqrt2\\,\\text{cis}(45°)$',
            '$w = \\sqrt6\\,\\text{cis}(315°) = \\sqrt6\\,\\text{cis}(-45°)$',
          ],
          final_answer: '$|w| = \\sqrt6$, $\\;\\arg(w) = -45°$',
        },
      },
      {
        label: 'ד',
        prompt: 'נתון כי $w^n$ ($n$ מספר טבעי) הוא מספר מדומה טהור, ונמצא מחוץ למעגל החוסם את המשולש $ABC$. מצאו את הערך המינימלי האפשרי של $n$.',
        answer_type: 'number',
        hints: [
          'המעגל החוסם את $ABC$ הוא ברדיוס $d = 6$ (כי $|A|=|B|=|C|=d$).',
          '"מחוץ למעגל": $|w^n| > 6$. "מדומה טהור": $\\text{Re}(w^n) = 0$.',
          'מ-$\\cos(-45n°) = 0$ מקבלים $n = -2 - 4k$; בחר את $n$ הטבעי המינימלי הגדול מ-$2$.',
        ],
        solution: {
          steps: [
            'המעגל החוסם את $ABC$ ברדיוס $d = 6$ (כי $|A|=|B|=|C|=6$)',
            '$w^n = (\\sqrt6)^n\\,\\text{cis}(-45n°) = 6^{n/2}\\,\\text{cis}(-45n°)$',
            'מחוץ למעגל: $\\;|w^n| > 6 \\Rightarrow 6^{n/2} > 6^1 \\Rightarrow n > 2$',
            'מדומה טהור: $\\;\\text{Re}(w^n) = 0 \\Rightarrow \\cos(-45n°) = 0$',
            '$-45n° = 90° + 180°k \\Rightarrow n = -2 - 4k$',
            '$k = -2 \\Rightarrow n = 6$ (מקיים גם $n > 2$)',
          ],
          final_answer: '$n_{\\min} = 6$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q4 — חקירת פונקציות: f(x)=(eˣ-1)ⁿ-4 (לפי זוגיות n), שטח מול g, ו-h=|f|
  // ===========================================================================
  {
    id: 'b2023s582a-q4',
    year: 2023,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 4,
    topic: 'חקירת פונקציות',
    totalPoints: 25,
    context: 'נתונה הפונקציה $\\;f(x) = (e^x - 1)^n - 4$, המוגדרת לכל $x$, כאשר $n$ מספר טבעי גדול או שווה ל-$2$.',
    parts: [
      {
        label: 'א1',
        prompt: 'ענו עבור $n$ זוגי ועבור $n$ אי-זוגי: מצאו את משוואת האסימפטוטה האופקית של $f(x)$.',
        answer_type: 'expression',
        hints: [
          'בדוק את הגבולות כש-$x\\to\\infty$ וכש-$x\\to-\\infty$.',
          'כש-$x\\to-\\infty$: $e^x\\to 0$, אז $f\\to(-1)^n-4$. הסימן תלוי בזוגיות $n$.',
        ],
        solution: {
          steps: [
            '$\\lim_{x\\to\\infty}\\left[(e^x-1)^n - 4\\right] = \\infty$ — אין אסימפטוטה מימין',
            '$\\lim_{x\\to-\\infty}\\left[(e^x-1)^n - 4\\right] = (0-1)^n - 4 = (-1)^n - 4$',
            '$n$ זוגי: $\\;(-1)^n - 4 = 1 - 4 = -3 \\Rightarrow y = -3$',
            '$n$ אי-זוגי: $\\;(-1)^n - 4 = -1 - 4 = -5 \\Rightarrow y = -5$',
          ],
          final_answer: 'אסימפטוטה אופקית: $\\;y = -3$ ($n$ זוגי), $\\;y = -5$ ($n$ אי-זוגי)',
        },
      },
      {
        label: 'א2',
        prompt: 'ענו עבור $n$ זוגי ועבור $n$ אי-זוגי: מצאו את שיעורי נקודות הקיצון של $f(x)$, וקבעו את סוגן (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          'גזור עם כלל השרשרת: $f\'(x) = n(e^x-1)^{n-1}\\cdot e^x$. השווה לאפס.',
          'הסימן של $(e^x-1)^{n-1}$ תלוי בזוגיות $n-1$ — בנה טבלת סימן לכל מקרה.',
        ],
        solution: {
          steps: [
            'נגזור עם כלל השרשרת: $\\;f\'(x) = n(e^x-1)^{n-1}\\cdot e^x$',
            'נאפס את הנגזרת: $\\;n e^x (e^x-1)^{n-1} = 0$. הגורם $n e^x$ חיובי תמיד, ולכן $(e^x-1)^{n-1} = 0$',
            '$e^x - 1 = 0 \\Rightarrow e^x = 1 \\Rightarrow x = 0$',
            'שיעור ה-$y$: $\\;f(0) = (e^0-1)^n - 4 = -4$, ולכן נקודת החשד היחידה היא $(0,-4)$',
            'הסימן של $f\'$ נקבע על ידי $(e^x-1)^{n-1}$ (כי $n e^x > 0$), והוא תלוי בזוגיות $n$:',
            'עבור $n$ זוגי — $n-1$ אי-זוגי, ולכן $(e^x-1)^{n-1}$ באותו סימן של $e^x-1$ (שלילי מתחת ל-$x=0$, חיובי מעליו): $\\begin{array}{c|c|c|c} x & x<0 & 0 & x>0 \\\\ \\hline f\'(x) & - & 0 & + \\\\ f(x) & \\searrow & & \\nearrow \\end{array}$',
            '$f\'$ עובר מ-$(-)$ ל-$(+)$ ב-$x=0$, ולכן יש שם מינימום: $(0,-4)$',
            'עבור $n$ אי-זוגי — $n-1$ זוגי, ולכן $(e^x-1)^{n-1} \\ge 0$ לכל $x$ (חזקה זוגית): $\\begin{array}{c|c|c|c} x & x<0 & 0 & x>0 \\\\ \\hline f\'(x) & + & 0 & + \\\\ f(x) & \\nearrow & & \\nearrow \\end{array}$',
            '$f\'$ אינו מחליף סימן (חיובי משני הצדדים), ולכן אין נקודת קיצון — $(0,-4)$ היא נקודת פיתול אופקית',
          ],
          final_answer: '$n$ זוגי: מינימום ב-$(0,-4)$. $\\;n$ אי-זוגי: אין נקודת קיצון — $(0,-4)$ היא נקודת פיתול אופקית',
        },
      },
      {
        label: 'א3',
        prompt: 'ענו עבור $n$ זוגי ועבור $n$ אי-זוגי: סרטטו סקיצה של גרף הפונקציה $f(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-3, 2.2],
            yRange: [-5.5, 6],
            curves: [{ fn: (x) => Math.pow(Math.exp(x) - 1, 2) - 4, color: '#f472b6' }],
            hAsymptotes: [{ y: -3, label: 'y=-3' }],
            markedPoints: [{ x: 0, y: -4, label: 'מינ' }],
            caption: '$n$ זוגי (דוגמה $n=2$): מינימום $(0,-4)$, אסימפטוטה $y=-3$, עלייה לאינסוף.',
          },
          {
            type: 'functionGraph',
            xRange: [-3, 2],
            yRange: [-6, 5],
            curves: [{ fn: (x) => Math.pow(Math.exp(x) - 1, 3) - 4, color: '#60a5fa' }],
            hAsymptotes: [{ y: -5, label: 'y=-5' }],
            markedPoints: [{ x: 0, y: -4, label: 'פיתול' }],
            caption: '$n$ אי-זוגי (דוגמה $n=3$): נקודת פיתול אופקית $(0,-4)$, אסימפטוטה $y=-5$, עלייה תמידית.',
          },
        ],
        hints: ['שלב את האסימפטוטה (א1) ואת סוג הקיצון (א2) לכל מקרה.'],
        solution: {
          steps: [
            '$n$ זוגי: אסימפטוטה $y=-3$ משמאל, ירידה למינימום $(0,-4)$, ואז עלייה לאינסוף',
            '$n$ אי-זוגי: אסימפטוטה $y=-5$ משמאל, עלייה דרך נקודת הפיתול $(0,-4)$ לאינסוף',
          ],
          final_answer: 'שתי הסקיצות מופיעות בתרשים (זוגי — עם מינימום; אי-זוגי — מונוטונית עולה עם פיתול)',
        },
      },
      {
        label: 'ב1',
        prompt: [
          'ענו עבור $n = 2$. נתונה גם $g(x) = 6e^x - 10$.',
          '',
          'מצאו את שיעורי נקודות החיתוך שבין גרף $f(x)$ ובין גרף $g(x)$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'השווה $f = g$, פתח את $(e^x-1)^2$, וסדר משוואה ב-$e^x$.',
          'הצב $t = e^x$ כדי לקבל משוואה ריבועית.',
        ],
        solution: {
          steps: [
            '$f = g$: $\\;(e^x-1)^2 - 4 = 6e^x - 10$',
            '$e^{2x} - 2e^x + 1 - 4 = 6e^x - 10$',
            '$e^{2x} - 8e^x + 7 = 0$',
            'הצבה $t = e^x$: $\\;t^2 - 8t + 7 = 0$',
            '$(t-7)(t-1) = 0 \\Rightarrow t = 7$ או $t = 1$',
            '$e^x = 7 \\Rightarrow x = \\ln 7$; $\\;\\;e^x = 1 \\Rightarrow x = 0$',
            '$g(\\ln 7) = 6\\cdot 7 - 10 = 32$; $\\;\\;g(0) = 6 - 10 = -4$',
          ],
          final_answer: 'נקודות החיתוך: $(\\ln 7,\\, 32)$ ו-$(0,\\, -4)$',
        },
      },
      {
        label: 'ב2',
        prompt: 'חשבו את השטח המוגבל על ידי גרף $f(x)$ ועל ידי גרף $g(x)$ (עבור $n=2$).',
        answer_type: 'number',
        hints: [
          'בתחום $[0, \\ln 7]$ הגרף של $g$ נמצא מעל הגרף של $f$ (בדוק בנקודת ביניים).',
          '$S = \\int_0^{\\ln 7}\\left(g(x)-f(x)\\right)dx$. פשט את המקדם תחת האינטגרל לפני האינטגרציה.',
        ],
        solution: {
          steps: [
            '$g$ מעל $f$ בתחום $[0, \\ln 7]$ (ב-$x=1$: $g\\approx 6.31 > f\\approx -1.05$)',
            '$S = \\int_0^{\\ln 7}\\left[6e^x - 10 - \\left((e^x-1)^2 - 4\\right)\\right]dx$',
            '$= \\int_0^{\\ln 7}\\left(8e^x - e^{2x} - 7\\right)dx$',
            '$= \\left[8e^x - \\tfrac{e^{2x}}{2} - 7x\\right]_0^{\\ln 7}$',
            '$= \\left(56 - \\tfrac{49}{2} - 7\\ln 7\\right) - \\left(8 - \\tfrac12\\right)$',
            '$= 24 - 7\\ln 7 \\approx 10.378$',
          ],
          final_answer: '$S = 24 - 7\\ln 7 \\approx 10.378$',
        },
      },
      {
        label: 'ג1',
        prompt: [
          'נתונה $h(x) = |f(x)|$ (עבור $n=2$).',
          '',
          'כמה נקודות קיצון יש לפונקציה $h(x)$? מצאו את שיעוריהן וקבעו את סוגן.',
        ].join('\n'),
        answer_type: 'expression',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-3, 1.8],
            yRange: [-0.6, 6],
            curves: [{ fn: (x) => Math.abs(Math.pow(Math.exp(x) - 1, 2) - 4), color: '#34d399' }],
            hAsymptotes: [{ y: 3, label: 'y=3' }],
            markedPoints: [
              { x: 0, y: 4, label: 'מקס' },
              { x: Math.log(3), y: 0, label: 'מינ' },
            ],
            caption: '$h(x) = |f(x)|$: מקסימום $(0,4)$, מינימום $(\\ln 3, 0)$, אסימפטוטה $y=3$.',
          },
        ],
        hints: [
          'ל-$f$ מינימום שלילי ב-$(0,-4)$ — בערך מוחלט הוא הופך למקסימום.',
          'במקום שבו $f=0$ (חוצה ציר $x$), ל-$h$ יש מינימום. פתור $f=0$.',
        ],
        solution: {
          steps: [
            '$h(x) = |(e^x-1)^2 - 4|$',
            'ל-$f$ מינימום $(0,-4)$ עם $f<0$ → ב-$h$ זו נקודת מקסימום $(0, 4)$',
            '$f = 0$: $\\;(e^x-1)^2 - 4 = 0 \\Rightarrow (e^x-1)^2 = 4 \\Rightarrow e^x - 1 = \\pm 2$',
            '$e^x = 3 \\Rightarrow x = \\ln 3$ (הפתרון $e^x = -1$ נפסל)',
            'ב-$x = \\ln 3$ הגרף נוגע בציר $x$ → ב-$h$ נקודת מינימום $(\\ln 3, 0)$',
          ],
          final_answer: 'שתי נקודות קיצון: מקסימום $(0,4)$ ומינימום $(\\ln 3,\\, 0)$',
        },
      },
      {
        label: 'ג2',
        prompt: 'מצאו את תחום הערכים של $k$ שעבורו הישר $y = k$ חותך את גרף $h(x)$ ב-3 נקודות.',
        answer_type: 'expression',
        hints: [
          'תאר את שלושת ענפי $h$: עלייה מ-$y=3$ (אסימפטוטה) למקסימום $(0,4)$, ירידה למינימום $(\\ln3,0)$, ועלייה לאינסוף.',
          'ספור חיתוכים של $y=k$ עם שלושת הענפים — 3 חיתוכים דורשים $k$ מעל האסימפטוטה ומתחת למקסימום.',
        ],
        solution: {
          steps: [
            '$h$: אסימפטוטה $y=3$ משמאל, עלייה למקסימום $(0,4)$, ירידה למינימום $(\\ln 3, 0)$, עלייה לאינסוף',
            'הענף השמאלי נע בין $3$ ל-$4$ — נחתך רק עבור $k > 3$',
            'הענף היורד נע בין $0$ ל-$4$, והענף הימני עולה מ-$0$ — נחתכים גם הם, ובלבד ש-$k < 4$',
            'שלושת הענפים נחתכים יחד כאשר $3 < k < 4$',
          ],
          final_answer: '$3 < k < 4$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
