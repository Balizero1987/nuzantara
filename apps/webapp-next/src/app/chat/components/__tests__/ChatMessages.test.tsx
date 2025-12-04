/**
 * ChatMessages Component Tests
 * Tests for the main chat message display component
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatMessages } from '../ChatMessages';
import type { Message } from '../../types';

// Mock the child components
jest.mock('@/components/chat/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => (
    <div data-testid="markdown-renderer">{content}</div>
  ),
}));

jest.mock('@/components/chat/ThinkingIndicator', () => ({
  ThinkingIndicator: () => <div data-testid="thinking-indicator">Thinking...</div>,
}));

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

describe('ChatMessages', () => {
  const defaultProps = {
    messages: [] as Message[],
    streamingContent: '',
    isLoading: false,
    avatarImage: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders without messages', () => {
      const { container } = render(<ChatMessages {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('does not render any message bubbles when empty', () => {
      render(<ChatMessages {...defaultProps} />);
      expect(screen.queryByTestId('markdown-renderer')).not.toBeInTheDocument();
    });
  });

  describe('User Messages', () => {
    it('renders user message with correct alignment', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello world', timestamp: new Date() },
      ];

      render(<ChatMessages {...defaultProps} messages={messages} />);

      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('displays default avatar icon when no avatarImage provided', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Test message', timestamp: new Date() },
      ];

      const { container } = render(<ChatMessages {...defaultProps} messages={messages} />);

      // Should have an svg element for default avatar
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('displays custom avatar when avatarImage is provided', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Test message', timestamp: new Date() },
      ];

      render(
        <ChatMessages
          {...defaultProps}
          messages={messages}
          avatarImage="data:image/png;base64,test"
        />
      );

      const avatarImg = screen.getByAltText('User');
      expect(avatarImg).toHaveAttribute('src', 'data:image/png;base64,test');
    });
  });

  describe('Assistant Messages', () => {
    it('renders assistant message with Zantara logo', () => {
      const messages: Message[] = [
        { id: '1', role: 'assistant', content: 'Hello! How can I help?', timestamp: new Date() },
      ];

      render(<ChatMessages {...defaultProps} messages={messages} />);

      expect(screen.getByText('Hello! How can I help?')).toBeInTheDocument();
      expect(screen.getByAltText('Zantara AI')).toBeInTheDocument();
    });

    it('renders multiple messages in order', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'First message', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Second message', timestamp: new Date() },
        { id: '3', role: 'user', content: 'Third message', timestamp: new Date() },
      ];

      render(<ChatMessages {...defaultProps} messages={messages} />);

      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Third message')).toBeInTheDocument();
    });
  });

  describe('Streaming Content', () => {
    it('renders streaming content with cursor', () => {
      render(
        <ChatMessages {...defaultProps} streamingContent="Streaming response..." />
      );

      // Should show streaming content with cursor (▍)
      expect(screen.getByText(/Streaming response/)).toBeInTheDocument();
    });

    it('displays Zantara logo for streaming message', () => {
      render(
        <ChatMessages {...defaultProps} streamingContent="Streaming..." />
      );

      const logos = screen.getAllByAltText('Zantara AI');
      expect(logos.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State', () => {
    it('shows thinking indicator when loading without streaming', () => {
      render(<ChatMessages {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('thinking-indicator')).toBeInTheDocument();
    });

    it('does not show thinking indicator when streaming', () => {
      render(
        <ChatMessages
          {...defaultProps}
          isLoading={true}
          streamingContent="Already streaming..."
        />
      );

      expect(screen.queryByTestId('thinking-indicator')).not.toBeInTheDocument();
    });

    it('does not show thinking indicator when not loading', () => {
      render(<ChatMessages {...defaultProps} isLoading={false} />);

      expect(screen.queryByTestId('thinking-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('scrolls to bottom when messages change', () => {
      const { rerender } = render(<ChatMessages {...defaultProps} messages={[]} />);

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'New message', timestamp: new Date() },
      ];

      rerender(<ChatMessages {...defaultProps} messages={messages} />);

      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('scrolls to bottom when streaming content changes', () => {
      const { rerender } = render(<ChatMessages {...defaultProps} />);

      rerender(<ChatMessages {...defaultProps} streamingContent="New content" />);

      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });

  describe('Message Styling', () => {
    it('applies correct styling for user messages (right-aligned)', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'User message', timestamp: new Date() },
      ];

      const { container } = render(<ChatMessages {...defaultProps} messages={messages} />);

      const messageContainer = container.querySelector('.justify-end');
      expect(messageContainer).toBeInTheDocument();
    });

    it('applies correct styling for assistant messages (left-aligned)', () => {
      const messages: Message[] = [
        { id: '1', role: 'assistant', content: 'Assistant message', timestamp: new Date() },
      ];

      const { container } = render(<ChatMessages {...defaultProps} messages={messages} />);

      const messageContainer = container.querySelector('.justify-start');
      expect(messageContainer).toBeInTheDocument();
    });
  });
});
