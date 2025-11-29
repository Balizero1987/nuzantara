/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $app__modules__identity__router__LoginRequest = {
    description: `Login request model`,
    properties: {
        email: {
            type: 'string',
            description: `User email address`,
            isRequired: true,
            format: 'email',
        },
        pin: {
            type: 'string',
            description: `User PIN (4-8 digits)`,
            isRequired: true,
            maxLength: 8,
            minLength: 4,
        },
    },
} as const;
