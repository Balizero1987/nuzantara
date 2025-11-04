#!/usr/bin/env tsx

/**
 * ZANTARA ChromaDB Migration Tool v2
 *
 * Migrates .md documents from local database to ChromaDB collections via RAG backend API
 *
 * Features:
 * - Recursive .md file discovery
 * - Text content extraction and cleaning
 * - Metadata generation from filename/path
 * - Document chunking (max 1000 chars per chunk)
 * - Embedding generation using existing setup
 * - Batch upload to ChromaDB collections via API
 * - Progress tracking with file counts
 * - Error handling with retry logic
 * - Dry-run mode for testing
 * - Resume capability (skip already processed)
 * - Comprehensive logging
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Configuration
const CONFIG = {
  sourceDir: '/Users/antonellosiano/Desktop/DATABASE/KB',
  ragBackendUrl: process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev',
  maxChunkSize: 1000,
  batchSize: 5,
  maxRetries: 3,
  retryDelay: 1000,
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  resume: process.argv.includes('--resume'),
  collections: {
    kbli_eye: 'kbli_eye',
    legal_architect: 'legal_architect',
    tax_genius: 'tax_genius',
    visa_oracle: 'visa_oracle',
    zantara_books: 'zantara_books',
    raw_books_philosophy: 'zantara_books',
    KB_human_readable_ID: 'zantara_books',
    KB_backup_pre_migration: 'zantara_books',
  },
} as const;

// Logging utility
class Logger {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs =
      args.length > 0
        ? ` ${args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
            .join(' ')}`
        : '';
    return `[${timestamp}] ${level}: ${message}${formattedArgs}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('INFO', message, ...args));
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('ERROR', message, ...args));
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', message, ...args));
  }

  debug(message: string, ...args: any[]): void {
    if (this.verbose) {
      console.log(this.formatMessage('DEBUG', message, ...args));
    }
  }

  success(message: string, ...args: any[]): void {
    console.log(`✅ ${this.formatMessage('SUCCESS', message, ...args)}`);
  }
}

// Progress tracker
class ProgressTracker {
  private totalFiles: number = 0;
  private processedFiles: number = 0;
  private skippedFiles: number = 0;
  private errorFiles: number = 0;
  private totalChunks: number = 0;
  private startTime: number = Date.now();

  setTotal(total: number): void {
    this.totalFiles = total;
  }

  incrementProcessed(): void {
    this.processedFiles++;
  }

  incrementSkipped(): void {
    this.skippedFiles++;
  }

  incrementError(): void {
    this.errorFiles++;
  }

  addChunks(count: number): void {
    this.totalChunks += count;
  }

  getProgress(): number {
    return this.totalFiles > 0 ? (this.processedFiles / this.totalFiles) * 100 : 0;
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  getETA(): number {
    const progress = this.getProgress();
    if (progress === 0) return 0;
    const elapsed = this.getElapsedTime();
    return (elapsed / progress) * (100 - progress);
  }

  print(): void {
    const progress = this.getProgress();
    const elapsed = this.getElapsedTime();
    const eta = this.getETA();

    console.log(`\n📊 Migration Progress:`);
    console.log(`   Files: ${this.processedFiles}/${this.totalFiles} (${progress.toFixed(1)}%)`);
    console.log(`   Skipped: ${this.skippedFiles} | Errors: ${this.errorFiles}`);
    console.log(`   Chunks: ${this.totalChunks}`);
    console.log(`   Time: ${(elapsed / 1000).toFixed(1)}s | ETA: ${(eta / 1000).toFixed(1)}s`);
  }
}

// File discovery utilities
class FileDiscovery {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Recursively discover all .md files in the source directory
   */
  async discoverMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    const scan = (currentDir: string): void => {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip hidden directories and common system directories
          if (!item.startsWith('.') && item !== 'node_modules' && item !== '__pycache__') {
            scan(fullPath);
          }
        } else if (stat.isFile() && item.endsWith('.md')) {
          files.push(fullPath);
          this.logger.debug(`Found .md file: ${fullPath}`);
        }
      }
    };

    this.logger.info(`Scanning directory: ${dir}`);
    scan(dir);
    this.logger.info(`Discovered ${files.length} .md files`);

    return files.sort();
  }

  /**
   * Group files by collection based on their directory structure
   */
  groupFilesByCollection(files: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();

    for (const file of files) {
      const relativePath = path.relative(CONFIG.sourceDir, file);
      const dirName = path.dirname(relativePath).split(path.sep)[0];

      let collection = 'zantara_books'; // default collection

      // Map directory names to collection names
      for (const [key, value] of Object.entries(CONFIG.collections)) {
        if (relativePath.includes(key)) {
          collection = value;
          break;
        }
      }

      if (!groups.has(collection)) {
        groups.set(collection, []);
      }
      groups.get(collection)!.push(file);
    }

    return groups;
  }
}

// Text processing utilities
class TextProcessor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Extract and clean text content from a markdown file
   */
  extractText(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Remove frontmatter (YAML metadata between ---)
      let cleaned = content.replace(/^---\n[\s\S]*?\n---\n/, '');

      // Remove excessive whitespace
      cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

      // Remove markdown formatting but keep content structure
      cleaned = cleaned
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images, keep alt text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/^>\s+/gm, '') // Remove blockquotes
        .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
        .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
        .trim();

      // Filter out very short content
      if (cleaned.length < 50) {
        this.logger.warn(`Very short content in ${filePath}: ${cleaned.length} chars`);
      }

      return cleaned;
    } catch (error: any) {
      this.logger.error(`Failed to extract text from ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Split text into chunks of maximum size with overlap
   */
  chunkText(text: string, maxSize: number = CONFIG.maxChunkSize): string[] {
    if (text.length <= maxSize) {
      return [text];
    }

    const chunks: string[] = [];
    let currentPos = 0;
    const overlap = Math.floor(maxSize * 0.1); // 10% overlap

    while (currentPos < text.length) {
      let endPos = currentPos + maxSize;

      // Try to break at sentence boundaries
      if (endPos < text.length) {
        const lastSentence = text.lastIndexOf('.', endPos);
        const lastNewline = text.lastIndexOf('\n', endPos);
        const breakPoint = Math.max(lastSentence, lastNewline);

        if (breakPoint > currentPos + maxSize * 0.3) {
          // Don't go too far back
          endPos = breakPoint + 1;
        }
      }

      const chunk = text.substring(currentPos, endPos).trim();
      if (chunk.length > 20) {
        // Skip very small chunks
        chunks.push(chunk);
      }

      currentPos = Math.max(currentPos + 1, endPos - overlap);
    }

    return chunks;
  }

  /**
   * Generate metadata from file path and content
   */
  generateMetadata(filePath: string, collection: string, chunkIndex: number): any {
    const relativePath = path.relative(CONFIG.sourceDir, filePath);
    const fileName = path.basename(filePath, '.md');
    const dirName = path.dirname(relativePath);

    return {
      source_file: relativePath,
      file_name: fileName,
      directory: dirName,
      collection,
      chunk_index: chunkIndex,
      created_at: new Date().toISOString(),
      file_path: filePath,
      relative_path: relativePath,
    };
  }
}

// RAG Backend API Client
class RAGBackendClient {
  private logger: Logger;
  private baseUrl: string;

  constructor(logger: Logger, baseUrl: string) {
    this.logger = logger;
    this.baseUrl = baseUrl;
  }

  /**
   * Check health of RAG backend
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      const isHealthy = response.data?.status === 'healthy';
      this.logger.info(`RAG Backend health: ${isHealthy ? 'OK' : 'FAILED'}`);
      return isHealthy;
    } catch (error: any) {
      this.logger.error(`RAG Backend health check failed:`, error.message);
      return false;
    }
  }

  /**
   * Upload documents to a collection via API
   */
  async uploadDocuments(
    collectionName: string,
    documents: string[],
    metadatas: any[],
    ids: string[]
  ): Promise<boolean> {
    if (documents.length === 0) return true;

    try {
      // We'll need to create documents one by one or in small batches
      // since the API might not have a bulk upload endpoint

      for (let i = 0; i < documents.length; i++) {
        const payload = {
          id: ids[i],
          document: documents[i],
          metadata: metadatas[i],
          collection: collectionName,
        };

        try {
          await axios.post(`${this.baseUrl}/api/admin/ingest-document`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          });

          this.logger.debug(`Uploaded document: ${ids[i]}`);
        } catch (error: any) {
          // If the specific endpoint doesn't exist, try a different approach
          if (error.response?.status === 404) {
            this.logger.warn(`Bulk ingest endpoint not found, trying alternative...`);

            // Try to use memory store as fallback
            try {
              await axios.post(`${this.baseUrl}/api/memory/store`, {
                id: ids[i],
                document: documents[i],
                metadata: {
                  ...metadatas[i],
                  collection: collectionName,
                },
              });

              this.logger.debug(`Stored via memory API: ${ids[i]}`);
            } catch (fallbackError: any) {
              this.logger.error(`Failed to store document ${ids[i]}:`, fallbackError.message);
              return false;
            }
          } else {
            this.logger.error(`Failed to upload document ${ids[i]}:`, error.message);
            return false;
          }
        }
      }

      this.logger.success(`Uploaded ${documents.length} documents to ${collectionName}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to upload documents to ${collectionName}:`, error.message);
      return false;
    }
  }

  /**
   * Check if document already exists
   */
  async documentExists(collectionName: string, docId: string): Promise<boolean> {
    try {
      // Try to search for the specific document ID
      const response = await axios.post(`${this.baseUrl}/search`, {
        query: docId,
        collection: collectionName,
        limit: 1,
      });

      return response.data?.results?.length > 0;
    } catch (error: any) {
      this.logger.debug(`Error checking document existence:`, error.message);
      return false;
    }
  }
}

// Retry utility
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = CONFIG.maxRetries,
  delay: number = CONFIG.retryDelay
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      logger.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const waitTime = delay * attempt; // Exponential backoff
        logger.debug(`Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError!;
}

// Main migration class
class ChromaDBMigrator {
  private logger: Logger;
  private progress: ProgressTracker;
  private fileDiscovery: FileDiscovery;
  private textProcessor: TextProcessor;
  private ragClient: RAGBackendClient;

  constructor() {
    this.logger = new Logger(CONFIG.verbose);
    this.progress = new ProgressTracker();
    this.fileDiscovery = new FileDiscovery(this.logger);
    this.textProcessor = new TextProcessor(this.logger);
    this.ragClient = new RAGBackendClient(this.logger, CONFIG.ragBackendUrl);
  }

  /**
   * Run the complete migration process
   */
  async run(): Promise<void> {
    try {
      this.logger.info('🚀 Starting ZANTARA ChromaDB Migration v2 (API-based)');
      this.logger.info(`Configuration:`, {
        sourceDir: CONFIG.sourceDir,
        ragBackendUrl: CONFIG.ragBackendUrl,
        dryRun: CONFIG.dryRun,
        resume: CONFIG.resume,
        maxChunkSize: CONFIG.maxChunkSize,
        batchSize: CONFIG.batchSize,
      });

      if (CONFIG.dryRun) {
        this.logger.warn('🔍 DRY RUN MODE - No changes will be made');
      }

      // Check RAG backend health
      if (!CONFIG.dryRun) {
        const isHealthy = await this.ragClient.checkHealth();
        if (!isHealthy) {
          throw new Error('RAG backend is not healthy');
        }
      }

      // Discover all markdown files
      const allFiles = await this.fileDiscovery.discoverMarkdownFiles(CONFIG.sourceDir);
      this.progress.setTotal(allFiles.length);

      if (allFiles.length === 0) {
        this.logger.warn('No markdown files found to migrate');
        return;
      }

      // Group files by collection
      const fileGroups = this.fileDiscovery.groupFilesByCollection(allFiles);

      this.logger.info(`Found ${allFiles.length} files in ${fileGroups.size} collections:`);
      for (const [collection, files] of fileGroups.entries()) {
        this.logger.info(`  ${collection}: ${files.length} files`);
      }

      // Process each collection
      for (const [collectionName, files] of fileGroups.entries()) {
        await this.processCollection(collectionName, files);

        // Print progress after each collection
        this.progress.print();
      }

      // Final summary
      this.printFinalSummary();
    } catch (error: any) {
      this.logger.error('Migration failed:', error.message);
      if (CONFIG.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Process all files in a collection
   */
  private async processCollection(collectionName: string, files: string[]): Promise<void> {
    this.logger.info(`\n📁 Processing collection: ${collectionName} (${files.length} files)`);

    let documents: string[] = [];
    let metadatas: any[] = [];
    let ids: string[] = [];

    for (const filePath of files) {
      try {
        const result = await this.processFile(filePath, collectionName);

        if (result) {
          documents.push(...result.documents);
          metadatas.push(...result.metadatas);
          ids.push(...result.ids);
          this.progress.addChunks(result.documents.length);
        }

        this.progress.incrementProcessed();

        // Upload batch when it reaches the configured size
        if (documents.length >= CONFIG.batchSize * 2) {
          await this.uploadBatch(collectionName, documents, metadatas, ids);
          documents = [];
          metadatas = [];
          ids = [];
        }

        // Print progress every 10 files
        if (this.progress.getProgress() % 10 === 0) {
          this.progress.print();
        }
      } catch (error: any) {
        this.logger.error(`Failed to process file ${filePath}:`, error.message);
        this.progress.incrementError();
      }
    }

    // Upload remaining documents
    if (documents.length > 0) {
      await this.uploadBatch(collectionName, documents, metadatas, ids);
    }

    this.logger.success(`✅ Completed collection: ${collectionName}`);
  }

  /**
   * Process a single file
   */
  private async processFile(
    filePath: string,
    collectionName: string
  ): Promise<{
    documents: string[];
    metadatas: any[];
    ids: string[];
  } | null> {
    const fileName = path.basename(filePath, '.md');
    const relativePath = path.relative(CONFIG.sourceDir, filePath);

    // Skip if resume mode and document might already exist
    if (CONFIG.resume) {
      const docId = `${collectionName}_${fileName}_0`;
      if (!CONFIG.dryRun && (await this.ragClient.documentExists(collectionName, docId))) {
        this.logger.debug(`Skipping already processed: ${relativePath}`);
        this.progress.incrementSkipped();
        return null;
      }
    }

    // Extract text content
    const textContent = this.textProcessor.extractText(filePath);

    if (textContent.length < 20) {
      this.logger.warn(
        `Skipping very short content: ${relativePath} (${textContent.length} chars)`
      );
      this.progress.incrementSkipped();
      return null;
    }

    // Split into chunks
    const chunks = this.textProcessor.chunkText(textContent);

    if (chunks.length === 0) {
      this.logger.warn(`No chunks generated for: ${relativePath}`);
      this.progress.incrementSkipped();
      return null;
    }

    // Generate documents, metadata, and IDs
    const documents: string[] = [];
    const metadatas: any[] = [];
    const ids: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const docId = `${collectionName}_${fileName}_${i}`;
      const metadata = this.textProcessor.generateMetadata(filePath, collectionName, i);

      documents.push(chunk);
      metadatas.push(metadata);
      ids.push(docId);
    }

    this.logger.debug(
      `Processed ${relativePath}: ${chunks.length} chunks, ${textContent.length} total chars`
    );

    return { documents, metadatas, ids };
  }

  /**
   * Upload a batch of documents via API
   */
  private async uploadBatch(
    collectionName: string,
    documents: string[],
    metadatas: any[],
    ids: string[]
  ): Promise<void> {
    if (CONFIG.dryRun) {
      this.logger.info(`[DRY RUN] Would upload ${documents.length} documents to ${collectionName}`);
      return;
    }

    await retry(async () => {
      const success = await this.ragClient.uploadDocuments(
        collectionName,
        documents,
        metadatas,
        ids
      );
      if (!success) {
        throw new Error(`Failed to upload batch to ${collectionName}`);
      }
    });
  }

  /**
   * Print final migration summary
   */
  private printFinalSummary(): void {
    const elapsed = this.progress.getElapsedTime();
    const stats = {
      totalFiles: this.progress.getProgress(),
      processedFiles: this.progress.processedFiles,
      skippedFiles: this.progress.skippedFiles,
      errorFiles: this.progress.errorFiles,
      totalChunks: this.progress.totalChunks,
      totalTime: (elapsed / 1000).toFixed(1),
      avgTimePerFile: (elapsed / this.progress.processedFiles / 1000).toFixed(2),
    };

    console.log('\n🎉 Migration Complete!');
    console.log('='.repeat(50));
    console.log(`📊 Final Statistics:`);
    console.log(`   Total Files: ${stats.totalFiles}`);
    console.log(`   ✅ Processed: ${stats.processedFiles}`);
    console.log(`   ⏭️  Skipped: ${stats.skippedFiles}`);
    console.log(`   ❌ Errors: ${stats.errorFiles}`);
    console.log(`   📄 Total Chunks: ${stats.totalChunks}`);
    console.log(`   ⏱️  Total Time: ${stats.totalTime}s`);
    console.log(`   📈 Avg Time/File: ${stats.avgTimePerFile}s`);

    if (CONFIG.dryRun) {
      console.log('\n🔍 This was a DRY RUN - no actual changes were made');
      console.log('   Run without --dry-run to perform the actual migration');
    }

    console.log('='.repeat(50));
  }
}

// Initialize logger
const logger = new Logger(CONFIG.verbose);

// Main execution
async function main(): Promise<void> {
  console.log('ZANTARA ChromaDB Migration Tool v2 (API-based)');
  console.log('===============================================');

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage: tsx migrate-to-chromadb-v2.ts [options]

Options:
  --dry-run    Show what would be migrated without making changes
  --resume     Skip files that might already be processed
  --verbose    Enable detailed logging
  --help, -h   Show this help message

Environment Variables:
  RAG_BACKEND_URL     RAG backend URL (default: https://nuzantara-rag.fly.dev)

Examples:
  tsx migrate-to-chromadb-v2.ts                 # Normal migration
  tsx migrate-to-chromadb-v2.ts --dry-run       # Preview migration
  tsx migrate-to-chromadb-v2.ts --resume        # Resume interrupted migration
  tsx migrate-to-chromadb-v2.ts --verbose       # Detailed logging
    `);
    process.exit(0);
  }

  const migrator = new ChromaDBMigrator();
  await migrator.run();
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Migration failed:', error);
    process.exit(1);
  });
}

export { ChromaDBMigrator };
