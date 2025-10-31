"""
VIBE Swarm Agent - Multi-Agent Task Executor
Runs on Fly.io, executes tasks from dashboard orchestrator
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import asyncio
from datetime import datetime

# Import agent executors
from agents.claude_code_cli import ClaudeCodeCLIAgent
from agents.chatgpt_browser import ChatGPTBrowserAgent
from agents.copilot_cli import CopilotCLIAgent
from agents.cursor_local import CursorLocalAgent
from agents.flyio_api import FlyioAPIAgent

app = FastAPI(title="VIBE Swarm Agent")

# CORS for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AgentTask(BaseModel):
    agent: str
    action: str
    params: Dict[str, Any]
    priority: int

class TaskResult(BaseModel):
    success: bool
    agent: str
    action: str
    result: Any
    error: Optional[str] = None
    timestamp: str

# Initialize agents
agents = {
    'claude': ClaudeCodeCLIAgent(),
    'chatgpt': ChatGPTBrowserAgent(),
    'copilot': CopilotCLIAgent(),
    'cursor': CursorLocalAgent(),
    'flyio': FlyioAPIAgent()
}

@app.get("/")
async def root():
    return {
        "service": "VIBE Swarm Agent",
        "status": "operational",
        "agents": list(agents.keys())
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/execute")
async def execute_task(task: AgentTask) -> TaskResult:
    """Execute a task with specified agent"""

    try:
        # Get agent executor
        agent = agents.get(task.agent)
        if not agent:
            raise HTTPException(status_code=400, detail=f"Unknown agent: {task.agent}")

        # Execute action
        result = await agent.execute(task.action, task.params)

        return TaskResult(
            success=True,
            agent=task.agent,
            action=task.action,
            result=result,
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        return TaskResult(
            success=False,
            agent=task.agent,
            action=task.action,
            result=None,
            error=str(e),
            timestamp=datetime.utcnow().isoformat()
        )

@app.get("/agents/{agent_name}/status")
async def agent_status(agent_name: str):
    """Get status of specific agent"""

    agent = agents.get(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_name}")

    return {
        "agent": agent_name,
        "status": await agent.get_status(),
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
