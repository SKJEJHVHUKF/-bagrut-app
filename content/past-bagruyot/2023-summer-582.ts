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
    ],
    solutionSource: 'authored',
  },
];
