#!/usr/bin/env python3
"""
Test "logout today" command with ZERO
Uses zero@balizero.com which should be in collaborators DB
"""

import requests
import json
import time

BACKEND_URL = "https://scintillating-kindness-production-47e3.up.railway.app"

print("=" * 70)
print("🧪 TEST: Logout Today with ZERO")
print("=" * 70)

# Test with ZERO's email (should be in collaborators DB)
zero_email = "zero@balizero.com"

# Test 1: First chat (should auto-start session)
print("\n💬 TEST 1: POST /bali-zero/chat (first activity - auto-start)")
print("-" * 70)

response = requests.post(
    f"{BACKEND_URL}/bali-zero/chat",
    json={
        "query": "Ciao ZANTARA, sono ZERO",
        "user_email": zero_email
    },
    timeout=15
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Response: {data['response'][:100]}...")
    print(f"   AI used: {data['ai_used']}")
else:
    print(f"❌ Error: {response.text}")
    exit(1)

# Wait a bit for session to be created
time.sleep(2)

# Test 2: Check today's sessions
print("\n📥 TEST 2: GET /team/sessions/today")
print("-" * 70)

response = requests.get(
    f"{BACKEND_URL}/team/sessions/today",
    timeout=10
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Active sessions: {data['sessions_count']}")
    for session in data['sessions']:
        if 'zero' in session['user_email'].lower():
            print(f"   ZERO session found:")
            print(f"   - User: {session['user_name']}")
            print(f"   - Started: {session['session_start']}")
            print(f"   - Status: {session['status']}")
else:
    print(f"❌ Error: {response.text}")

# Wait a bit to simulate some work
time.sleep(3)

# Test 3: Logout today command
print("\n🏁 TEST 3: POST /bali-zero/chat (logout today)")
print("-" * 70)

response = requests.post(
    f"{BACKEND_URL}/bali-zero/chat",
    json={
        "query": "logout today",
        "user_email": zero_email
    },
    timeout=15
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2))

    # Check if it's a logout response
    if data['ai_used'] == 'system' and data['model_used'] == 'logout-command':
        print("\n✅ LOGOUT COMMAND WORKED!")
        print(f"   Response: {data['response']}")
    else:
        print("\n⚠️ Response from AI, not logout command")
        print(f"   AI used: {data['ai_used']}")
        print(f"   Response: {data['response'][:200]}...")
else:
    print(f"❌ Error: {response.text}")

# Test 4: Verify session is closed
print("\n📊 TEST 4: GET /team/sessions/today (verify closed)")
print("-" * 70)

response = requests.get(
    f"{BACKEND_URL}/team/sessions/today",
    timeout=10
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Sessions count: {data['sessions_count']}")
    for session in data['sessions']:
        if 'zero' in session['user_email'].lower():
            print(f"\nZERO session:")
            print(f"   Status: {session['status']}")
            print(f"   Duration: {session['duration_minutes']} minutes")
            print(f"   Conversations: {session['conversations_count']}")
            if session['status'] == 'completed':
                print("   ✅ Session closed successfully!")
            else:
                print("   ⚠️ Session still active")
else:
    print(f"❌ Error: {response.text}")

print("\n" + "=" * 70)
print("📋 TEST COMPLETED")
print("=" * 70)
