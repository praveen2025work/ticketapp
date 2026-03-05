-- Migration: add extended interview entry capture columns.
-- Run on existing H2 or Oracle DBs where interview_schedule_entry already exists.

-- H2
ALTER TABLE interview_schedule_entry ADD COLUMN IF NOT EXISTS applications_used CLOB;
ALTER TABLE interview_schedule_entry ADD COLUMN IF NOT EXISTS process_improvements CLOB;
ALTER TABLE interview_schedule_entry ADD COLUMN IF NOT EXISTS tech_issues_to_resolve CLOB;
ALTER TABLE interview_schedule_entry ADD COLUMN IF NOT EXISTS ticket_raised CLOB;

-- Oracle (run separately):
-- ALTER TABLE interview_schedule_entry ADD (applications_used CLOB);
-- ALTER TABLE interview_schedule_entry ADD (process_improvements CLOB);
-- ALTER TABLE interview_schedule_entry ADD (tech_issues_to_resolve CLOB);
-- ALTER TABLE interview_schedule_entry ADD (ticket_raised CLOB);
-- COMMIT;
