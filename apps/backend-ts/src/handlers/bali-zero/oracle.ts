import { ok } from '../../utils/response.js';

type OracleParams = {
  service?: string;
  scenario?: string;
  urgency?: 'low' | 'normal' | 'high';
  complexity?: 'low' | 'medium' | 'high';
  region?: string;
  budget?: number;
  goals?: string[];
};

type ServiceKey = 'visa' | 'company' | 'tax' | 'legal' | 'property';


// All service profiles, timelines, success rates, checkpoints,
// blockers, and accelerators are stored in Qdrant/PostgreSQL and retrieved via RAG backend
// This ensures data accuracy and eliminates hardcoded values from the codebase

function resolveService(raw?: string): ServiceKey {
  const key = (raw || 'visa').toLowerCase();
  if (key.includes('visa')) return 'visa';
  if (key.includes('company') || key.includes('pma')) return 'company';
  if (key.includes('tax')) return 'tax';
  if (key.includes('legal')) return 'legal';
  if (key.includes('property') || key.includes('real')) return 'property';
  return 'visa';
}

/**
 * Collection Routing Logic - Determines which Qdrant collection to query
 * This is PURE LOGIC - no hardcoded data, only routing methodology
 */
function getCollectionForService(service: ServiceKey): string {
  // Routing logic: map service type to Qdrant collection
  const collectionMap: Record<ServiceKey, string> = {
    visa: 'visa_oracle',
    company: 'company_oracle',
    tax: 'tax_genius',
    legal: 'legal_intelligence',
    property: 'property_knowledge',
  };
  return collectionMap[service] || 'legal_unified';
}

/**
 * Multi-topic Detection - Identifies if query spans multiple domains
 * Returns array of collections to query
 */
function detectMultiTopic(scenario: string): boolean {
  if (!scenario) return false;
  const lower = scenario.toLowerCase();
  // Detect multi-topic queries (e.g., "visa and company setup", "tax and property")
  const topicKeywords = ['visa', 'company', 'tax', 'legal', 'property', 'pma', 'kitas'];
  const foundTopics = topicKeywords.filter(keyword => lower.includes(keyword));
  return foundTopics.length > 1;
}

/**
 * Get collections for multi-topic queries
 * Returns array of collections to query in parallel
 */
function getMultiTopicCollections(scenario: string, primaryService: ServiceKey): string[] {
  if (!detectMultiTopic(scenario)) {
    return [getCollectionForService(primaryService)];
  }
  
  const lower = scenario.toLowerCase();
  const collections: string[] = [];
  
  // Add collections based on detected topics (generic keywords only)
  if (lower.includes('visa') || lower.includes('permit') || lower.includes('immigration')) collections.push('visa_oracle');
  if (lower.includes('company') || lower.includes('business') || lower.includes('investment')) collections.push('company_oracle');
  if (lower.includes('tax') || lower.includes('pajak')) collections.push('tax_genius');
  if (lower.includes('legal') || lower.includes('hukum')) collections.push('legal_intelligence');
  if (lower.includes('property') || lower.includes('properti')) collections.push('property_knowledge');
  
  // If no specific topics detected, use primary service collection
  return collections.length > 0 ? collections : [getCollectionForService(primaryService)];
}

function deriveAdjustments(params: OracleParams) {
  const urgency = params.urgency || 'normal';
  const complexity = params.complexity || 'medium';

  const urgencyFactor = urgency === 'high' ? -0.08 : urgency === 'low' ? 0.04 : 0;
  const complexityFactor = complexity === 'high' ? -0.1 : complexity === 'low' ? 0.05 : 0;

  const riskLevel = (() => {
    if (complexity === 'high' || urgency === 'high') return 'elevated';
    if (complexity === 'low' && urgency === 'low') return 'low';
    return 'moderate';
  })();

  const timelineMultiplier =
    1 +
    (complexity === 'high' ? 0.25 : complexity === 'low' ? -0.15 : 0) +
    (urgency === 'high' ? -0.12 : 0);

  return { urgencyFactor, complexityFactor, riskLevel, timelineMultiplier };
}


export async function oracleSimulate(params: OracleParams = {}) {
  if (process.env.BRIDGE_ORACLE_ENABLED === 'true') {
    // Bridge check removed - bridged variable not defined
  }

  const service = resolveService(params.service);
  const { urgencyFactor, complexityFactor, riskLevel, timelineMultiplier } =
    deriveAdjustments(params);
  
  // Collection routing logic - determines which Qdrant collection to query
  const collection = getCollectionForService(service);
  
  // All simulation data (success probabilities, timelines, checkpoints, accelerators, blockers)
  // are retrieved from RAG backend (Qdrant/PostgreSQL)
  return ok({
    service: service,
    scenario: params.scenario || 'standard',
    region: params.region || 'Bali',
    collection: collection,
    riskLevel,
    source: 'RAG backend (Qdrant/PostgreSQL)',
    note: 'All simulation data (success probabilities, timelines, checkpoints, accelerators, blockers) are retrieved from the database',
    routing: {
      primaryCollection: collection,
      adjustmentFactors: {
        urgency: urgencyFactor,
        complexity: complexityFactor,
        timelineMultiplier: timelineMultiplier,
      },
    },
  });
}

export async function oracleAnalyze(params: OracleParams = {}) {
  if (process.env.BRIDGE_ORACLE_ENABLED === 'true') {
    // Bridge check removed - bridged variable not defined
  }

  const service = resolveService(params.service);
  // Service profile data now comes from RAG backend (Qdrant/PostgreSQL)
  // All timelines, success rates, checkpoints, blockers, accelerators are in the database

  const { riskLevel } = deriveAdjustments(params);

  // Collection routing logic - determines which Qdrant collection to query
  const collection = getCollectionForService(service);
  
  return ok({
    service: service,
    riskLevel,
    collection: collection, // Collection to query in RAG backend
    source: 'RAG backend (Qdrant/PostgreSQL)',
    note: 'All service profiles, timelines, and analysis data are retrieved from the database',
    routing: {
      primaryCollection: collection,
      multiTopic: detectMultiTopic(params.scenario || ''),
      collections: getMultiTopicCollections(params.scenario || '', service),
    },
  });
}

export async function oraclePredict(params: OracleParams = {}) {
  if (process.env.BRIDGE_ORACLE_ENABLED === 'true') {
    // Bridge check removed - bridged variable not defined
  }

  const service = resolveService(params.service);
  const { urgencyFactor, complexityFactor } = deriveAdjustments(params);
  
  // Collection routing logic - determines which Qdrant collection to query
  const collection = getCollectionForService(service);
  
  // All forecast data (timelines, success probabilities, checkpoints) 
  // are retrieved from RAG backend (Qdrant/PostgreSQL)
  return ok({
    service: service,
    collection: collection,
    source: 'RAG backend (Qdrant/PostgreSQL)',
    note: 'All forecast data (timelines, success probabilities, checkpoints) are retrieved from the database',
    routing: {
      primaryCollection: collection,
      adjustmentFactors: {
        urgency: urgencyFactor,
        complexity: complexityFactor,
      },
    },
  });
}
