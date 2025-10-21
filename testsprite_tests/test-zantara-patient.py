#!/usr/bin/env python3
"""Patient test - wait up to 60 seconds for result"""

import requests
import json
import time

RUNPOD_ENDPOINT_BASE = "https://api.runpod.ai/v2/itz2q5gmid4cyt"
RUNPOD_API_KEY = "rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"

print("🧪 PATIENT TEST - Wait up to 60s for result\n")

# Submit
print("📤 Submitting: 'Ciao!'")
submit_response = requests.post(
    f"{RUNPOD_ENDPOINT_BASE}/run",
    headers={
        "Authorization": f"Bearer {RUNPOD_API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "input": {
            "prompt": "You are ZANTARA, a friendly AI. User: Ciao! Assistant:",
            "sampling_params": {"max_tokens": 100, "temperature": 0.7}
        }
    },
    timeout=10
)

if submit_response.status_code != 200:
    print(f"❌ Submit failed: {submit_response.text}")
    exit(1)

job_id = submit_response.json().get("id")
print(f"✅ Job ID: {job_id}\n")

# Poll
print("⏳ Polling every 5 seconds (max 60s)...")
start = time.time()

for i in range(12):  # 12 * 5s = 60s max
    elapsed = time.time() - start

    status_response = requests.get(
        f"{RUNPOD_ENDPOINT_BASE}/status/{job_id}",
        headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"},
        timeout=10
    )

    data = status_response.json()
    status = data.get("status")

    print(f"   [{i+1}/12] {elapsed:.1f}s - Status: {status}")

    if status == "COMPLETED":
        print(f"\n✅ COMPLETED after {elapsed:.1f}s!\n")
        print("📄 Full output:")
        print(json.dumps(data.get("output"), indent=2))

        # Try to extract text
        output = data.get("output")
        if isinstance(output, list) and len(output) > 0:
            if isinstance(output[0], dict) and output[0].get("choices"):
                text = output[0]["choices"][0].get("text", "")
                print(f"\n🤖 ZANTARA says:")
                print(f"{'='*70}")
                print(text)
                print(f"{'='*70}")
        break

    elif status == "FAILED":
        print(f"\n❌ FAILED: {data.get('error')}")
        break

    time.sleep(5)
else:
    print(f"\n⏱️  Still not ready after 60s - workers are very slow or inactive")
