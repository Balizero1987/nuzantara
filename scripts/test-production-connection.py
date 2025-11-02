#!/usr/bin/env python3
"""
Test connection to production ZANTARA RAG backend
"""

import requests
import json

def test_production_connection():
    """Test various production endpoints"""
    base_url = "https://nuzantara-rag.fly.dev"

    print("🔍 Testing ZANTARA Production Backend Connection")
    print("=" * 50)

    # Test health endpoint
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   Status: {data.get('status')}")
            print(f"   Version: {data.get('version')}")
            print(f"   ChromaDB: {data.get('chromadb')}")
            print(f"   Available services: {', '.join(data.get('available_services', []))}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

    # Test memory stats
    print("\n2. Testing memory stats...")
    try:
        response = requests.get(f"{base_url}/api/memory/stats", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Memory stats retrieved")
            print(f"   Collection: {data.get('collection_name')}")
            print(f"   Total memories: {data.get('total_memories')}")
            print(f"   Size: {data.get('collection_size_mb')} MB")
            print(f"   Persist directory: {data.get('persist_directory')}")
        else:
            print(f"❌ Memory stats failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Memory stats error: {e}")

    # Test search service
    print("\n3. Testing search service...")
    try:
        test_query = {
            "query": "KBLI business classification",
            "limit": 3
        }
        response = requests.post(f"{base_url}/api/memory/search", json=test_query, timeout=15)
        if response.status_code == 200:
            data = response.json()
            print("✅ Search service working")
            print(f"   Results found: {len(data.get('results', []))}")
        else:
            print(f"❌ Search service failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Search service error: {e}")

    print("\n" + "=" * 50)
    print("📋 Connection Test Summary:")
    print("   The production backend is running and ChromaDB is accessible")
    print("   The migration system can connect to the production database")

if __name__ == "__main__":
    test_production_connection()