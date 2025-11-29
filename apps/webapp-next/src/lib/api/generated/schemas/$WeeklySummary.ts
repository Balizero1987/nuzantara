/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $WeeklySummary = {
    description: `Weekly work summary`,
    properties: {
        user_id: {
            type: 'string',
            isRequired: true,
        },
        email: {
            type: 'string',
            isRequired: true,
        },
        week_start: {
            type: 'string',
            isRequired: true,
        },
        days_worked: {
            type: 'number',
            isRequired: true,
        },
        total_hours: {
            type: 'number',
            isRequired: true,
        },
        avg_hours_per_day: {
            type: 'number',
            isRequired: true,
        },
    },
} as const;
