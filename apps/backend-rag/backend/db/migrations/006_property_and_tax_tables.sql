-- Property and Tax Data Tables
-- Created: 2025-10-21
-- Purpose: Store property listings, market data, and tax optimization data

-- ========================================
-- PROPERTY LISTINGS TABLE
-- ========================================
-- Stores scraped property listings from various sources

CREATE TABLE IF NOT EXISTS property_listings (
    id SERIAL PRIMARY KEY,
    content_id VARCHAR(100) UNIQUE NOT NULL,

    -- Basic Info
    title TEXT NOT NULL,
    location VARCHAR(255),
    area VARCHAR(100), -- Canggu, Seminyak, etc
    property_type VARCHAR(50), -- villa, land, commercial, residential
    ownership VARCHAR(50), -- freehold, leasehold, HGB, HakPakai

    -- Pricing
    price BIGINT,
    size_are INTEGER, -- Size in are (100 m2)
    price_per_are BIGINT,

    -- Market Analysis
    market_position VARCHAR(100), -- Above/below/at market

    -- Source
    source VARCHAR(255),
    source_url TEXT,

    -- Risks & Opportunities (arrays)
    risks TEXT[],
    opportunities TEXT[],

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_property_listings_area ON property_listings(area);
CREATE INDEX idx_property_listings_type ON property_listings(property_type);
CREATE INDEX idx_property_listings_ownership ON property_listings(ownership);
CREATE INDEX idx_property_listings_price ON property_listings(price);
CREATE INDEX idx_property_listings_scraped ON property_listings(scraped_at DESC);

-- ========================================
-- PROPERTY MARKET DATA TABLE
-- ========================================
-- Time-series market data per area

CREATE TABLE IF NOT EXISTS property_market_data (
    id SERIAL PRIMARY KEY,
    area VARCHAR(100) NOT NULL,

    -- Market Metrics
    avg_price_per_are BIGINT,
    median_price_per_are BIGINT,
    min_price_per_are BIGINT,
    max_price_per_are BIGINT,

    -- Volume
    listings_count INTEGER,
    sales_volume INTEGER,

    -- Trend
    trend VARCHAR(20), -- increasing, stable, decreasing
    price_change_pct FLOAT, -- Monthly % change

    -- Days on Market
    avg_days_on_market INTEGER,

    -- Market Temperature
    hotness VARCHAR(20), -- very_hot, hot, warm, cold

    -- Time Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(area, period_start, period_end)
);

CREATE INDEX idx_property_market_area ON property_market_data(area);
CREATE INDEX idx_property_market_period ON property_market_data(period_start DESC);

-- ========================================
-- PROPERTY DUE DILIGENCE TABLE
-- ========================================
-- Stores due diligence reports for properties

CREATE TABLE IF NOT EXISTS property_due_diligence (
    id SERIAL PRIMARY KEY,
    property_listing_id INTEGER REFERENCES property_listings(id),

    -- Overall Assessment
    overall_risk VARCHAR(20), -- low, medium, high, critical
    recommendation VARCHAR(50), -- proceed, proceed_with_caution, avoid

    -- Checks (JSONB array)
    checks JSONB, -- Array of due diligence checks

    -- Findings
    red_flags TEXT[],
    opportunities TEXT[],

    -- Valuation
    estimated_value BIGINT,
    confidence_score FLOAT, -- 0-1

    -- Comparables (JSONB array)
    comparables JSONB,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_due_diligence_property ON property_due_diligence(property_listing_id);
CREATE INDEX idx_due_diligence_risk ON property_due_diligence(overall_risk);

-- ========================================
-- LEGAL STRUCTURES TABLE
-- ========================================
-- Legal structure recommendations for property ownership

CREATE TABLE IF NOT EXISTS property_legal_structures (
    id SERIAL PRIMARY KEY,
    structure_type VARCHAR(100) NOT NULL, -- PT_PMA, Hak_Pakai, Leasehold, etc

    -- Description
    name VARCHAR(255),
    description TEXT,

    -- Eligibility
    foreign_eligible BOOLEAN DEFAULT false,
    requirements TEXT[],

    -- Pros & Cons
    pros TEXT[],
    cons TEXT[],

    -- Costs
    setup_cost_min BIGINT,
    setup_cost_max BIGINT,
    annual_cost_min BIGINT,
    annual_cost_max BIGINT,

    -- Timeline
    timeline_min_days INTEGER,
    timeline_max_days INTEGER,

    -- Risks
    risks TEXT[],

    -- Applicable Property Types
    applicable_property_types TEXT[], -- villa, land, commercial

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_legal_structures_type ON property_legal_structures(structure_type);
CREATE INDEX idx_legal_structures_foreign ON property_legal_structures(foreign_eligible);

-- ========================================
-- TAX OPTIMIZATION STRATEGIES TABLE
-- ========================================
-- Tax optimization strategies and calculations

CREATE TABLE IF NOT EXISTS tax_optimization_strategies (
    id SERIAL PRIMARY KEY,

    -- Strategy Info
    strategy_name VARCHAR(255) NOT NULL,
    strategy_type VARCHAR(100), -- small_business_rate, super_deduction, treaty_benefits, etc
    description TEXT,

    -- Eligibility
    eligibility_criteria JSONB, -- JSON of criteria

    -- Savings
    potential_saving_formula TEXT, -- Description of calculation
    example_saving_amount BIGINT,

    -- Risk
    risk_level VARCHAR(20), -- low, medium, high

    -- Requirements
    requirements TEXT[],

    -- Timeline
    timeline VARCHAR(100),

    -- Legal Basis
    legal_basis VARCHAR(255), -- PP 23/2018, PMK 153/2020, etc

    -- Applicable Entities
    applicable_entity_types TEXT[], -- PT_PMA, PT, Individual, etc

    -- Active Status
    active BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tax_strategies_type ON tax_optimization_strategies(strategy_type);
CREATE INDEX idx_tax_strategies_active ON tax_optimization_strategies(active);

-- ========================================
-- TAX AUDIT RISK FACTORS TABLE
-- ========================================
-- Factors that contribute to tax audit risk

CREATE TABLE IF NOT EXISTS tax_audit_risk_factors (
    id SERIAL PRIMARY KEY,

    -- Factor Info
    factor_name VARCHAR(255) NOT NULL,
    factor_category VARCHAR(100), -- profit_margin, expenses, related_parties, etc
    description TEXT,

    -- Risk Scoring
    risk_score_weight INTEGER, -- Points added to audit risk score

    -- Threshold
    threshold_type VARCHAR(50), -- ratio, amount, boolean
    threshold_value FLOAT,

    -- Recommendation
    mitigation_recommendation TEXT,

    -- Active Status
    active BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_factors_category ON tax_audit_risk_factors(factor_category);
CREATE INDEX idx_audit_factors_active ON tax_audit_risk_factors(active);

-- ========================================
-- COMPANY PROFILES TABLE
-- ========================================
-- Store company profiles for tax analysis

CREATE TABLE IF NOT EXISTS company_profiles (
    id SERIAL PRIMARY KEY,

    -- Company Info
    company_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50), -- PT_PMA, PT, CV, etc
    industry VARCHAR(100),

    -- Financial Data
    annual_revenue BIGINT,
    profit_margin FLOAT,

    -- Tax Profile
    has_rnd BOOLEAN DEFAULT false,
    has_training BOOLEAN DEFAULT false,
    has_parent_abroad BOOLEAN DEFAULT false,
    parent_country VARCHAR(100),
    has_related_parties BOOLEAN DEFAULT false,
    related_party_transactions BIGINT,

    -- Expense Ratios
    entertainment_expense BIGINT,
    cash_transactions BIGINT,

    -- VAT
    vat_gap BIGINT,

    -- Audit History
    previous_audit BOOLEAN DEFAULT false,
    previous_audit_findings INTEGER DEFAULT 0,

    -- User Association
    user_id VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_company_profiles_user ON company_profiles(user_id);
CREATE INDEX idx_company_profiles_entity ON company_profiles(entity_type);

-- ========================================
-- TAX TREATY BENEFITS TABLE
-- ========================================
-- Tax treaty information for different countries

CREATE TABLE IF NOT EXISTS tax_treaty_benefits (
    id SERIAL PRIMARY KEY,

    -- Country
    country_name VARCHAR(100) UNIQUE NOT NULL,

    -- Rates
    dividend_rate FLOAT, -- Reduced withholding rate
    royalty_rate FLOAT,
    interest_rate FLOAT,

    -- Capital Gains
    capital_gains_exempt BOOLEAN DEFAULT false,

    -- Requirements
    requirements TEXT[],

    -- Documentation
    required_documents TEXT[],

    -- Active Status
    active BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tax_treaties_country ON tax_treaty_benefits(country_name);

-- ========================================
-- SEED DATA - Property Legal Structures
-- ========================================

INSERT INTO property_legal_structures (structure_type, name, description, foreign_eligible, pros, cons, setup_cost_min, setup_cost_max, annual_cost_min, annual_cost_max, timeline_min_days, timeline_max_days, requirements, risks, applicable_property_types) VALUES
('PT_PMA', 'PT PMA Company', 'Foreign investment company for property ownership', true,
    ARRAY['Can hold HGB rights (30+20+30 years)', 'Legal and secure', 'Can mortgage property', 'Can rent commercially', 'Asset protection'],
    ARRAY['High setup cost', 'Minimum investment 10B IDR', 'Annual compliance', 'Cannot hold freehold'],
    40000000, 60000000, 30000000, 50000000, 21, 28,
    ARRAY['10B IDR investment plan', '2 shareholders minimum', 'Indonesian director', 'Physical office'],
    ARRAY['Regulatory changes', 'Compliance burden'],
    ARRAY['villa', 'land', 'commercial']
),
('HAK_PAKAI', 'Hak Pakai (Right to Use)', 'Direct ownership for foreigners', true,
    ARRAY['Direct ownership for foreigners', 'No company needed', '25+20+25 years', 'Simpler process'],
    ARRAY['Cannot mortgage', 'Limited property types', 'Minimum price requirements', 'Cannot sublet easily'],
    10000000, 20000000, 0, 1000000, 14, 21,
    ARRAY['Valid KITAS/KITAP', 'Property meets minimum value', 'Not agricultural land'],
    ARRAY['Limited financing options', 'Resale restrictions'],
    ARRAY['villa', 'residential']
),
('LEASEHOLD', 'Long-term Lease', 'Lease agreement (25-30 years)', true,
    ARRAY['Lower upfront cost', 'Flexibility', 'Can be extended', 'No ownership restrictions'],
    ARRAY['No asset ownership', 'Renewal uncertainty', 'Cannot mortgage', 'Deprecating value'],
    5000000, 10000000, 0, 0, 7, 7,
    ARRAY['Lease agreement', 'Notarized contract', 'Clear terms'],
    ARRAY['Lease not renewed', 'Landlord disputes'],
    ARRAY['villa', 'land', 'residential', 'commercial']
)
ON CONFLICT DO NOTHING;

-- ========================================
-- SEED DATA - Tax Optimization Strategies
-- ========================================

INSERT INTO tax_optimization_strategies (strategy_name, strategy_type, description, eligibility_criteria, risk_level, requirements, timeline, legal_basis, applicable_entity_types, active) VALUES
('Small Business Tax Rate', 'small_business_rate', 'Qualify for 0.5% tax rate instead of 22%',
    '{"revenue_max": 4800000000}'::jsonb, 'low',
    ARRAY['Revenue < 4.8B IDR annually', 'Proper bookkeeping', 'Annual election'],
    'Immediate (next tax year)', 'PP 23/2018',
    ARRAY['PT', 'PT_PMA', 'CV'], true
),
('Super Deduction R&D', 'super_deduction', '200% deduction for R&D expenses',
    '{"has_rnd": true}'::jsonb, 'low',
    ARRAY['Approved R&D activities', 'Proper documentation', 'Annual application'],
    'Next tax year', 'PMK 153/2020',
    ARRAY['PT', 'PT_PMA'], true
),
('Super Deduction Vocational Training', 'super_deduction', '200% deduction for vocational training expenses',
    '{"has_training": true}'::jsonb, 'low',
    ARRAY['Approved training programs', 'Documentation', 'Training certificates'],
    'Next tax year', 'PMK 153/2020',
    ARRAY['PT', 'PT_PMA'], true
),
('Tax Treaty Benefits', 'treaty_benefits', 'Reduced withholding tax via tax treaty',
    '{"has_parent_abroad": true}'::jsonb, 'low',
    ARRAY['Tax residency certificate', 'DGT form', 'Parent company abroad'],
    '1-2 months', 'Tax Treaty',
    ARRAY['PT_PMA'], true
)
ON CONFLICT DO NOTHING;

-- ========================================
-- SEED DATA - Tax Treaty Benefits
-- ========================================

INSERT INTO tax_treaty_benefits (country_name, dividend_rate, royalty_rate, interest_rate, capital_gains_exempt, requirements, required_documents, active) VALUES
('Italy', 0.10, 0.10, 0.10, false,
    ARRAY['Tax residency certificate', 'Beneficial ownership declaration'],
    ARRAY['Certificate of residence', 'DGT form'], true
),
('Singapore', 0.10, 0.08, 0.10, false,
    ARRAY['Tax residency certificate', 'Beneficial ownership declaration'],
    ARRAY['Certificate of residence', 'DGT form'], true
),
('Netherlands', 0.05, 0.05, 0.05, false,
    ARRAY['Tax residency certificate', 'Beneficial ownership declaration'],
    ARRAY['Certificate of residence', 'DGT form'], true
),
('USA', 0.10, 0.10, 0.10, false,
    ARRAY['Tax residency certificate', 'Beneficial ownership declaration'],
    ARRAY['Certificate of residence', 'DGT form'], true
)
ON CONFLICT DO NOTHING;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE property_listings IS 'Scraped property listings from various sources';
COMMENT ON TABLE property_market_data IS 'Time-series market data per area';
COMMENT ON TABLE property_due_diligence IS 'Due diligence reports for properties';
COMMENT ON TABLE property_legal_structures IS 'Legal structure options for property ownership';
COMMENT ON TABLE tax_optimization_strategies IS 'Tax optimization strategies and eligibility';
COMMENT ON TABLE tax_audit_risk_factors IS 'Factors contributing to tax audit risk';
COMMENT ON TABLE company_profiles IS 'Company profiles for tax analysis';
COMMENT ON TABLE tax_treaty_benefits IS 'Tax treaty benefits by country';

-- ========================================
-- END OF MIGRATION
-- ========================================
