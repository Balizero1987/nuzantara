# Google Colab Pro - Fine-Tuning Guide

**Quick Start per fine-tuning SahabatAI con Google Colab Pro**

---

## Setup Iniziale (1 volta solo)

### 1. Upload Notebook a Google Drive

```bash
# Opzione A: Upload manuale
1. Vai a https://colab.research.google.com
2. File → Upload notebook
3. Seleziona: Fine_Tune_SahabatAI_Nuzantara.ipynb

# Opzione B: Da Google Drive
1. Upload Fine_Tune_SahabatAI_Nuzantara.ipynb a Google Drive
2. Double-click → Opens in Colab
```

### 2. Seleziona GPU A100

```
Runtime → Change runtime type
├─ Hardware accelerator: GPU
└─ GPU type: A100 (disponibile con Colab Pro)

Click Save
```

**IMPORTANTE**: A100 è necessaria per fine-tuning veloce (2-4 ore).
Se usi T4 (gratis) sarà molto più lento (8-12 ore).

---

## Preparazione Dataset

### Format Richiesto (JSON)

```json
[
  {
    "instruction": "Kamu adalah ZANTARA, asisten bisnis che aiuta stranieri con business, visa, legal in Indonesia.\n\nIMPORTANTE:\n- Usa bahasa Indonesia naturale e conversazionale\n- Puoi usare slang comune in contesti casual (gampang, nih, dong)\n- Se formale, mantieni professionalità ma non rigidità\n- Focus: KITAS, PT PMA, tax, visa, business setup",

    "input": "Saya mau buka PT PMA di Bali untuk bisnis kopi, prosesnya gimana?",

    "output": "Wah bagus nih rencana bisnis kopinya! Untuk PT PMA di Bali, ini yang perlu kamu tau:\n\nModal Minimal:\n- PT PMA: 10 miliar rupiah (requirement khusus penanaman modal asing)\n- Beda sama PT biasa yang cuma 50 juta ya\n\nProses Setup:\n1. Daftar NIB lewat OSS online\n2. Akta pendirian dari notaris\n3. SK Kemenkumham\n4. NPWP perusahaan\n5. Izin usaha (kopi: KBLI 56303)\n\nWaktu: 2-3 minggu kalau dokumen lengkap.\n\nUdah ada rencana lokasi spesifik?"
  },

  {
    "instruction": "[same as above]",
    "input": "Berapa lama proses KITAS investor?",
    "output": "Untuk KITAS investor, prosesnya biasanya 2-4 minggu setelah dokumen lengkap.\n\nYang perlu disiapkan:\n1. Bukti investasi minimal 1 miliar rupiah\n2. Rekomendasi dari BKPM\n3. Paspor valid minimum 6 bulan\n4. Surat sponsor dari perusahaan\n\nTips: Kalau dokumen udah lengkap dan benar, prosesnya lebih cepat.\n\nAda yang mau ditanyain tentang dokumen yang diperlukan?"
  }
]
```

### Crea Dataset da 70 Domande Esistenti

**Script Helper**:

```python
# generate_dataset.py
import json
import openai  # or anthropic for Claude

# Your 70 existing questions
base_questions = [
    "Apa saja persyaratan KITAS investor...",
    "Berapa modal minimal PT PMA...",
    # ... (tutte le 70)
]

system_prompt = """Kamu sei un esperto di business indonesiano.
Genera 15 variazioni di questa domanda in indonesiano:
- 5 versioni casual (usa: gue, gimana, dong, ga)
- 5 versioni business (usa: saya, bagaimana, prosedur)
- 5 versioni formali (usa: menurut pasal, peraturan)

Le variazioni devono essere naturali, non robotiche."""

dataset = []

for question in base_questions:
    # Generate variations with GPT-4
    variations = generate_variations(question, system_prompt)

    # Indonesian team writes golden answer
    for variation in variations:
        answer = team_writes_answer(variation)

        dataset.append({
            "instruction": ZANTARA_SYSTEM_PROMPT,
            "input": variation,
            "output": answer
        })

# Save
with open('nuzantara_training_data.json', 'w', encoding='utf-8') as f:
    json.dump(dataset, f, ensure_ascii=False, indent=2)

print(f"✅ Dataset created: {len(dataset)} examples")
```

**Target**: 70 domande × 15 variazioni = **1,050 Q&A pairs**

---

## Esecuzione Fine-Tuning

### Step-by-Step

**1. Open notebook in Colab**
```
https://colab.research.google.com
→ Upload: Fine_Tune_SahabatAI_Nuzantara.ipynb
→ Runtime → A100 GPU
```

**2. Run cells in ordine**
```
Cell 1: Install dependencies (5 min)
Cell 2: Check GPU (verify A100)
Cell 3: Load SahabatAI base (10 min first time)
Cell 4: Configure LoRA
Cell 5: Upload dataset (tuo JSON file)
Cell 6: Format dataset
Cell 7: Configure training
Cell 8: Initialize trainer
Cell 9: TRAIN! (2-4 hours) ← Vai a prendere un caffè ☕
Cell 10: Save model
Cell 11: Test model
Cell 12: Download model
```

**3. Monitor training**
```
Watch the loss value - dovrebbe diminuire:
Step 10: loss=2.345
Step 20: loss=1.987
Step 30: loss=1.654
...
Step 500: loss=0.543  ✅ Good!

Se loss non diminuisce → check dataset quality
```

**4. Test results**
```
Try test queries in Cell 11:
- "Saya mau buka usaha kopi di Bali"
- "Berapa lama KITAS?"
- "Gimana cara bikin PT PMA?"

Responses dovrebbero essere:
✅ Natural (not robotic)
✅ Accurate
✅ Domain-specific (KITAS, PT PMA knowledge)
```

**5. Download model**
```
Cell 12 downloads ZIP file
Extract → Upload to server
Load in production
```

---

## Training Parameters

### Default (Recommended for 1,000-3,000 examples)

```python
num_train_epochs = 3
per_device_train_batch_size = 4
gradient_accumulation_steps = 4
learning_rate = 2e-4
```

**Effective batch size**: 4 × 4 = 16
**Training time**: 2-4 hours on A100

### Se Dataset Piccolo (<500 examples)

```python
num_train_epochs = 5  # More epochs
learning_rate = 1e-4  # Lower LR to avoid overfitting
```

### Se Dataset Grande (>5,000 examples)

```python
num_train_epochs = 2  # Fewer epochs needed
per_device_train_batch_size = 8  # Larger batch
gradient_accumulation_steps = 2
```

### Se Out of Memory

```python
per_device_train_batch_size = 2  # Reduce batch size
gradient_accumulation_steps = 8  # Compensate with accumulation
```

---

## Costi Google Colab Pro

### Subscription

```
Colab Pro: $9.99/mese
- A100 GPU access ✅
- Background execution ✅
- Longer runtimes ✅

Colab Pro+: $49.99/mese
- Priority A100 access
- Even longer runtimes
```

**Raccomandazione**: Colab Pro ($10/mese) è sufficiente.

### Compute Units

```
A100 GPU: ~10 compute units/ora
Training time: 2-4 ore
Total units: 20-40 units

Colab Pro include: 100 units/mese
→ Puoi fare 2-3 training runs al mese gratis ✅
```

**Se finisci units**: Acquista extra compute units ($10 per 100 units)

### Costo Totale Stimato

```
Setup (1 volta):
- Colab Pro subscription: $10/mese
- Training run 1: 0 units (included)
- Training run 2-3: 0 units (included)
= $10/mese

Ongoing (opzionale):
- Weekly retraining: ~10 units/settimana
- Monthly: ~40 units
- Se >100 units → buy extra $10
= $10-20/mese
```

**VS Alternative**:
- AWS p4de.24xlarge: $40/ora × 2-4h = $80-160 per run
- RunPod A100: $1.50/ora × 2-4h = $6-12 per run
- **Colab Pro**: $10/mese flat (2-3 runs included) ✅ BEST VALUE

---

## Dopo il Training

### 1. Evaluate Results

**Compare base vs fine-tuned**:

```python
# Test 50 queries
queries = load_test_queries()

for query in queries:
    response_base = sahabatai_base.generate(query)
    response_finetuned = sahabatai_finetuned.generate(query)

    # Team rates (blind A/B test)
    preference = team_chooses(response_base, response_finetuned)

# Target: Fine-tuned wins >70% of time
```

### 2. Quality Checklist

```
Before deploying:
✓ Naturalness: >8.5/10 (maintained from base)
✓ Accuracy: >85% on Nuzantara domain
✓ No regressions: Still good on general Indonesian
✓ Team approval: "Better than base!"
```

### 3. Deploy

```bash
# Extract downloaded ZIP
unzip nuzantara-sahabatai-lora-final.zip

# Upload to server
scp -r nuzantara-sahabatai-lora-final/ user@server:/models/

# Load in production (see deployment guide)
```

### 4. A/B Test in Production

```python
# Start with 20% traffic to fine-tuned
rollout_percentage = 0.20

# Monitor metrics:
- Response quality
- User satisfaction
- Accuracy on domain queries

# If better → increase to 100%
```

---

## Troubleshooting

### Problema: "Out of Memory"

**Soluzione**:
```python
# Reduce batch size
per_device_train_batch_size = 2  # Instead of 4

# Increase gradient accumulation
gradient_accumulation_steps = 8  # Instead of 4

# Reduce sequence length
max_seq_length = 1024  # Instead of 2048
```

### Problema: "Training molto lento"

**Check**:
```python
# Verify GPU type
!nvidia-smi
# Should show: A100-SXM4-40GB

# If shows T4 → Wrong GPU!
# Solution: Runtime → Change runtime type → A100
```

### Problema: "Loss non diminuisce"

**Possibili cause**:
1. **Learning rate troppo alta**
   ```python
   learning_rate = 1e-4  # Try lower
   ```

2. **Dataset quality issues**
   ```
   - Check examples are correct
   - Verify naturalness
   - Remove duplicates
   ```

3. **Overfitting su dataset piccolo**
   ```python
   # Add regularization
   lora_dropout = 0.1  # Increase from 0.05
   weight_decay = 0.05  # Increase from 0.01
   ```

### Problema: "Session disconnects"

**Soluzione**:
```javascript
// Keep Colab alive (run in browser console)
function KeepClicking(){
   console.log("Clicking");
   document.querySelector("colab-connect-button").click()
}
setInterval(KeepClicking,60000)
```

Or: Upgrade to Colab Pro+ (longer runtimes)

### Problema: "Model responses not good"

**Debug**:
1. **Check dataset**: Are examples high quality?
2. **Check training**: Did loss decrease properly?
3. **Check inference**: Are you using correct prompt format?
4. **Compare**: Test same query on base vs fine-tuned

**If still bad**: Iterate on dataset quality, not training params.

---

## Best Practices

### Dataset Quality > Quantity

```
❌ BAD: 10,000 low-quality examples
✅ GOOD: 1,000 high-quality examples

Each example should:
- Be natural Indonesian (not translated)
- Have accurate information
- Use appropriate tone
- Be reviewed by native speaker
```

### Start Small, Iterate

```
Week 1: 500 examples → Train v1.0
  → Test with team
  → Identify gaps

Week 2: +300 examples → Train v1.1
  → Better on weak areas
  → Test again

Week 4: 1,000 examples → Train v2.0
  → Production-ready
```

### Track Experiments

```
Keep log:
- Dataset version
- Training params
- Results (accuracy, naturalness)
- Team feedback

Example:
v1.0: 500 examples, LR=2e-4, epochs=3 → 75% accuracy
v1.1: 800 examples, LR=1e-4, epochs=3 → 82% accuracy ✅
v2.0: 1,000 examples, LR=1e-4, epochs=5 → 88% accuracy ✅
```

### Save Checkpoints

```python
# Training args
save_steps = 100  # Save every 100 steps

# If training crashes, resume from checkpoint:
trainer.train(resume_from_checkpoint=True)
```

---

## Next Steps

**Week 1**:
1. ✅ Prepare dataset (1,000 Q&A pairs)
2. ✅ Upload to Colab
3. ✅ Run first training
4. ✅ Test results

**Week 2**:
1. Team evaluation
2. Identify improvements needed
3. Expand dataset
4. Retrain v1.1

**Week 3-4**:
1. Final training (2,000-3,000 examples)
2. Extensive testing
3. Deploy to production
4. Monitor & iterate

---

## Resources

**Notebook**: `Fine_Tune_SahabatAI_Nuzantara.ipynb`

**Guides**:
- Complete guide: `docs/guides/FINE_TUNING_SAHABATAI_NUZANTARA.md`
- Dataset analysis: `docs/analysis/SAHABATAI_DATASET_ANALYSIS.md`

**External**:
- Unsloth docs: https://github.com/unslothai/unsloth
- Colab Pro: https://colab.research.google.com/signup
- LoRA paper: https://arxiv.org/abs/2106.09685

---

## FAQ

**Q: Quanto costa veramente?**
A: $10/mese Colab Pro. Include 2-3 training runs. Poi $10 per 100 compute units extra.

**Q: Posso usare Colab gratis?**
A: Sì, ma solo GPU T4 (lenta). Training prenderà 8-12 ore invece di 2-4.

**Q: Quanto dataset serve?**
A: Minimo 500 (test), ideale 1,000-2,000 (production), ottimale 5,000+.

**Q: Colab vs RunPod/AWS?**
A: Colab Pro ($10 flat) migliore per 1-3 runs/mese. RunPod/AWS migliore se training continuo.

**Q: Posso interrompere e riprendere?**
A: Sì! Salva checkpoint, poi resume_from_checkpoint=True.

**Q: E se il modello peggiora?**
A: Always test prima di deploy. Se peggiora, non usarlo. Zero risk.

---

**Ready?** Upload il notebook a Colab e inizia! 🚀
