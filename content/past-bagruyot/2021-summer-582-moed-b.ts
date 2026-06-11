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
      '(קיץ תשפ"א, מועד ב\') נתונה משוואה (I): $\\;z^4 - 2z^2 + 4 = 0$,',
      'וכן משוואה (II): $\\;az^3 + az^2 + bz + b = 0$, כאשר $a$ ו-$b$ ממשיים שונים מאפס.',
    ].join('\n'),
    parts: [
      {
        label: 'א',
        prompt: 'פתור את משוואה (I) $\\;z^4 - 2z^2 + 4 = 0\\;$ מעל המרוכבים. רשום את הפתרונות בהצגה אלגברית.',
        answer_type: 'expression',
        hints: [
          'הצב $w = z^2$ וקבל משוואה ריבועית $w^2 - 2w + 4 = 0$. פתור ל-$w$.',
          'תקבל $w = 1 \\pm i\\sqrt{3} = 2\\,\\text{cis}(\\pm 60°)$. הוצא שורש ריבועי במישור המרוכב: המודול נעשה $\\sqrt{2}$ והזווית מתחלקת ב-2.',
        ],
        solution: {
          steps: [
            'נציב $w = z^2$: $\\;w^2 - 2w + 4 = 0 \\Rightarrow w = \\dfrac{2 \\pm \\sqrt{4 - 16}}{2} = 1 \\pm i\\sqrt{3}$.',
            'בצורה קוטבית: $\\;|w| = \\sqrt{1 + 3} = 2$, $\\;\\arg w = \\pm 60°$, כלומר $w = 2\\,\\text{cis}(\\pm 60°)$.',
            'נוציא שורש: $\\;z = \\sqrt{2}\\,\\text{cis}\\!\\left(\\dfrac{\\pm 60° + 360°k}{2}\\right)$, $\\;k = 0,1$.',
            'מתקבלות הזוויות $30°,\\,150°,\\,210°,\\,330°$ — כולן במודול $\\sqrt{2}$.',
            'בהצגה אלגברית: $\\;\\sqrt{2}\\,\\text{cis}\\,30° = \\dfrac{\\sqrt{6}}{2} + \\dfrac{\\sqrt{2}}{2}i$, וכן כל ארבעת צירופי הסימנים.',
          ],
          final_answer:
            'ארבעה פתרונות: $\\;z = \\pm\\dfrac{\\sqrt{6}}{2} \\pm \\dfrac{\\sqrt{2}}{2}i\\;$ (כל ארבעת צירופי הסימנים).',
        },
      },
      {
        label: 'ב',
        prompt:
          'ארבעת הפתרונות של משוואה (I) מסומנים במישור המרוכב. הוכח שהם יוצרים מלבן, וחשב את שטחו.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="12" y1="100" x2="188" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="12" x2="100" y2="188" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="178" y="96" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Im</text>
              <polygon points="161,65 39,65 39,135 161,135" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <circle cx="161" cy="65" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="39" cy="65" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="39" cy="135" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="161" cy="135" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="165" y="60" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">z₁</text>
              <text x="26" y="60" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">z₂</text>
              <text x="26" y="148" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">z₃</text>
              <text x="165" y="148" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">z₄</text>
            `,
            caption: 'ארבעת הפתרונות סימטריים ביחס לשני הצירים — מלבן ברוחב $\\sqrt{6}$ וגובה $\\sqrt{2}$.',
          },
        ],
        hints: [
          'הפתרונות הם $\\pm\\dfrac{\\sqrt{6}}{2} \\pm \\dfrac{\\sqrt{2}}{2}i$ — סימטריים ביחס לציר הממשי וביחס לציר המדומה.',
          'ארבע נקודות הסימטריות לשני הצירים יוצרות מלבן. רוחב = הפרש החלקים הממשיים, גובה = הפרש החלקים המדומים.',
        ],
        solution: {
          steps: [
            'הנקודות: $\\;\\bigl(\\tfrac{\\sqrt{6}}{2},\\,\\tfrac{\\sqrt{2}}{2}\\bigr)$, $\\bigl(-\\tfrac{\\sqrt{6}}{2},\\,\\tfrac{\\sqrt{2}}{2}\\bigr)$, $\\bigl(-\\tfrac{\\sqrt{6}}{2},\\,-\\tfrac{\\sqrt{2}}{2}\\bigr)$, $\\bigl(\\tfrac{\\sqrt{6}}{2},\\,-\\tfrac{\\sqrt{2}}{2}\\bigr)$.',
            'הצלעות מקבילות לצירים (אופקיות ואנכיות), והזוויות ישרות — לכן זה מלבן.',
            'רוחב (כיוון ממשי): $\\;\\tfrac{\\sqrt{6}}{2} - (-\\tfrac{\\sqrt{6}}{2}) = \\sqrt{6}$.',
            'גובה (כיוון מדומה): $\\;\\tfrac{\\sqrt{2}}{2} - (-\\tfrac{\\sqrt{2}}{2}) = \\sqrt{2}$.',
            'שטח: $\\;S = \\sqrt{6}\\cdot\\sqrt{2} = \\sqrt{12} = 2\\sqrt{3}$.',
          ],
          final_answer: 'מלבן ברוחב $\\sqrt{6}$ וגובה $\\sqrt{2}$; שטחו $S = 2\\sqrt{3}$.',
        },
      },
      {
        label: 'ג',
        prompt:
          'הוכח כי לשני הפתרונות הלא-ממשיים של משוואה (II) ($az^3 + az^2 + bz + b = 0$) יש חלק ממשי אפס (כלומר הם מדומים טהורים) אם ורק אם $\\;ab > 0$.',
        answer_type: 'proof',
        hints: [
          'פרק לגורמים בקיבוץ: $\\;az^2(z+1) + b(z+1) = (z+1)(az^2 + b)$.',
          'הפתרון $z = -1$ ממשי. שני האחרים מקיימים $z^2 = -\\dfrac{b}{a}$ — מתי הם מדומים טהורים?',
        ],
        solution: {
          steps: [
            'נקבץ: $\\;az^3 + az^2 + bz + b = az^2(z+1) + b(z+1) = (z+1)(az^2 + b)$.',
            'הפתרונות: $\\;z = -1$ (ממשי), או $\\;az^2 + b = 0 \\Rightarrow z^2 = -\\dfrac{b}{a}$.',
            '$z$ מדומה טהור ($z = \\pm i\\beta$) $\\iff z^2 = -\\beta^2 < 0 \\iff -\\dfrac{b}{a} < 0 \\iff \\dfrac{b}{a} > 0$.',
            '$\\dfrac{b}{a} > 0 \\iff a$ ו-$b$ באותו סימן $\\iff ab > 0$. ⬛',
          ],
          final_answer: 'הוכח: הפתרונות הלא-ממשיים מדומים טהורים $\\iff ab > 0$.',
        },
      },
      {
        label: 'ד',
        prompt: 'בהנחה ש-$ab > 0$, רשום את שלושת הפתרונות של משוואה (II) באמצעות $a$ ו-$b$.',
        answer_type: 'expression',
        hints: [
          'הפתרון הממשי הוא $z = -1$.',
          'מ-$z^2 = -\\dfrac{b}{a}$ ($\\dfrac{b}{a} > 0$): $\\;z = \\pm i\\sqrt{\\dfrac{b}{a}}$.',
        ],
        solution: {
          steps: [
            'מהפירוק $(z+1)(az^2 + b) = 0$: $\\;z_1 = -1$.',
            '$az^2 + b = 0 \\Rightarrow z^2 = -\\dfrac{b}{a}$. מכיוון ש-$\\dfrac{b}{a} > 0$: $\\;z_{2,3} = \\pm i\\sqrt{\\dfrac{b}{a}}$.',
          ],
          final_answer: '$z_1 = -1$, $\\;z_{2,3} = \\pm i\\sqrt{\\dfrac{b}{a}}$.',
        },
      },
      {
        label: 'ה',
        prompt:
          'נתון כי המרחק מראשית הצירים אל כל אחד מהפתרונות המדומים הטהורים של משוואה (II) הוא $\\;2\\sqrt{2}$. מצא את היחס $\\;\\dfrac{b}{a}$.',
        answer_type: 'number',
        hints: [
          'המרחק מהראשית אל $z_{2,3} = \\pm i\\sqrt{\\tfrac{b}{a}}$ הוא $|z| = \\sqrt{\\tfrac{b}{a}}$.',
          'השווה ל-$2\\sqrt{2}$ והעלה בריבוע.',
        ],
        solution: {
          steps: [
            'המרחק מהראשית: $\\;|z_{2,3}| = \\sqrt{\\dfrac{b}{a}}$.',
            'נתון $\\;\\sqrt{\\dfrac{b}{a}} = 2\\sqrt{2}$. נעלה בריבוע: $\\;\\dfrac{b}{a} = (2\\sqrt{2})^2 = 8$.',
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
      '(קיץ תשפ"א, מועד ב\') נתונה הפונקציה $\\;f(x) = e^{\\,bx^2 - 2bx} - 1$, כאשר $b < 0$ פרמטר.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצא את נקודות החיתוך של גרף $f$ עם ציר ה-$x$.',
        answer_type: 'expression',
        hints: [
          '$f(x) = 0 \\iff e^{bx^2 - 2bx} = 1 \\iff bx^2 - 2bx = 0$.',
          'הוצא גורם משותף $bx$ ($b \\ne 0$).',
        ],
        solution: {
          steps: [
            '$f(x) = 0 \\Rightarrow e^{bx^2 - 2bx} = 1 \\Rightarrow bx^2 - 2bx = 0$.',
            '$bx(x - 2) = 0$, ומכיוון ש-$b \\ne 0$: $\\;x = 0$ או $x = 2$.',
          ],
          final_answer: 'חיתוך עם ציר $x$ בנקודות $(0,0)$ ו-$(2,0)$.',
        },
      },
      {
        label: 'א2',
        prompt: 'מצא את האסימפטוטה האופקית של גרף $f$ ($b < 0$).',
        answer_type: 'expression',
        hints: [
          'השלם ריבוע במעריך: $\\;bx^2 - 2bx = b(x-1)^2 - b$.',
          'כאשר $x \\to \\pm\\infty$ ו-$b < 0$, המעריך שואף ל-$-\\infty$, ולכן $e^{(\\cdots)} \\to 0$.',
        ],
        solution: {
          steps: [
            'נשלים ריבוע: $\\;bx^2 - 2bx = b(x-1)^2 - b$.',
            'כאשר $x \\to \\pm\\infty$: $(x-1)^2 \\to +\\infty$, ומכיוון ש-$b < 0$ המעריך $\\to -\\infty$, אז $e^{(\\cdots)} \\to 0$.',
            'לכן $\\;f(x) \\to 0 - 1 = -1$.',
          ],
          final_answer: 'אסימפטוטה אופקית: $\\;y = -1$.',
        },
      },
      {
        label: 'א3',
        prompt: 'מצא את נקודת הקיצון של $f$ וקבע את סוגה (בעזרת $b$).',
        answer_type: 'expression',
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
            caption: 'צורת הגרף של $f$ (לדוגמה $b = -\\tfrac{1}{2}$): מקסימום ב-$x=1$, חותך את ציר $x$ ב-$0$ וב-$2$, אסימפטוטה $y=-1$.',
          },
        ],
        hints: [
          'גזור: $f\\,\'(x) = (2bx - 2b)e^{bx^2 - 2bx} = 2b(x-1)e^{(\\cdots)}$. האקספוננט תמיד חיובי.',
          'נקודת קיצון ב-$x = 1$. הצב כדי לקבל את ערך הפונקציה, וזכור $b<0$.',
        ],
        solution: {
          steps: [
            'נגזרת: $\\;f\\,\'(x) = (2bx - 2b)\\,e^{bx^2 - 2bx} = 2b(x-1)\\,e^{(\\cdots)}$.',
            'האקספוננט חיובי תמיד, לכן $f\\,\'(x) = 0 \\iff x = 1$.',
            'ערך הקיצון: $\\;f(1) = e^{\\,b - 2b} - 1 = e^{-b} - 1$.',
            'מכיוון ש-$b < 0$, מתקיים $-b > 0$ ולכן $e^{-b} > 1$, כלומר ערך הקיצון חיובי. בדיקת סימן $f\\,\'$: שמאלית ל-$1$ חיובית וימינה שלילית $\\Rightarrow$ מקסימום.',
          ],
          final_answer: 'מקסימום בנקודה $\\bigl(1,\\;e^{-b} - 1\\bigr)$ (ראה תרשים).',
        },
      },
      {
        label: 'ב1',
        prompt: [
          'מגדירים $\\;g(x) = f(x + a)\\;$ (הזזה אופקית). ידוע שנקודת הקיצון של $g$ נמצאת על ציר ה-$y$.',
          'מצא את $a$, ורשום את $g(x)$ בצורה מפושטת.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'הקיצון של $f$ ב-$x = 1$, לכן הקיצון של $g(x) = f(x+a)$ הוא ב-$x = 1 - a$.',
          'על ציר ה-$y$ פירושו $x = 0$. אחרי שתמצא $a$, הצב $x+1$ במקום $x$ ב-$f$ ופשט (השלמת ריבוע עוזרת).',
        ],
        solution: {
          steps: [
            'הקיצון של $f$ ב-$x=1$, לכן הקיצון של $g(x)=f(x+a)$ ב-$x = 1 - a$.',
            'נדרש $1 - a = 0 \\Rightarrow a = 1$.',
            'נציב: $\\;g(x) = f(x+1) = e^{\\,b(x+1)^2 - 2b(x+1)} - 1$.',
            'המעריך: $\\;b\\bigl[(x+1)^2 - 2(x+1)\\bigr] = b\\bigl[(x+1)(x-1)\\bigr] = b(x^2 - 1)$.',
            'לכן $\\;g(x) = e^{\\,b(x^2 - 1)} - 1$.',
          ],
          final_answer: '$a = 1$, $\\;g(x) = e^{\\,b(x^2 - 1)} - 1$.',
        },
      },
      {
        label: 'ב2',
        prompt: 'הוכח כי $g$ היא פונקציה זוגית.',
        answer_type: 'proof',
        hints: ['פונקציה זוגית: $g(-x) = g(x)$ לכל $x$.', 'הצב $-x$ במקום $x$ ב-$g(x) = e^{b(x^2-1)} - 1$.'],
        solution: {
          steps: [
            '$g(-x) = e^{\\,b((-x)^2 - 1)} - 1 = e^{\\,b(x^2 - 1)} - 1 = g(x)$.',
            'מתקיים לכל $x$, לכן $g$ זוגית (סימטרית ביחס לציר ה-$y$). ⬛',
          ],
          final_answer: '$g(-x) = g(x)$ — הפונקציה זוגית.',
        },
      },
      {
        label: 'ב3',
        prompt: 'תאר את הגרף של $g$: ציין את הקיצון, נקודות החיתוך עם הצירים, והאסימפטוטה.',
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
            caption: 'הגרף של $g$ (לדוגמה $b=-\\tfrac{1}{2}$): זוגי, מקסימום על ציר $y$, חותך את ציר $x$ ב-$\\pm 1$.',
          },
        ],
        hints: [
          'מקסימום: בנקודה $(0,\\,g(0))$. חיתוך עם ציר $x$: $g(x)=0 \\Rightarrow b(x^2-1)=0$.',
          'האסימפטוטה זהה במהותה לזו של $f$ (הזזה אופקית לא משנה אסימפטוטה אופקית).',
        ],
        solution: {
          steps: [
            'מקסימום: $\\;g(0) = e^{-b} - 1$, בנקודה $\\bigl(0,\\,e^{-b}-1\\bigr)$ (על ציר $y$).',
            'חיתוך עם ציר $x$: $\\;b(x^2 - 1) = 0 \\Rightarrow x = \\pm 1$, כלומר $(\\pm 1,\\,0)$.',
            'אסימפטוטה אופקית: $\\;y = -1$ (כאשר $x \\to \\pm\\infty$).',
            'הגרף סימטרי ביחס לציר $y$ (זוגי).',
          ],
          final_answer:
            'מקסימום $(0,\\,e^{-b}-1)$, חיתוך עם ציר $x$ ב-$(\\pm 1,0)$, אסימפטוטה $y=-1$, סימטרי לציר $y$.',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את שיעורי ה-$x$ של נקודות הפיתול של $g$ (בעזרת $b$).',
        answer_type: 'expression',
        hints: [
          'גזור פעמיים. $g\\,\'(x) = 2bx\\,e^{b(x^2-1)}$.',
          'נקודת פיתול: $g\\,\'\'(x) = 0$. הוצא גורם משותף וקבל $1 + 2bx^2 = 0$.',
        ],
        solution: {
          steps: [
            'נגזרת ראשונה: $\\;g\\,\'(x) = 2bx\\,e^{\\,b(x^2 - 1)}$.',
            'נגזרת שנייה (כלל המכפלה): $\\;g\\,\'\'(x) = 2b\\,e^{(\\cdots)} + 2bx\\cdot 2bx\\,e^{(\\cdots)} = 2b\\,e^{(\\cdots)}\\bigl(1 + 2bx^2\\bigr)$.',
            'האקספוננט ו-$2b$ שונים מאפס, לכן $\\;g\\,\'\'(x) = 0 \\iff 1 + 2bx^2 = 0 \\Rightarrow x^2 = -\\dfrac{1}{2b}$.',
            'מכיוון ש-$b < 0$, הביטוי חיובי: $\\;x = \\pm\\dfrac{1}{\\sqrt{-2b}}$.',
          ],
          final_answer: 'נקודות פיתול ב-$\\;x = \\pm\\dfrac{1}{\\sqrt{-2b}}$.',
        },
      },
      {
        label: 'ד',
        prompt:
          'עבור $b = -\\tfrac{1}{2}$, חשב את השטח הכלוא בין הגרף של הנגזרת $g\\,\'(x)$ לבין ציר ה-$x$ בתחום $\\;-1 \\le x \\le 1$.',
        answer_type: 'number',
        hints: [
          'עם $b=-\\tfrac{1}{2}$: $\\;g(x) = e^{-\\frac{1}{2}(x^2-1)} - 1$, $\\;g\\,\'(x) = -x\\,e^{-\\frac{1}{2}(x^2-1)}$.',
          'הפונקציה $g\\,\'$ אי-זוגית, לכן השטח $= 2\\displaystyle\\int_0^1 |g\\,\'(x)|\\,dx$. השתמש בכך ש-$\\int g\\,\' = g$.',
        ],
        solution: {
          steps: [
            'עם $b = -\\tfrac{1}{2}$: $\\;g(x) = e^{-\\frac{1}{2}(x^2 - 1)} - 1$ ו-$\\;g\\,\'(x) = -x\\,e^{-\\frac{1}{2}(x^2 - 1)}$.',
            '$g\\,\'$ אי-זוגית; בתחום $[0,1]$ היא שלילית, ובתחום $[-1,0]$ חיובית — שני החצאים שווים בשטח.',
            'שטח $= 2\\displaystyle\\int_0^1 |g\\,\'(x)|\\,dx = -2\\displaystyle\\int_0^1 g\\,\'(x)\\,dx = -2\\bigl[g(x)\\bigr]_0^1 = 2\\bigl(g(0) - g(1)\\bigr)$.',
            '$g(0) = e^{\\frac{1}{2}} - 1 = \\sqrt{e} - 1$, $\\;g(1) = e^{0} - 1 = 0$.',
            'שטח $= 2(\\sqrt{e} - 1) \\approx 2 \\cdot 0.6487 \\approx 1.30$.',
          ],
          final_answer: 'השטח $= 2(\\sqrt{e} - 1) \\approx 1.30$.',
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
