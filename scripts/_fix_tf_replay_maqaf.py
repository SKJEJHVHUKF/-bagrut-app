# -*- coding: utf-8 -*-
"""Literal-pair sweep for the maqaf-before-maths defect in the tf ghost replays.

A maqaf glued to a maths island renders as a minus sign in RTL, so `ל-$2\\sin x$`
reads as "minus 2 sin x". Written in Python, not bash: a heredoc collapses the
doubled backslashes and the needles stop matching the TypeScript source.

    python scripts/_fix_tf_replay_maqaf.py [--apply]
"""
import io
import re
import sys

PATH = 'content/ghost-replay/math5/trig-functions.ts'

# " כ-$" is always "approximately X" here; the particle is standalone, so the
# leading space keeps it from biting a word that merely ends in kaf.
REGEX_PAIRS = [(' כ-$', ' בקירוב $')]

PAIRS = [
    # gr-tf-eq-007
    ('מ-$\\\\sin A = \\\\sin B$', 'מהשוויון $\\\\sin A = \\\\sin B$'),
    ('$360°$ ו-$0°$', '$360°$ וגם $0°$'),
    # gr-tf-dom-008
    ('קרוב מאוד ל-$\\\\dfrac{\\\\pi}{2}$',
     'קרוב מאוד לזווית $\\\\dfrac{\\\\pi}{2}$'),
    ('ב-$\\\\dfrac{0}{0}$', 'בביטוי $\\\\dfrac{0}{0}$'),
    ('שווה ל-$\\\\dfrac{2\\\\sin x}{\\\\cos x}$',
     'שווה לביטוי $\\\\dfrac{2\\\\sin x}{\\\\cos x}$'),
    ('שווה ל-$2\\\\sin x$', 'שווה לביטוי $2\\\\sin x$'),
    ('מתקרב ל-$2$', 'מתקרב לערך $2$'),
    # gr-tf-der-008
    ('שווה בדיוק ל-$1$ בכל זווית',
     'שווה בדיוק לאחד בכל זווית'),
    ('קטן מ-$-1$', 'קטן מהערך $-1$'),
    # gr-tf-inv-007
    ('$\\\\dfrac{3\\\\pi}{2}$ — נקודות',
     '$\\\\dfrac{3\\\\pi}{2}$, ואלה נקודות'),
    ('נגזר ל-$2\\\\cos x$, ולא ל-$-2\\\\sin x$',
     'נגזר לביטוי $2\\\\cos x$, ולא לביטוי $-2\\\\sin x$'),
    ('קטן מ-$-\\\\dfrac12$', 'קטן מהערך $-\\\\dfrac12$'),
    ('מתחילה ב-$0$ ומסיימת ב-$2\\\\pi \\\\approx 6.28$',
     'מתחילה מהגובה $0$ ומסיימת בגובה $2\\\\pi \\\\approx 6.28$'),
    # gr-tf-int-009
    ('מ-$\\\\tan x = 1$', 'מהמשוואה $\\\\tan x = 1$'),
    ('$\\\\pi$, ו-$\\\\cos x$', '$\\\\pi$, וגם $\\\\cos x$'),
    ('= \\\\cos x$ ו-$\\\\left(\\\\cos x\\\\right)^\\\\prime',
     '= \\\\cos x$ וגם $\\\\left(\\\\cos x\\\\right)^\\\\prime'),
    ('$\\\\tan x = -1$ — זוויות',
     '$\\\\tan x = -1$, כלומר זוויות'),
    # gr-tf-bag-007
    ('נמוכה ב-$2.74$ מהשטח האמיתי',
     'נמוכה מהשטח האמיתי ב$2.74$'),
]

MAQAF = re.compile('[א-ת]-\\$')

src = io.open(PATH, encoding='utf-8').read()
before = len(MAQAF.findall(src))

for needle, sub in REGEX_PAIRS:
    src = src.split(needle)
    src = sub.join(src)

# Longest needle first: a short pair that is the tail of a longer one would
# consume it and leave the specific fix unmatched. split/join, never
# String.replace-style substitution — a replacement ending in a maths island
# would paste the file remainder back in.
for needle, sub in sorted(PAIRS, key=lambda p: -len(p[0])):
    n = src.count(needle)
    if n == 0:
        print('  (no match) ' + needle[:48])
    src = sub.join(src.split(needle))

after = len(MAQAF.findall(src))
print('%s: maqaf %d -> %d' % (PATH, before, after))

if '--apply' in sys.argv:
    io.open(PATH, 'w', encoding='utf-8').write(src)
    print('written.')
else:
    print('dry run - nothing written.')
