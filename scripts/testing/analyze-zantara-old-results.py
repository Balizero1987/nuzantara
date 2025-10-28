#!/usr/bin/env python3
"""
Analyze old ZANTARA test results to identify quality issues
"""

import json

# Read old test results
with open('shared/config/dev/test-zantara-conversation-results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 80)
print("📊 ZANTARA OLD TEST RESULTS ANALYSIS")
print("=" * 80)
print(f"Timestamp: {data.get('timestamp', 'unknown')}")
print(f"Backend: {data.get('backend', 'unknown')}")
print(f"Total tests: {len(data.get('tests', []))}")
print("=" * 80)

for idx, test in enumerate(data.get('tests', []), 1):
    test_name = test.get('test', 'Unknown')
    message = test.get('message', '')
    response = test.get('response', '')

    print(f"\n{'='*80}")
    print(f"🧪 TEST {idx}: {test_name}")
    print(f"{'='*80}")
    print(f"👤 USER: {message}")
    print(f"{'-'*80}")
    print(f"🤖 ZANTARA: {response[:300]}{'...' if len(response) > 300 else ''}")
    print(f"{'-'*80}")

    # Analyze issues
    issues = []

    # 1. Check for hallucinations
    hallucination_markers = [
        "[PRICE]", "[MANDATORY]", "User:", "Assistant:", "Context:",
        "Requirements:", "## ", "### ", "---", "Deviation from Requirement"
    ]
    found_hallucinations = [m for m in hallucination_markers if m in response]
    if found_hallucinations:
        issues.append(f"🚨 HALLUCINATION: {', '.join(found_hallucinations[:3])}")

    # 2. Check for context mixing
    if "Per assistenza diretta contattaci" in response and len(message.split()) < 5:
        issues.append("⚠️  CONTEXT MIX: Adding contact info to simple greeting")

    # 3. Check for inappropriate length
    words = len(response.split())
    is_greeting = any(g in message.lower() for g in ["ciao", "hi", "hello", "come stai", "how are you"])
    if is_greeting and words > 50:
        issues.append(f"⚠️  TOO VERBOSE: {words} words for greeting (expect <20)")

    # 4. Check for robotic language
    robotic = ["as an ai", "i am programmed", "i am designed", "according to my"]
    found_robotic = [r for r in robotic if r in response.lower()]
    if found_robotic:
        issues.append(f"⚠️  ROBOTIC: {', '.join(found_robotic)}")

    # 5. Check for random visa/legal content in casual queries
    business_terms = ["KITAS", "VITAS", "PT PMA", "NPWP", "immigration", "visa requirements"]
    if is_greeting:
        found_business = [t for t in business_terms if t in response]
        if found_business:
            issues.append(f"🚨 CONTEXT LEAK: Business terms in greeting - {', '.join(found_business[:2])}")

    # 6. Check language consistency
    is_italian = any(word in message.lower() for word in ["ciao", "come", "cosa", "mi"])
    has_italian = any(word in response.lower() for word in ["ciao", "come", "cosa", "per"])
    if is_italian and not has_italian:
        issues.append("⚠️  LANGUAGE MISMATCH: Italian query, English response")

    # Print issues
    if issues:
        print("\n❌ ISSUES DETECTED:")
        for issue in issues:
            print(f"   {issue}")
    else:
        print("\n✅ No major issues detected")

    print()

print("\n" + "=" * 80)
print("📈 SUMMARY OF COMMON PROBLEMS")
print("=" * 80)

# Count issues across all tests
all_responses = [test.get('response', '') for test in data.get('tests', [])]

hallucination_count = sum(1 for r in all_responses if any(m in r for m in ["[PRICE]", "[MANDATORY]", "User:"]))
context_mix_count = sum(1 for r in all_responses if "Per assistenza diretta" in r)
verbose_count = sum(1 for r in all_responses if len(r.split()) > 100)

print(f"Total tests: {len(all_responses)}")
print(f"Hallucinations detected: {hallucination_count}/{len(all_responses)} ({hallucination_count/len(all_responses)*100:.0f}%)")
print(f"Context mixing: {context_mix_count}/{len(all_responses)} ({context_mix_count/len(all_responses)*100:.0f}%)")
print(f"Too verbose (>100 words): {verbose_count}/{len(all_responses)} ({verbose_count/len(all_responses)*100:.0f}%)")

print("\n🎯 ROOT CAUSES:")
print("   1. RAG context bleeding into casual responses")
print("   2. System prompt not properly separated from RAG context")
print("   3. Model mixing training data patterns inappropriately")
print("   4. No clear separation between casual vs business query handling")

print("\n💡 RECOMMENDED FIXES:")
print("   1. Improve RAG context injection (separate from system prompt)")
print("   2. Add query classification before RAG retrieval")
print("   3. Use different prompts for casual vs business queries")
print("   4. Fine-tune model with better context separation training")
print("=" * 80)
