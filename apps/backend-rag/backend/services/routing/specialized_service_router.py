"""
Specialized Service Router Module
Routes to autonomous research and cross-oracle synthesis services
"""

import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Autonomous Research keywords
AMBIGUOUS_KEYWORDS = [
    "crypto", "cryptocurrency", "blockchain", "nft", "web3",
    "new type", "nuovo", "baru", "innovative", "innovativo",
    "non standard", "uncommon", "rare", "unusual",
    "multiple", "several", "various", "diversi", "beberapa",
    "complete process", "percorso completo", "proses lengkap",
    "all requirements", "tutti requisiti", "semua syarat"
]

# Business setup keywords
BUSINESS_SETUP_KEYWORDS = [
    # Opening/starting
    "open", "start", "launch", "setup", "establish", "create",
    "aprire", "avviare", "lanciare", "creare",
    "buka", "mulai", "dirikan",
    # Business types
    "restaurant", "cafe", "shop", "store", "hotel", "villa",
    "ristorante", "negozio", "albergo",
    "restoran", "toko", "hotel",
    # Action-oriented
    "invest", "investire", "investasi",
    "business", "company", "azienda", "bisnis", "perusahaan"
]

# Comprehensive indicators
COMPREHENSIVE_INDICATORS = [
    "everything", "tutto", "semua",
    "complete", "completo", "lengkap",
    "full", "penuh",
    "timeline", "cronologia",
    "investment", "investimento", "investasi",
    "requirements", "requisiti", "persyaratan"
]

# How-to patterns
HOW_TO_PATTERNS = ["how to", "come si", "bagaimana cara"]


class SpecializedServiceRouter:
    """
    Router for specialized services

    Routes complex queries to:
    - AutonomousResearchService: Ambiguous/complex multi-collection queries
    - CrossOracleSynthesisService: Business planning and comprehensive queries
    """

    def __init__(
        self,
        autonomous_research_service=None,
        cross_oracle_synthesis_service=None
    ):
        """
        Initialize specialized service router

        Args:
            autonomous_research_service: AutonomousResearchService instance
            cross_oracle_synthesis_service: CrossOracleSynthesisService instance
        """
        self.autonomous_research = autonomous_research_service
        self.cross_oracle = cross_oracle_synthesis_service

        logger.info("✅ SpecializedServiceRouter initialized")
        logger.info(f"   Autonomous Research: {'✅' if autonomous_research_service else '❌'}")
        logger.info(f"   Cross-Oracle Synthesis: {'✅' if cross_oracle_synthesis_service else '❌'}")

    def detect_autonomous_research(self, message: str, category: str) -> bool:
        """
        Detect if query needs autonomous research

        Args:
            message: User message
            category: Intent category

        Returns:
            True if autonomous research is needed
        """
        if not self.autonomous_research:
            return False

        if category not in ["business_complex", "business_simple"]:
            return False

        message_lower = message.lower()

        # Check for ambiguous terms
        has_ambiguous_term = any(kw in message_lower for kw in AMBIGUOUS_KEYWORDS)

        # Check for long/complex queries
        is_long_query = len(message.split()) > 15
        has_how_to = any(pattern in message_lower for pattern in HOW_TO_PATTERNS)

        needs_research = has_ambiguous_term or (is_long_query and has_how_to)

        if needs_research:
            logger.info("🔬 [SpecializedRouter] AUTONOMOUS RESEARCH detected")
            logger.info(f"   Ambiguous: {has_ambiguous_term}, Long: {is_long_query}, How-to: {has_how_to}")

        return needs_research

    async def route_autonomous_research(
        self,
        query: str,
        user_level: int = 3
    ) -> Optional[Dict[str, Any]]:
        """
        Route to autonomous research service

        Args:
            query: User query
            user_level: User access level

        Returns:
            Response dict or None if failed
        """
        if not self.autonomous_research:
            return None

        try:
            # Perform autonomous research
            research_result = await self.autonomous_research.research(
                query=query,
                user_level=user_level
            )

            logger.info(
                f"✅ [Autonomous Research] Complete: {research_result.total_steps} steps, "
                f"{len(research_result.collections_explored)} collections, "
                f"confidence={research_result.confidence:.2f}"
            )

            return {
                "response": research_result.final_answer,
                "ai_used": "haiku",
                "category": "autonomous_research",
                "model": "claude-haiku-4.5",
                "tokens": {"input": 0, "output": 0},
                "used_rag": True,
                "autonomous_research": {
                    "total_steps": research_result.total_steps,
                    "collections_explored": research_result.collections_explored,
                    "confidence": research_result.confidence,
                    "sources_consulted": research_result.sources_consulted,
                    "duration_ms": research_result.duration_ms
                }
            }

        except Exception as e:
            logger.error(f"❌ [Autonomous Research] Failed: {e}")
            return None

    def detect_cross_oracle(self, message: str, category: str) -> bool:
        """
        Detect if query needs cross-oracle synthesis

        Args:
            message: User message
            category: Intent category

        Returns:
            True if cross-oracle synthesis is needed
        """
        if not self.cross_oracle:
            return False

        if category not in ["business_complex", "business_simple"]:
            return False

        message_lower = message.lower()

        # Check for business setup terms
        has_business_setup_term = any(kw in message_lower for kw in BUSINESS_SETUP_KEYWORDS)

        # Check for comprehensive indicators
        wants_comprehensive_plan = any(ind in message_lower for ind in COMPREHENSIVE_INDICATORS)

        # Trigger: business setup term + (wants plan OR long query)
        needs_cross_oracle = has_business_setup_term and (
            wants_comprehensive_plan or len(message.split()) > 10
        )

        if needs_cross_oracle:
            logger.info("🎯 [SpecializedRouter] CROSS-ORACLE SYNTHESIS detected")
            logger.info(f"   Business setup: {has_business_setup_term}, Comprehensive: {wants_comprehensive_plan}")

        return needs_cross_oracle

    async def route_cross_oracle(
        self,
        query: str,
        user_level: int = 3,
        use_cache: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Route to cross-oracle synthesis service

        Args:
            query: User query
            user_level: User access level
            use_cache: Whether to use cache

        Returns:
            Response dict or None if failed
        """
        if not self.cross_oracle:
            return None

        try:
            # Perform cross-oracle synthesis
            synthesis_result = await self.cross_oracle.synthesize(
                query=query,
                user_level=user_level,
                use_cache=use_cache
            )

            logger.info(
                f"✅ [Cross-Oracle Synthesis] Complete: {synthesis_result.scenario_type}, "
                f"{len(synthesis_result.oracles_consulted)} Oracles consulted, "
                f"confidence={synthesis_result.confidence:.2f}"
            )

            return {
                "response": synthesis_result.synthesis,
                "ai_used": "haiku",
                "category": "cross_oracle_synthesis",
                "model": "claude-haiku-4.5",
                "tokens": {"input": 0, "output": 0},
                "used_rag": True,
                "cross_oracle_synthesis": {
                    "scenario_type": synthesis_result.scenario_type,
                    "oracles_consulted": synthesis_result.oracles_consulted,
                    "confidence": synthesis_result.confidence,
                    "timeline": synthesis_result.timeline,
                    "investment": synthesis_result.investment,
                    "key_requirements": synthesis_result.key_requirements,
                    "risks": synthesis_result.risks
                }
            }

        except Exception as e:
            logger.error(f"❌ [Cross-Oracle Synthesis] Failed: {e}")
            return None
