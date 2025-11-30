"""
Unit tests for Plugins Registry (Simple Version)
Coverage target: 90%+ (55 statements)
Tests plugin lifecycle, registration, initialization, and shutdown
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from plugins.registry import BasePlugin, PluginInfo, PluginRegistry, plugin_registry


# ============================================================================
# Test Plugin Implementations
# ============================================================================


class MockSuccessPlugin(BasePlugin):
    """Mock plugin that initializes and shuts down successfully"""

    def get_info(self) -> PluginInfo:
        return PluginInfo(
            name="test.success",
            version="1.0.0",
            description="Test success plugin",
            author="Test Author",
        )

    async def initialize(self) -> bool:
        return True

    async def shutdown(self) -> bool:
        return True


class MockFailPlugin(BasePlugin):
    """Mock plugin that fails to initialize"""

    def get_info(self) -> PluginInfo:
        return PluginInfo(
            name="test.fail",
            version="1.0.0",
            description="Test fail plugin",
            author="Test Author",
        )

    async def initialize(self) -> bool:
        return False  # Initialization fails

    async def shutdown(self) -> bool:
        return True


class MockDisabledPlugin(BasePlugin):
    """Mock plugin that is disabled"""

    def get_info(self) -> PluginInfo:
        return PluginInfo(
            name="test.disabled",
            version="1.0.0",
            description="Test disabled plugin",
            author="Test Author",
            enabled=False,  # Disabled by default
        )

    async def initialize(self) -> bool:
        return True

    async def shutdown(self) -> bool:
        return True


class MockExceptionPlugin(BasePlugin):
    """Mock plugin that raises exception during initialization"""

    def get_info(self) -> PluginInfo:
        return PluginInfo(
            name="test.exception",
            version="1.0.0",
            description="Test exception plugin",
            author="Test Author",
        )

    async def initialize(self) -> bool:
        raise Exception("Initialization exception")

    async def shutdown(self) -> bool:
        raise Exception("Shutdown exception")


# ============================================================================
# Tests for PluginInfo
# ============================================================================


def test_plugin_info_creation():
    """Test creating PluginInfo with all fields"""
    info = PluginInfo(
        name="test.plugin",
        version="1.2.3",
        description="Test description",
        author="Test Author",
        enabled=True,
    )

    assert info.name == "test.plugin"
    assert info.version == "1.2.3"
    assert info.description == "Test description"
    assert info.author == "Test Author"
    assert info.enabled is True


def test_plugin_info_default_enabled():
    """Test PluginInfo defaults enabled to True"""
    info = PluginInfo(
        name="test",
        version="1.0.0",
        description="Test",
        author="Author",
    )

    assert info.enabled is True


def test_plugin_info_disabled():
    """Test creating disabled PluginInfo"""
    info = PluginInfo(
        name="test",
        version="1.0.0",
        description="Test",
        author="Author",
        enabled=False,
    )

    assert info.enabled is False


# ============================================================================
# Tests for BasePlugin
# ============================================================================


def test_base_plugin_initialization():
    """Test BasePlugin initializes with info"""
    plugin = MockSuccessPlugin()

    assert plugin.info is not None
    assert plugin.info.name == "test.success"
    assert plugin.info.version == "1.0.0"


@pytest.mark.asyncio
async def test_base_plugin_initialize():
    """Test plugin initialization"""
    plugin = MockSuccessPlugin()
    result = await plugin.initialize()

    assert result is True


@pytest.mark.asyncio
async def test_base_plugin_shutdown():
    """Test plugin shutdown"""
    plugin = MockSuccessPlugin()
    result = await plugin.shutdown()

    assert result is True


# ============================================================================
# Tests for PluginRegistry.register()
# ============================================================================


def test_registry_register_success():
    """Test registering a plugin"""
    registry = PluginRegistry()
    plugin = MockSuccessPlugin()

    result = registry.register(plugin)

    assert result is True
    assert "test.success" in registry.plugins
    assert registry.plugins["test.success"] == plugin


def test_registry_register_override():
    """Test registering duplicate plugin (override)"""
    registry = PluginRegistry()
    plugin1 = MockSuccessPlugin()
    plugin2 = MockSuccessPlugin()

    registry.register(plugin1)
    result = registry.register(plugin2)

    assert result is True
    assert registry.plugins["test.success"] == plugin2


# ============================================================================
# Tests for PluginRegistry.initialize_all()
# ============================================================================


@pytest.mark.asyncio
async def test_registry_initialize_all_success():
    """Test initializing all plugins successfully"""
    registry = PluginRegistry()
    plugin1 = MockSuccessPlugin()
    plugin2 = MockSuccessPlugin()
    plugin2.info.name = "test.success2"

    registry.register(plugin1)
    registry.register(plugin2)

    count = await registry.initialize_all()

    assert count == 2


@pytest.mark.asyncio
async def test_registry_initialize_all_with_disabled():
    """Test initializing plugins skips disabled ones"""
    registry = PluginRegistry()
    plugin1 = MockSuccessPlugin()
    plugin2 = MockDisabledPlugin()

    registry.register(plugin1)
    registry.register(plugin2)

    count = await registry.initialize_all()

    assert count == 1  # Only enabled plugin initialized


@pytest.mark.asyncio
async def test_registry_initialize_all_with_failure():
    """Test initializing plugins with one failure"""
    registry = PluginRegistry()
    plugin1 = MockSuccessPlugin()
    plugin2 = MockFailPlugin()

    registry.register(plugin1)
    registry.register(plugin2)

    count = await registry.initialize_all()

    assert count == 1  # Only successful plugin counted


@pytest.mark.asyncio
async def test_registry_initialize_all_with_exception():
    """Test initializing plugins with one raising exception"""
    registry = PluginRegistry()
    plugin1 = MockSuccessPlugin()
    plugin2 = MockExceptionPlugin()

    registry.register(plugin1)
    registry.register(plugin2)

    count = await registry.initialize_all()

    assert count == 1  # Exception doesn't stop other initializations


@pytest.mark.asyncio
async def test_registry_initialize_all_empty():
    """Test initializing empty registry"""
    registry = PluginRegistry()

    count = await registry.initialize_all()

    assert count == 0


# ============================================================================
# Tests for PluginRegistry.shutdown_all()
# ============================================================================


@pytest.mark.asyncio
async def test_registry_shutdown_all_success():
    """Test shutting down all plugins"""
    registry = PluginRegistry()
    plugin1 = MockSuccessPlugin()
    plugin2 = MockSuccessPlugin()
    plugin2.info.name = "test.success2"

    registry.register(plugin1)
    registry.register(plugin2)

    # Should not raise exception
    await registry.shutdown_all()


@pytest.mark.asyncio
async def test_registry_shutdown_all_with_exception():
    """Test shutting down plugins with exception"""
    registry = PluginRegistry()
    plugin1 = MockSuccessPlugin()
    plugin2 = MockExceptionPlugin()

    registry.register(plugin1)
    registry.register(plugin2)

    # Should not raise exception despite plugin2 raising
    await registry.shutdown_all()


@pytest.mark.asyncio
async def test_registry_shutdown_all_empty():
    """Test shutting down empty registry"""
    registry = PluginRegistry()

    # Should not raise exception
    await registry.shutdown_all()


# ============================================================================
# Tests for PluginRegistry.get_plugin_list()
# ============================================================================


def test_registry_get_plugin_list():
    """Test getting list of plugins"""
    registry = PluginRegistry()
    plugin1 = MockSuccessPlugin()
    plugin2 = MockDisabledPlugin()

    registry.register(plugin1)
    registry.register(plugin2)

    plugin_list = registry.get_plugin_list()

    assert len(plugin_list) == 2
    assert plugin_list[0]["name"] == "test.success"
    assert plugin_list[0]["version"] == "1.0.0"
    assert plugin_list[0]["description"] == "Test success plugin"
    assert plugin_list[0]["author"] == "Test Author"
    assert plugin_list[0]["enabled"] is True

    assert plugin_list[1]["name"] == "test.disabled"
    assert plugin_list[1]["enabled"] is False


def test_registry_get_plugin_list_empty():
    """Test getting plugin list from empty registry"""
    registry = PluginRegistry()

    plugin_list = registry.get_plugin_list()

    assert plugin_list == []


# ============================================================================
# Tests for PluginRegistry.get_plugin_count()
# ============================================================================


def test_registry_get_plugin_count():
    """Test getting plugin count"""
    registry = PluginRegistry()
    plugin1 = MockSuccessPlugin()
    plugin2 = MockDisabledPlugin()

    assert registry.get_plugin_count() == 0

    registry.register(plugin1)
    assert registry.get_plugin_count() == 1

    registry.register(plugin2)
    assert registry.get_plugin_count() == 2


def test_registry_get_plugin_count_empty():
    """Test getting count from empty registry"""
    registry = PluginRegistry()

    assert registry.get_plugin_count() == 0


# ============================================================================
# Tests for Global Plugin Registry
# ============================================================================


def test_global_plugin_registry_exists():
    """Test global plugin_registry instance exists"""
    assert plugin_registry is not None
    assert isinstance(plugin_registry, PluginRegistry)


def test_global_plugin_registry_is_singleton():
    """Test global plugin_registry is same instance"""
    from plugins.registry import plugin_registry as registry2

    assert plugin_registry is registry2


# ============================================================================
# Integration Tests
# ============================================================================


@pytest.mark.asyncio
async def test_full_plugin_lifecycle():
    """Test complete plugin lifecycle"""
    registry = PluginRegistry()
    plugin = MockSuccessPlugin()

    # Register
    assert registry.register(plugin) is True
    assert registry.get_plugin_count() == 1

    # Initialize
    count = await registry.initialize_all()
    assert count == 1

    # Get list
    plugin_list = registry.get_plugin_list()
    assert len(plugin_list) == 1

    # Shutdown
    await registry.shutdown_all()


@pytest.mark.asyncio
async def test_mixed_plugin_scenario():
    """Test scenario with mix of successful, failed, disabled plugins"""
    registry = PluginRegistry()

    success_plugin = MockSuccessPlugin()
    fail_plugin = MockFailPlugin()
    disabled_plugin = MockDisabledPlugin()
    exception_plugin = MockExceptionPlugin()

    # Register all
    registry.register(success_plugin)
    registry.register(fail_plugin)
    registry.register(disabled_plugin)
    registry.register(exception_plugin)

    assert registry.get_plugin_count() == 4

    # Initialize - only success_plugin should succeed
    count = await registry.initialize_all()
    assert count == 1

    # Get list - all should be listed
    plugin_list = registry.get_plugin_list()
    assert len(plugin_list) == 4

    # Shutdown - should handle all plugins
    await registry.shutdown_all()
