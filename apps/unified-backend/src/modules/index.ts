import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

export interface Module {
  name: string;
  router: Router;
  initialize?: () => Promise<void>;
}

export async function initializeModules(): Promise<Record<string, Module>> {
  const modules: Record<string, Module> = {};
  const modulesDir = path.join(__dirname);

  try {
    const dirs = await fs.readdir(modulesDir, { withFileTypes: true });

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        // Use .js extension for compiled modules, .ts for development
        const extension = process.env.NODE_ENV === 'production' ? 'index.js' : 'index.ts';
        const modulePath = path.join(modulesDir, dir.name, extension);

        try {
          const module = await import(modulePath);

          if (module.default && module.default.router) {
            // Initialize module if needed
            if (module.default.initialize) {
              await module.default.initialize();
            }

            modules[dir.name] = module.default;
            logger.info(`Loaded module: ${dir.name}`);
          }
        } catch (error) {
          logger.error(`Failed to load module ${dir.name}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error('Failed to read modules directory:', error);
  }

  return modules;
}
