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
 *   Q3 — מספרים מרוכבים: פתרון $z^6 + 729i = 0$, פסילת שורשי המכנה, שטח מרובע
 *        במישור גאוס, וסיבוב — מכפלת הקדקודים כפונקציה של זווית הסיבוב.
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
  {
    id: 'b2024s572b-q3',
    year: 2024,
    season: 'summer',
    moed: 'b',
    paper: '572',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    // הערה: ניקוד השאלה הוא הערכה — יש לאמת מול השאלון הרשמי.
    totalPoints: 25,
    context:
      'בשאלה זו נעבוד עם מספרים מרוכבים בהצגה קוטבית ($r\\,\\operatorname{cis}\\,\\theta$, בזוויות במעלות), ונשתמש בהם כקדקודים של מרובע במישור גאוס.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצאו את פתרונות המשוואה $z^6 + 729i = 0$ (כאשר $z$ מספר מרוכב).',
        answer_type: 'expression',
        hints: [
          'העבירו אגף: $z^6 = -729i$, וכתבו את $-729i$ בהצגה קוטבית.',
          '$-729i = 729\\,\\operatorname{cis}\\,270°$. הוציאו שורש שישי — שורש מהרדיוס, והזווית $\\dfrac{270° + 360°k}{6}$.',
          '$\\sqrt[6]{729} = 3$, והזוויות יוצאות $45° + 60°k$ עבור $k = 0, 1, \\dots, 5$.',
        ],
        solution: {
          steps: [
            'מעבירים אגף: $\\;z^6 = -729i$.',
            'כותבים את $-729i$ בהצגה קוטבית: $\\;z^6 = 729\\,\\operatorname{cis}\\,270°$.',
            'מוציאים שורש שישי — שורש מהרדיוס וחלוקת הזווית: $\\;z_k = \\sqrt[6]{729}\\,\\operatorname{cis}\\!\\left(\\dfrac{270° + 360°k}{6}\\right)$.',
            'מציבים $\\sqrt[6]{729} = 3$ (כי $3^6 = 729$): $\\;z_k = 3\\,\\operatorname{cis}(45° + 60°k)$.',
            'מציבים $k = 0, 1, 2$: $\\;z_0 = 3\\,\\operatorname{cis}\\,45°,\\quad z_1 = 3\\,\\operatorname{cis}\\,105°,\\quad z_2 = 3\\,\\operatorname{cis}\\,165°$.',
            'מציבים $k = 3, 4, 5$: $\\;z_3 = 3\\,\\operatorname{cis}\\,225°,\\quad z_4 = 3\\,\\operatorname{cis}\\,285°,\\quad z_5 = 3\\,\\operatorname{cis}\\,345°$.',
          ],
          final_answer:
            'ששת הפתרונות: $\\;3\\,\\operatorname{cis}\\,45°,\\ 105°,\\ 165°,\\ 225°,\\ 285°,\\ 345°$ (כולם ברדיוס $3$).',
        },
      },
      {
        label: 'א2',
        prompt: 'מצאו את ארבעת הפתרונות של המשוואה $\\dfrac{z^6 + 729i}{z^2 - 9i} = 0$ (כאשר $z$ מספר מרוכב).',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 280 240',
            svg: `
              <line x1="55" y1="120" x2="230" y2="120" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <line x1="140" y1="35" x2="140" y2="210" stroke="rgba(51,65,85,0.5)" stroke-width="1"/>
              <text x="232" y="124" fill="#475569" font-size="10" font-family="Heebo, sans-serif">Re</text>
              <text x="124" y="40" fill="#475569" font-size="10" font-family="Heebo, sans-serif">Im</text>
              <circle cx="140" cy="120" r="70" fill="none" stroke="rgba(100,116,139,0.4)" stroke-width="1" stroke-dasharray="4,3"/>
              <circle cx="121.9" cy="52.4" r="3" fill="#2563EB"/>
              <text x="112" y="42" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">z₁</text>
              <circle cx="72.4" cy="101.9" r="3" fill="#2563EB"/>
              <text x="52" y="99" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">z₂</text>
              <circle cx="158.1" cy="187.6" r="3" fill="#2563EB"/>
              <text x="157" y="210" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">z₄</text>
              <circle cx="207.6" cy="138.1" r="3" fill="#2563EB"/>
              <text x="216" y="144" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">z₅</text>
              <circle cx="189.5" cy="70.5" r="3.6" fill="none" stroke="#DC2626" stroke-width="1.3"/>
              <line x1="187" y1="68" x2="192" y2="73" stroke="#DC2626" stroke-width="1.1"/>
              <line x1="192" y1="68" x2="187" y2="73" stroke="#DC2626" stroke-width="1.1"/>
              <text x="197" y="60" fill="#DC2626" font-size="10" font-family="Heebo, sans-serif">z₀</text>
              <circle cx="90.5" cy="169.5" r="3.6" fill="none" stroke="#DC2626" stroke-width="1.3"/>
              <line x1="88" y1="167" x2="93" y2="172" stroke="#DC2626" stroke-width="1.1"/>
              <line x1="93" y1="167" x2="88" y2="172" stroke="#DC2626" stroke-width="1.1"/>
              <text x="72" y="184" fill="#DC2626" font-size="10" font-family="Heebo, sans-serif">z₃</text>
              <circle cx="140" cy="120" r="1.8" fill="#334155"/>
            `,
            caption:
              'ששת הפתרונות של $z^6 = -729i$ על מעגל שרדיוסו $3$. בסעיף א2 נפסלים $z_0$ ($45°$) ו-$z_3$ ($225°$) — הם מאפסים את המכנה $z^2 - 9i$ (מסומנים באדום); נשארים ארבעת קדקודי המרובע (בכחול).',
          },
        ],
        hints: [
          'שבר שווה $0$ כאשר המונה מתאפס וגם המכנה שונה מ-$0$. המונה נותן את ששת הפתרונות מסעיף א1.',
          'מוצאים אילו פתרונות מאפסים את המכנה: $z^2 - 9i = 0$, כלומר $z^2 = 9i$.',
          '$z^2 = 9\\,\\operatorname{cis}\\,90°$ נותן $z = 3\\,\\operatorname{cis}\\,45°$ ו-$z = 3\\,\\operatorname{cis}\\,225°$ — אלה נפסלים.',
        ],
        solution: {
          steps: [
            'שבר שווה $0$ רק כאשר המונה מתאפס והמכנה שונה מ-$0$.',
            'המונה $z^6 + 729i = 0$ נותן את ששת הפתרונות מסעיף א1.',
            'נמצא אילו מהם מאפסים את המכנה: $\\;z^2 - 9i = 0$, כלומר $z^2 = 9i$.',
            'בהצגה קוטבית: $\\;z^2 = 9\\,\\operatorname{cis}\\,90°$.',
            'שורש ריבועי: $\\;z = 3\\,\\operatorname{cis}(45° + 180°k)$, כלומר $z = 3\\,\\operatorname{cis}\\,45°$ או $z = 3\\,\\operatorname{cis}\\,225°$.',
            'שני אלה ($z_0$ ו-$z_3$) מאפסים את המכנה, ולכן הם נפסלים.',
            'נשארים ארבעת הפתרונות: $\\;z_1 = 3\\,\\operatorname{cis}\\,105°,\\quad z_2 = 3\\,\\operatorname{cis}\\,165°,\\quad z_4 = 3\\,\\operatorname{cis}\\,285°,\\quad z_5 = 3\\,\\operatorname{cis}\\,345°$.',
          ],
          final_answer:
            'ארבעת הפתרונות: $\\;3\\,\\operatorname{cis}\\,105°,\\ 3\\,\\operatorname{cis}\\,165°,\\ 3\\,\\operatorname{cis}\\,285°,\\ 3\\,\\operatorname{cis}\\,345°$.',
        },
      },
      {
        label: 'ב',
        prompt:
          'הפתרונות שמצאתם בסעיף א2 מייצגים קדקודים של מרובע במישור גאוס. מצאו את שטח המרובע.',
        answer_type: 'number',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 280 240',
            svg: `
              <line x1="55" y1="120" x2="230" y2="120" stroke="rgba(51,65,85,0.45)" stroke-width="1"/>
              <line x1="140" y1="35" x2="140" y2="210" stroke="rgba(51,65,85,0.45)" stroke-width="1"/>
              <text x="232" y="124" fill="#475569" font-size="10" font-family="Heebo, sans-serif">Re</text>
              <text x="124" y="40" fill="#475569" font-size="10" font-family="Heebo, sans-serif">Im</text>
              <circle cx="140" cy="120" r="70" fill="none" stroke="rgba(100,116,139,0.35)" stroke-width="1" stroke-dasharray="4,3"/>
              <polygon points="121.9,52.4 72.4,101.9 158.1,187.6 207.6,138.1" fill="rgba(124,58,237,0.09)" stroke="rgba(124,58,237,0.9)" stroke-width="1.5"/>
              <line x1="140" y1="120" x2="121.9" y2="52.4" stroke="rgba(100,116,139,0.6)" stroke-width="0.9" stroke-dasharray="3,2"/>
              <line x1="140" y1="120" x2="72.4" y2="101.9" stroke="rgba(100,116,139,0.6)" stroke-width="0.9" stroke-dasharray="3,2"/>
              <line x1="140" y1="120" x2="158.1" y2="187.6" stroke="rgba(100,116,139,0.6)" stroke-width="0.9" stroke-dasharray="3,2"/>
              <line x1="140" y1="120" x2="207.6" y2="138.1" stroke="rgba(100,116,139,0.6)" stroke-width="0.9" stroke-dasharray="3,2"/>
              <text x="112" y="93" fill="#B45309" font-size="8.5" font-family="Heebo, sans-serif">60°</text>
              <text x="110" y="150" fill="#B45309" font-size="8.5" font-family="Heebo, sans-serif">120°</text>
              <text x="152" y="150" fill="#B45309" font-size="8.5" font-family="Heebo, sans-serif">60°</text>
              <text x="150" y="93" fill="#B45309" font-size="8.5" font-family="Heebo, sans-serif">120°</text>
              <circle cx="121.9" cy="52.4" r="3" fill="#2563EB"/>
              <text x="112" y="42" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">z₁</text>
              <circle cx="72.4" cy="101.9" r="3" fill="#2563EB"/>
              <text x="52" y="99" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">z₂</text>
              <circle cx="158.1" cy="187.6" r="3" fill="#2563EB"/>
              <text x="157" y="210" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">z₄</text>
              <circle cx="207.6" cy="138.1" r="3" fill="#2563EB"/>
              <text x="216" y="144" fill="#2563EB" font-size="10" font-family="Heebo, sans-serif">z₅</text>
              <circle cx="140" cy="120" r="1.8" fill="#334155"/>
              <text x="143" y="132" fill="#475569" font-size="9" font-family="Heebo, sans-serif">O</text>
            `,
            caption:
              'המרובע $z_1 z_2 z_4 z_5$ (רדיוס $3$). מחברים את המרכז $O$ לקדקודים; הזוויות המרכזיות הן $60°, 120°, 60°, 120°$. השטח הוא סכום ארבעת המשולשים: $S = 9\\sqrt{3}$.',
          },
        ],
        hints: [
          'כל ארבעת הקדקודים על מעגל ברדיוס $3$. חברו את המרכז $O$ לכל קדקוד — נוצרים ארבעה משולשים.',
          'הזוויות המרכזיות הן ההפרשים בין הזוויות הסמוכות: $60°, 120°, 60°, 120°$.',
          'שטח משולש עם שתי צלעות $3$ וזווית $\\theta$ ביניהן: $\\dfrac{1}{2} \\cdot 3 \\cdot 3 \\cdot \\sin\\theta$.',
        ],
        solution: {
          steps: [
            'ארבעת הקדקודים על מעגל שרדיוסו $3$, בזוויות $105°, 165°, 285°, 345°$.',
            'מחברים את המרכז $O$ לכל קדקוד ומקבלים ארבעה משולשים.',
            'הזוויות המרכזיות (הפרשי הזוויות הסמוכות): $\\;60°,\\ 120°,\\ 60°,\\ 120°$ (סכומן $360°$).',
            'שטח משולש עם צלעות $3, 3$ וזווית $60°$: $\\;\\dfrac{3 \\cdot 3 \\cdot \\sin 60°}{2} = \\dfrac{9\\sqrt{3}}{4}$.',
            'שטח משולש עם זווית $120°$: $\\;\\dfrac{3 \\cdot 3 \\cdot \\sin 120°}{2} = \\dfrac{9\\sqrt{3}}{4}$ (כי $\\sin 120° = \\sin 60°$).',
            'יש שני משולשים מכל סוג, ולכן: $\\;S = 4 \\cdot \\dfrac{9\\sqrt{3}}{4}$.',
            'מפשטים: $\\;S = 9\\sqrt{3}$.',
          ],
          final_answer: 'שטח המרובע: $\\;S = 9\\sqrt{3} \\approx 15.59$.',
        },
      },
      {
        label: 'ג',
        prompt: [
          'מסובבים את המרובע סביב הראשית בזווית $\\alpha$ נגד כיוון השעון ($0° < \\alpha < 90°$).',
          '',
          'מהו הערך של מכפלת כל המספרים המייצגים את קדקודי המרובע בעבור $\\alpha = 45°$? נמקו את תשובתכם.',
        ].join('\n'),
        answer_type: 'number',
        hints: [
          'סיבוב בזווית $\\alpha$ נגד כיוון השעון = כפל כל מספר ב-$\\operatorname{cis}\\,\\alpha$. יש ארבעה קדקודים, ולכן המכפלה נכפלת ב-$\\operatorname{cis}\\,4\\alpha$.',
          'מכפלת הקדקודים המקוריים: $\\;3^4\\,\\operatorname{cis}(105° + 165° + 285° + 345°)$.',
          'סכום הזוויות $900°$, ו-$\\operatorname{cis}\\,900° = \\operatorname{cis}\\,180° = -1$.',
        ],
        solution: {
          steps: [
            'סיבוב בזווית $\\alpha$ נגד כיוון השעון פירושו כפל כל קדקוד ב-$\\operatorname{cis}\\,\\alpha$.',
            'לאחר הסיבוב הקדקודים הם $\\;3\\,\\operatorname{cis}(105° + \\alpha),\\ \\dots,\\ 3\\,\\operatorname{cis}(345° + \\alpha)$.',
            'מכפלת ארבעתם: $\\;3^4\\,\\operatorname{cis}(105° + 165° + 285° + 345°) \\cdot \\operatorname{cis}(4\\alpha)$.',
            'מחשבים רדיוס וסכום זוויות: $\\;81\\,\\operatorname{cis}\\,900° \\cdot \\operatorname{cis}(4\\alpha)$.',
            'מצמצמים $\\operatorname{cis}\\,900° = \\operatorname{cis}\\,180° = -1$: $\\;-81\\,\\operatorname{cis}(4\\alpha)$.',
            'מציבים $\\alpha = 45°$: $\\;-81\\,\\operatorname{cis}(4 \\cdot 45°) = -81\\,\\operatorname{cis}\\,180°$.',
            'ומכיוון ש-$\\operatorname{cis}\\,180° = -1$: $\\;-81 \\cdot (-1) = 81$.',
          ],
          final_answer: 'המכפלה בעבור $\\alpha = 45°$ היא $\\;81$ (מספר ממשי).',
        },
      },
      {
        label: 'ד1',
        prompt: [
          'ממשיכים עם הסיבוב בזווית $\\alpha$ (נגד כיוון השעון, $0° < \\alpha < 90°$).',
          '',
          'מצאו את שני הערכים של $\\alpha$ שעבורם מכפלת כל המספרים המייצגים את קדקודי המרובע לאחר הסיבוב היא מספר מדומה טהור.',
        ].join('\n'),
        answer_type: 'number',
        hints: [
          'מסעיף ג, המכפלה לאחר הסיבוב היא $-81\\,\\operatorname{cis}(4\\alpha)$.',
          'מספר מדומה טהור ⟺ החלק הממשי מתאפס ⟺ $\\operatorname{cis}(4\\alpha) = \\pm i$.',
          '$\\operatorname{cis}(4\\alpha) = \\pm i$ כאשר $4\\alpha = 90°$ או $4\\alpha = 270°$ (בתחום הנתון).',
        ],
        solution: {
          steps: [
            'מסעיף ג, המכפלה לאחר סיבוב בזווית $\\alpha$ היא $\\;-81\\,\\operatorname{cis}(4\\alpha)$.',
            'המכפלה מדומה טהורה כאשר חלקהּ הממשי מתאפס, כלומר $\\;\\operatorname{cis}(4\\alpha) = \\pm i$.',
            'הערך $\\operatorname{cis}(4\\alpha) = i$ מתקבל כאשר $\\;4\\alpha = 90°$.',
            'הערך $\\operatorname{cis}(4\\alpha) = -i$ מתקבל כאשר $\\;4\\alpha = 270°$.',
            'מחלקים ב-$4$: $\\;\\alpha = 22.5°$ או $\\alpha = 67.5°$.',
            'שני הערכים נמצאים בתחום $0° < \\alpha < 90°$.',
          ],
          final_answer: '$\\alpha = 22.5°$ או $\\alpha = 67.5°$.',
        },
      },
      {
        label: 'ד2',
        prompt: 'מהו הערך של המכפלה בעבור כל אחד מן הערכים של $\\alpha$ שמצאתם?',
        answer_type: 'expression',
        hints: [
          'הציבו כל ערך של $\\alpha$ בביטוי $-81\\,\\operatorname{cis}(4\\alpha)$.',
          'עבור $\\alpha = 22.5°$: $\\;4\\alpha = 90°$ ו-$\\operatorname{cis}\\,90° = i$.',
          'עבור $\\alpha = 67.5°$: $\\;4\\alpha = 270°$ ו-$\\operatorname{cis}\\,270° = -i$.',
        ],
        solution: {
          steps: [
            'מציבים בביטוי $-81\\,\\operatorname{cis}(4\\alpha)$ מסעיף ד1.',
            'עבור $\\alpha = 22.5°$: $\\;-81\\,\\operatorname{cis}\\,90° = -81 \\cdot i = -81i$.',
            'עבור $\\alpha = 67.5°$: $\\;-81\\,\\operatorname{cis}\\,270° = -81 \\cdot (-i) = 81i$.',
          ],
          final_answer: 'בעבור $\\alpha = 22.5°$ המכפלה היא $-81i$, ובעבור $\\alpha = 67.5°$ המכפלה היא $81i$.',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
