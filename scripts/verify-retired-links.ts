/**
 * verify-retired-links.ts — nothing sends a student to a retired screen.
 *
 *   npx tsx scripts/verify-retired-links.ts
 *
 * WHY THIS EXISTS
 * `/practice/[subject]/[topic]` and its `/sub/<id>/practice` child are the
 * screens from before מסלול הלמידה. They still render, so a link to one does not
 * 404 and nothing fails — the student simply lands somewhere that has not been
 * part of the product for months. The owner found it the only way anyone ever
 * finds this: he tapped the task his teacher sent him, on his phone, and
 * recognised the screen.
 *
 * That is the whole failure mode. A dead link screams; a link to a dead SCREEN
 * is silent, so it has to be asserted rather than noticed.
 *
 * Practice lives on the roadmap ladder now — `/roadmap/<subId>` for a
 * sub-topic, `/roadmap/track/<paper>/<topicId>` for a topic. lib/track.ts
 * builds both.
 *
 * ⚠️ `/practice/<subject>/<topic>/exercise` IS NOT RETIRED. The mixed bagrut
 * run and the quick quiz are gate stations at the end of a topic's journey, and
 * content/tracks links to them on purpose. Only the topic hub and the
 * sub-topic lesson under it are dead. A gate that flagged `/exercise` would be
 * telling the roadmap to stop linking to its own last station.
 *
 * WHAT COUNTS AS A VIOLATION
 * A string literal that BEGINS a URL path into the tree — `'/practice/…'`,
 * `"/practice/…"`, `` `/practice/…` `` — unless it reaches `/exercise`; and a
 * direct `href` to the `/practice` hub. Import specifiers like
 * '@/components/practice/MathText' are not URLs and do not match, because the
 * character after the quote is `@`. Prefix lists (lib/nav.ts, FormulaSheet)
 * name the path without linking to it, and are not matched either.
 *
 * The retired screens' own files are exempt — app/practice/** is the route and
 * components/practice/{LessonView,TopicJourney,SubTopicLesson} are its views.
 * They are being taken out of use, not rewritten.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SEARCH = ['app', 'components', 'lib', 'content'];

/** A path into the retired tree, or a direct link to its hub. */
const RETIRED = [/(['"`])\/practice\//, /href=\s*["'`{]*["'`]\/practice["'`]/];

/** Still alive, deliberately: the roadmap's own gate stations at the end of a
 *  topic — the mixed bagrut run and the quick quiz. content/tracks links to
 *  them on purpose. */
const ALIVE = /\/exercise/;

/** The retired screens themselves, and the views only they use. */
const EXEMPT = [/^app[\\/]practice[\\/]/, /^components[\\/]practice[\\/]/];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(full);
  }
  return out;
}

const offenders: string[] = [];
let scanned = 0;

for (const base of SEARCH) {
  let files: string[];
  try {
    files = walk(join(ROOT, base));
  } catch {
    continue;
  }
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (EXEMPT.some((re) => re.test(rel))) continue;
    scanned++;
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      // A comment explaining the history is not a link.
      if (/^\s*(\*|\/\/)/.test(line)) return;
      if (ALIVE.test(line)) return;
      if (RETIRED.some((re) => re.test(line))) {
        offenders.push(`${rel}:${i + 1}  ${line.trim().slice(0, 110)}`);
      }
    });
  }
}

console.log(`scanned ${scanned} files`);
if (offenders.length === 0) {
  console.log('PASS  nothing links to the retired /practice screens');
  process.exit(0);
}

console.log(`FAIL  ${offenders.length} link(s) still point at a retired screen:\n`);
for (const o of offenders) console.log('  ' + o);
console.log('\nUse the roadmap instead — lib/track.ts builds the ladder and topic links.');
process.exit(1);
