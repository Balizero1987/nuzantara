#!/usr/bin/env python3
"""
Deploy books_intelligence to Fly.io using /api/rag/ingest endpoint
Uploads in optimized batches with retry logic
"""

import json
import requests
import time
import chromadb
from pathlib import Path
from typing import List, Dict

# Configuration
LOCAL_CHROMADB = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/data/chromadb"
FLYIO_API = "https://nuzantara-rag.fly.dev"
COLLECTION_NAME = "books_intelligence"
BATCH_SIZE = 50  # Smaller batches for reliability


def get_local_books() -> List[Dict]:
    """Get all books from local ChromaDB"""
    client = chromadb.PersistentClient(path=LOCAL_CHROMADB)
    collection = client.get_collection(COLLECTION_NAME)
    
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


def upload_batch(batch: List[Dict], batch_num: int, total_batches: int) -> bool:
    """Upload batch to Fly.io using /api/rag/ingest"""
    
    # Transform to expected format
    chunks = []
    for doc in batch:
        chunks.append({
            "id": doc["id"],
            "document": doc["text"],
            "metadata": doc["metadata"]
        })
    
    payload = {
        "collection": COLLECTION_NAME,
        "chunks": chunks,
        "metadata": {
            "source": "books_intelligence",
            "ingested_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    }
    
    print(f"\n📤 Batch {batch_num}/{total_batches}: uploading {len(chunks)} documents...")
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{FLYIO_API}/api/rag/ingest",
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Success: {result.get('chunks_ingested', len(chunks))} chunks ingested")
                return True
            else:
                print(f"   ❌ Failed: {response.status_code}")
                print(f"      Response: {response.text[:200]}")
                
                if attempt < max_retries - 1:
                    wait = (attempt + 1) * 2
                    print(f"      Retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    return False
        
        except Exception as e:
            print(f"   ❌ Error: {e}")
            if attempt < max_retries - 1:
                wait = (attempt + 1) * 2
                print(f"      Retrying in {wait}s...")
                time.sleep(wait)
            else:
                return False
    
    return False


def main():
    print("=" * 80)
    print("📚 DEPLOY BOOKS_INTELLIGENCE TO FLY.IO")
    print("=" * 80)
    
    print(f"\n🌐 Target: {FLYIO_API}")
    print(f"📦 Collection: {COLLECTION_NAME}")
    print(f"📊 Batch size: {BATCH_SIZE} documents\n")
    
    # Load local books
    print("📖 Loading books from local ChromaDB...")
    try:
        documents = get_local_books()
        print(f"   ✅ Loaded {len(documents):,} documents\n")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    if not documents:
        print("   ⚠️  No documents found!")
        return
    
    # Show sample
    sample = documents[0]
    print(f"   Sample document:")
    print(f"   ID: {sample['id']}")
    print(f"   Book: {sample['metadata'].get('book_title', 'Unknown')}")
    print(f"   Category: {sample['metadata'].get('category', 'Unknown')}")
    print(f"   Text: {sample['text'][:100]}...\n")
    
    # Confirm
    total_batches = (len(documents) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"{'=' * 80}")
    print(f"⚠️  READY TO UPLOAD")
    print(f"{'=' * 80}")
    print(f"   Documents: {len(documents):,}")
    print(f"   Batches: {total_batches}")
    print(f"   Estimated time: ~{total_batches * 3 / 60:.1f} minutes")
    
    response = input("\n   Proceed? (yes/no): ")
    if response.lower() != 'yes':
        print("\n   ℹ️  Cancelled")
        return
    
    # Upload in batches
    print(f"\n{'=' * 80}")
    print("📤 UPLOADING")
    print(f"{'=' * 80}")
    
    start_time = time.time()
    success_count = 0
    failed_count = 0
    
    for i in range(0, len(documents), BATCH_SIZE):
        batch = documents[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        
        if upload_batch(batch, batch_num, total_batches):
            success_count += len(batch)
        else:
            failed_count += len(batch)
        
        # Rate limiting
        time.sleep(0.5)
    
    elapsed = time.time() - start_time
    
    # Summary
    print(f"\n{'=' * 80}")
    print("📊 UPLOAD SUMMARY")
    print(f"{'=' * 80}")
    print(f"   Total documents: {len(documents):,}")
    print(f"   Successfully uploaded: {success_count:,}")
    print(f"   Failed: {failed_count:,}")
    print(f"   Time elapsed: {elapsed / 60:.1f} minutes")
    print(f"   Avg speed: {success_count / elapsed:.1f} docs/sec")
    
    if failed_count == 0:
        print(f"\n✅ ALL DOCUMENTS UPLOADED SUCCESSFULLY!")
    else:
        print(f"\n⚠️  {failed_count} documents failed")
    
    print(f"\n{'=' * 80}")
    print("🔍 VERIFY DEPLOYMENT")
    print(f"{'=' * 80}")
    print(f"   curl {FLYIO_API}/api/rag/stats?collection={COLLECTION_NAME}")
    print(f"{'=' * 80}")


if __name__ == "__main__":
    main()
