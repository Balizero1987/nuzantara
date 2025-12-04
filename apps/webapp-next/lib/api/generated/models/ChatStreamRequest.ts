/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request model for POST /api/chat/stream
 */
export type ChatStreamRequest = {
    message: string;
    user_id?: (string | null);
    conversation_history?: null;
    metadata?: (Record<string, any> | null);
    zantara_context?: (Record<string, any> | null);
};

