/**
 * parent-link.ts — the token behind the weekly parent link. SERVER ONLY: it
 * derives its key from SUPABASE_SERVICE_ROLE_KEY.
 *
 * Stateless on purpose — no table, nothing for anyone to run in the dashboard.
 * The token names the student, who issued it, and a version, and is signed:
 *
 *   token = b64url(uuid) . <s|t><version> . b64url(HMAC_SHA256(key, `${uuid}.<s|t><version>`))
 *   key   = HMAC_SHA256(SUPABASE_SERVICE_ROLE_KEY, 'parent-link-v1')
 *
 * TWO ISSUERS, TWO VERSIONS (Itay, 2026-09-14): the student's own link (`s`,
 * app_metadata.parent_link_v) and the one his teacher sends home (`t`,
 * app_metadata.parent_link_teacher_v). A student who replaces HIS link must not
 * be able to silently kill the report his teacher sent. app_metadata is
 * service-role-writable only, so no browser can reset either version. Revoking
 * writes version + 1 for that issuer, and every older link of that issuer stops
 * matching.
 *
 * ⚠️ parseParentToken checks the MAC before the caller touches a database, and
 * returns null for EVERY failure, never a reason — the page must show one
 * neutral screen for a forged token, a revoked one and a deleted user alike.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { SITE_URL } from '@/lib/site';
import { isUuid } from '@/lib/school-guard';

export type ParentLinkKind = 'self' | 'teacher';

const LETTER: Record<ParentLinkKind, 's' | 't'> = { self: 's', teacher: 't' };
const FIELD: Record<ParentLinkKind, string> = {
  self: 'parent_link_v',
  teacher: 'parent_link_teacher_v',
};

/** Digits only, no leading zeros, well inside Number's safe range. */
const VERSION_RE = /^(0|[1-9]\d{0,8})$/;
/** The middle part: the issuer's letter, then the version. */
const KIND_VERSION_RE = /^([st])(0|[1-9]\d{0,8})$/;
/** A real token is ~95 chars. Anything much longer is rejected unread. */
const MAX_TOKEN_LENGTH = 200;

function mac(userId: string, kindVersion: string): Buffer {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  const key = createHmac('sha256', secret).update('parent-link-v1').digest();
  return createHmac('sha256', key).update(`${userId}.${kindVersion}`).digest();
}

export function signParentToken(userId: string, kind: ParentLinkKind, version: number): string {
  if (!isUuid(userId) || (kind !== 'self' && kind !== 'teacher') || !VERSION_RE.test(String(version))) {
    throw new Error('signParentToken: bad user id, kind or version');
  }
  const id = Buffer.from(userId, 'utf8').toString('base64url');
  const kindVersion = `${LETTER[kind]}${version}`;
  return `${id}.${kindVersion}.${mac(userId, kindVersion).toString('base64url')}`;
}

export function parseParentToken(
  token: unknown
): { userId: string; kind: ParentLinkKind; version: number } | null {
  if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [idPart, kindVersion, macPart] = parts;
  const kv = KIND_VERSION_RE.exec(kindVersion);
  if (!kv) return null;

  // Node's base64url decoder skips characters it does not know, so a decoded
  // value is only trusted when it re-encodes to exactly what was sent — one
  // spelling per link, no malleable variants.
  const userId = Buffer.from(idPart, 'base64url').toString('utf8');
  if (!isUuid(userId) || Buffer.from(userId, 'utf8').toString('base64url') !== idPart) return null;
  const given = Buffer.from(macPart, 'base64url');
  if (given.toString('base64url') !== macPart) return null;

  let expected: Buffer;
  try {
    expected = mac(userId, kindVersion);
  } catch {
    return null; // no key configured: fail closed, same answer as a forgery
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return { userId, kind: kv[1] === 't' ? 'teacher' : 'self', version: Number(kv[2]) };
}

/** The version a link from this issuer must carry to be live. Absent or malformed = 0. */
export function parentLinkVersion(appMetadata: unknown, kind: ParentLinkKind): number {
  const v = (appMetadata as Record<string, unknown> | null | undefined)?.[FIELD[kind]];
  return typeof v === 'number' && VERSION_RE.test(String(v)) ? v : 0;
}

/**
 * app_metadata after revoking one issuer's link. The EXISTING object is spread
 * explicitly: it also holds `pro`, `provider`, `providers` and the OTHER
 * issuer's version, and a write that dropped `pro` would silently take a paying
 * user off Pro.
 */
export function revokedParentLinkMeta(
  appMetadata: Record<string, unknown> | null | undefined,
  kind: ParentLinkKind
): Record<string, unknown> {
  return { ...(appMetadata ?? {}), [FIELD[kind]]: parentLinkVersion(appMetadata, kind) + 1 };
}

export function parentLinkUrl(token: string): string {
  return `${SITE_URL}/p/${token}`;
}
