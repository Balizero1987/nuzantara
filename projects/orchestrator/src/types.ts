export interface JobRequest {
  integration: string;
  params: Record<string, any>;
  options?: {
    retries?: number;
    timeout?: number;
    idempotencyKey?: string;
  };
}

export interface JobResponse {
  ok: boolean;
  data?: any;
  error?: string;
  jobId: string;
  executionTime: number;
  retries: number;
  processedBy?: string[];
}

export interface ZantaraRequest {
  key: string;
  params: Record<string, any>;
}

export interface ZantaraResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

export interface PostProcessor {
  name: string;
  supports: (integration: string) => boolean;
  process: (response: ZantaraResponse, params: Record<string, any>) => Promise<ZantaraResponse>;
}

export interface JobExecution {
  jobId: string;
  integration: string;
  params: Record<string, any>;
  startTime: number;
  endTime?: number;
  retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ZantaraResponse;
  errors?: string[];
  processedBy: string[];
}