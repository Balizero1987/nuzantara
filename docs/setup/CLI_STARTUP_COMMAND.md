# 🚀 ZANTARA CLI Startup Command

## Copy & Paste This Command:

```
cd ~/Desktop/NUZANTARA && echo "📁 Working in: $(pwd)" && echo "📋 Reading startup docs..." && cat AI_START_HERE.md | head -35 && echo -e "\n📊 Last session summary:" && tail -20 HANDOVER_LOG.md && echo -e "\n✅ System health check:" && npm run health-check 2>/dev/null || echo "Server not running" && echo -e "\n📌 Current tasks:" && cat TODO_CURRENT.md 2>/dev/null | head -10 || echo "No TODO file found" && echo -e "\n🎯 Ready! Follow OPERATING_RULES.md for guidelines.\n💡 Quick commands: 'npm start' (start server) | 'npm run dev' (dev mode) | './test-all-handlers.sh' (test)"
```

## Or Use the Formatted Multi-line Version:

```bash
cd ~/Desktop/NUZANTARA && \
echo "🚀 ZANTARA v5.2.0 - Initializing..." && \
echo "=================================" && \
echo "📁 Location: $(pwd)" && \
echo "🌿 Branch: $(git branch --show-current 2>/dev/null || echo 'not in git')" && \
echo "📊 Status:" && \
npm run health-check 2>/dev/null || echo "  ⚠️  Local server not running (use: npm start)" && \
echo "" && \
echo "📋 Last Activity:" && \
tail -5 HANDOVER_LOG.md 2>/dev/null | sed 's/^/  /' || echo "  No handover log found" && \
echo "" && \
echo "📌 Current Tasks:" && \
head -5 TODO_CURRENT.md 2>/dev/null | sed 's/^/  /' || echo "  No TODO found" && \
echo "" && \
echo "🎯 Next Steps:" && \
echo "  1. Read: cat AI_START_HERE.md" && \
echo "  2. Test: npm run test:working" && \
echo "  3. Start: npm start (if needed)" && \
echo "  4. Deploy: ./deploy-rebuild.sh (when ready)" && \
echo "" && \
echo "✅ Environment ready! Check OPERATING_RULES.md for guidelines."
```

## Minimal Version (Quick Start):

```bash
cd ~/Desktop/NUZANTARA && cat AI_START_HERE.md | head -35 && npm run health-check
```

## Create an Alias (Optional):

Add this to your `~/.zshrc` or `~/.bashrc`:

```bash
alias zantara='cd ~/Desktop/NUZANTARA && echo "🚀 ZANTARA v5.2.0 Ready" && npm run health-check 2>/dev/null || echo "Server offline - use: npm start"'
```

Then just type `zantara` to start!

## What Each Command Does:

1. **`cd ~/Desktop/NUZANTARA`** - Navigate to project
2. **`cat AI_START_HERE.md`** - Show system overview
3. **`tail HANDOVER_LOG.md`** - Show recent activity
4. **`npm run health-check`** - Verify system status
5. **`cat TODO_CURRENT.md`** - Show pending tasks
6. **`echo guidelines`** - Remind about OPERATING_RULES.md

## Expected Output:

```
📁 Working in: /Users/antonellosiano/Desktop/NUZANTARA
📋 Reading startup docs...
# 🚀 AI OPERATIONAL BOOTSTRAP - ZANTARA v5.2.0 ChatGPT Patch
[... system info ...]

📊 Last session summary:
[... recent updates ...]

✅ System health check:
Server running on port 8080 ✓

📌 Current tasks:
- [ ] Populate Knowledge Base
- [ ] Implement GROQ handlers
[...]

🎯 Ready! Follow OPERATING_RULES.md for guidelines.
```