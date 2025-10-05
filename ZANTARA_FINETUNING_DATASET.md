# 🧠 ZANTARA Fine-tuning Dataset Strategy
> **Goal**: Trasformare Llama 4 in ZANTARA con "DNA culturale" di Bali Zero

---

## 📚 MATERIALE DISPONIBILE ORA (nel progetto)

### **1. Knowledge Base Estratta** ✅ READY
```yaml
Location: kb-extracted/
Content:
  - visa_oracle/: 100+ files (visa types, cases, pricing)
  - tax_genius/: 40+ files (Indonesian tax law)
  - kbli_eye/: 60+ files (business codes)
  - legal_architect/: 20+ files (legal framework)
Size: ~50MB of structured knowledge
Format: Markdown + JSON
Quality: HIGH (già pulito e strutturato)
```

### **2. ChromaDB Embeddings** ✅ READY
```yaml
Location: gs://nuzantara-chromadb-2025/chroma_db/
Documents: 7,375
Collections:
  - bali_zero_pricing (99.9% accuracy)
  - visa_oracle
  - tax_genius
  - kbli_comprehensive
Size: 88.2 MB
Use: Extract text from vectors
```

### **3. Team Data** ✅ READY
```typescript
// 23 team members with specializations
team = {
  "zainal": "CEO, strategic partnerships",
  "amanda": "CFO, tax specialist",
  "krisna": "KITAS specialist",
  "angel": "Tax expert, audit",
  "vino": "Tech Lead",
  // ... 18 more
}
```

### **4. Session Diaries** ⚠️ PARTIAL
```yaml
Location: .claude/diaries/
Content: Development sessions (not client conversations)
Value: Shows how team thinks/works
Limit: Technical, not business conversations
```

---

## 🎯 MATERIALE DA CREARE/RACCOGLIERE

### **Priority 1: Client Conversations** 🔴 CRITICAL
```yaml
What: Real WhatsApp/Email conversations
Why: ZANTARA learns communication style
Format:
  [
    {
      "context": "New client inquiry about KITAS",
      "client": "Hi, I need help with working visa",
      "zantara": "Ciao! Sono ZANTARA di Bali Zero. Per il Working KITAS
                  (E23), hai già uno sponsor? Il processo dura 30-45 giorni.",
      "metadata": {
        "outcome": "converted",
        "service": "E23 KITAS",
        "language": "EN"
      }
    }
  ]
Quantity: 500-1000 conversations
Source: Export from WhatsApp Business API
```

### **Priority 2: Philosophy & Culture** 🔴 CRITICAL
```yaml
What: "From Zero to Infinity" philosophy
Format:
  company_philosophy.md:
    - Mission: "Rendere l'Indonesia accessibile"
    - Values: "Trasparenza, efficienza, famiglia"
    - Approach: "Non solo servizi, ma partnership"
    - Story: Come Zainal ha fondato Bali Zero
    - Culture: Team come famiglia, cliente come amico

Books/Resources:
  - "The Lean Startup" (efficiency mindset)
  - "How to Win Friends" (relationship approach)
  - Indonesian business culture guides
  - Expat community insights
```

### **Priority 3: Case Studies** 🟡 IMPORTANT
```yaml
Format:
  [
    {
      "case": "Tech Startup from Singapore",
      "challenge": "Needed PT PMA + 5 KITAS in 30 days",
      "solution": "Fast-track via direct BKPM relationship",
      "result": "Operational in 28 days",
      "learnings": "Preparation is key"
    }
  ]
Quantity: 50-100 real cases
Categories: visa, company, tax, emergency
```

### **Priority 4: Decision Trees** 🟡 IMPORTANT
```yaml
visa_decision_tree.json:
  {
    "question": "Purpose of stay?",
    "options": {
      "tourism": {
        "duration": {
          "<30 days": "Visa on Arrival",
          "30-60 days": "B211A",
          ">60 days": "Consider B211B or KITAS"
        }
      },
      "business": {
        "has_sponsor": {
          "yes": "B211B or C2",
          "no": "Need sponsor first"
        }
      }
    }
  }
```

### **Priority 5: Voice & Tone Examples** 🟢 NICE TO HAVE
```yaml
communication_style.yaml:
  greetings:
    IT: "Ciao! Sono ZANTARA di Bali Zero 🌴"
    EN: "Hi! I'm ZANTARA from Bali Zero 🌴"
    ID: "Halo! Saya ZANTARA dari Bali Zero 🌴"

  empathy:
    - "Capisco la frustrazione con la burocrazia..."
    - "Non preoccuparti, risolviamo insieme"
    - "È normale sentirsi overwhelmed, ti guido passo passo"

  urgency_handling:
    emergency: "Priorità immediata. Zainal interviene personalmente."
    normal: "Processo standard 2-3 settimane"

  price_discussion:
    never: "Non invento prezzi"
    always: "Prezzi ufficiali 2025: [specific service + price]"
```

---

## 📦 DATASET STRUCTURE (JSONL Format)

### **Format for Fine-tuning**
```jsonl
{"messages": [
  {"role": "system", "content": "Sei ZANTARA, l'AI assistant di Bali Zero. Incarni lo spirito 'From Zero to Infinity'. Hai la conoscenza del team: Zainal (CEO), Amanda (CFO/tax), Krisna (KITAS specialist). Rispondi con calore umano, professionalità, e sempre con prezzi ufficiali 2025."},
  {"role": "user", "content": "Ho bisogno di aprire PT PMA"},
  {"role": "assistant", "content": "Perfetto! Per il PT PMA ti servono minimo 10 miliardi IDR di investimento. Il processo con noi dura 30-45 giorni. Costo: €2,500 tutto incluso. Vuoi che Amanda ti prepari un preventivo dettagliato? Include NPWP, NIB, e licenze base."}
]}

{"messages": [
  {"role": "system", "content": "You are ZANTARA..."},
  {"role": "user", "content": "What's the difference between KITAS and KITAP?"},
  {"role": "assistant", "content": "Great question! KITAS is temporary (6 months - 2 years), while KITAP is permanent (5 years). KITAS costs €800, KITAP €2,500. Most start with KITAS. Krisna specializes in both - shall I connect you?"}
]}
```

### **Multimodal Examples** (Llama 4 advantage)
```jsonl
{"messages": [
  {"role": "user", "content": "Can you check this document?", "images": ["base64_encoded_passport_page"]},
  {"role": "assistant", "content": "I see your passport expires in 4 months. For KITAS application, we need at least 6 months validity. You'll need to renew first. Our visa team can assist with emergency renewal coordination."}
]}
```

---

## 🔢 QUANTITÀ OTTIMALI

| Tipo | Quantità | Priorità | Formato |
|------|----------|----------|---------|
| Knowledge Base | ✅ 300+ files | Already have | MD/JSON |
| Client Conversations | 1,000 | 🔴 Critical | JSONL |
| Philosophy/Culture | 10-20 docs | 🔴 Critical | MD |
| Case Studies | 100 | 🟡 Important | JSON |
| Decision Trees | 20 | 🟡 Important | JSON |
| Voice Examples | 200 | 🟢 Nice to have | YAML |
| **TOTAL** | **~50MB text** | - | Mixed |

---

## ⚙️ PREPARATION SCRIPT

```python
# prepare_dataset.py

import json
import os
from pathlib import Path

def prepare_zantara_dataset():
    dataset = []

    # 1. Load Knowledge Base
    kb_path = Path("kb-extracted")
    for file in kb_path.rglob("*.md"):
        content = file.read_text()
        dataset.append({
            "messages": [
                {"role": "system", "content": "You have access to Bali Zero knowledge base."},
                {"role": "user", "content": f"Explain {file.stem}"},
                {"role": "assistant", "content": content[:2000]}  # Truncate
            ]
        })

    # 2. Load Team Profiles
    team = {
        "zainal": "CEO, visionary, 'From Zero to Infinity' philosophy",
        "amanda": "CFO, tax expert, precision in numbers",
        "krisna": "KITAS specialist, visa wizard",
        # ... add all 23
    }

    for name, role in team.items():
        dataset.append({
            "messages": [
                {"role": "user", "content": f"Chi è {name}?"},
                {"role": "assistant", "content": f"{name.capitalize()} è {role}. Parte fondamentale del team Bali Zero."}
            ]
        })

    # 3. Add Conversation Style
    style_examples = [
        {
            "user": "Quanto costa KITAS?",
            "assistant": "KITAS di lavoro (E23) costa €800 tutto incluso. Processo 30-45 giorni. Krisna ti segue personalmente. Vuoi iniziare?"
        },
        {
            "user": "Ho fretta",
            "assistant": "Capisco l'urgenza. Possiamo fare fast-track in 15-20 giorni con supplemento €200. Zainal può intervenire direttamente. Procediamo?"
        }
    ]

    for ex in style_examples:
        dataset.append({
            "messages": [
                {"role": "system", "content": "Sei ZANTARA di Bali Zero."},
                {"role": "user", "content": ex["user"]},
                {"role": "assistant", "content": ex["assistant"]}
            ]
        })

    # 4. Save as JSONL
    with open("zantara_dataset.jsonl", "w") as f:
        for item in dataset:
            f.write(json.dumps(item) + "\n")

    print(f"✅ Dataset created: {len(dataset)} examples")
    print(f"📦 Size: {os.path.getsize('zantara_dataset.jsonl') / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    prepare_zantara_dataset()
```

---

## 🎯 SUCCESS METRICS

ZANTARA risponde correttamente a:
1. ✅ "Quanto costa Working KITAS?" → €800 (non inventa)
2. ✅ "Chi è Krisna?" → KITAS specialist del team
3. ✅ "Posso aprire PT con 1 miliardo?" → No, minimo 10 miliardi
4. ✅ "Help urgently!" → Capisce urgenza, propone fast-track
5. ✅ Multi-lingua (IT/EN/ID) → Risponde nella stessa lingua

---

## 📅 TIMELINE

| Week | Task | Output |
|------|------|--------|
| **Week 1** | Collect client conversations | 1000 examples |
| **Week 1** | Write philosophy docs | 10 MD files |
| **Week 2** | Create decision trees | 20 JSON trees |
| **Week 2** | Extract case studies | 100 cases |
| **Week 3** | Run preparation script | zantara_dataset.jsonl |
| **Week 3** | Fine-tune on Fireworks | zantara-v1 model |
| **Week 4** | Test & refine | Production ready |

---

## ❓ DOMANDE DA RISOLVERE

1. **Hai accesso a conversazioni WhatsApp reali?**
   - Servono per catturare il VERO stile comunicativo

2. **Quali sono i 214 libri di filosofia?**
   - O era un numero ipotetico?

3. **Vuoi personality più "corporate" o "amichevole"?**
   - Ora sembra mix di entrambi

4. **Multi-lingua: priorità quale?**
   - IT per clienti italiani
   - EN per internazionali
   - ID per documenti locali

5. **Case studies: possiamo usare quelli reali?**
   - Ovviamente anonimizzati

---

**NEXT STEP**: Iniziare a raccogliere conversazioni WhatsApp reali. Sono il CUORE del training!