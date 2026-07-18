/**
 * 582.ts — STATIC concept-quiz bank for questionnaire 582.
 *
 * The "בוחן מושגים מהיר" serves these pre-authored theory/rules questions
 * directly — NO API call, NO Supabase. Every `correct` index was verified by
 * re-deriving the answer by hand. Keep Hebrew OUTSIDE $...$ (KaTeX has no bidi).
 *
 * Shape matches what app/quiz/page.tsx renders (question / answers / correct /
 * explanation{why_correct, why_wrong, concept, remember}).
 */

export type ConceptQuestion = {
  id: string;
  difficulty: 'easy' | 'mid' | 'hard';
  question: string;
  answers: string[]; // exactly 4
  correct: number; // 0-3
  explanation: {
    why_correct: string;
    why_wrong: string;
    concept: string;
    remember: string;
  };
};

export const CONCEPT_582: Record<string, ConceptQuestion[]> = {
  'פונקציה מעריכית': [
    {
      id: 'cq-exp-1',
      difficulty: 'easy',
      question: 'מהי הנגזרת של $f(x)=e^{3x}$?',
      answers: ['$e^{3x}$', '$3e^{3x}$', '$3xe^{3x-1}$', '$\\frac{1}{3}e^{3x}$'],
      correct: 1,
      explanation: {
        why_correct: 'נגזרת של $e^{g(x)}$ היא $g\'(x)\\,e^{g(x)}$; כאן $g(x)=3x$ ולכן $g\'(x)=3$.',
        why_wrong: 'טעות נפוצה: לשכוח את הגזירה הפנימית ולהשאיר $e^{3x}$.',
        concept: 'כלל השרשרת למעריכית: $\\left(e^{g(x)}\\right)\'=g\'(x)e^{g(x)}$.',
        remember: 'מכפילים במקדם של $x$ שנמצא במעריך.',
      },
    },
    {
      id: 'cq-exp-2',
      difficulty: 'easy',
      question: 'מהי האסימפטוטה האופקית של $f(x)=e^{-x}+2$ כאשר $x\\to\\infty$?',
      answers: ['$y=0$', '$y=2$', '$y=-2$', 'אין אסימפטוטה'],
      correct: 1,
      explanation: {
        why_correct: 'כאשר $x\\to\\infty$ מתקיים $e^{-x}\\to0$, ולכן $f(x)\\to2$.',
        why_wrong: 'האסימפטוטה של $e^{-x}$ לבדה היא $y=0$, אך ההזזה $+2$ מרימה אותה ל-$y=2$.',
        concept: 'הזזה אנכית $+c$ מזיזה גם את האסימפטוטה האופקית ב-$c$.',
        remember: 'בודקים לאן שואף הביטוי המעריכי, ואז מוסיפים את הקבוע.',
      },
    },
    {
      id: 'cq-exp-3',
      difficulty: 'easy',
      question: 'מהו תחום ההגדרה של $f(x)=e^{x}$?',
      answers: ['$x>0$', '$x\\neq0$', 'כל $x$ ממשי', '$x\\geq0$'],
      correct: 2,
      explanation: {
        why_correct: 'הפונקציה המעריכית מוגדרת לכל מספר ממשי — אין הגבלה על המעריך.',
        why_wrong: 'המגבלות $x>0$ שייכות ל-$\\ln$, לא למעריכית.',
        concept: 'תחום ההגדרה של $e^{x}$ הוא כל $\\mathbb{R}$; הטווח הוא $y>0$.',
        remember: 'מעריכית — כל $x$; לוגריתם — רק $x>0$.',
      },
    },
    {
      id: 'cq-exp-4',
      difficulty: 'mid',
      question: 'מהו $\\int e^{2x}\\,dx$?',
      answers: ['$2e^{2x}+C$', '$\\frac{1}{2}e^{2x}+C$', '$e^{2x}+C$', '$\\frac{1}{2}e^{x}+C$'],
      correct: 1,
      explanation: {
        why_correct: 'אינטגרל של $e^{ax}$ הוא $\\frac{1}{a}e^{ax}+C$; כאן $a=2$.',
        why_wrong: 'כפל ב-2 (במקום חלוקה) הוא ההפך מהנדרש באינטגרציה.',
        concept: 'באינטגרל מחלקים במקדם הפנימי; בנגזרת מכפילים בו.',
        remember: 'אינטגרל של $e^{2x}$ → מחלקים ב-2.',
      },
    },
    {
      id: 'cq-exp-5',
      difficulty: 'easy',
      question: 'מהו הפתרון של המשוואה $e^{x}=1$?',
      answers: ['$x=1$', '$x=0$', '$x=e$', 'אין פתרון'],
      correct: 1,
      explanation: {
        why_correct: 'כל מספר בחזקת 0 שווה 1, כלומר $e^{0}=1$.',
        why_wrong: '$e^{1}=e\\approx2.72$, לא 1.',
        concept: 'כדי לפתור $e^{x}=a$ לוקחים $\\ln$: $x=\\ln a$, וכאן $\\ln1=0$.',
        remember: '$e^{0}=1$ תמיד.',
      },
    },
    {
      id: 'cq-exp-6',
      difficulty: 'mid',
      question: 'מה נכון תמיד לגבי $f(x)=e^{x}$?',
      answers: [
        'חיובית לכל $x$ ועולה בכל תחום ההגדרה',
        'יכולה לקבל ערכים שליליים',
        'יורדת עבור $x>0$',
        'מתאפסת ב-$x=0$',
      ],
      correct: 0,
      explanation: {
        why_correct: '$e^{x}>0$ לכל $x$, ונגזרתה $e^{x}>0$ ולכן היא עולה ממש.',
        why_wrong: 'הפונקציה לעולם אינה שלילית ואינה מתאפסת — הטווח הוא $y>0$.',
        concept: 'המעריכית הבסיסית חיובית, עולה, וללא אפסים.',
        remember: '$e^{x}$ — תמיד מעל ציר ה-$x$ ותמיד עולה.',
      },
    },
  ],

  'גדילה ודעיכה': [
    {
      id: 'cq-gd-1',
      difficulty: 'easy',
      question: 'במודל $N(t)=N_0 e^{kt}$, אם $k<0$ מדובר בתהליך של:',
      answers: ['גדילה', 'דעיכה', 'ערך קבוע', 'תנודה מחזורית'],
      correct: 1,
      explanation: {
        why_correct: 'קבוע שלילי במעריך גורם לכמות לקטון עם הזמן — דעיכה.',
        why_wrong: '$k>0$ נותן גדילה; $k=0$ נותן ערך קבוע.',
        concept: 'סימן $k$ קובע: חיובי = גדילה, שלילי = דעיכה.',
        remember: 'מינוס במעריך = יורד עם הזמן.',
      },
    },
    {
      id: 'cq-gd-2',
      difficulty: 'easy',
      question: 'במודל $N(t)=N_0 e^{kt}$, מה מייצג $N_0$?',
      answers: ['הקצב', 'הכמות ההתחלתית (ב-$t=0$)', 'זמן מחצית החיים', 'הכמות הסופית'],
      correct: 1,
      explanation: {
        why_correct: 'ב-$t=0$ מתקיים $N(0)=N_0 e^{0}=N_0$ — הכמות בהתחלה.',
        why_wrong: 'הקצב נקבע ע"י $k$, לא ע"י $N_0$.',
        concept: 'מציבים $t=0$ כדי לזהות את הערך ההתחלתי.',
        remember: '$N_0$ = מה שהיה בהתחלה.',
      },
    },
    {
      id: 'cq-gd-3',
      difficulty: 'mid',
      question: 'בדעיכה מעריכית, זמן מחצית החיים תלוי ב:',
      answers: ['בכמות ההתחלתית $N_0$', 'בקבוע הדעיכה $k$ בלבד', 'בזמן $t$', 'בכמות הסופית'],
      correct: 1,
      explanation: {
        why_correct: 'מחצית החיים נגזרת מ-$\\frac{1}{2}=e^{k\\cdot t_{1/2}}$, שתלוי רק ב-$k$.',
        why_wrong: '$N_0$ מצטמצם מהמשוואה ולכן אינו משפיע על זמן מחצית החיים.',
        concept: 'זמן מחצית החיים הוא תכונה של קצב הדעיכה, לא של הכמות.',
        remember: 'מחצית חיים תלויה ב-$k$, לא בכמות ההתחלתית.',
      },
    },
    {
      id: 'cq-gd-4',
      difficulty: 'mid',
      question: 'קרן $P$ מושקעת בריבית שנתית רציפה $r$. מה שווי ההשקעה אחרי $t$ שנים?',
      answers: ['$P(1+r)^{t}$', '$Pe^{rt}$', '$Prt$', '$P+rt$'],
      correct: 1,
      explanation: {
        why_correct: 'ריבית רציפה מתוארת במודל מעריכי $Pe^{rt}$.',
        why_wrong: '$P(1+r)^{t}$ מתאים לריבית דריבית בדידה (שנתית), לא רציפה.',
        concept: 'ריבית רציפה = גדילה מעריכית עם קצב $r$.',
        remember: 'רציף → $e^{rt}$; פעם בשנה → $(1+r)^{t}$.',
      },
    },
    {
      id: 'cq-gd-5',
      difficulty: 'mid',
      question: 'אוכלוסייה מכפילה את עצמה כל 3 שנים. פי כמה היא גדלה אחרי 6 שנים?',
      answers: ['פי 2', 'פי 4', 'פי 6', 'פי 8'],
      correct: 1,
      explanation: {
        why_correct: '6 שנים = שתי תקופות הכפלה, ולכן $2\\times2=4$.',
        why_wrong: 'פי 6 מבלבל בין "פעמיים" לבין "כפול 3 שנים".',
        concept: 'כל תקופת הכפלה מכפילה שוב — גדילה מעריכית ולא לינארית.',
        remember: 'שתי הכפלות = פי $2^2=4$.',
      },
    },
    {
      id: 'cq-gd-6',
      difficulty: 'easy',
      question: 'בדעיכה מעריכית, הכמות עם הזמן:',
      answers: ['מגיעה בדיוק ל-0', 'שואפת ל-0 אך לא מגיעה אליו', 'נעשית שלילית', 'נשארת קבועה'],
      correct: 1,
      explanation: {
        why_correct: '$e^{kt}$ עם $k<0$ שואף ל-0 אך תמיד חיובי — אסימפטוטה $y=0$.',
        why_wrong: 'הפונקציה המעריכית לעולם אינה מתאפסת או שלילית.',
        concept: 'לדעיכה מעריכית יש אסימפטוטה אופקית $y=0$.',
        remember: 'מתקרב ל-0, לא נוגע.',
      },
    },
  ],

  'פונקציית ln': [
    {
      id: 'cq-ln-1',
      difficulty: 'easy',
      question: 'מהו תחום ההגדרה של $f(x)=\\ln(x)$?',
      answers: ['$x\\geq0$', '$x>0$', '$x\\neq0$', 'כל $x$ ממשי'],
      correct: 1,
      explanation: {
        why_correct: 'לוגריתם מוגדר רק עבור מספרים חיוביים ממש.',
        why_wrong: '$x=0$ אינו בתחום — $\\ln0$ אינו מוגדר.',
        concept: 'תחום $\\ln$: הביטוי שבתוך הלוג חייב להיות $>0$.',
        remember: 'מתחת ללוג — תמיד גדול מ-0.',
      },
    },
    {
      id: 'cq-ln-2',
      difficulty: 'easy',
      question: 'מהי הנגזרת של $f(x)=\\ln(x)$?',
      answers: ['$\\frac{1}{x}$', '$\\ln x$', '$x$', '$\\frac{1}{\\ln x}$'],
      correct: 0,
      explanation: {
        why_correct: 'נגזרת של $\\ln x$ היא $\\frac{1}{x}$ (לפי הגדרת הנגזרת).',
        why_wrong: '$\\frac{1}{\\ln x}$ מבלבל בין הפונקציה לנגזרתה.',
        concept: 'לפי כלל השרשרת: $\\left(\\ln g(x)\\right)\'=\\frac{g\'(x)}{g(x)}$.',
        remember: 'נגזרת $\\ln x$ = $\\frac{1}{x}$.',
      },
    },
    {
      id: 'cq-ln-3',
      difficulty: 'easy',
      question: 'כמה שווה $\\ln(1)$?',
      answers: ['$1$', '$0$', '$e$', 'לא מוגדר'],
      correct: 1,
      explanation: {
        why_correct: '$\\ln1=0$ כי $e^{0}=1$.',
        why_wrong: '$\\ln e=1$, לא $\\ln1$.',
        concept: 'לוגריתם שואל "לאיזו חזקה נעלה את $e$"; כדי לקבל 1 צריך חזקה 0.',
        remember: '$\\ln1=0$ תמיד.',
      },
    },
    {
      id: 'cq-ln-4',
      difficulty: 'mid',
      question: 'מהי האסימפטוטה האנכית של $f(x)=\\ln(x)$?',
      answers: ['$x=0$', '$y=0$', '$x=1$', 'אין אסימפטוטה'],
      correct: 0,
      explanation: {
        why_correct: 'כאשר $x\\to0^{+}$ מתקיים $\\ln x\\to-\\infty$ — אסימפטוטה אנכית $x=0$.',
        why_wrong: '$y=0$ היא אסימפטוטה אופקית, שאינה קיימת כאן.',
        concept: 'הלוג "צולל" ל-$-\\infty$ בקצה השמאלי של תחום ההגדרה.',
        remember: '$\\ln$ שובר בציר ה-$y$ ($x=0$).',
      },
    },
    {
      id: 'cq-ln-5',
      difficulty: 'mid',
      question: 'מהו $\\int \\frac{1}{x}\\,dx$?',
      answers: ['$\\ln|x|+C$', '$-\\frac{1}{x^2}+C$', '$\\frac{x^2}{2}+C$', '$\\ln x + C$'],
      correct: 0,
      explanation: {
        why_correct: 'הקדומה של $\\frac{1}{x}$ היא $\\ln|x|+C$ — עם ערך מוחלט.',
        why_wrong: '$\\ln x+C$ (בלי ערך מוחלט) חסר עבור $x<0$.',
        concept: 'הערך המוחלט מאפשר להגדיר את הקדומה גם בתחום השלילי.',
        remember: 'אינטגרל של $\\frac{1}{x}$ → $\\ln|x|$ (עם קווים).',
      },
    },
    {
      id: 'cq-ln-6',
      difficulty: 'easy',
      question: 'לפי חוקי הלוגריתם, כמה שווה $\\ln(ab)$?',
      answers: ['$\\ln a\\cdot\\ln b$', '$\\ln a+\\ln b$', '$\\ln(a+b)$', '$\\frac{\\ln a}{\\ln b}$'],
      correct: 1,
      explanation: {
        why_correct: 'חוק הלוג של מכפלה: $\\ln(ab)=\\ln a+\\ln b$.',
        why_wrong: 'לוג של מכפלה הופך לחיבור, לא למכפלת לוגים.',
        concept: 'מכפלה בתוך לוג → סכום לוגים; מנה → הפרש.',
        remember: 'לוג הופך כפל לחיבור.',
      },
    },
  ],

  'גאומטריה אנליטית': [
    {
      id: 'cq-ag-1',
      difficulty: 'easy',
      question: 'מהו שיפוע הישר $y=3x-2$?',
      answers: ['$-2$', '$3$', '$\\frac{1}{3}$', '$1$'],
      correct: 1,
      explanation: {
        why_correct: 'בצורה $y=mx+n$ השיפוע הוא המקדם $m$ של $x$, כלומר 3.',
        why_wrong: '$-2$ הוא החיתוך עם ציר ה-$y$, לא השיפוע.',
        concept: 'בישר $y=mx+n$: $m$ = שיפוע, $n$ = חיתוך עם $y$.',
        remember: 'השיפוע = המקדם שליד $x$.',
      },
    },
    {
      id: 'cq-ag-2',
      difficulty: 'easy',
      question: 'שני ישרים מאונכים זה לזה אם מכפלת השיפועים שלהם שווה:',
      answers: ['$1$', '$-1$', '$0$', 'שיפועים שווים'],
      correct: 1,
      explanation: {
        why_correct: 'תנאי הניצבות הוא $m_1\\cdot m_2=-1$.',
        why_wrong: 'שיפועים שווים = ישרים מקבילים, לא מאונכים.',
        concept: 'שיפוע של ישר מאונך הוא הנגדי-ההופכי: $-\\frac{1}{m}$.',
        remember: 'מאונכים → מכפלת שיפועים $=-1$.',
      },
    },
    {
      id: 'cq-ag-3',
      difficulty: 'easy',
      question: 'מהו מרכז המעגל $(x-2)^2+(y+3)^2=16$?',
      answers: ['$(2,-3)$', '$(-2,3)$', '$(2,3)$', '$(-2,-3)$'],
      correct: 0,
      explanation: {
        why_correct: 'בצורה $(x-a)^2+(y-b)^2=r^2$ המרכז הוא $(a,b)$; כאן $(2,-3)$.',
        why_wrong: 'הסימנים במשוואה הפוכים לסימני המרכז — $(y+3)$ נותן $b=-3$.',
        concept: 'המרכז נלקח עם סימן הפוך לזה שבסוגריים.',
        remember: '$(y+3)$ → $b=-3$ (הופכים סימן).',
      },
    },
    {
      id: 'cq-ag-4',
      difficulty: 'easy',
      question: 'מהו רדיוס המעגל $(x-2)^2+(y+3)^2=16$?',
      answers: ['$16$', '$4$', '$8$', '$2$'],
      correct: 1,
      explanation: {
        why_correct: 'האגף הימני הוא $r^2=16$, ולכן $r=4$.',
        why_wrong: '$16$ הוא $r^2$, לא הרדיוס עצמו.',
        concept: 'במשוואת המעגל האגף הימני שווה לרדיוס בריבוע.',
        remember: 'מוציאים שורש: $r=\\sqrt{16}=4$.',
      },
    },
    {
      id: 'cq-ag-5',
      difficulty: 'mid',
      question: 'משיק למעגל מאונך ל:',
      answers: ['המיתר', 'הרדיוס בנקודת ההשקה', 'הקוטר בכל נקודה', 'צירי הצירים'],
      correct: 1,
      explanation: {
        why_correct: 'משיק תמיד מאונך לרדיוס המוביל לנקודת ההשקה.',
        why_wrong: 'משיק אינו מאונך למיתר כללי או לצירים.',
        concept: 'תכונת המשיק היא הבסיס למציאת משוואת משיק דרך שיפוע הרדיוס.',
        remember: 'משיק ⟂ רדיוס בנקודת ההשקה.',
      },
    },
    {
      id: 'cq-ag-6',
      difficulty: 'easy',
      question: 'מהו המרחק בין הנקודות $(0,0)$ ו-$(3,4)$?',
      answers: ['$5$', '$7$', '$25$', '$\\sqrt{7}$'],
      correct: 0,
      explanation: {
        why_correct: 'לפי נוסחת המרחק $\\sqrt{3^2+4^2}=\\sqrt{25}=5$.',
        why_wrong: '$7$ מחבר את הקואורדינטות במקום להשתמש בפיתגורס.',
        concept: 'מרחק בין נקודות = $\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$.',
        remember: 'משולש 3-4-5 מוכר.',
      },
    },
  ],

  'וקטורים במרחב': [
    {
      id: 'cq-vec-1',
      difficulty: 'easy',
      question: 'מהי המכפלה הסקלרית של שני וקטורים ניצבים?',
      answers: ['$1$', '$0$', 'ערך שלילי', '$|\\vec{u}|\\,|\\vec{v}|$'],
      correct: 1,
      explanation: {
        why_correct: 'ניצבות פירושה $\\cos90^\\circ=0$, ולכן המכפלה הסקלרית $=0$.',
        why_wrong: '$|\\vec{u}||\\vec{v}|$ מתקבל רק כאשר הוקטורים מקבילים ($\\cos0^\\circ=1$).',
        concept: '$\\vec{u}\\cdot\\vec{v}=|\\vec{u}||\\vec{v}|\\cos\\theta$.',
        remember: 'ניצבים → מכפלה סקלרית 0.',
      },
    },
    {
      id: 'cq-vec-2',
      difficulty: 'easy',
      question: 'כמה שווה $\\vec{u}\\cdot\\vec{u}$?',
      answers: ['$|\\vec{u}|$', '$|\\vec{u}|^2$', '$0$', '$1$'],
      correct: 1,
      explanation: {
        why_correct: 'מכפלה סקלרית של וקטור בעצמו נותנת את ריבוע האורך.',
        why_wrong: '$|\\vec{u}|$ (בלי ריבוע) חסר — צריך להעלות בריבוע.',
        concept: '$\\vec{u}\\cdot\\vec{u}=|\\vec{u}|^2\\cos0^\\circ=|\\vec{u}|^2$.',
        remember: 'וקטור על עצמו = אורך בריבוע.',
      },
    },
    {
      id: 'cq-vec-3',
      difficulty: 'mid',
      question: 'מהו אורך הוקטור $(2,3,6)$?',
      answers: ['$7$', '$11$', '$\\sqrt{11}$', '$41$'],
      correct: 0,
      explanation: {
        why_correct: '$\\sqrt{2^2+3^2+6^2}=\\sqrt{4+9+36}=\\sqrt{49}=7$.',
        why_wrong: '$11$ מסכם את הרכיבים במקום את ריבועיהם.',
        concept: 'אורך וקטור במרחב = שורש סכום ריבועי הרכיבים.',
        remember: 'מעלים כל רכיב בריבוע, מסכמים, שורש.',
      },
    },
    {
      id: 'cq-vec-4',
      difficulty: 'mid',
      question: 'הוקטור $\\vec{u}\\times\\vec{v}$ (מכפלה וקטורית) מאונך ל:',
      answers: ['רק ל-$\\vec{u}$', 'לשני הוקטורים $\\vec{u}$ ו-$\\vec{v}$', 'למישור אחר לגמרי', 'לאף וקטור'],
      correct: 1,
      explanation: {
        why_correct: 'המכפלה הוקטורית מאונכת למישור הנפרש ע"י שני הוקטורים.',
        why_wrong: 'היא מאונכת לשניהם יחד, לא רק לאחד.',
        concept: 'לכן משתמשים בה למציאת נורמל למישור.',
        remember: '$\\vec{u}\\times\\vec{v}$ ⟂ לשני הוקטורים.',
      },
    },
    {
      id: 'cq-vec-5',
      difficulty: 'mid',
      question: 'שני וקטורים מקבילים אם המכפלה הוקטורית שלהם היא:',
      answers: ['וקטור האפס', 'שווה ל-1', 'מאונכת אליהם', 'ערך שלילי'],
      correct: 0,
      explanation: {
        why_correct: 'עבור וקטורים מקבילים $\\sin0^\\circ=0$, ולכן המכפלה הוקטורית היא וקטור האפס.',
        why_wrong: 'מכפלה וקטורית מחזירה וקטור, לא מספר כמו 1.',
        concept: '$|\\vec{u}\\times\\vec{v}|=|\\vec{u}||\\vec{v}|\\sin\\theta$.',
        remember: 'מקבילים → מכפלה וקטורית אפס.',
      },
    },
    {
      id: 'cq-vec-6',
      difficulty: 'easy',
      question: 'הזווית בין שני וקטורים מחושבת בעזרת:',
      answers: ['המכפלה הסקלרית', 'חיבור הוקטורים', 'אורך של אחד מהם בלבד', 'המכפלה הוקטורית בלבד'],
      correct: 0,
      explanation: {
        why_correct: 'מהנוסחה $\\cos\\theta=\\frac{\\vec{u}\\cdot\\vec{v}}{|\\vec{u}||\\vec{v}|}$ מחלצים את הזווית.',
        why_wrong: 'חיבור וקטורים נותן וקטור חדש, לא זווית.',
        concept: 'המכפלה הסקלרית קושרת בין הזווית לאורכים.',
        remember: 'זווית ← מכפלה סקלרית חלקי מכפלת האורכים.',
      },
    },
  ],

  'מספרים מרוכבים': [
    {
      id: 'cq-cx-1',
      difficulty: 'easy',
      question: 'כמה שווה $i^{2}$?',
      answers: ['$1$', '$-1$', '$i$', '$-i$'],
      correct: 1,
      explanation: {
        why_correct: 'לפי הגדרת היחידה המדומה, $i^{2}=-1$.',
        why_wrong: '$i^{2}=1$ הוא בדיוק החוק שהמרוכבים משנים.',
        concept: 'זו אבן היסוד של כל החשבון במרוכבים.',
        remember: '$i^{2}=-1$.',
      },
    },
    {
      id: 'cq-cx-2',
      difficulty: 'easy',
      question: 'מהו הצמוד של $z=3+4i$?',
      answers: ['$-3-4i$', '$3-4i$', '$4+3i$', '$-3+4i$'],
      correct: 1,
      explanation: {
        why_correct: 'הצמוד מחליף את סימן החלק המדומה: $3-4i$.',
        why_wrong: 'שינוי סימן החלק הממשי אינו הצמוד.',
        concept: 'הצמוד של $a+bi$ הוא $a-bi$.',
        remember: 'הופכים סימן רק לחלק המדומה.',
      },
    },
    {
      id: 'cq-cx-3',
      difficulty: 'easy',
      question: 'מהו הערך המוחלט $|3+4i|$?',
      answers: ['$5$', '$7$', '$25$', '$\\sqrt{7}$'],
      correct: 0,
      explanation: {
        why_correct: '$|a+bi|=\\sqrt{a^2+b^2}=\\sqrt{9+16}=5$.',
        why_wrong: '$25$ הוא הסכום $a^2+b^2$ לפני הוצאת השורש.',
        concept: 'הערך המוחלט = המרחק מהראשית במישור גאוס.',
        remember: '$|3+4i|=\\sqrt{3^2+4^2}=5$.',
      },
    },
    {
      id: 'cq-cx-4',
      difficulty: 'mid',
      question: 'לפי משפט דה-מואבר, כמה שווה $\\left(r\\,\\text{cis}\\,\\theta\\right)^{n}$?',
      answers: ['$r^{n}\\,\\text{cis}\\,(n\\theta)$', '$rn\\,\\text{cis}\\,\\theta$', '$r\\,\\text{cis}\\,(n\\theta)$', '$r^{n}\\,\\text{cis}\\,\\theta$'],
      correct: 0,
      explanation: {
        why_correct: 'מעלים את הגודל בחזקה ומכפילים את הזווית ב-$n$.',
        why_wrong: 'הזווית מוכפלת ב-$n$, לא נשארת $\\theta$.',
        concept: 'משפט דה-מואבר: $(r\\,\\text{cis}\\,\\theta)^n=r^n\\,\\text{cis}\\,(n\\theta)$.',
        remember: 'גודל בחזקה, זווית כפול $n$.',
      },
    },
    {
      id: 'cq-cx-5',
      difficulty: 'easy',
      question: 'כמה שווה $i^{4}$?',
      answers: ['$1$', '$-1$', '$i$', '$-i$'],
      correct: 0,
      explanation: {
        why_correct: '$i^{4}=(i^{2})^{2}=(-1)^{2}=1$.',
        why_wrong: '$-1$ הוא $i^{2}$, לא $i^{4}$.',
        concept: 'חזקות של $i$ מחזוריות במחזור 4: $i,-1,-i,1$.',
        remember: '$i^{4}=1$; כל חזקה שמתחלקת ב-4 נותנת 1.',
      },
    },
    {
      id: 'cq-cx-6',
      difficulty: 'easy',
      question: 'במישור גאוס, המספר $z=a+bi$ מיוצג בנקודה:',
      answers: ['$(a,b)$', '$(b,a)$', '$(a,-b)$', '$(0,a)$'],
      correct: 0,
      explanation: {
        why_correct: 'החלק הממשי הוא ציר ה-$x$ והחלק המדומה ציר ה-$y$, ולכן $(a,b)$.',
        why_wrong: '$(b,a)$ מחליף בין הצירים.',
        concept: 'מישור גאוס: ציר אופקי = ממשי, ציר אנכי = מדומה.',
        remember: '$a+bi\\to(a,b)$.',
      },
    },
  ],
};
