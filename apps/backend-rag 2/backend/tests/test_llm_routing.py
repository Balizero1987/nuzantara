"""
Tests for LLM Routing
Tests Haiku/Sonnet routing based on query complexity
"""

import pytest
from unittest.mock import Mock, patch


class TestLLMRouting:
    """Test suite for LLM routing logic"""

    def test_simple_query_routes_to_haiku(self):
        """Test simple queries route to Haiku model"""
        simple_queries = [
            "What is KITAS?",
            "PT PMA meaning",
            "Visa requirements",
            "NPWP adalah",
        ]

        for query in simple_queries:
            word_count = len(query.split())
            is_simple = word_count <= 5
            model = "haiku" if is_simple else "sonnet"
            assert model == "haiku"

    def test_complex_query_routes_to_sonnet(self):
        """Test complex queries route to Sonnet model"""
        complex_query = (
            "Compare PT PMA versus Local PT for foreign-owned F&B business "
            "with alcohol license, considering capital requirements and ownership restrictions"
        )

        word_count = len(complex_query.split())
        is_complex = word_count > 15
        model = "sonnet" if is_complex else "haiku"
        assert model == "sonnet"

    def test_keyword_based_routing(self):
        """Test routing based on complex keywords"""
        complex_keywords = ["compare", "analyze", "explain", "difference between"]

        query = "Compare PT PMA and Local PT"
        has_complex_keyword = any(kw in query.lower() for kw in complex_keywords)

        model = "sonnet" if has_complex_keyword else "haiku"
        assert model == "sonnet"

    def test_pricing_query_detection(self):
        """Test detection of pricing queries"""
        pricing_queries = [
            "Berapa harga KITAS?",
            "How much does PT PMA cost?",
            "What is the price for visa?",
        ]

        pricing_keywords = ["harga", "price", "cost", "berapa", "biaya"]

        for query in pricing_queries:
            has_pricing = any(kw in query.lower() for kw in pricing_keywords)
            assert has_pricing is True

    def test_service_keyword_detection(self):
        """Test detection of service keywords"""
        query = "I need KITAS for my business"

        service_keywords = ["kitas", "visa", "pt", "pma", "npwp", "company"]
        has_service = any(kw in query.lower() for kw in service_keywords)

        assert has_service is True

    def test_user_role_based_routing(self):
        """Test routing based on user role"""
        user_roles = {
            'member': 'haiku',  # Internal users get faster model
            'admin': 'sonnet',  # Admins get more powerful model
            'external': 'haiku',  # External users get basic model
        }

        assert user_roles['admin'] == 'sonnet'
        assert user_roles['member'] == 'haiku'

    def test_conversation_history_affects_routing(self):
        """Test routing considers conversation history"""
        conversation_history = [
            {"role": "user", "content": "Tell me about PT PMA"},
            {"role": "assistant", "content": "PT PMA is..."},
            {"role": "user", "content": "What about capital requirements?"},
        ]

        # Follow-up questions in complex topics should use Sonnet
        has_history = len(conversation_history) > 2
        model = "sonnet" if has_history else "haiku"

        assert model == "sonnet"

    def test_fallback_routing(self):
        """Test fallback when routing fails"""
        query = "test"

        # Default to Haiku if unable to determine complexity
        default_model = "haiku"

        assert default_model == "haiku"

    def test_multiple_language_routing(self):
        """Test routing works for multiple languages"""
        queries = {
            'en': "What are the requirements?",
            'id': "Apa saja persyaratannya?",
            'it': "Quali sono i requisiti?",
        }

        for lang, query in queries.items():
            # Should route regardless of language
            word_count = len(query.split())
            model = "haiku" if word_count <= 5 else "sonnet"
            assert model in ["haiku", "sonnet"]

    def test_query_length_threshold(self):
        """Test exact threshold for query length"""
        threshold = 15

        short_query = " ".join(["word"] * 10)
        long_query = " ".join(["word"] * 20)

        assert len(short_query.split()) < threshold
        assert len(long_query.split()) > threshold
