#!/bin/bash
# RunPod Merge Script - Merge Llama 3.1 LoRA on RunPod GPU
# Run this on a RunPod instance with GPU

set -e

echo "🚀 ZANTARA Llama 3.1 Merge on RunPod GPU"
echo "========================================"

# Install dependencies
echo "📦 Installing dependencies..."
pip install -q transformers peft accelerate bitsandbytes huggingface_hub

# Login to HuggingFace
# Set HF_TOKEN environment variable before running this script
if [ -z "$HF_TOKEN" ]; then
  echo "❌ Error: HF_TOKEN not set"
  echo "Run: export HF_TOKEN='your_token_here'"
  exit 1
fi
huggingface-cli login --token $HF_TOKEN

# Create merge script
cat > /workspace/merge.py << 'EOFPYTHON'
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
from huggingface_hub import HfApi

print("🔥 Loading base model...")
BASE_MODEL = "meta-llama/Llama-3.1-8B-Instruct"
ADAPTER_MODEL = "zeroai87/zantara-llama-3.1-8b"
OUTPUT_MODEL = "zeroai87/zantara-llama-3.1-8b-merged"

# Load with GPU
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    torch_dtype=torch.float16,
    device_map="auto"
)

print("✅ Base model loaded")
print(f"🔧 Loading adapter from {ADAPTER_MODEL}...")

model = PeftModel.from_pretrained(base_model, ADAPTER_MODEL)

print("✅ Adapter loaded")
print("🔀 Merging...")

merged_model = model.merge_and_unload()

print("✅ Merge complete!")
print("💾 Saving merged model...")

merged_model.save_pretrained("/workspace/merged_model")
tokenizer.save_pretrained("/workspace/merged_model")

print("✅ Model saved locally")
print("📤 Uploading to HuggingFace Hub...")

api = HfApi()
api.create_repo(OUTPUT_MODEL, exist_ok=True, private=False)

merged_model.push_to_hub(OUTPUT_MODEL)
tokenizer.push_to_hub(OUTPUT_MODEL)

print(f"✅ Upload complete!")
print(f"🔗 Model: https://huggingface.co/{OUTPUT_MODEL}")
EOFPYTHON

# Run merge
echo "⏳ Running merge (will take 5-10 minutes)..."
python /workspace/merge.py

echo ""
echo "🎉 MERGE COMPLETED!"
echo "================================"
echo "✅ Model merged and uploaded to HuggingFace"
echo "🔗 URL: https://huggingface.co/zeroai87/zantara-llama-3.1-8b-merged"
echo ""
echo "Next steps:"
echo "1. Use this model in RunPod Serverless endpoint"
echo "2. Or use directly via HuggingFace Inference API (free)"
