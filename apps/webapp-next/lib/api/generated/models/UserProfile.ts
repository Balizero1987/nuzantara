/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Unified User Profile model
 * Combines authentication and oracle-specific user preferences
 * Supports both 'id' and 'user_id' for backward compatibility
 */
export type UserProfile = {
    /**
     * User ID (primary)
     */
    id?: (string | null);
    /**
     * User ID (alias, for backward compatibility)
     */
    user_id?: (string | null);
    email: string;
    name: string;
    role: string;
    /**
     * User status (active, inactive, etc.)
     */
    status?: (string | null);
    /**
     * User's preferred response language
     */
    language?: string;
    /**
     * Alias for language, for backward compatibility
     */
    language_preference?: (string | null);
    /**
     * Communication tone
     */
    tone?: (string | null);
    /**
     * Response complexity level
     */
    complexity?: (string | null);
    /**
     * User's timezone
     */
    timezone?: (string | null);
    /**
     * User's role level
     */
    role_level?: (string | null);
    /**
     * General metadata
     */
    metadata?: (Record<string, any> | null);
    /**
     * Alias for metadata, for backward compatibility
     */
    meta_json?: Record<string, any>;
};

