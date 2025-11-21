# Legacy ChromaDB Scripts - ARCHIVED

⚠️ **DEPRECATED** - These scripts use the legacy ChromaDB vector database and are no longer maintained.

## What's Here

### Ingestion Scripts
- `ingest_all_books.py` - Batch book ingestion to ChromaDB
- `ingest_books_simple.py` - Simple book/epub ingestion
- `ingest_text_files.py` - Text file ingestion
- `ingest_pricelist.py` - Pricelist ingestion

### Test Scripts
- `test_search.py` - Search functionality testing
- `analyze_test_quality.py` - Test quality analysis

## Current Status

**❌ DO NOT USE** - These scripts will not work because:
1. ChromaDB has been replaced with Qdrant
2. Vector database schemas have changed
3. Authentication methods updated
4. Dependencies may be outdated

## Modern Equivalents

For current data ingestion and management:
- **Vector Database**: Qdrant (see `backend/core/qdrant_db.py`)
- **Ingestion Service**: `backend/services/ingestion_service.py`
- **Auto Ingestion**: `backend/services/auto_ingestion_orchestrator.py`

## Migration Guide

If you need to migrate functionality from these scripts:

1. **Replace ChromaDB client** with Qdrant client
2. **Update embedding models** to use OpenAI text-embedding-3-small
3. **Use current collection schemas** in Qdrant
4. **Follow current authentication** patterns

## Archive Date
2025-01-21 - Migrated to Qdrant + ZANTARA AI architecture