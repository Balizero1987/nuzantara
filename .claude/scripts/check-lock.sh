#!/bin/bash
# Hard lock check - chiama prima di modificare file

FILE_PATH=$1
WINDOW=$2
LOCK_FILE=".claude/locks/active.txt"

if [ -z "$FILE_PATH" ] || [ -z "$WINDOW" ]; then
  echo "❌ Uso: ./check-lock.sh <path> <window>"
  echo "   Esempio: ./check-lock.sh apps/backend-ts/src/handlers/ai.ts W2"
  exit 1
fi

# Verifica formato window
if [[ ! "$WINDOW" =~ ^W[1-4]$ ]]; then
  echo "❌ Window ID deve essere W1, W2, W3, o W4"
  exit 1
fi

# Se file locks non esiste o vuoto, nessun lock
if [ ! -f "$LOCK_FILE" ] || [ ! -s "$LOCK_FILE" ]; then
  echo "✅ No locks - procedi"
  exit 0
fi

# Normalizza path (rimuovi ./ se presente)
FILE_PATH=$(echo "$FILE_PATH" | sed 's|^\./||')

# Cerca lock esatto o pattern con **
LOCKED=false
LOCK_OWNER=""
LOCK_INFO=""

while IFS= read -r line; do
  # Skip righe vuote o commenti
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  
  # Estrai path dal lock
  LOCK_PATH=$(echo "$line" | cut -d'→' -f1 | xargs)
  
  # Check match esatto
  if [ "$LOCK_PATH" = "$FILE_PATH" ]; then
    LOCKED=true
    LOCK_OWNER=$(echo "$line" | grep -oE 'W[1-4]')
    LOCK_INFO="$line"
    break
  fi
  
  # Check pattern con **
  if [[ "$LOCK_PATH" == *"**" ]]; then
    BASE_PATH=$(echo "$LOCK_PATH" | sed 's|\*\*||')
    if [[ "$FILE_PATH" == "$BASE_PATH"* ]]; then
      LOCKED=true
      LOCK_OWNER=$(echo "$line" | grep -oE 'W[1-4]')
      LOCK_INFO="$line"
      break
    fi
  fi
done < "$LOCK_FILE"

# Se locked, verifica owner
if [ "$LOCKED" = true ]; then
  if [ "$LOCK_OWNER" != "$WINDOW" ]; then
    echo "🔴 HARD LOCK ERROR!"
    echo ""
    echo "File/directory: $FILE_PATH"
    echo "Locked by: $LOCK_OWNER"
    echo ""
    echo "Lock info:"
    echo "  $LOCK_INFO"
    echo ""
    echo "❌ Accesso negato."
    echo ""
    echo "Opzioni:"
    echo "  1. Scegli altro task/file"
    echo "  2. Chiedi override a user (casi eccezionali)"
    echo "  3. Aspetta che $LOCK_OWNER rilasci il lock"
    echo ""
    exit 1
  else
    echo "✅ File locked da te ($WINDOW) - procedi"
    exit 0
  fi
fi

echo "✅ No lock - procedi"
exit 0
