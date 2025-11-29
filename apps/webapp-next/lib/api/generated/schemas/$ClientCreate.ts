/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ClientCreate = {
    properties: {
        full_name: {
            type: 'string',
            isRequired: true,
        },
        email: {
            type: 'any-of',
            contains: [{
                type: 'string',
                format: 'email',
            }, {
                type: 'null',
            }],
        },
        phone: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        whatsapp: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        nationality: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        passport_number: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        client_type: {
            type: 'string',
        },
        assigned_to: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        address: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        notes: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        tags: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        custom_fields: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
        },
    },
} as const;
