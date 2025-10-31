#!/usr/bin/env python3
"""
Intel Scraping → ChromaDB Ingestion Script
Populates: tax_updates, legal_updates, property_listings, property_knowledge, cultural_insights
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

# Configuration
INTEL_BASE = Path(__file__).parent.parent / "website" / "INTEL_SCRAPING" / "data" / "raw" / "2025-10-25"

# Category to Collection mapping
COLLECTION_MAP = {
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

def extract_metadata(content: str) -> Dict[str, str]:
    """Extract metadata from markdown header"""
    metadata = {}
    lines = content.split('\n')

    for line in lines[:20]:
        if line.startswith('**Source**:'):
            metadata['source'] = line.split(':', 1)[1].strip()
        elif line.startswith('**URL**:'):
            metadata['url'] = line.split(':', 1)[1].strip()
        elif line.startswith('**Published**:'):
            metadata['published'] = line.split(':', 1)[1].strip()
        elif line.startswith('**Category**:'):
            metadata['category'] = line.split(':', 1)[1].strip()

    return metadata

def process_file(file_path: Path, category: str, embedder: EmbeddingsGenerator) -> Tuple[List[str], List, List[Dict], List[str]]:
    """Process single markdown file"""
    content = file_path.read_text(encoding='utf-8')

    # Skip if too small
    if len(content) < 500:
        return [], [], [], []

    # Extract metadata
    file_meta = extract_metadata(content)

    # Remove metadata header (first 10 lines typically)
    lines = content.split('\n')
    content_start = 0
    for i, line in enumerate(lines):
        if line.strip() == '---' and i > 0:
            content_start = i + 1
            break

    main_content = '\n'.join(lines[content_start:])

    # Chunk content
    chunks = chunk_text(main_content)

    if not chunks:
        return [], [], [], []

    # Generate embeddings
    embeddings = embedder.generate_embeddings(chunks)

    # Create metadata for each chunk
    metadatas = []
    ids = []

    for idx, chunk in enumerate(chunks):
        chunk_id = hashlib.md5(f"{file_path.name}_{idx}".encode()).hexdigest()
        ids.append(chunk_id)

        meta = {
            "source_file": file_path.name,
            "category": category,
            "chunk_index": idx,
            "total_chunks": len(chunks),
            "chunk_length": len(chunk),
            **file_meta
        }
        metadatas.append(meta)

    return chunks, embeddings, metadatas, ids

def ingest_category(category: str, embedder: EmbeddingsGenerator):
    """Ingest all files from a category"""
    category_path = INTEL_BASE / category

    if not category_path.exists():
        print(f"⚠️  Category not found: {category}")
        return

    collection_name = COLLECTION_MAP.get(category)
    if not collection_name:
        print(f"⚠️  No collection mapping for: {category}")
        return

    print(f"\n📂 Processing category: {category} → {collection_name}")

    # Get markdown files
    md_files = list(category_path.glob("*.md"))

    # Filter files > 1KB
    significant_files = [f for f in md_files if f.stat().st_size > 1024]

    print(f"   Found {len(significant_files)} significant files")

    if not significant_files:
        return

    # Initialize ChromaDB client
    client = ChromaDBClient(collection_name=collection_name)

    total_chunks = 0

    for file_path in significant_files:
        print(f"   Processing: {file_path.name}...", end=' ')

        try:
            chunks, embeddings, metadatas, ids = process_file(file_path, category, embedder)

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

    print(f"   Total: {total_chunks} chunks ingested into {collection_name}")

def main():
    print("🚀 Intel Scraping → ChromaDB Ingestion")
    print("=" * 60)

    # Initialize embedder
    print("\n📊 Initializing embeddings generator...")
    embedder = EmbeddingsGenerator()
    print("   ✅ Ready")

    # Process each category
    categories = ["immigration", "legal", "property", "business", "lifestyle", "safety"]

    for category in categories:
        ingest_category(category, embedder)

    print("\n" + "=" * 60)
    print("✅ Ingestion complete!")
    print("\nNext steps:")
    print("1. Verify collections: python -c 'from core.vector_db import ChromaDBClient; ...'")
    print("2. Sync to R2: AWS_ACCESS_KEY_ID=... aws s3 sync ...")
    print("3. Trigger Fly.io redeploy")

if __name__ == "__main__":
    main()
