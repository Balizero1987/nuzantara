#!/usr/bin/env python3
"""
LLAMA Nightly Worker - Orchestrates all LLAMA batch tasks

Runs daily at 2 AM UTC (10 AM Jakarta) to:
1. Extract queries from conversation logs
2. Cluster similar queries semantically
3. Generate golden answers for top 50 clusters (LLAMA + RAG)
4. Generate/update cultural knowledge chunks for Haiku
5. Track execution in nightly_worker_runs table

This is the main entry point scheduled by Fly.io Cron Jobs.
"""

import os
import sys
import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional

# Add modules directory to path
sys.path.insert(0, str(Path(__file__).parent / "modules"))

from query_analyzer import QueryAnalyzer
from query_clustering import QueryClusterer
from golden_answer_generator import GoldenAnswerGenerator
from cultural_knowledge_generator import CulturalKnowledgeGenerator

import asyncpg

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class NightlyWorker:
    """
    Main orchestrator for LLAMA nightly tasks
    """

    def __init__(
        self,
        database_url: str,
        runpod_endpoint: Optional[str] = None,
        runpod_api_key: Optional[str] = None,
        rag_backend_url: Optional[str] = None
    ):
        """
        Initialize worker

        Args:
            database_url: PostgreSQL connection string
            runpod_endpoint: RunPod LLAMA endpoint
            runpod_api_key: RunPod API key
            rag_backend_url: RAG backend URL
        """
        self.database_url = database_url
        self.runpod_endpoint = runpod_endpoint
        self.runpod_api_key = runpod_api_key
        self.rag_backend_url = rag_backend_url

        # Initialize components
        self.query_analyzer = QueryAnalyzer(database_url)
        self.clusterer = QueryClusterer()
        self.golden_generator = GoldenAnswerGenerator(
            database_url,
            runpod_endpoint,
            runpod_api_key,
            rag_backend_url
        )
        self.cultural_generator = CulturalKnowledgeGenerator(
            database_url,
            runpod_endpoint,
            runpod_api_key
        )

        self.pool: Optional[asyncpg.Pool] = None
        self.run_id: Optional[int] = None

    async def connect(self):
        """Initialize PostgreSQL connection"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("✅ NightlyWorker connected to PostgreSQL")
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise

    async def close(self):
        """Close all connections"""
        if self.pool:
            await self.pool.close()
        await self.query_analyzer.close()
        await self.golden_generator.close()
        await self.cultural_generator.close()

    async def _start_run(self) -> int:
        """
        Create nightly_worker_runs record

        Returns:
            Run ID
        """
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as conn:
            run_id = await conn.fetchval("""
                INSERT INTO nightly_worker_runs (
                    run_date,
                    start_time,
                    status
                ) VALUES (CURRENT_DATE, NOW(), 'running')
                RETURNING id
            """)

        logger.info(f"📊 Started nightly run ID: {run_id}")
        return run_id

    async def _update_run_stats(
        self,
        intel_classification_count: int = 0,
        golden_answers_generated: int = 0,
        golden_answers_updated: int = 0,
        cultural_chunks_generated: int = 0,
        llama_tokens_used: int = 0,
        status: str = "running",
        error_message: Optional[str] = None
    ):
        """Update nightly_worker_runs with statistics"""
        if not self.pool or not self.run_id:
            return

        async with self.pool.acquire() as conn:
            await conn.execute("""
                UPDATE nightly_worker_runs
                SET
                    intel_classification_count = $2,
                    golden_answers_generated = $3,
                    golden_answers_updated = $4,
                    cultural_chunks_generated = $5,
                    llama_tokens_used = $6,
                    status = $7,
                    error_message = $8,
                    end_time = NOW()
                WHERE id = $1
            """,
                self.run_id,
                intel_classification_count,
                golden_answers_generated,
                golden_answers_updated,
                cultural_chunks_generated,
                llama_tokens_used,
                status,
                error_message
            )

    async def _warmup_llama(self):
        """
        Send warm-up request to RunPod to initialize worker
        This avoids cold start delays during batch generation
        """
        if not self.runpod_endpoint or not self.runpod_api_key:
            return

        logger.info("🔥 Warming up LLAMA worker...")

        try:
            import httpx
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.runpod_endpoint,
                    headers={
                        "Authorization": f"Bearer {self.runpod_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "input": {
                            "prompt": "Hello",
                            "max_tokens": 5,
                            "temperature": 0.1
                        }
                    }
                )

                if response.status_code == 200:
                    logger.info("✅ LLAMA worker warmed up (ready for batch)")
                else:
                    logger.warning(f"⚠️ Warm-up returned {response.status_code}")

        except Exception as e:
            logger.warning(f"⚠️ Warm-up failed (will retry during generation): {e}")

    async def run(
        self,
        days_lookback: int = 7,
        max_golden_answers: int = 50,
        regenerate_cultural: bool = False
    ) -> Dict:
        """
        Execute nightly worker tasks

        Args:
            days_lookback: How many days of queries to analyze
            max_golden_answers: Max golden answers to generate
            regenerate_cultural: Re-generate all cultural chunks (default: False)

        Returns:
            Dict with execution statistics
        """
        logger.info("=" * 70)
        logger.info("🌙 LLAMA NIGHTLY WORKER - START")
        logger.info("=" * 70)
        logger.info(f"   Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        logger.info(f"   Days lookback: {days_lookback}")
        logger.info(f"   Max golden answers: {max_golden_answers}")
        logger.info(f"   Regenerate cultural: {regenerate_cultural}")
        logger.info("")

        stats = {
            "start_time": datetime.now(),
            "intel_classification_count": 0,
            "golden_answers_generated": 0,
            "golden_answers_updated": 0,
            "cultural_chunks_generated": 0,
            "total_queries_analyzed": 0,
            "clusters_found": 0,
            "status": "running"
        }

        try:
            # Warm up LLAMA worker before batch (avoid cold start)
            await self._warmup_llama()

            # Start run tracking
            self.run_id = await self._start_run()

            # ========================================
            # TASK 1: Query Analysis & Clustering
            # ========================================
            logger.info("📊 TASK 1: Query Analysis & Clustering")
            logger.info("-" * 70)

            # Extract queries from conversations
            queries = await self.query_analyzer.extract_queries_from_period(days=days_lookback)
            stats["total_queries_analyzed"] = len(queries)

            logger.info(f"   Extracted {len(queries)} queries from last {days_lookback} days")

            if not queries:
                logger.warning("⚠️ No queries found - skipping clustering and golden answers")
            else:
                # Cluster similar queries
                clusters = await self.clusterer.cluster_queries(
                    queries,
                    min_cluster_size=3,
                    similarity_threshold=0.75
                )
                stats["clusters_found"] = len(clusters)

                logger.info(f"   Found {len(clusters)} query clusters")

                # Calculate coverage
                coverage = await self.clusterer.calculate_coverage(clusters, len(queries))
                logger.info(f"   Top 50 coverage: {coverage['top_50_coverage_pct']}%")

                # ========================================
                # TASK 2: Golden Answer Generation
                # ========================================
                if clusters:
                    logger.info("")
                    logger.info("💎 TASK 2: Golden Answer Generation")
                    logger.info("-" * 70)

                    # Get top clusters
                    top_clusters = await self.clusterer.get_top_clusters(
                        clusters,
                        limit=max_golden_answers
                    )

                    logger.info(f"   Generating golden answers for top {len(top_clusters)} clusters")

                    # Generate golden answers
                    golden_stats = await self.golden_generator.batch_generate_golden_answers(
                        top_clusters
                    )

                    stats["golden_answers_generated"] = golden_stats["successful"]
                    logger.info(f"   ✅ Generated {golden_stats['successful']} golden answers")

            # ========================================
            # TASK 3: Cultural Knowledge Generation
            # ========================================
            logger.info("")
            logger.info("🎭 TASK 3: Cultural Knowledge Generation")
            logger.info("-" * 70)

            if regenerate_cultural:
                logger.info("   Regenerating all cultural chunks...")
                cultural_stats = await self.cultural_generator.batch_generate_cultural_chunks()
                stats["cultural_chunks_generated"] = cultural_stats["successful"]
                logger.info(f"   ✅ Generated {cultural_stats['successful']} cultural chunks")
            else:
                logger.info("   Skipping cultural regeneration (use --regenerate-cultural to force)")
                stats["cultural_chunks_generated"] = 0

            # ========================================
            # COMPLETE
            # ========================================
            stats["status"] = "completed"
            stats["end_time"] = datetime.now()
            stats["duration_seconds"] = (stats["end_time"] - stats["start_time"]).total_seconds()

            # Update run record
            await self._update_run_stats(
                intel_classification_count=0,  # Intel classification runs separately
                golden_answers_generated=stats["golden_answers_generated"],
                golden_answers_updated=0,
                cultural_chunks_generated=stats["cultural_chunks_generated"],
                llama_tokens_used=0,  # TODO: Track tokens
                status="completed"
            )

            logger.info("")
            logger.info("=" * 70)
            logger.info("🎉 NIGHTLY WORKER COMPLETE")
            logger.info("=" * 70)
            logger.info(f"   Total queries analyzed: {stats['total_queries_analyzed']}")
            logger.info(f"   Clusters found: {stats['clusters_found']}")
            logger.info(f"   Golden answers generated: {stats['golden_answers_generated']}")
            logger.info(f"   Cultural chunks generated: {stats['cultural_chunks_generated']}")
            logger.info(f"   Duration: {stats['duration_seconds']:.1f} seconds")
            logger.info("=" * 70)

            return stats

        except Exception as e:
            logger.error(f"❌ NIGHTLY WORKER FAILED: {e}")
            stats["status"] = "failed"
            stats["error"] = str(e)

            # Update run record
            await self._update_run_stats(
                status="failed",
                error_message=str(e)
            )

            raise

        finally:
            await self.close()


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="LLAMA Nightly Worker")
    parser.add_argument("--days", type=int, default=7, help="Days of queries to analyze")
    parser.add_argument("--max-golden", type=int, default=50, help="Max golden answers to generate")
    parser.add_argument("--regenerate-cultural", action="store_true", help="Regenerate all cultural chunks")
    parser.add_argument("--dry-run", action="store_true", help="Test run without saving")
    args = parser.parse_args()

    # Load environment variables
    database_url = os.getenv("DATABASE_URL")
    runpod_endpoint = os.getenv("RUNPOD_LLAMA_ENDPOINT")
    runpod_api_key = os.getenv("RUNPOD_API_KEY")
    rag_backend_url = os.getenv(
        "RAG_BACKEND_URL",
        "https://zantara-rag-backend-1064094238013.europe-west1.run.app"
    )

    if not database_url:
        logger.error("❌ DATABASE_URL not set")
        sys.exit(1)

    if not runpod_endpoint or not runpod_api_key:
        logger.warning("⚠️ LLAMA not configured - will skip golden answer and cultural generation")

    # Initialize worker
    worker = NightlyWorker(
        database_url=database_url,
        runpod_endpoint=runpod_endpoint,
        runpod_api_key=runpod_api_key,
        rag_backend_url=rag_backend_url
    )

    # Run
    try:
        stats = await worker.run(
            days_lookback=args.days,
            max_golden_answers=args.max_golden,
            regenerate_cultural=args.regenerate_cultural
        )

        logger.info("✅ Nightly worker completed successfully")
        sys.exit(0)

    except Exception as e:
        logger.error(f"❌ Nightly worker failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
