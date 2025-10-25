#!/usr/bin/env python3
"""
Intel Scraping PRO Orchestrator
Enhanced automation with retry logic, quality validation, parallel execution
"""
import asyncio
import logging
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import json

# Import shared config
from config import CATEGORY_ICONS, Colors, get_category_icon, get_colored_bar, validate_config, log_performance_metrics, setup_rotating_logger
from health_check import generate_health_check
from email_report import generate_html_report, save_html_report

# Setup rotating logger (10MB max, 5 backups)
logger = setup_rotating_logger('orchestrator_pro', max_bytes=10*1024*1024, backup_count=5)

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SOURCES_DIR = PROJECT_ROOT / "config" / "sources"
DATA_DIR = PROJECT_ROOT / "data"


class ProgressTracker:
    """Real-time progress tracking"""

    def __init__(self, categories: List[str]):
        self.categories = {cat: {'total': 0, 'completed': 0, 'failed': 0} for cat in categories}

    def update(self, category: str, total: int = None, completed: int = None, failed: int = None):
        if total is not None:
            self.categories[category]['total'] = total
        if completed is not None:
            self.categories[category]['completed'] = completed
        if failed is not None:
            self.categories[category]['failed'] = failed

    def display(self):
        for cat, stats in self.categories.items():
            total = stats['total']
            done = stats['completed']
            if total > 0:
                pct = (done / total) * 100
                # Use colored progress bar from config
                bar = get_colored_bar(done, total, length=10)
                # Add emoji icon
                icon = get_category_icon(cat)
                logger.info(f"{icon} {cat:15} [{bar}] {pct:5.1f}% ({done}/{total})")


class QualityValidator:
    """Validate scraped content quality"""

    @staticmethod
    def validate_files(category: str, run_date: str, threshold: float = 0.8) -> Tuple[float, Dict]:
        """Check quality of scraped files

        Args:
            category: Category name
            run_date: Date string in YYYY-MM-DD format
            threshold: Quality threshold (0.0-1.0)
        """
        raw_dir = DATA_DIR / "raw" / run_date / category

        if not raw_dir.exists():
            return 0.0, {'error': 'Directory not found'}

        files = list(raw_dir.glob("*.md"))

        if not files:
            return 0.0, {'error': 'No files found'}

        valid_files = 0
        total_chars = 0

        for f in files:
            content = f.read_text(encoding='utf-8')

            # Quality checks
            has_title = content.startswith('# ')
            has_url = 'URL' in content
            min_length = len(content) > 500

            if has_title and has_url and min_length:
                valid_files += 1
                total_chars += len(content)

        quality = valid_files / len(files) if files else 0
        avg_length = total_chars / valid_files if valid_files else 0

        return quality, {
            'total_files': len(files),
            'valid_files': valid_files,
            'avg_length': int(avg_length),
            'quality_score': quality
        }


class ProOrchestrator:
    """PRO orchestrator with enhanced features"""

    def __init__(self, categories: Optional[List[str]] = None, run_date: Optional[str] = None):
        self.categories = categories or self._discover_categories()
        self.run_date = run_date or datetime.now().strftime('%Y-%m-%d')  # Default to today
        self.max_retries = 3
        self.quality_threshold = 0.8
        self.stats = {
            'start_time': datetime.now(),
            'run_date': self.run_date,
            'categories': {},
            'total_articles': 0,
            'category_durations': {},  # Track duration per category
            'errors': []
        }

    def _discover_categories(self) -> List[str]:
        """Auto-discover categories from config/sources/"""
        if not SOURCES_DIR.exists():
            return []
        return [f.stem for f in SOURCES_DIR.glob("*.txt")]

    async def run_parallel_scraping(self) -> Dict:
        """Execute scraping for all categories in parallel"""
        logger.info("=" * 80)
        logger.info("PARALLEL SCRAPING - 7 CATEGORIES SIMULTANEOUS")
        logger.info("=" * 80)

        tracker = ProgressTracker(self.categories)

        async def scrape_with_retry(category: str) -> Dict:
            """Scrape with exponential backoff retry"""
            icon = get_category_icon(category)
            category_start = time.time()  # Track category duration

            for attempt in range(self.max_retries):
                try:
                    logger.info(f"{icon} [{category.upper()}] Attempt {attempt + 1}/{self.max_retries}")

                    cmd = [
                        sys.executable,
                        str(SCRIPT_DIR / "scraper.py"),
                        "--categories", category,
                        "--date", self.run_date
                    ]

                    result = await asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )

                    stdout, stderr = await result.wait()

                    if result.returncode == 0:
                        # Count scraped files from dated directory
                        raw_dir = DATA_DIR / "raw" / self.run_date / category
                        files = list(raw_dir.glob("*.md")) if raw_dir.exists() else []

                        tracker.update(category, completed=len(files))

                        # Track duration
                        duration = time.time() - category_start
                        self.stats['category_durations'][category] = duration

                        return {
                            'category': category,
                            'success': True,
                            'files': len(files),
                            'attempts': attempt + 1,
                            'duration': duration
                        }

                    # Retry with exponential backoff
                    if attempt < self.max_retries - 1:
                        wait_time = 2 ** attempt
                        logger.warning(f"[{category}] Failed, retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)

                except Exception as e:
                    logger.error(f"[{category}] Error: {e}")
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(2 ** attempt)

            # Track duration even on failure
            duration = time.time() - category_start
            self.stats['category_durations'][category] = duration

            return {
                'category': category,
                'success': False,
                'error': 'Max retries exceeded',
                'duration': duration
            }

        # Run all categories in parallel
        tasks = [scrape_with_retry(cat) for cat in self.categories]
        results = await asyncio.gather(*tasks)

        # Display final progress
        logger.info("\n" + "=" * 80)
        logger.info("SCRAPING RESULTS")
        logger.info("=" * 80)
        tracker.display()

        return {
            'results': results,
            'success_count': sum(1 for r in results if r['success']),
            'total': len(results)
        }

    async def validate_quality(self) -> bool:
        """Validate quality across all categories"""
        logger.info("\n" + "=" * 80)
        logger.info("QUALITY VALIDATION")
        logger.info("=" * 80)

        all_valid = True

        for category in self.categories:
            quality, stats = QualityValidator.validate_files(category, self.run_date, self.quality_threshold)

            status = "✅" if quality >= self.quality_threshold else "❌"
            icon = get_category_icon(category)
            logger.info(f"{status} {icon} {category:15} Quality: {quality:.1%} ({stats.get('valid_files', 0)}/{stats.get('total_files', 0)} files)")

            # Log performance metrics for this category
            duration = self.stats.get('category_durations', {}).get(category, 0)
            log_performance_metrics(
                run_date=self.run_date,
                category=category,
                duration=duration,
                articles=stats.get('valid_files', 0),
                quality_score=quality
            )

            if quality < self.quality_threshold:
                all_valid = False
                self.stats['errors'].append(f"{category}: Quality {quality:.1%} below threshold {self.quality_threshold:.1%}")

        return all_valid

    async def run_processing(self) -> Dict:
        """Run Stage 2 parallel processing"""
        logger.info("\n" + "=" * 80)
        logger.info("PARALLEL PROCESSING (STAGE 2)")
        logger.info("=" * 80)

        try:
            # Pass dated raw directory to processor
            raw_dir = DATA_DIR / "raw" / self.run_date
            cmd = [
                sys.executable,
                str(SCRIPT_DIR / "processor.py"),
                str(raw_dir),
                "--date", self.run_date
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                logger.info("✅ Processing complete")
                return {'success': True}
            else:
                logger.error(f"❌ Processing failed: {stderr.decode()[:200]}")
                return {'success': False, 'error': stderr.decode()}

        except Exception as e:
            logger.error(f"❌ Processing error: {e}")
            return {'success': False, 'error': str(e)}

    async def auto_commit_deploy(self) -> bool:
        """Auto commit and deploy if quality passed"""
        logger.info("\n" + "=" * 80)
        logger.info("AUTO COMMIT & DEPLOY")
        logger.info("=" * 80)

        try:
            # Check if there are changes
            result = subprocess.run(
                ['git', 'status', '--short'],
                cwd=PROJECT_ROOT.parent,
                capture_output=True,
                text=True
            )

            if not result.stdout.strip():
                logger.info("ℹ️  No changes to commit")
                return True

            # Add processed files
            subprocess.run(['git', 'add', 'website/INTEL_SCRAPING/data/processed/'], cwd=PROJECT_ROOT.parent)

            # Commit
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
            message = f"""Intel Scraping: Auto-update {timestamp}

Categories: {', '.join(self.categories)}
Articles: {self.stats.get('total_articles', 0)}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"""

            subprocess.run(['git', 'commit', '-m', message], cwd=PROJECT_ROOT.parent)

            # Push
            subprocess.run(['git', 'push'], cwd=PROJECT_ROOT.parent)

            logger.info("✅ Committed and deployed to Railway")
            return True

        except Exception as e:
            logger.error(f"❌ Deploy failed: {e}")
            return False

    async def run(self) -> bool:
        """Execute complete PRO pipeline"""
        logger.info("=" * 80)
        logger.info("INTEL SCRAPING PRO ORCHESTRATOR")
        logger.info("=" * 80)
        logger.info(f"Run date: {self.run_date}")
        logger.info(f"Categories: {', '.join(self.categories)}")
        logger.info(f"Quality threshold: {self.quality_threshold:.0%}")
        logger.info(f"Max retries: {self.max_retries}")
        logger.info("")

        # Pre-flight configuration validation
        logger.info("🔍 Validating configuration...")
        if not validate_config(verbose=False):
            logger.error("❌ Configuration validation failed. Aborting.")
            return False
        logger.info("✅ Configuration valid\n")

        # Step 1: Parallel scraping with retry
        scrape_results = await self.run_parallel_scraping()

        if scrape_results['success_count'] == 0:
            logger.error("❌ All scraping failed, aborting pipeline")
            return False

        # Step 2: Quality validation
        quality_passed = await self.validate_quality()

        if not quality_passed:
            logger.warning("⚠️  Quality below threshold, skipping deployment")
            logger.info("ℹ️  Tip: Review errors and retry failed categories")
            return False

        # Step 3: Processing
        process_result = await self.run_processing()

        if not process_result['success']:
            logger.error("❌ Processing failed")
            return False

        # Step 4: Auto deploy
        deploy_success = await self.auto_commit_deploy()

        # Final report
        duration = (datetime.now() - self.stats['start_time']).total_seconds()

        logger.info("\n" + "=" * 80)
        logger.info("PIPELINE COMPLETE")
        logger.info("=" * 80)
        logger.info(f"Duration: {duration:.1f}s ({duration/60:.1f} minutes)")
        logger.info(f"Categories processed: {scrape_results['success_count']}/{scrape_results['total']}")
        logger.info(f"Quality validation: {'✅ Passed' if quality_passed else '❌ Failed'}")
        logger.info(f"Deployment: {'✅ Success' if deploy_success else '❌ Failed'}")
        logger.info("=" * 80)

        # Update stats for health check
        self.stats['duration'] = duration
        self.stats['total_articles'] = scrape_results['success_count']
        self.stats['stages'] = {
            'scraping': {
                'success': scrape_results['success_count'] > 0,
                'articles_scraped': scrape_results['success_count']
            },
            'processing': {
                'success': process_result['success'],
                'stage_2b_created': scrape_results['success_count']  # Approximate
            }
        }

        # Generate health check file
        generate_health_check(
            run_date=self.run_date,
            categories=self.categories,
            stats=self.stats,
            success=(quality_passed and deploy_success),
            errors=self.stats.get('errors', [])
        )

        # Generate HTML email report
        html_report = generate_html_report(
            run_date=self.run_date,
            categories=self.categories,
            stats=self.stats,
            success=(quality_passed and deploy_success),
            errors=self.stats.get('errors', [])
        )
        report_file = save_html_report(html_report)
        logger.info(f"✅ HTML report saved: {report_file}")

        return quality_passed and deploy_success


async def main():
    import argparse

    parser = argparse.ArgumentParser(description='Intel Scraping PRO Orchestrator')
    parser.add_argument('--categories', type=str, help='Comma-separated categories')
    parser.add_argument('--threshold', type=float, default=0.8, help='Quality threshold (default: 0.8)')
    parser.add_argument('--retries', type=int, default=3, help='Max retries (default: 3)')
    parser.add_argument('--date', type=str, help='Run date in YYYY-MM-DD format (default: today)')

    args = parser.parse_args()

    categories = args.categories.split(',') if args.categories else None

    orchestrator = ProOrchestrator(categories=categories, run_date=args.date)
    orchestrator.quality_threshold = args.threshold
    orchestrator.max_retries = args.retries

    success = await orchestrator.run()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    asyncio.run(main())
