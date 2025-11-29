/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $TemplateNotificationRequest = {
    properties: {
        template_id: {
            type: 'string',
            description: `Template ID (e.g., compliance_60_days)`,
            isRequired: true,
        },
        recipient_id: {
            type: 'string',
            isRequired: true,
        },
        recipient_email: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        recipient_phone: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        recipient_whatsapp: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        template_data: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
        },
    },
} as const;
