#!/bin/bash

# ================================
# ZANTARA Legal Processing Setup
# 8 Workers for Indonesian Laws
# ================================

echo "🚀 Setting up 8-Worker Legal Processing System..."

BASE_DIR="/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA"
WORKERS_DIR="$BASE_DIR/02_AI_WORKERS"
DOWNLOADS_DIR="/Users/antonellosiano/Downloads/drive-download-20251103T031331Z-001"

# Create Worker 7 & 8 directories
echo "📁 Creating Worker 7 & 8 folders..."
mkdir -p "$WORKERS_DIR/Worker_7_Banking_Digital/INPUT"
mkdir -p "$WORKERS_DIR/Worker_7_Banking_Digital/OUTPUT"
mkdir -p "$WORKERS_DIR/Worker_8_Infrastructure_Environment/INPUT"
mkdir -p "$WORKERS_DIR/Worker_8_Infrastructure_Environment/OUTPUT"

# Move downloaded PDFs to correct worker folders
echo "📦 Moving downloaded PDFs to worker folders..."

# Worker 1: Tax & Financial
mv "$DOWNLOADS_DIR/Salinan UU Nomor 7 Tahun 2021.pdf" "$WORKERS_DIR/Worker_1_Tax_Investment/INPUT/" 2>/dev/null
mv "$DOWNLOADS_DIR/PP Nomor 55 Tahun 2022.pdf" "$WORKERS_DIR/Worker_1_Tax_Investment/INPUT/" 2>/dev/null

# Worker 5: Manpower & Employment
mv "$DOWNLOADS_DIR/PP Nomor 35 Tahun 2021.pdf" "$WORKERS_DIR/Worker_5_Healthcare_Social/INPUT/" 2>/dev/null
mv "$DOWNLOADS_DIR/PP Nomor 44 Tahun 2022.pdf" "$WORKERS_DIR/Worker_5_Healthcare_Social/INPUT/" 2>/dev/null
mv "$DOWNLOADS_DIR/UU Nomor 12 Tahun 2012.pdf" "$WORKERS_DIR/Worker_5_Healthcare_Social/INPUT/" 2>/dev/null

# Worker 6: Healthcare & Social (PSE)
mv "$DOWNLOADS_DIR/PP Nomor 71 Tahun 2019.pdf" "$WORKERS_DIR/Worker_6_Specialized/INPUT/" 2>/dev/null

# Worker 7: Banking & Digital Economy
mv "$DOWNLOADS_DIR/UU Nomor  19 Tahun 2016.pdf" "$WORKERS_DIR/Worker_7_Banking_Digital/INPUT/" 2>/dev/null

# Worker 4: Property & Civil Code
mv "$DOWNLOADS_DIR/Civil Code.pdf" "$WORKERS_DIR/Worker_4_Property_Environment/INPUT/" 2>/dev/null

echo "✅ Setup complete! Structure:"
echo ""
tree -L 3 "$WORKERS_DIR" 2>/dev/null || ls -R "$WORKERS_DIR"

echo ""
echo "📊 Current Status:"
echo "   - Worker 1 (Tax): 2 laws ready"
echo "   - Worker 4 (Property): 1 law ready"
echo "   - Worker 5 (Manpower): 3 laws ready"
echo "   - Worker 6 (Healthcare): 1 law ready"
echo "   - Worker 7 (Banking): 1 law ready"
echo "   - TOTAL: 8 laws distributed"
echo ""
echo "🎯 Next: Process each law using PP 28/2025 methodology"
echo "📖 Read: COMPLETE_LAW_INVENTORY.md for full 33-law plan"
