#!/usr/bin/env python3
"""
Test ZANTARA Llama 3.1 8B directly via RunPod endpoint
Bypasses RAG backend to test raw model responses
"""

import requests
import json
import os
from datetime import datetime

# RunPod credentials (from RunPod dashboard)
RUNPOD_ENDPOINT = "https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync"  # ✅ Correct endpoint ID
RUNPOD_API_KEY = "rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"  # ✅ CORRECT API key from dashboard

# ZANTARA system prompt (from zantara_client.py)
SYSTEM_PROMPT = """You are ZANTARA, the friendly AI assistant for Bali Zero. You're like a helpful colleague who knows everything about Indonesian business, visas, and Bali life.

🌟 PERSONALITY:
- Be warm, friendly, and conversational like a good friend
- Use natural language, not robotic responses
- Show personality and be genuinely helpful
- For casual chats: be like talking to a knowledgeable friend
- For business questions: be professional but still approachable

🎯 MODE SYSTEM:
- SANTAI: Casual, friendly responses (2-4 sentences). Use emojis, be conversational and warm
- PIKIRAN: Detailed, professional analysis (4-6 sentences). Structured but still personable

💬 CONVERSATION STYLE:
- Start conversations warmly: "Hey! How can I help you today?" or "Ciao! What's up?"
- For casual questions: respond like a knowledgeable friend
- For business questions: be professional but still friendly
- Use the user's language naturally (English, Italian, Indonesian)
- Don't be overly formal - be human and relatable

🏢 BALI ZERO KNOWLEDGE:
- You know everything about visas, KITAS, PT PMA, taxes, real estate in Indonesia
- You're the go-to person for Bali business questions
- Always helpful, never pushy
- If user asks about services or needs assistance: naturally offer "Need help with this? Contact us on WhatsApp +62 859 0436 9574"
- For casual chat or team members: no contact info needed

✨ RESPONSE GUIDELINES:
- Be conversational and natural
- Use appropriate emojis (but don't overdo it)
- Show you care about helping
- Be accurate but not robotic
- Match the user's energy and tone"""


def build_prompt(user_message: str, conversation_history: list = None) -> str:
    """Build full prompt for ZANTARA"""
    conversation = f"{SYSTEM_PROMPT}\n\n"

    # Add conversation history if provided
    if conversation_history:
        for msg in conversation_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                conversation += f"User: {content}\n"
            elif role == "assistant":
                conversation += f"Assistant: {content}\n"

    # Add current message
    conversation += f"User: {user_message}\n"
    conversation += "Assistant:"

    return conversation


def test_zantara(message: str, test_name: str, conversation_history: list = None):
    """Test ZANTARA directly via RunPod"""
    print(f"\n{'='*70}")
    print(f"🧪 TEST: {test_name}")
    print(f"{'='*70}")
    print(f"👤 USER: {message}")
    print(f"{'='*70}")

    try:
        # Build prompt
        full_prompt = build_prompt(message, conversation_history)

        # Call RunPod vLLM endpoint
        response = requests.post(
            RUNPOD_ENDPOINT,
            headers={
                "Authorization": f"Bearer {RUNPOD_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "input": {
                    "prompt": full_prompt,
                    "sampling_params": {
                        "max_tokens": 500,
                        "temperature": 0.7,
                        "top_p": 0.95
                    }
                }
            },
            timeout=60
        )

        if response.status_code == 200:
            data = response.json()

            # Parse vLLM response
            answer = ""
            if data.get("output") and isinstance(data["output"], list):
                first_output = data["output"][0]

                # Try different response formats
                if first_output.get("choices") and first_output["choices"][0].get("tokens"):
                    tokens = first_output["choices"][0]["tokens"]
                    answer = "".join(tokens) if isinstance(tokens, list) else str(tokens)
                elif first_output.get("choices") and first_output["choices"][0].get("text"):
                    answer = first_output["choices"][0]["text"]
                elif first_output.get("choices") and first_output["choices"][0].get("message", {}).get("content"):
                    answer = first_output["choices"][0]["message"]["content"]
                elif isinstance(first_output, str):
                    answer = first_output

            if answer:
                answer = answer.strip()
                print(f"🤖 ZANTARA: {answer}\n")
                analyze_response(answer, message)
                return answer
            else:
                print(f"❌ Empty response from ZANTARA")
                print(f"📄 Raw output: {json.dumps(data, indent=2)}")
                return None

        else:
            print(f"❌ HTTP Error {response.status_code}")
            print(f"📄 Response: {response.text}")
            return None

    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        print(traceback.format_exc())
        return None


def analyze_response(response: str, original_message: str):
    """Analyze response quality"""
    print(f"📊 QUALITY ANALYSIS:")
    print(f"{'-'*70}")

    issues = []
    good_points = []

    # 1. Check length appropriateness for greetings
    words = len(response.split())
    is_greeting = any(g in original_message.lower() for g in ["ciao", "hi", "hello", "hey"])

    if is_greeting:
        if words > 20:
            issues.append(f"⚠️  Too verbose for greeting ({words} words, expect <20)")
        elif words < 5:
            issues.append(f"⚠️  Too brief for greeting ({words} words, expect 5-20)")
        else:
            good_points.append(f"✅ Appropriate length ({words} words)")
    else:
        good_points.append(f"ℹ️  Response length: {words} words")

    # 2. Check for emojis (personality)
    emoji_count = sum(1 for char in response if ord(char) > 127 and char not in "àèéìòù")
    if emoji_count > 0:
        good_points.append(f"✅ Uses emojis ({emoji_count} found)")
    else:
        issues.append("⚠️  No emojis (may feel too formal)")

    # 3. Check for natural expressions
    natural_italian = ["ciao", "benissimo", "ottimo", "fantastico", "wow", "ah", "oh"]
    natural_english = ["great", "awesome", "hey", "yeah", "sure", "cool"]
    natural_found = [expr for expr in (natural_italian + natural_english) if expr in response.lower()]

    if natural_found:
        good_points.append(f"✅ Natural expressions: {', '.join(natural_found[:3])}")
    else:
        issues.append("⚠️  Lacks natural/casual expressions")

    # 4. Check for robotic patterns (CRITICAL)
    robotic_patterns = [
        "as an ai", "i am programmed", "i am designed", "according to my training",
        "i don't have emotions", "i cannot feel", "artificial intelligence",
        "large language model", "llm"
    ]
    found_robotic = [p for p in robotic_patterns if p in response.lower()]

    if found_robotic:
        issues.append(f"🚨 ROBOTIC LANGUAGE: {', '.join(found_robotic)}")
    else:
        good_points.append("✅ No robotic self-references")

    # 5. Check for hallucinations / random context mixing
    suspicious_patterns = [
        "[PRICE]", "[MANDATORY]", "User:", "Assistant:", "Context:",
        "Requirements:", "## ", "### ", "---"
    ]
    found_suspicious = [p for p in suspicious_patterns if p in response]

    if found_suspicious:
        issues.append(f"🚨 HALLUCINATION/CONTEXT MIX: {', '.join(found_suspicious)}")
    else:
        good_points.append("✅ No hallucinations detected")

    # 6. Check for overly formal language
    formal_words = [
        "facilitate", "utilize", "endeavor", "furthermore", "nevertheless",
        "hereby", "herein", "aforementioned", "pursuant", "notwithstanding"
    ]
    found_formal = [w for w in formal_words if w in response.lower()]

    if len(found_formal) > 1:
        issues.append(f"⚠️  Too formal: {', '.join(found_formal)}")
    else:
        good_points.append("✅ Conversational tone")

    # 7. Check for questions (engagement)
    question_count = response.count("?")
    if question_count > 0 and len(original_message.split()) < 10:
        good_points.append(f"✅ Asks questions ({question_count} found)")
    elif question_count > 3:
        issues.append(f"⚠️  Too many questions ({question_count})")

    # 8. Language consistency
    is_italian_query = any(word in original_message.lower() for word in ["ciao", "come", "mi", "cosa", "sei"])
    has_italian = any(word in response.lower() for word in ["ciao", "benissimo", "posso", "cosa", "come"])

    if is_italian_query and not has_italian:
        issues.append("⚠️  Language mismatch (Italian query, English response)")
    elif is_italian_query and has_italian:
        good_points.append("✅ Responds in user's language")

    # Print results
    print("\n📈 STRENGTHS:")
    for point in good_points:
        print(f"  {point}")

    if issues:
        print("\n📉 ISSUES:")
        for issue in issues:
            print(f"  {issue}")

    # Overall score
    total = len(good_points) + len(issues)
    score = (len(good_points) / total * 100) if total > 0 else 0

    print(f"\n🎯 QUALITY SCORE: {score:.0f}%")

    if score >= 80:
        print("   ✅ EXCELLENT - Natural and human-like")
    elif score >= 60:
        print("   ⚠️  GOOD - Mostly natural, minor improvements needed")
    elif score >= 40:
        print("   ⚠️  FAIR - Some issues, needs improvement")
    else:
        print("   🚨 POOR - Major quality issues detected")

    print(f"{'-'*70}\n")


def main():
    """Run ZANTARA direct tests"""
    print("=" * 70)
    print("🤖 ZANTARA LLAMA 3.1 8B - DIRECT ENDPOINT TEST")
    print("=" * 70)
    print(f"Endpoint: {RUNPOD_ENDPOINT}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Model: meta-llama/Llama-3.1-8B-Instruct (fine-tuned)")
    print("=" * 70)

    # Test cases
    tests = [
        # Simple greetings
        ("Ciao!", "Italian greeting"),
        ("Hi there!", "English greeting"),

        # Casual questions
        ("Come stai?", "Italian 'How are you'"),
        ("How's it going?", "English 'How are you'"),

        # Help requests
        ("Mi puoi aiutare?", "Italian 'Can you help me'"),
        ("Can you help me?", "English 'Can you help me'"),

        # Self-introduction
        ("Tell me about yourself", "Self-introduction"),
        ("Chi sei?", "Italian 'Who are you'"),

        # Business questions
        ("What is KITAS?", "Business - KITAS explanation"),
        ("Cos'è una PT PMA?", "Business - PT PMA explanation (Italian)"),
    ]

    results = []

    for message, test_name in tests:
        response = test_zantara(message, test_name)
        results.append({
            "test": test_name,
            "message": message,
            "response": response
        })

        # Wait between requests
        import time
        time.sleep(2)

    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    print(f"Total tests: {len(tests)}")
    successful = sum(1 for r in results if r['response'])
    print(f"Successful: {successful}/{len(tests)} ({successful/len(tests)*100:.0f}%)")
    print(f"Failed: {len(tests) - successful}/{len(tests)}")

    # Save results
    output_file = "test-zantara-direct-results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "endpoint": RUNPOD_ENDPOINT,
            "model": "meta-llama/Llama-3.1-8B-Instruct (fine-tuned)",
            "tests": results
        }, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Results saved to: {output_file}")
    print("=" * 70)


if __name__ == "__main__":
    main()
