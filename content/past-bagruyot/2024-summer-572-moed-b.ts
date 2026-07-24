/**
 * שאלון 572 — קיץ 2024, מועד ב' (4 יחידות לימוד)
 * ================================================
 *
 * מקור השאלה: שאלון משרד החינוך 572, קיץ 2024 מועד ב' (נחלת הכלל).
 * הפתרון נכתב על-ידינו בסגנון האפליקציה (רמזים מדורגים + צעד-אחר-צעד),
 * ואומת מול פתרון הבחינה.
 *
 * תוכן:
 *   Q1 — גאומטריה אנליטית: מעוין שאלכסוניו על הצירים, מעגל חסום, נקודת השקה,
 *        מקום גאומטרי → פרבולה $y^2 = 4x$, ושני מעגלים משיקים.
 *   Q2 — וקטורים במרחב: פירמידה SABCD עם בסיס ריבוע — הבעת וקטורים, מכפלה
 *        סקלרית, זווית בין ישר למישור, משוואת מישור הבסיס ושיעורי קדקוד.
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2024Summer572MoedB: PastBagrutQuestion[] = [
  {
    id: 'b2024s572b-q1',
    year: 2024,
    season: 'summer',
    moed: 'b',
    paper: '572',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    // הערה: ניקוד השאלה הוא הערכה — יש לאמת מול השאלון הרשמי.
    totalPoints: 25,
    context: [
      'נתון מעוין $ABCD$. אלכסוני המעוין מונחים על הצירים, כמתואר בסרטוט שלפניכם.',
      'הקדקוד $A$ נמצא על החלק החיובי של ציר $x$, והקדקוד $C$ על החלק השלילי של ציר $x$.',
      'הקדקוד $B$ נמצא על החלק החיובי של ציר $y$, והקדקוד $D$ על החלק השלילי של ציר $y$.',
      'נתון: אורך האלכסון $AC$ הוא $10$.',
      'המרחק של כל אחת מצלעות המעוין מראשית הצירים הוא $\\sqrt{5}$.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 300 210',
        svg: `
          <line x1="78" y1="108" x2="230" y2="108" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
          <line x1="150" y1="58" x2="150" y2="158" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
          <text x="232" y="112" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
          <text x="138" y="60" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
          <polygon points="205,108 150,80.5 95,108 150,135.5" fill="rgba(37,99,235,0.06)" stroke="rgba(37,99,235,0.9)" stroke-width="1.6"/>
          <circle cx="150" cy="108" r="24.6" fill="rgba(219,39,119,0.05)" stroke="rgba(219,39,119,0.9)" stroke-width="1.4"/>
          <circle cx="150" cy="108" r="2.2" fill="rgba(51,65,85,0.9)"/>
          <text x="152" y="120" fill="#475569" font-size="9.5" font-family="Heebo, sans-serif">O</text>
          <circle cx="205" cy="108" r="2.6" fill="rgba(37,99,235,0.95)"/>
          <text x="208" y="106" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">A(5,0)</text>
          <circle cx="150" cy="80.5" r="2.6" fill="rgba(37,99,235,0.95)"/>
          <text x="154" y="77" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">B(0,2.5)</text>
          <circle cx="95" cy="108" r="2.6" fill="rgba(37,99,235,0.95)"/>
          <text x="64" y="106" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">C(-5,0)</text>
          <circle cx="150" cy="135.5" r="2.6" fill="rgba(37,99,235,0.95)"/>
          <text x="154" y="141" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">D(0,-2.5)</text>
          <circle cx="161" cy="86" r="2.6" fill="rgba(180,83,9,0.95)"/>
          <text x="164" y="84" fill="#B45309" font-size="9.5" font-family="Heebo, sans-serif">M</text>
        `,
        caption:
          'מעוין $ABCD$ שאלכסוניו על הצירים: $A(5,0)$ ו-$C(-5,0)$ (ולכן $AC = 10$), ו-$B$, $D$ על ציר $y$. המעגל החסום ממורכז בראשית $O$ ורדיוסו $\\sqrt{5}$ — המרחק מ-$O$ אל כל צלע. $M$ היא נקודת ההשקה עם הצלע $AB$ ברביע הראשון.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'מצאו את משוואת הצלע $AB$.',
        answer_type: 'expression',
        hints: [
          'אלכסוני מעוין נחתכים בראשית וחוצים זה את זה, ולכן $OA = 5$. סמנו $B(0, b)$ על ציר $y$.',
          'כתבו את משוואת $AB$ דרך חיתוכי הצירים, והשתמשו בנוסחת המרחק מנקודה לישר: המרחק מ-$O$ אל $AB$ שווה $\\sqrt{5}$.',
          'פתרו את המשוואה עבור $b$, ואז חשבו את שיפוע $AB$.',
        ],
        solution: {
          steps: [
            'אלכסוני המעוין נחתכים בראשית וחוצים זה את זה, לכן $\\;OA = OC = \\dfrac{AC}{2} = 5$.',
            'הקדקוד $A$ על החלק החיובי של ציר $x$, ולכן $\\;A(5, 0)$.',
            'הקדקוד $B$ על החלק החיובי של ציר $y$, נסמן $\\;B(0, b)$ כאשר $b > 0$.',
            'משוואת הישר $AB$ דרך חיתוכי הצירים $A(5,0)$ ו-$B(0,b)$: $\\;\\dfrac{x}{5} + \\dfrac{y}{b} = 1$.',
            'כופלים ב-$5b$ ומסדרים לצורה כללית: $\\;bx + 5y - 5b = 0$.',
            'נוסחת המרחק מ-$O(0,0)$ אל הישר: $\\;d = \\dfrac{|b \\cdot 0 + 5 \\cdot 0 - 5b|}{\\sqrt{b^2 + 5^2}}$.',
            'מפשטים (זכרו $b > 0$): $\\;d = \\dfrac{5b}{\\sqrt{b^2 + 25}}$.',
            'משווים לנתון $d = \\sqrt{5}$: $\\;\\dfrac{5b}{\\sqrt{b^2 + 25}} = \\sqrt{5}$.',
            'מעלים בריבוע: $\\;\\dfrac{25b^2}{b^2 + 25} = 5$.',
            'כופלים במכנה: $\\;25b^2 = 5(b^2 + 25)$.',
            'פותחים סוגריים: $\\;25b^2 = 5b^2 + 125$.',
            'מעבירים אגפים: $\\;20b^2 = 125$.',
            'מחלקים ב-$20$: $\\;b^2 = 6.25$.',
            'מפני ש-$b > 0$: $\\;b = 2.5$, ולכן $B(0,\\, 2.5)$.',
            'שיפוע $AB$ דרך $A(5,0)$ ו-$B(0, 2.5)$: $\\;m_{AB} = \\dfrac{2.5 - 0}{0 - 5} = -\\dfrac{1}{2}$.',
            'משוואת הישר דרך $B(0, 2.5)$ בשיפוע $-\\tfrac{1}{2}$: $\\;y = -\\dfrac{1}{2}x + 2.5$.',
          ],
          final_answer: 'משוואת הצלע $AB$: $\\;y = -\\dfrac{1}{2}x + 2.5\\;$ (כלומר $x + 2y - 5 = 0$).',
        },
      },
      {
        label: 'ב',
        prompt: 'בתוך המעוין חסום מעגל. מצאו את משוואת המעגל.',
        answer_type: 'expression',
        hints: [
          'המעגל החסום במעוין משיק לכל ארבע הצלעות, ומרכזו במפגש האלכסונים.',
          'הרדיוס הוא המרחק מהמרכז אל צלע — נתון שהוא $\\sqrt{5}$.',
        ],
        solution: {
          steps: [
            'המעגל חסום במעוין ומשיק לכל ארבע צלעותיו.',
            'מרכז המעגל החסום הוא מפגש האלכסונים — כלומר ראשית הצירים $O(0,0)$.',
            'הרדיוס שווה למרחק מהמרכז אל צלע, שנתון: $\\;R = \\sqrt{5}$.',
            'משוואת מעגל שמרכזו $O(0,0)$ ורדיוסו $R$: $\\;x^2 + y^2 = R^2$.',
            'מציבים $R = \\sqrt{5}$: $\\;x^2 + y^2 = 5$.',
          ],
          final_answer: 'משוואת המעגל החסום: $\\;x^2 + y^2 = 5$.',
        },
      },
      {
        label: 'ג',
        prompt: [
          'הנקודה $M$ היא נקודת ההשקה של המעגל עם המעוין ברביע הראשון.',
          '',
          'מצאו את שיעורי הנקודה $M$.',
        ].join('\n'),
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 250 180',
            svg: `
              <line x1="30" y1="140" x2="180" y2="140" stroke="rgba(51,65,85,0.45)" stroke-width="1"/>
              <line x1="60" y1="60" x2="60" y2="168" stroke="rgba(51,65,85,0.45)" stroke-width="1"/>
              <text x="182" y="144" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="48" y="62" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
              <circle cx="60" cy="140" r="44.7" fill="rgba(219,39,119,0.05)" stroke="rgba(219,39,119,0.85)" stroke-width="1.3"/>
              <line x1="160" y1="140" x2="60" y2="90" stroke="rgba(37,99,235,0.9)" stroke-width="1.5"/>
              <text x="146" y="126" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">AB</text>
              <line x1="60" y1="140" x2="80" y2="100" stroke="rgba(180,83,9,0.95)" stroke-width="1.5"/>
              <polyline points="77.3,105.4 82.7,108.1 85.4,102.7" fill="none" stroke="rgba(180,83,9,0.9)" stroke-width="1"/>
              <circle cx="60" cy="140" r="2.4" fill="rgba(51,65,85,0.9)"/>
              <text x="46" y="152" fill="#475569" font-size="9.5" font-family="Heebo, sans-serif">O</text>
              <circle cx="80" cy="100" r="2.6" fill="rgba(180,83,9,0.95)"/>
              <text x="83" y="98" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">M(1,2)</text>
              <circle cx="160" cy="140" r="2.4" fill="rgba(37,99,235,0.9)"/>
              <text x="162" y="152" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">A</text>
              <circle cx="60" cy="90" r="2.4" fill="rgba(37,99,235,0.9)"/>
              <text x="46" y="88" fill="#2563EB" font-size="9.5" font-family="Heebo, sans-serif">B</text>
            `,
            caption:
              'נקודת ההשקה $M$ נמצאת על הצלע $AB$. הרדיוס $OM$ מאונך למשיק $AB$ (הזווית ב-$M$ ישרה), ולכן שיפוע $OM$ הוא $2$. חיתוך הישר $y = 2x$ עם המעגל נותן $M(1, 2)$.',
          },
        ],
        hints: [
          'נקודת ההשקה ברביע הראשון היא על הצלע $AB$. הרדיוס אל נקודת ההשקה מאונך למשיק, ולכן $OM \\perp AB$.',
          'מצאו את שיפוע $OM$ מתנאי המאונכות, וכתבו את משוואת $OM$ (עובר דרך הראשית).',
          'חתכו את $OM$ עם משוואת המעגל, ובחרו את הפתרון שברביע הראשון.',
        ],
        solution: {
          steps: [
            'הנקודה $M$ היא נקודת ההשקה עם הצלע $AB$ שברביע הראשון.',
            'רדיוס אל נקודת השקה מאונך למשיק, ולכן $\\;OM \\perp AB$.',
            'שיפוע $AB$ הוא $-\\tfrac{1}{2}$, ולכן שיפוע $OM$ מקיים $\\;m_{OM} \\cdot \\left(-\\tfrac{1}{2}\\right) = -1$.',
            'מבודדים: $\\;m_{OM} = 2$.',
            'הישר $OM$ עובר דרך הראשית בשיפוע $2$: $\\;y = 2x$.',
            'נקודת ההשקה על המעגל, נציב $y = 2x$ ב-$x^2 + y^2 = 5$: $\\;x^2 + (2x)^2 = 5$.',
            'מפשטים: $\\;5x^2 = 5$.',
            'מחלקים ב-$5$: $\\;x^2 = 1$.',
            'שני פתרונות: $\\;x = 1$ או $x = -1$.',
            'ברביע הראשון $x > 0$, לכן $x = 1$, ומהצבה $\\;y = 2 \\cdot 1 = 2$.',
          ],
          final_answer: '$M(1,\\, 2)$',
        },
      },
      {
        label: 'ד',
        prompt: [
          'מן הנקודה $M$ מורידים אנך לציר ה-$x$ החותך אותו בנקודה $K(a, 0)$.',
          'על הישר $x = -a$ מסמנים נקודה $E$, ומעבירים דרכה ישר המקביל לציר ה-$x$.',
          'הישר המקביל חותך את האנך האמצעי לקטע $EK$ בנקודה $G$.',
          '',
          'הראו כי המקום הגאומטרי של כל הנקודות $G$ המתקבלות באופן זה נמצא על פרבולה, ומצאו את משוואתה.',
        ].join('\n'),
        answer_type: 'proof',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 300 215',
            svg: `
              <line x1="40" y1="108" x2="272" y2="108" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="70" y1="20" x2="70" y2="200" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <text x="274" y="112" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="58" y="24" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
              <line x1="50" y1="24" x2="50" y2="196" stroke="rgba(2,132,199,0.85)" stroke-width="1.3" stroke-dasharray="5,3"/>
              <text x="30" y="209" fill="#0284C7" font-size="9.5" font-family="Heebo, sans-serif">x = -1</text>
              <polyline points="162.45,194 150,188 115,168 90,148 75,128 70,108 75,88 90,68 115,48 150,28 162.45,22" fill="none" stroke="rgba(37,99,235,0.9)" stroke-width="1.7"/>
              <text x="150" y="44" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">y² = 4x</text>
              <line x1="115" y1="48" x2="50" y2="48" stroke="rgba(124,58,237,0.9)" stroke-width="1.4"/>
              <line x1="115" y1="48" x2="90" y2="108" stroke="rgba(180,83,9,0.95)" stroke-width="1.4"/>
              <line x1="82.5" y1="44" x2="82.5" y2="52" stroke="rgba(51,65,85,0.85)" stroke-width="1"/>
              <line x1="98.8" y1="76.5" x2="106.2" y2="79.5" stroke="rgba(51,65,85,0.85)" stroke-width="1"/>
              <circle cx="50" cy="48" r="2.6" fill="rgba(2,132,199,0.95)"/>
              <text x="34" y="46" fill="#0284C7" font-size="10" font-family="Heebo, sans-serif">E</text>
              <circle cx="115" cy="48" r="2.8" fill="rgba(124,58,237,0.95)"/>
              <text x="119" y="46" fill="#7C3AED" font-size="10" font-family="Heebo, sans-serif">G(x,y)</text>
              <circle cx="90" cy="108" r="2.8" fill="rgba(180,83,9,0.95)"/>
              <text x="88" y="122" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">K(1,0)</text>
              <circle cx="70" cy="108" r="2.2" fill="rgba(51,65,85,0.9)"/>
              <text x="58" y="122" fill="#475569" font-size="9" font-family="Heebo, sans-serif">O</text>
            `,
            caption:
              'הבנייה: $E$ על הישר $x = -1$, והישר דרכה מקביל לציר $x$. הנקודה $G$ על האנך האמצעי של $EK$, ולכן $GE = GK$ (הקטעים המסומנים שווים) — המרחק מ-$G$ אל הישר $x = -1$ שווה למרחק מ-$G$ אל $K(1,0)$. זו בדיוק הגדרת הפרבולה $y^2 = 4x$.',
          },
        ],
        hints: [
          'תחילה מצאו את $a$: הורידו אנך מ-$M(1,2)$ אל ציר $x$ כדי לקבל את $K(a,0)$.',
          'סמנו $G(x, y)$. הישר דרך $E$ מקביל לציר $x$, ולכן $E$ ו-$G$ באותו גובה: $E(-1, y)$.',
          '$G$ על האנך האמצעי של $EK$, ולכן $GE = GK$. בטאו את שני המרחקים, השוו, והעלו בריבוע.',
        ],
        solution: {
          steps: [
            'מורידים אנך מ-$M(1, 2)$ אל ציר $x$; הוא חותך אותו ב-$\\;K(1, 0)$, כלומר $a = 1$.',
            'לכן הישר $x = -a$ הוא הישר $\\;x = -1$, ועליו נבחרת הנקודה $E$.',
            'נסמן את הנקודה המבוקשת $\\;G(x, y)$.',
            'הישר דרך $E$ מקביל לציר $x$ ו-$G$ נמצאת עליו, ולכן ל-$E$ ול-$G$ אותו שיעור $y$, כלומר $\\;E(-1,\\, y)$.',
            'המרחק האופקי בין $G(x, y)$ ל-$E(-1, y)$: $\\;GE = |x - (-1)| = x + 1$.',
            'הנקודה $G$ על האנך האמצעי של $EK$, ולכן היא במרחק שווה מקצות הקטע: $\\;GE = GK$.',
            'המרחק מ-$G(x, y)$ אל $K(1, 0)$: $\\;GK = \\sqrt{(x - 1)^2 + y^2}$.',
            'משווים $GE = GK$: $\\;x + 1 = \\sqrt{(x - 1)^2 + y^2}$.',
            'מעלים בריבוע: $\\;(x + 1)^2 = (x - 1)^2 + y^2$.',
            'מפתחים את הריבועים: $\\;x^2 + 2x + 1 = x^2 - 2x + 1 + y^2$.',
            'מצמצמים $x^2$ ואת $1$: $\\;2x = -2x + y^2$.',
            'מסדרים אגפים: $\\;y^2 = 4x$.',
            'זו משוואת פרבולה (מהצורה $y^2 = 2px$ עם $2p = 4$), ולכן המקום הגאומטרי של הנקודות $G$ נמצא על פרבולה.',
            'הערה: $GE$ הוא המרחק מ-$G$ אל הישר $x = -1$ ו-$GK$ המרחק מ-$G$ אל $K(1,0)$, כך שהתנאי $GE = GK$ הוא בדיוק הגדרת הפרבולה שמוקדה $K(1,0)$ ומדריכהּ $x = -1$.',
          ],
          final_answer: 'המקום הגאומטרי הוא הפרבולה $\\;y^2 = 4x\\;$ (מוקד $K(1,0)$, מדריך $x = -1$).',
        },
      },
      {
        label: 'ה',
        prompt: [
          'הנקודה $N$ נמצאת ברביע הראשון על הפרבולה שאת משוואתה מצאתם. שיעור ה-$x$ של הנקודה $N$ הוא $16$.',
          '',
          'מצאו את משוואות שני המעגלים שמרכזם בנקודה $N$ והם משיקים למעגל החסום במעוין.',
        ].join('\n'),
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 285 240',
            svg: `
              <line x1="30" y1="170" x2="278" y2="170" stroke="rgba(51,65,85,0.4)" stroke-width="1"/>
              <line x1="92" y1="30" x2="92" y2="232" stroke="rgba(51,65,85,0.4)" stroke-width="1"/>
              <text x="280" y="174" fill="#475569" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="80" y="34" fill="#475569" font-size="10" font-family="Heebo, sans-serif">y</text>
              <circle cx="172" cy="130" r="100.6" fill="none" stroke="rgba(124,58,237,0.75)" stroke-width="1.3" stroke-dasharray="5,3"/>
              <circle cx="172" cy="130" r="78.3" fill="none" stroke="rgba(5,150,105,0.8)" stroke-width="1.3" stroke-dasharray="5,3"/>
              <circle cx="92" cy="170" r="11.18" fill="rgba(219,39,119,0.06)" stroke="rgba(219,39,119,0.9)" stroke-width="1.5"/>
              <line x1="92" y1="170" x2="172" y2="130" stroke="rgba(100,116,139,0.7)" stroke-width="1" stroke-dasharray="3,2"/>
              <circle cx="92" cy="170" r="2.6" fill="rgba(219,39,119,0.95)"/>
              <text x="74" y="183" fill="#DB2777" font-size="9.5" font-family="Heebo, sans-serif">O</text>
              <circle cx="172" cy="130" r="2.8" fill="rgba(180,83,9,0.95)"/>
              <text x="176" y="128" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">N(16,8)</text>
              <circle cx="102" cy="165" r="2.2" fill="rgba(5,150,105,0.95)"/>
              <circle cx="82" cy="175" r="2.2" fill="rgba(124,58,237,0.95)"/>
              <text x="112" y="142" fill="#5b6472" font-size="8.5" font-family="Heebo, sans-serif">ON = 8√5</text>
              <text x="146" y="58" fill="#7C3AED" font-size="8.5" font-family="Heebo, sans-serif">R = 9√5</text>
              <text x="196" y="200" fill="#059669" font-size="8.5" font-family="Heebo, sans-serif">R = 7√5</text>
            `,
            caption:
              'שני מעגלים שמרכזם $N(16, 8)$ ומשיקים למעגל החסום (מרכז $O$, רדיוס $\\sqrt{5}$). מרחק המרכזים $ON = 8\\sqrt{5}$. בהשקה חיצונית $R = 7\\sqrt{5}$ (המעגל החסום מחוץ למעגל הגדול), ובהשקה פנימית $R = 9\\sqrt{5}$ (המעגל החסום בתוך המעגל הגדול).',
          },
        ],
        hints: [
          'מצאו את $N$ על-ידי הצבת $x = 16$ בפרבולה $y^2 = 4x$ (ברביע הראשון $y > 0$).',
          'חשבו את המרחק $ON$ בין מרכזי שני המעגלים.',
          'שני מעגלים משיקים: מרחק המרכזים שווה לסכום הרדיוסים (השקה חיצונית) או להפרשם (השקה פנימית) — קבלו שתי משוואות ב-$R$.',
        ],
        solution: {
          steps: [
            'הנקודה $N$ על הפרבולה $y^2 = 4x$ ברביע הראשון, עם $x = 16$.',
            'מציבים $x = 16$: $\\;y^2 = 4 \\cdot 16 = 64$.',
            'ברביע הראשון $y > 0$, ולכן $\\;y = 8$, כלומר $N(16, 8)$.',
            'המעגל החסום ממורכז ב-$O(0,0)$ ורדיוסו $\\sqrt{5}$; נחשב את המרחק בין המרכזים: $\\;ON = \\sqrt{16^2 + 8^2}$.',
            'מפשטים: $\\;ON = \\sqrt{256 + 64} = \\sqrt{320} = 8\\sqrt{5}$.',
            'נסמן ב-$R$ את רדיוס המעגל שמרכזו $N$. יש שתי אפשרויות השקה למעגל החסום.',
            'השקה חיצונית — מרחק המרכזים שווה לסכום הרדיוסים: $\\;ON = R + \\sqrt{5}$.',
            'מציבים $ON = 8\\sqrt{5}$ ומבודדים: $\\;R = 8\\sqrt{5} - \\sqrt{5} = 7\\sqrt{5}$.',
            'מעלים בריבוע: $\\;R^2 = (7\\sqrt{5})^2 = 49 \\cdot 5 = 245$.',
            'משוואת המעגל הראשון (השקה חיצונית): $\\;(x - 16)^2 + (y - 8)^2 = 245$.',
            'השקה פנימית — המעגל החסום בתוך המעגל שמרכזו $N$, ומרחק המרכזים שווה להפרש הרדיוסים: $\\;ON = R - \\sqrt{5}$.',
            'מציבים $ON = 8\\sqrt{5}$ ומבודדים: $\\;R = 8\\sqrt{5} + \\sqrt{5} = 9\\sqrt{5}$.',
            'מעלים בריבוע: $\\;R^2 = (9\\sqrt{5})^2 = 81 \\cdot 5 = 405$.',
            'משוואת המעגל השני (השקה פנימית): $\\;(x - 16)^2 + (y - 8)^2 = 405$.',
          ],
          final_answer:
            'שני המעגלים: $\\;(x-16)^2 + (y-8)^2 = 245\\;$ (השקה חיצונית) ו-$\\;(x-16)^2 + (y-8)^2 = 405\\;$ (השקה פנימית).',
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2024s572b-q2',
    year: 2024,
    season: 'summer',
    moed: 'b',
    paper: '572',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    // הערה: ניקוד השאלה הוא הערכה — יש לאמת מול השאלון הרשמי.
    totalPoints: 25,
    context: [
      'בסרטוט שלפניכם פירמידה $SABCD$ שבסיסה $ABCD$ הוא ריבוע.',
      'הנקודה $E$ היא מפגש אלכסוני הבסיס, והנקודה $F$ היא אמצע המקצוע $BC$.',
      'נסמן: $\\vec{SE} = \\vec{u}$, $\\vec{SF} = \\vec{v}$ ו-$\\vec{SB} = \\vec{w}$.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 280 235',
        svg: `
          <polygon points="90,140 210,140 180,195 60,195" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.6)" stroke-width="1.2"/>
          <line x1="90" y1="140" x2="180" y2="195" stroke="rgba(100,116,139,0.5)" stroke-width="0.9" stroke-dasharray="3,2"/>
          <line x1="210" y1="140" x2="60" y2="195" stroke="rgba(100,116,139,0.5)" stroke-width="0.9" stroke-dasharray="3,2"/>
          <line x1="135" y1="45" x2="90" y2="140" stroke="rgba(71,85,105,0.6)" stroke-width="1"/>
          <line x1="135" y1="45" x2="180" y2="195" stroke="rgba(71,85,105,0.6)" stroke-width="1"/>
          <line x1="135" y1="45" x2="60" y2="195" stroke="rgba(71,85,105,0.6)" stroke-width="1"/>
          <line x1="135" y1="45" x2="135" y2="167.5" stroke="rgba(124,58,237,0.95)" stroke-width="2"/>
          <line x1="135" y1="45" x2="195" y2="167.5" stroke="rgba(2,132,199,0.95)" stroke-width="2"/>
          <line x1="135" y1="45" x2="210" y2="140" stroke="rgba(5,150,105,0.95)" stroke-width="2"/>
          <text x="118" y="108" fill="#7C3AED" font-size="11" font-family="Heebo, sans-serif">u</text>
          <text x="166" y="100" fill="#0284C7" font-size="11" font-family="Heebo, sans-serif">v</text>
          <text x="177" y="84" fill="#059669" font-size="11" font-family="Heebo, sans-serif">w</text>
          <circle cx="135" cy="45" r="2.8" fill="rgba(51,65,85,0.95)"/>
          <text x="130" y="40" fill="#334155" font-size="10" font-family="Heebo, sans-serif">S</text>
          <circle cx="90" cy="140" r="2.5" fill="rgba(37,99,235,0.9)"/>
          <text x="76" y="140" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">A</text>
          <circle cx="210" cy="140" r="2.5" fill="rgba(37,99,235,0.9)"/>
          <text x="214" y="138" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">B</text>
          <circle cx="180" cy="195" r="2.5" fill="rgba(37,99,235,0.9)"/>
          <text x="183" y="207" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">C</text>
          <circle cx="60" cy="195" r="2.5" fill="rgba(37,99,235,0.9)"/>
          <text x="48" y="207" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">D</text>
          <circle cx="135" cy="167.5" r="2.5" fill="rgba(180,83,9,0.95)"/>
          <text x="120" y="181" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">E</text>
          <circle cx="195" cy="167.5" r="2.5" fill="rgba(180,83,9,0.95)"/>
          <text x="199" y="181" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">F</text>
        `,
        caption:
          'הפירמידה $SABCD$ שבסיסה ריבוע: $E$ מפגש האלכסונים (מרכז הריבוע) ו-$F$ אמצע $BC$. הוקטורים $\\vec{u} = \\vec{SE}$ (הגובה), $\\vec{v} = \\vec{SF}$ ו-$\\vec{w} = \\vec{SB}$.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הביעו באמצעות $\\vec{u}$, $\\vec{v}$ ו-$\\vec{w}$ את הוקטורים $\\vec{BC}$ ו-$\\vec{DC}$.',
        answer_type: 'expression',
        hints: [
          '$F$ הוא אמצע $BC$, ולכן $\\vec{BC} = 2\\vec{BF}$. פרקו את $\\vec{BF}$ דרך הקדקוד $S$.',
          '$E$ מרכז הריבוע ולכן אמצע האלכסון $DB$; מכאן $\\vec{DB} = 2\\vec{EB}$.',
          'הגיעו אל $\\vec{DC}$ דרך $\\vec{DC} = \\vec{DB} + \\vec{BC}$, ופרקו כל וקטור דרך $S$.',
        ],
        solution: {
          steps: [
            '$F$ הוא אמצע $BC$, ולכן $\\;\\vec{BC} = 2\\vec{BF}$.',
            'מפרקים את $\\vec{BF}$ דרך הקדקוד $S$: $\\;\\vec{BF} = \\vec{BS} + \\vec{SF}$.',
            'מציבים $\\vec{BS} = -\\vec{w}$ ו-$\\vec{SF} = \\vec{v}$: $\\;\\vec{BF} = \\vec{v} - \\vec{w}$.',
            'מכפילים ב-$2$: $\\;\\vec{BC} = 2\\vec{v} - 2\\vec{w}$.',
            '$E$ מרכז הריבוע, כלומר אמצע האלכסון $DB$, ולכן $\\;\\vec{DB} = 2\\vec{EB}$.',
            'מפרקים את $\\vec{EB}$ דרך $S$: $\\;\\vec{EB} = \\vec{ES} + \\vec{SB} = -\\vec{u} + \\vec{w}$.',
            'מכאן $\\;\\vec{DB} = 2(-\\vec{u} + \\vec{w}) = -2\\vec{u} + 2\\vec{w}$.',
            'מחברים לפי $\\vec{DC} = \\vec{DB} + \\vec{BC}$: $\\;\\vec{DC} = (-2\\vec{u} + 2\\vec{w}) + (2\\vec{v} - 2\\vec{w})$.',
            'מצמצמים את $2\\vec{w}$: $\\;\\vec{DC} = 2\\vec{v} - 2\\vec{u}$.',
          ],
          final_answer: '$\\vec{BC} = 2\\vec{v} - 2\\vec{w}$ וגם $\\;\\vec{DC} = 2\\vec{v} - 2\\vec{u}$.',
        },
      },
      {
        label: 'ב',
        prompt: [
          'הקטע $SE$ הוא גובה הפירמידה. נתון: $|\\vec{u}| = 8$.',
          '',
          'מצאו את הערך של $\\vec{u} \\cdot \\vec{w}$.',
        ].join('\n'),
        answer_type: 'number',
        hints: [
          'הגובה $SE$ מאונך לבסיס, ולכן $\\vec{u}$ מאונך לכל וקטור בבסיס — בפרט ל-$\\vec{BC}$ ול-$\\vec{DC}$.',
          'מאונכות פירושה מכפלה סקלרית $0$: כתבו $\\vec{u} \\cdot \\vec{BC} = 0$ ו-$\\vec{u} \\cdot \\vec{DC} = 0$.',
          'מ-$\\vec{u} \\cdot \\vec{DC} = 0$ מקבלים את $\\vec{u} \\cdot \\vec{v}$, ומ-$\\vec{u} \\cdot \\vec{BC} = 0$ את הקשר ל-$\\vec{u} \\cdot \\vec{w}$.',
        ],
        solution: {
          steps: [
            'הגובה $SE$ מאונך לבסיס, ולכן $\\vec{u}$ מאונך לכל וקטור השוכן בבסיס.',
            'הוקטורים $\\vec{BC}$ ו-$\\vec{DC}$ שוכנים בבסיס, ולכן $\\;\\vec{u} \\cdot \\vec{BC} = 0$ וגם $\\vec{u} \\cdot \\vec{DC} = 0$.',
            'מציבים $\\vec{DC} = 2\\vec{v} - 2\\vec{u}$: $\\;\\vec{u} \\cdot (2\\vec{v} - 2\\vec{u}) = 0$.',
            'מפתחים: $\\;2\\,\\vec{u} \\cdot \\vec{v} - 2\\,\\vec{u} \\cdot \\vec{u} = 0$.',
            'זוכרים ש-$\\vec{u} \\cdot \\vec{u} = |\\vec{u}|^2 = 64$: $\\;2\\,\\vec{u} \\cdot \\vec{v} = 2 \\cdot 64$.',
            'מכאן $\\;\\vec{u} \\cdot \\vec{v} = 64$.',
            'מציבים $\\vec{BC} = 2\\vec{v} - 2\\vec{w}$: $\\;\\vec{u} \\cdot (2\\vec{v} - 2\\vec{w}) = 0$.',
            'מפתחים: $\\;2\\,\\vec{u} \\cdot \\vec{v} - 2\\,\\vec{u} \\cdot \\vec{w} = 0$.',
            'מכאן $\\;\\vec{u} \\cdot \\vec{w} = \\vec{u} \\cdot \\vec{v}$.',
            'הצבנו $\\vec{u} \\cdot \\vec{v} = 64$, ולכן $\\;\\vec{u} \\cdot \\vec{w} = 64$.',
          ],
          final_answer: '$\\vec{u} \\cdot \\vec{w} = 64$.',
        },
      },
      {
        label: 'ג',
        prompt: [
          'נתון: $\\vec{BA} = (-3,\\, 4,\\, 5)$.',
          '',
          'מצאו את גודל הזווית שבין $SB$ לבין הבסיס של הפירמידה.',
        ].join('\n'),
        answer_type: 'number',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 215 205',
            svg: `
              <line x1="72" y1="42" x2="72" y2="170" stroke="rgba(124,58,237,0.9)" stroke-width="1.6"/>
              <line x1="72" y1="170" x2="152" y2="170" stroke="rgba(2,132,199,0.9)" stroke-width="1.6"/>
              <line x1="72" y1="42" x2="152" y2="170" stroke="rgba(5,150,105,0.95)" stroke-width="1.6"/>
              <polyline points="72,158 84,158 84,170" fill="none" stroke="rgba(51,65,85,0.8)" stroke-width="1"/>
              <path d="M 138 170 A 15 15 0 0 0 145.2 157.6" fill="none" stroke="rgba(180,83,9,0.9)" stroke-width="1.1"/>
              <text x="127" y="164" fill="#B45309" font-size="10" font-family="Heebo, sans-serif">α</text>
              <text x="53" y="110" fill="#7C3AED" font-size="11" font-family="Heebo, sans-serif">8</text>
              <text x="106" y="186" fill="#0284C7" font-size="11" font-family="Heebo, sans-serif">5</text>
              <text x="112" y="98" fill="#059669" font-size="10.5" font-family="Heebo, sans-serif">√89</text>
              <circle cx="72" cy="42" r="2.6" fill="#334155"/>
              <text x="60" y="40" fill="#334155" font-size="10" font-family="Heebo, sans-serif">S</text>
              <circle cx="72" cy="170" r="2.6" fill="#334155"/>
              <text x="58" y="184" fill="#334155" font-size="10" font-family="Heebo, sans-serif">E</text>
              <circle cx="152" cy="170" r="2.6" fill="#334155"/>
              <text x="156" y="184" fill="#334155" font-size="10" font-family="Heebo, sans-serif">B</text>
            `,
            caption:
              'משולש הגובה $SEB$ (ישר-זווית ב-$E$): $SE = 8$ (הגובה), $EB = 5$ (חצי אלכסון הבסיס), והיתר $SB = \\sqrt{89}$. הזווית $\\alpha$ שבקדקוד $B$ היא הזווית שבין $SB$ לבסיס.',
          },
        ],
        hints: [
          'הזווית בין ישר למישור נמדדת בין הישר לבין היטלו על המישור. ההיטל של $S$ על הבסיס הוא $E$, ולכן ההיטל של $SB$ הוא $EB$.',
          'במשולש $SEB$ הזווית ב-$E$ ישרה. מצאו את $SE$ (שווה $|\\vec{u}|$) ואת $EB$ (חצי אלכסון הריבוע).',
          'צלע הריבוע היא $|\\vec{BA}| = \\sqrt{50}$; האלכסון $\\sqrt{50} \\cdot \\sqrt{2} = 10$ וחציו $EB = 5$. חשבו את הזווית ב-$B$.',
        ],
        solution: {
          steps: [
            'הזווית בין הישר $SB$ למישור הבסיס היא הזווית שבין $SB$ ובין היטלו על הבסיס.',
            'הגובה $SE$ מאונך לבסיס, ולכן ההיטל של $S$ על הבסיס הוא $E$, וההיטל של $SB$ הוא $EB$.',
            'הזווית המבוקשת היא $\\angle SBE$ במשולש $SEB$, הישר-זווית ב-$E$.',
            'אורך צלע הריבוע: $\\;|\\vec{BA}| = \\sqrt{(-3)^2 + 4^2 + 5^2} = \\sqrt{50}$.',
            'אלכסון הריבוע גדול פי $\\sqrt{2}$ מהצלע: $\\;\\sqrt{50} \\cdot \\sqrt{2} = \\sqrt{100} = 10$.',
            '$E$ מרכז הריבוע, ולכן $EB$ הוא חצי האלכסון: $\\;EB = \\dfrac{10}{2} = 5$.',
            'הגובה נתון: $\\;SE = |\\vec{u}| = 8$.',
            'לפי פיתגורס במשולש $SEB$: $\\;SB = |\\vec{w}| = \\sqrt{8^2 + 5^2} = \\sqrt{89}$.',
            'מחשבים את הזווית ב-$B$: $\\;\\tan(\\angle SBE) = \\dfrac{SE}{EB} = \\dfrac{8}{5}$.',
            'מכאן $\\;\\angle SBE = \\tan^{-1}\\!\\left(\\dfrac{8}{5}\\right) \\approx 57.99°$.',
          ],
          final_answer: 'הזווית שבין $SB$ לבסיס היא כ-$57.99°$ (בקירוב $58°$).',
        },
      },
      {
        label: 'ד',
        prompt: [
          'נתון: $E(0,\\, 4,\\, 5)$, ומישור הבסיס $ABCD$ מקביל לציר $z$.',
          '',
          'מצאו את משוואת המישור שעליו מונח בסיס הפירמידה.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'הנורמל למישור הבסיס מאונך לכל וקטור במישור — בפרט ל-$\\vec{BA} = (-3, 4, 5)$.',
          'מישור המקביל לציר $z$: הנורמל שלו מאונך לכיוון ציר $z$, כלומר $\\vec{n} \\cdot (0,0,1) = 0$.',
          'מצאו $\\vec{n} = (a,b,c)$ משני התנאים, והציבו את $E(0,4,5)$ למציאת האיבר החופשי.',
        ],
        solution: {
          steps: [
            'נסמן את הנורמל למישור הבסיס $\\;\\vec{n} = (a, b, c)$.',
            'המישור מקביל לציר $z$, ולכן הנורמל מאונך לכיוון ציר $z$: $\\;\\vec{n} \\cdot (0, 0, 1) = 0$.',
            'מכאן $\\;c = 0$.',
            'הוקטור $\\vec{BA} = (-3, 4, 5)$ שוכן בבסיס, ולכן הנורמל מאונך לו: $\\;\\vec{n} \\cdot (-3, 4, 5) = 0$.',
            'מציבים: $\\;-3a + 4b + 5c = 0$.',
            'עם $c = 0$ נשאר: $\\;-3a + 4b = 0$, כלומר $b = \\dfrac{3a}{4}$.',
            'בוחרים $a = 4$: $\\;b = 3$, $\\;c = 0$, ולכן $\\vec{n} = (4, 3, 0)$.',
            'משוואת המישור: $\\;4x + 3y + 0 \\cdot z + D = 0$.',
            'מציבים את $E(0, 4, 5)$ שעל המישור: $\\;4 \\cdot 0 + 3 \\cdot 4 + D = 0$.',
            'מבודדים: $\\;D = -12$.',
            'משוואת מישור הבסיס: $\\;4x + 3y - 12 = 0$.',
          ],
          final_answer: 'משוואת מישור הבסיס: $\\;4x + 3y - 12 = 0$.',
        },
      },
      {
        label: 'ה',
        prompt: [
          'נתון: שיעור ה-$x$ של הקדקוד $B$ הוא $3$.',
          '',
          'מצאו את שיעורי הקדקוד $B$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'הקדקוד $B$ נמצא על מישור הבסיס — הציבו $x = 3$ במשוואת המישור כדי למצוא את $y$.',
          'המרחק ממרכז הריבוע $E$ אל קדקוד הוא חצי האלכסון, $EB = 5$.',
          'כתבו $B(3, y, z)$, השתמשו בשתי המשוואות, ופתרו עבור $z$.',
        ],
        solution: {
          steps: [
            'הקדקוד $B$ על מישור הבסיס; מציבים $x = 3$ במשוואה $4x + 3y - 12 = 0$: $\\;12 + 3y - 12 = 0$.',
            'מכאן $\\;3y = 0$, כלומר $y = 0$.',
            'לכן $\\;B(3, 0, z)$.',
            'המרחק ממרכז הריבוע אל הקדקוד הוא חצי האלכסון: $\\;EB = 5$.',
            'מרחק בין $E(0, 4, 5)$ ל-$B(3, 0, z)$: $\\;\\sqrt{(3 - 0)^2 + (0 - 4)^2 + (z - 5)^2} = 5$.',
            'מעלים בריבוע: $\\;9 + 16 + (z - 5)^2 = 25$.',
            'מפשטים: $\\;25 + (z - 5)^2 = 25$.',
            'מכאן $\\;(z - 5)^2 = 0$, ולכן $z = 5$.',
            'לכן $\\;B(3, 0, 5)$.',
          ],
          final_answer: '$B(3,\\, 0,\\, 5)$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
