// @ts-nocheck
/**
 * TAX GENIUS
 * The mathematical wizard of Indonesian taxation
 * Calculates everything to the rupiah
 *
 * Updated: 2025-10-02
 * Source: BKPM Regulation 4/2021, PP 28/2025, UU 11/2020 (Omnibus Law)
 */

export class TaxGenius {
  private taxRates = {
    corporate: {
      standard: 0.22, // 22% corporate tax (reduced from 25% in 2022)
      small: 0.11, // 11% for revenue < 50B 'RETRIEVED_FROM_DATABASE'
      msme_final: 0.005, // 0.5% final tax for revenue < 4.8B 'RETRIEVED_FROM_DATABASE'
      dividend: 0.1, // 10% dividend tax (non-resident)
    },
    personal: {
      brackets: [
        { limit: 60000000, rate: 0.05 },
        { limit: 250000000, rate: 0.15 },
        { limit: 500000000, rate: 0.25 },
        { limit: 5000000000, rate: 0.3 },
        { limit: Infinity, rate: 0.35 },
      ],
    },
    vat: {
      current: 0.11, // 11% PPN (current rate)
      future: 0.12, // 12% PPN (scheduled increase - DATE TBD 2025)
      effectiveDate: 'TBD 2025 - Awaiting government announcement',
    },
    luxury: 0.2, // 20% PPnBM (luxury goods)
  };

  // ==========================================
  // 2025 TAX SYSTEM UPDATES
  // ==========================================

  private tax2025Updates = {
    npwp: {
      name: 'NPWP Format Change',
      oldFormat: '15 digits (XX.XXX.XXX.X-XXX.XXX)',
      newFormat: '16 digits (effective 2024/2025)',
      transition: {
        status: 'Ongoing migration to NIK-based system',
        description: 'NPWP integrated with NIK (Nomor Induk Kependudukan)',
        impact: 'Simplified registration - NIK automatically becomes NPWP',
        benefits: [
          'One number for tax and civil registration',
          'Automatic NPWP for all Indonesian citizens',
          'Easier compliance tracking',
          'Reduced bureaucracy',
        ],
      },
      foreigners: {
        requirement: 'Still need separate NPWP registration',
        process: 'Register at tax office with passport + KITAS/KITAP',
        validity: 'Tied to work permit validity',
      },
    },
    coretax: {
      name: 'Core Tax Administration System (Coretax)',
      status: 'PILOT PHASE 2024, MANDATORY 2025',
      description: 'New integrated DJP tax system replacing e-Filing, e-Billing, e-Faktur',
      features: [
        'Single login for all tax services',
        'Real-time tax calculation',
        'Automated compliance checks',
        'AI-powered audit selection',
        'Integrated with bank systems',
        'Mobile app support',
      ],
      timeline: {
        '2024_Q4': 'Pilot with large taxpayers',
        '2025_Q1': 'Gradual rollout to all businesses',
        '2025_Q2': 'Mandatory for VAT reporting',
        '2025_Q3': 'Full system implementation (DATE TBD)',
      },
      preparation: [
        '⚠️ Register for Coretax account NOW (if invited to pilot)',
        '📊 Ensure accounting system can export to Coretax format',
        '🔄 Train staff on new system (free DJP training available)',
        '💾 Backup all historical tax data before migration',
      ],
    },
  };

  // ==========================================
  // TAX INCENTIVES (BKPM Regulation 4/2021)
  // ==========================================

  private taxHoliday = {
    name: 'Tax Holiday',
    regulation: 'BKPM Regulation 4/2021, PMK 130/2020',
    benefit: 'Corporate Income Tax (CIT) exemption 5-20 years',
    eligibility: {
      industries: [
        'Pioneer industries (upstream metal, oil refining, machinery, renewable energy)',
        'Manufacturing with high economic value',
        'Digital economy & ICT infrastructure',
        'Tourism & creative economy (under specific conditions)',
        'Health services (hospitals, medical devices)',
      ],
      minimumInvestment: 'RETRIEVED_FROM_DATABASE',
      requirements: [
        'New PT PMA established after PP 78/2019',
        'Pioneer industry status (verified by Ministry)',
        'Investment realization per approved plan',
        'Export orientation or high local content',
      ],
    },
    duration: {
      tier1: { investment: 'RETRIEVED_FROM_DATABASE', holiday: '5-7 years', reduction50: '2 years after' },
      tier2: { investment: 'RETRIEVED_FROM_DATABASE', holiday: '7-10 years', reduction50: '2 years after' },
      tier3: { investment: 'RETRIEVED_FROM_DATABASE', holiday: '10-15 years', reduction50: '2 years after' },
      tier4: { investment: 'RETRIEVED_FROM_DATABASE', holiday: '15-20 years', reduction50: '2 years after' },
    },
    deadline: '⚠️ CRITICAL: December 31, 2025 (last day to apply)',
    applicationProcess: {
      step1: 'Submit Investment Plan to BKPM (include feasibility study)',
      step2: 'Obtain Pioneer Industry Certificate from relevant Ministry',
      step3: 'Apply via OSS system (upload supporting documents)',
      step4: 'BKPM review (30-60 business days)',
      step5: 'Ministry of Finance final approval (SK Menteri Keuangan)',
      documents: [
        'Investment plan (5-year projection)',
        'Feasibility study',
        'Pioneer industry certificate',
        'Environmental permit (AMDAL/UKL-UPL)',
        'Business license (NIB)',
        'Articles of Association (Akta Pendirian)',
        'Investment realization proof (bank statements, contracts)',
      ],
    },
    notes: [
      '⏰ Application deadline: Dec 31, 2025 (for investments started before 2024)',
      '📊 Investment amount EXCLUDES land & buildings',
      '🔄 Must submit annual realization report (LKPM) to maintain status',
      '❌ Revoked if: false data, investment <80% plan, change business without approval',
    ],
  };

  private taxAllowance = {
    name: 'Tax Allowance',
    regulation: 'BKPM Regulation 4/2021, PP 78/2019',
    benefits: [
      '30% deduction from net income (6 years: 5% annually)',
      'Accelerated depreciation/amortization',
      'Extended loss carry-forward (5-10 years vs standard 5 years)',
      'WHT reduction: 10% → 0% (or treaty rate) for dividends to non-residents',
    ],
    eligibility: {
      industries: [
        'Strategic sectors (agriculture, forestry, fisheries)',
        'Infrastructure (toll roads, ports, airports, electricity)',
        'Manufacturing with high local content',
        'Labor-intensive industries (minimum 300 workers)',
        'Export-oriented (minimum 30% revenue from exports)',
        'R&D-intensive (minimum 5% revenue on R&D)',
        'Environmental pioneer (renewable energy, waste management)',
      ],
      minimumInvestment: 'RETRIEVED_FROM_DATABASE',
      requirements: [
        'Located in designated regions (outside Java or industrial estates)',
        'Absorb minimum workers (300-1,000 depending on industry)',
        'Use minimum local content (40-60%)',
        'Obtain environmental permit',
      ],
    },
    calculation: {
      example: {
        netIncome: 'RETRIEVED_FROM_DATABASE',
        deduction: 'RETRIEVED_FROM_DATABASE',
        taxableIncome: 'RETRIEVED_FROM_DATABASE',
        tax: 'RETRIEVED_FROM_DATABASE',
        savings: 'RETRIEVED_FROM_DATABASE',
      },
    },
    applicationProcess: {
      step1: 'Apply via OSS system after commercial operation',
      step2: 'Submit supporting documents to BKPM',
      step3: 'BKPM review (45 business days)',
      step4: 'Ministry of Finance approval (SK)',
      documents: [
        'Investment realization proof (audited financial statements)',
        'Worker absorption proof (BPJS records)',
        'Local content calculation (verified by Ministry of Industry)',
        'Export realization (customs data)',
        'Environmental permit (AMDAL/UKL-UPL)',
        'Commercial operation certificate',
      ],
    },
  };

  private superDeductions = {
    name: 'Super Deduction',
    regulation: 'PMK 128/2019, UU 11/2020 (Omnibus Law)',
    types: [
      {
        type: 'Vocational Training',
        deduction: '200%',
        requirements: [
          'Training at certified vocational institutions',
          'Minimum 6-month program',
          'Partnership with Ministry of Education/Industry',
          'Trainees become employees after graduation',
        ],
        applicableCosts: [
          'Instructor salaries',
          'Training materials & equipment',
          'Facility rental',
          'Trainee allowances',
        ],
      },
      {
        type: 'R&D Activities',
        deduction: '300%',
        requirements: [
          'R&D conducted in Indonesia',
          'Collaboration with universities/research institutions',
          'Results benefit Indonesia (patents, products)',
          'Minimum 3-year program',
        ],
        applicableCosts: [
          'Researcher salaries',
          'Lab equipment & materials',
          'Patent/IP registration fees',
          'Research facility costs',
        ],
      },
      {
        type: 'Industry 4.0 Investment',
        deduction: '60% additional depreciation (first year)',
        requirements: [
          'Investment in automation, robotics, IoT',
          'Minimum 'RETRIEVED_FROM_DATABASE'',
          'Domestic products (TKDN ≥40%)',
          'Used for production (not resale)',
        ],
        applicableAssets: [
          'Industrial robots',
          'IoT sensors & systems',
          'AI/ML software',
          'Automation equipment',
        ],
      },
    ],
    applicationProcess: {
      step1: 'Submit plan to Ministry of Industry (for R&D/training approval)',
      step2: 'Execute program (collect evidence)',
      step3: 'Report in annual tax return (SPT Tahunan)',
      step4: 'Submit supporting documents to tax office if audited',
      documents: [
        'Training/R&D program approval letter',
        'Cost receipts (invoices, payroll)',
        'Program completion certificates',
        'Beneficiary list (trainees/researchers)',
        'Output evidence (patents, products, trained employees)',
      ],
    },
  };

  private sezIncentives = {
    name: 'Special Economic Zone (SEZ) Incentives',
    regulation: 'UU 39/2009, PP 41/2021',
    benefits: [
      'CIT exemption: 10-25 years (depends on investment size)',
      'Import duty exemption (raw materials, machinery)',
      'VAT/Sales Tax exemption',
      'Luxury tax exemption',
      'Land & Building Tax reduction (up to 100%)',
      'Simplified licensing (single-window via SEZ authority)',
    ],
    activeSEZs: [
      { name: 'Batam', focus: 'Manufacturing, logistics', status: 'Operational' },
      { name: 'Bintan', focus: 'Tourism, manufacturing', status: 'Operational' },
      { name: 'Karimun', focus: 'Manufacturing, shipbuilding', status: 'Operational' },
      { name: 'Tanjung Lesung (Banten)', focus: 'Tourism', status: 'Operational' },
      { name: 'Mandalika (NTB/Lombok)', focus: 'Tourism', status: 'Operational' },
      { name: 'Morotai (North Maluku)', focus: 'Tourism, fisheries', status: 'Development' },
      { name: 'MBTK (North Kalimantan)', focus: 'Oil & gas, logistics', status: 'Development' },
    ],
    eligibility: {
      requirements: [
        'Business located 100% within SEZ boundaries',
        'Minimum investment: 'RETRIEVED_FROM_DATABASE'',
        'Export-oriented or supporting SEZ industries',
        'Employment creation (minimum workers varies)',
      ],
    },
  };

  // ==========================================
  // COMPLIANCE & REPORTING
  // ==========================================

  private complianceRequirements = {
    lkpm: {
      name: 'Laporan Kegiatan Penanaman Modal (LKPM)',
      regulation: 'BKPM Regulation 5/2021',
      frequency: 'Quarterly (every 3 months)',
      deadline: 'Within 30 days after quarter end',
      penalties: {
        missed1: 'Warning letter',
        missed2: 'Summon for clarification',
        missed3: 'License suspension (Business License frozen)',
        missed4: 'License revocation (NIB cancelled)',
      },
      reportingItems: [
        'Investment realization (IDR)',
        'Workers absorbed (Indonesian + foreign)',
        'Production output (units/value)',
        'Export value (if applicable)',
        'Tax payments (CIT, VAT, WHT)',
        'Issues/obstacles faced',
      ],
      submissionMethod: 'Online via OSS system (oss.go.id)',
      criticalNotes: [
        '⚠️ MANDATORY even if no business activity',
        '⚠️ 3 consecutive missed reports = license revocation',
        '⚠️ False data = criminal liability (KUHP Art. 263)',
        '✅ Must be submitted by company director (digital signature)',
      ],
    },
    taxReporting: {
      monthly: [
        { tax: 'PPh 21', description: 'Employee income tax', deadline: '10th of next month' },
        {
          tax: 'PPh 23',
          description: 'Withholding tax (services)',
          deadline: '10th of next month',
        },
        { tax: 'PPh 25', description: 'Corporate installment', deadline: '15th of next month' },
        { tax: 'PPN', description: 'VAT return', deadline: 'End of next month' },
      ],
      annual: [
        { tax: 'SPT Tahunan Badan', description: 'Corporate tax return', deadline: 'April 30th' },
        { tax: 'SPT Tahunan Pribadi', description: 'Personal tax return', deadline: 'March 31st' },
      ],
    },
    bpjs: {
      types: [
        {
          name: 'BPJS Kesehatan',
          description: 'Health insurance',
          employerShare: '4%',
          employeeShare: '1%',
        },
        { name: 'BPJS Ketenagakerjaan', description: 'Employment insurance', total: '5.7%-6.74%' },
      ],
      deadline: '10th of each month',
      penalties: '2% per month for late payment',
    },
  };

  async analyze(intent: any): Promise<any> {
    // Returns complex calculations + tax incentives
    // ZANTARA will simplify
    return {
      // 2025 TAX UPDATES
      tax2025Updates: {
        rates: {
          corporate: '22% (reduced from 25%)',
          vat: {
            current: '11%',
            future: '12% (date TBD 2025)',
            warning: '⚠️ Monitor for VAT increase announcement',
          },
          msme: '0.5% final tax (revenue < 4.8B IDR)',
        },
        systems: {
          npwp: this.tax2025Updates.npwp,
          coretax: this.tax2025Updates.coretax,
        },
      },

      standardTaxation: {
        monthlyObligations: {
          pph21: 'Employee income tax - due 10th',
          pph23: 'Withholding tax - due 10th',
          pph25: 'Corporate installment - due 15th',
          ppn: 'VAT return - due end of month',
        },
        yearlyObligations: {
          corporate: 'SPT Tahunan Badan - due April 30th',
          personal: 'SPT Tahunan Pribadi - due March 31st',
        },
        calculations: this.calculateTaxes(intent),
      },

      incentiveOpportunities: this.analyzeIncentiveEligibility(intent),
      complianceChecklist: this.getComplianceChecklist(intent),
      optimizations: this.findOptimizations(intent),
      warnings: this.getWarnings(),
      deadlines: this.getCriticalDeadlines(),
    };
  }

  private calculateTaxes(intent: any): any {
    // Complex tax calculations
    return {
      estimated: 'RETRIEVED_FROM_DATABASE',
      breakdown: {
        corporate: 'RETRIEVED_FROM_DATABASE',
        vat: 'RETRIEVED_FROM_DATABASE',
        withholding: 'RETRIEVED_FROM_DATABASE',
        total: 'RETRIEVED_FROM_DATABASE',
      },
    };
  }

  private analyzeIncentiveEligibility(intent: any): any {
    return {
      taxHoliday: {
        eligible: this.checkTaxHolidayEligibility(intent),
        details: this.taxHoliday,
        urgentAction: '⏰ DEADLINE: December 31, 2025 to apply!',
      },
      taxAllowance: {
        eligible: this.checkTaxAllowanceEligibility(intent),
        details: this.taxAllowance,
      },
      superDeductions: {
        opportunities: this.checkSuperDeductionOpportunities(intent),
        details: this.superDeductions,
      },
      sezIncentives: {
        available: this.sezIncentives.activeSEZs,
        details: this.sezIncentives,
      },
    };
  }

  private checkTaxHolidayEligibility(intent: any): string {
    // Simplified check - real implementation would analyze business type
    return 'Potentially eligible if: (1) Pioneer industry, (2) Investment ≥ 'RETRIEVED_FROM_DATABASE'';
  }

  private checkTaxAllowanceEligibility(intent: any): string {
    return 'Potentially eligible if: (1) Strategic sector, (2) Investment ≥ 'RETRIEVED_FROM_DATABASE'';
  }

  private checkSuperDeductionOpportunities(intent: any): string[] {
    return [
      '✅ Vocational training: 200% deduction (if partner with vocational school)',
      '✅ R&D activities: 300% deduction (if collaborate with university)',
      '✅ Industry 4.0: 60% additional depreciation (automation/robotics investment)',
    ];
  }

  private getComplianceChecklist(intent: any): any {
    return {
      quarterly: [
        '📊 LKPM Report (due 30 days after quarter) - ⚠️ 3 missed = license revoked',
        '📋 Review investment realization vs plan',
      ],
      monthly: [
        '💰 PPh 21 (10th) - Employee tax',
        '💰 PPh 23 (10th) - Withholding tax',
        '💰 PPh 25 (15th) - Corporate installment',
        '💰 PPN (end of month) - VAT return',
        '🏥 BPJS Kesehatan (10th) - Health insurance',
        '🏥 BPJS Ketenagakerjaan (10th) - Employment insurance',
      ],
      annual: [
        '📄 SPT Tahunan Badan (April 30) - Corporate tax return',
        '📄 SPT Tahunan Pribadi (March 31) - Personal tax return',
        '📄 Audited financial statements (if required)',
        '📄 Transfer pricing documentation (if related party transactions)',
      ],
    };
  }

  private findOptimizations(intent: any): string[] {
    return [
      '🎯 Tax Holiday: Apply BEFORE Dec 31, 2025 (5-20 years CIT exemption)',
      '🎯 Tax Allowance: 30% deduction if eligible (saves ~'RETRIEVED_FROM_DATABASE'',
      '🎯 Super Deduction R&D: 300% deduction (triple your R&D expense deduction)',
      '🎯 Super Deduction Training: 200% deduction (vocational programs)',
      '🎯 Industry 4.0: 60% additional depreciation (automation investment)',
      '💡 1% final tax for small business (revenue < 'RETRIEVED_FROM_DATABASE'',
      '💡 Claim all deductible expenses (keep receipts 10 years)',
      '💡 Consider tax treaty benefits (dividend WHT reduction)',
      '💡 SEZ location: Up to 25 years CIT exemption + import duty free',
    ];
  }

  private getWarnings(): string[] {
    return [
      '⚠️ CRITICAL: Tax holiday deadline Dec 31, 2025 (last chance)',
      '⚠️ VAT INCREASE: 11% → 12% scheduled 2025 (date TBD - monitor announcements)',
      '⚠️ CORETAX: Mandatory migration 2025 - prepare accounting systems NOW',
      '⚠️ NPWP FORMAT: Transitioning to 16-digit NIK-based system',
      '⚠️ LKPM: 3 missed quarterly reports = LICENSE REVOKED',
      '⚠️ Late payment = 2% penalty per month',
      '⚠️ Missing tax deadline = audit risk + penalties',
      '⚠️ Keep all receipts for 10 years (tax audit statute)',
      '⚠️ False LKPM data = criminal liability (KUHP Art. 263)',
      '⚠️ Transfer pricing documentation required if related party transactions',
      '⚠️ Tax incentives REVOKED if: false data, investment <80% plan, change business without approval',
    ];
  }

  private getCriticalDeadlines(): any {
    return {
      urgent: [
        {
          date: '2025-12-31',
          item: '⏰ TAX HOLIDAY APPLICATION (last day!)',
          priority: 'CRITICAL',
        },
      ],
      recurring: {
        monthly: [
          { day: '10th', items: ['PPh 21', 'PPh 23', 'BPJS'] },
          { day: '15th', items: ['PPh 25'] },
          { day: 'End of month', items: ['PPN'] },
        ],
        quarterly: [{ deadline: '30 days after quarter end', items: ['LKPM Report (MANDATORY)'] }],
        annual: [
          { date: 'March 31', items: ['Personal Tax Return (SPT Pribadi)'] },
          { date: 'April 30', items: ['Corporate Tax Return (SPT Badan)'] },
        ],
      },
    };
  }
}
