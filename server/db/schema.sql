CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mudancas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mudanca_id INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  materials_description TEXT NOT NULL DEFAULT '',
  service_cost REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
  selected INTEGER NOT NULL DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  provider TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mudanca_id) REFERENCES mudancas(id)
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mudanca_id INTEGER NOT NULL DEFAULT 1,
  service_id INTEGER,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  estimated_price REAL NOT NULL DEFAULT 0,
  actual_price REAL,
  purchased INTEGER NOT NULL DEFAULT 0,
  purchase_date TEXT,
  supplier TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mudanca_id) REFERENCES mudancas(id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_services_mudanca ON services(mudanca_id);
CREATE INDEX IF NOT EXISTS idx_shopping_mudanca ON shopping_items(mudanca_id);
CREATE INDEX IF NOT EXISTS idx_shopping_service ON shopping_items(service_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
