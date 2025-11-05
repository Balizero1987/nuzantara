#!/usr/bin/env python3
"""
ZANTARA POC Benchmark: Gemini 2.0 Flash vs Claude Haiku 4.5
Tests 100 real queries across different categories
"""

import os
import time
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any
import anthropic
import google.generativeai as genai

# Configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")  # Set in .env

# Initialize clients
anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
genai.configure(api_key=GOOGLE_API_KEY)

# 100 Real ZANTARA Queries (Categorized)
QUERY_DATASET = {
    "kbli_lookup": [
        "What KBLI code for software development company?",
        "KBLI category for restaurant and catering business",
        "What is KBLI 62010 for IT consulting?",
        "Foreign ownership limit for KBLI 47911 e-commerce",
        "KBLI code for property management services",
        "Risk classification for KBLI 46692 wholesale trade",
        "What KBLI for digital marketing agency?",
        "KBLI 58290 for software publishing requirements",
        "What business activities under KBLI category J?",
        "KBLI for manufacturing electronic components",
    ],

    "pt_pma_setup": [
        "How to establish PT PMA for foreign investors?",
        "Minimum capital requirement for PT PMA in Indonesia",
        "What documents needed for PT PMA application?",
        "Timeline for PT PMA company registration process",
        "Can 100% foreign ownership for software company?",
        "PT PMA vs PT PMDN differences and requirements",
        "OSS system requirements for PT PMA registration",
        "NIB (Nomor Induk Berusaha) application process",
        "What is investment realization reporting for PT PMA?",
        "Tax implications for PT PMA foreign shareholders",
    ],

    "visa_immigration": [
        "How to apply for Indonesia work permit KITAS?",
        "Requirements for Indonesia business visa application",
        "Can I convert tourist visa to work visa in Indonesia?",
        "What is IMTA (Izin Mempekerjakan Tenaga Kerja Asing)?",
        "KITAP (permanent residence permit) eligibility requirements",
        "How long does KITAS processing take?",
        "Sponsorship letter requirements for work visa",
        "Can digital nomads get visa in Indonesia?",
        "What is TA.01 recommendation letter for work permit?",
        "Indonesia retirement visa requirements for foreigners",
    ],

    "tax_compliance": [
        "Corporate income tax rate in Indonesia 2025",
        "What is NPWP and how to obtain it?",
        "VAT (PPN) registration requirements for PT PMA",
        "Tax incentives for investment in Indonesia",
        "Transfer pricing documentation requirements",
        "What is tax treaty between Indonesia and Singapore?",
        "Withholding tax rates for foreign services",
        "Annual tax reporting deadlines for PT PMA",
        "Can foreign company claim tax deduction in Indonesia?",
        "What is tax amnesty program for foreign investors?",
    ],

    "legal_compliance": [
        "What is OSS system (Online Single Submission)?",
        "NIB vs business license differences in Indonesia",
        "Environmental permit (AMDAL) requirements",
        "What is Halal certification requirement for food business?",
        "Labor law requirements for hiring employees in Indonesia",
        "How to register trademark in Indonesia (DJKI)?",
        "What is BPJS Ketenagakerjaan mandatory insurance?",
        "Severance pay calculation for employee termination",
        "What is collective labor agreement (PKB) requirements?",
        "Consumer protection law compliance for e-commerce",
    ],

    "property_investment": [
        "Can foreigners buy property in Indonesia?",
        "What is Hak Pakai vs Hak Milik for property ownership?",
        "Foreign property ownership restrictions in Bali",
        "How to purchase villa in Indonesia as foreigner?",
        "Property transfer tax (BPHTB) rates in Indonesia",
        "Can PT PMA own land with Hak Guna Bangunan (HGB)?",
        "What is nominee structure for property ownership?",
        "Leasehold vs freehold property in Indonesia",
        "Capital gains tax on property sale by foreigner",
        "What is IMB (building permit) requirements?",
    ],

    "banking_finance": [
        "Can foreigners open bank account in Indonesia?",
        "What is KITAS requirement for bank account opening?",
        "Foreign currency transaction regulations (BI)",
        "How to transfer money from Indonesia to overseas?",
        "What is Bank Indonesia regulations for foreign investment?",
        "Can PT PMA have foreign currency bank account?",
        "Mandatory capital repatriation for PT PMA",
        "What is reporting requirement for foreign loans?",
        "Credit rating requirement for business loan",
        "What is payment gateway license for fintech?",
    ],

    "employment_hr": [
        "Minimum wage in Indonesia by province 2025",
        "What is BPJS Kesehatan (health insurance) contribution?",
        "Employee contract requirements under Indonesian labor law",
        "How many days annual leave required by law?",
        "What is THR (Tunjangan Hari Raya) bonus calculation?",
        "Probation period maximum duration in Indonesia",
        "Overtime pay calculation formula Indonesia",
        "Employee resignation notice period requirement",
        "What is outsourcing regulations in Indonesia?",
        "Foreign worker quota (10% rule) for PT PMA",
    ],

    "quick_facts": [
        "Indonesia population 2025",
        "What is capital city of Indonesia?",
        "Indonesia GDP growth rate 2025",
        "What currency used in Indonesia?",
        "Time zone in Jakarta Indonesia",
        "Indonesia public holidays 2025 list",
        "What language spoken in Indonesia?",
        "Indonesia country code for phone number",
        "What is Indonesia stock exchange (IDX)?",
        "ASEAN membership countries list",
    ],

    "conversational": [
        "Hello, I need help with business setup",
        "Thank you for the information",
        "Can you explain that in simpler terms?",
        "What are my options for this situation?",
        "I'm confused about the requirements",
        "Could you give me an example?",
        "What happens if I don't comply?",
        "How long will this process take?",
        "What are the costs involved?",
        "Is there an easier alternative?",
    ]
}

class BenchmarkResult:
    def __init__(self, model: str, query: str, category: str):
        self.model = model
        self.query = query
        self.category = category
        self.ttft = 0.0  # Time to first token
        self.total_time = 0.0
        self.response = ""
        self.tokens_input = 0
        self.tokens_output = 0
        self.cost = 0.0
        self.error = None

    def to_dict(self) -> Dict:
        return {
            "model": self.model,
            "query": self.query,
            "category": self.category,
            "ttft_ms": round(self.ttft * 1000, 2),
            "total_time_ms": round(self.total_time * 1000, 2),
            "response_preview": self.response[:200] + "..." if len(self.response) > 200 else self.response,
            "response_length": len(self.response),
            "tokens_input": self.tokens_input,
            "tokens_output": self.tokens_output,
            "cost_usd": round(self.cost, 6),
            "error": self.error
        }

async def test_haiku(query: str, category: str) -> BenchmarkResult:
    """Test Claude Haiku 4.5"""
    result = BenchmarkResult("claude-haiku-4.5", query, category)

    try:
        start_time = time.time()
        first_token_time = None
        full_response = ""

        with anthropic_client.messages.stream(
            model="claude-haiku-4.5-20250116",
            max_tokens=1024,
            messages=[{"role": "user", "content": query}]
        ) as stream:
            for text in stream.text_stream:
                if first_token_time is None:
                    first_token_time = time.time()
                    result.ttft = first_token_time - start_time
                full_response += text

        end_time = time.time()
        result.total_time = end_time - start_time
        result.response = full_response

        # Get usage from final message
        final_message = stream.get_final_message()
        result.tokens_input = final_message.usage.input_tokens
        result.tokens_output = final_message.usage.output_tokens

        # Cost calculation (Haiku 4.5: $1/M input, $5/M output)
        result.cost = (result.tokens_input / 1_000_000 * 1.0) + (result.tokens_output / 1_000_000 * 5.0)

    except Exception as e:
        result.error = str(e)

    return result

async def test_gemini(query: str, category: str) -> BenchmarkResult:
    """Test Gemini 2.0 Flash"""
    result = BenchmarkResult("gemini-2.0-flash", query, category)

    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        start_time = time.time()
        first_token_time = None
        full_response = ""

        response = model.generate_content(
            query,
            stream=True,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=1024,
            )
        )

        for chunk in response:
            if chunk.text:
                if first_token_time is None:
                    first_token_time = time.time()
                    result.ttft = first_token_time - start_time
                full_response += chunk.text

        end_time = time.time()
        result.total_time = end_time - start_time
        result.response = full_response

        # Token counting (approximate)
        result.tokens_input = len(query.split()) * 1.3  # Rough estimate
        result.tokens_output = len(full_response.split()) * 1.3

        # Cost calculation (Gemini 2.0 Flash: $0.075/M input, $0.30/M output)
        result.cost = (result.tokens_input / 1_000_000 * 0.075) + (result.tokens_output / 1_000_000 * 0.30)

    except Exception as e:
        result.error = str(e)

    return result

async def run_benchmark() -> Dict[str, Any]:
    """Run complete benchmark suite"""
    print("🚀 ZANTARA POC BENCHMARK: Gemini 2.0 Flash vs Claude Haiku 4.5")
    print("=" * 80)

    all_results = []
    categories_stats = {}

    total_queries = sum(len(queries) for queries in QUERY_DATASET.values())
    current = 0

    for category, queries in QUERY_DATASET.items():
        print(f"\n📊 Testing category: {category} ({len(queries)} queries)")
        category_results = []

        for query in queries:
            current += 1
            print(f"  [{current}/{total_queries}] Testing: {query[:50]}...")

            # Test both models
            haiku_result = await test_haiku(query, category)
            gemini_result = await test_gemini(query, category)

            category_results.extend([haiku_result, gemini_result])
            all_results.extend([haiku_result, gemini_result])

            # Brief pause to avoid rate limits
            await asyncio.sleep(0.5)

        # Calculate category stats
        haiku_category = [r for r in category_results if r.model == "claude-haiku-4.5" and not r.error]
        gemini_category = [r for r in category_results if r.model == "gemini-2.0-flash" and not r.error]

        categories_stats[category] = {
            "haiku": {
                "avg_ttft": sum(r.ttft for r in haiku_category) / len(haiku_category) if haiku_category else 0,
                "avg_total_time": sum(r.total_time for r in haiku_category) / len(haiku_category) if haiku_category else 0,
                "avg_cost": sum(r.cost for r in haiku_category) / len(haiku_category) if haiku_category else 0,
                "errors": sum(1 for r in category_results if r.model == "claude-haiku-4.5" and r.error)
            },
            "gemini": {
                "avg_ttft": sum(r.ttft for r in gemini_category) / len(gemini_category) if gemini_category else 0,
                "avg_total_time": sum(r.total_time for r in gemini_category) / len(gemini_category) if gemini_category else 0,
                "avg_cost": sum(r.cost for r in gemini_category) / len(gemini_category) if gemini_category else 0,
                "errors": sum(1 for r in category_results if r.model == "gemini-2.0-flash" and r.error)
            }
        }

    # Overall statistics
    haiku_results = [r for r in all_results if r.model == "claude-haiku-4.5" and not r.error]
    gemini_results = [r for r in all_results if r.model == "gemini-2.0-flash" and not r.error]

    overall_stats = {
        "total_queries": total_queries,
        "haiku": {
            "avg_ttft_ms": round(sum(r.ttft for r in haiku_results) / len(haiku_results) * 1000, 2) if haiku_results else 0,
            "avg_total_time_ms": round(sum(r.total_time for r in haiku_results) / len(haiku_results) * 1000, 2) if haiku_results else 0,
            "avg_response_length": round(sum(len(r.response) for r in haiku_results) / len(haiku_results), 0) if haiku_results else 0,
            "total_cost": round(sum(r.cost for r in haiku_results), 4),
            "errors": sum(1 for r in all_results if r.model == "claude-haiku-4.5" and r.error),
            "success_rate": round(len(haiku_results) / total_queries * 100, 2)
        },
        "gemini": {
            "avg_ttft_ms": round(sum(r.ttft for r in gemini_results) / len(gemini_results) * 1000, 2) if gemini_results else 0,
            "avg_total_time_ms": round(sum(r.total_time for r in gemini_results) / len(gemini_results) * 1000, 2) if gemini_results else 0,
            "avg_response_length": round(sum(len(r.response) for r in gemini_results) / len(gemini_results), 0) if gemini_results else 0,
            "total_cost": round(sum(r.cost for r in gemini_results), 4),
            "errors": sum(1 for r in all_results if r.model == "gemini-2.0-flash" and r.error),
            "success_rate": round(len(gemini_results) / total_queries * 100, 2)
        }
    }

    # Calculate savings
    cost_savings = overall_stats["haiku"]["total_cost"] - overall_stats["gemini"]["total_cost"]
    cost_savings_pct = round(cost_savings / overall_stats["haiku"]["total_cost"] * 100, 2) if overall_stats["haiku"]["total_cost"] > 0 else 0

    overall_stats["comparison"] = {
        "cost_savings_usd": round(cost_savings, 4),
        "cost_savings_pct": cost_savings_pct,
        "ttft_improvement_pct": round((overall_stats["haiku"]["avg_ttft_ms"] - overall_stats["gemini"]["avg_ttft_ms"]) / overall_stats["haiku"]["avg_ttft_ms"] * 100, 2) if overall_stats["haiku"]["avg_ttft_ms"] > 0 else 0,
        "total_time_improvement_pct": round((overall_stats["haiku"]["avg_total_time_ms"] - overall_stats["gemini"]["avg_total_time_ms"]) / overall_stats["haiku"]["avg_total_time_ms"] * 100, 2) if overall_stats["haiku"]["avg_total_time_ms"] > 0 else 0
    }

    return {
        "timestamp": datetime.now().isoformat(),
        "overall_stats": overall_stats,
        "categories_stats": categories_stats,
        "detailed_results": [r.to_dict() for r in all_results]
    }

def print_summary(results: Dict[str, Any]):
    """Print benchmark summary"""
    print("\n" + "=" * 80)
    print("📊 BENCHMARK SUMMARY")
    print("=" * 80)

    overall = results["overall_stats"]

    print(f"\n🔵 CLAUDE HAIKU 4.5:")
    print(f"   Avg TTFT: {overall['haiku']['avg_ttft_ms']}ms")
    print(f"   Avg Total Time: {overall['haiku']['avg_total_time_ms']}ms")
    print(f"   Avg Response Length: {overall['haiku']['avg_response_length']} chars")
    print(f"   Total Cost: ${overall['haiku']['total_cost']}")
    print(f"   Success Rate: {overall['haiku']['success_rate']}%")

    print(f"\n🟢 GEMINI 2.0 FLASH:")
    print(f"   Avg TTFT: {overall['gemini']['avg_ttft_ms']}ms")
    print(f"   Avg Total Time: {overall['gemini']['avg_total_time_ms']}ms")
    print(f"   Avg Response Length: {overall['gemini']['avg_response_length']} chars")
    print(f"   Total Cost: ${overall['gemini']['total_cost']}")
    print(f"   Success Rate: {overall['gemini']['success_rate']}%")

    comp = overall["comparison"]
    print(f"\n⚡ COMPARISON:")
    print(f"   Cost Savings: ${comp['cost_savings_usd']} ({comp['cost_savings_pct']}%)")
    print(f"   TTFT Improvement: {comp['ttft_improvement_pct']}%")
    print(f"   Total Time Improvement: {comp['total_time_improvement_pct']}%")

    print("\n📂 Category Breakdown:")
    for category, stats in results["categories_stats"].items():
        print(f"\n   {category}:")
        print(f"      Haiku: {stats['haiku']['avg_total_time']*1000:.0f}ms avg, ${stats['haiku']['avg_cost']:.5f} avg cost")
        print(f"      Gemini: {stats['gemini']['avg_total_time']*1000:.0f}ms avg, ${stats['gemini']['avg_cost']:.5f} avg cost")

async def main():
    """Main entry point"""
    results = await run_benchmark()

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"benchmark_results_{timestamp}.json"

    with open(filename, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Results saved to: {filename}")

    # Print summary
    print_summary(results)

    print("\n" + "=" * 80)
    print("🎯 RECOMMENDATION:")

    comp = results["overall_stats"]["comparison"]
    if comp["cost_savings_pct"] > 80 and comp["ttft_improvement_pct"] > 0:
        print("   ✅ STRONG RECOMMENDATION: Switch to Gemini 2.0 Flash")
        print("      - Massive cost savings (>80%)")
        print("      - Better latency")
    elif comp["cost_savings_pct"] > 50:
        print("   ⚠️ CONDITIONAL RECOMMENDATION: Hybrid approach")
        print("      - Use Gemini for non-critical queries")
        print("      - Keep Haiku for complex legal/tools tasks")
    else:
        print("   ❌ KEEP HAIKU 4.5: Cost savings insufficient")
        print("      - Consider other optimization strategies")

    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())
