"""
Quick test for CollaboratorService - Phase 1
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from services.collaborator_service import CollaboratorService


async def test_collaborator_service():
    """Test collaborator identification"""
    service = CollaboratorService(use_firestore=False)

    print("🧪 Testing CollaboratorService\n")
    print("=" * 60)

    # Test 1: Zero (L3)
    print("\n📧 Test 1: zero@balizero.com")
    collab = await service.identify("zero@balizero.com")
    print(f"   Name: {collab.name}")
    print(f"   Ambaradam: {collab.ambaradam_name}")
    print(f"   Sub Rosa Level: L{collab.sub_rosa_level}")
    print(f"   Language: {collab.language}")
    print(f"   Role: {collab.role}")
    assert collab.sub_rosa_level == 3, "Zero should be L3"
    assert collab.language == "it", "Zero should be Italian"
    print("   ✅ PASS")

    # Test 2: Amanda (L2)
    print("\n📧 Test 2: amanda@balizero.com")
    collab = await service.identify("amanda@balizero.com")
    print(f"   Name: {collab.name}")
    print(f"   Ambaradam: {collab.ambaradam_name}")
    print(f"   Sub Rosa Level: L{collab.sub_rosa_level}")
    print(f"   Department: {collab.department}")
    assert collab.sub_rosa_level == 2, "Amanda should be L2"
    assert collab.department == "setup", "Amanda should be in setup"
    print("   ✅ PASS")

    # Test 3: Anonymous (L0)
    print("\n📧 Test 3: random@guest.com")
    collab = await service.identify("random@guest.com")
    print(f"   Name: {collab.name}")
    print(f"   Ambaradam: {collab.ambaradam_name}")
    print(f"   Sub Rosa Level: L{collab.sub_rosa_level}")
    assert collab.sub_rosa_level == 0, "Random user should be L0"
    assert collab.id == "anonymous", "Should be anonymous"
    print("   ✅ PASS")

    # Test 4: Cache (should be instant)
    print("\n📧 Test 4: Cache test (zero@balizero.com again)")
    import time
    start = time.time()
    collab = await service.identify("zero@balizero.com")
    elapsed = (time.time() - start) * 1000
    print(f"   Lookup time: {elapsed:.2f}ms")
    assert elapsed < 5, "Cache should be < 5ms"
    print("   ✅ PASS (cached)")

    # Test 5: Stats
    print("\n📊 Test 5: Team stats")
    stats = service.get_team_stats()
    print(f"   Total members: {stats['total']}")
    print(f"   By Sub Rosa level: {stats['by_sub_rosa_level']}")
    print(f"   By department: {stats['by_department']}")
    print(f"   By language: {stats['by_language']}")
    print("   ✅ PASS")

    print("\n" + "=" * 60)
    print("🎉 ALL TESTS PASSED!\n")


if __name__ == "__main__":
    asyncio.run(test_collaborator_service())
