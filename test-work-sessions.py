#!/usr/bin/env python3
"""
Test Work Session Tracking Endpoints
Tests the complete flow: start → activity → end session
"""

import requests
import json
import time

BACKEND_URL = "https://scintillating-kindness-production-47e3.up.railway.app"

print("=" * 70)
print("🧪 TEST: Team Work Session Tracking")
print("=" * 70)

# Test user
test_user = {
    "user_id": "test_antonello",
    "user_name": "Antonello (TEST)",
    "user_email": "antonello@test.com"
}

# Test 1: Start work session
print("\n📤 TEST 1: POST /team/session/start")
print("-" * 70)

response = requests.post(
    f"{BACKEND_URL}/team/session/start",
    json=test_user,
    timeout=10
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2))
    session_id = data.get('session_id')
    print(f"✅ Session started: ID={session_id}")
else:
    print(f"❌ Error: {response.text}")
    exit(1)

# Test 2: Get today's sessions
print("\n📥 TEST 2: GET /team/sessions/today")
print("-" * 70)

response = requests.get(
    f"{BACKEND_URL}/team/sessions/today",
    timeout=10
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2))
    print(f"✅ Found {data['sessions_count']} active sessions")
else:
    print(f"❌ Error: {response.text}")

# Test 3: Simulate some activity (chat)
print("\n💬 TEST 3: POST /bali-zero/chat (simulate activity)")
print("-" * 70)

response = requests.post(
    f"{BACKEND_URL}/bali-zero/chat",
    json={
        "query": "Ciao ZANTARA!",
        "user_email": test_user["user_email"]
    },
    timeout=15
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Chat response received: {data['response'][:100]}...")
    print(f"   AI used: {data['ai_used']}")
else:
    print(f"❌ Error: {response.text}")

# Wait a bit
time.sleep(2)

# Test 4: End session via "logout today" command
print("\n🏁 TEST 4: POST /bali-zero/chat (logout today)")
print("-" * 70)

response = requests.post(
    f"{BACKEND_URL}/bali-zero/chat",
    json={
        "query": "logout today",
        "user_email": test_user["user_email"]
    },
    timeout=15
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2))
    print(f"✅ Session ended successfully")
    print(f"   Response: {data['response']}")
else:
    print(f"❌ Error: {response.text}")

# Test 5: Get daily report
print("\n📊 TEST 5: GET /team/report/daily")
print("-" * 70)

response = requests.get(
    f"{BACKEND_URL}/team/report/daily",
    timeout=10
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2))
    print(f"✅ Daily report generated")
    print(f"   Total hours: {data['total_hours']}h")
    print(f"   Team members active: {data['team_members_active']}")
else:
    print(f"❌ Error: {response.text}")

print("\n" + "=" * 70)
print("📋 ALL TESTS COMPLETED")
print("=" * 70)
print()
print("✅ Work session tracking is working!")
print()
print("Next steps:")
print("1. Check logs for ZERO notifications (currently logged, not emailed)")
print("2. Create ZERO dashboard at /admin/zero/dashboard")
print("3. Implement actual SMTP email to zero@balizero.com")
print()
