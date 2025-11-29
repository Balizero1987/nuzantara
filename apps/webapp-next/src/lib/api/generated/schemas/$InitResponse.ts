/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $InitResponse = {
    properties: {
        status: {
            type: 'string',
            isRequired: true,
        },
        collection: {
            type: 'string',
            isRequired: true,
        },
        qdrant_url: {
            type: 'string',
            isRequired: true,
        },
        total_memories: {
            type: 'number',
            isRequired: true,
        },
    },
} as const;
