#!/bin/bash

echo "🚀 ZANTARA - Google Chat Webhook Setup Assistant"
echo "================================================"
echo ""
echo "📋 Apro Google Chat per configurare il webhook..."
echo ""

# Apri Google Chat nel browser
open "https://chat.google.com"

echo "✅ Google Chat aperto nel browser!"
echo ""
echo "📌 ISTRUZIONI RAPIDE:"
echo "============================="
echo ""
echo "1️⃣  Crea un nuovo spazio o seleziona uno esistente"
echo "2️⃣  Clicca sul nome dello spazio in alto"
echo "3️⃣  Seleziona 'Gestisci webhook' (Manage webhooks)"
echo "4️⃣  Clicca 'AGGIUNGI WEBHOOK'"
echo "5️⃣  Nome: ZANTARA Bot"
echo "6️⃣  Copia l'URL generato"
echo ""
echo "📝 Poi incolla qui l'URL del webhook:"
read -p "Webhook URL: " WEBHOOK_URL

if [ ! -z "$WEBHOOK_URL" ]; then
    echo ""
    echo "✅ Aggiorno il file .env..."

    # Backup del .env
    cp .env .env.backup

    # Aggiungi o aggiorna il webhook URL
    if grep -q "GOOGLE_CHAT_WEBHOOK_URL" .env; then
        sed -i '' "s|.*GOOGLE_CHAT_WEBHOOK_URL.*|GOOGLE_CHAT_WEBHOOK_URL=$WEBHOOK_URL|" .env
    else
        echo "" >> .env
        echo "# Google Chat Webhook" >> .env
        echo "GOOGLE_CHAT_WEBHOOK_URL=$WEBHOOK_URL" >> .env
    fi

    echo "✅ Webhook configurato!"
    echo ""
    echo "🔄 Riavvio il server..."
    pkill -f "node dist/server.js"
    sleep 2
    npm start &

    sleep 3

    echo ""
    echo "📤 Invio messaggio di test..."

    curl -s -X POST http://localhost:8080/call \
      -H "Content-Type: application/json" \
      -d '{
        "key": "googlechat.notify",
        "params": {
          "text": "🎉 *ZANTARA Connected Successfully!*\n\n✅ Google Chat integration is active\n🤖 Bot: ZANTARA v4.0.0\n📅 '"$(date '+%Y-%m-%d %H:%M:%S')"'",
          "space": "configured"
        }
      }' | jq '.'

    echo ""
    echo "✅ Setup completato! Controlla Google Chat per il messaggio di test."
    echo ""
else
    echo ""
    echo "❌ Nessun URL inserito. Setup annullato."
fi