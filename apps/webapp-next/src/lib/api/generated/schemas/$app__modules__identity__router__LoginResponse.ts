/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $app__modules__identity__router__LoginResponse = {
    description: `Login response model (matches Node.js format exactly)`,
    properties: {
        success: {
            type: 'boolean',
            isRequired: true,
        },
        sessionId: {
            type: 'string',
            isRequired: true,
        },
        token: {
            type: 'string',
            isRequired: true,
        },
        user: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
            isRequired: true,
        },
        permissions: {
            type: 'array',
            contains: {
                type: 'string',
            },
            isRequired: true,
        },
        personalizedResponse: {
            type: 'boolean',
            isRequired: true,
        },
        loginTime: {
            type: 'string',
            isRequired: true,
        },
    },
} as const;
