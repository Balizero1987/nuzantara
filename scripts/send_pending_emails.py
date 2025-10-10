#!/usr/bin/env python3
"""
Local Email Sender - Runs on Antonio's machine
Reads articles from INTEL_SCRAPING and sends emails to team.

Usage:
    python3 send_pending_emails.py [--dry-run]
"""

import argparse
import json
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
INTEL_BASE = SCRIPT_DIR / "INTEL_SCRAPING"
SENT_LOG = SCRIPT_DIR / ".emails_sent.json"

# Import email sender
sys.path.insert(0, str(PROJECT_ROOT / 'apps' / 'bali-intel-scraper' / 'scripts'))
from send_intel_email import send_intel_email, REGULAR_CATEGORIES, LLAMA_CATEGORIES


def load_sent_log():
    """Load log of already-sent emails."""
    if not SENT_LOG.exists():
        return {}

    try:
        with open(SENT_LOG, 'r') as f:
            return json.load(f)
    except:
        return {}


def save_sent_log(sent_log):
    """Save log of sent emails."""
    with open(SENT_LOG, 'w') as f:
        json.dump(sent_log, f, indent=2)


def get_category_from_path(article_path: Path) -> str:
    """Extract category from article path."""
    # Path: INTEL_SCRAPING/immigration/articles/article.md
    return article_path.parent.parent.name


def find_pending_articles(hours_back: int = 24):
    """Find articles created in last N hours that haven't been emailed."""
    sent_log = load_sent_log()
    pending = []

    cutoff_time = datetime.now() - timedelta(hours=hours_back)

    # Find all article files
    article_files = list(INTEL_BASE.rglob("*/articles/*.md"))

    logger.info(f"Found {len(article_files)} total articles")

    for article_path in article_files:
        # Check if already sent
        article_key = str(article_path.relative_to(SCRIPT_DIR))
        if article_key in sent_log:
            continue

        # Check if recent
        if article_path.stat().st_mtime < cutoff_time.timestamp():
            continue

        # Extract category
        category = get_category_from_path(article_path)

        # Validate category exists
        if category not in REGULAR_CATEGORIES and category not in LLAMA_CATEGORIES:
            logger.warning(f"Unknown category '{category}' for {article_path.name}")
            continue

        pending.append({
            'path': article_path,
            'category': category,
            'key': article_key
        })

    logger.info(f"Found {len(pending)} pending articles to email")
    return pending


def send_pending_emails(dry_run: bool = False):
    """Send emails for all pending articles."""
    pending = find_pending_articles()

    if not pending:
        logger.info("✅ No pending emails to send")
        return 0

    sent_log = load_sent_log()
    success_count = 0
    fail_count = 0

    logger.info(f"{'[DRY RUN] ' if dry_run else ''}Sending {len(pending)} emails...")
    print()

    for item in pending:
        article_path = item['path']
        category_key = item['category']
        article_key = item['key']

        logger.info(f"📧 {category_key}: {article_path.name}")

        if dry_run:
            logger.info(f"   [DRY RUN] Would send email")
            success_count += 1
        else:
            # Send email
            success = send_intel_email(
                category_key=category_key,
                article_file=str(article_path),
                article_data=None  # Could parse from article frontmatter if needed
            )

            if success:
                sent_log[article_key] = {
                    'sent_at': datetime.now().isoformat(),
                    'category': category_key,
                    'article': article_path.name
                }
                success_count += 1
            else:
                fail_count += 1

        print()

    # Save sent log
    if not dry_run and success_count > 0:
        save_sent_log(sent_log)
        logger.info(f"📝 Updated sent log: {SENT_LOG}")

    # Summary
    logger.info("=" * 70)
    logger.info("EMAIL SUMMARY")
    logger.info("=" * 70)
    logger.info(f"✅ Sent: {success_count}")
    logger.info(f"❌ Failed: {fail_count}")
    logger.info(f"📊 Total: {len(pending)}")
    logger.info("=" * 70)

    return 0 if fail_count == 0 else 1


def main():
    parser = argparse.ArgumentParser(description='Send pending intel emails')
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview emails without sending'
    )
    parser.add_argument(
        '--hours',
        type=int,
        default=24,
        help='Look back N hours for articles (default: 24)'
    )

    args = parser.parse_args()

    logger.info("=" * 70)
    logger.info("📧 INTEL EMAIL SENDER (Local)")
    logger.info("=" * 70)
    logger.info(f"Dry run: {args.dry_run}")
    logger.info(f"Looking back: {args.hours} hours")
    logger.info("")

    exit_code = send_pending_emails(dry_run=args.dry_run)

    sys.exit(exit_code)


if __name__ == '__main__':
    main()
