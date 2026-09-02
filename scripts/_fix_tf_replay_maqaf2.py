# -*- coding: utf-8 -*-
"""The three maqafs the first sweep did not have pairs for. Same reason it is a
FILE and not `python -c`: Hebrew passed through a Git Bash command line arrives
mangled, and the needles silently stop matching."""
import io
import re

PATH = 'content/ghost-replay/math5/trig-functions.ts'

PAIRS = [
    ('וממילא ל-$2\\\\sin x$ אין אסימפטוטה',
     'וממילא לפונקציה $2\\\\sin x$ אין אסימפטוטה'),
    ('מאשרים: מ-$3.83$ במקסימום המקומי ל-$2.46$ במינימום המקומי',
     'מאשרים: הערך יורד מ$3.83$ במקסימום המקומי אל $2.46$ במינימום המקומי'),
]

src = io.open(PATH, encoding='utf-8').read()
for needle, sub in PAIRS:
    assert src.count(needle) == 1, (needle, src.count(needle))
    src = sub.join(src.split(needle))
io.open(PATH, 'w', encoding='utf-8').write(src)
print('maqaf left:', len(re.findall('[א-ת]-\\$', src)))
