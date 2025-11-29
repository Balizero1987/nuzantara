/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $IngestRequest = {
    description: `Bulk ingest request`,
    properties: {
        collection: {
            type: 'string',
            description: `Target collection name`,
        },
        documents: {
            type: 'array',
            contains: {
                type: 'DocumentChunk',
            },
            isRequired: true,
        },
        batch_size: {
            type: 'number',
            description: `Batch size for ingestion`,
            maximum: 500,
            minimum: 10,
        },
    },
} as const;
