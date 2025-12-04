/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LegalIngestRequest } from '../models/LegalIngestRequest';
import type { LegalIngestResponse } from '../models/LegalIngestResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class LegalIngestionService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Ingest Legal Document
     * Ingest a single legal document through the specialized pipeline.
     *
     * Pipeline stages:
     * 1. Clean: Remove headers/footers/noise
     * 2. Extract Metadata: Type, number, year, topic
     * 3. Parse Structure: BAB, Pasal, Ayat hierarchy
     * 4. Chunk: Pasal-aware chunking with context injection
     * 5. Embed & Store: Generate embeddings and store in Qdrant
     *
     * Args:
     * request: Legal ingestion request with file path and options
     *
     * Returns:
     * Ingestion result with metadata and statistics
     * @param requestBody
     * @returns LegalIngestResponse Successful Response
     * @throws ApiError
     */
    public ingestLegalDocumentApiLegalIngestPost(
        requestBody: LegalIngestRequest,
    ): CancelablePromise<LegalIngestResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/legal/ingest',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Ingest Legal Documents Batch
     * Ingest multiple legal documents in batch.
     *
     * Args:
     * file_paths: List of file paths to ingest
     * collection_name: Override collection name (optional)
     *
     * Returns:
     * Batch ingestion results
     * @param requestBody
     * @param collectionName
     * @returns any Successful Response
     * @throws ApiError
     */
    public ingestLegalDocumentsBatchApiLegalIngestBatchPost(
        requestBody: Array<string>,
        collectionName?: (string | null),
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/legal/ingest-batch',
            query: {
                'collection_name': collectionName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Collection Stats
     * Get statistics for legal document collection.
     *
     * Args:
     * collection_name: Collection name to query
     *
     * Returns:
     * Collection statistics
     * @param collectionName
     * @returns any Successful Response
     * @throws ApiError
     */
    public getCollectionStatsApiLegalCollectionsStatsGet(
        collectionName: string = 'legal_unified',
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/legal/collections/stats',
            query: {
                'collection_name': collectionName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
