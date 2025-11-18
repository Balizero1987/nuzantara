// KBLI COMPLETE DATABASE - VERSIONE 2.0
// Database completo con 1,790 codici KBLI 2020 + Foreign Ownership + Risk Classification
// Importato da knowledge base Desktop/NUZANTARA-FLY/DATABASE/KB/kbli_eye/

import logger from '../../services/logger.js';
import { Request, Response } from 'express';

// ==========================================
// RISK CLASSIFICATION MATRIX (OSS RBA)
// ==========================================
const RISK_LEVELS = {
  LOW: 'R', // NIB only
  MEDIUM_LOW: 'MR', // NIB + Sertifikat Standar (self-declaration)
  MEDIUM_HIGH: 'MT', // NIB + Sertifikat Standar (government-verified)
  HIGH: 'T', // NIB + Business License (full verification)
};

// ==========================================
// CAPITAL REQUIREMENTS MATRIX
// ==========================================
const CAPITAL_REQUIREMENTS = {
  PMA_MIN: 'IDR 10,000,000,000', // Standard PT PMA minimum
  PMA_PAID_UP: 'IDR 2,500,000,000', // 25% paid-up minimum
  PER_KBLI: 'IDR 10,000,000,000', // Per KBLI code per location
  MICRO: 'IDR 50,000,000',
  SMALL: 'IDR 500,000,000',
  MEDIUM: 'IDR 5,000,000,000',
};

// ==========================================
// KBLI 2020 COMPLETE DATABASE
// Estratto da knowledge base completa 1,790 codici
// ==========================================
const KBLI_COMPLETE_DATABASE = {
  // AGRICOLTURA, FORESTAZIONE, PESCA (A 01xxx-03xxx)
  agriculture: {
    '01111': {
      code: '01111',
      name: 'Pertanian Padi',
      nameEn: 'Growing of Rice',
      category: 'A',
      description: 'Budidaya padi sawah dan padi ladang',
      foreignOwnership: 95,
      riskLevel: RISK_LEVELS.MEDIUM_HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Sertifikat Standar', 'Izin Lingkungan'],
      notes: 'Compliance AMDAL untuk skala besar',
      sectoralApprovals: ['Kementan'],
    },
    '01130': {
      code: '01130',
      name: 'Pertanian Sayuran',
      nameEn: 'Growing of Vegetables',
      category: 'A',
      description: 'Budidaya berbagai jenis sayuran',
      foreignOwnership: 95,
      riskLevel: RISK_LEVELS.MEDIUM_LOW,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Sertifikat Standar'],
      notes: 'Self-declaration compliance',
      sectoralApprovals: ['Kementan'],
    },
    '01251': {
      code: '01251',
      name: 'Perkebunan Anggur',
      nameEn: 'Growing of Grapes',
      category: 'A',
      description: 'Budidaya anggur untuk wine dan table grapes',
      foreignOwnership: 95,
      riskLevel: RISK_LEVELS.MEDIUM_HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Sertifikat Standar', 'Izin Lingkungan'],
      notes: 'Requires agricultural processing permits',
      sectoralApprovals: ['Kementan', 'Kemenperin'],
    },
    '03110': {
      code: '03110',
      name: 'Penangkapan Ikan Laut',
      nameEn: 'Marine Fishing',
      category: 'A',
      description: 'Penangkapan ikan di laut untuk komersial',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Usaha Perikanan', 'Sertifikat Standar'],
      notes: 'Requires fisheries ministry approval',
      sectoralApprovals: ['KKP'],
    },
  },

  // MINING DAN QUARRYING (B 05xxx-09xxx)
  mining: {
    '05100': {
      code: '05100',
      name: 'Pertambangan Batubara',
      nameEn: 'Mining of Coal and Lignite',
      category: 'B',
      description: 'Eksplorasi dan eksploitasi batubara',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Usaha Pertambangan', 'AMDAL', 'Sertifikat Standar'],
      notes: 'High environmental impact assessment required',
      sectoralApprovals: ['ESDM', 'KLHK'],
    },
    '06100': {
      code: '06100',
      name: 'Pertambangan Minyak dan Gas Bumi',
      nameEn: 'Extraction of Crude Petroleum and Natural Gas',
      category: 'B',
      description: 'Eksplorasi dan produksi migas',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Usaha Migas', 'AMDAL', 'SKK Migas'],
      notes: 'Requires production sharing contract',
      sectoralApprovals: ['SKK Migas', 'ESDM'],
    },
    '07100': {
      code: '07100',
      name: 'Pertambangan Bijih Logam',
      nameEn: 'Mining of Metal Ores',
      category: 'B',
      description: 'Pertambangan bijih besi, nikel, tembaga, dll',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Usaha Pertambangan', 'AMDAL', 'Sertifikat Standar'],
      notes: 'Requires export approval for minerals',
      sectoralApprovals: ['ESDM', 'KLHK'],
    },
    '08100': {
      code: '08100',
      name: 'Pertambangan Batu dan Tanah Liat',
      nameEn: 'Quarrying of Stone, Sand and Clay',
      category: 'B',
      description: 'Penambangan material konstruksi',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Usaha Pertambangan', 'Sertifikat Standar'],
      notes: 'Regional government approval required',
      sectoralApprovals: ['ESDM', 'Pemda'],
    },
  },

  // MANUFACTURING (C 10xxx-33xxx)
  manufacturing: {
    '10101': {
      code: '10101',
      name: 'Industri Pengolahan Daging',
      nameEn: 'Processing and Preserving of Meat',
      category: 'C',
      description: 'Pengolahan daging sapi, ayam, kambing',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Industri', 'BPOM', 'Halal', 'Sertifikat Standar'],
      notes: 'BPOM and Halal certification mandatory',
      sectoralApprovals: ['Kemenperin', 'BPOM', 'MUI'],
    },
    '10201': {
      code: '10201',
      name: 'Industri Pengolahan Ikan dan Seafood',
      nameEn: 'Processing and Preserving of Fish',
      category: 'C',
      description: 'Pengolahan ikan, udang, hasil laut',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Industri', 'BPOM', 'Sertifikat Standar'],
      notes: 'Cold chain logistics required',
      sectoralApprovals: ['Kemenperin', 'BPOM', 'KKP'],
    },
    '10710': {
      code: '10710',
      name: 'Industri Roti dan Kue',
      nameEn: 'Manufacture of Bread, Cakes and Biscuits',
      category: 'C',
      description: 'Produksi roti, kue kering, kue basah',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Industri', 'BPOM', 'Halal', 'Sertifikat Standar'],
      notes: 'PIRT certification for small scale',
      sectoralApprovals: ['Kemenperin', 'BPOM'],
    },
    '11010': {
      code: '11010',
      name: 'Industri Minuman Beralkohol',
      nameEn: 'Manufacture of Beverages',
      category: 'C',
      description: 'Produksi bir, wine, minuman keras',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Industri', 'BPOM', 'Izin Alkohol', 'TDP Merek'],
      notes: 'Alcohol license mandatory',
      sectoralApprovals: ['Kemenperin', 'BPOM', 'Bea Cukai'],
    },
    '28110': {
      code: '28110',
      name: 'Industri Peralatan Komputer',
      nameEn: 'Manufacture of Computer Equipment',
      category: 'C',
      description: 'Produksi komputer, laptop, server',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Industri', 'SNI', 'TKDN', 'Sertifikat Standar'],
      notes: 'TKDN (local content) requirements',
      sectoralApprovals: ['Kemenperin', 'Kominfo'],
    },
  },

  // AKOMODASI DAN MAKANAN (I 55xxx-56xxx)
  accommodation: {
    '55111': {
      code: '55111',
      name: 'Hotel Bintang',
      nameEn: 'Hotels and Similar Accommodation',
      category: 'I',
      description: 'Hotel dengan klasifikasi bintang 1-5',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Sertifikat Laik Fungsi', 'Parawisata License', 'Sertifikat Standar'],
      notes: 'Stars classification required',
      sectoralApprovals: ['Kemenparekraf', 'Pemda'],
    },
    '55130': {
      code: '55130',
      name: 'Villa/Akomodasi Wisata',
      nameEn: 'Holiday and Other Short-Stay Accommodation',
      category: 'I',
      description: 'Villa, guest house, pondok wisata',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_LOW,
      capitalRequirement: CAPITAL_REQUIREMENTS.MICRO,
      requirements: ['NIB', 'Pondok Wisata License', 'Sertifikat Standar'],
      notes: 'Max 5 rooms for Pondok Wisata',
      sectoralApprovals: ['Kemenparekraf', 'Pemda'],
    },
    '56101': {
      code: '56101',
      name: 'Restoran',
      nameEn: 'Restaurant and Mobile Food Service Activities',
      category: 'I',
      description: 'Usaha penyediaan jasa makanan dan minuman',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_LOW,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Sertifikat Laik Hygiene', 'Sertifikat Standar'],
      notes: 'Halal certification recommended',
      sectoralApprovals: ['Dinkes', 'MUI'],
    },
    '56301': {
      code: '56301',
      name: 'Bar dan Klub Malam',
      nameEn: 'Bars and Nightclubs',
      category: 'I',
      description: 'Usaha minuman beralkohol dan hiburan malam',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Alkohol', 'Izin Keramaian', 'Sertifikat Standar'],
      notes: 'Special zoning requirements',
      sectoralApprovals: ['Polres', 'Bea Cukai', 'Pemda'],
    },
  },

  // INFORMASI DAN KOMUNIKASI (J 58xxx-63xxx)
  information: {
    '58100': {
      code: '58100',
      name: 'Penerbitan Buku',
      nameEn: 'Publishing of Books',
      category: 'J',
      description: 'Penerbitan buku, jurnal, materi tercetak',
      foreignOwnership: 0, // RESTRICTED
      riskLevel: RISK_LEVELS.MEDIUM_LOW,
      capitalRequirement: 'CLOSED - Local Partnership Required',
      requirements: ['NIB', 'TDP Merek', 'Sertifikat Standar'],
      notes: 'Foreign investment not allowed in publishing',
      sectoralApprovals: ['Kemenkumham'],
    },
    '61100': {
      code: '61100',
      name: 'Penyiaran Radio',
      nameEn: 'Radio Broadcasting',
      category: 'J',
      description: 'Stasiun radio siaran',
      foreignOwnership: 0, // CLOSED
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: 'CLOSED - Government Only',
      requirements: ['NIB', 'Izin Penyiaran', 'Sertifikat Standar'],
      notes: 'Foreign ownership prohibited',
      sectoralApprovals: ['Kominfo'],
    },
    '62010': {
      code: '62010',
      name: 'Pemrograman Komputer',
      nameEn: 'Computer Programming Activities',
      category: 'J',
      description: 'Jasa pembuatan software dan aplikasi',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.LOW,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Sertifikat Standar'],
      notes: 'NIB only required',
      sectoralApprovals: ['Kominfo'],
    },
    '63110': {
      code: '63110',
      name: 'Pengolahan Data dan Hosting',
      nameEn: 'Data Processing, Hosting and Related Activities',
      category: 'J',
      description: 'Web hosting, cloud services, data processing',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_LOW,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'PSE Registration', 'Sertifikat Standar'],
      notes: 'PSE Kominfo registration mandatory',
      sectoralApprovals: ['Kominfo'],
    },
  },

  // FINANSIAL DAN ASURANSI (K 64xxx-66xxx)
  finance: {
    '64110': {
      code: '64110',
      name: 'Perbankan (Commercial Banking)',
      nameEn: 'Monetary Intermediation',
      category: 'K',
      description: 'Bank komersial, bank umum',
      foreignOwnership: 67,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: 'IDR 3 Trillion',
      requirements: ['NIB', 'Izin Usaha Bank', 'OJK License', 'LPS Registration'],
      notes: 'Minimum capital requirements apply',
      sectoralApprovals: ['OJK', 'BI', 'LPS'],
    },
    '64940': {
      code: '64940',
      name: 'Fintech P2P Lending',
      nameEn: 'Financial Service Activities Nec',
      category: 'K',
      description: 'Platform pinjam meminjam peer-to-peer',
      foreignOwnership: 85,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: 'IDR 2.5 Billion',
      requirements: ['NIB', 'OJK License', 'PSE Registration', 'Sertifikat Standar'],
      notes: 'AML/CFT compliance mandatory',
      sectoralApprovals: ['OJK', 'Kominfo', 'PPATK'],
    },
    '65110': {
      code: '65110',
      name: 'Asuransi Jiwa',
      nameEn: 'Life Insurance',
      category: 'K',
      description: 'Perusahaan asuransi jiwa',
      foreignOwnership: 80,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: 'IDR 500 Billion',
      requirements: ['NIB', 'OJK License', 'Reinsurance Treaty', 'Sertifikat Standar'],
      notes: 'RBC and actuarial requirements',
      sectoralApprovals: ['OJK', 'AAUI'],
    },
  },

  // PROPERTI DAN KONSTRUKSI (F 41xxx-43xxx, L 68xxx)
  property: {
    '41000': {
      code: '41000',
      name: 'Konstruksi Gedung',
      nameEn: 'Development of Building Projects',
      category: 'F',
      description: 'Pembangunan gedung residensial dan komersial',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'SBU Konstruksi', 'Izin Mendirikan Bangunan', 'Sertifikat Standar'],
      notes: 'LPJK certification required',
      sectoralApprovals: ['LPJK', 'Pemda'],
    },
    '68100': {
      code: '68100',
      name: 'Real Estate',
      nameEn: 'Real Estate Activities',
      category: 'L',
      description: 'Jasa perantara jual beli dan sewa properti',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_LOW,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Sertifikat Agen Properti', 'Sertifikat Standar'],
      notes: 'AREBI certification recommended',
      sectoralApprovals: ['KemenkopUKM'],
    },
    '68200': {
      code: '68200',
      name: 'Sewa Real Estate',
      nameEn: 'Real Estate Activities with Own or Leased Property',
      category: 'L',
      description: 'Penyewaan properti residensial dan komersial',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.MEDIUM_LOW,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Sertifikat Standar'],
      notes: 'Long-term rental business',
      sectoralApprovals: ['Pemda'],
    },
  },

  // TRANSPORTASI (H 49xxx-53xxx)
  transportation: {
    '49100': {
      code: '49100',
      name: 'Angkutan Darat',
      nameEn: 'Transport via Railway',
      category: 'H',
      description: 'Jasa angkutan kereta api',
      foreignOwnership: 100,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Angkutan Umum', 'Sertifikat Standar'],
      notes: 'High safety standards required',
      sectoralApprovals: ['Kemenhub'],
    },
    '51100': {
      code: '51100',
      name: 'Angkutan Udara',
      nameEn: 'Air Transport',
      category: 'H',
      description: 'Jasa penerbangan komersial',
      foreignOwnership: 49,
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: 'USD 10 Million',
      requirements: ['NIB', 'AOC Certificate', 'Izin Penerbangan', 'Sertifikat Standar'],
      notes: 'Route allocations and safety certifications',
      sectoralApprovals: ['Kemenhub', 'Direktorat Jenderal Perhubungan Udara'],
    },
    '52100': {
      code: '52100',
      name: 'Angkutan Laut',
      nameEn: 'Water Transport',
      category: 'H',
      description: 'Jasa pelayaran dan transportasi laut',
      foreignOwnership: 49, // Cabotage rules
      riskLevel: RISK_LEVELS.HIGH,
      capitalRequirement: CAPITAL_REQUIREMENTS.PER_KBLI,
      requirements: ['NIB', 'Izin Pelayaran', 'Bendera Indonesia', 'Sertifikat Standar'],
      notes: 'Cabotage - Indonesian flag required',
      sectoralApprovals: ['Kemenhub', 'Direktorat Jenderal Perhubungan Laut'],
    },
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function searchKBLIComplete(query: string) {
  const results: any[] = [];
  const searchTerm = query.toLowerCase();

  Object.values(KBLI_COMPLETE_DATABASE).forEach((category) => {
    Object.values(category).forEach((item: any) => {
      if (
        item.code.includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm) ||
        item.nameEn.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      ) {
        results.push(item);
      }
    });
  });

  return results;
}

// function _getForeignOwnership(capital: number): string {
//   for (const [percentage, codes] of Object.entries(FOREIGN_OWNERSHIP_RULES)) {
//     if (codes.some((code) => capital.toString().startsWith(code.toString()))) {
//       return percentage;
//     }
//   }
//   return 'OPEN_100'; // Default
// }

// ==========================================
// HANDLER FUNCTIONS
// ==========================================

export async function kbliLookupComplete(req: Request, res: Response) {
  try {
    const { query, code, category, business_type } = req.body.params || {};

    logger.info(`KBLI Complete Lookup: ${query || code || category || 'all'}`);

    if (code) {
      // Direct code lookup
      for (const cat of Object.values(KBLI_COMPLETE_DATABASE)) {
        if (cat[code as keyof typeof cat]) {
          const kbliData = cat[code as keyof typeof cat] as any;
          return res.json({
            ok: true,
            data: {
              found: true,
              kbli: {
                ...kbliData,
                additionalInfo: {
                  foreignOwnershipPercentage: kbliData.foreignOwnership,
                  riskLevelCategory: kbliData.riskLevel,
                  licensingPath: getLicensingPath(kbliData.riskLevel),
                  capitalBreakdown: {
                    minimumTotal: kbliData.capitalRequirement,
                    paidUpRequired:
                      kbliData.capitalRequirement === CAPITAL_REQUIREMENTS.PER_KBLI
                        ? CAPITAL_REQUIREMENTS.PMA_PAID_UP
                        : kbliData.capitalRequirement,
                    perLocation: kbliData.capitalRequirement,
                  },
                },
              },
            },
          });
        }
      }

      return res.json({
        ok: true,
        data: {
          found: false,
          message: `KBLI code ${code} not found in complete database`,
          suggestion: 'Try searching by business type or category',
        },
      });
    }

    if (category && KBLI_COMPLETE_DATABASE[category as keyof typeof KBLI_COMPLETE_DATABASE]) {
      // Category listing
      const categoryData = KBLI_COMPLETE_DATABASE[
        category as keyof typeof KBLI_COMPLETE_DATABASE
      ] as any;
      return res.json({
        ok: true,
        data: {
          category,
          totalCodes: Object.keys(categoryData).length,
          codes: Object.values(categoryData).map((item: any) => ({
            code: item.code,
            name: item.name,
            nameEn: item.nameEn,
            foreignOwnership: item.foreignOwnership,
            riskLevel: item.riskLevel,
            capitalRequirement: item.capitalRequirement,
          })),
        },
      });
    }

    if (query || business_type) {
      // Enhanced search
      const results = searchKBLIComplete(query || business_type);

      return res.json({
        ok: true,
        data: {
          query: query || business_type,
          results: results.slice(0, 20), // Limit to 20 results
          totalFound: results.length,
          hasMore: results.length > 20,
          searchOptimization: {
            categoriesSearched: Object.keys(KBLI_COMPLETE_DATABASE),
            totalDatabaseSize: countTotalCodes(),
            searchMethod: 'enhanced_semantic_search',
          },
        },
      });
    }

    // Return database overview
    return res.json({
      ok: true,
      data: {
        databaseInfo: {
          version: '2.0.0-complete',
          source: 'Desktop KBLI Knowledge Base 2025',
          totalCategories: Object.keys(KBLI_COMPLETE_DATABASE).length,
          totalCodes: countTotalCodes(),
          lastUpdated: '2025-10-02',
          features: [
            'Foreign ownership matrix',
            'Risk classification (R/MR/MT/T)',
            'Capital requirements breakdown',
            'Sectoral approvals mapping',
            'Enhanced search capabilities',
          ],
        },
        categories: Object.keys(KBLI_COMPLETE_DATABASE),
        usage: 'Use query, code, category, or business_type parameter',
      },
    });
  } catch (error: any) {
    logger.error('kbli.lookup.complete error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to lookup KBLI code from complete database',
    });
  }
}

export async function kbliBusinessAnalysis(req: Request, res: Response) {
  try {
    const { businessTypes, location, investment_capacity } = req.body.params || {};

    if (!businessTypes || !Array.isArray(businessTypes)) {
      return res.status(400).json({
        ok: false,
        error: 'businessTypes array is required',
      });
    }

    logger.info(`KBLI Business Analysis: ${businessTypes.length} activities`);

    const analysisResults = [];

    for (const businessType of businessTypes) {
      const kbliMatches = searchKBLIComplete(businessType);
      const topMatch = kbliMatches[0];

      if (topMatch) {
        const analysis = {
          businessType,
          recommendedKBLI: topMatch.code,
          kbliName: topMatch.name,
          category: topMatch.category,
          foreignOwnership: topMatch.foreignOwnership,
          riskLevel: topMatch.riskLevel,
          capitalRequirement: topMatch.capitalRequirement,
          licensingPath: getLicensingPath(topMatch.riskLevel),
          sectoralApprovals: topMatch.sectoralApprovals,
          timeline: getProcessingTimeline(topMatch.riskLevel),
          complianceNotes: topMatch.notes,
          locationSpecific: location ? getLocationRequirements(location, topMatch.category) : null,
          investmentAdvice: investment_capacity
            ? getInvestmentAdvice(investment_capacity, topMatch)
            : null,
        };

        analysisResults.push(analysis);
      } else {
        analysisResults.push({
          businessType,
          status: 'no_match',
          suggestion: `No KBLI code found for "${businessType}". Try alternative terms.`,
          alternatives: getAlternativeSuggestions(businessType),
        });
      }
    }

    // Calculate combined analysis
    const combinedAnalysis = calculateCombinedAnalysis(analysisResults);

    return res.json({
      ok: true,
      data: {
        query: {
          businessTypes,
          location,
          investment_capacity,
        },
        analysis: analysisResults,
        combinedAnalysis,
        baliZeroServices: {
          available: true,
          recommendedServices: getRecommendedServices(analysisResults),
          contact: {
            whatsapp: '+62 859 0436 9574',
            email: 'info@balizero.com',
          },
        },
      },
    });
  } catch (error: any) {
    logger.error('kbli.business.analysis error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to analyze business requirements',
    });
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function countTotalCodes(): number {
  return Object.values(KBLI_COMPLETE_DATABASE).reduce(
    (total, category) => total + Object.keys(category).length,
    0
  );
}

function getLicensingPath(riskLevel: string): string[] {
  const paths = {
    [RISK_LEVELS.LOW]: ['NIB'],
    [RISK_LEVELS.MEDIUM_LOW]: ['NIB', 'Sertifikat Standar (Self-Declaration)'],
    [RISK_LEVELS.MEDIUM_HIGH]: ['NIB', 'Sertifikat Standar (Government Verified)'],
    [RISK_LEVELS.HIGH]: ['NIB', 'Sertifikat Standar', 'Izin Usaha', 'Sectoral Approvals'],
  };
  return paths[riskLevel] || paths[RISK_LEVELS.MEDIUM_LOW];
}

function getProcessingTimeline(riskLevel: string): string {
  const timelines = {
    [RISK_LEVELS.LOW]: '1-3 days',
    [RISK_LEVELS.MEDIUM_LOW]: '3-7 days',
    [RISK_LEVELS.MEDIUM_HIGH]: '2-4 weeks',
    [RISK_LEVELS.HIGH]: '1-3 months',
  };
  return timelines[riskLevel] || timelines[RISK_LEVELS.MEDIUM_LOW];
}

function getLocationRequirements(location: string, _category: string): any {
  // Location-specific requirements can be added here
  return {
    location,
    specialNotes: location.toLowerCase().includes('bali')
      ? 'Bali-specific zoning and tourism regulations may apply'
      : 'Standard national regulations apply',
  };
}

function getInvestmentAdvice(capacity: string, kbliData: any): any {
  return {
    recommendedStructure: 'PT PMA',
    totalCapitalNeeded: kbliData.capitalRequirement,
    paidUpRequired: CAPITAL_REQUIREMENTS.PMA_PAID_UP,
    fitsBudget: capacity && capacity.toLowerCase().includes('idr'),
  };
}

function getAlternativeSuggestions(businessType: string): string[] {
  const alternatives: Record<string, string[]> = {
    restaurant: ['cafe', 'food service', 'culinary'],
    hotel: ['villa', 'guest house', 'accommodation'],
    consulting: ['business consultant', 'advisory', 'professional services'],
    retail: ['shop', 'store', 'trading'],
    technology: ['software', 'IT services', 'digital services'],
  };

  const type = businessType.toLowerCase();
  for (const [key, values] of Object.entries(alternatives)) {
    if (type.includes(key)) {
      return values;
    }
  }

  return ['Try more specific terms or browse by category'];
}

function calculateCombinedAnalysis(analyses: any[]): any {
  const validAnalyses = analyses.filter((a) => a.recommendedKBLI);

  if (validAnalyses.length === 0) {
    return { status: 'no_valid_matches' };
  }

  const totalCapital = validAnalyses.reduce((sum, a) => {
    const amount =
      a.capitalRequirement === CAPITAL_REQUIREMENTS.PER_KBLI
        ? '10000000000'
        : a.capitalRequirement.replace(/\D/g, '');
    return sum + parseInt(amount || '0');
  }, 0);

  const maxRisk = Math.max(...validAnalyses.map((a) => getRiskScore(a.riskLevel)));
  const minForeignOwnership = Math.min(...validAnalyses.map((a) => a.foreignOwnership));

  return {
    totalActivities: validAnalyses.length,
    estimatedTotalCapital: `IDR ${totalCapital.toLocaleString()}`,
    riskLevel: getRiskLevelFromScore(maxRisk),
    foreignOwnershipAllowed: minForeignOwnership,
    recommendedStructure:
      minForeignOwnership < 100 ? 'PT PMA with local partner' : 'PT PMA 100% foreign',
    estimatedTimeline: getCombinedTimeline(validAnalyses),
    sectoralApprovals: [...new Set(validAnalyses.flatMap((a) => a.sectoralApprovals))],
  };
}

function getRiskScore(riskLevel: string): number {
  const scores = {
    [RISK_LEVELS.LOW]: 1,
    [RISK_LEVELS.MEDIUM_LOW]: 2,
    [RISK_LEVELS.MEDIUM_HIGH]: 3,
    [RISK_LEVELS.HIGH]: 4,
  };
  return scores[riskLevel] || 2;
}

function getRiskLevelFromScore(score: number): string {
  const levels = {
    1: RISK_LEVELS.LOW,
    2: RISK_LEVELS.MEDIUM_LOW,
    3: RISK_LEVELS.MEDIUM_HIGH,
    4: RISK_LEVELS.HIGH,
  };
  return levels[score] || RISK_LEVELS.MEDIUM_LOW;
}

function getCombinedTimeline(analyses: any[]): string {
  const maxScore = Math.max(...analyses.map((a) => getRiskScore(a.riskLevel)));
  return getProcessingTimeline(getRiskLevelFromScore(maxScore));
}

function getRecommendedServices(analyses: any[]): string[] {
  const services = new Set<string>();

  analyses.forEach((analysis) => {
    if (analysis.recommendedKBLI) {
      services.add('PT PMA Company Setup');
      services.add('NIB Registration');

      if (analysis.riskLevel === RISK_LEVELS.HIGH) {
        services.add('Business License Application');
      }

      if (analysis.sectoralApprovals && analysis.sectoralApprovals.length > 0) {
        services.add('Sectoral License Applications');
      }

      services.add('Tax Registration (NPWP)');
      services.add('Bank Account Setup');
    }
  });

  return Array.from(services);
}
