#!/usr/bin/env python3
"""
BULK INGEST - Carica tutte le 44 leggi processate in ChromaDB locale
Basato su ingest-pp28-to-chromadb.py che ha già funzionato
"""

import json
import glob
import os
from pathlib import Path
import chromadb
import time

# Configuration
LEGAL_PROCESSING_DIR = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS")
CHROMA_PATH = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/data/chromadb")
COLLECTION_NAME = "legal_intelligence"

def init_chromadb():
    """Initialize ChromaDB client"""
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    return client

def get_all_jsonl_files():
    """Find all JSONL files"""
    pattern = str(LEGAL_PROCESSING_DIR / "*" / "OUTPUT" / "*_READY_FOR_KB*.jsonl")
    files = glob.glob(pattern)
    
    # Filter non-empty files only
    valid_files = []
    for f in files:
        if os.path.getsize(f) > 0:
            valid_files.append(f)
    
    return sorted(valid_files)

def load_jsonl_file(file_path):
    """Load JSONL file"""
    chunks = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                try:
                    chunks.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"  ⚠️  Parse error: {e}")
                    continue
    return chunks

def ingest_law_to_chromadb(collection, chunks, law_id):
    """Ingest one law into ChromaDB"""
    
    # Prepare batch data
    ids = []
    documents = []
    metadatas = []
    
    for idx, chunk in enumerate(chunks):
        # Generate unique ID
        pasal = chunk.get('pasal', chunk.get('section', str(idx)))
        chunk_id = f"{law_id}_pasal_{pasal}_{idx}"
        
        # Build document text (with context)
        content = chunk.get('content', '')
        doc_text = f"""
### {law_id} - Pasal {pasal}

{content}

**Category**: {chunk.get('category', 'legal_regulation')}
**Type**: {chunk.get('type', chunk.get('document_type', 'legal_document'))}
""".strip()
        
        # Metadata for ChromaDB
        metadata = {
            "law_id": law_id,
            "pasal": str(pasal),
            "section_title": chunk.get('section_title', chunk.get('title', '')),
            "category": chunk.get('category', 'legal_regulation'),
            "type": chunk.get('type', chunk.get('document_type', 'legal_document')),
            "source": "LEGAL_PROCESSING_ZANTARA"
        }
        
        ids.append(chunk_id)
        documents.append(doc_text)
        metadatas.append(metadata)
    
    # Add to collection (ChromaDB will auto-generate embeddings)
    try:
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        return len(ids)
    except Exception as e:
        print(f"  ❌ ChromaDB add error: {e}")
        return 0

def main():
    print("=" * 80)
    print("🚀 BULK INGEST - Caricamento 44 leggi indonesiane in ChromaDB")
    print("=" * 80)
    
    # 1. Initialize ChromaDB
    print(f"\n📦 Connecting to ChromaDB: {CHROMA_PATH}")
    client = init_chromadb()
    
    # Get or create collection
    try:
        collection = client.get_collection(name=COLLECTION_NAME)
        print(f"✅ Using existing collection: {COLLECTION_NAME}")
        print(f"   Current documents: {collection.count():,}")
    except:
        collection = client.create_collection(
            name=COLLECTION_NAME,
            metadata={
                "hnsw:space": "cosine",
                "description": "Legal intelligence and regulatory documents"
            }
        )
        print(f"✅ Created new collection: {COLLECTION_NAME}")
    
    # 2. Find all JSONL files
    jsonl_files = get_all_jsonl_files()
    print(f"\n📁 Found {len(jsonl_files)} JSONL files to process\n")
    
    if len(jsonl_files) == 0:
        print("❌ No files found!")
        return
    
    # 3. Process each file
    total_docs = 0
    successful_laws = []
    failed_laws = []
    
    start_time = time.time()
    
    for idx, file_path in enumerate(jsonl_files, 1):
        filename = Path(file_path).name
        law_id = filename.replace("_READY_FOR_KB.jsonl", "").replace("_READY_FOR_KB_CORRECTED.jsonl", "")
        
        print(f"[{idx}/{len(jsonl_files)}] Processing: {law_id}")
        print(f"  File: {filename}")
        
        # Load chunks
        chunks = load_jsonl_file(file_path)
        
        if len(chunks) == 0:
            print("  ⚠️  File empty, skipping")
            continue
        
        print(f"  📄 Loaded {len(chunks)} chunks")
        
        # Ingest to ChromaDB
        try:
            docs_added = ingest_law_to_chromadb(collection, chunks, law_id)
            if docs_added > 0:
                print(f"  ✅ Successfully added {docs_added} documents")
                total_docs += docs_added
                successful_laws.append(law_id)
            else:
                print(f"  ❌ Failed to add documents")
                failed_laws.append(law_id)
        except Exception as e:
            print(f"  ❌ Error: {e}")
            failed_laws.append(law_id)
        
        print()
        time.sleep(0.1)  # Small pause
    
    # 4. Final report
    elapsed_time = time.time() - start_time
    
    print("=" * 80)
    print("📊 FINAL REPORT")
    print("=" * 80)
    print(f"Total files processed: {len(jsonl_files)}")
    print(f"Total documents added: {total_docs:,}")
    print(f"Successful laws: {len(successful_laws)}")
    print(f"Failed laws: {len(failed_laws)}")
    print(f"Execution time: {elapsed_time:.1f}s")
    print(f"\nFinal collection size: {collection.count():,} documents")
    
    if successful_laws:
        print(f"\n✅ SUCCESSFULLY INGESTED ({len(successful_laws)}):")
        for law in successful_laws[:15]:
            print(f"   - {law}")
        if len(successful_laws) > 15:
            print(f"   ... and {len(successful_laws) - 15} more")
    
    if failed_laws:
        print(f"\n❌ FAILED ({len(failed_laws)}):")
        for law in failed_laws:
            print(f"   - {law}")
    
    print("\n" + "=" * 80)
    print("🎯 DONE! ChromaDB populated with all laws")
    print("   Next: Deploy to Fly.io or test locally")
    print("=" * 80)

if __name__ == "__main__":
    main()
