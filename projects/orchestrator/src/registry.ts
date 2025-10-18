import { PostProcessor } from './types';
import { DrivePostProcessor } from './postprocessors/drive-postprocessor';
import { SlackPostProcessor } from './postprocessors/slack-postprocessor';

export class ProcessorRegistry {
  private processors: PostProcessor[] = [];

  constructor() {
    this.registerDefaultProcessors();
  }

  private registerDefaultProcessors(): void {
    this.register(new DrivePostProcessor());
    this.register(new SlackPostProcessor());
  }

  register(processor: PostProcessor): void {
    this.processors.push(processor);
  }

  getProcessors(integration: string): PostProcessor[] {
    return this.processors.filter(p => p.supports(integration));
  }

  getAllProcessors(): PostProcessor[] {
    return [...this.processors];
  }

  getProcessorNames(): string[] {
    return this.processors.map(p => p.name);
  }
}

export default ProcessorRegistry;