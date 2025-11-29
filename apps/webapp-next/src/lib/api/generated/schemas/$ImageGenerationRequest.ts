/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ImageGenerationRequest = {
    properties: {
        prompt: {
            type: 'string',
            isRequired: true,
        },
        number_of_images: {
            type: 'number',
        },
        aspect_ratio: {
            type: 'string',
        },
        safety_filter_level: {
            type: 'string',
        },
        person_generation: {
            type: 'string',
        },
    },
} as const;
