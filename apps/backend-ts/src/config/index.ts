import { logger } from '../logging/unified-logger.js';
import { z } from 'zod';

const DEFAULT_INTERNAL_API_KEY = 'zantara-internal-dev-key-2025';
const DEFAULT_EXTERNAL_API_KEY = 'zantara-external-dev-key-2025';

const envSchema = z.object({
  PORT: z.string().default('8080'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  OWNER_EMAIL: z.string().default('zero@balizero.com'),
  API_KEYS_INTERNAL: z.string().default(DEFAULT_INTERNAL_API_KEY), // comma-separated
  API_KEYS_EXTERNAL: z.string().default(DEFAULT_EXTERNAL_API_KEY), // comma-separated
  RAG_BACKEND_URL: z.string().url().default('https://nuzantara-rag.fly.dev'),
  HF_API_KEY: z.string().default(''),
  RUNPOD_API_KEY: z.string().default(''),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
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
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  // Database Configuration
  DATABASE_URL: z.string().url().optional(),
  // Redis Configuration
  REDIS_URL: z.string().url().optional(),
  // AI/LLM Keys
  GOOGLE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Memory Service
  MEMORY_SERVICE_URL: z.string().url().optional(),
  // TS Backend URL
  TS_BACKEND_URL: z.string().url().optional(),
  TS_INTERNAL_API_KEY: z.string().optional(),
});

// Parse and validate environment variables
// This will throw an error if validation fails (fail-fast)
let parsed: z.infer<typeof envSchema>;
try {
  parsed = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingFields = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
    logger.error('Environment variable validation failed:', new Error(`Missing or invalid environment variables:\n${missingFields}`));
    process.exit(1);
  }
  throw error;
}

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
