#!/bin/bash

# LEGAL PROCESSING ZANTARA - PDF Assignment Script
# Moves 8 new PDFs to appropriate AI Workers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ZANTARA Legal Processing - PDF Assignment ===${NC}"
echo ""

# Base paths
DOWNLOADS_DIR="$HOME/Downloads/drive-download-20251103T031331Z-1-001"
BASE_DIR="$HOME/Desktop/LEGAL_PROCESSING_ZANTARA"
RAW_LAWS="$BASE_DIR/01_RAW_LAWS"
WORKERS="$BASE_DIR/02_AI_WORKERS"

# Check if downloads exist
if [ ! -d "$DOWNLOADS_DIR" ]; then
    echo "❌ Error: Downloads directory not found at $DOWNLOADS_DIR"
    echo "Please adjust the path in this script."
    exit 1
fi

echo "📁 Source: $DOWNLOADS_DIR"
echo "📁 Target: $BASE_DIR"
echo ""

# Step 1: Copy all PDFs to RAW_LAWS
echo -e "${GREEN}Step 1: Copying PDFs to RAW_LAWS...${NC}"
cp "$DOWNLOADS_DIR"/*.pdf "$RAW_LAWS/" 2>/dev/null || echo "⚠️  Some files may already exist"
echo "✅ PDFs copied to RAW_LAWS"
echo ""

# Step 2: Assign to Workers
echo -e "${GREEN}Step 2: Assigning PDFs to Workers...${NC}"

# Worker 1 - Tax & Investment
echo "  📋 Worker 1 (Tax): Salinan UU Nomor 7 Tahun 2021.pdf"
cp "$RAW_LAWS/Salinan UU Nomor 7 Tahun 2021.pdf" \
   "$WORKERS/Worker_1_Tax_Investment/INPUT/" 2>/dev/null || echo "    ↳ Already exists"

# Worker 3 - Omnibus & Licensing
echo "  📋 Worker 3 (Omnibus): PP 35/2021, PP 44/2022"
cp "$RAW_LAWS/PP Nomor 35 Tahun 2021.pdf" \
   "$WORKERS/Worker_3_Omnibus_Licensing/INPUT/" 2>/dev/null || echo "    ↳ Already exists"
cp "$RAW_LAWS/PP Nomor 44 Tahun 2022.pdf" \
   "$WORKERS/Worker_3_Omnibus_Licensing/INPUT/" 2>/dev/null || echo "    ↳ Already exists"

# Worker 4 - Property & Environment
echo "  📋 Worker 4 (Property): PP 55/2022"
cp "$RAW_LAWS/PP Nomor 55 Tahun 2022.pdf" \
   "$WORKERS/Worker_4_Property_Environment/INPUT/" 2>/dev/null || echo "    ↳ Already exists"

# Worker 5 - Healthcare & Social
echo "  📋 Worker 5 (Healthcare): PP 71/2019"
cp "$RAW_LAWS/PP Nomor 71 Tahun 2019.pdf" \
   "$WORKERS/Worker_5_Healthcare_Social/INPUT/" 2>/dev/null || echo "    ↳ Already exists"

# Worker 6 - Specialized
echo "  📋 Worker 6 (Specialized): Civil Code"
cp "$RAW_LAWS/Civil Code.pdf" \
   "$WORKERS/Worker_6_Specialized/INPUT/" 2>/dev/null || echo "    ↳ Already exists"

# Worker 7 - Banking & Digital
echo "  📋 Worker 7 (Banking): UU 19/2016 (ITE)"
cp "$RAW_LAWS/UU Nomor  19 Tahun 2016.pdf" \
   "$WORKERS/Worker_7_Banking_Digital/INPUT/" 2>/dev/null || echo "    ↳ Already exists"

# Worker 8 - Infrastructure & Environment
echo "  📋 Worker 8 (Infrastructure): UU 12/2012"
cp "$RAW_LAWS/UU Nomor 12 Tahun 2012.pdf" \
   "$WORKERS/Worker_8_Infrastructure_Environment/INPUT/" 2>/dev/null || echo "    ↳ Already exists"

echo ""
echo -e "${GREEN}✅ All PDFs assigned!${NC}"
echo ""

# Step 3: Summary
echo "📊 SUMMARY:"
echo "════════════════════════════════════════"
for i in {1..8}; do
    WORKER_DIR=$(find "$WORKERS" -maxdepth 1 -type d -name "Worker_${i}_*" | head -1)
    if [ -d "$WORKER_DIR" ]; then
        WORKER_NAME=$(basename "$WORKER_DIR")
        PDF_COUNT=$(ls -1 "$WORKER_DIR/INPUT"/*.pdf 2>/dev/null | wc -l | tr -d ' ')
        echo "  Worker $i ($WORKER_NAME): $PDF_COUNT PDFs"
    fi
done
echo "════════════════════════════════════════"
echo ""

# Step 4: What's next
echo -e "${BLUE}🚀 NEXT STEPS:${NC}"
echo "1. Read COMPLETE_SETUP_GUIDE.md for full instructions"
echo "2. Start with Worker 1 (highest priority - Tax)"
echo "3. Open: Worker_1_Tax_Investment/WORKER_1_COMPLETE_PROMPT.md"
echo "4. Use GPT-4, Claude, or Qwen to process each PDF"
echo "5. Save outputs to respective OUTPUT/ folders"
echo ""
echo "Good luck, Zero! 💪"
