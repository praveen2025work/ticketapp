-- Fix priority data: ensure all values are between 1-5
UPDATE fast_problem SET priority = 3 WHERE priority IS NULL OR priority < 1 OR priority > 5;

-- Add Confluence link for audit/further details
ALTER TABLE fast_problem ADD COLUMN confluence_link VARCHAR(500);
