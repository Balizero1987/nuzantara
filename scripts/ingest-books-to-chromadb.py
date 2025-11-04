#!/usr/bin/env python3
"""
Ingest processed books JSONL into ChromaDB collection 'books_intelligence'
Processes 20 books with 8,541 chunks from books_processed_jsonl/
"""

import json
import chromadb
from pathlib import Path
from typing import List, Dict, Any
import time

# Cohere for embeddings (same as legal_intelligence)
try:
    import cohere
    COHERE_AVAILABLE = True
except ImportError:
    print("⚠️  Cohere not installed. Install: pip3 install cohere")
    COHERE_AVAILABLE = False


def load_jsonl_file(jsonl_path: Path) -> List[Dict[str, Any]]:
    """Load JSONL file and return list of entries"""
    entries = []
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                entries.append(json.loads(line))
    return entries


def batch_ingest(
    collection,
    entries: List[Dict[str, Any]],
    batch_size: int = 100
):
    """
    Ingest entries in batches to avoid memory issues
    
    Args:
        collection: ChromaDB collection
        entries: List of JSONL entries
        batch_size: Number of entries per batch
    """
    total = len(entries)
    batches = (total + batch_size - 1) // batch_size
    
    for batch_idx in range(batches):
        start_idx = batch_idx * batch_size
        end_idx = min((batch_idx + 1) * batch_size, total)
        batch = entries[start_idx:end_idx]
        
        # Prepare batch data
        ids = [entry["id"] for entry in batch]
        documents = [entry["text"] for entry in batch]
        metadatas = [entry["metadata"] for entry in batch]
        
        # Add to collection
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        
        print(f"   ✅ Batch {batch_idx + 1}/{batches}: {len(batch)} chunks "
              f"({start_idx + 1}-{end_idx}/{total})")
        
        # Small delay to avoid rate limits
        time.sleep(0.1)


def main():
    """Main ingestion pipeline"""
    print("=" * 80)
    print("📚 BOOKS JSONL → CHROMADB INGESTION")
    print("=" * 80)
    
    # Paths
    jsonl_base = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/DATABASE/KB/books_processed_jsonl")
    chromadb_path = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/data/chromadb")
    
    print(f"\n📂 JSONL Source: {jsonl_base}")
    print(f"📂 ChromaDB Path: {chromadb_path}\n")
    
    # Initialize ChromaDB
    print("🔗 Connecting to ChromaDB...")
    client = chromadb.PersistentClient(path=str(chromadb_path))
    
    # Create or get collection
    collection_name = "books_intelligence"
    
    # Check if collection exists
    existing_collections = [c.name for c in client.list_collections()]
    
    if collection_name in existing_collections:
        print(f"⚠️  Collection '{collection_name}' already exists")
        
        # Get existing collection
        collection = client.get_collection(collection_name)
        existing_count = collection.count()
        
        print(f"   Current documents: {existing_count:,}")
        
        response = input("\n⚠️  DELETE and recreate? (yes/no): ")
        if response.lower() == 'yes':
            client.delete_collection(collection_name)
            print(f"   ✅ Deleted collection '{collection_name}'")
        else:
            print("   ℹ️  Keeping existing collection (will add to it)")
    
    # Create collection (with Cohere embeddings if available)
    if COHERE_AVAILABLE:
        print(f"✅ Creating collection '{collection_name}' with Cohere embeddings...")
        
        # Use same embedding config as legal_intelligence
        collection = client.create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    else:
        print(f"✅ Creating collection '{collection_name}' with default embeddings...")
        collection = client.create_collection(name=collection_name)
    
    print(f"✅ Collection '{collection_name}' ready\n")
    
    # Find all JSONL files
    jsonl_files = list(jsonl_base.rglob("*.jsonl"))
    
    if not jsonl_files:
        print("❌ No JSONL files found!")
        return
    
    print(f"📋 Found {len(jsonl_files)} JSONL files\n")
    
    # Process each file
    total_stats = {
        "files_processed": 0,
        "files_failed": 0,
        "total_chunks": 0,
        "total_chars": 0
    }
    
    for jsonl_file in sorted(jsonl_files):
        relative_path = jsonl_file.relative_to(jsonl_base)
        print(f"\n{'=' * 80}")
        print(f"📖 Processing: {relative_path}")
        print(f"{'=' * 80}")
        
        try:
            # Load entries
            entries = load_jsonl_file(jsonl_file)
            
            if not entries:
                print("   ⚠️  No entries found")
                total_stats["files_failed"] += 1
                continue
            
            print(f"   Loaded {len(entries):,} chunks")
            
            # Calculate stats
            total_chars = sum(len(e["text"]) for e in entries)
            avg_chunk_size = total_chars / len(entries)
            
            print(f"   Total characters: {total_chars:,}")
            print(f"   Avg chunk size: {avg_chunk_size:.0f} chars")
            
            # Get metadata from first entry
            first_meta = entries[0]["metadata"]
            book_title = first_meta.get("book_title", "Unknown")
            category = first_meta.get("category", "Unknown")
            
            print(f"   Book: {book_title}")
            print(f"   Category: {category.upper()}")
            
            # Ingest in batches
            print(f"\n   📥 Ingesting to ChromaDB...")
            batch_ingest(collection, entries, batch_size=100)
            
            print(f"\n   ✅ Successfully ingested {len(entries):,} chunks")
            
            total_stats["files_processed"] += 1
            total_stats["total_chunks"] += len(entries)
            total_stats["total_chars"] += total_chars
        
        except Exception as e:
            print(f"   ❌ Error processing file: {e}")
            total_stats["files_failed"] += 1
    
    # Final summary
    print("\n" + "=" * 80)
    print("📊 FINAL INGESTION SUMMARY")
    print("=" * 80)
    
    final_count = collection.count()
    
    print(f"   Files processed: {total_stats['files_processed']}")
    print(f"   Files failed: {total_stats['files_failed']}")
    print(f"   Total chunks ingested: {total_stats['total_chunks']:,}")
    print(f"   Total characters: {total_stats['total_chars']:,}")
    print(f"\n   📊 ChromaDB '{collection_name}' final count: {final_count:,} documents")
    
    # Show sample query
    print("\n" + "=" * 80)
    print("🔍 SAMPLE QUERY TEST")
    print("=" * 80)
    
    test_query = "What is deep learning?"
    results = collection.query(
        query_texts=[test_query],
        n_results=3
    )
    
    print(f"\nQuery: '{test_query}'")
    print(f"\nTop 3 results:")
    
    for idx, (doc, meta) in enumerate(zip(results["documents"][0], results["metadatas"][0]), 1):
        book_title = meta.get("book_title", "Unknown")
        category = meta.get("category", "Unknown")
        preview = doc[:150] + "..." if len(doc) > 150 else doc
        
        print(f"\n{idx}. [{category.upper()}] {book_title}")
        print(f"   {preview}")
    
    print("\n" + "=" * 80)
    print("✅ INGESTION COMPLETE!")
    print("=" * 80)


if __name__ == "__main__":
    main()
