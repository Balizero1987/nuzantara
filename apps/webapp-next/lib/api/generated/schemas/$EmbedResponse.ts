/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $EmbedResponse = {
    properties: {
        embedding: {
            type: 'array',
            contains: {
                type: 'number',
            },
            isRequired: true,
        },
        dimensions: {
            type: 'number',
            isRequired: true,
        },
        model: {
            type: 'string',
            isRequired: true,
        },
    },
} as const;
