// import { TeamKnowledgeDatabase } from './TeamKnowledgeEngine';
import logger from './logger.js';

// =====================================================
// ADVANCED NLP ENTITY EXTRACTION SYSTEM
// =====================================================

export interface ExtractedEntity {
  text: string;
  type:
    | 'person'
    | 'role'
    | 'department'
    | 'email'
    | 'phone'
    | 'service'
    | 'company'
    | 'location'
    | 'date'
    | 'price'
    | 'expertise';
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  normalized_value?: string;
  metadata?: any;
}

export interface QueryAnalysis {
  original_query: string;
  language: 'it' | 'en' | 'id' | 'mixed';
  entities: ExtractedEntity[];
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
  keywords: string[];
  business_context: any;
}

export interface NLPConfiguration {
  language: 'it' | 'en' | 'id' | 'auto';
  context_aware: boolean;
  learning_enabled: boolean;
  confidence_threshold: number;
}

export class AdvancedNLPSystem {
  private database: any; // TeamKnowledgeDatabase removed
  private config: NLPConfiguration;
  private teamMemberCache: Map<string, any> = new Map();
  private lastCacheUpdate: number = 0;

  constructor(database: any, config: NLPConfiguration) {
    this.database = database;
    this.config = config;
  }

  // =====================================================
  // MAIN ANALYSIS ENGINE
  // =====================================================

  async analyzeQuery(query: string, _context?: any): Promise<QueryAnalysis> {
    const startTime = Date.now();

    // 1. Language Detection
    const language = this.detectLanguage(query);

    // 2. Entity Extraction
    const entities = await this.extractEntities(query, language);

    // 3. Intent Classification
    const intent = this.classifyIntent(query, entities, language);

    // 4. Sentiment Analysis
    const sentiment = this.analyzeSentiment(query, language);

    // 5. Urgency Detection
    const urgency = this.detectUrgency(query, language);

    // 6. Complexity Assessment
    const complexity = this.assessComplexity(query, entities);

    // 7. Keyword Extraction
    const keywords = this.extractKeywords(query, language);

    // 8. Business Context Analysis
    const businessContext = await this.analyzeBusinessContext(query, entities, language);

    const analysis: QueryAnalysis = {
      original_query: query,
      language,
      entities,
      intent,
      sentiment,
      urgency,
      complexity,
      keywords,
      business_context: businessContext,
    };

    logger.info(`🧠 NLP Analysis completed in ${Date.now() - startTime}ms`);
    return analysis;
  }

  // =====================================================
  // LANGUAGE DETECTION
  // =====================================================

  private detectLanguage(query: string): 'it' | 'en' | 'id' | 'mixed' {
    const italianKeywords = [
      'chi',
      'qual',
      'dove',
      'come',
      'quando',
      'perché',
      'il',
      'la',
      'lo',
      'un',
      'una',
      'del',
      'della',
      'dei',
      'delle',
      'è',
      'sono',
    ];
    const englishKeywords = [
      'who',
      'what',
      'where',
      'when',
      'why',
      'how',
      'the',
      'a',
      'an',
      'of',
      'is',
      'are',
    ];
    const indonesianKeywords = [
      'siapa',
      'apa',
      'dimana',
      'bagaimana',
      'mengapa',
      'di',
      'pada',
      'adalah',
      'ini',
      'itu',
    ];

    const lowerQuery = query.toLowerCase();

    const itScore = italianKeywords.filter((word) => lowerQuery.includes(word)).length;
    const enScore = englishKeywords.filter((word) => lowerQuery.includes(word)).length;
    const idScore = indonesianKeywords.filter((word) => lowerQuery.includes(word)).length;

    const maxScore = Math.max(itScore, enScore, idScore);
    const totalScore = itScore + enScore + idScore;

    if (totalScore === 0) return 'mixed';
    if (maxScore / totalScore > 0.7) {
      if (itScore === maxScore) return 'it';
      if (enScore === maxScore) return 'en';
      if (idScore === maxScore) return 'id';
    }

    return 'mixed';
  }

  // =====================================================
  // ENTITY EXTRACTION
  // =====================================================

  private async extractEntities(query: string, language: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    // 1. Person Names Extraction
    const personEntities = await this.extractPersonNames(query, language);
    entities.push(...personEntities);

    // 2. Role/Title Extraction
    const roleEntities = this.extractRoles(query, language);
    entities.push(...roleEntities);

    // 3. Department Extraction
    const deptEntities = this.extractDepartments(query, language);
    entities.push(...deptEntities);

    // 4. Email Extraction
    const emailEntities = this.extractEmails(query);
    entities.push(...emailEntities);

    // 5. Phone Number Extraction
    const phoneEntities = this.extractPhones(query);
    entities.push(...phoneEntities);

    // 6. Service Extraction
    const serviceEntities = this.extractServices(query, language);
    entities.push(...serviceEntities);

    // 7. Company Name Extraction
    const companyEntities = this.extractCompanies(query, language);
    entities.push(...companyEntities);

    // 8. Location Extraction
    const locationEntities = this.extractLocations(query, language);
    entities.push(...locationEntities);

    // 9. Date Extraction
    const dateEntities = this.extractDates(query, language);
    entities.push(...dateEntities);

    // 10. Price/Cost Extraction
    const priceEntities = this.extractPrices(query, language);
    entities.push(...priceEntities);

    // 11. Expertise/Skills Extraction
    const expertiseEntities = this.extractExpertise(query, language);
    entities.push(...expertiseEntities);

    // Filter and sort by confidence
    return entities
      .filter((entity) => entity.confidence >= this.config.confidence_threshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  // =====================================================
  // PERSON NAMES EXTRACTION
  // =====================================================

  private async extractPersonNames(query: string, _language: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    // Ensure team member cache is fresh
    await this.refreshTeamMemberCache();

    // Check for team members first (highest confidence)
    for (const [memberId, memberData] of this.teamMemberCache) {
      const variations = [
        memberData.name,
        ...(memberData.name_variations || []),
        memberData.name.split(' ')[0], // First name only
        memberData.name.split(' ').slice(1).join(' '), // Last name only
      ];

      for (const variation of variations) {
        const regex = new RegExp(`\\b${this.escapeRegExp(variation)}\\b`, 'gi');
        const match = query.match(regex);

        if (match) {
          const position = query.indexOf(match[0]);
          entities.push({
            text: match[0],
            type: 'person',
            confidence: 0.95 + (match[0] === memberData.name ? 0.05 : 0),
            position: {
              start: position,
              end: position + match[0].length,
            },
            normalized_value: memberData.name,
            metadata: {
              member_id: memberId,
              role: memberData.role,
              department: memberData.department,
              email: memberData.email,
            },
          });
        }
      }
    }

    // Pattern-based name extraction for non-team members
    const nameRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const matches = query.match(nameRegex);

    if (matches) {
      for (const match of matches) {
        // Skip if already matched as team member
        if (!entities.find((e) => e.normalized_value === match)) {
          const position = query.indexOf(match);
          entities.push({
            text: match,
            type: 'person',
            confidence: 0.6,
            position: {
              start: position,
              end: position + match.length,
            },
            metadata: {
              source: 'pattern_matching',
              likely_indonesian: this.isIndonesianName(match),
            },
          });
        }
      }
    }

    return entities;
  }

  // =====================================================
  // ROLE/TITLE EXTRACTION
  // =====================================================

  private extractRoles(query: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const roleKeywords = {
      it: {
        ceo: ['ceo', 'amministratore delegato', 'direttore generale', 'presidente'],
        manager: ['manager', 'responsabile', 'capo', 'team lead', 'capo squadra'],
        consultant: ['consulente', 'consultant', 'consulenza', 'esperto'],
        specialist: ['specialista', 'specialist consultant', 'esperto'],
        advisor: ['consulente', 'advisor', 'consigliere'],
        expert: ['esperto', 'specialista', 'professionista'],
        director: ['direttore', 'director'],
        coordinator: ['coordinatore', 'coordinator'],
        analyst: ['analista', 'analyst'],
        developer: ['sviluppatore', 'developer', 'programmatore'],
        engineer: ['ingegnere', 'engineer', 'ing'],
        architect: ['architetto', 'architect', 'arch'],
        designer: ['designer', 'grafico', 'grafica'],
        trainer: ['formatore', 'trainer'],
        consultant_senior: ['consulente senior', 'senior consultant'],
        consultant_junior: ['consulente junior', 'junior consultant'],
      },
      en: {
        ceo: ['ceo', 'chief executive', 'president', 'executive director'],
        manager: ['manager', 'team lead', 'head', 'supervisor'],
        consultant: ['consultant', 'advisor', 'expert'],
        specialist: ['specialist', 'expert', 'professional'],
        advisor: ['advisor', 'consultant', 'counselor'],
        expert: ['expert', 'specialist', 'professional'],
        director: ['director', 'head'],
        coordinator: ['coordinator', 'organizer'],
        analyst: ['analyst', 'researcher'],
        developer: ['developer', 'programmer', 'software engineer'],
        engineer: ['engineer', 'eng', 'technical engineer'],
        architect: ['architect', 'arch', 'system architect'],
        designer: ['designer', 'graphic designer', 'ui designer'],
        trainer: ['trainer', 'instructor'],
        senior_consultant: ['senior consultant', 'lead consultant'],
        junior_consultant: ['junior consultant', 'associate consultant'],
      },
      id: {
        ceo: ['ceo', 'direktur utama', 'presiden direktur', 'komisaris'],
        manager: ['manager', 'manajer', 'pemimpin', 'ketua tim'],
        consultant: ['konsultan', 'ahli', 'pakar'],
        specialist: ['spesialis', 'ahli spesialis'],
        advisor: ['penasihat', 'konsultan'],
        expert: ['ahli', 'pakar', 'spesialis'],
        director: ['direktur', 'direksi'],
        coordinator: ['koordinator'],
        analyst: ['analis', 'penganalisis'],
        developer: ['pengembang', 'programmer'],
        engineer: ['insinyur'],
        architect: ['arsitek'],
        designer: ['desainer', 'perancang'],
      },
    };

    const roles = (roleKeywords as Record<string, any>)[language] || (roleKeywords as Record<string, any>)['mixed'];

    for (const [roleType, keywords] of Object.entries(roles)) {
      const keywordsArray = Array.isArray(keywords) ? keywords : [];
      for (const keyword of keywordsArray) {
        const regex = new RegExp(`\\b${this.escapeRegExp(keyword)}\\b`, 'gi');
        const matches = query.match(regex);

        if (matches) {
          for (const match of matches) {
            const position = query.indexOf(match);
            entities.push({
              text: match,
              type: 'role',
              confidence: 0.8,
              position: {
                start: position,
                end: position + match.length,
              },
              normalized_value: roleType,
              metadata: {
                keyword_matched: keyword,
                role_category: roleType,
              },
            });
          }
        }
      }
    }

    return entities;
  }

  // =====================================================
  // DEPARTMENT EXTRACTION
  // =====================================================

  private extractDepartments(query: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const departments = {
      it: [
        'management',
        'direzione',
        'amministrazione',
        'tecnologia',
        'tech',
        'tax',
        'fiscale',
        'marketing',
        'vendite',
        'ricorsi umani',
        'hr',
        'finanza',
        'legale',
        'consulenza',
        'reception',
        'assistenza clienti',
        'operazioni',
      ],
      en: [
        'management',
        'executive',
        'technology',
        'tech',
        'tax',
        'finance',
        'marketing',
        'sales',
        'human resources',
        'hr',
        'legal',
        'consulting',
        'reception',
        'customer service',
        'operations',
      ],
      id: [
        'manajemen',
        'direksi',
        'teknologi',
        'tax',
        'pajak',
        'keuangan',
        'marketing',
        'sumber daya manusia',
        'hr',
        'hukum',
        'konsultasi',
        'resepsionis',
        'pelayanan pelanggan',
        'operasional',
      ],
    };

    const deptKeywords = (departments as Record<string, string[]>)[language] || (departments as Record<string, string[]>)['mixed'];

    for (const dept of deptKeywords) {
      const regex = new RegExp(`\\b${this.escapeRegExp(dept)}\\b`, 'gi');
      const matches = query.match(regex);

      if (matches) {
        for (const match of matches) {
          const position = query.indexOf(match);
          entities.push({
            text: match,
            type: 'department',
            confidence: 0.9,
            position: {
              start: position,
              end: position + match.length,
            },
            metadata: {
              department_type: dept,
            },
          });
        }
      }
    }

    return entities;
  }

  // =====================================================
  // EMAIL EXTRACTION
  // =====================================================

  private extractEmails(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = query.match(emailRegex);

    if (matches) {
      for (const match of matches) {
        const position = query.indexOf(match);
        entities.push({
          text: match,
          type: 'email',
          confidence: 0.95,
          position: {
            start: position,
            end: position + match.length,
          },
          metadata: {
            domain: match.split('@')[1],
            is_bali_zero: match.includes('@balizero.com'),
          },
        });
      }
    }

    return entities;
  }

  // =====================================================
  // PHONE NUMBER EXTRACTION
  // =====================================================

  private extractPhones(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Phone patterns for Indonesian numbers
    const phonePatterns = [
      /\b(?:\+62|62|0)[2-9]\d{8,11}\b/g, // Indonesian mobile/landline
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // XXX-XXX-XXXX format
      /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, // XXXX-XXXX-XXXX format
    ];

    for (const pattern of phonePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        for (const match of matches) {
          const position = query.indexOf(match);
          entities.push({
            text: match,
            type: 'phone',
            confidence: 0.9,
            position: {
              start: position,
              end: position + match.length,
            },
            metadata: {
              formatted: match.replace(/[^\d+]/g, ''),
              type: this.getPhoneType(match),
            },
          });
        }
      }
    }

    return entities;
  }

  // =====================================================
  // SERVICE EXTRACTION
  // =====================================================

  private extractServices(query: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Service keywords are now retrieved from the database via RAG backend
    // This method should delegate to RAG for service extraction to ensure accuracy
    // For now, using generic service category detection without hardcoded values
    const genericServicePatterns = {
      it: ['visa', 'permesso', 'azienda', 'società', 'fiscale', 'tasse', 'immobiliare', 'legale'],
      en: ['visa', 'permit', 'company', 'business', 'tax', 'legal', 'property', 'real estate'],
      id: ['visa', 'izin', 'perusahaan', 'pajak', 'hukum', 'properti'],
    };

    const serviceKeywords = (genericServicePatterns as Record<string, string[]>)[language] || [];

    for (const service of serviceKeywords) {
      const regex = new RegExp(`\\b${this.escapeRegExp(service)}\\b`, 'gi');
      const matches = query.match(regex);

      if (matches) {
        for (const match of matches) {
          const position = query.indexOf(match);
          entities.push({
            text: match,
            type: 'service',
            confidence: 0.85,
            position: {
              start: position,
              end: position + match.length,
            },
            metadata: {
              service_category: this.getServiceCategory(match),
              service_type: match.toLowerCase(),
            },
          });
        }
      }
    }

    return entities;
  }

  // =====================================================
  // COMPANY NAME EXTRACTION
  // =====================================================

  private extractCompanies(query: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Known company patterns
    const knownCompanies = {
      it: [
        'pt',
        'cv',
        'ud',
        ' Firma',
        'mandiri',
        'bca',
        'bni',
        'bri',
        'telkomsel',
        'xl',
        'indosat',
        'pertamina',
        'garuda indonesia',
      ],
      en: [
        'pt',
        'cv',
        'ud',
        'pt pma',
        'limited',
        'corporation',
        'ltd',
        'inc',
        'llc',
        'mandiri',
        'bca',
        'bni',
        'bri',
        'telkomsel',
        'xl',
        'indosat',
        'pertamina',
        'garuda indonesia',
      ],
      id: [
        'pt',
        'cv',
        'ud',
        'perseroan terbatas',
        'perseroan komanditer',
        'mandiri',
        'bca',
        'bni',
        'bri',
        'telkomsel',
        'xl',
        'indosat',
        'pertamina',
        'garuda indonesia',
      ],
    };

    const companies = (knownCompanies as Record<string, string[]>)[language] || (knownCompanies as Record<string, string[]>)['mixed'];

    for (const company of companies) {
      const regex = new RegExp(`\\b${this.escapeRegExp(company)}\\b`, 'gi');
      const matches = query.match(regex);

      if (matches) {
        for (const match of matches) {
          const position = query.indexOf(match);
          entities.push({
            text: match,
            type: 'company',
            confidence: 0.7,
            position: {
              start: position,
              end: position + match.length,
            },
            metadata: {
              company_type: this.getCompanyType(match),
            },
          });
        }
      }
    }

    return entities;
  }

  // =====================================================
  // LOCATION EXTRACTION
  // =====================================================

  private extractLocations(query: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const locations = {
      it: [
        'jakarta',
        'bali',
        'denpasar',
        'surabaya',
        'bandung',
        'medan',
        'semarang',
        'makassar',
        'palembang',
        'tangerang',
        'depok',
        'bekasi',
        'bogor',
        'batam',
        'indonesia',
      ],
      en: [
        'jakarta',
        'bali',
        'denpasar',
        'surabaya',
        'bandung',
        'medan',
        'semarang',
        'makassar',
        'palembang',
        'tangerang',
        'depok',
        'bekasi',
        'bogor',
        'batam',
        'indonesia',
      ],
      id: [
        'jakarta',
        'bali',
        'denpasar',
        'surabaya',
        'bandung',
        'medan',
        'semarang',
        'makassar',
        'palembang',
        'tangerang',
        'depok',
        'bekasi',
        'bogor',
        'batam',
        'indonesia',
      ],
    };

    const locationKeywords = (locations as Record<string, string[]>)[language] || (locations as Record<string, string[]>)['mixed'];

    for (const location of locationKeywords) {
      const regex = new RegExp(`\\b${this.escapeRegExp(location)}\\b`, 'gi');
      const matches = query.match(regex);

      if (matches) {
        for (const match of matches) {
          const position = query.indexOf(match);
          entities.push({
            text: match,
            type: 'location',
            confidence: 0.8,
            position: {
              start: position,
              end: position + match.length,
            },
            metadata: {
              location_type: this.getLocationType(match),
            },
          });
        }
      }
    }

    return entities;
  }

  // =====================================================
  // DATE EXTRACTION
  // =====================================================

  private extractDates(query: string, _language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g, // MM-DD-YYYY
      /\b\d{4}-\d{2}-\d{2}\b/g, // YYYY-MM-DD
      /\b(?:today|tomorrow|yesterday|oggi|besok|kemarin)\b/gi, // Relative dates
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\b/gi,
    ];

    for (const pattern of datePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        for (const match of matches) {
          const position = query.indexOf(match);
          entities.push({
            text: match,
            type: 'date',
            confidence: 0.9,
            position: {
              start: position,
              end: position + match.length,
            },
            metadata: {
              date_format: this.getDateFormat(match),
              normalized_date: this.normalizeDate(match),
            },
          });
        }
      }
    }

    return entities;
  }

  // =====================================================
  // PRICE EXTRACTION
  // =====================================================

  private extractPrices(query: string, _language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const pricePatterns = [
      /\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g, // $1,000.00
      /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:usd|dollar|\$|ribu|juta|juta)\b/gi, // 1,000 USD, 1 juta
      /\b(?:rp|idr)\s*\d{1,3}(?:\.\d{3})*(?:,\d{3})?\b/gi, // RP 1.000.000
      /\b\d{1,3}(?:\.\d{3})*(?:,\d{3})?\s*(?:rp|idr)\b/gi, // 1.000.000 RP
    ];

    for (const pattern of pricePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        for (const match of matches) {
          const position = query.indexOf(match);
          entities.push({
            text: match,
            type: 'price',
            confidence: 0.85,
            position: {
              start: position,
              end: position + match.length,
            },
            metadata: {
              currency: this.detectCurrency(match),
              amount: this.parseAmount(match),
              normalized_amount: this.normalizeAmount(match),
            },
          });
        }
      }
    }

    return entities;
  }

  // =====================================================
  // EXPERTISE/SKILLS EXTRACTION
  // =====================================================

  private extractExpertise(query: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const expertiseKeywords = {
      it: [
        'imposte',
        'tassazione',
        'contabilità',
        'finanza',
        'marketing digitale',
        'social media',
        'sviluppo software',
        'intelligenza artificiale',
        'machine learning',
        'data analysis',
        'business intelligence',
        'gestione progetti',
        'risorse umane',
        'legale',
        'consulenza aziendale',
        'strategia business',
        'sviluppo web',
        'e-commerce',
        'blockchain',
        'cybersecurity',
      ],
      en: [
        'tax',
        'accounting',
        'finance',
        'digital marketing',
        'social media',
        'software development',
        'artificial intelligence',
        'machine learning',
        'data analysis',
        'business intelligence',
        'project management',
        'human resources',
        'legal',
        'business consulting',
        'business strategy',
        'web development',
        'e-commerce',
        'blockchain',
        'cybersecurity',
      ],
      id: [
        'pajak',
        'akuntansi',
        'keuangan',
        'pemasaran digital',
        'media sosial',
        'pengembangan perangkat lunak',
        'kecerdasan buatan',
        'machine learning',
        'analisis data',
        'business intelligence',
        'manajemen proyek',
        'sumber daya manusia',
        'hukum',
        'konsultasi bisnis',
        'strategi bisnis',
        'pengembangan web',
        'e-commerce',
        'blockchain',
        'keamanan siber',
      ],
    };

    const expertise = (expertiseKeywords as Record<string, string[]>)[language] || (expertiseKeywords as Record<string, string[]>)['mixed'];

    for (const skill of expertise) {
      const regex = new RegExp(`\\b${this.escapeRegExp(skill)}\\b`, 'gi');
      const matches = query.match(regex);

      if (matches) {
        for (const match of matches) {
          const position = query.indexOf(match);
          entities.push({
            text: match,
            type: 'expertise',
            confidence: 0.75,
            position: {
              start: position,
              end: position + match.length,
            },
            metadata: {
              expertise_category: this.getExpertiseCategory(skill),
              skill_level: this.assessSkillLevel(query, match),
            },
          });
        }
      }
    }

    return entities;
  }

  // =====================================================
  // INTENT CLASSIFICATION
  // =====================================================

  private classifyIntent(query: string, entities: ExtractedEntity[], _language: string): string {
    const personEntities = entities.filter((e) => e.type === 'person');
    const serviceEntities = entities.filter((e) => e.type === 'service');
    const priceEntities = entities.filter((e) => e.type === 'price');

    // Check for specific intents
    if (
      this.containsWords(query, [
        'who is',
        'chi è',
        'siapa',
        'chi é',
        'who is',
        'tell me about',
        'dimmi di',
        'cerca',
        'cari',
      ])
    ) {
      return 'person_inquiry';
    }

    if (
      this.containsWords(query, ['how much', 'quanto costa', 'harga', 'price', 'cost', 'biaya'])
    ) {
      return 'pricing_inquiry';
    }

    if (
      this.containsWords(query, ['contact', 'email', 'phone', 'contatta', 'telefono', 'chiamare'])
    ) {
      return 'contact_inquiry';
    }

    if (serviceEntities.length > 0) {
      return 'service_inquiry';
    }

    if (priceEntities.length > 0) {
      return 'pricing_inquiry';
    }

    if (personEntities.length > 0) {
      return 'person_inquiry';
    }

    if (
      this.containsWords(query, [
        'help',
        'aiuto',
        'assistenza',
        'support',
        'problem',
        'problema',
        'issue',
      ])
    ) {
      return 'help_request';
    }

    if (
      this.containsWords(query, ['what', 'cosa', 'what is', 'che cosa', 'apa', 'explain', 'spiega'])
    ) {
      return 'information_request';
    }

    return 'general_inquiry';
  }

  // =====================================================
  // SENTIMENT ANALYSIS
  // =====================================================

  private analyzeSentiment(query: string, language: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = {
      it: [
        'ottimo',
        'eccellente',
        'perfetto',
        'bravo',
        'grazie',
        'fantastico',
        'meraviglioso',
        'bello',
        'ottimo lavoro',
        'soddisfatto',
      ],
      en: [
        'excellent',
        'perfect',
        'great',
        'good',
        'thank you',
        'fantastic',
        'wonderful',
        'beautiful',
        'satisfied',
      ],
      id: ['bagus', 'hebat', 'terima kasih', 'luar biasa', 'mantap', 'puas', 'memuaskan'],
    };

    const negativeWords = {
      it: [
        'scarso',
        'terribile',
        'pessimo',
        'problema',
        'errore',
        'fallito',
        'deluso',
        'scontento',
        'triste',
        'difficile',
      ],
      en: [
        'bad',
        'terrible',
        'poor',
        'problem',
        'error',
        'failed',
        'disappointed',
        'sad',
        'difficult',
      ],
      id: ['buruk', 'jelek', 'masalah', 'kesalahan', 'gagal', 'kecewa', 'sedih', 'sulit'],
    };

    const posWords = (positiveWords as Record<string, string[]>)[language] || (positiveWords as Record<string, string[]>)['mixed'];
    const negWords = (negativeWords as Record<string, string[]>)[language] || (negativeWords as Record<string, string[]>)['mixed'];

    const lowerQuery = query.toLowerCase();

    const posCount = posWords.filter((word) => lowerQuery.includes(word)).length;
    const negCount = negWords.filter((word) => lowerQuery.includes(word)).length;

    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
  }

  // =====================================================
  // URGENCY DETECTION
  // =====================================================

  private detectUrgency(query: string, language: string): 'low' | 'medium' | 'high' {
    const urgentWords = {
      it: ['urgente', 'immediato', 'subito', 'ora', 'adesso', 'emergenza', 'critico', 'importante'],
      en: ['urgent', 'immediate', 'now', 'asap', 'emergency', 'critical', 'important'],
      id: [
        'segera',
        'sekarang',
        'segera ini',
        'darurat',
        'penting',
        'penting sekali',
        'kritikal',
        'penting',
      ],
    };

    const urgent = (urgentWords as Record<string, string[]>)[language] || (urgentWords as Record<string, string[]>)['mixed'];
    const lowerQuery = query.toLowerCase();

    const urgentCount = urgent.filter((word) => lowerQuery.includes(word)).length;

    if (urgentCount >= 2) return 'high';
    if (urgentCount === 1) return 'medium';
    return 'low';
  }

  // =====================================================
  // COMPLEXITY ASSESSMENT
  // =====================================================

  private assessComplexity(
    query: string,
    entities: ExtractedEntity[]
  ): 'simple' | 'moderate' | 'complex' {
    // Simple: short query, few entities
    if (query.length < 50 && entities.length <= 2) return 'simple';

    // Complex: long query with many entities
    if (query.length > 150 || entities.length > 5) return 'complex';

    // Moderate: medium complexity
    return 'moderate';
  }

  // =====================================================
  // KEYWORD EXTRACTION
  // =====================================================

  private extractKeywords(query: string, language: string): string[] {
    const stopWords = {
      it: [
        'il',
        'lo',
        'la',
        'i',
        'gli',
        'le',
        'un',
        'una',
        'di',
        'a',
        'da',
        'in',
        'con',
        'su',
        'per',
        'tra',
        'fra',
        'anche',
        'e',
        'o',
        'ma',
        'se',
        'che',
        'non',
        'più',
      ],
      en: [
        'the',
        'a',
        'an',
        'and',
        'or',
        'but',
        'if',
        'in',
        'on',
        'at',
        'to',
        'for',
        'of',
        'with',
        'by',
        'from',
        'up',
        'about',
        'into',
        'through',
        'during',
        'before',
        'after',
        'above',
        'below',
        'between',
      ],
      id: [
        'yang',
        'dan',
        'atau',
        'tapi',
        'jika',
        'untuk',
        'dari',
        'pada',
        'di',
        'dengan',
        'ke',
        'kepada',
        'adalah',
        'itu',
        'ini',
        'itu',
        'itu',
      ],
    };

    const stops = (stopWords as Record<string, string[]>)[language] || (stopWords as Record<string, string[]>)['mixed'];
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stops.includes(word));

    // Remove duplicates and return
    return [...new Set(words)];
  }

  // =====================================================
  // BUSINESS CONTEXT ANALYSIS
  // =====================================================

  private async analyzeBusinessContext(
    query: string,
    entities: ExtractedEntity[],
    language: string
  ): Promise<any> {
    const context = {
      business_stage: this.detectBusinessStage(query, entities),
      customer_type: this.detectCustomerType(query, entities),
      service_needed: this.detectServiceNeeded(entities),
      budget_indicators: this.detectBudgetIndicators(query, entities),
      timeline: this.detectTimeline(query, language),
      decision_maker: this.detectDecisionMaker(query, entities),
      compliance_required: this.detectComplianceRequired(entities),
    };

    return context;
  }

  private detectBusinessStage(query: string, _entities: ExtractedEntity[]): string {
    if (this.containsWords(query, ['idea', 'thinking', 'considering', 'valutando', 'pensando'])) {
      return 'exploration';
    }
    if (
      this.containsWords(query, [
        'planning',
        'preparing',
        'setting up',
        'pianificazione',
        'preparazione',
      ])
    ) {
      return 'planning';
    }
    if (
      this.containsWords(query, [
        'ready',
        'start',
        'implement',
        'execute',
        'pronto',
        'iniziare',
        'implementare',
      ])
    ) {
      return 'execution';
    }
    if (
      this.containsWords(query, ['expand', 'grow', 'scale', 'additional', 'espandere', 'crescere'])
    ) {
      return 'expansion';
    }
    return 'unknown';
  }

  private detectCustomerType(query: string, entities: ExtractedEntity[]): string {
    if (
      entities.some(
        (e) => e.type === 'person' && this.containsWords(e.text, ['freelance', 'individual'])
      )
    ) {
      return 'freelance';
    }
    if (this.containsWords(query, ['company', 'corporation', 'business', 'azienda', 'impresa'])) {
      return 'corporate';
    }
    if (this.containsWords(query, ['startup', 'new business', 'nuova azienda'])) {
      return 'startup';
    }
    return 'unknown';
  }

  private detectServiceNeeded(entities: ExtractedEntity[]): string[] {
    return entities.filter((e) => e.type === 'service').map((e) => e.text.toLowerCase());
  }

  private detectBudgetIndicators(_query: string, entities: ExtractedEntity[]): any {
    const priceEntities = entities.filter((e) => e.type === 'price');

    if (priceEntities.length === 0) return null;

    const amounts = priceEntities.map((e) => e.metadata?.normalized_amount || 0);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    return {
      has_budget: true,
      average_amount: avgAmount,
      currency: 'USD',
      budget_range: avgAmount < 1000 ? 'low' : avgAmount < 10000 ? 'medium' : 'high',
    };
  }

  private detectTimeline(query: string, _language: string): string {
    if (this.containsWords(query, ['asap', 'urgent', 'immediately', 'subito', 'urgente'])) {
      return 'immediate';
    }
    if (
      this.containsWords(query, [
        'this week',
        'next week',
        'questa settimana',
        'prossima settimana',
      ])
    ) {
      return 'week';
    }
    if (this.containsWords(query, ['this month', 'next month', 'questo mese', 'prossimo mese'])) {
      return 'month';
    }
    return 'flexible';
  }

  private detectDecisionMaker(query: string, _entities: ExtractedEntity[]): string {
    if (this.containsWords(query, ['i need', 'we need', 'ho bisogno', 'abbiamo bisogno'])) {
      return 'self';
    }
    if (
      this.containsWords(query, ['my boss', 'manager', 'supervisor', 'mio capo', 'il mio capo'])
    ) {
      return 'manager';
    }
    if (this.containsWords(query, ['client', 'customer', 'cliente', 'cliente'])) {
      return 'client';
    }
    return 'unknown';
  }

  private detectComplianceRequired(entities: ExtractedEntity[]): string[] {
    const complianceServices = ['tax', 'legal', 'visa', 'work permit', 'business license'];

    return entities
      .filter(
        (e) =>
          e.type === 'service' &&
          complianceServices.some((service) => e.text.toLowerCase().includes(service))
      )
      .map((e) => e.text.toLowerCase());
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  private async refreshTeamMemberCache(): Promise<void> {
    const now = Date.now();

    // Refresh cache every 5 minutes
    if (now - this.lastCacheUpdate > 300000) {
      try {
        const teamMembers = await this.database.getAllTeamMembers();
        this.teamMemberCache.clear();

        for (const member of teamMembers) {
          this.teamMemberCache.set(member.name.toLowerCase(), member);
          // Also cache variations
          if (member.name_variations) {
            for (const variation of member.name_variations) {
              this.teamMemberCache.set(variation.toLowerCase(), member);
            }
          }
        }

        this.lastCacheUpdate = now;
        logger.info(`🔄 Team member cache refreshed with ${teamMembers.length} members`);
      } catch (error: any) {
        logger.error('❌ Failed to refresh team member cache:', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private containsWords(text: string, words: string[]): boolean {
    const lowerText = text.toLowerCase();
    return words.some((word) => lowerText.includes(word));
  }

  private isIndonesianName(name: string): boolean {
    const indonesianNames = [
      'surya',
      'dewa',
      'made',
      'wayan',
      'ketut',
      'putu',
      'gusti',
      'ni made',
      'i made',
      'komang',
      'nyoman',
      'id',
      'bayu',
    ];
    const lowerName = name.toLowerCase();
    return indonesianNames.some((indName) => lowerName.includes(indName));
  }

  private getPhoneType(phone: string): string {
    const cleanPhone = phone.replace(/[^\d]/g, '');

    if (cleanPhone.startsWith('62') || cleanPhone.startsWith('0')) {
      return 'indonesian';
    }
    return 'international';
  }

  private getServiceCategory(service: string): string {
    // Service categorization now uses generic patterns only
    // Specific service types (kitas, pt pma, npwp, etc.) are stored in the database
    const lowerService = service.toLowerCase();

    // Generic category detection based on keywords (not specific service names)
    if (lowerService.includes('visa') || lowerService.includes('permit') || lowerService.includes('immigration')) {
      return 'immigration';
    }
    if (lowerService.includes('company') || lowerService.includes('business') || lowerService.includes('registration')) {
      return 'company_registration';
    }
    if (lowerService.includes('tax') || lowerService.includes('pajak')) {
      return 'tax';
    }
    if (lowerService.includes('legal') || lowerService.includes('hukum')) {
      return 'legal';
    }
    if (lowerService.includes('property') || lowerService.includes('real estate') || lowerService.includes('properti')) {
      return 'property';
    }

    return 'general';
  }

  private getCompanyType(company: string): string {
    if (company.toLowerCase().includes('pt')) return 'PT';
    if (company.toLowerCase().includes('cv')) return 'CV';
    if (company.toLowerCase().includes('ud')) return 'UD';
    if (company.toLowerCase().includes('limited') || company.toLowerCase().includes('ltd'))
      return 'Limited';
    if (company.toLowerCase().includes('corporation') || company.toLowerCase().includes('corp'))
      return 'Corporation';
    return 'Unknown';
  }

  private getLocationType(location: string): string {
    const capitals = ['jakarta', 'denpasar', 'surabaya', 'bandung'];
    if (capitals.some((cap) => location.toLowerCase() === cap.toLowerCase())) {
      return 'major_city';
    }
    return 'general';
  }

  private getDateFormat(date: string): string {
    if (date.includes('/')) return 'MM/DD/YYYY';
    if (date.includes('-') && date.length === 10) return 'MM-DD-YYYY';
    if (date.includes('-') && date.length === 8) return 'YYYY-MM-DD';
    return 'unknown';
  }

  private normalizeDate(date: string): string {
    // Simple normalization - in a real implementation this would be more sophisticated
    return date;
  }

  private detectCurrency(text: string): string {
    if (text.toLowerCase().includes('usd') || text.includes('$')) return 'USD';
    if (text.toLowerCase().includes('idr') || text.toLowerCase().includes('rp')) return 'IDR';
    if (text.toLowerCase().includes('ribu') || text.toLowerCase().includes('juta')) return 'IDR';
    return 'USD';
  }

  private parseAmount(text: string): number {
    // Remove non-numeric characters and convert
    const cleanText = text.replace(/[^\d.]/g, '');
    return parseFloat(cleanText) || 0;
  }

  private normalizeAmount(text: string): number {
    const amount = this.parseAmount(text);

    // Convert Indonesian units
    if (text.toLowerCase().includes('ribu')) {
      return amount * 1000;
    }
    if (text.toLowerCase().includes('juta')) {
      return amount * 1000000;
    }

    return amount;
  }

  private getExpertiseCategory(skill: string): string {
    const categories = {
      tax: 'finance',
      accounting: 'finance',
      finance: 'finance',
      marketing: 'marketing',
      software: 'technology',
      development: 'technology',
      ai: 'technology',
      'artificial intelligence': 'technology',
      'machine learning': 'technology',
      data: 'technology',
      project: 'management',
      'human resources': 'management',
      legal: 'legal',
      consulting: 'business',
    };

    const lowerSkill = skill.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      const keywordsArray = Array.isArray(keywords) ? keywords : [];
      if (keywordsArray.some((keyword) => lowerSkill.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private assessSkillLevel(query: string, _skill: string): string {
    if (
      query.toLowerCase().includes('senior') ||
      query.toLowerCase().includes('lead') ||
      query.toLowerCase().includes('head')
    ) {
      return 'senior';
    }
    if (query.toLowerCase().includes('junior') || query.toLowerCase().includes('associate')) {
      return 'junior';
    }
    return 'intermediate';
  }
}

export default AdvancedNLPSystem;
