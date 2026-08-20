'use client';

import { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Renders markdown + LaTeX (Hebrew prose with LTR math islands).
//
// HARD CONTRACT: both modes return exactly ONE element.
//   one element  = one flex item, so a display:flex caller can never
//                  fragment us into per-word / per-formula boxes
//   one dir attr = one bidi isolate for the whole run
// `inline` means "don't emit a <p> block" — it does NOT mean "return a bare
// fragment". It used to, and a display:flex caller then turned every text run
// and every .katex inline-block into its own flex item (the 3-column scramble
// in LearnLevel's "לזכור" box), while `.chat-md > * + *` piled 0.65em of top
// margin onto every KaTeX span after the first.
//
// dir="rtl", NOT dir="auto". dir="auto" is computed from TEXT CONTENT, and
// KaTeX emits a <span class="katex-mathml"> carrying the raw LaTeX inside an
// <annotation> — hidden by clip-path, not display:none, so the auto algorithm
// still counts it. A Hebrew line that OPENS with "$z \cdot \bar{z} = |z|^2$"
// therefore sees a Latin `z` as its first strong character and flips the whole
// Hebrew bullet to LTR. Every string routed through MathText in this app is
// Hebrew content; the one direction-agnostic surface (the chat bubble) does
// NOT use MathText — app/chat/page.tsx calls ReactMarkdown directly with
// unicodeBidi:'plaintext'. So rtl is both correct and deterministic here.
//
// With the paragraph RTL and each .katex an atomic inline-block (bidi class
// ON), the neutral glue around math — "—", ".", ",", the hyphen in "ל-" —
// sits in a neutral run bounded by RTL on both sides, and UAX#9 rule N1
// resolves it to RTL. That is what makes "$z\bar z=|z|^2$ — זהות שימושית"
// read correctly without any :has() direction hack in the CSS.
// True when the string has NO Hebrew outside its math — a standalone
// worked-solution step like '$= 4 - 3i$.' or a chain like '$2x=4$ → $x=2$'.
// Those are laid out LTR and left-aligned (STYLE_GUIDE §4); Hebrew prose is
// not. Direction, not just alignment: each .katex is an LTR island, but the
// ORDER of several islands and the side their punctuation lands on follow the
// paragraph direction — inside an RTL <p>, '$a$ → $b$.' displayed as
// '.b → a', the second step first and the arrow pointing backwards. Only
// Hebrew letters make a line RTL; punctuation, arrows and digits do not.
// This has to be decided here in JS, not in CSS: `:only-child` counts only
// ELEMENT children, so "מהם פתרונות המשוואה $z^2=-25$?" — one .katex plus text
// nodes — matches it and a Hebrew sentence gets left-aligned.
const MATH_ISLAND = /\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g;
const HEBREW = /[֐-׿]/; // U+0590–U+05FF, the Hebrew block

// UAX#9 mirrors brackets in RTL text but NOT arrows, so on a Hebrew line
// 'חיתוך → קיצון' (and 'לכן $x-2\ne0$ → $x\ne2$') the glyph points back at
// the thing it came from. Point it along the reading direction. Math islands
// are LTR and untouched; math-only lines never reach here. Content already
// written the RTL way ('תחום ← חיתוכים') is left alone.
const RTL_ARROW: Record<string, string> = { '→': '←', '⇒': '⇐', '⟹': '⟸' };
function mirrorArrows(s: string) {
  return s.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)|[→⇒⟹]/g, (m, math) => math ?? RTL_ARROW[m]);
}

// remark-math parses a ONE-LINE `$$…$$` as inline double-dollar math, not as a
// display block — only the multi-line form (`$$` / formula / `$$`) becomes
// math-flow and gets `.katex-display`. Every lesson in this app writes display
// formulas as a single `$$…$$` line, so without this they all rendered inline,
// buried in the paragraph. Promote any line that is exactly `$$…$$` to the
// multi-line form (blank lines around it so it can't be swallowed by a list
// item or a paragraph). Lines with text around the math (table cells, prose)
// are untouched.
function promoteDisplayMath(s: string) {
  return s.replace(/^[ \t]*\$\$([^\n$]+(?:\$(?!\$)[^\n$]*)*)\$\$[ \t]*$/gm, (_m, inner: string) => `\n$$\n${inner}\n$$\n`);
}

export function MathText({ children: raw, inline = false }: { children: string; inline?: boolean }) {
  const hebrew = HEBREW.test(raw.replace(MATH_ISLAND, ''));
  const mathOnly = !hebrew && raw.includes('$') ? ' math-only' : '';
  const mirrored = hebrew ? mirrorArrows(raw) : raw;
  const children = inline ? mirrored : promoteDisplayMath(mirrored);
  const components = inline
    ? { p: ({ children }: { children?: ReactNode }) => <>{children}</> }
    : {
        p: ({ children }: { children?: ReactNode }) => <p dir="rtl">{children}</p>,
        li: ({ children }: { children?: ReactNode }) => <li dir="rtl">{children}</li>,
        td: ({ children }: { children?: ReactNode }) => <td dir="rtl">{children}</td>,
        th: ({ children }: { children?: ReactNode }) => <th dir="rtl">{children}</th>,
        h1: ({ children }: { children?: ReactNode }) => <h1 dir="rtl">{children}</h1>,
        h2: ({ children }: { children?: ReactNode }) => <h2 dir="rtl">{children}</h2>,
        h3: ({ children }: { children?: ReactNode }) => <h3 dir="rtl">{children}</h3>,
        h4: ({ children }: { children?: ReactNode }) => <h4 dir="rtl">{children}</h4>,
        blockquote: ({ children }: { children?: ReactNode }) => (
          <blockquote dir="rtl">{children}</blockquote>
        ),
      };
  const md = (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
  if (inline) return <span dir="rtl" className={`mathtext-inline${mathOnly}`}>{md}</span>;
  return <div dir="rtl" className={`mathtext-block${mathOnly}`}>{md}</div>;
}
