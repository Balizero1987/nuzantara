#!/usr/bin/env tsx
/**
 * RAG DOCUMENTATION UPLOADER
 *
 * Uploads extracted documentation to RAG backend (ChromaDB):
 * - Handlers reference
 * - Project context
 * - Architecture docs
 *
 * Creates a dedicated "zantara-technical" collection for
 * internal project knowledge separate from Bali Zero operational docs.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, '..');
const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'https://zantara-rag-backend-himaadsxua-ew.a.run.app';

interface Document {
  id: string;
  content: string;
  metadata: {
    type: 'handler' | 'architecture' | 'project-context' | 'documentation';
    source: string;
    timestamp: string;
    category?: string;
  };
}

/**
 * Split large document into chunks
 */
function chunkDocument(content: string, maxChunkSize = 2000): string[] {
  const chunks: string[] = [];
  const lines = content.split('\n');

  let currentChunk = '';

  for (const line of lines) {
    if ((currentChunk + line).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Upload documents to RAG backend
 */
async function uploadToRAG(documents: Document[]) {
  console.log(`📤 Uploading ${documents.length} documents to RAG...`);

  try {
    const response = await fetch(`${RAG_BACKEND_URL}/api/ingest/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        collection: 'zantara-technical',
        documents: documents.map(d => ({
          id: d.id,
          content: d.content,
          metadata: d.metadata
        }))
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`RAG upload failed: ${response.status} ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Upload successful: ${result.count || documents.length} documents`);

    return result;
  } catch (error) {
    console.error(`❌ Upload failed:`, error);
    throw error;
  }
}

/**
 * Process handlers documentation
 */
function processHandlers(): Document[] {
  const handlersPath = join(ROOT, 'docs/HANDLERS_REFERENCE.md');
  const content = readFileSync(handlersPath, 'utf-8');

  // Split by handler (### sections)
  const sections = content.split(/^### /m).slice(1);
  const documents: Document[] = [];

  for (const section of sections) {
    const lines = section.split('\n');
    const handlerName = lines[0].replace(/`/g, '').trim();

    // Create document for this handler
    documents.push({
      id: `handler-${handlerName.replace(/\./g, '-')}`,
      content: `# Handler: ${handlerName}\n\n${section}`,
      metadata: {
        type: 'handler',
        source: 'HANDLERS_REFERENCE.md',
        timestamp: new Date().toISOString(),
        category: handlerName.split('.')[0]
      }
    });
  }

  console.log(`   Processed ${documents.length} handler docs`);
  return documents;
}

/**
 * Process project context
 */
function processProjectContext(): Document[] {
  const contextPath = join(ROOT, 'docs/PROJECT_CONTEXT.md');
  const content = readFileSync(contextPath, 'utf-8');

  // Split into chunks
  const chunks = chunkDocument(content, 3000);
  const documents: Document[] = [];

  for (let i = 0; i < chunks.length; i++) {
    documents.push({
      id: `project-context-chunk-${i}`,
      content: chunks[i],
      metadata: {
        type: 'project-context',
        source: 'PROJECT_CONTEXT.md',
        timestamp: new Date().toISOString()
      }
    });
  }

  console.log(`   Processed project context into ${documents.length} chunks`);
  return documents;
}

/**
 * Process .claude directory docs
 */
function processClaudeDocs(): Document[] {
  const documents: Document[] = [];

  const claudeDocs = [
    '.claude/INIT.md',
    '.claude/PROJECT_CONTEXT.md'
  ];

  for (const docPath of claudeDocs) {
    try {
      const fullPath = join(ROOT, docPath);
      const content = readFileSync(fullPath, 'utf-8');
      const chunks = chunkDocument(content, 3000);

      for (let i = 0; i < chunks.length; i++) {
        documents.push({
          id: `claude-${docPath.replace(/[\/\.]/g, '-')}-chunk-${i}`,
          content: chunks[i],
          metadata: {
            type: 'documentation',
            source: docPath,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (e) {
      console.log(`   ⚠️ Skipped ${docPath} (not found)`);
    }
  }

  console.log(`   Processed ${documents.length} Claude docs`);
  return documents;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 ZANTARA Documentation Upload to RAG');
  console.log(`📍 RAG Backend: ${RAG_BACKEND_URL}\n`);

  const allDocuments: Document[] = [];

  console.log('📖 Processing handlers documentation...');
  allDocuments.push(...processHandlers());

  console.log('📖 Processing project context...');
  allDocuments.push(...processProjectContext());

  console.log('📖 Processing Claude docs...');
  allDocuments.push(...processClaudeDocs());

  console.log(`\n📊 Total documents to upload: ${allDocuments.length}`);
  console.log(`💾 Total size: ${Math.round(JSON.stringify(allDocuments).length / 1024)}KB\n`);

  await uploadToRAG(allDocuments);

  console.log('\n✅ Documentation upload complete!');
  console.log('\n📚 ZANTARA now has access to:');
  console.log('   - All 104 handlers with full documentation');
  console.log('   - Complete project architecture');
  console.log('   - Code structure and organization');
  console.log('   - Development workflows');
}

main().catch(error => {
  console.error('\n❌ Upload failed:', error.message);
  process.exit(1);
});
