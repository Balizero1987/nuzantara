import { z, ZodError } from "zod";
import type { Request, Response } from "express";
import { ok, err } from "./utils/response.js";
import { apiKeyAuth, RequestWithCtx } from "./middleware/auth.js";
import { ForbiddenError, BadRequestError, UnauthorizedError } from "./utils/errors.js";
import { forwardToBridgeIfSupported } from './services/bridgeProxy.js';

// === MODULE-FUNCTIONAL IMPORTS (Auto-organized by domain) ===

// Identity & Onboarding
import { identityResolve, onboardingStart } from "./handlers/identity/identity.js";

// Google Workspace
import { driveUpload, driveList, driveSearch, driveRead } from "./handlers/google-workspace/drive.js";
import { calendarCreate, calendarList, calendarGet } from "./handlers/google-workspace/calendar.js";
import { sheetsRead, sheetsAppend, sheetsCreate } from "./handlers/google-workspace/sheets.js";
import { docsCreate, docsRead, docsUpdate } from "./handlers/google-workspace/docs.js";
import { slidesCreate, slidesRead, slidesUpdate } from "./handlers/google-workspace/slides.js";
import { gmailHandlers } from "./handlers/google-workspace/gmail.js";
import { contactsList, contactsCreate } from "./handlers/google-workspace/contacts.js";

// AI Services
import { aiChat, openaiChat, claudeChat, geminiChat, cohereChat } from "./handlers/ai-services/ai.js";
import { aiAnticipate, aiLearn, xaiExplain } from "./handlers/ai-services/advanced-ai.js";
import { creativeHandlers } from "./handlers/ai-services/creative.js";

// Bali Zero Business Services
import { oracleSimulate, oracleAnalyze, oraclePredict } from "./handlers/bali-zero/oracle.js";
import { documentPrepare, assistantRoute } from "./handlers/bali-zero/advisory.js";
import { kbliLookup, kbliRequirements } from "./handlers/bali-zero/kbli.js";
import { baliZeroPricing, baliZeroQuickPrice } from "./handlers/bali-zero/bali-zero-pricing.js";
import { teamList, teamGet, teamDepartments } from "./handlers/bali-zero/team.js";

// ZANTARA Collaborative Intelligence
import {
  zantaraPersonalityProfile,
  zantaraAttune,
  zantaraSynergyMap,
  zantaraAnticipateNeeds,
  zantaraCommunicationAdapt,
  zantaraLearnTogether,
  zantaraMoodSync,
  zantaraConflictMediate,
  zantaraGrowthTrack,
  zantaraCelebrationOrchestrate
} from "./handlers/zantara/zantara-test.js";
import {
  zantaraEmotionalProfileAdvanced,
  zantaraConflictPrediction,
  zantaraMultiProjectOrchestration,
  zantaraClientRelationshipIntelligence,
  zantaraCulturalIntelligenceAdaptation,
  zantaraPerformanceOptimization
} from "./handlers/zantara/zantara-v2-simple.js";
import {
  zantaraDashboardOverview,
  zantaraTeamHealthMonitor,
  zantaraPerformanceAnalytics,
  zantaraSystemDiagnostics
} from "./handlers/zantara/zantara-dashboard.js";

// Communication
import { slackNotify, discordNotify, googleChatNotify } from "./handlers/communication/communication.js";
import {
  whatsappWebhookVerify,
  whatsappWebhookReceiver,
  getGroupAnalytics,
  sendManualMessage
} from "./handlers/communication/whatsapp.js";
import {
  instagramWebhookVerify,
  instagramWebhookReceiver,
  getInstagramUserAnalytics,
  sendManualInstagramMessage
} from "./handlers/communication/instagram.js";
import {
  twilioWhatsappWebhook,
  twilioSendWhatsapp
} from "./handlers/communication/twilio-whatsapp.js";
import { translateHandlers } from "./handlers/communication/translate.js";

// Analytics & Monitoring
import { analyticsHandlers } from "./handlers/analytics/analytics.js";
import {
  dashboardMain,
  dashboardConversations,
  dashboardServices,
  dashboardHandlers,
  dashboardHealth,
  dashboardUsers
} from "./handlers/analytics/dashboard-analytics.js";
import { weeklyReportHandlers } from "./handlers/analytics/weekly-report.js";
import {
  updateDailyRecap,
  getCurrentDailyRecap
} from "./handlers/analytics/daily-drive-recap.js";

// Memory & Persistence
import { memorySave, memorySearch, memoryRetrieve, memoryList } from "./handlers/memory/memory-firestore.js";
import { autoSaveConversation } from "./handlers/memory/conversation-autosave.js";
import { userMemoryHandlers } from "./legacy-js/user-memory-handlers.js";

// Maps
import { mapsDirections, mapsPlaces, mapsPlaceDetails } from "./handlers/maps/maps.js";

// RAG System
import {
  ragQuery,
  baliZeroChat,
  ragSearch,
  ragHealth
} from "./handlers/rag/rag.js";

const ActionSchema = z.object({
  key: z.string(),
  params: z.record(z.any()).default({}),
});

type Handler = (params: any, req?: Request) => Promise<any>;

// === AI fallback settings ===
const AI_FALLBACK_ORDER = (process.env.AI_FALLBACK_ORDER || 'ai.chat,openai.chat,claude.chat,gemini.chat,cohere.chat')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);

async function runHandler(key: string, params: any, ctx: any) {
  const handler = handlers[key];
  if (!handler) throw new Error(`handler_not_found: ${key}`);
  return await handler(params, ctx?.req);
}

async function aiChatWithFallback(ctx: any, params: any) {
  let lastErr: any = null;
  for (const key of AI_FALLBACK_ORDER) {
    try {
      const res = await runHandler(key, params, ctx);
      if (res && res.ok) return res;
      lastErr = new Error(res?.error || `model_failed: ${key}`);
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('all_models_failed');
}

// Minimal core handlers for testing
const handlers: Record<string, Handler> = {
  // 🧩 Identity & AMBARADAM
  "identity.resolve": identityResolve,
  "onboarding.start": onboardingStart,
  "onboarding.ambaradam.start": onboardingStart, // Alias

  // Custom GPT Business Handlers
  "contact.info": async () => ok({
    company: "Bali Zero",
    tagline: "From Zero to Infinity ∞",
    services: ["Visas", "Company Setup", "Tax Consulting", "Real Estate Legal"],
    office: {
      location: "Kerobokan, Bali, Indonesia",
      mapUrl: "https://maps.app.goo.gl/i6DbEmfCtn1VJ3G58"
    },
    communication: {
      email: "info@balizero.com",
      whatsapp: "+62 859 0436 9574",
      instagram: "@balizero0"
    },
    team: {
      ceo: "Zainal Abidin",
      departments: ["Setup Team", "Tax Department", "Marketing", "Reception", "Board"]
    },
    availability: "24/7 via WhatsApp, Office hours 9AM-6PM Bali time"
  }),

  "lead.save": async (params: any) => {
    const { name = '', email = '', service = '', details = '', nationality = '', urgency = 'normal' } = params;

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
        'Documents preparation initiated'
      ],
      contact: {
        email: "info@balizero.com",
        whatsapp: "+62 859 0436 9574"
      }
    });
  },

  "quote.generate": async (params: any) => {
    const { service = '', details = '' } = params;

    if (!service) {
      throw new BadRequestError('Service type required for quote generation: visa, company, tax, real-estate');
    }

    const quotes = {
      visa: {
        'B211A (Visit Visa)': { price: '150', timeline: '3-5 days' },
        'B211B (Business Visa)': { price: '200', timeline: '5-7 days' },
        'B213 (Investor Visa)': { price: '500', timeline: '10-14 days' },
        'Kitas (Stay Permit)': { price: '800', timeline: '30-45 days' }
      },
      company: {
        'PT PMA (Foreign Investment)': { price: '2500', timeline: '30-45 days' },
        'Local PT': { price: '1200', timeline: '21-30 days' },
        'CV (Partnership)': { price: '800', timeline: '14-21 days' },
        'Foundation (Yayasan)': { price: '1000', timeline: '21-30 days' }
      },
      tax: {
        'Tax Registration (NPWP)': { price: '100', timeline: '5-7 days' },
        'Monthly Tax Reporting': { price: '200', timeline: 'Ongoing' },
        'Annual Tax Filing': { price: '500', timeline: '30 days' },
        'Tax Consultation': { price: '150', timeline: 'Same day' }
      },
      'real-estate': {
        'Property Legal Check': { price: '300', timeline: '7-10 days' },
        'Lease Agreement': { price: '200', timeline: '3-5 days' },
        'Property Purchase Support': { price: '1000', timeline: '30-60 days' },
        'Land Certificate (SHM)': { price: '1500', timeline: '60-90 days' }
      }
    };

    const serviceQuotes = quotes[service as keyof typeof quotes] || {};
    const quotesArray = Object.entries(serviceQuotes).map(([name, info]: [string, any]) => ({
      name,
      price: `€${info.price}`,
      timeline: info.timeline,
      currency: 'EUR'
    }));

    return ok({
      service: service.toUpperCase(),
      options: quotesArray,
      currency: 'EUR',
      validity: '30 days',
      includes: [
        'Professional consultation',
        'Document preparation',
        'Government liaison',
        'Follow-up support'
      ],
      nextSteps: [
        'Contact our team to proceed',
        'Provide required documents',
        'Process payment',
        'Begin application'
      ],
      contact: {
        email: 'info@balizero.com',
        whatsapp: '+62 859 0436 9574',
        office: 'Kerobokan, Bali'
      }
    });
  },

  "document.prepare": async (params: any) => documentPrepare(params),

  "assistant.route": async (params: any) => assistantRoute(params),

  // Team Management - Real Bali Zero team data
  "team.list": async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: () => mockRes
    } as any;
    return await teamList(mockReq, mockRes);
  },
  "team.get": async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: () => mockRes
    } as any;
    return await teamGet(mockReq, mockRes);
  },
  "team.departments": async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: () => mockRes
    } as any;
    return await teamDepartments(mockReq, mockRes);
  },

  // Oracle simulations & planning
  "oracle.simulate": oracleSimulate,
  "oracle.analyze": oracleAnalyze,
  "oracle.predict": oraclePredict,

  "ai.chat": aiChat,
  // Real AI handlers (TS). Router prefers these; bridgeProxy is used inside if keys missing.
  "openai.chat": openaiChat,
  "claude.chat": claudeChat,
  "gemini.chat": geminiChat,
  "cohere.chat": cohereChat,

  // 🏢 KBLI Business Codes (NEW)
  "kbli.lookup": async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: (code: number) => ({ json: (data: any) => data })
    } as any;
    return await kbliLookup(mockReq, mockRes);
  },
  "kbli.requirements": async (params: any) => {
    const mockReq = { body: { params } } as any;
    const mockRes = {
      json: (data: any) => data,
      status: (code: number) => ({ json: (data: any) => data })
    } as any;
    return await kbliRequirements(mockReq, mockRes);
  },

  // Communication handlers
  "slack.notify": slackNotify,
  "discord.notify": discordNotify,
  "googlechat.notify": googleChatNotify,

  // Advanced AI handlers
  "ai.anticipate": aiAnticipate,
  "ai.learn": aiLearn,
  "xai.explain": xaiExplain,

  // Google Workspace handlers
  "drive.upload": driveUpload,
  "drive.list": driveList,
  "drive.search": driveSearch,
  "drive.read": driveRead,
  "calendar.create": calendarCreate,
  "calendar.list": calendarList,
  "calendar.get": calendarGet,
  "sheets.read": sheetsRead,
  "sheets.append": sheetsAppend,
  "sheets.create": sheetsCreate,
  "docs.create": docsCreate,
  "docs.read": docsRead,
  "docs.update": docsUpdate,
  "slides.create": slidesCreate,
  "slides.read": slidesRead,
  "slides.update": slidesUpdate,

  // Gmail handlers
  ...gmailHandlers,

  // Google Contacts handlers
  "contacts.list": contactsList,
  "contacts.create": contactsCreate,

  // Google Maps handlers
  "maps.directions": mapsDirections,
  "maps.places": mapsPlaces,
  "maps.placeDetails": mapsPlaceDetails,

  // Memory System handlers
  "memory.save": memorySave,
  "memory.search": memorySearch,
  "memory.retrieve": memoryRetrieve,
  "memory.list": memoryList,

  // User Memory handlers (team members)
  ...userMemoryHandlers,

  // Translation handlers - NEW!
  ...translateHandlers,

  // Creative & Artistic AI handlers - NEW!
  ...creativeHandlers,

  // Google Analytics handlers - NEW!
  ...analyticsHandlers,

  // 🧠 ZANTARA - Collaborative Intelligence Framework v1.0
  "zantara.personality.profile": zantaraPersonalityProfile,
  "zantara.attune": zantaraAttune,
  "zantara.synergy.map": zantaraSynergyMap,
  "zantara.anticipate.needs": zantaraAnticipateNeeds,
  "zantara.communication.adapt": zantaraCommunicationAdapt,
  "zantara.learn.together": zantaraLearnTogether,
  "zantara.mood.sync": zantaraMoodSync,
  "zantara.conflict.mediate": zantaraConflictMediate,
  "zantara.growth.track": zantaraGrowthTrack,
  "zantara.celebration.orchestrate": zantaraCelebrationOrchestrate,

  // 🧠 ZANTARA v2.0 - Advanced Emotional AI & Predictive Intelligence
  "zantara.emotional.profile.advanced": zantaraEmotionalProfileAdvanced,
  "zantara.conflict.prediction": zantaraConflictPrediction,
  "zantara.multi.project.orchestration": zantaraMultiProjectOrchestration,
  "zantara.client.relationship.intelligence": zantaraClientRelationshipIntelligence,
  "zantara.cultural.intelligence.adaptation": zantaraCulturalIntelligenceAdaptation,
  "zantara.performance.optimization": zantaraPerformanceOptimization,

  // 📊 ZANTARA Dashboard - Real-Time Monitoring & Analytics
  "zantara.dashboard.overview": zantaraDashboardOverview,
  "zantara.team.health.monitor": zantaraTeamHealthMonitor,
  "zantara.performance.analytics": zantaraPerformanceAnalytics,
  "zantara.system.diagnostics": zantaraSystemDiagnostics,

  // 💰 BALI ZERO OFFICIAL PRICING - HARDCODED ONLY
  "bali.zero.pricing": baliZeroPricing,
  "bali.zero.price": baliZeroQuickPrice,
  "pricing.official": baliZeroPricing,
  "price.lookup": baliZeroQuickPrice,

  // 📅 DAILY DRIVE RECAP - COLLABORATOR ACTIVITY TRACKING
  "daily.recap.update": updateDailyRecap,
  "daily.recap.current": getCurrentDailyRecap,
  "collaborator.daily": getCurrentDailyRecap,
  "activity.track": updateDailyRecap,

  // 📊 Report System - Weekly & Monthly
  ...weeklyReportHandlers,

  // 🧠 RAG System - Python Backend Integration (Ollama + Bali Zero)
  "rag.query": ragQuery,
  "rag.search": ragSearch,
  "rag.health": ragHealth,
  "bali.zero.chat": baliZeroChat,

  // 📈 Analytics Dashboard - Real-time Metrics
  "dashboard.main": dashboardMain,
  "dashboard.conversations": dashboardConversations,
  "dashboard.services": dashboardServices,
  "dashboard.handlers": dashboardHandlers,
  "dashboard.health": dashboardHealth,
  "dashboard.users": dashboardUsers,

  // 🔌 WebSocket Admin - Connection Management
  "websocket.stats": async () => {
    const { websocketStats } = await import('./handlers/admin/websocket-admin.js');
    return await websocketStats({});
  },
  "websocket.broadcast": async (params: any) => {
    const { websocketBroadcast } = await import('./handlers/admin/websocket-admin.js');
    return await websocketBroadcast(params);
  },
  "websocket.send": async (params: any) => {
    const { websocketSendToUser } = await import('./handlers/admin/websocket-admin.js');
    return await websocketSendToUser(params);
  },

  // 🔐 OAuth2 Token Management
  "oauth2.status": async () => {
    try {
      const { getTokenStatus } = await import('./services/oauth2-client.js');
      return ok(getTokenStatus());
    } catch (error: any) {
      return ok({ available: false, error: error.message });
    }
  },

  "oauth2.refresh": async () => {
    try {
      const { forceTokenRefresh } = await import('./services/oauth2-client.js');
      const success = await forceTokenRefresh();
      return ok({ success, message: success ? 'Token refreshed successfully' : 'Token refresh failed' });
    } catch (error: any) {
      throw new BadRequestError(`OAuth2 refresh failed: ${error.message}`);
    }
  },

  "oauth2.available": async () => {
    try {
      const { isOAuth2Available } = await import('./services/oauth2-client.js');
      const available = await isOAuth2Available();
      return ok({ available });
    } catch (error: any) {
      return ok({ available: false, error: error.message });
    }
  },
};

const BRIDGE_ONLY_KEYS = [
  'ambaradam.profile.upsert', 'ambaradam.folder.ensure',
  'document.analyze',
  'drive.download',
  'drive.upload.enhanced', 'docs.create.enhanced', 'calendar.create.enhanced',
  'drive.upload.simple', 'sheets.append.simple',
  'memory.save.enhanced', 'memory.search.enhanced', 'memory.retrieve.enhanced',
  // user.memory.* handlers now registered directly in handlers map (see line 372)
  'workspace.create',
] as const;

BRIDGE_ONLY_KEYS.forEach((key) => {
  if (!handlers[key]) {
    handlers[key] = async (params: any) => {
      const bridged = await forwardToBridgeIfSupported(key, params);
      if (bridged !== null) {
        return bridged;
      }
      throw new BadRequestError(`Handler ${key} not available`);
    };
  }
});

const FORBIDDEN_FOR_EXTERNAL = new Set<string>([
  "report.generate",
]);

export function attachRoutes(app: import("express").Express) {
  // === NEW v2 RESTful Operations (for OpenAPI v2) ===

  // Identity Management
  app.post("/identity.resolve", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await identityResolve(req.body);
      return res.status(200).json(result?.data ?? result);
    } catch (e: any) {
      if (e instanceof ZodError) {
        return res.status(400).json(err('INVALID_PAYLOAD'));
      }
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      if (e instanceof UnauthorizedError) return res.status(401).json(err(e.message));
      if (e instanceof ForbiddenError) return res.status(403).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // AI Chat
  app.post("/ai.chat", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await openaiChat(req.body);
      return res.status(200).json(ok(result?.data ?? result));
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // Memory Search
  app.post("/memory.search", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await memorySearch(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) {
        return res.status(400).json(err(e.message));
      }

      const bridged = await forwardToBridgeIfSupported('memory.search', req.body);
      if (bridged !== null) {
        return res.status(200).json(bridged);
      }

      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // Business Logic
  app.get("/contact.info", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const handler = handlers["contact.info"];
      if (handler) {
        const result = await handler({}, req);
        return res.status(200).json(result?.data ?? result);
      }
      return res.status(404).json(err("Handler not found"));
    } catch (e: any) {
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/lead.save", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const handler = handlers["lead.save"];
      if (handler) {
        const result = await handler(req.body, req);
        return res.status(200).json(result?.data ?? result);
      }
      return res.status(404).json(err("Handler not found"));
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // Google Workspace - Native TypeScript implementations
  app.get("/drive.list", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await driveList(req.query);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/drive.search", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await driveSearch(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/drive.read", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await driveRead(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/calendar.create", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await calendarCreate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/calendar.get", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await calendarGet(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/sheets.read", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await sheetsRead(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/sheets.append", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await sheetsAppend(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/docs.create", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await docsCreate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/docs.read", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await docsRead(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/docs.update", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await docsUpdate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/slides.create", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await slidesCreate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/slides.read", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await slidesRead(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/slides.update", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await slidesUpdate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // Google Docs - REST endpoints
  app.post("/docs.create", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await docsCreate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/docs.read", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await docsRead(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  app.post("/docs.update", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    try {
      const result = await docsUpdate(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // === Legacy RPC-style /call (for backwards compatibility) ===
  app.post("/call", apiKeyAuth, async (req: RequestWithCtx, res: Response) => {
    let key = '';
    let params = {};

    try {
      const parsed = ActionSchema.parse(req.body);
      key = parsed.key;
      params = parsed.params;

      // RBAC by API key
      if (req.ctx?.role === "external" && FORBIDDEN_FOR_EXTERNAL.has(key)) {
        throw new ForbiddenError("Action not allowed for external key");
      }

      // Prefer explicit TS AI routing for ai.chat
      if (key === 'ai.chat') {
        // BLOCK AI from generating fake prices - redirect to official pricing
        const query = JSON.stringify(params).toLowerCase();
        const priceKeywords = ['harga', 'biaya', 'berapa', 'price', 'cost', 'jual', 'tarif', 'fee'];
        const serviceKeywords = ['visa', 'kitas', 'kitap', 'pt', 'pma', 'npwp', 'bpjs', 'company', 'tax', 'pajak'];

        const hasPriceQuery = priceKeywords.some(word => query.includes(word));
        const hasServiceQuery = serviceKeywords.some(word => query.includes(word));

        if (hasPriceQuery && hasServiceQuery) {
          // Redirect to official pricing instead of AI
          return res.status(200).json(ok({
            official_pricing_notice: "🔒 PREZZI UFFICIALI BALI ZERO 2025",
            message: "Per prezzi UFFICIALI, usa il handler: bali.zero.pricing",
            redirect_to: "bali.zero.pricing",
            reason: "AI NON può fornire prezzi - solo handler ufficiali",
            contact: "info@balizero.com per preventivi personalizzati"
          }));
        }

        // Force to OpenAI path for stability; aiChat available but this ensures consistency
        const startTime = Date.now();
        const r = await openaiChat(params);

        // Auto-save AI conversation
        await autoSaveConversation(
          req,
          (params as any).prompt || (params as any).message || '',
          r?.data?.response || r?.response || '',
          'ai.chat',
          {
            responseTime: Date.now() - startTime,
            model: r?.data?.model || 'openai'
          }
        );

        return res.status(200).json(ok(r?.data ?? r));
      }

      // identity.resolve: accetta { email } come parametro standard
      if (key === 'identity.resolve' && params && (params as any).identity_hint && !(params as any).email) {
        (params as any).email = (params as any).identity_hint;
      }

      let result: any;
      if (key === 'ai.chat') {
        result = await aiChatWithFallback({ req, res }, params);
      } else {
        const handler = handlers[key];
        if (!handler) {
          return res.status(404).json(err('handler_not_found'));
        }
        const startTime = Date.now();
        result = await handler(params, req);
      }

      // Auto-save conversations for ALL important handlers
      const autoSaveKeys = [
        'ai.', '.chat', 'translate.text',
        'memory.save', 'memory.retrieve', 'memory.search',
        'user.memory.save', 'user.memory.retrieve'
      ];

      const shouldAutoSave = autoSaveKeys.some(k => key.includes(k) || key === k);

      if (shouldAutoSave) {
        const prompt = (params as any).prompt || (params as any).message || (params as any).text || (params as any).query || (params as any).content || JSON.stringify(params);
        const response = result?.data?.response || result?.response || result?.data?.translatedText || result?.data?.content || JSON.stringify(result?.data || result);

        // Don't await (fire and forget to avoid slowing down response)
        autoSaveConversation(
          req,
          prompt.substring(0, 5000), // Limit size
          response.substring(0, 10000), // Limit size
          key,
          {
            responseTime: Date.now() - Date.now(), // Will be updated properly
            model: result?.data?.model || key
          }
        ).catch(err => console.log('⚠️ Auto-save failed:', err.message));
      }

      return res.status(200).json(ok(result?.data ?? result));

      // Bridge fallback for critical JS handlers (AI + Google Workspace OAuth2)
      const bridged = await forwardToBridgeIfSupported(key, params);
      if (bridged !== null) {
        return res.status(200).json(bridged);
      }

      // Stub if totally unknown
      const stub = ok({
        stub: key,
        params,
        message: `Handler ${key} not implemented yet`
      });
      return res.status(200).json(stub);
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
        timestamp: new Date().toISOString()
      };

      console.error(`🔥 Handler Error [${requestId}] ${key}:`, {
        error: e.message,
        stack: e.stack?.split('\n').slice(0, 5).join('\n'),
        ...errorContext
      });

      if (e instanceof ZodError) return res.status(400).json(err('INVALID_PAYLOAD'));
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      if (e instanceof UnauthorizedError) return res.status(401).json(err(e.message));
      if (e instanceof ForbiddenError) return res.status(403).json(err(e.message));

      // Log critical errors for investigation
      if (key.includes('ai.') || key.includes('memory.') || key.includes('identity.')) {
        console.error(`🚨 Critical handler failure: ${key}`, {
          errorType: e.constructor.name,
          errorMessage: e.message,
          ...errorContext
        });
      }

      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // GET/POST /ai.chat.stream – optional SSE streaming (pseudo streaming)
  app.get('/ai.chat.stream', apiKeyAuth, async (req: RequestWithCtx, res) => {
    try {
      const prompt = (req.query.prompt as string) || '';
      if (!prompt) return res.status(400).end();
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
        await new Promise(r => setTimeout(r, 15));
      }
      res.write('event: done\ndata: [END]\n\n');
      res.end();
    } catch (err: any) {
      try {
        res.write(`event: error\ndata: ${JSON.stringify({ error: err.message || 'stream_failed' })}\n\n`);
      } finally {
        res.end();
      }
    }
  });

  app.post('/ai.chat.stream', apiKeyAuth, async (req: RequestWithCtx, res) => {
    // same as GET but read prompt from body
    (req as any).query.prompt = (req.body?.prompt || '');
    return (app as any)._router.handle(req, res, () => void 0);
  });

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
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // Send Manual WhatsApp Message (POST) - For testing or proactive outreach
  app.post('/whatsapp/send', apiKeyAuth, async (req: RequestWithCtx, res) => {
    try {
      const result = await sendManualMessage(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
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
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // Send Manual Instagram Message (POST) - For testing or proactive outreach
  app.post('/instagram/send', apiKeyAuth, async (req: RequestWithCtx, res) => {
    try {
      const result = await sendManualInstagramMessage(req.body);
      return res.status(200).json(result);
    } catch (e: any) {
      if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
      return res.status(500).json(err(e?.message || "Internal Error"));
    }
  });

  // ========================================
  // TWILIO WHATSAPP (Alternative to Meta)
  // ========================================

  // Twilio WhatsApp Webhook (POST) - Receives messages from Twilio Sandbox
  app.post('/webhook/twilio-whatsapp', async (req, res) => {
    return twilioWhatsappWebhook(req, res);
  });

  // Send WhatsApp via Twilio (POST) - Manual message sending
  app.post('/twilio/whatsapp/send', apiKeyAuth, async (req: RequestWithCtx, res) => {
    return twilioSendWhatsapp(req, res);
  });

}
