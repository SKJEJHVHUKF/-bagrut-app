'use client';

import { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Renders markdown + LaTeX. `inline` strips the wrapping <p> so the math
// sits naturally next to surrounding text instead of starting a new block.
//
// We wrap the block variant in <div dir="rtl"> as a defensive measure:
// even if the parent loses its RTL inheritance, this guarantees that
// the markdown content (Hebrew prose + math islands) renders with the
// correct bidirectional flow. The .chat-md CSS does the same belt+
// suspenders work — both layers must agree.
export function MathText({ children, inline = false }: { children: string; inline?: boolean }) {
  // dir="auto" on each block element tells the browser to pick direction
  // PER element based on its first strong character. So a paragraph that
  // starts with Hebrew renders RTL, one starting with math/English flips
  // to LTR — automatically, no manual annotation needed. Combined with
  // the .katex CSS (direction:ltr; unicode-bidi:isolate), math islands
  // stay LTR inside RTL Hebrew flow without flipping operators or arrows.
  const components = inline
    ? { p: ({ children }: { children?: ReactNode }) => <>{children}</> }
    : {
        p: ({ children }: { children?: ReactNode }) => <p dir="auto">{children}</p>,
        li: ({ children }: { children?: ReactNode }) => <li dir="auto">{children}</li>,
        td: ({ children }: { children?: ReactNode }) => <td dir="auto">{children}</td>,
        th: ({ children }: { children?: ReactNode }) => <th dir="auto">{children}</th>,
        h1: ({ children }: { children?: ReactNode }) => <h1 dir="auto">{children}</h1>,
        h2: ({ children }: { children?: ReactNode }) => <h2 dir="auto">{children}</h2>,
        h3: ({ children }: { children?: ReactNode }) => <h3 dir="auto">{children}</h3>,
        h4: ({ children }: { children?: ReactNode }) => <h4 dir="auto">{children}</h4>,
        blockquote: ({ children }: { children?: ReactNode }) => (
          <blockquote dir="auto">{children}</blockquote>
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
  if (inline) return md;
  return <div dir="rtl">{md}</div>;
}
