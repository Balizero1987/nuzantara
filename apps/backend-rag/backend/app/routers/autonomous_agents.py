"""
TIER 1 AUTONOMOUS AGENTS - HTTP Endpoints
Provides HTTP API for orchestrator to trigger autonomous agents

Agents:
1. Conversation Quality Trainer
2. Client LTV Predictor & Nurturing
3. Knowledge Graph Builder
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import asyncio

# Import autonomous agents
import sys
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from agents.conversation_trainer import ConversationTrainer
from agents.client_value_predictor import ClientValuePredictor
from agents.knowledge_graph_builder import KnowledgeGraphBuilder

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/autonomous-agents", tags=["autonomous-tier1"])

# Agent execution status tracking
agent_executions: Dict[str, Dict[str, Any]] = {}


class AgentExecutionResponse(BaseModel):
    execution_id: str
    agent_name: str
    status: str  # 'started', 'running', 'completed', 'failed'
    message: str
    started_at: str
    completed_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ============================================================================
# CONVERSATION QUALITY TRAINER
# ============================================================================

async def _run_conversation_trainer_task(execution_id: str, days_back: int):
    """Background task for conversation trainer execution"""
    try:
        logger.info(f"🤖 Starting Conversation Trainer (execution_id: {execution_id})")

        agent_executions[execution_id]["status"] = "running"

        trainer = ConversationTrainer()

        # Analyze winning patterns
        analysis = await trainer.analyze_winning_patterns(days_back=days_back)

        if not analysis:
            agent_executions[execution_id].update({
                "status": "completed",
                "completed_at": datetime.now().isoformat(),
                "result": {"message": "No high-rated conversations found"}
            })
            return

        # Generate improved prompt
        improved_prompt = await trainer.generate_prompt_update(analysis)

        # Create PR
        pr_branch = await trainer.create_improvement_pr(improved_prompt, analysis)

        agent_executions[execution_id].update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "result": {
                "insights_found": len(analysis),
                "improved_prompt_chars": len(improved_prompt),
                "pr_branch": pr_branch,
                "message": "Conversation analysis complete, PR created"
            }
        })

        logger.info(f"✅ Conversation Trainer completed (execution_id: {execution_id})")

    except Exception as e:
        logger.error(f"❌ Conversation Trainer failed: {e}", exc_info=True)
        agent_executions[execution_id].update({
            "status": "failed",
            "completed_at": datetime.now().isoformat(),
            "error": str(e)
        })


@router.post("/conversation-trainer/run", response_model=AgentExecutionResponse)
async def run_conversation_trainer(
    background_tasks: BackgroundTasks,
    days_back: int = 7
):
    """
    🤖 Run Conversation Quality Trainer Agent

    Analyzes high-rated conversations and generates prompt improvements

    Args:
        days_back: Number of days to look back for conversations (default: 7)

    Returns:
        Execution status (agent runs in background)
    """
    execution_id = f"conv_trainer_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    agent_executions[execution_id] = {
        "agent_name": "conversation_trainer",
        "status": "started",
        "started_at": datetime.now().isoformat(),
        "days_back": days_back
    }

    # Run agent in background
    background_tasks.add_task(_run_conversation_trainer_task, execution_id, days_back)

    # Return immediately
    return AgentExecutionResponse(**agent_executions[execution_id], execution_id=execution_id, message="Agent execution started in background")


# ============================================================================
# CLIENT LTV PREDICTOR & NURTURING
# ============================================================================

async def _run_client_value_predictor_task(execution_id: str):
    """Background task for client value predictor execution"""
    try:
        logger.info(f"💰 Starting Client Value Predictor (execution_id: {execution_id})")

        agent_executions[execution_id]["status"] = "running"

        predictor = ClientValuePredictor()

        # Run daily nurturing cycle
        results = await predictor.run_daily_nurturing()

        agent_executions[execution_id].update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "result": {
                "vip_nurtured": results["vip_nurtured"],
                "high_risk_contacted": results["high_risk_contacted"],
                "total_messages_sent": results["total_messages_sent"],
                "errors": len(results["errors"]),
                "message": "Client nurturing complete"
            }
        })

        logger.info(f"✅ Client Value Predictor completed (execution_id: {execution_id})")

    except Exception as e:
        logger.error(f"❌ Client Value Predictor failed: {e}", exc_info=True)
        agent_executions[execution_id].update({
            "status": "failed",
            "completed_at": datetime.now().isoformat(),
            "error": str(e)
        })


@router.post("/client-value-predictor/run", response_model=AgentExecutionResponse)
async def run_client_value_predictor(background_tasks: BackgroundTasks):
    """
    💰 Run Client LTV Predictor & Nurturing Agent

    Scores all clients and sends personalized nurturing messages to:
    - VIP clients (LTV > 80)
    - High-risk clients (LTV < 30 and inactive > 30 days)

    Returns:
        Execution status (agent runs in background)
    """
    execution_id = f"client_predictor_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    agent_executions[execution_id] = {
        "agent_name": "client_value_predictor",
        "status": "started",
        "started_at": datetime.now().isoformat()
    }

    # Run agent in background
    background_tasks.add_task(_run_client_value_predictor_task, execution_id)

    # Return immediately
    return AgentExecutionResponse(**agent_executions[execution_id], execution_id=execution_id, message="Agent execution started in background")


# ============================================================================
# KNOWLEDGE GRAPH BUILDER
# ============================================================================

async def _run_knowledge_graph_builder_task(execution_id: str, days_back: int, init_schema: bool):
    """Background task for knowledge graph builder execution"""
    try:
        logger.info(f"🕸️ Starting Knowledge Graph Builder (execution_id: {execution_id})")

        agent_executions[execution_id]["status"] = "running"

        builder = KnowledgeGraphBuilder()

        # Initialize schema if requested
        if init_schema:
            await builder.init_graph_schema()
            logger.info("✅ Knowledge graph schema initialized")

        # Build graph from conversations
        await builder.build_graph_from_all_conversations(days_back=days_back)

        # Get insights
        insights = await builder.get_entity_insights(top_n=10)

        agent_executions[execution_id].update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "result": {
                "top_entities_count": len(insights["top_entities"]),
                "hubs_count": len(insights["hubs"]),
                "relationship_types_count": len(insights["relationship_types"]),
                "top_entities": insights["top_entities"][:5],
                "top_hubs": insights["hubs"][:5],
                "message": "Knowledge graph updated"
            }
        })

        logger.info(f"✅ Knowledge Graph Builder completed (execution_id: {execution_id})")

    except Exception as e:
        logger.error(f"❌ Knowledge Graph Builder failed: {e}", exc_info=True)
        agent_executions[execution_id].update({
            "status": "failed",
            "completed_at": datetime.now().isoformat(),
            "error": str(e)
        })


@router.post("/knowledge-graph-builder/run", response_model=AgentExecutionResponse)
async def run_knowledge_graph_builder(
    background_tasks: BackgroundTasks,
    days_back: int = 30,
    init_schema: bool = False
):
    """
    🕸️ Run Knowledge Graph Builder Agent

    Extracts entities and relationships from conversations and builds knowledge graph

    Args:
        days_back: Number of days to look back for conversations (default: 30)
        init_schema: Initialize database schema (default: False)

    Returns:
        Execution status (agent runs in background)
    """
    execution_id = f"kg_builder_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    agent_executions[execution_id] = {
        "agent_name": "knowledge_graph_builder",
        "status": "started",
        "started_at": datetime.now().isoformat(),
        "days_back": days_back,
        "init_schema": init_schema
    }

    # Run agent in background
    background_tasks.add_task(_run_knowledge_graph_builder_task, execution_id, days_back, init_schema)

    # Return immediately
    return AgentExecutionResponse(**agent_executions[execution_id], execution_id=execution_id, message="Agent execution started in background")


# ============================================================================
# AGENT STATUS & MANAGEMENT
# ============================================================================

@router.get("/status")
async def get_autonomous_agents_status():
    """
    Get status of all Tier 1 autonomous agents

    Returns:
        Agent capabilities and recent executions
    """
    return {
        "success": True,
        "tier": 1,
        "total_agents": 3,
        "agents": [
            {
                "id": "conversation_trainer",
                "name": "Conversation Quality Trainer",
                "description": "Learns from successful conversations and improves prompts",
                "schedule": "Weekly (Sunday 4 AM)",
                "priority": 8,
                "estimated_duration_min": 15
            },
            {
                "id": "client_value_predictor",
                "name": "Client LTV Predictor & Nurturer",
                "description": "Predicts client value and sends personalized nurturing messages",
                "schedule": "Daily (10 AM)",
                "priority": 9,
                "estimated_duration_min": 10
            },
            {
                "id": "knowledge_graph_builder",
                "name": "Knowledge Graph Builder",
                "description": "Extracts entities and relationships from all data sources",
                "schedule": "Daily (4 AM)",
                "priority": 7,
                "estimated_duration_min": 30
            }
        ],
        "recent_executions": len(agent_executions),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/executions/{execution_id}", response_model=AgentExecutionResponse)
async def get_execution_status(execution_id: str):
    """
    Get status of a specific agent execution

    Args:
        execution_id: Execution ID returned by agent run endpoint

    Returns:
        Execution details and result
    """
    if execution_id not in agent_executions:
        raise HTTPException(status_code=404, detail="Execution not found")

    return AgentExecutionResponse(**agent_executions[execution_id], execution_id=execution_id)


@router.get("/executions")
async def list_executions(limit: int = 20):
    """
    List recent agent executions

    Args:
        limit: Maximum number of executions to return (default: 20)

    Returns:
        List of recent executions
    """
    executions = sorted(
        agent_executions.items(),
        key=lambda x: x[1].get("started_at", ""),
        reverse=True
    )[:limit]

    return {
        "success": True,
        "executions": [
            {**data, "execution_id": exec_id}
            for exec_id, data in executions
        ],
        "total": len(agent_executions)
    }
