-- Add priority field (1-5 scale, 1=lowest, 5=highest)
ALTER TABLE fast_problem ADD COLUMN priority INTEGER DEFAULT 3;
