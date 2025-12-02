/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeedbackRequest } from '../models/FeedbackRequest';
import type { OracleQueryRequest } from '../models/OracleQueryRequest';
import type { OracleQueryResponse } from '../models/OracleQueryResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class OracleV53UltraHybridService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Hybrid Oracle Query
   * Ultra Hybrid Oracle Query - v5.3
   *
   * Integrates Qdrant search, Google Drive, and Gemini reasoning
   * with full user localization and context awareness
   * @param requestBody
   * @returns OracleQueryResponse Successful Response
   * @throws ApiError
   */
  public hybridOracleQueryApiOracleQueryPost(
    requestBody: OracleQueryRequest
  ): CancelablePromise<OracleQueryResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/oracle/query',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Submit User Feedback
   * Submit user feedback for continuous learning and system improvement
   * Stores feedback for training data and model refinement
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public submitUserFeedbackApiOracleFeedbackPost(
    requestBody: FeedbackRequest
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/oracle/feedback',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Oracle Health Check
   * Health check for Oracle v5.3 services
   * Verifies all integrated components are operational
   * @returns any Successful Response
   * @throws ApiError
   */
  public oracleHealthCheckApiOracleHealthGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/oracle/health',
    });
  }
  /**
   * Get User Profile Endpoint
   * Get user profile with localization preferences
   * Integrates with PostgreSQL user management system
   * @param userEmail
   * @returns any Successful Response
   * @throws ApiError
   */
  public getUserProfileEndpointApiOracleUserProfileUserEmailGet(
    userEmail: string
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/oracle/user/profile/{user_email}',
      path: {
        user_email: userEmail,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Test Drive Connection
   * Test Google Drive integration
   * @returns any Successful Response
   * @throws ApiError
   */
  public testDriveConnectionApiOracleDriveTestGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/oracle/drive/test',
    });
  }
  /**
   * Get Personalities
   * Get available AI personalities
   * @returns any Successful Response
   * @throws ApiError
   */
  public getPersonalitiesApiOraclePersonalitiesGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/oracle/personalities',
    });
  }
  /**
   * Test Personality
   * Test a specific personality
   * @param personalityType
   * @param message
   * @returns any Successful Response
   * @throws ApiError
   */
  public testPersonalityApiOraclePersonalityTestPost(
    personalityType: string,
    message: string
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/oracle/personality/test',
      query: {
        personality_type: personalityType,
        message: message,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Test Gemini Integration
   * Test Google Gemini integration
   * @returns any Successful Response
   * @throws ApiError
   */
  public testGeminiIntegrationApiOracleGeminiTestGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/oracle/gemini/test',
    });
  }
}
