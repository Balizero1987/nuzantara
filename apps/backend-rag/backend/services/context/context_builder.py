"""
Context Builder Module
Builds combined context from memory, RAG, team, cultural, and identity sources

UPDATED 2025-11-30:
- Added build_identity_context for self-recognition
- Added build_zantara_identity for AI self-awareness
- Enhanced combine_contexts with identity_context parameter
- Structured XML output for better context parsing
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class ContextBuilder:
    """
    Context Builder for combining multiple context sources

    Builds natural-language context from:
    - Identity (current logged-in user - WHO IS TALKING)
    - Memory (user profile facts and conversation history)
    - RAG (retrieved documents from Qdrant)
    - Team (collaborator profile and preferences)
    - Cultural (Indonesian cultural insights)
    - Zantara Identity (who ZANTARA is)
    """

    def __init__(self):
        """Initialize context builder"""
        logger.info("📚 [ContextBuilder] Initialized with identity support")

    def build_identity_context(self, collaborator: Any | None) -> str | None:
        """
        Build identity context for self-recognition queries.
        This is injected when users ask "who am I?" or similar.

        Args:
            collaborator: CollaboratorProfile object with user information

        Returns:
            Formatted identity string for LLM context
        """
        if not collaborator or not hasattr(collaborator, "id") or collaborator.id == "anonymous":
            return None

        logger.info(f"🆔 [ContextBuilder] Building identity context for {collaborator.name}")

        # Build comprehensive identity information
        identity_parts = [
            f"Nome: {collaborator.name}",
            f"Email: {collaborator.email}",
            f"Ruolo: {collaborator.role}",
            f"Dipartimento: {collaborator.department}",
            f"Team: {collaborator.team}",
        ]

        if hasattr(collaborator, "expertise_level") and collaborator.expertise_level:
            identity_parts.append(f"Livello di esperienza: {collaborator.expertise_level}")

        if hasattr(collaborator, "languages") and collaborator.languages:
            identity_parts.append(f"Lingue parlate: {', '.join(collaborator.languages)}")

        if hasattr(collaborator, "location") and collaborator.location:
            identity_parts.append(f"Sede: {collaborator.location}")

        if hasattr(collaborator, "age") and collaborator.age:
            identity_parts.append(f"Età: {collaborator.age}")

        if hasattr(collaborator, "traits") and collaborator.traits:
            identity_parts.append(f"Caratteristiche: {', '.join(collaborator.traits)}")

        if hasattr(collaborator, "notes") and collaborator.notes:
            identity_parts.append(f"Note: {collaborator.notes}")

        # Format as structured identity block
        identity_context = f"""UTENTE ATTUALMENTE CONNESSO:
{chr(10).join('- ' + part for part in identity_parts)}

ISTRUZIONI PER DOMANDE SULL'IDENTITÀ:
- Se l'utente chiede "chi sono?", "who am I?", "siapa saya?" → Usa queste informazioni
- Se l'utente chiede del suo ruolo, team, o informazioni personali → Rispondi con questi dati
- Personalizza le risposte in base al ruolo e livello di esperienza dell'utente
- Usa il nome dell'utente naturalmente nelle risposte quando appropriato"""

        logger.info(f"🆔 [ContextBuilder] Identity context: {len(identity_context)} chars")
        return identity_context

    def build_zantara_identity(self) -> str:
        """
        Build Zantara's self-identity context.
        Used when users ask "who are you?" or about Zantara's capabilities.

        Returns:
            Zantara identity string
        """
        return """CHI SONO IO (ZANTARA):
Sono ZANTARA, l'assistente AI intelligente di Bali Zero.

LE MIE COMPETENZE:
- Immigrazione e visti indonesiani (tutti i tipi di visti e permessi)
- Costituzione società (PT, PT PMA, CV, firma individuale)
- Sistema di classificazione business (codici KBLI)
- Compliance fiscale e pianificazione finanziaria
- Requisiti legali e framework regolatori
- Immobili e investimenti immobiliari
- Intelligenza culturale indonesiana e pratiche commerciali

LA MIA KNOWLEDGE BASE INCLUDE:
- visa_oracle: Regolamenti su visti e immigrazione
- tax_genius: Normative fiscali indonesiane
- bali_zero_team: Informazioni sul team di Bali Zero (22 membri)
- kbli_eye: Codici di classificazione business
- legal_architect: Requisiti legali e corporate
- property_knowledge: Mercato immobiliare

COME POSSO AIUTARTI:
- Rispondo in Italiano, English, e Bahasa Indonesia
- Fornisco informazioni accurate basate sulla mia Knowledge Base
- Per questioni specifiche, ti metto in contatto con il team giusto
- WhatsApp: +62 859 0436 9574"""

    def build_memory_context(self, memory: Any | None) -> str | None:
        """
        Build memory context from user memory

        Args:
            memory: Memory object with profile_facts and summary

        Returns:
            Natural-language memory context string or None
        """
        if not memory:
            return None

        # Handle both dict and object formats
        if isinstance(memory, dict):
            facts = memory.get("facts", [])
            summary = memory.get("summary", "")
        else:
            facts = memory.profile_facts if hasattr(memory, "profile_facts") else []
            summary = memory.summary if hasattr(memory, "summary") else ""

        facts_count = len(facts) if facts else 0

        if facts_count == 0 and not summary:
            return None

        logger.info(f"📚 [ContextBuilder] Building memory context from {facts_count} facts")

        memory_parts = []

        if facts:
            # Get top relevant facts (max 10)
            top_facts = facts[:10]

            # Group facts by type
            personal_facts = [
                f for f in top_facts
                if any(word in f.lower() for word in [
                    "talking to", "role:", "level:", "language:", "colleague", "preferisce"
                ])
            ]
            other_facts = [f for f in top_facts if f not in personal_facts]

            if personal_facts:
                memory_parts.append(f"Informazioni sull'utente: {'. '.join(personal_facts)}")

            if other_facts:
                memory_parts.append(f"Contesto aggiuntivo: {', '.join(other_facts[:5])}")

        if summary:
            memory_parts.append(f"Riassunto conversazione precedente: {summary[:500]}")

        if not memory_parts:
            return None

        memory_context = "\n".join(memory_parts)
        logger.info(f"📚 [ContextBuilder] Built memory context: {len(memory_context)} chars")

        return memory_context

    def build_team_context(self, collaborator: Any | None) -> str | None:
        """
        Build team context from collaborator profile for response personalization

        Args:
            collaborator: Collaborator object with profile information

        Returns:
            Natural-language team context string or None
        """
        if not collaborator or not hasattr(collaborator, "id") or collaborator.id == "anonymous":
            return None

        logger.info(f"📚 [ContextBuilder] Building team context for {collaborator.name}")

        team_parts = []

        # LANGUAGE REQUIREMENT (ABSOLUTE - MUST BE FIRST)
        language_map = {
            "it": "Italian",
            "id": "Indonesian",
            "en": "English",
            "ua": "Ukrainian"
        }
        lang_full = language_map.get(collaborator.language, collaborator.language.upper())
        team_parts.append(f"IMPORTANT: You MUST respond ONLY in {lang_full} language")

        # Identity and role
        team_parts.append(
            f"You're talking to {collaborator.name}, "
            f"{collaborator.role} in the {collaborator.department} department"
        )

        # Expertise level
        expertise_instructions = {
            "beginner": "Explain concepts simply and clearly",
            "intermediate": "Balance clarity with detail",
            "advanced": "You can use technical language",
            "expert": "Discuss at a sophisticated level",
        }
        if (
            hasattr(collaborator, "expertise_level")
            and collaborator.expertise_level in expertise_instructions
        ):
            team_parts.append(expertise_instructions[collaborator.expertise_level])

        # Emotional preferences
        if hasattr(collaborator, "emotional_preferences") and collaborator.emotional_preferences:
            prefs = collaborator.emotional_preferences
            tone = prefs.get("tone", "professional")
            formality = prefs.get("formality", "medium")
            humor = prefs.get("humor", "light")

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
                "sacred_semar_energy": "Be playful, wise, and deeply intuitive",
            }

            formality_instructions = {
                "casual": "Use casual, friendly language",
                "medium": "Use balanced professional language",
                "high": "Use formal, polished language",
            }

            humor_instructions = {
                "minimal": "Keep humor minimal",
                "light": "Light humor is welcome",
                "intelligent": "Use intelligent, subtle humor",
                "sacred_semar_energy": "Use profound, playful wisdom",
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

        team_context = ". ".join(team_parts) + "."
        logger.info(f"📚 [ContextBuilder] Built team context: {len(team_context)} chars")

        return team_context

    def combine_contexts(
        self,
        memory_context: str | None,
        team_context: str | None,
        rag_context: str | None,
        cultural_context: str | None = None,
        identity_context: str | None = None,
        zantara_identity: bool = False,
    ) -> str | None:
        """
        Combine all context sources into single context string

        Args:
            memory_context: Memory context string
            team_context: Team context string
            rag_context: RAG context string
            cultural_context: Cultural context string (optional)
            identity_context: User identity context (optional)
            zantara_identity: Include Zantara self-identity (optional)

        Returns:
            Combined context string or None
        """
        contexts = []

        # 1. Zantara identity (who is ZANTARA) - if requested
        if zantara_identity:
            contexts.append(self.build_zantara_identity())

        # 2. Identity context (who is the USER) - highest priority
        if identity_context:
            contexts.append(identity_context)

        # 3. Team context (response personalization)
        if team_context:
            contexts.append(team_context)

        # 4. Memory context (conversation history)
        if memory_context:
            contexts.append(memory_context)

        # 5. RAG context (knowledge base) - wrapped in XML tags
        if rag_context:
            contexts.append(f"""<knowledge_base>
{rag_context}
</knowledge_base>

ISTRUZIONI PER L'USO DELLA KNOWLEDGE BASE:
- Usa le informazioni sopra per rispondere alle domande
- Cita la fonte quando fornisci informazioni specifiche
- Se non trovi l'informazione nella knowledge base, dillo onestamente
- NON inventare dati, codici, prezzi o requisiti legali""")

        # 6. Cultural context (Indonesian insights)
        if cultural_context:
            contexts.append(cultural_context)

        if not contexts:
            return None

        combined = "\n\n---\n\n".join(contexts)

        logger.info(
            f"📚 [ContextBuilder] Combined context: {len(combined)} chars from {len(contexts)} sources"
        )

        return combined

    def detect_identity_query(self, message: str) -> bool:
        """
        Detect if the message is asking about user identity

        Args:
            message: User message

        Returns:
            True if identity-related query
        """
        message_lower = message.lower().strip()

        identity_patterns = [
            # Italian
            "chi sono", "chi sei tu", "mi conosci", "sai chi sono",
            "cosa sai di me", "il mio nome", "il mio ruolo",
            "chi sono io", "conosci me",
            # English
            "who am i", "do you know me", "my name", "my role",
            "what do you know about me", "who is this",
            # Indonesian
            "siapa saya", "apakah kamu kenal saya", "nama saya",
            "kamu tahu siapa saya",
        ]

        return any(pattern in message_lower for pattern in identity_patterns)

    def detect_zantara_query(self, message: str) -> bool:
        """
        Detect if the message is asking about Zantara itself

        Args:
            message: User message

        Returns:
            True if Zantara identity query
        """
        message_lower = message.lower().strip()

        zantara_patterns = [
            # Italian
            "chi sei", "cosa sei", "cosa sai fare", "cosa puoi fare",
            "cosa hai nella kb", "knowledge base", "quali collezioni",
            "di cosa sei capace", "le tue competenze",
            # English
            "who are you", "what are you", "what can you do",
            "your capabilities", "what's in your kb",
            # Indonesian
            "siapa kamu", "apa kamu", "kamu bisa apa",
        ]

        return any(pattern in message_lower for pattern in zantara_patterns)

    def detect_team_query(self, message: str) -> bool:
        """
        Detect if the message is asking about team members

        Args:
            message: User message

        Returns:
            True if team-related query
        """
        message_lower = message.lower().strip()

        team_patterns = [
            # Italian
            "team", "membri", "colleghi", "chi lavora", "quanti siamo",
            "dipartimento", "chi è", "conosci", "bali zero team",
            "lista team", "elenco membri", "dipendenti",
            # English
            "team members", "colleagues", "who works", "department",
            "staff", "employees", "how many people",
            # Indonesian
            "tim", "anggota tim", "rekan kerja", "siapa yang bekerja",
        ]

        return any(pattern in message_lower for pattern in team_patterns)
