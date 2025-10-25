"""
Test Phase 1 on Railway Production
Tests RAG skip logic with full ChromaDB available
"""

import requests
import json
import time

# Railway backend URL
RAILWAY_URL = "https://scintillating-kindness-production-47e3.up.railway.app"

test_queries = [
    {
        "query": "Ciao",
        "expected_rag": False,
        "description": "Greeting - should skip RAG"
    },
    {
        "query": "Come stai?",
        "expected_rag": False,
        "description": "Casual - should skip RAG"
    },
    {
        "query": "What is KITAS?",
        "expected_rag": True,
        "description": "Business - should use RAG from ChromaDB"
    },
    {
        "query": "Quanto costa PT PMA?",
        "expected_rag": True,
        "description": "Pricing business query - should use RAG"
    }
]

def test_query(query, expected_rag, description):
    """Test a single query on Railway"""

    print(f"\n{'='*80}")
    print(f"📝 {description}")
    print(f"💬 Query: \"{query}\"")
    print(f"🎯 Expected RAG: {'YES' if expected_rag else 'NO'}")
    print(f"{'='*80}")

    try:
        response = requests.post(
            f"{RAILWAY_URL}/bali-zero/chat",
            json={
                "query": query,
                "user_email": "test@railway.com",
                "user_role": "member"
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()

            answer = data.get("response", "")
            used_rag = data.get("used_rag", False)
            model = data.get("model_used", "unknown")
            ai_used = data.get("ai_used", "unknown")

            # Check results
            rag_match = (used_rag == expected_rag)
            word_count = len(answer.split())

            print(f"\n📊 Results:")
            print(f"   Model: {model}")
            print(f"   AI: {ai_used}")
            print(f"   Used RAG: {used_rag} {'✅' if rag_match else '❌ MISMATCH!'}")
            print(f"   Words: {word_count}")

            # Check sanitization
            has_artifacts = any(marker in answer for marker in ["[PRICE]", "[MANDATORY]", "User:", "Assistant:"])
            print(f"   Sanitization: {'❌ FAIL' if has_artifacts else '✅ PASS'}")

            print(f"\n💬 Response Preview:")
            print(f"   {answer[:200]}{'...' if len(answer) > 200 else ''}")

            return {
                "success": True,
                "rag_match": rag_match,
                "used_rag": used_rag,
                "word_count": word_count,
                "clean": not has_artifacts
            }
        else:
            print(f"❌ HTTP {response.status_code}: {response.text[:200]}")
            return {"success": False}

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return {"success": False}


def main():
    print("\n" + "="*80)
    print("🧪 PHASE 1 RAILWAY PRODUCTION TEST")
    print("Testing RAG Skip Logic with ChromaDB")
    print("="*80)

    print(f"\n🔗 Backend: {RAILWAY_URL}")

    # Health check
    try:
        health = requests.get(f"{RAILWAY_URL}/health", timeout=5).json()
        print(f"✅ Backend Status: {health.get('status')}")
        print(f"   ChromaDB: {'✅' if health.get('chromadb') else '❌'}")
        print(f"   Claude Haiku: {'✅' if health.get('ai', {}).get('claude_haiku_available') else '❌'}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return

    # Run tests
    results = []
    for test in test_queries:
        result = test_query(test["query"], test["expected_rag"], test["description"])
        results.append(result)
        time.sleep(3)  # Rate limiting

    # Summary
    print(f"\n\n{'='*80}")
    print(f"📊 SUMMARY")
    print(f"{'='*80}")

    successful = sum(1 for r in results if r.get("success"))
    rag_correct = sum(1 for r in results if r.get("success") and r.get("rag_match"))
    clean = sum(1 for r in results if r.get("success") and r.get("clean"))

    print(f"\n✅ Successful: {successful}/{len(results)}")
    print(f"✅ RAG logic correct: {rag_correct}/{successful}")
    print(f"✅ Clean responses: {clean}/{successful}")

    if successful == len(results) and rag_correct == successful and clean == successful:
        print(f"\n🎉 ALL TESTS PASSED!")
        print(f"\n✨ Phase 1 Deployed Successfully:")
        print(f"   ✅ RAG skip for greetings/casual")
        print(f"   ✅ RAG enabled for business queries")
        print(f"   ✅ ChromaDB integration working")
        print(f"   ✅ Response sanitization working")
    else:
        print(f"\n⚠️ Some tests failed - review logs")


if __name__ == "__main__":
    main()
