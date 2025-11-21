/**
 * Intel Scraper Handler
 * Trigger Bali intelligence scraping system
 * Integrates with Python scraper in apps/bali-intel-scraper/
 *
 * Features:
 * - 630+ sources across 12 categories
 * - AI-powered filtering (Llama 4 Scout + Gemini 2.0 Flash + Zantara AI fallback)
 * - Cost: ~$0.0004 per article with multi-model routing
 * - Generates professional Bali Zero Journal articles
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../../services/logger.js';

const SCRAPER_DIR = path.join(process.cwd(), 'apps', 'bali-intel-scraper');
const OUTPUT_DIR = path.join(SCRAPER_DIR, 'data');

interface ScraperParams {
  categories?: string[]; // Specific categories to scrape (default: all 12)
  runStage2?: boolean; // Run AI article generation (Llama + Gemini + Zantara fallback)
  dryRun?: boolean; // Test mode without actual scraping
  limit?: number; // Max articles per category (default: 10)
  maxArticles?: number; // Max total articles to generate (default: 100)
}

interface ScraperResult {
  success: boolean;
  jobId: string;
  status: 'started' | 'completed' | 'failed';
  categories?: string[];
  articlesScraped?: number;
  articlesFiltered?: number;
  filterEfficiency?: string;
  reportPath?: string;
  error?: string;
}

/**
 * Trigger intel scraping job
 */
export async function intelScraperRun(params: ScraperParams): Promise<ScraperResult> {
  try {
    const { categories = [], runStage2 = false, dryRun = false, limit = 10, maxArticles = 100 } = params;

    const jobId = `scraper_${Date.now()}`;
    logger.info(`Starting intel scraper job: ${jobId}`, { params });

    // Build Python command - use orchestrator for full pipeline
    const scriptPath = path.join(SCRAPER_DIR, 'scripts', 'orchestrator.py');
    const args: string[] = ['--stage', runStage2 ? 'all' : '1'];

    if (dryRun) {
      args.push('--dry-run');
    }

    if (categories.length > 0) {
      args.push('--categories', ...categories);
    }

    if (limit) {
      args.push('--scrape-limit', limit.toString());
    }

    if (maxArticles) {
      args.push('--max-articles', maxArticles.toString());
    }

    // Set environment variables
    const env = {
      ...process.env,
      RUN_STAGE2: runStage2 ? 'true' : 'false',
      JOB_ID: jobId,
      PYTHONUNBUFFERED: '1', // Real-time output
    };

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [scriptPath, ...args], {
        cwd: SCRAPER_DIR,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logger.info(`[${jobId}] ${output.trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        logger.error(`[${jobId}] ${error.trim()}`);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Parse results from stdout
          const stats = parseScraperOutput(stdout);

          resolve({
            success: true,
            jobId,
            status: 'completed',
            ...stats,
          });
        } else {
          resolve({
            success: false,
            jobId,
            status: 'failed',
            error: stderr || `Process exited with code ${code}`,
          });
        }
      });

      pythonProcess.on('error', (err) => {
        reject({
          success: false,
          jobId,
          status: 'failed',
          error: err.message,
        });
      });

      // For async jobs, resolve immediately with job ID
      if (runStage2) {
        resolve({
          success: true,
          jobId,
          status: 'started',
          categories: categories.length > 0 ? categories : ['all'],
        });
      }
    });
  } catch (error: any) {
    logger.error('Intel scraper error:', error);
    return {
      success: false,
      jobId: `error_${Date.now()}`,
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * Get scraper job status
 */
export async function intelScraperStatus(params: { jobId: string }) {
  try {
    const { jobId } = params;

    // Read report file if exists
    const reportPattern = `scraping_report_${jobId}.json`;
    const reportPath = path.join(OUTPUT_DIR, reportPattern);

    try {
      const reportData = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(reportData);

      return {
        success: true,
        jobId,
        status: 'completed',
        report,
      };
    } catch (err) {
      // Report not found, job might still be running
      return {
        success: true,
        jobId,
        status: 'running',
        message: 'Job in progress, report not yet available',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List available categories
 */
export async function intelScraperCategories() {
  try {
    const configPath = path.join(SCRAPER_DIR, 'config', 'categories.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    const categories = Object.entries(config.categories).map(([_, value]: [string, any]) => ({
      id: value.id,
      key: value.key,
      name: value.name,
      type: value.type,
      collaborator: value.collaborator,
    }));

    return {
      success: true,
      total: config.total_categories,
      regularCategories: config.regular_categories,
      llamaCategories: config.llama_categories,
      categories,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      categories: [],
    };
  }
}

/**
 * Parse scraper output to extract statistics
 */
function parseScraperOutput(output: string) {
  const stats = {
    articlesScraped: 0,
    articlesFiltered: 0,
    filterEfficiency: '0%',
  };

  try {
    // Extract numbers from output
    const scrapedMatch = output.match(/Total Scraped:\s*(\d+)/i);
    const filteredMatch = output.match(/Total Filtered:\s*(\d+)/i);
    const efficiencyMatch = output.match(/Filter Efficiency:\s*(\d+)%/i);

    if (scrapedMatch && scrapedMatch[1]) stats.articlesScraped = parseInt(scrapedMatch[1], 10);
    if (filteredMatch && filteredMatch[1]) stats.articlesFiltered = parseInt(filteredMatch[1], 10);
    if (efficiencyMatch && efficiencyMatch[1]) stats.filterEfficiency = `${efficiencyMatch[1]}%`;
  } catch (err) {
    logger.warn('Failed to parse scraper output stats', err);
  }

  return stats;
}
