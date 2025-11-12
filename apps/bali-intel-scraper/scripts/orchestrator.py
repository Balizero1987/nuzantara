"""
BALI ZERO JOURNAL ORCHESTRATOR
Complete pipeline: Scraping → Filtering → Article Generation → ChromaDB Upload

Handles 600+ sources across 12 categories
Cost: ~$0.0004 per article (91% cheaper than Claude-only)
"""

import os
import json
from pathlib import Path
from datetime import datetime
import time
from typing import List, Dict, Optional
from loguru import logger
import argparse

# Import our modules
from unified_scraper import BaliZeroScraper
from ai_journal_generator import AIJournalGenerator


class BaliZeroOrchestrator:
    """
    Complete orchestration of Bali Zero Intelligence System
    Stage 1: Web Scraping (600+ sources)
    Stage 2: AI Filtering & Article Generation (Llama + Gemini + Claude)
    Stage 3: ChromaDB Upload (optional)
    """

    def __init__(
        self,
        config_path: str = "config/categories.json",
        dry_run: bool = False
    ):
        self.config_path = config_path
        self.dry_run = dry_run

        # Initialize components
        self.scraper = BaliZeroScraper(config_path=config_path)
        self.generator = AIJournalGenerator()

        # Directories
        self.raw_dir = Path("data/raw")
        self.articles_dir = Path("data/articles")
        self.articles_dir.mkdir(parents=True, exist_ok=True)

        logger.info("🚀 Bali Zero Orchestrator initialized")

    def run_stage1_scraping(
        self,
        categories: Optional[List[str]] = None,
        limit: int = 10
    ) -> Dict:
        """
        STAGE 1: Web Scraping
        Scrapes 600+ sources across 12 categories
        """

        logger.info("=" * 70)
        logger.info("📰 STAGE 1: WEB SCRAPING")
        logger.info("=" * 70)

        if self.dry_run:
            logger.warning("⚠️  DRY RUN MODE - Skipping actual scraping")
            return {"success": True, "dry_run": True}

        results = self.scraper.scrape_all_categories(
            limit=limit,
            categories=categories
        )

        logger.success(f"✅ Stage 1 complete: {results['total_scraped']} items scraped")

        return results

    def run_stage2_generation(
        self,
        categories: Optional[List[str]] = None,
        max_articles: int = 100
    ) -> Dict:
        """
        STAGE 2: AI Article Generation
        Transforms raw scraped content into professional journal articles
        Uses 3-tier AI fallback for optimal cost/quality
        """

        logger.info("=" * 70)
        logger.info("🤖 STAGE 2: AI ARTICLE GENERATION")
        logger.info("=" * 70)

        if self.dry_run:
            logger.warning("⚠️  DRY RUN MODE - Skipping article generation")
            return {"success": True, "dry_run": True}

        # Find all raw files
        raw_files = []

        if categories:
            for category in categories:
                category_dir = self.raw_dir / category
                if category_dir.exists():
                    raw_files.extend(list(category_dir.glob("*.md")))
        else:
            raw_files = list(self.raw_dir.glob("**/*.md"))

        logger.info(f"📄 Found {len(raw_files)} raw files to process")

        # Limit processing
        if len(raw_files) > max_articles:
            logger.warning(f"⚠️  Limiting to {max_articles} articles")
            raw_files = raw_files[:max_articles]

        # Process each file
        processed = 0
        failed = 0

        for raw_file in raw_files:
            logger.info(f"\n📝 Processing: {raw_file.name}")

            result = self.generator.generate_article(
                raw_file=raw_file,
                output_dir=self.articles_dir
            )

            if result['success']:
                processed += 1
            else:
                failed += 1

            time.sleep(2)  # Rate limiting

        # Get final metrics
        metrics = self.generator.get_metrics()

        logger.info("=" * 70)
        logger.success(f"✅ STAGE 2 COMPLETE")
        logger.info(f"📊 Processed: {processed}")
        logger.info(f"❌ Failed: {failed}")
        logger.info(f"💰 Total Cost: ${metrics['total_cost_usd']:.4f}")
        logger.info(f"💰 Avg Cost/Article: ${metrics['avg_cost_per_article']:.6f}")
        logger.info(f"💰 Savings vs Haiku-only: {metrics['savings_percentage']}")
        logger.info(f"🦙 Llama Success Rate: {metrics['llama_success_rate']}")
        logger.info("=" * 70)

        return {
            "success": True,
            "processed": processed,
            "failed": failed,
            "metrics": metrics
        }

    def run_stage3_chromadb_upload(self) -> Dict:
        """
        STAGE 3: ChromaDB Upload (OPTIONAL)
        Uploads generated articles to ChromaDB for RAG queries
        """

        logger.info("=" * 70)
        logger.info("📊 STAGE 3: CHROMADB UPLOAD")
        logger.info("=" * 70)

        # TODO: Implement ChromaDB upload
        # This would integrate with backend-rag ChromaDB collections

        logger.warning("⚠️  ChromaDB upload not yet implemented")
        logger.info("💡 Articles are available in: data/articles/")

        return {"success": True, "uploaded": 0}

    def run_full_pipeline(
        self,
        categories: Optional[List[str]] = None,
        scrape_limit: int = 10,
        max_articles: int = 100,
        skip_scraping: bool = False,
        skip_generation: bool = False,
        skip_upload: bool = True
    ) -> Dict:
        """
        Run the complete pipeline
        """

        logger.info("=" * 80)
        logger.info("🌟 BALI ZERO JOURNAL - FULL PIPELINE EXECUTION")
        logger.info("=" * 80)

        start_time = time.time()
        results = {}

        # Stage 1: Scraping
        if not skip_scraping:
            results['stage1'] = self.run_stage1_scraping(
                categories=categories,
                limit=scrape_limit
            )
        else:
            logger.warning("⏭️  Skipping Stage 1 (Scraping)")
            results['stage1'] = {"skipped": True}

        # Stage 2: Article Generation
        if not skip_generation:
            results['stage2'] = self.run_stage2_generation(
                categories=categories,
                max_articles=max_articles
            )
        else:
            logger.warning("⏭️  Skipping Stage 2 (Generation)")
            results['stage2'] = {"skipped": True}

        # Stage 3: ChromaDB Upload
        if not skip_upload:
            results['stage3'] = self.run_stage3_chromadb_upload()
        else:
            logger.warning("⏭️  Skipping Stage 3 (ChromaDB)")
            results['stage3'] = {"skipped": True}

        duration = time.time() - start_time

        # Final Summary
        logger.info("=" * 80)
        logger.success("🎉 PIPELINE COMPLETE")
        logger.info(f"⏱️  Total Duration: {duration:.1f}s")
        logger.info(f"📊 Summary:")

        if not skip_scraping and 'stage1' in results and not results['stage1'].get('skipped'):
            logger.info(f"  Stage 1 - Scraped: {results['stage1'].get('total_scraped', 0)} items")

        if not skip_generation and 'stage2' in results and not results['stage2'].get('skipped'):
            s2 = results['stage2']
            logger.info(f"  Stage 2 - Generated: {s2.get('processed', 0)} articles")
            if 'metrics' in s2:
                logger.info(f"  Stage 2 - Cost: ${s2['metrics']['total_cost_usd']:.4f}")
                logger.info(f"  Stage 2 - Savings: {s2['metrics']['savings_percentage']}")

        logger.info(f"📁 Output Directories:")
        logger.info(f"  Raw scraped data: data/raw/")
        logger.info(f"  Generated articles: data/articles/")
        logger.info("=" * 80)

        return {
            "success": True,
            "duration_seconds": duration,
            "results": results
        }


def main():
    parser = argparse.ArgumentParser(description="Bali Zero Journal Orchestrator")

    # Pipeline control
    parser.add_argument('--stage', choices=['all', '1', '2', '3'], default='all',
                        help='Which stage to run')
    parser.add_argument('--categories', nargs='+',
                        help='Specific categories to process')
    parser.add_argument('--scrape-limit', type=int, default=10,
                        help='Max items to scrape per category')
    parser.add_argument('--max-articles', type=int, default=100,
                        help='Max articles to generate')
    parser.add_argument('--dry-run', action='store_true',
                        help='Dry run mode (no actual scraping/generation)')

    # Skipping options
    parser.add_argument('--skip-scraping', action='store_true',
                        help='Skip scraping stage')
    parser.add_argument('--skip-generation', action='store_true',
                        help='Skip article generation stage')
    parser.add_argument('--skip-upload', action='store_true', default=True,
                        help='Skip ChromaDB upload stage')

    args = parser.parse_args()

    # Initialize orchestrator
    orchestrator = BaliZeroOrchestrator(dry_run=args.dry_run)

    # Run based on stage selection
    if args.stage == 'all':
        orchestrator.run_full_pipeline(
            categories=args.categories,
            scrape_limit=args.scrape_limit,
            max_articles=args.max_articles,
            skip_scraping=args.skip_scraping,
            skip_generation=args.skip_generation,
            skip_upload=args.skip_upload
        )
    elif args.stage == '1':
        orchestrator.run_stage1_scraping(
            categories=args.categories,
            limit=args.scrape_limit
        )
    elif args.stage == '2':
        orchestrator.run_stage2_generation(
            categories=args.categories,
            max_articles=args.max_articles
        )
    elif args.stage == '3':
        orchestrator.run_stage3_chromadb_upload()


if __name__ == "__main__":
    main()
