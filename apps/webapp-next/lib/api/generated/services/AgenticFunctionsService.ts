/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddComplianceItemRequest } from '../models/AddComplianceItemRequest';
import type { CreateJourneyRequest } from '../models/CreateJourneyRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AgenticFunctionsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Agents Status
     * Get status of all 10 agentic functions
     *
     * Returns:
     * Overall system status and capabilities
     *
     * Performance: Cached for 5 minutes (90% faster on cache hit)
     * @returns any Successful Response
     * @throws ApiError
     */
    public getAgentsStatusApiAgentsStatusGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agents/status',
        });
    }
    /**
     * Create Client Journey
     * 🎯 AGENT 1: Client Journey Orchestrator
     *
     * Create a new multi-step client journey with automatic progress tracking
     *
     * Example journeys:
     * - pt_pma_setup: Complete PT PMA company setup (7 steps)
     * - kitas_application: KITAS visa application (5 steps)
     * - property_purchase: Property purchase process (6 steps)
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public createClientJourneyApiAgentsJourneyCreatePost(
        requestBody: CreateJourneyRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agents/journey/create',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Journey
     * Get journey details and progress
     * @param journeyId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getJourneyApiAgentsJourneyJourneyIdGet(
        journeyId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agents/journey/{journey_id}',
            path: {
                'journey_id': journeyId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Complete Journey Step
     * Mark a journey step as completed
     * @param journeyId
     * @param stepId
     * @param notes
     * @returns any Successful Response
     * @throws ApiError
     */
    public completeJourneyStepApiAgentsJourneyJourneyIdStepStepIdCompletePost(
        journeyId: string,
        stepId: string,
        notes?: (string | null),
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agents/journey/{journey_id}/step/{step_id}/complete',
            path: {
                'journey_id': journeyId,
                'step_id': stepId,
            },
            query: {
                'notes': notes,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Next Steps
     * Get next available steps in the journey
     * @param journeyId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getNextStepsApiAgentsJourneyJourneyIdNextStepsGet(
        journeyId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agents/journey/{journey_id}/next-steps',
            path: {
                'journey_id': journeyId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Compliance Tracking
     * ⚠️ AGENT 2: Proactive Compliance Monitor
     *
     * Track compliance deadlines and get automatic alerts (60/30/7 days before)
     *
     * Supported types:
     * - visa_expiry: KITAS, KITAP, passport expiry
     * - tax_filing: SPT Tahunan, PPh, PPn deadlines
     * - license_renewal: IMTA, NIB, business permits
     * - regulatory_change: Law/regulation changes
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public addComplianceTrackingApiAgentsComplianceTrackPost(
        requestBody: AddComplianceItemRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agents/compliance/track',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Compliance Alerts
     * Get upcoming compliance alerts
     *
     * Args:
     * client_id: Filter by client
     * severity: Filter by severity
     * auto_notify: Automatically send notifications for alerts
     * @param clientId
     * @param severity
     * @param autoNotify
     * @returns any Successful Response
     * @throws ApiError
     */
    public getComplianceAlertsApiAgentsComplianceAlertsGet(
        clientId?: (string | null),
        severity?: (string | null),
        autoNotify: boolean = false,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agents/compliance/alerts',
            query: {
                'client_id': clientId,
                'severity': severity,
                'auto_notify': autoNotify,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client Compliance
     * Get all compliance items for a client
     * @param clientId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getClientComplianceApiAgentsComplianceClientClientIdGet(
        clientId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agents/compliance/client/{client_id}',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Extract Knowledge Graph
     * 🧠 AGENT 3: Knowledge Graph Builder
     *
     * Extract entities and relationships from text to build knowledge graph.
     *
     * Entities: Person, Organization, Location, Document, Concept
     * Relationships: WORKS_FOR, LOCATED_IN, REQUIRES, RELATED_TO, etc.
     * @param text Text to extract entities and relationships from
     * @returns any Successful Response
     * @throws ApiError
     */
    public extractKnowledgeGraphApiAgentsKnowledgeGraphExtractPost(
        text: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agents/knowledge-graph/extract',
            query: {
                'text': text,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Export Knowledge Graph
     * Export knowledge graph in Neo4j-ready format
     *
     * ⚠️ PLACEHOLDER ENDPOINT: Service not implemented
     * Knowledge Graph builder exists but export functionality is not wired.
     *
     * Formats:
     * - neo4j: Cypher queries for Neo4j
     * - json: JSON format
     * - graphml: GraphML format
     * @param format
     * @returns any Successful Response
     * @throws ApiError
     */
    public exportKnowledgeGraphApiAgentsKnowledgeGraphExportGet(
        format: string = 'neo4j',
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agents/knowledge-graph/export',
            query: {
                'format': format,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run Auto Ingestion
     * 🤖 AGENT 4: Auto Ingestion Orchestrator
     *
     * ⚠️ PLACEHOLDER ENDPOINT: Service exists but not wired into main_cloud.py
     * The AutoIngestionOrchestrator service is implemented but not initialized.
     *
     * Automatically monitor and ingest updates from government sources
     *
     * Sources:
     * - https://jdih.kemenkeu.go.id (Tax regulations)
     * - https://peraturan.bpk.go.id (Legal documents)
     * - https://jdih.kemendag.go.id (Trade regulations)
     * - https://ortax.org (Tax news)
     * @param force
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public runAutoIngestionApiAgentsIngestionRunPost(
        force: boolean = false,
        requestBody?: (Array<string> | null),
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agents/ingestion/run',
            query: {
                'force': force,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Ingestion Status
     * Get status of automatic ingestion service
     * @returns any Successful Response
     * @throws ApiError
     */
    public getIngestionStatusApiAgentsIngestionStatusGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agents/ingestion/status',
        });
    }
    /**
     * Cross Oracle Synthesis
     * 🔍 AGENT 5: Cross-Oracle Synthesis
     *
     * Search across multiple Oracle collections and synthesize integrated recommendations.
     *
     * Example: "I want to open a restaurant in Canggu"
     * → Queries: kbli_eye, legal_architect, tax_genius, visa_oracle, property_knowledge
     * → Synthesizes: Integrated plan with KBLI code, legal structure, tax obligations, etc.
     * @param query
     * @param domains Domains to search: tax, legal, property, visa, kbli
     * @returns any Successful Response
     * @throws ApiError
     */
    public crossOracleSynthesisApiAgentsSynthesisCrossOraclePost(
        query: string,
        domains?: Array<string>,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agents/synthesis/cross-oracle',
            query: {
                'query': query,
                'domains': domains,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Calculate Dynamic Pricing
     * 💰 AGENT 6: Dynamic Pricing Service
     *
     * Calculate pricing based on service type, complexity, and urgency
     * @param serviceType
     * @param complexity
     * @param urgency
     * @returns any Successful Response
     * @throws ApiError
     */
    public calculateDynamicPricingApiAgentsPricingCalculatePost(
        serviceType: string,
        complexity: string = 'standard',
        urgency: string = 'normal',
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agents/pricing/calculate',
            query: {
                'service_type': serviceType,
                'complexity': complexity,
                'urgency': urgency,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run Autonomous Research
     * 🔬 AGENT 7: Autonomous Research Service
     *
     * Self-directed research agent that iteratively explores Qdrant collections
     * to answer complex or ambiguous queries without human intervention.
     *
     * Example: "How to open a crypto company in Indonesia?"
     * → Iteration 1: Search kbli_eye → "crypto" not in KBLI
     * → Iteration 2: Expand to legal_updates → finds OJK crypto regulation
     * → Iteration 3: Search tax_genius → crypto tax treatment
     * → Synthesis: Comprehensive answer
     *
     * Args:
     * topic: Research topic/question
     * depth: standard (3 iterations), deep (5 iterations)
     * sources: Optional list of specific collections to search
     * @param topic
     * @param depth
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public runAutonomousResearchApiAgentsResearchAutonomousPost(
        topic: string,
        depth: string = 'standard',
        requestBody?: (Array<string> | null),
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/agents/research/autonomous',
            query: {
                'topic': topic,
                'depth': depth,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Analytics Summary
     * Get comprehensive analytics for all agentic functions
     *
     * Performance: Cached for 3 minutes (reduces database load)
     * @returns any Successful Response
     * @throws ApiError
     */
    public getAnalyticsSummaryApiAgentsAnalyticsSummaryGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/agents/analytics/summary',
        });
    }
}
