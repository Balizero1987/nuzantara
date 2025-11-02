import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock Google Contacts service
const mockContacts = {
  people: {
    connections: {
      list: jest.fn().mockResolvedValue({
        data: {
          connections: [
            {
              resourceName: 'people/123',
              names: [{ displayName: 'John Doe' }],
              emailAddresses: [{ value: 'john@example.com' }],
              phoneNumbers: [{ value: '+1234567890' }],
              organizations: [{ name: 'Test Corp', title: 'Developer' }]
            }
          ],
          nextPageToken: null
        }
      })
    },
    createContact: jest.fn().mockResolvedValue({
      data: {
        resourceName: 'people/123',
        names: [{ displayName: 'Test User' }],
        emailAddresses: [{ value: 'test@example.com' }]
      }
    })
  }
};

jest.mock('../../../services/google-auth-service.js', () => ({
  getContacts: jest.fn().mockResolvedValue(mockContacts)
}), { virtual: true });

// Mock bridge proxy
jest.mock('../../../services/bridgeProxy.js', () => ({
  forwardToBridgeIfSupported: jest.fn().mockResolvedValue(null)
}), { virtual: true });

describe('Contacts', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = await import('../contacts.js');
  });

  describe('contactsList', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.contactsList({
        pageSize: 50,
        sortOrder: 'FIRST_NAME_ASCENDING'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.contacts).toBeDefined();
      expect(result.data.totalContacts).toBeDefined();
    });

    it('should handle missing required params (all optional)', async () => {
      // All params are optional, so this should work
      const result = await handlers.contactsList({});
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle params with defaults', async () => {
      const result = await handlers.contactsList({
        pageSize: 100
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('contactsCreate', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.contactsCreate({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.contact).toBeDefined();
    });

    it('should handle missing required params', async () => {
      // Requires name OR email
      await expect(handlers.contactsCreate({})).rejects.toThrow(BadRequestError);
      await expect(handlers.contactsCreate({})).rejects.toThrow('Either name or email is required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.contactsCreate({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

});
