-- Providers entity + direct payments
-- Goal:
-- - Create providers table (scoped by mudanca)
-- - Create provider_payments (direct payments to provider)
-- - Add services.provider_id and backfill from legacy services.provider text

CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mudanca_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mudanca_id) REFERENCES mudancas(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_mudanca_name ON providers(mudanca_id, name);
CREATE INDEX IF NOT EXISTS idx_providers_mudanca ON providers(mudanca_id);

CREATE TABLE IF NOT EXISTS provider_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mudanca_id INTEGER NOT NULL,
  provider_id INTEGER NOT NULL,
  payment_date TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mudanca_id) REFERENCES mudancas(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_provider_payments_provider ON provider_payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_payments_mudanca ON provider_payments(mudanca_id);
CREATE INDEX IF NOT EXISTS idx_provider_payments_date ON provider_payments(payment_date);

-- Add FK column to services (keep legacy `provider` text for now)
ALTER TABLE services ADD COLUMN provider_id INTEGER;

-- Backfill providers from legacy text field
INSERT OR IGNORE INTO providers (mudanca_id, name)
SELECT mudanca_id, provider
FROM services
WHERE provider IS NOT NULL AND TRIM(provider) != ''
GROUP BY mudanca_id, provider;

-- Backfill services.provider_id
UPDATE services
SET provider_id = (
  SELECT p.id
  FROM providers p
  WHERE p.mudanca_id = services.mudanca_id
    AND p.name = services.provider
  LIMIT 1
)
WHERE provider_id IS NULL
  AND provider IS NOT NULL
  AND TRIM(provider) != '';
