/**
 * bagrut-context.ts — central knowledge module about the Israeli
 * matriculation exam (בגרות). Every API route that talks to Claude pulls
 * its subject-specific context from here, so the model knows exactly
 * what kind of question to generate.
 *
 * Why centralize this? Earlier the prompts were short ("you are a math5
 * teacher, generate 5 questions about X") and the model had to guess the
 * exam style. Centralizing the structural knowledge (topic taxonomy,
 * question shapes, scoring norms, calculator policy, formula booklet)
 * lets every endpoint pull a richer system context without us duplicating
 * the same paragraph across files.
 */

export type Difficulty = 'easier' | 'normal' | 'harder';

export type SubjectContext = {
  /** Display name in Hebrew (or English for the English subject). */
  name: string;

  /** Language of generation: Hebrew except for English subject. */
  language: 'he' | 'en';

  /** One-paragraph identity prompt the model adopts as the teacher. */
  identity: string;

  /** Bullet points describing the exam structure (parts, time, scoring). */
  examStructure: string;

  /** What the student is allowed to use (calculator, formula sheet, etc). */
  toolsAllowed: string;

  /** Stylistic conventions a real Israeli bagrut question follows. */
  styleGuide: string;

  /** Topic taxonomy — these are the topic names the picker uses. */
  topics: string[];

  /** Per-topic context hint (optional) — short note about how the topic
   *  is examined in this subject specifically. */
  topicNotes?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Mathematics — 5 units (the heaviest, most graded track)
// ---------------------------------------------------------------------------
export const MATH5: SubjectContext = {
  name: 'מתמטיקה 5 יח׳',
  language: 'he',
  identity: `אתה מורה פרטי מנוסה למתמטיקה ברמת 5 יחידות לבגרות בישראל. אתה מכיר את תכנית הלימודים העדכנית של משרד החינוך, את הסגנון של שאלוני 581 ו-582, ואת הרמה האמיתית שמופיעה בבגרויות של השנים האחרונות.`,
  examStructure: `בגרות במתמטיקה 5 יח׳ מורכבת משני שאלונים:
- שאלון ראשון (581): אלגברה, סדרות, וקטורים במרחב, פולינומים, חשבון דיפרנציאלי ואינטגרלי לפונקציות פולינומיות/רציונליות.
- שאלון שני (582): חשבון דיפרנציאלי ואינטגרלי לפונקציות מעריכיות/לוגריתמיות/טריגונומטריות, גאומטריה אנליטית, הסתברות וסטטיסטיקה, מספרים מרוכבים.
התלמיד עונה על מספר שאלות בכל שאלון, וכל שאלה ניתנת לרוב 20-25 נקודות.`,
  toolsAllowed: `מותר מחשבון לא גרפי בלבד + דף נוסחאות רשמי. אסור מחשבון גרפי. שאלות שניתן לפתור רק במחשבון גרפי לא יופיעו בבגרות.`,
  styleGuide: `שאלה אמיתית בבגרות:
- מנוסחת בעברית מדויקת, ללא הקדמות מילוליות מיותרות.
- מציגה נתונים מספריים/אלגבריים ברורים — לא ביטויים עמומים.
- דורשת שילוב של 2-3 כלים (לדוגמה: גזירה + מציאת ערכי קיצון + חישוב שטח).
- מסקנה צריכה להיות מספר/ביטוי/הוכחה — לא רב-ברירה.
- ניסוח אופייני: "נתונה הפונקציה $f(x) = ...$. א. מצא את... ב. הוכח כי... ג. חשב..."
- כל סעיף שווה בערכו בערך לסעיף הבא (10-15 נקודות בתוך שאלה של 20-25).`,
  topics: [
    'אלגברה', 'פונקציות', 'מעריכית ולוגריתמית', 'טריגונומטריה',
    'חשבון דיפרנציאלי', 'חשבון אינטגרלי', 'סדרות',
    'גאומטריה אנליטית', 'וקטורים במרחב', 'מספרים מרוכבים',
    'הסתברות', 'סטטיסטיקה',
  ],
  topicNotes: {
    'אלגברה': 'משוואות ריבועיות, אי-שוויונים, משוואות מערכת, פרמטרים, רדיקלים. שאלות בגרות אופייניות כוללות פרמטר $m$ ודרישה למצוא תחום ערכי הפרמטר.',
    'פונקציות': 'חקירת פונקציה מלאה: תחום הגדרה, נקודות חיתוך עם הצירים, אסימפטוטות, נקודות קיצון ופיתול, תחומי עלייה/ירידה. כולל פונקציות מעריכיות, לוגריתמיות וטריגונומטריות.',
    'חשבון דיפרנציאלי': 'נגזרות לפי הגדרה, כללי גזירה (מכפלה, מנה, שרשרת), חקירה לפי הנגזרת, בעיות קיצון יישומיות.',
    'חשבון אינטגרלי': 'אינטגרל לא מסוים (כולל הצבה), אינטגרל מסוים, חישוב שטחים בין גרפים, נפח סיבוב סביב צירים.',
    'גאומטריה אנליטית': 'משוואת ישר, מעגל, מרחק נקודה מישר, חיתוכים, משיק למעגל. כולל לרוב הוכחות גאומטריות.',
    'וקטורים במרחב': 'מכפלה סקלרית ווקטורית, משוואת ישר במרחב, משוואת מישור, מרחקים וזוויות.',
    'מספרים מרוכבים': 'הצגה אלגברית/קוטבית/אקספוננציאלית, נוסחת דה-מואבר, שורשי יחידה, גאומטריה במישור מרוכב.',
    'הסתברות': 'הסתברות מותנית, נוסחת בייס, התפלגות בינומית/ברנולי, תוחלת ושונות.',
    'סטטיסטיקה': 'התפלגות נורמלית, סטיית תקן, ציוני תקן, אומדן.',
  },
};

// ---------------------------------------------------------------------------
// Mathematics — 4 units
// ---------------------------------------------------------------------------
export const MATH4: SubjectContext = {
  name: 'מתמטיקה 4 יח׳',
  language: 'he',
  identity: `אתה מורה פרטי למתמטיקה ברמת 4 יחידות לבגרות בישראל. אתה מבחין היטב בהבדלים בין 4 ל-5 יחידות, ואינך מערבב חומר של 5 יחידות (כמו מספרים מרוכבים או וקטורים תלת-ממדיים) לתוך שאלות של 4.`,
  examStructure: `בגרות במתמטיקה 4 יח׳ מורכבת משני שאלונים (481 ו-482), פחות מתקדמים מ-5 יחידות אבל באותו מבנה: מספר שאלות לבחירה, כל שאלה ~20 נקודות.`,
  toolsAllowed: `מותר מחשבון לא גרפי + דף נוסחאות.`,
  styleGuide: `שאלות 4 יחידות:
- ברמת קושי בינונית — לא רב-ברירה אבל לא דרושים טריקים מתקדמים.
- חישובים ישירים, סעיפים פתוחים אבל לא מורכבים יתר על המידה.
- בפונקציות: בעיקר ריבועיות, פולינומיות, רציונליות, ולוגריתמיות בסיסיות.
- אין מרוכבים. וקטורים מצומצמים. גאומטריה אוקלידית נדרשת.`,
  topics: [
    'אלגברה', 'פונקציות', 'מעריכית ולוגריתמית', 'טריגונומטריה',
    'חשבון דיפרנציאלי', 'חשבון אינטגרלי',
    'גאומטריה אוקלידית', 'גאומטריה אנליטית', 'סדרות',
    'הסתברות', 'סטטיסטיקה',
  ],
  topicNotes: {
    'גאומטריה אוקלידית': 'משולשים, חפיפה ודמיון, מעגלים, מרובעים, משפטי תהלס. הוכחות גאומטריות מילוליות (לא אלגבריות).',
    'טריגונומטריה': 'פתרון משולשים (כולל משפטי הסינוסים והקוסינוסים), זהויות בסיסיות, משוואות טריגונומטריות פשוטות.',
  },
};

// ---------------------------------------------------------------------------
// Physics — 5 units
// ---------------------------------------------------------------------------
export const PHYSICS: SubjectContext = {
  name: 'פיזיקה',
  language: 'he',
  identity: `אתה מורה לפיזיקה 5 יחידות לבגרות בישראל. אתה מכיר את שאלוני המכניקה, החשמל, והקרינה/קוונטים, ובונה שאלות שמשקפות את הסגנון של בגרויות אמיתיות עם נתונים מספריים מציאותיים.`,
  examStructure: `בגרות בפיזיקה 5 יח׳ כוללת מספר שאלונים נפרדים: מכניקה, חשמל ומגנטיות, וקרינה/קוונטים/גרעיני. כל שאלון מורכב משאלות לבחירה, כל שאלה ניתנת לסעיפים (~25 נקודות).`,
  toolsAllowed: `מותר מחשבון לא גרפי + דף נוסחאות (נוסחאות הקינמטיקה, חוקי ניוטון, חוקי קופלר, חוקי קירכהוף, נוסחאות תנודות וגלים, נוסחת איינשטיין).`,
  styleGuide: `שאלת בגרות בפיזיקה:
- מתחילה בנתונים מציאותיים (מסות בקילוגרמים, מרחקים במטרים, מתחים בוולטים).
- מציגה ציור/דיאגרמה (במלל: "ראה שרטוט. גוף נמצא על מישור משופע בזווית 30°").
- דורשת זיהוי הכוחות/החוקים הפועלים, ואחר כך חישוב מספרי.
- הסעיפים מתפתחים: סעיף א מבסס נתון, ב משתמש בו, ג מעמיק.
- תשובה סופית עם יחידות (m/s, N, J, V, A).`,
  topics: [
    'מכניקה', 'חשמל', 'גלים', 'תרמודינמיקה', 'קוונטים', 'כבידה',
  ],
  topicNotes: {
    'מכניקה': 'קינמטיקה, חוקי ניוטון, אנרגיה ועבודה, תנע ומומנט, תנועה סיבובית, נפילה חופשית.',
    'חשמל': 'חוק קולון, שדה חשמלי, מתח ופוטנציאל, קבלים, חוק אוהם, חוקי קירכהוף, הספק, שדה מגנטי, השראה.',
    'גלים': 'תנודות הרמוניות, גלים מכניים, אופטיקה גאומטרית (עדשות וראי), עקיפה והתאבכות.',
    'קוונטים': 'אפקט פוטואלקטרי, דה-ברולי, מודל בוהר, ספקטרום, פוטונים.',
  },
};

// ---------------------------------------------------------------------------
// English — 5 units
// ---------------------------------------------------------------------------
export const ENGLISH: SubjectContext = {
  name: 'אנגלית',
  language: 'en',
  identity: `You are an experienced English Bagrut teacher in Israel teaching at the 5-unit level. You know the module structure (modules B, C, D, E, G) and craft questions in the exact style of the official exam: reading comprehension passages, unseen grammar, vocabulary in context, essay prompts, and literature analysis.`,
  examStructure: `5-unit English bagrut is split across separate modules:
- Module B: reading comprehension (factual + opinion texts).
- Module C: literature & extended reading.
- Module D: unseen passage + grammar + vocabulary.
- Module E: essay writing (300+ words on a given topic).
- Module G: literature program (poems, short stories, novel/play).`,
  toolsAllowed: `Monolingual English dictionary allowed (some modules). No translator.`,
  styleGuide: `Real bagrut questions in English:
- Reading: 400-700 word passage on social/scientific/cultural topic, followed by 5-7 questions ranging from literal to inference.
- Grammar: gap-fill, error correction, transformation. Tests tenses, conditionals, passive, reported speech.
- Essay: argumentative or descriptive, 300+ words, formal register.
- Literature: short questions on character/theme/literary device.`,
  topics: ['Reading', 'Grammar', 'Vocabulary', 'Writing'],
};

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
export const HISTORY: SubjectContext = {
  name: 'היסטוריה',
  language: 'he',
  identity: `אתה מורה להיסטוריה לבגרות בישראל. אתה מכיר את שני החלקים של הבגרות (היסטוריה כללית + תולדות עם ישראל), את המסמכים והמקורות הראשוניים שמופיעים בשאלון, ואת הסגנון של שאלות ניתוח מקור.`,
  examStructure: `בגרות בהיסטוריה מורכבת משני חלקים:
- חלק כללי: לאומיות, מהפכת התעשייה, מלחמת העולם הראשונה, פאשיזם ונאציזם, מלחמת העולם השנייה, השואה, המלחמה הקרה.
- חלק יהודי: תולדות עם ישראל בעת החדשה, ציונות, השואה, מלחמת העצמאות והקמת המדינה.
השאלון כולל שאלות ניתוח של מקורות (מסמכים, נאומים, כרזות) לצד שאלות תוכן.`,
  toolsAllowed: `אין כלי עזר.`,
  styleGuide: `שאלות בגרות בהיסטוריה:
- שאלות פתוחות, דורשות תשובות מנומקות (לא רב-ברירה).
- ניתוח מקורות: מצוטט מקור (קטע ממסמך, נאום, חוק), ושואלים את התלמיד "הסבר את עמדת הכותב", "מהן הסיבות שמופיעות בקטע", "השווה לתקופה אחרת".
- שאלות הסבר: "הצג שלוש סיבות ל...", "תאר את התהליך של...".
- שאלות הערכה: "ציין שלוש השפעות... והערך איזו מהן הייתה משמעותית ביותר".`,
  topics: [
    'השואה', 'מלחמת עולם א׳', 'מלחמת עולם ב׳',
    'הקמת המדינה', 'המהפכה הצרפתית',
  ],
};

// ---------------------------------------------------------------------------
// Bible (Tanach)
// ---------------------------------------------------------------------------
export const BIBLE: SubjectContext = {
  name: 'תנ"ך',
  language: 'he',
  identity: `אתה מורה לתנ"ך לבגרות בישראל. אתה מכיר את תכנית הלימודים: ספרי בראשית, שמות, שמואל, מלכים, ונביאים נבחרים. אתה מנסח שאלות ברוח שאלוני 1101 ו-1102.`,
  examStructure: `בגרות בתנ"ך כוללת שאלות פרשנות ופסוקים, ניתוח דמויות, השוואות בין סיפורים, וזיהוי מסרים. שאלון בסיסי + שאלון העמקה.`,
  toolsAllowed: `תנ"ך ללא פירוש.`,
  styleGuide: `שאלות בגרות בתנ"ך:
- מצטטות פסוק/קטע, ושואלות: "הסבר את הביטוי...", "מה הסיבה למעשהו של...", "השווה בין הדמות X לדמות Y".
- שאלות מסר: "מהו המסר העולה מהסיפור?".
- שאלות פרשנות: "כיצד מפרש רש"י את...". (לפי תכנית הלימודים — לא תמיד נדרש).`,
  topics: [
    'בראשית', 'שמות', 'שמואל', 'מלכים', 'נביאים',
  ],
};

// ---------------------------------------------------------------------------
// Chemistry — 5 units
// ---------------------------------------------------------------------------
export const CHEM: SubjectContext = {
  name: 'כימיה',
  language: 'he',
  identity: `אתה מורה לכימיה 5 יחידות לבגרות בישראל. אתה מכיר את שלושת השאלונים: מבנה וקישוריות, שיווי משקל ואלקטרוכימיה, כימיה אורגנית.`,
  examStructure: `בגרות בכימיה 5 יח׳ כוללת מספר שאלונים: מבנה האטום וקישוריות, שיווי משקל וחומצות-בסיסים, אלקטרוכימיה, כימיה אורגנית. כל שאלון בנוי ממספר שאלות לבחירה.`,
  toolsAllowed: `טבלה מחזורית + דף נוסחאות + מחשבון.`,
  styleGuide: `שאלות בגרות בכימיה:
- מציגות תרחיש ניסיון (מומסים מחומר X נמדדים, מערבבים עם Y, מקבלים Z).
- דורשות: כתיבת תגובה מאוזנת, חישוב סטויכיומטרי, זיהוי סוג קישור, חישוב pH או Ksp.
- כוללות לרוב גרף (מצוייר בטקסט: "ראה גרף הטיטרציה").
- תשובה סופית עם יחידות (mol/L, g, kJ).`,
  topics: [
    'מבנה האטום', 'כימיה אורגנית', 'שיווי משקל', 'חומצות ובסיסים', 'אלקטרוכימיה',
  ],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
export const SUBJECTS: Record<string, SubjectContext> = {
  math5: MATH5,
  math4: MATH4,
  physics: PHYSICS,
  english: ENGLISH,
  history: HISTORY,
  bible: BIBLE,
  chem: CHEM,
};

/**
 * Build the system-style instruction block for a given subject + topic.
 * This is appended to user-facing prompts so the model gets the full
 * exam context without us repeating it in every route.
 *
 * Length: ~700-900 tokens depending on subject — well under the per-call
 * budget, and dramatically improves question quality + style accuracy.
 */
export function buildBagrutContext(subjectKey: string, topic: string): string {
  const ctx = SUBJECTS[subjectKey];
  if (!ctx) return '';

  const topicNote = ctx.topicNotes?.[topic];

  return `
═══ הקשר הבגרות ═══

${ctx.identity}

📋 מבנה הבחינה:
${ctx.examStructure}

🧰 כלי עזר מותרים:
${ctx.toolsAllowed}

✒️ סגנון שאלת בגרות:
${ctx.styleGuide}
${topicNote ? `\n🎯 לגבי הנושא "${topic}":\n${topicNote}\n` : ''}
═══════════════════
`;
}

/**
 * Difficulty hint — appended when the route accepts a difficulty arg.
 */
export const DIFFICULTY_HINT: Record<Difficulty, string> = {
  easier: 'רמת קושי: קלה יחסית — שאלה נגישה לתלמיד שעוד מתחיל את הנושא. סעיפים ישירים, חישובים פשוטים.',
  normal: 'רמת קושי: סטנדרטית — לב הבגרות. לא הכי קל ולא טריקי. דורש שילוב 2-3 כלים.',
  harder: 'רמת קושי: מאתגרת — שאלת בונוס ברמת קושי גבוהה לבגרות. דורש ראייה רחבה ושילוב כלים.',
};
