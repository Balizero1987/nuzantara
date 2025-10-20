#!/usr/bin/env python3
"""
Merge ZANTARA Llama 3.1 LoRA adapter with base model
Creates a standalone model for HuggingFace Inference API
"""

import os
import sys
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# Config
BASE_MODEL_ID = "meta-llama/Llama-3.1-8B-Instruct"
ADAPTER_PATH = "/Users/antonellosiano/Desktop/NUZANTARA-2/ml/models"
OUTPUT_PATH = "/Users/antonellosiano/Desktop/NUZANTARA-2/ml/models/zantara-llama-3.1-8b-merged"
HF_TOKEN = os.getenv("HF_TOKEN", "")

def check_files():
    """Verify adapter files exist"""
    print("🔍 Checking adapter files...")
    required_files = [
        "adapter_config.json",
        "adapter_model.safetensors"
    ]

    for file in required_files:
        filepath = os.path.join(ADAPTER_PATH, file)
        if not os.path.exists(filepath):
            print(f"❌ Missing file: {file}")
            return False
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f"  ✅ {file} ({size_mb:.1f} MB)")

    return True

def download_base_model():
    """Download base Llama 3.1 model"""
    print(f"\n📥 Downloading base model: {BASE_MODEL_ID}")
    print("⏳ This will take 5-10 minutes (16GB)...")

    start_time = time.time()

    try:
        # Download with auth token for gated models
        print("🔑 Using HuggingFace token for authentication...")

        tokenizer = AutoTokenizer.from_pretrained(
            BASE_MODEL_ID,
            token=HF_TOKEN
        )

        model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_ID,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
            token=HF_TOKEN
        )

        elapsed = time.time() - start_time
        print(f"✅ Base model downloaded in {elapsed/60:.1f} minutes")

        return model, tokenizer

    except Exception as e:
        print(f"❌ Error downloading base model: {e}")
        print("\n💡 Note: Llama 3.1 requires acceptance of license at:")
        print(f"   https://huggingface.co/{BASE_MODEL_ID}")
        return None, None

def load_adapter_and_merge(base_model, tokenizer):
    """Load adapter and merge with base model"""
    print(f"\n🔧 Loading LoRA adapter from: {ADAPTER_PATH}")

    try:
        # Load adapter
        print("⏳ Loading adapter...")
        model = PeftModel.from_pretrained(
            base_model,
            ADAPTER_PATH
        )

        print("✅ Adapter loaded")

        # Merge
        print("\n🔀 Merging adapter with base model...")
        print("⏳ This will take 2-3 minutes...")

        start_time = time.time()
        merged_model = model.merge_and_unload()
        elapsed = time.time() - start_time

        print(f"✅ Merge completed in {elapsed:.1f}s")

        return merged_model, tokenizer

    except Exception as e:
        print(f"❌ Error during merge: {e}")
        return None, None

def test_inference(model, tokenizer):
    """Test merged model with sample inference"""
    print("\n🧪 Testing merged model inference...")

    test_prompt = "What is ZANTARA?"

    # Format in Llama 3.1 chat format
    messages = [
        {"role": "system", "content": "You are ZANTARA, an intelligent AI assistant."},
        {"role": "user", "content": test_prompt}
    ]

    try:
        # Apply chat template
        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        print(f"📝 Test prompt: {test_prompt}")
        print("⏳ Generating...")

        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        start_time = time.time()

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=100,
                temperature=0.7,
                top_p=0.9,
                do_sample=True
            )

        elapsed = time.time() - start_time

        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Extract assistant response
        if "assistant" in response:
            answer = response.split("assistant")[-1].strip()
        else:
            answer = response

        print(f"\n✅ Inference successful ({elapsed:.1f}s):")
        print(f"💬 {answer[:200]}...")

        return True

    except Exception as e:
        print(f"❌ Inference test failed: {e}")
        return False

def save_merged_model(model, tokenizer):
    """Save merged model to disk"""
    print(f"\n💾 Saving merged model to: {OUTPUT_PATH}")
    print("⏳ This will take 2-3 minutes...")

    try:
        os.makedirs(OUTPUT_PATH, exist_ok=True)

        start_time = time.time()

        # Save model
        model.save_pretrained(
            OUTPUT_PATH,
            safe_serialization=True,
            max_shard_size="5GB"
        )

        # Save tokenizer
        tokenizer.save_pretrained(OUTPUT_PATH)

        elapsed = time.time() - start_time

        # Check size
        total_size = sum(
            os.path.getsize(os.path.join(OUTPUT_PATH, f))
            for f in os.listdir(OUTPUT_PATH)
            if os.path.isfile(os.path.join(OUTPUT_PATH, f))
        )
        size_gb = total_size / (1024**3)

        print(f"✅ Model saved in {elapsed:.1f}s")
        print(f"📦 Total size: {size_gb:.2f} GB")

        return True

    except Exception as e:
        print(f"❌ Error saving model: {e}")
        return False

def main():
    print("🚀 ZANTARA Llama 3.1 LoRA Merge Script")
    print("=" * 60)

    # Step 1: Check adapter files
    if not check_files():
        print("\n❌ Adapter files check failed")
        sys.exit(1)

    # Step 2: Download base model
    print("\n" + "=" * 60)
    base_model, tokenizer = download_base_model()
    if base_model is None:
        sys.exit(1)

    # Step 3: Load adapter and merge
    print("\n" + "=" * 60)
    merged_model, tokenizer = load_adapter_and_merge(base_model, tokenizer)
    if merged_model is None:
        sys.exit(1)

    # Step 4: Test inference
    print("\n" + "=" * 60)
    if not test_inference(merged_model, tokenizer):
        print("\n⚠️  Warning: Inference test failed, but merge may still be valid")
        response = input("Continue with save? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)

    # Step 5: Save merged model
    print("\n" + "=" * 60)
    if not save_merged_model(merged_model, tokenizer):
        sys.exit(1)

    print("\n" + "=" * 60)
    print("🎉 MERGE COMPLETED SUCCESSFULLY!")
    print(f"\n📁 Merged model location: {OUTPUT_PATH}")
    print(f"📊 Model size: ~16GB")
    print("\n🔗 Next steps:")
    print("  1. Test local inference")
    print("  2. Upload to HuggingFace Hub")
    print("  3. Test via Inference API")

if __name__ == "__main__":
    main()
