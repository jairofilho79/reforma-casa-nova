-- Add start_date and end_date
ALTER TABLE services ADD COLUMN start_date TEXT;
ALTER TABLE services ADD COLUMN end_date TEXT;

-- We intentionally DO NOT drop the time_spent_hours column because sqlite ALTER TABLE DROP COLUMN has limited support and is error-prone. We will just ignore it.
