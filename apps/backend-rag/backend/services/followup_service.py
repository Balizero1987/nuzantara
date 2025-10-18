"""
Follow-up Service - Generate suggested follow-up questions
Helps users continue conversations naturally by suggesting relevant next questions

This service generates 3-4 contextually relevant follow-up questions after each AI response,
improving engagement and helping users discover what they can ask next.

Author: ZANTARA Development Team
Date: 2025-10-16
"""

import logging
from typing import List, Dict, Any, Optional
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class FollowupService:
    """
    Generates suggested follow-up questions based on conversation context

    Features:
    - Context-aware question generation
    - Language-appropriate suggestions (EN, IT, ID)
    - Topic-specific follow-ups (business, casual, technical)
    - Fast generation using Claude Haiku
    """

    def __init__(self, anthropic_api_key: Optional[str] = None):
        """
        Initialize follow-up service

        Args:
            anthropic_api_key: Anthropic API key for Claude Haiku (optional)
        """
        self.claude_client = AsyncAnthropic(api_key=anthropic_api_key) if anthropic_api_key else None
        logger.info("✅ FollowupService initialized")


    def get_topic_based_followups(
        self,
        query: str,
        response: str,
        topic: str = "business",
        language: str = "en"
    ) -> List[str]:
        """
        Get pre-defined topic-based follow-up questions

        Args:
            query: User's original question
            response: AI's response
            topic: Topic category (business, casual, technical, immigration, tax)
            language: Language code (en, it, id)

        Returns:
            List of 3-4 follow-up question strings
        """
        # Topic-specific follow-ups by language
        followups_map = {
            "business": {
                "en": [
                    "What are the costs involved?",
                    "How long does the process take?",
                    "What documents do I need?",
                    "Are there any requirements I should know about?"
                ],
                "it": [
                    "Quali sono i costi?",
                    "Quanto tempo richiede il processo?",
                    "Quali documenti servono?",
                    "Ci sono requisiti da conoscere?"
                ],
                "id": [
                    "Berapa biayanya?",
                    "Berapa lama prosesnya?",
                    "Dokumen apa yang diperlukan?",
                    "Apa saja syaratnya?"
                ]
            },
            "immigration": {
                "en": [
                    "What visa types are available?",
                    "How do I extend my visa?",
                    "What are the requirements for KITAS?",
                    "Can you help me with the application process?"
                ],
                "it": [
                    "Quali tipi di visto sono disponibili?",
                    "Come posso estendere il mio visto?",
                    "Quali sono i requisiti per il KITAS?",
                    "Puoi aiutarmi con la procedura?"
                ],
                "id": [
                    "Jenis visa apa yang tersedia?",
                    "Bagaimana cara memperpanjang visa?",
                    "Apa syarat untuk KITAS?",
                    "Bisakah bantu proses aplikasi?"
                ]
            },
            "tax": {
                "en": [
                    "What tax rates apply to my business?",
                    "How do I register for tax in Indonesia?",
                    "Are there any tax incentives?",
                    "When are tax filing deadlines?"
                ],
                "it": [
                    "Quali aliquote fiscali si applicano?",
                    "Come mi registro per le tasse in Indonesia?",
                    "Ci sono incentivi fiscali?",
                    "Quando scadono le tasse?"
                ],
                "id": [
                    "Berapa tarif pajak untuk bisnis saya?",
                    "Bagaimana cara daftar pajak di Indonesia?",
                    "Ada insentif pajak?",
                    "Kapan batas waktu lapor pajak?"
                ]
            },
            "casual": {
                "en": [
                    "Tell me more about this",
                    "Can you explain further?",
                    "What else should I know?",
                    "Any recommendations?"
                ],
                "it": [
                    "Dimmi di più",
                    "Puoi spiegare meglio?",
                    "Cos'altro dovrei sapere?",
                    "Qualche raccomandazione?"
                ],
                "id": [
                    "Ceritakan lebih lanjut",
                    "Bisa jelaskan lebih detail?",
                    "Apa lagi yang perlu saya tahu?",
                    "Ada rekomendasi?"
                ]
            },
            "technical": {
                "en": [
                    "Can you show me a code example?",
                    "What are the best practices?",
                    "How do I debug this?",
                    "Are there any alternatives?"
                ],
                "it": [
                    "Puoi mostrarmi un esempio di codice?",
                    "Quali sono le best practice?",
                    "Come faccio il debug?",
                    "Ci sono alternative?"
                ],
                "id": [
                    "Bisa tunjukkan contoh kode?",
                    "Apa best practice-nya?",
                    "Bagaimana cara debug?",
                    "Ada alternatif lain?"
                ]
            }
        }

        # Get follow-ups for topic and language
        topic_followups = followups_map.get(topic, followups_map["business"])
        followups = topic_followups.get(language, topic_followups["en"])

        # Return 3 random ones
        import random
        selected = random.sample(followups, min(3, len(followups)))

        logger.info(f"📝 [Follow-ups] Generated {len(selected)} topic-based follow-ups ({topic}, {language})")
        return selected


    async def generate_dynamic_followups(
        self,
        query: str,
        response: str,
        conversation_context: Optional[str] = None,
        language: str = "en"
    ) -> List[str]:
        """
        Generate dynamic, contextually relevant follow-up questions using AI

        Args:
            query: User's original question
            response: AI's response
            conversation_context: Optional previous conversation context
            language: Language code (en, it, id)

        Returns:
            List of 3-4 AI-generated follow-up questions
        """
        if not self.claude_client:
            logger.warning("⚠️ [Follow-ups] Claude client not available, cannot generate dynamic follow-ups")
            # Fallback to topic-based
            return self.get_topic_based_followups(query, response, "business", language)

        # Build prompt for Claude Haiku
        prompt = self._build_followup_generation_prompt(query, response, conversation_context, language)

        try:
            logger.info(f"🤖 [Follow-ups] Generating dynamic follow-ups using Claude Haiku ({language})")

            # Call Claude Haiku for fast follow-up generation
            haiku_response = await self.claude_client.messages.create(
                model="claude-3-5-haiku-20241022",  # Fast & cheap
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse response (expecting numbered list)
            text = haiku_response.content[0].text.strip()
            followups = self._parse_followup_list(text)

            if followups:
                logger.info(f"✅ [Follow-ups] Generated {len(followups)} dynamic follow-ups")
                return followups[:4]  # Max 4
            else:
                logger.warning("⚠️ [Follow-ups] Failed to parse AI follow-ups, using fallback")
                return self.get_topic_based_followups(query, response, "business", language)

        except Exception as e:
            logger.error(f"❌ [Follow-ups] Dynamic generation failed: {e}")
            # Fallback to topic-based
            return self.get_topic_based_followups(query, response, "business", language)


    def _build_followup_generation_prompt(
        self,
        query: str,
        response: str,
        conversation_context: Optional[str],
        language: str
    ) -> str:
        """Build prompt for AI to generate follow-up questions"""

        # Language-specific instructions
        language_instructions = {
            "en": "Generate 3-4 relevant follow-up questions in English.",
            "it": "Genera 3-4 domande di follow-up rilevanti in italiano.",
            "id": "Buat 3-4 pertanyaan lanjutan yang relevan dalam bahasa Indonesia."
        }

        instruction = language_instructions.get(language, language_instructions["en"])

        prompt = f"""{instruction}

User asked: "{query}"

AI responded: "{response[:300]}..."

{f'Previous context: {conversation_context[:200]}...' if conversation_context else ''}

Generate 3-4 short, specific follow-up questions that:
1. Help the user dig deeper into the topic
2. Explore related areas they might be interested in
3. Are natural continuations of the conversation
4. Are phrased as questions the user would actually ask

Format as a numbered list:
1. First question?
2. Second question?
3. Third question?
4. Fourth question? (optional)

Keep questions concise (max 10 words each)."""

        return prompt


    def _parse_followup_list(self, text: str) -> List[str]:
        """
        Parse AI response into list of follow-up questions

        Args:
            text: AI response text with numbered list

        Returns:
            List of follow-up question strings
        """
        import re

        # Extract numbered items (1., 2., 3., etc.)
        pattern = r'^\s*\d+[\.\)]\s*(.+?)$'
        lines = text.strip().split('\n')

        followups = []
        for line in lines:
            match = re.match(pattern, line.strip())
            if match:
                question = match.group(1).strip()
                # Remove quotes if present
                question = question.strip('"\'')
                followups.append(question)

        return followups


    def detect_topic_from_query(self, query: str) -> str:
        """
        Detect topic category from user query

        Args:
            query: User's question

        Returns:
            Topic string (business, immigration, tax, casual, technical)
        """
        query_lower = query.lower()

        # Immigration keywords
        if any(keyword in query_lower for keyword in [
            "visa", "kitas", "immigration", "permit", "imigrasi", "visto"
        ]):
            return "immigration"

        # Tax keywords
        elif any(keyword in query_lower for keyword in [
            "tax", "pajak", "tassa", "fiscal", "npwp", "pph"
        ]):
            return "tax"

        # Technical/code keywords
        elif any(keyword in query_lower for keyword in [
            "code", "programming", "api", "develop", "software", "bug", "error", "function"
        ]):
            return "technical"

        # Casual keywords
        elif any(keyword in query_lower for keyword in [
            "hello", "hi", "ciao", "halo", "how are", "come stai", "apa kabar", "thanks", "grazie"
        ]):
            return "casual"

        # Default to business
        else:
            return "business"


    def detect_language_from_query(self, query: str) -> str:
        """
        Detect language from user query

        Args:
            query: User's question

        Returns:
            Language code (en, it, id)
        """
        query_lower = query.lower()

        # Italian detection
        italian_keywords = ["ciao", "come stai", "grazie", "prego", "buongiorno", "per favore", "cosa", "dove"]
        if any(keyword in query_lower for keyword in italian_keywords):
            return "it"

        # Indonesian detection
        indonesian_keywords = ["halo", "apa kabar", "terima kasih", "selamat", "aku", "saya", "mau", "bisa"]
        if any(keyword in query_lower for keyword in indonesian_keywords):
            return "id"

        # Default to English
        return "en"


    async def get_followups(
        self,
        query: str,
        response: str,
        use_ai: bool = True,
        conversation_context: Optional[str] = None
    ) -> List[str]:
        """
        Get follow-up questions (main entry point)

        Args:
            query: User's original question
            response: AI's response
            use_ai: Whether to use AI for dynamic generation (default: True)
            conversation_context: Optional conversation context

        Returns:
            List of 3-4 follow-up question strings
        """
        # Detect language and topic
        language = self.detect_language_from_query(query)
        topic = self.detect_topic_from_query(query)

        logger.info(f"📊 [Follow-ups] Detected: topic={topic}, language={language}")

        # Use AI if available and requested
        if use_ai and self.claude_client:
            return await self.generate_dynamic_followups(
                query=query,
                response=response,
                conversation_context=conversation_context,
                language=language
            )
        else:
            # Use topic-based fallback
            return self.get_topic_based_followups(query, response, topic, language)


    async def health_check(self) -> Dict[str, Any]:
        """
        Health check for follow-up service

        Returns:
            {
                "status": "healthy",
                "ai_available": bool,
                "features": {...}
            }
        """
        return {
            "status": "healthy",
            "ai_available": self.claude_client is not None,
            "features": {
                "dynamic_generation": self.claude_client is not None,
                "topic_based_fallback": True,
                "supported_languages": ["en", "it", "id"],
                "supported_topics": ["business", "immigration", "tax", "casual", "technical"]
            }
        }