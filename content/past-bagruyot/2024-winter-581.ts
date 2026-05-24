import type { PastBagrutQuestion } from './types';

export const bagrut2024Winter581: PastBagrutQuestion[] = [
  {
    id: 'b2024w581-q1',
    year: 2024,
    season: 'winter',
    paper: '581',
    questionNumber: 1,
    topic: 'אלגברה',
    totalPoints: 22,
    context: 'נתון אי-השוויון $\\dfrac{x^2 - 5x + 6}{x - 4} \\le 0$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את תחום ההגדרה של הביטוי.',
        points: 4,
        answer_type: 'expression',
        solution: {
          steps: [
            'תחום הגדרה: $x - 4 \\ne 0$ → $x \\ne 4$.',
          ],
          final_answer: '$x \\ne 4$',
        },
      },
      {
        label: 'ב',
        prompt: 'פרק את המונה לגורמים.',
        points: 4,
        answer_type: 'expression',
        solution: {
          steps: [
            'מחפשים שני מספרים שמכפלתם $6$ וסכומם $-5$: $-2$ ו-$-3$.',
            '$x^2 - 5x + 6 = (x - 2)(x - 3)$.',
          ],
          final_answer: '$(x - 2)(x - 3)$',
        },
      },
      {
        label: 'ג',
        prompt: 'פתור את אי-השוויון בעזרת טבלת סימנים.',
        points: 14,
        answer_type: 'expression',
        solution: {
          steps: [
            'נקודות קריטיות: $x = 2, 3$ (מאפסות מונה) ו-$x = 4$ (מאפסת מכנה — נשללת מתחום).',
            'טבלת סימנים בתחומים $(-\\infty, 2), (2, 3), (3, 4), (4, \\infty)$:',
            '$x < 2$: $(x-2) < 0, (x-3) < 0, (x-4) < 0$ → $(-)(-)/(-) = -$ ✓.',
            '$2 < x < 3$: $(+)(-)/(-) = +$.',
            '$3 < x < 4$: $(+)(+)/(-) = -$ ✓.',
            '$x > 4$: $(+)(+)/(+) = +$.',
            'דרישה $\\le 0$: $x \\le 2$ (כולל) או $3 \\le x < 4$ (כולל $3$, $4$ נשלל).',
            'אבל $x = 2$ מאפס את הביטוי (מותר ב-$\\le$), וכן $x = 3$.',
          ],
          final_answer: '$x \\le 2$ או $3 \\le x < 4$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024w581-q2',
    year: 2024,
    season: 'winter',
    paper: '581',
    questionNumber: 2,
    topic: 'חשבון אינטגרלי',
    totalPoints: 22,
    context: 'נתונה הפונקציה $f(x) = -x^2 + 4x$ והישר $y = x$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את נקודות החיתוך של הפרבולה והישר.',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            '$-x^2 + 4x = x$ → $-x^2 + 3x = 0$ → $x(3 - x) = 0$.',
            '$x = 0$ או $x = 3$.',
            'נקודות: $(0, 0)$ ו-$(3, 3)$.',
          ],
          final_answer: '$(0, 0)$ ו-$(3, 3)$',
        },
      },
      {
        label: 'ב',
        prompt: 'חשב את השטח הכלוא בין הפרבולה לישר.',
        points: 10,
        answer_type: 'number',
        solution: {
          steps: [
            'בתחום $[0, 3]$, איזו פונקציה עליונה? בדיקה ב-$x = 1$: פרבולה $= -1 + 4 = 3$, ישר $= 1$. הפרבולה עליונה.',
            'שטח $= \\displaystyle\\int_0^3 [(-x^2 + 4x) - x]\\,dx = \\int_0^3 (-x^2 + 3x)\\,dx$.',
            '$= \\left[-\\dfrac{x^3}{3} + \\dfrac{3x^2}{2}\\right]_0^3 = -9 + \\dfrac{27}{2} = \\dfrac{-18 + 27}{2} = \\dfrac{9}{2}$.',
          ],
          final_answer: '$S = \\dfrac{9}{2}$ יחידות שטח',
        },
      },
      {
        label: 'ג',
        prompt: 'חשב את הנפח של גוף הסיבוב הנוצר מסיבוב התחום הסגור (מסעיף ב) סביב ציר $x$.',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            'נפח גוף סיבוב בין שתי פונקציות: $V = \\pi\\int_0^3 [(f(x))^2 - (g(x))^2]\\,dx$.',
            '$V = \\pi\\int_0^3 [(-x^2+4x)^2 - x^2]\\,dx$.',
            '$(-x^2+4x)^2 = x^4 - 8x^3 + 16x^2$.',
            'ההפרש: $x^4 - 8x^3 + 16x^2 - x^2 = x^4 - 8x^3 + 15x^2$.',
            '$V = \\pi\\left[\\dfrac{x^5}{5} - 2x^4 + 5x^3\\right]_0^3 = \\pi\\left[\\dfrac{243}{5} - 162 + 135\\right] = \\pi\\left[\\dfrac{243}{5} - 27\\right] = \\pi \\cdot \\dfrac{243 - 135}{5} = \\dfrac{108\\pi}{5}$.',
          ],
          final_answer: '$V = \\dfrac{108\\pi}{5}$ יחידות נפח',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024w581-q3',
    year: 2024,
    season: 'winter',
    paper: '581',
    questionNumber: 3,
    topic: 'גיאומטריה אוקלידית',
    totalPoints: 22,
    context: 'במשולש $\\triangle ABC$ ישר זווית ב-$C$. הגובה מ-$C$ ליתר $AB$ פוגע ב-$H$. נתון $AC = 6, BC = 8$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את אורך היתר $AB$.',
        points: 4,
        answer_type: 'number',
        solution: {
          steps: [
            'פיתגורס: $AB^2 = AC^2 + BC^2 = 36 + 64 = 100$.',
            '$AB = 10$.',
          ],
          final_answer: '$AB = 10$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את אורך הגובה $CH$.',
        points: 6,
        answer_type: 'number',
        solution: {
          steps: [
            'שטח המשולש בשתי דרכים שווה: $\\dfrac{1}{2} \\cdot AC \\cdot BC = \\dfrac{1}{2} \\cdot AB \\cdot CH$.',
            '$\\dfrac{1}{2} \\cdot 6 \\cdot 8 = \\dfrac{1}{2} \\cdot 10 \\cdot CH$ → $24 = 5 \\cdot CH$ → $CH = 4.8$.',
          ],
          final_answer: '$CH = 4.8$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את $AH$ ואת $HB$.',
        points: 6,
        answer_type: 'expression',
        solution: {
          steps: [
            'משפט הגובה ליתר: $AC^2 = AH \\cdot AB$ → $36 = AH \\cdot 10$ → $AH = 3.6$.',
            '$BC^2 = HB \\cdot AB$ → $64 = HB \\cdot 10$ → $HB = 6.4$.',
            'בדיקה: $AH + HB = 3.6 + 6.4 = 10 = AB$ ✓.',
          ],
          final_answer: '$AH = 3.6$, $HB = 6.4$',
        },
      },
      {
        label: 'ד',
        prompt: 'הוכח ש-$\\triangle ACH \\sim \\triangle ABC$.',
        points: 6,
        answer_type: 'proof',
        solution: {
          steps: [
            'במשולשים $\\triangle ACH$ ו-$\\triangle ABC$:',
            '(1) $\\angle A$ — זווית משותפת.',
            '(2) $\\angle AHC = \\angle ACB = 90°$ (גובה ליתר ↔ זווית ישרה במקור).',
            'לכן $\\triangle ACH \\sim \\triangle ABC$ לפי משפט ז.ז.',
          ],
          final_answer: 'הוכח (לפי ז.ז)',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024w581-q4',
    year: 2024,
    season: 'winter',
    paper: '581',
    questionNumber: 4,
    topic: 'טריגונומטריה',
    totalPoints: 20,
    context: 'נתונה הפונקציה $f(x) = 2\\sin x + \\cos 2x$ בתחום $[0, 2\\pi]$.',
    parts: [
      {
        label: 'א',
        prompt: 'הבע את $f$ ב-$\\sin x$ בלבד.',
        points: 4,
        answer_type: 'expression',
        solution: {
          steps: [
            '$\\cos 2x = 1 - 2\\sin^2 x$.',
            '$f(x) = 2\\sin x + 1 - 2\\sin^2 x$.',
          ],
          final_answer: '$f(x) = -2\\sin^2 x + 2\\sin x + 1$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את נקודות הקיצון של $f$ בתחום הנתון.',
        points: 9,
        answer_type: 'expression',
        solution: {
          steps: [
            'הצבה $t = \\sin x$, $t \\in [-1, 1]$. $f = -2t^2 + 2t + 1$ — פרבולה.',
            '$f\'_t = -4t + 2 = 0$ → $t = 1/2$. ($f\'\'_t = -4 < 0$ — מקסימום.)',
            'מקסימום $f = -2(1/4) + 1 + 1 = 3/2$ כאשר $\\sin x = 1/2$ → $x = \\pi/6, 5\\pi/6$.',
            'מינימום בקצוות: $t = 1$ ($\\sin x = 1$ ב-$x = \\pi/2$): $f = -2 + 2 + 1 = 1$.',
            '$t = -1$ ($\\sin x = -1$ ב-$x = 3\\pi/2$): $f = -2 - 2 + 1 = -3$.',
            'מקס׳ כללי: $f = 3/2$ ב-$\\pi/6, 5\\pi/6$. מינ׳ כללי: $f = -3$ ב-$3\\pi/2$.',
          ],
          final_answer: 'מקס׳ $\\tfrac{3}{2}$ ב-$\\tfrac{\\pi}{6}, \\tfrac{5\\pi}{6}$; מינ׳ $-3$ ב-$\\tfrac{3\\pi}{2}$',
        },
      },
      {
        label: 'ג',
        prompt: 'מהו טווח הערכים של $f$ בתחום הנתון?',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            'מסעיף ב: $f$ מקבלת ערכים בין מינ׳ ($-3$) למקס׳ ($3/2$).',
            'הפונקציה רציפה בתחום סגור, אז מקבלת את כל הערכים בתווך.',
          ],
          final_answer: '$f([0, 2\\pi]) = \\left[-3, \\dfrac{3}{2}\\right]$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
