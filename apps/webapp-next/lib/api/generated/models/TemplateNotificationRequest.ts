/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TemplateNotificationRequest = {
  /**
   * Template ID (e.g., compliance_60_days)
   */
  template_id: string;
  recipient_id: string;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  recipient_whatsapp?: string | null;
  /**
   * Data to fill template
   */
  template_data?: Record<string, any>;
};
