import { PostProcessor, ZantaraResponse } from '../types';
import logger from '../logger';

export class SlackPostProcessor implements PostProcessor {
  name = 'slack-postprocessor';

  supports(integration: string): boolean {
    return integration === 'slack.notify';
  }

  async process(response: ZantaraResponse, params: Record<string, any>): Promise<ZantaraResponse> {
    logger.info({ params }, 'Processing Slack notification');

    // If Slack failed, we can implement retry logic or alternative channels
    if (!response.ok && response.error?.includes('webhook')) {
      logger.warn({
        error: response.error,
        channel: params.channel
      }, 'Slack webhook failed, attempting fallback');

      // Could implement fallback to email or another channel
      // For now, just enhance the error message
      return {
        ...response,
        error: `Slack notification failed: ${response.error}. Consider checking webhook URL or trying alternative channel.`,
        data: {
          fallbackSuggestion: 'email',
          originalMessage: params.text,
          processedBy: [this.name]
        }
      };
    }

    // Enhance successful Slack responses
    if (response.ok) {
      return {
        ...response,
        data: {
          ...response.data,
          sentAt: new Date().toISOString(),
          processedBy: [this.name],
          messagePreview: params.text?.substring(0, 50) + '...'
        }
      };
    }

    return response;
  }
}