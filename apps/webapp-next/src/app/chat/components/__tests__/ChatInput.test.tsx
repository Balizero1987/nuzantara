/**
 * ChatInput Component Tests
 * Tests for the chat input component with file upload and image generation
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  const mockOnInputChange = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnKeyDown = jest.fn();
  const mockOnFileUpload = jest.fn();
  const mockOnClearPreview = jest.fn();
  const mockOnOpenImageModal = jest.fn();

  const defaultProps = {
    input: '',
    isLoading: false,
    uploadPreview: null,
    onInputChange: mockOnInputChange,
    onSubmit: mockOnSubmit,
    onKeyDown: mockOnKeyDown,
    onFileUpload: mockOnFileUpload,
    onClearPreview: mockOnClearPreview,
    onOpenImageModal: mockOnOpenImageModal,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the input textarea', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByPlaceholderText('Ketik pesan Anda...')).toBeInTheDocument();
    });

    it('renders all action buttons', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByRole('button', { name: /generate image/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('displays current input value', () => {
      render(<ChatInput {...defaultProps} input="Hello world" />);

      const textarea = screen.getByPlaceholderText('Ketik pesan Anda...');
      expect(textarea).toHaveValue('Hello world');
    });
  });

  describe('Input Interactions', () => {
    it('calls onInputChange when typing', async () => {
      render(<ChatInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Ketik pesan Anda...');
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      expect(mockOnInputChange).toHaveBeenCalled();
    });

    it('calls onKeyDown when pressing keys', () => {
      render(<ChatInput {...defaultProps} input="test" />);

      const textarea = screen.getByPlaceholderText('Ketik pesan Anda...');
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(mockOnKeyDown).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit when form is submitted', () => {
      render(<ChatInput {...defaultProps} input="test message" />);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('disables send button when input is empty', () => {
      render(<ChatInput {...defaultProps} input="" />);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('disables send button when loading', () => {
      render(<ChatInput {...defaultProps} input="test" isLoading={true} />);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when input has content and not loading', () => {
      render(<ChatInput {...defaultProps} input="test message" isLoading={false} />);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('disables textarea when loading', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      const textarea = screen.getByPlaceholderText('Ketik pesan Anda...');
      expect(textarea).toBeDisabled();
    });

    it('disables all action buttons when loading', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      const imageButton = screen.getByRole('button', { name: /generate image/i });
      const uploadButton = screen.getByRole('button', { name: /upload file/i });
      const sendButton = screen.getByRole('button', { name: /send message/i });

      expect(imageButton).toBeDisabled();
      expect(uploadButton).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Image Generation', () => {
    it('calls onOpenImageModal when image button is clicked', () => {
      render(<ChatInput {...defaultProps} />);

      const imageButton = screen.getByRole('button', { name: /generate image/i });
      fireEvent.click(imageButton);

      expect(mockOnOpenImageModal).toHaveBeenCalled();
    });
  });

  describe('File Upload', () => {
    it('has hidden file input', () => {
      const { container } = render(<ChatInput {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });

    it('accepts only images', () => {
      const { container } = render(<ChatInput {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('calls onFileUpload when file is selected', () => {
      const { container } = render(<ChatInput {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(mockOnFileUpload).toHaveBeenCalled();
    });
  });

  describe('Upload Preview', () => {
    it('does not show preview when uploadPreview is null', () => {
      render(<ChatInput {...defaultProps} uploadPreview={null} />);

      expect(screen.queryByAltText('Upload preview')).not.toBeInTheDocument();
    });

    it('shows preview image when uploadPreview is provided', () => {
      render(<ChatInput {...defaultProps} uploadPreview="data:image/png;base64,test" />);

      const preview = screen.getByAltText('Upload preview');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute('src', 'data:image/png;base64,test');
    });

    it('calls onClearPreview when remove button is clicked', () => {
      render(<ChatInput {...defaultProps} uploadPreview="data:image/png;base64,test" />);

      // The remove button has × text
      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);

      expect(mockOnClearPreview).toHaveBeenCalled();
    });
  });

  describe('Textarea Auto-resize', () => {
    it('textarea has min and max height styles', () => {
      render(<ChatInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Ketik pesan Anda...');
      expect(textarea).toHaveStyle({ minHeight: '32px', maxHeight: '120px' });
    });
  });

  describe('Accessibility', () => {
    it('buttons have aria-labels', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByLabelText('Generate image')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload file')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });
  });
});
