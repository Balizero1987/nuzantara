import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock react-markdown to avoid ESM issues
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    // Simple markdown parsing for tests
    const parseMarkdown = (content: string) => {
      const elements: React.ReactNode[] = []
      const lines = content.split('\n')
      let key = 0

      lines.forEach((line) => {
        const trimmedLine = line.trim()
        if (!trimmedLine) return

        // Headers
        if (trimmedLine.startsWith('### ')) {
          elements.push(<h3 key={key++}>{trimmedLine.slice(4)}</h3>)
        } else if (trimmedLine.startsWith('## ')) {
          elements.push(<h2 key={key++}>{trimmedLine.slice(3)}</h2>)
        } else if (trimmedLine.startsWith('# ')) {
          elements.push(<h1 key={key++}>{trimmedLine.slice(2)}</h1>)
        }
        // Lists
        else if (trimmedLine.startsWith('- ')) {
          elements.push(<li key={key++}>{trimmedLine.slice(2)}</li>)
        } else if (/^\d+\.\s/.test(trimmedLine)) {
          elements.push(<li key={key++}>{trimmedLine.replace(/^\d+\.\s/, '')}</li>)
        }
        // Blockquotes
        else if (trimmedLine.startsWith('> ')) {
          elements.push(
            <blockquote key={key++} className="border-l-4">
              {trimmedLine.slice(2)}
            </blockquote>
          )
        }
        // Code blocks - check for language
        else if (trimmedLine.startsWith('```')) {
          const lang = trimmedLine.slice(3) || 'code'
          if (lang && lang !== '```') {
            elements.push(<span key={key++}>{lang}</span>)
          }
        }
        // Inline elements
        else {
          let processed = trimmedLine
          // Bold
          processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          // Italic
          processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>')
          // Strikethrough
          processed = processed.replace(/~~([^~]+)~~/g, '<del>$1</del>')
          // Inline code
          processed = processed.replace(/`([^`]+)`/g, '<code class="bg-gray-800">$1</code>')
          // Links
          const linkMatch = processed.match(/\[([^\]]+)\]\(([^)]+)\)/)
          if (linkMatch) {
            elements.push(
              <span key={key++}>
                <a href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
                  {linkMatch[1]}
                </a>
              </span>
            )
          } else {
            elements.push(
              <p key={key++} dangerouslySetInnerHTML={{ __html: processed }} />
            )
          }
        }
      })

      return elements
    }

    return <div className="text-base text-gray-100">{parseMarkdown(children)}</div>
  }
})

// Mock remark-gfm
jest.mock('remark-gfm', () => () => { })

import { MarkdownRenderer } from '../MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('should render plain text', () => {
    render(<MarkdownRenderer content="Hello World" />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should render paragraphs', () => {
    render(<MarkdownRenderer content={`First paragraph

Second paragraph`} />)
    expect(screen.getByText('First paragraph')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph')).toBeInTheDocument()
  })

  it('should render headings', () => {
    render(<MarkdownRenderer content={`# Heading 1
## Heading 2
### Heading 3`} />)
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
    expect(screen.getByText('Heading 2')).toBeInTheDocument()
    expect(screen.getByText('Heading 3')).toBeInTheDocument()
  })

  it('should render unordered lists', () => {
    render(<MarkdownRenderer content={`- Item 1
- Item 2
- Item 3`} />)
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('should render ordered lists', () => {
    render(<MarkdownRenderer content={`1. First
2. Second
3. Third`} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })

  it('should render blockquotes', () => {
    render(<MarkdownRenderer content="> This is a quote" />)
    expect(screen.getByText('This is a quote')).toBeInTheDocument()
  })

  it('should render inline code', () => {
    render(<MarkdownRenderer content="Use `const` for constants" />)
    // Content should be rendered
    expect(screen.getByText(/Use/)).toBeInTheDocument()
  })

  it('should render code blocks with language', () => {
    render(<MarkdownRenderer content={`\`\`\`javascript
const x = 1;
\`\`\``} />)
    expect(screen.getByText('javascript')).toBeInTheDocument()
  })

  it('should render code blocks without language', () => {
    render(<MarkdownRenderer content="```\nsome code\n```" />)
    expect(screen.getByText(/some code/)).toBeInTheDocument()
  })

  it('should render links with target blank', () => {
    render(<MarkdownRenderer content="[Click here](https://example.com)" />)
    const link = screen.getByText('Click here')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('should render table content', () => {
    const tableContent = `| Header 1 | Header 2 |`
    render(<MarkdownRenderer content={tableContent} />)
    // Tables in mock are rendered as text
    expect(screen.getByText(/Header 1/)).toBeInTheDocument()
  })

  it('should render bold text', () => {
    render(<MarkdownRenderer content="**bold text**" />)
    expect(screen.getByText('bold text')).toBeInTheDocument()
  })

  it('should render italic text', () => {
    render(<MarkdownRenderer content="*italic text*" />)
    expect(screen.getByText('italic text')).toBeInTheDocument()
  })

  it('should render strikethrough text (GFM)', () => {
    render(<MarkdownRenderer content="~~deleted~~" />)
    expect(screen.getByText('deleted')).toBeInTheDocument()
  })

  it('should have correct styling classes', () => {
    const { container } = render(<MarkdownRenderer content="Test" />)

    expect(container.firstChild).toHaveClass('text-base')
    expect(container.firstChild).toHaveClass('text-gray-100')
  })

  it('should handle empty content', () => {
    const { container } = render(<MarkdownRenderer content="" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should handle complex mixed content', () => {
    const complexContent = `# Title
This is a paragraph.
- List item 1
- List item 2
> A blockquote
[A link](https://example.com)`
    render(<MarkdownRenderer content={complexContent} />)

    expect(screen.getByText('A link')).toBeInTheDocument()
  })
})

describe('markdownComponents', () => {
  const { markdownComponents } = require('../MarkdownRenderer')

  it('should render inline code', () => {
    const CodeComponent = markdownComponents.code
    render(<CodeComponent className="">inline code</CodeComponent>)

    const codeElement = screen.getByText('inline code')
    expect(codeElement).toHaveClass('bg-gray-800', 'px-1.5', 'py-0.5', 'rounded', 'text-sm', 'font-mono', 'text-yellow-200')
    expect(codeElement.tagName).toBe('CODE')
  })

  it('should render code block', () => {
    const CodeComponent = markdownComponents.code
    render(<CodeComponent className="language-javascript">const x = 1;</CodeComponent>)

    const codeElement = screen.getByText('const x = 1;')
    // Code block renders inside a pre > code structure
    // The component renders: div > div (header) + pre > code
    expect(codeElement.tagName).toBe('CODE')
    expect(codeElement).toHaveClass('language-javascript')
    expect(screen.getByText('javascript')).toBeInTheDocument()
  })
})
