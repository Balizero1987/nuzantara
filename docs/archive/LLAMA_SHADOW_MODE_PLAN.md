# LLAMA 3.1 8B Shadow Mode Testing Plan
**ZANTARA - Production Dataset Collection & A/B Testing**

---

## 🎯 Obiettivo

Raccogliere dataset reale da produzione e testare LLAMA 3.1 8B fine-tuned in shadow mode (parallelo a Claude) per validare:
1. **Qualità** rispetto a Claude Haiku/Sonnet
2. **Latency** e performance
3. **Cost savings** (€4/mese flat vs $25-55/mese usage)
4. **"Anima indonesiana"** (cultural fit e personalità)

**Zero user impact** - Gli utenti continuano a ricevere risposte Claude mentre LLAMA viene testato in background.

---

## 📋 Fasi del Piano

### **PHASE 1: Dataset Collection (1 settimana)**
Raccogliere conversazioni reali dalla produzione PostgreSQL.

#### Step 1.1: Estrai conversazioni da PostgreSQL
```bash
# Estrai ultimi 30 giorni di conversazioni
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY
export DATABASE_URL="postgresql://..."  # From Railway

python scripts/extract_dataset_from_postgres.py \
    --days 30 \
    --limit 5000 \
    --models haiku sonnet \
    --output ./data/llama_ft_dataset
```

**Output:** `data/llama_ft_dataset/raw_conversations.jsonl`

**Success criteria:**
- ✅ Almeno 1000 conversazioni estratte
- ✅ Distribuzione bilanciata IT/EN/ID
- ✅ Mix di greeting/casual/business queries

#### Step 1.2: Analizza qualità dataset
```bash
python scripts/analyze_shadow_mode_logs.py --stats-only
```

**Metriche da verificare:**
- Linguaggi: target 40% IT, 30% EN, 30% ID
- Categorie: greeting 30%, casual 20%, business 50%
- Qualità: >80% passa filtri quality

#### Step 1.3: Formatta per training LLAMA
```bash
python scripts/prepare_llama_dataset.py
```

**Output:**
- `data/llama_ft_dataset/train.jsonl` (80%)
- `data/llama_ft_dataset/val.jsonl` (10%)
- `data/llama_ft_dataset/test.jsonl` (10%)

**Formato LLAMA instruction-tuning:**
```json
{
  "messages": [
    {"role": "system", "content": "You are ZANTARA..."},
    {"role": "user", "content": "Ciao"},
    {"role": "assistant", "content": "Ciao! Come posso aiutarti..."}
  ],
  "metadata": {"language": "it", "rating": 5}
}
```

---

### **PHASE 2: LLAMA Fine-tuning (2-4 ore GPU)**
Fine-tune LLAMA 3.1 8B sul dataset reale ZANTARA.

#### Step 2.1: Setup fine-tuning environment
**Opzioni:**
1. **RunPod** (recommended): A100 GPU, €0.79/ora
2. **Lambda Labs**: H100 GPU, $1.99/ora
3. **Google Colab Pro+**: A100, $50/mese

**Framework:** [Unsloth](https://github.com/unslothai/unsloth) (4x più veloce di HuggingFace)

#### Step 2.2: Fine-tune LLAMA
```bash
# Install Unsloth
pip install unsloth

# Run fine-tuning (example script - customize per ZANTARA)
python -m unsloth.train \
    --model meta-llama/Llama-3.1-8B-Instruct \
    --dataset ./data/llama_ft_dataset/train.jsonl \
    --val_dataset ./data/llama_ft_dataset/val.jsonl \
    --output_dir ./models/zantara-llama-3.1-8b-v2 \
    --num_epochs 3 \
    --learning_rate 2e-4 \
    --batch_size 4 \
    --gradient_accumulation_steps 4
```

**Training time:** ~2-4 ore su A100

**Success criteria:**
- ✅ Validation loss < 0.5
- ✅ Accuracy > 95% su test set
- ✅ No overfitting (train/val loss simile)

#### Step 2.3: Deploy to RunPod Serverless
```bash
# Upload model to HuggingFace
huggingface-cli upload balizero/zantara-llama-3.1-8b-v2 ./models/zantara-llama-3.1-8b-v2

# Configure RunPod endpoint
# Update apps/backend-rag/backend/llm/zantara_client.py:
RUNPOD_ENDPOINT = "https://api.runpod.ai/v2/{YOUR_NEW_ENDPOINT}/runsync"
MODEL_PATH = "balizero/zantara-llama-3.1-8b-v2"
```

**Cost:** €3.78/mese (flat rate, unlimited requests)

---

### **PHASE 3: Shadow Mode Integration (1 giorno)**
Integra shadow mode testing nell'intelligent router.

#### Step 3.1: Abilita shadow mode service

**File:** `apps/backend-rag/backend/app/main_cloud.py`

```python
# Add imports
from services.shadow_mode_service import initialize_shadow_mode, get_shadow_mode_service
from llm.zantara_client import ZantaraClient

# In startup_event(), after intelligent_router init:

# Initialize LLAMA client
llama_client = ZantaraClient()  # Uses RUNPOD_ENDPOINT from env
logger.info("✅ LLAMA 3.1 8B client ready (shadow mode)")

# Initialize shadow mode (10% traffic initially)
shadow_mode = initialize_shadow_mode(
    llama_client=llama_client,
    log_dir="./logs/shadow_mode",
    enabled=True,  # Or from env: SHADOW_MODE_ENABLED=true
    traffic_percent=10.0  # Start with 10% of traffic
)
```

#### Step 3.2: Hook into route_chat

**File:** `apps/backend-rag/backend/services/intelligent_router.py`

```python
async def route_chat(self, message: str, user_id: str, ...) -> Dict:
    # ... existing routing logic ...

    # Get Claude response (as usual)
    result = await self.sonnet.conversational(...)

    # Run LLAMA in shadow mode (non-blocking, background)
    shadow_mode = get_shadow_mode_service()
    if shadow_mode and shadow_mode.enabled:
        # Fire and forget - runs in background
        asyncio.create_task(
            shadow_mode.run_shadow_comparison(
                message=message,
                user_id=user_id,
                claude_response=result,
                conversation_history=conversation_history,
                memory_context=memory_context,
                category=category
            )
        )

    # Return Claude response to user (LLAMA runs in background)
    return result
```

**Key points:**
- ✅ User always receives Claude response
- ✅ LLAMA runs in parallel (non-blocking)
- ✅ Comparison logged to `logs/shadow_mode/shadow_comparison_{date}.jsonl`
- ✅ LLAMA errors never affect user

#### Step 3.3: Deploy to Railway
```bash
git add apps/backend-rag/backend/services/shadow_mode_service.py
git add apps/backend-rag/backend/app/main_cloud.py
git add apps/backend-rag/backend/services/intelligent_router.py

git commit -m "feat: add LLAMA shadow mode testing"
git push origin main
```

**Environment variables on Railway:**
```bash
SHADOW_MODE_ENABLED=true
RUNPOD_ENDPOINT=https://api.runpod.ai/v2/{YOUR_ENDPOINT}/runsync
RUNPOD_API_KEY={YOUR_RUNPOD_KEY}
```

---

### **PHASE 4: Data Collection (1-2 settimane)**
Raccogli dati comparativi LLAMA vs Claude in produzione.

#### Monitoring

**Daily checks:**
```bash
# Analyze today's shadow mode logs
python scripts/analyze_shadow_mode_logs.py --date $(date +%Y-%m-%d)
```

**Metriche da monitorare:**
- ✅ **Success rate:** Target >98%
- ✅ **Latency:** Target <800ms avg, <1500ms P95
- ✅ **Quality:** >70% risposte simili a Claude
- ✅ **Cost:** Validare €4/mese vs Claude usage

#### Weekly analysis
```bash
# Analyze full week
python scripts/analyze_shadow_mode_logs.py \
    --date-range 2025-10-21 2025-10-27 \
    --export-report ./reports/week1_analysis.html
```

**Targets dopo 1 settimana:**
- ✅ 500+ comparison logged
- ✅ Success rate stabilizzato >97%
- ✅ No blocking errors
- ✅ User satisfaction invariato (check support tickets)

**Targets dopo 2 settimane:**
- ✅ 1000+ comparison logged
- ✅ Analisi qualitativa manuale (random sample di 50 risposte)
- ✅ Cost savings confermati
- ✅ Decision point: GO/NO-GO per gradual rollout

---

### **PHASE 5: Decision & Rollout (1 settimana)**

#### Decision criteria

**GO for rollout if:**
1. ✅ Success rate >98% (last 7 days)
2. ✅ P95 latency <1500ms
3. ✅ Quality review: >80% risposte equivalenti/migliori
4. ✅ Cost savings >70%
5. ✅ No critical bugs

**NO-GO if:**
- ❌ Success rate <95%
- ❌ Frequent timeouts/errors
- ❌ Quality significantly worse than Claude
- ❌ User complaints increased

#### Gradual rollout (if GO)

**Week 1: 10% traffic**
```python
# In main_cloud.py:
intelligent_router = IntelligentRouter(
    llama_client=llama_client,  # ← ENABLE LLAMA
    haiku_service=claude_haiku,
    sonnet_service=claude_sonnet,
    ...
)

# In intelligent_router.py classify_intent():
# For 10% of greeting/casual queries, route to LLAMA
if category == "greeting" and random.random() < 0.10:
    return {"suggested_ai": "llama", ...}
```

**Monitor:** Error rate, latency, user feedback

**Week 2: 25% traffic** (if Week 1 stable)
**Week 3: 50% traffic** (if Week 2 stable)
**Week 4: 100% greetings/casual** (Claude kept for business queries)

---

## 🛡️ Risk Mitigation

### Risk 1: LLAMA quality worse than Claude
**Mitigation:**
- Shadow mode ensures no user impact during testing
- Manual quality review before rollout
- Gradual rollout allows quick rollback
- Keep Claude as fallback for business queries

### Risk 2: LLAMA high latency
**Mitigation:**
- RunPod vLLM optimized for low latency
- Monitor P95 latency closely
- Timeout set to 10s (fallback to Claude)
- Only route fast queries (greetings/casual) to LLAMA

### Risk 3: RunPod reliability issues
**Mitigation:**
- Dual endpoint setup (RunPod primary, HuggingFace fallback)
- Already implemented in zantara_client.py
- Circuit breaker pattern (auto-disable after 5 consecutive failures)

### Risk 4: Cost underestimated
**Mitigation:**
- RunPod flat rate (€3.78/mese) eliminates usage surprises
- Shadow mode validates cost model before commit
- Keep detailed cost tracking in analysis

---

## 📊 Success Metrics

### Technical metrics
- ✅ LLAMA success rate: >98%
- ✅ P95 latency: <1500ms
- ✅ Response quality: >80% equivalent to Claude
- ✅ Cost savings: >70% (€4 vs $25-55)

### Business metrics
- ✅ User satisfaction: No degradation (support tickets)
- ✅ Conversation completion rate: No drop
- ✅ Return user rate: No drop

### Cultural metrics ("Anima Indonesiana")
- ✅ Natural Indonesian responses (manual review)
- ✅ Cultural appropriateness (malu, kesepian, etc.)
- ✅ Warm, colleague-like tone
- ✅ No robotic responses

---

## 📁 Files Created

### Data collection:
- ✅ `scripts/extract_dataset_from_postgres.py` - Extract real conversations
- ✅ `scripts/prepare_llama_dataset.py` - Format for training (already existed, now updated)

### Shadow mode:
- ✅ `apps/backend-rag/backend/services/shadow_mode_service.py` - Shadow mode service
- ✅ Integration in `intelligent_router.py` (to be added)

### Analysis:
- ✅ `scripts/analyze_shadow_mode_logs.py` - Analyze comparison logs
- ✅ `docs/LLAMA_SHADOW_MODE_PLAN.md` - This document

---

## 🚀 Getting Started

### Quick start checklist:

#### Today (Day 1):
- [ ] Setup DATABASE_URL environment variable
- [ ] Run `extract_dataset_from_postgres.py --stats-only`
- [ ] Verify dataset size and quality

#### This week:
- [ ] Extract full dataset (if stats look good)
- [ ] Run `prepare_llama_dataset.py`
- [ ] Setup RunPod account + GPU instance

#### Next week:
- [ ] Fine-tune LLAMA on dataset
- [ ] Deploy to RunPod serverless
- [ ] Integrate shadow mode
- [ ] Deploy to Railway

#### Week 3-4:
- [ ] Collect shadow mode data
- [ ] Daily analysis and monitoring
- [ ] Manual quality review

#### Week 5:
- [ ] Decision: GO/NO-GO
- [ ] Gradual rollout (if GO)

---

## 💡 Pro Tips

1. **Start small:** 10% traffic in shadow mode, expand gradually
2. **Monitor closely:** Daily checks for first week
3. **Manual review:** Random sample 50 responses per week
4. **User feedback:** Watch support tickets for quality issues
5. **Quick rollback:** Keep Claude ready if LLAMA underperforms
6. **Cost tracking:** Monitor RunPod usage vs Claude bills
7. **Document learnings:** Update this doc with insights

---

## 📞 Support

**Questions or issues?**
- Shadow mode logs: `./logs/shadow_mode/`
- Analysis scripts: `python scripts/analyze_shadow_mode_logs.py --help`
- Railway logs: `railway logs -s backend-rag`
- RunPod dashboard: https://runpod.io/console

**Emergency rollback:**
```bash
# Disable shadow mode immediately
railway run -s backend-rag railway variables set SHADOW_MODE_ENABLED=false

# Or revert to pure Claude routing
railway run -s backend-rag railway variables set LLAMA_ENABLED=false
```

---

## 🎯 Final Goal

**Activate LLAMA 3.1 8B with confidence** knowing:
- ✅ Quality matches or exceeds Claude for casual queries
- ✅ Latency acceptable for user experience
- ✅ Cost savings (70-90%) validated
- ✅ "Anima indonesiana" truly embodied in responses
- ✅ Zero user complaints during rollout

**Timeline:** 4-6 settimane dal dataset extraction al full production.

**Alternativa:** Se shadow mode rivela problemi, stay with Claude e usa questi dati per iterare su LLAMA v3.

Pronto quando sei! 🚀
