#!/usr/bin/env python3
"""
INTEL AUTOMATION - Main Orchestration Script
Runs the complete intel automation pipeline
"""

import asyncio
import os
import sys
import argparse
import subprocess
from datetime import datetime
from pathlib import Path
import logging
import json

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'intel_automation_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Import all stages
sys.path.insert(0, str(Path(__file__).parent))

from crawl4ai_scraper import IntelScraper
from llama_rag_processor import LlamaRAGProcessor
from llama_content_creator import LlamaContentCreator
from editorial_ai import EditorialAI
from multi_channel_publisher import MultiChannelPublisher

class IntelAutomationOrchestrator:
    """Main orchestrator for the intel automation pipeline"""

    def __init__(self, skip_stages=None):
        self.skip_stages = skip_stages or []
        self.results = {}
        self.start_time = datetime.now()

    async def run_stage_1_scraping(self):
        """Stage 1: Web Scraping"""
        if 'scraping' in self.skip_stages:
            logger.info("Skipping Stage 1: Scraping")
            return True

        logger.info("=" * 70)
        logger.info("STAGE 1: WEB SCRAPING")
        logger.info("=" * 70)

        try:
            scraper = IntelScraper()
            await scraper.scrape_all()
            self.results['scraping'] = {
                'status': 'success',
                'completed_at': datetime.now().isoformat()
            }
            return True
        except Exception as e:
            logger.error(f"Scraping failed: {e}")
            self.results['scraping'] = {
                'status': 'failed',
                'error': str(e)
            }
            return False

    def run_stage_2a_rag_processing(self):
        """Stage 2A: RAG Processing with LLAMA"""
        if 'rag' in self.skip_stages:
            logger.info("Skipping Stage 2A: RAG Processing")
            return True

        logger.info("=" * 70)
        logger.info("STAGE 2A: RAG PROCESSING")
        logger.info("=" * 70)

        try:
            processor = LlamaRAGProcessor()
            processor.process_all()
            self.results['rag_processing'] = {
                'status': 'success',
                'completed_at': datetime.now().isoformat()
            }
            return True
        except Exception as e:
            logger.error(f"RAG processing failed: {e}")
            self.results['rag_processing'] = {
                'status': 'failed',
                'error': str(e)
            }
            return False

    def run_stage_2b_content_creation(self):
        """Stage 2B: Content Creation with LLAMA"""
        if 'content' in self.skip_stages:
            logger.info("Skipping Stage 2B: Content Creation")
            return True

        logger.info("=" * 70)
        logger.info("STAGE 2B: CONTENT CREATION")
        logger.info("=" * 70)

        try:
            creator = LlamaContentCreator()
            creator.process_all()
            self.results['content_creation'] = {
                'status': 'success',
                'completed_at': datetime.now().isoformat()
            }
            return True
        except Exception as e:
            logger.error(f"Content creation failed: {e}")
            self.results['content_creation'] = {
                'status': 'failed',
                'error': str(e)
            }
            return False

    def run_stage_3_editorial(self):
        """Stage 3: Editorial Review with Claude Opus"""
        if 'editorial' in self.skip_stages:
            logger.info("Skipping Stage 3: Editorial Review")
            return True

        logger.info("=" * 70)
        logger.info("STAGE 3: EDITORIAL REVIEW")
        logger.info("=" * 70)

        # Check for API key
        if not os.environ.get("ANTHROPIC_API_KEY"):
            logger.warning("ANTHROPIC_API_KEY not set. Skipping editorial review.")
            logger.info("To enable editorial review, set: export ANTHROPIC_API_KEY='your-key'")
            self.results['editorial'] = {
                'status': 'skipped',
                'reason': 'No API key'
            }
            return True

        try:
            editor = EditorialAI()
            approved = editor.process_all()
            self.results['editorial'] = {
                'status': 'success',
                'approved_count': len(approved),
                'completed_at': datetime.now().isoformat()
            }
            return True
        except Exception as e:
            logger.error(f"Editorial review failed: {e}")
            self.results['editorial'] = {
                'status': 'failed',
                'error': str(e)
            }
            return False

    def run_stage_4_publishing(self):
        """Stage 4: Multi-Channel Publishing"""
        if 'publishing' in self.skip_stages:
            logger.info("Skipping Stage 4: Publishing")
            return True

        logger.info("=" * 70)
        logger.info("STAGE 4: MULTI-CHANNEL PUBLISHING")
        logger.info("=" * 70)

        try:
            publisher = MultiChannelPublisher()
            publisher.publish_all_approved()
            self.results['publishing'] = {
                'status': 'success',
                'completed_at': datetime.now().isoformat()
            }
            return True
        except Exception as e:
            logger.error(f"Publishing failed: {e}")
            self.results['publishing'] = {
                'status': 'failed',
                'error': str(e)
            }
            return False

    def check_dependencies(self):
        """Check if all required dependencies are installed"""
        logger.info("Checking dependencies...")

        dependencies = {
            'crawl4ai': 'pip install crawl4ai',
            'ollama': 'pip install ollama',
            'chromadb': 'pip install chromadb',
            'anthropic': 'pip install anthropic',
            'requests': 'pip install requests'
        }

        missing = []
        for module, install_cmd in dependencies.items():
            try:
                __import__(module)
                logger.info(f"✓ {module}")
            except ImportError:
                logger.warning(f"✗ {module} - Install with: {install_cmd}")
                missing.append(module)

        # Check Ollama installation
        try:
            result = subprocess.run(['ollama', 'list'], capture_output=True, text=True)
            if result.returncode == 0:
                logger.info("✓ Ollama CLI")
                # Check for LLAMA model
                if 'llama3.2' not in result.stdout:
                    logger.warning("✗ LLAMA 3.2 model not found. Run: ollama pull llama3.2:3b")
            else:
                logger.warning("✗ Ollama CLI not found. Install from: https://ollama.com")
        except FileNotFoundError:
            logger.warning("✗ Ollama CLI not found. Install from: https://ollama.com")

        return len(missing) == 0

    async def run_pipeline(self):
        """Run the complete pipeline"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION PIPELINE")
        logger.info(f"Started at: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        # Check dependencies
        if not self.check_dependencies():
            logger.warning("Some dependencies are missing. Install them to run all stages.")

        # Run each stage
        stages = [
            ('Stage 1: Scraping', self.run_stage_1_scraping),
            ('Stage 2A: RAG Processing', self.run_stage_2a_rag_processing),
            ('Stage 2B: Content Creation', self.run_stage_2b_content_creation),
            ('Stage 3: Editorial Review', self.run_stage_3_editorial),
            ('Stage 4: Publishing', self.run_stage_4_publishing)
        ]

        for stage_name, stage_func in stages:
            logger.info(f"\nStarting {stage_name}...")

            # Handle async functions
            if asyncio.iscoroutinefunction(stage_func):
                success = await stage_func()
            else:
                success = stage_func()

            if not success and stage_name != 'Stage 3: Editorial Review':
                logger.error(f"{stage_name} failed. Stopping pipeline.")
                break

        # Generate final report
        self.generate_final_report()

    def generate_final_report(self):
        """Generate final execution report"""
        end_time = datetime.now()
        duration = end_time - self.start_time

        report_file = Path(__file__).parent.parent / "INTEL_SCRAPING" / f"pipeline_report_{self.start_time.strftime('%Y%m%d_%H%M%S')}.json"

        report = {
            'start_time': self.start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_seconds': duration.total_seconds(),
            'stages': self.results
        }

        # Save report
        report_file.parent.mkdir(exist_ok=True)
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        # Print summary
        logger.info("=" * 70)
        logger.info("PIPELINE COMPLETE")
        logger.info(f"Duration: {duration}")
        logger.info("Results:")

        for stage, result in self.results.items():
            status = result.get('status', 'unknown')
            emoji = "✅" if status == 'success' else "❌" if status == 'failed' else "⏭️"
            logger.info(f"  {emoji} {stage}: {status}")

        logger.info(f"\nReport saved: {report_file}")
        logger.info("=" * 70)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Run Intel Automation Pipeline')

    parser.add_argument(
        '--skip',
        nargs='+',
        choices=['scraping', 'rag', 'content', 'editorial', 'publishing'],
        help='Stages to skip'
    )

    parser.add_argument(
        '--stage',
        choices=['scraping', 'rag', 'content', 'editorial', 'publishing', 'all'],
        default='all',
        help='Run specific stage only'
    )

    parser.add_argument(
        '--test',
        action='store_true',
        help='Run in test mode with limited sources'
    )

    args = parser.parse_args()

    # Determine which stages to skip
    skip_stages = args.skip or []

    if args.stage != 'all':
        # Skip all stages except the specified one
        all_stages = ['scraping', 'rag', 'content', 'editorial', 'publishing']
        skip_stages = [s for s in all_stages if s != args.stage]

    # Set test mode if requested
    if args.test:
        os.environ['INTEL_TEST_MODE'] = '1'
        logger.info("Running in TEST MODE - Limited sources")

    # Run orchestrator
    orchestrator = IntelAutomationOrchestrator(skip_stages=skip_stages)

    # Run the pipeline
    asyncio.run(orchestrator.run_pipeline())


if __name__ == "__main__":
    main()