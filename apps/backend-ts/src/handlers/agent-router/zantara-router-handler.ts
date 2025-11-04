// ZANTARA Multi-Agent Router Handler
// TinyLlama → Qwen/Mistral/Llama → $0 monthly cost

import { ok } from "../../utils/response.js";
import { Request, Response } from "express";
import ZANTARAAgentRouter from "../../services/zantara-router.js";

const agentRouter = new ZANTARAAgentRouter();

/**
 * Main routing endpoint - replaces all GLM-4.6 single agent
 */
export async function routeAgentQuery(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    const params = req.body.params || req.body;
    const { query, domain, user_id, context } = params;

    if (!query) {
      return res.json(ok({
        error: "Query parameter required",
        example: {
          query: "Analyze restaurant investment in Bali",
          domain: "business",
          context: { location: "bali", investment_capacity: "high" }
        },
        available_agents: ["qwen", "mistral", "llama"],
        routing_system: "TinyLlama Intent Detection"
      }));
    }

    logger.info(`Agent routing query: "${query}" (domain: ${domain})`);

    // Route to appropriate agent
    const response = await agentRouter.routeToAgent({
      query,
      domain,
      user_id: user_id || "anonymous",
      context: context || {}
    });

    response.processing_time = `${Date.now() - startTime}ms`;

    return res.json(ok({
      ...response,
      timestamp: new Date().toISOString(),
      system: "ZANTARA Multi-Agent Router",
      cost: "$0 (local models)",
      total_latency: response.processing_time
    }));

  } catch (error: any) {
    const errorTime = Date.now() - startTime;
    logger.error("Agent routing failed:", error);

    return res.json(ok({
      error: "Agent routing failed",
      message: error.message,
      processing_time: `${errorTime}ms`,
      fallback: "All local agents unavailable",
      routing_system: "TinyLlama Intent Detection"
    }));
  }
}

/**
 * Get router and agents status
 */
export async function getRouterStatus(req: Request, res: Response) {
  try {
    const status = await agentRouter.getStatus();

    return res.json(ok({
      ...status,
      timestamp: new Date().toISOString(),
      system: "ZANTARA Multi-Agent Router",
      deployment: "Production Ready",
      cost_comparison: {
        glm46_monthly: "$70-80",
        local_models: "$0",
        savings: "$70-80/month (100%)"
      }
    }));

  } catch (error: any) {
    logger.error("Router status check failed:", error);

    return res.json(ok({
      error: "Status check failed",
      message: error.message
    }));
  }
}

/**
 * Test individual agents
 */
export async function testAgent(req: Request, res: Response) {
  try {
    const { agent, query } = req.body.params || req.body;

    if (!agent || !query) {
      return res.json(ok({
        error: "Agent and query parameters required",
        available_agents: ["qwen", "mistral", "llama"],
        example: {
          agent: "qwen",
          query: "Analyze restaurant profit margins"
        }
      }));
    }

    const response = await agentRouter.routeToAgent({
      query,
      agent_filter: agent,
      context: { test_mode: true }
    });

    return res.json(ok({
      test: true,
      agent: agent,
      query: query,
      response,
      timestamp: new Date().toISOString()
    }));

  } catch (error: any) {
    logger.error("Agent test failed:", error);

    return res.json(ok({
      error: "Agent test failed",
      message: error.message
    }));
  }
}