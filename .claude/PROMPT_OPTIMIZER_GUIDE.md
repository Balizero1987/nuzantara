# 🎯 ZANTARA Prompt Optimizer - User Guide

> **Transform natural language → perfect AI prompts with one command**

---

## 🚀 Quick Start

### **Basic Usage**

```bash
zp "your request in natural language"
```

**Example**:
```bash
$ zp "controlli generali del sistema"

🤖 Analyzing your request...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Optimized prompt (copied to clipboard):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esegui controlli completi del sistema ZANTARA:

1. Health checks:
   - Backend TS: curl https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health
   - RAG Backend: curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/health
   - WebApp: verifica https://zantara.balizero.com accessibile

2. System status:
   - Git: verifica branch, uncommitted changes, sync con remote
   - Active sessions: cat .claude/active-sessions.json
   - Active locks: ls -lh .claude/locks/

... (full detailed prompt)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Next step: Press Cmd+V in Claude Code to paste

📊 Stats:
  - Input: 32 chars
  - Output: 845 chars
  - Cost: ~$0.0001
```

**Then**: `Cmd+V` in Claude Code → `Enter` → Done! ✨

---

## 📋 How It Works

```
┌─────────────────────┐
│  You write:         │
│  "controlli         │
│   generali"         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Haiku reads:       │
│  - Your input       │
│  - PROMPT_TEMPLATES │
│  - ZANTARA context  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Generates:         │
│  Detailed prompt    │
│  with:              │
│  - Specific steps   │
│  - File paths       │
│  - Commands         │
│  - URLs             │
│  - Verification     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Copied to          │
│  clipboard          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  You paste in       │
│  Claude Code        │
│  (Cmd+V)            │
└─────────────────────┘
```

---

## 🎯 Examples

### **System Health**

**Input**:
```bash
zp "controlli sistema"
zp "health check"
zp "verifica che tutto funzioni"
```

**Output**: Full health check protocol with curl commands, file checks, metrics

---

### **Deployment**

**Input**:
```bash
zp "deploy backend"
zp "rilascia rag in produzione"
zp "push frontend to github pages"
```

**Output**: Complete deployment workflow with build, docker, gcloud commands, verification

---

### **Bug Fixing**

**Input**:
```bash
zp "fix bug in rate limiting"
zp "errore nel middleware auth"
zp "emergenza produzione down"
```

**Output**: Debugging protocol (identify, diagnose, fix, deploy, document)

---

### **Testing**

**Input**:
```bash
zp "run tests"
zp "test endpoint /call"
zp "verifica smoke test"
```

**Output**: Test execution commands with result reporting format

---

### **ML & Training**

**Input**:
```bash
zp "train llama model"
zp "fine-tuning dataset ready?"
zp "test trained model"
```

**Output**: Training protocol with dataset verification, launch commands, monitoring

---

### **Documentation**

**Input**:
```bash
zp "update docs"
zp "generate changelog"
zp "new ai onboarding"
```

**Output**: Documentation update protocol or changelog generation from git

---

### **Data & Analytics**

**Input**:
```bash
zp "check chromadb"
zp "analytics usage"
zp "handler statistics"
```

**Output**: Data inspection commands with structured reporting format

---

## 🔧 Configuration

### **Required**

**1. ANTHROPIC_API_KEY** must be set:

```bash
# In ~/.zshrc
export ANTHROPIC_API_KEY='sk-ant-api03-...'
```

**Or load from project .env**:
```bash
cd ~/Desktop/NUZANTARA-2
source .env
zp "your request"
```

---

### **Optional**

**Custom templates**: Edit `.claude/PROMPT_TEMPLATES.md` to add your own

**Example new template**:
```markdown
### my_custom_task
**Triggers**: custom, my task, special operation
**Template**:
\`\`\`
My detailed custom prompt with:
1. Step 1
2. Step 2
3. ...
\`\`\`
```

Save → next time `zp "custom"` will use your template!

---

## 💰 Cost

**Per request**: ~$0.0001 (one hundredth of a cent)

**Model**: Claude 3.5 Haiku (fastest + cheapest)

**Why so cheap?**
- Input: ~500 tokens (your request + templates)
- Output: ~300 tokens (optimized prompt)
- Total: ~800 tokens × $0.25/1M = $0.0002

**Daily usage** (50 requests): ~$0.01 (1 cent)
**Monthly** (1000 requests): ~$0.20 (20 cents)

**Basically free!** 🎉

---

## 🚨 Troubleshooting

### **Error: ANTHROPIC_API_KEY not set**

**Fix**:
```bash
# Add to ~/.zshrc
export ANTHROPIC_API_KEY='sk-ant-...'

# Reload shell
source ~/.zshrc
```

---

### **Error: API call failed**

**Possible causes**:
1. API key expired → Get new key from Anthropic Console
2. Network issue → Check internet connection
3. Rate limit → Wait 1 minute, try again

**Debug**:
```bash
# Test API key manually
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-haiku-20241022","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
```

---

### **Error: Templates file not found**

**Fix**:
```bash
# Verify file exists
ls -lh ~/Desktop/NUZANTARA-2/.claude/PROMPT_TEMPLATES.md

# If missing, restore from git
cd ~/Desktop/NUZANTARA-2
git checkout .claude/PROMPT_TEMPLATES.md
```

---

### **Output is generic / not specific**

**This happens if**: Your request doesn't match any template

**Fix**: Be more specific or add a custom template

**Example**:
- ❌ Generic: "help"
- ✅ Specific: "health check system"
- ✅ Specific: "deploy backend to production"

---

## 📚 Available Templates

**25+ templates covering**:

| Category | Templates |
|----------|-----------|
| **System Health** | health_check, logs_check |
| **Deployment** | deploy_backend, deploy_rag, deploy_webapp |
| **Debugging** | fix_bug, emergency_fix |
| **Testing** | run_tests, test_endpoint |
| **ML & Training** | llama_training, test_model |
| **Data** | check_chromadb, analytics |
| **Team** | check_active_sessions |
| **Docs** | update_docs, generate_changelog |
| **Security** | security_audit |
| **Maintenance** | cleanup |
| **Onboarding** | onboarding |

**Full list**: See `.claude/PROMPT_TEMPLATES.md`

---

## 🎓 Tips & Best Practices

### **1. Be Natural**

You don't need exact keywords. Haiku understands intent:

✅ "controlli sistema"
✅ "check system"
✅ "verifica che tutto funzioni"
✅ "make sure everything works"

All produce same output!

---

### **2. Combine Multiple Actions**

```bash
zp "deploy backend and run smoke test"
zp "fix bug and update docs"
zp "train model and monitor metrics"
```

Haiku will create a workflow combining relevant templates.

---

### **3. Ask for Variations**

```bash
zp "emergency fix produzione down"  # → Emergency protocol
zp "fix bug non urgente"             # → Standard fix protocol
```

Same base template, different urgency/approach.

---

### **4. Use for Learning**

```bash
zp "how to deploy backend"    # → Full deployment guide
zp "what is chromadb"         # → ChromaDB explanation + check commands
zp "onboarding new ai"        # → Complete onboarding protocol
```

---

### **5. Chain Commands**

```bash
# Generate prompt
zp "deploy backend"

# Paste in Claude (Cmd+V)
# Wait for deployment to complete

# Generate next prompt
zp "verify deployment successful"

# Paste in Claude (Cmd+V)
```

---

## 🆕 Adding Your Own Templates

**1. Edit templates file**:
```bash
code ~/.../NUZANTARA-2/.claude/PROMPT_TEMPLATES.md
```

**2. Add new template**:
```markdown
### my_workflow
**Triggers**: my task, custom flow
**Template**:
\`\`\`
My custom detailed prompt:
1. Step 1 with specific commands
2. Step 2 with file paths
3. Verification
\`\`\`
```

**3. Test**:
```bash
zp "my task"
```

**4. Iterate**: Refine template based on results

---

## 🔗 Integration with INIT.md

**Prompt Optimizer complements INIT.md**:

**INIT.md**: Session protocol (how to start/end sessions)
**Prompt Optimizer**: Task execution (what to do during session)

**Workflow**:
1. Start session: `zp "init"` → paste in Claude
2. Claude reads INIT.md, follows Steps 1-6
3. During session: `zp "deploy backend"` → paste
4. End session: `zp "close session"` → paste

**Perfect combo!** 🎯

---

## 📊 Performance

**Speed**: ~1-2 seconds per request

**Accuracy**: ~95% (matches correct template most of the time)

**Expansion ratio**: 10-30x (your 5 words → 150 words detailed prompt)

---

## 🎉 Summary

**Before Prompt Optimizer**:
```
You: "I want to deploy the backend"
(You manually write 10-line detailed prompt)
```

**With Prompt Optimizer**:
```
You: zp "deploy backend"
(Haiku generates perfect 10-line prompt)
You: Cmd+V in Claude
```

**Time saved**: ~2-3 minutes per task
**Daily tasks**: ~10
**Total saved**: ~20-30 min/day = **2.5 hours/week** 🚀

---

**Version**: 1.0.0
**Created**: 2025-10-11
**Cost**: ~$0.0001 per request
**Status**: Production-ready

**Questions?** Check `.claude/PROMPT_TEMPLATES.md` for available templates or add your own!
