# ZANTARA Handler Execution API v1.0
# Endpoints for handler registry and execution

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
import asyncio
import aiohttp
import os
import logging
from datetime import datetime

# Import registry
from ..handlers_registry import AVAILABLE_HANDLERS, HANDLER_CATEGORIES, HANDLER_STATS

# Setup router
router = APIRouter(prefix="/api/handlers", tags=["handlers"])

# Setup logging
logger = logging.getLogger(__name__)

# Pydantic models
class HandlerRequest(BaseModel):
    handler_name: str
    params: Dict[str, Any] = {}
    timeout: Optional[int] = 30

class BatchHandlerRequest(BaseModel):
    calls: List[HandlerRequest]
    timeout: Optional[int] = 30

class HandlerResponse(BaseModel):
    handler_name: str
    success: bool
    data: Any = None
    error: Optional[str] = None
    execution_time: float
    timestamp: str

# Backend URLs
TS_BACKEND_URL = os.getenv("TS_BACKEND_URL", "https://nuzantara.fly.dev")
RAG_BACKEND_URL = os.getenv("RAG_BACKEND_URL", "https://nuzantara-rag.fly.dev")

@router.get("/list", response_model=Dict[str, Any])
async def list_handlers():
    """
    List all available handlers with their configurations
    """
    try:
        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "total": HANDLER_STATS["total_handlers"],
            "categories": HANDLER_CATEGORIES,
            "handlers": AVAILABLE_HANDLERS,
            "statistics": HANDLER_STATS,
            "backend_urls": {
                "ts": TS_BACKEND_URL,
                "rag": RAG_BACKEND_URL
            }
        }
    except Exception as e:
        logger.error(f"Error listing handlers: {e}")
        raise HTTPException(500, f"Failed to list handlers: {str(e)}")

@router.get("/{handler_name}", response_model=Dict[str, Any])
async def get_handler_info(handler_name: str):
    """
    Get detailed information about a specific handler
    """
    if handler_name not in AVAILABLE_HANDLERS:
        raise HTTPException(404, f"Handler '{handler_name}' not found")

    handler = AVAILABLE_HANDLERS[handler_name]
    category = HANDLER_CATEGORIES.get(handler["category"], {})

    return {
        "success": True,
        "handler": {
            "name": handler_name,
            **handler,
            "category_info": category
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/execute", response_model=HandlerResponse)
async def execute_handler(request: HandlerRequest):
    """
    Execute a specific handler with given parameters
    """
    start_time = datetime.utcnow()

    try:
        # Validate handler exists
        if request.handler_name not in AVAILABLE_HANDLERS:
            raise HTTPException(404, f"Handler '{request.handler_name}' not found")

        handler_config = AVAILABLE_HANDLERS[request.handler_name]

        # Validate required parameters
        required_params = handler_config.get("params", [])
        missing_params = [p for p in required_params if p not in request.params]
        if missing_params:
            raise HTTPException(400, f"Missing required parameters: {missing_params}")

        # Execute handler based on backend
        result = await execute_handler_by_backend(
            handler_config,
            request.params,
            request.timeout
        )

        execution_time = (datetime.utcnow() - start_time).total_seconds()

        return HandlerResponse(
            handler_name=request.handler_name,
            success=True,
            data=result,
            execution_time=execution_time,
            timestamp=datetime.utcnow().isoformat()
        )

    except asyncio.TimeoutError:
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        return HandlerResponse(
            handler_name=request.handler_name,
            success=False,
            error=f"Handler execution timed out after {request.timeout}s",
            execution_time=execution_time,
            timestamp=datetime.utcnow().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        logger.error(f"Handler execution failed: {e}")
        return HandlerResponse(
            handler_name=request.handler_name,
            success=False,
            error=str(e),
            execution_time=execution_time,
            timestamp=datetime.utcnow().isoformat()
        )

@router.post("/batch-execute", response_model=List[HandlerResponse])
async def batch_execute_handlers(request: BatchHandlerRequest):
    """
    Execute multiple handlers in parallel
    """
    tasks = []
    for call in request.calls:
        task = execute_handler(call)
        tasks.append(task)

    # Execute all tasks in parallel
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Convert exceptions to HandlerResponse
    final_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            final_results.append(HandlerResponse(
                handler_name=request.calls[i].handler_name,
                success=False,
                error=str(result),
                execution_time=0.0,
                timestamp=datetime.utcnow().isoformat()
            ))
        else:
            final_results.append(result)

    return final_results

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    context_filter: Optional[str] = None
    limit: Optional[int] = None

@router.post("/bali-zero/chat")
async def bali_zero_chat_endpoint(request: ChatRequest):
    """
    Frontend-facing chat endpoint for Bali Zero AI.
    Internally calls the 'bali_zero_chat' handler.
    """
    handler_request = HandlerRequest(
        handler_name="bali_zero_chat",
        params={
            "query": request.query,
            "context_filter": request.context_filter,
            "limit": request.limit
        }
    )
    response = await execute_handler(handler_request)
    return response

@router.get("/categories", response_model=Dict[str, Any])
async def list_categories():
    """
    List handler categories with their handlers
    """
    try:
        categories_with_handlers = {}
        for category_name, category_info in HANDLER_CATEGORIES.items():
            handlers = [
                {"name": name, **config}
                for name, config in AVAILABLE_HANDLERS.items()
                if config["category"] == category_name
            ]
            categories_with_handlers[category_name] = {
                **category_info,
                "handlers": handlers,
                "count": len(handlers)
            }

        return {
            "success": True,
            "categories": categories_with_handlers,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error listing categories: {e}")
        raise HTTPException(500, f"Failed to list categories: {str(e)}")

async def execute_handler_by_backend(handler_config: Dict[str, Any], params: Dict[str, Any], timeout: int) -> Any:
    """
    Route handler execution to appropriate backend
    """
    backend = handler_config["backend"]
    endpoint = handler_config["endpoint"]
    method = handler_config["method"].upper()

    if backend == "future":
        raise HTTPException(501, f"Handler '{handler_config}' is not yet implemented")

    # Build URL based on backend
    if backend == "ts":
        base_url = TS_BACKEND_URL
    elif backend == "rag":
        base_url = RAG_BACKEND_URL
    else:
        raise HTTPException(400, f"Unknown backend: {backend}")

    # Replace path parameters
    url = base_url + endpoint
    for param_name, param_value in params.items():
        if f"{{{param_name}}}" in url:
            url = url.replace(f"{{{param_name}}}", str(param_value))

    # Make HTTP request
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
        if method == "GET":
            async with session.get(url, params=params) as response:
                if response.status >= 400:
                    error_text = await response.text()
                    raise HTTPException(response.status, f"Backend error: {error_text}")
                return await response.json()
        elif method == "POST":
            async with session.post(url, json=params) as response:
                if response.status >= 400:
                    error_text = await response.text()
                    raise HTTPException(response.status, f"Backend error: {error_text}")
                return await response.json()
        else:
            raise HTTPException(400, f"Unsupported method: {method}")

@router.get("/health")
async def handlers_health():
    """
    Health check for handlers system
    """
    try:
        # Test backend connectivity
        ts_health = await test_backend_health(TS_BACKEND_URL)
        rag_health = await test_backend_health(RAG_BACKEND_URL)

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "handlers_total": HANDLER_STATS["total_handlers"],
            "backends": {
                "ts": {"url": TS_BACKEND_URL, "status": ts_health},
                "rag": {"url": RAG_BACKEND_URL, "status": rag_health}
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

async def test_backend_health(url: str) -> str:
    """
    Test health of a backend service
    """
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            async with session.get(f"{url}/health") as response:
                if response.status == 200:
                    return "healthy"
                else:
                    return f"unhealthy (status: {response.status})"
    except Exception as e:
        return f"unreachable ({str(e)[:50]})"