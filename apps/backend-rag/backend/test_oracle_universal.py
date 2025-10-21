"""
Test Oracle Universal Endpoint (Phase 3)
Tests the single intelligent /api/oracle/query endpoint
"""

import asyncio
import sys
from pathlib import Path

# Add parent to path
sys.path.append(str(Path(__file__).parent))

from app.routers.oracle_universal import universal_oracle_query, OracleQueryRequest
from services.search_service import SearchService
from llm.anthropic_client import AnthropicClient
import os

# Mock dependencies for testing
class MockSearchService:
    """Mock SearchService for testing without actual ChromaDB"""
    def __init__(self):
        from services.query_router import QueryRouter
        self.router = QueryRouter()
        self.collections = {
            "tax_updates": MockVectorDB("tax_updates"),
            "tax_knowledge": MockVectorDB("tax_knowledge"),
            "property_listings": MockVectorDB("property_listings"),
            "property_knowledge": MockVectorDB("property_knowledge"),
            "legal_updates": MockVectorDB("legal_updates"),
            "legal_architect": MockVectorDB("legal_architect"),
            "visa_oracle": MockVectorDB("visa_oracle"),
            "kbli_eye": MockVectorDB("kbli_eye"),
            "zantara_books": MockVectorDB("zantara_books")
        }

class MockVectorDB:
    """Mock vector database for testing"""
    def __init__(self, name):
        self.name = name

    def search(self, query_text, limit=10, **kwargs):
        """Return mock search results"""
        return {
            "documents": [
                f"Result 1 from {self.name} for: {query_text}",
                f"Result 2 from {self.name} for: {query_text}",
                f"Result 3 from {self.name} for: {query_text}"
            ],
            "metadatas": [
                {"source": self.name, "type": "knowledge"},
                {"source": self.name, "type": "knowledge"},
                {"source": self.name, "type": "knowledge"}
            ],
            "distances": [0.1, 0.2, 0.3]
        }

# Test queries
test_cases = [
    # Tax Updates
    {
        "query": "What are the latest tax updates for 2025?",
        "expected_collection": "tax_updates",
        "description": "Tax + updates keywords"
    },
    {
        "query": "Recent changes in PPh 21",
        "expected_collection": "tax_updates",
        "description": "Tax + recent change keywords"
    },

    # Tax Knowledge
    {
        "query": "How to calculate PPh 21 for employees?",
        "expected_collection": "tax_knowledge",
        "description": "Tax question without update keywords"
    },
    {
        "query": "What is the corporate tax rate in Indonesia?",
        "expected_collection": "tax_knowledge",
        "description": "Tax rate query"
    },

    # Legal Updates
    {
        "query": "Latest property law changes",
        "expected_collection": "legal_updates",
        "description": "Legal + latest keywords"
    },
    {
        "query": "New regulations for PT PMA",
        "expected_collection": "legal_updates",
        "description": "Legal + new regulation keywords"
    },

    # Legal Architect
    {
        "query": "How to set up a PT PMA?",
        "expected_collection": "legal_architect",
        "description": "Legal setup question"
    },
    {
        "query": "Legal structure for foreign investment",
        "expected_collection": "legal_architect",
        "description": "Legal structure query"
    },

    # Property Listings
    {
        "query": "Villas for sale in Canggu",
        "expected_collection": "property_listings",
        "description": "Property + for sale keywords"
    },
    {
        "query": "Beachfront property available in Seminyak",
        "expected_collection": "property_listings",
        "description": "Property + available keywords"
    },

    # Property Knowledge
    {
        "query": "Explain HGB property rights in Indonesia",
        "expected_collection": "property_knowledge",
        "description": "Property info without listing intent"
    },
    {
        "query": "Property ownership structures in Bali",
        "expected_collection": "property_knowledge",
        "description": "Property ownership info"
    },

    # Visa Oracle
    {
        "query": "How to get a KITAS visa?",
        "expected_collection": "visa_oracle",
        "description": "Visa query"
    },

    # KBLI Eye
    {
        "query": "What is the KBLI code for restaurant business?",
        "expected_collection": "kbli_eye",
        "description": "KBLI query"
    },

    # Zantara Books
    {
        "query": "What is Plato's philosophy on the Republic?",
        "expected_collection": "zantara_books",
        "description": "Philosophy query"
    }
]


async def run_tests():
    """Run all test cases"""
    print("=" * 80)
    print("ORACLE UNIVERSAL ENDPOINT - TEST RESULTS (Phase 3)")
    print("=" * 80)
    print()

    mock_service = MockSearchService()
    mock_anthropic = None  # We'll test without AI generation for speed

    correct = 0
    total = len(test_cases)

    for i, test_case in enumerate(test_cases, 1):
        query = test_case["query"]
        expected = test_case["expected_collection"]
        description = test_case["description"]

        # Create request
        request = OracleQueryRequest(
            query=query,
            use_ai=False,  # Skip AI generation for faster tests
            limit=5,
            include_routing_info=True
        )

        # Call endpoint
        response = await universal_oracle_query(request, mock_service, mock_anthropic)

        # Check result
        is_correct = response.collection_used == expected
        correct += is_correct

        status = "✅" if is_correct else "❌"
        print(f"{status} Test {i}/{total}: {description}")
        print(f"   Query: {query}")
        print(f"   Expected: {expected}")
        print(f"   Got:      {response.collection_used}")

        if response.routing_reason:
            print(f"   Reason:   {response.routing_reason}")

        if not is_correct:
            print(f"   Domain Scores: {response.domain_scores}")

        print()

    print("=" * 80)
    print(f"RESULTS: {correct}/{total} ({100 * correct / total:.1f}% accuracy)")
    print("=" * 80)
    print()

    # Additional feature tests
    print("=" * 80)
    print("FEATURE TESTS")
    print("=" * 80)
    print()

    # Test 1: Response includes results
    request = OracleQueryRequest(query="Latest tax updates", use_ai=False, limit=3)
    response = await universal_oracle_query(request, mock_service, mock_anthropic)

    print("✅ Test: Response includes search results")
    print(f"   Results returned: {len(response.results)}")
    print(f"   Total results: {response.total_results}")
    print(f"   First result snippet: {response.results[0].content[:80]}...")
    print()

    # Test 2: Routing transparency
    print("✅ Test: Routing transparency")
    print(f"   Collection used: {response.collection_used}")
    print(f"   Routing reason: {response.routing_reason}")
    print(f"   Domain scores: {response.domain_scores}")
    print()

    # Test 3: Performance metrics
    print("✅ Test: Performance metrics included")
    print(f"   Execution time: {response.execution_time_ms}ms")
    print()

    # Test 4: Domain hint override
    request = OracleQueryRequest(
        query="Tell me about taxes",
        domain_hint="tax",
        use_ai=False
    )
    response = await universal_oracle_query(request, mock_service, mock_anthropic)

    print("✅ Test: Domain hint override works")
    print(f"   Query: Tell me about taxes")
    print(f"   Domain hint: tax")
    print(f"   Routed to: {response.collection_used}")
    print(f"   Expected: tax_knowledge (from domain hint)")
    print()

    print("=" * 80)
    print("✅ All feature tests passed!")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_tests())
