import { Router, Request, Response } from 'express';
import { BridgeError } from '../utils/errors.js';

const router = Router();

// AMBARADAM folder access test
router.get('/folder/test', async (req: Request, res: Response) => {
  try {
    const folderId = req.query.folderId as string || process.env.DRIVE_FOLDER_ID;
    
    if (!folderId) {
      throw new BridgeError(400, 'MISSING_FOLDER_ID', 'folderId is required');
    }

    const bridge = (req as any).bridge;
    if (!bridge) {
      throw new BridgeError(500, 'BRIDGE_NOT_INITIALIZED', 'Bridge instance not found');
    }

    // Test folder access
    const result = await bridge.dispatch('drive.test', { folderId });
    
    res.json({
      ok: true,
      folderId,
      accessible: true,
      isAmbaradamFolder: folderId === process.env.DRIVE_FOLDER_ID,
      result
    });

  } catch (error) {
    const err = error as BridgeError;
    res.status(err.statusCode || 500).json({
      ok: false,
      error: err.code || 'FOLDER_ACCESS_ERROR',
      message: err.message,
      folderId: req.query.folderId
    });
  }
});

// Get folder configuration
router.get('/folder/config', (req: Request, res: Response) => {
  res.json({
    ok: true,
    ambaradamFolderId: process.env.DRIVE_FOLDER_ID,
    zantaraSharedDriveId: process.env.ZANTARA_SHARED_DRIVE_ID,
    configured: !!(process.env.DRIVE_FOLDER_ID && process.env.GOOGLE_CLIENT_ID)
  });
});

// Create test file in AMBARADAM
router.post('/folder/test-upload', async (req: Request, res: Response) => {
  try {
    const bridge = (req as any).bridge;
    if (!bridge) {
      throw new BridgeError(500, 'BRIDGE_NOT_INITIALIZED', 'Bridge instance not found');
    }

    const testContent = `Test file created at ${new Date().toISOString()}\nZantara Bridge folder access verification`;
    
    const result = await bridge.dispatch('drive.upload', {
      requestBody: {
        name: `zantara-test-${Date.now()}.txt`,
        parents: [process.env.DRIVE_FOLDER_ID]
      },
      media: {
        mimeType: 'text/plain',
        body: testContent
      }
    });

    res.json({
      ok: true,
      message: 'Test file created successfully',
      fileId: result.id,
      fileName: result.name,
      ambaradam: true
    });

  } catch (error) {
    const err = error as BridgeError;
    res.status(err.statusCode || 500).json({
      ok: false,
      error: err.code || 'UPLOAD_ERROR',
      message: err.message
    });
  }
});

export default router;