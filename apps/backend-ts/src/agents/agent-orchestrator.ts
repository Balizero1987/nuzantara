/**
 * ZANTARA Agent Orchestrator
 * Coordinates all AI agents and manages their execution
 */

import { OpenRouterClient } from './clients/openrouter.client.js';
import { DeepSeekClient } from './clients/deepseek.client.js';
import type { AgentTask, AgentType, AgentExecutionContext } from './types/agent.types.js';

export class AgentOrchestrator {
  private openRouter: OpenRouterClient;
  private deepseek: DeepSeekClient;
  private tasks: Map<string, AgentTask> = new Map();

  constructor(config: {
    openRouterApiKey: string;
    deepseekApiKey: string;
  }) {
    this.openRouter = new OpenRouterClient({ apiKey: config.openRouterApiKey, model: '' });
    this.deepseek = new DeepSeekClient({ apiKey: config.deepseekApiKey, model: '' });
  }

  /**
   * Submit a new agent task
   */
  async submitTask(
    type: AgentType,
    request: any,
    context: AgentExecutionContext
  ): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: AgentTask = {
      id: taskId,
      type,
      request,
      context,
      status: 'pending',
      startTime: new Date()
    };

    this.tasks.set(taskId, task);

    // Execute task asynchronously
    this.executeTask(taskId).catch(error => {
      console.error(`Task ${taskId} failed:`, error);
      const failedTask = this.tasks.get(taskId);
      if (failedTask) {
        failedTask.status = 'failed';
        failedTask.error = error.message;
        failedTask.endTime = new Date();
      }
    });

    return taskId;
  }

  /**
   * Get task status and result
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Execute an agent task
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = 'running';

    try {
      let result: any;

      switch (task.type) {
        case 'endpoint-generator':
          result = await this.executeEndpointGenerator(task.request);
          break;
        case 'memory-integrator':
          result = await this.executeMemoryIntegrator(task.request);
          break;
        case 'self-healing':
          result = await this.executeSelfHealing(task.request);
          break;
        case 'test-writer':
          result = await this.executeTestWriter(task.request);
          break;
        case 'pr-agent':
          result = await this.executePRAgent(task.request);
          break;
        default:
          throw new Error(`Unknown agent type: ${task.type}`);
      }

      task.result = result;
      task.status = 'completed';
      task.endTime = new Date();
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = new Date();
      throw error;
    }
  }

  /**
   * Placeholder implementations - will be replaced by actual agents
   */
  private async executeEndpointGenerator(request: any): Promise<any> {
    // Import and execute EndpointGenerator
    const { EndpointGenerator } = await import('./endpoint-generator.js');
    const generator = new EndpointGenerator(this.openRouter, this.deepseek);
    return generator.generate(request);
  }

  private async executeMemoryIntegrator(request: any): Promise<any> {
    const { MemoryIntegrator } = await import('./memory-integrator.js');
    const integrator = new MemoryIntegrator(this.deepseek);
    return integrator.integrate(request);
  }

  private async executeSelfHealing(request: any): Promise<any> {
    const { SelfHealingAgent } = await import('./self-healing.js');
    const healer = new SelfHealingAgent(this.deepseek);
    return healer.heal(request);
  }

  private async executeTestWriter(request: any): Promise<any> {
    const { TestWriter } = await import('./test-writer.js');
    const writer = new TestWriter(this.openRouter);
    return writer.generateTests(request);
  }

  private async executePRAgent(request: any): Promise<any> {
    const { PRAgent } = await import('./pr-agent.js');
    const agent = new PRAgent(this.openRouter, this.deepseek);
    return agent.createPR(request);
  }

  /**
   * Get all tasks (for monitoring)
   */
  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Clear completed tasks older than 24h
   */
  cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const entries = Array.from(this.tasks.entries());
    for (const [taskId, task] of entries) {
      if (
        task.status === 'completed' &&
        task.endTime &&
        task.endTime.getTime() < cutoff
      ) {
        this.tasks.delete(taskId);
      }
    }
  }
}
