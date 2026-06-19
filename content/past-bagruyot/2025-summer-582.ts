/**
 * שאלון 582 — קיץ תשפ"ה (2025), מועד א'
 * =====================================
 *
 * המקור של השאלות: meyda.education.gov.il (משרד החינוך — נחלת הכלל).
 * הפתרונות נכתבו על-ידינו בסגנון האפליקציה, ואומתו מול פתרון הנבחן.
 *
 * תוכן השאלון:
 *   Q1 — גאומטריה אנליטית (מעגל עם פרמטר, משיק, מקום גאומטרי שהוא אליפסה,
 *        מוקדים, היקף ושטח משולש המוקדים).
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2025Summer582: PastBagrutQuestion[] = [
  {
    id: 'b2025s582a-q1',
    year: 2025,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    totalPoints: 25,
    context:
      'נתון מעגל $I$ שמשוואתו $\\;x^2 - 8x + y^2 + t = 0$, כאשר $t$ הוא פרמטר הקטן מ-$16$.',
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 250 200',
        svg: `
          <line x1="15" y1="105" x2="236" y2="105" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <line x1="45" y1="15" x2="45" y2="192" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <text x="228" y="118" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
          <text x="32" y="20" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
          <circle cx="125" cy="105" r="56.6" fill="rgba(96,165,250,0.06)" stroke="rgba(96,165,250,0.9)" stroke-width="1.6"/>
          <circle cx="125" cy="105" r="2.6" fill="rgba(96,165,250,0.95)"/>
          <text x="129" y="119" fill="#60a5fa" font-size="10" font-family="Heebo, sans-serif">M(4,0)</text>
          <line x1="25" y1="125" x2="148" y2="2" stroke="rgba(52,211,153,0.9)" stroke-width="1.5"/>
          <text x="150" y="12" fill="#34d399" font-size="10" font-family="Heebo, sans-serif">y=x</text>
          <line x1="125" y1="105" x2="85" y2="65" stroke="rgba(148,163,184,0.8)" stroke-width="1" stroke-dasharray="3,2"/>
          <text x="108" y="80" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">R</text>
          <polyline points="91,59 96,65 91,71" fill="none" stroke="rgba(251,191,36,0.9)" stroke-width="1"/>
          <circle cx="85" cy="65" r="2.6" fill="rgba(251,191,36,0.95)"/>
          <circle cx="45" cy="105" r="2.2" fill="rgba(226,232,240,0.85)"/>
          <text x="33" y="118" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">O</text>
        `,
        caption:
          'מעגל $I$ — מרכזו $M(4,0)$ ורדיוסו $R = \\sqrt{16 - t}$. הישר $y = x$ משיק למעגל; בנקודת ההשקה הרדיוס מאונך למשיק, ולכן המרחק מ-$M$ אל הישר שווה ל-$R$.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הביעו באמצעות $t$ את רדיוס המעגל.',
        answer_type: 'expression',
        hints: [
          'סדרו את המשוואה לצורה הקנונית $(x-a)^2 + (y-b)^2 = R^2$ על-ידי השלמה לריבוע.',
          'הריבוע החסר הוא של $x^2 - 8x$: מוסיפים לשני האגפים $16$.',
          'הרדיוס הוא השורש של האגף הימני — שימו לב שצריך $16 - t > 0$, וזה אכן מתקיים כי $t < 16$.',
        ],
        solution: {
          steps: [
            'נתונה המשוואה $\\;x^2 - 8x + y^2 + t = 0$.',
            'מעבירים את $t$ לאגף הימני: $\\;x^2 - 8x + y^2 = -t$.',
            'משלימים לריבוע את $x^2 - 8x$ — מוסיפים $16$ לשני האגפים: $\\;x^2 - 8x + 16 + y^2 = 16 - t$.',
            'כותבים את שלושת האיברים הראשונים כריבוע: $\\;(x - 4)^2 + y^2 = 16 - t$.',
            'זוהי הצורה הקנונית $(x - 4)^2 + y^2 = R^2$, ולכן מרכז המעגל הוא $M(4, 0)$ ומתקיים $\\;R^2 = 16 - t$.',
            'מוציאים שורש (אפשרי כי $t < 16$, ולכן $16 - t > 0$): $\\;R = \\sqrt{16 - t}$.',
          ],
          final_answer: '$R = \\sqrt{16 - t}\\;$ (ומרכז המעגל הוא $M(4, 0)$).',
        },
      },
      {
        label: 'ב',
        prompt: [
          'הישר $y = x$ משיק למעגל $I$.',
          '',
          'מצאו את הערך של $t$.',
        ].join('\n'),
        answer_type: 'number',
        hints: [
          'ישר משיק למעגל ⟺ המרחק ממרכז המעגל אל הישר שווה לרדיוס.',
          'כתבו את הישר בצורה הכללית $x - y = 0$ והשתמשו בנוסחת המרחק מנקודה לישר.',
          'השוו את המרחק שקיבלתם ל-$R = \\sqrt{16 - t}$, והעלו בריבוע.',
        ],
        solution: {
          steps: [
            'תנאי המשיקות: המרחק ממרכז המעגל $M(4, 0)$ אל הישר שווה לרדיוס $R$.',
            'כותבים את הישר $y = x$ בצורה הכללית: $\\;x - y = 0$.',
            'נוסחת המרחק מנקודה $(x_0, y_0)$ אל הישר $Ax + By + C = 0$: $\\;d = \\dfrac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}$.',
            'מציבים את $M(4, 0)$ ואת מקדמי הישר $A = 1,\\ B = -1,\\ C = 0$: $\\;d = \\dfrac{|1 \\cdot 4 + (-1) \\cdot 0|}{\\sqrt{1^2 + (-1)^2}} = \\dfrac{4}{\\sqrt{2}}$.',
            'מפשטים: $\\;d = \\dfrac{4}{\\sqrt{2}} = 2\\sqrt{2} = \\sqrt{8}$.',
            'משווים את המרחק לרדיוס: $\\;\\sqrt{16 - t} = \\sqrt{8}$.',
            'מעלים בריבוע את שני האגפים: $\\;16 - t = 8$.',
            'מבודדים את $t$: $\\;t = 8$.',
          ],
          final_answer: '$t = 8$',
        },
      },
      {
        label: 'ג',
        prompt: [
          'מזיזים את מעגל $I$ שמאלה כך שמתקבל מעגל $II$ שמרכזו בראשית הצירים $O$.',
          'הנקודה $A$ היא נקודה כלשהי על מעגל $II$ שמתקיים בעבורה $-2 \\le y_A \\le 2$.',
          'דרך הנקודה $A$ מעבירים מיתר $AB$ המאונך לציר ה-$y$. הנקודה $P$ נמצאת על המיתר $AB$ כך שמתקיים $AB = 2 \\cdot PO$.',
          '',
          'הראו כי המקום הגאומטרי של כל הנקודות $P$ המתקבלות באופן זה נמצא על אליפסה, ומצאו את משוואתה.',
        ].join('\n'),
        answer_type: 'proof',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 250 220',
            svg: `
              <line x1="15" y1="120" x2="238" y2="120" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="125" y1="18" x2="125" y2="215" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="230" y="133" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="112" y="24" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <circle cx="125" cy="120" r="79" fill="rgba(96,165,250,0.05)" stroke="rgba(96,165,250,0.85)" stroke-width="1.5"/>
              <line x1="64" y1="70" x2="186" y2="70" stroke="rgba(244,114,182,0.9)" stroke-width="1.6"/>
              <polyline points="132,70 132,77 125,77" fill="none" stroke="rgba(226,232,240,0.7)" stroke-width="1"/>
              <line x1="125" y1="120" x2="186" y2="70" stroke="rgba(148,163,184,0.7)" stroke-width="1" stroke-dasharray="3,2"/>
              <line x1="125" y1="120" x2="159" y2="70" stroke="rgba(251,191,36,0.95)" stroke-width="1.6"/>
              <circle cx="186" cy="70" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="190" y="68" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">A</text>
              <circle cx="64" cy="70" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="52" y="68" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">B</text>
              <circle cx="159" cy="70" r="3" fill="rgba(251,191,36,0.95)"/>
              <text x="160" y="62" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">P</text>
              <circle cx="125" cy="120" r="2.6" fill="rgba(226,232,240,0.9)"/>
              <text x="112" y="134" fill="#94a3b8" font-size="9.5" font-family="Heebo, sans-serif">O</text>
            `,
            caption:
              'מעגל $II$: $\\;x^2 + y^2 = 8$. המיתר $AB$ אופקי (מאונך לציר ה-$y$), ו-$B$ סימטרית ל-$A$ ביחס לציר ה-$y$. הנקודה $P$ נמצאת על המיתר ומקיימת $AB = 2 \\cdot PO$.',
          },
        ],
        hints: [
          'מעגל $II$ מתקבל מהזזת מעגל $I$ כך שהמרכז עובר ל-$(0, 0)$ — כתבו את משוואתו.',
          'סמנו $A(x_A, y)$ ו-$B(-x_A, y)$ (מיתר אופקי), ו-$P(x, y)$ באותו גובה. בטאו את $AB$ ואת $PO$.',
          'הציבו בתנאי $AB = 2\\,PO$, העלו בריבוע, וצמצמו — תתקבל משוואת אליפסה.',
        ],
        solution: {
          steps: [
            'מעגל $I$ (לאחר שמצאנו $t = 8$) הוא $\\;(x - 4)^2 + y^2 = 8$, עם מרכז $(4, 0)$ ורדיוס $\\sqrt{8}$.',
            'מזיזים שמאלה כך שהמרכז עובר לראשית — מתקבל מעגל $II$: $\\;x^2 + y^2 = 8$.',
            'המיתר $AB$ מאונך לציר ה-$y$, כלומר אופקי, ולכן ל-$A$ ול-$B$ אותו שיעור $y$. נסמן $A(x_A,\\, y)$ ו-$B(-x_A,\\, y)$ — שתי נקודות החיתוך של הישר האופקי עם המעגל סימטריות ביחס לציר ה-$y$.',
            '$A$ נמצאת על מעגל $II$: $\\;x_A^2 + y^2 = 8$, ולכן $\\;x_A = \\sqrt{8 - y^2}$.',
            'אורך המיתר: $\\;AB = x_A - (-x_A) = 2x_A = 2\\sqrt{8 - y^2}$.',
            'הנקודה $P$ נמצאת על המיתר, ולכן גם לה אותו שיעור $y$. נסמן $P(x,\\, y)$, והמרחק מהראשית הוא $\\;PO = \\sqrt{x^2 + y^2}$.',
            'מציבים בתנאי $AB = 2\\,PO$: $\\;2\\sqrt{8 - y^2} = 2\\sqrt{x^2 + y^2}$.',
            'מחלקים ב-$2$: $\\;\\sqrt{8 - y^2} = \\sqrt{x^2 + y^2}$.',
            'מעלים בריבוע את שני האגפים: $\\;8 - y^2 = x^2 + y^2$.',
            'מסדרים: $\\;x^2 + 2y^2 = 8$.',
            'מחלקים ב-$8$ כדי לקבל את הצורה הקנונית: $\\;\\dfrac{x^2}{8} + \\dfrac{y^2}{4} = 1$.',
            'זוהי משוואת אליפסה, ולכן המקום הגאומטרי של הנקודות $P$ נמצא על אליפסה.',
          ],
          final_answer: 'המקום הגאומטרי הוא האליפסה $\\;\\dfrac{x^2}{8} + \\dfrac{y^2}{4} = 1$.',
        },
      },
      {
        label: 'ד',
        prompt: [
          'הנקודה $K$ היא המוקד הימני, והנקודה $F$ היא המוקד השמאלי של האליפסה שמצאתם בסעיף ג.',
          'הנקודה $C$ היא נקודה כלשהי על האליפסה, כך שהיא יוצרת עם המוקדים את המשולש $CKF$.',
          '',
          'חשבו את היקף המשולש $CKF$.',
        ].join('\n'),
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 280 190',
            svg: `
              <ellipse cx="140" cy="95" rx="96" ry="68" fill="rgba(96,165,250,0.05)" stroke="rgba(96,165,250,0.85)" stroke-width="1.6"/>
              <line x1="20" y1="95" x2="268" y2="95" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="140" y1="18" x2="140" y2="182" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="260" y="91" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="145" y="24" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <polygon points="106,31 208,95 72,95" fill="rgba(168,85,247,0.10)" stroke="rgba(168,85,247,0.9)" stroke-width="1.6"/>
              <circle cx="208" cy="95" r="3" fill="rgba(251,191,36,0.95)"/>
              <text x="204" y="88" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">K</text>
              <text x="201" y="109" fill="#94a3b8" font-size="8.5" font-family="Heebo, sans-serif">(2,0)</text>
              <circle cx="72" cy="95" r="3" fill="rgba(251,191,36,0.95)"/>
              <text x="68" y="88" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">F</text>
              <text x="56" y="109" fill="#94a3b8" font-size="8.5" font-family="Heebo, sans-serif">(-2,0)</text>
              <circle cx="106" cy="31" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="96" y="29" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">C</text>
              <text x="237" y="107" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">√8</text>
            `,
            caption:
              'האליפסה $\\;\\dfrac{x^2}{8} + \\dfrac{y^2}{4} = 1$ עם המוקדים $F(-2, 0)$ ו-$K(2, 0)$. עבור כל נקודה $C$ על האליפסה מתקיים $\\;CF + CK = 2a = 4\\sqrt{2}$, והבסיס $FK = 2c = 4$.',
          },
        ],
        hints: [
          'באליפסה $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ (עם $a^2 > b^2$): כאן $a^2 = 8,\\ b^2 = 4$. חשבו את $c$ מ-$c^2 = a^2 - b^2$.',
          'לפי הגדרת האליפסה, סכום המרחקים מנקודה על האליפסה לשני המוקדים קבוע: $\\;CF + CK = 2a$.',
          'הצלע השלישית $FK$ היא המרחק בין שני המוקדים: $\\;FK = 2c$.',
        ],
        solution: {
          steps: [
            'מהמשוואה $\\dfrac{x^2}{8} + \\dfrac{y^2}{4} = 1$: $\\;a^2 = 8$ ו-$b^2 = 4$ (הציר הגדול לאורך ציר ה-$x$, כי $a^2 > b^2$).',
            'אורכי חצאי-הצירים: $\\;a = \\sqrt{8} = 2\\sqrt{2}$, $\\;b = 2$.',
            'מרחק המוקד מהמרכז: $\\;c^2 = a^2 - b^2 = 8 - 4 = 4 \\Rightarrow c = 2$.',
            'המוקדים נמצאים על ציר ה-$x$: $\\;K(2, 0)$ (ימני) ו-$F(-2, 0)$ (שמאלי).',
            'לפי הגדרת האליפסה, סכום המרחקים מכל נקודה על האליפסה לשני המוקדים קבוע: $\\;CF + CK = 2a = 2\\sqrt{8} = 4\\sqrt{2}$.',
            'הצלע השלישית של המשולש היא המרחק בין המוקדים: $\\;FK = 2c = 4$.',
            'היקף המשולש: $\\;P_{CKF} = CF + CK + FK = 4\\sqrt{2} + 4$.',
          ],
          final_answer: 'היקף המשולש $CKF$ הוא $\\;4 + 4\\sqrt{2}\\;$ (בכל מיקום חוקי של $C$ על האליפסה).',
        },
      },
      {
        label: 'ה',
        prompt:
          'האם קיימת נקודה $C$ שבעבורה שטח המשולש $CKF$ הוא $5$? נמקו את תשובתכם.',
        answer_type: 'proof',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 280 190',
            svg: `
              <ellipse cx="140" cy="95" rx="96" ry="68" fill="rgba(96,165,250,0.05)" stroke="rgba(96,165,250,0.85)" stroke-width="1.6"/>
              <line x1="20" y1="95" x2="268" y2="95" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="140" y1="18" x2="140" y2="182" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="260" y="91" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="145" y="24" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <polygon points="140,27 208,95 72,95" fill="rgba(168,85,247,0.10)" stroke="rgba(168,85,247,0.9)" stroke-width="1.6"/>
              <line x1="140" y1="27" x2="140" y2="95" stroke="rgba(251,191,36,0.95)" stroke-width="1.4" stroke-dasharray="4,2"/>
              <polyline points="140,85 150,85 150,95" fill="none" stroke="rgba(226,232,240,0.7)" stroke-width="1"/>
              <text x="146" y="64" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">h=2</text>
              <circle cx="140" cy="27" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="144" y="24" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">C(0,2)</text>
              <circle cx="208" cy="95" r="3" fill="rgba(251,191,36,0.95)"/>
              <text x="205" y="108" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">K</text>
              <circle cx="72" cy="95" r="3" fill="rgba(251,191,36,0.95)"/>
              <text x="66" y="108" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">F</text>
            `,
            caption:
              'שטח המשולש גדל ככל ש-$C$ רחוקה יותר מציר ה-$x$. הגובה המרבי אל הבסיס $FK$ מתקבל בקודקוד $C(0, 2)$ והוא $\\;h = b = 2$, ולכן השטח המרבי האפשרי הוא $\\;\\dfrac{4 \\cdot 2}{2} = 4$.',
          },
        ],
        hints: [
          'קחו את $FK$ כבסיס המשולש. מהו הגובה אל הבסיס הזה?',
          'הגובה הוא המרחק מ-$C$ אל ציר ה-$x$, כלומר $|y_C|$. נסחו את השטח בעזרת $|y_C|$.',
          'זכרו שעל האליפסה $-b \\le y_C \\le b$, כלומר $-2 \\le y_C \\le 2$. מהו אם כן השטח המרבי האפשרי?',
        ],
        solution: {
          steps: [
            'נבחר את הצלע $FK$ (המונחת על ציר ה-$x$) כבסיס המשולש; אורכה $\\;FK = 2c = 4$.',
            'הגובה אל בסיס זה הוא המרחק מ-$C$ אל ציר ה-$x$, כלומר הערך המוחלט של שיעור ה-$y$ של $C$: $\\;h = |y_C|$.',
            'שטח המשולש: $\\;S_{CKF} = \\dfrac{FK \\cdot h}{2} = \\dfrac{4 \\cdot |y_C|}{2} = 2|y_C|$.',
            'נניח שקיימת נקודה $C$ ששטח המשולש בעבורה הוא $5$, ונציב: $\\;2|y_C| = 5 \\Rightarrow |y_C| = 2.5$.',
            'אבל $C$ נמצאת על האליפסה, ולכן שיעור ה-$y$ שלה חסום: $\\;-b \\le y_C \\le b$, כלומר $\\;-2 \\le y_C \\le 2$ (שכן $b = 2$).',
            'לכן הערך המרבי של $|y_C|$ הוא $2$, והשטח המרבי האפשרי הוא $\\;S_{\\max} = \\dfrac{4 \\cdot 2}{2} = 4$.',
            'מכיוון ש-$2.5 > 2$ (וכן $5 > 4$), קיבלנו סתירה, ולכן לא קיימת נקודה $C$ כזו.',
          ],
          final_answer:
            'לא. השטח המרבי של המשולש $CKF$ הוא $4$ (כאשר $C$ בקודקוד $(0,\\, \\pm 2)$), והוא קטן מ-$5$, ולכן לא קיימת נקודה $C$ ששטח המשולש בעבורה הוא $5$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
