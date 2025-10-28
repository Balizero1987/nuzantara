import os,torch,json
from transformers import AutoModelForCausalLM,AutoTokenizer,BitsAndBytesConfig,TrainingArguments
from peft import LoraConfig,get_peft_model,prepare_model_for_kbit_training
from trl import SFTTrainer
from datasets import Dataset

os.environ["HF_TOKEN"]="hf_XXXXXXXXXXXXXXX"

print("🔥 Loading Qwen 2.5 Coder 7B Instruct...")
model=AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-Coder-7B-Instruct",
    quantization_config=BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16
    ),
    device_map="auto",
    token=os.environ["HF_TOKEN"]
)

tokenizer=AutoTokenizer.from_pretrained("Qwen/Qwen2.5-Coder-7B-Instruct",token=os.environ["HF_TOKEN"])
tokenizer.pad_token=tokenizer.eos_token
model=prepare_model_for_kbit_training(model)

print("🔥 Applying LoRA...")
model=get_peft_model(model,LoraConfig(
    r=64,
    lora_alpha=128,
    target_modules=["q_proj","k_proj","v_proj","o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
))

print("🔥 Loading DevAI dataset (487 examples)...")
examples=[]
with open("/workspace/DEVAI_train.jsonl","r") as f:
    for line in f:
        ex=json.loads(line)
        # Extract only text fields, flatten nested structures
        simplified={
            'question': ex['question'],
            'answer': ex['answer'],
            'context': str(ex.get('context', ''))  # Convert to string
        }
        examples.append(simplified)

# Create dataset from simplified structure
dataset=Dataset.from_dict({
    'question': [e['question'] for e in examples],
    'answer': [e['answer'] for e in examples],
    'context': [e['context'] for e in examples]
})

def format_devai(ex):
    """Format DevAI examples for Qwen chat format"""
    text=f"<|im_start|>system\nYou are DevAI, an expert code assistant for NUZANTARA project.<|im_end|>\n"
    text+=f"<|im_start|>user\n{ex['question']}"
    if ex['context']:
        text+=f"\n\nContext:\n{ex['context']}"
    text+=f"<|im_end|>\n"
    text+=f"<|im_start|>assistant\n{ex['answer']}<|im_end|>"
    return text

print(f"🔥 Training {len(dataset)} examples, 3 epochs...")
trainer=SFTTrainer(
    model=model,
    train_dataset=dataset,
    args=TrainingArguments(
        output_dir="/workspace/devai_qwen_full",
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        optim="paged_adamw_8bit",
        learning_rate=2e-4,
        bf16=True,
        logging_steps=10,
        save_steps=100,
        report_to="none"
    ),
    formatting_func=format_devai
)

trainer.train()
trainer.save_model("/workspace/devai_qwen_full")
print("✅ DevAI training DONE!")
