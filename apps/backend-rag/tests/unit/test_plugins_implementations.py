"""
Unit tests for Plugin Implementations (Analytics, Caching, Monitoring)
Coverage target: 90%+ for all three plugins
Tests plugin initialization, shutdown, and metadata
"""

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from plugins.analytics_plugin import AnalyticsPlugin
from plugins.caching_plugin import CachingPlugin
from plugins.monitoring_plugin import MonitoringPlugin
from plugins.registry import BasePlugin, PluginInfo


# ============================================================================
# Tests for AnalyticsPlugin
# ============================================================================


def test_analytics_plugin_info():
    """Test AnalyticsPlugin metadata"""
    plugin = AnalyticsPlugin()

    assert plugin.info.name == "analytics"
    assert plugin.info.version == "1.0.0"
    assert plugin.info.description == "Analytics and metrics tracking plugin"
    assert plugin.info.author == "ZANTARA Team"
    assert plugin.info.enabled is True


def test_analytics_plugin_is_base_plugin():
    """Test AnalyticsPlugin extends BasePlugin"""
    plugin = AnalyticsPlugin()
    assert isinstance(plugin, BasePlugin)


@pytest.mark.asyncio
async def test_analytics_plugin_initialize_success():
    """Test successful initialization"""
    plugin = AnalyticsPlugin()

    result = await plugin.initialize()

    assert result is True
    assert hasattr(plugin, "metrics")
    assert plugin.metrics["requests"] == 0
    assert plugin.metrics["errors"] == 0
    assert plugin.metrics["response_times"] == []


@pytest.mark.asyncio
async def test_analytics_plugin_initialize_exception():
    """Test initialization with exception"""
    plugin = AnalyticsPlugin()

    # Force exception by patching logger.info to raise
    with patch("plugins.analytics_plugin.logger.info", side_effect=Exception("Init error")):
        result = await plugin.initialize()
        assert result is False


@pytest.mark.asyncio
async def test_analytics_plugin_shutdown_success():
    """Test successful shutdown"""
    plugin = AnalyticsPlugin()
    await plugin.initialize()

    result = await plugin.shutdown()

    assert result is True


@pytest.mark.asyncio
async def test_analytics_plugin_shutdown_exception():
    """Test shutdown with exception"""
    plugin = AnalyticsPlugin()

    # Force exception by patching logger.info to raise
    with patch("plugins.analytics_plugin.logger.info", side_effect=Exception("Shutdown error")):
        result = await plugin.shutdown()
        assert result is False


# ============================================================================
# Tests for CachingPlugin
# ============================================================================


def test_caching_plugin_info():
    """Test CachingPlugin metadata"""
    plugin = CachingPlugin()

    assert plugin.info.name == "caching"
    assert plugin.info.version == "1.0.0"
    assert "caching mechanisms" in plugin.info.description.lower()
    assert plugin.info.author == "ZANTARA Team"
    assert plugin.info.enabled is True


def test_caching_plugin_is_base_plugin():
    """Test CachingPlugin extends BasePlugin"""
    plugin = CachingPlugin()
    assert isinstance(plugin, BasePlugin)


@pytest.mark.asyncio
async def test_caching_plugin_initialize_success():
    """Test successful initialization"""
    plugin = CachingPlugin()

    result = await plugin.initialize()

    assert result is True
    assert hasattr(plugin, "cache_layers")
    assert "memory" in plugin.cache_layers
    assert "redis" in plugin.cache_layers
    assert "database" in plugin.cache_layers
    assert plugin.cache_layers["memory"] == {}
    assert plugin.cache_layers["redis"] is None
    assert plugin.cache_layers["database"] is None


@pytest.mark.asyncio
async def test_caching_plugin_initialize_exception():
    """Test initialization with exception"""
    plugin = CachingPlugin()

    # Force exception by patching logger.info to raise
    with patch("plugins.caching_plugin.logger.info", side_effect=Exception("Init error")):
        result = await plugin.initialize()
        assert result is False


@pytest.mark.asyncio
async def test_caching_plugin_shutdown_success():
    """Test successful shutdown"""
    plugin = CachingPlugin()
    await plugin.initialize()

    result = await plugin.shutdown()

    assert result is True


@pytest.mark.asyncio
async def test_caching_plugin_shutdown_exception():
    """Test shutdown with exception"""
    plugin = CachingPlugin()

    # Force exception by patching logger.info to raise
    with patch("plugins.caching_plugin.logger.info", side_effect=Exception("Shutdown error")):
        result = await plugin.shutdown()
        assert result is False


# ============================================================================
# Tests for MonitoringPlugin
# ============================================================================


def test_monitoring_plugin_info():
    """Test MonitoringPlugin metadata"""
    plugin = MonitoringPlugin()

    assert plugin.info.name == "monitoring"
    assert plugin.info.version == "1.0.0"
    assert "health monitoring" in plugin.info.description.lower()
    assert plugin.info.author == "ZANTARA Team"
    assert plugin.info.enabled is True


def test_monitoring_plugin_is_base_plugin():
    """Test MonitoringPlugin extends BasePlugin"""
    plugin = MonitoringPlugin()
    assert isinstance(plugin, BasePlugin)


@pytest.mark.asyncio
async def test_monitoring_plugin_initialize_success():
    """Test successful initialization"""
    plugin = MonitoringPlugin()

    result = await plugin.initialize()

    assert result is True
    assert hasattr(plugin, "health_checks")
    assert hasattr(plugin, "alerts")
    assert hasattr(plugin, "metrics_collectors")
    assert plugin.health_checks == []
    assert plugin.alerts == []
    assert plugin.metrics_collectors == {}


@pytest.mark.asyncio
async def test_monitoring_plugin_initialize_exception():
    """Test initialization with exception"""
    plugin = MonitoringPlugin()

    # Force exception by patching logger.info to raise
    with patch("plugins.monitoring_plugin.logger.info", side_effect=Exception("Init error")):
        result = await plugin.initialize()
        assert result is False


@pytest.mark.asyncio
async def test_monitoring_plugin_shutdown_success():
    """Test successful shutdown"""
    plugin = MonitoringPlugin()
    await plugin.initialize()

    result = await plugin.shutdown()

    assert result is True


@pytest.mark.asyncio
async def test_monitoring_plugin_shutdown_exception():
    """Test shutdown with exception"""
    plugin = MonitoringPlugin()

    # Force exception by patching logger.info to raise
    with patch("plugins.monitoring_plugin.logger.info", side_effect=Exception("Shutdown error")):
        result = await plugin.shutdown()
        assert result is False


# ============================================================================
# Integration Tests - All Plugins
# ============================================================================


@pytest.mark.asyncio
async def test_all_plugins_lifecycle():
    """Test complete lifecycle for all plugins"""
    plugins = [
        AnalyticsPlugin(),
        CachingPlugin(),
        MonitoringPlugin(),
    ]

    # Initialize all
    for plugin in plugins:
        result = await plugin.initialize()
        assert result is True

    # Verify all initialized
    assert hasattr(plugins[0], "metrics")
    assert hasattr(plugins[1], "cache_layers")
    assert hasattr(plugins[2], "health_checks")

    # Shutdown all
    for plugin in plugins:
        result = await plugin.shutdown()
        assert result is True


def test_all_plugins_have_unique_names():
    """Test all plugins have unique names"""
    plugins = [
        AnalyticsPlugin(),
        CachingPlugin(),
        MonitoringPlugin(),
    ]

    names = [p.info.name for p in plugins]
    assert len(names) == len(set(names))
    assert "analytics" in names
    assert "caching" in names
    assert "monitoring" in names


def test_all_plugins_same_version():
    """Test all plugins use same version"""
    plugins = [
        AnalyticsPlugin(),
        CachingPlugin(),
        MonitoringPlugin(),
    ]

    versions = [p.info.version for p in plugins]
    assert all(v == "1.0.0" for v in versions)


def test_all_plugins_same_author():
    """Test all plugins have same author"""
    plugins = [
        AnalyticsPlugin(),
        CachingPlugin(),
        MonitoringPlugin(),
    ]

    authors = [p.info.author for p in plugins]
    assert all(a == "ZANTARA Team" for a in authors)
