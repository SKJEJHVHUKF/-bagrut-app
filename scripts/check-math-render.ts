/**
 * check-math-render.ts — weakness / plan strings must reach the DOM via MathText.
 *
 * `Weakness.title`, `.detail` and the daily plan's `.title` / `.why` are authored
 * in content/cognition/*.ts with $…$ islands, because they name the maths the
 * student is getting wrong ("העלאת $q$ בחזקת $n$"). Printed as a bare string a
 * card shows the dollar signs, and — worse, because it reads like bad content
 * rather than a bug — RTL reorders the island: `q^{n-1}` renders as `q^{1-n}`,
 * the mistake stated backwards to the student who already has it backwards.
 *
 * This shipped to production from NINE separate cards. Each was written by
 * copying a neighbouring card that rendered a plain-Hebrew string, so nothing at
 * the call site looked wrong: the field is `string` either way, and no test
 * renders these cards.
 *
 *   npx tsx scripts/check-math-render.ts
 *
 * Type-driven, NOT a grep. The first cut of this gate matched `{x.title}`
 * textually and flagged `topic.title`, `copy.title` and a `${tier.title}` inside
 * an aria announce — four hits, four false positives, zero real ones. A gate
 * that cannot tell `weakness.title` from `topic.title` gets silenced, so this
 * one asks the compiler what the object actually is. False negatives are the
 * accepted failure mode here; false positives are not.
 */
import ts from 'typescript';
import { relative } from 'path';

// Types whose string fields are authored with maths.
const RISKY_TYPES = new Set([
  'Weakness', // lib/remediation/types.ts — title, detail
  'DailyTask', // lib/daily-plan.ts       — title, why
  'HealedRecord', // lib/remediation/types.ts — title
  'RepairOutcome', // lib/remediation/report  — title
  'FixPath', // lib/remediation/types.ts — title, detail
  'MisconceptionState', // lib/cognition/types.ts   — title, insight
  'TodayBrief', // lib/tutor-greeting.ts    — first.title, first.why
]);

const FIELDS = new Set(['title', 'detail', 'why', 'insight']);

const cfgPath = ts.findConfigFile('.', ts.sys.fileExists, 'tsconfig.json');
if (!cfgPath) throw new Error('tsconfig.json not found');
const cfg = ts.parseJsonConfigFileContent(
  ts.readConfigFile(cfgPath, ts.sys.readFile).config,
  ts.sys,
  '.',
);
const program = ts.createProgram(cfg.fileNames, cfg.options);
const checker = program.getTypeChecker();

/** The nearest enclosing JSX element's tag, or null. Stops at a prop boundary. */
function enclosingJsx(node: ts.Node): string | null {
  for (let n = node.parent; n; n = n.parent) {
    // `title={w.title}` — a prop. The child component owns the rendering
    // (components/fix/FixIntroCard.tsx wraps it in MathText), so not our call.
    if (ts.isJsxAttribute(n)) return 'PROP';
    if (ts.isJsxElement(n)) return n.openingElement.tagName.getText();
    if (ts.isJsxSelfClosingElement(n)) return n.tagName.getText();
  }
  return null;
}

/**
 * Names a type answers to, unwrapping `T | null` from a narrowed `useMemo`.
 *
 * aliasSymbol is the load-bearing half: every type here is `export type
 * Weakness = { … }`, an alias to an anonymous object literal, so getSymbol()
 * returns `__type` and the name is only on the alias. Without it this gate
 * reported 0 problems on a file where the bug had been reintroduced by hand.
 */
function typeNames(type: ts.Type): string[] {
  const parts = type.isUnion() ? type.types : [type];
  return parts.flatMap((t) =>
    [t.aliasSymbol?.getName(), t.getSymbol()?.getName()].filter(
      (n): n is string => typeof n === 'string',
    ),
  );
}

let problems = 0;
const offenders = new Set<string>();
let scanned = 0;

for (const sf of program.getSourceFiles()) {
  if (sf.isDeclarationFile || !sf.fileName.endsWith('.tsx')) continue;
  const rel = relative('.', sf.fileName).replace(/\\/g, '/');
  if (rel.startsWith('node_modules') || rel.startsWith('.claude')) continue;
  scanned += 1;

  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node) && FIELDS.has(node.name.getText())) {
      const owner = typeNames(checker.getTypeAtLocation(node.expression));
      if (owner.some((n) => RISKY_TYPES.has(n))) {
        const tag = enclosingJsx(node);
        // null  = not in JSX at all (a string built for a URL, an announce, a log)
        // PROP  = handed to a child component, which renders it
        if (tag && tag !== 'PROP' && tag !== 'MathText') {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
          console.log(
            `  ✗ ${rel}:${line + 1}  «${node.getText()}» בתוך <${tag}> — ` +
              `עטוף ב-<MathText inline> (${owner[0]} נושא $…$)`,
          );
          problems += 1;
          offenders.add(rel);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

console.log(
  `\n${problems} raw render(s) across ${offenders.size} file(s); scanned ${scanned} .tsx files.`,
);
if (problems > 0) {
  console.log(
    'כותרת weakness מודפסת גולמית: הדולרים יופיעו על המסך ו-RTL יהפוך את q^{n-1} ל-q^{1-n}.',
  );
  process.exit(1);
}

export {};
