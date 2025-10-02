# Indonesian Tax Regulations 2025 - Official Reference

> **Source**: oracle-system/agents/tax-genius/tax-analyzer.ts
> **Last Updated**: 2025-10-01
> **Status**: Production Data from Tax Genius Agent

---

## 📊 CORPORATE TAX RATES

### Standard Corporate Tax
- **Standard Rate**: 22% (for revenue > 4.8B IDR/year)
- **Small Business Rate**: 0.5% (PP 23/2018) - for revenue < 4.8B IDR/year
- **Listed Companies**: 19% (3% discount for companies with 40%+ public ownership)

**Legal Basis**: PP 23/2018

### Calculation Example
```typescript
// Revenue < 4.8B IDR
const revenue = 3_000_000_000; // IDR 3B/year
const tax = revenue * 0.005; // 0.5% = IDR 15,000,000/year

// Revenue > 4.8B IDR
const revenue = 6_000_000_000; // IDR 6B/year
const tax = revenue * 0.22; // 22% = IDR 1,320,000,000/year
```

---

## 💰 PERSONAL INCOME TAX (PPh 21)

### Progressive Brackets
| Taxable Income (IDR/year) | Rate |
|---------------------------|------|
| 0 - 60,000,000 | 5% |
| 60,000,001 - 250,000,000 | 15% |
| 250,000,001 - 500,000,000 | 25% |
| 500,000,001 - 5,000,000,000 | 30% |
| Above 5,000,000,000 | 35% |

### PTKP (Tax-Free Threshold)
- **Single**: IDR 54,000,000/year
- **Married**: +IDR 4,500,000
- **Each dependent (max 3)**: +IDR 4,500,000

### Calculation Example
```typescript
// Salary: IDR 8,000,000/month = IDR 96,000,000/year
const annualSalary = 96_000_000;
const ptkp = 54_000_000; // Single
const taxable = annualSalary - ptkp; // IDR 42,000,000

// Tax calculation
const tax = 42_000_000 * 0.05; // IDR 2,100,000/year
const monthlyTax = tax / 12; // IDR 175,000/month
```

---

## 🏢 VAT (PPN) - Value Added Tax

### Current Rate
- **PPN Rate**: 11% (increased from 10% in 2022)
- **Applies to**: Most goods and services
- **Exemptions**: Basic necessities, education, healthcare

### VAT Calculation
```typescript
const revenue = 100_000_000; // IDR 100M
const outputVAT = revenue * 0.11; // IDR 11M

const inputVAT = 5_000_000; // IDR 5M (VAT paid on purchases)
const netVAT = outputVAT - inputVAT; // IDR 6M (payable)
```

---

## 📋 WITHHOLDING TAX

### Dividends (PPh 23 / PPh 26)
- **Resident**: 10%
- **Non-Resident**: 20%
- **Treaty Rate**: 5-15% (depends on tax treaty)

### Royalties
- **Resident**: 15%
- **Non-Resident**: 20%

### Services (PPh 23)
- **Rate**: 2% (on gross amount)
- **Examples**: Consulting, legal, accounting, IT services

### Non-Resident Services (PPh 26)
- **Rate**: 20%

---

## 👥 BPJS (Mandatory Social Security)

### BPJS Kesehatan (Health Insurance)
- **Employer Contribution**: 4% of salary
- **Employee Contribution**: 1% of salary
- **Total**: 5%
- **Max Salary Cap**: IDR 12,000,000/month

### BPJS Ketenagakerjaan (Employment Insurance)
**Employer Contributions**:
- **JKK (Work Accident)**: 0.24-1.74% (varies by industry risk)
- **JKM (Death)**: 0.30%
- **JHT (Pension)**: 3.70%
- **JP (Old Age Pension)**: 2.00%
- **Total Employer**: ~6.24-7.74%

**Employee Contributions**:
- **JHT**: 2.00%
- **JP**: 1.00%
- **Total Employee**: 3.00%

### Calculation Example
```typescript
const totalSalaries = 27_000_000; // IDR 27M (5 employees)

// BPJS Health
const healthEmployer = totalSalaries * 0.04; // IDR 1,080,000
const healthEmployee = totalSalaries * 0.01; // IDR 270,000

// BPJS Employment (assume low-risk industry)
const employmentEmployer = totalSalaries * 0.0624; // IDR 1,684,800
const employmentEmployee = totalSalaries * 0.03; // IDR 810,000

// Total monthly BPJS
const totalEmployer = healthEmployer + employmentEmployer; // IDR 2,764,800
const totalEmployee = healthEmployee + employmentEmployee; // IDR 1,080,000
```

---

## 🗓️ TAX DEADLINES

### Monthly Obligations
| Tax Type | Deadline | Description |
|----------|----------|-------------|
| PPh 21 | 10th of month | Employee income tax |
| PPh 23 | 10th of month | Withholding tax on services |
| PPh 25 | 15th of month | Corporate installment |
| PPN (VAT) | End of following month | VAT return |
| BPJS | 10th of month | Health + Employment |

### Annual Obligations
| Filing | Deadline | Description |
|--------|----------|-------------|
| SPT Tahunan Badan | April 30 | Corporate tax return |
| SPT Tahunan Pribadi | March 31 | Personal tax return |
| Transfer Pricing Doc | With tax return | For related party transactions |

### Quarterly (PT PMA Only)
| Report | Deadline | Description |
|--------|----------|-------------|
| LKPM | 15th of following month | Investment realization report |

---

## 🎯 TAX INCENTIVES & OPTIMIZATION

### Super Deduction (PMK 153/2020)
- **R&D Expenses**: 200% deduction (100% + 100% bonus)
- **Vocational Training**: 200% deduction
- **Requirements**: Approved activities, proper documentation

### Tax Holiday (Pioneer Industries)
- **Duration**: 5-20 years
- **Minimum Investment**: IDR 500B
- **Sectors**: Automotive, Pharmaceutical, Petrochemical, Steel, Electronics

### Tax Allowance
- **Investment Reduction**: 30% of investment
- **Accelerated Depreciation**: Double declining balance
- **Loss Carry Forward**: 10 years (instead of 5)

### PP 23/2018 (Small Business Final Tax)
- **Rate**: 0.5% of gross revenue (instead of 22% on profit)
- **Eligibility**: Revenue < IDR 4.8B/year
- **Saving**: Massive (22% → 0.5% effective rate)

---

## 🌍 TAX TREATIES

### Indonesia has 68+ tax treaties

**Sample Treaty Rates** (Dividends):
- **Italy**: 10%
- **USA**: 10%
- **Singapore**: 10%
- **Netherlands**: 5%
- **UK**: 10%
- **Australia**: 15%

**Requirements**:
1. Tax Residency Certificate (from home country)
2. DGT Form (Indonesian tax form)
3. Submitted before dividend payment

---

## 🏨 REGIONAL TAX (NPWPD) - BALI SPECIFIC

### Hospitality Sector
- **Restaurant/Bar**: 10% of revenue
- **Hotel**: 10% of revenue
- **Entertainment**: 35% of revenue
- **Advertising**: 25% of revenue

**Deadline**: 15th of following month

### Calculation Example
```typescript
// Restaurant revenue: IDR 500M/month
const revenue = 500_000_000;
const npwpd = revenue * 0.10; // IDR 50,000,000/month
```

---

## ⚖️ PENALTIES

### Late Payment
- **Interest**: 2% per month (compounding)
- **Max**: 24 months

### Late Filing
- **Corporate Return**: IDR 100,000 - 1,000,000
- **Personal Return**: IDR 100,000
- **VAT Return**: IDR 500,000

### Underpayment (Audit Findings)
- **Tax Due**: Principal amount
- **Interest**: 2% per month from due date
- **Administrative Penalty**: 50% of underpayment
- **Criminal**: Possible prosecution if willful evasion

---

## 📈 AUDIT RISK FACTORS

### High Risk Indicators
1. **Low Profit Margin**: < 50% of industry average
2. **High Entertainment Expense**: > 1% of revenue
3. **Related Party Transactions**: > 30% of revenue
4. **High Cash Transactions**: > 10% of revenue
5. **VAT Gap**: Input/Output mismatch
6. **Previous Audit Findings**: Unresolved issues

### Risk Mitigation
- Maintain proper documentation
- Prepare transfer pricing documentation
- Review expense classifications
- Regular internal audits
- Professional tax advisor

---

## 🔗 OFFICIAL SOURCES

1. **Direktorat Jenderal Pajak**: https://pajak.go.id
2. **Ministry of Finance**: https://www.kemenkeu.go.id
3. **Coretax System**: https://coretax.pajak.go.id
4. **Tax Regulations**: https://pajak.go.id/id/peraturan

---

## 📝 NOTES FOR TAX GENIUS AGENT

### Implementation Priorities

**Must Have** (High ROI):
1. ✅ Corporate tax calculation (PPh 25) - 11% vs 22% threshold
   - Formula: `revenue < 4.8B ? revenue * 0.005 : profit * 0.22`
2. ✅ VAT (PPN 11%) - Major expense
   - Formula: `outputVAT - inputVAT`
3. ✅ NPWPD for hospitality - Bali-specific
   - Formula: `revenue * 0.10` (restaurants/bars)

**Nice to Have** (Medium ROI):
4. ⚠️ Employee tax (PPh 21) - Progressive brackets
   - Complex: PTKP + progressive calculation
5. ⚠️ BPJS - Health + Employment
   - Formula: `salary * (0.04 health + 0.0624 employment)`

**Low Priority**:
6. ❌ PPh 23 - Depends on external services (variable)
7. ❌ Tax treaty benefits - Complex, case-by-case

---

**Generated**: 2025-10-01 by TaxGenius KB Collector
**Version**: 1.0.0
**Status**: Production-Ready
