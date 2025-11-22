/**
 * 🚀 ZANTARA V4.0 - MOBILE API ENDPOINTS
 *
 * Mobile-optimized API endpoints with compression, caching, and performance optimization
 * Tailored for mobile devices with slower connections and limited resources
 *
 * @author ZANTARA Architecture v4.0
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { AdvancedNLPSystem } from './AdvancedNLPSystem';
import { MultiLanguageSystem } from './MultiLanguageSystem';
import { EnhancedTeamHandler } from './EnhancedTeamHandler';
import logger from '../services/logger.js';

// =====================================================
// MOBILE INTERFACES
// =====================================================

export interface MobileChatRequest {
  query: string;
  session_id: string;
  context: {
    mobile_optimized: boolean;
    device_info: Record<string, unknown>;
    ui_preferences: {
      compact_mode: boolean;
      touch_friendly: boolean;
      reduced_motion: boolean;
    };
    language?: string;
    location?: string;
  };
}

export interface MobileChatResponse {
  success: boolean;
  data: {
    response: string;
    type: 'team' | 'pricing' | 'general' | 'legal';
    entities: Array<{
      type: 'person' | 'service' | 'price' | 'date' | 'location';
      value: string;
      confidence: number;
    }>;
    language: string;
    localized: boolean;
    suggestions?: string[];
    member_info?: Record<string, unknown>;
    pricing_info?: any;
    follow_up_questions?: string[];
  };
  meta: {
    response_time_ms: number;
    compressed: boolean;
    cache_hit: boolean;
    mobile_optimized: boolean;
    character_count: number;
    reading_time_seconds: number;
  };
}

export interface MobileTeamListRequest {
  department?: string;
  limit?: number;
  offset?: number;
  search?: string;
  mobile: boolean;
}

export interface MobileTeamListResponse {
  success: boolean;
  data: {
    team_members: Array<{
      id: string;
      name: string;
      role: string;
      department: string;
      email?: string;
      phone?: string;
      avatar?: string;
      available: boolean;
      specialties: string[];
      languages: string[];
      response_format: 'mobile-compact' | 'mobile-detailed';
    }>;
    total_count: number;
    departments: string[];
    has_more: boolean;
  };
  meta: {
    response_time_ms: number;
    cache_time_minutes: number;
    compressed: boolean;
  };
}

export interface MobilePricingRequest {
  service: string;
  location?: string;
  business_type?: string;
  urgency?: 'normal' | 'urgent';
  mobile_optimized: boolean;
  device_type?: string;
}

export interface MobilePricingResponse {
  success: boolean;
  data: {
    service: string;
    price_range: {
      min: number;
      max: number;
      currency: string;
    };
    estimated_time: string;
    requirements: string[];
    next_steps: string[];
    contact_methods: Array<{
      type: 'phone' | 'email' | 'whatsapp' | 'chat';
      value: string;
      recommended: boolean;
    }>;
    mobile_payment_options: string[];
  };
  meta: {
    location_specific: boolean;
    last_updated: string;
    confidence: number;
  };
}

// =====================================================
// MOBILE RESPONSE COMPRESSOR
// =====================================================

class MobileResponseCompressor {
  static compress(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const compressed: any = {};

    // Remove null/undefined values
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        compressed[key] = value;
      }
    }

    // Compress arrays
    for (const [key, value] of Object.entries(compressed)) {
      if (Array.isArray(value)) {
        compressed[key] = value
          .map((item) => (typeof item === 'object' ? this.compress(item) : item))
          .filter((item) => item !== null && item !== undefined);
      }
    }

    // Compress nested objects
    for (const [key, value] of Object.entries(compressed)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        compressed[key] = this.compress(value);
      }
    }

    return compressed;
  }

  static optimizeForMobile(text: string): string {
    // Shorten common phrases
    const replacements = {
      'Bali Zero': 'BZ',
      Indonesia: 'ID',
      'Company Registration': 'Reg.',
      'Business License': 'License',
      'Tax Identification': 'Tax ID',
      'Work Permit': 'Work Permit',
      Investment: 'Invest.',
      Consulting: 'Consult.',
      'Please note that': 'Note:',
      'In order to': 'To',
      'As soon as possible': 'ASAP',
      Information: 'Info',
      Requirements: 'Reqs.',
      Documentation: 'Docs',
    };

    let optimized = text;
    for (const [long, short] of Object.entries(replacements)) {
      optimized = optimized.replace(new RegExp(long, 'g'), short);
    }

    // Remove extra whitespace
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // Limit length for mobile
    if (optimized.length > 500) {
      optimized = optimized.substring(0, 497) + '...';
    }

    return optimized;
  }
}

// =====================================================
// MOBILE CACHE MANAGER
// =====================================================

class MobileCacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data: MobileResponseCompressor.compress(data),
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// =====================================================
// MOBILE API HANDLERS
// =====================================================

export class MobileAPIHandlers {
  private nlpSystem: AdvancedNLPSystem;
  private languageSystem: MultiLanguageSystem;
  private teamHandler: EnhancedTeamHandler;
  private cache: MobileCacheManager;

  constructor(
    nlpSystem: AdvancedNLPSystem,
    languageSystem: MultiLanguageSystem,
    teamHandler: EnhancedTeamHandler
  ) {
    this.nlpSystem = nlpSystem;
    this.languageSystem = languageSystem;
    this.teamHandler = teamHandler;
    this.cache = new MobileCacheManager();

    // Cleanup cache every 10 minutes
    setInterval(() => this.cache.cleanup(), 10 * 60 * 1000);
  }

  async handleMobileChat(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const { query, session_id, context }: MobileChatRequest = req.body;

    try {
      // Generate cache key
      const cacheKey = `mobile_chat_${query}_${context.language || 'it'}_${context.device_info?.device_type || 'unknown'}`;

      // Check cache first
      let cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        cachedResponse.meta.cache_hit = true;
        res.json(cachedResponse);
        return;
      }

      // Detect language
      const detectedLanguage = context.language || this.languageSystem.detectQueryLanguage(query);

      // Analyze query with NLP
      const nlpResult = await this.nlpSystem.analyzeQuery(query, {
        mobile_optimized: true,
        device_type: context.device_info?.device_type,
        language: detectedLanguage,
      });

      // Process with language system
      const languageResult = await this.languageSystem.processQueryWithLanguage(
        query,
        session_id,
        detectedLanguage
      );

      // Determine response type
      let response: MobileChatResponse;

      if (nlpResult.entities.some((e) => e.type === 'person')) {
        response = await this.handleTeamQuery(
          query,
          session_id,
          context,
          nlpResult,
          languageResult
        );
      } else if (nlpResult.entities.some((e) => e.type === 'price' || e.intent === 'pricing')) {
        response = await this.handlePricingQuery(
          query,
          session_id,
          context,
          nlpResult,
          languageResult
        );
      } else {
        response = await this.handleGeneralQuery(
          query,
          session_id,
          context,
          nlpResult,
          languageResult
        );
      }

      // Optimize response for mobile
      response.data.response = MobileResponseCompressor.optimizeForMobile(response.data.response);

      // Add mobile metadata
      response.meta = {
        response_time_ms: Date.now() - startTime,
        compressed: true,
        cache_hit: false,
        mobile_optimized: true,
        character_count: response.data.response.length,
        reading_time_seconds: Math.ceil(response.data.response.length / 200), // Average reading speed
      };

      // Cache the response
      this.cache.set(cacheKey, response, 3); // Cache for 3 minutes

      res.json(response);
    } catch (error: any) {
      logger.error('Mobile chat error:', error instanceof Error ? error : new Error(String(error)));

      const errorResponse: MobileChatResponse = {
        success: false,
        data: {
          response:
            languageResult?.language === 'id'
              ? 'Maaf, terjadi kesalahan. Silakan coba lagi.'
              : languageResult?.language === 'en'
                ? 'Sorry, an error occurred. Please try again.'
                : 'Mi dispiace, si è verificato un errore. Riprova.',
          type: 'general',
          entities: [],
          language: detectedLanguage || 'it',
          localized: true,
        },
        meta: {
          response_time_ms: Date.now() - startTime,
          compressed: false,
          cache_hit: false,
          mobile_optimized: true,
          character_count: 0,
          reading_time_seconds: 0,
        },
      };

      res.status(500).json(errorResponse);
    }
  }

  private async handleTeamQuery(
    query: string,
    sessionId: string,
    context: any,
    nlpResult: any,
    languageResult: any
  ): Promise<MobileChatResponse> {
    try {
      // Use enhanced team handler
      const teamResult = await this.teamHandler.handleTeamRecognition({
        query,
        user_id: `mobile_${sessionId}`,
        session_id: sessionId,
        context: {
          ...context,
          mobile_optimized: true,
          language: languageResult.language,
        },
      });

      if (teamResult.success && teamResult.member_found) {
        return {
          success: true,
          data: {
            response: teamResult.response,
            type: 'team',
            entities: nlpResult.entities,
            language: languageResult.language,
            localized: languageResult.localized,
            member_info: teamResult.member_info,
            suggestions: this.generateTeamSuggestions(teamResult.member_info),
            follow_up_questions: this.generateTeamFollowUps(
              teamResult.member_info,
              languageResult.language
            ),
          },
        };
      }
    } catch (error: any) {
      logger.error('Team query error:', error instanceof Error ? error : new Error(String(error)));
    }

    // Fallback to general response
    return this.generateGeneralResponse(query, nlpResult, languageResult);
  }

  private async handlePricingQuery(
    query: string,
    sessionId: string,
    context: any,
    nlpResult: any,
    languageResult: any
  ): Promise<MobileChatResponse> {
    // Extract service from entities or query
    const serviceEntity = nlpResult.entities.find((e: any) => e.type === 'service');
    const service = serviceEntity?.value || query;

    const pricingInfo = {
      service: service,
      price_range: {
        min: 500,
        max: 2000,
        currency: 'USD',
      },
      estimated_time: '3-7 hari',
      requirements: ['Passport', 'Company Documents', 'Tax ID'],
      next_steps: ['Consultation', 'Document Preparation', 'Submission'],
      contact_methods: [
        { type: 'whatsapp', value: '+62 812-3456-7890', recommended: true },
        { type: 'email', value: 'info@balizero.com', recommended: false },
      ],
      mobile_payment_options: ['Transfer Bank', 'E-Wallet', 'Credit Card'],
    };

    return {
      success: true,
      data: {
        response: this.generatePricingResponse(pricingInfo, languageResult.language),
        type: 'pricing',
        entities: nlpResult.entities,
        language: languageResult.language,
        localized: languageResult.localized,
        pricing_info: pricingInfo,
        suggestions: ['Consultazione gratuita', 'Preventivo dettagliato', 'Documenti richiesti'],
      },
    };
  }

  private async handleGeneralQuery(
    query: string,
    sessionId: string,
    context: any,
    nlpResult: any,
    languageResult: any
  ): Promise<MobileChatResponse> {
    return this.generateGeneralResponse(query, nlpResult, languageResult);
  }

  private generateGeneralResponse(
    query: string,
    nlpResult: any,
    languageResult: any
  ): MobileChatResponse {
    const responses = {
      it: [
        'Posso aiutarti con informazioni sul team Bali Zero, servizi aziendali o consulenza legale. Cosa ti interessa?',
        'Sono qui per assisterti con registrazioni aziendali, permessi di lavoro e servizi legali in Indonesia.',
        'Posso fornirti informazioni sui nostri consulenti o aiutarti con una consulenza gratuita.',
      ],
      en: [
        'I can help you with Bali Zero team information, business services, or legal consulting. What interests you?',
        "I'm here to assist you with company registrations, work permits, and legal services in Indonesia.",
        'I can provide information about our consultants or help you with a free consultation.',
      ],
      id: [
        'Saya dapat membantu Anda dengan informasi tim Bali Zero, layanan bisnis, atau konsultasi hukum. Apa yang Anda minati?',
        'Saya di sini untuk membantu Anda dengan pendaftaran perusahaan, izin kerja, dan layanan hukum di Indonesia.',
        'Saya dapat memberikan informasi tentang konsultan kami atau membantu Anda dengan konsultasi gratis.',
      ],
    };

    const langResponses =
      responses[languageResult.language as keyof typeof responses] || responses.it;
    const response = langResponses[Math.floor(Math.random() * langResponses.length)];

    return {
      success: true,
      data: {
        response,
        type: 'general',
        entities: nlpResult.entities,
        language: languageResult.language,
        localized: languageResult.localized,
        suggestions: ['Team Bali Zero', 'Servizi', 'Consulenza gratuita'],
      },
    };
  }

  private generatePricingResponse(pricingInfo: any, language: string): string {
    const templates = {
      it: `💰 **${pricingInfo.service}**\n\n**Prezzo:** ${pricingInfo.price_range.min}-${pricingInfo.price_range.max} USD\n**Tempo stimato:** ${pricingInfo.estimated_time}\n\n**Requisiti:**\n${pricingInfo.requirements.map((r: string) => `• ${r}`).join('\n')}\n\n**Prossimi passi:**\n${pricingInfo.next_steps.map((s: string) => `• ${s}`).join('\n')}`,
      en: `💰 **${pricingInfo.service}**\n\n**Price:** ${pricingInfo.price_range.min}-${pricingInfo.price_range.max} USD\n**Estimated time:** ${pricingInfo.estimated_time}\n\n**Requirements:**\n${pricingInfo.requirements.map((r: string) => `• ${r}`).join('\n')}\n\n**Next steps:**\n${pricingInfo.next_steps.map((s: string) => `• ${s}`).join('\n')}`,
      id: `💰 **${pricingInfo.service}**\n\n**Harga:** ${pricingInfo.price_range.min}-${pricingInfo.price_range.max} USD\n**Waktu estimasi:** ${pricingInfo.estimated_time}\n\n**Persyaratan:**\n${pricingInfo.requirements.map((r: string) => `• ${r}`).join('\n')}\n\n**Langkah selanjutnya:**\n${pricingInfo.next_steps.map((s: string) => `• ${s}`).join('\n')}`,
    };

    return templates[language as keyof typeof templates] || templates.it;
  }

  private generateTeamSuggestions(memberInfo: any): string[] {
    const suggestions = [
      'Contatta via WhatsApp',
      'Fissa una consulenza',
      'Visualizza profilo completo',
    ];

    if (memberInfo.specialties && memberInfo.specialties.length > 0) {
      suggestions.push(`Servizi ${memberInfo.specialties[0]}`);
    }

    return suggestions.slice(0, 3);
  }

  private generateTeamFollowUps(memberInfo: any, language: string): string[] {
    const templates = {
      it: [
        `Qual è l'esperienza di ${memberInfo.name}?`,
        `Come posso contattare ${memberInfo.name}?`,
        `Quali servizi offre ${memberInfo.name}?`,
      ],
      en: [
        `What is ${memberInfo.name}'s experience?`,
        `How can I contact ${memberInfo.name}?`,
        `What services does ${memberInfo.name} offer?`,
      ],
      id: [
        `Berapa pengalaman ${memberInfo.name}?`,
        `Bagaimana cara menghubungi ${memberInfo.name}?`,
        `Layanan apa yang ditawarkan ${memberInfo.name}?`,
      ],
    };

    return templates[language as keyof typeof templates] || templates.it;
  }

  async handleMobileTeamList(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const {
      department,
      limit = 10,
      offset = 0,
      search,
      mobile,
    }: MobileTeamListRequest = req.query as any;

    try {
      const cacheKey = `mobile_team_list_${department || 'all'}_${limit}_${offset}_${search || ''}_${mobile}`;

      let cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        cachedResponse.meta.cache_time_minutes = Math.floor(
          (Date.now() - cachedResponse.timestamp) / 60000
        );
        res.json(cachedResponse);
        return;
      }

      // Get team list from team handler
      const teamList = await this.teamHandler.handleTeamList({
        department,
        limit: parseInt(limit.toString()),
        offset: parseInt(offset.toString()),
        search,
      });

      // Optimize for mobile
      const mobileOptimizedMembers = teamList.data.team_members.map((member: any) => ({
        ...member,
        response_format: mobile ? 'mobile-compact' : 'mobile-detailed',
        // Shorten descriptions for mobile
        specialties: member.specialties?.slice(0, 3) || [],
        // Ensure avatar URL is mobile-friendly
        avatar: member.avatar ? member.avatar.replace('/large/', '/small/') : null,
      }));

      const response: MobileTeamListResponse = {
        success: true,
        data: {
          team_members: mobileOptimizedMembers,
          total_count: teamList.data.total_count,
          departments: teamList.data.departments,
          has_more:
            parseInt(offset.toString()) + parseInt(limit.toString()) < teamList.data.total_count,
        },
        meta: {
          response_time_ms: Date.now() - startTime,
          cache_time_minutes: 0,
          compressed: true,
        },
      };

      this.cache.set(cacheKey, response, 10); // Cache for 10 minutes
      res.json(response);
    } catch (error: any) {
      logger.error('Mobile team list error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        error: 'Failed to load team list',
        meta: { response_time_ms: Date.now() - startTime },
      });
    }
  }

  async handleMobilePricingEstimate(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const {
      service,
      location,
      business_type,
      urgency,
      mobile_optimized,
      device_type,
    }: MobilePricingRequest = req.body;

    try {
      // Generate pricing estimate based on service
      const pricingData = await this.generatePricingEstimate(
        service,
        location,
        business_type,
        urgency
      );

      const response: MobilePricingResponse = {
        success: true,
        data: pricingData,
        meta: {
          location_specific: !!location,
          last_updated: new Date().toISOString(),
          confidence: pricingData.confidence || 0.8,
        },
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Mobile pricing error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        error: 'Failed to generate pricing estimate',
        meta: { response_time_ms: Date.now() - startTime },
      });
    }
  }

  private async generatePricingEstimate(
    service: string,
    location?: string,
    businessType?: string,
    urgency?: string
  ): Promise<any> {
    // Pricing logic based on service type
    const basePrices = {
      'company registration': { min: 800, max: 2500 },
      'work permit': { min: 1200, max: 3500 },
      'tax id': { min: 300, max: 800 },
      'business license': { min: 500, max: 1500 },
      investment: { min: 2000, max: 10000 },
      consulting: { min: 150, max: 500 },
    };

    const serviceKey =
      Object.keys(basePrices).find((key) => service.toLowerCase().includes(key)) || 'consulting';

    let priceRange = basePrices[serviceKey as keyof typeof basePrices];

    // Adjust for urgency
    if (urgency === 'urgent') {
      priceRange = {
        min: priceRange.min * 1.5,
        max: priceRange.max * 1.5,
      };
    }

    // Adjust for location
    const locationMultiplier = location?.toLowerCase().includes('bali') ? 1.0 : 1.1;

    return {
      service: service,
      price_range: {
        min: Math.round(priceRange.min * locationMultiplier),
        max: Math.round(priceRange.max * locationMultiplier),
        currency: 'USD',
      },
      estimated_time: urgency === 'urgent' ? '1-3 hari' : '3-7 hari',
      requirements: this.getRequirementsForService(serviceKey),
      next_steps: ['Consultation', 'Document Preparation', 'Submission'],
      contact_methods: [
        { type: 'whatsapp', value: '+62 812-3456-7890', recommended: true },
        { type: 'email', value: 'info@balizero.com', recommended: false },
        { type: 'phone', value: '+62 361 123456', recommended: false },
      ],
      mobile_payment_options: ['Transfer Bank', 'E-Wallet (OVO/Gopay)', 'Credit Card', 'Crypto'],
      confidence: 0.85,
    };
  }

  private getRequirementsForService(serviceKey: string): string[] {
    const requirements = {
      'company registration': ['Passport', 'Address', 'Company Name', 'Business Plan'],
      'work permit': ['Passport', 'CV', 'Education Certificates', 'Work Contract'],
      'tax id': ['Passport', 'Address', 'Company Documents'],
      'business license': ['Company Registration', 'Tax ID', 'Business Address'],
      investment: ['Investment Plan', 'Financial Statements', 'Passport'],
      consulting: ['Basic Information', 'Specific Questions'],
    };

    return requirements[serviceKey as keyof typeof requirements] || ['Basic Information'];
  }

  async handleMobileAnalytics(req: Request, res: Response): Promise<void> {
    const { event, data } = req.body;

    try {
      // Log analytics for mobile optimization
      logger.info('Mobile Analytics:', {
        event,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          user_agent: req.get('User-Agent'),
        },
      });

      // In a real implementation, this would be stored in a database
      // For now, just acknowledge receipt

      res.json({
        success: true,
        message: 'Analytics recorded successfully',
      });
    } catch (error: any) {
      logger.error('Mobile analytics error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        error: 'Failed to record analytics',
      });
    }
  }
}

// =====================================================
// MOBILE API ROUTES
// =====================================================

export function createMobileRoutes(
  nlpSystem: AdvancedNLPSystem,
  languageSystem: MultiLanguageSystem,
  teamHandler: EnhancedTeamHandler
): Router {
  const router = Router();
  const handlers = new MobileAPIHandlers(nlpSystem, languageSystem, teamHandler);

  // POST /api/mobile/chat - Main chat endpoint with mobile optimization
  router.post('/chat', async (req, res) => {
    await handlers.handleMobileChat(req, res);
  });

  // GET /api/mobile/team/list - Team list optimized for mobile
  router.get('/team/list', async (req, res) => {
    await handlers.handleMobileTeamList(req, res);
  });

  // POST /api/mobile/pricing/estimate - Pricing estimate for mobile
  router.post('/pricing/estimate', async (req, res) => {
    await handlers.handleMobilePricingEstimate(req, res);
  });

  // POST /api/mobile/analytics - Mobile analytics tracking
  router.post('/analytics', async (req, res) => {
    await handlers.handleMobileAnalytics(req, res);
  });

  // GET /api/mobile/health - Mobile health check
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      mobile_api: true,
      timestamp: new Date().toISOString(),
      features: {
        chat: true,
        team_list: true,
        pricing: true,
        analytics: true,
        compression: true,
        caching: true,
      },
    });
  });

  return router;
}
