#!/usr/bin/env python3
"""
BULK UPLOAD SCRIPT - Carica tutte le 44 leggi processate su Fly.io ChromaDB
Usa l'API REST di nuzantara-rag.fly.dev per popolare ChromaDB
"""

import json
import glob
import os
import requests
from pathlib import Path
import time
from typing import Dict, List

# Configurazione
LEGAL_PROCESSING_DIR = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS"
FLYIO_RAG_API = "https://nuzantara-rag.fly.dev"
COLLECTION_NAME = "legal_intelligence"

# Cohere embeddings configuration (come in ingest-pp28-to-chromadb.py)
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")  # Sarà gestito dal backend

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
                    print(f"  ⚠️  Errore parsing line in {file_path}: {e}")
                    continue
    return documents

def upload_to_flyio(documents: List[Dict], law_id: str) -> bool:
    """
    Upload documenti a Fly.io ChromaDB usando l'API /api/oracle/ingest
    """
    endpoint = f"{FLYIO_RAG_API}/api/oracle/ingest"
    
    # Prepara payload secondo formato API
    chunks = []
    for doc in documents:
        chunk = {
            "content": doc.get("content", ""),
            "metadata": {
                "law_id": doc.get("law_id", law_id),
                "pasal": doc.get("pasal", ""),
                "section_title": doc.get("section_title", ""),
                "category": doc.get("category", "legal_regulation"),
                "type": doc.get("type", "legal_document"),
                "source": doc.get("source", "LEGAL_PROCESSING_ZANTARA")
            }
        }
        chunks.append(chunk)
    
    payload = {
        "collection": COLLECTION_NAME,
        "documents": chunks
    }
    
    try:
        print(f"  📤 Uploading {len(chunks)} chunks to {endpoint}...")
        response = requests.post(
            endpoint,
            json=payload,
            timeout=300  # 5 minuti timeout per upload grandi
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"  ✅ Upload successful: {result}")
            return True
        else:
            print(f"  ❌ Upload failed: {response.status_code}")
            print(f"     Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Upload error: {e}")
        return False

def main():
    print("=" * 80)
    print("🚀 BULK UPLOAD - Caricamento 44 leggi indonesiane su Fly.io ChromaDB")
    print("=" * 80)
    
    # 1. Trova tutti i file
    jsonl_files = get_all_jsonl_files()
    print(f"\n📁 Trovati {len(jsonl_files)} file JSONL da processare\n")
    
    if len(jsonl_files) == 0:
        print("❌ Nessun file trovato!")
        return
    
    # 2. Processa ogni file
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
            print(f"  ⚠️  File vuoto, skip")
            continue
        
        print(f"  📄 Loaded {len(documents)} documents")
        total_docs += len(documents)
        
        # Upload a Fly.io
        success = upload_to_flyio(documents, law_id)
        
        if success:
            successful_laws.append(law_id)
        else:
            failed_laws.append(law_id)
        
        # Rate limiting: pausa tra upload
        if idx < len(jsonl_files):
            print("  ⏳ Waiting 2s before next upload...")
            time.sleep(2)
    
    # 3. Report finale
    print("\n" + "=" * 80)
    print("📊 REPORT FINALE")
    print("=" * 80)
    print(f"Total files processed: {len(jsonl_files)}")
    print(f"Total documents uploaded: {total_docs:,}")
    print(f"Successful laws: {len(successful_laws)}")
    print(f"Failed laws: {len(failed_laws)}")
    
    if successful_laws:
        print(f"\n✅ UPLOADED ({len(successful_laws)}):")
        for law in successful_laws[:10]:  # Primi 10
            print(f"   - {law}")
        if len(successful_laws) > 10:
            print(f"   ... and {len(successful_laws) - 10} more")
    
    if failed_laws:
        print(f"\n❌ FAILED ({len(failed_laws)}):")
        for law in failed_laws:
            print(f"   - {law}")
    
    print("\n" + "=" * 80)
    print("🎯 NEXT STEP: Verifica su Fly.io che le collections siano popolate")
    print(f"   curl {FLYIO_RAG_API}/api/oracle/collections")
    print("=" * 80)

if __name__ == "__main__":
    main()
