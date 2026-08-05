// ============================================================
// mathscan/preprocess.ts — image cleanup, 100% on the student's device.
// ============================================================
//
// Runs in the browser on a <canvas>. Zero network, zero cost, ~150-400 ms on
// a mid-range phone. Two reasons it exists, and the second one is the one
// that pays for the feature:
//
//   1. Local OCR is far more accurate on a deskewed, contrast-normalised,
//      speckle-free, tightly-cropped image than on a raw phone photo.
//   2. When we DO fall back to the paid vision model, the cropped +
//      downscaled image costs less. Anthropic bills images at roughly
//      (width × height) / 750 tokens, so cropping a 4032×3024 phone photo
//      down to a 1400×900 question block takes ~16,250 image tokens to
//      ~1,680 — about a 90% cut on the most expensive part of the fallback.
//      `PreprocessedImage.estimatedVisionTokens` reports that number.
//
// The chain: downscale → grayscale → contrast stretch → denoise → deskew →
// crop to the question block → (optional) adaptive binarize.
//
// Everything is a pure function over Uint8ClampedArray luminance planes, so
// the individual stages are unit-testable without a DOM (see
// scripts/test-mathscan.ts).

import type {
  PreprocessedImage,
  PreprocessOperation,
  PreprocessOptions,
} from './types';

// ------------------------------------------------------------
// Tunables — every one of these is a measured trade-off, not a guess.
// ------------------------------------------------------------

/** Longest edge fed to OCR + the vision fallback. 1400 keeps 10pt print
 *  readable after a typical 1-metre phone shot; going higher stopped
 *  improving Tesseract and only raised the vision token count. */
const DEFAULT_MAX_DIM = 1400;

/** Skew is estimated on a small copy — the angle is a global property, so a
 *  600px-wide thumbnail gives the same answer ~20× faster. */
const SKEW_ESTIMATE_WIDTH = 600;

/** Search ±12°. A photo skewed more than that is a framing problem the
 *  student should re-shoot, and a wider search costs time for nothing. */
const SKEW_MAX_DEGREES = 12;
const SKEW_COARSE_STEP = 1;
const SKEW_FINE_STEP = 0.2;

/** Below this the deskew rotation isn't worth the resampling blur. */
const SKEW_MIN_APPLY_DEGREES = 0.35;

/** Contrast stretch percentiles — robust to a dark page corner or a glare
 *  spot, which a naive min/max stretch would let dominate. */
const CONTRAST_LOW_PCT = 0.02;
const CONTRAST_HIGH_PCT = 0.98;

/** A row/column is "content" once this fraction of it is ink. Kills the
 *  page-edge shadow and the notebook's ruled margin. */
const CROP_INK_ROW_RATIO = 0.004;

/** Padding kept around the detected block, as a fraction of the shorter
 *  edge — cutting a question's descenders is worse than a little slack. */
const CROP_PADDING_RATIO = 0.02;

/** Sauvola window + k. 15/0.34 is the standard document-imaging setting and
 *  handles a phone photo's uneven lighting far better than global Otsu. */
const SAUVOLA_WINDOW = 15;
const SAUVOLA_K = 0.34;

/** Anthropic image token estimate: tokens ≈ (w × h) / 750. */
export function estimateVisionTokens(width: number, height: number): number {
  return Math.ceil((width * height) / 750);
}

// ------------------------------------------------------------
// A luminance plane — the working representation for every stage.
// ------------------------------------------------------------

export type Plane = {
  data: Uint8ClampedArray; // one byte per pixel, 0 = black
  width: number;
  height: number;
};

function makePlane(width: number, height: number): Plane {
  return { data: new Uint8ClampedArray(width * height), width, height };
}

// ------------------------------------------------------------
// 1. Grayscale
// ------------------------------------------------------------

/** ITU-R BT.601 luma. Chosen over a plain average because pen ink is often
 *  blue and the average washes blue-on-white out. */
export function toGrayscale(rgba: Uint8ClampedArray, width: number, height: number): Plane {
  const plane = makePlane(width, height);
  for (let i = 0, p = 0; p < width * height; i += 4, p++) {
    plane.data[p] = (rgba[i] * 299 + rgba[i + 1] * 587 + rgba[i + 2] * 114) / 1000;
  }
  return plane;
}

// ------------------------------------------------------------
// 2. Contrast — percentile stretch
// ------------------------------------------------------------

/** Linearly remap [p2, p98] onto [0, 255]. Returns the plane unchanged when
 *  the image is already full-range (nothing to gain, and re-stretching an
 *  already-binary scan would amplify JPEG ringing). */
export function stretchContrast(plane: Plane): { plane: Plane; applied: boolean } {
  const hist = new Uint32Array(256);
  for (let i = 0; i < plane.data.length; i++) hist[plane.data[i]]++;

  const total = plane.data.length;
  const lowTarget = total * CONTRAST_LOW_PCT;
  const highTarget = total * CONTRAST_HIGH_PCT;

  let acc = 0;
  let lo = 0;
  let hi = 255;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= lowTarget) {
      lo = v;
      break;
    }
  }
  acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= highTarget) {
      hi = v;
      break;
    }
  }

  // Degenerate or already-full range → leave it alone.
  if (hi - lo < 12) return { plane, applied: false };
  if (lo <= 3 && hi >= 252) return { plane, applied: false };

  const scale = 255 / (hi - lo);
  const out = makePlane(plane.width, plane.height);
  for (let i = 0; i < plane.data.length; i++) {
    out.data[i] = (plane.data[i] - lo) * scale;
  }
  return { plane: out, applied: true };
}

// ------------------------------------------------------------
// 3. Denoise — 3×3 median
// ------------------------------------------------------------

/** Median beats a Gaussian blur here: it removes sensor speckle and JPEG
 *  mosquito noise without softening stroke edges, which is exactly what an
 *  OCR engine's character segmentation cares about. */
export function medianDenoise(plane: Plane): Plane {
  const { width: w, height: h, data } = plane;
  const out = makePlane(w, h);
  const win = new Uint8Array(9);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Border pixels: copy through rather than clamp-sample; a 1px frame
      // has no effect on OCR and clamping creates fake edges.
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        out.data[y * w + x] = data[y * w + x];
        continue;
      }
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const row = (y + dy) * w;
        for (let dx = -1; dx <= 1; dx++) win[n++] = data[row + x + dx];
      }
      // Insertion sort of 9 elements — faster than Array#sort at this size.
      for (let i = 1; i < 9; i++) {
        const v = win[i];
        let j = i - 1;
        while (j >= 0 && win[j] > v) {
          win[j + 1] = win[j];
          j--;
        }
        win[j + 1] = v;
      }
      out.data[y * w + x] = win[4];
    }
  }
  return out;
}

// ------------------------------------------------------------
// 4. Deskew — shear-projection profile search
// ------------------------------------------------------------

/**
 * Score how well the image's text lines align with the horizontal axis at a
 * given shear. Text rows produce a spiky row-sum profile when level and a
 * smeared one when tilted, so the variance of the profile peaks at the
 * correct angle. We shear-sample instead of rotating, which keeps the whole
 * search allocation-free.
 */
function projectionScore(plane: Plane, tan: number): number {
  const { width: w, height: h, data } = plane;
  const rows = new Float64Array(h);
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = 0; x < w; x++) {
      const yy = y + Math.round((x - w / 2) * tan);
      if (yy < 0 || yy >= h) continue;
      // Ink = darkness.
      sum += 255 - data[yy * w + x];
    }
    rows[y] = sum;
  }
  // Sum of squared row-to-row differences: maximal when rows alternate
  // sharply between "text" and "gap".
  let score = 0;
  for (let y = 1; y < h; y++) {
    const d = rows[y] - rows[y - 1];
    score += d * d;
  }
  return score;
}

/** Estimate skew in degrees. Positive means the image must be rotated by
 *  `+angle` (counter-clockwise) to level it. */
export function estimateSkew(plane: Plane): number {
  const small = resamplePlane(plane, SKEW_ESTIMATE_WIDTH);

  let best = 0;
  let bestScore = -Infinity;
  for (let a = -SKEW_MAX_DEGREES; a <= SKEW_MAX_DEGREES; a += SKEW_COARSE_STEP) {
    const s = projectionScore(small, Math.tan((a * Math.PI) / 180));
    if (s > bestScore) {
      bestScore = s;
      best = a;
    }
  }
  // Refine around the coarse winner.
  const lo = best - SKEW_COARSE_STEP;
  const hi = best + SKEW_COARSE_STEP;
  for (let a = lo; a <= hi; a += SKEW_FINE_STEP) {
    const s = projectionScore(small, Math.tan((a * Math.PI) / 180));
    if (s > bestScore) {
      bestScore = s;
      best = a;
    }
  }
  return Math.round(best * 100) / 100;
}

/** Nearest-neighbour resample to a target width (keeps aspect). Used only
 *  for the skew estimate, where interpolation quality is irrelevant. */
function resamplePlane(plane: Plane, targetWidth: number): Plane {
  if (plane.width <= targetWidth) return plane;
  const scale = targetWidth / plane.width;
  const w = targetWidth;
  const h = Math.max(1, Math.round(plane.height * scale));
  const out = makePlane(w, h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(plane.height - 1, Math.floor(y / scale));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(plane.width - 1, Math.floor(x / scale));
      out.data[y * w + x] = plane.data[sy * plane.width + sx];
    }
  }
  return out;
}

// ------------------------------------------------------------
// 5. Binarize — Sauvola adaptive threshold
// ------------------------------------------------------------

/**
 * Sauvola: threshold(x,y) = mean · (1 + k · (stddev/128 − 1)), computed over
 * a local window via integral images so it stays O(pixels) regardless of
 * window size. Handles the shadow-across-half-the-page case that a single
 * global threshold turns into a black blob.
 */
export function sauvolaBinarize(plane: Plane, window = SAUVOLA_WINDOW, k = SAUVOLA_K): Plane {
  const { width: w, height: h, data } = plane;
  const out = makePlane(w, h);

  // Integral images of value and value², padded by one row/col.
  const iw = w + 1;
  const sum = new Float64Array(iw * (h + 1));
  const sumSq = new Float64Array(iw * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    let rowSumSq = 0;
    for (let x = 0; x < w; x++) {
      const v = data[y * w + x];
      rowSum += v;
      rowSumSq += v * v;
      sum[(y + 1) * iw + (x + 1)] = sum[y * iw + (x + 1)] + rowSum;
      sumSq[(y + 1) * iw + (x + 1)] = sumSq[y * iw + (x + 1)] + rowSumSq;
    }
  }

  const r = Math.max(1, Math.floor(window / 2));
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);
      const area = (y1 - y0 + 1) * (x1 - x0 + 1);

      const s =
        sum[(y1 + 1) * iw + (x1 + 1)] -
        sum[y0 * iw + (x1 + 1)] -
        sum[(y1 + 1) * iw + x0] +
        sum[y0 * iw + x0];
      const sq =
        sumSq[(y1 + 1) * iw + (x1 + 1)] -
        sumSq[y0 * iw + (x1 + 1)] -
        sumSq[(y1 + 1) * iw + x0] +
        sumSq[y0 * iw + x0];

      const mean = s / area;
      const variance = Math.max(0, sq / area - mean * mean);
      const std = Math.sqrt(variance);
      const threshold = mean * (1 + k * (std / 128 - 1));
      out.data[y * w + x] = data[y * w + x] > threshold ? 255 : 0;
    }
  }
  return out;
}

// ------------------------------------------------------------
// 6. Crop — find the question block
// ------------------------------------------------------------

export type CropBox = { x: number; y: number; width: number; height: number };

/**
 * Locate the block of text to keep.
 *
 * Two passes, because "bounding box of all dark pixels" is wrong on a real
 * photo — the desk, a shadow, or the facing page all count as dark:
 *   1. Row/column ink profiles on the BINARIZED plane, thresholded at
 *      CROP_INK_ROW_RATIO, give the rows/cols that actually carry writing.
 *   2. Rows are grouped into bands separated by gaps larger than a text
 *      line, and we keep the band-group holding the most ink. That is what
 *      isolates the question from a page number or a neighbouring exercise.
 */
export function detectContentBox(binary: Plane): CropBox {
  const { width: w, height: h, data } = binary;

  const rowInk = new Float64Array(h);
  const colInk = new Float64Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] < 128) {
        rowInk[y]++;
        colInk[x]++;
      }
    }
  }

  const rowThreshold = w * CROP_INK_ROW_RATIO;
  const colThreshold = h * CROP_INK_ROW_RATIO;

  // --- pass 1: inked rows → one band per text line ---
  const lines: { start: number; end: number; ink: number }[] = [];
  let start = -1;
  for (let y = 0; y <= h; y++) {
    const inked = y < h && rowInk[y] > rowThreshold;
    if (inked && start === -1) start = y;
    if (!inked && start !== -1) {
      lines.push({ start, end: y, ink: 0 });
      start = -1;
    }
  }
  if (lines.length === 0) {
    return { x: 0, y: 0, width: w, height: h };
  }
  for (const line of lines) {
    let ink = 0;
    for (let y = line.start; y < line.end; y++) ink += rowInk[y];
    line.ink = ink;
  }

  // --- pass 2: group the lines into blocks ---
  //
  // The gap threshold is measured in TEXT-LINE HEIGHTS, not as a fraction of
  // the image. That distinction is the whole fix: an earlier version used
  // 3.5% of the image height, so on a 420px-tall photo any gap over ~15px
  // split the block — and the ordinary spacing between "פתור את המשוואה:" and
  // the equation under it is far more than that. The result was a crop
  // containing ONLY the equation, with the Hebrew instruction discarded. That
  // instruction is the classifier's strongest signal, so losing it silently
  // turns "solve the equation" into "evaluate this expression".
  const heights = lines.map((line) => line.end - line.start).sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)] || 10;
  const maxInnerGap = Math.max(8, Math.round(medianHeight * 2.5));

  const blocks: { start: number; end: number; ink: number }[] = [];
  for (const line of lines) {
    const previous = blocks[blocks.length - 1];
    if (previous && line.start - previous.end <= maxInnerGap) {
      previous.end = line.end;
      previous.ink += line.ink;
    } else {
      blocks.push({ ...line });
    }
  }

  // --- pass 3: keep the heaviest block, but only when it clearly dominates ---
  let chosen = blocks[0];
  for (const block of blocks) if (block.ink > chosen.ink) chosen = block;

  const totalInk = blocks.reduce((acc, block) => acc + block.ink, 0);
  let top = chosen.start;
  let bottom = chosen.end;
  // Dropping content is only safe when what remains is almost everything.
  // Below 60% we are discarding a real part of the question, so keep the
  // full ink extent — a slightly loose crop costs a few vision tokens, a
  // tight wrong one costs the answer.
  if (chosen.ink < totalInk * 0.6) {
    top = blocks[0].start;
    bottom = blocks[blocks.length - 1].end;
  }

  // Column extent, measured only inside the chosen rows.
  let left = w;
  let right = 0;
  for (let x = 0; x < w; x++) {
    let ink = 0;
    for (let y = top; y < bottom; y++) if (data[y * w + x] < 128) ink++;
    if (ink > colThreshold) {
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (left >= right) {
    left = 0;
    right = w - 1;
  }

  const pad = Math.round(Math.min(w, h) * CROP_PADDING_RATIO);
  const x = Math.max(0, left - pad);
  const y = Math.max(0, top - pad);
  const x2 = Math.min(w, right + 1 + pad);
  const y2 = Math.min(h, bottom + pad);
  return { x, y, width: Math.max(1, x2 - x), height: Math.max(1, y2 - y) };
}

// ------------------------------------------------------------
// 7. Canvas plumbing (browser only)
// ------------------------------------------------------------

function assertBrowser(): void {
  if (typeof document === 'undefined') {
    throw new Error('mathscan/preprocess runs in the browser only');
  }
}

async function loadBitmap(source: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // `imageOrientation: 'from-image'` applies the EXIF rotation a phone
      // records instead of baking it into the pixels — without it a portrait
      // shot arrives sideways and every downstream stage is wrong.
      return await createImageBitmap(source, { imageOrientation: 'from-image' });
    } catch {
      // Safari < 17 rejects the options bag; fall through to <img>.
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('לא הצלחנו לפתוח את התמונה'));
    };
    img.src = url;
  });
}

function planeToCanvas(plane: Plane): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = plane.width;
  canvas.height = plane.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  const img = ctx.createImageData(plane.width, plane.height);
  for (let p = 0, i = 0; p < plane.data.length; p++, i += 4) {
    const v = plane.data[p];
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))),
      'image/jpeg',
      quality
    );
  });
}

// ------------------------------------------------------------
// 8. The chain
// ------------------------------------------------------------

export type PreprocessOutput = {
  /** Grayscale, deskewed, cropped — what the vision fallback should see.
   *  A vision model reads a grayscale photo better than a hard 1-bit one. */
  forVision: PreprocessedImage;
  /** Same geometry, additionally binarized — what Tesseract should see. */
  forOcr: PreprocessedImage;
};

/**
 * Run the full preprocessing chain on a captured file.
 * Browser-only. Never throws for a merely-difficult photo: if a stage can't
 * improve the image it is skipped and recorded as skipped, so a weird input
 * degrades to "downscaled original" instead of failing the scan.
 */
export async function preprocessImage(
  file: Blob,
  options: PreprocessOptions = {}
): Promise<PreprocessOutput> {
  assertBrowser();
  const maxDim = options.maxDimension ?? DEFAULT_MAX_DIM;

  const bitmap = await loadBitmap(file);
  const srcW = 'width' in bitmap ? bitmap.width : 0;
  const srcH = 'height' in bitmap ? bitmap.height : 0;
  if (!srcW || !srcH) throw new Error('התמונה ריקה או פגומה');

  const operations: PreprocessOperation[] = [];

  // --- downscale (also the only stage that touches colour) ---
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const base = document.createElement('canvas');
  base.width = w;
  base.height = h;
  const baseCtx = base.getContext('2d', { willReadFrequently: true });
  if (!baseCtx) throw new Error('Canvas 2D context unavailable');
  baseCtx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);
  if (scale < 1) operations.push('downscale');
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  const rgba = baseCtx.getImageData(0, 0, w, h).data;

  // --- grayscale ---
  let plane = toGrayscale(rgba, w, h);
  operations.push('grayscale');

  // --- contrast ---
  const contrast = stretchContrast(plane);
  plane = contrast.plane;
  if (contrast.applied) operations.push('contrast');

  // --- denoise ---
  plane = medianDenoise(plane);
  operations.push('denoise');

  // --- deskew ---
  let skewDegrees = 0;
  if (!options.skipDeskew) {
    skewDegrees = estimateSkew(plane);
    if (Math.abs(skewDegrees) >= SKEW_MIN_APPLY_DEGREES) {
      // Rotate through the canvas so we get bilinear resampling for free —
      // a hand-rolled nearest-neighbour rotation visibly serrates thin
      // strokes, which is exactly what OCR chokes on.
      const gray = planeToCanvas(plane);
      const rot = document.createElement('canvas');
      rot.width = w;
      rot.height = h;
      const rctx = rot.getContext('2d', { willReadFrequently: true });
      if (rctx) {
        rctx.fillStyle = '#ffffff';
        rctx.fillRect(0, 0, w, h);
        rctx.translate(w / 2, h / 2);
        rctx.rotate((-skewDegrees * Math.PI) / 180);
        rctx.drawImage(gray, -w / 2, -h / 2);
        const rotated = rctx.getImageData(0, 0, w, h).data;
        plane = toGrayscale(rotated, w, h);
        operations.push('deskew');
      }
    } else {
      skewDegrees = 0;
    }
  }

  // --- crop (decided on a binarized copy, applied to the grayscale) ---
  const binaryFull = sauvolaBinarize(plane);
  const box = detectContentBox(binaryFull);
  const cropped = cropPlane(plane, box);
  const croppedBinary = cropPlane(binaryFull, box);
  const cropRatio = (box.width * box.height) / (w * h);
  if (cropRatio < 0.985) operations.push('crop');

  // --- encode both variants ---
  const visionCanvas = planeToCanvas(cropped);
  const visionBlob = await canvasToBlob(visionCanvas, 0.9);
  const ocrCanvas = planeToCanvas(croppedBinary);
  const ocrBlob = await canvasToBlob(ocrCanvas, 0.95);

  const shared = {
    width: cropped.width,
    height: cropped.height,
    operations,
    skewDegrees,
    cropRatio,
    estimatedVisionTokens: estimateVisionTokens(cropped.width, cropped.height),
  };

  return {
    forVision: {
      ...shared,
      dataUrl: visionCanvas.toDataURL('image/jpeg', 0.9),
      blob: visionBlob,
      byteLength: visionBlob.size,
    },
    forOcr: {
      ...shared,
      operations: [...operations, 'binarize'],
      dataUrl: ocrCanvas.toDataURL('image/jpeg', 0.95),
      blob: ocrBlob,
      byteLength: ocrBlob.size,
    },
  };
}

export function cropPlane(plane: Plane, box: CropBox): Plane {
  const out = makePlane(box.width, box.height);
  for (let y = 0; y < box.height; y++) {
    const src = (box.y + y) * plane.width + box.x;
    out.data.set(plane.data.subarray(src, src + box.width), y * box.width);
  }
  return out;
}
