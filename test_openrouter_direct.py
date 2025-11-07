#!/usr/bin/env python3
"""
Test diretto OpenRouter per Llama 4 Scout
"""

import requests
import time
import json

def test_openrouter_direct():
    """Test diretto del modello Llama 4 Scout"""
    
    print("🔑 DIRECT OPENROUTER TEST")
    print("=" * 35)
    
    # La nuova chiave
    api_key = "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"
    
    print(f"🔍 Testing key: {api_key[:20]}...")
    print()
    
    # Test diretto del modello
    print("🧪 TESTING LLAMA 4 SCOUT MODEL")
    
    try:
        start_time = time.time()
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nuzantara-rag.fly.dev",  # Optional
                "X-Title": "ZANTARA Test"  # Optional
            },
            json={
                "model": "meta-llama/llama-4-scout",
                "messages": [
                    {"role": "user", "content": "Hello! Please tell me what AI model you are. Respond briefly."}
                ],
                "max_tokens": 150,
                "temperature": 0.7
            },
            timeout=30
        )
        
        response_time = time.time() - start_time
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"⏱️  Response Time: {response_time:.3f}s")
        print()
        
        if response.status_code == 200:
            data = response.json()
            
            # Stampa la risposta completa per debug
            print("📋 Full Response:")
            print(json.dumps(data, indent=2)[:500] + "...")
            print()
            
            # Extract response text
            if 'choices' in data and len(data['choices']) > 0:
                ai_response = data['choices'][0]['message']['content']
                print(f"✅ AI Response: {ai_response}")
                print()
                
                # Check usage/cost info
                if 'usage' in data:
                    usage = data['usage']
                    print(f"📊 Token Usage:")
                    print(f"   Input: {usage.get('prompt_tokens', 0)} tokens")
                    print(f"   Output: {usage.get('completion_tokens', 0)} tokens") 
                    print(f"   Total: {usage.get('total_tokens', 0)} tokens")
                    
                    # Estimate cost (Llama 4 Scout: $0.20 per 1M tokens)
                    total_tokens = usage.get('total_tokens', 0)
                    estimated_cost = (total_tokens / 1_000_000) * 0.20
                    print(f"💰 Estimated Cost: ${estimated_cost:.6f}")
                    print()
                
                # Check model info
                if 'model' in data:
                    print(f"🤖 Model Used: {data['model']}")
                else:
                    print("🤖 Model: Not specified in response")
                
                # Analyze response content
                response_lower = ai_response.lower()
                if 'llama' in response_lower:
                    print("🎯 Response Analysis: ✅ LLAMA MODEL")
                elif 'claude' in response_lower or 'anthropic' in response_lower:
                    print("🎯 Response Analysis: ❌ CLAUDE FALLBACK")
                else:
                    print("🎯 Response Analysis: ❓ MODEL UNCLEAR")
                    
                return True
            else:
                print("❌ No response content found")
                return False
                
        else:
            print(f"❌ Request failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"📋 Error Response:")
                print(json.dumps(error_data, indent=2))
            except:
                print(f"📋 Raw Error: {response.text[:500]}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = test_openrouter_direct()
    
    print()
    print("🎯 RESULT")
    print("-" * 15)
    
    if success:
        print("✅ OPENROUTER KEY: WORKING")
        print("✅ Llama 4 Scout: ACCESSIBLE")
        print()
        print("🚀 Ready to deploy to production!")
    else:
        print("❌ OPENROUTER KEY: FAILED") 
        print("❌ Check key or credits")
        print()
        print("⚠️  Do NOT deploy to production")