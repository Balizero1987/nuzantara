import { apiClient } from '@/lib/api/client';
import { fetchWithRetry } from '@/lib/api/fetch-utils';

interface CRMClient {
  id: number;
  uuid: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  nationality: string | null;
  status: string;
  client_type: string;
  assigned_to: string | null;
  first_contact_date: string | null;
  last_interaction_date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface GmailSyncResult {
  emails_processed: number;
  new_clients: number;
  updated_clients: number;
  new_interactions: number;
  status: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const crmAPI = {
  async getClients(): Promise<CRMClient[]> {
    const token = apiClient.getToken();
    const response = await fetchWithRetry(`${BASE_URL}/api/crm/clients`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  async syncGmail(): Promise<GmailSyncResult> {
    const token = apiClient.getToken();
    const response = await fetchWithRetry(
      `${BASE_URL}/api/crm/interactions/sync-gmail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );
    return response.json();
  },

  async createClient(data: Partial<CRMClient>): Promise<CRMClient> {
    const token = apiClient.getToken();
    const response = await fetchWithRetry(`${BASE_URL}/api/crm/clients`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async updateClient(id: number, data: Partial<CRMClient>): Promise<CRMClient> {
    const token = apiClient.getToken();
    const response = await fetchWithRetry(`${BASE_URL}/api/crm/clients/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
