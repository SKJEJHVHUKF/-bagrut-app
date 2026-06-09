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

  // ===========================================================================
  // Q2 — וקטורים במרחב: פירמידה ABCD, DC⊥ABC, ביטוי EF, נפח, מצב הדדי EF/AB
  // ===========================================================================
  {
    id: 'b2023s582b-q2',
    year: 2023,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 25,
    context: [
      'בפירמידה $ABCD$, המקצוע $DC$ מאונך למישור $ABC$. הנקודה $E$ היא אמצע המקצוע $AD$.',
      'הנקודה $F$ מקיימת: $\\;\\vec{DF} = \\dfrac{k}{2}\\,\\vec{DB} + k\\,\\vec{DC}$ ($k$ פרמטר).',
      'נסמן: $\\;\\vec{AB} = \\vec u$, $\\;\\vec{AC} = \\vec v$, $\\;\\vec{CD} = \\vec w$.',
    ].join('\n'),
    diagrams: [
      {
        type: 'custom',
        viewBox: '0 0 210 185',
        svg: `
          <line x1="75" y1="120" x2="180" y2="120" stroke="rgba(148,163,184,0.4)" stroke-width="1" stroke-dasharray="3 3"/>
          <line x1="75" y1="120" x2="75" y2="32" stroke="rgba(148,163,184,0.4)" stroke-width="1" stroke-dasharray="3 3"/>
          <line x1="75" y1="120" x2="42" y2="150" stroke="rgba(148,163,184,0.4)" stroke-width="1" stroke-dasharray="3 3"/>
          <text x="182" y="123" fill="#64748b" font-size="9" font-family="Heebo, sans-serif">y</text>
          <text x="70" y="30" fill="#64748b" font-size="9" font-family="Heebo, sans-serif">z</text>
          <text x="34" y="158" fill="#64748b" font-size="9" font-family="Heebo, sans-serif">x</text>
          <polygon points="75,120 119,152 131,120" fill="rgba(56,189,248,0.07)" stroke="none"/>
          <line x1="75" y1="120" x2="131" y2="120" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="75" y1="120" x2="119" y2="152" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="119" y1="152" x2="131" y2="120" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="75" y1="120" x2="131" y2="44" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="119" y1="152" x2="131" y2="44" stroke="rgba(226,232,240,0.85)" stroke-width="1.5"/>
          <line x1="131" y1="120" x2="131" y2="44" stroke="rgba(244,114,182,0.95)" stroke-width="2"/>
          <path d="M 122 120 L 122 111 L 131 111" fill="none" stroke="rgba(244,114,182,0.8)" stroke-width="1"/>
          <circle cx="75" cy="120" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <circle cx="119" cy="152" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <circle cx="131" cy="120" r="2.6" fill="rgba(226,232,240,0.95)"/>
          <circle cx="131" cy="44" r="2.6" fill="rgba(244,114,182,0.95)"/>
          <text x="60" y="124" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">A</text>
          <text x="118" y="166" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">B</text>
          <text x="135" y="126" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">C</text>
          <text x="135" y="44" fill="#f1f5f9" font-size="11" font-weight="bold" font-family="Heebo, sans-serif">D</text>
        `,
        caption: 'הפירמידה $ABCD$ מעל בסיס $ABC$: המקצוע $\\vec{CD}=\\vec w$ ניצב לבסיס. $\\vec u=\\vec{AB}$, $\\vec v=\\vec{AC}$.',
      },
    ],
    parts: [
      {
        label: 'א',
        prompt: 'הביעו באמצעות $\\vec u,\\,\\vec v,\\,\\vec w$ ו-$k$ את $\\vec{EF}$.',
        answer_type: 'expression',
        hints: [
          'לך במסלול $\\vec{EF} = \\vec{ED} + \\vec{DF}$, ו-$E$ אמצע $AD$ נותן $\\vec{ED} = \\frac12\\vec{AD}$.',
          'בטא כל אלכסון במונחי $\\vec u,\\vec v,\\vec w$: $\\vec{AD}=\\vec v+\\vec w$, $\\vec{DB}=\\vec u-\\vec v-\\vec w$, $\\vec{DC}=-\\vec w$.',
        ],
        solution: {
          steps: [
            '$\\vec{EF} = \\vec{ED} + \\vec{DF}$, ו-$E$ אמצע $AD$, אז $\\vec{ED} = \\frac12\\vec{AD}$',
            '$\\vec{EF} = \\frac12\\vec{AD} + \\frac{k}{2}\\vec{DB} + k\\vec{DC}$',
            'נבטא: $\\;\\vec{AD} = \\vec{AC}+\\vec{CD} = \\vec v + \\vec w$; $\\;\\vec{DB} = \\vec{DC}+\\vec{CB} = -\\vec w + (\\vec u - \\vec v)$; $\\;\\vec{DC} = -\\vec w$',
            '$\\vec{EF} = \\frac12(\\vec v+\\vec w) + \\frac{k}{2}(\\vec u-\\vec v-\\vec w) + k(-\\vec w)$',
            'נאסוף לפי $\\vec u,\\vec v,\\vec w$:',
            '$\\vec{EF} = \\frac{k}{2}\\vec u + \\left(\\frac12 - \\frac{k}{2}\\right)\\vec v + \\left(\\frac12 - \\frac{3k}{2}\\right)\\vec w$',
          ],
          final_answer: '$\\vec{EF} = \\frac{k}{2}\\vec u + \\left(\\frac12 - \\frac{k}{2}\\right)\\vec v + \\left(\\frac12 - \\frac{3k}{2}\\right)\\vec w$',
        },
      },
      {
        label: 'ב',
        prompt: 'נתון: $\\vec{EF}$ מקביל למישור $ABC$. מצאו את הערך של $k$.',
        answer_type: 'number',
        hints: [
          '$\\vec w = \\vec{CD}$ ניצב למישור $ABC$, בעוד $\\vec u,\\vec v$ מוכלים בו.',
          'אם $\\vec{EF}\\parallel ABC$, אסור שיהיה לו רכיב בכיוון $\\vec w$ — השווה את מקדם $\\vec w$ לאפס.',
        ],
        solution: {
          steps: [
            '$\\vec w = \\vec{CD}$ ניצב למישור $ABC$ (כי $DC\\perp ABC$), ו-$\\vec u,\\vec v$ מוכלים במישור',
            '$\\vec{EF}\\parallel ABC$ פירושו שאין ל-$\\vec{EF}$ רכיב בכיוון $\\vec w$, כלומר מקדם $\\vec w$ מתאפס:',
            '$\\frac12 - \\frac{3k}{2} = 0$',
            '$3k = 1 \\Rightarrow k = \\frac13$',
          ],
          final_answer: '$k = \\dfrac13$',
        },
      },
      {
        label: 'ג',
        prompt: [
          'נתון: $A(0,0,0)$, $B(p,6,0)$, $C(0,n,0)$ ($p,n$ פרמטרים חיוביים), $\\vec{BD} = (-8,-2,9)$, $\\vec u\\cdot\\vec v = 24$.',
          '',
          'מצאו את שיעורי הנקודות $B$, $C$ ו-$D$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          '$\\vec u\\cdot\\vec v = \\vec{AB}\\cdot\\vec{AC}$ נותן משוואה ב-$n$ → מצא את $C$.',
          'מ-$\\vec{BD}$ מצא את $D$ באמצעות $p$, ואז השתמש ב-$DC\\perp ABC$ (כלומר $\\vec{CD}\\cdot\\vec u=0$) למציאת $p$.',
        ],
        solution: {
          steps: [
            '$\\vec v = \\vec{AC} = (0,n,0)$, $\\;\\vec u = \\vec{AB} = (p,6,0)$',
            '$\\vec u\\cdot\\vec v = 6n = 24 \\Rightarrow n = 4$, אז $C(0,4,0)$',
            '$\\vec{BD} = D - B = (x-p,\\; y-6,\\; z) = (-8,-2,9)$',
            '$x = p-8,\\;\\; y = 4,\\;\\; z = 9$, אז $D(p-8,\\, 4,\\, 9)$',
            '$\\vec{CD} = D - C = (p-8,\\, 0,\\, 9)$; כי $DC\\perp ABC$ מתקיים $\\vec{CD}\\cdot\\vec u = 0$:',
            '$(p-8,0,9)\\cdot(p,6,0) = p^2 - 8p = 0 \\Rightarrow p = 8$ (כי $p>0$)',
          ],
          final_answer: '$B(8,6,0)$, $\\;C(0,4,0)$, $\\;D(0,4,9)$',
        },
      },
      {
        label: 'ד',
        prompt: 'מצאו את נפח הפירמידה $ABCD$.',
        answer_type: 'number',
        hints: [
          'בסיס $ABC$ במישור $z=0$: $AC$ על ציר $y$, והגובה אליו מ-$B$ הוא שיעור ה-$x$ של $B$.',
          'גובה הפירמידה הוא $DC=9$ (ניצב לבסיס). $V=\\frac13\\,S_{ABC}\\cdot H$.',
        ],
        solution: {
          steps: [
            'בסיס $ABC$ במישור $z=0$: $\\;AC = 4$ (על ציר $y$), הגובה אליו מ-$B$ הוא $x_B = 8$',
            '$S_{ABC} = \\dfrac{AC\\cdot h}{2} = \\dfrac{4\\cdot 8}{2} = 16$',
            'גובה הפירמידה: $\\;H = DC = 9$ (ניצב לבסיס)',
            '$V = \\dfrac13\\,S_{ABC}\\cdot H = \\dfrac{16\\cdot 9}{3} = 48$',
          ],
          final_answer: '$V_{ABCD} = 48$',
        },
      },
      {
        label: 'ה',
        prompt: 'מהו המצב ההדדי בין הישר $EF$ לבין הישר $AB$? נמקו את קביעתכם.',
        answer_type: 'text',
        hints: [
          'הצב $k=\\frac13$ ב-$\\vec{EF}$ — מקדם $\\vec w$ מתאפס.',
          'בדוק אם $\\vec{EF}$ כפולה של $\\vec{AB}=\\vec u$ (מקבילות), ואם הישרים באותו גובה $z$ (חיתוך).',
        ],
        solution: {
          steps: [
            'נציב $k=\\frac13$: $\\;\\vec{EF} = \\frac16\\vec u + \\frac13\\vec v$ (מקדם $\\vec w$ מתאפס)',
            '$\\vec{AB} = \\vec u$; ל-$\\vec{EF}$ יש רכיב $\\vec v$, אז הוא אינו כפולה של $\\vec u$ — הישרים אינם מקבילים',
            '$\\vec{EF}$ מקביל לבסיס (מסעיף ב), ו-$E$ אמצע $AD$ נמצא בגובה $z=4.5$; הישר $AB$ נמצא בגובה $z=0$',
            'הישרים בגבהים שונים ($z=4.5$ מול $z=0$) ואינם מקבילים — לכן אינם נחתכים',
          ],
          final_answer: 'הישרים $EF$ ו-$AB$ מצטלבים (skew) — אינם מקבילים וגם אינם נחתכים',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q3 — מספרים מרוכבים: סדרה הנדסית מרוכבת, z1=√2cis45°, ממשי/מדומה, סכום=0
  // ===========================================================================
  {
    id: 'b2023s582b-q3',
    year: 2023,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 25,
    context: [
      'נתונה סדרה הנדסית $z_1, z_2, z_3, \\ldots$ שאיבריה מספרים מרוכבים ומנתה $q$. הנקודה $z_1$ ברביע הראשון.',
      'נתון: $\\;(z_1)^3 = z_3$ ו-$\\;-2z_1 = \\overline{z_3}$.',
    ].join('\n'),
    parts: [
      {
        label: 'א',
        prompt: 'הוכיחו כי $q = -z_1$ או $q = z_1$.',
        answer_type: 'proof',
        hints: [
          'בסדרה הנדסית $z_3 = z_1 q^2$. הצב בנתון $(z_1)^3 = z_3$.',
          'חלק ב-$z_1$ (אינו אפס, ברביע ראשון) וקבל $z_1^2 = q^2$.',
        ],
        solution: {
          steps: [
            'בסדרה הנדסית: $z_3 = z_1 q^2$',
            '$(z_1)^3 = z_3 = z_1 q^2$',
            'נחלק ב-$z_1$ (ברביע ראשון, $\\ne 0$): $\\;z_1^2 = q^2$',
            '$z_1 = q$ או $z_1 = -q$, כלומר $q = z_1$ או $q = -z_1$',
          ],
          final_answer: 'הוכח: $q = z_1$ או $q = -z_1$',
        },
      },
      {
        label: 'ב',
        prompt: 'מצאו את $z_1$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="14" y1="100" x2="186" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="14" x2="100" y2="186" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="178" y="113" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#94a3b8" font-size="10" font-family="Heebo, sans-serif">Im</text>
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(148,163,184,0.35)" stroke-width="1.1" stroke-dasharray="3 3"/>
              <circle cx="142" cy="58" r="3.4" fill="rgba(244,114,182,0.95)"/>
              <line x1="100" y1="100" x2="142" y2="58" stroke="rgba(244,114,182,0.85)" stroke-width="1.4"/>
              <circle cx="58" cy="58" r="2.6" fill="rgba(148,163,184,0.7)"/>
              <circle cx="58" cy="142" r="2.6" fill="rgba(148,163,184,0.7)"/>
              <circle cx="142" cy="142" r="2.6" fill="rgba(148,163,184,0.7)"/>
              <text x="146" y="54" fill="#f472b6" font-size="10" font-family="Heebo, sans-serif">z₁ (45°)</text>
              <text x="20" y="54" fill="#64748b" font-size="9" font-family="Heebo, sans-serif">135°</text>
              <text x="20" y="156" fill="#64748b" font-size="9" font-family="Heebo, sans-serif">225°</text>
              <text x="146" y="156" fill="#64748b" font-size="9" font-family="Heebo, sans-serif">-45°</text>
            `,
            caption: 'ארבעת הפתרונות לזווית ($-45°,45°,135°,225°$) על מעגל $|z|=\\sqrt2$; הדרישה "רביע ראשון" בוחרת את $z_1=\\sqrt2\\,\\text{cis}45°$.',
          },
        ],
        hints: [
          'הצב $z_3 = (z_1)^3$ בנתון $-2z_1 = \\overline{z_3}$, וכתוב $z_1 = R\\,\\text{cis}\\,\\alpha$.',
          'השווה מודולים (מוצא $R$) והשווה זוויות (מוצא $\\alpha$); בחר את $\\alpha$ שברביע הראשון.',
        ],
        solution: {
          steps: [
            '$-2z_1 = \\overline{z_3} = \\overline{(z_1)^3}$',
            'נסמן $z_1 = R\\,\\text{cis}\\,\\alpha$',
            '$2R\\,\\text{cis}(\\alpha+180°) = \\overline{R^3\\,\\text{cis}(3\\alpha)} = R^3\\,\\text{cis}(-3\\alpha)$',
            'מודולים: $\\;2R = R^3 \\Rightarrow R^2 = 2 \\Rightarrow R = \\sqrt2$',
            'זוויות: $\\;\\alpha + 180° = -3\\alpha + 360°k$',
            '$4\\alpha = -180° + 360°k \\Rightarrow \\alpha = -45° + 90°k$',
            '$\\alpha = -45°,\\, 45°,\\, 135°,\\, 225°$; ברביע ראשון $\\alpha = 45°$',
            '$z_1 = \\sqrt2\\,\\text{cis}(45°)$',
          ],
          final_answer: '$z_1 = \\sqrt2\\,\\text{cis}(45°)$',
        },
      },
      {
        label: 'ג',
        prompt: [
          'ענו עבור $q = z_1$. $\\;z_{4n}$ ו-$z_{4n-2}$ הם איברים בסדרה ($n$ מספר טבעי).',
          '',
          'קבעו עבור כל אחד מן האיברים אם הוא מדומה או ממשי. נמקו.',
        ].join('\n'),
        answer_type: 'text',
        hints: [
          'כי $q = z_1$: $\\;z_m = q^m$, ו-$q = \\sqrt2\\,\\text{cis}45°$. חשב $q^4 = 4\\,\\text{cis}180° = -4$.',
          '$z_{4n} = q^{4n} = (q^4)^n$. עבור $z_{4n-2}$ חלק ב-$q^2 = 2\\,\\text{cis}90° = 2i$.',
        ],
        solution: {
          steps: [
            'כי $q = z_1$: $\\;z_m = z_1 q^{m-1} = q^m$, עם $q = \\sqrt2\\,\\text{cis}45°$',
            '$z_{4n} = q^{4n} = \\left((\\sqrt2\\,\\text{cis}45°)^4\\right)^n = (4\\,\\text{cis}180°)^n = (-4)^n$ — ממשי',
            '$z_{4n-2} = \\dfrac{q^{4n}}{q^2} = \\dfrac{(-4)^n}{(\\sqrt2\\,\\text{cis}45°)^2} = \\dfrac{(-4)^n}{2\\,\\text{cis}90°} = \\dfrac{(-4)^n}{2i}$',
            '$= \\dfrac{(-4)^n}{2i}\\cdot\\dfrac{-i}{-i} = \\dfrac{-(-4)^n\\,i}{2}$ — מדומה טהור',
          ],
          final_answer: '$z_{4n} = (-4)^n$ — ממשי; $\\;z_{4n-2} = \\dfrac{-(-4)^n\\,i}{2}$ — מדומה טהור',
        },
      },
      {
        label: 'ד',
        prompt: 'מצאו את ערך הסכום: $\\;\\dfrac{z_1}{\\sqrt2} + \\dfrac{z_2}{(\\sqrt2)^2} + \\dfrac{z_3}{(\\sqrt2)^3} + \\ldots + \\dfrac{z_{64}}{(\\sqrt2)^{64}}$.',
        answer_type: 'number',
        hints: [
          '$z_k = q^k = (\\sqrt2)^k\\,\\text{cis}(45k°)$, אז כל איבר בסכום הוא $\\frac{z_k}{(\\sqrt2)^k} = \\text{cis}(45k°)$.',
          'זו סדרה הנדסית (איבר ראשון ומנה $\\text{cis}45°$). חשב $(\\text{cis}45°)^{64}$.',
        ],
        solution: {
          steps: [
            '$z_k = q^k = (\\sqrt2)^k\\,\\text{cis}(45k°)$, אז $\\;\\dfrac{z_k}{(\\sqrt2)^k} = \\text{cis}(45k°)$',
            'הסכום הוא סדרה הנדסית: איבר ראשון $\\text{cis}45°$, מנה $\\text{cis}45°$, $\\;64$ איברים',
            '$S = \\dfrac{\\text{cis}45°\\left((\\text{cis}45°)^{64} - 1\\right)}{\\text{cis}45° - 1}$',
            '$(\\text{cis}45°)^{64} = \\text{cis}(2880°) = \\text{cis}(0°) = 1$',
            '$S = \\dfrac{\\text{cis}45°\\,(1 - 1)}{\\text{cis}45° - 1} = 0$',
          ],
          final_answer: '$S = 0$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q4 — חקירת פונקציות: f(x)=(ln x+ln a)/(ln x-ln a), טענה f=f', g=ln(f), שטח
  // (סעיפים א–ד מלאים)
  // ===========================================================================
  {
    id: 'b2023s582b-q4',
    year: 2023,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 4,
    topic: 'פונקציית ln',
    totalPoints: 25,
    context: 'נתונה הפונקציה $\\;f(x) = \\dfrac{\\ln x + \\ln a}{\\ln x - \\ln a}$, כאשר $a$ פרמטר גדול מ-$1$. (בסעיפים א–ג הביעו את התשובות באמצעות $a$ אם יש צורך.)',
    parts: [
      {
        label: 'א1',
        prompt: 'מצאו את תחום ההגדרה של הפונקציה $f(x)$.',
        answer_type: 'expression',
        hints: [
          '$\\ln x$ מחייב $x>0$.',
          'המכנה $\\ln x - \\ln a$ חייב להיות שונה מאפס.',
        ],
        solution: {
          steps: [
            '$\\ln x$ מוגדר עבור $x > 0$',
            'המכנה $\\ne 0$: $\\;\\ln x - \\ln a \\ne 0 \\Rightarrow \\ln x \\ne \\ln a \\Rightarrow x \\ne a$',
          ],
          final_answer: 'תחום ההגדרה: $\\;0 < x < a$ או $x > a$',
        },
      },
      {
        label: 'א2',
        prompt: 'מצאו את משוואות האסימפטוטות המאונכות לצירים של $f(x)$.',
        answer_type: 'expression',
        hints: [
          'אסימפטוטה אנכית: היכן המכנה מתאפס (והמונה אינו).',
          'אסימפטוטה אופקית: חשב $\\lim_{x\\to\\infty} f(x)$ (חלק מונה ומכנה ב-$\\ln x$).',
        ],
        solution: {
          steps: [
            'אסימפטוטה אנכית: המכנה מתאפס ב-$x=a$ (והמונה שם $2\\ln a \\ne 0$), אז $\\;x = a$',
            '$\\lim_{x\\to\\infty} f(x) = \\lim_{x\\to\\infty} \\dfrac{\\ln x\\left(1 + \\frac{\\ln a}{\\ln x}\\right)}{\\ln x\\left(1 - \\frac{\\ln a}{\\ln x}\\right)} = \\dfrac{1+0}{1-0} = 1$',
            'אסימפטוטה אופקית: $\\;y = 1$ (וגם כש-$x\\to0^+$ מתקיים $f\\to1$)',
          ],
          final_answer: 'אסימפטוטה אנכית $x=a$, אסימפטוטה אופקית $y=1$',
        },
      },
      {
        label: 'א3',
        prompt: 'מצאו את שיעורי נקודת החיתוך של גרף $f(x)$ עם הצירים (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          'חיתוך עם ציר $x$: פתור $f(x)=0$ (המונה מתאפס).',
          'חיתוך עם ציר $y$: בדוק אם $x=0$ שייך לתחום.',
        ],
        solution: {
          steps: [
            'חיתוך עם ציר $x$: $\\;f(x)=0 \\Rightarrow \\ln x + \\ln a = 0 \\Rightarrow \\ln x = -\\ln a = \\ln(a^{-1})$',
            '$x = \\dfrac1a$, כלומר הנקודה $\\left(\\dfrac1a,\\, 0\\right)$',
            'חיתוך עם ציר $y$: $x=0$ אינו בתחום, אז אין חיתוך עם ציר $y$',
          ],
          final_answer: 'חיתוך עם ציר $x$ ב-$\\left(\\frac1a,\\, 0\\right)$; אין חיתוך עם ציר $y$',
        },
      },
      {
        label: 'א4',
        prompt: 'מצאו את תחומי הירידה של הפונקציה $f(x)$.',
        answer_type: 'expression',
        hints: [
          'גזור עם כלל המנה, וזכור $(\\ln x)\' = \\frac1x$.',
          'בדוק את הסימן של $f\'$: השתמש ב-$a>1 \\Rightarrow \\ln a>0$.',
        ],
        solution: {
          steps: [
            '$f\'(x) = \\dfrac{\\frac1x(\\ln x - \\ln a) - (\\ln x + \\ln a)\\frac1x}{(\\ln x - \\ln a)^2}$',
            '$= \\dfrac{\\frac1x\\left[(\\ln x - \\ln a) - (\\ln x + \\ln a)\\right]}{(\\ln x - \\ln a)^2} = \\dfrac{-2\\ln a}{x(\\ln x - \\ln a)^2}$',
            '$a>1 \\Rightarrow \\ln a > 0$; וגם $x>0$ ו-$(\\ln x - \\ln a)^2 > 0$, לכן $f\'(x) < 0$ בכל התחום',
          ],
          final_answer: 'הפונקציה יורדת בכל תחום הגדרתה: $\\;0<x<a$ וגם $x>a$',
        },
      },
      {
        label: 'א5',
        prompt: 'סרטטו סקיצה של גרף הפונקציה $f(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [0, 6],
            yRange: [-6, 6.5],
            curves: [
              { fn: (x) => (Math.log(x) + Math.log(2)) / (Math.log(x) - Math.log(2)), domain: [0.05, 1.9], color: '#f472b6' },
              { fn: (x) => (Math.log(x) + Math.log(2)) / (Math.log(x) - Math.log(2)), domain: [2.1, 6], color: '#f472b6' },
            ],
            vAsymptotes: [{ x: 2, label: 'x=a' }],
            hAsymptotes: [{ y: 1, label: 'y=1' }],
            markedPoints: [{ x: 0.5, y: 0, label: '(1/a,0)' }],
            caption: 'סקיצה (דוגמה $a=2$): אסימפטוטה אנכית $x=a$, אופקית $y=1$, חיתוך $\\left(\\frac1a,0\\right)$, יורדת בשני הענפים.',
          },
        ],
        hints: ['שלב: אסימפטוטות $x=a$ ו-$y=1$, חיתוך $\\left(\\frac1a,0\\right)$, וירידה בכל התחום.'],
        solution: {
          steps: [
            'בתחום $0<x<a$: מתקרב ל-$1$ כש-$x\\to0^+$, יורד דרך $\\left(\\frac1a,0\\right)$ אל $-\\infty$ כש-$x\\to a^-$',
            'בתחום $x>a$: יורד מ-$+\\infty$ (כש-$x\\to a^+$) אל האסימפטוטה $y=1$',
          ],
          final_answer: 'גרף בעל שני ענפים, אסימפטוטות $x=a$ ו-$y=1$, חיתוך $\\left(\\frac1a,0\\right)$ (ראה תרשים)',
        },
      },
      {
        label: 'ב',
        prompt: 'לפניכם טענה: למשוואה $f(x) = f\'(x)$ קיים בדיוק פתרון אחד בתחום $x>a$. קבעו אם הטענה נכונה או לא נכונה, ונמקו.',
        answer_type: 'text',
        hints: [
          'בתחום $x>a$ בדוק את הסימן של $f(x)$ (יחסית לאסימפטוטה $y=1$) ואת הסימן של $f\'(x)$.',
          'אם $f(x)$ ו-$f\'(x)$ בסימנים מנוגדים בכל התחום, כמה פתרונות יש?',
        ],
        solution: {
          steps: [
            'בתחום $x>a$: הפונקציה יורדת מ-$+\\infty$ אל האסימפטוטה $y=1$, לכן $\\;f(x) > 1$',
            'כי $f$ יורדת בתחום, $\\;f\'(x) < 0$',
            'לכל $x>a$ מתקיים $\\;f(x) > 1 > 0 > f\'(x)$, ולכן $f(x) \\ne f\'(x)$',
            'אין אף פתרון למשוואה $f(x)=f\'(x)$ בתחום $x>a$',
          ],
          final_answer: 'הטענה אינה נכונה — אין כלל פתרון בתחום $x>a$ (כי $f(x)>1>0>f\'(x)$)',
        },
      },
      {
        label: 'ג1',
        prompt: 'נתונה הפונקציה $g(x) = \\ln(f(x))$. מצאו את תחום ההגדרה של $g(x)$.',
        answer_type: 'expression',
        hints: [
          '$\\ln(f(x))$ מוגדר רק כאשר $f(x) > 0$.',
          'מהחקירה של $f$: היכן $f(x)>0$? (זכור $f=0$ ב-$\\frac1a$, אסימפטוטה ב-$a$).',
        ],
        solution: {
          steps: [
            '$g(x) = \\ln(f(x))$ מוגדרת רק כאשר $f(x) > 0$',
            'מהחקירה: $\\;0 < x < \\frac1a \\Rightarrow 0 < f < 1$; $\\;\\frac1a < x < a \\Rightarrow f < 0$; $\\;x > a \\Rightarrow f > 1$',
            '$f(x) > 0$ מתקיים רק ב-$\\;0 < x < \\frac1a$ או $x > a$',
          ],
          final_answer: 'תחום ההגדרה של $g$: $\\;0 < x < \\frac1a$ או $x > a$',
        },
      },
      {
        label: 'ג2',
        prompt: 'סרטטו סקיצה של גרף הפונקציה $g(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [0, 6],
            yRange: [-4, 5],
            curves: [
              { fn: (x) => Math.log((Math.log(x) + Math.log(2)) / (Math.log(x) - Math.log(2))), domain: [0.03, 0.46], color: '#60a5fa' },
              { fn: (x) => Math.log((Math.log(x) + Math.log(2)) / (Math.log(x) - Math.log(2))), domain: [2.1, 6], color: '#60a5fa' },
            ],
            vAsymptotes: [{ x: 0.5, label: 'x=1/a' }, { x: 2, label: 'x=a' }],
            hAsymptotes: [{ y: 0, label: 'y=0' }],
            caption: '$g(x)=\\ln(f(x))$ (דוגמה $a=2$): מוגדרת ב-$0<x<\\frac1a$ (שם $g<0$) וב-$x>a$ (שם $g>0$); אסימפטוטות $x=\\frac1a$, $x=a$, ו-$y=0$.',
          },
        ],
        hints: [
          '$g\' = \\frac{f\'}{f}$ — בתחום $f>0$ מתקיים $f\'<0$, אז $g$ יורדת.',
          'אסימפטוטות: כש-$f\\to0$ אז $g\\to-\\infty$; כש-$f\\to\\infty$ אז $g\\to\\infty$; כש-$f\\to1$ אז $g\\to0$.',
        ],
        solution: {
          steps: [
            '$g\' = \\dfrac{f\'}{f}$; בתחום $f>0$ מתקיים $f\'<0$, ולכן $g$ יורדת',
            'אסימפטוטות אנכיות: $x=\\frac1a$ ($f\\to0 \\Rightarrow g\\to-\\infty$) ו-$x=a$ ($f\\to\\infty \\Rightarrow g\\to\\infty$)',
            'אסימפטוטה אופקית $y=0$ (כש-$x\\to\\infty$, $f\\to1 \\Rightarrow g=\\ln1=0$)',
            'בתחום $0<x<\\frac1a$: $0<f<1 \\Rightarrow g<0$; בתחום $x>a$: $f>1 \\Rightarrow g>0$',
          ],
          final_answer: 'גרף בעל שני ענפים: $0<x<\\frac1a$ (מתחת לציר $x$) ו-$x>a$ (מעל ציר $x$, יורד אל $y=0$). ראה תרשים',
        },
      },
      {
        label: 'ד',
        prompt: [
          'נסמן ב-$S$ את השטח המוגבל על ידי גרף $g(x)$, ציר ה-$x$, והישרים $x=3$ ו-$x=5$. נתון: $1 < a < 3$.',
          '',
          'הביעו באמצעות $S$ את ערך האינטגרל $\\;\\int_3^5 \\ln(4\\cdot f(x))\\,dx$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'כי $1<a<3$, הקטע $[3,5]$ כולו בתחום $x>a$ — שם $g(x)=\\ln(f(x))>0$, אז $S = \\int_3^5 \\ln(f(x))dx$.',
          'פצל: $\\ln(4f(x)) = \\ln 4 + \\ln f(x)$, ואינטגרל של קבוע פשוט.',
        ],
        solution: {
          steps: [
            'כי $1<a<3$, הקטע $[3,5]$ בתחום $x>a$, שם $g(x)=\\ln(f(x))>0$, אז $\\;S = \\int_3^5 \\ln(f(x))\\,dx$',
            '$\\int_3^5 \\ln(4f(x))\\,dx = \\int_3^5 \\bigl(\\ln 4 + \\ln f(x)\\bigr)dx$',
            '$= \\ln 4\\int_3^5 dx + \\int_3^5 \\ln f(x)\\,dx = \\ln 4\\cdot[x]_3^5 + S$',
            '$= \\ln 4\\cdot(5-3) + S = 2\\ln 4 + S$',
          ],
          final_answer: '$\\int_3^5 \\ln(4f(x))\\,dx = 2\\ln 4 + S = \\ln 16 + S \\approx 2.77 + S$',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q5 — חקירת פונקציות: f(x)=eˣ/(eˣ-6), g=1/f, שטח, חיתוך, קיצון של אינטגרל
  // ===========================================================================
  {
    id: 'b2023s582b-q5',
    year: 2023,
    season: 'summer',
    moed: 'b',
    paper: '582',
    questionNumber: 5,
    topic: 'פונקציה מעריכית',
    totalPoints: 25,
    context: 'נתונה הפונקציה $\\;f(x) = \\dfrac{e^x}{e^x - 6}$.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצאו את תחום ההגדרה של הפונקציה $f(x)$.',
        answer_type: 'expression',
        hints: ['המכנה $e^x-6$ חייב להיות שונה מאפס.'],
        solution: {
          steps: [
            'המכנה $\\ne 0$: $\\;e^x - 6 \\ne 0 \\Rightarrow e^x \\ne 6 \\Rightarrow x \\ne \\ln 6$',
          ],
          final_answer: 'תחום ההגדרה: $\\;x \\ne \\ln 6$ (כלומר $x<\\ln6$ או $x>\\ln6$)',
        },
      },
      {
        label: 'א2',
        prompt: 'מצאו את משוואות האסימפטוטות המאונכות לצירים של $f(x)$.',
        answer_type: 'expression',
        hints: [
          'אסימפטוטה אנכית: היכן המכנה מתאפס.',
          'אסימפטוטות אופקיות: חשב $\\lim_{x\\to\\infty}$ ו-$\\lim_{x\\to-\\infty}$ (חלק ב-$e^x$).',
        ],
        solution: {
          steps: [
            'אסימפטוטה אנכית: המכנה מתאפס ב-$x=\\ln6$, אז $\\;x = \\ln 6$',
            '$\\lim_{x\\to\\infty} \\dfrac{e^x}{e^x-6} = \\dfrac{1}{1 - 6/e^x} = \\dfrac{1}{1-0} = 1$, אסימפטוטה $y=1$',
            '$\\lim_{x\\to-\\infty} \\dfrac{e^x}{e^x-6} = \\dfrac{0}{0-6} = 0$, אסימפטוטה $y=0$',
          ],
          final_answer: 'אנכית $x=\\ln6$; אופקיות $y=1$ (ב-$\\infty$) ו-$y=0$ (ב-$-\\infty$)',
        },
      },
      {
        label: 'א3',
        prompt: 'מצאו את תחומי העלייה והירידה של $f(x)$ (אם יש כאלה).',
        answer_type: 'expression',
        hints: ['גזור עם כלל המנה ובדוק את הסימן של המונה (המכנה ריבוע).'],
        solution: {
          steps: [
            '$f\'(x) = \\dfrac{e^x(e^x-6) - e^x\\cdot e^x}{(e^x-6)^2} = \\dfrac{e^x(e^x-6-e^x)}{(e^x-6)^2} = \\dfrac{-6e^x}{(e^x-6)^2}$',
            'המונה $-6e^x < 0$ והמכנה $(e^x-6)^2 > 0$, לכן $f\'(x) < 0$ בכל התחום',
          ],
          final_answer: 'יורדת בכל תחום הגדרתה ($x<\\ln6$ וגם $x>\\ln6$); אין תחומי עלייה',
        },
      },
      {
        label: 'א4',
        prompt: 'סרטטו סקיצה של גרף הפונקציה $f(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-3, 5],
            yRange: [-7, 8],
            curves: [
              { fn: (x) => Math.exp(x) / (Math.exp(x) - 6), domain: [-3, 1.65], color: '#f472b6' },
              { fn: (x) => Math.exp(x) / (Math.exp(x) - 6), domain: [1.95, 5], color: '#f472b6' },
            ],
            vAsymptotes: [{ x: Math.log(6), label: 'x=ln6' }],
            hAsymptotes: [{ y: 1, label: 'y=1' }, { y: 0, label: 'y=0' }],
            caption: '$f(x)=\\frac{e^x}{e^x-6}$: אסימפטוטה אנכית $x=\\ln6$; אופקיות $y=1$ ו-$y=0$; יורדת בשני הענפים.',
          },
        ],
        hints: ['שלב את שלוש האסימפטוטות ($x=\\ln6$, $y=1$, $y=0$) ואת הירידה התמידית.'],
        solution: {
          steps: [
            'בתחום $x<\\ln6$: יורד מ-$0$ (אסימפטוטה $y=0$ ב-$-\\infty$) אל $-\\infty$ (כש-$x\\to\\ln6^-$)',
            'בתחום $x>\\ln6$: יורד מ-$+\\infty$ (כש-$x\\to\\ln6^+$) אל האסימפטוטה $y=1$',
            'חיתוך עם ציר $y$: $f(0) = \\dfrac{1}{1-6} = -\\dfrac15$',
          ],
          final_answer: 'גרף בעל שני ענפים, אסימפטוטות $x=\\ln6$, $y=1$, $y=0$ (ראה תרשים)',
        },
      },
      {
        label: 'ב1',
        prompt: [
          'נתונה $g(x) = \\dfrac{1}{f(x)}$, מוגדרת באותו תחום של $f$.',
          '',
          'מצאו את משוואות האסימפטוטות המאונכות לצירים של $g(x)$ (אם יש כאלה).',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'פשט: $g(x) = \\frac{1}{f(x)} = \\frac{e^x-6}{e^x} = 1 - 6e^{-x}$.',
          'ב-$x=\\ln6$: $f\\to\\pm\\infty$ אז $g\\to0$ (חור, לא אסימפטוטה). בדוק את הגבול ב-$\\infty$.',
        ],
        solution: {
          steps: [
            '$g(x) = \\dfrac{1}{f(x)} = \\dfrac{e^x-6}{e^x} = 1 - 6e^{-x}$',
            'ב-$x=\\ln6$: $f\\to\\pm\\infty$, אז $g=\\frac1f\\to0$ — נקודת אי-רציפות (חור), לא אסימפטוטה אנכית',
            '$\\lim_{x\\to\\infty} g = 1 - 0 = 1$ (אסימפטוטה $y=1$); כש-$x\\to-\\infty$, $g\\to-\\infty$ (אין אסימפטוטה)',
          ],
          final_answer: 'אסימפטוטה אופקית יחידה: $\\;y = 1$ (ב-$x=\\ln6$ יש חור, $g\\to0$)',
        },
      },
      {
        label: 'ב2',
        prompt: 'סרטטו סקיצה של גרף הפונקציה $g(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-1, 5],
            yRange: [-4.5, 2],
            curves: [{ fn: (x) => 1 - 6 * Math.exp(-x), domain: [0.2, 5], color: '#60a5fa' }],
            hAsymptotes: [{ y: 1, label: 'y=1' }],
            markedPoints: [{ x: Math.log(6), y: 0, label: 'חור (ln6,0)' }],
            caption: '$g(x)=1-6e^{-x}$: עולה, אסימפטוטה אופקית $y=1$, ונקודת אי-רציפות (חור) ב-$(\\ln6, 0)$.',
          },
        ],
        hints: ['$g\'=6e^{-x}>0$ → עולה. שלב את האסימפטוטה $y=1$ ואת החור ב-$(\\ln6,0)$.'],
        solution: {
          steps: [
            '$g(x) = 1 - 6e^{-x}$, ו-$g\'(x) = 6e^{-x} > 0$ — $g$ עולה בכל התחום',
            'אסימפטוטה $y=1$, חור ב-$(\\ln6, 0)$, וכש-$x\\to-\\infty$ מתקיים $g\\to-\\infty$',
          ],
          final_answer: 'גרף עולה עם אסימפטוטה $y=1$ וחור ב-$(\\ln6, 0)$ (ראה תרשים)',
        },
      },
      {
        label: 'ב3',
        prompt: 'חשבו את השטח המוגבל על ידי גרף $g(x)$, האסימפטוטה האופקית שלה, והישרים $x=\\ln7$ ו-$x=\\ln10$.',
        answer_type: 'number',
        hints: [
          'השטח הוא בין האסימפטוטה $y=1$ לגרף $g$ (ו-$g<1$): $\\;S = \\int_{\\ln7}^{\\ln10}(1-g(x))dx$.',
          '$1 - g(x) = 6e^{-x}$. זכור $e^{-\\ln a} = \\frac1a$.',
        ],
        solution: {
          steps: [
            'בין האסימפטוטה $y=1$ לגרף $g$ (שם $g<1$): $\\;S = \\int_{\\ln7}^{\\ln10} (1 - g(x))\\,dx$',
            '$1 - g(x) = 1 - (1 - 6e^{-x}) = 6e^{-x}$',
            '$S = \\int_{\\ln7}^{\\ln10} 6e^{-x}dx = \\left[-6e^{-x}\\right]_{\\ln7}^{\\ln10}$',
            '$= -6\\cdot\\tfrac{1}{10} - \\left(-6\\cdot\\tfrac17\\right) = -\\tfrac35 + \\tfrac67 = \\tfrac{9}{35}$',
          ],
          final_answer: '$S = \\dfrac{9}{35}$',
        },
      },
      {
        label: 'ג',
        prompt: 'מצאו את שיעורי נקודת החיתוך של גרף $f(x)$ עם גרף $g(x)$.',
        answer_type: 'expression',
        hints: [
          'חיתוך: $f = g$, כלומר $f = \\frac1f$, ומכאן $f^2=1$.',
          'בדוק את שני המקרים $f=1$ ו-$f=-1$ (אחד מהם נפסל).',
        ],
        solution: {
          steps: [
            '$f = g$: $\\;\\dfrac{1}{f} = f \\Rightarrow f^2 = 1 \\Rightarrow f = \\pm1$',
            '$f=1$: $\\;\\dfrac{e^x}{e^x-6}=1 \\Rightarrow e^x = e^x-6 \\Rightarrow 0=-6$ — אין פתרון',
            '$f=-1$: $\\;\\dfrac{e^x}{e^x-6}=-1 \\Rightarrow 2e^x=6 \\Rightarrow e^x=3 \\Rightarrow x=\\ln3$',
          ],
          final_answer: 'נקודת החיתוך: $(\\ln3,\\, -1)$',
        },
      },
      {
        label: 'ד',
        prompt: [
          'נתונה $s(x) = \\displaystyle\\int_x^{\\ln5} \\bigl(f(t) - g(t)\\bigr)dt$, המוגדרת בתחום $x < \\ln5$.',
          '',
          'מצאו את שיעור ה-$x$ של נקודת הקיצון של $s(x)$ וקבעו את סוגה.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'לפי המשפט היסודי, ו-$x$ בגבול התחתון: $\\;s\'(x) = -(f(x)-g(x)) = g(x)-f(x)$.',
          '$s\'=0$ כשהגרפים נחתכים ($x=\\ln3$). בנה טבלת סימן ל-$s\'=g-f$.',
        ],
        solution: {
          steps: [
            '$x$ בגבול התחתון, אז $\\;s\'(x) = -\\bigl(f(x)-g(x)\\bigr) = g(x)-f(x)$',
            '$s\'(x) = 0 \\Rightarrow g(x)=f(x) \\Rightarrow x=\\ln3$ (מסעיף ג)',
            'בדיקה: ב-$x=0$ מתקיים $g-f<0$; ב-$x=\\ln4$ מתקיים $g-f>0$. טבלת סימן: $\\begin{array}{c|c|c|c} x & x<\\ln3 & \\ln3 & \\ln3<x<\\ln5 \\\\ \\hline s\'(x) & - & 0 & + \\\\ s(x) & \\searrow & & \\nearrow \\end{array}$',
            'מעבר $(-)\\to(+)$ ב-$x=\\ln3$ → מינימום',
          ],
          final_answer: 'מינימום ב-$x = \\ln3$',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
