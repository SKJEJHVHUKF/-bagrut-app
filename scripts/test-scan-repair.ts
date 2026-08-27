/**
 * test-scan-repair.ts — the OCR repair proposal.
 *
 *   npx tsx scripts/test-scan-repair.ts
 *
 * lib/mathscan/repair turns a rejected read into one tap. The failure that
 * matters is NOT "missed a repair" — it is proposing a question the student
 * never asked and having them accept it by reflex, which is the same harm as
 * answering the misread, one step later.
 *
 * So the weight here is on ABSTENTION and on the edit budget.
 */

import { proposeRepair } from '../lib/mathscan/repair';
import { validateTranscription } from '../lib/mathscan/validate';
import type { OcrResult } from '../lib/mathscan/types';

/** A machine read, shaped exactly as the local engine returns one. Engine is
 *  'tesseract-local' on purpose: `humanEdited` floors the verdict at `review`,
 *  so a manual fixture could never reproduce a rejection. */
function machineRead(text: string): OcrResult {
  return {
    engine: 'tesseract-local',
    text,
    lines: text.split(/\r?\n/).map((line) => ({ text: line, confidence: 0.8 })),
    meanConfidence: 0.8,
    durationMs: 0,
    costUsd: 0,
  };
}

let failures = 0;
let checks = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
}
function section(t: string) {
  console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 56 - t.length))}`);
}

section('the real failure from the field');

// The exact read that produced "x = 6/5" with a green badge on a real photo.
const misread = 'x° - 5x + 6 = 0';
const fix = proposeRepair(misread);
assert(fix !== null, 'the x° misread gets a proposal');
assert(fix?.text === 'x^2 - 5x + 6 = 0', `and it is the right equation (got "${fix?.text}")`);
assert(!!fix?.reason, 'with a reason the student can judge');

section('abstains where the text might be what it says');

const LEAVE_ALONE = [
  'sin 30° + cos 60° = ?',          // degrees after NUMBERS are real angles
  'מצא את הזווית α במשולש',          // no math to repair
  'x + y = 10',                      // nothing wrong
  '',                                // empty
  '   ',                             // blank
];
for (const s of LEAVE_ALONE) {
  assert(proposeRepair(s) === null, `abstains on "${s.trim() || '(empty)'}"`);
}

// Subscripted names and coordinates must survive the digit rule.
assert(
  proposeRepair('A(x1, y1) = B(x2, y2)') === null,
  'coordinates with subscripts are not "exponents"',
);

section('the edit budget');

// A rule that rewrites most of the string is inventing a question.
const heavy = 'x°y°z°w°';
const hv = proposeRepair(heavy);
assert(hv === null, 'a proposal that rewrites too much is withheld');

section('the repaired text actually validates better');

// The point of the whole module: the proposal must move the verdict, or it
// bought the student nothing.
const before = validateTranscription({ ocr: machineRead(misread) });
const after = validateTranscription({ ocr: machineRead(fix!.text) });
console.log(`      → confidence ${before.confidence.toFixed(2)} → ${after.confidence.toFixed(2)}`);
assert(after.confidence > before.confidence, 'the proposal raises recognition confidence');
assert(
  !after.issues.some((i) => i.message.includes('מעלות')),
  'and the degree-sign complaint is gone',
);

console.log(`\n${failures === 0 ? '✅' : '❌'}  ${checks - failures}/${checks} passed`);
process.exitCode = failures === 0 ? 0 : 1;
