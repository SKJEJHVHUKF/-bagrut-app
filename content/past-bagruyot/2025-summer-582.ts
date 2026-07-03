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
 *   Q2 — וקטורים במרחב (פירמידה SABCD עם בסיס מקבילית, וקטורים u/v/w,
 *        מציאת קודקודים, מישור חתך, ומקבילות/אנכיות).
 *   Q3 — מספרים מרוכבים (מקום גאומטרי, פתרון משוואה ריבועית מרוכבת,
 *        ריבוע מסובב במישור גאוס ופתרונות z^n = b).
 *   Q4 — חקירת פונקציה מעריכית עם פרמטר (תחום, אסימפטוטות, עלייה/ירידה לפי
 *        סימן a, התאמת גרף, פונקציה מורכבת g=1/(f+2), שרטוט והשוואת אינטגרלים).
 *   Q5 — חקירת f(x)=ln(x^n) עם n זוגי (תחום, זוגיות/התאמת גרף, g=(f)^2-4:
 *        חיתוכים, מינימומים, סקיצה, ונגזרת לוגריתמית k=g'/g עם שטח/אינטגרל).
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
          <line x1="15" y1="105" x2="236" y2="105" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
          <line x1="45" y1="15" x2="45" y2="192" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
          <text x="228" y="118" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
          <text x="32" y="20" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
          <circle cx="125" cy="105" r="56.6" fill="rgba(37,99,235,0.06)" stroke="rgba(37,99,235,0.9)" stroke-width="1.6"/>
          <circle cx="125" cy="105" r="2.6" fill="rgba(37,99,235,0.95)"/>
          <text x="129" y="119" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">M(4,0)</text>
          <line x1="25" y1="125" x2="148" y2="2" stroke="rgba(5,150,105,0.9)" stroke-width="1.5"/>
          <text x="150" y="12" fill="#059669" font-size="10" font-family="Heebo, sans-serif">y=x</text>
          <line x1="125" y1="105" x2="85" y2="65" stroke="rgba(100,116,139,0.8)" stroke-width="1" stroke-dasharray="3,2"/>
          <text x="108" y="80" fill="#475569" font-size="10" font-family="Heebo, sans-serif">R</text>
          <polyline points="91,59 96,65 91,71" fill="none" stroke="rgba(180,83,9,0.9)" stroke-width="1"/>
          <circle cx="85" cy="65" r="2.6" fill="rgba(180,83,9,0.95)"/>
          <circle cx="45" cy="105" r="2.2" fill="rgba(51,65,85,0.85)"/>
          <text x="33" y="118" fill="#475569" font-size="9" font-family="Heebo, sans-serif">O</text>
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
              <line x1="15" y1="120" x2="238" y2="120" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="125" y1="18" x2="125" y2="215" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <text x="230" y="133" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="112" y="24" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
              <circle cx="125" cy="120" r="79" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.85)" stroke-width="1.5"/>
              <line x1="64" y1="70" x2="186" y2="70" stroke="rgba(219,39,119,0.9)" stroke-width="1.6"/>
              <polyline points="132,70 132,77 125,77" fill="none" stroke="rgba(51,65,85,0.7)" stroke-width="1"/>
              <line x1="125" y1="120" x2="186" y2="70" stroke="rgba(100,116,139,0.7)" stroke-width="1" stroke-dasharray="3,2"/>
              <line x1="125" y1="120" x2="159" y2="70" stroke="rgba(180,83,9,0.95)" stroke-width="1.6"/>
              <circle cx="186" cy="70" r="3" fill="rgba(219,39,119,0.95)"/>
              <text x="190" y="68" fill="#DB2777" font-size="10" font-family="Heebo, sans-serif">A</text>
              <circle cx="64" cy="70" r="3" fill="rgba(219,39,119,0.95)"/>
              <text x="52" y="68" fill="#DB2777" font-size="10" font-family="Heebo, sans-serif">B</text>
              <circle cx="159" cy="70" r="3" fill="rgba(180,83,9,0.95)"/>
              <text x="160" y="62" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">P</text>
              <circle cx="125" cy="120" r="2.6" fill="rgba(51,65,85,0.9)"/>
              <text x="112" y="134" fill="#475569" font-size="9.5" font-family="Heebo, sans-serif">O</text>
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
              <ellipse cx="140" cy="95" rx="96" ry="68" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.85)" stroke-width="1.6"/>
              <line x1="20" y1="95" x2="268" y2="95" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="140" y1="18" x2="140" y2="182" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <text x="260" y="91" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="145" y="24" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
              <polygon points="106,31 208,95 72,95" fill="rgba(124,58,237,0.10)" stroke="rgba(124,58,237,0.9)" stroke-width="1.6"/>
              <circle cx="208" cy="95" r="3" fill="rgba(180,83,9,0.95)"/>
              <text x="204" y="88" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">K</text>
              <text x="201" y="109" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">(2,0)</text>
              <circle cx="72" cy="95" r="3" fill="rgba(180,83,9,0.95)"/>
              <text x="68" y="88" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">F</text>
              <text x="56" y="109" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">(-2,0)</text>
              <circle cx="106" cy="31" r="3" fill="rgba(219,39,119,0.95)"/>
              <text x="96" y="29" fill="#DB2777" font-size="10" font-family="Heebo, sans-serif">C</text>
              <text x="237" y="107" fill="#475569" font-size="9" font-family="Heebo, sans-serif">√8</text>
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
              <ellipse cx="140" cy="95" rx="96" ry="68" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.85)" stroke-width="1.6"/>
              <line x1="20" y1="95" x2="268" y2="95" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="140" y1="18" x2="140" y2="182" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <text x="260" y="91" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="145" y="24" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
              <polygon points="140,27 208,95 72,95" fill="rgba(124,58,237,0.10)" stroke="rgba(124,58,237,0.9)" stroke-width="1.6"/>
              <line x1="140" y1="27" x2="140" y2="95" stroke="rgba(180,83,9,0.95)" stroke-width="1.4" stroke-dasharray="4,2"/>
              <polyline points="140,85 150,85 150,95" fill="none" stroke="rgba(51,65,85,0.7)" stroke-width="1"/>
              <text x="146" y="64" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">h=2</text>
              <circle cx="140" cy="27" r="3" fill="rgba(219,39,119,0.95)"/>
              <text x="144" y="24" fill="#DB2777" font-size="10" font-family="Heebo, sans-serif">C(0,2)</text>
              <circle cx="208" cy="95" r="3" fill="rgba(180,83,9,0.95)"/>
              <text x="205" y="108" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">K</text>
              <circle cx="72" cy="95" r="3" fill="rgba(180,83,9,0.95)"/>
              <text x="66" y="108" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">F</text>
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
  {
    id: 'b2025s582a-q2',
    year: 2025,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 25,
    context: [
      'נתונה פירמידה $SABCD$ שבסיסה $ABCD$ הוא מקבילית.',
      '$SA$ הוא גובה הפירמידה (המקצוע $SA$ מאונך לבסיס).',
      'הנקודה $M$ היא אמצע האלכסון $BD$.',
      'נסמן: $\\;\\vec{AS} = \\vec{w}$, $\\;\\vec{AD} = \\vec{v}$, $\\;\\vec{AB} = \\vec{u}$.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 210 175',
        svg: `
          <line x1="48" y1="115" x2="118" y2="115" stroke="rgba(51,65,85,0.85)" stroke-width="1.5"/>
          <line x1="118" y1="115" x2="153" y2="139" stroke="rgba(51,65,85,0.85)" stroke-width="1.5"/>
          <line x1="153" y1="139" x2="83" y2="139" stroke="rgba(100,116,139,0.6)" stroke-width="1.2" stroke-dasharray="4,3"/>
          <line x1="83" y1="139" x2="48" y2="115" stroke="rgba(100,116,139,0.6)" stroke-width="1.2" stroke-dasharray="4,3"/>
          <line x1="48" y1="31" x2="118" y2="115" stroke="rgba(51,65,85,0.85)" stroke-width="1.4"/>
          <line x1="48" y1="31" x2="153" y2="139" stroke="rgba(51,65,85,0.85)" stroke-width="1.4"/>
          <line x1="48" y1="31" x2="83" y2="139" stroke="rgba(51,65,85,0.85)" stroke-width="1.4"/>
          <line x1="48" y1="31" x2="48" y2="115" stroke="rgba(180,83,9,0.95)" stroke-width="1.8"/>
          <line x1="48" y1="115" x2="153" y2="139" stroke="rgba(2,132,199,0.5)" stroke-width="1" stroke-dasharray="3,2"/>
          <line x1="118" y1="115" x2="83" y2="139" stroke="rgba(2,132,199,0.5)" stroke-width="1" stroke-dasharray="3,2"/>
          <polyline points="48,104 59,104 59,115" fill="none" stroke="rgba(51,65,85,0.7)" stroke-width="1"/>
          <circle cx="100.5" cy="127" r="2.6" fill="rgba(219,39,119,0.95)"/>
          <text x="103" y="131" fill="#DB2777" font-size="10" font-family="Heebo, sans-serif">M</text>
          <circle cx="48" cy="31" r="3" fill="rgba(180,83,9,0.95)"/>
          <text x="40" y="27" fill="#B45309" font-size="11" font-family="Heebo, sans-serif">S</text>
          <circle cx="48" cy="115" r="3" fill="rgba(51,65,85,0.95)"/>
          <text x="35" y="119" fill="#334155" font-size="11" font-family="Heebo, sans-serif">A</text>
          <circle cx="118" cy="115" r="3" fill="rgba(51,65,85,0.95)"/>
          <text x="122" y="113" fill="#334155" font-size="11" font-family="Heebo, sans-serif">B</text>
          <circle cx="153" cy="139" r="3" fill="rgba(51,65,85,0.95)"/>
          <text x="157" y="143" fill="#334155" font-size="11" font-family="Heebo, sans-serif">C</text>
          <circle cx="83" cy="139" r="3" fill="rgba(51,65,85,0.95)"/>
          <text x="73" y="151" fill="#334155" font-size="11" font-family="Heebo, sans-serif">D</text>
          <text x="80" y="110" fill="#2563EB" font-size="11" font-family="Heebo, sans-serif">u</text>
          <text x="57" y="135" fill="#7C3AED" font-size="11" font-family="Heebo, sans-serif">v</text>
          <text x="34" y="78" fill="#B45309" font-size="11" font-family="Heebo, sans-serif">w</text>
        `,
        caption:
          'הפירמידה $SABCD$: הבסיס $ABCD$ הוא מקבילית, והקודקוד $S$ נמצא מעל $A$ (המקצוע $SA$ הוא גובה הפירמידה, מאונך לבסיס). הסימונים: $\\vec{u} = \\vec{AB}$, $\\vec{v} = \\vec{AD}$, $\\vec{w} = \\vec{AS}$, והנקודה $M$ היא מפגש האלכסונים (אמצע $BD$ ואמצע $AC$).',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הביעו באמצעות $\\vec{u}$, $\\vec{v}$ ו-$\\vec{w}$ את הווקטור $\\vec{SM}$.',
        answer_type: 'expression',
        hints: [
          'פרקו את המסלול: $\\;\\vec{SM} = \\vec{SA} + \\vec{AM}$.',
          'במקבילית $M$ הוא גם אמצע $AC$, ולכן $\\;\\vec{AM} = \\tfrac{1}{2}\\vec{AC} = \\tfrac{1}{2}(\\vec{u} + \\vec{v})$.',
          'זכרו ש-$\\vec{SA} = -\\vec{AS} = -\\vec{w}$.',
        ],
        solution: {
          steps: [
            'מפרקים את $\\vec{SM}$ דרך הנקודה $A$: $\\;\\vec{SM} = \\vec{SA} + \\vec{AM}$.',
            '$\\vec{SA}$ הוא הנגדי של $\\vec{AS} = \\vec{w}$, ולכן $\\;\\vec{SA} = -\\vec{w}$.',
            'במקבילית האלכסונים חוצים זה את זה, ולכן $M$ (אמצע $BD$) הוא גם אמצע $AC$. מכאן $\\;\\vec{AM} = \\tfrac{1}{2}\\vec{AC}$.',
            'מבטאים את האלכסון: $\\;\\vec{AC} = \\vec{AB} + \\vec{BC}$. במקבילית $\\vec{BC} = \\vec{AD} = \\vec{v}$, ולכן $\\;\\vec{AC} = \\vec{u} + \\vec{v}$.',
            'מציבים: $\\;\\vec{AM} = \\tfrac{1}{2}(\\vec{u} + \\vec{v})$.',
            'מחברים: $\\;\\vec{SM} = \\vec{SA} + \\vec{AM} = -\\vec{w} + \\tfrac{1}{2}(\\vec{u} + \\vec{v})$.',
            'מסדרים: $\\;\\vec{SM} = \\tfrac{1}{2}\\vec{u} + \\tfrac{1}{2}\\vec{v} - \\vec{w}$.',
          ],
          final_answer: '$\\vec{SM} = \\tfrac{1}{2}\\vec{u} + \\tfrac{1}{2}\\vec{v} - \\vec{w}$',
        },
      },
      {
        label: 'ב',
        prompt: [
          'נתון כי $\\vec{SM}$ מאונך ל-$\\vec{DB}$.',
          '',
          'הוכיחו כי $|\\vec{u}| = |\\vec{v}|$.',
        ].join('\n'),
        answer_type: 'proof',
        hints: [
          'אם $\\vec{SM} \\perp \\vec{DB}$ אז המכפלה הסקלרית מתאפסת: $\\;\\vec{SM} \\cdot \\vec{DB} = 0$.',
          'הציבו את $\\vec{SM}$ מסעיף א ואת $\\vec{DB} = \\vec{u} - \\vec{v}$, ופתחו את המכפלה.',
          '$SA$ גובה ⟹ $\\vec{w} \\cdot \\vec{u} = \\vec{w} \\cdot \\vec{v} = 0$ — זה מאפס את כל האיברים שבהם מופיע $\\vec{w}$.',
        ],
        solution: {
          steps: [
            'נתון ש-$\\vec{SM} \\perp \\vec{DB}$, ולכן המכפלה הסקלרית ביניהם מתאפסת: $\\;\\vec{SM} \\cdot \\vec{DB} = 0$.',
            'מסעיף א: $\\;\\vec{SM} = \\tfrac{1}{2}\\vec{u} + \\tfrac{1}{2}\\vec{v} - \\vec{w}$.',
            'מבטאים את $\\vec{DB}$: $\\;\\vec{DB} = \\vec{DA} + \\vec{AB} = -\\vec{v} + \\vec{u} = \\vec{u} - \\vec{v}$.',
            'מכיוון ש-$SA$ הוא גובה הפירמידה, $\\vec{w} = \\vec{AS}$ מאונך לבסיס, ולכן $\\;\\vec{w} \\cdot \\vec{u} = 0$ וגם $\\vec{w} \\cdot \\vec{v} = 0$.',
            'מציבים: $\\;\\left(\\tfrac{1}{2}\\vec{u} + \\tfrac{1}{2}\\vec{v} - \\vec{w}\\right) \\cdot (\\vec{u} - \\vec{v}) = 0$.',
            'פותחים סוגריים: $\\;\\tfrac{1}{2}\\vec{u}\\cdot\\vec{u} - \\tfrac{1}{2}\\vec{u}\\cdot\\vec{v} + \\tfrac{1}{2}\\vec{v}\\cdot\\vec{u} - \\tfrac{1}{2}\\vec{v}\\cdot\\vec{v} - \\vec{w}\\cdot\\vec{u} + \\vec{w}\\cdot\\vec{v} = 0$.',
            'האיברים $-\\tfrac{1}{2}\\vec{u}\\cdot\\vec{v}$ ו-$+\\tfrac{1}{2}\\vec{v}\\cdot\\vec{u}$ מצטמצמים (כי $\\vec{u}\\cdot\\vec{v} = \\vec{v}\\cdot\\vec{u}$), והאיברים $\\vec{w}\\cdot\\vec{u}$ ו-$\\vec{w}\\cdot\\vec{v}$ מתאפסים.',
            'נשאר: $\\;\\tfrac{1}{2}\\vec{u}\\cdot\\vec{u} - \\tfrac{1}{2}\\vec{v}\\cdot\\vec{v} = 0$, כלומר $\\;\\tfrac{1}{2}|\\vec{u}|^2 = \\tfrac{1}{2}|\\vec{v}|^2$.',
            'מכאן $\\;|\\vec{u}|^2 = |\\vec{v}|^2$, ומכיוון שאורך אינו שלילי: $\\;|\\vec{u}| = |\\vec{v}|$.',
          ],
          final_answer: 'הוכחנו: $\\;|\\vec{u}| = |\\vec{v}|$ (כלומר הבסיס $ABCD$ הוא מעוין).',
        },
      },
      {
        label: 'ג',
        prompt: [
          'נתון: $\\;S(0, 0, 12)$, $\\;B(0, 10, 0)$, $\\;A(0, 0, 0)$, וכן $\\;p > 0$, $\\;D(6, p, 0)$.',
          '',
          'מצאו את שיעורי הנקודות $D$ ו-$C$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'חשבו את $\\vec{u} = \\vec{AB}$ ואת $\\vec{v} = \\vec{AD}$ מהשיעורים הנתונים.',
          'מסעיף ב $|\\vec{u}| = |\\vec{v}|$ — השוו את הגדלים ופתרו עבור $p$ (זכרו $p > 0$).',
          'במקבילית $\\vec{BC} = \\vec{AD}$, ולכן $\\;C = B + \\vec{AD}$.',
        ],
        solution: {
          steps: [
            'מחשבים את הווקטורים מהנקודה $A(0,0,0)$: $\\;\\vec{u} = \\vec{AB} = B - A = (0, 10, 0)$.',
            '$\\;\\vec{v} = \\vec{AD} = D - A = (6, p, 0)$.',
            'מסעיף ב ידוע ש-$|\\vec{u}| = |\\vec{v}|$, ולכן $\\;|(0, 10, 0)| = |(6, p, 0)|$.',
            'מחשבים את הגדלים: $\\;\\sqrt{0^2 + 10^2 + 0^2} = \\sqrt{6^2 + p^2 + 0^2}$, כלומר $\\;\\sqrt{100} = \\sqrt{36 + p^2}$.',
            'מעלים בריבוע: $\\;100 = 36 + p^2$.',
            'מבודדים: $\\;p^2 = 64 \\Rightarrow p = \\pm 8$. מכיוון ש-$p > 0$: $\\;p = 8$, ולכן $\\;D(6, 8, 0)$.',
            'מוצאים את $C$: במקבילית $ABCD$ מתקיים $\\;\\vec{BC} = \\vec{AD} = (6, 8, 0)$.',
            'לכן $\\;C = B + \\vec{BC} = (0, 10, 0) + (6, 8, 0) = (6, 18, 0)$.',
          ],
          final_answer: '$D(6,\\, 8,\\, 0)$ ו-$C(6,\\, 18,\\, 0)$.',
        },
      },
      {
        label: 'ד',
        prompt: [
          'דרך האלכסון $AC$ מעבירים מישור המקביל למקצוע $SD$. המישור חותך את המקצוע $SB$ בנקודה $K$.',
          '',
          'מצאו את משוואת המישור.',
        ].join('\n'),
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 210 175',
            svg: `
              <line x1="48" y1="115" x2="118" y2="115" stroke="rgba(100,116,139,0.4)" stroke-width="1"/>
              <line x1="118" y1="115" x2="153" y2="139" stroke="rgba(100,116,139,0.4)" stroke-width="1"/>
              <line x1="153" y1="139" x2="83" y2="139" stroke="rgba(100,116,139,0.3)" stroke-width="1" stroke-dasharray="4,3"/>
              <line x1="83" y1="139" x2="48" y2="115" stroke="rgba(100,116,139,0.3)" stroke-width="1" stroke-dasharray="4,3"/>
              <line x1="48" y1="31" x2="118" y2="115" stroke="rgba(100,116,139,0.45)" stroke-width="1"/>
              <line x1="48" y1="31" x2="153" y2="139" stroke="rgba(100,116,139,0.4)" stroke-width="1"/>
              <line x1="48" y1="31" x2="48" y2="115" stroke="rgba(100,116,139,0.45)" stroke-width="1"/>
              <polygon points="48,115 153,139 83,73" fill="rgba(124,58,237,0.13)" stroke="rgba(124,58,237,0.9)" stroke-width="1.5"/>
              <line x1="48" y1="31" x2="83" y2="139" stroke="rgba(5,150,105,0.95)" stroke-width="1.9"/>
              <line x1="83" y1="73" x2="100.5" y2="127" stroke="rgba(5,150,105,0.95)" stroke-width="1.9"/>
              <polyline points="67,80 66,86 62,82" fill="none" stroke="rgba(5,150,105,0.95)" stroke-width="1.2"/>
              <polyline points="93,94 92,100 88,96" fill="none" stroke="rgba(5,150,105,0.95)" stroke-width="1.2"/>
              <circle cx="48" cy="31" r="3" fill="rgba(51,65,85,0.95)"/>
              <text x="40" y="27" fill="#334155" font-size="11" font-family="Heebo, sans-serif">S</text>
              <circle cx="48" cy="115" r="3" fill="rgba(51,65,85,0.95)"/>
              <text x="35" y="119" fill="#334155" font-size="11" font-family="Heebo, sans-serif">A</text>
              <circle cx="118" cy="115" r="3" fill="rgba(51,65,85,0.95)"/>
              <text x="122" y="113" fill="#334155" font-size="11" font-family="Heebo, sans-serif">B</text>
              <circle cx="153" cy="139" r="3" fill="rgba(51,65,85,0.95)"/>
              <text x="157" y="143" fill="#334155" font-size="11" font-family="Heebo, sans-serif">C</text>
              <circle cx="83" cy="139" r="3" fill="rgba(51,65,85,0.95)"/>
              <text x="73" y="151" fill="#334155" font-size="11" font-family="Heebo, sans-serif">D</text>
              <circle cx="83" cy="73" r="3.2" fill="rgba(180,83,9,0.95)"/>
              <text x="71" y="71" fill="#B45309" font-size="11" font-family="Heebo, sans-serif">K</text>
              <circle cx="100.5" cy="127" r="3" fill="rgba(219,39,119,0.95)"/>
              <text x="104" y="131" fill="#DB2777" font-size="11" font-family="Heebo, sans-serif">M</text>
              <text x="38" y="92" fill="#059669" font-size="9.5" font-family="Heebo, sans-serif">SD</text>
              <text x="104" y="106" fill="#059669" font-size="9.5" font-family="Heebo, sans-serif">KM</text>
            `,
            caption:
              'המישור $ACK$ עובר דרך האלכסון $AC$ ומקביל למקצוע $SD$, וחותך את $SB$ באמצעו בנקודה $K(0, 5, 6)$. הקטע $KM$ אל מרכז הבסיס $M(3, 9, 0)$ מקביל למקצוע $SD$ (מסומן בחצים).',
          },
        ],
        hints: [
          'הנורמל למישור מאונך לשני וקטורי הכיוון שבמישור: $\\vec{AC}$ ו-$\\vec{SD}$.',
          'צמצמו: $\\vec{AC} \\parallel (1, 3, 0)$ ו-$\\vec{SD} \\parallel (3, 4, -6)$. פתרו $\\vec{n} \\cdot \\vec{AC} = 0$ ו-$\\vec{n} \\cdot \\vec{SD} = 0$.',
          'הציבו את $A(0, 0, 0)$ כדי למצוא את האיבר החופשי.',
        ],
        solution: {
          steps: [
            'המישור מכיל את האלכסון $AC$ ומקביל למקצוע $SD$. הנורמל $\\vec{n}$ של המישור מאונך לשני הכיוונים האלה.',
            'וקטור הכיוון של $AC$: $\\;\\vec{AC} = C - A = (6, 18, 0)$, ובצמצום $\\;(1, 3, 0)$.',
            'וקטור הכיוון של $SD$: $\\;\\vec{SD} = D - S = (6, 8, 0) - (0, 0, 12) = (6, 8, -12)$, ובצמצום $\\;(3, 4, -6)$.',
            'נסמן $\\vec{n} = (a, b, c)$. תנאי $\\vec{n} \\perp \\vec{AC}$: $\\;a + 3b = 0 \\Rightarrow a = -3b$.',
            'תנאי $\\vec{n} \\perp \\vec{SD}$: $\\;3a + 4b - 6c = 0$.',
            'מציבים $a = -3b$: $\\;3(-3b) + 4b - 6c = 0 \\Rightarrow -5b = 6c \\Rightarrow b = -\\tfrac{6}{5}c$.',
            'בוחרים $c = 5$: $\\;b = -6$, $\\;a = -3b = 18$, ולכן $\\;\\vec{n} = (18, -6, 5)$.',
            'משוואת המישור: $\\;18x - 6y + 5z + d = 0$. מציבים את $A(0, 0, 0)$ ומקבלים $\\;d = 0$.',
          ],
          final_answer: 'משוואת המישור: $\\;18x - 6y + 5z = 0$.',
        },
      },
      {
        label: 'ה1',
        prompt: 'קבעו אם הטענה הבאה נכונה או אינה נכונה, ונמקו: הישר $KM$ מקביל לישר $SD$.',
        answer_type: 'proof',
        hints: [
          'מצאו תחילה את $K$ — הציבו הצגה פרמטרית של $SB$ במשוואת המישור מסעיף ד.',
          '$M$ הוא אמצע $AC$ (וגם אמצע $BD$). חשבו את $\\vec{KM}$ והשוו לכיוון $\\vec{SD}$.',
          'אם $\\vec{KM}$ ו-$\\vec{SD}$ הם כפולה זה של זה — הישרים מקבילים.',
        ],
        solution: {
          steps: [
            'נמצא את $K$ — חיתוך המישור עם המקצוע $SB$. הצגה פרמטרית של $SB$ דרך $B$: $\\;\\underline{x} = B + t(B - S) = (0, 10, 0) + t(0, 10, -12) = (0,\\ 10 + 10t,\\ -12t)$.',
            'מציבים במשוואת המישור $18x - 6y + 5z = 0$: $\\;18 \\cdot 0 - 6(10 + 10t) + 5(-12t) = 0$.',
            'מפשטים: $\\;-60 - 60t - 60t = 0 \\Rightarrow -120t = 60 \\Rightarrow t = -\\tfrac{1}{2}$.',
            'מציבים $t = -\\tfrac{1}{2}$: $\\;K = (0,\\ 10 - 5,\\ 6) = (0, 5, 6)$.',
            'הנקודה $M$ היא אמצע $BD$ (וגם אמצע $AC$): $\\;M = \\left(\\tfrac{0 + 6}{2},\\ \\tfrac{0 + 18}{2},\\ 0\\right) = (3, 9, 0)$.',
            'וקטור הכיוון של $KM$: $\\;\\vec{KM} = M - K = (3, 9, 0) - (0, 5, 6) = (3, 4, -6)$.',
            'וקטור הכיוון של $SD$: $\\;\\vec{SD} = (6, 8, -12) = 2 \\cdot (3, 4, -6) = 2\\,\\vec{KM}$.',
            'הווקטורים $\\vec{KM}$ ו-$\\vec{SD}$ מקבילים (כפולה זה של זה), ו-$K$ אינה מונחת על $SD$, ולכן הישרים מקבילים.',
          ],
          final_answer: 'הטענה נכונה — $\\;\\vec{KM} = \\tfrac{1}{2}\\vec{SD}$, ולכן $KM \\parallel SD$.',
        },
      },
      {
        label: 'ה2',
        prompt:
          'קבעו אם הטענה הבאה נכונה או אינה נכונה, ונמקו: כל ישר שמאונך למישור $ACK$ מאונך גם לישר $SD$.',
        answer_type: 'proof',
        hints: [
          'המישור $ACK$ הוא בדיוק המישור מסעיף ד (שלוש הנקודות $A, C, K$ נמצאות עליו).',
          'המישור נבנה מקביל ל-$SD$, ולכן הנורמל שלו מאונך ל-$SD$. בדקו את $\\vec{n} \\cdot \\vec{SD}$.',
          'ישר המאונך למישור מקביל לנורמל — מה זה אומר על הזווית שלו עם $SD$?',
        ],
        solution: {
          steps: [
            'המישור $ACK$ הוא המישור שמצאנו בסעיף ד: הנקודות $A$ ו-$C$ עליו לפי הבנייה, וגם $K(0,5,6)$ עליו, שכן $\\;18 \\cdot 0 - 6 \\cdot 5 + 5 \\cdot 6 = -30 + 30 = 0$.',
            'מישור זה נבנה כך שהוא מקביל ל-$SD$, ולכן הנורמל שלו $\\vec{n} = (18, -6, 5)$ מאונך ל-$SD$.',
            'בדיקה: $\\;\\vec{n} \\cdot \\vec{SD} = (18)(6) + (-6)(8) + (5)(-12) = 108 - 48 - 60 = 0$ — אכן מאונכים.',
            'כל ישר המאונך למישור $ACK$ מקביל לנורמל $\\vec{n}$.',
            'מכיוון ש-$\\vec{n} \\perp \\vec{SD}$, גם כל ישר המקביל ל-$\\vec{n}$ מאונך ל-$SD$.',
          ],
          final_answer: 'הטענה נכונה — הנורמל למישור $ACK$ מאונך ל-$SD$, ולכן כל ישר המאונך למישור (ומקביל לנורמל) מאונך ל-$SD$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2025s582a-q3',
    year: 2025,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 25,
    context: 'הנקודה $z = x + iy$ היא מספר מרוכב משתנה במישור גאוס.',
    parts: [
      {
        label: 'א',
        prompt:
          'הביעו באמצעות $x$ ו-$y$ את משוואת המקום הגאומטרי של כל הנקודות $z = x + iy$ במישור גאוס המקיימות $|z| = |z - (2 + 2i)|$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 240 210',
            svg: `
              <line x1="20" y1="130" x2="222" y2="130" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="95" y1="18" x2="95" y2="200" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <text x="214" y="126" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="83" y="24" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
              <line x1="95" y1="130" x2="147" y2="78" stroke="rgba(100,116,139,0.7)" stroke-width="1" stroke-dasharray="4,3"/>
              <circle cx="147" cy="78" r="2.6" fill="rgba(100,116,139,0.9)"/>
              <text x="151" y="76" fill="#475569" font-size="9.5" font-family="Heebo, sans-serif">2+2i</text>
              <line x1="64" y1="47" x2="199" y2="182" stroke="rgba(5,150,105,0.9)" stroke-width="1.6"/>
              <text x="58" y="44" fill="#059669" font-size="10" font-family="Heebo, sans-serif">x+y-2=0</text>
              <circle cx="95" cy="78" r="3.2" fill="rgba(219,39,119,0.95)"/>
              <text x="69" y="76" fill="#DB2777" font-size="10" font-family="Heebo, sans-serif">A(0,2)</text>
              <circle cx="147" cy="130" r="3.2" fill="rgba(37,99,235,0.95)"/>
              <text x="150" y="143" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">B(2,0)</text>
              <circle cx="95" cy="130" r="2.2" fill="rgba(51,65,85,0.85)"/>
              <text x="83" y="143" fill="#475569" font-size="9" font-family="Heebo, sans-serif">O</text>
            `,
            caption:
              'המקום הגאומטרי של $|z| = |z - (2 + 2i)|$ הוא חוצה האנך של הקטע שבין הראשית $O$ לנקודה $2 + 2i$, כלומר הישר $x + y - 2 = 0$. פתרונות המשוואה מסעיף ב, $A(0, 2)$ ו-$B(2, 0)$, נמצאים עליו.',
          },
        ],
        hints: [
          'הציבו $z = x + iy$: $\\;|z|$ הוא המרחק מהראשית, ו-$|z - (2 + 2i)|$ הוא המרחק מהנקודה $(2, 2)$.',
          'כתבו $\\;|x + iy| = |(x - 2) + (y - 2)i|$ והשתמשו ב-$|a + bi| = \\sqrt{a^2 + b^2}$.',
          'העלו את שני האגפים בריבוע — האיברים $x^2$ ו-$y^2$ יצטמצמו.',
        ],
        solution: {
          steps: [
            'מציבים $z = x + iy$. אגף שמאל: $\\;|z| = |x + iy| = \\sqrt{x^2 + y^2}$.',
            'אגף ימין: $\\;z - (2 + 2i) = (x - 2) + (y - 2)i$, ולכן $\\;|z - (2 + 2i)| = \\sqrt{(x - 2)^2 + (y - 2)^2}$.',
            'מהתנאי $|z| = |z - (2 + 2i)|$: $\\;\\sqrt{x^2 + y^2} = \\sqrt{(x - 2)^2 + (y - 2)^2}$.',
            'מעלים בריבוע: $\\;x^2 + y^2 = (x - 2)^2 + (y - 2)^2$.',
            'מפתחים את אגף ימין: $\\;x^2 + y^2 = x^2 - 4x + 4 + y^2 - 4y + 4$.',
            'מצמצמים $x^2$ ו-$y^2$: $\\;0 = -4x - 4y + 8$.',
            'מחלקים ב-$-4$: $\\;x + y - 2 = 0$.',
          ],
          final_answer: 'המקום הגאומטרי הוא הישר $\\;x + y - 2 = 0$.',
        },
      },
      {
        label: 'ב',
        prompt: [
          'נתונה המשוואה $\\;z^2 - z(2 + 2i) + 4i = 0$.',
          'הנקודות $A$ ו-$B$ מייצגות את שני פתרונות המשוואה.',
          '',
          'הראו כי הנקודות $A$ ו-$B$ נמצאות על המקום הגאומטרי שמצאתם בסעיף א.',
        ].join('\n'),
        answer_type: 'proof',
        hints: [
          'פתרו את המשוואה הריבועית בנוסחת השורשים, עם $\\Delta = b^2 - 4ac$ (גם המקדמים מרוכבים).',
          'חלצו את $\\sqrt{\\Delta}$ על-ידי הצבה $\\sqrt{\\Delta} = x + yi$ והשוואת חלקים ממשי/מדומה.',
          'הציבו כל פתרון במשוואת המקום $x + y - 2 = 0$ ובדקו שהוא מתקיים.',
        ],
        solution: {
          steps: [
            'פותרים את המשוואה $z^2 - z(2 + 2i) + 4i = 0$ עם $a = 1$, $b = -(2 + 2i)$, $c = 4i$.',
            'הדיסקרימיננטה: $\\;\\Delta = b^2 - 4ac = [-(2 + 2i)]^2 - 4 \\cdot 1 \\cdot 4i = (2 + 2i)^2 - 16i$.',
            'מחשבים $(2 + 2i)^2 = 4 + 8i + 4i^2 = 4 + 8i - 4 = 8i$.',
            'לכן $\\;\\Delta = 8i - 16i = -8i$.',
            'מחלצים שורש: מחפשים $x + yi$ כך ש-$(x + yi)^2 = -8i$, כלומר $\\;x^2 - y^2 + 2xyi = -8i$.',
            'משווים חלקים: $\\;x^2 - y^2 = 0$ וגם $2xy = -8$.',
            'מ-$x^2 = y^2$ ומ-$xy = -4$: מציבים $y = -\\dfrac{4}{x}$ ב-$x^2 = y^2$: $\\;x^2 = \\dfrac{16}{x^2} \\Rightarrow x^4 = 16 \\Rightarrow x^2 = 4$.',
            'מקבלים $x = \\pm 2$, ובהתאם $y = \\mp 2$, ולכן $\\;\\sqrt{\\Delta} = \\pm(2 - 2i)$.',
            'מציבים בנוסחת השורשים: $\\;z_{1,2} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a} = \\dfrac{(2 + 2i) \\pm (2 - 2i)}{2}$.',
            '$z_1 = \\dfrac{(2 + 2i) + (2 - 2i)}{2} = \\dfrac{4}{2} = 2$, ולכן זו הנקודה $B(2, 0)$.',
            '$z_2 = \\dfrac{(2 + 2i) - (2 - 2i)}{2} = \\dfrac{4i}{2} = 2i$, ולכן זו הנקודה $A(0, 2)$.',
            'בודקים על המקום $x + y - 2 = 0$: עבור $B(2, 0)$ מתקבל $\\;2 + 0 - 2 = 0$ — מתקיים.',
            'עבור $A(0, 2)$ מתקבל $\\;0 + 2 - 2 = 0$ — מתקיים. לכן שתי הנקודות על המקום הגאומטרי מסעיף א.',
          ],
          final_answer:
            'הפתרונות הם $z_1 = 2$ (הנקודה $B(2, 0)$) ו-$z_2 = 2i$ (הנקודה $A(0, 2)$); שתיהן מקיימות $x + y - 2 = 0$, ולכן הן על המקום הגאומטרי מסעיף א.',
        },
      },
      {
        label: 'ג1',
        prompt: [
          'הנקודות $C$ ו-$D$ נמצאות על הצירים כך ש-$ABCD$ הוא ריבוע.',
          'מסובבים את הריבוע $ABCD$ סביב ראשית הצירים נגד כיוון השעון בזווית $\\alpha$ (כאשר $0° < \\alpha < 90°$).',
          'כל שמונה הנקודות (הקודקודים $A, B, C, D$ וארבע הנקודות שהתקבלו אחרי הסיבוב) מיוצגות על ידי פתרונות המשוואה $z^n = b$, כאשר $n$ מספר טבעי ו-$b$ מספר ממשי.',
          '',
          'מצאו את הערך של $b$ ואת הערך של $\\alpha$ בעבור $n = 8$.',
        ].join('\n'),
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 240 240',
            svg: `
              <line x1="20" y1="120" x2="222" y2="120" stroke="rgba(51,65,85,0.4)" stroke-width="1"/>
              <line x1="120" y1="20" x2="120" y2="222" stroke="rgba(51,65,85,0.4)" stroke-width="1"/>
              <text x="214" y="116" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="124" y="26" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
              <circle cx="120" cy="120" r="68" fill="none" stroke="rgba(51,65,85,0.3)" stroke-width="1" stroke-dasharray="3,3"/>
              <polygon points="188,120 120,52 52,120 120,188" fill="rgba(37,99,235,0.06)" stroke="rgba(37,99,235,0.9)" stroke-width="1.5"/>
              <polygon points="168,72 72,72 72,168 168,168" fill="rgba(180,83,9,0.06)" stroke="rgba(180,83,9,0.9)" stroke-width="1.5"/>
              <line x1="120" y1="120" x2="168" y2="72" stroke="rgba(109,40,217,0.8)" stroke-width="1" stroke-dasharray="3,2"/>
              <path d="M150,120 A30,30 0 0,0 141.2,98.8" fill="none" stroke="rgba(109,40,217,0.95)" stroke-width="1.2"/>
              <text x="150" y="110" fill="#7C3AED" font-size="9" font-family="Heebo, sans-serif">α=45°</text>
              <circle cx="188" cy="120" r="3" fill="#2563EB"/>
              <text x="191" y="116" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">B</text>
              <circle cx="120" cy="52" r="3" fill="#2563EB"/>
              <text x="123" y="49" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">A</text>
              <circle cx="52" cy="120" r="3" fill="#2563EB"/>
              <text x="42" y="116" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">D</text>
              <circle cx="120" cy="188" r="3" fill="#2563EB"/>
              <text x="123" y="201" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">C</text>
              <circle cx="168" cy="72" r="3" fill="#B45309"/>
              <text x="172" y="69" fill="#B45309" font-size="9" font-family="Heebo, sans-serif">B'</text>
              <circle cx="72" cy="72" r="3" fill="#B45309"/>
              <text x="60" y="69" fill="#B45309" font-size="9" font-family="Heebo, sans-serif">A'</text>
              <circle cx="72" cy="168" r="3" fill="#B45309"/>
              <text x="58" y="180" fill="#B45309" font-size="9" font-family="Heebo, sans-serif">D'</text>
              <circle cx="168" cy="168" r="3" fill="#B45309"/>
              <text x="172" y="180" fill="#B45309" font-size="9" font-family="Heebo, sans-serif">C'</text>
            `,
            caption:
              'הריבוע המקורי $ABCD$ (קודקודים על הצירים, בזוויות $0°, 90°, 180°, 270°$) והריבוע שהתקבל מסיבוב ב-$\\alpha = 45°$ (מקווקו) יוצרים יחד $8$ נקודות שוות-מרווח ($45°$) על מעגל $|z| = 2$ — קודקודי מתומן משוכלל, שהם פתרונות $z^8 = 256$.',
          },
        ],
        hints: [
          'כל הקודקודים על מעגל $|z| = 2$. הריבוע = $4$ נקודות במרווחי $90°$.',
          'פתרונות $z^n = b$ הם $n$ נקודות שוות-מרווח. עבור $n = 8$ המרווח הוא $\\frac{360°}{8} = 45°$ — איזו זווית סיבוב יוצרת מרווחים שווים?',
          'הרדיוס נותן את $|b| = 2^n$; הנקודה $z = 2$ (זווית $0°$) קובעת ש-$b$ ממשי חיובי.',
        ],
        solution: {
          steps: [
            'מסעיף ב: $A(0, 2)$ ו-$B(2, 0)$, ושתיהן במרחק $2$ מהראשית (על מעגל $|z| = 2$).',
            'הנקודות $C$ ו-$D$ על הצירים ומשלימות את הריבוע $ABCD$; מסימטריית הריבוע סביב הראשית: $C(0, -2)$ ו-$D(-2, 0)$.',
            'ארבעת הקודקודים נמצאים על מעגל $|z| = 2$ בזוויות $0°, 90°, 180°, 270°$ — כלומר במרווחים שווים של $90°$.',
            'הסיבוב בזווית $\\alpha$ מוסיף ארבע נקודות באותו מרחק מהראשית, בזוויות $\\alpha,\\ 90° + \\alpha,\\ 180° + \\alpha,\\ 270° + \\alpha$.',
            'פתרונות המשוואה $z^n = b$ (עם $b$ ממשי) הם $n$ נקודות הפרושות במרווחים שווים של $\\frac{360°}{n}$ על מעגל אחד.',
            'עבור $n = 8$ המרווח הוא $\\;\\frac{360°}{8} = 45°$, ולכן שמונה הנקודות חייבות להיות שוות-מרווח של $45°$.',
            'הקבוצה המקורית במרווחי $90°$; כדי שיחד עם המסובבת יתקבלו מרווחים שווים של $45°$, הסיבוב חייב למקם כל נקודה חדשה בדיוק באמצע — כלומר $\\;\\alpha = 45°$.',
            'הרדיוס של כל הנקודות הוא $2$, ולכן $\\;|b| = |z|^8 = 2^8 = 256$.',
            'הנקודה $B$ מייצגת את $z = 2$ (ממשי חיובי, זווית $0°$) והיא פתרון, ולכן $\\;b = 2^8 = 256$ (ממשי חיובי).',
          ],
          final_answer: '$\\alpha = 45°$ ו-$b = 256$.',
        },
      },
      {
        label: 'ג2',
        prompt:
          'מצאו ערך אפשרי של $n$ בעבור $\\alpha = 15°$, ומצאו את הערך של $b$ המתאים לו.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 240 240',
            svg: `
              <line x1="20" y1="120" x2="222" y2="120" stroke="rgba(51,65,85,0.4)" stroke-width="1"/>
              <line x1="120" y1="20" x2="120" y2="222" stroke="rgba(51,65,85,0.4)" stroke-width="1"/>
              <text x="214" y="116" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="124" y="26" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
              <circle cx="120" cy="120" r="68" fill="none" stroke="rgba(51,65,85,0.3)" stroke-width="1" stroke-dasharray="3,3"/>
              <circle cx="178.9" cy="86" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="168.1" cy="71.9" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="154" cy="61.1" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="137.6" cy="54.3" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="86" cy="61.1" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="71.9" cy="71.9" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="61.1" cy="86" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="54.3" cy="102.4" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="61.1" cy="154" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="71.9" cy="168.1" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="86" cy="178.9" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="102.4" cy="185.7" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="154" cy="178.9" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="168.1" cy="168.1" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="178.9" cy="154" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <circle cx="185.7" cy="137.6" r="1.4" fill="rgba(100,116,139,0.45)"/>
              <polygon points="188,120 120,52 52,120 120,188" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.9)" stroke-width="1.4"/>
              <polygon points="185.7,102.4 102.4,54.3 54.3,137.6 137.6,185.7" fill="rgba(180,83,9,0.05)" stroke="rgba(180,83,9,0.9)" stroke-width="1.4"/>
              <line x1="120" y1="120" x2="185.7" y2="102.4" stroke="rgba(109,40,217,0.8)" stroke-width="1" stroke-dasharray="3,2"/>
              <path d="M150,120 A30,30 0 0,0 149,112.2" fill="none" stroke="rgba(109,40,217,0.95)" stroke-width="1.2"/>
              <text x="153" y="113" fill="#7C3AED" font-size="9" font-family="Heebo, sans-serif">α=15°</text>
              <circle cx="188" cy="120" r="3" fill="#2563EB"/>
              <text x="191" y="116" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">B</text>
              <circle cx="120" cy="52" r="3" fill="#2563EB"/>
              <text x="123" y="49" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">A</text>
              <circle cx="52" cy="120" r="3" fill="#2563EB"/>
              <text x="42" y="116" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">D</text>
              <circle cx="120" cy="188" r="3" fill="#2563EB"/>
              <text x="123" y="201" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">C</text>
              <circle cx="185.7" cy="102.4" r="3" fill="#B45309"/>
              <text x="189" y="99" fill="#B45309" font-size="9" font-family="Heebo, sans-serif">B'</text>
              <circle cx="102.4" cy="54.3" r="3" fill="#B45309"/>
              <circle cx="54.3" cy="137.6" r="3" fill="#B45309"/>
              <circle cx="137.6" cy="185.7" r="3" fill="#B45309"/>
            `,
            caption:
              'עבור $\\alpha = 15°$ שמונה הנקודות (בזוויות $0°, 15°, 90°, 105°, 180°, 195°, 270°, 285°$) אינן שוות-מרווח, אך כולן כפולות של $15°$ — ולכן הן חלק ממצולע משוכלל בן $24$ קודקודים (הנקודות העמומות) על מעגל $|z| = 2$, שהם פתרונות $z^{24} = 2^{24}$.',
          },
        ],
        hints: [
          'עבור $\\alpha = 15°$ הזוויות הן $0°, 15°, 90°, 105°, 180°, 195°, 270°, 285°$ — לא שוות-מרווח.',
          'הן חייבות להיות חלק ממצולע משוכלל גדול יותר; $\\frac{360°}{n}$ חייב לחלק את כל ההפרשים בין הזוויות (בפרט את $15°$).',
          'מצאו את $n$ המינימלי, ואז $b = 2^n$.',
        ],
        solution: {
          steps: [
            'עבור $\\alpha = 15°$ שמונה הנקודות נמצאות בזוויות $0°, 90°, 180°, 270°$ (המקוריות) ו-$15°, 105°, 195°, 285°$ (המסובבות).',
            'הזוויות אינן במרווחים שווים (המרווחים מתחלפים בין $15°$ ל-$75°$), ולכן הן אינן יכולות להיות כל פתרונות $z^n = b$ עבור $n = 8$ — הן חייבות להיות חלק מקבוצה גדולה יותר של נקודות שוות-מרווח.',
            'פתרונות $z^n = b$ פרושים במרווחי $\\frac{360°}{n}$. כדי שכל שמונה הזוויות יהיו ביניהן, $\\frac{360°}{n}$ חייב לחלק את כל הזוויות.',
            'כל הזוויות הן כפולות של $15°$ (וההפרש $15°$ אכן מופיע, בין $0°$ ל-$15°$), ולכן המרווח הגדול ביותר האפשרי הוא $\\;\\frac{360°}{n} = 15°$.',
            'מכאן הערך המינימלי: $\\;n = \\frac{360°}{15°} = 24$.',
            'בדיקה: פתרונות $z^{24} = b$ נמצאים בזוויות $0°, 15°, 30°, \\ldots, 345°$, וכל שמונה הנקודות (בזוויות $0, 15, 90, 105, 180, 195, 270, 285$) אכן ביניהן.',
            'הרדיוס הוא $2$, והנקודה $z = 2$ (זווית $0°$) פתרון, ולכן $\\;b = 2^{24}$ (ממשי חיובי).',
          ],
          final_answer: '$n = 24$ (הערך המינימלי) ו-$b = 2^{24}$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2025s582a-q4',
    year: 2025,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 4,
    topic: 'פונקציה מעריכית',
    totalPoints: 25,
    context:
      'נתונה הפונקציה $\\;f(x) = \\dfrac{e^x}{a - e^x}\\;$, כאשר $a$ הוא פרמטר שונה מ-$0$.\n\nבסעיף א ענו על תת-הסעיפים (1)–(3) עבור $a > 0$ ועבור $a < 0$, והביעו את תשובותיכם באמצעות $a$ אם יש צורך.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצאו את תחום ההגדרה של הפונקציה $f(x)$ (עבור $a > 0$ ועבור $a < 0$).',
        answer_type: 'expression',
        hints: [
          'התנאי היחיד הוא שהמכנה אינו מתאפס: $a - e^x \\ne 0$.',
          'בדקו מתי למשוואה $e^x = a$ יש פתרון — וזכרו ש-$e^x > 0$ תמיד.',
        ],
        solution: {
          steps: [
            'התנאי היחיד הוא שהמכנה אינו מתאפס: $\\;a - e^x \\ne 0$, כלומר $\\;e^x \\ne a$.',
            'מקרה $a > 0$: למשוואה $e^x = a$ יש פתרון $\\;x = \\ln a$, ולכן יש לפסול אותו.',
            'תחום ההגדרה כאשר $a > 0$: כל $x \\ne \\ln a$.',
            'מקרה $a < 0$: מכיוון ש-$e^x > 0$ לכל $x$, המשוואה $e^x = a$ (עם $a < 0$) חסרת פתרון — אין מה לפסול.',
            'תחום ההגדרה כאשר $a < 0$: כל $x$ ממשי.',
          ],
          final_answer: 'עבור $a > 0$: כל $x \\ne \\ln a$. עבור $a < 0$: כל $x$ ממשי.',
        },
      },
      {
        label: 'א2',
        prompt: 'מצאו את משוואות האסימפטוטות האופקיות (המאונכות לציר ה-$y$) של הפונקציה $f(x)$.',
        answer_type: 'expression',
        hints: [
          'ב-$+\\infty$ חלקו מונה ומכנה ב-$e^x$ ונצלו ש-$\\frac{a}{e^x} \\to 0$.',
          'ב-$-\\infty$ זכרו ש-$e^x \\to 0$.',
        ],
        solution: {
          steps: [
            'נחשב את הגבול ב-$+\\infty$. נחלק מונה ומכנה ב-$e^x$:',
            '$\\dfrac{e^x}{a - e^x} = \\dfrac{1}{\\frac{a}{e^x} - 1}$',
            'כאשר $x \\to \\infty$ מתקיים $\\dfrac{a}{e^x} \\to 0$, ולכן $\\;\\lim\\limits_{x \\to \\infty} f(x) = \\dfrac{1}{0 - 1} = -1$.',
            'נחשב את הגבול ב-$-\\infty$. כאן $e^x \\to 0$:',
            '$\\lim\\limits_{x \\to -\\infty} f(x) = \\dfrac{0}{a - 0} = 0$.',
            'שני הגבולות אינם תלויים בערך $a$, ולכן הם תקפים גם עבור $a > 0$ וגם עבור $a < 0$.',
          ],
          final_answer: '$y = -1$ (כאשר $x \\to \\infty$) ו-$y = 0$ (כאשר $x \\to -\\infty$) — בשני המקרים.',
        },
      },
      {
        label: 'א3',
        prompt: 'מצאו את תחומי העלייה והירידה של הפונקציה $f(x)$ (אם יש כאלה), עבור $a > 0$ ועבור $a < 0$.',
        answer_type: 'text',
        hints: [
          'גזרו לפי כלל המנה — אחרי פישוט מתקבל מונה פשוט מאוד.',
          'הנגזרת יוצאת $f\'(x) = \\dfrac{a e^x}{(a - e^x)^2}$. מה קובע את סימנה?',
          'המכנה בריבוע ו-$e^x$ תמיד חיוביים — לכן הסימן הוא סימן $a$.',
        ],
        solution: {
          steps: [
            'נגזור לפי כלל המנה את $f = \\dfrac{e^x}{a - e^x}$.',
            '$f\'(x) = \\dfrac{e^x (a - e^x) - e^x \\cdot (-e^x)}{(a - e^x)^2}$',
            'נפתח את המונה: $\\;e^x(a - e^x) + e^x \\cdot e^x = e^x(a - e^x + e^x) = a e^x$.',
            'לכן $\\;f\'(x) = \\dfrac{a e^x}{(a - e^x)^2}$.',
            'המכנה $(a - e^x)^2 > 0$ ו-$e^x > 0$ תמיד, ולכן סימן הנגזרת זהה לסימן של $a$.',
            'מקרה $a > 0$: $\\;f\'(x) > 0$ — הפונקציה עולה בכל תחום הגדרתה ($x < \\ln a$ וגם $x > \\ln a$), ואין תחומי ירידה.',
            'מקרה $a < 0$: $\\;f\'(x) < 0$ — הפונקציה יורדת בכל הממשיים, ואין תחומי עלייה.',
          ],
          final_answer: 'עבור $a > 0$: עולה ב-$x < \\ln a$ וב-$x > \\ln a$, אין ירידה. עבור $a < 0$: יורדת לכל $x$, אין עלייה.',
        },
      },
      {
        label: 'ב',
        prompt: 'קבעו איזה מן הגרפים I–IV (המצורפים) מתאר את הפונקציה $f(x)$ עבור $a = 5$, ואיזה מתאר את $f(x)$ עבור $a = -5$. נמקו את קביעתכם.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 400 410',
            svg: `
              <line x1="200" y1="12" x2="200" y2="400" stroke="rgba(100,116,139,0.25)" stroke-width="1"/>
              <line x1="12" y1="200" x2="392" y2="200" stroke="rgba(100,116,139,0.25)" stroke-width="1"/>
              <!-- II (top-left) -->
              <line x1="25" y1="110" x2="190" y2="110" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="60" y1="25" x2="60" y2="185" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="120" y1="25" x2="120" y2="185" stroke="rgba(37,99,235,0.6)" stroke-width="1" stroke-dasharray="4,3"/>
              <line x1="124" y1="131" x2="190" y2="131" stroke="rgba(100,116,139,0.4)" stroke-width="0.8" stroke-dasharray="3,3"/>
              <polyline points="25,108 50,104 78,94 100,70 116,30" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="1.8"/>
              <polyline points="124,180 138,152 158,138 190,131" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="1.8"/>
              <text x="105" y="195" fill="#334155" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">II</text>
              <!-- I (top-right) -->
              <line x1="210" y1="110" x2="385" y2="110" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="255" y1="25" x2="255" y2="185" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="305" y1="25" x2="305" y2="185" stroke="rgba(37,99,235,0.6)" stroke-width="1" stroke-dasharray="4,3"/>
              <polyline points="210,112 240,118 268,132 292,158 300,182" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="1.8"/>
              <polyline points="312,30 328,58 352,80 385,88" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="1.8"/>
              <text x="300" y="195" fill="#334155" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">I</text>
              <!-- IV (bottom-left) -->
              <line x1="25" y1="305" x2="190" y2="305" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="60" y1="215" x2="60" y2="390" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="120" y1="215" x2="120" y2="390" stroke="rgba(37,99,235,0.6)" stroke-width="1" stroke-dasharray="4,3"/>
              <polyline points="25,300 52,293 80,280 102,248 116,218" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="1.8"/>
              <polyline points="124,388 140,352 162,325 190,308" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="1.8"/>
              <text x="105" y="402" fill="#334155" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">IV</text>
              <!-- III (bottom-right) -->
              <line x1="210" y1="305" x2="385" y2="305" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="255" y1="215" x2="255" y2="390" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="210" y1="338" x2="385" y2="338" stroke="rgba(100,116,139,0.4)" stroke-width="0.8" stroke-dasharray="3,3"/>
              <polyline points="210,300 238,303 262,310 288,322 315,332 385,338" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="1.8"/>
              <text x="300" y="402" fill="#334155" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">III</text>
            `,
            caption:
              'ארבעת הגרפים I–IV להתאמה. גרף II: אסימפטוטה אנכית מימין לראשית, ענף שמאלי עולה מ-$0$ אל $+\\infty$ וענף ימני עולה מ-$-\\infty$ אל $y=-1$ (מתאים ל-$a=5$). גרף III: ללא אסימפטוטה אנכית, יורד בכל הממשיים מ-$0$ אל $-1$ (מתאים ל-$a=-5$). גרפים I ו-IV הם ההיסחים.',
          },
        ],
        hints: [
          'עבור $a = 5 > 0$ יש אסימפטוטה אנכית ב-$x = \\ln 5$ והפונקציה עולה — חפשו גרף כזה.',
          'עבור $a = -5 < 0$ אין אסימפטוטה אנכית והפונקציה יורדת — חפשו גרף חלק ויורד.',
        ],
        solution: {
          steps: [
            'מקרה $a = 5 > 0$: יש אסימפטוטה אנכית ב-$x = \\ln 5$ (כי $a > 0$), והפונקציה עולה (מסעיף א3).',
            'סימן: עבור $x < \\ln 5$ מתקיים $5 - e^x > 0$ ולכן $f > 0$; עבור $x > \\ln 5$ מתקיים $f < 0$.',
            'לכן הענף השמאלי עולה מ-$0$ (ב-$-\\infty$) אל $+\\infty$, והענף הימני עולה מ-$-\\infty$ אל $y = -1$ — זהו גרף II.',
            'מקרה $a = -5 < 0$: אין אסימפטוטה אנכית (כי $e^x \\ne -5$ לעולם), והפונקציה יורדת בכל הממשיים.',
            'הערכים: $a - e^x = -5 - e^x < 0$ תמיד, ולכן $f < 0$ בכל הממשיים — יורדת מ-$0$ (ב-$-\\infty$) אל $-1$ (ב-$+\\infty$) — זהו גרף III.',
          ],
          final_answer: 'עבור $a = 5$ — גרף II; עבור $a = -5$ — גרף III.',
        },
      },
      {
        label: 'ג1',
        prompt: [
          'מציבים מעתה $a = 5$, כלומר $f(x) = \\dfrac{e^x}{5 - e^x}$, ומגדירים $\\;g(x) = \\dfrac{1}{f(x) + 2}$.',
          '',
          'מצאו את תחום ההגדרה של הפונקציה $g(x)$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'שני תנאים: ש-$f(x)$ מוגדרת, ושהמכנה $f(x) + 2$ אינו מתאפס.',
          'פתרו $\\frac{e^x}{5 - e^x} = -2$ כדי למצוא איזה $x$ לפסול.',
        ],
        solution: {
          steps: [
            'נדרשים שני תנאים: ש-$f(x)$ מוגדרת, ושהמכנה $f(x) + 2$ אינו מתאפס.',
            'תנאי $f$: $\\;x \\ne \\ln 5$ (כי $a = 5 > 0$).',
            'תנאי המכנה: $\\;f(x) + 2 \\ne 0$, כלומר אסור ש-$\\dfrac{e^x}{5 - e^x} = -2$.',
            'נפתור מתי כן מתקיים: $\\;e^x = -2(5 - e^x) = -10 + 2e^x$.',
            'מכאן $\\;-e^x = -10$, כלומר $e^x = 10$, ולכן $x = \\ln 10$ — ערך שיש לפסול.',
            'מאחדים: כל $x$ פרט ל-$x = \\ln 5$ ו-$x = \\ln 10$.',
          ],
          final_answer: 'כל $x$ פרט ל-$x = \\ln 5$ ו-$x = \\ln 10$.',
        },
      },
      {
        label: 'ג2',
        prompt: 'מצאו את משוואות האסימפטוטות המאונכות לצירים של הפונקציה $g(x)$.',
        answer_type: 'expression',
        hints: [
          'פשטו תחילה: $g(x) = \\dfrac{1}{f(x)+2} = \\dfrac{5 - e^x}{10 - e^x}$.',
          'לאסימפטוטות האופקיות השתמשו בגבולות של $f$ מסעיף א2 ($f \\to -1$ וב-$f \\to 0$).',
          'לאסימפטוטה האנכית בדקו היכן $10 - e^x = 0$.',
        ],
        solution: {
          steps: [
            'נפשט: $\\;g(x) = \\dfrac{1}{f(x) + 2} = \\dfrac{1}{\\frac{e^x}{5 - e^x} + 2} = \\dfrac{5 - e^x}{10 - e^x}$.',
            'אסימפטוטות אופקיות — נשתמש בגבולות של $f$ מסעיף א2:',
            '$\\lim\\limits_{x \\to \\infty} g(x) = \\dfrac{1}{f + 2} = \\dfrac{1}{-1 + 2} = 1$.',
            '$\\lim\\limits_{x \\to -\\infty} g(x) = \\dfrac{1}{0 + 2} = \\dfrac{1}{2}$.',
            'לכן יש שתי אסימפטוטות אופקיות: $\\;y = 1$ ו-$y = \\dfrac{1}{2}$.',
            'אסימפטוטה אנכית — היכן שהמכנה $10 - e^x$ מתאפס: $\\;x = \\ln 10$, ושם המונה $5 - 10 = -5 \\ne 0$.',
            'אימות: $\\;\\lim\\limits_{x \\to \\ln 10^-} g(x) = -\\infty$ ו-$\\lim\\limits_{x \\to \\ln 10^+} g(x) = +\\infty$.',
            'הערה: ב-$x = \\ln 5$ מתקיים $g \\to 0$ — זו אינה אסימפטוטה אלא נקודה חסרה (חור) בגרף, כי $f \\to \\pm\\infty$ שם.',
          ],
          final_answer: 'אנכית: $x = \\ln 10$; אופקיות: $y = 1$ ו-$y = \\dfrac{1}{2}$.',
        },
      },
      {
        label: 'ד',
        prompt: 'שרטטו סקיצה של גרף הפונקציה $g(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 360 320',
            svg: `
              <line x1="10" y1="160" x2="310" y2="160" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="120" y1="20" x2="120" y2="305" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <text x="303" y="156" fill="#475569" font-size="11" font-family="Heebo, sans-serif">x</text>
              <text x="108" y="28" fill="#475569" font-size="11" font-family="Heebo, sans-serif">y</text>
              <line x1="170.7" y1="20" x2="170.7" y2="305" stroke="rgba(37,99,235,0.7)" stroke-width="1.2" stroke-dasharray="5,4"/>
              <line x1="120" y1="120" x2="305" y2="120" stroke="rgba(5,150,105,0.6)" stroke-width="1" stroke-dasharray="5,4"/>
              <line x1="10" y1="140" x2="170" y2="140" stroke="rgba(5,150,105,0.6)" stroke-width="1" stroke-dasharray="5,4"/>
              <text x="176" y="32" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">x = ln10</text>
              <text x="270" y="116" fill="#059669" font-size="10" font-family="Heebo, sans-serif">y = 1</text>
              <text x="22" y="136" fill="#059669" font-size="10" font-family="Heebo, sans-serif">y = 1/2</text>
              <polyline points="10,140 76,139.7 120,142.2 142,147.5 153,156.2 155.4,160" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="2"/>
              <polyline points="155.4,160 157.4,164.2 161.8,180.4 166.2,229 169.5,300" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="2"/>
              <polyline points="172.8,20 177.2,62.2 186,100.2 208,115.5 252,119.5 296,119.9" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="2"/>
              <circle cx="155.4" cy="160" r="3" fill="none" stroke="#DB2777" stroke-width="1.3"/>
              <text x="146" y="173" fill="#DB2777" font-size="9.5" font-family="Heebo, sans-serif">ln5</text>
            `,
            caption:
              'גרף $g(x) = \\dfrac{5 - e^x}{10 - e^x}$ (עבור $a = 5$): אסימפטוטה אנכית $x = \\ln 10$, ואסימפטוטות אופקיות $y = 1$ (מימין) ו-$y = \\frac{1}{2}$ (משמאל). יש חור בנקודה $\\left(\\ln 5, 0\\right)$. הפונקציה יורדת בכל חלקי תחומה.',
          },
        ],
        hints: [
          'נצלו את האסימפטוטות מסעיף ג2 ואת החור ב-$\\left(\\ln 5, 0\\right)$.',
          'הנגזרת $g\'(x) = \\dfrac{-5 e^x}{(10 - e^x)^2} < 0$ — הפונקציה יורדת בכל קטע.',
        ],
        solution: {
          steps: [
            'תחום: $x \\ne \\ln 5$, $x \\ne \\ln 10$; אסימפטוטות $x = \\ln 10$, $y = 1$, $y = \\frac{1}{2}$.',
            'נגזרת: $\\;g\'(x) = \\dfrac{-5 e^x}{(10 - e^x)^2} < 0$ — הפונקציה יורדת בכל חלקי תחומה.',
            'ב-$x = \\ln 5$ יש חור בגרף בנקודה $\\left(\\ln 5,\\ 0\\right)$ (שם $g = 0$ אך הפונקציה אינה מוגדרת).',
            'בקטע $x < \\ln 5$: יורדת מ-$y = \\frac{1}{2}$ (ב-$-\\infty$) אל $0$ ב-$\\ln 5$; הערכים בין $0$ ל-$\\frac{1}{2}$.',
            'בקטע $\\ln 5 < x < \\ln 10$: יורדת מ-$0$ אל $-\\infty$ (ליד $x = \\ln 10$).',
            'בקטע $x > \\ln 10$: יורדת מ-$+\\infty$ (ליד $x = \\ln 10$) אל $y = 1$.',
          ],
          final_answer: 'ראו הסקיצה: אסימפטוטות $x = \\ln 10$, $y = 1$, $y = \\frac{1}{2}$; חור ב-$\\left(\\ln 5, 0\\right)$; יורדת בכל הקטעים.',
        },
      },
      {
        label: 'ה',
        prompt: [
          'לפניכם טענה:',
          '$$\\int_{-6}^{-4} g(x)\\,dx > \\int_{4}^{5} g(x)\\,dx$$',
          'האם הטענה נכונה? נמקו את תשובתכם.',
        ].join('\n'),
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 380 300',
            svg: `
              <line x1="60" y1="150" x2="330" y2="150" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="200" y1="30" x2="200" y2="285" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <text x="323" y="146" fill="#475569" font-size="11" font-family="Heebo, sans-serif">x</text>
              <line x1="250.7" y1="30" x2="250.7" y2="285" stroke="rgba(37,99,235,0.7)" stroke-width="1.1" stroke-dasharray="5,4"/>
              <line x1="120" y1="120" x2="330" y2="120" stroke="rgba(5,150,105,0.55)" stroke-width="0.9" stroke-dasharray="5,4"/>
              <line x1="60" y1="135" x2="250" y2="135" stroke="rgba(5,150,105,0.55)" stroke-width="0.9" stroke-dasharray="5,4"/>
              <polygon points="68,150 68,135 112,135 112,150" fill="rgba(180,83,9,0.2)" stroke="none"/>
              <polygon points="288,150 288,117 310,119 310,150" fill="rgba(180,83,9,0.2)" stroke="none"/>
              <polyline points="68,135 112,135 160,137 200,137 235.4,150 244,162 250,185" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="2"/>
              <polyline points="253,40 257,77 266,105 288,117 310,119" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="2"/>
              <circle cx="235.4" cy="150" r="3" fill="none" stroke="#DB2777" stroke-width="1.2"/>
              <line x1="68" y1="160" x2="112" y2="160" stroke="#DC2626" stroke-width="1"/>
              <text x="84" y="172" fill="#DC2626" font-size="10" font-family="Heebo, sans-serif">2</text>
              <line x1="288" y1="160" x2="310" y2="160" stroke="#DC2626" stroke-width="1"/>
              <text x="296" y="172" fill="#DC2626" font-size="10" font-family="Heebo, sans-serif">1</text>
              <text x="44" y="139" fill="#059669" font-size="9.5" font-family="Heebo, sans-serif">1/2</text>
              <text x="314" y="116" fill="#059669" font-size="9.5" font-family="Heebo, sans-serif">1</text>
              <text x="252" y="40" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">x = ln10</text>
            `,
            caption:
              'שני השטחים להשוואה. בקטע $[-6,-4]$ (משמאל) הגרף קרוב לאסימפטוטה $y=\\frac12$ אך מתחתיה, ולכן השטח קטן ממלבן $2 \\times \\frac12 = 1$. בקטע $[4,5]$ (מימין) הגרף מעל האסימפטוטה $y=1$, ולכן השטח גדול ממלבן $1 \\times 1 = 1$. מכאן השטח השמאלי קטן מהימני.',
          },
        ],
        hints: [
          'אל תחשבו את האינטגרלים — חסמו כל אחד בעזרת מלבן.',
          'בקטע $[-6,-4]$ הראו ש-$g < \\frac{1}{2}$, ובקטע $[4,5]$ הראו ש-$g > 1$.',
          'השוו: השמאלי קטן מ-$\\frac12 \\cdot 2 = 1$, והימני גדול מ-$1 \\cdot 1 = 1$.',
        ],
        solution: {
          steps: [
            'לא נחשב את האינטגרלים, אלא נחסום כל אחד בעזרת מלבן פשוט.',
            'בקטע $[-6, -4]$ הערכים רחוקים משמאל, ליד האסימפטוטה $y = \\frac{1}{2}$. נראה ש-$g < \\frac{1}{2}$:',
            '$g(x) - \\dfrac{1}{2} = \\dfrac{5 - e^x}{10 - e^x} - \\dfrac{1}{2} = \\dfrac{2(5 - e^x) - (10 - e^x)}{2(10 - e^x)} = \\dfrac{-e^x}{2(10 - e^x)}$.',
            'בקטע זה $10 - e^x > 0$, לכן הביטוי שלילי: $\\;0 < g(x) < \\frac{1}{2}$.',
            'מכאן $\\;\\displaystyle\\int_{-6}^{-4} g(x)\\,dx < \\frac{1}{2} \\cdot \\big(-4 - (-6)\\big) = \\frac{1}{2} \\cdot 2 = 1$.',
            'בקטע $[4, 5]$ מתקיים $x > \\ln 10$, ושם נראה ש-$g > 1$:',
            '$g(x) - 1 = \\dfrac{5 - e^x}{10 - e^x} - 1 = \\dfrac{-5}{10 - e^x}$.',
            'בקטע זה $10 - e^x < 0$, לכן הביטוי חיובי: $\\;g(x) > 1$.',
            'מכאן $\\;\\displaystyle\\int_{4}^{5} g(x)\\,dx > 1 \\cdot (5 - 4) = 1$.',
            'קיבלנו $\\;\\displaystyle\\int_{-6}^{-4} g(x)\\,dx < 1 < \\int_{4}^{5} g(x)\\,dx$.',
            'כלומר האינטגרל השמאלי קטן מהימני — בדיוק ההפך מהטענה.',
          ],
          final_answer: 'הטענה אינה נכונה: $\\int_{-6}^{-4} g\\,dx < 1 < \\int_{4}^{5} g\\,dx$, ולכן $\\int_{-6}^{-4} g\\,dx < \\int_{4}^{5} g\\,dx$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2025s582a-q5',
    year: 2025,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 5,
    topic: 'פונקציית ln',
    totalPoints: 25,
    context: 'נתונה הפונקציה $\\;f(x) = \\ln(x^n)\\;$, כאשר $n$ הוא מספר טבעי זוגי.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצאו את תחום ההגדרה של הפונקציה $f(x)$.',
        answer_type: 'expression',
        hints: [
          'תנאי הלוגריתם: הארגומנט חיובי, כלומר $x^n > 0$.',
          'מכיוון ש-$n$ זוגי, מתי בדיוק $x^n$ אינו חיובי?',
        ],
        solution: {
          steps: [
            'תנאי הלוגריתם: הארגומנט חיובי, כלומר $\\;x^n > 0$.',
            'מכיוון ש-$n$ זוגי, מתקיים $x^n > 0$ לכל $x \\ne 0$ (ו-$x^n = 0$ רק כאשר $x = 0$).',
            'לכן יש לפסול רק את $x = 0$.',
          ],
          final_answer: 'כל $x \\ne 0$.',
        },
      },
      {
        label: 'א2',
        prompt: 'לפניכם ארבעה גרפים, I–IV. קבעו איזה מהם מייצג את הפונקציה $f(x)$. נמקו את קביעתכם.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 760 220',
            svg: `
              <line x1="15" y1="120" x2="180" y2="120" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="95" y1="25" x2="95" y2="180" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <polyline points="20,170 45,150 70,135 95,120 130,90 170,45" fill="none" stroke="rgba(180,83,9,0.9)" stroke-width="1.7"/>
              <text x="95" y="205" fill="#334155" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">IV</text>
              <line x1="205" y1="120" x2="370" y2="120" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="285" y1="25" x2="285" y2="180" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <polyline points="210,178 235,150 260,110 280,45" fill="none" stroke="rgba(180,83,9,0.9)" stroke-width="1.7"/>
              <polyline points="290,45 310,110 335,150 360,178" fill="none" stroke="rgba(180,83,9,0.9)" stroke-width="1.7"/>
              <text x="285" y="205" fill="#334155" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">III</text>
              <line x1="395" y1="120" x2="560" y2="120" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="475" y1="25" x2="475" y2="180" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <polyline points="400,45 425,72 452,112 469,178" fill="none" stroke="rgba(180,83,9,0.9)" stroke-width="1.7"/>
              <polyline points="481,178 498,112 525,72 550,45" fill="none" stroke="rgba(180,83,9,0.9)" stroke-width="1.7"/>
              <text x="475" y="205" fill="#334155" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">II</text>
              <line x1="585" y1="120" x2="750" y2="120" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="600" y1="25" x2="600" y2="180" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <polyline points="605,178 625,130 660,100 700,70 748,45" fill="none" stroke="rgba(180,83,9,0.9)" stroke-width="1.7"/>
              <text x="667" y="205" fill="#334155" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">I</text>
            `,
            caption:
              'ארבעת הגרפים להתאמה. הפונקציה $f(x) = \\ln(x^n)$ עם $n$ זוגי היא זוגית (סימטרית ביחס לציר ה-$y$), שואפת ל-$-\\infty$ ליד $x = 0$ ול-$+\\infty$ בקצוות, וחותכת את ציר ה-$x$ ב-$x = \\pm 1$. הגרף המתאים הוא II.',
          },
        ],
        hints: [
          'בדקו את הזוגיות: חשבו את $f(-x)$ ונצלו ש-$n$ זוגי.',
          'פונקציה זוגית סימטרית ביחס לציר ה-$y$ — חפשו גרף סימטרי.',
        ],
        solution: {
          steps: [
            'נבדוק זוגיות: $\\;f(-x) = \\ln\\big((-x)^n\\big)$.',
            'מכיוון ש-$n$ זוגי, $(-x)^n = x^n$, ולכן $\\;f(-x) = \\ln(x^n) = f(x)$.',
            'כלומר הפונקציה זוגית — הגרף סימטרי ביחס לציר ה-$y$.',
            'בנוסף: כאשר $x \\to 0$ מתקיים $x^n \\to 0^+$ ולכן $f \\to -\\infty$ (אסימפטוטה אנכית $x = 0$); וכאשר $|x| \\to \\infty$ מתקיים $f \\to +\\infty$.',
            'הגרף היחיד שהוא סימטרי ביחס לציר ה-$y$ ומתאים לתיאור הוא גרף II.',
          ],
          final_answer: 'גרף II — הפונקציה זוגית (סימטרית ביחס לציר ה-$y$).',
        },
      },
      {
        label: 'ב1',
        prompt: [
          'מציבים מעתה $n = 2$, כלומר $f(x) = \\ln(x^2)$, ונתונה הפונקציה $\\;g(x) = \\big(f(x)\\big)^2 - 4\\;$, המוגדרת לכל $x \\ne 0$.',
          '',
          'מצאו את שיעורי נקודות החיתוך של גרף הפונקציה $g(x)$ עם ציר ה-$x$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'חיתוך עם ציר ה-$x$: $g(x) = 0$, כלומר $\\big(f(x)\\big)^2 = 4$.',
          'פתרו בנפרד $f(x) = 2$ ו-$f(x) = -2$, כל אחד נותן $x^2 = e^{\\pm 2}$.',
        ],
        solution: {
          steps: [
            'חיתוך עם ציר ה-$x$: $\\;g(x) = 0$, כלומר $\\big(f(x)\\big)^2 - 4 = 0$.',
            'מכאן $\\;\\big(f(x)\\big)^2 = 4$, ולכן $\\;f(x) = 2$ או $f(x) = -2$.',
            'מקרה $f(x) = 2$: $\\;\\ln(x^2) = 2 \\Rightarrow x^2 = e^2 \\Rightarrow x = \\pm e$.',
            'מקרה $f(x) = -2$: $\\;\\ln(x^2) = -2 \\Rightarrow x^2 = e^{-2} \\Rightarrow x = \\pm \\dfrac{1}{e}$.',
          ],
          final_answer: '$\\left(e, 0\\right),\\ \\left(-e, 0\\right),\\ \\left(\\dfrac{1}{e}, 0\\right),\\ \\left(-\\dfrac{1}{e}, 0\\right)$.',
        },
      },
      {
        label: 'ב2',
        prompt: 'מצאו את שיעורי נקודות הקיצון של הפונקציה $g(x)$, וקבעו את סוגן.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 420 132',
            svg: `
              <rect x="12" y="16" width="396" height="100" fill="none" stroke="rgba(100,116,139,0.45)" stroke-width="1"/>
              <line x1="78" y1="16" x2="78" y2="116" stroke="rgba(100,116,139,0.45)" stroke-width="1"/>
              <line x1="12" y1="49" x2="408" y2="49" stroke="rgba(100,116,139,0.45)" stroke-width="1"/>
              <line x1="12" y1="82" x2="408" y2="82" stroke="rgba(100,116,139,0.45)" stroke-width="1"/>
              <line x1="240" y1="16" x2="240" y2="116" stroke="rgba(37,99,235,0.6)" stroke-width="1" stroke-dasharray="4,3"/>
              <text x="45" y="38" fill="#334155" font-size="12" font-family="Heebo, sans-serif" text-anchor="middle">x</text>
              <text x="45" y="71" fill="#334155" font-size="12" font-family="Heebo, sans-serif" text-anchor="middle">g '(x)</text>
              <text x="45" y="104" fill="#334155" font-size="12" font-family="Heebo, sans-serif" text-anchor="middle">g(x)</text>
              <text x="148" y="38" fill="#334155" font-size="12" font-family="Heebo, sans-serif" text-anchor="middle">-1</text>
              <text x="240" y="38" fill="#334155" font-size="12" font-family="Heebo, sans-serif" text-anchor="middle">0</text>
              <text x="332" y="38" fill="#334155" font-size="12" font-family="Heebo, sans-serif" text-anchor="middle">1</text>
              <text x="112" y="72" fill="#DC2626" font-size="15" font-family="Heebo, sans-serif" text-anchor="middle">&#8722;</text>
              <text x="148" y="72" fill="#334155" font-size="12" font-family="Heebo, sans-serif" text-anchor="middle">0</text>
              <text x="194" y="71" fill="#059669" font-size="14" font-family="Heebo, sans-serif" text-anchor="middle">+</text>
              <text x="286" y="72" fill="#DC2626" font-size="15" font-family="Heebo, sans-serif" text-anchor="middle">&#8722;</text>
              <text x="332" y="72" fill="#334155" font-size="12" font-family="Heebo, sans-serif" text-anchor="middle">0</text>
              <text x="372" y="71" fill="#059669" font-size="14" font-family="Heebo, sans-serif" text-anchor="middle">+</text>
              <line x1="98" y1="90" x2="128" y2="110" stroke="#DC2626" stroke-width="1.4"/>
              <line x1="170" y1="110" x2="200" y2="90" stroke="#059669" stroke-width="1.4"/>
              <line x1="282" y1="90" x2="312" y2="110" stroke="#DC2626" stroke-width="1.4"/>
              <line x1="354" y1="110" x2="384" y2="90" stroke="#059669" stroke-width="1.4"/>
              <circle cx="148" cy="100" r="2.4" fill="#B45309"/>
              <circle cx="332" cy="100" r="2.4" fill="#B45309"/>
              <text x="148" y="113" fill="#B45309" font-size="8.5" font-family="Heebo, sans-serif" text-anchor="middle">min</text>
              <text x="332" y="113" fill="#B45309" font-size="8.5" font-family="Heebo, sans-serif" text-anchor="middle">min</text>
            `,
            caption:
              'טבלת סימני הנגזרת $g\'(x) = \\dfrac{4\\ln(x^2)}{x}$. הקו המקווקו ב-$x = 0$ הוא מחוץ לתחום (אסימפטוטה אנכית). סביב $x = -1$ ו-$x = 1$ הנגזרת עוברת מ-$-$ ל-$+$, ולכן בשתי הנקודות יש מינימום.',
          },
        ],
        hints: [
          'גזרו פונקציה מורכבת: $g\'(x) = 2 f(x) \\cdot f\'(x)$, עם $f\'(x) = \\frac{2}{x}$.',
          'אפסו: או $f(x) = 0$ (כלומר $\\ln(x^2) = 0$) או $f\'(x) = 0$ (אין פתרון).',
          'קבעו סוג לפי סימן $g\'(x) = \\frac{4\\ln(x^2)}{x}$ סביב כל נקודה.',
        ],
        solution: {
          steps: [
            'נגזור פונקציה מורכבת: $\\;g\'(x) = 2 f(x) \\cdot f\'(x)$.',
            'נחשב $\\;f\'(x) = \\big(\\ln(x^2)\\big)\' = \\dfrac{2x}{x^2} = \\dfrac{2}{x}$.',
            'לכן $\\;g\'(x) = 2 \\ln(x^2) \\cdot \\dfrac{2}{x} = \\dfrac{4 \\ln(x^2)}{x}$.',
            'נשווה ל-$0$: או $f(x) = 0$, או $f\'(x) = 0$.',
            '$f(x) = 0$: $\\;\\ln(x^2) = 0 \\Rightarrow x^2 = 1 \\Rightarrow x = \\pm 1$.',
            '$f\'(x) = 0$: $\\;\\dfrac{2}{x} = 0$ — אין פתרון.',
            'ערך הפונקציה בנקודות: $\\;g(\\pm 1) = \\big(\\ln 1\\big)^2 - 4 = 0 - 4 = -4$.',
            'סימן $g\'(x) = \\dfrac{4\\ln(x^2)}{x}$: המונה חיובי כש-$|x| > 1$ ושלילי כש-$|x| < 1$ (ראו טבלה).',
            'סביב $x = -1$ הנגזרת עוברת מ-$-$ ל-$+$ — מינימום; סביב $x = 1$ הנגזרת עוברת מ-$-$ ל-$+$ — מינימום.',
          ],
          final_answer: 'שתי נקודות מינימום: $\\left(1, -4\\right)$ ו-$\\left(-1, -4\\right)$.',
        },
      },
      {
        label: 'ג',
        prompt: 'שרטטו סקיצה של גרף הפונקציה $g(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 400 300',
            svg: `
              <line x1="18" y1="210" x2="388" y2="210" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="200" y1="20" x2="200" y2="275" stroke="rgba(37,99,235,0.7)" stroke-width="1.2" stroke-dasharray="5,4"/>
              <text x="381" y="206" fill="#475569" font-size="11" font-family="Heebo, sans-serif">x</text>
              <text x="188" y="30" fill="#475569" font-size="11" font-family="Heebo, sans-serif">y</text>
              <text x="204" y="32" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">x = 0</text>
              <polyline points="202.6,25 205.2,140 209.6,210 213,232.9 226,254 252,232.9 270.7,210 304,169.4 330,140 382,87.3" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="2"/>
              <polyline points="18,87.3 70,140 96,169.4 129.3,210 148,232.9 174,254 187,232.9 190.4,210 194.8,140 197.4,25" fill="none" stroke="rgba(180,83,9,0.95)" stroke-width="2"/>
              <circle cx="226" cy="254" r="3" fill="#B45309"/>
              <circle cx="174" cy="254" r="3" fill="#B45309"/>
              <text x="237" y="266" fill="#B45309" font-size="9.5" font-family="Heebo, sans-serif">(1, -4)</text>
              <text x="138" y="266" fill="#B45309" font-size="9.5" font-family="Heebo, sans-serif">(-1, -4)</text>
              <circle cx="209.6" cy="210" r="2.2" fill="#2563EB"/>
              <circle cx="270.7" cy="210" r="2.2" fill="#2563EB"/>
              <circle cx="190.4" cy="210" r="2.2" fill="#2563EB"/>
              <circle cx="129.3" cy="210" r="2.2" fill="#2563EB"/>
              <text x="276" y="204" fill="#2563EB" font-size="9" font-family="Heebo, sans-serif">e</text>
              <text x="118" y="204" fill="#2563EB" font-size="9" font-family="Heebo, sans-serif">-e</text>
            `,
            caption:
              'גרף $g(x) = \\big(\\ln(x^2)\\big)^2 - 4$: זוגי (סימטרי ביחס לציר ה-$y$), עם אסימפטוטה אנכית $x = 0$ (שם $g \\to +\\infty$). שתי נקודות מינימום ב-$(\\pm 1, -4)$, וחיתוכי ציר ה-$x$ ב-$\\pm\\frac{1}{e}$ וב-$\\pm e$.',
          },
        ],
        hints: [
          'נצלו את הזוגיות, את האסימפטוטה $x = 0$, את המינימומים $(\\pm 1, -4)$ ואת ארבעת החיתוכים.',
          'בכל ענף: יורד מ-$+\\infty$ ליד $0$, חוצה את הציר, מגיע למינימום, חוצה שוב, ועולה אל $+\\infty$.',
        ],
        solution: {
          steps: [
            'הפונקציה זוגית (כי $f$ זוגית), סימטרית ביחס לציר ה-$y$.',
            'אסימפטוטה אנכית $x = 0$: כאשר $x \\to 0$ מתקיים $\\ln(x^2) \\to -\\infty$, ולכן $g = \\big(\\ln(x^2)\\big)^2 - 4 \\to +\\infty$.',
            'כאשר $|x| \\to \\infty$ גם $g \\to +\\infty$.',
            'חיתוכי ציר $x$: $\\;\\pm\\dfrac{1}{e}$ ו-$\\pm e$; שתי נקודות מינימום $\\left(\\pm 1, -4\\right)$.',
            'לכל ענף (למשל $x > 0$): יורד מ-$+\\infty$ (ליד $0$), חוצה ב-$\\frac{1}{e}$, מגיע למינימום $(1, -4)$, חוצה ב-$e$, ועולה אל $+\\infty$.',
          ],
          final_answer: 'ראו הסקיצה: אסימפטוטה אנכית $x = 0$, סימטריה ביחס לציר $y$, מינימומים ב-$(\\pm 1, -4)$, וחיתוכי ציר $x$ ב-$\\pm\\frac{1}{e}$ וב-$\\pm e$.',
        },
      },
      {
        label: 'ד1',
        prompt: [
          'נתונה הפונקציה $\\;k(x) = \\dfrac{g\'(x)}{g(x)}\\;$, בתחום $x > 0$.',
          '',
          'מצאו את תחום ההגדרה של הפונקציה $k(x)$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'נתון $x > 0$; בנוסף דרשו שהמכנה $g(x) \\ne 0$.',
          'אילו אפסים של $g$ נמצאים בתחום $x > 0$?',
        ],
        solution: {
          steps: [
            'נתון $x > 0$. בנוסף נדרוש שהמכנה אינו מתאפס: $\\;g(x) \\ne 0$.',
            'מסעיף ב1, בתחום $x > 0$ מתקיים $g(x) = 0$ ב-$x = \\dfrac{1}{e}$ וב-$x = e$.',
            'לכן יש לפסול אותם.',
          ],
          final_answer: 'כל $x > 0$ פרט ל-$x = \\dfrac{1}{e}$ ו-$x = e$.',
        },
      },
      {
        label: 'ד2',
        prompt: 'חשבו את השטח המוגבל על-ידי גרף הפונקציה $k(x)$, ציר ה-$x$, והישרים $x = e^2$ ו-$x = e^3$.',
        answer_type: 'expression',
        hints: [
          'שימו לב ש-$k(x) = \\dfrac{g\'(x)}{g(x)}$ היא נגזרת לוגריתמית — מהי הפונקציה הקדומה?',
          'בקטע $[e^2, e^3]$ מתקיים $g(x) > 0$, לכן השטח שווה לאינטגרל. חשבו $g(e^3)$ ו-$g(e^2)$.',
        ],
        solution: {
          steps: [
            'נשים לב ש-$k(x) = \\dfrac{g\'(x)}{g(x)}$ היא נגזרת לוגריתמית: $\\;\\displaystyle\\int \\dfrac{g\'(x)}{g(x)}\\,dx = \\ln|g(x)| + C$.',
            'בקטע $[e^2, e^3]$ מתקיים $x > e$, ולכן $g(x) > 0$ ו-$g\'(x) > 0$ — כלומר $k(x) > 0$, והשטח שווה לאינטגרל.',
            '$S = \\displaystyle\\int_{e^2}^{e^3} \\dfrac{g\'(x)}{g(x)}\\,dx = \\Big[\\ln|g(x)|\\Big]_{e^2}^{e^3} = \\ln g(e^3) - \\ln g(e^2)$.',
            'נחשב $\\;g(e^3) = \\big(\\ln(e^6)\\big)^2 - 4 = 6^2 - 4 = 32$.',
            'נחשב $\\;g(e^2) = \\big(\\ln(e^4)\\big)^2 - 4 = 4^2 - 4 = 12$.',
            'מציבים: $\\;S = \\ln 32 - \\ln 12 = \\ln\\dfrac{32}{12} = \\ln\\dfrac{8}{3}$.',
          ],
          final_answer: '$S = \\ln\\dfrac{8}{3}\\;$ (יחידות שטח).',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
