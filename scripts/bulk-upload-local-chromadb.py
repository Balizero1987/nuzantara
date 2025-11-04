#!/usr/bin/env python3
"""
BULK UPLOAD LOCAL - Carica tutte le 44 leggi su ChromaDB LOCALE
Usa ChromaDB diretto invece di API REST
"""

import json
import glob
import os
import chromadb
from pathlib import Path
import time
from typing import Dict, List
import sys

# Configurazione
LEGAL_PROCESSING_DIR = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS"
LOCAL_CHROMADB_PATH = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/data/chromadb"
COLLECTION_NAME = "legal_intelligence"

# Cohere API key per embeddings
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")
if not COHERE_API_KEY:
    print("❌ ERROR: COHERE_API_KEY environment variable not set!")
    print("   Export it first: export COHERE_API_KEY='your-key-here'")
    sys.exit(1)

def get_all_jsonl_files() -> List[str]:
    """Trova tutti i file JSONL non vuoti"""
    pattern = f"{LEGAL_PROCESSING_DIR}/*/OUTPUT/*_READY_FOR_KB*.jsonl"
    files = glob.glob(pattern)
    
    # Filtra solo file non vuoti
    valid_files = []
    for f in files:
        if os.path.getsize(f) > 0:
            valid_files.append(f)
    
    return sorted(valid_files)

def read_jsonl_file(file_path: str) -> List[Dict]:
    """Legge un file JSONL e ritorna lista di documenti"""
    documents = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    doc = json.loads(line)
                    documents.append(doc)
                except json.JSONDecodeError as e:
                    print(f"  ⚠️  Errore parsing line: {e}")
                    continue
    return documents

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using Cohere"""
    import cohere
    
    co = cohere.Client(COHERE_API_KEY)
    
    # Split into batches of 96 (Cohere limit)
    batch_size = 96
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        response = co.embed(
            texts=batch,
            model="embed-multilingual-v3.0",
            input_type="search_document"
        )
        all_embeddings.extend(response.embeddings)
        print(f"    Generated embeddings for {len(batch)} documents (batch {i//batch_size + 1})")
        time.sleep(0.5)  # Rate limiting
    
    return all_embeddings

def main():
    print("=" * 80)
    print("🚀 BULK UPLOAD LOCAL - Caricamento 44 leggi su ChromaDB LOCALE")
    print("=" * 80)
    
    # 1. Connect to ChromaDB
    print(f"\n📦 Connecting to ChromaDB: {LOCAL_CHROMADB_PATH}")
    client = chromadb.PersistentClient(path=LOCAL_CHROMADB_PATH)
    
    # Get or create collection
    try:
        collection = client.get_collection(name=COLLECTION_NAME)
        print(f"✅ Found existing collection: {COLLECTION_NAME}")
        print(f"   Current documents: {collection.count():,}")
    except:
        collection = client.create_collection(name=COLLECTION_NAME)
        print(f"✅ Created new collection: {COLLECTION_NAME}")
    
    # 2. Find all files
    jsonl_files = get_all_jsonl_files()
    print(f"\n📁 Found {len(jsonl_files)} JSONL files to process\n")
    
    if len(jsonl_files) == 0:
        print("❌ No files found!")
        return
    
    # 3. Process each file
    total_docs = 0
    successful_laws = []
    failed_laws = []
    
    for idx, file_path in enumerate(jsonl_files, 1):
        filename = Path(file_path).name
        law_id = filename.replace("_READY_FOR_KB.jsonl", "").replace("_READY_FOR_KB_CORRECTED.jsonl", "")
        
        print(f"\n[{idx}/{len(jsonl_files)}] Processing: {law_id}")
        print(f"  File: {filename}")
        
        # Leggi documenti
        documents = read_jsonl_file(file_path)
        
        if len(documents) == 0:
            print("  ⚠️  File vuoto, skip")
            continue
        
        print(f"  📄 Loaded {len(documents)} documents")
        
        try:
            # Prepare data
            texts = [doc.get("content", "") for doc in documents]
            metadatas = []
            ids = []
            
            for doc_idx, doc in enumerate(documents):
                # Generate unique ID
                pasal = doc.get("pasal", str(doc_idx))
                doc_id = f"{law_id}_pasal_{pasal}_{doc_idx}"
                
                metadata = {
                    "law_id": doc.get("law_id", law_id),
                    "pasal": doc.get("pasal", ""),
                    "section_title": doc.get("section_title", ""),
                    "category": doc.get("category", "legal_regulation"),
                    "type": doc.get("type", "legal_document"),
                    "source": "LEGAL_PROCESSING_ZANTARA"
                }
                
                metadatas.append(metadata)
                ids.append(doc_id)
            
            # Generate embeddings
            print(f"  🔮 Generating embeddings...")
            embeddings = generate_embeddings(texts)
            
            # Add to ChromaDB
            print(f"  💾 Adding to ChromaDB...")
            collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings
            )
            
            print(f"  ✅ Successfully added {len(documents)} documents")
            total_docs += len(documents)
            successful_laws.append(law_id)
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            failed_laws.append(law_id)
        
        # Small pause between files
        time.sleep(1)
    
    # 4. Final report
    print("\n" + "=" * 80)
    print("📊 REPORT FINALE")
    print("=" * 80)
    print(f"Total files processed: {len(jsonl_files)}")
    print(f"Total documents uploaded: {total_docs:,}")
    print(f"Successful laws: {len(successful_laws)}")
    print(f"Failed laws: {len(failed_laws)}")
    print(f"\nFinal collection size: {collection.count():,} documents")
    
    if successful_laws:
        print(f"\n✅ UPLOADED ({len(successful_laws)}):")
        for law in successful_laws[:10]:
            print(f"   - {law}")
        if len(successful_laws) > 10:
            print(f"   ... and {len(successful_laws) - 10} more")
    
    if failed_laws:
        print(f"\n❌ FAILED ({len(failed_laws)}):")
        for law in failed_laws:
            print(f"   - {law}")
    
    print("\n" + "=" * 80)
    print("🎯 NEXT STEP: Verifica che tutto sia OK:")
    print(f"   python3 -c 'import chromadb; c=chromadb.PersistentClient(path=\"{LOCAL_CHROMADB_PATH}\"); print(c.get_collection(\"{COLLECTION_NAME}\").count())'")
    print("=" * 80)

if __name__ == "__main__":
    main()
