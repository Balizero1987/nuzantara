/**
 * 🚀 ZANTARA V4.0 - MULTI-LANGUAGE CULTURAL INTELLIGENCE SYSTEM V2.0
 *
 * Enhanced multi-language system with Ukrainian support and automatic language adaptation
 * based on recognized team members - Zero speaks Italian, Ukrainian team in Ukrainian, others in Indonesian
 *
 * @author Claude Code Architecture v4.0
 * @version 2.0.0
 */

import { AdvancedNLPSystem, QueryAnalysis } from './AdvancedNLPSystem';
import logger from './logger.js';

// =====================================================
// MULTI-LANGUAGE EXPANSION SYSTEM WITH UKRAINIAN SUPPORT
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
  language: 'it' | 'en' | 'id' | 'ua';
  cultural_adaptations: CulturalAdaptation[];
  localized_entities: LocalizedEntity[];
  context_preservation: boolean;
  adapted_to_member?: string;
  member_confidence?: number;
}

export interface CulturalAdaptation {
  type:
    | 'greeting'
    | 'formality'
    | 'business_etiquette'
    | 'religious_consideration'
    | 'time_perception'
    | 'communication_style';
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
  language: 'it' | 'en' | 'id' | 'ua';
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

// Team member language mapping
export interface TeamMemberLanguageProfile {
  member_name: string;
  preferred_language: 'it' | 'en' | 'id' | 'ua';
  language_variations: string[];
  cultural_context: string;
  communication_style: 'formal' | 'informal' | 'professional';
  specialties: string[];
}

export class MultiLanguageSystem {
  private nlpSystem: AdvancedNLPSystem;
  private userProfiles: Map<string, LanguageProfile> = new Map();
  private _translationCache: Map<string, TranslationResult> = new Map();
  private localizationTemplates: Map<string, Map<string, string>> = new Map();
  private teamMemberLanguages: Map<string, TeamMemberLanguageProfile> = new Map();

  constructor(nlpSystem: AdvancedNLPSystem) {
    this.nlpSystem = nlpSystem;
    this.initializeLocalizationTemplates();
    this.initializeTeamMemberLanguages();
  }

  // =====================================================
  // TEAM MEMBER LANGUAGE MAPPINGS
  // =====================================================

  private initializeTeamMemberLanguages(): void {
    // Italian team members
    this.teamMemberLanguages.set('Zero', {
      member_name: 'Zero',
      preferred_language: 'it',
      language_variations: ['Italiano', 'italiano'],
      cultural_context: 'Italian AI/Tech',
      communication_style: 'professional',
      specialties: ['AI development', 'technical architecture', 'system design'],
    });

    // Ukrainian team members
    this.teamMemberLanguages.set('Ruslana', {
      member_name: 'Ruslana',
      preferred_language: 'ua',
      language_variations: ['Русла', 'Руслана', 'Руса'],
      cultural_context: 'Ukrainian Board Member',
      communication_style: 'formal',
      specialties: ['strategic planning', 'governance', 'board decisions'],
    });

    this.teamMemberLanguages.set('Olena', {
      member_name: 'Olena',
      preferred_language: 'ua',
      language_variations: ['Олена', 'Оля', 'Лена'],
      cultural_context: 'Ukrainian External Advisory',
      communication_style: 'formal',
      specialties: ['strategic advisory', 'international business', 'cross-border consulting'],
    });

    this.teamMemberLanguages.set('Marta', {
      member_name: 'Marta',
      preferred_language: 'ua',
      language_variations: ['Марта', 'Марта', 'Маша'],
      cultural_context: 'Ukrainian External Advisory',
      communication_style: 'formal',
      specialties: ['business advisory', 'corporate strategy', 'market entry consulting'],
    });

    // Indonesian team members
    this.teamMemberLanguages.set('Zainal Abidin', {
      member_name: 'Zainal Abidin',
      preferred_language: 'id',
      language_variations: ['Pak Zainal', 'Bapak Zainal', 'Mas Zainal'],
      cultural_context: 'Indonesian CEO',
      communication_style: 'formal',
      specialties: ['business strategy', 'management', 'leadership', 'corporate governance'],
    });

    this.teamMemberLanguages.set('Veronika', {
      member_name: 'Veronika',
      preferred_language: 'id',
      language_variations: ['Bu Veronika', 'Kak Veronika'],
      cultural_context: 'Indonesian Tax Manager',
      communication_style: 'professional',
      specialties: ['tax management', 'tax planning', 'corporate taxation', 'tax compliance'],
    });

    this.teamMemberLanguages.set('Adit', {
      member_name: 'Adit',
      preferred_language: 'id',
      language_variations: ['Mas Adit', 'Bang Adit'],
      cultural_context: 'Indonesian Crew Lead',
      communication_style: 'professional',
      specialties: ['team leadership', 'project management', 'consulting coordination'],
    });

    // Add all other Indonesian team members...
    const indonesianMembers = [
      'Amanda',
      'Krisna',
      'Ari',
      'Dea',
      'Surya',
      'Damar',
      'Anton',
      'Vino',
      'Angel',
      'Kadek',
      'Dewa Ayu',
      'Faisha',
      'Nina',
      'Sahira',
      'Rina',
    ];

    indonesianMembers.forEach((member) => {
      this.teamMemberLanguages.set(member, {
        member_name: member,
        preferred_language: 'id',
        language_variations: this.generateIndonesianVariations(member),
        cultural_context: `Indonesian ${this.getMemberRole(member)}`,
        communication_style: 'professional',
        specialties: this.getMemberSpecialties(member),
      });
    });
  }

  private generateIndonesianVariations(name: string): string[] {
    const variations = [name];
    const titles = ['Pak', 'Bu', 'Kak', 'Mas', 'Bang'];

    titles.forEach((title) => {
      variations.push(`${title} ${name}`);
    });

    return variations;
  }

  private getMemberRole(member: string): string {
    const roles: Record<string, string> = {
      Amanda: 'Executive Consultant',
      Krisna: 'Executive Consultant',
      Adit: 'Crew Lead',
      Ari: 'Specialist Consultant',
      Dea: 'Executive Consultant',
      Surya: 'Specialist Consultant',
      Damar: 'Junior Consultant',
      Anton: 'Executive Consultant',
      Vino: 'Junior Consultant',
      Angel: 'Tax Expert',
      Kadek: 'Tax Consultant',
      'Dewa Ayu': 'Tax Consultant',
      Faisha: 'Tax Care',
      Nina: 'Marketing Advisory',
      Sahira: 'Marketing Specialist',
      Rina: 'Reception',
    };
    return roles[member] || 'Team Member';
  }

  private getMemberSpecialties(member: string): string[] {
    const specialties: Record<string, string[]> = {
      Amanda: ['business consulting', 'executive advisory', 'strategic planning'],
      Krisna: ['business consulting', 'market analysis', 'corporate structuring'],
      Adit: ['team leadership', 'project management', 'consulting coordination'],
      Ari: ['specialized consulting', 'domain expertise', 'technical advisory'],
      Dea: ['executive consulting', 'business strategy', 'client relations'],
      Surya: ['specialized consulting', 'technical expertise', 'domain knowledge'],
      Damar: ['junior consulting', 'learning', 'support functions'],
      Anton: ['executive consulting', 'business development', 'client management'],
      Vino: ['junior consulting', 'administrative support', 'client communications'],
      Angel: ['tax advisory', 'tax optimization', 'international taxation', 'tax law'],
      Kadek: ['tax consulting', 'tax compliance', 'tax filing', 'tax advisory'],
      'Dewa Ayu': ['tax consulting', 'personal taxation', 'expatriate tax', 'tax planning'],
      Faisha: ['tax customer service', 'tax support', 'client care', 'tax inquiries'],
      Nina: ['marketing strategy', 'brand development', 'market research', 'digital marketing'],
      Sahira: ['marketing execution', 'social media', 'content creation', 'campaign management'],
      Rina: ['front desk', 'customer service', 'appointment scheduling', 'office management'],
    };
    return specialties[member] || ['consulting services'];
  }

  // =====================================================
  // MAIN LANGUAGE PROCESSING WITH TEAM MEMBER ADAPTATION
  // =====================================================

  async processQueryWithLanguage(
    query: string,
    userId: string,
    preferredLanguage?: string,
    recognizedMember?: string,
    context?: any
  ): Promise<LocalizedResponse> {
    // 1. Detect query language
    const detectedLanguage = this.detectQueryLanguage(query);

    // 2. Get user language profile
    const userProfile = this.getUserLanguageProfile(userId);

    // 3. Determine optimal response language based on team member
    const targetLanguage = await this.determineOptimalLanguageForMember(
      detectedLanguage,
      userProfile,
      preferredLanguage,
      recognizedMember,
      context
    );

    // 4. Perform NLP analysis in detected language
    const nlpAnalysis = await this.nlpSystem.analyzeQuery(query, detectedLanguage.language);

    // 5. Generate culturally adapted response with team member context
    const localizedResponse = await this.generateLocalizedResponseForMember(
      nlpAnalysis,
      targetLanguage,
      userProfile,
      recognizedMember,
      context
    );

    // 6. Update user profile
    this.updateUserProfile(userId, targetLanguage, query, context);

    return localizedResponse;
  }

  private async determineOptimalLanguageForMember(
    detectedLanguage: { language: string; confidence: number },
    userProfile: LanguageProfile,
    preferredLanguage?: string,
    recognizedMember?: string,
    _context?: any
  ): Promise<'it' | 'en' | 'id' | 'ua'> {
    // Priority 1: Recognized team member's preferred language
    if (recognizedMember && this.teamMemberLanguages.has(recognizedMember)) {
      const memberProfile = this.teamMemberLanguages.get(recognizedMember)!;
      return memberProfile.preferred_language;
    }

    // Priority 2: User's preferred language
    if (preferredLanguage && ['it', 'en', 'id', 'ua'].includes(preferredLanguage)) {
      return preferredLanguage as 'it' | 'en' | 'id' | 'ua';
    }

    // Priority 3: User's profile preference
    if (userProfile && userProfile.preference > 0.7) {
      return userProfile.language;
    }

    // Priority 4: Detected language with high confidence
    if (detectedLanguage.confidence > 0.8) {
      const lang = detectedLanguage.language.toLowerCase();
      if (['it', 'en', 'id', 'ua'].includes(lang)) {
        return lang as 'it' | 'en' | 'id' | 'ua';
      }
    }

    // Priority 5: Default to Indonesian (primary business language)
    return 'id';
  }

  private async generateLocalizedResponseForMember(
    nlpAnalysis: QueryAnalysis,
    targetLanguage: 'it' | 'en' | 'id' | 'ua',
    _userProfile: LanguageProfile,
    recognizedMember?: string,
    _context?: any
  ): Promise<LocalizedResponse> {
    // Get base response template
    const baseResponse = await this.generateBaseResponse(nlpAnalysis, targetLanguage);

    // Apply team member specific adaptations
    const memberAdaptations = this.getTeamMemberAdaptations(recognizedMember, targetLanguage);

    // Apply cultural adaptations
    const culturalAdaptations = this.applyCulturalAdaptations(
      baseResponse,
      targetLanguage,
      memberAdaptations
    );

    // Localize entities
    const localizedEntities = await this.localizeEntities(nlpAnalysis.entities, targetLanguage);

    return {
      original_text: nlpAnalysis.query,
      localized_text: culturalAdaptations.adapted_text,
      language: targetLanguage,
      cultural_adaptations: culturalAdaptations.adaptations,
      localized_entities: localizedEntities,
      context_preservation: true,
      adapted_to_member: recognizedMember,
      member_confidence: recognizedMember ? 0.95 : 0,
    };
  }

  private getTeamMemberAdaptations(memberName?: string, language: string): any {
    if (!memberName || !this.teamMemberLanguages.has(memberName)) {
      return {
        formality: 'professional',
        greeting: this.getDefaultGreeting(language),
        closing: this.getDefaultClosing(language),
      };
    }

    const memberProfile = this.teamMemberLanguages.get(memberName)!;

    return {
      formality: memberProfile.communication_style,
      greeting: this.getPersonalizedGreeting(memberName, language),
      closing: this.getPersonalizedClosing(memberName, language),
      specialties: memberProfile.specialties,
      cultural_context: memberProfile.cultural_context,
    };
  }

  private getPersonalizedGreeting(memberName: string, language: string): string {
    const greetings = {
      it: {
        Zero: 'Buongiorno! Sono Zero, il tuo AI Bridge.',
        Ruslana: 'Buongiorno, sono Ruslana.',
        Olena: 'Salve, sono Olena.',
        Marta: 'Ciao, sono Marta.',
        default: 'Buongiorno!',
      },
      ua: {
        Ruslana: 'Доброго дня! Я Руслана.',
        Olena: 'Вітаю! Я Олена.',
        Marta: 'Привіт! Я Марта.',
        default: 'Доброго дня!',
      },
      id: {
        'Zainal Abidin': 'Selamat pagi! Saya Zainal Abidin.',
        Veronika: 'Selamat pagi! Saya Veronika.',
        default: 'Selamat pagi!',
      },
      en: {
        default: 'Hello!',
      },
    };

    return (
      greetings[language as keyof typeof greetings]?.[memberName as keyof typeof greetings.it] ||
      greetings[language as keyof typeof greetings]?.default ||
      greetings.en.default
    );
  }

  private getPersonalizedClosing(memberName: string, language: string): string {
    const closings = {
      it: {
        Zero: 'Sono qui per aiutarti con qualsiasi esigenza tecnica.',
        Ruslana: 'Sono a disposizione per consulenze strategiche.',
        Olena: 'Posso aiutarti con consulenze internazionali.',
        Marta: 'Offro consulenza strategica e aziendale.',
        default: 'Sono a disposizione per aiutarti.',
      },
      ua: {
        Ruslana: 'Я доступна для стратегічних консультацій.',
        Olena: 'Я можу допомогти з міжнародними консультаціями.',
        Marta: 'Пропоную стратегічні та бізнес-консультації.',
        default: 'Я доступна для допомоги.',
      },
      id: {
        'Zainal Abidin': 'Saya siap membantu Anda dengan kebutuhan bisnis.',
        Veronika: 'Saya siap membantu Anda dengan konsultasi perpajakan.',
        default: 'Saya siap membantu Anda.',
      },
      en: {
        default: 'I am here to help you.',
      },
    };

    return (
      closings[language as keyof typeof closings]?.[memberName as keyof typeof closings.it] ||
      closings[language as keyof typeof closings]?.default ||
      closings.en.default
    );
  }

  private getDefaultGreeting(language: string): string {
    const greetings = {
      it: 'Buongiorno!',
      ua: 'Доброго дня!',
      id: 'Selamat pagi!',
      en: 'Hello!',
    };
    return greetings[language as keyof typeof greetings] || greetings.en;
  }

  private getDefaultClosing(language: string): string {
    const closings = {
      it: 'Come posso aiutarti oggi?',
      ua: 'Чим я можу допомогти?',
      id: 'Bagaimana saya bisa membantu Anda hari ini?',
      en: 'How can I help you today?',
    };
    return closings[language as keyof typeof closings] || closings.en;
  }

  // =====================================================
  // CULTURAL ADAPTATIONS WITH UKRAINIAN SUPPORT
  // =====================================================

  private applyCulturalAdaptations(
    response: string,
    language: 'it' | 'en' | 'id' | 'ua',
    memberContext: any
  ): { adapted_text: string; adaptations: CulturalAdaptation[] } {
    const adaptations: CulturalAdaptation[] = [];
    let adaptedText = response;

    // Apply language-specific adaptations
    switch (language) {
      case 'ua':
        adaptations.push(...this.applyUkrainianCulturalAdaptations(adaptedText, memberContext));
        break;
      case 'it':
        adaptations.push(...this.applyItalianCulturalAdaptations(adaptedText, memberContext));
        break;
      case 'id':
        adaptations.push(...this.applyIndonesianCulturalAdaptations(adaptedText, memberContext));
        break;
      case 'en':
        adaptations.push(...this.applyEnglishCulturalAdaptations(adaptedText, memberContext));
        break;
    }

    // Apply member-specific adaptations
    if (memberContext) {
      adaptedText = this.applyMemberSpecificAdaptations(adaptedText, memberContext, language);
    }

    return { adapted_text: adaptedText, adaptations };
  }

  private applyUkrainianCulturalAdaptations(
    _text: string,
    _memberContext: any
  ): CulturalAdaptation[] {
    const adaptations: CulturalAdaptation[] = [];

    // Formal address for Ukrainian business context
    if (text.includes('ви') || text.includes('Ви')) {
      adaptations.push({
        type: 'formality',
        original: 'ви',
        adapted: 'Ви',
        reason: 'Formal Ukrainian address for business context',
      });
    }

    // Business etiquette adaptations
    if (text.includes('компанія')) {
      adaptations.push({
        type: 'business_etiquette',
        original: 'компанія',
        adapted: 'компанія',
        reason: 'Correct Ukrainian business terminology',
      });
    }

    // Time perception
    adaptations.push({
      type: 'time_perception',
      original: 'standard time references',
      adapted: 'Ukrainian time format (24-hour)',
      reason: 'Ukrainian business uses 24-hour time format',
    });

    return adaptations;
  }

  private applyItalianCulturalAdaptations(_text: string, _memberContext: any): CulturalAdaptation[] {
    const adaptations: CulturalAdaptation[] = [];

    // Formal vs informal
    if (_memberContext?.communication_style === 'formal') {
      adaptations.push({
        type: 'formality',
        original: 'informal tone',
        adapted: 'formal Italian business tone',
        reason: 'Professional Italian business communication',
      });
    }

    return adaptations;
  }

  private applyIndonesianCulturalAdaptations(
    _text: string,
    _memberContext: any
  ): CulturalAdaptation[] {
    const adaptations: CulturalAdaptation[] = [];

    // Honorifics
    adaptations.push({
      type: 'business_etiquette',
      original: 'direct address',
      adapted: 'Pak/Bu honorifics where appropriate',
      reason: 'Indonesian business cultural respect',
    });

    // Religious considerations
    adaptations.push({
      type: 'religious_consideration',
      original: 'casual references',
      adapted: 'Religiously neutral language',
      reason: 'Indonesian business cultural sensitivity',
    });

    return adaptations;
  }

  private applyEnglishCulturalAdaptations(_text: string, _memberContext: any): CulturalAdaptation[] {
    const adaptations: CulturalAdaptation[] = [];

    // Professional tone
    adaptations.push({
      type: 'communication_style',
      original: 'casual tone',
      adapted: 'Professional business English',
      reason: 'International business communication standard',
    });

    return adaptations;
  }

  private applyMemberSpecificAdaptations(
    text: string,
    memberContext: any,
    language: string
  ): string {
    let adaptedText = text;

    // Add member-specific context
    if (memberContext?.specialties && memberContext.specialties.length > 0) {
      const specialtiesText = this.formatSpecialties(memberContext.specialties, language);
      adaptedText = `${adaptedText}\n\n🎯 **Specializzazioni:** ${specialtiesText}`;
    }

    // Add cultural context note
    if (memberContext?.cultural_context) {
      const contextNote = this.formatCulturalContext(memberContext.cultural_context, language);
      adaptedText = `${adaptedText}\n\n🌍 **Contesto:** ${contextNote}`;
    }

    return adaptedText;
  }

  private formatSpecialties(specialties: string[], _language: string): string {
    const _labels = {
      it: 'Specializzazioni',
      ua: 'Спеціалізації',
      id: 'Keahlian',
      en: 'Specialties',
    };

    return specialties.join(', ');
  }

  private formatCulturalContext(context: string, _language: string): string {
    return context;
  }

  // =====================================================
  // LOCALIZATION TEMPLATES WITH UKRAINIAN
  // =====================================================

  private initializeLocalizationTemplates(): void {
    // Italian templates
    const italianTemplates = new Map<string, string>();
    italianTemplates.set('greeting', 'Buongiorno!');
    italianTemplates.set(
      'introduction',
      'Sono ZANTARA, il tuo assistente intelligente per Bali Zero.'
    );
    italianTemplates.set('help', 'Come posso aiutarti oggi?');
    italianTemplates.set('team_recognition', 'Ho riconosciuto un membro del nostro team.');
    italianTemplates.set(
      'unknown_query',
      'Non sono sicuro di aver capito. Puoi riformulare la domanda?'
    );
    italianTemplates.set('error', 'Mi dispiace, si è verificato un errore. Riprova per favore.');

    // Ukrainian templates
    const ukrainianTemplates = new Map<string, string>();
    ukrainianTemplates.set('greeting', 'Доброго дня!');
    ukrainianTemplates.set(
      'introduction',
      'Я ЗАНТАРА, ваш інтелектуальний асистент для Bali Zero.'
    );
    ukrainianTemplates.set('help', 'Чим я можу допомогти вам сьогодні?');
    ukrainianTemplates.set('team_recognition', 'Я впізнав члена нашої команди.');
    ukrainianTemplates.set(
      'unknown_query',
      'Я не впевнений, що зрозумів. Можете переформулювати питання?'
    );
    ukrainianTemplates.set('error', 'Вибачте, сталася помилка. Спробуйте ще раз, будь ласка.');

    // Indonesian templates
    const indonesianTemplates = new Map<string, string>();
    indonesianTemplates.set('greeting', 'Selamat pagi!');
    indonesianTemplates.set('introduction', 'Saya ZANTARA, asisten cerdas Anda untuk Bali Zero.');
    indonesianTemplates.set('help', 'Bagaimana saya bisa membantu Anda hari ini?');
    indonesianTemplates.set('team_recognition', 'Saya mengenali anggota tim kami.');
    indonesianTemplates.set(
      'unknown_query',
      'Saya tidak yakin mengerti. Bisa Anda ulangi pertanyaannya?'
    );
    indonesianTemplates.set('error', 'Maaf, terjadi kesalahan. Silakan coba lagi.');

    // English templates
    const englishTemplates = new Map<string, string>();
    englishTemplates.set('greeting', 'Hello!');
    englishTemplates.set('introduction', 'I am ZANTARA, your intelligent assistant for Bali Zero.');
    englishTemplates.set('help', 'How can I help you today?');
    englishTemplates.set('team_recognition', 'I recognize a member of our team.');
    englishTemplates.set(
      'unknown_query',
      "I'm not sure I understand. Can you rephrase the question?"
    );
    englishTemplates.set('error', 'Sorry, an error occurred. Please try again.');

    // Store templates
    this.localizationTemplates.set('it', italianTemplates);
    this.localizationTemplates.set('ua', ukrainianTemplates);
    this.localizationTemplates.set('id', indonesianTemplates);
    this.localizationTemplates.set('en', englishTemplates);
  }

  // =====================================================
  // LANGUAGE DETECTION WITH UKRAINIAN SUPPORT
  // =====================================================

  detectQueryLanguage(query: string): { language: string; confidence: number } {
    const text = query.toLowerCase().trim();

    // Ukrainian patterns
    const ukrainianPatterns = [
      /[\u0400-\u04FF]/, // Cyrillic range
      /\b(доброго|ви|вас|мені|допоможіть|будь ласка)\b/,
      /\b(я|ти|він|вона|ми|ви|вони)\b/,
      /\b(компанія|бізнес|робота|послуги)\b/,
    ];

    // Italian patterns
    const italianPatterns = [
      /\b(ciao|buongiorno|arrivederci|grazie|prego)\b/,
      /\b(sono|sei|siamo|siete)\b/,
      /\b(azienda|lavoro|servizio|aiuto)\b/,
    ];

    // Indonesian patterns
    const indonesianPatterns = [
      /\b(selamat|terima kasih|tolong|bantu)\b/,
      /\b(saya|anda|kami|kalian)\b/,
      /\b(perusahaan|kerja|layanan|bantuan)\b/,
    ];

    // Check for Ukrainian
    for (const pattern of ukrainianPatterns) {
      if (pattern.test(text)) {
        return { language: 'ua', confidence: 0.95 };
      }
    }

    // Check for Italian
    for (const pattern of italianPatterns) {
      if (pattern.test(text)) {
        return { language: 'it', confidence: 0.9 };
      }
    }

    // Check for Indonesian
    for (const pattern of indonesianPatterns) {
      if (pattern.test(text)) {
        return { language: 'id', confidence: 0.9 };
      }
    }

    // Check for English
    const englishPatterns = [
      /\b(hello|hi|thanks|please|help|sorry)\b/,
      /\b(i|you|we|they)\b/,
      /\b(company|work|service|assist)\b/,
    ];

    for (const pattern of englishPatterns) {
      if (pattern.test(text)) {
        return { language: 'en', confidence: 0.8 };
      }
    }

    // Default to Indonesian (primary business language)
    return { language: 'id', confidence: 0.5 };
  }

  // =====================================================
  // USER PROFILE MANAGEMENT
  // =====================================================

  private getUserLanguageProfile(userId: string): LanguageProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        language: 'id',
        proficiency: 'intermediate',
        preference: 0.6,
        context_history: [],
      });
    }
    return this.userProfiles.get(userId)!;
  }

  private updateUserProfile(
    userId: string,
    language: 'it' | 'en' | 'id' | 'ua',
    query: string,
    context?: any
  ): void {
    const profile = this.getUserLanguageProfile(userId);

    // Update language preference
    profile.language = language;
    profile.preference = Math.min(profile.preference + 0.05, 1.0);

    // Add to history
    profile.context_history.push({
      session_id: context?.session_id || 'unknown',
      timestamp: new Date(),
      language_used: language,
      query_type: context?.query_type || 'general',
      user_satisfaction: context?.user_satisfaction,
      response_quality: context?.response_quality,
    });

    // Keep only last 20 entries
    if (profile.context_history.length > 20) {
      profile.context_history = profile.context_history.slice(-20);
    }
  }

  // =====================================================
  // ENTITY LOCALIZATION
  // =====================================================

  private async localizeEntities(
    entities: any[],
    targetLanguage: 'it' | 'en' | 'id' | 'ua'
  ): Promise<LocalizedEntity[]> {
    const localizedEntities: LocalizedEntity[] = [];

    for (const entity of entities) {
      const localized = await this.localizeEntity(entity, targetLanguage);
      if (localized) {
        localizedEntities.push(localized);
      }
    }

    return localizedEntities;
  }

  private async localizeEntity(
    entity: any,
    targetLanguage: 'it' | 'en' | 'id' | 'ua'
  ): Promise<LocalizedEntity | null> {
    if (!entity.text) return null;

    // Entity type translations
    const entityTypeTranslations: Record<string, Record<string, string>> = {
      person: {
        it: 'persona',
        ua: 'особа',
        id: 'orang',
        en: 'person',
      },
      service: {
        it: 'servizio',
        ua: 'послуга',
        id: 'layanan',
        en: 'service',
      },
      company: {
        it: 'azienda',
        ua: 'компанія',
        id: 'perusahaan',
        en: 'company',
      },
      location: {
        it: 'luogo',
        ua: 'місцезнаходження',
        id: 'lokasi',
        en: 'location',
      },
      price: {
        it: 'prezzo',
        ua: 'ціна',
        id: 'harga',
        en: 'price',
      },
      date: {
        it: 'data',
        ua: 'дата',
        id: 'tanggal',
        en: 'date',
      },
    };

    const translatedType = entityTypeTranslations[entity.type]?.[targetLanguage] || entity.type;

    return {
      original_text: entity.text,
      localized_text: entity.text, // In real implementation, would translate
      entity_type: translatedType,
      cultural_context: this.getEntityCulturalContext(entity, targetLanguage),
      confidence: entity.confidence || 0.8,
    };
  }

  private getEntityCulturalContext(entity: any, language: string): string {
    const contexts = {
      it: 'Contesto culturale italiano',
      ua: 'Український культурний контекст',
      id: 'Konteks budaya Indonesia',
      en: 'English cultural context',
    };
    return contexts[language] || contexts.en;
  }

  // =====================================================
  // RESPONSE GENERATION
  // =====================================================

  private async generateBaseResponse(
    nlpAnalysis: QueryAnalysis,
    language: 'it' | 'en' | 'id' | 'ua'
  ): Promise<string> {
    const templates = this.localizationTemplates.get(language);
    if (!templates) return nlpAnalysis.query;

    // Select appropriate response template
    let templateKey = 'unknown_query';

    if (nlpAnalysis.intent === 'team_inquiry') {
      templateKey = 'team_recognition';
    } else if (nlpAnalysis.sentiment === 'question') {
      templateKey = 'help';
    } else if (nlpAnalysis.sentiment === 'greeting') {
      templateKey = 'greeting';
    } else if (nlpAnalysis.sentiment === 'error' || nlpAnalysis.sentiment === 'negative') {
      templateKey = 'error';
    }

    return templates.get(templateKey) || nlpAnalysis.query;
  }

  // =====================================================
  // PUBLIC API METHODS
  // =====================================================

  async initialize(): Promise<void> {
    logger.info('🌍 Multi-Language Cultural Intelligence System V2.0 initialized');
    logger.info('🇮🇹 Italian support: ✅');
    logger.info('🇬🇧 English support: ✅');
    logger.info('🇮🇩 Indonesian support: ✅');
    logger.info('🇺🇦 Ukrainian support: ✅');
    logger.info('👥 Team member language adaptation: ✅');
  }

  getSupportedLanguages(): string[] {
    return ['it', 'en', 'id', 'ua'];
  }

  getTeamMemberLanguages(): Map<string, TeamMemberLanguageProfile> {
    return this.teamMemberLanguages;
  }

  async adaptToTeamMember(memberName: string, baseResponse: string): Promise<string> {
    const memberProfile = this.teamMemberLanguages.get(memberName);
    if (!memberProfile) return baseResponse;

    const adaptations = this.getTeamMemberAdaptations(memberName, memberProfile.preferred_language);
    return this.applyMemberSpecificAdaptations(
      baseResponse,
      adaptations,
      memberProfile.preferred_language
    );
  }
}

// =====================================================
// EXPORTS
// =====================================================

export default MultiLanguageSystem;
export { MultiLanguageSystem as EnhancedMultiLanguageSystem };
