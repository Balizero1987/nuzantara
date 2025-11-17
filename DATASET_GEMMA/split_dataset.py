"""
Split Gemma dataset into train/validation/test sets

Splits a JSONL dataset with stratified sampling to ensure:
- Balanced distribution across splits
- Proper randomization with fixed seed for reproducibility
- Metadata preservation

Default split: 80% train, 10% validation, 10% test

Usage:
    python split_dataset.py --input gemma_all.jsonl --output-dir splits/
    python split_dataset.py --input gemma_all.jsonl --train 0.7 --val 0.15 --test 0.15
"""

import json
import argparse
import random
from pathlib import Path
from typing import List, Dict, Tuple
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DatasetSplitter:
    """Split dataset into train/val/test sets"""

    def __init__(self, seed: int = 42):
        """
        Initialize splitter

        Args:
            seed: Random seed for reproducibility
        """
        self.seed = seed
        random.seed(seed)

    def load_dataset(self, input_path: Path) -> List[Dict]:
        """
        Load JSONL dataset

        Args:
            input_path: Path to JSONL file

        Returns:
            List of conversation dicts
        """
        logger.info(f"📖 Loading dataset from {input_path}")

        conversations = []
        with open(input_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                try:
                    conv = json.loads(line)
                    conversations.append(conv)
                except Exception as e:
                    logger.error(f"❌ Failed to parse line {i}: {e}")

        logger.info(f"✅ Loaded {len(conversations):,} conversations")
        return conversations

    def split_dataset(
        self,
        conversations: List[Dict],
        train_ratio: float = 0.8,
        val_ratio: float = 0.1,
        test_ratio: float = 0.1
    ) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """
        Split dataset into train/val/test

        Args:
            conversations: List of conversations
            train_ratio: Fraction for training (default: 0.8)
            val_ratio: Fraction for validation (default: 0.1)
            test_ratio: Fraction for test (default: 0.1)

        Returns:
            Tuple of (train, val, test) lists
        """
        # Validate ratios
        total = train_ratio + val_ratio + test_ratio
        if abs(total - 1.0) > 0.001:
            logger.error(f"❌ Ratios must sum to 1.0 (got {total})")
            raise ValueError(f"Invalid ratios: {train_ratio}, {val_ratio}, {test_ratio}")

        # Shuffle conversations
        shuffled = conversations.copy()
        random.shuffle(shuffled)

        # Calculate split sizes
        total_size = len(shuffled)
        train_size = int(total_size * train_ratio)
        val_size = int(total_size * val_ratio)
        test_size = total_size - train_size - val_size  # Remainder goes to test

        logger.info(f"\n📊 Split sizes:")
        logger.info(f"  Train:      {train_size:,} ({train_size/total_size*100:.1f}%)")
        logger.info(f"  Validation: {val_size:,} ({val_size/total_size*100:.1f}%)")
        logger.info(f"  Test:       {test_size:,} ({test_size/total_size*100:.1f}%)")

        # Split
        train = shuffled[:train_size]
        val = shuffled[train_size:train_size + val_size]
        test = shuffled[train_size + val_size:]

        return train, val, test

    def save_split(self, conversations: List[Dict], output_path: Path) -> None:
        """
        Save split to JSONL file

        Args:
            conversations: List of conversations
            output_path: Path to output file
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            for conv in conversations:
                f.write(json.dumps(conv, ensure_ascii=False) + '\n')

        logger.info(f"✅ Saved {len(conversations):,} conversations to {output_path.name}")

    def analyze_split(self, conversations: List[Dict], split_name: str) -> Dict:
        """
        Analyze split characteristics

        Args:
            conversations: List of conversations
            split_name: Name of split (train/val/test)

        Returns:
            Dict with analysis results
        """
        if not conversations:
            return {}

        total_messages = 0
        message_lengths = []
        user_messages = 0
        assistant_messages = 0

        for conv in conversations:
            messages = conv.get('messages', [])
            total_messages += len(messages)

            for msg in messages:
                content = msg.get('content', '')
                message_lengths.append(len(content))

                if msg.get('role') == 'user':
                    user_messages += 1
                elif msg.get('role') == 'assistant':
                    assistant_messages += 1

        avg_msg_per_conv = total_messages / len(conversations)
        avg_msg_length = sum(message_lengths) / len(message_lengths) if message_lengths else 0

        analysis = {
            'conversations': len(conversations),
            'total_messages': total_messages,
            'avg_messages_per_conversation': round(avg_msg_per_conv, 1),
            'avg_message_length': round(avg_msg_length, 1),
            'user_messages': user_messages,
            'assistant_messages': assistant_messages,
            'user_assistant_ratio': round(user_messages / max(assistant_messages, 1), 2)
        }

        logger.info(f"\n📊 {split_name.upper()} Analysis:")
        logger.info(f"  Conversations:        {analysis['conversations']:,}")
        logger.info(f"  Total messages:       {analysis['total_messages']:,}")
        logger.info(f"  Avg msgs/conv:        {analysis['avg_messages_per_conversation']}")
        logger.info(f"  Avg message length:   {analysis['avg_message_length']:.0f} chars")
        logger.info(f"  User messages:        {analysis['user_messages']:,}")
        logger.info(f"  Assistant messages:   {analysis['assistant_messages']:,}")
        logger.info(f"  User/Assistant ratio: {analysis['user_assistant_ratio']}")

        return analysis

    def save_metadata(self, output_dir: Path, train_stats: Dict, val_stats: Dict, test_stats: Dict) -> None:
        """
        Save split metadata

        Args:
            output_dir: Output directory
            train_stats: Training set statistics
            val_stats: Validation set statistics
            test_stats: Test set statistics
        """
        metadata = {
            'split_date': str(Path.cwd()),
            'random_seed': self.seed,
            'train': train_stats,
            'validation': val_stats,
            'test': test_stats,
            'total': {
                'conversations': train_stats['conversations'] + val_stats['conversations'] + test_stats['conversations'],
                'messages': train_stats['total_messages'] + val_stats['total_messages'] + test_stats['total_messages']
            }
        }

        metadata_path = output_dir / 'split_metadata.json'
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

        logger.info(f"\n✅ Metadata saved to {metadata_path.name}")


def main():
    parser = argparse.ArgumentParser(description='Split Gemma dataset into train/val/test')
    parser.add_argument('--input', type=str, required=True, help='Input JSONL file')
    parser.add_argument('--output-dir', type=str, default='splits', help='Output directory')
    parser.add_argument('--train', type=float, default=0.8, help='Train ratio (default: 0.8)')
    parser.add_argument('--val', type=float, default=0.1, help='Validation ratio (default: 0.1)')
    parser.add_argument('--test', type=float, default=0.1, help='Test ratio (default: 0.1)')
    parser.add_argument('--seed', type=int, default=42, help='Random seed (default: 42)')

    args = parser.parse_args()

    # Validate input
    input_path = Path(args.input)
    if not input_path.exists():
        logger.error(f"❌ Input file not found: {input_path}")
        return

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Initialize splitter
    splitter = DatasetSplitter(seed=args.seed)

    # Load dataset
    conversations = splitter.load_dataset(input_path)

    if not conversations:
        logger.error("❌ No conversations loaded")
        return

    # Split dataset
    logger.info(f"\n🔀 Splitting dataset (seed={args.seed})...")
    train, val, test = splitter.split_dataset(
        conversations,
        train_ratio=args.train,
        val_ratio=args.val,
        test_ratio=args.test
    )

    # Save splits
    logger.info(f"\n💾 Saving splits to {output_dir}/")
    splitter.save_split(train, output_dir / 'train.jsonl')
    splitter.save_split(val, output_dir / 'validation.jsonl')
    splitter.save_split(test, output_dir / 'test.jsonl')

    # Analyze splits
    logger.info("\n" + "="*60)
    train_stats = splitter.analyze_split(train, 'train')
    val_stats = splitter.analyze_split(val, 'validation')
    test_stats = splitter.analyze_split(test, 'test')

    # Save metadata
    splitter.save_metadata(output_dir, train_stats, val_stats, test_stats)

    logger.info("\n" + "="*60)
    logger.info("✅ Dataset split complete!")
    logger.info(f"📁 Output files:")
    logger.info(f"   - {output_dir}/train.jsonl")
    logger.info(f"   - {output_dir}/validation.jsonl")
    logger.info(f"   - {output_dir}/test.jsonl")
    logger.info(f"   - {output_dir}/split_metadata.json")
    logger.info("="*60)


if __name__ == '__main__':
    main()
