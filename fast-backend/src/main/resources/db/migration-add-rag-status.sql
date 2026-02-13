-- Migration: add rag_status to fast_problem (RAG escalation: G/A/R).
-- Run this on existing databases created before RAG was added.
-- H2:
ALTER TABLE fast_problem ADD COLUMN IF NOT EXISTS rag_status VARCHAR(5) DEFAULT 'G';
CREATE INDEX IF NOT EXISTS idx_fast_problem_rag_status ON fast_problem(rag_status);
-- Oracle (uncomment and run separately if using Oracle):
-- ALTER TABLE fast_problem ADD rag_status VARCHAR2(5) DEFAULT 'G';
-- CREATE INDEX idx_fast_problem_rag_status ON fast_problem(rag_status);
