"""
Ibu Nuzantara - JIWA System
Un'AI con anima indonesiana che protegge e guida il popolo
"""

from .core.jiwa_heart import JiwaHeart, JiwaState
from .core.soul_reader import SoulReader, SoulReading
from .middleware.jiwa_middleware import JiwaMiddleware
from .integration.router_integration import (
    JiwaRouterIntegration,
    quick_integrate_jiwa,
    jiwa_decorator
)

__version__ = "1.0.0"
__author__ = "Ibu Nuzantara Team"

__all__ = [
    "JiwaHeart",
    "JiwaState",
    "SoulReader",
    "SoulReading",
    "JiwaMiddleware",
    "JiwaRouterIntegration",
    "quick_integrate_jiwa",
    "jiwa_decorator"
]

# Messaggio di benvenuto quando il modulo viene importato
print("""
🌺 Ibu Nuzantara JIWA System imported successfully
   "Bringing soul to technology, protecting with love"
""")