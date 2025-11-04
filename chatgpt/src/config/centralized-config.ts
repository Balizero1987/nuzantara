import z from 'zod';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console(), new transports.File({ filename: 'config-changes.log' })],
});

const configSchema = z.object({
  port: z.number().default(3000),
  environment: z.enum(['development', 'staging', 'production']),
  database: z.object({
    host: z.string(),
    port: z.number(),
    user: z.string(),
    password: z.string(),
  }),
  jwtSecret: z.string(),
  cors: z.object({
    allowedOrigins: z.array(z.string()),
  }),
});

type Config = z.infer<typeof configSchema>;

class CentralizedConfig {
  private config: Config;
  private static instance: CentralizedConfig;

  private constructor() {
    const env = process.env.NODE_ENV || 'development';
    const configPath = `/Users/antonellosiano/Desktop/chatgpt/config/${env}.yaml`;
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found for environment: ${env}`);
    }
    const configData = yaml.load(fs.readFileSync(configPath, 'utf8'));
    this.config = configSchema.parse(configData);
    logger.info('Configuration loaded successfully', { environment: env });

    if (env !== 'production') {
      fs.watch(configPath, (eventType) => {
        if (eventType === 'change') {
          try {
            const updatedConfigData = yaml.load(fs.readFileSync(configPath, 'utf8'));
            const updatedConfig = configSchema.parse(updatedConfigData);
            this.config = updatedConfig;
            logger.info('Configuration hot-reloaded successfully');
          } catch (error) {
            logger.error('Error hot-reloading configuration:', error);
          }
        }
      });
    }
  }

  public static getInstance(): CentralizedConfig {
    if (!CentralizedConfig.instance) {
      CentralizedConfig.instance = new CentralizedConfig();
    }
    return CentralizedConfig.instance;
  }

  public get<T extends keyof Config>(key: T): Config[T] {
    return this.config[key];
  }

  public getAll(): Config {
    return this.config;
  }
}

export { CentralizedConfig };
export const config = CentralizedConfig.getInstance();
