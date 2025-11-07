#!/usr/bin/env python3
"""
Test della nuova chiave OpenRouter per Llama 4 Scout
"""

import requests
import time
import json

def test_openrouter_key():
    """Test della nuova chiave OpenRouter"""
    
    print("🔑 TESTING NEW OPENROUTER KEY")
    print("=" * 40)
    
    # La nuova chiave
    api_key = "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"
    
    print(f"🔍 Key: {api_key[:20]}...")
    print()
    
    # Test 1: Basic authentication test
    print("🧪 TEST 1: Authentication Check")
    
    try:
        # Test endpoint per controllare l'autenticazione
        auth_response = requests.get(
            "https://openrouter.ai/api/v1/auth/check",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10
        )
        
        print(f"Auth Status: {auth_response.status_code}")
        if auth_response.status_code == 200:
            print("✅ Authentication: SUCCESS")
            auth_data = auth_response.json()
            print(f"Credit balance: {auth_data.get('credit_balance', 'unknown')}")
        else:
            print(f"❌ Authentication: FAILED - {auth_response.status_code}")
            print(f"Response: {auth_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Authentication test failed: {e}")
        return False
    
    print()
    
    # Test 2: Model availability check
    print("🧪 TEST 2: Llama 4 Scout Model Test")
    
    try:
        start_time = time.time()
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "meta-llama/llama-4-scout",
                "messages": [
                    {"role": "user", "content": "Hello! Please tell me what AI model you are and respond briefly."}
                ],
                "max_tokens": 100,
                "temperature": 0.7
            },
            timeout=15
        )
        
        response_time = time.time() - start_time
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Time: {response_time:.3f}s")
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract response text
            if 'choices' in data and len(data['choices']) > 0:
                ai_response = data['choices'][0]['message']['content']
                print(f"✅ Model Response: {ai_response}")
                
                # Check usage/cost info
                if 'usage' in data:
                    usage = data['usage']
                    print(f"📊 Token Usage: {usage}")
                    
                    # Estimate cost (Llama 4 Scout: $0.20 per 1M tokens input/output)
                    if 'total_tokens' in usage:
                        total_tokens = usage['total_tokens']
                        estimated_cost = (total_tokens / 1_000_000) * 0.20
                        print(f"💰 Estimated Cost: ${estimated_cost:.6f}")
                
                print("✅ Llama 4 Scout: SUCCESS")
                
                # Check if response indicates it's actually Llama vs fallback
                response_lower = ai_response.lower()
                if 'llama' in response_lower:
                    print("🎯 Response indicates: LLAMA MODEL")
                elif 'claude' in response_lower or 'anthropic' in response_lower:
                    print("⚠️ Response indicates: CLAUDE FALLBACK")
                else:
                    print("❓ Response model: UNCLEAR")
                    
                return True
            else:
                print("❌ No response content received")
                return False
                
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False
    
    print()
    
    # Test 3: Streaming test (similar to production)
    print("🧪 TEST 3: Streaming Test")
    
    try:
        start_time = time.time()
        first_chunk_time = None
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "meta-llama/llama-4-scout",
                "messages": [
                    {"role": "user", "content": "Count from 1 to 5 with explanation"}
                ],
                "max_tokens": 200,
                "temperature": 0.7,
                "stream": True
            },
            stream=True,
            timeout=20
        )
        
        print(f"Stream Status: {response.status_code}")
        
        if response.status_code == 200:
            full_response = ""
            chunk_count = 0
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        if first_chunk_time is None:
                            first_chunk_time = time.time() - start_time
                            print(f"⚡ TTFT (Time To First Token): {first_chunk_time * 1000:.0f}ms")
                        
                        if line == 'data: [DONE]':
                            break
                            
                        try:
                            data = json.loads(line[6:])  # Remove "data: " prefix
                            if 'choices' in data and len(data['choices']) > 0:
                                delta = data['choices'][0].get('delta', {})
                                if 'content' in delta:
                                    content = delta['content']
                                    full_response += content
                                    chunk_count += 1
                        except json.JSONDecodeError:
                            continue
            
            total_time = time.time() - start_time
            
            print(f"✅ Streaming: SUCCESS")
            print(f"📊 Total Time: {total_time:.3f}s")
            print(f"📊 Chunks Received: {chunk_count}")
            print(f"📊 Response Length: {len(full_response)} chars")
            print(f"📝 Response Preview: {full_response[:100]}...")
            
            # Performance analysis
            if first_chunk_time and first_chunk_time * 1000 < 1000:
                print("🎯 TTFT Performance: ✅ EXCELLENT (<1000ms)")
            elif first_chunk_time and first_chunk_time * 1000 < 1500:
                print("🎯 TTFT Performance: ⚠️ GOOD (<1500ms)")
            else:
                print("🎯 TTFT Performance: ❌ SLOW (>1500ms)")
            
            return True
        else:
            print(f"❌ Streaming failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Streaming test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_openrouter_key()
    
    print()
    print("🎯 SUMMARY")
    print("-" * 20)
    
    if success:
        print("✅ NEW OPENROUTER KEY: WORKING")
        print("✅ Llama 4 Scout: ACCESSIBLE")
        print("✅ Ready for production deployment")
        print()
        print("🚀 NEXT STEPS:")
        print("1. flyctl secrets set OPENROUTER_API_KEY_LLAMA=sk-or-v1-5bc... -a nuzantara-rag")
        print("2. flyctl deploy -a nuzantara-rag --remote-only")
        print("3. Test production: curl https://nuzantara-rag.fly.dev/bali-zero/chat-stream?query=test")
    else:
        print("❌ NEW OPENROUTER KEY: NOT WORKING")
        print("❌ Check key validity and credits")
        print("❌ DO NOT deploy to production")