# Adversarial verification — הסתברות answer bank

You are NOT the author. Your job is to find what is WRONG in a slice that has
already passed every automated gate, and the gates are why you exist: on the
last topic banked this way, the verifiers found **107 real defects the gates
cannot see** — wrong values, and shared entries that were true of their own
unit and false of the siblings they get served to.

**A green gate is the starting point of your work, not evidence against you.**
`test-tutor-faq` measures whether an entry can be FOUND. It never reads the
answer. An entry can score 100% recall and teach something false.

Read the authored slice `<work>/out/faq-NN.json` against its source
`<work>/slice-NN.json`, and report defects. Do not rewrite the file — report,
with entry id and the exact fix.

## What to hunt, in order of damage

1. **A number that is wrong.** Re-derive every value an answer states from the
   unit's own `steps`. Do not trust the step's prose over its arithmetic, and
   do not trust the author's answer over either.
2. **A shared entry that is false next door.** `concept`, `mistake` and `check`
   entries are served to SIBLING units in the same sub-topic. Read each one and
   ask: is this true of every question in this sub-topic, or only of this one?
   The last round found a `mistake` entry warning "there is no hole here" on
   three units that DO have one — and one entry served on the very question
   that exists to teach its opposite.
3. **An answer that contradicts another entry in its own unit.** Two entries,
   both confident, disagreeing. Found twice last round.
4. **A dropped hedge.** If the source step says "עשוי" / "ייתכן" and the answer
   states it flat, the answer is now a false claim.
5. **An answer that does not answer the `q`.** It is on-topic, it is true, and
   it addresses a different question. This is the failure the owner reported
   twice and the one he cares about most.
6. **A stall.** Any answer whose content is "read it again", "write it down and
   tell me" — with nothing the student did not already have. There should be
   none; report any you find as a defect, not a style note.
7. **A leak.** An answer that states the unit's final answer without
   `"reveals": true`.

## What NOT to spend time on

Recall, noise, subset pairing, `far-unit`, token mechanics. Those are measured
and they are the author's problem, not yours. You are the only reader who will
ever check whether the mathematics and the pedagogy are right.

## Report format

For each defect: `unit#n · what is wrong · the corrected text`. End with a
count and an explicit verdict: how many entries you actually read, and whether
you would serve this slice to a student.

If you find nothing in a slice, say so plainly — but say how many entries you
read, because "no defects" from a partial read is the one answer that is worse
than useless.
