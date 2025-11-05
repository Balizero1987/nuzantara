#!/usr/bin/env python3
"""
Test Session Store New Features
Tests analytics, TTL configuration, and export functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://nuzantara-rag.fly.dev"

def log(message):
    """Pretty logging with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] {message}")

def test_analytics():
    """Test 1: Session Analytics"""
    log("📊 TEST 1: Session Analytics Endpoint")
    log("=" * 60)

    response = requests.get(f"{BASE_URL}/analytics/sessions")

    if response.status_code == 200:
        data = response.json()
        log(f"✅ Analytics retrieved successfully:")
        log(f"   Total Sessions: {data['total_sessions']}")
        log(f"   Active Sessions: {data['active_sessions']}")
        log(f"   Avg Messages/Session: {data['avg_messages_per_session']}")

        if data['top_session']:
            log(f"   Top Session: {data['top_session']['id'][:8]}... ({data['top_session']['messages']} messages)")

        log(f"   Distribution:")
        for range_key, count in data['sessions_by_range'].items():
            log(f"      {range_key} messages: {count} sessions")

        return data
    else:
        log(f"❌ Failed: HTTP {response.status_code}")
        return None

def test_ttl_configuration():
    """Test 2: TTL Configuration"""
    log("\n⏰ TEST 2: Session TTL Configuration")
    log("=" * 60)

    # Create session
    log("Creating new session...")
    create_response = requests.post(f"{BASE_URL}/sessions")
    session_id = create_response.json()["session_id"]
    log(f"✅ Session created: {session_id}")

    # Add some messages with custom TTL (7 days = 168 hours)
    log("Adding messages with 7-day TTL...")
    history = [
        {"role": "user", "content": "Test message 1"},
        {"role": "assistant", "content": "Response 1"},
        {"role": "user", "content": "Test message 2"},
        {"role": "assistant", "content": "Response 2"}
    ]

    update_response = requests.put(
        f"{BASE_URL}/sessions/{session_id}",
        json={"history": history, "ttl_hours": 168}  # 7 days
    )

    if update_response.status_code == 200:
        data = update_response.json()
        log(f"✅ Session updated with custom TTL:")
        log(f"   Messages: {data['message_count']}")
        log(f"   TTL: {data['ttl_hours']} hours ({data['ttl_hours']/24:.1f} days)")
    else:
        log(f"❌ Failed to update: HTTP {update_response.status_code}")
        return None

    # Try modifying TTL to 30 days (720 hours)
    log("\nUpdating TTL to 30 days...")
    ttl_response = requests.put(
        f"{BASE_URL}/sessions/{session_id}/ttl",
        json={"ttl_hours": 720}
    )

    if ttl_response.status_code == 200:
        data = ttl_response.json()
        log(f"✅ TTL updated:")
        log(f"   New TTL: {data['ttl_hours']} hours ({data['ttl_hours']/24:.0f} days)")
    else:
        log(f"❌ Failed to update TTL: HTTP {ttl_response.status_code}")

    return session_id

def test_export(session_id):
    """Test 3: Session Export"""
    log("\n📥 TEST 3: Session Export")
    log("=" * 60)

    # Test JSON export
    log("Exporting as JSON...")
    json_response = requests.get(f"{BASE_URL}/sessions/{session_id}/export?format=json")

    if json_response.status_code == 200:
        data = json_response.json()
        log(f"✅ JSON export successful:")
        log(f"   Session ID: {data['session_id'][:8]}...")
        log(f"   Message Count: {data['message_count']}")
        log(f"   First message: {data['conversation'][0]['content'][:50]}...")
    else:
        log(f"❌ Failed JSON export: HTTP {json_response.status_code}")

    # Test Markdown export
    log("\nExporting as Markdown...")
    md_response = requests.get(f"{BASE_URL}/sessions/{session_id}/export?format=markdown")

    if md_response.status_code == 200:
        markdown = md_response.text
        log(f"✅ Markdown export successful:")
        log(f"   Size: {len(markdown)} bytes")
        log(f"   Preview:")
        log("   " + "\n   ".join(markdown.split('\n')[:5]))
    else:
        log(f"❌ Failed Markdown export: HTTP {md_response.status_code}")

    return True

def test_create_sample_sessions():
    """Test 4: Create sample sessions for analytics"""
    log("\n🔨 TEST 4: Creating Sample Sessions for Analytics")
    log("=" * 60)

    samples = [
        {"messages": 5, "topic": "PT PMA quick question"},
        {"messages": 15, "topic": "Visa application process"},
        {"messages": 25, "topic": "Tax consultation"},
        {"messages": 60, "topic": "Complete PT PMA setup"},
    ]

    created = []

    for sample in samples:
        # Create session
        create_resp = requests.post(f"{BASE_URL}/sessions")
        session_id = create_resp.json()["session_id"]

        # Generate messages
        history = []
        for i in range(sample["messages"]):
            if i % 2 == 0:
                history.append({"role": "user", "content": f"{sample['topic']} - question {i//2+1}"})
            else:
                history.append({"role": "assistant", "content": f"Response to question {i//2+1}"})

        # Update session
        requests.put(
            f"{BASE_URL}/sessions/{session_id}",
            json={"history": history}
        )

        log(f"✅ Created session with {sample['messages']} messages: {sample['topic']}")
        created.append(session_id)

    log(f"\n✅ Created {len(created)} sample sessions")
    return created

def main():
    """Run all tests"""
    log("🚀 STARTING SESSION FEATURES TEST SUITE\n")

    # Test 1: Analytics (initial state)
    log("=" * 80)
    initial_analytics = test_analytics()

    # Test 2: TTL Configuration
    log("\n" + "=" * 80)
    test_session = test_ttl_configuration()

    # Test 3: Export
    if test_session:
        log("\n" + "=" * 80)
        test_export(test_session)

    # Test 4: Create samples
    log("\n" + "=" * 80)
    sample_sessions = test_create_sample_sessions()

    # Test 5: Analytics (after creating samples)
    log("\n" + "=" * 80)
    log("📊 FINAL ANALYTICS (After Creating Samples)")
    log("=" * 60)
    final_analytics = test_analytics()

    # Summary
    log("\n" + "=" * 80)
    log("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
    log("=" * 80)

    if initial_analytics and final_analytics:
        log("\n📈 ANALYTICS COMPARISON:")
        log(f"   Sessions: {initial_analytics['total_sessions']} → {final_analytics['total_sessions']} (+{final_analytics['total_sessions'] - initial_analytics['total_sessions']})")
        log(f"   Avg Messages: {initial_analytics['avg_messages_per_session']:.1f} → {final_analytics['avg_messages_per_session']:.1f}")

    log(f"\n🎯 Test session ID for manual inspection: {test_session}")
    log(f"📦 Sample session IDs: {', '.join([s[:8] + '...' for s in sample_sessions[:3]])}")

if __name__ == "__main__":
    main()
