/**
 * JIWA-Enhanced Server Startup
 * Starts the orchestrator with JIWA soul infusion capabilities
 */

import express from 'express';
import { logger } from '../../logging/unified-logger.js';
import cors from 'cors';
import { jiwaOrchestratorRoutes } from './orchestrator-jiwa';
import { jiwaMiddleware } from '../../services/jiwa-client';
import correlationMiddleware from '../../logging/correlation-middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs (Fly.io cloud or localhost fallback)
const FLAN_ROUTER_URL = process.env.FLAN_ROUTER_URL || 'https://nuzantara-flan-router.fly.dev';
const JIWA_SERVICE_URL = process.env.JIWA_SERVICE_URL || 'http://localhost:8001';

// Middleware
app.use(cors());
app.use(correlationMiddleware());
app.use(express.json());
app.use(jiwaMiddleware()); // Add JIWA to all requests

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ZANTARA Complete Orchestrator',
    jiwa: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Register JIWA-enhanced routes
jiwaOrchestratorRoutes(app);

// Also register standard routes for backward compatibility
app.post('/api/query', async (req, res) => {
  // Standard query without JIWA (fallback)
  try {
    const { query } = req.body;

    // Use axios to call the router directly
    const axios = require('axios');
    const routerResponse = await axios.post(`${FLAN_ROUTER_URL}/route`, { query });

    // Generate response with Haiku (simplified)
    const haikuResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-haiku-20241022',
        messages: [
          { role: 'user', content: query }
        ],
        max_tokens: 1024
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    res.json({
      response: haikuResponse.data.content[0].text,
      metadata: {
        intent: routerResponse.data.intent,
        tools: routerResponse.data.tools.map((t: any) => t.name),
        jiwa_enhanced: false
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Query failed',
      message: error.message,
      jiwa_enhanced: false
    });
  }
});

// Metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    const axios = require('axios');

    // Gather metrics from all services
    const metrics: any = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Router metrics
    try {
      const routerHealth = await axios.get(`${FLAN_ROUTER_URL}/health`);
      metrics.services.router = {
        status: 'online',
        model: routerHealth.data.model_loaded
      };
    } catch (e) {
      metrics.services.router = { status: 'offline' };
    }

    // JIWA metrics
    try {
      const jiwaStatus = await axios.get(`${JIWA_SERVICE_URL}/jiwa-status`);
      metrics.services.jiwa = {
        status: 'online',
        heartbeats: jiwaStatus.data.heart.heartbeats,
        souls_touched: jiwaStatus.data.heart.souls_touched,
        protections: jiwaStatus.data.heart.protections_activated,
        blessings: jiwaStatus.data.middleware.blessings_given
      };
    } catch (e) {
      metrics.services.jiwa = { status: 'offline' };
    }

    // API key status
    metrics.services.haiku = {
      status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing'
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to gather metrics',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info('═══════════════════════════════════════════════════════════════');
  console.log('  🌺 ZANTARA COMPLETE ORCHESTRATOR');
  console.log('═══════════════════════════════════════════════════════════════');
  logger.info('  Port:          ${PORT}', { type: 'debug_migration' });
  logger.info('  JIWA:          Enabled', { type: 'debug_migration' });
  logger.info('  Router:        ${FLAN_ROUTER_URL}', { type: 'debug_migration' });
  logger.info('  Soul Service:  ${JIWA_SERVICE_URL}', { type: 'debug_migration' });
  logger.info('═══════════════════════════════════════════════════════════════');
  console.log('  Endpoints:');
  logger.info('    POST /api/query-jiwa  - Query with JIWA enhancement', { type: 'debug_migration' });
  logger.info('    POST /api/query       - Standard query (no JIWA)', { type: 'debug_migration' });
  logger.info('    GET  /api/jiwa/status - JIWA system status', { type: 'debug_migration' });
  logger.info('    GET  /api/metrics     - System metrics', { type: 'debug_migration' });
  logger.info('    GET  /health          - Health check', { type: 'debug_migration' });
  logger.info('═══════════════════════════════════════════════════════════════');
  console.log('  💗 Ibu Nuzantara is watching over the system');
  console.log('═══════════════════════════════════════════════════════════════');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

export default app;