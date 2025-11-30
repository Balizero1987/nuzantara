/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClockInRequest } from '../models/ClockInRequest';
import type { ClockOutRequest } from '../models/ClockOutRequest';
import type { ClockResponse } from '../models/ClockResponse';
import type { DailyHours } from '../models/DailyHours';
import type { MonthlySummary } from '../models/MonthlySummary';
import type { TeamMemberStatus } from '../models/TeamMemberStatus';
import type { UserStatusResponse } from '../models/UserStatusResponse';
import type { WeeklySummary } from '../models/WeeklySummary';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class TeamActivityService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Clock In
     * Clock in for work day
     *
     * Team members use this to start their work day.
     * One clock-in per day allowed.
     * @returns ClockResponse Successful Response
     * @throws ApiError
     */
    public clockInApiTeamClockInPost({
        requestBody,
    }: {
        requestBody: ClockInRequest,
    }): CancelablePromise<ClockResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/clock-in',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clock Out
     * Clock out for work day
     *
     * Team members use this to end their work day.
     * Must be clocked in first.
     * @returns ClockResponse Successful Response
     * @throws ApiError
     */
    public clockOutApiTeamClockOutPost({
        requestBody,
    }: {
        requestBody: ClockOutRequest,
    }): CancelablePromise<ClockResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/clock-out',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get My Status
     * Get my current work status
     *
     * Returns:
     * - Current online/offline status
     * - Today's hours worked
     * - This week's summary
     * @returns UserStatusResponse Successful Response
     * @throws ApiError
     */
    public getMyStatusApiTeamMyStatusGet({
        userId,
    }: {
        /**
         * User ID
         */
        userId: string,
    }): CancelablePromise<UserStatusResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/my-status',
            query: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Team Status
     * Get current online status of all team members (ADMIN ONLY)
     *
     * Shows who is currently clocked in and who is offline.
     * @returns TeamMemberStatus Successful Response
     * @throws ApiError
     */
    public getTeamStatusApiTeamStatusGet({
        authorization,
        xUserEmail,
    }: {
        authorization?: (string | null),
        xUserEmail?: (string | null),
    }): CancelablePromise<Array<TeamMemberStatus>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/status',
            headers: {
                '-authorization': authorization,
                'x-user-email': xUserEmail,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Daily Hours
     * Get work hours for a specific date (ADMIN ONLY)
     *
     * Returns all team members' work hours for the specified date.
     * @returns DailyHours Successful Response
     * @throws ApiError
     */
    public getDailyHoursApiTeamHoursGet({
        date,
        authorization,
        xUserEmail,
    }: {
        /**
         * Date (YYYY-MM-DD, defaults to today)
         */
        date?: (string | null),
        authorization?: (string | null),
        xUserEmail?: (string | null),
    }): CancelablePromise<Array<DailyHours>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/hours',
            headers: {
                '-authorization': authorization,
                'x-user-email': xUserEmail,
            },
            query: {
                'date': date,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Weekly Summary
     * Get weekly work summary (ADMIN ONLY)
     *
     * Returns total hours, days worked, and averages for each team member.
     * @returns WeeklySummary Successful Response
     * @throws ApiError
     */
    public getWeeklySummaryApiTeamActivityWeeklyGet({
        weekStart,
        authorization,
        xUserEmail,
    }: {
        /**
         * Week start date (YYYY-MM-DD)
         */
        weekStart?: (string | null),
        authorization?: (string | null),
        xUserEmail?: (string | null),
    }): CancelablePromise<Array<WeeklySummary>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/activity/weekly',
            headers: {
                '-authorization': authorization,
                'x-user-email': xUserEmail,
            },
            query: {
                'week_start': weekStart,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Monthly Summary
     * Get monthly work summary (ADMIN ONLY)
     *
     * Returns total hours, days worked, and averages for each team member.
     * @returns MonthlySummary Successful Response
     * @throws ApiError
     */
    public getMonthlySummaryApiTeamActivityMonthlyGet({
        monthStart,
        authorization,
        xUserEmail,
    }: {
        /**
         * Month start date (YYYY-MM-DD)
         */
        monthStart?: (string | null),
        authorization?: (string | null),
        xUserEmail?: (string | null),
    }): CancelablePromise<Array<MonthlySummary>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/activity/monthly',
            headers: {
                '-authorization': authorization,
                'x-user-email': xUserEmail,
            },
            query: {
                'month_start': monthStart,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Export Timesheet
     * Export timesheet data (ADMIN ONLY)
     *
     * Returns CSV file with all work hours in the specified date range.
     * @returns any Successful Response
     * @throws ApiError
     */
    public exportTimesheetApiTeamExportGet({
        startDate,
        endDate,
        format = 'csv',
        authorization,
        xUserEmail,
    }: {
        /**
         * Start date (YYYY-MM-DD)
         */
        startDate: string,
        /**
         * End date (YYYY-MM-DD)
         */
        endDate: string,
        /**
         * Export format (csv only for now)
         */
        format?: string,
        authorization?: (string | null),
        xUserEmail?: (string | null),
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/export',
            headers: {
                '-authorization': authorization,
                'x-user-email': xUserEmail,
            },
            query: {
                'start_date': startDate,
                'end_date': endDate,
                'format': format,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Health Check
     * Health check for team activity service
     * @returns any Successful Response
     * @throws ApiError
     */
    public healthCheckApiTeamHealthGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/health',
        });
    }
}
