#!/usr/bin/env python3
"""
Clean and deduplicate JSONL chat datasets.

This script applies cleaning and deduplication rules to JSONL files
containing chat conversations in the format:
{
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."},
    ...
  ]
}
"""

import json
import re
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Set
import argparse
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ConversationCleaner:
    """Clean and deduplicate JSONL chat datasets"""

    def __init__(self):
        self.stats = {
            'total_input': 0,
            'invalid_format': 0,
            'single_message': 0,
            'no_assistant': 0,
            'too_short': 0,
            'low_signal': 0,
            'duplicates': 0,
            'total_output': 0
        }
        self.seen_hashes: Set[str] = set()

    def normalize_whitespace(self, text: str) -> str:
        """
        Normalize whitespace in text content.
        - Trim leading/trailing whitespace
        - Collapse multiple spaces into single space
        - Preserve meaningful line breaks
        """
        # Trim leading and trailing whitespace
        text = text.strip()

        # Collapse multiple spaces (but not newlines) into single space
        text = re.sub(r'[ \t]+', ' ', text)

        # Collapse multiple blank lines (3+ newlines) into double newline
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)

        return text

    def validate_message(self, msg: Any) -> bool:
        """Validate a single message object"""
        if not isinstance(msg, dict):
            return False

        if 'role' not in msg or 'content' not in msg:
            return False

        if msg['role'] not in ['user', 'assistant']:
            return False

        if not isinstance(msg['content'], str) or not msg['content'].strip():
            return False

        return True

    def validate_conversation(self, conv: Dict[str, Any]) -> bool:
        """
        Validate conversation format.
        Returns True if valid, False otherwise.
        """
        # Must have 'messages' key
        if 'messages' not in conv:
            return False

        # 'messages' must be a non-empty array
        messages = conv['messages']
        if not isinstance(messages, list) or len(messages) == 0:
            return False

        # Each message must have proper structure
        for msg in messages:
            if not self.validate_message(msg):
                return False

        return True

    def is_low_signal(self, conv: Dict[str, Any]) -> bool:
        """
        Check if conversation is trivial/low-signal.
        Returns True if should be dropped.
        """
        messages = conv['messages']

        # Rule: Only one message
        if len(messages) == 1:
            return True

        # Rule: No assistant message
        has_assistant = any(msg['role'] == 'assistant' for msg in messages)
        if not has_assistant:
            return True

        # Rule: Total content length < 30 characters
        total_length = sum(len(msg['content'].strip()) for msg in messages)
        if total_length < 30:
            return True

        # Rule: All messages are very short common responses
        short_responses = {'ok', 'yes', 'no', 'sip', 'ya', 'tidak', 'baik', 'oke', 'good', 'thanks', 'terima kasih'}
        all_short = all(
            msg['content'].strip().lower() in short_responses
            for msg in messages
        )
        if all_short and len(messages) <= 3:
            return True

        return False

    def clean_conversation(self, conv: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean a single conversation by normalizing whitespace.
        """
        cleaned_messages = []

        for msg in conv['messages']:
            cleaned_messages.append({
                'role': msg['role'],
                'content': self.normalize_whitespace(msg['content'])
            })

        return {'messages': cleaned_messages}

    def get_conversation_hash(self, conv: Dict[str, Any]) -> str:
        """
        Generate hash for conversation deduplication.
        Uses ordered sequence of content strings.
        """
        # Create string from ordered sequence of role:content pairs
        content_sequence = '||'.join(
            f"{msg['role']}:{msg['content']}"
            for msg in conv['messages']
        )

        # Generate SHA-256 hash
        return hashlib.sha256(content_sequence.encode('utf-8')).hexdigest()

    def is_duplicate(self, conv: Dict[str, Any]) -> bool:
        """
        Check if conversation is a duplicate.
        Returns True if duplicate (already seen).
        """
        conv_hash = self.get_conversation_hash(conv)

        if conv_hash in self.seen_hashes:
            return True

        self.seen_hashes.add(conv_hash)
        return False

    def process_conversation(self, conv: Dict[str, Any]) -> Dict[str, Any] | None:
        """
        Process a single conversation through all cleaning steps.
        Returns cleaned conversation or None if should be dropped.
        """
        self.stats['total_input'] += 1

        # Step 1: Validate format
        if not self.validate_conversation(conv):
            self.stats['invalid_format'] += 1
            return None

        # Step 2: Clean whitespace
        cleaned_conv = self.clean_conversation(conv)

        # Step 3: Check if low-signal (using cleaned content)
        if self.is_low_signal(cleaned_conv):
            messages = cleaned_conv['messages']
            if len(messages) == 1:
                self.stats['single_message'] += 1
            elif not any(msg['role'] == 'assistant' for msg in messages):
                self.stats['no_assistant'] += 1
            else:
                total_length = sum(len(msg['content'].strip()) for msg in messages)
                if total_length < 30:
                    self.stats['too_short'] += 1
                else:
                    self.stats['low_signal'] += 1
            return None

        # Step 4: Check for duplicates
        if self.is_duplicate(cleaned_conv):
            self.stats['duplicates'] += 1
            return None

        self.stats['total_output'] += 1
        return cleaned_conv

    def process_file(self, input_path: Path, output_path: Path) -> None:
        """
        Process entire JSONL file.

        Args:
            input_path: Path to input JSONL file
            output_path: Path to output cleaned JSONL file
        """
        logger.info(f"📖 Reading from: {input_path}")
        logger.info(f"📝 Writing to: {output_path}")

        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Process line by line
        with open(input_path, 'r', encoding='utf-8') as input_file, \
             open(output_path, 'w', encoding='utf-8') as output_file:

            for line_num, line in enumerate(input_file, 1):
                line = line.strip()
                if not line:
                    continue

                try:
                    # Parse JSON
                    conv = json.loads(line)

                    # Process conversation
                    cleaned_conv = self.process_conversation(conv)

                    # Write if not dropped
                    if cleaned_conv:
                        output_file.write(json.dumps(cleaned_conv, ensure_ascii=False) + '\n')

                    # Progress indicator
                    if line_num % 1000 == 0:
                        logger.info(f"Processed {line_num:,} conversations...")

                except json.JSONDecodeError as e:
                    logger.warning(f"Invalid JSON at line {line_num}: {e}")
                    self.stats['invalid_format'] += 1
                    continue
                except Exception as e:
                    logger.error(f"Error processing line {line_num}: {e}")
                    continue

        logger.info(f"✅ Processing complete!")

    def print_stats(self) -> None:
        """Print processing statistics"""
        logger.info("\n" + "="*70)
        logger.info("📊 CLEANING & DEDUPLICATION STATISTICS")
        logger.info("="*70)
        logger.info(f"Total input conversations:     {self.stats['total_input']:,}")
        logger.info("")
        logger.info("Dropped conversations:")
        logger.info(f"  • Invalid format:            {self.stats['invalid_format']:,}")
        logger.info(f"  • Single message only:       {self.stats['single_message']:,}")
        logger.info(f"  • No assistant response:     {self.stats['no_assistant']:,}")
        logger.info(f"  • Too short (< 30 chars):    {self.stats['too_short']:,}")
        logger.info(f"  • Low signal (trivial):      {self.stats['low_signal']:,}")
        logger.info(f"  • Duplicates:                {self.stats['duplicates']:,}")
        total_dropped = (
            self.stats['invalid_format'] +
            self.stats['single_message'] +
            self.stats['no_assistant'] +
            self.stats['too_short'] +
            self.stats['low_signal'] +
            self.stats['duplicates']
        )
        logger.info(f"  TOTAL DROPPED:               {total_dropped:,}")
        logger.info("")
        logger.info(f"✅ Total output conversations: {self.stats['total_output']:,}")

        if self.stats['total_input'] > 0:
            retention_rate = (self.stats['total_output'] / self.stats['total_input']) * 100
            logger.info(f"Retention rate:                {retention_rate:.1f}%")

        logger.info("="*70)


def main():
    parser = argparse.ArgumentParser(description='Clean and deduplicate JSONL chat datasets')
    parser.add_argument('--input', type=str, required=True, help='Input JSONL file')
    parser.add_argument('--output', type=str, required=True, help='Output JSONL file')

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        logger.error(f"❌ Input file not found: {input_path}")
        return

    # Create cleaner and process
    cleaner = ConversationCleaner()
    cleaner.process_file(input_path, output_path)
    cleaner.print_stats()

    logger.info(f"\n✅ Cleaned dataset saved to: {output_path}")


if __name__ == '__main__':
    main()
