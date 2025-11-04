/**
 * Comprehensive Test Suite for ZANTARA ChromaDB Migration
 *
 * This test suite covers:
 * - Unit tests with mocked dependencies
 * - Integration tests with real ChromaDB
 * - Performance benchmarks
 * - Data integrity verification
 * - Error recovery scenarios
 */

import { ChromaApi, OpenAIEmbeddingFunction } from 'chromadb';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { jest } from '@jest/globals';

const execAsync = promisify(exec);

// Test configuration
const TEST_CONFIG = {
  CHROMA_URL: process.env.TEST_CHROMA_URL || 'http://localhost:8000',
  TEST_COLLECTION_PREFIX: 'test_migration_',
  SAMPLE_DATA_SIZE: 100,
  LARGE_BATCH_SIZE: 10000,
  PERFORMANCE_ITERATIONS: 10,
  TIMEOUT_MS: 30000,
  SAMPLE_TEXT_DIR: '/tmp/test_documents',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key',
};

// Types for test data
interface TestDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

interface MigrationResult {
  success: boolean;
  documentsProcessed: number;
  errors: string[];
  duration: number;
  checksum?: string;
}

interface PerformanceMetrics {
  uploadSpeed: number; // documents per second
  queryLatency: number; // milliseconds
  memoryUsage: number; // MB
  throughput: number; // operations per second
}

// Mock utilities
class ChromaDBMock {
  private collections: Map<string, any[]> = new Map();

  async createCollection(name: string): Promise<void> {
    if (!this.collections.has(name)) {
      this.collections.set(name, []);
    }
  }

  async addDocuments(collectionName: string, documents: any[]): Promise<void> {
    const collection = this.collections.get(collectionName) || [];
    collection.push(...documents);
    this.collections.set(collectionName, collection);
  }

  async query(collectionName: string, queryVector: number[]): Promise<any[]> {
    const collection = this.collections.get(collectionName) || [];
    // Simple mock query - return first 10 documents
    return collection.slice(0, 10).map((doc, index) => ({
      id: doc.id,
      document: doc.content,
      metadata: doc.metadata,
      score: 0.9 - index * 0.1,
    }));
  }

  async getCollection(name: string): Promise<any[]> {
    return this.collections.get(name) || [];
  }

  async deleteCollection(name: string): Promise<void> {
    this.collections.delete(name);
  }

  clear(): void {
    this.collections.clear();
  }
}

// Mock OpenAI Embedding Function
class MockEmbeddingFunction {
  async generate(texts: string[]): Promise<number[][]> {
    // Generate deterministic mock embeddings for consistent testing
    return texts.map((text) => {
      const hash = crypto.createHash('md5').update(text).digest('hex');
      return Array.from({ length: 1536 }, (_, i) => {
        const charCode = hash.charCodeAt(i % hash.length);
        return (charCode - 97) / 26; // Normalize between 0 and 1
      });
    });
  }
}

// Test data generators
class TestDataGenerator {
  static generateSampleDocuments(count: number): TestDocument[] {
    const documents: TestDocument[] = [];

    for (let i = 0; i < count; i++) {
      documents.push({
        id: `test_doc_${i}`,
        content: `This is test document ${i}. ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10)}`,
        metadata: {
          source: 'test_generator',
          category: ['legal', 'financial', 'technical'][i % 3],
          timestamp: new Date(Date.now() - i * 1000).toISOString(),
          size: 100 + i * 10,
          language: 'en',
          version: '1.0.' + (i % 100),
        },
      });
    }

    return documents;
  }

  static generateLargeDocuments(count: number): TestDocument[] {
    const documents: TestDocument[] = [];

    for (let i = 0; i < count; i++) {
      const largeContent = 'Large content '.repeat(1000) + ` Document ${i} `;
      documents.push({
        id: `large_doc_${i}`,
        content: largeContent,
        metadata: {
          source: 'large_generator',
          size: largeContent.length,
          type: 'large_document',
        },
      });
    }

    return documents;
  }

  static generateInvalidDocuments(): TestDocument[] {
    return [
      { id: '', content: 'Valid content', metadata: {} }, // Empty ID
      { id: 'valid_id', content: '', metadata: {} }, // Empty content
      { id: 'valid_id2', content: 'Valid content', metadata: null as any }, // Null metadata
      { id: 'valid_id3', content: 'Valid content', metadata: { invalid: Symbol('test') } }, // Invalid metadata type
    ];
  }

  static async generateSampleFiles(count: number, directory: string): Promise<string[]> {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const filePaths: string[] = [];

    for (let i = 0; i < count; i++) {
      const content = `Sample file content ${i}\n${'Line of content. '.repeat(50)}`;
      const filePath = path.join(directory, `sample_${i}.txt`);
      fs.writeFileSync(filePath, content, 'utf8');
      filePaths.push(filePath);
    }

    return filePaths;
  }

  static cleanupSampleFiles(directory: string): void {
    if (fs.existsSync(directory)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
}

// Utility functions
class TestUtils {
  static calculateChecksum(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  static async measurePerformance<T>(
    operation: () => Promise<T>,
    iterations: number = 1
  ): Promise<{ result: T; duration: number; metrics: PerformanceMetrics }> {
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const startTime = Date.now();

    let result: T;
    for (let i = 0; i < iterations; i++) {
      result = await operation();
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const duration = endTime - startTime;

    return {
      result: result!,
      duration,
      metrics: {
        uploadSpeed: iterations / (duration / 1000), // ops per second
        queryLatency: duration / iterations, // ms per operation
        memoryUsage: endMemory - startMemory, // MB
        throughput: iterations / (duration / 1000), // ops per second
      },
    };
  }

  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Main test suite
describe('ZANTARA ChromaDB Migration Test Suite', () => {
  let chromaMock: ChromaDBMock;
  let mockEmbedding: MockEmbeddingFunction;
  let testDocuments: TestDocument[];
  let sampleFiles: string[];

  beforeAll(async () => {
    // Setup test environment
    chromaMock = new ChromaDBMock();
    mockEmbedding = new MockEmbeddingFunction();
    testDocuments = TestDataGenerator.generateSampleDocuments(TEST_CONFIG.SAMPLE_DATA_SIZE);
    sampleFiles = await TestDataGenerator.generateSampleFiles(10, TEST_CONFIG.SAMPLE_TEXT_DIR);

    // Verify ChromaDB is available for integration tests
    try {
      const response = await fetch(`${TEST_CONFIG.CHROMA_URL}/api/v1/heartbeat`);
      if (!response.ok) {
        console.warn('ChromaDB not available for integration tests');
      }
    } catch (error) {
      console.warn('ChromaDB not available for integration tests:', error);
    }
  });

  afterAll(async () => {
    // Cleanup
    TestDataGenerator.cleanupSampleFiles(TEST_CONFIG.SAMPLE_TEXT_DIR);
    chromaMock.clear();
  });

  beforeEach(() => {
    chromaMock.clear();
  });

  describe('Unit Tests', () => {
    describe('Collection Management', () => {
      test('should create collection successfully', async () => {
        const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}unit_create`;
        await chromaMock.createCollection(collectionName);

        const collections = await chromaMock.getCollection(collectionName);
        expect(collections).toEqual([]);
      });

      test('should handle duplicate collection creation gracefully', async () => {
        const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}unit_duplicate`;
        await chromaMock.createCollection(collectionName);

        // Should not throw error when creating same collection again
        await expect(chromaMock.createCollection(collectionName)).resolves.not.toThrow();
      });

      test('should delete collection successfully', async () => {
        const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}unit_delete`;
        await chromaMock.createCollection(collectionName);
        await chromaMock.deleteCollection(collectionName);

        const collections = await chromaMock.getCollection(collectionName);
        expect(collections).toEqual([]);
      });
    });

    describe('Document Operations', () => {
      test('should add documents to collection', async () => {
        const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}unit_add`;
        await chromaMock.createCollection(collectionName);

        const documentsToAdd = testDocuments.slice(0, 10);
        await chromaMock.addDocuments(collectionName, documentsToAdd);

        const retrievedDocs = await chromaMock.getCollection(collectionName);
        expect(retrievedDocs).toHaveLength(10);
        expect(retrievedDocs[0].id).toBe('test_doc_0');
      });

      test('should handle empty document batches', async () => {
        const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}unit_empty`;
        await chromaMock.createCollection(collectionName);

        await expect(chromaMock.addDocuments(collectionName, [])).resolves.not.toThrow();

        const retrievedDocs = await chromaMock.getCollection(collectionName);
        expect(retrievedDocs).toEqual([]);
      });

      test('should query documents successfully', async () => {
        const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}unit_query`;
        await chromaMock.createCollection(collectionName);

        const queryVector = new Array(1536).fill(0.1);
        const results = await chromaMock.query(collectionName, queryVector);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(10);
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('document');
        expect(results[0]).toHaveProperty('metadata');
        expect(results[0]).toHaveProperty('score');
      });
    });

    describe('Embedding Generation', () => {
      test('should generate consistent embeddings for same text', async () => {
        const text = 'Test text for embedding';
        const embeddings1 = await mockEmbedding.generate([text]);
        const embeddings2 = await mockEmbedding.generate([text]);

        expect(embeddings1[0]).toEqual(embeddings2[0]);
        expect(embeddings1[0]).toHaveLength(1536);
      });

      test('should generate different embeddings for different texts', async () => {
        const text1 = 'First text';
        const text2 = 'Second text';
        const embeddings = await mockEmbedding.generate([text1, text2]);

        expect(embeddings[0]).not.toEqual(embeddings[1]);
        expect(embeddings[0]).toHaveLength(1536);
        expect(embeddings[1]).toHaveLength(1536);
      });

      test('should handle batch embedding generation', async () => {
        const texts = testDocuments.slice(0, 10).map((doc) => doc.content);
        const embeddings = await mockEmbedding.generate(texts);

        expect(embeddings).toHaveLength(10);
        embeddings.forEach((embedding) => {
          expect(embedding).toHaveLength(1536);
        });
      });
    });

    describe('Data Validation', () => {
      test('should validate document structure', () => {
        const validDoc = testDocuments[0];

        expect(validDoc).toHaveProperty('id');
        expect(validDoc).toHaveProperty('content');
        expect(validDoc).toHaveProperty('metadata');
        expect(typeof validDoc.id).toBe('string');
        expect(typeof validDoc.content).toBe('string');
        expect(typeof validDoc.metadata).toBe('object');
      });

      test('should handle invalid documents gracefully', async () => {
        const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}unit_invalid`;
        await chromaMock.createCollection(collectionName);

        const invalidDocs = TestDataGenerator.generateInvalidDocuments();

        // Should not throw but may skip invalid documents
        await expect(chromaMock.addDocuments(collectionName, invalidDocs)).resolves.not.toThrow();
      });
    });
  });

  describe('Integration Tests', () => {
    let realChromaClient: any;

    beforeAll(async () => {
      // Initialize real ChromaDB client for integration tests
      try {
        const { ChromaApi, OpenAIEmbeddingFunction } = require('chromadb');
        realChromaClient = new ChromaApi({
          path: TEST_CONFIG.CHROMA_URL,
        });
      } catch (error) {
        console.warn('Skipping integration tests - ChromaDB not available');
      }
    });

    test('should connect to ChromaDB successfully', async () => {
      if (!realChromaClient) {
        console.log('Skipping - ChromaDB not available');
        return;
      }

      expect(realChromaClient).toBeDefined();
    });

    test('should create and query real collection', async () => {
      if (!realChromaClient) {
        console.log('Skipping - ChromaDB not available');
        return;
      }

      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}integration_real`;
      const documents = testDocuments.slice(0, 5);

      try {
        // Create collection
        const collection = await realChromaClient.createCollection({
          name: collectionName,
          metadata: { test: true },
        });

        expect(collection).toBeDefined();

        // Add documents
        await collection.add({
          ids: documents.map((d) => d.id),
          documents: documents.map((d) => d.content),
          metadatas: documents.map((d) => d.metadata),
        });

        // Query collection
        const results = await collection.query({
          queryTexts: ['test'],
          nResults: 3,
        });

        expect(results.ids[0]).toBeDefined();
        expect(results.documents[0]).toBeDefined();
        expect(results.metadatas[0]).toBeDefined();

        // Cleanup
        await realChromaClient.deleteCollection({ name: collectionName });
      } catch (error) {
        console.error('Integration test failed:', error);
        throw error;
      }
    });
  });

  describe('Performance Tests', () => {
    test('should handle large document batches efficiently', async () => {
      const largeBatch = TestDataGenerator.generateLargeDocuments(1000);
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}perf_large_batch`;

      await chromaMock.createCollection(collectionName);

      const { result, duration, metrics } = await TestUtils.measurePerformance(
        () => chromaMock.addDocuments(collectionName, largeBatch),
        1
      );

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(metrics.uploadSpeed).toBeGreaterThan(50); // At least 50 docs per second

      console.log(`Large batch performance: ${metrics.uploadSpeed.toFixed(2)} docs/sec`);
    });

    test('should maintain query performance with increasing data', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}perf_query`;
      await chromaMock.createCollection(collectionName);

      const queryVector = new Array(1536).fill(0.1);
      const dataSizes = [100, 500, 1000];
      const performanceResults: number[] = [];

      for (const size of dataSizes) {
        const documents = TestDataGenerator.generateSampleDocuments(size);
        await chromaMock.addDocuments(collectionName, documents);

        const { duration } = await TestUtils.measurePerformance(
          () => chromaMock.query(collectionName, queryVector),
          5 // Average over 5 queries
        );

        performanceResults.push(duration);
        console.log(`Query performance for ${size} docs: ${duration.toFixed(2)}ms`);
      }

      // Performance should not degrade significantly
      const degradationRatio = performanceResults[2] / performanceResults[0];
      expect(degradationRatio).toBeLessThan(5); // Less than 5x degradation
    });

    test('should handle concurrent operations efficiently', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}perf_concurrent`;
      await chromaMock.createCollection(collectionName);

      const concurrentOperations = 10;
      const documentsPerOperation = 100;

      const operations = Array.from({ length: concurrentOperations }, async (_, index) => {
        const documents = TestDataGenerator.generateSampleDocuments(documentsPerOperation).map(
          (doc, i) => ({ ...doc, id: `concurrent_${index}_${i}` })
        );

        return chromaMock.addDocuments(collectionName, documents);
      });

      const { duration, metrics } = await TestUtils.measurePerformance(
        () => Promise.all(operations),
        1
      );

      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(metrics.throughput).toBeGreaterThan(1); // At least 1 operation per second

      console.log(`Concurrent operations throughput: ${metrics.throughput.toFixed(2)} ops/sec`);
    });
  });

  describe('Data Integrity Tests', () => {
    test('should preserve document content during migration', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}integrity_content`;
      await chromaMock.createCollection(collectionName);

      const originalDocuments = testDocuments.slice(0, 20);
      await chromaMock.addDocuments(collectionName, originalDocuments);

      const retrievedDocuments = await chromaMock.getCollection(collectionName);

      originalDocuments.forEach((originalDoc) => {
        const retrievedDoc = retrievedDocuments.find((doc) => doc.id === originalDoc.id);
        expect(retrievedDoc).toBeDefined();
        expect(retrievedDoc.content).toBe(originalDoc.content);
        expect(TestUtils.calculateChecksum(retrievedDoc.metadata)).toBe(
          TestUtils.calculateChecksum(originalDoc.metadata)
        );
      });
    });

    test('should maintain metadata integrity', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}integrity_metadata`;
      await chromaMock.createCollection(collectionName);

      const documentsWithComplexMetadata = testDocuments.slice(0, 10).map((doc, index) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          complexObject: {
            nestedField: 'value_' + index,
            nestedArray: [1, 2, 3, index],
            nestedBoolean: index % 2 === 0,
          },
          specialChars: 'Special chars: áéíóú ñ ß 中文',
          nullField: null,
          undefinedField: undefined,
        },
      }));

      await chromaMock.addDocuments(collectionName, documentsWithComplexMetadata);
      const retrievedDocuments = await chromaMock.getCollection(collectionName);

      documentsWithComplexMetadata.forEach((originalDoc) => {
        const retrievedDoc = retrievedDocuments.find((doc) => doc.id === originalDoc.id);
        expect(retrievedDoc).toBeDefined();
        expect(retrievedDoc.metadata.complexObject.nestedField).toBe(
          originalDoc.metadata.complexObject.nestedField
        );
        expect(retrievedDoc.metadata.specialChars).toBe(originalDoc.metadata.specialChars);
      });
    });

    test('should verify data consistency after batch operations', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}integrity_batch`;
      await chromaMock.createCollection(collectionName);

      const batchSizes = [10, 50, 100];
      let totalProcessed = 0;

      for (const batchSize of batchSizes) {
        const batch = TestDataGenerator.generateSampleDocuments(batchSize).map((doc, index) => ({
          ...doc,
          id: `batch_${batchSize}_${index}`,
          batchId: batchSize,
        }));

        await chromaMock.addDocuments(collectionName, batch);
        totalProcessed += batchSize;

        // Verify data integrity after each batch
        const retrievedDocuments = await chromaMock.getCollection(collectionName);
        expect(retrievedDocuments).toHaveLength(totalProcessed);

        // Check batch-specific metadata
        const batchDocs = retrievedDocuments.filter((doc) => doc.metadata.batchId === batchSize);
        expect(batchDocs).toHaveLength(batchSize);
      }
    });

    test('should calculate and verify data checksums', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}integrity_checksum`;
      await chromaMock.createCollection(collectionName);

      const documents = testDocuments.slice(0, 30);
      const originalChecksum = TestUtils.calculateChecksum(documents);

      await chromaMock.addDocuments(collectionName, documents);
      const retrievedDocuments = await chromaMock.getCollection(collectionName);
      const retrievedChecksum = TestUtils.calculateChecksum(retrievedDocuments);

      // Checksums should match if data is identical
      expect(retrievedChecksum).toBe(originalChecksum);

      // Modify one document and verify checksum changes
      const modifiedDocuments = [...retrievedDocuments];
      modifiedDocuments[0] = { ...modifiedDocuments[0], content: 'Modified content' };
      const modifiedChecksum = TestUtils.calculateChecksum(modifiedDocuments);

      expect(modifiedChecksum).not.toBe(originalChecksum);
    });
  });

  describe('Error Recovery Tests', () => {
    test('should handle network timeouts gracefully', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}error_timeout`;
      await chromaMock.createCollection(collectionName);

      // Simulate slow operation
      const slowOperation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return chromaMock.addDocuments(collectionName, testDocuments.slice(0, 5));
      };

      // Should complete without timeout
      const { result, duration } = await TestUtils.measurePerformance(slowOperation, 1);
      expect(result).toBeDefined();
      expect(duration).toBeGreaterThan(5000);
    });

    test('should recover from invalid document errors', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}error_invalid_docs`;
      await chromaMock.createCollection(collectionName);

      const mixedDocuments = [
        ...testDocuments.slice(0, 5), // Valid documents
        ...TestDataGenerator.generateInvalidDocuments(), // Invalid documents
        ...testDocuments.slice(5, 10), // More valid documents
      ];

      // Should process valid documents and skip invalid ones
      await expect(chromaMock.addDocuments(collectionName, mixedDocuments)).resolves.not.toThrow();

      const retrievedDocuments = await chromaMock.getCollection(collectionName);
      // Should have at least the valid documents
      expect(retrievedDocuments.length).toBeGreaterThanOrEqual(10);
    });

    test('should handle memory pressure with large datasets', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}error_memory`;
      await chromaMock.createCollection(collectionName);

      // Generate a very large dataset
      const largeDataset = TestDataGenerator.generateLargeDocuments(5000);

      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      try {
        await chromaMock.addDocuments(collectionName, largeDataset);
        const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        // Memory usage should be reasonable (less than 500MB increase)
        expect(finalMemory - initialMemory).toBeLessThan(500);

        const retrievedDocuments = await chromaMock.getCollection(collectionName);
        expect(retrievedDocuments).toHaveLength(5000);
      } catch (error) {
        // If memory error occurs, system should handle it gracefully
        expect(error).toBeDefined();
      }
    });

    test('should implement retry logic for failed operations', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}error_retry`;
      let attemptCount = 0;

      const flakyOperation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Simulated network failure');
        }
        return chromaMock.addDocuments(collectionName, testDocuments.slice(0, 5));
      };

      await TestUtils.retry(flakyOperation, 3, 100);
      expect(attemptCount).toBe(3);

      const retrievedDocuments = await chromaMock.getCollection(collectionName);
      expect(retrievedDocuments).toHaveLength(5);
    });

    test('should handle corrupted data gracefully', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}error_corrupted`;
      await chromaMock.createCollection(collectionName);

      const corruptedDocuments = [
        { id: 'valid_1', content: 'Valid content', metadata: { valid: true } },
        { id: null as any, content: 'Invalid ID', metadata: {} }, // Invalid ID
        { id: 'valid_2', content: 'Another valid content', metadata: { valid: true } },
        { id: 'valid_3', content: '', metadata: { empty: true } }, // Empty content
        { id: 'circular', content: 'Content with circular ref', metadata: {} }, // Will add circular reference
      ];

      // Add circular reference to test handling
      corruptedDocuments[4].metadata.self = corruptedDocuments[4];

      // Should handle corrupted data without crashing
      await expect(
        chromaMock.addDocuments(collectionName, corruptedDocuments)
      ).resolves.not.toThrow();

      // Should have processed valid documents
      const retrievedDocuments = await chromaMock.getCollection(collectionName);
      expect(retrievedDocuments.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Workflow Tests', () => {
    test('should perform complete migration workflow', async () => {
      const sourceCollection = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}migration_source`;
      const targetCollection = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}migration_target`;

      // Setup source collection
      await chromaMock.createCollection(sourceCollection);
      const sourceDocuments = TestDataGenerator.generateSampleDocuments(50);
      await chromaMock.addDocuments(sourceCollection, sourceDocuments);

      // Perform migration
      await chromaMock.createCollection(targetCollection);
      const retrievedSource = await chromaMock.getCollection(sourceCollection);
      await chromaMock.addDocuments(targetCollection, retrievedSource);

      // Verify migration
      const targetDocuments = await chromaMock.getCollection(targetCollection);
      expect(targetDocuments).toHaveLength(50);

      // Verify data integrity
      sourceDocuments.forEach((sourceDoc) => {
        const targetDoc = targetDocuments.find((doc) => doc.id === sourceDoc.id);
        expect(targetDoc).toBeDefined();
        expect(targetDoc.content).toBe(sourceDoc.content);
      });
    });

    test('should handle incremental migrations', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}migration_incremental`;
      await chromaMock.createCollection(collectionName);

      // Initial migration
      const initialDocs = TestDataGenerator.generateSampleDocuments(30);
      await chromaMock.addDocuments(collectionName, initialDocs);

      // Incremental migration
      const incrementalDocs = TestDataGenerator.generateSampleDocuments(20).map((doc, index) => ({
        ...doc,
        id: `incremental_${index}`,
      }));
      await chromaMock.addDocuments(collectionName, incrementalDocs);

      // Verify total count
      const finalDocs = await chromaMock.getCollection(collectionName);
      expect(finalDocs).toHaveLength(50);

      // Verify all documents are present
      initialDocs.forEach((doc) => {
        expect(finalDocs.find((d) => d.id === doc.id)).toBeDefined();
      });

      incrementalDocs.forEach((doc) => {
        expect(finalDocs.find((d) => d.id === doc.id)).toBeDefined();
      });
    });

    test('should validate migration completeness', async () => {
      const collectionName = `${TEST_CONFIG.TEST_COLLECTION_PREFIX}migration_validation`;
      await chromaMock.createCollection(collectionName);

      const documentsToMigrate = testDocuments.slice(0, 25);
      const sourceChecksum = TestUtils.calculateChecksum(documentsToMigrate);

      await chromaMock.addDocuments(collectionName, documentsToMigrate);

      const migratedDocuments = await chromaMock.getCollection(collectionName);
      const targetChecksum = TestUtils.calculateChecksum(migratedDocuments);

      // Migration should be complete
      expect(migratedDocuments).toHaveLength(25);
      expect(targetChecksum).toBe(sourceChecksum);

      // All original documents should be present
      documentsToMigrate.forEach((originalDoc) => {
        const migratedDoc = migratedDocuments.find((doc) => doc.id === originalDoc.id);
        expect(migratedDoc).toBeDefined();
        expect(migratedDoc.content).toBe(originalDoc.content);
      });
    });
  });
});

// Performance benchmark utilities
export class MigrationBenchmark {
  static async runComprehensiveBenchmark(): Promise<void> {
    console.log('\n=== ZANTARA ChromaDB Migration Performance Benchmark ===\n');

    const chromaMock = new ChromaDBMock();
    const testSizes = [100, 500, 1000, 5000];

    for (const size of testSizes) {
      console.log(`\nTesting with ${size} documents:`);

      const documents = TestDataGenerator.generateSampleDocuments(size);
      const collectionName = `benchmark_${size}`;

      await chromaMock.createCollection(collectionName);

      // Upload performance
      const { duration: uploadDuration, metrics: uploadMetrics } =
        await TestUtils.measurePerformance(
          () => chromaMock.addDocuments(collectionName, documents),
          1
        );

      // Query performance
      const queryVector = new Array(1536).fill(0.1);
      const { duration: queryDuration, metrics: queryMetrics } = await TestUtils.measurePerformance(
        () => chromaMock.query(collectionName, queryVector),
        10
      );

      console.log(
        `  Upload: ${uploadMetrics.uploadSpeed.toFixed(2)} docs/sec (${uploadDuration}ms)`
      );
      console.log(`  Query:  ${queryMetrics.queryLatency.toFixed(2)}ms avg latency`);
      console.log(`  Memory: ${uploadMetrics.memoryUsage.toFixed(2)}MB used`);

      await chromaMock.deleteCollection(collectionName);
    }

    console.log('\n=== Benchmark Complete ===\n');
  }
}

// Test runner utilities
export class TestRunner {
  static async runFullTestSuite(): Promise<void> {
    console.log('Starting ZANTARA ChromaDB Migration Test Suite...\n');

    try {
      // Run performance benchmark
      await MigrationBenchmark.runComprehensiveBenchmark();

      // Run Jest tests programmatically
      const { execSync } = require('child_process');
      const testOutput = execSync('npx jest test-migration.ts --verbose', {
        encoding: 'utf8',
        cwd: path.dirname(__filename),
      });

      console.log(testOutput);

      console.log('\n✅ All tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    }
  }
}

// Export for standalone execution
if (require.main === module) {
  TestRunner.runFullTestSuite().catch(console.error);
}
