// ============================================================
// mathscan/verify-solution.ts — does the CAS agree with the model?
// ============================================================
//
// The scan pipeline already owns two independent ways to answer a maths
// question: a symbolic engine chain (local mathjs → SymPy, both free) and a
// language model (paid). Until now they never met. The model's answer was
// streamed to the student and written into the shared bank without anything
// ever checking it, and `question_bank.quality_tier` could only climb from
// 'new' to 'corroborated' by counting how many students happened to scan the
// same question — social proof, not maths.
//
// This module is the missing link, and `upsertIntoBank` was already waiting
// for it: its `casVerified` flag is documented as "true only when the local
// CAS confirmed the answer by substitution", and no call site had ever passed
// it. Nothing in production has ever reached the 'verified' tier.
//
// It buys both things at once:
//   ACCURACY  a model answer the CAS contradicts is caught before it is shown
//             as fact and before it poisons the bank for every later student.
//   COST      a CAS-verified row can be served free forever with confidence,
//             instead of waiting for N students to corroborate it. Every
//             future hit on that question is $0 instead of ~$0.009.
//
// ⚠️ IT ABSTAINS BY DEFAULT, AND THAT IS THE POINT. A false 'verified' is
// worse than no verification: it launders a wrong solution into the tier the
// whole app treats as trustworthy. Every ambiguity below returns 'abstained'.

import { classifyProblem } from './solve/classify';
import { solveProblem } from './solve';
import { checkAnswer, type AnswerSpec } from '@/lib/answer-check';

export type SolutionVerdict =
  /** CAS and model agree. Safe to bank as verified. */
  | { status: 'verified'; engine: string; casAnswer: string }
  /** They disagree. The model is probably wrong — do NOT bank. */
  | { status: 'contradicted'; engine: string; casAnswer: string; aiAnswer: string }
  /** No opinion. Bank as usual, unverified. */
  | { status: 'abstained'; reason: string };

/**
 * The solve prompt mandates `**התשובה:** …` as the last line of every section
 * (SOLVE_STREAM_SYSTEM), so this is reading a contract, not guessing at prose.
 */
const ANSWER_LINE = /\*\*התשובה:\*\*\s*(.+)$/gm;

/** Math runs in the question, for the classifier's structural evidence. */
function mathRuns(text: string): string[] {
  return [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1].trim()).filter(Boolean);
}

/** What the CAS concluded on its own, before the model's answer is known. */
export type CasResult =
  | { ok: true; answerValues: string[]; answerLatex: string; engine: string }
  | { ok: false; reason: string };

/**
 * The CAS half, split out so the caller can start it IN PARALLEL with the
 * model call: it needs only the question, while the comparison needs the
 * model's markdown. Running them in sequence would add the SymPy round-trip
 * (up to 12s on a cold Python function) to every scan for no reason.
 *
 * Never rejects — the caller holds this as a floating promise while streaming.
 */
export async function solveWithCas(question: string): Promise<CasResult> {
  try {
    const problem = classifyProblem({ text: question, expressions: mathRuns(question) });
    const { outcome } = await solveProblem(problem);
    if (outcome.status !== 'solved') return { ok: false, reason: `cas ${outcome.status}` };
    // The engine's own substitution check. An engine that produced an answer
    // but could not verify it is not a second opinion worth trusting.
    if (!outcome.verified) return { ok: false, reason: 'cas did not self-verify' };
    if (!outcome.answerValues.length) {
      return { ok: false, reason: 'cas answer not machine-readable' };
    }
    return {
      ok: true,
      answerValues: outcome.answerValues,
      answerLatex: outcome.answerLatex,
      engine: outcome.engine,
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'cas failed' };
  }
}

/** The comparison half — cheap, synchronous work once the markdown exists. */
export function compareWithCas(cas: CasResult, markdown: string): SolutionVerdict {
  try {
    if (!cas.ok) return { status: 'abstained', reason: cas.reason };
    // `solveWithCas` already refuses an empty answer set, so this is
    // unreachable through it — but this function is exported and takes any
    // CasResult, and an empty set builds a spec that nothing can satisfy. The
    // result would be `contradicted`, i.e. a correct solution thrown away and
    // a false alarm logged. The guard belongs where the value is USED too.
    if (!cas.answerValues.length) {
      return { status: 'abstained', reason: 'cas answer not machine-readable' };
    }

    const answers = [...markdown.matchAll(ANSWER_LINE)].map((m) => m[1].trim());

    // A multi-section bagrut question has one answer per section, and the CAS
    // solved ONE problem. Matching its single answer against a list would pick
    // whichever section happens to agree and call the whole solution verified.
    if (answers.length !== 1) {
      return { status: 'abstained', reason: `${answers.length} answer lines; need exactly 1` };
    }
    const aiAnswer = answers[0];

    const spec: AnswerSpec =
      cas.answerValues.length === 1
        ? { kind: 'value', value: cas.answerValues[0] }
        : { kind: 'set', values: cas.answerValues };

    const result = checkAnswer(aiAnswer, spec);
    const outcome = { engine: cas.engine, answerLatex: cas.answerLatex };
    if (result.verdict === 'correct') {
      return { status: 'verified', engine: outcome.engine, casAnswer: outcome.answerLatex };
    }
    if (result.verdict === 'wrong') {
      return {
        status: 'contradicted',
        engine: outcome.engine,
        casAnswer: outcome.answerLatex,
        aiAnswer,
      };
    }
    // 'unparseable' / 'manual' — the comparison itself failed, which says
    // nothing about the model. Never read that as disagreement.
    return { status: 'abstained', reason: `comparison ${result.verdict}` };
  } catch (error) {
    // Verification is a bonus, never a dependency. The student's solution has
    // already streamed by the time this runs; a crash here must not touch it.
    return {
      status: 'abstained',
      reason: error instanceof Error ? error.message : 'verify failed',
    };
  }
}
