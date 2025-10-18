"""
Memory Integration Test Suite
Tests memory fact extraction, context building, and integration flow

Run with: pytest tests/test_memory_integration.py -v
or: python3 tests/test_memory_integration.py
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from services.memory_fact_extractor import MemoryFactExtractor


class TestMemoryFactExtractor:
    """Test fact extraction logic"""

    def setup_method(self):
        """Initialize extractor before each test"""
        self.extractor = MemoryFactExtractor()

    def test_01_extract_preference_italian(self):
        """Test 1: Extract Italian preference"""
        user_msg = "Preferisco comunicare in italiano per questioni di business"
        ai_msg = "Perfetto, comunicheremo in italiano!"

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_1"
        )

        assert len(facts) > 0, "Should extract at least 1 fact"
        assert any('preferisco' in f['content'].lower() or 'italiano' in f['content'].lower() for f in facts), "Should detect preference"
        print(f"✅ Test 1 PASSED: Extracted {len(facts)} facts")
        for f in facts:
            print(f"   - [{f['type']}] {f['content'][:50]}... (conf: {f['confidence']:.2f})")

    def test_02_extract_business_pt_pma(self):
        """Test 2: Extract PT PMA business info"""
        user_msg = "Sto aprendo una PT PMA nel settore IT con capitale di 500 milioni IDR"
        ai_msg = "Ottimo! Per una PT PMA nel settore IT serve il KBLI corretto."

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_2"
        )

        assert len(facts) > 0, "Should extract business facts"
        assert any('pt pma' in f['content'].lower() or 'capitale' in f['content'].lower() for f in facts), "Should detect PT PMA info"
        print(f"✅ Test 2 PASSED: Extracted {len(facts)} business facts")
        for f in facts:
            print(f"   - [{f['type']}] {f['content'][:50]}... (conf: {f['confidence']:.2f})")

    def test_03_extract_personal_identity(self):
        """Test 3: Extract personal identity"""
        user_msg = "Mi chiamo Marco e sono italiano, vivo a Bali da 3 anni"
        ai_msg = "Piacere Marco! Come posso aiutarti con la tua situazione a Bali?"

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_3"
        )

        assert len(facts) > 0, "Should extract identity facts"
        assert any('marco' in f['content'].lower() or 'italiano' in f['content'].lower() for f in facts), "Should detect identity"
        print(f"✅ Test 3 PASSED: Extracted {len(facts)} identity facts")
        for f in facts:
            print(f"   - [{f['type']}] {f['content'][:50]}... (conf: {f['confidence']:.2f})")

    def test_04_extract_deadline_urgency(self):
        """Test 4: Extract deadline/urgency"""
        user_msg = "Ho urgenza di ottenere il KITAS entro il 30 novembre, la scadenza del visto turistico è vicina"
        ai_msg = "Capisco l'urgenza. Possiamo accelerare il processo KITAS."

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_4"
        )

        assert len(facts) > 0, "Should extract deadline facts"
        assert any('urgent' in f['content'].lower() or 'scadenza' in f['content'].lower() or 'entro' in f['content'].lower() for f in facts), "Should detect deadline"
        print(f"✅ Test 4 PASSED: Extracted {len(facts)} deadline facts")
        for f in facts:
            print(f"   - [{f['type']}] {f['content'][:50]}... (conf: {f['confidence']:.2f})")

    def test_05_confidence_scoring(self):
        """Test 5: Verify confidence scoring"""
        user_msg = "Sono un investitore italiano con una PT PMA nel settore turistico"
        ai_msg = "Ottimo profilo per il KITAS investor!"

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_5"
        )

        # Business and identity facts should have higher confidence
        high_conf = [f for f in facts if f['confidence'] > 0.8]
        assert len(high_conf) > 0, "Should have high-confidence facts"
        print(f"✅ Test 5 PASSED: {len(high_conf)}/{len(facts)} facts with confidence > 0.8")
        for f in high_conf:
            print(f"   - [{f['type']}] {f['content'][:50]}... (conf: {f['confidence']:.2f})")

    def test_06_deduplication(self):
        """Test 6: Test fact deduplication"""
        user_msg = "Preferisco l'italiano. Voglio comunicare in italiano per business"
        ai_msg = "Perfetto, useremo l'italiano!"

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_6"
        )

        # Should deduplicate similar "preferisco italiano" facts
        assert len(facts) <= 3, "Should limit to top 3 facts after deduplication"
        print(f"✅ Test 6 PASSED: Deduplication working - {len(facts)} unique facts")
        for f in facts:
            print(f"   - [{f['type']}] {f['content'][:50]}... (conf: {f['confidence']:.2f})")

    def test_07_english_extraction(self):
        """Test 7: Extract facts from English conversation"""
        user_msg = "I want to open a PT PMA company in Bali for real estate investment"
        ai_msg = "Great! Real estate PT PMA requires specific KBLI codes."

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_7"
        )

        assert len(facts) > 0, "Should extract English facts"
        assert any('pt pma' in f['content'].lower() or 'company' in f['content'].lower() for f in facts), "Should detect English business terms"
        print(f"✅ Test 7 PASSED: English extraction - {len(facts)} facts")
        for f in facts:
            print(f"   - [{f['type']}] {f['content'][:50]}... (conf: {f['confidence']:.2f})")

    def test_08_mixed_language(self):
        """Test 8: Extract from mixed IT/EN conversation"""
        user_msg = "My name is Andrea, sono italiano e voglio investire in real estate a Bali"
        ai_msg = "Hi Andrea! Real estate investment in Bali requires PT PMA."

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_8"
        )

        assert len(facts) > 0, "Should extract from mixed language"
        print(f"✅ Test 8 PASSED: Mixed language - {len(facts)} facts")
        for f in facts:
            print(f"   - [{f['type']}] {f['content'][:50]}... (conf: {f['confidence']:.2f})")

    def test_09_no_facts_greeting(self):
        """Test 9: No facts from simple greeting"""
        user_msg = "Ciao, come stai?"
        ai_msg = "Ciao! Sto bene grazie, come posso aiutarti?"

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_9"
        )

        # Greetings should extract minimal/no facts
        assert len(facts) <= 1, "Greetings should not extract many facts"
        print(f"✅ Test 9 PASSED: Greeting filtered - {len(facts)} facts (expected 0-1)")

    def test_10_complex_scenario(self):
        """Test 10: Complex real-world scenario"""
        user_msg = """Mi chiamo Luca, sono un imprenditore italiano di Milano.
        Voglio aprire una PT PMA nel settore IT consulting con capitale di 10 miliardi IDR.
        Il mio partner è indonesiano e abbiamo urgenza di completare tutto entro marzo 2025.
        Preferisco comunicare in italiano per questioni legali."""

        ai_msg = """Perfetto Luca! Per una PT PMA nel settore IT consulting serve:
        - KBLI code 62010 (Computer Programming)
        - Capitale minimo: confermato 10 miliardi IDR
        - Partnership mista italo-indonesiana è ottimale
        - Timeline marzo 2025 è fattibile con impegno
        Ti seguiremo in italiano per tutti gli aspetti legali."""

        facts = self.extractor.extract_facts_from_conversation(
            user_message=user_msg,
            ai_response=ai_msg,
            user_id="test_user_10"
        )

        assert len(facts) >= 2, "Should extract multiple facts from complex scenario"

        # Verify different fact types
        fact_types = set(f['type'] for f in facts)
        assert len(fact_types) >= 2, "Should extract different types of facts"

        print(f"✅ Test 10 PASSED: Complex scenario - {len(facts)} facts, {len(fact_types)} types")
        for f in facts:
            print(f"   - [{f['type']}] {f['content'][:60]}... (conf: {f['confidence']:.2f})")


def test_11_memory_context_building():
    """Test 11: Memory context string building"""
    # Simulate memory object
    class MockMemory:
        def __init__(self):
            self.profile_facts = [
                "User prefers Italian language",
                "Opening PT PMA in IT sector",
                "Deadline: March 2025"
            ]
            self.summary = "Italian entrepreneur opening PT PMA"

    memory = MockMemory()

    # Build context string (same logic as router)
    memory_context = "--- USER MEMORY ---\n"
    memory_context += f"Known facts about test_user:\n"
    for fact in memory.profile_facts[:10]:
        memory_context += f"- {fact}\n"

    if memory.summary:
        memory_context += f"\nSummary: {memory.summary[:500]}\n"

    assert len(memory_context) > 50, "Context should be substantial"
    assert "Italian" in memory_context, "Should contain fact content"
    assert "PT PMA" in memory_context, "Should contain fact content"

    print("✅ Test 11 PASSED: Memory context building")
    print(f"   Context length: {len(memory_context)} chars")
    print(f"   Preview:\n{memory_context[:200]}...")


if __name__ == "__main__":
    """Run tests directly with python3"""
    import traceback

    print("=" * 80)
    print("🧪 MEMORY INTEGRATION TEST SUITE - 11 Tests")
    print("=" * 80)
    print()

    test_class = TestMemoryFactExtractor()
    tests = [
        ("Test 1: Italian Preference Extraction", test_class.test_01_extract_preference_italian),
        ("Test 2: PT PMA Business Info", test_class.test_02_extract_business_pt_pma),
        ("Test 3: Personal Identity", test_class.test_03_extract_personal_identity),
        ("Test 4: Deadline/Urgency", test_class.test_04_extract_deadline_urgency),
        ("Test 5: Confidence Scoring", test_class.test_05_confidence_scoring),
        ("Test 6: Deduplication", test_class.test_06_deduplication),
        ("Test 7: English Extraction", test_class.test_07_english_extraction),
        ("Test 8: Mixed Language", test_class.test_08_mixed_language),
        ("Test 9: Greeting Filtering", test_class.test_09_no_facts_greeting),
        ("Test 10: Complex Scenario", test_class.test_10_complex_scenario),
    ]

    passed = 0
    failed = 0

    for i, (name, test_func) in enumerate(tests, 1):
        print(f"\n{'─' * 80}")
        print(f"Running {name}...")
        print(f"{'─' * 80}")
        try:
            test_class.setup_method()
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"❌ FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ ERROR: {e}")
            traceback.print_exc()
            failed += 1

    # Test 11 (standalone)
    print(f"\n{'─' * 80}")
    print("Running Test 11: Memory Context Building...")
    print(f"{'─' * 80}")
    try:
        test_11_memory_context_building()
        passed += 1
    except AssertionError as e:
        print(f"❌ FAILED: {e}")
        failed += 1
    except Exception as e:
        print(f"❌ ERROR: {e}")
        traceback.print_exc()
        failed += 1

    print("\n" + "=" * 80)
    print("📊 TEST RESULTS")
    print("=" * 80)
    print(f"✅ Passed: {passed}/11")
    print(f"❌ Failed: {failed}/11")
    print(f"Success Rate: {(passed/11)*100:.1f}%")
    print("=" * 80)

    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Memory integration is working correctly.")
    else:
        print(f"\n⚠️ {failed} test(s) failed. Review errors above.")

    sys.exit(0 if failed == 0 else 1)
