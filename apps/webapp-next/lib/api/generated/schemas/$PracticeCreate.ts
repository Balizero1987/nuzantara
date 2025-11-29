/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $PracticeCreate = {
    properties: {
        client_id: {
            type: 'number',
            isRequired: true,
        },
        practice_type_code: {
            type: 'string',
            isRequired: true,
        },
        status: {
            type: 'string',
        },
        priority: {
            type: 'string',
        },
        quoted_price: {
            type: 'any-of',
            contains: [{
                type: 'number',
            }, {
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        assigned_to: {
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
        internal_notes: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
    },
} as const;
