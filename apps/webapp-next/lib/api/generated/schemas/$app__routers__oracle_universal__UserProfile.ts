/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $app__routers__oracle_universal__UserProfile = {
    description: `User profile with localization preferences`,
    properties: {
        user_id: {
            type: 'string',
            isRequired: true,
        },
        email: {
            type: 'string',
            isRequired: true,
        },
        name: {
            type: 'string',
            isRequired: true,
        },
        role: {
            type: 'string',
            isRequired: true,
        },
        language: {
            type: 'string',
            description: `User's preferred response language`,
        },
        tone: {
            type: 'string',
            description: `Communication tone`,
        },
        complexity: {
            type: 'string',
            description: `Response complexity level`,
        },
        timezone: {
            type: 'string',
            description: `User's timezone`,
        },
        role_level: {
            type: 'string',
            description: `User's role level`,
        },
        meta_json: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
        },
    },
} as const;
