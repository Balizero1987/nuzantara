#!/bin/bash
################################################################################
# QUICK SETUP - Attiva agenti sicuri in 30 secondi
################################################################################

set -e

cd "$(dirname "$0")/.."

echo "🚀 Quick Setup Agenti Sicuri..."
echo ""

# 1. Copia file configurati
echo "📋 Copiando file .env..."
cp apps/backend-ts/.env.configured apps/backend-ts/.env
cp apps/backend-rag/.env.configured apps/backend-rag/.env
echo "✅ File copiati"
echo ""

# 2. Avvia servizi Docker
echo "🐳 Avviando servizi Docker..."
./scripts/setup-services.sh

echo ""
echo "✅ SETUP COMPLETATO!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🟢 AGENTI ATTIVI (funzionano subito):"
echo "  1. Health Check - monitoring ogni 15 min"
echo "  2. Daily Report - metriche daily 9 AM"
echo "  3. Agent Orchestrator - coordinamento task"
echo ""
echo "🟡 AGENTE OPZIONALE (richiede OpenRouter key):"
echo "  4. Autonomous Research - ricerca intelligente"
echo "     Per attivarlo: https://openrouter.ai/keys"
echo "     Poi aggiungi key in apps/backend-rag/.env"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "AVVIA BACKEND:"
echo ""
echo "Terminal 1 - Backend TypeScript:"
echo "  cd apps/backend-ts"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Backend RAG (opzionale):"
echo "  cd apps/backend-rag"
echo "  python -m venv venv"
echo "  source venv/bin/activate"
echo "  pip install -r requirements.txt"
echo "  python -m uvicorn backend.main:app --reload"
echo ""
