import * as crypto from 'crypto';
import axios from 'axios';
import { JobRequest, JobResponse, JobExecution, ZantaraResponse } from './types';
import { ZantaraClient } from './zantara-client';
import ProcessorRegistry from './registry';
import config from './config';
import logger from './logger';

export class JobExecutor {
  private zantaraClient: ZantaraClient;
  private registry: ProcessorRegistry;
  private executions: Map<string, JobExecution> = new Map();

  constructor() {
    this.zantaraClient = new ZantaraClient();
    this.registry = new ProcessorRegistry();
  }

  async executeJob(jobRequest: JobRequest): Promise<JobResponse> {
    const jobId = crypto.randomBytes(16).toString('hex');
    const startTime = Date.now();

    const execution: JobExecution = {
      jobId,
      integration: jobRequest.integration,
      params: jobRequest.params,
      startTime,
      retries: 0,
      status: 'processing',
      errors: [],
      processedBy: []
    };

    this.executions.set(jobId, execution);

    logger.info({
      jobId,
      integration: jobRequest.integration,
      params: jobRequest.params
    }, 'Starting job execution');

    try {
      await this.prepareParams(jobRequest, execution);

      // Execute with retries
      let response = await this.executeWithRetries(jobRequest, execution);

      // Apply post-processors
      response = await this.applyPostProcessors(response, jobRequest, execution);

      // Update execution status
      execution.status = response.ok ? 'completed' : 'failed';
      execution.endTime = Date.now();
      execution.result = response;

      const jobResponse: JobResponse = {
        ok: response.ok,
        data: response.data,
        error: response.error,
        jobId,
        executionTime: execution.endTime - startTime,
        retries: execution.retries,
        processedBy: execution.processedBy
      };

      logger.info({
        jobId,
        ok: response.ok,
        executionTime: jobResponse.executionTime,
        retries: execution.retries,
        processedBy: execution.processedBy
      }, 'Job execution completed');

      return jobResponse;

    } catch (error: any) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.errors?.push(error.message);

      logger.error({
        jobId,
        error: error.message,
        executionTime: Date.now() - startTime
      }, 'Job execution failed');

      return {
        ok: false,
        error: `Job execution failed: ${error.message}`,
        jobId,
        executionTime: Date.now() - startTime,
        retries: execution.retries,
        processedBy: execution.processedBy
      };
    }
  }

  private async prepareParams(jobRequest: JobRequest, execution: JobExecution): Promise<void> {
    const params = jobRequest.params || {};

    const ensureMedia = () => {
      if (!params.media) {
        params.media = {};
      }
      return params.media;
    };

    // Legacy support: contentBase64 -> media.body
    if (params.contentBase64) {
      const media = ensureMedia();
      if (!media.body) {
        media.body = params.contentBase64;
      }
      delete params.contentBase64;
    }

    // Handle media.fileUrl
    if (params.media?.fileUrl) {
      try {
        const fileUrl = params.media.fileUrl;
        logger.info({ jobId: execution.jobId, fileUrl }, 'Downloading file for media.fileUrl');
        const response = await axios.get<ArrayBuffer>(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data as ArrayBuffer);
        const media = ensureMedia();
        media.body = buffer.toString('base64');
        media.mimeType = media.mimeType || response.headers['content-type'] || params.mimeType || 'application/octet-stream';
        params.mimeType = params.mimeType || media.mimeType;
        delete media.fileUrl;
      } catch (error: any) {
        throw new Error(`Failed to download media.fileUrl: ${error.message}`);
      }
    }

    // Handle top-level fileUrl
    if (params.fileUrl) {
      try {
        const fileUrl = params.fileUrl;
        logger.info({ jobId: execution.jobId, fileUrl }, 'Downloading file for params.fileUrl');
        const response = await axios.get<ArrayBuffer>(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data as ArrayBuffer);
        const media = ensureMedia();
        media.body = buffer.toString('base64');
        media.mimeType = media.mimeType || response.headers['content-type'] || params.mimeType || 'application/octet-stream';
        params.mimeType = params.mimeType || media.mimeType;
        delete params.fileUrl;
      } catch (error: any) {
        throw new Error(`Failed to download fileUrl: ${error.message}`);
      }
    }

    // Sanity check: ensure media.body exists if media is provided
    if (params.media && !params.media.body) {
      throw new Error('media.body is required when media is provided');
    }

    jobRequest.params = params;
  }

  private async executeWithRetries(
    jobRequest: JobRequest,
    execution: JobExecution
  ): Promise<ZantaraResponse> {
    const maxRetries = jobRequest.options?.retries ?? config.maxRetries;
    let lastError: string = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      execution.retries = attempt;

      try {
        const response = await this.zantaraClient.call({
          key: jobRequest.integration,
          params: jobRequest.params
        });

        if (response.ok) {
          return response;
        }

        lastError = response.error || 'Unknown error';

        if (attempt < maxRetries) {
          const delay = config.retryDelay * Math.pow(2, attempt); // Exponential backoff
          logger.warn({
            jobId: execution.jobId,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            delay,
            error: lastError
          }, 'Retrying job after failure');

          await this.sleep(delay);
        }

      } catch (error: any) {
        lastError = error.message;
        execution.errors?.push(`Attempt ${attempt + 1}: ${error.message}`);

        if (attempt < maxRetries) {
          const delay = config.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    return {
      ok: false,
      error: `Failed after ${maxRetries + 1} attempts. Last error: ${lastError}`
    };
  }

  private async applyPostProcessors(
    response: ZantaraResponse,
    jobRequest: JobRequest,
    execution: JobExecution
  ): Promise<ZantaraResponse> {
    const processors = this.registry.getProcessors(jobRequest.integration);

    if (processors.length === 0) {
      return response;
    }

    let processedResponse = response;

    for (const processor of processors) {
      try {
        logger.debug({
          jobId: execution.jobId,
          processor: processor.name,
          integration: jobRequest.integration
        }, 'Applying post-processor');

        processedResponse = await processor.process(processedResponse, jobRequest.params);
        execution.processedBy.push(processor.name);

      } catch (error: any) {
        logger.error({
          jobId: execution.jobId,
          processor: processor.name,
          error: error.message
        }, 'Post-processor failed');

        // Continue with other processors, don't fail the entire job
        execution.errors?.push(`Post-processor ${processor.name}: ${error.message}`);
      }
    }

    return processedResponse;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getExecution(jobId: string): JobExecution | undefined {
    return this.executions.get(jobId);
  }

  getAllExecutions(): JobExecution[] {
    return Array.from(this.executions.values());
  }

  clearCompletedExecutions(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    for (const [jobId, execution] of this.executions.entries()) {
      if (execution.endTime && execution.endTime < cutoff) {
        this.executions.delete(jobId);
      }
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const zantaraHealth = await this.zantaraClient.healthCheck();

    return {
      healthy: zantaraHealth.healthy,
      details: {
        zantara: zantaraHealth,
        orchestrator: {
          activeJobs: Array.from(this.executions.values()).filter(e => e.status === 'processing').length,
          totalExecutions: this.executions.size,
          registeredProcessors: this.registry.getProcessorNames()
        }
      }
    };
  }
}
