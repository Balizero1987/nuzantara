#!/bin/bash

# Setup script for SahabatAI integration
# Run this to prepare the environment for natural Indonesian language model

set -e

echo "=================================================="
echo "🇮🇩 SAHABATAI SETUP - Natural Bahasa Indonesia"
echo "=================================================="
echo ""

# Check if running in backend-rag directory
if [ ! -f "pyproject.toml" ] && [ ! -f "requirements.txt" ]; then
    echo "⚠️  Please run this script from apps/backend-rag directory"
    exit 1
fi

echo "Step 1: Installing Python dependencies..."
pip install transformers>=4.40.0 accelerate>=0.30.0 bitsandbytes>=0.43.0

echo ""
echo "Step 2: Checking GPU availability..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    echo "✅ GPU detected"
    USE_GPU=true
else
    echo "⚠️  No GPU detected - will use CPU (slower)"
    USE_GPU=false
fi

echo ""
echo "Step 3: Downloading SahabatAI model..."
echo "   Model: GoToCompany/gemma2-9b-cpt-sahabatai-v1-instruct"
echo "   Size: ~9GB (quantized) or ~18GB (full)"
echo ""
echo "   This may take 10-30 minutes depending on internet speed..."
echo ""

python3 << 'PYTHON_SCRIPT'
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_name = "GoToCompany/gemma2-9b-cpt-sahabatai-v1-instruct"

print("📥 Downloading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
print("✅ Tokenizer cached")

print("📥 Downloading model (this will take a while)...")
# Download but don't load to memory
_ = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,
    device_map=None,  # Don't load to device yet
    low_cpu_mem_usage=True
)
print("✅ Model cached successfully")
PYTHON_SCRIPT

echo ""
echo "Step 4: Testing SahabatAI client..."
cd backend
python -m llm.sahabat_ai_client

echo ""
echo "=================================================="
echo "✅ SAHABATAI SETUP COMPLETE"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review test output above for naturalness"
echo "2. Show responses to Indonesian team for validation"
echo "3. If natural (>8/10), integrate into production"
echo ""
echo "To test intelligent router:"
echo "   python -m llm.intelligent_router"
echo ""
echo "To use in your code:"
echo "   from llm.intelligent_router import IntelligentModelRouter"
echo "   router = IntelligentModelRouter(enable_sahabat=True)"
echo "   response = await router.route_query(messages)"
echo ""
