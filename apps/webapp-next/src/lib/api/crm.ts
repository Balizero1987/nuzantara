import axios from 'axios';
import { apiClient } from '@/lib/api/client';

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
    const response = await axios.get(`${BASE_URL}/api/crm/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async syncGmail(): Promise<GmailSyncResult> {
    const token = apiClient.getToken();
    const response = await axios.post(
      `${BASE_URL}/api/crm/interactions/sync-gmail`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async createClient(data: Partial<CRMClient>): Promise<CRMClient> {
    const token = apiClient.getToken();
    const response = await axios.post(`${BASE_URL}/api/crm/clients`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateClient(id: number, data: Partial<CRMClient>): Promise<CRMClient> {
    const token = apiClient.getToken();
    const response = await axios.put(`${BASE_URL}/api/crm/clients/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
