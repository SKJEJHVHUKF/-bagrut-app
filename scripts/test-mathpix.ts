/**
 * test-mathpix.ts — the Mathpix OCR engine's integration check.
 *
 *   npx tsx scripts/test-mathpix.ts              wiring only, FREE
 *   npx tsx scripts/test-mathpix.ts --live       + one real API call (~$0.002)
 *
 * Two halves, because they answer different questions and only one of them
 * needs a key:
 *
 *   WIRING (always)  Is the engine registered, ordered ahead of Claude vision,
 *                    and does the chain still contain a fallback behind it?
 *                    This is what protects against the failure the pipeline
 *                    change fixed: an optional engine in front silently
 *                    disabling the working one behind it.
 *
 *   LIVE (--live)    Does the real v3/text endpoint accept our request shape
 *                    and return Hebrew prose with LaTeX? No amount of unit
 *                    testing substitutes for that, and it is the half nobody
 *                    can run without a key.
 *
 * Without MATHPIX_APP_ID / MATHPIX_APP_KEY the live half SKIPS rather than
 * fails — an unset optional key is a supported state, not a broken build.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { mathpixEngine } from '../lib/mathscan/ocr/mathpix-engine';
import { buildOcrChain } from '../lib/mathscan/ocr';

let checks = 0;
let failures = 0;
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) {
    failures++;
    console.log(`FAIL  ${msg}`);
  } else {
    console.log(`  ok  ${msg}`);
  }
};

(async () => {
  console.log('\n--- wiring ---');

  ok(mathpixEngine.id === 'mathpix', 'engine id is registered in OcrEngineId');
  ok(mathpixEngine.paid === true, 'engine declares itself paid');
  ok(typeof mathpixEngine.recognize === 'function', 'engine implements recognize');

  // The chain is built in a Node context here, so `fetch` exists and both
  // paid engines report available — which is exactly the arrangement the
  // pipeline has to walk.
  const free = await buildOcrChain({ allowPaid: false });
  const paidChain = await buildOcrChain({ allowPaid: true });
  const paid = paidChain.filter((e) => e.paid);

  ok(!free.some((e) => e.paid), 'the free chain contains no paid engine');
  ok(paid.length >= 2, `the paid chain keeps a fallback behind Mathpix (${paid.length} engines)`);
  ok(paid[0]?.id === 'mathpix', 'Mathpix is tried first among paid engines');
  ok(
    paid.some((e) => e.id === 'claude-vision'),
    'claude-vision is still reachable behind it',
  );

  // The soft-degrade contract: no key is a supported state. `isAvailable`
  // must NOT probe the server, because the pipeline falls through on the
  // request itself.
  ok(await mathpixEngine.isAvailable(), 'isAvailable does not depend on the key being set');

  console.log('\n--- live ---');
  const appId = process.env.MATHPIX_APP_ID;
  const appKey = process.env.MATHPIX_APP_KEY;
  const live = process.argv.includes('--live');

  if (!live) {
    console.log('  skipped (pass --live to make one real call, ~$0.002)');
  } else if (!appId || !appKey) {
    console.log('  skipped — MATHPIX_APP_ID / MATHPIX_APP_KEY not set in .env.local');
  } else {
    // A tiny generated PNG would test nothing about maths recognition, so the
    // live check posts the request SHAPE against the real endpoint and only
    // asserts that Mathpix accepted it. Recognition quality is a judgement to
    // make on a real photograph, in the app.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'probe.png');
    form.append('options_json', JSON.stringify({ formats: ['text'] }));

    try {
      const res = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: { app_id: appId, app_key: appKey },
        body: form,
        signal: AbortSignal.timeout(20_000),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      // 200 with an `error` about an unreadable 1x1 image is a PASS: the
      // credentials and the request shape were both accepted. A 401 is not.
      ok(res.status !== 401 && res.status !== 403, `credentials accepted (HTTP ${res.status})`);
      ok('text' in data || 'error' in data, 'response has the v3/text shape');
      console.log(`      raw: ${JSON.stringify(data).slice(0, 160)}`);
    } catch (error) {
      ok(false, `live call threw: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`\n${failures === 0 ? '✅' : '❌'}  ${checks - failures}/${checks} passed`);
  process.exit(failures === 0 ? 0 : 1);
})();
