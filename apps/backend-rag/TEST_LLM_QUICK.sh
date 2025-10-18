#!/bin/bash
# Quick test for ZANTARA LLM Integration

echo "🧪 ZANTARA LLM Integration - Quick Test"
echo "========================================"

# Test 1: Imports
echo -e "\n[1/3] Testing imports..."
python3 << 'PYEOF'
try:
    from backend.services.ollama_client import OllamaClient
    from backend.services.rag_generator import RAGGenerator
    print("✅ Imports OK")
except Exception as e:
    print(f"❌ Import failed: {e}")
    exit(1)
PYEOF

# Test 2: Ollama health
echo -e "\n[2/3] Testing Ollama health..."
if curl -s http://localhost:11434 > /dev/null 2>&1; then
    echo "✅ Ollama running"
else
    echo "⚠️  Ollama not running (start with: ollama serve)"
fi

# Test 3: List models
echo -e "\n[3/3] Available models:"
python3 << 'PYEOF'
import asyncio
import sys
sys.path.insert(0, 'backend')
from services.ollama_client import OllamaClient

async def test():
    client = OllamaClient()
    models = await client.list_models()
    if models:
        for m in models:
            print(f"   - {m}")
    else:
        print("   (No models found - run: ollama pull llama3.2)")
    await client.close()

asyncio.run(test())
PYEOF

echo -e "\n✅ Quick test complete!"
echo "Run full test: python3 backend/services/rag_generator.py"
