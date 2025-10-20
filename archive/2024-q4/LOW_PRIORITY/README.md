# 🔵 LOW PRIORITY APPS

**Purpose**: Apps that are utility tools, prototypes, or premature optimizations
**Action**: Keep for future use, but don't prioritize development/deployment

---

## 📦 APPS IN THIS FOLDER (5)

### 1. **analytics/** 📈
- **Status**: 🚧 PROTOTYPE
- **Potential**: 6/10 (useful when scale increases)
- **Why Low Priority**: Premature optimization
- **What It Does**:
  - BigQuery ETL pipeline (`bigquery/etl-pipeline.py`)
  - Real-time analytics streaming
  - ML predictive analytics
- **When Useful**: Quando traffico > 10K requests/day
- **Current Need**: ❌ Not needed yet (traffico basso)

**Recommendation**: Keep for future, revisit quando scale aumenta

---

### 2. **dashboard/** 📊
- **Status**: 🟡 PROTOTYPE (UI only)
- **Potential**: 6/10 (needs backend)
- **Why Low Priority**: Missing backend data source
- **What It Does**:
  - Chart.js visualizations
  - Socket.io real-time updates
  - "Zantara Bridge AI Command Center" UI
- **What's Missing**:
  - ❌ Backend che fornisce dati
  - ❌ Database analytics queries
  - ❌ Integration con backend-rag 2

**Recommendation**: Complete when backend analytics API is ready

---

### 3. **performance/** 🏎️
- **Status**: ✅ FUNCTIONAL
- **Potential**: 5/10 (dev tool)
- **Why Low Priority**: Development/testing tool only
- **What It Does**:
  - Artillery.io load testing configurations
  - Custom load test functions
  - Performance benchmarking
- **Use Cases**:
  - Load testing backend before big releases
  - Capacity planning
  - Performance regression testing

**Recommendation**: Keep as dev tool, use before major deployments

---

### 4. **workspace-web/** 🌐
- **Status**: 🟡 ALTERNATIVE UI
- **Potential**: 5/10 (redundant)
- **Why Low Priority**: Duplicate of `apps/webapp/`
- **What It Does**:
  - Enhanced web interface
  - Dark mode backgrounds
  - Animated loading lotus
  - Team avatar backgrounds
  - Mobile splash screens
- **Deployment Options**:
  - Cloudflare Workers (`wrangler.toml`)
  - Netlify (`_redirects`)
- **Why Redundant**: `apps/webapp/` already deployed and working

**Recommendation**: Archive or merge unique features into `apps/webapp/`

---

### 5. **ml/** 🤖
- **Status**: ✅ UTILITY SCRIPTS
- **Potential**: 7/10 (utility)
- **Why Low Priority**: Utility tool, not mission-critical
- **What It Does**:
  - HuggingFace Inference API clients
  - ZANTARA Llama 3.1: `zeroai87/zantara-llama-3.1-8b`
  - DevAI Qwen 2.5: `zeroai87/devai-qwen-2.5-coder-7b`
  - RunPod deployment setup
  - LoRA merging scripts
- **Use Cases**:
  - Testing custom models
  - Fallback when Claude API down
  - Cost optimization for simple queries
  - CLI access to fine-tuned models

**Usage**:
```bash
python3 ml/zantara/hf_inference.py "Your question"
python3 ml/devai/hf_inference.py "Your code question"
```

**Recommendation**: Keep as utility, useful for resilience + cost optimization

---

## 📊 PRIORITY RATIONALE

### Why These Are Low Priority:

1. **analytics/** - Premature (no traffic scale yet)
2. **dashboard/** - Incomplete (missing backend)
3. **performance/** - Dev tool (not production)
4. **workspace-web/** - Redundant (webapp exists)
5. **ml/** - Utility (nice to have, not essential)

### When to Revisit:

| App | Condition to Revisit |
|-----|---------------------|
| analytics | Traffic > 10K requests/day |
| dashboard | Backend analytics API ready |
| performance | Before major release/scale test |
| workspace-web | Need mobile-specific features |
| ml | Claude API issues or cost becomes concern |

---

## 🔄 POSSIBLE ACTIONS

### Option 1: Keep As-Is
- Leave in LOW_PRIORITY folder
- Revisit when conditions met
- Document clearly why low priority

### Option 2: Archive
- Move to `archive/` folder at root
- Keep for reference but mark as inactive
- Focus only on HIGH_PRIORITY apps

### Option 3: Delete
- Only if absolutely certain not needed
- Create backup first in ~/Desktop/SCARTO/
- Free up space and mental overhead

---

## 📂 FOLDER STRUCTURE

```
apps/LOW_PRIORITY/
├── analytics/          # BigQuery ETL (premature)
├── dashboard/          # Monitoring UI (incomplete)
├── performance/        # Load testing (dev tool)
├── workspace-web/      # Alt UI (redundant)
└── ml/                 # HF clients (utility)
```

---

## 🎯 RECOMMENDATION

**Short Term (3 months)**:
- Keep in LOW_PRIORITY folder
- Don't allocate development time
- Monitor conditions for revisit

**Long Term (6-12 months)**:
- **analytics/** - Deploy when scale increases
- **dashboard/** - Complete when backend API ready
- **performance/** - Keep as dev tool
- **workspace-web/** - Archive or merge into webapp
- **ml/** - Keep as fallback utility

---

## 🚀 IF YOU NEED THESE URGENTLY

### analytics/ - Need analytics now?
→ Use Google Analytics + Railway metrics instead

### dashboard/ - Need monitoring now?
→ Use Railway dashboard + logs for now

### performance/ - Need load testing now?
→ Use Artillery configs, they're ready

### workspace-web/ - Need alt UI now?
→ Use apps/webapp/, it's already deployed

### ml/ - Need custom models now?
→ CLI scripts work, just run them directly

---

**Version**: 1.0
**Date**: 2025-10-17
**Status**: Deprioritized (revisit when conditions met)

*Focus on HIGH_PRIORITY apps first* 🎯
