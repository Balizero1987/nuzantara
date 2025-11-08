#!/bin/bash
# AUTONOMOUS AGENTS CRON - Verification Script
# Verifies installation and configuration

set -e

echo "🧪 AUTONOMOUS AGENTS CRON - Verification Script"
echo "================================================"
echo ""

cd "$(dirname "$0")"

# Check 1: Dependencies
echo "✅ Step 1: Checking dependencies..."
if npm list node-cron > /dev/null 2>&1; then
  echo "   ✓ node-cron installed"
else
  echo "   ✗ node-cron NOT installed"
  exit 1
fi

if npm list @types/node-cron > /dev/null 2>&1; then
  echo "   ✓ @types/node-cron installed"
else
  echo "   ✗ @types/node-cron NOT installed"
  exit 1
fi

# Check 2: Files exist
echo ""
echo "✅ Step 2: Checking files..."
files=(
  "src/services/cron-scheduler.ts"
  "src/routes/monitoring.routes.ts"
  "AUTONOMOUS_AGENTS_CRON.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✓ $file"
  else
    echo "   ✗ $file NOT FOUND"
    exit 1
  fi
done

# Check 3: TypeScript compiles
echo ""
echo "✅ Step 3: Checking TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
  echo "   ✓ TypeScript compiles successfully"
else
  echo "   ✗ TypeScript compilation failed"
  exit 1
fi

# Check 4: Environment variables documented
echo ""
echo "✅ Step 4: Checking environment configuration..."
if grep -q "ENABLE_CRON" .env.example; then
  echo "   ✓ ENABLE_CRON in .env.example"
else
  echo "   ✗ ENABLE_CRON NOT in .env.example"
  exit 1
fi

if grep -q "CRON_TIMEZONE" .env.example; then
  echo "   ✓ CRON_TIMEZONE in .env.example"
else
  echo "   ✗ CRON_TIMEZONE NOT in .env.example"
  exit 1
fi

# Check 5: Server integration
echo ""
echo "✅ Step 5: Checking server integration..."
if grep -q "getCronScheduler" src/server.ts; then
  echo "   ✓ Cron scheduler imported in server.ts"
else
  echo "   ✗ Cron scheduler NOT imported in server.ts"
  exit 1
fi

if grep -q "monitoring.routes" src/server.ts; then
  echo "   ✓ Monitoring routes imported in server.ts"
else
  echo "   ✗ Monitoring routes NOT imported in server.ts"
  exit 1
fi

# Check 6: Config updated
echo ""
echo "✅ Step 6: Checking configuration..."
if grep -q "CRON" src/config/index.ts; then
  echo "   ✓ CRON configuration in config/index.ts"
else
  echo "   ✗ CRON configuration NOT in config/index.ts"
  exit 1
fi

echo ""
echo "================================================"
echo "✅ ALL CHECKS PASSED!"
echo ""
echo "📋 Next Steps:"
echo "   1. Copy .env.example to .env"
echo "   2. Set ENABLE_CRON=true"
echo "   3. Add API keys: OPENROUTER_API_KEY, DEEPSEEK_API_KEY"
echo "   4. Start server: npm run dev"
echo "   5. Check logs for: '✅ Autonomous Agents Cron Scheduler activated'"
echo "   6. Verify endpoint: curl http://localhost:8080/api/monitoring/cron-status"
echo ""
echo "📖 Documentation: ./AUTONOMOUS_AGENTS_CRON.md"
echo ""
