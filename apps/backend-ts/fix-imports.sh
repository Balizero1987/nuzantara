#!/bin/bash

# Quick fix script for missing logger imports
# This script adds logger imports to files that are missing them

echo "🔧 Fixing missing logger imports..."

# Files that need logger imports
files=(
  "src/handlers/router-system/start-jiwa-server.ts"
  "src/handlers/router-system/orchestrator-jiwa.ts"
  "src/handlers/router-system/super-tools.ts"
  "src/handlers/communication/twilio-whatsapp.ts"
  "src/handlers/router-system/migration-adapter.ts"
  "src/handlers/zantara/knowledge.ts"
  "src/handlers/zantara/zantara-brilliant.ts"
  "src/middleware/admin-auth.ts"
  "src/middleware/audit-middleware.ts"
  "src/middleware/cache.middleware.ts"
  "src/middleware/demo-user-auth.ts"
  "src/middleware/free-protection.ts"
  "src/middleware/ip-defense.ts"
  "src/middleware/jwt-auth.ts"
  "src/middleware/monitoring.ts"
  "src/routing/router.ts"
  "src/services/logger.ts"
  "src/services/prompt-loader.service.ts"
  "src/handlers/zantara-v3/zantara-unified.backup.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  📝 Fixing $file"

    # Check if logger import is already present
    if ! grep -q "import.*logger" "$file"; then
      # Find the first import line
      first_import=$(grep -n "^import" "$file" | head -1 | cut -d: -f1)

      if [ -n "$first_import" ]; then
        # Add logger import after the first import
        sed -i '' "${first_import}a\\
import { logger } from '../logging/unified-logger.js';
" "$file"
      fi
    fi

    # Fix relative path issues for deeper directories
    sed -i '' "s|import { logger } from '../logging/unified-logger.js';|import { logger } from '../../logging/unified-logger.js';|g" "$file"
    sed -i '' "s|import { logger } from '../../logging/unified-logger.js';|import { logger } from '../../../logging/unified-logger.js';|g" "$file"

  fi
done

echo "✅ Import fixes completed"
echo "🔄 Running TypeScript check..."

npx tsc --noEmit --skipLibCheck