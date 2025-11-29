/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $SearchResponse = {
    description: `Search response model`,
    properties: {
        query: {
            type: 'string',
            isRequired: true,
        },
        results: {
            type: 'array',
            contains: {
                type: 'SearchResult',
            },
            isRequired: true,
        },
        total_found: {
            type: 'number',
            isRequired: true,
        },
        user_level: {
            type: 'number',
            isRequired: true,
        },
        execution_time_ms: {
            type: 'number',
            isRequired: true,
        },
    },
} as const;
