/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $StoreMemoryRequest = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
        },
        document: {
            type: 'string',
            isRequired: true,
        },
        embedding: {
            type: 'array',
            contains: {
                type: 'number',
            },
            isRequired: true,
        },
        metadata: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
            isRequired: true,
        },
    },
} as const;
