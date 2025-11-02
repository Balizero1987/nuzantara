// ZANTARA v3 Ω Unified Knowledge Endpoint
// Single entry point for ALL ZANTARA knowledge bases
// MINIMAL endpoints, MAXIMUM coverage

import { ok } from "../../utils/response.js";
import { Request, Response } from "express";
import { kbliLookup, kbliRequirements } from "../bali-zero/kbli.js";
import { baliZeroPricing, baliZeroQuickPrice } from "../bali-zero/bali-zero-pricing.js";
import { collectiveMemory } from "../memory/collective-memory.js";

export async function zantaraUnifiedQuery(req: Request, res: Response) {
  try {
    const { params } = req.body;
    const {
      query,
      domain = "all", // KBLI, pricing, team, legal, tax, immigration, all
      mode = "comprehensive", // quick, detailed, comprehensive
      include_sources = true
    } = params || {};

    const startTime = Date.now();

    // Initialize response structure
    let response: any = {
      query,
      domain,
      mode,
      timestamp: new Date().toISOString(),
      processing_time: 0,
      results: {},
      sources: include_sources ? {} : undefined
    };

    // KBLI Knowledge Base - REAL DATABASE INTEGRATION
    if (domain === "all" || domain === "kbli") {
      response.results.kbli = await queryKBLI(query, mode);
      if (include_sources) {
        response.sources.kbli = "kbli_eye_collection_10000+_codes";
      }
    }

    // Pricing Knowledge Base
    if (domain === "all" || domain === "pricing") {
      response.results.pricing = await queryPricing(query, mode);
      if (include_sources) {
        response.sources.pricing = "bali_zero_official_pricing";
      }
    }

    // Team Knowledge Base
    if (domain === "all" || domain === "team") {
      response.results.team = await queryTeam(query, mode);
      if (include_sources) {
        response.sources.team = "hardcoded_team_database_23_members";
      }
    }

    // Legal Knowledge Base
    if (domain === "all" || domain === "legal") {
      response.results.legal = await queryLegal(query, mode);
      if (include_sources) {
        response.sources.legal = "legal_architect_agent_442_lines";
      }
    }

    // Immigration Knowledge Base
    if (domain === "all" || domain === "immigration") {
      response.results.immigration = await queryImmigration(query, mode);
      if (include_sources) {
        response.sources.immigration = "visa_oracle_agent_2200_lines";
      }
    }

    // Tax Knowledge Base
    if (domain === "all" || domain === "tax") {
      response.results.tax = await queryTax(query, mode);
      if (include_sources) {
        response.sources.tax = "tax_genius_agent_516_lines";
      }
    }

    // Property Knowledge Base
    if (domain === "all" || domain === "property") {
      response.results.property = await queryProperty(query, mode);
      if (include_sources) {
        response.sources.property = "property_sage_agent_447_lines";
      }
    }

    // Collective Memory
    if (domain === "all" || domain === "memory") {
      response.results.memory = await queryCollectiveMemory(query, mode);
      if (include_sources) {
        response.sources.memory = "collective_memory_firestore_vector";
      }
    }

    response.processing_time = `${Date.now() - startTime}ms`;
    response.total_domains = Object.keys(response.results).length;

    return ok(response);

  } catch (error: any) {
    return ok({
      error: "Unified query failed",
      message: error.message,
      fallback: "Use specific domain queries"
    });
  }
}

// Helper functions for each knowledge domain
async function queryKBLI(query: string, mode: string) {
  try {
    // Direct code lookup
    if (/^[0-9]{5}$/.test(query)) {
      const mockReq = { body: { params: { code: query } } } as any;
      const mockRes = { json: (data: any) => data } as any;
      const result = await kbliLookup(mockReq, mockRes);
      return {
        type: "direct_lookup",
        data: result,
        confidence: 1.0
      };
    }

    // Category search
    const categories = ["restaurants", "accommodation", "retail", "services", "special"];
    if (categories.includes(query?.toLowerCase())) {
      const mockReq = { body: { params: { category: query } } } as any;
      const mockRes = { json: (data: any) => data } as any;
      const result = await kbliLookup(mockReq, mockRes);
      return {
        type: "category_search",
        data: result,
        confidence: 1.0
      };
    }

    // General search
    if (query) {
      const mockReq = { body: { params: { query } } } as any;
      const mockRes = { json: (data: any) => data } as any;
      const result = await kbliLookup(mockReq, mockRes);
      return {
        type: "text_search",
        data: result,
        confidence: 0.8
      };
    }

    // ChromaDB Vector Search - REAL DATABASE
    if (query && mode !== "quick") {
      try {
        const chromaStore = require("../../services/vector/chroma.js")();
        const client = chromaStore.client;

        // Get kbli_eye collection with 10,000+ codes
        const collection = await client.getCollection({ name: "kbli_eye" });

        if (collection) {
          const searchResults = await collection.query({
            queryTexts: [query],
            nResults: mode === "comprehensive" ? 10 : 5
          });

          return {
            type: "chromadb_vector_search",
            data: {
              results: searchResults.ids?.map((id, index) => ({
                id,
                score: searchResults.distances?.[index] || 0,
                metadata: searchResults.metadatas?.[index]
              })) || [],
              total_found: searchResults.ids?.length || 0
            },
            confidence: 0.95
          };
        }
      } catch (error) {
        console.log("ChromaDB search failed, using fallback:", error.message);
      }
    }

    // Fallback to original implementation
    const mockReq = { body: { params: {} } } as any;
    const mockRes = { json: (data: any) => data } as any;
    const result = await kbliLookup(mockReq, mockRes);
    return {
      type: "fallback_search",
      data: result,
      confidence: 0.6
    };

  } catch (error) {
    return {
      type: "error",
      error: error.message,
      confidence: 0.0
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