#!/usr/bin/env python3
"""
CLI Interface - Swiss-Watch Precision
Command-line interface for INTEL SCRAPING system.

Usage:
    python3 -m INTEL_SCRAPING.cli.main run --all
    python3 -m INTEL_SCRAPING.cli.main run --stage scraping
    python3 -m INTEL_SCRAPING.cli.main resume
    python3 -m INTEL_SCRAPING.cli.main status
"""

import asyncio
import sys
import argparse
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from INTEL_SCRAPING.core.orchestrator import PipelineOrchestrator
from INTEL_SCRAPING.core.state_manager import StateManager
from INTEL_SCRAPING.config.settings import settings


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="INTEL SCRAPING - Swiss-Watch Precision Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run full pipeline
  %(prog)s run --all

  # Run specific stage
  %(prog)s run --stage scraping

  # Run specific category
  %(prog)s run --category ai_tech

  # Resume from failure
  %(prog)s resume

  # Check status
  %(prog)s status

  # View stats
  %(prog)s stats
"""
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # RUN command
    run_parser = subparsers.add_parser("run", help="Run pipeline")
    run_parser.add_argument("--all", action="store_true", help="Run all stages")
    run_parser.add_argument("--stage", choices=["scraping", "filtering", "rag", "content", "journal", "pdf"],
                            help="Run specific stage")
    run_parser.add_argument("--category", help="Process specific category")
    run_parser.add_argument("--incremental", action="store_true", help="Incremental mode (only new articles)")
    run_parser.add_argument("--dry-run", action="store_true", help="Dry run (no side effects)")

    # RESUME command
    resume_parser = subparsers.add_parser("resume", help="Resume from last failure")

    # STATUS command
    status_parser = subparsers.add_parser("status", help="Show pipeline status")

    # STATS command
    stats_parser = subparsers.add_parser("stats", help="Show statistics")

    # CONFIG command
    config_parser = subparsers.add_parser("config", help="Show configuration")

    args = parser.parse_args()

    if args.command == "run":
        asyncio.run(cmd_run(args))
    elif args.command == "resume":
        asyncio.run(cmd_resume())
    elif args.command == "status":
        cmd_status()
    elif args.command == "stats":
        cmd_stats()
    elif args.command == "config":
        cmd_config()
    else:
        parser.print_help()


async def cmd_run(args):
    """Run pipeline command"""
    print("🇨🇭 INTEL SCRAPING - Swiss-Watch Pipeline")
    print("=" * 60)

    orchestrator = PipelineOrchestrator()

    # Determine stages
    stages = None
    if args.stage:
        stages = [args.stage]
    elif not args.all:
        print("❌ Please specify --all or --stage")
        return

    # Determine categories
    categories = [args.category] if args.category else None

    # Determine mode
    mode = "incremental" if args.incremental else "full"

    # Run
    try:
        run = await orchestrator.run_pipeline(
            stages=stages,
            categories=categories,
            mode=mode,
            dry_run=args.dry_run
        )

        print(f"\n✅ Pipeline completed successfully!")
        print(f"   Run ID: {run.run_id}")
        print(f"   Duration: {run.duration():.1f}s")
        print(f"   Articles: {run.total_articles_scraped}")

    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        sys.exit(1)


async def cmd_resume():
    """Resume pipeline command"""
    print("🔄 Resuming pipeline from last run...")
    print("=" * 60)

    orchestrator = PipelineOrchestrator()

    try:
        run = await orchestrator.run_pipeline(mode="resume")

        print(f"\n✅ Resume completed!")
        print(f"   Run ID: {run.run_id}")
        print(f"   Duration: {run.duration():.1f}s")

    except Exception as e:
        print(f"\n❌ Resume failed: {e}")
        sys.exit(1)


def cmd_status():
    """Status command"""
    print("📊 Pipeline Status")
    print("=" * 60)

    state_mgr = StateManager(settings.state.db_path)

    # Last run
    last_run = state_mgr.get_last_run()

    if last_run:
        print(f"\n📋 Last Run:")
        print(f"   Run ID: {last_run.run_id}")
        print(f"   Status: {last_run.status}")
        print(f"   Started: {last_run.started_at.isoformat()}")
        if last_run.completed_at:
            print(f"   Completed: {last_run.completed_at.isoformat()}")
            print(f"   Duration: {last_run.duration():.1f}s")
        print(f"   Articles: {last_run.total_articles_scraped}")
    else:
        print("\n   No runs found")

    # Can resume?
    can_resume = state_mgr.can_resume()
    if can_resume:
        print(f"\n🔄 Can resume from failed run")
    else:
        print(f"\n✅ No pending work")


def cmd_stats():
    """Stats command"""
    print("📊 Pipeline Statistics")
    print("=" * 60)

    state_mgr = StateManager(settings.state.db_path)
    stats = state_mgr.get_stats()

    print(f"\n📈 All-Time Stats:")
    print(f"   Total runs: {stats['total_runs']}")
    print(f"   Successful: {stats['successful_runs']}")
    print(f"   Failed: {stats['failed_runs']}")
    print(f"   Running: {stats['running_runs']}")
    print(f"   Success rate: {stats['success_rate']*100:.1f}%")
    print(f"   Total articles: {stats['total_articles_scraped']}")


def cmd_config():
    """Config command"""
    print("⚙️  Configuration")
    print("=" * 60)

    print(f"\n🔧 Scraper:")
    print(f"   Max articles/source: {settings.scraper.max_articles_per_source}")
    print(f"   Max article age: {settings.scraper.max_content_age_days} days")
    print(f"   Timeout: {settings.scraper.timeout_seconds}s")
    print(f"   Concurrent sites: {settings.scraper.concurrent_sites}")

    print(f"\n🤖 RunPod:")
    print(f"   Endpoint: {settings.runpod.endpoint}")
    print(f"   Timeout: {settings.runpod.timeout_minutes} min")
    print(f"   Max articles: {settings.runpod.max_articles_for_journal}")

    print(f"\n🔥 Filters:")
    print(f"   Quality threshold: {settings.filters.quality_threshold}")
    print(f"   Max age: {settings.filters.max_article_age_days} days")
    print(f"   Dedup cache: {settings.filters.cache_backend}")

    print(f"\n💾 State:")
    print(f"   Backend: {settings.state.backend}")
    print(f"   Database: {settings.state.db_path}")
    print(f"   Resume enabled: {settings.state.enable_resume}")


if __name__ == "__main__":
    main()
