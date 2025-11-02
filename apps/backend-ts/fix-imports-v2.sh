#!/bin/bash

# More sophisticated fix script for missing logger imports
# This script calculates the correct relative path to the logging module

echo "🔧 Fixing missing logger imports with correct paths..."

# Function to calculate relative path to logging directory
calculate_path() {
  local file="$1"
  local depth=$(echo "$file" | tr '/' '\n' | wc -l | tr -d ' ')
  depth=$((depth - 1)) # subtract 1 for the filename

  local path=""
  for ((i=0; i<depth; i++)); do
    path="../$path"
  done

  echo "${path}src/logging/unified-logger.js"
}

# Fix individual files with correct paths
echo "  📝 Fixing src/handlers/router-system/start-jiwa-server.ts"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../../logging/unified-logger.js";|g' src/handlers/router-system/start-jiwa-server.ts
sed -i '' 's|import correlationMiddleware from "../logging/correlation-middleware.js";|import correlationMiddleware from "../../logging/correlation-middleware.js";|g' src/handlers/router-system/start-jiwa-server.ts

echo "  📝 Fixing src/handlers/router-system/orchestrator-jiwa.ts"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../../logging/unified-logger.js";|g' src/handlers/router-system/orchestrator-jiwa.ts

echo "  📝 Fixing src/handlers/router-system/super-tools.ts"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../../logging/unified-logger.js";|g' src/handlers/router-system/super-tools.ts

echo "  📝 Fixing src/handlers/communication/twilio-whatsapp.ts"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../../logging/unified-logger.js";|g' src/handlers/communication/twilio-whatsapp.ts

echo "  📝 Fixing src/handlers/zantara/knowledge.ts"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../../logging/unified-logger.js";|g' src/handlers/zantara/knowledge.ts

echo "  📝 Fixing src/handlers/zantara/zantara-brilliant.ts"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../../logging/unified-logger.js";|g' src/handlers/zantara/zantara-brilliant.ts

echo "  📝 Fixing src/handlers/zantara-v3/zantara-unified.backup.ts"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../../logging/unified-logger.js";|g' src/handlers/zantara-v3/zantara-unified.backup.ts

echo "  📝 Fixing middleware files (depth 1)"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../logging/unified-logger.js";|g' src/middleware/*.ts

echo "  📝 Fixing services files (depth 1)"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../logging/unified-logger.js";|g' src/services/*.ts

echo "  📝 Fixing routing files (depth 1)"
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../logging/unified-logger.js";|g' src/routing/*.ts

# Fix services/logger.ts - special case since it exports logger
echo "  📝 Fixing src/services/logger.ts (special case)"
sed -i '' 's|import { logger } from "../logging/unified-logger.js";|// Using local logger implementation|g' src/services/logger.ts

# Fix missing import in migration-adapter.ts
echo "  📝 Adding missing import to src/handlers/router-system/migration-adapter.ts"
if ! grep -q "import.*logger" "src/handlers/router-system/migration-adapter.ts"; then
  sed -i '' '1a\
import { logger } from "../../logging/unified-logger.js";
' "src/handlers/router-system/migration-adapter.ts"
fi

echo "✅ Import fixes completed"
echo "🔄 Running TypeScript check..."

npx tsc --noEmit --skipLibCheck