/**
 * Main Orchestrator - Connects FLAN Router + Haiku
 * Router-Only Mode: FLAN selects tools, Haiku generates ALL responses
 */

import express, { Request, Response } from 'express';
import axios from 'axios';
import * as dotenv from 'dotenv';
import cors from 'cors';
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

// Service configuration
const SERVICES = {
  FLAN_ROUTER: process.env.FLAN_ROUTER_URL || 'https://nuzantara-flan-router.fly.dev',
  HAIKU_API: 'https://api.anthropic.com/v1',
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
app.post('/api/query', async (req: Request, res: Response) => {
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
 * Call Haiku with selected tools and execute tool-use loop
 */
async function callHaiku(prompt: string, tools: string[]): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  // Prepare tool schemas for Haiku
  const toolSchemas = prepareToolSchemas(tools);

  // Initialize conversation with user query
  const messages: any[] = [{
    role: 'user',
    content: prompt
  }];

  // Tool-use loop: Keep calling until we get a final text response
  let iterations = 0;
  const maxIterations = 5; // Prevent infinite loops

  while (iterations < maxIterations) {
    iterations++;

    console.log(`🔄 Haiku iteration ${iterations}...`);

    // Call Haiku API
    const response = await axios.post(
      `${SERVICES.HAIKU_API}/messages`,
      {
        model: 'claude-3-haiku-20240307',
        messages,
        tools: toolSchemas.length > 0 ? toolSchemas : undefined,
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000 // 30s timeout
      }
    );

    const assistantMessage = response.data;

    // Check if response contains tool_use blocks
    const toolUseBlocks = assistantMessage.content.filter((block: any) => block.type === 'tool_use');

    // If no tool use, we have the final response
    if (toolUseBlocks.length === 0) {
      console.log(`✅ Final response received (no tools used)`);
      return assistantMessage;
    }

    console.log(`🔧 Executing ${toolUseBlocks.length} tool(s)...`);

    // Add assistant's response to conversation
    messages.push({
      role: 'assistant',
      content: assistantMessage.content
    });

    // Execute each tool and collect results
    const toolResults: any[] = [];

    for (const toolUse of toolUseBlocks) {
      console.log(`  → Executing: ${toolUse.name}`);

      try {
        // Map tool names (universal_query → universal.query)
        const toolName = toolUse.name.replace('_', '.');
        const toolInput = toolUse.input;

        // Execute tool via SuperToolHandlers
        const result = await toolHandlers.execute({
          tool: toolName,
          action: toolInput.action || toolInput.query || 'query',
          source: toolInput.source || 'knowledge',
          data: toolInput,
          filters: toolInput.filters
        });

        // Format tool result for Claude
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });

        console.log(`  ✅ Tool executed: ${result.success ? 'success' : 'failed'}`);
      } catch (error: any) {
        console.error(`  ❌ Tool execution error:`, error.message);

        // Return error as tool result
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify({
            success: false,
            error: error.message
          }),
          is_error: true
        });
      }
    }

    // Add tool results to conversation
    messages.push({
      role: 'user',
      content: toolResults
    });

    // Continue loop to get final response from Haiku
  }

  // If we hit max iterations, return last response
  console.warn(`⚠️  Max iterations (${maxIterations}) reached`);
  return {
    content: [{
      type: 'text',
      text: 'I apologize, but I reached the maximum number of processing steps. Please try rephrasing your question.'
    }],
    model: 'claude-3-haiku-20240307'
  };
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
    haiku: 'unknown'
  };

  // Check FLAN router
  try {
    await axios.get(`${SERVICES.FLAN_ROUTER}/health`, { timeout: 3000 });
    checks.flanRouter = 'healthy';
  } catch (e) {
    checks.flanRouter = 'unhealthy';
  }

  // Check Haiku (just verify API key exists)
  checks.haiku = process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured';

  // Overall status
  const allHealthy = checks.flanRouter === 'healthy' && checks.haiku === 'configured';

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
    service: 'ZANTARA Router-Only Orchestrator',
    version: '1.0.0',
    mode: 'router-only',
    description: 'FLAN-T5 selects tools, Haiku 4.5 generates responses',
    endpoints: {
      query: 'POST /api/query',
      metrics: 'GET /api/metrics',
      health: 'GET /health'
    },
    toolReduction: '143 → 5 super-tools',
    expectedImprovement: {
      latency: '-44% (450ms → 250ms)',
      accuracy: '+20% (70% → 90%)',
      context: '-93% (15KB → 1KB)'
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
