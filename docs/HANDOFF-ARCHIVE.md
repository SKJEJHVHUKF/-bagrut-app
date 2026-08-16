# בגרות בכיס — ארכיון Session Handoff (עד 2026-07-30)

יומן העבודה ההיסטורי, הועבר לכאן מקובץ הזיכרון ב-2026-08-06 (277KB → זיכרון רזה). רשומות מ-2026-08-02 ואילך נשארו בזיכרון הפעיל. כל שורה כאן מקורית, לא נוסחה מחדש.

## 🆕🆕🆕 (2026-07-30): **בוחן מושגים — 3 רמות שהתלמיד בוחר + תיקון RTL בשורש** (4 קומיטים `a56fff4`→`e33b225` → חי)

איתי ביקש שני דברים: (1) שלוש רמות בבוחן המושגים שהתלמיד יבחר לפי יכולתו — רמה 1 מושגי יסוד כמו היום, רמה 2 בינונית, רמה 3 **ברמת בגרות** — עם הסבר צמוד ואופציה לרמז, הכל ל-5 יחידות ו-3/4 יחידות בהמשך; (2) שהמתמטיקה בתשובות הסופיות של הפתרונות תהיה משמאל לימין. תוכנית: `plans/gentle-drifting-thunder.md`. **החלטות איתי (AskUserQuestion):** 6 שאלות לכל (נושא×רמה) = 252 · **אין נעילה** בין רמות · פיצול לקובץ-לנושא.

**🔴 סיבת השורש של ה-RTL (`a56fff4`):** כל כללי ה-LTR ב-`globals.css:261-284` מסוקפים מאחורי `:is(.chat-md, .math-content)` ואין כלל בסיס. עם `<html dir="rtl">`, `.katex` בלי אחת המחלקות **יורש RTL**. ב-`app/quiz/page.tsx` היו 12 קריאות MathText ורק 8 עם `math-content` — 4 החסרות כולן בבלוק "הטעויות שלך בבוחן" (שורות 779/783/788/793), ותשובות בוחן-מושגים הן מתמטיקה טהורה. **התיקון:** רצפת `.katex{direction:ltr;unicode-bidi:isolate}` **לא-מסוקפת** (רכה, בלי `!important`, הכללים המסוקפים עדיין גוברים) + **מחיקת עותק MathText מקומי שהאפיל** על `components/practice/MathText.tsx` (היה קפוא לפני התיקון של 2026-07-28: בלי remarkGfm, ו-inline החזיר fragment עירום) + `math-content` על כל 12. **אימות פוסילבילי בדפדפן:** ניטרול `direction` בזמן ריצה → `rtl`, החזרה → `ltr`.

**ארכיטקטורה (`985dc2a`):** `571.ts`+`582.ts` (90KB+64KB, שמות מיושנים) → `content/concept-quiz/types.ts` + **14 קבצים ב-`math5/`** בשמות של `content/lessons/math5/*.ts`. **הרגיסטרי ממופתח `${subject}:${topic}`** — הכרחי כי math4 חולק שמות נושאים עם math5 **ולא תמיד זהים בית-בבית** (math5: `גיאומטריה אוקלידית`, בורר math4: `גאומטריה אוקלידית`, תו אחד הבדל!) → מזג שטוח היה מגיש שאלות 5 יח' לתלמיד 4 יח'. `ConceptQuestion.difficulty` → **`level: 1|2|3`**, ו-`LEVEL_DIFFICULTY` הוא **הזהות** של המיגרציה כך שההיסטוריה ב-localStorage והציון החזוי נשארים ברי-השוואה. **כל 84 המזהים נשמרו בית-בבית** (`lib/results.ts` ו-`lib/mistakes.ts` ממופתחים לפי questionId). הפיצול נעשה ע"י **חיתוך טקסט המקור** + **round-trip byte-equality** על כל 14 הנושאים — 154KB LaTeX לא שורדים העתקה ביד.

**UI (`3583070`):** מקטע "3 · בחר רמה" (CSS משלו — `/quiz` הוא אי `<style>`, בלי Tailwind), ספירות אמיתיות מ-`conceptLevelCounts`, תג "מומלץ לך" מ-`studentTier` **בלי נעילה**, מצב "עדיין בכתיבה" עם הסבר למה. `lib/concept-level.ts` חדש (מפתח `bagrut-concept-level-v1` פר-מקצוע, **לא** על StudyPlan). `pickShuffled` חדש ב-adaptive — **לא** `pickQuestions`, שה-TIER_MIX שלו היה מדלל את הרמה שהתלמיד בחר. `perSession` 5/5/**4** (שאלת רמה-3 היא סעיף בגרות אמיתי). כפתור "💡 בקש רמז" חד-פעמי לפני המענה (לא auto-reveal כמו QuestionRunnerCard — לבוחן אין retry). **startQuiz גוזר את הרמה בעצמו** כי ה-deep-link auto-start רץ ב-`setTimeout(0)` ומקדים את ה-mount effect.
- **תיקון חינם:** `adaptBankQuestion` **השליך את `hint`** — יש **~598 רמזים כתובים בבנקי השיעורים** שהיו מתים בכל מסלול הבוחן.
- **צד שרת:** `lib/concept-prompt.ts` חדש — `buildConceptPrompt` היה **משוכפל** ב-route וב-generate-pool ושניהם עוד אמרו "שאלון 581/582". תווית היחידות עכשיו מ-`unitLevel` ולא מניחוש לפי subject key. **`questionsSchema` לא אכפה `answers` באורך 4 ולא `correct` 0-3** (ה-UI מרנדר `undefined` לאופציה חמישית) — תוקן בשני העתקים + `hint` חובה. **pool bucket = `concept-l1|l2|l3`** (בלעדיו בקשת רמה 3 מקבלת שורה שנוצרה לרמה 1; `kind` הוא text → אין SQL). מזהה AI **חייב להשתנות פר-generation** אחרת סבב שני נספר `repeat` ב-`readSeen()` ונופל מהדיוק.
- **שערים:** `verify:concept`/`verify:concept:strict`/`verify:quiz` ב-package.json, ו-`verify:concept` **חובר ל-`npm run check`** (קיים אבל רץ רק ידנית = לא רץ). `verify-concept.ts` נכתב מחדש עם הפרדת חומרה + **טבלת מצאי** שהיא רשימת העבודה. חוקים חדשים: טווח level · id-prefix תואם-קובץ (וספרת `-L<n>-` תואמת ל-level) · ייחודיות מזהים בכל הרגיסטרי · **topic הוא מפתח ב-MATH5_CURRICULUM** (תופס את מלכודת התו האחד). `hint` ומינימום-מצאי הם **אזהרות** מאחורי `PROMOTED_TO_ERROR=false` עד שהתוכן יגיע.
- **⚠️ `verify-mcq-distinct` מכסה 39% בלבד** (אלגברה **0%**, 56 מ-96 שאלות בלי שום בדיקה) — הוא עכשיו מדפיס כיסוי פר-נושא ורשימת שאלות ללא בדיקה. ראה [[lessons-learned]].

**✅ התוכן הושלם (15 קומיטים סה"כ):** 84 → **240 שאלות**, **כל 13 נושאי הסילבוס ב-6/6/6**. גלים של ≤3 סוכנים, קובץ לסוכן. **כל 144 מפתחות התשובה החדשים נגזרו מחדש על-ידי, עצמאית מהסוכן שכתב — כל 144 נכונים.** `PROMOTED_TO_ERROR=true` (חוסר רמז / חוסר מצאי = שגיאה).

**🔴 החלטת איתי (2026-07-30): גדילה ודעיכה — "זה מחוץ לחומר", לא לכתוב.** הפטור **נגזר מ-`weight:'out-of-scope'`** ב-MATH5_CURRICULUM ולא מקודד בשם, כך שיחול גם על סטטיסטיקה וייעלם לבד אם הסילבוס ישתנה. הפטור **לא** מרפה בדיקות נכונות ו**לא** מסתיר את המצב (השורה מודפסת עם "מחוץ לסילבוס, לא נספר ליעד", והשורה המסכמת סופרת בנפרד: "missing to target: 0 (plus 12 out-of-syllabus)"). ⚠️ **סוכן גדילה-ודעיכה כן סיים** את הקובץ ל-6/6/6 לפני שנפל על מגבלת סשן — **החזרתי (revert)**, כי לא גזרתי את 12 המפתחות בעצמי. שער ירוק אינו ראיה למתמטיקה נכונה.

**⚠️ מה שלא אומת חי: `/quiz` מאחורי auth והניווט המקומי אליו נחסם ע"י classifier.** איתי צריך לאמת בעצמו את בורר הרמות ואת מסך הטעויות. מה שכן אומת בדפדפן: הרצפה הלא-מסוקפת (ניטרול בזמן ריצה: ltr→rtl→ltr), `/practice` עם 248 נוסחאות 0 לא-LTR, `/roadmap` עם 81 עוטפים כולם `dir="rtl"` ואפס פירוק ב-flex, וסדר קריאה נכון ל-`$math$, $math$ ו-$math$`.

**📊 מדד כיסוי `verify-mcq-distinct` (חשוב):** 38% מהאופציות ניתנות להשוואה, **143 מ-240 שאלות ללא שום בדיקה מכנית**. שני תיקונים בסקריפט בסשן: (1) המדד ספר אופציה כמכוסה כשעברה את מסנן התחביר בלי שהוערכה — `$e^x+C$` עובר ו-mathjs נכשל; תוקן ל-`{evaluated,equal}`. (2) מפענח `\frac` נשבר על מונה עם `\sqrt` (`FRAC(5sqrt(2))(6)`) — הוחלף בפרסר סוגריים מאוזנים. הסקריפט מדפיס כיסוי פר-נושא + רשימת שאלות ללא בדיקה, ואומר במפורש שמעבר פירושו "לא נמצאה כפילות בין הזוגות שיכולתי להשוות".

## 🆕🆕🆕 (2026-07-28, סוף): **הסבר פר-מסיח לכל 563 שאלות ה-MCQ + 3 שערים חדשים** (נדחף `c5dcb84` → חי)

הפיצ'ר "תקבל הסבר למה התשובה שבחרת שגויה" (מובטח בדף הבית) היה **מת**: הקוד מחווט אבל **484 מ-485 שאלות מאגר-השיעורים היו בלי `distractorNotes`**. עכשיו **563/563 מכוסות** (מאגר + בוחן מושגים). גלים של ≤3 סוכנים, קובץ לסוכן; כל `verify-<topic>.ts` **זהה לפני/אחרי** בכל 14 הקבצים.

**🔴 באגים אמיתיים שנחשפו תוך כדי — כולם מסוג "התלמיד צודק ומסומן כטועה":**
- **`int-011` מפתח תשובה שגוי.** נפח סיבוב של $f(x)=x$ על $[0,3]$ הוא $9\pi$ (גם לפי נוסחת החרוט $r=h=3$), אבל `correct` הצביע על $9\pi/2$. ה-`finalAnswer` כבר אמר $9\pi$, וב-`solution.steps` נשלחו לתלמידים **מחשבות עבודה של הכותב** — "בעצם: בודק שוב", "החסר אופציה $9\pi$ ברשימה", וההסבר הסתיים ב"בעצם תשובה ב נכונה, לא ג". מישהו ראה שהמפתח שגוי ושלח בכל זאת.
- **11 מקרים של מסיח ששווה לתשובה הנכונה בכתיב אחר:** `prob-sub-cond-002` (2/15 מול 12/90 — **והרמז עצמו אומר 4/10·3/9**), `prob-005` (1/2 מול 6/12), `vec-018` (2 מול 6/√9), `vec-sub-da-001` (3 מול √9), `ln-002` (1/x מול 3/3x), `ln-006` (ln4 מול "ln(12/3)=ln4"), `polar-de-moivre-drill-004` (−2cis90° = −2i = התשובה), ועוד. פלוס זוגות מסיחים כפולים (`eg-004` 1:2/2:4, `eg-sub-sim-001` 2:3/4:6, `cx-sub-roots-002` 9/∛27·3).
- `prob-002` קרא לצורות האדומות "לב ו**טארו**" (טארו אינו צורה) → "לב ויהלום".

**3 שערים חדשים:** `verify-distractors.ts` (כיסוי + זיהוי מערך-מוזז דרך "הערה על ה-correct"), `verify-mcq-distinct.ts` (mathjs משווה כל זוג אופציות מספרית; **תופס את כל מחלקת הבאגים הזו**), `verify-concept.ts` הורחב (הערה לכל מסיח + `why_correct`≥60) והכותרת שלו אומרת עכשיו במפורש **שהוא לא יכול לשפוט נכונות מתמטית**.

**⚠️ לקח חוזר — כל גלאי חדש נבדק על קורפוס ידוע-תקין לפני שסמכתי עליו, וכל אחד נכשל בפעם הראשונה:** גלאי אי-התאמה סימן 15 מ-85 שאלות תקינות (הנחת היסוד שגויה — הערה טובה מסבירה את ה*תהליך* ומצטטת את האופציות האחרות) → **נמחק**. `verify-mcq-distinct` השווה משוואות כבוליאנים (30 רוחות: `x²+y²=5 == |x|+|y|=5`), ואז הפשיט `y =` כתווית-פונקציה וקבע שאסימפטוטה אופקית ואנכית זהות. ratios `a:b` היו בלתי-נראים כי **mathjs קורא `1:2` כאופרטור טווח** ומחזיר מטריצה→NaN שנבלעה בשקט.

**💀 `content/lessons/math5/exponential.ts` הוא קוד מת** — `content/lessons/index.ts` מייבא 15 מ-16 קבצי math5 והוא היחיד שלא. 600 שורות, 10 שאלות, מזהים כפולים (`exp-001`…) עם `exp-functions.ts`. **החלטה לאיתי:** למחוק או לחווט.

**⏭️ נשאר:** `/quiz` מאחורי auth ולכן מסך "למה התשובה שבחרת שגויה" **לא אומת חי** · `exp-sub-int-drill-001` ו-`int-sub-basic-001` מציעים תשובה עם ובלי `+C` (נראה מכוון — ה-`+C` הוא התוכן הנבדק) · `statistics.ts` never-touch עם 12 אימוג'י.

## 🆕🆕 (2026-07-28, המשך): **בוחן המושגים — הסבר פר-מסיח + אימות מתמטי של 84 שאלות** (נדחף)

איתי צילם שאלה מהבוחן: בחר "אין פתרון" ל-$e^x=1$ וקיבל הסבר על $e^1=e$. "מסביר גרוע... הדברים ממש לא מדויקים והשאלות גם כן".

**סיבת השורש:** `explanation.why_wrong` הוא **מחרוזת אחת לכל שאלה** — מבנית לא יכולה להתייחס לתשובה שנבחרה. ביקורת: **רק 1 מ-84** שאלות כיסתה את שלושת המסיחים, **48 לא כיסו אף אחד**, ו-31 `why_correct` היו מתחת ל-60 תווים.

**התיקון:** `distractorNotes: string[]` נוסף ל-`ConceptQuestion` (אחד לכל תשובה, ריק ב-`correct`). `app/quiz/page.tsx` מרנדר **קודם** את ההערה של התשובה שהתלמיד בחר (רק בטעות). `checkAnswer` כבר שמר את האינדקס הלא-מעורבב ו-`adaptBankQuestion` כבר העביר את השדה → **גם מסלול מאגר-השיעורים מקבל את זה חינם**. כל 84 קיבלו הערות פר-מסיח + כל 84 ה-`why_correct` נכתבו מחדש.

**⚠️ `verify-concept.ts` בודק מבנה בלבד** — הכותרת שלו עכשיו אומרת זאת מפורשות. "84/84 עבר" **מעולם לא** אמר שהמתמטיקה נכונה. עכשיו אוכף גם: הערה לכל מסיח + `why_correct` ≥60 תווים.

**אימות מתמטי עצמאי של כל 84:** את 36 של 582 גזרתי בעצמי אחת-אחת; את 48 של 571 בדק סוכן read-only ייעודי. **כל 84 מפתחות התשובה נכונים.** הפגמים היו במסיחים ובהסברים:
- `|(2,3,6)|` הציע `41` — שום חישוב לא מייצר אותו (→ `49`)
- מכפלת שיפועים ביקשה **ערך** והציעה "שיפועים שווים" (יחס) — שגיאת קטגוריה (→ `$-2$`)
- `cq-func-4` הגזע הצהיר "יש אסימפטוטה" והציע "אין אסימפטוטה" — סתירה עצמית (→ `$y=1/2$`)
- `cq-alg-1` הציע `m<6` שהוא **נכון** (מספיק אך לא מלא) — הגזע תוקן ל"תחום הערכים המלא"
- `cq-trig-3` מסיח לא-אחיד (ריבוע על 2 מ-3 איברים) שאף תפיסה שגויה לא מייצרת
- `∫(1/x)dx` בלי תחום — גם `ln x + C` נכון (→ הגזע אומר "בכל תחום ההגדרה")
- "צירי הצירים", "אותו קשת" ×3, ו-3 גזעים עם מילת-יחס כפולה ("תלוי ב: **ב**כמות")
- 7 אמירות שגויות בהערות שנכתבו זה עתה (הבולטת: `cq-prob-6` תיאר את $3/5$ כ"רק הראשון אדום" — שזו דווקא התשובה הנכונה $3/10$)

**🔴 פער גדול שנמצא ולא טופל: 484 מתוך 485 שאלות MCQ במאגר השיעורים אין להן `distractorNotes` כלל.** הקוד מחווט (adaptBankQuestion מעביר, QuestionRunnerCard/סקירת-הטעויות קוראים) אבל הנתונים מעולם לא נכתבו — הפיצ'ר מת במסלול הלמידה. **החלטת היקף לאיתי.**

**⏭️ נשאר:** דחיפת 3 הקומיטים · 484 שאלות המאגר · `/quiz` מאחורי auth ולכן המסך החדש לא אומת חי.

## 🆕🆕🆕 LATEST (2026-07-28): **תיקון מנוע ה-bidi + מעבר תוכן על כל 58 תתי-הנושאים** (20 קומיטים מקומיים — ⚠️ **לא נדחפו**)

איתי צילם כרטיס מ**מסלול הלמידה → מרוכבים → משוואות במרוכבים → "לומדים"**: תיבת "לזכור" הוצגה כבלגן של 3 עמודות. דרישתו: "תסדר את זה ותוודא ששאר הדברים כמו שצריך כי הכי חשוב זה **דיוק**".

**סיבת השורש (לא תוכן — רינדור):** `MathText.tsx` במצב `inline` החזיר **fragment עירום** בלי אלמנט עוטף ובלי `dir`. `LearnLevel.tsx` מרנדר את keyPoints ב-`<li className="flex gap-2 ... chat-md">` → כל `.katex` הפך ל-**flex item נפרד** מופרד ב-`gap-2`. בנוסף `globals.css:140` (`.chat-md > * + *`) הזריק `margin-top:0.65em` לכל נוסחה אחרי הראשונה. **תיקון:** שני המצבים מחזירים אלמנט אחד (`<span class="mathtext-inline">` / `<div class="mathtext-block">`), `dir="rtl"` ולא `auto`. **למה לא auto:** KaTeX פולט `<annotation>` מוסתר-ב-clip עם ה-LaTeX הגולמי, ו-`dir=auto` סופר אותו → שורה עברית שפותחת בנוסחה מקבלת תו-חזק לטיני ומתהפכת. `.chat-md` עבר מה-flex לתוך `<div className="chat-md flex-1 min-w-0">` (כל כללי `.chat-md` הם descendant!). הכל מתועד ב-CLAUDE.md + STYLE_GUIDE.

**⚠️⚠️ הכלל הישן ב-STYLE_GUIDE בוטל:** "אל תסיים משפט ב-`$math$.`" ו"אל תפתח שורה בנוסחה" היו **עקיפות לבאג שתוקן בשורש**. אומת בדפדפן ששתי הצורות מתרנדרות נכון. אל תחזיר אותן — הן מייצרות ~9,600 false positives.

**`scripts/verify-content.ts` חדש** (מחליף check-katex-hebrew) — מייבא מודולים ב-tsx ולא grep, כי חצי מהכללים תלויי-שדה. errors: עברית-במתמטיקה / `$` אי-זוגי / `$$` באמצע שורה. warnings: אימוג'י דקורטיבי / keyPoint<30. `npm run check` = typecheck+verify:content+build (**לא** משורשר ל-build כי Vercel).

**`scripts/verify-trig-angles.ts` חדש** — ⚠️ **`verify-trig.ts` לא קורא את קובץ התוכן בכלל**, הוא מקודד עובדות מתמטיות בעצמו ועובר 77/77 בכל מקרה. הבודק החדש קורא את המחרוזות ופותר כל משוואה מספרית.

**החלטות איתי:** (1) keyPoints = **טריגרים ומלכודות, לא חזרה על נוסחאות** (STYLE_GUIDE כלל 7). (2) **טריגונומטריה: מעלות** במשוואות/זוויות-מיוחדות, **רדיאנים בחדו"א** — האחרון חובה מתמטית, `(sin x)'=cos x` נכון רק ברדיאנים.

**14 קבצי תוכן עברו** (גלים של ≤3 סוכנים). כל `verify-<topic>.ts` **זהה לפני/אחרי** (complex 46 · vectors 105 · analytic 126 · exp 115 · trig 77 · algebra 89 · ln 170 · functions 102 · derivatives 80 · integrals 86 · sequences 56 · probability 77 · growth 56 · euclidean 57). `LearnLevel` מסנן נוסחאות שכבר נלמדו בשלב (72/123 היו כפולות).

**באגים אמיתיים שנתפסו ותוקנו:** 🔴 **`seq-006` סימן תשובה נכונה כשגויה** (`correct:0`→`$n=10$` בזמן שהפתרון הוא `$n=11$`) · `$q=1+r\%$` בבקסלש בודד → `%` פותח הערת LaTeX ו-KaTeX בלע את השאר · `ln-function.ts:2503` `$` לא נסגר · `$$` באמצע פרוזה ×3 · התנגשות `d` בנוסחת מרחק נקודה-מישור · הסבר שגוי באלגברה (טען שהפרבולה פותחת לשני כיוונים) · `אקצנטריות` בשני איותים · ז.ז.צ מול צ.ז.ז-משלים לאותו משפט · 8 מקומות בלשון נקבה · `$\ln|$מכנה$|$` שדחף עברית בין שני איי-מתמטיקה.

**⏭️ נשאר:** **הפוש עצמו** (20 קומיטים ממתינים) · `statistics.ts` (never-touch, 12 אימוג'י + 0 subTopics) · שני פערים מבניים ב-`integrals` (חלוקת פולינומים בסיכום שלא נלמדת בשום מקום; `int-bag-006` דורש הצבה כללית ומתויג לתת-נושא שמלמד רק לינארית) · התנגשות `P` (קרן מול אוכלוסייה) ב-`growth-decay` · `FormulaSheet` לא אומת חי (מאחורי auth).

## 🆕🆕🆕 LATEST (2026-07-27): **שדרוג המורה-הפרטי + הבוחן-המהיר + חיסכון API** (6 קומיטים `5a20ce9`→`68507a2` → חי)

איתי: "תעבור שוב על בגרות בכיס — על הצ'אט (המורה הפרטי) ועל מסלול הבחינה המהירה, מה לשפר לרמה הכי טובה לתלמיד; וחשוב מאוד שעלויות ה-API של הצ'אט יהיו כמה שיותר חסכוניות." סריקה (3 Explore + אימות-קוד ישיר) גילתה תשתית פדגוגית טובה אבל **מורעבת מנתונים** ועלויות דולפות. **החלטות איתי (AskUserQuestion):** (1) מודל צ'אט=**Sonnet+effort:low**; (2) **לכתוב בנק 571 מלא**; (3) זיכרון-תלמיד=**תמונת-מצב בכל הודעה בלבד**; (4) **לסגור auth ל-/api/questions מיד + מכסה יומית**. תוכנית: `plans/valiant-hopping-globe.md`.

- **Phase A — עלות/אבטחה (`5a20ce9`):** `/api/chat` קיבל `output_config:{effort:'low'}` (pass-through `as any` כמו questions route; thinking כבוי-במחדל ב-Sonnet 4.6) — חוסך משמעותית. **תיקון באג 400 אמין:** חלון 6-ההודעות עלול להתחיל ב-assistant → Messages API דורש user-ראשון → 400; מוסיף `while(context[0].role==='assistant') context.shift()`. **`/api/questions` היה ה-endpoint היחיד בלי auth** (רק Origin+rate-limit-בזיכרון שמתאפס בכל cold-start) → נוסף `auth.getUser()`→401 + **מכסת AI יומית** (`ai_generation_log` table, קבועים `FREE_DAILY_AI_QUIZ=30`/`PRO=200` ב-access.ts, degrade חינני אם הטבלה חסרה — **⚠️ איתי מריץ ה-SQL בהערה בסוף route.ts**). ניקוי `buildBagrutContext` מת. אומת חי: שני ה-endpoints מחזירים 401 בלי session.
- **Phase B — זיכרון-תלמיד (`e6fdc56`):** **`lib/tutor-context.ts` חדש** — `buildStudentSnapshot(subject,topic)` מרכיב בריף עברי ≤1800 תווים (topCategory, יחידות+tierLabel, mistakesForPractice(3), daysUntilBagrut, dueCount). `app/chat/page.tsx` שולח אותו כ-`context` ב-body → **השרת כבר היה מחווט** (route.ts מזריק ל-turn הנוכחי בלבד, לא נשמר) אבל **אף לקוח לא שלח**. מפעיל את כללי "אבחן לפני" + "התאם לתלמיד". גם ה-`SYSTEM_PROMPT` ה-legacy (דף-בית/בוחן→/chat חשוף) נעשה סוקרטי. קופי EmptyState תוקן (10 לא 20).
- **🔴 באג "שגיאת צ'אט בכל הודעה" — הסיבה האמיתית: `effort` לא נתמך על Haiku 4.5 (`d6f4400`):** הצ'אט הגנרי (בלי `?topic=`, מדף-הבית) רץ על `claude-haiku-4-5`, ו-Haiku **מחזיר 400 "This model does not support the effort parameter"**. ה-`effort:low` מ-Phase A הוחל על ה-`.create()` היחיד → שבר את נתיב Haiku. **התיקון: לגדר ב-`useSonnet`** (`...(useSonnet ? {output_config:{effort:'low'}} : {})`) — Sonnet (מעוגן) מקבל effort, Haiku (זול ממילא) לא. אומת מול API: haiku+effort→400, haiku בלי→OK, sonnet+effort→OK. **effort נתמך רק על Sonnet/Opus (4.6+), לא Haiku 4.5 / Sonnet 4.5** (ראה [[lessons-learned]]).
- **Phase C — streaming (`611d292`→בוטל `ca13c07`→הוחזר מאומת `8b0a676`):** ה-"שגיאת צ'אט" המקורית הייתה **באג Haiku+effort**, לא ה-streaming. אחרי תיקון ה-effort-gating, איתי ביקש להחזיר streaming "עם אימות חי". **הוחזר עם:** effort מגודר ל-Sonnet, שמירת-supabase **awaited לפני `controller.close()`** (מלכודת serverless = עבודה אחרי סגירת התגובה; פה לא), בלי header Connection. **אימות חי:** route זמני בלי-auth (`app/api/streamtest`, ⚠️ מחוק אחרי) על שרת Next.js אמיתי → curl הראה `meta→9×delta→done` + סגירה נקייה לשני הנתיבים, ה-done אחרי כתיבה-מדומה 300ms. **⚠️ לקח: תיקיית `app/_x` עם קו-תחתון = private folder ב-App Router, לא נתבת** (ה-route הזמני החזיר 404-HTML עד ששיניתי שם). הצ'אט עכשיו **streaming חי** + effort:low(Sonnet) + context + socratic + 400-fix.
- **Phase D — בוחן מהיר (`63ab9a0`+`68507a2`):** **`content/concept-quiz/571.ts` חדש** — 48 שאלות מושגים (8 נושאי-ליבה×6), **כל 48 מדדי correct אומתו ידנית ע"י גזירה עצמאית** (3 סוכני-sonnet drafted, אני assembled+verified). `index.ts` ממזג 571+582. עד עכשיו **תלמיד 571 קיבל 0 בנק סטטי** → כל בוחן=Sonnet חי; עכשיו **0 קריאות AI**. `app/quiz/page.tsx`: (a) fallback לבנק-lesson (getQuestions) לפני AI; תיקון gate deep-link (hasConceptBank||hasQuestionBank); (b) התאמת-רמה `pickQuestions(studentTier)`; (c) **סקירת-טעויות בסוף** (chosenText/correctText/distractorNote — ה-distractorNote היה מושלך ב-adaptBankQuestion); (d) דלתא-תחזית + `sonner` toast + `fetchWithTimeout`. `verify-concept.ts` מכסה שני השאלונים = 84 שאלות 0 בעיות.

**⏭️ נשאר לאיתי לאמת חי (מאחורי auth):** streaming בצ'אט (התנהגות מלאה), תמונת-מצב מגיעה למודל (Network body), איכות המורה עם effort:low. **⚠️ איתי מריץ SQL של `ai_generation_log`** בדשבורד (בלעדיו auth-בלבד). לא-בסבב: timer/סימולציה בבוחן (הוחלט: הבוחן=חימום-מהיר, לא בחינה; סימולציה קיימת ב-Pro advanced-course).

## 🆕 LATEST (2026-07-26, מאגר 571): **שאלון 35571 (4 יח') נפתח** — Q1 נדחף `1c64cff` → חי

איתי העלה PDF פתרונות של **יואל גבע** ל-35571 קיץ 2022 מועד א' וביקש במאגר בסגנון שלנו. **IP:** איתי אישר "**השראה מותרת, העתקה לא**" — המתמטיקה נחלת הכלל, רק הניסוח/שרטוטים של גבע מוגנים (ראה [[lessons-learned]]). לכן פותר כל שאלה מאפס + סקריפט אימות + ניסוח/שרטוטים מקוריים; `solutionSource:'authored'`, מקור בהערה = משה"ח.
- קובץ חדש **`2022-summer-571-moed-a.ts`** (`bagrut2022Summer571MoedA`), רשום ב-index. **Q1 אינדוקציה** נדחף (א: `4^n-1` מתחלק ב-3; ב: `p=8`). אומת BigInt.
- **מבנה השאלון = 6 שאלות** (⚠️ תוקן! תוויות גבע "א1/ב1/ג1/ד1" = **שאלה 1, סעיפים** א/ב/ג/ד, לא 4 שאלות — ראה [[lessons-learned]]): **שאלה 1** = 4 סעיפים בשאלה אחת (א אינדוקציה · ב חקירת `(2-1/x)^3` · ג אינטגרל `h(t)` · ד גאומטריה מעגל `∠F=180-4α`) ✅ `56bf66b` · **שאלה 2** סדרה הנדסית ✅ · **שאלה 3** הסתברות ⏭️ · **שאלה 4** גאומטריה `R=8/√3` דמיון ⏭️ · **שאלה 5** טריגו מרובע-חסום `α=75°` ⏭️ · **שאלה 6** חקירת `2x+2/x` ⏭️. השאלון מאוחד ל-`2022-summer-571-moed-a.ts` (`bagrut2022Summer571MoedA`). ⏭️ ממשיך שאלה 3+.

## 🆕🆕🆕🆕🆕🆕🆕🆕🆕🆕 LATEST (2026-07-26): **שדרוג מסלול-הלמידה Phase 0-3 + מעבר ל-572/571** (`3d3014f`→`4fa5bcd` → חי)

**🔴🔴 קריטי — שינוי סילבוס (`4fa5bcd`):** איתי: "בתי הספר בישראל עברו כבר משאלונים 582/581 ל-572/571, גדילה-ודעיכה יצאה מהסילבוס." אישר רלייבל מלא (AskUserQuestion). **`BagrutPaper` עכשיו `'571'|'572'`** (היה '581'|'582') ב-`content/bagrut-curriculum.ts`. מיפוי: **581→571, 582→572**. כל הצרכנים תוקנו (tsc סימן כל אחד): onboarding/practice/AppChrome/BagrutBadge/roadmapData(`DEFAULT_PAPER='572'`)/prediction(PAPER_WEIGHTS)/quiz. **גדילה-ודעיכה → `weight:'out-of-scope'`** (כמו סטטיסטיקה — יורדת מהמסלול/בוחן/בחירה; התוכן נשמר, לא נמחק). **מיגרציית legacy ב-`getPaper` (study-plan): `'582'→'572'`, `'581'→'571'`** — תלמידים קיימים לא מאבדים כלום. ⚠️ **מעכשיו כל התוכן/הבדיקות מדברים 572/571, לא 582/581.** (past-bagruyot כבר השתמש ב-571/572 אמיתיים → עכשיו כל האפליקציה עקבית.) ה-`content/lessons/math5/*` עדיין בשמות-נושאים (מעריכית/ln/אנליטית/וקטורים/מרוכבים) — התוכן זהה, רק המספור השתנה.

**⚡ איתי הריץ את `supabase-learning-path.sql` בדשבורד → סנכרון חוצה-מכשירים פעיל.**

**Phase 3 — חזרה מרווחת Leitner (`d709e8f`):** `lib/review.ts` חדש — קופסאות `[1,3,7,16,35]` ימים, `seedFromMiss`(טעות→קופסה1), `seedFromClear`(mid/hard→שאלה לבדיקה), `gradeReview`(נכון→+1/טעות→1+lapse), `dueItems`/`dueCount`/`dueCountBySubTopic`/`resolveQuestion`, backfill מהטעויות, cap 300, מפתח `bagrut-review-v1`. `QuestionRunnerCard` מזין: source='review'→gradeReview אחרת טעות→seedFromMiss. **`app/roadmap/review/` חדש** (מסלול חזרה יומי, ≤15, אותו QuestionRunnerCard, בלי כוכבים). מפה: כרטיס "🔁 הכי חשוב היום" + תג 🔁N על צמתים; /errors CTA "התחל חזרה". `SubTopicLadder` קורא `seedFromClear` בהצלחה-ראשונה. **`scripts/verify-review.ts` חדש 8/8**. אומת חי: כרטיס+תג, /roadmap/review מרנדר שאלה אמיתית, נכון→קופסה1→2 due+3d, 0 שגיאות.

**⏭️ נשאר: Phase 4** (העמקת-582: ~150 `expected` specs לשאלות פתוחות + דרילים לגדילה-ודעיכה + קורס-מתקדם וקטורים/גדילה + שרטוטים — **מאמץ authoring גדול, גלי-סוכנים ≤3**; `verify-ladder.ts` שער-שלמות), **Phase 5** (why-wrong 1-חינם/יום), **Phase 6** (learn צעד-אחר-צעד + גדירת-נושאים + מחיקת dead code: SubTopicPractice/pickQuestions/isPassingScore).

**Phase 2 — סנכרון+resume+pacing (`f583745`):** (1) **סנכרון Supabase:** `supabase-learning-path.sql` חדש (טבלת `learning_state` jsonb per-user + RLS + טריגר) — **⚠️ איתי צריך להריץ פעם אחת בדשבורד כדי להפעיל sync חוצה-מכשירים** (בלעדיו degrade שקט). `lib/sync/roadmap-sync.ts` חדש: pull→merge→push, **מיזוג מונוטוני max-wins** (מתכנס בכל סדר, אפס אובדן), best-effort try/catch. מחווט ב-`AppChrome` (pull במאונט, push ב-dirty-debounce/visibilitychange, **adopt+pull בהתחברות** = תלמיד אנונימי שומר הכל). `roadmap-progress.writeAll`+`study-plan.savePlan` פולטים `'bagrut-state-dirty'`; `/roadmap` מאזין `'bagrut-state-synced'`+נאדג'-התחברות-אנונימי. (2) **`lib/roadmap-resume.ts` חדש** — `getResumePoint` → כרטיס-hero "המשך מאיפה שהפסקת"; **`SubTopicLadder` תומך `?level=<kind>`** (deep-link, מתקן גם "חזור להסבר"). (3) **`buildRoadmapFromPlan`** (roadmapData) — נושאי-התוכנית קודם בסדר-התלמיד + מפריד "נושאים נוספים"; **`lib/pacing.ts` חדש** `computePacing` (ימים-לבגרות/שלבים-ליום/יעד-יומי/סטטוס/הודעה-מתוכתבת). אומת חי: כרטיס-המשך→`?level=easy` פותח ישר לרמה, פס-קצב "40 ימים·יעד 25", סדר לפי תוכנית, sync-בלי-login=0 שגיאות. **⚠️ לקח שחזר: אחרי `npm run build` צריך `rm -rf .next` לפני `next dev`** (production artifacts שוברים dynamic routes ב-dev → 404).

## 🆕 (2026-07-26 מוקדם יותר): **Phase 0+1 (אמינות)** (`3d3014f`+`db57141` → חי)

איתי: "במסלול הלמידה שום דבר לא מרגיש מספיק מקצועי ומדויק... אני מציג לתלמידים וצריך שירצו לשלם." סריקה (3 Explore + Plan + אימות-קוד) גילתה שהבעיה **אמינות, לא עיצוב**. תוכנית: `plans/refactored-swinging-puddle.md` (6 phases). **החלטות איתי (AskUserQuestion):** אמינות-קודם · רף-מעבר 60%+ניסיון-חוזר-אף-פעם-לא-נועלים · **רק 582** (לא 581/4יח') · **כן** לסנכרון-שרת (הוא יריץ SQL).

**Phase 0 — טריאז' אמינות (`3d3014f`):** (1) **הבאג הכי חמור:** תשובות MCQ אף פעם לא עורבבו במסלול — **428/492 שאלות כתובות `correct:0`** (א'), תלמיד שלוחץ תמיד א' קיבל ~97%. תוקן ב-`RoadmapLevelRunner`/`MicroDrill`/`quiz` עם `seededOrder(n, id)` (הכלי כבר היה בשימוש ב-3 רכיבים אחרים — המסך הראשי היחיד שפספס). (2) תויגו **29 שאלות בגרות יתומות** (`subTopicId` חסר) ל-14 נושאים — script `retag.mjs` + CRLF-aware ל-exp/ln (⚠️ **exp-functions.ts + ln-function.ts הם CRLF**, שאר הקבצים LF). (3) dedup תוצאות ב-`lib/results.ts` (`repeat` flag: replay נספר כפעילות אבל לא כדיוק/תחזית — `measured()` מסנן ב-topicStats/subTopicStats/totalStats); `markStep(topic,'practice')` רק כשכל תתי-הנושאים done; הוסר צ'יפ tierLabel (no-op); תווית-שאלון דינמית ב-/practice. **`scripts/verify-mcq-balance.ts` חדש** (שומר: post-shuffle אף סלוט לא >40%).

**Phase 1 — שליטה+משוב אמיתיים (`db57141`, הלב):** **`lib/roadmap-mastery.ts` חדש** — `PASS_RATIO`(learn0/easy0.6/mid0.6/hard0.5/bagrut0.5), `didPass`, `computeStars`(0-3, retry תקרה 2★, force 0★, learn-בלי-דרילים 1★), `retrySet`. **`submitLevelResult` מחליף `markLevelCleared`** ב-`roadmap-progress` — מחליט עבר/נכשל, `attempts` ב-LevelRecord, `levelAttemptedNotCleared` (ענבר). **`QuestionRunnerCard.tsx` חדש** (per-question feedback, משמש גם Phase-3 review): טעות→רמז→נסה-שוב(ניסיון-ראשון-נספר)→steps+finalAnswer+**explanation**+MistakeTagger+why-wrong; open עם `expected`→`checkAnswer` דטרמיניסטי, unparseable=לכתוב-שוב-לא-טעות. **`PracticeQuestion.expected?` נוסף** (types.ts) — כרגע לא מאוכלס בתתי-נושאים (Phase 4 יאכלס; verify-specs מורחב לסרוק אותם). **`LevelFailedPanel`** (ladder-ui): "כמעט", retry-רק-הטעויות, חזור-ללומדים, "המשך-בכל-זאת" רק אחרי 2 כשלונות. **תיקון reveal=correct** ב-`QuestionPartCard` (showFullSolution/nextStep כבר לא קוראים onDone — חייבים self-assess). LearnLevel נשען על MicroDrill.onAnswered.

**אימות חי מלא** (מפתח-node `אלגברה::quadratic-equations`): למידה-בלי-דרילים→1★ (לא 3★ חינם), טעות→משוב-מלא נראה, MCQ מעורבב, **1/3→נכשל (`cleared:false stars:0`)** = הבאג המרכזי סגור, fail-panel נכון, retry=2-שאלות-בלבד. 16 בדיקות-רף מתמטיות, verify-mcq-balance (87.5%→21/27/24/28% post-shuffle), verify-specs 126/126, tsc+build(43/43), 0 שגיאות-קונסול. commits ב-pathspec (WIP מקבילי: complex-numbers/statistics/past-bagruyot/untracked — לא נגעתי).

**⏭️ נשאר בתוכנית:** Phase 2 (סנכרון Supabase — **איתי יריץ `supabase-learning-path.sql`** + resume + pacing לפי תאריך-בגרות), Phase 3 (חזרה-מרווחת Leitner), Phase 4 (העמקת-582: `expected` specs + דרילים לגדילה-ודעיכה + קורס-מתקדם וקטורים/גדילה + שרטוטים), Phase 5 (why-wrong 1-חינם/יום), Phase 6 (learn צעד-אחר-צעד + ניקוי). **לא בסבב:** 581/4יח'.

## 🆕 (2026-07-24): **המאגר מתרחב ל-4 יח' (571/572)** — נדחף `6e001a4` → חי

## 🆕 LATEST (2026-07-24): **המאגר מתרחב ל-4 יח' (571/572)** — נדחף `6e001a4` → חי

איתי שלח שאלה+פתרון של **קיץ 2024 מועד ב' שאלון 572** (גאומטריה אנליטית: מעוין שאלכסוניו על הצירים, מעגל חסום, נקודת השקה, מקום גאומטרי→פרבולה $y^2=4x$, ושני מעגלים משיקים). **גילוי חשוב:** האפליקציה מורחבת ל-**4 יח'** ע"י **סשן מקביל** — `BagrutPaper` ב-`content/past-bagruyot/types.ts` הורחב ל-`'571'|'572'|'581'|'582'`, נוסף `2026-summer-572.ts`, וסינון-השאלון במאגר נעשה דינמי (`availablePapers()` ב-`index.ts`, במקום 581/582 מקודדים ב-`app/bagruyot/archive/page.tsx`). לכן "572" של איתי היה **מדויק, לא typo ל-582** (ראה [[lessons-learned]]). נוסף `content/past-bagruyot/2024-summer-572-moed-b.ts` (`b2024s572b-q1`, 5 סעיפים א-ה, 4 שרטוטי `custom` SVG, רמזים מדורגים + פתרון clean-stacked). **אימות עצמאי:** 22/22 בדיקות מתמטיות (`B(0,2.5)`, `M(1,2)`, `y²=4x`, `N(16,8)`, `R²=245`/`405`), `tsc` נקי, check-katex-hebrew 0, build עבר. **נדחף כחבילה קוהרנטית של 5 קבצים** (types+index+archive-filter+2024-572+2026-572) באישור איתי (AskUserQuestion: "bundle-push"), pathspec בלבד — **לא** נגררו WIP לא-קשורים (`statistics.ts`, `2020-582.ts`, dirs untracked). ⚠️ הניקוד (25) הערכה. **Q2 נוספה** (`6007b86` → חי): וקטורים במרחב (פירמידה `SABCD` בסיס-ריבוע — הבעת וקטורים `BC=2v-2w`/`DC=2v-2u`, `u·w=64`, זווית ישר-מישור ~57.99°, מישור `4x+3y-12=0`, קדקוד `B(3,0,5)`), 20/20 בדיקות עצמאיות (מודל קואורדינטות), 2 שרטוטים. **איתי אישר מפורשות ש-572 (4 יח') כולל גם וקטורים-במרחב וגם אנליטית-עם-פרבולה** אף שחשבתי שזה תוכן 5-יח' בלבד — **לא לחלוק שוב על מספר השאלון שאיתי נותן** (ראה [[lessons-learned]]). **Q3 נוספה** (`5221977` → חי): מספרים מרוכבים (פתרון `z^6+729i=0`, פסילת שורשי המכנה `z^2=9i`, שטח מרובע במישור גאוס `9√3`, סיבוב → מכפלת קדקודים `-81cis(4α)`; `α=45°`→81, מדומה טהור ב-`22.5°`→`-81i` וב-`67.5°`→`81i`), 14/14 בדיקות (אריתמטיקה מרוכבת). כך 2024-572-מועד-ב = **Q1 אנליטית + Q2 וקטורים + Q3 מרוכבים** (מבנה שנראה כמו 582, אבל איתי אישר 572). **Q4 נוספה** (`d1d3100` → חי): חקירת פונקציות מעריכיות `k=xe^x`, `m=2e^x-1`, `f=(e^x-1)/(x-1)` — אסימפטוטות, מונוטוניות, ההקשר האלגנטי `f'=(k-m)/(x-1)^2` (לכן `f'=0` בדיוק ב-`c,d`), הסבר `d>1`, תחומי עלייה/ירידה של `f`. 2 `functionGraph` (`k+m`, `f`). אומת (נגזרות נומריות, `g=k-m` בעל מינימום יחיד → 2 שורשים). **Q5 נוספה** (`c911014` → חי): חקירת פונקציית ln — `f=(2lnx-1)/x`, הפונקצייה הקדומה `g=ln^2 x - ln x` (קבוע מ-`g(√e)=-1/4`), `h=1+a/g` (`a>1/4`): אפסי `g` ב-`1,e`, תחום `h` (`x≠1,e`), **`h` לא חותך ציר `x`** (כי `g≥-1/4` אך צריך `g=-a<-1/4`), מקסימום `h` ב-`(√e,1-4a)<0`, וזיהוי גרף **II**. 3 `functionGraph`. 21/21 בדיקות. **הקובץ מכיל Q1-Q5 מלאים** (Q1 אנליטית · Q2 וקטורים · Q3 מרוכבים `z^6+729i` · Q4 מעריכית · Q5 ln — כולם על-ידי, מאומתים ודחופים). ⏭️ Q6+/Q7 כשישלח. הריפו `C:\Users\1000m\bagrut-app` **משותף לשני סשנים** (parallel 572-expansion) — push תמיד pathspec + build-gate.

## 🆕🆕🆕🆕🆕🆕🆕 LATEST (2026-07-20, מאוחר): **איחוד וסנכרון — המסלול כלב יחיד** (Phase 1-3, נדחף `43435c1`+`dd45145`+`9cd4072` → חי)

איתי: "תסרוק את כל בגרות בכיס ותראה מה לשפר — שהכל יהיה מסונכרן, מסודר ומובן." 3 סוכני-Explore מיפו: **שני מסלולי-לימוד מקבילים על אותו תוכן** (/roadmap חדש מול /practice/.../sub ישן, stores נפרדים → "הושלם בישן אבל 0/5 במפה"), **5 מערכות-התקדמות מנותקות**, **מסלול 582-בלבד** בזמן שאונבורדינג ברירת-מחדל 581, וניווט מבלבל. **החלטות איתי (AskUserQuestion):** ארגון-קודם-תוכן · **המסלול = הלב היחיד** · המסלול לפי השאלון שנבחר + יסודות. תוכנית: `plans/squishy-petting-eagle.md`.

- **Phase 1 (`43435c1`) — מסלול פר-שאלון, לב יחיד:** `constants/roadmapData.ts` `buildRoadmap582`→**`buildRoadmap(paper)`** דרך **`topicsForActivePaper(paper)`** (כולל יסודות משותפים) → **582 = 10 נושאים** (6 בלעדיים + פונקציות/טריגו/דיפ/אינטגרל), **581 = 8**. `resolveRoadmapNode` עכשיו **בלתי-תלוי-שאלון** (סורק כל נושא עם subTopics). `app/roadmap/page.tsx` קורא `getPaper()` (ברירת-מחדל 582) + מאזין `'bagrut-paper-changed'` ש-AppChrome פולט בהחלפת שאלון. **המסלול הישן מפנה:** `app/practice/.../sub/[subId]` (+/practice) → **redirect ל-`/roadmap/[subId]`**; כרטיסי LessonView → הסולם; LessonView ממותג "חומרי עזר" + קישור אליו מסקשן-הנושא במפה. יעד-התחלה אחיד `/roadmap` (middleware default /quiz→/roadmap; `/practice` הוסר מ-PROTECTED_PREFIXES).
- **Phase 2 (`dd45145`) — סנכרון:** `QuestionPartCard` רושם עכשיו `recordResult(source:'bagrut', subTopicId, difficulty)` (בדיקה+self-assess, פעם אחת פר-סעיף) — **היה write-never**, insights/תחזית היו עיוורים לבגרות. `BagrutLevel`+`BagrutQuestionBlock` מעבירים המזהים. `RoadmapLevelRunner` מתאים-רמה דרך `studentTier`+`orderQuestions`+צ'יפ `tierLabel`. **הוחלט לא לגעת:** 2.2 (quiz ברמת-נושא בכוונה) + 2.4 (/my-plan מציג את נושאי-התוכנית בכוונה; מסתנכרן לנושאי-תוכנית).
- **Phase 3 (`9cd4072`) — ניווט/מינוח:** drawer AppChrome + מסכים מרכזיים (בוחן/מורה/בגרויות/נוסחאות), מסלול ראשון; חיפוש תת-נושא → `/roadmap/[subId]`; דף הבית הוסר "582" מקודד + תיאור סולם; ModeCard/nav → מסלול; `/bagruyot` back /pricing→/roadmap.

**אומת חי:** 582→10 / 581→8 (החלפה חיה) · URL ישן מפנה לסולם · מענה-בגרות→`{source:'bagrut',subTopicId}` ב-results · צ'יפ "מסלול מאוזן" · בית בלי-582. tsc+build עברו בכל Phase. ⚠️ `/topic-demo`+`components/topic/`+`content/topics/` הם untracked don't-touch (CLAUDE.md) — לא נגעתי.

**⏭️ הבא (מתועד בתוכנית — "ארגון קודם" הושלם):** **כיסוי-תוכן** — להעמיק לרף 582 את הרדודים (יסודות משותפים פונקציות/טריגו/דיפ/אינטגרל, כל 581, גדילה-ודעיכה) בשיטת גלי-סוכנים ≤3 + micro-drills + בנקים 11-13 + verify מכסה MCQ. זה יהפוך את המסלול המורחב מ"מבנה מלא, תוכן חלקי" ל"עמוק לכל האורך".

## 🆕🆕🆕🆕🆕🆕 LATEST (2026-07-20): **העמקת תוכן 582 לרף "מורה פרטי" — הושלמה כולה ונדחפה** (`bc1eec7` → חי)

ה-WIP מ-2026-07-19 (שנקטע ב-session-limit) **הושלם**. **כל 24 תתי-הנושאים של 582** הועמקו (5 נושאים: מעריכית/ln/אנליטית/וקטורים/מרוכבים; **גדילה-ודעיכה הוחרג לפי בקשת איתי**). skill `bagrut-math-pedagogy` (מלמדים-לא-מסכמים, micro-loop, למה-לפני-איך).
- **שלבי לימוד** שוכתבו: "למה" לפני "איך", **טעות נפוצה:** מודגשת עם ההסבר, **בבגרות:** מעוגן בבגרויות אמיתיות (Q4/Q5/Q1/Q2/Q3 מ-2024/2025 לפי הנושא).
- **מיקרו-לופ (מבני, חדש):** `drill?: PracticeQuestion` ב-`SubTopicLessonStep` (types.ts) + **`components/roadmap/MicroDrill.tsx`** (MCQ אינליין פידבק-מיידי / open חשיפה; **פורמטיבי — לא נספר לכוכבים**) מחווט ב-`LearnLevel.tsx` אחרי ה-example. דרילים על רוב השלבים בכל תת-נושא.
- **מאגרי תרגול 5→11-13** פר תת-נושא (4-5e/4-5m/2-3h), מסיחי-MCQ=טעויות אמיתיות, רמז+פתרון clean-stacked לכל שאלה.

**אימות עצמאי (לא סמכתי על מחוללי-התוכן):** הסוכנים הרחיבו כל `verify-<topic>.ts` לכסות כל תשובה חדשה **וכל מסיח-MCQ**: exp **115/115**, ln **170/170**, analytic **126/126**, vectors **105/105**. **`scripts/verify-complex.ts` נכתב על-ידי** (הסוכן מת לפני; mathjs מרוכבים, cis מעלות→רדיאנים לבדיקה) **35/35** + **קריאה ידנית מלאה של כל ~60 שאלות מרוכבים = 0 טעויות**. verify-specs 126/126, check-katex 0, tsc+build, **בדיקה חיה** של הדרילים (9 ב-polar, אינטראקציה עובדת).

**⚙️ לקח תהליכי (ראה [[lessons-learned]]):** **5 סוכני-authoring כבדים במקביל מיצו זיכרון** (`VirtualAlloc failed`) → watchdog הפיל אותם אחרי ~2 תתי-נושאים. **פתרון: גלים של ≤3.** resume חוצה-סשן (SendMessage אחרי restart תהליך) לא ייצר פלט — **Agent() טרי אמין**. **העבודה נחתה גם כשהסוכן התייתם** → אמת דרך אודיט-קבצים, לא דיווח-סוכן.

**⏭️ הבא האפשרי:** גדילה-ודעיכה (3 תתי-נושאים, אותה שיטה, כשירצה); learning-paths/advanced-courses לאותו רף; 581. (הערת "581" ב-vec-cross-product → סשן נפרד `task_2d9c9a54`.)

## 🆕🆕🆕🆕🆕 LATEST (2026-07-19, מאוחר): **סולם רמות מטפס בכל תת-נושא (Roadmap levels)** (נדחף `6f241db` → חי)

איתי: "תמשיך על מסלול הלמידה — שיהיה הרבה יותר מושך, חכם, **לפי רמות של כל תת-נושא ולאט לאט עלייה ברמה**." **תובנה:** 27 תתי-הנושאים של 582 כבר בנויים אחיד (שלבי lesson + שאלות בפילוח easy/mid/hard + שאלת בגרות מתויגת) → סולם רמות מובנה שרק צריך לחשוף. הפכתי כל תת-נושא מ**צומת שטוח** (4 טאבים + בוחן 2/3) ל**סולם 5 רמות מטפס**: 📖 לומדים → 🌱 חימום(easy) → ⚡ ביסוס(mid) → 🔥 אתגר(hard) → 🎓 בגרות. כל רמה פותחת את הבאה; כוכבים 1-3 לפי דיוק, XP מצטבר (learn10/easy15/mid25/hard40/bagrut60), ו-👑 שליטה-מלאה.

**קבצים:**
- **`lib/roadmap-levels.ts`** (חדש, טהור): `buildSubTopicLevels(subject,topic,st)` נגזר מ-difficulty tiers + `getBagrutQuestionsForSubTopic`; `computeStars(kind,score,total)` (learn=3, אחרת 3/2/1); `CORE_LEVELS=['learn','easy','mid']`.
- **`lib/roadmap-progress.ts`** (הורחב): אותו store `bagrut-roadmap-v1` + שדה `levels` פר-node (`LevelRecord{cleared,stars,...}`). `markLevelCleared(topic,subId,level,levels,stars,score,total)` → כוכב מקסימלי + XP בסיום-ראשון + כשה**ליבה** (learn+easy+mid) הושלמה מסמן `passed=true`+`markSubTopicDone`+`markStep` (סנכרון דו-כיווני, פותח את תת-הנושא הבא). `nodeLevelSummary`/`levelStatus`/`levelStars`. **תאימות אחורה:** רשומות legacy (`passed` בלבד / `isSubTopicDone`) = ליבה-הושלמה, רמות פתוחות ל-replay. **`markNodePassed` הישן הוסר.**
- **`components/roadmap/`**: **`SubTopicLadder.tsx`** (מחליף את RoadmapLessonView — סקירת הסולם + מד-שליטה + ניווט פר-רמה), **`LearnLevel.tsx`** (שלבי lesson+formula+example משובצים+keyPoints → "סיימתי ללמוד"), **`RoadmapLevelRunner.tsx`** (מחליף RoadmapStepQuiz — MCQ+open לרמת easy/mid/hard), **`BagrutLevel.tsx`** (`QuestionPartCard` פר-סעיף, כוכבים לפי onSelfAssess/onDone), **`ladder-ui.tsx`** (`StarRow`+`LevelClearedPanel`).
- **`app/roadmap/page.tsx`**: דשבורד מציג פר-שלב נקודות-רמה (dots)+כוכבים+👑, וסה"כ XP + "בשליטה מלאה N/27". הוסף `MathText` לכותרות/סטטוס (תוקן raw-LaTeX בכותרות כמו "$\ln$").

**באג שתוקן:** `AnimatePresence mode="wait"` נתקע במעבר רמה→רמה (exit לא הסתיים) → הוחלף ל-`motion.div` פשוט עם `key` (כניסה בלבד). **לקח:** mode="wait" עלול לתקוע swap כשה-key משתנה בין ילדים מורכבים.

**אומת חי מקצה-לקצה** (dev server + get_page_text; **screenshot נתקע פה כרגיל, וגם read_page interactive לא תפס כפתורים מתחת-לקיפול → לחצתי דרך javascript_tool `.click()` = בדיקת התנהגות**): רינדור הסולם, כל סוגי הרמות (learn/MCQ/open/bagrut), סיום→כוכבים+XP, onNext (אחרי התיקון), סיום-ליבה→"נפתח השלב הבא"+פתיחת exp-equations במפה, שליטה-מלאה 👑, ומפה עם 150 XP · 1/27. tsc+build עברו, katex 0.

**⏭️ הבא האפשרי:** להרחיב את הסולם ל-581 (buildSubTopicLevels גנרי לכל subTopic; המפה עדיין 582-only דרך buildRoadmap582 — רק צריך buildRoadmap581); כוונון ספי-כוכבים; אולי נודג' "תרגל שוב ל-3 כוכבים" ברמות שקיבלו <3.

## 🆕🆕🆕🆕 LATEST (2026-07-19): **מסלול למידה (Roadmap 582) + בוחן-מושגים סטטי + תיקון Supabase-pause** (נדחף `0f9cabb`+`4de3a17`, ותיקון middleware `4781da9` → חי)

**⚠️ העדפה קבועה חדשה:** כל התקשורת בצ'אט **בעברית**, הקוד **באנגלית** ([[feedback-hebrew-chat-english-code]]).

**🔥 אירוע Supabase (תוקן):** האתר החי נפל ל-504 (`MIDDLEWARE_INVOCATION_TIMEOUT`) + כשל התחברות — כי פרויקט Supabase החינמי (`xbbebnsiapvacwtalalq`, שם "bagrut-app") **נכנס ל-pause אחרי חוסר-פעילות** (NXDOMAIN ב-DNS). ה-middleware קורא `auth.getUser()` בכל בקשה → נתקע → 504 על כל האתר. **הקשחתי `lib/supabase/middleware.ts`** (timeout 2.5s + try/catch → `return response`). איתי עשה **Restore** בדשבורד → הכל חזר (הדאטה שלמה). לקח מלא ב-[[lessons-learned]]. 2 env: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

**Roadmap 582 (Part A, `0f9cabb`, תוכנית `happy-twirling-aho.md`):** מסלול למידה מובנה. **תובנה:** 27 תתי-הנושאים של 582 כבר מכילים בדיוק 4 צעדים (lesson[]/formulas/questions) → אפס שכפול. `types/roadmap.ts` + `constants/roadmapData.ts` (`buildRoadmap582` נגזר מ-`getSubTopics`, `resolveRoadmapNode`) + **`lib/roadmap-progress.ts`** (מאגר `bagrut-roadmap-v1`, `nodeStatus/markNodePassed/isNodePassed`, שער **2/3**, רצף בתוך-נושא + 6 נושאים פתוחים, **סנכרון דו-כיווני** עם `markSubTopicDone`+`markStep`). UI: `app/roadmap/page.tsx` (ציר-זמן, טבעת+בר, StepCard מ-TopicJourney) + `app/roadmap/[lessonId]/page.tsx` (client, `useParams`+`getSubTopic` — נמנע מ-RSC-serialization של diagrams) → `components/roadmap/RoadmapLessonView.tsx` (4 טאבים: theory=lesson steps title+teach / formulas=FormulaCard / example=WorkedExampleCard / quiz) + `RoadmapStepQuiz.tsx` (3 שאלות מ-subTopic.questions, mcq אוטו + open self-report, 2/3→markNodePassed+celebrateCompletion+פתיחת הבא). כניסות: כרטיס ב-`/practice` + קישור ב-AppChrome. **החלטות איתי (AskUserQuestion):** שער 2/3, רצף-בתוך-נושא.

**עדכון קריטי (אותו יום, נדחף `1444ba6`):** (1) **באג רינדור תוקן** — הדשבורד הופיע ריק כי `<motion.div {...fadeUp}>` הפך את `hidden` לתכונת-HTML → display:none (לקח מלא ב-[[lessons-learned]]). הוחלף ל-initial/animate מפורש; **אומת חי** דרך dev server + get_page_text (27 שלבים מרונדרים). (2) איתי: "רציתי שהמסלול יהיה **הלב הראשי** של האפליקציה" → הפכתי אותו למרכזי: דף הבית CTA ראשי → `/roadmap` + מקטע "הלב של האפליקציה" עם באנר מודגש; **יעד ברירת-מחדל אחרי login/signup/onboarding → `/roadmap`** (במקום /quiz//my-plan). `/roadmap` **לא מאחורי auth** (middleware PROTECTED_PREFIXES לא כולל אותו) — נגיש+ניתן-לאימות בלי login.

**בוחן מושגים סטטי (Part B, `4de3a17`):** איתי: "לא API כל פעם — טמון מראש". `content/concept-quiz/582.ts` (36 שאלות MCQ, 6/נושא, **correct אומת ידנית**, עברית מחוץ ל-$...$) + `index.ts` (`getConceptQuestions`/`hasConceptBank`). `app/quiz/page.tsx` מסלול concept: **סטטי-קודם** (בלי fetch) אם `hasConceptBank`, אחרת נפילה ל-AI. `scripts/verify-concept.ts` 36/36, check-katex 0.

**⏭️ הבא האפשרי:** להרחיב את ה-Roadmap ל-581 (אותה תבנית, `paper582TopicOrder`→581); בוחן-מושגים סטטי ל-581 (6 נושאים); אימות חי של המפה ע"י איתי (מאחורי auth). **המפה גנרית — רק צריך config ל-581 ובנק מושגים.**

## 🆕🆕🆕 LATEST (2026-07-18): **חבילת 7 המשימות ל-5 יח' (581/582) — הושלמה כולה ונדחפה** (7 קומיטים `fa5d7fc`→`a302c73` → חי)

איתי שלח ספק 7 משימות (Role&Context מפורט). עבדתי ב-plan mode (3 סוכני Explore + תוכנית `happy-twirling-aho.md` מאושרת). **החלטות איתי (AskUserQuestion):** (1) שאלון פעיל **יחיד** + החלפה; נושאים משותפים (פונקציות/טריגו/חדו״א, שדה `alsoIn`) מוצגים בשניהם, בלעדיים של השני מוסתרים. (2) בוחן-מושגים = **AI + pool**. (3) 3 פיצ׳רי-AI חדשים = **Pro בלבד**. סדר: 1→3→6→2→7→4→5, כל משימה commit+push עצמאי, tsc+build לפני כל push.

- **M1 הפרדת 581/582** (`fa5d7fc`): `topicsForActivePaper`/`isTopicInActivePaper` ב-`bagrut-curriculum.ts` (⚠️ **לא** `topicsByPaper` — הוא לא כולל alsoIn). שדה `paper?` + `getPaper/setPaper` ב-`study-plan.ts` (localStorage, legacy=null=בלי סינון). בחירת שאלון באונבורדינג (DateStep) + סינון שלב-3. סינון picker של practice (תצוגת-שאלון-יחיד+"החלף") + quiz (רשימה+מבחן-מעורב). toggle במגירת AppChrome.
- **M3 חיכוך הקלדה** (`823b121`): `MathSymbolBar.tsx` (√ x² xⁿ π e ° ≠ ≤ ≥ ∞, הזרקה ב-caret) מחווט ל-`AnswerInput`. **תיקון `answer-check.ts`:** נרמול `π`,`×`,`÷`,`−` (U+2212) — אומת 9/9 + verify-specs 126/126. כפתור "פתרתי על דף — הצג פתרון מלא" + הערכה עצמית ב-QuestionPartCard/SubTopicPractice/archive.
- **M6 FormulaSheet** (`5f8d916`): `components/FormulaSheet.tsx` — מגירת framer-motion (מימין, FAB תחתון-שמאל, אירוע `open-formula-sheet`), מזהה נושא מ-`usePathname`, מאחד `lesson.formulas`+`subTopics[].formulas` (דדופ latex), מדגיש+גולל לנושא נוכחי, "איך משתמשים?" פר-נוסחה. mount ב-layout.
- **M2 בוחן מושגים** (`eacc028`): קופי `/quiz`→"בוחן מושגים מהיר". `/api/questions` `mode:'concept'` + `buildConceptPrompt` (תיאוריה) + `serveFromPool(...,'concept')`. per-topic מדלג על בנק סטטי. `question-pool` Kind+=concept. `generate-pool.ts` תומך concept.
- **M7 מחברת טעויות** (`f02a10d`): **`lib/mistakes.ts`** (localStorage `bagrut-mistakes-v1`, 8 קטגוריות, `recordMistake/mistakesByCategory/topCategory/mistakesByTopic/mistakesForPractice`). `MistakeTagger.tsx` (בורר ידני). חיווט: QuestionPartCard/SubTopicPractice/quiz. **תיוג-AI (Pro):** `category` enum ב-why-wrong+check-answer → `onCategory` ב-AITutorActions. **`app/errors/page.tsx`** (חינם, כמו insights): "הטעות מס' 1", ברי-קטגוריה, פר-נושא, "תרגל את הטעויות שלי". כניסה ב-AppChrome+insights.
- **M4 ניתוח פתרון מצילום** (`0d535ff`): **`app/api/analyze-solution/route.ts`** — fork של solve-photo, קריאת Sonnet vision יחידה (audit כתב-יד → סטייה ראשונה → קטגוריה → עידוד), **Pro בלבד** (402), מכסה `scan_log` source=audit. **`SolutionAudit.tsx`** (מצלמה/העלאה + רינדור ✓/✗). כניסות: QuestionPartCard + כפתור-מצלמה ב-/chat (overlay).
- **M5 סעיפי חשיבה** (`a302c73`): **`/api/thinking`** (מג׳נרט סעיף מילולי + idealAnswerPoints + fullAnswer, Pro, pool('thinking')) + **`/api/thinking/evaluate`** (מעריך טקסט-חופשי → score+כוסה/חסר+feedback+תשובת-מודל, callTutor). **`ThinkingPractice.tsx`** + **`app/thinking/page.tsx`** (בורר נושא מסונן) + כרטיס ב-practice hub. `question-pool` Kind+=thinking.

**⚠️ לאיתי לבדוק חי (הכל מאחורי auth):** בחירת+החלפת שאלון; סרגל-סימנים+"פתרתי על דף"; מגירת נוסחאות (FAB+הדגשה); בוחן-מושגים; `/errors`; **צילום-פתרון+חשיבה דורשים Pro** (isProUser עדיין stub — admin/`user_metadata.pro`). **חימום pool אופציונלי:** `npm run generate-pool -- math5 "<נושא>" concept 8` (אחרת concept מג׳נרט חי בעלות קטנה); thinking תמיד חי (Pro, נפח נמוך). אין SQL חדש (scan_log/question_pool קיימים). קונבנציית commit: message file `-F` (מרכאות כפולות בהודעה שוברות את PowerShell). WIP מקבילי בריפו (statistics.ts, 2020-summer-582.ts, untracked dirs) — push pathspec בלבד.

## 🆕 LATEST (2026-07-08): מאגר — **קיץ 2024 מועד א' שאלון 582, Q4** (נדחף `104233e` → חי)
איתי המשיך את workflow-המאגר ושלח שאלה+פתרון-כתב-יד. נוספה `b2024s582a-q4` לקובץ הקיים `content/past-bagruyot/2024-summer-582.ts` (שכבר הכיל Q1 אנליטית / Q2 וקטורים / Q3 מרוכבים). **חקירת פונקציה מעריכית** $f(x)=\frac{e^x-b}{(e^x-4)^2}$, $b\ne4$ פרמטר חיובי: **א1** תחום $x\ne\ln4$; **א2** אנכית $x=\ln4$ (כי $4-b\ne0$), אופקיות $y=0$ ($+\infty$, חלוקה ב-$e^{2x}$) ו-$y=-\frac{b}{16}$ ($-\infty$); **א3** חיתוכים $(0,\frac{1-b}{9})$ ו-$(\ln b,0)$; **ב** $f'=\frac{e^x(2b-4-e^x)}{(e^x-4)^3}$, קיצון ב-$e^x=2b-4$; נתון $x=\ln12$→$12=2b-4$→**$b=8$**, טבלת סימנים $-,+,-$ → **מקסימום** $(\ln12,\frac1{16})$. [מציבים $b=8$] $g=\frac1f=\frac{(e^x-4)^2}{e^x-8}$: **ג1** תחום $x\ne\ln4,\ln8$; **ג2** אנכית $x=\ln8$, אופקית $y=-2$ ($-\infty$ בלבד; ב-$+\infty$ $g\to\infty$; ב-$\ln4$ חור); **ד** סקיצה משותפת (SVG); **ה** $f=g$→$f^2=1$→$f=\pm1$; $f=1$ דיסקר' $-15$ (אין), $f=-1$ דיסקר' $17$ (יש) → **$y=-1$**; **ו** $\int_{-3}^{-2}(f-g)dx$: חוסמים $f<-\frac12$ (דרך $f+\frac12=\frac{e^x(e^x-6)}{2(e^x-4)^2}$) ו-$g>-2$ → $f-g<\frac32$ → **קטן מ-$1\frac12$** (מספרית $\approx1.4195$). **אימות עצמאי מלא: node 22/22 PASS** (b, מקס', כל האסימפטוטות, ה, ו), check-katex-hebrew 0/51, tsc נקי, build עבר. פורמט: strings עם `'` (נגזרת $f'$) בגרשיים כפולים; טבלת-סימנים כ-`\begin{array}` (סגנון הבית, לא SVG); 2 שרטוטי custom SVG (סקיצה + חסימת-שטח). pathspec בלבד (WIP מקבילי: statistics.ts, 2020-summer-582.ts, untracked).

**Q5 נוספה (2026-07-08, נדחף `6add744` → חי):** `b2024s582a-q5` חקירת **פונקציית ln** $f(x)=x((\ln x)^2-2\ln x+2)$, $x>0$. **א** $f'=(\ln x)^2\ge0$ (כלל מכפלה, מצטמצם יפה) → **עולה תמיד, אין ירידה**, ב-$x=1$ משיק אופקי שאינו קיצון; **ב** $f''=\frac{2\ln x}{x}$, שינוי קעירות ב-$x=1$ → **פיתול $(1,2)$**; **ג** $t^2-2t+2$ דיסקר' $-4$ → **חיובית תמיד**; **ד1** סקיצת $f$ (מהראשית, פיתול-שטוח $(1,2)$); **ד2** סקיצת $f'=(\ln x)^2$ (מינ' $(1,0)$, →$+\infty$ בקצוות). $g(x)=(\ln x)^2-9$, $h(x)=\frac{f}{x^2}$: **ה** חיתוכים $e^{\pm3}$, $g<0$ ביניהם; **הטריק:** $f$ קדומה של $(\ln x)^2$ → $\int(g)dx=f(x)-9x$ → $S_1=4e^3+8e^{-3}\approx80.74$; **ו** $h=\frac{(\ln x)^2-2\ln x+2}{x}>0$ (מעל ציר), $g$ מתחת → $S=S_1+S_2$; $S_2=\int h=[\frac{(\ln x)^3}{3}-(\ln x)^2+2\ln x]_{e^{-3}}^{e^3}=6-(-24)=30$ → **$S=4e^3+8e^{-3}+30\approx110.74$**. אומת node **27/27**, katex 0/51, tsc+build עברו. 4 שרטוטי SVG (f, f', g+שטח, g+h+S₁+S₂). **⏭️ נשאר במועד א' 2024: Q6–Q7** אם ישלח (Q1–Q5 מוכנות).

## 🆕×7 LATEST (2026-07-03, המשך 6): **מיילסטון G — הסרת טיפ + מודל חינם/Pro + 3 קורסים מתקדמים** (נדחף `f6a3c93`+`11b8485` → חי)

**G1:** הוסר הטיפ-היומי מדף הבית (איתי: מיותר).

**G2 מוניטיזציה — "בסיס חינם, מאסטרי בתשלום" (`f6a3c93`):** מיפוי גילה שהיום משתמש חינם מקבל **רק נושא ראשון** (נעילה אגרסיבית שחוסמת הרגל) + הקורס-המתקדם **פתוח בחינם** (הפוך!). תוקן:
- **`lib/access.ts`**: `canAccessTopic` → כל הלימוד חינם לכולם (topicLockReason רק 'open'/'locked-progress' פדגוגי, הוסר 'pro-required'). **`FEATURE_GATES`/`isFeaturePro`/`canUseFeature`** מקור-אמת יחיד: advanced-course/archive/simulation/ai-tutor/unlimited-chat/ai-scan/analytics = Pro. `FREE_DAILY_CHAT=10`/`PRO_DAILY_CHAT=200`.
- **קורס מתקדם נגדר Pro**: `app/learn/[subject]/[topic]/advanced/page.tsx` (server, isProUser → paywall) + `CourseTracks` תג Pro.
- **צ'אט**: `/api/chat` + `app/chat/page.tsx` מכסה tier-aware (10 חינם/200 Pro, proRequired בהודעת החסימה).
- **`app/pricing/page.tsx` חדש** (ציבורי): 3 מסלולים (חודשי ₪34.90 / חצי-שנתי ₪129 מומלץ / שנתי ₪199 — placeholders), טבלת השוואה חינם↔Pro, עוגן "כמו שיעור פרטי אחד". CTA=waitlist toast (אין billing).
- כל "שדרג"→/pricing (page.tsx כרטיס-Pro, my-plan, bagruyot+archive, scan, AppChrome). **upsell בכרטיס תחזית-הציון ב-insights** (לא-Pro).
- **⚠️ אין billing** — צריך ספק. המלצה: **Lemon Squeezy/Paddle (merchant-of-record, מטפל במע"מ/חשבוניות, ₪)**. `isProUser` נשאר admin/user_metadata.pro. ההחלטה של איתי.

**G3 קורסים מתקדמים (`11b8485`):** 3 סוכני-author מקבילים (קובץ-לכל-נושא) בנו `AdvancedCourse` מלא ל-**מעריכית/ln/אנליטית** (רף הזהב של complex-numbers: 7 מקטעים, 5-6 patterns/techniques, 2 worked-exams, 7 examPractice×25נק', 6 traps, simulation). אנליטית עם 11 שרטוטי-SVG בהירים, קונבנציות y²=2px/c²=a²−b². **הקורס המתקדם עכשיו ב-4 נושאים** (היה רק מרוכבים). רשומים ב-`content/advanced-courses/index.ts`. **אימות עצמאי:** `scripts/verify-advanced.ts` חדש (281/281: totalPoints=Σparts, reviewRef patternId/techniqueId תקינים) — תפס באג אחד (ln ex-5 patternIds הכיל techniqueId, תוקן) + `check-katex-hebrew` תפס `\text{תחום}` בהערה (תוקן). tsc+build עברו, ספוט-צ'ק מתמטי עצמאי עבר. **לקח שאושר שוב:** סוכנים מוסיפים `diagrams` במקום הלא-נכון בטיפוס (WorkedExamPart/workedExample לא מאפשרים) — הם תיקנו לבד הפעם.

**⏭️ הבא (מיילסטון G3 נותרו):** קורסים מתקדמים ל-**וקטורים + גדילה-ודעיכה** (2 הנותרים מה-5). ⚠️ לא אומת חי (auth) — איתי לבדוק: /pricing, נעילת-נושאים משוחררת, קורס-מתקדם חסום ל-free, צ'אט 10/יום.

## 🆕×6 LATEST (2026-07-03, המשך 5): **מיילסטון F — חבילת הבידול** (5 קומיטים, נדחף `2584a50` → חי)

איתי: "תוסיף דברים שלא הייתי חושב עליהם". הוצעו 10 (F1-F10 בתוכנית `cheerful-foraging-falcon.md`, כולל עיצוב מפורט מסוכן-תכנון עם reality-checks); **איתי בחר:** תחזית-ציון, חיפוש-גלובלי, שיתוף-הישגים, פוליש, **+ דרישה חדשה: התאמת כל שאלה לרמת התלמיד 3/4/5 יח' (F11)**. נבנה:
- **F11 התאמה** (`c545196`): `StudyPlan.unitLevel: 3|4|5` (+get/set/getTopicLevel) · בחירת יחידות באונבורדינג (שלב התאריך) · עריכה בחלונית הפרופיל · **`lib/adaptive.ts`**: `studentTier` (יחידות + רמה-עצמית + דיוק חי ≥80%↑/<40%↓), `pickQuestions` (תמהיל easy/mid/hard פר tier), `orderQuestions` · חיווט: SubTopicPractice (סדר דרילים + צ'יפ "מסלול מדורג/מאוזן/מתקדם", reorder ב-useEffect נגד hydration), מבחן מהיר (בחירה לפי tier). **תוכן 3/4 יח' אמיתי = פרויקט authoring נפרד שלא הובטח** — כרגע ההתאמה בתוך תוכן math5 + fallback AI של math4.
- **F1 תחזית ציון** (`1a7911d`): **`lib/prediction.ts`** — midpoint(typicalPoints)×PROB(appearsIn) → משקלים=100 פר שאלון; דיוק מוחלק בייסיאנית (K=5, prior מ-level: weak .45/mid .65/strong .8); רצועת כנות ±clamp(25/√(1+N/10),3,25); `PAPER_WEIGHTS={581:.35,582:.65}` (TODO לאמת מול חוזר מפמ"ר); `topImpactTopics` (נק' לכל 10% שיפור). `scripts/verify-prediction.ts` 17/17 (baseline ללא-דאטה = 50 [25-75]). Hero ב-insights: "אם תיגש היום" + תג "הערכה — לא הבטחה" + פירוק פר-שאלון + צ'יפי "הכי משתלם לשפר".
- **F10 פוליש** (`c8f8d79`): manifest `shortcuts` (מבחן/צ'אט/צילום) · `DailyTip` בדף הבית (pool מ-examTips, dayOfYear%len, useEffect) · באנרי weak/strong ב-LessonView (מ-getTopicLevel).
- **F9 חיפוש** (`7ebeba0`): **`lib/search-index.ts`** (נושאים+תתי-נושאים+נוסחאות-דדופ+בגרויות; נירמול question-match; אינדקס lazy) + **`GlobalSearch.tsx`** (Ctrl+K + אירוע `open-global-search`, ניווט חצים/Enter, קבוצות) mounted ב-layout; כניסה בחלונית הפרופיל.
- **F8 שיתוף** (`2584a50`): **`lib/share-card.ts`** (קנבס 1080×1350, אינדיגו→שנהב+טבעת זהב, מספרים/עברית ב-fillText **נפרדים**, פונט מ---font-heebo אחרי fonts.ready) + `ShareCardButton` (מודאל preview → canShare(files)/הורדה). טריגרים: רצף ≥3 ב-insights, סיום מודול ≥70%.

**נדחו (מתועדים במלואם בתוכנית לבנייה עתידית):** F2 כרטיסיות-Leitner, F3 מקלדת-מתמטית (+תיקון π ב-answer-check!), F4 קצב, F5 ערב-לפני, F6 מחברת-טעויות, F7 סימולציה (הוחלט: Pro). **reality-checks חשובים לתוכנית שם:** הארכיון לא משתמש ב-QuestionPartCard (PartPracticeCard inline); אין expected ב-PastBagrutPart; π לא מנורמל ב-answer-check.
אומת: tsc+build אחרי כל פיצ'ר; verify-prediction 17/17. ⚠️ לא אומת חי (auth) — איתי לבדוק: אונבורדינג עם בחירת יחידות, תחזית ב-insights, Ctrl+K, שיתוף במובייל.

## 🆕🆕🆕🆕🆕 LATEST (2026-07-03, המשך 4): **פרופיל גלובלי + שיחות צ'אט** — מיילסטון E (נדחף `5fecfbb` → חי)

איתי ביקש: (1) הצ'אט ייפתח נקי בכל פתיחה + היסטוריית שיחות בצד לחזור אליהן; (2) פרופיל משתמש בחלונית צד גלובלית. **החלטות (AskUserQuestion):** אוואטאר צף גלובלי · חלונית עשירה עם אוואטאר ראשי-תיבות (לא תמונה).

**E2 פרופיל (`components/AppChrome.tsx` חדש):** client, mount יחיד ב-`app/layout.tsx`. אוואטאר ראשי-תיבות **fixed top-3 left-3 z-[60]**, מסתתר ב-`isHiddenPath` (`/`,`/login`,`/signup`,`/auth/*`,`/onboarding`) וכשאין user. קליק → drawer מ-framer-motion (נכנס מ-left, backdrop, ESC) עם: אוואטאר+**שם ניתן-לעריכה** (`supabase.auth.updateUser({data:{name}})`)+מייל · תג חינם/Pro (`isProUser`) · רצף (`currentStreak`) · קיצורים (my-plan/insights/history/library) · התנתקות (form POST /auth/signout). **הרשמה:** שדה "שם מלא" (icon User) לפני המייל → `signUp({options:{data:{name}}})`. אומת ויזואלית: אוואטאר מוסתר ב-`/`, שדה שם ראשון בהרשמה.
⚠️ **קונפליקט מיקום פתור חלקית:** האוואטאר top-left עלול לחפוף nav-actions top-left בעמודים; תיקנתי את nav הצ'אט (`pl-16 sm:pl-4`). **עמודים אחרים עם תוכן top-left (quiz "התנתק", ועוד) — איתי לבדוק חפיפה במובייל.**

**E1 שיחות (`app/chat/page.tsx` + `/api/chat` + SQL):** 
- `/api/chat`: מקבל `conversationId?`; אין → יוצר `conversations` row (title=topic או 40 תווים ראשונים), מחזיר id; **context מוגבל ל-conversation_id** (זיכרון פר-שיחה); insert הודעות עם conversation_id; bump updated_at. **`convEnabled` flag — try/catch, אם הטבלה חסרה נופל ל-legacy** (thread שטוח, בלי conversation_id, context לא-scoped).
- `app/chat/page.tsx`: mount **לא טוען thread ישן** — צ'אט ריק + טוען רשימת שיחות. `newChat`/`openConversation`/`deleteConversation`/`loadConversations`. **ChatSidebar** (framer drawer מ-right): שיחה-חדשה, רשימה (title+relativeDate), טעינה/מחיקה. כפתורי "שיחה חדשה"+"היסטוריה" ב-nav. send שולח+קולט conversationId.
- **`supabase-conversations.sql`** (חדש בשורש): `conversations` + `conversation_id` על chat_messages + RLS + indexes.
⚠️ **איתי מריץ `supabase-conversations.sql`** ב-dashboard (בלעדיו צ'אט עובד legacy בלי סיידבר). ⚠️ הודעות legacy (conversation_id=null) לא בסיידבר. אומת tsc+build; לא אומת חי (auth).

## 🆕🆕🆕🆕 LATEST (2026-07-03, המשך 3): **צילום חכם + ספריית תשובות (caching) — מיילסטון D** (נדחף `2ca04e5` → חי)

איתי ביקש דף-נחיתה לצילום-שאלה + מנגנון שיחסוך כסף על API ("שכל פתרונות הבגרויות מותאמים במערכת"). **החלטות (AskUserQuestion):** התאמות-מהמאגר חינם לכולם, פתרון-AI-חדש=Pro · דף-נחיתה=מסך intro בתוך /scan · cache משותף=כן.

**העיקרון: "ספריית תשובות קודם, AI מוצא אחרון" (cache-warming). קיימות כבר ~829 שאלות פתורות בקוד — 661 נכנסו לאינדקס.**
- **`lib/question-match.ts`** (חדש): `normalizeQuestionText` (מסיר $/$$, ניקוד, תוויות סעיף, מנרמל), `fingerprint` (FNV-1a via Math.imul), `tokenSet`+`jaccard`.
- **`lib/solution-library.ts`** (חדש): אינדקס module-load מ-`ALL_PAST_BAGRUYOT` + `lesson.bagrutQuestions/questions` + `subTopics[].questions` → shape אחיד `LibrarySolution` (רב-סעיפי משוטח לצעדים עם תווית סעיף). `matchQuestion(text,topicHint,threshold=0.82)`: exact hash → fuzzy Jaccard (+0.02 tie-break לנושא תואם). `librarySize()`.
- **`lib/solution-cache.ts`** (חדש): `getCachedSolution`/`putCachedSolution` — best-effort, **try/catch מלא → degrade gracefully אם הטבלה חסרה**. SQL ל-`solution_cache` + `scan_log` בהערות בסוף הקובץ (איתי מריץ ב-dashboard).
- **`app/api/solve-photo/route.ts`** (שכתוב מלא): 2 phases — `transcribeImage()` (Sonnet 4.5 vision, system ~200 טוקנים, max 900, json schema {topic,transcribedQuestion}) → `matchQuestion` (library) → `getCachedSolution` (cache) → `solveText()` (Sonnet **טקסט בלי תמונה**, SOLVE_SYSTEM_PROMPT עם `cache_control:ephemeral`, נשמר ל-cache). **שער Pro עבר** מראש-הבקשה לענף ה-AI-solve בלבד (402 `proRequired` עם התמלול). מכסה יומית: `FREE_DAILY_SCANS=15`/`PRO_DAILY_SCANS=150` דרך ספירת `scan_log` (degrade→0=בלי מכסה). מחזיר `source: 'library'|'cache'|'ai'`.
- **`app/scan/page.tsx`**: מסך intro (hero gradient-text, באדג' אמון "מאות שאלות פתורות—חינם", 3 צעדים ממוספרים, דוגמת לפני→אחרי), **פתוח למשתמשי חינם** (הוסר ה-block של free), תג-מקור בתוצאה (מאומת-מהמאגר/נפתר-בעבר/AI), טיפול 402 → upsell רך עם התמלול (`ProUpsell` state). תוקנו צבעים כהים שנשארו.
- **`scripts/verify-match.ts`** (חדש): **177/177 עברו** — self-match (score≥0.82), 40 ניסוחים מעוותים (תוויות/$/רווחים), no-false-positive.

**מודל עלות:** היום ~$0.02/צילום. חדש: התאמת-ספרייה/cache ≈ $0.007 (תמלול בלבד, חינם למשתמש); miss אמיתי ≈ $0.02 פעם אחת ואז ב-cache. אומת tsc+build. ⚠️ **לא אומת ויזואלית** (/scan מאחורי auth) + **דיוק fuzzy על OCR אמיתי** — איתי לבדוק עם צילומים. ⚠️ **איתי צריך להריץ את ה-SQL** ב-Supabase dashboard כדי להפעיל cache+מכסה (בלעדיו הכל עובד חוץ מ-cache/מכסה).

## 🆕🆕🆕 LATEST (2026-07-03, המשך 2): **סדר-וברור + B4 עיגון-לכולם + B6 הרגלים** (נדחף `2ed226e` → חי)

**הנחיה חדשה של איתי (עיקרון מנחה קבוע מעכשיו): "שהכל יהיה מסודר, שתמיד ידע בדיוק מה זה כל דבר, וכל לימוד שלב אחר שלב."** יושם:
- **LessonView** (עמוד נושא) הפך למפת דרכים ממוספרת: בלוק "איך לומדים בעמוד הזה" (1 מסלול מודרך / 2 חומר עזר / 3 מבחן סיום), כותרות אזורים עם באדג' ממוספר, כרטיסי תת-נושא עם תג "שלב N" ושרשרת "📖 שיעור ← ✏️ תרגילים ← 🎯 שאלת בגרות", CourseTracks הועבר לאזור העזר עם תווית "קורסים ייעודיים". קיקר הדף: "מסלול הלמידה בנושא" (במקום "סיכום לימודי").
- **SubTopicLesson**: "שלב X מתוך Y" בכל צעד. **TopicJourney**: כרטיס נעול מסביר "🔒 נפתח אחרי שתסיים את שלב N-1".

**B4 — המורה המעוגן לכל 14 הנושאים (`b10bc15`):** `lib/tutor-grounding.ts` שוכתב: `buildTopicContext(topic)` גנרי (caps: 6 דוגמאות/12 טעויות), `isGroundedTopic = !!getLesson('math5',topic)`, `isPilotTopic`/`buildComplexNumbersContext`/`buildPilotGrounding` = aliases (הסקריפטים demo/stress/compare עדיין מתקמפלים). tutorBar(topic) עם כלל-מוסכמות מותנה (cis רק למרוכבים). `/api/chat`: Sonnet לכל נושא מעוגן + **prompt caching** (`system: [{type:'text', text, cache_control:{type:'ephemeral'}}]`) + שסתום env `TUTOR_SONNET_TOPICS` (ריק=כולם Sonnet; אחרת allowlist, השאר Haiku+עיגון). מיקרו-נקודות מעוגנות אוטומטית דרך ה-alias. תווית "מורה מעוגן" בצ'אט: `hasLesson('math5',topic)`. **אומת: עיגון נבנה ל-15/15 נושאים (3-8K תווים), tsc+build.** ⚠️ לא הורץ demo-tutor אמיתי (עולה כסף) — ספוט-צ'ק איכות פר-נושא עדיין רצוי.

**B6 — שכבת הרגלים (`2ed226e`):** `lib/results.ts` הורחב: `dailyActivity/currentStreak/todayCount/lastNDays` (תאריך **מקומי**; רצף שורד יום נוכחי-או-אתמול) + יעד יומי `bagrut-goal-v1` (10, קלמפ 1-200). insights: רצועת הרגלים — streak בזהב (--accent), טבעת יעד SVG עם ±5, גרף עמודות 14 ימים (divs, dir=ltr).

**B5 PWA:** אומת שהכל קיים (manifest.ts + sw.js + sw-register + icon.tsx/svg); צבעים עודכנו ב-A6. נשאר: בדיקת התקנה באנדרואיד אמיתי (איתי).

**⏭️ נשאר במיילסטון B:** B2 מחברת טעויות (lib/mistakes.ts + עמוד /practice/mistakes + findQuestionById) → B1 סולם עזרה אחיד (HelpLadder.tsx) → B3 סימולציית בגרות מלאה (app/simulation, שאלון אמיתי שלם + טיימר 3:30 עמיד-רענון; לקרוא קודם content/past-bagruyot/types.ts והאדפטר של הארכיון). ואז מיילסטון C. הכל בקובץ התוכנית cheerful-foraging-falcon.md.

## 🆕🆕 LATEST (2026-07-03, המשך): **מיילסטון A — עיצוב לבן יוקרתי הושלם ונדחף** (`463c12e` → חי)

איתי ביקש (תוכנית מאושרת `C:\Users\1000m\.claude\plans\cheerful-foraging-falcon.md` — **לקרוא אותה בסשן הבא!**): עיצוב לבן לכל האתר + התאמת סילבוס + פדגוגיה, בסדר עיצוב→פדגוגיה→תוכן. החלטותיו: לבן בלבד, אינדיגו+זהב על שנהב (#FDFDFB/#4F46E5/#B8860B), **בעיות מילוליות עדיין לא**.

**בוצע (5 קומיטים, push אחד `f3bd393..463c12e`):**
1. `dda94cd` יסודות: globals.css :root הוחלף לפלטה בהירה (+--success/--danger), גרעון+וינייטה נמחקו (`.grain-overlay{display:none}` — בלי לגעת ב-JSX), utilities עודכנו (surface-premium=לבן+צל-דיו, chat-md צבעים כהים, `.katex color: inherit`), layout (themeColor #FDFDFB, statusBar default, Toaster light), manifest (#FDFDFB/#4F46E5).
2. `26b7d87` סוויפ מחלקות: 46 קבצים, ~1100 החלפות ב-3 סקריפטי scratchpad (מפת slate/indigo/amber/emerald/rose לכהים; bg/border/ring-white/* לטינטי דיו; bg-slate-950/* ל-headers שנהב-שקוף/wells; text-white ← היוריסטיקה פר-שורה: נשאר על רקע צבעוני רווי). **תיקוני-יד לשברי היוריסטיקה במולטי-ליין JSX**: אייקונים בקופסאות גרדיאנט (לוגו-כוכב בכל ה-headers, Camera/BookOpen/GraduationCap/Calendar/CheckCircle), CTA של insights, צ'יפים נבחרים → אינדיגו מלא.
3. `9f30dc9`-ish עמוד המבחן (אי-CSS): :root פנימי הוחלף, טאבים/badges/verdicts/orbs/גרדיאנט-hero הוסבו.
4. SVG: קבועי DiagramRenderer (STROKE slate-700, LABEL דיו+הילה לבנה, TICK amber-700, ACCENT pink-600) + **סקריפט שלשות-RGB משמר-אלפא**: 1801 החלפות ב-18 קבצי תוכן (past-bagruyot/advanced/learning-paths; קבצי lessons לא נגעו — הם משתמשים ב-DiagramSpec דרך הרנדרר). **הוחרגו קבצי WIP**: statistics.ts + 2020-summer-582.ts — **חוב פתוח: להריץ עליהם את sweep-svg אחרי שינחתו**.
5. `463c12e` פוליש: משפחת text-*-50 (+/opacity) שפוספסה במפה — 59 החלפות.

**אומת:** tsc+build אחרי כל שלב; dev preview: body #FDFDFB ✓, nav שנהב ✓, btn-primary ✓, login h1 כהה ✓ (אחרי שנתפס באג text-slate-50); grep-אפס למחלקות כהות (2 חריגים מכוונים ב-insights CTA). **לקח שאושר שוב: `.next` cache ישן מגיש CSS ישן ב-dev — למחוק ולהפעיל מחדש.** preview_screenshot עדיין נתקע אחרי צילום ראשון — inspect/snapshot אמינים.

**⚠️ לא אומת (איתי חייב לבדוק בעין):** כל עמודי הפנים מאחורי auth — במיוחד **שרטוטים** (אוקלידית, טריגו, מרוכבים, כל שנתוני הארכיון), עמוד המבחן בפנים, chat/KaTeX. הכשל האפשרי = קו בלתי-נראה, לא שגיאה.

**⏭️ הבא לפי התוכנית (מיילסטון B, סדר: B5 PWA-verify → B4 עיגון מורה לכל 14 נושאים+prompt-caching → B6 streak/יעד-יומי → B2 מחברת טעויות → B1 סולם עזרה → B3 סימולציית בגרות), ואז מיילסטון C (C1 טריגו-במרחב → C2 פרבולה lesson[] → C5 הערות סילבוס → C3 וקטורים-במישור → C4 נסיגה+ברנולי). הכל מפורט בקובץ התוכנית.**

## 🆕 LATEST (2026-07-03): ניתוח מתחרה MathIns → מבחן מעורב + מעקב חולשות + /insights (נדחף `f3bd393` → חי)

**ניתוח המתחרה MathIns** (com.mathins.app, יזם uri shech מכפר סבא, iOS+Android, ~10 הורדות אנדרואיד, שיווק אגרסיבי בטיקטוק/אינסטגרם @mathins.il): פותר-במצלמה (OCR→פתרון מלא), סולם עזרה 3 רמות (רמז/חלקי/מלא), "תרגולים אישיים" לפי חולשות (AI), מבחנים אמריקאיים מג'ונרטים, צ'אט מורה, היסטוריה+מועדפים. פרימיום: 5 פעולות חינם → מנוי שבועי/חודשי/חצי-שנתי. **חולשותיהם:** אין קורס מובנה, אין מאגר בגרויות אמיתיות, הכל LLM טהור (סיכון הזיות), פוזיציית "פותר" לא "מלמד". **הפוזיציה שלנו מולם: "MathIns פותר לך — בגרות בכיס מלמדת אותך לפתור" + בנק מאומת דטרמיניסטית.**

**מה נבנה (איתי בחר ב-AskUserQuestion: "מבחן מהיר + מעקב חולשות" לפני סריקת-מצלמה/סולם-עזרה):**
- **`lib/results.ts`** (חדש): יומן תוצאות ב-localStorage (`bagrut-results-v1`, cap 1000) — כל תשובה נרשמת `{subject,topic,subTopicId?,questionId?,source:'quiz'|'drill'|'bagrut',difficulty,correct}`. אגרגציות: `topicStats`/`subTopicStats`/`weakestSubTopics`/`weakestTopics`/`totalStats`. **רק ניסיון ראשון נמדד.** localStorage בכוונה (עובד בלי login, אפס עלות; שדרוג עתידי: מירור ל-Supabase).
- **`app/quiz/page.tsx`**: כרטיס **"🎯 מבחן מעורב — כמו בבגרות"** (sentinel `__mixed__`) — 8 שאלות MCQ round-robin מכל נושאי הבנק (סטטיסטיקה מוחרגת — מחוץ לסילבוס), אפס עלות AI; מסך תוצאות עם **פירוק לפי נושא מהחלש לחזק** (answered כולל topic עכשיו); רישום כל תשובה ל-results; קישורי /insights. שמירת session ל-Supabase `practice_sessions` נשמרה (topic='מבחן מעורב'). (גילוי: הטבלה `practice_sessions` קיימת ופעילה — ה-quiz שומר אליה sessions מאז ומתמיד.)
- **`components/practice/SubTopicPractice.tsx`**: רישום ניסיון-ראשון MCQ + self-report של פתוחות ל-results (עם subTopicId); קישור /insights במסך הסיום.
- **`app/insights/page.tsx`** (חדש, "📈 התמונה שלי"): client-only (useEffect נגד hydration mismatch), פר subject (math5 ראשון): סה"כ/דיוק/נכונות, **CTA "תרגול חיזוק"** → קופץ ל-practice של התת-נושא החלש ביותר, רשימת "מה שווה לחזק" (weakestSubTopics: מינ' 3 ניסיונות, ≤85%), ברי דיוק פר נושא. עיצוב אינדיגו-אקדמי (surface-premium/gradient-text/btn-primary).
- אומת: tsc נקי, `npm run build` עבר (/insights static). **נדחף `f3bd393`** (pathspec 4 קבצים; WIP מקבילי לא נגעתי — שימו לב: הופיע `app/scan/` untracked בריפו, כנראה סשן מקביל בונה סריקה).

**הבא מהניתוח (לא נבנה, לפי בחירת איתי):** (1) סולם עזרה אחיד רמז→כיוון→פתרון בכל שאלה; (2) סריקת שאלה במצלמה כ"מורה מדריך" (Claude vision, דורש הגבלת עלות — תקציב $5; לבדוק קודם את app/scan הקיים!); (3) רישום ורדיקטים של QuestionPartCard (בגרות) ל-results — דורש העברת subject/subTopicId בשרשרת ה-props; (4) שיווק: טיקטוק/אינסטגרם הוא הפער האמיתי מול MathIns.

## 🆕 LATEST (2026-06-19, מאוחר): מאגר — **קיץ 2025 מועד ב' שאלון 582, Q1** (נדחף `1e86303` → חי)
איתי חזר ל-workflow המאגר ושלח שאלה+פתרון-בכתב-יד מ**קיץ 2025 מועד ב' שאלון 582, שאלה 1** (גאומטריה אנליטית). יצרתי **קובץ חדש** `content/past-bagruyot/2025-summer-582-moed-b.ts` (export `bagrut2025Summer582MoedB`, id `b2025s582b-q1`) ורשמתי ב-index.ts. **גילוי:** כבר היה קובץ untracked `2025-summer-582.ts` (מועד **א'**, `b2025s582a-q1`, פרי סשן קודם) שכבר היה מחובר ל-index.ts אך **לא נדחף** — מכיוון ששניהם חולקים את index.ts, דחפתי את שלושת הקבצים יחד (pathspec) כדי שה-deploy יהיה עקבי, אז **גם מועד א' Q1 עלה עכשיו לאוויר**. **השאלה (אומתה ידנית, k=3/2):** אליפסה $\frac{x^2}{25k^2}+\frac{y^2}{16k^2}=1$ → $a=5k,b=4k,c=3k$, מוקד $F(3k,0)$, מעגל רדיוס $2k$ → $(x-3k)^2+y^2=4k^2$ (א); $B(0,4k)$, $BF=5k$, $DF=R=2k$, $BD=3k$ → יחס $\frac32$ (ב1); חלוקת קטע → $D(\frac{9k}5,\frac{8k}5)$ (ב2); משיק ⟂ רדיוס, $m_{BF}=-\frac43$ → $y=\frac34x+\frac k4$ כלומר $-3x+4y-k=0$ (ג); צלע ריבוע (9) מקבילה במרחק 9, $B$ בפנים → $-3x+4y-k-45=0$ (ד); $B$ מרכז הריבוע → מרחק $4.5$ מהמשיק $=3k$ → **$k=\frac32$** (ה). **2 שרטוטי custom SVG** (אליפסה+מעגל+B,F,D; ריבוע נטוי עם משיק-זהב/צלע-מקבילה-ירוקה/אלכסונים/BD=4.5). אומת: check-katex-hebrew 0/48, `tsc` נקי, `npm run build` עבר.

**עדכון (אותו סשן): נוספו Q2 ו-Q3** (נדחף `a38b665`, +424 שורות לאותו קובץ; pathspec). **Q2 וקטורים במרחב** (`b2025s582b-q2`, מנסרה ישרה $AOBA'O'B'$, בסיס ישר-זווית ב-$O$): א1 $\overrightarrow{O'N}=\frac14\underline u+\frac14\underline v-\frac12\underline w$; א2 $\overrightarrow{O'N}=\frac12\overrightarrow{O'K}$ → קולינאריות, יחס $O'K/O'N=2$; ב $N(3,2.25,13.5)$, $B(0,9,0)$, $O'(0,0,27)$; ג מישור $3x+4y-36=0$ (נורמל $(3,4,0)$); ד1 מרחק $N$ למישור $=18/5=3.6$; ד2 שטח $A'KB'=\frac{15\cdot27}2=202.5$, נפח פירמידה $=\frac13\cdot202.5\cdot3.6=243$. 2 שרטוטים (מנסרה אובליקית עם u/v/w/E/N/K + קו O'NK בזהב; פירמידה NA'KB' עם אנך 3.6). **Q3 מספרים מרוכבים** (`b2025s582b-q3`): א $z_2=\frac{-51+12i}{6+3i}=-6+5i$; ב $w^3=z_1{+}z_2=8i=8\text{cis}90°$ → $2\text{cis}30°/150°/270°$; ג $z,z^3$ קולינאריים דרך הראשית → $2\theta=180°k$ → $z=2\text{cis}\{0,90,180,270\}$; ד מצולע קמור — 7 מספרים אך $270°$ משותף ל-ב ול-ג → **6 קודקודים** (זוויות $0,30,90,150,180,270$), שטח = סכום 6 משולשים מרכזיים $=6+2\sqrt3\approx9.46$; ה כפל ב-$4\text{cis}\alpha$ = סיבוב+הומותטיה פי 4 → שטח פי $4^2=16$. שרטוט: מצולע במישור גאוס עם spokes + קוד-צבע (ב=זהב, ג=כחול, משותף=ירוק). אומת ידנית, katex 0/48, tsc+build עברו. **🔑 פורמט שעבד ל-Q2/Q3:** strings ב-**מרכאות כפולות** (בגלל פריים `'` ב-$A'$/$O'$/$S'$ ו-cis) במקום גרשיים; SVG ב-backtick. **⏭️ Q4 נוספה (2026-06-22, נדחף `594648a` → חי):** `b2025s582b-q4` חקירת **פונקציה מעריכית** $f(x)=\frac{e^x+x}{e^x-x}+b$. א1 2 אסימפ' אופקיות ($+\infty$: חלוקה ב-$e^x$→$y=1+b$; $-\infty$: חלוקה ב-$x$→$y=b-1$); א2 חיתוך ציר y=$(0,1+b)$; א3 $f'=\frac{2e^x(1-x)}{(e^x-x)^2}$, מקס' $(1,\frac{e+1}{e-1}+b)$+טבלת-סימנים SVG; ב אסימפ' $y=1.5$→$b=0.5$ או $2.5$ (בג-ה: $b=0.5$ הקטן); ג סקיצת $f$ (max(1,2.66), אסימפ' 1.5/-0.5); ד1 חיתוך-y=נק' פיתול, אסימפ' $f'$→$y=0$; ד2 סקיצת $f'$ (max(0,2), אפס(1,0)); ה הטענה $\int_0^1(f-1.5)dx>\frac1{e-1}$ **נכונה** ($g(1)=\frac2{e-1}$, משולש$=\frac1{e-1}$, $f$ קעורה-מטה→מעל המיתר). 4 SVG, אומת מספרית ב-node (∫≈0.769>0.582), katex 0/48, tsc+build עברו. **✅ Q5 נוספה (2026-06-22, נדחף `51095db` → חי) — מועד ב' הושלם (Q1–Q5):** `b2025s582b-q5` חקירת **פונקציות ln**. $f(x)=\frac{x\ln x}{1+\ln x}$: א1 תחום $x>0,x\ne\frac1e$; א2 אסימפ' אנכית $x=\frac1e$; א3 חיתוך ציר x $(1,0)$; ב $f'=\frac{\ln^2x+\ln x+1}{(1+\ln x)^2}$, מונה ($t^2+t+1$, דיסקר' $-3$) חיובי תמיד → **עולה בכל התחום, אין ירידה**; ג סקיצה. $g(x)=\frac{1+\ln x}{x\ln x}=\frac1f$: ד1 תחום $x>0,x\ne1$; ד2 "אסימפ' מאונכות לצירים" = **אנכיות $x=0,x=1$ + אופקית $y=0$** (ביקשו את כולן!); ד3 סקיצה (אפס ב-$\frac1e$). ה: $g=\frac1{x\ln x}+\frac1x$; **ה1** קדומה $\ln(\ln x)+\ln x$ → $\int_{e^k}^{e^{2k}}=k+\ln2$ = **ביטוי II**; **ה2** שטח $[e^2,e^4]$ = מקרה $k=2$ → $2+\ln2$. **ה אומת מול כתב-יד** (איתי שלח המשך אחרי ד3): הפתרון שלי תאם בדיוק — II ו-$2+\ln2$. ההבדל היחיד קוסמטי: כתב-ידו השתמש בקדומה מאוחדת $\ln|x\ln x|$, אני פיצלתי ל-$\ln(\ln x)+\ln x$ (שקול). 3 SVG. **כעת מועד ב' שלם; מועד א' עדיין Q4–Q7 ממתינות.** (הערה: רץ סשן מקביל שמוסיף שאלות ל-**מועד א'** `2025-summer-582.ts` — קובץ נפרד; נראה commit `432f096` שלו ביניהן. לא להתבלבל בין מועד א' למועד ב'.)

## 📌 תוכנית לסשן הבא (≈2026-06-20): עיגון 581 לבגרויות אמיתיות
איתי יעלה **בגרויות 581 אמיתיות** (שאלה + פתרון בכתב-ידו, כמו ה-workflow של 582). אז: (1) להוסיף אותן ל**מאגר** `content/past-bagruyot/` (פורמט clean-stacked + סרטוטים, per-question, pathspec — כמו 582; **כרגע אין אף קובץ 581 שם**), ו-(2) **לבנות/לעגן את הסיכומים והקורס של 581 "מ-0" לפי הבגרויות האמיתיות**. ⚠️ **חשוב להגיד לו:** התוכן של 581 שבניתי ב-2026-06-19 (כל 8 הנושאים לרף הזהב) נבנה מ**ידע סילבוס בלבד**, לא מבגרויות 581 אמיתיות (אין כאלה בריפו). הבגרויות שיעלה הן ה-scope/style האותנטי — לאמת מולן, לתקן off-scope, ולעגן (כמו הלקח המתועד: לא לנחש scope, לעגן לבגרויות אמיתיות; cross-check לפני הוספה/הסרה).

## 🆕 LATEST (2026-06-19): מאגר — **קיץ 2025 מועד א' שאלון 582: Q1 (אנליטית) + Q2 (וקטורים) + Q3 (מרוכבים)** (נדחף עד `643d96c` → חי)

קובץ `content/past-bagruyot/2025-summer-582.ts` (export `bagrut2025Summer582`, moed:'a'). **Q1** = `b2025s582a-q1` (אנליטית — מעגל $x^2-8x+y^2+t=0$, משיק $y=x$→$t=8$, מקום גאומטרי→אליפסה $\frac{x^2}8+\frac{y^2}4=1$, היקף $4+4\sqrt2$, שטח חסום ב-4<5). **Q2** = `b2025s582a-q2` (וקטורים, פירמידה $SABCD$ בסיס מקבילית, $SA$ גובה): **א** $\vec{SM}=\frac12\vec u+\frac12\vec v-\vec w$; **ב** $\vec{SM}\cdot\vec{DB}=0$+$\vec w\perp$בסיס → $|\vec u|=|\vec v|$; **ג** $D(6,8,0),C(6,18,0)$; **ד** מישור דרך $AC$ ‖ $SD$ → $18x-6y+5z=0$; **ה1** $\vec{KM}=(3,4,-6)=\frac12\vec{SD}$→$KM\!\parallel\!SD$ נכונה; **ה2** נורמל⊥SD→כל אנך למישור $ACK$ מאונך ל-$SD$ נכונה ($K(0,5,6)$ אמצע $SB$, $M(3,9,0)$). **2 שרטוטי SVG** (פירמידה עם $\vec u/\vec v/\vec w$/M; חתך $ACK$ עם $KM\!\parallel\!SD$ — projection ליניארי אמיתי כך שהמקבילות נשמרת). אומת: tsc נקי, check-katex-hebrew 0/48, runtime. דחפתי **רק** את קובץ מועד-א' (`432f096`, pathspec) — Q1 כבר עלה ב-`1e86303` של הסשן המקביל; ה-WIP המקביל (statistics.ts, 2020-summer-582.ts, untracked) לא נגעתי. ⚠️ **דיוק:** השאלות שאיתי שלח לי הן **מועד א'** (הוא אישר מפורשות "תדחוף אותם למועד א"); קובץ מועד-ב' (`2025-summer-582-moed-b.ts`) הוא תוכן נפרד מהסשן המקביל (שאלות **שונות**). **Q3** = `b2025s582a-q3` (מרוכבים, נדחף `643d96c`, +236 שורות): **א** מקום $|z|=|z-(2+2i)|$ → $x+y-2=0$ (חוצה אנך); **ב** $z^2-z(2+2i)+4i=0$: $\Delta=-8i$, $\sqrt\Delta=\pm(2-2i)$ → $z_1=2$ ($B(2,0)$), $z_2=2i$ ($A(0,2)$), שתיהן על המקום; **ג1** ($n=8$): 4 קודקודים על $|z|=2$ ב-$0/90/180/270°$+סיבוב → 8 שוות-מרווח $45°$ → **$\alpha=45°,b=2^8=256$** (מתומן); **ג2** ($\alpha=15°$): זוויות כולן כפולות $15°$ → $\frac{360}n=15$ → **$n=24,b=2^{24}$**. **3 שרטוטי SVG** (מקום+A,B; מתומן 45°; 24-גון עם 16 נקודות-עמומות+2 ריבועים). **✅ Q4 נוספה (2026-06-22, נדחף `bc9578c` → חי):** `b2025s582a-q4` חקירת **פונקציה מעריכית עם פרמטר** $f(x)=\frac{e^x}{a-e^x}$, $a\ne0$. א1 תחום (a>0: $x\ne\ln a$; a<0: כל x — $e^x\ne a<0$); א2 אסימפ' אופקיות $y=-1$ ($+\infty$), $y=0$ ($-\infty$) — לשני המקרים; א3 $f'=\frac{ae^x}{(a-e^x)^2}$, סימן=סימן a → a>0 עולה, a<0 יורדת; ב התאמת גרף: **a=5→II** (VA ב-$\ln5$, עולה), **a=-5→III** (ללא VA, יורדת); [מציבים a=5] $g=\frac1{f+2}=\frac{5-e^x}{10-e^x}$: ג1 תחום $x\ne\ln5,\ln10$; ג2 אסימפ' אנכית $x=\ln10$ + אופקיות $y=1,y=\frac12$ (ב-$\ln5$ חור לא אסימפ'); ד סקיצה (יורדת, $g'=\frac{-5e^x}{(10-e^x)^2}<0$, חור ב-$(\ln5,0)$); ה הטענה $\int_{-6}^{-4}g>\int_4^5 g$ **לא נכונה** — שמאל $g<\frac12$ על רוחב 2 → $<1$; ימין $g>1$ על רוחב 1 → $>1$; אז שמאל$<$ימין. אומת מספרית (0.999<1.066). 3 SVG (4 גרפים I-IV להתאמה, גרף g, השוואת שטחים). katex 0/48, tsc+build עברו. **✅ Q5 נוספה (2026-06-22, נדחף `8eb0183` → חי):** `b2025s582a-q5` חקירת $f(x)=\ln(x^n)$, $n$ **זוגי**. א1 תחום $x\ne0$ ($x^n>0$); א2 התאמת גרף → **II** ($f$ זוגית: $f(-x)=\ln((-x)^n)=\ln(x^n)=f$, סימטרי לציר y, $\to-\infty$ ב-0, $\to+\infty$ בקצוות); [n=2] $g=(f)^2-4=(\ln(x^2))^2-4$: ב1 חיתוכי x: $g=0\to f=\pm2\to x=\pm e,\pm\frac1e$; ב2 $g'=2f\cdot f'=\frac{4\ln(x^2)}{x}$, אפסים $x=\pm1$ (f'=2/x לעולם≠0), **2 מינימומים $(\pm1,-4)$** (טבלת סימנים $-,+,-,+$); ג סקיצה (W זוגי, VA $x=0\to+\infty$, מינ' $(\pm1,-4)$, 4 חיתוכים); $k=\frac{g'}{g}$, $x>0$: ד1 תחום $x>0,x\ne\frac1e,e$; ד2 שטח על $[e^2,e^3]$ = נגזרת לוגריתמית $\int\frac{g'}{g}=\ln|g|$, $g(e^3)=6^2-4=32$, $g(e^2)=4^2-4=12$ → $\ln32-\ln12=\boxed{\ln\frac83}$. אומת מספרית (∫≈0.981, k>0). 3 SVG (4 גרפים, טבלת סימנים, גרף g). katex 0/48, tsc+build עברו. **כל הפתרון היה בכתב-יד איתי (א-ד) — אומת מולו.** **הבא: Q6–Q7 מועד א' 2025 אם ישלח.** (⚠️ שני קבצים נפרדים: מועד א' = `2025-summer-582.ts` שלי; מועד ב' = `-moed-b.ts` הסשן המקביל. ה-repo עם WIP מקבילי — push pathspec בלבד, אף פעם לא `git add .`.)

**Q1 (גאומטריה אנליטית) — אומת מול כתב-ידו, נכון לגמרי:** מעגל $I$: $x^2-8x+y^2+t=0,\ t<16$. **א** השלמה לריבוע → $(x-4)^2+y^2=16-t$, מרכז $M(4,0)$, **$R=\sqrt{16-t}$**. **ב** הישר $y=x$ משיק → מרחק מ-$M$ לישר $=R$: $\frac{4}{\sqrt2}=\sqrt8$ → $16-t=8$ → **$t=8$**. **ג** מזיזים שמאלה → מעגל $II$: $x^2+y^2=8$; מיתר אופקי $A(x_A,y),B(-x_A,y)$, $AB=2\sqrt{8-y^2}$, $P(x,y)$ על המיתר, $AB=2PO$ → $8-y^2=x^2+y^2$ → **אליפסה $\frac{x^2}{8}+\frac{y^2}{4}=1$**. **ד** $a^2=8,b^2=4,c=2$; מוקדים $K(2,0),F(-2,0)$; $CF+CK=2a=4\sqrt2$, $FK=2c=4$ → **היקף $=4+4\sqrt2$**. **ה** $S=\frac{FK\cdot|y_C|}{2}=2|y_C|$; על האליפסה $|y_C|\le b=2$ → $S_{\max}=4<5$ → **אין נקודה $C$**. **4 סרטוטי custom SVG** (מעגל+משיק ברמת השאלה; אליפסה-construction+משולש $CKF$+שטח-מרבי בקודקוד פר-סעיף ג/ד/ה). **אימות:** `tsc` נקי, `check-katex-hebrew.ts` 0/47, runtime: נטען ומתויג. **לא נדחף עדיין** (לא ביקש commit/push; pathspec בלבד כשידחוף). ⚠️ הנחתי **מועד א'** (לא צוין) — לאמת מול איתי אם זו מועד ב'. **הבא:** Q2–Q7 של 2025 אם ישלח.

## 🆕🆕🆕🆕🆕🆕🆕🆕🆕🆕 LATEST (2026-06-19, ערב): **כל שאלון 581 הושלם לרף הזהב** (תוכנית מאושרת, נדחף עד `8f2b4f5` → חי)

איתי אחרי 582: "לעבור ל-581 ולהביא לאותו רף... מדויק/ברור/נכון מתמטית. בעתיד שיפורים ל-582 לפי בקשה." עבדתי ב-plan mode → תוכנית `humble-drifting-alpaca.md`. **8 נושאי 581** (`PAPER_581`), כולם היו עם קובץ+בנק בגרות אבל בלי `lesson[]`/`subTopicId`. **החלטות איתי:** אוקלידית בשלב נפרד בסוף; בעיות מילוליות — לא עכשיו.

**בוצע (אותה שיטה מוכחת מ-582: סוכני author מקבילים קובץ-לכל-סוכן + אימות עצמאי שלי):**
- **גל 1** (`da356ef`): derivatives/integrals/trigonometry (581 = פונקציות אלגבריות; טריגו במעלות). verify 80/86/77.
- **גל 2** (`8c03733`): algebra/functions/sequences. verify 89/102/56.
- **probability** (`ec3e518`): נבנה subTopics מאפס (prob-basics/conditional/combinatorics). 77/77.
- **euclidean-geometry** (`8f2b4f5`): נבנה מאפס — 4 תתי-נושאים עם שרטוטים (triangle/twoTriangles/circle/parallelTransversal/polygonInscribed) + פדגוגיית הוכחה (נתון→צריך להוכיח→טענות+נימוקים). **4 הוכחות הבגרות נקראו ידנית** (אין verify מספרי להוכחות) — כולן נכונות. 57/57 numeric.

**🔑 שדרוג שמירה:** `scripts/verify-specs.ts` הורחב לכל 14 הנושאים — מריץ את `checkAnswer` האמיתי על כל value/set spec → **126/126 גרדינג נכון**. `check-katex-hebrew.ts` → 0 בכל 46 הקבצים. כל נושא קיבל `scripts/verify-<topic>.ts` ייעודי. tsc+build עברו בכל גל.

**מצב כולל: כל 14 נושאי המתמטיקה (6×582 + 8×581) ברף הזהב** — לימוד מודרך פר-תת-נושא + תרגול מטפס + שאלת בגרות מתויגת + בדיקה דטרמיניסטית. **הבא האפשרי:** דיאגרמות בשיעורי 582 (אוקלידית כבר עם שרטוטים); בדיקה דטרמיניסטית לדרילים הקצרים; בעיות מילוליות כנושא חדש; פוליש/שיפורים נקודתיים לפי בקשת איתי.

---

## 🆕🆕🆕🆕🆕🆕🆕🆕🆕 LATEST (2026-06-19): **כל שאלון 582 הושלם לרף הזהב** (3 סוכנים מקבילים + אימות עצמאי, נדחף `dcdd645` → חי)

איתי: "הפעל כמה סוכנים שאתה צריך, שכל שאלון 582 יהיה באותו אופן (תתי-נושאים + תרגול), מדויק/ברור/נכון מתמטית." מיפיתי: 582 = מעריכית/ln/גדילה + אנליטית/וקטורים/מרוכבים (כבר בוצעו). **קבצים קנוניים** (index.ts): `exp-functions.ts` (לא exponential.ts!), `ln-function.ts`, `growth-decay.ts`. הפעלתי **3 סוכני general-purpose במקביל** (קובץ נפרד לכל אחד → אפס התנגשות), כל אחד עם spec מחמיר (תבנית הזהב, קונבנציות, חוקי KaTeX/RTL, חובת סקריפט-אימות+tsc, בלי build/commit).

**נבנה (commit `dcdd645`, ~3160 שורות):**
- **exp-functions**: `lesson[]` ל-4 תתי-הנושאים (נגזרות/משוואות/חקירה/אינטגרל) + `exp-bag-006..009` מתויגות.
- **ln-function**: `lesson[]` ל-5 תתי-הנושאים (תכונות/נגזרות/משוואות/חקירה/אינטגרל) + `ln-bag-005..009`.
- **growth-decay**: **לא היה subTopics בכלל** — נבנה מאפס: `gd-model`/`gd-time-rate`/`gd-applications` עם summary/keyPoints/formulas/lesson[]/5 דרילים כ"א + `gd-bag-002..004`.

**🔑 תיקון קריטי שמצאתי באימות עצמאי (lib/answer-check.ts):** מנוע הבדיקה הדטרמיניסטי לא תמך בלוגריתם טבעי כלל — `ln(...)` ב-spec או בקלט תלמיד נכשל (mathjs דיפולטי: אין `ln`, רק `log` שהוא הטבעי). הוספתי נירמול `\ln`/`ln` → `log` (+ `log`/`e` ל-implicit-mult). בלי זה כל תשובות ה-ln/מעריכית/גדילה לא היו נבדקות אוטומטית. **לקח: סקריפטי ה-verify של הסוכנים בודקים מספרים דרך mathjs — הם לא בודקים את מסלול checkAnswer האמיתי.**

**אימות (לא סמכתי על הסוכנים):** הרצתי את 3 הסקריפטים (58/87/56) + **`scripts/verify-specs.ts` חדש שמריץ את `checkAnswer` האמיתי על כל ה-value/set specs בכל 6 הנושאים → 58/58** (אחרי תיקון ה-ln). `tsc` נקי, `npm run build` עבר, 0 עברית-ב-KaTeX (הסוכנים אף תיקנו 2 באגים קיימים: `\text{ליטר}`, `\text{ערך}`). ספוט-צ'ק ידני של exp-bag-008/ln-bag-008/gd-bag-003 — מתמטיקה נכונה, קונבנציות תקינות.

**מצב 582: כל 6 הנושאים עם לימוד מודרך + תרגול מטפס + שאלת בגרות פר-תת-נושא.** **הבא האפשרי:** דיאגרמות בשיעורים; בדיקה דטרמיניסטית גם לדרילים הקצרים (PracticeQuestion.expected); חוב הקונבנציה ב-learning-paths (task `task_48bc69bc`); נושאי 581 (אם איתי ירצה).

### ניקוי KaTeX אפליקציה-רחב (2026-06-19, נדחף `422e840`)
איתי: "תעבור על הכל ותסדר". נכתב **`scripts/check-katex-hebrew.ts`** — סורק קבוע שמחלץ כל span מתמטי בכל קבצי התוכן ומסמן עברית בתוכו (מתעלם מ-`${}` JS ומ-`\$` מטבע). נמצא+תוקן באג אמיתי אחד: `complex-numbers.ts` `$$|z-z_0|=\text{עברית}$$` → הועבר לפרוזה. שני "ממצאים" אחרים היו false-positives (אינטרפולציית JS ב-bagrut-context; מטבע `\$5000` ב-growth-decay). **כל 46 קבצי התוכן נקיים עכשיו (0 ממצאים).** להריץ את הסורק הזה אחרי כל authoring עתידי.

---

## 🆕🆕🆕🆕🆕🆕🆕🆕 LATEST (2026-06-18, ערב 2): שאלות בגרות פר-תת-נושא לכל הנושאים (נדחף `425552c`+`0760b82` → חי)

איתי (עם צילום מסך של מסך סיום תרגול ללא שאלת בגרות): "אחרי כל תת-נושא עם 5 תרגולים קצרים — שיהיו גם תרגולים ברמת בגרות על כל תת-נושא." זה סגר את הפער שהיה מתועד (התרגול-המטפס-עד-בגרות לא היה שלם בוקטורים/אנליטית). **הופעל skill bagrut-math-pedagogy.**

**מצב קודם:** מרוכבים — לכל 5 תתי-הנושאים כבר היו שאלות בגרות מתויגות ✓. וקטורים — רק `vec-bag-001` (capstone). אנליטית — רק `ag-bag-001/002` (ישר/מעגל). **הווירינג גנרי:** `sub/[subId]/practice/page.tsx` כבר מעביר `getBagrutQuestionsForSubTopic` לכל נושא → צריך רק לכתוב+לתייג.

**נכתב (8 שאלות בגרות מלאות, מאומתות):**
- אנליטית (`425552c`): `ag-bag-003→ag-parabola` (y²=2px!), `ag-bag-004→ag-ellipse`, `ag-bag-005→ag-loci` (אפולוניוס). verify-analytic → 76/76.
- וקטורים (`0760b82`): `vec-bag-002..006` → 5 תתי-הנושאים (basics/dot/cross/line-plane[שיטת מערכת]/distances). verify-vectors → 71/71.
- **כל סעיף סקלרי קיבל `expected: AnswerSpec`** (value/set) → בדיקה דטרמיניסטית חינם דרך `checkAnswer` ב-`QuestionPartCard`; סעיפי משוואה/נקודה/וקטור = `{kind:'manual'}`. כל שאלה 3-4 סעיפים, 3 רמזים מדורגים לכל סעיף.
- `tsc` נקי, `build` עבר, 0 עברית-ב-KaTeX. כל ערך מספרי אומת בסקריפט (147 בדיקות סה"כ בין שני הסקריפטים).

**עכשיו: כל 15 תתי-הנושאים (3 נושאי זהב × 5) מסתיימים בשאלת בגרות אמיתית.** **הבא האפשרי:** B2 המקורי (בדיקה דטרמיניסטית גם לדרילים הקצרים, לא רק לשאלות הבגרות — דורש `expected` על `PracticeQuestion`); דיאגרמות בשיעורים; נושאים נוספים (exp/ln/גדילה).

---

## 🆕🆕🆕🆕🆕🆕🆕 LATEST (2026-06-18, ערב): פוליש ויזואלי + שדרוג חוויית התרגול (תוכנית מאושרת `humble-drifting-alpaca.md`, נדחף `f5b38cf` → חי)

איתי נתן משוב כן: (1) הלימוד/ההסברים "לא מרגישים מקצועיים ומסודרים בעין" (בנייד הרינדור תקין — זו בעיית פוליש, לא תוכן). (2) "התרגולים עצמם" חלשים. עבדתי ב-plan mode (2 סוכני Explore מיפו את הרינדור והדרילים). **השאלות המבהירות לא נענו → המשכתי עם ההמלצות: שומרים על הכיוון העיצובי (אקדמי/אינדיגו/serif), מיישמים מסודר; "תרגולים" = בעיקר החוויה/הבדיקה.**

**אבחנה (מ-Explore):** השיעורים — ריווח צפוף (`space-y-3`), כרטיסי נוסחה שטוחים (הגרדיאנט היה `from-indigo-500/10 to-indigo-500/10` = אותו צבע!), affordance כמעט בלתי-נראה, תיבת תשובה שלא נקראת כתוצאה. הדרילים (`SubTopicPractice`) = "בודק מינימלי" חלש מול `QuestionPartCard` העשיר (תשובה פתוחה בלי בדיקה כלל, אין ניסיון חוזר, רמז יחיד, ניקוד מטעה).

**מה בוצע (חלק A + B1, commit `f5b38cf`, 5 קבצים):**
- **A (פוליש, רכיבים משותפים → כל הנושאים):** `globals.css` — שני utilities: `.formula-surface` (גרדיאנט אינדיגו אמיתי+עומק), `.result-box` (תיבת תוצאה אמרלד+זוהר). `FormulaCard`/`WorkedExampleCard`/`SubTopicLesson` עודכנו: עומק אמיתי, affordance ברור ("הצג פתרון"+chevron מסתובב+`active:`), היררכיית כותרות, אוויר (`space-y-4`), הפרדת שכבת הסבר/נוסחה.
- **B1 (מכניקת דרילים, `SubTopicPractice.tsx`):** ניסיון חוזר ב-MCQ (שגוי מסומן ב-rose, לא כופה פתרון), ניקוד אמין (נכון-בניסיון-ראשון + הערכה עצמית), הערכה עצמית לפתוחות ("פתרתי נכון"/"עוד לא הצלחתי"), כרטיס שאלה→`surface-premium`.
- **🔑 שמרתי על "פתרון מלא בבת אחת"** (העדפת איתי מ-`fb5a7e8`) — לא הוספתי צעד-אחר-צעד, למרות שה-Explore הציע. ⚠️ השתמשתי ב-**rose לתשובה שגויה** (סמנטיקת שגיאה) — חריגה מודעת מפלטת האינדיגו; אם איתי לא אוהב, קל להחליף.
- `tsc` נקי, `build` עבר, אומת ש-`.formula-surface`/`.result-box`/`rose-500` קומפלו ל-CSS הסופי.

**הבא (חלק B2, לא בוצע — דורש אישור):** בדיקה דטרמיניסטית אמיתית לתשובות פתוחות בדרילים — להוסיף `expected?: AnswerSpec` ל-`PracticeQuestion` ב-`types.ts`, לחבר `checkAnswer()` (כמו ב-`QuestionPartCard`), ולאכלס specs פר-שאלה (להתחיל מנושאי הזהב). math-risk → לאמת בסקריפט. גם: `QuickExerciseView` עדיין עם צעד-אחר-צעד (סותר את העדפת "בבת אחת") — מועמד לתיקון.

---

## 🆕🆕🆕🆕🆕🆕 LATEST (2026-06-18, מאוחר): מבנה-הזהב ל**גאומטריה אנליטית** — כל 5 תתי-הנושאים (נדחף עד `c31cc2f` → חי)

איתי: "תמשיך לגאומטריה אנליטית שהכל יהיה הכי מדויק ומובן". **חשוב: הופעל ה-skill `bagrut-math-pedagogy`** (חדש, רלוונטי לכל כתיבת תוכן מתמטי באפליקציה — להפעיל אותו תמיד לפני authoring; הוא נותן את רף האיכות: ללמד לא לסכם, why-לפני-how, micro-loop, אזהרת טעויות נפוצות, שאלת בגרות בסוף, gold=דה-מואבר).

**מצב הקובץ:** `content/lessons/math5/analytic-geometry.ts` כבר עם 5 תתי-נושאים (ag-line, ag-circle, ag-parabola, ag-ellipse, ag-loci) + 5 דרילים כ"א + 2 שאלות בגרות (ag-bag-001/002) — **בלי `lesson[]`** (אותו מצב כמו וקטורים). **סקופ:** `bagrut-curriculum.ts:50,242` מסמן שפרבולה+אליפסה **חסרי תוכן / מחוץ לליבת 582** ("קיים רק ישר ומעגל"). לכן עשיתי **ישר + מעגל** בלבד (הליבה הוודאית של 582), לא נגעתי בפרבולה/אליפסה/מקומות.

**מה נבנה (commit `6bfaf39`, 3 קבצים, +377):**
- **`lesson[]` ל-ag-line** (6 צעדים: משוואה כמבחן → שיפוע → נקודה-שיפוע → דרך 2 נקודות → מקבילים/מאונכים → מרחק נקודה-ישר → חיתוך 2 ישרים) ו-**ag-circle** (6 צעדים: המשוואה=פיתגורס → קנונית → השלמת ריבוע → ממרכז+נקודה → חיתוך ישר-מעגל → משיק רדיוס⟂ → תנאי משיקות מרחק=r). אזהרות טעויות-נפוצות מובנות (מאונך $-1/m$ לא $-m$; סימן מרכז; $r^2$ לא $r$).
- **תויגו שתי שאלות הבגרות:** `ag-bag-001→ag-line`, `ag-bag-002→ag-circle` — כך **כל אחד משני המודולים מסתיים בשאלת בגרות אמיתית** (התאמה 1:1, אומתו ידנית: $3x{+}10y{=}31$/חוצה; משיק $x{=}5$/Q בחוץ).
- **`scripts/verify-analytic.ts`** (חדש, 38/38). `tsc` נקי, `build` עבר, 0 עברית-ב-KaTeX. ⚠️ **לקח:** סקריפטי verify בלי import הם global-scope ל-tsc → `pass/fail/num` מתנגשים בין קבצים; הוספתי `export {};` ל-verify-vectors+verify-analytic כדי להפוך אותם למודולים.

**עדכון (2026-06-18, מאוחר יותר): הושלמו פרבולה+אליפסה+מקומות** (commits `f9edad0`+`c31cc2f`). איתי ביקש להוסיף אותם. **אימות סקופ מול המאגר: פרבולה+אליפסה אכן בבגרויות 582 (2021–2024)** — הקומנט בסילבוס היה מטעה ("חסר תוכן" ≠ "מחוץ לסקופ"). **🔴 בעיית קונבנציה קריטית שנמצאה ותוקנה:** הקובץ לימד פרבולה בקונבנציה אמריקאית $y^2=4px$, מוקד $(p,0)$ — אבל **הבגרות של איתי (2024, שאלה 1, מכתב-ידו) משתמשת ב-$y^2=2px$, מוקד $(p/2,0)$, מדריך $x=-p/2$, משיק $yy_1=p(x+x_1)$**. איתי אישר (AskUserQuestion) לעבור ל-$2px$. תיקנתי את כל מודול הפרבולה (summary/keyPoints/formulas/5 דרילים/שורת-סיכום) — **התשובות הסופיות זהות, רק הפרמטר $p$ והנוסחאות השתנו**. נוספו `lesson[]` לפרבולה(6)/אליפסה(6)/מקומות(4). אליפסה+מקומות בקונבנציה אוניברסלית (לא נדרש תיקון). `verify-analytic.ts` הורחב ל-62/62.

**🔴 חוב קונבנציה שנותר (אותו $4px$ שגוי):** (א) `content/learning-paths/math5/analytic-geometry.ts` (מסלול /learn) — עדיין $4px$ בהרחבה (דוגמאות+דרילים+SVG); **נפתח spawn_task `task_48bc69bc`** להמרה. (ב) `content/past-bagruyot/2023-summer-582.ts:74,79` — שאלת בגרות עם $y^2=4px$; **צריך לוודא מול תמונת הבחינה האמיתית** של 2023 (האם הבחינה כתבה 4px או שזו טעות תמלול שלי) — לא לשנות עיוור. הצגתי לאיתי.

**הבא:** (1) חוב הקונבנציה למעלה (learning-path + 2023 past-bagrut). (2) שאלות-בגרות-פר-תת-נושא ל**וקטורים** (עדיין רק capstone אחד). (3) נושאים נותרים (אקספוננציאלית, ln, גדילה-ודעיכה) באותה תבנית.

---

## 🆕🆕🆕🆕🆕 LATEST (2026-06-18): שכפול מבנה-הזהב לנושא הבא — **וקטורים במרחב** (נדחף `26082e8` → חי)

איתי בחר (דרך AskUserQuestion) "לשכפל לנושא הבא". המלצתי וקטורים (הכי הרבה חומר קיים). **ממצא מפתח:** `content/lessons/math5/vectors.ts` כבר היה עם 5 תתי-נושאים (vec-basics, vec-dot-product, vec-cross-product, vec-line-plane, vec-distances-angles) — כל אחד עם summary+keyPoints+formulas+5 דרילים — אבל **בלי `lesson[]` המודרך** ובלי שאלות בגרות מתויגות. אז "שכפול הזהב" = הוספת ה-`lesson[]` (teach צעד-אחר-צעד + דוגמה פתורה לכל צעד) לכל 5 התתי-נושאים. אין שינוי ב-types.ts (`lesson?` כבר קיים).

**החלטת שיטה (דרך AskUserQuestion, חשוב לזכור):** איתי בחר **"מערכת + וקטורית לשטחים"** — מציאת נורמל למישור/מישור-דרך-3-נקודות **בשיטת המערכת** ($\vec n\cdot\vec{AB}=0,\ \vec n\cdot\vec{AC}=0$, דרגת חופש אחת, בוחרים ערך נוח) כשיטה ראשית; מכפלה וקטורית **רק לחישוב שטחים** (משולש/מקבילית) ולמרחק נקודה-ישר. זה תאם את ההעדפה המתועדת ופתר את הסתירה בין קובץ ה-lessons (שהשתמש ב-cross) ל-learning-path (שהשתמש במערכת). **הסילבוס 582 (`bagrut-curriculum.ts:253`) כולל "מכפלה סקלרית/וקטורית, ישר ומישור, משפט שלושת האנכים".**

**מה נבנה (commit `26082e8`, 2 קבצים, +748/-29):**
- **5 × `lesson[]`** מלאים ב-`vectors.ts` (ברף הזהב: זה-מדורג, דוגמה פתורה לכל צעד, מעלות, בלי דילוגים, clean-stacked).
- **תוקנו 3 דרילים שבורים שהיו חיים:** `vec-sub-basic-005` (סימון "$\vec{vB}$" לא-תקני שהפתרון עצמו הודה שאינו סטנדרטי) · `vec-sub-dot-005` (ביקש להוכיח ישר-זווית אך הנתונים לא נתנו — הפתרון התפלסף) · `vec-sub-lp-003` (הוסב לשיטת המערכת + נקודות חדשות כדי לא לשכפל את דוגמת השיעור).
- **`vec-bag-001` תויג `subTopicId: 'capstone'`** (שאלת בגרות משולבת: מישור+מרחק+שטח). אומת ידנית: $\vec n=(3,2,1)$, מישור $3x+2y+z=6$, $d=\frac{3\sqrt{14}}{7}$, $S=3\sqrt{14}$.
- **`scripts/verify-vectors.ts`** (חדש) — חישוב-מחדש בלתי-תלוי (dot/cross/norm dependency-free) של כל ערך מספרי בשיעורים+בדרילים שתוקנו: **51/51 עברו**. `npx tsc` נקי. `npm run build` עבר. grep אימת אפס עברית-ב-KaTeX (תפסתי+תיקנתי `S_{\text{מקבילית}}` לפני הדחיפה).

**סטטוס:** נדחף `26082e8` ל-main (pathspec בלבד; ה-WIP המקבילי = סדרת תיקוני-bidi זעירים של שורה-שתיים בכל קבצי `content/lessons/math5/*` + `2020-summer-582.ts`, לא נגעתי; vectors.ts נשא איתו תיקון-bidi קיים בן-שורה `\Longleftrightarrow` — benign ונכון). לא אומת ויזואלית (העמודים מאחורי auth; preview_screenshot לא אמין באפליקציה הזו — מתועד). **גישה לבדיקה:** תרגול → וקטורים במרחב → כרטיס תת-נושא → השיעור המודרך → דרילים.

**הבא (הוצע לאיתי):** (1) **שאלות בגרות פר-תת-נושא** ל-וקטורים — כרגע יש רק 1 (capstone), אז ה"תרגול המטפס עד בגרות" בתוך כל מודול עדיין בלי שיא-בגרות; צריך לכתוב ~5 שאלות בגרות מתויגות (math-risk גבוה → לאמת כל אחת בסקריפט). (2) להמשיך לנושאים הנותרים באותה תבנית (אקספוננציאלית, ln, גאו' אנליטית, גדילה-ודעיכה). (3) מורה-AI מעוגן עדיין פיילוט-מרוכבים בלבד — להרחיב לוקטורים (עיגון + specs + wiring).

---

## 🆕🆕🆕🆕 LATEST (2026-06-14, מאוחר 2): מבנה מבוסס-תתי-נושאים — תרגול מטפס עד בגרות + עמוד מודולים-תחילה (**נדחף `2a1a085` → חי**)

איתי (בתוכנית מאושרת `claude-code-declarative-frost.md`): כל מודול תת-נושא בסיומו צריך **תרגול+הסברים מטפסים עד רמת בגרות**, וה**תרגול צריך להתחיל מתתי-הנושאים** ולא מגוש סיכום. הדרך הגאונית = **חיבור מה שכבר קיים**, לא כתיבה.

**הממצא:** לכל תת-נושא כבר יש שאלות בגרות בבנק `bagrutQuestions` (דרך `topic_tag`), ושאלות ה-`questions` כבר מטפסות easy→hard. **מיפוי:** polar-de-moivre←`cx-bag-001/006/007/011`, complex-roots←`002/009`, complex-equations←`003`, gauss-loci←`004/010`, finding-z←`008`, **capstone (משולב)**←`005`.

**נבנה (commit `2a1a085`, 7 קבצים):**
- `content/lessons/types.ts`: שדה `subTopicId?` ל-`StaticBagrutQuestion`; תויגו כל 11 שאלות הבגרות במרוכבים.
- `content/lessons/index.ts`: `getBagrutQuestionsForSubTopic(subject,topic,subId)` + `getCapstoneBagrutQuestions`.
- **`components/practice/BagrutQuestionBlock.tsx`** (חדש): מרנדר שאלת בגרות בודדת (נתונים מתקפלים + סעיפים דרך `QuestionPartCard` = בודק דטרמיניסטי + מורה מעוגן).
- `SubTopicPractice`: אחרי הדרילים מציג את שאלת/שאלות הבגרות של התת-נושא (prop `bagrutQuestions`), ואז "המשך לתת-הנושא הבא". זה ה"עד רמת בגרות". העמוד `sub/[subId]/practice/page.tsx` מעביר `getBagrutQuestionsForSubTopic`.
- `LessonView`: עמוד הנושא הומר ל-`flex flex-col gap-6` עם `order-*` — **מודולי תתי-הנושאים `order-1` (ציר ראשי), חומר עזר `order-2`, בגרות מלאה משולבת `order-3` (קפסטון)**. כך התרגול מתחיל מתתי-נושאים.

**משוב איתי אחרי בדיקה חיה (commit `fb5a7e8`):** (1) **"הצג פתרון" = כל הפתרון בבת אחת** (כמו מאגר הבגרויות), לא צעד-אחר-צעד — תוקן ב-`WorkedExampleCard`/`QuestionPartCard`/`QuickExerciseView`. (2) **כפתור "הבנתי — לצעד הבא" לא נוח** — `SubTopicLesson` שוכתב להציג את כל השלבים בגלילה נקייה ומרווחת (בלי לחיצות, דוגמאות מקופלות, לא דחוס). (3) **תוכן — בוצע (commit `be230e0`):** נכתבו `lesson[]` מלאים ל-4 תתי-הנושאים הנותרים (complex-roots/complex-equations/gauss-loci/finding-z) ברף הזהב — הסברים מפורטים, מדויק מתמטית (אומת **26/26** ב-`scripts/verify-lessons.ts` עם mathjs), מותאם בגרות 582, בלי חומר מיותר. **כל 5 תתי-הנושאים של מרוכבים עכשיו עם לימוד מודרך מלא + תרגול מטפס עד בגרות.** נשאר אופציונלי: פוליש ל-polar; הרחבה לשאר הנושאים (אותה תבנית: `lesson[]` פר תת-נושא + תיוג `subTopicId` לשאלות הבגרות).

**סטטוס:** `tsc`+`build` עברו, **נדחף `2a1a085`+`fb5a7e8` → חי** (pathspec בלבד; WIP מקבילי לא נגעתי). לא אומת ויזואלית (auth). **חשוב:** התרגול-המטפס-עד-בגרות עובד **לכל 5 תתי-הנושאים** (לכולם יש שאלת בגרות ממופה) — גם לפני שכתבנו להם `lesson[]` מודרך. **הבא:** לכתוב `lesson[]` ל-4 תתי-הנושאים הנותרים (complex-roots/complex-equations/gauss-loci/finding-z), ואז לשאר הנושאים. **גישה לבדיקה:** תרגול → מרוכבים → (מודולים בראש העמוד) → "הצגה קוטבית ודה-מואבר" → לימוד → "עכשיו בוא נתרגל" → דרילים → **שאלת בגרות עם בדיקה דטרמיניסטית** → "המשך לתת-הנושא הבא".

---

## 🆕🆕🆕 LATEST (2026-06-14, מאוחר): שיעור מודרך צעד-אחר-צעד לתת-נושא (פיילוט polar-de-moivre, **נדחף `41e1828` → חי**)

**הבהרה קריטית של איתי (אחרי שטעיתי בהבנה):** מה שהוא רוצה זה לא רק מורה-AI מודבק — אלא ש**הלימוד עצמו** (הסיכומים+תרגול) יהיה **צעד-אחר-צעד, תת-נושא אחרי תת-נושא**: לוקחים תת-נושא, מלמדים שלב-אחר-שלב (הסבר+דוגמה), ואז תרגול, ואז מתקדמים לתת-הנושא הבא — "סופר מקצועי, מסודר, נוח ומובן". **לא** סיכום של כל החומר במכה.

**מצב קודם:** למרוכבים יש 5 תתי-נושאים (`subTopics` ב-`content/lessons/math5/complex-numbers.ts`): polar-de-moivre, complex-roots, complex-equations, gauss-loci, finding-z — כל אחד עם `summary`(בלוק)+`keyPoints`+`formulas`+`questions`. ה-`SubTopicLanding` הראה **בלוק סיכום ואז כפתור לתרגול נפרד** — בדיוק ה"דאמפ" שאיתי שונא. (יש גם learning-path נפרד `/learn/...` עם concept-atoms — מבנה צעד-אחר-צעד, אבל לא משולב פר-תת-נושא.)

**מה נבנה (פיילוט תת-נושא אחד — polar-de-moivre):**
- `content/lessons/types.ts`: טיפוס **`SubTopicLessonStep`** (`title`,`teach`,`formula?`,`example?:WorkedExample`,`diagrams?`) + שדה אופציונלי **`lesson?: SubTopicLessonStep[]`** ל-`SubTopic` (migration-safe).
- complex-numbers.ts: **8 שלבי שיעור** ל-polar-de-moivre, דוגמה פתורה לכל שלב, אפס דילוג: אינטואיציה → גודל → ארגומנט+תיקון-רבע → cis → חזרה-לאלגברי → כפל/חילוק → דה-מואבר → דה-מואבר-על-אלגברי.
- **`components/practice/SubTopicLesson.tsx`** (חדש): חשיפה מדורגת (revealed state, "הצעד הבא"), פס התקדמות, מרנדר `FormulaCard`+`WorkedExampleCard` (נסה-קודם) פר שלב, ובסוף recap(keyPoints+formulas)+CTA "עכשיו בוא נתרגל".
- `SubTopicLanding` מרנדר `SubTopicLesson` כשיש `lesson` (אחרת fallback לסיכום הישן). `getNextSubTopic` ב-index.ts + כפתור "המשך לתת-הנושא הבא" במסך סיום ב-`SubTopicPractice`. שתי ה-pages (`sub/[subId]/page.tsx` + `/practice/page.tsx`) מעבירות nextSubTopic.

**סטטוס:** `tsc` נקי, `npm run build` עבר, **נדחף `41e1828` (8 קבצים, +504/-8, pathspec בלבד) → חי**. לא יכולתי לאמת ויזואלית (העמוד מאחורי auth; אין session ל-preview) — איתי הראשון שרואה logged-in. **גישה:** תרגול → מרוכבים → כרטיס "הצגה קוטבית ודה-מואבר" → השיעור המודרך. **הבא (רק אחרי שאיתי מאשר את ה-gold):** לשכפל `lesson` ל-4 תתי-הנושאים הנותרים של מרוכבים, ואז לשאר הנושאים. **תבנית לשכפול:** authoring `lesson[]` פר תת-נושא + (הרכיב והווירינג כבר גנריים, עובדים לכל תת-נושא עם `lesson`).

---

## 🆕🆕 LATEST (2026-06-14): מורה-AI "מורה פרטי" — פיילוט מרוכבים (נבנה ✅, הודגם ✅, **נדחף `72fac9b` ל-main → חי באתר**)

איתי נתן הוראה לשדרג את המורה-AI לרף "מורה פרטי אמיתי" דרך 4 מנגנונים מחייבים (עיגון, בדיקה דטרמיניסטית, הצגת עבודה, "לא יודע"). פיילוט = **מספרים מרוכבים בלבד**. עבדתי בתוכנית-מאושרת (`.claude/plans/claude-code-declarative-frost.md`).

**אבחון מצב קודם:** הבודק הדטרמיניסטי `lib/answer-check.ts` היה **מנותק** (רק ה-*type* `AnswerSpec` בשימוש; `checkAnswer()` לא נקרא בריצה) — כל ההכרעה עברה דרך Haiku ב-`/api/check-answer`. הצ'אט + כל ה-micro-endpoints היו **לא מעוגנים** (prompt גנרי, ידע חופשי). מאגר הטעויות (`pitfalls`) לא הוזרק לאף מקום. הצ'אט הדליף פתרון מלא על בקשה.

**מה נבנה (כל הקבצים ב-`C:\Users\1000m\bagrut-app`):**
- **חדש `lib/tutor-grounding.ts`** — `buildComplexNumbersContext()` (בלוק עיגון ~3.5k תווים מ-`getLesson`: summary+formulas+דוגמאות+`pitfalls`+examTips+582-no-e^iθ), `buildTutorSystemPrompt(topic)` (7 כללי המורה-הפרטי + עיגון), `buildPilotGrounding(topic)`, `isPilotTopic()`, `PILOT_TOPIC='מספרים מרוכבים'`.
- **26 `expected: AnswerSpec`** נוספו לכל ה-`bagrutQuestions` parts ב-`content/lessons/math5/complex-numbers.ts` (17 value/set אוטומטיים, 9 manual=הוכחות/מקומות-גאומטריים).
- **`QuestionPartCard.tsx`** — חובר `checkAnswer` הדטרמיניסטי כ**פוסק ראשי** (value/set → ורדיקט סמכותי חינם; manual/unparseable → נפילה ל-LLM). prop `topic` הוזרם (דרך `StaticBagrutExerciseView`).
- **`/api/chat`** — מקבל `topic`+`context`; לפיילוט: prompt מעוגן + **Sonnet** (`claude-sonnet-4-6`; שאר הנושאים נשארו Haiku — flip של שורה אחת אם עלות).
- **`/api/why-wrong|hint-help|explain-simpler|check-answer`** — מקבלים `topic`, מצרפים grounding לפיילוט. `AITutorActions.tsx` שולח `topic` בכל הקריאות.

**הדגמה:** `scripts/demo-tutor.ts` (`npx tsx scripts/demo-tutor.ts`) — Part A דטרמיניסטי (17/17 specs תקינים, 8/8 בדיקות עברו), Part B מורה אמיתי (Sonnet). **כל 5 תרחישי הקבלה עברו:** שורש-אחד→wrong+שאלה מנחה · "לא הבנתי דה-מואבר"→אבחון-קודם · "תן לי התשובה"→רמז קודם · צורה שקולה (2cis60=1+√3i)→correct · e^{iθ}→מפנה ל-cis/582. **`npx tsc --noEmit` = 0 שגיאות.**

**מבחן עמידות (`scripts/stress-tutor.ts`):** 6 תרחישים עוינים רב-תוריים. נמצא כשל אחד ותוקן — המורה אישר ניחוש-תשובה של תלמיד ("זה 16 או לא?" → "כן"); חיזקתי את חוק #1 (אסור לאשר/לפסול תשובה שהתלמיד זורק). 5 האחרים נקי (מחזיק מול לחץ, תופס i²=-1 ואת טעות דה-מואבר, נשאר ב-582, אומר "מחוץ לסילבוס").

**נקודות כניסה (UI מינימלי, לוגיקה בלבד):** כפתור "שאל את המורה הפרטי על הנושא" ב-`LessonView` (עמוד הסיכום) ובכותרת עמוד התרגול → `/chat?topic=<encoded>`. הצ'אט קורא `?topic=` (client, בלי useSearchParams), מעביר ל-`/api/chat`, ומציג תווית "מצב מורה מעוגן". `scripts/compare-tutor.ts` מראה לפני/אחרי.

**סטטוס:** **נדחף `72fac9b` ל-main (16 קבצים, +783/-40) → Vercel auto-deploy → חי ב-bagrut-app.vercel.app.** דחיפה ב-pathspec בלבד (GIT_LITERAL_PATHSPECS=1 בגלל הסוגריים בנתיב exercise); ה-WIP המקביל (content/lessons/math5/{algebra,functions,...}, content/past-bagruyot/2020, untracked app/topic-demo+content/topics) **לא נגעתי**. `npm run build` עבר לפני הדחיפה. **הבא:** מבחן עם תלמידים אמיתיים על מרוכבים, ורק אז להרחיב לשאר הנושאים (לחזור על עיגון+specs+wiring לכל נושא; `PracticeQuestion` עוד חסר `expected` אם רוצים specs לבנק ה-open הקצר). **אזהרה תמידית:** ריפו עם WIP מקבילי — pathspec בלבד, אף פעם לא `git add .`.

---

## 🆕 LATEST (2026-06-12, ערב 2): מאגר בגרויות — קיץ 2024 מועד א' (Q1–Q3 ✅, Q4–Q5 ממתינות)

User חזר ל-workflow של המאגר: שולח שאלה+פתרון-בכתב-יד מ**קיץ 2024 מועד א' שאלון 582**, ואני מעלה למאגר בפורמט clean-stacked עם סרטוטים, ודוחף per-question. **2024 היה "fully missing" — יצרתי קובץ חדש** `content/past-bagruyot/2024-summer-582.ts` (export `bagrut2024Summer582`) + רשמתי ב-`index.ts` (import + spread, כרונולוגי אחרי 2023-moed-b).

**✅ Q1 (`b2024s582a-q1`, גאומטריה אנליטית)** — אומת מול כתב-ידו ונכון לגמרי. שני מעגלים $I$(מרכז K(3,4) ר=3) ו-$II$(מרכז L(-5,2) ר=1); **א** אורכי-משיקים $MA^2=MK^2-9,\ MB^2=ML^2-1$, $MA=MB$ → מקום גאומטרי ישר **$4x+y+3=0$**; **ב1** $m_{KL}=\frac14$, שיפוע מקום $-4$, מכפלה $-1$ ⟂; **ב2** $MK^2=MA^2+9,\ ML^2=MB^2+1$, $MA=MB$ ⟹ סתירה $9=1$ ⟹ אין $M$ עם $MK=ML$; **ג** $KL=\sqrt{68}$, $h=52/\sqrt{68}$, $M(t,-4t-3)$, מרחק לישר $-x+4y-13=0$ → $t=-3$ → **M(-3,9)** (מעל KL); **ד** $81=2p(-3)⟹p=-13.5$, משיק $yy_1=p(x+x_1)$ → **$3x+2y-9=0$**. **3 סרטוטים:** 2× custom SVG (שני-מעגלים+משיקים setup ברמת השאלה; משולש KLM עם גובה+זווית-ישרה בסעיף ג) + functionGraph פרבולה $y^2{=}-27x$+משיק (ד, fn-closures בטוחים). אומת: **168 KaTeX/0 errors** (harness esbuild+katex), build עבר, נדחף **`bc8721f`** (pathspec — 2 קבצים; ה-churn המקביל לא נגעתי). (תזכורת Q1: transform = `sx=132+16x, sy=180-16y` בשני ה-SVG; clean-stacked, עברית רק כתווית קצרה.)

**✅ Q2 (`b2024s582a-q2`, וקטורים במרחב)** — נדחף `56f2859`. $\ell_1=t(-1,3,0)$, $\ell_2=(1,-3,0)+m(0,k,1)$. **א** השוואת רכיבים → $t=-1,m=0$ → **A(1,-3,0)**; **ב** $\cos\alpha=\frac{|3k|}{\sqrt{10}\sqrt{k^2+1}}=\frac{3\sqrt2}{5}$ → ריבוע → $\frac{k^2}{k^2+1}=\frac45$ → **k=±2**; **ג** (k=2) נורמל $\perp$ שני הכיוונים: $-a+3b=0,2b+c=0$ → $(3,1,-2)$ → **π: 3x+y-2z=0**; **ד** O על $\ell_1$ (t=0), A על שניהם, B על $\ell_2$ → △AOB⊂π; **ה** $AO{=}AB{=}\sqrt{10}$, $\sin\alpha=\frac{\sqrt7}{5}$, $S_{AOB}=\sqrt7$; $S=A+Q(3,1,-2)$, $AS=\sqrt{14}|Q|$; $V=\frac13\sqrt7\cdot\sqrt{14}|Q|=\frac{7\sqrt2}{3}|Q|=7\sqrt2$ → |Q|=3 → **S(10,0,-6) או S(-8,-6,6)**. סרטוט: custom SVG פירמידה (בסיס △AOB + S מעל A, אנך+זווית-ישרה+טיקים AO=AB). 🟡 **המשתמש שלח כתב-יד עד $\sin\alpha=\frac{\sqrt7}{5}$ בלבד ("יש המשך, אין מקום") — השלמתי את ה' בעצמי, ו**דף-ההמשך שהתקבל תאם בדיוק** את התוצאה; יישרתי את ה' לשיטת הנבחן (העלאה בריבוע: $\frac{7\cdot14Q^2}{9}=98$ → $14Q^2=126$ → $Q^2=9$), נדחף `cf02433`.**

**✅ Q3 (`b2024s582a-q3`, מספרים מרוכבים)** — נדחף `aa9d44b`. מעוין $ABCD$, אלכסונים נפגשים בראשית, $BD=2AC$. **א** $C=-A=-z$, $AC=2r$ → $BD=4r$ → $|B|=2r$ מאונך ל-$A$ → **B=2iz, C=-z, D=-2iz**; **ב1** $\frac1{R\,\text{cis}\varphi}=\frac1R\text{cis}(-\varphi)$ → $\frac1A=\frac1r\text{cis}(-\theta),\frac1B=\frac1{2r}\text{cis}(-\theta-90°),\frac1C=\frac1r\text{cis}(-\theta-180°),\frac1D=\frac1{2r}\text{cis}(-\theta-270°)$; **ב2** ההופכיים = מעוין, אלכסונים $\frac2r,\frac1r$ → $S=\frac{1}{r^2}$; **ג** $\bar w=w^{11}$, $w=R\text{cis}\varphi$ → $R=1$, $12\varphi=360°k$ → 12 שורשים $\text{cis}(30°k)$ (12-גון משוכלל) → **סכום=0**; **ד** שטח 12-גון ($R=1$) $=12\cdot\frac14=3=\frac1{r^2}$ → **$r=\frac1{\sqrt3}=\frac{\sqrt3}{3}$**. 2 סרטוטי custom SVG (מעוין במישור גאוס עם אלכסונים+זווית ישרה; dodecagon עם wedge 30°). 🟡 **המשתמש עצר ב-$S_\triangle=\frac14$ ("יש המשך, תסיים") — השלמתי את ד' (×12→3→$\frac1{r^2}$→r), נכון; **דף-ההמשך התקבל ותאם בדיוק** ($\frac1{r^2}=3→r=\frac1{\sqrt3}$) — אין שינוי.** **⏭️ Q4–Q5 ממתינים — המשתמש ישלח כל אחת + כתב-יד.**

---

## ✅ LATEST (2026-06-12, ערב): מרוכבים — סקירת נכונות מלאה + 3 תרגולי בגרות חדשים בקורס המתקדם

User: "עבור טוב טוב על נושא מרוכבים איפה שיש סיכומים ותרגול — מה לשפר/להוסיף." סקרתי את כל 3 השכבות (lesson 1725 / learning-path 941 / advanced).

**נכונות:** ✅ **הקורס המתקדם נגזר-מחדש במלואו לראשונה — נקי** (שער, 5 תבניות, 6 טכניקות, 2 בגרויות-מפורקות, 5 תרגולים, 6 מלכודות, סימולציה; כל שאלה=25 נק'). זה **סוגר את הפריט הפתוח** "advanced course NOT yet fully read for correctness". ספוט-צ'ק שורשים+מקומות-גאומטריים בסיכום — נקי. תיקוני-הזוויות (545°→225° וכו') קיימים. **0 עברית-ב-KaTeX בכל 3 הקבצים** (grep `\text{[א-ת]` ריק).

**ההוספה (אושרה — המשתמש: "תבנה תרגולים מלאים ברמת בגרות, לא בגרויות קיימות"):** authored **3 שאלות מקוריות חדשות** ל-`content/advanced-courses/math5/complex-numbers.ts` §5 `examPractice` — **ex-6** ריבועית עם מקדמים מרוכבים ($z^2-(3+3i)z+5i=0$, Δ=−2i, שורשים $1{+}2i,2{+}i$ **לא-צמודים** → מעגל $r=\sqrt5$ → שטח משולש $\frac32$); **ex-7** ריב-ריבועית ($z^4+2z^2+4=0$, $t=z^2$ → 4 שורשים cis 60/120/240/300 → **מלבן** לא ריבוע → שטח $2\sqrt3$; + קבוע SVG חדש `RECTANGLE_ROOTS_SVG`); **ex-8** צמוד→קוטבי→מדומה-טהור→שורשים ($z\bar z=8,\ z+\bar z=4$ → $2\sqrt2\,cis45°$ → $n=2+4k$ → $w^3=z^2=8i$ → משולש שו"ש $3\sqrt3$). הפער שסגרו: הטכניקות complex-coeff-quadratic / biquadratic-substitution / conjugate-tricks לימדו אך לא תורגלו ב-§5. כל המתמטיקה אומתה ביד; **853 KaTeX/0 errors** (harness esbuild+katex), `npm run build` עבר, נדחף **`49ab171`** (pathspec — 11 קבצים מקבילים לא-שלי + untracked `app/privacy|terms|topic-demo`,`components/topic`,`content/topics`, לא נגעתי). **reviewRef ב-ExamPart מקבל `techniqueId` או `patternId`; patternIds חייב ערכים מ-§2 patterns (טכניקה מתקושרת רק דרך reviewRef).**

**נשאר (הצעתי, המשתמש בחר רק תרגול — לא בוצע):** (1) **פורמט מעורבב בבנק הבגרות** — `cx-bag-001..005` עדיין סגנון כותרות-בולד ישן (`**נחשב את המודול.**`) מול `006..011` clean-stacked → להמיר 001-005. (2) **אין סרטוטים בתרגול הסיכום** — הטיפוסים `PracticeQuestion`/`BagrutQuestionPart` ב-`content/lessons/types.ts` חסרי שדה `diagrams` (קיים ל-`ConceptBlock`+`SubTopic` בלבד), אז שאלות גאומטריות בסיכום טקסט-בלבד; תיקון = הוספת שדה + עדכון `components/practice/QuestionPartCard` (חוצה-נושאים, נוגע בכל הנושאים). (3) **SVG בקורס המתקדם** עדיין סגול/פוקסיה (`rgba(168,85,247)`/`#f472b6`), מחוץ למערכת האינדיגו — סקריפט-הצבעים של מיגרציית-העיצוב תפס רק class-ים של Tailwind, לא hex בתוך SVG.

---

## 🎨 LATEST (2026-06-12): עיצוב-מחדש ויזואלי — כיוון "אקדמי-יוקרתי" (עמוד-זהב: דף הבית ✅ נדחף · שאר ~22 העמודים ⏸️ ממתינים לאישור)

User asked (via the שלהבת-ורדי/ui-ux-pro-max design skill) to improve the OVERALL LOOK — **colors, typography, spacing**. Diagnosed the current design as generic "AI-landing-page": 7 competing accent palettes, every heading a 3-color (purple→pink→amber) gradient-clip, `font-black` on everything (no hierarchy), pulsing blur-blob soup, and **Frank Ruhl Libre loaded but unused**. Showed a before/after widget + offered 4 directions via AskUserQuestion. **User picked direction #2 = "אקדמי-יוקרתי / רגוע"** (mature, serif-dominant, muted, lots of air, NO blur blobs, NO 3D tilt).

**THE DESIGN SYSTEM (now the standard to propagate to every page):**
- **Colors — indigo primary + sparse warm accent + slate neutrals.** globals.css `:root` tokens: `--primary:#6366F1`, `--primary-bright:#818CF8` (text/icons on dark), `--primary-deep:#4F46E5` (buttons), `--accent:#E0A93D` (muted gold — "new"/achievements ONLY). Killed the rainbow + gradient-clipped headings.
- **Typography — Frank Ruhl Libre SERIF for ALL headings** via the `.font-display` util (`font-family: var(--font-frank-ruhl)`, already wired in layout.tsx). Weight hierarchy: **hero=900, section h2=700, card h3=700**; body=Heebo 400/500. Verified live via preview_inspect: h1→Frank Ruhl Libre 900, h2→700. (Serif is THE elevation move — biggest visual win.)
- **Spacing/effects** — consistent section rhythm (`py-16 sm:py-24`), more whitespace, card padding `p-6 sm:p-8`. Removed the 3 pulsing blur-blobs → ONE static subtle indigo glow. Structural emoji (nav 🎯💬, mode cards) → lucide (`Target`,`MessageSquare`); subject emojis kept (content).

**globals.css (shared — already propagates app-wide):** added semantic tokens (`--background` now `#0A0E1A` not `#020617`, `--surface-1/2`, brand vars), `.font-display` util, `--font-serif`→frank-ruhl in `@theme`, retuned `.gradient-text` to indigo. **Neutralized the 3D classes globally** — `.card-3d`/`.card-3d-strong` lost `rotateX/Y/scale` (now calm `translateY` lift), `.btn-3d` lost the hard stacked shadow, `.icon-3d` lost the `rotateY(360)` spin. So "no 3D tilt" + indigo shadows now apply to ALL pages automatically; their JSX-level purple/rainbow gradients are NOT yet changed.

**Gold = `app/page.tsx`** fully rewritten (kept all logic: framer-motion, PrimaryCTA plan-aware, bagruyot stats, FAQ state). Reusable local helpers to extract when propagating: **`Eyebrow`** (muted-indigo label, NO uppercase — Hebrew has no case), **`SectionTitle`** (serif h2), **`ModeCard`** (calm neutral card + muted per-mode accent indigo/gold/teal). Verified: `npm run build` ✅, hero screenshot ✅, 0 console errors. Pushed **`51f2108`**, then a **premium-polish pass `ff5a8af`** (user: "יותר יוקרתי/איכותי/מקצועי"): added 3 reusable globals utilities that are now PART OF THE SYSTEM — **`.grain-overlay`** (matte SVG film-grain fixed overlay, opacity 0.05, kills flat banding on dark — add to `layout.tsx` when propagating for app-wide), **`.surface-premium`** (faint top-down sheen + inset top-highlight — now the STANDARD card surface, replaced all `bg-white/[0.03] border border-white/10`), **`.btn-primary`** (vertical indigo gradient + inset highlight + soft shadow — standard primary button). Also: Eyebrow refined to flanking hairline rules + `tracking-[0.22em]`, radial bg-depth gradient, stats → one hairline-divided panel, more hero air. Then user pushed again ("רמה גבוהה יותר") → **level-up pass `22e5aa6`** (page.tsx only): (1) **signature math motif** behind hero — CSS graph-paper grid (`linear-gradient` 46px, radial-masked) + an elegant SVG function-curve, gives the app a real *mathematical* identity vs generic-dark; (2) **product showpiece** — a floating refined "sample question" card (complex-numbers equation in serif-italic LTR, MCQ options w/ correct in emerald, הסבר line) with indigo glow + multi-layer shadow = the hero "wow"/product moment; (3) **cinematic vignette** (edge darkening); stats panel → slim text trust-strip. New helper `Option`. Removed now-unused `InfinityIcon` import. **NOTE: the preview `preview_screenshot` tool TIMES OUT repeatedly on this page (heavy framer-motion + motif never reach render-idle); only the very FIRST screenshot of a fresh server sometimes works, and it can catch the hero mid-entrance-animation (opacity 0). Verify via `preview_eval`/`preview_inspect` (reliable) instead, and judge final visuals on live Vercel.** All commits pathspec'd. User is iterating HARD on perceived quality.

**✅ WHOLE-SITE PROPAGATION DONE (2026-06-12, commit `4ad4f95`, 45 files).** User: "תוריד את כרטיס השאלה לדוגמה, תוסיף עוד רמה איכותית, ותעשה את זה כבר לכל האתר." Done: (1) removed the hero showpiece card + `Option` helper; (2) **globalized the premium canvas** — moved grain + vignette + radial depth to `body`/`body::before`/`body::after` in globals.css, so EVERY page gets it (pages now use transparent roots); (3) swept all 49 app+component files. **Method = 3 idempotent Node scripts (NOT subagents — too risky for 47 files; scripted = uniform + safe):** (a) color unification `purple|violet|fuchsia|pink|rose-` → `indigo-`; (b) polish: gradient-clipped headings (`bg-gradient-to-* … bg-clip-text text-transparent`) → `font-display text-slate-100`, `min-h-screen bg-slate-950` → transparent root, `uppercase tracking-wid*` → `tracking-wide`, `bg-white/[0.0x] border border-white/10` → `surface-premium`; (c) add `font-display` to every string-literal `<h1|h2|h3 className="…">` lacking it (plain headings were still Heebo-sans — the gap that made it inconsistent). Verified: build ✅ each step, and live `preview_inspect` on /login confirmed Frank Ruhl Libre heading + grain + transparent root + surface-premium cards. 

**🔑 LESSONS from this migration (apply next time):** ① **STOP the dev server before running any file-mutation script** — on Windows the Next dev-server file-watcher LOCKS files → `writeFileSync` throws `UNKNOWN/EBUSY` mid-run (it crashed on `app/practice/page.tsx`; idempotent re-run after `preview_stop` finished it). ② **`preview_screenshot` is unreliable on this app** (heavy framer-motion never idles; catches hero mid-entrance at opacity 0; times out after the 1st call) — use `preview_eval`/`preview_inspect` and judge live. ③ **NEVER `git add .`** — repo has parallel WIP: tracked `content/lessons/*.ts` + `content/past-bagruyot/*.ts` (math content, other sessions) and UNTRACKED `components/topic/*`, `app/topic-demo`, `content/topics/` (a parallel topic-demo feature). My .tsx scripts DID touch the untracked `components/topic`+`topic-demo` files (benign — makes them match the new design when they land; not committed). Used `git add -u app components` to stage ONLY tracked app+component changes. ④ Scripted color-rename is safe because the trailing `-` (`purple-`) never matches prose/identifiers, only Tailwind classes.

**Possible next quality levers if asked:** real KaTeX in any preview, scroll-reveal/parallax motion, `btn-primary` on the remaining per-page buttons (only landing uses it so far), bespoke palette refinement, custom illustration. The design system (tokens, `.font-display`, `.surface-premium`, `.btn-primary`, global canvas, `Eyebrow`/`SectionTitle`/`ModeCard` in page.tsx) is the source of truth. NOTE: preview works from session-cwd `.claude/launch.json` config `bagrut-app-dev` (uses `--prefix C:\Users\1000m\bagrut-app`); screenshot tool times out AFTER scroll (framer-motion never goes idle) — use `preview_inspect` instead of repeated screenshots.

**⏸️ NEXT — awaiting user's read on the live gold before propagating.** Per page (chat, quiz, practice, learn/*, advanced, bagruyot, onboarding, my-plan, formulas, library, scan, history, login, signup, privacy, terms…): gradient-clipped headings → `.font-display` serif solid slate-100; rainbow → indigo (+gold only for new/achievement); drop `uppercase tracking-widest` on eyebrows; surfaces → `bg-white/[0.03] border-white/10`; card titles → serif. Consider extracting `Eyebrow`/`SectionTitle` to `components/ui/` + a `DESIGN_SYSTEM.md`. **Do NOT touch `MathText.tsx` / the KaTeX RTL-LTR CSS blocks in globals.css** (chat-md + .katex — untouched, leave them).

---

## 🔴🔴 QUALITY BAR (2026-06-11) — READ BEFORE AUTHORING ANY CONTENT
User flagged (twice) that my learning-path/advanced content is TOO COMPRESSED and not bagrut-focused. The bar (now in STYLE_GUIDE.md + lessons_learned): **(1) zero step-skipping** — show $\Delta=b^2-4ac$, $\sqrt{-36}=\sqrt{36}\cdot\sqrt{-1}=6i$, $-b$, $\div2a$, and EVERY $i^2=-1$ substitution explicitly (never $(3+i)(2+i)\to5+5i$ in one jump); **(2) highlight the topic-defining move**; **(3) bagrut-focused** (where in the exam, the shortcut, what the grader wants); **(4) one `$$` per step**. Rewrote מרוכבים base+advanced to this bar — pushed `87decac` (+518/−358) + STYLE_GUIDE `1dbab63`. Note: this app has NO `.katex-display` — `$$` renders each eq on its own line via `.chat-md p:has(.katex)` CSS; that's normal.

**SCOPE = anchor to the REAL past-bagruyot in the repo** (`content/past-bagruyot/*.ts`), NOT my guess. User then said "things here aren't in the bagrut" (pointed at the real/imaginary-condition pattern). I VERIFIED first (per the growth/decay lesson): that exact type ("$w^n$ מדומה טהור, מצא n מינימלי") IS in קיץ 2023 ש3 in his own repo — so I did NOT delete it, cited the real Q in the card, and instead ADDED the real types I was missing (complex-coeff quadratic $w^2-4iw-4+2i=0$ from 2021; biquadratic $z^4-2z^2+4=0$ הצבת $t=z^2$ from 2021 מועד ב) as techniques. Pushed `2edf02e`. **When the user says "X isn't in the bagrut," grep `content/past-bagruyot/` + check `bagrut-curriculum.ts` examStyle BEFORE removing — surface the evidence.** The 8 real 582 bagruyot (2020–2023) are the authoritative scope spec for the advanced course.

**⏸️ AWAITING USER APPROVAL of the מרוכבים rewrite (quality + scope) before (a) replicating advanced to other topics AND (b) re-doing exp/analytic/ln BASE courses to this bar. He's iterating hard on מרוכבים as the gold pair — do NOT mass-replicate yet.**

---

## 🆕 LATEST (2026-06-12): מרוכבים content-QA pass (user: "עבור על הסיכומים עצמם בנושא מרוכבים" — NOT the bagrut archive)

Strategy turn first: user asked honestly what's best for the site; I recommended "finish ONE topic as gold, don't block everything behind entering all 2020–2026 bagruyot." He picked gold-topic → I recommended **מרוכבים** (only topic with base+advanced+most bagruyot). He then redirected: review the מרוכבים **summaries/teaching content we built**, NOT the past-bagrut archive. Audit: the vertical is ~90% complete structurally (lesson 1833 lines; learning-path 1002 — all 8 sections filled; advanced 1133 — all 7 filled incl. a 35-min sim).

**Reviewed for CORRECTNESS by reading every value (not just trusting the build):**
- ✅ **Lesson `content/lessons/math5/complex-numbers.ts`** — FULLY reviewed. Math correct throughout; found+fixed **6 DISPLAY bugs** (all final answers were already right): angle-label typos `\cos(545°)→225°` (cx-sub-polar-005, $z=2+2i$ $z^5$), `390°→270°` (cx-sub-roots-004 k=3 AND cx-sub-roots-005 k=2), `530°→150°` (cx-sub-roots-005 k=1), `-180°→180°` (cx-008, $(\sqrt3+i)^6$), and removed `\text{בסיס}/\text{גובה}` Hebrew-from-KaTeX (line 992 → mirrored the bidi-safe pattern already at line 830). `npm run build` passed, pushed **`9245a4b`**. (See lessons_learned 2026-06-12: build/KaTeX validate PARSING, not correctness — wrong-but-valid angles slip through.)
- ✅ **Learning-path `content/learning-paths/math5/complex-numbers.ts`** — FULLY reviewed (concepts/guided/pitfalls/practice all 3 levels). **CLEAN, no issues.** (Notably gx-5 does $(\sqrt3+i)^6$ correctly as `180°` — the lesson's cx-008 had the `-180°` inconsistency, now fixed.)
- ✅ **Advanced course `content/advanced-courses/math5/complex-numbers.ts`** — FULLY re-derived 2026-06-12 (ערב): CLEAN. + נוספו 3 תרגולי-בגרות חדשים ex-6/7/8 (`49ab171`). ראה הסעיף העליון.

**🟡 Cross-topic finding (flagged, NOT fixed — it's untracked parallel WIP):** `content/topics/polynomial-function-investigation.json:34` has `\text{מינימום}`/`\text{מקסימום}` inside KaTeX → build emits "Unrecognized Unicode character" warnings, renders reversed. This file is in the UNTRACKED `content/topics/` feature (topic-demo parallel work) — did NOT touch it; told the user.

**✅ 582 from-0 learning-path coverage COMPLETE (2026-06-12, later — commit `5d3bd99`):** Per user "תפעיל מלא סוכנים שיעברו על הסיכומים בשאלון 582 ויוסיפו תרגול מ-0 כמו במרוכבים", ran a 19-agent Workflow (per topic: author → 3-lens adversarial verify [arithmetic/scope/mechanical] → fix). AUTHORED 2 new gold-depth from-0 paths — **גדילה ודעיכה** (`content/learning-paths/math5/growth-decay.ts`, 1012 lines, export math5GrowthDecay) and **וקטורים במרחב** (`vectors.ts`, 1124 lines, export math5Vectors; owner-preferred normal-by-SYSTEM method, cross-product only mentioned) — both registered in `content/learning-paths/index.ts`. QA on the 3 existing paths (exp/ln/analytic) = math CLEAN, only 9 bidi polish fixes (no angle-class bugs — those were unique to the complex LESSON). I independently re-derived every level3 value in both new files (all correct) before pushing; build passed 35/35. **All 6 in-scope 582 topics now have from-0 paths.** STILL OPEN: QA of legacy LESSON summaries (`content/lessons/math5/*` — held parallel-session WIP, untouched); the polynomial-function-investigation.json Hebrew-in-KaTeX. Possible next: שאלון 581 from-0 paths (algebra, sequences, probability, euclidean-geometry, trig, calculus). User should spot-check the 2 new topics live.

---

## 🆕 LATEST (2026-06-11, later): user re-opened the past-bagrut archive pass — re-do EXISTING Qs to match his EXACT handwritten solution

**🧹 FORMATTING SWEEP DONE (2026-06-12):** user flagged that some `steps[]` render "לא מסודרת" in RTL — I'd crammed Hebrew + multi-`⇒` chains + floating `$\Rightarrow$`/`$\to$` into one numbered entry (see the new lessons_learned entry at the very top). Saved the rule via self-improve, then swept ALL manually-done files: split ~97 run-on lines into clean-stacked (ONE math expr per entry; Hebrew only as a short leading label; floating arrows → Hebrew connectors). Me on `2021-summer-582-moed-b.ts` (9 lines, `becc041`, the reference) + 5 parallel `general-purpose` subagents on `2023-summer-582.ts` (14) / `-moed-b.ts` (16) / `-special.ts` (21) / `2021-summer-582-moed-a.ts` (14) / `2022-summer-582-moed-b.ts` (23) → pushed `9f89fa7`. All esbuild+KaTeX validated 0 errors/0 Hebrew-in-math; full Next build passed; spot-checked the diff = math byte-identical (only line boundaries + arrow→connector). **NOT swept: `2021-summer-582.ts` (מועד מיוחד) Q2–Q5 — still my-MOE drafts pending his-handwriting redo; clean them when redone.** 🔑 Author steps[] clean-stacked from the start now.

New workflow phase he announced explicitly: he'll keep sending a past-bagrut question's photos **+ his handwritten solution**, even for questions ALREADY in `content/past-bagruyot/`, because the repo solution "isn't exactly the solution I want." Per question: rewrite the `steps[]` to mirror his handwriting at FULL detail (zero step-skipping per the QUALITY BAR), and render EVERY figure he drew as SVG. Commit per question via **pathspec** (repo has many parallel-session modified files + untracked `app/privacy|terms|topic-demo`, `components/topic`, `content/topics`, `.claude/` — NEVER `git add .`). He verifies live.

- ✅ **2022 קיץ מועד ב' Q2** (`2022-summer-582-moed-b.ts`, `b2022s582b-q2`, vectors / orthogonal pyramid OABC) — re-expanded to his handwriting: **א** full 6-term expansion of BOTH $\vec{OH}\cdot\vec{AB}$ and $\vec{OH}\cdot\vec{AC}$ before substituting the zero dot-products; **ב** via the $\vec{BD}=\tfrac12\vec{BC}$, $\vec{BC}=\vec{AC}-\vec{AB}$ route with every line shown + rigorous "why $OM$ is the height" ($\vec{OM}\cdot\vec{AB}=\vec{OM}\cdot\vec{AC}=0$, same computation as א); **ג** derives $|PM|=2|OM|$ then the two options ($-\tfrac13(\vec u+\vec v+\vec w)$ / $\vec u+\vec v+\vec w$); **ד** ADDED a coordinate-axes `custom` SVG (O origin, A→x, B→y, C→z, edges labeled $a$, line $\ell$ dir $(1,1,1)$) — was missing. Build passed, pushed **`31b02ae`**. ה (plane $x+y+z-a=0$) already matched his work. **ו** then redone to his exact method (`432a101`): base = right triangle $AOB$, height = $OC$ (⊥ plane $AOB$ via the $90°$ angles), $V=\frac{S_{AOB}\cdot OC}{3}=\frac{\frac{a^2}{2}\cdot a}{3}=\frac{a^3}{6}=\frac{343}{6}\Rightarrow a=7$ — replaced the bare "orthogonal-tetrahedron $V=\frac16a^3$" assertion. ✅ **Q2 COMPLETE end-to-end (א–ו) matching his handwriting.** (Watch the bidi rule: kept all Hebrew OUT of `$...$`; used $V=\frac{S\cdot h}{3}$ generic in the hint, not `\text{בסיס}`.)

- ✅ **2022 קיץ מועד ב' Q3** (`b2022s582b-q3`, מספרים מרוכבים — $z/\bar z=\text{cis}120°$, $w^9=z^3/27$, משולש שו"ש, מרובע ABOC) — pushed **`b589089`**. **🔴 REAL BUG FOUND & FIXED in the repo prompt:** סעיף ב said $|2iz|+|\bar z/i|-|z/\bar z|=8$ but the real exam (his photos) is **$|4iz|-|\bar z/i|-|z/\bar z|=8$** (both happen to give $R=3$, since $2R+R=3R=4R-R$ — that's why it slipped before). Fixed prompt+hints+solution (now via cis: $4iz=4R\,\text{cis}330°$ etc → $4R-R-1=8$). Other parts expanded to his handwriting: **א** show $\bar z=R\,\text{cis}(-\alpha)$ + the division → $\text{cis}(2\alpha)$; **ג** his method = solve $w^9=\text{cis}0°$ → list all 9 roots $w_k=\text{cis}(40°k)$ → identify $z/\bar z=\text{cis}120°=w_3$ (replaced the terse $(z/\bar z)^9=1$); **ד1** explicit cis-division for $\bar z/z,\ z/\bar z$, $k=ti$ notation, **ADDED triangle-ABC Gauss-plane SVG** (base $BC$ vertical, $A$ on real axis, right-angle mark). **🟡 B/C labeling:** the OFFICIAL question assigns $B\leftrightarrow\bar z/z$ (lower, $\text{cis}(-120°)$) and $C\leftrightarrow z/\bar z$ (upper); his handwriting swapped them (B on top). I followed the QUESTION and FIXED the repo's pre-existing internal inconsistency (ד2 diagram + coord-lists had B/C opposite to ד1). $k=\frac{3\sqrt3}{2}i$ and area $\frac{3\sqrt3}{4}$ are identical either way (symmetric kite) — told the user. **Q3 COMPLETE.**

- ✅ **2022 קיץ מועד ב' Q4** (`b2022s582b-q4`, פונקציה מעריכית $f=x^2e^{a-x^3}$) — pushed **`d644c92`**. Expanded to his handwriting: **א1** show $e^{a-x^3}>0$ always → sign set by $x^2$ → $x\ne0$; **א2** ADDED the product-rule derivative ($2xe^{a-x^3}+x^2e^{a-x^3}(-3x^2)$ → factor $xe^{a-x^3}(2-3x^3)$) **+ a KaTeX SIGN TABLE** (5 regions, $x=0$ min / $x=\sqrt[3]{2/3}$ max) — he draws sign tables, the memory rule says add them; **ב** show the $\int_0^{\sqrt[3]{2/3}}f'=[f]_0^{\sqrt[3]{2/3}}$ substitution explicitly → $a=1$. **🔴 FIXED a numeric error in the ג graph caption:** said max value $\sqrt[3]{4e/9}\approx 1.16$ but it's $\approx 1.065$ (his handwriting confirms 1.065; the plotted markedPoint was already correct at 1.065 — only the caption text was wrong). Added explicit limits in ג ($\lim_{+\infty}=\infty\cdot e^{-\infty}=0^+$, $\lim_{-\infty}=\infty\cdot e^{+\infty}=\infty$). ד1/ד2/ה already matched his method (kept). functionGraph SVG (with `fn:` closure — safe in PastBagrut, client-side) already present. **Q4 COMPLETE.**

- ✅ **2022 קיץ מועד ב' Q5** (`b2022s582b-q5`, חקירת פונקציה אי-זוגית מופשטת + מקרה פרטי) — pushed **`8f9e5d6`**. **🔴 REAL BUG FIXED:** repo had $f(x)=\frac{4x}{1+x^2}\to g=2\ln(1+x^2)$, but the real exam (his photos) is **$f(x)=\frac{6x}{1+x^2}\to g=3\ln(1+x^2)$** — fixed ג1 (prompt+hints+solution), ג2 evenness check, the ד uniqueness step, AND two file comments (top JSDoc + Q5 section header). **ADDED 2 `custom` SVG sketches that were missing:** (א) the odd $f$ — min $(-1,-a)$, max $(1,a)$, through origin, $y=0$ asymptote (smooth cubic-bezier path, 180°-symmetric); (ב4) the $h=\ln f$ dome on $(0,\infty)$ — vert asymptote $x=0$, max $(1,\ln a)$, two x-intercepts. **ד rewritten to his symmetry argument:** $g$ even $\Rightarrow \int_{-5}^0 g=\frac12\int_{-5}^5 g \Rightarrow \int_{-5}^t g=\int_{-5}^0 g \Rightarrow t=0$ (+ uniqueness since $g\ge0$) — replaced the abstract $G(x)=\int_0^x g$ odd-function approach. ב1/ב2/ב3 already matched. **Q5 COMPLETE.** **→ Q2–Q5 of this paper (`2022-summer-582-moed-b.ts`) all re-done to his exact handwriting this session; only Q1 (גאומטריה אנליטית) remains if he sends it.** PATTERN this session: the 2020-2022 repo entries keep having WRONG givens (Q3 $|2iz|{+}$ vs real $|4iz|{-}$; Q5 $4x$ vs real $6x$) — ALWAYS cross-check his photo vs the repo prompt, not just the solution.

- ✅ **2022 קיץ מועד א' Q1** (`2022-summer-582.ts`, `b2022s582-q1`, גאומטריה אנליטית — שני מעגלים משיקים) — pushed **`feb3549`**. **🔴 BIGGEST wrong-givens yet:** repo had center $N=(13,0)$ and line form $mx-y+n=0$; the REAL exam (his photos) is $N=(14,0)$ and $mx+y+n=0$. Rewrote the WHOLE question to $N=14$: $a=5$ (since $a<14$; or $23$), $r=3,R=6$, $N:(x-14)^2+y^2=36$, $M:(x-5)^2+y^2=9$; ג tangency at $(8,0)\to x=8$; ד $n=4m$, $m=\pm\frac{1}{\sqrt8}=\pm\frac{\sqrt2}{4}$, $n=\pm\sqrt2$; ה the two ד-tangents meet at $(-4,0)$, new circles are the reflection → $k=-22,t=-13$ (repo had $-23,-14$ from the wrong $N=13$). **ADDED a 4-circle `custom` SVG for ה** (originals at $5,14$ + mirrored at $-13,-22$, both tangent lines crossing at $-4$). **🟡 IDENTIFICATION GOTCHA:** user SAID "2021 מועד א' ש1" but that slot in the repo is the parabolas+kite question (his own earlier handwriting, `217b1fc`); his circles photo is actually **2022 מועד א' Q1**. I asked via AskUserQuestion and he confirmed "2022, fix to 14". **So the 2022 audit UPDATES: מועד א' Q1 now ✅ from his handwriting; מועד א' Q2–Q5 still MOE/me; חורף 2022 all 5 still MOE/me; מועד ב' Q1 still my-solution (givens from his photo).**

- ✅ **2022 קיץ מועד א' Q2** (`b2022s582-q2`, וקטורים במרחב — 4 נקודות $A(4,p,-1)B(7,5,5)C(1,-1,2)D(-2,5,-4)$ + פירמידה SABCD) — pushed **`7d84bc1`**. **NOT a wrong-givens case — repo math was CORRECT** (same plane, $p=11$, ריבוע צלע 9, $S=(4,8,5)/(-2,-10,-1)$, angle 72.45°). Difference was METHOD: repo did **א via cross-product** $\vec{BC}\times\vec{BD}$ → normal $(2,-1,-2)$, plane $2x-y-2z+1=0$; HIS method = parametric form $\underline x=(1,-1,2)+t(2,2,1)+Q(1,-2,2)$ + the dot-product SYSTEM ($2a+2b+c=0$, $a-2b+2c=0$ → $a=-2b$ → normal $(-2,1,2)$, plane $-2x+y+2z-1=0$). Rewrote א to his system method, and aligned ב/ד/ה to his normal/plane form (ד uses $B$ for base-area not $S$, distance $\frac{|3t-3|}{3}=3$). ג (sides all 9 + $\vec{AB}\cdot\vec{BC}=0$ → square) already matched — kept. No figure in his handwriting → no diagram added. **2022 audit now: מועד א' Q1✅ Q2✅ Q3–Q5❌; חורף all 5❌; מועד ב' Q1❌ Q2–Q5✅.** (Lesson: even when the repo answer is right, the user wants HIS solution method — cross-product → dot-product-system for plane-from-points.)

- ✅ **2022 קיץ מועד א' Q3** (`b2022s582-q3`, מספרים מרוכבים) — pushed **`4258b87`**. **🔴 THREE wrong givens in one question:** (1) equation repo $z^2+z\bar z=z+2\bar z+9+7i$ → real $\bar z^2+z\bar z=\bar z+2z+9-7i$ (both happen to give $z_1=3+i$, but his expansion is $\bar z^2$, LHS $=2x^2-2xyi$, imag $-2xy=y-7$); (2) ד rotation repo $\alpha+30°$ → real $\alpha+60°$; (3) ה area-ratio repo $\sqrt3$ → real $1.4$. The last two CHANGE the answer: diagonal angle $90°+60°=150°$ (not 120°), $\sin150°=\frac12$, parallelogram area $=10r_1r_2$, $=1.4\cdot20=28 \Rightarrow r_1r_2=2.8$ (repo had $r_1r_2=2$). Fixed context+א+ב(used his $S=\frac{d^2}{2}=20$)+ד(60°,150°)+ה. ג (square vertices $-1+3i,-3-i,1-3i$ via ×$i$) + the inscribed-square SVG already correct — kept. Type still מקבילית (diagonals bisect at origin, unequal since $r_1\ne r_2$, not ⟂ since 150°). **2022 audit now: מועד א' Q1✅ Q2✅ Q3✅ Q4–Q5❌; חורף all 5❌; מועד ב' Q1❌ Q2–Q5✅.** (The 2020-2022 entries are riddled with wrong givens — Q3 alone had 3. Cross-check EVERY number in the prompt vs his photo.)

- ✅ **2022 קיץ מועד א' Q4** (`b2022s582-q4`, פונקציה מעריכית $f=xe^x-2e^x+1$, $g=\frac{1-e^x}{e^x-x}$) — pushed **`2bc5adb`**. **Cleanest case yet — repo matched his handwriting on א1–א4, ב1–ב3, ג, ד** (asymptote $y=1$; $(0,-1)$; $f'=e^x(x-1)$ min $(1,1-e)$; $g$ asymptotes $y=-1,y=0$; $g$ x-intercept $(0,0)$; $g'=\frac{f}{(e^x-x)^2}$ via quotient rule; ג = 1 max + 1 min since $g'$ has sign of $f$ and $f$ crosses 0 twice; both functionGraph SVGs present). **Only ה was wrong:** repo bounded the area by $x=-1$ AND $x=-4$ (→ $\ln\frac{e^{-4}+4}{e^{-1}+1}\approx1.08$), but the real exam bounds by $x=-1$ ONLY — region is $\int_{-1}^{0}g\,dx$ (g crosses axis at 0), $=[-\ln(e^x-x)]_{-1}^0=\ln(\frac1e+1)\approx0.313$. Fixed prompt+hints+solution of ה only. **2022 audit now: מועד א' Q1✅ Q2✅ Q3✅ Q4✅ Q5❌; חורף all 5❌; מועד ב' Q1❌ Q2–Q5✅.** Only 2022 מועד א' Q5 left of this paper.

- ✅ **2022 קיץ מועד א' Q5** (`b2022s582-q5`, פונקציית ln) — pushed **`7b4aec6`**. **🔴 LARGEST wrong-given: repo built the ENTIRE question on $f=x+\ln(x^2-8)$, real exam is $f=x+\ln(x^2-3)$.** Full rewrite of all 13 parts (context + top JSDoc comment too): domain $|x|>\sqrt3$ (not $2\sqrt2$); $f'=\frac{(x+3)(x-1)}{x^2-3}$ zeros $-3,1$ (only $-3$ in domain); max $f$ at $(-3,\ln6-3)\approx(-3,-1.21)$; ב2 $f'$ asymptotes $x=\pm\sqrt3$, $y=1$ (products $(\pm\sqrt3+3)(\pm\sqrt3-1)=\pm2\sqrt3$); ב3 x-intercept $(-3,0)$; ג1 $g=e^x(x^2-3)$, $g'=e^x(x+3)(x-1)$, max $(-3,6e^{-3}\approx0.30)$; ג2 ↑$(-\infty,-3)\cup(\sqrt3,\infty)$ ↓$(-3,-\sqrt3)$; **ד area bounds were ALSO wrong** (repo $x=-4,-5$ → real $x=-4,-3$): $f'\cdot g=g'$ so $\int_{-4}^{-3}g'=g(-3)-g(-4)=6e^{-3}-13e^{-4}\approx0.06$. Updated both functionGraph SVGs ($x^2-3$, $\sqrt3$, marked $-3$). **🎉 2022 קיץ מועד א' COMPLETE (Q1–Q5 all his handwriting).** **2022 audit now: מועד א' ALL✅; חורף all 5❌; מועד ב' Q1❌ Q2–Q5✅.** Remaining from his photos: חורף 2022 (5) + מועד ב' Q1 (1) = 6 questions.

- ✅ **2023 מועד מיוחד Q3** (`2023-summer-582-special.ts`, `b2023s582sp-q3`, מספרים מרוכבים) — NEW question added (the special file previously had only Q1+Q2). User sent the full question + his handwritten solution. 6 answerable parts split **א1/א2/ב/ג/ד/ה**: א1 locus $|z^2-3i|=|z^2+5i|\to y=-\frac{1}{2x}$ (full expansion, $i^2=-1$ shown explicitly, $-32xy=16$); א2 example $z=1-\frac12 i$; ב $z^6=1\to$ regular hexagon $I$ at cis(60°k); ג hyperbola∩unit-circle in Q4 via $(2x^2-1)^2=0\Rightarrow A(\frac{\sqrt2}{2},-\frac{\sqrt2}{2})$; ד $A=\text{cis}(-45°)\to$ hexagon $II$ at cis 15°,75°,…,315°; ה $w=\text{cis}15°$ (multiply $I$ by $w$ = rotate 15°; $0<\alpha<60°$ selects it). **ADDED 3 Gauss-plane `custom` SVGs** (hexagon $I$; unit-circle∩hyperbola→$A$; both hexagons overlaid + 15° rotation arc). All math hand-verified; no Hebrew-in-KaTeX. Build passed, pushed **`72e9d54`** (pathspec — repo had ~13 parallel-session modified files). **Special file now Q1+Q2+Q3.**

- ✅ **2023 מועד מיוחד Q4** (`b2023s582sp-q4`, חקירת פונקציה, topic `פונקציה מעריכית`) — NEW question. User sent the question + handwritten solution **through ד + the START of ה** (the $m'=h'e^h$ line); he said he'll send the continuation page separately ("שתסיים אני יוסיף לך את ההמשך"). 9 parts **א/ב/ג1-4/ד/ה1/ה2**: $f'(x)=-2xe^{-x^2/a}$, פיתול ב-$x=\sqrt2\Rightarrow f''=e^{-x^2/a}(-2+\frac{4x^2}{a})=0\Rightarrow a=4$; $f(x)=\int-2xe^{-x^2/4}dx=4e^{-x^2/4}$ ($f(0)=4\Rightarrow C=0$); **ג1** זוגית; **ג2** אסימפטוטה $y=0$; **ג3** מקסימום $(0,4)$ + טבלת סימנים; **ג4** סקיצת פעמון (SVG). **ד** $m=e^h,\,h=1/f'$ → התאמה $f'\!\leftrightarrow\!III,\ h\!\leftrightarrow\!I,\ m\!\leftrightarrow\!IV$ ($II$ לא בשימוש) — ציירתי את כל 4 הגרפים בסרטוט custom אחד (רשת 2×2). **ה1** $m'=h'e^h$, $h'=-f''/(f')^2$, $f''=e^{-x^2/4}(x^2-2)$ → $m$ יורדת ב-$(-\infty,-\sqrt2)\cup(\sqrt2,\infty)$. **ה2** ב-$[1,2]$: $h<0,m>0\Rightarrow$ המכפלה$<0\Rightarrow\int_1^2 hm\,dx<0$ (שלילי). **✅ דף-ההמשך התקבל ויושר (2026-06-11):** ה2 תאם בדיוק את כתב-ידו (h<0, m>0 ב-[1,2] ⟹ אינטגרל שלילי); ה1 יושר לשיטתו — $m'(x)=-\frac{f''}{(f')^2}e^{1/f'}=0 \Leftrightarrow f''=e^{-x^2/4}(x^2-2)=0 \Rightarrow x=\pm\sqrt2$, ותחומי הירידה ($x<-\sqrt2$ וגם $x>\sqrt2$) נקראים מגרף $IV$. נדחף `20827c2`. אומת: build עבר + 550 ביטויי KaTeX / 0 כשלים / 0 עברית-בנוסחה. **הקובץ המיוחד עכשיו Q1+Q2+Q3+Q4 — Q4 שלם ומיושר לכתב-ידו.**

- ✅ **2023 מועד מיוחד Q5** (`b2023s582sp-q5`, topic `פונקציית ln`) — NEW question, פתרון מלא לפי כתב-ידו. 9 חלקים **א1-4/ב1-4/ג**: $f(x)=\frac{1-\ln x}{\ln x}=\frac{1}{\ln x}-1$ — תחום $0<x\ne1$, אנכית $x=1$, אופקית $y=-1$, $f'=-\frac{1}{x\ln^2 x}<0$ (יורדת תמיד), חיתוך $(e,0)$. $g(x)=\ln(-f(x))$ — תחום ($f<0$): $(0,1)\cup(e,\infty)$, אנכיות $x=1,x=e$, אופקית $y=0$, חיובית ב-$(0,1)$ שלילית ב-$(e,\infty)$. **ג** (החלק היפה): $a$=נקודת חיתוך $f,g$ ב-$x>e$; כי $f\to-1$ ו-$g\to0$ ההפרש $g-f\to1$ ועולה (תמיד $<1$), והקטעים ברוחב $1$ ⟹ II>I ושניהם $<1$ ⟹ **הגדול III(=1), הקטן I**. 3 סרטוטי custom (גרף $f$; גרף $g$; $f$+$g$ עם נקודת $a$ ושתי הרצועות I/II). אומת: build + 821 ביטויי KaTeX / 0 כשלים / 0 עברית-בנוסחה. נדחף **`0f61f67`**. **🎉 2023 מועד מיוחד הושלם — כל Q1–Q5 במאגר.**

- ✅ **2021 קיץ מועד ב' Q1** (`2021-summer-582-moed-b.ts`, `b2021s582b-q1`, גאומטריה אנליטית — פרבולה $y^2=2ax$ ∩ מעגל) — first of the 2021 re-do. All parts → his clean stacked format: **א** הצבה → $x^2-2x=0$ → 3 נקודות $(0,0),(2,\pm2\sqrt a)$; **ב** בחירת הזוג עם שיפוע חיובי → $y=\sqrt a\,x$; **ג1** השלמה לריבוע $(x-(a+1))^2+y^2=(a+1)^2$; **ג2** מרחק מהמרכז לישר $=\sqrt{a(a+1)}=2\sqrt5\Rightarrow a=4$ (שיטתו: ריבוע ואז צמצום); **ד** שיניתי את ה-prompt לגזירת המעגל החדש (מרכז $(5,0)$, $R=5-2=3$) + שיטת פיתגורס שלו $d^2+3^2=(x-5)^2+y^2\Rightarrow y^2=18x$, **+ ADDED `custom` SVG** של המשיק שצייר (מעגל, נקודה חיצונית, רדיוס 3, זווית ישרה, מרחק $x+4$ מהישר $x=-4$). המתמטיקה זהה לטיוטה הישנה שלי (כבר הייתה נכונה) — השינוי = סגנון→שלו + הסרטוט. נשתל באמצעות node (גוטצ'ת backslash — הקובץ הזמני אומת ב-`JSON.stringify` שיש `\\sqrt` כפול), build עבר, 637 KaTeX/0 שגיאות/0 עברית-בנוסחה, נדחף **`052acc1`** (pathspec; 2020+2022 churn מקביל). **ש2–ש5 נשארו.**

- ✅ **2021 קיץ מועד ב' Q2** (`b2021s582b-q2`, וקטורים במרחב + מישור) — **שוכתב מטיוטת-6-הסעיפים שלי (א1,א2,ב1,ב2,ג,ד) ל-4 סעיפי הבגרות האמיתית (א,ב,ג,ד) בשיטות שלו:** **א** $t,k$ משתי הצגות של $\vec{BF}$ ($t\vec{BE}=\frac{t}{3}\vec u-t\vec v$ מול $\vec{BC}+k\vec{CD}=\frac{k}{2}\vec u+(\frac{k}{2}-1)\vec v$) → מערכת → $k=\frac12,\,t=\frac34$; **ב** חיתוכי $4x+2y+z-12=0$ ($A(3,0,0),C(0,6,0),B(0,0,12)$), $E=A+\frac23\vec{AC}=(1,4,0)$, $F=B+\frac34\vec{BE}=(\frac34,3,3)$ — שיטתו ($F$ דרך $\vec{BF}=\frac34\vec{BE}$, **לא** כאמצע $CD$ שהיה בטיוטה הישנה); **ג** נורמל $(a,b,c)\perp\vec{OA},\vec{OE}\Rightarrow(0,0,1)\Rightarrow z=0$; **ד** שטח דרך הזווית $\cos\angle AOE=\frac1{\sqrt{17}}$, $\sin=\frac4{\sqrt{17}}\Rightarrow S=6$, גובה $|z_F|=3$, $V=6$. **+ ADDED 2nd `custom` SVG** (המשולש עם קואורדינטות $A(3,0,0)/B(0,0,12)/C(0,6,0)$ — ציור image-2 שלו). build עבר, 617 KaTeX/0/0, נדחף **`2f12e41`** (pathspec). מאומת ידנית (+ מכפלה משולשת $V=\frac16|36|=6$). **ש3–ש5 נשארו.**

- ✅ **2021 קיץ מועד ב' Q3** (`b2021s582b-q3`, מספרים מרוכבים — $z^4-2z^2+4=0$ + $(az^2+b)(z+1)=0$) — **5 תיקונים מהותיים מול הבגרות האמיתית + כתב-היד:** (1) **משוואה II הוחזרה לצורה מוכפלת** $(az^2+b)(z+1)=0$ (בקובץ היה מפותח $az^3+az^2+bz+b$ — אלגברית זהה אך לא כניסוח המקור/שלו); (2) **סעיף א בשיטת $z=x+yi$ שלו** ($t=z^2\Rightarrow t=1\pm\sqrt3i$, מערכת $x^2-y^2=1,\,2xy=\pm\sqrt3\Rightarrow 4x^4-4x^2-3=0\Rightarrow$ 4 שורשים $\pm\sqrt{3/2}\pm\frac{\sqrt2}{2}i$) במקום cis; (3) **ב** מלבן $S=2\sqrt3$ + **סרטוט מעודכן** עם 4 הקואורדינטות בקודקודים; (4) **ג** בכיוון המקור ("נתון ששניים מדומים $\Rightarrow x=0\Rightarrow y^2=\frac ba>0\Rightarrow ab>0$") במקום "אם ורק אם"; (5) **ה** גוזר $R=2|z_I|=2\sqrt2$ מ-$|z_I|=\sqrt2\Rightarrow \frac ba=8$ (בקובץ ניתן $2\sqrt2$ מוכן). **ד** $z=-1,\pm\sqrt{\frac ba}i$. build עבר, 651 KaTeX/0/0, נדחף **`fdfe286`** (pathspec). **ש4–ש5 נשארו.** 🔑 הערה: 2020-2022 ממשיכים לתת ניסוחי-שאלה שונים מהמקור (כאן: צורה מפותחת במקום מוכפלת) — תמיד הצלב מול הצילום.

- ✅ **2021 קיץ מועד ב' Q4** (`b2021s582b-q4`, פונקציה מעריכית $f=e^{bx^2-2bx}-1$, $b<0$) — **שוכתב למבנה 9 הסעיפים של הבגרות (א1-א4, ב1-ב3, ג, ד) בשיטותיו + 4 תיקונים:** (1) **א1 הוסיף חיתוך עם ציר $y$** ($(0,0)$) — בקובץ היה רק ציר $x$; (2) **א4 = סקיצה כסעיף נפרד** (היה ממוזג ל-א3); (3) **ג שוּנה מ"נקודות פיתול של $g$" ל"נקודות הקיצון של $g'(x)$ + סוגן"** (אותם $x=\pm\sqrt{-1/2b}$ אבל ניסוח המקור: max ב-$-\sqrt{}$, min ב-$+\sqrt{}$, עם טבלת סימן של $g''$); (4) **ד גוזר את הגבולות $x=\pm1$ מהקיצונים של $g'$** (היה $[-1,1]$ מוכן) → שטח $2(\sqrt e-1)\approx1.297$ בשיטת $-2[g]_0^1$ שלו. שאר הפתרונות לפי כתב-ידו: $a=1$, $g=e^{b(x^2-1)}-1$ זוגית, max $(1,e^{-b}-1)$. 2 טבלאות סימן (f' ב-א3, g'' ב-ג); 2 גרפי functionGraph (פעמון f ו-g; fn-closures בטוחים ב-PastBagrut). build עבר, 694 KaTeX/0/0, נדחף **`cadc730`**. **ש5 נשאר.** 🔑 השתמשתי ב-`^{\prime}` לכל הגזירות (לא apostrophe `\'`) — נקי, בלי escaping בתוך single-quote.

- ✅ **2021 קיץ מועד ב' Q5** (`b2021s582b-q5`, פונקציית ln $g=\ln(ax^2-x^3)$) — **🎉 סיום מועד ב'!** שוכתב לשיטותיו (8 סעיפים: א1-א2, ב1-ב3, ג1-ג2, ד) + 5 תיקונים: (1) **ב3 בשיטת $g'=\frac{f'}{f}=\frac{2ax-3x^2}{ax^2-x^3}$** (אפס מונה → $x=\frac{2a}3$, 0 נפסל) **+ טבלת סימן** עם `\nexists` באסימפטוטות — היה "ln עולה→מקס היכן ש-f מקסימלי"; (2) **ב2 הוסיף בדיקת אסימפטוטה אופקית** ($x\to-\infty\Rightarrow f\to\infty\Rightarrow$ אין) — היה רק אנכיות; (3) **ג2 בשיטת "מקס הכיפה $<0$"** ($\ln\frac{4a^3}{27}<0\Rightarrow\frac{4a^3}{27}<1\Rightarrow 0<a<\frac{3}{\sqrt[3]4}$) — היה ספירת חיתוכי $f$ עם $y=1$; (4) **🔴 באג בסרטוט ג1**: הקובץ השתמש ב-$a=3$ → הכיפה **מעל** הציר (2 חיתוכים — סותר "חיתוך אחד")! תוקן ל-$a=1$ (כיפה מתחת לציר); (5) **נוסף סרטוט לסעיף ד** ($g=\ln(-x^3)$, $a=0$, חיתוך $(-1,0)$, אסימפטוטה $x=0$). א1 בשיטת בדיקת-נקודות שלו ($f(-1),f(\frac a2),f(2a)$). build עבר, 718 KaTeX/0/0, נדחף **`0acaae3`**. **✅ כל מועד ב' (ש1-ש5) הושלם ומיושר לכתב-ידו.**

- ✅ **2021 מועד מיוחד Q1** (`2021-summer-582.ts`, `b2021s582-q1`, גאומטריה אנליטית — מקום גאומטרי/אנך אמצעי, שני מעגלים, משיקים) — **re-aligned to his FRESH handwriting** (he re-opened מועד מיוחד: "תעלה את 2021 מועד מיוחד בסגנון שלי, נתחיל בשאלה 1"). **סעיף א שוכתב לשיטת האנך האמצעי שלו** (שיפוע הקטע $-1/a$ → שיפוע ניצב $a$ → אמצע הקטע = הראשית → $y=ax$), ואז ההוכחה האלגברית במרחקים — בקובץ הייתה רק שיטת המרחקים. **+ הוספתי סרטוט לסעיף א** (שתי הנקודות, הקטע, אמצע $O(0,0)$, האנך האמצעי $y=ax$). **שדרגתי סרטוט ג** (הוספתי נקודת השקה $B$ + רדיוס $NB$ + סימוני זווית ישרה → שני המשולשים הדומים $MAO\sim NBO$ נראים, כמו בסקיצה שלו). **שדרגתי סרטוט ד** (המשיקים החיצוניים נפרשׂים מנקודת המפגש $(-8,0)$ על ציר $x$). ב/ג/ד כבר תאמו את כתב-ידו (מתמטיקה זהה). build עבר, 0 עברית-בנוסחה, נדחף **`ed46b0b`** (pathspec). **ש2–ש5 של מועד מיוחד נשארו — הוא ישלח כל אחת בתורה.**
- ✅ **2021 מועד מיוחד Q2** (`b2021s582-q2`, וקטורים — מנסרה משולשת ישרה $ABCA'B'C'$) — **שכתוב מלא**. הגרסה בקובץ (טיוטת MOE שלי) הייתה במבנה שונה לגמרי (א: $\vec{AB}\perp\vec{AC}\to k=2/-5$; ב1/ב2 הצבה+הוכחת זווית; ג מציאת קודקודים; ד אמצע $B'C'$). **הבגרות האמיתית (כתב-ידו):** **א** מציאת $k$ ממנסרה ישרה ($\vec{AA'}\perp\vec{AB}$ וגם $\vec{AA'}\perp\vec{AC}$ → שתי משוואות $k^2-3k+2=0$ ו-$k^2-k-2=0$ → המשותף $k=2$); **ב** משוואת המישור $A'B'C'$ (נורמל $=\vec{AA'}=(1,-5,3)$; נקודה $C=(5,-1,0)$ = חיתוך $\ell_{AC}\cap\ell_{BC}$; $C'=C+\vec{AA'}=(6,-6,3)$ → $x-5y+3z-45=0$); **ג** $\angle C'A'B'=\angle CAB=90°$ (כי $\vec{AC}\cdot\vec{AB}=3+0-3=0$); **ד** מרכז המעגל החוסם = אמצע היתר $B'C'$ (כי המשולש ישר-זווית ב-$A'$) $=(5,-5,5)$. **🔴 תיקון**: בקובץ תוויות $\ell_{AC}/\ell_{BC}$ היו מוחלפות — תוקן ($\ell_{AC}$ עם כיוון $(k+1,0,k-3)$). **+ 2 סרטוטים**: מנסרה (רמת שאלה) + משולש ישר-זווית עם מעגל חוסם (ד). הקודקודים ($A(2,-1,1),B(3,1,4),C(5,-1,0),A'(3,-6,4),B'(4,-4,7),C'(6,-6,3)$) זהים לטיוטה — רק המבנה/השיטות שונים. build עבר, 0 עברית-בנוסחה, נדחף **`503326b`**. **🟡 ש3 כתב-היד התקבל באותו batch (מרוכבים $w^2-4iw-4+2i=0$) אך עבדתי רק על ש2 ("עכשיו שאלה 2"); גם ש3 בקובץ במבנה שונה מהמקור** — האמיתי: א פתרון I ($w_1=1+i,w_2=-1+3i$); ב רב-ברירה ($z$ על ציר מדומה שלילי → $a=0,b>0$, טענה 1); ג $z^3=2(w_1+w_2)=8i$ → $\sqrt3+i,-\sqrt3+i,-2i$; ד סרטוט המשולש; ה מעגל חוסם דרך הראשית, הזזת $u=di$ → מרכז $(0,d)$, $R=2$ → $|d|=2$ → $d=\pm2$. **ש3 הושלם (ראה הבא); נותרו ש4, ש5.**
- ✅ **2021 מועד מיוחד Q3** (`b2021s582-q3`, מרוכבים) — **שכתוב מלא** לפי כתב-ידו (5 סעיפים א-ה; בקובץ היה מבנה אחר: א / ב=$z^3=8i$ / ג1-ג2 שווה-צלעות+שטח / ד-רביע). **א** פתרון משוואה I בשיטת $\sqrt{-8i}=x+yi$ (מערכת $x^2-y^2=0, 2xy=-8$ → $\sqrt{-8i}=2-2i$) → $w_1=1+i,\ w_2=-1+3i$; **ב** רב-ברירה — $z$ על הציר המדומה השלילי ($z=yi,\ y<0$) → $z^3=(yi)^3=-y^3i$ → $a=0,\ b=-y^3>0$ → **טענה 1**; **ג** $z^3=2(w_1+w_2)=8i$ → $2\,\text{cis}(30°/150°/270°)=\sqrt3+i,\ -\sqrt3+i,\ -2i$; **ד** סרטוט המשולש (שווה-צלעות על $|z|=2$); **ה** הזזת $u=di$ מזיזה את מרכז המעגל החוסם ל-$(0,d)$ ברדיוס $2$ → עובר דרך הראשית כש-$|d|=2$ → **$d=\pm2$**. + 2 סרטוטים (משולש במישור גאוס; שני המעגלים החוסמים דרך הראשית). build עבר, 0 עברית-בנוסחה, נדחף **`12d81d1`**. **ש4 הושלם (ראה הבא); נותרה רק ש5.**
- ✅ **2021 מועד מיוחד Q4** (`b2021s582-q4`, פונקציה מעריכית — $f(x)=\frac{e^x-e^{-x}}{e^x+e^{-x}}$, tanh) — **שכתוב מלא** לפי כתב-ידו. בקובץ היה מבנה שונה (א1 תחום / א2 אי-זוגית / א3 אסימפטוטות / ב1 נגזרת / ב2 עולה / ב3 אין קיצון / ג חסום $-1<f<1$ / **ד פתור $f=\frac12$** — לא בבגרות!). **הבגרות האמיתית (כתב-ידו):** **א1** תחום $\mathbb{R}$ ($e^x+e^{-x}>0$); **א2** פישוט $f=\frac{e^{2x}-1}{e^{2x}+1}$ ואסימפטוטות אופקיות $y=1$ ($x\to+\infty$), $y=-1$ ($x\to-\infty$), אין אנכיות; **א3** $f'=\frac{4e^{2x}}{(e^{2x}+1)^2}>0$ → עולה ממש, אין ירידה/קיצון; **א4** אי-זוגית; **ב** סקיצת עקומת $S$ (functionGraph קיים); **ג1** $g(x)=ax$, $g(1)=f(1)$ → $a=\frac{e^2-1}{e^2+1}\approx0.7616$; **ג2** שטח כלוא בין $f$ ל-$g$ — חיתוכים $x=-1,0,1$, סימטריה (שתיהן אי-זוגיות) → $2\int_0^1(f-g)$, קעירות $f''=\frac{8e^{2x}(1-e^{2x})}{(e^{2x}+1)^3}<0$ ל-$x>0$ → $f\ge g$, פונקציה קדומה $\ln(e^x+e^{-x})$ → $S=2[\ln(e+e^{-1})-\ln2-0.3808]\approx0.106$. נשמרה הצורה $f=\frac{e^{2x}-1}{e^{2x}+1}$ (שיטתו) לאורך כל הסעיפים; $f'$ שלו ($\frac{4e^{2x}}{(e^{2x}+1)^2}$) שקול ל-$\frac{4}{(e^x+e^{-x})^2}$ של הטיוטה. build עבר, 0 עברית-בנוסחה, נדחף **`a7bd58a`**. **ש5 הושלם (ראה הבא) — 🎉 כל מועד מיוחד 2021 גמור!**
- ✅ **2021 מועד מיוחד Q5** (`b2021s582-q5`, פונקציית ln — $f(x)=x(\ln x)^n$) — **שכתוב מלא** לפי כתב-ידו, מפורט שלב-אחר-שלב (המשתמש ביקש מפורשות: "שהפתרונות לא יהיו דחוסים בעברית, הכל מסודר ומובן שלב אחר שלב"). בקובץ היה מבנה שונה לגמרי (א1 תחום / א2 נגזרת / א3 אפסי f' / ב טבלת סימן n זוגי / ג גבולות+סקיצה / **ד אינטגרל $\int_{1/e}^1 x(\ln x)^2$** — לא הבגרות!). **הבגרות האמיתית:** **א1** תחום $x>0$ (כל $n$); **א2** נגזרת $f'=(\ln x)^{n-1}(\ln x+n)$ + **3 מקרים עם טבלת-סימנים נפרדת לכל אחד** — $n=1$ (ירידה $(0,\frac1e)$/עלייה), $n$ זוגי (עלייה/ירידה/עלייה, $n-1$ אי-זוגי), $n$ אי-זוגי $\ge3$ (ירידה/עלייה, $n-1$ זוגי, ב-$x=1$ משיק אופקי לא-קיצון); **א3** קיצון: $n=1$ מינ $(\frac1e,-\frac1e)$; זוגי מקס $(e^{-n},n^ne^{-n})$+מינ $(1,0)$; אי-זוגי מינ $(e^{-n},-n^ne^{-n})$+$(1,0)$ משיק; **ב** התאמת גרפים → **$n{=}1$→גרף ג, $n{=}2$→גרף ב, $n{=}3$→גרף א** (+ functionGraph השוואתי של 3 העקומות); **ג** סקיצת $g(x)=\frac{1}{x(\ln x)^2}$ — אסימפטוטות $x=0,x=1,y=0$, מינ $(e^{-2},\frac{e^2}{4})$ (custom SVG); **ד** שטח בין $g$, ציר $x$, $x=\frac1{e^2},x=\frac1e$ → הצבה $t=\ln x$, קדומה $-\frac1{\ln x}$ → $S=1-\frac12=\frac12$ (custom SVG מוצלל). **🔑 אומת ב-katex.renderToString: 798 ביטויי KaTeX בכל הקובץ / 0 שגיאות** (כולל 3 טבלאות-הסימנים array). build עבר, נדחף **`6a9e75c`**. **🎉 2021 מועד מיוחד ש1-ש5 הושלם כולו ומיושר לכתב-ידו (ש1 `ed46b0b`, ש2 `503326b`, ש3 `12d81d1`, ש4 `a7bd58a`, ש5 `6a9e75c`).**
- 📋 **2021 שאלון 582 — git-blame audit (2026-06-11):** user asked which 2021 Qs are his-handwriting vs my-solo-MOE-drafts, and wants ALL of them his. Verified via `git blame` (provenance is in git history ONLY — `solutionSource:'authored'` + the "הפתרונות נכתבו על-ידינו" header are uniform across all 15 Qs and DON'T distinguish). Status of the 3 files / 15 Qs:
  - ✅ **מועד א'** (`2021-summer-582-moed-a.ts`) — done in the 8.6 handwriting pass. **EXCEPT ש4 (`b2021s582a-q4`): ALL sub-parts א1…ד still from my 06-07 draft `624f4f63`** (only part ד touched 8.6) → re-verify vs his handwriting.
  - ✅ **מועד מיוחד ש1** (`2021-summer-582.ts`, `b2021s582-q1`) — his ("ש1: פתרון בדרך המשתמש" 06-08).
  - ✅ **מועד ב' ש1–ש5** (`2021-summer-582-moed-b.ts`) — **ALL 5 redone to his handwriting (2026-06-11). DONE** (`052acc1`,`2f12e41`,`fdfe286`,`cadc730`,`0acaae3`).
  - ❌ **מועד מיוחד ש2–ש5** (`2021-summer-582.ts`) — from the 06-02 "הוספת שאלות 2-5" commit = MY MOE drafts. Redo from his handwriting.
  - **⇒ 9 Qs outstanding to re-upload** (מועד ב' all 5 + מועד מיוחד 2–5) + re-verify מועד א' ש4. Next: same audit on 2020/2022/2023 (also hold my-MOE solutions). **UPDATE 2026-06-11: ✅ כל מועד ב' (ש1–ש5) done (`052acc1`,`2f12e41`,`fdfe286`,`cadc730`,`0acaae3`) → now 4 Qs outstanding = מועד מיוחד ש2–ש5 (`2021-summer-582.ts`). (+ re-verify מועד א' ש4.)**

---

# בגרות בכיס — Session Handoff (older header, last updated 2026-06-10)

**Working dir:** `C:\Users\1000m\bagrut-app` · **Production:** https://bagrut-app.vercel.app
**Stack:** Next.js 16 App Router · TS · Tailwind v4 · Anthropic SDK · Supabase · Vercel Hobby (60s/function cap)
**Admin email:** meitalm1020@gmail.com — owner is auto-Pro via `lib/access.ts` `ADMIN_EMAILS`. User identifies as male (`בן`), use male Hebrew forms.

---

## 🆕 LATEST (2026-06-10, later): "קורס מתקדם" (רמת בגרות) — שכבה שנייה מעל קורס הבסיס (⏸️ נושא זהב נדחף · ממתין לאישור לפני שכפול)

User's next big prompt: base course teaches CONCEPTS, advanced course teaches SOLVING BAGRUT QUESTIONS (pattern recognition, multi-part decomposition, rubric, time management). Built the full layer, gold topic = **מספרים מרוכבים** (so it has a complete base+advanced pair). Pushed **`3aee938`** (15 files, +3150). **🔑 CHECKPOINT: stop for user approval before replicating to other topics** (his explicit step 4).

**Schema** `content/advanced-courses/types.ts` — `AdvancedCourse`, ALL 7 sections required, NonEmpty lists; ExamPart FORCES hints-per-part + points + deductions; ExamQuestion forces targetMinutes + totalPoints. Sections: `gate` (EntryGate: questions + passThreshold, reviewRef→base concept atoms) · `patterns` (recognition/strategy/whereItAppears, anchor `#pattern-<id>`) · `techniques` (anchor `#technique-<id>`) · `workedExams` (per part: whatItReallyAsks/buildsOn/patternId/graderNotes) · `examPractice` (rubric layer) · `traps` (trap/consequence/avoid) · `simulation` (timeLimitMinutes + brief + ExamQuestion, hints hidden). `ADVANCED_SECTIONS` = 7 ids.

**Registry** `content/advanced-courses/index.ts` (`getAdvancedCourse`/`hasAdvancedCourse`, same `${subject}:${topic}` keys). **Route** `app/learn/[subject]/[topic]/advanced/page.tsx` (under /learn → already protected). **Progress** `lib/advanced-progress.ts` (localStorage `bagrut-advanced-progress-v1`: gatePassed/gateSkipped/completedSections/simulationPassed) + **`getTopicMastery()`** combining base+advanced → 'none'|'base-in-progress'|'base-done'|'advanced-done' (the at-a-glance mastery-map building block; a dedicated map PAGE not built yet — offered).

**Components** `components/advanced/`: `AdvancedCourseView` (orchestrator; §2-§7 replaced by a single lock card until gate passes — content not rendered at all), `EntryGate` (pass ≥ threshold → unlock+persist; FAIL → targeted referral links to base `#concept-<id>` + retry; always a "דלג — אני יודע את הבסיס" button), `PatternMapView`, `TechniqueCard`, `WorkedExamView` (think-aloud: מה הסעיף באמת שואל / buildsOn / מה הבודק מחפש), `ExamQuestionCard` (points badge per part, deductions rubric revealed WITH solution, target-time chip, pattern chips, stuck→anchor links), `ExamSimulation` (3 phases brief/running/review; sticky countdown bar w/ low-time color, finish/timeout reveals solutions+rubric, self-judge "עברתי" → markSimulationPassed + 🎓). Reuses `SectionShell` from learn/PathSections + `seededOrder` shuffle. Advanced theme = fuchsia/rose (base = emerald).

**Topic-page navigation**: `components/learn/CourseTracks.tsx` replaced the single beta banner in `LessonView` — TWO track cards (בסיס emerald / מתקדם fuchsia) with LIVE status chips from localStorage (לא התחיל/בתהליך x|n/הושלם; advanced shows 🔒 שער כניסה until gate passed). `LearningPathView` got an advanced-CTA card before its footer.

**Gold content** `content/advanced-courses/math5/complex-numbers.ts`: gate 4Q (threshold 3) → base atom refs; 5 patterns (quadratic-complex, polar-power-roots, real-imaginary-condition, gauss-geometry, sequence-rotation); 4 techniques (conjugate-tricks, parameter-equations z=ti עם t≠0, periodicity-powers, polygon-geometry); 2 worked exams (z²−2z+4=0 chain → w³=z₁⁶=64 → triangle 12√3; rotation z₀=√2cis45° → square S=4, z₈=z₀); 5 exam questions ×25pts EXACTLY (sums verified) ordered by patterns; 6 traps; simulation 35min z²−2z+2=0 → w⁴=z₁⁸=16 → square S=8. All math hand-verified; 0 Hebrew-in-math.

**Browser-verified end-to-end** (temp /pathpreview, DELETED): lock card until gate → answered 4 gate Qs → all 7 sections unlock + localStorage persists → rubric/deductions reveal with solution → simulation timer counts down (35:00→34:53), no hints, finish reveals solutions+rubric, "עברתי" sets simulationPassed. 160 KaTeX/0 errors. (Test gotcha: clicking two MCQs in ONE eval tick loses one setState to React batching — click sequentially when testing.)

**To replicate (ONLY after approval):** author `content/advanced-courses/math5/<topic>.ts` (gate refs must match that topic's base atom ids; parts sum to totalPoints=25) → register in advanced index → build → push. Two-track card appears automatically.

---

## 🆕 LATEST (2026-06-10): "מסלול לימוד מ-0" — מערכת חדשה מקבילה (✅ אושר ע"י המשתמש · שכפול בעיצומו, נושא-נושא)

User asked to turn each topic from a "summary doc" into a full **learning path** that teaches from ZERO up to a full bagrut question. Built a **NEW PARALLEL system** (does NOT touch the 15 legacy `Lesson`s — additive). User chose **מספרים מרוכבים** as the gold topic. Pushed **`e519579`** (14 files, +2863).

**✅ Gold APPROVED (2026-06-10):** user said "מצוין" and gave 2 fixes (both done): (1) the division simplestExample needed clear step-by-step display-math order — fixed `b778639`; **apply that standard to every multi-step simplestExample going forward**; (2) MCQ correct answer was always first → built deterministic shuffle `lib/shuffle.ts` (`a483136`).

**Replication progress (user approves topic-by-topic; he explicitly requested each):**
- ✅ **מספרים מרוכבים** (gold) — `e519579` + fixes.
- ✅ **פונקציה מעריכית** — `c5da4c7` (913 lines). 7 atoms (חוקי חזקות, הגרף ו-e, ln-inverse, משוואות+הצבה, נגזרת+הוצאת גורם, אינטגרל, חקירה), 2 hand-plotted SVG curves (e^x/e^-x + xe^-x), sign tables in EVERY extremum solution (verified KaTeX array format), level3 = חקירת xe^-x (sketch SVG inside the relevant sub-part) + e^2x-6e^x (area 25/2). Growth/decay EXCLUDED (separate topic). Verified: 328 KaTeX/0 errors, 8 sign-table arrows render.
- ✅ **גאומטריה אנליטית** — `16b23a7` (1163 lines). 9 atoms (מרחק+אמצע, שיפוע, משוואת ישר, מקבילים/ניצבים, מעגל, מרחק נקודה מישר, משיק 3-דרכים, פרבולה, אליפסה), 8 hand-drawn SVGs, 8 guided examples, level3 = (1) קוטר+אנך אמצעי+תאלס-בשיפועים A(1,2),B(7,4),D(5,6) עם סרטוט סטטי ברמת השאלה; (2) פרבולה y²=8x + אליפסה x²/25+y²/21=1 עם מוקד משותף F(2,0) + מעגל → חיתוכים (2,±4) — כמו שאלה 1 אמיתית. **קונבנציות מהשיעור: פרבולה y²=4px, מוקד (p,0), מדריך x=−p; אליפסה c²=a²−b², סכום=2a.** Verified: 366 KaTeX/0 errors, 8 SVGs.
- ✅ **פונקציית ln** — `dbdb58c` (945 lines, key `'math5:פונקציית ln'`, export `math5LnFunction`). 7 atoms (ln-inverse, ln-graph-domain, log-laws, ln-equations, ln-derivative, ln-integral 1/x→ln, ln-investigation), 8 guided trivial→hard (simplify $\ln(e^{2x})$ → domain → solve $\ln x=3$ → derivative → $\int_1^{e^2}\frac1x=2$ → log-eq w/ domain $x=5$ rej $-2$ → tangent $y=x-1$ → $x\ln x$ min $(\frac1e,-\frac1e)$ w/ sign table). level3 = (1) $f=\frac{\ln x}{x}$: domain $x>0$, intercept $(1,0)$, max $(e,\frac1e)$ sign table, asymptotes $x=0$/$y=0$, area $\int_1^e\frac{\ln x}{x}dx=\frac12$ via $t=\ln x$; (2) $f=x-\ln x$: min $(1,1)$, prove $x>\ln x$ via global min, tangent $y=\frac{e-1}{e}x$. 2 hand-plotted SVGs (ln x as **mirror of e^x across y=x**; ln x/x max-curve). **ln is the INVERSE of e^x → prereq links to 'פונקציה מעריכית'.** **🔑 New verify method (no temp route): esbuild.transformSync(loader:'ts') the path file → require → walk all string values → tokenize `$$..$$`/`$..$` → `katex.renderToString(throwOnError:true)`. Validates RUNTIME LaTeX (post JS-unescape). Got 663 KaTeX/0 errors, 4 SVGs tag-balanced, 15 reviewIfStuck refs all valid, 0 Hebrew-in-math.** (User said "תמשיך באותה דרך" — replication is routine now; author+build+push, he reviews live.)
- ⏭️ Remaining candidates (wait for user to name the next one): נגזרות, אינטגרלים, אלגברה, סדרות, טריגונומטריה, וקטורים, פונקציות, גדילה ודעיכה, הסתברות, גאומטריה אוקלידית.

**🔑 NEW RULE (learned 2026-06-10, now in STYLE_GUIDE `4e2ce6a`): NO Hebrew inside KaTeX math.** Not `\text{מרכז}`, not subscripts like `m_{משיק}` — KaTeX does no bidi → the word renders REVERSED + console warnings. Hebrew labels go OUTSIDE `$...$`; use Latin subscripts (`$m_r$`). Caught via console warnings during analytic-geometry verification; fixed 4 spots before push. When authoring, grep-check: `grep -n 'text{[א-ת]\|_{[א-ת]' content/learning-paths/math5/*.ts` must be empty.

**Architecture (parallel to `content/lessons`):**
- **Schema** `content/learning-paths/types.ts` — `LearningPath` type, ALL 8 sections REQUIRED, `NonEmpty<T> = [T, ...T[]]` on lists so the compiler rejects incomplete content. Sections: `prerequisites` · `intuition` · `concepts`(atoms: plain→formal→simplestExample→whyItWorks) · `guidedExamples`(each step `action`+`why`, plus `methodChoice`) · `pitfalls` · `practice{level1,level2,level3}` · `formulaSheet` · `comprehensionCheck`. Reuses `Formula`/`DiagramSpec` from lessons/types. `PATH_SECTIONS` const = the 8 section ids. `reviewIfStuck.conceptId` deep-links to a `ConceptAtom.id`.
- **Registry** `content/learning-paths/index.ts` — `getLearningPath`/`hasLearningPath`, keyed `${subject}:${topic}` (topic MUST equal the Lesson topic string exactly).
- **Gold content** `content/learning-paths/math5/complex-numbers.ts` (`math5ComplexNumbers`). cis/degrees, no Euler/radians. **Custom raw-SVG** Gauss-plane diagrams only (NO `fn:` closures — the route is server→client, closures would 500). All math verified by hand.
- **Route** `app/learn/[subject]/[topic]/page.tsx` (server loads → client `LearningPathView`; data is JSON-serializable). Added `/learn` to `PROTECTED_PREFIXES` in `lib/supabase/middleware.ts`.
- **Components** `components/learn/`: `LearningPathView` (orchestrator + per-section progress strip + jump nav), `PathSections` (Prereq/Intuition/Concepts/Pitfalls/FormulaSheet + `SectionShell` with mark-done toggle), `GuidedExampleCard` (step reveal action/why + methodChoice), `GradedQuestionCard` (mcq/open, gradual hints one-by-one, hidden solution, reviewIfStuck — zero API), `BagrutQuestionBlock` (multi-part level-3, reveal-to-compare, zero API), `ComprehensionCheck` (MCQ mastery gate, instant grade).
- **Progress** `lib/learn-progress.ts` (localStorage `bagrut-learn-progress-v1`, per-SECTION completion). Separate from `lib/progress.ts`.
- **Discovery**: beta banner in `components/practice/LessonView.tsx` → `/learn` (renders only when `hasLearningPath`).
- **MCQ option shuffle** `lib/shuffle.ts` (`seededOrder`): MCQ answers are reordered DETERMINISTICALLY by question id (FNV-1a + LCG Fisher-Yates) so the correct answer isn't always first, but order is identical server↔client (no hydration mismatch, no `Math.random`). Author MCQs with `correct: 0` (readable); the UI scatters it. Applied in `GradedQuestionCard` + `ComprehensionCheck`. (User flagged "correct always first" — fixed `a483136`.) Legacy quiz/SubTopicPractice NOT yet shuffled — offered to extend if wanted.
- **Style guide**: `content/learning-paths/STYLE_GUIDE.md` (rules for authoring every future path).
- **Verified locally** (temp public route `/pathpreview`, since DELETED): 269 KaTeX expr / **0 errors**, 6 SVGs render, `dir=rtl`, hints/steps/MCQ-grading all work, no console errors.

**To replicate a topic (ONLY after user approves the gold):** author `content/learning-paths/math5/<topic>.ts` per STYLE_GUIDE → register in `index.ts` (key = exact Hebrew Lesson topic) → `npm run build` → push. Banner auto-appears on that topic's lesson page.

**⚠️ Repo hygiene reconfirmed this session:** `git status` showed MANY unrelated modified/untracked files from parallel sessions (`content/lessons/math5/*.ts`, `past-bagruyot/*.ts`, `app/signup`, untracked `app/privacy`/`app/terms`/`app/topic-demo`/`components/topic`/`content/topics`). I staged ONLY my 14 files by explicit path. NEVER `git add .` here.

---

## 🆕 LATEST (2026-06-09, later): "לומד מ-0" — inline שאלה+פתרון אחרי כל נוסחה (rollout בעיצומו)

User approved (after a concept-1 pilot he verified) rolling out an inline teaching format across **ALL math5 lessons**: after each formula/explanation in a concept body, add a small **שאלה** + **פתרון** (visible, worked) so a student who knows nothing learns step-by-step. Format: `**שאלה.** …` then blank line then `*פתרון:* …` (bold/italic labels, NO emoji).

**🔑 Technique (escaping/anchor gotchas — critical):**
- Concept bodies are **template literals** (backticks) but still use **DOUBLE backslashes** (`\\sqrt`, `\\dfrac`, `\\cos`) exactly like the single-quoted strings. The **Read tool DISPLAYS single `\`** but the real file bytes are `\\` — verified with `node -e "readFileSync + JSON.stringify"`.
- For **new content** type `\\` (it writes through correctly — confirmed by build + node).
- For **old_string anchors**: use **backslash-FREE, single-line, unique** substrings (a Hebrew explanation/header line) → sidesteps BOTH the backslash display-vs-bytes mismatch AND the CRLF multi-line mismatch. Append/prepend the שאלה+פתרון around that anchor.
- Per concept: Read fresh → pick clean anchor → Edit → `npm run build` → `git add <file>` → push.

**Progress:**
- ✅ **מספרים מרוכבים** — all 4 concepts (15 Q&A). Commits `046b0d3` (concept-1 pilot) + `3fa72c1` (concepts 2-4).
- ✅ **גזירה (נגזרות)** — 9 Q&A (כללים, מכפלה, מנה, שרשרת, משיק, קיצון, עלייה/ירידה, פיתול, קיצון יישומי). Commit `3e9b2f2`.
- ⏭️ **REMAINING (~12 topics), do each the same way + push:** אלגברה, סדרות, טריגונומטריה, גאומטריה אנליטית, וקטורים, פונקציות, אינטגרלים, פונקציה מעריכית, ln, גדילה ודעיכה, גאומטריה אוקלידית, הסתברות.

---

## 🆕 LATEST (2026-06-09): Gemini-drafted exercises workflow — first batch integrated

User bought a **Gemini subscription** (consumer/chat — I clarified it is NOT API access; the app stays on Anthropic). New content workflow established and working: **Gemini drafts → Claude verifies the math → Claude converts to app format + pushes.** Cross-model check is the whole point.

- **First batch (מספרים מרוכבים):** Gemini returned a JSON module (summary + 6 graded exercises). I verified all 6 and **caught 1 real error** ($\sqrt[1]{8}$ instead of $\sqrt[3]{8}$ in the $z^3=-8i$ roots) + 2 cosmetic ($2\sqrt8\to4\sqrt2$; "מדומה"→"מרוכב"). Skipped Gemini's summary (we already have a polished one for this topic).
- **Integrated** the 6 as `bagrutQuestions` **cx-bag-006..011** in `content/lessons/math5/complex-numbers.ts` (bank 5→11). Single + multi-part, 3 hints/part, clean stacked-math steps + בדיקה lines. Build passed, committed + pushed **a9c4805**.
- **Format note / follow-up:** cx-bag-006..011 use the **clean stacked-math** style (user's verified preference). The OLD cx-bag-001..005 still use the **bold-header** style → bank is now mixed. Offered to convert 001..005 to clean-stacked later.
- **Constraint reaffirmed:** lesson `PracticeQuestion`/`BagrutQuestionPart` have **NO diagrams field** → lesson practice is text-only. Figures for cx-bag-009 (triangle) / cx-bag-010 (line) are described in words. Rendering them physically would need a `diagrams` field added to the type + the practice renderer (offered as an enhancement).
- **The master "briefing" prompt** I gave the user (project + conventions + output format) is what makes Gemini's output land in the right shape — reuse it per topic, just swap the last "הבקשה" line.

---

## 🆕 LATEST (2026-06-08): מבצע אימות+שדרוג כל בגרויות 582 (שאלה-שאלה)

User launched a systematic pass over the **past-bagruyot archive**. Two phases:
1. **Phase 1 (now):** go question-by-question through ALL 582 bagruyot 2020→2026. User sends each question + his **full handwritten solution**. The questions are ALREADY in the repo and mostly math-correct, so per question: (a) verify math vs his solution, (b) rewrite the solution in **CLEAN MATH FORMAT** (see FORMAT below), (c) ensure EVERY figure is drawn physically.
2. **Phase 2 (later):** learn the styles/methods from all ingested bagruyot → build per-topic summaries + practice drills.

**Decisions locked (2026-06-08):**
- **🔑 FORMAT (user verified on Q3, 2026-06-08 — "מושלם תחיל על הכל"):** CLEAN STACKED MATH. Each `steps[]` entry = ONE math expression/result on its own line ($...$), with at most a SHORT Hebrew label where it helps (e.g. `בדיקה:`). **NO bold `**…**` headings, NO multi-clause prose paragraphs.** Must look like the student's handwriting — stacked math lines, every sub-result (z₁,z₂,z₃,z₄ …) on its OWN line, never bundled. User explicitly REJECTED the verbose "bold heading + explanation" style I first used on Q1/Q2. Short `בדיקה:` lines are OK (he said apply to all incl. checks). **The render (`app/bagruyot/archive/page.tsx`) auto-numbers each step (1. 2. 3.) and runs each through `<MathText inline>` — so one expression per array entry = one clean numbered line.** ✅ DONE (2026-06-08 later, this session): Q1+Q2 moed-a AND special Q1 ALL converted from verbose to this clean stacked-math format — commits `71828b3` (moed-a) + `01d7258` (special). The verbose-redo TODO is complete.
- **CRLF gotcha:** `git add` converts LF→CRLF on disk, so after every commit you must Read the file again before the next Edit (else "File has not been read yet"). Also the file has been observed changing between reads — always Read fresh before editing.
- **Push after EVERY question** (user's choice — each Q live in 2-3 min so he verifies on the site).
- **Scope: 582 only, all years 2020-2026.**
- **User sends full handwritten solutions** (chose this over "just final answers"). These are HIS solutions = valid source; I re-express in app style + verify.
- **🔑 EVERY figure must be rendered physically as SVG on the site** — user explicit: *"את כל הסרטוטים שיש אני רוצה שהם גם פיזית יהיו באתר"*. When verifying a question, scan the setup + each sub-part for any diagram the original/solution has, and ADD a `diagrams` block (custom SVG / functionGraph / geometry primitive) if missing. Question-level setup figures (pyramid, triangle) → question-level `diagrams`; per-part graphs → that part. (Reminder: `fn:` closures are SAFE in PastBagrutQuestion — archive page is client-side.)

**Progress — 2021 קיץ מועד א' (`2021-summer-582-moed-a.ts`):**
- ✅ Q1 (analytic geom — parabolas + kite): math already exact; upgraded to full explained style. Commit `217b1fc`. NOTE: user's handwriting also sketched the two parabolas (parts א,ב) — only the kite (ד2) has an SVG in repo; parabola sketches for א/ב still NOT added (asked user if he wants those too).
- ✅ Q2 (vectors — pyramid SABCD over rhombus): upgraded style + **ADDED pyramid SVG** (was missing). Commit `d19d95f`.
- ✅ Q3 (complex — z⁴=−16, rotation, 16-gon): math exact; upgraded style; its 3 diagrams (ב,ג,ה) already present. Commit `d19d95f`.
- ⏭️ NEXT: Q4 (exp function, sigmoid f=1+ae^{−2x}), Q5 (ln investigation). Then other years.

**Archive state (33 Qs / 7 files):** 2020 קיץ (3/5 — **Q4,Q5 MISSING**), 2021 special/moed-a/moed-b (5 each), 2022 קיץ-a/קיץ-b/חורף (5 each). **Fully missing: 2024, 2025, 2026.** (2023 קיץ מועד א' STARTED in `2023-summer-582.ts`: Q1 ellipse+parabola+circle (`733e3ec`); Q2 vectors-in-cube parts א-ג2 (`df69d9c`) — proved CA'⊥plane BC'D, median-point E, found A(3,-4,0) & C'(4,3,5). Q2 COMPLETE (`5adfb62`): ד = ℓ=BC' line X=(7,-1,0)+t(-3,4,5) (B(7,-1,0) found via AB=DC); ה = plane X=(7,-1,0)+t(-3,4,5)+s(1,0,0) parallel to x-axis (no intersection: y=0→t=¼ vs z=0→t=0 contradiction). Clean stacked-math + SVG cube diagram. Q3 COMPLETE (`b47964c`): z⁶=1→z0=cis300, triangle ABC (AC diameter, OB⊥AC height)→d=6, w=√6·cis(-45°), w^n pure-imaginary & outside circumcircle→n_min=6 (Gauss-plane SVG). Q4 COMPLETE (`ca68a67`): f=(eˣ-1)ⁿ-4 investigated by parity of n (asymptote y=-3/-5, min/inflection at (0,-4)), intersection w/ g=6eˣ-10 → area 24-7ln7≈10.378, h=|f| → max(0,4)+min(ln3,0), 3 intersections iff 3<k<4. 3 functionGraph SVGs. Then user asked (showing the live א2) for MORE math explanation + an actual SIGN TABLE "כמו בכתב היד" → added 2 KaTeX inline-array sign tables (`d65aa68`). **🔑 SIGN-TABLE FORMAT (verified renders in KaTeX):** put the whole table in ONE step string as inline LaTeX: `$\\begin{array}{c|c|c|c} x & x<0 & 0 & x>0 \\\\ \\hline f'(x) & - & 0 & + \\\\ f(x) & \\searrow & & \\nearrow \\end{array}$` (use `\\searrow`/`\\nearrow` for the f(x) arrow row; `\\hline` under the header; `c|c|c|c` for vertical rules). MathText renders steps inline via remark-math+remark-gfm+rehype-katex, so KaTeX `array` works. **ADD a sign table in any חקירת-פונקציה extremum/monotonicity sub-part going forward** (user explicitly wants it). Q5 COMPLETE (`b6ecc00`): f=ln x+1/x min(1,1), g=(x+1)(1-ln x) decreasing + concavity (g''=(1-x)/x²), h=g'/x area=3/2-1/e; 3 sign tables (א2, ב2, ב3) + 2 functionGraph sketches. **✅ ALL of 2023 מועד א' Q1-Q5 COMPLETE.** (A parallel session created `2023-summer-582-special.ts` = 2023 מועד מיוחד, registered in index.ts — not mine, leave it.) 2023 מועד ב' STARTED (`133f2d6`, NEW file `2023-summer-582-moed-b.ts`, registered in index.ts): Q1 analytic-geom — AC²+BC²=1320→circle(8,14)R=20, shift 8 left/14 down→E(0,20),G(0,-20), F1(15,0) shown via BOTH similar-triangles AND parallel-line-distance (user sent both methods — included both), ellipse x²/625+y²/400=1, two tangent circles (Q1 R=5, Q2 R=15) — 3 SVGs. Q2 added (`d8bde7b`): vectors in pyramid ABCD (DC⊥ABC) — EF=k/2·u+(1/2-k/2)v+(1/2-3k/2)w, EF∥ABC→k=1/3, coords B(8,6,0)/C(0,4,0)/D(0,4,9), V=48, EF&AB are SKEW (מצטלבים). + pyramid SVG. Q3 added (`303beca`): complex geometric sequence — z1³=z3→q=±z1, z1=√2cis45° (R=√2, α=45° in Q1), z(4n)=(-4)ⁿ REAL & z(4n-2)=-(-4)ⁿi/2 IMAGINARY, Σ z_k/(√2)^k for k=1..64 = geometric with ratio cis45°, (cis45°)⁶⁴=cis2880°=1 → sum=0. + Gauss-plane SVG. Q4 PARTIAL (`06f4fea`, parts א+ב ONLY — user sent just 5 photos covering א+ב): f=(lnx+lna)/(lnx-lna), a>1 — domain 0<x<a or x>a, asymptotes x=a & y=1, x-intercept (1/a,0), f'=-2lna/(x(lnx-lna)²)<0 decreasing everywhere, claim "f=f' has exactly one solution for x>a" is FALSE (f>1>0>f' so never equal). Q4 NOW COMPLETE (`73db794`): ג g=ln(f) domain 0<x<1/a or x>a + sketch (vert asymptotes 1/a & a, horiz y=0, g<0 left / g>0 right); ד ∫₃⁵ln(4f)dx = 2ln4+S = ln16+S ≈ 2.77+S (1<a<3 puts [3,5] in x>a where g>0 so S=∫₃⁵ln f). Q5 added (`7598963`): f=eˣ/(eˣ-6) — asymptotes x=ln6/y=1/y=0, decreasing; g=1/f=1-6e⁻ˣ rising (y=1, hole at (ln6,0)); area between g & y=1 over [ln7,ln10] = 9/35; f∩g at (ln3,-1); s(x)=∫ₓ^ln5(f-g) → s'=g-f → MIN at x=ln3 (sign table). **✅ ALL 2023 מועד ב' Q1-Q5 COMPLETE.** 2023 FULLY DONE: מועד א' 5/5 + מועד ב' 5/5 (+ special from parallel session). ⚠️ That commit also swept a pre-staged ln-function.ts edit (parallel session's "לומד מ-0") — harmless, build passed; going forward run `git status` before commit (2-session repo). Then user jumped to **2022 מועד ב' Q1** — and the repo had WRONG givens! Repo said A(-5,3)/B(0,-2) but the real bagrut (user's photo) is A(-5,4)/B(0,-1) → every result was off. Fixed (`969c111`, pathspec commit): corrected points + redid all parts in clean format (y=x+4, M(0,4) R=5, ellipse x²/25+y²/16=1, ratio S(KLF)/S(TQF)=5/4) + rebuilt the SVG (ellipse+circle+line x=-3+points K/L/T/Q/F). **🔑 LESSON: pre-existing repo bagrut entries (esp. the older 2020-2022 ones authored before the user-photo workflow) may contain WRONG numbers/givens — always verify against the user's photo and fix, don't assume the repo is right.** **🔑 GIT: use `git commit <pathspec>` (not bare `git commit`) — a parallel session keeps pre-staging lesson files; pathspec commits only your file.** Then **2022 מועד ב' Q2** (vectors, orthogonal pyramid OABC) — repo AGAIN had a WRONG number: vol said 20⅚→a=5, real bagrut says 57⅙→a=7 (a³=343). Fixed (`c03344a`, pathspec): corrected ו, converted א-ה to user's method (AB/AC dot-products in א, AM=⅔AD expansion in ב, normal+substitution in ה), clean format, ADDED orthogonal-pyramid SVG (was missing). (User sent only א-ה photos; ו's given is in the question image, solved a=7 myself.) **Pattern confirmed: 2020-2022 repo entries repeatedly have wrong givens — always cross-check the photo.** Next gaps: 2020 Q4-Q5, rest of 2022 (winter, summer-a Q-by-Q check), years 2024/2025/2026.)

---

## LATEST (2026-06-07): Split "גדילה ודעיכה" into its own topic

User felt growth/decay didn't belong inside "פונקציה מעריכית". He first said "remove it — it's not in the material"; I checked `bagrut-curriculum.ts` + a web search of MOE/prep sources and confirmed growth/decay is **core in שאלון 582 (in every exam, incl. half-life)**, so I did NOT delete — surfaced the evidence. He clarified the real intent: **split it out** (keep it, but as a separate topic, not mixed into exp-functions). Done:

- **Created `content/lessons/math5/growth-decay.ts`** — standalone Lesson `math5GrowthDecay`, topic key `'גדילה ודעיכה'`: intro, 2 concepts (model + half-life/interest), 3 formulas, 3 examples, pitfalls/summary/examTips, 8 quiz questions (`gd-001..008`), 1 bagrut question (`gd-bag-001`, the bacteria one).
- **Cleaned `exp-functions.ts`** — removed the growth/decay concept, formula, pitfall, summary/examTips lines, quiz Qs (exp-008/013/015), exp-bag-003, and the exp-growth-decay subTopic. Neutralized "אינטגרל בבעיות יישומיות" example (population → water volume).
- **Registered** in `index.ts` (`'math5:גדילה ודעיכה'`), `bagrut-curriculum.ts` (PAPER_582, weight core; trimmed growth/decay from exp's examStyle), pickers `app/practice/page.tsx` + `app/quiz/page.tsx` (math5 lists) + `app/api/solve-photo/route.ts` KNOWN_TOPICS.
- Build passed, **committed + pushed `28e1fe7`** (only my 7 files).

**LESSON:** when the user asks to delete content claiming "it's not in the material," VERIFY against `bagrut-curriculum.ts` + web BEFORE deleting. Growth/decay is core 582 content — the real need was reorganization, not removal. Don't delete core bagrut content on a single claim; surface evidence first.

---

## LATEST SESSION (2026-06-07, earlier): Bagrut-question format upgrade (complex + exp)

User asked (working from `Desktop\איתי תוכנה`) to align lesson practice with how questions actually appear in the bagrut, with full/clear solutions. Worked on **2 topics in the live app** (he chose "מרוכבים + מעריכיות" to start; format = "באתר עצמו"):

- **`content/lessons/math5/complex-numbers.ts`** — upgraded all 4 `bagrutQuestions` (cx-bag-001..004) to full exam format: every solution step opens with a **bold heading** (what we do + why), computational parts end with **בדיקה ✓**, 3 graduated hints per part. **Fixed a real bug**: a hint said `560°` where it should be `300°` (cx-bag-002 ב). Added **cx-bag-005** — new integrated 5-part question (quadratic over ℂ → polar → de Moivre → Gauss-plane geometry → triangle area). Removed leftover ⚠️ from intro.
- **`content/lessons/math5/exp-functions.ts`** — biggest gap (one-line solutions). Expanded `exp-bag-001` into a full investigation (domain, intercepts, derivative, extremum w/ sign table, asymptote, sketch); expanded `exp-bag-004` with a volume-of-revolution part; upgraded 002/003. Added **exp-bag-005** — full investigation of $f(x)=xe^{-x}$ (extremum, asymptote, area via integration by parts).

**Status:** `npm run build` passed clean. **Committed + pushed as `7f53b3c`** (`5dc2cb1..7f53b3c`, Vercel auto-deploy) — user said "תעדכן באתר". `git add` was selective: ONLY `complex-numbers.ts` + `exp-functions.ts`. **`app/signup/page.tsx` and `content/past-bagruyot/2021-summer-582.ts` remain modified/uncommitted** (pre-existing churn, NOT mine — left them untouched; the 2021 file is ~260-line line-ending churn).

**Next candidates (user prefers per-batch approval — do NOT auto-run all):** `ln-function.ts` (same upgrade; it's the same 582 chapter as exp), then thin bagrut banks in other topics (most have only ~4 terse `bagrutQuestions`). NOTE: the lesson `BagrutQuestionPart` type has NO `diagrams` field (only past-bagrut `PastBagrutPart` does) — lesson bagrutQuestions are text-only; embedding function graphs needs a type+`QuestionPartCard` change first.

---

## 🎯 EARLIER SESSION (2026-06-07): Full math5 pedagogical refactor

**13 of 15 lessons cleaned up.** Major content pass applying the "learn" pedagogical methodology + bagrut-specific conventions.

### Phase 0 — Infrastructure
- Added `diagrams?: DiagramSpec[]` field to `SubTopic` type in `content/lessons/types.ts`.
- `components/practice/SubTopicLanding.tsx` now renders subTopic-level diagrams after the summary block.
- Commit `44eda12`.

### Phase 1 — Deep pedagogical rewrites (7 lessons)
Each rewrite applies: display math `$$...$$` per derivation step (not inline chains), motivation-first prose (NOT "what is X" definition-first), no decorative emojis (🎯⚠️📌🔥⭐ stripped), tables when structure helps, named common stumbling blocks, direct calm tone.
- **exp-functions.ts** — `3cb0a17` (subsequently a functionGraph with JS `fn:` broke prod, fixed in `c37334c`)
- **derivatives.ts** — `43bca78` (introduced canonical sign-table format for extremum classification)
- **integrals.ts** — `a9f4376`
- **vectors.ts** — `9ea1077`
- **analytic-geometry.ts** — `4385fbf`
- **complex-numbers.ts** — `90de03b` (later degree refactor `5dc2cb1` — see below)
- **functions.ts** — `870cd00`

### Phase 2 — Light cleanup (5 lessons; emoji-strip + minor tweaks)
- **algebra.ts** — `29c6c42` (1839 lines, too big for full rewrite this pass)
- **sequences.ts** — `f344d5b`
- **trigonometry.ts** — `c381361`
- **euclidean-geometry.ts** — `0679e86`
- **probability.ts** — `7e20c0f`

### Phase 3 — Skipped lessons
- **`statistics.ts`** — OUT-OF-SCOPE per `bagrut-curriculum.ts`. The curriculum file explicitly notes it's not in the modern 807/582 syllabus. Don't touch.
- **`exponential.ts`** — **DEAD CODE.** Not imported in `content/lessons/index.ts`, not referenced from `app/`. Was an old combined exp+ln lesson before the split into `exp-functions.ts` + `ln-function.ts`. Don't waste time on it; consider deleting in a future cleanup.

### Phase 4 — Bidi RTL fix for worked examples (2 commits)
Bidi/RTL bug: pattern `*דוגמה N.* $f(x) = ...$.` flipped order in RTL display; trailing period jumped before the math. And `הפנימי $g(x) = ...$, נגזרתו $g'(x) = ...$.` rendered `g'(x)` BEFORE `g(x)`. Fixed across exp-functions, derivatives, integrals, ln-function:
- `19a7a38` + `4463707` — restructured 15 worked examples to use "*דוגמה N.* גזרו את הפונקציה" + display math block (no trailing period after math).
- `1aba2e2` — replaced comma between two inline math expressions with "ו" (Hebrew "and") connector to break bidi grouping. Ending changed to ":" before display math.

### Phase 5 — complex-numbers bagrut-conventions refactor
User pointed out that **Israeli 5-units bagrut doesn't use $e^{i\theta}$ or radians**. The lesson had a whole concept block on Euler + radians everywhere.
- **Removed entirely:** the "הצגה אקספוננציאלית ונוסחת אוילר" concept block + Euler entry from `formulas` array + "הצגה אקספוננציאלית" line from `intro`.
- **Converted all $\pi$ → degrees** across concepts, formulas, examples, questions, subTopics: $\pi/4 → 45°$, $\pi/2 → 90°$, $2\pi k → 360°k$, $\dfrac{\theta + 2\pi k}{n} → \dfrac{\theta + 360°k}{n}$, etc. ~70 substitutions total.
- **Updated polar-form concept:** cis is "the STANDARD notation in 5-units bagrut," not a "shortcut." Angles in degrees throughout.
- Commit `5dc2cb1`.

### Net result for math5
13 lessons consistent in style: display math per step, no decorative emojis, narrative motivation, bidi-safe Hebrew+math, complex-numbers fully bagrut-compliant (cis, degrees).

**Known incomplete work (post-session TODO):**
- Sub-topic `summary` fields across many lessons still use the old "**bold label** $formula$ • rule" pattern from when they were authored — these may also benefit from the same pedagogical pass, but were NOT updated this session for time reasons.
- `algebra.ts` and `trigonometry.ts` are the biggest files (1839/1832 lines) and only got emoji-strip — they still deserve a deep rewrite eventually.
- The Phase 0 plumbing for subTopic-level diagrams is built but no subTopic actually uses it yet (functionGraph blocked by RSC issue — see lesson note in `lessons_learned.md`).

---

## 🎯 BIG NEW FEATURE (this session): SubTopic course modules

**The big architectural addition.** Each lesson can now have `subTopics?: SubTopic[]` — focused mini-modules that the student works through before tackling the comprehensive bagrut question. **As of 2026-06-02, populated for 7 topics** (each with 4 modules): complex-numbers (POC), algebra, functions, derivatives, integrals, trigonometry, sequences. **Remaining topics still need modules (8):** probability, statistics, exponential, exp-functions, ln-function, analytic-geometry, euclidean-geometry, vectors. User is rolling this out topic-by-topic and prefers to stay in the loop per batch (declined "run all automatically").

### Schema (`content/lessons/types.ts`)
```ts
export type SubTopic = {
  id: string;          // slug, used in URL
  title: string;
  emoji?: string;
  tagline: string;     // one-sentence "what this teaches"
  summary: string;     // 2-4 paragraphs markdown+LaTeX
  keyPoints: string[]; // 3-5 "must remember"
  formulas: Formula[]; // subset relevant to THIS sub-topic
  questions: PracticeQuestion[]; // 5-8 focused drills
};
```
Added optional `subTopics?` field to `Lesson` type. Helpers in `content/lessons/index.ts`: `getSubTopics`, `hasSubTopics`, `getSubTopic(subject, topic, subId)`.

### Routes
- `app/practice/[subject]/[topic]/sub/[subId]/page.tsx` → landing (summary + formulas + CTA)
- `app/practice/[subject]/[topic]/sub/[subId]/practice/page.tsx` → sequential focused drill

### Components
- **`components/practice/SubTopicLanding.tsx`** — focused summary + keyPoints + formulas + big green CTA. Emerald color scheme.
- **`components/practice/SubTopicPractice.tsx`** — sequential MCQ + open with: progress bar (1/N), instant MCQ grading (confetti on correct, error toast on wrong), open answer is "compare to solution" (no auto-grade), single optional hint, cascading solution reveal, completion summary card with score X/N + grade emoji.

### Course progress tracking (`lib/progress.ts`)
Added `completedSubTopics?: string[]` to `TopicProgress`. New functions:
- `markSubTopicDone(subject, topic, subId)` — idempotent
- `getCompletedSubTopics(subject, topic): Set<string>`
- `isSubTopicDone(subject, topic, subId): boolean`

`SubTopicPractice` calls `markSubTopicDone` when student finishes all questions. `LessonView` reads completed set on mount.

### LessonView "מסלול לימוד" section (above the bagrut/quick CTA)
Renders only if `lesson.subTopics?.length > 0`. Shows:
- Progress strip: "X/Y מודולים הושלמו" + percentage + gradient progress bar
- Numbered modules (1, 2, 3, 4) with state-based styling:
  - **Done**: emerald gradient, checkmark badge, "✓ הושלם" pill
  - **Next**: amber gradient with glow shadow, "▶ הבא בתור" pill
  - **Pending**: dim emerald, number badge
- When all done: "🎓 סיימת את כל המודולים!" headline + nudge to bagrut mode

### Sub-topics populated so far (6 topics × 4 modules)
- **complex-numbers** (POC): polar-de-moivre 🌀, complex-roots 🔢, complex-equations ⚖️, gauss-loci 📐
- **algebra**: quadratic-equations 🎯, discriminant-parameter 🔍, radical-rational √, inequalities ⚖️
- **functions**: domain-definition 🗺️, intersections-signs ✂️, asymptotes-rational 📉, even-odd-inverse 🔄
- **derivatives**: derivative-rules ✏️, tangent-line 📏, extrema-monotonicity ⛰️, optimization 🎯
- **integrals**: basic-integration 📝, definite-integral 🎯, area-between-curves 📐, volume-revolution 🔄
- **trigonometry**: trig-identities 🔄, trig-equations 🎯, special-angles-reduction 📐, trig-calculus ✏️
- **sequences**: arithmetic-sequences ➕, geometric-sequences ✖️, infinite-geometric ♾️, sequences-applications 💰

**Workflow per topic:** grep file structure → read formulas section to reuse exact latex → author 4 modules with **manually verified** math → Edit-insert `subTopics: [...]` before the final `};` → `npm run build` → commit → push. Each module: 4-6 questions mixing mcq+open across easy/mid/hard.

---

## ✨ Polish pass (this session): Animations + Toasts + Confetti EVERYWHERE

The whole app got a major UX/visual upgrade. **Don't undo any of this.**

### Libraries installed
- `framer-motion` — animations
- `sonner` — toasts
- `canvas-confetti` (+ `@types/canvas-confetti`) — celebration effects

### Shared utilities
- **`lib/animations.ts`** — reusable motion variants: `fadeUp`, `staggerContainer`, `heroStagger`, `scaleIn`, `cardHover`, `buttonTap`, `inViewProps` (whileInView with margin: -80px, once: true), `easeOut` ([0.22, 1, 0.36, 1]).
- **`lib/confetti.ts`** — 3 presets:
  - `sparkle()` — small 30-particle burst (for hint reveals)
  - `celebrateCorrect()` — 80-particle burst (for correct answers)
  - `celebrateCompletion()` — multi-frame side cannons over 700ms (for finishing a module)

### Global Toaster
Mounted in `app/layout.tsx`: `<Toaster position="top-center" dir="rtl" theme="dark" richColors closeButton />` with Heebo font. Use `toast.success/info/error/loading` anywhere.

### Where animations land
- **`app/page.tsx`** (home `/`) — Hero stagger entrance, every scroll section has `inViewProps`+`staggerContainer`, all cards have hover lift (`y: -4` or `-5`), Final CTA blobs are animated (pulsing scale + opacity), Sparkles icon rocks subtly, FAQ uses `AnimatePresence` for smooth open/close.
- **`app/my-plan/page.tsx`** — Hero countdown stagger, "40 ימים" scales in dramatically, 3 stat cards stagger, topics list fadeUp + hover translate-x, scan/library/bagruyot cards stagger + hover lift, resources section animated.
- **`app/bagruyot/page.tsx`** (landing) — Hero stagger, stats scaleIn, feature cards fadeUp + hover lift, sample preview scaleIn + hover, CTA scaleIn with hover scale.
- **`app/bagruyot/archive/page.tsx`** — `PartPracticeCard` uses AnimatePresence on hints (slide-in) and solution (cascade), buttonTap on action buttons, smooth height transitions.
- **`components/practice/LessonView.tsx`** — every section uses `inViewProps`, cards have hover, CTA buttons get hover lift+scale.
- **`components/practice/QuickExerciseView.tsx`** — problem fades in, hints AnimatePresence, solution cascades step-by-step (delay i*0.06), final answer scaleIn, all buttons motion+tap. Toast feedback on every action.
- **`components/practice/QuestionPartCard.tsx`** — same pattern as PartPracticeCard. `checkAnswer` integrates `celebrateCorrect` + toast.success on verdict=correct, toast.info on partial, toast.error on wrong. Hint reveals call `sparkle()`. Final step calls `celebrateCompletion()`.

---

## Past bagruyot — populated with 2 real questions

**Path:** `content/past-bagruyot/`. Registry in `index.ts` imports per-session files and spreads into `ALL_PAST_BAGRUYOT`.

**Files:**
- `2020-summer-582.ts` — **2 questions populated:**
  - `b2020s582-q1` (גאומטריה אנליטית) — triangle OMG with height from M(2,6), 4 sub-parts including circle equation + cyclic quadrilateral
  - `b2020s582-q2` (וקטורים במרחב) — prism ABCA'B'C', 5 sub-parts including vector expression, scalar finding, plane equation, point K
- `2021-summer-582.ts` — **FULLY POPULATED, all 5 questions** (Q1 analytic-geometry, Q2 vectors, Q3 complex, Q4 exp/tanh, Q5 ln+integral), `solutionSource: 'authored'`, MOE-sourced. NOTE (2026-06-02): Q2–Q5 had been written but sat as an UNCOMMITTED local change (only Q1 was committed in f9905fa), so the live site showed only Q1. Committed + pushed in 369c6b6. Archive total is now 7 questions.

**Workflow confirmed:** User sends MOE-source bagrut PDF or screenshots of the **question only** (public domain). We transcribe question verbatim, write our **own** solution in app style using universal mathematical methods. **DO NOT** ingest publisher solution books (Yoel Geva, m-math, etc.) — even if user insists they're free.

### 🔑 STANDARD for EVERY new bagrut question (user explicitly requested 2026-06-02 — apply to ALL future bagruyot, don't ask):
1. **Every sub-part is its own answerable section.** If a part bundles "(1)... (2)... (3)..." in one prompt, SPLIT it into separate parts labeled **א1, א2, א3, ב1, ב2…** — each with its own `prompt`, `hints`, and `solution` (own answer box). Partition the bundled steps/final_answer/hints cleanly per sub-part. Don't leave "(1)(2)(3)" bundled in a single prompt.
2. **If the question has a graph/figure, render it visually.** Use the `diagrams?: DiagramSpec[]` field — at question level (`PastBagrutQuestion.diagrams`, shown under context) or part level (`PastBagrutPart.diagrams`, shown under that part's prompt). For function curves use the **`functionGraph`** DiagramSpec primitive (in `content/lessons/types.ts`, rendered by `FunctionGraphSVG` in `DiagramRenderer.tsx`): `{ type:'functionGraph', xRange, yRange?, curves:[{fn:(x)=>…, domain?, color?, dashed?}], hAsymptotes?, vAsymptotes?, markedPoints?:[{x,y,label}], caption }`. **⚠️ Embedding `fn:` closures is SAFE in `PastBagrutQuestion`** (the archive UI is `'use client'` — no server boundary). **NOT SAFE in `Lesson.concepts[].diagrams` or `SubTopic.diagrams`** — the lesson page (`app/practice/[subject]/[topic]/page.tsx`) is an async server component that calls `getLesson()` and passes the result to `<LessonView>` which is `'use client'`. JS functions can't cross that RSC boundary → 500 server error in production (learned the hard way 2026-06-07, see lessons_learned). For lesson-level graphs, either avoid `fn:` closures or use the `custom` raw-SVG escape hatch. For complex-plane / geometry figures use `custom` raw-SVG or the existing geometry primitives.
   **🔥 PLACEMENT RULE (user explicit 2026-06-04, fix commit pending):** Function graphs go **inside the specific sub-part** that asks for them — either the "סרטט סקיצה" part, or (if no sketch part) the most natural analytical sub-part where the picture culminates (extremum, asymptote, range bounds). **NEVER** put a function graph at question level "as context" — the user perceives it as "thrown without context above". Question-level `diagrams` is RESERVED for static geometric figures (triangle ABC with labeled D/E/F, two-circles-tangent setup, complex-plane configuration) that ALL sub-parts reference for orientation. If a sub-part says "ראה את הגרף שלמעלה" — that's the failure mode; fix by moving the diagram down.
3. **Label convention:** bare `א1` style (NOT `א(1)`). 2020 file still uses `ב(1)` — leave it, cosmetic only.
4. Reference implementation: `2021-summer-582.ts` (committed 1afcc62) — Q4 tanh `functionGraph`, Q5ג `x(ln x)²` graph, Q3 complex-roots custom SVG, splits across Q2/Q3/Q4/Q5.

### `/bagruyot` route split (this session)
- **`/bagruyot`** → landing page (visible to free users too) — hero, stats, 3 feature cards, sample preview, CTA. Emerald theme.
- **`/bagruyot/archive`** → list with filters + **interactive `PartPracticeCard`** per sub-part: textarea + "רמז" button (cycles hints[]) + "הצג פתרון" + animations + toasts.
- Type extension: `PastBagrutPart` now has optional `hints?: string[]` field (in `types.ts`).
- Home page (`/`) has dedicated emerald section ("חדש · ללא AI") promoting the archive.

### "שאלה חדשה" UX fix
In `StaticBagrutExerciseView.tsx` (the bagrut mode of /practice exercise), when only 1 bagrut question exists in topic, "שאלה חדשה" used to silently re-render. Now:
- Button label changes to **"אפס תרגיל"** with refresh icon (gray, not gradient)
- Toast info: "זו השאלה היחידה בנושא הזה — אפסנו את התרגיל. עוד בדרך."
- Helper line below explaining state

Topics with thin bagrut banks (≤2 questions): complex-numbers (now 4 after we added 3), vectors (1), analytic-geometry (2), probability (2), statistics (2). **Vectors and most others still need 2-3 more bagrut Qs each.**

---

## Practice content added this session

### Vectors (`math5/vectors.ts`)
Was 11 questions. Added 10 new (`vec-011` through `vec-020`) covering מיקוד gaps:
- vec-011: unit vector
- vec-012: $\vec{AB}$ between two points
- vec-013: find $k$ for perpendicular
- vec-014: find $k$ for parallel
- vec-015: distance point→plane (open)
- vec-016: symmetric→parametric form
- vec-017: projection of vector onto vector (open)
- vec-018: distance between parallel planes
- vec-019: foot of perpendicular from point to plane (open, hard)
- vec-020: volume of parallelepiped via scalar triple product (open, hard)

### Complex-numbers bagrut (`math5/complex-numbers.ts`)
Was 1 bagrut question. Added 3 new:
- `cx-bag-002` (mid) — $z^3 = -8$ roots, algebraic form, sum = 0 via Vieta
- `cx-bag-003` (mid) — $z^2 - 4z + 13 = 0$, |z|+arg, $z_1 z_2 = |z|^2$ via conjugate
- `cx-bag-004` (hard) — circle $|z-3|=3$ + ray $\arg(z) = \pi/4$ intersection → $z = 3+3i$

---

## Navbar adjustments (small but matter)

- **`/` (home navbar)** — removed the "כניסה לתרגול" → /quiz button. Two buttons remain: 🎯 תרגול מודרך → /practice, 💬 המורה הפרטי → /chat. **No "home" button** on the home page itself (was redundant).
- **`/my-plan` (TopBar)** — replaced "תרגול חופשי" → /practice with **🏠 דף הבית** → `/`. Reciprocal navigation between the two main screens.

---

## IP boundary — established firmly this session (multiple iterations)

User repeatedly asked to ingest external educational sources. **We held the line every time** — this is the canonical pattern now:

| Source | User wanted | We did |
|---|---|---|
| יואל גבע solution book photos | Read solution, rewrite in our style | Refused. Transcribed only the MOE question; wrote our own solution from scratch using universal math. |
| `פתרון-מלא-582-3.pdf` (publisher, 58 pages) | Extract everything, rewrite | Refused. Also pdftoppm wasn't available technically, but the principle stood. |
| **m-math.co.il** | Scrape + "make our version" | Refused (multiple iterations). User argued "they published free" → we explained free-to-read ≠ free-to-derive. Same with the firecrawl skill becoming available — does NOT change the copyright situation. |

**The only legitimate sources we work from:**
1. **MOE bagrut exam PDFs** (`meyda.education.gov.il`) — question text is public domain government work
2. **MOE syllabus document** ("תוכנית לימודים מתמטיקה 5 יחידות 807") — public domain
3. **Our own knowledge from training** — for authoring fresh practice problems matching universal curriculum

Math itself (formulas, theorems, methods) is uncopyrightable. Our originality is in: phrasings, numerical values, pedagogical sequencing, hint design, step-by-step explanations.

---

## Recent commits (newest first)

- `2988b14` — סדרות: 4 מודולי מסלול (חשבונית, הנדסית, סכום אינסופי, ריבית/נסיגה)
- `e6f1b43` — (user) הסרת באדג' 'מבוסס AI של Anthropic' מראש דף הבית
- `9f95853` — טריגונומטריה: 4 מודולי מסלול (זהויות, משוואות, ערכים מיוחדים, גזירה/אינטגרציה)
- `bca34c1` — אינטגרלים: 4 מודולי מסלול
- `9c5cbf9` — גזירה: 4 מודולי מסלול
- `1ea3187` — פונקציות: 4 מודולי מסלול
- `73a2167` — אלגברה: 4 מודולי מסלול
- `2001e18` — מספרים מרוכבים: 3 תתי-נושאים נוספים (complex-roots, complex-equations, gauss-loci)
- `0af820b` — מודולים בסגנון קורס: סרגל-התקדמות, צ'קלייסט והבא-בתור
- `2bf8cd0` — מודולי תת-נושאים: ארכיטקטורה + POC (polar-de-moivre)
- `c3f0827` — תיקון: 'שאלה חדשה' עם משוב ברור כשיש רק שאלה אחת
- `f21394e` — 3 שאלות בגרות חדשות במספרים מרוכבים
- `0e8a087` — 10 שאלות חדשות לוקטורים במרחב לפי המיקוד
- `9e9d363` — Polish גל 5: אנימציות + טוסטים + קונפטי במסך התרגול
- `f167d25` — Polish גל 4: אנימציות לדף הנחיתה /bagruyot
- `49ad497` — Polish גל 3: אנימציות /my-plan
- `371dab1` — Polish גל 2: אנימציות דף ראשי
- `32d1bf4` — Polish גל 1: Toaster + קונפטי במאגר בגרויות
- `4ecb109` — אנימציות עדינות לרמזים ולפתרון (PartPracticeCard)
- `bc1c706` — שאלון 582 קיץ 2020 שאלה 2 (וקטורים)
- `1c49711` — הסרת כפתור 'דף הבית' מהסרגל בדף ראשי
- `20c7f18` — my-plan: כפתור 'תרגול חופשי' → 'דף הבית'
- `9abe156` — Navbar: 'כניסה לתרגול' → 'דף הבית' (later reverted on `/`)
- `6284338` — דף ראשי: סקציה ייעודית למאגר בגרויות
- `b1774fb` — מאגר בגרויות: דף נחיתה + תרגול אינטראקטיבי
- `36f7b5e` — Past bagruyot: שאלון 582 קיץ 2020 שאלה 1

---

## Key Conventions (carried over, still apply)

1. **RTL/LTR critical fix (don't undo!)** — `dir="auto"` on `<p>`/`<li>` in `MathText.tsx` + `.chat-md p:has(> .katex:first-child) { direction: ltr }` CSS rule. KaTeX gets `direction: ltr !important; unicode-bidi: isolate !important`. Both layers needed.

2. **Lesson summaries** — `'**תווית עברית** $formula$ • כלל-אצבע'`. Tight bullets, 5-8 per lesson.

3. **Build cycle:** `cd /c/Users/1000m/bagrut-app && npm run build` then `git push origin main` → Vercel auto-deploys. Always build before push.

4. **Pro gating:** Use `requireProUser()` from `lib/ai-tutor.ts`. Returns `{ok:true,user}` or `{ok:false,response}` — first line of handler.

5. **No content fabrication in /bagruyot.** Real MOE questions only. Past bagruyot uses `solutionSource: 'authored'` when we wrote the solution (which is now always — we only transcribe MOE questions, never publisher solutions).

6. **Animation/toast patterns:** Import from `@/lib/animations` and `@/lib/confetti`. Use `motion.button` with `{...buttonTap}` for any interactive button. Use `AnimatePresence` + `motion.div` with `initial/animate/exit` for height-collapsing reveals (hints, solutions).

---

## Open / Next Session Candidates

**Highest priority — user explicitly asked:**

1. **🎯 Scale sub-topic modules to remaining math5 topics** — 6 done (complex-numbers, algebra, functions, derivatives, integrals, trigonometry). **Still TODO (9):** sequences, probability, statistics, exponential, exp-functions, ln-function, analytic-geometry, euclidean-geometry, vectors. Each topic needs 4 sub-topics in the same shape (id, title, emoji, tagline, summary 2-4 paragraphs, 3-5 keyPoints, 1-3 formulas reusing the file's existing latex, 4-6 questions). Verify all math by hand before writing.

2. **Boost thin bagrut banks** — vectors (1 → +3), analytic-geometry (2 → +3), probability (2 → +3), statistics (2 → +2 — though out-of-scope), sequences (3 → +2), exp-functions (3 → +2). Same pattern as the 3 complex-numbers bagruts we added.

3. ✅ **DONE — `2021-summer-582.ts` is fully populated** (all 5 questions, committed + pushed 369c6b6).

**Lower priority / candidates:**

4. **MathLive** (math input editor) — was discussed; user said no for now. Re-evaluate later.

5. **Polish leftover routes** — `/practice`, `/scan`, `/library`, `/chat`, `/formulas`, `/quiz` haven't been touched in this polish pass. They still work but feel old next to the polished ones.

6. **Loading skeletons** — replace Loader2 spinners with skeleton placeholders for perceived speed.

---

## Don't Forget

- **`2021-summer-582.ts` is fully populated (all 5 Qs) and live** as of 369c6b6. Earlier this file's Q2–Q5 sat uncommitted, which is why the live site once showed only Q1.
- **⚠️ Other UNCOMMITTED/UNTRACKED work still pending (2026-06-02):** `app/signup/page.tsx` is modified (uncommitted), and `app/privacy/` + `app/terms/` are UNTRACKED (never committed → not live). These need review + commit + push if the user wants them deployed.
- **User has been adamantly against publisher sources** (יואל גבע, m-math.co.il). Don't relitigate that boundary. If user pushes again, the canonical response: free-to-read ≠ free-to-derive, and only MOE sources + our own knowledge are valid.
- **User rejected 5 new question types** (drag-drop, fill-blank, match, spot-error, speed drill) when proposed. Don't re-propose. They want MORE of the existing types (MCQ + open).
- **Sub-topic id naming**: kebab-case, English/transliterated (`polar-de-moivre`, `complex-roots`). The display title is Hebrew.
- **Sub-topic emoji**: optional but enhances the navigation cards. Use one that represents the topic visually.
- **`lib/animations.ts`** is the source of truth for motion variants. Don't define new variants inline if a shared one fits.
- **Sonner toasts** should be short (`duration: 1500-3000ms`). Don't overuse `toast.error` — keep it for genuine errors, use `toast.info` for "neutral" notifications.
- **Confetti budget**: `celebrateCompletion()` is the big one — use only for "finished entire module" or "finished entire question". `celebrateCorrect()` for "answered correctly". `sparkle()` for "small win" (hint reveal). Don't fire confetti on every click.
- **Captions in DiagramRenderer use `<MathText inline>`** — LaTeX renders inside them. Was a real bug earlier; don't regress.
- **Anthropic budget:** Vercel Hobby $5/mo. Sonnet calls (solve-photo, similar-question) ~$0.01-0.05 each. Rate-limit and Pro-gate.
</content>
</invoke>