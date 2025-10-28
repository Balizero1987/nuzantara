#!/bin/bash
# Auto-detect e ingresso window

WINDOW=$1
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S")

if [ -z "$WINDOW" ]; then
  echo "❌ Uso: ./enter-window.sh W1|W2|W3|W4"
  exit 1
fi

# Verifica formato window
if [[ ! "$WINDOW" =~ ^W[1-4]$ ]]; then
  echo "❌ Window ID deve essere W1, W2, W3, o W4"
  exit 1
fi

WINDOW_FILE=".claude/CURRENT_SESSION_${WINDOW}.md"
COORDINATION_FILE=".claude/AI_COORDINATION.md"

# Verifica se window è libera
if grep -q "$WINDOW.*🟢 Active" "$COORDINATION_FILE" 2>/dev/null; then
  echo "❌ ERROR: Window $WINDOW è già occupata!"
  echo ""
  echo "Stato attuale:"
  grep "$WINDOW" "$COORDINATION_FILE"
  echo ""
  echo "📖 Leggi .claude/AI_COORDINATION.md per dettagli completi"
  exit 1
fi

# Rileva AI model
AI_MODEL="claude-sonnet-4.5"
if [ -n "$ANTHROPIC_MODEL" ]; then
  AI_MODEL=$(echo $ANTHROPIC_MODEL | grep -oE "claude-[^\"]*" || echo "claude-sonnet-4.5")
fi

# Marca window come attiva
if [ "$(uname)" = "Darwin" ]; then
  # macOS
  sed -i '' "s|$WINDOW.*Available.*⚪️ Idle.*|$WINDOW \| $AI_MODEL \| Working \| 🟢 Active \| $TIMESTAMP \| - \| $TIMESTAMP|" "$COORDINATION_FILE"
else
  # Linux
  sed -i "s|$WINDOW.*Available.*⚪️ Idle.*|$WINDOW | $AI_MODEL | Working | 🟢 Active | $TIMESTAMP | - | $TIMESTAMP|" "$COORDINATION_FILE"
fi

echo "✅ Window $WINDOW assegnata"
echo ""
echo "📖 NEXT STEPS:"
echo "   1. Leggi: cat .claude/AI_COORDINATION.md"
echo "   2. Locks: cat .claude/locks/active.txt"
echo "   3. Dichiara lock: echo 'path/** → $WINDOW (reason) [$(date +%H:%M)]' >> .claude/locks/active.txt"
echo ""
echo "📝 Il tuo file sessione: $WINDOW_FILE"
echo "🔒 Check lock prima di modificare: bash .claude/scripts/check-lock.sh <file> $WINDOW"
echo ""
echo "🚀 Pronto per lavorare!"
