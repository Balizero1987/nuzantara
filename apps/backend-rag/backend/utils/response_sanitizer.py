"""
Response Sanitization Utilities for ZANTARA
Fixes Phase 1 & 2: Remove training data artifacts and enforce quality standards
"""

import re
from typing import Optional


def sanitize_zantara_response(response: str) -> str:
    """
    Remove training data artifacts from ZANTARA responses

    Fixes:
    - [PRICE], [MANDATORY] placeholders
    - User:, Assistant:, Context: format leaks
    - Meta-commentary like "natural language summary"
    - Markdown headers in plain text

    Args:
        response: Raw response from ZANTARA

    Returns:
        Cleaned response without artifacts
    """
    if not response:
        return response

    cleaned = response

    # Remove placeholder markers
    cleaned = re.sub(r'\[PRICE\]\.?\s*', '', cleaned)
    cleaned = re.sub(r'\[MANDATORY\]\s*', '', cleaned)
    cleaned = re.sub(r'\[OPTIONAL\]\s*', '', cleaned)

    # Remove training format leaks
    cleaned = re.sub(r'User:\s*', '', cleaned)
    cleaned = re.sub(r'Assistant:\s*', '', cleaned)
    cleaned = re.sub(r'Context:.*?\n', '', cleaned, flags=re.DOTALL)
    cleaned = re.sub(r'Context from knowledge base:.*?\n', '', cleaned)

    # Remove meta-commentary
    cleaned = re.sub(r'\(.*?for this scenario.*?\)', '', cleaned)
    cleaned = re.sub(r'natural language summary\s*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Simplified Explanation.*?\n', '', cleaned)
    cleaned = re.sub(r'Contexto per la risposta:.*?\n', '', cleaned)
    cleaned = re.sub(r'\(from KB source\)\s*\n*', '', cleaned)

    # Remove markdown headers from plain text (should not appear in conversational responses)
    cleaned = re.sub(r'###?\s+\*\*([^*]+)\*\*', r'\1', cleaned)  # ### **Header** → Header
    cleaned = re.sub(r'###?\s+', '', cleaned)  # ### Header → Header
    cleaned = re.sub(r'\*\*([^*]+)\*\*:\s*\n', r'\1: ', cleaned)  # **Label**:\n → Label:
    cleaned = re.sub(r'\*([^*]+)\*\*', r'\1', cleaned)  # *bold** → bold (fix broken markdown)

    # Remove section dividers
    cleaned = re.sub(r'\n--+\n', '\n', cleaned)
    cleaned = re.sub(r'^--+\n', '', cleaned)

    # Remove requirement lists (often hallucinated)
    cleaned = re.sub(r'Requirements:\s*\n', '', cleaned)
    cleaned = re.sub(r'Deviation from Requirement:\s*\n', '', cleaned)

    # Clean up multiple newlines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

    return cleaned.strip()


def enforce_santai_mode(response: str, query_type: str, max_words: int = 30) -> str:
    """
    Enforce SANTAI mode (2-4 sentences, ~20-30 words) for casual queries

    Args:
        response: Response text
        query_type: Type of query (greeting, casual, business, emergency)
        max_words: Maximum words for casual responses

    Returns:
        Truncated response if needed
    """
    if query_type not in ["greeting", "casual"]:
        return response  # No truncation for business queries

    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', response)

    # For greetings/casual: max 3 sentences
    if len(sentences) > 3:
        response = ' '.join(sentences[:3])

    # Word count check
    words = response.split()
    if len(words) > max_words:
        # Truncate at sentence boundary
        truncated = ' '.join(words[:max_words])
        last_period = max(
            truncated.rfind('.'),
            truncated.rfind('!'),
            truncated.rfind('?')
        )
        if last_period > 0:
            response = truncated[:last_period + 1]
        else:
            # No sentence boundary found, hard truncate
            response = truncated + '...'

    return response.strip()


def add_contact_if_appropriate(response: str, query_type: str) -> str:
    """
    Only add contact info for business queries, not greetings

    Args:
        response: Response text
        query_type: Type of query

    Returns:
        Response with optional contact info
    """
    # Don't add contact info to greetings or casual chat
    if query_type in ["greeting", "casual"]:
        return response

    # Add contact info for business and emergency queries
    if query_type in ["business", "emergency"]:
        # Only add if not already present
        if "whatsapp" not in response.lower() and "+62" not in response:
            contact = "\n\nNeed help? Contact us on WhatsApp +62 859 0436 9574"
            return response + contact

    return response


def classify_query_type(message: str) -> str:
    """
    Classify query type to determine RAG usage and response style

    Args:
        message: User message

    Returns:
        'greeting' | 'casual' | 'business' | 'emergency'
    """
    msg_lower = message.lower().strip()

    # Remove punctuation for matching
    msg_clean = re.sub(r'[!?.,]', '', msg_lower)

    # GREETING: Simple greetings (NO RAG)
    greetings = [
        "ciao", "hi", "hello", "hey", "good morning", "buongiorno",
        "good afternoon", "buonasera", "good evening", "hola",
        "salve", "buondì", "yo"
    ]
    if msg_clean in greetings:
        return "greeting"

    # CASUAL: Small talk (NO RAG)
    casual_patterns = [
        "come stai", "come va", "how are you", "how r you", "how are u",
        "what's up", "whats up", "wassup", "how's it going", "how is it going",
        "come ti chiami", "what's your name", "who are you", "chi sei",
        "tell me about yourself", "parlami di te", "describe yourself"
    ]
    if any(pattern in msg_lower for pattern in casual_patterns):
        return "casual"

    # EMERGENCY: Urgent issues (RAG + special handling)
    emergency_keywords = [
        "urgent", "urgente", "emergency", "emergenza", "help", "aiuto",
        "lost", "stolen", "perso", "rubato", "problema", "problem",
        "scaduto", "expired", "deportation", "deportato"
    ]
    if any(keyword in msg_lower for keyword in emergency_keywords):
        return "emergency"

    # Default: BUSINESS query (RAG enabled)
    return "business"


def process_zantara_response(
    response: str,
    query_type: str,
    apply_santai: bool = True,
    add_contact: bool = True
) -> str:
    """
    Complete response processing pipeline

    Applies all fixes:
    1. Sanitize training data artifacts
    2. Enforce SANTAI mode length (if applicable)
    3. Add contact info (if appropriate)

    Args:
        response: Raw ZANTARA response
        query_type: Query classification
        apply_santai: Whether to enforce length limits
        add_contact: Whether to add contact info

    Returns:
        Fully processed response
    """
    # Step 1: Sanitize artifacts
    cleaned = sanitize_zantara_response(response)

    # Step 2: Enforce length for casual queries
    if apply_santai:
        cleaned = enforce_santai_mode(cleaned, query_type)

    # Step 3: Add contact info if appropriate
    if add_contact:
        cleaned = add_contact_if_appropriate(cleaned, query_type)

    return cleaned
