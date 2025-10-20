# 🤖 Setup AI Offline - Ollama + Sentence Transformers

**Status**: ✅ Completato e Testato
**Data**: 2025-10-20
**Costo**: $0 (Completamente GRATUITO)

---

## 🎉 Configurazione Completata

Il tuo sistema è ora configurato per funzionare **completamente offline** senza costi di API!

### ✅ Cosa è stato installato:

1. **Ollama 0.12.6** - LLM locale
2. **llama3.1:8b** - Modello AI (4.9 GB)
3. **Sentence Transformers** - Embeddings locali (già disponibile)

---

## 💬 Come Parlare con l'AI Offline

### **Metodo 1: Chat Interattiva** (Più semplice)

```bash
ollama run llama3.1:8b
```

Poi scrivi le tue domande:
```
>>> Ciao! Come stai?
Ciao! Sto bene, grazie per chiedere...

>>> exit  # Per uscire
```

---

### **Metodo 2: Chat da Terminale** (Veloce)

```bash
echo "La tua domanda qui" | ollama run llama3.1:8b
```

**Esempi**:
```bash
# Domanda semplice
echo "Cos'è l'intelligenza artificiale?" | ollama run llama3.1:8b

# Traduzione
echo "Traduci in italiano: Hello, how are you?" | ollama run llama3.1:8b

# Analisi codice
echo "Spiega questo codice: function add(a, b) { return a + b; }" | ollama run llama3.1:8b
```

---

### **Metodo 3: API REST** (Per integrazioni)

```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "Ciao! Come stai?",
    "stream": false
  }'
```

**Streaming (risposta in tempo reale)**:
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "Raccontami una storia breve",
    "stream": true
  }'
```

---

## 🔧 Gestione Ollama

### Avvio/Stop del Servizio

```bash
# Avvio automatico (in background)
brew services start ollama

# Stop del servizio
brew services stop ollama

# Restart
brew services restart ollama

# Status
brew services list | grep ollama
```

### Gestione Modelli

```bash
# Lista modelli installati
ollama list

# Scarica un nuovo modello
ollama pull qwen2.5:7b          # Ottimo per coding
ollama pull mistral:7b          # General purpose
ollama pull llama3.2:3b         # Più leggero (3B parametri)

# Rimuovi un modello
ollama rm llama3.1:8b

# Info su un modello
ollama show llama3.1:8b
```

---

## 🚀 Test Rapido

Esegui lo script di test completo:

```bash
./scripts/test-offline-ai.sh
```

Questo script verifica:
- ✅ Ollama installato e funzionante
- ✅ Modelli disponibili
- ✅ Chat funzionante
- ✅ Sentence Transformers (embeddings)
- ✅ API REST funzionante

---

## 📊 Modelli Disponibili da Scaricare

| Modello | Dimensione | RAM Richiesta | Uso Consigliato |
|---------|------------|---------------|------------------|
| **llama3.1:8b** ✅ | 4.9 GB | 8+ GB | General purpose (già installato) |
| llama3.2:3b | 2.0 GB | 4+ GB | Più veloce, meno potente |
| qwen2.5:7b | 4.7 GB | 8+ GB | **Ottimo per coding** |
| mistral:7b | 4.1 GB | 8+ GB | Buon bilanciamento |
| phi4:14b | 9.1 GB | 16+ GB | Qualità superiore |
| llama3.1:70b | 40 GB | 64+ GB | Massima qualità (richiede GPU potente) |

**Installa un modello**:
```bash
ollama pull qwen2.5:7b  # Esempio: scarica Qwen per coding
```

---

## 🎯 Casi d'Uso Comuni

### 1. **Assistente per Coding**
```bash
cat > domanda.txt << 'EOF'
Scrivi una funzione Python che calcola il fattoriale di un numero in modo ricorsivo.
Includi docstring e gestione errori.
EOF

cat domanda.txt | ollama run llama3.1:8b
```

### 2. **Traduzione**
```bash
echo "Traduci in inglese: Ciao, come stai oggi?" | ollama run llama3.1:8b
```

### 3. **Analisi Testo**
```bash
cat documento.txt | ollama run llama3.1:8b "Riassumi questo testo in 3 punti chiave"
```

### 4. **Spiegazione Concetti**
```bash
echo "Spiegami in modo semplice cos'è una blockchain" | ollama run llama3.1:8b
```

---

## 🔌 Integrazione con il Progetto NUZANTARA

Il backend è già configurato per usare Ollama:

**File**: `apps/backend-rag/backend/app/main.py`

```python
# Config attuale (linee 71-72)
OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1:8b"
```

### Test Integrazione

```bash
# Avvia il backend RAG
cd apps/backend-rag
source venv/bin/activate
uvicorn backend.app.main:app --reload

# Testa endpoint (in altra finestra)
curl -X POST http://localhost:8000/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Ciao! Come funziona ZANTARA?",
    "mode": "santai",
    "user_email": "test@example.com"
  }'
```

---

## 💰 Confronto Costi

| Provider | Costo | Velocità | Privacy | Offline |
|----------|-------|----------|---------|---------|
| **Ollama (locale)** ✅ | **$0/sempre** | Buona* | ✅ Totale | ✅ Sì |
| Claude Sonnet 4 | $3-15/1M tokens | Ottima | ❌ Cloud | ❌ No |
| GPT-4o | $5-20/1M tokens | Ottima | ❌ Cloud | ❌ No |
| Gemini Flash | $0.10-0.40/1M tokens | Ottima | ❌ Cloud | ❌ No |

*Dipende dall'hardware (GPU/CPU)

---

## ⚙️ Ottimizzazione Performance

### 1. **Usa GPU** (se disponibile)
Ollama usa automaticamente la GPU se disponibile (Metal su Mac, CUDA su Linux).

Verifica:
```bash
ollama run llama3.1:8b --verbose
# Cerca "using metal" o "using cuda"
```

### 2. **Regola Parametri**
```bash
ollama run llama3.1:8b \
  --num-predict 100 \    # Max token generati
  --temperature 0.7 \    # Creatività (0-1)
  --top-k 40 \          # Top K sampling
  --top-p 0.9           # Nucleus sampling
```

### 3. **Modello più Veloce**
Se llama3.1:8b è troppo lento:
```bash
ollama pull llama3.2:3b  # Più veloce, 2GB invece di 4.9GB
ollama run llama3.2:3b
```

---

## 🐛 Troubleshooting

### Ollama non risponde
```bash
# Verifica servizio
brew services list | grep ollama

# Restart
brew services restart ollama

# Oppure manualmente
pkill ollama
ollama serve
```

### Modello troppo lento
- **Soluzione 1**: Usa modello più piccolo (llama3.2:3b)
- **Soluzione 2**: Chiudi altri programmi (libera RAM)
- **Soluzione 3**: Riduci lunghezza risposta con `--num-predict 50`

### Errore "model not found"
```bash
# Scarica il modello mancante
ollama pull llama3.1:8b
```

### Out of memory
- Chiudi app pesanti (browser, IDE, ecc.)
- Usa modello più piccolo (llama3.2:3b invece di llama3.1:8b)

---

## 📚 Risorse

- **Ollama Docs**: https://github.com/ollama/ollama
- **Modelli Disponibili**: https://ollama.com/library
- **API Reference**: https://github.com/ollama/ollama/blob/main/docs/api.md
- **Sentence Transformers**: https://www.sbert.net/

---

## ✅ Riepilogo Comandi Essenziali

```bash
# Chat interattiva
ollama run llama3.1:8b

# Chat veloce
echo "Domanda?" | ollama run llama3.1:8b

# Lista modelli
ollama list

# Scarica nuovo modello
ollama pull qwen2.5:7b

# Test completo
./scripts/test-offline-ai.sh

# Gestione servizio
brew services start|stop|restart ollama
```

---

## 🎉 Pronto all'Uso!

Il tuo sistema AI offline è completamente configurato e funzionante.

**Costo totale**: $0
**Privacy**: 100% locale
**Dipendenze internet**: Nessuna (dopo setup iniziale)

Inizia subito:
```bash
ollama run llama3.1:8b
```

Buon divertimento! 🚀
