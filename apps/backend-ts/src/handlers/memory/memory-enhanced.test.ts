// Enhanced Memory System v2.0 Tests
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  memorySaveEnhanced,
  memorySearchEnhanced,
  memoryGetEnhanced,
  memoryUpdateEnhanced,
  memoryDeleteEnhanced,
  memoryStatsEnhanced,
} from './memory-enhanced.js';

// Mock dependencies
jest.mock('../../services/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../services/memory-vector.js', () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  searchMemoriesSemantica: jest.fn().mockResolvedValue([]),
}));

jest.mock('./collective-memory.js', () => ({
  collectiveMemory: {
    addCollectiveMemory: jest.fn().mockResolvedValue('memory-id-123'),
  },
}));

describe('Enhanced Memory System v2.0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('memorySaveEnhanced', () => {
    it('should save memory successfully', async () => {
      const params = {
        userId: 'test-user-123',
        content: 'User prefers Italian language for communication',
        type: 'preference',
        category: 'personal',
        importance: 8,
        tags: ['language', 'preference', 'italian'],
      };

      const result = await memorySaveEnhanced(params);

      expect(result.success).toBe(true);
      expect(result.memory.content).toBe(params.content);
      expect(result.memory.type).toBe(params.type);
      expect(result.memory.importance).toBe(params.importance);
      expect(result.memory.tags).toEqual(params.tags);
      expect(result.memory.entities).toContain('User'); // Entity extraction
    });

    it('should throw error without userId', async () => {
      const params = {
        content: 'Test memory',
      };

      await expect(memorySaveEnhanced(params)).rejects.toThrow();
    });

    it('should throw error without content', async () => {
      const params = {
        userId: 'test-user-123',
      };

      await expect(memorySaveEnhanced(params)).rejects.toThrow();
    });

    it('should use default values for optional fields', async () => {
      const params = {
        userId: 'test-user-123',
        content: 'Simple test memory',
      };

      const result = await memorySaveEnhanced(params);

      expect(result.memory.type).toBe('fact');
      expect(result.memory.category).toBe('general');
      expect(result.memory.importance).toBe(5);
      expect(result.memory.source).toBe('user_input');
    });
  });

  describe('memorySearchEnhanced', () => {
    beforeEach(() => {
      // Pre-populate with test memories
      memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'User wants to start a restaurant business in Bali',
        type: 'business_context',
        importance: 9,
        tags: ['restaurant', 'bali', 'business'],
      });

      memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'User is interested in PT PMA company setup',
        type: 'business_context',
        importance: 8,
        tags: ['pt-pma', 'company', 'setup'],
      });
    });

    it('should search memories by query', async () => {
      const params = {
        userId: 'test-user-123',
        query: 'restaurant business',
        limit: 10,
      };

      const result = await memorySearchEnhanced(params);

      expect(result.success).toBe(true);
      expect(result.query).toBe(params.query);
      expect(result.results).toBeDefined();
      expect(result.searchMethod).toBeDefined();
      expect(result.queryTime).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const params = {
        userId: 'test-user-123',
        query: 'business',
        type: 'business_context',
        limit: 5,
      };

      const result = await memorySearchEnhanced(params);

      expect(result.success).toBe(true);
      expect(result.results.every((r) => r.type === 'business_context')).toBe(true);
    });

    it('should filter by category', async () => {
      const params = {
        userId: 'test-user-123',
        query: 'setup',
        category: 'business',
        limit: 5,
      };

      const result = await memorySearchEnhanced(params);

      expect(result.success).toBe(true);
      expect(result.results.every((r) => r.category === 'business')).toBe(true);
    });

    it('should use semantic search when available', async () => {
      const params = {
        userId: 'test-user-123',
        query: 'food service establishment',
        includeVector: true,
        limit: 5,
      };

      const result = await memorySearchEnhanced(params);

      expect(result.success).toBe(true);
      expect(result.searchMethod).toMatch(/semantic|hybrid/);
    });
  });

  describe('memoryGetEnhanced', () => {
    it('should retrieve memory by ID', async () => {
      // First save a memory
      const saveResult = await memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'Test memory for retrieval',
        importance: 7,
      });

      // Then retrieve it
      const getResult = await memoryGetEnhanced({
        userId: 'test-user-123',
        memoryId: saveResult.memory.id,
      });

      expect(getResult.success).toBe(true);
      expect(getResult.memory.content).toBe('Test memory for retrieval');
      expect(getResult.memory.accessCount).toBeGreaterThan(0); // Should increment
    });

    it('should return error for non-existent memory', async () => {
      const result = await memoryGetEnhanced({
        userId: 'test-user-123',
        memoryId: 'non-existent-id',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Memory not found');
    });

    it('should deny access to other user memories', async () => {
      const saveResult = await memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'Private memory',
      });

      const result = await memoryGetEnhanced({
        userId: 'other-user-456',
        memoryId: saveResult.memory.id,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Memory not found');
    });
  });

  describe('memoryUpdateEnhanced', () => {
    it('should update memory content', async () => {
      const saveResult = await memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'Original content',
        importance: 5,
      });

      const updateResult = await memoryUpdateEnhanced({
        userId: 'test-user-123',
        memoryId: saveResult.memory.id,
        updates: {
          content: 'Updated content with more details',
          importance: 8,
        },
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.memory.content).toBe('Updated content with more details');
      expect(updateResult.memory.importance).toBe(8);
      expect(updateResult.memory.updated).toBe(true);
    });

    it('should update only specified fields', async () => {
      const saveResult = await memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'Original content',
        importance: 5,
        tags: ['original'],
      });

      const updateResult = await memoryUpdateEnhanced({
        userId: 'test-user-123',
        memoryId: saveResult.memory.id,
        updates: {
          importance: 9,
        },
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.memory.content).toBe('Original content'); // Unchanged
      expect(updateResult.memory.importance).toBe(9); // Changed
    });

    it('should return error for non-existent memory', async () => {
      const result = await memoryUpdateEnhanced({
        userId: 'test-user-123',
        memoryId: 'non-existent-id',
        updates: { content: 'Updated' },
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Memory not found or access denied');
    });
  });

  describe('memoryDeleteEnhanced', () => {
    it('should delete memory successfully', async () => {
      const saveResult = await memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'Memory to be deleted',
      });

      const deleteResult = await memoryDeleteEnhanced({
        userId: 'test-user-123',
        memoryId: saveResult.memory.id,
      });

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe('Memory deleted successfully');

      // Verify memory is gone
      const getResult = await memoryGetEnhanced({
        userId: 'test-user-123',
        memoryId: saveResult.memory.id,
      });

      expect(getResult.success).toBe(false);
    });

    it('should return error for non-existent memory', async () => {
      const result = await memoryDeleteEnhanced({
        userId: 'test-user-123',
        memoryId: 'non-existent-id',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Memory not found or access denied');
    });
  });

  describe('memoryStatsEnhanced', () => {
    beforeEach(() => {
      // Add test memories for statistics
      memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'Business context memory',
        type: 'business_context',
        category: 'business',
        importance: 9,
      });

      memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'Personal preference',
        type: 'preference',
        category: 'personal',
        importance: 6,
      });

      memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'General fact',
        type: 'fact',
        category: 'general',
        importance: 4,
      });
    });

    it('should return comprehensive memory statistics', async () => {
      const result = await memoryStatsEnhanced({
        userId: 'test-user-123',
      });

      expect(result.success).toBe(true);
      expect(result.stats.totalMemories).toBeGreaterThan(0);
      expect(result.stats.typeBreakdown).toBeDefined();
      expect(result.stats.categoryBreakdown).toBeDefined();
      expect(result.stats.averageImportance).toBeGreaterThan(0);
      expect(result.stats.mostAccessed).toBeDefined();
      expect(result.stats.recentMemories).toBeDefined();
    });

    it('should calculate correct type breakdown', async () => {
      const result = await memoryStatsEnhanced({
        userId: 'test-user-123',
      });

      expect(result.stats.typeBreakdown['business_context']).toBe(1);
      expect(result.stats.typeBreakdown['preference']).toBe(1);
      expect(result.stats.typeBreakdown['fact']).toBe(1);
    });

    it('should calculate correct category breakdown', async () => {
      const result = await memoryStatsEnhanced({
        userId: 'test-user-123',
      });

      expect(result.stats.categoryBreakdown['business']).toBe(1);
      expect(result.stats.categoryBreakdown['personal']).toBe(1);
      expect(result.stats.categoryBreakdown['general']).toBe(1);
    });

    it('should calculate average importance correctly', async () => {
      const result = await memoryStatsEnhanced({
        userId: 'test-user-123',
      });

      // Average should be (9 + 6 + 4) / 3 = 6.33
      expect(result.stats.averageImportance).toBeCloseTo(6.33, 1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty user memories gracefully', async () => {
      const searchResult = await memorySearchEnhanced({
        userId: 'empty-user-789',
        query: 'test',
      });

      expect(searchResult.success).toBe(true);
      expect(searchResult.results).toEqual([]);
      expect(searchResult.total).toBe(0);
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(1000);
      const result = await memorySaveEnhanced({
        userId: 'test-user-123',
        content: longContent,
      });

      expect(result.success).toBe(true);
      expect(result.memory.content).toBe(longContent);
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'Memory with émojis 🚀 and special chars & symbols!';
      const result = await memorySaveEnhanced({
        userId: 'test-user-123',
        content: specialContent,
      });

      expect(result.success).toBe(true);
      expect(result.memory.content).toBe(specialContent);
    });

    it('should handle maximum tag count', async () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
      const result = await memorySaveEnhanced({
        userId: 'test-user-123',
        content: 'Memory with many tags',
        tags: manyTags,
      });

      expect(result.success).toBe(true);
      expect(result.memory.tags.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        memorySaveEnhanced({
          userId: 'test-user-123',
          content: `Concurrent memory ${i}`,
          importance: Math.floor(Math.random() * 10) + 1,
        })
      );

      const results = await Promise.all(promises);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should search within reasonable time limits', async () => {
      const startTime = Date.now();

      const result = await memorySearchEnhanced({
        userId: 'test-user-123',
        query: 'test search performance',
        includeVector: true,
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
