#!/bin/bash

# DevAI RunPod Deployment Helper Script
# Automates configuration and testing

set -e

echo "🚀 DevAI RunPod Deployment Helper"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Load existing .env
source .env

echo "📋 Step 1: Verify Model on HuggingFace"
echo "--------------------------------------"
echo "Model: zeroai87/devai-qwen-2.5-coder-7b"
echo "URL: https://huggingface.co/zeroai87/devai-qwen-2.5-coder-7b"
echo ""
echo -e "${YELLOW}✓ Open the URL above and verify the model exists${NC}"
read -p "Press Enter when verified..."

echo ""
echo "🔧 Step 2: RunPod Configuration"
echo "-------------------------------"
echo ""
echo "Go to: https://www.runpod.io/console/serverless"
echo ""
echo "Create endpoint with these settings:"
echo "  Name: devai-qwen-coder"
echo "  Template: vLLM"
echo "  Model: zeroai87/devai-qwen-2.5-coder-7b"
echo "  GPU: RTX 4090 (24GB)"
echo "  Min Workers: 0"
echo "  Max Workers: 2"
echo ""
echo "Environment Variables:"
echo "  HF_TOKEN: ${HF_API_KEY}"
echo "  MODEL_NAME: zeroai87/devai-qwen-2.5-coder-7b"
echo "  MAX_MODEL_LEN: 8192"
echo "  GPU_MEMORY_UTILIZATION: 0.9"
echo "  TRUST_REMOTE_CODE: true"
echo ""
echo -e "${YELLOW}✓ Create the endpoint and wait for it to be active${NC}"
read -p "Press Enter when endpoint is active..."

echo ""
echo "🔑 Step 3: Enter Endpoint Details"
echo "---------------------------------"
echo ""

# Get endpoint URL
read -p "Enter RunPod Endpoint URL (e.g., https://api.runpod.ai/v2/xxxxx/runsync): " RUNPOD_QWEN_ENDPOINT
read -p "Enter RunPod API Key: " RUNPOD_API_KEY

# Validate inputs
if [ -z "$RUNPOD_QWEN_ENDPOINT" ] || [ -z "$RUNPOD_API_KEY" ]; then
    echo -e "${RED}❌ Endpoint URL and API Key are required${NC}"
    exit 1
fi

echo ""
echo "💾 Step 4: Updating .env"
echo "------------------------"

# Check if keys already exist
if grep -q "RUNPOD_QWEN_ENDPOINT" .env; then
    echo "Updating existing RUNPOD_QWEN_ENDPOINT..."
    sed -i '' "s|RUNPOD_QWEN_ENDPOINT=.*|RUNPOD_QWEN_ENDPOINT=${RUNPOD_QWEN_ENDPOINT}|" .env
else
    echo "" >> .env
    echo "# DevAI (Qwen 2.5 Coder) - RunPod" >> .env
    echo "RUNPOD_QWEN_ENDPOINT=${RUNPOD_QWEN_ENDPOINT}" >> .env
fi

if grep -q "^RUNPOD_API_KEY" .env; then
    echo "RUNPOD_API_KEY already exists, skipping..."
else
    echo "RUNPOD_API_KEY=${RUNPOD_API_KEY}" >> .env
fi

echo -e "${GREEN}✅ .env updated${NC}"

# Reload .env
source .env

echo ""
echo "🧪 Step 5: Testing Endpoint"
echo "---------------------------"
echo ""

# Create test payload for vLLM
echo "Sending test request..."
echo "(This may take 20-30s on first request - cold start)"
echo ""

# vLLM OpenAI-compatible format
RESPONSE=$(curl -s -X POST "${RUNPOD_QWEN_ENDPOINT}" \
  -H "Authorization: Bearer ${RUNPOD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "model": "zeroai87/devai-qwen-2.5-coder-7b",
      "messages": [
        {
          "role": "system",
          "content": "You are DevAI, an expert code assistant."
        },
        {
          "role": "user",
          "content": "Say Hello from DevAI in one sentence."
        }
      ],
      "max_tokens": 50,
      "temperature": 0.7
    }
  }')

# Check response
if echo "$RESPONSE" | grep -q "COMPLETED"; then
    echo -e "${GREEN}✅ Endpoint test SUCCESSFUL!${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${RED}❌ Endpoint test FAILED${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check RunPod dashboard for errors"
    echo "2. Verify endpoint is Active"
    echo "3. Check HF_TOKEN is correct"
    echo "4. Wait 30-60s for model to load (cold start)"
    exit 1
fi

echo ""
echo "📊 Step 6: Verification Summary"
echo "-------------------------------"
echo ""
echo -e "${GREEN}✅ Model: zeroai87/devai-qwen-2.5-coder-7b${NC}"
echo -e "${GREEN}✅ Endpoint configured: ${RUNPOD_QWEN_ENDPOINT}${NC}"
echo -e "${GREEN}✅ .env updated${NC}"
echo -e "${GREEN}✅ Test successful${NC}"
echo ""

echo "💰 Cost Estimate:"
echo "  GPU: RTX 4090 @ \$0.34/hour"
echo "  Development usage: ~2h/day = ~\$20/month"
echo "  Scales to zero when idle = \$0"
echo ""

echo "🚀 Next Steps:"
echo "  1. Create DevAI TypeScript handler"
echo "  2. Register handlers in router"
echo "  3. Test via NUZANTARA API"
echo ""
echo "Run: npm run devai:integrate"
echo ""

echo -e "${GREEN}🎉 DevAI RunPod deployment complete!${NC}"

