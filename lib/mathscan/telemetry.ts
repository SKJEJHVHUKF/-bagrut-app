// ============================================================
// mathscan/telemetry.ts — the OCR failure log.
// ============================================================
//
// Every scan that the local engine could not read is worth more than the
// scan itself: it is a labelled example of where the free path breaks, and
// the free path is the whole cost argument. Without this log, "improve the
// OCR later" is a wish; with it, it is a worklist.
//
// Privacy first, because the input is a photo of a minor's homework:
//   · the IMAGE is never stored, anywhere — only the text that came out
//   · the log lives in the student's own localStorage
//   · the optional Supabase mirror carries no user id and no image, and is
//     off unless the table exists (every call degrades to a no-op)
//
// What we keep is the transcription, the confidence, which issues fired,
// and which stage finally answered. That is enough to reproduce a failure
// class without holding anything personal.

import type { MathDomain, ProblemKind, Validation } from './types';

const STORAGE_KEY = 'bagrut.mathscan.errors.v1';
const MAX_ENTRIES = 60;

export type ScanErrorKind =
  /** Local OCR ran but the validator refused the output. */
  | 'ocr-rejected'
  /** OCR was fine; the classifier could not name the problem. */
  | 'classify-failed'
  /** Classified, but no engine could solve it. */
  | 'solve-unsupported'
  /** An engine threw. */
  | 'solve-error'
  /** The paid fallback itself failed. */
  | 'fallback-failed'
  /** Preprocessing or the OCR engine failed to load at all. */
  | 'pipeline-error';

export type ScanErrorEntry = {
  id: string;
  createdAt: number;
  kind: ScanErrorKind;
  /** What the OCR produced, truncated. Never an image. */
  transcription: string;
  confidence: number;
  /** Validation issue codes that fired, for grouping. */
  issues: string[];
  problemKind?: ProblemKind;
  domain?: MathDomain;
  /** Engine reason, when there is one. */
  reason?: string;
  /** Did the scan eventually succeed by another route? */
  recoveredBy?: 'library' | 'cache' | 'ai' | 'manual' | null;
};

const MAX_TRANSCRIPTION_CHARS = 400;

export function logScanError(entry: Omit<ScanErrorEntry, 'id' | 'createdAt'>): ScanErrorEntry {
  const full: ScanErrorEntry = {
    ...entry,
    transcription: (entry.transcription ?? '').slice(0, MAX_TRANSCRIPTION_CHARS),
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  if (typeof window === 'undefined') return full;
  try {
    const all = readScanErrors();
    all.unshift(full);
    if (all.length > MAX_ENTRIES) all.length = MAX_ENTRIES;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Logging must never be the thing that breaks a scan.
  }
  return full;
}

export function readScanErrors(): ScanErrorEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScanErrorEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearScanErrors(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

/** Failure classes, most frequent first — the actual worklist for improving
 *  the local path. */
export function summarizeScanErrors(entries: ScanErrorEntry[] = readScanErrors()): {
  kind: ScanErrorKind;
  count: number;
  topIssues: { code: string; count: number }[];
}[] {
  const byKind = new Map<ScanErrorKind, ScanErrorEntry[]>();
  for (const entry of entries) {
    const list = byKind.get(entry.kind) ?? [];
    list.push(entry);
    byKind.set(entry.kind, list);
  }
  return [...byKind.entries()]
    .map(([kind, list]) => {
      const issueCounts = new Map<string, number>();
      for (const entry of list) {
        for (const code of entry.issues) {
          issueCounts.set(code, (issueCounts.get(code) ?? 0) + 1);
        }
      }
      return {
        kind,
        count: list.length,
        topIssues: [...issueCounts.entries()]
          .map(([code, count]) => ({ code, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3),
      };
    })
    .sort((a, b) => b.count - a.count);
}

/** Turn a validation result into the log's issue-code list. */
export function issueCodes(validation: Validation): string[] {
  return validation.issues.map((issue) => issue.code);
}
