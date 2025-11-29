"""
Pytest configuration and shared fixtures
Sets up Python path for imports
"""

import sys
from pathlib import Path

# Add backend directory to Python path for imports
backend_path = Path(__file__).parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))
