/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User work status response
 */
export type UserStatusResponse = {
    user_id: string;
    is_online: boolean;
    last_action: (string | null);
    last_action_type: (string | null);
    today_hours: number;
    week_hours: number;
    week_days: number;
};

