#!/usr/bin/env python3
"""
Check Llama Scout Metrics & Status
Direct investigation of LlamaScoutClient status
"""

import asyncio
import os
import sys
import logging
from datetime import datetime

# Add the backend-rag directory to Python path
sys.path.insert(0, '/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag')

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_llama_scout_direct():
    """Test LlamaScoutClient directly"""
    
    print("🔍 LLAMA SCOUT DIRECT TEST")
    print("=" * 40)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    try:
        # Import LlamaScoutClient
        from backend.llm.llama_scout_client import LlamaScoutClient
        
        # Initialize with environment variables (same as production)
        openrouter_key = os.getenv("OPENROUTER_API_KEY_LLAMA", "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")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "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")
        
        print(f"🔑 OpenRouter Key: {'✅ SET' if openrouter_key else '❌ MISSING'}")
        print(f"🔑 Anthropic Key: {'✅ SET' if anthropic_key else '❌ MISSING'}")
        print()
        
        # Initialize client
        client = LlamaScoutClient(
            openrouter_api_key=openrouter_key,
            anthropic_api_key=anthropic_key,
            force_haiku=False
        )
        
        print(f"🎯 Client available: {client.is_available()}")
        print(f"🦙 Llama client: {'✅' if client.llama_client else '❌'}")
        print(f"🔵 Haiku client: {'✅' if client.haiku_client else '❌'}")
        print()
        
        # Test simple chat
        print("🧪 Testing simple chat...")
        result = await client.chat_async(
            messages=[{"role": "user", "content": "Hello, please identify your AI model name"}],
            max_tokens=100
        )
        
        print(f"✅ Response: {result['text'][:100]}...")
        print(f"🤖 Model: {result['model']}")
        print(f"🏢 Provider: {result['provider']}")
        print(f"💰 Cost: ${result['cost']:.6f}")
        print(f"🔢 Tokens: {result['tokens']}")
        print()
        
        # Get metrics
        metrics = client.get_metrics()
        print("📊 CURRENT METRICS")
        print("-" * 20)
        for key, value in metrics.items():
            print(f"{key}: {value}")
        print()
        
        # Test conversational method (IntelligentRouter compatibility)
        print("🧪 Testing conversational method...")
        conv_result = await client.conversational(
            message="Quick test - what's your model?",
            user_id="test_user"
        )
        
        print(f"✅ Conversational response: {conv_result['text'][:80]}...")
        print(f"🤖 AI Used: {conv_result['ai_used']}")
        print(f"🏢 Provider: {conv_result['provider']}")
        print()
        
        # Final metrics
        final_metrics = client.get_metrics()
        print("📊 FINAL METRICS")
        print("-" * 20)
        for key, value in final_metrics.items():
            print(f"{key}: {value}")
        print()
        
        # Analyze performance
        print("🎯 ANALYSIS")
        print("-" * 15)
        
        if conv_result['ai_used'] == 'llama-scout':
            print("✅ Llama Scout is ACTIVE and working")
            print("✅ Primary AI is functioning correctly")
        else:
            print("⚠️  Haiku fallback was used instead of Llama Scout")
            print("⚠️  This might indicate Llama Scout issues")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("❌ LlamaScoutClient not available")
        return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    # Set environment variables for testing
    os.environ['OPENROUTER_API_KEY_LLAMA'] = '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'
    os.environ['ANTHROPIC_API_KEY'] = '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'
    
    # Run the test
    asyncio.run(test_llama_scout_direct())