# Fine-Tuning SahabatAI per Dominio Nuzantara

**Obiettivo**: Adattare SahabatAI (già ottimo per indonesiano naturale) al dominio specifico Nuzantara (business advisory, KITAS, PT PMA, tax indonesiano)

**Approccio**: LoRA/QLoRA fine-tuning (preserva capabilities esistenti + aggiunge expertise Nuzantara)

**Costo stimato**: $50-200
**Tempo**: 1-4 settimane (principalmente dataset prep)
**ROI atteso**: Precisione +30-50% su dominio specifico, naturalezza mantenuta

---

## Perché Fine-Tuning (e Non Solo Prompt Engineering)

### Limiti del Prompt Engineering

```python
# Approccio attuale: Prompt engineering
system_prompt = """Kamu adalah ZANTARA, asisten bisnis..."""
# ✅ Pro: Zero cost, immediate
# ❌ Con: Limited context (8K tokens)
# ❌ Con: Ripete errori se non nel prompt
# ❌ Con: Non impara da feedback
```

### Vantaggi del Fine-Tuning

```python
# Fine-tuned model = SahabatAI + Nuzantara knowledge BAKED IN
# ✅ Knowledge embedded nei weights
# ✅ Consistent answers su dominio
# ✅ Impara da errori corretti dal team
# ✅ Può usare prompt più corti (più spazio per context)
# ✅ Better su edge cases specifici Nuzantara
```

**Quando vale la pena**:
- ✅ Hai dominio specifico (KITAS, PT PMA, tax)
- ✅ Hai feedback da team indonesiano
- ✅ Volume alto di query simili
- ✅ Vuoi consistency massima

---

## FASE 1: Dataset Creation (CRITICO)

### Target Dataset Size

| Size | Quality | Use Case |
|------|---------|----------|
| **500-1,000** | Alta | POC, test feasibility |
| **2,000-3,000** | Alta | Production-ready |
| **5,000-10,000** | Alta | Optimal performance |

**Regola d'oro**: Meglio 1,000 esempi di ALTA qualità che 10,000 mediocri.

### Fonti Dati Nuzantara

**1. Dati Esistenti (GOLD MINE)**

```bash
# 70 domande difficili già hai
apps/intel-scraping/domande_indonesiano.md

Categorie:
- Immigrazione (10): KITAS, KITAP, visa
- Codice Penale (10): KUHP, crimini
- Company & Licenze (10): PT, PT PMA, OSS
- Tax (10): PPh, PPN, transfer pricing
- Legal Property (10): HGB, HGU, land rights
- Combo Topics (20): Multi-domain scenarios
```

**Azione**:
```python
# Per ogni domanda:
1. Genera 10-20 variazioni (GPT-4)
   - Formale: "Menurut Pasal 31 PP..."
   - Business: "Untuk KITAS investor, persyaratan apa saja?"
   - Casual: "KITAS investor itu butuh dokumen apa aja sih?"

2. Team indonesiano crea golden answer
   - Natural (non tradotto)
   - Accurate
   - Tono appropriato

3. Review e validate

→ 70 × 15 = 1,050 Q&A pairs ✅
```

**2. Conversazioni Reali (Se disponibili)**

```python
# Da backend logs (anonimizzati)
sources = [
    "Chat logs Nuzantara (rimuovi PII)",
    "Email queries ricevute",
    "WhatsApp inquiries (con consenso)",
    "Forms compilati"
]

# Filter per quality:
- Query chiare e complete
- Risposte accurate
- Conversazioni concluse con successo

→ Stima: 200-500 pairs reali ✅
```

**3. Synthetic Data Generation**

```python
# Usa GPT-4 per generare, poi team valida
prompt = """
Generate 100 diverse Indonesian queries about:
- KITAS application process
- PT PMA setup costs and requirements
- Indonesian tax obligations for foreigners
- Visa types and differences

Vary:
- Formality (casual, business, formal)
- Complexity (simple, detailed, multi-part)
- User persona (investor, entrepreneur, employee)

Use natural Indonesian (not translated).
"""

# GPT-4 genera → Team valida/corregge → Training data

→ 500-1,000 synthetic pairs ✅
```

**4. Error Correction Database**

```python
# Traccia errori del modello attuale
errors = {
    "query": "Berapa modal PT PMA?",
    "model_answer_wrong": "Modal minimal 50 juta rupiah",
    "correct_answer": "Untuk PT PMA, modal minimal 10 miliar rupiah...",
    "why_wrong": "Confused PT biasa with PT PMA",
    "lesson": "Always clarify PT vs PT PMA distinction"
}

# Aggiungi al training set per imparare da errori

→ 100-200 correction pairs ✅
```

### Dataset Format

```json
[
  {
    "instruction": "Kamu adalah ZANTARA, asisten bisnis yang membantu orang asing dengan urusan bisnis, visa, dan legal di Indonesia.\n\nPENTING:\n- Gunakan bahasa Indonesia yang natural dan conversational\n- Boleh pakai slang umum kalau konteksnya casual\n- Fokus: KITAS, PT PMA, tax, visa, business setup",

    "input": "Saya mau buka PT PMA di Bali untuk bisnis kopi, prosesnya gimana dan berapa modal minimal?",

    "output": "Wah, bagus nih rencana bisnis kopinya! Untuk PT PMA di Bali, ini yang perlu kamu tau:\n\nModal Minimal:\n- PT PMA: 10 miliar rupiah (ini requirement khusus untuk penanaman modal asing)\n- Beda sama PT biasa yang cuma 50 juta ya\n\nProses Setup:\n1. Daftar NIB lewat OSS online\n2. Akta pendirian dari notaris\n3. SK Kemenkumham\n4. NPWP perusahaan\n5. Izin usaha sesuai bidang (untuk kopi: KBLI 56303)\n\nWaktu: Sekitar 2-3 minggu kalau dokumen lengkap.\n\nTips: Karena di Bali, perhatikan juga:\n- Izin lokasi dari desa adat (kalau area tertentu)\n- Compliance dengan aturan daerah Bali\n\nUdah ada rencana lokasi spesifik? Mau di area wisata atau residential?"
  },

  {
    "instruction": "[same system prompt]",
    "input": "Menurut Peraturan Pemerintah Nomor 31 Tahun 2013 Pasal 31, apa saja persyaratan KITAS investor?",
    "output": "Berdasarkan Pasal 31 Peraturan Pemerintah Nomor 31 Tahun 2013 tentang Peraturan Pelaksanaan UU Keimigrasian, persyaratan untuk KITAS investor mencakup:\n\n1. Bukti investasi minimal 1 miliar rupiah\n   - Bisa berupa bukti transfer\n   - Atau bukti kepemilikan saham di PT PMA\n\n2. Rekomendasi dari BKPM (Badan Koordinasi Penanaman Modal)\n   - Harus ada project yang approved\n\n3. Paspor yang masih berlaku minimum 6 bulan\n\n4. Surat sponsor dari perusahaan di Indonesia\n\n5. Pas foto ukuran 4x6 (background merah)\n\nProses Verifikasi:\n- Waktu: 2-4 minggu setelah dokumen lengkap\n- Biaya: Sekitar 3-5 juta rupiah (tergantung agen)\n\nKITAS investor berlaku 1-2 tahun dan bisa diperpanjang.\n\nAda yang mau ditanyakan lebih detail tentang dokumen tertentu?"
  }
]
```

### Quality Checklist (Team Review)

```
Per ogni Q&A pair, team verifica:

✓ Naturalezza
  [ ] Suona come indonesiano nativo?
  [ ] O suona tradotto dall'inglese?
  [ ] Usa particelle appropriate (nih, dong, ya, kok)?

✓ Accuratezza
  [ ] Informazioni corrette?
  [ ] Numeri/dati verificati?
  [ ] Riferimenti legali precisi?

✓ Tono
  [ ] Appropriato per formalità query?
  [ ] Casual quando serve, formal quando richiesto?

✓ Completezza
  [ ] Risponde completamente alla domanda?
  [ ] Include tips utili?
  [ ] Engage con follow-up quando appropriato?

✓ Marca Nuzantara
  [ ] Riflette stile ZANTARA?
  [ ] Focus su domini key (visa, tax, business)?
```

---

## FASE 2: Fine-Tuning Setup

### Hardware Requirements

**Opzione A: Cloud GPU (CONSIGLIATO per inizio)**

```bash
# RunPod, Vast.ai, Lambda Labs, Google Colab Pro
GPU: 1x A100 40GB
Costo: ~$1.50/ora
Tempo training: 2-4 ore
Costo totale: ~$6-10 per training run

# O budget lower:
GPU: 1x RTX 4090 24GB (Vast.ai)
Costo: ~$0.50/ora
Tempo: 4-8 ore
Costo totale: ~$4-8
```

**Opzione B: Own Hardware**

```bash
GPU: RTX 3090/4090 (24GB VRAM)
Setup: QLoRA (4-bit quantization)
Memory: ~12GB VRAM used
Tempo: 4-8 ore
Costo: $0 (già hai hardware)
```

### Installation

```bash
# 1. Install dependencies
pip install torch transformers datasets trl peft accelerate bitsandbytes
pip install unsloth  # 2x faster, 63% less VRAM

# 2. Prepare dataset
# Convert to JSON format (see above)

# 3. Test setup
python -c "import unsloth; print('Unsloth ready!')"
```

### Training Script Usage

```bash
# Navigate to backend
cd apps/backend-rag/backend/llm

# Edit train_nuzantara_sahabatai.py
# 1. Load your dataset (replace example_dataset)
# 2. Set training parameters
# 3. Uncomment trainer.train()

# Run training
python train_nuzantara_sahabatai.py

# Monitor output
# Training will show:
# - Loss decreasing (good!)
# - Steps/second
# - ETA
```

### Training Parameters

```python
# Conservative (safe, slower)
num_epochs = 3
batch_size = 2
learning_rate = 2e-5
gradient_accumulation_steps = 8

# Balanced (recommended)
num_epochs = 3
batch_size = 4
learning_rate = 2e-4
gradient_accumulation_steps = 4

# Aggressive (faster, risk overfitting)
num_epochs = 5
batch_size = 8
learning_rate = 5e-4
gradient_accumulation_steps = 2
```

**Regole**:
- Dataset piccolo (500-1K) → Conservative
- Dataset medio (2-3K) → Balanced
- Dataset grande (5K+) → Balanced o Aggressive

---

## FASE 3: Evaluation & Testing

### Automated Metrics

```python
# Dopo training, valuta su test set (10-20% dataset)

from sklearn.metrics import accuracy_score

test_results = {
    "perplexity": 2.4,  # Lower = better
    "exact_match": 0.45,  # % risposte esattamente corrette
    "bleu_score": 0.72,  # Similarity con golden answers
}

# Benchmark: Compare base vs fine-tuned
base_model_accuracy = 0.65
finetuned_accuracy = 0.82
improvement = +26%  # Target: >20%
```

### Human Evaluation (CRITICO)

```python
# A/B test con team indonesiano

test_queries = [
    "50 query reali Nuzantara",
    "Mix: casual, business, formal",
    "Mix: simple, complex, multi-part"
]

for query in test_queries:
    response_base = sahabatai_base.generate(query)
    response_finetuned = sahabatai_finetuned.generate(query)

    # Team rates (blind)
    team_preference = ask_team([
        "Quale risposta preferisci? (A o B)",
        "Naturalezza (1-10)",
        "Accuratezza (1-10)",
        "Completezza (1-10)"
    ])

# Target: Fine-tuned wins >70% of time
```

### Quality Gates

```
Before deploying fine-tuned model:

✓ Quantitative
  [ ] Accuracy improvement >20%
  [ ] No degradation on general Indonesian
  [ ] Perplexity comparable to base

✓ Qualitative
  [ ] Team preference >70%
  [ ] Naturalness score >8/10
  [ ] Zero critical errors (wrong legal info)

✓ Edge Cases
  [ ] Handles code-mixing well
  [ ] Adapts register appropriately
  [ ] No hallucinations on unknown topics
```

---

## FASE 4: Deployment

### Loading Fine-Tuned Model

```python
# apps/backend-rag/backend/llm/sahabat_ai_client.py

from unsloth import FastLanguageModel

class NuzantaraFineTunedSahabatAI:
    """Fine-tuned SahabatAI with Nuzantara expertise"""

    def __init__(self):
        # Load base model + LoRA adapters
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name="./nuzantara-sahabatai-lora",  # Your fine-tuned path
            max_seq_length=2048,
            dtype=None,
            load_in_4bit=True
        )

        FastLanguageModel.for_inference(self.model)  # Inference mode

    async def chat_async(self, messages, **kwargs):
        # Same interface as before
        # But now with Nuzantara knowledge baked in!
        ...
```

### A/B Testing in Production

```python
# Gradual rollout

class IntelligentRouter:
    def __init__(self):
        self.sahabat_base = SahabatAIClient()
        self.sahabat_finetuned = NuzantaraFineTunedSahabatAI()
        self.rollout_percentage = 0.20  # Start with 20%

    async def route_query(self, messages):
        # Randomly route 20% to fine-tuned
        if random.random() < self.rollout_percentage:
            return await self.sahabat_finetuned.chat_async(messages)
        else:
            return await self.sahabat_base.chat_async(messages)

# Monitor metrics:
# - User satisfaction
# - Accuracy on domain queries
# - No regression on general queries

# If fine-tuned better → increase rollout_percentage to 100%
```

---

## FASE 5: Continuous Improvement

### Feedback Loop

```python
# Traccia performance in production
class FeedbackCollector:
    def collect_feedback(self, query, response, user_rating):
        """
        User rates response 1-5 stars
        If <3 stars → flag for review
        """
        if user_rating < 3:
            # Add to improvement dataset
            improvement_data.append({
                "query": query,
                "model_response": response,
                "user_rating": user_rating,
                "needs_correction": True
            })

    def weekly_retrain(self):
        """
        Every week:
        1. Collect low-rated responses
        2. Team corrects them
        3. Add to dataset
        4. Re-train LoRA (1-2 hours)
        5. Deploy updated model
        """
        pass

# Continuous improvement cycle:
# Week 1: Deploy v1
# Week 2: Collect feedback → retrain → v1.1
# Week 3: Collect feedback → retrain → v1.2
# ...
```

### Dataset Expansion Strategy

```python
# Start small, grow continuously
milestones = {
    "Week 1": "1,000 Q&A pairs → Train v1.0",
    "Week 4": "+500 from production → Train v1.1",
    "Week 8": "+500 corrections → Train v1.2",
    "Week 12": "3,000 total → Train v2.0 (re-train from scratch)",
}

# Target finale: 5,000-10,000 high-quality pairs
# = Best-in-class Nuzantara AI
```

---

## Cost-Benefit Analysis

### Costi

**One-time Setup**:
```
Dataset creation: 40-80 ore team time
  - 70 domande → 1,050 variations: 20 ore
  - Review & validate: 20 ore
  - Synthetic generation: 10 ore
  - Error database: 10 ore

GPU training: $50-200
  - Cloud GPU: $10 per run × 5-10 runs (iteration) = $50-100
  - Or own hardware: $0

Tools/setup: $0 (open source)

TOTAL: ~$50-200 + team time
```

**Ongoing**:
```
Weekly retraining: 2 ore team + $10 GPU
Monthly: ~$40 + 8 ore team
Yearly: ~$500 + 100 ore team
```

### Benefici

**Quantificabili**:
```
Accuracy improvement: +30-50% su dominio Nuzantara
Response quality: Da 7/10 a 9/10
Customer satisfaction: +25-40%
Tempo risposta team: -30% (AI gestisce più query correttamente)
```

**ROI Stima**:
```
Investment: $200 + 80 ore team (1 persona × 2 settimane)

Returns (yearly):
- Riduzione workload team: 20% × $50K salary = $10K/anno
- Migliore conversion rate: +10% × 1000 leads = +100 clienti
- Customer satisfaction: Meno churn, più referral

Break-even: ~2-3 mesi
ROI Year 1: 5-10x
```

---

## Risks & Mitigations

### Rischio 1: Overfitting

**Problema**: Modello memorizza training data, non generalizza

**Sintomi**:
- Perfect su training set
- Poor su test set
- Risposte troppo simili tra loro

**Mitigazione**:
```python
# 1. Train/validation split
train_size = 0.85
val_size = 0.15

# 2. Early stopping
if val_loss increases for 3 epochs → stop

# 3. Regularization
dropout = 0.05
weight_decay = 0.01

# 4. Dataset diversity
Ensure variazioni sufficienti per ogni topic
```

### Rischio 2: Catastrophic Forgetting

**Problema**: Perde capabilities generali di SahabatAI

**Mitigazione**:
```python
# 1. LoRA invece di full fine-tuning
# (LoRA preserva base model)

# 2. Mix dataset
training_data = [
    "80% Nuzantara-specific",
    "20% general Indonesian (from SahabatAI original)"
]

# 3. Test su benchmark generale
Verify no regression on general Indonesian tasks
```

### Rischio 3: Dataset Quality Issues

**Problema**: Garbage in, garbage out

**Mitigazione**:
```python
# Quality process:
1. Multiple team reviewers per example
2. Consistency checks (same query → same answer)
3. Fact verification (legal/tax info)
4. Native speaker validation
5. Iterative improvement (remove low-quality)

Quality > Quantity sempre
```

---

## Timeline & Milestones

### Week 1-2: Dataset Prep
```
[✓] Inventory existing data (70 domande)
[✓] Generate variations (GPT-4)
[✓] Team creates golden answers
[✓] Quality review
Target: 1,000 Q&A pairs
```

### Week 3: Training Setup
```
[✓] Cloud GPU account setup
[✓] Install Unsloth & dependencies
[✓] Test training script
[✓] First training run (small batch)
```

### Week 4: Full Training & Evaluation
```
[✓] Train on full dataset
[✓] Automated metrics
[✓] Human evaluation (A/B test)
[✓] Quality gates check
```

### Week 5: Deployment
```
[✓] Deploy to staging
[✓] Integration testing
[✓] 20% rollout to production
[✓] Monitor metrics
```

### Week 6+: Iteration
```
[✓] Collect production feedback
[✓] Weekly retraining
[✓] Dataset expansion
[✓] Continuous improvement
```

---

## Success Criteria

### Technical Metrics

```
Accuracy: >80% on Nuzantara test set (vs 60% baseline)
Naturalness: >8.5/10 from team (maintained from base SahabatAI)
Precision: >90% on critical info (legal, tax, visa)
Consistency: >85% same query → same answer
```

### Business Metrics

```
Customer satisfaction: +30%
Team workload: -20% (AI handles more correctly)
Response quality: 9/10 average
Conversion rate: +10-15%
```

### User Feedback

```
Team says: "Risposte più accurate sul nostro dominio!"
Users say: "Finalmente capisce le mie domande specifiche!"
Metrics: 4.5+ stars average rating
```

---

## Next Steps

### Immediate (This Week)

1. **Review 70 domande esistenti**
   ```bash
   cat apps/intel-scraping/domande_indonesiano.md
   # Identify: Quali domande sono più frequenti?
   # Priority: Focus su top 20 per prime variations
   ```

2. **Setup GPT-4 variation generator**
   ```python
   # Script per generare 10-20 variations per domanda
   # Include: casual, business, formal versions
   ```

3. **Team kickoff meeting**
   ```
   Agenda:
   - Explain fine-tuning plan
   - Assign roles (chi fa cosa)
   - Set quality standards
   - Timeline agreement
   ```

### Short-term (Week 1-2)

1. **Generate 1,000 Q&A pairs**
2. **Team review & validate**
3. **Setup cloud GPU account**
4. **First training run**

### Medium-term (Month 1-2)

1. **Deploy fine-tuned model**
2. **A/B test in production**
3. **Collect feedback**
4. **Iterate & improve**

### Long-term (Month 3-6)

1. **Expand to 5,000+ pairs**
2. **Continuous retraining**
3. **Multi-language support** (English, Italian con stessa tecnica)
4. **Advanced techniques** (RLHF, DPO)

---

## Resources

**Code**:
- Training script: `apps/backend-rag/backend/llm/train_nuzantara_sahabatai.py`
- Client: `apps/backend-rag/backend/llm/sahabat_ai_client.py`

**Documentation**:
- This guide: `docs/guides/FINE_TUNING_SAHABATAI_NUZANTARA.md`
- Dataset analysis: `docs/analysis/SAHABATAI_DATASET_ANALYSIS.md`

**External**:
- Unsloth: https://github.com/unslothai/unsloth
- LoRA paper: https://arxiv.org/abs/2106.09685
- QLoRA paper: https://arxiv.org/abs/2305.14314

---

## FAQ

**Q: Quanto dataset serve veramente?**
A: Minimo 500 (POC), ideale 2,000-3,000 (production), ottimale 5,000+ (best-in-class). Qualità > quantità sempre.

**Q: Posso usare solo GPU consumer (RTX 3090/4090)?**
A: SÌ! Con QLoRA, 24GB bastano. Sarà più lento ma funziona.

**Q: Quanto tempo serve per vedere risultati?**
A: 2-4 settimane dall'inizio al deployment. Poi continuous improvement.

**Q: E se il fine-tuning peggiora il modello?**
A: Test sempre su validation set. Se peggiora, torni a base SahabatAI. Zero downtime.

**Q: Serve expertise ML/AI?**
A: NO! Script già pronto. Serve solo: dataset prep + run script + validate results.

**Q: Costo ricorrente?**
A: ~$40/mese GPU + 8 ore team/mese per retraining settimanale. Opzionale se modello già good enough.

---

## Conclusione

Fine-tuning SahabatAI per Nuzantara è:
- ✅ **Feasible**: $50-200 + 2-4 settimane
- ✅ **Effective**: +30-50% accuracy attesa
- ✅ **Scalable**: Continuous improvement
- ✅ **Low-risk**: Preserva naturalezza SahabatAI

**Bottom line**: Combina il meglio di entrambi:
- **SahabatAI base**: Indonesiano naturale, slang, cultura
- **+ Fine-tuning Nuzantara**: Domain expertise (KITAS, PT PMA, tax)
- **= Best-in-class AI** per business advisory indonesiano

**Ready to start?** Comincia con dataset prep questa settimana! 🚀
