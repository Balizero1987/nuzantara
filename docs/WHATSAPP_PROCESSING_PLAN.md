# 📱 WhatsApp 23k Messages → 6000 Training Examples

## 🎯 OBIETTIVO
Trasformare 23,000 messaggi WhatsApp in 6,000 esempi di training per ZANTARA

---

## 📊 BREAKDOWN TARGET

### **Dai 23k messaggi estraiamo:**
```yaml
3,000 conversazioni complete (40% del dataset)
├── 1,000 visa/KITAS discussions
├── 800 company setup queries
├── 500 tax consultations
├── 400 emergency/urgent cases
└── 300 follow-ups/support threads
```

---

## 🔍 CRITERI DI SELEZIONE

### **PRIORITÀ 1: Conversazioni COMPLETE** ✅
```
User: "Ho bisogno di KITAS urgente"
BaliZero: "Ciao! Capisco l'urgenza..."
User: "Quanto costa?"
BaliZero: "Per E23 Working KITAS..."
User: "Ok procediamo"
BaliZero: "Perfetto, ti mando..."
[INTERO THREAD]
```

### **PRIORITÀ 2: Pattern ETERNI** 🎯
- Problem → Solution flow
- Anxiety → Reassurance
- Confusion → Clarification
- Objection → Value explanation
- Emergency → Protocol activation

### **PRIORITÀ 3: Multi-lingua NATURALE** 🌍
```
IT → IT response
EN → EN response
Mixed → Mixed response
ID → Appropriate handling
```

---

## ❌ COSA ESCLUDERE

### **NON includere:**
- Messaggi singoli senza contesto
- Pure price quotes senza discussion
- Date/orari specifici (sostituire con [DATE])
- Nomi clienti reali (anonimizzare)
- Numeri telefono/email (mascherare)
- Transazioni bancarie specifiche

---

## 🛠️ PROCESSING SCRIPT

```python
# whatsapp_processor.py

import re
import json
from datetime import datetime

class WhatsAppProcessor:
    def __init__(self, backup_file):
        self.backup = backup_file
        self.eternal_patterns = []

    def extract_conversations(self):
        """
        1. Parse WhatsApp export format
        2. Group by conversation threads
        3. Filter by quality criteria
        """

    def anonymize_data(self, text):
        """
        - Replace names with [CLIENT]
        - Replace phones with [PHONE]
        - Replace emails with [EMAIL]
        - Replace specific dates with [DATE]
        - Keep relative time ("tomorrow", "next week")
        """

    def classify_pattern(self, conversation):
        """
        Categories:
        - visa_inquiry
        - company_setup
        - tax_consultation
        - emergency_support
        - general_support
        """

    def extract_eternal_wisdom(self, conv):
        """
        Extract:
        - Communication style
        - Problem-solving approach
        - Objection handling
        - Cultural navigation
        - Trust building
        """

    def format_for_training(self, conv):
        """
        Format: JSONL for Llama 4
        {
          "messages": [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
          ]
        }
        """
```

---

## 📝 ESEMPIO DI OUTPUT

### **RAW WhatsApp:**
```
[2/10/24, 14:23] Marco R: Ciao, sono bloccato in aeroporto, visa scaduto
[2/10/24, 14:24] Bali Zero: Ciao Marco! Non preoccuparti, gestiamo questi casi ogni settimana...
```

### **PROCESSED Training Example:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Ciao, sono bloccato in aeroporto, visa scaduto"
    },
    {
      "role": "assistant",
      "content": "Ciao! Non preoccuparti, gestiamo questi casi ogni settimana. Prima cosa: non uscire dall'area immigrazione. Secondo: mandami foto del passaporto via WhatsApp. Terzo: preparati a pagare la multa (circa 1 milione IDR per giorno). Attiviamo subito il protocollo emergency con Krisna. Entro 2 ore avremo la lettera di estensione."
    }
  ],
  "metadata": {
    "pattern": "emergency_visa_expired",
    "language": "IT",
    "eternal_wisdom": "calm_reassurance_with_immediate_action",
    "excluded_variable": "specific_date_and_fine_amount"
  }
}
```

---

## 🔄 PROCESSING STEPS

### **STEP 1: Parse & Group** (1 ora)
```bash
# Parse WhatsApp export
python parse_whatsapp.py WhatsApp_Backup_2025-10-05.txt

# Output: conversations_raw.json (23k messages → ~2000 threads)
```

### **STEP 2: Filter Quality** (2 ore)
```bash
# Apply quality filters
python filter_conversations.py conversations_raw.json

# Criteria:
# - Min 3 messages per thread
# - Complete problem→solution arc
# - No abandoned conversations
# Output: conversations_quality.json (~5000 threads)
```

### **STEP 3: Select Best** (2 ore)
```bash
# ML-assisted selection
python select_best.py conversations_quality.json

# Diversity scoring:
# - Service type coverage
# - Language distribution
# - Pattern variety
# - Complexity levels
# Output: conversations_best_3000.json
```

### **STEP 4: Extract Eternal** (3 ore)
```bash
# Extract eternal patterns
python extract_eternal.py conversations_best_3000.json

# Remove:
# - Prices (move to variable)
# - Dates (replace with relative)
# - Names (anonymize)
# Output: training_data_3000.jsonl
```

### **STEP 5: Augment** (2 ore)
```bash
# Add remaining 3000 examples
python augment_dataset.py training_data_3000.jsonl

# Add:
# - 2000 Q&A from knowledge base
# - 1000 style/pattern examples
# Output: zantara_training_6000.jsonl (60MB)
```

---

## 📊 QUALITY METRICS

### **Target Distribution:**
```
Service Types:
- Visa/KITAS: 35%
- Company: 25%
- Tax: 20%
- Legal: 15%
- General: 5%

Languages:
- Italian: 40%
- English: 40%
- Mixed: 15%
- Indonesian: 5%

Complexity:
- Simple: 30%
- Medium: 50%
- Complex: 20%
```

---

## ⚡ QUICK START

### **Se vuoi iniziare SUBITO:**
```python
# quick_extract.py
import json

def quick_extract_top_patterns(whatsapp_file):
    """
    Estrae rapidamente i top 100 pattern
    per vedere che tipo di dati abbiamo
    """
    patterns = {
        'visa_expired': [],
        'company_setup': [],
        'tax_question': [],
        'emergency': [],
        'price_inquiry': []
    }

    # Quick scan first 1000 messages
    # Show sample patterns
    # Validate approach

    return patterns

# Run this first to validate data quality
```

---

## 🎯 PROSSIMI PASSI

1. **Fammi vedere formato WhatsApp export** (screenshot prime 10 righe)
2. **Decidi livello automazione** (full script vs semi-manual)
3. **Conferma criteri selezione** (adjustments needed?)
4. **Start processing** batch per batch

---

## 💡 REMEMBER

> "We're training ZANTARA's soul, not her price list"

Extract the HOW, not the WHAT.
Capture the WHY, not the WHEN.
Preserve the STYLE, not the SPECIFICS.