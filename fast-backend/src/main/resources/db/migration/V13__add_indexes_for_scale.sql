-- Indexes for query performance as data grows (H2 / compatible with other DBs)

-- fast_problem: list/sort by created_date, filter by deleted
CREATE INDEX IF NOT EXISTS idx_fast_problem_created_date ON fast_problem(created_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_deleted ON fast_problem(deleted);
CREATE INDEX IF NOT EXISTS idx_fast_problem_deleted_created ON fast_problem(deleted, created_date);
CREATE INDEX IF NOT EXISTS idx_fast_problem_affected_app ON fast_problem(affected_application);

-- knowledge_article: list sort by created_date
CREATE INDEX IF NOT EXISTS idx_knowledge_created_date ON knowledge_article(created_date);

-- audit_log: already has fast_problem_id and timestamp; add composite for recent-by-problem
CREATE INDEX IF NOT EXISTS idx_audit_problem_timestamp ON audit_log(fast_problem_id, timestamp);

-- users: lookup by username (UNIQUE already indexes); optional for active filter
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
