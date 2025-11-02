"""
ZANTARA Sub Rosa Protocol - Content Access Mapper

Maps Sub Rosa levels (L0-L3) to ChromaDB Tier levels (S/A/B/C/D).
Implements content filtering based on initiation level and topic sensitivity.
"""

from typing import List, Dict, Set
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SubRosaLevel(int, Enum):
    """Sub Rosa access levels"""
    L0_PUBLIC = 0      # Public - Basic business/travel info only
    L1_CURIOUS = 1     # Curious Seeker - Access to introductory esoteric content
    L2_PRACTITIONER = 2  # Active Practitioner - Access to advanced practices
    L3_INITIATED = 3   # Initiated - Full access to sacred knowledge


class ContentTier(str, Enum):
    """Content tier classifications (matches ChromaDB)"""
    S = "S"  # Supreme - Quantum physics, consciousness, advanced metaphysics
    A = "A"  # Advanced - Philosophy, psychology, spiritual teachings
    B = "B"  # Intermediate - History, culture, practical wisdom
    C = "C"  # Basic - Self-help, business, general knowledge
    D = "D"  # Public - Popular science, introductory texts


class SubRosaMapper:
    """
    Maps Sub Rosa levels to allowed content tiers.

    Philosophy:
    - L0 (Public): Only public business/travel info (Tier D, C filtered)
    - L1 (Curious): Basic esoteric intro + public content (Tier D, C, B filtered)
    - L2 (Practitioner): Advanced practices + philosophy (Tier D, C, B, A filtered)
    - L3 (Initiated): Full access to sacred knowledge (All tiers)

    Topic-based restrictions:
    - Certain sacred topics are restricted even at lower tiers
    """

    # Sub Rosa Level → Allowed Tiers
    LEVEL_TO_TIERS: Dict[int, List[str]] = {
        0: ["D", "C"],              # L0: Public only (business, travel, general)
        1: ["D", "C", "B"],         # L1: + Intermediate (philosophy intro, culture)
        2: ["D", "C", "B", "A"],    # L2: + Advanced (spiritual practices, psychology)
        3: ["D", "C", "B", "A", "S"]  # L3: Full access (quantum, consciousness, sacred)
    }

    # Sacred topics requiring L2+ access (even if tier allows)
    SACRED_TOPICS_L2_PLUS: Set[str] = {
        "initiation", "ritual", "tantra", "kundalini", "hermetic_practice",
        "magic", "invocation", "gnosis", "mystery_schools", "kabbalah_practice"
    }

    # Supreme sacred topics requiring L3 (Initiated) only
    SUPREME_SACRED_L3_ONLY: Set[str] = {
        "inner_alchemy", "theurgy", "advaita_vedanta", "supreme_identity",
        "metaphysical_realization", "consciousness_engineering", "void_meditation",
        "guenon_metaphysics", "sunda_wiwitan_sacred", "ambaradam_protocol"
    }

    # Public topics always accessible (even at L0)
    PUBLIC_TOPICS: Set[str] = {
        "visa", "immigration", "b211a", "b211b", "kitas", "pt_pma",
        "company_formation", "tax", "business_indonesia", "bali_tourism",
        "travel", "culture_general", "language", "food"
    }

    def __init__(self):
        logger.info("✅ SubRosaMapper initialized")

    def get_allowed_tiers(self, sub_rosa_level: int) -> List[str]:
        """
        Get allowed content tiers for a Sub Rosa level.

        Args:
            sub_rosa_level: Sub Rosa level (0-3)

        Returns:
            List of allowed tier codes (e.g., ["D", "C", "B"])
        """
        if sub_rosa_level not in self.LEVEL_TO_TIERS:
            logger.warning(f"⚠️ Invalid Sub Rosa level {sub_rosa_level}, defaulting to L0")
            sub_rosa_level = 0

        tiers = self.LEVEL_TO_TIERS[sub_rosa_level]
        logger.debug(f"Sub Rosa L{sub_rosa_level} → Tiers {tiers}")
        return tiers

    def can_access_topic(self, sub_rosa_level: int, topic: str) -> bool:
        """
        Check if a Sub Rosa level can access a specific topic.

        Topic access rules:
        1. Public topics → always accessible
        2. Supreme sacred topics → L3 only
        3. Sacred topics → L2+ only
        4. Other topics → tier-based filtering

        Args:
            sub_rosa_level: Sub Rosa level (0-3)
            topic: Topic identifier (lowercase, underscored)

        Returns:
            True if accessible
        """
        topic_lower = topic.lower()

        # Public topics always accessible
        if topic_lower in self.PUBLIC_TOPICS:
            return True

        # Supreme sacred topics require L3
        if topic_lower in self.SUPREME_SACRED_L3_ONLY:
            return sub_rosa_level >= 3

        # Sacred topics require L2+
        if topic_lower in self.SACRED_TOPICS_L2_PLUS:
            return sub_rosa_level >= 2

        # Default: allow (tier filtering handles the rest)
        return True

    def filter_results_by_topics(
        self,
        results: List[Dict],
        sub_rosa_level: int
    ) -> List[Dict]:
        """
        Filter search results by topic restrictions.

        Args:
            results: List of search result dicts with metadata.topics
            sub_rosa_level: Sub Rosa level (0-3)

        Returns:
            Filtered results list
        """
        filtered = []
        blocked_count = 0

        for result in results:
            metadata = result.get("metadata", {})
            topics = metadata.get("topics", [])

            # Check all topics in the result
            blocked = False
            for topic in topics:
                if not self.can_access_topic(sub_rosa_level, topic):
                    blocked = True
                    blocked_count += 1
                    logger.debug(f"🚫 Blocked result (topic: {topic}, level: L{sub_rosa_level})")
                    break

            if not blocked:
                filtered.append(result)

        if blocked_count > 0:
            logger.info(f"🔒 Sub Rosa filter: {blocked_count} results blocked for L{sub_rosa_level}")

        return filtered

    def get_content_summary(self, sub_rosa_level: int) -> Dict:
        """
        Get content access summary for a Sub Rosa level.

        Returns:
            Dict with allowed_tiers, sacred_access, public_access
        """
        allowed_tiers = self.get_allowed_tiers(sub_rosa_level)

        return {
            "sub_rosa_level": sub_rosa_level,
            "allowed_tiers": allowed_tiers,
            "public_topics": sub_rosa_level >= 0,
            "sacred_topics_l2": sub_rosa_level >= 2,
            "supreme_sacred_l3": sub_rosa_level >= 3,
            "total_tier_count": len(allowed_tiers),
            "description": self._get_level_description(sub_rosa_level)
        }

    def _get_level_description(self, level: int) -> str:
        """Get human-readable description of access level"""
        descriptions = {
            0: "Public - Business, travel, and general information only",
            1: "Curious Seeker - Introductory esoteric content + public info",
            2: "Practitioner - Advanced spiritual practices + philosophy",
            3: "Initiated - Full access to sacred knowledge and metaphysics"
        }
        return descriptions.get(level, "Unknown level")
