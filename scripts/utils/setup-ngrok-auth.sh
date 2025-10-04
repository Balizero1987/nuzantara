#!/bin/bash

echo "🔐 Ngrok Authentication Setup"
echo "=============================="
echo ""
echo "📝 Per ottenere il token:"
echo "1. Registrati su: https://dashboard.ngrok.com/signup"
echo "2. Copia token da: https://dashboard.ngrok.com/get-started/your-authtoken"
echo ""
read -p "Incolla il tuo authtoken ngrok: " NGROK_TOKEN

if [ ! -z "$NGROK_TOKEN" ]; then
    echo ""
    echo "✅ Configuro ngrok..."
    ngrok config add-authtoken $NGROK_TOKEN

    echo "✅ Token salvato!"
    echo ""
    echo "🚀 Avvio tunnel ngrok..."
    echo "================================"
    ngrok http 8080
else
    echo "❌ Nessun token fornito"
fi