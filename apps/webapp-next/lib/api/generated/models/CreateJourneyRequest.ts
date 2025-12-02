/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type CreateJourneyRequest = {
  /**
   * Journey type: pt_pma_setup, kitas_application, property_purchase
   */
  journey_type: string;
  /**
   * Client ID
   */
  client_id: string;
  /**
   * Custom journey steps
   */
  custom_steps?: null;
};
