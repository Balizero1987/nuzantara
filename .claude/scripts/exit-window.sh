#!/bin/bash
# Exit workflow con archiviazione flessibile

WINDOW=$1
TIMESTAMP=$(date -u +"%Y-%m-%d_%H-%M")
DATE=$(date -u +"%Y-%m-%d")
NOW=$(date -u +"%Y-%m-%d %H:%M:%S")

if [ -z "$WINDOW" ]; then
  echo "❌ Uso: ./exit-window.sh W1|W2|W3|W4"
  exit 1
fi

WINDOW_FILE=".claude/CURRENT_SESSION_${WINDOW}.md"
HANDOVER_DIR=".claude/handovers"
ARCHIVE_FILE=".claude/ARCHIVE_SESSIONS.md"
COORDINATION_FILE=".claude/AI_COORDINATION.md"
LOCK_FILE=".claude/locks/active.txt"

echo "🏁 Chiusura window $WINDOW..."

# 1. Rilascia locks
if [ -f "$LOCK_FILE" ]; then
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "/→ $WINDOW/d" "$LOCK_FILE"
  else
    sed -i "/→ $WINDOW/d" "$LOCK_FILE"
  fi
  echo "✅ Locks rilasciati per $WINDOW"
fi

# 2. Archiviazione flessibile
echo "📦 Archiviazione sessione $WINDOW..."

# Aggiungi separatore e timestamp
echo "" >> "$ARCHIVE_FILE"
echo "---" >> "$ARCHIVE_FILE"
echo "<!-- Archived: $NOW -->" >> "$ARCHIVE_FILE"
echo "" >> "$ARCHIVE_FILE"

# Appendi ad ARCHIVE_SESSIONS.md
cat "$WINDOW_FILE" >> "$ARCHIVE_FILE"
echo "" >> "$ARCHIVE_FILE"
echo "✅ Archiviato in ARCHIVE_SESSIONS.md"

# Crea handover separato se file > 100 righe
if [ -f "$WINDOW_FILE" ]; then
  LINES=$(wc -l < "$WINDOW_FILE" | tr -d ' ')
  if [ "$LINES" -gt 100 ]; then
    cp "$WINDOW_FILE" "$HANDOVER_DIR/${WINDOW}_${TIMESTAMP}.md"
    echo "✅ Handover salvato: handovers/${WINDOW}_${TIMESTAMP}.md (${LINES} righe)"
  fi
fi

# 3. Reset window status
if [ "$(uname)" = "Darwin" ]; then
  sed -i '' "s|$WINDOW.*|$WINDOW \| - \| Available \| ⚪️ Idle \| - \| - \| -|" "$COORDINATION_FILE"
else
  sed -i "s|$WINDOW.*|$WINDOW | - | Available | ⚪️ Idle | - | - | -|" "$COORDINATION_FILE"
fi

# 4. Reset CURRENT_SESSION file
if [ -f ".claude/CURRENT_SESSION.template.md" ]; then
  cp ".claude/CURRENT_SESSION.template.md" "$WINDOW_FILE"
else
  # Crea template base se non esiste
  cat > "$WINDOW_FILE" << 'EOF'
# 🔮 AI Session - Window WX

**Status**: ⚪️ Idle
**Started**: -
**AI Model**: -

---

## 🎯 Current Task
*Waiting for assignment...*

---

## 📝 Progress Log
*No activity yet*

---

## 🔒 Locked Resources
*None*

---

**Last Update**: -
EOF
fi
echo "✅ Window $WINDOW resettata e disponibile"

# 5. Cleanup handovers >7 giorni
DELETED=$(find "$HANDOVER_DIR" -name "${WINDOW}_*.md" -mtime +7 -delete -print 2>/dev/null | wc -l | tr -d ' ')
if [ "$DELETED" -gt 0 ]; then
  echo "✅ Cleanup: $DELETED handover(s) >7 giorni eliminati"
else
  echo "✅ Cleanup: nessun handover obsoleto trovato"
fi

echo ""
echo "🏁 Exit completato per $WINDOW"
echo "📊 Stats aggiornate in AI_COORDINATION.md"
echo "💾 Sessione archiviata in ARCHIVE_SESSIONS.md"
echo ""
echo "✨ Window $WINDOW ora disponibile per nuovo AI"
