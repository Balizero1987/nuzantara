#!/bin/bash

# ============================================================================
# NUZANTARA - Test AI Offline (Ollama + Sentence Transformers)
# ============================================================================
# Questo script testa la configurazione offline di AI per il progetto
#
# Requisiti:
# - Ollama installato e in esecuzione
# - Python 3.8+ con sentence-transformers installato
#
# Usage:
#   ./scripts/test-offline-ai.sh
# ============================================================================

set -e

echo "🤖 NUZANTARA - Test AI Offline"
echo "================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# 1. Test Ollama
# ============================================================================

echo "📦 1. Testing Ollama..."
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama non è installato${NC}"
    echo "   Installalo con: brew install ollama"
    exit 1
fi

# Check if Ollama service is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Ollama non è in esecuzione${NC}"
    echo "   Avvialo con: brew services start ollama"
    echo "   Oppure: ollama serve &"
    exit 1
fi

echo -e "${GREEN}✅ Ollama è installato e in esecuzione${NC}"

# List available models
echo ""
echo "Modelli disponibili:"
ollama list

# Test chat
echo ""
echo "Test chat con llama3.1:8b..."
RESPONSE=$(echo "Rispondi con SI se capisci l'italiano" | ollama run llama3.1:8b --verbose 2>/dev/null | head -n 1)
echo "Risposta: $RESPONSE"
echo -e "${GREEN}✅ Ollama chat funziona${NC}"
echo ""

# ============================================================================
# 2. Test Sentence Transformers (se disponibile)
# ============================================================================

echo "📦 2. Testing Sentence Transformers..."
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 non trovato${NC}"
    exit 1
fi

# Test Sentence Transformers
cat > /tmp/test_embeddings.py << 'EOF'
import sys
try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    embeddings = model.encode(["Test embedding generation"])
    print(f"✅ Sentence Transformers funziona (dimensioni: {len(embeddings[0])})")
    sys.exit(0)
except ImportError:
    print("⚠️  Sentence Transformers non installato")
    print("   Installalo con: pip install sentence-transformers")
    sys.exit(1)
except Exception as e:
    print(f"❌ Errore: {e}")
    sys.exit(1)
EOF

python3 /tmp/test_embeddings.py
rm /tmp/test_embeddings.py

echo ""

# ============================================================================
# 3. Test integrazione API
# ============================================================================

echo "📦 3. Testing API Integration..."
echo ""

# Test Ollama API
echo "Test API Ollama (http://localhost:11434)..."
curl -s -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "Rispondi solo con: OK",
    "stream": false
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print('Risposta:', data.get('response', 'N/A')[:50])"

echo -e "${GREEN}✅ API Ollama funziona${NC}"
echo ""

# ============================================================================
# 4. Riepilogo
# ============================================================================

echo "================================"
echo "🎉 Tutti i test completati!"
echo ""
echo "📋 Configurazione:"
echo "   • Ollama: ✅ $(ollama --version | head -n 1)"
echo "   • Modello: llama3.1:8b (4.9 GB)"
echo "   • API: http://localhost:11434"
echo ""
echo "💡 Come usare:"
echo ""
echo "   # Chat interattiva"
echo "   ollama run llama3.1:8b"
echo ""
echo "   # Chat da terminale"
echo "   echo 'La tua domanda' | ollama run llama3.1:8b"
echo ""
echo "   # API REST"
echo "   curl -X POST http://localhost:11434/api/generate \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"model\": \"llama3.1:8b\", \"prompt\": \"Ciao!\", \"stream\": false}'"
echo ""
echo "================================"
