import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { getDocs } from '../../services/google-auth-service.js';

// Minimal param interfaces (Step 1 typing)
export interface DocsCreateParams {
  title?: string;
  content?: string;
}
export interface DocsReadParams {
  documentId: string;
}
export interface DocsUpdateParams {
  documentId: string;
  requests?: any[];
  content?: string;
}

// Result interfaces
export interface DocsCreateResult {
  documentId: string;
  title: string;
  url: string;
  content: string;
  created: string;
}
export interface DocsReadResult {
  document: { documentId?: string; title?: string; revisionId?: string; url: string };
  content: string;
  contentLength: number;
}
export interface DocsUpdateResult {
  documentId: string;
  replies: any[];
  writeControl?: any;
}

export async function docsCreate(params: DocsCreateParams) {
  const { title = 'Untitled Document', content = '' } = params || {};

  const docs = await getDocs();
  if (docs) {
    // Create document
    const createRes = await docs.documents.create({
      requestBody: { title },
    });

    const documentId = createRes.data.documentId!;

    // Add content if provided
    if (content) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        },
      });
    }

    return ok({
      documentId,
      title,
      url: `https://docs.google.com/document/d/${documentId}`,
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      created: new Date().toISOString(),
    });
  }
  throw new BadRequestError('Docs not configured');
}

export async function docsRead(params: DocsReadParams) {
  const { documentId } = params || ({} as DocsReadParams);
  if (!documentId) throw new BadRequestError('documentId is required');

  const docs = await getDocs();
  if (docs) {
    try {
      const res = await docs.documents.get({ documentId });
      const doc = res.data;

      // Extract text content from document
      let content = '';
      if (doc.body?.content) {
        for (const element of doc.body.content) {
          if (element.paragraph?.elements) {
            for (const textElement of element.paragraph.elements) {
              if (textElement.textRun?.content) {
                content += textElement.textRun.content;
              }
            }
          }
        }
      }

      return ok({
        document: {
          documentId: doc.documentId,
          title: doc.title,
          revisionId: doc.revisionId,
          url: `https://docs.google.com/document/d/${doc.documentId}`,
        },
        content,
        contentLength: content.length,
      });
    } catch (error: any) {
      if (error.code === 404) {
        throw new BadRequestError('Document not found');
      }
      throw error;
    }
  }
  throw new BadRequestError('Docs not configured');
}

export async function docsUpdate(params: DocsUpdateParams) {
  const { documentId, requests, content } = params || ({} as DocsUpdateParams);
  if (!documentId) throw new BadRequestError('documentId is required');

  // Support simple content parameter OR requests array
  let finalRequests = requests;
  if (!finalRequests && content) {
    // Simple mode: replace all content with new text
    finalRequests = [
      {
        deleteContentRange: {
          range: {
            startIndex: 1,
            endIndex: 999999, // Delete all content
          },
        },
      },
      {
        insertText: {
          location: { index: 1 },
          text: content,
        },
      },
    ];
  }

  if (!finalRequests || !Array.isArray(finalRequests)) {
    throw new BadRequestError('content or requests array is required');
  }

  const docs = await getDocs();
  if (docs) {
    try {
      const res = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: finalRequests },
      });

      return ok({
        documentId,
        replies: res.data.replies || [],
        writeControl: res.data.writeControl,
      });
    } catch (error: any) {
      if (error.code === 404) {
        throw new BadRequestError('Document not found');
      }
      throw error;
    }
  }
  throw new BadRequestError('Docs not configured');
}
