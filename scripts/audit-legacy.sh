#!/bin/bash
# ZANTARA Legacy Code Audit Script
# Scans codebase for obsolete patterns and reports findings

set -e

echo "🔍 ZANTARA Legacy Code Audit"
echo "============================"
echo ""

ERRORS=0
WARNINGS=0

# Patterns to check (legacy/obsolete)
PATTERNS=(
    "AMBARADAM"
    "ambaradam"
    "sub_rosa_level"
    "SUB_ROSA"
    "/api/auth/demo"
    "login-react.html"
    "team-dashboard.html"
    "ANTHROPIC_API_KEY"
    "claude.*haiku"
    "claude.*sonnet"
    "\.run\.app"
    "zantara-rag-backend.*run"
    "zantara-web-proxy.*run"
    "zantara-v520.*run"
    "cloudflare"
    "pages\.dev"
    "GDRIVE_AMBARADAM_DRIVE_ID"
    "zantara\.unified"
    "zantara\.collective"
    "zantara\.ecosystem"
    "/api/v3/zantara"
    "ChromaDB"
    "chromadb\.PersistentClient"
    "getFirestore"
    "firestore"
)

# Directories to scan
SCAN_DIRS=(
    "apps/webapp"
    "apps/backend-ts/src"
    "apps/backend-rag/backend"
)

echo "📁 Scanning directories..."
echo ""

for dir in "${SCAN_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "⚠️  Directory not found: $dir"
        continue
    fi
    
    echo "  Scanning: $dir"
    
    for pattern in "${PATTERNS[@]}"; do
        # Use grep to find matches (case-insensitive for most patterns)
        if echo "$pattern" | grep -qE "(AMBARADAM|cloudflare|ChromaDB|firestore)"; then
            # Case-sensitive for these
            matches=$(find "$dir" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.md" -o -name "*.json" -o -name "*.html" \) -exec grep -l "$pattern" {} \; 2>/dev/null || true)
        else
            # Case-insensitive for others
            matches=$(find "$dir" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.md" -o -name "*.json" -o -name "*.html" \) -exec grep -il "$pattern" {} \; 2>/dev/null || true)
        fi
        
        if [ -n "$matches" ]; then
            echo "    ❌ Found '$pattern' in:"
            echo "$matches" | sed 's/^/      - /'
            ERRORS=$((ERRORS + 1))
        fi
    done
done

echo ""
echo "📊 Audit Summary"
echo "================"
echo "  Errors found: $ERRORS"
echo "  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ No legacy patterns found!"
    exit 0
else
    echo "❌ Legacy patterns detected. Please review and remove."
    exit 1
fi

