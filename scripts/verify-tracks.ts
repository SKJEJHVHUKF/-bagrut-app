/**
 * verify-tracks.ts — the study-track gate (content/tracks).
 *
 * The track is a hand-authored tree of tiles OVER the lesson content, so the
 * two can drift: a tile can point at a sub-topic id that was renamed, a new
 * 571 sub-topic can be authored and never placed on the track (a full ladder
 * nobody can reach), a topic slug can collide, a link can point nowhere.
 * Each of those is a silent product bug, not a type error — this catches them.
 *
 *   ✗ every `ladder` tile resolves to a real sub-topic (resolveRoadmapNode)
 *   ✗ every 571 sub-topic (roadmapTopicOrder('571') × getSubTopics) is on the
 *     571 track — or listed in EXCLUDED_571 on purpose
 *   ✗ topic ids are unique and URL-safe; tile titles/bullets have no Hebrew
 *     inside $…$ (KaTeX has no bidi — same rule as verify-content)
 *   ✗ link hrefs are in-app paths or https URLs; in-app bagrut-practice links
 *     point at a lesson topic that actually has a bagrut bank
 *   ⚠ a ladder sub-topic reached only through `review` tiles (never as a
 *     primary step) — probably a mistake in the syllabus transcription
 *
 * Runs in `npm run check` (before verify:a11y). Reads static content only.
 */

import { allLessonKeys, getSubTopics, hasBagrutBank } from '../content/lessons';
import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';
import { excludedFor, getTrack, TRACK_PAPERS } from '../content/tracks';
import { resolveRoadmapNode, roadmapTopicOrder } from '../constants/roadmapData';
import { locateInTrack, trackEntries, trackNodes } from '../lib/track';

const SUBJECT = 'math5';
const HEBREW = /[֐-׿]/;
const URL_SAFE = /^[a-z0-9-]+$|^[֐-׿][֐-׿ a-z0-9"'-]*$/; // slug or a Hebrew lesson key

/** Hebrew inside a $…$ span (odd segments when splitting on `$`). Splitting —
 *  rather than one regex — so the prose BETWEEN two formulas is not mistaken
 *  for math ("$\sin$ ו-$\cos$" is fine). */
function hebrewInMath(text: string): boolean {
  return text.split('$').some((seg, i) => i % 2 === 1 && HEBREW.test(seg));
}

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

let ladders = 0;
let soon = 0;
let links = 0;

for (const paper of TRACK_PAPERS) {
  const tree = getTrack(paper);
  const ids = new Set<string>();
  const primary = new Set<string>();
  const reviewOnly = new Set<string>();

  for (const topic of tree.topics) {
    const at = `[${paper}] ${topic.id}`;
    if (ids.has(topic.id)) err(`${at}: duplicate topic id`);
    ids.add(topic.id);
    if (!URL_SAFE.test(topic.id)) err(`${at}: topic id is not URL-safe`);
    if (!topic.title.trim()) err(`${at}: empty title`);
    if (topic.tiles.length === 0) err(`${at}: no tiles`);
    if (topic.note && !/^(\/|https:\/\/)/.test(topic.note.href)) err(`${at}: note href must be an in-app path or https URL`);

    // Groups (sub-tracks): unique URL-safe ids, every referenced group exists,
    // and no group is empty — an empty group would render a chooser card that
    // opens onto nothing.
    const groupIds = new Set<string>();
    for (const g of topic.groups ?? []) {
      if (groupIds.has(g.id)) err(`${at}: duplicate group id "${g.id}"`);
      groupIds.add(g.id);
      if (!/^[a-z0-9-]+$/.test(g.id)) err(`${at}: group id "${g.id}" is not URL-safe`);
      if (!g.title.trim()) err(`${at}: group "${g.id}" has an empty title`);
      if (!topic.tiles.some((tl) => tl.group === g.id)) err(`${at}: group "${g.id}" has no tiles`);
    }
    for (const tl of topic.tiles) {
      if (tl.group && !groupIds.has(tl.group)) err(`${at}: tile refers to unknown group "${tl.group}"`);
    }

    topic.tiles.forEach((tile, i) => {
      const where = `${at} · tile ${i + 1}`;
      const texts = [('title' in tile ? tile.title : undefined) ?? '', ...(tile.bullets ?? [])];
      for (const t of texts) {
        if (hebrewInMath(t)) err(`${where}: Hebrew inside $…$ — "${t.slice(0, 40)}"`);
        const dollars = (t.match(/\$/g) ?? []).length;
        if (dollars % 2 !== 0) err(`${where}: unbalanced $ — "${t.slice(0, 40)}"`);
      }
      if (tile.kind === 'ladder') {
        ladders++;
        const r = resolveRoadmapNode(tile.subId);
        if (!r) {
          err(`${where}: ladder subId "${tile.subId}" does not exist in content/lessons`);
          return;
        }
        if (tile.review) reviewOnly.add(tile.subId);
        else primary.add(tile.subId);
      } else if (tile.kind === 'soon') {
        soon++;
        if (!tile.title.trim()) err(`${where}: soon tile without a title`);
      } else {
        links++;
        if (!/^(\/|https:\/\/)/.test(tile.href)) err(`${where}: link href must be an in-app path or https URL`);
        const m = tile.href.match(/^\/practice\/math5\/([^/]+)\/exercise\?mode=bagrut$/);
        if (m) {
          const lessonTopic = decodeURIComponent(m[1]);
          if (!hasBagrutBank(SUBJECT, lessonTopic)) err(`${where}: bagrut-practice link to "${lessonTopic}" but that lesson has no bagrut bank`);
        }
      }
    });

    // The rendered entries must keep the tile count (nothing silently dropped).
    const entries = trackEntries(topic);
    if (entries.length !== topic.tiles.length) {
      err(`${at}: ${topic.tiles.length - entries.length} tile(s) dropped at render (unresolvable ladder)`);
    }
    // Every ladder in the topic must be locatable back from the ladder page.
    for (const e of entries) {
      if (e.kind !== 'ladder') continue;
      const loc = locateInTrack(paper, e.node.subId, topic.id);
      if (!loc || loc.topic.id !== topic.id) err(`${at}: locateInTrack cannot find "${e.node.subId}" inside its own topic`);
    }
  }

  for (const s of reviewOnly) {
    if (!primary.has(s)) warn(`[${paper}] "${s}" appears only as a review tile — never as a primary step`);
  }

  // Coverage: every sub-topic the paper's curriculum authored is on the track.
  const excluded = new Set(excludedFor(paper));
  const onTrack = new Set(trackNodes(tree).map((n) => n.subId));
  for (const lessonTopic of roadmapTopicOrder(paper)) {
    for (const st of getSubTopics(SUBJECT, lessonTopic)) {
      if (excluded.has(st.id)) {
        if (onTrack.has(st.id)) err(`[${paper}] "${st.id}" is in EXCLUDED but also on the track — pick one`);
        continue;
      }
      if (!onTrack.has(st.id)) err(`[${paper}] sub-topic "${lessonTopic} / ${st.id}" is authored but unreachable from the track`);
    }
  }

  console.log(
    `[${paper}] ${tree.topics.length} topics · ${tree.topics.reduce((s, t) => s + t.tiles.length, 0)} tiles · ${onTrack.size} distinct sub-topics reached`,
  );
}

console.log('─'.repeat(70));
console.log(`${ladders} ladder tiles · ${soon} coming-soon · ${links} links`);

// ── the onboarding picker's source of truth ────────────────────────────────
// app/onboarding/page.tsx builds ALL_TOPICS from MATH5_CURRICULUM instead of
// from content/lessons, so that the first screen a new student sees does not
// carry the 4.57 MB authored corpus for the sake of fifteen Hebrew strings.
// That substitution is only correct while the two lists are the same SET, and
// they are not equivalent by construction: isTopicInActivePaper returns true
// for a topic with no curriculum entry ("never hide"), so a lesson authored
// without one used to appear in the picker and would now silently vanish from
// it — a new topic no student could ever add to their plan, with nothing on
// screen to show it went missing.
const lessonTopics = allLessonKeys()
  .filter((k) => k.subject === 'math5')
  .map((k) => k.topic);
const curriculumTopics = MATH5_CURRICULUM.map((c) => c.key);
for (const t of lessonTopics) {
  if (!curriculumTopics.includes(t)) {
    errors.push(
      `content/lessons has math5 topic "${t}" with no MATH5_CURRICULUM entry — it would disappear from the onboarding picker (app/onboarding ALL_TOPICS). Add it to content/bagrut-curriculum.ts.`,
    );
  }
}
for (const t of curriculumTopics) {
  if (!lessonTopics.includes(t)) {
    errors.push(
      `MATH5_CURRICULUM lists "${t}" but content/lessons has no such math5 topic — the onboarding picker would offer a topic with no content behind it.`,
    );
  }
}
console.log(
  `onboarding picker: ${curriculumTopics.length} curriculum topics · ${lessonTopics.length} authored math5 topics · ${
    lessonTopics.length === curriculumTopics.length &&
    lessonTopics.every((t) => curriculumTopics.includes(t))
      ? 'in step'
      : 'DRIFTED'
  }`,
);

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`   ${w}`);
}
if (errors.length) {
  console.log(`\n❌ ${errors.length} error(s):`);
  for (const e of errors) console.log(`   ${e}`);
  process.exit(1);
}
console.log('\n✅ 0 errors — every track tile resolves and every authored sub-topic is reachable.');
