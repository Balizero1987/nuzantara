#!/bin/bash
#
# ZANTARA Dataset Extraction Setup
# Step-by-step guide to extract production data from Fly.io PostgreSQL
#

set -e

echo "🚀 ZANTARA Dataset Extraction - Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not found in environment${NC}"
    echo ""
    echo "📋 To get your DATABASE_URL from Fly.io:"
    echo ""
    echo "   Option 1 - Fly.io Dashboard:"
    echo "   1. Go to: https://fly.io/project/fulfilling-creativity"
    echo "   2. Click on 'backend-rag' or database service"
    echo "   3. Go to 'Variables' tab"
    echo "   4. Copy the DATABASE_URL value"
    echo ""
    echo "   Option 2 - Fly.io CLI (from backend-rag directory):"
    echo "   $ cd apps/backend-rag"
    echo "   $ railway variables"
    echo "   (Look for DATABASE_URL in the output)"
    echo ""
    echo "Then run this script with:"
    echo "   $ export DATABASE_URL='postgresql://...'"
    echo "   $ ./scripts/setup_dataset_extraction.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL found${NC}"
echo ""

# Test connection
echo "🔌 Testing PostgreSQL connection..."
python3 -c "
import asyncio
import asyncpg
import os
import sys

async def test_connection():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        version = await conn.fetchval('SELECT version()')
        await conn.close()
        print('✅ Connection successful')
        print(f'   PostgreSQL: {version.split(\",\")[0]}')
        return True
    except Exception as e:
        print(f'❌ Connection failed: {e}')
        return False

result = asyncio.run(test_connection())
sys.exit(0 if result else 1)
" || {
    echo -e "${RED}❌ Failed to connect to PostgreSQL${NC}"
    echo "   Check that DATABASE_URL is correct"
    exit 1
}

echo ""
echo "📊 Running stats-only extraction (no data export)..."
echo ""

# Run stats-only extraction
python3 scripts/extract_dataset_from_postgres.py --stats-only

echo ""
echo "======================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📋 Next steps:"
echo ""
echo "   If stats look good (>500 conversations):"
echo "   $ python3 scripts/extract_dataset_from_postgres.py \\"
echo "       --days 30 \\"
echo "       --limit 5000 \\"
echo "       --output ./data/llama_ft_dataset"
echo ""
echo "   Then format for training:"
echo "   $ python3 scripts/prepare_llama_dataset.py"
echo ""
