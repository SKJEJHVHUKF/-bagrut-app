/**
 * parent-link.ts — the token behind the weekly parent link. SERVER ONLY: it
 * derives its key from SUPABASE_SERVICE_ROLE_KEY.
 *
 * Stateless on purpose — no table, nothing for anyone to run in the dashboard.
 * The token names the student and a version, and is signed:
 *
 *   token = b64url(uuid) . version . b64url(HMAC_SHA256(key, `${uuid}.${version}`))
 *   key   = HMAC_SHA256(SUPABASE_SERVICE_ROLE_KEY, 'parent-link-v1')
 *
 * The CURRENT version lives in auth.users.app_metadata.parent_link_v (absent
 * = 0; app_metadata is service-role-writable only, so a student cannot reset
 * it). Revoking writes version + 1, and every link signed for an older version
 * stops matching. That is the whole revocation model: one integer.
 *
 * ⚠️ parseParentToken checks the MAC before the caller touches a database, and
 * returns null for EVERY failure, never a reason — the page must show one
 * neutral screen for a forged token, a revoked one and a deleted user alike.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { SITE_URL } from '@/lib/site';
import { isUuid } from '@/lib/school-guard';

/** Digits only, no leading zeros, well inside Number's safe range. */
const VERSION_RE = /^(0|[1-9]\d{0,8})$/;
/** A real token is ~94 chars. Anything much longer is rejected unread. */
const MAX_TOKEN_LENGTH = 200;

function mac(userId: string, version: number): Buffer {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  const key = createHmac('sha256', secret).update('parent-link-v1').digest();
  return createHmac('sha256', key).update(`${userId}.${version}`).digest();
}

export function signParentToken(userId: string, version: number): string {
  if (!isUuid(userId) || !VERSION_RE.test(String(version))) {
    throw new Error('signParentToken: bad user id or version');
  }
  const id = Buffer.from(userId, 'utf8').toString('base64url');
  return `${id}.${version}.${mac(userId, version).toString('base64url')}`;
}

export function parseParentToken(token: unknown): { userId: string; version: number } | null {
  if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [idPart, versionPart, macPart] = parts;
  if (!VERSION_RE.test(versionPart)) return null;

  // Node's base64url decoder skips characters it does not know, so a decoded
  // value is only trusted when it re-encodes to exactly what was sent — one
  // spelling per link, no malleable variants.
  const userId = Buffer.from(idPart, 'base64url').toString('utf8');
  if (!isUuid(userId) || Buffer.from(userId, 'utf8').toString('base64url') !== idPart) return null;
  const given = Buffer.from(macPart, 'base64url');
  if (given.toString('base64url') !== macPart) return null;

  const version = Number(versionPart);
  let expected: Buffer;
  try {
    expected = mac(userId, version);
  } catch {
    return null; // no key configured: fail closed, same answer as a forgery
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return { userId, version };
}

/** The version a link must carry to be live. Absent or malformed = 0. */
export function parentLinkVersion(appMetadata: unknown): number {
  const v = (appMetadata as { parent_link_v?: unknown } | null | undefined)?.parent_link_v;
  return typeof v === 'number' && VERSION_RE.test(String(v)) ? v : 0;
}

/**
 * app_metadata after a revoke. The EXISTING object is spread explicitly: it
 * also holds `pro`, `provider` and `providers`, and a write that dropped `pro`
 * would silently take a paying user off Pro.
 */
export function revokedParentLinkMeta(
  appMetadata: Record<string, unknown> | null | undefined
): Record<string, unknown> & { parent_link_v: number } {
  return { ...(appMetadata ?? {}), parent_link_v: parentLinkVersion(appMetadata) + 1 };
}

export function parentLinkUrl(token: string): string {
  return `${SITE_URL}/p/${token}`;
}
