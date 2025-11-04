# Release Notes — 2025-10-02

## Highlight
- Decision Helper (MD/CSV) untuk KBLI yang paling sering dipakai di Bali (villa/hotel/restaurant/consulting/design)
- Use Cases ditambahkan dalam panduan “Bali Common Businesses”
- Visa Oracle: contoh dengan `balizero_price_ref` + overlay harga (tanpa angka eksplisit dalam simulasi)
- KBLI chemicals/pharma/materials: mapping BPS diperbaiki + subseksi baru 20xxx/23xxx + CSV ringkasan
- Kebijakan “tidak ada harga, hanya knowledge” ditambahkan ke dokumen KBLI/Visa Oracle

## File utama
- KB decision
  - KBLI_DECISION_HELPER.md, KBLI_DECISION_HELPER.csv
  - KBLI_BALI_COMMON_BUSINESSES_COMPLETE_GUIDE.md (Use Cases)
- Visa Oracle pricing
  - Visa oracle/pricing/normalized.json
  - Visa oracle/examples/_price_overlay.json
  - Diperbarui: E33G_digital_nomad.examples.jsonl, E33_second_home.examples.jsonl, KITAS_*.examples.jsonl, C1_business.examples.jsonl, GOLDEN_*.examples.jsonl
- Chemicals/Materials
  - KBLI_CHEMICALS_PHARMACEUTICALS_MATERIALS.md
  - CSV: KBLI_CHEM_PHAR_MATERIALS_NEW_ROWS_2025-10-02*.csv (master termasuk)

## Catatan
- Tidak ada harga layanan yang dimasukkan dalam dokumen KB: daftar harga disimpan terpisah
- CSV “master” konsolidasi siap untuk import

## Next
- Checklist bundle untuk kombinasi kunci (hospitality/F&B/real estate/design)
- Cross-link dari Decision Helper ke tiap seksi
