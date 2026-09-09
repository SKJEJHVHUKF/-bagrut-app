/**
 * class-mistakes.ts — the same mistake, counted across a class.
 *
 * WHY THIS EXISTS. A per-student diagnosis is a conversation; thirty of them
 * are a filing cabinet. The thing a teacher can actually act on is the overlap:
 * "seven students make this same mistake" is a lesson to give on Sunday, and
 * "one student does" is a five-minute talk. Same data, two completely different
 * responses — and the board could not tell them apart, because it never
 * compared students to each other.
 *
 * Every group carries the student IDS, not just a count, so the practice that
 * follows goes to exactly those seven and nobody else. A count alone sends the
 * teacher back to open thirty cards to find the names, which is the work this
 * screen exists to remove.
 *
 * Pure: no clock, no database, no content imports. Covered by
 * `npm run test:class-mistakes`.
 */

/** One weakness as lib/report emits it, narrowed to what the class view needs. */
export type Weakness = {
  /** 'misconception' = a named cause; 'subtopic' = a located one. */
  kind: string;
  topic: string;
  subTopicId: string;
  /** Authored Hebrew — the misconception's name, or the sub-topic's title. */
  title: string;
  detail: string;
  chronic: boolean;
};

export type StudentMistakes = { weaknesses: Weakness[] };

export type SharedMistake = Weakness & {
  /** Stable identity of the group, for React keys and for aiming a task. */
  key: string;
  /** Who has it — ids so the send goes to exactly them, names so it reads. */
  students: { id: string; name: string }[];
  /** How many of them it came back for after a repair. */
  chronicCount: number;
};

/** Two students have "the same mistake" when the engine gave it the same name
 *  in the same place. Title alone would merge two different sub-topics that
 *  share a heading; sub-topic alone would merge two different misconceptions
 *  inside one sub-topic. */
function keyOf(w: Weakness): string {
  return `${w.kind}|${w.topic}|${w.subTopicId}|${w.title}`;
}

/**
 * Group every student's weaknesses into class-level ones, commonest first.
 *
 * Order is by HEADCOUNT before anything else, because that is the question the
 * screen answers — is this a lesson or a conversation. A named misconception
 * breaks a tie against a merely-located sub-topic weakness: both affect the
 * same number of students, but only one of them tells the teacher what to say.
 *
 * Students inside a group keep the roster's order rather than being re-sorted,
 * so the same class always reads the same way.
 */
export function classMistakes(
  byStudent: Record<string, StudentMistakes>,
  names: Map<string, string>
): SharedMistake[] {
  const groups = new Map<string, SharedMistake>();

  // Iterating the ROSTER order (via `names`) rather than object key order keeps
  // the output stable: Object.keys on a record built from a query is insertion
  // order, which changes when a student answers a question.
  for (const [id] of names) {
    const mine = byStudent[id];
    if (!mine) continue;
    for (const w of mine.weaknesses) {
      const key = keyOf(w);
      const g = groups.get(key);
      if (g) {
        // Only add the student once, however many weaknesses collapsed here.
        if (!g.students.some((s) => s.id === id)) {
          g.students.push({ id, name: names.get(id) ?? 'תלמיד' });
        }
        if (w.chronic) g.chronicCount++;
      } else {
        groups.set(key, {
          key,
          kind: w.kind,
          topic: w.topic,
          subTopicId: w.subTopicId,
          title: w.title,
          detail: w.detail,
          chronic: w.chronic,
          students: [{ id, name: names.get(id) ?? 'תלמיד' }],
          chronicCount: w.chronic ? 1 : 0,
        });
      }
    }
  }

  return [...groups.values()].sort(
    (a, b) =>
      b.students.length - a.students.length ||
      rank(b.kind) - rank(a.kind) ||
      a.title.localeCompare(b.title, 'he')
  );
}

/** A named cause outranks a located one at equal headcount. */
function rank(kind: string): number {
  return kind === 'misconception' ? 1 : 0;
}
