/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ChunkMetadata = {
    description: `Metadata for each text chunk`,
    properties: {
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
        min_level: {
            type: 'number',
            isRequired: true,
            maximum: 3,
        },
        chunk_index: {
            type: 'number',
            isRequired: true,
        },
        page_number: {
            type: 'any-of',
            contains: [{
                type: 'number',
            }, {
                type: 'null',
            }],
        },
        language: {
            type: 'string',
        },
        topics: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        file_path: {
            type: 'string',
            isRequired: true,
        },
        total_chunks: {
            type: 'number',
            isRequired: true,
        },
    },
} as const;
