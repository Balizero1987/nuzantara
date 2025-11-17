# 🤖 GEMMA Fine-Tuning Dataset Preparation

Complete pipeline per convertire i dataset ZANTARA nel formato richiesto da Gemma2 9B per fine-tuning.

## 📦 File Disponibili

### Script di Conversione
- **`convert_to_gemma_format.py`** - Converte dataset custom → Gemma JSONL
- **`split_dataset.py`** - Split train/validation/test (80/10/10)

### Dataset Esistenti
- **`claude6_javanese.json`** (20.8 MB) - Conversazioni in dialetto Giavanese
- **`claude12_jakarta_authentic.json`** (9.5 MB) - Conversazioni autentiche Jakarta
- **`claude13_zero_zantara.json`** (4.6 MB) - Dialoghi Zero-ZANTARA in italiano

---

## 🚀 Quick Start

### Step 1: Convertire Tutti i Dataset in Formato Gemma

Converte tutti i dataset JSON in un unico file JSONL formato Gemma:

```bash
cd /home/user/nuzantara/DATASET_GEMMA

# Convertire tutti i dataset in un unico file
python convert_to_gemma_format.py \
  --input-dir . \
  --output gemma_all_conversations.jsonl \
  --validate \
  --samples 5
```

**Output:**
- `gemma_all_conversations.jsonl` - Tutte le conversazioni in formato Gemma
- Statistiche di conversione
- Validazione automatica del formato
- 5 conversazioni di esempio

### Step 2: Splittare in Train/Validation/Test

Divide il dataset in 3 set per training:

```bash
python split_dataset.py \
  --input gemma_all_conversations.jsonl \
  --output-dir splits \
  --train 0.8 \
  --val 0.1 \
  --test 0.1 \
  --seed 42
```

**Output:**
```
splits/
├── train.jsonl          # 80% dei dati (per training)
├── validation.jsonl     # 10% dei dati (per tuning hyperparameters)
├── test.jsonl          # 10% dei dati (per valutazione finale)
└── split_metadata.json  # Statistiche e metadata
```

---

## 📋 Formato Output Gemma

Ogni linea del JSONL contiene una conversazione in questo formato:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Halo! Gue mau tanya dong soal visa investor..."
    },
    {
      "role": "assistant",
      "content": "Halo! Boleh banget kok 😊 Mau invest di bidang apa nih?"
    },
    {
      "role": "user",
      "content": "Gue lagi mikir property sih, tapi belum tau prosesnya gimana"
    },
    {
      "role": "assistant",
      "content": "Oke, jadi untuk property sebagai foreigner ada beberapa opsi..."
    }
  ]
}
```

### Mappatura Ruoli

| Dataset Originale | Speaker  | → | Gemma Role |
|-------------------|----------|---|------------|
| Zero-ZANTARA      | zero     | → | user       |
| Zero-ZANTARA      | zantara  | → | assistant  |
| Jakarta/Javanese  | user     | → | user       |
| Jakarta/Javanese  | assistant| → | assistant  |

---

## 🔍 Comandi Dettagliati

### Convertire Singolo Dataset

```bash
# Convertire solo claude13_zero_zantara.json
python convert_to_gemma_format.py \
  --input claude13_zero_zantara.json \
  --output gemma_zero_zantara.jsonl \
  --validate
```

### Convertire con Pattern Specifico

```bash
# Convertire solo file che iniziano con "claude"
python convert_to_gemma_format.py \
  --input-dir . \
  --pattern "claude*.json" \
  --output gemma_claude_only.jsonl
```

### Split Personalizzato

```bash
# Split 70% train, 15% val, 15% test
python split_dataset.py \
  --input gemma_all_conversations.jsonl \
  --output-dir splits_custom \
  --train 0.7 \
  --val 0.15 \
  --test 0.15
```

---

## 📊 Statistiche Attese

### Dataset Attuali (Novembre 2025)

| Dataset | Conversazioni | Messaggi | Lingua | Dimensione |
|---------|--------------|----------|--------|------------|
| claude6_javanese | ~4,000 | ~24,000 | Javanese | 20.8 MB |
| claude12_jakarta | ~2,000 | ~14,000 | Indonesian | 9.5 MB |
| claude13_zero_zantara | 3,000 | 14,632 | Italian | 4.6 MB |
| **TOTALE** | **~9,000** | **~52,632** | Multi | **35.1 MB** |

### Dopo Conversione

```
gemma_all_conversations.jsonl
├── Total: ~9,000 conversazioni
├── Train: ~7,200 conversazioni (80%)
├── Validation: ~900 conversazioni (10%)
└── Test: ~900 conversazioni (10%)
```

---

## 🎯 Target Finale

Per raggiungere l'obiettivo di **24,000 conversazioni** servono ancora:
- ✅ Completati: ~9,000 (37.5%)
- ⏳ Rimanenti: ~15,000 (62.5%)

### Dataset da Aggiungere

1. **CLAUDE 1-5**: Business & Legal contexts (~7,500 conversazioni)
2. **CLAUDE 7-11**: Cultural & Daily life (~7,500 conversazioni)

Una volta completati, rilanciare la conversione:

```bash
# Riconvertire con tutti i dataset
python convert_to_gemma_format.py \
  --input-dir . \
  --output gemma_complete_24k.jsonl \
  --validate

# Re-splittare
python split_dataset.py \
  --input gemma_complete_24k.jsonl \
  --output-dir splits_24k
```

---

## 🔧 Validazione Formato

### Controllo Manuale

```bash
# Vedere prime 3 conversazioni
head -n 3 gemma_all_conversations.jsonl | python -m json.tool

# Contare conversazioni
wc -l gemma_all_conversations.jsonl

# Verificare struttura
python -c "
import json
with open('gemma_all_conversations.jsonl') as f:
    conv = json.loads(f.readline())
    print('Keys:', list(conv.keys()))
    print('First message:', conv['messages'][0])
"
```

### Validazione Automatica

La validazione è inclusa nello script di conversione:

```bash
python convert_to_gemma_format.py \
  --input-dir . \
  --output test.jsonl \
  --validate \
  --samples 10  # Mostra 10 esempi
```

Verifica:
- ✅ Chiave `messages` presente
- ✅ `role` è `user` o `assistant`
- ✅ `content` non vuoto
- ✅ Conversazione inizia con `user`
- ✅ JSON valido (una conversazione per linea)

---

## 📁 Struttura Directory Raccomandata

```
DATASET_GEMMA/
├── claude6_javanese.json              # Dataset originali
├── claude12_jakarta_authentic.json
├── claude13_zero_zantara.json
├── convert_to_gemma_format.py         # Script conversione
├── split_dataset.py                   # Script split
├── README_GEMMA_CONVERSION.md         # Questa guida
├── gemma_all_conversations.jsonl      # Output conversione completa
└── splits/                            # Output split
    ├── train.jsonl
    ├── validation.jsonl
    ├── test.jsonl
    └── split_metadata.json
```

---

## 🚀 Uso su Google Colab

Una volta preparati i file `train.jsonl`, `validation.jsonl`, `test.jsonl`:

### 1. Upload su Google Drive

```bash
# Creare cartella su Google Drive
Google Drive/
└── GEMMA_FINETUNING/
    ├── train.jsonl
    ├── validation.jsonl
    └── test.jsonl
```

### 2. Notebook Colab

```python
from google.colab import drive
drive.mount('/content/drive')

# Caricare dataset
train_path = '/content/drive/MyDrive/GEMMA_FINETUNING/train.jsonl'
val_path = '/content/drive/MyDrive/GEMMA_FINETUNING/validation.jsonl'
test_path = '/content/drive/MyDrive/GEMMA_FINETUNING/test.jsonl'

# Load dataset
from datasets import load_dataset

dataset = load_dataset('json', data_files={
    'train': train_path,
    'validation': val_path,
    'test': test_path
})

print(f"Train: {len(dataset['train'])} conversations")
print(f"Val: {len(dataset['validation'])} conversations")
print(f"Test: {len(dataset['test'])} conversations")

# Preview
print("\nSample conversation:")
print(dataset['train'][0])
```

### 3. Fine-Tuning (snippet)

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer

# Load Gemma2 9B
model = AutoModelForCausalLM.from_pretrained(
    "google/gemma-2-9b-it",
    load_in_4bit=True,
    device_map="auto"
)

tokenizer = AutoTokenizer.from_pretrained("google/gemma-2-9b-it")

# Configure LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    task_type="CAUSAL_LM"
)

# Train
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset['train'],
    eval_dataset=dataset['validation'],
    peft_config=lora_config,
    max_seq_length=2048,
    num_train_epochs=3,
    dataset_text_field="messages"  # Campo conversazione
)

trainer.train()
```

---

## 🐛 Troubleshooting

### Errore: "No conversations found"

```bash
# Verificare struttura JSON
python -c "
import json
data = json.load(open('claude13_zero_zantara.json'))
print('Keys:', list(data.keys()))
print('Conversations count:', len(data.get('conversations', [])))
"
```

### Errore: "Invalid role"

Lo script mappa automaticamente:
- `zero` → `user`
- `zantara` → `assistant`
- `user` → `user`
- `assistant` → `assistant`

Se hai ruoli custom, modifica `convert_to_gemma_format.py` linea 80-90.

### Conversazioni Saltate

Controllare log:
```
⚠️  Conversation xyz has no messages  # Conversazione vuota
⚠️  Empty message in conversation abc  # Messaggio vuoto
```

Le conversazioni invalide vengono automaticamente saltate.

---

## ✅ Checklist Pre-Training

Prima di caricare su Colab:

- [ ] Tutti i dataset convertiti in formato Gemma JSONL
- [ ] Split train/val/test eseguito (80/10/10)
- [ ] Validazione formato passata (100% conversazioni valide)
- [ ] File JSONL verificati manualmente (almeno 5 campioni)
- [ ] Metadata split salvato (`split_metadata.json`)
- [ ] Backup dataset originali JSON
- [ ] File upload su Google Drive
- [ ] Statistiche verificate (numero conversazioni, messaggi)

---

## 📞 Supporto

Per problemi con la conversione:

1. Verificare struttura dataset originale
2. Controllare log di conversione per errori
3. Validare output con `--validate`
4. Testare su singolo dataset prima di conversione batch

---

**Ultima modifica:** Novembre 2025
**Versione:** 1.0
**Compatibile con:** Gemma2 9B, Google Colab Pro/Pro+
