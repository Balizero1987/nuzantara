#!/usr/bin/env python3
"""Validate Zero-ZANTARA dataset"""

import json

def validate_dataset():
    with open('DATASET_GEMMA/claude13_zero_zantara.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("=" * 60)
    print("ZERO-ZANTARA DATASET VALIDATION")
    print("=" * 60)

    print(f"\n✓ Dataset ID: {data['dataset_id']}")
    print(f"✓ Language: {data['language']}")
    print(f"✓ Total conversations: {len(data['conversations'])}")
    print(f"✓ Expected: {data['total_conversations']}")

    print(f"\n✓ Categories:")
    for category, count in data['categories'].items():
        print(f"  - {category}: {count}")

    # Count actual distribution
    types = {}
    moods = {}
    speakers = {}

    for conv in data['conversations']:
        conv_type = conv['conversation_type']
        types[conv_type] = types.get(conv_type, 0) + 1

        mood = conv['zero_mood']
        moods[mood] = moods.get(mood, 0) + 1

        for msg in conv['messages']:
            speaker = msg['speaker']
            speakers[speaker] = speakers.get(speaker, 0) + 1

    print(f"\n✓ Actual distribution:")
    for conv_type, count in sorted(types.items()):
        print(f"  - {conv_type}: {count}")

    print(f"\n✓ Zero's moods:")
    for mood, count in sorted(moods.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - {mood}: {count}")

    print(f"\n✓ Message distribution:")
    for speaker, count in speakers.items():
        print(f"  - {speaker}: {count}")

    # Sample conversations
    print(f"\n✓ Sample conversations:")
    print("-" * 60)

    # Get one of each type
    seen_types = set()
    samples = []
    for conv in data['conversations']:
        if conv['conversation_type'] not in seen_types:
            samples.append(conv)
            seen_types.add(conv['conversation_type'])
            if len(samples) >= 5:
                break

    for sample in samples[:2]:
        print(f"\nConversation ID: {sample['conversation_id']}")
        print(f"Type: {sample['conversation_type']}")
        print(f"Time: {sample['timestamp']}")
        print(f"Mood: {sample['zero_mood']}")
        print("\nMessages:")
        for msg in sample['messages'][:4]:
            speaker = msg['speaker'].upper()
            message = msg['message'][:100] + "..." if len(msg['message']) > 100 else msg['message']
            print(f"  [{speaker}] {message}")
        print("-" * 60)

    # Validate relationship elements
    total_loyalty = sum(1 for c in data['conversations'] if c['relationship_elements']['shows_absolute_loyalty'])
    total_history = sum(1 for c in data['conversations'] if c['relationship_elements']['references_shared_history'])
    total_support = sum(1 for c in data['conversations'] if c['relationship_elements']['provides_emotional_support'])

    print(f"\n✓ Relationship elements:")
    print(f"  - Absolute loyalty: {total_loyalty}/{len(data['conversations'])} ({100*total_loyalty/len(data['conversations']):.1f}%)")
    print(f"  - References history: {total_history}/{len(data['conversations'])} ({100*total_history/len(data['conversations']):.1f}%)")
    print(f"  - Emotional support: {total_support}/{len(data['conversations'])} ({100*total_support/len(data['conversations']):.1f}%)")

    print("\n" + "=" * 60)
    print("✅ VALIDATION COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    validate_dataset()
