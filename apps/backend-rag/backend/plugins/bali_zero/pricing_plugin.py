"""
Pricing Plugin - Official Bali Zero Pricing

Migrated from: backend/services/zantara_tools.py -> _get_pricing
"""

from typing import Optional, List
from pydantic import Field
from core.plugins import Plugin, PluginMetadata, PluginInput, PluginOutput, PluginCategory
from services.pricing_service import get_pricing_service
import logging

logger = logging.getLogger(__name__)


class PricingQueryInput(PluginInput):
    """Input schema for pricing queries"""

    service_type: str = Field(
        default="all",
        description="Type of service: visa, kitas, business_setup, tax_consulting, legal, or all",
    )
    query: Optional[str] = Field(
        None, description="Optional: specific search query (e.g. 'long-stay permit', 'company setup')"
    )


class PricingQueryOutput(PluginOutput):
    """Output schema for pricing queries"""

    prices: Optional[List[dict]] = Field(None, description="List of pricing items")
    fallback_contact: Optional[dict] = Field(None, description="Contact info if prices not available")


class PricingPlugin(Plugin):
    """
    Official Bali Zero pricing plugin.

    ⚠️ CRITICAL: ALWAYS use this plugin for ANY pricing question. NEVER generate prices from memory.

    This returns OFFICIAL 2025 prices including:
    - Visa prices (C1 Tourism, C2 Business, D1/D2 Multiple Entry, etc.)
    - KITAS prices (E23 Freelance, E23 Working, E28A Investor, E33F Retirement, E33G Remote Worker)
    - Business services (PT PMA setup, company revision, alcohol license, legal real estate)
    - Tax services (NPWP, monthly/annual reports, BPJS)
    - Quick quote packages
    - Bali Zero service margins and government fee breakdowns
    """

    def __init__(self, config: Optional[dict] = None):
        super().__init__(config)
        self.pricing_service = get_pricing_service()

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="bali_zero.pricing",
            version="1.0.0",
            description="Get OFFICIAL Bali Zero pricing for all services (visa, KITAS, business, tax)",
            category=PluginCategory.BALI_ZERO,
            tags=["pricing", "bali-zero", "official", "visa", "kitas", "business", "tax"],
            requires_auth=False,
            estimated_time=0.5,
            rate_limit=30,  # 30 calls per minute
            allowed_models=["haiku", "sonnet", "opus"],
            legacy_handler_key="get_pricing",
        )

    @property
    def input_schema(self):
        return PricingQueryInput

    @property
    def output_schema(self):
        return PricingQueryOutput

    async def execute(self, input_data: PricingQueryInput) -> PricingQueryOutput:
        """Execute pricing query"""
        try:
            service_type = input_data.service_type
            query = input_data.query

            logger.info(f"💰 Pricing query: service_type={service_type}, query={query}")

            # If query provided, search specifically
            if query:
                result = self.pricing_service.search_service(query)
            else:
                result = self.pricing_service.get_pricing(service_type)

            # Check if pricing loaded successfully
            if not self.pricing_service.loaded:
                return PricingQueryOutput(
                    success=False,
                    error="Official prices not loaded",
                    fallback_contact={
                        "email": "info@balizero.com",
                        "whatsapp": "+62 813 3805 1876",
                    },
                )

            return PricingQueryOutput(success=True, data=result, prices=result)

        except Exception as e:
            logger.error(f"❌ Pricing plugin error: {e}")
            return PricingQueryOutput(
                success=False, error=f"Pricing lookup failed: {str(e)}"
            )
