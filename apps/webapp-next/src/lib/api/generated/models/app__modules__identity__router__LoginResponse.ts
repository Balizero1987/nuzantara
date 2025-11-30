/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Login response model (matches Node.js format exactly)
 */
export type app__modules__identity__router__LoginResponse = {
    success: boolean;
    sessionId: string;
    token: string;
    user: Record<string, any>;
    permissions: Array<string>;
    personalizedResponse: boolean;
    loginTime: string;
};

