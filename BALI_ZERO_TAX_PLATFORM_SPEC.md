# 🏢 BALI ZERO TAX PLATFORM - Technical Specification

**Version:** 1.0.0
**Date:** 2025-11-05
**Status:** Planning Phase
**Owner:** Bali Zero Tax Department

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Jurnal.id Integration](#jurnalid-integration)
6. [ZANTARA AI Integration](#zantara-ai-integration)
7. [Security & Privacy](#security--privacy)
8. [User Interface (GitHub Spark)](#user-interface-github-spark)
9. [Client Portal (my.balizero.com)](#client-portal-mybalizerocom)
10. [RAG Intelligence Feed](#rag-intelligence-feed)
11. [Implementation Phases](#implementation-phases)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Plan](#deployment-plan)
14. [Success Metrics](#success-metrics)

---

## 🎯 Executive Summary

### Purpose
Create a unified tax calculation and management platform for Bali Zero's tax department that:
- Integrates with Jurnal.id accounting system
- Automates corporate and personal tax calculations
- Provides AI-powered tax insights via ZANTARA
- Syncs essential data to client portal (my.balizero.com)
- Feeds business intelligence to ZANTARA RAG system

### Key Benefits
- **80% Time Reduction** in tax calculation workflow
- **100% Accuracy** with automated calculations
- **Real-time Insights** from ZANTARA AI
- **Client Self-Service** via portal
- **Data-Driven Intelligence** for business decisions

### Scope
- **Phase 1:** Internal tax department tool (5 users)
- **Phase 2:** Client portal integration (45+ clients)
- **Phase 3:** RAG intelligence & personalization

### Technology Stack
```
Frontend:     GitHub Spark (rapid prototyping)
Backend:      Node.js + TypeScript (existing backend-ts)
Database:     PostgreSQL (existing)
Integration:  Jurnal.id API, ZANTARA RAG API
Hosting:      Fly.io (existing infrastructure)
Portal:       Cloudflare Pages (my.balizero.com)
```

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BALI ZERO TAX PLATFORM                   │
│                                                             │
│  ┌────────────────┐                  ┌─────────────────┐   │
│  │  GitHub Spark  │◄────────────────►│  Backend API    │   │
│  │   Tax Admin    │   REST/WebSocket │  (backend-ts)   │   │
│  │      UI        │                  │                 │   │
│  └────────────────┘                  └────────┬────────┘   │
│                                              │            │
└──────────────────────────────────────────────┼─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────┐
                    ↓                          ↓                      ↓
        ┌─────────────────┐      ┌──────────────────┐    ┌─────────────────┐
        │  PostgreSQL DB  │      │   Jurnal.id API  │    │  ZANTARA RAG    │
        │                 │      │   (External)     │    │   Backend       │
        │ • Companies     │      │                  │    │                 │
        │ • Calculations  │      │ • Transactions   │    │ • Tax Knowledge │
        │ • Invoices      │      │ • Accounts       │    │ • AI Insights   │
        │ • Team          │      │ • Reports        │    │ • Personalization│
        └────────┬────────┘      └──────────────────┘    └─────────────────┘
                 │
                 ↓
    ┌────────────────────────┐
    │   Portal Sync Layer    │
    └────────────┬───────────┘
                 ↓
    ┌────────────────────────┐
    │  my.balizero.com       │
    │  Client Portal         │
    │  (Cloudflare Pages)    │
    └────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ WORKFLOW: Tax Calculation Process                               │
└─────────────────────────────────────────────────────────────────┘

1. CONSULTANT INITIATES
   ├─ Selects client/company
   └─ Chooses calculation period (Q1, Q2, etc.)

2. DATA IMPORT
   ├─ Sync from Jurnal.id API
   │  ├─ Revenue transactions
   │  ├─ Expense transactions
   │  └─ Account balances
   └─ Auto-populate form

3. TAX CALCULATION
   ├─ Apply PPh 25/29 formulas
   ├─ Check KBLI-based incentives
   └─ Query ZANTARA for insights

4. REVIEW & APPROVAL
   ├─ Consultant reviews
   ├─ ZANTARA provides recommendations
   └─ Manager approves (Veronika)

5. DISTRIBUTION
   ├─ Save to private database (full data)
   ├─ Sync to my.balizero.com (summary only)
   └─ Feed to ZANTARA RAG (anonymized intelligence)

6. CLIENT NOTIFICATION
   ├─ Email notification sent
   └─ Client accesses portal with email login
```

---

## 🗄️ Database Schema

### Overview
All tables extend existing PostgreSQL database in backend-ts.

### Schema Diagram

```sql
-- ============================================================
-- SECTION 1: TEAM & USER MANAGEMENT
-- ============================================================

CREATE TABLE tax_consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'tax_manager', 'tax_consultant', 'tax_expert', 'customer_service'

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

  -- Indexes
  CONSTRAINT valid_role CHECK (role IN ('tax_manager', 'tax_consultant', 'tax_expert', 'customer_service'))
);

CREATE INDEX idx_tax_consultants_email ON tax_consultants(email);
CREATE INDEX idx_tax_consultants_role ON tax_consultants(role);
CREATE INDEX idx_tax_consultants_active ON tax_consultants(active);

-- Pre-populate team
INSERT INTO tax_consultants (email, full_name, role, can_view_all_clients, can_create_calculations, can_approve_calculations, can_manage_users) VALUES
  ('veronika@balizero.com', 'Veronika', 'tax_manager', true, true, true, true),
  ('angel@balizero.com', 'Angel', 'tax_expert', true, true, false, false),
  ('kadek@balizero.com', 'Kadek', 'tax_consultant', true, true, false, false),
  ('dewaayu@balizero.com', 'Dewa Ayu', 'tax_consultant', true, true, false, false),
  ('monaka@balizero.com', 'Monaka', 'tax_consultant', true, true, false, false),
  ('faisha@balizero.com', 'Faisha', 'customer_service', true, false, false, false);

-- ============================================================
-- SECTION 2: CLIENT/COMPANY PROFILES
-- ============================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information (Anagrafica)
  company_name VARCHAR(255) NOT NULL,
  company_name_id VARCHAR(255), -- Indonesian name if different
  legal_entity_type VARCHAR(50) NOT NULL, -- 'PT', 'PT_PMA', 'CV', 'FIRMA', 'UD', 'PERORANGAN'

  -- Tax Identifiers
  npwp VARCHAR(50) UNIQUE,
  npwp_date DATE, -- Date NPWP was issued
  nib VARCHAR(50), -- NIB/OSS number

  -- Contact Information
  email VARCHAR(255) NOT NULL UNIQUE, -- 🔑 KEY: Used for my.balizero.com login
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
  industry_sector VARCHAR(100), -- 'manufacturing', 'trade', 'services', etc.
  business_description TEXT,

  -- Tax Information
  establishment_date DATE,
  fiscal_year_end VARCHAR(5) DEFAULT '12-31', -- MM-DD format
  tax_office_kpp VARCHAR(100), -- KPP assignment
  tax_zone VARCHAR(100), -- Special economic zone if applicable
  is_public_company BOOLEAN DEFAULT false,
  public_ownership_percentage DECIMAL(5,2), -- For listed company tax rate

  -- Assignment
  assigned_consultant_id UUID REFERENCES tax_consultants(id),
  assigned_date DATE,

  -- Document Management
  documents_folder_url TEXT, -- Google Drive / Dropbox folder link
  jurnal_company_id VARCHAR(100), -- Company ID in Jurnal.id system

  -- Client Relationship
  client_since DATE,
  contract_type VARCHAR(50), -- 'monthly', 'annual', 'per_project'
  service_package VARCHAR(100), -- 'basic', 'standard', 'premium'

  -- Status & Tags
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending', 'suspended'
  client_tags JSONB, -- ["high_priority", "monthly_reporting", "audit_risk"]
  risk_level VARCHAR(20), -- 'low', 'medium', 'high'

  -- Internal Notes (Private - not visible to client)
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

  -- Constraints
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

CREATE TABLE jurnal_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Jurnal.id Credentials
  jurnal_company_id VARCHAR(100) NOT NULL, -- Their company ID
  api_key TEXT NOT NULL, -- Encrypted
  api_secret TEXT, -- If required

  -- Connection Status
  connection_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'error'
  last_sync_success TIMESTAMP,
  last_sync_attempt TIMESTAMP,
  sync_error_message TEXT,

  -- Sync Configuration
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency VARCHAR(50) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'manual'
  sync_start_date DATE, -- Only sync data from this date forward

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

CREATE TABLE jurnal_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES jurnal_connections(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Sync Details
  sync_type VARCHAR(50), -- 'manual', 'scheduled', 'triggered'
  sync_status VARCHAR(50), -- 'in_progress', 'success', 'failed'

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
-- SECTION 4: FINANCIAL SUMMARIES (from Jurnal.id)
-- ============================================================

CREATE TABLE financial_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Period
  fiscal_year INTEGER NOT NULL,
  period_type VARCHAR(20) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4', 'ANNUAL', 'MONTHLY'
  period_month INTEGER, -- 1-12 if monthly
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Aggregated Financials (from Jurnal.id)
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_cost_of_goods_sold DECIMAL(15,2) DEFAULT 0,
  total_operating_expenses DECIMAL(15,2) DEFAULT 0,
  total_other_income DECIMAL(15,2) DEFAULT 0,
  total_other_expenses DECIMAL(15,2) DEFAULT 0,

  -- Calculated
  gross_profit DECIMAL(15,2) GENERATED ALWAYS AS (total_revenue - total_cost_of_goods_sold) STORED,
  operating_profit DECIMAL(15,2) GENERATED ALWAYS AS (total_revenue - total_cost_of_goods_sold - total_operating_expenses) STORED,
  net_profit_before_tax DECIMAL(15,2) GENERATED ALWAYS AS (
    total_revenue - total_cost_of_goods_sold - total_operating_expenses + total_other_income - total_other_expenses
  ) STORED,

  -- Detailed Breakdown
  revenue_breakdown JSONB, -- {"sales": 500M, "services": 50M}
  expense_breakdown JSONB, -- {"salaries": 100M, "rent": 50M, "utilities": 20M}

  -- Data Source
  source VARCHAR(50) DEFAULT 'jurnal', -- 'jurnal', 'manual', 'imported'
  jurnal_sync_id UUID REFERENCES jurnal_sync_log(id),

  -- Manual Adjustments
  manual_adjustments JSONB, -- [{"description": "One-time expense", "amount": -50000000}]
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

CREATE TABLE tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Calculation Info
  calculation_type VARCHAR(50) NOT NULL, -- 'PPH_25', 'PPH_29', 'PPH_21', 'ANNUAL_RECONCILIATION'
  fiscal_year INTEGER NOT NULL,
  period VARCHAR(20) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4', 'ANNUAL', 'JANUARY', etc.
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Link to Financial Data
  financial_summary_id UUID REFERENCES financial_summaries(id),

  -- Input Data (Full financial details - PRIVATE)
  gross_revenue DECIMAL(15,2) NOT NULL,
  cost_of_goods_sold DECIMAL(15,2) DEFAULT 0,
  operating_expenses DECIMAL(15,2) DEFAULT 0,
  other_income DECIMAL(15,2) DEFAULT 0,
  other_expenses DECIMAL(15,2) DEFAULT 0,

  -- Deductions & Adjustments
  fiscal_corrections JSONB, -- [{"description": "Non-deductible expense", "amount": 10000000}]
  allowable_deductions DECIMAL(15,2) DEFAULT 0,

  -- Taxable Income Calculation
  accounting_profit DECIMAL(15,2) GENERATED ALWAYS AS (
    gross_revenue - cost_of_goods_sold - operating_expenses + other_income - other_expenses
  ) STORED,
  fiscal_corrections_total DECIMAL(15,2) DEFAULT 0,
  taxable_income DECIMAL(15,2) NOT NULL,

  -- Tax Rate Determination
  applicable_tax_rate DECIMAL(5,2) NOT NULL, -- 22%, 11%, 0.5%, etc.
  tax_rate_basis VARCHAR(100), -- 'standard_22', 'msme_pp55', 'simplified_0.5', 'listed_19'

  -- Tax Calculation
  gross_tax DECIMAL(15,2) NOT NULL,

  -- Incentives Applied
  tax_incentives JSONB, -- [{"type": "investment_allowance", "percentage": 30, "amount": 5000000}]
  total_incentives_reduction DECIMAL(15,2) DEFAULT 0,
  tax_after_incentives DECIMAL(15,2) NOT NULL,

  -- Credits & Previous Payments
  tax_credits DECIMAL(15,2) DEFAULT 0,
  previous_overpayment DECIMAL(15,2) DEFAULT 0,
  pph_23_withheld DECIMAL(15,2) DEFAULT 0, -- Withholding tax already paid

  -- Final Tax
  net_tax_payable DECIMAL(15,2) NOT NULL, -- 🔑 Goes to my.balizero.com

  -- PPh 25 Installments (if applicable)
  monthly_installment_pph25 DECIMAL(15,2),

  -- Detailed Breakdown (for internal use)
  calculation_details JSONB, -- Full step-by-step calculation

  -- Official Filing
  espt_number VARCHAR(100), -- 🔑 e-SPT number - Goes to my.balizero.com
  espt_file_url TEXT, -- Link to e-SPT PDF
  espt_generated_at TIMESTAMP,
  filing_date DATE,
  filing_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'ready', 'filed', 'approved', 'rejected'
  filing_receipt_number VARCHAR(100),

  -- ZANTARA Integration
  zantara_query_used TEXT, -- What we asked ZANTARA
  zantara_references JSONB, -- [{doc_id, title, relevance_score, snippet}]
  zantara_recommendations TEXT, -- AI recommendations

  -- Workflow
  calculation_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_review', 'approved', 'rejected', 'filed'
  calculated_by UUID REFERENCES tax_consultants(id),
  reviewed_by UUID REFERENCES tax_consultants(id),
  approved_by UUID REFERENCES tax_consultants(id),
  approved_at TIMESTAMP,

  -- Notes
  internal_notes TEXT, -- Private notes for tax team
  client_notes TEXT, -- Notes visible to client on portal
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

-- ============================================================
-- SECTION 6: TAX PAYMENTS TRACKING
-- ============================================================

CREATE TABLE tax_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES tax_calculations(id) ON DELETE SET NULL,

  -- Payment Info
  payment_type VARCHAR(50) NOT NULL, -- 'PPH_25', 'PPH_29', 'PPH_21', 'PPN'
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
  payment_method VARCHAR(50), -- 'bank_transfer', 'e-billing', 'cash'
  payment_reference VARCHAR(100), -- Bank transaction reference
  payment_receipt_url TEXT,
  tax_office_kpp VARCHAR(100),

  -- Status
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'overdue', 'waived'

  -- Penalties (if late)
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

CREATE TABLE tax_incentives_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Incentive Details
  incentive_type VARCHAR(100) NOT NULL, -- 'tax_holiday', 'investment_allowance', 'super_deduction_rd', 'special_zone'
  incentive_name VARCHAR(255) NOT NULL,
  regulation_reference VARCHAR(100), -- 'PP 29/2020', 'PMK 130/2020', etc.

  -- Eligibility
  eligible_from DATE NOT NULL,
  eligible_until DATE,
  reduction_percentage DECIMAL(5,2), -- e.g., 50% reduction
  reduction_amount DECIMAL(15,2), -- Fixed amount if applicable

  -- Conditions
  eligibility_conditions JSONB, -- [{condition: "R&D investment > 5%", met: true}]
  required_documents JSONB, -- ["SKB", "Certificate from Ministry"]

  -- Application Status
  application_status VARCHAR(50) DEFAULT 'eligible', -- 'eligible', 'applied', 'approved', 'rejected', 'expired'
  application_date DATE,
  approval_date DATE,
  approval_number VARCHAR(100),
  approval_document_url TEXT,

  -- Zantara Link
  zantara_doc_id VARCHAR(100), -- Link to knowledge base document

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

CREATE TABLE kbli_tax_rules (
  kbli_code VARCHAR(10) PRIMARY KEY,
  kbli_description TEXT NOT NULL,

  -- Tax Rules
  standard_corporate_tax_rate DECIMAL(5,2) DEFAULT 22.00,
  eligible_for_msme_simplified BOOLEAN DEFAULT false,
  eligible_for_incentives BOOLEAN DEFAULT false,

  -- Special Rules
  special_deductions JSONB, -- Specific to industry
  special_requirements JSONB,
  risk_areas JSONB, -- ["transfer_pricing", "related_party_transactions"]

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

CREATE TABLE portal_sync_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES tax_calculations(id) ON DELETE CASCADE,

  -- Public Data (visible to client on portal)
  fiscal_year INTEGER NOT NULL,
  period VARCHAR(20) NOT NULL,
  calculation_type VARCHAR(50) NOT NULL,

  -- Summary Only (NO detailed financial data)
  total_tax_payable DECIMAL(15,2) NOT NULL, -- Just the final number
  monthly_installment DECIMAL(15,2), -- PPh 25 monthly if applicable

  -- Official Documents
  espt_number VARCHAR(100),
  espt_download_url TEXT, -- Signed URL with expiration
  espt_generated_date DATE,

  -- Payment Info
  payment_due_date DATE,
  payment_status VARCHAR(50), -- 'pending', 'paid', 'overdue'
  amount_paid DECIMAL(15,2),
  payment_date DATE,

  -- Client Communication
  client_message TEXT, -- Message from consultant to client
  client_notes TEXT, -- Notes visible to client
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
-- SECTION 10: RAG INTELLIGENCE FEED (ZANTARA)
-- ============================================================

CREATE TABLE rag_intelligence_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Anonymized Company Data (for BI, NO specific identifying info)
  company_size_bracket VARCHAR(50), -- 'micro', 'small', 'medium', 'large'
  legal_entity_type VARCHAR(50),
  kbli_code VARCHAR(10),
  industry_sector VARCHAR(100),
  location_province VARCHAR(100),
  tax_zone VARCHAR(100),
  years_in_business INTEGER,

  -- Aggregated Financial Data (NO exact amounts)
  revenue_bracket VARCHAR(50), -- '0-4.8B', '4.8B-50B', '50B-500B', '500B+'
  revenue_growth_yoy DECIMAL(5,2), -- Percentage only
  profitability_bracket VARCHAR(50), -- 'loss', 'low', 'medium', 'high'

  -- Tax Intelligence
  fiscal_year INTEGER,
  tax_rate_applied DECIMAL(5,2),
  incentives_used JSONB, -- Types only, no amounts: ["investment_allowance", "R&D_deduction"]
  effective_tax_rate DECIMAL(5,2), -- Aggregate metric

  -- Patterns & Insights (for AI learning)
  common_questions JSONB, -- Questions the client asked
  tax_challenges JSONB, -- Issues encountered: ["late_payment", "document_missing"]
  compliance_score DECIMAL(3,2), -- 0-1 score

  -- Industry Insights
  industry_benchmarks JSONB, -- How they compare to industry
  recommendations_applied JSONB, -- Which ZANTARA recommendations were followed

  -- Client Personalization Data
  client_email_hash VARCHAR(255) NOT NULL, -- SHA256 hash of email for identification
  client_preferences JSONB, -- Chat preferences, communication style
  interaction_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMP,

  -- Topics of Interest
  frequent_topics JSONB, -- ["VAT", "expatriate_tax", "incentives"]
  document_types_accessed JSONB, -- Types of documents they request

  -- RAG Sync Status
  synced_to_rag BOOLEAN DEFAULT false,
  synced_at TIMESTAMP,
  rag_collection_id VARCHAR(100), -- Collection in ZANTARA RAG

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
-- SECTION 11: INVOICING (Bali Zero services)
-- ============================================================

CREATE TABLE balizero_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Invoice Info
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- "BZ-2024-0001"
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
  /* [
    {
      "description": "Q4 2024 Tax Calculation & Filing",
      "quantity": 1,
      "unit_price": 5000000,
      "subtotal": 5000000
    },
    {
      "description": "Annual Tax Report Preparation",
      "quantity": 1,
      "unit_price": 10000000,
      "subtotal": 10000000
    }
  ] */

  -- Amounts
  subtotal DECIMAL(15,2) NOT NULL,
  vat_percentage DECIMAL(5,2) DEFAULT 11.00, -- PPN
  vat_amount DECIMAL(15,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,

  -- Payment
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'overdue', 'cancelled'
  amount_paid DECIMAL(15,2) DEFAULT 0,
  paid_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),

  -- Files
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP,

  -- Notes
  invoice_notes TEXT, -- Notes on invoice visible to client
  internal_notes TEXT, -- Private notes

  -- Related
  related_calculation_ids UUID[], -- Array of calculation IDs this invoice is for

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

CREATE TABLE invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  -- Template Items
  service_items JSONB NOT NULL,
  /* [
    {"name": "Monthly Tax Consultation", "default_price": 3000000, "category": "consultation"},
    {"name": "PPh 25 Calculation & Filing", "default_price": 2000000, "category": "filing"},
    {"name": "Annual Tax Report", "default_price": 10000000, "category": "annual"}
  ] */

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
  ]'::jsonb);

-- ============================================================
-- SECTION 12: AUDIT TRAIL
-- ============================================================

CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'

  -- Who
  user_id UUID REFERENCES tax_consultants(id),
  user_email VARCHAR(255),
  user_role VARCHAR(50),

  -- When
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Details
  changes JSONB, -- {field: {old: "value1", new: "value2"}}
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

CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'tax_rates', 'thresholds', 'features', 'integrations'
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
  'integrations');

```

---

*[Document continues in next part due to length...]*
