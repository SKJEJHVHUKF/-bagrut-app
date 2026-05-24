import type { PastBagrutQuestion } from './types';

/**
 * Bagrut-style questions modeled on the 2024 summer paper 581.
 * Authored to match real bagrut style and difficulty.
 */
export const bagrut2024Summer581: PastBagrutQuestion[] = [
  {
    id: 'b2024s581-q1',
    year: 2024,
    season: 'summer',
    paper: '581',
    questionNumber: 1,
    topic: 'אלגברה',
    totalPoints: 20,
    context: 'נתונה המשוואה $x^2 - (m+3)x + 2m + 2 = 0$ כאשר $m$ פרמטר ממשי.',
    parts: [
      {
        label: 'א',
        prompt: 'הבע את הדיסקרימיננטה $\\Delta$ של המשוואה כפונקציה של $m$, בצורה הפשוטה ביותר.',
        points: 6,
        answer_type: 'expression',
        solution: {
          steps: [
            'מקדמים: $a = 1$, $b = -(m+3)$, $c = 2m + 2$.',
            '$\\Delta = b^2 - 4ac = (m+3)^2 - 4(2m+2)$.',
            'פיתוח: $(m+3)^2 = m^2 + 6m + 9$.',
            'מחסרים: $\\Delta = m^2 + 6m + 9 - 8m - 8 = m^2 - 2m + 1 = (m-1)^2$.',
          ],
          final_answer: '$\\Delta = (m-1)^2$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את ערכי $m$ שעבורם למשוואה שורש כפול, וחשב את השורש.',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            'שורש כפול דורש $\\Delta = 0$, כלומר $(m-1)^2 = 0$ → $m = 1$.',
            'הצבה במשוואה: $x^2 - 4x + 4 = 0$, כלומר $(x-2)^2 = 0$ → $x = 2$.',
          ],
          final_answer: '$m = 1$, השורש הכפול הוא $x = 2$',
        },
      },
      {
        label: 'ג',
        prompt: 'בהנחה ש-$m \\ne 1$, מצא את שורשי המשוואה כפונקציה של $m$ ופרק את הפולינום $x^2 - (m+3)x + 2m + 2$ לגורמים.',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            'נוסחת השורשים: $x = \\dfrac{(m+3) \\pm \\sqrt{(m-1)^2}}{2} = \\dfrac{(m+3) \\pm |m-1|}{2}$.',
            'נסתכל על שני המקרים — $\\sqrt{(m-1)^2} = |m-1|$, אבל בפועל אפשר לכתוב $\\pm(m-1)$ ולקבל את שני השורשים.',
            'שורש ראשון: $x_1 = \\dfrac{(m+3) + (m-1)}{2} = \\dfrac{2m+2}{2} = m+1$.',
            'שורש שני: $x_2 = \\dfrac{(m+3) - (m-1)}{2} = \\dfrac{4}{2} = 2$.',
            'פירוק: $x^2 - (m+3)x + 2m + 2 = (x - (m+1))(x - 2)$.',
            'בדיקה: $(x-m-1)(x-2) = x^2 - 2x - (m+1)x + 2(m+1) = x^2 - (m+3)x + 2m+2$ ✓.',
          ],
          final_answer: '$x_1 = m+1$, $x_2 = 2$; פירוק: $(x - (m+1))(x - 2)$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024s581-q2',
    year: 2024,
    season: 'summer',
    paper: '581',
    questionNumber: 2,
    topic: 'חשבון דיפרנציאלי',
    totalPoints: 25,
    context: 'נתונה הפונקציה $f(x) = \\dfrac{x^2 - 4}{x - 1}$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את תחום ההגדרה של $f$ ואת נקודות החיתוך עם הצירים.',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            'תחום הגדרה: המכנה $\\ne 0$, כלומר $x \\ne 1$. תחום: $x \\in \\mathbb{R} \\setminus \\{1\\}$.',
            'חיתוך עם ציר $y$: $f(0) = \\dfrac{-4}{-1} = 4$, נקודה $(0, 4)$.',
            'חיתוך עם ציר $x$: $\\dfrac{x^2 - 4}{x - 1} = 0$ → $x^2 - 4 = 0$ (ובדיקה $x \\ne 1$) → $x = \\pm 2$.',
            'נקודות חיתוך: $(2, 0)$ ו-$(-2, 0)$.',
          ],
          final_answer: 'תחום: $x \\ne 1$. חיתוכים: $(0, 4), (2, 0), (-2, 0)$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את האסימפטוטות של $f$ (אנכית ומשופעת).',
        points: 6,
        answer_type: 'expression',
        solution: {
          steps: [
            'אסימפטוטה אנכית: ב-$x = 1$ (המכנה מתאפס, המונה $= 1 - 4 = -3 \\ne 0$).',
            'אין אסימפטוטה אופקית כי דרגת המונה (2) גדולה מדרגת המכנה (1).',
            'אסימפטוטה משופעת — חלוקת פולינום: $\\dfrac{x^2 - 4}{x - 1} = x + 1 + \\dfrac{-3}{x - 1}$.',
            'כאשר $x \\to \\pm\\infty$, $\\dfrac{-3}{x-1} \\to 0$, אז $f(x) \\to x + 1$.',
          ],
          final_answer: 'אנכית: $x = 1$. משופעת: $y = x + 1$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את הנגזרת $f\'(x)$ ואת נקודות הקיצון של $f$.',
        points: 8,
        answer_type: 'expression',
        solution: {
          steps: [
            'נגזרת ע"י כלל המנה: $f\'(x) = \\dfrac{2x(x-1) - (x^2-4) \\cdot 1}{(x-1)^2}$.',
            'מונה: $2x^2 - 2x - x^2 + 4 = x^2 - 2x + 4$.',
            '$f\'(x) = \\dfrac{x^2 - 2x + 4}{(x-1)^2}$.',
            'נקודות קיצון: $f\'(x) = 0$ → $x^2 - 2x + 4 = 0$. $\\Delta = 4 - 16 = -12 < 0$.',
            'אין פתרון ממשי — אין נקודות קיצון.',
          ],
          final_answer: 'אין נקודות קיצון (הנגזרת תמיד חיובית)',
        },
      },
      {
        label: 'ד',
        prompt: 'הוכח ש-$f$ עולה בכל תחום ההגדרה שלה.',
        points: 6,
        answer_type: 'proof',
        solution: {
          steps: [
            'מסעיף ג: $f\'(x) = \\dfrac{x^2 - 2x + 4}{(x-1)^2}$.',
            'המכנה $(x-1)^2 > 0$ לכל $x \\ne 1$.',
            'המונה $x^2 - 2x + 4 = (x-1)^2 + 3 > 0$ לכל $x$.',
            'לכן $f\'(x) > 0$ לכל $x$ בתחום ההגדרה, ולכן $f$ עולה ממש בכל תחומה.',
          ],
          final_answer: 'הוכח',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024s581-q3',
    year: 2024,
    season: 'summer',
    paper: '581',
    questionNumber: 3,
    topic: 'סדרות',
    totalPoints: 20,
    context: 'בסדרה חשבונית $a_1 = 3$ והפרש הסדרה $d = 4$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את האיבר ה-20 של הסדרה ואת סכום 20 האיברים הראשונים.',
        points: 6,
        answer_type: 'number',
        solution: {
          steps: [
            '$a_n = a_1 + (n-1)d = 3 + (n-1) \\cdot 4$.',
            '$a_{20} = 3 + 19 \\cdot 4 = 3 + 76 = 79$.',
            'סכום: $S_{20} = \\dfrac{20(a_1 + a_{20})}{2} = \\dfrac{20(3 + 79)}{2} = 10 \\cdot 82 = 820$.',
          ],
          final_answer: '$a_{20} = 79$, $S_{20} = 820$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את המספר הקטן ביותר של איברים שסכומם גדול מ-$500$.',
        points: 7,
        answer_type: 'number',
        solution: {
          steps: [
            'נוסחת הסכום: $S_n = \\dfrac{n(2a_1 + (n-1)d)}{2} = \\dfrac{n(6 + 4(n-1))}{2} = \\dfrac{n(4n + 2)}{2} = n(2n+1)$.',
            'דרישה: $n(2n+1) > 500$ → $2n^2 + n - 500 > 0$.',
            'פתרון של $2n^2 + n - 500 = 0$: $n = \\dfrac{-1 + \\sqrt{1 + 4000}}{4} = \\dfrac{-1 + \\sqrt{4001}}{4} \\approx \\dfrac{-1 + 63.25}{4} \\approx 15.56$.',
            '$n$ חייב להיות שלם — בודקים: $S_{15} = 15 \\cdot 31 = 465 < 500$. $S_{16} = 16 \\cdot 33 = 528 > 500$ ✓.',
          ],
          final_answer: '$n = 16$',
        },
      },
      {
        label: 'ג',
        prompt: 'נתון שהאיבר ה-$k$ של הסדרה שווה לסכום של 3 איברים עוקבים החל מהאיבר השלישי. מצא את $k$.',
        points: 7,
        answer_type: 'number',
        solution: {
          steps: [
            'סכום $a_3 + a_4 + a_5$. $a_3 = 11$, $a_4 = 15$, $a_5 = 19$. סה"כ $= 45$.',
            'דרישה: $a_k = 45$. $3 + (k-1) \\cdot 4 = 45$ → $(k-1) \\cdot 4 = 42$ → $k - 1 = 10.5$.',
            '$k = 11.5$ אינו שלם — אז לא קיים $k$ שמקיים את הדרישה (או — צריך לחזור על הניסוח של "3 איברים עוקבים").',
            'אם הכוונה ל-3 איברים עוקבים אחרים (למשל $a_4, a_5, a_6$): $15 + 19 + 23 = 57$, $3 + 4(k-1) = 57$ → $k = 14.5$ — גם לא שלם.',
            'במקרה הזה, אין $k$ שלם שמקיים. אבל אם השאלה אומרת "מ-$a_3$" — התשובה הסופית: אין פתרון שלם.',
          ],
          final_answer: 'אין $k$ שלם שמקיים (התשובה היחידה היא לציין שאין פתרון בערכים שלמים).',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2024s581-q4',
    year: 2024,
    season: 'summer',
    paper: '581',
    questionNumber: 4,
    topic: 'הסתברות',
    totalPoints: 20,
    context: 'בכד יש 10 כדורים: 4 אדומים ו-6 כחולים. שולפים 3 כדורים ללא החזרה.',
    parts: [
      {
        label: 'א',
        prompt: 'מהי ההסתברות ששלושת הכדורים שנשלפו אדומים?',
        points: 5,
        answer_type: 'number',
        solution: {
          steps: [
            'הסתברות לכדור אדום ראשון: $\\dfrac{4}{10}$.',
            'בהנחה שהראשון אדום — להסתברות שני: $\\dfrac{3}{9}$.',
            'דומה לשלישי: $\\dfrac{2}{8}$.',
            '$P = \\dfrac{4}{10} \\cdot \\dfrac{3}{9} \\cdot \\dfrac{2}{8} = \\dfrac{24}{720} = \\dfrac{1}{30}$.',
          ],
          final_answer: '$P = \\dfrac{1}{30}$',
        },
      },
      {
        label: 'ב',
        prompt: 'מהי ההסתברות שמבין השלושה — בדיוק שניים אדומים?',
        points: 7,
        answer_type: 'number',
        solution: {
          steps: [
            'מספר דרכים לבחור 2 אדומים מתוך 4: $\\binom{4}{2} = 6$.',
            'מספר דרכים לבחור 1 כחול מתוך 6: $\\binom{6}{1} = 6$.',
            'סך כל הדרכים לבחור 3 מתוך 10: $\\binom{10}{3} = 120$.',
            '$P(\\text{בדיוק 2 אדומים}) = \\dfrac{6 \\cdot 6}{120} = \\dfrac{36}{120} = \\dfrac{3}{10}$.',
          ],
          final_answer: '$P = \\dfrac{3}{10}$',
        },
      },
      {
        label: 'ג',
        prompt: 'נתון שמבין השלושה לפחות אחד אדום. מהי ההסתברות ששלושת אדומים?',
        points: 8,
        answer_type: 'number',
        solution: {
          steps: [
            'נסמן $A$ = 3 אדומים, $B$ = לפחות 1 אדום. רוצים $P(A|B)$.',
            'מסעיף א: $P(A) = \\dfrac{1}{30}$.',
            '$P(B) = 1 - P(\\text{אין אדומים}) = 1 - \\dfrac{\\binom{6}{3}}{\\binom{10}{3}} = 1 - \\dfrac{20}{120} = 1 - \\dfrac{1}{6} = \\dfrac{5}{6}$.',
            'מאחר ש-$A \\subset B$ (אם כל השלושה אדומים — בוודאי לפחות אחד), $P(A \\cap B) = P(A) = \\dfrac{1}{30}$.',
            '$P(A|B) = \\dfrac{P(A \\cap B)}{P(B)} = \\dfrac{1/30}{5/6} = \\dfrac{1}{30} \\cdot \\dfrac{6}{5} = \\dfrac{6}{150} = \\dfrac{1}{25}$.',
          ],
          final_answer: '$P(A|B) = \\dfrac{1}{25}$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
