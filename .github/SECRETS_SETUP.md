# GitHub Secrets Setup - Intel Automation

Per far funzionare il sistema di Intel Automation, devi configurare i seguenti **Secrets** su GitHub.

---

## 📋 SECRETS RICHIESTI

Vai su: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. **ANTHROPIC_API_KEY**
- **Descrizione**: API key per Claude (AI processing)
- **Valore**: La tua API key Anthropic
- **Formato**: `sk-ant-api03-...`
- **Link**: https://console.anthropic.com/settings/keys

### 2. **RAG_BACKEND_URL**
- **Descrizione**: URL del backend RAG per embeddings e ChromaDB
- **Valore**: `https://zantara-rag-backend-1064094238013.europe-west1.run.app`
- **Formato**: URL completo con https://

### 3. **SMTP_HOST**
- **Descrizione**: Server SMTP per invio email
- **Valore**: `smtp.gmail.com` (se usi Gmail)
- **Formato**: hostname SMTP

### 4. **SMTP_PORT**
- **Descrizione**: Porta SMTP
- **Valore**: `587` (TLS) o `465` (SSL)
- **Formato**: numero

### 5. **SMTP_USER**
- **Descrizione**: Email address per autenticazione SMTP
- **Valore**: Il tuo indirizzo email (es: `noreply@balizero.com`)
- **Formato**: email address completo

### 6. **SMTP_PASS**
- **Descrizione**: Password SMTP o App Password
- **Valore**:
  - Se usi **Gmail**: crea una "App Password" da https://myaccount.google.com/apppasswords
  - Altrimenti: la password del tuo account email
- **Formato**: password/token string

---

## 🔐 CONFIGURAZIONE GMAIL (Consigliato)

Se usi Gmail per l'invio, segui questi passi:

1. **Abilita 2-Step Verification**:
   - Vai su https://myaccount.google.com/security
   - Attiva "2-Step Verification"

2. **Crea App Password**:
   - Vai su https://myaccount.google.com/apppasswords
   - Seleziona "Mail" e "Other (Custom name)"
   - Nome: "ZANTARA Intel Automation"
   - Copia la password generata (16 caratteri)

3. **Configura i secrets**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

---

## ✅ VERIFICA CONFIGURAZIONE

Dopo aver configurato tutti i secrets, puoi verificare con:

### Opzione 1: Manual Trigger
1. Vai su **Actions** tab nel repository
2. Seleziona "Intel Automation - Daily Pipeline"
3. Click "Run workflow"
4. Lascia skip_stages vuoto
5. Click "Run workflow"

### Opzione 2: Push Commit
Il workflow si attiverà automaticamente ogni giorno alle **6:00 AM Bali time** (22:00 UTC previous day)

---

## 📧 EMAIL RECIPIENTS

Il sistema invierà automaticamente email a:

**17 Categorie Regular** → Collaboratori:
- `consulting@balizero.com` (Adit - Immigration, Regulatory)
- `Dea@balizero.com` (Dea - Business, Macro)
- `Krisna@balizero.com` (Krisna - Real Estate, Business Setup)
- `sahira@balizero.com` (Sahira - Events, Social Media)
- `ari.firda@balizero.com` (Ari - Competitors)
- `damar@balizero.com` (Damar - General News)
- `surya@balizero.com` (Surya - Health, Banking, Transport, Events)
- `faisha@balizero.com` (Faisha - Tax)
- `Anton@balizero.com` (Anton - Jobs)
- `dea.au.tax@balizero.com` (Dewa Ayu - Lifestyle)
- `amanda@balizero.com` (Amanda - Employment Law)

**3 Categorie LLAMA** → Antonio only:
- `zero@balizero.com` (Antonio - AI Tech, Dev Code, Future Trends)

---

## 🚀 WORKFLOW SCHEDULE

- **Cron**: `0 22 * * *` (ogni giorno)
- **Timezone**: UTC (22:00 UTC = 06:00 AM Bali WIB)
- **Durata stimata**: 30-60 minuti
- **Timeout**: 120 minuti max

---

## 🔍 MONITORING

Dopo ogni run, controlla:

1. **Actions tab**: Verifica che il workflow sia completato con successo
2. **Artifacts**: Scarica i file generati (raw scraping + articles)
3. **Email inbox**: Verifica che le email siano arrivate ai collaboratori
4. **Logs**: Leggi i logs per eventuali errori

---

## ⚠️ TROUBLESHOOTING

### Email non inviate?
- Verifica che SMTP secrets siano corretti
- Controlla che Gmail App Password sia attiva
- Verifica che l'email SMTP_USER esista

### Workflow fallisce?
- Controlla che ANTHROPIC_API_KEY sia valida
- Verifica che RAG_BACKEND_URL sia raggiungibile
- Leggi i logs dettagliati nella Actions tab

### Scraping non funziona?
- Verifica connessione internet del runner GitHub
- Alcuni siti potrebbero bloccare GitHub IPs
- Controlla che i siti SITI_*.txt siano accessibili

---

**Configurazione completata!** 🎉

Il sistema è pronto per il deployment automatico giornaliero.
