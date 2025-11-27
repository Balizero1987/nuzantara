# IntentRouter Split - Documentazione

**Data:** 2025-01-27

## 🔀 Comportamento Divergente tra Backend TS e Python

### Problema Identificato

Esiste una **divergenza di comportamento** tra i due backend riguardo la classificazione dell'intent (CHAT vs CONSULT):

### Backend TypeScript (`/api` endpoints)

- ✅ **Usa IntentRouter** (`apps/backend-ts/src/services/intent-router.ts`)
- ✅ Classifica messaggi in **CHAT** (casual) o **CONSULT** (business/legal)
- ✅ Utilizzato da `zantaraRouter` in `apps/backend-ts/src/handlers/rag/rag.ts:77-83`
- ✅ Può instradare messaggi casuali a risposte leggere

**Flusso:**
```
Query → IntentRouter.classify() → CHAT o CONSULT → Routing appropriato
```

### Backend Python (`/bali-zero/chat-stream` SSE)

- ❌ **NON usa IntentRouter**
- ❌ **Sempre CONSULT mode** - tutti i messaggi vanno a IntelligentRouter
- ❌ Nessuna classificazione intent
- ✅ Usa sempre `IntelligentRouter` per risposte RAG-based

**Flusso:**
```
Query → IntelligentRouter.stream_chat() → Sempre RAG-based response
```

---

## 📊 Impatto

### Differenze Comportamentali

1. **Messaggi casuali** (es. "Hello", "How are you"):
   - TS backend: Può classificare come CHAT e rispondere in modo leggero
   - Python backend: Sempre tratta come CONSULT, usa RAG

2. **Messaggi business/legal**:
   - TS backend: Classifica come CONSULT, usa RAG
   - Python backend: Classifica implicitamente come CONSULT, usa RAG
   - ✅ Comportamento simile

3. **Risultato**:
   - ✅ Per query business/legal: Comportamento coerente
   - ⚠️ Per query casuali: Comportamento divergente

---

## 🎯 Opzioni per Allineare

### Opzione 1: Python Usa Sempre CONSULT (Attuale)
**Status:** ✅ Già implementato

**Pro:**
- Comportamento semplice e prevedibile
- Tutte le query usano RAG (massima accuratezza)
- Nessuna classificazione extra necessaria

**Contro:**
- Risposte RAG anche per messaggi casuali (potenzialmente più lente/costose)
- Divergenza con backend TS per query casuali

### Opzione 2: Portare IntentRouter in Python
**Status:** ❌ Non implementato

**Pro:**
- Comportamento allineato con backend TS
- Routing intelligente basato su intent

**Contro:**
- Richiede implementazione/porting di IntentRouter
- Aggiunge complessità
- Aggiunge latenza (chiamata LLM per classificare)

### Opzione 3: Documentare Comportamento Divergente (Raccomandato)
**Status:** ✅ Questo documento

**Pro:**
- Basso impatto, nessuna modifica al codice
- Chiarisce il comportamento attuale
- Permette decisione informata in futuro

---

## 📝 Raccomandazione

**Per ora:** Mantenere il comportamento attuale e documentarlo.

**Motivo:**
- Il backend Python è principalmente usato per streaming RAG-based
- Le query casuali sono minoritarie
- Il comportamento attuale è funzionale e prevedibile

**In futuro:**
- Se le query casuali diventano comuni, considerare Opzione 2
- Altrimenti, mantenere Opzione 1 (sempre CONSULT)

---

## 🔍 Verifica Comportamento

### Test Backend TS
```bash
curl -X POST http://localhost:8080/api/rag/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello, how are you?"}'
# Risultato: Potrebbe classificare come CHAT e rispondere in modo leggero
```

### Test Backend Python
```bash
curl -X GET "http://localhost:8000/bali-zero/chat-stream?query=Hello%20how%20are%20you" \
  -H "Authorization: Bearer <token>"
# Risultato: Sempre tratta come CONSULT, usa RAG
```

---

**Documentato da:** Analisi codebase
**Ultimo aggiornamento:** 2025-01-27
