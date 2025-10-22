"""
ZANTARA RAG - Query Router
Intelligent routing between multiple ChromaDB collections based on query content

Phase 3 Enhancement: Smart Fallback Chain Agent
- Confidence scoring for routing decisions
- Automatic fallback to secondary collections when confidence is low
- Configurable fallback chains per domain
- Detailed logging and metrics
"""

from typing import Literal, Tuple, Optional, List
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

    # Phase 3: Smart Fallback Chains
    # Define fallback priority for each primary collection
    # Format: primary_collection -> [fallback1, fallback2, fallback3]
    FALLBACK_CHAINS = {
        "visa_oracle": ["legal_architect", "tax_genius", "property_knowledge"],
        "kbli_eye": ["legal_architect", "tax_knowledge", "visa_oracle"],
        "tax_knowledge": ["tax_updates", "legal_architect", "kbli_eye"],
        "tax_updates": ["tax_knowledge", "legal_updates", "legal_architect"],
        "legal_architect": ["legal_updates", "kbli_eye", "tax_genius"],
        "legal_updates": ["legal_architect", "tax_updates", "visa_oracle"],
        "property_knowledge": ["property_listings", "legal_architect", "visa_oracle"],
        "property_listings": ["property_knowledge", "legal_architect", "tax_knowledge"],
        "zantara_books": ["visa_oracle"]  # Books is standalone, default fallback
    }

    # Confidence thresholds
    CONFIDENCE_THRESHOLD_HIGH = 0.7  # High confidence - use primary only
    CONFIDENCE_THRESHOLD_LOW = 0.3   # Low confidence - try up to 3 fallbacks

    def __init__(self):
        """Initialize the router with fallback chain support"""
        logger.info("QueryRouter initialized (Phase 3: Smart Fallback Chain Agent enabled)")
        self.fallback_stats = {
            "total_routes": 0,
            "high_confidence": 0,
            "medium_confidence": 0,
            "low_confidence": 0,
            "fallbacks_used": 0
        }

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

    def calculate_confidence(self, query: str, domain_scores: dict) -> float:
        """
        Calculate confidence score for routing decision (Phase 3).

        Confidence factors:
        - Keyword match strength (primary factor)
        - Query length (longer = more context = higher confidence)
        - Domain specificity (clear winner vs. tie)

        Args:
            query: User query text
            domain_scores: Dictionary of domain scores from routing

        Returns:
            Confidence score between 0.0 and 1.0
        """
        # Get max score and total matches
        max_score = max(domain_scores.values())
        total_matches = sum(domain_scores.values())

        # Factor 1: Match strength (0.0 - 0.6)
        # 0 matches = 0.0, 1-2 matches = 0.3, 3-4 matches = 0.5, 5+ = 0.6
        if max_score == 0:
            match_confidence = 0.0
        elif max_score <= 2:
            match_confidence = 0.2 + (max_score * 0.1)
        elif max_score <= 4:
            match_confidence = 0.4 + ((max_score - 2) * 0.05)
        else:
            match_confidence = 0.6

        # Factor 2: Query length (0.0 - 0.2)
        # Short queries (<10 words) = lower confidence
        word_count = len(query.split())
        if word_count < 5:
            length_confidence = 0.0
        elif word_count < 10:
            length_confidence = 0.1
        else:
            length_confidence = 0.2

        # Factor 3: Domain specificity (0.0 - 0.2)
        # Clear winner (max >> others) = higher confidence
        if total_matches == 0:
            specificity_confidence = 0.0
        else:
            second_max = sorted(domain_scores.values(), reverse=True)[1] if len(domain_scores) > 1 else 0
            if max_score > second_max * 2:  # Clear winner
                specificity_confidence = 0.2
            elif max_score > second_max:
                specificity_confidence = 0.1
            else:
                specificity_confidence = 0.0  # Tie or close call

        total_confidence = match_confidence + length_confidence + specificity_confidence
        return min(total_confidence, 1.0)  # Cap at 1.0

    def get_fallback_collections(
        self,
        primary_collection: CollectionName,
        confidence: float,
        max_fallbacks: int = 3
    ) -> List[CollectionName]:
        """
        Get list of collections to try based on confidence (Phase 3).

        Strategy:
        - High confidence (>0.7): Primary only
        - Medium confidence (0.3-0.7): Primary + 1 fallback
        - Low confidence (<0.3): Primary + up to 3 fallbacks

        Args:
            primary_collection: Initially routed collection
            confidence: Confidence score (0.0 - 1.0)
            max_fallbacks: Maximum fallbacks to return

        Returns:
            List of collections to query in order (primary first)
        """
        collections = [primary_collection]

        # Determine number of fallbacks based on confidence
        if confidence >= self.CONFIDENCE_THRESHOLD_HIGH:
            # High confidence - primary only
            num_fallbacks = 0
        elif confidence >= self.CONFIDENCE_THRESHOLD_LOW:
            # Medium confidence - try 1 fallback
            num_fallbacks = 1
        else:
            # Low confidence - try up to 3 fallbacks
            num_fallbacks = min(max_fallbacks, 3)

        # Add fallbacks from chain
        if num_fallbacks > 0 and primary_collection in self.FALLBACK_CHAINS:
            fallback_chain = self.FALLBACK_CHAINS[primary_collection]
            collections.extend(fallback_chain[:num_fallbacks])

        return collections

    def route_with_confidence(
        self,
        query: str,
        return_fallbacks: bool = True
    ) -> Tuple[CollectionName, float, List[CollectionName]]:
        """
        Route query with confidence scoring and fallback suggestions (Phase 3).

        This is the enhanced routing method that returns detailed routing information.
        Use this when you need to query multiple collections based on confidence.

        Args:
            query: User query text
            return_fallbacks: If True, include fallback collections in result

        Returns:
            Tuple of:
            - primary_collection: Best matching collection
            - confidence: Confidence score (0.0 - 1.0)
            - fallback_collections: List of all collections to try (primary + fallbacks)
        """
        query_lower = query.lower()

        # Calculate domain scores (same as route())
        visa_score = sum(1 for kw in self.VISA_KEYWORDS if kw in query_lower)
        kbli_score = sum(1 for kw in self.KBLI_KEYWORDS if kw in query_lower)
        tax_score = sum(1 for kw in self.TAX_KEYWORDS if kw in query_lower)
        legal_score = sum(1 for kw in self.LEGAL_KEYWORDS if kw in query_lower)
        property_score = sum(1 for kw in self.PROPERTY_KEYWORDS if kw in query_lower)
        books_score = sum(1 for kw in self.BOOKS_KEYWORDS if kw in query_lower)
        update_score = sum(1 for kw in self.UPDATE_KEYWORDS if kw in query_lower)

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

        # Determine collection (same logic as route())
        if primary_score == 0:
            collection = "visa_oracle"
        elif primary_domain == "tax":
            collection = "tax_updates" if update_score > 0 else "tax_knowledge"
        elif primary_domain == "legal":
            collection = "legal_updates" if update_score > 0 else "legal_architect"
        elif primary_domain == "property":
            listing_keywords = ["for sale", "dijual", "listing", "available", "rent", "sewa", "lease"]
            has_listing_intent = any(kw in query_lower for kw in listing_keywords)
            collection = "property_listings" if has_listing_intent else "property_knowledge"
        elif primary_domain == "visa":
            collection = "visa_oracle"
        elif primary_domain == "kbli":
            collection = "kbli_eye"
        else:  # books
            collection = "zantara_books"

        # Calculate confidence
        confidence = self.calculate_confidence(query, domain_scores)

        # Get fallback collections
        if return_fallbacks:
            all_collections = self.get_fallback_collections(collection, confidence)
        else:
            all_collections = [collection]

        # Update stats
        self.fallback_stats["total_routes"] += 1
        if confidence >= self.CONFIDENCE_THRESHOLD_HIGH:
            self.fallback_stats["high_confidence"] += 1
        elif confidence >= self.CONFIDENCE_THRESHOLD_LOW:
            self.fallback_stats["medium_confidence"] += 1
        else:
            self.fallback_stats["low_confidence"] += 1

        if len(all_collections) > 1:
            self.fallback_stats["fallbacks_used"] += 1

        # Logging
        if len(all_collections) > 1:
            logger.info(
                f"🎯 Route with fallbacks: {collection} (confidence={confidence:.2f}) "
                f"→ fallbacks={all_collections[1:]}"
            )
        else:
            logger.info(f"🎯 Route: {collection} (confidence={confidence:.2f}, high confidence)")

        return collection, confidence, all_collections

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

    def get_fallback_stats(self) -> dict:
        """
        Get statistics about fallback chain usage (Phase 3).

        Returns:
            Dictionary with fallback metrics:
            - total_routes: Total routing calls
            - high_confidence: Routes with confidence > 0.7
            - medium_confidence: Routes with confidence 0.3-0.7
            - low_confidence: Routes with confidence < 0.3
            - fallbacks_used: Number of times fallback collections were suggested
            - fallback_rate: Percentage of routes using fallbacks
        """
        total = self.fallback_stats["total_routes"]
        fallback_rate = (
            (self.fallback_stats["fallbacks_used"] / total * 100)
            if total > 0
            else 0.0
        )

        return {
            **self.fallback_stats,
            "fallback_rate": f"{fallback_rate:.1f}%",
            "confidence_distribution": {
                "high": f"{(self.fallback_stats['high_confidence'] / total * 100) if total > 0 else 0:.1f}%",
                "medium": f"{(self.fallback_stats['medium_confidence'] / total * 100) if total > 0 else 0:.1f}%",
                "low": f"{(self.fallback_stats['low_confidence'] / total * 100) if total > 0 else 0:.1f}%"
            }
        }
