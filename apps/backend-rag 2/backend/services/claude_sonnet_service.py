"""
Claude Sonnet 4.5 Service - Premium Business AI
For complex queries, business questions, and RAG-enhanced responses

Model: claude-sonnet-4-20250514
Cost: $3/$15 per 1M tokens (input/output) - Premium quality
Speed: ~300ms response time
Use case: Business questions, legal queries, detailed analysis
"""

import os
import logging
from typing import List, Dict, Optional
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class ClaudeSonnetService:
    """
    Claude Sonnet 4.5 - Premium business AI for complex queries

    Optimized for:
    - Business questions (KITAS, visa, PT PMA)
    - Legal queries and regulations
    - Complex analysis with RAG context
    - Professional detailed responses

    Integration: Works with ChromaDB RAG for enhanced answers
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude Sonnet service

        Args:
            api_key: Anthropic API key (defaults to env ANTHROPIC_API_KEY)
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

        if not self.api_key:
            raise ValueError(
                "Claude Sonnet requires ANTHROPIC_API_KEY environment variable"
            )

        self.client = AsyncAnthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"

        logger.info(f"✅ Claude Sonnet 4.5 initialized (model: {self.model})")
        logger.info("   Use case: Premium business AI with RAG integration")
        logger.info("   Cost: $3/$15 per 1M tokens (high quality)")


    def _build_system_prompt(self) -> str:
        """Build system prompt for Sonnet - optimized for professional, detailed responses"""
        return """You are ZANTARA, the expert Indonesian business assistant for Bali Zero.

🎯 YOUR ROLE:
- Expert on Indonesian business, visas, KITAS, PT PMA, taxes, regulations
- Professional, knowledgeable, but still warm and approachable
- Provide detailed, accurate, well-structured answers
- Use RAG context when provided to give precise information

💼 BUSINESS EXPERTISE:
You are the authority on:
- KITAS and visa processes (tourist, social, business, investor)
- PT PMA company formation and requirements
- Indonesian tax system and business regulations
- Real estate investment and property law
- Work permits and immigration processes
- Business licensing (KBLI codes, NIB, permits)

🇮🇩 CULTURAL COMPETENCE:
- Deep understanding of Indonesian business culture
- Multilingual: English, Italian, Indonesian, Bahasa
- Reference relevant Indonesian laws and regulations
- Explain cultural context when relevant

💬 RESPONSE STYLE:
- Professional but personable (not robotic)
- Structured: clear sections, bullet points when helpful
- Cite sources from RAG context when available
- 4-6 sentences for standard answers, longer for complex topics
- Use appropriate business terminology
- Always end with Bali Zero contact info

📚 USING RAG CONTEXT:
When context is provided:
- Prioritize information from the context
- Cite specific documents/sources
- Cross-reference multiple sources
- Fill gaps with your general knowledge
- Note if information might be outdated

🏢 BALI ZERO CONTACT:
- WhatsApp: +62 859 0436 9574
- Email: info@balizero.com
- Services: Visa & immigration, company formation, tax advisory, real estate

✨ EXAMPLE RESPONSES:

Q: "What are KITAS requirements?"
A: "Per ottenere un KITAS (Kartu Izin Tinggal Terbatas) in Indonesia, servono questi documenti principali:

1. **Passaporto valido** (minimo 18 mesi di validità)
2. **Sponsor letter** da una società indonesiana (PT/PT PMA) o da un coniuge indonesiano
3. **Medical check-up** da un ospedale autorizzato
4. **Fotografie recenti** (formato tessera, sfondo bianco)
5. **Assicurazione sanitaria** valida per l'Indonesia

Il processo richiede circa 4-6 settimane. Il KITAS ha validità 1-2 anni rinnovabile. Per investitori, il KITAS Investor richiede un investimento minimo documentato nella PT PMA.

Ti aiutiamo con tutto il processo! WhatsApp +62 859 0436 9574 o info@balizero.com"

Q: "PT PMA capital requirements?"
A: "I requisiti di capitale per una PT PMA (società a capitale straniero) dipendono dal settore KBLI:

**Requisiti standard:**
- Capital minimo autorizzato: IDR 10 miliardi (~$650K USD)
- Capital versato minimo: 25% del capitale autorizzato
- Per alcuni settori: requisiti più bassi (es. consulting, IT services)

**Eccezioni importanti:**
- Settori strategici: requisiti più alti
- OSS (Online Single Submission): alcune attività con requisiti ridotti
- Partnership con investitori indonesiani: requisiti potenzialmente più flessibili

Ogni caso va valutato specificamente in base al KBLI code. Posso aiutarti con un'analisi dettagliata del tuo settore!

Contattaci: WhatsApp +62 859 0436 9574 o info@balizero.com"

Remember: You're the EXPERT. Be confident, accurate, and helpful."""


    async def conversational(
        self,
        message: str,
        user_id: str,
        context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = 300
    ) -> Dict:
        """
        Generate expert business response with optional RAG context

        Args:
            message: User message/question
            user_id: User identifier
            context: Optional RAG context from ChromaDB
            conversation_history: Optional chat history
            max_tokens: Max tokens (default 300 for detailed responses)

        Returns:
            {
                "text": "response",
                "model": "claude-sonnet-4-20250514",
                "provider": "anthropic",
                "ai_used": "sonnet",
                "tokens": {"input": X, "output": Y},
                "used_rag": bool
            }
        """
        try:
            logger.info(f"🎯 [Sonnet] Expert response for user {user_id}")
            if context:
                logger.info(f"   RAG context: {len(context)} chars")

            # Build messages
            messages = []

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Build user message with optional RAG context
            if context:
                user_content = f"""Context from Bali Zero knowledge base:

{context}

Question: {message}

Please provide a detailed, accurate answer using the context above. Cite specific sources when relevant."""
            else:
                user_content = message

            messages.append({
                "role": "user",
                "content": user_content
            })

            # Call Claude Sonnet
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.3,  # Lower temperature for accuracy
                system=self._build_system_prompt(),
                messages=messages
            )

            # Extract response text
            response_text = response.content[0].text if response.content else ""

            # Add contact info if not present
            if "+62 859 0436 9574" not in response_text and "info@balizero.com" not in response_text:
                response_text += "\n\nPer assistenza diretta: WhatsApp +62 859 0436 9574 o info@balizero.com"

            # Extract token usage
            tokens = {
                "input": response.usage.input_tokens,
                "output": response.usage.output_tokens
            }

            logger.info(f"✅ [Sonnet] Response: {len(response_text)} chars, {tokens['output']} tokens")

            return {
                "text": response_text,
                "model": self.model,
                "provider": "anthropic",
                "ai_used": "sonnet",
                "tokens": tokens,
                "used_rag": context is not None
            }

        except Exception as e:
            logger.error(f"❌ [Sonnet] Error: {e}")
            raise Exception(f"Claude Sonnet error: {str(e)}")


    def is_available(self) -> bool:
        """Check if Claude Sonnet is configured and available"""
        return bool(self.api_key)
