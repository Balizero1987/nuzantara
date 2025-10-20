#!/usr/bin/env python3
"""Quick single test for ZANTARA"""

import requests
import json
from datetime import datetime

RUNPOD_ENDPOINT = "https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync"
RUNPOD_API_KEY = "rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"

SYSTEM_PROMPT = """You are ZANTARA, the friendly AI assistant for Bali Zero. Be warm and conversational."""

def test_single():
    message = "Ciao!"

    full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {message}\nAssistant:"

    print(f"🧪 Testing ZANTARA with: '{message}'")
    print(f"⏱️  Waiting for response (max 90s)...\n")

    try:
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
                        "max_tokens": 150,
                        "temperature": 0.7,
                        "top_p": 0.95
                    }
                }
            },
            timeout=90
        )

        print(f"📡 HTTP Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success!")
            print(f"\n📄 Full Response:")
            print(json.dumps(data, indent=2))

            # Try to extract text
            if data.get("output"):
                print(f"\n🤖 ZANTARA Output:")
                print(data["output"])
        else:
            print(f"❌ Error: {response.text}")

    except requests.exceptions.Timeout:
        print(f"⏱️  TIMEOUT after 90 seconds - RunPod workers may be cold starting")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_single()
