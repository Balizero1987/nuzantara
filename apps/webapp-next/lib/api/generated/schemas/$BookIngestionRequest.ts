/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $BookIngestionRequest = {
    description: `Request to ingest a single book`,
    properties: {
        file_path: {
            type: 'string',
            isRequired: true,
        },
        title: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        author: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        language: {
            type: 'string',
        },
        tier_override: {
            type: 'any-of',
            contains: [{
                type: 'TierLevel',
            }, {
                type: 'null',
            }],
        },
    },
} as const;
