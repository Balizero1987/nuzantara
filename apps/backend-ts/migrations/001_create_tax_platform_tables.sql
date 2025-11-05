-- ============================================================
-- BALI ZERO TAX PLATFORM - DATABASE MIGRATION 001
-- Description: Create all tax platform tables
-- Version: 1.0.0
-- Date: 2025-11-05
-- Author: Claude Code
-- ============================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SECTION 1: TEAM & USER MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,

  -- Permissions
  can_view_all_clients BOOLEAN DEFAULT false,
  can_create_calculations BOOLEAN DEFAULT false,
  can_approve_calculations BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_send_to_portal BOOLEAN DEFAULT false,
  can_create_invoices BOOLEAN DEFAULT false,

  -- Profile
  phone VARCHAR(50),
  avatar_url TEXT,
  bio TEXT,

  -- Status
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('tax_manager', 'tax_consultant', 'tax_expert', 'customer_service'))
);

CREATE INDEX idx_tax_consultants_email ON tax_consultants(email);
CREATE INDEX idx_tax_consultants_role ON tax_consultants(role);
CREATE INDEX idx_tax_consultants_active ON tax_consultants(active);

-- Pre-populate team
INSERT INTO tax_consultants (email, full_name, role, can_view_all_clients, can_create_calculations, can_approve_calculations, can_manage_users, can_send_to_portal, can_create_invoices, active) VALUES
  ('veronika@balizero.com', 'Veronika', 'tax_manager', true, true, true, true, true, true, true),
  ('angel@balizero.com', 'Angel', 'tax_expert', true, true, false, false, true, true, true),
  ('kadek@balizero.com', 'Kadek', 'tax_consultant', true, true, false, false, true, true, true),
  ('dewaayu@balizero.com', 'Dewa Ayu', 'tax_consultant', true, true, false, false, true, true, true),
  ('monaka@balizero.com', 'Monaka', 'tax_consultant', true, true, false, false, true, true, true),
  ('faisha@balizero.com', 'Faisha', 'customer_service', true, false, false, false, false, false, true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- SECTION 2: CLIENT/COMPANY PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  company_name VARCHAR(255) NOT NULL,
  company_name_id VARCHAR(255),
  legal_entity_type VARCHAR(50) NOT NULL,

  -- Tax Identifiers
  npwp VARCHAR(50) UNIQUE,
  npwp_date DATE,
  nib VARCHAR(50),

  -- Contact Information
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  mobile VARCHAR(50),
  website VARCHAR(255),

  -- Address
  address_street TEXT,
  address_city VARCHAR(100),
  address_province VARCHAR(100),
  address_postal_code VARCHAR(20),
  address_country VARCHAR(100) DEFAULT 'Indonesia',

  -- Business Classification
  kbli_code VARCHAR(10),
  kbli_description TEXT,
  industry_sector VARCHAR(100),
  business_description TEXT,

  -- Tax Information
  establishment_date DATE,
  fiscal_year_end VARCHAR(5) DEFAULT '12-31',
  tax_office_kpp VARCHAR(100),
  tax_zone VARCHAR(100),
  is_public_company BOOLEAN DEFAULT false,
  public_ownership_percentage DECIMAL(5,2),

  -- Assignment
  assigned_consultant_id UUID REFERENCES tax_consultants(id),
  assigned_date DATE,

  -- Document Management
  documents_folder_url TEXT,
  jurnal_company_id VARCHAR(100),

  -- Client Relationship
  client_since DATE,
  contract_type VARCHAR(50),
  service_package VARCHAR(100),

  -- Status & Tags
  status VARCHAR(50) DEFAULT 'active',
  client_tags JSONB,
  risk_level VARCHAR(20),

  -- Internal Notes
  internal_notes TEXT,
  special_requirements TEXT,

  -- Portal Access
  portal_enabled BOOLEAN DEFAULT true,
  portal_last_access TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES tax_consultants(id),
  last_report_date DATE,

  CONSTRAINT valid_legal_entity CHECK (legal_entity_type IN ('PT', 'PT_PMA', 'CV', 'FIRMA', 'UD', 'PERORANGAN')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  CONSTRAINT valid_risk CHECK (risk_level IN ('low', 'medium', 'high'))
);

CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_companies_npwp ON companies(npwp);
CREATE INDEX idx_companies_consultant ON companies(assigned_consultant_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_kbli ON companies(kbli_code);

-- ============================================================
-- SECTION 3: JURNAL.ID INTEGRATION
-- ============================================================

CREATE TABLE IF NOT EXISTS jurnal_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Jurnal.id Credentials
  jurnal_company_id VARCHAR(100) NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT,

  -- Connection Status
  connection_status VARCHAR(50) DEFAULT 'active',
  last_sync_success TIMESTAMP,
  last_sync_attempt TIMESTAMP,
  sync_error_message TEXT,

  -- Sync Configuration
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency VARCHAR(50) DEFAULT 'daily',
  sync_start_date DATE,

  -- Sync Statistics
  total_syncs INTEGER DEFAULT 0,
  successful_syncs INTEGER DEFAULT 0,
  failed_syncs INTEGER DEFAULT 0,
  last_sync_records_count INTEGER,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES tax_consultants(id),

  UNIQUE(company_id),
  CONSTRAINT valid_connection_status CHECK (connection_status IN ('active', 'inactive', 'error'))
);

CREATE INDEX idx_jurnal_connections_company ON jurnal_connections(company_id);
CREATE INDEX idx_jurnal_connections_status ON jurnal_connections(connection_status);

CREATE TABLE IF NOT EXISTS jurnal_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES jurnal_connections(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Sync Details
  sync_type VARCHAR(50),
  sync_status VARCHAR(50),

  -- Data Synced
  period_start DATE,
  period_end DATE,
  records_synced INTEGER,

  -- Results
  revenue_total DECIMAL(15,2),
  expense_total DECIMAL(15,2),
  transaction_count INTEGER,

  -- Errors
  error_message TEXT,
  error_details JSONB,

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER,

  CONSTRAINT valid_sync_status CHECK (sync_status IN ('in_progress', 'success', 'failed'))
);

CREATE INDEX idx_jurnal_sync_log_company ON jurnal_sync_log(company_id);
CREATE INDEX idx_jurnal_sync_log_status ON jurnal_sync_log(sync_status);

-- ============================================================
-- SECTION 4: FINANCIAL SUMMARIES
-- ============================================================

CREATE TABLE IF NOT EXISTS financial_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Period
  fiscal_year INTEGER NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_month INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Aggregated Financials
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_cost_of_goods_sold DECIMAL(15,2) DEFAULT 0,
  total_operating_expenses DECIMAL(15,2) DEFAULT 0,
  total_other_income DECIMAL(15,2) DEFAULT 0,
  total_other_expenses DECIMAL(15,2) DEFAULT 0,

  -- Calculated (generated columns)
  gross_profit DECIMAL(15,2) GENERATED ALWAYS AS (total_revenue - total_cost_of_goods_sold) STORED,
  operating_profit DECIMAL(15,2) GENERATED ALWAYS AS (total_revenue - total_cost_of_goods_sold - total_operating_expenses) STORED,
  net_profit_before_tax DECIMAL(15,2) GENERATED ALWAYS AS (
    total_revenue - total_cost_of_goods_sold - total_operating_expenses + total_other_income - total_other_expenses
  ) STORED,

  -- Detailed Breakdown
  revenue_breakdown JSONB,
  expense_breakdown JSONB,

  -- Data Source
  source VARCHAR(50) DEFAULT 'jurnal',
  jurnal_sync_id UUID REFERENCES jurnal_sync_log(id),

  -- Manual Adjustments
  manual_adjustments JSONB,
  adjustment_notes TEXT,

  -- Status
  data_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES tax_consultants(id),
  verified_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(company_id, fiscal_year, period_type, period_month)
);

CREATE INDEX idx_financial_summaries_company ON financial_summaries(company_id);
CREATE INDEX idx_financial_summaries_period ON financial_summaries(fiscal_year, period_type);

-- ============================================================
-- SECTION 5: TAX CALCULATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Calculation Info
  calculation_type VARCHAR(50) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  period VARCHAR(20) NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Link to Financial Data
  financial_summary_id UUID REFERENCES financial_summaries(id),

  -- Input Data
  gross_revenue DECIMAL(15,2) NOT NULL,
  cost_of_goods_sold DECIMAL(15,2) DEFAULT 0,
  operating_expenses DECIMAL(15,2) DEFAULT 0,
  other_income DECIMAL(15,2) DEFAULT 0,
  other_expenses DECIMAL(15,2) DEFAULT 0,

  -- Deductions & Adjustments
  fiscal_corrections JSONB,
  allowable_deductions DECIMAL(15,2) DEFAULT 0,

  -- Taxable Income
  accounting_profit DECIMAL(15,2) GENERATED ALWAYS AS (
    gross_revenue - cost_of_goods_sold - operating_expenses + other_income - other_expenses
  ) STORED,
  fiscal_corrections_total DECIMAL(15,2) DEFAULT 0,
  taxable_income DECIMAL(15,2) NOT NULL,

  -- Tax Rate
  applicable_tax_rate DECIMAL(5,2) NOT NULL,
  tax_rate_basis VARCHAR(100),

  -- Tax Calculation
  gross_tax DECIMAL(15,2) NOT NULL,

  -- Incentives
  tax_incentives JSONB,
  total_incentives_reduction DECIMAL(15,2) DEFAULT 0,
  tax_after_incentives DECIMAL(15,2) NOT NULL,

  -- Credits & Previous Payments
  tax_credits DECIMAL(15,2) DEFAULT 0,
  previous_overpayment DECIMAL(15,2) DEFAULT 0,
  pph_23_withheld DECIMAL(15,2) DEFAULT 0,

  -- Final Tax
  net_tax_payable DECIMAL(15,2) NOT NULL,

  -- PPh 25 Installments
  monthly_installment_pph25 DECIMAL(15,2),

  -- Detailed Breakdown
  calculation_details JSONB,

  -- Official Filing
  espt_number VARCHAR(100),
  espt_file_url TEXT,
  espt_generated_at TIMESTAMP,
  filing_date DATE,
  filing_status VARCHAR(50) DEFAULT 'draft',
  filing_receipt_number VARCHAR(100),

  -- ZANTARA Integration
  zantara_query_used TEXT,
  zantara_references JSONB,
  zantara_recommendations TEXT,

  -- Workflow
  calculation_status VARCHAR(50) DEFAULT 'draft',
  calculated_by UUID REFERENCES tax_consultants(id),
  reviewed_by UUID REFERENCES tax_consultants(id),
  approved_by UUID REFERENCES tax_consultants(id),
  approved_at TIMESTAMP,

  -- Notes
  internal_notes TEXT,
  client_notes TEXT,
  rejection_reason TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  calculation_method VARCHAR(100) DEFAULT 'automated_v1',

  CONSTRAINT valid_calculation_type CHECK (calculation_type IN ('PPH_25', 'PPH_29', 'PPH_21', 'ANNUAL_RECONCILIATION')),
  CONSTRAINT valid_filing_status CHECK (filing_status IN ('draft', 'ready', 'filed', 'approved', 'rejected')),
  CONSTRAINT valid_calculation_status CHECK (calculation_status IN ('draft', 'pending_review', 'approved', 'rejected', 'filed'))
);

CREATE INDEX idx_tax_calculations_company ON tax_calculations(company_id);
CREATE INDEX idx_tax_calculations_period ON tax_calculations(fiscal_year, period);
CREATE INDEX idx_tax_calculations_status ON tax_calculations(calculation_status);
CREATE INDEX idx_tax_calculations_filing ON tax_calculations(filing_status);

-- Continue in next file due to length...
