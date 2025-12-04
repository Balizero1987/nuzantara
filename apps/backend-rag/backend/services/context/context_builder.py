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
{chr(10).join("- " + part for part in identity_parts)}

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
Sono ZANTARA, il tuo consulente strategico "Insider" per Bali Zero. Non sono un semplice chatbot, sono un partner per il business in Indonesia.

LE MIE COMPETENZE CHIAVE:
- **Business & Legal**: Costituzione società (PT PMA), codici KBLI, contratti.
- **Immigration**: Visti (KITAS/KITAP), permessi di lavoro, procedure RPTKA.
- **Finance & Tax**: Compliance fiscale indonesiana, pianificazione.
- **Property**: Investimenti immobiliari, zonizzazione (RTRW), due diligence.

COSA POSSO FARE PER TE (CAPACITÀ):

1. **Memoria e Contesto**:
   - Ricordo le nostre conversazioni passate. Non devi ripeterti.
   - Conosco il tuo profilo e il tuo ruolo nel team.

2. **Gestione Operativa (CRM)**:
   - Vedo in tempo reale lo stato delle tue pratiche (Visti, Tasse, Legal).
   - Posso dirti a che punto è il tuo KITAS o la tua PT PMA.

3. **Ricerca Strategica (Oracle)**:
   - Incrocio dati da più fonti (Legale + Fiscale + Visti) per darti risposte complete.
   - Esempio: "Se apro un ristorante (KBLI), che visto mi serve e quante tasse pago?"

4. **Automazione & Monitoraggio**:
   - Monitoro le tue scadenze (Visti, Tasse) e ti avviso prima.
   - Calcolo preventivi dinamici per i servizi.

IL MIO STILE:
- Diretto, strategico, "Jaksel style" (mix professionale e casual).
- Proattivo: Non aspetto che tu chieda, ti do l'insight che ti serve.
- **Insider**: Ti dico come funzionano le cose *davvero*, non solo la teoria.

COME POSSO AIUTARTI OGGI:
- Posso controllare le tue pratiche?
- Hai bisogno di chiarimenti su una nuova regolamentazione?
- Vuoi pianificare una nuova espansione business?"""

    def build_backend_services_context(self) -> str:
        """
        Build context about available backend services.
        This helps Zantara understand what services it can access and use.

        Returns:
            Formatted string describing backend services and how to use them
        """
        return """CAPABILITIES & TOOLS (INTERNAL CONTEXT):
You have real-time access to the following data and tools. Use them to answer the user.

1. MEMORY & HISTORY
   - You can search past conversations to find what was discussed.
   - You remember the user's profile and context.
   - USAGE: Say "I remember we discussed..." or "Let me check our chat history."

2. CRM DATA (Real-time)
   - You can see the user's client profile, status, and active practices (Visa, Tax, Legal).
   - You know the status of their projects (e.g., "Pending BKPM", "KITAS Approved").
   - USAGE: Say "I'm checking your profile..." or "I see your KITAS is in progress."

3. KNOWLEDGE BASE (Oracle)
   - You can search across all Indonesian regulations: Tax, Legal, Immigration (Visa), Property, KBLI.
   - You combine data from multiple sources to give a complete answer.
   - USAGE: Say "I'm checking the latest regulations..." or "According to the tax laws..."

4. AUTOMATION TOOLS
   - You can set up "Compliance Monitors" for deadlines.
   - You can calculate pricing for services.
   - You can create "Client Journeys" (project workflows).
   - USAGE: Offer to do these things naturally: "Want me to track this deadline for you?"

IMPORTANT COMMUNICATION RULES:
❌ NEVER name the tools: Do NOT say "I will use the Visa Oracle" or "I have access to the CRM Service".
❌ NEVER explain the tech: Do NOT say "My backend allows me to...".
✅ BE NATURAL: Just do it. "Let me check that for you." "I see in your file that..." "I recall we talked about..."
"""

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
                f
                for f in top_facts
                if any(
                    word in f.lower()
                    for word in [
                        "talking to",
                        "role:",
                        "level:",
                        "language:",
                        "colleague",
                        "preferisce",
                    ]
                )
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

        # Add memory acknowledgment instructions (English only - code is in English)
        # Note: Zantara will adapt to user's language via team_context language_map
        memory_parts.append(
            "MEMORY INSTRUCTIONS: When responding, use phrases that acknowledge memory usage "
            "(e.g., 'I remember...', 'from memory...', 'as you mentioned before...', "
            "'ricordo che...', 'dalla memoria...', 'saya ingat...', 'dari memori...') "
            "to show you're using the conversation memory. Adapt the language to match the user's language preference."
        )

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
        language_map = {"it": "Italian", "id": "Indonesian", "en": "English", "ua": "Ukrainian"}
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

    def build_synthetic_context(self, examples: list[dict]) -> str | None:
        """
        Build context from synthetic few-shot examples.

        Args:
            examples: List of example dicts {question, answer, persona}

        Returns:
            Formatted string of examples
        """
        if not examples:
            return None

        logger.info(f"📚 [ContextBuilder] Formatting {len(examples)} synthetic examples")

        formatted_examples = []
        for i, ex in enumerate(examples, 1):
            formatted_examples.append(
                f"""Esempio {i} ({ex.get("persona", "general")}):
Q: {ex.get("question")}
A: {ex.get("answer")}"""
            )

        return "ESEMPI DI RISPOSTA (FEW-SHOT):\n" + "\n\n".join(formatted_examples)

    def combine_contexts(
        self,
        memory_context: str | None,
        team_context: str | None,
        rag_context: str | None,
        cultural_context: str | None = None,
        identity_context: str | None = None,
        synthetic_context: str | None = None,
        zantara_identity: bool = False,
        backend_services_context: str | None = None,
    ) -> str | None:
        """
        Combine all context sources into single context string

        Args:
            memory_context: Memory context string
            team_context: Team context string
            rag_context: RAG context string
            cultural_context: Cultural context string (optional)
            identity_context: User identity context (optional)
            synthetic_context: Synthetic examples context (optional)
            zantara_identity: Include Zantara self-identity (optional)
            backend_services_context: Backend services context (optional)

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
            contexts.append(
                f"""<knowledge_base>
{rag_context}
</knowledge_base>

ISTRUZIONI OBBLIGATORIE PER LA KNOWLEDGE BASE:

1. RISPOSTA GARANTITA: La KB sopra contiene SEMPRE informazioni rilevanti su visti, tasse, legale, KBLI, proprietà e procedure indonesiane. La risposta È NEI DOCUMENTI SOPRA.

2. PROIBIZIONI ASSOLUTE - NON DIRE MAI:
   ❌ "Non ho documenti caricati"
   ❌ "Non trovo informazioni"
   ❌ "Consultare il team per caricarne di nuovi"
   ❌ "Non ho dati specifici"

3. COSA FARE INVECE:
   ✅ Estrai e sintetizza TUTTE le informazioni pertinenti dai documenti sopra
   ✅ Combina dati da più documenti per costruire una risposta completa
   ✅ Se l'info è parziale, presenta quello che c'è e suggerisci di approfondire con il team
   ✅ Cita la fonte [nome documento] quando possibile

4. CITAZIONI: Usa il nome del documento tra parentesi, es: (Visa Oracle), (Tax Knowledge), (KBLI Eye)

5. ACCURATEZZA: NON inventare dati, codici, prezzi o requisiti - usa SOLO i dati dalla KB"""
            )

        # 6. Cultural context (Indonesian insights)
        if cultural_context:
            contexts.append(cultural_context)

        # 7. Synthetic Context (Few-Shot Examples) - Guide for style/content
        if synthetic_context:
            contexts.append(synthetic_context)

        # 8. Backend services context (what ZANTARA can do) - include if we have other contexts
        # Only include if we have other contexts to avoid breaking existing behavior
        if contexts:  # Only add if we have other contexts
            if backend_services_context:
                # Insert after team context (position 1 or 2 depending on identity_context)
                # This ensures team context appears first when present
                insert_pos = 1 if identity_context else 0
                if team_context:
                    insert_pos = 2 if identity_context else 1
                contexts.insert(min(insert_pos, len(contexts)), backend_services_context)
            else:
                # Insert default backend services context
                insert_pos = 1 if identity_context else 0
                if team_context:
                    insert_pos = 2 if identity_context else 1
                contexts.insert(
                    min(insert_pos, len(contexts)), self.build_backend_services_context()
                )

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
            "chi sono",
            "chi sei tu",
            "mi conosci",
            "sai chi sono",
            "cosa sai di me",
            "il mio nome",
            "il mio ruolo",
            "chi sono io",
            "conosci me",
            # English
            "who am i",
            "do you know me",
            "my name",
            "my role",
            "what do you know about me",
            "who is this",
            # Indonesian
            "siapa saya",
            "apakah kamu kenal saya",
            "nama saya",
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
            "chi sei",
            "cosa sei",
            "cosa sai fare",
            "cosa puoi fare",
            "cosa hai nella kb",
            "knowledge base",
            "quali collezioni",
            "di cosa sei capace",
            "le tue competenze",
            # English
            "who are you",
            "what are you",
            "what can you do",
            "your capabilities",
            "what's in your kb",
            # Indonesian
            "siapa kamu",
            "apa kamu",
            "kamu bisa apa",
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
            "team",
            "membri",
            "colleghi",
            "chi lavora",
            "quanti siamo",
            "dipartimento",
            "chi è",
            "conosci",
            "bali zero team",
            "lista team",
            "elenco membri",
            "dipendenti",
            # English
            "team members",
            "colleagues",
            "who works",
            "department",
            "staff",
            "employees",
            "how many people",
            # Indonesian
            "tim",
            "anggota tim",
            "rekan kerja",
            "siapa yang bekerja",
        ]

        return any(pattern in message_lower for pattern in team_patterns)
