#!/usr/bin/env python3
"""
=============================================================================
ZANTARA BRIDGE v1.0 - ChatGPT Atlas ⇄ Local AI Executor
=============================================================================
Author: Bali Zero / Antonello Siano
Purpose: Microservice to receive tasks from ChatGPT Atlas and store them
         as YAML files for local AI agents (Claude Code, Cursor, VSCode)

Architecture:
  ChatGPT Atlas → Bridge Server → YAML Files → Local AI Agents

Endpoints:
  POST /commit      - Commit a new task
  GET  /status      - Check inbox/executed status
  POST /mark_done   - Move task to executed
  GET  /health      - Health check
=============================================================================
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pathlib import Path
import yaml
import hashlib
import json
import uuid
import logging
from typing import Dict, Any

# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_DIR = Path(__file__).parent
INBOX_DIR = BASE_DIR / "inbox"
LOGS_DIR = BASE_DIR / "logs"
EXECUTED_DIR = BASE_DIR / "executed"
CONFIG_DIR = BASE_DIR / "config"

# Ensure directories exist
for directory in [INBOX_DIR, LOGS_DIR, EXECUTED_DIR, CONFIG_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / f"server_{datetime.utcnow().date()}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ZantaraBridge")

# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="ZANTARA Bridge",
    description="Bridge server connecting ChatGPT Atlas to local AI agents",
    version="1.0.0"
)

# CORS for local/remote access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_task_id() -> str:
    """Generate unique task ID"""
    return uuid.uuid4().hex[:12]

def generate_sha1(data: Dict[str, Any]) -> str:
    """Generate SHA1 hash for task data"""
    json_str = json.dumps(data, sort_keys=True)
    return hashlib.sha1(json_str.encode()).hexdigest()

def create_yaml_filename(context: str, task_id: str) -> str:
    """Create timestamped YAML filename"""
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    safe_context = context.replace(" ", "_").replace("/", "-")
    return f"{timestamp}_{safe_context}_{task_id}.yaml"

def log_task(task_id: str, filename: str, sha1: str, status: str = "created"):
    """Append to daily log file"""
    log_file = LOGS_DIR / f"tasks_{datetime.utcnow().date()}.log"
    timestamp = datetime.utcnow().isoformat()
    with open(log_file, "a") as f:
        f.write(f"[{timestamp}] {status.upper()} | {task_id} | {filename} | SHA1:{sha1[:8]}\n")

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "service": "ZANTARA Bridge v1.0",
        "status": "online",
        "endpoints": {
            "commit": "POST /commit",
            "status": "GET /status",
            "mark_done": "POST /mark_done",
            "health": "GET /health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "directories": {
            "inbox": str(INBOX_DIR),
            "executed": str(EXECUTED_DIR),
            "logs": str(LOGS_DIR)
        }
    }

@app.post("/commit")
async def commit_task(request: Request):
    """
    Commit a new task to the bridge

    Body:
    {
        "task": "Description of the task",
        "context": "project-name or general",
        "author": "chatgpt-atlas",
        "priority": "high|medium|low",
        "metadata": {...}
    }
    """
    try:
        data = await request.json()

        # Extract and validate required fields
        task = data.get("task")
        if not task:
            raise HTTPException(status_code=400, detail="Task field is required")

        context = data.get("context", "general")
        author = data.get("author", "chatgpt-atlas")
        priority = data.get("priority", "medium")
        metadata = data.get("metadata", {})

        # Generate task ID and filename
        task_id = generate_task_id()
        filename = create_yaml_filename(context, task_id)
        file_path = INBOX_DIR / filename

        # Create payload
        payload = {
            "task_id": task_id,
            "author": author,
            "timestamp": datetime.utcnow().isoformat(),
            "context": context,
            "priority": priority,
            "task": task,
            "status": "pending",
            "metadata": metadata
        }

        # Generate SHA1 hash
        sha1_hash = generate_sha1(payload)
        payload["sha1"] = sha1_hash

        # Save YAML file
        with open(file_path, "w") as f:
            yaml.dump(payload, f, default_flow_style=False, sort_keys=False)

        # Log task creation
        log_task(task_id, filename, sha1_hash, "created")
        logger.info(f"Task committed: {task_id} | {filename}")

        return JSONResponse({
            "status": "success",
            "task_id": task_id,
            "file": filename,
            "path": str(file_path),
            "sha1": sha1_hash,
            "message": "Task committed to inbox"
        })

    except Exception as e:
        logger.error(f"Error committing task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_status():
    """Get current status of inbox and executed tasks"""
    try:
        inbox_files = sorted([
            {
                "name": f.name,
                "size": f.stat().st_size,
                "created": datetime.fromtimestamp(f.stat().st_ctime).isoformat()
            }
            for f in INBOX_DIR.iterdir() if f.is_file() and f.suffix == ".yaml"
        ], key=lambda x: x["created"], reverse=True)

        executed_files = sorted([
            {
                "name": f.name,
                "size": f.stat().st_size,
                "created": datetime.fromtimestamp(f.stat().st_ctime).isoformat()
            }
            for f in EXECUTED_DIR.iterdir() if f.is_file() and f.suffix == ".yaml"
        ], key=lambda x: x["created"], reverse=True)

        return {
            "inbox": {
                "count": len(inbox_files),
                "files": inbox_files[:10]  # Last 10 files
            },
            "executed": {
                "count": len(executed_files),
                "files": executed_files[:10]  # Last 10 files
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mark_done")
async def mark_task_done(request: Request):
    """
    Mark a task as done by moving it to executed directory

    Body:
    {
        "filename": "20241030-120000_general_abc123.yaml"
    }
    """
    try:
        data = await request.json()
        filename = data.get("filename")

        if not filename:
            raise HTTPException(status_code=400, detail="Filename is required")

        src_path = INBOX_DIR / filename
        dst_path = EXECUTED_DIR / filename

        if not src_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {filename}")

        # Read task data for logging
        with open(src_path, "r") as f:
            task_data = yaml.safe_load(f)

        # Move file
        src_path.rename(dst_path)

        # Log completion
        task_id = task_data.get("task_id", "unknown")
        sha1_hash = task_data.get("sha1", "unknown")
        log_task(task_id, filename, sha1_hash, "completed")
        logger.info(f"Task marked done: {task_id} | {filename}")

        return {
            "status": "success",
            "task_id": task_id,
            "filename": filename,
            "message": "Task moved to executed"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking task done: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs")
async def get_logs(date: str = None):
    """
    Get logs for a specific date

    Query param:
    - date: YYYY-MM-DD format (defaults to today)
    """
    try:
        if date is None:
            date = datetime.utcnow().date()
        else:
            date = datetime.fromisoformat(date).date()

        log_file = LOGS_DIR / f"tasks_{date}.log"

        if not log_file.exists():
            return {
                "date": str(date),
                "logs": [],
                "message": "No logs for this date"
            }

        with open(log_file, "r") as f:
            logs = f.readlines()

        return {
            "date": str(date),
            "count": len(logs),
            "logs": logs[-50:]  # Last 50 entries
        }

    except Exception as e:
        logger.error(f"Error getting logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# STARTUP/SHUTDOWN
# =============================================================================

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 70)
    logger.info("ZANTARA Bridge v1.0 - Starting")
    logger.info(f"Base directory: {BASE_DIR}")
    logger.info(f"Inbox: {INBOX_DIR}")
    logger.info(f"Executed: {EXECUTED_DIR}")
    logger.info(f"Logs: {LOGS_DIR}")
    logger.info("=" * 70)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("ZANTARA Bridge - Shutting down")

# =============================================================================
# MAIN - For direct execution
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "bridge_server:app",
        host="127.0.0.1",
        port=5050,
        reload=True,
        log_level="info"
    )
