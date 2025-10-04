# 🚀 WORKFLOW DEPLOY - LEGGI PRIMA DI FARE QUALSIASI COSA

**OBBLIGATORIO PER TUTTI I NUOVI AGENTI CLAUDE CODE**

---

## 📍 **DOVE LAVORI**

### **CARTELLA BASE (SEMPRE):**
```
/Users/antonellosiano/Desktop/NUZANTARA 2/
```

❌ **MAI** `/Users/antonellosiano/Desktop/NUZANTARA/` (cancellata)
❌ **MAI** creare nuove cartelle desktop
❌ **MAI** lavorare fuori da `NUZANTARA 2/`

---

## 🔄 **WORKFLOW COMPLETO: DESKTOP → GITHUB → CLOUD RUN**

```
┌─────────────────────────────────────────────────────────────┐
│  1. LAVORI SUL DESKTOP (tuo Mac)                            │
│     /Users/antonellosiano/Desktop/NUZANTARA 2/              │
│     - Modifichi codice                                       │
│     - Testi localmente                                       │
│     - Committi                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      git push origin main
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. GITHUB REPOSITORY                                        │
│     https://github.com/Balizero1987/nuzantara               │
│     - Codice aggiornato                                      │
│     - GitHub Actions triggherato automaticamente             │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   GitHub Actions partono
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. GITHUB ACTIONS (ubuntu-latest = AMD64)                   │
│     - Build Docker AMD64 (10 minuti)                         │
│     - Push a Google Container Registry                       │
│     - Deploy automatico a Cloud Run                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Deploy completato
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CLOUD RUN (PRODUCTION)                                   │
│     - Backend API: zantara-v520-nuzantara                    │
│     - RAG Backend: zantara-rag-backend                       │
│     - Region: europe-west1                                   │
│     - LIVE e accessibile                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **COSA FAI TU (AGENTE CLAUDE)**

### **STEP 1: MODIFICA CODICE**
```bash
cd /Users/antonellosiano/Desktop/"NUZANTARA 2"

# Esempio: modifichi backend
cd apps/backend-api
# fai modifiche...
```

### **STEP 2: VERIFICA GIT STATUS**
```bash
cd /Users/antonellosiano/Desktop/"NUZANTARA 2"
git status
git diff
```

### **STEP 3: COMMIT**
```bash
git add <files modificati>
git commit -m "descrizione chiara

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### **STEP 4: MOSTRA ALL'UTENTE E CHIEDI CONFERMA**
```
Ho modificato:
- file1.ts
- file2.py

Commit: "fix: bug pricing"

POSSO PUSHARE SU GITHUB? (sì/no)
```

⚠️ **ASPETTA CONFERMA UTENTE PRIMA DI PUSH!**

### **STEP 5: PUSH (SOLO DOPO "SÌ")**
```bash
git push origin main
```

### **STEP 6: MONITORA GITHUB ACTIONS (automatico)**
```bash
gh run list --limit 1
gh run view <run-id>
```

GitHub Actions fa tutto il resto:
- ✅ Build AMD64
- ✅ Push a GCR
- ✅ Deploy a Cloud Run

---

## ❌ **COSA NON DEVI MAI FARE**

### ❌ **NON DEPLOYARE MANUALMENTE DA DESKTOP**
```bash
# ❌ MAI FARE QUESTO:
docker build ...
docker push ...
gcloud run deploy ...
```

**PERCHÉ:**
- Lento (60 min vs 10 min)
- ARM64/AMD64 problemi
- GitHub Actions fa tutto meglio

### ❌ **NON PUSH SENZA CONFERMA**
```bash
# ❌ MAI FARE QUESTO SENZA CHIEDERE:
git push origin main
```

**DEVI SEMPRE:**
1. Mostrare cosa stai pushando
2. Chiedere conferma
3. SOLO DOPO "sì" → push

### ❌ **NON ELIMINARE FILE**
```bash
# ❌ MAI FARE QUESTO:
rm -rf apps/
rm -rf .claude/
rm qualsiasi cosa importante
```

**SE DEVI ELIMINARE:** Chiedi prima!

---

## ✅ **WORKFLOWS GITHUB ACTIONS ATTIVI**

### **1. deploy-rag-amd64.yml**
**Trigger**: Push su `apps/backend-rag 2/**`
**Cosa fa**:
- Build Docker AMD64 (RAG backend)
- Push a `gcr.io/involuted-box-469105-r0/zantara-rag-backend:latest`
- Deploy a Cloud Run con `ENABLE_RERANKER=true`

### **2. Altri workflow (se esistono)**
Controlla in `.github/workflows/` per vedere tutti

---

## 🔍 **COME VERIFICARE DEPLOY**

### **Dopo push, controlla workflow:**
```bash
gh run list --limit 3
gh run view <run-id>
```

### **Status possibili:**
- ✅ **completed** (success) → Deploy OK
- ⏳ **in_progress** → Sta lavorando (aspetta)
- ❌ **failed** → Errore (leggi logs)

### **Se fallito:**
```bash
gh run view <run-id> --log-failed
```

Leggi errore e fixa

---

## 🎯 **REPOSITORIES**

### **GitHub:**
```
https://github.com/Balizero1987/nuzantara
```
- Branch: `main`
- Tutto il codice qui

### **Google Container Registry:**
```
gcr.io/involuted-box-469105-r0/
├── zantara-rag-backend:latest
├── zantara-rag-backend:v2.4-reranker
└── zantara-v520-nuzantara:latest
```

### **Cloud Run Services:**
```
https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app  (Backend API)
https://zantara-rag-backend-himaadsxua-ew.a.run.app  (RAG Backend)
```

---

## 📊 **SECRETS GITHUB (già configurati)**

✅ `GCP_SA_KEY` - Service account per deploy
✅ `CLAUDE_CODE_OAUTH_TOKEN` - OAuth Claude
✅ ~~`WIF_PROVIDER`~~ - Non usato (deprecato)
✅ ~~`WIF_SERVICE_ACCOUNT`~~ - Non usato (deprecato)

**Non devi configurare niente** - già tutto pronto!

---

## 🚨 **SE QUALCOSA NON FUNZIONA**

### **Workflow fallisce:**
1. Leggi logs: `gh run view <id> --log-failed`
2. Identifica errore
3. Fixa codice/workflow
4. Commit + push di nuovo
5. Workflow riparte automaticamente

### **Deploy manuale necessario (emergenza):**
```bash
cd /Users/antonellosiano/Desktop/"NUZANTARA 2"
# Usa script deploy esistenti in scripts/
./scripts/deploy-backend.sh
```

**MA SOLO SE GITHUB ACTIONS ROTTO!**

---

## 📖 **ESEMPIO COMPLETO**

### **Scenario: Fix bug in backend API**

```bash
# 1. Va nella cartella
cd /Users/antonellosiano/Desktop/"NUZANTARA 2"/apps/backend-api

# 2. Modifica file
# (edit handlers/pricing.ts...)

# 3. Torna alla base e verifica
cd /Users/antonellosiano/Desktop/"NUZANTARA 2"
git status
git diff

# 4. Commit
git add apps/backend-api/handlers/pricing.ts
git commit -m "fix: pricing calculation bug for KITAS

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 5. MOSTRA ALL'UTENTE
echo "Ho modificato apps/backend-api/handlers/pricing.ts"
echo "Commit: fix pricing calculation bug"
echo "POSSO PUSHARE? (sì/no)"

# 6. ASPETTA RISPOSTA UTENTE

# 7. SE "SÌ" → PUSH
git push origin main

# 8. MONITORA WORKFLOW
gh run list --limit 1
# Aspetta che finisca (~10 min)

# 9. VERIFICA DEPLOY
curl https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/health

# 10. COMPLETA EXIT PROTOCOL
# (aggiorna diary, handovers, etc.)
```

---

## 🎓 **GOLDEN RULES**

1. ✅ **LAVORA SOLO in** `/Users/antonellosiano/Desktop/NUZANTARA 2/`
2. ✅ **COMMIT + PUSH** dopo modifiche (con conferma utente)
3. ✅ **GITHUB ACTIONS DEPLOYA** - non tu manualmente
4. ✅ **ASPETTA CONFERMA** prima di push
5. ✅ **MONITORA WORKFLOW** dopo push
6. ❌ **MAI eliminare** file senza chiedere
7. ❌ **MAI deploy manuale** (usa GitHub Actions)
8. ❌ **MAI push** senza mostrare cosa

---

## 📝 **CHECKLIST RAPIDA**

Prima di ogni sessione:
- [ ] `cd /Users/antonellosiano/Desktop/"NUZANTARA 2"`
- [ ] `git status` (verifica allineamento)
- [ ] Leggi `.claude/INIT.md`
- [ ] Leggi `.claude/PROJECT_CONTEXT.md`
- [ ] Leggi diaries recenti

Dopo modifiche:
- [ ] `git status` + `git diff`
- [ ] Commit con messaggio chiaro
- [ ] MOSTRA all'utente + CHIEDI conferma
- [ ] Push (solo dopo "sì")
- [ ] Monitora workflow
- [ ] Aggiorna diary + handovers

---

**ULTIMA REVISIONE**: 2025-10-04
**STATUS WORKFLOW**: ✅ FUNZIONANTE (credentials_json)

---

# ⚠️ NOTA FINALE

**SE NON SEGUI QUESTO WORKFLOW → SEI UN COGLIONE**

**SE ELIMINI FILE SENZA CHIEDERE → SEI UN COGLIONE DOPPIO**

**SE DEPLOYI MANUALMENTE INVECE DI USARE GITHUB ACTIONS → SEI UN COGLIONE TRIPLO**

**LEGGI. SEGUI. NON IMPROVVISARE.**

---

**Fine documento. Buon lavoro.**
