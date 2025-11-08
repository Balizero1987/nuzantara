"""
Core Plugin Base Classes

Defines the base plugin interface that all ZANTARA plugins must implement.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type
from pydantic import BaseModel, Field, validator
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class PluginCategory(str, Enum):
    """Plugin categories matching existing handler structure"""
    AI_SERVICES = "ai-services"
    ANALYTICS = "analytics"
    AUTH = "auth"
    BALI_ZERO = "bali-zero"
    COMMUNICATION = "communication"
    GOOGLE_WORKSPACE = "google-workspace"
    IDENTITY = "identity"
    INTEL = "intel"
    MAPS = "maps"
    MEMORY = "memory"
    RAG = "rag"
    SYSTEM = "system"
    ZANTARA = "zantara"
    ZERO = "zero"
    # Additional categories for future expansion
    IMMIGRATION = "immigration"
    TAX = "tax"
    BUSINESS = "business"
    PROPERTY = "property"
    LEGAL = "legal"
    FINANCE = "finance"
    GENERAL = "general"


class PluginMetadata(BaseModel):
    """Metadata for a plugin"""

    name: str = Field(..., description="Unique plugin name (e.g., 'gmail.send')")
    version: str = Field(default="1.0.0", description="Semantic version")
    description: str = Field(..., description="What this plugin does")
    category: PluginCategory = Field(..., description="Plugin category")
    author: str = Field(default="Bali Zero", description="Plugin author")
    tags: List[str] = Field(default_factory=list, description="Searchable tags")

    # Dependencies
    requires_auth: bool = Field(default=False, description="Requires user authentication")
    requires_admin: bool = Field(default=False, description="Admin only")
    dependencies: List[str] = Field(default_factory=list, description="Other plugins needed")

    # Configuration
    config_schema: Optional[Dict[str, Any]] = Field(None, description="JSON schema for config")

    # Performance
    estimated_time: float = Field(1.0, description="Estimated execution time (seconds)")
    rate_limit: Optional[int] = Field(None, description="Max calls per minute")

    # Model filtering (for Haiku vs Sonnet)
    allowed_models: List[str] = Field(
        default_factory=lambda: ["haiku", "sonnet", "opus"],
        description="Which AI models can use this plugin"
    )

    # Backward compatibility
    legacy_handler_key: Optional[str] = Field(
        None,
        description="Original handler key for backward compatibility (e.g., 'gmail.send')"
    )

    @validator("version")
    def validate_version(cls, v):
        """Validate semantic versioning format"""
        parts = v.split(".")
        if len(parts) != 3:
            raise ValueError("Version must be in format X.Y.Z")
        for part in parts:
            if not part.isdigit():
                raise ValueError("Version parts must be numeric")
        return v

    class Config:
        use_enum_values = True


class PluginInput(BaseModel):
    """Base class for plugin inputs"""

    class Config:
        extra = "allow"  # Allow additional fields for flexibility


class PluginOutput(BaseModel):
    """Base class for plugin outputs"""

    success: bool = Field(..., description="Whether execution succeeded")
    data: Any = Field(None, description="Result data")
    error: Optional[str] = Field(None, description="Error message if failed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Execution metadata")

    # Backward compatibility
    ok: Optional[bool] = Field(None, description="Legacy success field")

    def __init__(self, **data):
        """Initialize and set ok field for backward compatibility"""
        super().__init__(**data)
        if self.ok is None:
            self.ok = self.success

    class Config:
        extra = "allow"


class Plugin(ABC):
    """
    Base class for all ZANTARA plugins.

    Every tool must inherit from this and implement:
    - metadata: Plugin metadata
    - input_schema: Pydantic model for inputs
    - output_schema: Pydantic model for outputs
    - execute: Main execution logic
    - validate: Input validation (optional)

    Example:
        class EmailSenderPlugin(Plugin):
            @property
            def metadata(self) -> PluginMetadata:
                return PluginMetadata(
                    name="gmail.send",
                    description="Send email via Gmail",
                    category=PluginCategory.GOOGLE_WORKSPACE,
                    tags=["email", "gmail", "send"],
                    requires_auth=True,
                    estimated_time=2.0,
                    rate_limit=10
                )

            @property
            def input_schema(self) -> Type[PluginInput]:
                return EmailSenderInput

            @property
            def output_schema(self) -> Type[PluginOutput]:
                return EmailSenderOutput

            async def execute(self, input_data: EmailSenderInput) -> EmailSenderOutput:
                # Implementation
                pass
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize plugin with optional configuration"""
        self.config = config or {}
        self._validate_config()
        logger.info(f"Initialized plugin: {self.metadata.name} v{self.metadata.version}")

    @property
    @abstractmethod
    def metadata(self) -> PluginMetadata:
        """Return plugin metadata"""
        pass

    @property
    @abstractmethod
    def input_schema(self) -> Type[PluginInput]:
        """Return Pydantic model for inputs"""
        pass

    @property
    @abstractmethod
    def output_schema(self) -> Type[PluginOutput]:
        """Return Pydantic model for outputs"""
        pass

    @abstractmethod
    async def execute(self, input_data: PluginInput) -> PluginOutput:
        """
        Main execution logic. Must be async.

        Args:
            input_data: Validated input data

        Returns:
            PluginOutput with results
        """
        pass

    async def validate(self, input_data: PluginInput) -> bool:
        """
        Optional validation logic beyond Pydantic.
        Override if needed for complex validation.

        Args:
            input_data: Input data to validate

        Returns:
            True if valid, False otherwise
        """
        return True

    def _validate_config(self):
        """Validate plugin configuration against schema"""
        if self.metadata.config_schema:
            # TODO: Add JSON schema validation
            pass

    async def on_load(self):
        """
        Called when plugin is loaded. Override for setup.
        Use this for:
        - Database connections
        - External service initialization
        - Cache warming
        """
        logger.debug(f"Loading plugin: {self.metadata.name}")

    async def on_unload(self):
        """
        Called when plugin is unloaded. Override for cleanup.
        Use this for:
        - Closing connections
        - Releasing resources
        - Saving state
        """
        logger.debug(f"Unloading plugin: {self.metadata.name}")

    def to_anthropic_tool_definition(self) -> Dict[str, Any]:
        """
        Convert plugin to Anthropic tool definition format.
        Used for Claude AI integration.
        """
        return {
            "name": self.metadata.name.replace(".", "_"),
            "description": self.metadata.description,
            "input_schema": self.input_schema.schema(),
        }

    def to_handler_format(self) -> Dict[str, Any]:
        """
        Convert plugin to legacy handler format for backward compatibility.
        """
        return {
            "key": self.metadata.legacy_handler_key or self.metadata.name,
            "description": self.metadata.description,
            "requiresAuth": self.metadata.requires_auth,
            "requiresAdmin": self.metadata.requires_admin,
            "tags": self.metadata.tags,
        }
