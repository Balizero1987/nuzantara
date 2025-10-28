#!/bin/bash
# Auto-sync ogni 5 minuti

COORDINATION_FILE=".claude/AI_COORDINATION.md"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S")

# Calcola next sync (+5 minuti)
if [ "$(uname)" = "Darwin" ]; then
  NEXT_SYNC=$(date -u -v+5M +"%Y-%m-%d %H:%M:%S" 2>/dev/null)
else
  NEXT_SYNC=$(date -u -d "+5 minutes" +"%Y-%m-%d %H:%M:%S" 2>/dev/null)
fi

# Fallback se calcolo data fallisce
if [ -z "$NEXT_SYNC" ]; then
  NEXT_SYNC="$TIMESTAMP (+5min)"
fi

# Aggiorna timestamp usando awk invece di sed per evitare problemi con **
if [ "$(uname)" = "Darwin" ]; then
  awk -v ts="$TIMESTAMP" '{
    if ($0 ~ /\*\*Ultimo aggiornamento\*\*:/) {
      print "**Ultimo aggiornamento**: " ts " UTC"
    } else if ($0 ~ /\*\*Last sync\*\*:/) {
      print "**Last sync**: " ts
    } else if ($0 ~ /\*\*Next sync\*\*:/) {
      print "**Next sync**: '"$NEXT_SYNC"'"
    } else {
      print $0
    }
  }' "$COORDINATION_FILE" > "$COORDINATION_FILE.tmp" && mv "$COORDINATION_FILE.tmp" "$COORDINATION_FILE"
else
  awk -v ts="$TIMESTAMP" '{
    if ($0 ~ /\*\*Ultimo aggiornamento\*\*:/) {
      print "**Ultimo aggiornamento**: " ts " UTC"
    } else if ($0 ~ /\*\*Last sync\*\*:/) {
      print "**Last sync**: " ts
    } else if ($0 ~ /\*\*Next sync\*\*:/) {
      print "**Next sync**: '"$NEXT_SYNC"'"
    } else {
      print $0
    }
  }' "$COORDINATION_FILE" > "$COORDINATION_FILE.tmp" && mv "$COORDINATION_FILE.tmp" "$COORDINATION_FILE"
fi

# Verifica locks scaduti (>2 ore)
LOCK_FILE=".claude/locks/active.txt"
if [ -f "$LOCK_FILE" ] && [ -s "$LOCK_FILE" ]; then
  CURRENT_HOUR=$(date -u +%H)
  CURRENT_MIN=$(date -u +%M)
  CURRENT_TOTAL=$((CURRENT_HOUR * 60 + CURRENT_MIN))
  
  while IFS= read -r line; do
    if [[ "$line" =~ \[([0-9]{2}):([0-9]{2})\] ]]; then
      LOCK_HOUR=${BASH_REMATCH[1]}
      LOCK_MIN=${BASH_REMATCH[2]}
      LOCK_TOTAL=$((10#$LOCK_HOUR * 60 + 10#$LOCK_MIN))
      DIFF=$((CURRENT_TOTAL - LOCK_TOTAL))
      
      # Se lock > 120 minuti (2 ore)
      if [ $DIFF -gt 120 ]; then
        echo "[$(date -u +%H:%M:%S)] ⚠️  Lock scaduto (>2h): $line" >> .claude/logs/sync.log
      fi
    fi
  done < "$LOCK_FILE"
fi

echo "[$(date -u +%H:%M:%S)] Sync completato" >> .claude/logs/sync.log

# Rotazione log se > 1000 righe
if [ -f ".claude/logs/sync.log" ]; then
  LOGLINES=$(wc -l < .claude/logs/sync.log | tr -d ' ')
  if [ "$LOGLINES" -gt 1000 ]; then
    tail -500 .claude/logs/sync.log > .claude/logs/sync.log.tmp
    mv .claude/logs/sync.log.tmp .claude/logs/sync.log
    echo "[$(date -u +%H:%M:%S)] Log rotated (kept last 500 lines)" >> .claude/logs/sync.log
  fi
fi
