/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $IngestResponse = {
    description: `Ingest response`,
    properties: {
        success: {
            type: 'boolean',
            isRequired: true,
        },
        collection: {
            type: 'string',
            isRequired: true,
        },
        documents_ingested: {
            type: 'number',
            isRequired: true,
        },
        execution_time_ms: {
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
