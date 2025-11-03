#!/usr/bin/env python3
"""
PP28/2025 Direct Ingestion to ChromaDB
Uses direct ChromaDB client connection
"""

import json
import sys
from pathlib import Path
import chromadb
from chromadb.config import Settings

# Config
SOURCE = Path(__file__).parent.parent / "oracle-data" / "PP_28_2025_READY_FOR_KB.jsonl"
CHROMADB_PATH = Path(__file__).parent.parent / "data" / "chromadb"
COLLECTION = "legal_intelligence"

def main():
    print("="*60)
    print("📚 PP 28/2025 Direct ChromaDB Ingestion")
    print("="*60)
    print()
    
    # Load chunks
    print(f"📥 Loading: {SOURCE.name}")
    chunks = []
    with open(SOURCE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                chunks.append(json.loads(line))
    
    print(f"✅ {len(chunks)} chunks loaded\n")
    
    # Connect to ChromaDB
    print(f"🔌 Connecting to: {CHROMADB_PATH}")
    client = chromadb.PersistentClient(path=str(CHROMADB_PATH))
    
    # Get or create collection
    try:
        collection = client.get_collection(name=COLLECTION)
        print(f"✅ Collection '{COLLECTION}' found")
        initial_count = collection.count()
        print(f"   Current docs: {initial_count}")
    except:
        collection = client.create_collection(
            name=COLLECTION,
            metadata={"description": "Legal documents and regulations"}
        )
        print(f"✅ Collection '{COLLECTION}' created")
        initial_count = 0
    
    print()
    
    # Prepare data
    print("📦 Preparing documents...")
    
    documents = []
    metadatas = []
    ids = []
    
    for chunk in chunks:
        documents.append(chunk['content'])
        metadatas.append({
            'document_id': chunk['document_id'],
            'document_title': chunk['document_title'],
            'pasal': chunk.get('pasal', ''),
            'category': chunk.get('category', ''),
            'law_id': 'PP-28-2025',
            'source': 'PP Nomor 28 Tahun 2025.pdf'
        })
        ids.append(chunk['id'])
    
    print(f"✅ {len(documents)} documents prepared\n")
    
    # Ingest in batches
    BATCH_SIZE = 100
    total = len(documents)
    
    print(f"📤 Ingesting in batches of {BATCH_SIZE}...")
    
    for i in range(0, total, BATCH_SIZE):
        end = min(i + BATCH_SIZE, total)
        batch_num = i // BATCH_SIZE + 1
        total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
        
        try:
            collection.add(
                documents=documents[i:end],
                metadatas=metadatas[i:end],
                ids=ids[i:end]
            )
            print(f"✅ Batch {batch_num}/{total_batches}: {end-i} docs")
        except Exception as e:
            print(f"❌ Batch {batch_num} failed: {e}")
    
    # Final count
    final_count = collection.count()
    new_docs = final_count - initial_count
    
    print()
    print("="*60)
    print("🎉 INGESTION COMPLETE")
    print("="*60)
    print(f"\nCollection: {COLLECTION}")
    print(f"Before: {initial_count} docs")
    print(f"After:  {final_count} docs")
    print(f"Added:  {new_docs} docs (PP-28-2025)")
    print()
    
    # Test query
    print("🧪 Testing query...")
    results = collection.query(
        query_texts=["KBLI 5 digit requirement"],
        n_results=3
    )
    
    if results and results['documents'] and results['documents'][0]:
        print(f"✅ Found {len(results['documents'][0])} results")
        print("\n📄 Sample result:")
        print(f"   {results['documents'][0][0][:150]}...")
    else:
        print("⚠️ No results found")
    
    print("\n✅ PP28/2025 is now in LOCAL ChromaDB!")
    print("   Path: {CHROMADB_PATH}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
