/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthResponse } from '../models/HealthResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class HealthService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Health Check
     * System health check - Non-blocking during startup.
     *
     * Returns "initializing" immediately if service not ready.
     * Prevents container crashes during warmup by not creating heavy objects.
     * @returns HealthResponse Successful Response
     * @throws ApiError
     */
    public healthCheckHealthGet(): CancelablePromise<HealthResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Detailed Health
     * Detailed health check showing all service statuses.
     *
     * Returns comprehensive information about each service for debugging
     * and monitoring purposes. Includes:
     * - Individual service status (healthy/degraded/unavailable)
     * - Error messages for failed services
     * - Database connectivity check
     * - Overall system health assessment
     *
     * Returns:
     * dict: Detailed health status with per-service breakdown
     * @returns any Successful Response
     * @throws ApiError
     */
    public detailedHealthHealthDetailedGet(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/health/detailed',
        });
    }
    /**
     * Readiness Check
     * Kubernetes-style readiness probe.
     *
     * Returns 200 only if critical services are ready to handle traffic.
     * Used by load balancers to determine if instance should receive traffic.
     *
     * Returns:
     * dict: Readiness status with critical service check
     * @returns any Successful Response
     * @throws ApiError
     */
    public readinessCheckHealthReadyGet(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/health/ready',
        });
    }
    /**
     * Liveness Check
     * Kubernetes-style liveness probe.
     *
     * Returns 200 if the application is running (even if not fully ready).
     * Used by orchestrators to determine if instance needs restart.
     *
     * Returns:
     * dict: Liveness status
     * @returns any Successful Response
     * @throws ApiError
     */
    public livenessCheckHealthLiveGet(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/health/live',
        });
    }
    /**
     * Debug Config
     * TEMPORARY: Debug endpoint to check loaded configuration.
     * Shows what API keys and config the backend actually loaded.
     * @returns any Successful Response
     * @throws ApiError
     */
    public debugConfigHealthDebugConfigGet(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/health/debug/config',
        });
    }
}
