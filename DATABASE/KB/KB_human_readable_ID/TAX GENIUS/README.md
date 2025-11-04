# Tax Genius Knowledge Base

> **Tujuan**: Knowledge base lengkap untuk perhitungan dan kepatuhan pajak Indonesia
> **Status**: Siap Produksi
> **Terakhir Diperbarui**: 2025-10-01

---

## 📚 File dalam Knowledge Base Ini (15 Total)

### 1. **INDONESIAN_TAX_REGULATIONS_2025.md** ⭐⭐⭐⭐⭐
**Ukuran**: 7.9 KB
**Konten**:
- Tarif pajak korporat (22%, 11%, 0.5% PP 23/2018)
- Bracket progresif pajak penghasilan pribadi
- VAT (PPN 11%)
- Tarif withholding tax (PPh 21/23/26)
- Tarif BPJS (Kesehatan 4%, Ketenagakerjaan 6.24%)
- Tenggat waktu pajak (bulanan, kuartalan, tahunan)
- Insentif pajak (Super Deduction 200%, Tax Holiday, Tax Allowance)
- 68+ perjanjian pajak
- Pajak daerah NPWPD (Bali: 10% hospitality)
- Penalti
- Faktor risiko audit
- Sumber resmi

**Gunakan untuk**: Dasar hukum, referensi tarif pajak, tenggat waktu

---

### 2. **TAX_CALCULATIONS_EXAMPLES.md** ⭐⭐⭐⭐⭐
**Ukuran**: ~18KB
**Konten**:
- Skenario 1: Restoran Canggu (Pendapatan 500M/bulan)
  - Rincian lengkap: PPh 21/23/25, PPN, NPWPD, BPJS
  - Total: IDR 111M/bulan (tarif efektif 22.2%)
- Skenario 2: Konsultan (Pendapatan 300M/bulan)
  - Optimasi PP 23/2018 (0.5% vs 22%)
  - Total: IDR 32M/bulan (tarif efektif 10.6%)
  - Penghematan: IDR 11.7M/bulan
- Skenario 3: Sewa Villa (Pendapatan 150M/bulan)
  - Total: IDR 23M/bulan (tarif efektif 15.6%)
- Kode TypeScript siap copy-paste
- Peluang optimasi per skenario
- Generator kalender kepatuhan
- Panduan implementasi (Langkah 1-3)
- Test case

**Gunakan untuk**: Referensi implementasi, contoh kode, testing

---

### 3. **tax-analyzer.ts** ⭐⭐⭐⭐⭐
**Ukuran**: 681 baris
**Konten**:
- Kelas TaxGenius siap produksi
- Scraping website DJP (pajak.go.id) setiap 3 jam
- Analisis optimasi pajak
- Penilaian risiko audit
- Generator kalender kepatuhan
- Analisis dampak regulasi (dengan Gemini AI)
- Pemeriksa manfaat perjanjian
- Data benchmark industri
- Klasifikasi keamanan (PUBLIC/INTERNAL/CONFIDENTIAL)
- Interface TypeScript: TaxUpdate, TaxOptimization, ComplianceCalendar, AuditRisk

**Gunakan untuk**: Fitur lanjutan, integrasi AI, otomasi

---

### 4. **PRICING_OFFICIAL_2025.json**
**Ukuran**: ~8KB (JSON)
**Konten**:
- Daftar harga resmi Bali Zero 2025
- Harga layanan pajak:
  - BPJS Kesehatan: IDR 2,500,000
  - BPJS Ketenagakerjaan: IDR 1,500,000
  - SPT Tahunan (Operasional): IDR 4,000,000+
  - SPT Tahunan (Zero): IDR 3,000,000+
  - SPT Personal: IDR 2,000,000
  - Pajak Bulanan: IDR 1,500,000+
  - NPWP Personal: IDR 1,000,000
  - NPWPD: IDR 2,500,000
  - LKPM: IDR 1,000,000 (kuartalan)

**Gunakan untuk**: Kuotasi harga, deskripsi layanan

---

### 5. **BALI_ZERO_SERVICES_PRICELIST_2025.txt**
**Ukuran**: ~12KB
**Konten**:
- Katalog layanan lengkap Bali Zero
- Bagian perpajakan dengan:
  - Pelaporan pajak bulanan (PPh 21/23/25, PPN)
  - SPT pajak tahunan (korporat, pribadi)
  - Pendaftaran BPJS
  - Pelaporan LKPM
  - Konsultasi pajak
- Pendirian perusahaan, lisensi, layanan real estate

**Gunakan untuk**: Konteks layanan lengkap, deskripsi paket

---

### 6. **BALI_ZERO_COMPANY_BRIEF_v520.md**
**Ukuran**: 3.4 KB
**Konten**:
- Profil perusahaan (23 orang, multibahasa)
- Tim pajak: Veronika (Manager), Angel (Expert), Kadek, Dewa Ayu, Faisha
- Platform ZANTARA v5.2.0
- Kontak resmi (+62 813 3805 1876, info@balizero.com)

**Gunakan untuk**: Konteks perusahaan, struktur tim

---

### 7. **INDUSTRY_BENCHMARKS.json** ⭐⭐⭐⭐ BARU!
**Ukuran**: 5.4 KB
**Konten**:
- Benchmark margin keuntungan per industri (10 sektor)
  - Restoran: 15% (rentang 10-20%)
  - Konsultan: 30% (rentang 25-40%)
  - Perdagangan: 5% (rentang 3-8%)
  - Manufaktur: 10% (rentang 8-15%)
  - Akomodasi: 25% (rentang 20-35%)
  - Konstruksi: 8% (rentang 5-12%)
  - Hiburan: 22% (rentang 18-30%)
  - Transportasi: 12% (rentang 8-15%)
  - Pendidikan: 18% (rentang 15-25%)
  - Layanan: 20% (rentang 15-30%)
- Faktor risiko audit:
  - Margin keuntungan rendah (< 50% rata-rata industri) = Risiko +20
  - Hiburan tinggi (> 1% pendapatan) = Risiko +15
  - Pihak terkait tinggi (> 30% pendapatan) = Risiko +25
  - Tunai tinggi (> 10% pendapatan) = Risiko +10
  - Gap VAT = Risiko +20
- Contoh penggunaan dengan perhitungan skor risiko

**Gunakan untuk**: `assessAuditRisk()`, `findOptimizations()`, analisis industri

---

### 8. **TAX_TREATIES_INDONESIA.json** ⭐⭐⭐⭐ BARU!
**Ukuran**: 9.4 KB
**Konten**:
- 71+ perjanjian pajak (daftar lengkap)
- Tarif standar tanpa perjanjian: 20% (semua kategori)
- Tarif perjanjian per negara (30+ negara detail):
  - **Belanda**: 5% dividen (langsung), 5% royalti ⭐ TERBAIK
  - **Hong Kong**: 5% dividen (langsung), 5% royalti
  - **UAE**: 5% bunga, 5% royalti
  - **Singapura**: 10% dividen, 8% royalti
  - **Italia**: 10% dividen, 10% bunga/royalti
  - **USA**: 10% dividen (langsung), 10% bunga/royalti
  - Dan 24+ negara lainnya
- Persyaratan Certificate of Domicile (CoD)
- Persyaratan Formulir DGT
- Contoh kalkulator penghematan
- Kasus penggunaan umum:
  - Investor expat (Italia, Belanda, USA, Australia, UK)
  - Struktur holding (Belanda, Hong Kong, UAE, Singapura)
  - Pembayaran royalti (Belanda, Singapura, UAE)
- Saran Bali Zero dengan timeline (CoD: 2-4 minggu)

**Gunakan untuk**: `checkTreatyBenefits()`, perencanaan pajak internasional, optimasi dividen

---

### 9. **TAX_DEDUCTIONS_INCENTIVES.json** ⭐⭐⭐⭐⭐ BARU!
**Ukuran**: 11 KB
**Konten**:
- **Super Deduction 200% (PMK 153/2020)**:
  - Biaya R&D: Deduksi 200%
    - Memenuhi syarat: Pengembangan produk, perbaikan proses, inovasi teknologi
    - Contoh: R&D IDR 100M → Penghematan pajak IDR 44M (vs 22M normal)
  - Pelatihan vokasional: Deduksi 200%
    - Memenuhi syarat: Keterampilan teknis, sertifikasi, magang
    - Contoh: Pelatihan IDR 50M → Penghematan pajak IDR 22M (vs 11M normal)
- **Tax Holiday (PP 78/2019)**:
  - Durasi: 5-20 tahun
  - Investasi: Min IDR 500B (~USD 32M)
  - Sektor: Otomotif, Farmasi, Petrokimia, Baja, Elektronik
  - Jadwal: Pembebasan 100% (tahun 1-5), 50% (6-10), 25% (11-15)
- **Tax Allowance (PP 94/2010)**:
  - Pengurangan investasi 30% (selama 6 tahun)
  - Depresiasi dipercepat (menurun ganda)
  - Carryforward rugi: 10 tahun (vs 5 standar)
- **Deduksi Standar**:
  - Dapat dideduksi penuh: Gaji, sewa, utilitas, pemasaran, biaya profesional
  - Dapat dideduksi terbatas: Hiburan (50%), donasi
  - Tidak dapat dideduksi: Denda, biaya pribadi, pengeluaran modal
- **Strategi Optimasi**:
  - PP 23/2018: 0.5% vs 22% (penghematan 88.6%!)
  - Taktik maksimalisasi biaya
  - Strategi timing
  - Optimasi struktur
- **Saran Bali Zero** per sektor:
  - Restoran: Perlengkapan F&B, depresiasi peralatan, pelatihan koki
  - Konsultan: Pengembangan profesional, metodologi R&D, langganan software
  - Villa: Perbaikan properti, pemeliharaan, pemasaran

**Gunakan untuk**: `findOptimizations()`, perhitungan super deduction, perencanaan pajak

---

### 10. **tax-analyzer.ts** ⭐⭐⭐⭐
**Ukuran**: 20 KB (681 baris)
**Konten**: Kelas TaxGenius siap produksi (versi oracle-system)

**Gunakan untuk**: Referensi fitur lanjutan (bukan untuk integrasi segera)

---

### 11. **TRANSFER_PRICING_INDONESIA.json** ⭐⭐⭐⭐ BARU!
**Ukuran**: 12 KB
**Konten**:
- **PMK-172/2023** (efektif 29 Des 2023) - Regulasi konsolidasi terbaru
- **Persyaratan Dokumentasi**:
  - Master File (jatuh tempo 4 bulan setelah akhir tahun, pendapatan > IDR 11 triliun)
  - Local File (jatuh tempo 4 bulan setelah akhir tahun, SEMUA PT PMA)
  - Country-by-Country Report (jatuh tempo 12 bulan, pendapatan > IDR 11 triliun)
- **Definisi Pihak Terkait**: >= 25% kepemilikan, kontrol manajemen, keluarga
- **Metode Transfer Pricing**:
  - Tradisional: CUP, Resale Price, Cost Plus
  - Berbasis keuntungan: TNMM (paling umum), Profit Split
- **Transaksi Umum dengan Benchmark**:
  - Biaya manajemen: 3-8% dari pendapatan (risiko audit TINGGI)
  - Royalti: 2-5% dari pendapatan (pemotongan 20% atau tarif perjanjian)
  - Bunga pinjaman: Tarif pasar + spread kredit, batas debt-to-equity 4:1
  - Penjualan barang: Metode CUP atau Resale Price
- **Penalti**:
  - Dokumentasi tidak memadai: 50% dari pajak yang kurang dibayar
  - Dokumentasi terlambat: Denda IDR 1M - 10M + kriminal
- **Benchmark Industri**:
  - Biaya manajemen: Konsultan 5-8%, Manufaktur 3-5%, Hospitality 4-6%
  - Royalti: Teknologi 3-5%, Merek dagang 2-4%, Software 5-10%
  - Margin distributor: Risiko terbatas 3-6%, Risiko penuh 8-12%
- **Saran Bali Zero**:
  - Pertahankan biaya manajemen < 5% (zona aman)
  - Royalti < 3% (tipikal 2-5%)
  - Debt-to-equity dalam 4:1 (bunga berlebih tidak dapat dideduksi)
  - Siapkan Local File SETIAP tahun (tenggat 4 bulan)
  - Gunakan pendekatan Ex-Ante (siapkan saat transaksi)

**Gunakan untuk**: Kepatuhan PT PMA, transaksi pihak terkait, menghindari penalti 50%

---

### 12. **VAT_PKP_REGULATIONS.json** ⭐⭐⭐⭐⭐ BARU!
**Ukuran**: 11 KB
**Konten**:
- **Pendaftaran PKP**:
  - Batas wajib: Pendapatan IDR 4.8B/tahun
  - Sukarela: Dapat mendaftar di bawah batas
  - Timeline: Harus mendaftar pada akhir bulan berikutnya setelah batas
- **Tarif VAT**: 11% (naik dari 10% 1 April 2022)
- **Kredit Input VAT**:
  - Dapat dikreditkan penuh: Bahan baku, peralatan, perlengkapan kantor, utilitas, layanan profesional, sewa
  - Dapat dikreditkan sebagian: Aset penggunaan campuran (bisnis + pribadi)
  - **TIDAK DAPAT DIKREDITKAN** (kredit 0%):
    - Biaya hiburan (100% DIBLOKIR) ⚠️ DAMPAK BESAR
    - Mobil mewah (> IDR 2B) untuk penggunaan non-bisnis
    - Konsumsi pribadi
    - Barang/jasa untuk aktivitas bebas VAT
- **Sistem E-Faktur**:
  - Wajib untuk semua PKP (tanda tangan digital diperlukan)
  - Tenggat upload: Tanggal 15 bulan berikutnya
  - SPT Masa PPN bulanan: Akhir bulan berikutnya
- **Contoh Perhitungan VAT**:
  - Pendapatan restoran IDR 500M/bulan → Output VAT IDR 55M
  - Pembelian IDR 200M → Input VAT IDR 22M
  - Hiburan IDR 10M → Kredit IDR 0 (DIBLOKIR!)
  - PPN neto terutang: IDR 33M/bulan
- **Pengecualian Hospitality Bali**:
  - F&B/hotel dikenai PB1 10% (pajak daerah) BUKAN VAT
  - Tidak ada VAT dikenakan, tidak ada kredit input
  - Kepatuhan lebih sederhana
- **Penalti**:
  - Pengarsipan terlambat: IDR 500K/bulan
  - Pembayaran terlambat: Bunga 2%/bulan
  - Faktur tidak valid: 2% dari nilai faktur + kredit ditolak
  - Penipuan: Penalti 200% + penuntutan kriminal
- **Saran Bali Zero**:
  - Entertainment VAT 100% diblokir (dampak besar untuk F&B)
  - Contoh: Hiburan IDR 10M → VAT dibayar IDR 1.1M, kredit IDR 0
  - Strategi: Minimalkan hiburan, gunakan makan bisnis

**Gunakan untuk**: Keputusan pendaftaran PKP, optimasi input VAT, kepatuhan e-Faktur

---

### 13. **WITHHOLDING_TAX_MATRIX.json** ⭐⭐⭐⭐⭐ BARU!
**Ukuran**: 13 KB
**Konten**:
- **Matriks Withholding Tax Lengkap**:
  - **PPh 21**: Pajak penghasilan karyawan (progresif 5-35%)
  - **PPh 23**: 2% jasa, 10% dividen/bunga, 15% royalti
  - **PPh 26**: 20% non-residen (atau tarif perjanjian 5-15%)
  - **PPh 4(2)**: 10% sewa (final), 2-4% konstruksi (final)
  - **PPh 15**: 1.2% pelayaran, 1.9% penerbangan
  - **PPh 22**: 2.5% bea impor (dapat dikreditkan)
- **Penalti Tanpa NPWP**: Tarif ganda (PPh 23 2% → 4%)
- **Tenggat**: Tanggal 10 bulan berikutnya (kecuali PPh 22 di bea cukai)
- **Bukti Potong**: Sertifikat pemotongan (harus diterbitkan pada akhir bulan)
- **Manfaat Perjanjian**:
  - Non-residen: 20% standar → 5-15% dengan perjanjian
  - Certificate of Domicile (CoD) diperlukan
  - Contoh: Belanda 5%, Singapura 10%, USA 10%
- **Tarif Konstruksi**:
  - Perencanaan/pengawasan: 4% (berlisensi), 6% (tidak berlisensi)
  - Eksekusi: 2% (berlisensi), 4% (tidak berlisensi)
- **Penghasilan Sewa**: PPh 4(2) 10% final (tidak ada pajak lebih lanjut)
- **Saran Bali Zero**:
  - Selalu minta CoD sebelum pembayaran (10-15% vs 20% = penghematan besar)
  - Biaya manajemen ke induk: PPh 26 20% atau tarif perjanjian
  - Pastikan NPWP dari penyedia layanan (atau bayar tarif ganda)

**Gunakan untuk**: Perhitungan pemotongan, optimasi perjanjian, tenggat kepatuhan

---

### 14. **TAX_AMNESTY_PPS.json** ⭐⭐⭐⭐ BARU!
**Ukuran**: 10 KB
**Konten**:
- **PPS 2022 (Program Pengungkapan Sukarela)**:
  - Status: TUTUP (berakhir 30 Juni 2022)
  - Kebijakan I (aset 1985-2015): Tarif 6-11%
  - Kebijakan II (aset 2016-2020): Tarif 12-18%
  - Manfaat: Tidak ada audit, tidak ada kriminal, tidak ada penalti, pajak final
- **Tax Amnesty 2016-2017** (historis):
  - 972,000 peserta, IDR 4,881 triliun dideklarasikan
  - Tarif: 2-10% (bertahap)
- **Opsi Saat Ini: Pengungkapan Sukarela**:
  - Tarif: 15% + bunga (2%/bulan)
  - Tersedia sebelum audit (tidak ada perlindungan amnesti selama audit)
  - Manfaat: Penalti berkurang, kredit kerjasama
- **CRS/FATCA**:
  - Indonesia menerima data akun asing otomatis
  - Aset tersembunyi semakin sulit
  - Pengungkapan sukarela sebelum DJP menemukan = hasil lebih baik
- **Contoh Perbandingan** (aset tidak diungkap IDR 10B):
  - PPS 2022 (terlewat): 12% = IDR 1.2B (dengan perlindungan amnesti)
  - Pengungkapan sukarela: 15% = IDR 1.5B + bunga
  - Tertangkap dalam audit: Pajak + penalti 200% + bunga 2%/bulan + kriminal = IDR 30B+ KASUS TERBURUK
- **Saran Bali Zero**:
  - Pengungkapan sukarela jika aset tidak dilaporkan signifikan
  - Tunggu amnesti berikutnya (waktu tidak dapat diprediksi, berisiko)
  - CRS aktif: Lebih baik ungkap sukarela daripada tertangkap

**Gunakan untuk**: Strategi aset tidak dilaporkan, kalkulator pengungkapan sukarela

---

### 15. **SECTOR_SPECIFIC_TAX_RULES.json** ⭐⭐⭐⭐⭐ BARU!
**Ukuran**: 17 KB
**Konten**:
- **F&B (Restoran, Kafe, Bar)**:
  - Service charge: 10% wajib (didistribusikan ke karyawan, dikenai PPh 21)
  - NPWPD: 10% pajak daerah (Bali)
  - VAT: DIKECUALIKAN (dikenai NPWPD sebagai gantinya)
  - Pajak alkohol: Bea impor mewah 50-150% + cukai
  - Pungutan wisatawan: IDR 150K per tamu internasional
  - Contoh: Restoran IDR 500M/bulan → Pajak IDR 72M (efektif 14.4%)
- **Sewa Villa**:
  - **PPh 4(2) Pajak Final**: 10% pada sewa bruto (sederhana, tidak ada deduksi)
  - **Pajak Penghasilan Reguler**: Progresif 5-35% pada pendapatan neto (dengan deduksi biaya)
  - **Perbandingan**: Pajak final lebih baik jika biaya < 20%, Pajak reguler lebih baik jika biaya > 30%
  - Contoh: Bruto IDR 150M/bulan
    - Pajak final: IDR 15M/bulan (10% × 150M)
    - Pajak reguler: IDR 28.9M/bulan (jika biaya rendah, efektif 19.2%)
  - Non-residen: Pemotongan 20% (atau tarif perjanjian)
- **Konstruksi**:
  - Perencanaan/pengawasan: 3.5% (dengan SBU), 6% (tanpa SBU)
  - Eksekusi: 1.75% (kecil, dengan SBU), 2.65% (sedang/besar, dengan SBU), 4% (tanpa SBU)
  - **KRUSIAL**: Sertifikasi SBU = penghematan 56% (1.75% vs 4%)!
  - VAT: 11% (jika terdaftar PKP)
  - Contoh: Kontrak IDR 1B
    - Dengan sertifikasi: Pajak IDR 17.5M (1.75%)
    - Tanpa sertifikasi: Pajak IDR 40M (4%) = Penalti IDR 22.5M!
  - Validitas SBU: 3 tahun (atur pengingat perpanjangan)
- **Tabel Perbandingan**:
  - F&B: Tarif efektif 10-15% (NPWPD + pajak korporat)
  - Villa: Tarif efektif 10-19% (tergantung rasio biaya)
  - Konstruksi: Tarif efektif 13-15% (tergantung sertifikasi)

**Gunakan untuk**: Perhitungan sektor-spesifik, keputusan sertifikasi, optimasi pajak F&B vs Villa

---

### 16. **LKPM_COMPLIANCE.json** ⭐⭐⭐⭐⭐ BARU!
**Ukuran**: 15 KB
**Konten**:
- **LKPM (Laporan Kegiatan Penanaman Modal)**:
  - Laporan Aktivitas Investasi untuk perusahaan PT PMA
  - Otoritas: BKPM (Kementerian Investasi)
  - Sistem: OSS (Online Single Submission)
- **Tenggat Waktu Kuartalan**:
  - Q1 (Jan-Mar): Jatuh tempo 10 April
  - Q2 (Apr-Jun): Jatuh tempo 10 Juli
  - Q3 (Jul-Sep): Jatuh tempo 10 Oktober
  - Q4 (Okt-Des): Jatuh tempo 10 Januari
- **2025 ENFORCEMENT LEBIH KETAT**:
  - BKPM berkoordinasi dengan Imigrasi (risiko KITAS!)
  - Sistem peringatan otomatis
  - Sanksi lebih cepat (3 peringatan → penghentian)
  - Dashboard kepatuhan real-time
- **Penalti Progresif**:
  - **Terlewat ke-1**: Surat peringatan
  - **Terlewat ke-2**: Peringatan kedua + surat fisik
  - **Terlewat ke-3**: Peringatan final + ancaman penghentian
  - **Terlewat ke-4**: **PENGHENTIAN SEMENTARA** (tidak dapat beroperasi, tidak ada perpanjangan KITAS, impor/ekspor diblokir)
  - **Berlanjut**: **PENCABUTAN LISENSI** (NIB dibatalkan, perusahaan harus berhenti beroperasi, direktur di-blacklist)
- **Konten Laporan**:
  - Realisasi investasi vs rencana (< 70% memerlukan penjelasan varians)
  - Output produksi/layanan
  - Jumlah karyawan (Indonesia vs asing)
  - Pembayaran pajak (PPh, PPN)
  - Pendapatan penjualan (domestik vs ekspor)
- **Laporan Nihil WAJIB**: Bahkan jika tidak ada aktivitas!
- **Kesalahan Umum**:
  - Lupa laporan nihil (penalti sama berlaku!)
  - Melewatkan tenggat 1 hari (tidak ada grace period)
  - Data tidak konsisten vs laporan pajak (memicu audit)
  - Tidak ada penjelasan varians (realisasi < 70%)
- **Saran Bali Zero**:
  - Atur pengingat Google Calendar: Tanggal 1 April/Juli/Oktober/Januari
  - Siapkan data bulanan (lebih mudah daripada rush kuartalan)
  - 3 laporan terlewat = penghentian (hanya 9 bulan untuk kehilangan lisensi!)
  - Layanan LKPM Bali Zero: IDR 1,000,000/kuartal

**Gunakan untuk**: Kepatuhan PT PMA, menghindari penghentian/pencabutan, otomasi LKPM

---

### 17. **_KB_SUMMARY.md**
**Ukuran**: 9.3 KB
**Konten**: Dokumen ringkasan ini

---

## 🎯 Referensi Cepat

### Cheat Sheet Tarif Pajak

| Pajak | Tarif | Batas/Catatan |
|-----|------|-----------------|
| Korporat (Standar) | 22% | Pendapatan > 4.8B IDR/tahun |
| Korporat (Kecil) | 0.5% | Pendapatan < 4.8B IDR/tahun (PP 23/2018) |
| Pribadi (Progresif) | 5-35% | Bracket: 60M, 250M, 500M, 5B |
| VAT (PPN) | 11% | Sebagian besar barang/jasa |
| Pemotongan (PPh 23) | 2% | Jasa |
| Pemotongan (Dividen) | 10-20% | 10% residen, 20% non-residen |
| BPJS Kesehatan | 4% | Kontribusi pemberi kerja |
| BPJS Ketenagakerjaan | 6.24% | Kontribusi pemberi kerja (bervariasi per risiko) |
| NPWPD (Hospitality) | 10% | Restoran/bar/hotel Bali |

---

### Tenggat Waktu Bulanan

| Tanggal | Kewajiban |
|------|-----------|
| Tanggal 10 | PPh 21, PPh 23, BPJS |
| Tanggal 15 | PPh 25 |
| Akhir bulan berikutnya | PPN (VAT) |
| Tanggal 15 bulan berikutnya | NPWPD (hospitality) |

### Tenggat Waktu Tahunan
- **31 Maret**: SPT pajak pribadi
- **30 April**: SPT pajak korporat

### Tenggat Waktu Kuartalan (Khusus PT PMA)
- **10 April**: LKPM Q1 (Jan-Mar)
- **10 Juli**: LKPM Q2 (Apr-Jun)
- **10 Oktober**: LKPM Q3 (Jul-Sep)
- **10 Januari**: LKPM Q4 (Okt-Des)

---

## 🚀 Prioritas Implementasi

### ✅ Must Have (ROI Tinggi)
1. **Perhitungan pajak korporat (PPh 25)**
   - Formula: `revenue < 4.8B ? revenue * 0.005 : profit * 0.22`
   - Dampak: Penghematan besar untuk usaha kecil (22% → 0.5%)

2. **VAT (PPN 11%)**
   - Formula: `outputVAT - inputVAT`
   - Dampak: Biaya besar (11% dari pendapatan)

3. **NPWPD untuk hospitality**
   - Formula: `revenue * 0.10` (khusus Bali)
   - Dampak: 10% dari pendapatan untuk bisnis F&B

### ⚠️ Nice to Have (ROI Sedang)
4. **Pajak karyawan (PPh 21)**
   - Kompleks: PTKP + bracket progresif
   - Dampak: Variabel per karyawan

5. **BPJS**
   - Formula: `salary * (0.04 kesehatan + 0.0624 ketenagakerjaan)`
   - Dampak: ~10% dari gaji

### ❌ Prioritas Rendah
6. **PPh 23** (tergantung biaya jasa - variabel)
7. **Manfaat perjanjian pajak** (kompleks, kasus per kasus)

---

## 📖 Panduan Penggunaan

### Untuk Developer
1. Baca `INDONESIAN_TAX_REGULATIONS_2025.md` untuk dasar hukum
2. Salin kode dari `TAX_CALCULATIONS_EXAMPLES.md`
3. Referensi `tax-analyzer.ts` untuk fitur lanjutan
4. Tes dengan skenario di file Examples

### Untuk Analis Bisnis
1. Gunakan `TAX_CALCULATIONS_EXAMPLES.md` untuk kuotasi klien
2. Referensi `PRICING_OFFICIAL_2025.json` untuk harga layanan
3. Cek `INDONESIAN_TAX_REGULATIONS_2025.md` untuk kepatuhan

### Untuk Pelatihan AI
1. Ingest semua 6 file ke RAG/ChromaDB
2. Urutan prioritas:
   - INDONESIAN_TAX_REGULATIONS_2025.md (dasar hukum)
   - TAX_CALCULATIONS_EXAMPLES.md (implementasi)
   - tax-analyzer.ts (kode produksi)

---

## 🔧 Langkah Integrasi

### Langkah 1: Ganti Stub di `src/agents/tax-genius.ts`
```typescript
// LAMA (baris 47-52)
private calculateTaxes(intent: any): any {
  return {
    estimated: 'IDR 15,000,000/month',
    breakdown: {}
  };
}

// BARU
private calculateTaxes(intent: TaxIntent): TaxBreakdown {
  // Salin implementasi dari TAX_CALCULATIONS_EXAMPLES.md
  const pph21 = this.calculatePPh21Total(intent.salaries);
  const pph25 = this.calculatePPh25(intent.revenue);
  const ppn = this.calculatePPN(intent.revenue, intent.inputVAT || 0);
  const npwpd = this.calculateNPWPD(intent.revenue, intent.sector);
  const bpjs = this.calculateBPJS(intent.salaries);

  return {
    pph21, pph25, ppn, npwpd, bpjs,
    totalMonthly: pph21 + pph25 + ppn + npwpd + bpjs.total
  };
}
```

### Langkah 2: Tambahkan Konstanta Tarif Pajak
```typescript
// Salin dari INDONESIAN_TAX_REGULATIONS_2025.md
private taxRates = {
  corporate: {
    standard: 0.22,
    smallBusiness: 0.005, // PP 23/2018
    listed: 0.19
  },
  personal: {
    brackets: [
      { limit: 60000000, rate: 0.05 },
      { limit: 250000000, rate: 0.15 },
      { limit: 500000000, rate: 0.25 },
      { limit: 5000000000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ]
  },
  vat: 0.11,
  bpjs: {
    health: 0.04,
    employment: 0.0624
  },
  npwpd: {
    hospitality: 0.10
  }
};
```

### Langkah 3: Tes
```typescript
// Gunakan test case dari TAX_CALCULATIONS_EXAMPLES.md
const result = taxGenius.analyze({
  revenue: 500_000_000,
  employees: 5,
  salaries: [8_000_000, 6_000_000, 5_000_000, 4_000_000, 4_000_000],
  companyType: 'PT_PMA',
  sector: 'hospitality'
});

expect(result.calculations.totalMonthly).toBe(111_189_800);
```

---

## 📊 Ringkasan Dampak

### Sebelum (Stub)
- ❌ Hardcode `IDR 15,000,000/bulan`
- ❌ Rincian kosong
- ❌ Tidak ada optimasi
- ❌ Tidak ada kalender kepatuhan

### Setelah (Real-Time)
- ✅ Perhitungan akurat per profil bisnis
- ✅ Rincian detail (PPh 21/23/25, PPN, NPWPD, BPJS)
- ✅ Saran optimasi (PP 23/2018 hemat 88%!)
- ✅ Kalender kepatuhan dengan tenggat waktu
- ✅ Pemodelan skenario (analisis what-if)

### ROI
- **Restoran (500M/bulan)**: Pajak IDR 111M (vs hardcode 15M = 640% lebih akurat)
- **Konsultan (300M/bulan)**: Pajak IDR 32M + penghematan IDR 11.7M/bulan via PP 23/2018
- **Villa (150M/bulan)**: Pajak IDR 23M + penghematan IDR 5.4M/bulan via PP 23/2018

---

## 📝 TODO

### Prioritas Tinggi
- [ ] Integrasikan perhitungan ke `src/agents/tax-genius.ts`
- [ ] Tambahkan unit test (3 skenario)
- [ ] Deploy ke produksi

### Prioritas Sedang
- [ ] Tambahkan kalkulator tax treaty (68+ negara)
- [ ] Kalkulator super deduction (R&D, vokasional)
- [ ] Optimizer transfer pricing

### Prioritas Rendah
- [ ] Web scraper untuk update DJP
- [ ] Analisis regulasi AI (integrasi Gemini)
- [ ] Dashboard untuk pelacakan kepatuhan

---

## 🔗 Sumber Eksternal

1. **Direktorat Jenderal Pajak**: https://pajak.go.id
2. **Sistem Coretax**: https://coretax.pajak.go.id
3. **Regulasi Pajak**: https://pajak.go.id/id/peraturan
4. **PP 23/2018**: https://peraturan.bpk.go.id/Details/90375/pp-no-23-tahun-2018

---

**Versi Knowledge Base**: 1.0.0
**Dibuat**: 2025-10-01
**Pemelihara**: Tim Tax Genius
**Status**: ✅ Siap Produksi
