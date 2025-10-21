#!/usr/bin/env python3
"""Check status of previous job"""

import requests
import json

RUNPOD_ENDPOINT_BASE = "https://api.runpod.ai/v2/itz2q5gmid4cyt"
RUNPOD_API_KEY = "rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"

# Previous job ID from first test
job_id = "563cdfae-d8d3-4f90-9b35-cbc6de9614bb-e2"

print(f"🔍 Checking old job: {job_id}")

response = requests.get(
    f"{RUNPOD_ENDPOINT_BASE}/status/{job_id}",
    headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"},
    timeout=10
)

if response.status_code == 200:
    data = response.json()
    status = data.get("status")

    print(f"📡 Status: {status}")

    if status == "COMPLETED":
        print(f"\n✅ IT COMPLETED!\n")
        print("📄 Full output:")
        print(json.dumps(data.get("output"), indent=2))

        # Extract text
        output = data.get("output")
        if isinstance(output, list) and len(output) > 0:
            if isinstance(output[0], dict) and output[0].get("choices"):
                text = output[0]["choices"][0].get("text", "")
                print(f"\n🤖 ZANTARA says:")
                print(f"{'='*70}")
                print(text)
                print(f"{'='*70}")
    else:
        print(f"   Still {status}")
        print(json.dumps(data, indent=2))
else:
    print(f"❌ Error: {response.status_code}")
