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
   * @param requestBody
   * @returns InteractionResponse Successful Response
   * @throws ApiError
   */
  public createInteractionApiCrmInteractionsPost(
    requestBody: InteractionCreate
  ): CancelablePromise<InteractionResponse> {
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
   * @param clientId Filter by client
   * @param practiceId Filter by practice
   * @param teamMember Filter by team member
   * @param interactionType Filter by type
   * @param sentiment Filter by sentiment
   * @param limit
   * @param offset
   * @returns any Successful Response
   * @throws ApiError
   */
  public listInteractionsApiCrmInteractionsGet(
    clientId?: number | null,
    practiceId?: number | null,
    teamMember?: string | null,
    interactionType?: string | null,
    sentiment?: string | null,
    limit: number = 50,
    offset?: number
  ): CancelablePromise<Array<Record<string, any>>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/crm/interactions/',
      query: {
        client_id: clientId,
        practice_id: practiceId,
        team_member: teamMember,
        interaction_type: interactionType,
        sentiment: sentiment,
        limit: limit,
        offset: offset,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get Interaction
   * Get full interaction details by ID
   * @param interactionId
   * @returns any Successful Response
   * @throws ApiError
   */
  public getInteractionApiCrmInteractionsInteractionIdGet(
    interactionId: number
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/crm/interactions/{interaction_id}',
      path: {
        interaction_id: interactionId,
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
   * @param clientId
   * @param limit
   * @returns any Successful Response
   * @throws ApiError
   */
  public getClientTimelineApiCrmInteractionsClientClientIdTimelineGet(
    clientId: number,
    limit: number = 50
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/crm/interactions/client/{client_id}/timeline',
      path: {
        client_id: clientId,
      },
      query: {
        limit: limit,
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
   * @param practiceId
   * @returns any Successful Response
   * @throws ApiError
   */
  public getPracticeHistoryApiCrmInteractionsPracticePracticeIdHistoryGet(
    practiceId: number
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/crm/interactions/practice/{practice_id}/history',
      path: {
        practice_id: practiceId,
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
   * @param teamMember Stats for specific team member
   * @returns any Successful Response
   * @throws ApiError
   */
  public getInteractionsStatsApiCrmInteractionsStatsOverviewGet(
    teamMember?: string | null
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/crm/interactions/stats/overview',
      query: {
        team_member: teamMember,
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
   * @param conversationId
   * @param clientEmail
   * @param teamMember
   * @param summary AI-generated summary
   * @returns any Successful Response
   * @throws ApiError
   */
  public createInteractionFromConversationApiCrmInteractionsFromConversationPost(
    conversationId: number,
    clientEmail: string,
    teamMember: string,
    summary?: string | null
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/crm/interactions/from-conversation',
      query: {
        conversation_id: conversationId,
        client_email: clientEmail,
        team_member: teamMember,
        summary: summary,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Sync Gmail Interactions
   * Manually trigger Gmail sync to Auto-CRM
   * @param limit Max emails to process
   * @param teamMember Team member handling sync
   * @returns any Successful Response
   * @throws ApiError
   */
  public syncGmailInteractionsApiCrmInteractionsSyncGmailPost(
    limit: number = 5,
    teamMember: string = 'system'
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/crm/interactions/sync-gmail',
      query: {
        limit: limit,
        team_member: teamMember,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
