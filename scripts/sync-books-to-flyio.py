#!/usr/bin/env python3
"""
Sync books_intelligence collection to Fly.io ChromaDB
Uses REST API of nuzantara-rag.fly.dev to upload all books
"""

import json
import requests
from pathlib import Path
import time
from typing import Dict, List
import os

# Configuration
LOCAL_CHROMADB = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/data/chromadb"
FLYIO_RAG_API = "https://nuzantara-rag.fly.dev"
COLLECTION_NAME = "books_intelligence"

# Get API key from environment
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")


def get_local_books() -> List[Dict]:
    """Get all books from local ChromaDB"""
    import chromadb
    
    client = chromadb.PersistentClient(path=LOCAL_CHROMADB)
    collection = client.get_collection(COLLECTION_NAME)
    
    # Get all documents
    all_data = collection.get(include=["documents", "metadatas"])
    
    documents = []
    for doc_id, text, metadata in zip(
        all_data["ids"],
        all_data["documents"],
        all_data["metadatas"]
    ):
        documents.append({
            "id": doc_id,
            "text": text,
            "metadata": metadata
        })
    
    return documents


def batch_upload(documents: List[Dict], batch_size: int = 100) -> Dict:
    """
    Upload documents in batches to Fly.io
    
    Args:
        documents: List of documents to upload
        batch_size: Number of documents per batch
    
    Returns:
        Stats dict with success/failure counts
    """
    total = len(documents)
    batches = (total + batch_size - 1) // batch_size
    
    stats = {
        "total": total,
        "uploaded": 0,
        "failed": 0,
        "batches": batches
    }
    
    for batch_idx in range(batches):
        start_idx = batch_idx * batch_size
        end_idx = min((batch_idx + 1) * batch_size, total)
        batch = documents[start_idx:end_idx]
        
        print(f"\n📤 Batch {batch_idx + 1}/{batches}: uploading {len(batch)} documents "
              f"({start_idx + 1}-{end_idx}/{total})...")
        
        try:
            # Prepare batch payload
            payload = {
                "collection_name": COLLECTION_NAME,
                "documents": batch
            }
            
            # Upload to Fly.io
            response = requests.post(
                f"{FLYIO_RAG_API}/v3/kb/ingest-batch",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                print(f"   ✅ Batch uploaded successfully")
                stats["uploaded"] += len(batch)
            else:
                print(f"   ❌ Batch upload failed: {response.status_code}")
                print(f"      Response: {response.text}")
                stats["failed"] += len(batch)
        
        except Exception as e:
            print(f"   ❌ Error uploading batch: {e}")
            stats["failed"] += len(batch)
        
        # Rate limiting delay
        time.sleep(0.5)
    
    return stats


def verify_flyio_collection() -> bool:
    """Verify that collection exists on Fly.io"""
    try:
        response = requests.get(
            f"{FLYIO_RAG_API}/v3/kb/collections",
            timeout=10
        )
        
        if response.status_code == 200:
            collections = response.json().get("collections", [])
            
            if COLLECTION_NAME in [c.get("name") for c in collections]:
                print(f"   ✅ Collection '{COLLECTION_NAME}' exists on Fly.io")
                
                # Get count
                for c in collections:
                    if c.get("name") == COLLECTION_NAME:
                        count = c.get("count", 0)
                        print(f"   📊 Current documents: {count:,}")
                
                return True
            else:
                print(f"   ⚠️  Collection '{COLLECTION_NAME}' not found on Fly.io")
                return False
        else:
            print(f"   ❌ Failed to get collections: {response.status_code}")
            return False
    
    except Exception as e:
        print(f"   ❌ Error verifying collection: {e}")
        return False


def main():
    """Main sync pipeline"""
    print("=" * 80)
    print("📚 SYNC BOOKS_INTELLIGENCE TO FLY.IO")
    print("=" * 80)
    
    print(f"\n📂 Local ChromaDB: {LOCAL_CHROMADB}")
    print(f"🌐 Fly.io API: {FLYIO_RAG_API}")
    print(f"📦 Collection: {COLLECTION_NAME}\n")
    
    # Step 1: Get local books
    print("📖 Loading books from local ChromaDB...")
    
    try:
        documents = get_local_books()
        print(f"   ✅ Loaded {len(documents):,} documents")
    except Exception as e:
        print(f"   ❌ Error loading local books: {e}")
        return
    
    if not documents:
        print("   ⚠️  No documents found!")
        return
    
    # Show sample
    sample_doc = documents[0]
    print(f"\n   Sample document:")
    print(f"   ID: {sample_doc['id']}")
    print(f"   Book: {sample_doc['metadata'].get('book_title', 'Unknown')}")
    print(f"   Category: {sample_doc['metadata'].get('category', 'Unknown')}")
    print(f"   Text preview: {sample_doc['text'][:100]}...")
    
    # Step 2: Verify Fly.io collection
    print(f"\n🔍 Verifying Fly.io collection...")
    
    # NOTE: This might fail if endpoint doesn't exist yet
    # verify_flyio_collection()
    print("   ℹ️  Skipping verification (endpoint may not exist)")
    
    # Step 3: Confirm upload
    print(f"\n{'=' * 80}")
    print(f"⚠️  READY TO UPLOAD")
    print(f"{'=' * 80}")
    print(f"   Documents to upload: {len(documents):,}")
    print(f"   Estimated batches: {(len(documents) + 99) // 100}")
    print(f"   Target: {FLYIO_RAG_API}")
    
    response = input("\n   Proceed with upload? (yes/no): ")
    
    if response.lower() != 'yes':
        print("\n   ℹ️  Upload cancelled")
        return
    
    # Step 4: Upload in batches
    print(f"\n{'=' * 80}")
    print("📤 UPLOADING TO FLY.IO")
    print(f"{'=' * 80}")
    
    start_time = time.time()
    stats = batch_upload(documents, batch_size=100)
    elapsed = time.time() - start_time
    
    # Step 5: Summary
    print(f"\n{'=' * 80}")
    print("📊 UPLOAD SUMMARY")
    print(f"{'=' * 80}")
    print(f"   Total documents: {stats['total']:,}")
    print(f"   Successfully uploaded: {stats['uploaded']:,}")
    print(f"   Failed: {stats['failed']:,}")
    print(f"   Batches processed: {stats['batches']}")
    print(f"   Time elapsed: {elapsed:.1f}s")
    print(f"   Avg speed: {stats['uploaded'] / elapsed:.1f} docs/sec")
    
    if stats["failed"] == 0:
        print(f"\n✅ ALL DOCUMENTS UPLOADED SUCCESSFULLY!")
    else:
        print(f"\n⚠️  {stats['failed']} documents failed to upload")
    
    print(f"\n{'=' * 80}")
    print("🎯 NEXT STEPS")
    print(f"{'=' * 80}")
    print("   1. Verify collection on Fly.io:")
    print(f"      curl {FLYIO_RAG_API}/v3/kb/collections")
    print("   2. Test query:")
    print(f"      curl -X POST {FLYIO_RAG_API}/v3/kb/query \\")
    print(f"           -H 'Content-Type: application/json' \\")
    print(f"           -d '{{\"query\": \"What is deep learning?\", \"collection\": \"{COLLECTION_NAME}\"}}'")
    print(f"{'=' * 80}")


if __name__ == "__main__":
    main()
