/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Clock-in request
 */
export type ClockInRequest = {
  /**
   * User identifier
   */
  user_id: string;
  /**
   * User email
   */
  email: string;
  /**
   * Optional metadata
   */
  metadata?: Record<string, any> | null;
};
