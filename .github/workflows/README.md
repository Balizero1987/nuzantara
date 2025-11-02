# 🚀 ZANTARA CI/CD Pipeline Documentation

## 📋 Overview

Questa pipeline CI/CD automatizza il processo di build, test e deployment per ZANTARA su Fly.io.

## 🔧 Pipeline Steps

1. **🔍 Lint & Code Quality** - Esegue ESLint per verificare la qualità del codice
2. **📝 TypeScript Type Check** - Verifica che il codice TypeScript sia corretto
3. **🔒 Security Audit** - Scansiona le dipendenze per vulnerabilità
4. **🧪 Test** - Esegue la suite di test completa con coverage
5. **🏗️ Build** - Compila il codice TypeScript
6. **🐳 Docker Build** - Crea l'immagine Docker per deployment
7. **🚀 Deploy** - Deploy automatico su Fly.io (solo main branch)

## 🔑 Required GitHub Secrets

Per far funzionare la pipeline, devi configurare i seguenti secrets in GitHub:

### Obbligatori per Deployment

#### `FLY_API_TOKEN`
- **Descrizione**: Token API di Fly.io per autenticazione
- **Come ottenerlo**:
  ```bash
  # Installa Fly.io CLI
  curl -L https://fly.io/install.sh | sh
  
  # Login
  flyctl auth login
  
  # Genera token
  flyctl tokens create deploy
  ```
- **Dove configurarlo**: GitHub → Settings → Secrets and variables → Actions → New repository secret

### Opzionali (per notifiche e integrazioni avanzate)

#### `CODECOV_TOKEN` (Opzionale)
- **Descrizione**: Token per Codecov per upload coverage reports
- **Come ottenerlo**: https://codecov.io → Repository Settings → Upload Tokens

#### `SLACK_WEBHOOK_URL` (Opzionale)
- **Descrizione**: URL webhook di Slack per notifiche deployment
- **Come ottenerlo**: Slack → Apps → Incoming Webhooks

#### `DISCORD_WEBHOOK_URL` (Opzionale)
- **Descrizione**: URL webhook di Discord per notifiche deployment
- **Come ottenerlo**: Discord → Server Settings → Integrations → Webhooks

## 📦 Environment Variables

La pipeline usa le seguenti variabili d'ambiente (configurate automaticamente):

- `NODE_VERSION`: `18.x`
- `REGISTRY`: `ghcr.io` (GitHub Container Registry)
- `FLY_APP`: `nuzantara-core`

## 🎯 Trigger Events

La pipeline viene attivata su:

1. **Push su `main` o `develop`** - Esegue tutti i check + deploy (solo main)
2. **Pull Request su `main` o `develop`** - Esegue solo check (no deploy)
3. **Manual dispatch** - Puoi triggerare manualmente con opzione deploy

## 🚀 Deployment Strategy

### Automatic Deployment
- **Branch**: `main`
- **Trigger**: Push su `main`
- **Target**: Fly.io production (`nuzantara-core`)

### Manual Deployment
1. Vai su GitHub Actions
2. Seleziona "🚀 ZANTARA CI/CD Pipeline"
3. Click su "Run workflow"
4. Seleziona branch e flag "Deploy to production"
5. Click "Run workflow"

## 📊 Test Coverage

La pipeline genera report di coverage che vengono:
- Uploadati su Codecov (se configurato)
- Commentati su Pull Request
- Salvati come artifact

## 🔍 Monitoring & Health Checks

Dopo ogni deployment:
1. Attende 30 secondi per stabilizzazione
2. Esegue health check su `/health` endpoint
3. Retry fino a 10 volte (circa 100 secondi totali)
4. Notifica successo/fallimento

## 🛠️ Local Testing

Per testare la pipeline localmente prima del push:

```bash
# Install act (GitHub Actions locally)
brew install act  # macOS
# o: https://github.com/nektos/act

# Run pipeline locally
act push

# Run specific job
act -j test

# Run with secrets
act push --secret FLY_API_TOKEN=your_token_here
```

## 🐛 Troubleshooting

### Deployment Failed
1. Verifica che `FLY_API_TOKEN` sia configurato correttamente
2. Controlla che l'app `nuzantara-core` esista su Fly.io
3. Verifica i log su Fly.io: `flyctl logs --app nuzantara-core`

### Tests Failing
1. Esegui localmente: `npm test`
2. Verifica che tutte le dipendenze siano installate: `npm ci`
3. Controlla coverage threshold nel `package.json`

### Build Failed
1. Verifica TypeScript: `npm run typecheck`
2. Controlla build locale: `npm run build`
3. Verifica che `dist/server.js` sia generato

### Docker Build Failed
1. Verifica Dockerfile: `apps/backend-ts/Dockerfile`
2. Testa build locale: `docker build -t test ./apps/backend-ts`
3. Controlla GitHub Container Registry permissions

## 📝 Best Practices

1. **Sempre fare PR** prima di pushare su `main`
2. **Verificare test localmente** prima del push
3. **Review code coverage** prima di merge
4. **Monitor deployment** dopo push su `main`
5. **Verificare health check** dopo deployment

## 🔗 Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Fly.io Documentation](https://fly.io/docs/)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Codecov Action](https://github.com/codecov/codecov-action)

## 📞 Support

Per problemi o domande:
1. Controlla i log GitHub Actions
2. Verifica Fly.io dashboard
3. Contatta il team DevOps

---

**Ultima aggiornamento**: 2025-01-27
**Versione Pipeline**: 1.0.0

