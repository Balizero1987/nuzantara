"""
RAG Backend Patch - Dual Collection Search for Pricing
Add to existing RAG backend to prioritize pricing collection

Usage: Import this module and replace query_chromadb() function
"""

import re
from typing import List, Dict, Any

# Pricing query detection keywords
PRICING_KEYWORDS = [
    # English
    "price", "cost", "charge", "fee", "how much", "pricing", "rate",
    "expensive", "cheap", "payment", "pay", "paid", "costs",

    # Indonesian
    "harga", "biaya", "tarif", "berapa", "bayar", "membayar",
    "mahal", "murah", "pembayaran", "ongkos"
]

def is_pricing_query(query: str) -> bool:
    """
    Detect if query is asking about pricing/costs

    Args:
        query: User query string

    Returns:
        True if pricing-related, False otherwise
    """
    query_lower = query.lower()

    # Check for pricing keywords
    for keyword in PRICING_KEYWORDS:
        if keyword in query_lower:
            return True

    # Check for patterns like "17M IDR", "USD 350", etc.
    if re.search(r'\d+[\s,]*(?:idr|usd|million|m|rb|juta)', query_lower):
        return True

    return False


def query_chromadb_dual(
    chroma_client,
    query: str,
    n_results: int = 10,
    embedder=None
) -> Dict[str, Any]:
    """
    Dual-collection search: pricing + operational

    Args:
        chroma_client: ChromaDB client instance
        query: User query
        n_results: Number of results to return
        embedder: Embedding model (if None, uses ChromaDB's default)

    Returns:
        Dict with documents, metadatas, distances
    """

    # Check if pricing query
    if is_pricing_query(query):
        print(f"[PRICING QUERY DETECTED] Searching pricing collection first")

        try:
            # 1. Search pricing collection (PRIORITY)
            pricing_coll = chroma_client.get_collection("bali_zero_pricing")

            pricing_results = pricing_coll.query(
                query_texts=[query],
                n_results=min(5, n_results)  # Top 5 from pricing
            )

            # If pricing results found, prioritize them
            if pricing_results['documents'][0]:
                print(f"[PRICING] Found {len(pricing_results['documents'][0])} pricing docs")

                # Also get some operational context (fewer results)
                operational_results = query_operational_collections(
                    chroma_client,
                    query,
                    n_results=max(3, n_results - 5)  # Remaining slots
                )

                # Merge: pricing first, then operational
                merged = merge_results(
                    pricing_results,
                    operational_results,
                    pricing_priority=True
                )

                return merged

            else:
                print(f"[PRICING] No pricing docs found, fallback to operational")
                # No pricing found, search operational only
                return query_operational_collections(chroma_client, query, n_results)

        except Exception as e:
            print(f"[ERROR] Pricing collection search failed: {e}")
            # Fallback to operational
            return query_operational_collections(chroma_client, query, n_results)

    else:
        # Not a pricing query, search operational only
        print(f"[OPERATIONAL QUERY] Searching operational collections")
        return query_operational_collections(chroma_client, query, n_results)


def query_operational_collections(
    chroma_client,
    query: str,
    n_results: int = 10
) -> Dict[str, Any]:
    """
    Search across all operational collections

    Collections searched:
    - visa_oracle (immigration, KITAS, visas)
    - kbli_eye (business classification)
    - tax_genius (tax regulations)
    - legal_architect (legal framework)
    - kb_indonesian (Indonesian guides)
    - kbli_comprehensive (KBLI detailed)
    """

    OPERATIONAL_COLLECTIONS = [
        "visa_oracle",
        "kbli_eye",
        "tax_genius",
        "legal_architect",
        "kb_indonesian",
        "kbli_comprehensive"
    ]

    all_results = {
        'documents': [[]],
        'metadatas': [[]],
        'distances': [[]]
    }

    # Query each collection
    for coll_name in OPERATIONAL_COLLECTIONS:
        try:
            coll = chroma_client.get_collection(coll_name)

            # Get top K/N results from each
            results = coll.query(
                query_texts=[query],
                n_results=max(2, n_results // len(OPERATIONAL_COLLECTIONS))
            )

            # Append results
            all_results['documents'][0].extend(results['documents'][0])
            all_results['metadatas'][0].extend(results['metadatas'][0])
            all_results['distances'][0].extend(results['distances'][0])

        except Exception as e:
            print(f"[WARNING] Collection {coll_name} query failed: {e}")
            continue

    # Sort by distance (lower = more similar)
    sorted_indices = sorted(
        range(len(all_results['distances'][0])),
        key=lambda i: all_results['distances'][0][i]
    )

    # Take top N
    top_indices = sorted_indices[:n_results]

    # Build final results
    final_results = {
        'documents': [[all_results['documents'][0][i] for i in top_indices]],
        'metadatas': [[all_results['metadatas'][0][i] for i in top_indices]],
        'distances': [[all_results['distances'][0][i] for i in top_indices]]
    }

    return final_results


def merge_results(
    pricing_results: Dict,
    operational_results: Dict,
    pricing_priority: bool = True
) -> Dict:
    """
    Merge pricing + operational results

    Args:
        pricing_results: Results from pricing collection
        operational_results: Results from operational collections
        pricing_priority: If True, pricing comes first

    Returns:
        Merged results dict
    """

    if pricing_priority:
        # Pricing first
        merged_docs = pricing_results['documents'][0] + operational_results['documents'][0]
        merged_meta = pricing_results['metadatas'][0] + operational_results['metadatas'][0]
        merged_dist = pricing_results['distances'][0] + operational_results['distances'][0]
    else:
        # Operational first
        merged_docs = operational_results['documents'][0] + pricing_results['documents'][0]
        merged_meta = operational_results['metadatas'][0] + pricing_results['metadatas'][0]
        merged_dist = operational_results['distances'][0] + pricing_results['distances'][0]

    return {
        'documents': [merged_docs],
        'metadatas': [merged_meta],
        'distances': [merged_dist]
    }


# Example integration
if __name__ == "__main__":
    """
    Example usage in existing RAG backend:

    # OLD CODE:
    # results = collection.query(query_texts=[query], n_results=5)

    # NEW CODE:
    from rag_pricing_patch import query_chromadb_dual

    results = query_chromadb_dual(
        chroma_client=chroma_client,
        query=user_query,
        n_results=10
    )

    # Then rerank with Cohere as usual
    reranked = cohere.rerank(...)
    """

    print("RAG Pricing Patch loaded successfully")
    print(f"Pricing keywords: {len(PRICING_KEYWORDS)} configured")
    print("\nUsage: Replace query() with query_chromadb_dual()")
