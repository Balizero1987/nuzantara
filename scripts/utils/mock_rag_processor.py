#!/usr/bin/env python3
"""
Mock RAG Processor for testing without Ollama
Simulates the RAG processing stage for testing purposes
"""

import json
import hashlib
from datetime import datetime
from pathlib import Path
import logging
import random

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"

class MockRAGProcessor:
    """Simulates RAG processing without needing LLAMA"""

    def __init__(self):
        self.base_dir = BASE_DIR
        logger.info("Using MOCK RAG Processor (no LLAMA needed)")

    def mock_extract(self, document: dict) -> dict:
        """Mock extraction that simulates LLAMA output"""

        # Simulate extracted data
        return {
            "title": document.get('title', 'Untitled'),
            "summary": f"Summary of {document.get('title', 'content')[:50]}...",
            "category": document['category'],
            "sub_category": random.choice(["visa", "tax", "property", "news"]),
            "entities": {
                "people": ["John Doe", "Jane Smith"],
                "organizations": ["Immigration Office", "BKPM"],
                "locations": ["Bali", "Jakarta", "Denpasar"]
            },
            "keywords": ["indonesia", "bali", "expat", "visa", "business"],
            "dates": {
                "published": datetime.now().strftime("%Y-%m-%d"),
                "effective": None,
                "deadline": None
            },
            "impact": {
                "level": random.choice(["high", "medium", "low"]),
                "affected_groups": ["expats", "investors"],
                "action_required": random.choice([True, False]),
                "urgency": random.choice(["immediate", "soon", "future", "informational"])
            },
            "language": {
                "primary": "en",
                "needs_translation": False
            },
            "tier": document.get('tier', 3),
            "source_reliability": "accredited",
            "key_points": [
                "Important point 1",
                "Important point 2",
                "Important point 3"
            ],
            "regulatory_changes": [],
            "business_implications": "May affect business operations",
            "source_url": document.get('url', ''),
            "source_name": document.get('source_name', ''),
            "scraped_at": document.get('scraped_at', ''),
            "content_hash": document.get('content_hash', ''),
            "word_count": document.get('word_count', 0)
        }

    def process_category(self, category: str):
        """Process all raw documents in a category"""
        raw_dir = self.base_dir / category / "raw"
        rag_dir = self.base_dir / category / "rag"
        rag_dir.mkdir(parents=True, exist_ok=True)

        if not raw_dir.exists():
            logger.warning(f"No raw directory for {category}")
            return

        json_files = list(raw_dir.glob("*.json"))
        logger.info(f"Processing {len(json_files)} files in {category}")

        processed = 0
        for json_file in json_files:
            # Check if already processed
            rag_file = rag_dir / json_file.name
            if rag_file.exists():
                logger.info(f"Already processed: {json_file.name}")
                continue

            # Load document
            with open(json_file, 'r', encoding='utf-8') as f:
                document = json.load(f)

            # Mock process for RAG
            logger.info(f"Mock processing: {document.get('title', json_file.name)[:50]}...")
            rag_data = self.mock_extract(document)

            if rag_data:
                # Save RAG data
                with open(rag_file, 'w', encoding='utf-8') as f:
                    json.dump(rag_data, f, ensure_ascii=False, indent=2)

                processed += 1

        logger.info(f"Mock processed {processed} documents in {category}")

    def process_all(self):
        """Process all categories"""
        logger.info("=" * 70)
        logger.info("MOCK RAG PROCESSING (Testing Mode)")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        categories = [d.name for d in self.base_dir.iterdir() if d.is_dir()]

        for category in categories:
            logger.info(f"\nProcessing category: {category}")
            self.process_category(category)

        # Generate RAG summary
        self.generate_rag_summary()

        logger.info("=" * 70)
        logger.info("MOCK RAG PROCESSING COMPLETE")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

    def generate_rag_summary(self):
        """Generate summary of RAG processing"""
        summary_file = self.base_dir / f"mock_rag_summary_{datetime.now().strftime('%Y%m%d')}.md"

        with open(summary_file, 'w') as f:
            f.write(f"# Mock RAG Processing Summary\n\n")
            f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"**Mode**: MOCK (Testing without LLAMA)\n\n")

            f.write(f"## Processing Details\n\n")

            categories = [d.name for d in self.base_dir.iterdir() if d.is_dir()]
            for category in categories:
                rag_dir = self.base_dir / category / "rag"
                if rag_dir.exists():
                    count = len(list(rag_dir.glob("*.json")))
                    f.write(f"- **{category}**: {count} documents processed\n")

            f.write(f"\n---\n")
            f.write(f"*This is mock data for testing purposes*\n")


def main():
    """Main entry point"""
    processor = MockRAGProcessor()
    processor.process_all()


if __name__ == "__main__":
    main()