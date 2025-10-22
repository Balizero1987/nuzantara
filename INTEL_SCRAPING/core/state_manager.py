#!/usr/bin/env python3
"""
State Manager - Swiss-Watch Precision
Manages pipeline state for resume capability and checkpointing.

Features:
- SQLite-based persistent state
- Resume from failures
- Checkpoint tracking
- Run history
- Stage completion tracking
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from contextlib import contextmanager

from INTEL_SCRAPING.core.models import PipelineRun, PipelineStage, StageState


class StateManager:
    """
    Manages pipeline execution state.

    Capabilities:
    - Create and track pipeline runs
    - Mark stages as complete
    - Resume from failures
    - Get pending work
    - Query run history
    """

    def __init__(self, db_path: str = "INTEL_SCRAPING/data/.state/scraping_state.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_database()

    def _init_database(self):
        """Initialize database schema"""
        with self._get_connection() as conn:
            # Pipeline runs table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS pipeline_runs (
                    run_id TEXT PRIMARY KEY,
                    started_at TEXT NOT NULL,
                    completed_at TEXT,
                    status TEXT NOT NULL,
                    total_articles_scraped INTEGER DEFAULT 0,
                    total_articles_filtered INTEGER DEFAULT 0,
                    total_articles_processed INTEGER DEFAULT 0,
                    errors TEXT,  -- JSON array
                    metadata TEXT  -- JSON object
                )
            """)

            # Stage states table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS stage_states (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    category TEXT NOT NULL,
                    status TEXT NOT NULL,
                    started_at TEXT,
                    completed_at TEXT,
                    error TEXT,
                    metadata TEXT,  -- JSON object
                    UNIQUE(run_id, stage, category),
                    FOREIGN KEY (run_id) REFERENCES pipeline_runs(run_id)
                )
            """)

            # Processed categories tracking
            conn.execute("""
                CREATE TABLE IF NOT EXISTS processed_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id TEXT NOT NULL,
                    category TEXT NOT NULL,
                    processed_at TEXT NOT NULL,
                    UNIQUE(run_id, category),
                    FOREIGN KEY (run_id) REFERENCES pipeline_runs(run_id)
                )
            """)

            # Create indices
            conn.execute("CREATE INDEX IF NOT EXISTS idx_run_status ON pipeline_runs(status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_stage_status ON stage_states(run_id, status)")

            conn.commit()

    @contextmanager
    def _get_connection(self):
        """Get database connection (context manager)"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    # ========================================
    # RUN MANAGEMENT
    # ========================================

    def create_run(self, metadata: Dict[str, Any] = None) -> PipelineRun:
        """
        Create a new pipeline run.

        Args:
            metadata: Optional metadata dict

        Returns:
            PipelineRun object
        """
        run = PipelineRun(metadata=metadata or {})

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO pipeline_runs
                (run_id, started_at, status, errors, metadata)
                VALUES (?, ?, ?, ?, ?)
            """, (
                run.run_id,
                run.started_at.isoformat(),
                run.status,
                json.dumps(run.errors),
                json.dumps(run.metadata)
            ))
            conn.commit()

        return run

    def get_run(self, run_id: str) -> Optional[PipelineRun]:
        """Get pipeline run by ID"""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM pipeline_runs WHERE run_id = ?",
                (run_id,)
            ).fetchone()

            if not row:
                return None

            return self._row_to_pipeline_run(row)

    def update_run(self, run: PipelineRun):
        """Update pipeline run"""
        with self._get_connection() as conn:
            conn.execute("""
                UPDATE pipeline_runs
                SET completed_at = ?,
                    status = ?,
                    total_articles_scraped = ?,
                    total_articles_filtered = ?,
                    total_articles_processed = ?,
                    errors = ?,
                    metadata = ?
                WHERE run_id = ?
            """, (
                run.completed_at.isoformat() if run.completed_at else None,
                run.status,
                run.total_articles_scraped,
                run.total_articles_filtered,
                run.total_articles_processed,
                json.dumps(run.errors),
                json.dumps(run.metadata),
                run.run_id
            ))
            conn.commit()

    def mark_run_completed(self, run_id: str, success: bool = True):
        """Mark run as completed"""
        status = "completed" if success else "failed"
        with self._get_connection() as conn:
            conn.execute("""
                UPDATE pipeline_runs
                SET completed_at = ?, status = ?
                WHERE run_id = ?
            """, (datetime.now().isoformat(), status, run_id))
            conn.commit()

    def get_last_run(self) -> Optional[PipelineRun]:
        """Get most recent pipeline run"""
        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT * FROM pipeline_runs
                ORDER BY started_at DESC
                LIMIT 1
            """).fetchone()

            if not row:
                return None

            return self._row_to_pipeline_run(row)

    def get_last_successful_run(self) -> Optional[PipelineRun]:
        """Get most recent successful run"""
        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT * FROM pipeline_runs
                WHERE status = 'completed'
                ORDER BY started_at DESC
                LIMIT 1
            """).fetchone()

            if not row:
                return None

            return self._row_to_pipeline_run(row)

    # ========================================
    # STAGE MANAGEMENT
    # ========================================

    def mark_stage_complete(
        self,
        run_id: str,
        stage: PipelineStage,
        category: str,
        metadata: Dict[str, Any] = None
    ):
        """Mark a stage as completed for a category"""
        with self._get_connection() as conn:
            # Check if exists
            existing = conn.execute("""
                SELECT id FROM stage_states
                WHERE run_id = ? AND stage = ? AND category = ?
            """, (run_id, stage.value, category)).fetchone()

            if existing:
                # Update
                conn.execute("""
                    UPDATE stage_states
                    SET status = 'completed',
                        completed_at = ?,
                        metadata = ?
                    WHERE run_id = ? AND stage = ? AND category = ?
                """, (
                    datetime.now().isoformat(),
                    json.dumps(metadata or {}),
                    run_id,
                    stage.value,
                    category
                ))
            else:
                # Insert
                conn.execute("""
                    INSERT INTO stage_states
                    (run_id, stage, category, status, started_at, completed_at, metadata)
                    VALUES (?, ?, ?, 'completed', ?, ?, ?)
                """, (
                    run_id,
                    stage.value,
                    category,
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                    json.dumps(metadata or {})
                ))

            conn.commit()

    def mark_stage_running(self, run_id: str, stage: PipelineStage, category: str):
        """Mark stage as currently running"""
        with self._get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO stage_states
                (run_id, stage, category, status, started_at)
                VALUES (?, ?, ?, 'running', ?)
            """, (run_id, stage.value, category, datetime.now().isoformat()))
            conn.commit()

    def mark_stage_failed(
        self,
        run_id: str,
        stage: PipelineStage,
        category: str,
        error: str
    ):
        """Mark stage as failed"""
        with self._get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO stage_states
                (run_id, stage, category, status, started_at, completed_at, error)
                VALUES (?, ?, ?, 'failed', ?, ?, ?)
            """, (
                run_id,
                stage.value,
                category,
                datetime.now().isoformat(),
                datetime.now().isoformat(),
                error
            ))
            conn.commit()

    def is_stage_complete(self, run_id: str, stage: PipelineStage, category: str) -> bool:
        """Check if stage is completed for a category"""
        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT status FROM stage_states
                WHERE run_id = ? AND stage = ? AND category = ? AND status = 'completed'
            """, (run_id, stage.value, category)).fetchone()

            return row is not None

    def get_pending_stages(self, run_id: str, stage: PipelineStage) -> List[str]:
        """
        Get list of categories that haven't completed a stage.

        Args:
            run_id: Pipeline run ID
            stage: Stage to check

        Returns:
            List of category names pending for this stage
        """
        with self._get_connection() as conn:
            # Get all categories processed in this run
            all_categories = conn.execute("""
                SELECT DISTINCT category FROM processed_categories
                WHERE run_id = ?
            """, (run_id,)).fetchall()

            all_cats = [row['category'] for row in all_categories]

            # Get categories that completed this stage
            completed = conn.execute("""
                SELECT DISTINCT category FROM stage_states
                WHERE run_id = ? AND stage = ? AND status = 'completed'
            """, (run_id, stage.value)).fetchall()

            completed_cats = set(row['category'] for row in completed)

            # Return pending
            return [cat for cat in all_cats if cat not in completed_cats]

    # ========================================
    # CATEGORY TRACKING
    # ========================================

    def mark_category_processed(self, run_id: str, category: str):
        """Mark a category as processed in this run"""
        with self._get_connection() as conn:
            conn.execute("""
                INSERT OR IGNORE INTO processed_categories
                (run_id, category, processed_at)
                VALUES (?, ?, ?)
            """, (run_id, category, datetime.now().isoformat()))
            conn.commit()

    def get_processed_categories(self, run_id: str) -> List[str]:
        """Get list of categories processed in a run"""
        with self._get_connection() as conn:
            rows = conn.execute("""
                SELECT category FROM processed_categories
                WHERE run_id = ?
            """, (run_id,)).fetchall()

            return [row['category'] for row in rows]

    # ========================================
    # RESUME CAPABILITY
    # ========================================

    def can_resume(self) -> bool:
        """Check if there's a run that can be resumed"""
        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT run_id FROM pipeline_runs
                WHERE status = 'running'
                ORDER BY started_at DESC
                LIMIT 1
            """).fetchone()

            return row is not None

    def get_resumable_run(self) -> Optional[PipelineRun]:
        """Get the most recent run that can be resumed"""
        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT * FROM pipeline_runs
                WHERE status = 'running'
                ORDER BY started_at DESC
                LIMIT 1
            """).fetchone()

            if not row:
                return None

            return self._row_to_pipeline_run(row)

    # ========================================
    # HELPERS
    # ========================================

    def _row_to_pipeline_run(self, row: sqlite3.Row) -> PipelineRun:
        """Convert database row to PipelineRun object"""
        return PipelineRun(
            run_id=row['run_id'],
            started_at=datetime.fromisoformat(row['started_at']),
            completed_at=datetime.fromisoformat(row['completed_at']) if row['completed_at'] else None,
            status=row['status'],
            total_articles_scraped=row['total_articles_scraped'],
            total_articles_filtered=row['total_articles_filtered'],
            total_articles_processed=row['total_articles_processed'],
            errors=json.loads(row['errors']) if row['errors'] else [],
            metadata=json.loads(row['metadata']) if row['metadata'] else {}
        )

    def get_stats(self) -> Dict[str, Any]:
        """Get overall statistics"""
        with self._get_connection() as conn:
            # Total runs
            total_runs = conn.execute("SELECT COUNT(*) as count FROM pipeline_runs").fetchone()['count']

            # Successful runs
            successful_runs = conn.execute(
                "SELECT COUNT(*) as count FROM pipeline_runs WHERE status = 'completed'"
            ).fetchone()['count']

            # Failed runs
            failed_runs = conn.execute(
                "SELECT COUNT(*) as count FROM pipeline_runs WHERE status = 'failed'"
            ).fetchone()['count']

            # Running runs
            running_runs = conn.execute(
                "SELECT COUNT(*) as count FROM pipeline_runs WHERE status = 'running'"
            ).fetchone()['count']

            # Total articles
            total_articles = conn.execute(
                "SELECT SUM(total_articles_scraped) as total FROM pipeline_runs"
            ).fetchone()['total'] or 0

            return {
                'total_runs': total_runs,
                'successful_runs': successful_runs,
                'failed_runs': failed_runs,
                'running_runs': running_runs,
                'success_rate': successful_runs / max(total_runs, 1),
                'total_articles_scraped': total_articles
            }


if __name__ == "__main__":
    # Test state manager
    print("=" * 60)
    print("INTEL SCRAPING - State Manager Test")
    print("=" * 60)

    # Create temporary state manager
    state_mgr = StateManager("test_state.db")

    # Create a run
    run = state_mgr.create_run(metadata={"test": "Swiss-watch precision"})
    print(f"\n✅ Created run: {run.run_id}")

    # Mark some stages complete
    state_mgr.mark_category_processed(run.run_id, "ai_tech")
    state_mgr.mark_category_processed(run.run_id, "visa_immigration")

    state_mgr.mark_stage_complete(run.run_id, PipelineStage.SCRAPING, "ai_tech")
    state_mgr.mark_stage_complete(run.run_id, PipelineStage.FILTERING, "ai_tech")

    print(f"\n✅ Marked stages complete")

    # Check if can resume
    can_resume = state_mgr.can_resume()
    print(f"\n🔄 Can resume: {can_resume}")

    # Get pending stages
    pending = state_mgr.get_pending_stages(run.run_id, PipelineStage.FILTERING)
    print(f"\n📋 Pending for FILTERING: {pending}")

    # Get stats
    stats = state_mgr.get_stats()
    print(f"\n📊 Stats:")
    for key, value in stats.items():
        print(f"   {key}: {value}")

    # Cleanup
    Path("test_state.db").unlink()
    print("\n✅ Test complete!")
    print("=" * 60)
