/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response model for legal document ingestion
 */
export type LegalIngestResponse = {
    success: boolean;
    book_title: string;
    chunks_created: number;
    legal_metadata?: (Record<string, any> | null);
    structure?: (Record<string, any> | null);
    message: string;
    error?: (string | null);
};

