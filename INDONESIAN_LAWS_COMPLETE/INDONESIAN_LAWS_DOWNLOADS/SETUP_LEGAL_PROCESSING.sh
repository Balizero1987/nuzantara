#!/bin/bash

# 🏛️ ZANTARA LEGAL PROCESSING - Setup Script
# Crea struttura completa per processare 25 leggi indonesiane

BASE_DIR="$HOME/Desktop/LEGAL_PROCESSING_ZANTARA"

echo "🚀 Creazione struttura LEGAL_PROCESSING_ZANTARA..."

# Create main directory
mkdir -p "$BASE_DIR"

# Create top-level folders
mkdir -p "$BASE_DIR/01_RAW_LAWS"
mkdir -p "$BASE_DIR/03_PROCESSED_OUTPUT"
mkdir -p "$BASE_DIR/04_QUALITY_REPORTS"
mkdir -p "$BASE_DIR/05_TEST_QUESTIONS"

# Create AI Workers structure
mkdir -p "$BASE_DIR/02_AI_WORKERS"

# Worker 1: Tax & Investment
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_1_Tax_Investment/INPUT"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_1_Tax_Investment/WORK_IN_PROGRESS"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_1_Tax_Investment/OUTPUT"

# Worker 2: Immigration & Manpower
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_2_Immigration_Manpower/INPUT"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_2_Immigration_Manpower/WORK_IN_PROGRESS"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_2_Immigration_Manpower/OUTPUT"

# Worker 3: Omnibus & Licensing  
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_3_Omnibus_Licensing/INPUT"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_3_Omnibus_Licensing/WORK_IN_PROGRESS"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_3_Omnibus_Licensing/OUTPUT"

# Worker 4: Property & Environment
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_4_Property_Environment/INPUT"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_4_Property_Environment/WORK_IN_PROGRESS"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_4_Property_Environment/OUTPUT"

# Worker 5: Healthcare & Social
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_5_Healthcare_Social/INPUT"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_5_Healthcare_Social/WORK_IN_PROGRESS"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_5_Healthcare_Social/OUTPUT"

# Worker 6: Specialized
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_6_Specialized/INPUT"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_6_Specialized/WORK_IN_PROGRESS"
mkdir -p "$BASE_DIR/02_AI_WORKERS/Worker_6_Specialized/OUTPUT"

echo "✅ Struttura creata in: $BASE_DIR"
echo ""
echo "📂 Struttura:"
ls -R "$BASE_DIR"

echo ""
echo "🎯 Prossimi step:"
echo "1. Scarica le 25 leggi PDF in 01_RAW_LAWS/"
echo "2. Leggi README_COORDINAMENTO.md per istruzioni"
echo "3. Assegna leggi ai 6 AI workers"
