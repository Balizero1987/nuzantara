# Regulasi Pajak Indonesia 2025 - Referensi Resmi

> **Sumber**: oracle-system/agents/tax-genius/tax-analyzer.ts
> **Terakhir Diperbarui**: 2025-10-01
> **Status**: Data Produksi dari Agen Tax Genius

---

## 📊 TARIF PAJAK KORPORAT

### Pajak Korporat Standar
- **Tarif Standar**: 22% (untuk pendapatan > 4.8B IDR/tahun)
- **Tarif Usaha Kecil**: 0.5% (PP 23/2018) - untuk pendapatan < 4.8B IDR/tahun
- **Perusahaan Tercatat**: 19% (diskon 3% untuk perusahaan dengan kepemilikan publik 40%+)

**Dasar Hukum**: PP 23/2018

### Contoh Perhitungan
```typescript
// Pendapatan < 4.8B IDR
const revenue = 3_000_000_000; // IDR 3B/tahun
const tax = revenue * 0.005; // 0.5% = IDR 15,000,000/tahun

// Pendapatan > 4.8B IDR
const revenue = 6_000_000_000; // IDR 6B/tahun
const tax = revenue * 0.22; // 22% = IDR 1,320,000,000/tahun
```

---

## 💰 PAJAK PENGHASILAN PRIBADI (PPh 21)

### Bracket Progresif
| Penghasilan Kena Pajak (IDR/tahun) | Tarif |
|---------------------------|------|
| 0 - 60,000,000 | 5% |
| 60,000,001 - 250,000,000 | 15% |
| 250,000,001 - 500,000,000 | 25% |
| 500,000,001 - 5,000,000,000 | 30% |
| Di atas 5,000,000,000 | 35% |

### PTKP (Batas Bebas Pajak)
- **Lajang**: IDR 54,000,000/tahun
- **Menikah**: +IDR 4,500,000
- **Setiap tanggungan (maks 3)**: +IDR 4,500,000

### Contoh Perhitungan
```typescript
// Gaji: IDR 8,000,000/bulan = IDR 96,000,000/tahun
const annualSalary = 96_000_000;
const ptkp = 54_000_000; // Lajang
const taxable = annualSalary - ptkp; // IDR 42,000,000

// Perhitungan pajak
const tax = 42_000_000 * 0.05; // IDR 2,100,000/tahun
const monthlyTax = tax / 12; // IDR 175,000/bulan
```

---

## 🏢 VAT (PPN) - Pajak Pertambahan Nilai

### Tarif Saat Ini
- **Tarif PPN**: 11% (naik dari 10% di 2022)
- **Berlaku untuk**: Sebagian besar barang dan jasa
- **Pengecualian**: Kebutuhan pokok, pendidikan, kesehatan

### Perhitungan VAT
```typescript
const revenue = 100_000_000; // IDR 100M
const outputVAT = revenue * 0.11; // IDR 11M

const inputVAT = 5_000_000; // IDR 5M (VAT dibayar pada pembelian)
const netVAT = outputVAT - inputVAT; // IDR 6M (terutang)
```

---

## 📋 WITHHOLDING TAX

### Dividen (PPh 23 / PPh 26)
- **Residen**: 10%
- **Non-Residen**: 20%
- **Tarif Perjanjian**: 5-15% (tergantung perjanjian pajak)

### Royalti
- **Residen**: 15%
- **Non-Residen**: 20%

### Jasa (PPh 23)
- **Tarif**: 2% (pada jumlah bruto)
- **Contoh**: Konsultasi, hukum, akuntansi, layanan IT

### Jasa Non-Residen (PPh 26)
- **Tarif**: 20%

---

## 👥 BPJS (Jaminan Sosial Wajib)

### BPJS Kesehatan (Asuransi Kesehatan)
- **Kontribusi Pemberi Kerja**: 4% dari gaji
- **Kontribusi Karyawan**: 1% dari gaji
- **Total**: 5%
- **Batas Gaji Maksimum**: IDR 12,000,000/bulan

### BPJS Ketenagakerjaan (Asuransi Ketenagakerjaan)
**Kontribusi Pemberi Kerja**:
- **JKK (Kecelakaan Kerja)**: 0.24-1.74% (bervariasi per risiko industri)
- **JKM (Kematian)**: 0.30%
- **JHT (Pensiun)**: 3.70%
- **JP (Pensiun Hari Tua)**: 2.00%
- **Total Pemberi Kerja**: ~6.24-7.74%

**Kontribusi Karyawan**:
- **JHT**: 2.00%
- **JP**: 1.00%
- **Total Karyawan**: 3.00%

### Contoh Perhitungan
```typescript
const totalSalaries = 27_000_000; // IDR 27M (5 karyawan)

// BPJS Kesehatan
const healthEmployer = totalSalaries * 0.04; // IDR 1,080,000
const healthEmployee = totalSalaries * 0.01; // IDR 270,000

// BPJS Ketenagakerjaan (asumsikan industri risiko rendah)
const employmentEmployer = totalSalaries * 0.0624; // IDR 1,684,800
const employmentEmployee = totalSalaries * 0.03; // IDR 810,000

// Total bulanan BPJS
const totalEmployer = healthEmployer + employmentEmployer; // IDR 2,764,800
const totalEmployee = healthEmployee + employmentEmployee; // IDR 1,080,000
```

---

## 🗓️ TENGGAT WAKTU PAJAK

### Kewajiban Bulanan
| Jenis Pajak | Tenggat | Deskripsi |
|----------|----------|-------------|
| PPh 21 | Tanggal 10 bulan berikutnya | Pajak penghasilan karyawan |
| PPh 23 | Tanggal 10 bulan berikutnya | Pemotongan pajak jasa |
| PPh 25 | Tanggal 15 bulan berikutnya | Angsuran korporat |
| PPN (VAT) | Akhir bulan berikutnya | SPT VAT |
| BPJS | Tanggal 10 bulan berikutnya | Kesehatan + Ketenagakerjaan |

### Kewajiban Tahunan
| Pengarsipan | Tenggat | Deskripsi |
|--------|----------|-------------|
| SPT Tahunan Badan | 30 April | SPT pajak korporat |
| SPT Tahunan Pribadi | 31 Maret | SPT pajak pribadi |
| Dokumentasi Transfer Pricing | Dengan SPT pajak | Untuk transaksi pihak terkait |

### Kuartalan (Khusus PT PMA)
| Laporan | Tenggat | Deskripsi |
|--------|----------|-------------|
| LKPM | Tanggal 15 bulan berikutnya | Laporan realisasi investasi |

---

## 🎯 INSENTIF PAJAK & OPTIMASI

### Super Deduction (PMK 153/2020)
- **Biaya R&D**: Deduksi 200% (100% + bonus 100%)
- **Pelatihan Vokasional**: Deduksi 200%
- **Persyaratan**: Aktivitas disetujui, dokumentasi tepat

### Tax Holiday (Industri Pionir)
- **Durasi**: 5-20 tahun
- **Investasi Minimum**: IDR 500B
- **Sektor**: Otomotif, Farmasi, Petrokimia, Baja, Elektronik

### Tax Allowance
- **Pengurangan Investasi**: 30% dari investasi
- **Depresiasi Dipercepat**: Saldo menurun ganda
- **Carryforward Rugi**: 10 tahun (bukan 5)

### PP 23/2018 (Pajak Final Usaha Kecil)
- **Tarif**: 0.5% dari pendapatan bruto (bukan 22% dari keuntungan)
- **Kelayakan**: Pendapatan < IDR 4.8B/tahun
- **Penghematan**: Besar (22% → 0.5% tarif efektif)

---

## 🌍 PERJANJIAN PAJAK

### Indonesia memiliki 68+ perjanjian pajak

**Contoh Tarif Perjanjian** (Dividen):
- **Italia**: 10%
- **USA**: 10%
- **Singapura**: 10%
- **Belanda**: 5%
- **UK**: 10%
- **Australia**: 15%

**Persyaratan**:
1. Certificate of Tax Residency (dari negara asal)
2. Formulir DGT (formulir pajak Indonesia)
3. Diajukan sebelum pembayaran dividen

---

## 🏨 PAJAK DAERAH (NPWPD) - KHUSUS BALI

### Sektor Hospitality
- **Restoran/Bar**: 10% dari pendapatan
- **Hotel**: 10% dari pendapatan
- **Hiburan**: 35% dari pendapatan
- **Iklan**: 25% dari pendapatan

**Tenggat**: Tanggal 15 bulan berikutnya

### Contoh Perhitungan
```typescript
// Pendapatan restoran: IDR 500M/bulan
const revenue = 500_000_000;
const npwpd = revenue * 0.10; // IDR 50,000,000/bulan
```

---

## ⚖️ PENALTI

### Keterlambatan Pembayaran
- **Bunga**: 2% per bulan (majemuk)
- **Maksimum**: 24 bulan

### Keterlambatan Pengarsipan
- **SPT Korporat**: IDR 100,000 - 1,000,000
- **SPT Pribadi**: IDR 100,000
- **SPT VAT**: IDR 500,000

### Kurang Bayar (Temuan Audit)
- **Pajak Terutang**: Jumlah pokok
- **Bunga**: 2% per bulan dari tanggal jatuh tempo
- **Penalti Administratif**: 50% dari kurang bayar
- **Kriminal**: Kemungkinan penuntutan jika penggelapan disengaja

---

## 📈 FAKTOR RISIKO AUDIT

### Indikator Risiko Tinggi
1. **Margin Keuntungan Rendah**: < 50% dari rata-rata industri
2. **Biaya Hiburan Tinggi**: > 1% dari pendapatan
3. **Transaksi Pihak Terkait**: > 30% dari pendapatan
4. **Transaksi Tunai Tinggi**: > 10% dari pendapatan
5. **Gap VAT**: Ketidaksesuaian Input/Output
6. **Temuan Audit Sebelumnya**: Masalah yang belum diselesaikan

### Mitigasi Risiko
- Pertahankan dokumentasi tepat
- Siapkan dokumentasi transfer pricing
- Tinjau klasifikasi biaya
- Audit internal reguler
- Penasihat pajak profesional

---

## 🔗 SUMBER RESMI

1. **Direktorat Jenderal Pajak**: https://pajak.go.id
2. **Kementerian Keuangan**: https://www.kemenkeu.go.id
3. **Sistem Coretax**: https://coretax.pajak.go.id
4. **Regulasi Pajak**: https://pajak.go.id/id/peraturan

---

## 📝 CATATAN UNTUK AGEN TAX GENIUS

### Prioritas Implementasi

**Must Have** (ROI Tinggi):
1. ✅ Perhitungan pajak korporat (PPh 25) - Batas 11% vs 22%
   - Formula: `revenue < 4.8B ? revenue * 0.005 : profit * 0.22`
2. ✅ VAT (PPN 11%) - Biaya besar
   - Formula: `outputVAT - inputVAT`
3. ✅ NPWPD untuk hospitality - Khusus Bali
   - Formula: `revenue * 0.10` (restoran/bar)

**Nice to Have** (ROI Sedang):
4. ⚠️ Pajak karyawan (PPh 21) - Bracket progresif
   - Kompleks: PTKP + perhitungan progresif
5. ⚠️ BPJS - Kesehatan + Ketenagakerjaan
   - Formula: `salary * (0.04 kesehatan + 0.0624 ketenagakerjaan)`

**Prioritas Rendah**:
6. ❌ PPh 23 - Tergantung layanan eksternal (variabel)
7. ❌ Manfaat perjanjian pajak - Kompleks, kasus per kasus

---

**Dibuat**: 2025-10-01 oleh Kolektor KB TaxGenius
**Versi**: 1.0.0
**Status**: Siap Produksi
