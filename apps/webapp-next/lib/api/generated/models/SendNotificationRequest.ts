/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type SendNotificationRequest = {
  recipient_id: string;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  recipient_whatsapp?: string | null;
  title: string;
  message: string;
  priority?: string;
  channels?: Array<string> | null;
};
