#!/usr/bin/env python3
"""
Check RunPod deployments to find endpoint URLs
"""

import requests
import json
import os

# Use the API key you provided
API_KEY = "rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"

def check_runpod_endpoints():
    """Check for existing RunPod serverless endpoints"""
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Try to list endpoints
    try:
        # RunPod API endpoint for listing serverless endpoints
        response = requests.get(
            "https://api.runpod.io/graphql",
            headers=headers,
            json={
                "query": """
                query {
                    myself {
                        serverlessEndpoints {
                            id
                            name
                            modelName
                            status
                        }
                    }
                }
                """
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("🔍 RunPod Endpoints Found:")
            print("-" * 40)
            
            if 'data' in data and 'myself' in data['data']:
                endpoints = data['data']['myself'].get('serverlessEndpoints', [])
                if endpoints:
                    for endpoint in endpoints:
                        print(f"📦 Name: {endpoint.get('name', 'N/A')}")
                        print(f"   ID: {endpoint.get('id', 'N/A')}")
                        print(f"   Model: {endpoint.get('modelName', 'N/A')}")
                        print(f"   Status: {endpoint.get('status', 'N/A')}")
                        print(f"   URL: https://api.runpod.ai/v2/{endpoint.get('id')}/runsync")
                        print()
                else:
                    print("No serverless endpoints found.")
                    print("\n📝 You need to create RunPod endpoints for:")
                    print("1. ZANTARA Llama 3.1 (zeroai87/zantara-llama-3.1-8b-merged)")
                    print("2. DevAI Qwen 2.5 (zeroai87/devai-qwen-2.5-coder-7b)")
            else:
                print("Could not retrieve endpoint data.")
                print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error checking RunPod: {e}")
        print("\n📝 Manual check needed:")
        print("1. Go to https://www.runpod.io/console/serverless")
        print("2. Check your existing endpoints")
        print("3. Create endpoints if needed for ZANTARA and DevAI")

if __name__ == "__main__":
    print("🚀 Checking RunPod Deployments...")
    print("=" * 40)
    check_runpod_endpoints()
