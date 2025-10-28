#!/bin/bash
# Setup cron per auto-sync ogni 5 minuti

REPO_PATH="$PWD"
CRON_ENTRY="*/5 * * * * cd $REPO_PATH && bash .claude/scripts/sync-coordination.sh >> .claude/logs/sync.log 2>&1"

echo "🔧 Setup cron job per auto-sync AI coordination..."

# Controlla se entry esiste già
if crontab -l 2>/dev/null | grep -q "sync-coordination.sh"; then
  echo "✅ Cron job già configurato"
  echo ""
  echo "Entry attuale:"
  crontab -l 2>/dev/null | grep "sync-coordination.sh"
  echo ""
  echo "Per rimuoverlo: crontab -e (poi cancella la riga)"
else
  # Aggiungi a crontab
  (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
  echo "✅ Cron job installato: sync ogni 5 minuti"
  echo ""
  echo "Entry creata:"
  echo "  $CRON_ENTRY"
  echo ""
fi

# Crea directory logs se non esiste
mkdir -p .claude/logs
touch .claude/logs/sync.log

echo "📁 Logs: .claude/logs/sync.log"
echo "📊 Monitoring: tail -f .claude/logs/sync.log"
echo ""
echo "🚀 Sistema auto-sync attivo!"
echo ""
echo "Per verificare: crontab -l | grep sync-coordination"
echo "Per disabilitare: crontab -e (poi cancella la riga)"
