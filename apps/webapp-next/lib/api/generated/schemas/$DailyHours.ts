/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $DailyHours = {
    description: `Daily work hours`,
    properties: {
        user_id: {
            type: 'string',
            isRequired: true,
        },
        email: {
            type: 'string',
            isRequired: true,
        },
        date: {
            type: 'string',
            isRequired: true,
        },
        clock_in: {
            type: 'string',
            isRequired: true,
        },
        clock_out: {
            type: 'string',
            isRequired: true,
        },
        hours_worked: {
            type: 'number',
            isRequired: true,
        },
    },
} as const;
