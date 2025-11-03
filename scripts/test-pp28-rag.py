#!/usr/bin/env python3
"""Quick test of PP 28/2025 in ChromaDB RAG"""

import chromadb
from pathlib import Path

CHROMA_PATH = Path(__file__).parent.parent / "data" / "chromadb"

def test_queries():
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    collection = client.get_collection(name="legal_intelligence")
    
    print("=" * 70)
    print("PP 28/2025 RAG - Quick Test")
    print("=" * 70)
    
    # Test 1: KBLI requirement
    print("\n🔍 Query 1: KBLI 5 digit requirement")
    results = collection.query(
        query_texts=["KBLI 5 digit OSS requirement business license"],
        n_results=3,
        where={"law_id": "PP-28-2025"}
    )
    print(f"   Found: {len(results['ids'][0])} results")
    if results['documents'][0]:
        print(f"   Top: Pasal {results['metadatas'][0][0]['pasal']}")
        print(f"   Preview: {results['documents'][0][0][:150]}...")
    
    # Test 2: Business licensing
    print("\n🔍 Query 2: Risk-based business licensing")
    results = collection.query(
        query_texts=["risk based business licensing classification Indonesia"],
        n_results=3,
        where={"law_id": "PP-28-2025"}
    )
    print(f"   Found: {len(results['ids'][0])} results")
    if results['documents'][0]:
        print(f"   Top: Pasal {results['metadatas'][0][0]['pasal']}")
    
    # Test 3: Total count
    print("\n📊 Collection Stats:")
    all_pp28 = collection.get(where={"law_id": "PP-28-2025"}, limit=10000)
    print(f"   Total PP 28/2025 documents: {len(all_pp28['ids'])}")
    
    # Test 4: Has KBLI flag
    with_kbli = collection.get(
        where={"$and": [
            {"law_id": "PP-28-2025"},
            {"has_kbli": "True"}
        ]},
        limit=10000
    )
    print(f"   Documents with KBLI flag: {len(with_kbli['ids'])}")
    
    print("\n✅ RAG Test Complete - ZANTARA ready!")
    print("=" * 70)

if __name__ == "__main__":
    test_queries()
