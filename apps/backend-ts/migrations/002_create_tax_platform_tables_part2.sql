-- ============================================================
-- BALI ZERO TAX PLATFORM - DATABASE MIGRATION 002
-- Description: Create remaining tax platform tables (Part 2)
-- Version: 1.0.0
-- Date: 2025-11-05
-- Author: Claude Code
-- ============================================================

-- ============================================================
-- SECTION 6: TAX PAYMENTS TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES tax_calculations(id) ON DELETE SET NULL,

  -- Payment Info
  payment_type VARCHAR(50) NOT NULL,
  payment_description TEXT,

  -- Amounts
  amount_due DECIMAL(15,2) NOT NULL,
  amount_paid DECIMAL(15,2),
  amount_outstanding DECIMAL(15,2) GENERATED ALWAYS AS (amount_due - COALESCE(amount_paid, 0)) STORED,

  -- Dates
  due_date DATE NOT NULL,
  payment_date DATE,
  late_days INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN payment_date IS NOT NULL AND payment_date > due_date
      THEN EXTRACT(DAY FROM payment_date - due_date)::INTEGER
      WHEN payment_date IS NULL AND CURRENT_DATE > due_date
      THEN EXTRACT(DAY FROM CURRENT_DATE - due_date)::INTEGER
      ELSE 0
    END
  ) STORED,

  -- Payment Details
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  payment_receipt_url TEXT,
  tax_office_kpp VARCHAR(100),

  -- Status
  payment_status VARCHAR(50) DEFAULT 'unpaid',

  -- Penalties
  penalty_amount DECIMAL(15,2) DEFAULT 0,
  penalty_notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES tax_consultants(id),

  CONSTRAINT valid_payment_type CHECK (payment_type IN ('PPH_25', 'PPH_29', 'PPH_21', 'PPN')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue', 'waived'))
);

CREATE INDEX idx_tax_payments_company ON tax_payments(company_id);
CREATE INDEX idx_tax_payments_status ON tax_payments(payment_status);
CREATE INDEX idx_tax_payments_due ON tax_payments(due_date);

-- ============================================================
-- SECTION 7: TAX INCENTIVES REGISTRY
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_incentives_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Incentive Details
  incentive_type VARCHAR(100) NOT NULL,
  incentive_name VARCHAR(255) NOT NULL,
  regulation_reference VARCHAR(100),

  -- Eligibility
  eligible_from DATE NOT NULL,
  eligible_until DATE,
  reduction_percentage DECIMAL(5,2),
  reduction_amount DECIMAL(15,2),

  -- Conditions
  eligibility_conditions JSONB,
  required_documents JSONB,

  -- Application Status
  application_status VARCHAR(50) DEFAULT 'eligible',
  application_date DATE,
  approval_date DATE,
  approval_number VARCHAR(100),
  approval_document_url TEXT,

  -- Zantara Link
  zantara_doc_id VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES tax_consultants(id),

  CONSTRAINT valid_application_status CHECK (application_status IN ('eligible', 'applied', 'approved', 'rejected', 'expired'))
);

CREATE INDEX idx_tax_incentives_company ON tax_incentives_registry(company_id);
CREATE INDEX idx_tax_incentives_type ON tax_incentives_registry(incentive_type);
CREATE INDEX idx_tax_incentives_status ON tax_incentives_registry(application_status);

-- ============================================================
-- SECTION 8: KBLI TAX RULES CACHE
-- ============================================================

CREATE TABLE IF NOT EXISTS kbli_tax_rules (
  kbli_code VARCHAR(10) PRIMARY KEY,
  kbli_description TEXT NOT NULL,

  -- Tax Rules
  standard_corporate_tax_rate DECIMAL(5,2) DEFAULT 22.00,
  eligible_for_msme_simplified BOOLEAN DEFAULT false,
  eligible_for_incentives BOOLEAN DEFAULT false,

  -- Special Rules
  special_deductions JSONB,
  special_requirements JSONB,
  risk_areas JSONB,

  -- Compliance Notes
  common_audit_issues TEXT,
  documentation_requirements TEXT,

  -- ZANTARA Sync
  zantara_synced_at TIMESTAMP,
  zantara_references JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kbli_tax_rules_code ON kbli_tax_rules(kbli_code);

-- ============================================================
-- SECTION 9: PORTAL SYNC (my.balizero.com)
-- ============================================================

CREATE TABLE IF NOT EXISTS portal_sync_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES tax_calculations(id) ON DELETE CASCADE,

  -- Public Data
  fiscal_year INTEGER NOT NULL,
  period VARCHAR(20) NOT NULL,
  calculation_type VARCHAR(50) NOT NULL,

  -- Summary Only
  total_tax_payable DECIMAL(15,2) NOT NULL,
  monthly_installment DECIMAL(15,2),

  -- Official Documents
  espt_number VARCHAR(100),
  espt_download_url TEXT,
  espt_generated_date DATE,

  -- Payment Info
  payment_due_date DATE,
  payment_status VARCHAR(50),
  amount_paid DECIMAL(15,2),
  payment_date DATE,

  -- Client Communication
  client_message TEXT,
  client_notes TEXT,
  consultant_name VARCHAR(255),
  consultant_email VARCHAR(255),

  -- Portal Sync Status
  synced_to_portal BOOLEAN DEFAULT false,
  synced_at TIMESTAMP,
  sync_error_message TEXT,

  -- Client Interaction
  client_viewed BOOLEAN DEFAULT false,
  client_viewed_at TIMESTAMP,
  client_downloaded_espt BOOLEAN DEFAULT false,
  client_download_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(calculation_id)
);

CREATE INDEX idx_portal_sync_company ON portal_sync_data(company_id);
CREATE INDEX idx_portal_sync_status ON portal_sync_data(synced_to_portal);

-- ============================================================
-- SECTION 10: RAG INTELLIGENCE FEED
-- ============================================================

CREATE TABLE IF NOT EXISTS rag_intelligence_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Anonymized Company Data
  company_size_bracket VARCHAR(50),
  legal_entity_type VARCHAR(50),
  kbli_code VARCHAR(10),
  industry_sector VARCHAR(100),
  location_province VARCHAR(100),
  tax_zone VARCHAR(100),
  years_in_business INTEGER,

  -- Aggregated Financial Data
  revenue_bracket VARCHAR(50),
  revenue_growth_yoy DECIMAL(5,2),
  profitability_bracket VARCHAR(50),

  -- Tax Intelligence
  fiscal_year INTEGER,
  tax_rate_applied DECIMAL(5,2),
  incentives_used JSONB,
  effective_tax_rate DECIMAL(5,2),

  -- Patterns & Insights
  common_questions JSONB,
  tax_challenges JSONB,
  compliance_score DECIMAL(3,2),

  -- Industry Insights
  industry_benchmarks JSONB,
  recommendations_applied JSONB,

  -- Client Personalization Data
  client_email_hash VARCHAR(255) NOT NULL,
  client_preferences JSONB,
  interaction_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMP,

  -- Topics of Interest
  frequent_topics JSONB,
  document_types_accessed JSONB,

  -- RAG Sync Status
  synced_to_rag BOOLEAN DEFAULT false,
  synced_at TIMESTAMP,
  rag_collection_id VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_company_size CHECK (company_size_bracket IN ('micro', 'small', 'medium', 'large')),
  CONSTRAINT valid_revenue_bracket CHECK (revenue_bracket IN ('0-4.8B', '4.8B-50B', '50B-500B', '500B+')),
  CONSTRAINT valid_profitability CHECK (profitability_bracket IN ('loss', 'low', 'medium', 'high'))
);

CREATE INDEX idx_rag_feed_kbli ON rag_intelligence_feed(kbli_code);
CREATE INDEX idx_rag_feed_year ON rag_intelligence_feed(fiscal_year);
CREATE INDEX idx_rag_feed_email_hash ON rag_intelligence_feed(client_email_hash);
CREATE INDEX idx_rag_feed_synced ON rag_intelligence_feed(synced_to_rag);

-- ============================================================
-- SECTION 11: INVOICING
-- ============================================================

CREATE TABLE IF NOT EXISTS balizero_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Invoice Info
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,

  -- Client
  company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
  bill_to_name VARCHAR(255) NOT NULL,
  bill_to_address TEXT,
  bill_to_npwp VARCHAR(50),
  bill_to_email VARCHAR(255),

  -- Services Provided
  line_items JSONB NOT NULL,

  -- Amounts
  subtotal DECIMAL(15,2) NOT NULL,
  vat_percentage DECIMAL(5,2) DEFAULT 11.00,
  vat_amount DECIMAL(15,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,

  -- Payment
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  amount_paid DECIMAL(15,2) DEFAULT 0,
  paid_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),

  -- Files
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP,

  -- Notes
  invoice_notes TEXT,
  internal_notes TEXT,

  -- Related
  related_calculation_ids UUID[],

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES tax_consultants(id),

  CONSTRAINT valid_payment_status_invoice CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue', 'cancelled'))
);

CREATE INDEX idx_balizero_invoices_company ON balizero_invoices(company_id);
CREATE INDEX idx_balizero_invoices_number ON balizero_invoices(invoice_number);
CREATE INDEX idx_balizero_invoices_status ON balizero_invoices(payment_status);
CREATE INDEX idx_balizero_invoices_date ON balizero_invoices(invoice_date);

CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  -- Template Items
  service_items JSONB NOT NULL,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pre-populate common services
INSERT INTO invoice_templates (template_name, description, service_items) VALUES
('Standard Monthly Package', 'Standard monthly tax services',
  '[
    {"name": "Monthly Tax Consultation", "default_price": 3000000, "category": "consultation"},
    {"name": "PPh 25 Calculation", "default_price": 2000000, "category": "calculation"}
  ]'::jsonb),
('Quarterly Reporting', 'Quarterly tax calculation and filing',
  '[
    {"name": "Quarterly Tax Calculation", "default_price": 5000000, "category": "calculation"},
    {"name": "e-SPT Preparation & Filing", "default_price": 1000000, "category": "filing"}
  ]'::jsonb),
('Annual Package', 'Complete annual tax services',
  '[
    {"name": "Annual Tax Report", "default_price": 10000000, "category": "annual"},
    {"name": "PPh 29 Reconciliation", "default_price": 5000000, "category": "reconciliation"}
  ]'::jsonb)
ON CONFLICT (template_name) DO NOTHING;

-- ============================================================
-- SECTION 12: AUDIT TRAIL
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,

  -- Who
  user_id UUID REFERENCES tax_consultants(id),
  user_email VARCHAR(255),
  user_role VARCHAR(50),

  -- When
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Details
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,

  -- Context
  reason TEXT,

  CONSTRAINT valid_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'APPROVE', 'REJECT'))
);

CREATE INDEX idx_audit_trail_table ON audit_trail(table_name);
CREATE INDEX idx_audit_trail_record ON audit_trail(record_id);
CREATE INDEX idx_audit_trail_user ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_timestamp ON audit_trail(timestamp);

-- ============================================================
-- SECTION 13: SYSTEM CONFIGURATION
-- ============================================================

CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES tax_consultants(id)
);

-- Pre-populate system configurations
INSERT INTO system_config (key, value, description, category) VALUES
('tax_rates_corporate',
  '{"standard": 22, "listed_company": 19, "msme_bracket_1": 11, "simplified": 0.5}'::jsonb,
  'Current corporate tax rates in Indonesia',
  'tax_rates'),
('ptkp_values_2024',
  '{"TK0": 54000000, "K0": 58500000, "K1": 63000000, "K2": 67500000, "K3": 72000000}'::jsonb,
  'PTKP values for 2024 (PPh 21)',
  'tax_rates'),
('msme_thresholds',
  '{"simplified_max": 4800000000, "small_business_max": 50000000000}'::jsonb,
  'MSME revenue thresholds',
  'thresholds'),
('jurnal_api_config',
  '{"base_url": "https://api.jurnal.id/v1", "timeout": 30000}'::jsonb,
  'Jurnal.id API configuration',
  'integrations'),
('zantara_config',
  '{"rag_url": "https://nuzantara-rag.fly.dev", "collection": "tax_genius", "min_confidence": 0.7}'::jsonb,
  'ZANTARA RAG integration config',
  'integrations')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_tax_consultants_updated_at BEFORE UPDATE ON tax_consultants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jurnal_connections_updated_at BEFORE UPDATE ON jurnal_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_summaries_updated_at BEFORE UPDATE ON financial_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_calculations_updated_at BEFORE UPDATE ON tax_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_payments_updated_at BEFORE UPDATE ON tax_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_incentives_updated_at BEFORE UPDATE ON tax_incentives_registry FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kbli_tax_rules_updated_at BEFORE UPDATE ON kbli_tax_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portal_sync_updated_at BEFORE UPDATE ON portal_sync_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rag_feed_updated_at BEFORE UPDATE ON rag_intelligence_feed FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_balizero_invoices_updated_at BEFORE UPDATE ON balizero_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_templates_updated_at BEFORE UPDATE ON invoice_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration complete
SELECT 'Bali Zero Tax Platform database migration completed successfully!' as status;
