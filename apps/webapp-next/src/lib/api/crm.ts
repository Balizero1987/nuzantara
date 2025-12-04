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
    return 'http://localhost:8080';
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

  async createClient(data: Partial<CRMClient>, createdBy?: string): Promise<CRMClient> {
    const token = apiClient.getToken();

    // Get current user email for created_by if not provided
    let createdByEmail = createdBy;
    if (!createdByEmail) {
      try {
        // Try to get from auth context
        const user = (await import('./auth')).authAPI.getUser();
        createdByEmail = user?.email || 'system@nuzantara.io';
      } catch {
        createdByEmail = 'system@nuzantara.io';
      }
    }

    // Build URL with query parameter
    const url = new URL(`${BASE_URL}/api/crm/clients`);
    url.searchParams.append('created_by', createdByEmail);

    const response = await fetchWithRetry(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<CRMClient>;
  },

  async updateClient(id: number, data: Partial<CRMClient>, updatedBy?: string): Promise<CRMClient> {
    const token = apiClient.getToken();

    // Get current user email for updated_by if not provided
    let updatedByEmail = updatedBy;
    if (!updatedByEmail) {
      try {
        // Try to get from auth context
        const user = (await import('./auth')).authAPI.getUser();
        updatedByEmail = user?.email || 'system@nuzantara.io';
      } catch {
        updatedByEmail = 'system@nuzantara.io';
      }
    }

    // Build URL with query parameter and use PATCH instead of PUT
    const url = new URL(`${BASE_URL}/api/crm/clients/${id}`);
    url.searchParams.append('updated_by', updatedByEmail);

    const response = await fetchWithRetry(url.toString(), {
      method: 'PATCH', // Changed from PUT to PATCH to match backend
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<CRMClient>;
  },
};
