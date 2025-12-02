/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type PracticeResponse = {
  id: number;
  uuid: string;
  client_id: number;
  practice_type_id: number;
  status: string;
  priority: string;
  quoted_price: string | null;
  actual_price: string | null;
  payment_status: string;
  assigned_to: string | null;
  start_date: string | null;
  completion_date: string | null;
  expiry_date: string | null;
  created_at: string;
};
