// ZANTARA v3 Ω Ecosystem Analysis Endpoint
// Complete business ecosystem analysis: ALL domains integrated

import { ok } from "../../utils/response.js";
import { Request, Response } from "express";
import { baliZeroPricing } from "../bali-zero/bali-zero-pricing.js";
import { kbliLookup, kbliRequirements } from "../bali-zero/kbli.js";
import { collectiveMemory } from "../memory/collective-memory.js";
import axios from "axios";

export async function zantaraEcosystemAnalysis(req: Request, res: Response) {
  try {
    const { params } = req.body;
    const {
      scenario = "business_setup", // business_setup, expansion, compliance, optimization
      business_type = "restaurant", // restaurant, hotel, retail, services, tech
      ownership = "foreign", // foreign, local, joint_venture
      scope = "comprehensive", // quick, detailed, comprehensive
      location = "bali"
    } = params || {};

    const startTime = Date.now();

    // Initialize ecosystem analysis
    let ecosystem: any = {
      scenario,
      business_type,
      ownership,
      scope,
      location,
      timestamp: new Date().toISOString(),
      processing_time: 0,
      analysis: {
        kblis: [],
        requirements: {},
        costs: {},
        timeline: {},
        risks: [],
        opportunities: [],
        team_needs: {},
        compliance: {},
        optimization: {}
      },
      recommendations: [],
      success_probability: 0,
      investment_estimate: {},
      next_steps: []
    };

    // Business Type Analysis
    switch (business_type) {
      case "restaurant":
        ecosystem = await analyzeRestaurantBusiness(ecosystem, scope);
        break;
      case "hotel":
        ecosystem = await analyzeHotelBusiness(ecosystem, scope);
        break;
      case "retail":
        ecosystem = await analyzeRetailBusiness(ecosystem, scope);
        break;
      case "services":
        ecosystem = await analyzeServicesBusiness(ecosystem, scope);
        break;
      case "tech":
        ecosystem = await analyzeTechBusiness(ecosystem, scope);
        break;
      default:
        ecosystem = await analyzeGeneralBusiness(ecosystem, scope);
    }

    // Ownership Structure Analysis
    ecosystem = await analyzeOwnershipStructure(ecosystem);

    // Integration with Collective Intelligence
    ecosystem = await integrateCollectiveIntelligence(ecosystem);

    // Scenario-specific analysis
    switch (scenario) {
      case "business_setup":
        ecosystem = await analyzeBusinessSetup(ecosystem);
        break;
      case "expansion":
        ecosystem = await analyzeBusinessExpansion(ecosystem);
        break;
      case "compliance":
        ecosystem = await analyzeComplianceRequirements(ecosystem);
        break;
      case "optimization":
        ecosystem = await analyzeOptimizationOpportunities(ecosystem);
        break;
    }

    // Calculate success probability and generate recommendations
    ecosystem = await calculateSuccessMetrics(ecosystem);

    ecosystem.processing_time = `${Date.now() - startTime}ms`;

    return ok(ecosystem);

  } catch (error: any) {
    return ok({
      error: "Ecosystem analysis failed",
      message: error.message,
      fallback: "Use individual domain analysis"
    });
  }
}

async function analyzeRestaurantBusiness(ecosystem: any, scope: string) {
  // KBLI Analysis for Restaurants
  const mockReq = { body: { params: { category: "restaurants" } } } as any;
  const mockRes = { json: (data: any) => data } as any;
  const kbliResult = await kbliLookup(mockReq, mockRes);

  ecosystem.analysis.kblis = (kbliResult as any)?.data?.codes || [
    { code: "56101", name: "Restaurant", minimumCapital: "IDR 10,000,000,000" },
    { code: "56102", name: "Warung Makan", minimumCapital: "IDR 50,000,000" },
    { code: "56104", name: "Cafe", minimumCapital: "IDR 10,000,000,000" }
  ];

  // Requirements Analysis
  ecosystem.analysis.requirements = {
    licenses: [
      "SIUP (Surat Izin Usaha Perdagangan)",
      "TDP (Tanda Daftar Perusahaan)",
      "HO (Izin Gangguan)",
      "Sertifikat Laik Hygiene",
      "Izin Lingkungan"
    ],
    documents: [
      "Company deed (Akta Pendirian)",
      "NPWP (Tax ID)",
      "NIB (Business ID)",
      "Location permit",
      "Health certificates"
    ],
    special_licenses: [
      "Alcohol license (if serving alcohol)",
      "Halal certification (recommended)",
      "Food handling permits"
    ]
  };

  // Cost Analysis
  const pricing = await baliZeroPricing({ service_type: "kitas" });
  ecosystem.analysis.costs = {
    setup: {
      company_registration: "IDR 20,000,000+",
      kbli_registration: "IDR 5,000,000",
      licenses: "IDR 10,000,000+",
      minimum_capital: "IDR 10,000,000,000 (PMA)"
    },
    operational: {
      monthly_kitas: pricing.data?.kitas_permits?.["Working KITAS"]?.onshore || "IDR 36,000,000",
      tax_registration: "IDR 1,000,000",
      health_insurance: "IDR 1,500,000/month"
    }
  };

  // Timeline Analysis
  ecosystem.analysis.timeline = {
    company_setup: "2-3 weeks",
    licenses: "4-6 weeks",
    operational_launch: "8-10 weeks total",
    hiring_timeline: "4-6 weeks"
  };

  ecosystem.analysis.risks = [
    "Location zoning restrictions",
    "Alcohol license complexity",
    "Halal certification requirements",
    "Foreign staff visa processing"
  ];

  ecosystem.analysis.opportunities = [
    "Tourist market growth",
    "Expat community demand",
    "Delivery platform integration",
    "Multi-outlet expansion potential"
  ];

  return ecosystem;
}

async function analyzeHotelBusiness(ecosystem: any, scope: string) {
  // KBLI for Accommodation
  const mockReq = { body: { params: { category: "accommodation" } } } as any;
  const mockRes = { json: (data: any) => data } as any;
  const kbliResult = await kbliLookup(mockReq, mockRes);

  ecosystem.analysis.kblis = (kbliResult as any)?.data?.codes || [
    { code: "55111", name: "Hotel Bintang", minimumCapital: "IDR 10,000,000,000" },
    { code: "55130", name: "Villa", minimumCapital: "IDR 10,000,000,000" },
    { code: "55199", name: "Guest House", minimumCapital: "IDR 50,000,000" }
  ];

  ecosystem.analysis.requirements = {
    licenses: [
      "Hotel license",
      "Pondok Wisata (for villas)",
      "Building permits (PBG & SLF)",
      "Fire safety certification",
      "Tourism registration"
    ],
    documents: [
      "Building ownership proof",
      "Environmental impact assessment",
      "Health and safety compliance"
    ]
  };

  ecosystem.analysis.costs = {
    setup: {
      hotel_license: "IDR 15,000,000+",
      building_permit: "IDR 50,000,000+",
      minimum_capital: "IDR 10,000,000,000"
    }
  };

  ecosystem.analysis.timeline = {
    building_completion: "variable",
    licensing: "3-4 months",
    operational_setup: "4-6 months total"
  };

  return ecosystem;
}

async function analyzeRetailBusiness(ecosystem: any, scope: string) {
  // Retail analysis
  ecosystem.analysis.kblis = [
    { code: "47111", name: "Minimarket", minimumCapital: "IDR 10,000,000,000" },
    { code: "47190", name: "Retail Store", minimumCapital: "IDR 10,000,000,000" },
    { code: "47911", name: "E-Commerce", minimumCapital: "IDR 100,000,000,000" }
  ];

  ecosystem.analysis.requirements = {
    licenses: ["SIUP", "TDP", "HO"],
    restrictions: [
      "Foreign-owned retail: CLOSED",
      "Online retail: OPEN (with high capital)",
      "Location restrictions near traditional markets"
    ]
  };

  return ecosystem;
}

async function analyzeServicesBusiness(ecosystem: any, scope: string) {
  ecosystem.analysis.kblis = [
    { code: "62010", name: "Computer Programming", minimumCapital: "IDR 10,000,000,000" },
    { code: "70209", name: "Business Consulting", minimumCapital: "IDR 10,000,000,000" },
    { code: "73100", name: "Advertising", minimumCapital: "IDR 10,000,000,000" }
  ];

  ecosystem.analysis.requirements = {
    licenses: ["SIUP", "TDP"],
    benefits: [
      "100% foreign ownership allowed",
      "No location restrictions",
      "Lower capital requirements for digital services"
    ]
  };

  return ecosystem;
}

async function analyzeTechBusiness(ecosystem: any, scope: string) {
  ecosystem.analysis.kblis = [
    { code: "62010", name: "Software Development", minimumCapital: "IDR 10,000,000,000" },
    { code: "63110", name: "Data Processing", minimumCapital: "IDR 10,000,000,000" }
  ];

  ecosystem.analysis.requirements = {
    licenses: ["SIUP", "TDP", "Electronic System Operator License"],
    incentives: [
      "Tax holidays for pioneer industries",
      "Import duty exemptions",
      "100% foreign ownership"
    ]
  };

  return ecosystem;
}

async function analyzeGeneralBusiness(ecosystem: any, scope: string) {
  return ecosystem; // Generic business analysis
}

async function analyzeOwnershipStructure(ecosystem: any) {
  switch (ecosystem.ownership) {
    case "foreign":
      ecosystem.analysis.ownership = {
        structure: "PT PMA (Foreign Investment Company)",
        minimum_capital: "IDR 10,000,000,000",
        ownership_limits: "Varies by sector",
        reporting: "LKPM quarterly reports required",
        benefits: ["100% repatriation of profits", "Foreign director allowed", "Investment incentives"]
      };
      break;

    case "local":
      ecosystem.analysis.ownership = {
        structure: "PT (Local Company)",
        minimum_capital: "No minimum required",
        ownership_limits: "100% Indonesian ownership",
        reporting: "Standard corporate reporting",
        benefits: ["Simpler setup", "Lower compliance burden", "Access to local programs"]
      };
      break;

    case "joint_venture":
      ecosystem.analysis.ownership = {
        structure: "PT PMA with local partner",
        minimum_capital: "IDR 10,000,000,000",
        ownership_limits: "Foreign ownership varies by sector",
        reporting: "Corporate + investment reporting",
        benefits: ["Local market access", "Shared expertise", "Regulatory navigation"]
      };
      break;
  }

  return ecosystem;
}

async function integrateCollectiveIntelligence(ecosystem: any) {
  try {
    // Search for similar business scenarios in collective memory
    const collectiveInsights = await collectiveMemory.searchCollectiveMemory({
      query: `${ecosystem.business_type} ${ecosystem.ownership} Bali setup`,
      limit: 5,
      includeUnverified: true
    });

    ecosystem.analysis.collective_intelligence = {
      similar_scenarios: collectiveInsights.length,
      shared_experiences: collectiveInsights.map(insight => ({
        type: insight.type,
        confidence: insight.confidence,
        contributors: insight.contributors.length
      })),
      community_wisdom: collectiveInsights.length > 0 ? "Available" : "Not enough data"
    };

    if (collectiveInsights.length > 0) {
      ecosystem.recommendations.push(
        "Leverage community experience from similar business setups"
      );
    }

  } catch (error) {
    ecosystem.analysis.collective_intelligence = {
      status: "unavailable",
      fallback: "Individual analysis only"
    };
  }

  return ecosystem;
}

async function analyzeBusinessSetup(ecosystem: any) {
  ecosystem.next_steps = [
    "1. Company registration with Ministry of Law",
    "2. Tax ID (NPWP) registration",
    "3. Business ID (NIB) issuance via OSS",
    "4. KBLI code registration",
    "5. Location permits acquisition",
    "6. Operational licenses setup",
    "7. Staff hiring and visa processing"
  ];

  return ecosystem;
}

async function analyzeBusinessExpansion(ecosystem: any) {
  ecosystem.analysis.expansion = {
    additional_kblis: "May need additional codes for new activities",
    capital_requirements: "Additional IDR 10B per new KBLI per location",
    regulatory_compliance: "Each location requires separate permits",
    scalability_factors: ["Talent availability", "Market demand", "Regulatory capacity"]
  };

  return ecosystem;
}

async function analyzeComplianceRequirements(ecosystem: any) {
  ecosystem.analysis.compliance = {
    ongoing_requirements: [
      "Monthly tax reporting",
      "Quarterly LKPM reports (PMA)",
      "Annual financial statements",
      "Staff visa renewals",
      "License renewals"
    ],
    penalties: ["Late filing penalties", "Non-compliance fines", "Business suspension risks"]
  };

  return ecosystem;
}

async function analyzeOptimizationOpportunities(ecosystem: any) {
  ecosystem.analysis.optimization = {
    cost_optimization: [
      "Tax incentives eligibility",
      "BPJS optimization strategies",
      "Import duty exemptions"
    ],
    operational_efficiency: [
      "Digital licensing options",
      "Online tax filing",
      "Automated compliance tracking"
    ]
  };

  return ecosystem;
}

async function calculateSuccessMetrics(ecosystem: any) {
  // Calculate success probability based on various factors
  let successScore = 0.7; // Base score

  // Adjust for business type
  if (ecosystem.business_type === "services") successScore += 0.1;
  if (ecosystem.business_type === "retail" && ecosystem.ownership === "foreign") successScore -= 0.2;

  // Adjust for ownership structure
  if (ecosystem.ownership === "local") successScore += 0.1;
  if (ecosystem.ownership === "joint_venture") successScore += 0.05;

  // Adjust for collective intelligence
  if (ecosystem.analysis.collective_intelligence?.similar_scenarios > 0) {
    successScore += 0.1;
  }

  ecosystem.success_probability = Math.min(0.95, Math.max(0.3, successScore));

  // Investment estimate
  const setupCosts = Object.values(ecosystem.analysis.costs?.setup || {}).reduce((sum: number, cost: any) => {
    const numericCost = typeof cost === 'string' ?
      parseInt(cost.replace(/[^0-9]/g, '')) || 0 :
      cost;
    return sum + numericCost;
  }, 0);

  ecosystem.investment_estimate = {
    initial_investment: `IDR ${setupCosts.toLocaleString()}`,
    operational_yearly: `IDR ${(Number(setupCosts) * 0.3).toLocaleString()}`,
    break_even_timeline: "12-18 months typical",
    roi_potential: (ecosystem as any).success_probability > 0.7 ? "High" : "Medium"
  };

  // Generate final recommendations
  if ((ecosystem as any).success_probability > 0.8) {
    ecosystem.recommendations.push(
      "High success probability - proceed with confidence",
      "Consider rapid expansion after first year"
    );
  } else if ((ecosystem as any).success_probability > 0.6) {
    ecosystem.recommendations.push(
      "Moderate success probability - proceed with careful planning",
      "Consider local partnership for better market access"
    );
  } else {
    ecosystem.recommendations.push(
      "Lower success probability - reconsider business model",
      "Explore alternative business types or ownership structures"
    );
  }

  return ecosystem;
}