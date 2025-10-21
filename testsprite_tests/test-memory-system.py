#!/usr/bin/env python3
"""
Test ZANTARA Memory System
Tests both PostgreSQL persistence and vector memory
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "https://scintillating-kindness-production-47e3.up.railway.app"

def test_memory_stats():
    """Test memory system statistics"""
    print("="*70)
    print("🧪 TEST 1: Memory System Stats")
    print("="*70)

    response = requests.get(f"{BACKEND_URL}/api/memory/stats", timeout=10)
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        return data
    else:
        print(f"❌ Error: {response.text}")
        return None

def test_memory_health():
    """Test memory health endpoint"""
    print("\n" + "="*70)
    print("🧪 TEST 2: Memory Health Check")
    print("="*70)

    response = requests.get(f"{BACKEND_URL}/api/memory/health", timeout=10)
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        return data
    else:
        print(f"❌ Error: {response.text}")
        return None

def test_embedding_generation():
    """Test embedding generation"""
    print("\n" + "="*70)
    print("🧪 TEST 3: Generate Embedding")
    print("="*70)

    response = requests.post(
        f"{BACKEND_URL}/api/memory/embed",
        json={
            "text": "I love working with Indonesian visas and KITAS",
            "model": "sentence-transformers"
        },
        timeout=10
    )

    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Embedding generated")
        print(f"   Dimensions: {data['dimensions']}")
        print(f"   Model: {data['model']}")
        print(f"   Sample values: {data['embedding'][:5]}...")
        return data['embedding']
    else:
        print(f"❌ Error: {response.text}")
        return None

def test_store_memory(embedding):
    """Test storing a memory"""
    print("\n" + "="*70)
    print("🧪 TEST 4: Store Memory")
    print("="*70)

    if not embedding:
        print("⚠️  Skipped (no embedding)")
        return None

    memory_id = f"test_memory_{int(datetime.now().timestamp())}"

    response = requests.post(
        f"{BACKEND_URL}/api/memory/store",
        json={
            "id": memory_id,
            "document": "User loves working with Indonesian visas and KITAS applications",
            "embedding": embedding,
            "metadata": {
                "userId": "test_user_123",
                "type": "expertise",
                "timestamp": datetime.now().isoformat(),
                "entities": "visa,kitas,indonesia"
            }
        },
        timeout=10
    )

    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        return memory_id
    else:
        print(f"❌ Error: {response.text}")
        return None

def test_search_memory(query_embedding):
    """Test semantic memory search"""
    print("\n" + "="*70)
    print("🧪 TEST 5: Search Memories")
    print("="*70)

    if not query_embedding:
        print("⚠️  Skipped (no embedding)")
        return

    response = requests.post(
        f"{BACKEND_URL}/api/memory/search",
        json={
            "query_embedding": query_embedding,
            "limit": 5,
            "metadata_filter": {
                "userId": "test_user_123"
            }
        },
        timeout=10
    )

    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {data['total_found']} memories in {data['execution_time_ms']}ms")

        for i, result in enumerate(data['results'][:3], 1):
            print(f"\n   [{i}] Distance: {result['distance']:.4f}")
            print(f"       Document: {result['document'][:100]}...")
            print(f"       Metadata: {result['metadata']}")
    else:
        print(f"❌ Error: {response.text}")

def test_chat_with_memory():
    """Test chat endpoint with memory"""
    print("\n" + "="*70)
    print("🧪 TEST 6: Chat with Memory Context")
    print("="*70)

    response = requests.post(
        f"{BACKEND_URL}/bali-zero/chat",
        json={
            "query": "Ciao! Sono Antonello",
            "conversation_history": []
        },
        timeout=60
    )

    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ AI Response:")
        print(f"   {data['response']}")
        print(f"\n   AI Used: {data['ai_used']}")
        print(f"   Model: {data['model_used']}")
    else:
        print(f"❌ Error: {response.text}")

def main():
    """Run all memory system tests"""
    print("=" * 70)
    print("🧠 ZANTARA MEMORY SYSTEM - LIVE TESTS")
    print("=" * 70)
    print(f"Backend: {BACKEND_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # Test 1: Stats
    stats = test_memory_stats()

    # Test 2: Health
    health = test_memory_health()

    # Test 3: Generate embedding
    embedding = test_embedding_generation()

    # Test 4: Store memory
    memory_id = test_store_memory(embedding)

    # Test 5: Search memories
    test_search_memory(embedding)

    # Test 6: Chat with memory
    test_chat_with_memory()

    # Summary
    print("\n" + "=" * 70)
    print("📋 TEST SUMMARY")
    print("=" * 70)

    if stats and health:
        print(f"✅ Memory System: OPERATIONAL")
        print(f"   Total Memories: {stats.get('total_memories', 0)}")
        print(f"   Embedder Model: {health.get('embedder_model', 'unknown')}")
        print(f"   Dimensions: {health.get('dimensions', 0)}")

        if stats.get('total_memories', 0) > 0:
            print(f"   Users with memories: {stats.get('users', 0)}")
    else:
        print(f"❌ Memory System: FAILED")

    print("=" * 70)

if __name__ == "__main__":
    main()
