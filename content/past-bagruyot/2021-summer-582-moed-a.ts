/**
 * שאלון 582 — קיץ תשפ"א (2021), מועד א'
 * =====================================
 *
 * המקור של השאלות: meyda.education.gov.il (משרד החינוך — נחלת הכלל).
 * הפתרונות נכתבו על-ידינו בסגנון האפליקציה; השיטה המתמטית עצמה כללית.
 *
 * תוכן השאלון:
 *   Q1 — גאומטריה אנליטית (פרבולות כמקום גאומטרי + דלתון).
 *   Q2 — וקטורים במרחב (פירמידה SABCD מעל מעוין, $SA\perp$ בסיס).
 *   Q3 — מספרים מרוכבים ($z^4=-16$, סיבוב, מצולע משוכלל).
 *   Q4 — פונקציה מעריכית ($f=1+ae^{-2x}$, סיגמואיד $g=1/f$).
 *   Q5 — פונקציית ln (חקירת $\ln\frac{x^2-1}{(x+2)(x-1)}$).
 *
 * הערה: לכל תת-סעיף בשאלון המקורי יש כאן סעיף נפרד לענות עליו,
 * גרפים ויזואליים מופיעים בתוך הסעיף הספציפי שלהם (לא ברמת שאלה).
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2021Summer582MoedA: PastBagrutQuestion[] = [
  // ===========================================================================
  // Q1 — שתי פרבולות (מקום גאומטרי) + דלתון
  // ===========================================================================
  {
    id: 'b2021s582a-q1',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    totalPoints: 33,
    context: '(קיץ תשפ"א, מועד א\') נתון פרמטר $a > 0$.',
    parts: [
      {
        label: 'א',
        prompt:
          'מצא את משוואת המקום הגאומטרי של כל הנקודות שהמרחק שלהן מן הנקודה $(a,\\,0)$ שווה למרחק שלהן מן הישר $\\;x = a - 1$.',
        answer_type: 'expression',
        hints: [
          'זו בדיוק ההגדרה הגאומטרית של פרבולה: מוקד $(a,0)$, מדריך (ישר מנחה) $x = a-1$.',
          'נסמן נקודה כללית $(x,y)$ ונשווה את שני המרחקים: $\\sqrt{(x-a)^2 + y^2} = x-(a-1)$.',
          'העלה בריבוע, פתח את שני האגפים, וצמצם את האיברים השווים.',
        ],
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 210 200',
            svg: `
              <line x1="14" y1="105" x2="204" y2="105" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="30" y1="16" x2="30" y2="192" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="197" y="118" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">x</text>
              <text x="19" y="24" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">y</text>
              <path d="M 180,34 Q -36,105 180,176" fill="none" stroke="rgba(244,114,182,0.95)" stroke-width="2"/>
              <line x1="58" y1="22" x2="58" y2="188" stroke="rgba(251,191,36,0.85)" stroke-width="1.6" stroke-dasharray="4 3"/>
              <text x="60" y="33" fill="rgba(251,191,36,0.95)" font-size="10" font-family="Heebo, sans-serif">x=a-1</text>
              <circle cx="82" cy="105" r="3.2" fill="rgba(96,165,250,0.95)"/>
              <text x="72" y="119" fill="#bfdbfe" font-size="10" font-family="Heebo, sans-serif">(a,0)</text>
              <circle cx="113" cy="60" r="3.2" fill="rgba(244,114,182,0.95)"/>
              <text x="118" y="57" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">P(x,y)</text>
              <line x1="82" y1="105" x2="113" y2="60" stroke="rgba(96,165,250,0.9)" stroke-width="1.5"/>
              <line x1="113" y1="60" x2="58" y2="60" stroke="rgba(251,191,36,0.9)" stroke-width="1.5" stroke-dasharray="3 2"/>
            `,
            caption: 'המקום הגאומטרי הוא פרבולה: כל נקודה $P(x,y)$ נמצאת במרחק שווה מן המוקד $(a,0)$ ומן המדריך $x=a-1$.',
          },
        ],
        solution: {
          steps: [
            'נקודה כללית $(x,y)$, נשווה מרחקים: $\\sqrt{(x-a)^2 + y^2} = x-(a-1)$',
            'נעלה בריבוע: $(x-a)^2 + y^2 = (x-(a-1))^2$',
            '$x^2 - 2ax + a^2 + y^2 = x^2 - 2ax + 2x + a^2 - 2a + 1$',
            '$y^2 = 2x - 2a + 1$',
          ],
          final_answer: 'פרבולה: $\\;y^2 = 2x - 2a + 1$ (מוקד $(a,0)$, מדריך $x=a-1$)',
        },
      },
      {
        label: 'ב',
        prompt:
          'מצא את משוואת המקום הגאומטרי של כל הנקודות שהמרחק שלהן מן הנקודה $(0,\\,a)$ שווה למרחק שלהן מן הישר $\\;y = a - 1$.',
        answer_type: 'expression',
        hints: [
          'בדיוק אותה שיטה כמו בסעיף א, עם החלפת התפקידים $x \\leftrightarrow y$: מוקד $(0,a)$, מדריך $y=a-1$.',
          'השווה מרחקים: $\\sqrt{x^2+(y-a)^2} = y-(a-1)$, העלה בריבוע וצמצם.',
        ],
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 205',
            svg: `
              <line x1="12" y1="170" x2="190" y2="170" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="14" x2="100" y2="196" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="184" y="183" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">x</text>
              <text x="88" y="22" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">y</text>
              <path d="M 30,40 Q 100,250 170,40" fill="none" stroke="rgba(244,114,182,0.95)" stroke-width="2"/>
              <line x1="20" y1="157" x2="186" y2="157" stroke="rgba(251,191,36,0.85)" stroke-width="1.6" stroke-dasharray="4 3"/>
              <text x="150" y="151" fill="rgba(251,191,36,0.95)" font-size="10" font-family="Heebo, sans-serif">y=a-1</text>
              <circle cx="100" cy="133" r="3.2" fill="rgba(96,165,250,0.95)"/>
              <text x="104" y="130" fill="#bfdbfe" font-size="10" font-family="Heebo, sans-serif">(0,a)</text>
              <circle cx="140" cy="111" r="3.2" fill="rgba(244,114,182,0.95)"/>
              <text x="144" y="108" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">P(x,y)</text>
              <line x1="100" y1="133" x2="140" y2="111" stroke="rgba(96,165,250,0.9)" stroke-width="1.5"/>
              <line x1="140" y1="111" x2="140" y2="157" stroke="rgba(251,191,36,0.9)" stroke-width="1.5" stroke-dasharray="3 2"/>
            `,
            caption: 'אותו רעיון, מסובב $90°$: פרבולה הפותחת מעלה — מוקד $(0,a)$, מדריך $y=a-1$.',
          },
        ],
        solution: {
          steps: [
            'אותה שיטה, $x \\leftrightarrow y$: $\\sqrt{x^2 + (y-a)^2} = y-(a-1)$',
            'נעלה בריבוע: $x^2 + (y-a)^2 = (y-(a-1))^2$',
            '$x^2 + y^2 - 2ay + a^2 = y^2 - 2ay + 2y + a^2 - 2a + 1$',
            '$x^2 = 2y - 2a + 1$',
          ],
          final_answer: 'פרבולה: $\\;x^2 = 2y - 2a + 1$ (מוקד $(0,a)$, מדריך $y=a-1$)',
        },
      },
      {
        label: 'ג1',
        prompt:
          'שני המקומות הגאומטריים נחתכים בשתי נקודות. אחת מהן היא $(2,\\,2)$. מצא את $a$.',
        answer_type: 'number',
        hints: ['הצב $(2,2)$ באחת המשוואות (שתיהן יתנו אותה תשובה).'],
        solution: {
          steps: [
            'נציב $(2,2)$ במשוואת סעיף א: $2^2 = 2\\cdot 2 - 2a + 1$',
            '$4 = 5 - 2a$',
            '$2a = 1$',
            '$a = \\dfrac{1}{2}$',
          ],
          final_answer: '$a = \\dfrac{1}{2}$',
        },
      },
      {
        label: 'ג2',
        prompt: 'מצא את שיעורי נקודת החיתוך האחרת.',
        answer_type: 'expression',
        hints: [
          'הצב $a = \\tfrac{1}{2}$ בשתי המשוואות: מתקבל $\\;y^2 = 2x$ ו-$x^2 = 2y$.',
          'מהמשוואה השנייה $y = \\tfrac{x^2}{2}$. הצב בראשונה וקבל משוואה ב-$x$ בלבד.',
          'אחרי פישוט: $x^4 = 8x$, כלומר $x(x^3-8)=0$ — שני פתרונות.',
        ],
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-1, 3.2],
            yRange: [-1, 3.2],
            curves: [
              { fn: (x) => Math.sqrt(2 * x), domain: [0, 3.2], color: '#f472b6' },
              { fn: (x) => -Math.sqrt(2 * x), domain: [0, 3.2], color: '#f472b6', dashed: true },
              { fn: (x) => (x * x) / 2, domain: [-1, 3.2], color: '#60a5fa' },
            ],
            markedPoints: [
              { x: 0, y: 0, label: '(0,0)' },
              { x: 2, y: 2, label: '(2,2)' },
            ],
            caption: 'שתי הפרבולות $y^2=2x$ (ורוד) ו-$x^2=2y$ (כחול) עבור $a=\\tfrac12$ — נחתכות ב-$(0,0)$ וב-$(2,2)$.',
          },
        ],
        solution: {
          steps: [
            'נציב $a = \\tfrac{1}{2}$: $\\;y^2 = 2x$ ו-$x^2 = 2y$',
            'מהשנייה $y = \\dfrac{x^2}{2}$, נציב בראשונה: $\\left(\\dfrac{x^2}{2}\\right)^2 = 2x$',
            '$\\dfrac{x^4}{4} = 2x$',
            '$x^4 - 8x = 0$',
            '$x(x^3 - 8) = 0$',
            '$x = 0$ או $x = 2$',
            '$x=2 \\Rightarrow y=2$ (הנקודה הנתונה); $\\;x=0 \\Rightarrow y=0$',
          ],
          final_answer: 'נקודת החיתוך השנייה: $(0,0)$',
        },
      },
      {
        label: 'ד1',
        prompt: [
          'מחברים את שתי נקודות החיתוך של שני המקומות הגאומטריים עם הנקודות $(3a,\\,0)$ ו-$(0,\\,3a)$ — מתקבל מרובע.',
          'מהו סוג המרובע? נמק.',
        ].join('\n'),
        answer_type: 'text',
        hints: [
          'עם $a = \\tfrac{1}{2}$: ארבעת הקודקודים $(0,0)$, $(\\tfrac{3}{2},0)$, $(2,2)$, $(0,\\tfrac{3}{2})$.',
          'חשב אורכי הצלעות. אם יש שני זוגות של צלעות סמוכות שוות — דלתון.',
          'בדוק אלכסונים: על קוים $y=x$ ו-$x+y=\\tfrac{3}{2}$. ניצבים?',
        ],
        solution: {
          steps: [
            'הקודקודים ($3a = \\tfrac{3}{2}$): $A(0,0)$, $B(\\tfrac{3}{2},0)$, $C(2,2)$, $D(0,\\tfrac{3}{2})$',
            '$|AB| = \\tfrac{3}{2}$',
            '$|BC| = \\sqrt{(\\tfrac{1}{2})^2 + 2^2} = \\dfrac{\\sqrt{17}}{2}$',
            '$|CD| = \\sqrt{2^2 + (\\tfrac{1}{2})^2} = \\dfrac{\\sqrt{17}}{2}$',
            '$|DA| = \\tfrac{3}{2}$',
            'שני זוגות צלעות סמוכות שוות: $|AB|=|DA|$ ו-$|BC|=|CD|$ — דלתון',
            '$A(0,0)$ ו-$C(2,2)$ על הישר $y=x$ — ציר הסימטריה של הדלתון',
          ],
          final_answer: 'המרובע הוא דלתון (האלכסון $y=x$ הוא ציר סימטריה)',
        },
      },
      {
        label: 'ד2',
        prompt: 'חשב את שטח המרובע.',
        answer_type: 'number',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="160" x2="185" y2="160" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="25" y1="15" x2="25" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <polygon points="25,160 115,160 175,40 25,100" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <line x1="25" y1="160" x2="175" y2="40" stroke="rgba(251,191,36,0.6)" stroke-width="1" stroke-dasharray="3 3"/>
              <line x1="115" y1="160" x2="25" y2="100" stroke="rgba(251,191,36,0.6)" stroke-width="1" stroke-dasharray="3 3"/>
              <circle cx="25" cy="160" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="115" cy="160" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="175" cy="40" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="25" cy="100" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="14" y="172" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">A(0,0)</text>
              <text x="100" y="174" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">B(3/2,0)</text>
              <text x="160" y="34" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">C(2,2)</text>
              <text x="0" y="94" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">D(0,3/2)</text>
            `,
            caption: 'הדלתון $ABCD$: אלכסונים ניצבים $AC$ (על $y=x$) ו-$BD$ (על $x+y=\\tfrac{3}{2}$).',
          },
        ],
        hints: [
          'שטח דלתון $= \\tfrac{1}{2}\\cdot d_1\\cdot d_2$, כאשר $d_1, d_2$ אורכי האלכסונים.',
          '$|AC| = $ המרחק מ-$(0,0)$ ל-$(2,2)$; $|BD| = $ המרחק מ-$(\\tfrac{3}{2},0)$ ל-$(0,\\tfrac{3}{2})$.',
        ],
        solution: {
          steps: [
            'שטח דלתון: $S = \\dfrac{d_1 \\cdot d_2}{2}$ (האלכסונים ניצבים)',
            '$|AC| = \\sqrt{2^2 + 2^2} = 2\\sqrt2$',
            '$|BD| = \\sqrt{(\\tfrac{3}{2})^2 + (\\tfrac{3}{2})^2} = \\dfrac{3\\sqrt2}{2}$',
            '$S = \\dfrac{2\\sqrt2 \\cdot \\frac{3\\sqrt2}{2}}{2} = \\dfrac{6}{2} = 3$',
          ],
          final_answer: 'שטח המרובע: $\\;S = 3$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q2 — פירמידה SABCD מעל מעוין, $SA\perp$ בסיס
  // ===========================================================================
  {
    id: 'b2021s582a-q2',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 33,
    context: [
      '(קיץ תשפ"א, מועד א\') נתונה פירמידה מרובעת $SABCD$ שבסיסה $ABCD$ מעוין.',
      '$\\vec{SA}$ מאונך לבסיס, $\\;SA = BA$, $\\;\\angle BAD = 60°$, $\\;\\vec{SE} = t\\cdot \\vec{SC}$ ($0 < t < 1$).',
      'נסמן: $\\;\\vec{AB} = \\vec u$, $\\;\\vec{AD} = \\vec v$, $\\;\\vec{AS} = \\vec w$.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 240 210',
        svg: `
          <polygon points="50,165 140,182 195,138 105,121" fill="rgba(56,189,248,0.07)" stroke="none"/>
          <line x1="105" y1="121" x2="195" y2="138" stroke="rgba(148,163,184,0.4)" stroke-width="1" stroke-dasharray="4 3"/>
          <line x1="105" y1="121" x2="50" y2="165" stroke="rgba(148,163,184,0.4)" stroke-width="1" stroke-dasharray="4 3"/>
          <line x1="50" y1="165" x2="140" y2="182" stroke="rgba(226,232,240,0.85)" stroke-width="1.6"/>
          <line x1="140" y1="182" x2="195" y2="138" stroke="rgba(226,232,240,0.85)" stroke-width="1.6"/>
          <line x1="50" y1="42" x2="50" y2="165" stroke="rgba(244,114,182,0.95)" stroke-width="2"/>
          <line x1="50" y1="42" x2="140" y2="182" stroke="rgba(226,232,240,0.8)" stroke-width="1.4"/>
          <line x1="50" y1="42" x2="195" y2="138" stroke="rgba(226,232,240,0.8)" stroke-width="1.4"/>
          <line x1="50" y1="42" x2="105" y2="121" stroke="rgba(148,163,184,0.55)" stroke-width="1.2" stroke-dasharray="4 3"/>
          <path d="M 50 154 L 61 154 L 61 165" fill="none" stroke="rgba(244,114,182,0.8)" stroke-width="1"/>
          <circle cx="122" cy="90" r="3.2" fill="rgba(251,191,36,0.95)"/>
          <circle cx="50" cy="42" r="2.6" fill="rgba(244,114,182,0.95)"/>
          <circle cx="50" cy="165" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <circle cx="140" cy="182" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <circle cx="195" cy="138" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <circle cx="105" cy="121" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <text x="38" y="40" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">S</text>
          <text x="36" y="174" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">A</text>
          <text x="142" y="196" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">B</text>
          <text x="201" y="138" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">C</text>
          <text x="90" y="116" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">D</text>
          <text x="127" y="88" fill="#fbbf24" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">E</text>
          <text x="30" y="108" fill="rgba(244,114,182,0.9)" font-size="11" font-style="italic" font-family="Heebo, sans-serif">w</text>
          <text x="92" y="181" fill="rgba(148,163,184,0.95)" font-size="11" font-style="italic" font-family="Heebo, sans-serif">u</text>
          <text x="68" y="139" fill="rgba(148,163,184,0.95)" font-size="11" font-style="italic" font-family="Heebo, sans-serif">v</text>
        `,
        caption:
          'הפירמידה $SABCD$ מעל בסיס המעוין $ABCD$: $\\vec{AS} = \\vec w$ ניצב לבסיס, $E$ על המקצוע $SC$. הווקטורים $\\vec u = \\vec{AB}$, $\\vec v = \\vec{AD}$, $\\vec w = \\vec{AS}$.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הבע את הווקטורים $\\;\\vec{EB}\\;$ ו-$\\;\\vec{ED}\\;$ באמצעות $t,\\,\\vec u,\\,\\vec v,\\,\\vec w$.',
        answer_type: 'expression',
        hints: [
          'לך לאורך מסלול: $\\vec{EB} = \\vec{ES} + \\vec{SA} + \\vec{AB}$. שים לב ש-$\\vec{ES} = -\\vec{SE} = -t\\,\\vec{SC}$.',
          'בטא את $\\vec{SC}$ דרך $A$: $\\;\\vec{SC} = \\vec{SA} + \\vec{AC} = -\\vec w + (\\vec u + \\vec v)$ (במעוין $\\vec{AC} = \\vec u + \\vec v$).',
          'באותו אופן בדיוק $\\vec{ED} = \\vec{ES} + \\vec{SA} + \\vec{AD}$.',
        ],
        solution: {
          steps: [
            '$\\vec{SC} = \\vec{SA} + \\vec{AC} = -\\vec w + (\\vec u + \\vec v)$',
            '$\\vec{ES} = -t\\,\\vec{SC} = -t\\vec u - t\\vec v + t\\vec w$',
            '$\\vec{EB} = \\vec{ES} + \\vec{SA} + \\vec{AB} = (-t\\vec u - t\\vec v + t\\vec w) - \\vec w + \\vec u$',
            '$\\vec{EB} = (1-t)\\vec u - t\\vec v + (t-1)\\vec w$',
            '$\\vec{ED} = \\vec{ES} + \\vec{SA} + \\vec{AD} = (-t\\vec u - t\\vec v + t\\vec w) - \\vec w + \\vec v$',
            '$\\vec{ED} = -t\\vec u + (1-t)\\vec v + (t-1)\\vec w$',
          ],
          final_answer:
            '$\\vec{EB} = (1-t)\\vec u - t\\vec v + (t-1)\\vec w$, $\\;\\vec{ED} = -t\\vec u + (1-t)\\vec v + (t-1)\\vec w$',
        },
      },
      {
        label: 'ב1',
        prompt: 'נתון $t = \\tfrac{1}{2}$. הוכח כי $\\;\\vec{EB}\\;$ מאונך ל-$\\;\\vec{ED}$.',
        answer_type: 'proof',
        hints: [
          'הצב $t=\\tfrac{1}{2}$: $\\vec{EB} = \\tfrac{1}{2}(\\vec u - \\vec v - \\vec w)$, $\\vec{ED} = \\tfrac{1}{2}(-\\vec u + \\vec v - \\vec w)$.',
          'בנתונים $|\\vec u|=|\\vec v|=|\\vec w| =: q$ (כי מעוין + $SA=BA$).',
          '$\\vec u\\cdot\\vec v = q^2/2$ (כי $\\cos 60° = 1/2$).',
          '$\\vec u\\cdot\\vec w = \\vec v\\cdot\\vec w = 0$ (כי $SA$ ניצב לבסיס).',
          'חשב $\\vec{EB}\\cdot\\vec{ED}$ והראה שיוצא $0$.',
        ],
        solution: {
          steps: [
            'נציב $t=\\tfrac12$: $\\;\\vec{EB} = \\tfrac12(\\vec u - \\vec v - \\vec w)$',
            '$\\vec{ED} = \\tfrac12(-\\vec u + \\vec v - \\vec w)$',
            'נסמן $q = |\\vec u|^2 = |\\vec v|^2 = |\\vec w|^2$ (מעוין, $SA=BA$)',
            '$\\vec u\\cdot\\vec v = q\\cos 60° = \\tfrac{q}{2}$',
            '$\\vec u\\cdot\\vec w = \\vec v\\cdot\\vec w = 0$ ($SA\\perp$ בסיס)',
            '$\\vec{EB}\\cdot\\vec{ED} = \\tfrac14(\\vec u - \\vec v - \\vec w)\\cdot(-\\vec u + \\vec v - \\vec w)$',
            '$= \\tfrac14\\left(-|\\vec u|^2 - |\\vec v|^2 + |\\vec w|^2 + 2\\,\\vec u\\cdot\\vec v\\right)$',
            '$= \\tfrac14\\left(-q - q + q + 2\\cdot\\tfrac{q}{2}\\right) = 0$',
            '$\\vec{EB}\\cdot\\vec{ED} = 0 \\Rightarrow \\vec{EB} \\perp \\vec{ED}$',
          ],
          final_answer: 'הוכח: $\\vec{EB}\\cdot\\vec{ED} = 0$',
        },
      },
      {
        label: 'ב2',
        prompt: 'הוכח כי האנך מן הנקודה $E$ לבסיס $ABCD$ עובר דרך נקודת מפגש האלכסונים של המעוין.',
        answer_type: 'proof',
        hints: [
          'התבונן במשולש $SAC$. כי $t=\\tfrac12$, הנקודה $E$ היא אמצע הצלע $SC$.',
          'העבר מ-$E$ אנך לבסיס — הוא מקביל ל-$SA$ (שניצב לבסיס). זהו קו אמצעים במשולש $SAC$.',
          'קו אמצעים חוצה את $AC$ באמצע, ובמעוין אמצע $AC$ הוא בדיוק מפגש האלכסונים.',
        ],
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 220 170',
            svg: `
              <polygon points="35,135 200,135 35,30" fill="rgba(56,189,248,0.06)" stroke="rgba(226,232,240,0.85)" stroke-width="1.6"/>
              <line x1="35" y1="82" x2="117" y2="83" stroke="rgba(251,191,36,0.9)" stroke-width="1.6" stroke-dasharray="4 3"/>
              <path d="M 35 123 L 47 123 L 47 135" fill="none" stroke="rgba(226,232,240,0.7)" stroke-width="1"/>
              <path d="M 105 83 L 105 95 L 117 95" fill="none" stroke="rgba(251,191,36,0.7)" stroke-width="1"/>
              <circle cx="35" cy="30" r="2.8" fill="rgba(244,114,182,0.95)"/>
              <circle cx="35" cy="135" r="2.8" fill="rgba(226,232,240,0.95)"/>
              <circle cx="200" cy="135" r="2.8" fill="rgba(226,232,240,0.95)"/>
              <circle cx="117" cy="83" r="3.2" fill="rgba(251,191,36,0.95)"/>
              <circle cx="117" cy="135" r="3" fill="rgba(56,189,248,0.95)"/>
              <text x="24" y="30" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">S</text>
              <text x="24" y="148" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">A</text>
              <text x="203" y="146" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">C</text>
              <text x="122" y="80" fill="#fbbf24" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">E</text>
              <text x="108" y="152" fill="#38bdf8" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">M</text>
            `,
            caption: 'במשולש $SAC$: $E$ אמצע $SC$, והאנך $EM \\parallel SA$ הוא קו אמצעים — פוגע ב-$M$ אמצע $AC$, שהוא מפגש אלכסוני המעוין.',
          },
        ],
        solution: {
          steps: [
            '$t = \\tfrac12 \\Rightarrow \\vec{SE} = \\tfrac12\\vec{SC}$, כלומר $E$ אמצע $SC$',
            'האנך מ-$E$ לבסיס מקביל ל-$SA$ (שניצב לבסיס)',
            'במשולש $SAC$: הישר מאמצע $SC$ במקביל ל-$SA$ הוא קו אמצעים',
            'קו האמצעים חוצה את $AC$ באמצע — רגל האנך היא $M$, אמצע $AC$',
            'במעוין האלכסונים חוצים זה את זה, לכן אמצע $AC$ הוא מפגש האלכסונים',
          ],
          final_answer:
            'הוכח: האנך מ-$E$ (אמצע $SC$) הוא קו אמצעים במשולש $SAC$, ופוגע באמצע $AC$ — מפגש אלכסוני המעוין',
        },
      },
      {
        label: 'ג',
        prompt: [
          'במערכת צירים: $A = (0,0,0)$, $\\;B = (6\\sqrt 3,\\,6,\\,0)$, $D$ על החלק החיובי של ציר ה-$y$, שיעור ה-$z$ של $S$ גדול מאפס.',
          'חשב את שיעורי הקודקודים $S$ ו-$D$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'אורך צלע: $|\\vec{AB}| = \\sqrt{108+36} = 12$. במעוין $|AD| = 12$, ו-$D$ על ציר $y$ חיובי.',
          '$SA$ ניצב לבסיס ושווה ל-$AB$ באורך: $S = (0,0,12)$.',
        ],
        solution: {
          steps: [
            '$|\\vec{AB}| = \\sqrt{(6\\sqrt 3)^2 + 6^2} = \\sqrt{108 + 36} = \\sqrt{144} = 12$',
            'במעוין $|AD| = 12$, ו-$D$ על ציר $y$ חיובי: $\\;D = (0, 12, 0)$',
            'בדיקה $\\angle BAD$: $\\;\\cos\\theta = \\dfrac{\\vec{AB}\\cdot\\vec{AD}}{144} = \\dfrac{72}{144} = \\tfrac12$',
            'לכן $\\theta = 60°$ ✓',
            '$\\vec{AS} \\perp$ בסיס, $|AS| = 12$, $z > 0$: $\\;S = (0, 0, 12)$',
          ],
          final_answer: '$D = (0, 12, 0)$, $\\;S = (0, 0, 12)$',
        },
      },
      {
        label: 'ד',
        prompt: 'מצא את משוואת המישור $SAB$.',
        answer_type: 'expression',
        hints: [
          'נחפש נורמל $\\vec n = (a,b,c)$ המאונך לשני וקטורים במישור: $\\vec{AS} = (0,0,12)$ ו-$\\vec{AB} = (6\\sqrt 3,6,0)$.',
          'תנאי האנכיות: $\\vec n\\cdot\\vec{AS} = 0$ ו-$\\vec n\\cdot\\vec{AB} = 0$ — שתי משוואות בנעלמים $a,b,c$.',
          'מהראשונה $c=0$; מהשנייה $b = -\\sqrt 3\\,a$. בחר $a=1$ והצב את $A$ במשוואת המישור.',
        ],
        solution: {
          steps: [
            'וקטורים במישור: $\\vec{AS} = (0,0,12)$, $\\;\\vec{AB} = (6\\sqrt 3, 6, 0)$',
            'נורמל $\\vec n = (a,b,c)$: $\\;\\vec n\\cdot\\vec{AS} = 0$ ו-$\\vec n\\cdot\\vec{AB} = 0$',
            '$(a,b,c)\\cdot(0,0,12) = 12c = 0 \\Rightarrow c = 0$',
            '$(a,b,c)\\cdot(6\\sqrt 3, 6, 0) = 6\\sqrt 3\\,a + 6b = 0 \\Rightarrow b = -\\sqrt 3\\,a$',
            'נבחר $a = 1$: $\\;\\vec n = (1, -\\sqrt 3, 0)$',
            'מישור דרך $A(0,0,0)$: $\\;x - \\sqrt 3\\,y = 0$',
          ],
          final_answer: 'משוואת מישור $SAB$: $\\;x - \\sqrt 3\\,y = 0$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q3 — מספרים מרוכבים: $z^4=-16$ + סיבוב + 16-גון
  // ===========================================================================
  {
    id: 'b2021s582a-q3',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 33,
    context: '(קיץ תשפ"א, מועד א\') נתונה המשוואה $\\;z^4 = -16\\;$ ($z$ מספר מרוכב).',
    parts: [
      {
        label: 'א',
        prompt: 'פתור את המשוואה.',
        answer_type: 'expression',
        hints: [
          'כתוב $-16 = 16\\,\\text{cis}(180°)$. אז $|z|^4 = 16$, ולכן $|z| = 2$.',
          'הזווית של $z$ היא $(180° + 360°k)/4$ עבור $k=0,1,2,3$.',
        ],
        solution: {
          steps: [
            '$z^4 = -16 = 16\\,\\text{cis}\\,180°$',
            '$r^4 = 16 \\;\\Rightarrow\\; r = 2$',
            '$4\\theta = 180° + 360°k \\;\\Rightarrow\\; \\theta = 45° + 90°k, \\quad k = 0,1,2,3$',
            '$z_1 = 2\\,\\text{cis}\\,45° = \\sqrt 2 + \\sqrt 2\\,i$',
            '$z_2 = 2\\,\\text{cis}\\,135° = -\\sqrt 2 + \\sqrt 2\\,i$',
            '$z_3 = 2\\,\\text{cis}\\,225° = -\\sqrt 2 - \\sqrt 2\\,i$',
            '$z_4 = 2\\,\\text{cis}\\,315° = \\sqrt 2 - \\sqrt 2\\,i$',
            'בדיקה: $\\;(\\sqrt 2 + \\sqrt 2\\,i)^2 = 4i \\;\\Rightarrow\\; z_1^4 = (4i)^2 = -16$ ✓',
          ],
          final_answer:
            'ארבעה פתרונות: $\\;\\pm\\sqrt 2 \\pm \\sqrt 2\\,i$ (כל ארבעת צירופי הסימנים), כלומר $2\\,\\text{cis}(45° + 90°k)$.',
        },
      },
      {
        label: 'ב',
        prompt:
          'פתרונות המשוואה מייצגים קודקודים של מצולע במישור גאוס. שרטט אותו במערכת הצירים.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="178" y="96" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Im</text>
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(226,232,240,0.4)" stroke-width="1.1" stroke-dasharray="3 3"/>
              <polygon points="149.5,50.5 50.5,50.5 50.5,149.5 149.5,149.5" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <circle cx="149.5" cy="50.5" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="50.5" cy="50.5" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="50.5" cy="149.5" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="149.5" cy="149.5" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="152" y="46" fill="#f1f5f9" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">z₁</text>
              <text x="36" y="46" fill="#f1f5f9" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">z₂</text>
              <text x="36" y="160" fill="#f1f5f9" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">z₃</text>
              <text x="152" y="160" fill="#f1f5f9" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">z₄</text>
            `,
            caption: 'ארבעת הפתרונות יוצרים ריבוע חסום במעגל $|z|=2$, מסובב ב-$45°$ ביחס לצירים.',
          },
        ],
        hints: ['ארבעה קודקודים במרחקים שווים על מעגל $|z|=2$, בזוויות $45°,135°,225°,315°$ — לכן ריבוע.'],
        solution: {
          steps: [
            'ארבעת הפתרונות על מעגל $|z| = 2$ בזוויות $45°, 135°, 225°, 315°$ — מרווחי $90°$.',
            'ארבע נקודות במרווחים שווים, ולכן ריבוע משוכלל.',
            'אורך הצלע: $\\;a = 2\\cdot 2\\sin 45° = 2\\sqrt 2$',
          ],
          final_answer: 'ריבוע משוכלל חסום במעגל $|z|=2$ (מסובב $45°$ ביחס לצירים), צלע $2\\sqrt 2$.',
        },
      },
      {
        label: 'ג',
        prompt:
          'כופלים את כל אחד מן המספרים המייצגים את קודקודי המצולע ב-$\\;\\dfrac{1+i}{\\sqrt 2}$. מצא את שיעורי הנקודות שהתקבלו.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="178" y="96" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Im</text>
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(226,232,240,0.4)" stroke-width="1.1" stroke-dasharray="3 3"/>
              <polygon points="170,100 100,30 30,100 100,170" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <circle cx="170" cy="100" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="100" cy="30" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="30" cy="100" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="100" cy="170" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="175" y="96" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">2</text>
              <text x="106" y="32" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">2i</text>
              <text x="18" y="96" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">-2</text>
              <text x="106" y="182" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">-2i</text>
            `,
            caption: 'אחרי הכפל ב-$\\text{cis}(45°)$ — סיבוב ב-$45°$. הקודקודים החדשים על הצירים.',
          },
        ],
        hints: [
          '$\\dfrac{1+i}{\\sqrt 2} = \\text{cis}(45°)$. כפל ב-$\\text{cis}(45°)$ = סיבוב ב-$45°$.',
          'הזוויות החדשות: $45°+45°=90°$, $135°+45°=180°$, וכן הלאה. המודולים נשארים $2$.',
        ],
        solution: {
          steps: [
            '$\\dfrac{1+i}{\\sqrt 2} = \\text{cis}\\,45°$ — כפל בו = סיבוב ב-$45°$ (המודול נשאר $2$).',
            '$z_1 \\cdot \\text{cis}\\,45° = 2\\,\\text{cis}\\,90° = 2i \\;\\Rightarrow\\; (0,\\,2)$',
            '$z_2 \\cdot \\text{cis}\\,45° = 2\\,\\text{cis}\\,180° = -2 \\;\\Rightarrow\\; (-2,\\,0)$',
            '$z_3 \\cdot \\text{cis}\\,45° = 2\\,\\text{cis}\\,270° = -2i \\;\\Rightarrow\\; (0,\\,-2)$',
            '$z_4 \\cdot \\text{cis}\\,45° = 2\\,\\text{cis}\\,360° = 2 \\;\\Rightarrow\\; (2,\\,0)$',
          ],
          final_answer: 'ארבע נקודות: $\\;2,\\;2i,\\;-2,\\;-2i$ (קודקודי ריבוע על הצירים).',
        },
      },
      {
        label: 'ד',
        prompt: [
          '$n$ הוא מספר טבעי, $\\;11 < n < 17$, ו-$c$ הוא מספר ממשי.',
          'כל אחד מן המספרים המרוכבים שנמצאו בסעיפים הקודמים (ארבעת מ-א וארבעת מ-ג, סה"כ 8) מקיים את המשוואה $\\;z^n = c$.',
          'מצא את $n$ ואת $c$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          '8 הנקודות יושבות על מעגל $|z|=2$, בזוויות $45°, 90°, 135°, 180°, \\ldots, 360°$ — כל הכפולות של $45°$.',
          'כדי שכל $z_k = 2\\,\\text{cis}(45°\\cdot k)$ יתן אותו $z^n$, צריך $45°\\cdot n \\equiv 0 \\pmod{360°}$, כלומר $n$ כפולה של $8$.',
          'בטווח $11 < n < 17$: רק $n = 16$. ואז $c = 2^{16}$.',
        ],
        solution: {
          steps: [
            '8 הנקודות (מ-א ומ-ג) על מעגל $|z| = 2$ בכל הכפולות של $45°$: $\\;z_k = 2\\,\\text{cis}(45°k)$.',
            '$z_k^{\\,n} = 2^n\\,\\text{cis}(45°kn)$ ממשי לכל $k$',
            'לכן $45°n$ כפולה של $360°$',
            'כלומר $n$ כפולה של $8$.',
            'בטווח $11 < n < 17$: $\\quad n = 16$',
            '$c = 2^{16}\\,\\text{cis}\\,0° = 65536$',
          ],
          final_answer: '$n = 16$, $\\;c = 2^{16} = 65536$.',
        },
      },
      {
        label: 'ה',
        prompt:
          'הנקודות במישור גאוס המייצגות את כל פתרונות המשוואה $z^n = c$ מסעיף ד יוצרות מצולע משוכלל בעל $n$ צלעות. מצא את שטח המצולע.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="178" y="96" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Im</text>
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(226,232,240,0.4)" stroke-width="1.1" stroke-dasharray="3 3"/>
              <polygon points="170.0,100.0 164.6,73.2 149.5,50.5 126.8,35.4 100.0,30.0 73.2,35.4 50.5,50.5 35.4,73.2 30.0,100.0 35.4,126.8 50.5,149.5 73.2,164.6 100.0,170.0 126.8,164.6 149.5,149.5 164.6,126.8" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.4"/>
            `,
            caption: 'מצולע משוכלל בן $16$ צלעות, חסום במעגל $|z|=2$ — שורשי $z^{16}=65536$.',
          },
        ],
        hints: [
          'פתרונות $z^n = c$ עם $|c|=2^n$: $n$ נקודות על מעגל $|z|=2$ במרווחי $360°/n = 22.5°$.',
          'שטח מצולע משוכלל בן $n$ צלעות חסום במעגל ברדיוס $R$: $S = \\tfrac{1}{2}\\,n\\,R^2\\,\\sin(2\\pi/n)$.',
        ],
        solution: {
          steps: [
            '$16$ קודקודים על מעגל $R = 2$ במרווחי $22.5°$, ולכן $16$ משולשים מרכזיים.',
            'שטח משולש מרכזי: $\\;\\tfrac{1}{2}\\cdot 2\\cdot 2\\cdot \\sin 22.5° = 2\\sin 22.5°$',
            '$S = 16 \\cdot 2\\sin 22.5° = 32\\sin 22.5°$',
            '$\\sin 22.5° = \\dfrac{\\sqrt{2 - \\sqrt 2}}{2} \\;\\Rightarrow\\; S = 16\\sqrt{2 - \\sqrt 2} \\approx 12.25$',
          ],
          final_answer: 'שטח המצולע: $\\;16\\sqrt{2 - \\sqrt 2} \\approx 12.25$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q4 — $f = 1 + ae^{-2x}$ ו-$g = 1/f$ (סיגמואיד)
  // ===========================================================================
  {
    id: 'b2021s582a-q4',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 4,
    topic: 'פונקציה מעריכית',
    totalPoints: 33,
    context:
      '(קיץ תשפ"א, מועד א\') נתונה הפונקציה $\\;f(x) = 1 + a\\,e^{-2x}$ המוגדרת לכל $x$, $\\;a > 1$ פרמטר.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצא את משוואות האסימפטוטות של $f(x)$ המאונכות לצירים (אם יש כאלה).',
        answer_type: 'expression',
        hints: ['בדוק $\\lim_{x\\to\\pm\\infty} f(x)$. אסימפטוטה אנכית לציר $y$ = אופקית.'],
        solution: {
          steps: [
            '$x\\to+\\infty:\\;\\; f = 1 + ae^{-2x}\\to 1 \\;\\Rightarrow\\; y = 1$',
            '$x\\to-\\infty:\\;\\; f\\to\\infty$ — אין אסימפטוטה',
            'אנכית: אין ($f$ מוגדרת לכל $x$)',
          ],
          final_answer: 'אסימפטוטה אופקית יחידה: $\\;y = 1$.',
        },
      },
      {
        label: 'א2',
        prompt: 'מצא את תחומי העלייה והירידה של $f(x)$.',
        answer_type: 'expression',
        hints: ['$f\\,\'(x) = -2a\\,e^{-2x}$. הקבוע $-2a$ שלילי ($a>0$), והאקספוננט חיובי.'],
        solution: {
          steps: [
            "$f'(x) = -2a\\,e^{-2x} < 0$ לכל $x$ (כי $a > 0$)",
            '$f$ יורדת ממש בכל $\\mathbb{R}$ — אין קיצון',
          ],
          final_answer: '$f$ יורדת ממש על כל הישר, אין קיצון.',
        },
      },
      {
        label: 'א3',
        prompt: 'מצא את נקודות החיתוך של $f$ עם הצירים (אם יש כאלה).',
        answer_type: 'expression',
        hints: ['ציר $y$: $f(0)$. ציר $x$: $f(x)=0 \\Rightarrow 1+ae^{-2x}=0$, האם פתיר?'],
        solution: {
          steps: [
            'ציר $y$: $\\;f(0) = 1 + a \\;\\Rightarrow\\; (0,\\,1+a)$',
            'ציר $x$: $\\;1 + ae^{-2x} = 0 \\Rightarrow e^{-2x} = -\\tfrac{1}{a}$ — אין פתרון (אגף שמאל חיובי)',
          ],
          final_answer: 'חיתוך עם ציר $y$ ב-$(0,\\,1+a)$. אין חיתוך עם ציר $x$.',
        },
      },
      {
        label: 'ב1',
        prompt: 'נתונה $\\;g(x) = \\dfrac{1}{f(x)}$. מהו תחום ההגדרה של $g$? נמק.',
        answer_type: 'expression',
        hints: ['$g$ מוגדרת היכן ש-$f\\ne 0$. הראת בא3 ש-$f$ תמיד חיובית — לכן לעולם לא אפסה.'],
        solution: {
          steps: [
            '$f(x) = 1 + ae^{-2x} > 1 > 0$ לכל $x$',
            '$f$ לעולם לא מתאפסת $\\;\\Rightarrow\\; g = \\tfrac{1}{f}$ מוגדרת לכל $x$',
          ],
          final_answer: 'תחום ההגדרה של $g$: $\\;\\mathbb R$ (כל הישר).',
        },
      },
      {
        label: 'ב2',
        prompt: 'מצא את האסימפטוטות של $g$ המאונכות לצירים.',
        answer_type: 'expression',
        hints: ['השתמש בא1: $f\\to 1$ ב-$+\\infty$, $f\\to\\infty$ ב-$-\\infty$. אז $g=1/f$ שואף ל-$1$ או $0$.'],
        solution: {
          steps: [
            '$x\\to+\\infty:\\;\\; f\\to 1 \\;\\Rightarrow\\; g\\to 1$ — אסימפטוטה $y=1$',
            '$x\\to-\\infty:\\;\\; f\\to\\infty \\;\\Rightarrow\\; g\\to 0$ — אסימפטוטה $y=0$',
            'אנכית: אין',
          ],
          final_answer: 'שתי אסימפטוטות אופקיות: $\\;y = 0$ ($x\\to-\\infty$) ו-$y=1$ ($x\\to+\\infty$).',
        },
      },
      {
        label: 'ב3',
        prompt:
          'ידוע כי ל-$g$ יש נקודת פיתול אחת, המתקבלת כאשר $\\;x = \\dfrac{\\ln a}{2}$. מצא את שיעורי נקודת הפיתול וסרטט סקיצה של גרף $g$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-2, 4],
            yRange: [-0.2, 1.2],
            curves: [{ fn: (x) => 1 / (1 + 2 * Math.exp(-2 * x)) }],
            hAsymptotes: [
              { y: 0, label: 'y=0' },
              { y: 1, label: 'y=1' },
            ],
            markedPoints: [
              { x: Math.log(2) / 2, y: 0.5, label: 'פיתול' },
              { x: 0, y: 1 / 3, label: '(0,1/(1+a))' },
            ],
            caption: 'סיגמואיד $g(x) = 1/f(x)$ (לדוגמה $a=2$): עולה מ-$0$ ל-$1$, פיתול ב-$x=\\frac{\\ln a}{2}$ עם $y=\\frac{1}{2}$.',
          },
        ],
        hints: [
          'הצב $x = \\tfrac{\\ln a}{2}$ ב-$f$: $\\;e^{-2x} = e^{-\\ln a} = 1/a$, אז $f = 1 + a\\cdot(1/a) = 2$.',
          '$g = 1/f = 1/2$. נקודת הפיתול: $\\bigl(\\tfrac{\\ln a}{2},\\,\\tfrac{1}{2}\\bigr)$.',
        ],
        solution: {
          steps: [
            '$x = \\tfrac{\\ln a}{2}:\\;\\; e^{-2x} = e^{-\\ln a} = \\tfrac{1}{a}$',
            '$f = 1 + a\\cdot\\tfrac{1}{a} = 2 \\;\\Rightarrow\\; g = \\tfrac{1}{2}$',
            'נקודת פיתול: $\\;\\bigl(\\tfrac{\\ln a}{2},\\,\\tfrac{1}{2}\\bigr)$',
            'הגרף: סיגמואיד עולה מ-$0$ ל-$1$, חוצה $y=\\tfrac12$ בפיתול (ראה סקיצה).',
          ],
          final_answer: 'נקודת פיתול: $\\;\\bigl(\\tfrac{\\ln a}{2},\\,\\tfrac{1}{2}\\bigr)$. הגרף — סיגמואיד.',
        },
      },
      {
        label: 'ג1',
        prompt: 'מצא את שיעורי נקודת הקיצון של הפונקציה $g\'(x)$.',
        answer_type: 'expression',
        hints: [
          'נקודת הקיצון של $g\'$ היא המקום שבו הנגזרת של $g\'$ מתאפסת — כלומר נקודת הפיתול של $g$ (מסעיף ב3): $x=\\dfrac{\\ln a}{2}$.',
          'הצב $x=\\dfrac{\\ln a}{2}$ ב-$g\'(x)=\\dfrac{2ae^{-2x}}{(1+ae^{-2x})^2}$ — שם $ae^{-2x}=1$.',
        ],
        solution: {
          steps: [
            "$g'(x) = -\\dfrac{f'(x)}{f(x)^2} = \\dfrac{2a\\,e^{-2x}}{(1+a\\,e^{-2x})^2}$",
            "הקיצון של $g'$ = הפיתול של $g$: $\\;x = \\tfrac{\\ln a}{2}$ (שם $ae^{-2x} = 1$)",
            "$g'\\bigl(\\tfrac{\\ln a}{2}\\bigr) = \\dfrac{2}{(1+1)^2} = \\dfrac{1}{2}$",
            "$g' > 0$ בכל מקום ו-$g'\\to 0$ בקצוות, ולכן מקסימום",
          ],
          final_answer: "נקודת קיצון (מקסימום) של $g'$: $\\;\\left(\\dfrac{\\ln a}{2},\\; \\dfrac{1}{2}\\right)$.",
        },
      },
      {
        label: 'ג2',
        prompt: 'סרטט את גרף הפונקציה $g\'(x)$. פרט את שיקוליך.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-2, 4],
            yRange: [-0.05, 0.6],
            curves: [{ fn: (x) => (4 * Math.exp(-2 * x)) / Math.pow(1 + 2 * Math.exp(-2 * x), 2) }],
            hAsymptotes: [{ y: 0, label: 'y=0' }],
            markedPoints: [{ x: Math.log(2) / 2, y: 0.5, label: 'מקס' }],
            caption:
              'הנגזרת $g\'(x)$ (לדוגמה $a=2$): עקומת פעמון חיובית, מקסימום $\\bigl(\\tfrac{\\ln a}{2},\\tfrac12\\bigr)$, אסימפטוטה $y=0$ בשני הקצוות.',
          },
        ],
        hints: [
          'מסעיף ג1: $g\'>0$ תמיד, ומקסימום יחיד ב-$\\bigl(\\tfrac{\\ln a}{2},\\tfrac12\\bigr)$.',
          'בקצוות $x\\to\\pm\\infty$ הפונקציה $g$ משתטחת, ולכן $g\'\\to 0$.',
        ],
        solution: {
          steps: [
            "$g'(x) = \\dfrac{2a\\,e^{-2x}}{(1+a\\,e^{-2x})^2} > 0$ לכל $x$ — הגרף כולו מעל ציר $x$",
            "בקצוות $x\\to\\pm\\infty:\\;\\; g'\\to 0$ — אסימפטוטה $y=0$",
            "מקסימום יחיד $\\bigl(\\tfrac{\\ln a}{2},\\tfrac12\\bigr)$ (מסעיף ג1) — עקומת פעמון",
          ],
          final_answer: 'עקומת פעמון חיובית: מקסימום $\\bigl(\\tfrac{\\ln a}{2},\\tfrac12\\bigr)$, אסימפטוטה $y=0$ משני הצדדים.',
        },
      },
      {
        label: 'ד',
        prompt: "מצא את השטח המוגבל על-ידי גרף הפונקציה $g'(x)$ ועל-ידי הישרים $\\;y = \\dfrac{1}{2}\\;$ ו-$\\;x = 0$.",
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 245 195',
            svg: `
              <line x1="14" y1="160" x2="236" y2="160" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="50" y1="14" x2="50" y2="184" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="227" y="173" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">x</text>
              <text x="38" y="24" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">y</text>
              <path d="M 50,54 L 140,54 L 120,73 L 102,101 L 79,131 L 50,152 Z" fill="rgba(168,85,247,0.25)" stroke="none"/>
              <line x1="50" y1="54" x2="232" y2="54" stroke="rgba(96,165,250,0.9)" stroke-width="1.4" stroke-dasharray="5 3"/>
              <text x="188" y="49" fill="#bfdbfe" font-size="10" font-family="Heebo, sans-serif">y=½</text>
              <path d="M 20,160 C 90,158 115,60 140,54 C 165,60 190,158 232,160" fill="none" stroke="rgba(244,114,182,0.95)" stroke-width="2"/>
              <circle cx="140" cy="54" r="3.2" fill="rgba(244,114,182,0.95)"/>
              <text x="143" y="49" fill="#f1f5f9" font-size="9" font-family="Heebo, sans-serif">(½ln a , ½)</text>
              <text x="41" y="173" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">0</text>
              <text x="86" y="121" fill="#e9d5ff" font-size="13" font-weight="bold" font-family="Heebo, sans-serif">S</text>
              <text x="158" y="150" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">g'(x)</text>
            `,
            caption: "השטח $S$ (סגול) כלוא בין הישר $y=\\tfrac12$ לעקומה $g'(x)$, מ-$x=0$ עד הפסגה $x=\\tfrac{\\ln a}{2}$.",
          },
        ],
        hints: [
          "הישר $y=\\tfrac12$ הוא בדיוק המקסימום של $g'$ (מסעיף ג1), המושג ב-$x=\\tfrac{\\ln a}{2}$.",
          "בקטע $\\bigl[0,\\tfrac{\\ln a}{2}\\bigr]$ מתקיים $g'\\le\\tfrac12$.",
          "שטח $= \\displaystyle\\int_0^{(\\ln a)/2}\\bigl(\\tfrac12 - g'(x)\\bigr)dx$. שים לב ש-$\\int g'(x)\\,dx = g(x)$.",
        ],
        solution: {
          steps: [
            "בקטע $\\bigl[0,\\,\\tfrac{\\ln a}{2}\\bigr]$ מתקיים $g' \\le \\tfrac12$ — השטח כלוא בין $y=\\tfrac12$ לעקומה.",
            "$S = \\displaystyle\\int_0^{\\frac{\\ln a}{2}}\\!\\bigl(\\tfrac12 - g'(x)\\bigr)\\,dx = \\Bigl[\\tfrac{x}{2} - g(x)\\Bigr]_0^{\\frac{\\ln a}{2}}$",
            "$g\\bigl(\\tfrac{\\ln a}{2}\\bigr) = \\tfrac12, \\quad g(0) = \\tfrac{1}{1+a}$",
            "$S = \\Bigl(\\tfrac{\\ln a}{4} - \\tfrac12\\Bigr) - \\Bigl(0 - \\tfrac{1}{1+a}\\Bigr) = \\tfrac{\\ln a}{4} + \\tfrac{1}{a+1} - \\tfrac12$",
          ],
          final_answer: "השטח: $\\;S = \\dfrac{\\ln a}{4} + \\dfrac{1}{a+1} - \\dfrac{1}{2}$.",
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q5 — חקירת $f = \ln\frac{x^2-1}{(x+2)(x-1)}$ ו-$g = \ln f$
  // ===========================================================================
  {
    id: 'b2021s582a-q5',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 5,
    topic: 'פונקציית ln',
    totalPoints: 33,
    context:
      '(קיץ תשפ"א, מועד א\') נתונה הפונקציה $\\;f(x) = \\ln\\dfrac{x^2 - 1}{(x+2)(x-1)}$.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצא את תחום ההגדרה של $f(x)$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 300 64',
            svg: `
              <line x1="12" y1="34" x2="288" y2="34" stroke="rgba(226,232,240,0.6)" stroke-width="1.2"/>
              <line x1="85" y1="20" x2="85" y2="48" stroke="rgba(148,163,184,0.55)" stroke-width="1" stroke-dasharray="3 2"/>
              <line x1="155" y1="20" x2="155" y2="48" stroke="rgba(148,163,184,0.55)" stroke-width="1" stroke-dasharray="3 2"/>
              <line x1="235" y1="20" x2="235" y2="48" stroke="rgba(148,163,184,0.55)" stroke-width="1" stroke-dasharray="3 2"/>
              <text x="78" y="61" fill="#94a3b8" font-size="12" font-family="Heebo, sans-serif">-2</text>
              <text x="148" y="61" fill="#94a3b8" font-size="12" font-family="Heebo, sans-serif">-1</text>
              <text x="231" y="61" fill="#94a3b8" font-size="12" font-family="Heebo, sans-serif">1</text>
              <text x="44" y="23" fill="#4ade80" font-size="16" font-weight="bold" font-family="Heebo, sans-serif">+</text>
              <text x="116" y="23" fill="#f87171" font-size="16" font-weight="bold" font-family="Heebo, sans-serif">&#8722;</text>
              <text x="191" y="23" fill="#4ade80" font-size="16" font-weight="bold" font-family="Heebo, sans-serif">+</text>
              <text x="260" y="23" fill="#4ade80" font-size="16" font-weight="bold" font-family="Heebo, sans-serif">+</text>
            `,
            caption: 'טבלת הסימן של $\\dfrac{x^2-1}{(x+2)(x-1)}$ — חיובי ב-$x<-2$ וב-$x>-1$ (פרט ל-$x=1$).',
          },
        ],
        hints: [
          'פירוק: $x^2 - 1 = (x-1)(x+1)$.',
          'הפונקציה הופכת ל-$\\;\\dfrac{(x-1)(x+1)}{(x+2)(x-1)} = \\dfrac{x+1}{x+2}\\;$ (עבור $x \\ne 1$).',
          'תנאים: $x \\ne 1$ (התאפסות במכנה המקורי), $x \\ne -2$, ו-$\\dfrac{x^2-1}{(x+2)(x-1)} > 0$.',
        ],
        solution: {
          steps: [
            'תנאי $\\ln$: הביטוי חיובי — $\\;\\dfrac{x^2-1}{(x+2)(x-1)} > 0$',
            'נקודות קריטיות: $\\;x^2-1=0 \\Rightarrow x=\\pm1$',
            'המכנה מתאפס ב-$x=-2$ וב-$x=1$',
            'טבלת סימן (ראה תרשים): הביטוי חיובי ב-$x<-2$ וב-$x>-1$',
            'מחריגים $x=1$ (במקור $0/0$), לכן התחום: $\\;x<-2$ או $-1<x<1$ או $x>1$',
          ],
          final_answer:
            'תחום ההגדרה: $\\;x<-2$ או $-1<x<1$ או $x>1$.',
        },
      },
      {
        label: 'א2',
        prompt: 'מצא את האסימפטוטות של $f$ המאונכות לצירים (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          'אנכיות: בקצוות תחום ההגדרה — בדוק את הגבול של $\\dfrac{x+1}{x+2}$ ב-$x\\to -2^-$ וב-$x\\to -1^+$.',
          'אופקיות: $\\dfrac{x+1}{x+2}\\to 1$ כש-$x\\to\\pm\\infty$, אז $\\ln\\to 0$.',
        ],
        solution: {
          steps: [
            '$x\\to -2^-:\\;\\; \\dfrac{x+1}{x+2}\\to+\\infty \\;\\Rightarrow\\; f\\to+\\infty$ — אסימפטוטה $x=-2$',
            '$x\\to -1^+:\\;\\; \\dfrac{x+1}{x+2}\\to 0^+ \\;\\Rightarrow\\; f\\to-\\infty$ — אסימפטוטה $x=-1$',
            '$x\\to\\pm\\infty:\\;\\; \\dfrac{x+1}{x+2}\\to 1 \\;\\Rightarrow\\; f\\to\\ln 1 = 0$ — אסימפטוטה $y=0$',
            'ב-$x=1$ אין אסימפטוטה — המנה שואפת ל-$\\tfrac{2}{3}$, זהו חור בגרף.',
          ],
          final_answer:
            'אנכיות: $x=-2$ ו-$x=-1$. אופקית: $y=0$.',
        },
      },
      {
        label: 'א3',
        prompt: 'מצא את תחומי העלייה והירידה של $f(x)$ (אם יש כאלה).',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 300 66',
            svg: `
              <rect x="110" y="22" width="70" height="24" fill="rgba(100,116,139,0.20)"/>
              <line x1="12" y1="34" x2="288" y2="34" stroke="rgba(226,232,240,0.6)" stroke-width="1.2"/>
              <line x1="110" y1="20" x2="110" y2="48" stroke="rgba(148,163,184,0.55)" stroke-width="1" stroke-dasharray="3 2"/>
              <line x1="180" y1="20" x2="180" y2="48" stroke="rgba(148,163,184,0.55)" stroke-width="1" stroke-dasharray="3 2"/>
              <line x1="245" y1="20" x2="245" y2="48" stroke="rgba(148,163,184,0.55)" stroke-width="1" stroke-dasharray="3 2"/>
              <text x="103" y="61" fill="#94a3b8" font-size="12" font-family="Heebo, sans-serif">-2</text>
              <text x="173" y="61" fill="#94a3b8" font-size="12" font-family="Heebo, sans-serif">-1</text>
              <text x="241" y="61" fill="#94a3b8" font-size="12" font-family="Heebo, sans-serif">1</text>
              <text x="48" y="23" fill="#4ade80" font-size="13" font-weight="bold" font-family="Heebo, sans-serif">+ &#8599;</text>
              <text x="126" y="24" fill="#64748b" font-size="10" font-family="Heebo, sans-serif">אין</text>
              <text x="198" y="23" fill="#4ade80" font-size="13" font-weight="bold" font-family="Heebo, sans-serif">+ &#8599;</text>
              <text x="262" y="23" fill="#4ade80" font-size="13" font-weight="bold" font-family="Heebo, sans-serif">&#8599;</text>
            `,
            caption: "טבלת הסימן של $f'(x)=\\dfrac{1}{(x+1)(x+2)}$: חיובית בכל התחום — $f$ עולה (האזור $-2<x<-1$ אינו בתחום).",
          },
        ],
        hints: [
          "פירוק לוג: $\\;f(x) = \\ln(x+1) - \\ln(x+2)$, וגוזרים כל איבר.",
          "סימן $f'$: המונה $1 > 0$, אז הסימן נקבע לפי $(x+1)(x+2)$.",
        ],
        solution: {
          steps: [
            "נפרק את הלוג: $\\;f(x) = \\ln(x+1) - \\ln(x+2)$",
            "$f'(x) = \\dfrac{1}{x+1} - \\dfrac{1}{x+2} = \\dfrac{(x+2)-(x+1)}{(x+1)(x+2)} = \\dfrac{1}{(x+1)(x+2)}$",
            "טבלת סימן (ראה תרשים): בכל תחום ההגדרה $(x+1)(x+2) > 0$, לכן $f' > 0$",
            "$f$ עולה ממש בכל תחום ההגדרה, אין ירידה ואין קיצון",
          ],
          final_answer:
            "$f$ עולה ממש בכל תחום ההגדרה (אין ירידה ואין קיצון), כי $f'(x)=\\dfrac{1}{(x+1)(x+2)}>0$.",
        },
      },
      {
        label: 'א4',
        prompt: 'סרטט את גרף הפונקציה $f(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-6, 6],
            yRange: [-3, 3],
            curves: [
              {
                fn: (x) => {
                  if (x === 1 || x === -2) return NaN;
                  const r = (x + 1) / (x + 2);
                  return r > 0 ? Math.log(r) : NaN;
                },
                domain: [-6, 6],
              },
            ],
            hAsymptotes: [{ y: 0, label: 'y=0' }],
            vAsymptotes: [
              { x: -2, label: 'x=-2' },
              { x: -1, label: 'x=-1' },
            ],
            markedPoints: [
              { x: 0, y: -Math.log(2), label: '(0,-ln2)' },
              { x: 1, y: Math.log(2 / 3), label: 'חור' },
            ],
            caption: 'שני ענפים: שמאלי ($x<-2$) עולה מ-$0$ ל-$+\\infty$; ימני ($x>-1$) עולה מ-$-\\infty$ ל-$0$, עובר $(0,-\\ln 2)$, עם חור ב-$x=1$.',
          },
        ],
        hints: ['השתמש במאפיינים מהסעיפים הקודמים: תחום ההגדרה, האסימפטוטות, ו-$f$ עולה ממש בכל ענף (א3).'],
        solution: {
          steps: [
            'מאפיינים: תחום $x<-2$ או $-1<x<1$ או $x>1$; אסימפטוטות $x=-2,\\,x=-1,\\,y=0$; עולה בכל ענף.',
            'ענף שמאלי ($x<-2$): עולה מ-$0$ ל-$+\\infty$, כולו חיובי.',
            'ענף ימני ($x>-1$): עולה מ-$-\\infty$ ל-$0$, כולו שלילי; חיתוך ציר $y$ ב-$(0,-\\ln 2)$; חור ב-$\\bigl(1,\\,\\ln\\tfrac{2}{3}\\bigr)$.',
          ],
          final_answer:
            'שני ענפים עולים (ראה תרשים): שמאלי חיובי, ימני שלילי עם חור ב-$x=1$.',
        },
      },
      {
        label: 'ב1',
        prompt: 'נתונה $\\;g(x) = \\ln(f(x))$. מצא את תחום ההגדרה של $g$.',
        answer_type: 'expression',
        hints: [
          '$\\ln$ דורש $f(x) > 0$. מהסעיפים הקודמים, $f>0$ רק על הענף השמאלי.',
          'אלגברית: $f>0 \\iff \\dfrac{x+1}{x+2}>1 \\iff x+2<0 \\iff x<-2$.',
        ],
        solution: {
          steps: [
            '$g = \\ln(f)$ מוגדרת כאשר $f(x) > 0$, כלומר $\\ln\\dfrac{x+1}{x+2} > 0$',
            '$\\dfrac{x+1}{x+2} > 1$',
            'שקול ל-$\\dfrac{-1}{x+2} > 0$',
            'כלומר $x < -2$',
          ],
          final_answer: 'תחום ההגדרה של $g$: $\\;x<-2$.',
        },
      },
      {
        label: 'ב2',
        prompt: 'מצא את תחומי העלייה והירידה של $g(x)$ (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          'גזירת הרכבה: $g\'(x) = \\dfrac{f\'(x)}{f(x)}$.',
          'בתחום ההגדרה של $g$ ($x<-2$) מתקיים $f>0$ (הגדרת $g$) ו-$f\'>0$ (סעיף א3) — מה הסימן של המנה?',
        ],
        solution: {
          steps: [
            "$g'(x) = \\dfrac{f'(x)}{f(x)}$ (כלל השרשרת)",
            "ב-$x<-2$: $\\;f > 0$ (הגדרת $g$) ו-$f' = \\dfrac{1}{(x+1)(x+2)} > 0$ (א3) $\\;\\Rightarrow\\; g' > 0$",
            "$g$ עולה ממש בכל תחום ההגדרה $x<-2$, אין קיצון",
          ],
          final_answer: '$g$ עולה ממש בכל תחום ההגדרה $x<-2$ (אין ירידה ואין קיצון).',
        },
      },
      {
        label: 'ב3',
        prompt: 'סרטט סקיצה של גרף $g(x)$. פרט את שיקוליך.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-8, -2.05],
            yRange: [-4, 4],
            curves: [
              {
                fn: (x) => {
                  if (x >= -2) return NaN;
                  const r = (x + 1) / (x + 2);
                  return r > 1 ? Math.log(Math.log(r)) : NaN;
                },
                domain: [-8, -2.05],
              },
            ],
            vAsymptotes: [{ x: -2, label: 'x=-2' }],
            caption: 'הגרף של $g=\\ln f$ על הענף השמאלי: עולה ממש מ-$-\\infty$ (ב-$-\\infty$) ל-$+\\infty$ (ב-$-2^-$).',
          },
        ],
        hints: [
          'מסעיף ב2: $g$ עולה ממש ב-$x<-2$.',
          'גבולות: $x\\to-\\infty$: $f\\to 0^+$ אז $g\\to-\\infty$; $\\;x\\to -2^-$: $f\\to+\\infty$ אז $g\\to+\\infty$.',
        ],
        solution: {
          steps: [
            '$g$ עולה ממש ב-$x<-2$ (מסעיף ב2).',
            '$x\\to-\\infty:\\;\\; f\\to 0^+ \\;\\Rightarrow\\; g\\to-\\infty$',
            '$x\\to-2^-:\\;\\; f\\to+\\infty \\;\\Rightarrow\\; g\\to+\\infty$ — אסימפטוטה $x=-2$',
          ],
          final_answer:
            'גרף עולה ממש ב-$x<-2$, מ-$-\\infty$ ל-$+\\infty$, אסימפטוטה אנכית $x=-2$.',
        },
      },
      {
        label: 'ג',
        prompt:
          'בעבור כל $x$ המקיים $\\;0 < f(x) < 1$, קבע אם המכפלה $\\;f(x)\\cdot g(x)\\;$ חיובית. נמק את קביעתך.',
        answer_type: 'text',
        hints: [
          '$0<f<1$ קובע ש-$f>0$. ומה הסימן של $g=\\ln f$ כאשר $f$ בין $0$ ל-$1$?',
          'לוגריתם של מספר בתחום $(0,1)$ הוא שלילי, אז $g<0$. ומכפלה $f\\cdot g$?',
        ],
        solution: {
          steps: [
            '$0 < f < 1 \\;\\Rightarrow\\; f > 0$ וגם $g = \\ln f < 0$ (לוג של מספר ב-$(0,1)$ שלילי)',
            '$f\\cdot g = (+)\\cdot(-) < 0$ — המכפלה שלילית, אינה חיובית.',
          ],
          final_answer:
            'המכפלה $f(x)\\cdot g(x)$ **שלילית** (אינה חיובית) לכל $x$ עם $0<f(x)<1$ — כי $f>0$ ו-$g=\\ln f<0$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
