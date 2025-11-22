import { logger } from '../logging/unified-logger.js';
import { z } from 'zod';

const DEFAULT_INTERNAL_API_KEY = 'zantara-internal-dev-key-2025';
const DEFAULT_EXTERNAL_API_KEY = 'zantara-external-dev-key-2025';

const envSchema = z.object({
  PORT: z.string().default('8080'),
  NODE_ENV: z.string().default('production'),
  OWNER_EMAIL: z.string().default('zero@balizero.com'),
  API_KEYS_INTERNAL: z.string().default(DEFAULT_INTERNAL_API_KEY), // comma-separated
  API_KEYS_EXTERNAL: z.string().default(DEFAULT_EXTERNAL_API_KEY), // comma-separated
  RAG_BACKEND_URL: z.string().default('https://nuzantara-rag.fly.dev'),
  HF_API_KEY: z.string().default(''),
  RUNPOD_API_KEY: z.string().default(''),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(), // Legacy: Firebase is disabled but kept for backward compatibility
  // Autonomous Agents Cron Configuration
  ENABLE_CRON: z.string().optional(),
  CRON_TIMEZONE: z.string().default('Asia/Singapore'),
  CRON_SELF_HEALING: z.string().default('0 2 * * *'),
  CRON_AUTO_TESTS: z.string().default('0 3 * * *'),
  CRON_WEEKLY_PR: z.string().default('0 4 * * 0'),
  CRON_HEALTH_CHECK: z.string().default('*/15 * * * *'),
  CRON_DAILY_REPORT: z.string().default('0 9 * * *'),
  OPENROUTER_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

function buildKeyList(raw: string, placeholder: string, label: string) {
  const keys = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (keys.includes(placeholder) && parsed.NODE_ENV !== 'test') {
    logger.warn(
      `[config] ${label} is using the placeholder value. Set ${label} in your environment.`
    );
  }

  return keys;
}

export const ENV = {
  ...parsed,
  INTERNAL_KEYS: buildKeyList(
    parsed.API_KEYS_INTERNAL,
    DEFAULT_INTERNAL_API_KEY,
    'API_KEYS_INTERNAL'
  ),
  EXTERNAL_KEYS: buildKeyList(
    parsed.API_KEYS_EXTERNAL,
    DEFAULT_EXTERNAL_API_KEY,
    'API_KEYS_EXTERNAL'
  ),
  // Cron configuration
  CRON: {
    enabled: parsed.ENABLE_CRON === 'true' || parsed.NODE_ENV === 'production',
    timezone: parsed.CRON_TIMEZONE,
    schedules: {
      selfHealing: parsed.CRON_SELF_HEALING,
      autoTests: parsed.CRON_AUTO_TESTS,
      weeklyPR: parsed.CRON_WEEKLY_PR,
      healthCheck: parsed.CRON_HEALTH_CHECK,
      dailyReport: parsed.CRON_DAILY_REPORT,
    },
  },
};
