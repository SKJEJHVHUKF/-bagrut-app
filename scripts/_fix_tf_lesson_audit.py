# -*- coding: utf-8 -*-
"""Apply the adversarial audit's mechanical findings to the six tf-* lesson files.

A FILE and not `python -c`: Hebrew passed through a Git Bash command line
arrives mangled and every needle silently stops matching.

Each pair asserts an exact expected match count, so a needle that drifts fails
loudly instead of being skipped.
"""
import io
import sys

D = 'content/lessons/math5/trig-functions/'

# (file, needle, replacement, expected_count)
EDITS = [
    # --- 1. tf-dom-006: the note's count is wrong AND contradicts the note above
    #        it. On the CLOSED half-turn sin 2x vanishes three times, not twice.
    ('tf-domain.ts',
     "'שתיים היה נכון בתחום של חצי סיבוב בלבד.',",
     "'שתיים מתקבל בתחום החצי-פתוח $0 \\\\le x < \\\\pi$, שבו הקצה אינו נספר. כאן התחום סגור.',", 1),

    # --- 2. tf-der-008 option[2] was ALGEBRAICALLY IDENTICAL to the correct
    #        option — a student who differentiates right and does not simplify
    #        was graded wrong. Replaced with the dropped-sign slip, which really
    #        is a different value.
    ('tf-derivative.ts',
     "'$\\\\dfrac{\\\\cos x + \\\\cos^2 x + \\\\sin^2 x}{(1 + \\\\cos x)^2}$',",
     "'$\\\\dfrac{\\\\cos x + \\\\cos^2 x - \\\\sin^2 x}{(1 + \\\\cos x)^2}$',", 1),
    ('tf-derivative.ts',
     "'זהו שלב הביניים הנכון, אבל הוא אינו מפושט. שני האיברים בריבוע מתקצרים, ואז השבר כולו מצטמצם.',",
     "'נספר מינוס אחד במקום שניים: נגזרת המכנה היא $-\\\\sin x$, והנוסחה מחסירה אותה, ולכן שני המינוסים נותנים פלוס. עם מינוס הביטוי אינו מתפשט כלל.',", 1),

    # --- 3. tf-dom-007: the format example was a DECIMAL, but pi/6 as a multiple
    #        of pi is 0.1666..., so a student following the instruction is
    #        graded wrong. Every other set question in the track uses a fraction.
    ('tf-domain.ts',
     'למשל $0.5$ עבור $\\\\dfrac{\\\\pi}{2}$',
     'למשל $1/2$ עבור $\\\\dfrac{\\\\pi}{2}$', 1),
    ('tf-domain.ts', "value: '0.5,1.5',", "value: '1/2,3/2',", 1),

    # --- 4. tf-bag-007 printed 9.02 twice and then rejected it: `expected` is
    #        the exact surd. Same wording tf-int-009 already uses.
    ('tf-bagrut.ts',
     'חשב עכשיו את השטח הכלוא בין הגרף לבין ציר ה-x בתחום כולו.',
     'חשב עכשיו את השטח הכלוא בין הגרף לבין ציר $x$ בתחום כולו. רשום תשובה מדויקת.', 1),

    # --- 5. tf-inv-004 rejected the EXACT answer with no explanation.
    ('tf-investigation.ts',
     "{ value: '2', note: 'הסינוס והקוסינוס אינם מגיעים לשיא שלהם באותה זווית, ולכן הסכום אינו מגיע לשניים.' },",
     "{ value: '2', note: 'הסינוס והקוסינוס אינם מגיעים לשיא שלהם באותה זווית, ולכן הסכום אינו מגיע לשניים.' },\n        { value: 'sqrt(2)', note: 'זו התשובה המדויקת והיא נכונה מתמטית. השאלה ביקשה מספר מעוגל לשתי ספרות אחרי הנקודה: $1.41$.' },", 1),

    # --- 14. hints that selected the answer instead of pointing at it.
    ('tf-derivative.ts',
     "hint: 'הנגזרת הפנימית עולה למונה, והשורש המקורי נשאר במכנה כפול שתיים.',",
     "hint: 'זו פונקציה מורכבת: שורש עם ביטוי טריגונומטרי בפנים. השתמש בנוסחת נגזרת השורש.',", 2),
    ('tf-integral.ts',
     "hint: 'הורד חזקה, ואז שים לב שיש שתי חלוקות: אחת מהזהות ואחת מהמקדם הפנימי.',",
     "hint: 'ריבוע טריגונומטרי אינו ניתן לאינטגרציה ישירה. הורד חזקה קודם, ואז אנטגרל איבר איבר.',", 1),
    ('tf-domain.ts',
     "hint: 'מאפסים את המכנה, ואז בודקים את המונה באותן נקודות. שתי הזוויות מתקבלות מפתרון $\\\\sin x = \\\\dfrac12$.',",
     "hint: 'מאפסים את המכנה, ואז בודקים את המונה באותן נקודות. אסימפטוטה מתקבלת רק כאשר המונה שם אינו מתאפס.',", 1),

    # --- 15. tf-bag-003 is a full split-area computation; its easy siblings are
    #         single-step. Relabelled, and a genuinely easy question added below.
    ("tf-bagrut.ts",
     "      id: 'tf-bag-003',\n      difficulty: 'easy',",
     "      id: 'tf-bag-003',\n      difficulty: 'mid',", 1),

    # --- 17. the `expected` on an MCQ never grades anything (QuestionRunnerCard
    #         gates on kind === 'open'). Kept anyway, because it is what
    #         verify-trig-functions grades the AUTHORED answer against — but the
    #         reason now sits in the file instead of looking like a mistake.
    ('tf-bagrut.ts',
     "      hint: 'הפונקציה מתאפסת בזווית $\\\\dfrac{\\\\pi}{2}$. מה קורה לסימן שם?',\n      expected: { kind: 'value', value: '2' },",
     "      hint: 'הפונקציה מתאפסת בזווית $\\\\dfrac{\\\\pi}{2}$. מה קורה לסימן שם?',\n      // An MCQ grades by option index, so this never reaches the grader. It is\n      // here as the machine-readable form of the answer, which\n      // scripts/verify-trig-functions.ts checks against its own computation.\n      expected: { kind: 'value', value: '2' },", 1),

    # --- 18. a dangling claim: the worked list above it never reaches 360, and
    #         nothing in the file turns on three-versus-four.
    ('tf-equations.ts',
     'תחום $[0°, 360°)$ פתוח בקצה',
     'תחום $[0°, 360°)$ סגור משמאל ופתוח מימין', 1),

    # --- 19. the finalAnswer justified the answer differently from the option it
    #         grades, so a correct student read two different reasons.
    ('tf-investigation.ts',
     "finalAnswer: 'זוגית, כי המינוס נעלם בהעלאה בריבוע',",
     "finalAnswer: 'זוגית, כי היא מכפלה של שתי פונקציות אי-זוגיות והמינוס נעלם בהעלאה בריבוע',", 1),
]

# --- 16. `ציר ה-x` is a Hebrew letter glued to a bare Latin token, and the repo
#         convention is `ציר $x$` — 659 occurrences across 19 files, and
#         tf-bagrut.ts was the only file in the track using the hyphen form.
GLOBAL = [
    ('tf-bagrut.ts', 'ציר ה-x', 'ציר $x$'),
    ('tf-bagrut.ts', 'ציר ה-y', 'ציר $y$'),
    ('tf-bagrut.ts', 'שיעורי ה-x', 'שיעורי $x$'),
    ('tf-bagrut.ts', 'שיעור ה-x', 'שיעור $x$'),
]

cache = {}


def load(name):
    if name not in cache:
        cache[name] = io.open(D + name, encoding='utf-8').read()
    return cache[name]


bad = 0
for name, needle, sub, want in EDITS:
    src = load(name)
    n = src.count(needle)
    if n != want:
        print('  MISS %s: expected %d, found %d — %s' % (name, want, n, needle[:60]))
        bad += 1
        continue
    cache[name] = sub.join(src.split(needle))

for name, needle, sub in GLOBAL:
    src = load(name)
    n = src.count(needle)
    print('  %s: %s x%d' % (name, needle, n))
    cache[name] = sub.join(src.split(needle))

if bad:
    print('%d needle(s) did not match — nothing written.' % bad)
    sys.exit(1)

for name, src in cache.items():
    io.open(D + name, 'w', encoding='utf-8').write(src)
print('applied %d targeted edits + %d global replacements' % (len(EDITS), len(GLOBAL)))
