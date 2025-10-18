// @ts-nocheck
/**
 * LEGAL ARCHITECT - BALI ZERO 2025
 * Expert Indonesian Legal Counsel & Real Estate Specialist
 *
 * Sources:
 * - Indonesian Civil Code (KUHPerdata) 1847
 * - Indonesian Penal Code (KUHP) 1918 + KUHP Baru 2023
 * - UUPA 1960 (Agrarian Law)
 * - Supreme Court MA 3020 K/Pdt/2014 (Landmark nominee case)
 * - K3NI Investigation 2023-2024
 * - Constitutional Court 69/PUU-XIII/2015 (Post-nuptial)
 */

export class LegalArchitect {
  private knowledgeBase = {
    // ========================
    // CIVIL CODE (KUHPerdata)
    // ========================
    civilCode: {
      origin: 'Dutch Civil Code (Burgerlijk Wetboek) 1847',
      entryForce: '1 May 1848',
      status: 'Active (with amendments)',

      books: {
        book2: {
          title: 'THINGS (Property & Real Rights)',
          articles: '535-722',
          keyForRealEstate: 'Art. 570-645 - Property, mortgages, servitudes'
        },
        book3: {
          title: 'OBLIGATIONS (Contracts)',
          articles: '1233-1864',
          keyArticles: {
            'Art. 1320': 'Contract validity - 4 requirements (lawful cause CRITICAL)',
            'Art. 1335-1337': 'Unlawful cause = nullity'
          }
        }
      }
    },

    // ========================
    // AGRARIAN LAW (UUPA 1960)
    // ========================
    agrarianLaw: {
      name: 'UU No. 5/1960 - UUPA',
      date: '24 September 1960',

      criticalArticles: {
        article21: {
          text: 'Only Indonesian citizens can have Hak Milik',
          interpretation: 'ABSOLUTE BAN - no exceptions for foreigners'
        },
        article26: {
          subsection1: 'Sale to foreigner = VOID by law',
          subsection2: {
            text: 'Rights EXTINGUISH, land RETURNS TO STATE',
            critical: '⚠️ Money paid by foreigner NOT RETURNED (Supreme Court confirmed)'
          }
        }
      },

      landRights: {
        hakMilik: {
          name: 'Hak Milik (Freehold)',
          holders: 'Indonesian citizens ONLY',
          certificate: 'SHM - RED',
          foreignersAllowed: false
        },
        hakGunaBangunan: {
          name: 'HGB (Right to Build)',
          holders: 'Indonesian citizens + PT PMA',
          duration: '30+20+30 years (max 80)',
          certificate: 'SHGB - YELLOW',
          foreignersAllowed: 'Via PT PMA only'
        },
        hakPakai: {
          name: 'Hak Pakai (Right to Use)',
          holders: 'Indonesian citizens + Foreigners with KITAS/KITAP',
          duration: '25-30+20+30 years (max 70-80)',
          certificate: 'SHP - BLUE',
          foreignersAllowed: 'Yes (with valid visa)',
          minimumValue: {
            jakarta: 'USD 195,000-650,000',
            bali: 'USD 150,000+',
            canggu: 'USD 150,000+'
          }
        },
        hakSewa: {
          name: 'Hak Sewa (Leasehold)',
          holders: 'Anyone (no visa required)',
          duration: 'Negotiable (25-30 years typical)',
          foreignersAllowed: 'Yes'
        }
      }
    },

    // ===================================
    // LANDMARK CASE LAW
    // ===================================
    caseLaw: {
      ma3020_2014: {
        caseNumber: 'MA 3020 K/Pdt/2014',
        court: 'Supreme Court',
        subject: 'Nominee Agreement - ILLEGAL',

        facts: [
          '2010-2011: Foreigner buys land Bali via Indonesian nominee',
          'Nominee betrays: sells to third party',
          'Foreigner sues both'
        ],

        decision: {
          supremeCourt: 'FOREIGNER HAS NO RIGHTS',
          ratioDecidendi: 'Nominee agreement violates Art. 21 UUPA + Art. 1320 KUHPerdata (unlawful cause)',

          consequences: [
            '❌ Foreigner loses land',
            '❌ Foreigner loses money paid',
            '❌ No compensation',
            '✅ Nominee keeps money (even if betrayed)',
            '✅ Third party buyer keeps land'
          ]
        },

        impact: {
          precedent: 'De facto binding on all lower courts',
          outcomeNomineeDisputes: '0/140 cases won by foreigners (2014-2025)',
          lossRate: '100%'
        }
      },

      sema10_2020: {
        type: 'Supreme Court Circular No. 10/2020',
        title: 'Legal Owner vs Beneficial Owner',

        principles: [
          'Legal owner (name on certificate) = ONLY recognized',
          'Beneficial owner = NO RIGHTS (even if paid fully)',
          'Legal owner can sell without beneficial owner consent',
          'Good faith buyer protected'
        ],

        typicalOutcome: [
          'Foreigner pays USD 500K, Indonesian name on certificate',
          'Indonesian sells to third party USD 600K',
          'Court: Foreigner not owner, no rights',
          'Foreigner loses villa + USD 500K',
          'Indonesian keeps USD 1.1M total'
        ]
      },

      constitutionalCourt2016: {
        caseNumber: '69/PUU-XIII/2015',
        date: 'October 2016',
        subject: 'Post-Nuptial Agreements',

        ruling: 'Prenuptial-only requirement UNCONSTITUTIONAL',

        newRegime: [
          '✅ Prenuptial still valid (before marriage)',
          '✅ POST-NUPTIAL now legal (during marriage)',
          '✅ Indonesian spouse can buy Hak Milik after post-nuptial'
        ],

        impact: '+300% post-nuptial agreements (2016-2025), mainly Bali mixed couples'
      }
    },

    // ===================================
    // K3NI INVESTIGATION 2023-2024
    // ===================================
    k3niData: {
      name: 'K3NI - Indonesian Nominee Crisis Working Group',
      period: '2022-2024',

      findings: {
        illegalPlots: 10500,
        valueUSD: 10.4e9, // 10.4 billion
        villas: 7500,
        baliPercentage: 65,
        baliPlots: 6825
      },

      enforcement2023: {
        certificatesRevoked: {
          bali: 120,
          jakarta: 40,
          lombok: 25,
          total: 185
        },
        deportations: 163, // Jan-Jun 2023
        criminalProsecutions: 55
      },

      statistics: {
        activeCases: 140,
        foreignersWon: 0,
        averageLoss: 'USD 280,000-350,000',
        recoveryRate: '0-5%'
      }
    },

    // ===================================
    // FRAUD CASES
    // ===================================
    fraudCases: {
      julianPetroulas2024: {
        name: 'Julian Petroulas (Australian)',
        claim: 'Bought 1.1 hectares Canggu',
        discovery: 'Entry with VOA (tourism only)',
        result: 'PERMANENT BAN Indonesia (21 Nov 2024)',
        loss: 'USD 6.2 million claimed'
      },

      nightmareParadise2017: {
        victim: 'Western expat',
        paid: 'USD 250,000 + USD 50,000 extensions',
        nomineeBetrayal: 'Sold villa USD 320,000, disappeared',
        legalAttempts: [
          'Civil suit: rejected (18 months, USD 15K cost)',
          'Criminal: not prosecuted',
          'Action vs buyer: rejected'
        ],
        totalLoss: 'USD 315,000',
        result: 'Zero recovery, left Indonesia'
      },

      northBali150k: {
        victim: 'European',
        scam: 'Fake certificate, corrupt PPAT',
        paid: 'EUR 150,000',
        discovery: 'BPN verification: certificate FAKE',
        northBaliRisk: '3x fraud rate vs South Bali'
      }
    },

    // ===================================
    // RECOMMENDATIONS
    // ===================================
    recommendations: {
      nominee: {
        status: '🚫 100% ILLEGAL',
        lossRate: '100% (0/140 won)',
        art26Consequence: 'Money NOT returned',
        baliZeroAdvice: 'NEVER. ZERO EXCEPTIONS. Legal alternatives exist for every budget.'
      },

      hakPakai: {
        status: '✅ LEGAL for foreigners with KITAS/KITAP',
        when: 'Single villa, personal use, USD 150K-1M',
        pros: ['Direct ownership', 'Full control', 'Economic'],
        cons: ['Visa dependency', 'Limited exit', 'Not commercial'],
        baliZeroAdvice: 'Ideal for single villa. Ensure 30 years + clear extensions.'
      },

      ptPma: {
        status: '✅ 100% LEGAL (gold standard)',
        when: 'Multiple properties, rental business, or investment ≥ IDR 10B',
        capital2025: {
          old: 'IDR 2.5 billion minimum capital (pre-2024)',
          new: 'IDR 10 billion minimum (effective 2024/2025)',
          clarification: '⚠️ TO VERIFY: 10B capital OR 10B total investment plan?',
          usdEquivalent: 'USD ~650,000 at 15,400 IDR/USD'
        },
        pros: ['100% legal', 'HGB possible', 'Business operation', 'Exit strategy', 'Financing'],
        cons: ['High capital requirement (4x increase)', 'Annual compliance', 'Complexity'],
        baliZeroAdvice: 'Recommended for serious investment. Higher capital requirement but total protection.'
      },

      leasehold: {
        status: '✅ LEGAL (contractual)',
        when: 'Limited budget, no visa, short-term',
        pros: ['No visa needed', 'Lower cost', 'Flexible'],
        cons: ['Not ownership', 'Renewal risk', 'Difficult financing'],
        baliZeroAdvice: 'Acceptable temporary. CRITICAL: Expert lawyer, clear extensions, BPN registration.'
      },

      marriedCouples: {
        prenuptial: 'BEFORE marriage - complete asset separation',
        postnuptial: 'AFTER marriage - legal since 2016 Constitutional Court',
        cost: 'USD 1,000-3,000',
        timeline: '1-7 months',
        critical: 'DO BEFORE buying property to avoid Art. 21 UUPA violation'
      }
    },

    // ===================================
    // DUE DILIGENCE
    // ===================================
    dueDiligence: {
      standardPackage: {
        components: [
          'Legal Opinion (USD 800-1,500) - Lawyer, BPN verification, title search',
          'Survey (USD 300-600) - Authorized surveyor, boundaries, area',
          'Seller Background (USD 200-400) - Identity, history, litigation',
          'Tax Verification (USD 100-200) - SPPT PBB, payment history',
          'Planning Check (USD 200-400) - Zoning, permits, RTRW'
        ],
        totalCost: 'USD 1,600-3,100',
        timeline: '3-6 weeks',
        roi: '15-20% deals abort (saves USD 200K-1M+)'
      },

      redFlagsAbort: [
        '❌ Seller not meetable',
        '❌ Certificate not verifiable BPN',
        '❌ PPAT not on IPPAT list',
        '❌ Price >30% below market',
        '❌ Pressure decision <1 week',
        '❌ Suggests nominee',
        '❌ Cash only',
        '❌ Resists due diligence'
      ]
    }
  };

  /**
   * Analyze legal situation
   */
  async analyze(intent: any): Promise<any> {
    const category = this.detectCategory(intent);
    const risk = this.assessRisk(category);
    const recommendation = this.getRecommendation(category);

    return {
      category,
      riskAssessment: risk,
      recommendation,
      relevantLaw: this.getRelevantLaw(category),
      caseLaw: this.getRelevantCaseLaw(category),
      confidence: 0.95,
      contact: {
        company: 'Bali Zero Legal',
        whatsapp: '+62 859 0436 9574',
        email: 'info@balizero.com'
      }
    };
  }

  private detectCategory(intent: any): string {
    const text = (intent.text || '').toLowerCase();

    if (text.includes('nominee')) return 'nominee_risk';
    if (text.includes('hak milik')) return 'hak_milik';
    if (text.includes('hak pakai')) return 'hak_pakai';
    if (text.includes('pt pma')) return 'pt_pma';
    if (text.includes('lease')) return 'leasehold';
    if (text.includes('married') || text.includes('spouse')) return 'marriage';
    if (text.includes('fraud') || text.includes('scam')) return 'fraud';

    return 'general_legal';
  }

  private assessRisk(category: string): any {
    const risks = {
      nominee_risk: {
        level: 'CRITICAL - 100% LOSS GUARANTEED',
        illegal: '100% (Art. 21 & 26 UUPA)',
        lossRate: '100% (0/140 won)',
        consequence: 'Land to State, money NOT returned',
        action: 'ABORT IMMEDIATELY'
      },
      hak_pakai: {
        level: 'LOW (if done correctly)',
        legal: 'Yes (with KITAS/KITAP)',
        risks: ['Exit limited', 'Visa dependency']
      },
      pt_pma: {
        level: 'VERY LOW (gold standard)',
        legal: '100%',
        risks: ['High cost', 'Complexity']
      },
      marriage: {
        level: 'MEDIUM (without prenuptial/postnuptial)',
        risk: 'Foreign spouse 50% Hak Milik = Art. 21 violated',
        solution: 'Prenuptial or postnuptial'
      },
      fraud: {
        level: 'HIGH (recovery difficult)',
        prosecution: '20% chance',
        recovery: '5% partial',
        totalLoss: '65-75% probability'
      }
    };

    return risks[category] || { level: 'UNKNOWN' };
  }

  private getRecommendation(category: string): any {
    return this.knowledgeBase.recommendations[category] ||
           this.knowledgeBase.recommendations.ptPma;
  }

  private getRelevantLaw(category: string): any {
    if (category === 'nominee_risk') {
      return [
        this.knowledgeBase.agrarianLaw.criticalArticles.article21,
        this.knowledgeBase.agrarianLaw.criticalArticles.article26,
        { code: 'KUHPerdata Art. 1320', text: 'Lawful cause required' }
      ];
    }

    return [{ law: 'UUPA 1960', article: 'Agrarian Law' }];
  }

  private getRelevantCaseLaw(category: string): any {
    if (category === 'nominee_risk' || category === 'fraud') {
      return [
        this.knowledgeBase.caseLaw.ma3020_2014,
        this.knowledgeBase.caseLaw.sema10_2020
      ];
    }

    if (category === 'marriage') {
      return [this.knowledgeBase.caseLaw.constitutionalCourt2016];
    }

    return [];
  }

  /**
   * Get K3NI data
   */
  getK3NIData(): any {
    return this.knowledgeBase.k3niData;
  }

  /**
   * Get fraud cases
   */
  getFraudCases(): any {
    return this.knowledgeBase.fraudCases;
  }

  /**
   * Get due diligence protocol
   */
  getDueDiligence(): any {
    return this.knowledgeBase.dueDiligence;
  }
}
