-- Migration: Real Authentication System
-- Purpose: Add password hashing and authentication fields to users table
-- Replaces mock authentication with real email/password login
-- Created: 2025-01-22
-- Dependencies: 002_memory_system_schema.sql (users table)

BEGIN;

-- Add authentication fields to users table if they don't exist
DO $$
BEGIN
    -- Check and add pin_hash column (PIN codes instead of passwords)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'pin_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN pin_hash VARCHAR(255);
        RAISE NOTICE 'Added pin_hash column to users table';
    END IF;

    -- Check and add salt column (for additional security)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'salt'
    ) THEN
        ALTER TABLE users ADD COLUMN salt VARCHAR(32);
        RAISE NOTICE 'Added salt column to users table';
    END IF;

    -- Check and add role column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'member';
        RAISE NOTICE 'Added role column to users table';
    END IF;

    -- Check and add status column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column to users table';
    END IF;

    -- Check and add last_login column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login column to users table';
    END IF;
END $$;

-- Create indexes for authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create authentication sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- Insert default admin user (Zainal - CEO)
INSERT INTO users (
    id, email, name, password_hash, salt, role, status, metadata, created_at, updated_at
) VALUES (
    'admin-zainal-001',
    'zainal.ceo@zantara.com',
    'Zainal',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', -- password: Zantara123!
    '9b2e8c7f6a5d4b3c2a1f0e9d8c7b6a5d', -- salt
    'admin',
    'active',
    '{"language": "id", "department": "executive", "title": "CEO"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert default team member accounts
INSERT INTO users (
    id, email, name, password_hash, salt, role, status, metadata, created_at, updated_at
) VALUES
(
    'user-ari-001',
    'ari@zantara.com',
    'Ari',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', -- password: Zantara123!
    '9b2e8c7f6a5d4b3c2a1f0e9d8c7b6a5d',
    'member',
    'active',
    '{"language": "id", "department": "operations", "title": "Operations Manager"}',
    NOW(),
    NOW()
),
(
    'user-made-001',
    'made@zantara.com',
    'Made',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', -- password: Zantara123!
    '9b2e8c7f6a5d4b3c2a1f0e9d8c7b6a5d',
    'member',
    'active',
    '{"language": "id", "department": "customer_service", "title": "Customer Service"}',
    NOW(),
    NOW()
),
(
    'user-ketut-001',
    'ketut@zantara.com',
    'Ketut',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', -- password: Zantara123!
    '9b2e8c7f6a5d4b3c2a1f0e9d8c7b6a5d',
    'member',
    'active',
    '{"language": "id", "department": "support", "title": "Support Specialist"}',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with real authentication (email/password)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash of user password';
COMMENT ON COLUMN users.salt IS 'Deprecated: Using bcrypt which includes salt';
COMMENT ON COLUMN users.role IS 'User role: admin, member, guest';
COMMENT ON COLUMN users.status IS 'Account status: active, inactive, suspended';
COMMENT ON COLUMN users.last_login IS 'Last successful login timestamp';
COMMENT ON TABLE auth_sessions IS 'JWT session tracking for security';

COMMIT;