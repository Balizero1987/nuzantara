#!/usr/bin/env python3
"""
Test script for Phase 1+2 tool prefetch implementation
Tests pricing and team queries with SSE streaming
"""

import asyncio
import sys
import json
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "apps" / "backend-rag" / "backend"
sys.path.insert(0, str(backend_path))

from services.intelligent_router import IntelligentRouter
from services.tool_executor import ToolExecutor
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_pricing_query():
    """Test pricing query with prefetch"""
    print("\n" + "="*80)
    print("TEST 1: Pricing Query Detection (unit test)")
    print("="*80)
    
    # Create minimal router without full init (just for method testing)
    from services.intelligent_router import IntelligentRouter
    
    # Test the detection method directly (it's stateless)
    test_queries = [
        "berapa harga C1 visa?",
        "quanto costa KITAS E23?",
        "what's the price for D12 visa?",
        "how much is PT PMA setup?"
    ]
    
    for query in test_queries:
        print(f"\n📝 Query: {query}")
        print("-" * 80)
        
        # Call static method directly
        router_instance = object.__new__(IntelligentRouter)  # Create empty instance
        tool_needs = router_instance._detect_tool_needs(query)
        print(f"🔍 Detection: {json.dumps(tool_needs, indent=2)}")
        
        if tool_needs.get("should_prefetch"):
            print("✅ PRICING detected - will prefetch")
        else:
            print("❌ NOT detected as pricing query")
        
        print()


async def test_team_query():
    """Test team query with prefetch"""
    print("\n" + "="*80)
    print("TEST 2: Team Query Detection (unit test)")
    print("="*80)
    
    from services.intelligent_router import IntelligentRouter
    
    test_queries = [
        "chi è Adit?",
        "who is in the team?",
        "siapa anggota tim tax?",
        "list all team members"
    ]
    
    for query in test_queries:
        print(f"\n📝 Query: {query}")
        print("-" * 80)
        
        # Call method on empty instance
        router_instance = object.__new__(IntelligentRouter)
        tool_needs = router_instance._detect_tool_needs(query)
        print(f"🔍 Detection: {json.dumps(tool_needs, indent=2)}")
        
        if tool_needs.get("should_prefetch"):
            print("✅ TEAM query detected - will prefetch")
        else:
            print("❌ NOT detected as team query")
        
        print()


async def test_non_tool_query():
    """Test queries that should NOT trigger prefetch"""
    print("\n" + "="*80)
    print("TEST 3: Non-Tool Queries (should NOT prefetch)")
    print("="*80)
    
    from services.intelligent_router import IntelligentRouter
    
    test_queries = [
        "ciao come stai?",
        "what is Indonesia known for?",
        "explain KITAS requirements",
        "tell me about Bali culture"
    ]
    
    for query in test_queries:
        print(f"\n📝 Query: {query}")
        print("-" * 80)
        
        # Call method on empty instance
        router_instance = object.__new__(IntelligentRouter)
        tool_needs = router_instance._detect_tool_needs(query)
        print(f"🔍 Detection: {json.dumps(tool_needs, indent=2)}")
        
        if not tool_needs.get("should_prefetch"):
            print("✅ Correctly NOT triggering prefetch")
        else:
            print("❌ False positive - should not prefetch")
        
        print()


async def test_tool_descriptions():
    """Test that tool descriptions have trigger keywords"""
    print("\n" + "="*80)
    print("TEST 4: Tool Descriptions (check for trigger keywords)")
    print("="*80)
    
    from services.zantara_tools import ZantaraTools
    
    tools = ZantaraTools(
        pricing=True,
        memory=None,
        collaborator=True
    )
    
    tool_definitions = tools.get_tools()
    
    # Check pricing tool
    pricing_tool = next((t for t in tool_definitions if t["name"] == "get_pricing"), None)
    if pricing_tool:
        desc = pricing_tool["description"]
        trigger_keywords = ["TRIGGER KEYWORDS", "harga", "price", "cost", "berapa"]
        has_keywords = all(kw in desc for kw in trigger_keywords)
        
        print(f"\n📋 get_pricing tool:")
        print(f"   Description length: {len(desc)} chars")
        print(f"   Has trigger keywords: {'✅' if has_keywords else '❌'}")
        if not has_keywords:
            print(f"   Missing keywords: {[kw for kw in trigger_keywords if kw not in desc]}")
    
    # Check team tool
    team_tool = next((t for t in tool_definitions if t["name"] == "get_team_members_list"), None)
    if team_tool:
        desc = team_tool["description"]
        trigger_keywords = ["TRIGGER KEYWORDS", "team", "tim", "who is", "chi è"]
        has_keywords = all(kw in desc for kw in trigger_keywords)
        
        print(f"\n📋 get_team_members_list tool:")
        print(f"   Description length: {len(desc)} chars")
        print(f"   Has trigger keywords: {'✅' if has_keywords else '❌'}")
        if not has_keywords:
            print(f"   Missing keywords: {[kw for kw in trigger_keywords if kw not in desc]}")
    
    print()


async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("🧪 PHASE 1+2 TOOL PREFETCH TESTS")
    print("="*80)
    print("\nTesting tool detection and prefetch logic...")
    
    try:
        # Test 1: Pricing detection
        await test_pricing_query()
        
        # Test 2: Team detection
        await test_team_query()
        
        # Test 3: Non-tool queries
        await test_non_tool_query()
        
        # Test 4: Tool descriptions
        await test_tool_descriptions()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS COMPLETED")
        print("="*80)
        print("\nNext step: Test with live streaming endpoint")
        print("Try: curl -X POST http://localhost:8000/api/chat/stream \\")
        print('     -H "Content-Type: application/json" \\')
        print('     -d \'{"message": "berapa harga C1 visa?", "user_id": "test"}\'')
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
