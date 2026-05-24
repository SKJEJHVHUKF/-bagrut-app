/**
 * scans.ts — localStorage utilities for the photo-question library.
 *
 * Each scan stores the AI's structured solution plus a low-res thumbnail
 * (base64 JPEG, ~50 KB). We keep the storage in localStorage for the MVP
 * and migrate to Supabase Storage later if usage justifies the cost.
 *
 * Limits:
 *  - Max 50 scans per user (oldest pruned on insert).
 *  - Each thumbnail capped at 60 KB to stay within typical 5 MB
 *    localStorage budgets even with the full quota filled.
 */

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
const MAX_SCANS = 50;

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
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  } catch (err) {
    // QuotaExceededError — prune more aggressively and retry once.
    console.warn('scans: storage write failed, pruning to 10 most recent', err);
    const pruned = scans.slice(0, 10);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    } catch {
      // Give up; the user will have a stale list this session.
    }
  }
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
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
