"""
ZANTARA Collaborative Capabilities - Phase 5

10 capabilities for advanced collaboration:
1. Personality Profiling
2. Communication Style Adaptation
3. Synergy Mapping
4. Needs Anticipation
5. Knowledge Transfer Optimization
6. Conflict Resolution Patterns
7. Growth Trajectory Analysis
8. Collaborative Rhythm Detection
9. Trust Level Calibration
10. Creative Catalyst Matching
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class CollaborativeProfile:
    """Complete collaborative profile for a user"""
    user_id: str

    # 1. Personality Profiling
    personality_traits: Dict[str, float]  # openness, conscientiousness, extraversion, etc.
    cognitive_style: str  # analytical, intuitive, creative, practical

    # 2. Communication Style
    communication_preferences: Dict[str, str]  # verbosity, formality, directness
    preferred_channels: List[str]  # chat, email, voice, etc.

    # 3. Synergy Mapping
    synergy_score: Dict[str, float]  # user_id -> compatibility score
    collaboration_patterns: List[str]  # patterns observed

    # 4. Needs Anticipation
    anticipated_needs: List[str]  # predicted needs based on history
    proactive_suggestions: List[str]  # suggestions to offer

    # 5. Knowledge Transfer
    learning_style: str  # visual, auditory, kinesthetic, reading/writing
    expertise_areas: List[str]  # areas of expertise
    knowledge_gaps: List[str]  # areas to develop

    # 6. Conflict Resolution
    conflict_style: str  # collaborative, competitive, avoiding, accommodating, compromising
    stress_triggers: List[str]  # known stress triggers

    # 7. Growth Trajectory
    skill_development: Dict[str, float]  # skill -> proficiency level
    growth_velocity: float  # rate of improvement
    next_milestones: List[str]  # upcoming goals

    # 8. Collaborative Rhythm
    activity_patterns: Dict[str, int]  # time_of_day -> activity_level
    response_time_avg: float  # average response time in minutes
    engagement_cycles: List[str]  # detected engagement patterns

    # 9. Trust Level
    trust_score: float  # 0.0-1.0
    reliability_metrics: Dict[str, float]  # consistency, follow-through, etc.

    # 10. Creative Catalyst
    creative_triggers: List[str]  # what sparks creativity
    innovation_score: float  # 0.0-1.0

    updated_at: datetime


class CollaborativeCapabilitiesService:
    """
    Analyzes and tracks 10 collaborative capabilities.

    This is a lightweight implementation that builds profiles
    over time through conversation analysis.
    """

    def __init__(self):
        self.profiles: Dict[str, CollaborativeProfile] = {}
        logger.info("✅ CollaborativeCapabilitiesService initialized")

    async def get_profile(self, user_id: str) -> CollaborativeProfile:
        """
        Get or create collaborative profile.

        Args:
            user_id: User/collaborator ID

        Returns:
            CollaborativeProfile with 10 capabilities
        """
        if user_id in self.profiles:
            return self.profiles[user_id]

        # Create default profile
        profile = CollaborativeProfile(
            user_id=user_id,
            personality_traits={
                "openness": 0.5,
                "conscientiousness": 0.5,
                "extraversion": 0.5,
                "agreeableness": 0.5,
                "neuroticism": 0.5
            },
            cognitive_style="balanced",
            communication_preferences={
                "verbosity": "moderate",
                "formality": "balanced",
                "directness": "moderate"
            },
            preferred_channels=["chat"],
            synergy_score={},
            collaboration_patterns=[],
            anticipated_needs=[],
            proactive_suggestions=[],
            learning_style="balanced",
            expertise_areas=[],
            knowledge_gaps=[],
            conflict_style="collaborative",
            stress_triggers=[],
            skill_development={},
            growth_velocity=0.0,
            next_milestones=[],
            activity_patterns={},
            response_time_avg=0.0,
            engagement_cycles=[],
            trust_score=0.5,
            reliability_metrics={
                "consistency": 0.5,
                "follow_through": 0.5,
                "responsiveness": 0.5
            },
            creative_triggers=[],
            innovation_score=0.5,
            updated_at=datetime.now()
        )

        self.profiles[user_id] = profile
        logger.info(f"📊 Created collaborative profile for {user_id}")
        return profile

    async def update_from_interaction(
        self,
        user_id: str,
        message: str,
        emotional_state: str,
        response_quality: Optional[float] = None
    ) -> CollaborativeProfile:
        """
        Update profile based on interaction.

        This is a simplified version - in production would use ML models.

        Args:
            user_id: User ID
            message: User message
            emotional_state: Detected emotional state
            response_quality: Optional quality score (0.0-1.0)

        Returns:
            Updated CollaborativeProfile
        """
        profile = await self.get_profile(user_id)

        # 1. Personality Profiling (simple heuristics)
        if emotional_state == "curious":
            profile.personality_traits["openness"] = min(1.0, profile.personality_traits["openness"] + 0.01)
        elif emotional_state == "grateful":
            profile.personality_traits["agreeableness"] = min(1.0, profile.personality_traits["agreeableness"] + 0.01)

        # 2. Communication Style
        word_count = len(message.split())
        if word_count > 50:
            profile.communication_preferences["verbosity"] = "high"
        elif word_count < 10:
            profile.communication_preferences["verbosity"] = "low"

        # 4. Needs Anticipation (pattern-based)
        if "how" in message.lower() and "work" in message.lower():
            if "technical documentation" not in profile.anticipated_needs:
                profile.anticipated_needs.append("technical documentation")

        # 9. Trust Level (increases with positive interactions)
        if response_quality and response_quality > 0.7:
            profile.trust_score = min(1.0, profile.trust_score + 0.01)
            profile.reliability_metrics["responsiveness"] = min(1.0, profile.reliability_metrics["responsiveness"] + 0.01)

        profile.updated_at = datetime.now()
        logger.debug(f"📊 Updated collaborative profile for {user_id}")

        return profile

    async def get_capability_summary(self, user_id: str) -> Dict:
        """
        Get summary of all 10 capabilities.

        Args:
            user_id: User ID

        Returns:
            Dict with capability scores and insights
        """
        profile = await self.get_profile(user_id)

        return {
            "user_id": user_id,
            "capabilities": {
                "1_personality_profiling": {
                    "traits": profile.personality_traits,
                    "cognitive_style": profile.cognitive_style
                },
                "2_communication_style": {
                    "preferences": profile.communication_preferences,
                    "channels": profile.preferred_channels
                },
                "3_synergy_mapping": {
                    "synergy_score": profile.synergy_score,
                    "patterns": profile.collaboration_patterns
                },
                "4_needs_anticipation": {
                    "anticipated": profile.anticipated_needs,
                    "suggestions": profile.proactive_suggestions
                },
                "5_knowledge_transfer": {
                    "learning_style": profile.learning_style,
                    "expertise": profile.expertise_areas,
                    "gaps": profile.knowledge_gaps
                },
                "6_conflict_resolution": {
                    "style": profile.conflict_style,
                    "triggers": profile.stress_triggers
                },
                "7_growth_trajectory": {
                    "skills": profile.skill_development,
                    "velocity": profile.growth_velocity,
                    "milestones": profile.next_milestones
                },
                "8_collaborative_rhythm": {
                    "activity_patterns": profile.activity_patterns,
                    "response_time": profile.response_time_avg,
                    "cycles": profile.engagement_cycles
                },
                "9_trust_level": {
                    "score": profile.trust_score,
                    "reliability": profile.reliability_metrics
                },
                "10_creative_catalyst": {
                    "triggers": profile.creative_triggers,
                    "innovation_score": profile.innovation_score
                }
            },
            "updated_at": profile.updated_at.isoformat()
        }

    async def calculate_synergy(self, user_id_1: str, user_id_2: str) -> float:
        """
        Calculate synergy score between two users.

        Based on personality compatibility, communication styles, etc.

        Args:
            user_id_1: First user
            user_id_2: Second user

        Returns:
            Synergy score (0.0-1.0)
        """
        profile1 = await self.get_profile(user_id_1)
        profile2 = await self.get_profile(user_id_2)

        # Simple compatibility calculation
        # In production: use ML model trained on successful collaborations

        # 1. Personality compatibility (complementary traits work well)
        personality_score = 0.0
        for trait in profile1.personality_traits:
            diff = abs(profile1.personality_traits[trait] - profile2.personality_traits[trait])
            # Moderate differences are good (0.2-0.5 range)
            if 0.2 <= diff <= 0.5:
                personality_score += 0.2

        # 2. Communication style match
        comm_score = 0.0
        if profile1.communication_preferences["verbosity"] == profile2.communication_preferences["verbosity"]:
            comm_score += 0.3
        if profile1.communication_preferences["formality"] == profile2.communication_preferences["formality"]:
            comm_score += 0.3

        # 3. Trust levels (high trust on both sides is good)
        trust_score = (profile1.trust_score + profile2.trust_score) / 2

        # Weighted average
        synergy = (personality_score * 0.3 + comm_score * 0.3 + trust_score * 0.4)
        synergy = min(1.0, max(0.0, synergy))

        logger.info(f"🤝 Synergy between {user_id_1} and {user_id_2}: {synergy:.2f}")

        return synergy

    def get_stats(self) -> Dict:
        """Get service statistics"""
        return {
            "total_profiles": len(self.profiles),
            "capabilities_tracked": 10,
            "profile_fields": 20
        }
