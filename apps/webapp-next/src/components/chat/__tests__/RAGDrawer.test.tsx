import { render, screen, fireEvent } from '@testing-library/react'
import { RAGDrawer } from '../RAGDrawer'
import type { ChatMetadata } from '@/lib/api/types'

describe('RAGDrawer', () => {
  const mockMetadata: ChatMetadata = {
    memory_used: true,
    rag_sources: [
      {
        collection: 'visa',
        document: 'visa-requirements.pdf',
        score: 0.95,
        text_preview: 'Visa requirements for Indonesia...',
      },
      {
        collection: 'tax',
        document: 'tax-regulations.pdf',
        score: 0.87,
        text_preview: 'Indonesian tax regulations...',
      },
    ],
    intent: 'question',
  }

  const defaultProps = {
    metadata: mockMetadata,
    isOpen: true,
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render when metadata has rag_sources and isOpen is true', () => {
      render(<RAGDrawer {...defaultProps} />)

      expect(screen.getByText('Knowledge Sources')).toBeInTheDocument()
      expect(screen.getByText('2 documents used')).toBeInTheDocument()
    })

    it('should not render when metadata is undefined', () => {
      const { container } = render(<RAGDrawer {...defaultProps} metadata={undefined} />)
      expect(container.firstChild).toBeNull()
    })

    it('should not render when rag_sources is empty', () => {
      const metadataWithoutSources: ChatMetadata = {
        memory_used: true,
        rag_sources: [],
      }
      const { container } = render(
        <RAGDrawer {...defaultProps} metadata={metadataWithoutSources} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('should not render when rag_sources is undefined', () => {
      const metadataWithoutSources: ChatMetadata = {
        memory_used: true,
      }
      const { container } = render(
        <RAGDrawer {...defaultProps} metadata={metadataWithoutSources} />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Interaction', () => {
    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(<RAGDrawer {...defaultProps} />)

      const backdrop = container.querySelector('.fixed.inset-0')
      if (backdrop) {
        fireEvent.click(backdrop)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      }
    })

    it('should call onClose when close button is clicked', () => {
      render(<RAGDrawer {...defaultProps} />)

      const closeButton = screen.getByLabelText('Close drawer')
      fireEvent.click(closeButton)

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should toggle source selection when source is clicked', () => {
      const { container } = render(<RAGDrawer {...defaultProps} />)

      const sources = container.querySelectorAll('.cursor-pointer')
      const firstSource = sources[0] as HTMLElement

      if (firstSource) {
        // Click to select
        fireEvent.click(firstSource)
        expect(firstSource).toHaveClass('border-[#d4af37]')

        // Click again to deselect
        fireEvent.click(firstSource)
        // After deselect, the class should not be present
        expect(firstSource.classList.contains('border-[#d4af37]')).toBe(false)
      }
    })
  })

  describe('Source Display', () => {
    it('should display all rag sources', () => {
      render(<RAGDrawer {...defaultProps} />)

      expect(screen.getByText('visa')).toBeInTheDocument()
      expect(screen.getByText('tax')).toBeInTheDocument()
      expect(screen.getByText('visa-requirements.pdf')).toBeInTheDocument()
      expect(screen.getByText('tax-regulations.pdf')).toBeInTheDocument()
    })

    it('should display relevance scores', () => {
      render(<RAGDrawer {...defaultProps} />)

      expect(screen.getByText('95.0%')).toBeInTheDocument()
      expect(screen.getByText('87.0%')).toBeInTheDocument()
    })

    it('should display collection badges', () => {
      render(<RAGDrawer {...defaultProps} />)

      const badges = screen.getAllByText(/visa|tax/i)
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  describe('Drawer State', () => {
    it('should be visible when isOpen is true', () => {
      const { container } = render(<RAGDrawer {...defaultProps} isOpen={true} />)

      const drawer = container.querySelector('.fixed.right-0')
      expect(drawer).toHaveClass('translate-x-0')
    })

    it('should be hidden when isOpen is false', () => {
      const { container } = render(<RAGDrawer {...defaultProps} isOpen={false} />)

      const drawer = container.querySelector('.fixed.right-0')
      if (drawer) {
        expect(drawer).toHaveClass('translate-x-full')
      }
    })
  })

  describe('Expanded Preview', () => {
    it('should show preview when source is selected', () => {
      const { container } = render(<RAGDrawer {...defaultProps} />)

      const sources = container.querySelectorAll('.cursor-pointer')
      const firstSource = sources[0] as HTMLElement

      if (firstSource) {
        fireEvent.click(firstSource)

        // Check if preview section is visible
        const preview = screen.queryByText('Document Preview')
        expect(preview).toBeInTheDocument()
      }
    })

    it('should hide preview when source is deselected', () => {
      const { container } = render(<RAGDrawer {...defaultProps} />)

      const sources = container.querySelectorAll('.cursor-pointer')
      const firstSource = sources[0] as HTMLElement

      if (firstSource) {
        // Select
        fireEvent.click(firstSource)
        expect(screen.queryByText('Document Preview')).toBeInTheDocument()

        // Deselect
        fireEvent.click(firstSource)
        // Preview is conditionally rendered, so it should not be visible after deselect
        const preview = screen.queryByText('Document Preview')
        expect(preview).not.toBeInTheDocument()
      }
    })
  })
})

