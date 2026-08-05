// ============================================================
// mathscan/solve/index.ts — the CAS registry.
// ============================================================
//
// Same shape as the OCR registry: the pipeline asks for an ordered chain and
// walks it. Free engines first; a paid one is never in the chain unless the
// caller asked for it.
//
// The order is intentional. `localEngine` is instant, exact and offline, so
// it goes first even though `sympyEngine` is strictly more capable — a
// question the local engine can solve should never wait on a network round
// trip. SymPy picks up exactly the cases the local engine refuses (trig
// families, integration by parts, limits), which is where its extra power
// earns the latency.

import type { ClassifiedProblem, ProblemKind, SolveOutcome, SymbolicEngine } from '../types';
import { localEngine } from './engine-local';
import { sympyEngine } from './engine-sympy';

const CHAIN: SymbolicEngine[] = [localEngine, sympyEngine];

export type SolveChainResult = {
  outcome: SolveOutcome;
  /** Every engine that was asked, in order, with what it said. Surfaced in
   *  the trace so "why didn't it solve this?" has a real answer. */
  attempts: { engine: string; status: SolveOutcome['status']; reason?: string }[];
};

/**
 * Try each engine that claims to support this problem kind, stopping at the
 * first `solved`. Returns the LAST outcome when none succeed, so the caller
 * gets a real reason rather than a generic failure.
 */
export async function solveProblem(problem: ClassifiedProblem): Promise<SolveChainResult> {
  const attempts: SolveChainResult['attempts'] = [];
  let last: SolveOutcome = {
    status: 'unsupported',
    kind: problem.kind,
    reason: 'לא נמצא מנוע שתומך בסוג השאלה',
    engine: 'local-mathjs',
  };

  for (const engine of CHAIN) {
    if (!engine.supports(problem.kind)) continue;
    let available = false;
    try {
      available = await engine.isAvailable();
    } catch {
      available = false;
    }
    if (!available) continue;

    const outcome = await engine.solve(problem);
    attempts.push({
      engine: engine.id,
      status: outcome.status,
      reason: outcome.status === 'solved' ? undefined : outcome.reason,
    });
    if (outcome.status === 'solved') return { outcome, attempts };
    last = outcome;
  }

  return { outcome: last, attempts };
}

/** Whether ANY registered engine claims this kind — lets the UI say
 *  "we can't solve this type yet" before spending time on it. */
export function isKindSupported(kind: ProblemKind): boolean {
  return CHAIN.some((engine) => engine.supports(kind));
}

export { localEngine, sympyEngine };
export { classifyProblem } from './classify';
export { latexToMathjs, splitRelation, freeVariables, isParseable, tryParse } from './parse';
