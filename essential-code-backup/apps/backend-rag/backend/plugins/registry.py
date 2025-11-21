"""
ZANTARA Plugin Registry
Manages plugin lifecycle and registration
"""
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

@dataclass
class PluginInfo:
    name: str
    version: str
    description: str
    author: str
    enabled: bool = True

class BasePlugin(ABC):
    """Base class for all ZANTARA plugins"""
    
    def __init__(self):
        self.info = self.get_info()
        
    @abstractmethod
    def get_info(self) -> PluginInfo:
        """Return plugin information"""
        pass
    
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize plugin. Return True if successful"""
        pass
    
    @abstractmethod
    async def shutdown(self) -> bool:
        """Clean shutdown. Return True if successful"""
        pass

class PluginRegistry:
    """Central registry for all plugins"""
    
    def __init__(self):
        self.plugins: Dict[str, BasePlugin] = {}
        self.logger = logging.getLogger(__name__)
    
    def register(self, plugin: BasePlugin) -> bool:
        """Register a plugin"""
        try:
            if plugin.info.name in self.plugins:
                self.logger.warning(f"Plugin {plugin.info.name} already registered, overriding")
            
            self.plugins[plugin.info.name] = plugin
            self.logger.info(f"✅ Registered plugin: {plugin.info.name} v{plugin.info.version}")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to register plugin {plugin.info.name}: {e}")
            return False
    
    async def initialize_all(self) -> int:
        """Initialize all registered plugins. Returns count of successful initializations"""
        success_count = 0
        
        for name, plugin in self.plugins.items():
            if not plugin.info.enabled:
                self.logger.info(f"⏸️ Plugin {name} is disabled, skipping")
                continue
                
            try:
                if await plugin.initialize():
                    success_count += 1
                    self.logger.info(f"✅ Plugin {name} initialized successfully")
                else:
                    self.logger.error(f"❌ Plugin {name} failed to initialize")
            except Exception as e:
                self.logger.error(f"❌ Plugin {name} initialization error: {e}")
        
        return success_count
    
    async def shutdown_all(self):
        """Shutdown all plugins"""
        for name, plugin in self.plugins.items():
            try:
                await plugin.shutdown()
                self.logger.info(f"✅ Plugin {name} shutdown successfully")
            except Exception as e:
                self.logger.error(f"❌ Plugin {name} shutdown error: {e}")
    
    def get_plugin_list(self) -> List[Dict[str, Any]]:
        """Get list of all registered plugins"""
        return [
            {
                "name": plugin.info.name,
                "version": plugin.info.version,
                "description": plugin.info.description,
                "author": plugin.info.author,
                "enabled": plugin.info.enabled
            }
            for plugin in self.plugins.values()
        ]
    
    def get_plugin_count(self) -> int:
        """Get total plugin count"""
        return len(self.plugins)

# Global plugin registry instance
plugin_registry = PluginRegistry()