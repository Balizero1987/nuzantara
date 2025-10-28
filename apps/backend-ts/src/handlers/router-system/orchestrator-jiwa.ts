/**
 * JIWA-Enhanced Orchestrator
 * Combines FLAN-T5 router intelligence with Ibu Nuzantara soul reading
 */

import { Request, Response } from 'express';
import axios from 'axios';
import { getJiwaClient } from '../../services/jiwa-client';

// Configuration
const ROUTER_URL = process.env.ROUTER_URL || 'http://localhost:8000';
const HAIKU_API_KEY = process.env.ANTHROPIC_API_KEY;
const HAIKU_MODEL = 'claude-3-5-haiku-20241022';

// Initialize JIWA client
const jiwaClient = getJiwaClient();

/**
 * Enhanced query orchestrator with JIWA soul infusion
 */
export async function handleQueryWithJiwa(req: Request, res: Response) {
  try {
    const { query, userId = 'anonymous', language = 'id' } = req.body;

    console.log(`\n🌺 Processing query with JIWA enhancement`);
    console.log(`📝 Query: "${query}"`);
    console.log(`👤 User: ${userId}`);

    // Step 1: Read the soul of the query
    console.log('\n👁️ Reading user soul...');
    const soulReading = await jiwaClient.readSoul(query, userId, {}, language);

    let emotionalContext = '';
    let protectionActivated = false;

    if (soulReading) {
      console.log(`📖 Soul Analysis:`);
      console.log(`  - Emotion: ${soulReading.emotional_tone}`);
      console.log(`  - Need: ${soulReading.primary_need}`);
      console.log(`  - Urgency: ${soulReading.urgency_level}/10`);

      // Build emotional context for Haiku
      emotionalContext = `\n[Soul Context: User is feeling ${soulReading.emotional_tone}. `;
      emotionalContext += `They need ${soulReading.primary_need}. `;

      if (soulReading.hidden_pain) {
        emotionalContext += `Be aware of ${soulReading.hidden_pain}. `;
      }

      if (soulReading.strength_detected) {
        emotionalContext += `Acknowledge their ${soulReading.strength_detected}. `;
      }

      emotionalContext += soulReading.maternal_guidance + ']';

      // Activate protection if needed
      if (soulReading.protection_needed && soulReading.urgency_level >= 8) {
        console.warn(`🛡️ Activating maternal protection!`);
        await jiwaClient.activateProtection(userId,
          soulReading.primary_need.includes('fraud') ? 'fraud' :
          soulReading.primary_need.includes('legal') ? 'legal' :
          'emergency'
        );
        protectionActivated = true;
      }
    }

    // Step 2: Get tool selection from FLAN-T5 router
    console.log('\n🧠 Routing through FLAN-T5...');
    const routerResponse = await axios.post(`${ROUTER_URL}/route`, { query });

    const { intent, confidence, tools } = routerResponse.data;
    console.log(`🎯 Intent: ${intent} (confidence: ${confidence})`);
    console.log(`🔧 Tools selected: ${tools.map((t: any) => t.name).join(', ')}`);

    // Step 3: Build Haiku prompt with both router and soul context
    const systemPrompt = `You are ZANTARA, an Indonesian AI assistant with a warm, maternal personality.
${emotionalContext}

You have access to these tools:
${tools.map((t: any) => `- ${t.name}: ${t.description}`).join('\n')}

Respond with technical accuracy but also emotional intelligence and cultural awareness.
${language === 'id' ? 'Respond primarily in Indonesian.' : 'Respond primarily in English.'}
${protectionActivated ? 'IMPORTANT: The user needs urgent help and protection.' : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ];

    // Step 4: Generate response with Claude Haiku
    console.log('\n💬 Generating response with Haiku + JIWA context...');
    const haikuResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: HAIKU_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7
      },
      {
        headers: {
          'x-api-key': HAIKU_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const technicalResponse = haikuResponse.data.content[0].text;

    // Step 5: Infuse response with JIWA warmth
    console.log('\n💫 Infusing response with maternal warmth...');
    let finalResponse = technicalResponse;

    if (soulReading) {
      const infused = await jiwaClient.infuseResponse(
        technicalResponse,
        soulReading,
        language,
        soulReading.emotional_tone === 'sad' ||
        soulReading.emotional_tone === 'desperate' ||
        soulReading.urgency_level >= 7
      );

      if (infused) {
        finalResponse = infused.infused_response;
        console.log(`💗 Maternal warmth: ${infused.maternal_warmth}`);
        console.log(`🌺 Cultural elements: ${infused.cultural_elements.join(', ')}`);
      }
    }

    // Step 6: Return complete response
    const response = {
      response: finalResponse,
      metadata: {
        intent,
        confidence,
        tools: tools.map((t: any) => t.name),
        soul_reading: soulReading ? {
          emotion: soulReading.emotional_tone,
          need: soulReading.primary_need,
          urgency: soulReading.urgency_level
        } : null,
        protection_activated: protectionActivated,
        jiwa_enhanced: true
      }
    };

    console.log('\n✅ Response ready with JIWA enhancement');
    res.json(response);

  } catch (error) {
    console.error('❌ Orchestration error:', error);

    // Graceful fallback
    if (error.response?.status === 429) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Ibu sedang istirahat sebentar, coba lagi ya Nak.',
        jiwa_enhanced: true
      });
    } else {
      res.status(500).json({
        error: 'Internal error',
        message: 'Maaf Nak, ada masalah teknis. Ibu akan coba bantu.',
        jiwa_enhanced: true
      });
    }
  }
}

/**
 * Get JIWA system status
 */
export async function getJiwaStatus(req: Request, res: Response) {
  try {
    const status = await jiwaClient.getStatus();

    if (!status) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'JIWA service not available'
      });
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get JIWA status',
      message: error.message
    });
  }
}

/**
 * Health check for integrated system
 */
export async function healthCheck(req: Request, res: Response) {
  const checks = {
    router: false,
    jiwa: false,
    haiku: false
  };

  // Check router
  try {
    const routerHealth = await axios.get(`${ROUTER_URL}/health`);
    checks.router = routerHealth.data.status === 'healthy';
  } catch (error) {
    console.error('Router health check failed:', error.message);
  }

  // Check JIWA
  checks.jiwa = await jiwaClient.checkHealth();

  // Check Haiku API
  checks.haiku = !!HAIKU_API_KEY;

  const allHealthy = checks.router && checks.jiwa && checks.haiku;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    message: allHealthy
      ? 'All systems operational with JIWA enhancement'
      : 'Some services unavailable'
  });
}

/**
 * Emergency protection endpoint
 */
export async function activateEmergencyProtection(req: Request, res: Response) {
  const { userId, threatType = 'emergency', reason } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const protection = await jiwaClient.activateProtection(userId, threatType);

    res.json({
      success: true,
      protection,
      message: `Protection activated for ${userId}`,
      reason
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to activate protection',
      message: error.message
    });
  }
}

// Export middleware for Express integration
export function jiwaOrchestratorRoutes(router: any) {
  // Main query endpoint with JIWA
  router.post('/api/query-jiwa', handleQueryWithJiwa);

  // JIWA status
  router.get('/api/jiwa/status', getJiwaStatus);

  // Health check
  router.get('/api/jiwa/health', healthCheck);

  // Emergency protection
  router.post('/api/jiwa/protect', activateEmergencyProtection);

  console.log('🌺 JIWA-Enhanced Orchestrator routes registered');
}