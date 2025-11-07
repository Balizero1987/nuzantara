#!/usr/bin/env python3
"""
Test Llama 4 Scout Status & Performance
Test the current production deployment of Llama 4 Scout
"""

import requests
import time
import json
from datetime import datetime

def test_llama_scout_performance():
    """Test current Llama 4 Scout implementation with real queries"""
    
    print("🎯 LLAMA 4 SCOUT PERFORMANCE TEST")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Target: https://nuzantara-rag.fly.dev")
    print()
    
    # Test queries (real ZANTARA use cases)
    test_queries = [
        "What KBLI code for restaurant business?",
        "PT PMA minimum capital requirements?", 
        "KITAS working visa application steps?",
        "Tax obligations for new company?",
        "Hello, please tell me your AI model name"
    ]
    
    results = []
    
    for i, query in enumerate(test_queries, 1):
        print(f"🔍 TEST {i}: {query}")
        
        # Call streaming endpoint and measure performance
        url = "https://nuzantara-rag.fly.dev/bali-zero/chat-stream"
        params = {"query": query}
        
        start_time = time.time()
        
        try:
            # Stream response and capture first chunk time (TTFT)
            response = requests.get(url, params=params, stream=True, timeout=15)
            
            first_chunk_time = None
            total_response = ""
            chunk_count = 0
            
            for line in response.iter_lines(decode_unicode=True):
                if not line:
                    continue
                    
                # Track first data chunk (TTFT)
                if line.startswith("data:") and first_chunk_time is None:
                    first_chunk_time = time.time() - start_time
                    
                # Parse data chunks
                if line.startswith("data:"):
                    try:
                        data = json.loads(line[5:])  # Remove "data:" prefix
                        if "text" in data:
                            total_response += data["text"]
                            chunk_count += 1
                    except json.JSONDecodeError:
                        continue
                        
                # Stop after reasonable response
                if chunk_count > 20:  # Limit chunks for testing
                    break
                    
            total_time = time.time() - start_time
            
            result = {
                "query": query,
                "ttft_ms": round(first_chunk_time * 1000) if first_chunk_time else None,
                "total_time_ms": round(total_time * 1000),
                "response_length": len(total_response),
                "chunk_count": chunk_count,
                "response_preview": total_response[:100] + "..." if len(total_response) > 100 else total_response,
                "success": True
            }
            
            print(f"  ✅ TTFT: {result['ttft_ms']}ms")
            print(f"  ✅ Total: {result['total_time_ms']}ms")
            print(f"  ✅ Response: {result['response_length']} chars, {chunk_count} chunks")
            print(f"  ✅ Preview: {result['response_preview']}")
            
        except Exception as e:
            result = {
                "query": query,
                "error": str(e),
                "success": False
            }
            print(f"  ❌ Error: {e}")
            
        results.append(result)
        print()
        time.sleep(1)  # Polite delay
    
    # Summary statistics
    successful_tests = [r for r in results if r["success"]]
    
    if successful_tests:
        avg_ttft = sum(r["ttft_ms"] for r in successful_tests if r["ttft_ms"]) / len([r for r in successful_tests if r["ttft_ms"]])
        avg_total = sum(r["total_time_ms"] for r in successful_tests) / len(successful_tests)
        avg_length = sum(r["response_length"] for r in successful_tests) / len(successful_tests)
        
        print("📊 PERFORMANCE SUMMARY")
        print("-" * 30)
        print(f"Successful tests: {len(successful_tests)}/{len(test_queries)}")
        print(f"Average TTFT: {avg_ttft:.0f}ms")
        print(f"Average total time: {avg_total:.0f}ms") 
        print(f"Average response length: {avg_length:.0f} chars")
        print()
        
        # Compare to deployment report benchmarks
        print("📈 VS. DEPLOYMENT BENCHMARKS")
        print("-" * 30)
        print(f"Llama Scout TTFT (Nov 5): 882ms")
        print(f"Current TTFT: {avg_ttft:.0f}ms")
        
        if avg_ttft < 900:
            print("🎯 TTFT Performance: ✅ EXCELLENT (under 900ms)")
        elif avg_ttft < 1200:
            print("🎯 TTFT Performance: ⚠️  GOOD (under 1200ms)")
        else:
            print("🎯 TTFT Performance: ❌ SLOW (over 1200ms)")
            
        print()
        
    # Test health endpoint for AI status
    print("🏥 HEALTH CHECK")
    print("-" * 20)
    
    try:
        health_response = requests.get("https://nuzantara-rag.fly.dev/health", timeout=10)
        health_data = health_response.json()
        
        print(f"Service status: {health_data.get('status', 'unknown')}")
        print(f"AI available: {health_data.get('ai', {}).get('has_ai', False)}")
        print(f"Haiku available: {health_data.get('ai', {}).get('claude_haiku_available', False)}")
        
        # Check if Llama Scout logs are visible
        if 'llama' in str(health_data).lower() or 'scout' in str(health_data).lower():
            print("🔍 Llama Scout indicators found in health data")
        else:
            print("⚠️  No explicit Llama Scout indicators in health endpoint")
            
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        
    print()
    print("🔚 Test completed!")
    
    return results

if __name__ == "__main__":
    test_llama_scout_performance()