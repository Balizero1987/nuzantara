# 📰 BALI ZERO JOURNAL - Comandi CLI

## 🚀 COMANDO PRINCIPALE (Genera Journal Completo)

```bash
# Dalla root del progetto
python3 INTEL_SCRAPING/code/bali_zero_journal_generator.py
```

Questo comando:
1. ✅ Raccoglie tutti gli articoli di oggi (676 files)
2. ⏳ Invia a LLAMA 3.1 8B su Runpod per curation
3. 🎨 Genera immagini copertina con ImagineArt (placeholder per ora)
4. 📄 Crea PDF professionale
5. 📧 Invia email a tutto il team Bali Zero

---

## 🔧 COMANDI AVANZATI

### 1. Solo raccolta articoli (test)
```bash
python3 -c "
import sys; sys.path.insert(0, 'INTEL_SCRAPING/code')
from bali_zero_journal_generator import BaliZeroJournalGenerator, JournalConfig

config = JournalConfig()
gen = BaliZeroJournalGenerator(config)
articles = gen.collect_todays_articles()
print(f'Trovati {len(articles)} articoli')
print(f'Categorie: {set(a.category for a in articles)}')
"
```

### 2. Genera Journal con fallback (senza aspettare LLAMA)
```bash
python3 <<'EOF'
import sys; sys.path.insert(0, 'INTEL_SCRAPING/code')
from bali_zero_journal_generator import BaliZeroJournalGenerator, JournalConfig
import json
from pathlib import Path

config = JournalConfig()
gen = BaliZeroJournalGenerator(config)

# Raccolta
articles = gen.collect_todays_articles()
print(f"📊 {len(articles)} articoli")

# Usa fallback (senza LLAMA)
journal = gen.llama_service._get_fallback_journal(articles)

# Salva JSON
out = Path('INTEL_SCRAPING/data/JOURNAL/journal_fallback.json')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(journal, indent=2, ensure_ascii=False))

print(f"✅ Journal: {out}")
print(f"Cover stories: {len(journal['cover_stories'])}")
print(f"Sections: {len(journal['sections'])}")
EOF
```

### 3. Genera solo PDF da JSON esistente
```bash
python3 INTEL_SCRAPING/code/journal_pdf_generator.py INTEL_SCRAPING/data/JOURNAL/test_fallback.json
```

### 4. Test LLAMA Runpod (verifica connessione)
```bash
python3 <<'EOF'
import requests
import json

RUNPOD_ENDPOINT = "https://api.runpod.ai/v2/itz2q5gmid4cyt"
RUNPOD_API_KEY = "rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"

# Test semplice
payload = {
    "input": {
        "prompt": "Hello LLAMA! Are you awake? Respond with just: AWAKE",
        "max_tokens": 50,
        "temperature": 0.5
    }
}

headers = {
    "Authorization": f"Bearer {RUNPOD_API_KEY}",
    "Content-Type": "application/json"
}

print("🔌 Testing Runpod connection...")
response = requests.post(f"{RUNPOD_ENDPOINT}/run", headers=headers, json=payload, timeout=10)

if response.status_code == 200:
    job_data = response.json()
    job_id = job_data.get('id')
    print(f"✅ Job submitted: {job_id}")
    print(f"Status: {job_data.get('status')}")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
EOF
```

### 5. Check status job LLAMA
```bash
# Sostituisci JOB_ID con l'ID del job
export JOB_ID="a8a4ed50-35e9-4836-8015-5491e071f704-e1"

curl -X GET \
  -H "Authorization: Bearer rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz" \
  "https://api.runpod.ai/v2/itz2q5gmid4cyt/status/${JOB_ID}"
```

---

## 🎯 WORKFLOW COMPLETO (Produzione)

### Opzione A: Con LLAMA (migliore qualità)
```bash
# 1. Assicurati che Runpod pod sia attivo
# 2. Esegui generator
python3 INTEL_SCRAPING/code/bali_zero_journal_generator.py

# Se LLAMA è in queue troppo a lungo, il sistema usa automaticamente fallback
```

### Opzione B: Fallback rapido (senza LLAMA)
```bash
# 1. Genera JSON con fallback
python3 <<'EOF'
import sys; sys.path.insert(0, 'INTEL_SCRAPING/code')
from bali_zero_journal_generator import BaliZeroJournalGenerator, JournalConfig
from datetime import datetime
import json
from pathlib import Path

config = JournalConfig()
gen = BaliZeroJournalGenerator(config)

articles = gen.collect_todays_articles()
journal = gen.llama_service._get_fallback_journal(articles)
journal['total_articles'] = len(articles)
journal['generated_at'] = datetime.now().isoformat()

out = Path(f"INTEL_SCRAPING/data/JOURNAL/journal_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(journal, indent=2, ensure_ascii=False))

print(f"✅ {out}")
EOF

# 2. Genera PDF
python3 INTEL_SCRAPING/code/journal_pdf_generator.py INTEL_SCRAPING/data/JOURNAL/journal_*.json

# 3. Invia email (TODO: implementare)
# python3 INTEL_SCRAPING/code/send_journal_email.py INTEL_SCRAPING/data/JOURNAL/BaliZeroJournal_*.pdf
```

---

## 📧 EMAIL (Da implementare)

```bash
# TODO: Creare script email sender usando gmail_automation.py
python3 <<'EOF'
import sys
sys.path.append('apps/backend-ts/src/services/google')
from gmail_automation import ZantaraGmailAutomation

gmail = ZantaraGmailAutomation()

# Lista team
team_emails = [
    "zero@balizero.com",
    "consulting@balizero.com",
    "dea@balizero.com",
    "krisna@balizero.com",
    # ... altri
]

# Invia a tutti
for email in team_emails:
    # TODO: Implementare send_journal
    print(f"Sending to {email}")
EOF
```

---

## 🐛 TROUBLESHOOTING

### LLAMA pod in sleep mode
```bash
# Il pod Runpod potrebbe essere in sleep mode (cold start)
# Soluzione 1: Attivare manualmente da dashboard Runpod
# Soluzione 2: Usare fallback automatico (dopo 5 min timeout)
# Soluzione 3: Usare comando fallback esplicito (Opzione B sopra)
```

### PDF non genera
```bash
# Verifica WeasyPrint
pip3 install --upgrade weasyprint

# Verifica logo esiste
ls -la "/Users/antonellosiano/Desktop/BZ JOURNAL.png"
```

### Articoli non trovati
```bash
# Verifica data corretta
ls -la INTEL_SCRAPING/data/INTEL_SCRAPING/*/raw/ | grep $(date +%Y%m%d)

# Usa data specifica
python3 -c "
import sys; sys.path.insert(0, 'INTEL_SCRAPING/code')
from bali_zero_journal_generator import BaliZeroJournalGenerator, JournalConfig

config = JournalConfig()
gen = BaliZeroJournalGenerator(config)
articles = gen.collect_todays_articles(date='20251022')  # Data specifica
print(f'Found: {len(articles)}')
"
```

---

## 📊 OUTPUT FILES

```
INTEL_SCRAPING/data/JOURNAL/
├── journal_20251022_081800.json     # Structure JSON da LLAMA
├── BaliZeroJournal_20251022.pdf     # PDF finale (1-2 MB)
└── test_fallback.json               # Test files
```

---

## ⏰ AUTOMAZIONE (Cron Job)

Per eseguire ogni mattina alle 7:00 AM:

```bash
# Aggiungi a crontab
crontab -e

# Aggiungi questa riga:
0 7 * * * cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY && python3 INTEL_SCRAPING/code/bali_zero_journal_generator.py >> /tmp/journal.log 2>&1
```

---

## 🎉 SUCCESSO!

Quando vedi:
```
✅ Journal structure saved: INTEL_SCRAPING/data/JOURNAL/journal_*.json
✅ PDF created: INTEL_SCRAPING/data/JOURNAL/BaliZeroJournal_*.pdf
```

Il tuo **BALI ZERO JOURNAL** è pronto! 📰
