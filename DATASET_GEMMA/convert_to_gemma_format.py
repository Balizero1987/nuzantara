"""
Convert ZANTARA datasets to Gemma fine-tuning format

Converts custom dataset formats to standard Gemma JSONL format:
{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}

Supports multiple dataset structures:
- claude13_zero_zantara.json (Italian, Zero-ZANTARA conversations)
- claude12_jakarta_authentic.json (Indonesian, user-assistant)
- claude6_javanese.json (Javanese dialect)
- Future datasets following similar patterns

Usage:
    python convert_to_gemma_format.py --input claude13_zero_zantara.json --output gemma_zero_zantara.jsonl
    python convert_to_gemma_format.py --input-dir DATASET_GEMMA --output gemma_all.jsonl
"""

import json
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DatasetConverter:
    """Convert ZANTARA datasets to Gemma format"""

    def __init__(self):
        self.stats = {
            'total_conversations': 0,
            'total_messages': 0,
            'skipped_conversations': 0,
            'files_processed': 0
        }

    def convert_conversation(self, conversation: Dict[str, Any], dataset_type: str = 'auto') -> Dict[str, List[Dict[str, str]]]:
        """
        Convert a single conversation to Gemma format

        Args:
            conversation: Conversation dict from dataset
            dataset_type: Type of dataset ('zero_zantara', 'jakarta', 'auto')

        Returns:
            Dict with 'messages' key containing role/content pairs
        """
        messages = []

        if 'messages' not in conversation:
            logger.warning(f"Conversation {conversation.get('conversation_id', 'unknown')} has no messages")
            return None

        # Detect dataset type from first message speaker if auto
        if dataset_type == 'auto' and len(conversation['messages']) > 0:
            first_speaker = conversation['messages'][0].get('speaker', '')
            if first_speaker in ['zero', 'zantara']:
                dataset_type = 'zero_zantara'
            elif first_speaker in ['user', 'assistant']:
                dataset_type = 'jakarta'
            else:
                logger.warning(f"Unknown speaker type: {first_speaker}, defaulting to user/assistant")
                dataset_type = 'jakarta'

        # Convert messages based on dataset type
        for msg in conversation['messages']:
            speaker = msg.get('speaker', '')
            content = msg.get('message', msg.get('content', ''))

            if not content:
                logger.warning(f"Empty message in conversation {conversation.get('conversation_id', 'unknown')}")
                continue

            # Map speaker to role
            if dataset_type == 'zero_zantara':
                # Zero-ZANTARA conversations: zero=user, zantara=assistant
                role = 'user' if speaker == 'zero' else 'assistant'
            else:
                # Standard user/assistant conversations
                role = speaker if speaker in ['user', 'assistant'] else 'assistant'

            messages.append({
                'role': role,
                'content': content.strip()
            })

        # Validate conversation structure
        if not messages:
            return None

        # Ensure conversation starts with user message
        if messages[0]['role'] != 'user':
            logger.warning(f"Conversation {conversation.get('conversation_id', 'unknown')} doesn't start with user message")
            # Try to fix by swapping if it's just assistant
            if messages[0]['role'] == 'assistant' and len(messages) > 1:
                messages[0]['role'] = 'user'

        return {'messages': messages}

    def convert_file(self, input_path: Path, output_path: Path) -> None:
        """
        Convert single dataset file to Gemma JSONL format

        Args:
            input_path: Path to input JSON dataset
            output_path: Path to output JSONL file
        """
        logger.info(f"📖 Reading {input_path.name}")

        try:
            with open(input_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            logger.error(f"❌ Failed to read {input_path}: {e}")
            return

        # Extract conversations from dataset
        conversations = data.get('conversations', [])
        if not conversations:
            logger.warning(f"⚠️  No conversations found in {input_path}")
            return

        logger.info(f"🔄 Converting {len(conversations)} conversations...")

        # Convert and write to JSONL
        converted_count = 0
        with open(output_path, 'w', encoding='utf-8') as out_f:
            for conv in conversations:
                gemma_conv = self.convert_conversation(conv, dataset_type='auto')

                if gemma_conv and gemma_conv['messages']:
                    # Write as single-line JSON
                    out_f.write(json.dumps(gemma_conv, ensure_ascii=False) + '\n')
                    converted_count += 1
                    self.stats['total_messages'] += len(gemma_conv['messages'])
                else:
                    self.stats['skipped_conversations'] += 1

        self.stats['total_conversations'] += converted_count
        self.stats['files_processed'] += 1

        logger.info(f"✅ Converted {converted_count}/{len(conversations)} conversations to {output_path.name}")

    def convert_directory(self, input_dir: Path, output_path: Path, pattern: str = "*.json") -> None:
        """
        Convert all JSON files in directory to single Gemma JSONL file

        Args:
            input_dir: Directory containing dataset JSON files
            output_path: Path to output JSONL file
            pattern: Glob pattern for input files (default: *.json)
        """
        json_files = sorted(input_dir.glob(pattern))

        if not json_files:
            logger.error(f"❌ No JSON files found in {input_dir}")
            return

        logger.info(f"📁 Found {len(json_files)} dataset files")

        # Process all files and write to single output
        with open(output_path, 'w', encoding='utf-8') as out_f:
            for json_file in json_files:
                logger.info(f"\n📖 Processing {json_file.name}")

                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                except Exception as e:
                    logger.error(f"❌ Failed to read {json_file}: {e}")
                    continue

                conversations = data.get('conversations', [])
                if not conversations:
                    logger.warning(f"⚠️  No conversations in {json_file.name}")
                    continue

                logger.info(f"🔄 Converting {len(conversations)} conversations...")
                converted_count = 0

                for conv in conversations:
                    gemma_conv = self.convert_conversation(conv, dataset_type='auto')

                    if gemma_conv and gemma_conv['messages']:
                        out_f.write(json.dumps(gemma_conv, ensure_ascii=False) + '\n')
                        converted_count += 1
                        self.stats['total_messages'] += len(gemma_conv['messages'])
                    else:
                        self.stats['skipped_conversations'] += 1

                self.stats['total_conversations'] += converted_count
                self.stats['files_processed'] += 1

                logger.info(f"✅ {converted_count}/{len(conversations)} conversations")

        logger.info(f"\n📊 All datasets merged into {output_path.name}")

    def print_stats(self) -> None:
        """Print conversion statistics"""
        logger.info("\n" + "="*60)
        logger.info("📊 CONVERSION STATISTICS")
        logger.info("="*60)
        logger.info(f"Files processed:          {self.stats['files_processed']}")
        logger.info(f"Total conversations:      {self.stats['total_conversations']:,}")
        logger.info(f"Total messages:           {self.stats['total_messages']:,}")
        logger.info(f"Skipped conversations:    {self.stats['skipped_conversations']}")
        logger.info(f"Avg messages/conversation: {self.stats['total_messages'] / max(self.stats['total_conversations'], 1):.1f}")
        logger.info("="*60)


def validate_gemma_format(jsonl_path: Path, sample_size: int = 3) -> None:
    """
    Validate Gemma JSONL format and show samples

    Args:
        jsonl_path: Path to JSONL file
        sample_size: Number of samples to display
    """
    logger.info(f"\n🔍 Validating {jsonl_path.name}")

    try:
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        logger.info(f"✅ Total conversations: {len(lines):,}")

        # Validate structure
        valid_count = 0
        for i, line in enumerate(lines[:100]):  # Check first 100
            try:
                conv = json.loads(line)
                assert 'messages' in conv, "Missing 'messages' key"
                assert isinstance(conv['messages'], list), "'messages' is not a list"
                assert len(conv['messages']) > 0, "Empty messages list"

                for msg in conv['messages']:
                    assert 'role' in msg, "Message missing 'role'"
                    assert 'content' in msg, "Message missing 'content'"
                    assert msg['role'] in ['user', 'assistant'], f"Invalid role: {msg['role']}"

                valid_count += 1
            except Exception as e:
                logger.error(f"❌ Invalid conversation at line {i+1}: {e}")

        logger.info(f"✅ Format validation: {valid_count}/{min(100, len(lines))} conversations valid")

        # Show samples
        logger.info(f"\n📝 Sample conversations (showing {sample_size}):")
        for i, line in enumerate(lines[:sample_size], 1):
            conv = json.loads(line)
            logger.info(f"\n--- Sample {i} ---")
            logger.info(f"Messages: {len(conv['messages'])}")
            for msg in conv['messages'][:4]:  # Show first 4 messages
                role_emoji = "👤" if msg['role'] == 'user' else "🤖"
                content_preview = msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content']
                logger.info(f"  {role_emoji} {msg['role']}: {content_preview}")
            if len(conv['messages']) > 4:
                logger.info(f"  ... ({len(conv['messages']) - 4} more messages)")

    except Exception as e:
        logger.error(f"❌ Validation failed: {e}")


def main():
    parser = argparse.ArgumentParser(description='Convert ZANTARA datasets to Gemma format')
    parser.add_argument('--input', type=str, help='Input JSON file')
    parser.add_argument('--input-dir', type=str, help='Input directory with JSON files')
    parser.add_argument('--output', type=str, required=True, help='Output JSONL file')
    parser.add_argument('--pattern', type=str, default='*.json', help='File pattern for directory mode')
    parser.add_argument('--validate', action='store_true', help='Validate output after conversion')
    parser.add_argument('--samples', type=int, default=3, help='Number of samples to show in validation')

    args = parser.parse_args()

    converter = DatasetConverter()

    # Determine mode
    if args.input and args.input_dir:
        logger.error("❌ Cannot specify both --input and --input-dir")
        return

    if not args.input and not args.input_dir:
        logger.error("❌ Must specify either --input or --input-dir")
        return

    output_path = Path(args.output)

    # Convert
    if args.input:
        input_path = Path(args.input)
        if not input_path.exists():
            logger.error(f"❌ Input file not found: {input_path}")
            return

        converter.convert_file(input_path, output_path)
    else:
        input_dir = Path(args.input_dir)
        if not input_dir.is_dir():
            logger.error(f"❌ Input directory not found: {input_dir}")
            return

        converter.convert_directory(input_dir, output_path, args.pattern)

    # Print statistics
    converter.print_stats()

    # Validate if requested
    if args.validate and output_path.exists():
        validate_gemma_format(output_path, args.samples)

    logger.info(f"\n✅ Conversion complete! Output: {output_path}")
    logger.info(f"📦 Ready for Gemma fine-tuning!")


if __name__ == '__main__':
    main()
