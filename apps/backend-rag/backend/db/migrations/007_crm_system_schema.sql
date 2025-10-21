-- ================================================
-- ZANTARA CRM SYSTEM - Full Schema
-- Migration 007: Team-wide organizational memory
-- Created: 2025-10-21
-- ================================================

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. TEAM MEMBERS
-- ================================================
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(100), -- 'admin', 'agent', 'manager'
    phone VARCHAR(50),
    active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}'::jsonb, -- flexible permissions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);

-- ================================================
-- 2. CLIENTS (Anagrafica Clienti)
-- ================================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,

    -- Basic Info
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    nationality VARCHAR(100),
    passport_number VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'prospect'
    client_type VARCHAR(50) DEFAULT 'individual', -- 'individual', 'company'

    -- Assignment
    assigned_to VARCHAR(255), -- email of team member
    first_contact_date TIMESTAMP WITH TIME ZONE,
    last_interaction_date TIMESTAMP WITH TIME ZONE,

    -- Additional Data
    address TEXT,
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb, -- ['vip', 'urgent', 'recurring']
    custom_fields JSONB DEFAULT '{}'::jsonb, -- flexible data

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255), -- team member email

    -- Constraints
    CONSTRAINT clients_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_uuid ON clients(uuid);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);

-- ================================================
-- 3. PRACTICE TYPES (Tipi di Pratiche)
-- ================================================
CREATE TABLE IF NOT EXISTS practice_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'KITAS', 'PT_PMA', 'INVESTOR_VISA'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'visa', 'company', 'tax', 'property'
    description TEXT,
    base_price DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'IDR',
    duration_days INT, -- typical processing time
    required_documents JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_types_code ON practice_types(code);
CREATE INDEX IF NOT EXISTS idx_practice_types_category ON practice_types(category);

-- Insert default Bali Zero services
INSERT INTO practice_types (code, name, category, base_price, currency, duration_days, required_documents) VALUES
('KITAS', 'KITAS (Limited Stay Permit)', 'visa', 15000000, 'IDR', 90, '["Passport", "Sponsor Letter", "Photos"]'),
('PT_PMA', 'PT PMA (Foreign Investment Company)', 'company', 25000000, 'IDR', 120, '["Business Plan", "Shareholder IDs", "NIB"]'),
('INVESTOR_VISA', 'Investor Visa', 'visa', 12000000, 'IDR', 60, '["Investment Proof", "Passport", "Bank Statement"]'),
('RETIREMENT_VISA', 'Retirement Visa', 'visa', 10000000, 'IDR', 45, '["Age Proof (55+)", "Pension Proof", "Passport"]'),
('NPWP', 'NPWP (Tax ID)', 'tax', 500000, 'IDR', 14, '["ID/Passport", "KITAS", "Address Proof"]'),
('BPJS', 'BPJS (Health Insurance)', 'tax', 300000, 'IDR', 7, '["NPWP", "KITAS", "Photos"]'),
('IMTA', 'IMTA (Work Permit)', 'visa', 8000000, 'IDR', 60, '["KITAS", "Employment Contract", "Company Docs"]')
ON CONFLICT (code) DO NOTHING;

-- ================================================
-- 4. PRACTICES (Pratiche in Corso/Completate)
-- ================================================
CREATE TABLE IF NOT EXISTS practices (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,

    -- Relations
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    practice_type_id INT NOT NULL REFERENCES practice_types(id),

    -- Status Tracking
    status VARCHAR(50) DEFAULT 'inquiry',
    -- 'inquiry', 'quotation_sent', 'payment_pending', 'in_progress',
    -- 'waiting_documents', 'submitted_to_gov', 'approved', 'completed', 'cancelled'

    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

    -- Dates
    inquiry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    expiry_date DATE, -- for renewable services (KITAS, visas)
    next_renewal_date DATE, -- calculated reminder

    -- Financial
    quoted_price DECIMAL(12,2),
    actual_price DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'IDR',
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'refunded'
    paid_amount DECIMAL(12,2) DEFAULT 0,

    -- Assignment
    assigned_to VARCHAR(255), -- team member email

    -- Documents
    documents JSONB DEFAULT '[]'::jsonb, -- Array of {name, drive_file_id, uploaded_at, status}
    missing_documents JSONB DEFAULT '[]'::jsonb, -- Array of document names still needed

    -- Notes & Custom
    notes TEXT,
    internal_notes TEXT, -- visible only to team
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_practices_client_id ON practices(client_id);
CREATE INDEX IF NOT EXISTS idx_practices_practice_type_id ON practices(practice_type_id);
CREATE INDEX IF NOT EXISTS idx_practices_status ON practices(status);
CREATE INDEX IF NOT EXISTS idx_practices_assigned_to ON practices(assigned_to);
CREATE INDEX IF NOT EXISTS idx_practices_expiry_date ON practices(expiry_date);
CREATE INDEX IF NOT EXISTS idx_practices_next_renewal_date ON practices(next_renewal_date);
CREATE INDEX IF NOT EXISTS idx_practices_uuid ON practices(uuid);

-- ================================================
-- 5. INTERACTIONS (Team-Client Communications)
-- ================================================
CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,

    -- Relations
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    practice_id INT REFERENCES practices(id) ON DELETE SET NULL,
    conversation_id INT REFERENCES conversations(id) ON DELETE SET NULL,

    -- Interaction Details
    interaction_type VARCHAR(50) NOT NULL, -- 'chat', 'email', 'whatsapp', 'call', 'meeting', 'note'
    channel VARCHAR(50), -- 'web_chat', 'gmail', 'whatsapp', 'phone', 'in_person'

    -- Content
    subject VARCHAR(500),
    summary TEXT, -- AI-generated summary
    full_content TEXT, -- full conversation/message
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative', 'urgent'

    -- Participants
    team_member VARCHAR(255), -- who handled this interaction
    direction VARCHAR(20), -- 'inbound', 'outbound'

    -- AI Extraction
    extracted_entities JSONB DEFAULT '{}'::jsonb, -- {names: [], dates: [], amounts: [], intents: []}
    action_items JSONB DEFAULT '[]'::jsonb, -- [{task: "Send quote", due: "2025-10-25", status: "pending"}]

    -- Metadata
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INT, -- for calls/meetings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_practice_id ON interactions(practice_id);
CREATE INDEX IF NOT EXISTS idx_interactions_conversation_id ON interactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_interactions_team_member ON interactions(team_member);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(interaction_date DESC);

-- ================================================
-- 6. DOCUMENTS (Tracking Document Status)
-- ================================================
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,

    -- Relations
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    practice_id INT REFERENCES practices(id) ON DELETE CASCADE,

    -- Document Info
    document_type VARCHAR(100) NOT NULL, -- 'passport', 'sponsor_letter', 'nib', etc.
    file_name VARCHAR(255),

    -- Storage
    storage_type VARCHAR(50), -- 'google_drive', 'local', 's3'
    file_id VARCHAR(500), -- Google Drive file ID or S3 key
    file_url TEXT,
    file_size_kb INT,
    mime_type VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'received', 'verified', 'rejected', 'expired'
    uploaded_by VARCHAR(255), -- client email or team member
    verified_by VARCHAR(255), -- team member who verified
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Expiry (for passports, etc)
    expiry_date DATE,

    -- Notes
    notes TEXT,
    rejection_reason TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_practice_id ON documents(practice_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- ================================================
-- 7. RENEWAL ALERTS (Automatic Expiry Tracking)
-- ================================================
CREATE TABLE IF NOT EXISTS renewal_alerts (
    id SERIAL PRIMARY KEY,

    -- Relations
    practice_id INT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Alert Details
    alert_type VARCHAR(50) NOT NULL, -- 'renewal_due', 'document_expiry', 'payment_due'
    description TEXT,

    -- Dates
    target_date DATE NOT NULL, -- when the thing expires/is due
    alert_date DATE NOT NULL, -- when to send alert (e.g., 60 days before)

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'dismissed', 'completed'
    sent_at TIMESTAMP WITH TIME ZONE,

    -- Notification
    notify_team_member VARCHAR(255),
    notify_client BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_renewal_alerts_practice_id ON renewal_alerts(practice_id);
CREATE INDEX IF NOT EXISTS idx_renewal_alerts_client_id ON renewal_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_renewal_alerts_status ON renewal_alerts(status);
CREATE INDEX IF NOT EXISTS idx_renewal_alerts_alert_date ON renewal_alerts(alert_date);

-- ================================================
-- 8. CRM SETTINGS (Configuration & Metadata)
-- ================================================
CREATE TABLE IF NOT EXISTS crm_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- Default settings
INSERT INTO crm_settings (key, value, description) VALUES
('renewal_alert_days', '60', 'Days before expiry to send renewal alerts'),
('auto_assign_enabled', 'true', 'Automatically assign new inquiries to team members'),
('default_currency', '"IDR"', 'Default currency for pricing'),
('business_hours', '{"start": "09:00", "end": "18:00", "timezone": "Asia/Makassar"}', 'Business hours for SLA tracking')
ON CONFLICT (key) DO NOTHING;

-- ================================================
-- 9. ACTIVITY LOG (Audit Trail)
-- ================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,

    -- What happened
    entity_type VARCHAR(50) NOT NULL, -- 'client', 'practice', 'interaction', 'document'
    entity_id INT NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed'

    -- Who did it
    performed_by VARCHAR(255) NOT NULL, -- team member email

    -- Details
    changes JSONB, -- {"field": "status", "old_value": "inquiry", "new_value": "in_progress"}
    description TEXT,

    -- When
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_performed_by ON activity_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(performed_at DESC);

-- ================================================
-- 10. TRIGGERS (Auto-update timestamps)
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 11. VIEWS (Common Queries)
-- ================================================

-- Active practices with client info
CREATE OR REPLACE VIEW active_practices_view AS
SELECT
    p.id,
    p.uuid,
    p.status,
    p.priority,
    pt.name as practice_type,
    pt.category,
    c.full_name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    p.assigned_to,
    p.start_date,
    p.expiry_date,
    p.actual_price,
    p.payment_status
FROM practices p
JOIN clients c ON p.client_id = c.id
JOIN practice_types pt ON p.practice_type_id = pt.id
WHERE p.status NOT IN ('completed', 'cancelled');

-- Upcoming renewals (next 90 days)
CREATE OR REPLACE VIEW upcoming_renewals_view AS
SELECT
    p.id,
    p.uuid,
    pt.name as practice_type,
    c.full_name as client_name,
    c.email as client_email,
    p.expiry_date,
    p.expiry_date - CURRENT_DATE as days_until_expiry,
    p.assigned_to
FROM practices p
JOIN clients c ON p.client_id = c.id
JOIN practice_types pt ON p.practice_type_id = pt.id
WHERE p.expiry_date IS NOT NULL
  AND p.expiry_date > CURRENT_DATE
  AND p.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
  AND p.status = 'completed'
ORDER BY p.expiry_date ASC;

-- Client summary with practice counts
CREATE OR REPLACE VIEW client_summary_view AS
SELECT
    c.id,
    c.uuid,
    c.full_name,
    c.email,
    c.phone,
    c.status,
    c.assigned_to,
    c.first_contact_date,
    c.last_interaction_date,
    COUNT(DISTINCT p.id) as total_practices,
    COUNT(DISTINCT CASE WHEN p.status IN ('inquiry', 'in_progress', 'waiting_documents', 'submitted_to_gov') THEN p.id END) as active_practices,
    COUNT(DISTINCT i.id) as total_interactions,
    MAX(i.interaction_date) as last_interaction
FROM clients c
LEFT JOIN practices p ON c.id = p.client_id
LEFT JOIN interactions i ON c.id = i.client_id
GROUP BY c.id;

-- ================================================
-- COMPLETED: CRM Schema v1.0
-- ================================================

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_backend_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_backend_user;
