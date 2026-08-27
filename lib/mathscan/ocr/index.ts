// ============================================================
// mathscan/ocr/index.ts — the OCR engine registry.
// ============================================================
//
// The pipeline never imports an engine directly. It asks for a chain and
// walks it in order: free engines first, paid ones only if allowed and only
// after the free ones have been tried and validated.
//
// Adding a math-trained model later (a Texify/pix2tex ONNX checkpoint, a
// TrOCR export, a hosted MathPix-style service) means writing one file that
// implements `OcrEngine` and inserting it into FREE_CHAIN or PAID_CHAIN.
// Nothing else in the app changes — that is the point of the interface.

import type { OcrEngine, OcrEngineId } from '../types';
import { tesseractEngine } from './tesseract-engine';
import { mathpixEngine } from './mathpix-engine';
import { visionEngine } from './vision-engine';

/** Runs on the student's device. $0, always tried first. */
const FREE_CHAIN: OcrEngine[] = [tesseractEngine];

/**
 * Costs money. Reached only on a validated failure of the free chain, and
 * tried IN ORDER — the pipeline walks this list rather than taking the first
 * entry, so a Mathpix outage or a missing key degrades to Claude vision
 * instead of failing the scan.
 *
 * Mathpix first: it is trained on mathematical notation and returns formulas
 * as LaTeX, where Claude vision is a language model inferring a formula from
 * pixels. It is also cheaper ($0.002/request against ~$0.0032), so the order
 * needs no cost/accuracy trade-off argument — it wins on both.
 */
const PAID_CHAIN: OcrEngine[] = [mathpixEngine, visionEngine];

export type OcrChainOptions = {
  /** Whether the caller is permitted to spend money on this scan. */
  allowPaid: boolean;
};

/**
 * The ordered list of engines to try for this scan, with unavailable ones
 * already filtered out. Availability is probed concurrently — a missing
 * /public asset must not add latency to the engines that are fine.
 */
export async function buildOcrChain(opts: OcrChainOptions): Promise<OcrEngine[]> {
  const candidates = opts.allowPaid ? [...FREE_CHAIN, ...PAID_CHAIN] : [...FREE_CHAIN];
  const availability = await Promise.all(
    candidates.map((engine) =>
      engine
        .isAvailable()
        .catch(() => false)
    )
  );
  return candidates.filter((_, i) => availability[i]);
}

/** Look up a specific engine — used by the "warm up the OCR while the
 *  student frames the shot" prefetch on the capture screen. */
export function getOcrEngine(id: OcrEngineId): OcrEngine | null {
  return [...FREE_CHAIN, ...PAID_CHAIN].find((e) => e.id === id) ?? null;
}

/** Release wasm workers. Called when /scan unmounts, so a student who opens
 *  the scanner and navigates away doesn't hold ~40 MB of wasm heap. */
export async function disposeOcrEngines(): Promise<void> {
  await Promise.all(
    [...FREE_CHAIN, ...PAID_CHAIN].map((e) => (e.dispose ? e.dispose().catch(() => {}) : null))
  );
}

export { tesseractEngine, visionEngine };
export { VisionOcrError } from './vision-engine';
