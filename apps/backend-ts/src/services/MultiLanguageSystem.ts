import { AdvancedNLPSystem, QueryAnalysis } from './AdvancedNLPSystem';

// =====================================================
// MULTI-LANGUAGE EXPANSION SYSTEM
// =====================================================

export interface TranslationResult {
  text: string;
  source_language: string;
  target_language: string;
  confidence: number;
  detected_entities?: ExtractedEntity[];
  translated_entities?: ExtractedEntity[];
}

export interface LocalizedResponse {
  original_text: string;
  localized_text: string;
  language: 'it' | 'en' | 'id';
  cultural_adaptations: CulturalAdaptation[];
  localized_entities: LocalizedEntity[];
  context_preservation: boolean;
}

export interface CulturalAdaptation {
  type: 'greeting' | 'formality' | 'business_etiquette' | 'religious_consideration' | 'time_perception' | 'communication_style';
  original: string;
  adapted: string;
  reason: string;
}

export interface LocalizedEntity {
  original_text: string;
  localized_text: string;
  entity_type: string;
  cultural_context: string;
  confidence: number;
}

export interface LanguageProfile {
  language: 'it' | 'en' | 'id';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native';
  preference: number; // 0-1 scale
  context_history: ContextHistory[];
}

export interface ContextHistory {
  session_id: string;
  timestamp: Date;
  language_used: string;
  query_type: string;
  user_satisfaction?: number;
  response_quality?: number;
}

export class MultiLanguageSystem {
  private nlpSystem: AdvancedNLPSystem;
  private userProfiles: Map<string, LanguageProfile> = new Map();
  private translationCache: Map<string, TranslationResult> = new Map();
  private localizationTemplates: Map<string, Map<string, string>> = new Map();

  constructor(nlpSystem: AdvancedNLPSystem) {
    this.nlpSystem = nlpSystem;
    this.initializeLocalizationTemplates();
  }

  // =====================================================
  // MAIN LANGUAGE PROCESSING
  // =====================================================

  async processQueryWithLanguage(
    query: string,
    userId: string,
    preferredLanguage?: string,
    context?: any
  ): Promise<LocalizedResponse> {
    // 1. Detect query language
    const detectedLanguage = this.detectQueryLanguage(query);

    // 2. Get user language profile
    const userProfile = this.getUserLanguageProfile(userId);

    // 3. Determine optimal response language
    const targetLanguage = await this.determineOptimalLanguage(
      detectedLanguage,
      userProfile,
      preferredLanguage,
      context
    );

    // 4. Perform NLP analysis in detected language
    const nlpAnalysis = await this.nlpSystem.analyzeQuery(query, detectedLanguage.language);

    // 5. Generate culturally adapted response
    const localizedResponse = await this.generateLocalizedResponse(
      nlpAnalysis,
      targetLanguage,
      userProfile,
      context
    );

    // 6. Update user profile
    await this.updateUserLanguageProfile(userId, targetLanguage, nlpAnalysis);

    return localizedResponse;
  }

  // =====================================================
  // LANGUAGE DETECTION
  // =====================================================

  private detectQueryLanguage(query: string): { language: 'it' | 'en' | 'id' | 'mixed'; confidence: number } {
    const languageIndicators = {
      it: {
        words: ['chi', 'qual', 'dove', 'come', 'quando', 'perché', 'il', 'la', 'lo', 'un', 'una', 'del', 'della', 'dei', 'delle', 'è', 'sono', 'stato'],
        phrases: ['scusi', 'grazie', 'per favore', 'mi scusi', 'prego', 'gentilmente'],
        characters: ['à', 'è', 'é', 'ì', 'ò', 'ù']
      },
      en: {
        words: ['who', 'what', 'where', 'when', 'why', 'how', 'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'],
        phrases: ['excuse me', 'thank you', 'please', 'sorry', 'pardon'],
        characters: []
      },
      id: {
        words: ['siapa', 'apa', 'dimana', 'bagaimana', 'mengapa', 'di', 'pada', 'adalah', 'ini', 'itu', 'yang', 'dari', 'ke'],
        phrases: ['maaf', 'terima kasih', 'tolong', 'permisi', 'mohon maaf'],
        characters: []
      }
    };

    const lowerQuery = query.toLowerCase();
    let maxScore = 0;
    let detectedLang = 'mixed';

    for (const [lang, indicators] of Object.entries(languageIndicators)) {
      let score = 0;

      // Word matches
      score += indicators.words.filter(word => lowerQuery.includes(word)).length * 2;

      // Phrase matches
      score += indicators.phrases.filter(phrase => lowerQuery.includes(phrase)).length * 3;

      // Character matches
      score += indicators.characters.filter(char => [...lowerQuery].includes(char)).length * 1;

      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang as 'it' | 'en' | 'id';
      }
    }

    // Calculate confidence
    const totalIndicators = Object.values(languageIndicators).reduce(
      (total, lang) => total + lang.words.length + lang.phrases.length + lang.characters.length,
      0
    );
    const confidence = totalIndicators > 0 ? maxScore / totalIndicators : 0;

    return {
      language: detectedLang,
      confidence: Math.min(confidence, 1.0)
    };
  }

  // =====================================================
  // LANGUAGE PROFILE MANAGEMENT
  // =====================================================

  private getUserLanguageProfile(userId: string): LanguageProfile {
    if (!this.userProfiles.has(userId)) {
      const defaultProfile: LanguageProfile = {
        language: 'it', // Default to Italian
        proficiency: 'intermediate',
        preference: 0.7,
        context_history: []
      };
      this.userProfiles.set(userId, defaultProfile);
    }
    return this.userProfiles.get(userId)!;
  }

  private async updateUserLanguageProfile(
    userId: string,
    language: string,
    nlpAnalysis: QueryAnalysis
  ): Promise<void> {
    const profile = this.getUserLanguageProfile(userId);

    // Update language usage statistics
    profile.context_history.push({
      session_id: `session_${Date.now()}`,
      timestamp: new Date(),
      language_used: language,
      query_type: nlpAnalysis.intent,
      response_quality: undefined, // To be updated by feedback
      user_satisfaction: undefined
    });

    // Keep only last 50 interactions
    if (profile.context_history.length > 50) {
      profile.context_history = profile.context_history.slice(-50);
    }

    // Update proficiency based on usage patterns
    const recentUsage = profile.context_history.slice(-10);
    const sameLanguageUsage = recentUsage.filter(h => h.language_used === language).length;

    if (sameLanguageUsage >= 7) {
      profile.proficiency = 'advanced';
    } else if (sameLanguageUsage >= 4) {
      profile.proficiency = 'intermediate';
    } else {
      profile.proficiency = 'beginner';
    }

    this.userProfiles.set(userId, profile);
  }

  // =====================================================
  // OPTIMAL LANGUAGE DETERMINATION
  // =====================================================

  private async determineOptimalLanguage(
    detectedLanguage: { language: string; confidence: number },
    userProfile: LanguageProfile,
    preferredLanguage?: string,
    context?: any
  ): Promise<'it' | 'en' | 'id'> {
    // Priority 1: User preference if specified
    if (preferredLanguage) {
      if (['it', 'en', 'id'].includes(preferredLanguage)) {
        return preferredLanguage as 'it' | 'en' | 'id';
      }
    }

    // Priority 2: User profile preference
    if (userProfile.preference > 0.7) {
      return userProfile.language;
    }

    // Priority 3: High confidence detected language
    if (detectedLanguage.confidence > 0.8) {
      return detectedLanguage.language as 'it' | 'en' | 'id';
    }

    // Priority 4: Business context
    if (context && context.business_context) {
      const businessLanguage = this.determineBusinessLanguage(context.business_context);
      if (businessLanguage) {
        return businessLanguage;
      }
    }

    // Priority 5: Default to user profile language
    return userProfile.language;
  }

  private determineBusinessLanguage(businessContext: any): 'it' | 'en' | 'id' | null {
    // Indonesia context
    if (businessContext.location === 'indonesia' ||
        businessContext.customer_type === 'local_indonesian' ||
        businessContext.service_needed?.some((s: string) => s.includes('nib') || s.includes('siup'))) {
      return 'id';
    }

    // International business
    if (businessContext.customer_type === 'corporate' ||
        businessContext.service_needed?.some((s: string) => s.includes('international') || s.includes('expat'))) {
      return 'en';
    }

    // Default to Italian for Bali Zero
    return 'it';
  }

  // =====================================================
  // LOCALIZED RESPONSE GENERATION
  // =====================================================

  private async generateLocalizedResponse(
    nlpAnalysis: QueryAnalysis,
    targetLanguage: string,
    userProfile: LanguageProfile,
    context?: any
  ): Promise<LocalizedResponse> {
    // 1. Get response template
    const baseTemplate = this.getResponseTemplate(
      nlpAnalysis.intent,
      nlpLanguageAnalysis.entities,
      targetLanguage
    );

    // 2. Apply cultural adaptations
    const culturalAdaptations = await this.applyCulturalAdaptations(
      baseTemplate,
      targetLanguage,
      userProfile,
      nlpAnalysis
    );

    // 3. Localize entities
    const localizedEntities = await this.localizeEntities(
      nlpAnalysis.entities,
      targetLanguage,
      userProfile
    );

    // 4. Build final response
    let localizedText = baseTemplate;

    // Apply cultural adaptations
    for (const adaptation of culturalAdaptations) {
      localizedText = localizedText.replace(
        adaptation.original,
        adaptation.adapted
      );
    }

    // Replace localized entities
    for (const entity of localizedEntities) {
      const regex = new RegExp(this.escapeRegExp(entity.original_text), 'gi');
      localizedText = localizedText.replace(regex, entity.localized_text);
    }

    return {
      original_text: baseTemplate,
      localized_text: localizedText,
      language: targetLanguage as 'it' | 'en' | 'id',
      cultural_adaptations: culturalAdaptations,
      localized_entities: localizedEntities,
      context_preservation: true
    };
  }

  // =====================================================
  // RESPONSE TEMPLATES
  // =====================================================

  private getResponseTemplate(
    intent: string,
    entities: any[],
    language: string
  ): string {
    const templates = {
      it: {
        person_inquiry: (entities: any[]) => {
          if (entities.length > 0) {
            const entity = entities[0];
            return `Ecco le informazioni su ${entity.text}:`;
          }
          return "Posso aiutarti a trovare informazioni sui membri del team.";
        },
        pricing_inquiry: () => "Ecco le informazioni sui prezzi:",
        contact_inquiry: () => "Ecco i contatti del team:",
        service_inquiry: () => "Ecco le informazioni sui servizi:",
        help_request: () => "Sono qui per aiutarti!",
        general_inquiry: () => "Come posso aiutarti oggi?"
      },
      en: {
        person_inquiry: (entities: any[]) => {
          if (entities.length > 0) {
            const entity = entities[0];
            return `Here's information about ${entity.text}:`;
          }
          return "I can help you find information about our team members.";
        },
        pricing_inquiry: () => "Here's the pricing information:",
        contact_inquiry: () => "Here's our team contact information:",
        service_inquiry: () => "Here's the information about our services:",
        help_request: () => "I'm here to help!",
        general_inquiry: () => "How can I help you today?"
      },
      id: {
        person_inquiry: (entities: any[]) => {
          if (entities.length > 0) {
            const entity = entities[0];
            return `Berikut informasi tentang ${entity.text}:`;
          }
          return "Saya dapat membantu Anda menemukan informasi tentang anggota tim kami.";
        },
        pricing_inquiry: () => "Berikut informasi harga:",
        contact_inquiry: () => "Berikut informasi kontak tim kami:",
        service_inquiry: () => "Berikut informasi tentang layanan kami:",
        help_request: () => "Saya di sini untuk membantu!",
        general_inquiry: () => "Bagaimana saya bisa membantu Anda hari ini?"
      }
    };

    const langTemplates = templates[language] || templates['it'];
    const template = langTemplates[intent];

    if (typeof template === 'function') {
      return template(entities);
    }

    return template;
  }

  // =====================================================
  // CULTURAL ADAPTATIONS
  // =====================================================

  private async applyCulturalAdaptations(
    template: string,
    language: string,
    userProfile: LanguageProfile,
    nlpAnalysis: QueryAnalysis
  ): Promise<CulturalAdaptation[]> {
    const adaptations: CulturalAdaptation[] = [];

    // Greeting adaptations
    const greetingAdaptation = this.getGreetingAdaptation(language, nlpAnalysis.sentiment);
    if (greetingAdaptation) {
      adaptations.push(greetingAdaptation);
    }

    // Formality adaptations
    const formalityAdaptation = this.getFormalityAdaptation(language, userProfile.proficiency, nlpAnalysis.urgency);
    if (formalityAdaptation) {
      adaptations.push(formalityAdaptation);
    }

    // Business etiquette adaptations
    const businessAdaptation = this.getBusinessEtiquetteAdaptation(language, nlpAnalysis.intent);
    if (businessAdaptation) {
      adaptations.push(businessAdaptation);
    }

    // Religious considerations
    const religiousAdaptation = this.getReligiousConsideration(language, nlpAnalysis.entities);
    if (religiousAdaptation) {
      adaptations.push(religiousAdaptation);
    }

    // Time perception adaptations
    const timeAdaptation = this.getTimePerceptionAdaptation(language, nlpAnalysis.urgency);
    if (timeAdaptation) {
      adaptations.push(timeAdaptation);
    }

    // Communication style adaptations
    const communicationAdaptation = this.getCommunicationStyleAdaptation(language, nlpAnalysis.sentiment);
    if (communicationAdaptation) {
      adaptations.push(communicationAdaptation);
    }

    return adaptations;
  }

  private getGreetingAdaptation(language: string, sentiment: string): CulturalAdaptation | null {
    const greetings = {
      it: {
        positive: { original: 'Buongiorno', adapted: 'Buongiorno!' },
        neutral: { original: 'Salve', adapted: 'Salve.' },
        negative: { original: 'Scusi il disagio', adapted: 'Mi dispiace per l\'inconveniente.' }
      },
      en: {
        positive: { original: 'Hello', adapted: 'Hello!' },
        neutral: { original: 'Hi', adapted: 'Hi.' },
        negative: { original: 'Excuse me', adapted: 'Excuse me for the inconvenience.' }
      },
      id: {
        positive: { original: 'Halo', adapted: 'Halo!' },
        neutral: { original: 'Selamat', adapted: 'Selamat.' },
        negative: { original: 'Maaf', adapted: 'Mohon maaf atas ketidaknyamanan.' }
      }
    };

    const langGreetings = greetings[language];
    if (!langGreetings) return null;

    const greeting = langGreetings[sentiment as keyof typeof langGreetings];
    return {
      type: 'greeting',
      original: greeting.original,
      adapted: greeting.adapted,
      reason: `${sentiment} sentiment greeting adaptation for ${language}`
    };
  }

  private getFormalityAdaptation(language: string, proficiency: string, urgency: string): CulturalAdaptation | null {
    if (urgency === 'high') {
      const formalAdaptations = {
        it: { type: 'formality', original: 'Ecco', adapted: 'Ecco', reason: 'Urgent formal response' },
        en: { type: 'formality', original: 'Here is', adapted: 'Here is', reason: 'Urgent formal response' },
        id: { type: 'formality', original: 'Berikut', adapted: 'Berikut', reason: 'Urgent formal response' }
      };
      return formalAdaptations[language];
    }

    // Formality based on proficiency and context
    if (proficiency === 'beginner' || proficiency === 'intermediate') {
      const informalAdaptations = {
        it: { type: 'formality', original: 'Ecco', adapted: 'Ecco', reason: 'Appropriate formality level' },
        en: { type: 'formality', original: 'Here is', adapted: 'Here is', reason: 'Appropriate formality level' },
        id: { type: 'formality', original: 'Berikut', adapted: 'Berikut', reason: 'Appropriate formality level' }
      };
      return informalAdaptations[language];
    }

    return null;
  }

  private getBusinessEtiquetteAdaptation(language: string, intent: string): CulturalAdaptation | null {
    const businessPhrases = {
      it: {
        person_inquiry: { type: 'business_etiquette', original: 'Ti presento', adapted: 'Le presento con piacere', reason: 'Italian business etiquette' },
        pricing_inquiry: { type: 'business_etiquette', original: 'Il costo è', adapted: 'Il prezzo è', reason: 'Business pricing language' },
        general: { type: 'business_etiquette', original: 'Posso aiutarti', adapted: 'Sono a sua disposizione', reason: 'Professional service language' }
      },
      en: {
        person_inquiry: { type: 'business_etiquette', original: 'I present', adapted: 'Allow me to introduce', reason: 'English business etiquette' },
        pricing_inquiry: { type: 'business_etiquette', original: 'The cost is', adapted: 'The investment is', reason: 'Business pricing language' },
        general: { type: 'business_etiquette', original: 'I can help', adapted: 'I would be delighted to assist', reason: 'Professional service language' }
      },
      id: {
        person_inquiry: { type: 'business_etiquette', original: 'Ini adalah', adapted: 'Perkenalkan saya', reason: 'Indonesian business etiquette' },
        pricing_inquiry: { type: 'business_etiquette', original: 'Harganya adalah', adapted: 'Investasinya adalah', reason: 'Business pricing language' },
        general: { type: 'business_etiquette', original: 'Saya bisa membantu', adapted: 'Senang hati saya bisa membantu', reason: 'Professional service language' }
      }
    };

    const langBusiness = businessPhrases[language];
    if (!langBusiness) return null;

    const phrase = langBusiness[intent] || langBusiness.general;
    return {
      type: 'business_etiquette',
      original: phrase.original,
      adapted: phrase.adapted,
      reason: phrase.reason
    };
  }

  private getReligiousConsideration(language: string, entities: any[]): CulturalAdaptation | null {
    // Indonesian Islamic considerations
    if (language === 'id' || language === 'mixed') {
      const islamicServices = ['puasa', 'sholat', 'halal'];
      const hasIslamicContext = entities.some((entity: any) =>
        entity.text && islamicServices.some(service =>
          entity.text.toLowerCase().includes(service)
        )
      );

      if (hasIslamicContext) {
        return {
          type: 'religious_consideration',
          original: 'work hours',
          adapted: 'jam kerja dengan pertimbangan waktu sholat',
          reason: 'Islamic prayer consideration'
        };
      }
    }

    return null;
  }

  private getTimePerceptionAdaptation(language: string, urgency: string): CulturalAdaptation | null {
    // Indonesian flexible time perception
    if (language === 'id' || language === 'mixed') {
      const adaptations = {
        high: { type: 'time_perception', original: 'immediately', adapted: 'segera', reason: 'Indonesian time perception' },
        medium: { type: 'time_perception', original: 'as soon as possible', adapted: 'secepat mungkin', reason: 'Indonesian time perception' },
        low: { type: 'time_perception', original: 'soon', adapted: 'segera', reason: 'Indonesian time perception' }
      };
      return adaptations[urgency];
    }

    return null;
  }

  private getCommunicationStyleAdaptation(language: string, sentiment: string): CulturalAdaptation | null {
    const adaptations = {
      it: {
        positive: { type: 'communication_style', original: '!', adapted: '!', reason: 'Italian enthusiastic communication' },
        neutral: { type: 'communication_style', original: '.', adapted: '.', reason: 'Italian neutral communication' },
        negative: { type: 'communication_style', original: '!', adapted: '.', reason: 'Italian polite communication' }
      },
      en: {
        positive: { type: 'communication_style', original: '!', adapted: '!', reason: 'English enthusiastic communication' },
        neutral: { type: 'communication_style', original: '.', adapted: '.', reason: 'English neutral communication' },
        negative: { type: 'communication_style', original: '!', adapted: '.', reason: 'English polite communication' }
      },
      id: {
        positive: { type: 'communication_style', original: '!', adapted: '!', reason: 'Indonesian friendly communication' },
        neutral: { type: 'communication_style', original: '.', adapted: '.', reason: 'Indonesian neutral communication' },
        negative: { type: 'communication_style', original: '!', adapted: '.', reason: 'Indonesian polite communication' }
      }
    };

    const langAdaptations = adaptations[language];
    if (!langAdaptations) return null;

    const adaptation = langAdaptations[sentiment as keyof typeof langAdaptations];
    return {
      type: 'communication_style',
      original: adaptation.original,
      adapted: adaptation.adapted,
      reason: adaptation.reason
    };
  }

  // =====================================================
  // ENTITY LOCALIZATION
  // =====================================================

  private async localizeEntities(
    entities: any[],
    targetLanguage: string,
    userProfile: LanguageProfile
  ): Promise<LocalizedEntity[]> {
    const localizedEntities: LocalizedEntity[] = [];

    for (const entity of entities) {
      let localizedText = entity.text;
      let culturalContext = '';

      // Person name localization
      if (entity.type === 'person' && entity.metadata?.name) {
        localizedText = this.localizePersonName(entity.metadata.name, targetLanguage);
        culturalContext = this.getPersonCulturalContext(entity.metadata.role, targetLanguage);
      }

      // Role localization
      if (entity.type === 'role') {
        localizedText = this.localizeRole(entity.normalized_value, targetLanguage);
        culturalContext = this.getRoleCulturalContext(entity.normalized_value, targetLanguage);
      }

      // Service localization
      if (entity.type === 'service') {
        localizedText = this.localizeService(entity.text, targetLanguage);
        culturalContext = this.getServiceCulturalContext(entity.text, targetLanguage);
      }

      // Company localization
      if (entity.type === 'company') {
        localizedText = this.localizeCompany(entity.text, targetLanguage);
        culturalContext = this.getCompanyCulturalContext(entity.text, targetLanguage);
      }

      localizedEntities.push({
        original_text: entity.text,
        localized_text: localizedText,
        entity_type: entity.type,
        cultural_context: culturalContext,
        confidence: entity.confidence
      });
    }

    return localizedEntities;
  }

  private localizePersonName(name: string, language: string): string {
    // In a real implementation, this would use a proper localization service
    // For now, return the original name as Indonesian names often don't change
    return name;
  }

  private localizeRole(role: string, language: string): string {
    const roleTranslations = {
      it: {
        'ceo': 'CEO',
        'manager': 'Manager',
        'consultant': 'Consulente',
        'specialist': 'Specialista',
        'advisor': 'Consulente',
        'director': 'Direttore'
      },
      en: {
        'ceo': 'CEO',
        'manager': 'Manager',
        'consultant': 'Consultant',
        'specialist': 'Specialist',
        'advisor': 'Advisor',
        'director': 'Director'
      },
      id: {
        'ceo': 'CEO',
        'manager': 'Manajer',
        'consultant': 'Konsultan',
        'specialist': 'Spesialis',
        'advisor': 'Penasihat',
        'director': 'Direktur'
      }
    };

    const translations = roleTranslations[language];
    return translations[role.toLowerCase()] || role;
  }

  private localizeService(service: string, language: string): string {
    const serviceTranslations = {
      it: {
        'kitas': 'KITAS',
        'vitas': 'VITAS',
        'work permit': 'Permesso di Lavoro',
        'business visa': 'Visto Business',
        'tax': 'Servizi Fiscali',
        'legal': 'Servizi Legali'
      },
      en: {
        'kitas': 'KITAS',
        'vitas': 'VITAS',
        'work permit': 'Work Permit',
        'business visa': 'Business Visa',
        'tax': 'Tax Services',
        'legal': 'Legal Services'
      },
      id: {
        'kitas': 'KITAS',
        'vitas': 'VITAS',
        'izin kerja': 'Izin Kerja',
        'bisnis visa': 'Visto Bisnis',
        'pajak': 'Layanan Pajak',
        'hukum': 'Layanan Hukum'
      }
    };

    const translations = serviceTranslations[language];
    return translations[service.toLowerCase()] || service;
  }

    private localizeCompany(company: string, language: string): string {
      // Company names usually stay the same across languages
      return company;
    }

    private getPersonCulturalContext(role: string, language: string): string {
    const contexts = {
      it: {
        'ceo': 'Leader massimo dell\'azienda',
        'manager': 'Responsabile di team',
        'consultant': 'Esperto consulente'
      },
      en: {
        'ceo': 'Top company leader',
        'manager': 'Team leader',
        'consultant': 'Expert consultant'
      },
      id: {
        'ceo': 'Pemimpinan tertinggi',
        'manager': 'Pemimpin tim',
        'consultant': 'Konsultan ahli'
      }
    };

    const roleContexts = contexts[language];
    return roleContexts[role.toLowerCase()] || '';
  }

    private getRoleCulturalContext(role: string, language: string): string {
      return this.getPersonCulturalContext(role, language);
    }

    private getServiceCulturalContext(service: string, language: string): string {
      const contexts = {
        it: 'Servizio essenziale per business',
        en: 'Essential business service',
        id: 'Layanan bisnis penting'
      };

      const serviceContexts = contexts[language];
      return serviceContexts[service.toLowerCase()] || '';
    }

    private getCompanyCulturalContext(company: string, language: string): string {
      return 'Partner commerciale';
    }

    // =====================================================
    // LOCALIZATION TEMPLATES INITIALIZATION
    // =====================================================

    private initializeLocalizationTemplates(): void {
    const templates = {
      it: {
        'person_inquiry': {
          'Zainal Abidin': 'Zainal Abidin è il nostro CEO e guida la visione strategica di Bali Zero.',
          'Veronika': 'Veronika è la nostra Tax Manager con oltre 10 anni di esperienza.',
          'Zero': 'Zero è il nostro Tech Lead e sviluppa le soluzioni AI.',
          'Amanda': 'Amanda è una Executive Consultant specializzata in strategie business.'
        },
        'pricing_inquiry': {
          'kitas': 'Il KITAS E23 per freelance offshore parte da $1,500 a $2,500 USD.',
          'pt_pma': 'La costituzione PT PMA varia da $3,000 a $5,000 USD.'
        },
        'contact_inquiry': 'Puoi contattarci via email a team@balizero.com',
        'service_inquiry': 'Offriamo servizi completi per la tua attività in Indonesia.'
      },
      en: {
        'person_inquiry': {
          'Zainal Abidin': 'Zainal Abidin is our CEO and leads the strategic vision of Bali Zero.',
          'Veronika': 'Veronika is our Tax Manager with over 10 years of experience.',
          'Zero': 'Zero is our Tech Lead and develops AI solutions.',
          'Amanda': 'Amanda is an Executive Consultant specializing in business strategies.'
        },
        'pricing_inquiry': {
          'kitas': 'The KITAS E23 for freelance offshore ranges from $1,500 to $2,500 USD.',
          'pt_pma': 'PT PMA establishment costs range from $3,000 to $5,000 USD.'
        },
        'contact_inquiry': 'You can contact us at team@balizero.com',
        'service_inquiry': 'We offer complete services for your business in Indonesia.'
      },
      id: {
        'person_inquiry': {
          'Zainal Abidin': 'Zainal Abidin adalah CEO kami dan memimpin visi strategis Bali Zero.',
          'Veronika': 'Veronika adalah Tax Manager kami dengan pengalaman lebih dari 10 tahun.',
          'Zero': 'Zero adalah Tech Lead kami dan mengembangkan solusi AI.',
          'Amanda': 'Amanda adalah Executive Consultant yang berspesialisasi dalam strategi bisnis.'
        },
        'pricing_inquiry': {
          'kitas': 'KITAS E23 untuk freelance offshore berkisar dari $1,500 hingga $2,500 USD.',
          'pt_pma': 'Biaya pembuatan PT PMA berkisar dari $3,000 hingga $5,000 USD.'
        },
        'contact_inquiry': 'Anda dapat menghubungi kami di team@balizero.com',
        'service_inquiry': 'Kami menawarkan layanan lengkap untuk bisnis Anda di Indonesia.'
      }
    };

    this.localizationTemplates = new Map();
    for (const [lang, templatesMap] of Object.entries(templates)) {
      this.localizationTemplates.set(lang, new Map(Object.entries(templatesMap)));
    }
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default MultiLanguageSystem;