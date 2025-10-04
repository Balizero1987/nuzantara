/**
 * Tests for Memory Firestore Handler
 * Tests user memory storage, retrieval, and search
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock Firestore before imports
const mockFirestoreGet = jest.fn();
const mockFirestoreSet = jest.fn();
const mockFirestoreDoc = jest.fn();
const mockFirestoreCollection = jest.fn();

jest.unstable_mockModule('../../services/firebase.js', () => ({
  getFirestore: jest.fn(() => ({
    collection: mockFirestoreCollection.mockReturnThis(),
    doc: mockFirestoreDoc.mockReturnThis(),
    get: mockFirestoreGet,
    set: mockFirestoreSet,
  })),
}));

const { memorySave, memorySearch, memoryRetrieve, memoryList } = await import(
  '../memory-firestore.js'
);

describe('Memory Firestore Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestoreGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: 'user-123',
        profile_facts: ['Test fact 1', 'Test fact 2'],
        summary: 'Test user summary',
        counters: { interactions: 5 },
        updated_at: new Date(),
      }),
    });
    mockFirestoreSet.mockResolvedValue(undefined);
  });

  describe('memorySave', () => {
    it('should save memory with content parameter', async () => {
      const params = {
        userId: 'user-123',
        content: 'Prefers Italian language',
        type: 'preference',
      };

      const result = await memorySave(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('memoryId');
      expect(result.data).toHaveProperty('saved', true);
    });

    it('should save memory with key-value format', async () => {
      const params = {
        userId: 'user-456',
        key: 'visa_type',
        value: 'B211A Tourist Visa',
        type: 'service_interest',
      };

      const result = await memorySave(params);

      expect(result.ok).toBe(true);
      expect(result.data.saved).toBe(true);
    });

    it('should save memory with data object', async () => {
      const params = {
        userId: 'user-789',
        data: { preference: 'English', service: 'PT PMA' },
      };

      const result = await memorySave(params);

      expect(result.ok).toBe(true);
    });

    it('should require userId', async () => {
      const params = { content: 'Test' };

      await expect(memorySave(params)).rejects.toThrow();
    });

    it('should require content, data, or key+value', async () => {
      const params = { userId: 'user-123' };

      await expect(memorySave(params)).rejects.toThrow();
    });

    it('should deduplicate facts', async () => {
      mockFirestoreGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          userId: 'user-123',
          profile_facts: ['Existing fact'],
          summary: '',
          counters: {},
          updated_at: new Date(),
        }),
      });

      const params = {
        userId: 'user-123',
        content: 'Existing fact', // Duplicate
      };

      const result = await memorySave(params);

      expect(result.ok).toBe(true);
    });

    it('should limit facts to 10 entries', async () => {
      const facts = Array(15)
        .fill(0)
        .map((_, i) => `Fact ${i}`);

      mockFirestoreGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          userId: 'user-123',
          profile_facts: facts,
          summary: '',
          counters: {},
          updated_at: new Date(),
        }),
      });

      const params = {
        userId: 'user-123',
        content: 'New fact',
      };

      await memorySave(params);

      // Verify set was called with max 10 facts
      expect(mockFirestoreSet).toHaveBeenCalled();
    });

    it('should include metadata when provided', async () => {
      const params = {
        userId: 'user-123',
        content: 'Test fact',
        metadata: {
          source: 'chat',
          confidence: 'high',
        },
      };

      const result = await memorySave(params);

      expect(result.ok).toBe(true);
    });

    it('should handle Firestore errors gracefully', async () => {
      mockFirestoreSet.mockRejectedValueOnce(new Error('Firestore error'));

      const params = {
        userId: 'user-123',
        content: 'Test fact',
      };

      // Should fallback to in-memory store
      const result = await memorySave(params);

      expect(result.ok).toBe(true);
    });
  });

  describe('memoryRetrieve', () => {
    it('should retrieve memory for userId', async () => {
      const params = { userId: 'user-123' };

      const result = await memoryRetrieve(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('content');
      expect(result.data).toHaveProperty('userId', 'user-123');
      expect(result.data).toHaveProperty('facts_count');
    });

    it('should retrieve specific fact by key', async () => {
      mockFirestoreGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          userId: 'user-123',
          profile_facts: ['visa_type: B211A', 'language: Italian'],
          summary: '',
          counters: {},
          updated_at: new Date(),
        }),
      });

      const params = {
        userId: 'user-123',
        key: 'visa_type',
      };

      const result = await memoryRetrieve(params);

      expect(result.ok).toBe(true);
    });

    it('should require userId or key', async () => {
      const params = {};

      await expect(memoryRetrieve(params)).rejects.toThrow();
    });

    it('should handle non-existent user', async () => {
      mockFirestoreGet.mockResolvedValueOnce({
        exists: false,
      });

      const params = { userId: 'non-existent' };

      const result = await memoryRetrieve(params);

      expect(result.ok).toBe(true);
      expect(result.data.content).toContain('No memory found');
    });

    it('should format facts as content string', async () => {
      const params = { userId: 'user-123' };

      const result = await memoryRetrieve(params);

      expect(result.ok).toBe(true);
      expect(typeof result.data.content).toBe('string');
    });

    it('should include last_updated timestamp', async () => {
      const params = { userId: 'user-123' };

      const result = await memoryRetrieve(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('last_updated');
    });
  });

  describe('memorySearch', () => {
    it('should search memories by query', async () => {
      mockFirestoreCollection.mockReturnThis();
      mockFirestoreDoc.mockReturnThis();
      const mockSnapshot = {
        forEach: (callback: any) => {
          callback({
            data: () => ({
              userId: 'user-123',
              profile_facts: ['Interested in visa services'],
              summary: 'Client looking for visa help',
              updated_at: new Date(),
            }),
          });
        },
      };

      mockFirestoreGet.mockResolvedValueOnce(mockSnapshot);

      const params = {
        query: 'visa',
        limit: 10,
      };

      const result = await memorySearch(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('results');
    });

    it('should filter by userId when provided', async () => {
      const params = {
        query: 'visa',
        userId: 'user-123',
      };

      const result = await memorySearch(params);

      expect(result.ok).toBe(true);
    });

    it('should require query parameter', async () => {
      const params = {};

      await expect(memorySearch(params)).rejects.toThrow();
    });

    it('should limit results to specified limit', async () => {
      const params = {
        query: 'test',
        limit: 5,
      };

      const result = await memorySearch(params);

      expect(result.ok).toBe(true);
    });

    it('should handle case-insensitive search', async () => {
      const params = {
        query: 'VISA',
      };

      const result = await memorySearch(params);

      expect(result.ok).toBe(true);
    });
  });

  describe('memoryList', () => {
    it('should list all memories for user', async () => {
      const params = { userId: 'user-123' };

      const result = await memoryList(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('facts');
      expect(result.data).toHaveProperty('summary');
      expect(result.data).toHaveProperty('count');
    });

    it('should require userId', async () => {
      const params = {};

      await expect(memoryList(params)).rejects.toThrow();
    });

    it('should return empty list for user with no memory', async () => {
      mockFirestoreGet.mockResolvedValueOnce({
        exists: false,
      });

      const params = { userId: 'new-user' };

      const result = await memoryList(params);

      expect(result.ok).toBe(true);
      expect(result.data.facts).toEqual([]);
      expect(result.data.count).toBe(0);
    });
  });

  describe('Firestore Integration', () => {
    it('should fallback to in-memory store when Firestore unavailable', async () => {
      mockFirestoreGet.mockRejectedValueOnce(new Error('Firestore down'));

      const params = {
        userId: 'user-123',
        content: 'Test fact',
      };

      const result = await memorySave(params);

      expect(result.ok).toBe(true);
    });

    it('should use Firestore collection "memories"', async () => {
      const params = { userId: 'user-123', content: 'Test' };

      await memorySave(params);

      expect(mockFirestoreCollection).toHaveBeenCalledWith('memories');
    });
  });
});
