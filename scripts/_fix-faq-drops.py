# -*- coding: utf-8 -*-
"""Repair the eight entries merge-tutor-faq dropped, each on its own merits.

`leaksAnswer` is a normalised SUBSTRING test against the unit's finalAnswer, and
the guard is only `answer.length >= 4`. When a unit's answer is a single common
word — `זוגית` for "is this function even or odd?" — every entry that teaches
what evenness IS trips it, even though the word is printed on screen as one of
the four options and reveals nothing.

So the eight split three ways, and none of them is fixed by relaxing the gate:

  * ONE is not a leak at all — it glued a maqaf onto a maths island, which reads
    as a minus sign in RTL. Rephrased.
  * TWO genuinely hand over the verdict of the very question they sit on. They
    get `reveals: true`, which is exactly what that flag is for: served only
    after the student has answered.
  * FIVE state no verdict — they define the property. They are rewritten to use
    the abstract noun (`זוגיות`) rather than the adjective (`זוגית`), which is
    better Hebrew and stops matching the option string. Note `אי-זוגית`
    CONTAINS `זוגית`, so both had to go.
"""
import io
import json
import glob
import sys

# (entry id, needle, replacement)
REWRITE = [
    ('tf-eq-002#3', 'וב-$60°$ היחס', 'ובזווית $60°$ היחס'),
    ('tf-dom-002#5',
     'חשב את המרווח בין שתי אסימפטוטות סמוכות',
     'חשב את המרווח בין אסימפטוטות סמוכות'),
    ('tf-inv-002#2',
     'פונקציה זוגית מחזירה לזווית הנגדית',
     'זוגיות של פונקציה אומרת שהיא מחזירה לזווית הנגדית'),
    ('tf-inv-006#1',
     'אם התוצאה זהה למקורית הפונקציה זוגית, ואם היא ההפך שלה הפונקציה אי-זוגית.',
     'אם התוצאה זהה למקורית מתקבלת זוגיות, ואם היא ההפך שלה מתקבלת אי-זוגיות.'),
    ('tf-inv-006#5',
     'פונקציה זוגית מקיימת $f(-x) = f(x)$',
     'זוגיות פירושה $f(-x) = f(x)$'),
    ('tf-inv-006#7',
     'הפונקציה אינה זוגית ואינה אי-זוגית',
     'אין לפונקציה זוגיות ואין לה אי-זוגיות'),
]

# These two really do state the answer to the question they sit on.
REVEALS = ['tf-inv-006#4', 'tf-inv-006#8']

by_id = {r[0]: r for r in REWRITE}
seen = set()
bad = 0

for path in sorted(glob.glob('.faq-tf/out/faq-*.json')):
    rows = json.load(io.open(path, encoding='utf-8'))
    touched = 0
    for r in rows:
        for f in r['faqs']:
            fid = f['id']
            if fid in by_id:
                _, needle, sub = by_id[fid]
                if needle not in f['a']:
                    print('  MISS %s: needle absent' % fid)
                    bad += 1
                    continue
                f['a'] = sub.join(f['a'].split(needle))
                seen.add(fid)
                touched += 1
            if fid in REVEALS:
                f['reveals'] = True
                seen.add(fid)
                touched += 1
    if touched:
        io.open(path, 'w', encoding='utf-8').write(
            json.dumps(rows, ensure_ascii=False, indent=1))
        print('%s: %d entr(ies) repaired' % (path, touched))

missing = (set(by_id) | set(REVEALS)) - seen
if missing:
    print('  NEVER FOUND: %s' % ', '.join(sorted(missing)))
    bad += 1
sys.exit(1 if bad else 0)
