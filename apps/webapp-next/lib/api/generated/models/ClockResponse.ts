/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Clock-in/out response
 */
export type ClockResponse = {
  success: boolean;
  action?: string | null;
  timestamp?: string | null;
  bali_time?: string | null;
  message: string;
  error?: string | null;
  hours_worked?: number | null;
};
