import { crmAPI } from '../crm';
import { fetchWithRetry } from '../fetch-utils';
import { apiClient } from '../client';

jest.mock('../fetch-utils', () => ({
  fetchWithRetry: jest.fn(),
}));

jest.mock('../client', () => ({
  apiClient: {
    getToken: jest.fn(() => 'test-token'),
  },
}));

describe('crmAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getToken as jest.Mock).mockReturnValue('test-token');
  });

  describe('getClients', () => {
    it('should fetch clients successfully', async () => {
      const mockClients = [
        {
          id: 1,
          uuid: 'uuid-1',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          whatsapp: '+1234567890',
          nationality: 'US',
          status: 'active',
          client_type: 'individual',
          assigned_to: 'agent1',
          first_contact_date: '2024-01-01',
          last_interaction_date: '2024-01-15',
          tags: ['vip', 'priority'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
      ];

      (fetchWithRetry as jest.Mock).mockResolvedValue({
        json: async () => mockClients,
      });

      const result = await crmAPI.getClients();

      expect(fetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('/api/crm/clients'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockClients);
    });

    it('should handle API errors', async () => {
      (fetchWithRetry as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(crmAPI.getClients()).rejects.toThrow('API Error');
    });
  });

  describe('syncGmail', () => {
    it('should sync gmail interactions', async () => {
      const mockResult = {
        emails_processed: 10,
        new_clients: 2,
        updated_clients: 5,
        new_interactions: 8,
        status: 'success',
      };

      (fetchWithRetry as jest.Mock).mockResolvedValue({
        json: async () => mockResult,
      });

      const result = await crmAPI.syncGmail();

      expect(fetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('/api/crm/interactions/sync-gmail'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('createClient', () => {
    it('should create a new client', async () => {
      const newClient = {
        full_name: 'New Client',
        email: 'new@example.com',
        phone: '0987654321',
      };

      const mockResponse = {
        ...newClient,
        id: 2,
        uuid: 'uuid-2',
        status: 'lead',
        client_type: 'individual',
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
      };

      (fetchWithRetry as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await crmAPI.createClient(newClient);

      expect(fetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('/api/crm/clients'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newClient),
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateClient', () => {
    it('should update an existing client', async () => {
      const updateData = {
        full_name: 'Updated Name',
        status: 'active',
      };

      const mockResponse = {
        id: 1,
        full_name: 'Updated Name',
        email: 'test@example.com',
        status: 'active',
      };

      (fetchWithRetry as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await crmAPI.updateClient(1, updateData);

      expect(fetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('/api/crm/clients/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
