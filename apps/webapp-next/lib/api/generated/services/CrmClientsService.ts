/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientCreate } from '../models/ClientCreate';
import type { ClientResponse } from '../models/ClientResponse';
import type { ClientUpdate } from '../models/ClientUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CrmClientsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Create Client
     * Create a new client
     *
     * - **full_name**: Client's full name (required)
     * - **email**: Email address (optional but recommended)
     * - **phone**: Phone number
     * - **whatsapp**: WhatsApp number (can be same as phone)
     * - **nationality**: Client's nationality
     * - **passport_number**: Passport number
     * - **assigned_to**: Team member email to assign client to
     * - **tags**: Array of tags (e.g., ['vip', 'urgent'])
     * @param createdBy Team member email creating this client
     * @param requestBody
     * @returns ClientResponse Successful Response
     * @throws ApiError
     */
    public createClientApiCrmClientsPost(
        createdBy: string,
        requestBody: ClientCreate,
    ): CancelablePromise<ClientResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/crm/clients/',
            query: {
                'created_by': createdBy,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Clients
     * List all clients with optional filtering
     *
     * - **status**: Filter by client status
     * - **assigned_to**: Filter by assigned team member
     * - **search**: Search in name, email, phone fields
     * - **limit**: Max results (default: 50, max: 200)
     * - **offset**: For pagination
     * @param status Filter by status: active, inactive, prospect
     * @param assignedTo Filter by assigned team member email
     * @param search Search by name, email, or phone
     * @param limit Max results to return
     * @param offset Offset for pagination
     * @returns ClientResponse Successful Response
     * @throws ApiError
     */
    public listClientsApiCrmClientsGet(
        status?: (string | null),
        assignedTo?: (string | null),
        search?: (string | null),
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<Array<ClientResponse>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/clients/',
            query: {
                'status': status,
                'assigned_to': assignedTo,
                'search': search,
                'limit': limit,
                'offset': offset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client
     * Get client by ID
     * @param clientId
     * @returns ClientResponse Successful Response
     * @throws ApiError
     */
    public getClientApiCrmClientsClientIdGet(
        clientId: number,
    ): CancelablePromise<ClientResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/clients/{client_id}',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Client
     * Update client information
     *
     * Only provided fields will be updated. Other fields remain unchanged.
     * @param clientId
     * @param updatedBy Team member making the update
     * @param requestBody
     * @returns ClientResponse Successful Response
     * @throws ApiError
     */
    public updateClientApiCrmClientsClientIdPatch(
        clientId: number,
        updatedBy: string,
        requestBody: ClientUpdate,
    ): CancelablePromise<ClientResponse> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/crm/clients/{client_id}',
            path: {
                'client_id': clientId,
            },
            query: {
                'updated_by': updatedBy,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Client
     * Delete a client (soft delete - marks as inactive)
     *
     * This doesn't permanently delete the client, just marks them as inactive.
     * Use with caution as this will also affect related practices and interactions.
     * @param clientId
     * @param deletedBy Team member deleting the client
     * @returns any Successful Response
     * @throws ApiError
     */
    public deleteClientApiCrmClientsClientIdDelete(
        clientId: number,
        deletedBy: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/crm/clients/{client_id}',
            path: {
                'client_id': clientId,
            },
            query: {
                'deleted_by': deletedBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client By Email
     * Get client by email address
     * @param email
     * @returns any Successful Response
     * @throws ApiError
     */
    public getClientByEmailApiCrmClientsByEmailEmailGet(
        email: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/clients/by-email/{email}',
            path: {
                'email': email,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client Summary
     * Get comprehensive client summary including:
     * - Basic client info
     * - All practices (active + completed)
     * - Recent interactions
     * - Documents
     * - Upcoming renewals
     * @param clientId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getClientSummaryApiCrmClientsClientIdSummaryGet(
        clientId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/clients/{client_id}/summary',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Clients Stats
     * Get overall client statistics
     *
     * Returns counts by status, top assigned team members, etc.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getClientsStatsApiCrmClientsStatsOverviewGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/clients/stats/overview',
        });
    }
}
