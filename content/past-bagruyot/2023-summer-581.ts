import type { PastBagrutQuestion } from './types';

export const bagrut2023Summer581: PastBagrutQuestion[] = [
  {
    id: 'b2023s581-q1',
    year: 2023,
    season: 'summer',
    paper: '581',
    questionNumber: 1,
    topic: 'אלגברה',
    totalPoints: 20,
    context: 'נתונה המערכת $\\begin{cases} x + y = 5 \\\\ x^2 + y^2 = 17 \\end{cases}$.',
    parts: [
      {
        label: 'א',
        prompt: 'פתור את המערכת.',
        points: 10,
        answer_type: 'expression',
        solution: {
          steps: [
            'מהמשוואה הראשונה: $y = 5 - x$.',
            'הצבה בשנייה: $x^2 + (5-x)^2 = 17$.',
            '$x^2 + 25 - 10x + x^2 = 17$ → $2x^2 - 10x + 8 = 0$ → $x^2 - 5x + 4 = 0$.',
            '$(x-1)(x-4) = 0$ → $x = 1$ או $x = 4$.',
            'אם $x = 1$: $y = 4$. אם $x = 4$: $y = 1$.',
          ],
          final_answer: '$(1, 4)$ ו-$(4, 1)$',
        },
      },
      {
        label: 'ב',
        prompt: 'מבין שני הפתרונות, מצא את זה שעבורו $xy$ מקסימלי, וחשב את הערך.',
        points: 5,
        answer_type: 'number',
        solution: {
          steps: [
            'בשני הפתרונות: $1 \\cdot 4 = 4$, וגם $4 \\cdot 1 = 4$.',
            'הערך זהה — $xy = 4$ בשני הפתרונות.',
          ],
          final_answer: '$xy = 4$ (זהה בשני הפתרונות)',
        },
      },
      {
        label: 'ג',
        prompt: 'נתונה המערכת הכללית $\\begin{cases} x + y = 5 \\\\ x^2 + y^2 = k \\end{cases}$. מצא את ערכי $k$ שעבורם יש למערכת בדיוק שני פתרונות שונים.',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            'מ-$y = 5 - x$, הצבה: $x^2 + (5-x)^2 = k$ → $2x^2 - 10x + 25 - k = 0$.',
            'שני פתרונות שונים: $\\Delta > 0$.',
            '$\\Delta = 100 - 8(25 - k) = 100 - 200 + 8k = 8k - 100 > 0$ → $k > 12.5$.',
            'גם — חוסמים $k$: $x^2 + y^2 \\ge \\dfrac{(x+y)^2}{2} = \\dfrac{25}{2} = 12.5$ (אי-שוויון קושי-שווארץ). אז $k \\ge 12.5$, ושוויון רק כש-$x = y = 2.5$.',
          ],
          final_answer: '$k > 12.5$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2023s581-q2',
    year: 2023,
    season: 'summer',
    paper: '581',
    questionNumber: 2,
    topic: 'חשבון דיפרנציאלי',
    totalPoints: 22,
    context: 'יצרן רוצה לבנות תיבה פתוחה מלמעלה מקרטון מלבני בגודל $20 \\times 12$ ס"מ. הוא חותך ריבוע באורך צלע $x$ ס"מ מכל פינה, ומקפל את הצדדים כלפי מעלה.',
    parts: [
      {
        label: 'א',
        prompt: 'הבע את נפח התיבה $V$ כפונקציה של $x$.',
        points: 6,
        answer_type: 'expression',
        solution: {
          steps: [
            'אחרי חיתוך וקיפול: בסיס $= (20 - 2x) \\times (12 - 2x)$, גובה $= x$.',
            '$V(x) = x(20 - 2x)(12 - 2x)$.',
            'פתיחה: $(20 - 2x)(12 - 2x) = 240 - 40x - 24x + 4x^2 = 4x^2 - 64x + 240$.',
            '$V(x) = x(4x^2 - 64x + 240) = 4x^3 - 64x^2 + 240x$.',
          ],
          final_answer: '$V(x) = 4x^3 - 64x^2 + 240x$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את תחום ההגדרה המעשי של $V$.',
        points: 4,
        answer_type: 'expression',
        solution: {
          steps: [
            'דרישות: $x > 0$ (חיתוך אמיתי), $20 - 2x > 0$ ($x < 10$), $12 - 2x > 0$ ($x < 6$).',
            'מקבילים: $0 < x < 6$.',
          ],
          final_answer: '$0 < x < 6$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את הערך של $x$ שמקסם את הנפח, ואת הנפח המקסימלי.',
        points: 12,
        answer_type: 'expression',
        solution: {
          steps: [
            '$V\'(x) = 12x^2 - 128x + 240$.',
            '$V\'(x) = 0$ → $12x^2 - 128x + 240 = 0$ → $3x^2 - 32x + 60 = 0$.',
            'נוסחת השורשים: $x = \\dfrac{32 \\pm \\sqrt{1024 - 720}}{6} = \\dfrac{32 \\pm \\sqrt{304}}{6} = \\dfrac{32 \\pm 4\\sqrt{19}}{6} = \\dfrac{16 \\pm 2\\sqrt{19}}{3}$.',
            'בקירוב: $\\sqrt{19} \\approx 4.359$. $x \\approx \\dfrac{16 - 8.72}{3} \\approx 2.43$ או $x \\approx \\dfrac{16 + 8.72}{3} \\approx 8.24$.',
            'רק $x \\approx 2.43$ בתחום $(0, 6)$.',
            '$V(2.43) \\approx 4(14.35) - 64(5.90) + 240(2.43) \\approx 57.4 - 377.6 + 583.2 \\approx 263.0$ סמ"ק.',
          ],
          final_answer: '$x = \\dfrac{16 - 2\\sqrt{19}}{3} \\approx 2.43$ ס"מ, $V \\approx 263$ סמ"ק',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2023s581-q3',
    year: 2023,
    season: 'summer',
    paper: '581',
    questionNumber: 3,
    topic: 'הסתברות',
    totalPoints: 20,
    context: 'בקופסה $A$ יש $3$ כדורים לבנים ו-$2$ שחורים. בקופסה $B$ יש $5$ לבנים ו-$3$ שחורים. בוחרים קופסה באקראי (סיכוי שווה) ומוציאים ממנה כדור.',
    parts: [
      {
        label: 'א',
        prompt: 'מהי ההסתברות שהכדור שיצא לבן?',
        points: 7,
        answer_type: 'number',
        solution: {
          steps: [
            'פירוק מלא: $P(L) = P(L|A) \\cdot P(A) + P(L|B) \\cdot P(B)$.',
            '$P(L|A) = 3/5$, $P(L|B) = 5/8$, $P(A) = P(B) = 1/2$.',
            '$P(L) = \\dfrac{3}{5} \\cdot \\dfrac{1}{2} + \\dfrac{5}{8} \\cdot \\dfrac{1}{2} = \\dfrac{3}{10} + \\dfrac{5}{16}$.',
            'מכנה משותף $80$: $\\dfrac{24}{80} + \\dfrac{25}{80} = \\dfrac{49}{80}$.',
          ],
          final_answer: '$P(L) = \\dfrac{49}{80}$',
        },
      },
      {
        label: 'ב',
        prompt: 'נתון שהכדור שיצא לבן. מהי ההסתברות שהוא הוצא מקופסה $A$?',
        points: 8,
        answer_type: 'number',
        solution: {
          steps: [
            'בייס: $P(A|L) = \\dfrac{P(L|A) \\cdot P(A)}{P(L)} = \\dfrac{(3/5)(1/2)}{49/80}$.',
            '$= \\dfrac{3/10}{49/80} = \\dfrac{3}{10} \\cdot \\dfrac{80}{49} = \\dfrac{240}{490} = \\dfrac{24}{49}$.',
          ],
          final_answer: '$P(A|L) = \\dfrac{24}{49}$',
        },
      },
      {
        label: 'ג',
        prompt: 'מוציאים $4$ כדורים מקופסה $A$ עם החזרה. מהי ההסתברות שיצאו בדיוק $2$ לבנים?',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            'בינומי עם $n = 4$, $p = 3/5$, $k = 2$.',
            '$P(X = 2) = \\binom{4}{2} \\left(\\dfrac{3}{5}\\right)^2 \\left(\\dfrac{2}{5}\\right)^2 = 6 \\cdot \\dfrac{9}{25} \\cdot \\dfrac{4}{25} = \\dfrac{216}{625}$.',
          ],
          final_answer: '$P = \\dfrac{216}{625}$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2023s581-q4',
    year: 2023,
    season: 'summer',
    paper: '581',
    questionNumber: 4,
    topic: 'גיאומטריה אוקלידית',
    totalPoints: 22,
    context: 'במעגל $O$, מיתר $AB$ ומיתר $CD$ נחתכים בנקודה $E$ בתוך המעגל. נתון $AE = 4, EB = 6, CE = 3$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את אורך $ED$.',
        points: 5,
        answer_type: 'number',
        solution: {
          steps: [
            'משפט מיתרים מצטלבים: $AE \\cdot EB = CE \\cdot ED$.',
            '$4 \\cdot 6 = 3 \\cdot ED$ → $24 = 3 \\cdot ED$ → $ED = 8$.',
          ],
          final_answer: '$ED = 8$',
        },
      },
      {
        label: 'ב',
        prompt: 'הוכח ש-$\\triangle AEC \\sim \\triangle DEB$.',
        points: 8,
        answer_type: 'proof',
        solution: {
          steps: [
            'במשולשים $\\triangle AEC$ ו-$\\triangle DEB$:',
            '(1) $\\angle AEC = \\angle DEB$ — זוויות קודקודיות (שווא ראש).',
            '(2) $\\angle CAE = \\angle BDE$ — שתי זוויות היקפיות הנשענות על אותו קשת $CB$.',
            'לכן $\\triangle AEC \\sim \\triangle DEB$ לפי ז.ז.',
          ],
          final_answer: 'הוכח (לפי ז.ז)',
        },
      },
      {
        label: 'ג',
        prompt: 'נתון שאורך המיתר $AB$ הוא $10$. אם $CD$ עובר במרכז המעגל, מצא את רדיוס המעגל.',
        points: 9,
        answer_type: 'expression',
        solution: {
          steps: [
            '$CD$ עובר במרכז → $CD$ הוא קוטר. $CD = CE + ED = 3 + 8 = 11$. אז רדיוס $= 5.5$.',
            'בדיקה ע"י אנך אמצעי: מ-$O$ נוריד אנך ל-$AB$, יחתוך באמצע — במרחק $5$ מ-$A$ ומ-$B$, ז.א. בנקודה במרחק $5 - 4 = 1$ מ-$E$.',
            'נסמן את אותה נקודה $M$ (אמצע $AB$). $OM \\perp AB$, $OM = ?$',
            'במשולש ישר $\\triangle OMA$: $OA = r = 5.5$, $AM = 5$. $OM^2 = OA^2 - AM^2 = 30.25 - 25 = 5.25$. $OM = \\sqrt{5.25}$.',
            'נסמן $OE$: $OE^2 = OM^2 + ME^2 = 5.25 + 1 = 6.25$, $OE = 2.5$. בדיקה: $OE = OC - CE \\cdot \\text{...}$ — קצת מסובך, אבל הרדיוס $5.5$ מתאים לנתונים.',
          ],
          final_answer: '$r = 5.5$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
