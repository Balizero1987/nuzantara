#!/usr/bin/env python3
"""
Intel Automation Pipeline - Main Orchestrator
Runs the complete 5-stage pipeline for automated intelligence gathering.

Usage:
    python3 run_intel_automation.py [--skip stage1,stage2] [--categories cat1,cat2]

Stages:
    1. Scraping: Crawl4AI scrapes all sources
    2. AI Processing: Claude API processes raw data → JSON (ChromaDB) + MD (team)
    3. Editorial Review: (SKIPPED - manual for now)
    4. Publishing: (SKIPPED - manual for now)
    5. Email Notifications: Send processed articles to team
"""

import argparse
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('intel_automation.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_PATH = PROJECT_ROOT / "config" / "categories_v2.json"
OUTPUT_BASE = SCRIPT_DIR / "INTEL_SCRAPING"


class IntelAutomationPipeline:
    """Main orchestrator for intel automation pipeline."""

    def __init__(self, skip_stages: List[str] = None, categories: List[str] = None):
        self.skip_stages = skip_stages or []
        self.categories = categories  # None = all categories
        self.config = self._load_config()
        self.stats = {
            "start_time": datetime.now(),
            "stages": {},
            "total_articles": 0,
            "errors": []
        }

    def _load_config(self) -> dict:
        """Load categories configuration."""
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            sys.exit(1)

    def run(self) -> bool:
        """Run the complete pipeline."""
        logger.info("=" * 80)
        logger.info("INTEL AUTOMATION PIPELINE - START")
        logger.info("=" * 80)
        logger.info(f"Skip stages: {self.skip_stages or 'None'}")
        logger.info(f"Categories: {self.categories or 'All'}")
        logger.info("")

        success = True

        # Stage 1: Scraping
        if "stage1" not in self.skip_stages and "scraping" not in self.skip_stages:
            success = success and self._run_stage1_scraping()
        else:
            logger.info("⏭️  Skipping Stage 1: Scraping")

        # Stage 2: AI Processing
        if "stage2" not in self.skip_stages and "processing" not in self.skip_stages:
            success = success and self._run_stage2_processing()
        else:
            logger.info("⏭️  Skipping Stage 2: AI Processing")

        # Stage 3: Editorial (STANDBY)
        logger.info("⏭️  Stage 3: Editorial (STANDBY - not in production)")

        # Stage 4: Publishing (STANDBY)
        logger.info("⏭️  Stage 4: Multi-Channel Publishing (STANDBY - not in production)")

        # NOTE: Email notifications now handled by Stage 2B
        logger.info("ℹ️  Email workflow integrated in Stage 2B (parallel processing)")

        # Final report
        self._print_report()

        return success

    def _run_stage1_scraping(self) -> bool:
        """Stage 1: Run Crawl4AI scraper."""
        logger.info("=" * 80)
        logger.info("STAGE 1: SCRAPING")
        logger.info("=" * 80)

        start_time = datetime.now()

        try:
            import subprocess

            scraper_path = SCRIPT_DIR / "crawl4ai_scraper.py"

            if not scraper_path.exists():
                logger.error(f"❌ Scraper not found: {scraper_path}")
                self.stats['errors'].append("Stage 1: Scraper script not found")
                return False

            logger.info(f"Running scraper: {scraper_path}")
            logger.info("This may take 10-30 minutes depending on sources...")

            # Run scraper as subprocess
            result = subprocess.run(
                [sys.executable, str(scraper_path)],
                cwd=str(SCRIPT_DIR),
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour timeout
            )

            if result.returncode != 0:
                logger.error(f"❌ Scraper failed with code {result.returncode}")
                logger.error(f"STDERR: {result.stderr[:500]}")
                self.stats['errors'].append(f"Stage 1: Exit code {result.returncode}")
                return False

            # Check for output files
            raw_files = list(OUTPUT_BASE.rglob("*/raw/*.json"))
            articles_count = len(raw_files)

            self.stats['stages']['scraping'] = {
                'duration': (datetime.now() - start_time).total_seconds(),
                'success': True,
                'articles_scraped': articles_count,
                'raw_files': articles_count
            }

            logger.info(f"✅ Stage 1 complete: {articles_count} raw files created")
            return True

        except subprocess.TimeoutExpired:
            logger.error("❌ Stage 1 timeout (>1 hour)")
            self.stats['errors'].append("Stage 1: Timeout")
            return False
        except Exception as e:
            logger.error(f"❌ Stage 1 failed: {e}")
            self.stats['errors'].append(f"Stage 1: {str(e)}")
            return False

    def _run_stage2_processing(self) -> bool:
        """Stage 2: PARALLEL processing (2A RAG + 2B Content IN CONTEMPORANEA)."""
        logger.info("")
        logger.info("=" * 80)
        logger.info("STAGE 2: PARALLEL PROCESSING (2A + 2B IN CONTEMPORANEA)")
        logger.info("=" * 80)

        start_time = datetime.now()

        try:
            # Check for raw markdown files
            raw_files = list(OUTPUT_BASE.rglob("*/raw/*.md"))
            logger.info(f"Found {len(raw_files)} raw markdown files to process")

            if not raw_files:
                logger.warning("⚠️  No raw files found, skipping AI processing")
                return True

            # Import parallel processor
            try:
                import asyncio
                import sys
                sys.path.insert(0, str(SCRIPT_DIR / 'bali-intel-scraper' / 'scripts'))

                from stage2_parallel_processor import run_stage2_parallel

                # Run parallel processing
                results = asyncio.run(run_stage2_parallel(raw_files))

                self.stats['stages']['processing'] = {
                    'duration': results.get('duration', 0),
                    'success': True,
                    'total_files': results.get('total_files', 0),
                    'stage_2a_processed': results.get('stage_2a', {}).get('processed', 0),
                    'stage_2b_created': results.get('stage_2b', {}).get('created', 0),
                    'emails_sent': results.get('stage_2b', {}).get('emails_sent', 0),
                    'mode': 'parallel'
                }

                logger.info(f"✅ Stage 2 parallel complete:")
                logger.info(f"   - RAG: {results.get('stage_2a', {}).get('processed', 0)} processed")
                logger.info(f"   - Content: {results.get('stage_2b', {}).get('created', 0)} articles created")
                logger.info(f"   - Emails: {results.get('stage_2b', {}).get('emails_sent', 0)} sent")
                return True

            except ImportError as e:
                logger.error(f"❌ stage2_parallel_processor.py not found: {e}")
                logger.info("   Please ensure the script exists in bali-intel-scraper/scripts/")
                self.stats['errors'].append(f"Stage 2: Import failed - {str(e)}")
                return False

        except Exception as e:
            logger.error(f"❌ Stage 2 failed: {e}")
            self.stats['errors'].append(f"Stage 2: {str(e)}")
            return False

    def _run_stage5_email(self) -> bool:
        """Stage 5: Send email notifications."""
        logger.info("")
        logger.info("=" * 80)
        logger.info("STAGE 5: EMAIL NOTIFICATIONS")
        logger.info("=" * 80)

        start_time = datetime.now()

        try:
            # Check for markdown files
            markdown_dir = OUTPUT_BASE / "markdown_articles"
            if not markdown_dir.exists():
                logger.warning("⚠️  No markdown articles found, skipping email")
                return True

            md_files = list(markdown_dir.rglob("*.md"))
            logger.info(f"Found {len(md_files)} markdown articles")

            # For now, just log (email implementation coming)
            logger.info("📧 Email notifications: PLACEHOLDER (not yet implemented)")
            logger.info(f"   Would send {len(md_files)} articles to team members")

            self.stats['stages']['email'] = {
                'duration': (datetime.now() - start_time).total_seconds(),
                'success': True,
                'emails_sent': 0,
                'articles_ready': len(md_files),
                'status': 'placeholder'
            }

            logger.info("✅ Stage 5 complete (placeholder)")
            return True

        except Exception as e:
            logger.error(f"❌ Stage 5 failed: {e}")
            self.stats['errors'].append(f"Stage 5: {str(e)}")
            return False

    def _print_report(self):
        """Print final execution report."""
        end_time = datetime.now()
        duration = (end_time - self.stats['start_time']).total_seconds()

        logger.info("")
        logger.info("=" * 80)
        logger.info("INTEL AUTOMATION PIPELINE - REPORT")
        logger.info("=" * 80)
        logger.info(f"Total duration: {duration:.1f}s ({duration/60:.1f} minutes)")
        logger.info("")

        for stage, stats in self.stats['stages'].items():
            status = "✅" if stats.get('success') else "❌"
            logger.info(f"{status} {stage.upper()}: {stats.get('duration', 0):.1f}s")
            for key, value in stats.items():
                if key not in ['duration', 'success']:
                    logger.info(f"   - {key}: {value}")

        if self.stats['errors']:
            logger.info("")
            logger.info("ERRORS:")
            for error in self.stats['errors']:
                logger.error(f"   - {error}")

        logger.info("=" * 80)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Intel Automation Pipeline')
    parser.add_argument(
        '--skip',
        type=str,
        help='Stages to skip (comma-separated: stage1,stage2,stage5 or scraping,processing,email)'
    )
    parser.add_argument(
        '--categories',
        type=str,
        help='Categories to process (comma-separated). Default: all'
    )

    args = parser.parse_args()

    skip_stages = args.skip.split(',') if args.skip else []
    categories = args.categories.split(',') if args.categories else None

    pipeline = IntelAutomationPipeline(
        skip_stages=skip_stages,
        categories=categories
    )

    success = pipeline.run()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
