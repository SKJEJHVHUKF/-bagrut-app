/**
 * שאלון 35571 — קיץ תשפ"ב (2022), מועד א' (4 יחידות לימוד)
 * ========================================================
 *
 * מקור השאלות: שאלון משרד החינוך 35571, קיץ תשפ"ב 2022 מועד א' (נחלת הכלל).
 * הפתרונות נפתרו, נכתבו ואומתו על-ידינו בסגנון האפליקציה (פתרון עצמאי מאפס +
 * סקריפט אימות עצמאי לכל שאלה) — לא הועתקו מאף מקור.
 *
 * תוכן (מתווסף בהדרגה):
 *   Q1 — אינדוקציה: הוכחת התחלקות $4^n-1$ ב-$3$, ומציאת $p$ שעבורו
 *        $4^{n+1}+p$ מתחלק ב-$12$.
 *   Q2 — חקירת f(x)=(2-1/x)^3: תחום, אסימפטוטות, נגזרת אי-שלילית, אסימפטוטת
 *        הנגזרת (y=0), שתי נקודות פיתול (1/2,0) ו-(1,1), וסקיצה.
 *   Q3 — אינטגרל/צבירת שטח h(t)=∫f (גרף f קווי-למקוטעין): h(0)=0, h(3)=7,
 *        h(5)=5, ותחומי עלייה/ירידה + מקסימום (3,7).
 *   Q4 — גאומטריה: מעגל חסום במשולש DEF, משולש-מגע ABC שווה-שוקיים (ראש 2α);
 *        הוכחת ∠D=∠E=2α (זווית משיק-מיתר + משיקים שווים) ו-∠F=180-4α.
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2022Summer571MoedA: PastBagrutQuestion[] = [
  {
    id: 'b2022s571a-q1',
    year: 2022,
    season: 'summer',
    moed: 'a',
    paper: '571',
    questionNumber: 1,
    topic: 'אינדוקציה',
    // הערה: ניקוד השאלה הוא הערכה — יש לאמת מול השאלון הרשמי.
    totalPoints: 25,
    context:
      'בשאלה זו נעסוק בהתחלקות (חלוקה ללא שארית) של ביטויים המבוססים על חזקות של $4$. סעיף ב מסתמך על התוצאה של סעיף א.',
    parts: [
      {
        label: 'א',
        prompt: 'הוכיחו כי הביטוי $4^n - 1$ מתחלק ב-$3$ ללא שארית לכל $n$ טבעי.',
        answer_type: 'proof',
        hints: [
          'זו הוכחה באינדוקציה: בדקו את הבסיס $n = 1$, הניחו נכונות עבור $n = k$, והוכיחו עבור $n = k + 1$.',
          'בצעד האינדוקציה כתבו $4^{k+1} - 1 = 4 \\cdot 4^k - 1$, ונסו להוסיף ולחסר כדי לחלץ את $4^k - 1$ (הנחת האינדוקציה).',
        ],
        solution: {
          steps: [
            'נוכיח באינדוקציה על $n$ שהביטוי $4^n - 1$ מתחלק ב-$3$.',
            'בסיס האינדוקציה, $n = 1$: $\\;4^1 - 1 = 3 = 3 \\cdot 1$, ולכן מתחלק ב-$3$.',
            'הנחת האינדוקציה: נניח שעבור $n = k$ הביטוי מתחלק ב-$3$, כלומר $\\;4^k - 1 = 3m$ עבור $m$ שלם.',
            'צעד האינדוקציה: נוכיח שגם $4^{k+1} - 1$ מתחלק ב-$3$.',
            'נפתח: $\\;4^{k+1} - 1 = 4 \\cdot 4^k - 1$.',
            'נוסיף ונחסר $4$: $\\;4 \\cdot 4^k - 4 + 3 = 4\\,(4^k - 1) + 3$.',
            'לפי הנחת האינדוקציה $4^k - 1 = 3m$: $\\;4 \\cdot 3m + 3 = 3\\,(4m + 1)$.',
            'קיבלנו כפולה של $3$, ולכן $4^{k+1} - 1$ מתחלק ב-$3$.',
            'לפי עקרון האינדוקציה, $4^n - 1$ מתחלק ב-$3$ ללא שארית לכל $n$ טבעי.',
          ],
          final_answer: 'הוכח: $4^n - 1$ מתחלק ב-$3$ ללא שארית לכל $n$ טבעי (בהוכחה באינדוקציה).',
        },
      },
      {
        label: 'ב',
        prompt: 'מצאו דוגמה ל-$p$ שעבורו הביטוי $4^{n+1} + p$ מתחלק ב-$12$ ללא שארית, לכל $n$ טבעי.',
        answer_type: 'number',
        hints: [
          'קשרו לסעיף א: כתבו $4^{n+1} + p = 4\\,(4^n - 1) + (4 + p)$.',
          'החלק $4\\,(4^n - 1)$ כבר מתחלק ב-$12$ (כי $4^n - 1$ מתחלק ב-$3$). מה צריך $4 + p$ לקיים?',
        ],
        solution: {
          steps: [
            'נקשר את הביטוי לתוצאה מסעיף א. נכתוב $\\;4^{n+1} + p = 4 \\cdot 4^n + p$.',
            'נוסיף ונחסר $4$: $\\;4 \\cdot 4^n - 4 + 4 + p = 4\\,(4^n - 1) + (4 + p)$.',
            'מסעיף א $4^n - 1 = 3m$, ולכן $\\;4\\,(4^n - 1) = 12m$ — מתחלק ב-$12$.',
            'לכן כדי ש-$4^{n+1} + p$ יתחלק ב-$12$, די שגם המחובר $4 + p$ יתחלק ב-$12$.',
            'נבחר את הדוגמה הפשוטה ביותר: $\\;4 + p = 12$, כלומר $p = 8$.',
            'בדיקה: $\\;4^{n+1} + 8 = 4\\,(4^n - 1) + 12 = 12m + 12 = 12\\,(m + 1)$ — מתחלק ב-$12$.',
          ],
          final_answer:
            'דוגמה: $p = 8$ (ובכלל כל $p = 8 + 12t$, $t$ שלם אי-שלילי). אז $4^{n+1} + p = 12\\,(m + 1)$ מתחלק ב-$12$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2022s571a-q2',
    year: 2022,
    season: 'summer',
    moed: 'a',
    paper: '571',
    questionNumber: 2,
    topic: 'חקירת פונקציות',
    // הערה: ניקוד השאלה הוא הערכה — יש לאמת מול השאלון הרשמי.
    totalPoints: 25,
    context: 'נתונה הפונקצייה $f(x) = \\left(2 - \\dfrac{1}{x}\\right)^3$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצאו את תחום ההגדרה של $f(x)$ ואת משוואות האסימפטוטות שלה (האנכית והאופקית).',
        answer_type: 'expression',
        hints: [
          'תחום ההגדרה: היכן המכנה $x$ אינו מתאפס.',
          'אסימפטוטה אנכית: בדקו את הגבול כאשר $x \\to 0$. אסימפטוטה אופקית: הגבול כאשר $x \\to \\pm\\infty$.',
        ],
        solution: {
          steps: [
            'תחום ההגדרה: הביטוי $\\dfrac{1}{x}$ מוגדר לכל $x \\ne 0$, ולכן תחום ההגדרה הוא $\\;x \\ne 0$.',
            'אסימפטוטה אנכית — כאשר $x \\to 0^+$: $\\;\\dfrac{1}{x} \\to +\\infty$, ולכן $2 - \\dfrac{1}{x} \\to -\\infty$ ו-$f(x) \\to -\\infty$.',
            'כאשר $x \\to 0^-$: $\\;\\dfrac{1}{x} \\to -\\infty$, ולכן $2 - \\dfrac{1}{x} \\to +\\infty$ ו-$f(x) \\to +\\infty$; מכאן ש-$x = 0$ אסימפטוטה אנכית.',
            'אסימפטוטה אופקית — כאשר $x \\to \\pm\\infty$: $\\;\\dfrac{1}{x} \\to 0$, ולכן $2 - \\dfrac{1}{x} \\to 2$ ו-$f(x) \\to 2^3 = 8$.',
            'לכן $\\;y = 8$ אסימפטוטה אופקית (בשני הכיוונים).',
          ],
          final_answer: 'תחום ההגדרה: $\\;x \\ne 0$. אסימפטוטה אנכית: $\\;x = 0$; אסימפטוטה אופקית: $\\;y = 8$.',
        },
      },
      {
        label: 'ב',
        prompt:
          'מצאו את הנגזרת $f\'(x)$, הראו כי $f(x)$ עולה בכל תחום הגדרתה, וקבעו את משוואת האסימפטוטה האופקית של גרף הנגזרת $f\'(x)$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-5, 8],
            yRange: [0, 8],
            curves: [
              { fn: (x) => (3 * (2 - 1 / x) ** 2) / x ** 2, domain: [-5, -0.22], color: '#059669' },
              { fn: (x) => (3 * (2 - 1 / x) ** 2) / x ** 2, domain: [0.22, 8], color: '#059669' },
            ],
            vAsymptotes: [{ x: 0, label: 'x=0' }],
            hAsymptotes: [{ y: 0, label: 'y=0' }],
            markedPoints: [{ x: 0.5, y: 0, label: "f'=0" }],
            caption:
              'גרף הנגזרת $f\'(x) = \\dfrac{3\\left(2 - 1/x\\right)^2}{x^2}$: כולו אי-שלילי ($\\ge 0$), עם אסימפטוטה אנכית $x = 0$ ואסימפטוטה אופקית $y = 0$. מתאפס ב-$x = \\tfrac{1}{2}$ (משיק אופקי של $f$).',
          },
        ],
        hints: [
          'גזרו בכלל השרשרת: החזקה השלישית של $2 - \\tfrac{1}{x}$, כאשר נגזרת הפנימי היא $\\tfrac{1}{x^2}$.',
          'שימו לב לסימן של $f\'(x)$ — יש בו ריבוע במונה וריבוע במכנה.',
          'לאסימפטוטת $f\'$: מכיוון ש-$f \\to 8$ (מתייצבת), מה קורה לנגזרת בקצוות?',
        ],
        solution: {
          steps: [
            'נגזור בכלל השרשרת. הפנימי הוא $2 - \\dfrac{1}{x}$, ונגזרתו $\\dfrac{1}{x^2}$.',
            '$f\'(x) = 3\\left(2 - \\dfrac{1}{x}\\right)^2 \\cdot \\dfrac{1}{x^2} = \\dfrac{3\\left(2 - \\tfrac{1}{x}\\right)^2}{x^2}$.',
            'המונה $3\\left(2 - \\tfrac{1}{x}\\right)^2 \\ge 0$ (ריבוע) והמכנה $x^2 > 0$, ולכן $\\;f\'(x) \\ge 0$ לכל $x \\ne 0$.',
            'הנגזרת אינה שלילית, ולכן $f(x)$ עולה בכל אחד מענפי תחום הגדרתה (ב-$x = \\tfrac{1}{2}$ יש משיק אופקי, אך ללא שינוי מגמה).',
            'אסימפטוטת הנגזרת: מכיוון שבקצוות $f(x) \\to 8$ (מתייצבת), הנגזרת שואפת לאפס, $\\;f\'(x) \\to 0$ כאשר $x \\to \\pm\\infty$.',
            'לכן לגרף $f\'(x)$ יש אסימפטוטה אופקית $\\;y = 0$ (וכולו מעל ציר $x$ או עליו, כי $f\' \\ge 0$).',
          ],
          final_answer:
            '$f\'(x) = \\dfrac{3\\left(2 - \\tfrac{1}{x}\\right)^2}{x^2} \\ge 0$, ולכן $f$ עולה בכל תחום הגדרתה. אסימפטוטת הנגזרת: $\\;y = 0$.',
        },
      },
      {
        label: 'ג',
        prompt: 'מצאו את נקודות הפיתול של $f(x)$, וקבעו כמה יש.',
        answer_type: 'expression',
        hints: [
          'נקודת פיתול: היכן $f\'\'(x) = 0$ ומשנה סימן.',
          'גזרו שנית את $f\'(x) = \\dfrac{3(2 - 1/x)^2}{x^2}$; אפשר לפשט ל-$f\'\'(x) = \\dfrac{12(2x - 1)(1 - x)}{x^5}$.',
          'מצאו את אפסי המונה ובדקו שינויי סימן (זכרו ש-$x = 0$ אינו בתחום).',
        ],
        solution: {
          steps: [
            'נגזור שנית ונפשט: $\\;f\'\'(x) = \\dfrac{12(2x - 1)(1 - x)}{x^5}$.',
            'מאפסים: $\\;f\'\'(x) = 0$ כאשר $2x - 1 = 0$ או $1 - x = 0$, כלומר $x = \\tfrac{1}{2}$ או $x = 1$.',
            'סביב $x = \\tfrac{1}{2}$: $f\'\'$ עובר ממינוס לפלוס — שינוי קעירות, ולכן נקודת פיתול.',
            'סביב $x = 1$: $f\'\'$ עובר מפלוס למינוס — שינוי קעירות, ולכן נקודת פיתול.',
            'הנקודה $x = 0$ אינה בתחום ההגדרה, ולכן אינה נקודת פיתול (על אף שינוי סימן שם).',
            'ערכי הפונקצייה: $\\;f\\!\\left(\\tfrac{1}{2}\\right) = (2 - 2)^3 = 0$ ו-$f(1) = (2 - 1)^3 = 1$.',
          ],
          final_answer:
            'שתי נקודות פיתול (שתיהן מימין לציר $y$): $\\;\\left(\\tfrac{1}{2},\\, 0\\right)$ ו-$(1,\\, 1)$.',
        },
      },
      {
        label: 'ד',
        prompt: 'סרטטו סקיצה של גרף $f(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-6, 12],
            yRange: [-6, 16],
            curves: [
              { fn: (x) => (2 - 1 / x) ** 3, domain: [-6, -0.18], color: '#2563EB' },
              { fn: (x) => (2 - 1 / x) ** 3, domain: [0.14, 12], color: '#2563EB' },
            ],
            vAsymptotes: [{ x: 0, label: 'x=0' }],
            hAsymptotes: [{ y: 8, label: 'y=8' }],
            markedPoints: [
              { x: 0.5, y: 0, label: '(1/2,0)' },
              { x: 1, y: 1, label: '(1,1)' },
            ],
            caption:
              'הגרף $f(x) = \\left(2 - \\tfrac{1}{x}\\right)^3$: אסימפטוטה אנכית $x = 0$ ואופקית $y = 8$. עולה בכל ענף; חיתוך ציר $x$ ב-$\\left(\\tfrac{1}{2}, 0\\right)$; נקודות פיתול $\\left(\\tfrac{1}{2}, 0\\right)$ ו-$(1, 1)$.',
          },
        ],
        hints: [
          'השתמשו: אסימפטוטות ($x = 0$, $y = 8$), חיתוך $\\left(\\tfrac{1}{2}, 0\\right)$, עלייה בכל ענף, ונקודות הפיתול.',
        ],
        solution: {
          steps: [
            'ענף שמאלי ($x < 0$): $f$ עולה מ-$y = 8^+$ (כאשר $x \\to -\\infty$) עד $+\\infty$ (כאשר $x \\to 0^-$), וכולו מעל $y = 8$.',
            'ענף ימני ($x > 0$): $f$ עולה מ-$-\\infty$ (כאשר $x \\to 0^+$), דרך $\\left(\\tfrac{1}{2}, 0\\right)$ ו-$(1, 1)$, ומתקרב ל-$y = 8^-$ (כאשר $x \\to +\\infty$).',
            'שתי נקודות הפיתול, $\\left(\\tfrac{1}{2}, 0\\right)$ (משיק אופקי) ו-$(1, 1)$, נמצאות בענף הימני.',
          ],
          final_answer:
            'ראו סקיצה: אסימפטוטות $x = 0$ ו-$y = 8$; ענף ימני עולה מ-$-\\infty$ דרך $\\left(\\tfrac{1}{2}, 0\\right)$ ו-$(1, 1)$ אל $y = 8$; ענף שמאלי עולה מעל $y = 8$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2022s571a-q3',
    year: 2022,
    season: 'summer',
    moed: 'a',
    paper: '571',
    questionNumber: 3,
    topic: 'חשבון אינטגרלי',
    // הערה: ניקוד השאלה הוא הערכה — יש לאמת מול השאלון הרשמי.
    totalPoints: 25,
    context: [
      'נתונה הפונקצייה $h(t) = \\displaystyle\\int_0^t f(x)\\,dx$, המוגדרת בתחום $0 \\le t \\le 7$.',
      'הפונקצייה $h$ צוברת שטחים: שטחים חיוביים בתחום $0 < x < 3$, ואחריהם שטחים שליליים בתחום $3 < x < 7$.',
      'בסרטוט שלפניכם מופיע גרף הפונקצייה $f(x)$ (קו שבור), ואת השטחים נחשב בעזרת נוסחאות לצורות גאומטריות.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 320 235',
        svg: `
          <line x1="68" y1="28" x2="68" y2="215" stroke="rgba(148,163,184,0.35)" stroke-width="0.7" stroke-dasharray="2,2"/>
          <line x1="106" y1="28" x2="106" y2="215" stroke="rgba(148,163,184,0.35)" stroke-width="0.7" stroke-dasharray="2,2"/>
          <line x1="144" y1="28" x2="144" y2="215" stroke="rgba(148,163,184,0.35)" stroke-width="0.7" stroke-dasharray="2,2"/>
          <line x1="182" y1="28" x2="182" y2="215" stroke="rgba(148,163,184,0.35)" stroke-width="0.7" stroke-dasharray="2,2"/>
          <line x1="220" y1="28" x2="220" y2="215" stroke="rgba(148,163,184,0.35)" stroke-width="0.7" stroke-dasharray="2,2"/>
          <line x1="258" y1="28" x2="258" y2="215" stroke="rgba(148,163,184,0.35)" stroke-width="0.7" stroke-dasharray="2,2"/>
          <polygon points="30,150 30,90 68,90 106,30 144,150" fill="rgba(5,150,105,0.10)"/>
          <polygon points="144,150 220,210 296,150" fill="rgba(220,38,38,0.10)"/>
          <line x1="30" y1="150" x2="306" y2="150" stroke="rgba(51,65,85,0.6)" stroke-width="1"/>
          <line x1="30" y1="24" x2="30" y2="218" stroke="rgba(51,65,85,0.6)" stroke-width="1"/>
          <text x="308" y="154" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
          <text x="20" y="30" fill="#475569" font-size="10" font-family="Heebo, sans-serif">f(x)</text>
          <polyline points="30,90 68,90 106,30 144,150 220,210 296,150" fill="none" stroke="rgba(37,99,235,0.95)" stroke-width="1.8"/>
          <text x="66" y="162" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">1</text>
          <text x="104" y="162" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">2</text>
          <text x="142" y="162" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">3</text>
          <text x="180" y="162" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">4</text>
          <text x="218" y="162" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">5</text>
          <text x="256" y="162" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">6</text>
          <text x="294" y="162" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">7</text>
          <text x="18" y="93" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">2</text>
          <text x="18" y="33" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">4</text>
          <text x="14" y="213" fill="#475569" font-size="8.5" font-family="Heebo, sans-serif">-2</text>
          <circle cx="30" cy="90" r="2.4" fill="#2563EB"/><text x="20" y="86" fill="#2563EB" font-size="9" font-family="Heebo, sans-serif">D</text>
          <circle cx="106" cy="30" r="2.6" fill="#2563EB"/><text x="109" y="30" fill="#2563EB" font-size="9" font-family="Heebo, sans-serif">F(2,4)</text>
          <circle cx="144" cy="150" r="2.4" fill="#2563EB"/><text x="146" y="145" fill="#2563EB" font-size="9" font-family="Heebo, sans-serif">G(3,0)</text>
          <circle cx="220" cy="210" r="2.6" fill="#2563EB"/><text x="224" y="212" fill="#2563EB" font-size="9" font-family="Heebo, sans-serif">J(5,-2)</text>
        `,
        caption:
          'גרף $f(x)$ (קו שבור): $f = 2$ ב-$[0,1]$, עולה ל-$4$ ב-$x = 2$, יורד ל-$0$ ב-$x = 3$, ממשיך לרדת ל-$-2$ ב-$x = 5$, ועולה חזרה ל-$0$ ב-$x = 7$. השטח החיובי ($0<x<3$) בירוק והשלילי ($3<x<7$) באדום.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'חשבו את $h(0)$, את $h(3)$ ואת $h(5)$.',
        answer_type: 'number',
        hints: [
          '$h(t)$ הוא השטח (עם סימן) בין גרף $f$ לציר $x$, מ-$0$ עד $t$. פרקו לצורות גאומטריות.',
          'עד $x = 3$ כל השטח חיובי: מלבן על $[0,1]$, טרפז על $[1,2]$ ומשולש על $[2,3]$.',
          'בין $x = 3$ ל-$x = 5$ השטח שלילי (מתחת לציר) — הפחיתו אותו.',
        ],
        solution: {
          steps: [
            '$h(0) = \\displaystyle\\int_0^0 f(x)\\,dx = 0$ (אין שטח).',
            'עד $x = 3$ הגרף מעל ציר $x$; נחשב את השטח בעזרת שלוש צורות.',
            'מלבן על $[0, 1]$ (גובה $2$, רוחב $1$): $\\;S_1 = 1 \\cdot 2 = 2$.',
            'טרפז על $[1, 2]$ (בסיסים $2$ ו-$4$, גובה $1$): $\\;S_2 = \\dfrac{(2 + 4) \\cdot 1}{2} = 3$.',
            'משולש על $[2, 3]$ (בסיס $1$, גובה $4$): $\\;S_3 = \\dfrac{1 \\cdot 4}{2} = 2$.',
            'לכן $\\;h(3) = S_1 + S_2 + S_3 = 2 + 3 + 2 = 7$.',
            'בין $x = 3$ ל-$x = 5$ הגרף מתחת לציר — משולש (בסיס $2$, גובה $2$): $\\;S_4 = \\dfrac{2 \\cdot 2}{2} = 2$, ונספר בסימן שלילי.',
            'לכן $\\;h(5) = h(3) - S_4 = 7 - 2 = 5$.',
          ],
          final_answer: '$h(0) = 0$, $\\;h(3) = 7$, $\\;h(5) = 5$.',
        },
      },
      {
        label: 'ב',
        prompt: 'קבעו את תחומי העלייה והירידה של $h(t)$ בקטע $[0, 7]$, ומצאו את נקודת המקסימום שלה.',
        answer_type: 'expression',
        hints: [
          'לפי המשפט היסודי, $h\'(t) = f(t)$ — הסימן של הנגזרת הוא הסימן של $f$.',
          '$f > 0$ ב-$0 < x < 3$ ו-$f < 0$ ב-$3 < x < 7$. מתי $h$ עולה ומתי יורדת?',
        ],
        solution: {
          steps: [
            'לפי המשפט היסודי של החשבון האינטגרלי, $\\;h\'(t) = f(t)$.',
            'בתחום $0 < t < 3$ מתקיים $f(t) > 0$, ולכן $h\'(t) > 0$ ו-$h$ עולה.',
            'בתחום $3 < t < 7$ מתקיים $f(t) < 0$, ולכן $h\'(t) < 0$ ו-$h$ יורדת.',
            'ב-$t = 3$ הנגזרת מתאפסת ומשנה סימן מפלוס למינוס — נקודת מקסימום.',
            'ערך המקסימום חושב בסעיף א: $\\;h(3) = 7$, ולכן נקודת המקסימום היא $(3, 7)$.',
          ],
          final_answer: '$h$ עולה ב-$0 < t < 3$ ויורדת ב-$3 < t < 7$; נקודת המקסימום היא $\\;(3, 7)$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2022s571a-q4',
    year: 2022,
    season: 'summer',
    moed: 'a',
    paper: '571',
    questionNumber: 4,
    topic: 'גאומטריה',
    // הערה: ניקוד השאלה הוא הערכה — יש לאמת מול השאלון הרשמי.
    totalPoints: 25,
    context: [
      'נתון משולש $DEF$, ובתוכו חסום מעגל.',
      'המעגל משיק לצלע $DE$ בנקודה $A$, לצלע $EF$ בנקודה $B$, ולצלע $DF$ בנקודה $C$.',
      'נתון כי משולש המגע $ABC$ שווה-שוקיים ($AB = AC$), וזווית הראש שלו היא $\\angle BAC = 2\\alpha$.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 300 280',
        svg: `
          <polygon points="82,62 218,62 150,250" fill="none" stroke="rgba(71,85,105,0.85)" stroke-width="1.5"/>
          <circle cx="150" cy="110" r="48" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.85)" stroke-width="1.3"/>
          <polygon points="150,62 195,126 105,126" fill="rgba(219,39,119,0.06)" stroke="rgba(219,39,119,0.9)" stroke-width="1.3"/>
          <circle cx="82" cy="62" r="2.4" fill="#475569"/>
          <text x="70" y="60" fill="#475569" font-size="10" font-family="Heebo, sans-serif">D</text>
          <circle cx="218" cy="62" r="2.4" fill="#475569"/>
          <text x="222" y="60" fill="#475569" font-size="10" font-family="Heebo, sans-serif">E</text>
          <circle cx="150" cy="250" r="2.4" fill="#475569"/>
          <text x="146" y="263" fill="#475569" font-size="10" font-family="Heebo, sans-serif">F</text>
          <circle cx="150" cy="62" r="2.6" fill="#DB2777"/>
          <text x="153" y="56" fill="#DB2777" font-size="9.5" font-family="Heebo, sans-serif">A</text>
          <circle cx="195" cy="126" r="2.6" fill="#DB2777"/>
          <text x="199" y="128" fill="#DB2777" font-size="9.5" font-family="Heebo, sans-serif">B</text>
          <circle cx="105" cy="126" r="2.6" fill="#DB2777"/>
          <text x="94" y="128" fill="#DB2777" font-size="9.5" font-family="Heebo, sans-serif">C</text>
          <text x="144" y="88" fill="#B45309" font-size="9" font-family="Heebo, sans-serif">2α</text>
          <text x="116" y="74" fill="#0284C7" font-size="7.5" font-family="Heebo, sans-serif">90°-α</text>
          <text x="160" y="74" fill="#0284C7" font-size="7.5" font-family="Heebo, sans-serif">90°-α</text>
          <text x="92" y="80" fill="#B45309" font-size="9" font-family="Heebo, sans-serif">2α</text>
          <text x="198" y="80" fill="#B45309" font-size="9" font-family="Heebo, sans-serif">2α</text>
          <text x="126" y="238" fill="#B45309" font-size="8.5" font-family="Heebo, sans-serif">180°-4α</text>
          <text x="108" y="116" fill="#0284C7" font-size="7.5" font-family="Heebo, sans-serif">90°-α</text>
          <text x="168" y="116" fill="#0284C7" font-size="7.5" font-family="Heebo, sans-serif">90°-α</text>
        `,
        caption:
          'משולש $DEF$ ובתוכו מעגל חסום, המשיק ל-$DE$ ב-$A$, ל-$EF$ ב-$B$ ול-$DF$ ב-$C$. משולש המגע $ABC$ שווה-שוקיים עם זווית ראש $\\angle BAC = 2\\alpha$; מכאן זוויות הבסיס $90° - \\alpha$, זוויות משיק-מיתר $90° - \\alpha$, ולבסוף $\\angle D = \\angle E = 2\\alpha$ ו-$\\angle F = 180° - 4\\alpha$.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הוכיחו כי $\\angle D = \\angle E = 2\\alpha$.',
        answer_type: 'proof',
        hints: [
          'ממשולש שווה-השוקיים $ABC$ מצאו את זוויות הבסיס $\\angle ABC$ ו-$\\angle ACB$.',
          'השתמשו במשפט הזווית בין משיק למיתר (שווה לזווית ההיקפית שמעברה השני), ובכך ששני משיקים מנקודה למעגל שווים באורכם.',
          'ב-$\\triangle EAB$ (שווה-שוקיים כי $EA = EB$) חשבו את $\\angle E$; באותו אופן את $\\angle D$.',
        ],
        solution: {
          steps: [
            'במשולש שווה-השוקיים $ABC$ זווית הראש היא $\\angle BAC = 2\\alpha$, ולכן זוויות הבסיס: $\\;\\angle ABC = \\angle ACB = \\dfrac{180° - 2\\alpha}{2} = 90° - \\alpha$.',
            'הצלע $DE$ משיקה למעגל בנקודה $A$; לפי משפט הזווית בין משיק למיתר, הזווית בין המשיק למיתר $AB$ שווה לזווית ההיקפית $\\angle ACB$: $\\;\\angle BAE = \\angle ACB = 90° - \\alpha$.',
            'באותו אופן, הזווית בין המשיק $DE$ למיתר $AC$: $\\;\\angle CAD = \\angle ABC = 90° - \\alpha$.',
            'מהנקודה $E$ יוצאים שני משיקים למעגל — $EA$ (על $DE$) ו-$EB$ (על $EF$) — ולכן $EA = EB$, והמשולש $EAB$ שווה-שוקיים.',
            'לכן זוויות הבסיס של $\\triangle EAB$ שוות: $\\;\\angle EBA = \\angle EAB = 90° - \\alpha$.',
            'סכום הזוויות ב-$\\triangle EAB$: $\\;\\angle E = 180° - (90° - \\alpha) - (90° - \\alpha) = 2\\alpha$.',
            'באותו אופן מהנקודה $D$: $DA = DC$, המשולש $DAC$ שווה-שוקיים, $\\angle DCA = \\angle DAC = 90° - \\alpha$, ולכן $\\;\\angle D = 2\\alpha$.',
          ],
          final_answer: 'הוכח: $\\;\\angle D = \\angle E = 2\\alpha$.',
        },
      },
      {
        label: 'ב',
        prompt: 'הוכיחו כי $\\angle F = 180° - 4\\alpha$.',
        answer_type: 'proof',
        hints: ['השתמשו בסכום הזוויות במשולש $DEF$ ובתוצאה מסעיף א.'],
        solution: {
          steps: [
            'סכום הזוויות במשולש $DEF$ שווה $180°$: $\\;\\angle D + \\angle E + \\angle F = 180°$.',
            'מסעיף א $\\angle D = \\angle E = 2\\alpha$, ולכן $\\;2\\alpha + 2\\alpha + \\angle F = 180°$.',
            'מבודדים: $\\;\\angle F = 180° - 4\\alpha$.',
          ],
          final_answer: 'הוכח: $\\;\\angle F = 180° - 4\\alpha$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
