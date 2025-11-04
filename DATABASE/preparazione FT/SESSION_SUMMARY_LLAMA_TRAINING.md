# 🎯 SESSION SUMMARY - LLAMA 3.1 8B FINE-TUNING STRATEGY

**Date**: 2025-10-11  
**Session**: Llama Training Planning + Dataset Strategy

---

## 🔑 KEY DECISIONS:

### 1. **CONTEXT WINDOW: 8K**
- ✅ Dataset attuale: max 2.4K tokens (coperto 100%)
- ✅ Use cases Nuzantara: 8-12K tipico (multi-doc, team)
- ✅ Training @ 8K = buon compromesso
- ✅ Production: usa 128K nativo + RAG
- ⏱️ Training time: 10-12h
- 💰 Cost: $16-20

**Rejected alternatives:**
- ❌ 4K: Troppo stretto per multi-doc consulting
- ❌ 16K: Dataset troppo corto, spreco GPU, serve augmentation

---

### 2. **DATASET STRATEGY: Dual-Layer**

#### **TRAINING DATASET** (Llama fine-tuning):
- ✅ **Estratti + Interpretazione** (consulente-style)
- ✅ 500-1500 tokens per esempio
- ✅ Conversational, actionable
- ✅ NO leggi intere (troppo lunghe)

#### **RAG BACKEND** (ChromaDB):
- ✅ **Leggi INTERE** indicizzate
- ✅ Chunking 1024 tokens
- ✅ Retrieval preciso per citazioni

**Flow:**
```
User query → Llama (trained response) + RAG (leggi intere) → Integrated answer
```

---

### 3. **DATASET AUGMENTATION PLAN:**

#### **Problema identificato:**
- ❌ **B211 obsoleto** (non esiste da 3 anni!)
- ⚠️ Info potenzialmente obsolete nel dataset
- ⚠️ Coverage gaps: Tax (0.6%), PT PMA (0.7%), HR (0%), Team (0.3%)

#### **Categorie da espandere:**
1. **Tax & Compliance** (+1,000 esempi)
2. **PT PMA Formation** (+800 esempi)
3. **HR & Employment** (+800 esempi)
4. **Business Intelligence** (+800 esempi)
5. **Team Collaboration** (+400 esempi)
6. **Real Estate** (+400 esempi)
7. **Banking & Finance** (+400 esempi)
8. **Sector-specific** (+400 esempi)
9. **Multi-turn synthetic** (+2,000 esempi)

**Target**: 20,903 → 28,000-30,000 esempi

---

### 4. **GENERATION STRATEGY: Parallel Task Agents**

#### **5 Specialized Agents in Parallel:**

```
Agent 1: Tax & Compliance (1,000 Q&A)
Agent 2: PT PMA & Company (800 Q&A)
Agent 3: HR & Employment (800 Q&A)
Agent 4: Immigration & Visa (500 Q&A, verify 2025!)
Agent 5: Business Intelligence (800 Q&A)
```

**Benefits:**
- ✅ Parallel execution (5x faster)
- ✅ Specialization per area
- ✅ RAG integration (query existing KB)
- ✅ Quality validation per agent
- ⏱️ 20h serial → 4-6h parallel

---

## 📊 NUZANTARA ARCHITECTURE (refreshed):

### **Core Use Cases:**
1. Legal/Business consulting (visa, tax, PT PMA, KBLI)
2. Google Workspace integration (150+ handlers)
3. Team collaboration (ZANTARA AI)
4. RAG Knowledge Base:
   - Operational: 1,458 docs
   - Philosophical: 12,907 docs

### **Memory System:**
- **Firestore**: Persistent memory (unlimited facts)
- **Vector DB**: Semantic search
- **RAG**: Long-document retrieval

### **Context Requirements:**
- Simple query: 4K
- Multi-doc (2): 8K
- Multi-doc (3): 12K
- Team complex: 16K
- **→ 8K training = 80% coverage, RAG = 100%**

---

## ⏱️ TIMELINE & COST:

### **Phase 1: Dataset Validation & Cleanup** (CRITICAL!)
- ⚠️ Identify obsolete info (B211, old laws)
- ⚠️ Verify against 2025 regulations
- ⚠️ Remove/update incorrect content
- **Time**: 4-6 hours
- **Cost**: Manual review

### **Phase 2: Dataset Augmentation**
- Generate 7,000-9,000 new examples
- 5 parallel Task agents
- **Time**: 4-6 hours (parallel)
- **Cost**: API calls ~$5

### **Phase 3: Training @ 8K**
- Llama 3.1 8B Instruct
- LoRA rank 128
- 3 epochs, ~28K examples
- **Time**: 12-14 hours
- **Cost**: $20-24 (A100)

### **Phase 4: RAG Integration**
- Index full laws in ChromaDB
- Test integration
- **Time**: 2-3 hours
- **Cost**: Included

**TOTAL**: 22-29 hours, $25-30

---

## 🚨 CRITICAL NEXT STEPS:

1. ⚠️ **VERIFY DATASET** for obsolete laws (B211!)
2. ⚠️ **Source validation** against 2025 regulations
3. ✅ Launch parallel agents for augmentation
4. ✅ Train @ 8K with cleaned dataset
5. ✅ Index full laws in ChromaDB

---

## 🎯 SUCCESS CRITERIA:

- ✅ Dataset free of obsolete information
- ✅ 28K-30K balanced examples
- ✅ Coverage: Tax, PT PMA, HR, BI (5%+ each)
- ✅ Multi-turn 30%+ for long context
- ✅ Training @ 8K successful
- ✅ RAG integration working
- ✅ Production-ready quality

---

## 📝 OPEN QUESTIONS:

1. Current visa codes 2025? (B211 obsoleto)
2. Source of current dataset? (to identify other obsolete info)
3. Validation process for legal accuracy?
4. Timeline pressure? (can we take 3 days for quality?)

---

**Status**: Planning complete, ready for Phase 1 (validation)  
**Next session**: Dataset cleanup + agent launch

---

*Generated: 2025-10-11*
*Context: Llama 3.1 8B fine-tuning for Nuzantara*
