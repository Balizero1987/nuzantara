import { apiClient } from './client';
import { fetchWithRetry } from './fetch-utils';

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

// Use production URL in non-dev environments, with secure fallback
const getBaseURL = (): string => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' &&
        (window.location.hostname.includes('fly.dev') || window.location.hostname.includes('nuzantara'))) {
        return 'https://nuzantara-rag.fly.dev';
    }
    return 'http://localhost:8000';
};
const BASE_URL = getBaseURL();

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
    return response.json() as Promise<CRMClient[]>;
  },

  async syncGmail(): Promise<GmailSyncResult> {
    const token = apiClient.getToken();
    const response = await fetchWithRetry(`${BASE_URL}/api/crm/interactions/sync-gmail`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    return response.json() as Promise<GmailSyncResult>;
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
    return response.json() as Promise<CRMClient>;
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
    return response.json() as Promise<CRMClient>;
  },
};
