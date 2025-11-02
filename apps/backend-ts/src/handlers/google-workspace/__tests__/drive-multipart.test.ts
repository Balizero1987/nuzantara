import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock Google Drive service
const mockDrive = {
  files: {
    create: jest.fn().mockResolvedValue({
      data: { id: 'test-file-id', name: 'test-file.txt' }
    })
  }
};

jest.mock('../../../services/google-auth-service.js', () => ({
  getDrive: jest.fn().mockResolvedValue(mockDrive)
}), { virtual: true });

describe('Drive Multipart', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = await import('../drive-multipart.js');
  });

  describe('handleDriveUploadMultipart', () => {
    it('should handle success case with valid params', async () => {
      // This is an Express handler (req, res)
      const mockReq: any = {
        body: {
          name: 'test-file.txt',
          parent: 'folder-id'
        },
        file: {
          buffer: Buffer.from('test content'),
          originalname: 'test-file.txt',
          mimetype: 'text/plain'
        }
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await handlers.handleDriveUploadMultipart(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      expect(mockDrive.files.create).toHaveBeenCalled();
    });

    it('should handle missing required params', async () => {
      // Express handler - test with no file
      const mockReq: any = {
        body: {}
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await handlers.handleDriveUploadMultipart(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ ok: false })
      );
    });

    it('should handle invalid params', async () => {
      const mockReq: any = {
        body: { invalid: 'data' },
        file: null
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      await handlers.handleDriveUploadMultipart(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

});
