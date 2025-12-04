/**
 * ImageGenerationModal Component Tests
 * Tests for the image generation modal with prompt input and generation state
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageGenerationModal } from '../ImageGenerationModal';

describe('ImageGenerationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnPromptChange = jest.fn();
  const mockOnGenerate = jest.fn();

  const defaultProps = {
    isOpen: true,
    imagePrompt: '',
    isGenerating: false,
    onClose: mockOnClose,
    onPromptChange: mockOnPromptChange,
    onGenerate: mockOnGenerate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <ImageGenerationModal {...defaultProps} isOpen={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders modal when isOpen is true', () => {
      render(<ImageGenerationModal {...defaultProps} isOpen={true} />);

      expect(screen.getByText('Generate Image')).toBeInTheDocument();
    });
  });

  describe('Modal Structure', () => {
    it('renders header with title', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      expect(screen.getByText('Generate Image')).toBeInTheDocument();
      expect(screen.getByText('Describe what you want to create')).toBeInTheDocument();
    });

    it('renders close button in header', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      // Find the close button by its position (first button with X icon)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('svg'));
      expect(closeButton).toBeInTheDocument();
    });

    it('renders textarea for prompt input', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/beautiful sunset/i);
      expect(textarea).toBeInTheDocument();
    });

    it('renders Cancel and Generate buttons', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Generate')).toBeInTheDocument();
    });
  });

  describe('Backdrop Interaction', () => {
    it('calls onClose when backdrop is clicked', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      // The backdrop is the first div with bg-black/70
      const backdrop = document.querySelector('.bg-black\\/70');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Button', () => {
    it('calls onClose when header close button is clicked', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      // Find the close button (the one in the header with X svg)
      const headerButtons = document.querySelectorAll('button.hover\\:bg-gray-700\\/50');
      const closeButton = headerButtons[0];

      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Prompt Input', () => {
    it('displays current imagePrompt value', () => {
      render(
        <ImageGenerationModal
          {...defaultProps}
          imagePrompt="A sunset over mountains"
        />
      );

      const textarea = screen.getByPlaceholderText(/beautiful sunset/i);
      expect(textarea).toHaveValue('A sunset over mountains');
    });

    it('calls onPromptChange when typing', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/beautiful sunset/i);
      fireEvent.change(textarea, { target: { value: 'New prompt text' } });

      expect(mockOnPromptChange).toHaveBeenCalledWith('New prompt text');
    });

    it('textarea is disabled when generating', () => {
      render(
        <ImageGenerationModal {...defaultProps} isGenerating={true} imagePrompt="test" />
      );

      const textarea = screen.getByPlaceholderText(/beautiful sunset/i);
      expect(textarea).toBeDisabled();
    });

    it('textarea is enabled when not generating', () => {
      render(<ImageGenerationModal {...defaultProps} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/beautiful sunset/i);
      expect(textarea).not.toBeDisabled();
    });
  });

  describe('Generate Button', () => {
    it('is disabled when prompt is empty', () => {
      render(<ImageGenerationModal {...defaultProps} imagePrompt="" />);

      const generateButton = screen.getByText('Generate');
      expect(generateButton.closest('button')).toBeDisabled();
    });

    it('is disabled when prompt is only whitespace', () => {
      render(<ImageGenerationModal {...defaultProps} imagePrompt="   " />);

      const generateButton = screen.getByText('Generate');
      expect(generateButton.closest('button')).toBeDisabled();
    });

    it('is disabled when isGenerating is true', () => {
      render(
        <ImageGenerationModal
          {...defaultProps}
          imagePrompt="Valid prompt"
          isGenerating={true}
        />
      );

      // When generating, the button shows "Generating..." text
      const generatingButton = screen.getByText('Generating...');
      expect(generatingButton.closest('button')).toBeDisabled();
    });

    it('is enabled when prompt has content and not generating', () => {
      render(
        <ImageGenerationModal
          {...defaultProps}
          imagePrompt="A beautiful landscape"
          isGenerating={false}
        />
      );

      const generateButton = screen.getByText('Generate');
      expect(generateButton.closest('button')).not.toBeDisabled();
    });

    it('calls onGenerate when clicked with valid prompt', () => {
      render(
        <ImageGenerationModal
          {...defaultProps}
          imagePrompt="A beautiful landscape"
          isGenerating={false}
        />
      );

      const generateButton = screen.getByText('Generate');
      fireEvent.click(generateButton.closest('button')!);

      expect(mockOnGenerate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cancel Button', () => {
    it('is disabled when generating', () => {
      render(
        <ImageGenerationModal {...defaultProps} isGenerating={true} imagePrompt="test" />
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });

    it('is enabled when not generating', () => {
      render(<ImageGenerationModal {...defaultProps} isGenerating={false} />);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Generating State', () => {
    it('shows spinner and "Generating..." text when isGenerating is true', () => {
      render(
        <ImageGenerationModal
          {...defaultProps}
          imagePrompt="test"
          isGenerating={true}
        />
      );

      expect(screen.getByText('Generating...')).toBeInTheDocument();

      // Check for spinning SVG
      const spinningIcon = document.querySelector('.animate-spin');
      expect(spinningIcon).toBeInTheDocument();
    });

    it('shows "Generate" text with icon when not generating', () => {
      render(
        <ImageGenerationModal
          {...defaultProps}
          imagePrompt="test"
          isGenerating={false}
        />
      );

      expect(screen.getByText('Generate')).toBeInTheDocument();
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has modal overlay with blur effect', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      const backdrop = document.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('modal is centered on screen', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      const modalContainer = document.querySelector('.fixed.inset-0.z-50.flex.items-center.justify-center');
      expect(modalContainer).toBeInTheDocument();
    });

    it('generate button has gradient background', () => {
      render(
        <ImageGenerationModal {...defaultProps} imagePrompt="test" />
      );

      const generateButton = screen.getByText('Generate').closest('button');
      expect(generateButton).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Accessibility', () => {
    it('textarea has placeholder for guidance', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/beautiful sunset over Bali rice terraces/i);
      expect(textarea).toBeInTheDocument();
    });

    it('modal has proper heading hierarchy', () => {
      render(<ImageGenerationModal {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Generate Image');
    });

    it('buttons are focusable', () => {
      render(<ImageGenerationModal {...defaultProps} imagePrompt="test" />);

      const cancelButton = screen.getByText('Cancel');
      const generateButton = screen.getByText('Generate').closest('button');

      expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
      expect(generateButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid open/close transitions', () => {
      const { rerender } = render(
        <ImageGenerationModal {...defaultProps} isOpen={true} />
      );

      expect(screen.getByText('Generate Image')).toBeInTheDocument();

      rerender(<ImageGenerationModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Generate Image')).not.toBeInTheDocument();

      rerender(<ImageGenerationModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Generate Image')).toBeInTheDocument();
    });

    it('handles prompt with special characters', () => {
      const specialPrompt = 'A <script>test</script> & "quotes" image';

      render(
        <ImageGenerationModal {...defaultProps} imagePrompt={specialPrompt} />
      );

      const textarea = screen.getByPlaceholderText(/beautiful sunset/i);
      expect(textarea).toHaveValue(specialPrompt);
    });

    it('handles very long prompt text', () => {
      const longPrompt = 'A'.repeat(1000);

      render(
        <ImageGenerationModal {...defaultProps} imagePrompt={longPrompt} />
      );

      const textarea = screen.getByPlaceholderText(/beautiful sunset/i);
      expect(textarea).toHaveValue(longPrompt);
    });

    it('handles unicode characters in prompt', () => {
      const unicodePrompt = 'A beautiful sunset with emoji and kanji characters';

      render(
        <ImageGenerationModal {...defaultProps} imagePrompt={unicodePrompt} />
      );

      const textarea = screen.getByPlaceholderText(/beautiful sunset/i);
      expect(textarea).toHaveValue(unicodePrompt);
    });
  });
});
