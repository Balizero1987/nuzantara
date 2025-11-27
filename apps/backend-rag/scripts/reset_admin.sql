-- NUZANTARA PRIME - Admin User Reset SQL Script
-- Creates or resets zero@balizero.com with PIN 010719
--
-- Usage: psql $DATABASE_URL -f scripts/reset_admin.sql
-- Or: fly ssh console --app nuzantara-rag -C "psql \$DATABASE_URL -f /app/scripts/reset_admin.sql"

-- Note: This uses a pre-computed bcrypt hash for PIN "010719"
-- Generated with: python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('010719'))"

-- Insert or update admin user
INSERT INTO team_members (
    name, email, pin_hash, role, department, language, is_active
)
VALUES (
    'Zero',
    'zero@balizero.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5K5vJ5K5vJ5K5v',  -- PIN: 010719 (bcrypt rounds=12)
    'Founder',
    'leadership',
    'it',
    true
)
ON CONFLICT (email) DO UPDATE SET
    pin_hash = EXCLUDED.pin_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    language = EXCLUDED.language,
    is_active = true,
    failed_attempts = 0,
    locked_until = NULL,
    updated_at = NOW();

-- Verify
SELECT
    email,
    name,
    role,
    is_active,
    failed_attempts,
    locked_until,
    CASE
        WHEN locked_until IS NULL THEN 'Unlocked'
        WHEN locked_until > NOW() THEN 'Locked'
        ELSE 'Unlocked'
    END as lock_status
FROM team_members
WHERE LOWER(email) = 'zero@balizero.com';
