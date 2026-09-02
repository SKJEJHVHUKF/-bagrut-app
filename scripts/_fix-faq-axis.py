# -*- coding: utf-8 -*-
"""`ציר ה-x` -> `ציר $x$` in the authored FAQ answers.

The lesson files use `ציר $x$` (the repo convention — 659 occurrences across 19
files); the hyphen form glues a Hebrew letter onto a bare Latin token and reads
badly in RTL. The merge gate does not catch it: its maqaf rule only fires on a
maqaf immediately before `$`.

Only the ANSWER is rendered to a student. `q` and `alts` are matching keys, so
they are left alone — rewriting them would change the index for no visible gain
and could move a token."""
import io
import json
import glob

PAIRS = [
    ('ציר ה-x', 'ציר $x$'),
    ('ציר ה-y', 'ציר $y$'),
    ('שיעורי ה-x', 'שיעורי $x$'),
    ('שיעור ה-x', 'שיעור $x$'),
]

total = 0
for path in sorted(glob.glob('.faq-tf/out/faq-*.json')):
    rows = json.load(io.open(path, encoding='utf-8'))
    n = 0
    for r in rows:
        for f in r['faqs']:
            for a, b in PAIRS:
                if a in f['a']:
                    n += f['a'].count(a)
                    f['a'] = b.join(f['a'].split(a))
    if n:
        io.open(path, 'w', encoding='utf-8').write(
            json.dumps(rows, ensure_ascii=False, indent=1))
        print('%s: %d fixed' % (path, n))
    total += n
print('total %d' % total)
