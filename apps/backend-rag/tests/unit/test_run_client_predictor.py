"""
Tests for agents/run_client_predictor.py

Target: CLI runner script coverage
File: backend/agents/run_client_predictor.py (27 lines)
"""

import sys
from pathlib import Path
import pytest
from unittest.mock import MagicMock, AsyncMock, patch

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


class TestRunClientPredictor:
    """Test run_client_predictor.py CLI runner"""

    @pytest.mark.asyncio
    async def test_main_success(self):
        """Test: Main executes successfully"""
        with patch("agents.agents.client_value_predictor.ClientValuePredictor") as mock_predictor_class:

            mock_predictor = MagicMock()
            mock_predictor.run_daily_nurturing = AsyncMock(return_value={
                "vip_nurtured": 3,
                "high_risk_contacted": 5,
                "total_messages_sent": 8,
                "errors": []
            })
            mock_predictor_class.return_value = mock_predictor

            from agents.run_client_predictor import main

            result = await main()

            assert result == 0
            mock_predictor.run_daily_nurturing.assert_called_once()

    @pytest.mark.asyncio
    async def test_main_with_errors(self):
        """Test: Main handles errors in results"""
        with patch("agents.agents.client_value_predictor.ClientValuePredictor") as mock_predictor_class:

            mock_predictor = MagicMock()
            mock_predictor.run_daily_nurturing = AsyncMock(return_value={
                "vip_nurtured": 1,
                "high_risk_contacted": 2,
                "total_messages_sent": 3,
                "errors": ["Error 1", "Error 2", "Error 3"]
            })
            mock_predictor_class.return_value = mock_predictor

            from agents.run_client_predictor import main

            result = await main()

            assert result == 0  # Still returns success even with processing errors

    @pytest.mark.asyncio
    async def test_main_exception_handling(self):
        """Test: Main handles exceptions and returns error code"""
        import importlib
        import agents.run_client_predictor

        with patch("agents.agents.client_value_predictor.ClientValuePredictor") as mock_predictor_class:

            mock_predictor_class.side_effect = Exception("Predictor initialization failed")

            # Reload module to ensure patch is applied
            importlib.reload(agents.run_client_predictor)
            from agents.run_client_predictor import main

            result = await main()

            assert result == 1

        # Reload again to restore normal behavior
        importlib.reload(agents.run_client_predictor)

    @pytest.mark.asyncio
    async def test_main_nurturing_exception(self):
        """Test: Main handles nurturing exceptions"""
        import importlib
        import agents.run_client_predictor

        with patch("agents.agents.client_value_predictor.ClientValuePredictor") as mock_predictor_class:

            mock_predictor = MagicMock()
            mock_predictor.run_daily_nurturing = AsyncMock(side_effect=Exception("Nurturing failed"))
            mock_predictor_class.return_value = mock_predictor

            # Reload module to ensure patch is applied
            importlib.reload(agents.run_client_predictor)
            from agents.run_client_predictor import main

            result = await main()

            assert result == 1

        # Reload again to restore normal behavior
        importlib.reload(agents.run_client_predictor)


"""
Coverage achieved:
- ✅ main() execution flow
- ✅ Success path with results
- ✅ Error handling in results
- ✅ Exception handling

Expected coverage: 85%+ for CLI runner
"""
