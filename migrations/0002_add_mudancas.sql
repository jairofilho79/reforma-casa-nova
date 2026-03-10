-- Create mudancas table
CREATE TABLE IF NOT EXISTS mudancas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default mudanca for existing data
INSERT INTO mudancas (id, name) VALUES (1, 'Reforma Casa Nova');

-- Add mudanca_id to services (existing rows get default 1)
ALTER TABLE services ADD COLUMN mudanca_id INTEGER NOT NULL DEFAULT 1;

-- Add mudanca_id to shopping_items (existing rows get default 1)
ALTER TABLE shopping_items ADD COLUMN mudanca_id INTEGER NOT NULL DEFAULT 1;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_services_mudanca ON services(mudanca_id);
CREATE INDEX IF NOT EXISTS idx_shopping_mudanca ON shopping_items(mudanca_id);
