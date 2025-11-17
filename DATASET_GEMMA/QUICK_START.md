# 🚀 Quick Start - Gemma Fine-Tuning

Guida rapida per preparare i dataset e fare fine-tuning di Gemma2 9B su Google Colab.

---

## 📊 Stato Attuale

✅ **Dataset pronti:** 7,500 conversazioni (~100K messaggi)
✅ **Script di conversione:** Completati e testati
✅ **Split train/val/test:** 80/10/10 già creato
✅ **Notebook Colab:** Template pronto per uso immediato

---

## 🎯 Cosa Fare Ora

### Opzione A: Iniziare Subito il Fine-Tuning (con 7,500 conversazioni)

Se vuoi iniziare subito con i dataset attuali:

#### 1️⃣ Upload su Google Drive

```bash
# Dalla tua macchina locale, copia i file split su Google Drive
# Struttura raccomandata:
Google Drive/
└── GEMMA_FINETUNING/
    └── splits/
        ├── train.jsonl (6.1 MB)
        ├── validation.jsonl (772 KB)
        └── test.jsonl (794 KB)
```

File da uploadare:
- `/home/user/nuzantara/DATASET_GEMMA/splits/train.jsonl`
- `/home/user/nuzantara/DATASET_GEMMA/splits/validation.jsonl`
- `/home/user/nuzantara/DATASET_GEMMA/splits/test.jsonl`

#### 2️⃣ Apri Google Colab

1. Vai su [Google Colab](https://colab.research.google.com/)
2. Upload `gemma_finetuning_colab.ipynb`
3. Seleziona GPU: **Runtime → Change runtime type → A100 GPU** (Colab Pro)
4. Esegui tutte le celle in sequenza

#### 3️⃣ Attendi Training

- Tempo stimato: **2-4 ore** su A100
- VRAM richiesta: **5-8GB** (LoRA 4-bit)
- Output: Model adapters (~100-200MB)

#### 4️⃣ Testa il Modello

Il notebook include testing automatico. Risultati attesi:
- Naturalezza: **75-80/100** (con 7,500 conversazioni)
- Particle usage migliorato
- Slang density più naturale

---

### Opzione B: Completare i Dataset Prima (raccomandato)

Per raggiungere l'obiettivo di **85+/100 naturalezza**:

#### 1️⃣ Genera Dataset Mancanti

**Target:** 24,000 conversazioni totali
**Attuale:** 7,500 conversazioni (31.25%)
**Rimanenti:** 16,500 conversazioni

Generare con CLAUDE instances:
- CLAUDE 1-5: Business & Legal (7,500)
- CLAUDE 7-11: Cultural & Daily (7,500)
- CLAUDE 14-15: Mixed contexts (1,500)

Script da usare:
```bash
cd /home/user/nuzantara/apps/backend-rag/scripts
python generate_test_conversations.py  # Modifica per generare più dati
```

#### 2️⃣ Riconverti e Re-split

Una volta generati tutti i dataset:

```bash
cd /home/user/nuzantara/DATASET_GEMMA

# Riconverti tutto
python convert_to_gemma_format.py \
  --input-dir . \
  --pattern "claude*.json" \
  --output gemma_complete_24k.jsonl \
  --validate

# Re-split
python split_dataset.py \
  --input gemma_complete_24k.jsonl \
  --output-dir splits_24k \
  --train 0.8 --val 0.1 --test 0.1
```

#### 3️⃣ Ripeti Fine-Tuning

Upload `splits_24k/` su Google Drive e rilancia il notebook Colab.

**Risultati attesi con 24K:**
- Naturalezza: **85+/100** ✅
- Copertura linguistica completa
- Emotional variety migliorata

---

## 📁 File Creati

### Script di Conversione
| File | Descrizione | Uso |
|------|-------------|-----|
| `convert_to_gemma_format.py` | Converte JSON → JSONL Gemma | `python convert_to_gemma_format.py --input-dir . --output all.jsonl` |
| `split_dataset.py` | Split train/val/test | `python split_dataset.py --input all.jsonl --output-dir splits` |

### Dataset Convertiti
| File | Dimensione | Conversazioni | Descrizione |
|------|-----------|---------------|-------------|
| `gemma_all_conversations.jsonl` | 7.9 MB | 7,500 | Tutte le conversazioni convertite |
| `splits/train.jsonl` | 6.1 MB | 6,000 | Training set (80%) |
| `splits/validation.jsonl` | 772 KB | 750 | Validation set (10%) |
| `splits/test.jsonl` | 794 KB | 750 | Test set (10%) |
| `splits/split_metadata.json` | 870 B | - | Statistiche split |

### Documentazione
| File | Descrizione |
|------|-------------|
| `README_GEMMA_CONVERSION.md` | Guida completa conversione e troubleshooting |
| `QUICK_START.md` | Questa guida rapida |

### Notebook Colab
| File | Descrizione |
|------|-------------|
| `gemma_finetuning_colab.ipynb` | Notebook completo per fine-tuning su Colab |

---

## 🔍 Verifica Pre-Upload

Prima di uploadare su Google Drive, verifica:

```bash
cd /home/user/nuzantara/DATASET_GEMMA

# 1. Conta conversazioni
echo "Train:" && wc -l splits/train.jsonl
echo "Validation:" && wc -l splits/validation.jsonl
echo "Test:" && wc -l splits/test.jsonl

# 2. Verifica formato (prime 3 righe)
head -n 1 splits/train.jsonl | python3 -m json.tool

# 3. Controlla dimensioni
ls -lh splits/

# 4. Leggi metadata
cat splits/split_metadata.json
```

**Output atteso:**
```
Train: 6000
Validation: 750
Test: 750

splits/
├── train.jsonl          (6.1 MB)
├── validation.jsonl     (772 KB)
├── test.jsonl          (794 KB)
└── split_metadata.json  (870 B)
```

---

## 📊 Statistiche Dataset Attuali

### Per Lingua
- **Indonesiano (Jakarta):** ~2,000 conversazioni
- **Giavanese:** ~3,000 conversazioni
- **Italiano (Zero-ZANTARA):** ~3,000 conversazioni

### Per Stile
- **Casual (WhatsApp):** ~40%
- **Professional:** ~30%
- **Mixed:** ~30%

### Metriche Qualità
- Avg messaggi/conversazione: **13.3**
- Avg lunghezza messaggio: **43.4 caratteri**
- Ratio user/assistant: **1.05** (bilanciato ✅)
- Particle coverage: **~35%**
- Slang density: **~12%**

---

## ⚡ Comandi Rapidi

### Riconvertire Singolo Dataset
```bash
python convert_to_gemma_format.py \
  --input claude13_zero_zantara.json \
  --output gemma_italian.jsonl \
  --validate
```

### Merge Multiple Datasets
```bash
python convert_to_gemma_format.py \
  --input-dir . \
  --pattern "claude*.json" \
  --output gemma_merged.jsonl
```

### Split Custom (70/15/15)
```bash
python split_dataset.py \
  --input gemma_merged.jsonl \
  --output-dir splits_custom \
  --train 0.7 --val 0.15 --test 0.15
```

### Validazione Rapida
```bash
# Verifica formato
python convert_to_gemma_format.py \
  --input gemma_all_conversations.jsonl \
  --output /dev/null \
  --validate --samples 10
```

---

## 🎯 Obiettivi Fine-Tuning

### Baseline (Pre-Training)
- Naturalezza Gemma2 9B stock: **67.1/100**
- Particle usage: Limitato
- Slang: Formale/scarso

### Con 7,500 Conversazioni
- Naturalezza attesa: **75-80/100** ⚠️
- Miglioramento: **+8-13 punti**
- Sufficiente per proof of concept

### Con 24,000 Conversazioni (Target)
- Naturalezza attesa: **85+/100** ✅
- Miglioramento: **+18 punti**
- Production-ready

---

## 🐛 Troubleshooting Rapido

### "File not found" su Colab
```python
# Verifica percorso Google Drive
!ls "/content/drive/MyDrive/GEMMA_FINETUNING/splits/"

# Se non esiste, crea directory
!mkdir -p "/content/drive/MyDrive/GEMMA_FINETUNING/splits/"
```

### "Out of memory" durante training
```python
# Riduci batch size nel notebook:
per_device_train_batch_size=1  # Era 2
gradient_accumulation_steps=8  # Era 4
```

### Conversazioni vuote dopo conversione
```bash
# Verifica dataset originale
python3 -c "
import json
data = json.load(open('claude13_zero_zantara.json'))
print('Conversations:', len(data.get('conversations', [])))
print('First conv messages:', len(data['conversations'][0]['messages']))
"
```

---

## 📞 Prossimi Passi

1. **Decidi quale opzione:**
   - ✅ Opzione A: Start immediato con 7.5K conversazioni
   - ⏳ Opzione B: Completa dataset a 24K prima

2. **Upload dataset su Google Drive**
   - Copia file `splits/` nella directory `GEMMA_FINETUNING/`

3. **Apri notebook Colab**
   - Upload `gemma_finetuning_colab.ipynb`
   - Seleziona GPU A100

4. **Esegui fine-tuning**
   - Tempo: 2-4 ore
   - Monitora loss durante training

5. **Valuta risultati**
   - Testa naturalezza
   - Confronta con baseline
   - Decide se serve più dati

---

**Creato:** Novembre 2025
**Versione:** 1.0
**Status:** ✅ Pronto per fine-tuning
