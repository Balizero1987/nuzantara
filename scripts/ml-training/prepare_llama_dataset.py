#!/usr/bin/env python3
"""
ZANTARA Dataset Preparation for LLAMA 3.1 8B Fine-tuning

Exports chat history from PostgreSQL and formats for instruction-tuning.
"""

import json
import os
from datetime import datetime
from typing import List, Dict
import random

# Configuration
MIN_RESPONSE_LENGTH = 20
MAX_RESPONSE_LENGTH = 500
MIN_QUALITY_SCORE = 4  # If you have ratings
TARGET_SIZE = 1000

def load_from_postgresql():
    """
    Load chat history from PostgreSQL

    TODO: Replace with actual database connection
    """
    # Example query structure
    # conversations = db.query("""
    #     SELECT
    #         user_message,
    #         ai_response,
    #         ai_model_used,
    #         language,
    #         user_rating
    #     FROM chat_history
    #     WHERE ai_model_used = 'haiku'
    #     AND timestamp > '2024-01-01'
    #     ORDER BY timestamp DESC
    #     LIMIT 2000
    # """)

    # For now, return mock data structure
    print("⚠️  Mock data - replace with actual DB query")
    return [
        {
            "user_message": "Ciao",
            "ai_response": "Ciao! Come posso aiutarti oggi con Bali Zero? 😊",
            "language": "it",
            "rating": 5
        },
        {
            "user_message": "What is KITAS?",
            "ai_response": "KITAS (Kartu Izin Tinggal Terbatas) is an Indonesian limited stay permit card for foreigners.",
            "language": "en",
            "rating": 5
        },
        # Add more examples...
    ]


def filter_quality(conversation: Dict) -> bool:
    """Filter out low-quality examples"""
    response = conversation['ai_response']

    # Length checks
    if len(response) < MIN_RESPONSE_LENGTH:
        return False

    if len(response) > MAX_RESPONSE_LENGTH:
        return False

    # Quality check (if ratings available)
    if 'rating' in conversation and conversation['rating'] < MIN_QUALITY_SCORE:
        return False

    # Repetitive greetings (old Haiku problem)
    if response.count('Ciao') > 2:
        return False

    # Contact info in casual greetings (should be conditional)
    user_msg = conversation['user_message'].lower()
    if 'whatsapp' in response.lower() and user_msg in ['ciao', 'hello', 'hi']:
        return False

    return True


def format_for_training(conversation: Dict) -> Dict:
    """Convert to instruction-tuning format"""
    return {
        "messages": [
            {
                "role": "system",
                "content": "You are ZANTARA, expert Indonesian business assistant for Bali Zero. Professional, knowledgeable, warm."
            },
            {
                "role": "user",
                "content": conversation['user_message']
            },
            {
                "role": "assistant",
                "content": conversation['ai_response']
            }
        ],
        "metadata": {
            "language": conversation.get('language', 'unknown'),
            "rating": conversation.get('rating', 0)
        }
    }


def augment_dataset(conversations: List[Dict]) -> List[Dict]:
    """Create variations for robustness"""
    augmented = []

    for conv in conversations:
        # Original
        augmented.append(conv)

        user_msg = conv['messages'][1]['content']

        # Case variations
        if 'kitas' in user_msg.lower():
            case_var = conv.copy()
            case_var['messages'][1]['content'] = user_msg.replace('kitas', 'KITAS').replace('Kitas', 'KITAS')
            augmented.append(case_var)

        # Formal/informal variations
        if user_msg.lower() == 'ciao':
            formal = conv.copy()
            formal['messages'][1]['content'] = 'Salve'
            augmented.append(formal)

    return augmented


def split_dataset(data: List[Dict], train_ratio=0.8, val_ratio=0.1):
    """Split into train/val/test"""
    random.shuffle(data)

    total = len(data)
    train_idx = int(total * train_ratio)
    val_idx = int(total * (train_ratio + val_ratio))

    return {
        'train': data[:train_idx],
        'val': data[train_idx:val_idx],
        'test': data[val_idx:]
    }


def save_dataset(data: Dict[str, List], output_dir: str):
    """Save as JSONL files"""
    os.makedirs(output_dir, exist_ok=True)

    for split_name, split_data in data.items():
        filepath = os.path.join(output_dir, f'{split_name}.jsonl')

        with open(filepath, 'w', encoding='utf-8') as f:
            for item in split_data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')

        print(f"✅ {split_name}: {len(split_data)} examples → {filepath}")


def main():
    print("🚀 ZANTARA Dataset Preparation for LLAMA Fine-tuning\n")

    # Step 1: Load conversations
    print("📥 Loading conversations from database...")
    raw_conversations = load_from_postgresql()
    print(f"   Loaded: {len(raw_conversations)} conversations")

    # Step 2: Filter quality
    print("\n🔍 Filtering for quality...")
    filtered = [c for c in raw_conversations if filter_quality(c)]
    print(f"   Quality examples: {len(filtered)}/{len(raw_conversations)} ({len(filtered)/len(raw_conversations)*100:.1f}%)")

    # Step 3: Format for training
    print("\n🔄 Formatting for instruction-tuning...")
    formatted = [format_for_training(c) for c in filtered]
    print(f"   Formatted: {len(formatted)} examples")

    # Step 4: Augment (optional)
    print("\n📈 Augmenting dataset...")
    augmented = augment_dataset(formatted)
    print(f"   Augmented: {len(formatted)} → {len(augmented)} (+{len(augmented)-len(formatted)} variations)")

    # Step 5: Split
    print("\n✂️  Splitting train/val/test...")
    splits = split_dataset(augmented)
    print(f"   Train: {len(splits['train'])}")
    print(f"   Val: {len(splits['val'])}")
    print(f"   Test: {len(splits['test'])}")

    # Step 6: Save
    print("\n💾 Saving dataset...")
    output_dir = './data/llama_ft_dataset'
    save_dataset(splits, output_dir)

    # Summary
    print("\n" + "="*50)
    print("✅ DATASET PREPARATION COMPLETE")
    print("="*50)
    print(f"\n📊 Summary:")
    print(f"   Total examples: {len(augmented)}")
    print(f"   Train: {len(splits['train'])} (80%)")
    print(f"   Val: {len(splits['val'])} (10%)")
    print(f"   Test: {len(splits['test'])} (10%)")
    print(f"\n📁 Output: {output_dir}")
    print(f"\n🎯 Next step: Fine-tune LLAMA 3.1 8B with this dataset")
    print(f"   → Use Unsloth/Axolotl for efficient training")
    print(f"   → GPU: RTX 4090 / A100 (Runpod/Lambda)")
    print(f"   → Training time: ~2-4 hours\n")


if __name__ == '__main__':
    main()
