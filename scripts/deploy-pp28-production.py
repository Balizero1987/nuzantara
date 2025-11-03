#!/usr/bin/env python3
"""
Deploy PP28/2025 to NUZANTARA Production (Fly.io)
Uses JSONL format directly from oracle-data/
"""

import json
import sys
import requests
from pathlib import Path
import time

# Config
SOURCE = Path(__file__).parent.parent / "oracle-data" / "PP_28_2025_READY_FOR_KB.jsonl"
BACKEND = "https://nuzantara-rag.fly.dev"  # Production RAG endpoint
BATCH_SIZE = 25

def load_chunks():
    """Load JSONL chunks"""
    print(f"📥 Loading: {SOURCE.name}")
    
    chunks = []
    with open(SOURCE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                chunks.append(json.loads(line))
    
    print(f"✅ {len(chunks)} chunks loaded")
    return chunks

def deploy_batch(chunks, batch_num):
    """Deploy batch via /bali-zero/ingest"""
    
    try:
        # Prepare documents for ChromaDB
        documents = []
        metadatas = []
        ids = []
        
        for chunk in chunks:
            documents.append(chunk['content'])
            metadatas.append({
                'document_id': chunk['document_id'],
                'pasal': chunk.get('pasal', ''),
                'category': chunk.get('category', ''),
                'law_id': 'PP-28-2025',
                'source': 'PP-28-2025.pdf'
            })
            ids.append(chunk['id'])
        
        payload = {
            'collection_name': 'legal_intelligence',
            'documents': documents,
            'metadatas': metadatas,
            'ids': ids
        }
        
        response = requests.post(
            f"{BACKEND}/bali-zero/ingest",
            json=payload,
            timeout=90
        )
        
        if response.status_code == 200:
            print(f"✅ Batch {batch_num}: {len(chunks)} docs")
            return True
        else:
            print(f"❌ Batch {batch_num}: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Batch {batch_num}: {e}")
        return False

def test_query(query: str) -> int:
    """Test a query and return result count"""
    try:
        response = requests.get(
            f"{BACKEND}/bali-zero/query",
            params={
                'query_text': query,
                'collection_name': 'legal_intelligence',
                'n_results': 3
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return len(data.get('documents', [[]])[0])
        return 0
    except:
        return 0

def main():
    print("="*60)
    print("🚀 PP 28/2025 → NUZANTARA RAG Production")
    print("="*60)
    print()
    
    # Load
    chunks = load_chunks()
    
    # Deploy in batches
    print(f"\n📤 Deploying {len(chunks)} chunks (batches of {BATCH_SIZE})...")
    
    total_batches = (len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE
    success = 0
    
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i+BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        
        print(f"\n🔄 Batch {batch_num}/{total_batches}...", end=' ')
        
        if deploy_batch(batch, batch_num):
            success += len(batch)
        
        time.sleep(1)  # Rate limit
    
    print(f"\n\n✅ Deployed: {success}/{len(chunks)} chunks")
    
    # Verification
    print("\n🧪 Testing queries...")
    
    tests = [
        "PP 28 2025 KBLI 5 digit",
        "risk based licensing OSS",
        "persetujuan penggunaan kawasan hutan"
    ]
    
    for query in tests:
        count = test_query(query)
        status = "✅" if count > 0 else "❌"
        print(f"  {status} '{query[:35]}...' → {count} results")
        time.sleep(1)
    
    print("\n" + "="*60)
    print("🎉 DEPLOYMENT COMPLETE")
    print("="*60)
    print(f"\nBackend: {BACKEND}")
    print(f"Collection: legal_intelligence")
    print(f"PP28/2025: {success} chunks LIVE")
    print("\n✅ Test: https://zantara.balizero.com")
    print("   Ask: 'Cosa dice PP 28/2025 sul KBLI?'")

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
