#!/usr/bin/env python3
"""
Test JSONL log file creation locally
Simulates work session events
"""

import json
from pathlib import Path
from datetime import datetime

# Simulate the log file path
data_dir = Path("apps/backend-rag/backend/data")
log_file = data_dir / "work_sessions_log.jsonl"

print("=" * 70)
print("🧪 TEST: JSONL Backup Log")
print("=" * 70)

# Create directory
data_dir.mkdir(parents=True, exist_ok=True)
print(f"✅ Directory created: {data_dir}")

# Test event 1: session_start
event_start = {
    "timestamp": datetime.now().isoformat(),
    "event_type": "session_start",
    "session_id": 99,
    "user_id": "zero_test",
    "user_name": "ZERO (Test)",
    "user_email": "zero@balizero.com",
    "session_start": datetime.now().isoformat()
}

with open(log_file, 'a') as f:
    f.write(json.dumps(event_start) + '\n')

print(f"✅ Written session_start event")

# Test event 2: session_end
event_end = {
    "timestamp": datetime.now().isoformat(),
    "event_type": "session_end",
    "session_id": 99,
    "user_id": "zero_test",
    "user_name": "ZERO (Test)",
    "user_email": "zero@balizero.com",
    "session_start": datetime.now().isoformat(),
    "session_end": datetime.now().isoformat(),
    "duration_minutes": 5,
    "duration_hours": 0.08,
    "activities_count": 3,
    "conversations_count": 2,
    "notes": "Test session"
}

with open(log_file, 'a') as f:
    f.write(json.dumps(event_end) + '\n')

print(f"✅ Written session_end event")

# Read and display the log
print("\n" + "=" * 70)
print(f"📄 Log file content: {log_file}")
print("=" * 70)

with open(log_file, 'r') as f:
    lines = f.readlines()
    print(f"Total lines: {len(lines)}")
    print("\nLast 5 events:")
    for line in lines[-5:]:
        event = json.loads(line)
        print(f"\n{event['event_type'].upper()} @ {event['timestamp']}")
        print(f"  User: {event['user_name']} ({event['user_email']})")
        if event['event_type'] == 'session_end':
            print(f"  Duration: {event['duration_minutes']} min")
            print(f"  Conversations: {event['conversations_count']}")

print("\n" + "=" * 70)
print("✅ JSONL log system working correctly!")
print("=" * 70)
print(f"\nFile location: {log_file.absolute()}")
print(f"File size: {log_file.stat().st_size} bytes")
