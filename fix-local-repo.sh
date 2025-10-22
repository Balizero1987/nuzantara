#!/bin/bash
# Fix Local Repository - Sync with GitHub Main
# Esegui questo script nella directory NUZANTARA RAILWAY

set -e

echo "🔧 FIXING LOCAL REPOSITORY..."
echo ""

# Salva directory corrente
ORIGINAL_DIR=$(pwd)

# Trova la directory del repo
if [ -d ".git" ]; then
    REPO_DIR=$(pwd)
elif [ -d "nuzantara/.git" ]; then
    REPO_DIR="$(pwd)/nuzantara"
    cd "$REPO_DIR"
else
    echo "❌ Repository non trovato. Assicurati di essere nella directory giusta."
    exit 1
fi

echo "📁 Repository trovato: $REPO_DIR"
echo ""

# Backup delle modifiche locali (se esistono)
echo "💾 Backup modifiche locali..."
git stash push -m "Backup automatico prima sync - $(date)" 2>/dev/null || echo "Nessuna modifica da salvare"

# Scarica ultime modifiche da GitHub
echo "⬇️  Download da GitHub..."
git fetch origin main

# Forza checkout di main
echo "🔄 Allineamento con main..."
git checkout -B main origin/main --force

# Pull finale per sicurezza
echo "✅ Sincronizzazione finale..."
git pull origin main

echo ""
echo "============================================"
echo "✅ REPOSITORY SINCRONIZZATO CON SUCCESSO!"
echo "============================================"
echo ""
echo "📊 Status:"
git log --oneline -3
echo ""
echo "🎉 Hai ora tutti i 10 agenti agentici localmente!"
echo ""
echo "📦 File dei nuovi agenti:"
echo "   - apps/backend-rag/backend/services/client_journey_orchestrator.py"
echo "   - apps/backend-rag/backend/services/proactive_compliance_monitor.py"
echo "   - apps/backend-rag/backend/services/knowledge_graph_builder.py"
echo "   - apps/backend-rag/backend/services/auto_ingestion_orchestrator.py"
echo "   - apps/backend-rag/backend/services/autonomous_research_service.py"
echo "   - apps/backend-rag/backend/services/cross_oracle_synthesis_service.py"
echo "   - apps/backend-rag/backend/services/dynamic_pricing_service.py"
echo "   - apps/backend-rag/backend/services/collection_health_service.py"
echo "   - + modifiche a query_router.py e search_service.py"
echo ""
echo "📚 Documentazione completa:"
echo "   - DEPLOYMENT_READY.md"
echo "   - apps/backend-rag/backend/docs/COMPLETE_AGENTIC_FUNCTIONS_GUIDE.md"
echo ""

# Mostra se ci sono backup da ripristinare
if git stash list | grep -q "Backup automatico"; then
    echo "💡 Le tue modifiche locali sono state salvate."
    echo "   Per ripristinarle: git stash pop"
    echo ""
fi

echo "✨ SYNC COMPLETATO!"
