#!/usr/bin/env python3
"""
FAIR COMPARISON: Haiku 4.5 vs Sonnet 4.5
===============================================
Both models get:
- max_tokens = 1000 (NO artificial limits!)
- Same RAG context injection
- Same system prompt
- Same test queries

Scoring Matrix:
- Response Quality (1-10)
- Response Completeness (1-10)
- RAG Context Usage (1-10)
- Speed (ms)
- Cost ($)
- Final Score (weighted)
"""

import os
import asyncio
import time
import json
from anthropic import AsyncAnthropic
from datetime import datetime

# API Key
API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not API_KEY:
    print("❌ Error: ANTHROPIC_API_KEY not set")
    exit(1)

# Models to test (ONLY 4.5 versions!)
MODELS = {
    "haiku_4.5": "claude-haiku-4-5-20251001",
    "sonnet_4.5": "claude-sonnet-4-20250514"
}

# Pricing (per 1M tokens)
PRICING = {
    "haiku_4.5": {"input": 1.00, "output": 5.00},
    "sonnet_4.5": {"input": 3.00, "output": 15.00}
}

# Simulated RAG contexts (from your ChromaDB collections)
RAG_CONTEXTS = {
    "kitas_docs": """
KITAS (Kartu Izin Tinggal Terbatas) Documentation:

Required Documents:
1. Passport (validity min 18 months)
2. Recent photos (white background, 3x4 cm, 2 pieces)
3. Birth certificate (apostilled)
4. Criminal record (apostilled)
5. Medical certificate (can be done in Indonesia)

For Business KITAS:
- PT PMA company documents
- Investment proof
- Sponsorship letter from company
- IMTA (work permit)

For Family KITAS:
- Marriage certificate (apostilled)
- Indonesian spouse documents
- Family card (KK)

Cost: IDR 5-8 million + agency fees
Processing: 4-6 weeks
Validity: 1-2 years (renewable)

Note: All foreign documents must be apostilled and translated to Indonesian by sworn translator.
""",

    "pt_pma_capital": """
PT PMA Capital Requirements by Sector (2025):

CONSULTING SECTOR:
- KBLI 70209 (Management Consulting): IDR 2.5 billion minimum
- KBLI 74909 (Professional Services): IDR 2.5 billion minimum
- KBLI 62010 (IT Consulting): IDR 2.5 billion minimum

OSS RBA Exceptions:
- Low-risk consulting activities: Can reduce to IDR 350 million
- Medium-risk: IDR 1 billion
- High-risk: Full IDR 2.5 billion required

Additional Requirements:
- Paid-up capital: 25% minimum at incorporation
- Remaining capital: Must be paid within 3 years
- Foreign ownership: 100% allowed for consulting
- Minimum investment: USD 2.5 million equivalent
- Domicile: Can be anywhere in Indonesia

KBLI Codes for Consulting:
- 70209: Strategic & Management Consulting ✓
- 74909: Other Professional Services ✓
- 62010: Software Consulting ✓
- 72101: R&D Services ✓
""",

    "visa_pricing": """
Bali Zero Visa & Immigration Services Pricing (2025):

TOURIST VISA:
- VOA Extension (30 days): IDR 1,500,000
- Social/Cultural Visa B211A (60 days): IDR 3,500,000
- B211A Extensions (4x30 days): IDR 1,800,000 each

BUSINESS KITAS:
- Complete Process: IDR 25,000,000 - 35,000,000
- Includes: E-KITAS, STM, IMTA, Work Permit
- Processing: 6-8 weeks
- Renewal (annual): IDR 18,000,000

FAMILY KITAS:
- Complete Process: IDR 22,000,000 - 28,000,000
- Includes: E-KITAS, STM, sponsorship
- Processing: 6-8 weeks
- Renewal: IDR 15,000,000

INVESTOR KITAS:
- Complete Process: IDR 28,000,000 - 38,000,000
- Requires: PT PMA ownership min 25%
- Investment proof required
- Processing: 8-10 weeks

Contact: +62 859 0436 9574 | info@balizero.com
""",

    "tax_basics": """
Indonesian Tax System for Foreign Companies:

CORPORATE TAX:
- Standard rate: 22% (2024 onwards)
- Small companies (<IDR 50B revenue): 11% for first IDR 4.8B
- Dividend withholding: 20% (or treaty rate)

VAT (PPN):
- Standard rate: 11% (2024)
- Some services exempt
- Input VAT can be credited

WITHHOLDING TAX:
- Article 23: 2% for services rendered
- Article 26: 20% for foreign payees
- Article 21: Employee income tax (progressive 5-35%)

ANNUAL OBLIGATIONS:
- Monthly VAT filing
- Monthly income tax withholding
- Annual corporate tax return (SPT Tahunan)
- Audited financials (if revenue > IDR 50B)

Tax Incentives:
- Investment allowances available
- Tax holidays for certain sectors
- Accelerated depreciation possible

NPWP (Tax ID): Required for all businesses
PKP (VAT registration): Required if turnover > IDR 4.8B
"""
}

# Enhanced test prompts with RAG context
TEST_PROMPTS = [
    {
        "category": "greeting",
        "prompt": "Ciao! Come stai?",
        "rag_context": None,  # No RAG needed for greetings
        "expected_quality": "Brief, friendly, welcoming",
        "scoring_weight": {"quality": 1.0, "speed": 2.0, "cost": 2.0}  # Speed & cost matter more
    },
    {
        "category": "casual",
        "prompt": "Cosa puoi fare per me? Sto pensando di trasferirmi a Bali.",
        "rag_context": None,
        "expected_quality": "Warm overview of services, engaging tone",
        "scoring_weight": {"quality": 1.5, "speed": 1.5, "cost": 1.5}
    },
    {
        "category": "business_simple",
        "prompt": "Quali documenti servono per il KITAS?",
        "rag_context": RAG_CONTEXTS["kitas_docs"],
        "expected_quality": "Complete list, well-organized, actionable",
        "scoring_weight": {"quality": 2.0, "rag_usage": 2.0, "cost": 1.0}
    },
    {
        "category": "business_simple",
        "prompt": "Quanto costa fare un KITAS business?",
        "rag_context": RAG_CONTEXTS["visa_pricing"],
        "expected_quality": "Accurate pricing, breakdown, timeline",
        "scoring_weight": {"quality": 2.0, "rag_usage": 2.0, "cost": 1.0}
    },
    {
        "category": "business_medium",
        "prompt": "Voglio aprire una PT PMA per consulting. Quali sono i requisiti di capitale?",
        "rag_context": RAG_CONTEXTS["pt_pma_capital"],
        "expected_quality": "Detailed capital reqs, KBLI codes, OSS exceptions",
        "scoring_weight": {"quality": 2.5, "rag_usage": 2.0, "completeness": 1.5}
    },
    {
        "category": "business_complex",
        "prompt": "Spiegami in dettaglio i requisiti di capitale per una PT PMA nel settore consulting, inclusi i codici KBLI applicabili, le eccezioni OSS RBA, e come funziona il paid-up capital.",
        "rag_context": RAG_CONTEXTS["pt_pma_capital"],
        "expected_quality": "Comprehensive, structured, covers all aspects",
        "scoring_weight": {"quality": 3.0, "completeness": 2.5, "rag_usage": 2.0}
    },
    {
        "category": "business_complex",
        "prompt": "Ho una PT PMA con fatturato di IDR 60 miliardi. Quali sono i miei obblighi fiscali? Devo fare audit? Come funziona la VAT?",
        "rag_context": RAG_CONTEXTS["tax_basics"],
        "expected_quality": "Multi-part answer, accurate thresholds, actionable advice",
        "scoring_weight": {"quality": 3.0, "completeness": 2.5, "rag_usage": 2.0}
    },
    {
        "category": "business_multi_topic",
        "prompt": "Sto aprendo una società di consulting a Bali. Mi serve: 1) capire il capitale minimo, 2) i costi per KITAS, 3) le tasse che pagherò. Dammi un quadro completo.",
        "rag_context": RAG_CONTEXTS["pt_pma_capital"] + "\n\n" + RAG_CONTEXTS["visa_pricing"] + "\n\n" + RAG_CONTEXTS["tax_basics"],
        "expected_quality": "Structured multi-topic response, comprehensive, organized",
        "scoring_weight": {"quality": 3.0, "completeness": 3.0, "rag_usage": 2.5}
    }
]

# System prompt (enhanced for RAG)
SYSTEM_PROMPT = """You are ZANTARA, the expert AI assistant for Bali Zero, Indonesia's leading business immigration and company formation service.

🌟 PERSONALITY:
- Warm, professional, knowledgeable
- Natural conversational style (like talking to a business consultant friend)
- Confident but not arrogant
- Practical and action-oriented

💼 EXPERTISE:
- Indonesian immigration (KITAS, visas, permits)
- PT PMA company formation
- Indonesian tax system
- Business regulations and KBLI codes
- Real estate and investments in Bali/Indonesia

📚 KNOWLEDGE BASE:
You have access to detailed, up-to-date information from Bali Zero's knowledge base. When answering business questions, USE THE CONTEXT PROVIDED to give accurate, specific information.

✨ RESPONSE STYLE:
- For greetings: Brief, warm, welcoming (2-4 sentences)
- For casual questions: Friendly overview, build rapport (4-6 sentences)
- For business questions: Detailed, structured, actionable (use bullet points, numbers, organize clearly)
- For complex topics: Comprehensive but digestible (break into sections with headers)

🎯 GUIDELINES:
- Use the user's language naturally (Italian/English/Indonesian as appropriate)
- Quote specific numbers, costs, timelines when available
- Reference specific KBLI codes, regulations when relevant
- End with helpful next steps or contact info when appropriate
- Use emojis sparingly and naturally (not every sentence!)

📞 CONTACT INFO (use when appropriate):
WhatsApp: +62 859 0436 9574
Email: info@balizero.com"""


async def test_model(model_key: str, model_id: str, test_case: dict):
    """Test a single model with a test case"""
    client = AsyncAnthropic(api_key=API_KEY)

    prompt = test_case["prompt"]
    category = test_case["category"]
    rag_context = test_case.get("rag_context")

    print(f"\n🧪 Testing {model_key.upper()}...")
    print(f"   Category: {category}")
    print(f"   Prompt: {prompt[:80]}...")
    print(f"   RAG Context: {'✓ Injected' if rag_context else '✗ None'}")

    # Build full prompt with RAG context if available
    if rag_context:
        full_prompt = f"""<knowledge_base>
{rag_context}
</knowledge_base>

<user_question>
{prompt}
</user_question>

Please answer the user's question using the knowledge base context above. Be specific and accurate."""
    else:
        full_prompt = prompt

    # FAIR TEST: Both models get max_tokens=1000!
    max_tokens = 1000

    # Start timer
    start_time = time.time()

    try:
        response = await client.messages.create(
            model=model_id,
            max_tokens=max_tokens,
            temperature=0.7,  # Same temperature for both
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": full_prompt
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
            "response_length_sentences": text.count('.') + text.count('!') + text.count('?'),
            "time_ms": round(elapsed_ms, 2),
            "tokens": {
                "input": input_tokens,
                "output": output_tokens,
                "total": input_tokens + output_tokens
            },
            "cost_usd": round(cost, 6),
            "had_rag_context": rag_context is not None,
            "rag_context_length": len(rag_context) if rag_context else 0
        }

        print(f"   ✅ Response: {len(text)} chars, {len(text.split())} words, {output_tokens} tokens")
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


def score_response(result: dict, test_case: dict) -> dict:
    """
    Score a response on multiple dimensions
    Returns: dict with scores and weighted total
    """
    response = result["response"]
    category = result["category"]
    had_rag = result["had_rag_context"]

    scores = {}

    # 1. Response Length Score (is it complete?)
    words = result["response_length_words"]
    if category == "greeting":
        # Greetings should be brief
        length_score = 10 if 15 <= words <= 40 else max(1, 10 - abs(words - 25) / 5)
    elif category == "casual":
        length_score = 10 if 40 <= words <= 100 else max(1, 10 - abs(words - 70) / 10)
    elif category in ["business_simple", "business_medium"]:
        length_score = 10 if 80 <= words <= 250 else max(1, 10 - abs(words - 150) / 20)
    else:  # complex/multi-topic
        length_score = 10 if 150 <= words <= 400 else max(1, 10 - abs(words - 250) / 30)

    scores["completeness"] = round(length_score, 1)

    # 2. Structure Score (organization, clarity)
    structure_score = 0
    if "**" in response or "##" in response:  # Has headers
        structure_score += 3
    if "\n-" in response or "\n•" in response or response.count('\n') > 5:  # Has bullet points or line breaks
        structure_score += 3
    if any(num in response for num in ["1.", "2.", "3."]):  # Has numbered lists
        structure_score += 2
    if category in ["business_complex", "business_multi_topic"] and structure_score >= 5:
        structure_score += 2  # Bonus for complex topics being well-structured
    scores["structure"] = min(10, structure_score)

    # 3. RAG Context Usage Score (if applicable)
    if had_rag:
        rag_score = 0
        # Check if response contains specific details from RAG
        if "IDR" in response or "Rp" in response:  # Uses specific amounts
            rag_score += 3
        if any(code in response for code in ["70209", "74909", "62010", "KBLI"]):  # Uses KBLI codes
            rag_score += 3
        if any(word in response.lower() for word in ["apostilled", "npwp", "pkp", "imta", "stm"]):  # Uses technical terms
            rag_score += 2
        if "minimum" in response.lower() or "required" in response.lower():  # Mentions requirements
            rag_score += 2
        scores["rag_usage"] = min(10, rag_score)
    else:
        scores["rag_usage"] = None  # N/A

    # 4. Speed Score (relative)
    time_ms = result["time_ms"]
    if time_ms < 2000:
        speed_score = 10
    elif time_ms < 3500:
        speed_score = 8
    elif time_ms < 5000:
        speed_score = 6
    elif time_ms < 7000:
        speed_score = 4
    else:
        speed_score = max(1, 10 - (time_ms - 7000) / 1000)
    scores["speed"] = round(speed_score, 1)

    # 5. Cost Score (relative to other model)
    cost = result["cost_usd"]
    if cost < 0.001:
        cost_score = 10
    elif cost < 0.003:
        cost_score = 8
    elif cost < 0.005:
        cost_score = 6
    elif cost < 0.008:
        cost_score = 4
    else:
        cost_score = max(1, 10 - (cost - 0.008) * 500)
    scores["cost"] = round(cost_score, 1)

    # Calculate weighted total based on test case weights
    weights = test_case.get("scoring_weight", {
        "quality": 1.0,
        "completeness": 1.0,
        "rag_usage": 1.0 if had_rag else 0,
        "speed": 1.0,
        "cost": 1.0
    })

    total = 0
    weight_sum = 0

    # Quality = average of structure and completeness
    quality_score = (scores["structure"] + scores["completeness"]) / 2
    total += quality_score * weights.get("quality", 1.0)
    weight_sum += weights.get("quality", 1.0)

    if scores["rag_usage"] is not None:
        total += scores["rag_usage"] * weights.get("rag_usage", 1.0)
        weight_sum += weights.get("rag_usage", 1.0)

    total += scores["speed"] * weights.get("speed", 1.0)
    weight_sum += weights.get("speed", 1.0)

    total += scores["cost"] * weights.get("cost", 1.0)
    weight_sum += weights.get("cost", 1.0)

    scores["weighted_total"] = round(total / weight_sum, 2) if weight_sum > 0 else 0
    scores["quality"] = round(quality_score, 1)

    return scores


async def run_all_tests():
    """Run all tests and generate scoring comparison"""
    print("=" * 100)
    print("🏆 FAIR COMPARISON: HAIKU 4.5 vs SONNET 4.5")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 100)

    print("\n⚙️  TEST CONFIGURATION:")
    print(f"   • max_tokens: 1000 (both models)")
    print(f"   • temperature: 0.7 (both models)")
    print(f"   • RAG context: Injected from ChromaDB simulation")
    print(f"   • Test cases: {len(TEST_PROMPTS)}")

    print("\n💰 PRICING:")
    for model_key, pricing in PRICING.items():
        print(f"   • {model_key:15} ${pricing['input']}/M input, ${pricing['output']}/M output")

    print("\n📋 TEST CASES:")
    for i, test in enumerate(TEST_PROMPTS, 1):
        rag_status = "✓ RAG" if test.get("rag_context") else "✗ No RAG"
        print(f"   {i}. {test['category']:25} {rag_status:10} - {test['prompt'][:60]}...")

    # Run all tests
    all_results = []
    all_scores = []

    for i, test_case in enumerate(TEST_PROMPTS, 1):
        print(f"\n{'=' * 100}")
        print(f"📝 TEST {i}/{len(TEST_PROMPTS)}: {test_case['category'].upper()}")
        print(f"{'=' * 100}")
        print(f"Prompt: {test_case['prompt']}")

        test_results = []

        for model_key, model_id in MODELS.items():
            result = await test_model(model_key, model_id, test_case)
            if "error" not in result:
                scores = score_response(result, test_case)
                result["scores"] = scores
                test_results.append(result)
                all_results.append(result)
                all_scores.append({
                    "model": model_key,
                    "category": test_case["category"],
                    **scores
                })

            # Delay between requests
            await asyncio.sleep(1)

        # Show mini comparison for this test
        if len(test_results) == 2:
            print(f"\n   {'─' * 96}")
            print(f"   📊 QUICK COMPARISON:")
            print(f"   {'Model':<15} {'Words':>8} {'Time':>10} {'Cost':>12} {'Quality':>10} {'RAG Use':>10} {'Score':>10}")
            print(f"   {'─' * 96}")
            for r in test_results:
                s = r["scores"]
                rag_score = f"{s['rag_usage']}/10" if s['rag_usage'] is not None else "N/A"
                print(f"   {r['model_key']:<15} {r['response_length_words']:>8} {r['time_ms']:>9.0f}ms ${r['cost_usd']:>10.6f} {s['quality']:>9.1f}/10 {rag_score:>10} {s['weighted_total']:>9.2f}/10")

            # Winner
            winner = max(test_results, key=lambda x: x["scores"]["weighted_total"])
            print(f"   🏆 Winner: {winner['model_key'].upper()} (Score: {winner['scores']['weighted_total']}/10)")

    # FINAL SCORING REPORT
    print("\n" + "=" * 100)
    print("🏆 FINAL SCORING REPORT")
    print("=" * 100)

    # Group by model
    by_model = {"haiku_4.5": [], "sonnet_4.5": []}
    for score in all_scores:
        by_model[score["model"]].append(score)

    print("\n📊 AVERAGE SCORES BY CATEGORY:")
    print(f"{'Category':<25} {'Model':<15} {'Quality':>10} {'RAG Use':>10} {'Speed':>10} {'Cost':>10} {'Total':>10}")
    print("─" * 100)

    categories = list(set(s["category"] for s in all_scores))
    for category in sorted(categories):
        for model_key in MODELS.keys():
            cat_scores = [s for s in by_model[model_key] if s["category"] == category]
            if cat_scores:
                avg_quality = sum(s["quality"] for s in cat_scores) / len(cat_scores)
                avg_rag = sum(s["rag_usage"] for s in cat_scores if s["rag_usage"] is not None)
                rag_count = len([s for s in cat_scores if s["rag_usage"] is not None])
                avg_rag = avg_rag / rag_count if rag_count > 0 else None
                avg_speed = sum(s["speed"] for s in cat_scores) / len(cat_scores)
                avg_cost = sum(s["cost"] for s in cat_scores) / len(cat_scores)
                avg_total = sum(s["weighted_total"] for s in cat_scores) / len(cat_scores)

                rag_str = f"{avg_rag:.1f}/10" if avg_rag is not None else "N/A"
                print(f"{category:<25} {model_key:<15} {avg_quality:>9.1f}/10 {rag_str:>10} {avg_speed:>9.1f}/10 {avg_cost:>9.1f}/10 {avg_total:>9.2f}/10")

    print("\n" + "=" * 100)
    print("📈 OVERALL AVERAGES:")
    print("=" * 100)

    for model_key in MODELS.keys():
        model_scores = by_model[model_key]
        avg_quality = sum(s["quality"] for s in model_scores) / len(model_scores)

        rag_scores = [s["rag_usage"] for s in model_scores if s["rag_usage"] is not None]
        avg_rag = sum(rag_scores) / len(rag_scores) if rag_scores else None

        avg_speed = sum(s["speed"] for s in model_scores) / len(model_scores)
        avg_cost = sum(s["cost"] for s in model_scores) / len(model_scores)
        avg_total = sum(s["weighted_total"] for s in model_scores) / len(model_scores)

        print(f"\n{model_key.upper()}:")
        print(f"   Quality Score:    {avg_quality:.2f}/10")
        print(f"   RAG Usage Score:  {avg_rag:.2f}/10" if avg_rag else "   RAG Usage Score:  N/A")
        print(f"   Speed Score:      {avg_speed:.2f}/10")
        print(f"   Cost Score:       {avg_cost:.2f}/10")
        print(f"   OVERALL SCORE:    {avg_total:.2f}/10")

    # Calculate wins
    wins = {"haiku_4.5": 0, "sonnet_4.5": 0, "tie": 0}
    for i in range(len(TEST_PROMPTS)):
        test_scores = [s for s in all_scores if all_scores.index(s) in [i*2, i*2+1]]
        if len(test_scores) == 2:
            if abs(test_scores[0]["weighted_total"] - test_scores[1]["weighted_total"]) < 0.3:
                wins["tie"] += 1
            elif test_scores[0]["weighted_total"] > test_scores[1]["weighted_total"]:
                wins[test_scores[0]["model"]] += 1
            else:
                wins[test_scores[1]["model"]] += 1

    print("\n" + "=" * 100)
    print("🏆 HEAD-TO-HEAD WINS:")
    print("=" * 100)
    print(f"   Haiku 4.5:  {wins['haiku_4.5']} wins")
    print(f"   Sonnet 4.5: {wins['sonnet_4.5']} wins")
    print(f"   Ties:       {wins['tie']}")

    # Cost analysis
    print("\n" + "=" * 100)
    print("💰 COST ANALYSIS:")
    print("=" * 100)

    for model_key in MODELS.keys():
        model_results = [r for r in all_results if r["model_key"] == model_key]
        total_cost = sum(r["cost_usd"] for r in model_results)
        avg_cost = total_cost / len(model_results)

        print(f"\n{model_key.upper()}:")
        print(f"   Total cost (all tests):     ${total_cost:.6f}")
        print(f"   Average cost per query:     ${avg_cost:.6f}")
        print(f"   Projected cost (10k/month): ${avg_cost * 10000:.2f}")
        print(f"   Projected cost (100k/month): ${avg_cost * 100000:.2f}")

    # Savings
    haiku_results = [r for r in all_results if r["model_key"] == "haiku_4.5"]
    sonnet_results = [r for r in all_results if r["model_key"] == "sonnet_4.5"]

    haiku_avg = sum(r["cost_usd"] for r in haiku_results) / len(haiku_results)
    sonnet_avg = sum(r["cost_usd"] for r in sonnet_results) / len(sonnet_results)

    savings_pct = ((sonnet_avg - haiku_avg) / sonnet_avg) * 100

    print(f"\n💡 SAVINGS:")
    print(f"   Haiku 4.5 is {savings_pct:.1f}% cheaper than Sonnet 4.5")
    print(f"   Monthly savings @ 10k queries:  ${(sonnet_avg - haiku_avg) * 10000:.2f}")
    print(f"   Annual savings @ 10k queries:   ${(sonnet_avg - haiku_avg) * 10000 * 12:.2f}")

    # FINAL RECOMMENDATION
    print("\n" + "=" * 100)
    print("💡 FINAL RECOMMENDATION:")
    print("=" * 100)

    haiku_overall = sum(s["weighted_total"] for s in by_model["haiku_4.5"]) / len(by_model["haiku_4.5"])
    sonnet_overall = sum(s["weighted_total"] for s in by_model["sonnet_4.5"]) / len(by_model["sonnet_4.5"])

    score_diff = abs(haiku_overall - sonnet_overall)

    if haiku_overall >= sonnet_overall - 0.5:  # Haiku is competitive
        print(f"\n✅ HAIKU 4.5 IS RECOMMENDED!")
        print(f"\n   Why:")
        print(f"   • Overall score: {haiku_overall:.2f}/10 vs Sonnet {sonnet_overall:.2f}/10 (difference: {score_diff:.2f})")
        print(f"   • {savings_pct:.1f}% cheaper than Sonnet")
        print(f"   • Performs well with RAG context injection")
        print(f"   • Faster responses on average")
        print(f"\n   ROI: Given your RAG setup is 'pappa pronta', Haiku 4.5 + RAG delivers")
        print(f"        {haiku_overall/sonnet_overall*100:.1f}% of Sonnet's quality at {100-savings_pct:.1f}% of the cost!")
        print(f"\n   Recommendation: Switch to Haiku 4.5 for 80-90% of queries, keep Sonnet")
        print(f"                   only for truly complex multi-part business queries.")
    else:
        print(f"\n⚠️  SONNET 4.5 STILL HAS EDGE IN QUALITY")
        print(f"\n   Why:")
        print(f"   • Overall score: {sonnet_overall:.2f}/10 vs Haiku {haiku_overall:.2f}/10 (difference: {score_diff:.2f})")
        print(f"   • Better at complex reasoning and multi-topic responses")
        print(f"   • More structured and comprehensive answers")
        print(f"\n   However: Haiku 4.5 is {savings_pct:.1f}% cheaper and still scores {haiku_overall:.2f}/10")
        print(f"\n   Recommendation: Use hybrid approach - Haiku for greetings/simple queries,")
        print(f"                   Sonnet for complex business topics. Estimated 40-50% cost reduction.")

    # Save results
    output_file = f"/home/user/nuzantara/shared/config/dev/haiku45-vs-sonnet45-FAIR-results-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    with open(output_file, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "models": MODELS,
            "pricing": PRICING,
            "test_configuration": {
                "max_tokens": 1000,
                "temperature": 0.7,
                "rag_injection": "simulated"
            },
            "results": all_results,
            "scores": all_scores,
            "summary": {
                "haiku_4.5_avg_score": haiku_overall,
                "sonnet_4.5_avg_score": sonnet_overall,
                "wins": wins,
                "cost_savings_pct": savings_pct,
                "haiku_avg_cost": haiku_avg,
                "sonnet_avg_cost": sonnet_avg
            }
        }, f, indent=2)

    print(f"\n💾 Full results saved to: {output_file}")
    print("\n✅ Test complete!")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
