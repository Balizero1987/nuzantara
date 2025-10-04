import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { forwardToBridgeIfSupported } from "../../services/bridgeProxy.js";
import { getDocs } from "../../services/google-auth-service.js";

export async function docsCreate(params: any) {
  const { title = 'Untitled Document', content = '' } = params || {};

  const docs = await getDocs();
  if (docs) {
    // Create document
    const createRes = await docs.documents.create({
      requestBody: { title }
    });

    const documentId = createRes.data.documentId!;

    // Add content if provided
    if (content) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [{
            insertText: {
              location: { index: 1 },
              text: content
            }
          }]
        }
      });
    }

    return ok({
      documentId,
      title,
      url: `https://docs.google.com/document/d/${documentId}`,
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      created: new Date().toISOString()
    });
  }
  const bridged = await forwardToBridgeIfSupported('docs.create', params);
  if (bridged) return bridged;
  throw new BadRequestError('Docs not configured');
}

export async function docsRead(params: any) {
  const { documentId } = params || {};
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
          url: `https://docs.google.com/document/d/${doc.documentId}`
        },
        content,
        contentLength: content.length
      });
    } catch (error: any) {
      if (error.code === 404) {
        throw new BadRequestError('Document not found');
      }
      throw error;
    }
  }
  const bridged = await forwardToBridgeIfSupported('docs.read', params);
  if (bridged) return bridged;
  throw new BadRequestError('Docs not configured');
}

export async function docsUpdate(params: any) {
  const { documentId, requests } = params || {};
  if (!documentId) throw new BadRequestError('documentId is required');
  if (!requests || !Array.isArray(requests)) throw new BadRequestError('requests array is required');

  const docs = await getDocs();
  if (docs) {
    try {
      const res = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests }
      });

      return ok({
        documentId,
        replies: res.data.replies || [],
        writeControl: res.data.writeControl
      });
    } catch (error: any) {
      if (error.code === 404) {
        throw new BadRequestError('Document not found');
      }
      throw error;
    }
  }
  const bridged = await forwardToBridgeIfSupported('docs.update', params);
  if (bridged) return bridged;
  throw new BadRequestError('Docs not configured');
}