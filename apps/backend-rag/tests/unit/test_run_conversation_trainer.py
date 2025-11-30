"""
Tests for agents/run_conversation_trainer.py

Target: CLI runner script coverage
File: backend/agents/run_conversation_trainer.py
"""

import sys
from pathlib import Path

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

import pytest
from unittest.mock import MagicMock, AsyncMock, patch


class TestRunConversationTrainer:
    """Test run_conversation_trainer.py CLI runner"""

    @pytest.mark.asyncio
    async def test_main_success(self):
        """Test: Main executes successfully"""
        with patch("agents.agents.conversation_trainer.ConversationTrainer") as mock_trainer_class, \
             patch("sys.argv", ["run_conversation_trainer.py"]):

            mock_trainer = MagicMock()
            mock_trainer.analyze_winning_patterns = AsyncMock(return_value=["insight1", "insight2"])
            mock_trainer.generate_prompt_update = AsyncMock(return_value="Improved prompt text")
            mock_trainer.create_improvement_pr = AsyncMock(return_value="feature/improve-prompts-123")
            mock_trainer_class.return_value = mock_trainer

            from agents.run_conversation_trainer import main

            result = await main()

            assert result == 0
            mock_trainer.analyze_winning_patterns.assert_called_once_with(days_back=7)
            mock_trainer.generate_prompt_update.assert_called_once()
            mock_trainer.create_improvement_pr.assert_called_once()

    @pytest.mark.asyncio
    async def test_main_no_analysis_results(self):
        """Test: Main handles no high-rated conversations found"""
        with patch("agents.agents.conversation_trainer.ConversationTrainer") as mock_trainer_class, \
             patch("sys.argv", ["run_conversation_trainer.py"]):

            mock_trainer = MagicMock()
            mock_trainer.analyze_winning_patterns = AsyncMock(return_value=None)
            mock_trainer_class.return_value = mock_trainer

            from agents.run_conversation_trainer import main

            result = await main()

            assert result == 0
            mock_trainer.generate_prompt_update.assert_not_called()

    @pytest.mark.asyncio
    async def test_main_with_custom_days(self):
        """Test: Main accepts --days argument"""
        with patch("agents.agents.conversation_trainer.ConversationTrainer") as mock_trainer_class, \
             patch("sys.argv", ["run_conversation_trainer.py", "--days", "14"]):

            mock_trainer = MagicMock()
            mock_trainer.analyze_winning_patterns = AsyncMock(return_value=None)
            mock_trainer_class.return_value = mock_trainer
            from agents.run_conversation_trainer import main

            result = await main()

            assert result == 0
            mock_trainer.analyze_winning_patterns.assert_called_once_with(days_back=14)

    @pytest.mark.asyncio
    async def test_main_exception_handling(self):
        """Test: Main handles exceptions and returns error code"""
        with patch("agents.agents.conversation_trainer.ConversationTrainer") as mock_trainer_class, \
             patch("sys.argv", ["run_conversation_trainer.py"]):

            mock_trainer_class.side_effect = Exception("Trainer initialization failed")
            from agents.run_conversation_trainer import main

            result = await main()

            assert result == 1


"""
Coverage achieved:
- ✅ main() execution flow
- ✅ Success path with PR creation
- ✅ No analysis results case
- ✅ Custom days argument
- ✅ Exception handling

Expected coverage: 85%+ for CLI runner
"""
