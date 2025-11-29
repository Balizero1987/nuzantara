/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $TeamMemberStatus = {
    description: `Team member status`,
    properties: {
        user_id: {
            type: 'string',
            isRequired: true,
        },
        email: {
            type: 'string',
            isRequired: true,
        },
        is_online: {
            type: 'boolean',
            isRequired: true,
        },
        last_action: {
            type: 'string',
            isRequired: true,
        },
        last_action_type: {
            type: 'string',
            isRequired: true,
        },
    },
} as const;
