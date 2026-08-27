// ============================================================
// mathscan/ocr/mathpix-engine.ts — purpose-built maths OCR.
// ============================================================
//
// The engine `ocr/index.ts` has been anticipating since it was written: its
// header says adding "a hosted MathPix-style service" means one file
// implementing `OcrEngine` and nothing else changing. This is that file.
//
// ── Why it goes FIRST in the paid chain ───────────────────────────────
// The other two engines read maths as a side effect of reading text.
// Tesseract is a general OCR with a Hebrew model; Claude vision is a language
// model looking at a picture. Mathpix is trained on mathematical notation, and
// returns the formulas as LaTeX rather than as characters that happen to look
// like a formula.
//
// That distinction is the whole bug from 2026-08-26. A printed 5-unit question
// came back from the local chain as `ua = f(x)`, `NNN`, `DY`, `ON, 8.` and
// `% שר` — 58% confidence, "readable but risky", and the subscripts, fraction
// bars and exponents simply gone. Every downstream stage was then working on a
// question that did not exist.
//
// ── Cost ───────────────────────────────────────────────────────────────
// $0.002 per request for the first million (mathpix.com/docs/convert/billing),
// against ~$0.0032 for the claude-haiku-4-5 transcribe it displaces. So the
// accurate engine is also the cheaper one.
//
// ⚠️ NOT ALWAYS $0.002. Mathpix bills an image with more than 12 rows of text
// at the PDF page rate, and a full bagrut question with five sections is well
// over 12 rows. Treat $0.002 as the floor, not the price, until the console
// shows real invoices — which is why `costUsd` below is reported from the
// server response when it sends one rather than hard-coded here.
//
// ── Why the key is not in this file ───────────────────────────────────
// This runs in the browser. `MATHPIX_APP_ID` / `MATHPIX_APP_KEY` are server
// env vars, so the request goes to our own route and the route calls Mathpix.
// Same shape as `vision-engine.ts` — no engine in this directory has ever
// held a credential and none should start.

import type { OcrEngine, OcrResult, OcrRunOptions, PreprocessedImage } from '../types';
import { VisionOcrError } from './vision-engine';

/** Published floor rate, checked 2026-08-26. Used only when the server does
 *  not report an actual figure. */
const MATHPIX_USD_PER_REQUEST = 0.002;

export const mathpixEngine: OcrEngine = {
  id: 'mathpix',
  label: 'זיהוי נוסחאות (Mathpix)',
  paid: true,

  async isAvailable(): Promise<boolean> {
    // Whether the key is configured is a SERVER fact, and probing it from
    // here would cost a round trip on every scan to learn something the
    // server can just tell us when asked. So this only answers "can we make
    // requests at all"; an unconfigured key comes back as 503 from the route
    // and the chain moves on to the next engine. Failing over is the
    // behaviour we want anyway — a missing key must degrade to Claude vision,
    // never take the scan down.
    return typeof fetch === 'function';
  },

  async recognize(image: PreprocessedImage, opts: OcrRunOptions = {}): Promise<OcrResult> {
    const started = performance.now();
    opts.onProgress?.({ progress: 0.1, stage: 'recognizing' });

    const form = new FormData();
    form.append('image', image.blob, 'question.jpg');
    form.append('mode', 'transcribe');
    form.append('engine', 'mathpix');

    const res = await fetch('/api/scan-solve', {
      method: 'POST',
      body: form,
      signal: opts.signal,
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const message = typeof data.error === 'string' ? data.error : 'זיהוי הנוסחאות נכשל';
      throw new VisionOcrError(message, res.status, data);
    }
    if (typeof data.error === 'string' && data.error) {
      throw new VisionOcrError(data.error, 200, data);
    }

    const text = typeof data.transcribedQuestion === 'string' ? data.transcribedQuestion : '';
    if (!text.trim()) {
      throw new VisionOcrError('לא זוהה טקסט בתמונה', 200, data);
    }

    /**
     * Mathpix returns its own 0..1 confidence. Prefer it over a constant:
     * `vision-engine` has to invent 0.95 because a language model reports no
     * confidence at all, and that invented number is what let a bad read sail
     * past the validator. A real figure here means the `review` gate in
     * pipeline.ts is deciding on evidence.
     */
    const reported = typeof data.confidence === 'number' ? data.confidence : null;
    const meanConfidence = reported === null ? 0.9 : Math.max(0, Math.min(1, reported));

    opts.onProgress?.({ progress: 1, stage: 'done' });

    return {
      engine: 'mathpix',
      text,
      lines: text
        .split('\n')
        .filter(Boolean)
        .map((line) => ({ text: line, confidence: meanConfidence })),
      meanConfidence,
      durationMs: Math.round(performance.now() - started),
      costUsd: typeof data.costUsd === 'number' ? data.costUsd : MATHPIX_USD_PER_REQUEST,
    };
  },
};
