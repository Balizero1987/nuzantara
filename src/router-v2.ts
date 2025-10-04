/**
 * ZANTARA Router v2 - With Handler Registry
 *
 * This version uses HandlerRegistry for automatic handler discovery
 * Replaces manual registration with auto-discovery pattern
 */

import { z, ZodError } from "zod";
import type { Request, Response } from "express";
import { ok, err } from "./utils/response.js";
import { apiKeyAuth, RequestWithCtx } from "./middleware/auth.js";
import { ForbiddenError, BadRequestError, UnauthorizedError } from "./utils/errors.js";

// Import registry system
import { globalRegistry } from './core/handler-registry.js';
import { loadAllHandlers, getAllHandlers } from './core/load-all-handlers.js';

// Action schema
const ActionSchema = z.object({
  key: z.string(),
  params: z.record(z.any()).default({}),
});

type Handler = (params: any, req?: Request) => Promise<any>;

// AI fallback settings
const AI_FALLBACK_ORDER = (process.env.AI_FALLBACK_ORDER || 'ai.chat,openai.chat,claude.chat,gemini.chat,cohere.chat')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);

/**
 * Run handler using registry
 */
async function runHandler(key: string, params: any, ctx: any) {
  // Try registry first
  if (globalRegistry.has(key)) {
    return await globalRegistry.execute(key, params, ctx?.req);
  }

  // Fallback to legacy handlers for backward compatibility
  const legacyHandlers = getLegacyHandlers();
  const handler = legacyHandlers[key];

  if (!handler) {
    throw new Error(`handler_not_found: ${key}`);
  }

  return await handler(params, ctx?.req);
}

/**
 * AI chat with fallback across multiple models
 */
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

/**
 * Legacy handlers (temporary - will be migrated to registry)
 * These are handlers not yet converted to the registry pattern
 */
function getLegacyHandlers(): Record<string, Handler> {
  return {
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
          'Documents preparation initiated'
        ],
        contact: {
          email: "info@balizero.com",
          whatsapp: "+62 859 0436 9574"
        }
      });
    },

    "quote.generate": async (params: any) => {
      const { service = '' } = params;
      if (!service) {
        throw new BadRequestError('Service type required for quote generation');
      }

      const quotes = {
        visa: {
          'B211A (Visit Visa)': { price: '150', timeline: '3-5 days' },
          'B211B (Business Visa)': { price: '200', timeline: '5-7 days' },
          'Kitas (Stay Permit)': { price: '800', timeline: '30-45 days' }
        },
        company: {
          'PT PMA (Foreign Investment)': { price: '2500', timeline: '30-45 days' },
          'Local PT': { price: '1200', timeline: '21-30 days' }
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
        contact: {
          email: 'info@balizero.com',
          whatsapp: '+62 859 0436 9574'
        }
      });
    }
  };
}

/**
 * Initialize router with handler registry
 */
export async function initializeRouter() {
  console.log('🚀 Initializing ZANTARA Router v2...');

  // Load all handlers (triggers auto-registration)
  await loadAllHandlers();

  console.log('✅ Router v2 initialized with Handler Registry');
}

/**
 * Main action handler
 */
export async function handleAction(req: RequestWithCtx, res: Response) {
  try {
    const parsed = ActionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(err('invalid_action', parsed.error.errors));
    }

    const { key, params } = parsed.data;
    const ctx = { req };

    // Special handling for AI fallback
    if (key === 'ai.chat.fallback') {
      const result = await aiChatWithFallback(ctx, params);
      return res.status(200).json(result);
    }

    // Regular handler execution
    const result = await runHandler(key, params, ctx);
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Action error:', error);

    if (error instanceof BadRequestError) {
      return res.status(400).json(err('bad_request', error.message));
    }
    if (error instanceof UnauthorizedError) {
      return res.status(401).json(err('unauthorized', error.message));
    }
    if (error instanceof ForbiddenError) {
      return res.status(403).json(err('forbidden', error.message));
    }

    return res.status(500).json(err('internal_error', error.message));
  }
}

/**
 * Admin endpoint: List all registered handlers
 */
export async function listHandlers(req: Request, res: Response) {
  const stats = globalRegistry.getStats();

  return res.status(200).json(ok({
    ...stats,
    handlers: globalRegistry.list(),
    timestamp: new Date().toISOString()
  }));
}
