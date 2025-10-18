export interface Config {
  port: number;
  zantaraGatewayUrl: string;
  zantaraApiKey: string;
  logLevel: string;
  maxRetries: number;
  retryDelay: number;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '8085'),
  zantaraGatewayUrl: process.env.ZANTARA_GATEWAY_URL || 'http://localhost:8080',
  zantaraApiKey: process.env.ZANTARA_API_KEY || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.RETRY_DELAY_MS || '1000')
};

// Validation
if (!config.zantaraApiKey) {
  throw new Error('ZANTARA_API_KEY environment variable is required');
}

export default config;