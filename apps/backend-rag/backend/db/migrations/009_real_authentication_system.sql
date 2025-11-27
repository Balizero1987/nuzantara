-- Migration: Real Authentication System (DEPRECATED)
-- Purpose: This migration was originally for 'users' table, but the codebase uses 'team_members'
-- Status: DEPRECATED - Do not use. Use migration 010_fix_team_members_schema.sql instead
-- Created: 2025-01-22
-- Updated: 2025-01-22 - Marked as deprecated

-- NOTE: This migration modifies the 'users' table, but the codebase uses 'team_members'
-- All authentication logic is now in migration 010_fix_team_members_schema.sql
-- This file is kept for reference only and should not be executed

BEGIN;

-- This migration is deprecated. The authentication system uses team_members table.
-- See migration 010_fix_team_members_schema.sql for the correct implementation.

RAISE NOTICE 'Migration 009 is deprecated. Use migration 010_fix_team_members_schema.sql instead.';

COMMIT;
