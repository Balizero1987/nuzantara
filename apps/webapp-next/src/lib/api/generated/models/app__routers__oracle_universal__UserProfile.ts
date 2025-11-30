/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User profile with localization preferences
 */
export type app__routers__oracle_universal__UserProfile = {
    user_id: string;
    email: string;
    name: string;
    role: string;
    /**
     * User's preferred response language
     */
    language?: string;
    /**
     * Communication tone
     */
    tone?: string;
    /**
     * Response complexity level
     */
    complexity?: string;
    /**
     * User's timezone
     */
    timezone?: string;
    /**
     * User's role level
     */
    role_level?: string;
    meta_json?: Record<string, any>;
};

