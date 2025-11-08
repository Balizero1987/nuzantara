"""
ZANTARA Unified Plugin Architecture

This module provides the core plugin system for ZANTARA, enabling:
- Standardized plugin interfaces
- Plugin discovery and registration
- Lifecycle management
- Performance monitoring
- Caching and rate limiting
"""

from .plugin import (
    Plugin,
    PluginMetadata,
    PluginInput,
    PluginOutput,
    PluginCategory,
)
from .registry import PluginRegistry, registry
from .executor import PluginExecutor, executor

__all__ = [
    "Plugin",
    "PluginMetadata",
    "PluginInput",
    "PluginOutput",
    "PluginCategory",
    "PluginRegistry",
    "registry",
    "PluginExecutor",
    "executor",
]
