#!/usr/bin/env python3
"""
DevAI Training - Qwen 2.5 Coder 7B Instruct
QLoRA 4-bit fine-tuning for code generation tasks
"""

import os, torch, json
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TrainingArguments
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
from datasets import Dataset

print("="*70)
print("🔥 DEVAI TRAINING - Qwen 2.5 Coder 7B Instruct")
print("="*70)

os.environ["HF_TOKEN"] = "hf_XXXXXXXXXXXXXXX"

print(f"\nGPU: {torch.cuda.get_device_name(0)}")
print(f"Memory: {torch.cuda.get_device_properties(0).total_memory/1e9:.1f} GB")
print("="*70)

# Load model
print("\n[1/6] Loading Qwen 2.5 Coder 7B Instruct...")
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-Coder-7B-Instruct",
    quantization_config=BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16
    ),
    device_map="auto",
    token=os.environ["HF_TOKEN"],
    trust_remote_code=True
)

print("[2/6] Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    "Qwen/Qwen2.5-Coder-7B-Instruct",
    token=os.environ["HF_TOKEN"],
    trust_remote_code=True
)
tokenizer.pad_token = tokenizer.eos_token

print("[3/6] Adding LoRA...")
model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, LoraConfig(
    r=64,
    lora_alpha=128,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
))
print("Trainable parameters:")
model.print_trainable_parameters()

print("\n[4/6] Loading DevAI dataset...")
examples = []
with open("/workspace/DEVAI_train.jsonl", "r") as f:
    for line in f:
        examples.append(json.loads(line))
dataset = Dataset.from_list(examples)
print(f"✅ Loaded {len(dataset)} examples")

print("[5/6] Configuring trainer...")
def format_devai(ex):
    """Format DevAI examples for Qwen chat format"""
    question = ex['question']
    answer = ex['answer']
    context = ex.get('context', '')

    # Qwen 2.5 chat format
    text = f"<|im_start|>system\nYou are DevAI, an expert code assistant for NUZANTARA project.<|im_end|>\n"
    text += f"<|im_start|>user\n{question}"
    if context:
        text += f"\n\nContext:\n{context}"
    text += f"<|im_end|>\n"
    text += f"<|im_start|>assistant\n{answer}<|im_end|>"

    return text

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    args=TrainingArguments(
        output_dir="/workspace/devai_qwen",
        num_train_epochs=3,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=2,
        optim="paged_adamw_8bit",
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_steps=50,
        bf16=True,
        logging_steps=20,
        save_steps=200,
        save_total_limit=3,
        report_to="none"
    ),
    formatting_func=format_devai
)

print("\n[6/6] 🔥 STARTING TRAINING...")
print(f"Dataset: {len(dataset)} examples")
print(f"Epochs: 3")
print(f"Estimated time: ~30-45 minutes")
print("="*70)

trainer.train()

print("\n✅ TRAINING COMPLETE! Saving model...")
trainer.save_model("/workspace/devai_qwen")
tokenizer.save_pretrained("/workspace/devai_qwen")

print("="*70)
print("✅ MODEL SAVED: /workspace/devai_qwen/")
print("="*70)
