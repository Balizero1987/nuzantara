"""
Jaksel Personality Builder - Smart Few-Shot Example Selection

This module handles:
1. Loading Jaksel persona from jaksel_persona.py
2. Selecting relevant few-shot examples based on query complexity
3. Building the final system prompt with persona + examples
"""

import random
from backend.prompts.jaksel_persona import SYSTEM_INSTRUCTION, FEW_SHOT_EXAMPLES


def select_few_shot_examples(
    user_message: str,
    num_examples: int = 6
) -> list[dict]:
    """
    Select relevant few-shot examples based on query characteristics.

    Args:
        user_message: The user's query
        num_examples: Number of examples to select (default: 6)

    Returns:
        List of selected few-shot example dicts
    """
    # Simple heuristic: always include a mix of simple and complex examples
    # For a production system, you could use semantic similarity here

    # Categorize examples (rough heuristic based on position in array)
    greetings_examples = FEW_SHOT_EXAMPLES[:10]  # First 10 are simpler
    business_examples = FEW_SHOT_EXAMPLES[10:40]  # Middle are business queries
    complex_examples = FEW_SHOT_EXAMPLES[40:]  # Last are complex/conversational

    # Detect query type (simple heuristic)
    message_lower = user_message.lower()
    is_greeting = any(word in message_lower for word in ["hi", "hello", "ciao", "halo", "hey"])
    is_short = len(user_message.split()) < 5

    selected = []

    if is_greeting or is_short:
        # For simple queries: 2 greetings, 2 business, 2 complex
        selected.extend(random.sample(greetings_examples, min(2, len(greetings_examples))))
        selected.extend(random.sample(business_examples, min(2, len(business_examples))))
        selected.extend(random.sample(complex_examples, min(2, len(complex_examples))))
    else:
        # For complex queries: 1 greeting, 3 business, 2 complex
        selected.extend(random.sample(greetings_examples, min(1, len(greetings_examples))))
        selected.extend(random.sample(business_examples, min(3, len(business_examples))))
        selected.extend(random.sample(complex_examples, min(2, len(complex_examples))))

    # Ensure we return exactly num_examples (or less if not enough available)
    return selected[:num_examples]


def build_jaksel_system_prompt(
    user_message: str,
    memory_context: str | None = None,
    identity_context: str | None = None,
    include_few_shot: bool = True,
    num_examples: int = 6
) -> tuple[str, list[dict]]:
    """
    Build complete Jaksel-enhanced system prompt.

    Args:
        user_message: The user's query (used for example selection)
        memory_context: Optional RAG/memory context
        identity_context: Optional user identity context
        include_few_shot: Whether to include few-shot examples (default: True)
        num_examples: Number of few-shot examples to include

    Returns:
        Tuple of (system_prompt, few_shot_messages)
        - system_prompt: The complete system instruction
        - few_shot_messages: List of few-shot example messages to prepend to conversation
    """
    # Start with base Jaksel system instruction
    system_prompt = SYSTEM_INSTRUCTION.strip()

    # Add identity context if provided
    if identity_context:
        system_prompt += f"""

---

<user_identity>
{identity_context}
</user_identity>

IMPORTANT: Use the user identity information above to personalize your responses.
If the user asks "who am I?" or similar, refer to this identity information.
"""

    # Add memory/RAG context usage instructions if provided
    if memory_context:
        system_prompt += """

---

CONTEXT USAGE INSTRUCTIONS:
1. Use the information in <context> tags to answer questions accurately
2. When citing facts, mention the source document if available
3. If the context doesn't contain specific information, acknowledge this honestly
4. Do NOT make up information - only use what's in the context or your general knowledge
5. For pricing, legal requirements, and specific procedures: ONLY use context data
"""

    # Select few-shot examples
    few_shot_messages = []
    if include_few_shot and FEW_SHOT_EXAMPLES:
        selected_examples = select_few_shot_examples(user_message, num_examples)

        # Convert to message format (these will be prepended to conversation history)
        for example in selected_examples:
            few_shot_messages.append({
                "role": "user",
                "content": example["content"]
            })
            # Find the next assistant message
            idx = FEW_SHOT_EXAMPLES.index(example)
            if idx + 1 < len(FEW_SHOT_EXAMPLES):
                next_msg = FEW_SHOT_EXAMPLES[idx + 1]
                if next_msg["role"] == "assistant":
                    few_shot_messages.append({
                        "role": "assistant",
                        "content": next_msg["content"]
                    })

    return system_prompt, few_shot_messages


def get_jaksel_system_instruction() -> str:
    """
    Get just the Jaksel system instruction without any context or examples.
    Useful for quick access to the base persona.

    Returns:
        The Jaksel system instruction string
    """
    return SYSTEM_INSTRUCTION.strip()
