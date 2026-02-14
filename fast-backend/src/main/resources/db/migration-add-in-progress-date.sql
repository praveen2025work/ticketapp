-- Migration: Add in_progress_date for SLA calculation (SLA starts when status moves to IN_PROGRESS from ACCEPTED).
-- Run on existing H2 or Oracle DBs. New installs use init-h2.sql / init-oracle.sql.

-- H2
ALTER TABLE fast_problem ADD COLUMN IF NOT EXISTS in_progress_date TIMESTAMP;

-- Oracle (uncomment if using Oracle)
-- ALTER TABLE fast_problem ADD (in_progress_date TIMESTAMP);
