import logger from '../../services/logger.js';
// import { ok } from "../../utils/response.js";
// import { BadRequestError } from "../../utils/errors.js";
import { getDrive } from '../../services/google-auth-service.js';
import multer from 'multer';
import { Request, Response } from 'express';

const upload = multer({ storage: multer.memoryStorage() });

export const driveUploadMultipart = upload.single('file');

export async function handleDriveUploadMultipart(req: Request, res: Response) {
  try {
    // Type assertion for multer file (multer adds 'file' property at runtime)
    const file = (req as any).file as any;

    if (!file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }

    const drive = await getDrive();
    if (!drive) {
      return res.status(500).json({ ok: false, error: 'Drive not configured' });
    }

    const { Readable } = await import('stream');
    const bodyStream = Readable.from([file.buffer]);

    // Get parent folder from request
    const parentFolder = req.body.parent || req.body.folder;
    const fileName = req.body.name || file.originalname;

    // Handle special folder names
    let parents: string[] | undefined;
    if (parentFolder === 'ZERO') {
      parents = ['1AlJaNatn8L7RL5MY5Ex7P6DIfiW42Ipr']; // Zero's folder ID
    } else if (parentFolder) {
      parents = [parentFolder];
    }

    const requestBody: any = {
      name: fileName,
      mimeType: file.mimetype,
    };

    if (parents) {
      requestBody.parents = parents;
    }

    const result = await drive.files.create({
      requestBody,
      media: {
        mimeType: file.mimetype,
        body: bodyStream as any,
      },
      fields: 'id,name,webViewLink,parents,size',
      supportsAllDrives: true,
    });

    return res.json({
      ok: true,
      data: {
        file: result.data,
        message: `File uploaded successfully to ${parentFolder || 'root'}`,
      },
    });
  } catch (error: any) {
    logger.error('Drive upload error:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Upload failed',
    });
  }
}
