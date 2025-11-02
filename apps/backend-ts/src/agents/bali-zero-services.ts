// @ts-nocheck
/**
 * BALI ZERO SERVICES ORACLE
 * Complete Business, Legal & Tax Services
 * Source: PT. BALI NOL IMPERSARIAT Price List 2025
 */

export class BaliZeroServices {
  private knowledgeBase = {
    // COMPANY SETUP
    company: {
      'PT_PMA': {
        code: 'PT_PMA',
        name: 'Company Setup (PT PMA)',
        nameId: 'Pendirian PT PMA',
        price: 'Starting from IDR 20,000,000',
        description: 'Complete service for foreign investment company setup',
        includes: [
          'Choosing right business entity',
          'Meeting eligibility criteria',
          'PT PMA registration',
          'Business permits and licenses (NIB)',
          'Tax registration (NPWP)',
          'BKPM coordination'
        ],
        timeline: '4-6 weeks',
        requirements: [
          'Passport copies',
          'Business plan',
          'Capital commitment (minimum IDR 10 billion for most sectors)',
          'Office address proof',
          'Director/Commissioner details'
        ]
      },
      'COMPANY_REVISION': {
        code: 'COMPANY_REVISION',
        name: 'Company Revision',
        nameId: 'Revisi Perusahaan',
        price: 'Starting from IDR 7,000,000',
        description: 'Amendments to existing company structure',
        includes: [
          'Change of directors/commissioners',
          'Change of address',
          'Change of business activities (KBLI)',
          'Change of capital',
          'Shareholder amendments'
        ],
        timeline: '2-3 weeks'
      }
    },

    // LICENSES
    licenses: {
      'ALCOHOL_LICENSE': {
        code: 'ALCOHOL_LICENSE',
        name: 'Alcohol License',
        nameId: 'Izin Alkohol',
        price: 'Starting from IDR 15,000,000',
        description: 'License for alcoholic beverage production, distribution, or sale',
        types: [
          'Class A License (High alcohol content)',
          'Class B License (Medium alcohol content)',
          'Class C License (Low alcohol content)',
          'NPPBKC License (Excise number)'
        ],
        timeline: '6-8 weeks',
        requirements: [
          'PT PMA with hospitality/F&B KBLI',
          'Location permit (HO)',
          'Business operational proof',
          'Security clearance',
          'Local government approval'
        ],
        restrictions: [
          'Not within 200m of schools/religious sites',
          'Not in traditional market areas',
          'Zoning compliance required',
          'Annual renewal mandatory'
        ]
      }
    },

    // REAL ESTATE SERVICES
    realEstate: {
      'LEGAL_REAL_ESTATE': {
        code: 'LEGAL_REAL_ESTATE',
        name: 'Legal Real Estate Services',
        nameId: 'Layanan Legal Real Estate',
        price: 'Contact for quote',
        description: 'Complete legal assistance for property transactions',
        includes: [
          'Property due diligence',
          'Title deed verification (Hak Pakai/HGB/Hak Milik)',
          'Seller verification',
          'Feasibility checks',
          'Contract drafting and review',
          'Notary coordination',
          'Transaction assistance',
          'Registration at Land Office (BPN)'
        ],
        propertyTypes: [
          'Leasehold (25-30 years + extensions)',
          'Hak Pakai (Right to Use - foreigners can hold)',
          'Hak Guna Bangunan (Right to Build - via PT PMA)',
          'Hak Milik (Freehold - Indonesians only)'
        ],
        warnings: [
          'Foreigners cannot own freehold (Hak Milik)',
          'Leasehold must be properly notarized',
          'Check for encumbrances and disputes',
          'Verify IMB (building permit)',
          'Green belt areas have restrictions'
        ]
      },
      'BUILDING_PERMIT': {
        code: 'BUILDING_PERMIT',
        name: 'Building Permit (PBG & SLF)',
        nameId: 'Izin Mendirikan Bangunan',
        price: 'Contact for quote',
        description: 'Permits for building construction and occupancy',
        types: [
          'PBG (Persetujuan Bangunan Gedung) - Construction Permit',
          'SLF (Sertifikat Laik Fungsi) - Certificate of Usage Worthiness'
        ],
        timeline: '6-12 weeks',
        requirements: [
          'Land title deed',
          'Site plan',
          'Architectural drawings',
          'Structural calculations',
          'Environmental impact assessment (for large projects)',
          'Neighbor approval letters'
        ],
        mandatory: 'Required before construction and before occupancy'
      }
    },

    // TAXATION SERVICES
    taxation: {
      'BPJS_HEALTH': {
        code: 'BPJS_HEALTH',
        name: 'Health Insurance (BPJS Kesehatan)',
        nameId: 'Asuransi Kesehatan',
        price: 'IDR 2,500,000 per company (minimum 2 people)',
        description: 'Mandatory health insurance registration',
        mandatory: 'Required for all companies with employees'
      },
      'BPJS_EMPLOYMENT': {
        code: 'BPJS_EMPLOYMENT',
        name: 'Employment Insurance (BPJS Ketenagakerjaan)',
        nameId: 'Asuransi Ketenagakerjaan',
        price: 'IDR 1,500,000 per company (minimum 2 people)',
        description: 'Mandatory employment insurance (accident, pension, death)',
        mandatory: 'Required for all companies with employees'
      },
      'SPT_ANNUAL_OPERATIONAL': {
        code: 'SPT_ANNUAL_OPERATIONAL',
        name: 'Annual Tax Report (Operational)',
        nameId: 'SPT Tahunan (Operasional)',
        price: 'Starting from IDR 4,000,000',
        description: 'Annual tax filing for active companies with revenue',
        includes: [
          'Company tax return (SPT Badan)',
          'Personal tax returns for directors',
          'Financial statement preparation',
          'Tax calculations'
        ],
        deadline: 'April 30th (companies), March 31st (individuals)'
      },
      'SPT_ANNUAL_ZERO': {
        code: 'SPT_ANNUAL_ZERO',
        name: 'Annual Tax Report (Zero/Dormant)',
        nameId: 'SPT Tahunan (Nihil)',
        price: 'Starting from IDR 3,000,000',
        description: 'Annual tax filing for dormant/zero-revenue companies',
        includes: [
          'Zero tax return filing',
          'Dormant company status maintenance'
        ]
      },
      'SPT_PERSONAL': {
        code: 'SPT_PERSONAL',
        name: 'Annual Personal Tax Report',
        nameId: 'SPT Pribadi',
        price: 'IDR 2,000,000',
        description: 'Personal income tax return for individuals'
      },
      'MONTHLY_TAX': {
        code: 'MONTHLY_TAX',
        name: 'Monthly Tax Report',
        nameId: 'Laporan Pajak Bulanan',
        price: 'Starting from IDR 1,500,000',
        description: 'Monthly tax compliance',
        includes: [
          'PPh 21 (Employee income tax)',
          'PPh 23 (Withholding tax on services)',
          'PPh 25 (Monthly corporate installment)',
          'PPN (VAT 11%)',
          'Monthly reporting to tax office'
        ]
      },
      'NPWP_PERSONAL': {
        code: 'NPWP_PERSONAL',
        name: 'Tax Number Personal + Coretax',
        nameId: 'NPWP Pribadi + Coretax',
        price: 'IDR 1,000,000 per person',
        description: 'Personal tax number registration with new Coretax system',
        timeline: '3-5 days',
        mandatory: 'Required for all taxpayers in Indonesia'
      },
      'NPWPD': {
        code: 'NPWPD',
        name: 'Regional Tax Number (NPWPD)',
        nameId: 'NPWP Daerah',
        price: 'IDR 2,500,000 per company',
        description: 'Regional tax registration for local business taxes',
        applicableTo: [
          'Restaurants',
          'Hotels',
          'Entertainment venues',
          'Advertising services'
        ]
      },
      'LKPM': {
        code: 'LKPM',
        name: 'Investment Report (LKPM)',
        nameId: 'Laporan Kegiatan Penanaman Modal',
        price: 'IDR 1,000,000 per report (quarterly)',
        description: 'Quarterly investment activity report to BKPM',
        frequency: 'Every 3 months',
        mandatory: 'Required for all PT PMA companies',
        penalties: 'Late filing can result in investment license issues'
      }
    },

    // TAX RATES (Reference)
    taxRates: {
      'CORPORATE_TAX': {
        name: 'Corporate Income Tax',
        rates: [
          { range: 'Up to IDR 4.8B revenue/year', rate: '11%' },
          { range: 'Above IDR 4.8B revenue/year', rate: '22%' },
          { range: 'Listed companies (40%+ public)', rate: '19%' }
        ]
      },
      'VAT': {
        name: 'Value Added Tax (PPN)',
        rate: '11%',
        description: 'Applicable on most goods and services',
        exemptions: ['Basic necessities', 'Education', 'Healthcare']
      },
      'WITHHOLDING_TAX': {
        name: 'Withholding Tax (PPh 23)',
        rate: '2% (services), 15% (dividends)',
        description: 'Tax withheld on payments for services and dividends'
      },
      'EMPLOYEE_TAX': {
        name: 'Employee Income Tax (PPh 21)',
        progressive: [
          { range: 'Up to IDR 60M/year', rate: '5%' },
          { range: 'IDR 60M - 250M/year', rate: '15%' },
          { range: 'IDR 250M - 500M/year', rate: '25%' },
          { range: 'Above IDR 500M/year', rate: '30%' }
        ]
      }
    },

    // COMMON SERVICES PACKAGES
    packages: {
      'STARTUP_PACKAGE': {
        name: 'Startup Package',
        description: 'Everything to launch your business in Bali',
        includes: [
          'PT PMA company setup',
          'Investor KITAS (offshore)',
          'Tax registration (NPWP)',
          'BPJS registration',
          'Office virtual address (1 year)'
        ],
        estimatedPrice: 'IDR 40,000,000 - 50,000,000',
        timeline: '6-8 weeks'
      },
      'HOSPITALITY_PACKAGE': {
        name: 'Hospitality/F&B Package',
        description: 'Complete setup for restaurants, bars, cafes',
        includes: [
          'PT PMA with F&B KBLI',
          'Investor KITAS',
          'Location permit (HO)',
          'Hygiene certificate',
          'Tourism business registration',
          'Optional: Alcohol license'
        ],
        estimatedPrice: 'IDR 45,000,000 - 65,000,000 (without alcohol)',
        additionalAlcohol: 'Add IDR 15,000,000 for alcohol license',
        timeline: '8-12 weeks'
      },
      'VILLA_RENTAL_PACKAGE': {
        name: 'Villa Rental Package',
        description: 'Setup for villa accommodation business',
        includes: [
          'PT PMA with accommodation KBLI (55130)',
          'Investor KITAS',
          'Pondok Wisata license (up to 5 rooms)',
          'Tourism business registration',
          'Property management setup'
        ],
        estimatedPrice: 'IDR 45,000,000 - 55,000,000',
        timeline: '6-8 weeks',
        note: 'Over 5 rooms requires hotel license (more complex)'
      }
    },

    // CONTACT INFO
    contact: {
      company: 'PT. BALI NOL IMPERSARIAT',
      tradingAs: 'Bali Zero Services',
      whatsapp: '+62 859 0436 9574',
      email: 'info@balizero.com',
      services: [
        'Immigration & Visa Services',
        'Company Formation',
        'Business Licensing',
        'Taxation & Accounting',
        'Real Estate Legal Services',
        'Full Business Concierge'
      ]
    }
  };

  /**
   * Get service recommendations based on business type
   */
  async analyze(intent: any): Promise<any> {
    const businessType = this.detectBusinessType(intent);
    const recommendations = this.getRecommendations(businessType);

    return {
      businessType,
      recommendations,
      estimatedCosts: this.getEstimatedCosts(businessType),
      timeline: this.getTimeline(businessType),
      nextSteps: this.getNextSteps(businessType),
      contact: this.knowledgeBase.contact,
      confidence: 0.95
    };
  }

  private detectBusinessType(intent: any): string {
    const text = (intent.text || '').toLowerCase();

    if (text.includes('restaurant') || text.includes('cafe') || text.includes('bar') || text.includes('f&b')) {
      return 'hospitality';
    }
    if (text.includes('villa') || text.includes('hotel') || text.includes('accommodation')) {
      return 'accommodation';
    }
    if (text.includes('property') || text.includes('real estate') || text.includes('buy land')) {
      return 'real_estate';
    }
    if (text.includes('tax') || text.includes('accounting') || text.includes('spt')) {
      return 'taxation';
    }
    if (text.includes('company') || text.includes('pt pma') || text.includes('start business')) {
      return 'company_setup';
    }

    return 'general';
  }

  private getRecommendations(businessType: string): any {
    const recommendations = {
      'hospitality': {
        package: this.knowledgeBase.packages.HOSPITALITY_PACKAGE,
        services: [
          this.knowledgeBase.company.PT_PMA,
          this.knowledgeBase.licenses.ALCOHOL_LICENSE
        ],
        taxation: [
          this.knowledgeBase.taxation.BPJS_HEALTH,
          this.knowledgeBase.taxation.MONTHLY_TAX,
          this.knowledgeBase.taxation.NPWPD
        ]
      },
      'accommodation': {
        package: this.knowledgeBase.packages.VILLA_RENTAL_PACKAGE,
        services: [
          this.knowledgeBase.company.PT_PMA,
          this.knowledgeBase.realEstate.BUILDING_PERMIT
        ],
        taxation: [
          this.knowledgeBase.taxation.BPJS_HEALTH,
          this.knowledgeBase.taxation.MONTHLY_TAX,
          this.knowledgeBase.taxation.NPWPD
        ]
      },
      'real_estate': {
        services: [
          this.knowledgeBase.realEstate.LEGAL_REAL_ESTATE,
          this.knowledgeBase.realEstate.BUILDING_PERMIT
        ]
      },
      'taxation': {
        services: [
          this.knowledgeBase.taxation.MONTHLY_TAX,
          this.knowledgeBase.taxation.SPT_ANNUAL_OPERATIONAL,
          this.knowledgeBase.taxation.LKPM
        ]
      },
      'company_setup': {
        package: this.knowledgeBase.packages.STARTUP_PACKAGE,
        services: [
          this.knowledgeBase.company.PT_PMA
        ]
      },
      'general': {
        package: this.knowledgeBase.packages.STARTUP_PACKAGE
      }
    };

    return recommendations[businessType] || recommendations.general;
  }

  private getEstimatedCosts(businessType: string): any {
    const costs = {
      'hospitality': {
        setup: 'IDR 45,000,000 - 65,000,000',
        breakdown: [
          { item: 'PT PMA Setup', cost: 'IDR 20,000,000' },
          { item: 'Investor KITAS (Offshore)', cost: 'IDR 17,000,000' },
          { item: 'Licenses & Permits', cost: 'IDR 8,000,000 - 13,000,000' },
          { item: 'Alcohol License (Optional)', cost: 'IDR 15,000,000' }
        ],
        monthly: 'IDR 3,000,000 - 5,000,000 (tax + accounting)',
        annual: 'IDR 5,000,000 - 8,000,000 (renewals + reports)'
      },
      'accommodation': {
        setup: 'IDR 45,000,000 - 55,000,000',
        breakdown: [
          { item: 'PT PMA Setup', cost: 'IDR 20,000,000' },
          { item: 'Investor KITAS', cost: 'IDR 17,000,000' },
          { item: 'Pondok Wisata License', cost: 'IDR 5,000,000 - 8,000,000' },
          { item: 'Building Permit (if needed)', cost: 'Contact for quote' }
        ],
        monthly: 'IDR 2,500,000 - 4,000,000',
        annual: 'IDR 5,000,000 - 7,000,000'
      },
      'company_setup': {
        setup: 'IDR 40,000,000 - 50,000,000',
        breakdown: [
          { item: 'PT PMA Setup', cost: 'IDR 20,000,000' },
          { item: 'Investor KITAS', cost: 'IDR 17,000,000' },
          { item: 'Tax Registration', cost: 'IDR 1,000,000' },
          { item: 'BPJS Setup', cost: 'IDR 4,000,000' }
        ]
      }
    };

    return costs[businessType] || costs.company_setup;
  }

  private getTimeline(businessType: string): string {
    const timelines = {
      'hospitality': '8-12 weeks (12-16 weeks with alcohol license)',
      'accommodation': '6-8 weeks',
      'company_setup': '4-6 weeks',
      'real_estate': '4-8 weeks (depends on property)',
      'taxation': 'Ongoing monthly service'
    };

    return timelines[businessType] || '6-8 weeks';
  }

  private getNextSteps(businessType: string): string[] {
    return [
      'Contact Bali Zero via WhatsApp: +62 859 0436 9574',
      'Schedule consultation (free initial assessment)',
      'Provide business details and requirements',
      'Receive detailed quote and timeline',
      'Begin documentation process',
      'Bali Zero handles all government coordination'
    ];
  }

  /**
   * Get all available services
   */
  getAllServices(): any {
    return {
      company: this.knowledgeBase.company,
      licenses: this.knowledgeBase.licenses,
      realEstate: this.knowledgeBase.realEstate,
      taxation: this.knowledgeBase.taxation,
      packages: this.knowledgeBase.packages
    };
  }

  /**
   * Get tax information
   */
  getTaxInfo(): any {
    return this.knowledgeBase.taxRates;
  }
}
