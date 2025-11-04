#!/bin/bash

# ========================================
# EXPAND LEGAL PROCESSING TO 8 AI WORKERS
# ========================================

echo "🚀 Expanding to 8 AI Workers..."

cd /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA

# Create Worker 7 & 8 directories
mkdir -p 02_AI_WORKERS/Worker_7_Tax_Advanced/{INPUT,OUTPUT,REPORTS}
mkdir -p 02_AI_WORKERS/Worker_8_Legal_Codes/{INPUT,OUTPUT,REPORTS}

echo "✅ Worker 7 & 8 directories created"

# Move 8 new PDFs from Downloads to 01_RAW_LAWS
echo "📥 Moving new PDFs to 01_RAW_LAWS..."

cd "/Users/antonellosiano/Downloads/drive-download-20251103T031331Z-1-001"

cp "Civil Code.pdf" /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS/
cp "PP Nomor 35 Tahun 2021.pdf" /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS/
cp "PP Nomor 44 Tahun 2022.pdf" /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS/
cp "PP Nomor 55 Tahun 2022.pdf" /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS/
cp "PP Nomor 71 Tahun 2019.pdf" /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS/
cp "Salinan UU Nomor 7 Tahun 2021.pdf" /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS/
cp "UU Nomor  19 Tahun 2016.pdf" /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS/
cp "UU Nomor 12 Tahun 2012.pdf" /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS/

echo "✅ PDFs moved to 01_RAW_LAWS"

# Assign PDFs to Workers 7 & 8
echo "📂 Assigning PDFs to Workers..."

cd /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA

# Worker 7: Tax Advanced (4 leggi)
cp "01_RAW_LAWS/Salinan UU Nomor 7 Tahun 2021.pdf" 02_AI_WORKERS/Worker_7_Tax_Advanced/INPUT/
cp "01_RAW_LAWS/PP Nomor 35 Tahun 2021.pdf" 02_AI_WORKERS/Worker_7_Tax_Advanced/INPUT/
cp "01_RAW_LAWS/PP Nomor 55 Tahun 2022.pdf" 02_AI_WORKERS/Worker_7_Tax_Advanced/INPUT/
cp "01_RAW_LAWS/PP Nomor 71 Tahun 2019.pdf" 02_AI_WORKERS/Worker_7_Tax_Advanced/INPUT/

# Worker 8: Legal Codes (4 leggi)
cp "01_RAW_LAWS/Civil Code.pdf" 02_AI_WORKERS/Worker_8_Legal_Codes/INPUT/
cp "01_RAW_LAWS/PP Nomor 44 Tahun 2022.pdf" 02_AI_WORKERS/Worker_8_Legal_Codes/INPUT/
cp "01_RAW_LAWS/UU Nomor  19 Tahun 2016.pdf" 02_AI_WORKERS/Worker_8_Legal_Codes/INPUT/
cp "01_RAW_LAWS/UU Nomor 12 Tahun 2012.pdf" 02_AI_WORKERS/Worker_8_Legal_Codes/INPUT/

echo "✅ PDFs assigned to Workers 7 & 8"

echo ""
echo "🎯 DONE! Now you have 8 AI Workers ready:"
echo ""
echo "   Worker #1: Tax & Investment (4 leggi)"
echo "   Worker #2: Immigration & Manpower (4 leggi)"
echo "   Worker #3: Omnibus & Licensing (4 leggi)"
echo "   Worker #4: Property & Environment (5 leggi)"
echo "   Worker #5: Healthcare & Social (4 leggi)"
echo "   Worker #6: Specialized (4 leggi)"
echo "   Worker #7: Tax Advanced (4 leggi) ⭐ NEW"
echo "   Worker #8: Legal Codes (4 leggi) ⭐ NEW"
echo ""
echo "📊 TOTAL: 33 Indonesian laws ready for processing"
echo ""
echo "👉 Next step: Create INSTRUCTIONS_WORKER_7 and INSTRUCTIONS_WORKER_8"
