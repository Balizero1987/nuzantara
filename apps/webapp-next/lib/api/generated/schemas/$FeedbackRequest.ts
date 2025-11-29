/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $FeedbackRequest = {
    description: `User feedback for continuous learning`,
    properties: {
        user_email: {
            type: 'string',
            isRequired: true,
        },
        query_text: {
            type: 'string',
            isRequired: true,
        },
        original_answer: {
            type: 'string',
            isRequired: true,
        },
        user_correction: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        feedback_type: {
            type: 'string',
            description: `Type of feedback`,
            isRequired: true,
        },
        rating: {
            type: 'number',
            description: `User satisfaction rating`,
            isRequired: true,
            maximum: 5,
            minimum: 1,
        },
        notes: {
            type: 'any-of',
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        session_id: {
            type: 'any-of',
            description: `Session identifier`,
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
    },
} as const;
