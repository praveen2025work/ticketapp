-- =============================================================================
-- Migration: Additional Oracle indexes for performance
-- Run once on existing Oracle DBs that were created with init-oracle.sql
-- before these indexes were added. Safe to run multiple times only if you
-- first check that the index does not exist (Oracle has no IF NOT EXISTS for indexes).
-- =============================================================================

-- Resolved-date range queries (dashboard period metrics, count resolved)
CREATE INDEX idx_fast_problem_resolved_date ON fast_problem(resolved_date);

-- Sort by "last updated" on ticket list
CREATE INDEX idx_fast_problem_updated_date ON fast_problem(updated_date);

-- Assignee filter / "my tickets" and assignee lookups
CREATE INDEX idx_fast_problem_assigned_to ON fast_problem(assigned_to);

COMMIT;
