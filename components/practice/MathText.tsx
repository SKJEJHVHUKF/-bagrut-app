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
// True when the string is nothing BUT math — a standalone worked-solution step
// like '$= 4 - 3i$'. Those get left-aligned (STYLE_GUIDE §4); Hebrew prose does
// not. This has to be decided here in JS, not in CSS: `:only-child` counts only
// ELEMENT children, so "מהם פתרונות המשוואה $z^2=-25$?" — one .katex plus text
// nodes — matches it and a Hebrew sentence gets left-aligned.
function isMathOnly(s: string) {
  if (!s.includes('$')) return false;
  return (
    s
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$[^$\n]+\$/g, '')
      .trim() === ''
  );
}

export function MathText({ children, inline = false }: { children: string; inline?: boolean }) {
  const mathOnly = isMathOnly(children) ? ' math-only' : '';
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
