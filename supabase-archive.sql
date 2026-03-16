-- Run this in your Supabase SQL Editor to add archive support

ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
