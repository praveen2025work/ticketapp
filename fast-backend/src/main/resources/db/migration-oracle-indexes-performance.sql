-- =============================================================================
-- Migration: Additional Oracle indexes for performance
-- Run once on existing Oracle DBs that were created with init-oracle.sql
-- before these indexes were added. Safe to run multiple times only if you
-- first check that the index does not exist (Oracle has no IF NOT EXISTS for indexes).
-- =============================================================================

-- Resolved-date range queries (dashboard period metrics, count resolved)
CREATE INDEX idx_fast_problem_resolved_date ON fast_problem(resolved_date);

-- Core filters/sorts used by dashboards and schedulers
CREATE INDEX idx_fast_problem_status ON fast_problem(status);
CREATE INDEX idx_fast_problem_rag_status ON fast_problem(rag_status);
CREATE INDEX idx_fast_problem_created_date ON fast_problem(created_date);

-- Sort by "last updated" on ticket list
CREATE INDEX idx_fast_problem_updated_date ON fast_problem(updated_date);

-- Assignee filter / "my tickets" and assignee lookups
CREATE INDEX idx_fast_problem_assigned_to ON fast_problem(assigned_to);

-- Latest comment lookup per ticket (daily commentary checks)
CREATE INDEX idx_ticket_comment_problem_created ON ticket_comment(fast_problem_id, created_date);

COMMIT;
