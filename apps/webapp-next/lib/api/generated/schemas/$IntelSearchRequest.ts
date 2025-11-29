/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $IntelSearchRequest = {
    properties: {
        query: {
            type: 'string',
            isRequired: true,
        },
        category: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        date_range: {
            type: 'string',
        },
        tier: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        impact_level: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        limit: {
            type: 'number',
        },
    },
} as const;
