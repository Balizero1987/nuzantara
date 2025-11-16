#!/usr/bin/env python3
"""Validate and display sample from Jakarta Authentic dataset"""

import json

# Load dataset
with open('claude12_jakarta_authentic.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Display sample conversation
conv = data['conversations'][0]
print('SAMPLE CONVERSATION:')
print('=' * 60)
print(f'ID: {conv["conversation_id"]}')
print(f'Style: {conv["style"]}')
print(f'Topic: {conv["topic"]}')
print(f'\nMessages ({len(conv["messages"])} total):')
print('-' * 60)

for i, msg in enumerate(conv['messages'][:5]):
    print(f'{i+1}. [{msg["speaker"]}] {msg["message"]}')
    print(f'   Metadata: {msg["metadata"]}')
    print()

if len(conv['messages']) > 5:
    print(f'... and {len(conv["messages"]) - 5} more messages\n')

print(f'Quality Metrics: {conv["quality_metrics"]}')
print()

# Show another sample from different style
print('\n' + '=' * 60)
print('SECOND SAMPLE (Different Style):')
print('=' * 60)
conv2 = data['conversations'][900]  # Local wisdom conversation
print(f'ID: {conv2["conversation_id"]}')
print(f'Style: {conv2["style"]}')
print(f'Topic: {conv2["topic"]}')
print(f'\nFirst 3 messages:')
print('-' * 60)

for i, msg in enumerate(conv2['messages'][:3]):
    print(f'{i+1}. [{msg["speaker"]}] {msg["message"]}')
    print()

print(f'Quality Metrics: {conv2["quality_metrics"]}')
