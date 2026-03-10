-- Add supplier to shopping_items
ALTER TABLE shopping_items ADD COLUMN supplier TEXT NOT NULL DEFAULT '';

-- Add provider to services
ALTER TABLE services ADD COLUMN provider TEXT NOT NULL DEFAULT '';
