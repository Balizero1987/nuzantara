/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IngestRequest } from '../models/IngestRequest';
import type { IngestResponse } from '../models/IngestResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class OracleIngestService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Ingest Documents
     * Bulk ingest documents into Qdrant collection
     *
     * **Usage:**
     * ```python
     * import requests
     *
     * chunks = [
         * {
             * "content": "### PP-28-2025 - Pasal 1\n\nContent here...",
             * "metadata": {
                 * "law_id": "PP-28-2025",
                 * "pasal": "1",
                 * "category": "business_licensing",
                 * "type": "legal_regulation"
                 * }
                 * }
                 * ]
                 *
                 * response = requests.post(
                     * "https://nuzantara-rag.fly.dev/api/oracle/ingest",
                     * json={"collection": "legal_intelligence", "documents": chunks}
                     * )
                     * ```
                     *
                     * **Rate Limits:**
                     * - Max 1000 documents per request
                     * - Batch processing for large uploads
                     * @param requestBody
                     * @returns IngestResponse Successful Response
                     * @throws ApiError
                     */
                    public ingestDocumentsApiOracleIngestPost(
                        requestBody: IngestRequest,
                    ): CancelablePromise<IngestResponse> {
                        return this.httpRequest.request({
                            method: 'POST',
                            url: '/api/oracle/ingest',
                            body: requestBody,
                            mediaType: 'application/json',
                            errors: {
                                422: `Validation Error`,
                            },
                        });
                    }
                    /**
                     * List Collections
                     * List all available collections
                     *
                     * **Returns:**
                     * - List of collection names
                     * - Document counts for each collection
                     * @returns any Successful Response
                     * @throws ApiError
                     */
                    public listCollectionsApiOracleCollectionsGet(): CancelablePromise<any> {
                        return this.httpRequest.request({
                            method: 'GET',
                            url: '/api/oracle/collections',
                        });
                    }
                }
