-- Run this in Supabase SQL Editor
-- Adds archived_file_urls column to track soft-deleted individual files

ALTER TABLE folders ADD COLUMN IF NOT EXISTS archived_file_urls TEXT[] NOT NULL DEFAULT '{}';
