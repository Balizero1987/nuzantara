#!/usr/bin/env python3
"""
Test frontend SDK memory endpoints
Tests /memory/save and /memory/get
"""

import requests
import json

BACKEND_URL = "https://scintillating-kindness-production-47e3.up.railway.app"

print("=" * 70)
print("🧪 TEST: Frontend SDK Memory Endpoints")
print("=" * 70)

# Test 1: Save memory
print("\n📤 TEST 1: POST /memory/save")
print("-" * 70)

save_data = {
    "userId": "test_antonello",
    "profile_facts": ["Software engineer", "Lives in Italy", "Loves Indonesian culture"],
    "summary": "Regular ZANTARA user testing memory system"
}

response = requests.post(
    f"{BACKEND_URL}/memory/save",
    json=save_data,
    timeout=10
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2))
    print(f"✅ Memory saved: {data['facts_saved']} facts")
else:
    print(f"❌ Error: {response.text}")

# Test 2: Retrieve memory
print("\n📥 TEST 2: GET /memory/get")
print("-" * 70)

response = requests.get(
    f"{BACKEND_URL}/memory/get",
    params={"userId": "test_antonello"},
    timeout=10
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2))
    print(f"\n✅ Memory retrieved:")
    print(f"   Facts: {len(data['profile_facts'])}")
    print(f"   Summary: {data['summary'][:50]}...")
else:
    print(f"❌ Error: {response.text}")

print("\n" + "=" * 70)
print("📋 TEST COMPLETE")
print("=" * 70)
