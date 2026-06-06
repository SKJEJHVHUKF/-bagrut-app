/**
 * שאלון 582 — קיץ תשפ"א (2021), מועד א'
 * =====================================
 *
 * המקור של השאלות: meyda.education.gov.il (משרד החינוך — נחלת הכלל).
 * הפתרונות נכתבו על-ידינו בסגנון האפליקציה; השיטה המתמטית עצמה כללית.
 *
 * תוכן השאלון:
 *   Q1 — גאומטריה אנליטית (פרבולות כמקום גאומטרי + דלתון).
 *   Q2 — וקטורים במרחב (פירמידה SABCD מעל מעוין, $SA\perp$ בסיס).
 *   Q3 — מספרים מרוכבים ($z^4=-16$, סיבוב, מצולע משוכלל).
 *   Q4 — פונקציה מעריכית ($f=1+ae^{-2x}$, סיגמואיד $g=1/f$).
 *   Q5 — פונקציית ln (חקירת $\ln\frac{x^2-1}{(x+2)(x-1)}$).
 *
 * הערה: לכל תת-סעיף בשאלון המקורי יש כאן סעיף נפרד לענות עליו,
 * גרפים ויזואליים מופיעים בתוך הסעיף הספציפי שלהם (לא ברמת שאלה).
 */

import type { PastBagrutQuestion } from './types';

export const bagrut2021Summer582MoedA: PastBagrutQuestion[] = [
  // ===========================================================================
  // Q1 — שתי פרבולות (מקום גאומטרי) + דלתון
  // ===========================================================================
  {
    id: 'b2021s582a-q1',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 1,
    topic: 'גאומטריה אנליטית',
    totalPoints: 33,
    context: '(קיץ תשפ"א, מועד א\') נתון פרמטר $a > 0$.',
    parts: [
      {
        label: 'א',
        prompt:
          'מצא את משוואת המקום הגאומטרי של כל הנקודות שהמרחק שלהן מן הנקודה $(a,\\,0)$ שווה למרחק שלהן מן הישר $\\;x = a - 1$.',
        answer_type: 'expression',
        hints: [
          'זו ההגדרה הגאומטרית של פרבולה: מוקד $(a,0)$, מדריך $x = a-1$.',
          'דרך אלגברית: $\\sqrt{(x-a)^2 + y^2} = |x - (a-1)|$. העלה בריבוע ופשט.',
        ],
        solution: {
          steps: [
            'נסמן נקודה כללית $(x,y)$. תנאי המרחקים: $\\;\\sqrt{(x-a)^2 + y^2} = |x - a + 1|$.',
            'העלאה בריבוע: $\\;(x-a)^2 + y^2 = (x-a+1)^2$.',
            'נסמן $u = x - a$: $\\;u^2 + y^2 = (u+1)^2 = u^2 + 2u + 1 \\Rightarrow y^2 = 2u + 1 = 2(x-a) + 1$.',
          ],
          final_answer: 'המקום הגאומטרי: פרבולה $\\;y^2 = 2x - 2a + 1$ (פותחת ימינה).',
        },
      },
      {
        label: 'ב',
        prompt:
          'מצא את משוואת המקום הגאומטרי של כל הנקודות שהמרחק שלהן מן הנקודה $(0,\\,a)$ שווה למרחק שלהן מן הישר $\\;y = a - 1$.',
        answer_type: 'expression',
        hints: ['בדיוק כמו א, רק עם החלפת תפקידים $x \\leftrightarrow y$.'],
        solution: {
          steps: [
            '$\\sqrt{x^2 + (y-a)^2} = |y - a + 1|$. נעלה בריבוע: $\\;x^2 + (y-a)^2 = (y-a+1)^2$.',
            'נסמן $v = y - a$: $\\;x^2 + v^2 = (v+1)^2 \\Rightarrow x^2 = 2v + 1 = 2(y-a) + 1$.',
          ],
          final_answer: 'המקום הגאומטרי: פרבולה $\\;x^2 = 2y - 2a + 1$ (פותחת מעלה).',
        },
      },
      {
        label: 'ג1',
        prompt:
          'שני המקומות הגאומטריים נחתכים בשתי נקודות. אחת מהן היא $(2,\\,2)$. מצא את $a$.',
        answer_type: 'number',
        hints: ['הצב $(2,2)$ באחת המשוואות (שתיהן יתנו אותה תשובה).'],
        solution: {
          steps: [
            'נציב $(2,2)$ במשוואה מסעיף א: $\\;2^2 = 2\\cdot 2 - 2a + 1 \\Rightarrow 4 = 5 - 2a \\Rightarrow a = \\tfrac{1}{2}$.',
            'בדיקה במשוואה מסעיף ב: $\\;2^2 = 2\\cdot 2 - 2a + 1 \\Rightarrow$ אותו דבר. ✓',
          ],
          final_answer: '$a = \\dfrac{1}{2}$.',
        },
      },
      {
        label: 'ג2',
        prompt: 'מצא את שיעורי נקודת החיתוך האחרת.',
        answer_type: 'expression',
        hints: [
          'עם $a = \\tfrac{1}{2}$, שתי הפרבולות הן: $\\;y^2 = 2x$ ו-$x^2 = 2y$.',
          'הצב $y = x^2/2$ ב-$y^2 = 2x$, ופתור משוואה ב-$x$.',
        ],
        solution: {
          steps: [
            'עם $a = \\tfrac{1}{2}$: $\\;y^2 = 2x$ ו-$x^2 = 2y$.',
            'מהשנייה: $\\;y = x^2/2$. הצב בראשונה: $\\;(x^2/2)^2 = 2x \\Rightarrow x^4/4 = 2x \\Rightarrow x(x^3 - 8) = 0$.',
            '$x = 0$ או $x = 2$. ב-$x=0$: $y=0$. ב-$x=2$: $y=2$ (זו הנקודה הנתונה).',
          ],
          final_answer: 'נקודת החיתוך השנייה: $(0,\\,0)$.',
        },
      },
      {
        label: 'ד1',
        prompt: [
          'מחברים את שתי נקודות החיתוך של שני המקומות הגאומטריים עם הנקודות $(3a,\\,0)$ ו-$(0,\\,3a)$ — מתקבל מרובע.',
          'מהו סוג המרובע? נמק.',
        ].join('\n'),
        answer_type: 'text',
        hints: [
          'עם $a = \\tfrac{1}{2}$: ארבעת הקודקודים $(0,0)$, $(\\tfrac{3}{2},0)$, $(2,2)$, $(0,\\tfrac{3}{2})$.',
          'חשב אורכי הצלעות. אם יש שני זוגות של צלעות סמוכות שוות $\\Rightarrow$ דלתון.',
          'בדוק אלכסונים: על קוים $y=x$ ו-$x+y=\\tfrac{3}{2}$. ניצבים?',
        ],
        solution: {
          steps: [
            'קודקודי המרובע ($a = \\tfrac{1}{2}$): $\\;A(0,0)$, $B(\\tfrac{3}{2},0)$, $C(2,2)$, $D(0,\\tfrac{3}{2})$.',
            'אורכי הצלעות: $\\;|AB| = \\tfrac{3}{2}$, $\\;|BC| = \\sqrt{\\tfrac{1}{4}+4} = \\tfrac{\\sqrt{17}}{2}$, $\\;|CD| = \\tfrac{\\sqrt{17}}{2}$, $\\;|DA| = \\tfrac{3}{2}$.',
            'שני זוגות של צלעות סמוכות שוות: $|AB|=|DA|$, $|BC|=|CD|$ — הקודקודים $A$ ו-$C$ הם "קודקודי הדלתון".',
            'בדיקת אלכסונים: $AC$ על הישר $y=x$ (שיפוע $1$), $BD$ על הישר $x+y=\\tfrac{3}{2}$ (שיפוע $-1$). מכפלת שיפועים $= -1 \\Rightarrow$ ניצבים. ✓',
            'מסקנה: זה דלתון (קייט) — שני זוגות צלעות סמוכות שוות + אלכסונים ניצבים.',
          ],
          final_answer: 'המרובע הוא דלתון (אלכסונים ניצבים, שני זוגות צלעות סמוכות שוות).',
        },
      },
      {
        label: 'ד2',
        prompt: 'חשב את שטח המרובע.',
        answer_type: 'number',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="160" x2="185" y2="160" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="25" y1="15" x2="25" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <polygon points="25,160 115,160 175,40 25,100" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <line x1="25" y1="160" x2="175" y2="40" stroke="rgba(251,191,36,0.6)" stroke-width="1" stroke-dasharray="3 3"/>
              <line x1="115" y1="160" x2="25" y2="100" stroke="rgba(251,191,36,0.6)" stroke-width="1" stroke-dasharray="3 3"/>
              <circle cx="25" cy="160" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="115" cy="160" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="175" cy="40" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="25" cy="100" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="14" y="172" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">A(0,0)</text>
              <text x="100" y="174" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">B(3/2,0)</text>
              <text x="160" y="34" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">C(2,2)</text>
              <text x="0" y="94" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">D(0,3/2)</text>
            `,
            caption: 'הדלתון $ABCD$: אלכסונים ניצבים $AC$ (על $y=x$) ו-$BD$ (על $x+y=\\tfrac{3}{2}$).',
          },
        ],
        hints: [
          'שטח דלתון $= \\tfrac{1}{2}\\cdot d_1\\cdot d_2$, כאשר $d_1, d_2$ אורכי האלכסונים.',
          '$|AC| = $ המרחק מ-$(0,0)$ ל-$(2,2)$; $|BD| = $ המרחק מ-$(\\tfrac{3}{2},0)$ ל-$(0,\\tfrac{3}{2})$.',
        ],
        solution: {
          steps: [
            '$|AC| = \\sqrt{4+4} = 2\\sqrt 2$. $\\;|BD| = \\sqrt{\\tfrac{9}{4}+\\tfrac{9}{4}} = \\tfrac{3\\sqrt 2}{2}$.',
            'שטח: $\\;S = \\tfrac{1}{2}\\cdot 2\\sqrt 2\\cdot \\tfrac{3\\sqrt 2}{2} = \\tfrac{1}{2}\\cdot 6 = 3$.',
          ],
          final_answer: 'שטח המרובע: $\\;S = 3$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q2 — פירמידה SABCD מעל מעוין, $SA\perp$ בסיס
  // ===========================================================================
  {
    id: 'b2021s582a-q2',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 2,
    topic: 'וקטורים במרחב',
    totalPoints: 33,
    context: [
      '(קיץ תשפ"א, מועד א\') נתונה פירמידה מרובעת $SABCD$ שבסיסה $ABCD$ מעוין.',
      '$\\vec{SA}$ מאונך לבסיס, $\\;SA = BA$, $\\;\\angle BAD = 60°$, $\\;\\vec{SE} = t\\cdot \\vec{SC}$ ($0 < t < 1$).',
      'נסמן: $\\;\\vec{AB} = \\vec u$, $\\;\\vec{AD} = \\vec v$, $\\;\\vec{AS} = \\vec w$.',
    ].join('\n'),
    parts: [
      {
        label: 'א',
        prompt: 'הבע את הווקטורים $\\;\\vec{EB}\\;$ ו-$\\;\\vec{ED}\\;$ באמצעות $t,\\,\\vec u,\\,\\vec v,\\,\\vec w$.',
        answer_type: 'expression',
        hints: [
          '$\\vec{SC} = \\vec{AC} - \\vec{AS} = (\\vec u + \\vec v) - \\vec w$ (במעוין $\\vec{AC} = \\vec{AB}+\\vec{AD}$).',
          '$\\vec{AE} = \\vec{AS} + \\vec{SE} = \\vec w + t(\\vec u+\\vec v-\\vec w) = t\\vec u + t\\vec v + (1-t)\\vec w$.',
          'ואז $\\vec{EB} = \\vec{AB} - \\vec{AE}$, $\\;\\vec{ED} = \\vec{AD} - \\vec{AE}$.',
        ],
        solution: {
          steps: [
            '$\\vec{SC} = (\\vec u + \\vec v) - \\vec w$.',
            '$\\vec{AE} = \\vec w + t\\bigl((\\vec u + \\vec v) - \\vec w\\bigr) = t\\vec u + t\\vec v + (1-t)\\vec w$.',
            '$\\vec{EB} = \\vec u - \\vec{AE} = (1-t)\\vec u - t\\vec v - (1-t)\\vec w$.',
            '$\\vec{ED} = \\vec v - \\vec{AE} = -t\\vec u + (1-t)\\vec v - (1-t)\\vec w$.',
          ],
          final_answer:
            '$\\vec{EB} = (1-t)\\vec u - t\\vec v - (1-t)\\vec w$, $\\;\\vec{ED} = -t\\vec u + (1-t)\\vec v - (1-t)\\vec w$.',
        },
      },
      {
        label: 'ב1',
        prompt: 'נתון $t = \\tfrac{1}{2}$. הוכח כי $\\;\\vec{EB}\\;$ מאונך ל-$\\;\\vec{ED}$.',
        answer_type: 'proof',
        hints: [
          'הצב $t=\\tfrac{1}{2}$: $\\vec{EB} = \\tfrac{1}{2}(\\vec u - \\vec v - \\vec w)$, $\\vec{ED} = \\tfrac{1}{2}(-\\vec u + \\vec v - \\vec w)$.',
          'בנתונים: $|\\vec u|=|\\vec v|=|\\vec w| =: q$ (כי מעוין + $SA=BA$); $\\vec u\\cdot\\vec v = q^2/2$ (כי $\\cos 60° = 1/2$); $\\vec u\\cdot\\vec w = \\vec v\\cdot\\vec w = 0$ (כי $SA$ ניצב לבסיס).',
          'חשב $\\vec{EB}\\cdot\\vec{ED}$ והראה שיוצא $0$.',
        ],
        solution: {
          steps: [
            'ב-$t=\\tfrac{1}{2}$: $\\;\\vec{EB} = \\tfrac{1}{2}(\\vec u - \\vec v - \\vec w)$, $\\;\\vec{ED} = \\tfrac{1}{2}(-\\vec u + \\vec v - \\vec w)$.',
            'נסמן $q = |\\vec u|^2 = |\\vec v|^2 = |\\vec w|^2$. ידוע: $\\vec u\\cdot\\vec v = q\\cos 60° = q/2$, $\\;\\vec u\\cdot\\vec w = \\vec v\\cdot\\vec w = 0$.',
            'מכפלה סקלרית (פתיחה מלאה, ביטול גורם $\\tfrac{1}{4}$):',
            '$(\\vec u-\\vec v-\\vec w)\\cdot(-\\vec u+\\vec v-\\vec w) = -q + \\tfrac{q}{2} - 0 + \\tfrac{q}{2} - q + 0 + 0 - 0 + q = 0$.',
            'אז $\\vec{EB}\\cdot\\vec{ED} = 0$, כלומר $\\vec{EB}\\perp\\vec{ED}$. ⬛',
          ],
          final_answer: 'הוכח: $\\vec{EB}\\cdot\\vec{ED} = 0$.',
        },
      },
      {
        label: 'ב2',
        prompt: 'הוכח כי האנך מן הנקודה $E$ לבסיס $ABCD$ עובר דרך נקודת מפגש האלכסונים של המעוין.',
        answer_type: 'proof',
        hints: [
          'נקודת מפגש האלכסונים $M$ = אמצע $AC$ = $\\tfrac{1}{2}(\\vec u + \\vec v)$.',
          'חשב $\\vec{ME} = \\vec{AE} - \\vec{AM}$. אם תוצאה בכיוון $\\vec w$ בלבד $\\Rightarrow ME\\perp$ בסיס $\\Rightarrow$ האנך עובר דרך $M$.',
        ],
        solution: {
          steps: [
            '$\\vec{AM} = \\tfrac{1}{2}\\vec{AC} = \\tfrac{1}{2}(\\vec u + \\vec v)$.',
            '$\\vec{AE} = \\tfrac{1}{2}\\vec u + \\tfrac{1}{2}\\vec v + \\tfrac{1}{2}\\vec w = \\tfrac{1}{2}(\\vec u + \\vec v + \\vec w)$.',
            '$\\vec{ME} = \\vec{AE} - \\vec{AM} = \\tfrac{1}{2}\\vec w$.',
            '$\\vec{ME}$ במקביל ל-$\\vec w$ — שהוא מאונך לבסיס. אז $\\vec{ME}\\perp ABCD$, כלומר האנך מ-$E$ לבסיס עובר דרך $M$. ⬛',
          ],
          final_answer:
            'הוכח: $\\vec{ME} = \\tfrac{1}{2}\\vec w$ — מאונך לבסיס, ולכן האנך עובר ב-$M$.',
        },
      },
      {
        label: 'ג',
        prompt: [
          'במערכת צירים: $A = (0,0,0)$, $\\;B = (6\\sqrt 3,\\,6,\\,0)$, $D$ על החלק החיובי של ציר ה-$y$, שיעור ה-$z$ של $S$ גדול מאפס.',
          'חשב את שיעורי הקודקודים $S$ ו-$D$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          'אורך צלע: $|\\vec{AB}| = \\sqrt{108+36} = 12$. במעוין $|AD| = 12$, ו-$D$ על ציר $y$ חיובי.',
          '$SA$ ניצב לבסיס ושווה ל-$AB$ באורך: $S = (0,0,12)$.',
        ],
        solution: {
          steps: [
            '$|\\vec{AB}| = \\sqrt{(6\\sqrt 3)^2 + 6^2} = \\sqrt{108 + 36} = \\sqrt{144} = 12$. אורך צלע המעוין.',
            'בדיקת זווית $\\angle BAD = 60°$ עם $D = (0,12,0)$: $\\;\\cos\\theta = \\dfrac{\\vec{AB}\\cdot\\vec{AD}}{144} = \\dfrac{72}{144} = \\tfrac{1}{2}$ ✓.',
            '$S$ מאונך לבסיס מ-$A$, באורך $12$, בכיוון $z$ חיובי: $\\;S = (0,\\,0,\\,12)$.',
          ],
          final_answer: '$D = (0,\\,12,\\,0)$, $\\;S = (0,\\,0,\\,12)$.',
        },
      },
      {
        label: 'ד',
        prompt: 'מצא את משוואת המישור $SAB$.',
        answer_type: 'expression',
        hints: [
          'שלוש נקודות: $S(0,0,12)$, $A(0,0,0)$, $B(6\\sqrt 3,6,0)$.',
          'נורמל = $\\vec{AS}\\times\\vec{AB}$. שים לב ש-$\\vec{AS} = (0,0,12)$ מקביל לציר $z$, אז המישור מכיל את ציר $z$.',
        ],
        solution: {
          steps: [
            '$\\vec{AS} = (0,0,12)$, $\\;\\vec{AB} = (6\\sqrt 3,6,0)$.',
            'נורמל: $\\;\\vec n = \\vec{AS}\\times\\vec{AB} = (0\\cdot 0 - 12\\cdot 6,\\;12\\cdot 6\\sqrt 3 - 0\\cdot 0,\\;0\\cdot 6 - 0\\cdot 6\\sqrt 3) = (-72,\\,72\\sqrt 3,\\,0)$.',
            'נחלק ב-$-72$: $\\vec n = (1,\\,-\\sqrt 3,\\,0)$.',
            'מישור דרך $A = (0,0,0)$: $\\;x - \\sqrt 3\\,y = 0$.',
          ],
          final_answer: 'משוואת מישור $SAB$: $\\;x - \\sqrt 3\\,y = 0$ (או באופן שקול $x = \\sqrt 3\\,y$).',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q3 — מספרים מרוכבים: $z^4=-16$ + סיבוב + 16-גון
  // ===========================================================================
  {
    id: 'b2021s582a-q3',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 3,
    topic: 'מספרים מרוכבים',
    totalPoints: 33,
    context: '(קיץ תשפ"א, מועד א\') נתונה המשוואה $\\;z^4 = -16\\;$ ($z$ מספר מרוכב).',
    parts: [
      {
        label: 'א',
        prompt: 'פתור את המשוואה.',
        answer_type: 'expression',
        hints: [
          'כתוב $-16 = 16\\,\\text{cis}(180°)$. אז $|z|^4 = 16 \\Rightarrow |z| = 2$, וזווית $z$ היא $(180° + 360°k)/4$ ל-$k=0,1,2,3$.',
        ],
        solution: {
          steps: [
            '$-16 = 16\\,\\text{cis}(180°)$. אז $|z| = 16^{1/4} = 2$ והזוויות: $(180°+360°k)/4 = 45° + 90°k$, $k=0,1,2,3$.',
            'הפתרונות: $\\;z_1 = 2\\,\\text{cis}(45°) = \\sqrt 2 + \\sqrt 2\\,i$, $\\;z_2 = 2\\,\\text{cis}(135°) = -\\sqrt 2 + \\sqrt 2\\,i$,',
            '$\\;z_3 = 2\\,\\text{cis}(225°) = -\\sqrt 2 - \\sqrt 2\\,i$, $\\;z_4 = 2\\,\\text{cis}(315°) = \\sqrt 2 - \\sqrt 2\\,i$.',
          ],
          final_answer:
            'ארבעה פתרונות: $\\;\\pm\\sqrt 2 \\pm \\sqrt 2\\,i$ (כל ארבעת צירופי הסימנים).',
        },
      },
      {
        label: 'ב',
        prompt:
          'פתרונות המשוואה מייצגים קודקודים של מצולע במישור גאוס. שרטט אותו במערכת הצירים.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="178" y="96" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Im</text>
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(226,232,240,0.4)" stroke-width="1.1" stroke-dasharray="3 3"/>
              <polygon points="149.5,50.5 50.5,50.5 50.5,149.5 149.5,149.5" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <circle cx="149.5" cy="50.5" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="50.5" cy="50.5" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="50.5" cy="149.5" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="149.5" cy="149.5" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="152" y="46" fill="#f1f5f9" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">z₁</text>
              <text x="36" y="46" fill="#f1f5f9" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">z₂</text>
              <text x="36" y="160" fill="#f1f5f9" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">z₃</text>
              <text x="152" y="160" fill="#f1f5f9" font-size="10" font-weight="bold" font-family="Heebo, sans-serif">z₄</text>
            `,
            caption: 'ארבעת הפתרונות יוצרים ריבוע חסום במעגל $|z|=2$, מסובב ב-$45°$ ביחס לצירים.',
          },
        ],
        hints: ['ארבעה קודקודים במרחקים שווים על מעגל $|z|=2$, בזוויות $45°,135°,225°,315°$ $\\Rightarrow$ ריבוע.'],
        solution: {
          steps: [
            'ארבעת הפתרונות במרחק $2$ מהראשית ובמרווחי $90°$ ביניהם — ריבוע משוכלל חסום במעגל $|z|=2$.',
            'אורך צלע: $\\;a = 2\\cdot 2\\sin(45°) = 2\\sqrt 2$. שטח הריבוע: $a^2 = 8$.',
          ],
          final_answer: 'ריבוע משוכלל חסום במעגל $|z|=2$, צלע $2\\sqrt 2$.',
        },
      },
      {
        label: 'ג',
        prompt:
          'כופלים את כל אחד מן המספרים המייצגים את קודקודי המצולע ב-$\\;\\dfrac{1+i}{\\sqrt 2}$. מצא את שיעורי הנקודות שהתקבלו.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="178" y="96" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Im</text>
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(226,232,240,0.4)" stroke-width="1.1" stroke-dasharray="3 3"/>
              <polygon points="170,100 100,30 30,100 100,170" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.8"/>
              <circle cx="170" cy="100" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="100" cy="30" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="30" cy="100" r="3" fill="rgba(244,114,182,0.95)"/>
              <circle cx="100" cy="170" r="3" fill="rgba(244,114,182,0.95)"/>
              <text x="175" y="96" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">2</text>
              <text x="106" y="32" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">2i</text>
              <text x="18" y="96" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">-2</text>
              <text x="106" y="182" fill="#f1f5f9" font-size="10" font-family="Heebo, sans-serif">-2i</text>
            `,
            caption: 'אחרי הכפל ב-$\\text{cis}(45°)$ — סיבוב ב-$45°$. הקודקודים החדשים על הצירים.',
          },
        ],
        hints: [
          '$\\dfrac{1+i}{\\sqrt 2} = \\text{cis}(45°)$. כפל ב-$\\text{cis}(45°)$ = סיבוב ב-$45°$.',
          'הזוויות החדשות: $45°+45°=90°$, $135°+45°=180°$, וכן הלאה. המודולים נשארים $2$.',
        ],
        solution: {
          steps: [
            '$\\dfrac{1+i}{\\sqrt 2} = \\text{cis}(45°)$ — סיבוב טהור ב-$45°$ (מודול $1$).',
            'הזוויות החדשות: $45°+45°=90°$, $135°+45°=180°$, $225°+45°=270°$, $315°+45°=360°(=0°)$.',
            'הנקודות החדשות (מודול $2$): $\\;2\\,\\text{cis}(90°)=2i$, $\\;2\\,\\text{cis}(180°)=-2$, $\\;2\\,\\text{cis}(270°)=-2i$, $\\;2\\,\\text{cis}(0°)=2$.',
          ],
          final_answer: 'ארבע נקודות: $\\;2,\\;2i,\\;-2,\\;-2i$ (קודקודי ריבוע על הצירים).',
        },
      },
      {
        label: 'ד',
        prompt: [
          '$n$ הוא מספר טבעי, $\\;11 < n < 17$, ו-$c$ הוא מספר ממשי.',
          'כל אחד מן המספרים המרוכבים שנמצאו בסעיפים הקודמים (ארבעת מ-א וארבעת מ-ג, סה"כ 8) מקיים את המשוואה $\\;z^n = c$.',
          'מצא את $n$ ואת $c$.',
        ].join('\n'),
        answer_type: 'expression',
        hints: [
          '8 הנקודות יושבות על מעגל $|z|=2$, בזוויות $45°, 90°, 135°, 180°, \\ldots, 360°$ — כל הכפולות של $45°$.',
          'כדי שכל $z_k = 2\\,\\text{cis}(45°\\cdot k)$ יתן אותו $z^n$, צריך $45°\\cdot n \\equiv 0 \\pmod{360°}$, כלומר $n$ כפולה של $8$.',
          'בטווח $11 < n < 17$: רק $n = 16$. ואז $c = 2^{16}$.',
        ],
        solution: {
          steps: [
            '8 הנקודות יחד: על מעגל $|z|=2$ בזוויות $45°\\cdot k$ ל-$k=1,\\ldots,8$ (כל הכפולות).',
            '$z_k^n = 2^n\\,\\text{cis}(45°\\cdot k\\cdot n)$. כדי שתוצאה לא תלויה ב-$k$: $45°\\cdot n$ חייב להיות כפולה של $360°$ $\\Rightarrow n$ כפולה של $8$.',
            'בטווח $11 < n < 17$: $\\;n = 16$.',
            '$c = 2^{16}\\,\\text{cis}(45°\\cdot 16) = 2^{16}\\,\\text{cis}(720°) = 2^{16}\\cdot 1 = 65536$ (אכן ממשי ✓).',
          ],
          final_answer: '$n = 16$, $\\;c = 2^{16} = 65536$.',
        },
      },
      {
        label: 'ה',
        prompt:
          'הנקודות במישור גאוס המייצגות את כל פתרונות המשוואה $z^n = c$ מסעיף ד יוצרות מצולע משוכלל בעל $n$ צלעות. מצא את שטח המצולע.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'custom',
            viewBox: '0 0 200 200',
            svg: `
              <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(226,232,240,0.5)" stroke-width="1"/>
              <text x="178" y="96" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Re</text>
              <text x="104" y="22" fill="#f1f5f9" font-size="11" font-family="Heebo, sans-serif">Im</text>
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(226,232,240,0.4)" stroke-width="1.1" stroke-dasharray="3 3"/>
              <polygon points="170.0,100.0 164.6,73.2 149.5,50.5 126.8,35.4 100.0,30.0 73.2,35.4 50.5,50.5 35.4,73.2 30.0,100.0 35.4,126.8 50.5,149.5 73.2,164.6 100.0,170.0 126.8,164.6 149.5,149.5 164.6,126.8" fill="rgba(168,85,247,0.10)" stroke="rgba(244,114,182,0.95)" stroke-width="1.4"/>
            `,
            caption: 'מצולע משוכלל בן $16$ צלעות, חסום במעגל $|z|=2$ — שורשי $z^{16}=65536$.',
          },
        ],
        hints: [
          'פתרונות $z^n = c$ עם $|c|=2^n$: $n$ נקודות על מעגל $|z|=2$ במרווחי $360°/n = 22.5°$.',
          'שטח מצולע משוכלל בן $n$ צלעות חסום במעגל ברדיוס $R$: $S = \\tfrac{1}{2}\\,n\\,R^2\\,\\sin(2\\pi/n)$.',
        ],
        solution: {
          steps: [
            '16 קודקודים על מעגל $|z|=2$, במרווחי $22.5°$. נחתוך ל-$16$ משולשים מהמרכז — כל אחד עם שתי צלעות באורך $2$ וזווית מרכזית $22.5°$.',
            'שטח כל משולש: $\\;\\tfrac{1}{2}\\cdot 2\\cdot 2\\cdot \\sin 22.5° = 2\\sin 22.5°$.',
            'שטח כולל: $\\;16\\cdot 2\\sin 22.5° = 32\\sin 22.5°$.',
            'מנוסחת חצי-זווית: $\\;\\sin 22.5° = \\sqrt{\\tfrac{1-\\cos 45°}{2}} = \\sqrt{\\tfrac{2-\\sqrt 2}{4}} = \\tfrac{\\sqrt{2-\\sqrt 2}}{2}$.',
            'שטח: $\\;32\\cdot \\tfrac{\\sqrt{2-\\sqrt 2}}{2} = 16\\sqrt{2-\\sqrt 2} \\approx 12.25$.',
          ],
          final_answer: 'שטח המצולע: $\\;16\\sqrt{2-\\sqrt 2} \\approx 12.25$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q4 — $f = 1 + ae^{-2x}$ ו-$g = 1/f$ (סיגמואיד)
  // ===========================================================================
  {
    id: 'b2021s582a-q4',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 4,
    topic: 'פונקציה מעריכית',
    totalPoints: 33,
    context:
      '(קיץ תשפ"א, מועד א\') נתונה הפונקציה $\\;f(x) = 1 + a\\,e^{-2x}$ המוגדרת לכל $x$, $\\;a > 1$ פרמטר.',
    parts: [
      {
        label: 'א1',
        prompt: 'מצא את משוואות האסימפטוטות של $f(x)$ המאונכות לצירים (אם יש כאלה).',
        answer_type: 'expression',
        hints: ['בדוק $\\lim_{x\\to\\pm\\infty} f(x)$. אסימפטוטה אנכית לציר $y$ = אופקית.'],
        solution: {
          steps: [
            '$x\\to+\\infty$: $e^{-2x}\\to 0 \\Rightarrow f\\to 1$. אסימפטוטה אופקית $\\;y=1$.',
            '$x\\to-\\infty$: $e^{-2x}\\to\\infty \\Rightarrow f\\to\\infty$. אין אסימפטוטה.',
            'אנכיות: $f$ מוגדרת לכל $x$ — אין.',
          ],
          final_answer: 'אסימפטוטה אופקית יחידה: $\\;y = 1$.',
        },
      },
      {
        label: 'א2',
        prompt: 'מצא את תחומי העלייה והירידה של $f(x)$.',
        answer_type: 'expression',
        hints: ['$f\\,\'(x) = -2a\\,e^{-2x}$. הקבוע $-2a$ שלילי ($a>0$), והאקספוננט חיובי.'],
        solution: {
          steps: [
            '$f\\,\'(x) = -2a\\,e^{-2x} < 0$ לכל $x$ (כי $a>0$ וה-$e>0$).',
            'אז $f$ יורדת ממש בכל $\\mathbb R$, אין נקודות קיצון.',
          ],
          final_answer: '$f$ יורדת ממש על כל הישר, אין קיצון.',
        },
      },
      {
        label: 'א3',
        prompt: 'מצא את נקודות החיתוך של $f$ עם הצירים (אם יש כאלה).',
        answer_type: 'expression',
        hints: ['ציר $y$: $f(0)$. ציר $x$: $f(x)=0 \\Rightarrow 1+ae^{-2x}=0$, האם פתיר?'],
        solution: {
          steps: [
            'ציר $y$: $f(0) = 1 + a$. נקודה $(0,\\,1+a)$.',
            'ציר $x$: $1 + ae^{-2x} = 0 \\Rightarrow e^{-2x} = -1/a$. צד שמאל חיובי, צד ימין שלילי — אין פתרון.',
          ],
          final_answer: 'חיתוך עם ציר $y$ ב-$(0,\\,1+a)$. אין חיתוך עם ציר $x$.',
        },
      },
      {
        label: 'ב1',
        prompt: 'נתונה $\\;g(x) = \\dfrac{1}{f(x)}$. מהו תחום ההגדרה של $g$? נמק.',
        answer_type: 'expression',
        hints: ['$g$ מוגדרת היכן ש-$f\\ne 0$. הראת בא3 ש-$f$ תמיד חיובית — לכן לעולם לא אפסה.'],
        solution: {
          steps: [
            '$f(x) = 1 + ae^{-2x} > 1 > 0$ לכל $x$ ($a>0$, $e^{-2x}>0$).',
            'אז $f$ לעולם אינה אפסה, ו-$g$ מוגדרת היטב לכל $x$.',
          ],
          final_answer: 'תחום ההגדרה של $g$: $\\;\\mathbb R$ (כל הישר).',
        },
      },
      {
        label: 'ב2',
        prompt: 'מצא את האסימפטוטות של $g$ המאונכות לצירים.',
        answer_type: 'expression',
        hints: ['השתמש בא1: $f\\to 1$ ב-$+\\infty$, $f\\to\\infty$ ב-$-\\infty$. אז $g=1/f$ שואף ל-$1$ או $0$.'],
        solution: {
          steps: [
            '$x\\to+\\infty$: $f\\to 1 \\Rightarrow g\\to 1$. אסימפטוטה $y=1$.',
            '$x\\to-\\infty$: $f\\to\\infty \\Rightarrow g\\to 0$. אסימפטוטה $y=0$.',
            'אנכיות: אין (תחום ההגדרה כל הישר).',
          ],
          final_answer: 'שתי אסימפטוטות אופקיות: $\\;y = 0$ ($x\\to-\\infty$) ו-$y=1$ ($x\\to+\\infty$).',
        },
      },
      {
        label: 'ב3',
        prompt:
          'ידוע כי ל-$g$ יש נקודת פיתול אחת, המתקבלת כאשר $\\;x = \\dfrac{\\ln a}{2}$. מצא את שיעורי נקודת הפיתול וסרטט סקיצה של גרף $g$.',
        answer_type: 'expression',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-2, 4],
            yRange: [-0.2, 1.2],
            curves: [{ fn: (x) => 1 / (1 + 2 * Math.exp(-2 * x)) }],
            hAsymptotes: [
              { y: 0, label: 'y=0' },
              { y: 1, label: 'y=1' },
            ],
            markedPoints: [
              { x: Math.log(2) / 2, y: 0.5, label: 'פיתול' },
              { x: 0, y: 1 / 3, label: '(0,1/(1+a))' },
            ],
            caption: 'סיגמואיד $g(x) = 1/f(x)$ (לדוגמה $a=2$): עולה מ-$0$ ל-$1$, פיתול ב-$x=\\frac{\\ln a}{2}$ עם $y=\\frac{1}{2}$.',
          },
        ],
        hints: [
          'הצב $x = \\tfrac{\\ln a}{2}$ ב-$f$: $\\;e^{-2x} = e^{-\\ln a} = 1/a$, אז $f = 1 + a\\cdot(1/a) = 2$.',
          '$g = 1/f = 1/2$. נקודת הפיתול: $\\bigl(\\tfrac{\\ln a}{2},\\,\\tfrac{1}{2}\\bigr)$.',
        ],
        solution: {
          steps: [
            'הצבה ב-$f$: $\\;f\\bigl(\\tfrac{\\ln a}{2}\\bigr) = 1 + a\\,e^{-\\ln a} = 1 + 1 = 2$.',
            'אז $\\;g = 1/2$. נקודת הפיתול: $\\;\\bigl(\\tfrac{\\ln a}{2},\\,\\tfrac{1}{2}\\bigr)$.',
            'הסקיצה — ראה גרף: עקומה עולה מ-$y=0$ (משמאל) ל-$y=1$ (מימין), חוצה את $y=1/2$ בפיתול.',
          ],
          final_answer: 'נקודת פיתול: $\\;\\bigl(\\tfrac{\\ln a}{2},\\,\\tfrac{1}{2}\\bigr)$. הגרף — סיגמואיד.',
        },
      },
      {
        label: 'ג1',
        prompt: 'מצא את שיעורי נקודות הקיצון של $g$ (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          'גזור: $g\\,\'(x) = -f\\,\'/f^2 = 2ae^{-2x}/f^2$. הסימן?',
        ],
        solution: {
          steps: [
            '$g\\,\'(x) = -\\dfrac{f\\,\'(x)}{f(x)^2} = \\dfrac{2ae^{-2x}}{f(x)^2}$.',
            'המונה חיובי ($a>0$, $e>0$), המכנה חיובי (ריבוע). אז $g\\,\' > 0$ תמיד — אין נקודות קיצון.',
          ],
          final_answer: 'אין נקודות קיצון ($g$ עולה ממש בכל הישר).',
        },
      },
      {
        label: 'ג2',
        prompt:
          'מצא את משוואת המשיק לגרף $g$ בנקודה שבה הוא חותך את ציר ה-$y$.',
        answer_type: 'expression',
        hints: [
          'נקודת חיתוך עם ציר $y$: $g(0) = 1/f(0) = 1/(1+a)$.',
          'שיפוע = $g\\,\'(0)$. הצב $x=0$ ב-$g\\,\'(x) = 2ae^{-2x}/f(x)^2$.',
        ],
        solution: {
          steps: [
            '$g(0) = \\dfrac{1}{1+a}$. נקודה: $\\bigl(0,\\,\\tfrac{1}{1+a}\\bigr)$.',
            '$g\\,\'(0) = \\dfrac{2a}{(1+a)^2}$.',
            'משיק: $\\;y - \\dfrac{1}{1+a} = \\dfrac{2a}{(1+a)^2}\\cdot x$.',
            'או: $\\;y = \\dfrac{2a}{(1+a)^2}\\,x + \\dfrac{1}{1+a}$.',
          ],
          final_answer:
            'משוואת המשיק: $\\;y = \\dfrac{2a}{(1+a)^2}\\,x + \\dfrac{1}{1+a}$.',
        },
      },
      {
        label: 'ד',
        prompt:
          'חשב את השטח המוגבל על-ידי גרף $g$, הישר $\\;y = \\dfrac{1}{2}\\;$ והישר $\\;x = 0$.',
        answer_type: 'expression',
        hints: [
          'בנקודה $x = \\tfrac{\\ln a}{2}$ הגרף חוצה את $y = 1/2$ (מסעיף ב3). בתחום $[0,\\tfrac{\\ln a}{2}]$ הגרף מתחת לישר $y=1/2$.',
          'שטח $= \\displaystyle\\int_0^{(\\ln a)/2}\\bigl(\\tfrac{1}{2} - g(x)\\bigr)dx$. חשב $\\int g$ עם הצבה $u = e^{2x}+a$.',
        ],
        solution: {
          steps: [
            'התחום: $0 \\le x \\le \\tfrac{\\ln a}{2}$. בקצה השמאלי $g(0) = \\tfrac{1}{1+a} < \\tfrac{1}{2}$ (כי $a>1$), ובקצה הימני $g = \\tfrac{1}{2}$. אז $g < \\tfrac{1}{2}$ בתחום, והשטח בין הישר לעקומה.',
            'אינטגרל $g$: נכפיל מונה ומכנה ב-$e^{2x}$ — $g = \\dfrac{e^{2x}}{e^{2x}+a}$. נציב $u = e^{2x}+a$, $du = 2e^{2x}\\,dx$:',
            '$\\;\\displaystyle\\int g\\,dx = \\tfrac{1}{2}\\int\\dfrac{du}{u} = \\tfrac{1}{2}\\ln(e^{2x}+a) + C$.',
            'בתחום $[0,\\tfrac{\\ln a}{2}]$: $\\;\\displaystyle\\int_0^{(\\ln a)/2} g\\,dx = \\tfrac{1}{2}\\bigl[\\ln(2a) - \\ln(1+a)\\bigr] = \\tfrac{1}{2}\\ln\\dfrac{2a}{1+a}$.',
            'שטח: $\\;\\tfrac{1}{2}\\cdot\\tfrac{\\ln a}{2} - \\tfrac{1}{2}\\ln\\dfrac{2a}{1+a} = \\tfrac{\\ln a}{4} - \\tfrac{1}{2}\\ln 2 - \\tfrac{\\ln a}{2} + \\tfrac{1}{2}\\ln(1+a)$',
            '$= \\tfrac{1}{2}\\ln(1+a) - \\tfrac{\\ln a}{4} - \\tfrac{\\ln 2}{2} = \\tfrac{1}{4}\\ln\\dfrac{(1+a)^2}{4a}$.',
          ],
          final_answer: 'השטח: $\\;\\dfrac{1}{4}\\ln\\dfrac{(1+a)^2}{4a}$.',
        },
      },
    ],
    solutionSource: 'authored',
  },

  // ===========================================================================
  // Q5 — חקירת $f = \ln\frac{x^2-1}{(x+2)(x-1)}$ ו-$g = \ln f$
  // ===========================================================================
  {
    id: 'b2021s582a-q5',
    year: 2021,
    season: 'summer',
    moed: 'a',
    paper: '582',
    questionNumber: 5,
    topic: 'פונקציית ln',
    totalPoints: 33,
    context:
      '(קיץ תשפ"א, מועד א\') נתונה הפונקציה $\\;f(x) = \\ln\\dfrac{x^2 - 1}{(x+2)(x-1)}$.',
    parts: [
      {
        label: 'א',
        prompt: 'מצא את תחום ההגדרה של $f(x)$.',
        answer_type: 'expression',
        hints: [
          'פירוק: $x^2 - 1 = (x-1)(x+1)$. הפונקציה הופכת ל-$\\;\\dfrac{(x-1)(x+1)}{(x+2)(x-1)} = \\dfrac{x+1}{x+2}\\;$ (עבור $x \\ne 1$).',
          'תנאים: $x \\ne 1$ (התאפסות במכנה המקורי), $x \\ne -2$ (התאפסות במכנה אחרי הצמצום), ו-$\\dfrac{x+1}{x+2} > 0$.',
        ],
        solution: {
          steps: [
            'פירוק: $\\;\\dfrac{x^2-1}{(x+2)(x-1)} = \\dfrac{(x-1)(x+1)}{(x+2)(x-1)} = \\dfrac{x+1}{x+2}$, חוקי כאשר $x\\ne 1$.',
            'תנאים: $x \\ne 1$, $x \\ne -2$, ו-$\\dfrac{x+1}{x+2} > 0$.',
            '$\\dfrac{x+1}{x+2} > 0 \\iff$ שני המשתנים באותו סימן $\\iff x > -1$ או $x < -2$.',
            'שילוב עם $x \\ne 1$: $\\;(-\\infty,-2)\\cup(-1,1)\\cup(1,\\infty)$.',
          ],
          final_answer:
            'תחום ההגדרה: $\\;(-\\infty,-2)\\cup(-1,1)\\cup(1,\\infty)$.',
        },
      },
      {
        label: 'ב1',
        prompt: 'מצא את האסימפטוטות של $f$ המאונכות לצירים (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          'אנכיות: בקצוות תחום ההגדרה — בדוק את הגבול של $\\dfrac{x+1}{x+2}$ ב-$x\\to -2^-$ וב-$x\\to -1^+$.',
          'אופקיות: $\\dfrac{x+1}{x+2}\\to 1$ כש-$x\\to\\pm\\infty$, אז $\\ln\\to 0$.',
        ],
        solution: {
          steps: [
            '$x\\to -2^-$: $\\dfrac{x+1}{x+2}\\to\\dfrac{-1}{0^-}=+\\infty$, $\\;f\\to +\\infty$. אסימפטוטה $\\;x=-2$.',
            '$x\\to -1^+$: $\\dfrac{x+1}{x+2}\\to\\dfrac{0^+}{1}=0^+$, $\\;f\\to -\\infty$. אסימפטוטה $\\;x=-1$.',
            'ב-$x=1$ הפונקציה אינה מוגדרת, אך $\\dfrac{x+1}{x+2}\\to\\tfrac{2}{3}$ סופי — חור, לא אסימפטוטה.',
            '$x\\to\\pm\\infty$: $\\dfrac{x+1}{x+2}\\to 1$, $\\;f\\to 0$. אסימפטוטה אופקית $\\;y=0$.',
          ],
          final_answer:
            'אנכיות: $x=-2$ ו-$x=-1$. אופקית: $y=0$.',
        },
      },
      {
        label: 'ב2',
        prompt: 'מצא את שיעורי נקודות החיתוך של $f$ עם הצירים (אם יש כאלה).',
        answer_type: 'expression',
        hints: [
          'ציר $y$: הצב $x=0$, ערך $\\ln(1/2) = -\\ln 2$.',
          'ציר $x$: $\\ln(\\cdot) = 0 \\iff (\\cdot) = 1$. פתור $\\dfrac{x+1}{x+2}=1$.',
        ],
        solution: {
          steps: [
            'ציר $y$ ($x=0$): $\\;f(0) = \\ln\\tfrac{1}{2} = -\\ln 2$. נקודה $(0,\\,-\\ln 2)$.',
            'ציר $x$: $\\;\\dfrac{x+1}{x+2}=1 \\Rightarrow x+1=x+2$ — אין פתרון. אין חיתוך עם ציר $x$.',
          ],
          final_answer: 'חיתוך עם ציר $y$ ב-$(0,\\,-\\ln 2)$. אין חיתוך עם ציר $x$.',
        },
      },
      {
        label: 'ב3',
        prompt: 'סרטט סקיצה של גרף $f(x)$.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-6, 6],
            yRange: [-3, 3],
            curves: [
              {
                fn: (x) => {
                  if (x === 1 || x === -2) return NaN;
                  const r = (x + 1) / (x + 2);
                  return r > 0 ? Math.log(r) : NaN;
                },
                domain: [-6, 6],
              },
            ],
            hAsymptotes: [{ y: 0, label: 'y=0' }],
            vAsymptotes: [
              { x: -2, label: 'x=-2' },
              { x: -1, label: 'x=-1' },
            ],
            markedPoints: [{ x: 0, y: -Math.log(2), label: '(0,-ln2)' }],
            caption: 'שני ענפים: שמאלי ($x<-2$) עולה מ-$0$ ל-$+\\infty$; ימני ($x>-1$) עולה מ-$-\\infty$ ל-$0$, עובר $(0,-\\ln 2)$, עם חור ב-$x=1$.',
          },
        ],
        hints: ['חשב $f\\,\'(x) = \\dfrac{1}{(x+1)(x+2)}$ — חיובית בכל תחום ההגדרה, כלומר $f$ עולה ממש בכל ענף.'],
        solution: {
          steps: [
            '$f\\,\'(x) = \\dfrac{1}{x+1} - \\dfrac{1}{x+2} = \\dfrac{1}{(x+1)(x+2)}$. בתחום ההגדרה $(x+1)(x+2)>0$, אז $f\\,\'>0$ — עלייה ממש בכל ענף.',
            'ענף שמאלי $(-\\infty,-2)$: עולה מ-$0$ (ב-$-\\infty$) ל-$+\\infty$ (ב-$-2^-$).',
            'ענף ימני $(-1,1)\\cup(1,\\infty)$: עולה מ-$-\\infty$ (ב-$-1^+$) ל-$0$ (ב-$+\\infty$); עובר את ציר $y$ ב-$(0,-\\ln 2)$. חור ב-$x=1$ (ערך גבול $\\ln\\tfrac{2}{3}$).',
          ],
          final_answer:
            'שני ענפים עולים — ראה תרשים: שמאלי חיובי, ימני שלילי עם חור ב-$x=1$.',
        },
      },
      {
        label: 'ג1',
        prompt: 'נתונה $\\;g(x) = \\ln(f(x))$. מצא את תחום ההגדרה של $g$.',
        answer_type: 'expression',
        hints: [
          '$\\ln$ דורש $f(x) > 0$. ב-ב3 רואים ש-$f>0$ רק על הענף השמאלי.',
          'אלגברית: $f>0 \\iff \\dfrac{x+1}{x+2}>1$ $\\iff$ $x+1 < x+2$ ו-$(x+2)<0$ $\\iff x<-2$.',
        ],
        solution: {
          steps: [
            '$g$ דורשת $f>0$, כלומר $\\ln\\dfrac{x+1}{x+2}>0 \\iff \\dfrac{x+1}{x+2}>1$.',
            'לאחר הפחתה: $\\dfrac{x+1}{x+2}-1 = \\dfrac{-1}{x+2} > 0 \\iff x+2 < 0 \\iff x < -2$.',
          ],
          final_answer: 'תחום ההגדרה של $g$: $\\;(-\\infty,\\,-2)$.',
        },
      },
      {
        label: 'ג2',
        prompt: 'מצא את האסימפטוטות של $g$ המאונכות לצירים.',
        answer_type: 'expression',
        hints: [
          'בקצוות התחום בדוק התנהגות: $x\\to -2^-$: $f\\to+\\infty$, $g=\\ln f\\to+\\infty$; $x\\to -\\infty$: $f\\to 0^+$, $g\\to -\\infty$.',
        ],
        solution: {
          steps: [
            '$x\\to -2^-$: $f\\to+\\infty$, $g=\\ln f\\to+\\infty$. אסימפטוטה אנכית $\\;x=-2$.',
            '$x\\to-\\infty$: $f\\to 0^+$, $g\\to-\\infty$. אין אסימפטוטה אופקית (הגבול אינסופי).',
          ],
          final_answer: 'אסימפטוטה אנכית יחידה: $\\;x=-2$. אין אסימפטוטה אופקית.',
        },
      },
      {
        label: 'ג3',
        prompt: 'סרטט סקיצה של גרף $g(x)$ ונמק את קביעותיך.',
        answer_type: 'text',
        diagrams: [
          {
            type: 'functionGraph',
            xRange: [-8, -2.05],
            yRange: [-4, 4],
            curves: [
              {
                fn: (x) => {
                  if (x >= -2) return NaN;
                  const r = (x + 1) / (x + 2);
                  return r > 1 ? Math.log(Math.log(r)) : NaN;
                },
                domain: [-8, -2.05],
              },
            ],
            vAsymptotes: [{ x: -2, label: 'x=-2' }],
            caption: 'הגרף של $g=\\ln f$ על הענף השמאלי: עולה ממש מ-$-\\infty$ (ב-$-\\infty$) ל-$+\\infty$ (ב-$-2^-$).',
          },
        ],
        hints: [
          '$g\\,\'(x) = \\dfrac{f\\,\'(x)}{f(x)}$. בתחום $x<-2$: $f>0$ ו-$f\\,\'>0$, אז $g\\,\'>0$ — עלייה ממש.',
        ],
        solution: {
          steps: [
            'תחום $(-\\infty,-2)$, מונוטונית עולה (כי $g\\,\'=f\\,\'/f$ עם שני סוגרים חיוביים).',
            'גבולות: $g\\to-\\infty$ ב-$-\\infty$, $\\;g\\to+\\infty$ ב-$-2^-$.',
            'חיתוך עם ציר $x$: $g(x)=0 \\iff f(x)=1 \\iff \\dfrac{x+1}{x+2}=e \\iff x = \\dfrac{1-2e}{e-1} \\approx -2.58$.',
          ],
          final_answer:
            'גרף עולה ממש על $(-\\infty,-2)$, מ-$-\\infty$ ל-$+\\infty$, חוצה את ציר $x$ ב-$x = \\dfrac{1-2e}{e-1}$.',
        },
      },
      {
        label: 'ד',
        prompt:
          'בעבור כל $x$ המקיים $\\;0 < f(x) < 1$, קבע אם המכפלה $\\;f(x)\\cdot g(x)\\;$ חיובית, שלילית, או יכולה להיות גם וגם. נמק.',
        answer_type: 'text',
        hints: [
          '$0 < f < 1$ קובע סימן: $f$ חיובי. $g = \\ln f$ — סימן של $\\ln$ במספר בין $0$ ל-$1$?',
          'נצא מ-$\\ln$: $\\ln(0,1) < 0$. אז $g < 0$. ומכפלה $f\\cdot g$?',
        ],
        solution: {
          steps: [
            'בתחום $0 < f < 1$: כל ערכי $f$ חיוביים אך קטנים מ-$1$.',
            'אז $g(x) = \\ln(f(x)) < 0$ (לוגריתם של מספר חיובי קטן מ-$1$ הוא שלילי).',
            'מכפלה: $f \\cdot g = (+)\\cdot(-) < 0$. שלילית בוודאות.',
          ],
          final_answer:
            'המכפלה $f(x)\\cdot g(x)$ **שלילית** לכל $x$ עם $0<f(x)<1$ (כי $f>0$ ו-$g=\\ln f<0$).',
        },
      },
    ],
    solutionSource: 'authored',
  },
];
