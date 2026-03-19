-- Settings table for master password hash storage
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing policies if any, then recreate
DROP POLICY IF EXISTS "Allow select settings" ON settings;
DROP POLICY IF EXISTS "Allow insert settings" ON settings;
DROP POLICY IF EXISTS "Allow update settings" ON settings;
DROP POLICY IF EXISTS "Allow read settings" ON settings;

-- Disable RLS entirely — this table only stores hashes, never plaintext
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
