/**
 * audit-strings.ts — dump every student-visible string of a topic's SIDE
 * surfaces (ghost-replay / concept-quiz / cognition) that still carries RTL
 * dash clutter, as JSON slices for an authoring pass.
 *
 * These surfaces are NOT reachable from the Lesson object, so the solution
 * pipeline (audit-solutions.ts) misses them entirely — they are the "three side
 * surfaces" that cost a second round on הסתברות.
 *
 *   npx tsx scripts/audit-strings.ts <topic-file-stem> <outdir>
 *   e.g. npx tsx scripts/audit-strings.ts euclidean-geometry <wd>
 */
import { mkdirSync, writeFileSync } from 'fs';

const MAQAF = /[א-ת]-(?=\$|\d)/g;
const DASHM = /\$ ?[—–] | [—–] ?\$/g;
const UNI = /כוח הנקודה|הומותטי|ז\.ז\.צ/g;

/** Keys that are identifiers/markup, never prose shown to a student. */
const SKIP_KEYS = new Set([
  'id', 'latex', 'sym', 'kind', 'type', 'optionId', 'triggers', 'questionSkills', 'skillId',
  'topic', 'subject', 'difficulty', 'value', 'values', 'expected', 'correct', 'answerLabels',
]);

export type StrRow = { where: string; field: string; text: string; bad: string[] };

const stem = process.argv[2];
const outdir = process.argv[3];
if (!stem || !outdir) { console.error('usage: audit-strings.ts <topic-file-stem> <outdir>'); process.exit(2); }
mkdirSync(outdir, { recursive: true });

const SURFACES = [
  ['ghost-replay', `../content/ghost-replay/math5/${stem}`],
  ['concept-quiz', `../content/concept-quiz/math5/${stem}`],
  ['cognition', `../content/cognition/math5/${stem}`],
] as const;

async function main() {
  const bySurface = new Map<string, StrRow[]>();

  for (const [name, path] of SURFACES) {
    const rows: StrRow[] = [];
    let mod: Record<string, unknown>;
    try {
      mod = (await import(path)) as Record<string, unknown>;
    } catch {
      console.log(`  (no ${name} file for ${stem})`);
      continue;
    }
    const seen = new Set<string>();
    const walk = (v: unknown, p: string, key: string) => {
      if (typeof v === 'string') {
        if (SKIP_KEYS.has(key) || !v.trim()) return;
        const bad = [...(v.match(MAQAF) ?? []), ...(v.match(DASHM) ?? []), ...(v.match(UNI) ?? [])];
        // One row per DISTINCT string: the applier patches by literal, so two
        // identical strings are one edit (and two rows would double-apply).
        if (bad.length && !seen.has(v)) { seen.add(v); rows.push({ where: p, field: key, text: v, bad }); }
        return;
      }
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${p}[${i}]`, key));
      if (v && typeof v === 'object')
        for (const [k, x] of Object.entries(v as Record<string, unknown>)) { if (!SKIP_KEYS.has(k)) walk(x, `${p}.${k}`, k); }
    };
    for (const [k, v] of Object.entries(mod)) walk(v, k, k);
    bySurface.set(name, rows);
  }

  const manifest: { name: string; file: string; rows: number; defects: number }[] = [];
  for (const [name, rows] of bySurface) {
    // Slice the big surfaces so one authoring agent gets ~40 strings.
    const SIZE = 40;
    const parts = Math.max(1, Math.ceil(rows.length / SIZE));
    for (let i = 0; i < parts; i++) {
      const slice = rows.slice(i * SIZE, (i + 1) * SIZE);
      const sliceName = parts === 1 ? name : `${name}-${i + 1}`;
      writeFileSync(`${outdir}/${sliceName}.json`, JSON.stringify(slice, null, 1), 'utf8');
      manifest.push({
        name: sliceName,
        file: `content/${name}/math5/${stem}.ts`,
        rows: slice.length,
        defects: slice.reduce((n, r) => n + r.bad.length, 0),
      });
    }
  }
  writeFileSync(`${outdir}/manifest.json`, JSON.stringify(manifest, null, 1), 'utf8');
  console.log(manifest.map((m) => `  ${String(m.rows).padStart(3)} strings / ${String(m.defects).padStart(3)} defects  ${m.name}`).join('\n'));
  console.log(`total: ${manifest.reduce((n, m) => n + m.rows, 0)} strings, ${manifest.reduce((n, m) => n + m.defects, 0)} defects`);
}
main();
