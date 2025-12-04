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
     * @param requestBody
     * @returns app__modules__identity__router__LoginResponse Successful Response
     * @throws ApiError
     */
    public teamLoginApiAuthTeamLoginPost(
        requestBody: app__modules__identity__router__LoginRequest,
    ): CancelablePromise<app__modules__identity__router__LoginResponse> {
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
