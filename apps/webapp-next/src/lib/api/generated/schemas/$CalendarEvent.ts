/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CalendarEvent = {
    properties: {
        title: {
            type: 'string',
            isRequired: true,
        },
        start_time: {
            type: 'string',
            isRequired: true,
        },
        duration_minutes: {
            type: 'number',
        },
        attendees: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
    },
} as const;
