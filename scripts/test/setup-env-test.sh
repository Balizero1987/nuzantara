#!/bin/bash

# ⚠️ TEMPORARY ENVIRONMENT SETUP FOR TESTING
# DO NOT COMMIT THIS FILE TO GIT!

echo "🔐 Setting up environment variables for testing..."
echo "⚠️  Remember to rotate these keys after testing!"

# Export environment variables
export HF_API_KEY="YOUR_HUGGINGFACE_API_KEY"
export RUNPOD_API_KEY="YOUR_RUNPOD_API_KEY"
export WHATSAPP_TOKEN="YOUR_WHATSAPP_TOKEN"
export WHATSAPP_VERIFY_TOKEN="zantara-balizero-2025-secure-token"

# RunPod endpoints (FOUND!)
export RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync"  # Zantara_LLAMA_3.1
export RUNPOD_QWEN_ENDPOINT="https://api.runpod.ai/v2/5g2h6nbyls47i7/runsync"   # DevAI_Qwen

# API Keys for backend
export API_KEYS_INTERNAL="zantara-internal-dev-key-2025"
export API_KEYS_EXTERNAL="zantara-external-dev-key-2025"

# RAG Backend
export RAG_BACKEND_URL="http://localhost:8000"

echo "✅ Environment variables set for current session"
echo ""
echo "📝 TODO: You still need to:"
echo "1. Get the actual RunPod endpoint URLs for LLAMA and QWEN"
echo "2. Update RUNPOD_LLAMA_ENDPOINT and RUNPOD_QWEN_ENDPOINT"
echo ""
echo "🚀 To start the backend with these variables:"
echo "   npm run dev"
echo ""
echo "⚠️  SECURITY REMINDER:"
echo "   - These variables are only set for this terminal session"
echo "   - Close terminal when done testing"
echo "   - Consider rotating API keys after testing"
echo "   - NEVER commit these keys to Git!"
