import axios, { AxiosResponse } from 'axios';
import { ZantaraRequest, ZantaraResponse } from './types';
import config from './config';
import logger from './logger';

export class ZantaraClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.zantaraGatewayUrl;
    this.apiKey = config.zantaraApiKey;
    this.timeout = 30000; // 30 seconds
  }

  async call(request: ZantaraRequest): Promise<ZantaraResponse> {
    const startTime = Date.now();

    try {
      logger.info({ integration: request.key, params: request.params }, 'Calling ZANTARA');

      const response: AxiosResponse<ZantaraResponse> = await axios.post(
        `${this.baseUrl}/call`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'User-Agent': 'ZANTARA-Orchestrator/1.0.0'
          },
          timeout: this.timeout,
          validateStatus: (status) => status < 500 // Accept 4xx as valid responses
        }
      );

      const executionTime = Date.now() - startTime;

      logger.info({
        integration: request.key,
        executionTime,
        status: response.status,
        ok: response.data.ok
      }, 'ZANTARA response received');

      return response.data;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      logger.error({
        integration: request.key,
        error: error.message,
        executionTime,
        code: error.code,
        status: error.response?.status
      }, 'ZANTARA call failed');

      return {
        ok: false,
        error: `ZANTARA call failed: ${error.message}`,
        data: error.response?.data
      };
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; version?: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return {
        healthy: response.data.status === 'healthy',
        version: response.data.version
      };
    } catch (error) {
      logger.error({ error }, 'ZANTARA health check failed');
      return { healthy: false };
    }
  }
}