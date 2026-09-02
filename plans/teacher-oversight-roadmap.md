# MathUp — Teacher & Admin build list

Ranked. Everything above the line is arithmetic over data Postgres already holds. Verified against the files as they stand today.

---

## Tier 1 — correctness first (do these before anything that builds on a number)

### 1. Stop counting replays in the accuracy the teacher sees — **S, no new data**
**What:** `repeat: true` events are excluded from accuracy everywhere the student sees it and included everywhere the teacher sees it, so the same student reads 72% to himself and 85% to his tutor.
**Serves:** both.
**Files:** `app/api/teacher/overview/route.ts:120` (the aggregation loop), `app/api/admin/activity/route.ts:159`.
**Source:** `ResultEvent.repeat` — written in `lib/results.ts`, synced, and already the rule `measured()` at `lib/results.ts:214` applies. Confirmed: neither route filters it.
**Shape of the fix:** accuracy and `stuck` iterate `results.filter(r => !r.repeat)`; the full log stays for activity counts and `lastAnswerAt`. Two lines each.
**Why first:** every delta, movement, or before/after item below is built on this denominator. Ship them first and you build them twice.
**Rides along free (same loop):** a `selfReported` counter and one helper line — "מתוכן N נבדקו על ידי התלמיד עצמו". `selfReported` is on the event and read today only by `lib/cognition`. A student who self-marks everything correct currently renders as 95% with nothing on screen to say so.

### 2. Widen `ResultRow` in the overview route — **S, no new data**
**What:** the route's local type (`route.ts:34-43`) declares 8 fields; the JSON in the column carries the full `ResultEvent`. Dropped today: `subject`, `repeat`, `source`, `selfReported`, `chosenIndex`.
**Serves:** nothing on its own — it is the prerequisite for items 1, 3 and 7.
**Files:** `app/api/teacher/overview/route.ts:34-43`.
**Danger worth naming:** `buildReport` and `lib/remediation/detect.ts` filter on `e.subject === input.subject`. A row typed without `subject` produces an **empty panel with `earlyDays: true`** — which reads as "not enough data yet", not as a bug. Run one real row through the function and check the output is non-empty before concluding anything.

---

## Tier 2 — pure rendering of data already collected

### 3. One `buildReport()` call in the teacher route — **M, no new data, no new table**
**What:** replaces "43% באלגברה" with a named recurring misconception, its trend, the authored Hebrew fix sentence, and the weekly movement — all of which are already computed and tested.
**Serves:** tutor (and the owner via `?as=`).
**Files:** `app/api/teacher/overview/route.ts` (one import + one call over the `results` array it already holds at line 86); render in `app/teacher/TeacherDashboard.tsx`.
**Source:** `lib/report.ts:231 buildReport({subject:'math5', events: results, mistakes:[], history:[], healed:{}, healCount:{}, now})`. I verified it is pure and that `lib/patterns/*`, `lib/generator` and `lib/remediation/detect.ts` contain no `window`/`localStorage` access (the one hit in `detect.ts:152` is a comment). `lib/report.ts` does import the browser stores for its `getReport` wrapper, but every one of them (`lib/results`, `lib/mistakes`, `lib/remediation/store`, `lib/storage`, `lib/review`) guards `typeof window` **inside** functions — no module-scope access, safe on the server.
**Returns in one call** what four separate proposals asked for: `profile.patterns`, `weaknesses` + `chronic`, `movement`, `weeks`. Hebrew text comes from `TAG_INFO[tag].label/detail/fix` and `Weakness.detail` — already written, already checked by scripts.
**Three rendering rules, all mandatory:**
- Do **not** render `repairs`. `healed`/`healCount` are localStorage-only, so it is always empty on the server and "0 תיקונים" is exactly the false zero the route header warns about.
- Honour `earlyDays` and `profile.belowFloor` — print the "not enough data" state, don't render empty cards.
- Print `movement` **next to the difficulty mix and the volume**, never alone. The ladder raises difficulty as a student progresses, so an improving student's raw accuracy falls. `difficulty` is on every event and is currently discarded by the topic reducer (`route.ts:115-136`); one line inside the existing loop keeps it.
**Do not** separately implement "what changed since last week" or a hand-rolled 7/14-day split — `weeks` and `movement` are that, with the `WeekPoint.accuracy === null` rule (empty week ≠ 0%) already enforced.

### 4. `?month=YYYY-MM` on the payroll screen — **S, no new data, no new table**
**What:** open a past month on `/admin/pay`. Today it is impossible.
**Serves:** owner.
**Files:** `app/api/admin/teachers/route.ts` (read the param, pass a date inside that month as `now`), `app/admin/pay/page.tsx:21` (currently reads `rows[0]?.pay.month.month`), plus a `<input type="month">`.
**Source:** none new. `buildPay` already takes `now` as a parameter and derives `month` from it (`lib/teacher-pay.ts:143-145`); overrides come from `teacher_week_hours` as they do now.
**Why it is above the fold:** on the 1st of the month — the one day Itay actually pays — the screen has already rolled to the new month and shows ₪0 for the month he owes.

### 5. `last_sign_in_at` + assignments-given on the teacher row — **S, no new data, no new table**
**What:** the only two columns in the whole system that distinguish a tutor who works from one who has not opened the board — next to the money.
**Serves:** owner.
**Files:** `person()` in `app/api/admin/teachers/route.ts:81` (returns id/email/name/missing today), plus a count query on `assignments` grouped by `teacher_id`; rendered on `/admin/teachers` and `/admin/pay`.
**Source:** `auth.users.last_sign_in_at` — already read in `app/api/admin/users/route.ts`; `assignments.created_at` + `teacher_id` — the table exists and this route never queries it. Assignment-writing is the only action a tutor takes that leaves a row.
**Ship in the same diff as item 4.** Salary accrues with nobody doing anything; these are the only two signals that anybody did.
**Do not** add "how many of his students moved this week" to this column. That is student behaviour rendered as teacher performance, next to a pay decision.

### 6. The rung he is stuck on — **S, no new data, no new table**
**What:** "ניסה את שלב אתגר בזהויות 6 פעמים ולא עבר" — the sentence that decides what to teach Tuesday. Accuracy percentages never say this.
**Serves:** both.
**Files:** add `roadmap` to the existing `select` at `app/api/teacher/overview/route.ts:86` (same round trip); render in `TeacherDashboard.tsx`.
**Source:** `learning_state.roadmap`, shape `{ 'topic::subId': { passed, levels: { mid: { cleared, attempts, stars, bestScore } } } }`, written by `lib/roadmap-progress.ts` and merged max-wins by `lib/sync/roadmap-sync.ts`. Filter `attempts >= 3 && !cleared`; titles from `getSubTopic()` / `lib/roadmap-levels`.
**Note:** `app/api/admin/activity/route.ts:81` already selects `roadmap` and returns it at line 220, and no file under `app/admin/*.tsx` reads it. The owner side is a render-only change.

### 7. Bagrut papers counted separately, with the exam date — **M, no new data, no new table**
**What:** in an app whose whole point is a bagrut grade, "ישב שאלון 571 וקיבל 55%" is invisible — a full paper and a warm-up drill land in the same accuracy bucket.
**Serves:** both.
**Files:** `app/api/teacher/overview/route.ts` (needs item 2's widened type for `source`; add `plan` to the line-86 select), header in `TeacherDashboard.tsx`.
**Source:** `results[].source` (`'quiz'|'drill'|'bagrut'|'review'|'fix'`, `lib/results.ts:35`) — already synced, already kept on the owner side (`app/api/admin/activity/route.ts:59`); and `learning_state.plan` (`bagrutDate`, `targetGrade`, via `daysUntilBagrut` and `TARGET_LABEL` in `lib/study-plan.ts`).
**Renders as one header line:** days left, target grade, papers solved, score on them. `source: 'fix'` additionally answers "did the remediation work".
**Guard:** `plan` is null on legacy accounts — render nothing, not a zero. Do **not** try to add "predicted grade then vs now": `lib/prediction.ts:91` calls `topicStats()`/`getPlan()`, which read localStorage. It does not run on the server without extracting a pure core first.

### 8. Practice days, not answers — **S, no new data**
**What:** the headline on the student card is cumulative `answered`. 200 questions in one panic night and 20 across 10 days are the same number and two different students. "תרגל ב-3 מתוך 30 הימים האחרונים" is the sentence a weekly tutor can act on.
**Serves:** both.
**Files:** the existing loop in `app/api/teacher/overview/route.ts`; card headline in `TeacherDashboard.tsx`.
**Source:** `results[].ts` grouped by Israeli calendar day via `israelDay()`, already exported from `lib/teacher-pay.ts:55` and already imported in two other files.
**Guard:** no `learning_state` row → "לא סונכרן מעולם", never "0 ימים". Same rule the route already applies via `syncedAt: null`.

### 9. The silence list, owner-side, next to the phone number — **S, no new data, no new table**
**What:** parents cancel after three quiet weeks, not after a bad grade. `lastAnswerAt` exists and is an 11px grey line under a headline that only ever goes up; the owner does not have it at all.
**Serves:** owner primarily, tutor as an instruction.
**Files:** `app/admin/page.tsx` / `AdminDashboard.tsx` (list, sorted, grouped by responsible tutor); on the tutor board, promote `lastAnswerAt` to the card headline and word it as an action ("תתקשר אליו"), not another metric.
**Source:** `lastAnswerAt` / `syncedAt` already computed in the overview route; owner side crosses `teacher_students` with the `learning_state` timestamps.
**The reason it lives with the owner:** the tutor deliberately never sees the email (`route.ts:179`), and the only tutor→student channel is an assignment inside the app — which a silent student will not open. A diagnosis with no route to a phone call gets ignored by week three.

### 10. `sub_topic_id` on the assignment form — **S, no new data, no new table**
**What:** the column exists (`supabase-teachers.sql:46`) and the form never sets it, so every task is topic-wide while the diagnosis is sub-topic precise. `assignmentProgress()` already filters on it, so the completion counter tightens for free.
**Serves:** both.
**Files:** the form in `app/teacher/TeacherDashboard.tsx:639`, plus the POST handler.
**Skip the "תן מטלה על זה" prefill button** — that is polish; the missing field is the part with teeth.

---

## ⎯⎯⎯ Below this line: only if the business grows ⎯⎯⎯

Nothing here is wrong. All of it is speculative at 5 tutors, or costs a table, or costs a recording.

### 11. Cohort baseline — is 43% bad? — **M, no new table**
No median, average or percentile exists anywhere in the app. Without one, neither the tutor nor the owner can separate "weak roster" from "hard topics" — and self-comparison never can. Same query as `app/api/admin/activity/route.ts:81` (already service-role, `limit 2000`), grouped by `topic`, and a second grouping by `questionId`. The bonus is real: a bank question answered correctly 0 of 14 times across 14 students is a broken question or a broken solution, and today it renders as 14 stuck students sending tutors to teach the wrong thing. The tutor gets only the anonymous number — never another tutor's student.
**Build when:** enough students that a per-topic median is not three people. Roughly 20+.

### 12. Before/after the assignment start date — **M, no new table**
`teacher_students.created_at` is stored and selected by nobody. It is the product promise as a number. Deferred for three stacked reasons: the denominator is wrong until item 1 ships, difficulty rises with progress so an accuracy delta needs a second number beside it, and most pairings are weeks old — the "before" side is empty or thin for nearly everyone.
**Build when:** pairings are months old. It is a quarterly-review number, not a Tuesday-evening one.

### 13. `teacher_payslips` — a frozen paid month — **M, NEW TABLE**
`buildPay` recomputes from scratch on every read, so raising a rate in November silently rewrites October's already-paid total, and there is no record of what was actually paid. One row per `(teacher_id, month)`: `rate`, `hours`, `amount`, `paid_at`, burned from `buildPay`'s output at close. ~60 rows a year at 5 tutors.
**Build when:** the first pay dispute, or above ~10 tutors. Item 4 removes most of the pain, and the risk only materialises the first time Itay actually changes a rate.

### 14. `teacherUntil` — **M, no new table**
`PATCH {teacher:false}` today flips one flag and leaves `hourlyRate`, `weeklyHours`, `teacherSince`, the `teacher_students` rows and the accrued unpaid month behind — and the tutor vanishes from every admin screen along with the money owed. The full fix is a symmetric ceiling in `buildPay` plus widening `GET /api/admin/teachers` to include non-teachers with open rosters. **The lazy version is three warning lines on the confirm screen** — "יש לו N תלמידים ו-₪X פתוחים" — and it is what to build if this ever comes up. No tutor has been stopped yet.

---

## Cannot be done without recording something new — stated plainly

- **What happened in the 45-minute lesson.** Nothing in the system records it. `teacher_notes(teacher_id, student_id, note, next_focus, created_at)` would be a new table whose only consumer is the person who wrote it — WhatsApp does that today. The usual second justification ("since our last session" as a window) is circular: a fixed 7-day window gives the same thing with no writes. Build when a tutor asks for it.
- **A real month-by-month archive.** `MAX_EVENTS = 1000` in `lib/results.ts` makes the answer log a rolling window, and assignments are hard-deleted by `DELETE /api/teacher/assignments`. Any "March vs April" timeline is fabricated for an active student. A true archive needs a monthly summary row written once a month — a new recording. Do not build the timeline first and the archive later; that order ships a lie.
- **Margin per student.** `costUsd` is a floor (no cache reads) and revenue is not stored anywhere — `pro` is a boolean. Any margin figure is an invented constant over a known-low number. Not a basis for a roster-size decision.
- **Whether the tutor opened his board** (as opposed to signing in). `last_sign_in_at` is the available proxy and it catches the case that matters — never signed in. A real timestamp on `GET /api/teacher/overview` is a new write; add it only if someone signs in and still never opens the board.

## Two things not to build because they already exist

- **"Owner views a tutor's board"** — `?as=<teacherId>` is implemented and gated on `isAdmin` (`lib/teacher-guard.ts:107`), and `app/admin/teachers/[id]/page.tsx:74` already links to it.
- **"Students with no tutor"** — `GET /api/admin/teachers:137` already returns `candidates` sorted by name and `app/admin/page.tsx` already builds the assigned `Set`. The gap is a count that should print names: a text change on an existing screen, not an item.

## One more thing nobody is looking at

`learning_state.tutor_memory` — durable facts the student told the chat about himself, written and read **only** by `lib/tutor-memory.ts`, not part of the sync payload, and never surfaced anywhere. Adding the column name to the line-86 select is trivial, but this is a **decision for Itay, not an engineering call**: the student was promised he sees and deletes these himself (`app/api/chat/memory/route.ts`) and was never told a human would read them. If it ships, the memory screen needs one line saying so, and each fact must render with its `ts` — the store is FIFO-capped at 12, so "הבגרות שלי ב-12" outlives the exam.