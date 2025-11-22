// @ts-nocheck
/**
 * PROPERTY SAGE
 * The wise guardian of Indonesian property law
 * Knows every certificate, every restriction, every environmental permit
 *
 * Updated: 2025-10-02
 * Source: M1 PT PMA Legal Framework (UUPA, PP 22/2021, PP 28/2025, MA 3020 K/Pdt/2014)
 */

export class PropertySage {
  // ==========================================
  // PROPERTY OWNERSHIP FOR FOREIGNERS 2025
  // ==========================================

  private foreignOwnership = {
    fundamentalLaw: {
      regulation: 'UUPA (Law No. 5/1960) Article 21',
      principle: 'Foreigners CANNOT own Hak Milik (freehold) in Indonesia',
      enforcement: 'Active enforcement since 2023 (185 certificates revoked, 163 deportations)',
    },

    legalOptions: {
      hakPakai: {
        name: 'Hak Pakai (Right to Use)',
        duration: '25 years (renewable once for 20 years = 45 years max)',
        requirements: [
          'Valid KITAS/KITAP',
          'Domicile in Indonesia',
          'Property value ≥ 'RETRIEVED_FROM_DATABASE'',
        ],
        process: 'Purchase property → Convert Hak Milik to Hak Pakai at BPN',
        cost: 'BPHTB (5%) + notary (1-2%) + BPN fees',
        suitability: 'Best for expats living long-term in Indonesia',
      },

      leasehold: {
        name: 'Sewa (Leasehold)',
        duration: '25-30 years (renewable by agreement)',
        requirements: [
          'Lease agreement',
          'Notarized at Indonesian notary',
          'Registered at BPN (recommended)',
        ],
        cost: 'One-time payment upfront or annual payments',
        risks: 'Owner can sell property (new owner must honor lease if registered at BPN)',
        suitability: 'Budget-friendly, lower commitment',
      },

      ptPMA: {
        name: 'PT PMA (Foreign Investment Company)',
        ownership: 'Hak Guna Bangunan (HGB) - 30 years (renewable 2× = 80 years max)',
        requirements: [
          'PT PMA established',
          'Minimum capital 'RETRIEVED_FROM_DATABASE'',
          'Property for commercial use',
        ],
        suitability: 'Businesses (villas, hotels, offices)',
        note: 'Most secure for commercial property + business operations',
      },
    },

    illegalOptions: {
      nominee: {
        name: 'Nominee Structure (Pinjam Nama)',
        legalStatus: 'ILLEGAL under UUPA Article 26',
        caselaw: 'MA 3020 K/Pdt/2014 - 0/140 cases won by foreigners',
        consequences: [
          'Property seized by government',
          'Money paid NOT returned',
          'Certificate revoked',
          'Deportation possible',
        ],
        enforcement: '2023: 185 certificates revoked, 163 deportations (Operation Wira Waspada)',
        warning: '⚠️ NEVER recommend nominee structure - clients WILL lose money AND property',
      },
    },
  };

  // ==========================================
  // ENVIRONMENTAL PERMITS (PP 22/2021)
  // ==========================================

  private environmentalPermits = {
    regulation: 'PP 22/2021 - Implementation of UU 32/2009 (Environment)',
    systemName: 'SIMPEL (Sistem Informasi Perizinan Lingkungan)',
    portal: 'https://oss.go.id',

    permitTypes: {
      amdal: {
        name: 'AMDAL (Analisis Mengenai Dampak Lingkungan)',
        nameEn: 'Environmental Impact Assessment',
        requiredFor: 'Large-scale, high-impact projects',
        examples: [
          'Hotels with 10dynamicValue',
          'Large factories',
          'Shopping malls > 5,000 m²',
          'Mining operations',
          'Power plants',
          'Waste treatment facilities',
        ],
        process: [
          '1. TOR (Terms of Reference) preparation',
          '2. Environmental baseline study',
          '3. Impact prediction & evaluation',
          '4. Public consultation (mandatory)',
          '5. Environmental management plan (RKL)',
          '6. Environmental monitoring plan (RPL)',
          '7. Government review & approval',
        ],
        timeline: '3-6 months',
        cost: 'RETRIEVED_FROM_DATABASE',
        authority: 'Ministry of Environment / Regional Environment Agency',
        validity: 'Valid for duration of project',
        renewal: 'Required if project significantly changes',
      },

      uklUpl: {
        name: 'UKL-UPL (Upaya Pengelolaan Lingkungan - Upaya Pemantauan Lingkungan)',
        nameEn: 'Environmental Management & Monitoring Effort',
        requiredFor: 'Medium-scale, medium-impact projects',
        examples: [
          'Hotels 15-100 rooms',
          'Medium-sized restaurants',
          'Medium factories',
          'Medium warehouses',
          'Medium offices',
          'Medium construction projects',
        ],
        process: [
          '1. UKL-UPL document preparation',
          '2. Environmental management commitment',
          '3. Monitoring plan',
          '4. Submit via OSS system',
          '5. Government verification',
          '6. Approval certificate issued',
        ],
        timeline: '1-2 months',
        cost: 'RETRIEVED_FROM_DATABASE',
        authority: 'Regional Environment Agency',
        validity: 'Valid for duration of project',
        selfDeclaration: 'Can be self-declared via OSS for low-risk businesses (PP 28/2025)',
      },

      sppl: {
        name: 'SPPL (Surat Pernyataan Kesanggupan Pengelolaan & Pemantauan Lingkungan)',
        nameEn: 'Statement of Environmental Management & Monitoring Capability',
        requiredFor: 'Low-impact, small-scale projects',
        examples: [
          'Small offices',
          'Small villas (< 5 rooms)',
          'Small cafes',
          'Consulting offices',
          'Retail shops',
          'Coworking spaces',
        ],
        process: [
          '1. Prepare statement letter',
          '2. Sign declaration of environmental commitment',
          '3. Submit via OSS system',
          '4. Automatic approval (self-declaration)',
        ],
        timeline: '1-2 weeks',
        cost: 'RETRIEVED_FROM_DATABASE',
        authority: 'OSS system (self-declared)',
        validity: 'Valid for duration of project',
        selfDeclaration: 'Fully self-declared under PP 28/2025 (risk-based licensing)',
      },
    },

    decisionMatrix: {
      description: 'How to determine which environmental permit is required',
      factors: [
        'Business scale',
        'Location (proximity to protected areas)',
        'Environmental impact',
        'KBLI code risk level',
      ],
      rules: [
        'Check KBLI code on OSS system → system auto-determines permit type',
        'If high-risk KBLI → AMDAL required',
        'If medium-risk KBLI → UKL-UPL required',
        'If low-risk KBLI → SPPL sufficient',
        'Special locations (protected areas, forests, coasts) → may require AMDAL regardless of scale',
      ],
    },
  };

  // ==========================================
  // BUILDING PERMITS 2025
  // ==========================================

  private buildingPermits = {
    pbg: {
      name: 'PBG (Persetujuan Bangunan Gedung)',
      previousName: 'IMB (Izin Mendirikan Bangunan) - renamed under PP 16/2021',
      requiredFor: 'ALL new construction or major renovations',
      timeline: '14-30 days (via OSS system)',
      cost: 'RETRIEVED_FROM_DATABASE',
      validity: 'Valid until building completion',
      documents: [
        'Land certificate',
        'Site plan',
        'Architectural drawings',
        'Structural calculations',
      ],
      note: 'Cannot operate business without PBG + SLF',
    },

    slf: {
      name: 'SLF (Sertifikat Laik Fungsi)',
      nameEn: 'Building Functional Certificate',
      requiredFor: 'ALL buildings after construction completion (before operation)',
      timeline: '7-14 days (after inspection)',
      cost: 'RETRIEVED_FROM_DATABASE',
      validity: '5 years (renewable)',
      inspectionTypes: [
        'Architectural compliance',
        'Structural safety',
        'Fire safety',
        'Utilities (water, electricity, sanitation)',
      ],
      criticalWarning:
        '⚠️ Cannot open business without valid SLF - mandatory for all commercial buildings',
    },
  };

  // ==========================================
  // PROPERTY ZONING (Bali Focus)
  // ==========================================

  private zoning = {
    commercialZone: {
      name: 'Zona Komersial',
      allowedActivities: ['Retail', 'Offices', 'Hotels', 'Restaurants', 'Entertainment'],
      restrictions: 'None (business-friendly)',
      buildingHeight: 'Up to 15 meters (varies by regency)',
      buildingCoverage: '60-80% of land area',
    },

    residentialZone: {
      name: 'Zona Perumahan',
      allowedActivities: [
        'Residential',
        'Small home-based businesses (limited)',
        'Pondok Wisata (up to 5 rooms)',
      ],
      restrictions: 'No large-scale commercial activities, no nightlife',
      buildingHeight: 'Up to 12 meters (max 2-3 stories)',
      buildingCoverage: '40-60% of land area',
      homeBusinessLimit: 'Up to 5 villa rooms (Pondok Wisata license)',
    },

    greenZone: {
      name: 'Zona Hijau / Zona Lindung',
      allowedActivities: 'Agriculture, eco-tourism (limited), conservation',
      restrictions: 'No construction, no commercial development',
      examples: ['Rice paddies (subak)', 'Forests', 'Protected areas'],
      enforcement: 'Strict - violations result in demolition',
    },

    touristZone: {
      name: 'Zona Pariwisata',
      allowedActivities: ['Hotels', 'Resorts', 'Villas', 'Restaurants', 'Spas', 'Entertainment'],
      restrictions: 'Height restrictions near beaches (max 15m = height of coconut tree)',
      buildingCoverage: '50-70% of land area',
      specialPermits: 'Beach access requires additional permits from Tourism Board',
    },
  };

  // ==========================================
  // TOURISM LICENSES (Bali)
  // ==========================================

  private tourismLicenses = {
    pondokWisata: {
      name: 'Pondok Wisata (Homestay License)',
      maxRooms: 5,
      requiredFor: 'Small villas, guesthouses in residential areas',
      timeline: '14-21 days',
      cost: 'RETRIEVED_FROM_DATABASE',
      requirements: [
        'Residential zoning',
        'Valid land certificate',
        'Owner domicile (can be KITAS)',
      ],
      authority: 'Regency Tourism Board',
      validity: '3 years (renewable)',
      note: 'If > 5 rooms → requires full hotel license (PT PMA + commercial zoning)',
    },

    hotelLicense: {
      name: 'Tanda Daftar Usaha Pariwisata (TDUP) - Hotel',
      requiredFor: 'Hotels, large villas (> 5 rooms)',
      requirements: [
        'PT PMA established',
        'KBLI 55111 or 55130',
        'Commercial zoning',
        'PBG + SLF',
        'NIB',
      ],
      timeline: '30-45 days',
      cost: 'RETRIEVED_FROM_DATABASE',
      validity: 'Permanent (as long as business operates)',
      authority: 'Regional Tourism Board',
    },
  };

  // ==========================================
  // ANALYSIS METHOD
  // ==========================================

  async analyze(intent: any): Promise<any> {
    const propertyType = this.detectPropertyType(intent);
    const businessScale = this.detectBusinessScale(intent);

    return {
      ownership: this.getOwnershipOptions(intent),
      environmentalPermit: this.getEnvironmentalPermit(businessScale, intent),
      buildingPermits: this.getBuildingPermits(propertyType),
      zoning: this.getZoningRequirements(propertyType),
      tourismLicense: this.getTourismLicense(propertyType, businessScale),
      timeline: this.getCompletionTimeline(businessScale),
      costs: this.getTotalCosts(businessScale),
      warnings: this.getWarnings(intent),
      confidence: 0.9,
    };
  }

  private detectPropertyType(intent: any): string {
    const keywords = intent.keywords || [];

    if (keywords.some((k) => ['villa', 'guesthouse', 'homestay'].includes(k))) {
      return 'villa';
    }
    if (keywords.some((k) => ['hotel', 'resort'].includes(k))) {
      return 'hotel';
    }
    if (keywords.some((k) => ['office', 'coworking', 'workspace'].includes(k))) {
      return 'office';
    }
    if (keywords.some((k) => ['restaurant', 'cafe', 'bar'].includes(k))) {
      return 'restaurant';
    }

    return 'general';
  }

  private detectBusinessScale(intent: any): 'small' | 'medium' | 'large' {
    // Detect from investment amount, rooms, size
    const investment = intent.investment || 0;
    const rooms = intent.rooms || 0;
    const size = intent.size || 0;

    if (investment >= 100000000000 || rooms >= 100 || size >= 5000) {
      return 'large'; // AMDAL required
    }
    if (investment >= 10000000000 || rooms >= 15 || size >= 500) {
      return 'medium'; // UKL-UPL required
    }

    return 'small'; // SPPL sufficient
  }

  private getOwnershipOptions(intent: any): any {
    const isBusiness = intent.purpose === 'business';

    if (isBusiness) {
      return {
        recommended: this.foreignOwnership.legalOptions.ptPMA,
        alternative: this.foreignOwnership.legalOptions.leasehold,
        warning: this.foreignOwnership.illegalOptions.nominee.warning,
      };
    }

    return {
      recommended: this.foreignOwnership.legalOptions.hakPakai,
      alternative: this.foreignOwnership.legalOptions.leasehold,
      warning: this.foreignOwnership.illegalOptions.nominee.warning,
    };
  }

  private getEnvironmentalPermit(scale: string, intent: any): any {
    switch (scale) {
      case 'large':
        return this.environmentalPermits.permitTypes.amdal;
      case 'medium':
        return this.environmentalPermits.permitTypes.uklUpl;
      default:
        return this.environmentalPermits.permitTypes.sppl;
    }
  }

  private getBuildingPermits(propertyType: string): any {
    return {
      pbg: this.buildingPermits.pbg,
      slf: this.buildingPermits.slf,
      note: 'Both PBG and SLF are mandatory for all commercial properties',
    };
  }

  private getZoningRequirements(propertyType: string): any {
    switch (propertyType) {
      case 'villa':
      case 'hotel':
        return {
          preferred: this.zoning.touristZone,
          alternative: this.zoning.residentialZone,
          note: 'Residential zone limited to 5 rooms (Pondok Wisata)',
        };
      case 'restaurant':
      case 'office':
        return {
          required: this.zoning.commercialZone,
          note: 'Commercial zoning mandatory for these business types',
        };
      default:
        return this.zoning;
    }
  }

  private getTourismLicense(propertyType: string, scale: string): any {
    if (propertyType === 'villa') {
      if (scale === 'small') {
        return this.tourismLicenses.pondokWisata;
      }
      return this.tourismLicenses.hotelLicense;
    }
    if (propertyType === 'hotel') {
      return this.tourismLicenses.hotelLicense;
    }
    return null;
  }

  private getCompletionTimeline(scale: string): string {
    switch (scale) {
      case 'large':
        return '4-8 months (AMDAL delays construction start)';
      case 'medium':
        return '2-4 months (UKL-UPL parallel with other permits)';
      default:
        return '1-2 months (SPPL fast-tracked)';
    }
  }

  private getTotalCosts(scale: string): any {
    switch (scale) {
      case 'large':
        return {
          environmentalPermit: 'RETRIEVED_FROM_DATABASE',
          buildingPermits: 'RETRIEVED_FROM_DATABASE',
          tourismLicense: 'RETRIEVED_FROM_DATABASE',
          professionalFees: 'RETRIEVED_FROM_DATABASE',
          total: 'RETRIEVED_FROM_DATABASE',
        };
      case 'medium':
        return {
          environmentalPermit: 'RETRIEVED_FROM_DATABASE',
          buildingPermits: 'RETRIEVED_FROM_DATABASE',
          tourismLicense: 'RETRIEVED_FROM_DATABASE',
          professionalFees: 'RETRIEVED_FROM_DATABASE',
          total: 'RETRIEVED_FROM_DATABASE',
        };
      default:
        return {
          environmentalPermit: 'RETRIEVED_FROM_DATABASE',
          buildingPermits: 'RETRIEVED_FROM_DATABASE',
          tourismLicense: 'RETRIEVED_FROM_DATABASE',
          professionalFees: 'RETRIEVED_FROM_DATABASE',
          total: 'RETRIEVED_FROM_DATABASE',
        };
    }
  }

  private getWarnings(intent: any): string[] {
    const warnings = [
      '⚠️ NEVER use nominee structure - 0/140 cases won by foreigners (MA 3020 K/Pdt/2014)',
      '⚠️ Environmental permit MUST be obtained BEFORE construction starts',
      '⚠️ SLF mandatory before business can operate - no exceptions',
      '⚠️ Pondok Wisata limited to 5 rooms - exceeding requires full hotel license',
    ];

    if (intent.hasNominee) {
      warnings.unshift(
        '🚨 CLIENT CONSIDERING NOMINEE - STRONGLY ADVISE AGAINST (property will be seized, money lost)'
      );
    }

    return warnings;
  }
}
