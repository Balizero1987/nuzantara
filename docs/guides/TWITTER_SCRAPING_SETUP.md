# 🐦 Twitter/X Scraping - Setup & Troubleshooting

**Status**: ⚠️ snscrape incompatibile con Python 3.13  
**Solution**: Usa Python 3.10/3.11 o alternative

---

## ❌ Problema Identificato

```bash
# Test attuale
python3 --version
# Python 3.13.7 ← TOO NEW for snscrape

python3 scripts/twitter_intel_scraper.py --category events_culture
# ⚠️ snscrape error: TypeError in argparse
```

**Root Cause**: snscrape non è stato aggiornato per Python 3.13 (rilasciato Aug 2024)

---

## ✅ SOLUZIONE 1: Pyenv + Python 3.11 (RACCOMANDATO)

### **Install Pyenv**
```bash
# Install pyenv
curl https://pyenv.run | bash

# Add to ~/.zshrc or ~/.bashrc
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# Reload shell
source ~/.zshrc
```

### **Install Python 3.11**
```bash
# Install Python 3.11
pyenv install 3.11.9

# Set local Python for NUZANTARA-2
cd /Users/antonellosiano/Desktop/NUZANTARA-2
pyenv local 3.11.9

# Verify
python --version
# Should show: Python 3.11.9
```

### **Reinstall snscrape**
```bash
# In NUZANTARA-2 directory (using Python 3.11 now)
pip install --upgrade pip
pip install snscrape

# Test
snscrape --version
# Should work without errors
```

### **Test Twitter Scraper**
```bash
# Now this should work
python scripts/twitter_intel_scraper.py --category events_culture
```

---

## ✅ SOLUZIONE 2: Tweepy (Alternative Library)

**Pros**: Maintained, Python 3.13 compatible  
**Cons**: Requires Twitter API keys (free tier: 500K tweets/month)

### **Setup**
```bash
# Install
pip install tweepy

# Get API keys from Twitter Developer Portal
# https://developer.twitter.com/en/portal/dashboard
```

### **Modified Scraper** (if using Tweepy)
Create `scripts/twitter_tweepy_scraper.py`:

```python
import tweepy

# Setup auth
client = tweepy.Client(bearer_token="YOUR_BEARER_TOKEN")

# Search tweets
tweets = client.search_recent_tweets(
    query="from:imigrasi_ri",
    max_results=100
)

for tweet in tweets.data:
    print(tweet.text)
```

**Note**: Richiede API key, ma è più affidabile e stabile.

---

## ✅ SOLUZIONE 3: Nitter Instances (No API Keys)

Nitter è un frontend Twitter alternativo che bypassa rate limits.

### **Popular Instances**
- https://nitter.net
- https://nitter.42l.fr
- https://nitter.pussthecat.org

### **Scraping via Requests**
```python
import requests
from bs4 import BeautifulSoup

url = "https://nitter.net/imigrasi_ri"
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

# Parse tweets
tweets = soup.find_all('div', class_='tweet-content')
for tweet in tweets:
    print(tweet.text)
```

**Note**: Più lento, ma funziona senza API keys o problemi di versione Python.

---

## 📋 Checklist Risoluzione

### **Opzione A: Fix snscrape (Raccomandato)**
- [ ] Install pyenv
- [ ] Install Python 3.11.9
- [ ] Set local Python in NUZANTARA-2
- [ ] Reinstall snscrape
- [ ] Test `python scripts/twitter_intel_scraper.py`

### **Opzione B: Switch a Tweepy**
- [ ] Create Twitter Developer account
- [ ] Get API keys
- [ ] Install tweepy
- [ ] Modify scraper to use Tweepy API
- [ ] Test with small query

### **Opzione C: Nitter Scraping**
- [ ] Install beautifulsoup4: `pip install beautifulsoup4`
- [ ] Create Nitter scraper
- [ ] Test with single account
- [ ] Implement rate limiting

---

## 🚀 Quick Test Commands

### **Test snscrape (dopo fix)**
```bash
# Single account
snscrape --max-results 10 twitter-search "from:imigrasi_ri"

# Hashtag
snscrape --max-results 10 twitter-search "#Bali lang:id"

# Keyword
snscrape --max-results 10 twitter-search "KITAS extend"
```

### **Test Twitter Intel Scraper**
```bash
# Single category (small test)
python scripts/twitter_intel_scraper.py --category events_culture

# Check output
ls -lh INTEL_SCRAPING/events_culture/raw/twitter_*.json
cat INTEL_SCRAPING/events_culture/raw/twitter_*.json | jq '.tweets | length'
```

---

## 💡 Raccomandazioni Finali

### **Per Sviluppo (Local)**
→ **Usa Pyenv + Python 3.11** (Soluzione 1)
- Massima compatibilità
- No API keys needed
- Veloce e affidabile

### **Per Produzione (Server)**
→ **Usa Tweepy + API Keys** (Soluzione 2)
- Più stabile long-term
- Rate limits chiari (500K/month free)
- Manutenuto attivamente

### **Per Testing Rapido**
→ **Usa Nitter** (Soluzione 3)
- No setup required
- Buono per demo/prototype
- Più lento ma funziona sempre

---

## 📧 Supporto

Se problemi persistono:
1. Check logs: `intel_automation_*.log`
2. Test manuale: `snscrape --version`
3. Report error: zero@balizero.com

---

**TL;DR**: Installa Python 3.11 con pyenv, reinstalla snscrape, profit! 🎉
