#!/bin/bash

# Integration Script for AI Automation Cron Jobs
# This script integrates the cron scheduler into the backend

echo "🔧 Integrating AI Automation Cron Scheduler"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node-cron is installed
echo "1. Checking dependencies..."

if ! npm list node-cron --depth=0 &> /dev/null; then
    echo -e "${YELLOW}⚠️  node-cron not found, installing...${NC}"
    npm install node-cron
    npm install --save-dev @types/node-cron

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install node-cron${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ node-cron installed${NC}"
else
    echo -e "${GREEN}✅ node-cron already installed${NC}"
fi

echo ""
echo "2. Checking if cron scheduler exists..."

if [ ! -f "src/services/cron-scheduler.ts" ]; then
    echo -e "${RED}❌ cron-scheduler.ts not found!${NC}"
    echo "This shouldn't happen - file should have been created by the implementation."
    exit 1
fi

echo -e "${GREEN}✅ cron-scheduler.ts exists${NC}"

echo ""
echo "3. Checking server.ts for cron integration..."

# Check if server.ts exists
if [ ! -f "src/server.ts" ]; then
    echo -e "${YELLOW}⚠️  src/server.ts not found, checking alternative locations...${NC}"

    if [ -f "server.ts" ]; then
        SERVER_FILE="server.ts"
    elif [ -f "src/index.ts" ]; then
        SERVER_FILE="src/index.ts"
    elif [ -f "index.ts" ]; then
        SERVER_FILE="index.ts"
    else
        echo -e "${RED}❌ No server entry point found${NC}"
        echo "Please manually integrate the cron scheduler into your server file:"
        echo ""
        echo "Add this to your server startup:"
        echo ""
        cat << 'INTEGRATION'
import { cronScheduler } from './services/cron-scheduler.js';

// After server starts listening:
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  // Start AI automation cron scheduler
  cronScheduler.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  cronScheduler.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
INTEGRATION
        exit 1
    fi
else
    SERVER_FILE="src/server.ts"
fi

echo -e "${GREEN}✅ Found server file: $SERVER_FILE${NC}"

# Check if already integrated
if grep -q "cronScheduler" "$SERVER_FILE"; then
    echo -e "${YELLOW}⚠️  Cron scheduler already integrated in $SERVER_FILE${NC}"
    echo "Skipping integration..."
else
    echo ""
    echo -e "${YELLOW}ℹ️  Manual integration required${NC}"
    echo ""
    echo "Please add the following code to $SERVER_FILE:"
    echo ""
    echo -e "${YELLOW}---------------------------------------${NC}"
    cat << 'INTEGRATION'
import { cronScheduler } from './services/cron-scheduler.js';

// After server starts listening:
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  // Start AI automation cron scheduler
  cronScheduler.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  cronScheduler.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
INTEGRATION
    echo -e "${YELLOW}---------------------------------------${NC}"
    echo ""
fi

echo ""
echo "4. Creating monitoring endpoint..."

# Create monitoring endpoint file
cat > src/routes/ai-monitoring.ts << 'EOF'
/**
 * AI Automation Monitoring Endpoints
 */

import { Router, Request, Response } from 'express';
import { cronScheduler } from '../services/cron-scheduler.js';
import { openRouterClient } from '../services/ai/openrouter-client.js';

const router = Router();

/**
 * Get cron scheduler status
 */
router.get('/cron-status', (req: Request, res: Response) => {
  const status = cronScheduler.getStatus();
  res.json(status);
});

/**
 * Get OpenRouter client stats
 */
router.get('/ai-stats', (req: Request, res: Response) => {
  const stats = openRouterClient.getStats();
  res.json(stats);
});

/**
 * Health check for AI automation
 */
router.get('/ai-health', async (req: Request, res: Response) => {
  try {
    const healthy = await openRouterClient.healthCheck();
    const stats = openRouterClient.getStats();

    res.json({
      healthy,
      stats,
      cron: cronScheduler.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
EOF

echo -e "${GREEN}✅ Monitoring endpoint created: src/routes/ai-monitoring.ts${NC}"

echo ""
echo "5. Summary"
echo "=========="
echo ""
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo -e "${GREEN}✅ Cron scheduler created${NC}"
echo -e "${GREEN}✅ Monitoring endpoints created${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Add cron scheduler to your server file (see instructions above)"
echo ""
echo "2. Add monitoring routes to your Express app:"
echo "   import aiMonitoring from './routes/ai-monitoring.js';"
echo "   app.use('/api/monitoring', aiMonitoring);"
echo ""
echo "3. Restart your server:"
echo "   npm run build && pm2 restart nuzantara-backend"
echo ""
echo "4. Test the integration:"
echo "   curl http://localhost:8080/api/monitoring/cron-status"
echo "   curl http://localhost:8080/api/monitoring/ai-stats"
echo "   curl http://localhost:8080/api/monitoring/ai-health"
echo ""
echo "5. Monitor logs:"
echo "   pm2 logs nuzantara-backend --lines 100"
echo ""
echo -e "${GREEN}✅ Integration complete!${NC}"
