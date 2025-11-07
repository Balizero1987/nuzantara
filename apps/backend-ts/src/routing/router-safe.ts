/**
 * Safe Main Router - Gradual Loading with Error Handling
 * Loads handlers progressively with try-catch for each module
 */
import express from 'express';
import { logger } from '../logging/unified-logger.js';

const router = express.Router();

export async function attachRoutes(app: express.Application) {
  logger.info('🔄 Attaching main router (safe mode)...');

  let loadedCount = 0;
  let failedCount = 0;

  // ==================================================================
  // IDENTITY & ONBOARDING
  // ==================================================================
  try {
    const { identityResolve, onboardingStart } = await import('../handlers/identity/identity.js');
    router.post('/api/identity/resolve', identityResolve as any);
    router.post('/api/onboarding/start', onboardingStart as any);
    loadedCount += 2;
    logger.info('  ✅ Identity & Onboarding routes loaded (2)');
  } catch (error: any) {
    logger.warn(`  ⚠️ Identity routes skipped: ${error.message}`);
    failedCount += 2;
  }

  // ==================================================================
  // TEAM AUTHENTICATION
  // ==================================================================
  try {
    const { teamLogin, getTeamMembers, logoutSession } = await import(
      '../handlers/auth/team-login.js'
    );
    router.post('/api/team/login', teamLogin as any);
    router.get('/api/team/members', getTeamMembers as any);
    router.post('/api/team/logout', logoutSession as any);
    loadedCount += 3;
    logger.info('  ✅ Team Auth routes loaded (3)');
  } catch (error: any) {
    logger.warn(`  ⚠️ Team Auth routes skipped: ${error.message}`);
    failedCount += 3;
  }

  // ==================================================================
  // BALI ZERO BUSINESS
  // ==================================================================
  try {
    const { kbliLookup, kbliRequirements } = await import('../handlers/bali-zero/kbli.js');
    router.post('/api/bali-zero/kbli', kbliLookup as any);
    router.get('/api/bali-zero/kbli/requirements', kbliRequirements as any);
    loadedCount += 2;
    logger.info('  ✅ Bali Zero KBLI routes loaded (2)');
  } catch (error: any) {
    logger.warn(`  ⚠️ Bali Zero routes skipped: ${error.message}`);
    failedCount += 2;
  }

  // ==================================================================
  // AI SERVICES
  // ==================================================================
  try {
    const { aiChat } = await import('../handlers/ai-services/ai.js');
    const { getAnthropicToolDefinitions } = await import(
      '../handlers/system/handlers-introspection.js'
    );

    // RESTful endpoint: /api/ai/chat
    router.post('/api/ai/chat', async (req: any, res: any) => {
      try {
        const result = await aiChat(req.body);
        res.json(result);
      } catch (error: any) {
        logger.error('AI Chat error:', error);
        res.status(500).json({ ok: false, error: error.message || 'AI chat failed' });
      }
    });

    // ZANTARA v3 Unified endpoint (main production endpoint)
    router.post('/zantara.unified', async (req: any, res: any) => {
      try {
        const result = await aiChat(req.body);
        res.json(result);
      } catch (error: any) {
        logger.error('ZANTARA unified error:', error);
        res.status(500).json({ ok: false, error: error.message || 'ZANTARA chat failed' });
      }
    });

    // Legacy RPC-style endpoint: /call (for webapp compatibility + high-priority handlers)
    router.post('/call', async (req: any, res: any) => {
      try {
        const { key, params } = req.body;

        // === AI SERVICES ===
        if (key === 'ai.chat') {
          const result = await aiChat(params);
          res.json(result);
        }

        // === SYSTEM INTROSPECTION ===
        else if (key === 'system.handlers.tools') {
          const result = await getAnthropicToolDefinitions();
          res.json(result);
        }

        // === TEAM MANAGEMENT ===
        // Note: Team handlers are Express-style (req, res), need to create mock request
        else if (key === 'team.list') {
          const { teamList } = await import('../handlers/bali-zero/team.js');
          const mockReq: any = { body: { params } };
          const mockRes: any = {
            json: (data: any) => res.json(data),
            status: (code: number) => ({ json: (data: any) => res.status(code).json(data) }),
          };
          await teamList(mockReq, mockRes);
        } else if (key === 'team.get') {
          const { teamGet } = await import('../handlers/bali-zero/team.js');
          const mockReq: any = { body: { params } };
          const mockRes: any = {
            json: (data: any) => res.json(data),
            status: (code: number) => ({ json: (data: any) => res.status(code).json(data) }),
          };
          await teamGet(mockReq, mockRes);
        } else if (key === 'team.departments') {
          const { teamDepartments } = await import('../handlers/bali-zero/team.js');
          const mockReq: any = { body: { params } };
          const mockRes: any = {
            json: (data: any) => res.json(data),
            status: (code: number) => ({ json: (data: any) => res.status(code).json(data) }),
          };
          await teamDepartments(mockReq, mockRes);
        } else if (key === 'team.login.secure') {
          const { teamLoginSecure } = await import('../handlers/auth/team-login-secure.js');
          const result = await teamLoginSecure(params);
          res.json(result);
        }

        // === PRICING SYSTEM ===
        else if (key === 'pricing.official' || key === 'bali.zero.pricing') {
          const { baliZeroPricing } = await import('../handlers/bali-zero/bali-zero-pricing.js');
          const result = await baliZeroPricing(params);
          res.json(result);
        } else if (key === 'pricing.invoice.generate') {
          const { generateInvoice } = await import('../handlers/bali-zero/pricing-invoices.js');
          const result = await generateInvoice(params);
          res.json(result);
        } else if (key === 'pricing.invoice.details') {
          const { getInvoiceDetails } = await import('../handlers/bali-zero/pricing-invoices.js');
          const result = await getInvoiceDetails(params);
          res.json(result);
        } else if (key === 'pricing.subscription.plans') {
          const { getSubscriptionPlans } = await import(
            '../handlers/bali-zero/pricing-subscription.js'
          );
          const result = await getSubscriptionPlans(params);
          res.json(result);
        } else if (key === 'pricing.subscription.details') {
          const { getSubscriptionDetails } = await import(
            '../handlers/bali-zero/pricing-subscription.js'
          );
          const result = await getSubscriptionDetails(params);
          res.json(result);
        } else if (key === 'pricing.subscription.renewal') {
          const { calculateSubscriptionRenewal } = await import(
            '../handlers/bali-zero/pricing-subscription.js'
          );
          const result = await calculateSubscriptionRenewal(params);
          res.json(result);
        }

        // === KBLI ADVANCED ===
        else if (key === 'kbli.lookup.complete') {
          const { kbliLookupComplete } = await import('../handlers/bali-zero/kbli-complete.js');
          const result = await kbliLookupComplete(params);
          res.json(result);
        } else if (key === 'kbli.business.analysis') {
          const { kbliBusinessAnalysis } = await import('../handlers/bali-zero/kbli-complete.js');
          const result = await kbliBusinessAnalysis(params);
          res.json(result);
        }

        // === LEAD MANAGEMENT ===
        else if (key === 'lead.save') {
          // Inline implementation (from router.ts)
          const { service = '' } = params;
          if (!service) {
            res.status(400).json({
              ok: false,
              error: 'Service type required: visa, company, tax, or real-estate',
            });
          } else {
            res.json({
              ok: true,
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
          }
        } else if (key === 'quote.generate') {
          // Inline implementation (from router.ts)
          const { service = '' } = params;
          if (!service) {
            res.status(400).json({
              ok: false,
              error: 'Service type required',
            });
          } else {
            res.json({
              ok: true,
              quoteId: `quote_${Date.now()}`,
              service,
              estimatedCost: 'Contact for detailed quote',
              message: 'Quote generated. Our team will contact you with detailed pricing.',
              contact: {
                email: 'info@balizero.com',
                whatsapp: '+62 859 0436 9574',
              },
            });
          }
        } else if (key === 'document.prepare') {
          const { documentPrepare } = await import('../handlers/bali-zero/advisory.js');
          const result = await documentPrepare(params);
          res.json(result);
        }

        // === ORACLE SYSTEM ===
        else if (key === 'oracle.simulate') {
          const { oracleSimulate } = await import('../handlers/bali-zero/oracle.js');
          const result = await oracleSimulate(params);
          res.json(result);
        } else if (key === 'oracle.analyze') {
          const { oracleAnalyze } = await import('../handlers/bali-zero/oracle.js');
          const result = await oracleAnalyze(params);
          res.json(result);
        } else if (key === 'oracle.predict') {
          const { oraclePredict } = await import('../handlers/bali-zero/oracle.js');
          const result = await oraclePredict(params);
          res.json(result);
        } else if (key === 'oracle.universal.query') {
          const { oracleUniversalQuery } = await import(
            '../handlers/bali-zero/oracle-universal.js'
          );
          const result = await oracleUniversalQuery(params);
          res.json(result);
        } else if (key === 'oracle.collections') {
          const { oracleCollections } = await import('../handlers/bali-zero/oracle-universal.js');
          const result = await oracleCollections(params);
          res.json(result);
        }

        // === RAG SYSTEM ===
        else if (key === 'rag.query') {
          const { ragQuery } = await import('../handlers/rag/rag.js');
          const result = await ragQuery(params);
          res.json(result);
        } else if (key === 'rag.search') {
          const { ragSearch } = await import('../handlers/rag/rag.js');
          const result = await ragSearch(params);
          res.json(result);
        } else if (key === 'rag.health') {
          const { ragHealth } = await import('../handlers/rag/rag.js');
          const result = await ragHealth(params);
          res.json(result);
        } else if (key === 'bali.zero.chat') {
          const { baliZeroChat } = await import('../handlers/rag/rag.js');
          const result = await baliZeroChat(params);
          res.json(result);
        }

        // === CONTACT INFO ===
        else if (key === 'contact.info') {
          res.json({
            ok: true,
            data: {
              company: 'Bali Zero',
              tagline: 'From Zero to Infinity ∞',
              services: ['Visas', 'Company Setup', 'Tax Consulting', 'Real Estate Legal'],
              office: {
                location: 'Kerobokan, Bali, Indonesia',
                mapUrl: 'https://maps.app.goo.gl/i6DbEmfCtn1VJ3G58',
              },
              communication: {
                email: 'info@balizero.com',
                whatsapp: '+62 859 0436 9574',
                instagram: '@balizero0',
              },
              team: {
                ceo: 'Zainal Abidin',
                techLead: 'Zero (AI Bridge)',
              },
            },
          });
        }

        // === HANDLER NOT FOUND ===
        else {
          res.status(404).json({
            ok: false,
            error: `Handler not found: ${key}. Available handlers: ai.chat, system.handlers.tools, team.*, pricing.*, kbli.*, lead.*, oracle.*, rag.*, contact.info`,
          });
        }
      } catch (error: any) {
        logger.error(`/call handler error [${req.body?.key}]:`, error);
        res.status(500).json({ ok: false, error: error.message || 'Handler execution failed' });
      }
    });

    // ZANTARA v3 Collective endpoint
    router.post('/zantara.collective', async (req: any, res: any) => {
      try {
        const result = await aiChat(req.body);
        res.json(result);
      } catch (error: any) {
        logger.error('ZANTARA collective error:', error);
        res.status(500).json({ ok: false, error: error.message || 'ZANTARA collective failed' });
      }
    });

    // ZANTARA v3 Ecosystem endpoint
    router.post('/zantara.ecosystem', async (req: any, res: any) => {
      try {
        const result = await aiChat(req.body);
        res.json(result);
      } catch (error: any) {
        logger.error('ZANTARA ecosystem error:', error);
        res.status(500).json({ ok: false, error: error.message || 'ZANTARA ecosystem failed' });
      }
    });

    loadedCount += 5;
    logger.info(
      '  ✅ AI Chat routes loaded (5: /api/ai/chat + /zantara.unified + /zantara.collective + /zantara.ecosystem + /call)'
    );
  } catch (error: any) {
    logger.warn(`  ⚠️ AI routes skipped: ${error.message}`);
    failedCount += 5;
  }

  // ==================================================================
  // ZANTARA COLLABORATIVE INTELLIGENCE
  // ==================================================================
  try {
    const { zantaraPersonalityProfile, zantaraAttune } = await import(
      '../handlers/zantara/zantara-test.js'
    );
    router.post('/api/zantara/personality', zantaraPersonalityProfile as any);
    router.post('/api/zantara/attune', zantaraAttune as any);
    loadedCount += 2;
    logger.info('  ✅ ZANTARA routes loaded (2)');
  } catch (error: any) {
    logger.warn(`  ⚠️ ZANTARA routes skipped: ${error.message}`);
    failedCount += 2;
  }

  // Mount router
  app.use(router);

  logger.info(`✅ Main Router attached: ${loadedCount} routes loaded, ${failedCount} skipped`);
  return { loaded: loadedCount, failed: failedCount };
}

export default router;
