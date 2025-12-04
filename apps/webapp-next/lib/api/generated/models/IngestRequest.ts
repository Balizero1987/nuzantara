/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DocumentChunk } from './DocumentChunk';
/**
 * Bulk ingest request
 */
export type IngestRequest = {
    /**
     * Target collection name
     */
    collection?: string;
    /**
     * List of document chunks to ingest
     */
    documents: Array<DocumentChunk>;
    /**
     * Batch size for ingestion
     */
    batch_size?: number;
};

