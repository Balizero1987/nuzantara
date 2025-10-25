#!/usr/bin/env python3
"""
Smart Category Tagger for Intel Scraping
Auto-detect categories based on content keywords
"""
from typing import Dict, List, Tuple
from pathlib import Path
import json

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_DIR = PROJECT_ROOT / "config"
KEYWORDS_FILE = CONFIG_DIR / "category_keywords.json"

# Default keyword mappings
DEFAULT_KEYWORDS = {
    "business": [
        "economy", "business", "startup", "entrepreneur", "investment",
        "market", "finance", "trade", "commerce", "company",
        "revenue", "profit", "stock", "venture capital", "funding"
    ],
    "immigration": [
        "visa", "immigration", "passport", "residence permit", "kitas",
        "kitap", "work permit", "stay permit", "sponsorship",
        "deportation", "overstay", "entry", "exit", "border"
    ],
    "ai_tech": [
        "artificial intelligence", "AI", "machine learning", "LLM",
        "neural network", "deep learning", "chatbot", "automation",
        "technology", "software", "algorithm", "data science", "OpenAI",
        "GPT", "claude", "gemini", "robotics"
    ],
    "property": [
        "real estate", "property", "house", "apartment", "villa",
        "rent", "lease", "mortgage", "land", "building",
        "developer", "construction", "freehold", "leasehold", "hak milik"
    ],
    "lifestyle": [
        "lifestyle", "culture", "expat", "travel", "tourism",
        "dining", "restaurant", "cafe", "beach", "surfing",
        "yoga", "wellness", "spa", "entertainment", "nightlife"
    ],
    "safety": [
        "safety", "security", "crime", "police", "emergency",
        "health", "medical", "hospital", "clinic", "insurance",
        "disaster", "earthquake", "volcano", "tsunami", "evacuation"
    ],
    "tax_legal": [
        "tax", "legal", "law", "regulation", "compliance",
        "attorney", "lawyer", "court", "lawsuit", "contract",
        "VAT", "income tax", "corporate tax", "notary", "legislation"
    ]
}


class CategoryTagger:
    """Smart category detection based on keywords"""

    def __init__(self, keywords_file: Path = None):
        self.keywords_file = keywords_file or KEYWORDS_FILE
        self.keywords = self._load_keywords()

    def _load_keywords(self) -> Dict[str, List[str]]:
        """Load keyword mappings from file or use defaults"""
        if self.keywords_file.exists():
            try:
                return json.loads(self.keywords_file.read_text(encoding='utf-8'))
            except Exception as e:
                print(f"⚠️  Could not load keywords: {e}, using defaults")

        return DEFAULT_KEYWORDS

    def save_keywords(self) -> None:
        """Save keyword mappings to file"""
        try:
            self.keywords_file.parent.mkdir(parents=True, exist_ok=True)
            self.keywords_file.write_text(
                json.dumps(self.keywords, indent=2, sort_keys=True),
                encoding='utf-8'
            )
        except Exception as e:
            print(f"⚠️  Could not save keywords: {e}")

    def detect_category(self, text: str, threshold: float = 0.1) -> List[Tuple[str, float]]:
        """Detect categories from text content

        Args:
            text: Article text content
            threshold: Minimum confidence threshold (0.0-1.0)

        Returns:
            List of (category, confidence) tuples, sorted by confidence
        """
        text_lower = text.lower()
        word_count = len(text.split())

        # Count keyword matches per category
        category_scores = {}

        for category, keywords in self.keywords.items():
            matches = sum(1 for keyword in keywords if keyword.lower() in text_lower)

            # Calculate confidence (normalized by text length and keyword count)
            if word_count > 0:
                confidence = matches / len(keywords)
                category_scores[category] = confidence

        # Filter and sort by confidence
        results = [
            (cat, score)
            for cat, score in category_scores.items()
            if score >= threshold
        ]

        results.sort(key=lambda x: x[1], reverse=True)

        return results

    def suggest_category(self, text: str) -> str:
        """Suggest best matching category

        Args:
            text: Article text content

        Returns:
            Best matching category name or 'uncategorized'
        """
        results = self.detect_category(text, threshold=0.05)

        if results:
            return results[0][0]

        return "uncategorized"

    def add_keywords(self, category: str, keywords: List[str]) -> None:
        """Add keywords to category

        Args:
            category: Category name
            keywords: List of keywords to add
        """
        if category not in self.keywords:
            self.keywords[category] = []

        for keyword in keywords:
            if keyword.lower() not in [k.lower() for k in self.keywords[category]]:
                self.keywords[category].append(keyword)

    def get_report(self) -> str:
        """Generate keyword configuration report

        Returns:
            Formatted report
        """
        lines = ["📊 Smart Category Tagger - Keyword Configuration", "=" * 60]

        for category, keywords in sorted(self.keywords.items()):
            lines.append(f"\n📁 {category.upper()}")
            lines.append(f"   Keywords: {len(keywords)}")
            lines.append(f"   {', '.join(keywords[:10])}" + ("..." if len(keywords) > 10 else ""))

        lines.append("\n" + "=" * 60)
        lines.append(f"Total categories: {len(self.keywords)}")
        lines.append(f"Total keywords: {sum(len(kw) for kw in self.keywords.values())}")

        return "\n".join(lines)


# Module-level convenience functions
_tagger = None

def get_tagger() -> CategoryTagger:
    """Get global category tagger instance"""
    global _tagger
    if _tagger is None:
        _tagger = CategoryTagger()
    return _tagger


def detect_category(text: str, threshold: float = 0.1) -> List[Tuple[str, float]]:
    """Detect categories (convenience function)"""
    return get_tagger().detect_category(text, threshold)


def suggest_category(text: str) -> str:
    """Suggest category (convenience function)"""
    return get_tagger().suggest_category(text)


if __name__ == '__main__':
    # Test category detection
    tagger = CategoryTagger()

    # Save default keywords to file
    tagger.save_keywords()

    print(tagger.get_report())

    # Test detection
    test_texts = [
        "Indonesia's new visa regulations allow digital nomads to stay for up to 5 years with a KITAS work permit.",
        "OpenAI releases GPT-5 with improved reasoning capabilities and multimodal support.",
        "Bali real estate market sees 20% increase in villa sales to foreign investors."
    ]

    print("\n\n🧪 Testing Category Detection:")
    print("=" * 60)

    for text in test_texts:
        detected = tagger.detect_category(text, threshold=0.05)
        suggested = tagger.suggest_category(text)

        print(f"\n📄 Text: {text[:60]}...")
        print(f"   Suggested: {suggested}")
        print(f"   Detected: {detected}")
