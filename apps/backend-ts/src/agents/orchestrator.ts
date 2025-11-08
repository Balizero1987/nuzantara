/**
 * 🎭 MULTI-AGENT ORCHESTRATOR
 * Coordinates all autonomous agents and decides when to run them
 */

import { logger } from '../logging/unified-logger.js';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../services/connection-pool.js';

interface AgentTask {
  id: string;
  name: string;
  description: string;
  priority: number; // 1-10
  estimatedDuration: number; // minutes
  dependencies: string[]; // Other task IDs
  schedule: string; // cron expression
  enabled: boolean;
  lastRun?: Date;
  lastStatus?: 'success' | 'failure' | 'running';
  runCount: number;
  avgDuration: number;
}

interface ExecutionPlan {
  tasks: AgentTask[];
  totalEstimatedDuration: number;
  executionOrder: string[];
  reasoning: string;
}

export class AgentOrchestrator {
  private anthropic: Anthropic;
  private agents: Map<string, AgentTask>;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    this.agents = new Map();
    this.registerAgents();
  }

  /**
   * Register all available agents
   */
  private registerAgents(): void {
    const agents: AgentTask[] = [
      {
        id: 'conversation_trainer',
        name: 'Conversation Quality Trainer',
        description: 'Learns from successful conversations and improves prompts',
        priority: 8,
        estimatedDuration: 15,
        dependencies: [],
        schedule: '0 4 * * 0', // Weekly Sunday 4 AM
        enabled: true,
        runCount: 0,
        avgDuration: 15,
      },
      {
        id: 'client_value_predictor',
        name: 'Client LTV Predictor & Nurturer',
        description: 'Predicts client value and sends personalized nurturing messages',
        priority: 9,
        estimatedDuration: 10,
        dependencies: [],
        schedule: '0 10 * * *', // Daily 10 AM
        enabled: true,
        runCount: 0,
        avgDuration: 10,
      },
      {
        id: 'knowledge_graph_builder',
        name: 'Knowledge Graph Builder',
        description: 'Extracts entities and relationships from all data sources',
        priority: 7,
        estimatedDuration: 30,
        dependencies: [],
        schedule: '0 4 * * *', // Daily 4 AM
        enabled: true,
        runCount: 0,
        avgDuration: 30,
      },
      {
        id: 'performance_optimizer',
        name: 'Performance Auto-Optimizer',
        description: 'Monitors and optimizes system performance',
        priority: 8,
        estimatedDuration: 20,
        dependencies: [],
        schedule: '0 */6 * * *', // Every 6 hours
        enabled: true,
        runCount: 0,
        avgDuration: 20,
      },
      {
        id: 'security_scanner',
        name: 'Security Vulnerability Scanner',
        description: 'Scans for security issues and creates fixes',
        priority: 10,
        estimatedDuration: 25,
        dependencies: [],
        schedule: '0 2 * * *', // Daily 2 AM
        enabled: true,
        runCount: 0,
        avgDuration: 25,
      },
      {
        id: 'analytics_predictor',
        name: 'Predictive Analytics Engine',
        description: 'Predicts trends and anomalies in business metrics',
        priority: 6,
        estimatedDuration: 15,
        dependencies: ['knowledge_graph_builder'],
        schedule: '0 9 * * *', // Daily 9 AM
        enabled: true,
        runCount: 0,
        avgDuration: 15,
      },
      {
        id: 'auto_tester',
        name: 'Autonomous Test Generator',
        description: 'Generates and runs tests for new code',
        priority: 7,
        estimatedDuration: 20,
        dependencies: [],
        schedule: '0 3 * * *', // Daily 3 AM
        enabled: true,
        runCount: 0,
        avgDuration: 20,
      },
      {
        id: 'doc_generator',
        name: 'Documentation Auto-Generator',
        description: 'Generates and updates documentation from code',
        priority: 5,
        estimatedDuration: 10,
        dependencies: [],
        schedule: '0 5 * * 0', // Weekly Sunday 5 AM
        enabled: true,
        runCount: 0,
        avgDuration: 10,
      },
    ];

    agents.forEach(agent => this.agents.set(agent.id, agent));
    logger.info(`Registered ${agents.length} autonomous agents`);
  }

  /**
   * Analyze current system state and decide which agents to run
   */
  async analyzeSystemState(): Promise<any> {
    // Collect system metrics
    const metrics = {
      // Performance
      avgResponseTime: await this.getAvgResponseTime(),
      errorRate: await this.getErrorRate(),

      // Business
      newClientsToday: await this.getNewClientsCount(),
      highRiskClients: await this.getHighRiskClientsCount(),
      pendingPractices: await this.getPendingPracticesCount(),

      // Data
      conversationsToday: await this.getConversationsCount(),
      lowRatingConversations: await this.getLowRatingConversationsCount(),

      // Security
      failedLogins: await this.getFailedLoginsCount(),
      suspiciousActivity: await this.getSuspiciousActivityCount(),

      // Code
      untestedFunctions: await this.getUntestedFunctionsCount(),
      outdatedDocs: await this.getOutdatedDocsCount(),
    };

    return metrics;
  }

  /**
   * Use Claude to create intelligent execution plan
   */
  async createExecutionPlan(metrics: any): Promise<ExecutionPlan> {
    const agentDescriptions = Array.from(this.agents.values()).map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      priority: a.priority,
      estimatedDuration: a.estimatedDuration,
      dependencies: a.dependencies,
      lastRun: a.lastRun,
      lastStatus: a.lastStatus,
    }));

    const prompt = `You are an intelligent agent orchestrator. Based on current system metrics, decide which agents should run NOW.

**Current System Metrics:**
${JSON.stringify(metrics, null, 2)}

**Available Agents:**
${JSON.stringify(agentDescriptions, null, 2)}

**Decision Criteria:**
1. Run critical agents (priority 9-10) if any issues detected
2. Respect dependencies (run parent tasks first)
3. Avoid running agents that just ran recently (< 1 hour ago)
4. Consider time of day (avoid heavy tasks during peak hours 9-17)
5. Balance load (max 3 concurrent agents)

**Output Format:**
{
  "agents_to_run": ["agent_id1", "agent_id2"],
  "execution_order": ["agent_id1", "agent_id2"],
  "reasoning": "Why these agents now",
  "skip_reason": {
    "agent_id3": "Reason for skipping"
  }
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const decision = jsonMatch ? JSON.parse(jsonMatch[0]) : { agents_to_run: [], execution_order: [], reasoning: '' };

      const tasks = decision.agents_to_run.map((id: string) => this.agents.get(id)!).filter(Boolean);

      return {
        tasks,
        totalEstimatedDuration: tasks.reduce((sum, t) => sum + t.estimatedDuration, 0),
        executionOrder: decision.execution_order,
        reasoning: decision.reasoning,
      };
    } catch (error) {
      logger.error('Error parsing execution plan', { error, text });
      return {
        tasks: [],
        totalEstimatedDuration: 0,
        executionOrder: [],
        reasoning: 'Failed to parse plan',
      };
    }
  }

  /**
   * Execute agents according to plan
   */
  async executeAgents(plan: ExecutionPlan): Promise<void> {
    logger.info('🎭 Executing agent orchestration plan', {
      agentCount: plan.tasks.length,
      estimatedDuration: plan.totalEstimatedDuration,
      reasoning: plan.reasoning,
    });

    for (const taskId of plan.executionOrder) {
      const task = this.agents.get(taskId);
      if (!task) continue;

      try {
        logger.info(`▶️ Starting agent: ${task.name}`);
        const startTime = Date.now();

        // Update status
        task.lastStatus = 'running';
        task.lastRun = new Date();

        // Execute agent
        await this.runAgent(taskId);

        // Update metrics
        const duration = (Date.now() - startTime) / 1000 / 60; // minutes
        task.avgDuration = (task.avgDuration * task.runCount + duration) / (task.runCount + 1);
        task.runCount++;
        task.lastStatus = 'success';

        logger.info(`✅ Completed agent: ${task.name}`, { duration: `${duration.toFixed(2)}min` });
      } catch (error) {
        task!.lastStatus = 'failure';
        logger.error(`❌ Agent failed: ${task.name}`, { error });

        // Send alert for critical failures
        if (task.priority >= 9) {
          await this.sendAlert(`Critical agent failed: ${task.name}`, error);
        }
      }
    }

    logger.info('🎭 Agent orchestration complete');
  }

  /**
   * Run specific agent
   */
  private async runAgent(agentId: string): Promise<void> {
    switch (agentId) {
      case 'conversation_trainer':
        const { ConversationTrainer } = await import('../../backend-rag/backend/agents/conversation_trainer.py');
        // await new ConversationTrainer().run();
        break;

      case 'client_value_predictor':
        const { ClientValuePredictor } = await import('../../backend-rag/backend/agents/client_value_predictor.py');
        // await new ClientValuePredictor().run_daily_nurturing();
        break;

      case 'knowledge_graph_builder':
        const { KnowledgeGraphBuilder } = await import('../../backend-rag/backend/agents/knowledge_graph_builder.py');
        // await new KnowledgeGraphBuilder().build_graph_from_all_conversations();
        break;

      case 'performance_optimizer':
        const { PerformanceOptimizer } = await import('./performance-optimizer.js');
        await new PerformanceOptimizer().runOptimizationCycle();
        break;

      // Add other agents...
      default:
        logger.warn(`Unknown agent: ${agentId}`);
    }
  }

  /**
   * Send alert for critical issues
   */
  private async sendAlert(message: string, error: any): Promise<void> {
    if (process.env.SLACK_WEBHOOK_URL) {
      const fetch = (await import('node-fetch')).default;
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 CRITICAL ALERT\n\n${message}\n\nError: ${error?.message || error}`,
        }),
      });
    }
  }

  /**
   * Main orchestration loop
   */
  async orchestrate(): Promise<void> {
    try {
      // 1. Analyze system state
      const metrics = await this.analyzeSystemState();

      // 2. Create intelligent execution plan
      const plan = await this.createExecutionPlan(metrics);

      if (plan.tasks.length === 0) {
        logger.info('No agents scheduled to run at this time');
        return;
      }

      // 3. Execute agents
      await this.executeAgents(plan);

      // 4. Generate report
      await this.generateReport(metrics, plan);
    } catch (error) {
      logger.error('Orchestration failed', { error });
      throw error;
    }
  }

  /**
   * Generate orchestration report
   */
  private async generateReport(metrics: any, plan: ExecutionPlan): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      plan: {
        agentsRun: plan.tasks.map(t => t.name),
        totalDuration: plan.totalEstimatedDuration,
        reasoning: plan.reasoning,
      },
      results: Array.from(this.agents.values())
        .filter(a => a.lastRun && a.lastRun > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .map(a => ({
          name: a.name,
          status: a.lastStatus,
          duration: a.avgDuration,
          lastRun: a.lastRun,
        })),
    };

    logger.info('📊 Orchestration Report', report);

    // Store in database for analytics
    await db.query(`
      INSERT INTO agent_orchestration_reports (report_data, created_at)
      VALUES ($1, NOW())
    `, [JSON.stringify(report)]);
  }

  // Metric getters
  private async getAvgResponseTime(): Promise<number> {
    const result = await db.query('SELECT AVG(response_time_ms) as avg FROM api_request_logs WHERE timestamp >= NOW() - INTERVAL \'1 hour\'');
    return result.rows[0]?.avg || 0;
  }

  private async getErrorRate(): Promise<number> {
    const result = await db.query('SELECT AVG(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as rate FROM api_request_logs WHERE timestamp >= NOW() - INTERVAL \'1 hour\'');
    return result.rows[0]?.rate || 0;
  }

  private async getNewClientsCount(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) as count FROM crm_clients WHERE created_at >= CURRENT_DATE');
    return parseInt(result.rows[0]?.count || '0');
  }

  private async getHighRiskClientsCount(): Promise<number> {
    const result = await db.query("SELECT COUNT(*) as count FROM crm_clients WHERE metadata->>'risk_level' = 'HIGH_RISK'");
    return parseInt(result.rows[0]?.count || '0');
  }

  private async getPendingPracticesCount(): Promise<number> {
    const result = await db.query("SELECT COUNT(*) as count FROM crm_practices WHERE status = 'pending'");
    return parseInt(result.rows[0]?.count || '0');
  }

  private async getConversationsCount(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) as count FROM conversations WHERE created_at >= CURRENT_DATE');
    return parseInt(result.rows[0]?.count || '0');
  }

  private async getLowRatingConversationsCount(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) as count FROM conversations WHERE rating < 3 AND created_at >= CURRENT_DATE');
    return parseInt(result.rows[0]?.count || '0');
  }

  private async getFailedLoginsCount(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) as count FROM auth_logs WHERE success = false AND created_at >= NOW() - INTERVAL \'24 hours\'');
    return parseInt(result.rows[0]?.count || '0');
  }

  private async getSuspiciousActivityCount(): Promise<number> {
    // Implement based on your security logging
    return 0;
  }

  private async getUntestedFunctionsCount(): Promise<number> {
    // Implement based on code coverage
    return 0;
  }

  private async getOutdatedDocsCount(): Promise<number> {
    // Implement based on doc freshness
    return 0;
  }
}

// Cron entry - runs every hour and decides what to do
// CRON_ORCHESTRATOR="0 * * * *"  // Hourly
