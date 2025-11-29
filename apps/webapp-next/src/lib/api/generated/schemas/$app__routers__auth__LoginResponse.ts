/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $app__routers__auth__LoginResponse = {
    description: `Login response model`,
    properties: {
        success: {
            type: 'boolean',
            isRequired: true,
        },
        message: {
            type: 'string',
            isRequired: true,
        },
        data: {
            type: 'any-of',
            contains: [{
                type: 'dictionary',
                contains: {
                    properties: {
                    },
                },
            }, {
                type: 'null',
            }],
        },
    },
} as const;
