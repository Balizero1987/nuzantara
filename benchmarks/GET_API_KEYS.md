# 🔑 API Keys Setup - READY IN 5 MINUTES

## Status: .env file created ✅

**Location:** `/Users/antonellosiano/Desktop/NUZANTARA-FLY/benchmarks/.env`

---

## Step 1: Get Anthropic API Key (2 min)

1. Open: https://console.anthropic.com/settings/keys
2. Click **"Create Key"**
3. Copy the key starting with `sk-ant-api03-...`

## Step 2: Get Google API Key (2 min)

1. Open: https://aistudio.google.com/apikey
2. Click **"Create API Key"**
3. Copy the key starting with `AIzaSy...`

## Step 3: Add Keys to .env (1 min)

Open the file:
```bash
nano /Users/antonellosiano/Desktop/NUZANTARA-FLY/benchmarks/.env
```

Replace the placeholder values with your real keys:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-REAL-KEY-HERE
GOOGLE_API_KEY=AIzaSy-YOUR-REAL-KEY-HERE
```

Save and exit (Ctrl+X, then Y, then Enter)

---

## Step 4: Run POC Benchmark

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/benchmarks
bash run_poc.sh
```

**Expected runtime:** 5-10 minutes (100 queries)
**Expected cost:** ~$0.025 total
**Output:** Detailed JSON results + console summary with recommendation

---

## Quick Copy-Paste Commands

```bash
# Open Anthropic console
open https://console.anthropic.com/settings/keys

# Open Google AI Studio
open https://aistudio.google.com/apikey

# Edit .env file
nano /Users/antonellosiano/Desktop/NUZANTARA-FLY/benchmarks/.env

# Run benchmark (after keys are added)
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/benchmarks && bash run_poc.sh
```

---

## Alternative: Manual Run

If you prefer to set keys directly in terminal:

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
export GOOGLE_API_KEY="AIzaSy-your-key-here"

cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/benchmarks
python3 gemini_vs_haiku_poc.py
```

---

**Ready to execute as soon as API keys are configured!** 🚀
