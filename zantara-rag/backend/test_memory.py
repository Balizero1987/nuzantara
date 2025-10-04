"""
Test Memory & Conversation Services - Phase 2
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from services.memory_service import MemoryService
from services.conversation_service import ConversationService


async def test_memory_service():
    """Test memory persistence"""
    service = MemoryService(use_firestore=False)

    print("🧪 Testing MemoryService\n")
    print("=" * 60)

    user_id = "zero"

    # Test 1: Get empty memory
    print("\n📝 Test 1: Get empty memory")
    memory = await service.get_memory(user_id)
    print(f"   User ID: {memory.user_id}")
    print(f"   Facts: {memory.profile_facts}")
    print(f"   Summary: {memory.summary}")
    print(f"   Counters: {memory.counters}")
    assert len(memory.profile_facts) == 0
    print("   ✅ PASS")

    # Test 2: Add facts
    print("\n📝 Test 2: Add profile facts")
    await service.add_fact(user_id, "Loves esoteric philosophy")
    await service.add_fact(user_id, "Expert in Python and TypeScript")
    await service.add_fact(user_id, "Founded Bali Zero in 2020")
    memory = await service.get_memory(user_id)
    print(f"   Facts: {memory.profile_facts}")
    assert len(memory.profile_facts) == 3
    print("   ✅ PASS")

    # Test 3: Deduplication
    print("\n📝 Test 3: Deduplication test")
    await service.add_fact(user_id, "Loves esoteric philosophy")  # Duplicate
    memory = await service.get_memory(user_id)
    print(f"   Facts count: {len(memory.profile_facts)} (should be 3)")
    assert len(memory.profile_facts) == 3
    print("   ✅ PASS (duplicate ignored)")

    # Test 4: Update summary
    print("\n📝 Test 4: Update summary")
    summary = "Zero is a tech entrepreneur passionate about esoteric knowledge and Indonesian culture. Builds AI systems that bridge ancient wisdom with modern technology."
    await service.update_summary(user_id, summary)
    memory = await service.get_memory(user_id)
    print(f"   Summary: {memory.summary[:80]}...")
    assert len(memory.summary) > 0
    print("   ✅ PASS")

    # Test 5: Increment counters
    print("\n📝 Test 5: Increment counters")
    await service.increment_counter(user_id, "conversations")
    await service.increment_counter(user_id, "conversations")
    await service.increment_counter(user_id, "conversations")
    await service.increment_counter(user_id, "searches")
    memory = await service.get_memory(user_id)
    print(f"   Conversations: {memory.counters['conversations']}")
    print(f"   Searches: {memory.counters['searches']}")
    assert memory.counters["conversations"] == 3
    assert memory.counters["searches"] == 1
    print("   ✅ PASS")

    # Test 6: Max facts limit (10)
    print("\n📝 Test 6: Max facts limit test")
    for i in range(15):
        await service.add_fact(user_id, f"Test fact {i}")
    memory = await service.get_memory(user_id)
    print(f"   Facts count: {len(memory.profile_facts)} (should be 10)")
    assert len(memory.profile_facts) == 10
    print("   ✅ PASS")

    print("\n" + "=" * 60)
    print("🎉 MemoryService TESTS PASSED!\n")


async def test_conversation_service():
    """Test conversation persistence"""
    service = ConversationService(use_firestore=False)

    print("🧪 Testing ConversationService\n")
    print("=" * 60)

    user_id = "zero"

    # Test 1: Save conversation
    print("\n💬 Test 1: Save conversation")
    messages = [
        {"role": "user", "content": "What is Sub Rosa protocol?"},
        {"role": "assistant", "content": "Sub Rosa is a 4-level access system..."}
    ]
    metadata = {
        "collaborator_name": "Zero",
        "model_used": "haiku",
        "input_tokens": 150,
        "output_tokens": 200
    }
    await service.save_conversation(user_id, messages, metadata)
    print("   ✅ Conversation saved")
    print("   ✅ PASS")

    # Test 2: Save multiple conversations
    print("\n💬 Test 2: Save multiple conversations")
    for i in range(5):
        messages = [
            {"role": "user", "content": f"Question {i}"},
            {"role": "assistant", "content": f"Answer {i}"}
        ]
        await service.save_conversation(user_id, messages, metadata)
    print("   ✅ 5 conversations saved")
    print("   ✅ PASS")

    # Test 3: Retrieve recent conversations
    print("\n💬 Test 3: Retrieve recent conversations")
    recent = await service.get_recent_conversations(user_id, limit=3)
    print(f"   Retrieved: {len(recent)} conversations")
    assert len(recent) == 3
    print("   ✅ PASS")

    # Test 4: Stats
    print("\n💬 Test 4: Get stats")
    stats = await service.get_stats()
    print(f"   Stats: {stats}")
    assert stats["total_conversations"] >= 6
    print("   ✅ PASS")

    print("\n" + "=" * 60)
    print("🎉 ConversationService TESTS PASSED!\n")


async def main():
    """Run all tests"""
    await test_memory_service()
    await test_conversation_service()
    print("\n" + "=" * 60)
    print("🎉🎉🎉 ALL PHASE 2 TESTS PASSED! 🎉🎉🎉")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
