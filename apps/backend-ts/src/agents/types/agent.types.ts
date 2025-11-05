/**
 * ZANTARA AGENTIC SYSTEM - Core Types
 * Defines interfaces for all AI agents
 */

export interface AgentConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface CodeGenerationRequest {
  description: string;
  type: 'endpoint' | 'handler' | 'test' | 'type' | 'migration';
  context?: {
    existingCode?: string;
    relatedFiles?: string[];
    dependencies?: string[];
  };
}

export interface CodeGenerationResult {
  code: string;
  filePath: string;
  language: 'typescript' | 'python' | 'sql';
  dependencies?: string[];
  tests?: string;
}

export interface MemoryIntegrationRequest {
  handlerPath: string;
  sessionIdField: string;
  userIdField: string;
}

export interface MemoryIntegrationResult {
  modifiedCode: string;
  changes: string[];
  success: boolean;
}

export interface ErrorAnalysis {
  errorType: string;
  stackTrace: string;
  context: Record<string, any>;
  logs?: string[];
}

export interface ErrorFixResult {
  fixCode: string;
  explanation: string;
  confidence: number;
  testCode?: string;
}

export interface TestGenerationRequest {
  sourceCode: string;
  filePath: string;
  testType: 'unit' | 'integration' | 'e2e';
}

export interface TestGenerationResult {
  testCode: string;
  testFilePath: string;
  coverage: {
    functions: number;
    branches: number;
    lines: number;
  };
}

export interface PRRequest {
  branchName: string;
  title: string;
  description: string;
  files: Array<{
    path: string;
    content: string;
    action: 'create' | 'modify' | 'delete';
  }>;
  reviewers?: string[];
}

export interface PRResult {
  prNumber: number;
  url: string;
  status: 'created' | 'failed';
}

export interface AgentExecutionContext {
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type AgentType =
  | 'endpoint-generator'
  | 'memory-integrator'
  | 'self-healing'
  | 'test-writer'
  | 'pr-agent';

export interface AgentTask {
  id: string;
  type: AgentType;
  request: any;
  context: AgentExecutionContext;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}
