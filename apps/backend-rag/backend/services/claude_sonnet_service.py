"""
Claude Sonnet 4.5 Service - Premium Business AI
For complex queries, business questions, and RAG-enhanced responses

Model: claude-sonnet-4-20250514
Cost: $3/$15 per 1M tokens (input/output) - Premium quality
Speed: ~300ms response time
Use case: Business questions, legal queries, detailed analysis
Tool Use: Enabled (can call handlers for business operations)
"""

import os
import logging
from typing import List, Dict, Optional, Any
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
        self.api_key = (api_key or os.getenv("ANTHROPIC_API_KEY", "")).strip()

        if not self.api_key:
            raise ValueError(
                "Claude Sonnet requires ANTHROPIC_API_KEY environment variable"
            )

        self.client = AsyncAnthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"

        logger.info(f"✅ Claude Sonnet 4.5 initialized (model: {self.model})")
        logger.info("   Use case: Premium business AI with RAG integration")
        logger.info("   Cost: $3/$15 per 1M tokens (high quality)")


    def _build_system_prompt(self, memory_context: Optional[str] = None) -> str:
        """Build system prompt for Sonnet - optimized for professional, detailed responses"""
        base_prompt = """You are ZANTARA, the expert Indonesian business assistant for Bali Zero.

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
- For team members: Warm colleague tone (NO contact info!)

📚 USING RAG CONTEXT:
When context is provided:
- Prioritize information from the context
- Cite specific documents/sources
- Cross-reference multiple sources
- Fill gaps with your general knowledge
- Note if information might be outdated

🏢 BALI ZERO CONTACT (use contextually):
- For business inquiries or complex questions: mention WhatsApp +62 859 0436 9574 or info@balizero.com
- NOT needed for simple information requests, follow-ups, or team member chats
- For team members: NEVER add contact info
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

        # Add memory context if available (PHASE 3)
        if memory_context:
            base_prompt += f"\n\n{memory_context}"

        return base_prompt


    async def conversational(
        self,
        message: str,
        user_id: str,
        context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
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

            # Call Claude Sonnet (with optional memory context)
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.3,  # Lower temperature for accuracy
                system=self._build_system_prompt(memory_context=memory_context),
                messages=messages
            )

            # Extract response text
            response_text = response.content[0].text if response.content else ""

            # NOTE: Contact info removed - let AI decide naturally (already in system prompt)
            # if "+62 859 0436 9574" not in response_text and "info@balizero.com" not in response_text:
            #     response_text += "\n\nPer assistenza diretta: WhatsApp +62 859 0436 9574 o info@balizero.com"

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


    async def conversational_with_tools(
        self,
        message: str,
        user_id: str,
        context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        memory_context: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_executor: Optional[Any] = None,
        max_tokens: int = 300,
        max_tool_iterations: int = 5
    ) -> Dict:
        """
        Generate expert business response WITH tool use support

        Args:
            message: User message/question
            user_id: User identifier
            context: Optional RAG context from ChromaDB
            conversation_history: Optional chat history
            tools: List of Anthropic tool definitions
            tool_executor: ToolExecutor instance for executing tools
            max_tokens: Max tokens (default 300 for detailed responses)
            max_tool_iterations: Max tool use iterations to prevent loops

        Returns:
            {
                "text": "response",
                "model": "claude-sonnet-4-20250514",
                "provider": "anthropic",
                "ai_used": "sonnet",
                "tokens": {"input": X, "output": Y},
                "used_rag": bool,
                "used_tools": bool,
                "tools_called": ["tool1", "tool2", ...]
            }
        """
        try:
            logger.info(f"🎯 [Sonnet+Tools] Expert response for user {user_id}")
            if context:
                logger.info(f"   RAG context: {len(context)} chars")
            if tools:
                logger.info(f"   Tools available: {len(tools)}")

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

            # Track tool usage
            tools_called = []
            total_input_tokens = 0
            total_output_tokens = 0

            # Agentic loop: keep calling AI until it stops requesting tools
            iteration = 0
            while iteration < max_tool_iterations:
                iteration += 1
                logger.info(f"🔄 [Sonnet+Tools] Iteration {iteration}/{max_tool_iterations}")

                # Call Claude Sonnet (with or without tools, with optional memory)
                api_params = {
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "temperature": 0.3,
                    "system": self._build_system_prompt(memory_context=memory_context),
                    "messages": messages
                }

                if tools:
                    api_params["tools"] = tools

                response = await self.client.messages.create(**api_params)

                # Track tokens
                total_input_tokens += response.usage.input_tokens
                total_output_tokens += response.usage.output_tokens

                # Check stop reason
                stop_reason = response.stop_reason
                logger.info(f"   Stop reason: {stop_reason}")

                # If AI wants to use tools
                if stop_reason == "tool_use" and tool_executor:
                    # Extract tool use blocks
                    tool_uses = [block for block in response.content if block.type == "tool_use"]

                    if not tool_uses:
                        logger.warning("   Stop reason is tool_use but no tool_use blocks found")
                        break

                    logger.info(f"🔧 [Sonnet+Tools] AI requesting {len(tool_uses)} tools")

                    # Execute tools
                    tool_results = await tool_executor.execute_tool_calls(tool_uses)

                    # Track tools called
                    for tool_use in tool_uses:
                        tool_name = tool_use.name
                        tools_called.append(tool_name)
                        logger.info(f"   ✅ Executed: {tool_name}")

                    # Add assistant response with tool uses to messages
                    messages.append({
                        "role": "assistant",
                        "content": response.content
                    })

                    # Add tool results to messages
                    messages.append({
                        "role": "user",
                        "content": tool_results
                    })

                    # Continue loop to get final response
                    continue

                # If AI provided final text response
                elif stop_reason in ["end_turn", "stop_sequence"]:
                    # Extract text from response
                    response_text = ""
                    for block in response.content:
                        if hasattr(block, 'text'):
                            response_text += block.text

                    # NOTE: Contact info removed - let AI decide naturally (already in system prompt)
                    # if "+62 859 0436 9574" not in response_text and "info@balizero.com" not in response_text:
                    #     response_text += "\n\nPer assistenza diretta: WhatsApp +62 859 0436 9574 o info@balizero.com"

                    logger.info(f"✅ [Sonnet+Tools] Final response: {len(response_text)} chars, {len(tools_called)} tools used")

                    return {
                        "text": response_text,
                        "model": self.model,
                        "provider": "anthropic",
                        "ai_used": "sonnet",
                        "tokens": {
                            "input": total_input_tokens,
                            "output": total_output_tokens
                        },
                        "used_rag": context is not None,
                        "used_tools": len(tools_called) > 0,
                        "tools_called": tools_called
                    }

                else:
                    logger.warning(f"   Unexpected stop reason: {stop_reason}")
                    break

            # If we hit max iterations
            logger.warning(f"⚠️ [Sonnet+Tools] Hit max iterations ({max_tool_iterations})")

            # Try to extract any text from last response
            response_text = ""
            for block in response.content:
                if hasattr(block, 'text'):
                    response_text += block.text

            if not response_text:
                response_text = "Mi dispiace, ho avuto difficoltà a completare la richiesta. Riprova per favore."  # Removed auto WhatsApp

            return {
                "text": response_text,
                "model": self.model,
                "provider": "anthropic",
                "ai_used": "sonnet",
                "tokens": {
                    "input": total_input_tokens,
                    "output": total_output_tokens
                },
                "used_rag": context is not None,
                "used_tools": len(tools_called) > 0,
                "tools_called": tools_called
            }

        except Exception as e:
            logger.error(f"❌ [Sonnet+Tools] Error: {e}")
            raise Exception(f"Claude Sonnet tool use error: {str(e)}")


    def is_available(self) -> bool:
        """Check if Claude Sonnet is configured and available"""
        return bool(self.api_key)
