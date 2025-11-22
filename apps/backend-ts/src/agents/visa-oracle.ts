// @ts-nocheck
/**
 * VISA ORACLE - BALI ZERO 2025
 * Official Immigration Services Data
 * Source: PT. BALI NOL IMPERSARIAT Price List 2025
 */

export class VisaOracle {
  private knowledgeBase = {
    // SINGLE ENTRY VISAS
    singleEntry: {
      C1: {
        code: 'C1',
        name: 'Tourism Visa',
        nameId: 'Visa Turis',
        duration: '60 days',
        extensions: '2x60 days (max 180 days total)',
        price: 'RETRIEVED_FROM_DATABASE',
        description:
          'Tourism, visiting friends/family, meetings, incentives, conventions, exhibitions',
        extendable: true,
        multipleEntry: false,
      },
      C2: {
        code: 'C2',
        name: 'Business Visa',
        nameId: 'Visa Bisnis',
        duration: '60 days',
        extensions: '2x60 days (max 180 days total)',
        price: 'RETRIEVED_FROM_DATABASE',
        description: 'Business activities, meetings, shopping, checking goods at office/factory',
        extendable: true,
        multipleEntry: false,
      },
      C7: {
        code: 'C7',
        name: 'Professional Event Visa',
        nameId: 'Visa Profesional',
        duration: '30 days',
        extensions: 'Not extendable',
        price: {
          initial: 'RETRIEVED_FROM_DATABASE',
        },
        description: 'Chefs, yoga instructors, bartenders, photographers invited for events',
        extendable: false,
        multipleEntry: false,
      },
      C7AB: {
        code: 'C7 A&B',
        name: 'Music Performance Visa',
        nameId: 'Visa Pertunjukan Musik',
        duration: '30 days',
        extensions: 'Not extendable',
        price: {
          initial: 'RETRIEVED_FROM_DATABASE',
        },
        description: 'Musical performance activities',
        extendable: false,
        multipleEntry: false,
      },
      C22A: {
        code: 'C22A',
        name: 'Academic Internship Visa',
        nameId: 'Visa Magang Akademik',
        duration: '60 or 180 days',
        extensions: 'Not extendable',
        price: {
          '60days': 'RETRIEVED_FROM_DATABASE',
          '180days': 'RETRIEVED_FROM_DATABASE',
        },
        description: 'Internship for academic requirements from overseas education',
        extendable: false,
        multipleEntry: false,
      },
      C22B: {
        code: 'C22B',
        name: 'Company Internship Visa',
        nameId: 'Visa Magang Perusahaan',
        duration: '60 or 180 days',
        extensions: 'Not extendable',
        price: {
          '60days': 'RETRIEVED_FROM_DATABASE',
          '180days': 'RETRIEVED_FROM_DATABASE',
        },
        description: 'Internship for skill development within company/office/workplace',
        extendable: false,
        multipleEntry: false,
      },
    },

    // MULTIPLE ENTRY VISAS
    multipleEntry: {
      D1: {
        code: 'D1',
        name: 'Multiple Entry Tourism',
        nameId: 'Visa Turis Multiple Entry',
        duration: '60 days per visit',
        extensions: '2x60 days per visit (max 180 days)',
        validity: '1 or 2 years',
        price: {
          '1year': 'RETRIEVED_FROM_DATABASE',
          '2years': 'RETRIEVED_FROM_DATABASE',
        },
        description: 'Meetings, incentives, conventions, exhibitions, tourism, visiting family',
        multipleEntry: true,
      },
      D2: {
        code: 'D2',
        name: 'Multiple Entry Business',
        nameId: 'Visa Bisnis Multiple Entry',
        duration: '60 days per visit',
        extensions: '2x60 days per visit (max 180 days)',
        validity: '1 or 2 years',
        price: {
          '1year': 'RETRIEVED_FROM_DATABASE',
          '2years': 'RETRIEVED_FROM_DATABASE',
        },
        description: 'Business activities, meetings, shopping, checking goods',
        multipleEntry: true,
      },
      D12: {
        code: 'D12',
        name: 'Pre-Investment Visa',
        nameId: 'Visa Pra-Investasi',
        duration: 'Up to 180 days per visit',
        extensions: '1 extension possible',
        validity: '1 or 2 years',
        price: {
          '1year': 'RETRIEVED_FROM_DATABASE',
          '2years': 'RETRIEVED_FROM_DATABASE',
          extension: 'RETRIEVED_FROM_DATABASE',
        },
        description:
          'Investigating business opportunities: site visits, field surveys, feasibility studies',
        multipleEntry: true,
      },
    },

    // KITAS (Limited Stay Permit)
    kitas: {
      E23_FREELANCE: {
        code: 'E23 Freelance',
        name: 'Freelance KITAS / Impresario',
        nameId: 'KITAS Freelance',
        duration: '6 months',
        price: {
          offshore: 'RETRIEVED_FROM_DATABASE',
          onshore: 'RETRIEVED_FROM_DATABASE',
        },
        description: 'Work permit (IMTA) without specific employer - DJs, marketing managers, etc.',
        requirements: ['Working permit (IMTA)'],
        multipleEntry: true,
      },
      E23_WORKING: {
        code: 'E23 Working',
        name: 'Working KITAS',
        nameId: 'KITAS Kerja',
        duration: '1 year',
        price: {
          offshore: 'RETRIEVED_FROM_DATABASE',
          onshore: 'RETRIEVED_FROM_DATABASE',
          extension: 'RETRIEVED_FROM_DATABASE',
        },
        description: 'Work for Indonesian company with one type of work',
        requirements: ['Sponsoring company', 'Work permit'],
        multipleEntry: true,
      },
      E28A: {
        code: 'E28A',
        name: 'Investor KITAS',
        nameId: 'KITAS Investor',
        duration: '2 years',
        price: {
          offshore: 'RETRIEVED_FROM_DATABASE',
          onshore: 'RETRIEVED_FROM_DATABASE',
          extension: 'RETRIEVED_FROM_DATABASE',
        },
        description: 'Foreign investors with PT PMA (foreign investment company)',
        requirements: ['PT PMA ownership', 'Investment proof', 'BKPM approval'],
        multipleEntry: true,
        bestFor: 'Business owners, investors in Indonesia',
      },
      E31A: {
        code: 'E31A',
        name: 'Spouse KITAS',
        nameId: 'KITAS Suami/Istri',
        duration: '1 or 2 years',
        price: {
          '1year': {
            offshore: 'RETRIEVED_FROM_DATABASE',
            onshore: 'RETRIEVED_FROM_DATABASE',
            extension: 'RETRIEVED_FROM_DATABASE',
          },
          '2years': {
            offshore: 'RETRIEVED_FROM_DATABASE',
            onshore: 'RETRIEVED_FROM_DATABASE',
            extension: 'RETRIEVED_FROM_DATABASE',
          },
        },
        description: 'Married to Indonesian citizen',
        multipleEntry: true,
      },
      E31B_E31E: {
        code: 'E31B & E31E',
        name: 'Dependent KITAS',
        nameId: 'KITAS Tanggungan',
        duration: '1 or 2 years',
        price: {
          '1year': {
            offshore: 'RETRIEVED_FROM_DATABASE',
            onshore: 'RETRIEVED_FROM_DATABASE',
            extension: 'RETRIEVED_FROM_DATABASE',
          },
          '2years': {
            offshore: 'RETRIEVED_FROM_DATABASE',
            onshore: 'RETRIEVED_FROM_DATABASE',
            extension: 'RETRIEVED_FROM_DATABASE',
          },
        },
        description:
          'Dependent family members of KITAS holders (Golden Visa, Working, Investor, KITAP)',
        multipleEntry: true,
      },
      E33F: {
        code: 'E33F',
        name: 'Retirement KITAS',
        nameId: 'KITAS Pensiun',
        duration: '1 year',
        price: {
          offshore: 'RETRIEVED_FROM_DATABASE',
          onshore: 'RETRIEVED_FROM_DATABASE',
          extension: 'RETRIEVED_FROM_DATABASE',
        },
        description: 'For foreign nationals aged 55+ who want to retire in Indonesia',
        requirements: ['Age 55+', 'Financial proof'],
        multipleEntry: true,
      },
      E33G: {
        code: 'E33G',
        name: 'Remote Worker KITAS (Digital Nomad)',
        nameId: 'KITAS Remote Worker',
        duration: '1 year',
        price: {
          offshore: 'RETRIEVED_FROM_DATABASE',
          onshore: 'RETRIEVED_FROM_DATABASE',
          extension: 'RETRIEVED_FROM_DATABASE',
        },
        description: 'For remote workers and digital nomads',
        requirements: ['Proof of remote employment', 'Financial proof'],
        multipleEntry: true,
        bestFor: 'Digital nomads, remote workers',
      },
    },

    // KITAP (Permanent Residence Permit)
    kitap: {
      INVESTOR: {
        code: 'Investor KITAP',
        name: 'Investor KITAP',
        nameId: 'KITAP Investor',
        duration: '5 years (renewable indefinitely)',
        price: 'Contact for quote',
        description: 'Minimum 3 years holding shares in Indonesian company',
        requirements: ['3+ years as investor', 'PT PMA ownership'],
      },
      WORKING: {
        code: 'Working KITAP',
        name: 'Working KITAP',
        nameId: 'KITAP Kerja',
        duration: '5 years',
        price: 'Contact for quote',
        description: 'Minimum 3 years as BOD/BOC in Indonesian company under Working KITAS',
        requirements: ['3+ years as BOD/BOC', 'Working KITAS history'],
      },
      FAMILY: {
        code: 'Family KITAP',
        name: 'Family KITAP',
        nameId: 'KITAP Keluarga',
        duration: '5 years (renewable indefinitely)',
        price: 'Contact for quote',
        description: 'Married to Indonesian citizens or children from mixed-nationality marriages',
        requirements: ['Marriage certificate', 'Indonesian spouse'],
      },
      RETIREMENT: {
        code: 'Retirement KITAP',
        name: 'Retirement KITAP',
        nameId: 'KITAP Pensiun',
        duration: '5 years',
        price: 'Contact for quote',
        description: 'Minimum 4 years holding Retirement KITAS',
        requirements: ['4+ years Retirement KITAS'],
      },
    },

    // Common mistakes and tips
    commonMistakes: [
      'Overstaying even 1 day = 'RETRIEVED_FROM_DATABASE'',
      'Working on tourist visa = deportation + blacklist',
      'Wrong visa type for activity = application rejection',
      'Incomplete documents = process restart',
      'Not reporting address within 24h of arrival',
    ],

    insiderTips: [
      'Apply offshore for KITAS - saves 'RETRIEVED_FROM_DATABASE'',
      'Extend visa at least 7 days before expiry',
      'Keep all payment receipts - often requested later',
      'Use professional agent for KITAS applications',
      'D12 visa perfect for exploring business before committing',
      'E33G (Digital Nomad) allows bank account + long-term rent',
    ],

    legalBasis: {
      mainLaw: 'UU No. 6 Tahun 2011 - Immigration Law (as amended by UU 63/2024)',

      officialSources: {
        immigrationDirectorate: 'https://www.imigrasi.go.id/',
        eVisaPortal: 'https://evisa.imigrasi.go.id/',
        itasOnline: 'https://izintinggal-online.imigrasi.go.id/',
        ministry: 'https://kemenimipas.go.id/ (Ministry of Immigration & Correctional Services)',
        regulationsDatabase: 'https://peraturan.bpk.go.id/',
        workPermits: 'https://tka-online.kemnaker.go.id/ (Ministry of Manpower)',
      },

      primaryLaws: [
        {
          law: 'UU No. 6/2011',
          title: 'Immigration Law (Undang-Undang Keimigrasian)',
          url: 'https://www.imigrasi.go.id/uu_imigrasi',
        },
        {
          law: 'UU No. 63/2024',
          title: 'Third Amendment to Immigration Law',
          enacted: '17 October 2024',
          keyChanges: [
            'Firearms for immigration officials',
            'Entry ban: 6mo → 10yr (renewable)',
            'Exit ban: max 6mo + 6mo extension',
            'Re-entry permits match ITAS/ITAP duration',
            'Data sharing: Police + immigration + lodging',
          ],
        },
      ],

      ministerialRegulations2025: [
        {
          regulation: 'Permenimipas No. 3/2025',
          effective: '06 May 2025',
          title: 'Diaspora Visa Framework',
          url: 'https://peraturan.bpk.go.id/Details/316856/permen-imipas-no-3-tahun-2025',
        },
        {
          regulation: 'Permenkumham No. 11/2024',
          effective: '03 May 2024',
          title: 'Visa Amendments + Golden Visa',
          url: 'https://peraturan.bpk.go.id/Details/285156/permenkumham-no-11-tahun-2024',
        },
      ],

      presidentialRegulations: [
        {
          regulation: 'Perpres No. 95/2024',
          signed: '29 Aug 2024',
          title: 'Visa-Free Entry (16-18 countries, 30 days)',
        },
      ],

      regulations: [
        'UU 63/2024 - Third Amendment (17 Oct 2024)',
        'Permenimipas 3/2025 - Diaspora Visa (06 May 2025)',
        'Permenkumham 11/2024 - Visa Amendments (03 May 2024)',
        'Permenkumham 22/2023 - Base Regulation',
        'Perpres 95/2024 - Visa-Free (29 Aug 2024)',
        'UU 13/2003 - Manpower Law (work permits)',
        'Perpres No. 21 Tahun 2016 (Visa-Free)',
        'Permenkumham No. 26 Tahun 2023 (KITAS)',
        'SE Dirjen Imigrasi No. IMI-GR.01.01-0000 Tahun 2024',
      ],

      officialWebsite: 'https://evisa.imigrasi.go.id',

      emergencyContact: {
        hotline: '081-1200-1-221 (24/7)',
        purpose: 'Immigration emergencies, lost KITAS, urgent inquiries',
      },

      // ===== CIRCULARS 2025 (Official) =====
      circulars2025: {
        seIMI417: {
          number: 'SE IMI-417.GR.01.01 Tahun 2025',
          date: '15 May 2025',
          title: 'Penyesuaian Pelayanan Izin Tinggal Keimigrasian',
          translation: 'Adjustment of Immigration Residence Permit Services',

          keyPoints: [
            '📸 FOTO + WAWANCARA OBBLIGATORIA for all KITAS extensions',
            'Must be done within 2 working days after document approval',
            'Applicant domicile MUST match kantor imigrasi wilayah kerja',
            'Electronic OR manual/walk-in submission allowed',
            'Exceptions: elderly, disabled, pregnant/nursing, emergency',
          ],

          objective: [
            'Minimize immigration violations',
            'Map distribution of foreigners by region',
            'Effective administrative monitoring',
          ],

          smartImmigrationGovernance: {
            concept: 'SIG - Smart Immigration Governance',
            integration: 'Combines surveillance INTO service delivery',
            purpose: 'Minimize violations, increase awareness, actual/factual monitoring',
          },

          impact: {
            forClients: [
              '⚠️ MUST appear in person for foto + interview',
              '⚠️ Cannot skip this step (even for extensions)',
              '⚠️ Domicile verification strict',
              '✅ 2-day window after docs approved',
            ],
          },
        },

        seIMI453: {
          number: 'SE IMI-453.GR.01.01 Tahun 2025',
          date: '14 June 2025',
          title: 'Visto C18 - Kunjungan untuk Calon TKA dalam Masa Uji Coba',
          translation: 'Visit Visa for Foreign Worker Candidates in Trial Period',

          keyPoints: [
            'C18 visa valid for maximum 90 days',
            'NOT extendable',
            'PROHIBITED to reuse same sponsor for multiple consecutive C18 requests',
            'Allows ONLY skill assessment, not formal work activities',
            'Objective: Prevent abuse and repeated use for disguised employment',
          ],

          baliZeroAdvice: {
            warning: 'C18 must be used ONLY for highly specialized positions in evaluation phase',
            notSuitableFor: ['Standard operations', 'Medium-term contracts'],
            alternative: 'For actual work: Use E23 Working KITAS instead',
          },
        },
      },

      // ===== 2025 COMPREHENSIVE REGULATIONS =====
      regulations2025Extended: {
        primaryLaw: {
          name: 'UU No. 6/2011 - Immigration Law (as amended)',
          lastAmendment: 'UU No. 63/2024 (Third Amendment)',
          enactmentDate: '17 October 2024',
          effectiveDate: '2025',

          keyChanges2024: [
            '🔫 Firearms authorization for immigration officials during enforcement',
            '🚫 Exit ban: max 6 months + 6 months extension (was indefinite)',
            '⛔ Entry ban: up to 10 years (was 6 months), renewable 10 years each time',
            '🔄 Re-entry permits: same validity as ITAS/ITAP (was shorter)',
            '📊 Data sharing: Police + immigration can require lodging providers to share foreigner data',
          ],

          significance:
            'Stricter enforcement, longer bans, enhanced surveillance - Indonesia tightening immigration control in 2025',
        },

        goldenVisa: {
          regulation: 'Minister of Law & HR Regulation 22/2023 (amended by 11/2024)',
          launchDate: 'June 2023',
          updated: '2024 (Regulation 11/2024)',

          benefits: [
            '5-10 year residence permit',
            'Family included (spouse, children, parents)',
            'Convert to KITAP after 3 years',
            'No work restrictions (if company established)',
            'Simplified immigration procedures',
          ],

          investmentTiers: {
            individualWithoutCompany: {
              type: 'Individual Investor (without company establishment)',
              tiers: [
                {
                  duration: '5 years',
                  investment: 'USD 350,000',
                  options: [
                    'Indonesian government bonds',
                    'Public company shares',
                    'Bank deposits/time deposits',
                  ],
                },
                {
                  duration: '10 years',
                  investment: 'USD 700,000',
                  options: [
                    'Indonesian government bonds',
                    'Public company shares',
                    'Bank deposits/time deposits',
                  ],
                },
              ],
            },
            individualWithCompany: {
              type: 'Individual Investor (establishing company)',
              tiers: [
                {
                  duration: '5 years',
                  investment: 'USD 2.5 million',
                  options: [
                    'Share purchases',
                    'Company establishment',
                    'Other investment activities',
                  ],
                },
                {
                  duration: '10 years',
                  investment: 'USD 5 million',
                  options: [
                    'Share purchases',
                    'Company establishment',
                    'Other investment activities',
                  ],
                },
              ],
            },
            corporate: {
              type: 'Corporate Investors (directors/commissioners)',
              tiers: [
                {
                  duration: '5 years',
                  investment: 'USD 25 million (company investment)',
                  eligibility: 'Directors and commissioners',
                },
                {
                  duration: '10 years',
                  investment: 'USD 50 million (company investment)',
                  eligibility: 'Directors and commissioners',
                },
              ],
            },
          },

          process: [
            'Submit investment proof to BKPM/Ministry of Investment',
            'Obtain investment approval letter',
            'Apply for Golden Visa via evisa.imigrasi.go.id',
            'Upload investment documents + passport + family docs',
            'Immigration review (30-45 business days)',
            'Visa issuance (5 or 10 years)',
          ],
        },

        secondHomeVisa: {
          regulation: 'Minister of Law & HR Regulation 22/2023 (with Regulation 11/2024)',
          launchDate: 'June 2023',

          investmentOptions: [
            {
              type: 'Bank Deposit',
              amount: 'RETRIEVED_FROM_DATABASE',
              requirements: [
                "Maintained in applicant's own name",
                'State-owned Indonesian bank',
                'Frozen for visa duration',
                'Cannot be withdrawn',
              ],
            },
            {
              type: 'Property Investment',
              amount: 'USD 1 million minimum',
              requirements: [
                'Residential properties (flats/apartments)',
                "Must be registered in applicant's name",
                'Proof of ownership required',
              ],
            },
          ],

          duration: '5 or 10 years',
          renewable: 'Yes (if issued for 5 years, can extend once for same duration)',
          familyIncluded: true,
          workRights: 'No (residence only)',
          convertToKITAP: 'After 3 years of residence',
        },

        retirementVisa2025: {
          types: [
            {
              name: 'Standard Retirement KITAS',
              code: 'E33F',
              minimumAge: '55 years',
              duration: '1 year',
              renewable: 'Annually up to 5 years',
            },
            {
              name: 'Silver Hair Visa',
              code: 'E33F (5-year variant)',
              minimumAge: '60 years',
              duration: '5 years',
              renewable: 'Yes',
            },
          ],

          requirements: {
            financial: [
              'Minimum pension: USD 18,000/year (some sources: USD 36,000/year)',
              'OR: Proof of income USD 3,000/month',
              'Bank statements (6 months)',
            ],
            insurance: 'RETRIEVED_FROM_DATABASE',
            accommodation: '1-year lease agreement required',
            age: 'Minimum 55 years (standard) or 60 years (Silver Hair)',
            restrictions: 'No work allowed in Indonesia',
          },

          process: [
            'Apply via evisa.imigrasi.go.id',
            'Upload pension proof + insurance + lease + passport',
            'Sponsor required (can be visa agent or Indonesian individual)',
            'Immigration review (2-3 weeks)',
            'KITAS issued (1 or 5 years)',
          ],
        },

        digitalNomadVisa2025: {

          e33GRemoteWorkerVisa: {
            name: 'E33G Remote Worker Visa (NEW April 2024)',
            code: 'E33G',
            duration: '1 year',
            renewable: 'Once (total 2 years)',
            cost: 'USD 630 + USD 150 processing fee',

            requirements: [
              'Proof of remote employment',
              'Income statement (minimum threshold applies)',
              'Health insurance',
              'Accommodation proof',
              'Sponsor (can be visa agent)',
            ],

            benefits: [
              'Longer duration (1 year vs 60 days)',
              'Renewable once',
              'More stable residence status',
              'Can open Indonesian bank account',
            ],

            comparison: {
              recommendation:
                'Use C1 Tourist Visa for short stays, then upgrade to E33G for long-term remote work',
            },
          },
        },

        workPermits2025: {
          oldSystem: {
            imta: 'IMTA (Izin Mempekerjakan Tenaga Kerja Asing) - ABOLISHED 2018',
            notification: 'Notification system - REPLACED 2021',
          },

          currentSystem2025: {
            name: 'HPK RPTKA + Pengesahan RPTKA',
            introduced: '2021',
            fullyDigital: '2025',

            process: [
              {
                step: 1,
                name: 'RPTKA (Rencana Penggunaan Tenaga Kerja Asing)',
                translation: 'Expatriate Placement Plan',
                authority: 'Ministry of Manpower',
                content: 'Justification for hiring foreign worker, position details, work location',
                duration: '2-3 weeks',
              },
              {
                step: 2,
                name: 'Pengesahan RPTKA',
                translation: 'Attestation of RPTKA',
                authority: 'Ministry of Manpower (online system)',
                content: 'Foreigner name, job title, work location, validity period',
                duration: '1-2 weeks',
              },
              {
                step: 3,
                name: 'e-Visa',
                translation: 'Electronic Work Visa',
                authority: 'Directorate General of Immigration',
                content: 'Visa for entry to Indonesia',
                duration: '1-2 weeks',
                note: 'Automatically converts to e-ITAS upon entry',
              },
              {
                step: 4,
                name: 'e-ITAS (KITAS)',
                translation: 'Electronic Limited Stay Permit',
                authority: 'Immigration office',
                content: 'Physical KITAS card issued after arrival',
                duration: '1-2 weeks after arrival',
              },
            ],

            totalProcessingTime: '4-6 weeks (from RPTKA approval)',

            fees: {
              dkpTka: {
                name: 'DKP-TKA (Dana Kompensasi Penggunaan Tenaga Kerja Asing)',
                translation: 'Foreign Workers Compensation Fund',
                amount: 'USD 100/month per foreign worker',
                payableTo: 'Ministry of Manpower',
                frequency: 'Monthly',
                purpose: 'Manpower development fund',
              },
            },

            exceptions: {
              noRPTKARequired: [
                'Foreign directors/commissioners with substantial shares (considered investors, not workers)',
                'Emergency situations (approved by Ministry)',
              ],
            },
          },

          legalBasis: 'UU 13/2003 - Manpower Law (Law No. 13 of 2003 on Manpower)',
        },

        overstayAndDeportation2025: {
          overstayPenalties: {
            rate: 'RETRIEVED_FROM_DATABASE',
            enforcement: 'Strict - even 1 day overstay triggers fine',
            payment: 'Must be paid in full before departure',

            categories: [
              {
                duration: 'Under 60 days',
                classification: 'Administrative violation',
                consequences: [
                  'Fine: 'RETRIEVED_FROM_DATABASE'',
                  'Must leave Indonesia immediately after payment',
                  'Possible re-entry ban (6 months - 2 years)',
                ],
                deportation: 'Not mandatory (pay fine and leave)',
              },
              {
                duration: 'Over 60 days',
                classification: 'Criminal violation',
                consequences: [
                  'Deportation (mandatory)',
                  'Blacklist (permanent or long-term)',
                  'Re-entry ban: 6 months - 10 years',
                  'Possible detention during deportation process',
                  'All costs borne by violator',
                ],
                deportation: 'Mandatory - no exceptions',
              },
            ],
          },

          reEntryBans: {
            under2024: {
              duration: '6 months maximum',
              note: 'Old regulation (before UU 63/2024)',
            },
            after2024: {
              duration: 'Up to 10 years (renewable 10 years each time)',
              authority: 'Immigration Directorate',
              factors: [
                'Severity of violation',
                'Number of previous violations',
                'Type of offense (overstay, working illegally, criminal activity)',
                'Cooperation during enforcement',
              ],
            },
          },

          commonViolationsLeadingToDeportation: [
            {
              violation: 'Working on tourist/business visa',
              outcome: 'Deportation + blacklist (almost always)',
              detection: 'Office raids, neighbor reports, digital surveillance',
            },
            {
              violation: 'Overstay over 60 days',
              outcome: 'Deportation + blacklist (mandatory)',
              detection: 'Automatic biometric checks at departure',
            },
            {
              violation: 'False documents',
              outcome: 'Deportation + criminal charges + blacklist',
              detection: 'Document verification systems',
            },
            {
              violation: 'Violating visa purpose',
              outcome: 'Deportation + re-entry ban',
              example: 'Business visa used for tourism only, or vice versa',
            },
          ],

          enforcementIntensity2025: {
            violationsJanApr2025: '2,201 foreigners',
            violationsJanApr2024: '1,610 foreigners',
            increase: '36.71%',
            reason: 'Led to stricter enforcement measures (SE IMI-417, enhanced surveillance)',

            technologies: [
              'Digital verification systems at airports/seaports',
              'Biometric checks (fingerprints, facial recognition)',
              'Real-time database matching',
              'Hotel/accommodation reporting integration',
              'Police-immigration data sharing (UU 63/2024)',
            ],

            detectability:
              'Virtually impossible to avoid detection - all entry/exit points digitalized',
          },

          adviceForClients: [
            '⚠️ NEVER overstay - fines are automatic and detection is certain',
            '⚠️ NEVER work on wrong visa - deportation rate nearly 100%',
            '✅ Always extend visa 7+ days before expiry',
            '✅ Keep digital/physical copy of visa + passport',
            '✅ Report address within 24 hours of arrival',
            '✅ Use professional agent for complex cases',
            '⚠️ Re-entry ban now up to 10 years (was 6 months) - one mistake can ban you for a decade',
          ],
        },

        spouseVisaKITAS2025: {
          code: 'E31A',
          name: 'Spouse KITAS (Marriage to Indonesian Citizen)',
          nameIndonesian: 'KITAS Pasangan',
          duration: '1 year',
          renewable: 'Yes (annually)',

          requirements: {
            passport: 'Valid for minimum 6 months',
            financial: 'Bank statement USD 2,000 minimum (last 3 months)',
            documents: [
              'Marriage certificate (official, legalized)',
              'Marriage certificate translation to Indonesian (if not English) by sworn translator',
              'Marriage registration at Indonesian Mission (if married abroad)',
              'Report/registration at Indonesian Civil Registry (for foreign marriages)',
              'Application letter from Indonesian spouse',
              'Copy of Indonesian spouse KTP (ID card)',
              'Copy of Family Register (Kartu Keluarga)',
            ],
          },

          process: [
            'Obtain marriage certificate (from marriage location)',
            'If married abroad: Legalize at Indonesian embassy/consulate',
            'Register marriage with Indonesian Civil Registry',
            'Indonesian spouse submits application',
            'Upload documents to evisa.imigrasi.go.id',
            'Immigration review (4-8 weeks)',
            'KITAS issued (1 year validity)',
          ],

          processingTime: '4-8 weeks',

          workRights: {
            allowed: false,
            note: 'E31A KITAS does NOT allow work',
            toWork:
              'Must apply separately for RPTKA (Expatriate Placement Plan) + IMTA from Ministry of Manpower',
          },

          pathToCitizenship: {
            step1: {
              after: '2 years of marriage',
              action: 'Apply for KITAP (Permanent Stay Permit)',
              validity: '5 years',
            },
            step2: {
              after: '2 KITAP renewals (10 years total)',
              action: 'Apply for Indonesian citizenship',
              authority: 'Ministry of Law and Human Rights',
            },
          },

          advantages: [
            'Stable long-term residence in Indonesia',
            'Can be extended annually without leaving Indonesia',
            'Path to permanent residence (KITAP) after 2 years',
            'Path to citizenship after 10 years total',
            'Spouse and children can reside together',
          ],

          importantNotes: [
            '⚠️ Marriage MUST be registered with Indonesian authorities',
            '⚠️ Foreign marriage requires legalization at Indonesian embassy',
            '⚠️ NO work rights - separate work permit required',
            '✅ Can apply for KITAP after 2 years of marriage',
            '✅ After 2 KITAP renewals (10 years) → eligible for citizenship',
          ],
        },

        studentVisaKITAS2025: {
          code: 'C316',
          name: 'Student KITAS',
          nameIndonesian: 'KITAS Pelajar',
          duration: '6 months - 2 years (depends on program)',
          renewable: 'Yes (maximum 2 renewals, 2 years each)',
          maxTotalDuration: '4 years (2 years initial + 2 years + 2 years)',

          requirements: {
            passport: 'Valid for minimum 12 months from entry date, 2 blank pages',
            acceptance: 'Letter of acceptance from Indonesian university',
            studyPermit: 'Study permit from Ministry of Education',
            financial: [
              'Proof of sufficient funds (USD 1,500 - 2,000)',
              'Bank statements (6 months)',
              'Financial guarantee letter',
            ],
            sponsor: 'Educational institute registered with Ministry of Education and Culture',
          },

          costs: {
            processing: 'RETRIEVED_FROM_DATABASE',
            visaFee: 'USD 150 (at overseas Indonesian Embassy)',
            biometrics: 'RETRIEVED_FROM_DATABASE',
          },

          process: [
            'Receive acceptance letter from Indonesian university',
            'University applies for study permit from Ministry of Education',
            'Apply for VITAS (entry visa) at Indonesian Embassy/Consulate in home country',
            'Enter Indonesia with VITAS',
            'Within 30 days: Convert VITAS to KITAS at Immigration Department',
            'Complete biometrics (fingerprints + photo)',
            'Receive KITAS card',
          ],

          processingTime: 'Up to 2 months (total process)',

          workRights: {
            allowed: false,
            note: 'Student KITAS does NOT allow work or employment in Indonesia',
          },

          extensionRules: [
            'If issued for 6 months: Renew every 6 months until course completion',
            'If issued for 1 year: Renew annually',
            'Maximum 2 extensions, 2 years each time',
            'Must maintain enrollment status',
            'Cannot exceed total study program duration',
          ],

          importantNotes: [
            '⚠️ Must convert VITAS to KITAS within 30 days of arrival',
            '⚠️ NO work allowed (violators face deportation)',
            '✅ Can be extended for entire study duration',
            '✅ Sponsored by educational institute (no personal sponsor needed)',
            '⚠️ Must maintain full-time student status',
          ],
        },

        medicalTreatmentVisa2025: {
          code: 'D1 (medical)',
          name: 'Medical Treatment Visa (Multiple Entry)',
          nameIndonesian: 'Visa Perawatan Medis',
          duration: '60 days per visit',
          validity: '1-5 years (multiple entries)',
          extensions: 'Allowed at immigration office',

          requirements: {
            passport: 'Valid for minimum 6 months',
            financial: 'Bank statement USD 2,000 minimum (last 3 months)',
            sponsor: 'Indonesian hospital/medical facility (must sponsor)',
            documents: [
              'Medical appointment records/confirmation',
              'Hospital invitation/treatment plan letter',
              'Confirmed Indonesian address (hotel/residence)',
              'Return/onward flight tickets',
            ],
            account: 'Active evisa.imigrasi.go.id account',
          },

          stayDuration: {
            perVisit: '60 days',
            extensions: 'Can be extended at immigration office',
            multipleEntries: 'Allowed during 1-5 year validity period',
          },

          restrictions: [
            '❌ CANNOT be used for employment',
            '❌ CANNOT be used for project execution',
            '✅ Only for medical treatment and related activities',
          ],

          importantProcedures: {
            borderInspection: 'May require: flight tickets, medical appointment records as proof',
            duringHospitalization:
              '⚠️ CRITICAL: If visa will expire during hospitalization, contact immigration BEFORE expiry to avoid overstay fines',
            overstay: 'RETRIEVED_FROM_DATABASE',
          },

          advantages: [
            'Long validity (1-5 years)',
            'Multiple entries allowed',
            '60 days per visit (extendable)',
            'Suitable for ongoing treatment requiring multiple trips',
            'Family members can accompany (separate dependent visas)',
          ],

          medicalFacilitiesCovered: [
            'Hospitals (public and private)',
            'Specialist clinics',
            'Rehabilitation centers',
            'Long-term care facilities',
            'Medical check-up centers',
          ],

          importantNotes: [
            '⚠️ MUST have Indonesian medical facility as sponsor',
            '⚠️ Contact immigration if hospitalized near visa expiry',
            '✅ Can bring family members (apply dependent visas)',
            '✅ Multiple entries over 1-5 years',
            '⚠️ Overstay = 'RETRIEVED_FROM_DATABASE'',
          ],
        },

        journalistVisa2025: {
          code: 'C5',
          name: 'Journalist Visa',
          nameIndonesian: 'Visa Jurnalis',
          duration: '60 days (single entry)',
          extensions: '2 extensions x 60 days (max 180 days total)',

          eligibleActivities: [
            'News coverage (TV, radio, online, print platforms)',
            'Documentary filming',
            'Interviews',
            'News reporting',
            'Feature stories',
            'Media production',
          ],

          requirements: {
            passport: 'Valid for minimum 6 months',
            accreditation: [
              'Accreditation from Department of Foreign Affairs (Directorate of Information and Media)',
              'Approval from Directorate General of Immigration',
              'Approval from Department of Labor Affairs',
            ],
            documents: [
              'Letter from foreign media organization (newspaper, TV, journal, etc.)',
              'Assignment letter detailing coverage purpose',
              'Proof of journalist credentials',
              'Portfolio/work samples (may be required)',
            ],
          },

          applicationProcess: {
            method: 'Online application (no embassy visit needed)',
            steps: [
              'Submit application to Indonesian Embassy/Consulate',
              'Embassy forwards to Department of Foreign Affairs',
              'Department of Foreign Affairs reviews and issues approval',
              'Embassy issues C5 journalist visa',
              'Enter Indonesia',
              'Report to Directorate of Information and Media within 24 hours',
              'Receive press card/permit',
            ],
          },

          uponArrival: {
            mandatory:
              'Report to Directorate of Information and Media - Department of Foreign Affairs',
            purpose: 'Obtain press card and permit for film production',
            permits: [
              'Press card (for news coverage)',
              'Permit for film production (if applicable)',
              'Permit to visit other regions (if needed)',
            ],
          },

          processingTime: 'Varies (depends on Department of Foreign Affairs approval)',

          restrictions: [
            '❌ CANNOT work for Indonesian media organizations',
            '❌ CANNOT receive payment from Indonesian entities',
            '✅ Only foreign media assignments allowed',
            '⚠️ Must report filming locations to local authorities',
          ],

          importantNotes: [
            '⚠️ MUST obtain accreditation from Department of Foreign Affairs BEFORE applying',
            '⚠️ MUST report to Directorate of Information and Media within 24 hours of arrival',
            '✅ Online application (no embassy visit)',
            '✅ Extendable to 180 days total',
            '⚠️ Using tourist visa (C1) for journalism = violation → deportation',
          ],
        },

        socialCulturalVisa2025: {
          c6b: {
            code: 'C6B',
            name: 'Social Cultural Visa (Volunteer)',
            nameIndonesian: 'Visa Sosial Budaya (Relawan)',
            duration: '60 days (single entry)',
            extensions: '2 extensions x 60 days (max 180 days total)',

            eligibleActivities: [
              'Volunteer work with registered NGOs',
              'Community development projects',
              'Environmental conservation',
              'Teaching (unpaid)',
              'Social work',
              'Cultural exchange programs',
            ],

            requirements: {
              passport: 'Valid for minimum 6 months, 1 blank page',
              financial: 'Bank statement USD 2,000 minimum (last 3 months)',
              sponsor: [
                'Invitation letter from Indonesian organization/NGO',
                'Sponsor must be registered entity',
                'Detailed work plan/project description',
              ],
              documents: [
                'Letter of invitation from host organization',
                'Organization registration documents',
                'Volunteer project details',
                'Proof of accommodation',
              ],
            },

            criticalRestrictions: [
              '❌ CANNOT receive salary, wages, rewards, or any payment',
              '❌ CANNOT receive compensation from individuals or corporations in Indonesia',
              '❌ CANNOT work for profit-making entities',
              '✅ Only volunteer/unpaid activities allowed',
            ],

            applicationRules: {
              location: '⚠️ MUST apply OUTSIDE Indonesia',
              onshore: 'Onshore application (within Indonesia) NOT available',
              process:
                'Apply at Indonesian Embassy/Consulate in home country or neighboring country',
            },
          },

          c9: {
            code: 'C9',
            name: 'Social Cultural Visa (Research/Study)',
            nameIndonesian: 'Visa Sosial Budaya (Penelitian)',
            duration: '60 days (single entry)',
            extensions: '2 extensions x 60 days (max 180 days total)',

            eligibleActivities: [
              'Research activities',
              'Academic studies (short-term)',
              'Scientific research',
              'Cultural research',
              'Field studies',
              'Data collection',
            ],

            requirements: {
              passport: 'Valid for minimum 6 months, 1 blank page',
              financial: 'Bank statement USD 2,000 minimum (last 3 months)',
              sponsor: [
                'Invitation from Indonesian research institution/university',
                'Research proposal/plan',
                'Ethical clearance (if human subjects involved)',
              ],
              documents: [
                'Research permit from Indonesian authorities',
                'Institution affiliation letter',
                'Research proposal',
                'CV and academic credentials',
              ],
            },

            criticalRestrictions: [
              '❌ CANNOT receive payment or compensation',
              '❌ Using C1 (tourist) visa for research = VIOLATION → deportation',
              '✅ Must have proper C9 visa for research activities',
            ],

            applicationRules: {
              location: '⚠️ MUST apply OUTSIDE Indonesia',
              onshore: 'Onshore application NOT available',
              process: 'Apply at Indonesian Embassy/Consulate',
            },
          },

          importantNotes: [
            '⚠️ Using wrong visa type (C1 tourist) for volunteer/research = VIOLATION',
            '⚠️ MUST apply outside Indonesia (onshore not available)',
            '❌ NO payment/wages/rewards allowed (any form)',
            '✅ Can extend to 180 days total',
            '⚠️ Sponsor must be registered entity (NGO/institution)',
          ],
        },

        dependentKITAS2025: {
          code: 'E31 (Dependent)',
          name: 'Dependent KITAS (Family Reunion)',
          nameIndonesian: 'KITAS Tanggungan',
          duration: "Same as sponsor's KITAS duration",
          renewable: 'Yes (when sponsor renews)',

          eligiblePersons: [
            'Spouse of KITAS holder',
            'Children under 18 years of KITAS holder',
            'Children born in Indonesia to KITAS holders',
            'Spouse of Indonesian citizen',
            'Children of Indonesian citizen',
            'Dependent relatives (in special cases)',
          ],

          requirements: {
            sponsorDocuments: [
              "Copy of sponsor's Indonesian ID (KTP) - if Indonesian citizen",
              "Copy of sponsor's KITAS - if foreigner",
              'Family Register (Kartu Keluarga)',
              'Birth certificate (Akte Kelahiran) of Indonesian sponsor',
            ],
            applicantDocuments: [
              'Valid passport',
              'Birth certificate (for children)',
              'Marriage certificate (for spouse)',
              'All certificates translated by sworn translator to Indonesian',
              'Legalized documents (if issued abroad)',
            ],
            financial: "Bank statement USD 1,500 - 2,000 (in sponsor's account)",
          },

          processingTime: {
            eVisa: '3-5 working days',
            note: 'Fastest KITAS processing time among all visa types',
          },

          workRights: {
            allowed: false,
            note: 'Dependent KITAS does NOT allow work or employment',
            toWork: 'Must convert to Working KITAS (separate application with RPTKA)',
          },

          automaticEligibility: {
            childrenBornInIndonesia:
              'Children born in Indonesia to KITAS holders are automatically eligible for dependent KITAS',
            process: 'Register birth at Civil Registry → apply dependent KITAS within 60 days',
          },

          advantages: [
            'Very fast processing (3-5 days)',
            'Family can stay together',
            'Duration matches sponsor KITAS',
            'Simple renewal (when sponsor renews)',
            'No separate sponsor needed (sponsor is family member)',
          ],

          importantNotes: [
            '⚠️ NO work rights (residence only)',
            '✅ Fastest KITAS processing (3-5 days)',
            '✅ Children born in Indonesia automatically eligible',
            '⚠️ All certificates need sworn translation',
            '✅ Renews automatically when sponsor renews KITAS',
          ],
        },

        filmCrewVisa2025: {
          code: 'C14',
          name: 'Film Crew Visa (Filming Permit)',
          nameIndonesian: 'Visa Film',
          duration: 'Project-based (typically 30-60 days)',
          extensions: 'Based on film permit validity',

          eligibleActivities: [
            'Commercial film/video production',
            'Documentary filming',
            'TV/streaming content production',
            'Photography (commercial)',
            'Music video production',
          ],

          mandatoryRequirements: {
            fixerCompany: {
              requirement: '⚠️ MANDATORY: Licensed Indonesian fixer/production company',
              note: 'ONLY verified fixer companies can issue appropriate visas and permits',
              role: 'Sponsor visa application, obtain permits, coordinate with authorities',
            },
            nationalFilmPermit: {
              processingTime: '4-6 weeks',
              issuedBy: 'Ministry of Tourism and Creative Economy',
              scope: 'Nationwide filming authorization',
            },
          },

          requirements: {
            passport: 'Valid for minimum 6 months',
            financial: 'Bank statement USD 2,000 minimum per crew member',
            productionDocuments: [
              'Company profile (production company)',
              'Past credits/portfolio',
              'Project synopsis/treatment',
              'Production schedule (detailed)',
              'Filming locations list',
              'Crew list (names, roles, passport details)',
              'Cast list (if applicable)',
              'Equipment list (ATA Carnet for customs)',
              'Flight itineraries (all crew members)',
            ],
            perCrewMember: [
              'Passport scan (valid 6 months)',
              'Passport photos (3x4 color)',
              'Completed visa application form',
              'Bank statement (USD 2,000+)',
              'Flight itinerary',
            ],
          },

          processingTimeline: {
            nationalFilmPermit: '4-6 weeks',
            filmVisa: 'Varies (depends on crew size)',
            recommendedLeadTime: '8 weeks before shoot date',
            note: 'Start application process minimum 8 weeks prior to filming',
          },

          additionalPermits: {
            provincial: 'Provincial filming permits (if shooting in specific provinces)',
            nationalPark: 'National park permits (if filming in conservation areas)',
            specialLocations: 'Specific location permits (monuments, government buildings, etc.)',
            droneOperations:
              'Ministry of Transportation drone registration (see drone restrictions below)',
          },

          droneRegulations: {
            registration: '⚠️ ALL drones MUST be registered with Ministry of Transportation',
            operators:
              '⚠️ Operators MUST be Indonesian citizens holding Indonesian Remote Pilot Certificates',
            foreignCrew: 'Foreign crew CANNOT operate drones in Indonesia',
            workaround: 'Hire Indonesian-certified drone operators via fixer company',
          },

          costs: {
            filmPermit: 'Varies (depends on project scope)',
            visaFee: 'Per crew member (standard C14 visa fee)',
            fixerServices: 'Negotiable (essential for smooth process)',
            locationPermits: 'Varies by location',
            droneOperators: 'Daily rate for Indonesian-certified operators',
          },

          importantNotes: [
            '⚠️ Indonesian fixer company MANDATORY (cannot apply individually)',
            '⚠️ 8 weeks lead time MINIMUM (do not underestimate)',
            '⚠️ Drones MUST be operated by Indonesian citizens only',
            '⚠️ National Film Permit required BEFORE visa application',
            '✅ ATA Carnet for equipment (avoid customs duties)',
            '⚠️ Additional permits for national parks, monuments, government sites',
            '✅ Fixer company handles permits, visas, location coordination',
          ],
        },

        voaVisaOnArrival2025: {
          code: 'VOA (Visa on Arrival)',
          name: 'Visa on Arrival',
          nameIndonesian: 'Visa Kedatangan',
          duration: '30 days',
          extensions: '1 extension x 30 days (max 60 days total)',
          cost: 'RETRIEVED_FROM_DATABASE',

          eligibleCountries: {
            total: 97,
            majorCountries: [
              'Australia',
              'United States',
              'United Kingdom',
              'Canada',
              'Japan',
              'South Korea',
              'Germany',
              'France',
              'Italy',
              'Spain',
              'Netherlands',
              'Belgium',
              'Switzerland',
              'Norway',
              'Sweden',
              'Denmark',
              'Finland',
              'Austria',
              'Portugal',
              'Ireland',
              'New Zealand',
              'Singapore',
              'Malaysia',
              'Thailand',
              'Philippines',
              'Vietnam',
              'India',
              'China',
              'Hong Kong',
              'Taiwan',
              'United Arab Emirates',
              'Saudi Arabia',
              'Qatar',
              'Bahrain',
              'South Africa',
              'Brazil',
              'Argentina',
              'Mexico',
              'Chile',
            ],
            note: 'Total 97 countries eligible - check evisa.imigrasi.go.id for complete list',
          },

          applicationMethods: [
            {
              method: 'e-VoA (Online)',
              url: 'https://evisa.imigrasi.go.id',
              timing: 'Before departure (recommended)',
              advantages: [
                'Faster airport processing',
                'Avoid queues',
                'Guaranteed approval before travel',
              ],
            },
            {
              method: 'On Arrival',
              locations: 'Designated international airports, seaports, land border checkpoints',
              timing: 'Upon arrival in Indonesia',
              note: 'May have queues during peak hours',
            },
          ],

          permittedActivities: [
            'Tourism and sightseeing',
            'Family visits',
            'Social and cultural activities',
            'Government duties (non-work)',
            'Business meetings (non-employment)',
            'Purchasing goods',
            'Transit to other destinations',
          ],

          extensionProcess2025: {
            majorChanges: '⚠️ CRITICAL CHANGES May-June 2025',
            regulation: 'SE IMI-417.GR.01.01/2025',

            newRequirements: [
              {
                requirement: '⚠️ MANDATORY in-person visit to immigration office',
                effectiveDate: 'June 2025',
                note: 'Online-only extensions NO LONGER AVAILABLE',
              },
              {
                requirement: '⚠️ MANDATORY biometric data collection',
                effectiveDate: 'May 21, 2025 (reinstated)',
                data: 'Fingerprints + photograph',
                location: 'Local immigration office',
              },
            ],

            steps: [
              'Submit extension application online (evisa.imigrasi.go.id)',
              'Receive email notification (within 1-2 days)',
              '⚠️ Visit immigration office within 2 working days of email',
              'Complete photo capture + biometric data collection',
              'Attend in-person interview',
              'Wait 3-4 working days',
              'Extension granted (additional 30 days)',
            ],

            cost: 'RETRIEVED_FROM_DATABASE',
            totalStay: 'Maximum 60 days (30 initial + 30 extension)',
          },

          restrictions: [
            '❌ CANNOT work or earn income',
            '❌ CANNOT study (use student visa)',
            '❌ CANNOT conduct business activities (use business visa)',
            '⚠️ Extendable ONLY ONCE (max 60 days total)',
            '⚠️ Must leave Indonesia after 60 days (cannot convert to other visa types)',
            '⚠️ Overstay = 'RETRIEVED_FROM_DATABASE'',
          ],

          importantNotes: [
            '⚠️ NEW 2025: In-person biometric MANDATORY for extension (SE IMI-417)',
            '⚠️ Must visit immigration office within 2 days of extension approval email',
            '✅ 97 countries eligible',
            '✅ Can apply online (e-VoA) or on arrival',
            '⚠️ One extension only (max 60 days total)',
            '⚠️ Cannot convert to KITAS (must leave and re-enter with proper visa)',
            '✅ Fast processing (3-4 days for extension after biometrics)',
          ],
        },

        crewMemberVisa2025: {
          c13Seaman: {
            code: 'C13',
            name: 'Seaman Visa (Crew Member)',
            nameIndonesian: 'Visa Pelaut',
            purpose: 'Joining vessel/ship in Indonesian waters',

            eligibleActivities: [
              'Joining ship/vessel docked in Indonesian port',
              'Crew change operations',
              'Maritime crew activities',
              'Sign-on procedures',
            ],

            requirements: {
              passport: 'Valid for minimum 6 months',
              seamanBook: "Valid seaman's book or equivalent",
              shipDocuments: [
                'Ship/vessel details',
                'Port of call in Indonesia',
                'Crew change documentation',
                'Shipping agent letter',
              ],
              sponsor: 'Indonesian shipping agent or GAC (Gulf Agency Company)',
            },

            processingTime: {
              standard: '5-10 working days',
              express: '1 working day (if system operational)',
            },
          },

          airportTransitProvisions: {
            soekarnoHattaJakarta: {
              airport: 'Soekarno-Hatta International Airport (CGK)',
              transitVisaRequired: false,
              conditions: [
                'Not changing terminals',
                'Transit duration up to 8 hours',
                'Remain in international transit area',
              ],
            },
            ngurahRaiBali: {
              airport: 'Ngurah Rai International Airport (DPS)',
              transitVisaRequired: false,
              conditions: [
                'Not staying after 2:00 AM',
                'Transit duration up to 8 hours',
                'Remain in international transit area',
              ],
            },
          },

          importantNotes: [
            '✅ C13 for joining vessels in Indonesian ports',
            '✅ Visit Visa alternative via shipping agent (e-Visa)',
            '✅ Express processing available (1 day if system works)',
            '✅ Airport transit up to 8 hours visa-free (specific conditions)',
            '⚠️ Passport must be valid 6 months minimum',
            '✅ GAC or shipping agent can sponsor/apply online',
          ],
        },

        diplomaticOfficialVisa2025: {
          diplomatic: {
            code: 'Diplomatic Visa',
            name: 'Diplomatic Visa',
            nameIndonesian: 'Visa Diplomatik',
            eligiblePersons: [
              'Diplomatic passport holders',
              'Family members of diplomats',
              'Officials on diplomatic missions',
            ],

            visaFreeEntry: {
              duration: '30 days (unless otherwise stated)',
              eligibility: 'Diplomatic passport holders from eligible countries',
              note: 'Bilateral agreements vary by country',
            },

            issuance: {
              authority: 'Foreign service officials at Indonesian Representative',
              delegation: 'Authority from Minister of Foreign Affairs',
              location: 'Indonesian Embassy/Consulate',
            },
          },

          officialService: {
            code: 'Official/Service Visa',
            name: 'Official/Service Visa',
            nameIndonesian: 'Visa Dinas',
            eligiblePersons: [
              'Official/service passport holders',
              'Government officials (non-diplomatic)',
              'International organization representatives',
            ],

            purpose: 'Non-diplomatic official duties from government or international organization',

            visaFreeEntry: {
              duration: '30 days',
              eligibility: 'Official/service passport holders from eligible countries',
              note: 'Bilateral agreements determine eligibility',
            },
          },

          recentAgreements: {
            pending: 'Visa exemption agreements signed but NOT YET ratified',
            countries: [
              'Algeria',
              'Eswatini',
              'Gambia',
              'Nepal',
              'Iraq',
              'Rwanda',
              'Somalia',
              'Syria',
            ],
            note: 'Once ratified, diplomatic/service passport holders from these countries get visa-free entry',
          },

          importantNotes: [
            '✅ Diplomatic/official passport holders: 30 days visa-free (eligible countries)',
            '⚠️ Bilateral agreements vary - check with Indonesian embassy',
            '✅ 8 new countries pending ratification (Algeria, Eswatini, etc.)',
            '✅ Issued by Indonesian Representative (Minister of Foreign Affairs authority)',
            '⚠️ Regular passport holders NOT eligible (even if government employee)',
          ],
        },

        emergencyHumanitarianVisa2025: {
          decree: 'M.IP-08.GR.01.01 Year 2025',
          date: 'May 2, 2025',
          name: 'Humanitarian Mission Visa (ITAS E23-E35)',

          visaIndexes: {
            range: 'E23 to E35',
            purpose: 'Refined visa indexes for diverse residency scenarios',
            categories: [
              'Employment',
              'Investment',
              'Family unification',
              'Religious missions',
              'Humanitarian missions',
            ],
          },

          humanitarianMissionVisa: {
            type: 'E-category KITAS',
            duration: '6 months - 5 years (depends on mission type)',
            sponsor: 'Indonesian company, organization, or family member',

            eligibleActivities: [
              'Religious mission work',
              'Humanitarian organization work',
              'Charity/NGO work',
              'Disaster relief operations',
              'Development programs',
            ],

            note: '⚠️ This is for ORGANIZATIONAL humanitarian missions, NOT personal family emergencies',
          },

          personalEmergencies: {
            familyCrisis: 'NO specific visa category',
            recommendation: 'Contact Indonesian embassy/consulate directly',
            discretion:
              'Embassy may have discretionary provisions for urgent cases (not publicly documented)',
            alternatives: [
              'Use existing visitor visa (if eligible)',
              'Apply for expedited C1/C2 visa with emergency documentation',
              'Explain emergency circumstances to embassy',
            ],
          },

          importantNotes: [
            '⚠️ Humanitarian visa = organizational missions (NGO, religious, charity)',
            '⚠️ NO specific "emergency visa" for personal family crisis',
            '✅ Contact embassy for discretionary emergency provisions',
            '✅ E23-E35 visa indexes cover employment, investment, family, humanitarian',
            '⚠️ Sponsor required (company, organization, or family member)',
          ],
        },

        businessVisa2025: {
          c2SingleEntry: {
            code: 'C2',
            name: 'Single Entry Business Visa',
            nameIndonesian: 'Visa Bisnis Masuk Tunggal',
            duration: '60 days initial',
            extensions: '2 extensions x 60 days (max 180 days total)',
            entryType: 'Single entry only',
            validityPeriod: 'Must be used within 90 days from issue date',

            permittedActivities: [
              'Business meetings and negotiations',
              'Site visits (office, factory, production site)',
              'Purchasing goods (checking goods, discussing contracts)',
              'Signing business contracts',
              'Corporate engagements',
              'Trade discussions',
            ],

            restrictions: [
              '❌ CANNOT work in Indonesia',
              '❌ CANNOT receive salary, wages, or payment in Indonesia',
              '❌ CANNOT engage in sale of goods/services for payment',
              '⚠️ Single entry - visa invalid after exiting Indonesia',
            ],

            requirements: {
              passport: 'Valid minimum 6 months (12 months for emergency passports)',
              financial: 'Bank statement USD 2,000 minimum (last 3 months)',
              sponsor: 'Indonesian company sponsor/guarantor (mandatory)',
              documents: [
                'Sponsor invitation letter',
                'Company documents (proof of business relationship)',
                'Passport-sized photos',
                'Completed visa application form',
              ],
            },

            applicationProcess:
              'Online via evisa.imigrasi.go.id with Indonesian sponsor assistance',
            processingTime: '5-7 working days',
          },

          d2MultipleEntry: {
            code: 'D2',
            name: 'Multiple Entry Business Visa',
            nameIndonesian: 'Visa Bisnis Masuk Berganda',
            validity: '1, 2, or 5 years',
            durationPerVisit: '60 days',
            extensions: '2 extensions x 60 days (180 days max per visit)',
            entryType: 'Unlimited entries during validity period',

            benefits: [
              'Multiple exits and re-entries allowed',
              'No need to reapply for each visit',
              'Suitable for frequent business travelers',
              'Same activities as C2 visa',
            ],

            requirements: 'Same as C2, plus proof of frequent business travel needs',
            cost: 'Higher than C2 (varies by validity period)',
            idealFor: 'Business people with ongoing Indonesia operations requiring frequent visits',
          },
        },

        investorKITAS2025: {
          code: 'E28A',
          name: 'Investor KITAS',
          nameIndonesian: 'KITAS Investor',
          duration: '2 years',
          renewable: 'Yes (every 2 years)',

          investmentRequirements: {
            standard: {
              minimumInvestment: 'RETRIEVED_FROM_DATABASE',
              eligibility: 'General investor (shareholder only)',
            },
            directorPosition: {
              minimumInvestment: 'RETRIEVED_FROM_DATABASE',
              eligibility: 'Investor holding director/commissioner position',
            },
            higherStandard: {
              minimumInvestment: 'RETRIEVED_FROM_DATABASE',
              note: 'Some sources indicate this higher requirement',
            },
          },

          companyRequirements: {
            authorizedCapital: 'Exceeds 'RETRIEVED_FROM_DATABASE'',
            paidUpCapital: 'Minimum 25% of authorized capital',
            investorPersonalShares: 'Minimum 'RETRIEVED_FROM_DATABASE'',
          },

          eligiblePositions: [
            'CEO/Director',
            'Commissioner',
            'Shareholder (with minimum investment)',
          ],

          keyAdvantages: [
            '✅ NO work permit (RPTKA) required',
            '✅ NO DKP-TKA monthly contribution (saves USD 100/month)',
            '✅ Direct investment in PT PMA',
            '✅ Can work in invested company',
            '✅ 2-year validity (renewable)',
          ],

          sponsorshipTiming: {
            when: 'After company obtains NIB + Business License (Izin Usaha)',
            note: 'Company must be operational before sponsoring investor KITAS',
          },

          importantNotes: [
            '⚠️ Investment must be in PT PMA company shares',
            '✅ Exempted from work permit requirements',
            '✅ More flexible than E23 Working KITAS',
            '⚠️ Investment amount varies ('RETRIEVED_FROM_DATABASE'',
            '✅ Suitable for business owners and major shareholders',
          ],
        },

        itasVsItap2025: {
          itas: {
            code: 'ITAS (Izin Tinggal Terbatas)',
            nameEnglish: 'Limited Stay Permit',
            physicalCard: 'KITAS (Kartu Izin Tinggal Terbatas)',
            electronicVersion: 'e-ITAS (modern term)',

            duration: {
              range: '6 months - 10 years',
              note: 'Depends on visa type and sponsor',
              common: '1 year or 2 years for most types',
            },

            renewal: {
              required: true,
              frequency: 'Based on initial duration',
              note: 'Not permanent - requires regular renewal',
            },

            commonTypes: [
              'E23 (Working KITAS) - 1-2 years',
              'E28A (Investor KITAS) - 2 years',
              'E31A (Spouse KITAS) - 1 year',
              'C316 (Student KITAS) - 6 months to 2 years',
              'E33F (Retirement KITAS) - 1-5 years',
            ],
          },

          itap: {
            code: 'ITAP (Izin Tinggal Tetap)',
            nameEnglish: 'Permanent Stay Permit',
            physicalCard: 'KITAP (Kartu Izin Tinggal Tetap)',

            duration: {
              initial: '5 years',
              renewal: 'Indefinitely renewable',
              status: 'Equivalent to permanent residency',
            },

            eligibility: {
              requirement: 'Must hold ITAS first (NO direct to ITAP)',
              pathways: [
                {
                  type: 'Marriage to Indonesian citizen',
                  requirement: '2 years married + 3 years continuous ITAS',
                  note: 'After meeting both conditions, eligible for ITAP',
                },
                {
                  type: 'Investor/Expatriate',
                  requirement: '3 years continuous ITAS',
                  note: 'Must maintain same visa category',
                },
                {
                  type: 'Retiree',
                  requirement: '3 years continuous retirement ITAS',
                  note: 'Then eligible for ITAP',
                },
                {
                  type: 'Child of ITAP holder',
                  requirement: 'Parent holds valid ITAP',
                  note: 'Automatic eligibility',
                },
              ],
            },

            benefits: [
              'Long-term residence stability (5 years)',
              'Renewable indefinitely (true permanent status)',
              'Less frequent renewals',
              'Pathway to Indonesian citizenship (after extended period)',
              'Can sponsor family members',
            ],
          },

          keyDifferences: [
            '📌 ITAS = Temporary (6mo-10yr), ITAP = Permanent (5yr renewable indefinitely)',
            '📌 ITAS requires regular renewals, ITAP renews every 5 years only',
            '📌 NO direct to ITAP - must hold ITAS first',
            '📌 ITAP offers long-term stability and less bureaucracy',
            '📌 Both use physical cards (KITAS/KITAP) or electronic (e-ITAS)',
          ],
        },

        visaExemption30Days2025: {
          regulation: 'Presidential Regulation No. 95/2024',
          signedBy: 'President Joko Widodo',
          date: 'August 29, 2024',
          effectiveDate: 'September 2024',

          eligibleCountries: {
            total: '16-18 countries',
            asean: {
              total: 10,
              countries: [
                'Brunei Darussalam',
                'Cambodia',
                'Laos',
                'Malaysia',
                'Myanmar',
                'Philippines',
                'Singapore',
                'Thailand',
                'Vietnam',
                'Timor Leste',
              ],
            },
            others: ['Morocco', 'Chile', 'Serbia', 'Colombia', 'Suriname', 'Hong Kong SAR'],
            addedJuly2025: {
              announcement: 'Directorate General of Immigration, July 2, 2025',
              effectiveDate: 'July 3, 2025',
              countries: ['Brazil', 'Turkey'],
              note: 'Visa-free entry resumed for these countries',
            },
          },

          stayDuration: {
            days: 30,
            extension: 'NOT extendable',
            conversion: 'CANNOT be converted to any other visa type',
            note: 'Strictly 30 days maximum - must leave Indonesia after',
          },

          entryPoints: {
            airports: 15,
            seaports: 91,
            landBorderPosts: 12,
            total: 118,
            note: 'Can enter through any designated border crossing',
          },

          entryProcess: {
            arrivalStamp: 'Entry permit/stamp granted at immigration',
            documentation: 'Passport + onward/return flight ticket',
            noVisaRequired: 'Visa-free - no advance application needed',
          },

          importantRestrictions: [
            '⚠️ 30 days ONLY - strictly non-extendable',
            '⚠️ CANNOT convert to KITAS or other visa',
            '✅ Must leave Indonesia after 30 days',
            '⚠️ Re-entry requires new eligibility (check country-specific rules)',
            '✅ Suitable for tourism, family visits, short business trips only',
          ],
        },

        extensionCostsOverstay2025: {
          extensionFees: {
            voa: {
              visaType: 'Visa on Arrival (VOA)',
              extensionFee: 'RETRIEVED_FROM_DATABASE',
              duration: '30 days extension (one time only)',
              totalStay: '60 days maximum (30 initial + 30 extension)',
            },
            process: {
              location: 'Immigration office (or licensed visa agent)',
              requirement: 'In-person visit MANDATORY (as of 2025)',
              timing: 'Apply 7+ days before visa expiry',
              note: 'SE IMI-417 requires biometric collection for extensions',
            },
          },

          overstayFines: {
            rate: 'RETRIEVED_FROM_DATABASE',
            enforcement: 'Automatic and strictly enforced (even 1 day)',
            payment: {
              location: 'Airport upon departure',
              method: 'Cash ONLY (Indonesian rupiah)',
              noExceptions: 'Payment mandatory before boarding',
            },

            consequences: {
              under60Days: {
                classification: 'Administrative violation',
                fine: 'RETRIEVED_FROM_DATABASE',
                action: 'Pay fine + leave immediately',
                reEntryBan: 'Possible 6 months - 2 years',
              },
              over60Days: {
                classification: 'Criminal violation',
                deportation: 'MANDATORY (no exceptions)',
                blacklist: 'Permanent or long-term (6 months - 10 years)',
                detention: 'Possible during deportation process',
                costs: 'All deportation costs borne by violator',
                imprisonment: 'Up to 5 years if unable to pay fine',
              },
            },
          },

          enforcement2025: {
            technology: [
              'Digital records (all entry/exit tracked)',
              'Biometric verification (fingerprints, facial recognition)',
              'Real-time database matching',
              'Immigration-police data sharing (UU 63/2024)',
            ],
            detectability: 'Virtually impossible to avoid detection',
            strictness: 'Stricter enforcement in 2025 vs previous years',
          },

          criticalAdvice: [
            '⚠️ NEVER overstay - detection is certain, fines are automatic',
            '✅ Extend visa 7+ days before expiry',
            '⚠️ Over 60 days overstay = MANDATORY deportation + blacklist',
            '⚠️ Cash-only payment (prepare Indonesian rupiah)',
            '⚠️ Imprisonment possible if unable to pay (up to 5 years)',
            '✅ Use licensed visa agent if unsure about extension process',
          ],
        },

        multipleReEntryPermit2025: {
          name: 'MERP (Multiple Re-Entry Permit)',
          nameIndonesian: 'IMK (Izin Masuk Kembali)',

          majorUpdate2024: {
            regulation: 'New Immigration Law',
            effectiveDate: 'September 19, 2024',
            keyChange:
              'KITAS holders: Re-entry permit integrated into KITAS (NO separate MERP needed)',
            impact: 'Only KITAP holders now require MERP',
          },

          kitas: {
            merpRequired: false,
            effectiveDate: 'September 19, 2024',
            integration: 'Re-entry permit integrated into KITAS itself',
            note: 'No separate MERP document needed for KITAS holders',
            benefit: 'Simplified process - exit and re-enter freely with valid KITAS',
          },

          kitap: {
            merpRequired: true,
            reason: 'Without MERP, KITAP automatically cancelled upon exit',
            validityOptions: ['6 months', '1 year', '2 years'],
            mostCommon: '2 years (for convenience)',

            requirements: {
              documents: [
                'Valid passport (minimum 6 months validity)',
                'Current KITAP card',
                'Sponsor letter (if applicable)',
                'Application form Perdim 25',
                'Passport-sized photographs (4x6 cm, red background) - 2 photos',
              ],
            },

            processingTime: '3-5 working days',

            specialCases: {
              familyReunionKITAP: {
                type: 'Family Reunion KITAP (Indonesian spouse)',
                merpValidity: 'Maximum 2 years only',
                note: 'Cannot apply for longer than 2 years',
              },
            },

            criticalWarning:
              '⚠️ MUST have active MERP to exit and re-enter - without MERP, KITAP is automatically cancelled upon exit',
          },

          importantNotes: [
            '✅ KITAS holders: NO MERP needed (integrated since Sept 19, 2024)',
            '⚠️ KITAP holders: MERP MANDATORY (KITAP cancelled if exit without MERP)',
            '✅ MERP processing: 3-5 working days',
            '✅ Validity: 6 months, 1 year, or 2 years (choose based on travel needs)',
            '⚠️ Family Reunion KITAP: Max 2 years MERP only',
            '✅ Apply for MERP before any international travel plans',
          ],
        },
      },
    },
  };

  /**
   * Analyze visa requirements based on user intent
   */
  async analyze(intent: any): Promise<any> {
    const purpose = this.detectPurpose(intent);
    const recommendations = this.getRecommendations(purpose);

    return {
      recommendations,
      tips: this.getRelevantTips(purpose),
      commonMistakes: this.knowledgeBase.commonMistakes,
      contact: {
        company: 'Bali Zero Services',
        whatsapp: '+62 859 0436 9574',
        email: 'info@balizero.com',
      },
      legalBasis: this.knowledgeBase.legalBasis,
      confidence: 0.95,
    };
  }

  private detectPurpose(intent: any): string {
    const keywords = intent.keywords || [];
    const text = (intent.text || '').toLowerCase();

    // KITAS detection
    if (text.includes('invest') || text.includes('company') || text.includes('business owner')) {
      return 'investor_kitas';
    }
    if (text.includes('work') || text.includes('employee')) {
      return 'working_kitas';
    }
    if (text.includes('digital nomad') || text.includes('remote work')) {
      return 'digital_nomad';
    }
    if (text.includes('retire') || text.includes('pension') || /\b55\b/.test(text)) {
      return 'retirement';
    }
    if (text.includes('spouse') || text.includes('married indonesian')) {
      return 'spouse';
    }

    // Multiple entry detection
    if (text.includes('multiple entry') || text.includes('frequent travel')) {
      return text.includes('business') ? 'multiple_business' : 'multiple_tourism';
    }

    // Single entry detection
    if (text.includes('business') || text.includes('meeting')) {
      return 'business_visa';
    }
    if (text.includes('internship') || text.includes('magang')) {
      return 'internship';
    }

    return 'tourism';
  }

  private getRecommendations(purpose: string): any {
    const recommendations = {
      tourism: [{ primary: true, visa: this.knowledgeBase.singleEntry.C1 }],
      business_visa: [
        { primary: true, visa: this.knowledgeBase.singleEntry.C2 },
        {
          alternative: true,
          visa: this.knowledgeBase.multipleEntry.D2,
          reason: 'If frequent travel needed',
        },
      ],
      multiple_tourism: [{ primary: true, visa: this.knowledgeBase.multipleEntry.D1 }],
      multiple_business: [
        { primary: true, visa: this.knowledgeBase.multipleEntry.D2 },
        {
          alternative: true,
          visa: this.knowledgeBase.multipleEntry.D12,
          reason: 'If exploring investment opportunities',
        },
      ],
      investor_kitas: [
        { primary: true, visa: this.knowledgeBase.kitas.E28A },
        {
          step1: true,
          visa: this.knowledgeBase.multipleEntry.D12,
          reason: 'Start with D12 to explore before committing',
        },
      ],
      working_kitas: [{ primary: true, visa: this.knowledgeBase.kitas.E23_WORKING }],
      digital_nomad: [{ primary: true, visa: this.knowledgeBase.kitas.E33G }],
      retirement: [{ primary: true, visa: this.knowledgeBase.kitas.E33F }],
      spouse: [{ primary: true, visa: this.knowledgeBase.kitas.E31A }],
      internship: [
        { primary: true, visa: this.knowledgeBase.singleEntry.C22A },
        {
          alternative: true,
          visa: this.knowledgeBase.singleEntry.C22B,
          reason: 'If company-based internship',
        },
      ],
    };

    return recommendations[purpose] || recommendations.tourism;
  }

  private getRelevantTips(purpose: string): string[] {
    const tips = this.knowledgeBase.insiderTips;

    if (purpose.includes('kitas')) {
      return [tips[0], tips[2], tips[3]]; // Offshore, receipts, professional agent
    }
    if (purpose.includes('business')) {
      return [tips[1], tips[4]]; // Extension timing, D12 info
    }
    if (purpose === 'digital_nomad') {
      return [tips[5]]; // Bank account + rent
    }

    return [tips[1]]; // Extension timing (universal)
  }

  /**
   * Get all available visas by category
   */
  getAllVisas(): any {
    return {
      singleEntry: this.knowledgeBase.singleEntry,
      multipleEntry: this.knowledgeBase.multipleEntry,
      kitas: this.knowledgeBase.kitas,
      kitap: this.knowledgeBase.kitap,
    };
  }

  /**
   * Search for specific visa by code
   */
  searchByCode(code: string): any {
    // Search in all categories
    const allCategories = [
      this.knowledgeBase.singleEntry,
      this.knowledgeBase.multipleEntry,
      this.knowledgeBase.kitas,
      this.knowledgeBase.kitap,
    ];

    for (const category of allCategories) {
      for (const key in category) {
        if (category[key].code === code) {
          return category[key];
        }
      }
    }

    return null;
  }
}
