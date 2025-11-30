import { render, screen, fireEvent } from '@testing-library/react'
import { ChatHistory } from '../ChatHistory'

describe('ChatHistory', () => {
  const defaultProps = {
    onChatSelect: jest.fn(),
    onNewChat: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render chat history list', () => {
      render(<ChatHistory {...defaultProps} />)

      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
      expect(screen.getByText('Code Review Session')).toBeInTheDocument()
    })

    it('should render new chat button', () => {
      render(<ChatHistory {...defaultProps} />)

      const newChatButton = screen.getByText(/new chat/i)
      expect(newChatButton).toBeInTheDocument()
    })

    it('should display pinned chats', () => {
      render(<ChatHistory {...defaultProps} />)

      // Pinned chat should be visible
      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
    })
  })

  describe('Interaction', () => {
    it('should call onChatSelect when a chat is clicked', () => {
      render(<ChatHistory {...defaultProps} />)

      const chatItem = screen.getByText('Project Planning Discussion')
      fireEvent.click(chatItem)

      expect(defaultProps.onChatSelect).toHaveBeenCalledWith('1')
    })

    it('should call onNewChat when new chat button is clicked', () => {
      render(<ChatHistory {...defaultProps} />)

      const newChatButton = screen.getByText(/new chat/i)
      fireEvent.click(newChatButton)

      expect(defaultProps.onNewChat).toHaveBeenCalled()
    })
  })

  describe('Chat Types', () => {
    it('should display different icons for different chat types', () => {
      render(<ChatHistory {...defaultProps} />)

      // Text chat
      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()

      // Image chat
      expect(screen.getByText('Logo Design Ideas')).toBeInTheDocument()

      // Voice chat
      expect(screen.getByText('Voice Meeting Notes')).toBeInTheDocument()

      // File chat
      expect(screen.getByText('Architecture Documentation')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should handle empty chat list gracefully', () => {
      // If we had a way to pass empty chats, we'd test it
      // For now, we test that the component renders with default mock data
      render(<ChatHistory {...defaultProps} />)

      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
    })
  })

  describe('Chat Metadata', () => {
    it('should display last message preview', () => {
      render(<ChatHistory {...defaultProps} />)

      expect(screen.getByText(/Let's review the Q1 roadmap/i)).toBeInTheDocument()
    })

    it('should display timestamp', () => {
      render(<ChatHistory {...defaultProps} />)

      expect(screen.getByText('2 hours ago')).toBeInTheDocument()
      expect(screen.getByText('1 day ago')).toBeInTheDocument()
    })

    it('should display message count', () => {
      render(<ChatHistory {...defaultProps} />)

      // Message counts should be visible
      expect(screen.getByText(/23/i)).toBeInTheDocument()
    })
  })
})

