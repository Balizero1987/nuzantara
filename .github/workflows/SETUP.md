# 🚀 Quick Setup Guide - ZANTARA CI/CD

## ⚡ Setup Rapido (5 minuti)

### Step 1: Genera Fly.io Token

```bash
# Installa Fly.io CLI (se non già installato)
curl -L https://fly.io/install.sh | sh

# Login a Fly.io
flyctl auth login

# Genera token per deployment
flyctl tokens create deploy
# Copia il token generato
```

### Step 2: Configura GitHub Secrets

1. Vai su GitHub repository: `https://github.com/Balizero1987/nuzantara`
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Aggiungi:

   **Name**: `FLY_API_TOKEN`  
   **Secret**: [Incolla il token generato sopra]

5. Click "Add secret"

### Step 3: Verifica Setup

La pipeline verrà eseguita automaticamente al prossimo push su `main`.

Per testare subito:
1. Vai su Actions tab
2. Seleziona "🚀 ZANTARA CI/CD Pipeline"
3. Click "Run workflow"
4. Seleziona branch `main`
5. Checkbox "Deploy to production" = true
6. Click "Run workflow"

## ✅ Checklist Setup

- [ ] Fly.io CLI installato
- [ ] Fly.io account attivo
- [ ] App `nuzantara-core` creata su Fly.io
- [ ] Token Fly.io generato
- [ ] Secret `FLY_API_TOKEN` configurato su GitHub
- [ ] Repository connesso a Fly.io (`flyctl apps list`)

## 🔍 Verifica Configurazione

### Test Locale

```bash
# Verifica che Fly.io CLI funzioni
flyctl apps list

# Verifica che l'app esista
flyctl status --app nuzantara-core

# Test deploy locale (dry-run)
flyctl deploy --app nuzantara-core --dry-run
```

### Test GitHub Actions

1. Crea un branch di test
2. Fai una piccola modifica
3. Push su GitHub
4. Verifica che la pipeline parta
5. Controlla i log

## 🐛 Problemi Comuni

### "FLY_API_TOKEN not found"
→ Verifica che il secret sia configurato correttamente su GitHub

### "App not found"
→ Crea l'app su Fly.io: `flyctl apps create nuzantara-core`

### "Deployment failed"
→ Verifica i log Fly.io: `flyctl logs --app nuzantara-core`

### "Health check failed"
→ Verifica che `/health` endpoint risponda correttamente

## 📚 Risorse Utili

- [Fly.io Docs](https://fly.io/docs/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Pipeline README](./README.md)

---

**Pronto?** Push su `main` e la pipeline partirà automaticamente! 🚀

