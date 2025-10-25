# 🤖 Zantara AutoFix - Automated Testing & Deployment

Automated workflow that:
1. 🧪 Runs tests (local + production)
2. 🔍 Analyzes failures with Claude AI
3. 🔧 Generates and applies fixes
4. 💾 Commits and pushes to GitHub
5. 🚀 Monitors Railway deployment
6. ✅ Verifies production
7. 🔄 Repeats up to 3 times

**Based on the 4-hour manual session from 2025-10-25** (see `../ZANTARA_SESSION_REPORT_2025-10-25.md`)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd .autofix
pip install -r requirements.txt
```

### 2. Run AutoFix

```bash
# Make sure ANTHROPIC_API_KEY is set
export ANTHROPIC_API_KEY="your-key-here"

# Run full cycle (max 3 iterations)
python orchestrator.py

# Dry run (test without making changes)
python orchestrator.py --dry-run

# Custom max iterations
python orchestrator.py --max-iter 5
```

---

## 📊 What It Tests

### Production Tests (ONLY)
- ✅ Health check (`https://scintillating-kindness-production-47e3.up.railway.app/health`)
- ✅ **Pricing test**: Verifies "Quanto costa KITAS E23?" returns real prices (26M/28M IDR)

**Note**: AutoFix tests ONLY production, not localhost.

**If all tests pass**: ✅ Done!
**If tests fail**: Automatically analyzes, fixes, deploys, and retests.

---

## 🔄 Workflow Details

```
START
  ↓
Run Tests
  ↓ FAIL
Claude Analysis (AI)
  ↓
Generate Fix (AI)
  ↓
Apply Fix
  ↓
Commit & Push
  ↓
Wait for Deploy (3-5 mins)
  ↓
Retest Production
  ↓
SUCCESS or Repeat (max 3x)
```

---

## 💰 Cost

**Per cycle** (3 iterations max):
- Claude API calls: ~$0.15-0.25
- Uses the **same API key** as Claude Code
- If you have Claude Code, this uses your existing quota

**vs Manual**:
- Time: 30 min vs 4 hours (8x faster)
- Cost: $0.25 vs $100-200 developer time (400x-800x ROI)

---

## 📁 Output

### State File
```
.autofix/autofix_state.json
```

Contains:
- All cycle history
- Test results
- Claude analyses
- Fixes applied
- Deploy status

### Example State
```json
{
  "cycles": [
    {
      "cycle_id": "20251025_162000",
      "status": "success",
      "iterations": [
        {
          "iteration": 1,
          "test_results": {...},
          "analysis": {
            "root_cause": "...",
            "confidence": 0.85
          },
          "fix": {
            "fixes": [...]
          }
        }
      ]
    }
  ]
}
```

---

## 🎯 Real-World Examples

### Bug 1: Duplicate Responses
**Symptom**: Chat responses appear 2x-4x
**AutoFix**: Detected via production test, analyzed with Claude, added `removeAllListeners()`, deployed, verified
**Time**: ~8 minutes (vs 1 hour manual)

### Bug 2: Tools Not Loaded
**Symptom**: Backend logs "Loaded 0 tools for AI"
**AutoFix**: Detected via logs, analyzed root cause (TS backend offline), fixed `tool_executor.py`, deployed, verified
**Time**: ~10 minutes (vs 1.5 hours manual)

### Bug 3: Missing Pricing Data
**Symptom**: Railway logs "Pricing file not found"
**AutoFix**: Detected via production pricing test, analyzed `.dockerignore`, added exception, deployed, verified real prices
**Time**: ~8 minutes (vs 1.5 hours manual)

**Total**: ~26 minutes vs 4 hours manual (9x faster)

---

## ⚠️ When AutoFix Alerts You

AutoFix will **stop and alert** if:
- ❌ Max iterations reached (3 by default)
- ❌ Claude confidence < 50%
- ❌ Build fails
- ❌ Deploy timeout (>5 minutes)
- ❌ Production goes down

**Exit codes**:
- `0` = Success
- `1` = Failed (check state.json)
- `130` = User interrupted (Ctrl+C)

---

## 🛠️ Configuration

### Environment Variables

```bash
# Required
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional
export PRODUCTION_URL="https://your-app.railway.app"
export MAX_ITERATIONS=3
export DEPLOY_TIMEOUT=300  # seconds
```

### Custom Tests

Edit `orchestrator.py` to add custom tests:

```python
def _run_custom_test(self) -> Dict:
    """Your custom test"""
    # ... your test logic
    return {"passed": True/False, "details": "..."}
```

---

## 📈 Monitoring

### Check State

```bash
# View last cycle
python -c "import json; print(json.dumps(json.load(open('.autofix/autofix_state.json'))['cycles'][-1], indent=2))"

# Count cycles
python -c "import json; print(len(json.load(open('.autofix/autofix_state.json'))['cycles']))"

# Success rate
python -c "import json; cycles = json.load(open('.autofix/autofix_state.json'))['cycles']; print(f'{sum(1 for c in cycles if c.get(\"status\") == \"success\") / len(cycles) * 100:.1f}% success rate')"
```

---

## 🚀 Advanced Usage

### Run on Schedule (Cron)

```bash
# crontab -e
# Run every night at 2 AM
0 2 * * * cd /path/to/NUZANTARA-RAILWAY/.autofix && python orchestrator.py >> autofix.log 2>&1
```

### Run After Deploy (GitHub Action)

```yaml
# .github/workflows/autofix.yml
name: AutoFix After Deploy
on:
  push:
    branches: [main]

jobs:
  autofix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install deps
        run: pip install -r .autofix/requirements.txt
      - name: Run AutoFix
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: python .autofix/orchestrator.py
```

---

## 🐛 Debugging

### Dry Run Mode

```bash
# Test workflow without making changes
python orchestrator.py --dry-run
```

### Verbose Logging

```bash
# Add to orchestrator.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Manual Step-by-Step

```python
from orchestrator import AutoFixOrchestrator

orch = AutoFixOrchestrator(dry_run=True)

# Run individual steps
results = orch.run_tests()
analysis = orch.analyze_failures_with_claude(results)
fix = orch.generate_fix_with_claude(analysis)
# ... etc
```

---

## 📚 Related Files

- **Session Report**: `../ZANTARA_SESSION_REPORT_2025-10-25.md` - Manual session that inspired this
- **Multi-Agent Proposal**: `../MULTI_AGENT_AUTOMATION_REQUEST.md` - Original architecture ideas

---

## 🤝 Contributing

Improvements welcome! Focus areas:
1. Better error pattern recognition
2. More comprehensive tests
3. Faster deployment monitoring
4. Self-learning from successful fixes

---

## 📄 License

MIT - Use freely for your projects

---

**Made with ❤️ by the Zantara team**
**Powered by Claude Code & Anthropic API**
