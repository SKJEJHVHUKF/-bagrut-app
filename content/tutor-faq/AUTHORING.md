# Authoring a MathUp tutor answer bank

You are writing the answers a private tutor gives when a student, stuck on ONE
exercise, types a question about it. Every answer you write is served at $0
instead of a model call, so it has to be right, specific, and in the student's
register.

> ⚠️ **THIS FILE IS THE STANDING BRIEF, AND IT IS NOT OPTIONAL.**
>
> Itay adds practice questions to the ladder continuously. **A question with no
> bank entry has no tutor** — the chain falls through to the compiler or to a
> paid model call, which is the state that produced his complaint that the tutor
> "doesn't answer what I asked". So: **whenever practice questions are added to
> any topic, banking their tutor answers is part of that work, not a follow-up.**
> Nobody should have to ask for it.
>
> Every numbered trap below was paid for in a real round. They are not style
> preferences; each one is a rule the matcher enforces silently, and breaking it
> produces an entry that is well-formed, passes every gate, and can never fire.

## The runbook — banking a topic, or the questions just added to one

```bash
# 0. which questions have no bank at all
npm run report:accuracy          # the coverage map is printed under the table

# 1. hand out only the UNBANKED units (the skip is real; --all overrides it)
npx tsx scripts/audit-tutor-faq.ts <topic> <work> 15

# 2. ⚠️ RE-EMIT THE EXISTING BANK FIRST — merge OVERWRITES, it does not merge.
#    Without this, every unit banked in an earlier round is silently deleted
#    and the gate still prints "kept N/N, 0 drops".
npx tsx scripts/_dump-faq-as-slice.ts <topic> <work>/out/faq-00-existing.json

# 3. one agent per slice, each reading THIS file, each exiting on its own gate:
#    npx tsx scripts/test-tutor-faq.ts <work>/out/faq-NN.json   (recall ≥85%, noise ≤2%)

# 4. adversarial verification — see VERIFYING.md. NOT optional: on the last
#    round the gates were 100% green on every slice and the verifiers still
#    found 43 real defects, including answers that tell a correct student he
#    is wrong. The gates never read an answer.

# 5. merge, then rebuild what is derived FROM the bank
npx tsx scripts/_faq-preflight.ts <work>/out
npx tsx scripts/merge-tutor-faq.ts --rows <work>/rows-<topic>.json --in <work>/out \
  --out content/tutor-faq/math5/<topic>.ts
npx tsx scripts/build-lexicon.ts     # lib/generated/hebrew-lexicon.ts
npm run build:shape                  # lib/generated/question-shape.ts

# 6. measure the whole app, not the slice
npm run test:faq                     # recall / noise / unsafe / fires
npm run report:accuracy              # right / wrong / stall / model, per shape

# 7. fetch + rebase → npm run check → push. IN THAT ORDER.
```

⚠️ **A per-slice gate cannot see a cross-slice collision.** All eleven slices of
הסתברות were green individually, and the merged bank still had a new entry
stealing a phrasing an older one owned — three good entries, one query, nothing
served. Only `npm run check` on the merged tree caught it. Always re-measure
after the merge.

Read your slice: `<work>/slice-NN.json` — an array of units. Write exactly one
file: `<work>/out/faq-NN.json`.

## Output shape

```json
[{ "unit": "pr-x-bas-101", "faqs": [ …entries… ] }]
```

Each entry:

```json
{
  "id": "pr-x-bas-101#1",
  "kind": "why-step",
  "step": 2,
  "q": "למה מחלקים ב-20?",
  "alts": ["…", "…", "…", "…", "…", "…", "…", "…", "…"],
  "a": "…"
}
```

- 8–10 entries per unit. `id` is ALWAYS `${unit}#${n}`, n from 1. **An entry
  with no `id` makes the gate compare `undefined === undefined` and report a
  fake 100% recall** — every id is mandatory.
- `kind` ∈ `why-step` · `where-from` · `why-not` · `what-if` · `concept` ·
  `mistake` · `check`. Cover a spread; do not write eight `why-step`s.
- `step` only when the entry is about ONE step: the 0-based index into that
  unit's `steps`. **Check the slice — where a solution opens with `**הכלל:**`
  that line is step 0, and where it does not, there is no rule line and index 0
  is a real move.**
- `a` is 40–700 chars, opens with a Hebrew word (never `$`, never a latin
  letter), 1–4 sentences, and **ends with one next move** the student can do.

## What the answer must DO

From the project's pedagogy standard: **teach, do not summarise.** Say WHY
before HOW. Name the trigger in the question's own wording that makes this rule
the right one. Where students fall, say so ("הטעות הנפוצה כאן:"). Never write a
sentence that only says "read it again" — that is a stall and it is the exact
failure this whole bank exists to remove.

## 🔴 The traps — every one of these has already cost a round

**Matching mechanics** (the matcher tokenises Hebrew; these decide whether your
entry is ever FOUND):

1. **NEVER repeat `q` as an alt — and `norm()` strips punctuation and spacing,
   so `alts[0]` must not be `q` minus its question mark either.** The merge
   seeds its duplicate set with `norm(q)`. One batch lost 345 of 1,018 entries
   to this. **The pilot for THIS topic wrote 88 of 120 entries that way** — the
   natural move is to make `alts[0]` the canonical phrasing, which is exactly
   `q` without the `?`. **And the recall/noise gate cannot see it**: the broken
   file still reported 98.3% recall and 0 collisions. Only the merge sees it.
   The cheap fix: **`q` is itself indexed as a phrasing**, so a held alt only
   has to be a token subset of `q` *or* of any kept alt — you can rewrite every
   `alts[0]` without touching a single held alt.
2. **The gate holds out `alts[1]` and `alts[4]`** and fires them blind. Pair
   them: make `alts[1]` a strict token subset of `alts[0]` (or of `q`), and
   `alts[4]` of `alts[3]`. Highest-leverage thing you can do.
   **A held alt needs at least TWO content groups, one of which no sibling
   entry in the same unit uses.** Every pilot recall miss was a tie from a held
   alt with only two groups like `["למה","כפל"]` — it scored 1.00 against its
   own entry and 1.00 against a sibling, and a tie serves nothing.
   🔑 **`כאן` is free, and it is the cheapest safety you have.** It is a STOP
   word, so it contributes no token and CANNOT break the subset rule — but it
   trips `pointsAtThisExercise`, the screen that blocks unsafe cross-question
   transfer. Appending ` כאן` to every held alt of a `why-step`/`where-from`/
   `why-not`/`what-if` entry that contains no digit took the pilot's unsafe
   transfer from **4.0% to 0.0%** with zero effect on recall.
   🔴 **NEVER on `concept` / `mistake` / `check`.** Those kinds exist to be
   served to SIBLING units, and `pointsAtThisExercise` is exactly the screen
   that stops that — so `כאן` there does not protect the entry, it disables it.
   The same is true of any DIGIT in a shared-kind alt or answer.
   ⚠️ **And that screen is WIDER than "a digit or כאן".** It also trips on
   `פה` · `הזה` · `הזאת` · `הזו` · `בשורה` · `בשלב` · `למעלה` · `למטה` ·
   `שלך` · `שכתבת` · `שעשית` · `שחילקת` · `שהצבת`. `הזה` is the natural
   Hebrew demonstrative, and ONE of them inside a shared-kind held alt kills
   that entry's transfer silently — invisible in recall and in noise.
   🔑 **The transfer pool is matched by UNIT-ID PREFIX, not by `subId`.**
   A theme pair split across two sub-topics fires 0%. Pair inside the prefix
   group (`prob-bag-x-ber-*` with `prob-bag-x-ber-*`).
3. **Morphology does NOT bridge families.** `גזירה`↔`לגזור`, `הצבת`↔`הצבה`,
   `כופלים`↔`מכפילים` share no token. A held-out alt must reuse its partner's
   EXACT inflected form; vary the frame words and the order only.
   Measured on this topic, each of these cost a round: `לפסול`↔`פוסלים` ·
   `לספור`↔`סופרים` · `להסתכם`↔`מסתכמות` · `אינו`↔`אינה` · `ריקה`↔`ריקות` ·
   `קובע`↔`לקבוע` (the `ל` strips to `קבוע`, but `קובע` is four letters so `stems()` never runs on it — no shared variant at all, and that pair was one slice's ENTIRE recall gap) · `משנה`↔`משתנה` (the last is the worst — `משתנה` is a FRAME word capped at
   0.8 and `משנה` is not, so they behave differently as well as not matching).
3b. **FRAME words look like anchors and are capped at 0.8:** the question
   words, plus `עושים`/`מחשבים`/`יודעים`/`משמעות` — and
   `יוצא`/`יצא`/`יוצאים` — and, in the same synonym row and just as
   invisible, **`מגיע`/`הגיע`/`בא`** — all of which are synonyms of `מאיפה`
   and cap at 0.8 while reading to an author like strong content words. "הענפים
   היוצאים מנקודה אחת" reads as a strong anchor and contributes almost
   nothing; write `שמתפצלים`.

4. **`$…$` is stripped and tokens under 2 chars are dropped.** A formula, a
   single letter, a vertex name contribute NOTHING to matching. Never write `°`.
5. **Numbers:** a digit survives as a value token.
   🔴 **A MINUS SIGN IS STRIPPED AS PUNCTUATION, so `-3` and `3` are the SAME
   token.** On a topic that talks about roots and domains this bites constantly:
   one unit owning `3`, `−3` and `2` cannot separate "the negative root" from
   "the positive root" by the number alone, and trap #10's anchor rule is
   sign-blind. Distinguish them with a word, not a sign. Ten and under, either
   spelling works (`בשלוש` and `3` are the same token). **Above ten use the
   DIGIT** — a compound Hebrew number ("חמישה עשר") becomes `num:5`+`num:10`,
   which is NOT `num:15`, and actively breaks the match.
6. **Words that VANISH** (they stem onto a stop word): `תשובה` · `התשובה` ·
   `האפשרות` · `אפשרות` · `שאלה` · `בשאלה` · `הזהות` · `מחייב` · `בלי` · `מכל`. Do not lean an alt on them.
   But `פתרון` and `תוצאה` are FINE — they canonicalise onto the token `תשובה`
   and survive; it is only the literal word `תשובה` that disappears.
   ⚠️ **The fraction words are NUMBERS:** `שליש`→`num:0.3333`,
   `רבע`→`num:0.25`, `חמישית`→`num:0.2`. On this topic those are real owned
   values, so "בחזקה חמישית" collides with whichever entry owns `0.2`. Write
   "בחזקת 5".
7. **`שורה` / `צעד` / `שלב` inside an alt** triggers the step-reference path and
   filters the candidate pool — the entry then never fires. Keep them out of
   alts. `שורה` / `שורות` / `בשורה` ALSO canonicalise to `צעד`, so on a
   two-way-table unit, where a student really does need to say "row", use the
   construct form **`שורת`** (`שורת הערב`) — it is in neither the table nor the
   regex, while `השורה` is in both.
8. **Never phrase an alt as one of the six generic asks** — `לא הבנתי`,
   `תסביר`, `רמז`, `מה הטעות שלי`, `מה התשובה`, `מאיפה מתחילים`. A router
   upstream intercepts those, so such an alt is dead weight.
9. **Banned in alts (measured noise):** `מחשבון`, `בגרות`, `להשתמש` (and
   `חשבון` as a substring), `נגזרת`, `כותבים`, `הבדל`, `ציון`, `זמן`,
   ⚠️ **`נגזרת` is banned and some topics are ABOUT it.** On פונקציות three
   units per slice are derivative-based. Verified substitutes that share no
   token with `נגזרת` (whose variants are `נגזרת · גזרת · נגזר · גזר`):
   **`גזירה`** · **`לגזור`** · **`גוזרים`** · **`כלל המנה`**. They do not match
   each other either, so a held alt must reuse its partner's exact form.
   ⚠️ **`נוסחה` is banned too, and every solution on this topic opens with
   `**הנוסחה:**`.** Keeping it out of a thousand phrasings needs a deliberate
   substitute vocabulary: **`הכלל`** · **`הביטוי`** · **`הרישום`**.
   **`נוסחה`**, **`מבחן`**, **`ממוצע`**, **`תוחלת`**.
   ⚠️ **Every ban here is a STEM ban.** `בזמן` strips its `ב` to `זמן`, and a
   punctuality word problem naturally says "מגיעים בזמן" — a doc carrying `מה`
   plus `זמן` scores ≈0.71 on "כמה זמן יש בבגרות", and the `matched < 2` guard
   cannot save you because that probe has only three groups.
   ✅ Safe substitutions, each verified to share NO token with its banned
   partner: `בחינה` for `מבחן`, `משתמש` for `להשתמש`, `משוקלל` for `ממוצע`,
   `שיחות`/`עסקאות` for `לקוחות`.
   The last two were measured on THIS topic. `מבחן` is the sharper lesson:
   "יש לי מבחן מחר מה לעשות" matched a `what-if` alt at 0.50 through `מבחן`
   plus `מה` and `לעשות` — and the `matched < 2` guard does not save you,
   because both frame words count as matches. **Any phrasing with `מבחן` AND
   `מה` scores 0.615 on that probe, and `למה` counts as `מה` because the `ל`
   prefix is stripped** — so does `כמה`. Write `בחינה` instead. Keep `נוסחה`
   out of every phrasing entirely and it stays an unknown token, weight 2.2 and
   unmatchable, which drops its probe to ≈0.26.
   🔑 **And the addition family is a STEM, not a word list: any `חבר`-stem
   counts** — `חברים`, `חברה`, `מחברת` all reduce to `חיבור`. A perfectly
   innocent "כמה מהחברים במועדון" is the banned pattern. Same for `כותב`
   (`שכותבים` → `כותבים`).
   ⚠️ **`למה` CONTAINS `מה`** (the `ל` prefix is stripped), so the question
   frame you reach for most often is already half of the banned pair. The rule
   in full: never put `למה`/`מה`/`כמה`/`איך`/`כיצד`/`באיזה`/`באיזו` in the same
   phrasing as `חיבור`/`סכום`/`מחברים`/`לחבר`/any `חבר`-stem.
   🔑 **Silent merges measured on פונקציות, all unavoidable vocabulary there:**
   `שבר` → **`חילוק`** (identical to `מחלקים`/`חלקי`), so "מחלקים את השבר" is
   one token twice · `מנה` ≡ `יחס`, so "פונקציית מנה" and "יחס המקדמים
   המובילים" collide · `מחובר`/`מחוברים` is a `חבר`-stem and therefore counts
   as `חיבור` — it is the ordinary word for the two terms of the quotient rule
   (write `איברים`/`חלקים`) · `במקום` → `איבר`, and the hazard is the ordinary
   connective "instead of", not the noun · `שלישית` → `num:0.3333` via the
   `ית` suffix, so "ממעלה שלישית" carries a number (write `ממעלה 3`).
   🔴 **`מאפס` → `num:0`, but `שמאפס` does NOT.** Prefixes are stripped from
   the ORIGINAL word only and `stems()` needs ≥5 letters, so the 4-letter
   `מאפס` yields `אפס` while `שמאפס` yields only `{שמאפס, מאפס}`. A held alt
   reading "…מאפס את המכנה" paired with a visible alt reading "…שמאפס את
   המכנה" silently loses a whole group. This is trap #3 wearing a prefix.
   🔑 **Two more silent synonym traps of the same family:** `לקוח`/`לקוחות`
   canonicalises to **`חילוק`** (so a customer-calls word problem cannot be
   anchored on `לקוחות` — use `שיחות` / `עסקאות`), and `מקום`/`במקום`
   canonicalises to **`איבר`**, which turns the ordinary connective "במקום"
   into a content token.
   🔑 **And the addition rule is wider than it looks.** `סכום` canonicalises to
   `חיבור`, and so does `מחברת` (the notebook, via `מחבר`) — while `באיזה` and
   `באיזו` are SYNONYMS OF `איך`. So the real rule is: **never put `איך` /
   `כיצד` / `באיזה` / `באיזו` in the same phrasing as `חיבור` / `מחברים` /
   `לחבר` / `סכום`.** Two of the pilot's noise hits came in through
   "באיזה מצב … החיבור", which looks nothing like the banned pattern.
   🔑 **The principle behind the list: a RARE word is heavier than a common
   one.** Weighting is by IDF, so a word used ONCE across your whole slice
   carries ≈6.6 and one matched group out of three clears the 0.5 threshold on
   its own. A banned word used once is WORSE than used ten times. Treat the
   list as "unfamiliar words are expensive", not as a checklist.
10. **Two entries in the SAME unit must not answer the same shape.** The matcher
    refuses to answer when the top two score within 0.12 of each other — two
    good entries that overlap kill EACH OTHER and the student gets billed. Give
    every entry one anchor its siblings lack.
    🔑 **And the collision is finer than "same shape": an ANCHOR number another
    entry OWNS must not appear in any of your alts, not even inside a
    calculation you are showing.** (Counting words are exempt — `שתי`, `אחת`,
    `שני שלישים` tokenise to `num:2` / `num:1` / `num:0.3333`, and 55 such
    overlaps in one measured slice cost nothing. The rule is about the number
    that identifies an entry, not about every digit.) Measured on this topic: an alt reading
    "למה מחסרים 0.24 פחות 0.18" scored 0.886 against the entry whose unique
    anchor is `0.18`, against that entry's own 1.000 — a margin of 0.114, just
    under the 0.12 cutoff, so BOTH returned nothing.
    ⚠️ **Do not expect the shape tie-break to rescue that.** It only fires when
    exactly ONE of the tied entries has the shape asked, so between two
    `where-from` entries — the commonest cluster in this topic — it is dead.
    🔑 **And it is dead in a wider case: when your `kind` label disagrees with
    what the message actually reads as.** The tie-break asks a learned
    classifier what SHAPE the student's words are, then looks for the tied
    entry whose `kind` matches. Measured here: a `where-from` vs `what-if` tie —
    exactly what the tie-break exists for — still returned null, because the
    entry that should have won was LABELLED `why-step` while its own held alt
    reads as `where-from` at 0.9999 confidence. No tied entry matched, so the
    tie stood. **Label every entry with the kind its own phrasings actually
    are**; relabelling that one took recall 99.6% → 100.0%.

**Cross-question safety:**

11. `concept` / `mistake` / `check` entries are SHARED with sibling units in the
    same sub-topic, so they must be true for ANY question there: method-shaped,
    never naming this unit's numbers or letters.
    🔑 **But do NOT paste one transferable text across ten units.** Every copy
    then scores 1.00 in the shared pool, they tie under `FAQ_MARGIN`, and the
    transfer stage fires **0%** — the feature switches itself off and the gate
    still reads ✅ because recall is about something else. Measured on this
    topic: pairing each transferable theme across **exactly two** units (about
    24 themes over 15 units, a few singletons) produced **91.1% fires**. Write
    each shared theme twice — and no more.
    🔑 **The mechanical rule, which is what actually decides firing: every token
    group of a held alt must appear in ONE document of its partner.** Byte
    identity is the easy way to satisfy that and is what two measured rounds
    used, but it is sufficient, not required — and "in different words" is safe
    ONLY for frame words and reordering. Measured on פונקציות: two pairs
    differed by the single frame word `אסור`, and by `כאשר` vs `כש־`, scored
    4/5 and 5/6 coverage, and would have fired **0%** with every gate green.
    Assert the coverage; do not eyeball it.
    🔑 **And identity is not merely convenient, it is mechanical:**
    `test-tutor-faq` builds the transfer pool with
    `buildFaqIndex(poolOf(near), { idf })` — **no `exclude`** — so the twin's
    held positions 1 and 4 are indexed VERBATIM and the query scores exactly
    1.00 with a wide margin. That is how three slices reached 100%, 100% and
    97.8%. Reword the twin and you are betting the reworded form still clears
    the 0.66 transfer threshold; identity does not bet.
    🔴 **AND A SHARED ENTRY NEEDS TWO CONTENT GROUPS, AS A HARD GATE.** Stage 2
    runs with `minContentMatches: 2` and `matchFaq` returns null on
    `contentIdx.length < 2` BEFORE it scores anything. A `concept` held alt like
    "מה המשמעות של אי תלות" has exactly one content group — `משמעות` is a FRAME
    word — so that entry could never fire, at any score. Count the content
    groups in every transferable held alt; frame words do not count.
12. Conversely, **every held-out alt of a `why-step`/`where-from`/`why-not`/
    `what-if` entry must carry a word only ITS OWN unit has**, or a sibling's
    entry wins the query and the student gets an answer about the exercise next
    door.

**Content gates the merge enforces (an entry that fails is DROPPED):**

13. Balanced `$`. **No Hebrew inside `$…$`** — KaTeX has no bidi and Hebrew
    renders reversed. Hebrew goes outside the maths.
14. No lost backslash (a bare `dfrac` in maths), no university symbols
    (∀ ∃ ∧ ∨ ⟺ ∅ ℝ ℂ ■), no maqaf glued to a maths island, no em-dash used as a
    clause separator.
15. **The answer must NOT contain the unit's final answer** — that is a leak and
    it is dropped. If the answer only makes sense with the result stated, set
    `"reveals": true` on that entry and use it sparingly.
16. No `{slot}` placeholders. Write finished Hebrew.

## Process (this is about cost, follow it)

- **Write the output file ONCE, then Edit it.** One earlier agent re-wrote a
  150 KB file after every check and cost 453k tokens for one slice.
- **Scratch files go in `<work>/`, never in the repo** — name them
  `_scratch-<yourslice>.*` and delete them when you finish. Ten of you share one
  worktree and agents have clobbered each other's scratch scripts before. The
  ONLY file you create that outlives you is `<work>/out/faq-NN.json`.
- Do NOT run `npm run check`, do NOT commit, do NOT push, do NOT edit any file
  in the repo.
- **Check whether the topic's solutions open with `**הכלל:**`.** Where they do,
  `step: 0` is the rule line and a `why-step` about the first MOVE is step 1.
  Older content predates that standard and has no rule line at all, in which
  case index 0 is a real move — mis-attaching every `step` is the cost of
  assuming. הסתברות was verified to have it on every unit; חשבון
  דיפרנציאלי had 62 units without one.

## Your exit condition — measure, do not assert

```
cd C:\Users\1000m\bagrut-app\.claude\worktrees\tutor-answers
npx tsx scripts/test-tutor-faq.ts <work>/out/faq-NN.json
```

Require **✅ recall ≥ 85% and noise ≤ 2%**. Fix and re-run until it clears.

🔴 **Read the VERDICT LINE, never the exit code.** One agent reported
"✅ 123/123 passed" while the transfer verdict on the same run printed ⛔. The
numbers that matter are printed, not returned.

⚠️ **`far-unit` is only structurally 0.0% when your slice is ONE sub-topic** —
then every unit shares a group, there is no "far" unit to fire at, and the
denominator is zero. Most slices here straddle two sub-topics, where it is a
real measurement. Check which you have before you read the number.

🔑 **Sweep the `כאן` rule mechanically at the end; do not trust hand-authoring
to have applied it.** Two slices finished with ~32 held alts that had neither a
digit nor `כאן`, and one of them was actually being served as an unsafe
transfer. A pass over positions 1 and 4 of the non-transferable kinds took
unsafe 0.6% → 0.0% at zero recall cost.

⚠️ **And the gate CANNOT see trap #1.** Recall and noise are computed over your
own file; the duplicate-alt drop happens later, in the merge. A file can score
100% recall and lose 70% of its entries. Before you report, check it yourself:
for every entry, assert that no alt equals `q` once `? ! . ,` and whitespace are
stripped.

## Run this checklist as a SCRIPT, not by care

Three slices in a row finished with 13–32 entries silently missing the `כאן`
deixis, one of them actually being served as an unsafe transfer. Hand-authoring
satisfies a rule four times out of five and misses the fifth every time. Before
you report, assert all of these mechanically over your own file and fix what
they find:

- no alt equals `q` once `? ! . ,` and whitespace are stripped, and no two alts
  in one entry are equal under the same rule
- every id present, unique, and equal to `${unit}#${n}`
- every held alt (positions 1 and 4) of a `why-step`/`where-from`/`why-not`/
  `what-if` entry carries a **DIGIT CHARACTER** or ` כאן`.
  🔴 **"a number" is not the same thing, and the difference is invisible.**
  `pointsAtThisExercise` tests /\d/ over the RAW string, so a SPELLED-OUT number
  satisfies the rule as written and does NOT trip the screen: the alt reads
  fully compliant and stays silently transfer-eligible. Two held alts sat in
  exactly that state on a file reading 99.6% recall, 0% noise, 0 collisions
  and 0% unsafe. Trap #5 is still right that `בארבע` and `4` are the same
  TOKEN; this rule is about the CHARACTER, not the token.
- NO `concept`/`mistake`/`check` phrasing **or answer** carries a digit, `כאן`,
  or any other deixis. ⚠️ Ordinary Hebrew instruction-giving produces it without
  you noticing — "בשורה נפרדת", "בסעיף הזה", "את הקטע הזה" all trip the screen
- no shared theme is used more than TWICE across the slice
- 🔴 **READ EVERY SHARED ANSWER AGAINST ALL THE UNITS IT CAN REACH.**
  This is the one item on this list that NO SCRIPT CAN DO, and the only
  place a false statement can survive the whole pipeline: nothing in it ever
  reads a transferable answer for truth. Measured on פונקציות: a `check`
  theme asserted that the derivative's denominator is the square of the
  original denominator — true under the quotient rule, FALSE for the
  chain-rule root function sitting in the same transfer pool. Every gate was
  green before and after. A subordinate clause is enough to do this; make
  every shared claim CONDITIONAL where the siblings differ.
- **at least TWO entries in every unit carry a `למה`/`מה`/`כמה` word.**
  ⚠️ The reason once given for this rule is WRONG and was corrected by
  measurement: `למה` is a FRAME word, so a message made only of frame words
  leaves `contentIdx` empty and `matchFaq` returns null at the
  `contentIdx.length < minContent` guard BEFORE scoring anything. The probe
  cannot hit at all. Keep the rule — it costs nothing — but never trade away a
  real anchor to satisfy it. The stale reasoning follows, for the record: The
  noise probe "למה אני לא מבין כלום" reduces to the SINGLE group `[למה]`
  (`מבין` strips to `בין`, a stop word, and contributes nothing). A unit where
  exactly one entry carries a `למה`-family word gives that probe a clean 1.00
  hit with no runner-up; the only thing that stops it is a tie. This is the one
  rule where you want words to be COMMON rather than rare.
- every entry's `kind` agrees with what its own held alts actually read as —
  a mislabelled entry cannot be rescued by the shape tie-break
- every `step` in range; answers 40–700 chars, opening on Hebrew, balanced `$`,
  no Hebrew inside `$…$`, no maqaf before a maths island, no em-dash separator,
  no bare `dfrac`, no `{slot}`, and `leaksAnswer` clean

Report back: the slice, the unit count, the entry count, the final
recall / noise / collisions line verbatim, and the `fires` percentage.
