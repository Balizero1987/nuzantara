             
             #! /bin/bash

# Railway Dockerfile Fix Script
# Forza Railway a usare Dockerfile invece di cercare railway.toml

echo "🔧 RAILWAY DOCKERFILE FIX"
echo "========================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Check login status
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Run: railway login"
    exit 1
fi

echo "✅ Railway CLI ready"

# Create railway.toml files that force Dockerfile usage
echo ""
echo "🔧 Creating railway.toml files to force Dockerfile usage..."

# Root railway.toml
cat > railway.toml << 'EOF'
# Railway Configuration - FORCE DOCKERFILE USAGE
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
EOF

# TypeScript Backend railway.toml
cat > apps/backend-ts/railway.toml << 'EOF'
# TypeScript Backend - FORCE DOCKERFILE USAGE
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
EOF

# RAG Backend railway.toml
cat > apps/backend-rag/backend/railway.toml << 'EOF'
# RAG Backend - FORCE DOCKERFILE USAGE
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn app.main_cloud:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 600
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
EOF

echo "✅ railway.toml files created"

# Verify Dockerfile files exist
echo ""
echo "🔍 Verifying Dockerfile files..."

if [ -f "apps/backend-ts/Dockerfile" ]; then
    echo "✅ TypeScript Backend Dockerfile exists"
else
    echo "❌ TypeScript Backend Dockerfile missing"
    exit 1
fi

if [ -f "apps/backend-rag/backend/Dockerfile" ]; then
    echo "✅ RAG Backend Dockerfile exists"
else
    echo "❌ RAG Backend Dockerfile missing"
    exit 1
fi

echo ""
echo "🚀 Deploying services with Dockerfile configuration..."

# Deploy TypeScript Backend
echo "Deploying TypeScript Backend..."
railway up --service TS-BACKEND

# Deploy RAG Backend
echo "Deploying RAG Backend..."
railway up --service "RAG BACKEND"

echo ""
echo "📊 Checking deployment status..."

# Check TypeScript Backend status
echo "TypeScript Backend status:"
railway logs --service TS-BACKEND --tail 10

echo ""
echo "RAG Backend status:"
railway logs --service "RAG BACKEND" --tail 10

echo ""
echo "🎯 FIX COMPLETED!"
echo "=================="
echo ""
echo "Railway should now use Dockerfile instead of looking for railway.toml"
echo ""
echo "Monitor deployments:"
echo "  railway logs --service TS-BACKEND --tail 20"
echo "  railway logs --service 'RAG BACKEND' --tail 20"
echo ""
echo "Test endpoints:"
echo "  curl https://ts-backend-production-568d.up.railway.app/health"
echo "  curl https://scintillating-kindness-production-47e3.up.railway.app/health"
