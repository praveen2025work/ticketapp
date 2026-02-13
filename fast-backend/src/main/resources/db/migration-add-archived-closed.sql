-- Migration: Add archived and closed_date for archiving CLOSED tickets after 7 days.
-- Run on existing H2 or Oracle DBs. New installs use init-h2.sql / init-oracle.sql.
-- H2: backfill closed_date for existing CLOSED tickets (closed_date = resolved_date or updated_date)

-- H2
ALTER TABLE fast_problem ADD COLUMN IF NOT EXISTS closed_date TIMESTAMP;
ALTER TABLE fast_problem ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
UPDATE fast_problem SET closed_date = COALESCE(resolved_date, updated_date) WHERE status = 'CLOSED' AND closed_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_fast_problem_closed_date ON fast_problem(closed_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_archived ON fast_problem(archived);

-- Oracle (uncomment if using Oracle)
-- ALTER TABLE fast_problem ADD (closed_date TIMESTAMP);
-- ALTER TABLE fast_problem ADD (archived NUMBER(1) DEFAULT 0 NOT NULL);
-- ALTER TABLE fast_problem ADD CONSTRAINT chk_fast_problem_archived CHECK (archived IN (0, 1));
-- CREATE INDEX idx_fast_problem_closed_date ON fast_problem(closed_date);
-- CREATE INDEX idx_fast_problem_archived ON fast_problem(archived);
