"""
Unit tests for Autonomous Agents Router
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.autonomous_agents import router, agent_executions
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)
client = TestClient(app)


# ============================================================================
# Fixtures for State Isolation
# ============================================================================


@pytest.fixture(autouse=True)
def reset_global_state():
    """Reset global state before each test to ensure isolation"""
    import copy
    
    # Save original state
    original_executions = copy.deepcopy(agent_executions)
    
    yield
    
    # Restore original state after test
    agent_executions.clear()
    agent_executions.update(original_executions)


def test_get_autonomous_agents_status():
    """Test getting autonomous agents status"""
    response = client.get("/api/autonomous-agents/status")
    
    assert response.status_code == 200
    data = response.json()
    assert "status" in data or isinstance(data, dict)


def test_run_conversation_trainer():
    """Test running conversation trainer"""
    response = client.post("/api/autonomous-agents/conversation-trainer/run?days_back=7")
    
    assert response.status_code == 200
    data = response.json()
    assert "execution_id" in data
    assert "status" in data


def test_run_client_value_predictor():
    """Test running client value predictor"""
    response = client.post("/api/autonomous-agents/client-value-predictor/run")
    
    assert response.status_code == 200
    data = response.json()
    assert "execution_id" in data


def test_run_knowledge_graph_builder():
    """Test running knowledge graph builder"""
    response = client.post("/api/autonomous-agents/knowledge-graph-builder/run?days_back=30&init_schema=false")
    
    assert response.status_code == 200
    data = response.json()
    assert "execution_id" in data


def test_get_execution_status_not_found():
    """Test getting non-existent execution status"""
    response = client.get("/api/autonomous-agents/executions/nonexistent")
    
    assert response.status_code == 404


def test_list_executions():
    """Test listing executions"""
    response = client.get("/api/autonomous-agents/executions?limit=10")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list) or isinstance(data, dict)


# ============================================================================
# Tests for Background Task Functions
# ============================================================================


@pytest.mark.asyncio
async def test_run_conversation_trainer_task_no_analysis():
    """Test conversation trainer background task when no analysis found"""
    from app.routers.autonomous_agents import _run_conversation_trainer_task

    execution_id = "test_exec_1"
    agent_executions[execution_id] = {"status": "started"}

    with patch("app.routers.autonomous_agents.ConversationTrainer") as mock_trainer:
        trainer_instance = AsyncMock()
        trainer_instance.analyze_winning_patterns = AsyncMock(return_value=None)
        mock_trainer.return_value = trainer_instance

        await _run_conversation_trainer_task(execution_id, days_back=7)

        assert agent_executions[execution_id]["status"] == "completed"
        assert "No high-rated conversations" in agent_executions[execution_id]["result"]["message"]


@pytest.mark.asyncio
async def test_run_conversation_trainer_task_success():
    """Test conversation trainer background task successful execution"""
    from app.routers.autonomous_agents import _run_conversation_trainer_task

    execution_id = "test_exec_2"
    agent_executions[execution_id] = {"status": "started"}

    with patch("app.routers.autonomous_agents.ConversationTrainer") as mock_trainer:
        trainer_instance = AsyncMock()
        trainer_instance.analyze_winning_patterns = AsyncMock(return_value=["insight1", "insight2"])
        trainer_instance.generate_prompt_update = AsyncMock(return_value="New prompt")
        trainer_instance.create_improvement_pr = AsyncMock(return_value="pr-branch-123")
        mock_trainer.return_value = trainer_instance

        await _run_conversation_trainer_task(execution_id, days_back=7)

        assert agent_executions[execution_id]["status"] == "completed"
        assert "pr_branch" in agent_executions[execution_id]["result"]
        assert agent_executions[execution_id]["result"]["insights_found"] == 2


@pytest.mark.asyncio
async def test_run_client_value_predictor_task_success():
    """Test client value predictor background task successful execution"""
    from app.routers.autonomous_agents import _run_client_value_predictor_task

    execution_id = "test_exec_3"
    agent_executions[execution_id] = {"status": "started"}

    with patch("app.routers.autonomous_agents.ClientValuePredictor") as mock_predictor:
        predictor_instance = AsyncMock()
        predictor_instance.run_daily_nurturing = AsyncMock(return_value={
            "vip_nurtured": 5,
            "high_risk_contacted": 3,
            "total_messages_sent": 8,
            "errors": []
        })
        mock_predictor.return_value = predictor_instance

        await _run_client_value_predictor_task(execution_id)

        assert agent_executions[execution_id]["status"] == "completed"
        assert agent_executions[execution_id]["result"]["vip_nurtured"] == 5
        assert agent_executions[execution_id]["result"]["high_risk_contacted"] == 3


@pytest.mark.asyncio
async def test_run_knowledge_graph_builder_task_with_init():
    """Test knowledge graph builder with schema initialization"""
    from app.routers.autonomous_agents import _run_knowledge_graph_builder_task

    execution_id = "test_exec_4"
    agent_executions[execution_id] = {"status": "started"}

    with patch("app.routers.autonomous_agents.KnowledgeGraphBuilder") as mock_builder:
        builder_instance = AsyncMock()
        builder_instance.init_graph_schema = AsyncMock()
        builder_instance.build_graph_from_all_conversations = AsyncMock()
        builder_instance.get_entity_insights = AsyncMock(return_value={
            "top_entities": [{"name": "Entity1"}, {"name": "Entity2"}],
            "hubs": [{"name": "Hub1"}],
            "relationship_types": ["WORKS_WITH"]
        })
        mock_builder.return_value = builder_instance

        await _run_knowledge_graph_builder_task(execution_id, days_back=30, init_schema=True)

        builder_instance.init_graph_schema.assert_called_once()
        assert agent_executions[execution_id]["status"] == "completed"
        assert agent_executions[execution_id]["result"]["top_entities_count"] == 2


@pytest.mark.asyncio
async def test_run_knowledge_graph_builder_task_without_init():
    """Test knowledge graph builder without schema initialization"""
    from app.routers.autonomous_agents import _run_knowledge_graph_builder_task

    execution_id = "test_exec_5"
    agent_executions[execution_id] = {"status": "started"}

    with patch("app.routers.autonomous_agents.KnowledgeGraphBuilder") as mock_builder:
        builder_instance = AsyncMock()
        builder_instance.init_graph_schema = AsyncMock()
        builder_instance.build_graph_from_all_conversations = AsyncMock()
        builder_instance.get_entity_insights = AsyncMock(return_value={
            "top_entities": [],
            "hubs": [],
            "relationship_types": []
        })
        mock_builder.return_value = builder_instance

        await _run_knowledge_graph_builder_task(execution_id, days_back=30, init_schema=False)

        builder_instance.init_graph_schema.assert_not_called()
        assert agent_executions[execution_id]["status"] == "completed"


def test_get_execution_status_success():
    """Test getting execution status for existing execution"""
    # Add an execution to the global state
    agent_executions["test_exec_123"] = {
        "agent_name": "test_agent",
        "status": "completed",
        "started_at": "2025-01-01T00:00:00",
        "completed_at": "2025-01-01T00:10:00",
        "message": "Task completed successfully"
    }

    response = client.get("/api/autonomous-agents/executions/test_exec_123")

    assert response.status_code == 200
    data = response.json()
    assert data["execution_id"] == "test_exec_123"
    assert data["agent_name"] == "test_agent"
    assert data["status"] == "completed"

