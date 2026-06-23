-- Migration 0002: multi-user support.
-- Adds a users table, scopes transactions & categories to a user_id, and moves
-- all pre-existing (single-user) data under a demo account so nothing is lost.

----------------------------------------------------------------------
-- Users
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Demo account that owns any data created before multi-user.
-- Email: demo@example.com  /  Password: demo1234
INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
VALUES (
  'demo-user',
  'demo@example.com',
  'pbkdf2$100000$nDQMlUvAU_Vc38V0uIqKPw$yuw2fcqOo9xZK558tu_BY9zhl6wzPCEH22uToRPEms4',
  1749000000000,
  1749000000000
);

----------------------------------------------------------------------
-- Transactions: add user_id, backfill existing rows to the demo user
----------------------------------------------------------------------
ALTER TABLE transactions ADD COLUMN user_id TEXT;
UPDATE transactions SET user_id = 'demo-user' WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions(user_id, transaction_date);

----------------------------------------------------------------------
-- Categories: rebuild so uniqueness is per-user (user_id, type, name)
----------------------------------------------------------------------
CREATE TABLE categories_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (user_id, type, name)
);

INSERT INTO categories_new
  (id, user_id, type, name, icon, sort_order, created_at, updated_at)
SELECT id, 'demo-user', type, name, icon, sort_order, created_at, updated_at
FROM categories;

DROP TABLE categories;
ALTER TABLE categories_new RENAME TO categories;

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);