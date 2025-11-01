# 🚀 Deploy Instructions - Phase 1: Tools Visibility

## Prerequisiti

Assicurati che GitHub abbia il secret `FLY_API_TOKEN` configurato:

1. Vai su: https://github.com/Balizero1987/nuzantara/settings/secrets/actions
2. Verifica che esista il secret `FLY_API_TOKEN`
3. Se non esiste, crealo:
   - Ottieni token da: https://fly.io/user/personal_access_tokens
   - Crea new token con permessi: `deploy`
   - Aggiungi come repository secret

---

## Opzione 1: Auto-Deploy via GitHub Actions ⚡ (Raccomandato)

### Step 1: Commit il workflow
```bash
git add .github/workflows/deploy-backend-rag.yml
git commit -m "ci: add auto-deploy workflow for backend-rag"
git push
```

### Step 2: Trigger il deploy

**Metodo A - Merge a main:**
```bash
# Crea PR su GitHub
# Merge PR a main
# → Auto-deploy si triggera automaticamente
```

**Metodo B - Trigger manuale:**
1. Vai su: https://github.com/Balizero1987/nuzantara/actions
2. Seleziona "Deploy Backend RAG to Fly.io"
3. Click "Run workflow"
4. Seleziona branch: `claude/zantara-tools-visibility-011CUgVW9yfSMMVidwnYQDMs`
5. Click "Run workflow"

---

## Opzione 2: Deploy Manuale Locale 🔧

### Prerequisiti
```bash
# Installa flyctl (se non già installato)
curl -L https://fly.io/install.sh | sh

# Login a Fly.io
flyctl auth login
```

### Deploy
```bash
cd apps/backend-rag
flyctl deploy --app nuzantara-rag
```

### Verifica
```bash
# Check status
flyctl status --app nuzantara-rag

# Check logs
flyctl logs --app nuzantara-rag

# Check health (se endpoint pubblico)
curl https://nuzantara-rag.fly.dev/health
```

---

## Verifica Post-Deploy

### 1. Test Backend
```bash
# Verifica che il backend accetti tools nel request
curl -X POST https://nuzantara-orchestrator.fly.dev/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "system.handlers.tools",
    "params": {}
  }'

# Expected: Lista di 164 tools in formato Anthropic
```

### 2. Test Frontend
1. Apri: https://zantara.balizero.com/chat.html
2. Apri DevTools Console
3. Verifica logs:
   ```
   ✅ [ToolManager] Loaded 164 tools
   🔧 [Chat] Passing X tools to Zantara
   ✅ [Chat] Tools used: get_pricing
   ```

### 3. Test End-to-End
1. Login alla webapp
2. Chiedi: "What's the price for KITAS?"
3. Verifica:
   - ✅ Console mostra tools caricati
   - ✅ Console mostra tools passati al backend
   - ✅ UI mostra badge "Get Pricing"
   - ✅ Risposta contiene prezzi ufficiali (no hallucination)

---

## Troubleshooting

### Error: FLY_API_TOKEN not found
- Configura il secret in GitHub (vedi Prerequisiti)

### Error: App not found
- Verifica app name: `flyctl apps list`
- App name dovrebbe essere: `nuzantara-rag`

### Error: Insufficient resources
- Check Fly.io dashboard: https://fly.io/dashboard/nuzantara-rag
- Verifica memory limits in fly.toml

### Tools non caricati nel frontend
- Verifica che backend-ts sia up: https://nuzantara-orchestrator.fly.dev/health
- Verifica endpoint: `curl https://nuzantara-orchestrator.fly.dev/call -X POST -d '{"key":"system.handlers.tools","params":{}}'`
- Check browser console per errori

---

## Webapp Deploy (Separato)

Le modifiche alla webapp sono in `apps/webapp/js/**`, ma il workflow Cloudflare Pages guarda `website/zantara webapp/**`.

### Opzioni:

**A) Copy manuale:**
```bash
cp -r apps/webapp/js/* website/zantara\ webapp/js/
cp -r apps/webapp/styles/* website/zantara\ webapp/styles/
git add website/zantara\ webapp/
git commit -m "webapp: sync Phase 1 tools visibility"
git push
# → Auto-deploy a Cloudflare Pages
```

**B) Symlink (una volta):**
```bash
# Attenzione: richiede privileged mode in Cloudflare
ln -s ../../apps/webapp/js website/zantara\ webapp/js
```

**C) Update workflow path:**
Modificare `.github/workflows/deploy-webapp-cloudflare.yml`:
```yaml
paths:
  - 'apps/webapp/**'  # invece di 'website/zantara webapp/**'
```

---

## Next Steps dopo Deploy

1. ✅ Verificare logs di produzione
2. ✅ Testare tools visibility end-to-end
3. ✅ Monitorare errori in Fly.io dashboard
4. 🚀 Procedere con Phase 2 (Memoria Persistente)
5. 🚀 Procedere con Phase 3 (RAG Search Client)

---

**Questions?**
- Fly.io Dashboard: https://fly.io/dashboard
- Logs: `flyctl logs --app nuzantara-rag`
- Status: `flyctl status --app nuzantara-rag`
