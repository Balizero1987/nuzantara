/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type AddComplianceItemRequest = {
  client_id: string;
  /**
   * visa_expiry, tax_filing, license_renewal, etc
   */
  compliance_type: string;
  title: string;
  description: string;
  /**
   * Deadline date (YYYY-MM-DD)
   */
  deadline: string;
  estimated_cost?: number | null;
  required_documents?: Array<string>;
};
