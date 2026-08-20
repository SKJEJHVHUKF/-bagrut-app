'use client';

// ProbTree — the probability-tree diagram exactly as it is drawn on paper in
// the bagrut: a root, branches with their probabilities written on the lines,
// path products under the leaves, and ✓ marks on the paths the question asks
// about. Authored in lesson content as a ```probtree fenced block holding a
// JSON spec; MathText picks the fence up and renders this component.
//
// Reading order is Hebrew: the FIRST branch is drawn on the RIGHT, like every
// blackboard tree in an Israeli classroom.
//
// Labels are plain text on purpose (0.6, 3/8, x, גבר) — no KaTeX inside the
// SVG. That is also what the exam sheet looks like.

export type ProbBranch = {
  /** probability written on the incoming edge, e.g. "0.6", "3/8", "p" */
  p: string;
  /** node label, e.g. "אוטובוס" */
  label: string;
  /** for leaves: the path product shown under the leaf, e.g. "0.06" */
  result?: string;
  /** mark this leaf's whole path (the "relevant to the question" ✓) */
  pick?: boolean;
  children?: ProbBranch[];
};
export type ProbTreeSpec = { root?: string; children: ProbBranch[] };

const LEAF_W = 96;
const LEVEL_H = 82;
const PAD = 10;
const TOP = 16;
const INK = '#1E1B4B';
const LINE = '#94a3b8';
const PICKED = '#7c3aed';
const P_COLOR = '#6d28d9';

type Placed = {
  x: number;
  y: number;
  branch?: ProbBranch;
  parent?: Placed;
  picked: boolean;
  isLeaf: boolean;
};

function hasPick(b: ProbBranch): boolean {
  return b.pick === true || (b.children ?? []).some(hasPick);
}
function countLeaves(b: ProbBranch): number {
  return b.children?.length ? b.children.reduce((s, c) => s + countLeaves(c), 0) : 1;
}
function maxDepth(b: ProbBranch): number {
  return b.children?.length ? 1 + Math.max(...b.children.map(maxDepth)) : 1;
}

export function ProbTree({ spec }: { spec: ProbTreeSpec }) {
  const leaves = spec.children.reduce((s, c) => s + countLeaves(c), 0);
  const depth = Math.max(...spec.children.map(maxDepth));
  const width = 2 * PAD + leaves * LEAF_W;
  const height = TOP + depth * LEVEL_H + 56;

  // First leaf gets the RIGHTMOST slot (Hebrew reading order).
  let slot = 0;
  const nodes: Placed[] = [];
  const place = (b: ProbBranch, level: number, parent: Placed): Placed => {
    let x: number;
    const isLeaf = !b.children?.length;
    let placedChildren: Placed[] = [];
    if (isLeaf) {
      x = width - PAD - LEAF_W / 2 - slot * LEAF_W;
      slot += 1;
    } else {
      x = 0; // filled after children
    }
    const node: Placed = { x, y: TOP + level * LEVEL_H, branch: b, parent, picked: hasPick(b), isLeaf };
    if (!isLeaf) {
      placedChildren = (b.children ?? []).map((c) => place(c, level + 1, node));
      node.x = placedChildren.reduce((s, c) => s + c.x, 0) / placedChildren.length;
    }
    nodes.push(node);
    return node;
  };
  const root: Placed = { x: 0, y: TOP, picked: false, isLeaf: false };
  const rootChildren = spec.children.map((c) => place(c, 1, root));
  root.x = rootChildren.reduce((s, c) => s + c.x, 0) / rootChildren.length;
  nodes.push(root);

  return (
    <div dir="ltr" className="my-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', maxWidth: width, minWidth: Math.min(width, 300), display: 'block', margin: '0 auto' }}
        role="img"
        aria-label="עץ הסתברויות"
      >
        {nodes
          .filter((n): n is Placed & { branch: ProbBranch; parent: Placed } => !!n.branch && !!n.parent)
          .map((n, i) => {
            const mx = (n.x + n.parent.x) / 2;
            const my = (n.y + n.parent.y) / 2;
            const dx = n.x >= n.parent.x ? 15 : -15;
            return (
              <g key={i}>
                <line
                  x1={n.parent.x}
                  y1={n.parent.y}
                  x2={n.x}
                  y2={n.y}
                  stroke={n.picked ? PICKED : LINE}
                  strokeWidth={n.picked ? 2.2 : 1.5}
                />
                <text x={mx + dx} y={my - 3} textAnchor="middle" fontSize="13.5" fontWeight={600} fill={P_COLOR}>
                  {n.branch.p}
                </text>
                <circle cx={n.x} cy={n.y} r={3.2} fill={INK} />
                <text x={n.x} y={n.y + 17} textAnchor="middle" fontSize="14" fill={INK}>
                  {n.branch.label}
                </text>
                {n.isLeaf && n.branch.result && (
                  <text
                    x={n.x}
                    y={n.y + 37}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight={700}
                    fill={n.branch.pick ? PICKED : INK}
                  >
                    {n.branch.result}
                    {n.branch.pick ? ' ✓' : ''}
                  </text>
                )}
              </g>
            );
          })}
        <circle cx={root.x} cy={root.y} r={3.6} fill={INK} />
        {spec.root && (
          <text x={root.x} y={root.y - 6} textAnchor="middle" fontSize="14" fill={INK}>
            {spec.root}
          </text>
        )}
      </svg>
    </div>
  );
}

/** JSON-fence entry point used by MathText; malformed JSON degrades to a quiet note. */
export function ProbTreeFromJson({ json }: { json: string }) {
  try {
    const spec = JSON.parse(json) as ProbTreeSpec;
    if (!spec || !Array.isArray(spec.children) || spec.children.length === 0) throw new Error('empty');
    return <ProbTree spec={spec} />;
  } catch {
    return (
      <div dir="rtl" className="my-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
        (תרשים העץ אינו זמין)
      </div>
    );
  }
}
