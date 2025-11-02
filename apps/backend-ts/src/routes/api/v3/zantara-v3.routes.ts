// ZANTARA v3 Ω Routes - 3 Strategic Endpoints for Complete Knowledge Access
// Minimal endpoints, maximum coverage

import { Router } from 'express';
import { zantaraUnifiedQuery } from '../../handlers/zantara-v3/zantara-unified.js';
import { zantaraCollectiveIntelligence } from '../../handlers/zantara-v3/zantara-collective.js';
import { zantaraEcosystemAnalysis } from '../../handlers/zantara-v3/zantara-ecosystem.js';

const router = Router();

/**
 * 🚀 ZANTARA v3 Ω API Routes
 *
 * ONLY 3 ENDPOINTS for complete access to ALL ZANTARA knowledge:
 *
 * 1. /unified - Single entry point for ALL knowledge bases
 * 2. /collective - Shared memory and learning across users
 * 3. /ecosystem - Complete business ecosystem analysis
 *
 * Coverage: KBLI + Pricing + Team + Legal + Tax + Immigration + Property + RAG (14K+ docs)
 */

router.post('/unified', async (req, res) => {
  try {
    await zantaraUnifiedQuery(req, res);
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message,
      endpoint: '/api/v3/zantara/unified'
    });
  }
});

/**
 * Unified Knowledge Endpoint
 * Access ALL ZANTARA knowledge bases through single endpoint
 *
 * Query Examples:
 * - { domain: "kbli", query: "restaurant" }
 * - { domain: "pricing", query: "KITAS" }
 * - { domain: "team", query: "italian" }
 * - { domain: "all", query: "business setup" }
 *
 * @route POST /api/v3/zantara/unified
 * @access Public
 * @returns Comprehensive knowledge from all domains
 */
router.post('/collective', async (req, res) => {
  try {
    await zantaraCollectiveIntelligence(req, res);
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message,
      endpoint: '/api/v3/zantara/collective'
    });
  }
});

/**
 * Collective Intelligence Endpoint
 * Shared learning and memory across all users
 *
 * Actions:
 * - query: Search collective knowledge
 * - contribute: Add insights to shared memory
 * - verify: Validate community knowledge
 * - stats: Get ecosystem statistics
 * - sync: Sync user with collective intelligence
 *
 * @route POST /api/v3/zantara/collective
 * @access Public
 * @returns Collaborative intelligence results
 */
router.post('/ecosystem', async (req, res) => {
  try {
    await zantaraEcosystemAnalysis(req, res);
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message,
      endpoint: '/api/v3/zantara/ecosystem'
    });
  }
});

/**
 * Ecosystem Analysis Endpoint
 * Complete business ecosystem analysis integrating ALL knowledge domains
 *
 * Scenarios:
 * - business_setup: New business establishment analysis
 * - expansion: Business growth and scaling analysis
 * - compliance: Regulatory compliance requirements
 * - optimization: Business optimization opportunities
 *
 * Business Types:
 * - restaurant, hotel, retail, services, tech
 *
 * @route POST /api/v3/zantara/ecosystem
 * @access Public
 * @returns Complete business ecosystem analysis
 */

// API Documentation Route
router.get('/', (req, res) => {
  res.json({
    service: "ZANTARA v3 Ω API",
    version: "3.0.0-omega",
    description: "Complete knowledge access through 3 strategic endpoints",
    endpoints: {
      unified: {
        path: "/api/v3/zantara/unified",
        method: "POST",
        description: "Single entry point for ALL knowledge bases",
        domains: ["kbli", "pricing", "team", "legal", "tax", "immigration", "property", "memory"],
        coverage: "8 knowledge domains + 14,365 RAG documents",
        examples: [
          { domain: "kbli", query: "restaurant" },
          { domain: "pricing", query: "KITAS" },
          { domain: "all", query: "Italian restaurant Bali" }
        ]
      },
      collective: {
        path: "/api/v3/zantara/collective",
        method: "POST",
        description: "Shared learning and memory across users",
        actions: ["query", "contribute", "verify", "stats", "sync"],
        benefits: ["Cross-user learning", "Knowledge verification", "Community insights"]
      },
      ecosystem: {
        path: "/api/v3/zantara/ecosystem",
        method: "POST",
        description: "Complete business ecosystem analysis",
        scenarios: ["business_setup", "expansion", "compliance", "optimization"],
        business_types: ["restaurant", "hotel", "retail", "services", "tech"],
        integration: ["KBLI + Pricing + Legal + Tax + Immigration + Property + Team"]
      }
    },
    knowledge_bases: {
      hardcoded: {
        kbli: "21 business classification codes",
        pricing: "Complete Bali Zero service pricing",
        team: "23 team members with expertise",
        legal: "442 lines Indonesian law",
        immigration: "2,200 lines visa services",
        tax: "516 lines tax regulations",
        property: "447 lines property law"
      },
      rag: {
        total_documents: "14,365",
        bali_zero_agents: "1,458 operational documents",
        books: "214 books (12,907 embeddings)",
        vector_database: "ChromaDB + Qdrant"
      },
      collective: {
        memory: "Cross-user learning system",
        verification: "Community knowledge validation",
        insights: "Shared business intelligence"
      }
    },
    performance: {
      response_time: "~0.12s average",
      success_rate: "95%+ for core domains",
      coverage: "Complete Indonesia business ecosystem"
    },
    changelog: {
      "v3.0.0-omega": [
        "Reduced from 20+ endpoints to 3 strategic endpoints",
        "Unified all knowledge bases under single API",
        "Added collective intelligence system",
        "Complete ecosystem analysis capability",
        "Integrated RAG with 14,365 documents"
      ]
    }
  });
});

export default router;