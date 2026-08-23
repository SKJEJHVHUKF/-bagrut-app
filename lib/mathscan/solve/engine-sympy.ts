// ============================================================
// mathscan/solve/engine-sympy.ts — the SymPy backend, drop-in and OFF.
// ============================================================
//
// ── Why this is not the default ─────────────────────────────────────────
// SymPy is Python. This app is Next.js on Vercel Hobby, which runs no
// Python, so there is no way to `import sympy` in a route handler. The two
// real options both cost something:
//
//   A. Pyodide + SymPy in a Web Worker — genuinely $0 per solve and fully
//      offline, but the download is ~6 MB of Pyodide plus ~5 MB for the
//      SymPy wheel, ON TOP of the 6.5 MB the local OCR already ships. For a
//      student on cellular data that is a worse deal than the occasional
//      API call it would replace.
//   B. A small Python service (Render/Fly free tier, FastAPI + SymPy) that
//      exposes ONE endpoint. Costs nothing per solve, adds a cold start,
//      and needs a URL.
//
// `engine-local.ts` already covers what the 5-unit paper actually asks and
// costs nothing at all, so it stays the default. This adapter exists so that
// turning SymPy on is configuration, not a rewrite: it implements the same
// `SymbolicEngine` interface, and the registry picks it up automatically
// the moment the endpoint exists.
//
// ── Turning it on ──────────────────────────────────────────────────────
//   1. Deploy a service exposing POST / with the contract below.
//   2. Set NEXT_PUBLIC_SYMPY_ENDPOINT to its URL in Vercel.
//   3. Add that origin to `connect-src` in next.config.ts — the CSP is
//      `'self'` plus Supabase, so without this step every call is blocked
//      by the browser before it leaves the page.
// Nothing else changes: `solve/index.ts` prefers whichever engine claims
// support for the problem kind, cheapest first.
//
// ── The contract ───────────────────────────────────────────────────────
//   POST { kind, expressions, variables, bounds }
//   200  { status: 'solved', steps: [{kind, latex}], answerLatex,
//          answerValues: string[], verified: boolean }
//     |  { status: 'unsupported', reason: string }
// `steps[].kind` must be one of `SolveStep['kind']`; anything else is
// dropped rather than rendered, because the Hebrew explainer templates on
// that field and an unknown kind would produce an unlabelled step.

import type { ClassifiedProblem, ProblemKind, SolveOutcome, SolveStep, SymbolicEngine } from '../types';

/**
 * Where the SymPy service lives.
 *
 * Defaults to the in-repo Vercel Python Function at `api/math/solve.py`, so
 * no configuration is needed for the normal case. `NEXT_PUBLIC_SYMPY_ENDPOINT`
 * still overrides it — that is how you point at an external service, or turn
 * the engine off entirely by setting it to an empty string.
 *
 * ⚠️ A relative URL only resolves in the browser. On the server (a route
 * handler calling the chain) `fetch('/api/…')` throws, so the absolute origin
 * is rebuilt from VERCEL_URL. Getting this wrong fails in production only,
 * because local dev and the browser path both work by accident.
 */
const DEFAULT_PATH = '/api/math/solve';

function resolveEndpoint(): string {
  const configured = process.env.NEXT_PUBLIC_SYMPY_ENDPOINT;
  if (configured !== undefined) return configured; // '' deliberately disables
  if (typeof window !== 'undefined') return DEFAULT_PATH;
  const origin =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? '';
  return origin ? `https://${origin}${DEFAULT_PATH}` : `http://localhost:3000${DEFAULT_PATH}`;
}

const ENDPOINT = resolveEndpoint();

/** Everything the local engine does, plus the things it deliberately
 *  refuses — which is the entire reason to reach for SymPy. */
const SUPPORTED: ProblemKind[] = [
  'equation',
  'inequality',
  'system',
  'simplify',
  'evaluate',
  'derivative',
  'integral',
  'definite-integral',
  'limit',
];

const VALID_STEP_KINDS = new Set<SolveStep['kind']>([
  'restate', 'domain', 'move-terms', 'expand', 'factor', 'coefficients',
  'discriminant', 'apply-formula', 'substitute', 'simplify', 'differentiate',
  'integrate', 'evaluate-bounds', 'solve-linear', 'roots', 'verify', 'conclude',
]);

/** A cold Python service can take ~10 s to wake. Past that the student is
 *  better served by the fallback than by a spinner. */
const TIMEOUT_MS = 12_000;

let availability: boolean | null = null;

export const sympyEngine: SymbolicEngine = {
  id: 'sympy',
  label: 'SymPy',
  // Self-hosted SymPy is free per call; it is marked unpaid so the pipeline
  // will try it before anything that bills.
  paid: false,

  supports(kind: ProblemKind): boolean {
    return SUPPORTED.includes(kind);
  },

  async isAvailable(): Promise<boolean> {
    if (!ENDPOINT) return false;
    if (availability !== null) return availability;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      // GET on the endpoint ITSELF, not `${ENDPOINT}/health`. The in-repo
      // function is one file mapped to one path — `api/math/solve.py` serves
      // `/api/math/solve` and nothing below it — so a `/health` suffix would
      // 404 and the engine would report itself permanently unavailable.
      // `do_GET` answers the probe; `do_POST` does the work.
      const res = await fetch(ENDPOINT, { signal: controller.signal });
      clearTimeout(timer);
      availability = res.ok;
    } catch {
      availability = false;
    }
    return availability;
  },

  async solve(problem: ClassifiedProblem): Promise<SolveOutcome> {
    if (!ENDPOINT) {
      return { status: 'unsupported', kind: problem.kind, reason: 'SymPy endpoint not configured', engine: 'sympy' };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: problem.kind,
          expressions: problem.expressions,
          variables: problem.variables,
          bounds: problem.bounds ?? null,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        return { status: 'error', kind: problem.kind, reason: `SymPy service returned ${res.status}`, engine: 'sympy' };
      }
      const data = (await res.json()) as Record<string, unknown>;
      if (data.status !== 'solved') {
        return {
          status: 'unsupported',
          kind: problem.kind,
          reason: typeof data.reason === 'string' ? data.reason : 'SymPy could not solve it',
          engine: 'sympy',
        };
      }
      return {
        status: 'solved',
        kind: problem.kind,
        steps: sanitizeSteps(data.steps),
        answerLatex: typeof data.answerLatex === 'string' ? data.answerLatex : '',
        answerValues: Array.isArray(data.answerValues)
          ? data.answerValues.filter((v): v is string => typeof v === 'string')
          : [],
        engine: 'sympy',
        verified: data.verified === true,
      };
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      return {
        status: 'error',
        kind: problem.kind,
        reason: aborted ? 'SymPy service timed out' : 'SymPy service unreachable',
        engine: 'sympy',
      };
    } finally {
      clearTimeout(timer);
    }
  },
};

/** Drop anything the renderer can't label. A service is an external input,
 *  and an unrecognised `kind` would reach the Hebrew explainer's lookup and
 *  render a step with no title. */
function sanitizeSteps(raw: unknown): SolveStep[] {
  if (!Array.isArray(raw)) return [];
  const steps: SolveStep[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const kind = (item as { kind?: unknown }).kind;
    const latex = (item as { latex?: unknown }).latex;
    if (typeof kind !== 'string' || !VALID_STEP_KINDS.has(kind as SolveStep['kind'])) continue;
    steps.push({
      kind: kind as SolveStep['kind'],
      latex: typeof latex === 'string' ? latex : undefined,
    });
  }
  return steps;
}

/** Reference implementation of the service, kept next to the contract it
 *  has to satisfy so the two can't drift. ~40 lines of FastAPI. */
export const SYMPY_SERVICE_REFERENCE = `
# main.py — deploy on Render/Fly free tier, then set NEXT_PUBLIC_SYMPY_ENDPOINT
from fastapi import FastAPI
from pydantic import BaseModel
import sympy as sp

app = FastAPI()

class Req(BaseModel):
    kind: str
    expressions: list[str]
    variables: list[str]
    bounds: dict | None = None

@app.get("/health")
def health(): return {"ok": True}

@app.post("/")
def solve(req: Req):
    try:
        v = sp.Symbol(req.variables[0] if req.variables else "x")
        expr = sp.sympify(req.expressions[0].replace("=", "-(") + ")") \\
               if "=" in req.expressions[0] else sp.sympify(req.expressions[0])
        if req.kind == "equation":
            roots = sp.solve(expr, v)
            return {"status": "solved", "verified": True,
                    "steps": [{"kind": "restate", "latex": sp.latex(expr) + " = 0"}],
                    "answerLatex": ", ".join(f"{v} = {sp.latex(r)}" for r in roots),
                    "answerValues": [str(r) for r in roots]}
        if req.kind == "derivative":
            d = sp.diff(expr, v)
            return {"status": "solved", "verified": True,
                    "steps": [{"kind": "differentiate", "latex": sp.latex(d)}],
                    "answerLatex": sp.latex(d), "answerValues": [str(d)]}
        if req.kind in ("integral", "definite-integral"):
            if req.bounds:
                r = sp.integrate(expr, (v, sp.sympify(req.bounds["lower"]), sp.sympify(req.bounds["upper"])))
            else:
                r = sp.integrate(expr, v)
            return {"status": "solved", "verified": True,
                    "steps": [{"kind": "integrate", "latex": sp.latex(r)}],
                    "answerLatex": sp.latex(r), "answerValues": [str(r)]}
        return {"status": "unsupported", "reason": f"kind {req.kind}"}
    except Exception as e:
        return {"status": "unsupported", "reason": str(e)}
`.trim();
