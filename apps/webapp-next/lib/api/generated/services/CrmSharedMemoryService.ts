/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CrmSharedMemoryService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Search Shared Memory
     * Natural language search across CRM data
     *
     * Examples:
     * - "clients with KITAS expiring soon"
     * - "active practices for John Smith"
     * - "recent interactions with antonello@balizero.com"
     * - "urgent practices"
     * - "PT PMA practices in progress"
     *
     * Returns relevant results from clients, practices, and interactions
     * @param q Natural language query
     * @param limit
     * @returns any Successful Response
     * @throws ApiError
     */
    public searchSharedMemoryApiCrmSharedMemorySearchGet(
        q: string,
        limit: number = 20,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/shared-memory/search',
            query: {
                'q': q,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Upcoming Renewals
     * Get all practices with upcoming renewal dates
     *
     * Default: next 90 days
     * @param days Look ahead days
     * @returns any Successful Response
     * @throws ApiError
     */
    public getUpcomingRenewalsApiCrmSharedMemoryUpcomingRenewalsGet(
        days: number = 90,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/shared-memory/upcoming-renewals',
            query: {
                'days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client Full Context
     * Get complete context for a client
     * Everything the AI needs to know about this client
     *
     * Returns:
     * - Client info
     * - All practices (active + completed)
     * - Recent interactions (last 20)
     * - Upcoming renewals
     * - Action items
     * @param clientId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getClientFullContextApiCrmSharedMemoryClientClientIdFullContextGet(
        clientId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/shared-memory/client/{client_id}/full-context',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Team Overview
     * Get team-wide CRM overview
     *
     * Perfect for dashboard or team queries like:
     * - "How many active practices do we have?"
     * - "What's our workload distribution?"
     * - "Recent activity summary"
     * @returns any Successful Response
     * @throws ApiError
     */
    public getTeamOverviewApiCrmSharedMemoryTeamOverviewGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/shared-memory/team-overview',
        });
    }
}
