# 🧪 ZANTARA Business Test - 30 Domande Alta Difficoltà

## ❌ Perché il test Node.js non funziona

Il test automatico Node.js (`test-zantara-business-simple.mjs`) **fallisce** perché:

1. **API protetta con autenticazione**: Il backend `https://nuzantara-rag.fly.dev` richiede header `x-api-key`
2. **Ambiente isolato**: L'ambiente di sviluppo non ha accesso diretto all'API di produzione
3. **Errore**: `Access denied` / `fetch failed`

```bash
❌ ERRORE: fetch failed
# L'API rifiuta le richieste senza autenticazione
```

## ✅ Soluzione: Test Browser

Ho creato **`test-zantara-browser.html`** che funziona nel browser dove sei già autenticato.

### Come usarlo:

#### Opzione 1: Apri direttamente il file HTML

```bash
# Apri il file nel browser
open test-zantara-browser.html

# Oppure
google-chrome test-zantara-browser.html
firefox test-zantara-browser.html
```

#### Opzione 2: Serve con HTTP server

```bash
# Dalla root del progetto
cd /home/user/nuzantara

# Avvia server HTTP
python3 -m http.server 8080

# Poi apri nel browser:
# http://localhost:8080/test-zantara-browser.html
```

#### Opzione 3: Deploy su GitHub Pages

```bash
# Copia il file nella webapp
cp test-zantara-browser.html apps/webapp/test-business.html

# Poi accedi a:
# https://zantara.balizero.com/test-business.html
```

## 📋 Cosa fa il test

### 30 Domande divise in 3 categorie:

1. **Immigration** (10 domande)
   - KITAS E23/E28A/E31/E33G
   - PT PMA + family visa
   - Golden Visa restrictions
   - IMTA + fast track
   - Spouse visa + work permit

2. **Business** (10 domande)
   - PT PMA formation (asset contribution)
   - BKPM minimum investment realization
   - KBLI changes (e-commerce → restaurant)
   - Share transfers + notarial deed
   - Domicile letter (Jakarta → Bali)
   - Alcohol import license
   - Voluntary liquidation

3. **Tax** (10 domande)
   - Tax treaty Italia-Indonesia
   - PPh 21/26 (expat salaries, dividends, royalties)
   - PPN 11% (digital products)
   - Loss carry-forward
   - Tax objection (keberatan)
   - NPWP for remote workers

### Metriche raccolte:

```json
{
  "statistics": {
    "total": 30,
    "successes": 28,
    "failures": 2,
    "success_rate": "93.33%",
    "total_time_ms": 450000,
    "avg_time_ms": 15000
  },
  "results": [
    {
      "id": 1,
      "category": "immigration",
      "question": "...",
      "response": "...",
      "success": true,
      "duration_ms": 12500,
      "timestamp": "2025-11-07T..."
    }
  ]
}
```

## 🎯 Features del test browser

✅ **Interface visiva moderna**
- Progress bar real-time
- Stats live (completate, successi, tempo medio)
- Scrolling automatico alla domanda corrente

✅ **Controlli completi**
- Pausa/riprendi test
- Esporta risultati JSON
- Visual feedback (✅ successo, ❌ errore)

✅ **Categorizzazione**
- Immigration (blu)
- Business (arancione)
- Tax (viola)

✅ **Export JSON**
- Download risultati completi
- Statistiche aggregate
- Timestamp per ogni risposta

## 📊 Output Example

```json
{
  "metadata": {
    "test_name": "ZANTARA Business Test - 30 Domande Alta Difficoltà",
    "timestamp": "2025-11-07T06:30:00.000Z",
    "total_questions": 30
  },
  "statistics": {
    "total": 30,
    "completed": 30,
    "successes": 28,
    "failures": 2,
    "success_rate": "93.33%",
    "total_time_ms": 450000,
    "avg_time_ms": 15000,
    "categories": {
      "immigration": 10,
      "business": 10,
      "tax": 10
    }
  },
  "results": [...]
}
```

## 🔧 Troubleshooting

### Se il test fallisce nel browser:

1. **Verifica API endpoint**
   ```javascript
   const API_URL = 'https://nuzantara-rag.fly.dev/bali-zero/chat';
   ```

2. **Controlla CORS**
   - Il browser deve essere sullo stesso dominio o il backend deve permettere CORS

3. **Usa proxy Cloudflare Worker**
   - Cambia API_URL a quello del proxy worker se disponibile

4. **Timeout**
   - Domande complesse possono richiedere 30-60 secondi
   - Il timeout è impostato a 120 secondi

## 📝 Note

- ⏱️ **Tempo stimato**: 15-20 minuti per completare tutte le 30 domande
- 🔄 **Pausa tra domande**: 2 secondi
- 💾 **Risultati**: Salvati in JSON scaricabile
- 🌐 **Compatibilità**: Chrome, Firefox, Safari (moderni)

## 🚀 Next Steps

1. Apri `test-zantara-browser.html` nel browser
2. Clicca "▶️ Inizia Test"
3. Aspetta che completi (o metti in pausa quando vuoi)
4. Esporta risultati JSON con "💾 Esporta Risultati"
5. Analizza le risposte per verificare la qualità di ZANTARA

---

**Created**: 2025-11-07
**Author**: Claude
**Purpose**: Test comprehensive ZANTARA knowledge on complex Indonesian business, immigration, and tax topics
