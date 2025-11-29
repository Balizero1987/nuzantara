/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $AddComplianceItemRequest = {
    properties: {
        client_id: {
            type: 'string',
            isRequired: true,
        },
        compliance_type: {
            type: 'string',
            description: `visa_expiry, tax_filing, license_renewal, etc`,
            isRequired: true,
        },
        title: {
            type: 'string',
            isRequired: true,
        },
        description: {
            type: 'string',
            isRequired: true,
        },
        deadline: {
            type: 'string',
            description: `Deadline date (YYYY-MM-DD)`,
            isRequired: true,
        },
        estimated_cost: {
            type: 'any-of',
            contains: [{
                type: 'number',
            }, {
                type: 'null',
            }],
        },
        required_documents: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
    },
} as const;
