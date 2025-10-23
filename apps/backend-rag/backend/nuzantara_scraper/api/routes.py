"""
Unified REST API for Nuzantara Scraper System
FastAPI endpoints for running and managing scrapers
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from loguru import logger

from ..core import ScraperConfig
from ..scrapers import PropertyScraper, ImmigrationScraper, TaxScraper, NewsScraper
from ..models.scraped_content import ContentType
from ..scheduler import ScraperScheduler, ScheduleFrequency


app = FastAPI(
    title="Nuzantara Unified Scraper API",
    version="1.0.0",
    description="Unified API for all scraping operations"
)


# In-memory job storage (use Redis in production)
active_jobs: Dict[str, Dict[str, Any]] = {}

# Scheduler instance
scheduler = ScraperScheduler()


# ==================== Models ====================

class ScraperRunRequest(BaseModel):
    """Request to run a scraper"""
    scraper_type: str  # "property", "immigration", "tax", "news"
    config_path: Optional[str] = None  # Path to YAML config
    run_async: bool = True  # Run in background
    enable_ai: bool = True
    categories: Optional[List[str]] = None  # For news scraper


class ScraperStatusResponse(BaseModel):
    """Scraper job status"""
    job_id: str
    scraper_type: str
    status: str  # "pending", "running", "completed", "failed"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    sources_attempted: int = 0
    sources_successful: int = 0
    items_scraped: int = 0
    items_saved: int = 0
    duration_seconds: float = 0.0
    error: Optional[str] = None


class ScraperListResponse(BaseModel):
    """List of available scrapers"""
    scrapers: List[Dict[str, Any]]


class ScheduleJobRequest(BaseModel):
    """Request to schedule a scraper job"""
    scraper_type: str
    frequency: str  # "hourly", "daily", "weekly", "custom"
    interval_seconds: Optional[int] = None
    config_path: Optional[str] = None
    enable_ai: bool = True


class ScheduleJobResponse(BaseModel):
    """Response for scheduled job"""
    job_id: str
    scraper_type: str
    frequency: str
    next_run: Optional[datetime] = None
    enabled: bool


# ==================== Scraper Registry ====================

SCRAPER_REGISTRY = {
    "property": (PropertyScraper, ContentType.PROPERTY),
    "immigration": (ImmigrationScraper, ContentType.IMMIGRATION),
    "tax": (TaxScraper, ContentType.TAX),
    "news": (NewsScraper, ContentType.NEWS),
}


# ==================== Background Task ====================

def run_scraper_task(job_id: str, scraper_type: str, config: ScraperConfig):
    """Background task to run scraper"""
    try:
        # Update job status
        active_jobs[job_id]["status"] = "running"
        active_jobs[job_id]["started_at"] = datetime.now()

        # Get scraper class
        scraper_class, _ = SCRAPER_REGISTRY[scraper_type]

        # Initialize and run
        scraper = scraper_class(config)
        result = scraper.run_cycle()

        # Update job with results
        active_jobs[job_id].update({
            "status": "completed",
            "completed_at": datetime.now(),
            "sources_attempted": result.sources_attempted,
            "sources_successful": result.sources_successful,
            "items_scraped": result.items_scraped,
            "items_saved": result.items_saved,
            "duration_seconds": result.duration_seconds,
        })

        logger.info(f"Scraper job {job_id} completed successfully")

    except Exception as e:
        logger.error(f"Scraper job {job_id} failed: {e}")
        active_jobs[job_id].update({
            "status": "failed",
            "completed_at": datetime.now(),
            "error": str(e)
        })


# ==================== API Endpoints ====================

@app.get("/")
async def root():
    """API root"""
    return {
        "name": "Nuzantara Unified Scraper API",
        "version": "1.0.0",
        "endpoints": {
            "scraper": {
                "run": "/api/scraper/run",
                "status": "/api/scraper/status/{job_id}",
                "list": "/api/scraper/list",
                "jobs": "/api/scraper/jobs"
            },
            "scheduler": {
                "schedule": "/api/scheduler/schedule",
                "jobs": "/api/scheduler/jobs",
                "job_details": "/api/scheduler/jobs/{job_id}",
                "enable": "/api/scheduler/jobs/{job_id}/enable",
                "disable": "/api/scheduler/jobs/{job_id}/disable",
                "remove": "/api/scheduler/jobs/{job_id}",
                "start": "/api/scheduler/start",
                "stop": "/api/scheduler/stop",
                "status": "/api/scheduler/status"
            },
            "health": "/health"
        }
    }


@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/scraper/run", response_model=ScraperStatusResponse)
async def scraper_run(
    request: ScraperRunRequest,
    background_tasks: BackgroundTasks
):
    """
    Run a scraper

    Parameters:
    - scraper_type: "property", "immigration", "tax", "news"
    - config_path: Optional path to YAML config
    - run_async: Run in background (default: true)
    - enable_ai: Enable AI analysis (default: true)
    """

    # Validate scraper type
    if request.scraper_type not in SCRAPER_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scraper_type. Must be one of: {list(SCRAPER_REGISTRY.keys())}"
        )

    # Generate job ID
    job_id = str(uuid.uuid4())

    # Create config
    if request.config_path:
        config = ScraperConfig.from_yaml(request.config_path)
    else:
        # Default config
        _, category = SCRAPER_REGISTRY[request.scraper_type]
        config = ScraperConfig(
            scraper_name=f"{request.scraper_type}_scraper",
            category=category,
        )

    # Update config based on request
    config.filter.enable_ai_filtering = request.enable_ai

    # Create job record
    active_jobs[job_id] = {
        "job_id": job_id,
        "scraper_type": request.scraper_type,
        "status": "pending",
        "started_at": None,
        "completed_at": None,
        "sources_attempted": 0,
        "sources_successful": 0,
        "items_scraped": 0,
        "items_saved": 0,
        "duration_seconds": 0.0,
        "error": None
    }

    # Run scraper
    if request.run_async:
        # Run in background
        background_tasks.add_task(run_scraper_task, job_id, request.scraper_type, config)
        return ScraperStatusResponse(**active_jobs[job_id])
    else:
        # Run synchronously
        run_scraper_task(job_id, request.scraper_type, config)
        return ScraperStatusResponse(**active_jobs[job_id])


@app.get("/api/scraper/status/{job_id}", response_model=ScraperStatusResponse)
async def scraper_status(job_id: str):
    """Get scraper job status"""

    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    return ScraperStatusResponse(**active_jobs[job_id])


@app.get("/api/scraper/list", response_model=ScraperListResponse)
async def scraper_list():
    """List available scrapers"""

    scrapers = []
    for scraper_type, (scraper_class, category) in SCRAPER_REGISTRY.items():
        scrapers.append({
            "type": scraper_type,
            "name": scraper_class.__name__,
            "category": category.value,
            "description": scraper_class.__doc__.strip() if scraper_class.__doc__ else ""
        })

    return ScraperListResponse(scrapers=scrapers)


@app.get("/api/scraper/jobs")
async def list_jobs():
    """List all jobs"""
    return {
        "total": len(active_jobs),
        "jobs": list(active_jobs.values())
    }


# ==================== Scheduler Endpoints ====================

@app.post("/api/scheduler/schedule", response_model=ScheduleJobResponse)
async def schedule_job(request: ScheduleJobRequest):
    """
    Schedule a scraper to run automatically

    Parameters:
    - scraper_type: "property", "immigration", "tax", "news"
    - frequency: "hourly", "daily", "weekly", "custom"
    - interval_seconds: Required for "custom" frequency
    - config_path: Optional path to YAML config
    - enable_ai: Enable AI analysis (default: true)
    """

    # Validate scraper type
    if request.scraper_type not in SCRAPER_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scraper_type. Must be one of: {list(SCRAPER_REGISTRY.keys())}"
        )

    # Validate frequency
    try:
        frequency = ScheduleFrequency(request.frequency)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frequency. Must be one of: hourly, daily, weekly, custom"
        )

    # Create config
    if request.config_path:
        config = ScraperConfig.from_yaml(request.config_path)
    else:
        _, category = SCRAPER_REGISTRY[request.scraper_type]
        config = ScraperConfig(
            scraper_name=f"{request.scraper_type}_scheduled",
            category=category,
        )

    config.filter.enable_ai_filtering = request.enable_ai

    # Add job to scheduler
    try:
        job_id = scheduler.add_job(
            scraper_type=request.scraper_type,
            config=config,
            frequency=frequency,
            interval_seconds=request.interval_seconds
        )

        job = scheduler.get_job(job_id)

        return ScheduleJobResponse(
            job_id=job_id,
            scraper_type=job.scraper_type,
            frequency=job.frequency.value,
            next_run=job.next_run,
            enabled=job.enabled
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scheduler/jobs")
async def scheduler_list_jobs():
    """List all scheduled jobs"""
    stats = scheduler.get_stats()
    return stats


@app.post("/api/scheduler/jobs/{job_id}/enable")
async def scheduler_enable_job(job_id: str):
    """Enable a scheduled job"""
    success = scheduler.enable_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"success": True, "job_id": job_id, "status": "enabled"}


@app.post("/api/scheduler/jobs/{job_id}/disable")
async def scheduler_disable_job(job_id: str):
    """Disable a scheduled job"""
    success = scheduler.disable_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"success": True, "job_id": job_id, "status": "disabled"}


@app.delete("/api/scheduler/jobs/{job_id}")
async def scheduler_remove_job(job_id: str):
    """Remove a scheduled job"""
    success = scheduler.remove_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"success": True, "job_id": job_id, "status": "removed"}


@app.get("/api/scheduler/jobs/{job_id}")
async def scheduler_get_job(job_id: str):
    """Get details of a scheduled job"""
    job = scheduler.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job.job_id,
        "scraper_type": job.scraper_type,
        "frequency": job.frequency.value,
        "interval_seconds": job.interval_seconds,
        "enabled": job.enabled,
        "run_count": job.run_count,
        "error_count": job.error_count,
        "last_run": job.last_run,
        "next_run": job.next_run,
        "last_error": job.last_error
    }


@app.post("/api/scheduler/start")
async def scheduler_start():
    """Start the scheduler"""
    scheduler.start()
    return {"success": True, "status": "running"}


@app.post("/api/scheduler/stop")
async def scheduler_stop():
    """Stop the scheduler"""
    scheduler.stop()
    return {"success": True, "status": "stopped"}


@app.get("/api/scheduler/status")
async def scheduler_status():
    """Get scheduler status"""
    return {
        "running": scheduler.running,
        "total_jobs": len(scheduler.jobs),
        "enabled_jobs": sum(1 for j in scheduler.jobs.values() if j.enabled)
    }


# Run with: uvicorn nuzantara_scraper.api.routes:app --reload
