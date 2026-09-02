/**
 * The one thing lib/use-client-value.ts must never get wrong.
 *
 * Every caller passes a reader that touches localStorage, window.location or
 * the clock — none of which exist on the server. If `useClientValue` ever calls
 * `read` during the server render, every page using it throws at build time.
 * So: render for real with react-dom/server and give it a reader that explodes.
 *
 * Run: npx tsx scripts/test-client-value.tsx
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { useClientValue, useHydrated, useUrlParam } from '../lib/use-client-value';

let pass = 0;
let fail = 0;

function ok(cond: boolean, what: string) {
  if (cond) pass++;
  else fail++;
  console.log(`  ${cond ? '✓' : '✗ FAIL'}  ${what}`);
}

// A reader that would blow up exactly the way `localStorage.getItem` does on
// the server. If it is ever called during SSR, renderToStaticMarkup throws.
let readCalls = 0;
function explodingRead(): string {
  readCalls++;
  throw new Error('read() must not run during the server render');
}

function UsesClientValue() {
  const value = useClientValue<string>(explodingRead, 'server-value');
  return <span>{value}</span>;
}

function UsesHydrated() {
  return <span>{String(useHydrated())}</span>;
}

function UsesUrlParam() {
  // `window` is undefined here — useUrlParam must not reach for it.
  return <span>{String(useUrlParam('topic'))}</span>;
}

console.log('\nuse-client-value — server render');

let markup = '';
let threw: unknown = null;
try {
  markup = renderToStaticMarkup(<UsesClientValue />);
} catch (e) {
  threw = e;
}
ok(threw === null, `server render does not throw${threw ? ` (${String(threw)})` : ''}`);
ok(readCalls === 0, `read() was never called on the server (calls: ${readCalls})`);
ok(markup === '<span>server-value</span>', `serverValue is what renders (got ${markup || '""'})`);

ok(renderToStaticMarkup(<UsesHydrated />) === '<span>false</span>', 'useHydrated is false on the server');
ok(renderToStaticMarkup(<UsesUrlParam />) === '<span>null</span>', 'useUrlParam is null on the server');

console.log(`\n  ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
