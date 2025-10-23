/**
 * Unified Scraper Handler
 * Integrates with new Nuzantara Unified Scraper API
 * Supports: Property, Immigration, Tax, News scrapers
 */

import axios, { AxiosError } from 'axios';
import logger from '../../services/logger.js';

const SCRAPER_API_URL = process.env.SCRAPER_API_URL || 'http://localhost:8001';

// ==================== Types ====================

export type ScraperType = 'property' | 'immigration' | 'tax' | 'news';

export interface ScraperRunParams {
  scraper_type: ScraperType;
  config_path?: string;
  run_async?: boolean;
  enable_ai?: boolean;
  categories?: string[];  // For news scraper
}

export interface ScraperStatus {
  job_id: string;
  scraper_type: ScraperType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  sources_attempted: number;
  sources_successful: number;
  items_scraped: number;
  items_saved: number;
  duration_seconds: number;
  error?: string;
}

export interface ScraperInfo {
  type: ScraperType;
  name: string;
  category: string;
  description: string;
}

export interface ScraperListResponse {
  scrapers: ScraperInfo[];
}

export interface JobsListResponse {
  total: number;
  jobs: ScraperStatus[];
}

// ==================== API Functions ====================

/**
 * Run a scraper job
 *
 * @example
 * const result = await scraperRun({
 *   scraper_type: 'property',
 *   run_async: true,
 *   enable_ai: true
 * });
 */
export async function scraperRun(params: ScraperRunParams): Promise<{
  success: boolean;
  data?: ScraperStatus;
  error?: string;
}> {
  try {
    const {
      scraper_type,
      config_path,
      run_async = true,
      enable_ai = true,
      categories
    } = params;

    logger.info(`Starting ${scraper_type} scraper`, { params });

    const response = await axios.post<ScraperStatus>(
      `${SCRAPER_API_URL}/api/scraper/run`,
      {
        scraper_type,
        config_path,
        run_async,
        enable_ai,
        categories
      },
      {
        timeout: run_async ? 10000 : 300000,  // 10s for async, 5min for sync
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`Scraper job started: ${response.data.job_id}`, {
      scraper_type,
      status: response.data.status
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    const errorMessage = handleAxiosError(error);
    logger.error('Scraper run failed:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get status of a scraper job
 *
 * @example
 * const status = await scraperStatus({ job_id: 'abc-123' });
 */
export async function scraperStatus(params: { job_id: string }): Promise<{
  success: boolean;
  data?: ScraperStatus;
  error?: string;
}> {
  try {
    const { job_id } = params;

    const response = await axios.get<ScraperStatus>(
      `${SCRAPER_API_URL}/api/scraper/status/${job_id}`,
      {
        timeout: 5000
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    const errorMessage = handleAxiosError(error);
    logger.error(`Failed to get job status:`, errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * List all available scrapers
 *
 * @example
 * const list = await scraperList();
 * console.log(list.data.scrapers);  // ['property', 'immigration', 'tax', 'news']
 */
export async function scraperList(): Promise<{
  success: boolean;
  data?: ScraperListResponse;
  error?: string;
}> {
  try {
    const response = await axios.get<ScraperListResponse>(
      `${SCRAPER_API_URL}/api/scraper/list`,
      {
        timeout: 5000
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    const errorMessage = handleAxiosError(error);
    logger.error('Failed to list scrapers:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * List all scraper jobs (active and completed)
 *
 * @example
 * const jobs = await scraperJobs();
 * console.log(jobs.data.total);  // 5
 */
export async function scraperJobs(): Promise<{
  success: boolean;
  data?: JobsListResponse;
  error?: string;
}> {
  try {
    const response = await axios.get<JobsListResponse>(
      `${SCRAPER_API_URL}/api/scraper/jobs`,
      {
        timeout: 5000
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    const errorMessage = handleAxiosError(error);
    logger.error('Failed to list jobs:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Check if scraper API is healthy
 *
 * @example
 * const health = await scraperHealth();
 * if (health.success) console.log('Scraper API is healthy');
 */
export async function scraperHealth(): Promise<{
  success: boolean;
  data?: { status: string; timestamp: string };
  error?: string;
}> {
  try {
    const response = await axios.get(
      `${SCRAPER_API_URL}/health`,
      {
        timeout: 5000
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    const errorMessage = handleAxiosError(error);

    return {
      success: false,
      error: errorMessage
    };
  }
}

// ==================== Helper Functions ====================

/**
 * Handle axios errors and return user-friendly messages
 */
function handleAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      // Server responded with error status
      const status = axiosError.response.status;
      const data: any = axiosError.response.data;

      if (data?.detail) {
        return `API Error (${status}): ${data.detail}`;
      }

      return `API Error (${status}): ${axiosError.message}`;
    } else if (axiosError.request) {
      // Request made but no response
      return `Connection Error: Cannot reach scraper API at ${SCRAPER_API_URL}. Is the service running?`;
    }
  }

  // Unknown error
  return error instanceof Error ? error.message : 'Unknown error occurred';
}

/**
 * Wait for job to complete (polling)
 *
 * @example
 * const result = await scraperRun({ scraper_type: 'property', run_async: true });
 * if (result.success && result.data) {
 *   const final = await waitForJobCompletion(result.data.job_id, 60000);
 * }
 */
export async function waitForJobCompletion(
  job_id: string,
  timeout_ms: number = 300000,  // 5 minutes default
  poll_interval_ms: number = 2000  // 2 seconds
): Promise<{
  success: boolean;
  data?: ScraperStatus;
  error?: string;
}> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout_ms) {
    const statusResult = await scraperStatus({ job_id });

    if (!statusResult.success) {
      return statusResult;
    }

    const status = statusResult.data!;

    if (status.status === 'completed' || status.status === 'failed') {
      return {
        success: status.status === 'completed',
        data: status,
        error: status.error
      };
    }

    // Still running, wait before polling again
    await new Promise(resolve => setTimeout(resolve, poll_interval_ms));
  }

  return {
    success: false,
    error: `Job ${job_id} timed out after ${timeout_ms}ms`
  };
}

// ==================== Convenience Functions ====================

/**
 * Run property scraper
 */
export async function runPropertyScraper(params?: {
  run_async?: boolean;
  enable_ai?: boolean;
  config_path?: string;
}) {
  return scraperRun({
    scraper_type: 'property',
    ...params
  });
}

/**
 * Run immigration scraper
 */
export async function runImmigrationScraper(params?: {
  run_async?: boolean;
  enable_ai?: boolean;
  config_path?: string;
}) {
  return scraperRun({
    scraper_type: 'immigration',
    ...params
  });
}

/**
 * Run tax scraper
 */
export async function runTaxScraper(params?: {
  run_async?: boolean;
  enable_ai?: boolean;
  config_path?: string;
}) {
  return scraperRun({
    scraper_type: 'tax',
    ...params
  });
}

/**
 * Run news scraper
 */
export async function runNewsScraper(params?: {
  run_async?: boolean;
  enable_ai?: boolean;
  config_path?: string;
  categories?: string[];
}) {
  return scraperRun({
    scraper_type: 'news',
    ...params
  });
}
