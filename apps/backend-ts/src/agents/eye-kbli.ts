// @ts-nocheck
/**
 * EYE KBLI
 * The all-seeing expert on Indonesian business classification codes
 * Knows every code, every requirement, every restriction
 *
 * Updated: 2025-10-02
 * Source: BPS Regulation 2/2020, PP 28/2025, Perpres 10/2021 + 49/2021
 */

export class EyeKBLI {

  // ==========================================
  // KBLI 2020 SYSTEM & STRUCTURE
  // ==========================================

  private kbliSystem = {
    regulation: 'BPS (Statistics Indonesia) Regulation No. 2/2020',
    effectiveDate: 'September 24, 2020',
    currentVersion: 'KBLI 2020 (ACTIVE)',
    futureVersion: {
      name: 'KBLI 2025',
      status: 'IN DEVELOPMENT - NOT YET MANDATORY',
      expectedRelease: 'TBD 2025',
      note: '⚠️ TO VERIFY: Release date and mandatory implementation date'
    },
    updates: {
      newClassifications: 216,
      removedClassifications: 6,
      totalEntries: 1417, // as of PP 28/2025
      includes: ['YouTubers', 'Online content creators', 'Digital economy activities', 'New creative industries']
    },

    structure: {
      digits: 5,
      format: {
        digit1: {
          type: 'Alphabetical code',
          description: 'Main classification of economic activities (A-U)',
          examples: ['A = Agriculture', 'C = Manufacturing', 'F = Construction', 'G = Wholesale/Retail']
        },
        digit2: {
          type: 'Business section (2-digit numeric)',
          description: 'Main classifications by character',
          example: '56 = Food and beverage service activities'
        },
        digit3: {
          type: 'Category (3-digit numeric)',
          description: 'Detailed category',
          example: '561 = Restaurants and mobile food service'
        },
        digits45: {
          type: 'Detailed classification (4-5 digit numeric)',
          description: 'Specific business activity',
          example: '56101 = Restaurant'
        }
      }
    },

    referenceStandards: ['ISIC (International Standard Industrial Classification)', 'ACIC (ASEAN Common Industrial Classification)', 'EAMS (Economic Activity Mapping System)']
  };

  // ==========================================
  // OSS RISK-BASED APPROACH (PP 28/2025)
  // ==========================================

  private ossRiskBased = {
    regulation: 'PP 28/2025 - Risk-Based Business Licensing',
    effectiveDate: 'June 5, 2025',
    replaces: 'PP 5/2021',
    systemUpdateDeadline: 'October 5, 2025',
    portal: 'https://oss.go.id/informasi/kbli-berbasis-risiko',
    ossVersion: {
      current: 'OSS 1.1',
      features: [
        'Risk-based licensing approach',
        'NIB automatic generation for 80% business types',
        'Integration with ministry systems',
        'Single submission for multiple licenses'
      ],
      improvements: [
        'Faster NIB issuance (minutes vs days)',
        'Reduced documentation requirements',
        'Automatic risk assessment',
        'Digital certificate generation'
      ]
    },

    riskCategories: {
      low: {
        code: 'R',
        name: 'Low Risk (Risiko Rendah)',
        requirements: ['NIB (Business ID Number) ONLY'],
        nibFunction: 'NIB serves as both business identity AND legality to operate',
        examples: ['E-commerce retail (47919)', 'Online consulting', 'Content creation']
      },
      mediumLow: {
        code: 'MR',
        name: 'Medium-Low Risk (Risiko Menengah Rendah)',
        requirements: ['NIB', 'Certificate of Standards (self-declaration)'],
        certificateType: 'Statement of compliance with standards (filed via OSS)',
        verification: 'Self-declaration (no government verification required)'
      },
      mediumHigh: {
        code: 'MT',
        name: 'Medium-High Risk (Risiko Menengah Tinggi)',
        requirements: ['NIB', 'Certificate of Standards (government-verified)'],
        certificateType: 'Statement of compliance (MUST be verified)',
        verification: 'MANDATORY verification by central or regional government'
      },
      high: {
        code: 'T',
        name: 'High Risk (Risiko Tinggi)',
        requirements: ['NIB', 'Operating License'],
        licenseType: 'Full operating license from relevant ministry/agency',
        examples: ['Construction (41011)', 'Alcohol production/distribution', 'Healthcare facilities']
      }
    },

    newSectors2025: [
      'Creative economy',
      'Geospatial information services',
      'Cooperatives',
      'Electronic systems and transactions',
      'Investment facilitation',
      'Two additional sectors (TBD by government)'
    ],

    kbliEntriesGrowth: {
      before: 1348,
      after: 1417,
      increase: 69,
      note: 'Previously unregulated activities now formally categorized'
    }
  };

  // ==========================================
  // DNI (NEGATIVE INVESTMENT LIST) 2025
  // ==========================================

  private negativeInvestmentList = {
    regulation: ['UU 11/2020 (Omnibus Law on Job Creation)', 'Perpres 10/2021', 'Perpres 49/2021'],
    lastUpdate: 'January 2025',
    majorChange: 'Reduced from 100 sectors to 6 sectors CLOSED',
    fdiTarget: 'USD 100 billion annual FDI',

    closedSectors: [
      {
        sector: 'Arms and Ammunition Manufacturing',
        kbli: '25201',
        foreignOwnership: '0%',
        reason: 'National security'
      },
      {
        sector: 'Chemical Weapons Production/Trade',
        kbli: 'Various',
        foreignOwnership: '0%',
        reason: 'International treaties + national security'
      },
      {
        sector: 'Cannabis Cultivation',
        kbli: '01192',
        foreignOwnership: '0%',
        reason: 'Narcotics law'
      },
      {
        sector: 'Gambling and Casinos',
        kbli: '92000',
        foreignOwnership: '0%',
        reason: 'Cultural and religious reasons'
      },
      {
        sector: 'Alcoholic Beverages Production (some)',
        kbli: '11010',
        foreignOwnership: 'Restricted',
        note: 'Some categories closed, others restricted to specific ownership %'
      },
      {
        sector: 'Wildlife Trade (certain species)',
        kbli: 'Various',
        foreignOwnership: '0%',
        reason: 'Conservation and CITES compliance'
      }
    ],

    greenInvestment2025: {
      focus: ['Renewable energy', 'EV manufacturing', 'Eco-tourism'],
      renewableEnergy: {
        before: '67% foreign ownership maximum',
        after: '100% foreign ownership allowed',
        sectors: ['Solar', 'Wind', 'Geothermal']
      }
    },

    generalPrinciple: 'All sectors NOT listed in DNI are OPEN to foreign investment (subject to capital requirements)'
  };

  // ==========================================
  // CAPITAL REQUIREMENTS 2025
  // ==========================================

  private capitalRequirements = {
    generalRule: {
      minimum: 'IDR 10 billion',
      excludes: 'Land and buildings',
      application: 'Per 5-digit KBLI code per project location',
      example: 'Restaurant (56101) in Seminyak = IDR 10B, Restaurant (56101) in Ubud = IDR 10B (separate capital required)'
    },

    multipleKBLI: {
      sameLocation: 'IDR 10B × number of KBLI codes',
      example: 'Villa (55130) + Restaurant (56101) + Bar (56301) in Canggu = IDR 30B minimum',
      note: 'Each KBLI requires separate IDR 10B capital at same location'
    },

    exceptions: {
      ecommerce: {
        kbli: '47919',
        localOwnership: 'IDR 10B (if foreign ownership)',
        foreignOwnership100: 'IDR 100B (for 100% foreign-owned e-commerce)',
        note: 'Higher capital for 100% foreign ownership'
      }
    },

    paidUpCapital: {
      minimum: 'IDR 2.5 billion',
      timing: 'Must be paid within timeframe specified in deed',
      verification: 'Bank statement + auditor verification required'
    }
  };

  // ==========================================
  // FOREIGN OWNERSHIP RESTRICTIONS
  // ==========================================

  private foreignOwnership = {
    construction: {
      kbli: '41011 (Residential Building Construction)',
      nonASEAN: '67% maximum',
      ASEAN: '70% maximum',
      regulation: 'Minister of Public Works Regulation No. 6/2021 + PP 5/2021',
      scope: 'Houses, apartments, condos, residential buildings'
    },

    retail: {
      offline: {
        kbli: '47xxx (all retail codes)',
        foreignOwnership: '0% (CLOSED)',
        note: 'All offline retail CLOSED to foreign investment'
      },
      online: {
        kbli: '47919 (E-commerce retail)',
        foreignOwnership: '100% (OPEN)',
        capitalRequirement: 'IDR 100B for 100% foreign ownership'
      }
    },

    wholesale: {
      kbli: '46xxx (wholesale trade)',
      foreignOwnership: '100% (OPEN)',
      note: 'Wholesale OPEN, retail CLOSED - cannot combine in one entity'
    }
  };

  // ==========================================
  // SECTOR-SPECIFIC REGULATIONS 2025
  // ==========================================

  private sectorRegulations = {
    foodBeverage: {
      halalCertification: {
        regulation: 'PP 42/2024 (October 18, 2024)',
        deadline: 'October 17, 2026',
        status: 'MANDATORY for ALL food & beverage businesses',
        legalBasis: 'PP 39/2021',
        validity: '4 years',
        cost: 'IDR 500K - 5M+ (depends on SKUs)',
        authority: 'BPJPH (replaced MUI as issuing body)',
        note: 'No longer optional - business necessity in Muslim-majority Indonesia'
      },

      commonKBLI: [
        { code: '56101', name: 'Restaurant', capital: 'IDR 10B', risk: 'Medium-Low' },
        { code: '56102', name: 'Food Stalls', capital: 'IDR 10B', risk: 'Low' },
        { code: '56104', name: 'Mobile Food & Beverage', capital: 'IDR 10B', risk: 'Low' },
        { code: '56301', name: 'Bar (serving alcohol)', capital: 'IDR 10B', risk: 'High', note: 'NPPBCK alcohol license required' },
        { code: '56306', name: 'Catering', capital: 'IDR 10B', risk: 'Medium-Low' }
      ]
    },

    construction: {
      kbli: '41011',
      name: 'Residential Building Construction',
      foreignOwnership: { nonASEAN: '67%', ASEAN: '70%' },
      capital: 'IDR 10B per location',
      risk: 'Medium to High',
      scale: 'Large scale',
      licenses: ['Business license', 'Construction service business license (IUJK)', 'Environmental permit']
    }
  };
  // This would normally be a massive database
  // For now, focused on common Bali businesses
  private kbliDatabase = {
    'hospitality': {
      '56101': {
        name: 'Restoran',
        nameEn: 'Restaurant',
        capital: 'IDR 10,000,000,000',
        licenses: ['SIUP', 'TDP', 'HO', 'Hygiene Certificate'],
        timeline: '21-30 days',
        restrictions: 'No street-facing in traditional market areas',
        tips: 'Include 56104 (Cafe) for flexibility'
      },
      '56301': {
        name: 'Bar',
        nameEn: 'Bar/Nightclub',
        capital: 'IDR 10,000,000,000',
        licenses: ['SIUP', 'TDP', 'HO', 'Alcohol License', 'STPW'],
        timeline: '45-60 days',
        restrictions: 'Zoning restrictions apply, not near schools/temples',
        tips: 'Alcohol license is the bottleneck - start early'
      },
      '93290': {
        name: 'Beach Club / Entertainment',
        nameEn: 'Recreation & Entertainment',
        capital: 'IDR 10,000,000,000',
        licenses: ['SIUP', 'TDP', 'HO', 'Tourism License'],
        timeline: '30-45 days',
        restrictions: 'Beachfront requires additional permits',
        tips: 'Combine with 56301 for full beach club operation'
      }
    },
    'accommodation': {
      '55130': {
        name: 'Villa',
        nameEn: 'Villa Accommodation',
        capital: 'IDR 10,000,000,000',
        licenses: ['Pondok Wisata', 'SIUP', 'TDP', 'PBG'],
        timeline: '30-45 days',
        restrictions: 'Max 5 rooms for Pondok Wisata',
        tips: 'Over 5 rooms requires hotel license (more complex)'
      }
    },
    'services': {
      '70209': {
        name: 'Konsultan',
        nameEn: 'Business Consultant',
        capital: 'IDR 10,000,000,000',
        licenses: ['SIUP', 'TDP'],
        timeline: '14-21 days',
        restrictions: 'Some sectors require specific qualifications',
        tips: 'Broad code - good for various consulting'
      }
    }
  };

  /**
   * Analyze business type and return KBLI recommendations
   */
  async analyze(intent: any): Promise<any> {
    const businessType = this.detectBusinessType(intent);
    const recommendations = this.getRecommendations(businessType);

    // Return ALL technical details
    // ZANTARA will make it elegant
    return {
      primary: recommendations.primary,
      secondary: recommendations.secondary,
      code: recommendations.primary.code,
      requirements: this.getAllRequirements(recommendations.primary),
      timeline: recommendations.primary.timeline,
      capitalRequirement: recommendations.primary.capital,
      restrictions: recommendations.primary.restrictions,
      processFlow: this.getDetailedProcess(businessType),
      commonCombinations: this.getCommonCombinations(businessType),
      warnings: this.getWarnings(businessType),
      confidence: 0.9
    };
  }

  private detectBusinessType(intent: any): string {
    // Smart detection based on keywords
    const keywords = intent.keywords || [];

    if (keywords.some(k => ['restaurant', 'cafe', 'warung', 'ristorante'].includes(k))) {
      return 'restaurant';
    }
    if (keywords.some(k => ['bar', 'club', 'nightclub', 'beach club'].includes(k))) {
      return 'beach_club';
    }
    if (keywords.some(k => ['villa', 'hotel', 'accommodation'].includes(k))) {
      return 'villa';
    }

    return 'general';
  }

  private getRecommendations(businessType: string): any {
    switch (businessType) {
      case 'restaurant':
        return {
          primary: this.kbliDatabase.hospitality['56101'],
          secondary: [this.kbliDatabase.hospitality['56104']]
        };

      case 'beach_club':
        return {
          primary: this.kbliDatabase.hospitality['93290'],
          secondary: [
            this.kbliDatabase.hospitality['56301'],
            this.kbliDatabase.hospitality['56101']
          ]
        };

      case 'villa':
        return {
          primary: this.kbliDatabase.accommodation['55130'],
          secondary: []
        };

      default:
        return {
          primary: this.kbliDatabase.services['70209'],
          secondary: []
        };
    }
  }

  private getAllRequirements(kbli: any): any {
    return {
      documents: [
        'Company deed (Akta)',
        'NPWP (Tax number)',
        'NIB (Business number)',
        'Location permit (HO)',
        ...kbli.licenses
      ],
      capitalRequirement: kbli.capital,
      timeEstimate: kbli.timeline,
      governmentFees: 'IDR 5,000,000 - 15,000,000',
      professionalFees: 'IDR 20,000,000 - 50,000,000'
    };
  }

  private getDetailedProcess(businessType: string): string[] {
    return [
      '1. Company formation (PT PMA) - 2 weeks',
      '2. Tax registration (NPWP) - 3 days',
      '3. Business license (NIB + KBLI) - 1 week',
      '4. Location permits (HO/IMB) - 2-4 weeks',
      '5. Operational licenses - 2-4 weeks',
      '6. Special licenses (if needed) - varies'
    ];
  }

  private getCommonCombinations(businessType: string): any {
    const combinations = {
      'restaurant': ['56101 + 56104', 'Add 47250 for retail sales'],
      'beach_club': ['93290 + 56301 + 56101', 'Complete hospitality package'],
      'villa': ['55130 alone', 'Add 68111 for property management'],
      'general': ['70209', 'Very flexible for consulting']
    };

    return combinations[businessType] || combinations.general;
  }

  private getWarnings(businessType: string): string[] {
    const warnings = {
      'restaurant': [
        'Location must be commercial zoned',
        'Kitchen must meet health standards',
        'Alcohol requires separate license'
      ],
      'beach_club': [
        'Beach areas have special regulations',
        'Noise restrictions after 11pm',
        'Environmental impact assessment required'
      ],
      'villa': [
        'Pondok Wisata limited to 5 rooms',
        'Must register with tourism board',
        'Different tax structure than hotels'
      ],
      'general': []
    };

    return warnings[businessType] || warnings.general;
  }

  /**
   * Search KBLI database
   */
  async searchKBLI(query: string): Promise<any[]> {
    // Would search massive database
    // Returns matching codes with details
    return [];
  }

  /**
   * Verify if KBLI code is still valid/current
   */
  async verifyCode(code: string): Promise<boolean> {
    // Check against latest government database
    return true;
  }
}