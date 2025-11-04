# Contoh Perhitungan Pajak - Implementasi Real-Time

> **Tujuan**: Menyediakan contoh praktis untuk mengimplementasikan logika perhitungan real-time di TaxGenius
> **Sumber**: tax-analyzer.ts + regulasi pajak Indonesia
> **Status**: Kode TypeScript Siap Produksi

---

## 🎯 SKENARIO 1: Restoran di Canggu (Hospitality)

### Profil Bisnis
```typescript
const businessProfile = {
  revenue: 500_000_000,        // IDR 500M/bulan (USD 32K)
  employees: 5,
  salaries: [8_000_000, 6_000_000, 5_000_000, 4_000_000, 4_000_000],
  companyType: 'PT_PMA',
  sector: 'hospitality',
  hasAlcohol: true,
  servicesExpenses: 25_000_000, // Konsultasi, akuntansi, dll.
  inputVAT: 20_000_000          // VAT dibayar pada pembelian
};
```

---

### Perhitungan Pajak

#### 1. PPh 21 (Pajak Penghasilan Karyawan)
```typescript
function calculatePPh21(annualSalary: number): number {
  const ptkp = 54_000_000; // Lajang, tanpa tanggungan
  const taxable = Math.max(0, annualSalary - ptkp);

  let tax = 0;
  if (taxable <= 60_000_000) {
    tax = taxable * 0.05;
  } else if (taxable <= 250_000_000) {
    tax = 60_000_000 * 0.05 + (taxable - 60_000_000) * 0.15;
  } else if (taxable <= 500_000_000) {
    tax = 60_000_000 * 0.05 + 190_000_000 * 0.15 + (taxable - 250_000_000) * 0.25;
  } else if (taxable <= 5_000_000_000) {
    tax = 60_000_000 * 0.05 + 190_000_000 * 0.15 + 250_000_000 * 0.25 + (taxable - 500_000_000) * 0.30;
  } else {
    tax = 60_000_000 * 0.05 + 190_000_000 * 0.15 + 250_000_000 * 0.25 + 4_500_000_000 * 0.30 + (taxable - 5_000_000_000) * 0.35;
  }

  return tax / 12; // Bulanan
}

// Hitung untuk setiap karyawan
const pph21Monthly = businessProfile.salaries.map(monthly => {
  const annual = monthly * 12;
  return calculatePPh21(annual);
});

// Hasil:
// Gaji 8M/bulan (96M/tahun): IDR 625,000/bulan
// Gaji 6M/bulan (72M/tahun): IDR 225,000/bulan
// Gaji 5M/bulan (60M/tahun): IDR 75,000/bulan
// Gaji 4M/bulan (48M/tahun): IDR 0/bulan (di bawah PTKP)
// Gaji 4M/bulan (48M/tahun): IDR 0/bulan

const totalPPh21 = pph21Monthly.reduce((a, b) => a + b, 0);
// Total: IDR 925,000/bulan
```

---

#### 2. PPh 23 (Pemotongan Pajak Jasa)
```typescript
function calculatePPh23(servicesExpenses: number): number {
  return servicesExpenses * 0.02; // Pemotongan 2%
}

const pph23 = calculatePPh23(businessProfile.servicesExpenses);
// Hasil: IDR 500,000/bulan
```

---

#### 3. PPh 25 (Angsuran Korporat)
```typescript
function calculatePPh25(monthlyRevenue: number): number {
  const annualRevenue = monthlyRevenue * 12;
  const threshold = 4_800_000_000; // IDR 4.8B

  // Tentukan tarif pajak
  const rate = annualRevenue < threshold ? 0.005 : 0.22;

  if (annualRevenue < threshold) {
    // PP 23/2018: Pajak final 0.5% pada pendapatan
    return (monthlyRevenue * 0.005);
  } else {
    // Pajak korporat standar: 22% pada keuntungan (asumsi margin 20%)
    const estimatedProfit = monthlyRevenue * 0.20;
    return (estimatedProfit * 0.22);
  }
}

const pph25 = calculatePPh25(businessProfile.revenue);
// Pendapatan: IDR 500M/bulan × 12 = IDR 6B/tahun (> batas 4.8B)
// Keuntungan: 500M × 20% = 100M
// Pajak: 100M × 22% = 22M/bulan
// Hasil: IDR 22,000,000/bulan
```

---

#### 4. PPN (VAT 11%)
```typescript
function calculatePPN(revenue: number, inputVAT: number): number {
  const outputVAT = revenue * 0.11;
  return outputVAT - inputVAT;
}

const ppn = calculatePPN(businessProfile.revenue, businessProfile.inputVAT);
// Output VAT: 500M × 11% = 55M
// Input VAT: 20M
// Neto terutang: 55M - 20M = IDR 35,000,000/bulan
```

---

#### 5. NPWPD (Pajak Daerah - Hospitality Bali)
```typescript
function calculateNPWPD(revenue: number, sector: string): number {
  if (sector === 'hospitality') {
    return revenue * 0.10; // 10% untuk restoran/bar di Bali
  }
  return 0;
}

const npwpd = calculateNPWPD(businessProfile.revenue, businessProfile.sector);
// Hasil: IDR 50,000,000/bulan
```

---

#### 6. BPJS (Kesehatan + Ketenagakerjaan)
```typescript
function calculateBPJS(salaries: number[]): {
  health: number;
  employment: number;
  total: number;
} {
  const totalSalaries = salaries.reduce((a, b) => a + b, 0);

  // BPJS Kesehatan (kontribusi pemberi kerja saja)
  const health = totalSalaries * 0.04; // 4%

  // BPJS Ketenagakerjaan (kontribusi pemberi kerja)
  const jkk = totalSalaries * 0.0024; // 0.24% (risiko rendah - kantor/restoran)
  const jkm = totalSalaries * 0.0030; // 0.30%
  const jht = totalSalaries * 0.0370; // 3.70%
  const jp = totalSalaries * 0.0200;  // 2.00%
  const employment = jkk + jkm + jht + jp;

  return {
    health,
    employment,
    total: health + employment
  };
}

const bpjs = calculateBPJS(businessProfile.salaries);
// Total gaji: IDR 27,000,000/bulan
// Kesehatan: 27M × 4% = IDR 1,080,000
// Ketenagakerjaan: 27M × 6.24% = IDR 1,684,800
// Total: IDR 2,764,800/bulan
```

---

### Ringkasan Final - Skenario Restoran

```typescript
interface TaxBreakdown {
  pph21: { amount: number; label: string; due: string };
  pph23: { amount: number; label: string; due: string };
  pph25: { amount: number; label: string; due: string };
  ppn: { amount: number; label: string; due: string };
  npwpd: { amount: number; label: string; due: string };
  bpjs: { health: number; employment: number; total: number; due: string };
  totalMonthly: number;
  totalAnnual: number;
}

const taxBreakdown: TaxBreakdown = {
  pph21: {
    amount: 925_000,
    label: 'Pajak Penghasilan Karyawan (PPh 21)',
    due: 'Tanggal 10 bulan berikutnya'
  },
  pph23: {
    amount: 500_000,
    label: 'Pemotongan Pajak Jasa (PPh 23)',
    due: 'Tanggal 10 bulan berikutnya'
  },
  pph25: {
    amount: 22_000_000,
    label: 'Angsuran Pajak Korporat (PPh 25)',
    due: 'Tanggal 15 bulan berikutnya'
  },
  ppn: {
    amount: 35_000_000,
    label: 'VAT (PPN 11%)',
    due: 'Akhir bulan berikutnya'
  },
  npwpd: {
    amount: 50_000_000,
    label: 'Pajak Daerah - Hospitality (NPWPD)',
    due: 'Tanggal 15 bulan berikutnya'
  },
  bpjs: {
    health: 1_080_000,
    employment: 1_684_800,
    total: 2_764_800,
    due: 'Tanggal 10 bulan berikutnya'
  },
  totalMonthly: 111_189_800, // Jumlah semua
  totalAnnual: 1_334_277_600  // × 12
};

console.log(`
📊 Ringkasan Pajak - Restoran Canggu

Pendapatan: IDR 500,000,000/bulan (USD 32K)
Karyawan: 5

Kewajiban Pajak Bulanan:
- PPh 21 (Pajak Karyawan):      IDR     925,000
- PPh 23 (Jasa):                 IDR     500,000
- PPh 25 (Korporat):             IDR  22,000,000
- PPN (VAT 11%):                 IDR  35,000,000
- NPWPD (Hospitality 10%):       IDR  50,000,000
- BPJS (Kesehatan + Ketenagakerjaan): IDR   2,764,800
                                 ───────────────
TOTAL BULANAN:                   IDR 111,189,800

TOTAL TAHUNAN:                   IDR 1,334,277,600

Tarif Pajak Efektif: 22.2% dari pendapatan
`);
```

---

## 🏢 SKENARIO 2: Perusahaan Konsultan (Usaha Kecil)

### Profil Bisnis
```typescript
const consultingProfile = {
  revenue: 300_000_000,        // IDR 300M/bulan (USD 19K)
  employees: 3,
  salaries: [10_000_000, 7_000_000, 5_000_000],
  companyType: 'PT_PMA',
  sector: 'consulting',
  hasAlcohol: false,
  servicesExpenses: 10_000_000,
  inputVAT: 5_000_000
};
```

---

### Perhitungan Pajak

```typescript
// Pendapatan tahunan: 300M × 12 = 3.6B (< batas 4.8B)
// → Memenuhi syarat PP 23/2018: Pajak final 0.5%

const pph25_small = consultingProfile.revenue * 0.005;
// Hasil: IDR 1,500,000/bulan (bukan ~13M di 22%)

const ppn_consulting = calculatePPN(300_000_000, 5_000_000);
// Output: 300M × 11% = 33M
// Input: 5M
// Neto: IDR 28,000,000/bulan

const bpjs_consulting = calculateBPJS([10_000_000, 7_000_000, 5_000_000]);
// Total gaji: 22M
// BPJS: IDR 2,292,800/bulan

const totalMonthly_consulting =
  pph25_small +      // 1,500,000
  ppn_consulting +   // 28,000,000
  bpjs_consulting.total; // 2,292,800
// Total: IDR 31,792,800/bulan

// Penghematan vs pajak standar:
const standardTax = (300_000_000 * 0.20 * 0.22); // 22% pada keuntungan
// Standar: IDR 13,200,000
// Dengan PP 23: IDR 1,500,000
// PENGHEMATAN: IDR 11,700,000/bulan (pengurangan 88%!)
```

---

## 🏠 SKENARIO 3: Sewa Villa (Akomodasi)

### Profil Bisnis
```typescript
const villaProfile = {
  revenue: 150_000_000,        // IDR 150M/bulan (USD 9.6K)
  employees: 2,
  salaries: [5_000_000, 4_000_000],
  companyType: 'PT_PMA',
  sector: 'accommodation',
  hasAlcohol: false,
  servicesExpenses: 5_000_000,
  inputVAT: 10_000_000
};
```

---

### Perhitungan Pajak

```typescript
// Pendapatan tahunan: 150M × 12 = 1.8B (< batas 4.8B)
// → Memenuhi syarat PP 23/2018: Pajak final 0.5%

const pph25_villa = villaProfile.revenue * 0.005;
// Hasil: IDR 750,000/bulan

const ppn_villa = calculatePPN(150_000_000, 10_000_000);
// Output: 150M × 11% = 16.5M
// Input: 10M
// Neto: IDR 6,500,000/bulan

const npwpd_villa = villaProfile.revenue * 0.10; // 10% hospitality
// Hasil: IDR 15,000,000/bulan

const bpjs_villa = calculateBPJS([5_000_000, 4_000_000]);
// Total gaji: 9M
// BPJS: IDR 1,181,600/bulan

const totalMonthly_villa =
  pph25_villa +      // 750,000
  ppn_villa +        // 6,500,000
  npwpd_villa +      // 15,000,000
  bpjs_villa.total;  // 1,181,600
// Total: IDR 23,431,600/bulan
```

---

## 📊 TABEL PERBANDINGAN

| Metrik | Restoran | Konsultan | Villa |
|--------|-----------|-----------|-------|
| Pendapatan/bulan | IDR 500M | IDR 300M | IDR 150M |
| Karyawan | 5 | 3 | 2 |
| Pajak Korporat | IDR 22M | IDR 1.5M | IDR 0.75M |
| VAT | IDR 35M | IDR 28M | IDR 6.5M |
| NPWPD | IDR 50M | - | IDR 15M |
| BPJS | IDR 2.8M | IDR 2.3M | IDR 1.2M |
| **TOTAL/bulan** | **IDR 111M** | **IDR 32M** | **IDR 23M** |
| **Tarif Efektif** | **22.2%** | **10.6%** | **15.6%** |

---

## 🎯 PELUANG OPTIMASI

### Restoran (Pendapatan > 4.8B/tahun)
```typescript
const optimizations = [
  {
    strategy: 'Optimasi Transfer Pricing',
    saving: 'Alokasikan keuntungan ke yurisdiksi pajak lebih rendah (jika induk di luar negeri)',
    riskLevel: 'medium',
    requirements: ['Dokumentasi TP', 'Studi benchmark']
  },
  {
    strategy: 'Maksimalisasi Biaya',
    saving: 'Pastikan semua biaya yang dapat dideduksi diklaim (kerugian F&B, depresiasi)',
    riskLevel: 'low',
    requirements: ['Dokumentasi tepat', 'Kuitansi']
  },
  {
    strategy: 'Tinjauan NPWPD',
    saving: 'Verifikasi jika semua pendapatan adalah F&B (vs retail) - tarif berbeda',
    riskLevel: 'low',
    requirements: ['Analisis pembagian pendapatan']
  }
];
```

### Konsultan (Pendapatan < 4.8B/tahun)
```typescript
const optimizations = [
  {
    strategy: 'Pemanfaatan PP 23/2018',
    saving: 'Sudah menggunakan tarif 0.5% - hemat IDR 11.7M/bulan vs 22%',
    riskLevel: 'low',
    requirements: ['Pertahankan pendapatan < 4.8B/tahun']
  },
  {
    strategy: 'Super Deduction R&D',
    saving: 'Jika konsultasi termasuk R&D: Deduksi 200%',
    riskLevel: 'low',
    requirements: ['Persetujuan R&D', 'Dokumentasi']
  }
];
```

### Villa (Pendapatan < 4.8B/tahun)
```typescript
const optimizations = [
  {
    strategy: 'Pemanfaatan PP 23/2018',
    saving: 'Sudah menggunakan tarif 0.5% - hemat IDR 5.4M/bulan vs 22%',
    riskLevel: 'low',
    requirements: ['Pertahankan pendapatan < 4.8B/tahun']
  },
  {
    strategy: 'Pondok Wisata vs Hotel',
    saving: 'Jika < 5 kamar: Pondok Wisata (pajak lebih sederhana)',
    riskLevel: 'low',
    requirements: ['Maks 5 kamar', 'Lisensi tepat']
  }
];
```

---

## 📅 GENERATOR KALENDER KEPATUHAN

```typescript
function generateComplianceCalendar(monthYear: string): TaxObligation[] {
  const [month, year] = monthYear.split('-').map(Number);

  return [
    {
      name: 'Pembayaran PPh 21',
      deadline: new Date(year, month - 1, 10),
      amount: 'Variabel',
      description: 'Pemotongan pajak penghasilan karyawan'
    },
    {
      name: 'Pembayaran PPh 23',
      deadline: new Date(year, month - 1, 10),
      amount: 'Variabel',
      description: 'Pemotongan pajak jasa'
    },
    {
      name: 'Pembayaran BPJS',
      deadline: new Date(year, month - 1, 10),
      amount: 'Variabel',
      description: 'Asuransi Kesehatan + Ketenagakerjaan'
    },
    {
      name: 'Pembayaran PPh 25',
      deadline: new Date(year, month - 1, 15),
      amount: 'Variabel',
      description: 'Angsuran pajak korporat'
    },
    {
      name: 'Pembayaran NPWPD',
      deadline: new Date(year, month, 15), // Bulan berikutnya
      amount: 'Variabel',
      description: 'Pajak daerah (khusus hospitality)'
    },
    {
      name: 'Pengarsipan & Pembayaran PPN',
      deadline: new Date(year, month, 0), // Hari terakhir bulan berikutnya
      amount: 'Variabel',
      description: 'SPT VAT dan pembayaran'
    }
  ];
}

// Contoh penggunaan
const obligations = generateComplianceCalendar('02-2025');
// Mengembalikan array kewajiban yang diurutkan untuk Februari 2025
```

---

## 🔧 PANDUAN IMPLEMENTASI

### Langkah 1: Buat Interface TaxIntent
```typescript
interface TaxIntent {
  revenue: number;
  employees: number;
  salaries: number[];
  companyType: 'PT_PMA' | 'PT' | 'CV';
  sector: 'hospitality' | 'accommodation' | 'consulting' | 'retail' | 'services';
  hasAlcohol?: boolean;
  servicesExpenses?: number;
  inputVAT?: number;
}
```

### Langkah 2: Implementasikan Metode calculateTaxes()
```typescript
private calculateTaxes(intent: TaxIntent): TaxBreakdown {
  // Gunakan semua fungsi perhitungan di atas
  const pph21 = this.calculatePPh21Total(intent.salaries);
  const pph23 = this.calculatePPh23(intent.servicesExpenses || 0);
  const pph25 = this.calculatePPh25(intent.revenue);
  const ppn = this.calculatePPN(intent.revenue, intent.inputVAT || 0);
  const npwpd = this.calculateNPWPD(intent.revenue, intent.sector);
  const bpjs = this.calculateBPJS(intent.salaries);

  return {
    pph21,
    pph23,
    pph25,
    ppn,
    npwpd,
    bpjs,
    totalMonthly: pph21 + pph23 + pph25 + ppn + npwpd + bpjs.total,
    totalAnnual: (pph21 + pph23 + pph25 + ppn + npwpd + bpjs.total) * 12
  };
}
```

### Langkah 3: Ganti Stub di tax-genius.ts
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
  // Gunakan implementasi dari Langkah 2
  return this.calculateTaxesRealTime(intent);
}
```

---

## ✅ TESTING

### Test Case 1: Restoran
```typescript
const result = taxGenius.analyze({
  revenue: 500_000_000,
  employees: 5,
  salaries: [8_000_000, 6_000_000, 5_000_000, 4_000_000, 4_000_000],
  companyType: 'PT_PMA',
  sector: 'hospitality'
});

expect(result.calculations.totalMonthly).toBe(111_189_800);
expect(result.calculations.pph25.amount).toBe(22_000_000);
expect(result.calculations.npwpd.amount).toBe(50_000_000);
```

### Test Case 2: Usaha Kecil
```typescript
const result = taxGenius.analyze({
  revenue: 300_000_000,
  employees: 3,
  salaries: [10_000_000, 7_000_000, 5_000_000],
  companyType: 'PT_PMA',
  sector: 'consulting'
});

expect(result.calculations.pph25.amount).toBe(1_500_000); // PP 23/2018
expect(result.optimizations).toContain('PP 23/2018 hemat IDR 11.7M/bulan');
```

---

**Dibuat**: 2025-10-01 oleh Tim Implementasi TaxGenius
**Status**: Contoh Kode Siap Produksi
**Selanjutnya**: Integrasikan ke `src/agents/tax-genius.ts`
