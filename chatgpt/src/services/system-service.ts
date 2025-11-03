import { UnifiedMemorySystem } from '../memory/unified-memory-system.js';
import { UnifiedMemory, MemoryType } from '../memory/types.js';
import logger from '../lib/logger.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

export class SystemService {
  private readonly memory: UnifiedMemorySystem;

  constructor() {
    this.memory = new UnifiedMemorySystem();
  }

  public async getTranscriptions(): Promise<UnifiedMemory[]> {
    try {
      const allEvents = await this.memory.getAllMemories();
      // Assuming user interactions are stored as Episodic memory
      return allEvents.filter((event: UnifiedMemory) => event.type === MemoryType.EPISODIC);
    } catch (error) {
      logger.error('Error retrieving transcriptions from episodic memory:', error);
      throw new Error('Could not retrieve transcriptions.');
    }
  }

  public async getLogs(logType: 'error' | 'combined'): Promise<string> {
    const logFile = `${logType}.log`;
    const logPath = path.join(LOGS_DIR, logFile);

    try {
      await fs.access(logPath);
      const logContent = await fs.readFile(logPath, 'utf-8');
      return logContent;
    } catch (error) {
      logger.error(`Error reading log file: ${logFile}`, error);
      throw new Error(`Could not retrieve ${logType} logs.`);
    }
  }
}
