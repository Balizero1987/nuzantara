#!/bin/bash
# Window 1 Setup - NUZANTARA

# Set window title
echo -ne "\033]0;W1 - NUZANTARA\007"

# Clear screen
clear

# Banner
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                    WINDOW 1 - NUZANTARA                    ║
║                   Railway Multi-AI System                  ║
╚════════════════════════════════════════════════════════════╝
EOF

echo ""
echo "🤖 AI Instance: W1"
echo "📅 Date: $(date '+%Y-%m-%d %H:%M UTC')"
echo "📂 Project: NUZANTARA-RAILWAY"
echo "🔧 Platform: Railway"
echo ""

# Quick Context
cat << "EOF"
📊 QUICK CONTEXT (30 sec):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System: Monorepo multi-AI
├─ Backend TypeScript (96 handlers)  → Port 8080
├─ Backend RAG Python (ChromaDB)     → Port 8000
└─ Webapp (vanilla JS)               → GitHub Pages

AI Systems:
├─ ZANTARA (Llama 3.1 8B)    → Customer-facing
└─ DevAI (Qwen 2.5 Coder 7B) → Internal dev (YOU)

Stack: TypeScript 5.9 + Express 5.1 + FastAPI + ChromaDB
Deploy: Railway (auto-deploy on git push)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

echo ""
echo "📖 NEXT STEPS:"
echo "   1. Read: .claude/PROJECT_CONTEXT.md (5 min)"
echo "   2. Open: .claude/CURRENT_SESSION_W1.md"
echo "   3. Check: tail -100 .claude/ARCHIVE_SESSIONS.md (recent work)"
echo ""

# Show last session summary if exists
if [ -f ".claude/ARCHIVE_SESSIONS.md" ]; then
    echo "📜 LAST SESSION SUMMARY:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -50 .claude/ARCHIVE_SESSIONS.md | grep -A 5 "Window: W" | tail -6
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
fi

# Create session file if doesn't exist
if [ ! -f ".claude/CURRENT_SESSION_W1.md" ]; then
    echo "🔨 Creating CURRENT_SESSION_W1.md from template..."
    cp .claude/CURRENT_SESSION.template.md .claude/CURRENT_SESSION_W1.md
    echo "✅ File created!"
fi

echo ""
echo "✅ Window W1 ready! Waiting for your task..."
echo ""
