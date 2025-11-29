/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ClockOutRequest = {
    description: `Clock-out request`,
    properties: {
        user_id: {
            type: 'string',
            description: `User identifier`,
            isRequired: true,
        },
        email: {
            type: 'string',
            description: `User email`,
            isRequired: true,
            format: 'email',
        },
        metadata: {
            type: 'any-of',
            description: `Optional metadata`,
            contains: [{
                type: 'dictionary',
                contains: {
                    properties: {
                    },
                },
            }, {
                type: 'null',
            }],
        },
    },
} as const;
