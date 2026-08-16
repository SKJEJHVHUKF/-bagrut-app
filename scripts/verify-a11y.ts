// verify-a11y — a static gate for the accessibility regressions that actually
// happened in this repo, so they cannot come back silently.
//
// Deliberately NOT a general a11y linter: no axe, no Playwright, no browser.
// Those need a rendered page and a running server; this runs in `npm run check`
// in under a second and only asserts things that are decidable from source.
//
// Each rule below exists because the codebase had a real instance of it:
//   role="meter"          — invalid ARIA role, screen readers drop the widget
//   tabIndex={-1} on a
//     <button>            — took every maths symbol chip off the keyboard
//   fixed inset-0 overlay
//     with no dialog role — 16 overlays with no semantics, trap or ESC
//   <img> with no alt     — the usual
//   0 or 2+ <h1> in a page — /bagruyot/archive shipped three

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components'];

type Finding = { file: string; line: number; rule: string; message: string };

const errors: Finding[] = [];
const warnings: Finding[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      walk(full, out);
    } else if (entry.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

/** Line number (1-based) of a character offset. */
const lineOf = (src: string, index: number) => src.slice(0, index).split('\n').length;

/** Blank out comments, preserving offsets so line numbers stay correct.
 *  Without this, the prose in a file's header comment gets scanned as code —
 *  MathUpLogo.tsx explains its <img> fallback in words and was flagged for it. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

/** End of a JSX opening tag that starts at `from`. Tracks brace depth so the
 *  `>` inside an arrow function — `ref={(el) => …}` — is not mistaken for the
 *  tag end. That is exactly what made the <img> rule misfire. */
function tagEnd(src: string, from: number): number {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return i;
  }
  return src.length;
}

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const src = stripComments(readFileSync(file, 'utf8'));
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    const push = (list: Finding[], index: number, rule: string, message: string) =>
      list.push({ file: rel, line: lineOf(src, index), rule, message });

    // 1. role="meter" is not an ARIA role. Use progressbar.
    for (const m of src.matchAll(/role=["']meter["']/g)) {
      push(errors, m.index!, 'invalid-role', '`role="meter"` is not an ARIA role — use `role="progressbar"`.');
    }

    // 2. A <button> pulled out of the tab order is unreachable by keyboard.
    //    Scans the opening tag with the same brace-aware reader the <img> rule
    //    uses: `[^>]*` would stop at the `>` inside an `onMouseDown={(e) => …}`
    //    handler and miss a tabIndex written after it — which is exactly how
    //    MathSymbolBar had it.
    for (const m of src.matchAll(/<button\b/g)) {
      const tag = src.slice(m.index!, tagEnd(src, m.index!));
      if (/tabIndex=\{\s*-1\s*\}/.test(tag)) {
        push(errors, m.index!, 'button-not-focusable', '`tabIndex={-1}` on a <button> removes it from keyboard reach.');
      }
    }

    // 3. A full-screen overlay must announce itself and trap focus. The panel
    //    is the sibling that carries role="dialog"; a file with an inset-0
    //    overlay and no dialog role anywhere is an untrapped modal.
    if (/className=["'{`][^"'`}]*fixed inset-0/.test(src)) {
      const isBackdropOnly = /aria-hidden=["']true["']/.test(src);
      const hasDialog = /role=["']dialog["']/.test(src) || /useDialog\(/.test(src);
      if (!hasDialog && !isBackdropOnly) {
        const idx = src.search(/fixed inset-0/);
        push(
          warnings,
          idx,
          'overlay-without-dialog',
          'full-screen overlay with no `role="dialog"` and no useDialog() — no focus trap, no ESC, no label.',
        );
      }
    }

    // 4. Images need a text alternative (alt="" is a valid one — decorative).
    for (const m of src.matchAll(/<img\b/g)) {
      const tag = src.slice(m.index!, tagEnd(src, m.index!));
      if (!/\balt\s*=/.test(tag)) {
        push(errors, m.index!, 'img-without-alt', '<img> with no alt attribute.');
      }
    }

    // 5. Heading count per page — a WARNING, never an error.
    //
    // Several pages legitimately declare more than one <h1> because they are
    // branch-per-state: /bagruyot/archive has one for the logged-out gate, one
    // for the non-Pro gate and one for the real page, and exactly one of those
    // three ever renders. /signup and /teach do the same. Source counting
    // cannot tell an exclusive branch from a duplicate, so this reports rather
    // than blocks — the rendered count is what matters, and that has to be
    // checked in the browser.
    if (/[/\\]page\.tsx$/.test(rel)) {
      const h1s = [...src.matchAll(/<(?:motion\.)?h1\b/g)];
      if (h1s.length > 1) {
        push(warnings, h1s[1].index!, 'multiple-h1', `${h1s.length} <h1> in one page — fine if they are exclusive branches, a defect if not.`);
      } else if (h1s.length === 0) {
        push(warnings, 0, 'no-h1', 'page has no <h1>.');
      }
    }
  }
}

// The global focus ring lives in app/globals.css and is what makes the many
// `outline-none` utilities survivable. If it is ever deleted, every one of
// them becomes a real defect at once — so guard the rule itself.
const css = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');
if (!/:focus-visible\s*\{[^}]*outline:/.test(css)) {
  errors.push({
    file: 'app/globals.css',
    line: 0,
    rule: 'missing-global-focus-ring',
    message: 'the global `:focus-visible { outline: … }` rule is gone — every `outline-none` in the app is now an unfixed defect.',
  });
}

const fmt = (f: Finding) => `  ${f.file}:${f.line}  [${f.rule}] ${f.message}`;

if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log(fmt(w)));
}

if (errors.length) {
  console.error(`\n✖ verify-a11y: ${errors.length} error(s):`);
  errors.forEach((e) => console.error(fmt(e)));
  process.exit(1);
}

console.log(`\n✓ verify-a11y: 0 errors, ${warnings.length} warning(s).`);
