-- Add custom_names column to folders table
-- This stores display name overrides for individual files
-- Format: { "original/storage/path.pdf": "My Custom Name.pdf" }

ALTER TABLE folders
ADD COLUMN IF NOT EXISTS custom_names JSONB DEFAULT '{}';
