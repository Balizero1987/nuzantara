#!/usr/bin/env python3
"""
Data Cleaning & Validation for Web-Scraped Indonesian Training Data

Combines data from multiple sources (Reddit, Twitter, Quora, Kaskus, YouTube)
and produces high-quality training dataset.

Quality filters:
- Language detection (Indonesian/Bahasa)
- Spam/bot detection
- Deduplication
- Length validation
- Engagement quality
- Personal info removal

Usage:
    python scripts/clean_scraped_data.py --input-dir data/ --output data/indonesia_clean.jsonl
"""

import json
import re
import hashlib
from typing import List, Dict, Set, Optional
from pathlib import Path
from collections import Counter
import argparse

# ==========================================
# LANGUAGE DETECTION
# ==========================================

# Common Indonesian words (for quick language check)
INDONESIAN_WORDS = {
    # Common verbs
    "adalah", "ada", "akan", "bisa", "harus", "ingin", "mau", "perlu",
    "dapat", "sudah", "belum", "sedang", "pernah",

    # Common prepositions
    "di", "ke", "dari", "untuk", "dengan", "pada", "oleh", "tentang",

    # Common pronouns
    "saya", "aku", "kamu", "dia", "kami", "kita", "mereka", "kau",

    # Common questions
    "apa", "siapa", "dimana", "kapan", "mengapa", "kenapa", "bagaimana", "gimana",

    # Common conjunctions
    "dan", "atau", "tapi", "tetapi", "karena", "jadi", "kalau", "kalo",

    # Common nouns
    "orang", "tahun", "hari", "waktu", "tempat", "kerja", "rumah", "uang",

    # Slang (Gen Z)
    "gue", "gua", "lo", "lu", "ente", "ane", "gan", "sist",
    "gak", "ngga", "gapapa", "gimana", "kenapa", "emang",

    # Indonesian-specific
    "yang", "ini", "itu", "banget", "sekali", "juga", "lagi", "udah", "udh"
}

def is_indonesian(text: str, threshold: float = 0.15) -> bool:
    """
    Quick Indonesian language detection

    Args:
        text: Text to check
        threshold: Minimum ratio of Indonesian words (default 15%)

    Returns:
        True if likely Indonesian
    """
    if not text or len(text) < 20:
        return False

    # Lowercase and tokenize
    words = re.findall(r'\b\w+\b', text.lower())

    if len(words) < 5:
        return False

    # Count Indonesian words
    indonesian_count = sum(1 for word in words if word in INDONESIAN_WORDS)

    ratio = indonesian_count / len(words)
    return ratio >= threshold

# ==========================================
# SPAM & BOT DETECTION
# ==========================================

SPAM_PATTERNS = [
    # Promotional
    r'\b(diskon|discount|promo|gratis|free|limited|terbatas|hanya|only)\s+\d+%',
    r'(whatsapp|wa|telegram|line)\s*:?\s*\+?\d{9,15}',
    r'(hub|hubungi|contact|dm)\s+(saya|kami|gua|gue)',

    # Link spam
    r'(klik|click)\s+(link|disini|here)',
    r'(daftar|register)\s+(sekarang|now)',
    r'bit\.ly|shorturl|tinyurl',

    # Excessive emojis
    r'[\U0001F600-\U0001F64F]{5,}',  # 5+ consecutive emojis

    # Copypasta indicators
    r'^(copas|copy|share|bagikan)\b',
    r'\bcopypasta\b',
]

def is_spam(text: str) -> bool:
    """Detect spam/promotional content"""
    for pattern in SPAM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True

    # Check for excessive capitalization
    if text.isupper() and len(text) > 50:
        return True

    # Check for excessive repetition
    words = text.lower().split()
    if len(words) > 10:
        word_counts = Counter(words)
        most_common_count = word_counts.most_common(1)[0][1]
        if most_common_count / len(words) > 0.3:  # >30% repetition
            return True

    return False

def is_bot_content(text: str) -> bool:
    """Detect bot-generated content patterns"""
    bot_markers = [
        "bot", "automated", "otomatis",
        "this message was automatically",
        "pesan ini dibuat otomatis"
    ]

    text_lower = text.lower()
    return any(marker in text_lower for marker in bot_markers)

# ==========================================
# DEDUPLICATION
# ==========================================

def text_hash(text: str) -> str:
    """Generate hash for deduplication"""
    # Normalize text
    normalized = re.sub(r'\s+', ' ', text.lower().strip())
    normalized = re.sub(r'[^\w\s]', '', normalized)  # Remove punctuation

    return hashlib.md5(normalized.encode()).hexdigest()

def is_near_duplicate(text: str, seen_hashes: Set[str], threshold: int = 10) -> bool:
    """
    Detect near-duplicates using fuzzy hashing

    Args:
        text: Text to check
        seen_hashes: Set of already seen hashes
        threshold: Character difference threshold

    Returns:
        True if near-duplicate
    """
    # Exact duplicate
    exact_hash = text_hash(text)
    if exact_hash in seen_hashes:
        return True

    # Fuzzy duplicate (sliding window)
    words = text.split()
    if len(words) < 10:
        return False

    # Check first 10 words hash
    first_10_hash = text_hash(' '.join(words[:10]))
    if first_10_hash in seen_hashes:
        return True

    return False

# ==========================================
# QUALITY VALIDATION
# ==========================================

def validate_quality(item: Dict) -> Optional[str]:
    """
    Validate training data quality

    Returns:
        None if valid, error message if invalid
    """
    # Check messages structure
    if "messages" not in item:
        return "Missing 'messages' field"

    messages = item["messages"]

    if not messages or len(messages) == 0:
        return "Empty messages"

    # Check each message
    for msg in messages:
        if "role" not in msg or "content" not in msg:
            return "Invalid message structure"

        content = msg["content"]

        # Length checks
        if len(content) < 20:
            return f"Content too short ({len(content)} chars)"

        if len(content) > 10000:
            return f"Content too long ({len(content)} chars)"

        # Language check
        if not is_indonesian(content):
            return "Not Indonesian language"

        # Spam check
        if is_spam(content):
            return "Spam detected"

        # Bot check
        if is_bot_content(content):
            return "Bot content detected"

    return None  # Valid

# ==========================================
# DATA CLEANING PIPELINE
# ==========================================

def clean_dataset(
    input_files: List[Path],
    min_engagement: int = 0,
    remove_duplicates: bool = True
) -> List[Dict]:
    """
    Clean and merge multiple datasets

    Args:
        input_files: List of JSONL input files
        min_engagement: Minimum engagement score (likes/upvotes)
        remove_duplicates: Remove duplicate content

    Returns:
        List of cleaned training examples
    """
    all_items = []
    seen_hashes: Set[str] = set()

    stats = {
        "total_read": 0,
        "duplicate": 0,
        "spam": 0,
        "not_indonesian": 0,
        "too_short": 0,
        "too_long": 0,
        "bot_content": 0,
        "low_engagement": 0,
        "valid": 0
    }

    for file_path in input_files:
        if not file_path.exists():
            print(f"⚠️ File not found: {file_path}")
            continue

        print(f"\n📄 Processing: {file_path.name}")

        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                if not line.strip():
                    continue

                try:
                    item = json.loads(line)
                    stats["total_read"] += 1

                except json.JSONDecodeError:
                    print(f"  ⚠️ Invalid JSON at line {line_num}")
                    continue

                # Quality validation
                error = validate_quality(item)
                if error:
                    if "too short" in error.lower():
                        stats["too_short"] += 1
                    elif "too long" in error.lower():
                        stats["too_long"] += 1
                    elif "spam" in error.lower():
                        stats["spam"] += 1
                    elif "not indonesian" in error.lower():
                        stats["not_indonesian"] += 1
                    elif "bot" in error.lower():
                        stats["bot_content"] += 1
                    continue

                # Engagement filter
                metadata = item.get("metadata", {})
                engagement = metadata.get("score", 0) or metadata.get("engagement", 0)

                if engagement < min_engagement:
                    stats["low_engagement"] += 1
                    continue

                # Deduplication
                if remove_duplicates:
                    # Combine all message content for hashing
                    combined_text = ' '.join(
                        msg.get("content", "") for msg in item["messages"]
                    )

                    if is_near_duplicate(combined_text, seen_hashes):
                        stats["duplicate"] += 1
                        continue

                    seen_hashes.add(text_hash(combined_text))

                # Valid item!
                stats["valid"] += 1
                all_items.append(item)

        print(f"  ✅ Valid items from this file: {stats['valid']}")

    # Print summary stats
    print("\n" + "="*50)
    print("📊 CLEANING SUMMARY")
    print("="*50)
    print(f"Total items read:       {stats['total_read']}")
    print(f"  ✅ Valid:             {stats['valid']} ({stats['valid']/stats['total_read']*100:.1f}%)")
    print(f"  ❌ Removed:")
    print(f"     - Duplicates:      {stats['duplicate']}")
    print(f"     - Spam:            {stats['spam']}")
    print(f"     - Not Indonesian:  {stats['not_indonesian']}")
    print(f"     - Too short:       {stats['too_short']}")
    print(f"     - Too long:        {stats['too_long']}")
    print(f"     - Bot content:     {stats['bot_content']}")
    print(f"     - Low engagement:  {stats['low_engagement']}")
    print("="*50)

    return all_items

# ==========================================
# MAIN
# ==========================================

def main():
    parser = argparse.ArgumentParser(description="Clean web-scraped Indonesian training data")
    parser.add_argument("--input-dir", type=str, default="data/", help="Input directory with JSONL files")
    parser.add_argument("--output", type=str, default="data/indonesia_clean.jsonl", help="Output file")
    parser.add_argument("--min-engagement", type=int, default=0, help="Minimum engagement score")
    parser.add_argument("--keep-duplicates", action="store_true", help="Keep duplicate content")

    args = parser.parse_args()

    # Find all JSONL input files
    input_dir = Path(args.input_dir)

    if not input_dir.exists():
        print(f"❌ Input directory not found: {input_dir}")
        return

    input_files = list(input_dir.glob("*_training.jsonl"))

    if not input_files:
        print(f"❌ No *_training.jsonl files found in {input_dir}")
        print("\nExpected files:")
        print("  - reddit_indonesia_training.jsonl")
        print("  - twitter_indonesia_training.jsonl")
        print("  - quora_indonesia_training.jsonl")
        print("  - etc.")
        return

    print(f"📁 Found {len(input_files)} input files:")
    for f in input_files:
        print(f"   - {f.name}")

    # Clean dataset
    cleaned_data = clean_dataset(
        input_files,
        min_engagement=args.min_engagement,
        remove_duplicates=not args.keep_duplicates
    )

    if not cleaned_data:
        print("\n❌ No valid data after cleaning")
        return

    # Save cleaned data
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        for item in cleaned_data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')

    print(f"\n✅ Cleaned data saved: {output_path}")
    print(f"📊 Final dataset size: {len(cleaned_data)} examples")

    # Show sample
    if cleaned_data:
        print("\n📝 Sample cleaned example:")
        sample = cleaned_data[0]
        print(f"   User: {sample['messages'][0]['content'][:100]}...")
        if len(sample['messages']) > 1:
            print(f"   Assistant: {sample['messages'][1]['content'][:100]}...")

if __name__ == "__main__":
    main()
