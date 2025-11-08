-- Enable pg_stat_statements extension for performance monitoring
-- Required by Performance Optimizer agent

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Grant necessary permissions
GRANT SELECT ON pg_stat_statements TO CURRENT_USER;

-- Reset stats for clean start
SELECT pg_stat_statements_reset();

-- Verify installation
SELECT installed_version
FROM pg_available_extensions
WHERE name = 'pg_stat_statements';

-- Show current settings
SHOW shared_preload_libraries;
SHOW pg_stat_statements.track;

-- Notes:
-- If shared_preload_libraries doesn't include 'pg_stat_statements',
-- you need to add it to postgresql.conf and restart PostgreSQL:
--
-- shared_preload_libraries = 'pg_stat_statements'
-- pg_stat_statements.track = all
--
-- Then restart:
-- sudo systemctl restart postgresql
