import { z } from "zod";

const DEFAULT_INTERNAL_API_KEY = 'zantara-internal-dev-key-2025';
const DEFAULT_EXTERNAL_API_KEY = 'zantara-external-dev-key-2025';

const envSchema = z.object({
  PORT: z.string().default("8080"),
  NODE_ENV: z.string().default("production"),
  OWNER_EMAIL: z.string().email().default("zero@balizero.com"),
  API_KEYS_INTERNAL: z.string().default(DEFAULT_INTERNAL_API_KEY), // comma-separated
  API_KEYS_EXTERNAL: z.string().default(DEFAULT_EXTERNAL_API_KEY), // comma-separated
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional(),
  GDRIVE_AMBARADAM_DRIVE_ID: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

function buildKeyList(raw: string, placeholder: string, label: string) {
  const keys = raw.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (keys.includes(placeholder) && parsed.NODE_ENV !== 'test') {
    console.warn(`[config] ${label} is using the placeholder value. Set ${label} in your environment.`);
  }

  return keys;
}

export const ENV = {
  ...parsed,
  INTERNAL_KEYS: buildKeyList(parsed.API_KEYS_INTERNAL, DEFAULT_INTERNAL_API_KEY, 'API_KEYS_INTERNAL'),
  EXTERNAL_KEYS: buildKeyList(parsed.API_KEYS_EXTERNAL, DEFAULT_EXTERNAL_API_KEY, 'API_KEYS_EXTERNAL'),
};
