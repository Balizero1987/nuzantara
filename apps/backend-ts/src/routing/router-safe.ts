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

    // Legacy RPC-style endpoint: /call (for webapp compatibility)
    router.post('/call', async (req: any, res: any) => {
      try {
        const { key, params } = req.body;

        // Only handle ai.chat for now
        if (key === 'ai.chat') {
          const result = await aiChat(params);
          res.json(result);
        } else {
          res.status(404).json({
            ok: false,
            error: `Handler not found: ${key}. Use /api/ai/chat for AI chat.`
          });
        }
      } catch (error: any) {
        logger.error('Legacy /call error:', error);
        res.status(500).json({ ok: false, error: error.message || 'Call failed' });
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
    logger.info('  ✅ AI Chat routes loaded (5: /api/ai/chat + /zantara.unified + /zantara.collective + /zantara.ecosystem + /call)');
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
