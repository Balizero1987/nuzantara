"""
Intelligent Router - QUADRUPLE-AI routing system
Uses LLAMA 3.1 for intent classification, routes to appropriate AI

Routing logic:
- Greetings/Casual → Claude Haiku (fast & cheap)
- Business/Complex → Claude Sonnet + RAG (premium quality)
- Code/Development → DevAI Qwen 2.5 Coder (code specialist)
- Fallback → LLAMA 3.1 (self-hosted)
"""

import logging
import re
from typing import Dict, Optional, List, Any

logger = logging.getLogger(__name__)


class IntelligentRouter:
    """
    QUADRUPLE-AI intelligent routing system

    Architecture:
    1. LLAMA 3.1: Intent classification (self-hosted, no cost)
    2. Claude Haiku: Simple/casual queries (12x cheaper)
    3. Claude Sonnet: Business/complex queries (premium)
    4. DevAI Qwen 2.5 Coder: Code/development queries (specialist)

    Cost optimization: Routes 60% to Haiku, 35% to Sonnet, 5% to DevAI
    """

    def __init__(
        self,
        llama_client,
        haiku_service,
        sonnet_service,
        devai_endpoint=None,
        search_service=None,
        tool_executor=None
    ):
        """
        Initialize intelligent router

        Args:
            llama_client: ZantaraClient for intent classification + fallback
            haiku_service: ClaudeHaikuService for simple queries
            sonnet_service: ClaudeSonnetService for complex queries
            devai_endpoint: DevAI endpoint URL for code queries (optional)
            search_service: Optional SearchService for RAG
            tool_executor: ToolExecutor for handler execution (optional)
        """
        self.llama = llama_client
        self.haiku = haiku_service
        self.sonnet = sonnet_service
        self.devai_endpoint = devai_endpoint
        self.search = search_service
        self.tool_executor = tool_executor

        # Available tools will be loaded on first use
        self.all_tools = None
        self.haiku_tools = None  # Limited subset for Haiku
        self.tools_loaded = False

        logger.info("✅ IntelligentRouter initialized (QUADRUPLE-AI)")
        logger.info(f"   LLAMA (classifier): {'✅' if llama_client else '❌'}")
        logger.info(f"   Haiku (greetings): {'✅' if haiku_service else '❌'}")
        logger.info(f"   Sonnet (business): {'✅' if sonnet_service else '❌'}")
        logger.info(f"   DevAI (code): {'✅' if devai_endpoint else '❌'}")
        logger.info(f"   RAG (context): {'✅' if search_service else '❌'}")
        logger.info(f"   Tool Use: {'✅' if tool_executor else '❌'}")


    async def _load_tools(self):
        """
        Load available tools from ToolExecutor and filter for Haiku/Sonnet

        Haiku gets LIMITED tools (fast, essential only):
        - pricing.*
        - team.recent_activity
        - memory.* (fast read-only operations)

        Sonnet gets ALL tools (full capability).
        """
        if self.tools_loaded or not self.tool_executor:
            return

        try:
            logger.info("🔧 [Router] Loading available tools...")

            # Get all available tools from ToolExecutor
            self.all_tools = await self.tool_executor.get_available_tools()

            logger.info(f"   Total tools available: {len(self.all_tools)}")

            # Filter essential tools for Haiku (fast, read-only)
            haiku_allowed_prefixes = [
                "pricing_",           # Pricing queries (fast)
                "team_recent",        # Recent activity (fast)
                "memory_retrieve",    # Memory read (fast)
                "memory_search"       # Memory search (fast)
            ]

            self.haiku_tools = [
                tool for tool in self.all_tools
                if any(tool["name"].startswith(prefix) for prefix in haiku_allowed_prefixes)
            ]

            logger.info(f"   Haiku tools (LIMITED): {len(self.haiku_tools)}")
            logger.info(f"   Sonnet tools (FULL): {len(self.all_tools)}")

            self.tools_loaded = True

        except Exception as e:
            logger.error(f"❌ [Router] Failed to load tools: {e}")
            self.all_tools = []
            self.haiku_tools = []
            self.tools_loaded = True


    async def classify_intent(self, message: str) -> Dict:
        """
        Use LLAMA to classify user intent

        Categories:
        - greeting: Simple greetings (Ciao, Hello, Hi)
        - casual: Casual questions (Come stai? How are you?)
        - business_simple: Simple business questions
        - business_complex: Complex business/legal questions
        - devai_code: Development/code queries
        - unknown: Fallback category

        Returns:
            {
                "category": str,
                "confidence": float,
                "suggested_ai": "haiku"|"sonnet"|"devai"|"llama"
            }
        """
        try:
            # Fast pattern matching for obvious cases (saves LLAMA call)
            message_lower = message.lower().strip()

            # Check exact greetings first
            simple_greetings = ["ciao", "hello", "hi", "hey", "salve", "buongiorno", "buonasera", "halo", "hallo"]
            if message_lower in simple_greetings:
                logger.info(f"🎯 [Router] Quick match: greeting")
                return {
                    "category": "greeting",
                    "confidence": 1.0,
                    "suggested_ai": "haiku"
                }

            # Check casual questions
            casual_patterns = [
                "come stai", "how are you", "come va", "tutto bene", "apa kabar", "what's up", "whats up",
                "sai chi sono", "do you know me", "know who i am", "recognize me", "remember me", "mi riconosci"
            ]
            if any(pattern in message_lower for pattern in casual_patterns):
                logger.info(f"🎯 [Router] Quick match: casual")
                return {
                    "category": "casual",
                    "confidence": 1.0,
                    "suggested_ai": "haiku"
                }

            # Check business keywords
            business_keywords = [
                "kitas", "visa", "pt pma", "company", "business", "investimento", "investment",
                "tax", "pajak", "immigration", "imigrasi", "permit", "license", "regulation",
                "real estate", "property", "kbli", "nib", "oss", "work permit"
            ]
            has_business_term = any(keyword in message_lower for keyword in business_keywords)

            if has_business_term:
                # Business query - check if simple or complex
                complex_indicators = ["how", "why", "explain", "detail", "process", "requirement", "step", "procedure"]
                is_complex = any(indicator in message_lower for indicator in complex_indicators) or len(message) > 100

                if is_complex:
                    logger.info(f"🎯 [Router] Quick match: business_complex")
                    return {
                        "category": "business_complex",
                        "confidence": 0.9,
                        "suggested_ai": "sonnet"
                    }
                else:
                    logger.info(f"🎯 [Router] Quick match: business_simple")
                    return {
                        "category": "business_simple",
                        "confidence": 0.9,
                        "suggested_ai": "sonnet"
                    }

            # Check DevAI keywords (code/development)
            devai_keywords = [
                "code", "coding", "programming", "debug", "error", "bug", "function",
                "api", "devai", "typescript", "javascript", "python", "java", "react",
                "algorithm", "refactor", "optimize", "test", "unit test"
            ]
            if any(keyword in message_lower for keyword in devai_keywords):
                logger.info(f"🎯 [Router] Quick match: devai_code")
                return {
                    "category": "devai_code",
                    "confidence": 0.9,
                    "suggested_ai": "devai"
                }

            # For ambiguous cases, DEFAULT to Haiku (fast) for short messages, Sonnet for longer
            logger.info(f"🤔 [Router] LLAMA DISABLED - Using fast pattern fallback for: '{message[:50]}...'")

            # Fast heuristic: short messages → Haiku, longer → Sonnet
            if len(message) < 50:
                category = "casual"
                suggested_ai = "haiku"
                logger.info(f"🎯 [Router] Fast fallback: SHORT message → Haiku")
            else:
                category = "business_simple"
                suggested_ai = "sonnet"
                logger.info(f"🎯 [Router] Fast fallback: LONG message → Sonnet")

            return {
                "category": category,
                "confidence": 0.7,  # LLAMA classification confidence
                "suggested_ai": suggested_ai
            }

        except Exception as e:
            logger.error(f"❌ [Router] Classification error: {e}")
            # Fallback: route to Sonnet (safest option)
            return {
                "category": "unknown",
                "confidence": 0.0,
                "suggested_ai": "sonnet"
            }


    async def route_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict]] = None,
        memory: Optional[Any] = None  # ← NEW: Memory context
    ) -> Dict:
        """
        Main routing function - classifies intent and routes to appropriate AI

        Args:
            message: User message
            user_id: User identifier
            conversation_history: Optional chat history
            memory: Optional memory context for user (NEW)

        Returns:
            {
                "response": str,
                "ai_used": "haiku"|"sonnet"|"llama",
                "category": str,
                "model": str,
                "tokens": dict,
                "used_rag": bool
            }
        """
        try:
            logger.info(f"🚦 [Router] Routing message for user {user_id}")

            # PHASE 3: Build memory context if available
            memory_context = None
            if memory:
                facts_count = len(memory.profile_facts) if hasattr(memory, 'profile_facts') else 0
                logger.info(f"💾 [Router] Memory loaded: {facts_count} facts")

                # Build memory context string
                if facts_count > 0:
                    memory_context = "--- USER MEMORY ---\n"
                    memory_context += f"Known facts about {user_id}:\n"
                    for fact in memory.profile_facts[:10]:  # Top 10 facts
                        memory_context += f"- {fact}\n"

                    if memory.summary:
                        memory_context += f"\nSummary: {memory.summary[:500]}\n"

                    logger.info(f"💾 [Router] Memory context built: {len(memory_context)} chars")

            # Step 1: Classify intent
            intent = await self.classify_intent(message)
            category = intent["category"]
            suggested_ai = intent["suggested_ai"]

            logger.info(f"   Category: {category} → AI: {suggested_ai}")

            # Step 2: Load tools if not already loaded
            if not self.tools_loaded and self.tool_executor:
                await self._load_tools()

            # Step 3: Route to appropriate AI
            if suggested_ai == "haiku":
                # ROUTE 1: Claude Haiku (Fast & Cheap)
                logger.info("🏃 [Router] Using Claude Haiku (fast & cheap)")

                # Use tool-enabled method if tools available
                if self.tool_executor and self.haiku_tools:
                    logger.info(f"   Tool use: ENABLED (LIMITED - {len(self.haiku_tools)} tools)")
                    result = await self.haiku.conversational_with_tools(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 3: Pass memory
                        tools=self.haiku_tools,
                        tool_executor=self.tool_executor,
                        max_tokens=50,  # Brief responses only
                        max_tool_iterations=2  # LIMITED for speed
                    )
                else:
                    logger.info("   Tool use: DISABLED")
                    result = await self.haiku.conversational(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 3: Pass memory
                        max_tokens=50
                    )

                return {
                    "response": result["text"],
                    "ai_used": "haiku",
                    "category": category,
                    "model": result["model"],
                    "tokens": result["tokens"],
                    "used_rag": False,
                    "used_tools": result.get("used_tools", False),
                    "tools_called": result.get("tools_called", [])
                }

            elif suggested_ai == "sonnet":
                # ROUTE 2: Claude Sonnet + RAG (Premium Quality)
                logger.info("🎯 [Router] Using Claude Sonnet (premium + RAG)")

                # Get RAG context if available
                context = None
                if self.search:
                    try:
                        search_results = await self.search.search(
                            query=message,
                            user_level=3,  # Full access
                            limit=5
                        )
                        if search_results.get("results"):
                            context = "\n\n".join([
                                f"[{r['metadata'].get('title', 'Unknown')}]\n{r['text']}"
                                for r in search_results["results"][:3]
                            ])
                            logger.info(f"   RAG context: {len(context)} chars")
                    except Exception as e:
                        logger.warning(f"   RAG search failed: {e}")

                # Use tool-enabled method if tools available
                if self.tool_executor and self.all_tools:
                    logger.info(f"   Tool use: ENABLED (FULL - {len(self.all_tools)} tools)")
                    result = await self.sonnet.conversational_with_tools(
                        message=message,
                        user_id=user_id,
                        context=context,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 3: Pass memory
                        tools=self.all_tools,
                        tool_executor=self.tool_executor,
                        max_tokens=300,
                        max_tool_iterations=5
                    )
                else:
                    logger.info("   Tool use: DISABLED")
                    result = await self.sonnet.conversational(
                        message=message,
                        user_id=user_id,
                        context=context,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 3: Pass memory
                        max_tokens=300
                    )

                return {
                    "response": result["text"],
                    "ai_used": "sonnet",
                    "category": category,
                    "model": result["model"],
                    "tokens": result["tokens"],
                    "used_rag": result.get("used_rag", False),
                    "used_tools": result.get("used_tools", False),
                    "tools_called": result.get("tools_called", [])
                }

            elif suggested_ai == "devai":
                # ROUTE 3: DevAI Qwen 2.5 Coder (Code Specialist)
                logger.info("👨‍💻 [Router] Using DevAI Qwen 2.5 Coder (code specialist)")

                if not self.devai_endpoint:
                    logger.warning("⚠️ DevAI not configured, falling back to Sonnet")
                    # Fallback to Sonnet if DevAI unavailable
                    result = await self.sonnet.conversational(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 5: Pass memory to fallback
                        max_tokens=500  # More tokens for code
                    )
                    return {
                        "response": result["text"],
                        "ai_used": "sonnet",  # Indicate fallback
                        "category": category,
                        "model": result["model"],
                        "tokens": result["tokens"],
                        "used_rag": False
                    }

                # Call DevAI endpoint
                import httpx
                try:
                    # Build DevAI request with memory context
                    devai_payload = {
                        "message": message,
                        "user_id": user_id,
                        "conversation_history": conversation_history or []
                    }

                    # PHASE 5: Add memory context if available
                    if memory_context:
                        devai_payload["memory_context"] = memory_context
                        logger.info(f"   Passing memory context to DevAI ({len(memory_context)} chars)")

                    async with httpx.AsyncClient(timeout=60.0) as client:
                        devai_response = await client.post(
                            f"{self.devai_endpoint}/chat",
                            json=devai_payload
                        )
                        devai_response.raise_for_status()
                        devai_data = devai_response.json()

                    return {
                        "response": devai_data.get("response", ""),
                        "ai_used": "devai",
                        "category": category,
                        "model": "qwen-2.5-coder-7b",
                        "tokens": devai_data.get("tokens", {}),
                        "used_rag": False
                    }
                except Exception as e:
                    logger.error(f"❌ DevAI call failed: {e}, falling back to Sonnet")
                    # Fallback to Sonnet on DevAI error
                    result = await self.sonnet.conversational(
                        message=message,
                        user_id=user_id,
                        conversation_history=conversation_history,
                        memory_context=memory_context,  # PHASE 5: Pass memory to fallback
                        max_tokens=500
                    )
                    return {
                        "response": result["text"],
                        "ai_used": "sonnet",  # Indicate fallback
                        "category": category,
                        "model": result["model"],
                        "tokens": result["tokens"],
                        "used_rag": False
                    }

            else:
                # ROUTE 4: LLAMA Fallback (Self-hosted, for unknown cases)
                logger.info("🦙 [Router] Using LLAMA fallback")

                result = await self.llama.chat_async(
                    messages=[{"role": "user", "content": message}],
                    max_tokens=300,
                    temperature=0.7,
                    memory_context=memory_context  # PHASE 5: Memory in LLAMA
                )

                return {
                    "response": result["text"],
                    "ai_used": "llama",
                    "category": category,
                    "model": result["model"],
                    "tokens": result.get("tokens", {}),
                    "used_rag": False
                }

        except Exception as e:
            logger.error(f"❌ [Router] Routing error: {e}")
            raise Exception(f"Routing failed: {str(e)}")


    def get_stats(self) -> Dict:
        """Get router statistics"""
        return {
            "router": "intelligent_quadruple_ai",
            "ai_models": {
                "haiku": {
                    "available": self.haiku.is_available() if self.haiku else False,
                    "use_case": "greetings, casual chat",
                    "cost": "$0.25/$1.25 per 1M tokens",
                    "traffic": "60%"
                },
                "sonnet": {
                    "available": self.sonnet.is_available() if self.sonnet else False,
                    "use_case": "business, complex queries",
                    "cost": "$3/$15 per 1M tokens",
                    "traffic": "35%"
                },
                "devai": {
                    "available": bool(self.devai_endpoint),
                    "use_case": "code, development, programming",
                    "cost": "€3.78/month flat (RunPod)",
                    "traffic": "5%"
                },
                "llama": {
                    "available": self.llama.is_available() if self.llama else False,
                    "use_case": "fallback, unknown queries",
                    "cost": "€3.78/month flat (RunPod, shared with DevAI)",
                    "traffic": "<1%"
                }
            },
            "rag_available": self.search is not None,
            "total_cost_monthly": "$25-55 (3,000 requests)"
        }
