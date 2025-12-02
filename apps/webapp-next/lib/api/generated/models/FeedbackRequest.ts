/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * User feedback for continuous learning
 */
export type FeedbackRequest = {
  user_email: string;
  query_text: string;
  original_answer: string;
  user_correction?: string | null;
  /**
   * Type of feedback
   */
  feedback_type: string;
  /**
   * User satisfaction rating
   */
  rating: number;
  notes?: string | null;
  /**
   * Session identifier
   */
  session_id?: string | null;
};
