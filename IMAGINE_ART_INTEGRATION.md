# 🎨 Imagine.art Integration - NUZANTARA v5.2.0

Integrazione completa dell'API Imagine.art per la generazione di immagini AI nel sistema NUZANTARA.

## 📦 Componenti Creati

### 1. Types (`src/types/imagine-art-types.ts`)
Definizioni TypeScript per:
- Request/Response types
- Style enumerations
- Aspect ratio options
- Service configuration

### 2. Service (`src/services/imagine-art-service.ts`)
Client API per comunicare con Imagine.art:
- `generateImage()` - Text-to-image generation
- `upscaleImage()` - Image enhancement
- `testConnection()` - Health check

### 3. Handlers (`src/handlers/ai-services/imagine-art-handler.ts`)
Business logic handlers:
- `aiImageGenerate` - Generate images from text
- `aiImageUpscale` - Upscale/enhance images
- `aiImageTest` - Test API connection

### 4. Registry Integration
Handlers registrati automaticamente in `src/handlers/ai-services/registry.ts`:
- `ai.image.generate` - Generate images
- `ai.image.upscale` - Upscale images
- `ai.image.test` - Test connection

---

## 🚀 Come Usare

### Da Frontend (Webapp)

```javascript
// Generate image
const response = await fetch('https://zantara.balizero.com/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    key: 'ai.image.generate',
    params: {
      prompt: 'Beautiful Indonesian woman in traditional kebaya, Bali temple, professional photo',
      style: 'realistic', // 'realistic', 'anime', 'flux-schnell', etc.
      aspect_ratio: '16:9', // '1:1', '16:9', '9:16', '4:3', etc.
      seed: 42, // Optional: for reproducibility
      negative_prompt: 'blurry, low quality', // Optional
      high_res_results: 1 // 0 or 1
    }
  })
});

const data = await response.json();
console.log('Image URL:', data.data.image_url);
```

### Da cURL (Locale)

```bash
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai.image.generate",
    "params": {
      "prompt": "Indonesian landscape with rice terraces at sunset",
      "style": "realistic",
      "aspect_ratio": "16:9"
    }
  }'
```

### Da cURL (Produzione Railway)

```bash
curl -X POST https://zantara.balizero.com/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-production-key" \
  -d '{
    "key": "ai.image.generate",
    "params": {
      "prompt": "Indonesian landscape with rice terraces at sunset",
      "style": "realistic",
      "aspect_ratio": "16:9"
    }
  }'
```

### Upscale Image

```bash
curl -X POST https://zantara.balizero.com/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-production-key" \
  -d '{
    "key": "ai.image.upscale",
    "params": {
      "image": "https://your-image-url.jpg"
    }
  }'
```

---

## 🎨 Parametri Disponibili

### `ai.image.generate`

| Parametro | Tipo | Required | Default | Descrizione |
|-----------|------|----------|---------|-------------|
| `prompt` | string | ✅ | - | Descrizione dell'immagine da generare |
| `style` | string | ❌ | `realistic` | Stile artistico: `realistic`, `anime`, `flux-schnell`, `sdxl-1.0`, ecc |
| `aspect_ratio` | string | ❌ | `16:9` | Rapporto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `21:9` |
| `seed` | number | ❌ | random | Per riproducibilità (stesso seed = stessa immagine) |
| `negative_prompt` | string | ❌ | - | Cosa evitare nell'immagine |
| `high_res_results` | number | ❌ | 1 | 0 o 1, per alta risoluzione |

### `ai.image.upscale`

| Parametro | Tipo | Required | Descrizione |
|-----------|------|----------|-------------|
| `image` | string | ✅ | URL o path dell'immagine da migliorare |

### `ai.image.test`

Nessun parametro richiesto. Testa la connessione all'API Imagine.art.

---

## 📝 Response Format

### Success Response

```json
{
  "ok": true,
  "data": {
    "image_url": "https://cdn.imagine.art/generated/abc123.jpg",
    "request_id": "req_xyz789",
    "prompt": "Your original prompt",
    "style": "realistic",
    "aspect_ratio": "16:9",
    "metadata": {
      "provider": "Imagine.art",
      "timestamp": "2025-10-16T12:00:00.000Z",
      "seed": 42
    }
  }
}
```

### Error Response

```json
{
  "ok": false,
  "error": "Error message description"
}
```

---

## 🔐 Configurazione

### Environment Variables

Aggiungi al file `.env` (development):

```bash
IMAGINEART_API_KEY=vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp
```

### Production Deployment (Railway)

Per deployare in produzione su Railway:

```bash
# 1. Aggiungi variable su Railway Dashboard
# Vai su: https://railway.app/project/your-project/settings
# Variables > New Variable:
# IMAGINEART_API_KEY=vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp

# 2. Oppure usa railway CLI
railway variables set IMAGINEART_API_KEY=vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp

# 3. Redeploy il servizio
railway up
```

---

## 🧪 Testing

### Test Handler Manuale

```bash
# 1. Start backend locale
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY
npm run dev

# 2. Test connection
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai.image.test"
  }'

# 3. Generate test image
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai.image.generate",
    "params": {
      "prompt": "Test image generation - Indonesian temple",
      "style": "realistic",
      "aspect_ratio": "1:1"
    }
  }'
```

### Test in Produzione

```bash
# Test su Railway production
curl -X POST https://zantara.balizero.com/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-production-key" \
  -d '{
    "key": "ai.image.test"
  }'
```

---

## 💰 Costi & Limiti

### Imagine.art Pricing
- **Standard Plan:** $9/mese (~300-500 immagini)
- **Professional Plan:** $50/mese (~2000-3000 immagini)
- **Premium Plan:** $250/mese (~10000+ immagini)

### Rate Limiting
- Timeout API: 60 secondi
- Generazione immagine: ~2-5 secondi
- Upscale: ~3-8 secondi

---

## 🎯 Use Cases

### 1. Avatar Generation per Zantara
```javascript
{
  "prompt": "Professional Indonesian businesswoman avatar, friendly smile, traditional batik elements, modern professional attire, corporate headshot style",
  "style": "realistic",
  "aspect_ratio": "1:1"
}
```

### 2. Marketing Materials
```javascript
{
  "prompt": "Bali Zero office illustration, modern workspace with traditional Balinese elements, professional team collaboration, vibrant colors",
  "style": "realistic",
  "aspect_ratio": "16:9"
}
```

### 3. Social Media Content
```javascript
{
  "prompt": "Instagram story template for Bali Zero visa services, modern design, Indonesian cultural motifs, professional branding",
  "style": "realistic",
  "aspect_ratio": "9:16"
}
```

---

## 📊 Monitoring & Logs

Gli handlers loggano automaticamente:
- Request ricevute
- Parametri utilizzati
- Tempo di generazione
- Errori eventuali

Controlla i logs con:

```bash
# Local development
npm run dev

# Production Railway logs
railway logs

# Or via Railway dashboard
# https://railway.app/project/your-project/deployments
```

---

## 🐛 Troubleshooting

### Errore: "IMAGINEART_API_KEY not configured"
→ Verifica che `IMAGINEART_API_KEY` sia configurato su Railway

### Errore: "Image generation failed"
→ Controlla che la API key sia valida su imagine.art

### Timeout
→ Alcuni prompt complessi richiedono più tempo, aumenta timeout se necessario

### Image URL non accessibile
→ Le URL di Imagine.art potrebbero scadere dopo qualche ora, salva le immagini localmente se necessario

---

## 🔗 Links Utili

- **Imagine.art Dashboard:** https://platform.imagine.art/
- **API Documentation:** https://docs.imagine.art/
- **API Reference:** https://reference.imagine.art/
- **Pricing:** https://www.imagine.art/pricing
- **Railway Dashboard:** https://railway.app/

---

## ✅ Checklist Integration

- [x] Types TypeScript creati
- [x] Service implementato
- [x] Handlers registrati
- [x] Registry aggiornato
- [x] .env.example aggiornato
- [x] Documentazione completa
- [ ] Test su Railway production
- [ ] Deploy su Railway production

---

## 📞 Support

Per problemi o domande:
- Email: info@balizero.com
- WhatsApp: +62 859 0436 9574

---

**Data Creazione:** 2025-10-16
**Versione:** 1.0.0
**Progetto:** NUZANTARA-RAILWAY (Railway deployment)
**Autore:** Claude + Antonello
**Status:** ✅ Ready for Testing
