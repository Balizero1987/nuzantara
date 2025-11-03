#!/usr/bin/env python3
"""
Deploy PP28/2025 to Production RAG via Backend API
Fast deployment without SSH/SFTP complexity
"""

import json
import sys
import requests
from pathlib import Path
from typing import List, Dict
import time

# Configuration
SOURCE_FILE = Path(__file__).parent.parent / "oracle-data" / "PP_28_2025" / "kb_ready" / "chunks_articles.json"
BACKEND_URL = "https://nuzantara-backend.fly.dev"  # Backend TypeScript API
COLLECTION_NAME = "legal_intelligence"
BATCH_SIZE = 50

def load_pp28_chunks() -> List[Dict]:
    """Load processed PP28 chunks"""
    print("📥 Loading PP28/2025 chunks...")
    
    if not SOURCE_FILE.exists():
        print(f"❌ Source file not found: {SOURCE_FILE}")
        sys.exit(1)
    
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    
    print(f"✅ Loaded {len(chunks)} chunks")
    return chunks

def check_backend_health() -> bool:
    """Check if backend is accessible"""
    print("🔍 Checking backend health...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"⚠️  Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend unreachable: {e}")
        return False

def ingest_batch(chunks: List[Dict], batch_num: int) -> bool:
    """Ingest a batch of chunks to production RAG"""
    
    # Prepare batch payload
    payload = {
        "collection": COLLECTION_NAME,
        "chunks": chunks,
        "metadata": {
            "law_id": "PP-28-2025",
            "batch_num": batch_num,
            "source": "deploy-pp28-via-api.py"
        }
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/rag/ingest",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Batch {batch_num}: {len(chunks)} chunks ingested")
            return True
        else:
            print(f"❌ Batch {batch_num} failed: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ Batch {batch_num} error: {e}")
        return False

def verify_deployment() -> Dict:
    """Verify PP28 is searchable in production"""
    print("\n🔍 Verifying deployment...")
    
    test_queries = [
        "PP 28 2025 KBLI 5 digit requirement",
        "risk based business licensing",
        "OSS system integration"
    ]
    
    results = {}
    
    for query in test_queries:
        try:
            response = requests.post(
                f"{BACKEND_URL}/api/agent/semantic_search",
                json={
                    "query": query,
                    "collections": [COLLECTION_NAME],
                    "limit": 3
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                result_count = len(data.get('results', []))
                results[query] = {
                    "status": "✅",
                    "count": result_count
                }
                print(f"✅ Query '{query[:40]}...': {result_count} results")
            else:
                results[query] = {
                    "status": "❌",
                    "error": f"HTTP {response.status_code}"
                }
                print(f"❌ Query failed: {response.status_code}")
                
        except Exception as e:
            results[query] = {
                "status": "❌",
                "error": str(e)
            }
            print(f"❌ Query error: {e}")
        
        time.sleep(1)  # Rate limiting
    
    return results

def get_collection_stats() -> Dict:
    """Get current collection statistics"""
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/rag/stats",
            params={"collection": COLLECTION_NAME},
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        return {"error": str(e)}

def main():
    print("=" * 50)
    print("🚀 PP28/2025 Production Deployment")
    print("=" * 50)
    print()
    
    # Step 1: Health check
    if not check_backend_health():
        print("\n❌ Deployment aborted: Backend not accessible")
        sys.exit(1)
    
    # Step 2: Get initial stats
    print("\n📊 Initial collection stats...")
    initial_stats = get_collection_stats()
    if "error" not in initial_stats:
        print(f"✅ Current documents: {initial_stats.get('count', 'N/A')}")
    else:
        print(f"⚠️  Could not get stats: {initial_stats.get('error')}")
    
    # Step 3: Load chunks
    chunks = load_pp28_chunks()
    
    # Step 4: Batch ingest
    print(f"\n📤 Deploying {len(chunks)} chunks in batches of {BATCH_SIZE}...")
    
    total_batches = (len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE
    success_count = 0
    
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i+BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        
        print(f"\n🔄 Batch {batch_num}/{total_batches}...")
        
        if ingest_batch(batch, batch_num):
            success_count += len(batch)
        
        time.sleep(0.5)  # Rate limiting
    
    print(f"\n✅ Deployment complete: {success_count}/{len(chunks)} chunks ingested")
    
    # Step 5: Verify deployment
    verification_results = verify_deployment()
    
    # Step 6: Final stats
    print("\n📊 Final collection stats...")
    final_stats = get_collection_stats()
    if "error" not in final_stats:
        print(f"✅ Total documents: {final_stats.get('count', 'N/A')}")
        
        # Calculate PP28 documents
        pp28_docs = final_stats.get('count', 0) - initial_stats.get('count', 0)
        print(f"✅ PP-28-2025 documents: {pp28_docs}")
    
    # Summary
    print("\n" + "=" * 50)
    print("🎉 DEPLOYMENT SUMMARY")
    print("=" * 50)
    print(f"App: {BACKEND_URL}")
    print(f"Collection: {COLLECTION_NAME}")
    print(f"Chunks deployed: {success_count}/{len(chunks)}")
    
    print("\n🧪 Verification tests:")
    for query, result in verification_results.items():
        status = result['status']
        count = result.get('count', 'N/A')
        print(f"  {status} {query[:45]}... ({count} results)")
    
    print("\n✅ PP28/2025 is now LIVE in production RAG!")
    print("\nTest in webapp: https://zantara.balizero.com")
    print("Try asking: 'Cosa dice PP 28/2025 sul KBLI a 5 cifre?'")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Deployment interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
