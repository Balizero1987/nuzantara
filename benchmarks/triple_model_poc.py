#!/usr/bin/env python3
"""
ZANTARA POC: Triple Model Benchmark
Gemini 2.0 Flash vs Claude Haiku 4.5 vs Llama 4 Scout

Tests 100 real ZANTARA queries across 10 categories to empirically measure:
- Performance (TTFT, total time, streaming speed)
- Cost (input/output tokens, total USD)
- Quality (success rate, response accuracy)
"""

import os
import sys
import time
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# SDK imports
import anthropic
from openai import OpenAI

# API clients
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# OpenRouter clients (using different keys to distribute rate limits)
openrouter_gemini = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY_GEMINI")
)

openrouter_llama = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY_LLAMA")
)

# Model configurations
MODELS = {
    "claude-haiku-3.5": {
        "name": "Claude 3.5 Haiku",
        "provider": "anthropic",
        "model_id": "claude-3-5-haiku-20241022",
        "pricing": {"input": 1.0, "output": 5.0}  # per 1M tokens
    },
    "gemini-2.0-flash": {
        "name": "Gemini 2.0 Flash",
        "provider": "openrouter",
        "model_id": "google/gemini-2.0-flash-exp",  # No :free to avoid rate limits
        "pricing": {"input": 0.075, "output": 0.30}  # per 1M tokens
    },
    "llama-4-scout": {
        "name": "Llama 4 Scout",
        "provider": "openrouter",
        "model_id": "meta-llama/llama-4-scout",
        "pricing": {"input": 0.20, "output": 0.20}  # per 1M tokens
    }
}


@dataclass
class BenchmarkResult:
    """Single query benchmark result"""
    model: str
    query: str
    category: str
    success: bool = False
    response: str = ""
    ttft: float = 0.0  # Time to first token (seconds)
    total_time: float = 0.0  # Total response time
    tokens_input: int = 0
    tokens_output: int = 0
    cost: float = 0.0
    error: str = ""


# QUERY DATASET: 100 real ZANTARA queries across 10 categories
QUERY_DATASET = {
    "kbli_lookup": [
        "What KBLI code for software development company?",
        "KBLI category for restaurant and catering business",
        "How to find KBLI code for e-commerce platform?",
        "KBLI classification for digital marketing agency",
        "What is KBLI for real estate investment company?",
        "KBLI code for IT consulting services",
        "How to determine KBLI for online education platform?",
        "KBLI for renewable energy company in Indonesia",
        "What KBLI code for healthcare clinic?",
        "KBLI classification for fintech startup"
    ],
    "pt_pma_setup": [
        "How to establish PT PMA for foreign investors?",
        "Minimum capital requirement for PT PMA in Indonesia",
        "What documents needed to register PT PMA?",
        "Can 100% foreign ownership PT PMA operate in Indonesia?",
        "PT PMA registration timeline and process",
        "Difference between PT PMA and PT local company",
        "What sectors allow foreign investment in Indonesia?",
        "PT PMA annual compliance requirements",
        "How to change PT PMA shareholding structure?",
        "Tax benefits for PT PMA in Indonesia"
    ],
    "visa_immigration": [
        "How to apply for KITAS work permit Indonesia?",
        "Difference between KITAS and KITAP visa",
        "Indonesia visa requirements for digital nomads",
        "How long does KITAS application take?",
        "Can KITAS holder bring family to Indonesia?",
        "How to extend KITAS work permit?",
        "What is EPO visa for business in Indonesia?",
        "Indonesia visa on arrival countries list",
        "Requirements for Indonesian permanent residency",
        "How to convert tourist visa to work permit?"
    ],
    "tax_compliance": [
        "Corporate tax rate Indonesia 2025",
        "How to register NPWP for foreign company?",
        "VAT rate in Indonesia for services",
        "Tax incentives for startups in Indonesia",
        "Withholding tax on dividends Indonesia",
        "How to file annual corporate tax return?",
        "Tax treaty benefits Indonesia Singapore",
        "Import duty rates Indonesia",
        "Tax obligations for PT PMA",
        "How to claim VAT refund Indonesia?"
    ],
    "legal_compliance": [
        "What is OSS system requirements Indonesia?",
        "How to obtain NIB business license?",
        "Indonesia labor law overtime regulations",
        "Data protection law Indonesia (PDP)",
        "Business license requirements for e-commerce",
        "Indonesia anti-corruption compliance",
        "How to register trademark in Indonesia?",
        "Environmental permit requirements Indonesia",
        "Consumer protection law Indonesia",
        "Contract law enforcement in Indonesia"
    ],
    "property_investment": [
        "Can foreigners buy land in Bali?",
        "Hak Pakai vs Hak Milik property rights",
        "How to buy property in Indonesia as foreigner?",
        "Indonesia property tax rates",
        "Can PT PMA own land in Indonesia?",
        "Leasehold vs freehold property Indonesia",
        "Property investment restrictions for foreigners",
        "How to verify property ownership Indonesia?",
        "Real estate transaction costs Indonesia",
        "Foreign investment in Indonesian real estate"
    ],
    "banking_finance": [
        "Can PT PMA have foreign bank account?",
        "How to open corporate bank account Indonesia?",
        "Bank Indonesia foreign exchange regulations",
        "Repatriation of profits from Indonesia",
        "Indonesia banking system for expats",
        "How to transfer money out of Indonesia?",
        "Corporate credit facilities for PT PMA",
        "Indonesia capital controls regulations",
        "Foreign currency account restrictions",
        "Banking compliance for foreign companies"
    ],
    "employment_hr": [
        "Minimum wage Indonesia 2025",
        "Severance pay calculation Indonesia",
        "Indonesia employment contract requirements",
        "How to hire foreign workers in Indonesia?",
        "BPJS health insurance registration",
        "Indonesia annual leave entitlement",
        "Probation period rules Indonesia",
        "Employee tax withholding Indonesia",
        "Indonesia labor law termination process",
        "Manpower regulations for PT PMA"
    ],
    "quick_facts": [
        "Indonesia GDP growth 2025",
        "Population of Jakarta",
        "Indonesia currency exchange rate",
        "What is the capital of Indonesia?",
        "Indonesia official language",
        "Time zone in Bali Indonesia",
        "Indonesia public holidays 2025",
        "Largest cities in Indonesia",
        "Indonesia economic sectors",
        "ASEAN member countries"
    ],
    "conversational": [
        "Thank you for the information",
        "Can you explain that in simpler terms?",
        "What else should I know about this?",
        "How does this compare to other countries?",
        "That's helpful, thanks",
        "I don't understand, can you clarify?",
        "What are the next steps?",
        "Is there a faster way to do this?",
        "How much does this typically cost?",
        "Can you recommend a service provider?"
    ]
}


async def test_haiku(query: str, category: str) -> BenchmarkResult:
    """Test Claude 3.5 Haiku using native Anthropic SDK"""
    result = BenchmarkResult("claude-haiku-3.5", query, category)

    try:
        start_time = time.time()
        first_token_time = None
        full_response = ""

        with anthropic_client.messages.stream(
            model=MODELS["claude-haiku-3.5"]["model_id"],
            max_tokens=1024,
            messages=[{"role": "user", "content": query}],
            temperature=0.7
        ) as stream:
            for text in stream.text_stream:
                if first_token_time is None:
                    first_token_time = time.time()
                    result.ttft = first_token_time - start_time
                full_response += text

        end_time = time.time()
        result.total_time = end_time - start_time
        result.response = full_response

        # Get token usage from final message
        message = stream.get_final_message()
        result.tokens_input = message.usage.input_tokens
        result.tokens_output = message.usage.output_tokens

        # Calculate cost
        pricing = MODELS["claude-haiku-3.5"]["pricing"]
        result.cost = (result.tokens_input / 1_000_000 * pricing["input"]) + \
                     (result.tokens_output / 1_000_000 * pricing["output"])

        result.success = True

    except Exception as e:
        result.error = str(e)
        result.success = False

    return result


async def test_gemini(query: str, category: str) -> BenchmarkResult:
    """Test Gemini 2.0 Flash via OpenRouter"""
    result = BenchmarkResult("gemini-2.0-flash", query, category)
    model_config = MODELS["gemini-2.0-flash"]

    try:
        start_time = time.time()
        first_token_time = None
        full_response = ""

        stream = openrouter_gemini.chat.completions.create(
            model=model_config["model_id"],
            messages=[{"role": "user", "content": query}],
            max_tokens=1024,
            temperature=0.7,
            stream=True
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                if first_token_time is None:
                    first_token_time = time.time()
                    result.ttft = first_token_time - start_time
                full_response += chunk.choices[0].delta.content

        end_time = time.time()
        result.total_time = end_time - start_time
        result.response = full_response

        # Estimate tokens
        result.tokens_input = len(query.split()) * 1.3
        result.tokens_output = len(full_response.split()) * 1.3

        # Calculate cost
        pricing = model_config["pricing"]
        result.cost = (result.tokens_input / 1_000_000 * pricing["input"]) + \
                     (result.tokens_output / 1_000_000 * pricing["output"])

        result.success = True

    except Exception as e:
        result.error = str(e)
        result.success = False

    return result


async def test_llama(query: str, category: str) -> BenchmarkResult:
    """Test Llama 4 Scout via OpenRouter"""
    result = BenchmarkResult("llama-4-scout", query, category)
    model_config = MODELS["llama-4-scout"]

    try:
        start_time = time.time()
        first_token_time = None
        full_response = ""

        stream = openrouter_llama.chat.completions.create(
            model=model_config["model_id"],
            messages=[{"role": "user", "content": query}],
            max_tokens=1024,
            temperature=0.7,
            stream=True
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                if first_token_time is None:
                    first_token_time = time.time()
                    result.ttft = first_token_time - start_time
                full_response += chunk.choices[0].delta.content

        end_time = time.time()
        result.total_time = end_time - start_time
        result.response = full_response

        # Estimate tokens (OpenRouter doesn't always return usage)
        result.tokens_input = len(query.split()) * 1.3  # rough estimate
        result.tokens_output = len(full_response.split()) * 1.3

        # Calculate cost
        pricing = model_config["pricing"]
        result.cost = (result.tokens_input / 1_000_000 * pricing["input"]) + \
                     (result.tokens_output / 1_000_000 * pricing["output"])

        result.success = True

    except Exception as e:
        result.error = str(e)
        result.success = False

    return result


async def run_benchmark() -> Dict[str, Any]:
    """Run benchmark on all 100 queries with all 3 models"""

    print("🚀 ZANTARA TRIPLE MODEL POC BENCHMARK")
    print("=" * 80)
    print(f"Models: {len(MODELS)}")
    print(f"Categories: {len(QUERY_DATASET)}")
    print(f"Total queries: {sum(len(queries) for queries in QUERY_DATASET.values())}")
    print("=" * 80)
    print()

    all_results = []
    query_counter = 0
    total_queries = sum(len(queries) for queries in QUERY_DATASET.values())

    for category, queries in QUERY_DATASET.items():
        print(f"📊 Testing category: {category} ({len(queries)} queries)")

        for query in queries:
            query_counter += 1
            print(f"  [{query_counter}/{total_queries}] {query[:60]}...")

            # Test all three models
            haiku_result = await test_haiku(query, category)
            status = "✅" if haiku_result.success else "❌"
            print(f"    {status} 🔵 Haiku: {haiku_result.ttft*1000:.0f}ms TTFT, {haiku_result.total_time:.2f}s total, ${haiku_result.cost:.5f}")

            gemini_result = await test_gemini(query, category)
            status = "✅" if gemini_result.success else "❌"
            if not gemini_result.success:
                print(f"    {status} 🟢 Gemini: ERROR - {gemini_result.error[:60]}")
            else:
                print(f"    {status} 🟢 Gemini: {gemini_result.ttft*1000:.0f}ms TTFT, {gemini_result.total_time:.2f}s total, ${gemini_result.cost:.5f}")

            llama_result = await test_llama(query, category)
            status = "✅" if llama_result.success else "❌"
            if not llama_result.success:
                print(f"    {status} 🟠 Llama: ERROR - {llama_result.error[:60]}")
            else:
                print(f"    {status} 🟠 Llama: {llama_result.ttft*1000:.0f}ms TTFT, {llama_result.total_time:.2f}s total, ${llama_result.cost:.5f}")

            all_results.extend([haiku_result, gemini_result, llama_result])

            # Rate limiting
            await asyncio.sleep(0.5)

        print()

    # Calculate statistics
    stats = calculate_statistics(all_results)

    # Print summary
    print_summary(stats)

    # Save results
    output_file = f"benchmark_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    save_results(stats, all_results, output_file)

    return stats


def calculate_statistics(results: List[BenchmarkResult]) -> Dict[str, Any]:
    """Calculate overall and per-model statistics"""

    stats = {
        "timestamp": datetime.now().isoformat(),
        "total_queries": len(results) // 3,  # 3 models per query
        "models": {}
    }

    for model_key in MODELS.keys():
        model_results = [r for r in results if r.model == model_key]
        successful = [r for r in model_results if r.success]

        if successful:
            stats["models"][model_key] = {
                "name": MODELS[model_key]["name"],
                "total_tested": len(model_results),
                "successful": len(successful),
                "success_rate": len(successful) / len(model_results) * 100,
                "avg_ttft_ms": sum(r.ttft for r in successful) / len(successful) * 1000,
                "avg_total_time_ms": sum(r.total_time for r in successful) / len(successful) * 1000,
                "avg_response_length": sum(len(r.response) for r in successful) / len(successful),
                "total_cost": sum(r.cost for r in successful),
                "avg_cost_per_query": sum(r.cost for r in successful) / len(successful),
                "errors": len(model_results) - len(successful)
            }

    return stats


def print_summary(stats: Dict[str, Any]):
    """Print benchmark summary to console"""

    print()
    print("📊 TRIPLE MODEL BENCHMARK SUMMARY")
    print("=" * 80)
    print()

    for model_key, model_stats in stats["models"].items():
        icon = "🔵" if "haiku" in model_key else "🟢" if "gemini" in model_key else "🟠"
        print(f"{icon} {model_stats['name'].upper()}:")
        print(f"   Avg TTFT: {model_stats['avg_ttft_ms']:.0f}ms")
        print(f"   Avg Total Time: {model_stats['avg_total_time_ms']:.0f}ms")
        print(f"   Avg Response Length: {model_stats['avg_response_length']:.0f} chars")
        print(f"   Total Cost: ${model_stats['total_cost']:.4f}")
        print(f"   Success Rate: {model_stats['success_rate']:.1f}%")
        print()

    # Comparison
    haiku = stats["models"]["claude-haiku-3.5"]
    gemini = stats["models"]["gemini-2.0-flash"]
    llama = stats["models"]["llama-4-scout"]

    print("⚡ COST COMPARISON (100 queries):")
    print(f"   Haiku: ${haiku['total_cost']:.4f}")
    print(f"   Gemini: ${gemini['total_cost']:.4f} ({((haiku['total_cost']-gemini['total_cost'])/haiku['total_cost']*100):.1f}% cheaper)")
    print(f"   Llama: ${llama['total_cost']:.4f} ({((haiku['total_cost']-llama['total_cost'])/haiku['total_cost']*100):.1f}% cheaper)")
    print()

    print("⚡ SPEED COMPARISON:")
    print(f"   TTFT: Haiku {haiku['avg_ttft_ms']:.0f}ms | Gemini {gemini['avg_ttft_ms']:.0f}ms | Llama {llama['avg_ttft_ms']:.0f}ms")
    print(f"   Total: Haiku {haiku['avg_total_time_ms']:.0f}ms | Gemini {gemini['avg_total_time_ms']:.0f}ms | Llama {llama['avg_total_time_ms']:.0f}ms")
    print()


def save_results(stats: Dict[str, Any], results: List[BenchmarkResult], filename: str):
    """Save results to JSON file"""

    output = {
        "overall_stats": stats,
        "detailed_results": [asdict(r) for r in results]
    }

    with open(filename, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"📁 Results saved to: {filename}")
    print()


if __name__ == "__main__":
    # Check API keys
    required_keys = ["ANTHROPIC_API_KEY", "OPENROUTER_API_KEY_GEMINI", "OPENROUTER_API_KEY_LLAMA"]
    missing = [k for k in required_keys if not os.getenv(k)]

    if missing:
        print(f"❌ Missing API keys: {', '.join(missing)}")
        print("Please configure .env file")
        sys.exit(1)

    print("✅ All API keys found")
    print()

    # Run benchmark
    asyncio.run(run_benchmark())

    print("✅ Benchmark completed!")
    print()
