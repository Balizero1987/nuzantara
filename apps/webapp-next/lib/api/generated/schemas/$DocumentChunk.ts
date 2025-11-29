/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $DocumentChunk = {
    description: `Single document chunk to ingest`,
    properties: {
        content: {
            type: 'string',
            description: `Document content (text)`,
            isRequired: true,
            minLength: 10,
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
