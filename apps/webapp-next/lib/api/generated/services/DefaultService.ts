/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntelSearchRequest } from '../models/IntelSearchRequest';
import type { IntelStoreRequest } from '../models/IntelStoreRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DefaultService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Metrics
     * Endpoint that serves Prometheus metrics.
     * @returns any Successful Response
     * @throws ApiError
     */
    public metricsMetricsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/metrics',
        });
    }
    /**
     * Search Intel
     * Search intel news with semantic search
     * @returns any Successful Response
     * @throws ApiError
     */
    public searchIntelApiIntelSearchPost({
        requestBody,
    }: {
        requestBody: IntelSearchRequest,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/intel/search',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Store Intel
     * Store intel news item in Qdrant
     * @returns any Successful Response
     * @throws ApiError
     */
    public storeIntelApiIntelStorePost({
        requestBody,
    }: {
        requestBody: IntelStoreRequest,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/intel/store',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Critical Items
     * Get critical impact items
     * @returns any Successful Response
     * @throws ApiError
     */
    public getCriticalItemsApiIntelCriticalGet({
        category,
        days = 7,
    }: {
        category?: (string | null),
        days?: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/intel/critical',
            query: {
                'category': category,
                'days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Trends
     * Get trending topics and keywords
     * @returns any Successful Response
     * @throws ApiError
     */
    public getTrendsApiIntelTrendsGet({
        category,
        days = 30,
    }: {
        category?: (string | null),
        days?: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/intel/trends',
            query: {
                'category': category,
                '_days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Collection Stats
     * Get statistics for a specific intel collection
     * @returns any Successful Response
     * @throws ApiError
     */
    public getCollectionStatsApiIntelStatsCollectionGet({
        collection,
    }: {
        collection: string,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/intel/stats/{collection}',
            path: {
                'collection': collection,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Csrf Token
     * Generate CSRF token and session ID for frontend security.
     * Returns token in both JSON body and response headers.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getCsrfTokenApiCsrfTokenGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/csrf-token',
        });
    }
    /**
     * Get Dashboard Stats
     * Provide real-time stats for the Mission Control Dashboard.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getDashboardStatsApiDashboardStatsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/dashboard/stats',
        });
    }
    /**
     * Bali Zero Chat Stream
     * Streaming chat endpoint using IntelligentRouter for RAG-based responses.
     * @returns any Successful Response
     * @throws ApiError
     */
    public baliZeroChatStreamBaliZeroChatStreamGet({
        query,
        userEmail,
        userRole = 'member',
        conversationHistory,
        authToken,
        authorization,
    }: {
        query: string,
        userEmail?: (string | null),
        userRole?: string,
        conversationHistory?: (string | null),
        authToken?: (string | null),
        authorization?: (string | null),
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/bali-zero/chat-stream',
            headers: {
                'authorization': authorization,
            },
            query: {
                'query': query,
                'user_email': userEmail,
                'user_role': userRole,
                'conversation_history': conversationHistory,
                'auth_token': authToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bali Zero Chat Stream
     * Streaming chat endpoint using IntelligentRouter for RAG-based responses.
     * @returns any Successful Response
     * @throws ApiError
     */
    public baliZeroChatStreamApiV2BaliZeroChatStreamGet({
        query,
        userEmail,
        userRole = 'member',
        conversationHistory,
        authToken,
        authorization,
    }: {
        query: string,
        userEmail?: (string | null),
        userRole?: string,
        conversationHistory?: (string | null),
        authToken?: (string | null),
        authorization?: (string | null),
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v2/bali-zero/chat-stream',
            headers: {
                'authorization': authorization,
            },
            query: {
                'query': query,
                'user_email': userEmail,
                'user_role': userRole,
                'conversation_history': conversationHistory,
                'auth_token': authToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
