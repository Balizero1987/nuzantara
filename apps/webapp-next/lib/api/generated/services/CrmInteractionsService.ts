/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InteractionCreate } from '../models/InteractionCreate';
import type { InteractionResponse } from '../models/InteractionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CrmInteractionsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Create Interaction
     * Log a new interaction
     *
     * **Types:**
     * - chat: Web chat conversation
     * - email: Email exchange
     * - whatsapp: WhatsApp message
     * - call: Phone call
     * - meeting: In-person or video meeting
     * - note: Internal note/comment
     *
     * **Channels:**
     * - web_chat: ZANTARA chat widget
     * - gmail: Gmail integration
     * - whatsapp: WhatsApp Business
     * - phone: Phone call
     * - in_person: Face-to-face meeting
     * @returns InteractionResponse Successful Response
     * @throws ApiError
     */
    public createInteractionApiCrmInteractionsPost({
        requestBody,
    }: {
        requestBody: InteractionCreate,
    }): CancelablePromise<InteractionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/crm/interactions/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Interactions
     * List interactions with optional filtering
     * @returns any Successful Response
     * @throws ApiError
     */
    public listInteractionsApiCrmInteractionsGet({
        clientId,
        practiceId,
        teamMember,
        interactionType,
        sentiment,
        limit = 50,
        offset,
    }: {
        /**
         * Filter by client
         */
        clientId?: (number | null),
        /**
         * Filter by practice
         */
        practiceId?: (number | null),
        /**
         * Filter by team member
         */
        teamMember?: (string | null),
        /**
         * Filter by type
         */
        interactionType?: (string | null),
        /**
         * Filter by sentiment
         */
        sentiment?: (string | null),
        limit?: number,
        offset?: number,
    }): CancelablePromise<Array<Record<string, any>>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/interactions/',
            query: {
                'client_id': clientId,
                'practice_id': practiceId,
                'team_member': teamMember,
                'interaction_type': interactionType,
                'sentiment': sentiment,
                'limit': limit,
                'offset': offset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Interaction
     * Get full interaction details by ID
     * @returns any Successful Response
     * @throws ApiError
     */
    public getInteractionApiCrmInteractionsInteractionIdGet({
        interactionId,
    }: {
        interactionId: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/interactions/{interaction_id}',
            path: {
                'interaction_id': interactionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client Timeline
     * Get complete interaction timeline for a client
     *
     * Returns all interactions sorted by date (newest first)
     * @returns any Successful Response
     * @throws ApiError
     */
    public getClientTimelineApiCrmInteractionsClientClientIdTimelineGet({
        clientId,
        limit = 50,
    }: {
        clientId: number,
        limit?: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/interactions/client/{client_id}/timeline',
            path: {
                'client_id': clientId,
            },
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Practice History
     * Get all interactions related to a specific practice
     *
     * Useful for tracking communication history for a KITAS, PT PMA, etc.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getPracticeHistoryApiCrmInteractionsPracticePracticeIdHistoryGet({
        practiceId,
    }: {
        practiceId: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/interactions/practice/{practice_id}/history',
            path: {
                'practice_id': practiceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Interactions Stats
     * Get interaction statistics
     *
     * - Total interactions
     * - By type (chat, email, call, etc.)
     * - By sentiment
     * - By team member
     * @returns any Successful Response
     * @throws ApiError
     */
    public getInteractionsStatsApiCrmInteractionsStatsOverviewGet({
        teamMember,
    }: {
        /**
         * Stats for specific team member
         */
        teamMember?: (string | null),
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/interactions/stats/overview',
            query: {
                'team_member': teamMember,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Interaction From Conversation
     * Auto-create interaction record from a chat conversation
     *
     * This is called automatically when a chat session ends or at intervals
     * @returns any Successful Response
     * @throws ApiError
     */
    public createInteractionFromConversationApiCrmInteractionsFromConversationPost({
        conversationId,
        clientEmail,
        teamMember,
        summary,
    }: {
        conversationId: number,
        clientEmail: string,
        teamMember: string,
        /**
         * AI-generated summary
         */
        summary?: (string | null),
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/crm/interactions/from-conversation',
            query: {
                'conversation_id': conversationId,
                'client_email': clientEmail,
                'team_member': teamMember,
                'summary': summary,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Sync Gmail Interactions
     * Manually trigger Gmail sync to Auto-CRM
     * @returns any Successful Response
     * @throws ApiError
     */
    public syncGmailInteractionsApiCrmInteractionsSyncGmailPost({
        limit = 5,
        teamMember = 'system',
    }: {
        /**
         * Max emails to process
         */
        limit?: number,
        /**
         * Team member handling sync
         */
        teamMember?: string,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/crm/interactions/sync-gmail',
            query: {
                'limit': limit,
                'team_member': teamMember,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
