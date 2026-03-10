-- Add quantity column to shopping_items
ALTER TABLE shopping_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
