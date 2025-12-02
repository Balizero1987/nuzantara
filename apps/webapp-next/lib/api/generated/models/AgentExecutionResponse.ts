/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AgentExecutionResponse = {
  execution_id: string;
  agent_name: string;
  status: string;
  message: string;
  started_at: string;
  completed_at?: string | null;
  result?: Record<string, any> | null;
  error?: string | null;
};
