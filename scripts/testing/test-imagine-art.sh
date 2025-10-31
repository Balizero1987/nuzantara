#!/bin/bash

# Test Imagine.art Integration - NUZANTARA Fly.io
# Usage: ./test-imagine-art.sh

echo "🎨 Testing Imagine.art Integration on NUZANTARA Fly.io..."
echo ""

# Check if server is running
echo "📡 Checking if backend is running..."
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
  echo "❌ Backend not running on port 8080"
  echo "💡 Start it with: npm run dev"
  exit 1
fi

echo "✅ Backend is running"
echo ""

# Test 1: Connection Test
echo "🔌 Test 1: Testing API connection..."
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai-services.image.test"
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 2: Generate Simple Image
echo "📸 Test 2: Generating simple test image..."
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai-services.image.generate",
    "params": {
      "prompt": "Indonesian landscape, rice terraces, sunset",
      "style": "realistic",
      "aspect_ratio": "1:1"
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 3: Generate Complex Image
echo "📸 Test 3: Generating complex image..."
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai-services.image.generate",
    "params": {
      "prompt": "Beautiful Indonesian woman in traditional kebaya, Bali temple background, professional photography, natural lighting, 4K quality",
      "style": "realistic",
      "aspect_ratio": "16:9",
      "negative_prompt": "blurry, low quality, distorted",
      "high_res_results": 1
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 4: Generate with seed (reproducible)
echo "📸 Test 4: Generating with seed (reproducible)..."
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai-services.image.generate",
    "params": {
      "prompt": "Bali Zero office, modern workspace, Indonesian elements",
      "style": "realistic",
      "aspect_ratio": "16:9",
      "seed": 42
    }
  }' | jq '.'

echo ""
echo "✅ All tests completed!"
echo ""
echo "💡 Tips:"
echo "  - Check image_url in responses"
echo "  - Save seed values for reproducibility"
echo "  - Use negative_prompt to improve quality"
echo "  - Try different aspect_ratio values"
