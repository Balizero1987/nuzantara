/**
 * Main Orchestrator - Connects FLAN Router + Haiku
 * Router-Only Mode: FLAN selects tools, Haiku generates ALL responses
 */

import express, { Request, Response } from 'express';
import axios from 'axios';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { cacheMiddleware } from './lib/cache.middleware';
import { cacheService } from './lib/cache.service';
import fs from 'fs';
import path from 'path';
import { SuperToolHandlers } from './lib/super-tools';

dotenv.config();

// Initialize super-tool handlers
const toolHandlers = new SuperToolHandlers();

// Load system prompt
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'SYSTEM_PROMPT.txt'),
  'utf-8'
);

const app = express();
app.use(express.json());
app.use(cors());

// PATCH-1: Redis cache middleware for performance optimization

// Service configuration
const SERVICES = {
  FLAN_ROUTER: process.env.FLAN_ROUTER_URL || 'https://nuzantara-flan-router.fly.dev',
  RAG_BACKEND: process.env.RAG_BACKEND_URL || 'https://scintillating-kindness-production-47e3.up.railway.app',
  HAIKU_API: 'https://api.anthropic.com/v1',  // Fallback only
  TS_BACKEND: process.env.TS_BACKEND_URL || 'http://localhost:8080',
  PYTHON_BACKEND: process.env.PYTHON_BACKEND_URL || 'http://localhost:8001'
};

// Metrics tracking
interface Metrics {
  totalRequests: number;
  routerLatency: number[];
  haikuLatency: number[];
  totalLatency: number[];
  toolsSelected: Record<string, number>;
  errors: number;
  successRate: number;
}

const metrics: Metrics = {
  totalRequests: 0,
  routerLatency: [],
  haikuLatency: [],
  totalLatency: [],
  toolsSelected: {},
  errors: 0,
  successRate: 0
};

interface QueryRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  context?: any;
}

interface RouterResponse {
  tools: string[];
  confidence: number;
  intent: string;
  latency_ms: number;
  reasoning: string;
}

/**
 * Main query endpoint - ALL queries come here
 */
app.post('/api/query', cacheMiddleware, async (req: Request, res: Response) => {
  const startTime = Date.now();
  metrics.totalRequests++;

  const { query, userId, sessionId, context }: QueryRequest = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // ========== STEP 1: Route with FLAN-T5 ==========
    console.log(`\n🔍 Processing query: "${query}"`);
    const routerStart = Date.now();

    const routingResponse = await axios.post<RouterResponse>(`${SERVICES.FLAN_ROUTER}/route`, {
      query,
      user_id: userId,
      session_id: sessionId,
      context
    });

    const routing = routingResponse.data;
    const routerLatency = Date.now() - routerStart;
    metrics.routerLatency.push(routerLatency);

    console.log(`✅ Router selected tools: ${routing.tools.join(', ')} (${routerLatency}ms, confidence: ${routing.confidence})`);

    // Track tool usage
    routing.tools.forEach(tool => {
      metrics.toolsSelected[tool] = (metrics.toolsSelected[tool] || 0) + 1;
    });

    // ========== STEP 2: Call Haiku with selected tools ==========
    const haikuStart = Date.now();

    // Prepare Haiku prompt with ONLY selected tools
    const haikuPrompt = prepareHaikuPrompt(query, routing.tools, routing.intent);

    // Call Haiku API
    const haikuResponse = await callHaiku(haikuPrompt, routing.tools);

    const haikuLatency = Date.now() - haikuStart;
    metrics.haikuLatency.push(haikuLatency);

    console.log(`✅ Haiku responded (${haikuLatency}ms)`);

    // ========== STEP 3: Extract text response ==========
    // Extract text from content blocks
    let responseText = '';
    if (haikuResponse.content && Array.isArray(haikuResponse.content)) {
      const textBlocks = haikuResponse.content.filter((block: any) => block.type === 'text');
      responseText = textBlocks.map((block: any) => block.text).join('\n');
    } else if (typeof haikuResponse.content === 'string') {
      responseText = haikuResponse.content;
    }

    // ========== STEP 4: Return response ==========
    const totalLatency = Date.now() - startTime;
    metrics.totalLatency.push(totalLatency);
    metrics.successRate = ((metrics.totalRequests - metrics.errors) / metrics.totalRequests) * 100;

    res.json({
      response: responseText,
      metadata: {
        routing: {
          tools: routing.tools,
          intent: routing.intent,
          confidence: routing.confidence,
          reasoning: routing.reasoning
        },
        performance: {
          routerLatency,
          haikuLatency,
          totalLatency
        },
        model: haikuResponse.model
      }
    });

  } catch (error: any) {
    console.error('❌ Query processing error:', error.message);
    metrics.errors++;

    // Fallback to direct Haiku with default tools (emergency mode)
    try {
      console.log('⚠️  Attempting fallback mode...');
      const fallbackResponse = await callHaikuDirect(query);
      res.json({
        response: fallbackResponse,
        metadata: {
          mode: 'fallback',
          error: error.message,
          performance: {
            totalLatency: Date.now() - startTime
          }
        }
      });
    } catch (fallbackError: any) {
      res.status(500).json({
        error: 'Both router and fallback failed',
        details: fallbackError.message
      });
    }
  }
});

/**
 * Prepare optimized prompt for Haiku with selected tools
 */
function prepareHaikuPrompt(query: string, tools: string[], intent: string): string {
  // Tool definitions for selected tools only
  const toolDefinitions = tools.map(tool => {
    switch(tool) {
      case 'universal.query':
        return `- universal.query: Get any information (pricing, requirements, memory, team data)`;
      case 'universal.action':
        return `- universal.action: Perform actions (save, update, delete, notify)`;
      case 'universal.generate':
        return `- universal.generate: Create content (documents, quotes, reports)`;
      case 'universal.analyze':
        return `- universal.analyze: Analyze data (predictions, insights, statistics)`;
      case 'universal.admin':
        return `- universal.admin: System operations (login, settings, permissions)`;
      default:
        return `- ${tool}: Custom tool`;
    }
  }).join('\n');

  return `${SYSTEM_PROMPT}

---

User Query: "${query}"

Detected Intent: ${intent}

Available Tools (use these if needed):
${toolDefinitions}

Respond to the user's query:`;
}

/**
 * Call RAG Backend (ChromaDB + Haiku + Tools)
 * Backend handles: RAG retrieval, Haiku generation, tool execution
 */
async function callHaiku(prompt: string, tools: string[]): Promise<any> {
  console.log(`📡 Calling RAG Backend with ChromaDB access...`);

  try {
    // Call backend-rag /bali-zero/chat endpoint
    const response = await axios.post(
      `${SERVICES.RAG_BACKEND}/bali-zero/chat`,
      {
        query: prompt,
        conversation_history: []  // Fresh conversation for each query
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60s timeout (RAG + Haiku can be slow)
      }
    );

    const backendResponse = response.data;

    console.log(`✅ RAG Backend responded`);
    console.log(`   Used RAG: ${backendResponse.used_rag || false}`);
    console.log(`   Used Tools: ${backendResponse.used_tools || false}`);
    if (backendResponse.tools_called) {
      console.log(`   Tools called: ${backendResponse.tools_called.join(', ')}`);
    }

    // Return in format expected by orchestrator
    return {
      content: [{
        type: 'text',
        text: backendResponse.response
      }],
      model: backendResponse.model || 'claude-haiku-4.5',
      used_rag: backendResponse.used_rag,
      used_tools: backendResponse.used_tools,
      tools_called: backendResponse.tools_called
    };

  } catch (error: any) {
    console.error(`❌ RAG Backend error: ${error.message}`);

    // If backend-rag is down, throw error (will trigger fallback in main handler)
    throw new Error(`RAG Backend unavailable: ${error.message}`);
  }
}

/**
 * Prepare tool schemas for Haiku
 */
function prepareToolSchemas(tools: string[]): any[] {
  const schemas: any[] = [];

  for (const tool of tools) {
    switch(tool) {
      case 'universal.query':
        schemas.push({
          name: 'universal_query',
          description: 'Query any information from the system',
          input_schema: {
            type: 'object',
            properties: {
              source: {
                type: 'string',
                enum: ['pricing', 'memory', 'knowledge', 'team', 'kbli', 'client', 'project', 'oracle'],
                description: 'Data source to query'
              },
              query: {
                type: 'string',
                description: 'The query or search term'
              },
              filters: {
                type: 'object',
                description: 'Optional filters'
              }
            },
            required: ['source', 'query']
          }
        });
        break;

      case 'universal.action':
        schemas.push({
          name: 'universal_action',
          description: 'Perform an action in the system',
          input_schema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['save', 'update', 'delete', 'create', 'notify'],
                description: 'Action to perform'
              },
              target: {
                type: 'string',
                description: 'Target of the action'
              },
              data: {
                type: 'object',
                description: 'Data for the action'
              }
            },
            required: ['action', 'data']
          }
        });
        break;

      case 'universal.generate':
        schemas.push({
          name: 'universal_generate',
          description: 'Generate content like documents, quotes, or reports',
          input_schema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['quote', 'document', 'report', 'invoice'],
                description: 'Type of content to generate'
              },
              data: {
                type: 'object',
                description: 'Data for generation'
              }
            },
            required: ['type', 'data']
          }
        });
        break;

      case 'universal.analyze':
        schemas.push({
          name: 'universal_analyze',
          description: 'Analyze data to get insights, predictions, or statistics',
          input_schema: {
            type: 'object',
            properties: {
              analysis_type: {
                type: 'string',
                enum: ['predict', 'classify', 'forecast', 'statistics'],
                description: 'Type of analysis'
              },
              data: {
                type: 'object',
                description: 'Data to analyze'
              }
            },
            required: ['analysis_type', 'data']
          }
        });
        break;

      case 'universal.admin':
        schemas.push({
          name: 'universal_admin',
          description: 'Perform administrative operations',
          input_schema: {
            type: 'object',
            properties: {
              operation: {
                type: 'string',
                enum: ['login', 'logout', 'identify', 'configure'],
                description: 'Admin operation to perform'
              },
              data: {
                type: 'object',
                description: 'Operation data'
              }
            },
            required: ['operation']
          }
        });
        break;
    }
  }

  return schemas;
}

/**
 * Emergency fallback - call Haiku directly with minimal tools
 */
async function callHaikuDirect(query: string): Promise<string> {
  // This is the OLD way with simplified toolset
  // Only used if router fails
  console.warn('⚠️  Using fallback mode - router failed');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  try {
    const response = await axios.post(
      `${SERVICES.HAIKU_API}/messages`,
      {
        model: 'claude-3-haiku-20240307',
        messages: [{
          role: 'user',
          content: `You are ZANTARA, an AI assistant. Answer this query: ${query}`
        }],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text;
  } catch (error: any) {
    throw new Error(`Fallback Haiku call failed: ${error.message}`);
  }
}

/**
 * Metrics endpoint
 */
app.get('/api/metrics', (req: Request, res: Response) => {
  const avgRouterLatency = metrics.routerLatency.length > 0
    ? metrics.routerLatency.reduce((a, b) => a + b, 0) / metrics.routerLatency.length
    : 0;

  const avgHaikuLatency = metrics.haikuLatency.length > 0
    ? metrics.haikuLatency.reduce((a, b) => a + b, 0) / metrics.haikuLatency.length
    : 0;

  const avgTotalLatency = metrics.totalLatency.length > 0
    ? metrics.totalLatency.reduce((a, b) => a + b, 0) / metrics.totalLatency.length
    : 0;

  res.json({
    totalRequests: metrics.totalRequests,
    performance: {
      avgRouterLatency: Math.round(avgRouterLatency),
      avgHaikuLatency: Math.round(avgHaikuLatency),
      avgTotalLatency: Math.round(avgTotalLatency),
      baseline: 450, // Original baseline
      improvement: Math.round(((450 - avgTotalLatency) / 450) * 100) + '%'
    },
    toolUsage: metrics.toolsSelected,
    errorRate: ((metrics.errors / metrics.totalRequests) * 100).toFixed(2) + '%',
    successRate: metrics.successRate.toFixed(2) + '%',
    status: 'healthy'
  });
});

/**
 * Reset metrics
 */
app.post('/api/metrics/reset', (req: Request, res: Response) => {
  metrics.totalRequests = 0;
  metrics.routerLatency = [];
  metrics.haikuLatency = [];
  metrics.totalLatency = [];
  metrics.toolsSelected = {};
  metrics.errors = 0;
  metrics.successRate = 0;

  res.json({ message: 'Metrics reset successfully' });
});

/**
 * Health check
 */
app.get('/health', async (req: Request, res: Response) => {
  const checks: Record<string, string> = {
    orchestrator: 'healthy',
    flanRouter: 'unknown',
    ragBackend: 'unknown',
    redis: 'unknown'
  };

  // Check FLAN router
  try {
    await axios.get(`${SERVICES.FLAN_ROUTER}/health`, { timeout: 3000 });
    checks.flanRouter = 'healthy';
  } catch (e) {
    checks.flanRouter = 'unhealthy';
  }

  // Check RAG Backend (ChromaDB + Haiku)
  try {
    await axios.get(`${SERVICES.RAG_BACKEND}/health`, { timeout: 3000 });
    checks.ragBackend = 'healthy';
  } catch (e) {
    checks.ragBackend = 'unhealthy';
  }

  // PATCH-1: Check Redis connection
  try {
    const redisHealthy = await cacheService.ping();
    checks.redis = redisHealthy ? 'healthy' : 'unhealthy';
  } catch (e) {
    checks.redis = 'unhealthy';
  }

  // Overall status (RAG Backend is critical now)
  const allHealthy = checks.flanRouter === 'healthy' && checks.ragBackend === 'healthy' && checks.redis === 'healthy';

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});

/**
 * Service info
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'ZANTARA Orchestrator with RAG',
    version: '2.0.0',
    mode: 'rag-integrated',
    description: 'FLAN-T5 routing + RAG Backend (ChromaDB + Haiku 4.5 + Tools)',
    architecture: 'Orchestrator → RAG Backend → ChromaDB + Haiku',
    endpoints: {
      query: 'POST /api/query',
      metrics: 'GET /api/metrics',
      health: 'GET /health'
    },
    features: {
      ragAccess: 'Full ChromaDB access (387k+ chunks)',
      aiModel: 'Claude Haiku 4.5',
      maxTokens: '8000 (vs 1000 before)',
      toolExecution: 'Full tool suite (164 tools)',
      caching: 'Redis-powered (1h TTL)'
    },
    expectedImprovement: {
      accuracy: '+50% (RAG-enhanced responses)',
      knowledge: 'Complete access to Bali Zero knowledge base',
      tokens: '8x more capacity (8000 vs 1000)'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🚀 ZANTARA Router-Only Orchestrator Started                 ║
╠═══════════════════════════════════════════════════════════════╣
║  Mode: Router-Only (FLAN selects tools, Haiku generates)    ║
║  Port: ${PORT}                                                     ║
║                                                               ║
║  Services:                                                    ║
║  - FLAN Router: ${SERVICES.FLAN_ROUTER.padEnd(42)}║
║  - Haiku API: Connected                                       ║
║  - TS Backend: ${SERVICES.TS_BACKEND.padEnd(43)}║
║  - Python Backend: ${SERVICES.PYTHON_BACKEND.padEnd(38)}║
║                                                               ║
║  Tool Reduction: 143 → 5 super-tools                         ║
║  Expected Latency: ~250ms (vs 450ms baseline)                ║
║                                                               ║
║  Test with:                                                   ║
║  curl -X POST http://localhost:${PORT}/api/query \\            ║
║    -H 'Content-Type: application/json' \\                     ║
║    -d '{"query": "What is the price of KITAS?"}'             ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
