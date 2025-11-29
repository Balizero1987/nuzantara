/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $SearchQuery = {
    description: `Search request model`,
    properties: {
        query: {
            type: 'string',
            description: `Search query text`,
            isRequired: true,
            minLength: 1,
        },
        level: {
            type: 'number',
            description: `User access level (0-3)`,
            maximum: 3,
        },
        limit: {
            type: 'number',
            description: `Maximum results to return`,
            maximum: 50,
            minimum: 1,
        },
        tier_filter: {
            type: 'any-of',
            description: `Filter by specific tiers`,
            contains: [{
                type: 'array',
                contains: {
                    type: 'TierLevel',
                },
            }, {
                type: 'null',
            }],
        },
        collection: {
            type: 'any-of',
            description: `Optional specific collection to search`,
            contains: [{
                type: 'string',
            }, {
                type: 'null',
            }],
        },
    },
} as const;
