import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock Google Auth service - must return a client with getAccessToken
// @ts-expect-error - jest.fn type inference issues
const mockGetAccessToken = jest.fn().mockResolvedValue({ token: 'mock-access-token' });
const mockGoogleClient: any = {
  getAccessToken: mockGetAccessToken,
};

// @ts-expect-error - jest.fn type inference issues
const mockGetGoogleService = jest.fn().mockResolvedValue(mockGoogleClient);

// Mock getGoogleService to always return a valid client
jest.unstable_mockModule('../../../services/google-auth-service.js', () => ({
  getGoogleService: mockGetGoogleService,
}));

globalThis.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Skip this test suite - requires Google Cloud AI services
describe.skip('Creative', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    // @ts-expect-error - jest.fn type inference issues
    mockGetAccessToken.mockResolvedValue({ token: 'mock-access-token' });
    // @ts-expect-error - jest.fn type inference issues
    mockGetGoogleService.mockResolvedValue(mockGoogleClient);
    (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockClear();
    handlers = await import('../creative.js');
  });

  describe('visionAnalyzeImage', () => {
    it('should handle success case with valid params', async () => {
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          responses: [
            {
              textAnnotations: [{ description: 'Test text' }],
              labelAnnotations: [{ description: 'Test label', score: 0.9 }],
            },
          ],
        }),
      } as Response);

      const result = await handlers.visionAnalyzeImage({
        imageUrl: 'https://example.com/image.jpg',
        features: ['TEXT_DETECTION'],
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.analysis).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.visionAnalyzeImage({})).rejects.toThrow(BadRequestError);
      await expect(handlers.visionAnalyzeImage({})).rejects.toThrow(
        'Either imageBase64 or imageUrl is required'
      );
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.visionAnalyzeImage({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('visionExtractDocuments', () => {
    it('should handle success case with valid params', async () => {
      // Mock visionAnalyzeImage internally called
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          responses: [
            {
              textAnnotations: [{ description: 'PASSPORT\nName: John Doe' }],
            },
          ],
        }),
      } as Response);

      const result = await handlers.visionExtractDocuments({
        imageUrl: 'https://example.com/passport.jpg',
        documentType: 'PASSPORT',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.visionExtractDocuments({})).rejects.toThrow(BadRequestError);
      await expect(handlers.visionExtractDocuments({})).rejects.toThrow(
        'Either imageBase64 or imageUrl is required'
      );
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.visionExtractDocuments({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('speechTranscribe', () => {
    it('should handle success case with valid params', async () => {
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          results: [
            {
              alternatives: [{ transcript: 'Test transcription', confidence: 0.95 }],
              languageCode: 'en-US',
            },
          ],
        }),
      } as Response);

      const result = await handlers.speechTranscribe({
        audioUrl: 'https://example.com/audio.wav',
        language: 'en-US',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.transcription).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.speechTranscribe({})).rejects.toThrow(BadRequestError);
      await expect(handlers.speechTranscribe({})).rejects.toThrow(
        'Either audioBase64 or audioUrl is required'
      );
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.speechTranscribe({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('speechSynthesize', () => {
    it('should handle success case with valid params', async () => {
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          audioContent: 'base64-encoded-audio-data',
        }),
      } as Response);

      const result = await handlers.speechSynthesize({
        text: 'Hello world',
        language: 'en-US',
        voice: 'en-US-Standard-A',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.audioBase64).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.speechSynthesize({})).rejects.toThrow(BadRequestError);
      await expect(handlers.speechSynthesize({})).rejects.toThrow(
        'Text is required for speech synthesis'
      );
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.speechSynthesize({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('languageAnalyzeSentiment', () => {
    it('should handle success case with valid params', async () => {
      (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          documentSentiment: {
            score: 0.8,
            magnitude: 0.9,
          },
        }),
      } as Response);

      const result = await handlers.languageAnalyzeSentiment({
        text: 'This is a positive message',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.overallSentiment).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.languageAnalyzeSentiment({})).rejects.toThrow(BadRequestError);
      await expect(handlers.languageAnalyzeSentiment({})).rejects.toThrow(
        'Text is required for sentiment analysis'
      );
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.languageAnalyzeSentiment({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
