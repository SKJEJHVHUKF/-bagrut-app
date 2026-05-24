import type { PastBagrutQuestion } from './types';

export const bagrut2023Summer582: PastBagrutQuestion[] = [
  {
    id: 'b2023s582-q1',
    year: 2023,
    season: 'summer',
    paper: '582',
    questionNumber: 1,
    topic: 'פונקציה מעריכית',
    totalPoints: 24,
    context: 'נתונה הפונקציה $f(x) = (x - 2)e^x$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את $f\'(x)$ ואת נקודות הקיצון של $f$.',
        points: 8,
        answer_type: 'expression',
        solution: {
          steps: [
            'כלל המכפלה: $f\'(x) = 1 \\cdot e^x + (x - 2) \\cdot e^x = e^x(1 + x - 2) = e^x(x - 1)$.',
            '$f\'(x) = 0$ → $e^x(x - 1) = 0$. $e^x \\ne 0$ תמיד, אז $x = 1$.',
            '$f(1) = (1 - 2) e^1 = -e$.',
            'סיווג: $f\'$ שלילי ל-$x < 1$, חיובי ל-$x > 1$ → מינימום.',
          ],
          final_answer: 'נקודת מינימום $(1, -e)$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את האסימפטוטה האופקית של $f$ (אם קיימת).',
        points: 6,
        answer_type: 'expression',
        solution: {
          steps: [
            'כש-$x \\to +\\infty$: $(x-2)e^x \\to \\infty$ (אקספוננציאלי גובר).',
            'כש-$x \\to -\\infty$: $e^x \\to 0$ (מהר מאוד), $(x-2) \\to -\\infty$ (לאט). מכפלה: $0$ (אקספוננציאלי גובר על פולינום).',
            'אסימפטוטה אופקית: $y = 0$ כאשר $x \\to -\\infty$.',
          ],
          final_answer: '$y = 0$ כאשר $x \\to -\\infty$',
        },
      },
      {
        label: 'ג',
        prompt: 'חשב את $\\displaystyle\\int_0^2 (x - 2)e^x\\,dx$.',
        points: 10,
        answer_type: 'expression',
        solution: {
          steps: [
            'אינטגרציה בחלקים: $u = x - 2$, $dv = e^x dx$. $du = dx$, $v = e^x$.',
            '$\\int (x-2) e^x dx = (x-2)e^x - \\int e^x dx = (x-2)e^x - e^x + C = (x - 3)e^x + C$.',
            'במסוים: $[(x-3)e^x]_0^2 = (2-3)e^2 - (-3)(1) = -e^2 + 3 = 3 - e^2$.',
          ],
          final_answer: '$3 - e^2$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2023s582-q2',
    year: 2023,
    season: 'summer',
    paper: '582',
    questionNumber: 2,
    topic: 'גאומטריה אנליטית',
    totalPoints: 22,
    context: 'נתונות שלוש נקודות: $A(0, 0)$, $B(6, 0)$, $C(3, 4)$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את משוואת המעגל החוסם את המשולש $\\triangle ABC$.',
        points: 12,
        answer_type: 'expression',
        solution: {
          steps: [
            'מרכז המעגל החוסם = מפגש האנכים האמצעיים של הצלעות.',
            'אמצע $AB$: $(3, 0)$, אנך אמצעי: $x = 3$.',
            'אמצע $AC$: $(1.5, 2)$. שיפוע $AC$: $\\dfrac{4}{3}$, ניצב: $-\\dfrac{3}{4}$. אנך: $y - 2 = -\\dfrac{3}{4}(x - 1.5)$.',
            'הצבת $x = 3$: $y - 2 = -\\dfrac{3}{4}(3 - 1.5) = -\\dfrac{3}{4} \\cdot 1.5 = -1.125$. $y = 0.875$.',
            'מרכז: $(3, 0.875)$. רדיוס $= $ מרחק ל-$A$: $\\sqrt{9 + 0.766} \\approx 3.125$.',
            'דיוק: $r^2 = 9 + 49/64 = 576/64 + 49/64 = 625/64$, $r = 25/8 = 3.125$.',
            'משוואה: $(x - 3)^2 + (y - \\tfrac{7}{8})^2 = \\tfrac{625}{64}$.',
          ],
          final_answer: '$(x - 3)^2 + \\left(y - \\dfrac{7}{8}\\right)^2 = \\dfrac{625}{64}$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את משוואת המשיק למעגל בנקודה $A$.',
        points: 10,
        answer_type: 'expression',
        solution: {
          steps: [
            'שיפוע הרדיוס מ-$(3, 7/8)$ ל-$A(0,0)$: $\\dfrac{0 - 7/8}{0 - 3} = \\dfrac{7/8}{3} = \\dfrac{7}{24}$.',
            'שיפוע המשיק: $-\\dfrac{24}{7}$.',
            'משוואה דרך $A(0,0)$: $y = -\\dfrac{24}{7}x$.',
          ],
          final_answer: '$y = -\\dfrac{24}{7}x$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2023s582-q3',
    year: 2023,
    season: 'summer',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 20,
    context: 'נתון המספר המרוכב $z$ המקיים $|z - 2i| = 3$.',
    parts: [
      {
        label: 'א',
        prompt: 'מהו המקום הגיאומטרי של $z$ במישור גאוס?',
        points: 5,
        answer_type: 'text',
        solution: {
          steps: [
            '$|z - 2i| = 3$ פירושו: כל הנקודות $z$ במישור גאוס שהמרחק שלהן מהנקודה $2i$ (= $(0, 2)$) שווה $3$.',
            'זהו מעגל ברדיוס $3$ סביב הנקודה $(0, 2)$.',
          ],
          final_answer: 'מעגל סביב $(0, 2)$ ברדיוס $3$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את הערך המקסימלי והמינימלי של $|z|$.',
        points: 8,
        answer_type: 'expression',
        solution: {
          steps: [
            '$|z|$ = מרחק $z$ מהראשית.',
            'הראשית $(0, 0)$ מרוחקת $2$ ממרכז המעגל $(0, 2)$.',
            'מרחק מקסימלי לנקודה על מעגל: מרחק לאמצע + רדיוס $= 2 + 3 = 5$.',
            'מרחק מינימלי: מרחק לאמצע - רדיוס $= 2 - 3 = -1$. אבל מרחק $\\ge 0$, אז $= 0$? לא, מאחר ש-$|2 - 3| = 1$, וזה אמיתי כי הראשית **בתוך** המעגל (מרחק $2 <$ רדיוס $3$).',
            'אז: $|z|_{\\max} = 5$, $|z|_{\\min} = |2 - 3| = 1$ (כי הראשית בתוך המעגל).',
          ],
          final_answer: '$|z|_{\\max} = 5$, $|z|_{\\min} = 1$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצא את הערכים של $z$ שעבורם $|z|$ מקסימלי ומינימלי.',
        points: 7,
        answer_type: 'expression',
        solution: {
          steps: [
            'הנקודות שמרחיקות/מקרבות את $z$ מהראשית הן על הקו המחבר את הראשית עם מרכז המעגל = ציר $y$.',
            'מרכז $(0, 2)$, רדיוס $3$. הנקודות על ציר $y$ במעגל: $(0, 2 - 3) = (0, -1)$ ו-$(0, 2 + 3) = (0, 5)$.',
            'מקסימום: $z = 5i$ (גם $|5i| = 5$).',
            'מינימום: $z = -i$ (גם $|-i| = 1$).',
          ],
          final_answer: '$z_{\\max} = 5i$, $z_{\\min} = -i$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  {
    id: 'b2023s582-q4',
    year: 2023,
    season: 'summer',
    paper: '582',
    questionNumber: 4,
    topic: 'חשבון אינטגרלי',
    totalPoints: 22,
    context: 'נתונה הפונקציה $f(x) = \\sin x \\cos x$ בתחום $[0, \\pi]$.',
    parts: [
      {
        label: 'א',
        prompt: 'הוכח ש-$f(x) = \\tfrac{1}{2}\\sin 2x$.',
        points: 4,
        answer_type: 'proof',
        solution: {
          steps: [
            'נוסחת כפל-זווית: $\\sin 2x = 2\\sin x\\cos x$.',
            'חלוקה ב-$2$: $\\sin x\\cos x = \\tfrac{1}{2}\\sin 2x = f(x)$ ✓.',
          ],
          final_answer: 'הוכח',
        },
      },
      {
        label: 'ב',
        prompt: 'מצא את נקודות החיתוך של $f$ עם ציר $x$ בתחום הנתון.',
        points: 5,
        answer_type: 'expression',
        solution: {
          steps: [
            '$f(x) = 0$ → $\\tfrac{1}{2}\\sin 2x = 0$ → $\\sin 2x = 0$ → $2x = k\\pi$ → $x = \\tfrac{k\\pi}{2}$.',
            'בתחום $[0, \\pi]$: $x = 0, \\tfrac{\\pi}{2}, \\pi$.',
          ],
          final_answer: '$x \\in \\{0, \\tfrac{\\pi}{2}, \\pi\\}$',
        },
      },
      {
        label: 'ג',
        prompt: 'חשב את השטח הכלוא בין הגרף $f$ לציר $x$ בתחום $[0, \\pi]$ (סכום הערכים המוחלטים בכל תת-תחום).',
        points: 13,
        answer_type: 'expression',
        solution: {
          steps: [
            'מסעיף ב: $f$ מתאפסת ב-$0, \\pi/2, \\pi$. סימן $f$ בכל תת-תחום:',
            '$x \\in (0, \\pi/2)$: $\\sin x > 0, \\cos x > 0$ → $f > 0$.',
            '$x \\in (\\pi/2, \\pi)$: $\\sin x > 0, \\cos x < 0$ → $f < 0$.',
            'אינטגרל $\\int f\\,dx = \\int \\tfrac{1}{2}\\sin 2x\\,dx = -\\tfrac{1}{4}\\cos 2x + C$.',
            'תת-תחום 1: $\\int_0^{\\pi/2} f\\,dx = [-\\tfrac{1}{4}\\cos 2x]_0^{\\pi/2} = -\\tfrac{1}{4}(\\cos\\pi - \\cos 0) = -\\tfrac{1}{4}(-1 - 1) = \\tfrac{1}{2}$.',
            'תת-תחום 2: $\\int_{\\pi/2}^{\\pi} f\\,dx = -\\tfrac{1}{4}(\\cos 2\\pi - \\cos\\pi) = -\\tfrac{1}{4}(1 - (-1)) = -\\tfrac{1}{2}$. ערך מוחלט: $\\tfrac{1}{2}$.',
            'סה"כ שטח: $\\tfrac{1}{2} + \\tfrac{1}{2} = 1$.',
          ],
          final_answer: '$S = 1$ יחידת שטח',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
