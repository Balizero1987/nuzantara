/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $MemorySearchResponse = {
    properties: {
        results: {
            type: 'array',
            contains: {
                type: 'dictionary',
                contains: {
                    properties: {
                    },
                },
            },
            isRequired: true,
        },
        ids: {
            type: 'array',
            contains: {
                type: 'string',
            },
            isRequired: true,
        },
        distances: {
            type: 'array',
            contains: {
                type: 'number',
            },
            isRequired: true,
        },
        total_found: {
            type: 'number',
            isRequired: true,
        },
        execution_time_ms: {
            type: 'number',
            isRequired: true,
        },
    },
} as const;
