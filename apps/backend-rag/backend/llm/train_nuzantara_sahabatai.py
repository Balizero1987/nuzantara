"""
Fine-Tuning SahabatAI with LoRA for Nuzantara Domain
Adapts SahabatAI to business advisory, Indonesian legal, visa expertise
"""

import torch
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
import json
from pathlib import Path


class NuzantaraSahabatAITrainer:
    """
    Fine-tune SahabatAI Gemma2-9B with LoRA on Nuzantara domain

    Features:
    - Uses Unsloth for 2x faster training, 63% less VRAM
    - LoRA adapters for parameter-efficient fine-tuning
    - Preserves SahabatAI's natural Indonesian capabilities
    - Adds Nuzantara-specific knowledge (KITAS, PT PMA, tax, etc.)
    """

    def __init__(
        self,
        base_model: str = "GoToCompany/gemma2-9b-cpt-sahabatai-v1-instruct",
        max_seq_length: int = 2048,
        load_in_4bit: bool = True
    ):
        """
        Initialize trainer

        Args:
            base_model: SahabatAI model from HuggingFace
            max_seq_length: Max sequence length for training
            load_in_4bit: Use 4-bit quantization (QLoRA) for memory efficiency
        """
        self.base_model = base_model
        self.max_seq_length = max_seq_length

        print(f"🇮🇩 Loading SahabatAI base model: {base_model}")

        # Load model with Unsloth (2x faster, 63% less VRAM)
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name=base_model,
            max_seq_length=max_seq_length,
            dtype=None,  # Auto-detect
            load_in_4bit=load_in_4bit,
        )

        print("✅ Model loaded successfully")

        # Configure LoRA
        self.model = FastLanguageModel.get_peft_model(
            self.model,
            r=16,  # LoRA rank (higher = more capacity but slower)
            lora_alpha=32,  # LoRA scaling
            lora_dropout=0.05,
            target_modules=[
                "q_proj", "k_proj", "v_proj", "o_proj",
                "gate_proj", "up_proj", "down_proj"
            ],
            bias="none",
            use_gradient_checkpointing="unsloth",  # Unsloth optimization
            random_state=42,
        )

        print("✅ LoRA adapters configured")
        print(f"   Trainable parameters: {self._count_trainable_params():,}")
        print(f"   Total parameters: {self._count_total_params():,}")
        print(f"   Trainable %: {self._trainable_percentage():.2f}%")

    def _count_trainable_params(self) -> int:
        """Count trainable parameters"""
        return sum(p.numel() for p in self.model.parameters() if p.requires_grad)

    def _count_total_params(self) -> int:
        """Count total parameters"""
        return sum(p.numel() for p in self.model.parameters())

    def _trainable_percentage(self) -> float:
        """Percentage of trainable parameters"""
        return 100 * self._count_trainable_params() / self._count_total_params()

    def prepare_dataset(self, dataset_path: str) -> dict:
        """
        Prepare dataset for training

        Expected format (JSON):
        [
            {
                "instruction": "System prompt",
                "input": "User query in Indonesian",
                "output": "Natural Indonesian response"
            },
            ...
        ]

        Args:
            dataset_path: Path to JSON dataset

        Returns:
            Formatted dataset ready for training
        """
        print(f"\n📊 Loading dataset: {dataset_path}")

        with open(dataset_path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)

        print(f"   Total examples: {len(raw_data)}")

        # Format for Gemma2 chat template
        def format_example(example):
            """Format single example for Gemma2"""

            # Build prompt in Gemma2 format
            prompt = f"""<start_of_turn>user
{example['instruction']}

{example['input']}<end_of_turn>
<start_of_turn>model
{example['output']}<end_of_turn>"""

            return {"text": prompt}

        # Format all examples
        formatted_data = [format_example(ex) for ex in raw_data]

        # Convert to Hugging Face dataset
        from datasets import Dataset
        dataset = Dataset.from_list(formatted_data)

        print("✅ Dataset prepared")
        return dataset

    def train(
        self,
        dataset_path: str,
        output_dir: str = "./nuzantara-sahabatai-lora",
        num_epochs: int = 3,
        batch_size: int = 4,
        learning_rate: float = 2e-4,
        warmup_steps: int = 10,
        logging_steps: int = 10,
        save_steps: int = 100
    ):
        """
        Train model with LoRA on Nuzantara dataset

        Args:
            dataset_path: Path to training dataset (JSON)
            output_dir: Where to save fine-tuned model
            num_epochs: Number of training epochs
            batch_size: Batch size per GPU
            learning_rate: Learning rate
            warmup_steps: Warmup steps
            logging_steps: Log every N steps
            save_steps: Save checkpoint every N steps
        """

        # Prepare dataset
        dataset = self.prepare_dataset(dataset_path)

        # Training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=4,
            learning_rate=learning_rate,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=logging_steps,
            save_steps=save_steps,
            save_total_limit=3,
            warmup_steps=warmup_steps,
            optim="adamw_8bit",  # Memory-efficient optimizer
            weight_decay=0.01,
            lr_scheduler_type="cosine",
            seed=42,
            report_to="none",  # Disable wandb/tensorboard for simplicity
        )

        # Trainer
        trainer = SFTTrainer(
            model=self.model,
            tokenizer=self.tokenizer,
            train_dataset=dataset,
            dataset_text_field="text",
            max_seq_length=self.max_seq_length,
            args=training_args,
        )

        print("\n🚀 Starting training...")
        print(f"   Epochs: {num_epochs}")
        print(f"   Batch size: {batch_size}")
        print(f"   Learning rate: {learning_rate}")
        print(f"   Output: {output_dir}")
        print("\n" + "="*80)

        # Train!
        trainer.train()

        print("\n" + "="*80)
        print("✅ Training complete!")

        # Save final model
        self.save_model(output_dir)

    def save_model(self, output_dir: str):
        """Save fine-tuned model"""

        print(f"\n💾 Saving model to: {output_dir}")

        # Save LoRA adapters
        self.model.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)

        print("✅ Model saved!")
        print(f"\nTo use:")
        print(f"  model, tokenizer = FastLanguageModel.from_pretrained('{output_dir}')")


# ============================================================================
# Usage Example
# ============================================================================

def create_example_dataset():
    """
    Create example dataset from existing Nuzantara data
    This should be expanded with real conversations!
    """

    # System prompt optimized for Nuzantara
    system_prompt = """Kamu adalah ZANTARA, asisten bisnis yang membantu orang asing dengan urusan bisnis, visa, dan legal di Indonesia.

PENTING:
- Gunakan bahasa Indonesia yang natural dan conversational
- Boleh pakai slang umum kalau konteksnya casual (gampang, nih, dong)
- Kalau formal, tetap professional tapi jangan kaku
- Kalau ada istilah tech/bisnis, boleh campur English (itu normal di Indonesia)
- Selalu engage dengan user - tanya follow-up kalau relevan
- Fokus pada: KITAS, PT PMA, tax, visa, business setup Indonesia"""

    # Example training data
    # TODO: Expand this with 2,000-5,000 real examples!
    examples = [
        {
            "instruction": system_prompt,
            "input": "Saya mau buka usaha kopi di Bali. KBLI apa yang cocok?",
            "output": "Wah bagus nih! Untuk usaha kopi di Bali, KBLI yang cocok adalah 56303 (Kafe). Kalau mau jual makanan juga, bisa pakai 56301 ya.\n\nProsesnya cukup gampang kok - daftar lewat OSS online, NIB biasanya keluar dalam beberapa hari.\n\nUdah ada rencana lokasi? Seminyak atau Ubud?"
        },
        {
            "instruction": system_prompt,
            "input": "Berapa lama proses KITAS investor?",
            "output": "Untuk KITAS investor, prosesnya biasanya 2-4 minggu setelah semua dokumen lengkap.\n\nYang perlu disiapkan:\n1. Bukti investasi minimal 1 miliar rupiah\n2. Rekomendasi dari BKPM\n3. Paspor yang masih berlaku\n4. Surat sponsor dari perusahaan\n\nTips: Kalau dokumennya udah lengkap dan benar, prosesnya lebih cepat. Ada yang mau ditanyain tentang dokumen yang diperlukan?"
        },
        {
            "instruction": system_prompt,
            "input": "Gimana cara bikin PT PMA? Ribet ga?",
            "output": "Nggak ribet kok! Sekarang udah bisa online semua lewat OSS.\n\nGampangnya gini:\n1. Bikin NIB dulu di sistem OSS\n2. Modal minimal 10 miliar rupiah (untuk PT PMA)\n3. Akta notaris\n4. SK Kemenkumham\n\nTotal waktu dari awal sampai jadi sekitar 2-3 minggu. Kalau mau yang lebih cepet, bisa pakai jasa konsultan, tapi ya lebih mahal dikit.\n\nMau fokus ke bidang usaha apa?"
        },
        # TODO: Add 2,000+ more examples!
        # Sources:
        # - 70 domande difficili (domande_indonesiano.md)
        # - Real user conversations (anonymized)
        # - Synthetic variations generated by GPT-4
        # - Team-validated golden answers
    ]

    return examples


def main():
    """Example training workflow"""

    # 1. Create dataset (expand with real data!)
    print("📝 Creating example dataset...")
    dataset = create_example_dataset()

    # Save to JSON
    dataset_path = "nuzantara_training_data.json"
    with open(dataset_path, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"✅ Dataset saved: {dataset_path}")
    print(f"   Examples: {len(dataset)}")
    print("\n⚠️  NOTE: This is just 3 examples!")
    print("   For production, you need 2,000-5,000 examples")
    print("   See dataset creation guide below\n")

    # 2. Initialize trainer
    print("🚀 Initializing trainer...")
    trainer = NuzantaraSahabatAITrainer(
        base_model="GoToCompany/gemma2-9b-cpt-sahabatai-v1-instruct",
        load_in_4bit=True  # QLoRA for memory efficiency
    )

    # 3. Train (commented out - uncomment when dataset ready)
    # trainer.train(
    #     dataset_path=dataset_path,
    #     output_dir="./nuzantara-sahabatai-lora",
    #     num_epochs=3,
    #     batch_size=4,
    #     learning_rate=2e-4
    # )

    print("\n" + "="*80)
    print("NEXT STEPS:")
    print("="*80)
    print("\n1. Build dataset (2,000-5,000 Q&A pairs):")
    print("   - Use 70 domande_indonesiano.md as seed")
    print("   - Generate variations with GPT-4")
    print("   - Collect real user queries (anonymized)")
    print("   - Team validates all responses")
    print("\n2. Uncomment trainer.train() above")
    print("\n3. Run: python train_nuzantara_sahabatai.py")
    print("\n4. Test fine-tuned model with team")
    print("\n5. If better → deploy in production")


if __name__ == "__main__":
    main()
