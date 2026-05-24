import type { PastBagrutQuestion } from './types';

export const bagrut2024Winter582: PastBagrutQuestion[] = [
  {
    id: 'b2024w582-q1',
    year: 2024,
    season: 'winter',
    paper: '582',
    questionNumber: 1,
    topic: 'פונקציית ln',
    totalPoints: 24,
    context: 'נתונה הפונקציה $f(x) = \\dfrac{\\ln x}{x}$, $x > 0$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את הנגזרת $f\'(x)$.',
        points: 6,
        answer_type: 'expression',
        solution: {
          steps: [
            'כלל המנה: $f\'(x) = \\dfrac{(\\ln x)\' \\cdot x - \\ln x \\cdot 1}{x^2} = \\dfrac{\\frac{1}{x} \\cdot x - \\ln x}{x^2} = \\dfrac{1 - \\ln x}{x^2}$.',
          ],
          final_answer: '$f\'(x) = \\dfrac{1 - \\ln x}{x^2}$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את נקודת הקיצון של $f$ וסווג אותה.',
        points: 8,
        answer_type: 'expression',
        solution: {
          steps: [
            '$f\'(x) = 0$ → $1 - \\ln x = 0$ → $\\ln x = 1$ → $x = e$.',
            '$f(e) = \\dfrac{\\ln e}{e} = \\dfrac{1}{e}$.',
            'סיווג: בדיקת סימן $f\'$. $x < e$: $\\ln x < 1$ → $f\' > 0$ (עולה). $x > e$: $f\' < 0$ (יורדת). אז מקסימום.',
          ],
          final_answer: 'נקודת מקסימום $(e, \\tfrac{1}{e})$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את האסימפטוטות של $f$.',
        points: 6,
        answer_type: 'expression',
        solution: {
          steps: [
            'אסימפ׳ אנכית: ב-$x = 0$ ($f$ לא מוגדרת). כאשר $x \\to 0^+$, $\\ln x \\to -\\infty$ ו-$x \\to 0^+$ — $f \\to -\\infty$. אסימפ׳ אנכית $x = 0$.',
            'אסימפ׳ אופקית כאשר $x \\to \\infty$: $\\dfrac{\\ln x}{x} \\to 0$ (לוגריתם גדל לאט יותר מאשר $x$). $y = 0$.',
          ],
          final_answer: 'אנכית $x = 0$, אופקית $y = 0$',
        },
      },
      {
        label: 'ד',
        prompt: 'חשב $\\displaystyle\\int_1^e f(x)\\,dx$.',
        points: 4,
        answer_type: 'expression',
        solution: {
          steps: [
            '$\\int \\dfrac{\\ln x}{x}\\,dx$ — הצבה $u = \\ln x$, $du = \\dfrac{1}{x}dx$. אינטגרל $= \\int u\\,du = \\dfrac{u^2}{2} + C = \\dfrac{(\\ln x)^2}{2} + C$.',
            'מסוים: $\\left[\\dfrac{(\\ln x)^2}{2}\\right]_1^e = \\dfrac{1}{2} - 0 = \\dfrac{1}{2}$.',
          ],
          final_answer: '$\\dfrac{1}{2}$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024w582-q2',
    year: 2024,
    season: 'winter',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 22,
    context: 'נתונות הנקודות במרחב $A(1, 2, 3)$, $B(4, 1, 2)$, $C(2, 5, 1)$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את הוקטורים $\\vec{AB}$ ו-$\\vec{AC}$.',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            '$\\vec{AB} = B - A = (4-1, 1-2, 2-3) = (3, -1, -1)$.',
            '$\\vec{AC} = C - A = (2-1, 5-2, 1-3) = (1, 3, -2)$.',
          ],
          final_answer: '$\\vec{AB} = (3, -1, -1), \\vec{AC} = (1, 3, -2)$',
        },
      },
      {
        label: 'ב',
        prompt: 'חשב את המכפלה הסקלרית $\\vec{AB} \\cdot \\vec{AC}$, ואת הזווית בין הוקטורים.',
        points: 8,
        answer_type: 'expression',
        solution: {
          steps: [
            'סקלרית: $\\vec{AB} \\cdot \\vec{AC} = 3 \\cdot 1 + (-1) \\cdot 3 + (-1) \\cdot (-2) = 3 - 3 + 2 = 2$.',
            'גדלים: $|\\vec{AB}| = \\sqrt{9 + 1 + 1} = \\sqrt{11}$. $|\\vec{AC}| = \\sqrt{1 + 9 + 4} = \\sqrt{14}$.',
            'זווית: $\\cos\\theta = \\dfrac{2}{\\sqrt{11 \\cdot 14}} = \\dfrac{2}{\\sqrt{154}}$.',
            '$\\theta = \\arccos\\dfrac{2}{\\sqrt{154}} \\approx 80.7°$.',
          ],
          final_answer: '$\\vec{AB} \\cdot \\vec{AC} = 2$, $\\cos\\theta = \\dfrac{2}{\\sqrt{154}}$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את שטח המשולש $\\triangle ABC$.',
        points: 9,
        answer_type: 'expression',
        solution: {
          steps: [
            'שטח $= \\dfrac{1}{2}|\\vec{AB} \\times \\vec{AC}|$.',
            'מכפלה וקטורית: $\\vec{AB} \\times \\vec{AC} = ((-1)(-2) - (-1)(3),\\, (-1)(1) - (3)(-2),\\, (3)(3) - (-1)(1))$.',
            '$= (2 + 3,\\, -1 + 6,\\, 9 + 1) = (5, 5, 10)$.',
            '$|\\vec{AB} \\times \\vec{AC}| = \\sqrt{25 + 25 + 100} = \\sqrt{150} = 5\\sqrt{6}$.',
            'שטח $= \\dfrac{5\\sqrt{6}}{2}$.',
          ],
          final_answer: '$S = \\dfrac{5\\sqrt{6}}{2}$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024w582-q3',
    year: 2024,
    season: 'winter',
    paper: '582',
    questionNumber: 3,
    topic: 'גאומטריה אנליטית',
    totalPoints: 22,
    context: 'נתונים הישרים $\\ell_1: y = 2x + 1$ ו-$\\ell_2: y = -x + 4$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את נקודת החיתוך של שני הישרים.',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            'השוואה: $2x + 1 = -x + 4$ → $3x = 3$ → $x = 1$.',
            'הצבה: $y = 2 \\cdot 1 + 1 = 3$. נקודה: $(1, 3)$.',
          ],
          final_answer: '$(1, 3)$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את משוואת הישר העובר דרך הנקודה $(1, 3)$ וניצב ל-$\\ell_1$.',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            'שיפוע $\\ell_1$ הוא $2$. ניצב לו: שיפוע $= -\\dfrac{1}{2}$.',
            'משוואה דרך $(1, 3)$: $y - 3 = -\\dfrac{1}{2}(x - 1)$.',
            '$y = -\\dfrac{1}{2}x + \\dfrac{1}{2} + 3 = -\\dfrac{1}{2}x + \\dfrac{7}{2}$.',
          ],
          final_answer: '$y = -\\dfrac{1}{2}x + \\dfrac{7}{2}$',
        },
      },
      {
        label: 'ג',
        prompt: 'חשב את שטח המשולש הנוצר משלושת הישרים: $\\ell_1, \\ell_2$, וציר $x$.',
        points: 10,
        answer_type: 'number',
        solution: {
          steps: [
            'חיתוך $\\ell_1$ עם ציר $x$ ($y = 0$): $2x + 1 = 0$ → $x = -\\tfrac{1}{2}$. נקודה $A = (-\\tfrac{1}{2}, 0)$.',
            'חיתוך $\\ell_2$ עם ציר $x$: $-x + 4 = 0$ → $x = 4$. נקודה $B = (4, 0)$.',
            'נקודה $C$ = חיתוך שני הישרים = $(1, 3)$ (מסעיף א).',
            'בסיס המשולש: $AB = 4 - (-\\tfrac{1}{2}) = \\tfrac{9}{2}$.',
            'גובה: גובה הנקודה $C$ מעל ציר $x$ = $3$.',
            'שטח: $S = \\tfrac{1}{2} \\cdot \\tfrac{9}{2} \\cdot 3 = \\tfrac{27}{4}$.',
          ],
          final_answer: '$S = \\dfrac{27}{4}$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024w582-q4',
    year: 2024,
    season: 'winter',
    paper: '582',
    questionNumber: 4,
    topic: 'חשבון אינטגרלי',
    totalPoints: 20,
    context: 'נתונה הפונקציה $g(x) = e^x \\sin x$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את הנגזרת $g\'(x)$.',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            'כלל המכפלה: $g\'(x) = (e^x)\' \\sin x + e^x (\\sin x)\' = e^x \\sin x + e^x \\cos x$.',
            '$g\'(x) = e^x(\\sin x + \\cos x)$.',
          ],
          final_answer: '$g\'(x) = e^x(\\sin x + \\cos x)$',
        },
      },
      {
        label: 'ב',
        prompt: 'הוכח שהפונקציה $G(x) = \\dfrac{e^x(\\sin x - \\cos x)}{2}$ היא פונקציה קדומה ל-$g$.',
        points: 8,
        answer_type: 'proof',
        solution: {
          steps: [
            'נגזר את $G(x)$: $G\'(x) = \\dfrac{e^x(\\sin x - \\cos x) + e^x(\\cos x + \\sin x)}{2}$.',
            'פיתוח: $= \\dfrac{e^x[\\sin x - \\cos x + \\cos x + \\sin x]}{2} = \\dfrac{e^x \\cdot 2\\sin x}{2} = e^x \\sin x = g(x)$ ✓.',
          ],
          final_answer: 'הוכח',
        },
      },
      {
        label: 'ג',
        prompt: 'חשב את $\\displaystyle\\int_0^{\\pi} e^x \\sin x\\,dx$.',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            'מסעיף ב: $G(x) = \\dfrac{e^x(\\sin x - \\cos x)}{2}$.',
            '$G(\\pi) = \\dfrac{e^\\pi(0 - (-1))}{2} = \\dfrac{e^\\pi}{2}$.',
            '$G(0) = \\dfrac{1 \\cdot (0 - 1)}{2} = -\\dfrac{1}{2}$.',
            '$\\int_0^\\pi g = G(\\pi) - G(0) = \\dfrac{e^\\pi}{2} - \\left(-\\dfrac{1}{2}\\right) = \\dfrac{e^\\pi + 1}{2}$.',
          ],
          final_answer: '$\\dfrac{e^\\pi + 1}{2}$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
