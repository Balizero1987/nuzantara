/**
 * Decision Logging System
 * Tracks important team decisions with accountability and context
 */

import { logger } from '../../services/logger.js';

/**
 * Decision types
 */
export enum DecisionType {
  ARCHITECTURE = 'architecture',
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  HIRING = 'hiring',
  PROCESS = 'process',
  PRODUCT = 'product',
  SECURITY = 'security',
}

/**
 * Decision impact levels
 */
export enum DecisionImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Decision status
 */
export enum DecisionStatus {
  PROPOSED = 'proposed',
  APPROVED = 'approved',
  IMPLEMENTED = 'implemented',
  REVERSED = 'reversed',
  UNDER_REVIEW = 'under_review',
}

/**
 * Decision entry
 */
export interface Decision {
  id: string;
  timestamp: Date;
  type: DecisionType;
  status: DecisionStatus;
  title: string;
  description: string;
  rationale: string;
  participants: string[];
  decidedBy: string;
  impact: DecisionImpact;
  alternatives?: string[];
  consequences?: string[];
  reviewDate?: Date;
  implementedDate?: Date;
  tags?: string[];
  relatedDecisions?: string[];
  documents?: string[];
  metadata?: Record<string, any>;
}

/**
 * In-memory storage (replace with database in production)
 */
let decisions: Decision[] = [];

/**
 * Generate decision ID
 */
function generateDecisionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `decision_${timestamp}_${random}`;
}

/**
 * Save a decision
 */
export async function saveDecision(params: {
  type: DecisionType;
  title: string;
  description: string;
  rationale?: string;
  participants?: string[];
  decidedBy: string;
  impact?: DecisionImpact;
  alternatives?: string[];
  consequences?: string[];
  reviewDate?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}) {
  const decision: Decision = {
    id: generateDecisionId(),
    timestamp: new Date(),
    type: params.type,
    status: DecisionStatus.APPROVED,
    title: params.title,
    description: params.description,
    rationale: params.rationale || '',
    participants: params.participants || [],
    decidedBy: params.decidedBy,
    impact: params.impact || DecisionImpact.MEDIUM,
    alternatives: params.alternatives,
    consequences: params.consequences,
    reviewDate: params.reviewDate ? new Date(params.reviewDate) : undefined,
    tags: params.tags,
    metadata: params.metadata,
  };

  // Save to memory store
  decisions.push(decision);

  // Log decision
  logger.info('Decision logged', {
    id: decision.id,
    type: decision.type,
    title: decision.title,
    decidedBy: decision.decidedBy,
  });

  // TODO: Save to database for persistence
  // await saveToDatabase(decision);

  // TODO: Save to memory system as episodic event
  // await saveToMemorySystem(decision);

  return {
    ok: true,
    decision,
    message: 'Decision logged successfully',
  };
}

/**
 * Get decisions with filters
 */
export async function getDecisions(params?: {
  type?: DecisionType;
  impact?: DecisionImpact;
  status?: DecisionStatus;
  startDate?: string;
  endDate?: string;
  decidedBy?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}) {
  let filtered = [...decisions];

  if (params) {
    if (params.type) {
      filtered = filtered.filter((d) => d.type === params.type);
    }
    if (params.impact) {
      filtered = filtered.filter((d) => d.impact === params.impact);
    }
    if (params.status) {
      filtered = filtered.filter((d) => d.status === params.status);
    }
    if (params.startDate) {
      const startDate = new Date(params.startDate);
      filtered = filtered.filter((d) => d.timestamp >= startDate);
    }
    if (params.endDate) {
      const endDate = new Date(params.endDate);
      filtered = filtered.filter((d) => d.timestamp <= endDate);
    }
    if (params.decidedBy) {
      filtered = filtered.filter((d) => d.decidedBy === params.decidedBy);
    }
    if (params.tags && params.tags.length > 0) {
      filtered = filtered.filter(
        (d) => d.tags && params.tags!.some((tag) => d.tags!.includes(tag))
      );
    }
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply pagination
  const offset = params?.offset || 0;
  const limit = params?.limit || 50;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    ok: true,
    decisions: paginated,
    total: filtered.length,
    offset,
    limit,
  };
}

/**
 * Get a single decision by ID
 */
export async function getDecision(params: { id: string }) {
  const decision = decisions.find((d) => d.id === params.id);

  if (!decision) {
    return {
      ok: false,
      error: 'Decision not found',
    };
  }

  return {
    ok: true,
    decision,
  };
}

/**
 * Update decision status
 */
export async function updateDecisionStatus(params: { id: string; status: DecisionStatus }) {
  const decision = decisions.find((d) => d.id === params.id);

  if (!decision) {
    return {
      ok: false,
      error: 'Decision not found',
    };
  }

  decision.status = params.status;

  if (params.status === DecisionStatus.IMPLEMENTED) {
    decision.implementedDate = new Date();
  }

  logger.info('Decision status updated', {
    id: decision.id,
    newStatus: params.status,
  });

  return {
    ok: true,
    decision,
    message: `Decision status updated to ${params.status}`,
  };
}

/**
 * Get decision statistics
 */
export async function getDecisionStats() {
  const stats = {
    total: decisions.length,
    byType: {} as Record<string, number>,
    byImpact: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    byMonth: {} as Record<string, number>,
    recentDecisions: [] as Decision[],
    criticalDecisions: [] as Decision[],
  };

  for (const decision of decisions) {
    // Count by type
    stats.byType[decision.type] = (stats.byType[decision.type] || 0) + 1;

    // Count by impact
    stats.byImpact[decision.impact] = (stats.byImpact[decision.impact] || 0) + 1;

    // Count by status
    stats.byStatus[decision.status] = (stats.byStatus[decision.status] || 0) + 1;

    // Count by month
    const monthKey = decision.timestamp.toISOString().substring(0, 7);
    stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;

    // Collect critical decisions
    if (decision.impact === DecisionImpact.CRITICAL) {
      stats.criticalDecisions.push(decision);
    }
  }

  // Get 10 most recent decisions
  stats.recentDecisions = [...decisions]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return {
    ok: true,
    stats,
  };
}

/**
 * Search decisions by text
 */
export async function searchDecisions(params: { query: string; limit?: number }) {
  const query = params.query.toLowerCase();
  const limit = params.limit || 20;

  const matches = decisions.filter(
    (d) =>
      d.title.toLowerCase().includes(query) ||
      d.description.toLowerCase().includes(query) ||
      d.rationale.toLowerCase().includes(query) ||
      d.tags?.some((tag) => tag.toLowerCase().includes(query))
  );

  // Sort by timestamp descending
  matches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    ok: true,
    results: matches.slice(0, limit),
    count: matches.length,
    query: params.query,
  };
}

/**
 * Get decisions needing review
 */
export async function getDecisionsForReview() {
  const now = new Date();

  const needsReview = decisions.filter((d) => {
    if (!d.reviewDate) return false;
    return d.reviewDate <= now && d.status !== DecisionStatus.UNDER_REVIEW;
  });

  // Sort by review date
  needsReview.sort((a, b) => a.reviewDate!.getTime() - b.reviewDate!.getTime());

  return {
    ok: true,
    decisions: needsReview,
    count: needsReview.length,
  };
}

/**
 * Export handlers
 */
export const decisionLogHandlers = {
  'decision.save': saveDecision,
  'decision.get': getDecision,
  'decision.list': getDecisions,
  'decision.update-status': updateDecisionStatus,
  'decision.stats': getDecisionStats,
  'decision.search': searchDecisions,
  'decision.review-needed': getDecisionsForReview,
};
