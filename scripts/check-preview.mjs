/**
 * check-preview.mjs — does the Python function work, and did Next.js survive?
 *
 *   node scripts/check-preview.mjs https://<preview-url>
 *
 * The whole reason this deployment goes to a preview branch first: Vercel gives
 * a detected Python framework preset precedence over everything, and a
 * misconfiguration would silently take over routing and delete 15 working API
 * routes. Reading the config cannot prove it did not happen — only a request
 * to a real deployment can.
 *
 * So this asserts BOTH halves, and the second half is the important one:
 *   1. /api/math/solve answers (the new Python function)
 *   2. the existing Next.js routes still answer AS NEXT.JS
 *
 * On (2), 401/403/415 is a PASS. Those routes require a session and reject an
 * anonymous request — which proves the Next.js handler ran. A 404, or HTML, or
 * a JSON body from the Python function would mean Python swallowed the route.
 */

const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) {
  console.error('usage: node scripts/check-preview.mjs https://<preview-url>');
  process.exit(1);
}

let pass = 0;
let fail = 0;
const ok = (cond, label, detail = '') => {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}${detail ? `\n       ${detail}` : ''}`); }
};

/** Set before the first request; sent on every one. Passed as a header rather
 *  than by monkey-patching `globalThis.fetch` — the patched version lost the
 *  native binding and every call died with a bare `TypeError: fetch failed`,
 *  which then read as "the app is down" instead of "the test is broken". */
let bypass = '';

const req = async (path, init) => {
  try {
    const res = await fetch(base + path, {
      ...init,
      headers: {
        'user-agent': 'Mozilla/5.0 preview-check',
        // ⚠️ The bypass header ONLY. `x-vercel-set-bypass-cookie` makes Vercel
        // answer with a redirect that plants a cookie — and Node's fetch
        // follows redirects without keeping cookies, so it loops until undici
        // gives up with `redirect count exceeded`, surfaced as a bare
        // `TypeError: fetch failed`. That read as "the deployment is down"
        // while curl on the same URL was answering fine.
        ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, text, json, type: res.headers.get('content-type') ?? '' };
  } catch (e) {
    // `TypeError: fetch failed` on its own is useless — undici hides the real
    // reason in `cause`, and without it a DNS problem, a TLS problem and a bad
    // header all read identically.
    const cause = e?.cause ? ` | cause: ${e.cause.code ?? ''} ${e.cause.message ?? e.cause}` : '';
    return { status: 0, text: `${e}${cause}`, json: null, type: '' };
  }
};

console.log(`\nchecking ${base}\n`);

/**
 * ⚠️ REFUSE TO REPORT THROUGH DEPLOYMENT PROTECTION.
 *
 * Vercel protects preview deployments by default: every request is answered
 * by an SSO wall, not by the app. The first run of this file did not notice,
 * and the result was meaningless in BOTH directions — the five Next.js routes
 * "passed" on a 401 that came from the wall rather than from a handler, and
 * the Python function "failed" on a 302 to the login page rather than on
 * anything wrong with it. A green tick earned that way is worse than a red
 * one, because it would have authorised a merge.
 *
 * `x-vercel-protection-bypass` is Vercel's own automation secret. With it the
 * requests reach the deployment; without it, this script stops.
 */
bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || process.argv[3] || '';
{
  const probe = await req('/api/math/solve');
  const walled =
    probe.status === 302 ||
    /Protected deployment/.test(probe.text) ||
    /vercel_auth_callback|sso-api/.test(probe.text);
  if (walled) {
    console.log('⛔ THIS DEPLOYMENT IS BEHIND VERCEL DEPLOYMENT PROTECTION.\n');
    console.log('   Every request is answered by the SSO wall, so nothing below would be');
    console.log('   measuring the app. Not reporting a pass or a fail — the run is void.\n');
    console.log('   To make the preview testable, either:');
    console.log('     a) Vercel → Project → Settings → Deployment Protection →');
    console.log('        Protection Bypass for Automation → copy the secret, then run:');
    console.log('        node scripts/check-preview.mjs <url> <secret>');
    console.log('     b) or set Vercel Authentication to "Disabled" for Preview');
    console.log('        deployments while this is being verified.\n');
    process.exit(2);
  }
}

// ---------- 1. the new Python function ----------
console.log('the Python function (new):');
{
  const health = await req('/api/math/solve');
  ok(health.status === 200 && health.json?.status === 'ok',
    `GET /api/math/solve → health`,
    `status ${health.status}, body: ${health.text.slice(0, 160)}`);
  if (health.json?.sympy) console.log(`       sympy ${health.json.sympy}`);

  const solve = await req('/api/math/solve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'solve', expression: '2*x + 3 = 11', variable: 'x' }),
  });
  ok(solve.json?.status === 'solved', 'POST solves 2x+3=11',
    `status ${solve.status}, body: ${solve.text.slice(0, 200)}`);
  ok(solve.json?.answerValues?.some((v) => String(v).trim() === '4'), 'and the answer is 4',
    `values: ${JSON.stringify(solve.json?.answerValues)}`);
  ok(solve.json?.verified === true, 'and it was verified by substitution');

  const validate = await req('/api/math/solve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'validate', expression: '2*x + 3 = 11', studentAnswer: '8/2', variable: 'x' }),
  });
  ok(validate.json?.isCorrect === true, '8/2 is accepted as equivalent to 4',
    `body: ${validate.text.slice(0, 160)}`);

  // The case the in-process mathjs engine cannot finish, so a pass here is
  // proof the SymPy hop is genuinely live rather than mathjs answering twice.
  const derivative = await req('/api/math/solve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'derivative', expression: 'x^3 - 4*x', variable: 'x' }),
  });
  ok(derivative.json?.status === 'solved', 'SymPy differentiates x^3-4x (mathjs alone cannot)',
    `status ${derivative.status}, body: ${derivative.text.slice(0, 200)}`);

  const attack = await req('/api/math/solve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'solve', expression: "__import__('os').system('ls')" }),
  });
  // ⚠️ `json?.status !== 'solved'` alone is TRUE when json is null — i.e. when
  // the request never reached the app. The first run "passed" these two on a
  // network error. Require a real response before judging the refusal.
  ok(attack.status === 200 && attack.json !== null && attack.json.status !== 'solved',
    'a code-execution payload is refused',
    `status ${attack.status}, body: ${attack.text.slice(0, 160)}`);
  ok(attack.json !== null && !/Traceback|File "/.test(attack.text), 'and no traceback is leaked');
}

// ---------- 2. the routes that must NOT have been swallowed ----------
console.log('\nthe existing Next.js routes (must still be Next.js):');
// `/api/analyze` is new and `/api/analyze-solution` already existed. Both are
// listed because a new route segment that shadows an older one is exactly the
// sort of break that only a real deployment reveals.
for (const path of [
  '/api/chat',
  '/api/practice',
  '/api/questions',
  '/api/check-answer',
  '/api/why-wrong',
  '/api/analyze',
  '/api/analyze-solution',
]) {
  const res = await req(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify({}),
  });
  // 401/403/415/400 all mean a Next.js handler ran and rejected us.
  const handled = [400, 401, 403, 415, 429].includes(res.status);
  ok(handled, `POST ${path} → ${res.status} (a Next.js handler answered)`,
    `body: ${res.text.slice(0, 120)}`);
}

console.log('\nthe app itself:');
{
  const home = await req('/');
  ok(home.status === 200 && /<!DOCTYPE html|<html/i.test(home.text), `GET / → ${home.status}, HTML served`);
}

console.log(`\n${fail === 0 ? '✅ SAFE TO MERGE' : '❌ DO NOT MERGE'}  —  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
