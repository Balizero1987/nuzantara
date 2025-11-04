#!/usr/bin/env python3
"""
Llama 3.1 8B ULTIMATE TRAINING - Parametri al MASSIMO per A100
Dataset: NUZANTARA_VERO_DATASET.jsonl (20,903 examples)
Target: 7,839 steps (3 epochs) - ~12 ore
"""
import logging
import sys
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import torch

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

MODEL = "meta-llama/Meta-Llama-3.1-8B-Instruct"
DATA = "/workspace/NUZANTARA_VERO_DATASET.jsonl"
OUTPUT = "/workspace/zantara_llama31_ULTIMATE"

def main():
    logger.info("🚀 ZANTARA LLAMA 3.1 8B - ULTIMATE TRAINING")
    logger.info("=" * 80)
    logger.info("⚡ PARAMETRI AL MASSIMO PER A100 80GB")
    logger.info("=" * 80)

    # Load dataset
    logger.info(f"📥 Loading dataset from {DATA}...")
    dataset = load_dataset('json', data_files=DATA, split='train')
    logger.info(f"✅ Loaded {len(dataset)} examples")

    # Split train/eval (95/5)
    split = dataset.train_test_split(test_size=0.05, seed=42)
    train_dataset = split['train']
    eval_dataset = split['test']
    logger.info(f"📊 Train: {len(train_dataset)}, Eval: {len(eval_dataset)}")

    # Load tokenizer
    logger.info("🔤 Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # Tokenize function - CONTEXT DINAMICO (non sprecare memoria su conversazioni corte)
    def format_and_tokenize(examples):
        texts = []
        for messages in examples['messages']:
            text = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=False
            )
            texts.append(text)

        # Tokenize SENZA padding fisso (risparmio memoria!)
        model_inputs = tokenizer(
            texts,
            truncation=True,
            max_length=4096,  # 4K context (99.9% esempi ci stanno, più veloce di 8K)
            padding=False,  # Dynamic padding nel DataCollator
            return_tensors=None
        )
        model_inputs["labels"] = model_inputs["input_ids"].copy()
        return model_inputs

    # Tokenize datasets
    logger.info("⚙️ Tokenizing datasets...")
    train_tokenized = train_dataset.map(
        format_and_tokenize,
        batched=True,
        remove_columns=train_dataset.column_names,
        desc="Tokenizing train",
        num_proc=4  # Parallelo su 4 CPU cores
    )
    eval_tokenized = eval_dataset.map(
        format_and_tokenize,
        batched=True,
        remove_columns=eval_dataset.column_names,
        desc="Tokenizing eval",
        num_proc=4
    )
    logger.info(f"✅ Tokenized: train={len(train_tokenized)}, eval={len(eval_tokenized)}")

    # Load model in FP16 (A100 supporta bfloat16 ma fp16 è più compatibile)
    logger.info("🤖 Loading model in FP16...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
        use_cache=False  # Necessario per gradient checkpointing
    )

    # LoRA config - MASSIMO PER A100
    logger.info("🔧 Applying LoRA with MAXIMUM parameters...")
    lora_config = LoraConfig(
        r=128,  # MASSIMO rank (era 64, raddoppiato!)
        lora_alpha=256,  # 2x rank (best practice)
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",  # Attention
            "gate_proj", "up_proj", "down_proj"      # MLP
        ],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Training args - OTTIMIZZATI PER A100
    # A100 80GB può fare batch_size=2 con 4K context + grad checkpointing
    # Effective batch = 2 * 8 = 16
    # Steps per epoch = 19,857 / 16 = 1,241
    # Total steps = 1,241 * 3 = 3,723 steps

    training_args = TrainingArguments(
        output_dir=OUTPUT,
        num_train_epochs=3,

        # BATCH SIZE MASSIMO PER A100 80GB
        per_device_train_batch_size=2,  # Max che A100 può fare con 4K context
        gradient_accumulation_steps=8,  # Effective batch = 16
        per_device_eval_batch_size=2,

        # EVALUATION
        eval_strategy="steps",
        eval_steps=250,  # Più frequente
        save_strategy="steps",
        save_steps=250,
        save_total_limit=5,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,

        # LEARNING RATE OTTIMIZZATO
        learning_rate=2e-4,
        warmup_steps=100,
        lr_scheduler_type="cosine",  # Migliore convergenza

        # OTTIMIZZAZIONI
        fp16=True,
        gradient_checkpointing=True,
        max_grad_norm=1.0,
        optim="adamw_torch_fused",  # FASTEST optimizer per A100

        # LOGGING
        logging_steps=25,
        logging_first_step=True,
        report_to="none",

        # DATA
        dataloader_num_workers=4,  # Parallelo loading
        dataloader_pin_memory=True,  # Faster GPU transfer
        remove_unused_columns=False,

        # PERFORMANCE
        tf32=True,  # A100 tensor cores acceleration
        ddp_find_unused_parameters=False,
    )

    logger.info("=" * 80)
    logger.info("📈 TRAINING CONFIGURATION:")
    logger.info(f"  • Epochs: 3")
    logger.info(f"  • Batch size: 2 (per device)")
    logger.info(f"  • Gradient accumulation: 8")
    logger.info(f"  • Effective batch: 16")
    logger.info(f"  • Steps per epoch: ~1,241")
    logger.info(f"  • Total steps: ~3,723")
    logger.info(f"  • Context window: 4K tokens")
    logger.info(f"  • LoRA rank: 128 (MAXIMUM)")
    logger.info(f"  • Estimated time: ~6-8 hours on A100")
    logger.info("=" * 80)

    # Data collator with DYNAMIC padding
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,
        pad_to_multiple_of=8  # Ottimizzazione GPU
    )

    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_tokenized,
        eval_dataset=eval_tokenized,
        data_collator=data_collator
    )

    logger.info("⚡ STARTING ULTIMATE TRAINING...")
    logger.info("=" * 80)

    # Train
    trainer.train()

    # Save final
    logger.info("=" * 80)
    logger.info("💾 Saving final model...")
    trainer.save_model(OUTPUT)
    tokenizer.save_pretrained(OUTPUT)

    logger.info("=" * 80)
    logger.info("✅ ULTIMATE TRAINING COMPLETE!")
    logger.info(f"📁 Model saved to: {OUTPUT}")
    logger.info("=" * 80)

if __name__ == "__main__":
    main()
