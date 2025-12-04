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
     * SECURITY: User identity is extracted from JWT token, not request body.
     *
     * Body:
     * {
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
             * "user_email": "authenticated-user@example.com",
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
                 * @param requestBody
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public saveConversationApiBaliZeroConversationsSavePost(
                    requestBody: SaveConversationRequest,
                ): CancelablePromise<any> {
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
                 * Get conversation history for the authenticated user
                 *
                 * SECURITY: User identity is extracted from JWT token.
                 *
                 * Query params:
                 * - limit: Max number of messages to return (default: 20)
                 * - session_id: Optional session filter
                 * @param limit
                 * @param sessionId
                 * @returns ConversationHistoryResponse Successful Response
                 * @throws ApiError
                 */
                public getConversationHistoryApiBaliZeroConversationsHistoryGet(
                    limit: number = 20,
                    sessionId?: (string | null),
                ): CancelablePromise<ConversationHistoryResponse> {
                    return this.httpRequest.request({
                        method: 'GET',
                        url: '/api/bali-zero/conversations/history',
                        query: {
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
                 * Clear conversation history for the authenticated user
                 *
                 * SECURITY: User identity is extracted from JWT token.
                 *
                 * Query params:
                 * - session_id: Optional session filter (if omitted, clears ALL conversations for user)
                 * @param sessionId
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public clearConversationHistoryApiBaliZeroConversationsClearDelete(
                    sessionId?: (string | null),
                ): CancelablePromise<any> {
                    return this.httpRequest.request({
                        method: 'DELETE',
                        url: '/api/bali-zero/conversations/clear',
                        query: {
                            'session_id': sessionId,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Get Conversation Stats
                 * Get conversation statistics for the authenticated user
                 *
                 * SECURITY: User identity is extracted from JWT token.
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public getConversationStatsApiBaliZeroConversationsStatsGet(): CancelablePromise<any> {
                    return this.httpRequest.request({
                        method: 'GET',
                        url: '/api/bali-zero/conversations/stats',
                    });
                }
            }
