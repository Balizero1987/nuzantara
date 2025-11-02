import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock Google Docs service
const mockDocs = {
  documents: {
    create: jest.fn().mockResolvedValue({
      data: { documentId: 'test-doc-id' }
    }),
    get: jest.fn().mockResolvedValue({
      data: {
        documentId: 'test-doc-id',
        title: 'Test Document',
        revisionId: 'rev-1',
        body: {
          content: [{
            paragraph: {
              elements: [{
                textRun: { content: 'Test content' }
              }]
            }
          }]
        }
      }
    }),
    batchUpdate: jest.fn().mockResolvedValue({
      data: { replies: [] }
    })
  }
};

jest.mock('../../../services/google-auth-service.js', () => ({
  getDocs: jest.fn().mockResolvedValue(mockDocs)
}), { virtual: true });

// Mock bridge proxy
jest.mock('../../../services/bridgeProxy.js', () => ({
  forwardToBridgeIfSupported: jest.fn().mockResolvedValue(null)
}), { virtual: true });

describe('Docs', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = await import('../docs.js');
  });

  describe('docsCreate', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.docsCreate({
        title: 'Test Document',
        content: 'Test content'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.documentId).toBeDefined();
      expect(result.data.url).toBeDefined();
    });

    it('should handle missing required params (title optional)', async () => {
      // title and content are optional, so this should work
      const result = await handlers.docsCreate({});
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle params with defaults', async () => {
      const result = await handlers.docsCreate({
        title: 'My Document'
      });
      expect(result.ok).toBe(true);
      expect(result.data.title).toBe('My Document');
    });
  });

  describe('docsRead', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.docsRead({
        documentId: 'test-doc-id'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.document).toBeDefined();
      expect(result.data.content).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.docsRead({})).rejects.toThrow(BadRequestError);
      await expect(handlers.docsRead({})).rejects.toThrow('documentId is required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.docsRead({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('docsUpdate', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.docsUpdate({
        documentId: 'test-doc-id',
        requests: [{
          insertText: {
            location: { index: 1 },
            text: 'Updated content'
          }
        }]
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.documentId).toBe('test-doc-id');
    });

    it('should handle missing required params', async () => {
      await expect(handlers.docsUpdate({})).rejects.toThrow(BadRequestError);
      await expect(handlers.docsUpdate({})).rejects.toThrow('documentId is required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.docsUpdate({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

});
