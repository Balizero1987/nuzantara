/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $BatchIngestionRequest = {
    description: `Request to ingest multiple books`,
    properties: {
        directory_path: {
            type: 'string',
            isRequired: true,
        },
        file_patterns: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        skip_existing: {
            type: 'boolean',
        },
    },
} as const;
