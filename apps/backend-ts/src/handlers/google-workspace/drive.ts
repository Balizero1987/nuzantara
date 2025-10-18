import logger from '../../services/logger.js';
import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { forwardToBridgeIfSupported } from "../../services/bridgeProxy.js";
import { getDrive } from "../../services/google-auth-service.js";

// === Minimal typed interfaces (Step 1 migration) ===
export interface DriveUploadParams {
  requestBody?: { name?: string; parents?: string[] };
  resource?: { name?: string; parents?: string[] };
  media?: { mimeType?: string; body?: Buffer | string };
  // Legacy-friendly fields (for callers that pass flat params)
  name?: string;
  body?: Buffer | string;
  content?: string; // NEW: Alternative to media.body
  fileName?: string;
  mimeType?: string;
  parents?: string[];
  supportsAllDrives?: boolean;
}

export interface DriveListParams {
  q?: string;
  folderId?: string;
  mimeType?: string;
  pageSize?: number;
  fields?: string;
}

export interface DriveSearchParams {
  query?: string;
  folderId?: string;
  mimeType?: string;
  pageSize?: number;
  fields?: string;
}

export interface DriveReadParams { fileId: string }

// === Result interfaces ===
export interface DriveUploadResult { file: any; sharedDrive: string | null }
export interface DriveListResult { files: any[]; nextPageToken: string | null }
export interface DriveSearchResult { query: string; files: any[]; nextPageToken: string | null }
export interface DriveReadResult { file: any; content: string | null; readable: boolean }

export async function driveUpload(params: DriveUploadParams) {
  logger.info('📤 Drive upload requested with params:', {
    hasRequestBody: !!params?.requestBody,
    hasResource: !!params?.resource,
    hasMedia: !!params?.media,
    fileName: params?.fileName,
    mimeType: params?.mimeType,
    parents: params?.parents,
    supportsAllDrives: params?.supportsAllDrives
  });

  // Support multiple parameter formats for compatibility
  const requestBody: any = params?.requestBody || params?.resource || {};
  const media: any = params?.media || {};

  // Handle fileName fallback
  if (params?.fileName && !requestBody.name) {
    requestBody.name = params.fileName;
  }

  // Handle mimeType at root level
  if (params?.mimeType && !media.mimeType) {
    media.mimeType = params.mimeType;
  }

  let body: any = media?.body || params?.content || params?.body;
  if (!body) throw new BadRequestError('content or media.body is required');

  // Convert string to Buffer (supports base64)
  if (typeof body === 'string') {
    try {
      const decoded = Buffer.from(body, 'base64');
      if (decoded.toString('base64') === body.replace(/\s/g, '')) {
        body = decoded;
        logger.info('🔄 Decoded base64 content, size:', body.length);
      } else {
        body = Buffer.from(body, 'utf8');
        logger.info('🔄 Converted UTF8 content, size:', body.length);
      }
    } catch {
      body = Buffer.from(body, 'utf8');
      logger.info('🔄 Fallback UTF8 content, size:', body.length);
    }
  }

  // Handle parents parameter - can be in params or requestBody
  const parents = params?.parents || (requestBody?.parents as string[] | undefined);
  const supportsAllDrives = params?.supportsAllDrives;

  // Target folder (shared drive) if provided
  const driveId = process.env.DRIVE_FOLDER_ID || process.env.GDRIVE_AMBARADAM_DRIVE_ID;

  // Only use driveId if it's not the placeholder value
  const validDriveId = (driveId && driveId !== 'your_drive_id') ? driveId : null;

  const finalRequestBody = parents
    ? { ...requestBody, parents }
    : (validDriveId ? { ...requestBody, parents: [validDriveId] } : requestBody);

  // Try native TS Drive client first
  logger.info('🔍 Attempting to get Drive service...');
  const drive = await getDrive();

  if (drive) {
    try {
      logger.info('✅ Drive service obtained, uploading file...');
      logger.info('📦 Upload config:', {
        fileName: finalRequestBody.name,
        mimeType: media?.mimeType || 'text/plain',
        parents: finalRequestBody.parents,
        supportsAllDrives: supportsAllDrives ?? true
      });

      const { Readable } = await import('stream');
      const bodyStream = Readable.from([body]);
      const res = await drive.files.create({
        requestBody: finalRequestBody,
        media: { mimeType: media?.mimeType || 'text/plain', body: bodyStream as any },
        fields: 'id,name,webViewLink,parents,size',
        supportsAllDrives: supportsAllDrives ?? true,
      });

      logger.info('✅ File uploaded successfully:', {
        id: res.data.id,
        name: res.data.name,
        webViewLink: res.data.webViewLink
      });

      return ok({ file: res.data, sharedDrive: validDriveId || null });
    } catch (error: any) {
      logger.error('❌ Drive upload failed:', {
        error: error?.message,
        code: error?.code,
        status: error?.status,
        details: error?.response?.data || error?.errors
      });

      // Check for scope errors specifically
      if (error?.message?.includes('insufficient authentication scopes')) {
        logger.error('🚫 CRITICAL: Authentication has insufficient scopes for Drive upload');
        logger.error('📋 Required scopes: https://www.googleapis.com/auth/drive, https://www.googleapis.com/auth/drive.file');
      }

      throw error;
    }
  }

  // Fallback to Bridge legacy implementation
  logger.info('⚠️ Drive service not available, trying Bridge fallback...');
  const bridged = await forwardToBridgeIfSupported('drive.upload', params);
  if (bridged) {
    logger.info('✅ Upload succeeded via Bridge fallback');
    return bridged;
  }

  logger.error('❌ Drive not configured - both Service Account and Bridge failed');
  throw new BadRequestError('Drive not configured - check authentication settings');
}

export async function driveList(params: DriveListParams) {
  const { q, folderId, mimeType, pageSize = 25, fields = 'files(id,name,webViewLink,parents,size),nextPageToken' } = params || {} as DriveListParams;

  // Build query - support both direct q parameter and simplified parameters
  let query = '';

  if (q) {
    // Use provided q parameter directly (Google Drive API syntax)
    query = q;
  } else {
    // Build query from simplified parameters (Custom GPT friendly)
    const filters = [];

    if (folderId) {
      filters.push(`'${folderId}' in parents`);
    }

    if (mimeType) {
      filters.push(`mimeType='${mimeType}'`);
    }

    query = filters.join(' and ');
  }

  const drive = await getDrive();
  if (drive) {
    const res = await drive.files.list({
      q: query,
      pageSize,
      fields,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });
    return ok({ files: res.data.files || [], nextPageToken: (res.data as any).nextPageToken || null });
  }
  const bridged = await forwardToBridgeIfSupported('drive.list', params);
  if (bridged) return bridged;
  throw new BadRequestError('Drive not configured');
}

export async function driveSearch(params: DriveSearchParams) {
  const { query, folderId, mimeType, pageSize = 25, fields = 'files(id,name,webViewLink,parents,size,mimeType)' } = params || {} as DriveSearchParams;

  if (!query && !folderId && !mimeType) {
    throw new BadRequestError('At least one of query, folderId, or mimeType is required');
  }

  // Build search query with multiple filter options
  let q = '';
  const filters = [];

  // Text search
  if (query) {
    filters.push(`(name contains '${query}' or fullText contains '${query}')`);
  }

  // Folder filter (Custom GPT friendly)
  if (folderId) {
    filters.push(`'${folderId}' in parents`);
  }

  // MIME type filter
  if (mimeType) {
    filters.push(`mimeType='${mimeType}'`);
  }

  q = filters.join(' and ');

  const drive = await getDrive();
  if (drive) {
    const res = await drive.files.list({
      q,
      pageSize,
      fields: `${fields},nextPageToken`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });
    return ok({
      query,
      files: res.data.files || [],
      nextPageToken: (res.data as any).nextPageToken || null
    });
  }
  const bridged = await forwardToBridgeIfSupported('drive.search', params);
  if (bridged) return bridged;
  throw new BadRequestError('Drive not configured');
}

export async function driveRead(params: DriveReadParams) {
  const { fileId } = params || ({} as DriveReadParams);
  if (!fileId) throw new BadRequestError('fileId is required');

  const drive = await getDrive();
  if (drive) {
    try {
      // Get file metadata
      const metaRes = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,webViewLink,parents',
        supportsAllDrives: true
      });

      // Get file content for text files
      const mimeType = metaRes.data.mimeType;
      let content = null;

      if (mimeType?.startsWith('text/') ||
          mimeType === 'application/json' ||
          mimeType === 'application/javascript') {
        const contentRes = await drive.files.get({
          fileId,
          alt: 'media',
          supportsAllDrives: true
        });
        content = contentRes.data as string;
      }

      return ok({
        file: metaRes.data,
        content,
        readable: !!content
      });
    } catch (error: any) {
      if (error.code === 404) {
        throw new BadRequestError('File not found');
      }
      throw error;
    }
  }
  const bridged = await forwardToBridgeIfSupported('drive.read', params);
  if (bridged) return bridged;
  throw new BadRequestError('Drive not configured');
}
