#!/usr/bin/env python3
"""
Claude Models Comparison Test
Compares Claude 3.5 Haiku, 4.5 Haiku, and 4.5 Sonnet

Test scenarios:
1. Simple greeting (Haiku territory)
2. Casual question (Haiku territory)
3. Business question (Sonnet territory)
4. Complex legal query (Sonnet territory)

Metrics:
- Response quality (subjective score 1-10)
- Response time (ms)
- Token usage (input/output)
- Cost per response ($)
"""

import os
import asyncio
import time
import json
from anthropic import AsyncAnthropic
from datetime import datetime

# API Key from environment
API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not API_KEY:
    print("❌ Error: ANTHROPIC_API_KEY not set")
    exit(1)

# Models to test
MODELS = {
    "haiku_3.5": "claude-3-5-haiku-20241022",
    "haiku_4.5": "claude-haiku-4-5-20251001",
    "sonnet_4.5": "claude-sonnet-4-20250514"
}

# Pricing (per 1M tokens)
PRICING = {
    "haiku_3.5": {"input": 0.80, "output": 4.00},
    "haiku_4.5": {"input": 1.00, "output": 5.00},
    "sonnet_4.5": {"input": 3.00, "output": 15.00}
}

# Test prompts
TEST_PROMPTS = [
    {
        "category": "greeting",
        "prompt": "Ciao!",
        "expected_length": "2-4 sentences",
        "best_for": "haiku"
    },
    {
        "category": "casual",
        "prompt": "Come stai? Cosa puoi fare per me?",
        "expected_length": "3-5 sentences",
        "best_for": "haiku"
    },
    {
        "category": "business_simple",
        "prompt": "Quali documenti servono per il KITAS?",
        "expected_length": "4-6 sentences",
        "best_for": "both"
    },
    {
        "category": "business_complex",
        "prompt": "Spiegami i requisiti di capitale per una PT PMA nel settore consulting, inclusi i codici KBLI applicabili e le eccezioni OSS RBA.",
        "expected_length": "6-10 sentences",
        "best_for": "sonnet"
    }
]

# System prompt (same for all)
SYSTEM_PROMPT = """You are ZANTARA, the friendly AI assistant for Bali Zero.

🌟 PERSONALITY:
- Be warm, friendly, and conversational like a good friend
- Use natural language, not robotic responses
- Show personality and be genuinely helpful

💬 CONVERSATION STYLE:
- For casual questions: respond like a knowledgeable friend
- For business questions: be professional but still friendly
- Use the user's language naturally (Italian in this case)

🏢 BALI ZERO KNOWLEDGE:
- You know everything about visas, KITAS, PT PMA, taxes, real estate in Indonesia
- Always helpful, never pushy
- End with friendly contact info when appropriate: "Need more help? WhatsApp +62 859 0436 9574 or info@balizero.com"

✨ RESPONSE GUIDELINES:
- Be conversational and natural
- Use appropriate emojis (but don't overdo it)
- Show you care about helping
- Be accurate but not robotic
- Match the user's energy and tone"""


async def test_model(model_key: str, model_id: str, prompt: str, category: str):
    """Test a single model with a prompt"""
    client = AsyncAnthropic(api_key=API_KEY)

    print(f"\n🧪 Testing {model_key} on '{category}'...")
    print(f"   Model: {model_id}")
    print(f"   Prompt: {prompt[:50]}...")

    # Determine max_tokens based on model
    max_tokens = 50 if "haiku" in model_key else 300

    # Start timer
    start_time = time.time()

    try:
        response = await client.messages.create(
            model=model_id,
            max_tokens=max_tokens,
            temperature=0.7 if "haiku" in model_key else 0.3,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # End timer
        elapsed_ms = (time.time() - start_time) * 1000

        # Extract data
        text = response.content[0].text
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens

        # Calculate cost
        pricing = PRICING[model_key]
        cost = (input_tokens * pricing["input"] / 1_000_000) + \
               (output_tokens * pricing["output"] / 1_000_000)

        result = {
            "model_key": model_key,
            "model_id": model_id,
            "category": category,
            "prompt": prompt,
            "response": text,
            "response_length_chars": len(text),
            "response_length_words": len(text.split()),
            "time_ms": round(elapsed_ms, 2),
            "tokens": {
                "input": input_tokens,
                "output": output_tokens,
                "total": input_tokens + output_tokens
            },
            "cost_usd": round(cost, 6),
            "cost_per_1k_output": round((pricing["output"] / 1000), 4)
        }

        print(f"   ✅ Response: {len(text)} chars, {output_tokens} tokens")
        print(f"   ⏱️  Time: {elapsed_ms:.0f}ms")
        print(f"   💰 Cost: ${cost:.6f}")

        return result

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return {
            "model_key": model_key,
            "model_id": model_id,
            "category": category,
            "error": str(e)
        }


async def run_all_tests():
    """Run all tests and generate comparison"""
    print("=" * 80)
    print("🧪 CLAUDE MODELS COMPARISON TEST")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    print("\n📋 Models to test:")
    for key, model_id in MODELS.items():
        pricing = PRICING[key]
        print(f"   • {key:15} {model_id:35} ${pricing['input']}/{pricing['output']} per 1M tokens")

    print(f"\n📋 Test scenarios: {len(TEST_PROMPTS)}")
    for i, test in enumerate(TEST_PROMPTS, 1):
        print(f"   {i}. {test['category']:20} (best for: {test['best_for']})")

    # Run all tests
    results = []

    for test in TEST_PROMPTS:
        print(f"\n{'=' * 80}")
        print(f"📝 TEST: {test['category'].upper()}")
        print(f"{'=' * 80}")

        for model_key, model_id in MODELS.items():
            result = await test_model(model_key, model_id, test["prompt"], test["category"])
            results.append(result)

            # Small delay between requests
            await asyncio.sleep(1)

    # Generate comparison report
    print("\n" + "=" * 80)
    print("📊 COMPARISON REPORT")
    print("=" * 80)

    # Group by category
    by_category = {}
    for result in results:
        if "error" in result:
            continue
        cat = result["category"]
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(result)

    # Print comparison for each category
    for category, cat_results in by_category.items():
        print(f"\n{'─' * 80}")
        print(f"📂 {category.upper()}")
        print(f"{'─' * 80}")

        # Sort by time
        cat_results.sort(key=lambda x: x["time_ms"])

        for i, r in enumerate(cat_results, 1):
            print(f"\n{i}. {r['model_key']:15} ({r['model_id']})")
            print(f"   Response: {r['response'][:100]}...")
            print(f"   Length: {r['response_length_words']} words, {r['response_length_chars']} chars")
            print(f"   Speed: {r['time_ms']:.0f}ms")
            print(f"   Tokens: {r['tokens']['input']} in + {r['tokens']['output']} out = {r['tokens']['total']} total")
            print(f"   Cost: ${r['cost_usd']:.6f}")

    # Overall statistics
    print("\n" + "=" * 80)
    print("📈 OVERALL STATISTICS")
    print("=" * 80)

    by_model = {}
    for result in results:
        if "error" in result:
            continue
        key = result["model_key"]
        if key not in by_model:
            by_model[key] = {
                "times": [],
                "costs": [],
                "output_tokens": []
            }
        by_model[key]["times"].append(result["time_ms"])
        by_model[key]["costs"].append(result["cost_usd"])
        by_model[key]["output_tokens"].append(result["tokens"]["output"])

    print("\n📊 Average Performance:")
    print(f"{'Model':<15} {'Avg Time':>12} {'Avg Cost':>12} {'Avg Output Tokens':>18}")
    print(f"{'-' * 60}")

    for model_key in MODELS.keys():
        if model_key not in by_model:
            continue
        stats = by_model[model_key]
        avg_time = sum(stats["times"]) / len(stats["times"])
        avg_cost = sum(stats["costs"]) / len(stats["costs"])
        avg_tokens = sum(stats["output_tokens"]) / len(stats["output_tokens"])

        print(f"{model_key:<15} {avg_time:>10.0f}ms {avg_cost:>12.6f}$ {avg_tokens:>18.1f}")

    # Recommendations
    print("\n" + "=" * 80)
    print("💡 RECOMMENDATIONS")
    print("=" * 80)

    print("\n🎯 Best for Greetings/Casual:")
    greeting_results = by_category.get("greeting", []) + by_category.get("casual", [])
    if greeting_results:
        best_greeting = min(greeting_results, key=lambda x: x["cost_usd"])
        print(f"   {best_greeting['model_key']} - Cheapest at ${best_greeting['cost_usd']:.6f} per response")

    print("\n🎯 Best for Business Questions:")
    business_results = by_category.get("business_simple", []) + by_category.get("business_complex", [])
    if business_results:
        # For business, prioritize quality (more tokens) over cost
        best_business = max(business_results, key=lambda x: x["response_length_chars"])
        print(f"   {best_business['model_key']} - Most detailed ({best_business['response_length_chars']} chars)")

    print("\n💰 Cost Comparison (if processing 1M greeting requests/month):")
    for model_key in MODELS.keys():
        if model_key not in by_model:
            continue
        stats = by_model[model_key]
        avg_cost = sum(stats["costs"]) / len(stats["costs"])
        monthly_cost = avg_cost * 1_000_000
        print(f"   {model_key:<15} ${monthly_cost:>10,.2f}/month")

    # Save full results to JSON
    output_file = "/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/claude-models-test-results.json"
    with open(output_file, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "models": MODELS,
            "pricing": PRICING,
            "results": results,
            "by_category": by_category,
            "statistics": by_model
        }, f, indent=2)

    print(f"\n💾 Full results saved to: {output_file}")
    print("\n✅ Test complete!")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
