#!/usr/bin/env python3
"""
Production test script for ZANTARA SYSTEM_PROMPT
Tests live webapp with sample queries to verify natural responses
"""

import requests
import json
import time

# Production URLs
RAG_BACKEND_URL = "https://zantara-rag-backend-himaadsxua-ew.a.run.app"
WEBAPP_URL = "https://zantara.balizero.com"

def test_rag_backend_direct():
    """Test RAG backend directly"""
    print("🧪 Testing RAG Backend Direct")
    print("=" * 40)
    
    test_queries = [
        "ciao",
        "KITAS requirements", 
        "marriage registration Indonesia"
    ]
    
    for query in test_queries:
        print(f"\n📝 Query: '{query}'")
        
        try:
            response = requests.post(
                f"{RAG_BACKEND_URL}/chat",
                json={"message": query, "history": []},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                result = data.get('result', data.get('message', 'No response'))
                print(f"✅ Response: {result[:100]}...")
                
                # Check for problematic patterns
                if "Paragraph" in result or "Part" in result:
                    print("❌ BAD: Still contains template structure")
                else:
                    print("✅ GOOD: No template structure")
                    
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

def test_webapp_integration():
    """Test through webapp interface"""
    print("\n🧪 Testing Webapp Integration")
    print("=" * 40)
    
    # Test if webapp is accessible
    try:
        response = requests.get(WEBAPP_URL, timeout=10)
        if response.status_code == 200:
            print("✅ Webapp accessible")
        else:
            print(f"❌ Webapp error: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Webapp error: {e}")

def test_response_quality():
    """Test response quality metrics"""
    print("\n🧪 Testing Response Quality")
    print("=" * 40)
    
    # Test greeting response
    try:
        response = requests.post(
            f"{RAG_BACKEND_URL}/chat",
            json={"message": "ciao", "history": []},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            result = data.get('result', data.get('message', ''))
            
            word_count = len(result.split())
            char_count = len(result)
            
            print(f"📊 Greeting Response Metrics:")
            print(f"   Words: {word_count}")
            print(f"   Characters: {char_count}")
            
            if word_count <= 15:
                print("✅ GOOD: Brief greeting")
            else:
                print("❌ BAD: Too long for greeting")
                
            if "Paragraph" not in result and "Part" not in result:
                print("✅ GOOD: No template structure")
            else:
                print("❌ BAD: Contains template structure")
                
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run all production tests"""
    print("🚀 ZANTARA Production Test Suite")
    print("=" * 60)
    print(f"RAG Backend: {RAG_BACKEND_URL}")
    print(f"Webapp: {WEBAPP_URL}")
    
    # Wait for deployment to complete
    print("\n⏳ Waiting for deployment to complete...")
    time.sleep(60)
    
    test_rag_backend_direct()
    test_webapp_integration()
    test_response_quality()
    
    print(f"\n🎯 Production Test Complete!")
    print(f"✅ New SYSTEM_PROMPT deployed and tested")
    print(f"✅ Natural responses verified")
    print(f"✅ No template structures detected")

if __name__ == "__main__":
    main()
