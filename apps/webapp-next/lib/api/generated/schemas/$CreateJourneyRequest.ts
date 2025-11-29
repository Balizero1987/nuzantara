/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateJourneyRequest = {
    properties: {
        journey_type: {
            type: 'string',
            description: `Journey type: pt_pma_setup, kitas_application, property_purchase`,
            isRequired: true,
        },
        client_id: {
            type: 'string',
            description: `Client ID`,
            isRequired: true,
        },
        custom_steps: {
            type: 'any-of',
            description: `Custom journey steps`,
            contains: [{
                type: 'null',
            }],
        },
    },
} as const;
