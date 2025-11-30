/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type InteractionCreate = {
    client_id?: (number | null);
    practice_id?: (number | null);
    conversation_id?: (number | null);
    interaction_type: string;
    channel?: (string | null);
    subject?: (string | null);
    summary?: (string | null);
    full_content?: (string | null);
    sentiment?: (string | null);
    team_member: string;
    direction?: string;
    duration_minutes?: (number | null);
    extracted_entities?: Record<string, any>;
    action_items?: Array<Record<string, any>>;
};

