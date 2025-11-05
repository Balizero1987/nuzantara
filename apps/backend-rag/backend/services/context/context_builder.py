"""
Context Builder Module
Builds combined context from memory, RAG, team, and cultural sources
"""

import logging
from typing import Optional, Any, Dict

logger = logging.getLogger(__name__)


class ContextBuilder:
    """
    Context Builder for combining multiple context sources

    Builds natural-language context from:
    - Memory (user profile facts and conversation history)
    - RAG (retrieved documents from ChromaDB)
    - Team (collaborator profile and preferences)
    - Cultural (Indonesian cultural insights)
    """

    def __init__(self):
        """Initialize context builder"""
        logger.info("📚 [ContextBuilder] Initialized")

    def build_memory_context(self, memory: Optional[Any]) -> Optional[str]:
        """
        Build memory context from user memory

        Args:
            memory: Memory object with profile_facts and summary

        Returns:
            Natural-language memory context string or None
        """
        if not memory:
            return None

        facts_count = len(memory.profile_facts) if hasattr(memory, 'profile_facts') else 0

        if facts_count == 0:
            return None

        logger.info(f"📚 [ContextBuilder] Building memory context from {facts_count} facts")

        # Build natural narrative (not bullet lists)
        memory_context = "Context about this conversation:\n"

        # Get top relevant facts (max 10)
        top_facts = memory.profile_facts[:10]

        # Group facts by type
        personal_facts = [
            f for f in top_facts
            if any(word in f.lower() for word in ["talking to", "role:", "level:", "language:", "colleague"])
        ]
        other_facts = [f for f in top_facts if f not in personal_facts]

        # Build natural narrative
        if personal_facts:
            memory_context += f"{'. '.join(personal_facts)}. "

        if other_facts:
            memory_context += f"You also know that: {', '.join(other_facts[:5])}. "

        if hasattr(memory, 'summary') and memory.summary:
            memory_context += f"\nPrevious conversation context: {memory.summary[:500]}"

        logger.info(f"📚 [ContextBuilder] Built memory context: {len(memory_context)} chars")

        return memory_context

    def build_team_context(self, collaborator: Optional[Any]) -> Optional[str]:
        """
        Build team context from collaborator profile

        Args:
            collaborator: Collaborator object with profile information

        Returns:
            Natural-language team context string or None
        """
        if not collaborator or not hasattr(collaborator, 'id') or collaborator.id == "anonymous":
            return None

        logger.info(f"📚 [ContextBuilder] Building team context for {collaborator.name}")

        team_parts = []

        # LANGUAGE REQUIREMENT (ABSOLUTE - MUST BE FIRST)
        language_map = {
            "it": "Italian",
            "id": "Indonesian",
            "en": "English"
        }
        lang_full = language_map.get(collaborator.language, collaborator.language.upper())
        team_parts.append(f"IMPORTANT: You MUST respond ONLY in {lang_full} language")

        # Identity and role
        team_parts.append(
            f"You're talking to {collaborator.name} ({collaborator.ambaradam_name}), "
            f"{collaborator.role} in the {collaborator.department} department"
        )

        # Expertise level
        expertise_instructions = {
            "beginner": "Explain concepts simply and clearly",
            "intermediate": "Balance clarity with detail",
            "advanced": "You can use technical language",
            "expert": "Discuss at a sophisticated level"
        }
        if hasattr(collaborator, 'expertise_level') and collaborator.expertise_level in expertise_instructions:
            team_parts.append(expertise_instructions[collaborator.expertise_level])

        # Emotional preferences
        if hasattr(collaborator, 'emotional_preferences') and collaborator.emotional_preferences:
            prefs = collaborator.emotional_preferences
            tone = prefs.get('tone', 'professional')
            formality = prefs.get('formality', 'medium')
            humor = prefs.get('humor', 'light')

            tone_instructions = {
                "professional_warm": "Be professional but warm and approachable",
                "direct_with_depth": "Be direct and insightful",
                "respectful_collaborative": "Be respectful and collaborative",
                "precise_methodical": "Be precise and methodical",
                "efficient_focused": "Be efficient and focused",
                "detail_oriented": "Be detail-oriented and thorough",
                "helpful_clear": "Be helpful and clear",
                "collaborative": "Be collaborative and supportive",
                "eager_learning": "Be encouraging and educational",
                "strategic_visionary": "Be strategic and forward-thinking",
                "sacred_semar_energy": "Be playful, wise, and deeply intuitive"
            }

            formality_instructions = {
                "casual": "Use casual, friendly language",
                "medium": "Use balanced professional language",
                "high": "Use formal, polished language"
            }

            humor_instructions = {
                "minimal": "Keep humor minimal",
                "light": "Light humor is welcome",
                "intelligent": "Use intelligent, subtle humor",
                "sacred_semar_energy": "Use profound, playful wisdom"
            }

            instruction_parts = []
            if tone in tone_instructions:
                instruction_parts.append(tone_instructions[tone])
            if formality in formality_instructions:
                instruction_parts.append(formality_instructions[formality].lower())
            if humor in humor_instructions:
                instruction_parts.append(humor_instructions[humor].lower())

            if instruction_parts:
                team_parts.append(". ".join(instruction_parts))

        # Sub Rosa level
        if hasattr(collaborator, 'sub_rosa_level'):
            team_parts.append(f"Security clearance: Level {collaborator.sub_rosa_level}")

        # Build natural sentence
        team_context = ". ".join(team_parts) + "."

        logger.info(f"📚 [ContextBuilder] Built team context: {len(team_context)} chars")

        return team_context

    def combine_contexts(
        self,
        memory_context: Optional[str],
        team_context: Optional[str],
        rag_context: Optional[str],
        cultural_context: Optional[str] = None
    ) -> Optional[str]:
        """
        Combine all context sources into single context string

        Args:
            memory_context: Memory context string
            team_context: Team context string
            rag_context: RAG context string
            cultural_context: Cultural context string (optional)

        Returns:
            Combined context string or None
        """
        contexts = []

        # Team context comes first (language requirements)
        if team_context:
            contexts.append(team_context)

        # Memory context second
        if memory_context:
            contexts.append(memory_context)

        # RAG context third (wrapped in XML tags)
        if rag_context:
            contexts.append(f"\n<relevant_knowledge>\n{rag_context}\n</relevant_knowledge>")

        # Cultural context last
        if cultural_context:
            contexts.append(cultural_context)

        if not contexts:
            return None

        combined = "\n\n".join(contexts)

        logger.info(f"📚 [ContextBuilder] Combined context: {len(combined)} chars from {len(contexts)} sources")

        return combined
