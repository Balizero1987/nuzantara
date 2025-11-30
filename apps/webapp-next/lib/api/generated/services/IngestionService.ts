/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchIngestionRequest } from '../models/BatchIngestionRequest';
import type { BatchIngestionResponse } from '../models/BatchIngestionResponse';
import type { Body_upload_and_ingest_api_ingest_upload_post } from '../models/Body_upload_and_ingest_api_ingest_upload_post';
import type { BookIngestionRequest } from '../models/BookIngestionRequest';
import type { BookIngestionResponse } from '../models/BookIngestionResponse';
import type { TierLevel } from '../models/TierLevel';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class IngestionService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Upload And Ingest
     * Upload and ingest a single book.
     *
     * - **file**: PDF or EPUB file
     * - **title**: Optional book title (auto-detected if not provided)
     * - **author**: Optional author name
     * - **tier_override**: Optional manual tier (S/A/B/C/D)
     * @returns BookIngestionResponse Successful Response
     * @throws ApiError
     */
    public uploadAndIngestApiIngestUploadPost({
        formData,
        title,
        author,
        tierOverride,
    }: {
        formData: Body_upload_and_ingest_api_ingest_upload_post,
        title?: (string | null),
        author?: (string | null),
        tierOverride?: (TierLevel | null),
    }): CancelablePromise<BookIngestionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/ingest/upload',
            query: {
                'title': title,
                'author': author,
                'tier_override': tierOverride,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Ingest Local File
     * Ingest a book from local file path.
     *
     * - **file_path**: Path to PDF or EPUB file
     * - **title**: Optional book title
     * - **author**: Optional author name
     * - **tier_override**: Optional manual tier classification
     * @returns BookIngestionResponse Successful Response
     * @throws ApiError
     */
    public ingestLocalFileApiIngestFilePost({
        requestBody,
    }: {
        requestBody: BookIngestionRequest,
    }): CancelablePromise<BookIngestionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/ingest/file',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Batch Ingest
     * Process all books in a directory.
     *
     * - **directory_path**: Path to directory containing books
     * - **file_patterns**: File patterns to match (default: ["*.pdf", "*.epub"])
     * - **skip_existing**: Skip books already in database
     * @returns BatchIngestionResponse Successful Response
     * @throws ApiError
     */
    public batchIngestApiIngestBatchPost({
        requestBody,
    }: {
        requestBody: BatchIngestionRequest,
    }): CancelablePromise<BatchIngestionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/ingest/batch',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Ingestion Stats
     * Get current database statistics.
     *
     * Returns total documents, tier distribution, and collection info.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getIngestionStatsApiIngestStatsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/ingest/stats',
        });
    }
}
