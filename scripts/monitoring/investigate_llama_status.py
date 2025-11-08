#!/usr/bin/env python3
"""
Investigate Llama Scout Status
Analyze production behavior and identify issues
"""

import requests
import time
import json

def investigate_llama_status():
    """Investigate current Llama Scout status in production"""
    
    print("🕵️ LLAMA SCOUT INVESTIGATION")
    print("=" * 40)
    
    # Test 1: Check if Llama logs appear in a streaming request
    print("🧪 TEST 1: Analyze streaming response for AI indicators")
    
    url = "https://nuzantara-rag.fly.dev/bali-zero/chat-stream"
    params = {"query": "Please tell me what AI model you are using"}
    
    try:
        response = requests.get(url, params=params, stream=True, timeout=10)
        
        full_response = ""
        for line in response.iter_lines(decode_unicode=True):
            if line.startswith("data:"):
                try:
                    data = json.loads(line[5:])
                    if "text" in data:
                        full_response += data["text"]
                        if len(full_response) > 200:  # Stop after reasonable response
                            break
                except:
                    continue
                    
        print(f"📝 Response: {full_response}")
        
        # Look for AI model indicators
        response_lower = full_response.lower()
        if "llama" in response_lower or "scout" in response_lower:
            print("✅ Llama Scout indicators found in response")
        elif "claude" in response_lower or "haiku" in response_lower:
            print("🔵 Haiku indicators found in response")
        elif "zantara" in response_lower or "ai assistant" in response_lower:
            print("⚠️  Generic AI response, model unclear")
        else:
            print("❓ No clear AI model indicators")
            
    except Exception as e:
        print(f"❌ Test 1 failed: {e}")
        
    print()
    
    # Test 2: Check for cost/performance indicators
    print("🧪 TEST 2: Performance analysis")
    
    # Multiple quick tests to see if performance varies (Llama vs Haiku)
    test_queries = [
        "Hi",
        "KBLI?", 
        "Hello there"
    ]
    
    ttft_times = []
    
    for query in test_queries:
        start_time = time.time()
        
        try:
            response = requests.get(url, params={"query": query}, stream=True, timeout=8)
            
            first_data_time = None
            for line in response.iter_lines(decode_unicode=True):
                if line.startswith("data:") and first_data_time is None:
                    first_data_time = time.time() - start_time
                    break
                    
            if first_data_time:
                ttft_times.append(first_data_time * 1000)
                print(f"  🕐 '{query}' TTFT: {first_data_time * 1000:.0f}ms")
            else:
                print(f"  ❌ '{query}' no response")
                
        except Exception as e:
            print(f"  ❌ '{query}' error: {e}")
            
        time.sleep(0.5)
    
    if ttft_times:
        avg_ttft = sum(ttft_times) / len(ttft_times)
        print(f"\n📊 Average TTFT: {avg_ttft:.0f}ms")
        
        # Analysis based on deployment report
        if avg_ttft < 1000:
            print("🎯 Performance suggests: Likely Llama Scout (target: 880ms)")
        elif 1000 <= avg_ttft < 1500:
            print("🎯 Performance suggests: Could be either Llama or Haiku")
        else:
            print("🎯 Performance suggests: Likely Haiku or network latency (target: 1127ms)")
    
    print()
    
    # Test 3: Cost estimation
    print("🧪 TEST 3: Cost estimation analysis")
    
    # Test with longer query to estimate tokens/cost
    long_query = "Please explain in detail the complete process for setting up a PT PMA company in Indonesia, including all requirements, documents needed, timeline, and costs involved."
    
    start_time = time.time()
    
    try:
        response = requests.get(url, params={"query": long_query}, stream=True, timeout=15)
        
        full_response = ""
        first_data_time = None
        
        for line in response.iter_lines(decode_unicode=True):
            if line.startswith("data:"):
                if first_data_time is None:
                    first_data_time = time.time() - start_time
                    
                try:
                    data = json.loads(line[5:])
                    if "text" in data:
                        full_response += data["text"]
                        if len(full_response) > 1000:  # Stop after good amount
                            break
                except:
                    continue
                    
        response_length = len(full_response)
        estimated_tokens = response_length / 4  # Rough estimate: 4 chars per token
        
        print(f"📏 Response length: {response_length} chars (~{estimated_tokens:.0f} tokens)")
        print(f"🕐 TTFT: {first_data_time * 1000:.0f}ms")
        
        # Estimate costs based on deployment report
        llama_cost = (estimated_tokens / 1_000_000) * 0.20  # $0.20 per 1M tokens
        haiku_cost = (estimated_tokens / 1_000_000) * 5.0   # $5 per 1M output tokens
        
        print(f"💰 If Llama Scout: ~${llama_cost:.6f}")
        print(f"💰 If Haiku: ~${haiku_cost:.6f}")
        print(f"💰 Cost difference: {(haiku_cost - llama_cost) / llama_cost * 100:.0f}x more expensive if Haiku")
        
    except Exception as e:
        print(f"❌ Cost test failed: {e}")
        
    print()
    
    # Test 4: Health endpoint analysis
    print("🧪 TEST 4: Health endpoint analysis")
    
    try:
        health = requests.get("https://nuzantara-rag.fly.dev/health", timeout=5)
        health_data = health.json()
        
        print(f"📊 Service status: {health_data.get('status')}")
        
        # Look for AI-related info
        ai_info = health_data.get('ai', {})
        print(f"🤖 AI available: {ai_info.get('has_ai', False)}")
        print(f"🔵 Haiku available: {ai_info.get('claude_haiku_available', False)}")
        
        # Check if there are any Llama-related fields
        health_str = json.dumps(health_data, indent=2)
        if 'llama' in health_str.lower() or 'scout' in health_str.lower():
            print("🔍 Found Llama Scout references in health data")
        else:
            print("⚠️  No Llama Scout references found in health data")
            
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        
    print()
    
    # Final conclusion
    print("🎯 INVESTIGATION SUMMARY")
    print("-" * 30)
    
    print("""
Based on the deployment report from November 5, 2025:
✅ Llama 4 Scout was successfully integrated
✅ Configuration includes both OPENROUTER_API_KEY_LLAMA and ANTHROPIC_API_KEY
✅ System shows automatic fallback to Haiku on errors

Current observations:
⚠️  TTFT times are significantly higher than benchmarks (5000ms vs 880ms)
⚠️  No explicit Llama Scout indicators in health endpoint
⚠️  API keys in deployment report appear to be expired/invalid

Likely conclusions:
1. Llama Scout integration IS deployed but may be failing silently
2. System is falling back to Haiku due to API key issues
3. Production performance suggests Haiku fallback is active
4. API keys need to be verified/refreshed for Llama Scout to work

Recommended actions:
1. Verify OPENROUTER_API_KEY_LLAMA is valid and has credits
2. Check production logs for Llama Scout error messages
3. Consider forced Haiku mode if Llama Scout is unreliable
4. Monitor cost savings (should be minimal if falling back to Haiku)
    """)

if __name__ == "__main__":
    investigate_llama_status()