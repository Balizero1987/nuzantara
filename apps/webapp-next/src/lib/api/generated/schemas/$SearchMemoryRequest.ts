/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $SearchMemoryRequest = {
    properties: {
        query_embedding: {
            type: 'array',
            contains: {
                type: 'number',
            },
            isRequired: true,
        },
        limit: {
            type: 'number',
        },
        metadata_filter: {
            type: 'any-of',
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
