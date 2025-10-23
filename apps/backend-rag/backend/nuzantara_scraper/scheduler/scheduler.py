"""
Scraper Scheduler
Automated scheduling for scraper runs
"""

from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import threading
import time
from loguru import logger

from ..core import ScraperConfig
from ..scrapers import PropertyScraper, ImmigrationScraper, TaxScraper, NewsScraper


class ScheduleFrequency(str, Enum):
    """Schedule frequency options"""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    CUSTOM = "custom"  # Custom interval in seconds


@dataclass
class ScheduledJob:
    """Scheduled scraper job"""
    job_id: str
    scraper_type: str  # "property", "immigration", "tax", "news"
    config: ScraperConfig
    frequency: ScheduleFrequency
    interval_seconds: Optional[int] = None  # For custom frequency
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    enabled: bool = True
    run_count: int = 0
    error_count: int = 0
    last_error: Optional[str] = None


class ScraperScheduler:
    """
    Automated scheduler for scraper runs

    Example:
        scheduler = ScraperScheduler()

        # Schedule property scraper to run daily
        scheduler.add_job(
            scraper_type="property",
            config=property_config,
            frequency=ScheduleFrequency.DAILY
        )

        # Start scheduler
        scheduler.start()
    """

    def __init__(self):
        self.jobs: Dict[str, ScheduledJob] = {}
        self.running = False
        self.scheduler_thread: Optional[threading.Thread] = None

        # Scraper registry
        self.scraper_registry = {
            "property": PropertyScraper,
            "immigration": ImmigrationScraper,
            "tax": TaxScraper,
            "news": NewsScraper,
        }

    def add_job(
        self,
        scraper_type: str,
        config: ScraperConfig,
        frequency: ScheduleFrequency,
        interval_seconds: Optional[int] = None,
        job_id: Optional[str] = None
    ) -> str:
        """
        Add a scheduled job

        Args:
            scraper_type: Type of scraper ("property", "immigration", "tax", "news")
            config: ScraperConfig for the scraper
            frequency: Schedule frequency (hourly, daily, weekly, custom)
            interval_seconds: Custom interval in seconds (for CUSTOM frequency)
            job_id: Optional custom job ID

        Returns:
            Job ID
        """
        if scraper_type not in self.scraper_registry:
            raise ValueError(f"Invalid scraper_type: {scraper_type}")

        if frequency == ScheduleFrequency.CUSTOM and not interval_seconds:
            raise ValueError("interval_seconds required for CUSTOM frequency")

        # Generate job ID if not provided
        if not job_id:
            job_id = f"{scraper_type}_{frequency.value}_{int(time.time())}"

        # Calculate next run time
        next_run = self._calculate_next_run(frequency, interval_seconds)

        # Create job
        job = ScheduledJob(
            job_id=job_id,
            scraper_type=scraper_type,
            config=config,
            frequency=frequency,
            interval_seconds=interval_seconds,
            next_run=next_run
        )

        self.jobs[job_id] = job

        logger.info(f"Scheduled job added: {job_id} ({scraper_type}, {frequency.value})")
        logger.info(f"Next run: {next_run.isoformat()}")

        return job_id

    def remove_job(self, job_id: str) -> bool:
        """Remove a scheduled job"""
        if job_id in self.jobs:
            del self.jobs[job_id]
            logger.info(f"Removed scheduled job: {job_id}")
            return True
        return False

    def enable_job(self, job_id: str) -> bool:
        """Enable a scheduled job"""
        if job_id in self.jobs:
            self.jobs[job_id].enabled = True
            logger.info(f"Enabled scheduled job: {job_id}")
            return True
        return False

    def disable_job(self, job_id: str) -> bool:
        """Disable a scheduled job"""
        if job_id in self.jobs:
            self.jobs[job_id].enabled = False
            logger.info(f"Disabled scheduled job: {job_id}")
            return True
        return False

    def get_job(self, job_id: str) -> Optional[ScheduledJob]:
        """Get job details"""
        return self.jobs.get(job_id)

    def list_jobs(self) -> List[ScheduledJob]:
        """List all scheduled jobs"""
        return list(self.jobs.values())

    def start(self):
        """Start the scheduler"""
        if self.running:
            logger.warning("Scheduler already running")
            return

        self.running = True
        self.scheduler_thread = threading.Thread(target=self._run_loop, daemon=True)
        self.scheduler_thread.start()

        logger.info(f"Scheduler started with {len(self.jobs)} jobs")

    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)

        logger.info("Scheduler stopped")

    def _run_loop(self):
        """Main scheduler loop"""
        logger.info("Scheduler loop started")

        while self.running:
            try:
                now = datetime.now()

                # Check each job
                for job_id, job in list(self.jobs.items()):
                    if not job.enabled:
                        continue

                    if job.next_run and now >= job.next_run:
                        # Time to run this job
                        self._execute_job(job)

                # Sleep for 10 seconds before next check
                time.sleep(10)

            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                time.sleep(30)  # Sleep longer on error

    def _execute_job(self, job: ScheduledJob):
        """Execute a scheduled job"""
        try:
            logger.info(f"Executing scheduled job: {job.job_id} ({job.scraper_type})")

            # Get scraper class
            scraper_class = self.scraper_registry[job.scraper_type]

            # Initialize and run scraper
            scraper = scraper_class(job.config)
            result = scraper.run_cycle()

            # Update job stats
            job.last_run = datetime.now()
            job.run_count += 1
            job.last_error = None

            # Calculate next run
            job.next_run = self._calculate_next_run(
                job.frequency,
                job.interval_seconds,
                from_time=job.last_run
            )

            logger.info(
                f"Job {job.job_id} completed: "
                f"{result.items_saved} items saved, "
                f"next run at {job.next_run.isoformat()}"
            )

        except Exception as e:
            logger.error(f"Job {job.job_id} failed: {e}")

            job.error_count += 1
            job.last_error = str(e)

            # Still calculate next run even on error
            job.next_run = self._calculate_next_run(
                job.frequency,
                job.interval_seconds
            )

    def _calculate_next_run(
        self,
        frequency: ScheduleFrequency,
        interval_seconds: Optional[int] = None,
        from_time: Optional[datetime] = None
    ) -> datetime:
        """Calculate next run time based on frequency"""
        base_time = from_time or datetime.now()

        if frequency == ScheduleFrequency.HOURLY:
            return base_time + timedelta(hours=1)

        elif frequency == ScheduleFrequency.DAILY:
            return base_time + timedelta(days=1)

        elif frequency == ScheduleFrequency.WEEKLY:
            return base_time + timedelta(weeks=1)

        elif frequency == ScheduleFrequency.CUSTOM:
            if not interval_seconds:
                raise ValueError("interval_seconds required for CUSTOM frequency")
            return base_time + timedelta(seconds=interval_seconds)

        else:
            raise ValueError(f"Invalid frequency: {frequency}")

    def get_stats(self) -> Dict[str, Any]:
        """Get scheduler statistics"""
        return {
            "running": self.running,
            "total_jobs": len(self.jobs),
            "enabled_jobs": sum(1 for j in self.jobs.values() if j.enabled),
            "disabled_jobs": sum(1 for j in self.jobs.values() if not j.enabled),
            "jobs": [
                {
                    "job_id": job.job_id,
                    "scraper_type": job.scraper_type,
                    "frequency": job.frequency.value,
                    "enabled": job.enabled,
                    "run_count": job.run_count,
                    "error_count": job.error_count,
                    "last_run": job.last_run.isoformat() if job.last_run else None,
                    "next_run": job.next_run.isoformat() if job.next_run else None,
                    "last_error": job.last_error
                }
                for job in self.jobs.values()
            ]
        }
