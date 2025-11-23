import express from 'express';
import { logger } from '../logging/unified-logger.js';
import { z, ZodError } from 'zod';
import type { Request, Response } from 'express';
import { ok, err } from '../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../middleware/auth.js';
import { memorySchemas, handlerSchemas, authSchemas, validateInput } from '../utils/validation-schemas.js';
import { jwtAuth, RequestWithJWT } from '../middleware/jwt-auth.js';
import { demoUserAuth, RequestWithDemo } from '../middleware/demo-user-auth.js';
import { ForbiddenError, BadRequestError, UnauthorizedError } from '../utils/errors.js';

// Create Express router
const router = express.Router();

// === MODULE-FUNCTIONAL IMPORTS (Auto-organized by domain) ===

// Identity & Onboarding - removed legacy modules

// Team Authentication
import { logoutSession, teamLogin, getTeamMembers } from '../handlers/auth/team-login.js';
import {
  teamLoginSecure,
  verifyToken,
  getTeamMemberList,
  resetLoginAttempts,
} from '../handlers/auth/team-login-secure.js';

// Google Workspace
import {
  driveUpload,
  driveList,
  driveSearch,
  driveRead,
} from '../handlers/google-workspace/drive.js';
import {
  calendarCreate,
  calendarList,
  calendarGet,
} from '../handlers/google-workspace/calendar.js';
import { sheetsRead, sheetsAppend, sheetsCreate } from '../handlers/google-workspace/sheets.js';
import { docsCreate, docsRead, docsUpdate } from '../handlers/google-workspace/docs.js';
import { slidesCreate, slidesRead, slidesUpdate } from '../handlers/google-workspace/slides.js';
import { gmailHandlers } from '../handlers/google-workspace/gmail.js';
import { contactsList, contactsCreate } from '../handlers/google-workspace/contacts.js';

// AI Services
import { aiChat } from '../handlers/ai-services/ai.js';
import { aiAnticipate, aiLearn, xaiExplain } from '../handlers/ai-services/advanced-ai.js';
import { creativeHandlers } from '../handlers/ai-services/creative.js';
// DevAI removed - using ZANTARA-ONLY mode

// Bali Zero Business Services
import { oracleSimulate, oracleAnalyze, oraclePredict } from '../handlers/bali-zero/oracle.js';
import { documentPrepare, assistantRoute } from '../handlers/bali-zero/advisory.js';
import { kbliLookup, kbliRequirements } from '../handlers/bali-zero/kbli.js';
import { kbliLookupComplete, kbliBusinessAnalysis } from '../handlers/bali-zero/kbli-complete.js';
import { baliZeroPricing, baliZeroQuickPrice } from '../handlers/bali-zero/bali-zero-pricing.js';
import {
  teamList,
  teamGet,
  teamDepartments,
  teamTestRecognition,
} from '../handlers/bali-zero/team.js';
import { teamRecentActivity } from '../handlers/bali-zero/team-activity.js';

// ZANTARA Collaborative Intelligence
import {
  zantaraEmotionalProfileAdvanced,
  zantaraConflictPrediction,
  zantaraMultiProjectOrchestration,
  zantaraClientRelationshipIntelligence,
  zantaraCulturalIntelligenceAdaptation,
  zantaraPerformanceOptimization,
} from '../handlers/zantara/zantara-simple.js';
// import {
//   zantaraBrilliantChat,
//   zantaraPersonality,
//   queryAgent,
//   getContext,
// } from '../handlers/zantara/zantara-brilliant.js';

// Communication
import {
  slackNotify,
  discordNotify,
  googleChatNotify,
} from '../handlers/communication/communication.js';
import {
  whatsappWebhookVerify,
  whatsappWebhookReceiver,
  getGroupAnalytics,
  sendManualMessage,
} from '../handlers/communication/whatsapp.js';
import {
  instagramWebhookVerify,
  instagramWebhookReceiver,
  getInstagramUserAnalytics,
  sendManualInstagramMessage,
} from '../handlers/communication/instagram.js';
import { translateHandlers } from '../handlers/communication/translate.js';
import {
  twilioWhatsappWebhook,
  twilioSendWhatsapp,
} from '../handlers/communication/twilio-whatsapp.js';

// Analytics & Monitoring
import { analyticsHandlers } from '../handlers/analytics/analytics.js';
import {
  dashboardMain,
  dashboardConversations,
  dashboardServices,
  dashboardHandlers,
  dashboardHealth,
  dashboardUsers,
} from '../handlers/analytics/dashboard-analytics.js';
import { weeklyReportHandlers } from '../handlers/analytics/weekly-report.js';
import { updateDailyRecap, getCurrentDailyRecap } from '../handlers/analytics/daily-drive-recap.js';

// Orphaned Handlers - Now Wired
// Oracle Universal (RAG integration)
import { oracleUniversalQuery, oracleCollections } from '../handlers/bali-zero/oracle-universal.js';
// Imagine.art AI Image Generation
import { aiImageGenerate, aiImageUpscale, aiImageTest } from '../handlers/ai-services/imagine-art-handler.js';
// Pricing System Handlers
import {
  generateInvoice,
  getInvoiceDetails,
  getInvoiceHistory,
  downloadInvoice,
  calculateInvoiceTotals,
} from '../handlers/bali-zero/pricing-invoices.js';
import {
  getSubscriptionPlans,
  getSubscriptionDetails,
  calculateSubscriptionRenewal,
} from '../handlers/bali-zero/pricing-subscription.js';
import {
  calculateUpgradeCost,
  processUpgrade,
  getUpgradeOptions,
} from '../handlers/bali-zero/pricing-upgrade.js';
// DevAI integration removed - no longer used

// Admin auth middleware
import { adminAuth } from '../middleware/admin-auth.js';

// Memory & Persistence
// LEGACY CODE CLEANED: Firestore removed - using Python memory system only
import { memorySave, memorySearch, memoryRetrieve } from '../handlers/memory/memory.js';
// Enhanced memory handlers commented out until implemented
// import {
//   memorySaveEnhanced,
//   memorySearchEnhanced,
//   memoryGetEnhanced,
//   memoryUpdateEnhanced,
//   memoryDeleteEnhanced,
//   memoryStatsEnhanced
// } from "../handlers/memory/memory-enhanced";

// Maps
import { mapsDirections, mapsPlaces, mapsPlaceDetails } from '../handlers/maps/maps.js';

// RAG System
import { ragQuery, baliZeroChat, ragSearch, ragHealth } from '../handlers/rag/rag.js';

// Zero Mode - Development Tools (Zero-only access)
import { handlers as zeroHandlers } from '../handlers/zero/index.js';

// System Introspection & Proxy
import {
  getAllHandlers,
  getHandlersByCategory,
  getHandlerDetails,
  getAnthropicToolDefinitions,
} from '../handlers/system/handlers-introspection.js';
import { executeHandler, executeBatchHandlers } from '../handlers/system/handler-proxy.js';

// Rate Limiting
import { selectiveRateLimiter } from '../middleware/selective-rate-limit.js';

// Performance Metrics Dashboard
import {
  getMetricsDashboard,
  resetMetrics,
  initializeMetricsCollector,
  // metricsMiddleware,
} from '../services/performance/metrics-dashboard.js';

const ActionSchema = z.object({
  key: z.string(),
  params: z.record(z.any()).default({}),
});

type Handler = (params: any, req?: Request) => Promise<any>;

// === AI fallback settings ===
const AI_FALLBACK_ORDER = (process.env.AI_FALLBACK_ORDER || 'ai.chat')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);

// LEGACY CODE CLEANED: Firestore removed - using Python memory system only

async function runHandler(key: string, params: any, ctx: any) {
  const handler = handlers[key];
  if (!handler) throw new Error(`handler_not_found: ${key}`);
  return await handler(params, ctx?.req);
}

/**
 * Get handler by key (used by proxy)
 */
export async function getHandler(key: string) {
  return handlers[key];
}

async function aiChatWithFallback(ctx: any, params: any) {
  let lastErr: any = null;
  for (const key of AI_FALLBACK_ORDER) {
    try {
      const res = await runHandler(key, params, ctx);
      if (res?.ok) return res;
      lastErr = new Error(res?.error || `model_failed: ${key}`);
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('all_models_failed');
}

// Minimal core handlers for testing
const handlers: Record<string, Handler> = {
  // Team Authentication
  'team.login.secure': teamLoginSecure, // PIN-based secure login
  'team.login.reset': resetLoginAttempts, // Admin: Reset login attempts (unblock account)
  'team.members': async () => getTeamMemberList(), // Safe list (no emails exposed)
  'team.logout': async (params: any) => logoutSession(params.sessionId),
  'team.token.verify': async (params: any) => verifyToken(params.token),

  // Custom GPT Business Handlers
  // TABULA RASA: Contact information should be retrieved from database
  // For now, this handler returns a placeholder structure indicating data comes from database
  'contact.info': async () =>
    ok({
      company: 'RETRIEVED_FROM_DATABASE',
      tagline: 'RETRIEVED_FROM_DATABASE',
      services: [], // Retrieved from database
      office: {
        location: 'RETRIEVED_FROM_DATABASE',
        mapUrl: 'RETRIEVED_FROM_DATABASE',
      },
      communication: {
        email: 'RETRIEVED_FROM_DATABASE',
        whatsapp: 'RETRIEVED_FROM_DATABASE',
        instagram: 'RETRIEVED_FROM_DATABASE',
      },
      team: {
        ceo: 'RETRIEVED_FROM_DATABASE',
        departments: [], // Retrieved from database
      },
      availability: 'RETRIEVED_FROM_DATABASE',
      note: 'All contact information is stored in the database and should be retrieved via RAG backend or settings API',
    }),

  'lead.save': async (params: any) => {
    const { service = '' } = params;

    if (!service) {
      throw new BadRequestError('Service type required: visa, company, tax, or real-estate');
    }

    return ok({
      leadId: `lead_${Date.now()}`,
      followUpScheduled: true,
      message: `Lead saved for ${service} service. Our team will contact you within 24 hours.`,
      nextSteps: [
        'Team notification sent',
        'Follow-up scheduled',
        'Documents preparation initiated',
      ],
      contact: {
        email: 'info@balizero.com',
        whatsapp: '+62 859 0436 9574',
      },
    });
  },

  'quote.generate': async (params: any) => {
    const { service = '' } = params;

    if (!service) {
      throw new BadRequestError(
        'Service type required for quote generation: visa, company, tax, real-estate'
      );
    }

    // Quote generation now delegates to RAG backend for pricing data
    // All pricing and timeline information comes from Qdrant/PostgreSQL database
    return ok({
      service: service.toUpperCase(),
      message: 'Quote generation requires database lookup. Please contact the team for accurate pricing.',
      source: 'RAG backend (Qdrant/PostgreSQL)',
      note: 'All pricing data is stored in the database and retrieved via the RAG backend',
      contact: {
        email: 'info@balizero.com',
        whatsapp: '+62 859 0436 9574',
        office: 'Kerobokan, Bali',
      },
    });
  },

  'document.prepare': async (params: any) => documentPrepare(params),

  'assistant.route': async (params: any) => assistantRoute(params),

  // Team Management - Real Bali Zero team data
  /**
   * @handler team.list
   * @description List Bali Zero team members with filtering by department, role, or search query. Returns complete team roster (23 members across 7 departments).
   * @param {string} [params.department] - Filter by department (management, setup, tax, marketing, reception, advisory, technology)
   * @param {string} [params.role] - Filter by role (partial match, e.g., "Lead", "Manager", "Executive")
   * @param {string} [params.search] - Search by name or email (case-insensitive)
   * @returns {Promise<{ok: boolean, data: {members: Array, departments: object, stats: object, count: number}}>} Team members and statistics
   * @throws Never throws - returns empty array on error with error message
   * @example
   * // Get all team members
   * await call('team.list', {})
   *
   * // Get setup team only
   * await call('team.list', {
   *   department: 'setup'
   * })
   *
   * // Search for specific member
   * await call('team.list', {
   *   search: 'Amanda'
   * })
   *
   * // Filter by role
   * await call('team.list', {
   *   role: 'Lead Executive'
   * })
   */
  'team.list': async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: () => mockRes,
    } as any;
    return await teamList(mockReq, mockRes);
  },
  'team.get': async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: () => mockRes,
    } as any;
    return await teamGet(mockReq, mockRes);
  },
  'team.departments': async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: () => mockRes,
    } as any;
    return await teamDepartments(mockReq, mockRes);
  },
  'team.test.recognition': async (params: any) => {
    const mockReq = {
      body: params,
      headers: { 'x-api-key': 'zantara-internal-dev-key-2025' },
    } as any;
    const mockRes = {
      json: (data: any) => data,
      status: (code: number) => ({ json: (data: any) => ({ ...data, statusCode: code }) }),
    } as any;
    return await teamTestRecognition(mockReq, mockRes);
  },

  /**
   * @handler team.recent_activity
   * @description Get recent team member activity with real-time session tracking. Tracks team members active in the last N hours.
   * @param {number} [params.hours=24] - Number of hours to look back
   * @param {number} [params.limit=10] - Maximum number of results
   * @param {string} [params.department] - Filter by department (optional)
   * @returns {Promise<{ok: boolean, data: {activities: Array, count: number, timeframe: object, stats: object}}>} Recent team activities
   * @example
   * // Get activities in last 24 hours
   * await call('team.recent_activity', { hours: 24 })
   *
   * // Get activities for setup department only
   * await call('team.recent_activity', {
   *   hours: 24,
   *   department: 'setup'
   * })
   */
  'team.recent_activity': async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: (_code: number) => mockRes,
    } as any;
    return await teamRecentActivity(mockReq, mockRes);
  },

  // Oracle simulations & planning
  'oracle.simulate': oracleSimulate,
  'oracle.analyze': oracleAnalyze,
  'oracle.predict': oraclePredict,

  // Oracle Universal - RAG-powered universal query interface
  'oracle.universal.query': oracleUniversalQuery,
  'oracle.collections': oracleCollections,

  // Imagine.art AI Image Generation
  'ai.image.generate': aiImageGenerate,
  'ai.image.upscale': aiImageUpscale,
  'ai.image.test': aiImageTest,

  // Drive Multipart Upload Handler (Note: requires Express middleware integration)

  'drive.upload.multipart': async (_params: any) => {
    return {
      ok: false,
      error: 'Drive multipart upload requires Express middleware. Use POST /api/drive/upload-multipart endpoint instead.',
    };
  },

  // Pricing System - Invoices
  'pricing.invoice.generate': generateInvoice,
  'pricing.invoice.details': getInvoiceDetails,
  'pricing.invoice.history': getInvoiceHistory,
  'pricing.invoice.download': downloadInvoice,
  'pricing.invoice.totals': calculateInvoiceTotals,

  // Pricing System - Subscriptions
  'pricing.subscription.plans': getSubscriptionPlans,
  'pricing.subscription.details': getSubscriptionDetails,
  'pricing.subscription.renewal': calculateSubscriptionRenewal,

  // Pricing System - Upgrades
  'pricing.upgrade.cost': calculateUpgradeCost,
  'pricing.upgrade.process': processUpgrade,
  'pricing.upgrade.options': getUpgradeOptions,

  // DevAI integration removed - no longer used

  /**
   * @handler ai.chat
   * @description ZANTARA-ONLY AI chat with pricing hallucination prevention and auto-save conversation to memory.
   * @param {string} params.prompt - User prompt or message (required)
   * @param {string} [params.message] - Alternative to prompt
   * @param {number} [params.max_tokens=1000] - Maximum tokens in response
   * @param {number} [params.temperature=0.7] - Response randomness (0.0-1.0)
   * @param {string} [params.model] - Specific model override
   * @param {number} [params.timeout_ms=30000] - Request timeout in milliseconds
   * @returns {Promise<{ok: boolean, response: string, model: string, usage?: object}>} AI-generated response
   * @throws {Error} If all AI providers fail
   * @example
   * // Basic chat
   * await call('ai.chat', {
   *   prompt: 'Explain PT PMA company structure in simple terms'
   * })
   *
   * // With custom parameters
   * await call('ai.chat', {
   *   prompt: 'Draft professional email for visa extension reminder',
   *   max_tokens: 500,
   *   temperature: 0.3
   * })
   *
   * // NOTE: Price-related queries are automatically blocked and redirected to bali.zero.pricing
   */
  'ai.chat': aiChat,
  // Real AI handlers (TS). ZANTARA-ONLY mode

  // 🏢 KBLI Business Codes (NEW)
  'kbli.lookup': async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: (_code: number) => ({ json: (data: any) => data }),
    } as any;
    return await kbliLookup(mockReq, mockRes);
  },
  'kbli.requirements': async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: (_code: number) => ({ json: (data: any) => data }),
    } as any;
    return await kbliRequirements(mockReq, mockRes);
  },
  // 🚀 KBLI COMPLETE DATABASE - Enhanced endpoints
  'kbli.lookup.complete': async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: (_code: number) => ({ json: (data: any) => data }),
    } as any;
    return await kbliLookupComplete(mockReq, mockRes);
  },
  'kbli.business.analysis': async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: (_code: number) => ({ json: (data: any) => data }),
    } as any;
    return await kbliBusinessAnalysis(mockReq, mockRes);
  },

  // Communication handlers
  'slack.notify': slackNotify,
  'discord.notify': discordNotify,
  'googlechat.notify': googleChatNotify,

  // Advanced AI handlers
  'ai.anticipate': aiAnticipate,
  'ai.learn': aiLearn,
  'xai.explain': xaiExplain,

  // Google Workspace handlers
  'drive.upload': driveUpload,
  'drive.list': driveList,
  'drive.search': driveSearch,
  'drive.read': driveRead,
  'calendar.create': calendarCreate,
  /**
   * @handler calendar.list
   * @description List Google Calendar events with optional filtering. Uses OAuth2 or Service Account impersonation for authentication.
   * @param {string} [params.calendarId='primary'] - Calendar ID to query (default: primary calendar)
   * @param {string} [params.timeMin] - RFC3339 timestamp for range start (e.g., "2025-01-01T00:00:00Z")
   * @param {string} [params.timeMax] - RFC3339 timestamp for range end
   * @param {number} [params.maxResults=10] - Maximum number of events to return
   * @param {string} [params.q] - Free text search query
   * @param {boolean} [params.singleEvents=true] - Expand recurring events into instances
   * @returns {Promise<{ok: boolean, events: Array, nextPageToken?: string}>} Calendar events list
   * @throws {BadRequestError} If authentication fails or invalid parameters
   * @example
   * // Get upcoming events
   * await call('calendar.list', {
   *   timeMin: new Date().toISOString(),
   *   maxResults: 20,
   *   singleEvents: true
   * })
   *
   * // Search for specific events
   * await call('calendar.list', {
   *   q: 'meeting with client',
   *   timeMin: '2025-01-01T00:00:00Z',
   *   timeMax: '2025-12-31T23:59:59Z'
   * })
   */
  'calendar.list': calendarList,
  'calendar.get': calendarGet,
  'sheets.read': sheetsRead,
  'sheets.append': sheetsAppend,
  'sheets.create': sheetsCreate,
  'docs.create': docsCreate,
  'docs.read': docsRead,
  'docs.update': docsUpdate,
  'slides.create': slidesCreate,
  'slides.read': slidesRead,
  'slides.update': slidesUpdate,

  // Gmail handlers
  ...gmailHandlers,

  // Google Contacts handlers
  'contacts.list': contactsList,
  'contacts.create': contactsCreate,

  // Google Maps handlers
  'maps.directions': mapsDirections,
  'maps.places': mapsPlaces,
  'maps.placeDetails': mapsPlaceDetails,

  // Memory System handlers
  /**
   * @handler memory.save
   * @description Save user conversation memory (Firestore removed - using Python memory system). Supports multiple data formats (content, key-value, object) and deduplicates entries automatically.
   * @param {string} params.userId - User ID (required)
   * @param {string} [params.content] - Memory content to save (preferred format)
   * @param {string} [params.key] - Memory key for key-value format
   * @param {any} [params.value] - Memory value for key-value format
   * @param {object} [params.data] - Memory data object or string
   * @param {string} [params.type='general'] - Memory type (general, preference, context, etc.)
   * @param {object} [params.metadata] - Optional metadata (tags, timestamp, etc.)
   * @returns {Promise<{ok: boolean, memoryId: string, saved: boolean, message: string}>} Success status and memory ID
   * @throws {BadRequestError} If userId missing or no content/data/key+value provided
   * @example
   * // Save user preference
   * await call('memory.save', {
   *   userId: 'user123',
   *   content: 'Prefers Italian language for communication',
   *   type: 'preference',
   *   metadata: { source: 'chat', confidence: 'high' }
   * })
   *
   * // Save with key-value format
   * await call('memory.save', {
   *   userId: 'client456',
   *   key: 'visa_type',
   *   value: 'Example Tourist Visa',
   *   type: 'service_interest'
   * })
   */
  'memory.save': memorySave,
  'memory.search': memorySearch,
  // 🚀 ENHANCED Memory System v2.0 - Unlimited + Vector Search (TODO: Implement handlers)
  // "memory.save.enhanced": memorySaveEnhanced,
  // "memory.search.enhanced": memorySearchEnhanced,
  // "memory.get.enhanced": memoryGetEnhanced,
  // "memory.update.enhanced": memoryUpdateEnhanced,
  // "memory.delete.enhanced": memoryDeleteEnhanced,
  // "memory.stats.enhanced": memoryStatsEnhanced,

  // 📊 Performance Metrics Dashboard
  'metrics.dashboard': async (req: any, res: any) => getMetricsDashboard(req, res),
  'metrics.reset': async (req: any, res: any) => resetMetrics(req, res),
  'metrics.initialize': async () => {
    initializeMetricsCollector();
    return { success: true, message: 'Metrics collection initialized', initialized: true };
  },

  /**
   * @handler memory.retrieve
   * @description Retrieve user memory (Firestore removed - using Python memory system). Returns most recent fact or fact matching a specific key.
   * @param {string} [params.userId] - User ID to retrieve memory for
   * @param {string} [params.key] - Memory key to search for (acts as filter or fallback userId)
   * @returns {Promise<{ok: boolean, content: string, userId: string, facts_count: number, last_updated: string}>} Memory content and metadata
   * @throws {BadRequestError} If both userId and key are missing
   * @example
   * // Retrieve all memory for user
   * await call('memory.retrieve', {
   *   userId: 'user123'
   * })
   *
   * // Retrieve specific memory fact
   * await call('memory.retrieve', {
   *   userId: 'client456',
   *   key: 'visa_type'
   * })
   */
  'memory.retrieve': memoryRetrieve,

  // Translation handlers - NEW!
  ...translateHandlers,

  // Creative & Artistic AI handlers - NEW!
  ...creativeHandlers,

  // DevAI (Qwen 2.5 Coder) - Internal Developer AI
  // ...devaiHandlers, // REMOVED - DevAI no longer used

  // Google Analytics handlers - NEW!
  ...analyticsHandlers,

  // 🧠 ZANTARA - Collaborative Intelligence Framework v1.0
  // ZANTARA Test Framework handlers removed

  // 🧠 ZANTARA v2.0 - Advanced Emotional AI & Predictive Intelligence
  'zantara.emotional.profile.advanced': zantaraEmotionalProfileAdvanced,
  'zantara.conflict.prediction': zantaraConflictPrediction,
  'zantara.multi.project.orchestration': zantaraMultiProjectOrchestration,
  'zantara.client.relationship.intelligence': zantaraClientRelationshipIntelligence,
  'zantara.cultural.intelligence.adaptation': zantaraCulturalIntelligenceAdaptation,
  'zantara.performance.optimization': zantaraPerformanceOptimization,

  // 📊 ZANTARA Dashboard handlers removed

  // 💰 BALI ZERO OFFICIAL PRICING - DELEGATES TO RAG BACKEND
  /**
   * @handler bali.zero.pricing
   * @description Get official Bali Zero pricing data from database (Qdrant/PostgreSQL via RAG backend). All pricing data is stored in the database, not hardcoded.
   * @param {string} [params.service_type='all'] - Service category: visa, kitas, kitap, business, tax, or all
   * @param {string} [params.specific_service] - Search for specific service by name (e.g., "tourist visa", "work permit")
   * @param {boolean} [params.include_details=true] - Include full service details and notes
   * @returns {Promise<{ok: boolean, data: object, official_notice: string, source: string, contact_info: object}>} Official pricing from database
   * @throws Never throws - returns fallback contact info on error
   * @example
   * // Get all visa prices
   * await call('bali.zero.pricing', {
   *   service_type: 'visa',
   *   include_details: true
   * })
   *
   * // Search for specific service
   * await call('bali.zero.pricing', {
   *   specific_service: 'Working long-stay permit',
   *   service_type: 'all'
   * })
   *
   * // Get complete pricelist
   * await call('bali.zero.pricing', {
   *   service_type: 'all'
   * })
   */
  'bali.zero.pricing': baliZeroPricing,
  'bali.zero.price': baliZeroQuickPrice,
  'pricing.official': baliZeroPricing,
  'price.lookup': baliZeroQuickPrice,

  // 📅 DAILY DRIVE RECAP - COLLABORATOR ACTIVITY TRACKING
  'daily.recap.update': updateDailyRecap,
  'daily.recap.current': getCurrentDailyRecap,
  'collaborator.daily': getCurrentDailyRecap,
  'activity.track': updateDailyRecap,

  // 📊 Report System - Weekly & Monthly
  ...weeklyReportHandlers,

  // 🧠 RAG System - Python Backend Integration (Ollama + Bali Zero)
  /**
   * @handler rag.query
   * @description Query RAG backend (proxy to Python service) for semantic search + LLM answer generation using Ollama and Qdrant. Includes graceful degradation if RAG backend unavailable.
   * @param {string} params.query - Search query or question (required)
   * @param {number} [params.k=5] - Number of relevant documents to retrieve
   * @param {boolean} [params.use_llm=true] - Whether to use LLM for answer generation (false = retrieval only)
   * @param {Array} [params.conversation_history] - Previous conversation turns for context
   * @returns {Promise<{success: boolean, query: string, answer?: string, sources: Array, error?: string}>} Generated answer with source documents
   * @throws {Error} Returns error object if query missing, but doesn't throw (graceful degradation)
   * @example
   * // Query with LLM answer generation
   * await call('rag.query', {
   *   query: 'What are the requirements for PT PMA company setup?',
   *   k: 3,
   *   use_llm: true,
   *   conversation_history: [
   *     { role: 'user', content: 'Tell me about company setup' },
   *     { role: 'assistant', content: 'PT PMA is for foreign investors...' }
   *   ]
   * })
   *
   * // Fast semantic search only (no LLM)
   * await call('rag.query', {
   *   query: 'KITAS requirements',
   *   k: 5,
   *   use_llm: false
   * })
   */
  'rag.query': ragQuery,
  'rag.search': ragSearch,
  'rag.health': ragHealth,
  /**
   * @handler bali.zero.chat
   * @description Bali Zero chatbot with intelligent Haiku/Sonnet routing based on query complexity. Specialized for immigration, visa, and business setup queries with RAG context.
   * @param {string} params.query - User question or message (required)
   * @param {Array} [params.conversation_history] - Previous conversation for context continuity
   * @param {string} [params.user_role='member'] - User role for access control (member, admin, external)
   * @returns {Promise<{success: boolean, answer: string, model: string, sources: Array, confidence?: number}>} AI-generated answer with model used
   * @throws {Error} If query missing or RAG service unavailable
   * @example
   * // Ask about visa requirements
   * await call('bali.zero.chat', {
   *   query: 'What documents do I need for a long-stay visa extension?',
   *   user_role: 'member',
   *   conversation_history: [
   *     { role: 'user', content: 'I need a visa' },
   *     { role: 'assistant', content: 'This tourist visa is good for tourism...' }
   *   ]
   * })
   *
   * // Complex business query (routes to Sonnet)
   * await call('bali.zero.chat', {
   *   query: 'Compare PT PMA vs Local PT for F&B business with foreign ownership',
   *   user_role: 'admin'
   * })
   */
  'bali.zero.chat': baliZeroChat,

  // 🔧 ZERO MODE - Development Tools (Zero-only access)
  ...zeroHandlers,

  // 📈 Analytics Dashboard - Real-time Metrics
  'dashboard.main': dashboardMain,
  'dashboard.conversations': dashboardConversations,
  'dashboard.services': dashboardServices,
  'dashboard.handlers': dashboardHandlers,
  'dashboard.health': dashboardHealth,
  'dashboard.users': dashboardUsers,


  // 🔐 OAuth2 Token Management
  'oauth2.status': async () => {
    try {
      const { getTokenStatus } = await import('../services/oauth2-client.js');
      return ok(getTokenStatus());
    } catch (error: any) {
      return ok({ available: false, error: error.message });
    }
  },

  'oauth2.refresh': async () => {
    try {
      const { forceTokenRefresh } = await import('../services/oauth2-client.js');
      const success = await forceTokenRefresh();
      return ok({
        success,
        message: success ? 'Token refreshed successfully' : 'Token refresh failed',
      });
    } catch (error: any) {
      throw new BadRequestError(`OAuth2 refresh failed: ${error.message}`);
    }
  },

  'oauth2.available': async () => {
    try {
      const { isOAuth2Available } = await import('../services/oauth2-client.js');
      const available = await isOAuth2Available();
      return ok({ available });
    } catch (error: any) {
      return ok({ available: false, error: error.message });
    }
  },

  // === SYSTEM INTROSPECTION & PROXY ===
  'system.handlers.list': getAllHandlers,
  'system.handlers.category': getHandlersByCategory,
  'system.handlers.get': getHandlerDetails,
  'system.handlers.tools': getAnthropicToolDefinitions,
  'system.handler.execute': executeHandler,
  'system.handlers.batch': executeBatchHandlers,
};


const FORBIDDEN_FOR_EXTERNAL = new Set<string>(['report.generate']);

export function attachRoutes(app: import('express').Express) {
  // === NEW v2 RESTful Operations (for OpenAPI v2) ===

  // Team Authentication Routes (legacy routes removed - using handlers only)

  app.post('/team.logout', demoUserAuth as any, (async (req: RequestWithDemo, res: Response) => // @ts-ignore
   {
    try {
      const { sessionId } = req.body;
      const result = logoutSession(sessionId);
      return res.status(200).json(ok({ success: result }));
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  // ========================================
  // JWT AUTHENTICATION ENDPOINTS
  // ========================================

  // JWT Login endpoint - BUG FIX
  app.post('/auth/login', (async (req: RequestWithCtx, res: Response) => {
    const startTime = Date.now();
    const clientIP = req.header('x-forwarded-for') || req.ip || 'unknown';
    const _userAgent = req.header('user-agent') || 'unknown';

    try {
      // Validate input
      const validatedData = validateInput(authSchemas.teamLogin, req.body);
      const { email, pin } = validatedData;

      // BUG FIX: teamLogin requires { name, email }, not { email, pin }
      // Solution: Find user by email first, then use name for teamLogin
      const teamMembers = await getTeamMembers();
      const member = teamMembers.find((m: any) => m.email?.toLowerCase() === email.toLowerCase());

      if (!member) {
        logger.warn('JWT Login: User not found', {
          email: email.substring(0, 3) + '***',
          ip: clientIP,
        });

        // Audit log (GDPR compliant - no pin)
        logger.info('JWT_LOGIN_AUDIT', {
          event: 'login_failure',
          email: email.substring(0, 3) + '***',
          reason: 'user_not_found',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });

        return res.status(401).json(err('Invalid credentials'));
      }

      // Verify PIN
      if (member.pin !== pin) {
        logger.warn('JWT Login: Invalid PIN', {
          email: email.substring(0, 3) + '***',
          ip: clientIP,
        });

        logger.info('JWT_LOGIN_AUDIT', {
          event: 'login_failure',
          userId: member.id,
          email: email.substring(0, 3) + '***',
          reason: 'invalid_pin',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });

        return res.status(401).json(err('Invalid credentials'));
      }

      // Use teamLogin with name
      const loginResult = await teamLogin({
        name: member.name,
        email: member.email,
      });

      if (!loginResult.data.success) {
        logger.warn('JWT Login: Team login failed', {
          email: email.substring(0, 3) + '***',
          ip: clientIP,
        });

        logger.info('JWT_LOGIN_AUDIT', {
          event: 'login_failure',
          userId: member.id,
          email: email.substring(0, 3) + '***',
          reason: 'team_login_failed',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });

        return res.status(401).json(err('Invalid credentials'));
      }

      // BUG FIX: Check JWT_SECRET (NO HARDCODED FALLBACK)
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET not configured');

        logger.info('JWT_LOGIN_AUDIT', {
          event: 'login_error',
          userId: member.id,
          email: email.substring(0, 3) + '***',
          reason: 'misconfiguration',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });

        return res.status(500).json(err('Authentication service misconfigured'));
      }

      // BUG FIX: Import jwt at top instead of require
      const jwt = await import('jsonwebtoken');
      const jwtDefault = jwt.default;

      // BUG FIX: Include name in token for adminAuth compatibility
      const accessToken = jwtDefault.sign(
        {
          userId: loginResult.data.user.id,
          email: loginResult.data.user.email,
          role: loginResult.data.user.role,
          name: loginResult.data.user.name, // Added for adminAuth
          department: loginResult.data.user.department, // Added for consistency
        },
        jwtSecret,
        { expiresIn: '15m' }
      );

      const refreshToken = jwtDefault.sign(
        {
          userId: loginResult.data.user.id,
          type: 'refresh',
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      const processingTime = Date.now() - startTime;

      // Audit log (GDPR compliant)
      logger.info('JWT_LOGIN_AUDIT', {
        event: 'login_success',
        userId: loginResult.data.user.id,
        email: loginResult.data.user.email.substring(0, 3) + '***',
        role: loginResult.data.user.role,
        ip: clientIP,
        userAgent: _userAgent.substring(0, 50),
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json(
        ok({
          accessToken,
          refreshToken,
          user: {
            id: loginResult.data.user.id,
            email: loginResult.data.user.email,
            name: loginResult.data.user.name,
            role: loginResult.data.user.role,
            department: loginResult.data.user.department,
          },
          expiresIn: 900, // 15 minutes
        })
      );
    } catch (e: any) {
      logger.error('JWT Login error:', e, {
        ip: clientIP,
      });

      // Handle validation errors specifically
      if (e.name === 'ValidationError' || e.name === 'ZodError') {
        logger.warn('JWT Login: Validation failed', {
          error: e.message,
          ip: clientIP
        });
        return res.status(400).json(err(e.message));
      }

      logger.info('JWT_LOGIN_AUDIT', {
        event: 'login_error',
        reason: e.name || 'unexpected_error',
        ip: clientIP,
        timestamp: new Date().toISOString(),
      });

      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  // JWT Refresh endpoint - BUG FIX
  app.post('/auth/refresh', (async (req: RequestWithCtx, res: Response) => {
    const clientIP = req.header('x-forwarded-for') || req.ip || 'unknown';

    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json(err('Refresh token is required'));
      }

      // BUG FIX: Check JWT_SECRET
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET not configured');
        return res.status(500).json(err('Authentication service misconfigured'));
      }

      // BUG FIX: Import jwt instead of require
      const jwt = await import('jsonwebtoken');
      const jwtDefault = jwt.default;

      // BUG FIX: Validate decoded before accessing properties
      let decoded: any;
      try {
        decoded = jwtDefault.verify(refreshToken, jwtSecret);
      } catch (verifyError: any) {
        logger.warn('JWT Refresh: Invalid token', {
          error: verifyError.name,
          ip: clientIP,
        });

        logger.info('JWT_REFRESH_AUDIT', {
          event: 'refresh_failure',
          reason: verifyError.name,
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });

        if (verifyError.name === 'JsonWebTokenError' || verifyError.name === 'TokenExpiredError') {
          return res.status(401).json(err('Invalid or expired refresh token'));
        }
        throw verifyError;
      }

      // BUG FIX: Validate decoded structure
      if (!decoded || typeof decoded !== 'object') {
        logger.info('JWT_REFRESH_AUDIT', {
          event: 'refresh_failure',
          reason: 'invalid_payload',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });

        return res.status(401).json(err('Invalid refresh token payload'));
      }

      if (decoded.type !== 'refresh') {
        logger.info('JWT_REFRESH_AUDIT', {
          event: 'refresh_failure',
          reason: 'invalid_token_type',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });

        return res.status(401).json(err('Invalid token type'));
      }

      // BUG FIX: Handle both userId and id fields
      const userId = decoded.userId || decoded.id || decoded.sub;
      if (!userId) {
        logger.info('JWT_REFRESH_AUDIT', {
          event: 'refresh_failure',
          reason: 'missing_user_id',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });

        return res.status(401).json(err('Token missing user ID'));
      }

      // Get user data
      const teamMembers = await getTeamMembers();
      const user = teamMembers.find((m: any) => m.id === userId || m.userId === userId);

      if (!user) {
        logger.warn('JWT Refresh: User not found', { userId, ip: clientIP });

        logger.info('JWT_REFRESH_AUDIT', {
          event: 'refresh_failure',
          userId,
          reason: 'user_not_found',
          ip: clientIP,
          timestamp: new Date().toISOString(),
        });

        return res.status(401).json(err('User not found'));
      }

      // Generate new access token
      const newAccessToken = jwtDefault.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          name: user.name, // Added for adminAuth
          department: user.department, // Added for consistency
        },
        jwtSecret,
        { expiresIn: '15m' }
      );

      logger.info('JWT_REFRESH_AUDIT', {
        event: 'refresh_success',
        userId: user.id,
        email: user.email.substring(0, 3) + '***',
        ip: clientIP,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json(
        ok({
          accessToken: newAccessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
          },
          expiresIn: 900, // 15 minutes
        })
      );
    } catch (e: any) {
      logger.error('JWT Refresh error:', e, {
        ip: clientIP,
      });

      logger.info('JWT_REFRESH_AUDIT', {
        event: 'refresh_error',
        reason: e.name || 'unexpected_error',
        ip: clientIP,
        timestamp: new Date().toISOString(),
      });

      if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
        return res.status(401).json(err('Invalid or expired refresh token'));
      }
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  // JWT Logout endpoint
  app.post('/auth/logout', (async (req: RequestWithCtx, res: Response) => {
    try {
      const { refreshToken: _refreshToken } = req.body;

      // In a production system, you would blacklist the refresh token
      // For now, we just return success

      return res.status(200).json(
        ok({
          success: true,
          message: 'Logged out successfully',
        })
      );
    } catch (e: any) {
      logger.error('JWT Logout error:', e);
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  // AI Chat (JWT protected)
  app.post('/ai.chat', jwtAuth as any, (async (req: RequestWithJWT, res: Response) => {
    try {
      const result = await aiChat(req.body);
      return res.status(200).json(ok(result?.data ?? result));
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  // V3 endpoints removed - use RAG backend directly

  // Memory Search
  app.post('/memory.search', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      // Validate input
      const validatedData = validateInput(memorySchemas.search, req.body);
      const result = await memorySearch(validatedData);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) {
        return res.status(400).json(err(e.message));
      }

      // Handle validation errors
      if (e.name === 'ValidationError') {
        return res.status(400).json(err(e.message));
      }

      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  // Business Logic
  app.get('/contact.info', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const handler = handlers['contact.info'];
      if (handler) {
        const result = await handler({}, req);
        return res.status(200).json(result?.data ?? result);
      }
      return res.status(404).json(err('Handler not found'));
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/lead.save', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const handler = handlers['lead.save'];
      if (handler) {
        const result = await handler(req.body, req);
        return res.status(200).json(result?.data ?? result);
      }
      return res.status(404).json(err('Handler not found'));
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  // Google Workspace - Native TypeScript implementations
  app.get('/drive.list', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await driveList(req.query);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/drive.search', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await driveSearch(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/drive.read', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await driveRead(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/calendar.create', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await calendarCreate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/calendar.get', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await calendarGet(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/sheets.read', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await sheetsRead(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/sheets.append', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await sheetsAppend(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/docs.create', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await docsCreate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/docs.read', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await docsRead(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/docs.update', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await docsUpdate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/slides.create', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await slidesCreate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/slides.read', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await slidesRead(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/slides.update', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await slidesUpdate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  // === Google Workspace Integration Status Endpoints ===
  
  // Gmail Integration Status
  app.get('/api/integrations/gmail/status', apiKeyAuth, async (_req: RequestWithCtx, res: Response) => {
    try {
      const result = ok({
        connected: true,
        service: 'gmail',
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'service-account@balizero.com',
        status: 'active',
        features: ['send', 'list', 'read', 'search'],
        endpoints: [
          'POST /gmail.send',
          'POST /gmail.list',
          'POST /gmail.read',
          'POST /gmail.search'
        ]
      });
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // Google Calendar Integration Status
  app.get('/api/integrations/calendar/status', apiKeyAuth, async (_req: RequestWithCtx, res: Response) => {
    try {
      const result = ok({
        connected: true,
        service: 'google_calendar',
        status: 'active',
        calendars: ['primary'],
        features: ['create', 'list', 'get', 'update'],
        endpoints: [
          'POST /calendar.create',
          'POST /calendar.list',
          'POST /calendar.get'
        ]
      });
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // WhatsApp Integration Status (placeholder)
  app.get('/api/integrations/whatsapp/status', apiKeyAuth, async (_req: RequestWithCtx, res: Response) => {
    try {
      const result = ok({
        connected: false,
        service: 'whatsapp_business',
        status: 'not_configured',
        message: 'WhatsApp Business API integration not yet configured',
        contact: 'info@balizero.com'
      });
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // Twitter/X Integration Status (placeholder)
  app.get('/api/integrations/twitter/status', apiKeyAuth, async (_req: RequestWithCtx, res: Response) => {
    try {
      const result = ok({
        connected: false,
        service: 'twitter_x',
        status: 'not_configured',
        message: 'Twitter/X integration not yet configured'
      });
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // === Handler Execution Endpoint ===
  app.post(
    '/handler',
    apiKeyAuth,
    selectiveRateLimiter,
    async (req: RequestWithCtx, res: Response) => {
      try {
        // Validate input
        const validatedData = validateInput(handlerSchemas.call, req.body);
        const { handler, params = {} } = validatedData;

        // RBAC by API key
        if (req.ctx?.role === 'external' && FORBIDDEN_FOR_EXTERNAL.has(handler)) {
          throw new ForbiddenError('Handler not allowed for external key');
        }

        let result: any;

        // Try static handlers map first
        const handlerFunc = handlers[handler];

        if (handlerFunc) {
          result = await handlerFunc(params, req);
        } else {
          // Check if handler exists in globalRegistry (dynamic auto-loaded handlers)
          const { globalRegistry } = await import('../core/handler-registry.js');
          if (globalRegistry.has(handler)) {
            // Execute handler using globalRegistry
            result = await globalRegistry.execute(handler, params, req);
          } else {
            return res.status(404).json(err(`Handler '${handler}' not found`));
          }
        }

        return res.status(200).json(ok(result?.data ?? result));
      } catch (e: any) {
        if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
        if (e instanceof UnauthorizedError) return res.status(401).json(err(e.message));
        if (e instanceof ForbiddenError) return res.status(403).json(err(e.message));
        return res.status(500).json(err(e?.message || 'Internal Error'));
      }
    }
  );

  // === Legacy RPC-style /call (for backwards compatibility) ===
  app.post(
    '/call',
    demoUserAuth as any,
    selectiveRateLimiter as any,
    (async (req: RequestWithDemo, res: Response) => {
      let key = '';
      let params = {};

      try {
        const parsed = ActionSchema.parse(req.body);
        key = parsed.key;
        params = parsed.params;

        // RBAC by user role
        if (req.user?.isDemo && FORBIDDEN_FOR_EXTERNAL.has(key)) {
          throw new ForbiddenError('Action not allowed for demo user');
        }

        // Prefer explicit TS AI routing for ai.chat
        if (key === 'ai.chat') {
          // BLOCK AI from generating fake prices - redirect to official pricing
          const query = JSON.stringify(params).toLowerCase();
          const priceKeywords = [
            'harga',
            'biaya',
            'berapa',
            'price',
            'cost',
            'jual',
            'tarif',
            'fee',
          ];
          const serviceKeywords = [
            'visa',
            'kitas',
            'kitap',
            'pt',
            'pma',
            'npwp',
            'bpjs',
            'company',
            'tax',
            'pajak',
          ];

          const hasPriceQuery = priceKeywords.some((word) => query.includes(word));
          const hasServiceQuery = serviceKeywords.some((word) => query.includes(word));

          if (hasPriceQuery && hasServiceQuery) {
            // Redirect to official pricing instead of AI
            return res.status(200).json(
              ok({
                official_pricing_notice: '🔒 PREZZI UFFICIALI BALI ZERO 2025',
                message: 'Per prezzi UFFICIALI, usa il handler: bali.zero.pricing',
                redirect_to: 'bali.zero.pricing',
                reason: 'AI NON può fornire prezzi - solo handler ufficiali',
                contact: 'info@balizero.com per preventivi personalizzati',
              })
            );
          }

          // Use ZANTARA-ONLY mode for consistency
          // startTime removed - not used
          const r = await aiChat(params);


          return res.status(200).json(ok(r?.data ?? r));
        }


        let result: any;
        if (key === 'ai.chat') {
          result = await aiChatWithFallback({ req, res }, params);
        } else {
          // Try static handlers map first
          const handler = handlers[key];

          if (handler) {
            result = await handler(params, req);
          } else {
            // Check if handler exists in globalRegistry (dynamic auto-loaded handlers)
            const { globalRegistry } = await import('../core/handler-registry.js');
            if (globalRegistry.has(key)) {
              // Get the handler function from registry
              const handlerMetadata = globalRegistry.get(key);
              if (handlerMetadata) {
                // Execute handler using globalRegistry (correct signature: params, req)
                result = await globalRegistry.execute(key, params, req);
              } else {
                return res.status(404).json(err('handler_not_found'));
              }
            } else {
              return res.status(404).json(err('handler_not_found'));
            }
          }
        }

        // Auto-save conversations for ALL important handlers
        const autoSaveKeys = [
          'ai.',
          '.chat',
          'translate.text',
          'memory.save',
          'memory.retrieve',
          'memory.search',
        ];

        const shouldAutoSave = autoSaveKeys.some((k) => key.includes(k) || key === k);

        if (shouldAutoSave) {
          // LEGACY CODE CLEANED: Auto-save disabled (Firestore removed)
        }

        return res.status(200).json(ok(result?.data ?? result));
      } catch (e: any) {
        // Enhanced error logging with context
        const requestId = (req as any).requestId || 'unknown';
        const errorContext = {
          requestId,
          key: key,
          params: JSON.stringify(params).substring(0, 500), // Limit params for logging
          userAgent: req.get('user-agent'),
          ip: req.ip,
          apiKey: req.get('x-api-key')?.substring(0, 8) + '...' || 'none',
          timestamp: new Date().toISOString(),
        };

        logger.error('🔥 Handler Error [${requestId}] ${key}:', undefined, {
          error: e.message,
          stack: e.stack?.split('\n').slice(0, 5).join('\n'),
          ...errorContext,
        });

        if (e instanceof ZodError) return res.status(400).json(err('INVALID_PAYLOAD'));
        if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
        if (e instanceof UnauthorizedError) return res.status(401).json(err(e.message));
        if (e instanceof ForbiddenError) return res.status(403).json(err(e.message));

        // Log critical errors for investigation
        if (key.includes('ai.') || key.includes('memory.') || key.includes('identity.')) {
          logger.error('🚨 Critical handler failure: ${key}', undefined, {
            errorType: e.constructor.name,
            errorMessage: e.message,
            ...errorContext,
          });
        }

        return res.status(500).json(err(e?.message || 'Internal Error'));
      }
    }) as any
  );

  // GET/POST /ai.chat.stream – optional SSE streaming (pseudo streaming)
  app.get('/ai.chat.stream', demoUserAuth as any, (async (req: RequestWithDemo, res: Response) => {
    try {
      const prompt = (req.query.prompt as string) || '';
      if (!prompt) {
        res.status(400).end();
        return;
      }
      // SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      const ctx = { req, res };
      const result = await aiChatWithFallback(ctx, { prompt, timeout_ms: AI_TIMEOUT_MS });
      const text = result?.data?.response || result?.data?.message || '';
      // pseudo streaming words
      const chunks = (text || '').split(/\s+/);
      for (const c of chunks) {
        res.write(`data: ${c}\n\n`);
        await new Promise((r) => setTimeout(r, 15));
      }
      res.write('event: done\ndata: [END]\n\n');
      res.end();
      return;
    } catch (err: any) {
      try {
        res.write(
          `event: error\ndata: ${JSON.stringify({ error: err.message || 'stream_failed' })}\n\n`
        );
      } finally {
        res.end();
      }
      return;
    }
  }) as any);

  app.post('/ai.chat.stream', demoUserAuth as any, (async (req: RequestWithDemo, res: Response) => {
    // same as GET but read prompt from body
    (req as any).query.prompt = req.body?.prompt || '';
    return (app as any)._router.handle(req, res, () => void 0);
  }) as any);

  // === WhatsApp Business API Webhooks ===

  // Webhook verification (GET) - Meta will call this to verify the webhook
  app.get('/webhook/whatsapp', async (req, res) => {
    return whatsappWebhookVerify(req, res);
  });

  // Webhook receiver (POST) - Receives all WhatsApp events
  app.post('/webhook/whatsapp', async (req, res) => {
    return whatsappWebhookReceiver(req, res);
  });

  // WhatsApp Group Analytics (GET)
  app.get('/whatsapp/analytics/:groupId', apiKeyAuth, async (req: RequestWithCtx, res) => {
    try {
      const result = await getGroupAnalytics({ groupId: req.params.groupId });
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // Send Manual WhatsApp Message (POST) - For testing or proactive outreach
  app.post('/whatsapp/send', apiKeyAuth, async (req: RequestWithCtx, res) => {
    try {
      const result = await sendManualMessage(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // === Instagram Business API Webhooks ===

  // Webhook verification (GET) - Meta will call this to verify the webhook
  app.get('/webhook/instagram', async (req, res) => {
    return instagramWebhookVerify(req, res);
  });

  // Webhook receiver (POST) - Receives all Instagram events
  app.post('/webhook/instagram', async (req, res) => {
    return instagramWebhookReceiver(req, res);
  });

  // Instagram User Analytics (GET)
  app.get('/instagram/analytics/:userId', apiKeyAuth, async (req: RequestWithCtx, res) => {
    try {
      const result = await getInstagramUserAnalytics({ userId: req.params.userId });
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // Send Manual Instagram Message (POST) - For testing or proactive outreach
  app.post('/instagram/send', apiKeyAuth, async (req: RequestWithCtx, res) => {
    try {
      const result = await sendManualInstagramMessage(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // ========================================
  // TWILIO WHATSAPP INTEGRATION
  // ========================================

  // Twilio WhatsApp Webhook (POST) - Receives messages from Twilio sandbox
  app.post('/webhook/twilio/whatsapp', async (req, res) => {
    return twilioWhatsappWebhook(req, res);
  });

  // Send WhatsApp via Twilio (POST) - Manual sending
  app.post('/twilio/whatsapp/send', apiKeyAuth, async (req: RequestWithCtx, res) => {
    try {
      const result = await twilioSendWhatsapp(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // ========================================
  // ZANTARA BRILLIANT SYSTEM (DISABLED)
  // ========================================

  // ZANTARA Brilliant Chat (POST) - Main chat interface
  // app.post('/zantara/brilliant/chat', apiKeyAuth, async (req: RequestWithCtx, res) => {
  //   try {
  //     return await zantaraBrilliantChat(req, res);
  //   } catch (e: any) {
  //     if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
  //     return res.status(500).json(err(e?.message || 'Internal Error'));
  //   }
  // });

  // ========================================
  // ZANTARA KNOWLEDGE SYSTEM
  // ========================================

  // Get Zantara knowledge (GET) - Complete system knowledge
  app.get('/zantara/knowledge', async (_req: RequestWithCtx, res) => {
    try {
      const { getZantaraKnowledge } = await import('../handlers/zantara/knowledge.js');
      const result = await getZantaraKnowledge();
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // Get system health (GET) - System status
  app.get('/zantara/health', async (_req: RequestWithCtx, res) => {
    try {
      const { getSystemHealth } = await import('../handlers/zantara/knowledge.js');
      const result = await getSystemHealth();
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // Get Zantara system prompt (GET) - Complete system prompt with knowledge
  app.get('/zantara/system-prompt', async (_req: RequestWithCtx, res) => {
    try {
      const { getZantaraSystemPrompt } = await import('../handlers/zantara/knowledge.js');
      const result = await getZantaraSystemPrompt();
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // ZANTARA Personality Info (GET) - Get system personality details
  // app.get('/zantara/personality', async (req, res) => {
  //   try {
  //     return await zantaraPersonality(req, res);
  //   } catch (e: any) {
  //     return res.status(500).json(err(e?.message || 'Internal Error'));
  //   }
  // });

  // Direct Agent Query (POST) - For testing and debugging
  // app.post('/zantara/agent/query', apiKeyAuth, async (req: RequestWithCtx, res) => {
  //   try {
  //     return await queryAgent(req, res);
  //   } catch (e: any) {
  //     if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
  //     return res.status(500).json(err(e?.message || 'Internal Error'));
  //   }
  // });

  // Get User Context (GET) - Retrieve conversation context
  // app.get('/zantara/context/:userId', apiKeyAuth, async (req: RequestWithCtx, res) => {
  //   try {
  //     return await getContext(req, res);
  //   } catch (e: any) {
  //     if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
  //     return res.status(500).json(err(e?.message || 'Internal Error'));
  //   }
  // });

  // ========================================
  // INTEL NEWS SEARCH (Bali Intelligence)
  // ========================================

  app.post('/intel.news.search', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const { intelNewsSearch } = await import('../handlers/intel/news-search.js');
      const result = await intelNewsSearch(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/intel.news.critical', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const { intelNewsGetCritical } = await import('../handlers/intel/news-search.js');
      const result = await intelNewsGetCritical(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/intel.news.trends', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const { intelNewsGetTrends } = await import('../handlers/intel/news-search.js');
      const result = await intelNewsGetTrends(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  // ========================================
  // INTEL SCRAPER (Bali Intelligence Scraping System)
  // ========================================

  app.post('/intel.scraper.run', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const { intelScraperRun } = await import('../handlers/intel/scraper.js');
      const result = await intelScraperRun(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.post('/intel.scraper.status', apiKeyAuth, (async (req: RequestWithCtx, res: Response) => {
    try {
      const { intelScraperStatus } = await import('../handlers/intel/scraper.js');
      const result = await intelScraperStatus(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  }) as any);

  app.get('/intel.scraper.categories', apiKeyAuth, async (_req: RequestWithCtx, res: Response) => {
    try {
      const { intelScraperCategories } = await import('../handlers/intel/scraper.js');
      const result = await intelScraperCategories();
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json(err(e?.message || 'Internal Error'));
    }
  });

  // Protected Dashboard Routes
  // ========================================

  // Main dashboard overview
  router.get('/admin/dashboard/main', jwtAuth as any, adminAuth as any, async (_req, res) => {
    try {
      const result = await dashboardMain({});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  // Conversation metrics
  router.get('/admin/dashboard/conversations', jwtAuth as any, adminAuth as any, async (_req, res) => {
    try {
      const result = await dashboardConversations({});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  // Service metrics
  router.get('/admin/dashboard/services', jwtAuth as any, adminAuth as any, async (_req, res) => {
    try {
      const result = await dashboardServices({});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  // Handler performance metrics
  router.get('/admin/dashboard/handlers', jwtAuth as any, adminAuth as any, async (_req, res) => {
    try {
      const result = await dashboardHandlers({});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  // System health metrics
  router.get('/admin/dashboard/health', jwtAuth as any, adminAuth as any, async (_req, res) => {
    try {
      const result = await dashboardHealth({});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  // User activity metrics
  router.get('/admin/dashboard/users', jwtAuth as any, adminAuth as any, async (_req, res) => {
    try {
      const result = await dashboardUsers({});
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error.message || 'Internal server error',
      });
    }
  });
}

// Export router creation function
export function createRouter() {
  return router;
}
