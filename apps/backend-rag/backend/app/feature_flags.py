"""
ZANTARA Feature Flags
Control experimental and optional features via environment variables
"""

import os
from typing import Optional


# Skill Detection Layer (Experimental)
SKILL_DETECTION_ENABLED = os.getenv("ENABLE_SKILL_DETECTION", "false").lower() == "true"

# Collective Memory Workflow (Experimental - requires langgraph)
COLLECTIVE_MEMORY_ENABLED = os.getenv("ENABLE_COLLECTIVE_MEMORY", "false").lower() == "true"

# Advanced Analytics (Optional)
ADVANCED_ANALYTICS_ENABLED = os.getenv("ENABLE_ADVANCED_ANALYTICS", "false").lower() == "true"

# Tool Execution System (Optional)
TOOL_EXECUTION_ENABLED = os.getenv("ENABLE_TOOL_EXECUTION", "false").lower() == "true"


def should_enable_skill_detection() -> bool:
    """
    Check if Skill Detection Layer should be enabled

    Returns:
        bool: True if skill detection should be enabled
    """
    return SKILL_DETECTION_ENABLED


def should_enable_collective_memory() -> bool:
    """
    Check if Collective Memory Workflow should be enabled
    Requires langgraph to be installed

    Returns:
        bool: True if collective memory should be enabled
    """
    if not COLLECTIVE_MEMORY_ENABLED:
        return False

    # Check if langgraph is available
    try:
        import langgraph
        return True
    except ImportError:
        return False


def should_enable_tool_execution() -> bool:
    """
    Check if Tool Execution should be enabled

    Returns:
        bool: True if tool execution should be enabled
    """
    return TOOL_EXECUTION_ENABLED


def get_feature_flags() -> dict:
    """
    Get all feature flags and their current status

    Returns:
        dict: Dictionary of feature flags
    """
    return {
        "skill_detection": SKILL_DETECTION_ENABLED,
        "collective_memory": should_enable_collective_memory(),
        "advanced_analytics": ADVANCED_ANALYTICS_ENABLED,
        "tool_execution": TOOL_EXECUTION_ENABLED
    }
