/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationHistoryResponse } from '../models/ConversationHistoryResponse';
import type { SaveConversationRequest } from '../models/SaveConversationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ConversationsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Save Conversation
     * Save conversation messages to PostgreSQL
     * + Auto-populate CRM with client/practice data
     *
     * Body:
     * {
         * "user_email": "user@example.com",
         * "messages": [{"role": "user", "content": "..."}, ...],
         * "session_id": "optional-session-id",
         * "metadata": {"key": "value"}
         * }
         *
         * Returns:
         * {
             * "success": true,
             * "conversation_id": 123,
             * "messages_saved": 10,
             * "crm": {
                 * "processed": true,
                 * "client_id": 42,
                 * "client_created": false,
                 * "client_updated": true,
                 * "practice_id": 15,
                 * "practice_created": true,
                 * "interaction_id": 88
                 * }
                 * }
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public saveConversationApiBaliZeroConversationsSavePost({
                    requestBody,
                }: {
                    requestBody: SaveConversationRequest,
                }): CancelablePromise<any> {
                    return this.httpRequest.request({
                        method: 'POST',
                        url: '/api/bali-zero/conversations/save',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Get Conversation History
                 * Get conversation history for a user
                 *
                 * Query params:
                 * - user_email: User's email address
                 * - limit: Max number of messages to return (default: 20)
                 * - session_id: Optional session filter
                 * @returns ConversationHistoryResponse Successful Response
                 * @throws ApiError
                 */
                public getConversationHistoryApiBaliZeroConversationsHistoryGet({
                    userEmail,
                    limit = 20,
                    sessionId,
                }: {
                    userEmail: string,
                    limit?: number,
                    sessionId?: (string | null),
                }): CancelablePromise<ConversationHistoryResponse> {
                    return this.httpRequest.request({
                        method: 'GET',
                        url: '/api/bali-zero/conversations/history',
                        query: {
                            'user_email': userEmail,
                            'limit': limit,
                            'session_id': sessionId,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Clear Conversation History
                 * Clear conversation history for a user
                 *
                 * Query params:
                 * - user_email: User's email address
                 * - session_id: Optional session filter (if omitted, clears ALL conversations for user)
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public clearConversationHistoryApiBaliZeroConversationsClearDelete({
                    userEmail,
                    sessionId,
                }: {
                    userEmail: string,
                    sessionId?: (string | null),
                }): CancelablePromise<any> {
                    return this.httpRequest.request({
                        method: 'DELETE',
                        url: '/api/bali-zero/conversations/clear',
                        query: {
                            'user_email': userEmail,
                            'session_id': sessionId,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Get Conversation Stats
                 * Get conversation statistics for a user
                 *
                 * Query params:
                 * - user_email: User's email address
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public getConversationStatsApiBaliZeroConversationsStatsGet({
                    userEmail,
                }: {
                    userEmail: string,
                }): CancelablePromise<any> {
                    return this.httpRequest.request({
                        method: 'GET',
                        url: '/api/bali-zero/conversations/stats',
                        query: {
                            'user_email': userEmail,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
            }
