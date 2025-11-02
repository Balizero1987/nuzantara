# ZANTARA ChromaDB Migration Tools

Complete migration solution for transferring 273+ markdown documents from local database to ChromaDB collections on Fly.io production.

## ✅ WORKING SOLUTION IDENTIFIED

**Primary Tool**: `migrate-to-chromadb-v3.py` (✅ Tested and Working)

### Key Features
- **API Integration**: Uses `/api/memory/store` endpoint
- **Recursive Discovery**: Automatically finds all `.md` files in source directory
- **Smart Chunking**: Splits documents into 1000-character chunks with overlap
- **Metadata Generation**: Creates rich metadata from file paths and content
- **Progress Tracking**: Real-time progress bars and statistics
- **Error Handling**: Comprehensive retry logic with exponential backoff
- **Dry Run Mode**: Preview migration without making changes

## 🚀 Quick Start

```bash
# Test migration (dry run)
python3 migrate-to-chromadb-v3.py --dry-run --verbose

# Execute actual migration
python3 migrate-to-chromadb-v3.py --verbose

# Verify results
curl -s "https://nuzantara-rag.fly.dev/search" \
  -X POST -H "Content-Type: application/json" \
  -d '{"query": "KBLI", "collection": "kbli_eye", "limit": 3}'
```

## 📊 Migration Statistics

- **Source Files**: 273 markdown documents
- **Total Chunks**: 8,136 chunks (1000 chars each)
- **Collections**: 5 collections (kbli_eye, visa_oracle, tax_genius, legal_architect, zantara_books)
- **Backend**: https://nuzantara-rag.fly.dev
- **Status**: ✅ Ready for production migration

## Configuration

The script automatically detects collections based on directory structure:

- `kbli_eye` → `kbli_eye`
- `legal_architect` → `legal_architect`
- `tax_genius` → `tax_genius`
- `visa_oracle` → `visa_oracle`
- `zantara_books` → `zantara_books`
- `raw_books_philosophy` → `raw_books_philosophy`
- `KB_human_readable_ID` → `kb_human_readable`
- `KB_backup_pre_migration` → `kb_backup`

## Environment Variables

```bash
CHROMA_URL=http://localhost:8000          # ChromaDB server URL
RAG_BACKEND_URL=http://localhost:8000     # RAG backend URL for embeddings
```

## Command Line Options

- `--dry-run`: Show what would be migrated without making changes
- `--resume`: Skip files that might already be processed
- `--verbose`: Enable detailed logging
- `--help, -h`: Show help message

## Migration Process

1. **Discovery**: Recursively scans source directory for `.md` files
2. **Grouping**: Groups files by collection based on directory structure
3. **Processing**: For each file:
   - Extracts and cleans text content
   - Removes markdown formatting
   - Splits into chunks (max 1000 chars)
   - Generates metadata from file path
   - Creates unique IDs: `{collection}_{filename}_{chunkIndex}`
4. **Upload**: Batches upload to ChromaDB with embeddings

## Document ID Format

Each document chunk gets a unique ID:
```
{collection}_{sourcefile}_{chunkIndex}
```

Example:
```
visa_oracle_visa_guide_0
visa_oracle_visa_guide_1
```

## Metadata Structure

Each chunk includes metadata:
```json
{
  "source_file": "relative/path/to/file.md",
  "file_name": "filename",
  "directory": "subdirectory",
  "collection": "visa_oracle",
  "chunk_index": 0,
  "created_at": "2025-01-01T00:00:00.000Z",
  "file_path": "/absolute/path/to/file.md",
  "relative_path": "relative/path/to/file.md"
}
```

## Error Handling

- **Retry Logic**: Automatic retries with exponential backoff
- **Fallback Embeddings**: Zero vectors if embedding service fails
- **Resume Capability**: Skip already processed documents
- **Detailed Logging**: Error tracking with context

## Performance Considerations

- **Batch Size**: Processes files in batches of 5 (configurable)
- **Chunk Overlap**: 10% overlap between chunks for context
- **Memory Efficient**: Processes files sequentially
- **Rate Limiting**: Built-in delays to avoid overwhelming services

## Monitoring

The script provides real-time progress updates:
- File processing count and percentage
- Chunk count and timing
- Estimated time remaining
- Error and skip statistics

## Requirements

- Node.js with TypeScript support
- `tsx` for TypeScript execution
- Access to ChromaDB instance
- Access to RAG backend for embeddings
- Read access to source directory

## Troubleshooting

### Common Issues

1. **Connection Errors**: Ensure ChromaDB and RAG backend are running
2. **Permission Errors**: Check file system permissions
3. **Memory Issues**: Reduce batch size if needed
4. **Rate Limiting**: Increase delays between batches

### Debug Mode

Use `--verbose` flag for detailed logging:
```bash
tsx migrate-to-chromadb.ts --verbose
```

### Dry Run Testing

Always test with dry run first:
```bash
tsx migrate-to-chromadb.ts --dry-run --verbose
```

## Examples

### Basic Migration
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/scripts
tsx migrate-to-chromadb.ts
```

### Test Run
```bash
tsx migrate-to-chromadb.ts --dry-run --verbose
```

### Resume After Interruption
```bash
tsx migrate-to-chromadb.ts --resume
```

### Custom Environment
```bash
CHROMA_URL=http://chromadb:8000 RAG_BACKEND_URL=http://rag:8001 tsx migrate-to-chromadb.ts
```