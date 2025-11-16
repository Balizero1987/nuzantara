"""
Intelligent Model Router
Routes queries to optimal model based on language, complexity, and priority
"""

from typing import Dict, List, Optional
import re
from llm.sahabat_ai_client import SahabatAIClient
from llm.llama_scout_client import LlamaScoutClient
import os


class IntelligentModelRouter:
    """
    Route queries to best model based on:
    - Language (Indonesian, English, Italian)
    - Priority (naturalness, accuracy, speed)
    - Query complexity
    """

    def __init__(self, enable_sahabat: bool = True):
        """
        Initialize router with available models

        Args:
            enable_sahabat: Enable SahabatAI (requires GPU or CPU)
        """
        self.enable_sahabat = enable_sahabat

        # Initialize models
        if enable_sahabat:
            try:
                print("🇮🇩 Initializing SahabatAI for natural Indonesian...")
                self.sahabat_ai = SahabatAIClient(use_4bit=True)
                print("✅ SahabatAI ready")
            except Exception as e:
                print(f"⚠️  SahabatAI not available: {e}")
                print("   Falling back to Llama Scout for all queries")
                self.sahabat_ai = None
                self.enable_sahabat = False
        else:
            self.sahabat_ai = None

        # Fallback models
        self.llama_scout = LlamaScoutClient(
            openrouter_api_key=os.getenv("OPENROUTER_API_KEY_LLAMA"),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

        print("✅ Intelligent Router initialized")

    async def route_query(
        self,
        messages: List[Dict[str, str]],
        language: str = "auto",
        priority: str = "auto"
    ) -> Dict:
        """
        Intelligently route query to best model

        Args:
            messages: Chat messages
            language: "auto", "id" (Indonesian), "en", "it"
            priority: "auto", "naturalness", "accuracy", "speed"

        Returns:
            Response dict with text and metadata
        """

        # Detect language if auto
        if language == "auto":
            language = self._detect_language(messages[-1]["content"])

        # Detect priority if auto
        if priority == "auto":
            priority = self._detect_priority(messages[-1]["content"], language)

        # Routing logic
        if language == "id":
            # Indonesian queries
            return await self._route_indonesian(messages, priority)

        else:
            # English/Italian queries
            return await self._route_other(messages, priority)

    async def _route_indonesian(
        self,
        messages: List[Dict[str, str]],
        priority: str
    ) -> Dict:
        """Route Indonesian queries"""

        if priority == "naturalness" and self.enable_sahabat:
            # SahabatAI: Best for natural, fluent Indonesian
            try:
                print("→ Routing to SahabatAI (naturalness priority)")
                return await self.sahabat_ai.chat_async(messages)
            except Exception as e:
                print(f"⚠️  SahabatAI error: {e}")
                print("→ Falling back to Llama Scout")
                return await self.llama_scout.chat_async(messages)

        elif priority == "accuracy":
            # Llama Scout: Best for complex legal/tax queries
            print("→ Routing to Llama Scout (accuracy priority)")
            return await self.llama_scout.chat_async(messages)

        else:
            # Default: Try SahabatAI, fallback to Llama
            if self.enable_sahabat:
                try:
                    print("→ Routing to SahabatAI (default Indonesian)")
                    return await self.sahabat_ai.chat_async(messages)
                except Exception as e:
                    print(f"→ Fallback to Llama Scout: {e}")
                    return await self.llama_scout.chat_async(messages)
            else:
                print("→ Routing to Llama Scout (SahabatAI disabled)")
                return await self.llama_scout.chat_async(messages)

    async def _route_other(
        self,
        messages: List[Dict[str, str]],
        priority: str
    ) -> Dict:
        """Route non-Indonesian queries"""
        print(f"→ Routing to Llama Scout (language: non-Indonesian)")
        return await self.llama_scout.chat_async(messages)

    def _detect_language(self, text: str) -> str:
        """
        Detect language from text

        Returns: "id", "en", or "it"
        """
        text_lower = text.lower()

        # Indonesian indicators (most common words)
        id_words = [
            "saya", "anda", "untuk", "dengan", "yang", "adalah",
            "mau", "bisa", "kita", "ini", "itu", "ada",
            "kalau", "bagaimana", "apa", "berapa", "dimana"
        ]
        id_score = sum(1 for word in id_words if word in text_lower)

        # Italian indicators
        it_words = [
            "sono", "voglio", "come", "quando", "dove", "perché",
            "cosa", "quanto", "posso", "vorrei", "grazie"
        ]
        it_score = sum(1 for word in it_words if word in text_lower)

        # Determine language
        if id_score > it_score and id_score > 0:
            return "id"
        elif it_score > 0:
            return "it"
        else:
            return "en"

    def _detect_priority(self, text: str, language: str) -> str:
        """
        Detect priority based on query characteristics

        Returns: "naturalness", "accuracy", or "speed"
        """

        if language != "id":
            # Non-Indonesian: use Llama Scout (accuracy)
            return "accuracy"

        text_lower = text.lower()

        # Legal/complex indicators
        complex_indicators = [
            "pasal", "peraturan", "undang-undang", "berdasarkan",
            "menurut", "sesuai dengan", "ketentuan", "peraturan pemerintah"
        ]
        is_complex = any(indicator in text_lower for indicator in complex_indicators)

        # Casual indicators
        casual_indicators = [
            "gimana", "dong", "nih", "sih", "mau", "bisa ga",
            "kok", "ya", "kan"
        ]
        is_casual = any(indicator in text_lower for indicator in casual_indicators)

        if is_complex:
            return "accuracy"  # Use Llama Scout for legal queries
        elif is_casual:
            return "naturalness"  # Use SahabatAI for casual queries
        else:
            return "naturalness"  # Default to naturalness for Indonesian

    def get_stats(self) -> Dict:
        """Get routing statistics"""
        return {
            "sahabat_enabled": self.enable_sahabat,
            "models_available": {
                "sahabat_ai": self.sahabat_ai is not None,
                "llama_scout": self.llama_scout.is_available()
            }
        }


# Test function
async def test_intelligent_router():
    """Test router with various queries"""

    print("\n" + "="*80)
    print("🧠 TESTING INTELLIGENT MODEL ROUTER")
    print("="*80 + "\n")

    # Initialize router
    router = IntelligentModelRouter(enable_sahabat=True)

    # Test queries
    test_cases = [
        {
            "messages": [
                {"role": "user", "content": "Saya mau buka usaha kopi di Bali. KBLI apa yang cocok?"}
            ],
            "expected_route": "SahabatAI",
            "expected_language": "id",
            "expected_priority": "naturalness"
        },
        {
            "messages": [
                {"role": "user", "content": "Menurut Pasal 31 Peraturan Pemerintah Nomor 31 Tahun 2013, apa saja persyaratan KITAS investor?"}
            ],
            "expected_route": "Llama Scout",
            "expected_language": "id",
            "expected_priority": "accuracy"
        },
        {
            "messages": [
                {"role": "user", "content": "Berapa lama proses KITAS?"}
            ],
            "expected_route": "SahabatAI",
            "expected_language": "id",
            "expected_priority": "naturalness"
        },
        {
            "messages": [
                {"role": "user", "content": "What is the difference between PT and PT PMA?"}
            ],
            "expected_route": "Llama Scout",
            "expected_language": "en",
            "expected_priority": "accuracy"
        }
    ]

    for i, test in enumerate(test_cases, 1):
        print(f"\n{'='*80}")
        print(f"Test Case {i}/{len(test_cases)}")
        print(f"{'='*80}")
        print(f"Query: {test['messages'][0]['content']}")
        print(f"Expected route: {test['expected_route']}")
        print(f"Expected language: {test['expected_language']}")
        print(f"Expected priority: {test['expected_priority']}")
        print()

        # Get response
        response = await router.route_query(test["messages"])

        print(f"\n✅ Response received from: {response['provider']}")
        print(f"Response preview: {response['text'][:200]}...")

    print("\n" + "="*80)
    print("✅ ROUTER TESTING COMPLETE")
    print("="*80)


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_intelligent_router())
