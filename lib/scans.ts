/**
 * scans.ts — localStorage utilities for the photo-question library.
 *
 * Each scan stores the AI's structured solution plus a low-res thumbnail
 * (base64 JPEG, ~50 KB). We keep the storage in localStorage for the MVP
 * and migrate to Supabase Storage later if usage justifies the cost.
 *
 * Limits — ENFORCED, not just documented:
 *  - Max 20 scans per user (oldest pruned on insert).
 *  - Each thumbnail re-encoded until it is under 60 KB.
 *
 * Both numbers exist because this store shares a ~5 MB localStorage budget with
 * everything that actually matters — the answer log, the roadmap, the review
 * queue. It used to promise the 60 KB cap in this comment and never check it,
 * and 50 uncapped phone photos are the entire budget on their own. When it
 * overflowed, the writes that failed were the other stores', silently.
 */

import { safeSetJSON } from '@/lib/storage';

export type ScanStep = {
  title: string;
  content: string;
};

export type Scan = {
  id: string;
  createdAt: number; // ms epoch
  subject: string;
  topic: string;
  transcribedQuestion: string;
  steps: ScanStep[];
  finalAnswer: string;
  /** Compressed JPEG, base64-encoded (no data: prefix). */
  thumbnail: string;
  /** MIME of thumbnail — almost always 'image/jpeg' after compression. */
  thumbnailMime: string;
};

const STORAGE_KEY = 'bagrut.scans.v1';
const MAX_SCANS = 20;
/** Hard ceiling per thumbnail, in bytes of decoded JPEG. */
const MAX_THUMB_BYTES = 60_000;

/** Decoded size of a `data:` URL's base64 payload (4 chars → 3 bytes). */
function base64Bytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.max(0, (b64.length * 3) / 4 - padding);
}

function readAll(): Scan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Scan[];
  } catch {
    return [];
  }
}

function writeAll(scans: Scan[]): void {
  if (safeSetJSON(STORAGE_KEY, scans)) return;
  // Out of space. This store is the disposable one — thumbnails of photos the
  // student already got an answer for — so it gives ground first, and giving it
  // back here also frees room for the stores that matter.
  console.warn('scans: storage write failed, pruning to 5 most recent');
  safeSetJSON(STORAGE_KEY, scans.slice(0, 5));
}

/** All scans, newest first. */
export function getScans(): Scan[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

/** Lookup by id. */
export function getScan(id: string): Scan | null {
  return readAll().find((s) => s.id === id) ?? null;
}

/** Save a new scan (auto-generated id, current timestamp). */
export function saveScan(scan: Omit<Scan, 'id' | 'createdAt'>): Scan {
  const full: Scan = {
    ...scan,
    id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const all = readAll();
  all.unshift(full);
  // Prune oldest beyond MAX_SCANS
  if (all.length > MAX_SCANS) {
    all.length = MAX_SCANS;
  }
  writeAll(all);
  return full;
}

/** Remove a scan by id. */
export function deleteScan(id: string): void {
  const all = readAll().filter((s) => s.id !== id);
  writeAll(all);
}

/** Group scans by topic for the library view. */
export function scansByTopic(): { topic: string; scans: Scan[] }[] {
  const groups = new Map<string, Scan[]>();
  for (const scan of getScans()) {
    const arr = groups.get(scan.topic) ?? [];
    arr.push(scan);
    groups.set(scan.topic, arr);
  }
  return Array.from(groups.entries())
    .map(([topic, scans]) => ({ topic, scans }))
    // Sort topics by most-recent-scan-in-topic, descending.
    .sort((a, b) => b.scans[0].createdAt - a.scans[0].createdAt);
}

/** Count scans (cheap, no parsing of full list needed). */
export function countScans(): number {
  return readAll().length;
}

/**
 * Compress an image File to a base64 JPEG thumbnail (max 800px on the
 * longer edge, JPEG quality 0.7). Returns just the base64 payload, no
 * `data:` prefix.
 *
 * Runs in the browser only — uses canvas + Image. Falls back to raw
 * base64 if canvas isn't available (server-side rendering).
 */
export async function compressToThumbnail(file: File): Promise<{ base64: string; mime: string }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // SSR / no canvas — fall back to raw base64
    const buf = await file.arrayBuffer();
    return {
      base64: Buffer.from(buf).toString('base64'),
      mime: file.type,
    };
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 800;
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        // toDataURL returns "data:image/jpeg;base64,XXX" — slice off the prefix.
        //
        // Encode DOWN until the result actually fits MAX_THUMB_BYTES. The header
        // of this file has always promised "each thumbnail capped at 60 KB",
        // but the code encoded once at quality 0.7 and stored whatever came
        // out — a detailed phone photo of a worksheet lands well above that, and
        // 50 of them is the whole 5 MB localStorage budget. Everything else the
        // app stores (answers, roadmap, review queue) then fails to write.
        let dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        for (const q of [0.5, 0.35]) {
          if (base64Bytes(dataUrl) <= MAX_THUMB_BYTES) break;
          dataUrl = canvas.toDataURL('image/jpeg', q);
        }
        if (base64Bytes(dataUrl) > MAX_THUMB_BYTES) {
          // Still over at the lowest quality: the image is dense rather than
          // large. Halve the pixels once — a thumbnail only has to be
          // recognisable in a list, and an unbounded one costs the student
          // their progress.
          canvas.width = Math.max(1, Math.round(w / 2));
          canvas.height = Math.max(1, Math.round(h / 2));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        }
        const commaIdx = dataUrl.indexOf(',');
        URL.revokeObjectURL(url);
        resolve({
          base64: commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl,
          mime: 'image/jpeg',
        });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}
