#!/usr/bin/env python3
"""
Test ZANTARA Llama 3.1 8B via RunPod ASYNC endpoint
Uses /run (async) instead of /runsync to avoid timeouts
"""

import requests
import json
import time
from datetime import datetime

RUNPOD_ENDPOINT_BASE = "https://api.runpod.ai/v2/itz2q5gmid4cyt"
RUNPOD_API_KEY = "rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"

SYSTEM_PROMPT = """You are ZANTARA, the friendly AI assistant for Bali Zero. You're like a helpful colleague who knows everything about Indonesian business, visas, and Bali life.

🌟 PERSONALITY:
- Be warm, friendly, and conversational like a good friend
- Use natural language, not robotic responses
- Show personality and be genuinely helpful

🎯 MODE SYSTEM:
- SANTAI: Casual, friendly responses (2-4 sentences). Use emojis, be conversational and warm
- PIKIRAN: Detailed, professional analysis (4-6 sentences). Structured but still personable

💬 CONVERSATION STYLE:
- For casual questions: respond like a knowledgeable friend
- For business questions: be professional but still friendly
- Use the user's language naturally (English, Italian, Indonesian)
- Don't be overly formal - be human and relatable"""


def submit_job(message: str):
    """Submit async job to RunPod"""
    full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {message}\nAssistant:"

    print(f"📤 Submitting job to RunPod...")

    response = requests.post(
        f"{RUNPOD_ENDPOINT_BASE}/run",
        headers={
            "Authorization": f"Bearer {RUNPOD_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "input": {
                "prompt": full_prompt,
                "sampling_params": {
                    "max_tokens": 200,
                    "temperature": 0.7,
                    "top_p": 0.95
                }
            }
        },
        timeout=30
    )

    if response.status_code == 200:
        data = response.json()
        job_id = data.get("id")
        print(f"✅ Job submitted: {job_id}")
        return job_id
    else:
        print(f"❌ Submit failed: {response.status_code}")
        print(response.text)
        return None


def check_status(job_id: str):
    """Check job status"""
    response = requests.get(
        f"{RUNPOD_ENDPOINT_BASE}/status/{job_id}",
        headers={
            "Authorization": f"Bearer {RUNPOD_API_KEY}"
        },
        timeout=10
    )

    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Status check failed: {response.status_code}")
        return None


def poll_until_complete(job_id: str, max_wait: int = 120):
    """Poll job status until complete"""
    print(f"⏳ Polling for results (max {max_wait}s)...")

    start_time = time.time()
    poll_count = 0

    while True:
        elapsed = time.time() - start_time

        if elapsed > max_wait:
            print(f"⏱️  Timeout after {max_wait}s")
            return None

        poll_count += 1
        status_data = check_status(job_id)

        if not status_data:
            time.sleep(2)
            continue

        status = status_data.get("status")

        if status == "COMPLETED":
            print(f"✅ Job completed after {elapsed:.1f}s ({poll_count} polls)")
            return status_data.get("output")

        elif status == "FAILED":
            print(f"❌ Job failed: {status_data.get('error')}")
            return None

        elif status in ["IN_QUEUE", "IN_PROGRESS"]:
            print(f"   [{poll_count}] Status: {status} ({elapsed:.1f}s elapsed)")
            time.sleep(3)  # Poll every 3 seconds

        else:
            print(f"   Unknown status: {status}")
            time.sleep(3)


def test_zantara_async(message: str, test_name: str):
    """Test ZANTARA with async endpoint"""
    print(f"\n{'='*70}")
    print(f"🧪 TEST: {test_name}")
    print(f"{'='*70}")
    print(f"👤 USER: {message}")
    print(f"{'='*70}\n")

    # Submit job
    job_id = submit_job(message)
    if not job_id:
        return None

    # Poll for results
    output = poll_until_complete(job_id, max_wait=120)

    if not output:
        return None

    # Parse output
    print(f"\n📄 Raw Output:")
    print(json.dumps(output, indent=2)[:500])

    # Try to extract text
    answer = ""

    # vLLM format detection
    if isinstance(output, list) and len(output) > 0:
        first = output[0]

        if isinstance(first, dict):
            # Try choices[0].text
            if first.get("choices") and len(first["choices"]) > 0:
                choice = first["choices"][0]
                answer = choice.get("text", "")

        elif isinstance(first, str):
            answer = first

    elif isinstance(output, dict):
        # Single dict output
        if output.get("choices"):
            answer = output["choices"][0].get("text", "")
        elif output.get("text"):
            answer = output["text"]

    elif isinstance(output, str):
        answer = output

    if answer:
        answer = answer.strip()
        print(f"\n{'='*70}")
        print(f"🤖 ZANTARA RESPONSE:")
        print(f"{'='*70}")
        print(answer)
        print(f"{'='*70}")

        # Quality analysis
        analyze_quality(answer, message)

        return answer
    else:
        print(f"\n❌ Could not extract text from output")
        return None


def analyze_quality(response: str, original_message: str):
    """Quick quality analysis"""
    words = len(response.split())

    print(f"\n📊 QUALITY ANALYSIS:")
    print(f"   Length: {words} words")

    # Check for artifacts
    artifacts = ["[PRICE]", "[MANDATORY]", "User:", "Assistant:", "Context:"]
    found = [a for a in artifacts if a in response]

    if found:
        print(f"   ⚠️  Artifacts: {found}")
    else:
        print(f"   ✅ No artifacts")

    # Check emojis
    emoji_count = sum(1 for char in response if ord(char) > 127 and char not in "àèéìòù")
    print(f"   Emojis: {emoji_count}")

    # Language check
    is_italian_query = any(w in original_message.lower() for w in ["ciao", "come", "cosa"])
    has_italian = any(w in response.lower() for w in ["ciao", "benissimo", "posso"])

    if is_italian_query:
        if has_italian:
            print(f"   ✅ Responds in Italian")
        else:
            print(f"   ⚠️  Language mismatch (Italian query, non-Italian response)")


def main():
    """Run async tests"""
    print("=" * 70)
    print("🤖 ZANTARA LLAMA 3.1 8B - ASYNC ENDPOINT TEST")
    print("=" * 70)
    print(f"Endpoint: {RUNPOD_ENDPOINT_BASE}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Model: meta-llama/Llama-3.1-8B-Instruct (fine-tuned)")
    print("=" * 70)

    tests = [
        ("Ciao!", "Italian greeting"),
        ("Come stai?", "Italian 'How are you'"),
        ("What is KITAS?", "Business - KITAS explanation"),
    ]

    results = []

    for message, test_name in tests:
        response = test_zantara_async(message, test_name)
        results.append({
            "test": test_name,
            "message": message,
            "response": response
        })

        # Wait between tests
        if response:
            time.sleep(3)

    # Summary
    print(f"\n{'='*70}")
    print("📋 TEST SUMMARY")
    print(f"{'='*70}")
    successful = sum(1 for r in results if r['response'])
    print(f"Total: {len(tests)}")
    print(f"Successful: {successful}/{len(tests)}")
    print(f"Failed: {len(tests) - successful}/{len(tests)}")

    # Save results
    output_file = "test-zantara-async-results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "endpoint": RUNPOD_ENDPOINT_BASE,
            "model": "meta-llama/Llama-3.1-8B-Instruct (fine-tuned)",
            "tests": results
        }, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Results saved to: {output_file}")
    print("=" * 70)


if __name__ == "__main__":
    main()
