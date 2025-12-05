/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserProfile } from './UserProfile';
/**
 * Universal Oracle query response with full context
 */
export type OracleQueryResponse = {
    success: boolean;
    query: string;
    user_email?: (string | null);
    answer?: (string | null);
    answer_language?: string;
    model_used?: (string | null);
    sources?: Array<Record<string, any>>;
    document_count?: number;
    collection_used?: (string | null);
    routing_reason?: (string | null);
    domain_confidence?: (Record<string, number> | null);
    user_profile?: (UserProfile | null);
    language_detected?: (string | null);
    execution_time_ms: number;
    search_time_ms?: (number | null);
    reasoning_time_ms?: (number | null);
    error?: (string | null);
    warning?: (string | null);
};

