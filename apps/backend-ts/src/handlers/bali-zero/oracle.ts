import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';

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

type ServiceProfile = {
  label: string;
  baseSuccess: number;
  baseTimeline: number; // days
  checkpoints: string[];
  blockers: string[];
  accelerators: string[];
};

const SERVICE_PROFILES: Record<ServiceKey, ServiceProfile> = {
  visa: {
    label: 'Visa & Immigration',
    baseSuccess: 0.88,
    baseTimeline: 28,
    checkpoints: [
      'Document collection',
      'Sponsorship submission',
      'Immigration approval',
      'Visa activation',
    ],
    blockers: ['Document inconsistencies', 'Overstay history', 'Policy updates'],
    accelerators: ['Complete documentation', 'Premium processing', 'Sponsor readiness'],
  },
  company: {
    label: 'Company Setup',
    baseSuccess: 0.82,
    baseTimeline: 45,
    checkpoints: ['Name reservation', 'Notary deed', 'OSS submission', 'Bank account activation'],
    blockers: [
      'Capital verification delays',
      'Incomplete shareholder documents',
      'Sector restrictions',
    ],
    accelerators: [
      'Prepared shareholder dossier',
      'Local partner availability',
      'Tax office pre-approval',
    ],
  },
  tax: {
    label: 'Tax & Compliance',
    baseSuccess: 0.9,
    baseTimeline: 14,
    checkpoints: [
      'Initial assessment',
      'Document reconciliation',
      'Submission & reporting',
      'Post-filing review',
    ],
    blockers: [
      'Missing historical filings',
      'Late payment penalties',
      'Cross-jurisdictional income',
    ],
    accelerators: ['Digital bookkeeping', 'Dedicated accountant', 'Advance tax clearance'],
  },
  legal: {
    label: 'Legal & Contracts',
    baseSuccess: 0.86,
    baseTimeline: 21,
    checkpoints: ['Briefing & scope', 'Drafting', 'Revision loop', 'Execution & filing'],
    blockers: ['Counterparty negotiations', 'Missing legalisation', 'Multi-language requirements'],
    accelerators: ['Pre-approved templates', 'Aligned stakeholders', 'Legalised documents ready'],
  },
  property: {
    label: 'Property & Real Estate',
    baseSuccess: 0.78,
    baseTimeline: 60,
    checkpoints: [
      'Due diligence',
      'License verification',
      'Agreement structuring',
      'Closing & registration',
    ],
    blockers: [
      'Land certificate discrepancies',
      'Zoning limitations',
      'Foreign ownership constraints',
    ],
    accelerators: ['Nominee vetted', 'Pre-negotiated lease terms', 'Clean certificate history'],
  },
};

function resolveService(raw?: string): ServiceKey {
  const key = (raw || 'visa').toLowerCase();
  if (key.includes('visa')) return 'visa';
  if (key.includes('company') || key.includes('pma')) return 'company';
  if (key.includes('tax')) return 'tax';
  if (key.includes('legal')) return 'legal';
  if (key.includes('property') || key.includes('real')) return 'property';
  return 'visa';
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

function timelineSummary(days: number) {
  if (days <= 15) return `${Math.round(days)} days (rapid)`;
  if (days <= 30) return `${Math.round(days)} days (standard)`;
  if (days <= 60) return `${Math.round(days)} days (extended)`;
  return `${Math.round(days)} days (long-term)`;
}

export async function oracleSimulate(params: OracleParams = {}) {
  if (process.env.BRIDGE_ORACLE_ENABLED === 'true') {
    if (bridged && (bridged as any).ok !== false) return bridged;
  }

  const service = resolveService(params.service);
  const profile = SERVICE_PROFILES[service];
  if (!profile) {
    throw new BadRequestError('Unsupported service for oracle simulation');
  }

  const { urgencyFactor, complexityFactor, riskLevel, timelineMultiplier } =
    deriveAdjustments(params);
  const successProbability = Math.min(
    0.97,
    Math.max(0.45, profile.baseSuccess + urgencyFactor + complexityFactor)
  );

  const adjustedTimeline = Math.max(7, profile.baseTimeline * timelineMultiplier);

  return ok({
    service: profile.label,
    scenario: params.scenario || 'standard',
    region: params.region || 'Bali',
    successProbability: Number(successProbability.toFixed(2)),
    riskLevel,
    recommendedTimeline: timelineSummary(adjustedTimeline),
    checkpoints: profile.checkpoints,
    accelerators: profile.accelerators,
    blockers: profile.blockers,
    assumptions: [
      'Client provides complete documentation within 3 business days',
      'All government offices operate on standard schedule',
      'No unexpected regulatory changes during the process',
    ],
  });
}

export async function oracleAnalyze(params: OracleParams = {}) {
  if (process.env.BRIDGE_ORACLE_ENABLED === 'true') {
    if (bridged && (bridged as any).ok !== false) return bridged;
  }

  const service = resolveService(params.service);
  const profile = SERVICE_PROFILES[service];

  const { riskLevel } = deriveAdjustments(params);

  return ok({
    service: profile.label,
    riskLevel,
    focusAreas: [
      {
        area: 'Documentation',
        status: params.complexity === 'high' ? 'attention' : 'solid',
        insights: [
          'Verify notarisation and translations',
          'Double-check sponsor or shareholder KTP copies',
          'Prepare power of attorney drafts',
        ],
      },
      {
        area: 'Compliance',
        status: params.urgency === 'high' ? 'monitor' : 'stable',
        insights: [
          'Check outstanding tax obligations',
          'Validate previous reporting cycles',
          'Confirm validity of existing licenses',
        ],
      },
      {
        area: 'Stakeholders',
        status: 'monitor',
        insights: [
          'Align expectations on deliverables',
          'Identify internal decision makers',
          'Schedule weekly status checkpoints',
        ],
      },
    ],
    recommendations: [
      'Assign a dedicated project manager',
      'Enable shared workspace for document tracking',
      'Use bilingual communication templates',
    ],
    metrics: {
      estimatedManHours: service === 'company' ? 120 : service === 'visa' ? 45 : 80,
      coordinationLevel: service === 'company' || service === 'property' ? 'high' : 'medium',
      dependencyCount: profile.checkpoints.length,
    },
  });
}

export async function oraclePredict(params: OracleParams = {}) {
  if (process.env.BRIDGE_ORACLE_ENABLED === 'true') {
    if (bridged && (bridged as any).ok !== false) return bridged;
  }

  const service = resolveService(params.service);
  const profile = SERVICE_PROFILES[service];
  const { urgencyFactor, complexityFactor } = deriveAdjustments(params);

  const base = profile.baseTimeline;
  const adjusted = Math.max(7, base + base * (urgencyFactor + complexityFactor));

  const checkpoints = profile.checkpoints.map((name, idx) => ({
    phase: idx + 1,
    name,
    etaDays: Math.round((adjusted / profile.checkpoints.length) * (idx + 1)),
    onTrack: idx === 0 || urgencyFactor >= -0.05,
  }));

  return ok({
    service: profile.label,
    forecast: {
      totalDurationDays: Math.round(adjusted),
      completionWindow: timelineSummary(adjusted),
      projectedCompletionDate: new Date(Date.now() + adjusted * 24 * 60 * 60 * 1000).toISOString(),
    },
    successProbability: Number(
      Math.min(0.98, Math.max(0.5, profile.baseSuccess + urgencyFactor + complexityFactor)).toFixed(
        2
      )
    ),
    checkpoints,
    alerts: [
      urgencyFactor < 0 ? 'High urgency reduces review buffers' : null,
      complexityFactor < 0 ? 'Complex scope requires additional legal review' : null,
    ].filter(Boolean),
    nextSteps: [
      'Confirm stakeholder availability for weekly standups',
      'Upload all supporting documents to shared workspace',
      'Lock payment schedule aligned with critical milestones',
    ],
  });
}
