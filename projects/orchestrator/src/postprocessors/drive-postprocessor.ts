import { PostProcessor, ZantaraResponse } from '../types';
import logger from '../logger';

export class DrivePostProcessor implements PostProcessor {
  name = 'drive-postprocessor';

  supports(integration: string): boolean {
    return integration.startsWith('drive.');
  }

  async process(response: ZantaraResponse, params: Record<string, any>): Promise<ZantaraResponse> {
    if (!response.ok) {
      return response;
    }

    // Handle drive.upload post-processing
    if (params.name && response.data?.id) {
      logger.info({
        fileId: response.data.id,
        fileName: params.name
      }, 'Drive file uploaded, applying post-processing');

      // Auto-rename file if needed (remove temp prefixes, etc.)
      if (params.name.startsWith('temp_') || params.name.startsWith('upload_')) {
        const cleanName = params.name.replace(/^(temp_|upload_)/, '');

        // You could add a rename operation here if needed
        logger.info({
          originalName: params.name,
          cleanName
        }, 'Would rename uploaded file');
      }

      // Add additional metadata to response
      return {
        ...response,
        data: {
          ...response.data,
          uploadedAt: new Date().toISOString(),
          processedBy: [this.name],
          originalParams: {
            name: params.name,
            mimeType: params.mimeType
          }
        }
      };
    }

    // Handle drive.list post-processing
    if (response.data?.files) {
      logger.info({
        fileCount: response.data.files.length
      }, 'Drive list processed');

      return {
        ...response,
        data: {
          ...response.data,
          processedAt: new Date().toISOString(),
          processedBy: [this.name]
        }
      };
    }

    return response;
  }
}