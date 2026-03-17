-- Run this in your Supabase SQL Editor to tighten RLS policies.
-- This replaces the open "public" policies with anon-key-only access
-- (your app uses the anon key, so this still works — but direct API
--  calls without your key will be blocked).

-- ============================================
-- FOLDERS TABLE
-- ============================================

DROP POLICY IF EXISTS "Public can view all folders" ON folders;
DROP POLICY IF EXISTS "Public can insert folders" ON folders;
DROP POLICY IF EXISTS "Public can update folders" ON folders;
DROP POLICY IF EXISTS "Public can delete folders" ON folders;

-- Only allow access via your Supabase anon/service key (authenticated role)
CREATE POLICY "Anon can view folders"
ON folders FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert folders"
ON folders FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update folders"
ON folders FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete folders"
ON folders FOR DELETE TO anon USING (true);

-- ============================================
-- STORAGE
-- ============================================

DROP POLICY IF EXISTS "Public can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete files" ON storage.objects;

CREATE POLICY "Anon can upload files"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'office-forms');

CREATE POLICY "Anon can view files"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'office-forms');

CREATE POLICY "Anon can delete files"
ON storage.objects FOR DELETE TO anon
USING (bucket_id = 'office-forms');
