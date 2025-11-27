import apiClient from "./client"

interface CRMClient {
  id: number
  uuid: string
  full_name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  nationality: string | null
  status: string
  client_type: string
  assigned_to: string | null
  first_contact_date: string | null
  last_interaction_date: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

interface GmailSyncResult {
  emails_processed: number
  new_clients: number
  updated_clients: number
  new_interactions: number
  status: string
}

export const crmAPI = {
  async getClients(): Promise<CRMClient[]> {
    const response = await apiClient.instance.get("/api/crm/clients")
    return response.data
  },

  async syncGmail(): Promise<GmailSyncResult> {
    const response = await apiClient.instance.post("/api/crm/interactions/sync-gmail")
    return response.data
  },

  async createClient(data: Partial<CRMClient>): Promise<CRMClient> {
    const response = await apiClient.instance.post("/api/crm/clients", data)
    return response.data
  },

  async updateClient(id: number, data: Partial<CRMClient>): Promise<CRMClient> {
    const response = await apiClient.instance.put(`/api/crm/clients/${id}`, data)
    return response.data
  },
}
