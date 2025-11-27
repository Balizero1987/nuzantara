#!/bin/bash

echo "🔧 QUICK FIX - Compilation Issues"

# Fix critical paths for router-system (depth 2)
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../../logging/unified-logger.js";|g' src/handlers/router-system/*.ts
sed -i '' 's|import correlationMiddleware from "../logging/correlation-middleware.js";|import correlationMiddleware from "../../logging/correlation-middleware.js";|g' src/handlers/router-system/*.ts

# Fix middleware paths (depth 1)
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../logging/unified-logger.js";|g' src/middleware/*.ts

# Fix services paths (depth 1)
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../logging/unified-logger.js";|g' src/services/*.ts

# Fix services/logger.ts - remove circular import
sed -i '' 's|import { logger } from "../logging/unified-logger.js";|// Using local logger implementation|g' src/services/logger.ts

# Fix routing paths (depth 1)
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../logging/unified-logger.js";|g' src/routing/*.ts

# Fix handlers paths (depth 1)
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../logging/unified-logger.js";|g' src/handlers/zantara/*.ts
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../logging/unified-logger.js";|g' src/handlers/communication/*.ts
sed -i '' 's|import { logger } from "../../../logging/unified-logger.js";|import { logger } from "../logging/unified-logger.js";|g' src/handlers/zantara-v3/*.ts

echo "✅ Path fixes completed"

# Test compilation
echo "🔍 Testing compilation..."
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
else
    echo "⚠️  Some errors remain - trying minimal build..."
    npx tsc --build --force --skipLibCheck
fi
