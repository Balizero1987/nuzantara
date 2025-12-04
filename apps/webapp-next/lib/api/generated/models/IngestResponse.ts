/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Ingest response
 */
export type IngestResponse = {
    success: boolean;
    collection: string;
    documents_ingested: number;
    execution_time_ms: number;
    message: string;
    error?: (string | null);
};

