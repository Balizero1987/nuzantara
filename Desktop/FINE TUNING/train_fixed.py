#!/usr/bin/env python3
import os, sys, torch, gc
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, DataCollatorForLanguageModeling, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

torch.cuda.empty_cache()
gc.collect()
os.environ["CUDA_VISIBLE_DEVICES"] = "0"

MODEL = "unsloth/Llama-4-Scout-17B-16E-Instruct"
DATA = "/workspace/dataset.jsonl"
OUT = "/workspace/zantara_model"
HF = os.environ.get("HF_TOKEN")
TEST = "--test" in sys.argv
STEPS = 100 if TEST else 3000

print(f"🎯 Training: {STEPS} steps")
print(f"🔧 Model: {MODEL}")

bnb = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16
)

print("📥 Loading model on GPU 0 only...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL,
    quantization_config=bnb,
    device_map="cuda:0",
    trust_remote_code=True,
    token=HF,
    torch_dtype=torch.bfloat16
)

model = prepare_model_for_kbit_training(model)

tok = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1", use_fast=True)
if tok.pad_token is None:
    tok.pad_token = tok.eos_token
model.config.pad_token_id = tok.pad_token_id

lora = LoraConfig(
    r=64,
    lora_alpha=128,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, lora)
model.print_trainable_parameters()

print("📊 Loading dataset...")
ds = load_dataset('json', data_files=DATA, split='train').train_test_split(test_size=0.05, seed=42)

def tok_fn(ex):
    return tok(ex['text'], truncation=True, max_length=1024, padding=False)

tr = ds['train'].map(tok_fn, batched=True, remove_columns=ds['train'].column_names)
ev = ds['test'].map(tok_fn, batched=True, remove_columns=ds['test'].column_names)

args = TrainingArguments(
    output_dir=OUT,
    max_steps=STEPS,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    learning_rate=2e-5,
    lr_scheduler_type="cosine",
    warmup_steps=100,
    optim="paged_adamw_8bit",
    gradient_checkpointing=True,
    bf16=True,
    logging_steps=10,
    eval_strategy="steps",
    eval_steps=50,
    save_strategy="steps",
    save_steps=100,
    save_total_limit=3,
    load_best_model_at_end=True,
    seed=42
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=tr,
    eval_dataset=ev,
    data_collator=DataCollatorForLanguageModeling(tokenizer=tok, mlm=False)
)

print("🚀 Training started...")
trainer.train()
trainer.save_model(OUT)
tok.save_pretrained(OUT)
print(f"✅ DONE! Model saved to {OUT}")
