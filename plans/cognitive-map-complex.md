# שכבת מיפוי קוגניטיבי — מספרים מרוכבים (Cognitive Map, Phase 1)

> סטטוס: **שלבים 2-4 מומשו** — ליבה, בדיקות, ו-UI (כרטיס אחד ב-`/roadmap`, אומת חי).
> מה שנבנה בפועל מתועד בסוף המסמך, כולל הסטיות מהתכנון.
> היקף: `subject = math5`, `topic = מספרים מרוכבים` בלבד. 5 תתי-נושאים.
> עלות Anthropic: **$0** — אין שום קריאת API בפיצ'ר הזה, לא בזמן ריצה ולא בבנייה.

---

## 0 · תקציר בפסקה אחת

היום האפליקציה יודעת **כמה** התלמיד ענה נכון ברמת תת-נושא. היא לא יודעת **מה בדיוק** נשבר.
התוכנית מוסיפה שכבה **נגזרת וטהורה** (pure) שממפה כל תשובה לרמת **מיומנות (skill)** ולרמת
**תפיסה שגויה (misconception)** מזוהה בשם, מריצה עליהן knowledge tracing מקומי, ומוציאה
המלצה אחת + משפט תובנה אחד בעברית. **אפס אחסון חדש, אפס API, אפס שינוי בתוכן המאומת.**

---

## 1 · Audit — מה קיים היום

### 1.1 מסלול הלמידה (learning flow)

```
/roadmap → נושא → תת-נושא → SubTopicLadder (סולם 5 שלבים)
   📖 learn  → LearnLevel     → MicroDrill (פורמטיבי, לא נספר)
   🌱 easy   ┐
   ⚡ mid    ├→ RoadmapLevelRunner → QuestionRunnerCard  ← לולאת השאלה היחידה
   🔥 hard   ┘
   🎓 bagrut → BagrutLevel → QuestionPartCard
/roadmap/review → אותו QuestionRunnerCard עם source='review'
/quiz           → בוחן מושגים (מסלול נפרד, ConceptQuestion)
```

### 1.2 איפה תשובות נשמרות (5 חנויות מנותקות ב-localStorage)

| קובץ | מפתח | מה נשמר | מי כותב |
|---|---|---|---|
| `lib/results.ts` | `bagrut-results-v1` | `{ts, subject, topic, subTopicId, questionId, source, difficulty, correct, repeat}` | 5 מקומות |
| `lib/roadmap-progress.ts` | `bagrut-roadmap-v1` | per-rung `cleared/stars/attempts/bestScore` | SubTopicLadder |
| `lib/mistakes.ts` | `bagrut-mistakes-v1` | טעות + `ErrorCategory` (8 קטגוריות גלובליות) | 7 מקומות |
| `lib/review.ts` | `bagrut-review-v1` | Leitner box לפי `questionId` | QuestionRunnerCard |
| `lib/study-plan.ts` | `bagrut-study-plan-v1` | unitLevel + רמה עצמית פר-נושא | onboarding |

`lib/sync/roadmap-sync.ts` מסנכרן ל-Supabase **רק** את `roadmap` ואת `plan`. results / mistakes /
review **לא מסונכרנים** — האבחון קיים רק על המכשיר הנוכחי.

### 1.3 חמשת הפערים שמונעים מיפוי קוגניטיבי

1. **אין שכבת skill.** הרזולוציה הכי דקה היא `subTopicId` — 5 יחידות לכל מספרים מרוכבים.
   תלמיד שנופל 3 פעמים ב-`polar-de-moivre` מקבל "אתה חלש בהצגה קוטבית", בזמן שהשבר האמיתי
   יכול להיות תיקון הרבע, או שכחת השורש ב-$|z|$, או אי-המרה חזרה לאלגברית. **אי אפשר לומר
   "הבעיה שלך היא לא ב-X אלא ב-Y שלפניו" כשאין X ואין Y.**
2. **אין graph של קדימויות.** שום דבר לא יודע ש-`complex-roots` דורש `polar-de-moivre`.
3. 🔑 **התפיסות השגויות כבר כתובות — ונזרקות.** ב-`complex-numbers.ts` יש **65 שאלות MCQ
   ולכולן `distractorNotes`** — כל מסיח הוא תפיסה שגויה מנוסחת, בעברית, מאומתת.
   כשהתלמיד לוחץ על מסיח מס' 2, המערכת מציגה את ההערה ורושמת `category: 'אחר'`.
   **זהות התפיסה השגויה הולכת לאיבוד.** האות נמצא בקליק; רק התצוגה משתמשת בו.
4. **`ErrorCategory` גנרי ומתמוטט ל-'אחר'.** ברירת המחדל היא `'אחר'` והתיוג מחדש ידני. כבר
   תועד בקוד אירוע שבו /errors הכריז "100% מהטעויות שלך מסוג אחר".
5. **הדיוק הוא יחס גולמי** — בלי משקל זמן, בלי משקל קושי, בלי דעיכה, בלי מדד ודאות.
   `weakestSubTopics` דורש ≥3 ניסיונות ולפני זה שותק לגמרי.
6. **אין בורר "הצעד הבא".** קיימים שלושה קולות נפרדים — `getResumePoint` (איפה עצרת),
   `dueItems` (מה מגיע לחזרה), `weakestSubTopics` (איפה אתה חלש) — ואף אחד לא מכריע ביניהם.

### 1.4 נכסים שכבר קיימים ואפשר להישען עליהם

- **65 מערכי `distractorNotes`** = קטלוג תפיסות שגויות מוכן, רק בלי מזהים.
- `seededOrder(n, q.id)` — הערבוב דטרמיניסטי, ו-`selected` ב-QuestionRunnerCard הוא
  **האינדקס המקורי** (לא המעורבב). כלומר `chosenIndex` הוא אות נקי.
- `expected: AnswerSpec` + `lib/answer-check.ts` — בדיקה דטרמיניסטית לשאלות פתוחות.
- `content/concept-quiz/index.ts` — התבנית של registry ממופתח `${subject}:${topic}` כבר קיימת
  ומתועדת כהכרחית (math4 חולק שמות נושאים עם math5). נשתמש באותה תבנית.
- `scripts/verify-review.ts` — סגנון הבדיקות של הפרויקט: shim ל-localStorage + שעון קבוע + PASS/FAIL.

---

## 2 · הארכיטקטורה המוצעת

### 2.1 עקרון-על: **לא מזיזים state — גוזרים אותו**

```
                    ┌──────────────────────────────┐
  ResultEvent[]  ─→ │                              │
  (bagrut-results)  │   buildCognitiveState(       │ ─→ CognitiveState
                    │     events, catalog, now )   │      • skills[]
  catalog (static) ─→│                              │      • misconceptions[]
  (content/cognition)│   ⚙ pure · deterministic     │      • weakestLink
                    │      · no storage · no API   │      • nextStep
  now: number    ─→ │                              │      • insight (עברית)
                    └──────────────────────────────┘
```

**כל המצב הקוגניטיבי הוא פונקציה טהורה של יומן האירועים הקיים + קטלוג סטטי + השעון.**

למה זה ההחלטה הנכונה:
- **אין מיגרציה, אין חנות שישית, אין דריפט.** אי אפשר ש"המצב" ייצא מסנכרון עם הראיות.
- **replay מלא** — אפשר להריץ תלמיד סינתטי דרך אותה פונקציה בדיוק ולבדוק את המשפט שיוצא.
- **מתעדכן אחרי כל תשובה בחינם** — היומן גדל, הקריאה הבאה כבר משקפת.
- זול: ≤1000 אירועים × ~18 skills, מחושב ב-`useMemo` פעם אחת בטעינה (<2ms).

**החריג היחיד:** `ResultEvent` היום לא שומר **איזה מסיח** נבחר. בלי זה אי אפשר להבדיל בין
"נתקל בתפיסה השגויה ולא נפל בה" לבין "מעולם לא נתקל". לכן ההרחבה המינימלית:

```ts
// lib/results.ts — 4 שדות אופציונליים, אפס שינוי התנהגות
type ResultEvent = {
  /* ...קיים... */
  kind?: 'mcq' | 'open';
  chosenIndex?: number;   // האינדקס המקורי (לא המעורבב) של המסיח שנבחר
  hintUsed?: boolean;     // האם הרמז נחשף לפני התשובה הנספרת
  optionCount?: number;   // כמה אופציות היו — קובע את פרמטר ה-guess ב-BKT
};
```

נדחה במפורש: חנות `bagrut-evidence-v1` נפרדת. היא הייתה מוסיפה נתיב-כתיבה שני, יעד-סנכרון
שני, ואפשרות שהשניים ייפרדו. שדות אופציונליים על אירוע שכבר נכתב = אפס סיכון.

### 2.2 הקטלוג — נתונים בקובץ נפרד, **בלי לגעת בתוכן המאומת**

`content/lessons/math5/complex-numbers.ts` הוא 4,160 שורות, מאומת מתמטית, ומקבל עריכות
במקביל (`git status` מראה אותו כ-modified כרגע). **לא נוגעים בו.** הקטלוג יושב בקובץ נפרד
וממופה לפי `questionId`:

```
content/cognition/
  types.ts                     Skill · Misconception · TopicCognitionMap
  index.ts                     registry ממופתח `${subject}:${topic}` (כמו concept-quiz)
  math5/complex-numbers.ts     18 skills + graph קדימויות + 15 misconceptions + מיפוי שאלות
```

יתרונות: אפס סיכון לתוכן, אפס התנגשות עם סשנים מקבילים, והוספת נושא = קובץ + שורה ברגיסטרי.

### 2.3 שכבת הלוגיקה

```
lib/cognition/
  types.ts            Observation · SkillMastery · MisconceptionState · NextStep · CognitiveState
  observe.ts          ResultEvent[] → Observation[]   (כאן קורה ה-lookup של התפיסה השגויה)
  trace.ts            BKT + דעיכה → SkillMastery      ← knowledge tracing
  misconceptions.ts   hits/opportunities + דעיכה      ← misconception detection
  diagnose.ts         איתור "החוליה החלשה" בגרף הקדימויות
  next-step.ts        ניקוד מועמדים + הכרעה יחידה     ← next best step
  insight.ts          תבניות משפט בעברית (בלי AI)
  index.ts            buildCognitiveState() — נקודת הכניסה הציבורית היחידה
```

כל הקבצים **pure functions** — בלי React, בלי localStorage, בלי `Date.now()` פנימי
(השעון תמיד פרמטר `now`). זה מה שהופך אותם לניתנים לבדיקה מלאה.

---

## 3 · Data Model מלא

### 3.1 סטטי (הקטלוג)

```ts
export type SkillId = string;          // 'cx.arg.quadrant'  — namespaced, יציב לנצח
export type MisconceptionId = string;  // 'cx.arg.no-quadrant-fix'

export type Skill = {
  id: SkillId;
  title: string;                       // עברית, קצר, מוצג לתלמיד
  subject: string; topic: string; subTopicId: string;
  /** מה חייב להיות יציב לפני שאפשר ללמוד את זה */
  prereqs: SkillId[];
  /** רמת הקושי האופיינית — קובעת את ה-prior של BKT */
  band: 'easy' | 'mid' | 'hard';
};

export type Misconception = {
  id: MisconceptionId;
  title: string;                       // עברית קצר — "ארגומנט בלי תיקון רבע"
  /** המיומנות שהיא מקלקלת */
  skill: SkillId;
  /** אם השבר האמיתי במעלה הזרם — כאן מצביעים עליו */
  rootSkill?: SkillId;
  /** משפט אחד לתלמיד. זה מה שנראה על המסך. */
  insight: string;
  /** לאן שולחים אותו לתקן */
  remedy: { subTopicId: string; level?: RoadmapLevelKind; stepIndex?: number };
  /** 🔑 MCQ: בחירת האופציה הזו *היא* התפיסה השגויה. מגיע מ-distractorNotes הקיימים. */
  triggers: { questionId: string; optionIndex: number }[];
  /** אופציונלי — שאלה פתוחה: התשובה שהוקלדה שקולה לערך הזה (דרך checkAnswer) */
  probes?: { questionId: string; equals: string }[];
};

export type TopicCognitionMap = {
  subject: string; topic: string;
  skills: Skill[];
  misconceptions: Misconception[];
  /** questionId → אילו skills השאלה מתרגלת. חסר → נופל ל-skills של תת-הנושא. */
  questionSkills: Record<string, SkillId[]>;
};
```

### 3.2 דינמי (נגזר, לא נשמר)

```ts
export type Observation = {
  ts: number; skillId: SkillId; correct: boolean;
  kind: 'mcq' | 'open'; optionCount?: number;
  hintUsed?: boolean; isReplay?: boolean; source: ResultSource;
  misconceptionId?: MisconceptionId;   // מולא כשה-trigger תפס
};

export type MasteryState = 'unknown' | 'fragile' | 'developing' | 'mastered';

export type SkillMastery = {
  skillId: SkillId;
  p: number;                 // 0..1 — הסתברות שהמיומנות נרכשה, אחרי דעיכה
  state: MasteryState;
  observations: number;
  effectiveN: number;        // ספירה משוקללת-רצנטיות
  confidence: number;        // 0..1 — כמה אנחנו בכלל יודעים. נפרד מ-p!
  lastTs: number;
  trend: 'up' | 'flat' | 'down';   // 3 האחרונות מול הקודמות
};

export type MisconceptionState = {
  id: MisconceptionId;
  hits: number; opportunities: number;
  rate: number;              // מוחלק (Laplace) ומשוקלל-רצנטיות
  weight: number;            // 0..1 — עוצמה לדירוג
  lastHitTs: number;
  status: 'resolved' | 'fading' | 'suspected' | 'active';
};

export type NextStepKind =
  | 'prereq-repair' | 'misconception-drill' | 'review-due'
  | 'continue-ladder' | 'consolidate' | 'start';

export type NextStep = {
  kind: NextStepKind;
  score: number;
  title: string;             // עברית — "תקן קודם: תיקון רבע בארגומנט"
  reason: string;            // עברית — למה דווקא זה
  href: string;              // יעד קיים במסלול (/roadmap/<subId>?level=...)
  skillId?: SkillId; misconceptionId?: MisconceptionId;
};

export type WeakestLink = {
  childSkill: SkillId; rootSkill: SkillId;
  gap: number;               // כמה המוקדם חלש יותר מהמאוחר
};

export type CognitiveState = {
  subject: string; topic: string;
  skills: Record<SkillId, SkillMastery>;
  misconceptions: MisconceptionState[];   // ממוין לפי weight
  weakestLink: WeakestLink | null;
  nextStep: NextStep;
  alternates: NextStep[];                 // עד 2
  insight: string | null;                 // המשפט. null כשאין מספיק ראיות.
  coverage: number;                       // 0..1 — כמה מהגרף בכלל נמדד
  updatedAt: number;
};
```

---

## 4 · האלגוריתמים (מקומיים, דטרמיניסטיים)

### 4.1 Knowledge tracing — **BKT-lite**

נבחר BKT ולא "דיוק משוקלל" כי הוא (א) מייצר **הסתברות** ולכן "ודאות" היא מושג טבעי,
(ב) מטפל מפורשות ב**ניחוש** — קריטי כשרוב השאלות MCQ עם 4 אופציות (25% ניחוש!),
(ג) עדכון אינקרמנטלי של ~15 שורות. יותר חכם מדיוק גולמי, הרבה פחות ממודל עמוק.

```
פרמטרים:  slip = 0.10 · transit = 0.15
           guess = 1/optionCount ל-MCQ (0.25 בארבע אופציות)
                 = 0.05 לשאלה פתוחה עם expected (נבדקה מכנית)
                 = 0.15 לשאלה פתוחה בדיווח עצמי (אות רועש)
           prior p0 לפי band:  easy 0.35 · mid 0.25 · hard 0.15

לכל observation (בסדר כרונולוגי):
   correct:  p ← p(1-slip) / [ p(1-slip) + (1-p)·guess ]
   wrong:    p ←  p·slip   / [   p·slip  + (1-p)(1-guess) ]
   ואז:      p ← p + (1-p)·transit          // למידה מהניסיון עצמו

מודיפיקטורים:
   • hintUsed && correct  → מדלגים על בייס, מחילים רק חצי transit
                            (נכון עם רמז אינו ראיה לשליטה עצמאית)
   • isReplay             → guess מוקפץ ל-0.5 (חזרה על שאלה מוכרת = ראיה חלשה)
```

**דעיכה (forgetting)** — מוחלת בקריאה, לא נשמרת:

```
p_now = p0 + (p_last - p0) · 2^( -Δdays / 21 )     // חצי-חיים 21 יום
```

**סיווג:** `confidence < 0.35` → `unknown` · `p < 0.5` → `fragile` ·
`p < 0.8` → `developing` · אחרת `mastered`.
`confidence = 1 - exp(-effectiveN / 3)`, כאשר `effectiveN` הוא סכום משקלי הרצנטיות.
**מפרידים בין "הוא חלש" לבין "אנחנו לא יודעים"** — זה מה שמונע האשמות שווא.

### 4.2 Misconception detection — **lookup, לא ניחוש**

```
לכל אירוע MCQ עם chosenIndex:
    trigger = catalog.triggers[questionId][chosenIndex]
    אם קיים → hit על אותה תפיסה
לכל אירוע MCQ שלשאלה שלו יש trigger כלשהו של תפיסה M:
    opportunity++ על M   (גם אם התלמיד ענה נכון — זו "נתקל ולא נפל")

rate = ( Σ hits·w(t) + 0.5 ) / ( Σ opps·w(t) + 2 )      // Laplace + רצנטיות
w(t) = 2^( -Δdays / 21 )

status:  hits = 0                                   → resolved
         hits ≥ 1, ו-3 ההזדמנויות האחרונות נקיות    → resolved
         hits ≥ 2, ו-2 ההזדמנויות האחרונות נקיות    → fading
         hits = 1 ו-opps ≤ 2                        → suspected
         אחרת, rate ≥ 0.34 והפגיעה האחרונה ≤21 יום  → active
weight = rate · recency · (status==='active' ? 1 : 0.4)
```

**זה הלב:** ה-MCQ הופך למכשיר אבחון בחינם. אפס AI, אפס heuristics, אפס false positives —
כי מישהו כבר כתב בעברית מה כל מסיח אומר. אנחנו רק נותנים לזה מזהה.

### 4.3 Diagnose — החוליה החלשה (זה מה שמייצר את המשפט)

```
מועמדים = skills עם ראיות ב-14 הימים האחרונים ו-state ∈ {fragile, developing}
לכל מועמד C:
    לכל prereq P (כולל טרנזיטיבי, עומק ≤2):
        אם  state(P) = fragile  וגם  p(C) - p(P) ≥ 0.15  וגם  confidence(P) ≥ 0.35
        → מועמד לשבר: { childSkill: C, rootSkill: P, gap }
בוחרים את ה-gap הגדול ביותר; שובר-שוויון: ה-P העמוק ביותר בגרף, ואז לפי סדר הקטלוג.
```

תוצאה: **"הבעיה שלך היא לא בשורשים המרוכבים עצמם — אלא בתיקון הרבע בארגומנט שלפניהם."**
בדיוק הצורה שביקשת, נגזרת מהגרף, בלי מודל.

### 4.4 Next best step — בורר יחיד

```
מועמדים ומשקלם:
   prereq-repair        100 × severity(rootSkill)          ← קודם כל לתקן את השבר
   misconception-drill   80 × weight(top misconception)
   review-due            60 × min(1, dueCount/10)          ← lib/review.ts הקיים
   continue-ladder       40                                ← lib/roadmap-resume.ts הקיים
   consolidate           20 × staleness(mastered skill)
   start                  5                                ← אין ראיות בכלל
score = priority × urgency ; ממיינים ; מחזירים 1 + עד 2 חלופות
שובר-שוויון דטרמיניסטי: score desc → סדר הקטלוג → id asc
```

חשוב: **הבורר לא ממציא יעדים חדשים** — כל `href` מצביע על מסך שכבר קיים
(`/roadmap/<subId>?level=<kind>` נתמך כבר היום ב-SubTopicLadder).

### 4.5 Insight — תבניות, לא AI

```ts
prereq-break   → "הבעיה שלך היא לא ב{child}, אלא ב{root} שלפניו — {evidence}."
misconception  → "בכל פעם שמופיע {trigger}, אתה {mistake}. זה קרה {hits} מתוך {opps} פעמים."
fragile-recent → "{skill} עדיין לא יציב אצלך — {n} מתוך {m} בשבועיים האחרונים."
decayed        → "{skill} היה חזק לפני {days} ימים ולא נגעת בו מאז. שווה רענון קצר."
too-little     → null   // לא ממציאים אבחנה מ-2 שאלות
```

---

## 5 · קטלוג התפיסות השגויות למספרים מרוכבים (≥10 — יעד 15)

כולן **קיימות כבר כמסיחים כתובים** בקובץ התוכן; אנחנו רק נותנים להן מזהה ומצביע.

| # | id | תפיסה שגויה | skill | מקור קיים |
|---|---|---|---|---|
| 1 | `cx.arg.no-quadrant-fix` | `arctan(b/a)` בלי תיקון רבע (−1−i → 45°) | `cx.arg.quadrant` | drill-003 + "הטעות הכי נפוצה בנושא" בשיעור |
| 2 | `cx.mod.forgot-sqrt` | עוצרים ב-$\|z\|^2$ (100 במקום 10) | `cx.modulus` | drill-002 אופציה ג |
| 3 | `cx.mod.sum-of-parts` | $a+b$ במקום $\sqrt{a^2+b^2}$ | `cx.modulus` | drill-002 אופציה ב |
| 4 | `cx.polar.negative-r` | כותבים $r<0$ במקום לקודד כיוון בזווית | `cx.polar.form` | drill-001 + drill-004 |
| 5 | `cx.roots.only-principal` | $z^3=8 \Rightarrow z=2$ וזהו | `cx.roots.count` | פרסונת נועה ב-`/teach` |
| 6 | `cx.roots.modulus-not-rooted` | $\|z_k\|=r$ במקום $\sqrt[n]{r}$ | `cx.roots.formula` | keyPoint 2 |
| 7 | `cx.roots.wrong-angle-step` | מוסיפים $360°$ במקום $360°/n$ | `cx.roots.formula` | keyPoint 3 |
| 8 | `cx.demoivre.modulus-untouched` | $z^n = r\,\mathrm{cis}(n\theta)$ — שכחו $r^n$ | `cx.demoivre.power` | keyPoint 3 של polar |
| 9 | `cx.demoivre.no-convert-back` | משאירים קוטבית כשביקשו אלגברית | `cx.polar.to-algebraic` | "מלכודת 2" ב-summary |
| 10 | `cx.eq.conjugate-assumed` | מניחים צמודים גם כשהמקדמים מרוכבים | `cx.eq.vieta` | keyPoint 4 של equations |
| 11 | `cx.eq.disc-sign` | טעות סימן ב-$\sqrt{\Delta}=i\sqrt{\|\Delta\|}$ | `cx.eq.quadratic-real` | צעד 1 |
| 12 | `cx.loci.ray-as-line` | $\arg(z-z_0)=\alpha$ כישר מלא ולא כקרן | `cx.loci.ray` | צעד 3 |
| 13 | `cx.loci.bisector-as-circle` | $\|z-z_1\|=\|z-z_2\|$ כמעגל | `cx.loci.bisector` | צעד 2 |
| 14 | `cx.i.power-cycle` | $i^2=1$ / מחזוריות $i^n$ שגויה | `cx.algebraic.arithmetic` | בנק cx-00x |
| 15 | `cx.findz.no-back-check` | לא מציבים חזרה, סימן הפוך שורד | `cx.findz.strategy` | keyPoint 4 |

### גרף המיומנויות (18 skills, 3-4 לכל תת-נושא)

```
cx.algebraic.arithmetic ──┬─→ cx.algebraic.conjugate ──→ cx.eq.quadratic-real ──→ cx.eq.vieta
                          │                                        ↑
                          └─→ cx.findz.xy-substitution ────────────┘
                                        │
cx.modulus ──┬──────────────────────────┼─→ cx.loci.distance ─┬─→ cx.loci.circle
             │                          │                     ├─→ cx.loci.bisector
cx.arg.quadrant ─┬─→ cx.polar.form ─────┤                     └─→ cx.loci.ray
                 │        │             │                            ↑
                 └────────┼─────────────┼────────────────────────────┘
                          ├─→ cx.polar.to-algebraic
                          ├─→ cx.polar.mult-div
                          └─→ cx.demoivre.power ──→ cx.roots.count ──→ cx.roots.formula
                                                                            └─→ cx.roots.geometry
                          cx.findz.strategy  ← (polar.form + xy-substitution)
                          cx.eq.sqrt-of-complex ← (xy-substitution)
```

---

## 6 · אילו קבצים משתנים

### חדשים (12)

```
content/cognition/types.ts
content/cognition/index.ts                    registry `${subject}:${topic}`
content/cognition/math5/complex-numbers.ts    18 skills + 15 misconceptions + מיפוי
lib/cognition/types.ts
lib/cognition/observe.ts
lib/cognition/trace.ts
lib/cognition/misconceptions.ts
lib/cognition/diagnose.ts
lib/cognition/next-step.ts
lib/cognition/insight.ts
lib/cognition/index.ts
scripts/verify-cognition.ts                   שער שלמות הגרף (נכנס ל-npm run check)
scripts/test-cognition.ts                     בדיקות האלגוריתם + תלמידים סינתטיים
```

### קיימים שנוגעים בהם (מינימלי, בלי שינוי התנהגות)

| קובץ | שינוי | שורות |
|---|---|---|
| `lib/results.ts` | 4 שדות **אופציונליים** ל-`ResultEvent` | ~5 |
| `components/roadmap/QuestionRunnerCard.tsx` | להעביר `chosenIndex/kind/optionCount/hintUsed` ב-`logFirst`. **אפס שינוי UI.** | ~6 |
| `package.json` | `verify:cognition` + חיווט ל-`check` | 2 |
| *(שלב 2, אופציונלי)* `app/quiz/page.tsx`, `SubTopicPractice.tsx`, `QuestionPartCard.tsx` | אותה תוספת שדות | ~4 כל אחד |

### לא נוגעים בכלל

`content/lessons/math5/*.ts` (מאומת + modified במקביל) · `lib/mistakes.ts` · `lib/review.ts` ·
`lib/roadmap-progress.ts` · `lib/prediction.ts` · כל ה-UI · `statistics.ts` · `2020-summer-582.ts`.

**למה לא לאחד עם `lib/mistakes.ts`:** ה-`ErrorCategory` הוא טקסונומיה **למשתמש**;
`misconceptionId` הוא מזהה **אבחוני**. איחוד שלהם משחזר בדיוק את מפולת ה-'אחר' שכבר קרתה.
בהמשך אפשר למפות `misconceptionId → ErrorCategory` לתצוגה ב-/errors — זה כיוון אחד, לא איחוד.

---

## 7 · תוכנית ביצוע וקריטריוני בדיקה

### שלב 2 — הליבה (אחרי אישור)
1. `content/cognition/types.ts` + `index.ts` + הקטלוג של מרוכבים.
2. `lib/cognition/*` — 7 מודולים טהורים.
3. הרחבת `ResultEvent` + החיווט ב-QuestionRunnerCard.
4. `npx tsc --noEmit` + `npm run build` ירוקים.

### שלב 3 — בדיקות (בסגנון `verify-review.ts`: shim ל-localStorage, שעון קבוע, PASS/FAIL)

**`scripts/verify-cognition.ts` — שער שלמות (נכנס ל-`npm run check`):**
- אין `SkillId` יתום; אין `prereq` שלא קיים; **אין מעגלים בגרף**.
- כל `trigger` מצביע על `questionId` אמיתי, על `optionIndex` בטווח,
  ו**האופציה הזו אינה ה-`correct`** ← זה תופס את המחלקה "מסמנים תשובה נכונה כטעות".
- כל `remedy.subTopicId` נפתר דרך `getSubTopic`; כל `remedy.level` קיים בסולם.
- ≥10 תפיסות שגויות למרוכבים; כל skill מכוסה ע"י ≥1 שאלה.
- טבלת מצאי פר תת-נושא = רשימת העבודה (כמו `verify-concept`).

**`scripts/test-cognition.ts` — בדיקות אלגוריתם (שעון קבוע, בלי `Date.now`):**
- מונוטוניות BKT: נכון מעלה `p`, שגוי מוריד.
- ניחוש: MCQ נכון בודד מעלה פחות משאלה פתוחה נכונה.
- רמז: נכון-עם-רמז מעלה פחות מנכון-בלי-רמז.
- דעיכה: 42 ימי אי-פעילות → `p` חוזר חצי-הדרך ל-prior.
- ודאות: 2 תצפיות → `unknown`, לא `fragile`. **לא מאשימים בלי ראיות.**
- שיעור תפיסה: 2/2 חזק מ-2/9; 3 הזדמנויות נקיות → `resolved`.
- זיהוי חוליה חלשה על תלמיד סינתטי; דטרמיניזם של הבורר (אותו קלט → אותו פלט).

**`replay` של 3 תלמידים סינתטיים — הראיה האמיתית:**
| ארכיטיפ | מה מזינים | המשפט שנדרש לצאת |
|---|---|---|
| "מבלבל רבעים" | נכשל ב-drill-003 ובשאלות ארגומנט, מצליח ב-$\|z\|$ | "הבעיה שלך היא לא בשורשים — אלא בתיקון הרבע בארגומנט שלפניהם." |
| "שכח את השורש ה-n-י" | עובר קוטבית, נופל ב-`cx.roots.modulus-not-rooted` | "בכל פעם שמופיע $z^n=w$, אתה לוקח את הגודל כמו שהוא במקום להוציא שורש." |
| "יציב" | 90% נכון לרוחב | `insight = null`, `nextStep = continue-ladder` — **בלי להמציא בעיה.** |

**אין צורך באימות בדפדפן בשלבים 2-3** — אין UI. אימות חי יגיע רק עם שלב 4.

### שלב 4 — UI (רק אחרי אישור נפרד)
כרטיס אחד ב-`/roadmap`: משפט התובנה + כפתור "הצעד הבא" + עד 3 תפיסות פעילות.
בלי מסך חדש, בלי ניווט חדש, RTL, `MathText` עם `math-content` על כל נוסחה.

---

## 8 · הנחות שאני מצהיר עליהן (לא מניח בשקט)

1. היקף = **מספרים מרוכבים בלבד**, `math5`. הרחבה לנושא נוסף = קובץ קטלוג + שורה ברגיסטרי.
2. `ResultEvent.chosenIndex` הוא **האינדקס המקורי**, לא המעורבב. אומת בקוד
   (`QuestionRunnerCard.pickMCQ(origIdx)`), וייבדק בשער.
3. `results.ts` מגלגל ב-1000 אירועים — אבחון על החלון האחרון. סביר; מתועד.
4. localStorage בלבד — **האבחון לא עובר בין מכשירים** (results/mistakes/review לא מסונכרנים היום).
   לא בהיקף הזה. אם תרצה, זו הוספת מפתח ל-`roadmap-sync` בהמשך.
5. שלב 1 מזהה תפיסות שגויות **מ-MCQ בלבד**. `probes` לשאלות פתוחות מוגדר בטיפוס אך יאוכלס
   רק היכן שזול (למשל להקליד `45°` בשאלת ארגומנט).
6. הגרף וה-15 תפיסות ייכתבו על ידי מהתוכן הקיים, וכל `trigger` ייבדק מכנית מול השאלה.
   **שער ירוק אינו ראיה לפדגוגיה נכונה** — אקרא כל מסיח בעצמי לפני שאתן לו מזהה.

## 9 · נקודות החלטה (ברירת המחדל שלי — תגיד אם אחרת)

| # | החלטה | ברירת המחדל שלי | החלופה |
|---|---|---|---|
| א | רזולוציית skills | **18** (3-4 לתת-נושא) | 8 גס / 30 דק (30 = הרבה skills בלי ראיות) |
| ב | איפה נשמרות הראיות | **הרחבת `ResultEvent`** ב-4 שדות | חנות `bagrut-evidence-v1` נפרדת |
| ג | אלגוריתם | **BKT-lite + דעיכה** | דיוק משוקלל-רצנטיות (פשוט יותר, בלי ניחוש/ודאות) |
| ד | שאלות פתוחות בשלב 1 | **BKT כן, זיהוי תפיסות לא** | גם probes מהיום (יקר יותר לכתוב) |
| ה | סנכרון בין מכשירים | **לא בשלב הזה** | להוסיף `results` ל-roadmap-sync |

---

# ✅ מה נבנה בפועל (שלבים 2-3)

## קבצים

**חדשים (13):**
`content/cognition/types.ts` · `content/cognition/index.ts` · `content/cognition/math5/complex-numbers.ts`
`lib/cognition/{types,observe,trace,misconceptions,diagnose,next-step,insight,index}.ts`
`scripts/verify-cognition.ts` · `scripts/test-cognition.ts`

**קיימים שנגעתי בהם (4, סה"כ +46/-4 שורות):**
| קובץ | שינוי |
|---|---|
| `lib/results.ts` | 4 שדות **אופציונליים**: `kind`, `chosenIndex`, `optionCount`, `hintUsed` |
| `components/roadmap/QuestionRunnerCard.tsx` | `logFirst` מעביר את האינדקס המקורי. **אפס שינוי UI** |
| `package.json` | `verify:cognition` + `test:cognition`, שניהם ב-`npm run check` |
| `scripts/verify-content.ts` | `content/cognition` נוסף ל-ROOTS (הקטלוג נבדק לעברית-במתמטיקה) |

**לא נגעתי:** התוכן ב-`content/lessons`, `mistakes.ts`, `review.ts`, `roadmap-progress.ts`, `prediction.ts`, וכל ה-UI.

## הקטלוג

**22 skills** (מעל 18 שתוכננו — כל אחת מכוסה ע"י שאלה אחת לפחות, נאכף בשער) ·
**46 misconceptions** (מעל 15 שתוכננו) · **186 triggers** · **103 שאלות ממופות**.
כיסוי מסיחים: polar 100% · roots 100% · gauss-loci 94% · equations 91% · finding-z 89%.

## סטיות מהתכנון — ולמה

1. **`MIN_CONFIDENCE` = 0.5, לא 0.35.** הבדיקה חשפה ש-0.35 סיווג תלמיד אחרי **שתי** תשובות כ-`fragile`.
   0.5 יושב בין 2 ל-3 תצפיות. ההטיה לכיוון המקל היא הטעות היקרה: היא הופכת "לא מדדנו" ל"אתה חלש בזה".
2. **מיזוג prereq-repair ו-misconception-drill.** כשהתפיסה השגויה החזקה יושבת **על** ה-prereq השבור,
   הן אותה מסקנה בשתי רזולוציות. בהרצה הראשונה הכותרת האשימה את הארגומנט והכפתור הציע משהו אחר —
   אבחנה ומרשם שסותרים זה את זה נקראים כבאג גם כששניהם נכונים. עכשיו נפלט מועמד אחד, מנוסח מהתפיסה
   השגויה (המדויקת יותר) ונושא את העדיפות של ה-prereq. יש בדיקה שנועלת את האינווריאנט הזה.
3. **`hePrefix`** — `"ב" + "ההצגה"` נותן *בההצגה*. רוב הכותרות מיודעות, כלומר כמעט כל משפט היה יוצא
   שגוי. כותרת שנפתחת במתמטיקה מקבלת מקף, כמו בסגנון התוכן.
4. **השער תפס שתי שאלות שהחמצתי** (`cx-sub-find-011/012`) — לכן `question-unmapped` הוא אזהרה ולא שקט.

## מה השערים אומרים

```bash
npm run verify:cognition   # 0 errors, 14 warnings + טבלת מצאי פר תת-נושא
npm run test:cognition     # 61/61
npm run check              # typecheck + content + concept + teach + cognition + tests + build
```

`verify-cognition` אוכף: אין skill יתום · אין מעגלים בגרף · כל trigger מצביע על שאלת MCQ אמיתית,
על אינדקס בטווח, ו**לא על התשובה הנכונה** · אין שני misconceptions שתובעים אותו מסיח ·
כל `remedy` נפתר לשלב קיים בסולם · ≥10 תפיסות · כל skill מכוסה בשאלה.
**הוא לא יכול לשפוט אם התפיסה היא הקריאה הנכונה של המסיח** — זה נגזר מקריאה ידנית של 186 הערות המסיחים.

14 האזהרות: 14 תפיסות שכל ה-triggers שלהן על שאלה אחת (מגבלת מצאי אמיתית — תלמיד שלא יפגוש
את השאלה הזו לא ייצר עליהן שום סיגנל). זו רשימת עבודת ה-authoring הבאה, לא באג.

## מה נשאר

- **שלב 4 — UI.** כרטיס אחד ב-`/roadmap`: משפט התובנה + כפתור הצעד הבא + עד 3 תפיסות פעילות.
  `getCognitiveState('math5', 'מספרים מרוכבים')` מחזיר הכול מוכן. **לא נבנה — דורש אישור.**
- **מסלולים נוספים שכותבים `chosenIndex`:** `/quiz`, `SubTopicPractice`, `QuestionPartCard`.
  היום רק מסלול הסולם מזין את השכבה; השאר נספרים ל-knowledge tracing אך לא לזיהוי תפיסות.
- **נושאים נוספים:** קובץ קטלוג + שורה ברגיסטרי. הלוגיקה גנרית לחלוטין.
- **סנכרון בין מכשירים:** `results` לא ב-`roadmap-sync`, ולכן האבחון מקומי למכשיר.
- **14 התפיסות עם שאלה בודדת** — להוסיף מסיחים מתאימים בשאלות קיימות.

---

# ✅ שלב 4 — ה-UI (נבנה ואומת חי)

`components/roadmap/CognitiveInsightCard.tsx` + 3 שורות חיווט ב-`app/roadmap/page.tsx`.
מוצג מעל כרטיס החזרה היומית. **אין מסך חדש ואין פריט ניווט חדש.**

## שני כללים שהרכיב קיים כדי לאכוף

1. **שקט הוא רינדור תקין.** אין תובנה ואין תפיסה פעילה → הרכיב מחזיר `null`. פאנל שתמיד יש
   לו משהו עמוק לומר על תלמיד שענה 4 שאלות הוא הורוסקופ, והתלמידים מזהים את זה.
2. **בלי CTA מתחרה.** ל-`/roadmap` כבר יש שני כפתורים (חזרה יומית · המשך מאיפה שהפסקת),
   והבורר ב-`next-step.ts` יכול בצדק לבחור בהם. כשזה קורה הכרטיס מציג את **הסיבה** בלבד
   ולא מצייר כפתור; הוא מצייר כפתור רק ל-`prereq-repair` ו-`misconception-drill` — שני
   הסוגים ששום כרטיס אחר לא מציע.

## מה תוקן אחרי שראיתי את זה בדפדפן

- **שתי כותרות "הצעד הבא שלך"** — גם שלי וגם של כרטיס ה-resume. הכפתור שלי הוא עכשיו
  **"לתקן קודם — לפני שממשיכים"**, מה שהופך התנגשות לרצף.
- **הכרטיס לא אמר על איזה נושא הוא מדבר** — על דף שמציג 10 נושאים זה מעורפל. הכותרת
  כוללת עכשיו את שם הנושא.

## אימות חי (localhost, `/roadmap` ציבורי ולכן נבדק בלי login)

| תרחיש | מה נבדק | תוצאה |
|---|---|---|
| מבלבל רבעים (9 אירועים) | הכרטיס המלא | תובנה + צ'יפ `4/4` + CTA → `/roadmap/polar-de-moivre?level=learn` ✅ |
| תלמיד יציב (9 נכונות) | **אי-רינדור** | הכרטיס לא קיים ב-DOM כלל ✅ |
| אירועים ישנים בלי `chosenIndex` | תובנה בלי CTA | תובנה מוצגת, `0` קישורים בכרטיס ✅ |
| bidi | `.katex` בתוך הכרטיס | `direction: ltr` · `unicode-bidi: isolate` · הכרטיס `rtl` ✅ |
| מובייל 375px | גלישה אופקית | `0` — לא הכרטיס ולא ה-body ✅ |
| קונסולה | שגיאות | `0` ✅ |
| Deep-link | לחיצה על ה-CTA | נפתח ישירות בשלב "לומדים" של הצגה קוטבית ✅ |

---

# ✅ סעיפי הבגרות ממופים ל-skills

## המזהה הוא הדבר הראשון שצריך לדעת

`QuestionPartCard` רושם אירוע **לכל סעיף**, תחת `${question.id}-${part.label}` — למשל
`cx-bag-001-א`. **מזהה השאלה לבדו לעולם לא מגיע ל-`results.ts`.** לכן הקטלוג ממופתח על
המחרוזת המורכבת הזו, וכל מיפוי לפי `cx-bag-001` היה מצביע על כלום.

## למה מיפוי מפורש ולא fallback לתת-נושא

שאלת בגרות **בכוונה** חוצה מיומנויות: א ממיר לקוטבית, ב מעלה בחזקה, ג חוזר לאלגברית. זו
בדיוק המידע שה-fallback היה הורס — ובנוסף הוא היה נותן לשאלה בת 5 סעיפים לפלוט **~35
תצפיות** ולהציף את ה-tracer. **26/26 הסעיפים ממופים ידנית**, ויש בדיקה שנועלת את זה:
3 סעיפים מייצרים **6** תצפיות, לא 21.

| שאלה | סעיפים | דוגמה למיפוי |
|---|---|---|
| `cx-bag-001` | 3 | א → modulus + arg + polar.form · ב → demoivre + to-algebraic |
| `cx-bag-005` (capstone) | 5 | חוצה 4 תתי-נושאים — כל סעיף למיומנות שלו |
| סה"כ | **26** | 21 בתתי-נושאים + 5 capstone |

## 🔑 הבחנה חדשה: מי נתן את הציון

`ResultEvent.selfReported` — **`false`** = `lib/answer-check` השווה סימבולית (או שופט ה-AI),
**`true`** = התלמיד ראה את הפתרון וסימן לעצמו. `guessFor` מתמחר אותם אחרת:

```
open, machine-graded  → 0.05      "אני צודק" מהבודק
open, self-reported   → 0.25      "אני צודק" מהתלמיד — הבודק הנדיב באפליקציה
open, לא ידוע         → 0.15      אירועים שנכתבו לפני שהשדה קיים
```

בלי זה סשן של דיווח-עצמי נדיב היה נקרא כשליטה. **כל 26 הסעיפים נושאים `expected`**, ולכן
רובם עוברים במסלול המכני — אבל ה-`manual` ומסלול "פתרתי על דף" קיימים, וזה מה שההבחנה תופסת.
הוחל גם על `QuestionRunnerCard` (שני המסלולים שלו).

## שער

`verify-cognition` בונה stub בצורת `PracticeQuestion` לכל סעיף, כך שכל הבדיקות הקיימות חלות
עליו בלי שינוי — ובפרט **`trigger-not-mcq` דוחה trigger שמכוון לסעיף בגרות**. טבלת המצאי
קיבלה עמודת `bagrut parts` (`מופו/סה"כ`) ושורת capstone נפרדת. **0 שגיאות · 68/68 בדיקות.**

---

# ✅ סנכרון יומן התשובות ל-Supabase

## אפס מיגרציה

`learning_state.results` קיים ב-`supabase-learning-path.sql` **מאז שהטבלה נוצרה** ("reserved for
later phases"). כל בסיס נתונים שנבנה מהקובץ הזה מקבל את זה **בלי שום SQL להריץ.**

## union, לא max-wins

חנות המפה היא **מפה** של התקדמות שרק מתקדמת → max-wins מתכנס.
יומן התשובות הוא **רצף** append-only → המיזוג הנכון הוא **איחוד קבוצות**,
לפי המפתח `(ts, source, questionId, subject, topic)`.

**`repeat` נגזר מחדש ולא ממוזג.** המשמעות שלו היא "כבר ענו על זה קודם", וכל מכשיר הכיר רק
את ההיסטוריה של עצמו — אז שניהם רשמו בצדק "ניסיון ראשון" לאותה שאלה, ואיחוד תמים היה סופר
את שניהם כמדידה ומנפח את הציון החזוי. חישוב מחדש על היומן הממוזג והממוין נותן תוצאה זהה
לא משנה מי סינכרן קודם, וגם **מתקן** דגלים שהיו שגויים בזמן שהמכשירים היו מנותקים.
קבוצת ה-"כבר נספר" נגזרת ולכן **לא מסונכרנת** — היא נבנית מחדש מקומית.

**המיזוג משמר שדות שהוא לא מכיר, מבנית.** בנייה מחדש שדה-שדה הייתה מוחקת
`chosenIndex`/`selfReported`/`optionCount` ומעוורת את `lib/cognition` אצל כל תלמיד שמסנכרן.
יש בדיקה לכל שדה בנפרד.

## גודל המטען — תוצאה אמיתית שצריך לטפל בה

יומן מלא הוא **~200KB** JSON מול ~10KB של המפה, והתלמידים על טלפונים. שני שומרים:
1. **דילוג מוחלט** על הכתיבה כשהגוף הממוזג זהה בית-בית לקודם — `visibilitychange`
   ו-`beforeunload` נורים מיד אחרי push ואחרת היו מעלים שוב את אותם 200KB.
2. **debounce 4s → 15s.** יציאה מהדף עדיין מבצעת flush מיידי, ולכן שום דבר לא הולך לאיבוד.

## הגנה על מה שכבר עובד

בשני הכיוונים, מול טבלה שנבנתה מגרסה ישנה של ה-SQL: ה-SELECT הוא `*` ולא רשימת עמודות,
ו-upsert שנכשל מנסה שוב בלי `results`. שם של עמודה חסרה היה מפיל את **כל** המשפט וסוחב איתו
את סנכרון המפה שכבר עובד.

`recordResult` מסמן עכשיו dirty — בלעדיו תשובה הייתה מגיעה לשרת רק בכתיבה הבאה שאינה קשורה.

`scripts/test-sync.ts` — **28/28**, מחובר ל-`npm run check`. הבדיקה המרכזית: `merge(a,b)`
זהה ל-`merge(b,a)`, כי מיזוג תלוי-סדר נותן לשני מכשירים שתי תחזיות ציון שונות.
