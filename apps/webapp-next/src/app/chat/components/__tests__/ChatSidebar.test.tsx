/**
 * ChatSidebar Component Tests
 * Tests for the sidebar with chat history and new chat functionality
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatSidebar } from '../ChatSidebar';

describe('ChatSidebar', () => {
  const mockOnNewChat = jest.fn();
  const mockOnSelectChat = jest.fn();
  const mockOnClose = jest.fn();

  const mockPreviousChats = [
    { id: 1, title: 'Tourist visa for Bali', date: '2 hours ago' },
    { id: 2, title: 'Indonesia tax information', date: 'Yesterday' },
    { id: 3, title: 'Company registration in Jakarta', date: '3 days ago' },
  ];

  const defaultProps = {
    isOpen: false,
    previousChats: mockPreviousChats,
    onNewChat: mockOnNewChat,
    onSelectChat: mockOnSelectChat,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<ChatSidebar {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders "Chat History" title', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Chat History')).toBeInTheDocument();
    });

    it('renders "New Chat" button', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);
      expect(screen.getByText('New Chat')).toBeInTheDocument();
    });

    it('renders ZANTARA footer text', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);
      expect(screen.getByText('ZANTARA')).toBeInTheDocument();
      expect(screen.getByText('- Your AI Assistant')).toBeInTheDocument();
    });
  });

  describe('Sidebar Visibility', () => {
    it('is hidden when isOpen is false', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={false} />);

      // Should have -translate-x-full class
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('is visible when isOpen is true', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={true} />);

      // Should have translate-x-0 class
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('translate-x-0');
    });
  });

  describe('Backdrop', () => {
    it('does not render backdrop when closed', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={false} />);

      // Backdrop should not exist
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).not.toBeInTheDocument();
    });

    it('renders backdrop when open', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={true} />);

      // Backdrop should exist
      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={true} />);

      const backdrop = container.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Button', () => {
    it('renders close button in header', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);

      // Close button is next to "Chat History"
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('calls onClose when close button is clicked', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={true} />);

      // Find close button by looking for X icon
      const headerCloseButton = container.querySelector('.border-b button');
      fireEvent.click(headerCloseButton!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('New Chat Button', () => {
    it('calls onNewChat when clicked', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);

      const newChatButton = screen.getByText('New Chat');
      fireEvent.click(newChatButton);

      expect(mockOnNewChat).toHaveBeenCalledTimes(1);
    });

    it('has golden gradient styling', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);

      const newChatButton = screen.getByText('New Chat').closest('button');
      expect(newChatButton).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Chat History List', () => {
    it('renders all previous chats', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);

      expect(screen.getByText('Tourist visa for Bali')).toBeInTheDocument();
      expect(screen.getByText('Indonesia tax information')).toBeInTheDocument();
      expect(screen.getByText('Company registration in Jakarta')).toBeInTheDocument();
    });

    it('renders chat dates', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);

      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });

    it('calls onSelectChat with correct id when chat is clicked', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);

      const firstChat = screen.getByText('Tourist visa for Bali');
      fireEvent.click(firstChat);

      expect(mockOnSelectChat).toHaveBeenCalledWith(1);
    });

    it('calls onSelectChat with different id for different chat', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} />);

      const secondChat = screen.getByText('Indonesia tax information');
      fireEvent.click(secondChat);

      expect(mockOnSelectChat).toHaveBeenCalledWith(2);
    });
  });

  describe('Empty State', () => {
    it('renders correctly with no previous chats', () => {
      render(<ChatSidebar {...defaultProps} isOpen={true} previousChats={[]} />);

      // Should still render the sidebar structure
      expect(screen.getByText('Chat History')).toBeInTheDocument();
      expect(screen.getByText('New Chat')).toBeInTheDocument();
    });
  });

  describe('Chat Icons', () => {
    it('renders chat icons for each chat item', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={true} />);

      // Each chat should have an icon
      const chatIcons = container.querySelectorAll('.text-\\[\\#d4af37\\]');
      expect(chatIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('has fixed positioning', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={true} />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('fixed');
    });

    it('has correct width (w-80)', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={true} />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-80');
    });

    it('has full height', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={true} />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('h-full');
    });

    it('has z-index higher than backdrop', () => {
      const { container } = render(<ChatSidebar {...defaultProps} isOpen={true} />);

      const sidebar = container.querySelector('aside');
      const backdrop = container.querySelector('.bg-black\\/50');

      expect(sidebar).toHaveClass('z-50');
      expect(backdrop).toHaveClass('z-40');
    });
  });
});
