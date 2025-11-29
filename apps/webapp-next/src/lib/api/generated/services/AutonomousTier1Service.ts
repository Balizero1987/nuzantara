/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentExecutionResponse } from '../models/AgentExecutionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AutonomousTier1Service {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Run Conversation Trainer
     * 🤖 Run Conversation Quality Trainer Agent
     *
     * Analyzes high-rated conversations and generates prompt improvements
     *
     * Args:
     * days_back: Number of days to look back for conversations (default: 7)
     *
     * Returns:
     * Execution status (agent runs in background)
     * @returns AgentExecutionResponse Successful Response
     * @throws ApiError
     */
    public runConversationTrainerApiAutonomousAgentsConversationTrainerRunPost({
        daysBack = 7,
    }: {
        daysBack?: number,
    }): CancelablePromise<AgentExecutionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/autonomous-agents/conversation-trainer/run',
            query: {
                'days_back': daysBack,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run Client Value Predictor
     * 💰 Run Client LTV Predictor & Nurturing Agent
     *
     * Scores all clients and sends personalized nurturing messages to:
     * - VIP clients (LTV > 80)
     * - High-risk clients (LTV < 30 and inactive > 30 days)
     *
     * Returns:
     * Execution status (agent runs in background)
     * @returns AgentExecutionResponse Successful Response
     * @throws ApiError
     */
    public runClientValuePredictorApiAutonomousAgentsClientValuePredictorRunPost(): CancelablePromise<AgentExecutionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/autonomous-agents/client-value-predictor/run',
        });
    }
    /**
     * Run Knowledge Graph Builder
     * 🕸️ Run Knowledge Graph Builder Agent
     *
     * Extracts entities and relationships from conversations and builds knowledge graph
     *
     * Args:
     * days_back: Number of days to look back for conversations (default: 30)
     * init_schema: Initialize database schema (default: False)
     *
     * Returns:
     * Execution status (agent runs in background)
     * @returns AgentExecutionResponse Successful Response
     * @throws ApiError
     */
    public runKnowledgeGraphBuilderApiAutonomousAgentsKnowledgeGraphBuilderRunPost({
        daysBack = 30,
        initSchema = false,
    }: {
        daysBack?: number,
        initSchema?: boolean,
    }): CancelablePromise<AgentExecutionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/autonomous-agents/knowledge-graph-builder/run',
            query: {
                'days_back': daysBack,
                'init_schema': initSchema,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Autonomous Agents Status
     * Get status of all Tier 1 autonomous agents
     *
     * Returns:
     * Agent capabilities and recent executions
     * @returns any Successful Response
     * @throws ApiError
     */
    public getAutonomousAgentsStatusApiAutonomousAgentsStatusGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/autonomous-agents/status',
        });
    }
    /**
     * Get Execution Status
     * Get status of a specific agent execution
     *
     * Args:
     * execution_id: Execution ID returned by agent run endpoint
     *
     * Returns:
     * Execution details and result
     * @returns AgentExecutionResponse Successful Response
     * @throws ApiError
     */
    public getExecutionStatusApiAutonomousAgentsExecutionsExecutionIdGet({
        executionId,
    }: {
        executionId: string,
    }): CancelablePromise<AgentExecutionResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/autonomous-agents/executions/{execution_id}',
            path: {
                'execution_id': executionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Executions
     * List recent agent executions
     *
     * Args:
     * limit: Maximum number of executions to return (default: 20)
     *
     * Returns:
     * List of recent executions
     * @returns any Successful Response
     * @throws ApiError
     */
    public listExecutionsApiAutonomousAgentsExecutionsGet({
        limit = 20,
    }: {
        limit?: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/autonomous-agents/executions',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
