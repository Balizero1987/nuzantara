"""
ZANTARA RAG - Query Router
Intelligent routing between multiple ChromaDB collections based on query content
"""

from typing import Literal
import logging
import re

logger = logging.getLogger(__name__)

CollectionName = Literal["visa_oracle", "kbli_eye", "tax_genius", "legal_architect", "zantara_books"]


class QueryRouter:
    """
    3-Layer Routing System:
    1. Keyword matching (fast, <1ms) - handles 99% of queries
    2. Semantic analysis (future) - handles ambiguous queries
    3. LLM fallback (future) - handles edge cases

    Current implementation: Layer 1 (keyword-based routing)
    """

    # Domain-specific keywords for multi-collection routing
    VISA_KEYWORDS = [
        "visa", "b211", "b211a", "b211b", "c1", "c2", "c7", "d1", "d2", "d12",
        "e23", "e28", "e31", "e33", "e33g", "kitas", "kitap", "immigration", "imigrasi",
        "passport", "paspor", "sponsor", "stay permit", "tourist visa", "social visa",
        "work permit", "imta", "merp", "rptka", "voa", "visit visa", "golden visa",
        "second home", "retirement visa", "digital nomad", "investor visa",
        "permenkumham", "dirjen imigrasi"
    ]

    KBLI_KEYWORDS = [
        "kbli", "business classification", "klasifikasi baku", "oss", "nib",
        "risk-based", "berbasis risiko", "business license", "izin usaha",
        "standard industrial", "kode usaha", "sektor", "sector",
        "foreign ownership", "kepemilikan asing", "negative list", "dnpi",
        "business activity", "kegiatan usaha"
    ]

    TAX_KEYWORDS = [
        "tax", "pajak", "npwp", "pph", "ppn", "pbb", "spt", "tax reporting",
        "withholding tax", "vat", "income tax", "corporate tax", "fiscal",
        "djp", "direktorat jenderal pajak", "tax compliance", "e-faktur",
        "coretax", "tax amnesty", "transfer pricing", "tax treaty",
        "dividend tax", "carbon tax"
    ]

    LEGAL_KEYWORDS = [
        "pt pma", "pt", "pma", "foreign investment", "bkpm", "limited liability",
        "perseroan terbatas", "company formation", "incorporation", "deed",
        "akta", "notary", "notaris", "shareholder", "pemegang saham",
        "domicile", "domisili", "skdp", "business entity", "legal entity",
        "law", "hukum", "regulation", "peraturan", "legal compliance",
        "contract", "perjanjian", "property law", "marriage law"
    ]

    # Keywords that indicate philosophical/technical knowledge
    BOOKS_KEYWORDS = [
        # Philosophy
        "plato", "aristotle", "socrates", "philosophy", "filsafat",
        "republic", "ethics", "metaphysics", "guénon", "traditionalism",

        # Religious/Spiritual texts
        "zohar", "kabbalah", "mahabharata", "ramayana", "bhagavad gita",
        "rumi", "sufi", "dante", "divine comedy",

        # Indonesian Culture
        "geertz", "religion of java", "kartini", "anderson", "imagined communities",
        "javanese culture", "indonesian culture",

        # Computer Science
        "sicp", "design patterns", "code complete", "programming",
        "software engineering", "algorithms", "data structures",
        "recursion", "functional programming", "lambda calculus", "oop",

        # Machine Learning
        "machine learning", "deep learning", "neural networks", "ml", "ai theory",
        "probabilistic", "murphy", "goodfellow",

        # Literature
        "shakespeare", "homer", "iliad", "odyssey", "literature"
    ]

    def __init__(self):
        """Initialize the router"""
        logger.info("QueryRouter initialized (Layer 1: keyword-based)")

    def route(self, query: str) -> CollectionName:
        """
        Route query to appropriate collection (5-way routing).

        Args:
            query: User query text

        Returns:
            Collection name: visa_oracle, kbli_eye, tax_genius, legal_architect, or zantara_books
        """
        query_lower = query.lower()

        # Calculate scores for each domain
        visa_score = sum(1 for kw in self.VISA_KEYWORDS if kw in query_lower)
        kbli_score = sum(1 for kw in self.KBLI_KEYWORDS if kw in query_lower)
        tax_score = sum(1 for kw in self.TAX_KEYWORDS if kw in query_lower)
        legal_score = sum(1 for kw in self.LEGAL_KEYWORDS if kw in query_lower)
        books_score = sum(1 for kw in self.BOOKS_KEYWORDS if kw in query_lower)

        # Find highest scoring domain
        scores = {
            "visa_oracle": visa_score,
            "kbli_eye": kbli_score,
            "tax_genius": tax_score,
            "legal_architect": legal_score,
            "zantara_books": books_score
        }

        collection = max(scores, key=scores.get)

        # If no clear winner (all zeros), default to visa_oracle (most common query type)
        if scores[collection] == 0:
            collection = "visa_oracle"
            logger.info(f"🧭 Route: {collection} (default - no keyword matches)")
        else:
            logger.info(f"🧭 Route: {collection} (scores: visa={visa_score}, kbli={kbli_score}, tax={tax_score}, legal={legal_score}, books={books_score})")

        return collection

    def get_routing_stats(self, query: str) -> dict:
        """
        Get detailed routing analysis for debugging.

        Args:
            query: User query text

        Returns:
            Dictionary with routing analysis
        """
        query_lower = query.lower()

        # Find matching keywords
        bali_zero_matches = [kw for kw in self.BALI_ZERO_KEYWORDS if kw in query_lower]
        books_matches = [kw for kw in self.BOOKS_KEYWORDS if kw in query_lower]

        collection = self.route(query)

        return {
            "query": query,
            "selected_collection": collection,
            "bali_zero_score": len(bali_zero_matches),
            "books_score": len(books_matches),
            "bali_zero_matches": bali_zero_matches,
            "books_matches": books_matches,
            "routing_method": "keyword_layer_1"
        }
