import type { PastBagrutQuestion } from './types';

/**
 * Bagrut-style questions modeled on the 2024 summer paper 582.
 * Topics: exponential/log, analytic geometry, vectors, complex numbers.
 */
export const bagrut2024Summer582: PastBagrutQuestion[] = [
  {
    id: 'b2024s582-q1',
    year: 2024,
    season: 'summer',
    paper: '582',
    questionNumber: 1,
    topic: 'פונקציה מעריכית',
    totalPoints: 22,
    context: 'אוכלוסיית חיידקים גדלה לפי המודל $N(t) = N_0 \\cdot e^{kt}$, כאשר $t$ נמדד בשעות. נצפו הנתונים הבאים: בזמן $t = 0$ היו $200$ חיידקים, ובזמן $t = 4$ היו $800$ חיידקים.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את הקבוע $k$.',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            'מהנתונים: $N_0 = 200$ ו-$N(4) = 800$.',
            'הצבה: $800 = 200 \\cdot e^{4k}$ → $e^{4k} = 4$.',
            'לוקחים $\\ln$ משני הצדדים: $4k = \\ln 4 = 2\\ln 2$.',
            '$k = \\dfrac{\\ln 4}{4} = \\dfrac{\\ln 2}{2}$.',
          ],
          final_answer: '$k = \\dfrac{\\ln 2}{2} \\approx 0.347$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את מספר החיידקים אחרי $10$ שעות.',
        points: 6,
        answer_type: 'expression',
        solution: {
          steps: [
            '$N(10) = 200 \\cdot e^{10k} = 200 \\cdot e^{10 \\cdot \\ln 2 / 2} = 200 \\cdot e^{5\\ln 2}$.',
            '$e^{5\\ln 2} = (e^{\\ln 2})^5 = 2^5 = 32$.',
            '$N(10) = 200 \\cdot 32 = 6400$.',
          ],
          final_answer: '$N(10) = 6400$ חיידקים',
        },
      },
      {
        label: 'ג',
        prompt: 'מתי תכפיל האוכלוסייה את עצמה (כלומר תגיע ל-$400$)?',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            'דרישה: $200 \\cdot e^{kt} = 400$ → $e^{kt} = 2$ → $kt = \\ln 2$.',
            '$t = \\dfrac{\\ln 2}{k} = \\dfrac{\\ln 2}{\\ln 2 / 2} = 2$.',
          ],
          final_answer: 'אחרי $2$ שעות',
        },
      },
      {
        label: 'ד',
        prompt: 'מתי תגיע האוכלוסייה ל-$10000$ חיידקים?',
        points: 4,
        answer_type: 'expression',
        solution: {
          steps: [
            '$200 \\cdot e^{kt} = 10000$ → $e^{kt} = 50$.',
            '$kt = \\ln 50$ → $t = \\dfrac{\\ln 50}{\\ln 2 / 2} = \\dfrac{2\\ln 50}{\\ln 2}$.',
            'חישוב: $\\ln 50 \\approx 3.912$, $\\ln 2 \\approx 0.693$. $t \\approx \\dfrac{2 \\cdot 3.912}{0.693} \\approx 11.29$.',
          ],
          final_answer: '$t = \\dfrac{2\\ln 50}{\\ln 2} \\approx 11.29$ שעות',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024s582-q2',
    year: 2024,
    season: 'summer',
    paper: '582',
    questionNumber: 2,
    topic: 'פונקציית ln',
    totalPoints: 24,
    context: 'נתונה הפונקציה $f(x) = x\\ln x - x$, $x > 0$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את הנגזרת $f\'(x)$.',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            'גזירה ע"י כלל המכפלה ל-$x\\ln x$: $(x\\ln x)\' = 1 \\cdot \\ln x + x \\cdot \\dfrac{1}{x} = \\ln x + 1$.',
            'גזירת $-x$: $-1$.',
            '$f\'(x) = \\ln x + 1 - 1 = \\ln x$.',
          ],
          final_answer: '$f\'(x) = \\ln x$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את נקודת הקיצון של $f$ וסווג אותה.',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            '$f\'(x) = 0$ → $\\ln x = 0$ → $x = 1$.',
            '$f(1) = 1 \\cdot \\ln 1 - 1 = 0 - 1 = -1$.',
            'סיווג ע"י $f\'\'$: $f\'\'(x) = \\dfrac{1}{x}$, ב-$x = 1$: $f\'\'(1) = 1 > 0$, אז מינימום.',
          ],
          final_answer: 'נקודת מינימום $(1, -1)$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את האינטגרל $\\displaystyle\\int_1^e f(x)\\, dx$.',
        points: 8,
        answer_type: 'expression',
        solution: {
          steps: [
            'מסעיף א: $f\'(x) = \\ln x$ — כלומר $\\ln x$ היא נגזרת של משהו ש-$f(x)$ הוא חלק ממנו.',
            'בעצם $f(x) = x\\ln x - x$ היא הפונקציה הקדומה של $\\ln x$. אז $\\displaystyle\\int \\ln x\\,dx = x\\ln x - x + C$.',
            'אבל אנחנו רוצים $\\int f(x)\\,dx = \\int (x\\ln x - x)\\,dx$.',
            'אינטגרציה של $x\\ln x$ בחלקים: $u = \\ln x$, $dv = x\\,dx$, אז $du = \\dfrac{1}{x}dx$, $v = \\dfrac{x^2}{2}$.',
            '$\\int x\\ln x\\,dx = \\dfrac{x^2 \\ln x}{2} - \\int \\dfrac{x^2}{2} \\cdot \\dfrac{1}{x}\\,dx = \\dfrac{x^2 \\ln x}{2} - \\dfrac{x^2}{4} + C$.',
            '$\\int f(x)\\,dx = \\dfrac{x^2 \\ln x}{2} - \\dfrac{x^2}{4} - \\dfrac{x^2}{2} + C = \\dfrac{x^2 \\ln x}{2} - \\dfrac{3x^2}{4} + C$.',
            'במסוים מ-$1$ עד $e$: $\\left[\\dfrac{x^2\\ln x}{2} - \\dfrac{3x^2}{4}\\right]_1^e = \\left(\\dfrac{e^2 \\cdot 1}{2} - \\dfrac{3e^2}{4}\\right) - \\left(\\dfrac{0}{2} - \\dfrac{3}{4}\\right)$.',
            '$= \\dfrac{e^2}{2} - \\dfrac{3e^2}{4} + \\dfrac{3}{4} = \\dfrac{2e^2 - 3e^2}{4} + \\dfrac{3}{4} = \\dfrac{-e^2 + 3}{4} = \\dfrac{3 - e^2}{4}$.',
          ],
          final_answer: '$\\displaystyle\\int_1^e f(x)\\,dx = \\dfrac{3 - e^2}{4}$',
        },
      },
      {
        label: 'ד',
        prompt: 'הסבר מבחינה גיאומטרית מדוע התשובה בסעיף ג שלילית.',
        points: 4,
        answer_type: 'text',
        solution: {
          steps: [
            'מסעיף ב: $f$ מקבלת מינימום $-1$ ב-$x = 1$.',
            'נבדוק $f(e) = e \\cdot \\ln e - e = e - e = 0$.',
            'בתחום $[1, e]$, $f$ מתחילה ב-$f(1) = -1$ ועולה ל-$f(e) = 0$. כל הערכים בתחום הזה אי-חיוביים.',
            'אינטגרל של פונקציה אי-חיובית = שטח שלילי. לכן התשובה שלילית.',
          ],
          final_answer: 'הפונקציה אי-חיובית בכל $[1, e]$, אז האינטגרל שלילי',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024s582-q3',
    year: 2024,
    season: 'summer',
    paper: '582',
    questionNumber: 3,
    topic: 'גאומטריה אנליטית',
    totalPoints: 22,
    context: 'במערכת צירים נתון מעגל $C$ שמשוואתו $x^2 + y^2 - 4x + 6y - 12 = 0$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את מרכז המעגל ואת רדיוסו.',
        points: 6,
        answer_type: 'expression',
        solution: {
          steps: [
            'השלמה לריבוע: $x^2 - 4x = (x-2)^2 - 4$.',
            '$y^2 + 6y = (y+3)^2 - 9$.',
            'הצבה במשוואה: $(x-2)^2 - 4 + (y+3)^2 - 9 - 12 = 0$.',
            '$(x-2)^2 + (y+3)^2 = 25$.',
            'מרכז: $(2, -3)$, רדיוס: $r = 5$.',
          ],
          final_answer: 'מרכז $(2, -3)$, רדיוס $r = 5$',
        },
      },
      {
        label: 'ב',
        prompt: 'הראה שהנקודה $A(5, 1)$ נמצאת על המעגל, ומצא את משוואת המשיק למעגל ב-$A$.',
        points: 8,
        answer_type: 'expression',
        solution: {
          steps: [
            'בדיקה ש-$A$ על המעגל: $(5-2)^2 + (1-(-3))^2 = 9 + 16 = 25$ ✓.',
            'שיפוע הרדיוס מהמרכז $(2,-3)$ ל-$A(5,1)$: $m_r = \\dfrac{1-(-3)}{5-2} = \\dfrac{4}{3}$.',
            'המשיק ניצב לרדיוס: $m_t = -\\dfrac{1}{m_r} = -\\dfrac{3}{4}$.',
            'משוואת המשיק דרך $A(5,1)$: $y - 1 = -\\dfrac{3}{4}(x - 5)$.',
            'או בצורה כללית: $3x + 4y = 19$.',
          ],
          final_answer: 'משיק: $3x + 4y = 19$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את המרחק מהמרכז של המעגל לישר $3x + 4y - 9 = 0$, וקבע כמה נקודות חיתוך יש לישר עם המעגל.',
        points: 8,
        answer_type: 'expression',
        solution: {
          steps: [
            'מרחק נקודה $(2, -3)$ מהישר $3x + 4y - 9 = 0$:',
            '$d = \\dfrac{|3 \\cdot 2 + 4 \\cdot (-3) - 9|}{\\sqrt{9 + 16}} = \\dfrac{|6 - 12 - 9|}{5} = \\dfrac{|-15|}{5} = 3$.',
            '$d = 3 < r = 5$, אז לישר יש שתי נקודות חיתוך עם המעגל.',
          ],
          final_answer: '$d = 3$ — לישר שתי נקודות חיתוך',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024s582-q4',
    year: 2024,
    season: 'summer',
    paper: '582',
    questionNumber: 4,
    topic: 'מספרים מרוכבים',
    totalPoints: 20,
    context: 'נתון המספר המרוכב $z = 1 + i\\sqrt{3}$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את המודול $|z|$ ואת הארגומנט של $z$.',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            '$|z| = \\sqrt{a^2 + b^2} = \\sqrt{1 + 3} = \\sqrt{4} = 2$.',
            'ארגומנט: $\\tan\\theta = \\dfrac{b}{a} = \\dfrac{\\sqrt{3}}{1} = \\sqrt{3}$.',
            '$z$ במרובע I (כי $a, b > 0$). $\\theta = \\dfrac{\\pi}{3}$ (כי $\\tan(\\pi/3) = \\sqrt{3}$).',
          ],
          final_answer: '$|z| = 2$, $\\arg z = \\dfrac{\\pi}{3}$',
        },
      },
      {
        label: 'ב',
        prompt: 'הצג את $z$ בצורה הקוטבית ומצא את $z^6$.',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            'צורה קוטבית: $z = 2(\\cos\\tfrac{\\pi}{3} + i\\sin\\tfrac{\\pi}{3})$.',
            'דה-מואבר: $z^n = r^n(\\cos n\\theta + i\\sin n\\theta)$.',
            '$z^6 = 2^6(\\cos 2\\pi + i\\sin 2\\pi) = 64(1 + 0i) = 64$.',
          ],
          final_answer: '$z^6 = 64$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את כל השורשים המרוכבים של המשוואה $w^3 = z$.',
        points: 8,
        answer_type: 'expression',
        solution: {
          steps: [
            'נחשב שורש שלישי של $z = 2(\\cos\\tfrac{\\pi}{3} + i\\sin\\tfrac{\\pi}{3})$.',
            'נוסחת שורש $n$-י: $w_k = r^{1/n}\\left[\\cos\\dfrac{\\theta + 2k\\pi}{n} + i\\sin\\dfrac{\\theta + 2k\\pi}{n}\\right]$, $k = 0, 1, 2$.',
            '$r^{1/3} = 2^{1/3} = \\sqrt[3]{2}$.',
            '$w_0 = \\sqrt[3]{2}\\left[\\cos\\tfrac{\\pi}{9} + i\\sin\\tfrac{\\pi}{9}\\right]$.',
            '$w_1 = \\sqrt[3]{2}\\left[\\cos\\tfrac{\\pi + 6\\pi}{9} + i\\sin\\tfrac{7\\pi}{9}\\right] = \\sqrt[3]{2}[\\cos\\tfrac{7\\pi}{9} + i\\sin\\tfrac{7\\pi}{9}]$.',
            '$w_2 = \\sqrt[3]{2}\\left[\\cos\\tfrac{13\\pi}{9} + i\\sin\\tfrac{13\\pi}{9}\\right]$.',
          ],
          final_answer: '$w_k = \\sqrt[3]{2}\\left[\\cos\\dfrac{\\pi + 6k\\pi}{9} + i\\sin\\dfrac{\\pi + 6k\\pi}{9}\\right]$, $k = 0, 1, 2$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
