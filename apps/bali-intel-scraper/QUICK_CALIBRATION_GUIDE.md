# 🎯 Quick Calibration Guide - Intel Automation

## ⏰ Quando Calibrare?

**Dopo 7 giorni** di operazioni giornaliere (6AM Bali time).

---

## 🚀 Comandi Rapidi

### 1. Genera Analytics Dashboard
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-2
python3 apps/bali-intel-scraper/scripts/analytics_dashboard.py --report 7
```
➡️ Output: `apps/bali-intel-scraper/scripts/ANALYTICS_REPORTS/weekly_report_*.html`

---

### 2. Preview Calibrazioni (DRY RUN)
```bash
python3 apps/bali-intel-scraper/scripts/calibrate_system.py --dry-run
```
➡️ Mostra cosa verrà rimosso SENZA modificare file

---

### 3. Applica Calibrazioni
```bash
python3 apps/bali-intel-scraper/scripts/calibrate_system.py --apply
```
➡️ Modifica SITI_*.txt e crea backup automatico

---

### 4. Commit Modifiche
```bash
git add apps/bali-intel-scraper/sites/SITI_*.txt
git commit -m "chore: weekly calibration based on analytics"
git push
```

---

## 📊 Cosa Guardare nella Dashboard

### ✅ GOOD (nessuna azione)
- Success Rate ≥85%
- Quality Score ≥7.0/10
- Email delivery 100%
- Costi stabili

### ⚠️ WARNING (review consigliata)
- Success Rate 70-85%
- Quality Score 6.0-7.0/10
- Alcuni siti failed

### ❌ BAD (azione immediata)
- Success Rate <70%
- Quality Score <6.0/10
- Molti siti failed
- Costi in crescita

---

## 🔧 Thresholds Chiave

| Metrica | Threshold | Azione |
|---------|-----------|--------|
| Fail Rate Sito | >70% | Rimozione automatica |
| Quality Score Sito | <6.0/10 | Rimozione automatica |
| Success Rate Categoria | <85% | Review + sostituzione siti |
| Quality Score Categoria | <7.0/10 | Sostituire fonti |
| Costo Mensile | >$100 | Ottimizzazione prompt |

---

## 📁 File Importanti

### Input
- `apps/bali-intel-scraper/scripts/analytics.db` - Database metriche
- `apps/bali-intel-scraper/sites/SITI_*.txt` - Liste siti (20 files)

### Output
- `ANALYTICS_REPORTS/weekly_report_*.html` - Dashboard HTML
- `ANALYTICS_REPORTS/calibration_*.json` - Report calibrazione
- `calibration_backups/backup_*/` - Backup SITI_*.txt

---

## 🔄 Workflow Settimanale (5 minuti)

```bash
# Passo 1: Analytics (2 min)
python3 apps/bali-intel-scraper/scripts/analytics_dashboard.py --report 7
# Apri HTML in browser e review metriche

# Passo 2: Preview (1 min)
python3 apps/bali-intel-scraper/scripts/calibrate_system.py --dry-run
# Leggi output: quanti siti verranno rimossi?

# Passo 3: Applica (1 min)
python3 apps/bali-intel-scraper/scripts/calibrate_system.py --apply

# Passo 4: Commit (1 min)
git add apps/bali-intel-scraper/sites/SITI_*.txt
git commit -m "chore: weekly calibration"
git push
```

**Totale: ~5 minuti ogni domenica**

---

## 💡 Tips

1. **Prima settimana**: Solo analytics, NO calibrazioni (raccolta dati baseline)
2. **Backup automatici**: Sempre creati prima di modifiche
3. **Dry-run prima**: Mai --apply senza aver visto preview
4. **Review HTML**: Sempre controllare dashboard prima di calibrare
5. **Commit subito**: Committa modifiche subito dopo calibrazione

---

## 🆘 Troubleshooting

### "Analytics database not found"
```bash
# Inizializza database
python3 apps/bali-intel-scraper/scripts/analytics_dashboard.py --init
```

### "No SITI file found for category"
➡️ Categoria non ha file SITI_*.txt associato (controlla naming)

### Ripristinare backup
```bash
# Lista backup disponibili
ls -lh apps/bali-intel-scraper/scripts/calibration_backups/

# Ripristina ultimo backup
cp apps/bali-intel-scraper/scripts/calibration_backups/backup_*/SITI_*.txt apps/bali-intel-scraper/sites/
```

---

## 📈 Obiettivi Post-Calibrazione

| Settimana | Success Rate Target | Quality Score Target |
|-----------|---------------------|---------------------|
| 1 | Baseline (nessuna calibrazione) | Baseline |
| 2 | ≥80% | ≥6.5/10 |
| 3 | ≥85% | ≥7.0/10 |
| 4+ | ≥90% | ≥8.0/10 |

---

**Sistema di calibrazione pronto! 🚀**

Ogni domenica: 5 minuti di calibrazione = sistema sempre ottimizzato.
