# -*- coding: utf-8 -*-
"""Author the FAQ entries for tf-bag-010, which was added AFTER the slices were
cut (it replaced tf-bag-003 in the easy rung once the audit showed that question
was a full split-area computation).

Six unit-specific entries are written here; the four shared entries are COPIED
verbatim from tf-bag-001 so this unit is not the odd one out of its sub-topic
group — the slice's author deliberately made them word-identical across all nine
siblings.

Matcher rules this file obeys (verified in lib/tutor-faq.ts):
  * held-out positions are alts[1] and alts[4], so alts[1] is a strict word
    subset of alts[0] and alts[4] of alts[3];
  * digits tokenise to NOTHING, so every number is a Hebrew word;
  * `שורה`/`צעד`/`שלב` in an alt triggers stepReference and kills the entry;
  * `נגזרת` and the `חיבור` family beside `איך` are measured noise magnets.
Anchors are picked from what only this unit does — מקדם · תוספת · טווח · גובה —
none of which its siblings spend.
"""
import io
import json

UNIQUE = [
    {
        "id": "tf-bag-010#1",
        "kind": "why-step",
        "step": 1,
        "q": "למה אפשר למצוא את הערכים בלי לגזור",
        "alts": [
            "למה לא צריך לגזור כדי למצוא את הערך הגדול ביותר כאן",
            "למה לא צריך לגזור כאן",
            "איך מוצאים את הקיצון בלי גזירה",
            "מה מאפשר לקרוא את הערכים ישר מהמקדם",
            "מה מאפשר לקרוא ישר מהמקדם",
        ],
        "a": "הסינוס חסום: הוא נע בין מינוס אחד לבין אחד ולא חורג משם לעולם. לכן בפונקציה מהצורה $a\\sin x + b$ הערכים הקיצוניים מתקבלים בדיוק בזוויות שבהן הסינוס עצמו קיצוני, ואין צורך בגזירה כלל. רשום את שני הערכים הקיצוניים של הסינוס והפעל עליהם את המקדם.",
    },
    {
        "id": "tf-bag-010#2",
        "kind": "where-from",
        "step": 1,
        "q": "מאיפה הגיע הערך הגדול ביותר אם לא פתרתי משוואה",
        "alts": [
            "מאיפה מגיע הערך הגדול ביותר בלי משוואה",
            "מאיפה מגיע הערך הגדול ביותר",
            "איך יודעים לאן הסינוס מגיע לכל היותר",
            "מה קובע את הגובה המרבי של הגרף",
            "מה קובע את הגובה המרבי",
        ],
        "a": "המקדם שמכפיל את הסינוס מותח את הטווח שלו, והתוספת מזיזה את התוצאה כלפי מעלה. הגובה המרבי מתקבל כאשר הסינוס שווה אחד, ואז מציבים אותו בביטוי ומחשבים. הצב את הערך המרבי של הסינוס בפונקציה וראה מה יוצא.",
    },
    {
        "id": "tf-bag-010#3",
        "kind": "why-step",
        "step": 2,
        "q": "למה התוספת מזיזה גם את המינימום",
        "alts": [
            "למה התוספת משנה גם את הערך הקטן ביותר",
            "למה התוספת משנה גם את הערך הקטן",
            "איך התוספת פועלת על שני הקצוות יחד",
            "מה עושה התוספת לגרף כולו, לא רק לפסגה",
            "מה עושה התוספת לגרף כולו",
        ],
        "a": "תוספת קבועה מוסיפה את אותו מספר לכל ערך של הפונקציה, ולכן היא מרימה את הגרף כולו באותו גובה. הפסגה והשקע עולים יחד, והמרחק ביניהם נשמר. הצב גם את הערך המזערי של הסינוס וראה שהתוספת מופיעה גם שם.",
    },
    {
        "id": "tf-bag-010#4",
        "kind": "why-not",
        "step": 2,
        "q": "למה הערכים אינם אחד ומינוס אחד",
        "alts": [
            "למה לא מקבלים אחד ומינוס אחד כמו בסינוס עצמו",
            "למה לא מקבלים אחד ומינוס אחד",
            "למה הטווח של הסינוס עצמו אינו הטווח של הפונקציה",
            "מה משנה את הטווח ביחס לסינוס הרגיל",
            "מה משנה את הטווח",
        ],
        "a": "אחד ומינוס אחד הם הערכים של הסינוס לבדו, לפני שהמקדם והתוספת פועלים עליו. המקדם מותח את המרחק בין הפסגה לשקע, והתוספת מזיזה את שניהם. הפעל את שתי הפעולות על כל אחד משני הערכים בנפרד.",
    },
    {
        "id": "tf-bag-010#5",
        "kind": "what-if",
        "q": "מה היה קורה אם המקדם היה שלילי",
        "alts": [
            "מה משתנה אם המקדם לפני הסינוס שלילי",
            "מה משתנה אם המקדם שלילי",
            "האם מקדם שלילי מחליף בין הפסגה לשקע",
            "איך מקדם שלילי משפיע על הגובה המרבי והמזערי",
            "איך מקדם שלילי משפיע",
        ],
        "a": "מקדם שלילי הופך את הגרף סביב הישר האופקי, ולכן הזווית שנתנה קודם את הפסגה נותנת עכשיו את השקע. הגדלים נשמרים והתפקידים מתחלפים. הצב את שני הערכים הקיצוניים של הסינוס שוב, וראה איזה מהם נותן כעת את הגובה המרבי.",
    },
    {
        "id": "tf-bag-010#6",
        "kind": "where-from",
        "step": 3,
        "q": "מאיפה יודעים שהגרף בכלל יורד מתחת לציר",
        "alts": [
            "איך רואים מהטווח שהגרף חוצה את הציר",
            "איך רואים מהטווח שהגרף חוצה",
            "מה מלמד הערך הקטן ביותר על מיקום הגרף",
            "למה הגובה המזערי מסגיר שיהיה פיצול",
            "למה הגובה המזערי מסגיר",
        ],
        "a": "אם הגובה המזערי שלילי והגובה המרבי חיובי, הגרף חייב לעבור דרך הציר בדרך ביניהם. זה מה שמראה מראש שחישוב שטח על התחום הזה יתפצל, עוד לפני שמחפשים איפה בדיוק. השווה את סימני שני הערכים הקיצוניים שקיבלת.",
    },
]

src = json.load(io.open('.faq-tf/out/faq-04.json', encoding='utf-8'))
donor = [r for r in src if r['unit'] == 'tf-bag-001'][0]['faqs']
# The four entries the slice made word-identical across the whole sub-topic.
shared = [f for f in donor if f['kind'] in ('concept', 'check', 'mistake')]
STEPS = 4  # tf-bag-010's solution has four steps, indices 0..3
faqs = list(UNIQUE)
for i, f in enumerate(shared):
    g = dict(f)
    g['id'] = 'tf-bag-010#%d' % (len(UNIQUE) + i + 1)
    # A copied step index can point past the end of a shorter solution; the
    # merge range-checks it, and a shared entry is about the method anyway.
    if g.get('step') is not None and g['step'] >= STEPS:
        g.pop('step')
    faqs.append(g)

out = [{"unit": "tf-bag-010", "faqs": faqs}]
io.open('.faq-tf/out/faq-05.json', 'w', encoding='utf-8').write(
    json.dumps(out, ensure_ascii=False, indent=1)
)
print('wrote .faq-tf/out/faq-05.json — %d entries (%d authored + %d shared)'
      % (len(faqs), len(UNIQUE), len(shared)))
