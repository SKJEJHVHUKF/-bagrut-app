'use client';

import { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Renders markdown + LaTeX. `inline` strips the wrapping <p> so the math
// sits naturally next to surrounding text instead of starting a new block.
export function MathText({ children, inline = false }: { children: string; inline?: boolean }) {
  const components = inline
    ? { p: ({ children }: { children?: ReactNode }) => <>{children}</> }
    : undefined;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}
