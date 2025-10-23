#!/bin/bash

# 🚀 NUZANTARA-RAILWAY - Deploy Fixes Script
# Deploy delle correzioni W4 per Search Agent e Compliance Alerts Agent
# Data: 2025-01-27
# Fix: user_id parameter e generate_alerts method

echo "🚀 NUZANTARA-RAILWAY - Deploy Fixes"
echo "=================================="
echo ""

# Verifica che siamo nel repository corretto
if [ ! -f "package.json" ] || [ ! -d "apps/backend-rag" ]; then
    echo "❌ Errore: Non sei nella directory NUZANTARA-RAILWAY"
    echo "   Esegui: cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY"
    exit 1
fi

echo "✅ Repository NUZANTARA-RAILWAY trovato"
echo ""

# Verifica stato git
echo "📊 Verifica stato Git..."
git status --porcelain
if [ $? -ne 0 ]; then
    echo "❌ Errore: Git non inizializzato"
    exit 1
fi

echo "✅ Git repository OK"
echo ""

# Verifica branch corrente
CURRENT_BRANCH=$(git branch --show-current)
echo "🌿 Branch corrente: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Attenzione: Non sei su main branch"
    echo "   Vuoi continuare comunque? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Deploy annullato"
        exit 1
    fi
fi

echo ""

# Verifica modifiche non committate
UNCOMMITTED=$(git status --porcelain | wc -l)
if [ $UNCOMMITTED -gt 0 ]; then
    echo "⚠️  Trovate $UNCOMMITTED modifiche non committate:"
    git status --porcelain
    echo ""
    echo "   Vuoi committare prima del deploy? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "📝 Committing modifiche..."
        git add .
        git commit -m "W4 fixes: Search Agent user_id + Compliance Alerts generate_alerts method"
        echo "✅ Modifiche committate"
    fi
fi

echo ""

# Deploy su Railway
echo "🚀 Deploy su Railway..."
echo "   - Backend TypeScript: Port 8080"
echo "   - Backend RAG Python: Port 8000"
echo ""

# Verifica se Railway CLI è installato
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI non trovato"
    echo "   Installa con: npm install -g @railway/cli"
    echo "   Oppure usa: npx @railway/cli"
    exit 1
fi

# Login Railway (se necessario)
echo "🔐 Verifica autenticazione Railway..."
railway status &> /dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Railway non autenticato"
    echo "   Esegui: railway login"
    echo "   Poi riprova questo script"
    exit 1
fi

echo "✅ Railway autenticato"
echo ""

# Push su GitHub (trigger auto-deploy)
echo "📤 Push su GitHub (trigger auto-deploy)..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push completato"
    echo ""
    echo "⏳ Deploy in corso..."
    echo "   - Railway auto-deploy attivato"
    echo "   - Tempo stimato: 2-3 minuti"
    echo ""
    echo "🔗 Monitora deploy:"
    echo "   - Railway Dashboard: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9"
    echo "   - TS Backend: https://ts-backend-production-568d.up.railway.app/health"
    echo "   - RAG Backend: https://scintillating-kindness-production-47e3.up.railway.app/health"
    echo ""
    echo "🧪 Test endpoints dopo deploy:"
    echo "   curl -s https://scintillating-kindness-production-47e3.up.railway.app/api/agents/compliance/alerts | jq ."
    echo "   curl -s -X POST https://scintillating-kindness-production-47e3.up.railway.app/search -H 'Content-Type: application/json' -d '{\"query\": \"KITAS requirements\", \"user_id\": \"test_user\"}' | jq ."
    echo ""
    echo "✅ Deploy avviato con successo!"
else
    echo "❌ Errore durante push"
    echo "   Verifica connessione e riprova"
    exit 1
fi

echo ""
echo "🎯 Fix applicati:"
echo "   ✅ Search Agent: user_id parameter fix"
echo "   ✅ Compliance Alerts: generate_alerts method added"
echo ""
echo "🚀 NUZANTARA-RAILWAY - Deploy completato!"
