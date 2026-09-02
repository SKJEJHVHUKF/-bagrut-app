/**
 * join-code.ts — the six characters a teacher reads aloud and thirty students
 * type at once.
 *
 * This is the whole student-identity story. There is no school email, no ID
 * number, no invitation link to chase: the teacher opens a class, reads out
 * "K7M-4PQ", and the class is in. Less collected means less to protect, less to
 * explain to a parent, and one fewer reason for a school to say no.
 *
 * So the code has to survive a CLASSROOM, not a browser. It is read off a
 * projector at the back of a room, said out loud, and typed on a phone by
 * someone who is already behind. Crockford's base32 alphabet is used exactly
 * because of that: it drops I, L, O and U, and `normalize` folds the mistakes
 * people actually make — O typed as zero, I or l typed as one — onto the
 * character that was meant. U is dropped so a random code cannot spell
 * something a fifteen-year-old will repeat.
 *
 * Pure and import-free, so it can run on the server, in the browser, and in a
 * test with no database.
 */

/** Crockford base32: 0-9 A-Z minus I, L, O, U. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const JOIN_CODE_LENGTH = 6;

/** 32^6 ≈ 1.07 billion. A class list is thirty codes; collisions are handled by
 *  the unique index and a retry, not by hoping. */
export const JOIN_CODE_SPACE = Math.pow(ALPHABET.length, JOIN_CODE_LENGTH);

/**
 * Fold what a person typed onto what they meant.
 *
 * Case, spaces and the dash from the display form are all noise. The three
 * substitutions are the ones the alphabet was designed around: a written O is
 * read as a zero, and I or a lowercase l is read as a one.
 */
export function normalizeJoinCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

/** Is this a well-formed code? Says nothing about whether a class has it. */
export function isValidJoinCode(input: string): boolean {
  const code = normalizeJoinCode(input);
  if (code.length !== JOIN_CODE_LENGTH) return false;
  for (const ch of code) if (!ALPHABET.includes(ch)) return false;
  return true;
}

/**
 * How the code is shown — never how it is stored or compared.
 *
 * "K7M-4PQ" is read aloud and copied more reliably than "K7M4PQ", and the dash
 * is stripped again by `normalize` on the way back in. Storing the dash would
 * mean two spellings of one code in the database.
 */
export function formatJoinCode(code: string): string {
  const c = normalizeJoinCode(code);
  return c.length === JOIN_CODE_LENGTH ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
}

/**
 * A fresh code.
 *
 * `crypto.getRandomValues` rather than Math.random: a guessable code is a
 * stranger in a class of minors. Rejection sampling on the byte keeps the
 * distribution flat — `byte % 32` would be uniform only because 256 divides
 * evenly by 32, and that is a property of today's alphabet length rather than
 * something the next edit will preserve.
 */
export function generateJoinCode(): string {
  const out: string[] = [];
  const limit = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  const buf = new Uint8Array(JOIN_CODE_LENGTH * 2);
  while (out.length < JOIN_CODE_LENGTH) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b >= limit) continue;
      out.push(ALPHABET[b % ALPHABET.length]);
      if (out.length === JOIN_CODE_LENGTH) break;
    }
  }
  return out.join('');
}
