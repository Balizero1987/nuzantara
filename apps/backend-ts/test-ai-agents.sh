#!/bin/bash

# Test Script for AI Automation Agents
# Run this AFTER setting OPENROUTER_API_KEY in .env

echo "🧪 Testing AI Automation Agents"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env from .env.example"
    exit 1
fi

# Check if OPENROUTER_API_KEY is set
if ! grep -q "OPENROUTER_API_KEY=sk-or-v1-" .env; then
    echo -e "${RED}❌ OPENROUTER_API_KEY not configured in .env${NC}"
    echo "Please set your OpenRouter API key in .env"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Test 1: OpenRouter Client Health Check
echo "Test 1: OpenRouter Client Health Check"
echo "---------------------------------------"

npx tsx << 'EOF'
import { openRouterClient } from './src/services/ai/openrouter-client.js';

console.log('🔍 Testing OpenRouter connection...');

openRouterClient.healthCheck()
  .then(ok => {
    if (ok) {
      console.log('✅ OpenRouter client healthy');
      console.log('\nStats:', openRouterClient.getStats());
    } else {
      console.log('❌ OpenRouter client unhealthy');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  });
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ OpenRouter health check failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Test 1 passed${NC}"
echo ""

# Test 2: Refactoring Agent (Dry Run)
echo "Test 2: Refactoring Agent (Dry Run)"
echo "------------------------------------"

npx tsx << 'EOF'
import { RefactoringAgent } from './src/agents/refactoring-agent.js';

console.log('🔧 Testing Refactoring Agent...');

const agent = new RefactoringAgent();

// Test on logger.ts (simple file)
agent.refactorFile('src/services/logger.ts', [
  {
    type: 'code-smell',
    description: 'Add comprehensive JSDoc comments',
    severity: 'low'
  }
])
.then(result => {
  console.log('\nResult:', result);
  console.log('\nAgent Stats:', agent.getStats());

  if (result.skipped) {
    console.log(`⏭️  Skipped: ${result.skipReason}`);
  } else if (result.success) {
    console.log('✅ Refactoring successful');
  } else {
    console.log('⚠️  Refactoring failed:', result.error);
  }
})
.catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
EOF

echo ""
echo -e "${GREEN}✅ Test 2 completed${NC}"
echo ""

# Test 3: Test Generator Agent (Dry Run)
echo "Test 3: Test Generator Agent (Dry Run)"
echo "---------------------------------------"

npx tsx << 'EOF'
import { TestGeneratorAgent } from './src/agents/test-generator-agent.js';

console.log('🧪 Testing Test Generator Agent...');

const generator = new TestGeneratorAgent();

// Test on a simple service file
generator.generateTests('src/services/logger.ts')
.then(result => {
  console.log('\nResult:', result);
  console.log('\nAgent Stats:', generator.getStats());

  if (result.skipped) {
    console.log(`⏭️  Skipped: ${result.skipReason}`);
  } else if (result.success) {
    console.log(`✅ Test generation successful: ${result.testPath}`);
    console.log(`📊 Coverage: ${result.coverage}%`);
  } else {
    console.log('⚠️  Test generation failed:', result.error);
  }
})
.catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
EOF

echo ""
echo -e "${GREEN}✅ Test 3 completed${NC}"
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Review any generated PRs"
echo "2. Check .ai-automation/ directory for history files"
echo "3. Monitor agent stats regularly"
echo "4. If all looks good, integrate with cron scheduler"
echo ""
echo "To integrate with cron:"
echo "  npm run integrate-ai-cron"
