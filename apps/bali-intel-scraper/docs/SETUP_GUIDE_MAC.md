# 🍎 Setup Guide - Mac (Python + Dependencies)

**Time required**: ~10 minutes (one-time only)

---

## ✅ Prerequisites

**You have a Mac**: ✅
**Operating System**: macOS Sonoma, Ventura, or Monterey

---

## 📦 Step 1: Install Homebrew (if not already installed)

**Homebrew** is the package manager for Mac (like apt on Linux).

### **Check if already installed**:
```bash
brew --version
```

**If you see output like** `Homebrew 4.x.x` → ✅ **Already installed, go to Step 2**

**If you see error** `command not found` → Install now:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Time**: ~5 minutes
**Confirm when asked for password**: Enter your Mac password

---

## 🐍 Step 2: Install Python 3

**Check if already installed**:
```bash
python3 --version
```

**If you see** `Python 3.11.x` or higher → ✅ **Already installed, go to Step 3**

**If you see** `Python 3.9` or lower, or error → Install updated version:

```bash
brew install python@3.11
```

**Time**: ~3 minutes

**Verify installation**:
```bash
python3 --version
# Expected output: Python 3.11.x
```

---

## 📚 Step 3: Install Python Dependencies

**Navigate to project folder**:
```bash
cd ~/Desktop/NUZANTARA-2/apps/bali-intel-scraper
```

**Install all dependencies** (single command):
```bash
pip3 install -r requirements.txt
```

**Time**: ~2 minutes

**Expected output**:
```
Successfully installed beautifulsoup4-4.12.3 requests-2.31.0 playwright-1.40.0 ...
```

---

## 🎭 Step 4: Setup Playwright (for JavaScript sites)

Playwright is needed to scrape sites with dynamic content (React, Vue, etc.).

```bash
playwright install chromium
```

**Time**: ~2 minutes
**Downloads**: Headless Chromium browser (~300 MB)

**Expected output**:
```
Downloading Chromium... Done
```

---

## ✅ Step 5: Verify Complete Setup

**Quick test**:
```bash
python3 scripts/test_setup.py
```

**Expected output**:
```
✅ Python: 3.11.x
✅ BeautifulSoup4: 4.12.3
✅ Requests: 2.31.0
✅ Playwright: 1.40.0
✅ Chromium browser: Installed

🎉 Setup complete! Ready for scraping.
```

---

## 🚀 First Scraping Test

**Try the immigration script**:
```bash
python3 scripts/scrape_immigration.py
```

**Wait** ~5-10 minutes (scraping 30-40 sites)

**Expected output**:
```
🔍 Scraping immigration sources...
✅ imigrasi.go.id → 3 articles found
✅ Jakarta Post → 5 articles found
...
✅ Total: 45 articles scraped
📁 Saved to: data/raw/immigration_raw_20250110.csv
```

**Verify file created**:
```bash
ls -lh data/raw/immigration_raw_20250110.csv
```

You should see a CSV file of a few KB/MB.

---

## 🐛 Troubleshooting

### **Error: `pip3: command not found`**

**Solution**:
```bash
python3 -m ensurepip --upgrade
```

---

### **Error: `Permission denied`**

**Solution**: Use `--user` flag:
```bash
pip3 install --user -r requirements.txt
```

---

### **Error: `playwright: command not found`**

**Solution**: Reinstall Playwright:
```bash
pip3 install playwright
playwright install chromium
```

---

### **Error during scraping: `Timeout`**

**Cause**: Website slow or down
**Solution**: Normal, script automatically skips and continues

---

### **Error: `SSL Certificate verify failed`**

**Solution**:
```bash
pip3 install --upgrade certifi
/Applications/Python\ 3.11/Install\ Certificates.command
```

---

## 📞 Support

**If problems persist**:
1. Screenshot complete error
2. Output of `python3 --version` and `pip3 list`
3. Send to: zero@balizero.com

---

## 📝 Final Checklist

Before starting daily workflow, verify:

- [ ] `python3 --version` shows 3.11+
- [ ] `pip3 list` shows beautifulsoup4, requests, playwright
- [ ] `playwright install chromium` completed
- [ ] Test scraping script works
- [ ] CSV file created in `data/raw/`

✅ **All OK?** → Go to `DAILY_WORKFLOW.md`

---

**Setup Version**: 1.0.0
**Last Updated**: 2025-10-05
**Tested on**: macOS Sonoma 14.x, Ventura 13.x
