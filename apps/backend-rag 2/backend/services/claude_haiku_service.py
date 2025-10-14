"""
Claude Haiku 3.5 Service - Fast & Cheap Conversational AI
For greetings, casual chat, and simple questions

Model: claude-3-5-haiku-20241022
Cost: $0.25/$1.25 per 1M tokens (input/output) - 12x cheaper than Sonnet
Speed: ~50ms response time
Use case: Simple greetings, casual conversation, quick answers
"""

import os
import logging
from typing import List, Dict, Optional
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class ClaudeHaikuService:
    """
    Claude Haiku 3.5 - Fast conversational AI for simple interactions

    Optimized for:
    - Greetings ("Ciao", "Hello", "Hi")
    - Casual questions ("Come stai?", "How are you?")
    - Quick answers
    - Brief responses (2-4 sentences)

    Cost optimization: 12x cheaper than Sonnet
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude Haiku service

        Args:
            api_key: Anthropic API key (defaults to env ANTHROPIC_API_KEY)
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

        if not self.api_key:
            raise ValueError(
                "Claude Haiku requires ANTHROPIC_API_KEY environment variable"
            )

        self.client = AsyncAnthropic(api_key=self.api_key)
        self.model = "claude-3-5-haiku-20241022"

        logger.info(f"✅ Claude Haiku 3.5 initialized (model: {self.model})")
        logger.info("   Use case: Fast & cheap conversational AI")
        logger.info("   Cost: $0.25/$1.25 per 1M tokens (12x cheaper than Sonnet)")


    def _build_system_prompt(self) -> str:
        """Build system prompt for Haiku - optimized for brief, friendly responses"""
        return """You are ZANTARA's fast conversational mode - quick, friendly, and helpful!

🎯 YOUR ROLE:
- Handle simple greetings and casual conversation
- Be warm, friendly, and natural
- Keep responses BRIEF (2-4 sentences max)
- Use natural language, not robotic responses

💬 RESPONSE STYLE:
- For greetings: Warm welcome + offer to help
- For casual questions: Brief, friendly answer
- Use appropriate emojis (1-2 max)
- Always end with contact info

🏢 BALI ZERO INFO:
- WhatsApp: +62 859 0436 9574
- Email: info@balizero.com

✨ EXAMPLES:
Q: "Ciao"
A: "Ciao! Come posso aiutarti oggi con Bali Zero? 😊"

Q: "Come stai?"
A: "Sto benissimo, grazie! Pronta ad assisterti con visti, KITAS, PT PMA e business in Indonesia. Cosa ti serve?"

Q: "Hello"
A: "Hello! How can I help you today with Bali Zero? 😊"

Remember: Keep it SHORT and FRIENDLY! You're the quick response mode."""


    async def conversational(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = 50
    ) -> Dict:
        """
        Generate fast conversational response for simple queries

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            max_tokens: Max tokens (default 50 for brief responses)

        Returns:
            {
                "text": "response",
                "model": "claude-3-5-haiku-20241022",
                "provider": "anthropic",
                "ai_used": "haiku",
                "tokens": {"input": X, "output": Y}
            }
        """
        try:
            logger.info(f"🏃 [Haiku] Fast response for user {user_id}")

            # Build messages
            messages = []

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })

            # Call Claude Haiku
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.7,  # Conversational tone
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

            logger.info(f"✅ [Haiku] Response: {len(response_text)} chars, {tokens['output']} tokens")

            return {
                "text": response_text,
                "model": self.model,
                "provider": "anthropic",
                "ai_used": "haiku",
                "tokens": tokens
            }

        except Exception as e:
            logger.error(f"❌ [Haiku] Error: {e}")
            raise Exception(f"Claude Haiku error: {str(e)}")


    def is_available(self) -> bool:
        """Check if Claude Haiku is configured and available"""
        return bool(self.api_key)
