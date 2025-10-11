# 🚀 Multi-CLI Coordination Guide

> **Use Case**: Running 2-6 Claude Code CLIs simultaneously on NUZANTARA-2

---

## 🎯 Quick Start

### **Opening Multiple CLIs**

**CLI Window 1**:
```bash
cd ~/Desktop/NUZANTARA-2
# Say to Claude: "Leggi .claude/INIT.md e segui Step 1-6. Dimmi quando sei pronto."
```

**CLI Window 2** (5 minutes later):
```bash
cd ~/Desktop/NUZANTARA-2
# Say to Claude: "Leggi .claude/INIT.md e segui Step 1-6. Dimmi quando sei pronto."
```

**CLI Window 3-6**: Same as above

---

## 🔒 How Lock System Works

### **Automatic Coordination**

When CLI starts (Step 5.5):
1. ✅ Registers in `.claude/active-sessions.json`
2. ✅ Checks if categories are locked
3. ✅ Creates locks for detected categories
4. ✅ Proceeds with work

### **Conflict Detection**

**Example**: CLI m2 tries to work on same category as CLI m1

```
🔴 CONFLICT DETECTED!
Category: backend-handlers
Locked by:
2025-10-11 18:45:30 | sonnet-4.5 m1 | PID: 12345 | Task: fix rate limiting

Options:
1. Wait for other CLI to finish (check diary for ETA)
2. Choose different task/category
3. Coordinate with other CLI (ask user)

Continue anyway (risky)? [y/N]
```

**You choose**:
- Press `N` → CLI stops, you assign different task
- Press `Y` → CLI proceeds anyway (⚠️ risk of merge conflicts)

---

## 📊 Check Active Sessions

### **See what other CLIs are doing**:

```bash
cat .claude/active-sessions.json
```

**Output**:
```json
{
  "sessions": [
    {
      "id": "m1",
      "model": "sonnet-4.5",
      "started": "2025-10-11T18:45:30Z",
      "task": "fix rate limiting bugs",
      "categories": ["backend-handlers", "middleware"],
      "files_editing": ["src/middleware/rate-limit.ts"],
      "status": "in_progress"
    },
    {
      "id": "m2",
      "model": "opus-4.1",
      "started": "2025-10-11T18:50:00Z",
      "task": "deploy RAG backend",
      "categories": ["deploy-rag"],
      "files_editing": ["apps/backend-rag 2/backend/app/main_cloud.py"],
      "status": "in_progress"
    }
  ]
}
```

---

## 🎯 Best Practices

### **✅ DO**:
1. **Assign non-overlapping tasks** to different CLIs
   - CLI m1: Backend handlers
   - CLI m2: RAG backend
   - CLI m3: Frontend
   - CLI m4: Documentation

2. **Check active sessions before starting**:
   ```bash
   cat .claude/active-sessions.json
   ```

3. **Let lock system work** - If conflict detected, choose different task

4. **Use specific categories**:
   - Good: "fix backend-handlers rate limiting"
   - Bad: "fix everything" (too broad, locks many categories)

### **❌ DON'T**:
1. **Override locks without checking** - Risk of merge conflicts
2. **Force multiple CLIs on same file** - Git will cry
3. **Delete `.claude/locks/` manually** - Let Exit Protocol handle it

---

## 🚨 Emergency Cleanup

### **If CLIs crash without cleanup**:

```bash
# Remove all stale locks
rm -f .claude/locks/*.lock

# Reset active sessions
echo '{"sessions":[]}' > .claude/active-sessions.json
```

---

## 📝 Example Scenarios

### **Scenario 1: 3 CLIs working in parallel** ✅

```
CLI m1 (sonnet-4.5): backend-handlers → Locked ✅
CLI m2 (opus-4.1):   deploy-rag       → Locked ✅
CLI m3 (sonnet-4.5): frontend-ui      → Locked ✅

Result: Zero conflicts, parallel work, clean git history
```

### **Scenario 2: Conflict detected** ⚠️

```
CLI m1: backend-handlers (started 18:45)
CLI m2: tries backend-handlers (started 18:50)

System: 🔴 CONFLICT! backend-handlers locked by m1

Action: m2 switches to "deploy-rag" instead
Result: ✅ No conflicts
```

### **Scenario 3: 6 CLIs maximum efficiency** 🚀

```
m1: backend-handlers
m2: deploy-rag
m3: frontend-ui
m4: security-audit
m5: llama4-training (external, no locks needed)
m6: documentation

Result: 6x productivity, zero conflicts
```

---

## 🔧 Advanced: Manual Lock Check

### **Before assigning task to new CLI**:

```bash
# Check current locks
ls -lh .claude/locks/

# Check specific category
cat .claude/locks/backend-handlers.lock

# Output shows:
# 2025-10-11 18:45:30 | sonnet-4.5 m1 | PID: 12345 | Task: fix rate limiting
```

**If locked**: Assign different task to new CLI

**If not locked**: Safe to proceed

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `.claude/active-sessions.json` | Real-time session registry |
| `.claude/locks/*.lock` | Category locks (temporary) |
| `.claude/locks/README.md` | Lock system documentation |
| `.claude/INIT.md` (Step 5.5) | Auto-coordination protocol |

---

## ✅ Quick Checklist

Before starting new CLI:
- [ ] Check `active-sessions.json` for conflicts
- [ ] Assign task to different category if needed
- [ ] Trust the lock system (Step 5.5 auto-checks)
- [ ] Let CLI auto-register and create locks
- [ ] Work normally, locks auto-cleanup on exit

---

**Version**: 1.0.0
**Created**: 2025-10-11
**Tested**: ✅ Fully operational
**Status**: Production-ready

For detailed protocol, see `.claude/INIT.md` Step 5.5.
