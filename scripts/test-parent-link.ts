/**
 * test-parent-link.ts — the token that lets a parent read one student's week.
 *
 *   npx tsx scripts/test-parent-link.ts
 *
 * WHY THIS EXISTS
 * The link is the only credential on a page anyone can open, and every way it
 * can be wrong is quiet:
 *
 *   - a parser that trusts the id without the MAC hands any student's week to
 *     whoever edits the URL;
 *   - a revoke that forgets the old version leaves the link a parent was sent
 *     working forever;
 *   - a revoke that rewrites app_metadata without the existing keys takes a
 *     paying user off Pro;
 *   - a student's own revoke that also bumps the TEACHER's version lets him
 *     silently kill the report his teacher sent home (Itay, 2026-09-14);
 *   - a parser that THROWS on junk turns a typo into a 500 that looks
 *     different from "inactive", which is a way to probe for valid tokens.
 *
 * None of those fail a build.
 */

import {
  signParentToken,
  parseParentToken,
  parentLinkVersion,
  revokedParentLinkMeta,
  parentLinkUrl,
} from '../lib/parent-link';
import { SITE_URL } from '../lib/site';

let checks = 0;
let failures = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (cond) console.log(`PASS  ${msg}`);
  else {
    failures++;
    console.log(`FAIL  ${msg}`);
  }
}

/** Runs `fn`; a throw counts as a failure of the "never throws" promise. */
function quiet<T>(fn: () => T): T | 'threw' {
  try {
    return fn();
  } catch {
    return 'threw';
  }
}

process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const ID = '3f1c2a9e-7b4d-4e8a-9c1f-2d5e6a7b8c90';
const OTHER = 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d';

// ============================================================
{
  const t = signParentToken(ID, 'self', 0);
  const p = parseParentToken(t);
  assert(p !== null && p.userId === ID && p.kind === 'self' && p.version === 0, 'round trip: self, version 0');
  const p3 = parseParentToken(signParentToken(ID, 'teacher', 3));
  assert(p3 !== null && p3.userId === ID && p3.kind === 'teacher' && p3.version === 3, 'round trip: teacher, version 3');
  assert(t.split('.').length === 3 && t.length < 120, 'three parts, short enough for a WhatsApp message');
  assert(parentLinkUrl(t) === `${SITE_URL}/p/${t}`, 'the url is SITE_URL/p/<token>');
}

// ============================================================
{
  const [idPart, kindVersion, macPart] = signParentToken(ID, 'self', 0).split('.');
  const otherId = Buffer.from(OTHER, 'utf8').toString('base64url');

  assert(parseParentToken(`${otherId}.${kindVersion}.${macPart}`) === null, 'another student id under this MAC → null');
  assert(parseParentToken(`${idPart}.s1.${macPart}`) === null, 'a bumped version under the old MAC → null');
  assert(
    parseParentToken(`${idPart}.t0.${macPart}`) === null,
    "a student's MAC relabelled as the teacher's link → null"
  );

  const mid = Math.floor(macPart.length / 2);
  const flipped = macPart.slice(0, mid) + (macPart[mid] === 'A' ? 'B' : 'A') + macPart.slice(mid + 1);
  assert(parseParentToken(`${idPart}.${kindVersion}.${flipped}`) === null, 'one MAC character changed → null');
  assert(parseParentToken(`${idPart}.${kindVersion}.${macPart.slice(0, -2)}`) === null, 'a truncated MAC → null');

  // The last base64url char of a 32-byte MAC carries 2 unused bits, so the
  // next char in the alphabet decodes to the SAME bytes. Node's decoder also
  // skips characters it does not know. Both must still be refused: one
  // spelling per link.
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const alias = macPart.slice(0, -1) + ALPHABET[ALPHABET.indexOf(macPart[macPart.length - 1]) + 1];
  assert(
    Buffer.from(alias, 'base64url').equals(Buffer.from(macPart, 'base64url')),
    'sanity: the alias decodes to the very same MAC bytes'
  );
  assert(parseParentToken(`${idPart}.${kindVersion}.${alias}`) === null, 'a non-canonical spelling of the right MAC → null');
  const starred = `${idPart.slice(0, 4)}*${idPart.slice(4)}`;
  assert(Buffer.from(starred, 'base64url').toString('utf8') === ID, 'sanity: the starred id part decodes to the same id');
  assert(
    parseParentToken(`${starred}.${kindVersion}.${macPart}`) === null,
    'a junk character inside the id part (decodes to the same id) → null'
  );

  const signedWithOtherKey = (() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'a-different-project-key';
    const tok = signParentToken(ID, 'self', 0);
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    return tok;
  })();
  assert(parseParentToken(signedWithOtherKey) === null, 'a token signed with a different key → null');
}

// ============================================================
{
  // Revoke = the stored version moves on; a link signed for the old one must
  // no longer match what the page reads from app_metadata.
  const old = parseParentToken(signParentToken(ID, 'self', 0));
  const stored = { pro: true, provider: 'google', providers: ['google'] };
  assert(old !== null && old.version === parentLinkVersion(stored, 'self'), 'before any revoke, a version-0 link is current');
  const after = revokedParentLinkMeta(stored, 'self');
  assert(old !== null && old.version !== parentLinkVersion(after, 'self'), 'after a revoke, the version-0 link is dead');
  assert(parentLinkVersion({ parent_link_v: 1 }, 'self') === 1, "the student's version is read from parent_link_v");
  assert(
    parentLinkVersion({ parent_link_teacher_v: 2 }, 'teacher') === 2,
    "the teacher's version is read from parent_link_teacher_v"
  );
  assert(
    after.pro === true && after.provider === 'google' && Array.isArray(after.providers) && after.parent_link_v === 1,
    'revoke keeps pro/provider/providers and writes parent_link_v 1'
  );
  assert(revokedParentLinkMeta({ parent_link_v: 4, pro: true }, 'self').parent_link_v === 5, 'revoke from 4 writes 5');
  assert(revokedParentLinkMeta(undefined, 'self').parent_link_v === 1, 'revoke with no app_metadata writes 1');
  assert(
    parentLinkVersion(undefined, 'self') === 0 && parentLinkVersion({}, 'teacher') === 0 && parentLinkVersion(null, 'self') === 0,
    'absent version = 0'
  );
  assert(
    parentLinkVersion({ parent_link_v: '1' }, 'self') === 0 && parentLinkVersion({ parent_link_v: -1 }, 'self') === 0,
    'a malformed stored version reads as 0, never NaN'
  );
}

// ============================================================
{
  // Two issuers, two versions: each revoke kills only its own links.
  const teacherLink = parseParentToken(signParentToken(ID, 'teacher', 0));
  const studentLink = parseParentToken(signParentToken(ID, 'self', 0));
  const stored = { pro: true };

  const afterStudentRevoke = revokedParentLinkMeta(stored, 'self');
  assert(
    teacherLink !== null && teacherLink.version === parentLinkVersion(afterStudentRevoke, teacherLink.kind),
    "a student replacing his own link leaves the teacher's link alive"
  );
  assert(
    studentLink !== null && studentLink.version !== parentLinkVersion(afterStudentRevoke, studentLink.kind),
    "…and his own old link is dead"
  );

  const afterTeacherRevoke = revokedParentLinkMeta(stored, 'teacher');
  assert(
    studentLink !== null && studentLink.version === parentLinkVersion(afterTeacherRevoke, studentLink.kind),
    "a teacher replacing her link leaves the student's own link alive"
  );
  assert(
    teacherLink !== null && teacherLink.version !== parentLinkVersion(afterTeacherRevoke, teacherLink.kind),
    "…and the teacher's old link is dead"
  );

  const both = revokedParentLinkMeta(revokedParentLinkMeta({ parent_link_v: 2, pro: true }, 'teacher'), 'self');
  assert(
    both.parent_link_v === 3 && both.parent_link_teacher_v === 1 && both.pro === true,
    "one issuer's revoke keeps the other issuer's version and pro"
  );
}

// ============================================================
{
  const junk: unknown[] = [
    '',
    'garbage',
    'a.b.c',
    '..',
    '...',
    'x'.repeat(10_000),
    `${signParentToken(ID, 'self', 0)}.extra`,
    signParentToken(ID, 'self', 0).replace('.s0.', '.s00.'),
    signParentToken(ID, 'self', 0).replace('.s0.', '.s-0.'),
    signParentToken(ID, 'self', 0).replace('.s0.', '.0.'),
    signParentToken(ID, 'self', 0).replace('.s0.', '.x0.'),
    `${Buffer.from('not-a-uuid').toString('base64url')}.s0.AAAA`,
    'שלום.s0.עולם',
    undefined,
    null,
    123,
    {},
  ];
  const results = junk.map((j) => quiet(() => parseParentToken(j)));
  assert(results.every((r) => r !== 'threw'), 'garbage, empty and very long input never throw');
  assert(results.every((r) => r === null), 'garbage, empty, unknown-issuer and very long input → null');

  const good = signParentToken(ID, 'teacher', 2);
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const noKey = quiet(() => parseParentToken(good));
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  assert(noKey === null, 'no key configured → null (fail closed), not a throw');

  assert(quiet(() => signParentToken('not-a-uuid', 'self', 0)) === 'threw', 'signing a non-uuid throws');
  assert(quiet(() => signParentToken(ID, 'self', 1.5)) === 'threw', 'signing a fractional version throws');
  assert(
    quiet(() => signParentToken(ID, 'parent' as never, 0)) === 'threw',
    'signing for an unknown issuer throws'
  );
}

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
