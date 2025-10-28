#!/usr/bin/env python3
"""
Complete Ingestion Script - All Missing Documents
Ingests:
1. DATABASE/KB/kbli_eye/ (20+ KBLI files)
2. Intel Scraping PROCESSED (aggregated files)
3. Any other discovered markdown files
"""

import sys
import os
from pathlib import Path
from typing import List, Dict, Tuple
import hashlib

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "backend-rag" / "backend"))

from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient

# Source directories
KBLI_KB_PATH = Path.home() / "Desktop" / "DATABASE" / "KB" / "kbli_eye"
INTEL_PROCESSED_PATH = Path(__file__).parent.parent / "website" / "INTEL_SCRAPING" / "data" / "processed" / "2025-10-24"

# Collection mappings
COLLECTION_MAP = {
    "kbli": "kbli_comprehensive",
    "immigration": "visa_oracle",
    "legal": "legal_updates",
    "property": "property_listings",
    "business": "kbli_comprehensive",
    "lifestyle": "cultural_insights",
    "safety": "cultural_insights"
}

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size
        chunk = text[start:end]

        # Try to break at sentence boundary
        if end < text_len:
            last_period = chunk.rfind('. ')
            if last_period > chunk_size * 0.5:
                end = start + last_period + 1
                chunk = text[start:end]

        if chunk.strip():
            chunks.append(chunk.strip())

        start = end - overlap

    return chunks

def process_kbli_file(file_path: Path, embedder: EmbeddingsGenerator) -> Tuple[List[str], List, List[Dict], List[str]]:
    """Process KBLI knowledge base file"""
    content = file_path.read_text(encoding='utf-8')

    if len(content) < 500:
        return [], [], [], []

    # Chunk content
    chunks = chunk_text(content, chunk_size=1500, overlap=300)

    if not chunks:
        return [], [], [], []

    # Generate embeddings
    embeddings = embedder.generate_embeddings(chunks)

    # Create metadata
    metadatas = []
    ids = []

    for idx, chunk in enumerate(chunks):
        chunk_id = hashlib.md5(f"{file_path.name}_{idx}".encode()).hexdigest()
        ids.append(chunk_id)

        meta = {
            "source_file": file_path.name,
            "category": "kbli",
            "source": "kb_database",
            "chunk_index": idx,
            "total_chunks": len(chunks),
            "chunk_length": len(chunk),
            "domain": "business_classification"
        }
        metadatas.append(meta)

    return chunks, embeddings, metadatas, ids

def process_intel_processed_file(file_path: Path, embedder: EmbeddingsGenerator) -> Tuple[List[str], List, List[Dict], List[str]]:
    """Process Intel Scraping PROCESSED aggregated file"""
    content = file_path.read_text(encoding='utf-8')

    if len(content) < 500:
        return [], [], [], []

    # Extract category from filename
    category = file_path.stem.split('_')[0]  # e.g., "immigration_20251024" -> "immigration"

    # Chunk content
    chunks = chunk_text(content, chunk_size=1200, overlap=250)

    if not chunks:
        return [], [], [], []

    # Generate embeddings
    embeddings = embedder.generate_embeddings(chunks)

    # Create metadata
    metadatas = []
    ids = []

    for idx, chunk in enumerate(chunks):
        chunk_id = hashlib.md5(f"{file_path.name}_{idx}".encode()).hexdigest()
        ids.append(chunk_id)

        meta = {
            "source_file": file_path.name,
            "category": category,
            "source": "intel_scraping_processed",
            "chunk_index": idx,
            "total_chunks": len(chunks),
            "chunk_length": len(chunk),
            "processed_date": "2025-10-24"
        }
        metadatas.append(meta)

    return chunks, embeddings, metadatas, ids

def ingest_kbli_kb(embedder: EmbeddingsGenerator):
    """Ingest all KBLI knowledge base files"""
    if not KBLI_KB_PATH.exists():
        print(f"⚠️  KBLI KB path not found: {KBLI_KB_PATH}")
        return 0

    print(f"\n📂 Processing KBLI KB: {KBLI_KB_PATH}")

    md_files = list(KBLI_KB_PATH.glob("*.md"))
    significant_files = [f for f in md_files if f.stat().st_size > 2048]

    print(f"   Found {len(significant_files)} KBLI files")

    if not significant_files:
        return 0

    client = ChromaDBClient(collection_name="kbli_comprehensive")
    total_chunks = 0

    for file_path in significant_files:
        print(f"   Processing: {file_path.name}...", end=' ')

        try:
            chunks, embeddings, metadatas, ids = process_kbli_file(file_path, embedder)

            if chunks:
                client.upsert_documents(
                    chunks=chunks,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    ids=ids
                )
                total_chunks += len(chunks)
                print(f"✅ {len(chunks)} chunks")
            else:
                print("⏭️  skipped (empty)")

        except Exception as e:
            print(f"❌ error: {e}")

    print(f"   Total: {total_chunks} chunks from KBLI KB")
    return total_chunks

def ingest_intel_processed(embedder: EmbeddingsGenerator):
    """Ingest Intel Scraping PROCESSED aggregated files"""
    if not INTEL_PROCESSED_PATH.exists():
        print(f"⚠️  Intel processed path not found: {INTEL_PROCESSED_PATH}")
        return 0

    print(f"\n📂 Processing Intel Scraping PROCESSED: {INTEL_PROCESSED_PATH}")

    md_files = list(INTEL_PROCESSED_PATH.glob("*.md"))
    significant_files = [f for f in md_files if f.stat().st_size > 2048]

    print(f"   Found {len(significant_files)} processed files")

    if not significant_files:
        return 0

    total_chunks = 0
    processed_by_category = {}

    for file_path in significant_files:
        category = file_path.stem.split('_')[0]
        collection_name = COLLECTION_MAP.get(category, "cultural_insights")

        print(f"   Processing: {file_path.name} → {collection_name}...", end=' ')

        try:
            chunks, embeddings, metadatas, ids = process_intel_processed_file(file_path, embedder)

            if chunks:
                client = ChromaDBClient(collection_name=collection_name)
                client.upsert_documents(
                    chunks=chunks,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    ids=ids
                )
                total_chunks += len(chunks)
                processed_by_category[category] = processed_by_category.get(category, 0) + len(chunks)
                print(f"✅ {len(chunks)} chunks")
            else:
                print("⏭️  skipped (empty)")

        except Exception as e:
            print(f"❌ error: {e}")

    print(f"   Total: {total_chunks} chunks from Intel Processed")
    print(f"   Breakdown: {processed_by_category}")
    return total_chunks

def main():
    print("🚀 Complete Missing Documents Ingestion")
    print("=" * 70)

    # Initialize embedder
    print("\n📊 Initializing embeddings generator...")
    embedder = EmbeddingsGenerator()
    print("   ✅ Ready")

    # Statistics
    stats = {
        "kbli_kb": 0,
        "intel_processed": 0
    }

    # 1. Ingest KBLI KB
    stats["kbli_kb"] = ingest_kbli_kb(embedder)

    # 2. Ingest Intel Processed
    stats["intel_processed"] = ingest_intel_processed(embedder)

    # Summary
    print("\n" + "=" * 70)
    print("✅ Ingestion Complete!")
    print("=" * 70)
    print(f"KBLI Knowledge Base:     {stats['kbli_kb']:4d} chunks")
    print(f"Intel Processed:         {stats['intel_processed']:4d} chunks")
    print("-" * 70)
    print(f"TOTAL:                   {sum(stats.values()):4d} chunks")
    print("=" * 70)

    print("\n📊 Next Steps:")
    print("1. Verify collections:")
    print("   cd /path/to/chromadb && python -c 'from core.vector_db import ChromaDBClient; ...'")
    print("")
    print("2. Sync to R2:")
    print("   ./scripts/sync_chromadb_to_r2.sh")
    print("")
    print("3. Verify Railway:")
    print("   curl https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/collections")

if __name__ == "__main__":
    main()
