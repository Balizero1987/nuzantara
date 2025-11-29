/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PracticeCreate } from '../models/PracticeCreate';
import type { PracticeResponse } from '../models/PracticeResponse';
import type { PracticeUpdate } from '../models/PracticeUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CrmPracticesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Create Practice
     * Create a new practice for a client
     *
     * - **client_id**: ID of the client
     * - **practice_type_code**: Practice type code (retrieved from database)
     * - **status**: Initial status (default: 'inquiry')
     * - **quoted_price**: Price quoted to client
     * - **assigned_to**: Team member email to handle this
     * @returns PracticeResponse Successful Response
     * @throws ApiError
     */
    public createPracticeApiCrmPracticesPost({
        createdBy,
        requestBody,
    }: {
        /**
         * Team member creating this practice
         */
        createdBy: string,
        requestBody: PracticeCreate,
    }): CancelablePromise<PracticeResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/crm/practices/',
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
     * List Practices
     * List practices with optional filtering
     *
     * Returns practices with client and practice type information joined
     * @returns any Successful Response
     * @throws ApiError
     */
    public listPracticesApiCrmPracticesGet({
        clientId,
        status,
        assignedTo,
        practiceType,
        priority,
        limit = 50,
        offset,
    }: {
        /**
         * Filter by client ID
         */
        clientId?: (number | null),
        /**
         * Filter by status
         */
        status?: (string | null),
        /**
         * Filter by assigned team member
         */
        assignedTo?: (string | null),
        /**
         * Filter by practice type code
         */
        practiceType?: (string | null),
        /**
         * Filter by priority
         */
        priority?: (string | null),
        limit?: number,
        offset?: number,
    }): CancelablePromise<Array<Record<string, any>>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/practices/',
            query: {
                'client_id': clientId,
                'status': status,
                'assigned_to': assignedTo,
                'practice_type': practiceType,
                'priority': priority,
                'limit': limit,
                'offset': offset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Active Practices
     * Get all active practices (in progress, not completed/cancelled)
     *
     * Optionally filter by assigned team member
     * @returns any Successful Response
     * @throws ApiError
     */
    public getActivePracticesApiCrmPracticesActiveGet({
        assignedTo,
    }: {
        assignedTo?: (string | null),
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/practices/active',
            query: {
                'assigned_to': assignedTo,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Upcoming Renewals
     * Get practices with upcoming renewal dates
     *
     * Default: next 90 days
     * @returns any Successful Response
     * @throws ApiError
     */
    public getUpcomingRenewalsApiCrmPracticesRenewalsUpcomingGet({
        days = 90,
    }: {
        /**
         * Days to look ahead
         */
        days?: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/practices/renewals/upcoming',
            query: {
                '_days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Practice
     * Get practice details by ID with full client and type info
     * @returns any Successful Response
     * @throws ApiError
     */
    public getPracticeApiCrmPracticesPracticeIdGet({
        practiceId,
    }: {
        practiceId: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/practices/{practice_id}',
            path: {
                'practice_id': practiceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Practice
     * Update practice information
     *
     * Common status values:
     * - inquiry
     * - quotation_sent
     * - payment_pending
     * - in_progress
     * - waiting_documents
     * - submitted_to_gov
     * - approved
     * - completed
     * - cancelled
     * @returns any Successful Response
     * @throws ApiError
     */
    public updatePracticeApiCrmPracticesPracticeIdPatch({
        practiceId,
        updatedBy,
        requestBody,
    }: {
        practiceId: number,
        /**
         * Team member making the update
         */
        updatedBy: string,
        requestBody: PracticeUpdate,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/crm/practices/{practice_id}',
            path: {
                'practice_id': practiceId,
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
     * Add Document To Practice
     * Add a document to a practice
     *
     * - **document_name**: Name/type of document (e.g., "Passport Copy")
     * - **drive_file_id**: Google Drive file ID
     * - **uploaded_by**: Email of person uploading
     * @returns any Successful Response
     * @throws ApiError
     */
    public addDocumentToPracticeApiCrmPracticesPracticeIdDocumentsAddPost({
        practiceId,
        documentName,
        driveFileId,
        uploadedBy,
    }: {
        practiceId: number,
        documentName: string,
        driveFileId: string,
        uploadedBy: string,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/crm/practices/{practice_id}/documents/add',
            path: {
                'practice_id': practiceId,
            },
            query: {
                'document_name': documentName,
                'drive_file_id': driveFileId,
                'uploaded_by': uploadedBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Practices Stats
     * Get overall practice statistics
     *
     * - Counts by status
     * - Counts by practice type
     * - Revenue metrics
     * @returns any Successful Response
     * @throws ApiError
     */
    public getPracticesStatsApiCrmPracticesStatsOverviewGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/crm/practices/stats/overview',
        });
    }
}
