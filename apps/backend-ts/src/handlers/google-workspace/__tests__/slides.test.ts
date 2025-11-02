import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock Google Slides service
const mockSlides = {
  presentations: {
    create: jest.fn().mockResolvedValue({
      data: {
        presentationId: 'test-presentation-id',
        slides: []
      }
    }),
    get: jest.fn().mockResolvedValue({
      data: {
        presentationId: 'test-presentation-id',
        title: 'Test Presentation',
        revisionId: 'rev-1',
        slides: [{
          objectId: 'slide-1',
          pageElements: [{
            shape: {
              text: {
                textElements: [{
                  textRun: { content: 'Slide content' }
                }]
              }
            }
          }]
        }]
      }
    }),
    batchUpdate: jest.fn().mockResolvedValue({
      data: { replies: [] }
    })
  }
};

jest.mock('../../../services/google-auth-service.js', () => ({
  getSlides: jest.fn().mockResolvedValue(mockSlides)
}), { virtual: true });

// Mock bridge proxy
jest.mock('../../../services/bridgeProxy.js', () => ({
  forwardToBridgeIfSupported: jest.fn().mockResolvedValue(null)
}), { virtual: true });

describe('Slides', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = await import('../slides.js');
  });

  describe('slidesCreate', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.slidesCreate({
        title: 'Test Presentation'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.presentationId).toBeDefined();
      expect(result.data.url).toBeDefined();
    });

    it('should handle missing required params (title optional)', async () => {
      // title is optional with default
      const result = await handlers.slidesCreate({});
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle params with defaults', async () => {
      const result = await handlers.slidesCreate({
        title: 'My Presentation'
      });
      expect(result.ok).toBe(true);
      expect(result.data.title).toBe('My Presentation');
    });
  });

  describe('slidesRead', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.slidesRead({
        presentationId: 'test-presentation-id'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.presentation).toBeDefined();
      expect(result.data.slides).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.slidesRead({})).rejects.toThrow(BadRequestError);
      await expect(handlers.slidesRead({})).rejects.toThrow('presentationId is required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.slidesRead({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('slidesUpdate', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.slidesUpdate({
        presentationId: 'test-presentation-id',
        requests: [{
          insertText: {
            objectId: 'slide-1',
            insertionIndex: 1,
            text: 'New text'
          }
        }]
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.presentationId).toBe('test-presentation-id');
    });

    it('should handle missing required params', async () => {
      await expect(handlers.slidesUpdate({})).rejects.toThrow(BadRequestError);
      await expect(handlers.slidesUpdate({})).rejects.toThrow('presentationId is required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.slidesUpdate({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

});
