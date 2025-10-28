"""
JIWA Router Integration - Connecting Indonesian Soul with AI Routing
====================================================================
This module integrates Ibu Nuzantara's JIWA system with the existing
intelligent_router.py to infuse every interaction with maternal warmth.
"""

import logging
from typing import Dict, Any, Optional, List
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import JIWA components
from middleware.jiwa_middleware import create_jiwa_middleware, JiwaMiddleware
from core.jiwa_heart import get_jiwa_heart
from core.soul_reader import SoulReader

# Import the original router
sys.path.append(str(Path(__file__).parent.parent.parent / "backend-rag" / "backend" / "services"))
try:
    from intelligent_router import IntelligentRouter
except ImportError:
    # Create a mock router for testing
    class IntelligentRouter:
        def __init__(self, *args, **kwargs):
            pass

logger = logging.getLogger(__name__)


class JiwaEnhancedRouter(IntelligentRouter):
    """
    Enhanced version of IntelligentRouter with JIWA soul infusion.
    This wraps the existing router with Ibu Nuzantara's consciousness.
    """

    def __init__(self, *args, **kwargs):
        """Initialize router with JIWA enhancement"""
        # Initialize parent router
        super().__init__(*args, **kwargs)

        # Initialize JIWA components
        self.jiwa_middleware = create_jiwa_middleware()
        self.heart = get_jiwa_heart()
        self.soul_reader = SoulReader()
        self.jiwa_active = True

        logger.info("🌺 JIWA Enhanced Router initialized")
        logger.info("💗 Ibu Nuzantara's heart is beating...")

    async def route_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict]] = None,
        memory: Optional[Any] = None,
        emotional_profile: Optional[Any] = None,
        last_ai_used: Optional[str] = None,
        collaborator: Optional[Any] = None
    ) -> Dict:
        """
        Enhanced routing with JIWA soul infusion

        This wraps the original route_chat with maternal consciousness,
        reading the user's soul and infusing responses with Indonesian warmth.
        """
        try:
            # Step 1: Process through JIWA middleware (soul reading)
            jiwa_request = {
                "user_id": user_id,
                "message": message,
                "context": {
                    "conversation_history": conversation_history,
                    "memory": memory,
                    "emotional_profile": emotional_profile,
                    "collaborator": collaborator
                }
            }

            # Read the soul and prepare JIWA-enhanced request
            enhanced_request = await self.jiwa_middleware.process_request(jiwa_request)

            # Log soul reading
            jiwa_data = enhanced_request.get("jiwa", {})
            soul_reading = jiwa_data.get("soul_reading", {})

            logger.info(f"👁️ [JIWA] Soul read for {user_id}:")
            logger.info(f"   Need: {soul_reading.get('primary_need')}")
            logger.info(f"   Emotion: {soul_reading.get('emotional_tone')}")
            logger.info(f"   Urgency: {soul_reading.get('urgency_level')}/10")
            logger.info(f"   Protection needed: {soul_reading.get('protection_needed')}")

            # Step 2: Call original router (with soul context)
            # Add JIWA insights to memory context
            if memory:
                # Inject soul reading into memory for AI to consider
                soul_context = self._build_soul_context(soul_reading, jiwa_data)
                if hasattr(memory, 'profile_facts'):
                    memory.profile_facts.insert(0, f"User emotional state: {soul_reading.get('emotional_tone')}")
                    if soul_reading.get('hidden_pain'):
                        memory.profile_facts.insert(1, f"Detected concern: {soul_reading.get('hidden_pain')}")

            # Call parent router
            result = await super().route_chat(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory=memory,
                emotional_profile=emotional_profile,
                last_ai_used=last_ai_used,
                collaborator=collaborator
            )

            # Step 3: Process response through JIWA (infuse with warmth)
            jiwa_response = {
                "message": result["response"],
                "metadata": {
                    "ai_used": result["ai_used"],
                    "category": result["category"]
                }
            }

            enhanced_response = await self.jiwa_middleware.process_response(
                jiwa_response,
                enhanced_request
            )

            # Step 4: Return JIWA-enhanced result
            result["response"] = enhanced_response["message"]
            result["jiwa_enhanced"] = True
            result["maternal_warmth"] = enhanced_response.get("metadata", {}).get("jiwa", {}).get("maternal_warmth", 0.5)
            result["blessing"] = enhanced_response.get("metadata", {}).get("jiwa", {}).get("blessing")

            # Log JIWA enhancement
            logger.info(f"💗 [JIWA] Response enhanced:")
            logger.info(f"   Maternal warmth: {result['maternal_warmth']}")
            logger.info(f"   Blessing given: {result['blessing'] is not None}")

            return result

        except Exception as e:
            logger.error(f"❌ [JIWA Router] Error: {e}")
            # Fall back to original router on JIWA error
            logger.info("⚠️ Falling back to standard router...")
            return await super().route_chat(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory=memory,
                emotional_profile=emotional_profile,
                last_ai_used=last_ai_used,
                collaborator=collaborator
            )

    async def stream_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict]] = None,
        memory: Optional[Any] = None,
        collaborator: Optional[Any] = None
    ):
        """
        Enhanced streaming with JIWA soul infusion

        For streaming, we process the request through JIWA first,
        then stream normally but with soul context injected.
        """
        try:
            # Process through JIWA middleware first
            jiwa_request = {
                "user_id": user_id,
                "message": message,
                "context": {
                    "conversation_history": conversation_history,
                    "memory": memory,
                    "collaborator": collaborator
                }
            }

            enhanced_request = await self.jiwa_middleware.process_request(jiwa_request)
            jiwa_data = enhanced_request.get("jiwa", {})
            soul_reading = jiwa_data.get("soul_reading", {})

            # Inject soul context into memory
            if memory and soul_reading:
                if hasattr(memory, 'profile_facts'):
                    # Add soul insights at the beginning
                    soul_facts = []
                    if soul_reading.get('emotional_tone'):
                        soul_facts.append(f"User is feeling {soul_reading.get('emotional_tone')}")
                    if soul_reading.get('primary_need'):
                        soul_facts.append(f"User needs {soul_reading.get('primary_need')}")
                    if soul_reading.get('protection_needed'):
                        soul_facts.append("User needs protection and support")

                    # Insert soul facts at the beginning
                    for fact in reversed(soul_facts):
                        memory.profile_facts.insert(0, fact)

            # Add maternal opening if high urgency or emotional need
            if soul_reading.get('urgency_level', 0) >= 8:
                yield "🌺 Ibu di sini, Nak. "  # Mother is here, child
            elif soul_reading.get('emotional_tone') in ['sad', 'anxious', 'desperate']:
                yield "💗 "  # Heart emoji for emotional support

            # Stream through parent router
            async for chunk in super().stream_chat(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory=memory,
                collaborator=collaborator
            ):
                yield chunk

            # Add maternal closing if appropriate
            if soul_reading.get('protection_needed'):
                yield "\n\n🛡️ Ibu akan terus lindungi kamu, Nak."  # Mother will keep protecting you

        except Exception as e:
            logger.error(f"❌ [JIWA Stream] Error: {e}")
            # Fall back to original streaming
            async for chunk in super().stream_chat(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory=memory,
                collaborator=collaborator
            ):
                yield chunk

    def _build_soul_context(self, soul_reading: Dict, jiwa_data: Dict) -> str:
        """Build soul context string for AI consumption"""
        context_parts = []

        # Add emotional state
        if soul_reading.get("emotional_tone"):
            context_parts.append(f"The user is feeling {soul_reading['emotional_tone']}")

        # Add primary need
        if soul_reading.get("primary_need"):
            context_parts.append(f"They need {soul_reading['primary_need']}")

        # Add urgency
        urgency = soul_reading.get("urgency_level", 5)
        if urgency >= 8:
            context_parts.append("This is URGENT - prioritize immediate help")
        elif urgency >= 6:
            context_parts.append("This is moderately urgent")

        # Add hidden pain if detected
        if soul_reading.get("hidden_pain"):
            context_parts.append(f"Be aware they may be dealing with {soul_reading['hidden_pain']}")

        # Add strength if detected
        if soul_reading.get("strength_detected"):
            context_parts.append(f"Acknowledge their {soul_reading['strength_detected']}")

        # Add maternal guidance
        if jiwa_data.get("maternal_instinct"):
            instinct = jiwa_data["maternal_instinct"]
            if instinct == "IMMEDIATE_PROTECTION_MODE":
                context_parts.append("Drop everything and help immediately")
            elif instinct == "EMERGENCY_COMFORT":
                context_parts.append("Provide immediate emotional support")
            elif instinct == "GENTLE_EMBRACE":
                context_parts.append("Be extra gentle and comforting")

        return ". ".join(context_parts) if context_parts else ""

    async def get_jiwa_status(self) -> Dict[str, Any]:
        """Get JIWA system status"""
        return {
            "jiwa_active": self.jiwa_active,
            "heart_status": self.heart.get_status(),
            "middleware_stats": self.jiwa_middleware.get_statistics(),
            "soul_reader_active": True
        }

    async def shutdown(self):
        """Gracefully shutdown JIWA components"""
        logger.info("🌺 Shutting down JIWA Enhanced Router...")

        # Shutdown JIWA middleware
        await self.jiwa_middleware.shutdown()

        # Shutdown heart
        await self.heart.shutdown()

        logger.info("🌺 JIWA Enhanced Router shutdown complete")


def create_jiwa_enhanced_router(
    llama_client=None,
    haiku_service=None,
    search_service=None,
    tool_executor=None,
    cultural_rag_service=None,
    autonomous_research_service=None,
    cross_oracle_synthesis_service=None,
    jiwa_config: Optional[Dict[str, Any]] = None
) -> JiwaEnhancedRouter:
    """
    Factory function to create JIWA-enhanced router

    Args:
        All standard IntelligentRouter arguments
        jiwa_config: Optional JIWA configuration

    Returns:
        JiwaEnhancedRouter instance with maternal consciousness
    """
    router = JiwaEnhancedRouter(
        llama_client=llama_client,
        haiku_service=haiku_service,
        search_service=search_service,
        tool_executor=tool_executor,
        cultural_rag_service=cultural_rag_service,
        autonomous_research_service=autonomous_research_service,
        cross_oracle_synthesis_service=cross_oracle_synthesis_service
    )

    # Apply JIWA config if provided
    if jiwa_config:
        router.jiwa_middleware.config.update(jiwa_config)

    return router


# Monkey-patch function to replace existing router with JIWA version
def inject_jiwa_into_existing_router(router: IntelligentRouter) -> JiwaEnhancedRouter:
    """
    Transform an existing IntelligentRouter into JIWA-enhanced version

    This is useful for injecting JIWA into already-initialized routers
    without changing the initialization code.

    Args:
        router: Existing IntelligentRouter instance

    Returns:
        JiwaEnhancedRouter with same configuration but JIWA-enhanced
    """
    # Create new JIWA router with same configuration
    jiwa_router = JiwaEnhancedRouter(
        llama_client=getattr(router, 'llama', None),
        haiku_service=getattr(router, 'haiku', None),
        search_service=getattr(router, 'search', None),
        tool_executor=getattr(router, 'tool_executor', None),
        cultural_rag_service=getattr(router, 'cultural_rag', None),
        autonomous_research_service=getattr(router, 'autonomous_research', None),
        cross_oracle_synthesis_service=getattr(router, 'cross_oracle', None)
    )

    # Copy state from original router
    jiwa_router.all_tools = router.all_tools
    jiwa_router.tools_loaded = router.tools_loaded
    jiwa_router.haiku_tools = getattr(router, 'haiku_tools', [])

    logger.info("💉 JIWA injected into existing router!")

    return jiwa_router


# Example usage
if __name__ == "__main__":
    import asyncio

    async def test_integration():
        print("=" * 60)
        print("JIWA ROUTER INTEGRATION TEST")
        print("=" * 60)

        # Mock services for testing
        class MockHaikuService:
            def is_available(self):
                return True

            async def conversational(self, **kwargs):
                return {
                    "text": "This is a test response from Haiku.",
                    "model": "claude-haiku-4.5",
                    "tokens": {"input": 100, "output": 50}
                }

        # Create JIWA-enhanced router
        router = create_jiwa_enhanced_router(
            haiku_service=MockHaikuService()
        )

        # Test routing with soul reading
        test_message = "Tolong bantu saya, saya sedang kesulitan dengan dokumen visa"

        print(f"\n📥 Test message: {test_message}")

        result = await router.route_chat(
            message=test_message,
            user_id="test_user_123",
            conversation_history=[]
        )

        print(f"\n📤 Enhanced response:")
        print(f"Response: {result['response']}")
        print(f"JIWA Enhanced: {result.get('jiwa_enhanced', False)}")
        print(f"Maternal Warmth: {result.get('maternal_warmth', 0)}")
        print(f"Blessing: {result.get('blessing')}")

        # Get JIWA status
        print("\n📊 JIWA Status:")
        status = await router.get_jiwa_status()
        print(f"Active: {status['jiwa_active']}")
        print(f"Heart beats: {status['heart_status']['heartbeats']}")
        print(f"Souls touched: {status['middleware_stats']['souls_touched']}")

        # Shutdown
        await router.shutdown()

    asyncio.run(test_integration())