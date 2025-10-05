# 🍎 Setup Guida - Mac (Python + Dipendenze)

**Tempo richiesto**: ~10 minuti (una volta sola)

---

## ✅ Prerequisiti

**Hai un Mac**: ✅
**Sistema operativo**: macOS Sonoma, Ventura, o Monterey

---

## 📦 Step 1: Installare Homebrew (se non già installato)

**Homebrew** è il package manager per Mac (come apt su Linux).

### **Controlla se già installato**:
```bash
brew --version
```

**Se vedi output tipo** `Homebrew 4.x.x` → ✅ **Già installato, vai a Step 2**

**Se vedi errore** `command not found` → Installa ora:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Tempo**: ~5 minuti
**Conferma quando chiede password**: Inserisci password Mac

---

## 🐍 Step 2: Installare Python 3

**Controlla se già installato**:
```bash
python3 --version
```

**Se vedi** `Python 3.11.x` o superiore → ✅ **Già installato, vai a Step 3**

**Se vedi** `Python 3.9` o inferiore, o errore → Installa versione aggiornata:

```bash
brew install python@3.11
```

**Tempo**: ~3 minuti

**Verifica installazione**:
```bash
python3 --version
# Output atteso: Python 3.11.x
```

---

## 📚 Step 3: Installare Dipendenze Python

**Naviga nella cartella del progetto**:
```bash
cd ~/Desktop/NUZANTARA-2/apps/bali-intel-scraper
```

**Installa tutte le dipendenze** (un solo comando):
```bash
pip3 install -r requirements.txt
```

**Tempo**: ~2 minuti

**Output atteso**:
```
Successfully installed beautifulsoup4-4.12.3 requests-2.31.0 playwright-1.40.0 ...
```

---

## 🎭 Step 4: Setup Playwright (per siti JavaScript)

Playwright serve per scrapare siti con contenuto dinamico (React, Vue, etc.).

```bash
playwright install chromium
```

**Tempo**: ~2 minuti
**Scarica**: Browser headless Chromium (~300 MB)

**Output atteso**:
```
Downloading Chromium... Done
```

---

## ✅ Step 5: Verifica Setup Completo

**Test rapido**:
```bash
python3 scripts/test_setup.py
```

**Output atteso**:
```
✅ Python: 3.11.x
✅ BeautifulSoup4: 4.12.3
✅ Requests: 2.31.0
✅ Playwright: 1.40.0
✅ Chromium browser: Installed

🎉 Setup completo! Pronto per scraping.
```

---

## 🚀 Primo Test Scraping

**Prova lo script immigration**:
```bash
python3 scripts/scrape_immigration.py
```

**Aspetta** ~5-10 minuti (scraping 30-40 siti)

**Output atteso**:
```
🔍 Scraping immigration sources...
✅ imigrasi.go.id → 3 articles found
✅ Jakarta Post → 5 articles found
...
✅ Total: 45 articles scraped
📁 Saved to: data/raw/immigration_raw_20250110.csv
```

**Verifica file creato**:
```bash
ls -lh data/raw/immigration_raw_20250110.csv
```

Dovresti vedere un file CSV di qualche KB/MB.

---

## 🐛 Troubleshooting

### **Errore: `pip3: command not found`**

**Soluzione**:
```bash
python3 -m ensurepip --upgrade
```

---

### **Errore: `Permission denied`**

**Soluzione**: Usa `--user` flag:
```bash
pip3 install --user -r requirements.txt
```

---

### **Errore: `playwright: command not found`**

**Soluzione**: Reinstalla Playwright:
```bash
pip3 install playwright
playwright install chromium
```

---

### **Errore durante scraping: `Timeout`**

**Causa**: Sito web lento o down
**Soluzione**: Normale, lo script salta automaticamente e continua

---

### **Errore: `SSL Certificate verify failed`**

**Soluzione**:
```bash
pip3 install --upgrade certifi
/Applications/Python\ 3.11/Install\ Certificates.command
```

---

## 📞 Supporto

**Se problemi persistono**:
1. Screenshot errore completo
2. Output di `python3 --version` e `pip3 list`
3. Invia a: zero@balizero.com

---

## 📝 Checklist Finale

Prima di iniziare workflow giornaliero, verifica:

- [ ] `python3 --version` mostra 3.11+
- [ ] `pip3 list` mostra beautifulsoup4, requests, playwright
- [ ] `playwright install chromium` completato
- [ ] Test script scraping funziona
- [ ] File CSV creato in `data/raw/`

✅ **Tutto OK?** → Vai a `WORKFLOW_GIORNALIERO.md`

---

**Setup Version**: 1.0.0
**Last Updated**: 2025-10-05
**Tested on**: macOS Sonoma 14.x, Ventura 13.x
