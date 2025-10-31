#!/usr/bin/env python3
"""
Test script for webapp testing functionality
"""

import asyncio
import json
from agents.chatgpt_browser import ChatGPTBrowserAgent


async def test_webapp():
    """Test the webapp functionality"""

    print("=" * 60)
    print("WEBAPP TESTING - Zantara.balizero.com")
    print("=" * 60)

    agent = ChatGPTBrowserAgent()

    try:
        print("\nInitializing agent...")
        await agent.initialize()

        print("\nTesting webapp with question: 'quanto costa kitas e23 freelance offshore?'")
        print("-" * 60)

        # Execute test
        result = await agent.execute("test_webapp", {})

        # Display results
        print("\n" + "=" * 60)
        print("TEST RESULTS")
        print("=" * 60)

        print(f"\n✓ Success: {result.get('success', False)}")
        print(f"✓ Response Quality: {result.get('response_quality', 'N/A')}")
        print(f"✓ Timestamp: {result.get('timestamp', 'N/A')}")

        if result.get('response_preview'):
            print(f"\n📝 Response Preview (first 500 chars):")
            print("-" * 40)
            print(result.get('response_preview'))
            print("-" * 40)

        if result.get('issues'):
            print(f"\n⚠️  Issues Found ({len(result['issues'])}):")
            for i, issue in enumerate(result['issues'], 1):
                print(f"  {i}. {issue}")
        else:
            print("\n✅ No issues found!")

        # Save full result to JSON
        output_file = "/tmp/webapp_test_result.json"
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\nFull results saved to: {output_file}")

        # Quality assessment
        print("\n" + "=" * 60)
        print("QUALITY ASSESSMENT")
        print("=" * 60)

        quality = result.get('response_quality', 'failed')
        if quality == 'excellent':
            print("✅ EXCELLENT: Response includes specific costs and KITAS E23 information")
        elif quality == 'good':
            print("⚠️  GOOD: Response has some relevant information but missing details")
        elif quality == 'poor':
            print("❌ POOR: Response lacks critical information")
        else:
            print("❌ FAILED: Test could not be completed")

    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        print("\nCleaning up...")
        await agent.cleanup()
        print("Done!")


if __name__ == "__main__":
    print("Starting webapp test...\n")
    asyncio.run(test_webapp())