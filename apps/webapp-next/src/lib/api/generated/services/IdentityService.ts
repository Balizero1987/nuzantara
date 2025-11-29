/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { app__modules__identity__router__LoginRequest } from '../models/app__modules__identity__router__LoginRequest';
import type { app__modules__identity__router__LoginResponse } from '../models/app__modules__identity__router__LoginResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class IdentityService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Seed Team Endpoint
     * TEMPORARY: Seed team members database
     * TODO: Remove this endpoint after seeding
     * @returns any Successful Response
     * @throws ApiError
     */
    public seedTeamEndpointApiAuthTeamSeedTeamPost(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/team/seed-team',
        });
    }
    /**
     * Run Migration 010
     * TEMPORARY: Execute migration 010 to fix team_members schema
     * TODO: Remove this endpoint after migration is applied
     * @returns any Successful Response
     * @throws ApiError
     */
    public runMigration010ApiAuthTeamRunMigration010Post(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/team/run-migration-010',
        });
    }
    /**
     * Debug Auth
     * TEMPORARY: Debug authentication - analizza l'hash nel database
     * TODO: Remove this endpoint after debugging
     * @returns any Successful Response
     * @throws ApiError
     */
    public debugAuthApiAuthTeamDebugAuthGet(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/auth/team/debug-auth',
        });
    }
    /**
     * Reset Admin User
     * TEMPORARY: Reset admin user (zero@balizero.com) with PIN 010719
     * TODO: Remove this endpoint after admin is set up
     * @returns any Successful Response
     * @throws ApiError
     */
    public resetAdminUserApiAuthTeamResetAdminPost(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/team/reset-admin',
        });
    }
    /**
     * Team Login
     * Team member login endpoint
     *
     * Replicates the exact behavior of Node.js /api/auth/team/login endpoint.
     *
     * - Validates email and PIN format
     * - Authenticates user against database
     * - Generates JWT token (7 days expiry)
     * - Returns user data and permissions
     *
     * Returns:
     * LoginResponse with JWT token and user data
     * @returns app__modules__identity__router__LoginResponse Successful Response
     * @throws ApiError
     */
    public teamLoginApiAuthTeamLoginPost({
        requestBody,
    }: {
        requestBody: app__modules__identity__router__LoginRequest,
    }): CancelablePromise<app__modules__identity__router__LoginResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/team/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
