/**
 * שאלון 582 — קיץ תשפ"א (2021), מועד ב'
 * =====================================
 *
 * המקור של השאלות: meyda.education.gov.il (משרד החינוך — נחלת הכלל).
 * הפתרונות נכתבו על-ידינו בסגנון האפליקציה; השיטה המתמטית עצמה כללית.
 *
 * תוכן השאלון:
 *   Q1 — גאומטריה אנליטית (פרבולה, מעגלים, מקום גאומטרי).
 *   Q2 — וקטורים במרחב (משולש עם חלוקת צלעות + מישור במרחב).
 *   Q3 — מספרים מרוכבים (משוואה ביקוודרטית + פרמטרים, מלבן במישור גאוס).
 *   Q4 — פונקציות מעריכיות (חקירת $e^{bx^2-2bx}-1$ והזזתה).
 *   Q5 — פונקציית ln (חקירת $\ln(ax^2-x^3)$).
 *
 * הערה: לכל תת-סעיף בשאלון המקורי יש כאן סעיף נפרד לענות עליו (א1, א2, …),
 * וכל גרף/תרשים מוצג ויזואלית דרך השדה diagrams.
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2021Summer582MoedB: PastBagrutQuestion[] = [
  // ===========================================================================
  // Q1 — גאומטריה אנליטית: פרבולה $y^2 = 2ax$ ומעגל
  // ===========================================================================
  {
    id: 'b2021s582b-q1',
    year: 2021,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    totalPoints: 33,
    context:
      '(קיץ תשפ"א, מועד ב\') נתונים פרמטר $a > 0$, הפרבולה $\\;y^2 = 2ax\\;$ והמעגל $\\;x^2 + y^2 - 2ax - 2x = 0$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את נקודות החיתוך של הפרבולה והמעגל (בעזרת $a$).',
        answer_type: 'expression',
        hints: [
          'מהפרבולה $\\;y^2 = 2ax$. הצב את הביטוי הזה במקום $y^2$ במשוואת המעגל וקבל משוואה ב-$x$ בלבד.',
          'תקבל $\\;x^2 - 2x = 0$. פתור ל-$x$, ואז חזור לפרבולה כדי למצוא את ערכי $y$ המתאימים.',
        ],
        solution: {
          steps: [
            'נציב את $\\;y^2 = 2ax\\;$ במשוואת המעגל $\\;x^2 + y^2 - 2ax - 2x = 0$:',
            '$x^2 + 2ax - 2ax - 2x = 0$',
            '$x^2 - 2x = 0$',
            '$x = 0 \\quad,\\quad x = 2$',
            '$x = 0:\\quad y^2 = 2a\\cdot 0 = 0 \\;\\Rightarrow\\; y = 0$',
            '$x = 2:\\quad y^2 = 2a\\cdot 2 = 4a \\;\\Rightarrow\\; y = 2\\sqrt{a}\\,,\\quad y = -2\\sqrt{a}$',
          ],
          final_answer:
            'שלוש נקודות החיתוך: $(0,\\,0)\\,,\\;(2,\\,2\\sqrt{a})\\,,\\;(2,\\,-2\\sqrt{a})$.',
        },
      },
      {
        label: 'ב',
        prompt:
          'דרך שתיים מבין נקודות החיתוך של הפרבולה והמעגל עובר ישר ששיפועו חיובי. מצא את משוואת הישר (בעזרת $a$).',
        answer_type: 'expression',
        hints: [
          'מבין שלוש נקודות החיתוך, איזה זוג נותן שיפוע חיובי? שים לב שראשית הצירים $(0,0)$ היא אחת הנקודות.',
          'השיפוע בין $(0,0)$ ל-$(2,\\,2\\sqrt{a})$ הוא $\\sqrt{a} > 0$. ישר דרך הראשית הוא $y = mx$.',
        ],
        solution: {
          steps: [
            'השיפוע חיובי, ולכן הישר עובר דרך $\\;(0,\\,0)\\;$ ודרך $\\;(2,\\,2\\sqrt{a})$.',
            '$m = \\dfrac{2\\sqrt{a} - 0}{2 - 0} = \\sqrt{a}$',
            '$y = \\sqrt{a}\\,x$',
          ],
          final_answer: 'משוואת הישר: $\\;y = \\sqrt{a}\\,x$.',
        },
      },
      {
        label: 'ג1',
        prompt: 'מצא את מרכז המעגל $\\;x^2 + y^2 - 2ax - 2x = 0\\;$ ואת רדיוסו (בעזרת $a$).',
        answer_type: 'expression',
        hints: [
          'קבץ את אברי ה-$x$: $\\;x^2 - 2(a+1)x + y^2 = 0$, והשלם לריבוע.',
          'הצורה התקנית היא $(x - x_0)^2 + (y - y_0)^2 = R^2$.',
        ],
        solution: {
          steps: [
            'נכתוב את משוואת המעגל בצורה תקנית. נקבץ את אברי ה-$x$ ($-2ax - 2x = -2(a+1)x$) ונשלים לריבוע (נוסיף $(a+1)^2$ לשני האגפים):',
            '$x^2 - 2(a+1)x + (a+1)^2 + y^2 = (a+1)^2$',
            '$\\bigl(x - (a+1)\\bigr)^2 + y^2 = (a+1)^2$',
            'מרכז המעגל: $\\;(a+1,\\,0)$',
            'רדיוס המעגל: $\\;R = a+1$',
          ],
          final_answer: 'מרכז $\\;(a+1,\\,0)\\;$, רדיוס $\\;R = a+1$.',
        },
      },
      {
        label: 'ג2',
        prompt:
          'ממרכז המעגל מעבירים אנך אל הישר שמצאת בסעיף ב, ואורכו $\\;2\\sqrt{5}$. מצא את ערך הפרמטר $a$.',
        answer_type: 'number',
        hints: [
          'אורך האנך = המרחק מהמרכז אל הישר. המרחק מנקודה $(x_0, y_0)$ לישר $Ax + By + C = 0$ הוא $\\dfrac{|Ax_0 + By_0 + C|}{\\sqrt{A^2+B^2}}$.',
          'כתוב את הישר כ-$\\sqrt{a}\\,x - y = 0$ והצב את המרכז $(a+1, 0)$. תקבל משוואה ריבועית ב-$a$.',
        ],
        solution: {
          steps: [
            'נכתוב את הישר כ-$\\;\\sqrt{a}\\,x - y = 0\\;$ ונחשב את המרחק מהמרכז $\\;(a+1,\\,0)\\;$ אליו:',
            '$2\\sqrt{5} = \\dfrac{|\\sqrt{a}\\,(a+1) - 0|}{\\sqrt{(\\sqrt{a})^2 + (-1)^2}}$',
            '$2\\sqrt{5} = \\dfrac{\\sqrt{a}\\,(a+1)}{\\sqrt{a+1}}$',
            'נעלה את שני האגפים בריבוע: $\\;20 = \\dfrac{a\\,(a+1)^2}{a+1}$',
            '$20 = a(a+1)$',
            '$a^2 + a - 20 = 0$',
            '$a = 4 \\quad,\\quad a = -5$',
            'מכיוון ש-$a > 0$: $\\;a = 4$.',
          ],
          final_answer: '$a = 4$.',
        },
      },
      {
        label: 'ד',
        prompt:
          'מגדירים מעגל חדש שמרכזו זהה למרכז המעגל הנתון, ורדיוסו קטן ב-$2$ מרדיוס המעגל הנתון. מצא את משוואת המקום הגאומטרי של כל הנקודות שאורך המשיק מהן אל המעגל החדש שווה למרחק שלהן מן הישר $\\;x = -4$.',
        answer_type: 'expression',
        hints: [
          'קודם מצא את המעגל החדש: אותו מרכז $\\;(5,\\,0)$, ורדיוס קטן ב-$2$, כלומר $\\;5 - 2 = 3$. משוואתו $\\;(x-5)^2 + y^2 = 9$.',
          'אורך המשיק $d$ מנקודה $(x,\\,y)$ מקיים (פיתגורס) $\\;d^2 + 3^2 = (x-5)^2 + y^2$. המרחק מן הישר האנכי $x = -4$ הוא $\\;x + 4$. השווה, העלה בריבוע ופשט.',
        ],
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 218 192',
            svg: `
              <line x1="10" y1="130" x2="212" y2="130" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="70" y1="14" x2="70" y2="184" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="205" y="124" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">x</text>
              <text x="74" y="22" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">y</text>
              <line x1="22" y1="14" x2="22" y2="184" stroke="rgba(125,211,252,0.75)" stroke-width="1.3" stroke-dasharray="4 3"/>
              <text x="4" y="178" fill="#7dd3fc" font-size="10.5" font-family="Heebo, sans-serif">x = -4</text>
              <circle cx="130" cy="130" r="36" fill="rgba(168,85,247,0.07)" stroke="rgba(226,232,240,0.85)" stroke-width="1.6"/>
              <line x1="22" y1="55" x2="106" y2="55" stroke="rgba(125,211,252,0.6)" stroke-width="1.2" stroke-dasharray="3 3"/>
              <line x1="130" y1="130" x2="155.5" y2="104.5" stroke="rgba(251,191,36,0.9)" stroke-width="1.3"/>
              <line x1="106" y1="55" x2="155.5" y2="104.5" stroke="rgba(244,114,182,0.95)" stroke-width="1.5"/>
              <path d="M 149.8 98.8 L 144.2 104.5 L 149.8 110.2" fill="none" stroke="rgba(226,232,240,0.9)" stroke-width="1.1"/>
              <circle cx="130" cy="130" r="2.6" fill="rgba(251,191,36,0.95)"/>
              <circle cx="106" cy="55" r="2.9" fill="rgba(244,114,182,0.95)"/>
              <circle cx="155.5" cy="104.5" r="2.4" fill="rgba(244,114,182,0.95)"/>
              <circle cx="22" cy="55" r="2.2" fill="rgba(125,211,252,0.9)"/>
              <text x="126" y="146" fill="#f1f5f9" font-size="10.5" font-family="Heebo, sans-serif">(5,0)</text>
              <text x="80" y="50" fill="#f1f5f9" font-size="10.5" font-family="Heebo, sans-serif">(x,y)</text>
              <text x="133" y="78" fill="#f9a8d4" font-size="11" font-family="Heebo, sans-serif">d</text>
              <text x="147" y="121" fill="#fcd34d" font-size="11" font-family="Heebo, sans-serif">3</text>
              <text x="52" y="49" fill="#7dd3fc" font-size="10" font-family="Heebo, sans-serif">x+4</text>
            `,
            caption:
              'המעגל החדש: מרכז $(5,0)$, רדיוס $3$. אורך המשיק $d$ מנקודה $(x,y)$ מאונך לרדיוס בנקודת ההשקה, ושווה למרחק $x+4$ מן הישר $x=-4$.',
          },
        ],
        solution: {
          steps: [
            'המרכז זהה למרכז המעגל הנתון: $\\;(a+1,\\,0) = (5,\\,0)$.',
            'הרדיוס קטן ב-$2$ מרדיוס המעגל הנתון: $\\;5 - 2 = 3$.',
            'משוואת המעגל החדש: $\\;(x-5)^2 + y^2 = 9$.',
            'נסמן נקודה כללית $\\;(x,\\,y)$. המשיק מאונך לרדיוס בנקודת ההשקה, ולפי משפט פיתגורס:',
            '$d^2 + 3^2 = \\left(\\sqrt{(x-5)^2 + y^2}\\right)^2$',
            '$d^2 = (x-5)^2 + y^2 - 9$',
            '$d = \\sqrt{(x-5)^2 + y^2 - 9}$',
            'המרחק מהנקודה אל הישר $\\;x = -4\\;$ הוא $\\;x + 4$.',
            'נשווה את אורך המשיק למרחק מן הישר: $\\;x + 4 = \\sqrt{(x-5)^2 + y^2 - 9}$',
            'נעלה את שני האגפים בריבוע: $\\;(x+4)^2 = (x-5)^2 + y^2 - 9$',
            '$x^2 + 8x + 16 = x^2 - 10x + 25 + y^2 - 9$',
            'נצמצם $\\;x^2\\;$ ונסדר: $\\;8x + 16 = -10x + 16 + y^2$',
            '$18x = y^2$',
          ],
          final_answer: 'המקום הגאומטרי הוא הפרבולה $\\;y^2 = 18x$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q2 — וקטורים במרחב: משולש עם חלוקת צלעות + מישור במרחב
  // ===========================================================================
  {
    id: 'b2021s582b-q2',
    year: 2021,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 33,
    context: [
      '(קיץ תשפ"א, מועד ב\') במשולש $ABC$ (ראה סרטוט): הנקודה $D$ היא אמצע הצלע $AB$, והנקודה $E$ מחלקת את הצלע $AC$ ביחס $AE:EC = 2:1$.',
      'הנקודה $F$ היא מפגש הקטעים $BE$ ו-$CD$. נסמן $\\;\\vec{CA} = \\vec{u}$, $\\;\\vec{CB} = \\vec{v}$, וכן $\\;\\vec{CF} = k\\,\\vec{CD}$, $\\;\\vec{BF} = t\\,\\vec{BE}$.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 200 200',
        svg: `
          <polygon points="25,160 80,35 185,160" fill="rgba(168,85,247,0.08)" stroke="rgba(226,232,240,0.85)" stroke-width="1.6"/>
          <line x1="80" y1="35" x2="131.67" y2="160" stroke="rgba(244,114,182,0.95)" stroke-width="1.4"/>
          <line x1="185" y1="160" x2="52.5" y2="97.5" stroke="rgba(244,114,182,0.95)" stroke-width="1.4"/>
          <circle cx="25" cy="160" r="3" fill="rgba(251,191,36,0.95)"/>
          <circle cx="80" cy="35" r="3" fill="rgba(251,191,36,0.95)"/>
          <circle cx="185" cy="160" r="3" fill="rgba(251,191,36,0.95)"/>
          <circle cx="52.5" cy="97.5" r="2.6" fill="rgba(244,114,182,0.95)"/>
          <circle cx="131.67" cy="160" r="2.6" fill="rgba(244,114,182,0.95)"/>
          <circle cx="118.75" cy="128.75" r="2.6" fill="rgba(244,114,182,0.95)"/>
          <text x="12" y="168" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">A</text>
          <text x="76" y="28" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">B</text>
          <text x="189" y="166" fill="#f1f5f9" font-size="12" font-weight="bold" font-family="Heebo, sans-serif">C</text>
          <text x="34" y="98" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">D</text>
          <text x="134" y="172" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">E</text>
          <text x="123" y="124" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">F</text>
        `,
        caption: 'המשולש $ABC$ עם $D$ אמצע $AB$, $E$ על $AC$ ($AE:EC=2:1$), ו-$F$ נקודת חיתוך של $BE$ ו-$CD$.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'מצא את $t$ ואת $k$.',
        answer_type: 'expression',
        hints: [
          'בטא את $\\vec{BF}$ בשתי דרכים: דרך הישר $BE$ ($\\vec{BF} = t\\,\\vec{BE}$), ודרך $\\;\\vec{BF} = \\vec{BC} + \\vec{CF} = \\vec{BC} + k\\,\\vec{CD}$.',
          'השתמש ב-$\\vec{CE} = \\tfrac{1}{3}\\vec{u}$ (כי $AE:EC=2:1$) וב-$\\vec{CD} = \\tfrac{1}{2}(\\vec{u}+\\vec{v})$ ($D$ אמצע). השווה את מקדמי $\\vec{u}$ ו-$\\vec{v}$ ופתור.',
        ],
        solution: {
          steps: [
            'נבטא את $\\vec{BF}$ בשתי דרכים ונשווה.',
            'דרך $BE$: $\\;\\vec{BF} = t\\,\\vec{BE} = t(\\vec{BC} + \\vec{CE}) = t\\bigl(-\\vec{v} + \\tfrac{1}{3}\\vec{u}\\bigr) = \\tfrac{t}{3}\\vec{u} - t\\vec{v}$',
            'דרך $CD$: $\\;\\vec{BF} = \\vec{BC} + \\vec{CF} = -\\vec{v} + k\\,\\vec{CD} = -\\vec{v} + k\\bigl(\\vec{CA} + \\vec{AD}\\bigr)$',
            '$= -\\vec{v} + k\\bigl(\\vec{u} + \\tfrac{1}{2}(\\vec{AC} + \\vec{CB})\\bigr) = -\\vec{v} + k\\bigl(\\vec{u} - \\tfrac{1}{2}\\vec{u} + \\tfrac{1}{2}\\vec{v}\\bigr) = \\tfrac{k}{2}\\vec{u} + \\bigl(\\tfrac{k}{2} - 1\\bigr)\\vec{v}$',
            'נשווה: $\\;\\tfrac{t}{3}\\vec{u} - t\\vec{v} = \\tfrac{k}{2}\\vec{u} + \\bigl(\\tfrac{k}{2} - 1\\bigr)\\vec{v}$',
            '$\\vec{u}$ ו-$\\vec{v}$ בלתי-תלויים, לכן נשווה מקדמים:',
            '$\\begin{cases} \\tfrac{t}{3} = \\tfrac{k}{2} \\\\ -t = \\tfrac{k}{2} - 1 \\end{cases} \\;\\Rightarrow\\; \\begin{cases} t = \\tfrac{3k}{2} \\\\ t = 1 - \\tfrac{k}{2} \\end{cases}$',
            '$\\tfrac{3k}{2} = 1 - \\tfrac{k}{2} \\;\\Rightarrow\\; 2k = 1 \\;\\Rightarrow\\; k = \\tfrac{1}{2}$',
            '$t = \\tfrac{3}{2}\\cdot\\tfrac{1}{2} = \\tfrac{3}{4}$',
          ],
          final_answer: '$t = \\tfrac{3}{4}\\,,\\quad k = \\tfrac{1}{2}$.',
        },
      },
      {
        label: 'ב',
        prompt: [
          'המשולש $ABC$ נמצא במישור $\\;4x + 2y + z - 12 = 0$, החותך את ציר ה-$x$ בנקודה $A$, את ציר ה-$y$ בנקודה $C$, ואת ציר ה-$z$ בנקודה $B$. הנקודה $O$ היא ראשית הצירים.',
          'מצא את שיעורי הנקודות $E$ ו-$F$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'מצא קודם את $A$, $B$, $C$ — חיתוכי המישור עם הצירים (בכל ציר שתי הקואורדינטות האחרות שוות $0$).',
          '$E = A + \\tfrac{2}{3}(C - A)$ (כי $AE:EC = 2:1$). את $F$ מצא לפי $\\vec{BF} = \\tfrac{3}{4}\\vec{BE}$ (מ-$t$ שמצאת): $\\;F = B + \\tfrac{3}{4}(E - B)$.',
        ],
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 230 180',
            svg: `
              <polygon points="35,150 90,30 195,150" fill="rgba(168,85,247,0.08)" stroke="rgba(226,232,240,0.85)" stroke-width="1.6"/>
              <line x1="90" y1="30" x2="141.67" y2="150" stroke="rgba(244,114,182,0.95)" stroke-width="1.4"/>
              <line x1="195" y1="150" x2="62.5" y2="90" stroke="rgba(244,114,182,0.95)" stroke-width="1.4"/>
              <circle cx="35" cy="150" r="3" fill="rgba(251,191,36,0.95)"/>
              <circle cx="90" cy="30" r="3" fill="rgba(251,191,36,0.95)"/>
              <circle cx="195" cy="150" r="3" fill="rgba(251,191,36,0.95)"/>
              <circle cx="62.5" cy="90" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <circle cx="141.67" cy="150" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <circle cx="128.75" cy="120" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <text x="2" y="163" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">A(3,0,0)</text>
              <text x="62" y="22" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">B(0,0,12)</text>
              <text x="166" y="164" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">C(0,6,0)</text>
              <text x="47" y="88" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">D</text>
              <text x="146" y="163" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">E</text>
              <text x="132" y="116" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">F</text>
            `,
            caption: 'המשולש עם שיעורי הקודקודים: $A(3,0,0)$, $B(0,0,12)$, $C(0,6,0)$. $D$ אמצע $AB$, $E$ על $AC$, ו-$F$ מפגש $BE$ ו-$CD$.',
          },
        ],
        solution: {
          steps: [
            'נמצא את חיתוכי המישור עם הצירים.',
            'ציר $x$ ($y=z=0$): $\\;4x - 12 = 0 \\;\\Rightarrow\\; x = 3$, אז $A = (3,\\,0,\\,0)$.',
            'ציר $y$ ($x=z=0$): $\\;2y - 12 = 0 \\;\\Rightarrow\\; y = 6$, אז $C = (0,\\,6,\\,0)$.',
            'ציר $z$ ($x=y=0$): $\\;z - 12 = 0 \\;\\Rightarrow\\; z = 12$, אז $B = (0,\\,0,\\,12)$.',
            '$E$ על $AC$ עם $AE:EC = 2:1$: $\\;E = A + \\tfrac{2}{3}(C - A) = (3,0,0) + \\tfrac{2}{3}(-3,\\,6,\\,0)$',
            '$E = (3,0,0) + (-2,\\,4,\\,0) = (1,\\,4,\\,0)$',
            'את $F$ נמצא לפי $\\;\\vec{BF} = \\tfrac{3}{4}\\vec{BE}$ (כי $t = \\tfrac{3}{4}$): $\\;F = B + \\tfrac{3}{4}(E - B)$',
            '$F = (0,0,12) + \\tfrac{3}{4}\\bigl((1,4,0) - (0,0,12)\\bigr) = (0,0,12) + \\tfrac{3}{4}(1,\\,4,\\,-12)$',
            '$F = (0,0,12) + \\bigl(\\tfrac{3}{4},\\,3,\\,-9\\bigr) = \\bigl(\\tfrac{3}{4},\\,3,\\,3\\bigr)$',
          ],
          final_answer: '$E = (1,\\,4,\\,0)\\,,\\quad F = \\bigl(\\tfrac{3}{4},\\,3,\\,3\\bigr)$.',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את משוואת המישור העובר דרך הנקודות $A$, $O$ (ראשית הצירים) ו-$E$.',
        answer_type: 'expression',
        hints: [
          'המישור עובר דרך $O$, לכן ניתן לכתוב אותו פרמטרית: $\\;\\vec{X} = r\\,\\vec{OA} + s\\,\\vec{OE}$.',
          'מצא וקטור נורמל $\\vec{n} = (a,b,c)$ הניצב גם ל-$\\vec{OA}$ וגם ל-$\\vec{OE}$ (שתי מכפלות סקלריות $= 0$).',
        ],
        solution: {
          steps: [
            'הנקודות: $\\;O = (0,0,0)\\,,\\; A = (3,0,0)\\,,\\; E = (1,4,0)$.',
            'המישור עובר דרך הראשית — נכתוב אותו פרמטרית עם וקטורי הכיוון $\\vec{OA}$ ו-$\\vec{OE}$: $\\;\\vec{X} = r\\,(3,0,0) + s\\,(1,4,0)$.',
            'נחפש וקטור נורמל $\\vec{n} = (a,b,c)$ הניצב לשני וקטורי הכיוון:',
            '$\\begin{cases} (a,b,c)\\cdot(3,0,0) = 0 \\\\ (a,b,c)\\cdot(1,4,0) = 0 \\end{cases} \\;\\Rightarrow\\; \\begin{cases} 3a = 0 \\\\ a + 4b = 0 \\end{cases} \\;\\Rightarrow\\; a = 0\\,,\\; b = 0$',
            'נבחר $c = 1$, אז $\\vec{n} = (0,0,1)$. המישור עובר דרך $O$:',
            '$0\\cdot x + 0\\cdot y + 1\\cdot z = 0 \\;\\Rightarrow\\; z = 0$',
          ],
          final_answer: 'משוואת המישור $AOE$ היא $\\;z = 0$.',
        },
      },
      {
        label: 'ד',
        prompt: 'מצא את נפח הפירמידה $FAOE$.',
        answer_type: 'number',
        hints: [
          'הבסיס $AOE$ נמצא במישור $z = 0$. חשב את שטחו דרך הזווית: $\\;S = \\tfrac{1}{2}\\,|\\vec{OA}|\\,|\\vec{OE}|\\,\\sin(\\angle AOE)$.',
          'הגובה הוא המרחק מ-$F$ אל מישור הבסיס $z = 0$, כלומר $|z_F|$. נפח $= \\tfrac{1}{3}\\,S\\cdot h$.',
        ],
        solution: {
          steps: [
            'הבסיס הוא המשולש $AOE$ במישור $z = 0$. נחשב את שטחו דרך הזווית $\\angle AOE$.',
            '$|\\vec{OA}| = 3$',
            '$|\\vec{OE}| = \\sqrt{1^2 + 4^2} = \\sqrt{17}$',
            '$\\cos(\\angle AOE) = \\dfrac{\\vec{OA}\\cdot\\vec{OE}}{|\\vec{OA}|\\,|\\vec{OE}|} = \\dfrac{(3,0,0)\\cdot(1,4,0)}{3\\sqrt{17}} = \\dfrac{3}{3\\sqrt{17}} = \\dfrac{1}{\\sqrt{17}}$',
            '$\\sin(\\angle AOE) = \\sqrt{1 - \\tfrac{1}{17}} = \\dfrac{4}{\\sqrt{17}} \\quad (\\angle AOE \\approx 75.96°)$',
            '$S_{AOE} = \\tfrac{1}{2}\\,|\\vec{OA}|\\,|\\vec{OE}|\\,\\sin(\\angle AOE) = \\tfrac{1}{2}\\cdot 3\\cdot\\sqrt{17}\\cdot\\dfrac{4}{\\sqrt{17}} = 6$',
            'הגובה: המרחק מ-$F = \\bigl(\\tfrac{3}{4},3,3\\bigr)$ אל מישור הבסיס $z = 0$ הוא $\\;d = |z_F| = 3$.',
            '$V_{FAOE} = \\dfrac{S_{AOE}\\cdot d}{3} = \\dfrac{6\\cdot 3}{3} = 6$',
          ],
          final_answer: 'נפח הפירמידה $\\;V_{FAOE} = 6$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q3 — מספרים מרוכבים: משוואה ביקוודרטית + פרמטרים
  // ===========================================================================
  {
    id: 'b2021s582b-q3',
    year: 2021,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 33,
    context: [
      '(קיץ תשפ"א, מועד ב\') נתונה משוואה (I): $\\;z^4 - 2z^2 + 4 = 0$ ($z$ מספר מרוכב).',
      'בהמשך נתונה משוואה (II): $\\;(a z^2 + b)(z + 1) = 0$, כאשר $a$ ו-$b$ ממשיים שונים מאפס.',
    ].join('\n'),
    parts: [
      {
        label: 'א',
        prompt: 'פתור את משוואה (I): $\\;z^4 - 2z^2 + 4 = 0$. רשום את הפתרונות בהצגה אלגברית.',
        answer_type: 'expression',
        hints: [
          'הצב $\\;t = z^2\\;$ וקבל משוואה ריבועית $\\;t^2 - 2t + 4 = 0$. פתור ל-$t$.',
          'לכל ערך של $t$ הצב $\\;z = x + yi\\;$ והשווה חלק ממשי וחלק מדומה.',
        ],
        solution: {
          steps: [
            'נציב $\\;t = z^2$: $\\;t^2 - 2t + 4 = 0$.',
            '$t_{1,2} = \\dfrac{2 \\pm \\sqrt{(-2)^2 - 4\\cdot 4}}{2} = \\dfrac{2 \\pm \\sqrt{-12}}{2} = 1 \\pm \\sqrt{3}\\,i$',
            'נחזור להצבה. ענף ראשון: $\\;z^2 = 1 + \\sqrt{3}\\,i$. נכתוב $z = x + yi$:',
            '$(x + yi)^2 = x^2 - y^2 + 2xyi = 1 + \\sqrt{3}\\,i \\;\\Rightarrow\\; \\begin{cases} x^2 - y^2 = 1 \\\\ 2xy = \\sqrt{3} \\end{cases}$',
            'מהמשוואה השנייה: $\\;y = \\dfrac{\\sqrt{3}}{2x}$. נציב בראשונה: $\\;x^2 - \\dfrac{3}{4x^2} = 1$.',
            'נכפול ב-$4x^2$: $\\;4x^4 - 4x^2 - 3 = 0$.',
            'נציב $\\;x^2 = u$: $\\;4u^2 - 4u - 3 = 0 \\;\\Rightarrow\\; u = \\dfrac{4 \\pm \\sqrt{16 + 48}}{8} = \\dfrac{4 \\pm 8}{8}$.',
            '$x^2 = \\dfrac{3}{2}\\;$ או $\\;x^2 = -\\dfrac{1}{2}$. מכיוון ש-$x$ ממשי, נפסל $\\;x^2 = -\\dfrac{1}{2}$.',
            '$x = \\pm\\sqrt{\\dfrac{3}{2}}$, ו-$\\;y = \\dfrac{\\sqrt{3}}{2x}$ נותן $\\;y = \\pm\\dfrac{\\sqrt{2}}{2}$ (באותו סימן כמו $x$).',
            'שני שורשים מענף זה: $\\;z = \\sqrt{\\tfrac{3}{2}} + \\tfrac{\\sqrt{2}}{2}i\\;$ ו-$\\;z = -\\sqrt{\\tfrac{3}{2}} - \\tfrac{\\sqrt{2}}{2}i$.',
            'ענף שני: $\\;z^2 = 1 - \\sqrt{3}\\,i\\;$ (צמוד) נותן $\\;2xy = -\\sqrt{3}$, כלומר $x$ ו-$y$ בסימנים מנוגדים.',
            'עוד שני שורשים: $\\;z = \\sqrt{\\tfrac{3}{2}} - \\tfrac{\\sqrt{2}}{2}i\\;$ ו-$\\;z = -\\sqrt{\\tfrac{3}{2}} + \\tfrac{\\sqrt{2}}{2}i$.',
          ],
          final_answer:
            'ארבעה שורשים: $\\;z = \\pm\\sqrt{\\tfrac{3}{2}} \\pm \\tfrac{\\sqrt{2}}{2}i\\;$ (כל ארבעת צירופי הסימנים). $\\;\\sqrt{\\tfrac{3}{2}} = \\tfrac{\\sqrt{6}}{2}$, ולכל שורש $|z| = \\sqrt{2}$.',
        },
      },
      {
        label: 'ב',
        prompt:
          'ארבעת הפתרונות של משוואה (I) מיוצגים על ידי קודקודי מצולע במישור גאוס. מצא את שטח המצולע.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 230 185',
            svg: `
              <line x1="12" y1="92" x2="222" y2="92" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="115" y1="10" x2="115" y2="178" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="214" y="88" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">Re</text>
              <text x="119" y="18" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">Im</text>
              <polygon points="161.5,64 68.5,64 68.5,120 161.5,120" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <circle cx="161.5" cy="64" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="68.5" cy="64" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="68.5" cy="120" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="161.5" cy="120" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="150" y="56" fill="#f1f5f9" font-size="8.5" font-family="Heebo, sans-serif">(√(3/2), √2/2)</text>
              <text x="6" y="56" fill="#f1f5f9" font-size="8.5" font-family="Heebo, sans-serif">(-√(3/2), √2/2)</text>
              <text x="6" y="136" fill="#f1f5f9" font-size="8.5" font-family="Heebo, sans-serif">(-√(3/2), -√2/2)</text>
              <text x="150" y="136" fill="#f1f5f9" font-size="8.5" font-family="Heebo, sans-serif">(√(3/2), -√2/2)</text>
            `,
            caption: 'ארבעת השורשים $\\bigl(\\pm\\sqrt{\\tfrac{3}{2}},\\,\\pm\\tfrac{\\sqrt{2}}{2}\\bigr)$ במישור גאוס — מלבן ברוחב $\\sqrt{6} = 2\\sqrt{\\tfrac{3}{2}}$ וגובה $\\sqrt{2}$.',
          },
        ],
        hints: [
          'סמן את ארבע הנקודות $\\;\\bigl(\\pm\\sqrt{\\tfrac{3}{2}},\\,\\pm\\tfrac{\\sqrt{2}}{2}\\bigr)$ — הן סימטריות לשני הצירים.',
          'הן יוצרות מלבן. שטח $=$ רוחב $\\times$ גובה.',
        ],
        solution: {
          steps: [
            'ארבע הנקודות: $\\;\\bigl(\\sqrt{\\tfrac{3}{2}},\\,\\tfrac{\\sqrt{2}}{2}\\bigr)$, $\\bigl(-\\sqrt{\\tfrac{3}{2}},\\,\\tfrac{\\sqrt{2}}{2}\\bigr)$, $\\bigl(-\\sqrt{\\tfrac{3}{2}},\\,-\\tfrac{\\sqrt{2}}{2}\\bigr)$, $\\bigl(\\sqrt{\\tfrac{3}{2}},\\,-\\tfrac{\\sqrt{2}}{2}\\bigr)$.',
            'הן סימטריות לשני הצירים וצלעותיהן מקבילות לצירים — לכן המצולע הוא מלבן.',
            'רוחב (כיוון ממשי): $\\;2\\sqrt{\\tfrac{3}{2}}$. גובה (כיוון מדומה): $\\;2\\cdot\\tfrac{\\sqrt{2}}{2} = \\sqrt{2}$.',
            '$S = 2\\sqrt{\\tfrac{3}{2}}\\cdot\\sqrt{2} = 2\\sqrt{\\tfrac{3}{2}\\cdot 2} = 2\\sqrt{3}$',
          ],
          final_answer: 'המצולע הוא מלבן ושטחו $\\;S = 2\\sqrt{3}$.',
        },
      },
      {
        label: 'ג',
        prompt:
          'נתונה משוואה (II): $\\;(a z^2 + b)(z + 1) = 0$, כאשר $a$ ו-$b$ ממשיים שונים מאפס. ידוע כי שניים מבין פתרונות המשוואה הם מספרים מדומים. הוכח כי $\\;a\\cdot b > 0$.',
        answer_type: 'proof',
        hints: [
          'הפתרונות: $\\;z = -1$ (ממשי), או $\\;az^2 + b = 0 \\Rightarrow z^2 = -\\dfrac{b}{a}$.',
          'פתרון מדומה טהור הוא $\\;z = yi$ (כלומר $x = 0$). הצב $z = x + yi$ ב-$z^2 = -\\dfrac{b}{a}$.',
        ],
        solution: {
          steps: [
            'מהמשוואה $\\;(az^2 + b)(z+1) = 0$: $\\;z = -1$ (ממשי), או $\\;az^2 + b = 0 \\Rightarrow z^2 = -\\dfrac{b}{a}$.',
            'שני הפתרונות המדומים מקיימים $\\;z^2 = -\\dfrac{b}{a}$. נכתוב $z = x + yi$:',
            '$(x + yi)^2 = x^2 - y^2 + 2xyi = -\\dfrac{b}{a}$',
            'הפתרונות מדומים טהורים, כלומר $\\;x = 0$, ולכן: $\\;-y^2 = -\\dfrac{b}{a} \\;\\Rightarrow\\; y^2 = \\dfrac{b}{a}$.',
            '$y$ ממשי ושונה מאפס, לכן $\\;y^2 > 0$, ומכאן $\\;\\dfrac{b}{a} > 0$.',
            'נכפול ב-$a^2 > 0$: $\\;\\dfrac{b}{a}\\cdot a^2 = ab > 0$. $\\;\\blacksquare$',
          ],
          final_answer: 'מאחר ששני הפתרונות מדומים טהורים, $\\;y^2 = \\dfrac{b}{a} > 0$, ולכן $\\;ab > 0$.',
        },
      },
      {
        label: 'ד',
        prompt: 'מצא את שלושת פתרונות משוואה (II). הבע באמצעות $a$ ו-$b$ אם יש צורך.',
        answer_type: 'expression',
        hints: [
          'הפתרון הממשי: $\\;z = -1$.',
          'מ-$z^2 = -\\dfrac{b}{a}$ (עם $\\dfrac{b}{a} > 0$): $\\;z = \\pm\\sqrt{\\dfrac{b}{a}}\\,i$.',
        ],
        solution: {
          steps: [
            'מהגורם $\\;z + 1 = 0$: $\\;z = -1$.',
            'מהגורם $\\;az^2 + b = 0$: $\\;z^2 = -\\dfrac{b}{a}$. מכיוון ש-$\\dfrac{b}{a} > 0$ (סעיף ג), $\\;z^2 < 0$:',
            '$z = \\pm\\sqrt{\\dfrac{b}{a}}\\,i$',
          ],
          final_answer: 'שלושת הפתרונות: $\\;z = -1\\,,\\;\\; z = \\sqrt{\\dfrac{b}{a}}\\,i\\,,\\;\\; z = -\\sqrt{\\dfrac{b}{a}}\\,i$.',
        },
      },
      {
        label: 'ה',
        prompt:
          'ידוע כי הפתרונות המדומים של משוואה (II) מיוצגים על ידי נקודות הנמצאות על מעגל שמרכזו בראשית הצירים, ורדיוסו גדול פי שניים מהערך המוחלט של פתרונות משוואה (I). מצא את היחס $\\;\\dfrac{b}{a}$.',
        answer_type: 'number',
        hints: [
          'מצא קודם את הערך המוחלט של פתרונות משוואה (I): $\\;|z| = \\sqrt{\\tfrac{3}{2} + \\tfrac{1}{2}}$.',
          'הרדיוס גדול פי שניים מזה. השווה אותו ל-$\\;\\bigl|\\pm\\sqrt{\\tfrac{b}{a}}\\,i\\bigr| = \\sqrt{\\tfrac{b}{a}}$.',
        ],
        solution: {
          steps: [
            'הערך המוחלט של פתרונות משוואה (I): $\\;|z| = \\Bigl|\\sqrt{\\tfrac{3}{2}} + \\tfrac{\\sqrt{2}}{2}i\\Bigr| = \\sqrt{\\tfrac{3}{2} + \\tfrac{1}{2}} = \\sqrt{2}$.',
            'הרדיוס גדול פי שניים: $\\;R = 2\\sqrt{2}$. הפתרונות המדומים של (II) הם $\\;(0,\\,\\pm 2\\sqrt{2})$.',
            'הערך המוחלט של פתרון מדומה של (II): $\\;\\bigl|\\pm\\sqrt{\\tfrac{b}{a}}\\,i\\bigr| = \\sqrt{\\dfrac{b}{a}}$.',
            'נשווה לרדיוס: $\\;\\sqrt{\\dfrac{b}{a}} = 2\\sqrt{2}$.',
            'נעלה בריבוע: $\\;\\dfrac{b}{a} = (2\\sqrt{2})^2 = 8$.',
          ],
          final_answer: '$\\dfrac{b}{a} = 8$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q4 — פונקציות מעריכיות: חקירת $f(x) = e^{bx^2 - 2bx} - 1$ והזזתה
  // ===========================================================================
  {
    id: 'b2021s582b-q4',
    year: 2021,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 4,
    topic: 'פונקציה מעריכית',
    totalPoints: 33,
    context:
      '(קיץ תשפ"א, מועד ב\') נתונה הפונקציה $\\;f(x) = e^{bx^2 - 2bx} - 1$, המוגדרת לכל $x$, כאשר $b < 0$ פרמטר. הבע את תשובותיך באמצעות $b$ אם יש צורך.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצא את שיעורי נקודות החיתוך של גרף $f$ עם הצירים.',
        answer_type: 'expression',
        hints: [
          'חיתוך עם ציר $y$: הצב $x = 0$. חיתוך עם ציר $x$: פתור $f(x) = 0$.',
          '$f(x) = 0 \\Rightarrow e^{bx^2 - 2bx} = e^0 \\Rightarrow bx^2 - 2bx = 0$. חלק ב-$b$ ($b \\ne 0$).',
        ],
        solution: {
          steps: [
            'חיתוך עם ציר $y$: $\\;f(0) = e^{0} - 1 = 0 \\;\\Rightarrow\\; (0,\\,0)$.',
            'חיתוך עם ציר $x$: $\\;e^{bx^2 - 2bx} - 1 = 0 \\;\\Rightarrow\\; e^{bx^2 - 2bx} = e^{0}$.',
            '$bx^2 - 2bx = 0 \\;\\;|\\,:b \\;\\Rightarrow\\; x^2 - 2x = 0$.',
            '$x(x - 2) = 0 \\;\\Rightarrow\\; x = 0 \\;,\\;\\; x = 2$.',
          ],
          final_answer: 'חיתוך עם ציר $y$: $\\;(0,0)$. חיתוך עם ציר $x$: $\\;(0,0)$ ו-$(2,0)$.',
        },
      },
      {
        label: 'א2',
        prompt: 'מצא את האסימפטוטות של $f$ המקבילות לציר ה-$x$ (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          'בדוק את הגבולות $\\;\\lim_{x\\to\\pm\\infty} f(x)$. שים לב ש-$b < 0$.',
          'במעריך $b(x^2 - 2x)$: כאשר $x\\to\\pm\\infty$ ו-$b<0$, המעריך שואף ל-$-\\infty$, ולכן $e^{(\\cdots)} \\to 0$.',
        ],
        solution: {
          steps: [
            'נכתוב את המעריך כ-$\\;b(x^2 - 2x)$ ונבדוק את הגבולות.',
            '$\\lim_{x\\to\\infty} \\bigl(e^{b(x^2 - 2x)} - 1\\bigr) = e^{-\\infty} - 1 = 0 - 1 = -1$ (כי $b<0$, המעריך $\\to -\\infty$).',
            '$\\lim_{x\\to-\\infty} \\bigl(e^{b(x^2 - 2x)} - 1\\bigr) = e^{-\\infty} - 1 = -1$.',
          ],
          final_answer: 'אסימפטוטה אופקית אחת: $\\;y = -1$.',
        },
      },
      {
        label: 'א3',
        prompt: 'מצא את שיעורי נקודת הקיצון של $f$ וקבע את סוגה.',
        answer_type: 'expression',
        hints: [
          'גזור: $\\;f^{\\prime}(x) = e^{bx^2 - 2bx}\\,(2bx - 2b)$. האקספוננט תמיד חיובי.',
          'אפס את הגורם $2bx - 2b$, ובדוק את סימן $f^{\\prime}$ משני צדי הנקודה (זכור $b<0$).',
        ],
        solution: {
          steps: [
            'נגזרת: $\\;f^{\\prime}(x) = e^{bx^2 - 2bx}\\cdot(2bx - 2b)$.',
            'האקספוננט לעולם אינו מתאפס, לכן $\\;2bx - 2b = 0 \\;\\;|\\,:2b \\;\\Rightarrow\\; x = 1$.',
            'בדיקת סימן (האקספוננט חיובי, נבדוק את $2bx - 2b$): $\\;f^{\\prime}(\\tfrac{1}{2}) = b - 2b = -b > 0$, $\\;f^{\\prime}(2) = 4b - 2b = 2b < 0$.',
            '$\\begin{array}{c|c|c|c} x & x<1 & 1 & x>1 \\\\ \\hline f^{\\prime}(x) & + & 0 & - \\\\ f(x) & \\nearrow & & \\searrow \\end{array}$',
            'עולה לפני $x=1$ ויורדת אחריו $\\Rightarrow$ מקסימום. ערך הקיצון: $\\;f(1) = e^{b - 2b} - 1 = e^{-b} - 1$ (חיובי כי $b<0 \\Rightarrow e^{-b} > 1$).',
          ],
          final_answer: 'מקסימום בנקודה $\\;\\bigl(1,\\;e^{-b} - 1\\bigr)$.',
        },
      },
      {
        label: 'א4',
        prompt: 'סרטט סקיצה של גרף הפונקציה $f$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-2, 4],
            yRange: [-1.4, 1.2],
            curves: [{ fn: (x) => Math.exp(-0.5 * (x * x - 2 * x)) - 1 }],
            hAsymptotes: [{ y: -1, label: 'y=-1' }],
            markedPoints: [
              { x: 0, y: 0, label: '' },
              { x: 2, y: 0, label: '' },
              { x: 1, y: Math.exp(0.5) - 1, label: 'מקס' },
            ],
            caption: 'סקיצה של $f$ (הדגמה עם $b=-\\tfrac{1}{2}$): "פעמון" עם מקסימום $(1,\\,e^{-b}-1)$, חיתוכים $(0,0)$ ו-$(2,0)$, ואסימפטוטה $y=-1$.',
          },
        ],
        hints: [
          'שלב את הממצאים: חיתוכים $(0,0),(2,0)$, מקסימום $(1,e^{-b}-1)$, ואסימפטוטה $y=-1$.',
        ],
        solution: {
          steps: [
            'הגרף עולה מן האסימפטוטה $y=-1$ (משמאל), עובר ב-$(0,0)$, מגיע למקסימום $\\;(1,\\,e^{-b}-1)$, יורד דרך $(2,0)$, ושואף שוב ל-$y=-1$ (מימין).',
          ],
          final_answer: 'ראה סקיצה: "פעמון" עם מקסימום $(1,\\,e^{-b}-1)$, חיתוכים $(0,0),(2,0)$, ואסימפטוטה $y=-1$.',
        },
      },
      {
        label: 'ב1',
        prompt: [
          'מגדירים $\\;g(x) = f(x + a)$, כאשר $a$ פרמטר. נתון כי לפונקציה $g$ יש נקודת קיצון על ציר ה-$y$.',
          'מצא את $a$, ובטא את $g(x)$ באמצעות $x$ ו-$b$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'הקיצון של $f$ ב-$x=1$, לכן הקיצון של $g(x)=f(x+a)$ הוא ב-$x+a=1$, כלומר $x=1-a$.',
          'קיצון על ציר $y$ פירושו $x=0$. אחרי שתמצא $a$, הצב $x+1$ במקום $x$ ב-$f$ ופשט.',
        ],
        solution: {
          steps: [
            'הקיצון של $f$ ב-$x=1$, ולכן הקיצון של $g(x)=f(x+a)$ הוא ב-$\\;x + a = 1$, כלומר $\\;x = 1 - a$.',
            'הקיצון על ציר $y$, כלומר $\\;x = 0$: $\\;1 - a = 0 \\;\\Rightarrow\\; a = 1$.',
            '$g(x) = f(x+1) = e^{b(x+1)^2 - 2b(x+1)} - 1$.',
            'המעריך: $\\;b\\bigl[(x+1)^2 - 2(x+1)\\bigr] = b(x+1)(x-1) = b(x^2 - 1)$.',
            '$g(x) = e^{b(x^2 - 1)} - 1$.',
          ],
          final_answer: '$a = 1$, ו-$\\;g(x) = e^{b(x^2 - 1)} - 1$.',
        },
      },
      {
        label: 'ב2',
        prompt: 'קבע אם $g$ זוגית, אי-זוגית, או לא זוגית ולא אי-זוגית. נמק.',
        answer_type: 'proof',
        hints: [
          'בדוק את $g(-x)$: זוגית אם $g(-x)=g(x)$, אי-זוגית אם $g(-x)=-g(x)$.',
          'הצב $-x$ במקום $x$ ב-$g(x) = e^{b(x^2-1)} - 1$.',
        ],
        solution: {
          steps: [
            '$g(-x) = e^{b((-x)^2 - 1)} - 1 = e^{b(x^2 - 1)} - 1 = g(x)$.',
            'מתקיים $\\;g(-x) = g(x)\\;$ לכל $x$.',
          ],
          final_answer: 'הפונקציה $g$ זוגית (סימטרית ביחס לציר ה-$y$).',
        },
      },
      {
        label: 'ב3',
        prompt: 'סרטט סקיצה של גרף הפונקציה $g$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-3, 3],
            yRange: [-1.4, 1.2],
            curves: [{ fn: (x) => Math.exp(-0.5 * (x * x - 1)) - 1 }],
            hAsymptotes: [{ y: -1, label: 'y=-1' }],
            markedPoints: [
              { x: -1, y: 0, label: '' },
              { x: 1, y: 0, label: '' },
              { x: 0, y: Math.exp(0.5) - 1, label: 'מקס' },
            ],
            caption: 'סקיצה של $g$ (הדגמה עם $b=-\\tfrac{1}{2}$): זוגי, מקסימום על ציר $y$ ב-$(0,\\,e^{-b}-1)$, חיתוכים $(\\pm1,0)$, אסימפטוטה $y=-1$.',
          },
        ],
        hints: [
          'מקסימום $(0,\\,g(0))$, חיתוך עם ציר $x$ ב-$g(x)=0$, אסימפטוטה $y=-1$, וזוגי (סימטרי לציר $y$).',
        ],
        solution: {
          steps: [
            'מקסימום על ציר $y$: $\\;g(0) = e^{-b} - 1$, בנקודה $\\;(0,\\,e^{-b}-1)$.',
            'חיתוך עם ציר $x$: $\\;b(x^2 - 1) = 0 \\;\\Rightarrow\\; x = \\pm 1$, כלומר $(\\pm 1,\\,0)$.',
            'אסימפטוטה אופקית $\\;y = -1$, והגרף סימטרי ביחס לציר $y$.',
          ],
          final_answer: 'ראה סקיצה: "פעמון" סימטרי, מקסימום $(0,\\,e^{-b}-1)$, חיתוכים $(\\pm1,0)$, אסימפטוטה $y=-1$.',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את שיעור ה-$x$ של כל אחת מנקודות הקיצון של פונקציית הנגזרת $\\;g^{\\prime}(x)$, וקבע את סוגן.',
        answer_type: 'expression',
        hints: [
          'נקודות הקיצון של $g^{\\prime}$ הן היכן ש-$\\;g^{\\prime\\prime}(x) = 0$. גזור: $\\;g^{\\prime}(x) = 2bx\\,e^{b(x^2-1)}$.',
          'גזור שוב (כלל המכפלה), הוצא גורם משותף, וקבע סוג לפי שינוי הסימן של $g^{\\prime\\prime}$.',
        ],
        solution: {
          steps: [
            'נגזרת ראשונה: $\\;g^{\\prime}(x) = 2bx\\,e^{b(x^2 - 1)}$.',
            'נגזרת שנייה (כלל המכפלה): $\\;g^{\\prime\\prime}(x) = 2b\\,e^{b(x^2-1)} + 2bx\\cdot 2bx\\,e^{b(x^2-1)} = e^{b(x^2-1)}\\bigl(2b + 4b^2x^2\\bigr)$.',
            'הקיצון של $g^{\\prime}$ היכן ש-$g^{\\prime\\prime}=0$. האקספוננט חיובי, לכן $\\;2b + 4b^2x^2 = 0$.',
            '$4b^2x^2 = -2b \\;\\Rightarrow\\; x^2 = -\\dfrac{2b}{4b^2} = -\\dfrac{1}{2b}$ (חיובי כי $b<0$).',
            'נסמן $\\;x_0 = \\sqrt{-\\dfrac{1}{2b}}$, אז הקיצון ב-$\\;x = \\pm x_0$.',
            '$\\begin{array}{c|c|c|c|c|c} x & x<-x_0 & -x_0 & (-x_0,\\,x_0) & x_0 & x>x_0 \\\\ \\hline g^{\\prime\\prime}(x) & + & 0 & - & 0 & + \\\\ g^{\\prime}(x) & \\nearrow & & \\searrow & & \\nearrow \\end{array}$',
            'ב-$x=-x_0$ הנגזרת $g^{\\prime}$ עולה ואז יורדת $\\Rightarrow$ מקסימום; ב-$x=+x_0$ היא יורדת ואז עולה $\\Rightarrow$ מינימום.',
          ],
          final_answer: 'נקודות הקיצון של $g^{\\prime}$ ב-$\\;x = \\pm\\sqrt{-\\dfrac{1}{2b}}$: ב-$\\;x=-\\sqrt{-\\tfrac{1}{2b}}$ מקסימום, וב-$\\;x=+\\sqrt{-\\tfrac{1}{2b}}$ מינימום.',
        },
      },
      {
        label: 'ד',
        prompt:
          'הצב $\\;b = -\\tfrac{1}{2}$, וחשב את השטח המוגבל על ידי גרף הנגזרת $\\;g^{\\prime}(x)$, ציר ה-$x$, והישרים העוברים דרך נקודות הקיצון של $\\;g^{\\prime}(x)$ ומאונכים לציר ה-$x$.',
        answer_type: 'number',
        hints: [
          'עם $b=-\\tfrac12$, נקודות הקיצון של $g^{\\prime}$ הן ב-$\\;x = \\pm\\sqrt{-\\frac{1}{2b}} = \\pm 1$ — אלו גבולות האינטגרציה.',
          '$g^{\\prime}(x) = -x\\,e^{-\\frac12(x^2-1)}$ אי-זוגית; השטח $= 2\\int_0^1 |g^{\\prime}|\\,dx$, ו-$\\int g^{\\prime}\\,dx = g$.',
        ],
        solution: {
          steps: [
            'עם $\\;b = -\\tfrac{1}{2}$: נקודות הקיצון של $g^{\\prime}$ ב-$\\;x = \\pm\\sqrt{-\\dfrac{1}{2\\cdot(-\\frac12)}} = \\pm\\sqrt{1} = \\pm 1$. אלו הישרים $x=-1$ ו-$x=1$.',
            '$g^{\\prime}(x) = 2bx\\,e^{b(x^2-1)} = -x\\,e^{-\\frac{1}{2}(x^2 - 1)}$.',
            '$g^{\\prime}$ אי-זוגית: בתחום $[-1,0]$ חיובית ובתחום $[0,1]$ שלילית — שני החצאים שווים בשטח.',
            'השטח $= 2\\displaystyle\\int_0^1 \\bigl(-g^{\\prime}(x)\\bigr)\\,dx = -2\\Bigl[\\,g(x)\\,\\Bigr]_0^1 = -2\\bigl(g(1) - g(0)\\bigr)$.',
            '$g(1) = e^{-\\frac12(1-1)} - 1 = e^0 - 1 = 0$, $\\;\\;g(0) = e^{-\\frac12(0-1)} - 1 = e^{\\frac12} - 1 = \\sqrt{e} - 1$.',
            'השטח $= -2\\bigl(0 - (\\sqrt{e} - 1)\\bigr) = 2(\\sqrt{e} - 1) \\approx 1.297$.',
          ],
          final_answer: 'השטח $= 2(\\sqrt{e} - 1) \\approx 1.297$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q5 — פונקציית ln: חקירת $g(x) = \ln(ax^2 - x^3)$
  // ===========================================================================
  {
    id: 'b2021s582b-q5',
    year: 2021,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 5,
    topic: 'פונקציית ln',
    totalPoints: 33,
    context:
      '(קיץ תשפ"א, מועד ב\') נתונה הפונקציה $\\;f(x) = ax^2 - x^3$, כאשר $a > 0$ פרמטר. בסעיפים ב–ג נגדיר $\\;g(x) = \\ln\\bigl(f(x)\\bigr)$.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצא את תחומי החיוביות והשליליות של $f$ ואת נקודות החיתוך שלה עם ציר ה-$x$ (בעזרת $a$).',
        answer_type: 'expression',
        hints: [
          'הוצא גורם משותף: $f(x) = x^2(a - x)$.',
          '$x^2 \\ge 0$ תמיד, לכן הסימן של $f$ נקבע בעיקר על-ידי הגורם $(a - x)$.',
        ],
        solution: {
          steps: [
            '$f(x) = x^2(a - x)$. אפסים: $\\;x = 0$ (כפול) ו-$x = a$.',
            '$x^2 > 0$ עבור $x \\ne 0$, לכן הסימן נקבע לפי $(a - x)$:',
            'חיובי כאשר $a - x > 0$, כלומר $x < a$ (פרט ל-$x=0$): התחום $(-\\infty,0)\\cup(0,a)$.',
            'שלילי כאשר $x > a$: התחום $(a,\\infty)$.',
          ],
          final_answer:
            'אפסים ב-$x=0$ ו-$x=a$; חיובית ב-$(-\\infty,0)\\cup(0,a)$, שלילית ב-$(a,\\infty)$.',
        },
      },
      {
        label: 'א2',
        prompt: 'מצא את נקודות הקיצון של $f$, קבע את סוגן, ותאר את צורת הגרף (בעזרת $a$).',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-1.5, 3.5],
            yRange: [-2, 5],
            curves: [{ fn: (x) => 3 * x * x - x * x * x }],
            markedPoints: [
              { x: 0, y: 0, label: 'מין' },
              { x: 2, y: 4, label: 'מקס' },
            ],
            caption: 'צורת הגרף של $f$ (לדוגמה $a=3$): מינימום ב-$(0,0)$, מקסימום ב-$\\bigl(\\tfrac{2a}{3},\\tfrac{4a^3}{27}\\bigr)$.',
          },
        ],
        hints: [
          'גזור: $f\\,\'(x) = 2ax - 3x^2 = x(2a - 3x)$.',
          'אפסי הנגזרת: $x = 0$ ו-$x = \\tfrac{2a}{3}$. בדוק את סימן הנגזרת מסביב לכל אחד.',
        ],
        solution: {
          steps: [
            'נגזרת: $\\;f\\,\'(x) = 2ax - 3x^2 = x(2a - 3x)$. אפסים: $x = 0$ ו-$x = \\tfrac{2a}{3}$.',
            'בדיקת סימן ($a>0$): שלילית ל-$x<0$, חיובית בין $0$ ל-$\\tfrac{2a}{3}$, שלילית מעבר — לכן $x=0$ מינימום ו-$x=\\tfrac{2a}{3}$ מקסימום.',
            'ערכי הקיצון: $\\;f(0) = 0$; $\\;f\\bigl(\\tfrac{2a}{3}\\bigr) = a\\cdot\\tfrac{4a^2}{9} - \\tfrac{8a^3}{27} = \\tfrac{12a^3 - 8a^3}{27} = \\tfrac{4a^3}{27}$.',
          ],
          final_answer:
            'מינימום $(0,0)$, מקסימום $\\bigl(\\tfrac{2a}{3},\\,\\tfrac{4a^3}{27}\\bigr)$.',
        },
      },
      {
        label: 'ב1',
        prompt: 'מצא את תחום ההגדרה של $\\;g(x) = \\ln(ax^2 - x^3)$ (בעזרת $a$).',
        answer_type: 'expression',
        hints: [
          'ln מוגדר רק עבור ארגומנט חיובי: $f(x) > 0$.',
          'השתמש בתחום החיוביות שמצאת בסעיף א1.',
        ],
        solution: {
          steps: [
            '$g$ מוגדרת כאשר $f(x) > 0$.',
            'מסעיף א1: $f(x) > 0$ ב-$(-\\infty,0)\\cup(0,a)$.',
          ],
          final_answer: 'תחום ההגדרה: $\\;(-\\infty,0)\\cup(0,a)$.',
        },
      },
      {
        label: 'ב2',
        prompt: 'מצא את האסימפטוטות האנכיות של $g$.',
        answer_type: 'expression',
        hints: [
          'אסימפטוטה אנכית של $\\ln(f)$ מופיעה היכן ש-$f \\to 0^+$.',
          'אלו אפסי $f$ שעל שפת תחום ההגדרה: $x=0$ ו-$x=a$.',
        ],
        solution: {
          steps: [
            'כאשר $f(x) \\to 0^+$ מתקיים $\\ln(f) \\to -\\infty$.',
            '$f \\to 0^+$ כש-$x \\to 0$ (מימין ומשמאל, כי $f>0$ משני הצדדים) וכש-$x \\to a^-$.',
          ],
          final_answer: 'אסימפטוטות אנכיות: $\\;x = 0$ ו-$x = a$.',
        },
      },
      {
        label: 'ב3',
        prompt: 'מצא את נקודת המקסימום של $g$ (בעזרת $a$).',
        answer_type: 'expression',
        hints: [
          'ln היא פונקציה עולה, לכן $g = \\ln(f)$ מקבלת מקסימום היכן ש-$f$ מקסימלית בתוך תחום ההגדרה.',
          'המקסימום של $f$ בתוך $(0,a)$ הוא ב-$x = \\tfrac{2a}{3}$ (מסעיף א2).',
        ],
        solution: {
          steps: [
            'ln עולה, לכן $g$ מקסימלית במקום שבו $f$ מקסימלית בתחום ההגדרה — בנקודה $x = \\tfrac{2a}{3}$.',
            'ערך: $\\;g\\bigl(\\tfrac{2a}{3}\\bigr) = \\ln\\!\\bigl(\\tfrac{4a^3}{27}\\bigr)$.',
          ],
          final_answer: 'מקסימום בנקודה $\\bigl(\\tfrac{2a}{3},\\;\\ln\\tfrac{4a^3}{27}\\bigr)$.',
        },
      },
      {
        label: 'ג1',
        prompt: 'תאר את צורת הגרף של $g$ (ציין אסימפטוטות אנכיות ומקסימום).',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-1.2, 3.2],
            yRange: [-3, 2],
            curves: [
              {
                fn: (x) => {
                  const f = 3 * x * x - x * x * x;
                  return f > 0 ? Math.log(f) : NaN;
                },
                domain: [-1.2, 2.99],
              },
            ],
            vAsymptotes: [
              { x: 0, label: 'x=0' },
              { x: 3, label: 'x=a' },
            ],
            markedPoints: [{ x: 2, y: Math.log(4), label: 'מקס' }],
            caption: 'הגרף של $g=\\ln(f)$ (לדוגמה $a=3$): אסימפטוטות אנכיות $x=0,\\,x=a$, מקסימום ב-$x=\\tfrac{2a}{3}$.',
          },
        ],
        hints: [
          'שתי "מפרצות" נפרדות: אחת מעל $(-\\infty,0)$ ואחת מעל $(0,a)$.',
          'בכל קצה של תחום ההגדרה הגרף צולל ל-$-\\infty$ (אסימפטוטה אנכית).',
        ],
        solution: {
          steps: [
            'תחום ההגדרה מורכב משני חלקים: $(-\\infty,0)$ ו-$(0,a)$.',
            'בחלק $(0,a)$: הגרף עולה מ-$-\\infty$ (ב-$x\\to 0^+$), מגיע למקסימום ב-$x=\\tfrac{2a}{3}$ ($g=\\ln\\tfrac{4a^3}{27}$), ויורד ל-$-\\infty$ (ב-$x\\to a^-$).',
            'בחלק $(-\\infty,0)$: $f$ עולה ל-$+\\infty$ כש-$x\\to-\\infty$ ויורד ל-$0^+$ כש-$x\\to0^-$, לכן $g$ יורדת מ-$+\\infty$ ל-$-\\infty$.',
          ],
          final_answer:
            'שני ענפים: ב-$(0,a)$ — "כיפה" עם מקסימום $\\ln\\tfrac{4a^3}{27}$ ואסימפטוטות $x=0,x=a$; ב-$(-\\infty,0)$ — ענף יורד מ-$+\\infty$ ל-$-\\infty$.',
        },
      },
      {
        label: 'ג2',
        prompt:
          'מצא לאילו ערכים של $a > 0$ למשוואה $\\;g(x) = 0\\;$ יש פתרון יחיד.',
        answer_type: 'expression',
        hints: [
          '$g(x) = 0 \\iff f(x) = 1$. ספור כמה פעמים הגרף של $f$ חוצה את הישר $y=1$ בכל חלק של תחום ההגדרה.',
          'בענף $(-\\infty,0)$ תמיד יש חיתוך אחד. בענף $(0,a)$ מספר החיתוכים תלוי בגובה המקסימום $\\tfrac{4a^3}{27}$ ביחס ל-$1$.',
        ],
        solution: {
          steps: [
            '$g(x) = 0 \\iff f(x) = 1$.',
            'בענף $(-\\infty,0)$: $f$ יורדת ברציפות מ-$+\\infty$ ל-$0$, לכן חוצה את $y=1$ בדיוק פעם אחת — תמיד.',
            'בענף $(0,a)$: $f$ עולה מ-$0$ למקסימום $\\tfrac{4a^3}{27}$ ואז יורדת ל-$0$. אין כאן חיתוך עם $y=1$ אם המקסימום נמוך מ-$1$.',
            'תנאי לפתרון יחיד (אפס חיתוכים בענף $(0,a)$): $\\;\\tfrac{4a^3}{27} < 1 \\Rightarrow a^3 < \\tfrac{27}{4} \\Rightarrow a < \\sqrt[3]{\\tfrac{27}{4}} = \\tfrac{3}{\\sqrt[3]{4}} = \\tfrac{3\\sqrt[3]{2}}{2}$.',
          ],
          final_answer:
            'פתרון יחיד כאשר $\\;0 < a < \\dfrac{3\\sqrt[3]{2}}{2} \\approx 1.89$.',
        },
      },
      {
        label: 'ד',
        prompt:
          'כעת מציבים $a = 0$, כך ש-$f(x) = -x^3$ ו-$g(x) = \\ln(-x^3)$. מצא את תחום ההגדרה של $g$, את האסימפטוטה האנכית, ואת נקודת החיתוך עם ציר ה-$x$.',
        answer_type: 'expression',
        hints: [
          '$-x^3 > 0 \\iff x < 0$. כך נקבע תחום ההגדרה.',
          'אפשר לפשט: $\\ln(-x^3) = 3\\ln(-x)$ עבור $x<0$.',
        ],
        solution: {
          steps: [
            'תחום הגדרה: $\\;-x^3 > 0 \\iff x^3 < 0 \\iff x < 0$.',
            'אסימפטוטה אנכית: כש-$x \\to 0^-$, $\\;-x^3 \\to 0^+$ ולכן $g \\to -\\infty$ — אסימפטוטה $x = 0$.',
            'חיתוך עם ציר $x$: $\\;g(x) = 0 \\iff -x^3 = 1 \\iff x^3 = -1 \\iff x = -1$. נקודה $(-1, 0)$.',
          ],
          final_answer:
            'תחום הגדרה $x<0$; אסימפטוטה אנכית $x=0$; חיתוך עם ציר $x$ ב-$(-1,0)$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
