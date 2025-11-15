"""
Test suite for multilingual communication quality
Tests ZANTARA responses in English, Italian, and Indonesian (Bahasa Indonesia)

Focus: Fluidity, naturalness, cultural appropriateness, professional tone
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from llm.llama_scout_client import LlamaScoutClient


# Test queries in three languages
TEST_QUERIES = {
    "english": [
        {
            "query": "What's a KITAS and how long does it take?",
            "expected_tone": "professional_friendly",
            "expected_length": "short"
        },
        {
            "query": "I want to open a restaurant in Bali as a foreigner. What do I need?",
            "expected_tone": "professional_detailed",
            "expected_length": "medium"
        },
        {
            "query": "Hey, what's the difference between PT and PT PMA?",
            "expected_tone": "casual_friendly",
            "expected_length": "short"
        }
    ],
    "italian": [
        {
            "query": "Ciao! Quanto costa fare una PT PMA?",
            "expected_tone": "warm_professional",
            "expected_length": "short"
        },
        {
            "query": "Voglio trasferirmi a Bali per lavoro. Che visto mi serve?",
            "expected_tone": "professional_detailed",
            "expected_length": "medium"
        },
        {
            "query": "Mi spieghi come funziona il sistema fiscale indonesiano?",
            "expected_tone": "professional_detailed",
            "expected_length": "long"
        }
    ],
    "indonesian": [
        {
            "query": "Saya mau buka usaha kopi di Bali. KBLI apa yang cocok?",
            "expected_tone": "helpful_respectful",
            "expected_length": "medium"
        },
        {
            "query": "Berapa lama proses KITAS?",
            "expected_tone": "direct_friendly",
            "expected_length": "short"
        },
        {
            "query": "Apa bedanya PT dengan PT PMA? Saya orang asing mau berbisnis di Indonesia",
            "expected_tone": "professional_detailed",
            "expected_length": "medium"
        }
    ]
}


# Quality assessment criteria
QUALITY_CRITERIA = {
    "fluency": {
        "description": "Natural language flow, not robotic or mechanical",
        "weight": 0.3
    },
    "accuracy": {
        "description": "Correct information about visa, company, regulations",
        "weight": 0.25
    },
    "tone_appropriateness": {
        "description": "Matches expected tone (professional/casual/warm)",
        "weight": 0.25
    },
    "cultural_awareness": {
        "description": "Shows cultural intelligence and appropriate expressions",
        "weight": 0.2
    }
}


async def test_response_quality(client: LlamaScoutClient, language: str, test_case: dict) -> dict:
    """
    Test a single query and assess quality

    Returns:
        dict with response, scores, and analysis
    """
    query = test_case["query"]

    print(f"\n{'='*80}")
    print(f"Testing: {language.upper()}")
    print(f"Query: {query}")
    print(f"Expected tone: {test_case['expected_tone']}")
    print(f"{'='*80}")

    # Get response
    messages = [{"role": "user", "content": query}]

    try:
        result = await client.chat_async(
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )

        response_text = result["text"]
        model_used = result["model"]
        provider = result["provider"]

        print(f"\n📊 Model: {model_used} ({provider})")
        print(f"\n💬 Response:\n{response_text}\n")

        # Manual quality assessment (would ideally use LLM-as-judge here)
        print("\n📝 QUALITY ASSESSMENT:")
        print("Please manually assess this response on these criteria:")
        print("  1. Fluency (1-10): Natural language flow?")
        print("  2. Accuracy (1-10): Information correct?")
        print("  3. Tone Appropriateness (1-10): Matches expected tone?")
        print("  4. Cultural Awareness (1-10): Shows cultural intelligence?")

        # Calculate metrics
        response_length = len(response_text)
        word_count = len(response_text.split())

        print(f"\n📏 Metrics:")
        print(f"  - Length: {response_length} chars, {word_count} words")
        print(f"  - Expected: {test_case['expected_length']}")

        # Check for key indicators
        indicators = {
            "has_emoji": any(char in response_text for char in "😊🌟🎯💬🏢✨⚠️"),
            "has_contact": "WhatsApp" in response_text or "wa.me" in response_text,
            "has_citation": "Fonte:" in response_text or "Source:" in response_text,
            "uses_natural_language": not any(marker in response_text for marker in ["- ", "* ", "1.", "2."]),
        }

        print(f"\n🔍 Indicators:")
        for key, value in indicators.items():
            status = "✅" if value else "❌"
            print(f"  {status} {key.replace('_', ' ').title()}: {value}")

        return {
            "language": language,
            "query": query,
            "response": response_text,
            "model": model_used,
            "provider": provider,
            "metrics": {
                "length": response_length,
                "words": word_count
            },
            "indicators": indicators,
            "success": True
        }

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return {
            "language": language,
            "query": query,
            "error": str(e),
            "success": False
        }


async def run_multilingual_tests():
    """Run full multilingual test suite"""

    # Initialize client with new prompt
    prompt_path = Path(__file__).parent / "backend" / "prompts" / "zantara_v6_llama4_optimized.md"

    if prompt_path.exists():
        with open(prompt_path, 'r', encoding='utf-8') as f:
            optimized_prompt = f.read()
        print(f"✅ Loaded optimized prompt v6.0 from {prompt_path}")
    else:
        print("⚠️  Optimized prompt not found, using default")
        optimized_prompt = None

    # Initialize client
    client = LlamaScoutClient(
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY_LLAMA"),
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
    )

    if not client.is_available():
        print("❌ LlamaScoutClient not available - check API keys")
        return

    print(f"\n{'='*80}")
    print("ZANTARA v6.0 - MULTILINGUAL QUALITY TEST SUITE")
    print(f"{'='*80}")
    print(f"Testing: English, Italian, Indonesian (Bahasa Indonesia)")
    print(f"AI: LLAMA 4 Scout (primary) + Claude Haiku 4.5 (fallback)")
    print(f"Focus: Fluidity, naturalness, cultural appropriateness")
    print(f"{'='*80}\n")

    results = []

    # Test each language
    for language, test_cases in TEST_QUERIES.items():
        print(f"\n\n🌍 === TESTING {language.upper()} ===\n")

        for i, test_case in enumerate(test_cases, 1):
            print(f"\n[{language.upper()} Test {i}/{len(test_cases)}]")

            # Override system prompt if we have optimized version
            if optimized_prompt:
                # Inject optimized prompt for this test
                original_build = client._build_system_prompt
                client._build_system_prompt = lambda memory_context=None: optimized_prompt

            result = await test_response_quality(client, language, test_case)
            results.append(result)

            # Restore original method
            if optimized_prompt:
                client._build_system_prompt = original_build

            # Small delay between requests
            await asyncio.sleep(2)

    # Summary
    print(f"\n\n{'='*80}")
    print("TEST SUMMARY")
    print(f"{'='*80}")

    successful = [r for r in results if r.get("success")]
    failed = [r for r in results if not r.get("success")]

    print(f"\n✅ Successful: {len(successful)}/{len(results)}")
    print(f"❌ Failed: {len(failed)}/{len(results)}")

    # Model usage stats
    models_used = {}
    for r in successful:
        model = r.get("model", "unknown")
        models_used[model] = models_used.get(model, 0) + 1

    print(f"\n📊 Model Usage:")
    for model, count in models_used.items():
        print(f"  - {model}: {count} requests")

    # Client metrics
    print(f"\n💰 Performance Metrics:")
    metrics = client.get_metrics()
    for key, value in metrics.items():
        print(f"  - {key}: {value}")

    print(f"\n{'='*80}")
    print("MANUAL EVALUATION REQUIRED")
    print(f"{'='*80}")
    print("\nPlease review the responses above and assess:")
    print("1. Is the language natural and fluid?")
    print("2. Does it avoid robotic/mechanical phrasing?")
    print("3. Is the tone appropriate for each context?")
    print("4. Does it show cultural awareness?")
    print("5. Is the Indonesian (Bahasa Indonesia) fluent and idiomatic?")

    return results


if __name__ == "__main__":
    asyncio.run(run_multilingual_tests())
