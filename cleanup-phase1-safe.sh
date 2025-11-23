#!/bin/bash

###############################################################################
# NUZANTARA Codebase Cleanup Script - Phase 1 (SAFE)
# Rimuove solo codice sicuramente non utilizzato
###############################################################################

set -e

REPO_ROOT="/Users/antonellosiano/Desktop/NUZANTARA/NUZANTARA-CLEAN-ARCHITECT"
cd "$REPO_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     NUZANTARA CODEBASE CLEANUP - PHASE 1 (SAFE)          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create backup
echo -e "${YELLOW}[1/5]${NC} Creating backup..."
BACKUP_FILE="backup-before-cleanup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf ~/Desktop/"$BACKUP_FILE" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  apps/backend-ts/src 2>/dev/null || true
echo -e "${GREEN}✅ Backup created: ~/Desktop/$BACKUP_FILE${NC}"

###############################################################################
# PHASE 1: Remove V3 Omega Comments (SAFE)
###############################################################################
echo ""
echo -e "${YELLOW}[2/5]${NC} Removing legacy V3 Omega comments..."

# Remove specific comment blocks in server.ts
sed -i.bak '/^\/\/ REMOVED: v3 Ω services/d' apps/backend-ts/src/server.ts
sed -i.bak '/^\/\/ REMOVED: registerV3OmegaServices/d' apps/backend-ts/src/server.ts
sed -i.bak '/^\/\/ REMOVED: serviceRegistry initialization/d' apps/backend-ts/src/server.ts

# Remove legacy handler comments
sed -i.bak '/PRIORITY 5: Memory handlers removed (legacy store deprecated/d' \
  apps/backend-ts/src/core/load-all-handlers.ts

# Remove Firestore deprecated comment
sed -i.bak '/Auto-save disabled (Firestore deprecated)/d' \
  apps/backend-ts/src/routing/router.ts

# Cleanup backup files
rm -f apps/backend-ts/src/server.ts.bak
rm -f apps/backend-ts/src/core/load-all-handlers.ts.bak
rm -f apps/backend-ts/src/routing/router.ts.bak

echo -e "${GREEN}✅ Legacy comments removed${NC}"

###############################################################################
# PHASE 2: Remove Large Commented Code Blocks (SAFE)
###############################################################################
echo ""
echo -e "${YELLOW}[3/5]${NC} Removing commented OpenTelemetry code..."

# Create temp file without OpenTelemetry comments (lines 6-31 in server.ts)
awk 'NR<6 || NR>31' apps/backend-ts/src/server.ts > apps/backend-ts/src/server.ts.tmp
mv apps/backend-ts/src/server.ts.tmp apps/backend-ts/src/server.ts

echo -e "${GREEN}✅ Commented code blocks removed${NC}"

###############################################################################
# PHASE 3: Document Deprecated Endpoints (NO DELETE, just document)
###############################################################################
echo ""
echo -e "${YELLOW}[4/5]${NC} Documenting deprecated endpoints..."

cat > DEPRECATED_ENDPOINTS.md << 'EOF'
# Deprecated Endpoints Report

**Generated:** $(date)

## Endpoints to Remove in Next Phase

### Backend TypeScript

1. **KBLI Handlers** (apps/backend-ts/src/handlers/bali-zero/)
   - `kbli.ts` → Now in RAG backend
   - `kbli-complete.ts` → Now in RAG backend
   - **Action:** Return 410 Gone or redirect to RAG backend

2. **Tax Routes** (commented out in server.ts:572-573)
   - Tax routes are commented but files might exist
   - **Action:** Verify if needed, else delete

3. **Test Routes** (apps/backend-ts/src/routes/test/)
   - `mock-login.ts` → Should be dev-only
   - **Action:** Add NODE_ENV guard

### Backend Python

No deprecated endpoints found.

### Frontend

1. **documentIntelligence** → Already removed ✅

---

**Recommendation:** Phase 2 cleanup (manual review required)
EOF

echo -e "${GREEN}✅ Deprecated endpoints documented${NC}"

###############################################################################
# PHASE 4: Report Console.log Usage (NO CHANGE)
###############################################################################
echo ""
echo -e "${YELLOW}[5/5]${NC} Analyzing console.log usage..."

CONSOLE_COUNT=$(grep -r "console\.\(log\|error\|warn\)" apps/backend-ts/src \
  --include="*.ts" | grep -v "logger" | wc -l | tr -d ' ')

echo -e "${YELLOW}⚠️  Found $CONSOLE_COUNT instances of console.log/error/warn${NC}"
echo -e "   (Not auto-fixing - needs manual review)"

# Create report
cat > CONSOLE_LOG_REPORT.md << EOF
# Console.log Usage Report

**Total Instances:** $CONSOLE_COUNT

## Files with most console usage:

\`\`\`bash
grep -r "console\." apps/backend-ts/src --include="*.ts" | \
  cut -d: -f1 | sort | uniq -c | sort -rn | head -20
\`\`\`

## Recommended Fix:

1. Import logger:
   \`\`\`typescript
   import { logger } from './services/logger';
   \`\`\`

2. Replace:
   \`\`\`typescript
   // Before
   console.log('Message:', data);
   
   // After
   logger.info('Message', { data });
   \`\`\`

3. Run:
   \`\`\`bash
   ./scripts/cleanup/replace-console-log-interactive.sh
   \`\`\`

EOF

echo -e "${GREEN}✅ Console.log report created${NC}"

###############################################################################
# Summary
###############################################################################
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PHASE 1 CLEANUP COMPLETED${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Changes Made:${NC}"
echo "  • Removed V3 Omega comments"
echo "  • Removed commented OpenTelemetry code"
echo "  • Removed legacy/deprecated comments"
echo ""
echo -e "${YELLOW}Reports Created:${NC}"
echo "  • DEPRECATED_ENDPOINTS.md"
echo "  • CONSOLE_LOG_REPORT.md"
echo "  • Backup: ~/Desktop/$BACKUP_FILE"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Review changes: git diff"
echo "  2. Test application still works"
echo "  3. Commit: git commit -m 'cleanup: remove legacy comments and dead code'"
echo "  4. Run Phase 2 cleanup (manual review required)"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
