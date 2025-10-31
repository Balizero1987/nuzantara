"""
Test ZANTARA Bali Zero Identity Online
Test against production at zantara.balizero.com
"""
import requests
import json
import time

# Production endpoints
WEBAPP_URL = "https://zantara.balizero.com"
RAG_BACKEND_URL = "https://nuzantara-rag.fly.dev"

def test_bali_zero_identity():
    """Test that ZANTARA mentions Bali Zero in greetings"""
    
    print("=" * 80)
    print("TESTING BALI ZERO IDENTITY - PRODUCTION")
    print("=" * 80)
    print(f"\n📍 Testing against: {RAG_BACKEND_URL}")
    print(f"🌐 Webapp: {WEBAPP_URL}\n")
    
    # Test cases - greetings in different languages
    test_cases = [
        {
            "language": "Italian",
            "query": "Ciao!",
            "expected_keywords": ["ZANTARA", "Bali Zero", "balizero"],
            "description": "Italian greeting"
        },
        {
            "language": "English",
            "query": "Hello! Who are you?",
            "expected_keywords": ["ZANTARA", "Bali Zero", "AI"],
            "description": "English identity question"
        },
        {
            "language": "Italian",
            "query": "Come stai?",
            "expected_keywords": ["bene", "Bali Zero"],
            "description": "Italian casual question"
        },
        {
            "language": "English",
            "query": "What is ZANTARA?",
            "expected_keywords": ["Bali Zero", "cultural", "AI", "Indonesia"],
            "description": "Identity question"
        }
    ]
    
    # Test each case
    results = []
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'=' * 80}")
        print(f"TEST {i}/{len(test_cases)}: {test['description']}")
        print(f"Language: {test['language']}")
        print(f"Query: \"{test['query']}\"")
        print(f"{'=' * 80}")
        
        try:
            # Call RAG backend
            response = requests.post(
                f"{RAG_BACKEND_URL}/bali-zero/chat",
                json={
                    "query": test["query"],
                    "conversation_history": [],
                    "user_role": "client"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                zantara_response = data.get("response", "")
                
                print(f"\n✅ Response received:")
                print(f"   Model: {data.get('model_used', 'unknown')}")
                print(f"   AI: {data.get('ai_used', 'unknown')}")
                print(f"\n📝 ZANTARA says:")
                print(f"   \"{zantara_response}\"")
                
                # Check for Bali Zero mention
                bali_zero_mentioned = any(
                    keyword.lower() in zantara_response.lower() 
                    for keyword in ["bali zero", "balizero"]
                )
                
                # Check for expected keywords
                keywords_found = []
                keywords_missing = []
                for keyword in test["expected_keywords"]:
                    if keyword.lower() in zantara_response.lower():
                        keywords_found.append(keyword)
                    else:
                        keywords_missing.append(keyword)
                
                print(f"\n🔍 Identity Check:")
                if bali_zero_mentioned:
                    print(f"   ✅ Bali Zero mentioned")
                else:
                    print(f"   ❌ Bali Zero NOT mentioned")
                
                print(f"\n🔍 Keywords:")
                print(f"   ✅ Found: {', '.join(keywords_found) if keywords_found else 'none'}")
                if keywords_missing:
                    print(f"   ❌ Missing: {', '.join(keywords_missing)}")
                
                # Determine test result
                test_passed = bali_zero_mentioned and len(keywords_found) >= len(test["expected_keywords"]) / 2
                
                results.append({
                    "test": test["description"],
                    "passed": test_passed,
                    "bali_zero_mentioned": bali_zero_mentioned,
                    "response": zantara_response[:200] + "..." if len(zantara_response) > 200 else zantara_response
                })
                
                if test_passed:
                    print(f"\n🎉 TEST PASSED")
                else:
                    print(f"\n⚠️  TEST FAILED")
                    
            else:
                print(f"\n❌ Error: HTTP {response.status_code}")
                print(f"   {response.text}")
                results.append({
                    "test": test["description"],
                    "passed": False,
                    "error": f"HTTP {response.status_code}"
                })
                
        except Exception as e:
            print(f"\n❌ Exception: {e}")
            results.append({
                "test": test["description"],
                "passed": False,
                "error": str(e)
            })
        
        # Wait between tests
        if i < len(test_cases):
            time.sleep(2)
    
    # Summary
    print(f"\n{'=' * 80}")
    print("TEST SUMMARY")
    print(f"{'=' * 80}")
    
    passed_tests = sum(1 for r in results if r.get("passed", False))
    total_tests = len(results)
    
    print(f"\n📊 Results: {passed_tests}/{total_tests} tests passed")
    
    for i, result in enumerate(results, 1):
        status = "✅ PASS" if result.get("passed", False) else "❌ FAIL"
        print(f"\n{i}. {result['test']}: {status}")
        if "bali_zero_mentioned" in result:
            print(f"   Bali Zero mentioned: {'Yes' if result['bali_zero_mentioned'] else 'No'}")
        if "response" in result:
            print(f"   Response preview: {result['response'][:100]}...")
        if "error" in result:
            print(f"   Error: {result['error']}")
    
    print(f"\n{'=' * 80}")
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED!")
        print("✅ ZANTARA correctly identifies as Bali Zero's AI")
    elif passed_tests > total_tests / 2:
        print("⚠️  PARTIAL SUCCESS")
        print(f"   {passed_tests}/{total_tests} tests passed")
    else:
        print("❌ TESTS FAILED")
        print("   ZANTARA not consistently mentioning Bali Zero")
    print(f"{'=' * 80}\n")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    print("\n⏳ Waiting for Fly.io deployment to complete...")
    print("   (This may take 2-3 minutes)\n")
    
    # Wait for deployment
    time.sleep(60)
    
    # Run tests
    success = test_bali_zero_identity()
    
    exit(0 if success else 1)
