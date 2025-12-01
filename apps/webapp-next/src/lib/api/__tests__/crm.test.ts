import axios from 'axios'
import { crmAPI } from '../crm'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock apiClient
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getToken: jest.fn(() => 'test-token'),
  },
}))

describe('crmAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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
      ]

      mockedAxios.get.mockResolvedValue({ data: mockClients })

      const result = await crmAPI.getClients()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/crm/clients'),
        { headers: { Authorization: 'Bearer test-token' } }
      )
      expect(result).toEqual(mockClients)
    })

    it('should handle empty clients list', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] })

      const result = await crmAPI.getClients()

      expect(result).toEqual([])
    })

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'))

      await expect(crmAPI.getClients()).rejects.toThrow('Unauthorized')
    })
  })

  describe('syncGmail', () => {
    it('should sync Gmail successfully', async () => {
      const mockResult = {
        emails_processed: 50,
        new_clients: 5,
        updated_clients: 10,
        new_interactions: 45,
        status: 'completed',
      }

      mockedAxios.post.mockResolvedValue({ data: mockResult })

      const result = await crmAPI.syncGmail()

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/crm/interactions/sync-gmail'),
        {},
        { headers: { Authorization: 'Bearer test-token' } }
      )
      expect(result).toEqual(mockResult)
    })

    it('should handle sync errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Gmail sync failed'))

      await expect(crmAPI.syncGmail()).rejects.toThrow('Gmail sync failed')
    })

    it('should include authorization header', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          emails_processed: 0,
          new_clients: 0,
          updated_clients: 0,
          new_interactions: 0,
          status: 'completed',
        },
      })

      await crmAPI.syncGmail()

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      )
    })
  })

  describe('createClient', () => {
    it('should create client successfully', async () => {
      const newClient = {
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+0987654321',
        status: 'lead',
        client_type: 'business',
      }

      const createdClient = {
        id: 2,
        uuid: 'uuid-2',
        ...newClient,
        whatsapp: null,
        nationality: null,
        assigned_to: null,
        first_contact_date: '2024-01-20',
        last_interaction_date: null,
        tags: [],
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
      }

      mockedAxios.post.mockResolvedValue({ data: createdClient })

      const result = await crmAPI.createClient(newClient)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/crm/clients'),
        newClient,
        { headers: { Authorization: 'Bearer test-token' } }
      )
      expect(result).toEqual(createdClient)
    })

    it('should handle validation errors', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 422, data: { detail: 'Invalid email format' } },
      })

      await expect(crmAPI.createClient({ full_name: 'Test' })).rejects.toBeDefined()
    })

    it('should create client with minimal data', async () => {
      const minimalClient = { full_name: 'Minimal User' }
      mockedAxios.post.mockResolvedValue({ data: { id: 3, ...minimalClient } })

      const result = await crmAPI.createClient(minimalClient)

      expect(result.id).toBe(3)
      expect(result.full_name).toBe('Minimal User')
    })
  })

  describe('updateClient', () => {
    it('should update client successfully', async () => {
      const updateData = {
        email: 'updated@example.com',
        status: 'active',
        tags: ['updated', 'priority'],
      }

      const updatedClient = {
        id: 1,
        uuid: 'uuid-1',
        full_name: 'John Doe',
        ...updateData,
        phone: '+1234567890',
        whatsapp: '+1234567890',
        nationality: 'US',
        client_type: 'individual',
        assigned_to: 'agent1',
        first_contact_date: '2024-01-01',
        last_interaction_date: '2024-01-20',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
      }

      mockedAxios.put.mockResolvedValue({ data: updatedClient })

      const result = await crmAPI.updateClient(1, updateData)

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/crm/clients/1'),
        updateData,
        { headers: { Authorization: 'Bearer test-token' } }
      )
      expect(result).toEqual(updatedClient)
    })

    it('should handle not found error', async () => {
      mockedAxios.put.mockRejectedValue({
        response: { status: 404, data: { detail: 'Client not found' } },
      })

      await expect(crmAPI.updateClient(999, { status: 'inactive' })).rejects.toBeDefined()
    })

    it('should update single field', async () => {
      mockedAxios.put.mockResolvedValue({
        data: { id: 1, status: 'inactive' },
      })

      const result = await crmAPI.updateClient(1, { status: 'inactive' })

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.any(String),
        { status: 'inactive' },
        expect.any(Object)
      )
      expect(result.status).toBe('inactive')
    })

    it('should include authorization header', async () => {
      mockedAxios.put.mockResolvedValue({ data: { id: 1 } })

      await crmAPI.updateClient(1, { full_name: 'Updated Name' })

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      )
    })
  })
})
