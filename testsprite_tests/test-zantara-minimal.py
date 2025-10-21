#!/usr/bin/env python3
"""Minimal test - just submit and check once"""

import requests
import json
import time

RUNPOD_ENDPOINT_BASE = "https://api.runpod.ai/v2/itz2q5gmid4cyt"
RUNPOD_API_KEY = "rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"

print("🧪 MINIMAL TEST - Submit job and check status once\n")

# Submit job
print("📤 Submitting job...")
try:
    response = requests.post(
        f"{RUNPOD_ENDPOINT_BASE}/run",
        headers={
            "Authorization": f"Bearer {RUNPOD_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "input": {
                "prompt": "You are ZANTARA. User: Ciao! Assistant:",
                "sampling_params": {
                    "max_tokens": 50,
                    "temperature": 0.7
                }
            }
        },
        timeout=10
    )

    print(f"📡 Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(json.dumps(data, indent=2))

        job_id = data.get("id")

        if job_id:
            print(f"\n⏳ Waiting 10 seconds...")
            time.sleep(10)

            print(f"🔍 Checking status...")
            status_response = requests.get(
                f"{RUNPOD_ENDPOINT_BASE}/status/{job_id}",
                headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"},
                timeout=10
            )

            print(f"📡 Status check: {status_response.status_code}")
            print(json.dumps(status_response.json(), indent=2))
    else:
        print(f"❌ Failed: {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")
