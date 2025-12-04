/**
 * @jest-environment jsdom
 * 
 * Complete test coverage for useImageGeneration.ts
 * Target: 100% coverage
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useImageGeneration } from '../useImageGeneration';
import { useChatStore } from '@/lib/store/chat-store';

// Mocks
jest.mock('@/lib/store/chat-store', () => ({
  useChatStore: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('useImageGeneration', () => {
  const mockAddMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      addMessage: mockAddMessage,
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useImageGeneration());

    expect(result.current.showImageModal).toBe(false);
    expect(result.current.imagePrompt).toBe('');
    expect(result.current.isGeneratingImage).toBe(false);
    expect(result.current.generatedImageUrl).toBe(null);
  });

  it('should set showImageModal', () => {
    const { result } = renderHook(() => useImageGeneration());

    act(() => {
      result.current.setShowImageModal(true);
    });

    expect(result.current.showImageModal).toBe(true);
  });

  it('should set imagePrompt', () => {
    const { result } = renderHook(() => useImageGeneration());

    act(() => {
      result.current.setImagePrompt('A beautiful sunset');
    });

    expect(result.current.imagePrompt).toBe('A beautiful sunset');
  });

  it('should generate image successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        imageUrl: 'https://example.com/image.png',
      }),
    });

    const { result } = renderHook(() => useImageGeneration());

    act(() => {
      result.current.setImagePrompt('A beautiful sunset');
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'A beautiful sunset' }),
      });
      expect(mockAddMessage).toHaveBeenCalled();
      expect(result.current.generatedImageUrl).toBe('https://example.com/image.png');
      expect(result.current.showImageModal).toBe(false);
      expect(result.current.imagePrompt).toBe('');
    });
  });

  it('should handle image generation error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Generation failed',
      }),
    });

    const { result } = renderHook(() => useImageGeneration());

    act(() => {
      result.current.setImagePrompt('Test prompt');
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    await waitFor(() => {
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          content: expect.stringContaining("Sorry, I couldn't generate the image"),
        })
      );
      expect(result.current.isGeneratingImage).toBe(false);
    });
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useImageGeneration());

    act(() => {
      result.current.setImagePrompt('Test prompt');
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    await waitFor(() => {
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          content: expect.stringContaining("Sorry, I couldn't generate the image"),
        })
      );
      expect(result.current.isGeneratingImage).toBe(false);
    });
  });

  it('should not generate with empty prompt', async () => {
    const { result } = renderHook(() => useImageGeneration());

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockAddMessage).not.toHaveBeenCalled();
  });

  it('should not generate when already generating', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useImageGeneration());

    act(() => {
      result.current.setImagePrompt('Test prompt');
    });

    // Start first generation
    act(() => {
      result.current.handleGenerateImage();
    });

    await waitFor(() => {
      expect(result.current.isGeneratingImage).toBe(true);
    });

    const firstCallCount = mockFetch.mock.calls.length;

    // Try to generate again while still generating
    await act(async () => {
      await result.current.handleGenerateImage();
    });

    // Should not make another call
    expect(mockFetch.mock.calls.length).toBe(firstCallCount);
  });

  it('should reset image generation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        imageUrl: 'https://example.com/image.png',
      }),
    });

    const { result } = renderHook(() => useImageGeneration());

    act(() => {
      result.current.setShowImageModal(true);
      result.current.setImagePrompt('Test prompt');
    });

    // Generate image first to set generatedImageUrl
    await act(async () => {
      await result.current.handleGenerateImage();
    });

    await waitFor(() => {
      expect(result.current.generatedImageUrl).toBe('https://example.com/image.png');
    });

    // Now reset - this will clear the generatedImageUrl internally
    act(() => {
      result.current.resetImageGeneration();
    });

    expect(result.current.showImageModal).toBe(false);
    expect(result.current.imagePrompt).toBe('');
    expect(result.current.generatedImageUrl).toBe(null);
  });

  it('should add user message when generating', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        imageUrl: 'https://example.com/image.png',
      }),
    });

    const { result } = renderHook(() => useImageGeneration());

    act(() => {
      result.current.setImagePrompt('A cat');
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    await waitFor(() => {
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Generate image: A cat',
        })
      );
    });
  });

  it('should handle response without imageUrl', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        // No imageUrl
      }),
    });

    const { result } = renderHook(() => useImageGeneration());

    act(() => {
      result.current.setImagePrompt('Test');
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    await waitFor(() => {
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          content: expect.stringContaining("Sorry, I couldn't generate the image"),
        })
      );
    });
  });
});

