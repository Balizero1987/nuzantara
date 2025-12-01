import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextWidget } from '../ContextWidget'
import type { ChatMetadata } from '@/lib/api/types'

describe('ContextWidget', () => {
  const baseMetadata: ChatMetadata = {
    memory_used: false,
    rag_sources: [],
  }

  it('should return null when no metadata is provided', () => {
    const { container } = render(<ContextWidget metadata={baseMetadata} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render memory indicator when memory_used is true', () => {
    render(<ContextWidget metadata={{ ...baseMetadata, memory_used: true }} />)
    expect(screen.getByText('Context memory active')).toBeInTheDocument()
  })

  it('should render intent badge with correct color', () => {
    render(<ContextWidget metadata={{ ...baseMetadata, intent: 'visa_inquiry' }} />)
    expect(screen.getByText('Intent:')).toBeInTheDocument()
    expect(screen.getByText('visa inquiry')).toBeInTheDocument()
  })

  it('should render intent with default color for unknown intent', () => {
    render(<ContextWidget metadata={{ ...baseMetadata, intent: 'unknown_type' }} />)
    expect(screen.getByText('unknown type')).toBeInTheDocument()
  })

  it('should render tax_query intent', () => {
    render(<ContextWidget metadata={{ ...baseMetadata, intent: 'tax_query' }} />)
    expect(screen.getByText('tax query')).toBeInTheDocument()
  })

  it('should render legal_question intent', () => {
    render(<ContextWidget metadata={{ ...baseMetadata, intent: 'legal_question' }} />)
    expect(screen.getByText('legal question')).toBeInTheDocument()
  })

  it('should render pricing_request intent', () => {
    render(<ContextWidget metadata={{ ...baseMetadata, intent: 'pricing_request' }} />)
    expect(screen.getByText('pricing request')).toBeInTheDocument()
  })

  it('should render RAG sources', () => {
    const metadata: ChatMetadata = {
      ...baseMetadata,
      rag_sources: [
        { collection: 'visa', document: 'requirements.pdf', score: 0.95 },
      ],
    }
    render(<ContextWidget metadata={metadata} />)
    expect(screen.getByText('Sources (1)')).toBeInTheDocument()
    expect(screen.getByText('visa')).toBeInTheDocument()
    expect(screen.getByText('requirements.pdf')).toBeInTheDocument()
    expect(screen.getByText('95.0%')).toBeInTheDocument()
  })

  it('should show only 2 sources initially when more than 2 exist', () => {
    const metadata: ChatMetadata = {
      ...baseMetadata,
      rag_sources: [
        { collection: 'visa', document: 'doc1.pdf', score: 0.95 },
        { collection: 'legal', document: 'doc2.pdf', score: 0.90 },
        { collection: 'tax', document: 'doc3.pdf', score: 0.85 },
        { collection: 'corp', document: 'doc4.pdf', score: 0.80 },
      ],
    }
    render(<ContextWidget metadata={metadata} />)
    expect(screen.getByText('Sources (4)')).toBeInTheDocument()
    expect(screen.getByText('doc1.pdf')).toBeInTheDocument()
    expect(screen.getByText('doc2.pdf')).toBeInTheDocument()
    expect(screen.queryByText('doc3.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('Show all 4')).toBeInTheDocument()
  })

  it('should expand to show all sources when clicked', () => {
    const metadata: ChatMetadata = {
      ...baseMetadata,
      rag_sources: [
        { collection: 'visa', document: 'doc1.pdf', score: 0.95 },
        { collection: 'legal', document: 'doc2.pdf', score: 0.90 },
        { collection: 'tax', document: 'doc3.pdf', score: 0.85 },
      ],
    }
    render(<ContextWidget metadata={metadata} />)

    fireEvent.click(screen.getByText('Show all 3'))

    expect(screen.getByText('doc3.pdf')).toBeInTheDocument()
    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  it('should collapse sources when "Show less" is clicked', () => {
    const metadata: ChatMetadata = {
      ...baseMetadata,
      rag_sources: [
        { collection: 'visa', document: 'doc1.pdf', score: 0.95 },
        { collection: 'legal', document: 'doc2.pdf', score: 0.90 },
        { collection: 'tax', document: 'doc3.pdf', score: 0.85 },
      ],
    }
    render(<ContextWidget metadata={metadata} />)

    // Expand
    fireEvent.click(screen.getByText('Show all 3'))
    expect(screen.getByText('doc3.pdf')).toBeInTheDocument()

    // Collapse
    fireEvent.click(screen.getByText('Show less'))
    expect(screen.queryByText('doc3.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('Show all 3')).toBeInTheDocument()
  })

  it('should render source without score', () => {
    const metadata: ChatMetadata = {
      ...baseMetadata,
      rag_sources: [
        { collection: 'visa', document: 'no-score.pdf' },
      ],
    }
    render(<ContextWidget metadata={metadata} />)
    expect(screen.getByText('no-score.pdf')).toBeInTheDocument()
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('should render all metadata together', () => {
    const metadata: ChatMetadata = {
      memory_used: true,
      intent: 'visa_inquiry',
      rag_sources: [
        { collection: 'visa', document: 'requirements.pdf', score: 0.95 },
      ],
    }
    render(<ContextWidget metadata={metadata} />)

    expect(screen.getByText('Context memory active')).toBeInTheDocument()
    expect(screen.getByText('visa inquiry')).toBeInTheDocument()
    expect(screen.getByText('Sources (1)')).toBeInTheDocument()
  })
})
