/**
 * שאלון 582 — קיץ תשפ"ג (2023), מועד ב'
 * =====================================
 *
 * המקור של השאלות: meyda.education.gov.il (משרד החינוך — נחלת הכלל).
 * הפתרונות נכתבו על-ידינו בסגנון האפליקציה; השיטה המתמטית עצמה כללית.
 *
 * תוכן השאלון:
 *   Q1 — גאומטריה אנליטית (מקום גאומטרי → אליפסה → מעגלים משיקים).
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2023Summer582MoedB: PastBagrutQuestion[] = [
  {
    id: 'b2023s582b-q1',
    year: 2023,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    totalPoints: 25,
    context: 'נתונות הנקודות $\\;A(0, 28)$ ו-$B(16, 0)$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצאו את משוואת המקום הגאומטרי שעליו נמצאות הנקודות $C$ המקיימות: $\\;AC^2 + BC^2 = 1320$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 230 220',
            svg: `
              <line x1="10" y1="175" x2="222" y2="175" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="90" y1="14" x2="90" y2="214" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="215" y="188" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="78" y="22" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <circle cx="122" cy="119" r="80" fill="rgba(244,114,182,0.07)" stroke="rgba(244,114,182,0.9)" stroke-width="1.7"/>
              <circle cx="122" cy="119" r="2.6" fill="rgba(244,114,182,0.95)"/>
              <circle cx="90" cy="63" r="3" fill="rgba(56,189,248,0.95)"/>
              <circle cx="154" cy="175" r="3" fill="rgba(56,189,248,0.95)"/>
              <text x="60" y="60" fill="#38bdf8" font-size="10" font-family="Heebo, sans-serif">A(0,28)</text>
              <text x="158" y="170" fill="#38bdf8" font-size="10" font-family="Heebo, sans-serif">B(16,0)</text>
              <text x="126" y="116" fill="#f472b6" font-size="9.5" font-family="Heebo, sans-serif">M(8,14)</text>
            `,
            caption: 'המקום הגאומטרי הוא מעגל: מרכז $(8,14)$, רדיוס $20$.',
          },
        ],
        hints: [
          'הצב $C(x,y)$ וכתוב את שני ריבועי המרחקים $AC^2$ ו-$BC^2$.',
          'אסוף איברים והשלם לריבוע כדי לקבל משוואת מעגל.',
        ],
        solution: {
          steps: [
            'נסמן $C(x,y)$. הנתון $AC^2 + BC^2 = 1320$:',
            '$(x-0)^2 + (y-28)^2 + (x-16)^2 + (y-0)^2 = 1320$',
            '$x^2 + y^2 - 56y + 784 + x^2 - 32x + 256 + y^2 = 1320$',
            '$2x^2 - 32x + 2y^2 - 56y = 280$',
            '$x^2 - 16x + y^2 - 28y = 140$',
            'נשלים לריבוע: $\\;(x-8)^2 + (y-14)^2 = 140 + 64 + 196 = 400$',
          ],
          final_answer: 'מעגל: $\\;(x-8)^2 + (y-14)^2 = 400$ (מרכז $(8,14)$, רדיוס $20$)',
        },
      },
      {
        label: 'ב1',
        prompt: [
          'את המקום הגאומטרי מזיזים $8$ יחידות שמאלה ו-$14$ יחידות למטה. המקום החדש חותך את ציר ה-$y$ בנקודות $E$ ו-$G$ ($E$ מעל $G$).',
          'הנקודות $F_1$ ו-$F_2$ הן מוקדי אליפסה קנונית העוברת דרך $E$ ו-$G$. נתון: המרחק בין הישרים $EF_1$ ו-$GF_2$ הוא $24$.',
          '',
          'מצאו את שיעורי הנקודה $F_1$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'ההזזה מעבירה את המרכז $(8,14)$ לראשית, אז המעגל החדש הוא $x^2+y^2=400$. מצא את $E,G$ על ציר $y$.',
          'הישרים $EF_1$ ו-$GF_2$ מקבילים והמרחק ביניהם $24$, אז המרחק מהראשית לכל ישר הוא $12$.',
          'דרך אחת: משולשים דומים. דרך שנייה: נוסחת מרחק בין שני ישרים מקבילים.',
        ],
        solution: {
          steps: [
            'הזזה $8$ שמאלה ו-$14$ למטה: המרכז $(8,14) \\to (0,0)$, אז המעגל החדש $x^2 + y^2 = 400$',
            'חיתוך עם ציר $y$ ($x=0$): $\\;y^2 = 400 \\Rightarrow E(0,20)$ ו-$G(0,-20)$',
            'מוקדי האליפסה $F_1(c,0)$, $F_2(-c,0)$; הישרים $EF_1 \\parallel GF_2$, והמרחק ביניהם $24$ — לכן $12$ מהראשית לכל ישר',
            'דרך 1 — משולשים דומים: במשולש $EOF_1$ הגובה לראשית $ON=12$, $\\;EO=20$, $\\;OF_1=c$, $\\;EF_1=\\sqrt{400+c^2}$',
            '$\\triangle EOF_1 \\sim \\triangle ONF_1$: $\\;\\dfrac{EO}{ON} = \\dfrac{EF_1}{OF_1} \\Rightarrow \\dfrac{20}{12} = \\dfrac{\\sqrt{400+c^2}}{c}$',
            '$5c = 3\\sqrt{400+c^2} \\Rightarrow 25c^2 = 9(400+c^2) \\Rightarrow 16c^2 = 3600 \\Rightarrow c = 15$',
            'דרך 2 — מרחק בין ישרים מקבילים: $\\ell_{EF_1}:\\;\\frac{20}{c}x + y - 20 = 0$, $\\;\\ell_{GF_2}:\\;\\frac{20}{c}x + y + 20 = 0$',
            '$24 = \\dfrac{|20-(-20)|}{\\sqrt{(20/c)^2 + 1}} \\Rightarrow 3\\sqrt{\\tfrac{400}{c^2}+1} = 5 \\Rightarrow \\tfrac{400}{c^2} = \\tfrac{16}{9} \\Rightarrow c^2 = 225 \\Rightarrow c = 15$',
          ],
          final_answer: '$F_1(15,\\, 0)$ (שתי הדרכים נותנות אותה תוצאה)',
        },
      },
      {
        label: 'ב2',
        prompt: 'מצאו את משוואת האליפסה.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 235 225',
            svg: `
              <line x1="10" y1="112" x2="226" y2="112" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="117" y1="14" x2="117" y2="212" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="219" y="125" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="105" y="22" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <ellipse cx="117" cy="112" rx="100" ry="80" fill="rgba(96,165,250,0.06)" stroke="rgba(96,165,250,0.9)" stroke-width="1.7"/>
              <line x1="117" y1="32" x2="201" y2="112" stroke="rgba(52,211,153,0.85)" stroke-width="1.4"/>
              <line x1="117" y1="192" x2="33" y2="112" stroke="rgba(52,211,153,0.85)" stroke-width="1.4"/>
              <circle cx="177" cy="112" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="57" cy="112" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="117" cy="32" r="3" fill="rgba(251,191,36,0.95)"/>
              <circle cx="117" cy="192" r="3" fill="rgba(251,191,36,0.95)"/>
              <text x="170" y="126" fill="#f472b6" font-size="9.5" font-family="Heebo, sans-serif">F₁(15,0)</text>
              <text x="34" y="126" fill="#f472b6" font-size="9.5" font-family="Heebo, sans-serif">F₂</text>
              <text x="121" y="32" fill="#fbbf24" font-size="9.5" font-family="Heebo, sans-serif">E(0,20)</text>
              <text x="121" y="196" fill="#fbbf24" font-size="9.5" font-family="Heebo, sans-serif">G(0,-20)</text>
            `,
            caption: 'האליפסה הקנונית: חצי-ציר $b=20$ (דרך $E,G$), מוקדים $F_1(15,0),F_2(-15,0)$, וחצי-ציר $a=25$.',
          },
        ],
        hints: [
          'באליפסה קנונית $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$ עם מוקדים על ציר $x$: $\\;c^2 = a^2 - b^2$.',
          'מ-$E,G$ נובע $b=20$; מסעיף ב1 $c=15$. חשב את $a^2$.',
        ],
        solution: {
          steps: [
            'אליפסה קנונית $\\dfrac{x^2}{a^2} + \\dfrac{y^2}{b^2} = 1$ עם $b = 20$ (דרך $E,G$) ו-$c = 15$',
            '$c^2 = a^2 - b^2$',
            '$15^2 = a^2 - 20^2 \\Rightarrow a^2 = 225 + 400 = 625$',
            '$\\dfrac{x^2}{625} + \\dfrac{y^2}{400} = 1$',
          ],
          final_answer: 'משוואת האליפסה: $\\;\\dfrac{x^2}{625} + \\dfrac{y^2}{400} = 1$',
        },
      },
      {
        label: 'ג',
        prompt: [
          'מעבירים מעגלים המשיקים לישר $EF_1$, לציר ה-$x$ ולציר ה-$y$.',
          '',
          'מצאו משוואות של שני מעגלים כאלה הנמצאים ברביעים שונים.',
        ].join('\n'),
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 220 205',
            svg: `
              <line x1="10" y1="140" x2="212" y2="140" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="110" y1="14" x2="110" y2="196" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="205" y="153" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">x</text>
              <text x="98" y="22" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">y</text>
              <line x1="80" y1="40" x2="170" y2="160" stroke="rgba(251,191,36,0.85)" stroke-width="1.5"/>
              <text x="148" y="44" fill="#fbbf24" font-size="9" font-family="Heebo, sans-serif">4x+3y=60</text>
              <circle cx="125" cy="125" r="15" fill="rgba(52,211,153,0.10)" stroke="rgba(52,211,153,0.95)" stroke-width="1.5"/>
              <circle cx="65" cy="95" r="45" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.9)" stroke-width="1.5"/>
              <text x="116" y="128" fill="#34d399" font-size="8.5" font-family="Heebo, sans-serif">R=5</text>
              <text x="50" y="98" fill="#c4b5fd" font-size="8.5" font-family="Heebo, sans-serif">R=15</text>
            `,
            caption: 'שני מעגלים המשיקים לשני הצירים ולישר $4x+3y-60=0$: ברביע ראשון $R=5$ (ירוק), וברביע שני $R=15$ (סגול).',
          },
        ],
        hints: [
          'מעגל המשיק לשני הצירים מרכזו $(\\pm R, \\pm R)$ ורדיוסו $R$. נדרוש גם משיקות לישר $4x+3y-60=0$.',
          'רביע ראשון: מרכז $(R,R)$. רביע שני: מרכז $(-R,R)$. פתור $R$ מתנאי המרחק לישר.',
        ],
        solution: {
          steps: [
            'הישר $EF_1$ (עם $c=15$): $\\;y = -\\frac43 x + 20 \\Rightarrow 4x + 3y - 60 = 0$',
            'מעגל המשיק לשני הצירים: מרכז $(\\pm R, \\pm R)$, רדיוס $R$; נוסיף משיקות לישר',
            'רביע ראשון, מרכז $(R,R)$: $\\;R = \\dfrac{|4R + 3R - 60|}{\\sqrt{16+9}} = \\dfrac{60 - 7R}{5}$',
            '$5R = 60 - 7R \\Rightarrow 12R = 60 \\Rightarrow R = 5$, ולכן $(x-5)^2 + (y-5)^2 = 25$',
            'רביע שני, מרכז $(-R,R)$: $\\;R = \\dfrac{|{-4R} + 3R - 60|}{5} = \\dfrac{R + 60}{5}$',
            '$5R = R + 60 \\Rightarrow 4R = 60 \\Rightarrow R = 15$, ולכן $(x+15)^2 + (y-15)^2 = 225$',
          ],
          final_answer: 'רביע ראשון: $(x-5)^2 + (y-5)^2 = 25$. $\\;$ רביע שני: $(x+15)^2 + (y-15)^2 = 225$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
