#!/usr/bin/env python3
"""
Pipeline Orchestrator - Swiss-Watch Precision
Main pipeline controller with state management and resume capability.

Features:
- Full pipeline execution
- Stage-by-stage execution
- Resume from failures
- Incremental updates
- Parallel processing
- Comprehensive monitoring
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path

from INTEL_SCRAPING.config.settings import settings
from INTEL_SCRAPING.core.models import PipelineRun, PipelineStage, Article
from INTEL_SCRAPING.core.state_manager import StateManager

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """
    🇨🇭 Swiss-Watch Precision Pipeline Orchestrator

    The heart of the scraping system.

    Capabilities:
    - Execute full pipeline or individual stages
    - Resume from failures
    - Incremental updates (only new content)
    - Parallel execution
    - State persistence
    - Comprehensive metrics
    """

    def __init__(self, config=None):
        self.config = config or settings
        self.state_mgr = StateManager(self.config.state.db_path)
        self.current_run: Optional[PipelineRun] = None

    async def run_pipeline(
        self,
        stages: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        mode: str = "full",  # full | incremental | resume
        dry_run: bool = False
    ) -> PipelineRun:
        """
        Execute the scraping pipeline.

        Args:
            stages: List of stages to run (None = all)
            categories: List of categories to process (None = all)
            mode: Execution mode (full|incremental|resume)
            dry_run: Don't make changes, just simulate

        Returns:
            PipelineRun with execution results

        Examples:
            # Full run
            await orchestrator.run_pipeline()

            # Resume from failure
            await orchestrator.run_pipeline(mode="resume")

            # Only scraping stage
            await orchestrator.run_pipeline(stages=["scraping"])

            # Specific category
            await orchestrator.run_pipeline(categories=["ai_tech"])
        """
        logger.info("=" * 80)
        logger.info("🇨🇭 INTEL SCRAPING - Swiss-Watch Pipeline")
        logger.info("=" * 80)

        # Handle resume
        if mode == "resume":
            return await self._resume_pipeline()

        # Create new run
        run = self.state_mgr.create_run(metadata={
            "mode": mode,
            "stages": stages,
            "categories": categories,
            "dry_run": dry_run
        })
        self.current_run = run

        logger.info(f"📋 Run ID: {run.run_id}")
        logger.info(f"🕐 Started: {run.started_at.isoformat()}")
        logger.info(f"📁 Mode: {mode}")

        try:
            # Define stages to execute
            all_stages = [
                PipelineStage.SCRAPING,
                PipelineStage.FILTERING,
                PipelineStage.RAG_PROCESSING,
                PipelineStage.CONTENT_CREATION,
                PipelineStage.JOURNAL_GENERATION,
                PipelineStage.PDF_EXPORT
            ]

            stages_to_run = [
                stage for stage in all_stages
                if stages is None or stage.value in stages
            ]

            logger.info(f"🎯 Stages: {[s.value for s in stages_to_run]}")

            # Execute each stage
            for stage in stages_to_run:
                logger.info(f"\n{'=' * 80}")
                logger.info(f"🔧 Stage: {stage.value.upper()}")
                logger.info(f"{'=' * 80}")

                await self._execute_stage(stage, categories, dry_run)

                run.stages_completed.append(stage)
                self.state_mgr.update_run(run)

            # Mark run complete
            run.mark_completed()
            self.state_mgr.mark_run_completed(run.run_id, success=True)

            logger.info(f"\n{'=' * 80}")
            logger.info("✅ PIPELINE COMPLETE")
            logger.info(f"{'=' * 80}")
            logger.info(f"⏱️  Duration: {run.duration():.1f}s")
            logger.info(f"📊 Articles scraped: {run.total_articles_scraped}")
            logger.info(f"🎯 Articles filtered: {run.total_articles_filtered}")
            logger.info(f"{'=' * 80}")

            return run

        except Exception as e:
            logger.error(f"❌ Pipeline failed: {e}")
            run.errors.append(str(e))
            run.mark_completed()
            self.state_mgr.mark_run_completed(run.run_id, success=False)
            raise

    async def _execute_stage(
        self,
        stage: PipelineStage,
        categories: Optional[List[str]],
        dry_run: bool
    ):
        """Execute a pipeline stage"""

        if stage == PipelineStage.SCRAPING:
            await self._stage_scraping(categories, dry_run)

        elif stage == PipelineStage.FILTERING:
            await self._stage_filtering(categories, dry_run)

        elif stage == PipelineStage.RAG_PROCESSING:
            await self._stage_rag(categories, dry_run)

        elif stage == PipelineStage.CONTENT_CREATION:
            await self._stage_content(categories, dry_run)

        elif stage == PipelineStage.JOURNAL_GENERATION:
            await self._stage_journal(dry_run)

        elif stage == PipelineStage.PDF_EXPORT:
            await self._stage_pdf(dry_run)

    async def _stage_scraping(self, categories: Optional[List[str]], dry_run: bool):
        """Execute scraping stage"""
        logger.info("🔍 Running scraping stage...")

        if dry_run:
            logger.info("   (DRY RUN - no actual scraping)")
            return

        # TODO: Import and run advanced scraper
        from INTEL_SCRAPING.legacy.crawl4ai_scraper_advanced import AdvancedScraper

        scraper = AdvancedScraper()
        # This will need refactoring to use new models
        report = await scraper.process_all_categories()

        if self.current_run:
            self.current_run.total_articles_scraped = report.get('total_scraped', 0)

    async def _stage_filtering(self, categories: Optional[List[str]], dry_run: bool):
        """Execute filtering stage"""
        logger.info("🎯 Running filtering stage...")

        if dry_run:
            logger.info("   (DRY RUN - no actual filtering)")
            return

        # TODO: Implement filtering with new models

    async def _stage_rag(self, categories: Optional[List[str]], dry_run: bool):
        """Execute RAG processing stage"""
        logger.info("🧠 Running RAG processing stage...")

        if dry_run:
            logger.info("   (DRY RUN - no actual RAG processing)")
            return

        # TODO: Implement RAG processing

    async def _stage_content(self, categories: Optional[List[str]], dry_run: bool):
        """Execute content creation stage"""
        logger.info("✍️  Running content creation stage...")

        if dry_run:
            logger.info("   (DRY RUN - no actual content creation)")
            return

        # TODO: Implement content creation

    async def _stage_journal(self, dry_run: bool):
        """Execute journal generation stage"""
        logger.info("📰 Running journal generation stage...")

        if dry_run:
            logger.info("   (DRY RUN - no actual journal generation)")
            return

        # TODO: Implement journal generation

    async def _stage_pdf(self, dry_run: bool):
        """Execute PDF export stage"""
        logger.info("📄 Running PDF export stage...")

        if dry_run:
            logger.info("   (DRY RUN - no actual PDF export)")
            return

        # TODO: Implement PDF export

    async def _resume_pipeline(self) -> PipelineRun:
        """Resume pipeline from last failure"""
        logger.info("🔄 Attempting to resume from last run...")

        resumable = self.state_mgr.get_resumable_run()

        if not resumable:
            logger.warning("⚠️  No resumable run found. Starting fresh.")
            return await self.run_pipeline(mode="full")

        logger.info(f"📋 Resuming run: {resumable.run_id}")
        logger.info(f"🕐 Original start: {resumable.started_at.isoformat()}")

        # TODO: Implement resume logic
        # Get pending stages
        # Execute only pending work

        return resumable


if __name__ == "__main__":
    # Test orchestrator
    print("=" * 60)
    print("INTEL SCRAPING - Orchestrator Test")
    print("=" * 60)

    async def test():
        orchestrator = PipelineOrchestrator()

        # Dry run
        run = await orchestrator.run_pipeline(dry_run=True)

        print(f"\n✅ Test complete!")
        print(f"   Run ID: {run.run_id}")
        print(f"   Status: {run.status}")
        print(f"   Duration: {run.duration():.1f}s")

    asyncio.run(test())

    print("=" * 60)
