/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $SearchResult = {
    description: `Single search result`,
    properties: {
        text: {
            type: 'string',
            isRequired: true,
        },
        metadata: {
            type: 'ChunkMetadata',
            isRequired: true,
        },
        similarity_score: {
            type: 'number',
            isRequired: true,
            maximum: 1,
        },
    },
} as const;
