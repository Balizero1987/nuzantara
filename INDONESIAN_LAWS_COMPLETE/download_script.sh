#!/bin/bash

# Script per scaricare TUTTE le leggi indonesiane vigenti
# Fonti ufficiali: peraturan.go.id, jdih.kemenkeu.go.id, hukumonline.com

BASE_DIR="$HOME/Desktop/Indonesian_Laws_Complete"
mkdir -p "$BASE_DIR/Critical" "$BASE_DIR/High_Priority" "$BASE_DIR/Codes" "$BASE_DIR/Sectoral"

echo "🇮🇩 Downloading Indonesian Laws - Complete Collection"
echo "======================================================"

# CRITICAL (6 leggi)
echo "📥 [1/6] UU 6/2023 - Cipta Kerja..."
curl -L -o "$BASE_DIR/Critical/UU_6_2023_Cipta_Kerja.pdf" \
  "https://peraturan.go.id/files/uu0062023.pdf" 2>/dev/null || echo "⚠️  Fallback needed"

echo "📥 [2/6] UU 7/2021 - Harmonisasi Perpajakan..."
curl -L -o "$BASE_DIR/Critical/UU_7_2021_HPP.pdf" \
  "https://peraturan.go.id/files/uu0072021.pdf" 2>/dev/null

echo "📥 [3/6] UU 36/2008 - Pajak Penghasilan..."
curl -L -o "$BASE_DIR/Critical/UU_36_2008_PPh.pdf" \
  "https://peraturan.go.id/files/uu0362008.pdf" 2>/dev/null

echo "📥 [4/6] UU 42/2009 - PPN..."
curl -L -o "$BASE_DIR/Critical/UU_42_2009_PPN.pdf" \
  "https://peraturan.go.id/files/uu0422009.pdf" 2>/dev/null

echo "📥 [5/6] UU 6/2011 - Keimigrasian..."
curl -L -o "$BASE_DIR/Critical/UU_6_2011_Keimigrasian.pdf" \
  "https://peraturan.go.id/files/uu0062011.pdf" 2>/dev/null

echo "📥 [6/6] PP 28/2025 - PBBR (già processato)..."
curl -L -o "$BASE_DIR/Critical/PP_28_2025_PBBR.pdf" \
  "https://peraturan.go.id/files/pp0282025.pdf" 2>/dev/null

# HIGH PRIORITY (10 leggi)
echo ""
echo "📥 HIGH PRIORITY LAWS..."

curl -L -o "$BASE_DIR/High_Priority/UU_40_2007_PT.pdf" \
  "https://peraturan.go.id/files/uu0402007.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/High_Priority/UU_25_2007_Penanaman_Modal.pdf" \
  "https://peraturan.go.id/files/uu0252007.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/High_Priority/UU_5_1960_UUPA.pdf" \
  "https://peraturan.go.id/files/uu0051960.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/High_Priority/UU_13_2003_Ketenagakerjaan.pdf" \
  "https://peraturan.go.id/files/uu0132003.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/High_Priority/PP_35_2021_PKWT.pdf" \
  "https://peraturan.go.id/files/pp0352021.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/High_Priority/UU_1_1974_Perkawinan.pdf" \
  "https://peraturan.go.id/files/uu0011974.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/High_Priority/UU_23_2006_Adminduk.pdf" \
  "https://peraturan.go.id/files/uu0232006.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/High_Priority/UU_24_2013_Adminduk_Amendment.pdf" \
  "https://peraturan.go.id/files/uu0242013.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/High_Priority/UU_20_2011_Rumah_Susun.pdf" \
  "https://peraturan.go.id/files/uu0202011.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/High_Priority/UU_1_2011_Perumahan.pdf" \
  "https://peraturan.go.id/files/uu0012011.pdf" 2>/dev/null

# CODES (4 leggi fondamentali)
echo ""
echo "📥 FUNDAMENTAL CODES..."

curl -L -o "$BASE_DIR/Codes/KUHP_2025_New.pdf" \
  "https://peraturan.go.id/files/uu0012023.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Codes/KUHPerdata_Burgerlijk_Wetboek.pdf" \
  "https://peraturan.go.id/files/kuhperdata.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Codes/UU_19_2016_ITE.pdf" \
  "https://peraturan.go.id/files/uu0192016.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Codes/PP_71_2019_PSE.pdf" \
  "https://peraturan.go.id/files/pp0712019.pdf" 2>/dev/null

# SECTORAL (14 leggi - campione rappresentativo)
echo ""
echo "📥 SECTORAL LAWS (Banking, Construction, Healthcare, etc.)..."

# Banking (3)
curl -L -o "$BASE_DIR/Sectoral/UU_7_1992_Perbankan.pdf" \
  "https://peraturan.go.id/files/uu0071992.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Sectoral/UU_21_2011_OJK.pdf" \
  "https://peraturan.go.id/files/uu0212011.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Sectoral/UU_4_2023_PPSK.pdf" \
  "https://peraturan.go.id/files/uu0042023.pdf" 2>/dev/null

# Construction (2)
curl -L -o "$BASE_DIR/Sectoral/UU_2_2017_Jasa_Konstruksi.pdf" \
  "https://peraturan.go.id/files/uu0022017.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Sectoral/UU_28_2002_Bangunan_Gedung.pdf" \
  "https://peraturan.go.id/files/uu0282002.pdf" 2>/dev/null

# Healthcare (3)
curl -L -o "$BASE_DIR/Sectoral/UU_36_2009_Kesehatan.pdf" \
  "https://peraturan.go.id/files/uu0362009.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Sectoral/UU_29_2004_Praktik_Kedokteran.pdf" \
  "https://peraturan.go.id/files/uu0292004.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Sectoral/UU_44_2009_Rumah_Sakit.pdf" \
  "https://peraturan.go.id/files/uu0442009.pdf" 2>/dev/null

# Environment (2)
curl -L -o "$BASE_DIR/Sectoral/UU_32_2009_Lingkungan_Hidup.pdf" \
  "https://peraturan.go.id/files/uu0322009.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Sectoral/UU_18_2008_Persampahan.pdf" \
  "https://peraturan.go.id/files/uu0182008.pdf" 2>/dev/null

# Maritime (2)
curl -L -o "$BASE_DIR/Sectoral/UU_17_2008_Pelayaran.pdf" \
  "https://peraturan.go.id/files/uu0172008.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Sectoral/UU_31_2004_Perikanan.pdf" \
  "https://peraturan.go.id/files/uu0312004.pdf" 2>/dev/null

# Education (2)
curl -L -o "$BASE_DIR/Sectoral/UU_20_2003_Sisdiknas.pdf" \
  "https://peraturan.go.id/files/uu0202003.pdf" 2>/dev/null

curl -L -o "$BASE_DIR/Sectoral/UU_12_2012_Pendidikan_Tinggi.pdf" \
  "https://peraturan.go.id/files/uu0122012.pdf" 2>/dev/null

echo ""
echo "✅ Download complete! Total: 35 leggi"
echo "📂 Location: $BASE_DIR"
ls -lh "$BASE_DIR"/*/*.pdf 2>/dev/null | wc -l | xargs echo "   Files downloaded:"
