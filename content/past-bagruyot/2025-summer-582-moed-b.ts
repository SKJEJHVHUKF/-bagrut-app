/**
 * שאלון 582 — קיץ תשפ"ה (2025), מועד ב'
 * =====================================
 *
 * המקור של השאלות: meyda.education.gov.il (משרד החינוך — נחלת הכלל).
 * הפתרונות נכתבו על-ידינו בסגנון האפליקציה, ואומתו מול פתרון הנבחן.
 *
 * תוכן השאלון:
 *   Q1 — גאומטריה אנליטית (אליפסה עם פרמטר, מוקד, מעגל, משיק, ריבוע חסום).
 *   Q2 — וקטורים במרחב (מנסרה ישרה, וקטורי בסיס, קולינאריות, מישור, נפח פירמידה).
 *   Q3 — מספרים מרוכבים (חילוק, שורשי משוואה, קולינאריות, מצולע במישור גאוס, שטח).
 *   Q4 — חקירת פונקציה מעריכית (אסימפטוטות, נקודת קיצון, פרמטר, גרף הנגזרת, אינטגרל/שטח).
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2025Summer582MoedB: PastBagrutQuestion[] = [
  {
    id: 'b2025s582b-q1',
    year: 2025,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    totalPoints: 25,
    context: [
      'נתונה אליפסה שמשוואתה $\\;\\dfrac{x^2}{25k^2} + \\dfrac{y^2}{16k^2} = 1$, כאשר $k$ הוא פרמטר חיובי.',
      'הנקודה $F$ היא המוקד הימני של האליפסה.',
      'נתון מעגל שמרכזו בנקודה $F$, והעובר דרך נקודת החיתוך של האליפסה עם החלק החיובי של ציר ה-$x$.',
      'הנקודה $B$ היא נקודת החיתוך של האליפסה עם החלק החיובי של ציר ה-$y$.',
      'הנקודה $D$ היא נקודת החיתוך של הקטע $BF$ עם המעגל.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 300 250',
        svg: `
          <line x1="18" y1="125" x2="290" y2="125" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <line x1="140" y1="18" x2="140" y2="240" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
          <text x="281" y="121" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
          <text x="128" y="26" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
          <ellipse cx="140" cy="125" rx="110" ry="88" fill="rgba(96,165,250,0.05)" stroke="rgba(96,165,250,0.9)" stroke-width="1.6"/>
          <circle cx="206" cy="125" r="44" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.9)" stroke-width="1.6"/>
          <line x1="140" y1="37" x2="206" y2="125" stroke="rgba(244,114,182,0.9)" stroke-width="1.4"/>
          <circle cx="140" cy="125" r="2.2" fill="rgba(226,232,240,0.9)"/>
          <text x="126" y="138" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">O</text>
          <circle cx="206" cy="125" r="3" fill="rgba(56,189,248,0.95)"/>
          <text x="186" y="140" fill="#38bdf8" font-size="10" font-family="Heebo, sans-serif">F(3k,0)</text>
          <circle cx="250" cy="125" r="2.6" fill="rgba(96,165,250,0.95)"/>
          <text x="240" y="140" fill="#60a5fa" font-size="9" font-family="Heebo, sans-serif">(5k,0)</text>
          <circle cx="140" cy="37" r="3" fill="rgba(96,165,250,0.95)"/>
          <text x="146" y="38" fill="#60a5fa" font-size="10" font-family="Heebo, sans-serif">B(0,4k)</text>
          <circle cx="179.6" cy="89.8" r="3" fill="rgba(251,191,36,0.95)"/>
          <text x="184" y="86" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">D</text>
        `,
        caption:
          'האליפסה $\\frac{x^2}{25k^2}+\\frac{y^2}{16k^2}=1$ והמעגל שמרכזו במוקד הימני $F(3k,0)$ ורדיוסו $2k$. $B(0,4k)$ הוא קודקוד האליפסה על החלק החיובי של ציר ה-$y$, ו-$D$ היא חיתוך הקטע $BF$ עם המעגל.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הביעו באמצעות $k$ את משוואת המעגל.',
        answer_type: 'expression',
        hints: [
          'מהמשוואה הקנונית: $a^2 = 25k^2$ ו-$b^2 = 16k^2$. מצאו את $c$ דרך $c^2 = a^2 - b^2$.',
          'המוקד הימני הוא $F(c, 0)$, ונקודת החיתוך עם החלק החיובי של ציר ה-$x$ היא הקודקוד $(a, 0)$.',
          'הרדיוס הוא המרחק מ-$F$ אל $(a, 0)$.',
        ],
        solution: {
          steps: [
            'מהמשוואה $\\dfrac{x^2}{25k^2} + \\dfrac{y^2}{16k^2} = 1$ מזהים $a^2 = 25k^2$ ו-$b^2 = 16k^2$.',
            'מכיוון ש-$k > 0$: חצי-הציר הגדול $a = 5k$ וחצי-הציר הקטן $b = 4k$.',
            'הקשר בין הצירים למוקד באליפסה: $\\;c^2 = a^2 - b^2$.',
            'מציבים: $\\;c^2 = 25k^2 - 16k^2 = 9k^2$.',
            'מוציאים שורש (כי $k>0$): $\\;c = 3k$.',
            'המוקד הימני נמצא על ציר ה-$x$ במרחק $c$ מהראשית: $\\;F(3k,\\, 0)$.',
            'האליפסה חותכת את החלק החיובי של ציר ה-$x$ בקודקוד $(a, 0) = (5k,\\, 0)$ — דרכו עובר המעגל.',
            'רדיוס המעגל הוא המרחק מ-$F$ אל נקודה זו: $\\;R = 5k - 3k = 2k$.',
            'משוואת מעגל שמרכזו $F(3k, 0)$ ורדיוסו $2k$: $\\;(x - 3k)^2 + y^2 = (2k)^2$.',
          ],
          final_answer: '$(x - 3k)^2 + y^2 = 4k^2$',
        },
      },
      {
        label: 'ב1',
        prompt: 'מצאו את היחס בין הקטע $BD$ ובין הקטע $DF$.',
        answer_type: 'number',
        hints: [
          'הנקודה $D$ נמצאת על המעגל, ולכן $DF$ שווה לרדיוס.',
          'חשבו את $BF$ (המרחק מ-$B$ אל $F$), ואז $BD = BF - DF$.',
        ],
        solution: {
          steps: [
            'הנקודה $B$ היא חיתוך האליפסה עם החלק החיובי של ציר ה-$y$, כלומר הקודקוד $(0, b) = (0,\\, 4k)$.',
            'אורך הקטע $BF$ לפי נוסחת המרחק בין $B(0, 4k)$ ל-$F(3k, 0)$: $\\;BF = \\sqrt{(3k - 0)^2 + (0 - 4k)^2}$.',
            'מפשטים: $\\;BF = \\sqrt{9k^2 + 16k^2} = \\sqrt{25k^2} = 5k$.',
            'הנקודה $D$ על המעגל, ולכן מרחקה מהמרכז $F$ שווה לרדיוס: $\\;DF = R = 2k$.',
            'הנקודה $D$ נמצאת על הקטע $BF$, לכן $\\;BD = BF - DF = 5k - 2k = 3k$.',
            'היחס המבוקש: $\\;\\dfrac{BD}{DF} = \\dfrac{3k}{2k} = \\dfrac{3}{2}$.',
          ],
          final_answer: '$\\dfrac{BD}{DF} = \\dfrac{3}{2}$',
        },
      },
      {
        label: 'ב2',
        prompt: 'הביעו באמצעות $k$ את שיעורי הנקודה $D$.',
        answer_type: 'expression',
        hints: [
          'נצלו את היחס $BD:DF = 3:2$ מהסעיף הקודם.',
          'השתמשו בנוסחת חלוקת קטע ביחס נתון, מ-$B(0, 4k)$ אל $F(3k, 0)$.',
        ],
        solution: {
          steps: [
            'הנקודה $D$ מחלקת את הקטע $BF$ ביחס $\\;BD : DF = 3 : 2$ (מ-$B$ אל $F$).',
            'נוסחת חלוקת קטע ביחס $m : n$ מ-$B$ אל $F$: הנקודה היא $\\dfrac{n \\cdot B + m \\cdot F}{m + n}$, עם $m = 3,\\ n = 2$.',
            'שיעור ה-$x$: $\\;x_D = \\dfrac{2 \\cdot 0 + 3 \\cdot 3k}{2 + 3} = \\dfrac{9k}{5}$.',
            'שיעור ה-$y$: $\\;y_D = \\dfrac{2 \\cdot 4k + 3 \\cdot 0}{2 + 3} = \\dfrac{8k}{5}$.',
          ],
          final_answer: '$D\\left(\\dfrac{9k}{5},\\ \\dfrac{8k}{5}\\right)$',
        },
      },
      {
        label: 'ג',
        prompt: 'הביעו באמצעות $k$ את משוואת המשיק למעגל בנקודה $D$.',
        answer_type: 'expression',
        hints: [
          'משיק למעגל מאונך לרדיוס בנקודת ההשקה; הרדיוס $FD$ מונח על הישר $BF$.',
          'מצאו את שיפוע $BF$, וקחו את הנגדי-ההופכי לשיפוע המשיק.',
          'השתמשו במשוואת ישר דרך הנקודה $D$ בשיפוע שמצאתם.',
        ],
        solution: {
          steps: [
            'המשיק למעגל בנקודה $D$ מאונך לרדיוס $FD$ בנקודת ההשקה.',
            'הרדיוס $FD$ מונח על הישר $BF$, לכן נחשב תחילה את שיפוע $BF$.',
            'שיפוע $BF$ דרך $B(0, 4k)$ ו-$F(3k, 0)$: $\\;m_{BF} = \\dfrac{0 - 4k}{3k - 0} = -\\dfrac{4}{3}$.',
            'המשיק מאונך לרדיוס, לכן שיפועו הוא הנגדי-ההופכי: $\\;m = \\dfrac{3}{4}$.',
            'משוואת המשיק דרך $D\\left(\\frac{9k}{5}, \\frac{8k}{5}\\right)$ בשיפוע $\\frac{3}{4}$: $\\;y - \\dfrac{8k}{5} = \\dfrac{3}{4}\\left(x - \\dfrac{9k}{5}\\right)$.',
            'פותחים סוגריים: $\\;y - \\dfrac{8k}{5} = \\dfrac{3}{4}x - \\dfrac{27k}{20}$.',
            'מבודדים את $y$: $\\;y = \\dfrac{3}{4}x - \\dfrac{27k}{20} + \\dfrac{8k}{5}$.',
            'מאחדים את איברי $k$ (מכנה משותף $20$): $\\;-\\dfrac{27k}{20} + \\dfrac{32k}{20} = \\dfrac{5k}{20} = \\dfrac{k}{4}$.',
            'משוואת המשיק: $\\;y = \\dfrac{3}{4}x + \\dfrac{k}{4}$.',
            'בצורה כללית (מכפילים ב-$4$ ומעבירים אגף): $\\;-3x + 4y - k = 0$.',
          ],
          final_answer: '$y = \\dfrac{3}{4}x + \\dfrac{k}{4}\\;$ (כלומר $-3x + 4y - k = 0$).',
        },
      },
      {
        label: 'ד',
        prompt: [
          'בונים ריבוע שאורך הצלע שלו הוא $9$. אחת מצלעות הריבוע נמצאת על המשיק שמצאתם בסעיף ג, והנקודה $B$ נמצאת בתוך הריבוע.',
          '',
          'הביעו באמצעות $k$ את משוואת הישר שעליו נמצאת צלע הריבוע המקבילה למשיק.',
        ].join('\n'),
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 240 240',
            svg: `
              <polygon points="105.6,220.8 220.8,134.4 134.4,19.2 19.2,105.6" fill="rgba(168,85,247,0.07)" stroke="rgba(168,85,247,0.55)" stroke-width="1.2"/>
              <line x1="105.6" y1="220.8" x2="220.8" y2="134.4" stroke="rgba(251,191,36,0.95)" stroke-width="1.9"/>
              <line x1="19.2" y1="105.6" x2="134.4" y2="19.2" stroke="rgba(52,211,153,0.95)" stroke-width="1.9"/>
              <line x1="105.6" y1="220.8" x2="134.4" y2="19.2" stroke="rgba(148,163,184,0.5)" stroke-width="1" stroke-dasharray="4,3"/>
              <line x1="220.8" y1="134.4" x2="19.2" y2="105.6" stroke="rgba(148,163,184,0.5)" stroke-width="1" stroke-dasharray="4,3"/>
              <line x1="120" y1="120" x2="163.2" y2="177.6" stroke="rgba(96,165,250,0.95)" stroke-width="1.4"/>
              <polyline points="169.6,172.8 164.8,166.4 158.4,171.2" fill="none" stroke="rgba(96,165,250,0.9)" stroke-width="1"/>
              <circle cx="120" cy="120" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="96" y="117" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">B(0,4k)</text>
              <circle cx="163.2" cy="177.6" r="2.8" fill="rgba(251,191,36,0.95)"/>
              <text x="168" y="184" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">D</text>
              <text x="142" y="156" fill="#60a5fa" font-size="9.5" font-family="Heebo, sans-serif">4.5</text>
              <text x="184" y="80" fill="#c4b5fd" font-size="10" font-family="Heebo, sans-serif">9</text>
            `,
            caption:
              'הריבוע (אורך צלע $9$): צלע אחת מונחת על המשיק מסעיף ג (בזהב), והצלע הנגדית מקבילה לו (בירוק) — היא הישר המבוקש בסעיף ד. הנקודה $B$ היא מרכז הריבוע (מפגש האלכסונים), ולכן מרחקה מכל צלע הוא $\\frac{9}{2}=4.5$ (נתון ומשמש בסעיף ה).',
          },
        ],
        hints: [
          'הצלע הנגדית מקבילה למשיק, לכן משוואתה $-3x + 4y + c = 0$ — אותו אגף שמאלי, איבר חופשי אחר.',
          'אורך הצלע $9$ הוא המרחק בין שתי הצלעות המקבילות; השתמשו בנוסחת המרחק בין ישרים מקבילים.',
          'בחרו את הסימן כך ש-$B(0, 4k)$ תהיה בין שתי הצלעות (כלומר בתוך הריבוע).',
        ],
        solution: {
          steps: [
            'הצלע מסעיף ג מונחת על המשיק $\\;-3x + 4y - k = 0$.',
            'הצלע הנגדית מקבילה למשיק, לכן משוואתה $\\;-3x + 4y + c = 0$ עבור קבוע $c$.',
            'אורך צלע הריבוע, $9$, שווה למרחק בין שתי הצלעות המקבילות.',
            'המרחק בין הישרים המקבילים $-3x + 4y - k = 0$ ו-$-3x + 4y + c = 0$: $\\;d = \\dfrac{|c - (-k)|}{\\sqrt{(-3)^2 + 4^2}} = \\dfrac{|c + k|}{5}$.',
            'משווים למרחק $9$: $\\;\\dfrac{|c + k|}{5} = 9$, כלומר $|c + k| = 45$.',
            'נציב את $B(0, 4k)$ במשוואת המשיק: $\\;-3 \\cdot 0 + 4 \\cdot 4k - k = 15k > 0$, כלומר $B$ נמצאת מעל המשיק.',
            'כדי ש-$B$ תהיה בתוך הריבוע הצלע הנגדית רחוקה יותר באותו כיוון, ולכן בוחרים $\\;c + k = -45$.',
            'מבודדים: $\\;c = -k - 45$.',
            'משוואת הישר שעליו נמצאת הצלע המקבילה: $\\;-3x + 4y - k - 45 = 0$.',
          ],
          final_answer: '$-3x + 4y - k - 45 = 0$',
        },
      },
      {
        label: 'ה',
        prompt: [
          'נתון כי הנקודה $B$ היא נקודת המפגש של אלכסוני הריבוע.',
          '',
          'מצאו את הערך של $k$.',
        ].join('\n'),
        answer_type: 'number',
        hints: [
          'מפגש האלכסונים של ריבוע הוא מרכזו, והוא נמצא במרחק שווה מכל הצלעות.',
          'המרחק ממרכז הריבוע לכל צלע הוא חצי מאורך הצלע: $\\frac{9}{2}$.',
          'חשבו את המרחק מ-$B$ אל המשיק (הצלע מסעיף ג) והשוו ל-$4.5$.',
        ],
        solution: {
          steps: [
            'הנקודה $B$ היא מפגש האלכסונים, כלומר מרכז הריבוע.',
            'מרכז ריבוע נמצא במרחק חצי-צלע מכל צלע: $\\;\\dfrac{9}{2} = 4.5$.',
            'בפרט, המרחק מ-$B$ אל המשיק (הצלע מסעיף ג) שווה $4.5$.',
            'מרחק מ-$B(0, 4k)$ אל הישר $-3x + 4y - k = 0$: $\\;d = \\dfrac{|-3 \\cdot 0 + 4 \\cdot 4k - k|}{\\sqrt{(-3)^2 + 4^2}}$.',
            'מפשטים (כי $k > 0$): $\\;d = \\dfrac{|15k|}{5} = 3k$.',
            'משווים למרחק הנדרש: $\\;\\dfrac{15k}{5} = 4.5$, כלומר $15k = 22.5$.',
            'מבודדים: $\\;k = \\dfrac{22.5}{15} = \\dfrac{3}{2}$.',
          ],
          final_answer: '$k = \\dfrac{3}{2}$',
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2025s582b-q2',
    year: 2025,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 25,
    context: [
      "בסרטוט שלפניכם מנסרה ישרה $AOBA'O'B'$ שבסיסה $AOB$ הוא משולש ישר-זווית, $\\angle AOB = 90°$.",
      "הנקודה $K$ היא אמצע המקצוע $AB$.",
      "הנקודה $E$ נמצאת על הקטע $O'B$ כך ש-$\\overrightarrow{O'E} = \\frac{1}{3}\\,\\overrightarrow{O'B}$.",
      "הנקודה $N$ נמצאת על הקטע $AE$ כך ש-$\\overrightarrow{AN} = \\frac{3}{4}\\,\\overrightarrow{AE}$.",
      "נסמן: $\\;\\overrightarrow{OO'} = \\underline{w}$, $\\;\\overrightarrow{OB} = \\underline{v}$, $\\;\\overrightarrow{OA} = \\underline{u}$.",
    ].join("\n"),
    diagrams: [
      {
        type: 'custom',
        viewBox: '62 132 138 162',
        svg: `
          <polygon points="86,271 164,235 110,235" fill="rgba(96,165,250,0.05)" stroke="none"/>
          <line x1="86" y1="271" x2="164" y2="235" stroke="rgba(226,232,240,0.85)" stroke-width="1.4"/>
          <line x1="86" y1="271" x2="86" y2="179.2" stroke="rgba(226,232,240,0.85)" stroke-width="1.4"/>
          <line x1="164" y1="235" x2="164" y2="143.2" stroke="rgba(226,232,240,0.85)" stroke-width="1.4"/>
          <line x1="86" y1="179.2" x2="164" y2="143.2" stroke="rgba(226,232,240,0.85)" stroke-width="1.4"/>
          <line x1="110" y1="143.2" x2="86" y2="179.2" stroke="rgba(226,232,240,0.85)" stroke-width="1.4"/>
          <line x1="110" y1="143.2" x2="164" y2="143.2" stroke="rgba(226,232,240,0.85)" stroke-width="1.4"/>
          <line x1="110" y1="235" x2="86" y2="271" stroke="rgba(96,165,250,0.9)" stroke-width="1.5" stroke-dasharray="5,3"/>
          <line x1="110" y1="235" x2="164" y2="235" stroke="rgba(96,165,250,0.9)" stroke-width="1.5" stroke-dasharray="5,3"/>
          <line x1="110" y1="235" x2="110" y2="143.2" stroke="rgba(96,165,250,0.9)" stroke-width="1.5" stroke-dasharray="5,3"/>
          <polyline points="118,235 113.56,241.66 105.56,241.66" fill="none" stroke="rgba(148,163,184,0.8)" stroke-width="1"/>
          <line x1="110" y1="143.2" x2="164" y2="235" stroke="rgba(56,189,248,0.75)" stroke-width="1" stroke-dasharray="3,2"/>
          <line x1="86" y1="271" x2="128" y2="173.8" stroke="rgba(56,189,248,0.75)" stroke-width="1"/>
          <line x1="110" y1="143.2" x2="125" y2="253" stroke="rgba(251,191,36,0.95)" stroke-width="1.5"/>
          <circle cx="110" cy="235" r="2.4" fill="rgba(226,232,240,0.9)"/>
          <text x="99" y="231" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">O</text>
          <circle cx="86" cy="271" r="3" fill="rgba(226,232,240,0.95)"/>
          <text x="74" y="280" fill="#e2e8f0" font-size="10" font-family="Heebo, sans-serif">A</text>
          <circle cx="164" cy="235" r="3" fill="rgba(226,232,240,0.95)"/>
          <text x="169" y="240" fill="#e2e8f0" font-size="10" font-family="Heebo, sans-serif">B</text>
          <circle cx="110" cy="143.2" r="3" fill="rgba(226,232,240,0.95)"/>
          <text x="97" y="139" fill="#e2e8f0" font-size="10" font-family="Heebo, sans-serif">O'</text>
          <circle cx="86" cy="179.2" r="3" fill="rgba(226,232,240,0.95)"/>
          <text x="72" y="181" fill="#e2e8f0" font-size="10" font-family="Heebo, sans-serif">A'</text>
          <circle cx="164" cy="143.2" r="3" fill="rgba(226,232,240,0.95)"/>
          <text x="169" y="143" fill="#e2e8f0" font-size="10" font-family="Heebo, sans-serif">B'</text>
          <circle cx="125" cy="253" r="2.8" fill="rgba(244,114,182,0.95)"/>
          <text x="129" y="262" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">K</text>
          <circle cx="128" cy="173.8" r="2.8" fill="rgba(56,189,248,0.95)"/>
          <text x="133" y="171" fill="#38bdf8" font-size="10" font-family="Heebo, sans-serif">E</text>
          <circle cx="117.5" cy="198.1" r="2.8" fill="rgba(251,191,36,0.95)"/>
          <text x="104" y="201" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">N</text>
          <text x="89" y="257" fill="#60a5fa" font-size="10" font-family="Heebo, sans-serif">u</text>
          <text x="139" y="231" fill="#60a5fa" font-size="10" font-family="Heebo, sans-serif">v</text>
          <text x="98" y="193" fill="#60a5fa" font-size="10" font-family="Heebo, sans-serif">w</text>
        `,
        caption:
          "המנסרה הישרה $AOBA'O'B'$ (הבסיס $AOB$ ישר-זווית ב-$O$). הקטעים המקווקווים הם וקטורי הבסיס $\\underline{u}=\\overrightarrow{OA}$, $\\underline{v}=\\overrightarrow{OB}$, $\\underline{w}=\\overrightarrow{OO'}$. הנקודה $E$ על האלכסון $O'B$, $N$ על $AE$, ו-$K$ אמצע $AB$; שלוש הנקודות $O'$, $N$, $K$ על ישר אחד (בזהב).",
      },
    ],
    parts: [
      {
        label: 'א1',
        prompt: "הביעו באמצעות $\\underline{u}$, $\\underline{v}$ ו-$\\underline{w}$ את $\\overrightarrow{O'N}$.",
        answer_type: 'expression',
        hints: [
          "פרקו את $\\overrightarrow{O'N}$ לאורך מסלול: $\\overrightarrow{O'O} + \\overrightarrow{OA} + \\overrightarrow{AN}$.",
          "הביעו את $\\overrightarrow{AE}$ דרך $\\overrightarrow{AO} + \\overrightarrow{OO'} + \\overrightarrow{O'E}$, וזכרו $\\overrightarrow{O'B} = -\\underline{w} + \\underline{v}$.",
          "הציבו $\\overrightarrow{AN} = \\frac{3}{4}\\overrightarrow{AE}$ ואספו מקדמים לכל וקטור.",
        ],
        solution: {
          steps: [
            "נפרק את $\\overrightarrow{O'N}$ לאורך מסלול: $\\;\\overrightarrow{O'N} = \\overrightarrow{O'O} + \\overrightarrow{OA} + \\overrightarrow{AN}$.",
            "לפי הסימון: $\\;\\overrightarrow{O'O} = -\\underline{w}$ ו-$\\overrightarrow{OA} = \\underline{u}$.",
            "נחשב את $\\overrightarrow{AE}$: $\\;\\overrightarrow{AE} = \\overrightarrow{AO} + \\overrightarrow{OO'} + \\overrightarrow{O'E}$.",
            "מציבים $\\overrightarrow{AO} = -\\underline{u}$, $\\overrightarrow{OO'} = \\underline{w}$ ו-$\\overrightarrow{O'E} = \\frac{1}{3}\\overrightarrow{O'B}$: $\\;\\overrightarrow{AE} = -\\underline{u} + \\underline{w} + \\frac{1}{3}\\overrightarrow{O'B}$.",
            "וקטור האלכסון: $\\;\\overrightarrow{O'B} = \\overrightarrow{O'O} + \\overrightarrow{OB} = -\\underline{w} + \\underline{v}$.",
            "מציבים: $\\;\\overrightarrow{AE} = -\\underline{u} + \\underline{w} + \\frac{1}{3}(-\\underline{w} + \\underline{v})$.",
            "מסדרים: $\\;\\overrightarrow{AE} = -\\underline{u} + \\frac{1}{3}\\underline{v} + \\frac{2}{3}\\underline{w}$.",
            "מציבים ב-$\\overrightarrow{AN} = \\frac{3}{4}\\overrightarrow{AE}$: $\\;\\overrightarrow{AN} = -\\frac{3}{4}\\underline{u} + \\frac{1}{4}\\underline{v} + \\frac{1}{2}\\underline{w}$.",
            "חוזרים ל-$\\overrightarrow{O'N} = -\\underline{w} + \\underline{u} + \\overrightarrow{AN}$: $\\;\\overrightarrow{O'N} = -\\underline{w} + \\underline{u} - \\frac{3}{4}\\underline{u} + \\frac{1}{4}\\underline{v} + \\frac{1}{2}\\underline{w}$.",
            "אוספים מקדמים: $\\;\\overrightarrow{O'N} = \\frac{1}{4}\\underline{u} + \\frac{1}{4}\\underline{v} - \\frac{1}{2}\\underline{w}$.",
          ],
          final_answer: "$\\overrightarrow{O'N} = \\dfrac{1}{4}\\underline{u} + \\dfrac{1}{4}\\underline{v} - \\dfrac{1}{2}\\underline{w}$",
        },
      },
      {
        label: 'א2',
        prompt: "הוכיחו כי הנקודות $O'$, $N$, $K$ נמצאות על ישר אחד, ומצאו את היחס בין $O'K$ ובין $O'N$.",
        answer_type: 'proof',
        hints: [
          "חשבו את $\\overrightarrow{O'K}$ באותו אופן, עם $\\overrightarrow{AK} = \\frac{1}{2}\\overrightarrow{AB}$ (כי $K$ אמצע $AB$).",
          "בדקו אם $\\overrightarrow{O'N}$ ו-$\\overrightarrow{O'K}$ מקבילים (כפולה סקלרית זה של זה).",
          "וקטורים מקבילים היוצאים מנקודה משותפת $O'$ מעידים על שלוש נקודות על ישר אחד; היחס נקבע מהמקדם.",
        ],
        solution: {
          steps: [
            "נחשב את $\\overrightarrow{O'K}$: $\\;\\overrightarrow{O'K} = \\overrightarrow{O'O} + \\overrightarrow{OA} + \\overrightarrow{AK}$.",
            "$K$ אמצע $AB$, לכן $\\;\\overrightarrow{AK} = \\frac{1}{2}\\overrightarrow{AB} = \\frac{1}{2}(-\\underline{u} + \\underline{v})$.",
            "מציבים: $\\;\\overrightarrow{O'K} = -\\underline{w} + \\underline{u} + \\frac{1}{2}(-\\underline{u} + \\underline{v})$.",
            "מסדרים: $\\;\\overrightarrow{O'K} = \\frac{1}{2}\\underline{u} + \\frac{1}{2}\\underline{v} - \\underline{w}$.",
            "משווים ל-$\\overrightarrow{O'N} = \\frac{1}{4}\\underline{u} + \\frac{1}{4}\\underline{v} - \\frac{1}{2}\\underline{w}$: כל מקדם ב-$\\overrightarrow{O'N}$ הוא חצי מהמקדם המתאים ב-$\\overrightarrow{O'K}$.",
            "לכן $\\;\\overrightarrow{O'N} = \\frac{1}{2}\\overrightarrow{O'K}$.",
            "הוקטורים $\\overrightarrow{O'N}$ ו-$\\overrightarrow{O'K}$ מקבילים ויוצאים מאותה נקודה $O'$, ולכן $O'$, $N$, $K$ נמצאות על ישר אחד ($N$ אף אמצע $O'K$).",
            "מהקשר $\\overrightarrow{O'K} = 2\\,\\overrightarrow{O'N}$ נובע היחס: $\\;\\dfrac{O'K}{O'N} = 2$.",
          ],
          final_answer: "הנקודות על ישר אחד (כי $\\overrightarrow{O'N} = \\frac{1}{2}\\overrightarrow{O'K}$), והיחס $\\dfrac{O'K}{O'N} = 2$.",
        },
      },
      {
        label: 'ב',
        prompt: [
          "נתון: $\\;E(0, 3, 18)$, $\\;A(12, 0, 0)$, $\\;O(0, 0, 0)$. הקודקוד $B$ נמצא על החלק החיובי של ציר ה-$y$, והקודקוד $O'$ נמצא על החלק החיובי של ציר ה-$z$.",
          "",
          "מצאו את שיעורי הנקודות $N$ ו-$B$.",
        ].join("\n"),
        answer_type: 'expression',
        hints: [
          "ל-$N$: השתמשו ב-$\\overrightarrow{AN} = \\frac{3}{4}\\overrightarrow{AE} = \\frac{3}{4}(E - A)$, ואז $N = A + \\overrightarrow{AN}$.",
          "ל-$B$ ו-$O'$: כתבו $B(0, y, 0)$ ו-$O'(0, 0, z)$, והשתמשו ב-$\\overrightarrow{O'E} = \\frac{1}{3}\\overrightarrow{O'B}$ רכיב-רכיב.",
        ],
        solution: {
          steps: [
            "מציאת $N$: $\\;\\overrightarrow{AN} = \\frac{3}{4}\\overrightarrow{AE} = \\frac{3}{4}(E - A)$.",
            "מחשבים את $E - A = (0 - 12,\\ 3 - 0,\\ 18 - 0) = (-12,\\ 3,\\ 18)$.",
            "לכן $\\;\\overrightarrow{AN} = \\frac{3}{4}(-12,\\ 3,\\ 18) = \\left(-9,\\ \\tfrac{9}{4},\\ \\tfrac{27}{2}\\right)$.",
            "הנקודה $\\;N = A + \\overrightarrow{AN} = (12,\\ 0,\\ 0) + \\left(-9,\\ \\tfrac{9}{4},\\ \\tfrac{27}{2}\\right)$.",
            "מסכמים: $\\;N = \\left(3,\\ \\tfrac{9}{4},\\ \\tfrac{27}{2}\\right)$, כלומר $N(3,\\ 2.25,\\ 13.5)$.",
            "מציאת $B$: נסמן $B(0,\\ y,\\ 0)$ (על ציר $y$ חיובי) ו-$O'(0,\\ 0,\\ z)$ (על ציר $z$ חיובי).",
            "הנתון $\\overrightarrow{O'E} = \\frac{1}{3}\\overrightarrow{O'B}$ נותן $\\;E - O' = \\frac{1}{3}(B - O')$.",
            "מציבים: $\\;(0,\\ 3,\\ 18) - (0,\\ 0,\\ z) = \\frac{1}{3}\\big((0,\\ y,\\ 0) - (0,\\ 0,\\ z)\\big)$.",
            "כלומר $\\;(0,\\ 3,\\ 18 - z) = \\left(0,\\ \\tfrac{1}{3}y,\\ -\\tfrac{1}{3}z\\right)$.",
            "רכיב $y$: $\\;3 = \\tfrac{1}{3}y \\Rightarrow y = 9$.",
            "רכיב $z$: $\\;18 - z = -\\tfrac{1}{3}z \\Rightarrow 18 = \\tfrac{2}{3}z \\Rightarrow z = 27$.",
            "לכן $\\;B(0,\\ 9,\\ 0)$ (וגם $O'(0,\\ 0,\\ 27)$).",
          ],
          final_answer: "$N\\left(3,\\ \\tfrac{9}{4},\\ \\tfrac{27}{2}\\right) = (3,\\ 2.25,\\ 13.5)$ ו-$B(0,\\ 9,\\ 0)$.",
        },
      },
      {
        label: 'ג',
        prompt: "מצאו את משוואת המישור $A'KB'$.",
        answer_type: 'expression',
        hints: [
          "מצאו תחילה את הקודקודים: $A' = A + \\overrightarrow{OO'}$, $B' = B + \\overrightarrow{OO'}$ (מנסרה ישרה), ו-$K$ אמצע $AB$.",
          "הנורמל $\\vec{n} = (a,b,c)$ מאונך לשני וקטורי כיוון במישור, למשל $\\overrightarrow{KA'}$ ו-$\\overrightarrow{KB'}$.",
          "פתרו את המערכת לנורמל, והציבו אחת הנקודות למציאת האיבר החופשי.",
        ],
        solution: {
          steps: [
            "במנסרה ישרה הפאה העליונה מוזזת ב-$\\overrightarrow{OO'} = (0, 0, 27)$: $\\;A' = (12,\\ 0,\\ 27)$ ו-$B' = (0,\\ 9,\\ 27)$.",
            "הנקודה $K$ אמצע $AB$: $\\;K = \\frac{A + B}{2} = \\frac{(12, 0, 0) + (0, 9, 0)}{2} = (6,\\ 4.5,\\ 0)$.",
            "וקטור כיוון ראשון במישור: $\\;\\overrightarrow{KA'} = A' - K = (6,\\ -4.5,\\ 27)$.",
            "וקטור כיוון שני: $\\;\\overrightarrow{KB'} = B' - K = (-6,\\ 4.5,\\ 27)$.",
            "הנורמל $\\vec{n} = (a, b, c)$ מאונך לשניהם: $\\;6a - 4.5b + 27c = 0$ וגם $-6a + 4.5b + 27c = 0$.",
            "מחברים את שתי המשוואות: $\\;54c = 0 \\Rightarrow c = 0$.",
            "מחסרים: $\\;12a - 9b = 0 \\Rightarrow b = \\frac{4}{3}a$. בוחרים $a = 3$, ואז $b = 4$, $\\;\\vec{n} = (3,\\ 4,\\ 0)$.",
            "משוואת המישור: $\\;3x + 4y + d = 0$. מציבים $A'(12, 0, 27)$: $\\;3 \\cdot 12 + 4 \\cdot 0 + d = 0 \\Rightarrow d = -36$.",
            "משוואת המישור: $\\;3x + 4y - 36 = 0$.",
          ],
          final_answer: "$3x + 4y - 36 = 0$",
        },
      },
      {
        label: 'ד1',
        prompt: "מצאו את המרחק בין הנקודה $N$ ובין המישור $A'KB'$.",
        answer_type: 'number',
        hints: [
          "השתמשו בנוסחת המרחק מנקודה למישור: $d = \\dfrac{|a x_0 + b y_0 + c z_0 + d|}{\\sqrt{a^2 + b^2 + c^2}}$.",
          "הציבו את $N(3,\\ 2.25,\\ 13.5)$ ואת מקדמי המישור $3x + 4y - 36 = 0$.",
        ],
        solution: {
          steps: [
            "נוסחת המרחק מנקודה $N(x_0, y_0, z_0)$ למישור $3x + 4y - 36 = 0$: $\\;d = \\dfrac{|3x_0 + 4y_0 - 36|}{\\sqrt{3^2 + 4^2}}$.",
            "מציבים $N(3,\\ 2.25,\\ 13.5)$: $\\;d = \\dfrac{|3 \\cdot 3 + 4 \\cdot 2.25 - 36|}{\\sqrt{9 + 16}}$.",
            "המונה: $\\;|9 + 9 - 36| = |-18| = 18$.",
            "המכנה: $\\;\\sqrt{25} = 5$.",
            "לכן $\\;d = \\dfrac{18}{5} = 3.6$.",
          ],
          final_answer: "$d = \\dfrac{18}{5} = 3.6$",
        },
      },
      {
        label: 'ד2',
        prompt: "מצאו את נפח הפירמידה $NA'KB'$.",
        answer_type: 'number',
        diagrams: [
          {
            type: 'custom',
            viewBox: '70 135 120 135',
            svg: `
              <polygon points="86,179.2 125,253 164,143.2" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.9)" stroke-width="1.5"/>
              <line x1="117.5" y1="198.1" x2="86" y2="179.2" stroke="rgba(226,232,240,0.8)" stroke-width="1.2"/>
              <line x1="117.5" y1="198.1" x2="125" y2="253" stroke="rgba(226,232,240,0.8)" stroke-width="1.2"/>
              <line x1="117.5" y1="198.1" x2="164" y2="143.2" stroke="rgba(226,232,240,0.8)" stroke-width="1.2"/>
              <line x1="117.5" y1="198.1" x2="130.5" y2="204.6" stroke="rgba(96,165,250,0.95)" stroke-width="1.3" stroke-dasharray="4,2"/>
              <circle cx="130.5" cy="204.6" r="1.8" fill="rgba(96,165,250,0.9)"/>
              <circle cx="117.5" cy="198.1" r="3" fill="rgba(251,191,36,0.95)"/>
              <text x="103" y="196" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">N</text>
              <circle cx="86" cy="179.2" r="2.8" fill="rgba(226,232,240,0.95)"/>
              <text x="72" y="181" fill="#e2e8f0" font-size="10" font-family="Heebo, sans-serif">A'</text>
              <circle cx="125" cy="253" r="2.8" fill="rgba(244,114,182,0.95)"/>
              <text x="128" y="262" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">K</text>
              <circle cx="164" cy="143.2" r="2.8" fill="rgba(226,232,240,0.95)"/>
              <text x="169" y="143" fill="#e2e8f0" font-size="10" font-family="Heebo, sans-serif">B'</text>
              <text x="132" y="211" fill="#60a5fa" font-size="9.5" font-family="Heebo, sans-serif">3.6</text>
            `,
            caption:
              "הפירמידה $NA'KB'$: הבסיס הוא המשולש $A'KB'$ (שטח $202.5$), והגובה הוא המרחק מהקודקוד $N$ אל מישור הבסיס, $d = 3.6$. הנפח $\\frac{1}{3} \\cdot 202.5 \\cdot 3.6 = 243$.",
          },
        ],
        hints: [
          "נפח פירמידה: $V = \\frac{1}{3} \\cdot S_{A'KB'} \\cdot d$ — הבסיס הוא המשולש $A'KB'$ והגובה הוא המרחק $d$ מ-$N$ למישור.",
          "שטח $A'KB'$: בסיס $A'B'$ וגובה ממנו. שימו לב ש-$A'B' \\parallel AB$ ו-$K$ נמצאת ישירות מתחת לאמצע $A'B'$.",
          "הציבו את השטח ואת $d = 3.6$ מהסעיף הקודם.",
        ],
        solution: {
          steps: [
            "נפח הפירמידה (בסיס $A'KB'$, גובה = המרחק מ-$N$ למישור): $\\;V = \\frac{1}{3} \\cdot S_{A'KB'} \\cdot d$.",
            "אורך $A'B'$: $\\;A'B' = |B' - A'| = |(-12,\\ 9,\\ 0)| = \\sqrt{144 + 81} = \\sqrt{225} = 15$.",
            "אמצע $A'B'$ הוא $M'(6,\\ 4.5,\\ 27)$, והוא נמצא ישירות מעל $K(6,\\ 4.5,\\ 0)$.",
            "לכן הגובה מ-$K$ אל $A'B'$ הוא הקטע האנכי $KM'$ שאורכו $27$.",
            "שטח המשולש: $\\;S_{A'KB'} = \\frac{A'B' \\cdot KM'}{2} = \\frac{15 \\cdot 27}{2} = 202.5$.",
            "מציבים $S_{A'KB'} = 202.5$ ו-$d = 3.6$: $\\;V = \\frac{1}{3} \\cdot 202.5 \\cdot 3.6$.",
            "מחשבים: $\\;V = \\frac{202.5 \\cdot 3.6}{3} = \\frac{729}{3} = 243$.",
          ],
          final_answer: "$V = 243$",
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2025s582b-q3',
    year: 2025,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 25,
    context: [
      "נתונים שני מספרים מרוכבים $z_1$ ו-$z_2$ שמכפלתם היא $z_1 z_2 = -51 + 12i$.",
      "נתון $z_1 = 6 + 3i$.",
    ].join("\n"),
    parts: [
      {
        label: 'א',
        prompt: "מצאו את המספר $z_2$.",
        answer_type: 'expression',
        hints: [
          "חילוק מספרים מרוכבים: בודדו $z_2 = \\dfrac{z_1 z_2}{z_1}$ והכפילו מונה ומכנה בצמוד המכנה.",
          "הצמוד של $6 + 3i$ הוא $6 - 3i$, והמכנה הופך לממשי.",
        ],
        solution: {
          steps: [
            "מהנתון $z_1 z_2 = -51 + 12i$ ו-$z_1 = 6 + 3i$: $\\;z_2 = \\dfrac{-51 + 12i}{6 + 3i}$.",
            "מכפילים מונה ומכנה בצמוד המכנה $6 - 3i$: $\\;z_2 = \\dfrac{(-51 + 12i)(6 - 3i)}{(6 + 3i)(6 - 3i)}$.",
            "המכנה (הפרש ריבועים): $\\;(6 + 3i)(6 - 3i) = 36 - 9i^2 = 36 + 9 = 45$.",
            "פותחים את המונה: $\\;(-51 + 12i)(6 - 3i) = -306 + 153i + 72i - 36i^2$.",
            "מציבים $i^2 = -1$: $\\;-306 + 153i + 72i + 36 = -270 + 225i$.",
            "מחלקים ב-$45$: $\\;z_2 = \\dfrac{-270 + 225i}{45} = -6 + 5i$.",
          ],
          final_answer: "$z_2 = -6 + 5i$",
        },
      },
      {
        label: 'ב',
        prompt: [
          "נתונה המשוואה $w^3 = z_1 + z_2$, כאשר $w$ הוא משתנה מרוכב.",
          "",
          "מצאו את פתרונות המשוואה.",
        ].join("\n"),
        answer_type: 'expression',
        hints: [
          "חשבו תחילה את $z_1 + z_2$.",
          "כתבו את התוצאה בצורה קוטבית $R\\,\\text{cis}\\,\\varphi$.",
          "נוסחת שורש שלישי: $\\sqrt[3]{R}\\,\\text{cis}\\dfrac{\\varphi + 360°k}{3}$ עבור $k = 0, 1, 2$.",
        ],
        solution: {
          steps: [
            "מחשבים את אגף ימין: $\\;z_1 + z_2 = (6 + 3i) + (-6 + 5i) = 8i$.",
            "המשוואה: $\\;w^3 = 8i$.",
            "כותבים את $8i$ בצורה קוטבית: $\\;8i = 8\\,\\text{cis}\\,90°$.",
            "נוסחת השורש השלישי: $\\;w_k = \\sqrt[3]{8}\\,\\text{cis}\\!\\left(\\dfrac{90° + 360°k}{3}\\right) = 2\\,\\text{cis}(30° + 120°k)$.",
            "$k = 0$: $\\;w_0 = 2\\,\\text{cis}\\,30°$.",
            "$k = 1$: $\\;w_1 = 2\\,\\text{cis}\\,150°$.",
            "$k = 2$: $\\;w_2 = 2\\,\\text{cis}\\,270°$.",
          ],
          final_answer: "$w_0 = 2\\,\\text{cis}\\,30°$, $\\;w_1 = 2\\,\\text{cis}\\,150°$, $\\;w_2 = 2\\,\\text{cis}\\,270°$.",
        },
      },
      {
        label: 'ג',
        prompt: [
          "נתון מספר מרוכב $z = 2(\\cos\\theta + i\\sin\\theta)$, כאשר $0° \\le \\theta < 360°$.",
          "נתון כי המספרים $z$ ו-$z^3$ נמצאים על ישר אחד העובר בראשית הצירים.",
          "",
          "מצאו את ארבע האפשרויות של המספר $z$.",
        ].join("\n"),
        answer_type: 'expression',
        hints: [
          "כתבו את $z^3$ בצורה קוטבית: $z^3 = 8\\,\\text{cis}\\,3\\theta$.",
          "שני מספרים נמצאים על ישר אחד דרך הראשית כאשר הפרש הארגומנטים שלהם הוא כפולה של $180°$.",
          "פתרו את המשוואה $2\\theta = 180°k$ בתחום הנתון.",
        ],
        solution: {
          steps: [
            "נתון $z = 2\\,\\text{cis}\\,\\theta$, ולכן $\\;z^3 = 2^3\\,\\text{cis}\\,3\\theta = 8\\,\\text{cis}\\,3\\theta$.",
            "שני מספרים נמצאים על ישר אחד דרך הראשית כאשר הפרש הארגומנטים שלהם הוא כפולה של $180°$.",
            "התנאי: $\\;3\\theta - \\theta = 180°k$.",
            "מפשטים: $\\;2\\theta = 180°k \\Rightarrow \\theta = 90°k$.",
            "בתחום $0° \\le \\theta < 360°$ מתקבלים: $\\;\\theta = 0°,\\ 90°,\\ 180°,\\ 270°$.",
          ],
          final_answer: "$z = 2\\,\\text{cis}\\,0°,\\ 2\\,\\text{cis}\\,90°,\\ 2\\,\\text{cis}\\,180°,\\ 2\\,\\text{cis}\\,270°$ (כלומר $2,\\ 2i,\\ -2,\\ -2i$).",
        },
      },
      {
        label: 'ד1',
        prompt: [
          "פתרונות המשוואה מסעיף ב וארבעת המספרים מסעיף ג מייצגים את כל הקודקודים של מצולע קמור במישור גאוס.",
          "",
          "שרטטו את המצולע במערכת צירים.",
        ].join("\n"),
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 220 235',
            svg: `
              <line x1="20" y1="110" x2="202" y2="110" stroke="rgba(226,232,240,0.4)" stroke-width="1"/>
              <line x1="110" y1="18" x2="110" y2="202" stroke="rgba(226,232,240,0.4)" stroke-width="1"/>
              <text x="194" y="106" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">Re</text>
              <text x="96" y="26" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">Im</text>
              <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(226,232,240,0.35)" stroke-width="1" stroke-dasharray="3,3"/>
              <line x1="110" y1="110" x2="180" y2="110" stroke="rgba(148,163,184,0.45)" stroke-width="0.8"/>
              <line x1="110" y1="110" x2="170.62" y2="75" stroke="rgba(148,163,184,0.45)" stroke-width="0.8"/>
              <line x1="110" y1="110" x2="110" y2="40" stroke="rgba(148,163,184,0.45)" stroke-width="0.8"/>
              <line x1="110" y1="110" x2="49.38" y2="75" stroke="rgba(148,163,184,0.45)" stroke-width="0.8"/>
              <line x1="110" y1="110" x2="40" y2="110" stroke="rgba(148,163,184,0.45)" stroke-width="0.8"/>
              <line x1="110" y1="110" x2="110" y2="180" stroke="rgba(148,163,184,0.45)" stroke-width="0.8"/>
              <polygon points="180,110 170.62,75 110,40 49.38,75 40,110 110,180" fill="rgba(168,85,247,0.10)" stroke="rgba(168,85,247,0.9)" stroke-width="1.5"/>
              <circle cx="110" cy="110" r="2" fill="rgba(226,232,240,0.9)"/>
              <text x="98" y="122" fill="#94a3b8" font-size="9" font-family="Heebo, sans-serif">O</text>
              <circle cx="180" cy="110" r="3" fill="rgba(56,189,248,0.95)"/>
              <text x="183" y="106" fill="#38bdf8" font-size="9" font-family="Heebo, sans-serif">0°</text>
              <circle cx="170.62" cy="75" r="3" fill="rgba(251,191,36,0.95)"/>
              <text x="174" y="70" fill="#fbbf24" font-size="9" font-family="Heebo, sans-serif">30°</text>
              <circle cx="110" cy="40" r="3" fill="rgba(56,189,248,0.95)"/>
              <text x="114" y="36" fill="#38bdf8" font-size="9" font-family="Heebo, sans-serif">90°</text>
              <circle cx="49.38" cy="75" r="3" fill="rgba(251,191,36,0.95)"/>
              <text x="28" y="70" fill="#fbbf24" font-size="9" font-family="Heebo, sans-serif">150°</text>
              <circle cx="40" cy="110" r="3" fill="rgba(56,189,248,0.95)"/>
              <text x="20" y="106" fill="#38bdf8" font-size="9" font-family="Heebo, sans-serif">180°</text>
              <circle cx="110" cy="180" r="3.4" fill="rgba(52,211,153,0.95)"/>
              <text x="114" y="192" fill="#34d399" font-size="9" font-family="Heebo, sans-serif">270°</text>
            `,
            caption:
              "המצולע הקמור במישור גאוס: $6$ קודקודים על מעגל ברדיוס $2$. שלושת קודקודי סעיף ב ($w$) בזוויות $30°, 150°, 270°$ (זהב), וארבעת קודקודי סעיף ג ($z$) בזוויות $0°, 90°, 180°, 270°$ (כחול). הקודקוד ב-$270°$ משותף לשתי הקבוצות (ירוק), ולכן יש $6$ קודקודים שונים. השטח = סכום $6$ המשולשים המרכזיים.",
          },
        ],
        hints: [
          "כל המספרים נמצאים על מעגל ברדיוס $2$; סמנו כל אחד לפי הזווית שלו.",
          "שימו לב שהזווית $270°$ מופיעה גם בסעיף ב וגם בסעיף ג — זהו קודקוד אחד משותף.",
        ],
        solution: {
          steps: [
            "כל שבעת המספרים מסעיפים ב ו-ג נמצאים על מעגל ברדיוס $2$ סביב הראשית.",
            "מסעיף ב — זוויות $30°,\\ 150°,\\ 270°$; מסעיף ג — זוויות $0°,\\ 90°,\\ 180°,\\ 270°$.",
            "הזווית $270°$ חוזרת בשתי הקבוצות, ולכן יש $6$ קודקודים שונים: $\\;0°,\\ 30°,\\ 90°,\\ 150°,\\ 180°,\\ 270°$.",
            "מסדרים את הקודקודים לפי הזווית ומחברים ביניהם — מתקבל מצולע קמור בן $6$ צלעות (ראו שרטוט).",
          ],
          final_answer: "מצולע קמור בן $6$ קודקודים על מעגל ברדיוס $2$, בזוויות $0°,\\ 30°,\\ 90°,\\ 150°,\\ 180°,\\ 270°$.",
        },
      },
      {
        label: 'ד2',
        prompt: "חשבו את השטח של המצולע.",
        answer_type: 'expression',
        hints: [
          "חלקו את המצולע ל-$6$ משולשים מרכזיים שקודקודם המשותף בראשית.",
          "שטח משולש עם שתי צלעות $R$ וזווית $\\gamma$ ביניהן: $\\frac{1}{2}R^2\\sin\\gamma$. סכמו על הזוויות המרכזיות.",
        ],
        solution: {
          steps: [
            "מחלקים את המצולע ל-$6$ משולשים מרכזיים (קודקוד משותף בראשית, שתי צלעות $R = 2$).",
            "שטח משולש מרכזי עם זווית מרכזית $\\gamma$: $\\;\\dfrac{R^2 \\sin\\gamma}{2} = \\dfrac{4\\sin\\gamma}{2} = 2\\sin\\gamma$.",
            "הזוויות המרכזיות (ההפרשים בין קודקודים סמוכים): $\\;30°,\\ 60°,\\ 60°,\\ 30°,\\ 90°,\\ 90°$.",
            "סוכמים: $\\;S = 2(\\sin30° + \\sin60° + \\sin60° + \\sin30° + \\sin90° + \\sin90°)$.",
            "מציבים $\\sin30° = \\tfrac{1}{2}$, $\\sin60° = \\tfrac{\\sqrt3}{2}$, $\\sin90° = 1$: $\\;S = 2\\!\\left(2 \\cdot \\tfrac{1}{2} + 2 \\cdot \\tfrac{\\sqrt3}{2} + 2 \\cdot 1\\right)$.",
            "מפשטים: $\\;S = 2(1 + \\sqrt3 + 2) = 2(3 + \\sqrt3) = 6 + 2\\sqrt3$.",
          ],
          final_answer: "$S = 6 + 2\\sqrt3 \\approx 9.46$",
        },
      },
      {
        label: 'ה',
        prompt: [
          "נתון מספר מרוכב $4(\\cos\\alpha + i\\sin\\alpha)$, כאשר $0° \\le \\alpha < 360°$.",
          "מכפילים כל אחד מן המספרים המייצגים את קודקודי המצולע במספר מרוכב זה, כך שנוצר מצולע חדש.",
          "",
          "מצאו פי כמה גדול שטח המצולע החדש משטח המצולע שמצאתם בסעיף ד.",
        ].join("\n"),
        answer_type: 'number',
        hints: [
          "כפל ב-$4\\,\\text{cis}\\,\\alpha$ = סיבוב בזווית $\\alpha$ יחד עם הגדלה (הומותטיה) פי $4$.",
          "סיבוב אינו משנה שטח; שטח גדל ביחס של ריבוע מקדם ההגדלה.",
        ],
        solution: {
          steps: [
            "כפל ב-$4(\\cos\\alpha + i\\sin\\alpha) = 4\\,\\text{cis}\\,\\alpha$ מסובב כל נקודה בזווית $\\alpha$ ומכפיל את גודלה (מרחקה מהראשית) פי $4$.",
            "הסיבוב אינו משנה שטח; הגדלת כל המרחקים פי $4$ (הומותטיה) מגדילה את השטח פי $4^2$.",
            "לכן $\\;\\dfrac{S'}{S} = 4^2 = 16$, כאשר $S'$ הוא שטח המצולע החדש.",
            "אפשר גם לוודא ישירות: המצולע החדש חסום במעגל ברדיוס $2 \\cdot 4 = 8$, והיחס $\\left(\\frac{8}{2}\\right)^2 = 16$.",
          ],
          final_answer: "שטח המצולע החדש גדול פי $16$.",
        },
      },
    ],
    solutionSource: 'authored',
  },
  {
    id: 'b2025s582b-q4',
    year: 2025,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 4,
    topic: 'פונקציה מעריכית',
    totalPoints: 25,
    context: [
      'נתונה הפונקציה $\\;f(x) = \\dfrac{e^x + x}{e^x - x} + b\\;$, המוגדרת לכל $x$.',
      '$b$ הוא פרמטר.',
      '',
      'בסעיף א ענו על תת-הסעיפים (1)–(3), והביעו את תשובותיכם באמצעות $b$ אם יש צורך.',
    ].join('\n'),
    parts: [
      {
        label: 'א1',
        prompt: 'מצאו את משוואות האסימפטוטות האופקיות של הפונקציה $f(x)$.',
        answer_type: 'expression',
        hints: [
          'אסימפטוטה אופקית מתקבלת מהגבול של $f(x)$ כאשר $x \\to \\infty$ וכאשר $x \\to -\\infty$.',
          'ב-$+\\infty$ חלקו מונה ומכנה ב-$e^x$ ונצלו ש-$\\frac{x}{e^x} \\to 0$; ב-$-\\infty$ חלקו ב-$x$ ונצלו ש-$e^x \\to 0$.',
        ],
        solution: {
          steps: [
            'אסימפטוטה אופקית נמצאת על-ידי חישוב הגבול של $f(x)$ בקצוות התחום.',
            'נחשב תחילה את הגבול ב-$+\\infty$. נחלק את מונה ומכנה השבר ב-$e^x$:',
            '$\\dfrac{e^x + x}{e^x - x} = \\dfrac{1 + \\frac{x}{e^x}}{1 - \\frac{x}{e^x}}$',
            'כאשר $x \\to \\infty$ הפונקציה $e^x$ גדלה מהר הרבה יותר מ-$x$, ולכן $\\dfrac{x}{e^x} \\to 0$.',
            'מציבים: $\\;\\dfrac{1 + 0}{1 - 0} = 1$.',
            'מוסיפים את $b$: $\\;\\lim\\limits_{x \\to \\infty} f(x) = 1 + b$.',
            'כעת הגבול ב-$-\\infty$. כאן $e^x \\to 0$, לכן נחלק את מונה ומכנה השבר ב-$x$:',
            '$\\dfrac{e^x + x}{e^x - x} = \\dfrac{\\frac{e^x}{x} + 1}{\\frac{e^x}{x} - 1}$',
            'כאשר $x \\to -\\infty$ מתקיים $e^x \\to 0$, ולכן $\\dfrac{e^x}{x} \\to 0$.',
            'מציבים: $\\;\\dfrac{0 + 1}{0 - 1} = -1$.',
            'מוסיפים את $b$: $\\;\\lim\\limits_{x \\to -\\infty} f(x) = b - 1$.',
            'לפונקציה שתי אסימפטוטות אופקיות שונות.',
          ],
          final_answer: '$y = 1 + b\\;$ (כאשר $x \\to \\infty$),$\\;\\;y = b - 1\\;$ (כאשר $x \\to -\\infty$).',
        },
      },
      {
        label: 'א2',
        prompt: 'מצאו את שיעורי נקודת החיתוך של גרף הפונקציה $f(x)$ עם ציר ה-$y$.',
        answer_type: 'expression',
        hints: [
          'נקודת החיתוך עם ציר ה-$y$ מתקבלת בהצבת $x = 0$.',
          'זכרו ש-$e^0 = 1$.',
        ],
        solution: {
          steps: [
            'נקודת החיתוך עם ציר ה-$y$ מתקבלת בהצבת $x = 0$.',
            '$f(0) = \\dfrac{e^0 + 0}{e^0 - 0} + b$',
            'מכיוון ש-$e^0 = 1$: $\\;f(0) = \\dfrac{1 + 0}{1 - 0} + b$.',
            'מפשטים: $\\;f(0) = 1 + b$.',
          ],
          final_answer: '$(0,\\ 1 + b)$',
        },
      },
      {
        label: 'א3',
        prompt: 'מצאו את שיעורי נקודת הקיצון של הפונקציה $f(x)$, וקבעו את סוגה.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 340 130',
            svg: `
              <rect x="15" y="18" width="310" height="96" fill="none" stroke="rgba(148,163,184,0.45)" stroke-width="1"/>
              <line x1="95" y1="18" x2="95" y2="114" stroke="rgba(148,163,184,0.45)" stroke-width="1"/>
              <line x1="15" y1="50" x2="325" y2="50" stroke="rgba(148,163,184,0.45)" stroke-width="1"/>
              <line x1="15" y1="82" x2="325" y2="82" stroke="rgba(148,163,184,0.45)" stroke-width="1"/>
              <line x1="210" y1="18" x2="210" y2="114" stroke="rgba(148,163,184,0.4)" stroke-width="1" stroke-dasharray="4,3"/>
              <text x="50" y="40" fill="#cbd5e1" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">x</text>
              <text x="50" y="72" fill="#cbd5e1" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">f '(x)</text>
              <text x="50" y="104" fill="#cbd5e1" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">f(x)</text>
              <text x="210" y="40" fill="#e2e8f0" font-size="13" font-family="Heebo, sans-serif" text-anchor="middle">1</text>
              <text x="150" y="76" fill="#34d399" font-size="16" font-family="Heebo, sans-serif" text-anchor="middle">+</text>
              <text x="210" y="76" fill="#e2e8f0" font-size="14" font-family="Heebo, sans-serif" text-anchor="middle">0</text>
              <text x="270" y="76" fill="#f87171" font-size="18" font-family="Heebo, sans-serif" text-anchor="middle">&#8722;</text>
              <line x1="125" y1="108" x2="172" y2="90" stroke="#34d399" stroke-width="1.6"/>
              <polyline points="165,89 172,90 169,96" fill="none" stroke="#34d399" stroke-width="1.4"/>
              <circle cx="210" cy="86" r="3" fill="#fbbf24"/>
              <line x1="248" y1="90" x2="295" y2="108" stroke="#f87171" stroke-width="1.6"/>
              <polyline points="289,103 295,108 288,109" fill="none" stroke="#f87171" stroke-width="1.4"/>
            `,
            caption:
              'טבלת סימני הנגזרת $f\'(x)$: לפני $x=1$ הנגזרת חיובית והפונקציה עולה, אחרי $x=1$ הנגזרת שלילית והפונקציה יורדת — לכן ב-$x=1$ יש נקודת מקסימום.',
          },
        ],
        hints: [
          'גזרו לפי כלל המנה; נגזרת הקבוע $b$ היא $0$.',
          'אחרי פישוט המונה מתקבל $f\'(x) = \\dfrac{2e^x(1-x)}{(e^x-x)^2}$. המכנה ו-$2e^x$ תמיד חיוביים.',
          'הסימן של $f\'$ נקבע רק על-ידי $(1-x)$ — בדקו מתי הוא חיובי ומתי שלילי.',
        ],
        solution: {
          steps: [
            'נגזור את $f(x)$. הקבוע $b$ נגזרתו $0$, ואת השבר נגזור לפי כלל המנה.',
            '$f\'(x) = \\dfrac{(e^x + 1)(e^x - x) - (e^x + x)(e^x - 1)}{(e^x - x)^2}$',
            'נפתח את האיבר הראשון במונה: $\\;(e^x + 1)(e^x - x) = e^{2x} - xe^x + e^x - x$.',
            'נפתח את האיבר השני: $\\;(e^x + x)(e^x - 1) = e^{2x} - e^x + xe^x - x$.',
            'נחסר את השני מהראשון: $\\;(e^{2x} - xe^x + e^x - x) - (e^{2x} - e^x + xe^x - x)$.',
            'מצטמצם ל: $\\;2e^x - 2xe^x = 2e^x(1 - x)$.',
            'לכן $\\;f\'(x) = \\dfrac{2e^x(1 - x)}{(e^x - x)^2}$.',
            'נשווה ל-$0$. המכנה $(e^x - x)^2 > 0$ תמיד, וגם $2e^x > 0$ תמיד.',
            'לכן מספיק $\\;1 - x = 0$, כלומר $\\;x = 1$.',
            'נקבע את הסוג לפי סימן הנגזרת, שתלוי רק ב-$(1 - x)$:',
            'עבור $x < 1$: $\\;1 - x > 0$, לכן $f\' > 0$ — הפונקציה עולה.',
            'עבור $x > 1$: $\\;1 - x < 0$, לכן $f\' < 0$ — הפונקציה יורדת.',
            'עולה לפני $x = 1$ ויורדת אחריו, ולכן זו נקודת מקסימום.',
            'נחשב את ערך ה-$y$: $\\;f(1) = \\dfrac{e^1 + 1}{e^1 - 1} + b = \\dfrac{e + 1}{e - 1} + b$.',
          ],
          final_answer: 'נקודת מקסימום $\\left(1,\\ \\dfrac{e + 1}{e - 1} + b\\right)$.',
        },
      },
      {
        label: 'ב',
        prompt: 'נתון כי לפונקציה $f(x)$ יש אסימפטוטה אופקית שמשוואתה $y = 1.5$. מצאו את הערך של $b$ (מצאו את שתי האפשרויות).',
        answer_type: 'number',
        hints: [
          'מסעיף א(1) יש שתי אסימפטוטות אופקיות: $y = 1 + b$ ו-$y = b - 1$.',
          'כל אחת מהן יכולה להיות זו ששווה ל-$1.5$ — מכאן שתי משוואות.',
        ],
        solution: {
          steps: [
            'מסעיף א(1) יש שתי אסימפטוטות אופקיות: $\\;y = 1 + b\\;$ ו-$\\;y = b - 1$.',
            'אחת מהן שווה ל-$1.5$, ולכן יש שתי אפשרויות.',
            'אפשרות ראשונה: $\\;1 + b = 1.5 \\;\\Rightarrow\\; b = 0.5$.',
            'אפשרות שנייה: $\\;b - 1 = 1.5 \\;\\Rightarrow\\; b = 2.5$.',
          ],
          final_answer: '$b = 0.5\\;$ או $\\;b = 2.5$.',
        },
      },
      {
        label: 'ג',
        prompt: [
          'בסעיפים ג–ה הציבו בפונקציה את הערך הקטן יותר של $b$ שמצאתם, כלומר $b = 0.5$.',
          '',
          'שרטטו סקיצה של גרף הפונקציה $f(x)$.',
        ].join('\n'),
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 320 260',
            svg: `
              <line x1="12" y1="180" x2="305" y2="180" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="110" y1="40" x2="110" y2="245" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="299" y="174" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">x</text>
              <text x="98" y="48" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">y</text>
              <line x1="12" y1="112.5" x2="300" y2="112.5" stroke="rgba(96,165,250,0.7)" stroke-width="1.2" stroke-dasharray="5,4"/>
              <line x1="12" y1="202.5" x2="300" y2="202.5" stroke="rgba(52,211,153,0.7)" stroke-width="1.2" stroke-dasharray="5,4"/>
              <text x="244" y="108" fill="#60a5fa" font-size="10.5" font-family="Heebo, sans-serif">y = 1.5</text>
              <text x="240" y="216" fill="#34d399" font-size="10.5" font-family="Heebo, sans-serif">y = -0.5</text>
              <polyline points="12,201.7 26,201 54,196.8 82,178.3 96,153.2 110,112.5 124,73.3 138,60.1 152,67.2 166,79.1 194,96.7 222,105.4 250,109.4 278,111.1" fill="none" stroke="rgba(251,191,36,0.95)" stroke-width="2"/>
              <circle cx="110" cy="112.5" r="3" fill="#60a5fa"/>
              <text x="60" y="110" fill="#60a5fa" font-size="10" font-family="Heebo, sans-serif">(0, 1.5)</text>
              <circle cx="138" cy="60.1" r="3.2" fill="#fbbf24"/>
              <text x="144" y="57" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">(1, 2.66)</text>
            `,
            caption:
              'גרף $f(x)$ עבור $b = 0.5$: עולה בכל $x < 1$ עד נקודת המקסימום $(1,\\ 2.66)$ ואז יורד. חותך את ציר ה-$y$ בנקודה $(0,\\ 1.5)$, מתקרב לאסימפטוטה $y = 1.5$ מימין ולאסימפטוטה $y = -0.5$ משמאל.',
          },
        ],
        hints: [
          'הציבו $b = 0.5$ ועדכנו את האסימפטוטות, נקודת החיתוך עם ציר $y$ ונקודת המקסימום מסעיף א.',
          'שימו לב: נקודת החיתוך עם ציר $y$ יוצאת בדיוק על האסימפטוטה הימנית $y = 1.5$.',
        ],
        solution: {
          steps: [
            'נציב $b = 0.5$, כלומר $\\;f(x) = \\dfrac{e^x + x}{e^x - x} + 0.5$.',
            'אסימפטוטה אופקית ימנית ($x \\to \\infty$): $\\;y = 1 + 0.5 = 1.5$.',
            'אסימפטוטה אופקית שמאלית ($x \\to -\\infty$): $\\;y = 0.5 - 1 = -0.5$.',
            'חיתוך עם ציר ה-$y$: $\\;(0,\\ 1 + 0.5) = (0,\\ 1.5)$.',
            'נקודת מקסימום: $\\;\\left(1,\\ \\dfrac{e + 1}{e - 1} + 0.5\\right) \\approx (1,\\ 2.66)$.',
            'הפונקציה עולה בכל $x < 1$ ויורדת בכל $x > 1$.',
            'מימין למקסימום הגרף יורד ומתקרב לאסימפטוטה $y = 1.5$ מלמעלה.',
            'משמאל, ככל ש-$x$ קטֵן, הגרף יורד ומתקרב לאסימפטוטה $y = -0.5$.',
          ],
          final_answer: 'ראו הסקיצה: מקסימום ב-$(1,\\ 2.66)$, אסימפטוטות $y = 1.5$ ו-$y = -0.5$, וחיתוך ציר $y$ ב-$(0,\\ 1.5)$.',
        },
      },
      {
        label: 'ד1',
        prompt: [
          'ידוע כי נקודת החיתוך של גרף הפונקציה $f(x)$ עם ציר ה-$y$ היא אחת משתי נקודות הפיתול של הפונקציה $f(x)$. פונקציית הנגזרת $f\'(x)$ מוגדרת לכל $x$.',
          '',
          'מצאו את משוואות האסימפטוטות האופקיות של פונקציית הנגזרת $f\'(x)$, אם יש כאלה.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'הנגזרת אינה תלויה ב-$b$, ושווה $f\'(x) = \\dfrac{2e^x(1-x)}{(e^x-x)^2}$.',
          'ב-$+\\infty$ חלקו מונה ומכנה ב-$e^{2x}$; ב-$-\\infty$ זכרו ש-$e^x \\to 0$ והמונה שואף ל-$0$ בעוד המכנה שואף ל-$\\infty$.',
        ],
        solution: {
          steps: [
            'הנגזרת אינה תלויה ב-$b$ (נגזרת הקבוע היא $0$): $\\;f\'(x) = \\dfrac{2e^x(1 - x)}{(e^x - x)^2}$.',
            'נפתח את המכנה כדי לחשב גבולות: $\\;f\'(x) = \\dfrac{2e^x - 2xe^x}{e^{2x} - 2xe^x + x^2}$.',
            'נחשב את הגבול ב-$+\\infty$ — נחלק מונה ומכנה ב-$e^{2x}$:',
            '$f\'(x) = \\dfrac{\\frac{2}{e^x} - \\frac{2x}{e^x}}{1 - \\frac{2x}{e^x} + \\frac{x^2}{e^{2x}}}$',
            'כל מנה מהצורה $\\dfrac{x^k}{e^{mx}}$ שואפת ל-$0$, כי $e^x$ גדלה מהר יותר מכל חזקה של $x$.',
            'מציבים: $\\;\\lim\\limits_{x \\to \\infty} f\'(x) = \\dfrac{0 - 0}{1 - 0 + 0} = 0$.',
            'נחשב את הגבול ב-$-\\infty$. כאן $e^x \\to 0$, לכן המונה $2e^x(1 - x) \\to 0$ (המעריכי מנצח את $1 - x$).',
            'המכנה $(e^x - x)^2 \\to \\infty$ (כי $-x \\to \\infty$).',
            'מציבים: $\\;\\lim\\limits_{x \\to -\\infty} f\'(x) = \\dfrac{0}{\\infty} = 0$.',
            'בשני הכיוונים הגבול הוא $0$.',
          ],
          final_answer: 'אסימפטוטה אופקית אחת: $\\;y = 0\\;$ (בשני הכיוונים).',
        },
      },
      {
        label: 'ד2',
        prompt: 'שרטטו סקיצה של גרף פונקציית הנגזרת $f\'(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 320 220',
            svg: `
              <line x1="10" y1="150" x2="280" y2="150" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="28" x2="100" y2="212" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="273" y="144" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">x</text>
              <text x="88" y="36" fill="#94a3b8" font-size="11" font-family="Heebo, sans-serif">y</text>
              <text x="232" y="144" fill="#60a5fa" font-size="10.5" font-family="Heebo, sans-serif">y = 0</text>
              <polyline points="10,147.6 40,140.2 70,106.7 85,68.3 100,40 115,81.3 130,150 145,177.7 151,179.6 160,178 175,171.4 190,165.1 220,157 250,153.2" fill="none" stroke="rgba(251,191,36,0.95)" stroke-width="2"/>
              <circle cx="100" cy="40" r="3.2" fill="#fbbf24"/>
              <text x="106" y="38" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">(0, 2)</text>
              <circle cx="130" cy="150" r="3" fill="#60a5fa"/>
              <text x="134" y="166" fill="#60a5fa" font-size="10" font-family="Heebo, sans-serif">(1, 0)</text>
            `,
            caption:
              'גרף הנגזרת $f\'(x)$: בנקודת הפיתול של $f$ ב-$x = 0$ יש לנגזרת מקסימום $(0,\\ 2)$. הנגזרת חיובית עבור $x < 1$, מתאפסת ב-$(1,\\ 0)$ (שם ל-$f$ מקסימום), ושלילית עבור $x > 1$ — שם היא יורדת למינימום (נקודת הפיתול השנייה של $f$) ואז עולה בחזרה אל האסימפטוטה $y = 0$.',
          },
        ],
        hints: [
          'נצלו את מה שכבר ידוע: $f\'(1) = 0$, האסימפטוטה $y = 0$, והסימן של $f\'$ (חיובי לפני $x=1$, שלילי אחריו).',
          'נקודת פיתול של $f$ ב-$x = 0$ פירושה שלנגזרת $f\'$ יש קיצון שם — חשבו את $f\'(0)$.',
        ],
        solution: {
          steps: [
            'נסתמך על $\\;f\'(x) = \\dfrac{2e^x(1 - x)}{(e^x - x)^2}$.',
            'אסימפטוטה אופקית: $\\;y = 0$ בשני הכיוונים (מסעיף ד(1)).',
            'אפס הנגזרת: $\\;f\'(1) = 0$ — שם ל-$f$ יש מקסימום, ולכן גרף $f\'$ חותך את ציר ה-$x$ בנקודה $(1,\\ 0)$.',
            'סימן הנגזרת: $\\;f\' > 0$ עבור $x < 1$ (הגרף מעל ציר ה-$x$) ו-$f\' < 0$ עבור $x > 1$ (מתחת לציר).',
            'נקודת הפיתול של $f$ ב-$x = 0$ פירושה שלנגזרת $f\'$ יש קיצון ב-$x = 0$.',
            'ערך הנגזרת שם: $\\;f\'(0) = \\dfrac{2e^0(1 - 0)}{(e^0 - 0)^2} = \\dfrac{2 \\cdot 1 \\cdot 1}{1} = 2$.',
            'לכן ל-$f\'$ יש נקודת מקסימום $(0,\\ 2)$.',
            'מימין ל-$x = 1$ הנגזרת שלילית, יורדת למינימום (נקודת הפיתול השנייה של $f$) ואז עולה בחזרה אל האסימפטוטה $y = 0$ מלמטה.',
          ],
          final_answer: 'ראו הסקיצה: מקסימום ב-$(0,\\ 2)$, חיתוך ציר $x$ ב-$(1,\\ 0)$, מינימום שלילי מימין ל-$x = 1$, ואסימפטוטה $y = 0$ בשני הקצוות.',
        },
      },
      {
        label: 'ה',
        prompt: [
          'לפניכם טענה:',
          '$$\\int_0^1 \\big(f(x) - 1.5\\big)\\,dx > \\dfrac{1}{e - 1}$$',
          'האם הטענה נכונה? נמקו את תשובתכם.',
        ].join('\n'),
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 280 240',
            svg: `
              <polygon points="60,190 210,190 210,62" fill="rgba(96,165,250,0.14)" stroke="rgba(96,165,250,0.55)" stroke-width="1.2"/>
              <line x1="45" y1="190" x2="240" y2="190" stroke="rgba(226,232,240,0.55)" stroke-width="1.2"/>
              <line x1="210" y1="190" x2="210" y2="55" stroke="rgba(148,163,184,0.5)" stroke-width="1" stroke-dasharray="4,3"/>
              <polyline points="60,190 97.5,136.8 135,94.2 172.5,69.3 210,62" fill="none" stroke="rgba(251,191,36,0.95)" stroke-width="2.2"/>
              <line x1="60" y1="190" x2="210" y2="62" stroke="rgba(96,165,250,0.8)" stroke-width="1.3" stroke-dasharray="5,3"/>
              <circle cx="60" cy="190" r="3" fill="#e2e8f0"/>
              <text x="40" y="206" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x = 0</text>
              <text x="198" y="206" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x = 1</text>
              <text x="170" y="220" fill="#60a5fa" font-size="10.5" font-family="Heebo, sans-serif">y = 1.5</text>
              <circle cx="210" cy="62" r="3.2" fill="#fbbf24"/>
              <text x="216" y="60" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">C</text>
              <text x="120" y="120" fill="#fbbf24" font-size="10" font-family="Heebo, sans-serif">f(x)</text>
            `,
            caption:
              'השטח $\\int_0^1 (f(x) - 1.5)\\,dx$ הוא השטח שבין הגרף לישר $y = 1.5$ בקטע $[0,1]$. המשולש (בכחול) נשען על המיתר המקווקו מ-$(0,0)$ אל $C$; מכיוון שגרף $f$ קעור כלפי מטה בקטע, הוא נמצא מעל המיתר — ולכן השטח גדול משטח המשולש $\\frac{1}{e-1}$.',
          },
        ],
        hints: [
          'סמנו $g(x) = f(x) - 1.5$ וחשבו את ערכיה בקצוות: $g(0)$ ו-$g(1)$.',
          'השוו את השטח לשטח של משולש ישר-זווית עם הקודקודים $(0,0)$, $(1,0)$ ו-$(1,\\ g(1))$.',
          'נצלו שבקטע $[0,1]$ הפונקציה קעורה כלפי מטה (בין שתי נקודות הפיתול), ולכן הגרף נמצא מעל המיתר שמחבר את קצותיה.',
        ],
        solution: {
          steps: [
            'נסמן $\\;g(x) = f(x) - 1.5$. האינטגרל הוא השטח שבין גרף $f$ לישר $y = 1.5$ בקטע $[0, 1]$.',
            'בקצה השמאלי: $\\;g(0) = f(0) - 1.5 = 1.5 - 1.5 = 0$.',
            'בקצה הימני נשתמש ב-$f(1) = \\dfrac{e + 1}{e - 1} + 0.5$, ולכן $\\;g(1) = \\dfrac{e + 1}{e - 1} + 0.5 - 1.5$.',
            'מפשטים: $\\;g(1) = \\dfrac{e + 1}{e - 1} - 1 = \\dfrac{(e + 1) - (e - 1)}{e - 1} = \\dfrac{2}{e - 1}$.',
            'בקטע $[0, 1]$ הפונקציה $f$ עולה (כי $x < 1$), לכן $g(x) \\ge 0$ — כל השטח מעל ציר ה-$x$.',
            'נשווה לשטח של משולש ישר-זווית עם הקודקודים $(0, 0)$, $(1, 0)$ ו-$\\left(1,\\ g(1)\\right)$.',
            'שטח המשולש: $\\;S_\\triangle = \\dfrac{1}{2} \\cdot 1 \\cdot g(1) = \\dfrac{1}{2} \\cdot \\dfrac{2}{e - 1} = \\dfrac{1}{e - 1}$.',
            'נקודת הפיתול של $f$ היא ב-$x = 0$, ובקטע $[0, 1]$ (בין שתי נקודות הפיתול) הגרף קעור כלפי מטה.',
            'פונקציה קעורה כלפי מטה נמצאת מעל המיתר המחבר את קצותיה — כלומר גרף $g$ מעל הקטע הישר מ-$(0, 0)$ אל $\\left(1,\\ g(1)\\right)$.',
            'לכן השטח שמתחת ל-$g$ גדול משטח המשולש: $\\;\\int_0^1 g(x)\\,dx > S_\\triangle = \\dfrac{1}{e - 1}$.',
            'מכאן שהטענה נכונה.',
          ],
          final_answer: 'הטענה נכונה. שטח המשולש שווה $\\dfrac{1}{e - 1}$, והגרף הקעור-כלפי-מטה נמצא מעליו, ולכן האינטגרל גדול ממנו.',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
