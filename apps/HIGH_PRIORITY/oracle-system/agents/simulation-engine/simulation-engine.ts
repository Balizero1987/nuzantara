/**
 * SIMULATION ENGINE
 * Multi-agent collaborative problem-solving system
 * Enables Oracle agents to simulate cases independently or collaboratively
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Agent Types
type OracleAgent = 'VISA_ORACLE' | 'KBLI_EYE' | 'TAX_GENIUS' | 'LEGAL_ARCHITECT' | 'MORGANA';
type CollaborationMode = 'solo' | 'duo' | 'trio' | 'quartet';
type Classification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';

// Interfaces
interface SimulationCase {
  id: string;
  description: string;
  entities: string[];
  objectives: string[];
  constraints: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

interface AgentAnalysis {
  agent: OracleAgent;
  analysis: string;
  recommendations: string[];
  requirements: string[];
  risks: string[];
  timeline: string;
  confidence: number;
  classification: Classification;
  timelineDays?: number;
  investmentEstimate?: number;
  obligations?: string[];
}

interface SimulationResult {
  caseId: string;
  mode: CollaborationMode;
  agents: OracleAgent[];
  individualAnalyses: AgentAnalysis[];
  integratedSolution: IntegratedSolution;
  conflicts: ConflictResolution[];
  contentOpportunities: ContentOpportunity[];
  classification: Classification;
  timestamp: Date;
}

interface IntegratedSolution {
  summary: string;
  steps: SolutionStep[];
  totalTimeline: string;
  totalInvestment: string;
  monthlyObligations: string[];
  successProbability: number;
  alternativePlans: AlternativePlan[];
}

interface SolutionStep {
  order: number;
  description: string;
  responsible: OracleAgent;
  duration: string;
  dependencies: number[];
  critical: boolean;
}

interface ConflictResolution {
  agents: OracleAgent[];
  issue: string;
  resolution: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface AlternativePlan {
  condition: string;
  solution: string;
  impact: string;
}

interface ContentOpportunity {
  type: 'immediate' | 'campaign' | 'educational' | 'case_study';
  title: string;
  angle: string;
  format: string[];
  viralPotential: number;
  timeline: string;
}

type VisaKnowledge = {
  visaTypes: Record<string, VisaType>;
  immigrationOffices?: Record<string, any>;
  processingTimes?: {
    current?: Record<string, string>;
  };
  commonIssues?: {
    rejections?: Array<{ reason: string; solution: string }>;
    delays?: Array<{ cause: string; prevention: string }>;
  };
};

type VisaType = {
  name: string;
  duration?: string;
  extensions?: string;
  totalStay?: string;
  requirements?: string[];
  processingTime?: {
    normal?: string;
    express?: string;
    total?: string;
  };
  cost?: Record<string, string>;
  allowedActivities?: string[];
  restrictions?: string[];
  tips?: string[];
  benefits?: string[];
  process?: string[];
};

type KbliKnowledge = {
  businessStructures?: Record<string, {
    name: string;
    minimumInvestment?: string;
    timeline?: Record<string, string>;
    advantages?: string[];
    restrictions?: string[];
  }>;
  kbliDatabase: {
    popularKBLI: Record<string, {
      title: string;
      category: string;
      foreignEligible: boolean;
      minimumInvestment?: string;
      licenses?: string[];
      description?: string;
      popularity?: string;
      tips?: string;
      warnings?: string[];
    }>;
  };
};

const VISA_TYPE_RULES: Array<{ regex: RegExp; type: string }> = [
  { regex: /(investor|pma|shareholder|capital)/i, type: 'KITAS_INVESTOR' },
  { regex: /(work|employee|hire|staff|salary)/i, type: 'KITAS_WORKING' },
  { regex: /(dependent|spouse|family|married)/i, type: 'FAMILY_KITAS' },
  { regex: /(retire|retirement|senior)/i, type: 'RETIREMENT' },
  { regex: /(student|study|school)/i, type: 'STUDENT_KITAS' },
  { regex: /(tourist|holiday|vacation|travel)/i, type: 'B211A' },
  { regex: /(business|meeting|conference|event|trade)/i, type: 'B211B' }
];

const KBLI_RULES: Array<{ regex: RegExp; code: string }> = [
  { regex: /(restaurant|cafe|food|culinary)/i, code: '56101' },
  { regex: /(bar|lounge|club)/i, code: '56301' },
  { regex: /(villa|accommodation|holiday rental)/i, code: '55104' },
  { regex: /(hotel|resort)/i, code: '55101' },
  { regex: /(marketing|advertising|agency)/i, code: '73100' },
  { regex: /(consulting|advisory|strategy)/i, code: '70209' },
  { regex: /(software|app|development|it|digital)/i, code: '62019' },
  { regex: /(tour|travel|tourism|operator)/i, code: '79120' },
  { regex: /(import|export|trading|wholesale)/i, code: '46100' },
  { regex: /(spa|wellness|salon)/i, code: '96122' },
  { regex: /(education|training|academy|course)/i, code: '85499' }
];

/**
 * Main Simulation Engine Class
 */
export class SimulationEngine {
  private gemini: any;
  private agentKnowledge: Map<OracleAgent, any>;
  private simulationHistory: SimulationResult[] = [];
  private visaKnowledge?: VisaKnowledge;
  private kbliKnowledge?: KbliKnowledge;
  private knowledgeBaseDir: string;

  constructor() {
    this.initializeAI();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.knowledgeBaseDir = path.resolve(__dirname, '../knowledge-bases');
    this.loadAgentKnowledge();
  }

  private initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  private loadAgentKnowledge() {
    this.agentKnowledge = new Map();

    // VISA ORACLE
    const visaKnowledge = this.safeLoadJson<VisaKnowledge>('visa-oracle-kb.json');
    if (visaKnowledge) {
      this.visaKnowledge = visaKnowledge;
      this.agentKnowledge.set('VISA_ORACLE', visaKnowledge);
    }

    // KBLI EYE
    const kbliKnowledge = this.safeLoadJson<KbliKnowledge>('kbli-eye-kb.json');
    if (kbliKnowledge) {
      this.kbliKnowledge = kbliKnowledge;
      this.agentKnowledge.set('KBLI_EYE', kbliKnowledge);
    }

    // Placeholder knowledge for other agents until dedicated knowledge bases are added
    this.agentKnowledge.set('TAX_GENIUS', { expertise: 'Tax optimization and compliance' });
    this.agentKnowledge.set('LEGAL_ARCHITECT', { expertise: 'Property law and structures' });
    this.agentKnowledge.set('MORGANA', { expertise: 'Content creation and viral marketing' });
  }

  private safeLoadJson<T>(fileName: string): T | undefined {
    try {
      const filePath = path.join(this.knowledgeBaseDir, fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`[SimulationEngine] Knowledge base not found: ${filePath}`);
        return undefined;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[SimulationEngine] Failed to load knowledge base ${fileName}:`, error);
      return undefined;
    }
  }

  private determineVisaType(description: string, knowledge: VisaKnowledge): string {
    for (const rule of VISA_TYPE_RULES) {
      if (rule.regex.test(description) && knowledge.visaTypes[rule.type]) {
        return rule.type;
      }
    }

    const fallbackKey = Object.keys(knowledge.visaTypes)[0];
    return knowledge.visaTypes['B211B'] ? 'B211B' : (fallbackKey || 'B211A');
  }

  private determineKbliCode(description: string, knowledge: KbliKnowledge): string {
    const popular = knowledge.kbliDatabase?.popularKBLI ?? {};

    for (const rule of KBLI_RULES) {
      if (rule.regex.test(description) && popular[rule.code]) {
        return rule.code;
      }
    }

    // Fallback to most popular code if no rule matches
    const defaults = ['70209', '62019', ...Object.keys(popular)];
    for (const code of defaults) {
      if (popular[code]) {
        return code;
      }
    }

    return Object.keys(popular)[0] ?? '70209';
  }

  private composeVisaTimeline(visaData: VisaType | undefined, knowledge: VisaKnowledge): string {
    if (!visaData) return 'Timeline unavailable';

    if (visaData.processingTime?.total) {
      return visaData.processingTime.total;
    }

    if (visaData.processingTime?.normal) {
      return `Processing ${visaData.processingTime.normal}`;
    }

    const name = visaData.name || 'visa';
    const fallback = knowledge.processingTimes?.current?.[name];
    return fallback ? `Processing ${fallback}` : 'Processing 2-3 weeks';
  }

  private estimateProcessingDays(visaData: VisaType | undefined): number | undefined {
    if (!visaData) return undefined;
    const duration = visaData.processingTime?.total || visaData.processingTime?.normal;
    return this.durationToDays(duration);
  }

  private collectVisaRisks(visaData: VisaType | undefined, knowledge: VisaKnowledge): string[] {
    const risks = new Set<string>();
    visaData?.restrictions?.forEach(risk => risks.add(risk));
    visaData?.tips?.slice(0, 2).forEach(tip => risks.add(`Tip: ${tip}`));

    const rejection = knowledge.commonIssues?.rejections?.[0];
    if (rejection) {
      risks.add(`${rejection.reason} – ${rejection.solution}`);
    }

    const delay = knowledge.commonIssues?.delays?.[0];
    if (delay) {
      risks.add(`${delay.cause} – prevention: ${delay.prevention}`);
    }

    return Array.from(risks).slice(0, 4);
  }

  private buildVisaRecommendations(visaData: VisaType | undefined, requirements: string[]): string[] {
    if (!visaData) {
      return ['Apply for recommended visa', 'Prepare supporting documents'];
    }

    const recs = new Set<string>();
    recs.add(`Apply for ${visaData.name}`);
    if (requirements.length > 0) {
      recs.add(`Prepare: ${requirements.slice(0, 2).join(', ')}`);
    }
    if (visaData.extensions) {
      recs.add(`Plan extensions: ${visaData.extensions}`);
    }
    if (visaData.process && visaData.process.length) {
      recs.add(visaData.process[0]);
    }

    return Array.from(recs);
  }

  private buildVisaObligations(visaKey: string): string[] {
    if (visaKey.includes('KITAS')) {
      return [
        'Report address and employment changes to immigration',
        'Schedule KITAS renewal before expiry',
        'Maintain health insurance coverage'
      ];
    }

    if (visaKey === 'B211B') {
      return [
        'Keep sponsor letter updated',
        'Request extension at least 7 days before expiry'
      ];
    }

    return ['Monitor visa validity and plan extensions as required'];
  }

  /**
   * Main simulation method
   */
  async simulateCase(input: string, mode?: CollaborationMode): Promise<SimulationResult> {
    // Step 1: Parse the case
    const simCase = await this.parseCase(input);

    // Step 2: Select agents
    const agents = this.selectAgents(simCase, mode);

    // Step 3: Run individual analyses
    const analyses = await this.runIndividualAnalyses(simCase, agents);

    // Step 4: Detect and resolve conflicts
    const conflicts = this.detectConflicts(analyses);

    // Step 5: Generate integrated solution
    const integrated = await this.generateIntegratedSolution(analyses, conflicts);

    // Step 6: Identify content opportunities (MORGANA)
    const content = await this.identifyContentOpportunities(simCase, integrated);

    // Step 7: Determine overall classification
    const classification = this.determineClassification(analyses);

    const result: SimulationResult = {
      caseId: simCase.id,
      mode: this.getMode(agents.length),
      agents,
      individualAnalyses: analyses,
      integratedSolution: integrated,
      conflicts,
      contentOpportunities: content,
      classification,
      timestamp: new Date()
    };

    // Store in history
    this.simulationHistory.push(result);

    return result;
  }

  /**
   * Parse case description into structured format
   */
  private async parseCase(input: string): Promise<SimulationCase> {
    const prompt = `
    Analyze this case and extract:
    1. Entities involved (person, company, nationality)
    2. Objectives (what they want to achieve)
    3. Constraints (budget, timeline, restrictions)
    4. Urgency level

    Case: "${input}"

    Return as JSON.
    `;

    try {
      const result = await this.gemini.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());

      return {
        id: `case_${Date.now()}`,
        description: input,
        entities: parsed.entities || [],
        objectives: parsed.objectives || [],
        constraints: parsed.constraints || [],
        urgency: parsed.urgency || 'medium',
        timestamp: new Date()
      };
    } catch (error) {
      // Fallback parsing
      return {
        id: `case_${Date.now()}`,
        description: input,
        entities: this.extractEntities(input),
        objectives: this.extractObjectives(input),
        constraints: [],
        urgency: 'medium',
        timestamp: new Date()
      };
    }
  }

  /**
   * Select appropriate agents based on case
   */
  private selectAgents(simCase: SimulationCase, mode?: CollaborationMode): OracleAgent[] {
    const agents: Set<OracleAgent> = new Set();

    const text = simCase.description.toLowerCase();

    // Auto-select based on keywords
    if (text.includes('visa') || text.includes('kitas') || text.includes('residence')) {
      agents.add('VISA_ORACLE');
    }

    if (text.includes('business') || text.includes('company') || text.includes('pt pma')) {
      agents.add('KBLI_EYE');
    }

    if (text.includes('tax') || text.includes('optimization') || text.includes('fiscal')) {
      agents.add('TAX_GENIUS');
    }

    if (text.includes('property') || text.includes('villa') || text.includes('land')) {
      agents.add('LEGAL_ARCHITECT');
    }

    // Override with specific mode if provided
    if (mode === 'quartet') {
      return ['VISA_ORACLE', 'KBLI_EYE', 'TAX_GENIUS', 'LEGAL_ARCHITECT'];
    }

    // Always include MORGANA for content opportunities
    if (agents.size > 0 && !agents.has('MORGANA')) {
      agents.add('MORGANA');
    }

    return Array.from(agents);
  }

  /**
   * Run individual agent analyses
   */
  private async runIndividualAnalyses(
    simCase: SimulationCase,
    agents: OracleAgent[]
  ): Promise<AgentAnalysis[]> {
    const analyses: AgentAnalysis[] = [];

    for (const agent of agents) {
      const analysis = await this.runAgentAnalysis(agent, simCase);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Individual agent analysis
   */
  private async runAgentAnalysis(
    agent: OracleAgent,
    simCase: SimulationCase
  ): Promise<AgentAnalysis> {
    const knowledge = this.agentKnowledge.get(agent);

    switch (agent) {
      case 'VISA_ORACLE':
        return this.runVisaAnalysis(simCase, knowledge);

      case 'KBLI_EYE':
        return this.runKbliAnalysis(simCase, knowledge);

      case 'TAX_GENIUS':
        return this.runTaxAnalysis(simCase, knowledge);

      case 'LEGAL_ARCHITECT':
        return this.runLegalAnalysis(simCase, knowledge);

      case 'MORGANA':
        return this.runContentAnalysis(simCase, knowledge);

      default:
        throw new Error(`Unknown agent: ${agent}`);
    }
  }

  /**
   * VISA ORACLE Analysis
   */
  private async runVisaAnalysis(
    simCase: SimulationCase,
    knowledge: any
  ): Promise<AgentAnalysis> {
    const visaKnowledge = (knowledge as VisaKnowledge) ?? this.visaKnowledge;

    if (visaKnowledge?.visaTypes) {
      const visaKey = this.determineVisaType(simCase.description, visaKnowledge);
      const visaData = visaKnowledge.visaTypes[visaKey] ?? Object.values(visaKnowledge.visaTypes)[0];

      const timeline = this.composeVisaTimeline(visaData, visaKnowledge);
      const timelineDays = this.durationToDays(timeline) ?? this.estimateProcessingDays(visaData);
      const requirements = (visaData.requirements ?? []).slice(0, 5);
      const risks = this.collectVisaRisks(visaData, visaKnowledge);
      const recommendations = this.buildVisaRecommendations(visaData, requirements);
      const obligations = this.buildVisaObligations(visaKey);

      const classification: Classification = visaKey.startsWith('KITAS') || visaKey.includes('KITAP')
        ? 'INTERNAL'
        : 'PUBLIC';

      return {
        agent: 'VISA_ORACLE',
        analysis: `Recommended visa: ${visaData?.name ?? visaKey}`,
        recommendations,
        requirements: requirements.length ? requirements : ['Follow current immigration checklist'],
        risks: risks.length ? risks : ['Processing delays during peak season'],
        timeline,
        confidence: 0.82,
        classification,
        timelineDays,
        obligations
      };
    }

    // Fallback when knowledge is unavailable
    return {
      agent: 'VISA_ORACLE',
      analysis: 'Recommended visa: B211B',
      recommendations: [
        'Apply for B211B business visa',
        'Prepare required documents',
        'Engage visa agent'
      ],
      requirements: [
        'Valid passport (6+ months)',
        'Sponsor letter',
        'Proof of funds'
      ],
      risks: [
        'Processing delays possible',
        'Document requirements may change'
      ],
      timeline: '2-3 months',
      confidence: 0.7,
      classification: 'PUBLIC'
    };
  }

  /**
   * KBLI EYE Analysis
   */
  private async runKbliAnalysis(
    simCase: SimulationCase,
    knowledge: any
  ): Promise<AgentAnalysis> {
    const kbliKnowledge = (knowledge as KbliKnowledge) ?? this.kbliKnowledge;

    if (kbliKnowledge?.kbliDatabase?.popularKBLI) {
      const popular = kbliKnowledge.kbliDatabase.popularKBLI;
      const code = this.determineKbliCode(simCase.description, kbliKnowledge);
      const kbliData = popular[code] ?? popular['70209'] ?? Object.values(popular)[0];
      const structure = kbliKnowledge.businessStructures?.PT_PMA ?? kbliKnowledge.businessStructures?.PTPMA;

      const investmentValue = this.parseInvestmentValue(kbliData?.minimumInvestment || structure?.minimumInvestment);
      const timeline = structure?.timeline?.total || '3-4 weeks';
      const timelineDays = this.durationToDays(timeline);
      const licenses = kbliData?.licenses ?? ['NIB'];

      const requirements = this.uniqueStrings([
        investmentValue ? `Minimum investment ${this.formatInvestment(investmentValue)}` : undefined,
        'Indonesian director and local office required',
        ...licenses.map(license => `Obtain ${license}`)
      ]).slice(0, 5);

      const risks = this.uniqueStrings([
        ...(kbliData?.warnings ?? []),
        ...(structure?.restrictions ?? []),
        'OSS system delays are common'
      ]).slice(0, 4);

      const recommendations = this.uniqueStrings([
        `Incorporate PT PMA for ${kbliData?.title ?? code}`,
        `Use KBLI ${code} (${kbliData?.title ?? 'business activity'})`,
        licenses.length ? `Prepare licenses: ${licenses.join(', ')}` : undefined,
        'Ensure OSS documentation is complete before submission'
      ]);

      const obligations = this.uniqueStrings([
        'Submit LKPM quarterly report',
        'Maintain bookkeeping for monthly tax filings',
        'Renew operational licenses annually'
      ]);

      const classification: Classification = kbliData?.foreignEligible === false ? 'INTERNAL' : 'PUBLIC';

      return {
        agent: 'KBLI_EYE',
        analysis: `Business classification: KBLI ${code} – ${kbliData?.title ?? 'unspecified'}`,
        recommendations,
        requirements: requirements.length ? requirements : ['Complete OSS requirements for chosen KBLI'],
        risks: risks.length ? risks : ['Monitor OSS announcements for regulatory updates'],
        timeline,
        confidence: 0.86,
        classification,
        timelineDays,
        investmentEstimate: investmentValue,
        obligations
      };
    }

    // Fallback when knowledge is unavailable
    return {
      agent: 'KBLI_EYE',
      analysis: 'Business classification: KBLI 70209',
      recommendations: [
        'Register PT PMA with 10B IDR',
        'Use KBLI 70209 (Consulting)',
        'Apply for licenses via OSS'
      ],
      requirements: [
        'Minimum investment 10B IDR',
        'Local director required',
        'Office address proof'
      ],
      risks: [
        'OSS system delays',
        'License approval timeline'
      ],
      timeline: '3-4 weeks',
      confidence: 0.75,
      classification: 'PUBLIC'
    };
  }

  /**
   * TAX GENIUS Analysis
   */
  private async runTaxAnalysis(
    simCase: SimulationCase,
    knowledge: any
  ): Promise<AgentAnalysis> {
    const analysis = 'Tax optimization strategy...';

    return {
      agent: 'TAX_GENIUS',
      analysis: 'Small business rate 0.5% applicable',
      recommendations: [
        'Register for small business tax',
        'Utilize treaty benefits',
        'Monthly VAT filing required'
      ],
      requirements: [
        'NPWP registration',
        'Monthly tax reporting',
        'Annual SPT filing'
      ],
      risks: [
        'Audit risk if ratios abnormal',
        'Transfer pricing scrutiny'
      ],
      timeline: 'Immediate upon operation',
      confidence: 0.88,
      classification: 'INTERNAL'
    };
  }

  /**
   * LEGAL ARCHITECT Analysis
   */
  private async runLegalAnalysis(
    simCase: SimulationCase,
    knowledge: any
  ): Promise<AgentAnalysis> {
    return {
      agent: 'LEGAL_ARCHITECT',
      analysis: 'Property via PT PMA with HGB rights',
      recommendations: [
        'Structure via PT PMA for property',
        'HGB for 30 years extendable',
        'Avoid nominee structures'
      ],
      requirements: [
        'PT PMA established first',
        'Due diligence on property',
        'Notary for transactions'
      ],
      risks: [
        'Zoning restrictions',
        'Title verification crucial'
      ],
      timeline: '2-3 months for property acquisition',
      confidence: 0.82,
      classification: 'INTERNAL'
    };
  }

  /**
   * MORGANA Content Analysis
   */
  private async runContentAnalysis(
    simCase: SimulationCase,
    knowledge: any
  ): Promise<AgentAnalysis> {
    return {
      agent: 'MORGANA',
      analysis: 'High content potential identified',
      recommendations: [
        'Create success story content',
        'Develop educational series',
        'Launch social campaign'
      ],
      requirements: [
        'Client consent for story',
        'Professional photography',
        'Multi-language content'
      ],
      risks: [
        'Client privacy concerns',
        'Competitor copying'
      ],
      timeline: 'Content ready in 1 week',
      confidence: 0.95,
      classification: 'PUBLIC'
    };
  }

  /**
   * Detect conflicts between agent recommendations
   */
  private detectConflicts(analyses: AgentAnalysis[]): ConflictResolution[] {
    const conflicts: ConflictResolution[] = [];

    // Check for timing conflicts
    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        const a1 = analyses[i];
        const a2 = analyses[j];

        // Example: Check if timelines conflict
        if (a1.timeline !== a2.timeline && this.timelinesConflict(a1, a2)) {
          conflicts.push({
            agents: [a1.agent, a2.agent],
            issue: 'Timeline mismatch',
            resolution: 'Adjust to longest timeline',
            riskLevel: 'medium'
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Generate integrated solution from all analyses
   */
  private async generateIntegratedSolution(
    analyses: AgentAnalysis[],
    conflicts: ConflictResolution[]
  ): Promise<IntegratedSolution> {
    // Combine all recommendations into steps
    const steps: SolutionStep[] = [];
    let stepOrder = 1;

    // Visa first
    const visaAnalysis = analyses.find(a => a.agent === 'VISA_ORACLE');
    if (visaAnalysis) {
      steps.push({
        order: stepOrder++,
        description: visaAnalysis.recommendations[0],
        responsible: 'VISA_ORACLE',
        duration: '2 weeks',
        dependencies: [],
        critical: true
      });
    }

    // Business setup
    const kbliAnalysis = analyses.find(a => a.agent === 'KBLI_EYE');
    if (kbliAnalysis) {
      steps.push({
        order: stepOrder++,
        description: kbliAnalysis.recommendations[0],
        responsible: 'KBLI_EYE',
        duration: '4 weeks',
        dependencies: visaAnalysis ? [1] : [],
        critical: true
      });
    }

    // Calculate totals
    const totalTimeline = this.calculateTotalTimeline(analyses);
    const totalInvestment = this.calculateInvestment(analyses);
    const monthlyObligations = this.extractMonthlyObligations(analyses);

    return {
      summary: 'Integrated solution for ' + analyses[0]?.analysis,
      steps,
      totalTimeline,
      totalInvestment,
      monthlyObligations,
      successProbability: this.calculateSuccessProbability(analyses),
      alternativePlans: this.generateAlternatives(analyses)
    };
  }

  /**
   * Identify content opportunities for MORGANA
   */
  private async identifyContentOpportunities(
    simCase: SimulationCase,
    solution: IntegratedSolution
  ): Promise<ContentOpportunity[]> {
    const opportunities: ContentOpportunity[] = [];

    // Immediate news opportunity
    if (simCase.urgency === 'high' || simCase.urgency === 'critical') {
      opportunities.push({
        type: 'immediate',
        title: 'Breaking: New Business Opportunity in Bali',
        angle: 'Time-sensitive opportunity',
        format: ['social', 'email'],
        viralPotential: 0.7,
        timeline: 'Today'
      });
    }

    // Educational content
    opportunities.push({
      type: 'educational',
      title: 'Complete Guide: ' + simCase.objectives[0],
      angle: 'Step-by-step tutorial',
      format: ['blog', 'video', 'infographic'],
      viralPotential: 0.6,
      timeline: 'This week'
    });

    // Case study
    if (solution.successProbability > 0.8) {
      opportunities.push({
        type: 'case_study',
        title: 'Success Story: From Idea to Reality',
        angle: 'Inspirational journey',
        format: ['blog', 'video series'],
        viralPotential: 0.8,
        timeline: 'After completion'
      });
    }

    return opportunities;
  }

  /**
   * Determine overall classification
   */
  private determineClassification(analyses: AgentAnalysis[]): Classification {
    // Most restrictive classification wins
    if (analyses.some(a => a.classification === 'CONFIDENTIAL')) {
      return 'CONFIDENTIAL';
    }
    if (analyses.some(a => a.classification === 'INTERNAL')) {
      return 'INTERNAL';
    }
    return 'PUBLIC';
  }

  // Helper methods
  private getMode(agentCount: number): CollaborationMode {
    switch (agentCount) {
      case 1: return 'solo';
      case 2: return 'duo';
      case 3: return 'trio';
      default: return 'quartet';
    }
  }

  private extractEntities(input: string): string[] {
    // Simple entity extraction
    const entities = [];
    if (input.match(/american|italian|french|german/i)) {
      entities.push('Foreign national');
    }
    if (input.match(/company|business|pt|pma/i)) {
      entities.push('Business entity');
    }
    return entities;
  }

  private extractObjectives(input: string): string[] {
    const objectives = [];
    if (input.includes('restaurant')) objectives.push('Open restaurant');
    if (input.includes('visa')) objectives.push('Obtain visa');
    if (input.includes('property')) objectives.push('Acquire property');
    return objectives;
  }

  private timelinesConflict(a1: AgentAnalysis, a2: AgentAnalysis): boolean {
    // Simple conflict detection
    return false; // Implement actual logic
  }

  private calculateTotalTimeline(analyses: AgentAnalysis[]): string {
    const values = analyses
      .map(analysis => analysis.timelineDays ?? this.durationToDays(analysis.timeline))
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value) && value > 0);

    if (!values.length) {
      return 'Timeline unavailable';
    }

    const maxDays = Math.max(...values);
    if (maxDays < 30) {
      return `${Math.round(maxDays)} days total`;
    }

    const months = maxDays / 30;
    return `${months.toFixed(1).replace(/\.0$/, '')} months total`;
  }

  private calculateInvestment(analyses: AgentAnalysis[]): string {
    const investments = analyses
      .map(a => a.investmentEstimate)
      .filter((value): value is number => typeof value === 'number' && value > 0);

    if (!investments.length) {
      return 'Investment TBD';
    }

    const maxInvestment = Math.max(...investments);
    return this.formatInvestment(maxInvestment);
  }

  private extractMonthlyObligations(analyses: AgentAnalysis[]): string[] {
    const obligations = this.uniqueStrings(
      analyses.flatMap(analysis => analysis.obligations ?? [])
    );

    if (obligations.length) {
      return obligations;
    }

    return ['Maintain bookkeeping', 'Monitor compliance deadlines'];
  }

  private calculateSuccessProbability(analyses: AgentAnalysis[]): number {
    const avg = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    return Math.round(avg * 100) / 100;
  }

  private generateAlternatives(analyses: AgentAnalysis[]): AlternativePlan[] {
    return [
      {
        condition: 'If visa delayed',
        solution: 'Use business visa temporarily',
        impact: 'Can start operations'
      },
      {
        condition: 'If investment threshold increases',
        solution: 'Partner with local investor',
        impact: 'Reduces capital requirement'
      }
    ];
  }

  private durationToDays(duration?: string): number | undefined {
    if (!duration) return undefined;
    const match = duration.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*(day|week|month|year)/i);
    if (!match) return undefined;

    const start = parseFloat(match[1]);
    const end = match[2] ? parseFloat(match[2]) : start;
    const average = (start + end) / 2;
    const unit = match[3].toLowerCase();

    switch (unit) {
      case 'day':
      case 'days':
        return average;
      case 'week':
      case 'weeks':
        return average * 7;
      case 'month':
      case 'months':
        return average * 30;
      case 'year':
      case 'years':
        return average * 365;
      default:
        return undefined;
    }
  }

  private parseInvestmentValue(value?: string): number | undefined {
    if (!value) return undefined;
    const normalized = value.replace(/[, ]/g, '').toUpperCase();

    const match = normalized.match(/(\d+(?:\.\d+)?)([KMB]?)/);
    if (!match) return undefined;

    const amount = parseFloat(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'K':
        return amount * 1_000;
      case 'M':
        return amount * 1_000_000;
      case 'B':
        return amount * 1_000_000_000;
      default:
        return amount;
    }
  }

  private formatInvestment(amount: number): string {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B IDR`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M IDR`;
    }
    return `${Math.round(amount)} IDR`;
  }

  private uniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
  }

  /**
   * Get simulation history
   */
  getHistory(): SimulationResult[] {
    return this.simulationHistory;
  }

  /**
   * Learn from simulations
   */
  async learnFromHistory(): Promise<any> {
    // Analyze patterns in simulation history
    const patterns = {
      commonCases: this.identifyCommonCases(),
      successFactors: this.identifySuccessFactors(),
      riskPatterns: this.identifyRiskPatterns()
    };

    return patterns;
  }

  private identifyCommonCases(): any {
    // Group similar cases
    return {};
  }

  private identifySuccessFactors(): any {
    // Find what leads to high success probability
    return {};
  }

  private identifyRiskPatterns(): any {
    // Identify recurring risks
    return {};
  }
}

// Export for use in handlers
const sharedSimulationEngine = new SimulationEngine();

export async function runSimulation(input: string, mode?: CollaborationMode): Promise<SimulationResult> {
  return await sharedSimulationEngine.simulateCase(input, mode);
}

export { sharedSimulationEngine as simulationEngine };

// Handler integration
export async function handleSimulationQuery(params: any): Promise<any> {
  if (!params.case) {
    return { error: 'Please provide a case description' };
  }

  const result = await runSimulation(params.case, params.mode);

  // Format for response
  return {
    success: true,
    simulation: {
      case: params.case,
      solution: result.integratedSolution.summary,
      steps: result.integratedSolution.steps,
      timeline: result.integratedSolution.totalTimeline,
      investment: result.integratedSolution.totalInvestment,
      confidence: result.integratedSolution.successProbability,
      agents: result.agents,
      classification: result.classification
    }
  };
}
