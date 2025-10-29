#!/bin/bash
# Secrets Audit Script
# Part of Q1 2025 Priority Actions from ANALISI_STRATEGICA_ARCHITETTURA.md

set -e

echo "🔒 NUZANTARA Secrets Audit"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find potential secrets in code
echo "Scanning for potential hardcoded secrets..."

# Common secret patterns
PATTERNS=(
  "password\s*=\s*['\"][^'\"]+['\"]"
  "api[_-]?key\s*=\s*['\"][^'\"]+['\"]"
  "secret\s*=\s*['\"][^'\"]+['\"]"
  "token\s*=\s*['\"][^'\"]+['\"]"
  "sk-[a-zA-Z0-9]{32,}"
  "xox[baprs]-[0-9a-zA-Z-]{10,}"
  "AKIA[0-9A-Z]{16}"
  "ya29\\.[0-9A-Za-z\\-_]+"
)

FOUND_SECRETS=0

for pattern in "${PATTERNS[@]}"; do
  # Search in source files (excluding node_modules, dist, .git)
  results=$(grep -riE "$pattern" \
    --include="*.ts" \
    --include="*.js" \
    --include="*.json" \
    --include="*.env*" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    --exclude-dir=coverage \
    apps/backend-ts/src 2>/dev/null || true)
  
  if [ -n "$results" ]; then
    echo -e "${YELLOW}⚠️  Pattern found: ${pattern}${NC}"
    echo "$results" | while IFS= read -r line; do
      # Skip if it's a comment or example
      if echo "$line" | grep -qE "(example|test|TODO|FIXME|@example|//.*example)" ; then
        continue
      fi
      
      echo -e "${RED}  ${line}${NC}"
      FOUND_SECRETS=$((FOUND_SECRETS + 1))
    done
    echo ""
  fi
done

# Check for .env files that might be committed
if find . -name ".env" -not -path "./node_modules/*" -not -path "./.git/*" | grep -q .; then
  echo -e "${RED}⚠️  Found .env files:${NC}"
  find . -name ".env" -not -path "./node_modules/*" -not -path "./.git/*"
  FOUND_SECRETS=$((FOUND_SECRETS + 1))
fi

# Summary
echo "=========================="
if [ $FOUND_SECRETS -eq 0 ]; then
  echo -e "${GREEN}✅ No hardcoded secrets found${NC}"
  exit 0
else
  echo -e "${RED}❌ Found ${FOUND_SECRETS} potential secret(s-placeholder)${NC}"
  echo ""
  echo "Recommendations:"
  echo "1. Move secrets to environment variables"
  echo "2. Use Railway Variables or Google Secret Manager"
  echo "3. Add secrets to .gitignore"
  echo "4. Rotate any exposed secrets immediately"
  exit 1
fi
