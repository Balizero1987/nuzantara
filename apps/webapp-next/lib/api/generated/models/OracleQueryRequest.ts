/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Universal Oracle query request with user context
 */
export type OracleQueryRequest = {
    /**
     * Natural language query
     */
    query: string;
    /**
     * User email for personalization
     */
    user_email?: (string | null);
    /**
     * Override user language preference
     */
    language_override?: (string | null);
    /**
     * Optional domain hint for routing
     */
    domain_hint?: (string | null);
    /**
     * Specific document IDs to analyze
     */
    context_docs?: (Array<string> | null);
    /**
     * Enable AI reasoning
     */
    use_ai?: boolean;
    /**
     * Include source document references
     */
    include_sources?: boolean;
    /**
     * Response format: 'structured' or 'conversational'
     */
    response_format?: string;
    /**
     * Max document results
     */
    limit?: number;
    /**
     * Session identifier for analytics
     */
    session_id?: (string | null);
};

