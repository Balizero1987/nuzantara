/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $PracticeUpdate = {
    properties: {
        status: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        priority: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
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
        actual_price: {
            type: 'any-of',
            contains: [{
                type: 'number',
            }, {
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        payment_status: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        paid_amount: {
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
        start_date: {
            type: 'any-of',
            contains: [{
                type: 'string',
                format: 'date-time',
            }, {
                type: 'null',
            }],
        },
        completion_date: {
            type: 'any-of',
            contains: [{
                type: 'string',
                format: 'date-time',
            }, {
                type: 'null',
            }],
        },
        expiry_date: {
            type: 'any-of',
            contains: [{
                type: 'string',
                format: 'date',
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
        documents: {
            type: 'any-of',
            contains: [{
                type: 'null',
            }],
        },
        missing_documents: {
            type: 'any-of',
            contains: [{
                type: 'array',
                contains: {
                    type: 'string',
                },
            }, {
                type: 'null',
            }],
        },
    },
} as const;
