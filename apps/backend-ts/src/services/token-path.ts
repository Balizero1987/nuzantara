import * as path from 'path';
import * as fs from 'fs';

// Preferred mount location for Cloud Run secret
const SECRET_MOUNT_TOKENS_JSON = '/secrets/oauth2/tokens.json';
// Legacy local default
const LEGACY_LOCAL_TOKENS = './oauth2-tokens.json';

/**
 * Resolve the OAuth2 tokens file path.
 * Priority:
 * 1) OAUTH2_TOKENS_FILE env (absolute or relative)
 * 2) /secrets/oauth2/tokens.json if present (Cloud Run mount)
 * 3) ./oauth2-tokens.json (legacy local)
 */
export function getOAuth2TokensPath(): string {
  const configured = process.env.OAUTH2_TOKENS_FILE?.trim();
  if (configured) {
    return configured.startsWith('/')
      ? configured
      : path.resolve(process.cwd(), configured);
  }

  if (fs.existsSync(SECRET_MOUNT_TOKENS_JSON)) return SECRET_MOUNT_TOKENS_JSON;
  return LEGACY_LOCAL_TOKENS;
}

/**
 * Returns true if the token file exists on disk.
 */
export function hasOAuth2Tokens(fsMod: typeof import('fs')): boolean {
  try {
    return fsMod.existsSync(getOAuth2TokensPath());
  } catch {
    return false;
  }
}
