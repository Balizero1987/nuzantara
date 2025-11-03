#!/bin/bash
# Download Indonesian laws from official sources

OUT="/Users/antonellosiano/Desktop/INDONESIAN_LAWS_COMPLETE"
mkdir -p "$OUT"

echo "🇮🇩 Downloading Indonesian Laws - Direct Sources"

# UU 6/2023 Cipta Kerja
wget -O "$OUT/UU_6_2023.pdf" "https://jdih.setneg.go.id/download/uu/UU_6_2023.pdf" 2>/dev/null && echo "✅ UU 6/2023" || echo "❌ UU 6/2023"

# UU 7/2021 HPP
wget -O "$OUT/UU_7_2021.pdf" "https://jdih.setneg.go.id/download/uu/UU_7_2021.pdf" 2>/dev/null && echo "✅ UU 7/2021" || echo "❌ UU 7/2021"

# UU 6/2011 Immigration
wget -O "$OUT/UU_6_2011.pdf" "https://jdih.setneg.go.id/download/uu/UU_6_2011.pdf" 2>/dev/null && echo "✅ UU 6/2011" || echo "❌ UU 6/2011"

# PP 31/2013
wget -O "$OUT/PP_31_2013.pdf" "https://jdih.setneg.go.id/download/pp/PP_31_2013.pdf" 2>/dev/null && echo "✅ PP 31/2013" || echo "❌ PP 31/2013"

# PP 34/2021 TKA
wget -O "$OUT/PP_34_2021.pdf" "https://jdih.setneg.go.id/download/pp/PP_34_2021.pdf" 2>/dev/null && echo "✅ PP 34/2021" || echo "❌ PP 34/2021"

# UU 40/2007 PT
wget -O "$OUT/UU_40_2007.pdf" "https://jdih.setneg.go.id/download/uu/UU_40_2007.pdf" 2>/dev/null && echo "✅ UU 40/2007" || echo "❌ UU 40/2007"

# UU 25/2007 Investment
wget -O "$OUT/UU_25_2007.pdf" "https://jdih.setneg.go.id/download/uu/UU_25_2007.pdf" 2>/dev/null && echo "✅ UU 25/2007" || echo "❌ UU 25/2007"

# UU 13/2003 Labor
wget -O "$OUT/UU_13_2003.pdf" "https://jdih.setneg.go.id/download/uu/UU_13_2003.pdf" 2>/dev/null && echo "✅ UU 13/2003" || echo "❌ UU 13/2003"

# KUHP 2025
wget -O "$OUT/KUHP_2025.pdf" "https://jdih.setneg.go.id/download/uu/UU_1_2023.pdf" 2>/dev/null && echo "✅ KUHP 2025" || echo "❌ KUHP 2025"

# Banking
wget -O "$OUT/UU_7_1992_Banking.pdf" "https://jdih.setneg.go.id/download/uu/UU_7_1992.pdf" 2>/dev/null && echo "✅ UU 7/1992" || echo "❌ UU 7/1992"

echo ""
echo "📊 Downloaded files:"
ls -lh "$OUT"/*.pdf | wc -l
