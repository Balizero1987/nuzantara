-- ================================================
-- Migration 012: Fix Production Schema Issues
-- Created: 2025-11-30
-- Fixes: Missing conversation_id column in interactions table
-- ================================================

-- First, check if the column already exists (idempotent migration)
DO $$
BEGIN
    -- Add conversation_id column to interactions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'interactions'
        AND column_name = 'conversation_id'
    ) THEN
        ALTER TABLE interactions
        ADD COLUMN conversation_id INT REFERENCES conversations(id) ON DELETE SET NULL;

        -- Add index for the new column
        CREATE INDEX IF NOT EXISTS idx_interactions_conversation_id ON interactions(conversation_id);

        RAISE NOTICE 'Added conversation_id column to interactions table';
    ELSE
        RAISE NOTICE 'conversation_id column already exists in interactions table';
    END IF;
END $$;

-- ================================================
-- Fix 2: Ambiguous user_id in auto_logout_expired_sessions function
-- ================================================

-- Recreate function with explicit table aliases to avoid ambiguous column references
CREATE OR REPLACE FUNCTION auto_logout_expired_sessions()
RETURNS TABLE(user_id VARCHAR, email VARCHAR, clock_in_time TIMESTAMPTZ, auto_logout_time TIMESTAMPTZ) AS $$
BEGIN
    -- Find users who clocked in but didn't clock out, and it's past 18:30 Bali time
    RETURN QUERY
    WITH latest_actions AS (
        SELECT DISTINCT ON (t.user_id)
            t.user_id,
            t.email,
            t.timestamp,
            t.action_type
        FROM team_timesheet t
        ORDER BY t.user_id, t.timestamp DESC
    ),
    expired_sessions AS (
        SELECT
            la.user_id,
            la.email,
            la.timestamp as clock_in_time,
            (DATE(la.timestamp AT TIME ZONE 'Asia/Makassar') + TIME '18:30:00') AT TIME ZONE 'Asia/Makassar' as target_logout
        FROM latest_actions la
        WHERE la.action_type = 'clock_in'
          AND NOW() AT TIME ZONE 'Asia/Makassar' > (DATE(la.timestamp AT TIME ZONE 'Asia/Makassar') + TIME '18:30:00')
    ),
    inserted AS (
        INSERT INTO team_timesheet (user_id, email, action_type, timestamp, notes)
        SELECT
            es.user_id,
            es.email,
            'clock_out',
            es.target_logout,
            'Auto-logout at 18:30 Bali time'
        FROM expired_sessions es
        RETURNING team_timesheet.user_id, team_timesheet.email, team_timesheet.timestamp
    )
    SELECT
        i.user_id::VARCHAR,
        i.email::VARCHAR,
        es.clock_in_time,
        i.timestamp as auto_logout_time
    FROM inserted i
    JOIN expired_sessions es ON es.user_id = i.user_id;  -- Fixed: explicit table aliases
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- Verification
-- ================================================

-- Verify conversation_id fix
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'interactions'
            AND column_name = 'conversation_id'
        ) THEN 'SUCCESS: conversation_id column exists'
        ELSE 'ERROR: conversation_id column missing'
    END AS conversation_id_check;

-- Verify function recreation
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = 'auto_logout_expired_sessions'
        ) THEN 'SUCCESS: auto_logout_expired_sessions function exists'
        ELSE 'ERROR: auto_logout_expired_sessions function missing'
    END AS function_check;
