"""
Tests for agents/run_knowledge_graph.py

Target: CLI runner script coverage
File: backend/agents/run_knowledge_graph.py (76 lines)
"""

import sys
from pathlib import Path

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestRunKnowledgeGraph:
    """Test run_knowledge_graph.py CLI runner"""

    @pytest.mark.asyncio
    async def test_main_success_default_args(self):
        """Test: Main executes successfully with default args"""
        with patch("agents.run_knowledge_graph.KnowledgeGraphBuilder") as mock_builder_class, patch(
            "sys.argv", ["run_knowledge_graph.py"]
        ):
            mock_builder = MagicMock()
            mock_builder.build_graph_from_all_conversations = AsyncMock()
            mock_builder.get_entity_insights = AsyncMock(
                return_value={"top_entities": [], "hubs": [], "relationship_types": {}}
            )
            mock_builder_class.return_value = mock_builder
            from agents.run_knowledge_graph import main

            result = await main()

            assert result == 0
            mock_builder.build_graph_from_all_conversations.assert_called_once_with(days_back=30)
            mock_builder.get_entity_insights.assert_called_once()

    @pytest.mark.asyncio
    async def test_main_with_custom_days(self):
        """Test: Main accepts --days argument"""
        with patch("agents.run_knowledge_graph.KnowledgeGraphBuilder") as mock_builder_class, patch(
            "sys.argv", ["run_knowledge_graph.py", "--days", "7"]
        ):
            mock_builder = MagicMock()
            mock_builder.build_graph_from_all_conversations = AsyncMock()
            mock_builder.get_entity_insights = AsyncMock(
                return_value={"top_entities": [], "hubs": [], "relationship_types": {}}
            )
            mock_builder_class.return_value = mock_builder
            from agents.run_knowledge_graph import main

            result = await main()

            assert result == 0
            mock_builder.build_graph_from_all_conversations.assert_called_once_with(days_back=7)

    @pytest.mark.asyncio
    async def test_main_with_init_schema(self):
        """Test: Main initializes schema when --init-schema flag provided"""
        with patch("agents.run_knowledge_graph.KnowledgeGraphBuilder") as mock_builder_class, patch(
            "sys.argv", ["run_knowledge_graph.py", "--init-schema"]
        ):
            mock_builder = MagicMock()
            mock_builder.init_graph_schema = AsyncMock()
            mock_builder.build_graph_from_all_conversations = AsyncMock()
            mock_builder.get_entity_insights = AsyncMock(
                return_value={"top_entities": [], "hubs": [], "relationship_types": {}}
            )
            mock_builder_class.return_value = mock_builder
            from agents.run_knowledge_graph import main

            result = await main()

            assert result == 0
            mock_builder.init_graph_schema.assert_called_once()

    @pytest.mark.asyncio
    async def test_main_error_handling(self):
        """Test: Main handles exceptions and returns error code"""
        with patch("agents.run_knowledge_graph.KnowledgeGraphBuilder") as mock_builder_class, patch(
            "sys.argv", ["run_knowledge_graph.py"]
        ):
            mock_builder_class.side_effect = Exception("Builder initialization failed")
            from agents.run_knowledge_graph import main

            result = await main()

            assert result == 1

    @pytest.mark.asyncio
    async def test_main_with_insights_data(self):
        """Test: Main displays insights when available"""
        with patch("agents.run_knowledge_graph.KnowledgeGraphBuilder") as mock_builder_class, patch(
            "sys.argv", ["run_knowledge_graph.py"]
        ):
            mock_builder = MagicMock()
            mock_builder.build_graph_from_all_conversations = AsyncMock()
            mock_builder.get_entity_insights = AsyncMock(
                return_value={
                    "top_entities": [{"type": "VISA", "name": "Business Visa", "mentions": 10}],
                    "hubs": [{"type": "CLIENT", "name": "John Doe", "connections": 5}],
                    "relationship_types": {"requires": 15, "costs": 8},
                }
            )
            mock_builder_class.return_value = mock_builder
            from agents.run_knowledge_graph import main

            result = await main()

            assert result == 0


"""
Coverage achieved:
- ✅ main() execution flow
- ✅ Argument parsing (--days, --init-schema)
- ✅ Success path with insights
- ✅ Error handling
- ✅ Schema initialization flag

Expected coverage: 80%+ for CLI runner
"""
