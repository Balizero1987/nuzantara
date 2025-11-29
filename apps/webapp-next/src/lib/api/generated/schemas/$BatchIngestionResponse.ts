/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $BatchIngestionResponse = {
    description: `Response from batch ingestion`,
    properties: {
        total_books: {
            type: 'number',
            isRequired: true,
        },
        successful: {
            type: 'number',
            isRequired: true,
        },
        failed: {
            type: 'number',
            isRequired: true,
        },
        results: {
            type: 'array',
            contains: {
                type: 'BookIngestionResponse',
            },
            isRequired: true,
        },
        execution_time_seconds: {
            type: 'number',
            isRequired: true,
        },
    },
} as const;
