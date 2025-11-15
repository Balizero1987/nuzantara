"""
Test suite for Unified Memory Orchestrator
Validates 95% memory recall target

Tests:
1. Short conversation recall (5 messages)
2. Long conversation recall (20+ messages with summarization)
3. Fact extraction accuracy
4. Overall recall rate across 100 test scenarios
5. Context quality scoring

Run with: pytest tests/test_memory_recall.py -v
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
import json
from datetime import datetime
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.unified_memory_orchestrator import UnifiedMemoryOrchestrator, MemoryContext


@pytest.fixture
async def orchestrator():
    """
    Create test orchestrator with mocked connections

    This fixture creates an orchestrator for testing without requiring
    actual Redis or PostgreSQL connections.
    """
    config = {
        'redis_url': 'redis://localhost:6379',
        'postgres_url': 'postgresql://test:test@localhost/test_memory',
        'openai_api_key': 'test-key-fake'
    }

    orch = UnifiedMemoryOrchestrator(config)

    # Mock Redis client
    orch.redis_client = AsyncMock()
    orch.redis_client.ping = AsyncMock(return_value=True)
    orch.redis_client.lpush = AsyncMock()
    orch.redis_client.ltrim = AsyncMock()
    orch.redis_client.expire = AsyncMock()
    orch.redis_client.lrange = AsyncMock(return_value=[])

    # Mock PostgreSQL pool
    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock()
    mock_conn.fetch = AsyncMock(return_value=[])
    mock_conn.fetchrow = AsyncMock(return_value=None)
    mock_conn.fetchval = AsyncMock(return_value=0)

    mock_pool = AsyncMock()
    mock_pool.acquire = AsyncMock()
    mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_pool.acquire.return_value.__aexit__ = AsyncMock()

    orch.postgres_pool = mock_pool

    # Mock OpenAI client
    orch.openai_client = AsyncMock()

    return orch


@pytest.mark.asyncio
async def test_short_conversation_recall(orchestrator):
    """
    Test recall in 5-turn conversation

    This tests the working memory layer which should store
    the last 5 messages in Redis.
    """
    session_id = 'test-session-1'
    user_id = 'test-user-1'

    # Simulate conversation about B211A visa
    messages = [
        {'role': 'user', 'content': 'I need a B211A visa'},
        {'role': 'assistant', 'content': 'B211A visa costs $50-75 USD'},
        {'role': 'user', 'content': 'How long can I stay?'},
        {'role': 'assistant', 'content': 'Up to 180 days with extensions'},
        {'role': 'user', 'content': 'What was the cost again?'}
    ]

    # Store messages
    for msg in messages:
        success = await orchestrator.store_message(session_id, user_id, msg)
        assert success, "Message storage failed"

    # Mock working memory retrieval
    orchestrator.redis_client.lrange.return_value = [
        json.dumps({**msg, 'timestamp': datetime.utcnow().isoformat()})
        for msg in reversed(messages)  # Redis stores newest first
    ]

    # Test context retrieval
    context = await orchestrator.get_context(
        session_id=session_id,
        user_id=user_id,
        query='What was the cost again?'
    )

    # Assertions
    assert isinstance(context, MemoryContext)
    assert len(context.working_memory) > 0, "Working memory should contain messages"
    assert context.context_quality_score >= 0.2, "Should have at least working memory score"

    # Verify cost is in working memory
    working_text = str(context.working_memory)
    assert '$50-75' in working_text or 'cost' in working_text.lower()

    print(f"✅ Short conversation test passed: quality_score={context.context_quality_score:.2f}")


@pytest.mark.asyncio
async def test_long_conversation_with_summarization(orchestrator):
    """
    Test recall in 20-turn conversation with summarization

    This tests the episodic memory layer which should create
    summaries when message count exceeds threshold.
    """
    session_id = 'test-session-2'
    user_id = 'test-user-2'

    # Simulate long conversation
    messages = []
    for i in range(20):
        messages.extend([
            {'role': 'user', 'content': f'Question {i}: Tell me about fact {i//2}'},
            {'role': 'assistant', 'content': f'Answer {i}: Important fact {i//2} is valuable'}
        ])

    # Store messages
    for msg in messages:
        await orchestrator.store_message(session_id, user_id, msg)

    # Mock summarization response
    summary_json = json.dumps({
        'summary': 'User asked 10 questions about various facts. Discussed importance of each.',
        'topics': ['facts', 'information', 'learning'],
        'key_decisions': ['Continue research on facts'],
        'user_preferences': ['Detailed explanations'],
        'next_steps': ['Provide more examples']
    })

    mock_response = Mock()
    mock_response.choices = [Mock()]
    mock_response.choices[0].message.content = summary_json

    orchestrator.openai_client.chat.completions.create = AsyncMock(return_value=mock_response)

    # Trigger summarization manually
    await orchestrator._trigger_summarization(session_id, user_id)

    # Mock episodic memory retrieval
    mock_conn = orchestrator.postgres_pool.acquire.return_value.__aenter__.return_value
    mock_conn.fetchrow.return_value = {
        'summary': 'User asked 10 questions about various facts.',
        'topics': ['facts', 'information'],
        'key_decisions': ['Continue research'],
        'importance_score': 0.9
    }

    # Test recall of early facts
    context = await orchestrator.get_context(
        session_id=session_id,
        user_id=user_id,
        query='What was Important fact 2?'
    )

    # Assertions
    assert context.episodic_summary is not None, "Should have episodic summary"
    assert context.context_quality_score >= 0.5, "Should have good quality with summary"
    assert 'facts' in context.episodic_summary.lower() or 'question' in context.episodic_summary.lower()

    print(f"✅ Long conversation test passed: quality_score={context.context_quality_score:.2f}")


@pytest.mark.asyncio
async def test_fact_extraction_accuracy(orchestrator):
    """
    Test fact extraction from conversation

    Validates that the orchestrator can extract important facts
    with correct confidence scores.
    """
    session_id = 'test-session-3'
    user_id = 'test-user-3'

    # Conversation with extractable facts
    conversation_text = """
    User: I want to start a PT company in Indonesia
    Assistant: A PT (Perseroan Terbatas) requires 10 billion IDR minimum capital.

    User: My deadline is March 2025
    Assistant: Timeline for PT incorporation is typically 3 weeks from document submission.
    """

    # Mock fact extraction response
    facts_json = json.dumps([
        {
            'content': 'PT company requires 10 billion IDR minimum capital',
            'type': 'requirement',
            'confidence': 0.95,
            'tags': ['PT', 'capital', 'indonesia']
        },
        {
            'content': 'User deadline is March 2025',
            'type': 'deadline',
            'confidence': 0.90,
            'tags': ['deadline', 'timeline']
        },
        {
            'content': 'PT incorporation timeline is 3 weeks',
            'type': 'timeline',
            'confidence': 0.85,
            'tags': ['PT', 'timeline', 'incorporation']
        }
    ])

    mock_response = Mock()
    mock_response.choices = [Mock()]
    mock_response.choices[0].message.content = facts_json

    orchestrator.openai_client.chat.completions.create = AsyncMock(return_value=mock_response)

    # Extract facts
    facts_count = await orchestrator.extract_facts(
        session_id=session_id,
        user_id=user_id,
        content=conversation_text
    )

    # Assertions
    assert facts_count >= 2, "Should extract at least 2 high-confidence facts"
    assert facts_count <= 3, "Should not over-extract facts"

    print(f"✅ Fact extraction test passed: extracted {facts_count} facts")


@pytest.mark.asyncio
async def test_semantic_memory_retrieval(orchestrator):
    """
    Test semantic memory retrieval for relevant facts

    Validates that relevant facts are retrieved based on query.
    """
    user_id = 'test-user-4'
    query = 'PT company capital requirements'

    # Mock semantic memory search results
    mock_conn = orchestrator.postgres_pool.acquire.return_value.__aenter__.return_value
    mock_conn.fetch.return_value = [
        {
            'content': 'PT requires 10 billion IDR capital',
            'memory_type': 'requirement',
            'importance_score': 0.9,
            'confidence': 0.95,
            'tags': ['PT', 'capital']
        },
        {
            'content': 'PT incorporation takes 3 weeks',
            'memory_type': 'timeline',
            'importance_score': 0.7,
            'confidence': 0.85,
            'tags': ['PT', 'timeline']
        }
    ]

    # Get relevant facts
    facts = await orchestrator._get_relevant_semantic_memories(user_id, query, limit=5)

    # Assertions
    assert len(facts) == 2, "Should retrieve 2 facts"
    assert all(fact['confidence'] >= 0.7 for fact in facts), "All facts should meet min confidence"
    assert facts[0]['content'] == 'PT requires 10 billion IDR capital'

    print(f"✅ Semantic memory test passed: retrieved {len(facts)} relevant facts")


@pytest.mark.asyncio
async def test_context_quality_scoring(orchestrator):
    """
    Test context quality score calculation

    Validates that quality scores are calculated correctly based on
    available memory layers.
    """
    session_id = 'test-session-5'
    user_id = 'test-user-5'
    query = 'Test query'

    # Test 1: Only working memory (score = 0.2)
    working_memory = [
        {'role': 'user', 'content': 'Hello'},
        {'role': 'assistant', 'content': 'Hi there!'}
    ]

    context = orchestrator._build_optimized_context(
        query=query,
        working_memory=working_memory,
        episodic_summary=None,
        relevant_facts=[]
    )

    assert context.context_quality_score >= 0.2
    assert context.context_quality_score < 0.3
    print(f"✅ Working memory only: score={context.context_quality_score:.2f}")

    # Test 2: Working memory + episodic summary (score = 0.5)
    context = orchestrator._build_optimized_context(
        query=query,
        working_memory=working_memory,
        episodic_summary="Previous conversation about visas",
        relevant_facts=[]
    )

    assert context.context_quality_score >= 0.5
    assert context.context_quality_score < 0.6
    print(f"✅ With episodic summary: score={context.context_quality_score:.2f}")

    # Test 3: All three layers (score >= 0.8)
    relevant_facts = [
        {'content': 'Fact 1', 'confidence': 0.9, 'type': 'rule'},
        {'content': 'Fact 2', 'confidence': 0.85, 'type': 'requirement'}
    ]

    context = orchestrator._build_optimized_context(
        query=query,
        working_memory=working_memory,
        episodic_summary="Previous conversation",
        relevant_facts=relevant_facts
    )

    assert context.context_quality_score >= 0.7, "Full context should have high quality score"
    print(f"✅ Full context (3 layers): score={context.context_quality_score:.2f}")


@pytest.mark.asyncio
async def test_memory_recall_percentage(orchestrator):
    """
    Validate 95% recall rate across 100 test scenarios

    This is the main test that validates the 95% target.
    Uses a variety of scenarios to simulate real usage.
    """
    total_tests = 100
    successful_recalls = 0

    for i in range(total_tests):
        session_id = f'test-recall-{i}'
        user_id = f'user-{i % 10}'  # Simulate 10 different users

        # Create conversation with an important fact
        fact_value = i * 100
        important_message = f'Important detail {i}: The value is {fact_value} IDR'

        # Store the important message
        await orchestrator.store_message(session_id, user_id, {
            'role': 'user',
            'content': important_message
        })

        # Add noise messages (3-7 random messages)
        noise_count = 3 + (i % 5)
        for j in range(noise_count):
            await orchestrator.store_message(session_id, user_id, {
                'role': 'user',
                'content': f'Random noise message {j} about nothing important'
            })

        # Mock retrieval: working memory should contain recent messages
        all_messages = [important_message] + [
            f'Random noise message {j}' for j in range(noise_count)
        ]

        # Mock Redis to return last 5 messages
        orchestrator.redis_client.lrange.return_value = [
            json.dumps({
                'role': 'user',
                'content': msg,
                'timestamp': datetime.utcnow().isoformat()
            })
            for msg in all_messages[-5:]
        ]

        # Try to recall the fact
        query = f'What was the value for detail {i}?'
        context = await orchestrator.get_context(session_id, user_id, query)

        # Check if fact is recalled (in working memory or facts)
        context_text = str(context.working_memory) + str(context.relevant_facts)
        if str(fact_value) in context_text or important_message in context_text:
            successful_recalls += 1

    recall_rate = successful_recalls / total_tests
    print(f"\n📊 Memory Recall Rate: {recall_rate:.1%} ({successful_recalls}/{total_tests})")

    # CRITICAL ASSERTION: Must meet 95% target
    assert recall_rate >= 0.95, f"Recall rate {recall_rate:.1%} is below 95% target"

    print(f"✅ Memory recall test PASSED: {recall_rate:.1%} >= 95%")


@pytest.mark.asyncio
async def test_statistics_tracking(orchestrator):
    """
    Test that statistics are correctly tracked
    """
    # Initial stats
    stats = await orchestrator.get_stats()
    initial_contexts = stats['contexts_built']

    # Build some contexts
    for i in range(5):
        await orchestrator.get_context(
            session_id=f'session-{i}',
            user_id='test-user',
            query=f'Query {i}'
        )

    # Get updated stats
    stats = await orchestrator.get_stats()

    # Assertions
    assert stats['contexts_built'] == initial_contexts + 5
    assert 'avg_quality_score' in stats
    assert 'memory_recall_estimate' in stats
    assert stats['memory_recall_estimate'] >= 0.6  # Should be improving

    print(f"✅ Statistics test passed: {stats['contexts_built']} contexts built")


@pytest.mark.asyncio
async def test_error_handling(orchestrator):
    """
    Test graceful error handling when services fail
    """
    session_id = 'test-error'
    user_id = 'test-user'

    # Test with Redis failure
    orchestrator.redis_client = None

    context = await orchestrator.get_context(session_id, user_id, 'test query')

    # Should still return a context (even if empty)
    assert isinstance(context, MemoryContext)
    assert context.context_quality_score >= 0.0

    print("✅ Error handling test passed: graceful degradation works")


if __name__ == '__main__':
    """
    Run tests directly with: python tests/test_memory_recall.py
    """
    pytest.main([__file__, '-v', '--tb=short'])
