import React, { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
}

interface ComponentProps {
    children?: ReactNode;
}

interface LinkProps extends ComponentProps {
    href?: string;
}

export const markdownComponents: any = {
    p: ({ children }: ComponentProps) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
    ul: ({ children }: ComponentProps) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
    ol: ({ children }: ComponentProps) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
    li: ({ children }: ComponentProps) => <li className="mb-1">{children}</li>,
    h1: ({ children }: ComponentProps) => <h1 className="text-2xl font-bold mb-2 mt-4 text-white">{children}</h1>,
    h2: ({ children }: ComponentProps) => <h2 className="text-xl font-bold mb-2 mt-3 text-white">{children}</h2>,
    h3: ({ children }: ComponentProps) => <h3 className="text-lg font-bold mb-2 mt-2 text-white">{children}</h3>,
    blockquote: ({ children }: ComponentProps) => (
        <blockquote className="border-l-4 border-[#d4af37] pl-4 italic my-2 text-gray-300 bg-gray-800/30 py-1 rounded-r">
            {children}
        </blockquote>
    ),
    code: ({ className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !String(children).includes('\n');

        if (isInline) {
            return (
                <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-yellow-200" {...props}>
                    {children}
                </code>
            );
        }

        return (
            <div className="relative my-3 rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700">
                <div className="flex items-center justify-between px-4 py-1.5 bg-[#2d2d2d] border-b border-gray-700">
                    <span className="text-xs text-gray-400">{match?.[1] || 'code'}</span>
                </div>
                <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-300">
                    <code className={className} {...props}>
                        {children}
                    </code>
                </pre>
            </div>
        );
    },
    a: ({ href, children }: LinkProps) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4af37] hover:underline hover:text-yellow-400 transition-colors"
        >
            {children}
        </a>
    ),
    table: ({ children }: ComponentProps) => (
        <div className="overflow-x-auto my-3 rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800/20">{children}</table>
        </div>
    ),
    thead: ({ children }: ComponentProps) => <thead className="bg-gray-800/50">{children}</thead>,
    tbody: ({ children }: ComponentProps) => <tbody className="divide-y divide-gray-700">{children}</tbody>,
    tr: ({ children }: ComponentProps) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
    th: ({ children }: ComponentProps) => (
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            {children}
        </th>
    ),
    td: ({ children }: ComponentProps) => <td className="px-4 py-3 text-sm text-gray-300 whitespace-pre-wrap">{children}</td>,
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="text-base text-gray-100 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
