#!/usr/bin/env python3
"""
Test local fact extraction to verify if patterns match
"""
import sys
sys.path.append('backend')

from services.memory_fact_extractor import MemoryFactExtractor

# Initialize extractor
extractor = MemoryFactExtractor()

# Test messages
user_message = "Ciao ZANTARA, sono Krisna. Mi piace il surf e vivo a Canggu."
ai_response = "Ciao Krisna! 🏄‍♂️ Che bello sentirti da Canggu - uno dei posti migliori per il surf a Bali!"

print("=" * 80)
print("TEST FACT EXTRACTION")
print("=" * 80)
print(f"\n📝 User message:\n{user_message}")
print(f"\n🤖 AI response:\n{ai_response}")
print("\n" + "=" * 80)

# Extract facts
facts = extractor.extract_facts_from_conversation(
    user_message=user_message,
    ai_response=ai_response,
    user_id="krisna"
)

print(f"\n💎 EXTRACTED FACTS: {len(facts)}")
print("=" * 80)

for i, fact in enumerate(facts, 1):
    print(f"\n[{i}] Type: {fact['type']}")
    print(f"    Content: {fact['content']}")
    print(f"    Confidence: {fact['confidence']:.2f}")
    print(f"    Source: {fact['source']}")
    print(f"    ✅ Passes 0.7 threshold: {fact['confidence'] > 0.7}")

# Check if any facts would be saved (confidence > 0.7)
saveable = [f for f in facts if f['confidence'] > 0.7]
print("\n" + "=" * 80)
print(f"📊 SUMMARY:")
print(f"   Total facts extracted: {len(facts)}")
print(f"   Facts with confidence > 0.7: {len(saveable)}")
print(f"   Would be saved to PostgreSQL: {len(saveable) > 0}")
print("=" * 80)
