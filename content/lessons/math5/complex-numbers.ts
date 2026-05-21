import type { Lesson } from '../types';

export const math5ComplexNumbers: Lesson = {
  subject: 'math5',
  topic: 'מספרים מרוכבים',
  title: 'מספרים מרוכבים — הצגות, פעולות ודה-מואבר',
  intro: `מספרים מרוכבים הם הרחבה של הממשיים — מוסיפים יחידה מדומה $i$ שמקיימת $i^2 = -1$. זה פותח את הדלת לפתרון כל משוואה ריבועית, גם כש-$\\Delta < 0$.

הנושא מופיע בשאלון 582 ומהווה כ-20 נקודות. שאלה אופיינית: "פעולות אלגבריות + הצגה קוטבית + נוסחת דה-מואבר".

מה תלמד פה:
- **הצגה אלגברית** $a + bi$ — חיבור, כפל, חילוק.
- **הצגה קוטבית** $r(\\cos\\theta + i\\sin\\theta)$ — גודל וארגומנט.
- **הצגה אקספוננציאלית** $re^{i\\theta}$ — הכי קצרה.
- **נוסחת דה-מואבר** — חזקות ושורשים.
- **גאומטריה במישור מרוכב** — מרחקים, מעגלים.

⚠️ **חוק זהב:** $i^2 = -1$, $i^3 = -i$, $i^4 = 1$ — חזר. חישוב חזקות גבוהות של $i$ דורש רק ידיעת המחזור 4.`,

  concepts: [
    {
      title: 'הצגה אלגברית $a + bi$',
      body: `**מה זה?** כל מספר מרוכב כתוב כ-$z = a + bi$ כאשר $a, b \\in \\mathbb{R}$ ו-$i^2 = -1$.
- $a$ = חלק ממשי: $\\text{Re}(z) = a$.
- $b$ = חלק מדומה: $\\text{Im}(z) = b$.

**פעולות:**
- **חיבור:** $(a+bi) + (c+di) = (a+c) + (b+d)i$.
- **כפל:** $(a+bi)(c+di) = (ac - bd) + (ad + bc)i$ (השתמש בפיתוח ובעובדה $i^2 = -1$).
- **צמוד:** $\\bar{z} = a - bi$. $z \\cdot \\bar{z} = a^2 + b^2 = |z|^2$.
- **חילוק:** $\\dfrac{z_1}{z_2} = \\dfrac{z_1 \\bar{z_2}}{|z_2|^2}$ — כפל בצמוד מכנה.

**גודל (מודול):** $|z| = \\sqrt{a^2 + b^2}$.

🎯 **בבגרות:** "חשב $\\dfrac{2+i}{1-i}$." → $\\dfrac{(2+i)(1+i)}{(1-i)(1+i)} = \\dfrac{2+2i+i-1}{2} = \\dfrac{1+3i}{2}$.`,
    },
    {
      title: 'הצגה קוטבית',
      body: `**מה זה?** כתיבת $z$ לפי גודלו וזוויתו: $z = r(\\cos\\theta + i\\sin\\theta)$.
- $r = |z| = \\sqrt{a^2 + b^2}$ — המודול.
- $\\theta = \\arg(z)$ — הארגומנט (הזווית שמכיוון $x$ חיובי לנקודה $z$).

**המרה מאלגברית לקוטבית:**
1. $r = \\sqrt{a^2 + b^2}$.
2. $\\theta = \\arctan(b/a)$, ותשים לב לרבע שבו $z$ נמצא.

**המרה חזרה:** $a = r\\cos\\theta$, $b = r\\sin\\theta$.

**כפל בהצגה קוטבית:** $z_1 z_2 = r_1 r_2 (\\cos(\\theta_1+\\theta_2) + i\\sin(\\theta_1+\\theta_2))$. — גדלים מוכפלים, זוויות מחוברות.

**חילוק:** גדלים מחולקים, זוויות מחוסרות.

🎯 **בבגרות:** "$z = 1 + i$. מצא הצגה קוטבית." → $r = \\sqrt{2}$, $\\theta = \\pi/4$ (רבע I). $z = \\sqrt{2}(\\cos(\\pi/4) + i\\sin(\\pi/4))$.`,
    },
    {
      title: 'הצגה אקספוננציאלית ונוסחת אוילר',
      body: `**נוסחת אוילר:** $e^{i\\theta} = \\cos\\theta + i\\sin\\theta$.

**הצגה קצרה:** $z = re^{i\\theta}$.

**כפל:** $z_1 z_2 = r_1 r_2 e^{i(\\theta_1 + \\theta_2)}$ — פשוט מאוד לחישוב!

**תוצאות מיידיות:**
- $e^{i\\pi} = -1$ (הנוסחה היפה של אוילר).
- $e^{i\\pi/2} = i$.
- $e^{2\\pi i} = 1$.

🎯 **בבגרות:** לרוב מספיק הצגה קוטבית. ההצגה האקספוננציאלית חוסכת כתיבה בשאלות עם חזקות.`,
    },
    {
      title: 'נוסחת דה-מואבר',
      body: `**מה זה?** נוסחה לחישוב חזקות מספרים מרוכבים:
$$z^n = r^n(\\cos(n\\theta) + i\\sin(n\\theta))$$

**שימוש:** עם הצגה קוטבית — מעלים את $r$ ב-$n$ ומכפילים את הזווית ב-$n$.

**שורשי $z^n = w$:** יש בדיוק $n$ שורשים:
$$z_k = \\sqrt[n]{r} \\left(\\cos\\frac{\\theta + 2\\pi k}{n} + i\\sin\\frac{\\theta + 2\\pi k}{n}\\right), \\quad k = 0, 1, \\ldots, n-1$$

**שורשי יחידה:** $z^n = 1$ → $r = 1$, $\\theta = 0$:
$$z_k = \\cos\\frac{2\\pi k}{n} + i\\sin\\frac{2\\pi k}{n}, \\quad k = 0, 1, \\ldots, n-1$$

שורשי היחידה ממוקמים על מעגל היחידה ומחולקים שווה-שווה (זוויות של $2\\pi/n$).

🎯 **בבגרות:** "חשב $(1+i)^8$." → $|1+i| = \\sqrt{2}$, $\\theta = \\pi/4$. $(\\sqrt{2})^8 = 16$. $\\cos(8 \\cdot \\pi/4) = \\cos(2\\pi) = 1$, $\\sin = 0$. תשובה: $16$.`,
    },
    {
      title: 'גאומטריה במישור מרוכב',
      body: `**מה זה?** כל מספר מרוכב $z = a+bi$ מיוצג כנקודה $(a, b)$ במישור (המישור הגאוסי).

**מרחק:** $|z_1 - z_2| = \\sqrt{(a_1-a_2)^2 + (b_1-b_2)^2}$ — מרחק אוקלידי.

**מעגל:** $|z - z_0| = r$ — כל הנקודות במרחק $r$ מ-$z_0$. (בדיוק כמו מעגל בקואורדינטות.)

**מיקום גיאומטרי:**
- $|z| = 1$: מעגל היחידה.
- $|z - 2| = |z + 2|$: קבוצת הנקודות השווה-מרחק מ-$2$ ומ-$-2$ = ציר $y$.

🎯 **בבגרות:** "מצא את הקבוצה $|z - (1+i)| = 2$." → מעגל עם מרכז $(1, 1)$ ורדיוס 2.`,
    },
  ],

  formulas: [
    {
      name: 'מכפלת צמודים',
      latex: 'z \\cdot \\bar{z} = |z|^2 = a^2 + b^2',
      variables: [
        { sym: 'z = a+bi', meaning: 'מספר מרוכב' },
        { sym: '\\bar{z} = a-bi', meaning: 'הצמוד' },
      ],
      note: 'משמשים לחישוב חילוק: $\\frac{z_1}{z_2} = \\frac{z_1 \\bar{z_2}}{|z_2|^2}$.',
    },
    {
      name: 'נוסחת דה-מואבר',
      latex: 'z^n = r^n\\bigl(\\cos(n\\theta) + i\\sin(n\\theta)\\bigr)',
      variables: [
        { sym: 'r', meaning: 'מודול $|z|$' },
        { sym: '\\theta', meaning: 'ארגומנט $\\arg(z)$' },
      ],
      note: 'עובד רק על הצגה קוטבית. לחישוב $z^n$ — הכן קוטבית קודם.',
    },
    {
      name: 'שורשי $z^n = 1$',
      latex: 'z_k = \\cos\\frac{2\\pi k}{n} + i\\sin\\frac{2\\pi k}{n}, \\quad k=0,1,\\ldots,n-1',
      variables: [
        { sym: 'n', meaning: 'מדרגת השורש' },
      ],
      note: '$n$ שורשי יחידה ממוקמים על מעגל היחידה, מחולקים שווה.',
    },
    {
      name: 'נוסחת אוילר',
      latex: 'e^{i\\theta} = \\cos\\theta + i\\sin\\theta',
      variables: [
        { sym: '\\theta', meaning: 'זווית ברדיאנים' },
      ],
      note: '$e^{i\\pi} + 1 = 0$ — הנוסחה היפה ביותר במתמטיקה.',
    },
  ],

  examples: [
    {
      difficulty: 'easy',
      problem: 'חשב $(3 + 2i)(1 - i)$.',
      steps: [
        '$(3+2i)(1-i) = 3 \\cdot 1 + 3 \\cdot(-i) + 2i \\cdot 1 + 2i \\cdot(-i)$.',
        '$= 3 - 3i + 2i - 2i^2 = 3 - i - 2(-1) = 3 - i + 2 = 5 - i$.',
      ],
      answer: '$5 - i$',
    },
    {
      difficulty: 'mid',
      problem: 'חשב $(1 + i\\sqrt{3})^6$ בעזרת דה-מואבר.',
      steps: [
        '$r = \\sqrt{1^2 + (\\sqrt{3})^2} = 2$. $\\theta = \\arctan(\\sqrt{3}/1) = \\pi/3$.',
        'דה-מואבר: $(1+i\\sqrt{3})^6 = 2^6(\\cos(6\\pi/3) + i\\sin(6\\pi/3)) = 64(\\cos(2\\pi) + i\\sin(2\\pi))$.',
        '$= 64(1 + 0) = 64$.',
      ],
      answer: '$64$',
    },
    {
      difficulty: 'hard',
      problem: 'מצא את כל שלושת שורשי $z^3 = 8$.',
      steps: [
        '$8 = 8e^{i \\cdot 0}$, לכן $r = 8$, $\\theta = 0$.',
        '$z_k = 2\\left(\\cos\\dfrac{2\\pi k}{3} + i\\sin\\dfrac{2\\pi k}{3}\\right)$, $k = 0, 1, 2$.',
        '$z_0 = 2(\\cos 0 + i\\sin 0) = 2$.',
        '$z_1 = 2(\\cos\\frac{2\\pi}{3} + i\\sin\\frac{2\\pi}{3}) = 2(-\\frac{1}{2} + i\\frac{\\sqrt{3}}{2}) = -1 + i\\sqrt{3}$.',
        '$z_2 = 2(\\cos\\frac{4\\pi}{3} + i\\sin\\frac{4\\pi}{3}) = -1 - i\\sqrt{3}$.',
      ],
      answer: '$z_0 = 2$, $z_1 = -1 + i\\sqrt{3}$, $z_2 = -1 - i\\sqrt{3}$',
    },
  ],

  pitfalls: [
    '$i^2 = -1$, לא $+1$. בכפל מורכב — תמיד שים לב לסימן כשמגיע $i^2$.',
    'ארגומנט תלוי ברבע: $\\arctan(b/a)$ נותן ערך בין $-\\pi/2$ ל-$\\pi/2$, אבל לרבעים II ו-III צריך להוסיף/לחסר $\\pi$.',
    'בחילוק: כופלים ב**צמוד המכנה** — לא ב-$\\bar{z_1}$ אלא ב-$\\bar{z_2}$.',
    'דה-מואבר: $n\\theta$ — **מכפילים את הזווית ב-$n$**. טעות נפוצה: לחבר $n$ לזווית.',
    'שורשי $z^n = w$: יש בדיוק $n$ שורשים שונים. לא לשכוח את כולם ($k = 0, 1, \\ldots, n-1$).',
  ],

  summary: [
    '**הצגה אלגברית:** $z = a+bi$. כפל: $(a+bi)(c+di) = (ac-bd)+(ad+bc)i$.',
    '**חילוק:** כפל בצמוד מכנה: $\\frac{z_1}{z_2} = \\frac{z_1\\bar{z_2}}{|z_2|^2}$.',
    '**מודול:** $|z| = \\sqrt{a^2+b^2}$. **ארגומנט:** $\\theta = \\arctan(b/a)$ + תיקון לרבע.',
    '**הצגה קוטבית:** $z = r(\\cos\\theta + i\\sin\\theta)$. **כפל:** גדלים מוכפלים, זוויות מחוברות.',
    '**דה-מואבר:** $z^n = r^n(\\cos n\\theta + i\\sin n\\theta)$.',
    '**שורשי יחידה $z^n = 1$:** $z_k = e^{2\\pi i k/n}$, $k = 0,\\ldots,n-1$ — על מעגל היחידה.',
    '**$i$ חזקות:** $i^1=i$, $i^2=-1$, $i^3=-i$, $i^4=1$. מחזור 4.',
  ],

  examTips: [
    '⭐ **לכל חזקה של $i$ — מצא שארית מחלוקה ב-4.** $i^{23} = i^{4\\cdot 5+3} = (i^4)^5 \\cdot i^3 = i^3 = -i$.',
    '🔥 **דה-מואבר = הצגה קוטבית קודם.** אם $z$ נתון באלגברית — המר לקוטבית, ואז $r^n, n\\theta$.',
    '⚠️ **ארגומנט ברבע שלישי ורביעי:** $\\arctan$ נותן ערך שלילי. לרבע III: $\\theta + \\pi$. לרבע IV: $\\theta + 2\\pi$ (או $\\theta$ שלילי).',
    '📐 **$|z_1 z_2| = |z_1||z_2|$.** שימושי לחישוב מהיר של $|$ביטוי$|$ בלי לחשב את הביטוי עצמו.',
    '🎯 **שורשי $z^n = w$:** הכן $w$ בקוטבית, חלק ב-$n$. אל תשכח את $k = 0, 1, \\ldots, n-1$ — כולם חשובים.',
  ],

  questions: [
    {
      id: 'cx-001',
      difficulty: 'easy',
      kind: 'mcq',
      question: 'מהו $i^{10}$?',
      answers: ['$-1$', '$1$', '$i$', '$-i$'],
      correct: 0,
      solution: {
        steps: [
          '$10 = 4 \\cdot 2 + 2$. לכן $i^{10} = (i^4)^2 \\cdot i^2 = 1 \\cdot i^2 = -1$.',
        ],
        finalAnswer: '$-1$',
        explanation: 'חזקות $i$ מחזוריות ב-4: $i^{4k} = 1$, $i^{4k+1} = i$, $i^{4k+2} = -1$, $i^{4k+3} = -i$.',
      },
    },
    {
      id: 'cx-002',
      difficulty: 'easy',
      kind: 'mcq',
      question: 'חשב $(2 + 3i) + (1 - i)$.',
      answers: ['$3 + 2i$', '$3 + 4i$', '$1 + 4i$', '$3 - 2i$'],
      correct: 0,
      solution: {
        steps: [
          'חיבור: ממשי + ממשי, מדומה + מדומה.',
          '$(2+1) + (3-1)i = 3 + 2i$.',
        ],
        finalAnswer: '$3 + 2i$',
        explanation: 'חיבור מרוכבים: חבר חלקים ממשיים ומדומים בנפרד.',
      },
    },
    {
      id: 'cx-003',
      difficulty: 'easy',
      kind: 'mcq',
      question: 'מהו $|3 + 4i|$?',
      answers: ['$5$', '$7$', '$\\sqrt{7}$', '$25$'],
      correct: 0,
      solution: {
        steps: [
          '$|3+4i| = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$.',
        ],
        finalAnswer: '$5$',
        explanation: 'מודול = שורש סכום ריבועי חלקים.',
      },
    },
    {
      id: 'cx-004',
      difficulty: 'easy',
      kind: 'mcq',
      question: 'מה הצמוד של $z = 2 - 5i$?',
      answers: ['$2 + 5i$', '$-2 + 5i$', '$2 - 5i$', '$5 - 2i$'],
      correct: 0,
      solution: {
        steps: [
          'הצמוד: $\\bar{z} = a - bi \\to a + bi$. כלומר $\\bar{z} = 2 + 5i$.',
        ],
        finalAnswer: '$2 + 5i$',
        explanation: 'צמוד = הופך את סימן החלק המדומה.',
      },
    },
    {
      id: 'cx-005',
      difficulty: 'mid',
      kind: 'mcq',
      question: 'חשב $\\dfrac{1+i}{1-i}$.',
      answers: ['$i$', '$1$', '$-i$', '$-1$'],
      correct: 0,
      solution: {
        steps: [
          'כפל בצמוד מכנה: $\\dfrac{(1+i)(1+i)}{(1-i)(1+i)} = \\dfrac{1+2i-1}{1+1} = \\dfrac{2i}{2} = i$.',
        ],
        finalAnswer: '$i$',
        explanation: 'חילוק מרוכב: כפל מונה ומכנה בצמוד המכנה.',
      },
    },
    {
      id: 'cx-006',
      difficulty: 'mid',
      kind: 'mcq',
      question: 'נתון $z = -1 + i$. מה הוא הארגומנט של $z$?',
      answers: ['$\\dfrac{3\\pi}{4}$', '$\\dfrac{\\pi}{4}$', '$-\\dfrac{\\pi}{4}$', '$\\dfrac{5\\pi}{4}$'],
      correct: 0,
      solution: {
        steps: [
          '$z = -1 + i$ נמצא ברבע II ($a < 0$, $b > 0$).',
          '$\\arctan(b/a) = \\arctan(-1) = -\\pi/4$ — אבל זה ברבע IV.',
          'ברבע II: $\\theta = -\\pi/4 + \\pi = 3\\pi/4$.',
        ],
        finalAnswer: '$\\dfrac{3\\pi}{4}$',
        explanation: 'ארגומנט ברבע II = $\\pi + \\arctan(b/a)$ (כשהתוצאה שלילית).',
      },
    },
    {
      id: 'cx-007',
      difficulty: 'mid',
      kind: 'open',
      question: 'פתור $z^2 + 2z + 5 = 0$ מעל $\\mathbb{C}$.',
      hint: 'השתמש בנוסחת השורשים. הדיסקרימיננטה תהיה שלילית — כתוב כ-$\\sqrt{-1}\\cdot\\sqrt{|\\Delta|}$.',
      solution: {
        steps: [
          '$\\Delta = 4 - 20 = -16$.',
          '$\\sqrt{-16} = 4i$.',
          '$z = \\dfrac{-2 \\pm 4i}{2} = -1 \\pm 2i$.',
        ],
        finalAnswer: '$z_1 = -1+2i$, $z_2 = -1-2i$',
        explanation: 'כש-$\\Delta < 0$: $\\sqrt{\\Delta} = i\\sqrt{|\\Delta|}$. שני שורשים מרוכבים צמודים.',
      },
    },
    {
      id: 'cx-008',
      difficulty: 'hard',
      kind: 'open',
      question: 'חשב $(\\sqrt{3} + i)^6$.',
      hint: 'המר לקוטבית: $r = 2$, $\\theta = \\pi/6$. אחר כך דה-מואבר.',
      solution: {
        steps: [
          '$|\\sqrt{3}+i| = \\sqrt{3+1} = 2$. $\\theta = \\arctan(1/\\sqrt{3}) = \\pi/6$.',
          'דה-מואבר: $z^6 = 2^6(\\cos(6\\pi/6) + i\\sin(\\pi)) = 64(\\cos\\pi + i\\sin\\pi) = 64(-1+0) = -64$.',
        ],
        finalAnswer: '$-64$',
        explanation: 'הצגה קוטבית + דה-מואבר הופכים חזקות גבוהות לקלות.',
      },
    },
    {
      id: 'cx-009',
      difficulty: 'hard',
      kind: 'open',
      question: 'מצא את כל ארבעת שורשי $z^4 = -16$.',
      hint: 'כתוב $-16 = 16e^{i\\pi}$. לאחר מכן $z_k = 2e^{i(\\pi + 2\\pi k)/4}$.',
      solution: {
        steps: [
          '$-16 = 16(\\cos\\pi + i\\sin\\pi)$, לכן $r = 16$, $\\theta = \\pi$.',
          '$z_k = 16^{1/4} \\cdot \\left(\\cos\\dfrac{\\pi+2\\pi k}{4} + i\\sin\\dfrac{\\pi+2\\pi k}{4}\\right) = 2\\left(\\cos\\dfrac{\\pi+2\\pi k}{4} + i\\sin\\dfrac{\\pi+2\\pi k}{4}\\right)$.',
          '$k=0$: $z_0 = 2(\\cos\\frac{\\pi}{4}+i\\sin\\frac{\\pi}{4}) = \\sqrt{2}(1+i)$.',
          '$k=1$: $z_1 = 2(\\cos\\frac{3\\pi}{4}+i\\sin\\frac{3\\pi}{4}) = \\sqrt{2}(-1+i)$.',
          '$k=2$: $z_2 = \\sqrt{2}(-1-i)$.',
          '$k=3$: $z_3 = \\sqrt{2}(1-i)$.',
        ],
        finalAnswer: '$z_k = \\sqrt{2}(\\pm 1 \\pm i)$ — ארבעה שורשים.',
        explanation: 'שורשי $z^n = w$: $n$ שורשים על מעגל רדיוס $|w|^{1/n}$, בזוויות $\\frac{\\theta + 2\\pi k}{n}$.',
      },
    },
    {
      id: 'cx-010',
      difficulty: 'hard',
      kind: 'open',
      question: 'אם $z = \\cos\\theta + i\\sin\\theta$ (על מעגל היחידה), הוכח ש-$z + 1/z = 2\\cos\\theta$.',
      hint: '$1/z = 1/e^{i\\theta} = e^{-i\\theta} = \\cos\\theta - i\\sin\\theta$.',
      solution: {
        steps: [
          '$1/z = \\cos\\theta - i\\sin\\theta$ (כי $|z|=1$ ולכן $1/z = \\bar{z}$).',
          '$z + 1/z = (\\cos\\theta + i\\sin\\theta) + (\\cos\\theta - i\\sin\\theta) = 2\\cos\\theta$ ✓.',
        ],
        finalAnswer: 'הוכח: $z + \\bar{z} = 2\\text{Re}(z) = 2\\cos\\theta$.',
        explanation: 'על מעגל היחידה: $1/z = \\bar{z}$. חיבור מספר לצמודו = פעמיים החלק הממשי.',
      },
    },
  ],

  bagrutQuestions: [
    {
      id: 'cx-bag-001',
      difficulty: 'mid',
      topic_tag: 'פעולות ודה-מואבר',
      context: 'נתון $z = 1 + i\\sqrt{3}$.',
      parts: [
        {
          label: 'א',
          prompt: 'מצא את $|z|$ ואת $\\arg(z)$, ורשום $z$ בהצגה קוטבית.',
          answer_type: 'expression',
          hints: [
            '$|z| = \\sqrt{a^2 + b^2}$.',
            '$\\theta = \\arctan(b/a)$. $z$ ברבע I.',
            'כתוב $z = r(\\cos\\theta + i\\sin\\theta)$.',
          ],
          solution: {
            steps: [
              '$|z| = \\sqrt{1 + 3} = 2$.',
              '$\\theta = \\arctan(\\sqrt{3}/1) = \\pi/3$.',
              '$z = 2(\\cos(\\pi/3) + i\\sin(\\pi/3))$.',
            ],
            final_answer: '$z = 2\\left(\\cos\\dfrac{\\pi}{3} + i\\sin\\dfrac{\\pi}{3}\\right)$',
          },
        },
        {
          label: 'ב',
          prompt: 'חשב $z^3$ ורשום בהצגה אלגברית.',
          answer_type: 'expression',
          hints: [
            'דה-מואבר: $z^3 = 2^3(\\cos(3 \\cdot \\pi/3) + i\\sin(3 \\cdot \\pi/3))$.',
            '$3 \\cdot \\pi/3 = \\pi$.',
            '$\\cos\\pi = -1$, $\\sin\\pi = 0$.',
          ],
          solution: {
            steps: [
              '$z^3 = 2^3(\\cos\\pi + i\\sin\\pi) = 8(-1 + 0) = -8$.',
            ],
            final_answer: '$z^3 = -8$',
          },
        },
        {
          label: 'ג',
          prompt: 'מצא את ערכי $n$ הטבעיים שעבורם $z^n$ ממשי.',
          answer_type: 'expression',
          hints: [
            '$z^n = 2^n(\\cos(n\\pi/3) + i\\sin(n\\pi/3))$.',
            'ממשי ⟺ $\\sin(n\\pi/3) = 0$ ⟺ $n\\pi/3 = k\\pi$.',
            'כלומר $n/3 = k$, כלומר $n$ מתחלק ב-3.',
          ],
          solution: {
            steps: [
              '$z^n = 2^n(\\cos(n\\pi/3) + i\\sin(n\\pi/3))$.',
              'ממשי ⟺ $\\sin(n\\pi/3) = 0$ ⟺ $n\\pi/3 \\in \\{k\\pi\\}$ ⟺ $n \\in \\{3k\\}$.',
            ],
            final_answer: '$n$ הוא כפולה של 3: $n = 3, 6, 9, \\ldots$',
          },
        },
      ],
    },
  ],
};
