#!/usr/bin/env python3
"""
DevAI HuggingFace Inference API Client
Usage: python3 ml/devai/hf_inference.py "Your question here"
"""

import os
import sys
import requests
import time
from typing import Optional

# Config
HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = "zeroai87/devai-qwen-2.5-coder-7b"
API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}"

def ask_devai(question: str, max_retries: int = 3) -> Optional[str]:
    """
    Ask DevAI a question using HuggingFace Inference API

    Args:
        question: The question to ask
        max_retries: Number of retries if model is loading

    Returns:
        The generated answer or None if failed
    """
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}

    # Format prompt in Qwen chat format
    prompt = f"""<|im_start|>system
You are DevAI, an expert code assistant for the NUZANTARA project.<|im_end|>
<|im_start|>user
{question}<|im_end|>
<|im_start|>assistant
"""

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 500,
            "temperature": 0.7,
            "top_p": 0.9,
            "do_sample": True,
            "return_full_text": False
        }
    }

    for attempt in range(max_retries):
        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=60)

            if response.status_code == 200:
                result = response.json()

                if isinstance(result, list) and len(result) > 0:
                    answer = result[0].get('generated_text', '')
                    # Clean up the response
                    answer = answer.split('<|im_end|>')[0].strip()
                    return answer
                elif isinstance(result, dict):
                    return result.get('generated_text', '').split('<|im_end|>')[0].strip()

            elif response.status_code == 503:
                # Model is loading
                error_data = response.json()
                estimated_time = error_data.get('estimated_time', 20)
                print(f"⏳ Model is loading... ETA: {estimated_time}s (attempt {attempt+1}/{max_retries})")
                time.sleep(estimated_time + 5)
                continue

            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                return None

        except requests.exceptions.Timeout:
            print(f"⏱️  Timeout (attempt {attempt+1}/{max_retries})")
            if attempt < max_retries - 1:
                time.sleep(5)
                continue
        except Exception as e:
            print(f"❌ Exception: {e}")
            return None

    return None

def calculate_cost(num_requests: int, avg_tokens: int = 200) -> dict:
    """
    Calculate estimated monthly cost

    Args:
        num_requests: Number of requests per day
        avg_tokens: Average tokens per response

    Returns:
        Dictionary with cost breakdown
    """
    # HuggingFace Inference API pricing: ~$0.06/hour for 7B model
    # Assuming ~10 requests/minute capacity = ~$0.0001/request
    cost_per_request = 0.0005  # Conservative estimate

    daily_cost = num_requests * cost_per_request
    monthly_cost = daily_cost * 30

    return {
        "requests_per_day": num_requests,
        "cost_per_request": f"${cost_per_request:.4f}",
        "daily_cost": f"${daily_cost:.2f}",
        "monthly_cost": f"${monthly_cost:.2f}",
        "yearly_cost": f"${monthly_cost * 12:.2f}"
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ml/devai/hf_inference.py 'Your question'")
        print("\nExamples:")
        print("  python3 ml/devai/hf_inference.py 'Come implemento un handler Instagram?'")
        print("  python3 ml/devai/hf_inference.py 'Spiega il reality-check middleware'")
        print("\nCost calculator:")
        print("  python3 ml/devai/hf_inference.py --cost 100  # 100 requests/day")
        sys.exit(1)

    if sys.argv[1] == "--cost":
        num_reqs = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        cost_info = calculate_cost(num_reqs)
        print("\n💰 COST ESTIMATE:")
        for key, value in cost_info.items():
            print(f"  {key}: {value}")
        sys.exit(0)

    question = " ".join(sys.argv[1:])

    print(f"🤖 DevAI Question: {question}\n")
    print("⏳ Generating answer...")

    start_time = time.time()
    answer = ask_devai(question)
    elapsed = time.time() - start_time

    if answer:
        print(f"\n✅ Answer (generated in {elapsed:.1f}s):\n")
        print(answer)
        print(f"\n🔗 Model: https://huggingface.co/{MODEL_ID}")
    else:
        print("\n❌ Failed to get answer from DevAI")
        sys.exit(1)
