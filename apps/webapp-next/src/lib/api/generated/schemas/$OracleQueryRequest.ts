/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $OracleQueryRequest = {
    description: `Universal Oracle query request with user context`,
    properties: {
        query: {
            type: 'string',
            description: `Natural language query`,
            isRequired: true,
            minLength: 3,
        },
        user_email: {
            type: 'any-of',
            description: `User email for personalization`,
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        language_override: {
            type: 'any-of',
            description: `Override user language preference`,
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        domain_hint: {
            type: 'any-of',
            description: `Optional domain hint for routing`,
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
        context_docs: {
            type: 'any-of',
            description: `Specific document IDs to analyze`,
            contains: [{
                type: 'array',
                contains: {
                    type: 'string',
                },
            }, {
                type: 'null',
            }],
        },
        use_ai: {
            type: 'boolean',
            description: `Enable AI reasoning`,
        },
        include_sources: {
            type: 'boolean',
            description: `Include source document references`,
        },
        response_format: {
            type: 'string',
            description: `Response format: 'structured' or 'conversational'`,
        },
        limit: {
            type: 'number',
            description: `Max document results`,
            maximum: 50,
            minimum: 1,
        },
        session_id: {
            type: 'any-of',
            description: `Session identifier for analytics`,
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
    },
} as const;
