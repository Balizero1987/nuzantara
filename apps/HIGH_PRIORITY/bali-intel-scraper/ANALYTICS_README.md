# 📊 Intel Automation - Analytics & Calibration System

Sistema completo di analytics e calibrazione automatica per Intel Automation.

## 🎯 Obiettivo

Dopo **1 settimana** di operazioni giornaliere, il sistema raccoglie metriche dettagliate per:
1. Identificare siti non performanti
2. Calibrare categorie sotto-performanti
3. Ottimizzare costi API
4. Migliorare qualità contenuti
5. Suggerire sostituzioni siti

---

## 📦 Componenti

### 1. **Analytics Database** (`analytics.db`)

Database SQLite che traccia:
- **daily_runs**: Statistiche run giornalieri
- **category_performance**: Performance per categoria
- **site_performance**: Performance singolo sito
- **quality_metrics**: Metriche qualità contenuti (Filtro Merda)
- **api_costs**: Costi API Anthropic + RAG Backend
- **email_delivery**: Status invio email

### 2. **Analytics Dashboard** (`analytics_dashboard.py`)

Genera report settimanali con:
- Success rate per categoria
- Top/Worst performing sites
- Analisi qualità contenuti
- Costi API proiettati
- Raccomandazioni automatiche

**Usage:**
```bash
# Inizializza database
python3 scripts/bali-intel-scraper/scripts/analytics_dashboard.py --init

# Genera report ultimi 7 giorni (HTML)
python3 scripts/bali-intel-scraper/scripts/analytics_dashboard.py --report 7

# Genera report JSON
python3 scripts/bali-intel-scraper/scripts/analytics_dashboard.py --report 7 --json

# Report ultimi 14 giorni
python3 scripts/bali-intel-scraper/scripts/analytics_dashboard.py --report 14
```

**Output:**
- HTML Dashboard: `scripts/bali-intel-scraper/scripts/ANALYTICS_REPORTS/weekly_report_*.html`
- JSON Report: `scripts/bali-intel-scraper/scripts/ANALYTICS_REPORTS/weekly_report_*.json`

### 3. **Calibration System** (`calibrate_system.py`)

Sistema automatico di calibrazione che:
- Identifica siti con fail rate >70%
- Rimuove siti con qualità <6.0/10
- Suggerisce sostituzioni
- Crea backup automatico SITI_*.txt

**Usage:**
```bash
# Preview calibrazioni (DRY RUN - nessuna modifica)
python3 scripts/bali-intel-scraper/scripts/calibrate_system.py --dry-run

# Applica calibrazioni (MODIFICA SITI_*.txt)
python3 scripts/bali-intel-scraper/scripts/calibrate_system.py --apply

# Analizza ultimi 14 giorni
python3 scripts/bali-intel-scraper/scripts/calibrate_system.py --dry-run --days 14
```

**Output:**
- Calibration Report: `scripts/bali-intel-scraper/scripts/ANALYTICS_REPORTS/calibration_*.json`
- Backup Files: `scripts/bali-intel-scraper/scripts/calibration_backups/backup_*/`

---

## 🔄 Workflow Settimanale Consigliato

### Giorno 1-7: Raccolta Dati
Il sistema raccoglie automaticamente metriche ad ogni run giornaliero (6AM Bali time).

### Giorno 8: Analisi + Calibrazione

```bash
# 1. Genera report analytics HTML
cd /Users/antonellosiano/Desktop/NUZANTARA-2
python3 apps/bali-intel-scraper/scripts/analytics_dashboard.py --report 7

# 2. Apri dashboard HTML (auto-opens in browser)
# Esamina metriche: success rate, quality score, worst sites

# 3. Preview calibrazioni (senza modificare)
python3 apps/bali-intel-scraper/scripts/calibrate_system.py --dry-run

# 4. Review output: identifica siti da rimuovere + sostituzioni

# 5. Applica calibrazioni
python3 apps/bali-intel-scraper/scripts/calibrate_system.py --apply

# 6. Verifica modifiche SITI_*.txt
# I backup sono salvati in: scripts/calibration_backups/

# 7. Commit e push modifiche
git add apps/bali-intel-scraper/sites/SITI_*.txt
git commit -m "chore: calibrate sites based on week 1 analytics"
git push
```

---

## 📊 Metriche Monitorate

### 1. **Success Rate per Categoria**
- **Target**: ≥85%
- **Azione se <85%**: Review siti, rimuovere quelli non funzionanti

### 2. **Quality Score per Categoria**
- **Target**: ≥7.0/10
- **Azione se <7.0**: Sostituire siti con fonti più autorevoli

### 3. **Fail Rate per Sito**
- **Threshold**: 70%
- **Azione se >70%**: Rimozione automatica

### 4. **Content Quality (Filtro Merda)**
- **Min Score**: 6.0/10
- **Azione se <6.0**: Rimozione sito

### 5. **API Costs**
- **Anthropic API**: Costo per token (input + output)
- **RAG Backend**: Costo embeddings
- **Projected Monthly**: Stima mensile

### 6. **Email Delivery**
- Success rate invio email
- Errori SMTP

---

## 🏆 Top Performers vs Worst Sites

### Top Performers
Dashboard mostra **top 20 siti** cross-category con:
- Highest quality score
- Best success rate
- Fastest scraping time

**Uso**: Identificare pattern di siti autorevoli da replicare in altre categorie.

### Worst Sites
Dashboard mostra **worst 20 siti** con:
- High fail rate (>70%)
- Low quality score (<6.0)
- Frequent errors

**Uso**: Rimozione immediata + sostituzione.

---

## 💡 Raccomandazioni Automatiche

Il sistema genera automaticamente raccomandazioni come:

```
⚠️ Categoria 'immigration': Success rate basso (65%).
   Rimuovere siti non funzionanti e sostituire.

📉 Categoria 'tax': Qualità media bassa (5.8/10).
   Rivedere SITI_TAX.txt e preferire fonti più autorevoli.

🗑️ 15 siti con performance pessima.
   Rimuovere e sostituire con alternative migliori.

💰 Costo mensile proiettato: $120.
   Considerare ottimizzazione lunghezza prompt o riduzione categorie.
```

---

## 🔧 Calibrazione Automatica

### Threshold Configurabili

File: `apps/bali-intel-scraper/scripts/calibrate_system.py`

```python
FAIL_RATE_THRESHOLD = 70.0   # Remove sites with >70% fail rate
SUCCESS_RATE_TARGET = 85.0    # Target success rate per category
QUALITY_SCORE_MIN = 6.0       # Minimum quality score to keep
MIN_SCRAPES_FOR_DECISION = 3  # Need at least 3 scrapes to judge
```

### Azioni di Calibrazione

1. **Rimozione Siti**:
   - Fail rate >70%
   - Quality score <6.0
   - Backup automatico prima di ogni modifica

2. **Suggerimenti Sostitutivi**:
   - Basati su top performers della stessa categoria
   - Fonti autorevoli simili

3. **Renumbering Automatico**:
   - Dopo rimozione, entries vengono rinumerati automaticamente

---

## 📈 Dashboard HTML - Preview

La dashboard HTML include:

### Summary Cards
- Total Runs
- Sites Scraped
- Articles Created
- Avg Duration
- Total Cost

### Category Performance Table
| Category | Collaborator | Success Rate | Quality Score | Articles | Status |
|----------|-------------|--------------|---------------|----------|--------|
| Immigration | Adit | 92% | 8.5/10 | 45 | ✅ Good |
| Tax | Faisha | 67% | 5.2/10 | 32 | ⚠️ Review |

### Top Performing Sites
| Site | Category | Quality Score | Success Rate |
|------|----------|---------------|--------------|
| Imigrasi.go.id | Immigration | 9.2/10 | 100% |

### Worst Performing Sites
| Site | Category | Quality Score | Fail Rate |
|------|----------|---------------|-----------|
| OldSite.com | Tax | 3.1/10 | 85% |

### Cost Analysis
- Total Cost (7 days): $25.50
- Average Daily Cost: $3.64
- Projected Monthly Cost: $109.20
- Anthropic API: $18.30 (125K input + 45K output tokens)
- RAG Backend: $7.20

### Recommendations
- Lista automatica di azioni da intraprendere

---

## 🔄 Integrazione Automatica

Il sistema si integra automaticamente con `run_intel_automation.py`:

1. **Ogni Run**: Logs automatici a `analytics.db`
2. **Ogni 7 Runs**: Suggerisce generazione report
3. **GitHub Actions**: Workflow ID tracciato per debugging

---

## 📁 Struttura File

```
apps/bali-intel-scraper/
├── scripts/
│   ├── analytics_dashboard.py      # Dashboard generator
│   ├── calibrate_system.py         # Calibration system
│   ├── analytics.db                # SQLite database
│   ├── ANALYTICS_REPORTS/          # Generated reports
│   │   ├── weekly_report_*.html
│   │   ├── weekly_report_*.json
│   │   └── calibration_*.json
│   └── calibration_backups/        # SITI_*.txt backups
│       └── backup_YYYYMMDD_HHMMSS/
└── sites/
    ├── SITI_*.txt                  # Site lists (modified by calibration)
    └── ...
```

---

## 🚀 Quick Start

### Setup Iniziale (1 volta)

```bash
# Inizializza database analytics
python3 apps/bali-intel-scraper/scripts/analytics_dashboard.py --init
```

### Workflow Post-Settimana (ogni 7 giorni)

```bash
# 1. Genera report
python3 apps/bali-intel-scraper/scripts/analytics_dashboard.py --report 7

# 2. Review dashboard HTML (opens automatically)

# 3. Calibra sistema (dry-run prima)
python3 apps/bali-intel-scraper/scripts/calibrate_system.py --dry-run

# 4. Se OK, applica
python3 apps/bali-intel-scraper/scripts/calibrate_system.py --apply

# 5. Commit modifiche
git add apps/bali-intel-scraper/sites/SITI_*.txt
git commit -m "chore: weekly calibration - remove underperforming sites"
git push
```

---

## 🔍 Debugging

### Check Database

```bash
sqlite3 apps/bali-intel-scraper/scripts/analytics.db

# Queries utili:
SELECT COUNT(*) FROM daily_runs;
SELECT category_key, AVG(success_rate) FROM category_performance GROUP BY category_key;
SELECT site_url, COUNT(*) as fails FROM site_performance WHERE scraping_success=0 GROUP BY site_url ORDER BY fails DESC LIMIT 10;
```

### Ripristinare Backup

```bash
# List backups
ls -lh apps/bali-intel-scraper/scripts/calibration_backups/

# Restore specific backup
cp apps/bali-intel-scraper/scripts/calibration_backups/backup_YYYYMMDD_HHMMSS/SITI_*.txt apps/bali-intel-scraper/sites/
```

---

## 📊 Parametri da Seguire (Key Metrics)

### Settimanali
1. **Success Rate per Categoria**: Target ≥85%
2. **Quality Score Medio**: Target ≥7.0/10
3. **Fail Rate Siti**: Max 70% (poi rimozione)
4. **Costo Mensile Proiettato**: Budget tracking

### Mensili
1. **Trend Success Rate**: Deve aumentare nel tempo
2. **Trend Quality Score**: Deve aumentare nel tempo
3. **Costi API**: Deve stabilizzarsi o diminuire
4. **Numero Siti Attivi**: Ottimizzazione verso qualità vs quantità

---

## 💡 Best Practices

1. **Prima Settimana**: SOLO raccolta dati, NO calibrazioni
2. **Settimana 2**: Prima calibrazione conservativa (dry-run multipli)
3. **Settimana 3+**: Calibrazioni regolari settimanali
4. **Backup**: Sempre verificare backup prima di --apply
5. **Commit**: Committa modifiche SITI_*.txt dopo calibrazione
6. **Review**: Sempre esaminare dashboard HTML prima di agire

---

## 🎯 Obiettivi Post-Calibrazione

Dopo 4 settimane di calibrazioni:

- **Success Rate**: ≥90% per tutte le categorie
- **Quality Score**: ≥8.0/10 media globale
- **Costi Mensili**: Stabilizzati e ottimizzati
- **Siti Attivi**: Solo performers affidabili
- **Email Delivery**: 100% success rate

---

**Sistema pronto per calibrazione automatica! 🚀**

Dopo 1 settimana di operazioni, esegui il workflow sopra per ottimizzare il sistema.
