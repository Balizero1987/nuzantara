/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatStreamRequest } from '../models/ChatStreamRequest';
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
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public searchIntelApiIntelSearchPost(
        requestBody: IntelSearchRequest,
    ): CancelablePromise<any> {
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
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public storeIntelApiIntelStorePost(
        requestBody: IntelStoreRequest,
    ): CancelablePromise<any> {
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
     * @param category
     * @param days
     * @returns any Successful Response
     * @throws ApiError
     */
    public getCriticalItemsApiIntelCriticalGet(
        category?: (string | null),
        days: number = 7,
    ): CancelablePromise<any> {
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
     * @param category
     * @param days
     * @returns any Successful Response
     * @throws ApiError
     */
    public getTrendsApiIntelTrendsGet(
        category?: (string | null),
        days: number = 30,
    ): CancelablePromise<any> {
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
     * @param collection
     * @returns any Successful Response
     * @throws ApiError
     */
    public getCollectionStatsApiIntelStatsCollectionGet(
        collection: string,
    ): CancelablePromise<any> {
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
     * NOW WITH IDENTITY-AWARE CONTEXT!
     * @param query
     * @param userEmail
     * @param userRole
     * @param conversationHistory
     * @param authToken
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public baliZeroChatStreamBaliZeroChatStreamGet(
        query: string,
        userEmail?: (string | null),
        userRole: string = 'member',
        conversationHistory?: (string | null),
        authToken?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<any> {
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
     * NOW WITH IDENTITY-AWARE CONTEXT!
     * @param query
     * @param userEmail
     * @param userRole
     * @param conversationHistory
     * @param authToken
     * @param authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public baliZeroChatStreamApiV2BaliZeroChatStreamGet(
        query: string,
        userEmail?: (string | null),
        userRole: string = 'member',
        conversationHistory?: (string | null),
        authToken?: (string | null),
        authorization?: (string | null),
    ): CancelablePromise<any> {
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
    /**
     * Chat Stream Post
     * Modern POST endpoint for chat streaming (JSON body).
     * Compatible with frontend Next.js client.
     *
     * Body:
     * {
         * "message": "User query",
         * "user_id": "optional-user-id",
         * "conversation_history": [{"role": "user", "content": "..."}, ...],
         * "metadata": {"key": "value"},
         * "zantara_context": {"session_id": "...", ...}
         * }
         *
         * Returns: SSE stream with {"type": "token|metadata|done", "data": "..."}
         * @param requestBody
         * @param authorization
         * @returns any Successful Response
         * @throws ApiError
         */
        public chatStreamPostApiChatStreamPost(
            requestBody: ChatStreamRequest,
            authorization?: (string | null),
        ): CancelablePromise<any> {
            return this.httpRequest.request({
                method: 'POST',
                url: '/api/chat/stream',
                headers: {
                    'authorization': authorization,
                },
                body: requestBody,
                mediaType: 'application/json',
                errors: {
                    422: `Validation Error`,
                },
            });
        }
    }
