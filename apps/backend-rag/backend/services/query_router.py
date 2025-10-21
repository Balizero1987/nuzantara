"""
ZANTARA RAG - Query Router
Intelligent routing between multiple ChromaDB collections based on query content
"""

from typing import Literal
import logging
import re

logger = logging.getLogger(__name__)

# Phase 2: Extended collection support (5 → 9 collections with Oracle)
CollectionName = Literal[
    "visa_oracle", "kbli_eye", "tax_genius", "legal_architect", "zantara_books",
    "tax_updates", "tax_knowledge", "property_listings", "property_knowledge", "legal_updates"
]


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

    # Phase 2: Property-related keywords (for property_listings & property_knowledge)
    PROPERTY_KEYWORDS = [
        "property", "properti", "villa", "land", "tanah", "house", "rumah",
        "apartment", "apartemen", "real estate", "listing", "for sale", "dijual",
        "lease", "sewa", "rent", "rental", "leasehold", "freehold", "hak milik",
        "hak pakai", "hak guna bangunan", "hgb", "strata title", "imb",
        "building permit", "beachfront", "ocean view", "canggu", "seminyak",
        "ubud", "sanur", "nusa dua", "jimbaran", "uluwatu", "pererenan",
        "investment property", "development", "land bank", "zoning", "setback",
        "due diligence", "title deed", "sertipikat", "ownership structure"
    ]

    # Phase 2: Update/news keywords (for tax_updates & legal_updates)
    UPDATE_KEYWORDS = [
        "update", "updates", "pembaruan", "recent", "terbaru", "latest", "new",
        "news", "berita", "announcement", "pengumuman", "change", "perubahan",
        "amendment", "revisi", "revision", "effective date", "berlaku",
        "regulation update", "policy change", "what's new", "latest news"
    ]

    # Consolidated high-signal keywords frequently used by Bali Zero users
    # Used for lightweight diagnostics in get_routing_stats()
    BALI_ZERO_KEYWORDS = [
        # Core brands/terms
        "bali", "zero", "bali zero", "zantara",
        # Immigration
        "visa", "kitas", "kitap", "imigrasi", "immigration",
        # Business/KBLI
        "kbli", "oss", "nib", "pt pma", "bkpm",
        # Tax
        "tax", "pajak", "npwp", "pph", "ppn",
        # Legal
        "legal", "notary", "notaris", "akta"
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
        logger.info("QueryRouter initialized (Layer 1: keyword-based, Phase 2: 9-way routing with Oracle)")

    def route(self, query: str) -> CollectionName:
        """
        Route query to appropriate collection (9-way intelligent routing - Phase 2).

        Routing Logic:
        1. Calculate domain scores (visa, kbli, tax, legal, property, books)
        2. Calculate modifier scores (updates)
        3. Intelligent sub-routing:
           - tax + updates → tax_updates
           - tax + no updates → tax_knowledge
           - legal + updates → legal_updates
           - legal + no updates → legal_architect
           - property + listing keywords → property_listings
           - property + no listing → property_knowledge
           - visa → visa_oracle
           - kbli → kbli_eye
           - books → zantara_books

        Args:
            query: User query text

        Returns:
            Collection name from 9 available collections
        """
        query_lower = query.lower()

        # Calculate domain scores
        visa_score = sum(1 for kw in self.VISA_KEYWORDS if kw in query_lower)
        kbli_score = sum(1 for kw in self.KBLI_KEYWORDS if kw in query_lower)
        tax_score = sum(1 for kw in self.TAX_KEYWORDS if kw in query_lower)
        legal_score = sum(1 for kw in self.LEGAL_KEYWORDS if kw in query_lower)
        property_score = sum(1 for kw in self.PROPERTY_KEYWORDS if kw in query_lower)
        books_score = sum(1 for kw in self.BOOKS_KEYWORDS if kw in query_lower)

        # Calculate modifier scores
        update_score = sum(1 for kw in self.UPDATE_KEYWORDS if kw in query_lower)

        # Determine primary domain
        domain_scores = {
            "visa": visa_score,
            "kbli": kbli_score,
            "tax": tax_score,
            "legal": legal_score,
            "property": property_score,
            "books": books_score
        }

        primary_domain = max(domain_scores, key=domain_scores.get)
        primary_score = domain_scores[primary_domain]

        # Intelligent sub-routing based on primary domain + modifiers
        if primary_score == 0:
            # No matches - default to visa_oracle
            collection = "visa_oracle"
            logger.info(f"🧭 Route: {collection} (default - no keyword matches)")
        elif primary_domain == "tax":
            # Tax domain: route to updates vs knowledge
            if update_score > 0:
                collection = "tax_updates"
                logger.info(f"🧭 Route: {collection} (tax + updates: tax={tax_score}, update={update_score})")
            else:
                collection = "tax_knowledge"
                logger.info(f"🧭 Route: {collection} (tax knowledge: tax={tax_score})")
        elif primary_domain == "legal":
            # Legal domain: route to updates vs general legal_architect
            if update_score > 0:
                collection = "legal_updates"
                logger.info(f"🧭 Route: {collection} (legal + updates: legal={legal_score}, update={update_score})")
            else:
                collection = "legal_architect"
                logger.info(f"🧭 Route: {collection} (legal general: legal={legal_score})")
        elif primary_domain == "property":
            # Property domain: route to listings vs knowledge
            listing_keywords = ["for sale", "dijual", "listing", "available", "rent", "sewa", "lease"]
            has_listing_intent = any(kw in query_lower for kw in listing_keywords)
            if has_listing_intent:
                collection = "property_listings"
                logger.info(f"🧭 Route: {collection} (property listings: property={property_score})")
            else:
                collection = "property_knowledge"
                logger.info(f"🧭 Route: {collection} (property knowledge: property={property_score})")
        elif primary_domain == "visa":
            collection = "visa_oracle"
            logger.info(f"🧭 Route: {collection} (visa: score={visa_score})")
        elif primary_domain == "kbli":
            collection = "kbli_eye"
            logger.info(f"🧭 Route: {collection} (kbli: score={kbli_score})")
        else:  # books
            collection = "zantara_books"
            logger.info(f"🧭 Route: {collection} (books: score={books_score})")

        return collection

    def get_routing_stats(self, query: str) -> dict:
        """
        Get detailed routing analysis for debugging (Phase 2: extended with Oracle domains).

        Args:
            query: User query text

        Returns:
            Dictionary with routing analysis including all domain scores
        """
        query_lower = query.lower()

        # Calculate all domain scores
        visa_score = sum(1 for kw in self.VISA_KEYWORDS if kw in query_lower)
        kbli_score = sum(1 for kw in self.KBLI_KEYWORDS if kw in query_lower)
        tax_score = sum(1 for kw in self.TAX_KEYWORDS if kw in query_lower)
        legal_score = sum(1 for kw in self.LEGAL_KEYWORDS if kw in query_lower)
        property_score = sum(1 for kw in self.PROPERTY_KEYWORDS if kw in query_lower)
        books_score = sum(1 for kw in self.BOOKS_KEYWORDS if kw in query_lower)
        update_score = sum(1 for kw in self.UPDATE_KEYWORDS if kw in query_lower)

        # Find matching keywords
        visa_matches = [kw for kw in self.VISA_KEYWORDS if kw in query_lower]
        kbli_matches = [kw for kw in self.KBLI_KEYWORDS if kw in query_lower]
        tax_matches = [kw for kw in self.TAX_KEYWORDS if kw in query_lower]
        legal_matches = [kw for kw in self.LEGAL_KEYWORDS if kw in query_lower]
        property_matches = [kw for kw in self.PROPERTY_KEYWORDS if kw in query_lower]
        books_matches = [kw for kw in self.BOOKS_KEYWORDS if kw in query_lower]
        update_matches = [kw for kw in self.UPDATE_KEYWORDS if kw in query_lower]

        collection = self.route(query)

        return {
            "query": query,
            "selected_collection": collection,
            "domain_scores": {
                "visa": visa_score,
                "kbli": kbli_score,
                "tax": tax_score,
                "legal": legal_score,
                "property": property_score,
                "books": books_score
            },
            "modifier_scores": {
                "updates": update_score
            },
            "matched_keywords": {
                "visa": visa_matches,
                "kbli": kbli_matches,
                "tax": tax_matches,
                "legal": legal_matches,
                "property": property_matches,
                "books": books_matches,
                "updates": update_matches
            },
            "routing_method": "keyword_layer_1_phase_2",
            "total_matches": visa_score + kbli_score + tax_score + legal_score + property_score + books_score
        }
