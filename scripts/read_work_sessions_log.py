#!/usr/bin/env python3
"""
Read and analyze work sessions log file
Shows how to parse the JSONL backup file
"""

import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# Path to log file (Railway or local)
log_file = Path(__file__).parent.parent / "apps/backend-rag/backend/data/work_sessions_log.jsonl"

if not log_file.exists():
    print(f"❌ Log file not found: {log_file}")
    exit(1)

print("=" * 70)
print("📊 WORK SESSIONS LOG ANALYSIS")
print("=" * 70)
print(f"File: {log_file}")
print()

# Read all events
events = []
with open(log_file, 'r') as f:
    for line in f:
        events.append(json.loads(line.strip()))

print(f"Total events: {len(events)}")
print()

# Count by event type
event_types = defaultdict(int)
for event in events:
    event_types[event['event_type']] += 1

print("Events by type:")
for event_type, count in event_types.items():
    print(f"  {event_type}: {count}")
print()

# Group by user
user_sessions = defaultdict(lambda: {"starts": 0, "ends": 0, "total_hours": 0})
for event in events:
    user = event['user_email']
    if event['event_type'] == 'session_start':
        user_sessions[user]['starts'] += 1
    elif event['event_type'] == 'session_end':
        user_sessions[user]['ends'] += 1
        user_sessions[user]['total_hours'] += event.get('duration_hours', 0)

print("Sessions by user:")
for user, stats in user_sessions.items():
    print(f"\n  {user}:")
    print(f"    Sessions started: {stats['starts']}")
    print(f"    Sessions ended: {stats['ends']}")
    print(f"    Total hours: {stats['total_hours']:.2f}h")

# Show last 5 events
print("\n" + "=" * 70)
print("LAST 5 EVENTS:")
print("=" * 70)

for event in events[-5:]:
    print(f"\n{event['event_type'].upper()} @ {event['timestamp']}")
    print(f"  User: {event['user_name']} ({event['user_email']})")

    if event['event_type'] == 'session_start':
        print(f"  Session ID: {event['session_id']}")
        print(f"  Started: {event['session_start']}")

    elif event['event_type'] == 'session_end':
        print(f"  Session ID: {event['session_id']}")
        print(f"  Duration: {event['duration_minutes']} min ({event['duration_hours']:.2f}h)")
        print(f"  Conversations: {event['conversations_count']}")
        print(f"  Activities: {event['activities_count']}")
        if event.get('notes'):
            print(f"  Notes: {event['notes']}")

print("\n" + "=" * 70)
print("✅ Analysis complete")
print("=" * 70)
print()
print("HOW TO USE THIS FILE:")
print("- grep 'session_end' work_sessions_log.jsonl")
print("- grep 'zero@balizero.com' work_sessions_log.jsonl")
print("- cat work_sessions_log.jsonl | jq '.user_name'")
print("- python3 scripts/read_work_sessions_log.py")
