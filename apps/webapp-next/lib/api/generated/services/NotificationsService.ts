/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SendNotificationRequest } from '../models/SendNotificationRequest';
import type { TemplateNotificationRequest } from '../models/TemplateNotificationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class NotificationsService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get Notification Status
   * Get notification hub status and available channels
   * @returns any Successful Response
   * @throws ApiError
   */
  public getNotificationStatusApiNotificationsStatusGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/notifications/status',
    });
  }
  /**
   * List Notification Templates
   * List all available notification templates
   * @returns any Successful Response
   * @throws ApiError
   */
  public listNotificationTemplatesApiNotificationsTemplatesGet(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/notifications/templates',
    });
  }
  /**
   * Send Notification
   * Send a custom notification
   *
   * Auto-selects channels based on priority:
   * - low: In-app only
   * - normal: Email + In-app
   * - high: Email + WhatsApp + In-app
   * - urgent: Email + WhatsApp + SMS + In-app
   * - critical: All channels
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public sendNotificationApiNotificationsSendPost(
    requestBody: SendNotificationRequest
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/notifications/send',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Send Template Notification
   * Send notification using a predefined template
   *
   * Available templates:
   * - compliance_60_days: 60-day compliance reminder
   * - compliance_30_days: 30-day compliance alert
   * - compliance_7_days: 7-day urgent compliance alert
   * - journey_step_completed: Journey step completion
   * - journey_completed: Journey completion celebration
   * - document_request: Document request
   * - payment_reminder: Payment reminder
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public sendTemplateNotificationApiNotificationsSendTemplatePost(
    requestBody: TemplateNotificationRequest
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/notifications/send-template',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Test Notification Channels
   * Test notification channels with a test message
   *
   * Useful for verifying configuration
   * @param email
   * @param phone
   * @param whatsapp
   * @returns any Successful Response
   * @throws ApiError
   */
  public testNotificationChannelsApiNotificationsTestPost(
    email?: string | null,
    phone?: string | null,
    whatsapp?: string | null
  ): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/notifications/test',
      query: {
        email: email,
        phone: phone,
        whatsapp: whatsapp,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
