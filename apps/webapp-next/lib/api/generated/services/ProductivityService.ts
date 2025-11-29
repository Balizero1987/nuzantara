/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CalendarEvent } from '../models/CalendarEvent';
import type { EmailDraft } from '../models/EmailDraft';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ProductivityService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Draft Email
     * Draft an email in Gmail
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public draftEmailApiProductivityGmailDraftPost(
        requestBody: EmailDraft,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/productivity/gmail/draft',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Schedule Meeting
     * Schedule a meeting in Google Calendar
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public scheduleMeetingApiProductivityCalendarSchedulePost(
        requestBody: CalendarEvent,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/productivity/calendar/schedule',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Events
     * List upcoming calendar events
     * @param limit
     * @returns any Successful Response
     * @throws ApiError
     */
    public listEventsApiProductivityCalendarEventsGet(
        limit: number = 10,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/productivity/calendar/events',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Drive
     * Search Google Drive files
     * @param query
     * @returns any Successful Response
     * @throws ApiError
     */
    public searchDriveApiProductivityDriveSearchGet(
        query: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/productivity/drive/search',
            query: {
                'query': query,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
