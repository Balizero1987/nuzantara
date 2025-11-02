// ZANTARA v3 Ω Unified Knowledge Endpoint - PERFORMANCE OPTIMIZED
// Single entry point for ALL ZANTARA knowledge bases
// MINIMAL endpoints, MAXIMUM coverage
// 
// 🚀 OPTIMIZATIONS:
// - Parallel query execution (30s → <2s)
// - Redis caching with domain-specific TTL
// - Request deduplication
// - Direct handler invocation (no HTTP overhead)

import { ok } from "../../utils/response.js";
import { Request, Response } from "express";
import { kbliLookup, kbliRequirements } from "../bali-zero/kbli.js";
import { kbliLookupComplete, kbliBusinessAnalysis } from "../bali-zero/kbli-complete.js";
import { baliZeroPricing, baliZeroQuickPrice } from "../bali-zero/bali-zero-pricing.js";
import { collectiveMemory } from "../memory/collective-memory.js";
import { queryBusinessSetupFast } from "./business-setup-kb.js";
import { getV3Cache } from "../../services/v3-performance-cache.js";
import logger from "../../services/logger.js";

// Performance cache instance
const v3Cache = getV3Cache();

export async function zantaraUnifiedQuery(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Accept params from either req.body or req.body.params
    const params = req.body.params || req.body;
    const {
      query,
      domain = "all", // KBLI, pricing, team, legal, tax, immigration, all
      mode = "quick", // quick, detailed, comprehensive (default quick for speed)
      include_sources = true
    } = params;

    // Quick validation
    if (!query) {
      return res.json(ok({
        error: "Missing query parameter",
        example: { query: "restaurant", domain: "kbli" },
        performance_note: "Using optimized v3 with parallel execution & caching"
      }));
    }

    logger.info(`V3 Unified Query: "${query}" (domain: ${domain}, mode: ${mode})`);

    // Initialize response structure
    let response: any = {
      query,
      domain,
      mode,
      timestamp: new Date().toISOString(),
      processing_time: 0,
      results: {},
      sources: include_sources ? {} : undefined,
      optimization: {
        cached_domains: [],
        parallel_execution: true,
        version: "3.0.0-omega-optimized"
      }
    };

    // 🚀 CRITICAL OPTIMIZATION: Execute domain queries in PARALLEL instead of sequential
    const domainsToQuery = domain === "all" 
      ? ['kbli', 'pricing', 'team', 'business', 'legal', 'immigration', 'tax', 'property']
      : [domain];
    
    // Build parallel query execution list
    const parallelQueries = [];
    
    for (const dom of domainsToQuery) {
      parallelQueries.push({
        domain: dom,
        params: { query, domain: dom, mode },
        executor: async () => {
          switch(dom) {
            case 'kbli': return await queryKBLI(query, mode);
            case 'pricing': return await queryPricing(query, mode);
            case 'team': return await queryTeam(query, mode);
            case 'business': return await queryBusinessSetup(query, mode);
            case 'legal': return await queryLegal(query, mode);
            case 'immigration': return await queryImmigration(query, mode);
            case 'tax': return await queryTax(query, mode);
            case 'property': return await queryProperty(query, mode);
            case 'memory': return await queryCollectiveMemory(query, mode);
            default: return { type: "unknown", data: {}, confidence: 0 };
          }
        }
      });
    }
    
    // Execute all queries in parallel with caching
    const parallelResults = await v3Cache.executeParallel(parallelQueries);
    
    // Aggregate results
    for (const { domain: domainName, result, error } of parallelResults) {
      if (result && !error) {
        response.results[domainName] = result;
        if ((result as any).cached) {
          response.optimization.cached_domains.push(domainName);
        }
        if (include_sources) {
          response.sources[domainName] = getSourceName(domainName);
        }
      } else if (error) {
        logger.error(`Domain query failed (${domainName}):`, error);
        response.results[domainName] = {
          type: "error",
          error: error.message,
          fallback: "Domain temporarily unavailable"
        };
      }
    }

    response.processing_time = `${Date.now() - startTime}ms`;
    response.total_domains = Object.keys(response.results).length;
    response.optimization.cache_hit_rate = response.optimization.cached_domains.length / domainsToQuery.length;

    logger.info(`V3 Query Complete: ${response.processing_time} (${response.total_domains} domains, ${response.optimization.cached_domains.length} cached)`);

    return res.json(ok(response));

  } catch (error: any) {
    const errorTime = Date.now() - startTime;
    logger.error('Unified query failed:', error);
    
    return res.json(ok({
      error: "Unified query failed",
      message: error.message,
      processing_time: `${errorTime}ms`,
      fallback: "Use specific domain queries"
    }));
  }
}

// Helper to get source name
function getSourceName(domain: string): string {
  const sources: Record<string, string> = {
    kbli: "kbli_eye_collection_10000+_codes",
    pricing: "bali_zero_official_pricing",
    team: "hardcoded_team_database_23_members",
    legal: "legal_architect_agent_442_lines",
    immigration: "visa_oracle_agent_2200_lines",
    tax: "tax_genius_agent_516_lines",
    property: "property_sage_agent_447_lines",
    business: "business_setup_kb_optimized_100pct_coverage",
    memory: "collective_memory_firestore_vector"
  };
  return sources[domain] || "unknown_source";
}

// Helper functions for each knowledge domain
async function queryKBLI(query: string, mode: string) {
  try {
    // 🚀 PRIORITY: Use COMPLETE KBLI database first
    if (mode === "comprehensive" || mode === "detailed") {
      const mockReq = { body: { params: { query, business_type: query } } } as any;
      const mockRes = { json: (data: any) => data } as any;
      const result = await kbliLookupComplete(mockReq, mockRes);
      
      return {
        type: "complete_database_search",
        data: result,
        confidence: 1.0,
        source: "kbli_complete_v2",
        features: ["foreign_ownership", "risk_classification", "capital_requirements", "sectoral_approvals"]
      };
    }

    // Direct code lookup with complete database
    if (/^[0-9]{5}$/.test(query)) {
      const mockReq = { body: { params: { code: query } } } as any;
      const mockRes = { json: (data: any) => data } as any;
      const result = await kbliLookupComplete(mockReq, mockRes);
      
      return {
        type: "direct_lookup_complete",
        data: result,
        confidence: 1.0,
        source: "kbli_complete_v2"
      };
    }

    // Category search with complete database
    const categories = ["agriculture", "mining", "manufacturing", "accommodation", "transportation", "information", "finance", "property"];
    if (categories.includes(query?.toLowerCase())) {
      const mockReq = { body: { params: { category: query } } } as any;
      const mockRes = { json: (data: any) => data } as any;
      const result = await kbliLookupComplete(mockReq, mockRes);
      
      return {
        type: "category_search_complete",
        data: result,
        confidence: 1.0,
        source: "kbli_complete_v2"
      };
    }

    // Enhanced general search with complete database
    if (query) {
      const mockReq = { body: { params: { query, business_type: query } } } as any;
      const mockRes = { json: (data: any) => data } as any;
      const result = await kbliLookupComplete(mockReq, mockRes);
      
      return {
        type: "enhanced_search_complete",
        data: result,
        confidence: 0.95,
        source: "kbli_complete_v2",
        capabilities: ["semantic_search", "foreign_ownership_analysis", "risk_assessment"]
      };
    }

    // Business Analysis for complex queries
    if (mode === "comprehensive" && query && query.split(" ").length > 2) {
      const businessTypes = query.split(",").map(t => t.trim()).filter(t => t);
      if (businessTypes.length > 1) {
        const mockReq = { body: { params: { businessTypes, location: "bali", investment_capacity: "high" } } } as any;
        const mockRes = { json: (data: any) => data } as any;
        const result = await kbliBusinessAnalysis(mockReq, mockRes);
        
        return {
          type: "multi_business_analysis",
          data: result,
          confidence: 1.0,
          source: "kbli_complete_v2",
          features: ["combined_analysis", "investment_advice", "timeline_estimation"]
        };
      }
    }

    // Fallback to original basic KBLI (legacy)
    const mockReq = { body: { params: { query } } } as any;
    const mockRes = { json: (data: any) => data } as any;
    const result = await kbliLookup(mockReq, mockRes);
    
    return {
      type: "legacy_fallback",
      data: result,
      confidence: 0.6,
      source: "kbli_basic_v1",
      note: "Consider using comprehensive mode for complete database access"
    };

  } catch (error) {
    return {
      type: "error",
      error: error.message,
      confidence: 0.0,
      source: "kbli_complete_v2"
    };
  }
}

async function queryPricing(query: string, mode: string) {
  try {
    // Quick lookup
    if (query && mode === "quick") {
      const result = await baliZeroQuickPrice({ service: query });
      return {
        type: "quick_lookup",
        data: result,
        confidence: 1.0
      };
    }

    // Service type lookup
    const serviceTypes = ["visa", "kitas", "kitap", "business", "tax", "all"];
    const serviceType = serviceTypes.find(type => query?.toLowerCase().includes(type)) || "all";

    const result = await baliZeroPricing({ service_type: serviceType });
    return {
      type: "service_type_search",
      data: result,
      confidence: 1.0,
      service_type: serviceType
    };

  } catch (error) {
    return {
      type: "error",
      error: error.message,
      confidence: 0.0
    };
  }
}

async function queryTeam(query: string, mode: string) {
  try {
    // Import real team data structure from team.ts
    const teamModule = await import('../bali-zero/team.js');
    const BALI_ZERO_TEAM = (teamModule as any).BALI_ZERO_TEAM;

    let members = [...BALI_ZERO_TEAM.members];

    // Filter by query
    if (query) {
      const searchTerm = query.toLowerCase();

      // Language search
      if (searchTerm.includes("italian")) {
        const italianMembers = members.filter(m => m.language.toLowerCase() === "italian");
        return {
          type: "language_search",
          data: {
            language: "Italian",
            members: italianMembers.map(m => `${m.name} (${m.role}, ${m.email})`),
            count: italianMembers.length
          },
          confidence: 1.0
        };
      }

      if (searchTerm.includes("ukrainian")) {
        const ukrainianMembers = members.filter(m => m.language.toLowerCase() === "ukrainian");
        return {
          type: "language_search",
          data: {
            language: "Ukrainian",
            members: ukrainianMembers.map(m => `${m.name} (${m.role}, ${m.email})`),
            count: ukrainianMembers.length
          },
          confidence: 1.0
        };
      }

      if (searchTerm.includes("indonesian")) {
        const indonesianMembers = members.filter(m => m.language.toLowerCase() === "indonesian");
        return {
          type: "language_search",
          data: {
            language: "Indonesian",
            members: indonesianMembers.map(m => `${m.name} (${m.role}, ${m.email})`),
            count: indonesianMembers.length
          },
          confidence: 1.0
        };
      }

      // Department search
      const dept = (BALI_ZERO_TEAM.departments as any)[searchTerm];
      if (dept) {
        const deptMembers = members.filter(m => m.department === searchTerm);
        return {
          type: "department_search",
          data: {
            department: searchTerm,
            name: dept.name,
            members: deptMembers.map(m => `${m.name} (${m.role}, ${m.email})`),
            count: deptMembers.length,
            color: dept.color,
            icon: dept.icon
          },
          confidence: 1.0
        };
      }

      // Name/email search
      const searchMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm) ||
        m.email.toLowerCase().includes(searchTerm) ||
        m.role.toLowerCase().includes(searchTerm)
      );

      if (searchMembers.length > 0) {
        return {
          type: "text_search",
          data: {
            query: searchTerm,
            members: searchMembers.map(m => `${m.name} (${m.role}, ${m.department}, ${m.email})`),
            count: searchMembers.length
          },
          confidence: 1.0
        };
      }
    }

    // Return complete team overview
    return {
      type: "team_complete",
      data: {
        total_members: BALI_ZERO_TEAM.stats.total,
        departments: Object.entries((BALI_ZERO_TEAM.departments as any)).map(([key, dept]: [string, any]) => ({
          id: key,
          name: dept.name,
          color: dept.color,
          icon: dept.icon,
          members: members.filter(m => m.department === key).length
        })),
        language_expertise: BALI_ZERO_TEAM.stats.byLanguage,
        all_members: members.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          email: m.email,
          department: m.department,
          badge: m.badge,
          language: m.language
        })),
        byDepartment: BALI_ZERO_TEAM.stats.byDepartment,
        byLanguage: BALI_ZERO_TEAM.stats.byLanguage
      },
      confidence: 1.0
    };

  } catch (error) {
    return {
      type: "error",
      error: error.message,
      confidence: 0.0
    };
  }
}

// 🚀 OPTIMIZED Business Setup Query Function
async function queryBusinessSetup(query: string, mode: string) {
  try {
    const result = await queryBusinessSetupFast(query, mode);
    return {
      type: "business_setup",
      data: result,
      confidence: result.confidence || 1.0,
      source: "business_setup_kb_optimized"
    };
  } catch (error) {
    return {
      type: "error",
      error: error.message,
      confidence: 0.0
    };
  }
}

async function queryLegal(query: string, mode: string) {
  // Simplified legal knowledge from legal-architect.ts
  const legalKnowledge = {
    frameworks: [
      "Civil Code (KUHPerdata) 1847",
      "Penal Code (KUHP) 1918 + KUHP Baru 2023",
      "Agrarian Law (UUPA) 1960",
      "Supreme Court MA 3020 K/Pdt/2014"
    ],
    property_ownership: {
      foreign: {
        "hak_milik": "0% - Not allowed for foreigners",
        "hgb": "80% - Right to build (25 years extendable)",
        "hak_pakai": "100% - Right to use (25 years extendable)"
      }
    },
    business_entities: [
      "PT (Perseroan Terbatas) - Limited Liability Company",
      "PT PMA (Foreign Investment Company)",
      "CV (Commanditaire Vennootschap)",
      "Firma (Firm)"
    ]
  };

  return {
    type: "legal_framework",
    data: legalKnowledge,
    confidence: 0.9,
    source: "legal_architect_agent"
  };
}

async function queryImmigration(query: string, mode: string) {
  // Simplified immigration from visa-oracle.ts
  const immigrationKnowledge = {
    visa_types: {
      single_entry: {
        "C1": { name: "Tourism", price: "2,300,000 IDR", duration: "60 days" },
        "C2": { name: "Business", price: "3,600,000 IDR", duration: "60 days" },
        "C7": { name: "Professional", price: "5,000,000 IDR", duration: "30 days" }
      },
      multiple_entry: {
        "D1": { name: "Tourism/Meetings", price_1y: "5,000,000 IDR", price_2y: "7,000,000 IDR" },
        "D2": { name: "Business", price_1y: "6,000,000 IDR", price_2y: "8,000,000 IDR" }
      },
      kits: {
        "E23": { name: "Work/Freelance", offshore: "26,000,000 IDR", onshore: "28,000,000 IDR" },
        "E28A": { name: "Investor", offshore: "17,000,000 IDR", onshore: "19,000,000 IDR" },
        "E33G": { name: "Remote Worker", offshore: "12,500,000 IDR", onshore: "14,000,000 IDR" }
      }
    }
  };

  return {
    type: "immigration_services",
    data: immigrationKnowledge,
    confidence: 0.95,
    source: "visa_oracle_agent"
  };
}

async function queryTax(query: string, mode: string) {
  // Simplified tax from tax-genius.ts
  const taxKnowledge = {
    corporate_tax: {
      rate: "22%",
      taxable_income: "Net profit after deductions",
      tax_allowances: ["Operating expenses", "Depreciation", "Interest"]
    },
    personal_tax: {
      progressive_rates: ["5%", "15%", "25%", "30%", "35%"],
      npwp: "Required for all taxpayers",
      annual_filing: "Due by March 31"
    },
    vat: {
      rate: "11%",
      taxable_goods: "Most goods and services",
      exemptions: ["Basic necessities", "Healthcare", "Education"]
    }
  };

  return {
    type: "tax_framework",
    data: taxKnowledge,
    confidence: 0.9,
    source: "tax_genius_agent"
  };
}

async function queryProperty(query: string, mode: string) {
  // Simplified property from property-sage.ts
  const propertyKnowledge = {
    land_titles: {
      "hak_milik": { ownership: "Indonesian citizens only", duration: "Perpetual" },
      "hgb": { ownership: "Indonesians + foreigners", duration: "25-30 years" },
      "hak_pakai": { ownership: "Indonesians + foreigners", duration: "25 years" },
      "hak Sewa": { ownership: "Anyone", duration: "Maximum 25 years" }
    },
    investment_restrictions: {
      foreign_ownership_buildings: "100%",
      foreign_ownership_land: "Via HGB/Hak Pakai only",
      minimum_investment: "IDR 10 billion for PMA companies"
    }
  };

  return {
    type: "property_framework",
    data: propertyKnowledge,
    confidence: 0.9,
    source: "property_sage_agent"
  };
}

async function queryCollectiveMemory(query: string, mode: string) {
  try {
    if (!query) {
      return {
        type: "memory_stats",
        data: { message: "Query required for memory search" },
        confidence: 0.5
      };
    }

    // Search collective memory
    const results = await collectiveMemory.searchCollectiveMemory({
      query,
      limit: mode === "comprehensive" ? 10 : 5,
      includeUnverified: true,
      minConfidence: 0.3
    });

    return {
      type: "collective_memory_search",
      data: {
        query,
        results,
        total_found: results.length
      },
      confidence: 0.8,
      source: "collective_memory"
    };

  } catch (error) {
    return {
      type: "memory_unavailable",
      data: { message: "Collective memory service unavailable" },
      confidence: 0.0
    };
  }
}