#!/usr/bin/env python3
"""
PP 28/2025 - ChromaDB Ingestion Script
Injects the processed law into ZANTARA RAG system
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
import chromadb
from chromadb.config import Settings

# Configuration
SOURCE_FILE = Path.home() / "Desktop" / "PP28_FINAL_PACKAGE" / "PP_28_2025_READY_FOR_KB.jsonl"
CHROMA_PATH = Path(__file__).parent.parent / "data" / "chromadb"
COLLECTION_NAME = "legal_intelligence"

def init_chromadb():
    """Initialize ChromaDB client"""
    # Use new persistent client API
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    return client

def load_pp28_data():
    """Load processed PP 28/2025 data"""
    if not SOURCE_FILE.exists():
        print(f"❌ Source file not found: {SOURCE_FILE}")
        sys.exit(1)
    
    chunks = []
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                chunks.append(json.loads(line))
    
    print(f"✅ Loaded {len(chunks)} chunks from {SOURCE_FILE.name}")
    return chunks

def ingest_to_chromadb(client, chunks):
    """Ingest PP 28/2025 into ChromaDB"""
    
    # Get or create collection
    try:
        collection = client.get_collection(name=COLLECTION_NAME)
        print(f"✅ Using existing collection: {COLLECTION_NAME}")
    except:
        collection = client.create_collection(
            name=COLLECTION_NAME,
            metadata={
                "hnsw:space": "cosine",
                "description": "Legal intelligence and regulatory documents"
            }
        )
        print(f"✅ Created new collection: {COLLECTION_NAME}")
    
    # Prepare batch data
    ids = []
    documents = []
    metadatas = []
    
    for chunk in chunks:
        chunk_id = chunk['id']
        
        # Build document text (with context)
        doc_text = f"""
### {chunk['document_id']} - Pasal {chunk['pasal']}

{chunk['content']}

**Category**: {chunk['category']}
**Type**: {chunk['document_type']}
**Systems**: {', '.join(chunk.get('systems', []))}
**Tags**: {', '.join(chunk.get('tags', []))}
""".strip()
        
        # Metadata for ChromaDB
        metadata = {
            "law_id": chunk['document_id'],
            "title": chunk['document_title'],
            "pasal": str(chunk['pasal']),
            "category": chunk['category'],
            "subcategory": chunk['subcategory'],
            "document_type": chunk['document_type'],
            "has_kbli": str(chunk.get('has_kbli', False)),
            "language": chunk.get('language', 'id'),
            "source_file": "PP_28_2025.pdf",
            "ingested_at": datetime.now().isoformat(),
            "ingested_by": "ZANTARA_SYSTEM"
        }
        
        # Add KBLI flag if present
        if chunk['metadata'].get('kbli_required'):
            metadata['kbli_required'] = True
        
        ids.append(chunk_id)
        documents.append(doc_text)
        metadatas.append(metadata)
    
    # Batch upsert (efficient)
    BATCH_SIZE = 100
    total_batches = (len(ids) + BATCH_SIZE - 1) // BATCH_SIZE
    
    print(f"\n📦 Ingesting {len(chunks)} chunks in {total_batches} batches...")
    
    for i in range(0, len(ids), BATCH_SIZE):
        batch_ids = ids[i:i+BATCH_SIZE]
        batch_docs = documents[i:i+BATCH_SIZE]
        batch_meta = metadatas[i:i+BATCH_SIZE]
        
        collection.upsert(
            ids=batch_ids,
            documents=batch_docs,
            metadatas=batch_meta
        )
        
        batch_num = (i // BATCH_SIZE) + 1
        print(f"  ✅ Batch {batch_num}/{total_batches} completed ({len(batch_ids)} items)")
    
    print(f"\n✅ INGESTION COMPLETE: {len(chunks)} chunks added to '{COLLECTION_NAME}'")
    
    # Verify
    count = collection.count()
    print(f"📊 Collection now contains: {count} total documents")

def verify_ingestion(client):
    """Verify ingestion with sample queries"""
    collection = client.get_collection(name=COLLECTION_NAME)
    
    print("\n🔍 Verification Test Queries:")
    
    # Test 1: KBLI requirement
    results = collection.query(
        query_texts=["KBLI 5 digit requirement OSS"],
        n_results=3,
        where={"law_id": "PP-28-2025"}
    )
    print(f"\n1. KBLI Query: Found {len(results['ids'][0])} results")
    if results['documents'][0]:
        print(f"   Top result: {results['metadatas'][0][0]['pasal']}")
    
    # Test 2: Risk-based licensing
    results = collection.query(
        query_texts=["risk based business licensing classification"],
        n_results=3,
        where={"law_id": "PP-28-2025"}
    )
    print(f"\n2. Risk Query: Found {len(results['ids'][0])} results")
    if results['documents'][0]:
        print(f"   Top result: {results['metadatas'][0][0]['pasal']}")
    
    # Test 3: All PP 28/2025 docs
    all_pp28 = collection.get(
        where={"law_id": "PP-28-2025"}
    )
    print(f"\n3. Total PP 28/2025 documents in collection: {len(all_pp28['ids'])}")
    
    print("\n✅ Verification complete!")

def main():
    print("=" * 60)
    print("PP 28/2025 → ChromaDB Ingestion")
    print("=" * 60)
    
    # Step 1: Initialize ChromaDB
    print("\n[1/4] Initializing ChromaDB...")
    client = init_chromadb()
    
    # Step 2: Load data
    print("\n[2/4] Loading PP 28/2025 processed data...")
    chunks = load_pp28_data()
    
    # Step 3: Ingest
    print("\n[3/4] Ingesting to ChromaDB...")
    ingest_to_chromadb(client, chunks)
    
    # Step 4: Verify
    print("\n[4/4] Verifying ingestion...")
    verify_ingestion(client)
    
    print("\n" + "=" * 60)
    print("✅ PP 28/2025 SUCCESSFULLY INDEXED IN ZANTARA RAG!")
    print("=" * 60)
    print(f"\nCollection: {COLLECTION_NAME}")
    print(f"Location: {CHROMA_PATH}")
    print(f"Documents: {len(chunks)}")
    print(f"Status: Ready for queries")
    print("\nZANTARA può ora rispondere a domande su PP 28/2025! 🚀")

if __name__ == "__main__":
    main()
