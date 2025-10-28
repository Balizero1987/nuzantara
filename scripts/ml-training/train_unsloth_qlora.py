#!/usr/bin/env python3
"""Pelatihan QLoRA untuk ZANTARA menggunakan Hugging Face + Accelerate."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    DataCollatorForLanguageModeling,
    TrainingArguments,
    Trainer,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="QLoRA fine-tuning untuk ZANTARA")
    parser.add_argument("--model_name", required=True, help="Nama model dasar di Hugging Face")
    parser.add_argument("--dataset_path", required=True, help="Path JSONL data pelatihan")
    parser.add_argument("--output_dir", required=True, help="Folder hasil pelatihan")
    parser.add_argument("--num_epochs", type=int, default=3, help="Jumlah epoch")
    parser.add_argument("--learning_rate", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--warmup_ratio", type=float, default=0.05, help="Warmup ratio")
    parser.add_argument("--per_device_train_batch_size", type=int, default=4, help="Batch size per device")
    parser.add_argument("--gradient_accumulation_steps", type=int, default=8, help="Gradient accumulation")
    parser.add_argument("--max_seq_length", type=int, default=2048, help="Panjang sekuens maksimum")
    parser.add_argument("--seed", type=int, default=42, help="Seed reproduktif")
    parser.add_argument("--lora_r", type=int, default=64, help="Rank LORA")
    parser.add_argument("--lora_alpha", type=int, default=16, help="Alpha LORA")
    parser.add_argument("--lora_dropout", type=float, default=0.05, help="Dropout LORA")
    parser.add_argument("--bf16", action="store_true", help="Aktifkan mixed precision bf16")
    return parser.parse_args()


def format_example(example: Dict[str, Any], tokenizer: AutoTokenizer) -> str:
    messages = example.get("messages")
    if not messages:
        raise ValueError("Setiap baris JSONL harus memiliki kunci 'messages'.")

    try:
        return tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False,
        )
    except AttributeError:
        # Fallback bila tokenizer tidak punya chat template
        parts: List[str] = []
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            parts.append(f"[{role.upper()}]\n{content}\n")
        return "\n".join(parts)


def main() -> None:
    args = parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("🔄 Memuat tokenizer dan model dasar...")
    tokenizer = AutoTokenizer.from_pretrained(args.model_name, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16 if args.bf16 else torch.float16,
    )

    model = AutoModelForCausalLM.from_pretrained(
        args.model_name,
        quantization_config=quant_config,
        device_map="auto",
    )

    model = prepare_model_for_kbit_training(model)
    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
    )
    model = get_peft_model(model, lora_config)

    print("📚 Memuat dataset...")
    dataset = load_dataset("json", data_files=args.dataset_path, split="train")

    def tokenize_function(example: Dict[str, Any]) -> Dict[str, Any]:
        text = format_example(example, tokenizer)
        tokenized = tokenizer(
            text,
            truncation=True,
            max_length=args.max_seq_length,
        )
        tokenized["labels"] = tokenized["input_ids"].copy()
        return tokenized

    tokenized_dataset = dataset.map(tokenize_function, remove_columns=dataset.column_names)

    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    print("⚙️ Menjalankan fine-tuning...")
    training_args = TrainingArguments(
        output_dir=str(output_dir),
        per_device_train_batch_size=args.per_device_train_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        num_train_epochs=args.num_epochs,
        learning_rate=args.learning_rate,
        warmup_ratio=args.warmup_ratio,
        logging_steps=50,
        save_strategy="epoch",
        fp16=not args.bf16,
        bf16=args.bf16,
        optim="paged_adamw_8bit",
        report_to=[]
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=data_collator,
    )

    trainer.train()

    print("💾 Menyimpan artefak...")
    trainer.save_state()
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    log_path = output_dir / "train_logs.jsonl"
    with log_path.open("w", encoding="utf-8") as handle:
        for record in trainer.state.log_history:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    print(f"✅ Selesai. Log tersimpan di {log_path}")


if __name__ == "__main__":
    main()
