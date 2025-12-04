/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * NOTE: user_email has been removed from this type to match the backend.
 * The backend extracts user_email from the JWT token for security reasons.
 * This file was manually updated to reflect the actual backend API.
 */
export type SaveConversationRequest = {
    messages: Array<Record<string, any>>;
    session_id?: (string | null);
    metadata?: (Record<string, any> | null);
};
