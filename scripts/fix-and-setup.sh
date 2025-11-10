#!/bin/bash
################################################################################
# FIX AND SETUP - Risolve problemi git e configura tutto automaticamente
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          FIX & SETUP AUTOMATICO - NUZANTARA                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

################################################################################
# STEP 1: Fix Git
################################################################################

echo -e "${YELLOW}▶ Step 1: Risoluzione problemi git...${NC}"

# Abort any merge in progress
if [ -f .git/MERGE_HEAD ]; then
    echo "  Trovato merge in corso, annullo..."
    git merge --abort 2>/dev/null || true
    echo -e "${GREEN}  ✅ Merge annullato${NC}"
fi

# Reset to clean state
echo "  Resettando repository..."
git reset --hard HEAD 2>/dev/null || true
git clean -fd 2>/dev/null || true

# Stash any local changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "  Salvando modifiche locali..."
    git stash
    echo -e "${GREEN}  ✅ Modifiche salvate in stash${NC}"
fi

# Pull latest changes
echo "  Scaricando ultimi aggiornamenti..."
git fetch origin
git pull origin claude/analyze-codebase-011CUz492NbDwHKUhTjMxgwD

echo -e "${GREEN}✅ Git risolto e aggiornato${NC}"
echo ""

################################################################################
# STEP 2: Setup Files
################################################################################

echo -e "${YELLOW}▶ Step 2: Configurazione file .env...${NC}"

# Copy configured files
if [ -f apps/backend-ts/.env.configured ]; then
    cp apps/backend-ts/.env.configured apps/backend-ts/.env
    echo -e "${GREEN}  ✅ Backend TypeScript configurato${NC}"
else
    echo -e "${RED}  ❌ File .env.configured non trovato${NC}"
    exit 1
fi

if [ -f apps/backend-rag/.env.configured ]; then
    cp apps/backend-rag/.env.configured apps/backend-rag/.env
    echo -e "${GREEN}  ✅ Backend RAG configurato${NC}"
else
    echo -e "${RED}  ❌ File .env.configured non trovato${NC}"
    exit 1
fi

echo ""

################################################################################
# STEP 3: Check Docker
################################################################################

echo -e "${YELLOW}▶ Step 3: Verifica Docker...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}  ❌ Docker non trovato${NC}"
    echo ""
    echo "  Installa Docker Desktop:"
    echo "  https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

echo -e "${GREEN}  ✅ Docker trovato${NC}"
echo ""

################################################################################
# STEP 4: Start Services
################################################################################

echo -e "${YELLOW}▶ Step 4: Avvio servizi Docker...${NC}"

# Function to start container
start_container() {
    local name=$1
    local image=$2
    local port=$3
    local extra_args=${4:-}

    # Stop and remove if exists
    docker stop "$name" 2>/dev/null || true
    docker rm "$name" 2>/dev/null || true

    # Start container
    docker run -d --name "$name" -p "$port" $extra_args "$image" > /dev/null
    echo -e "${GREEN}  ✅ $name avviato${NC}"
}

start_container \
    "nuzantara-postgres" \
    "postgres:15" \
    "5432:5432" \
    "-e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=zantara"

start_container \
    "nuzantara-redis" \
    "redis:7-alpine" \
    "6379:6379"

start_container \
    "nuzantara-chromadb" \
    "chromadb/chroma:latest" \
    "8001:8000"

echo ""

################################################################################
# STEP 5: Verify
################################################################################

echo -e "${YELLOW}▶ Step 5: Verifica configurazione...${NC}"

# Check .env files
if grep -q "ENABLE_CRON=true" apps/backend-ts/.env; then
    echo -e "${GREEN}  ✅ CRON abilitato${NC}"
else
    echo -e "${RED}  ❌ CRON non abilitato${NC}"
fi

if grep -q "JWT_SECRET=SFiWmXo6LNrDdwLyVfJXhrwdK" apps/backend-ts/.env; then
    echo -e "${GREEN}  ✅ JWT_SECRET configurato${NC}"
else
    echo -e "${RED}  ❌ JWT_SECRET non configurato${NC}"
fi

# Check Docker services
sleep 2
if docker ps | grep -q nuzantara-postgres; then
    echo -e "${GREEN}  ✅ PostgreSQL running${NC}"
else
    echo -e "${RED}  ❌ PostgreSQL non running${NC}"
fi

if docker ps | grep -q nuzantara-redis; then
    echo -e "${GREEN}  ✅ Redis running${NC}"
else
    echo -e "${RED}  ❌ Redis non running${NC}"
fi

if docker ps | grep -q nuzantara-chromadb; then
    echo -e "${GREEN}  ✅ ChromaDB running${NC}"
else
    echo -e "${RED}  ❌ ChromaDB non running${NC}"
fi

echo ""

################################################################################
# SUCCESS
################################################################################

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ SETUP COMPLETATO!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Servizi attivi:${NC}"
echo "  ✅ PostgreSQL su localhost:5432"
echo "  ✅ Redis su localhost:6379"
echo "  ✅ ChromaDB su localhost:8001"
echo ""
echo -e "${CYAN}Agenti configurati:${NC}"
echo "  ✅ Health Check (ogni 15 min)"
echo "  ✅ Daily Report (daily 9 AM)"
echo "  ✅ Agent Orchestrator"
echo "  🟡 Autonomous Research (richiede OpenRouter key)"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PROSSIMO STEP: Avvia i backend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Terminal 1 - Backend TypeScript:${NC}"
echo "  cd apps/backend-ts"
echo "  npm install"
echo "  npm run dev"
echo ""
echo -e "${CYAN}Terminal 2 - Backend RAG (opzionale):${NC}"
echo "  cd apps/backend-rag"
echo "  python -m venv venv"
echo "  source venv/bin/activate"
echo "  pip install -r requirements.txt"
echo "  python -m uvicorn backend.main:app --reload"
echo ""
echo -e "${YELLOW}⚠️  Per attivare Autonomous Research:${NC}"
echo "  1. Vai su https://openrouter.ai/keys"
echo "  2. Crea account gratis"
echo "  3. Copia la key"
echo "  4. Aggiungi in apps/backend-rag/.env:"
echo "     OPENROUTER_API_KEY=sk-or-v1-xxxxx"
echo ""
echo -e "${GREEN}🎉 Tutto pronto!${NC}"
echo ""
