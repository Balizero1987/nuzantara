/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request model for legal document ingestion
 */
export type LegalIngestRequest = {
    /**
     * Path to legal document file
     */
    file_path: string;
    /**
     * Document title (auto-extracted if not provided)
     */
    title?: (string | null);
    /**
     * Tier override (S, A, B, C, D)
     */
    tier?: (string | null);
    /**
     * Override collection name (default: legal_unified)
     */
    collection_name?: (string | null);
};

