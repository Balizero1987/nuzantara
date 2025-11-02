#!/bin/bash

echo "-------------------------------------------"
echo "🔬 Nuzantara Doctor — System Diagnostic"
echo "-------------------------------------------"
set -e

# 1️⃣ Environment checks
if [ ! -f ".env" ]; then
  echo "❌ Missing .env file — please create from .env.example"
  exit 1
fi

echo "✅ Environment file found"

# 2️⃣ Node & PNPM presence
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found"
  exit 1
fi
if ! command -v pnpm &> /dev/null; then
  echo "❌ PNPM not found"
  exit 1
fi

echo "✅ Node & PNPM available"

# 3️⃣ Backend structure
if [ ! -d "apps/backend-ts" ]; then
  echo "❌ apps/backend-ts directory missing"
  exit 1
fi

echo "✅ Backend structure OK"

# 4️⃣ Run GLM diagnostics
echo "🚀 Running Global Layer Monitor..."
cd apps/backend-ts
npx tsx src/diagnostics/glm.ts

echo "-------------------------------------------"
echo "🩺 All diagnostics complete"
echo "-------------------------------------------"