#!/usr/bin/env python3
"""
ZANTARA Dataset Extractor - Real PostgreSQL Data
Extracts production chat history for LLAMA 3.1 8B fine-tuning

Usage:
    python extract_dataset_from_postgres.py --output ./data/llama_ft_dataset --min-quality 4
"""

import asyncio
import asyncpg
import json
import os
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from collections import Counter

# Configuration
MIN_RESPONSE_LENGTH = 20
MAX_RESPONSE_LENGTH = 2000
MIN_QUALITY_SCORE = 4
TARGET_SIZE = 1000


class ConversationExtractor:
    """Extract and analyze conversations from PostgreSQL"""

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.conn = None

    async def connect(self):
        """Connect to PostgreSQL"""
        self.conn = await asyncpg.connect(self.database_url)
        print("✅ Connected to PostgreSQL")

    async def close(self):
        """Close connection"""
        if self.conn:
            await self.conn.close()
            print("👋 PostgreSQL connection closed")

    async def get_conversation_count(self, days_back: int = 30) -> int:
        """Get total conversation count in date range"""
        query = """
            SELECT COUNT(*)
            FROM conversations
            WHERE timestamp > NOW() - INTERVAL '%s days'
        """ % days_back

        count = await self.conn.fetchval(query)
        return count

    async def get_ai_usage_stats(self, days_back: int = 30) -> Dict:
        """Get AI model usage statistics"""
        query = """
            SELECT
                ai_model_used,
                COUNT(*) as count,
                AVG(CAST(metadata->>'tokens_output' AS INTEGER)) as avg_tokens
            FROM conversations
            WHERE timestamp > NOW() - INTERVAL '%s days'
                AND ai_model_used IS NOT NULL
            GROUP BY ai_model_used
            ORDER BY count DESC
        """ % days_back

        rows = await self.conn.fetch(query)
        return {row['ai_model_used']: {'count': row['count'], 'avg_tokens': row['avg_tokens']} for row in rows}

    async def extract_conversations(
        self,
        days_back: int = 30,
        limit: int = 5000,
        min_quality: int = 4,
        include_models: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Extract conversations from PostgreSQL

        Args:
            days_back: How many days back to look
            limit: Max conversations to extract
            min_quality: Minimum quality score (if available)
            include_models: List of AI models to include (None = all)

        Returns:
            List of conversation dicts
        """
        print(f"\n📥 Extracting conversations (last {days_back} days, limit {limit})...")

        # Build query
        query = """
            SELECT
                user_id,
                messages,
                ai_model_used,
                metadata,
                timestamp
            FROM conversations
            WHERE timestamp > NOW() - INTERVAL '%s days'
                AND messages IS NOT NULL
                AND jsonb_array_length(messages) >= 2
        """ % days_back

        # Filter by AI model if specified
        if include_models:
            models_str = "', '".join(include_models)
            query += f" AND ai_model_used IN ('{models_str}')"

        query += " ORDER BY timestamp DESC LIMIT %s" % limit

        rows = await self.conn.fetch(query)
        print(f"   Found: {len(rows)} conversations")

        # Parse conversations
        conversations = []
        for row in rows:
            try:
                # Extract user message and AI response from messages array
                messages = row['messages']

                # Find last user message and last assistant response
                user_message = None
                ai_response = None

                for msg in reversed(messages):
                    if msg.get('role') == 'assistant' and not ai_response:
                        ai_response = msg.get('content', '')
                    elif msg.get('role') == 'user' and not user_message:
                        user_message = msg.get('content', '')

                    if user_message and ai_response:
                        break

                if not user_message or not ai_response:
                    continue

                # Extract metadata
                metadata = row['metadata'] or {}

                # Detect language (simple heuristic)
                language = self._detect_language(user_message)

                conversations.append({
                    'user_message': user_message,
                    'ai_response': ai_response,
                    'ai_model': row['ai_model_used'],
                    'language': language,
                    'timestamp': row['timestamp'].isoformat(),
                    'user_id': row['user_id'],
                    'tokens_used': metadata.get('tokens_output', 0)
                })

            except Exception as e:
                print(f"   ⚠️ Skipped malformed conversation: {e}")
                continue

        print(f"   Parsed: {len(conversations)} valid conversations")
        return conversations

    def _detect_language(self, text: str) -> str:
        """Detect language from text (simple heuristic)"""
        text_lower = text.lower()

        # Italian indicators
        italian_words = ['ciao', 'come', 'cosa', 'sono', 'hai', 'per', 'che', 'posso', 'grazie']
        if any(word in text_lower for word in italian_words):
            return 'it'

        # Indonesian indicators
        indonesian_words = ['apa', 'bagaimana', 'saya', 'anda', 'bisa', 'terima', 'kasih']
        if any(word in text_lower for word in indonesian_words):
            return 'id'

        # Default to English
        return 'en'

    def filter_quality(self, conversations: List[Dict]) -> List[Dict]:
        """Filter conversations by quality criteria"""
        print(f"\n🔍 Filtering for quality...")

        filtered = []

        rejection_reasons = Counter()

        for conv in conversations:
            response = conv['ai_response']
            user_msg = conv['user_message']

            # Length checks
            if len(response) < MIN_RESPONSE_LENGTH:
                rejection_reasons['too_short'] += 1
                continue

            if len(response) > MAX_RESPONSE_LENGTH:
                rejection_reasons['too_long'] += 1
                continue

            # No empty user messages
            if len(user_msg.strip()) < 3:
                rejection_reasons['empty_user_msg'] += 1
                continue

            # Repetitive greetings (old Haiku problem)
            if response.count('Ciao') > 2:
                rejection_reasons['repetitive_ciao'] += 1
                continue

            # Contact info in casual greetings (should be conditional)
            user_msg_lower = user_msg.lower().strip()
            if 'whatsapp' in response.lower() and user_msg_lower in ['ciao', 'hello', 'hi', 'hey']:
                rejection_reasons['contact_in_greeting'] += 1
                continue

            # No error messages or API errors
            if any(err in response.lower() for err in ['error', 'failed', 'sorry, i', 'mi dispiace, ho']):
                rejection_reasons['error_response'] += 1
                continue

            # Passed all filters
            filtered.append(conv)

        print(f"   Kept: {len(filtered)}/{len(conversations)} ({len(filtered)/len(conversations)*100:.1f}%)")
        print(f"\n   Rejection breakdown:")
        for reason, count in rejection_reasons.most_common():
            print(f"   - {reason}: {count}")

        return filtered

    def analyze_dataset(self, conversations: List[Dict]):
        """Print dataset statistics"""
        print(f"\n📊 Dataset Analysis:")
        print(f"   Total conversations: {len(conversations)}")

        # Language distribution
        lang_dist = Counter(c['language'] for c in conversations)
        print(f"\n   Languages:")
        for lang, count in lang_dist.most_common():
            print(f"   - {lang}: {count} ({count/len(conversations)*100:.1f}%)")

        # AI model distribution
        model_dist = Counter(c['ai_model'] for c in conversations)
        print(f"\n   AI Models:")
        for model, count in model_dist.most_common():
            print(f"   - {model}: {count} ({count/len(conversations)*100:.1f}%)")

        # Response length distribution
        lengths = [len(c['ai_response']) for c in conversations]
        print(f"\n   Response lengths:")
        print(f"   - Min: {min(lengths)} chars")
        print(f"   - Max: {max(lengths)} chars")
        print(f"   - Avg: {sum(lengths)/len(lengths):.0f} chars")

        # Sample conversations
        print(f"\n   Sample conversations (first 3):")
        for i, conv in enumerate(conversations[:3], 1):
            print(f"\n   [{i}] User ({conv['language']}): {conv['user_message'][:100]}...")
            print(f"       AI ({conv['ai_model']}): {conv['ai_response'][:100]}...")


async def main():
    parser = argparse.ArgumentParser(description='Extract ZANTARA dataset from PostgreSQL')
    parser.add_argument('--output', default='./data/llama_ft_dataset', help='Output directory')
    parser.add_argument('--days', type=int, default=30, help='Days back to extract')
    parser.add_argument('--limit', type=int, default=5000, help='Max conversations')
    parser.add_argument('--min-quality', type=int, default=4, help='Min quality score')
    parser.add_argument('--models', nargs='+', help='AI models to include (haiku, sonnet, etc.)')
    parser.add_argument('--stats-only', action='store_true', help='Only show stats, do not export')

    args = parser.parse_args()

    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set!")
        print("   Set it with: export DATABASE_URL='postgresql://...'")
        return

    print("🚀 ZANTARA Dataset Extractor - Production Data\n")
    print(f"📍 Configuration:")
    print(f"   Days back: {args.days}")
    print(f"   Max limit: {args.limit}")
    print(f"   Min quality: {args.min_quality}")
    print(f"   AI models: {args.models or 'all'}")
    print(f"   Output: {args.output}")

    # Initialize extractor
    extractor = ConversationExtractor(database_url)
    await extractor.connect()

    try:
        # Get statistics
        total_count = await extractor.get_conversation_count(args.days)
        print(f"\n📈 Database Stats (last {args.days} days):")
        print(f"   Total conversations: {total_count}")

        ai_stats = await extractor.get_ai_usage_stats(args.days)
        print(f"\n   AI Model Usage:")
        for model, stats in ai_stats.items():
            print(f"   - {model}: {stats['count']} convs (avg {stats['avg_tokens']:.0f} tokens)")

        if args.stats_only:
            print("\n✅ Stats-only mode - exiting without export")
            return

        # Extract conversations
        conversations = await extractor.extract_conversations(
            days_back=args.days,
            limit=args.limit,
            min_quality=args.min_quality,
            include_models=args.models
        )

        if not conversations:
            print("\n❌ No conversations found! Check your filters.")
            return

        # Filter quality
        filtered = extractor.filter_quality(conversations)

        if not filtered:
            print("\n❌ No conversations passed quality filters!")
            return

        # Analyze dataset
        extractor.analyze_dataset(filtered)

        # Export to JSONL (raw format, ready for prepare_llama_dataset.py)
        os.makedirs(args.output, exist_ok=True)
        output_file = os.path.join(args.output, 'raw_conversations.jsonl')

        print(f"\n💾 Exporting to {output_file}...")
        with open(output_file, 'w', encoding='utf-8') as f:
            for conv in filtered:
                f.write(json.dumps(conv, ensure_ascii=False) + '\n')

        print(f"✅ Exported {len(filtered)} conversations")

        # Summary
        print("\n" + "="*60)
        print("✅ DATASET EXTRACTION COMPLETE")
        print("="*60)
        print(f"\n📁 Output: {output_file}")
        print(f"📊 Total: {len(filtered)} quality conversations")
        print(f"\n🎯 Next steps:")
        print(f"   1. Review raw_conversations.jsonl")
        print(f"   2. Run prepare_llama_dataset.py to format for training")
        print(f"   3. Fine-tune LLAMA 3.1 8B with Unsloth/Axolotl")
        print(f"   4. Deploy to RunPod and test in shadow mode\n")

    finally:
        await extractor.close()


if __name__ == '__main__':
    asyncio.run(main())
