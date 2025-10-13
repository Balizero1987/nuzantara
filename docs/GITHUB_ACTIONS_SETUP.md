# 🚀 GitHub Actions Setup - Intel Automation

## ⚠️ Importante: Self-Hosted Runner Richiesto

Poiché il sistema usa **Ollama locale** (LLAMA 3.2), devi configurare un **self-hosted runner** sul tuo Mac.

---

## 📋 Setup Completo

### 1. Configura Self-Hosted Runner

1. **Vai su GitHub**:
   ```
   Repository → Settings → Actions → Runners → New self-hosted runner
   ```

2. **Scegli macOS**

3. **Esegui i comandi** che GitHub ti fornisce sul tuo Mac:
   ```bash
   # Download
   mkdir actions-runner && cd actions-runner
   curl -o actions-runner-osx-arm64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-arm64-2.311.0.tar.gz
   tar xzf ./actions-runner-osx-arm64-2.311.0.tar.gz

   # Configure
   ./config.sh --url https://github.com/YOUR_USERNAME/NUZANTARA-2 --token YOUR_TOKEN

   # Install as service (mantiene runner sempre attivo)
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

4. **Verifica**: Il runner dovrebbe apparire come "Idle" su GitHub

---

### 2. Configura GitHub Secrets

Vai su: `Repository → Settings → Secrets and variables → Actions`

Crea questi secrets:

#### **ANTHROPIC_API_KEY**
```
sk-ant-api03-...
```
La tua chiave API Anthropic per Claude Opus (Stage 3: Editorial Review)

#### **SENDER_EMAIL**
```
intel@balizero.com
```
Email mittente per le notifiche via email

#### **SENDER_PASSWORD**
```
your-app-password
```
Password/App password per l'account email

---

### 3. Test del Workflow

#### **Test Manuale**:
```bash
# Via GitHub UI:
Actions → Intel Automation Daily → Run workflow → Run workflow

# Oppure via CLI:
gh workflow run intel-automation.yml
```

#### **Monitoraggio**:
```bash
# Visualizza run in corso
gh run list --workflow=intel-automation.yml

# Visualizza logs
gh run view --log
```

---

## 📅 Schedule Automatico

Il workflow è configurato per eseguire **automaticamente ogni giorno alle 6:00 UTC** (14:00 WIB):

```yaml
schedule:
  - cron: '0 6 * * *'
```

### Modifica Schedule

Per cambiare l'orario, edita `.github/workflows/intel-automation.yml`:

```yaml
# Esempi:
- cron: '0 0 * * *'   # Mezzanotte UTC (08:00 WIB)
- cron: '0 12 * * *'  # Mezzogiorno UTC (20:00 WIB)
- cron: '0 */6 * * *' # Ogni 6 ore
```

---

## 🔧 Requisiti sul Mac (Self-Hosted Runner)

### Software Necessario

✅ **Python 3.13** (già installato)
✅ **Ollama** con modello `llama3.2:3b` (già configurato)
✅ **Playwright Chromium** (installato durante workflow)
✅ **pip packages** (installati durante workflow)

### Mac Deve:

- ✅ Essere **acceso** quando il workflow si esegue
- ✅ Avere **connessione internet** stabile
- ✅ Avere **Ollama in esecuzione** (automatico se configurato come servizio)

---

## 📊 Output del Workflow

Ogni esecuzione genera:

### **Artifacts** (scaricabili da GitHub):
- `intel-scraping-{run_number}`: Articoli scraped (JSON)
- `intel-articles-{run_number}`: Articoli generati da LLAMA (JSON)

### **Logs**:
- Visibili in `Actions → [workflow run]`
- Mostra progress per ogni stage

### **Email**:
- Categoria owners ricevono email con nuovi articoli
- Zero riceve intelligence alerts per special categories

---

## 🐛 Troubleshooting

### Runner non si connette

```bash
# Check service status
sudo ./actions-runner/svc.sh status

# Restart
sudo ./actions-runner/svc.sh restart
```

### Ollama non disponibile

```bash
# Start Ollama
ollama serve

# Pull model
ollama pull llama3.2:3b
```

### Playwright browser mancante

```bash
playwright install chromium
```

### Secrets mancanti

Verifica che tutti i secrets siano configurati:
```bash
gh secret list
```

---

## 🔒 Sicurezza

- ✅ Secrets sono **crittografati** da GitHub
- ✅ Self-hosted runner **non espone** porte esterne
- ✅ Runner esegue solo codice del **tuo repository**
- ⚠️ Non condividere mai `ANTHROPIC_API_KEY` o email credentials

---

## 📈 Monitoring & Alerts

### Ricevi notifiche via email:

1. **Vai su**: `Repository → Settings → Notifications`
2. **Abilita**: "Send notifications for failed workflows"

### Webhook per Slack/Discord:

Aggiungi al workflow (step "Notify on failure"):

```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## ✅ Checklist Setup

- [ ] Self-hosted runner configurato e running
- [ ] Secrets configurati (ANTHROPIC_API_KEY, SENDER_EMAIL, SENDER_PASSWORD)
- [ ] Test manuale eseguito con successo
- [ ] Notifications abilitate
- [ ] Mac configurato per rimanere acceso

---

## 🚀 Quick Start

```bash
# 1. Installa runner
cd ~/actions-runner
./config.sh --url https://github.com/YOUR_USERNAME/NUZANTARA-2 --token YOUR_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start

# 2. Test workflow
gh workflow run intel-automation.yml

# 3. Monitor
gh run watch
```

---

**Sistema pronto per esecuzione automatica giornaliera!** 🎉

Il workflow scaricherà 518 siti, genererà articoli con LLAMA, e distribuirà via email ogni giorno alle 14:00 WIB.
