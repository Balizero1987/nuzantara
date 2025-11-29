/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $BookIngestionResponse = {
    description: `Response from book ingestion`,
    properties: {
        success: {
            type: 'boolean',
            isRequired: true,
        },
        book_title: {
            type: 'string',
            isRequired: true,
        },
        book_author: {
            type: 'string',
            isRequired: true,
        },
        tier: {
            type: 'TierLevel',
            isRequired: true,
        },
        chunks_created: {
            type: 'number',
            isRequired: true,
        },
        message: {
            type: 'string',
            isRequired: true,
        },
        error: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
    },
} as const;
