/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { app__routers__auth__LoginRequest } from '../models/app__routers__auth__LoginRequest';
import type { app__routers__auth__LoginResponse } from '../models/app__routers__auth__LoginResponse';
import type { app__routers__auth__UserProfile } from '../models/app__routers__auth__UserProfile';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthenticationService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Login
     * User login with email and PIN
     *
     * Returns JWT token and user profile on successful authentication
     * @returns app__routers__auth__LoginResponse Successful Response
     * @throws ApiError
     */
    public loginApiAuthLoginPost({
        requestBody,
    }: {
        requestBody: app__routers__auth__LoginRequest,
    }): CancelablePromise<app__routers__auth__LoginResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Profile
     * Get current user profile
     * @returns app__routers__auth__UserProfile Successful Response
     * @throws ApiError
     */
    public getProfileApiAuthProfileGet(): CancelablePromise<app__routers__auth__UserProfile> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/auth/profile',
        });
    }
    /**
     * Logout
     * Logout user (server-side token invalidation would go here)
     * @returns any Successful Response
     * @throws ApiError
     */
    public logoutApiAuthLogoutPost(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/logout',
        });
    }
    /**
     * Check Auth
     * Check if current session is valid
     * @returns any Successful Response
     * @throws ApiError
     */
    public checkAuthApiAuthCheckGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/auth/check',
        });
    }
    /**
     * Get Csrf Token
     * Generate CSRF token and session ID for frontend security.
     * Returns token in both JSON body and response headers.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getCsrfTokenApiAuthCsrfTokenGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/auth/csrf-token',
        });
    }
}
