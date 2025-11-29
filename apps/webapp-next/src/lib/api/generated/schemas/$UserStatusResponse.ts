/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $UserStatusResponse = {
    description: `User work status response`,
    properties: {
        user_id: {
            type: 'string',
            isRequired: true,
        },
        is_online: {
            type: 'boolean',
            isRequired: true,
        },
        last_action: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
            isRequired: true,
        },
        last_action_type: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
            isRequired: true,
        },
        today_hours: {
            type: 'number',
            isRequired: true,
        },
        week_hours: {
            type: 'number',
            isRequired: true,
        },
        week_days: {
            type: 'number',
            isRequired: true,
        },
    },
} as const;
