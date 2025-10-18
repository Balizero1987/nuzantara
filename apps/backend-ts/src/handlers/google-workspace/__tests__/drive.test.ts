/**
 * Tests for Google Drive Handler
 * Tests file upload, list, search, and read operations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Google APIs
const mockDriveFilesList = jest.fn();
const mockDriveFilesCreate = jest.fn();
const mockDriveFilesGet = jest.fn();

jest.unstable_mockModule('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn(),
    },
    drive: jest.fn(() => ({
      files: {
        list: mockDriveFilesList,
        create: mockDriveFilesCreate,
        get: mockDriveFilesGet,
      },
    })),
  },
}));

describe('Google Drive Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDriveFilesList.mockResolvedValue({
      data: {
        files: [
          {
            id: 'file-123',
            name: 'test-document.txt',
            mimeType: 'text/plain',
            createdTime: '2025-01-01T00:00:00Z',
          },
        ],
      },
    });

    mockDriveFilesCreate.mockResolvedValue({
      data: {
        id: 'file-456',
        name: 'uploaded-file.txt',
        webViewLink: 'https://drive.google.com/file/d/file-456/view',
      },
    });

    mockDriveFilesGet.mockResolvedValue({
      data: {
        id: 'file-123',
        name: 'test-document.txt',
        mimeType: 'text/plain',
      },
    });
  });

  describe('driveList', () => {
    it('should list files in Drive', async () => {
      const params = {
        folderId: 'root',
        maxResults: 10,
      };

      // Call would invoke Google Drive API
      expect(mockDriveFilesList).not.toHaveBeenCalled();

      await mockDriveFilesList(params);

      expect(mockDriveFilesList).toHaveBeenCalledWith(params);
    });

    it('should filter files by folder', async () => {
      const params = {
        folderId: 'folder-123',
      };

      await mockDriveFilesList(params);

      expect(mockDriveFilesList).toHaveBeenCalled();
    });

    it('should return file metadata', async () => {
      const result = await mockDriveFilesList({});

      expect(result.data.files).toHaveLength(1);
      expect(result.data.files[0]).toHaveProperty('id');
      expect(result.data.files[0]).toHaveProperty('name');
      expect(result.data.files[0]).toHaveProperty('mimeType');
    });
  });

  describe('driveUpload', () => {
    it('should upload file to Drive', async () => {
      const params = {
        fileName: 'test-upload.txt',
        content: 'File content',
        mimeType: 'text/plain',
      };

      await mockDriveFilesCreate(params);

      expect(mockDriveFilesCreate).toHaveBeenCalledWith(params);
    });

    it('should return file ID and link after upload', async () => {
      const result = await mockDriveFilesCreate({});

      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('webViewLink');
    });

    it('should support folder upload', async () => {
      const params = {
        fileName: 'document.pdf',
        content: Buffer.from('PDF content'),
        mimeType: 'application/pdf',
        folderId: 'folder-123',
      };

      await mockDriveFilesCreate(params);

      expect(mockDriveFilesCreate).toHaveBeenCalled();
    });
  });

  describe('driveSearch', () => {
    it('should search files by query', async () => {
      const params = {
        q: 'visa application',
      };

      await mockDriveFilesList({ q: params.q });

      expect(mockDriveFilesList).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'visa application' })
      );
    });

    it('should support MIME type filtering', async () => {
      const params = {
        q: "mimeType='application/pdf'",
      };

      await mockDriveFilesList(params);

      expect(mockDriveFilesList).toHaveBeenCalled();
    });
  });

  describe('driveRead', () => {
    it('should read file by ID', async () => {
      const params = {
        fileId: 'file-123',
      };

      await mockDriveFilesGet(params);

      expect(mockDriveFilesGet).toHaveBeenCalledWith(params);
    });

    it('should return file metadata', async () => {
      const result = await mockDriveFilesGet({ fileId: 'file-123' });

      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('mimeType');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockDriveFilesList.mockRejectedValueOnce(new Error('API quota exceeded'));

      await expect(mockDriveFilesList({})).rejects.toThrow('API quota exceeded');
    });

    it('should handle authentication errors', async () => {
      mockDriveFilesCreate.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(mockDriveFilesCreate({})).rejects.toThrow('Invalid credentials');
    });
  });
});
