import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeMathDelimiters } from '../lib/normalizeMathDelimiters.js';
import 'katex/dist/katex.min.css';

export default function MarkdownMessage({ content, className = '' }) {
    const prepared = normalizeMathDelimiters(content ?? '');

    return (
        <div className={`markdown-message ${className}`.trim()}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({ children }) => <p className="markdown-message__p">{children}</p>,
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                }}
            >
                {prepared}
            </ReactMarkdown>
        </div>
    );
}
