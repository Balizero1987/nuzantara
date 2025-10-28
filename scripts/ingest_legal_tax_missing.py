#!/usr/bin/env python3
"""
Ingest Missing Legal Architect and Tax Genius Documents
Discovered via deep file comparison - these are NOT duplicates of existing KB
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
LEGAL_ARCHITECT_PATH = Path.home() / "Desktop" / "DATABASE" / "KB" / "legal_architect"
TAX_GENIUS_PATH = Path.home() / "Desktop" / "DATABASE" / "KB" / "tax_genius"

# Collections
LEGAL_COLLECTION = "legal_updates"
TAX_COLLECTION = "tax_genius"

def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 250) -> List[str]:
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

def process_legal_file(file_path: Path, embedder: EmbeddingsGenerator) -> Tuple[List[str], List, List[Dict], List[str]]:
    """Process Legal Architect file"""
    content = file_path.read_text(encoding='utf-8')

    if len(content) < 1000:
        return [], [], [], []

    # Chunk content
    chunks = chunk_text(content, chunk_size=1400, overlap=300)

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
            "category": "legal",
            "source": "legal_architect_kb",
            "chunk_index": idx,
            "total_chunks": len(chunks),
            "chunk_length": len(chunk),
            "domain": "indonesian_law",
            "subcategory": _extract_subcategory(file_path.name)
        }
        metadatas.append(meta)

    return chunks, embeddings, metadatas, ids

def process_tax_file(file_path: Path, embedder: EmbeddingsGenerator) -> Tuple[List[str], List, List[Dict], List[str]]:
    """Process Tax Genius file"""
    content = file_path.read_text(encoding='utf-8')

    if len(content) < 1000:
        return [], [], [], []

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
            "category": "tax",
            "source": "tax_genius_kb",
            "chunk_index": idx,
            "total_chunks": len(chunks),
            "chunk_length": len(chunk),
            "domain": "indonesian_tax"
        }
        metadatas.append(meta)

    return chunks, embeddings, metadatas, ids

def _extract_subcategory(filename: str) -> str:
    """Extract subcategory from filename"""
    if "IMMIGRATION" in filename.upper():
        return "immigration"
    elif "REAL_ESTATE" in filename.upper() or "PROPERTY" in filename.upper():
        return "property"
    elif "TAX" in filename.upper():
        return "tax"
    elif "COMPLIANCE" in filename.upper():
        return "compliance"
    elif "LEGAL_FRAMEWORK" in filename.upper() or "LEGAL_CODES" in filename.upper():
        return "general_law"
    elif "INVESTMENT" in filename.upper():
        return "investment"
    else:
        return "general"

def ingest_legal_architect(embedder: EmbeddingsGenerator):
    """Ingest Legal Architect files"""
    if not LEGAL_ARCHITECT_PATH.exists():
        print(f"⚠️  Legal Architect path not found: {LEGAL_ARCHITECT_PATH}")
        return 0

    print(f"\n📂 Processing Legal Architect: {LEGAL_ARCHITECT_PATH}")

    md_files = list(LEGAL_ARCHITECT_PATH.glob("*.md"))
    significant_files = [f for f in md_files if f.stat().st_size > 5120]

    print(f"   Found {len(significant_files)} legal files")

    if not significant_files:
        return 0

    client = ChromaDBClient(collection_name=LEGAL_COLLECTION)
    total_chunks = 0

    for file_path in significant_files:
        print(f"   Processing: {file_path.name}...", end=' ')

        try:
            chunks, embeddings, metadatas, ids = process_legal_file(file_path, embedder)

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

    print(f"   Total: {total_chunks} chunks from Legal Architect")
    return total_chunks

def ingest_tax_genius(embedder: EmbeddingsGenerator):
    """Ingest Tax Genius files (only unique ones)"""
    if not TAX_GENIUS_PATH.exists():
        print(f"⚠️  Tax Genius path not found: {TAX_GENIUS_PATH}")
        return 0

    print(f"\n📂 Processing Tax Genius: {TAX_GENIUS_PATH}")

    # Focus on main content files, skip reports/summaries
    target_files = [
        "INDONESIAN_TAX_REGULATIONS_2025.md",
        "TAX_CALCULATIONS_EXAMPLES.md",
        "TAXGENIUS_INTEGRATION_READY.md",
        "BALI_ZERO_SERVICES_PRICELIST_2025.txt.md"
    ]

    md_files = [TAX_GENIUS_PATH / f for f in target_files if (TAX_GENIUS_PATH / f).exists()]
    significant_files = [f for f in md_files if f.stat().st_size > 5120]

    print(f"   Found {len(significant_files)} tax files")

    if not significant_files:
        return 0

    client = ChromaDBClient(collection_name=TAX_COLLECTION)
    total_chunks = 0

    for file_path in significant_files:
        print(f"   Processing: {file_path.name}...", end=' ')

        try:
            chunks, embeddings, metadatas, ids = process_tax_file(file_path, embedder)

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

    print(f"   Total: {total_chunks} chunks from Tax Genius")
    return total_chunks

def main():
    print("🚀 Legal Architect + Tax Genius Missing Documents Ingestion")
    print("=" * 70)

    # Initialize embedder
    print("\n📊 Initializing embeddings generator...")
    embedder = EmbeddingsGenerator()
    print("   ✅ Ready")

    # Statistics
    stats = {
        "legal_architect": 0,
        "tax_genius": 0
    }

    # 1. Ingest Legal Architect
    stats["legal_architect"] = ingest_legal_architect(embedder)

    # 2. Ingest Tax Genius
    stats["tax_genius"] = ingest_tax_genius(embedder)

    # Summary
    print("\n" + "=" * 70)
    print("✅ Ingestion Complete!")
    print("=" * 70)
    print(f"Legal Architect:         {stats['legal_architect']:4d} chunks")
    print(f"Tax Genius:              {stats['tax_genius']:4d} chunks")
    print("-" * 70)
    print(f"TOTAL:                   {sum(stats.values()):4d} chunks")
    print("=" * 70)

    print("\n📊 Next Steps:")
    print("1. Sync to R2:")
    print("   ./scripts/sync_chromadb_to_r2.sh")
    print("")
    print("2. Verify Railway:")
    print("   curl https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/collections")

if __name__ == "__main__":
    main()
