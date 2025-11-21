export type LegalEntityType = 'PT' | 'PT_PMA' | 'CV' | 'FIRMA' | 'UD' | 'PERORANGAN';
export type CompanyStatus = 'active' | 'pending' | 'inactive' | 'overdue';

export interface Company {
  id: string;
  company_name: string;
  legal_entity_type: LegalEntityType;
  email: string;
  phone?: string;
  npwp?: string;
  kbli_code?: string;
  status: CompanyStatus;
  assigned_consultant?: string;
  jurnal_connected: boolean;
  documents_folder_url?: string;
  notes?: string;
  last_report?: string;
  next_payment?: string;
  created_at: Date;
  updated_at: Date;
}
