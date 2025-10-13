#!/bin/bash
# ZANTARA Full Stack Deploy
# Starts both TypeScript and Python backends

set -e

echo "🚀 ZANTARA Full Stack Deployment"
echo "================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Paths
TYPESCRIPT_PATH="/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch"
PYTHON_PATH="$TYPESCRIPT_PATH/zantara-rag/backend"

# 1. Check Ollama
echo -e "${BLUE}Checking Ollama...${NC}"
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}⚠️  Ollama not found. RAG features will be limited.${NC}"
    echo "   Install from: https://ollama.com"
else
    # Check if Ollama is running
    if ! curl -s http://localhost:11434 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Ollama not running. Starting...${NC}"
        ollama serve > /tmp/ollama.log 2>&1 &
        sleep 3
    fi

    # Check for required model
    if ! ollama list 2>/dev/null | grep -q "llama3.2:3b"; then
        echo "📥 Pulling llama3.2:3b (this may take a few minutes)..."
        ollama pull llama3.2:3b
    fi
    echo -e "${GREEN}✅ Ollama ready${NC}"
fi

# 2. Start Python RAG backend
echo -e "${BLUE}Starting Python RAG backend...${NC}"
cd "$PYTHON_PATH"

# Check if virtual env exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
pip install -q --upgrade pip
pip install -q fastapi uvicorn chromadb sentence-transformers \
            anthropic google-generativeai loguru httpx tenacity 2>/dev/null || true

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found in Python backend${NC}"
    echo "   Creating default .env..."
    cat > .env << EOF
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
EOF
fi

# Start Python backend in background
echo "Starting FastAPI on port 8000..."
cd app
python -m uvicorn main_integrated:app --host 0.0.0.0 --port 8000 > /tmp/zantara-python.log 2>&1 &
PYTHON_PID=$!
cd ..
echo "Python RAG backend PID: $PYTHON_PID"

# Wait for Python backend
echo "Waiting for Python backend to start..."
for i in {1..10}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Python RAG backend ready (port 8000)${NC}"
        break
    fi
    sleep 1
done

if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Python backend may not be fully ready${NC}"
    echo "   Check logs: tail -f /tmp/zantara-python.log"
fi

# 3. Start TypeScript backend
echo -e "${BLUE}Starting TypeScript backend...${NC}"
cd "$TYPESCRIPT_PATH"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found in TypeScript backend${NC}"
    echo "   Creating default .env..."
    cat > .env << EOF
RAG_BACKEND_URL=http://localhost:8000
API_KEYS_INTERNAL=zantara-internal-dev-key-2025
API_KEYS_EXTERNAL=zantara-external-dev-key-2025
PORT=8080
EOF
fi

# Update .env with RAG_BACKEND_URL if not present
if ! grep -q "RAG_BACKEND_URL" .env; then
    echo "RAG_BACKEND_URL=http://localhost:8000" >> .env
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Start TypeScript backend
echo "Starting Express on port 8080..."
npm start > /tmp/zantara-typescript.log 2>&1 &
TYPESCRIPT_PID=$!
echo "TypeScript backend PID: $TYPESCRIPT_PID"

# Wait for TypeScript backend
echo "Waiting for TypeScript backend to start..."
for i in {1..10}; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ TypeScript backend ready (port 8080)${NC}"
        break
    fi
    sleep 1
done

if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  TypeScript backend may not be fully ready${NC}"
    echo "   Check logs: tail -f /tmp/zantara-typescript.log"
fi

# 4. Summary
echo ""
echo "================================="
echo -e "${GREEN}✅ ZANTARA Full Stack Running${NC}"
echo "================================="
echo ""
echo "📊 Services:"
echo "  - Python RAG:     http://localhost:8000"
echo "  - TypeScript API: http://localhost:8080"
echo ""
echo "🔗 New Endpoints:"
echo "  - POST /call with key: 'rag.query'"
echo "  - POST /call with key: 'rag.search'"
echo "  - POST /call with key: 'bali.zero.chat'"
echo "  - POST /call with key: 'rag.health'"
echo ""
echo "📝 Logs:"
echo "  - Python:     tail -f /tmp/zantara-python.log"
echo "  - TypeScript: tail -f /tmp/zantara-typescript.log"
echo "  - Ollama:     tail -f /tmp/ollama.log"
echo ""
echo "🧪 Quick Test:"
echo "  curl -X POST http://localhost:8080/call \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'x-api-key: zantara-internal-dev-key-2025' \\"
echo "    -d '{\"key\": \"rag.health\", \"params\": {}}'"
echo ""
echo "🛑 Stop: ./stop-full-stack.sh"
echo ""

# Save PIDs
echo "$PYTHON_PID" > /tmp/zantara-python.pid
echo "$TYPESCRIPT_PID" > /tmp/zantara-typescript.pid

echo -e "${GREEN}Press Ctrl+C to keep services running in background${NC}"
echo "Services are running. Check status with: ps aux | grep -E 'uvicorn|node'"