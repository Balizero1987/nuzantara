#!/bin/bash

# Make all shell scripts executable
cd ~/Desktop/LEGAL_PROCESSING_ZANTARA

chmod +x MOVE_NEW_PDFS.sh
chmod +x CLEANUP_DOCS.sh
chmod +x CHECK_STATUS.sh

echo "✅ All scripts are now executable"
echo ""
echo "Available commands:"
echo "  ./CHECK_STATUS.sh      - Verify system status"
echo "  ./MOVE_NEW_PDFS.sh     - Assign PDFs to workers"
echo "  ./CLEANUP_DOCS.sh      - Archive redundant docs"
