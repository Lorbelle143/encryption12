-- NBSC Guidance Counseling - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Create folders table (replaces forms table)
CREATE TABLE folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  folder_name TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED')),
  notes TEXT,
  file_count INTEGER NOT NULL DEFAULT 0,
  file_urls TEXT[] NOT NULL DEFAULT '{}',
  folder_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create storage bucket for office forms
INSERT INTO storage.buckets (id, name, public)
VALUES ('office-forms', 'office-forms', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Allow public access to upload files
CREATE POLICY "Public can upload files"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'office-forms');

-- Allow public access to view files
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'office-forms');

-- Allow public access to delete files
CREATE POLICY "Public can delete files"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'office-forms');

-- ============================================
-- ROW LEVEL SECURITY - FOLDERS TABLE
-- ============================================

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Allow public to view all folders
CREATE POLICY "Public can view all folders"
ON folders FOR SELECT
TO public
USING (true);

-- Allow public to insert folders
CREATE POLICY "Public can insert folders"
ON folders FOR INSERT
TO public
WITH CHECK (true);

-- Allow public to update folders
CREATE POLICY "Public can update folders"
ON folders FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow public to delete folders
CREATE POLICY "Public can delete folders"
ON folders FOR DELETE
TO public
USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for folders table
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SETUP INSTRUCTIONS
-- ============================================

-- STEP 1: Run all the SQL above in your Supabase SQL Editor
-- STEP 2: Set your master key in .env file:
--         VITE_MASTER_KEY=your-secure-password-here
-- STEP 3: Login with your master key and start uploading folders!
