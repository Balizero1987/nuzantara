/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ImageGenerationResponse = {
    properties: {
        images: {
            type: 'array',
            contains: {
                type: 'string',
            },
            isRequired: true,
        },
        success: {
            type: 'boolean',
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
