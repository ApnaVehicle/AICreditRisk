'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { motion } from 'framer-motion'

interface MarkdownMessageProps {
  content: string
  isStreaming?: boolean
}

export function MarkdownMessage({ content, isStreaming = false }: MarkdownMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="markdown-content"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Bold text
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          // Italic text
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),
          // Unordered lists
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 space-y-1.5 list-disc marker:text-primary">
              {children}
            </ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 space-y-1.5 list-decimal marker:text-primary marker:font-semibold">
              {children}
            </ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="pl-2 leading-relaxed">{children}</li>
          ),
          // Inline code
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-sm border border-primary/20"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            // Block code
            return (
              <code
                className={`block ${className || ''} font-mono text-sm`}
                {...props}
              >
                {children}
              </code>
            )
          },
          // Code blocks
          pre: ({ children }) => (
            <pre className="mb-3 p-4 rounded-lg bg-sidebar overflow-x-auto border border-border">
              {children}
            </pre>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="mb-3 pl-4 py-2 border-l-4 border-primary bg-primary/5 italic">
              {children}
            </blockquote>
          ),
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h4>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          // Tables
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="min-w-full border-collapse border border-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border last:border-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-sm">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm">{children}</td>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-4 border-t border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-2 h-4 ml-1 bg-primary rounded-sm"
        />
      )}
    </motion.div>
  )
}
