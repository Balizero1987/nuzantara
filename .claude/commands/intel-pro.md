---
name: intel-pro
description: Run Intel Scraping PRO pipeline with retry, quality validation, and auto-deploy
---

Execute the PRO orchestrator for Intel Scraping:

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY
python3 website/INTEL_SCRAPING/src/orchestrator_pro.py
```

Features:
- ✅ Parallel scraping (7 categories simultaneous)
- ✅ Auto-retry with exponential backoff (3 attempts)
- ✅ Quality validation (80% threshold)
- ✅ Real-time progress tracking
- ✅ Auto commit & deploy if quality passes

Options:
- `--categories business,ai_tech` - Specific categories
- `--threshold 0.9` - Quality threshold (default: 0.8)
- `--retries 5` - Max retries (default: 3)
