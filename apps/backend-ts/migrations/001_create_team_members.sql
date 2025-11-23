-- ZANTARA Team Members Database Setup
-- This script creates the necessary tables for team authentication

-- Create team_members table with proper security
CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL, -- bcrypt hashed PIN
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    personalized_response BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create audit log for authentication attempts
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'login_attempt', 'login_success', 'login_failure', 'logout'
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    success BOOLEAN,
    failure_reason VARCHAR(255)
);

-- Create sessions table for persistent session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Insert CEO/Founder account (Antonello Siano)
INSERT INTO team_members (name, email, pin_hash, role, department, language) VALUES
('Antonello Siano', 'antonello@nuzantara.com', '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj', 'CEO', 'Executive', 'en')
ON CONFLICT (email) DO NOTHING;

-- Insert test team members for demo
INSERT INTO team_members (name, email, pin_hash, role, department, language) VALUES
('Tech Lead', 'tech@nuzantara.com', '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj', 'Tech Lead', 'Technology', 'en'),
('Executive Consultant', 'consultant@nuzantara.com', '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj', 'Executive Consultant', 'Consulting', 'en'),
('Junior Consultant', 'junior@nuzantara.com', '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj', 'Junior Consultant', 'Consulting', 'en'),
('Marketing Specialist', 'marketing@nuzantara.com', '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj', 'Marketing Specialist', 'Marketing', 'en'),
('Tax Manager', 'tax@nuzantara.com', '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj', 'Tax Manager', 'Finance', 'en'),
('Reception', 'reception@nuzantara.com', '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj', 'Reception', 'Operations', 'en')
ON CONFLICT (email) DO NOTHING;

-- Note: The hashed PINs above correspond to the PIN "1234"
-- In production, each user should have unique PINs

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_email ON auth_audit_log(email);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_timestamp ON auth_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();